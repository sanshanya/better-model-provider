/**
 * Artifact gate (run after `npm run build`): npm pack, then prove what a
 * downstream receives — every manifest-declared file is in the tarball, the
 * client bundle keeps the module-loader wrapper and exposes the plugin triple,
 * and the shipped declarations compile in a bare consumer (tarball + typescript
 * + the `@types` they need, NO skipLibCheck) where a diagnostic inside our own
 * files fails the run.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'

// npm/pnpm resolve as .cmd on Windows: execFile without a shell cannot spawn them there.
const shell = process.platform === 'win32'

const work = mkdtempSync(join(tmpdir(), 'bmp-pack-'))
try {
  const out = execFileSync('npm', ['pack', '--pack-destination', work], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], shell })
  const tarball = join(work, out.trim().split('\n').pop() ?? '')
  execFileSync('tar', ['xzf', tarball, '-C', work], { stdio: 'pipe' })
  const root = join(work, 'package')
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

  const missing = []
  const present = (rel) => {
    try {
      readFileSync(join(root, rel))
    } catch {
      missing.push(rel)
    }
  }
  for (const entry of Object.values(pkg.exports ?? {})) {
    if (typeof entry !== 'object' || entry === null) continue
    for (const rel of [entry.types, entry.default]) if (typeof rel === 'string') present(rel)
  }
  if (typeof pkg.main === 'string') present(pkg.main)
  if (typeof pkg.types === 'string') present(pkg.types)
  if (missing.length > 0) throw new Error(`verify-pack: manifest paths missing from the tarball:\n  ${missing.join('\n  ')}`)

  const bundle = readFileSync(join(root, 'lib/client.js'), 'utf8')
  if (!bundle.startsWith('window.__ModuleLoader__.load({')) {
    throw new Error('verify-pack: lib/client.js lost its module-loader wrapper')
  }

  // The shell contract is runtime: execute the factory under a stubbed loader.
  // A wrapper that survives as text but ships broken exports passes every check
  // above and fails only in the browser.
  let captured
  runInNewContext(bundle, { window: { __ModuleLoader__: { load(entry) { captured = entry } } } }, { filename: 'lib/client.js' })
  if (captured === undefined) throw new Error('verify-pack: __ModuleLoader__.load never invoked')
  if (captured.id !== 'better-model-provider') throw new Error(`verify-pack: bundle id "${String(captured.id)}"`)
  // External modules only need to exist for top-level evaluation: the bundle
  // references react names lazily, at component render time.
  const stub = () => new Proxy(() => undefined, { get: () => stub(), apply: () => ({}) })
  const shipped = captured.factory(stub)
  if (typeof shipped.name !== 'string' || !Array.isArray(shipped.inject) || typeof shipped.apply !== 'function') {
    throw new Error(`verify-pack: broken plugin exports: name=${typeof shipped.name} inject=${Array.isArray(shipped.inject)} apply=${typeof shipped.apply}`)
  }

  // Bare-consumer type probe: the tarball plus the SAME typescript the repo
  // resolves (a hard pin would bless semantics our own gate never saw) and the
  // `@types` the shipped declarations need — the `react` peer installs as JS
  // only, and TS7016 inside our artifact is the class of defect this gate exists
  // to catch, so the probe is provisioned, never silenced.
  const lock = JSON.parse(readFileSync(join(process.cwd(), 'package-lock.json'), 'utf8'))
  const tsVersion = lock.packages?.['node_modules/typescript']?.version
  if (typeof tsVersion !== 'string') throw new Error('verify-pack: typescript version not found in package-lock.json')
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
  writeFileSync(probe, `import type { CapabilitiesController, CapabilitiesSectionProps } from '${pkg.name}/client'
export const probe: CapabilitiesController | undefined = undefined
export const face: CapabilitiesSectionProps | undefined = undefined
`)
  // STRICT: no `--skipLibCheck`. `es2021`+: cordis's declarations name WeakRef.
  let output = ''
  try {
    // typescript/bin/tsc is a JS file, not an executable: invoke it through the
    // running node so this probe survives Windows too.
    execFileSync(process.execPath, [
      join(work, 'node_modules', 'typescript', 'bin', 'tsc'),
      '--noEmit', probe,
      '--strict', '--module', 'esnext', '--moduleResolution', 'bundler',
      '--target', 'es2021', '--lib', 'es2021,dom',
      '--noUncheckedIndexedAccess', '--exactOptionalPropertyTypes',
    ], { cwd: work, stdio: 'pipe', encoding: 'utf8' })
  } catch (error) {
    output = `${error.stdout ?? ''}${error.stderr ?? ''}${error.message}`
  }
  const errors = output.split('\n').filter(line => line.includes('error TS'))
  // The artifact is the subject; upstream's barrels reference packages they never
  // declare (`dsh-api-remotes` -> `dsh-plugin-manager/types`, `dsh-llm` ->
  // `dsh-attachment`), so a strict compile always reports those. Every shipped
  // declaration is reachable from `<pkg>/client`, so an in-artifact diagnostic
  // cannot hide in an unimported file.
  const own = errors.filter(line => (line.split('(')[0] ?? '').includes(pkg.name))
  if (own.length > 0) {
    throw new Error(`verify-pack: a bare consumer cannot resolve the published declarations:\n${own.join('\n')}`)
  }
  console.log(`verify-pack: ${pkg.name}@${pkg.version} tarball OK (strict consumer-type probe; ${String(errors.length)} upstream declaration gap(s) tolerated)`)
} finally {
  rmSync(work, { recursive: true, force: true })
}
