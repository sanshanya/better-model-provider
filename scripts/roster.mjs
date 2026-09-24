#!/usr/bin/env node
/**
 * Client-roster snapshot generator.
 *
 * Regenerate the checked-in snapshots (each file is EXACTLY this command's
 * stdout — the snapshots are byte-for-byte `diff`-clean against it). A CHANNEL
 * is resolved against npm at snapshot time, so a snapshot whose filename no
 * longer matches what its tag names is visibly stale:
 *
 *   node scripts/roster.mjs next   --meta tests/rosters/dsh-0.1.7-rc.1.meta.json > tests/rosters/dsh-0.1.7-rc.1.json
 *   node scripts/roster.mjs latest --meta tests/rosters/dsh-0.1.5-rc.3.meta.json > tests/rosters/dsh-0.1.5-rc.3.json
 *
 * An explicit version is accepted too (`node scripts/roster.mjs 0.1.7-rc.1`).
 * `--meta <path>` writes the provenance header — dist-tag, resolved version,
 * resolution time, exact command, row count — from the same invocation that
 * emitted the array, so the two cannot drift. stdout stays the JSON array
 * alone, so `require()`-ing a snapshot keeps yielding the rows.
 *
 * A roster is every package in the published `@deepseek-ai/dsh-base` +
 * `@deepseek-ai/dsh-web-app` dependency closure at `<version>` whose manifest
 * declares `dsh.client.platform === "web"`, sorted by id. Those are exactly
 * the ids a plugin's `dsh.client.inject` may name on that harness line: the
 * host composes one client row per declaring package, and an id naming nothing
 * is silently ignored (packages/client/modules `system.ts`), so a dangling row
 * costs a real ordering guarantee without ever failing loudly.
 *
 * Both halves matter: the closure is resolved from the PUBLISHED packages for
 * the requested version, not from a git checkout, so a snapshot is what a user
 * installs. Because prerelease lines can receive new builds, a roster is only
 * as stable as the registry at generation time — regenerate and diff when a
 * line moves; a changed roster is a signal, not a nuisance.
 *
 * The install runs with `--legacy-peer-deps`, i.e. the roster is the
 * `dependencies` closure with peers NOT auto-installed. That is forced by the
 * 0.1.5-rc.3 line itself: npm's strict resolver refuses it outright, because
 * `@deepseek-ai/dsh-web-app@0.1.5-rc.3` pins `cordis-plugin-loader@1.0.3` as a
 * peer while `cordis-plugin-include@1.0.9` (reachable through the same bundle)
 * wants `~1.0.5`. pnpm tolerates that; npm does not. Verified at 0.1.7-rc.1
 * that this mode yields a byte-identical roster to a strict install, so the
 * uniform mode costs no rows on the newer line.
 *
 * Diagnostics go to stderr; stdout is the JSON array alone. Exit 2 = usage
 * error, 1 = generation failure. `BMP_ROSTER_KEEP=1` preserves the temp tree
 * for postmortem.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

/** Client-facing bundles whose dependency closure defines a line's roster. */
const ROOTS = ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']

/** Version gate: the published spelling of a dsh release. */
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

// npm/pnpm resolve as .cmd on Windows: execFile without a shell cannot spawn
// them there (ENOENT) — the convention the rest of this repo follows.
const shell = process.platform === 'win32'
const log = message => { process.stderr.write(`roster: ${message}\n`) }

const requested = process.argv[2]
const metaFlag = process.argv.indexOf('--meta')
const metaPath = metaFlag === -1 ? undefined : process.argv[metaFlag + 1]
if (requested === undefined || (metaFlag !== -1 && metaPath === undefined)) {
  log('usage: node scripts/roster.mjs <dsh-version|dist-tag> [--meta <path>]')
  log('  version     e.g. 0.1.7-rc.1          — snapshots the exact version')
  log('  dist-tag    e.g. next | latest | alpha — resolves the tag against npm first')
  log('  --meta      also write the snapshot provenance header to <path>')
  process.exit(2)
}

/** Registry package whose dist-tags define the published channels (also what live.yml resolves). */
const CHANNEL_SOURCE = '@deepseek-ai/dsh'
const TAG = /^[a-z][a-z0-9-]*$/

/**
 * Resolve what to snapshot: an explicit version as given, or a dist-tag read
 * live from npm. A tag is resolved at snapshot time ON PURPOSE — a snapshot
 * whose filename says one version while `next` has since moved is exactly the
 * staleness this provenance exists to expose.
 * @returns the version plus how it was obtained, for the provenance header.
 */
function resolveRequested() {
  if (VERSION.test(requested)) return { version: requested, distTag: null, resolvedFrom: 'explicit version' }
  if (!TAG.test(requested)) throw new Error(`"${requested}" is neither a version nor a dist-tag name`)
  const out = execFileSync('npm', ['view', CHANNEL_SOURCE, `dist-tags.${requested}`], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], shell }).trim()
  if (!VERSION.test(out)) throw new Error(`${CHANNEL_SOURCE} has no dist-tag "${requested}" (npm printed ${JSON.stringify(out)})`)
  log(`${CHANNEL_SOURCE} dist-tags.${requested} -> ${out}`)
  return { version: out, distTag: requested, resolvedFrom: `${CHANNEL_SOURCE} dist-tags.${requested}` }
}

const work = mkdtempSync(join(tmpdir(), 'bmp-roster-'))
const keep = process.env['BMP_ROSTER_KEEP'] !== undefined

/**
 * Absolute manifest paths of every INSTALLED package under one `node_modules`
 * directory: `node_modules/<name>` or `node_modules/@scope/<name>`, plus the
 * same shape in any nested `node_modules`. Deliberately NOT a blind recursive
 * scan — a manifest buried inside a package's own payload (skill templates,
 * fixtures, examples) is shipped data, not an installed client row, and a
 * template that happens to declare `dsh.client` would otherwise be listed as a
 * harness package (observed: `@local/my-decoration`, a decoration template
 * under `@deepseek-ai/dsh-agent-preset/skills/…`, which is not on the registry
 * at all).
 * @param nodeModules - a `node_modules` directory.
 * @param seen - real paths already visited (dedup across nested trees).
 * @returns absolute package.json paths of installed packages.
 */
function installedManifests(nodeModules, seen = new Set()) {
  let real
  try {
    real = realpathSync(nodeModules)
  } catch {
    return []
  }
  if (seen.has(real)) return []
  seen.add(real)
  const found = []
  const packageAt = dir => {
    if (existsSync(join(dir, 'package.json'))) found.push(join(dir, 'package.json'))
    const nested = join(dir, 'node_modules')
    if (existsSync(nested)) found.push(...installedManifests(nested, seen))
  }
  for (const entry of readdirSync(nodeModules, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const path = join(nodeModules, entry.name)
    let isDirectory
    try {
      isDirectory = statSync(path).isDirectory()
    } catch {
      continue
    }
    if (!isDirectory) continue
    if (!entry.name.startsWith('@')) {
      packageAt(path)
      continue
    }
    for (const scoped of readdirSync(path, { withFileTypes: true })) {
      if (scoped.name.startsWith('.')) continue
      const dir = join(path, scoped.name)
      try {
        if (statSync(dir).isDirectory()) packageAt(dir)
      } catch {
        continue
      }
    }
  }
  return found
}

try {
  const { version, distTag, resolvedFrom } = resolveRequested()
  const packs = join(work, 'packs')
  const app = join(work, 'app')
  mkdirSync(packs, { recursive: true })
  mkdirSync(app, { recursive: true })

  const tarballs = []
  for (const name of ROOTS) {
    const spec = `${name}@${version}`
    const out = execFileSync('npm', ['pack', spec, '--pack-destination', packs], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], shell })
    const file = resolve(packs, out.trim().split('\n').pop() ?? '')
    // Extract every tarball too: the extracted manifest is the authority for
    // "this is the version asked for", independent of what the registry served.
    const into = join(work, name.replace('@deepseek-ai/', ''))
    mkdirSync(into, { recursive: true })
    execFileSync('tar', ['xzf', file, '-C', into], { stdio: 'pipe' })
    const manifest = JSON.parse(readFileSync(join(into, 'package', 'package.json'), 'utf8'))
    if (manifest.name !== name || manifest.version !== version) {
      throw new Error(`packed ${spec} but its manifest reads ${String(manifest.name)}@${String(manifest.version)}`)
    }
    log(`packed ${spec} -> ${file}`)
    tarballs.push(file)
  }

  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'bmp-roster-closure', private: true }, null, 1))
  // --legacy-peer-deps: the roster is the `dependencies` closure (see header);
  // npm's strict resolver cannot even build the 0.1.5-rc.3 tree.
  execFileSync('npm', ['install', '--legacy-peer-deps', '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock', ...tarballs], { cwd: app, stdio: 'pipe', shell })
  log(`installed the ${version} closure of ${ROOTS.join(' + ')}`)

  const files = installedManifests(join(app, 'node_modules'))
  const ids = new Set()
  for (const file of files) {
    let parsed
    try {
      parsed = JSON.parse(readFileSync(file, 'utf8'))
    } catch {
      continue
    }
    if (parsed.dsh?.client?.platform === 'web' && typeof parsed.name === 'string') ids.add(parsed.name)
  }
  const roster = [...ids].sort()
  log(`${files.length} manifests walked, ${roster.length} declare dsh.client.platform === "web"`)
  process.stdout.write(`${JSON.stringify(roster, null, 2)}\n`)

  if (metaPath !== undefined) {
    // The snapshot's provenance header: which dist-tag resolved to this version
    // and when, and the one command that reproduces both files. Written by the
    // same invocation that emitted the array, so the two cannot drift.
    const snapshot = `tests/rosters/dsh-${version}.json`
    const command = `node scripts/roster.mjs ${requested}${metaPath === undefined ? '' : ` --meta ${metaPath}`}`
    const meta = {
      snapshot,
      distTag,
      resolvedFrom,
      resolvedVersion: version,
      resolvedAt: new Date().toISOString(),
      rows: roster.length,
      command,
      regenerate: `${command} > ${snapshot}`,
    }
    writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`)
    log(`wrote ${metaPath}`)
  }
} catch (error) {
  log(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
} finally {
  if (keep) log(`kept ${work}`)
  else rmSync(work, { recursive: true, force: true })
}