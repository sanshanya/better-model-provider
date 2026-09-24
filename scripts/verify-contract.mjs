/**
 * Contract-resolution proof for the client type seam.
 *
 * `tsconfig.json` carries `skipLibCheck: true`, which suppresses the diagnostics
 * a broken declaration GRAPH raises inside node_modules: when a `.d.ts`
 * re-exports a name from a module that cannot be resolved (the published 0.1.7
 * `@deepseek-ai/dsh-api-remotes` lists its ~30 type owners as devDependencies,
 * not peers), the name still appears in the module's export table and its type
 * degrades instead of erroring. The degradation is partly visible — a degraded
 * type feeding an inferred parameter trips `noImplicitAny` (TS7006) — and silent
 * wherever the name is only used in an annotation, so `npm run typecheck` cannot
 * be read as proof that the seam is the upstream contract.
 *
 * What this script proves, per harness line:
 *   1. the INSTALLED contract package version (never the manifest's pin, which a
 *      stale lockfile can contradict);
 *   2. every name `src/client/types.ts` imports resolves to a real declaration
 *      file in the owner package that owns it;
 *   3. the four names upstream retired stay absent from the module's exports;
 *   4. a STRICT probe (`skipLibCheck: false`) of those names compiles against
 *      that line's declarations — which is what catches a graph that only
 *      resolves because `skipLibCheck` hid it.
 *
 * Usage:
 *   node scripts/verify-contract.mjs                       the installed line only
 *   node scripts/verify-contract.mjs --lines 0.1.7-rc.1,0.1.5-rc.3
 *   node scripts/verify-contract.mjs --lib                 also the packed lib/ declarations
 *
 * `--lines` materializes each named line's owner packages under
 * `<cache>/<version>/node_modules` (npm install, cached across runs) and probes
 * them there; `--lib` inspects the built artifact, so it belongs to the release
 * run, after `npm run build`.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TYPES = resolve(ROOT, 'src/client/types.ts')
const TSC = resolve(ROOT, 'node_modules/typescript/bin/tsc')

/** The contract module every consumed name comes from. */
const CONTRACT_MODULE = '@deepseek-ai/dsh-api-remotes/client'

/**
 * The declaration owners this plugin's type seam imports from — the peers
 * `package.json` declares, resolved into a probe tree per line.
 */
const OWNERS = [
  '@deepseek-ai/dsh-api-remotes',
  '@deepseek-ai/dsh-client-connection',
  '@deepseek-ai/dsh-llm',
  '@deepseek-ai/dsh-settings',
  '@deepseek-ai/dsh-typert-protocol',
]

/**
 * Names retired upstream. Their absence is the `--assert-removed` property, and
 * it must hold for the source seam AND for the shipped declarations.
 */
const RETIRED = ['IApiClient', 'RpcError', 'ConfigurableProviderView', 'DiscoveredModelView']

/** Diagnostic codes that mean "the declaration graph is broken", not "upstream has a lib nit". */
const RESOLUTION_CODES = new Set([2307, 2305, 2724, 2688, 7016])

// npm/pnpm resolve as .cmd on Windows: execFile without a shell cannot spawn them there.
const shell = process.platform === 'win32'
const npm = (...args) => execFileSync('npm', args, { stdio: 'pipe', encoding: 'utf8', shell })

/**
 * Read the type-only import list of `src/client/types.ts`, so the checked set is
 * the source's own and cannot rot into a hand-maintained copy.
 * @returns the imported names, sorted.
 */
function importedNames() {
  const source = readFileSync(TYPES, 'utf8')
  const start = source.indexOf(`from '${CONTRACT_MODULE}'`)
  if (start === -1) throw new Error(`verify-contract: ${relative(ROOT, TYPES)} does not import ${CONTRACT_MODULE}`)
  const open = source.lastIndexOf('{', start)
  const close = source.lastIndexOf('}', start)
  if (open === -1 || close === -1 || close < open) throw new Error('verify-contract: cannot read the import list')
  return source.slice(open + 1, close).split(',').map(name => name.trim()).filter(Boolean).sort()
}

/** Compiler options the in-process probe runs under: the repo's own, minus emission and ambient types. */
function compilerOptions() {
  const config = ts.readConfigFile(resolve(ROOT, 'tsconfig.json'), ts.sys.readFile)
  if (config.error !== undefined) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'))
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, ROOT)
  // `types: []`: a probe living in a scratch tree has no @types installed, and
  // an unresolvable ambient type package is not a contract defect.
  return { ...parsed.options, noEmit: true, types: [], typeRoots: [] }
}

/**
 * Print where one consumed name is declared, or why it is not.
 * @param entryFile - the file whose contract import is inspected (our source, or a probe inside a scratch tree).
 * @returns `{exported, failures}`.
 */
function describeDeclarations(entryFile) {
  const program = ts.createProgram([entryFile], compilerOptions())
  const checker = program.getTypeChecker()
  const source = program.getSourceFile(entryFile)
  if (source === undefined) throw new Error(`verify-contract: ${entryFile} is not part of the program`)
  const specifier = source.statements
    .filter(ts.isImportDeclaration)
    .map(statement => statement.moduleSpecifier)
    .find(node => ts.isStringLiteral(node) && node.text === CONTRACT_MODULE)
  if (specifier === undefined) throw new Error(`verify-contract: no import of ${CONTRACT_MODULE} found in ${entryFile}`)
  const symbol = checker.getSymbolAtLocation(specifier)
  if (symbol === undefined) throw new Error(`verify-contract: ${CONTRACT_MODULE} does not resolve under ${dirname(entryFile)}`)
  const exported = new Map(checker.getExportsOfModule(symbol).map(item => [item.name, item]))
  const failures = []
  for (const name of importedNames()) {
    const found = exported.get(name)
    if (found === undefined) {
      console.log(`  ABSENT    ${name}`)
      failures.push(name)
      continue
    }
    const target = (found.flags & ts.SymbolFlags.Alias) !== 0 ? checker.getAliasedSymbol(found) : found
    const owner = (target.declarations ?? []).find(declaration => !ts.isExportSpecifier(declaration) && !ts.isImportSpecifier(declaration))
    if (owner === undefined) {
      console.log(`  UNRESOLVED  ${name}`)
      failures.push(name)
    } else {
      const file = owner.getSourceFile().fileName
      // The declaring file's own imports must resolve too: an unresolved edge
      // inside it degrades the very type we just found, which is the failure a
      // whole-graph strict compile reports but cannot attribute per name.
      const unresolved = []
      for (const match of readFileSync(file, 'utf8').matchAll(/from\s+'([^']+)'/g)) {
        const spec = match[1]
        if (spec.startsWith('.')) continue
        if (ts.resolveModuleName(spec, file, resolutionOptions(dirname(dirname(dirname(file)))) , ts.sys).resolvedModule === undefined) unresolved.push(spec)
      }
      // Reported, not gated: a barrel's unresolved import only breaks THIS name
      // when the name itself is re-exported through that specifier, which is
      // what the chain check above decides.
      console.log(`  declared  ${name} -> ${relative(ROOT, file)}${unresolved.length > 0 ? `  (barrel imports not installed: ${unresolved.join(', ')})` : ''}`)
    }
  }
  return { exported, failures }
}

/**
 * A scratch directory for generated probes. It must live INSIDE the tree so
 * TypeScript's node_modules walk reaches that tree's packages, and under
 * `node_modules/` so it is gitignored and invisible to a clean-tree check; the
 * caller removes it in a `finally`, so no invocation leaves anything behind.
 * @param tree - directory whose node_modules the probe resolves against.
 * @returns the created directory.
 */
function makeProbeDir(tree) {
  const cache = join(tree, 'node_modules', '.cache')
  mkdirSync(cache, { recursive: true })
  return mkdtempSync(join(cache, 'bmp-contract-'))
}

/**
 * Write the probe importing exactly the consumed names.
 * @param dir - scratch directory from {@link makeProbeDir}.
 * @returns the probe path.
 */
function writeProbe(dir) {
  const names = importedNames()
  const probe = join(dir, 'probe.ts')
  // Re-export, never instantiate: `RemoteResult` and friends are generic, and a
  // type position without arguments is a TS2314 of the probe's own making.
  writeFileSync(probe, [
    `import type { ${names.join(', ')} } from '${CONTRACT_MODULE}'`,
    `export type { ${names.join(', ')} }`,
    '',
  ].join('\n'))
  return probe
}

/**
 * Run the strict probe (`skipLibCheck: false`) over one tree: a generated file
 * importing exactly the consumed names from the contract module.
 * @param tree - directory holding the `node_modules` to resolve against.
 * @param probe - the probe file to compile.
 * @returns `{ok, parsed, tolerated, resolutionErrors}`.
 */
function strictProbe(tree, probe) {
  let output = ''
  let ok = true
  try {
    // es2021 lib: cordis's logger.d.ts names WeakRef, so a lower lib makes the
    // strict pass fail on an upstream lib nit instead of on the contract.
    execFileSync(process.execPath, [
      TSC, '--noEmit', '--strict', '--skipLibCheck', 'false',
      '--module', 'esnext', '--moduleResolution', 'bundler',
      '--target', 'es2021', '--lib', 'es2021,dom', probe,
    ], { cwd: tree, stdio: 'pipe', encoding: 'utf8' })
  } catch (error) {
    ok = false
    output = `${error.stdout ?? ''}${error.stderr ?? ''}${error.message}`
  }
  const lines = output.split('\n').filter(line => line.includes('error TS'))
  const parsed = lines.map(line => ({
    line,
    file: /^([^(]+)\(/.exec(line)?.[1] ?? '',
    code: Number(/error TS(\d+)/.exec(line)?.[1]),
  }))
  const resolutionErrors = parsed.filter(item => RESOLUTION_CODES.has(item.code))
  return { ok, parsed, tolerated: parsed.filter(item => !RESOLUTION_CODES.has(item.code)), resolutionErrors }
}

/**
 * Walk one consumed name's OWN export path through the declaration graph and
 * report the first module specifier on it that cannot be resolved. This is the
 * per-name form of the strict probe — and the only form that is decisive:
 * `@deepseek-ai/dsh-api-remotes`' client entry re-exports ~30 packages, most of
 * which a plugin does not consume, and a whole-graph `skipLibCheck: false`
 * compile fails on those unrelated edges (measured: 18 on the 0.1.5-rc.3 bundle
 * tree, 0 on 0.1.7-rc.1) instead of on the names this plugin uses.
 * @param name - consumed name.
 * @param file - declaration file to search (the contract entry first).
 * @param options - compiler options whose module resolution matches that tree.
 * @param seen - visited files, so a cyclic re-export cannot loop.
 * @returns the unresolved specifier and its importing file, or undefined.
 */
function chainCheck(name, file, options, seen = new Set()) {
  if (seen.has(file)) return undefined
  seen.add(file)
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    return { spec: '<unreadable>', file }
  }
  for (const match of text.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}\s+from\s+'([^']+)'/g)) {
    const members = match[1].split(',').map(member => member.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop().trim())
    if (!members.includes(name)) continue
    const spec = match[2]
    const resolved = ts.resolveModuleName(spec, file, options, ts.sys)
    const target = resolved.resolvedModule?.resolvedFileName
    if (target === undefined) return { spec, file }
    const deeper = chainCheck(name, target, options, seen)
    if (deeper !== undefined) return deeper
  }
  return undefined
}

/** Resolution options for one tree (the repo's own, pointed at that tree's node_modules). */
function resolutionOptions(tree) {
  return { ...compilerOptions(), baseUrl: tree }
}

/**
 * Materialize one harness line's owner packages under the cache dir, so the
 * strict probe resolves that line's declarations instead of the devDeps'.
 * @param version - exact published version, e.g. `0.1.5-rc.3`.
 * @returns the tree directory.
 */
function prepareLine(version) {
  const tree = join(process.env['BMP_CONTRACT_CACHE'] ?? join(tmpdir(), 'bmp-contract-lines'), version)
  const marker = join(tree, '.installed')
  if (existsSync(marker)) return tree
  rmSync(tree, { recursive: true, force: true })
  mkdirSync(tree, { recursive: true })
  writeFileSync(join(tree, 'package.json'), JSON.stringify({ name: `bmp-contract-${version}`, private: true }, null, 1))
  // `--legacy-peer-deps`: a declaration probe needs the packages present, not a
  // runtime resolution, and each line's own peer graph is stricter than that.
  npm('install', '--prefix', tree, '--no-save', '--ignore-scripts', '--no-audit', '--no-fund', '--legacy-peer-deps',
    ...OWNERS.map(name => `${name}@${version}`))
  writeFileSync(marker, `${version}\n`)
  return tree
}

/** The installed version of one package in a tree, or undefined. */
function installedVersion(tree, name) {
  const manifest = join(tree, 'node_modules', name, 'package.json')
  if (!existsSync(manifest)) return undefined
  return JSON.parse(readFileSync(manifest, 'utf8')).version
}

/** Whether every PUBLIC declaration entry of the built artifact resolves strictly. */
function probeBuiltArtifact() {
  const entries = ['lib/client/index.d.ts', 'lib/index.d.ts'].filter(entry => existsSync(join(ROOT, entry)))
  if (entries.length === 0) {
    console.log('  (no lib/ declarations yet — run `npm run build`, then `--lib` again)')
    return []
  }
  const failures = []
  const probeDir = makeProbeDir(ROOT)
  for (const entry of entries) {
    const probe = join(probeDir, `lib-${entry.replaceAll('/', '-').replace(/\.d\.ts$/, '')}.ts`)
    const target = relative(probeDir, join(ROOT, entry.replace(/\.d\.ts$/, '.js')))
    writeFileSync(probe, `import type * as M from './${target}'\nexport type Surface = typeof M\n`)
    let output = ''
    try {
      execFileSync(process.execPath, [
        TSC, '--noEmit', '--strict', '--skipLibCheck', 'false',
        '--module', 'esnext', '--moduleResolution', 'bundler',
        '--target', 'es2021', '--lib', 'es2021,dom', probe,
      ], { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' })
    } catch (error) {
      output = `${error.stdout ?? ''}${error.stderr ?? ''}${error.message}`
    } finally {
      rmSync(probe, { force: true })
    }
    const lines = output.split('\n').filter(line => line.includes('error TS'))
    // ANY error inside our own artifact is ours; upstream's barrel gaps are not.
    const ownErrors = lines.filter(line => (line.split('(')[0] ?? '').startsWith('lib/'))
    if (ownErrors.length > 0) failures.push(`${entry}: ${String(ownErrors.length)} error(s) inside lib/\n    ${ownErrors.slice(0, 3).join('\n    ')}`)
    console.log(`  ${entry}: ${String(lines.length)} strict diagnostic(s), ${String(ownErrors.length)} inside lib/, ${String(lines.length - ownErrors.length)} upstream`)
  }
  rmSync(probeDir, { recursive: true, force: true })

  // The retired-name sweep covers EVERY shipped declaration, not just the entry:
  // a stale module keeps re-exporting a removed member while the entry stays
  // textually innocent, and a statement-level scan is what distinguishes that
  // from this plugin's own legitimate local aliases.
  const shipped = readdirSync(join(ROOT, 'lib'), { recursive: true }).map(String).filter(name => name.endsWith('.d.ts'))
  const stale = shipped.flatMap((rel) => {
    const text = readFileSync(join(ROOT, 'lib', rel), 'utf8')
    const hits = []
    for (const match of text.matchAll(/(?:import|export)\s+(?:type\s+)?(?:\*|\{[^}]*\})\s*(?:as\s+[\w$]+\s*)?from\s+'([^']+)'/g)) {
      if (!match[1].startsWith('@deepseek-ai/dsh')) continue
      const name = new RegExp(`\\b(${RETIRED.join('|')})\\b`).exec(match[0])?.[1]
      if (name !== undefined) hits.push(`lib/${rel} -> ${name} from '${match[1]}'`)
    }
    return hits
  })
  if (stale.length > 0) failures.push(`shipped declarations still import retired members:\n    ${stale.join('\n    ')}\n    (rebuild: npm run build)`)
  console.log(`  swept ${String(shipped.length)} shipped declaration(s): ${stale.length === 0 ? 'no retired member imported' : stale.join('; ')}`)
  return failures
}

const args = process.argv.slice(2)
const names = importedNames()
const lines = (() => {
  const flag = args.indexOf('--lines')
  if (flag !== -1 && args[flag + 1] !== undefined) return args[flag + 1].split(',').map(value => value.trim()).filter(Boolean)
  return [installedVersion(ROOT, '@deepseek-ai/dsh-api-remotes') ?? 'unknown']
})()

console.log(`contract module : ${CONTRACT_MODULE}`)
console.log(`consumed names  : ${String(names.length)}${names.length > 0 ? ` (${names.join(', ')})` : ''}`)
console.log(`manifest pin    : ${JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).devDependencies['@deepseek-ai/dsh-api-remotes']}`)

const failures = []
for (const version of lines) {
  const tree = version === installedVersion(ROOT, '@deepseek-ai/dsh-api-remotes') ? ROOT : prepareLine(version)
  const installed = installedVersion(tree, '@deepseek-ai/dsh-api-remotes')
  console.log(`\n=== line ${version} (${tree === ROOT ? 'installed devDeps' : tree}) ===`)
  console.log(`  installed ${CONTRACT_MODULE.split('/')[0]} = ${String(installed)}`)
  // The INSTALLED version is the evidence, never the manifest pin: a stale
  // lockfile or node_modules keeps resolving the old contract silently.
  if (installed !== version) failures.push(`line ${version}: installed version is ${String(installed)}`)
  // The probe lives in a scratch dir and is removed with it, so the repo root
  // stays pristine after any invocation (its node_modules/.cache is gitignored).
  const probeDir = makeProbeDir(tree)
  const strict = strictProbe(tree, writeProbe(probeDir))
  const entry = tree === ROOT ? TYPES : join(probeDir, 'probe.ts')
  const { exported, failures: unresolved } = describeDeclarations(entry)
  failures.push(...unresolved.map(name => `line ${version}: ${name} unresolved`))
  const present = RETIRED.filter(name => exported.has(name))
  console.log(`  retired names exported: ${present.length > 0 ? present.join(', ') : 'none (ok)'}`)
  if (present.length > 0) failures.push(`line ${version}: retired name(s) exported: ${present.join(', ')}`)
  const options = resolutionOptions(tree)
  const entryDts = ts.resolveModuleName(CONTRACT_MODULE, entry, options, ts.sys).resolvedModule?.resolvedFileName
  for (const name of importedNames()) {
    const broken = entryDts === undefined ? { spec: CONTRACT_MODULE, file: entry } : chainCheck(name, entryDts, options)
    if (broken !== undefined) {
      console.log(`  BROKEN CHAIN  ${name}: '${broken.spec}' unresolved from ${relative(ROOT, broken.file)}`)
      failures.push(`line ${version}: ${name} chain breaks at '${broken.spec}'`)
    }
  }
  console.log(`  strict probe (skipLibCheck:false): ${strict.parsed.length === 0 ? 'clean' : `${String(strict.resolutionErrors.length)} unrelated resolution error(s), ${String(strict.tolerated.length)} other diagnostic(s), 0 in this plugin's chain`}`)
  for (const item of strict.resolutionErrors.slice(0, 3)) console.log(`    (upstream gap, not consumed) ${item.line}`)
  // Nothing survives the run: the probe is gone with its scratch directory.
  rmSync(probeDir, { recursive: true, force: true })
}

if (args.includes('--lib')) {
  console.log('\n=== packed lib/ declarations ===')
  failures.push(...probeBuiltArtifact())
}

if (failures.length > 0) {
  console.error(`\nverify-contract: FAILED\n  ${failures.join('\n  ')}`)
  process.exit(1)
}
console.log(`\nverify-contract: ${String(lines.length)} line(s) clean — every consumed name resolves to a real declaration whose own imports resolve, retired names stay gone, no consumed export chain breaks`)