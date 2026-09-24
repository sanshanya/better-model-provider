/**
 * Live integration gate — the manifest's ordering contract checked against the
 * composition actually served, not against a mock.
 *
 * Packs the publishable artifact, installs it into a throwaway profile beside
 * the real bundles, boots a REAL harness from a local checkout, then reads the
 * client entry graph out of the served document (`globalThis.__DSH_BOOT__`) and
 * holds four things to it: the plugin is a composed row, every `dsh.client.inject`
 * id names a row of that same graph, the retired `dsh-client-runtime` row is
 * absent, and the bytes served for the plugin's own row are its client bundle.
 * The graph is the authoritative advertisement — the shell executes it — so
 * there is no second scan of element attributes to disagree with it.
 *
 * For the CORE WORKFLOW over the same real boundary, see
 * `tests/functional.live.spec.ts`.
 *
 * Opt-in by design: set BMP_DSH_DIR to a DeepSeek Harness checkout with
 * `pnpm install` already run.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { liveBoot, liveBootAvailable } from './live-boot.ts'

/** Stable plugin id: the loader entry, the cordis row, and the combo resource name. */
const PLUGIN_ID = 'better-model-provider'

/**
 * Removed upstream between 0.1.1-rc.2 and 0.1.2-alpha.5. Its presence means the
 * booted graph is a generation this plugin does not claim — the failure the
 * retired id used to hide, which is why the absence is asserted rather than
 * assumed from the version string.
 */
const RETIRED_ID = '@deepseek-ai/dsh-client-runtime'

/** The manifest under test: `dsh.client.inject` is the ordering contract. */
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  dsh?: { client?: { inject?: string[] } }
}

/** One composed client row of the boot graph. */
interface BootRow {
  id: string
  url: string
}

/** The composed client entry graph. */
interface BootGraph {
  entries: BootRow[]
}

/**
 * The boot graph the served document inlines. Required, never optional: every
 * line this plugin claims inlines it, and it is the only place an inject id can
 * be checked against the composition the shell will really run.
 * @param page - the served document, entity-unescaped.
 * @returns the graph rows.
 */
function bootGraph(page: string): BootGraph {
  const match = /globalThis\["__DSH_BOOT__"\]\s*=\s*(\{[\s\S]*?\})\s*<\/script>/.exec(page)
  if (match?.[1] === undefined) throw new Error('the served document inlined no globalThis["__DSH_BOOT__"] graph')
  const parsed = JSON.parse(match[1]) as { entries?: unknown }
  if (!Array.isArray(parsed.entries)) throw new Error('the boot graph carries no entries array')
  const entries = parsed.entries.filter((row): row is BootRow =>
    typeof row === 'object' && row !== null
    && typeof (row as BootRow).id === 'string' && typeof (row as BootRow).url === 'string')
  return { entries }
}

describe.skipIf(!liveBootAvailable())('live harness integration', () => {
  test('the packed plugin registers in a freshly-booted profile', { timeout: 300_000 }, async () => {
    const boot = await liveBoot()
    try {
      // Gated harness generations refuse every request without the session
      // cookie; boot() already exchanged the printed token for one.
      const headers = boot.sessionCookie === '' ? {} : { Cookie: boot.sessionCookie }
      // Decode HTML-escaped ampersands ONCE over the whole page (combo URLs
      // arrive as `??a&amp;b&amp;rev=…`), then work with the plain text.
      const page = (await fetch(boot.baseUrl, { headers }).then(r => r.text()))
        .split('&amp;')
        .join('&')
      const graph = bootGraph(page)
      const ids = new Set(graph.entries.map(row => row.id))

      const row = graph.entries.find(entry => entry.id === PLUGIN_ID)
      expect(row, `${PLUGIN_ID} must be a composed row of the served graph`).toBeDefined()
      if (row === undefined) return

      const inject = manifest.dsh?.client?.inject ?? []
      expect(inject.length).toBeGreaterThan(0)
      expect(inject.filter(id => !ids.has(id))).toEqual([])
      expect(ids.has(RETIRED_ID)).toBe(false)

      const url = new URL(row.url, `${boot.baseUrl}/`).href
      const res = await fetch(url, { headers })
      expect(res.status).toBe(200)
      const body = await res.text()
      expect(body).toContain('window.__ModuleLoader__.load(')
      expect(body).toContain(PLUGIN_ID)

      console.log(`live integration: dsh ${boot.bundleVersion} profile=${boot.profileDir} graph=${graph.entries.length} rows inject=${inject.length}/${inject.length} resolved retired-absent served=${url}`)
    } finally {
      boot.dispose()
    }
  })
})
