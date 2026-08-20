/**
 * Verify the publishable artifact, not the source tree: npm pack the package,
 * extract the tarball, and confirm every manifest-declared file exists inside
 * it (main/types for "." and "./client"), the client bundle carries the
 * module-loader wrapper the DSH shell requires, and the host half parses as
 * an ES module. Run after `npm run build`.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'

// npm/pnpm resolve as .cmd on Windows: execFile without a shell cannot spawn
// them there (ENOENT) — the convention the harness CLI itself follows.
const shell = process.platform === 'win32'

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
  writeFileSync(join(work, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball, `typescript@${tsVersion}`], { cwd: work, stdio: 'pipe', shell })
  const probe = join(work, 'consumer.ts')
  const probeContent = `import type { CapabilitiesController, CapabilitiesSectionProps } from '${pkg.name}/client'
export const probe: CapabilitiesController | undefined = undefined
export const face: CapabilitiesSectionProps | undefined = undefined
`
  writeFileSync(probe, probeContent)
  try {
    // node_modules typescript/bin/tsc is a JS file, not an executable: invoke
    // it through the running node so this probe survives Windows too.
    execFileSync(process.execPath, [
      join(work, 'node_modules', 'typescript', 'bin', 'tsc'),
      '--noEmit', probe,
      '--strict', '--module', 'esnext', '--moduleResolution', 'bundler', '--target', 'es2020', '--skipLibCheck', '--noUncheckedIndexedAccess', '--exactOptionalPropertyTypes',
    ], { cwd: work, stdio: 'pipe' })
  } catch (error) {
    throw new Error(`verify-pack: a bare consumer cannot resolve the published declarations:
${error.stdout ?? error.message}`)
  }

  console.log(`verify-pack: ${pkg.name}@${pkg.version} tarball OK (incl. consumer-type probe)`)
} finally {
  rmSync(work, { recursive: true, force: true })
}
