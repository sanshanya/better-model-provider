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
 *
 * Version truth: the CLI is booted out of `$BMP_DSH_DIR`, so the profile's
 * client bundles are pinned to THAT checkout's own version
 * (`packages/boot/app-boot/package.json` — the manifest
 * `plugin-compatibility.ts` reads to judge peer compatibility, i.e. the
 * harness's definition of the running version) instead of a stale published
 * rc. A pin that disagrees with the checkout, or an explicit
 * `BMP_DSH_BUNDLE_VERSION` assertion that does, refuses to boot: a 0.1.7 CLI
 * over a 0.1.0 client graph is precisely the mismatch every downstream claim
 * of this lane would inherit — and at 0.1.0-rc.7 a client-side package row
 * this plugin injects still exists, so the old pin silently masked that too.
 */
import { spawn, execFileSync, type ChildProcess } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
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
  /** The DSH_HOME the harness boots with (the home-level `settings.yaml` seeds live directly inside). */
  dshHome: string
  /**
   * The dsh version this lane pinned its client bundles to and asserted at
   * install time: read from the checkout's `packages/boot/app-boot/package.json`,
   * which is the harness's own definition of the running version. Printed by
   * every lane so a transcript names the generation it tested instead of
   * implying it.
   */
  bundleVersion: string
  /** Absolute directory of the throwaway profile the lane created and booted. */
  profileDir: string
  /**
   * Resolve the settings document this generation actually writes, waiting
   * (bounded) for the generation to settle which one is live, and print the
   * answer. Generations disagree: the 0.1.7 line imports the home-level
   * `settings.yaml` once — renaming it `settings.yaml.imported` — and keeps the
   * live document at the profile's `cordis.patch.yml`, while older lines keep
   * `<DSH_HOME>/settings.yaml` live. The shape is observed on disk, never
   * guessed from a version string, so a lane cannot assert against a file the
   * harness does not write.
   * @param timeoutMs - bound on waiting for the import marker; defaults to 5s.
   * @returns the absolute path callers must read for write assertions.
   * @throws when neither candidate document exists at all.
   */
  settingsDocument: (timeoutMs?: number) => Promise<string>
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

/** Client-facing bundles the profile boots; both must carry the checkout's own version. */
const CLIENT_BUNDLES = ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app'] as const

/** Throwaway profile name (and directory) inside the lane's DSH_HOME. */
const PROFILE_NAME = 'bmp-live'

/**
 * The dsh version the checkout at `dshDir` carries, as the harness defines it:
 * `packages/boot/app-boot/package.json` — the same manifest
 * `plugin-compatibility.ts` reads to decide whether a plugin's dsh peers are
 * satisfiable. Never guessed, never defaulted to a published rc.
 *
 * `BMP_DSH_BUNDLE_VERSION` is an ASSERTION, not an escape hatch: this lane
 * boots the checkout's CLI, so bundles from another version would produce the
 * exact generation mismatch the gate exists to catch. A differing value
 * refuses to boot.
 * @param dshDir - harness checkout the lane boots.
 * @param override - asserted version; defaults to the `BMP_DSH_BUNDLE_VERSION` env var.
 * @returns the version to pin the profile's client bundles to.
 * @throws when the manifest is unreadable or an explicit assertion disagrees.
 */
export function resolveBundleVersion(dshDir: string, override?: string): string {
  const manifest = join(dshDir, 'packages', 'boot', 'app-boot', 'package.json')
  let version: string
  try {
    const parsed = JSON.parse(readFileSync(manifest, 'utf8')) as { version?: unknown }
    if (typeof parsed.version !== 'string' || parsed.version.trim() === '') {
      throw new Error('the manifest carries no version string')
    }
    version = parsed.version
  } catch (error) {
    throw new Error(
      `live boot: cannot read the running dsh version from ${manifest} `
      + `(${error instanceof Error ? error.message : String(error)}); `
      + 'the lane pins its bundle dependencies to the version it boots and refuses to guess',
    )
  }
  const asserted = override ?? process.env['BMP_DSH_BUNDLE_VERSION']
  if (asserted !== undefined && asserted.trim() !== '' && asserted !== version) {
    throw new Error(
      `live boot: BMP_DSH_BUNDLE_VERSION=${asserted} does not match the harness at ${dshDir} (${version}); `
      + `this lane boots the ${version} CLI and refuses to install ${asserted} bundles — `
      + 'a CLI and a client graph from different lines is the exact mismatch this gate exists to catch',
    )
  }
  return version
}

/** One bundle's version as installed in a `node_modules` tree, or undefined when absent. */
function installedVersion(nodeModulesParent: string, name: string): string | undefined {
  try {
    const parsed = JSON.parse(readFileSync(join(nodeModulesParent, 'node_modules', name, 'package.json'), 'utf8')) as { version?: unknown }
    return typeof parsed.version === 'string' ? parsed.version : undefined
  } catch {
    return undefined
  }
}

/**
 * Assert the boot's bundle versions, and print the raw evidence on every run:
 * the profile's installed pins (what `npm ls <bundles>` inside the kept profile
 * would show) plus the versions the CLI's own tree carries. Installation-first
 * bundle resolution serves the installation's copy when it has one, so a
 * disagreement between those two is how a lane would silently test a different
 * generation than it names.
 * @param profileDir - the throwaway profile directory.
 * @param dshDir - the harness checkout being booted.
 * @param version - the version both must carry (the checkout's own).
 * @throws when a profile pin or a resolvable installation copy differs.
 */
function assertBundlePins(profileDir: string, dshDir: string, version: string): void {
  const pins = CLIENT_BUNDLES.map(name => `${name}@${installedVersion(profileDir, name) ?? 'NOT INSTALLED'}`)
  const cliRequire = createRequire(join(dshDir, 'apps', 'cli', 'package.json'))
  const carried = CLIENT_BUNDLES.map(name => {
    try {
      const manifest = cliRequire.resolve(`${name}/package.json`)
      const parsed = JSON.parse(readFileSync(manifest, 'utf8')) as { version?: unknown }
      return `${name}@${typeof parsed.version === 'string' ? parsed.version : '?'}`
    } catch {
      // Absent from the installation's tree: resolution falls back to the
      // profile copy, which is pinned to `version`, so this is not a mismatch.
      return `${name}@not-carried`
    }
  })
  console.log(`live boot: dsh ${version} — profile pins [${pins.join(' ')}] (assert with \`npm ls ${CLIENT_BUNDLES.join(' ')}\` in ${profileDir})`)
  console.log(`live boot: dsh ${version} — installation-carried [${carried.join(' ')}]`)
  const wrongPins = CLIENT_BUNDLES.filter(name => installedVersion(profileDir, name) !== version)
  if (wrongPins.length > 0) {
    throw new Error(
      `live boot: profile bundles are not the version this lane names (${version}): `
      + `${wrongPins.map(name => `${name}=${installedVersion(profileDir, name) ?? 'NOT INSTALLED'}`).join(', ')}`,
    )
  }
  const wrongCarried = carried.filter(entry => !entry.endsWith('@not-carried') && !entry.endsWith(`@${version}`))
  if (wrongCarried.length > 0) {
    throw new Error(
      `live boot: the CLI's own tree carries different bundles than this lane names (${version}): ${wrongCarried.join(', ')}; `
      + 'installation-first bundle resolution would serve those, so the booted client graph would not be the version under test',
    )
  }
}

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
 * Pick the settings document the generation under test actually writes, waiting
 * (bounded) for it to settle which one that is, and print the answer.
 *
 * Generations disagree: the 0.1.7 line imports the home-level `settings.yaml`
 * once — renaming it `settings.yaml.imported` before its first write — and
 * keeps the live document at the profile's `cordis.patch.yml`, while older
 * lines keep `<DSH_HOME>/settings.yaml` live and never write that marker. The
 * shape is observed on disk, never guessed from a version string, so a lane
 * cannot assert against a file the harness does not write.
 * @param dshHome - the lane's DSH_HOME.
 * @param profileDir - the throwaway profile directory inside it.
 * @param timeoutMs - bound on waiting for the import marker; defaults to 5s.
 * @returns the absolute path callers must read for write assertions.
 * @throws when neither candidate document exists at all.
 */
export async function liveSettingsDocument(dshHome: string, profileDir: string, timeoutMs = 5_000): Promise<string> {
  const homeDocument = join(dshHome, 'settings.yaml')
  const importedMarker = `${homeDocument}.imported`
  const profileDocument = join(profileDir, 'cordis.patch.yml')
  const deadline = Date.now() + timeoutMs
  while (!existsSync(importedMarker) && Date.now() < deadline) {
    await new Promise(resolveWait => setTimeout(resolveWait, 100))
  }
  const chosen = existsSync(importedMarker)
    ? profileDocument
    : existsSync(homeDocument) ? homeDocument : existsSync(profileDocument) ? profileDocument : undefined
  if (chosen === undefined) {
    throw new Error(`live boot: no settings document at ${homeDocument} or ${profileDocument}`)
  }
  console.log(`live boot: settings document ${chosen}${existsSync(importedMarker) ? ` (home document imported into the profile: ${importedMarker})` : ''}`)
  return chosen
}

/**
 * Pack the repo, prepare a throwaway profile, boot the real harness,
 * harvest its forwarded URL (token query included on gated generations),
 * and settle the session cookie for it. The profile's client bundles are
 * pinned to the checkout's own version and that pin is asserted, so a green
 * lane is evidence about the generation it names.
 * @param opts - seeds/env for the boot.
 * @throws when `BMP_DSH_DIR` is unset, the checkout's version cannot be read,
 * an explicit `BMP_DSH_BUNDLE_VERSION` assertion disagrees with it, or the
 * installed bundles turn out not to carry it.
 */
export async function liveBoot(opts: LiveBootOptions = {}): Promise<LiveBoot> {
  const dshDir = process.env['BMP_DSH_DIR']
  if (dshDir === undefined || dshDir.trim() === '') {
    throw new Error('live boot: BMP_DSH_DIR is unset; point it at a harness checkout (liveBootAvailable() gates opt-in callers)')
  }
  const checkout = resolve(dshDir)
  // Resolve and assert BEFORE any scratch work: a lane that cannot name the
  // generation it boots has nothing worth reporting.
  const bundleVersion = resolveBundleVersion(checkout)
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

    const profileDir = join(work, 'profiles', PROFILE_NAME)
    mkdirSync(profileDir, { recursive: true })
    writeFileSync(join(profileDir, 'package.json'), JSON.stringify({
      name: `dsh-profile-${PROFILE_NAME}`,
      private: true,
      dsh: {
        profile: {
          bundles: [...CLIENT_BUNDLES, 'better-model-provider'],
        },
      },
      dependencies: {
        'better-model-provider': `link:${pluginDir}`,
        // Both ride the checkout's OWN version: the CLI is booted from that
        // checkout, and its version is what plugin admission, the client graph
        // and this lane's claims are all about. A published rc pinned here
        // would let a different generation serve the page.
        ...Object.fromEntries(CLIENT_BUNDLES.map(name => [name, bundleVersion])),
      },
    }, null, 1))
    execFileSync('pnpm', ['install', '--ignore-scripts'], { cwd: profileDir, stdio: 'pipe', shell })
    assertBundlePins(profileDir, checkout, bundleVersion)

    for (const [name, content] of Object.entries(opts.seeds ?? {})) {
      writeFileSync(join(work, name), content)
    }

    const cli = join(checkout, 'apps/cli/src/bin.ts')
    server = spawn('node', ['--import', 'tsx/esm', cli, '--profile', PROFILE_NAME, '--host', '127.0.0.1', '--port', '0'], {
      cwd: checkout,
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

    const settingsDocument = (timeoutMs?: number): Promise<string> =>
      liveSettingsDocument(work, profileDir, timeoutMs)

    return { fullUrl, baseUrl, sessionCookie, dshHome: work, bundleVersion, profileDir, settingsDocument, dispose }
  } catch (error) {
    dispose()
    throw error
  }
}
