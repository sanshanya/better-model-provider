/**
 * Shared live-harness boot scaffolding for the integration and functional
 * gates: pack the publishable artifact, install it into a throwaway
 * `<DSH_HOME>/profiles/<name>` profile next to the real base/web-app
 * bundles, boot the real CLI, and harvest the forwarded URL. Both spec
 * files get the same ritual so they cannot drift.
 */
import { spawn, execFileSync, type ChildProcess } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

/** Everything a caller needs to shut the boot down again. */
export interface LiveBoot {
  /** The forwarded boot URL (no trailing slash). */
  url: string
  /** The DSH_HOME the harness boots with (its settings.yaml lives directly inside). */
  dshHome: string
  /** The profile directory used for package composition. */
  profileDir: string
  /** Kill the harness process and remove all scratch state. */
  dispose: () => void
}

/** Extra files the profile should boot with (e.g. a seeded settings.yaml). */
export interface LiveBootOptions {
  /** Map of filename → content, written under <DSH_HOME>/ before boot. */
  seeds?: Record<string, string>
  /** Extra environment variables handed to the harness process. */
  env?: Record<string, string>
}

// npm/pnpm resolve as .cmd on Windows: execFile without a shell cannot spawn
// them there (ENOENT) — the convention the harness CLI itself follows.
const shell = process.platform === 'win32'

/** Whether a live boot is even possible on this machine. */
export function liveBootAvailable(): boolean {
  if (process.env['BMP_DSH_DIR'] === undefined) return false
  try {
    execFileSync('pnpm', ['--version'], { stdio: 'pipe', shell })
    return true
  } catch {
    return false
  }
}

/**
 * Pack the repo, prepare a throwaway profile, boot the real harness, and
 * wait for its forwarded web URL.
 * @param opts - seeds/env for the boot.
 */
export async function liveBoot(opts: LiveBootOptions = {}): Promise<LiveBoot> {
  const dshDir = process.env['BMP_DSH_DIR']
  const work = mkdtempSync(join(tmpdir(), 'bmp-live-'))
  let server: ChildProcess | undefined
  const dispose = (): void => {
    server?.kill('SIGTERM')
    // BMP_LIVE_KEEP preserves the throwaway profile for postmortem (CI
    // failure diagnostics); callers that want cleanup keep the default.
    if (process.env['BMP_LIVE_KEEP'] === undefined) rmSync(work, { recursive: true, force: true })
  }
  try {
    execFileSync('npm', ['run', 'build'], { stdio: 'pipe', shell })
    const out = execFileSync('npm', ['pack', '--pack-destination', work], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], shell })
    const tarball = join(work, out.trim().split('\n').pop() ?? '')
    execFileSync('tar', ['xzf', tarball, '-C', work], { stdio: 'pipe' })
    const pluginDir = join(work, 'package')

    const profileDir = join(work, 'profiles', 'bmp-live')
    mkdirSync(profileDir, { recursive: true })
    writeFileSync(join(profileDir, 'package.json'), JSON.stringify({
      name: 'dsh-profile-bmp-live',
      private: true,
      dsh: {
        profile: {
          bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', 'better-model-provider'],
        },
      },
      dependencies: {
        'better-model-provider': `link:${pluginDir}`,
        // Bundles ride the published rc line — exactly how `dsh plugin add`
        // resolves them for a real user; workspace links into the checkout
        // leave transitively-installed client packages without built libs.
        '@deepseek-ai/dsh-base': '0.1.0-rc.6',
        '@deepseek-ai/dsh-web-app': '0.1.0-rc.6',
      },
    }, null, 1))
    execFileSync('pnpm', ['install', '--ignore-scripts'], { cwd: profileDir, stdio: 'pipe', shell })

    for (const [name, content] of Object.entries(opts.seeds ?? {})) {
      writeFileSync(join(work, name), content)
    }

    const cli = join(resolve(dshDir ?? ''), 'apps/cli/src/bin.ts')
    server = spawn('node', ['--import', 'tsx/esm', cli, '--profile', 'bmp-live', '--host', '127.0.0.1', '--port', '0'], {
      cwd: dshDir,
      env: { ...process.env, DSH_HOME: work, ...opts.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const url = await new Promise<string>((resolveUrl, reject) => {
      let out = ''
      const timer = setTimeout(() => reject(new Error(`live boot: URL never printed; output so far:\n${out}`)), 120_000)
      const probe = (chunk: Buffer | string): void => {
        out += String(chunk)
        const found = /https?:\/\/127\.0\.0\.1:\d+/.exec(out)
        if (found) {
          clearTimeout(timer)
          resolveUrl(found[0])
        }
      }
      server?.stdout?.on('data', probe)
      server?.stderr?.on('data', probe)
      server?.on('error', error => {
        clearTimeout(timer)
        reject(error)
      })
      server?.on('exit', code => {
        if (code !== 0 && code !== null) {
          clearTimeout(timer)
          reject(new Error(`live boot: CLI exited ${code}; output:\n${out}`))
        }
      })
    })
    return { url, dshHome: work, profileDir, dispose }
  } catch (error) {
    dispose()
    throw error
  }
}
