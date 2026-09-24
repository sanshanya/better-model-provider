/**
 * Verify the publishable artifact, not the source tree: npm pack the package,
 * extract the tarball, and confirm every manifest-declared file exists inside
 * it (main/types for "." and "./client"), the client bundle carries the
 * module-loader wrapper the DSH shell requires, the host half parses as an ES
 * module, the shipped declaration files name no retired contract member, and a
 * bare consumer (tarball + typescript + the `@types/*` our declarations need,
 * no skipLibCheck) can compile an import from the published entry. Run after
 * `npm run build`.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'

// npm/pnpm resolve as .cmd on Windows: execFile without a shell cannot spawn
// them there (ENOENT) — the convention the harness CLI itself follows.
const shell = process.platform === 'win32'

/** Contract members upstream retired at 0.1.2; a shipped declaration must not name them. */
const RETIRED = ['IApiClient', 'RpcError', 'ConfigurableProviderView', 'DiscoveredModelView']
const RETIRED_NAME = new RegExp(`\\b(${RETIRED.join('|')})\\b`)

/**
 * Contract members a declaration file still pulls from a harness package.
 * Statement-level, never a substring scan: this plugin legitimately ships LOCAL
 * aliases (`export type ConfigurableProviderView = LlmConfigurableProvider`) and
 * its own `HarnessRpcError`, both of which merely contain a retired name's text.
 * @param text - one shipped `.d.ts`.
 * @returns the offending `{name, spec}` pairs.
 */
function staleContractReferences(text) {
  const hits = []
  for (const match of text.matchAll(/(?:import|export)\s+(?:type\s+)?(?:\*|\{[^}]*\})\s*(?:as\s+[\w$]+\s*)?from\s+'([^']+)'/g)) {
    const spec = match[1]
    if (!spec.startsWith('@deepseek-ai/dsh')) continue
    const name = RETIRED_NAME.exec(match[0])?.[1]
    if (name !== undefined) hits.push({ name, spec })
  }
  return hits
}

const work = mkdtempSync(join(tmpdir(), 'bmp-pack-'))
try {
  const out = execFileSync('npm', ['pack', '--pack-destination', work], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], shell })
  const tarball = join(work, out.trim().split('\n').pop() ?? '')
  execFileSync('tar', ['xzf', tarball, '-C', work], { stdio: 'pipe' })
  const root = join(work, 'package')
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

  const missing = []
  for (const [key, entry] of Object.entries(pkg.exports)) {
    if (typeof entry !== 'object' || entry === null) continue
    for (const field of ['types', 'default']) {
      const rel = entry[field]
      if (typeof rel === 'string') {
        try {
          readFileSync(join(root, rel))
        } catch {
          missing.push(`exports[${String(key)}].${field} -> ${rel}`)
        }
      }
    }
  }
  if (typeof pkg.main === 'string') {
    try {
      readFileSync(join(root, pkg.main))
    } catch {
      missing.push(`main -> ${pkg.main}`)
    }
  }
  if (typeof pkg.types === 'string') {
    try {
      readFileSync(join(root, pkg.types))
    } catch {
      missing.push(`types -> ${pkg.types}`)
    }
  }
  if (missing.length > 0) {
    throw new Error(`verify-pack: manifest paths missing from the tarball:\n  ${missing.join('\n  ')}`)
  }

  const bundle = readFileSync(join(root, 'lib/client.js'), 'utf8')
  if (!bundle.startsWith('window.__ModuleLoader__.load({')) {
    throw new Error('verify-pack: lib/client.js lost its module-loader wrapper')
  }

  // The shipped DECLARATIONS are part of the artifact, and a stale build can
  // keep re-exporting a name the running harness retired long ago (0.0.4's
  // client entry re-exported `IApiClient`/`RpcError`/`ConfigurableProviderView`/
  // `DiscoveredModelView`, all removed upstream at 0.1.2). Nothing else in this
  // script reads lib/**/*.d.ts, so this is the only place that sees it.
  const shippedDeclarations = []
  for (const entry of readdirSync(join(root, 'lib'), { recursive: true })) {
    const rel = String(entry)
    if (!rel.endsWith('.d.ts')) continue
    shippedDeclarations.push([rel, readFileSync(join(root, 'lib', rel), 'utf8')])
  }
  if (shippedDeclarations.length === 0) throw new Error('verify-pack: the tarball carries no lib/**/*.d.ts declarations')
  const stale = shippedDeclarations.flatMap(([rel, text]) => staleContractReferences(text).map(hit => `${rel} -> ${hit.name} from '${hit.spec}'`))
  if (stale.length > 0) {
    throw new Error(`verify-pack: the shipped declarations still name contract members upstream removed:\n  ${stale.join('\n  ')}\n  (rebuild: npm run build)`)
  }

  // The shell contract is runtime, not text: execute the factory under a
  // stubbed loader and assert the plugin triple (name/inject/apply). A
  // wrapper that survives as text but ships broken exports would pass every
  // check above and fail only in the browser — the type probe cannot see it.
  let captured
  const sandbox = {
    window: {
      __ModuleLoader__: {
        load(entry) { captured = entry },
      },
    },
  }
  runInNewContext(bundle, sandbox, { filename: 'lib/client.js' })
  if (captured === undefined) throw new Error('verify-pack: __ModuleLoader__.load never invoked')
  if (captured.id !== 'better-model-provider') throw new Error(`verify-pack: bundle id "${String(captured.id)}"`)
  // External modules only need to exist for top-level evaluation: the bundle
  // references react names lazily, at component render time.
  const stub = () => new Proxy(() => undefined, { get: () => stub(), apply: () => ({}) })
  const shipped = captured.factory(stub)
  if (typeof shipped.name !== 'string' || !Array.isArray(shipped.inject) || typeof shipped.apply !== 'function') {
    throw new Error(`verify-pack: broken plugin exports: name=${typeof shipped.name} inject=${Array.isArray(shipped.inject)} apply=${typeof shipped.apply}`)
  }

  // The shipped .d.ts must actually resolve in a consumer that never
  // installed anything else. Install the tarball into an empty project and
  // typecheck a realistic import — a declaration-resolution error here is
  // what a real downstream sees.
  // Probe the declarations with the SAME typescript the repo resolves —
  // a hard-pinned version would bless semantics the repo's own gate never saw.
  const lock = JSON.parse(readFileSync(join(process.cwd(), 'package-lock.json'), 'utf8'))
  const tsVersion = lock.packages?.['node_modules/typescript']?.version
  if (typeof tsVersion !== 'string') throw new Error('verify-pack: typescript version not found in package-lock.json')
  // The probe compiles the shipped declarations WITHOUT skipLibCheck, so the
  // tree must also carry the type packages those declarations consume. `react`
  // is a declared peer, and npm installs it here as JS only: a bare consumer
  // then hits TS7016 ("implicitly has an 'any' type") INSIDE our artifact. That
  // is a real downstream signal, so it gets provisioned, never silenced —
  // restoring `--skipLibCheck` or filtering the diagnostic would blind the gate
  // to exactly the missing-declaration class it exists to catch. Ranges come
  // from our own manifest, the way the compiler above comes from our own lock.
  const manifest = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))
  const typePackages = ['@types/react', '@types/react-dom'].map(name => {
    const range = manifest.devDependencies?.[name]
    if (typeof range !== 'string') {
      throw new Error(`verify-pack: ${name} is absent from devDependencies — the probe cannot compile the shipped declarations without it`)
    }
    return `${name}@${range}`
  })
  writeFileSync(join(work, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball, `typescript@${tsVersion}`, ...typePackages], { cwd: work, stdio: 'pipe', shell })
  const probe = join(work, 'consumer.ts')
  const probeContent = `import type { CapabilitiesController, CapabilitiesSectionProps } from '${pkg.name}/client'
export const probe: CapabilitiesController | undefined = undefined
export const face: CapabilitiesSectionProps | undefined = undefined
`
  writeFileSync(probe, probeContent)
  // STRICT: no `--skipLibCheck`. Hiding the declaration graph is exactly what
  // let 0.0.4 ship a client entry re-exporting names the running harness had
  // removed, and this probe is the only place the SHIPPED artifact is compiled.
  // `es2021`+: cordis's logger.d.ts names WeakRef, so a lower lib would fail
  // the strict pass on an upstream lib nit instead of on the declarations.
  let consumerOutput = ''
  try {
    // node_modules typescript/bin/tsc is a JS file, not an executable: invoke
    // it through the running node so this probe survives Windows too.
    execFileSync(process.execPath, [
      join(work, 'node_modules', 'typescript', 'bin', 'tsc'),
      '--noEmit', probe,
      '--strict', '--module', 'esnext', '--moduleResolution', 'bundler',
      '--target', 'es2021', '--lib', 'es2021,dom',
      '--noUncheckedIndexedAccess', '--exactOptionalPropertyTypes',
    ], { cwd: work, stdio: 'pipe', encoding: 'utf8' })
  } catch (error) {
    consumerOutput = `${error.stdout ?? ''}${error.stderr ?? ''}${error.message}`
  }
  const consumerErrors = consumerOutput.split('\n').filter(line => line.includes('error TS'))
  // The artifact is the subject: an error inside it is a downstream's problem,
  // while upstream's own type barrels reference packages they never declare
  // (`dsh-api-remotes/lib/types/client/index.d.ts` -> `@deepseek-ai/dsh-plugin-manager/types`,
  // `dsh-llm/lib/types/types.d.ts` -> `@deepseek-ai/dsh-attachment`), so a
  // strict compile always reports those. They are counted and named, not ours.
  const ownErrors = consumerErrors.filter(line => (line.split('(')[0] ?? '').includes(pkg.name))
  if (ownErrors.length > 0) {
    throw new Error(`verify-pack: a bare consumer cannot resolve the published declarations:
${ownErrors.join('\n')}`)
  }
  if (consumerErrors.length > 0) {
    console.log(`verify-pack: ${String(consumerErrors.length)} upstream declaration gap(s) tolerated (none inside ${pkg.name})`)
  }

  console.log(`verify-pack: ${pkg.name}@${pkg.version} tarball OK (incl. consumer-type probe)`)
} finally {
  rmSync(work, { recursive: true, force: true })
}
