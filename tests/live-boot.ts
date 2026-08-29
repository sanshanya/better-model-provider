/**
 * Shared live-harness boot scaffolding for the integration and functional
 * gates: pack the publishable artifact, install it into a throwaway
 * `<DSH_HOME>/profiles/<name>` profile next to the real base/web-app
 * bundles, boot the real CLI, harvest the forwarded URL, and — when the
 * harness generation demands it — perform the web authentication gate's
 * token→cookie exchange. Both spec files get the same ritual so they
 * cannot drift.
 *
 * Dual-generation contract: dsh ≥0.1.2-alpha.1 (master) prints a
 * process-token URL (`http://127.0.0.1:PORT/?token=…`) and 303s it into a
 * session cookie that every subsequent request must carry; dsh
 * ≤0.1.1-rc.2 (rc.7/rc.8) prints a bare origin URL and serves the app
 * without any gate. The same boot flow serves both: the exchange is
 * attempted only when a query rides the printed URL, and any answer that
 * is not a 303 with a set-cookie header simply downgrades the boot to the
 * unauthenticated shape (empty {@link LiveBoot.sessionCookie}), leaving
 * callers to plain-fetch exactly as they always did.
 */
import { spawn, execFileSync, type ChildProcess } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

/** Everything a caller needs to talk to the boot and shut it down again. */
export interface LiveBoot {
  /**
   * The URL exactly as `dsh web` printed it — query included. On master
   * this carries the process token (`?token=…`) and visiting it in a
   * browser performs the token→cookie exchange (303 onto `/`); on
   * pre-auth harnesses it is the bare app URL and visits it directly.
   */
  fullUrl: string
  /**
   * The origin only (scheme + host + port, no path or query). Base of
   * every direct fetch once {@link LiveBoot.sessionCookie} rides along.
   */
  baseUrl: string
  /**
   * The session cookie minted by the token exchange at boot, in `Cookie`
   * header form (`name=value`). Empty string when the harness is
   * unauthenticated — either it printed no token query, or the exchange
   * answered like a plain page render (no 303, no set-cookie) — in which
   * case callers must send no cookie at all.
   */
  sessionCookie: string
  /** The DSH_HOME the harness boots with (its settings.yaml lives directly inside). */
  dshHome: string
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

/**
 * Perform the web authentication gate's token→cookie exchange against the
 * printed URL, forgiving across harness generations. Detection is by
 * BEHAVIOR, never by parameter spelling: a printed query marks a
 * gated-generation URL worth exchanging, and only a 303 carrying a
 * set-cookie header mints a session. Anything else — no query at all, a
 * 200 page render (an unauthenticated harness shrugging the query off), a
 * redirect without a cookie, or a transport failure — yields the empty
 * cookie, i.e. the pre-auth shape where every request goes out bare.
 * Mirrors the harness's own ritual in `apps/web/tests/scaffold.ts`
 * (fetch with redirect:'manual', require 303 + location '/', keep
 * set-cookie's first attribute) minus the hard failures.
 * @param fullUrl - the URL exactly as `dsh web` printed it.
 */
async function establishSession(fullUrl: string): Promise<string> {
  if (!fullUrl.includes('?')) return ''
  try {
    const login = await fetch(fullUrl, { redirect: 'manual' })
    const setCookie = login.headers.get('set-cookie')
    if (login.status !== 303 || setCookie === null) return ''
    return setCookie.split(';', 1)[0] ?? ''
  } catch {
    return ''
  }
}

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
 * Pack the repo, prepare a throwaway profile, boot the real harness,
 * harvest its forwarded URL (token query included on gated generations),
 * and settle the session cookie for it.
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
        '@deepseek-ai/dsh-base': '0.1.0-rc.7',
        '@deepseek-ai/dsh-web-app': '0.1.0-rc.7',
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
    const fullUrl = await new Promise<string>((resolveUrl, reject) => {
      let out = ''
      const timer = setTimeout(() => reject(new Error(`live boot: URL never printed; output so far:\n${out}`)), 120_000)
      const probe = (chunk: Buffer | string): void => {
        out += String(chunk)
        // First loopback URL wins, as always — but the query rides along
        // now: master prints `dsh web: http://127.0.0.1:PORT/?token=…`
        // and dropping the token strands every later request behind the
        // authentication gate.
        const found = /https?:\/\/127\.0\.0\.1:\d+(?:\/\?\S*)?/.exec(out)
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
    // Origin = scheme+host+port: parse, never regex-strip — a naive
    // `/[/?].*$/` cut removes the `//` after the scheme and leaves `http:`.
    const baseUrl = new URL(fullUrl).origin
    const sessionCookie = await establishSession(fullUrl)
    return { fullUrl, baseUrl, sessionCookie, dshHome: work, dispose }
  } catch (error) {
    dispose()
    throw error
  }
}
