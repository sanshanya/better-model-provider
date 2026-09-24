/**
 * Live integration gate: pack the publishable artifact, install it into a
 * throwaway profile beside the real bundles, boot a REAL harness from a
 * local checkout, and prove it serves the plugin's module. For the CORE
 * WORKFLOW over the same real boundary, see `tests/functional.live.spec.ts`.
 *
 * Opt-in by design: set BMP_DSH_DIR to a DeepSeek Harness checkout with
 * `pnpm install` already run.
 */
import { describe, expect, test } from 'vitest'
import { liveBoot, liveBootAvailable } from './live-boot.ts'

/** Stable plugin id: the loader entry, the cordis row, and the combo resource name. */
const PLUGIN_ID = 'better-model-provider'

/** One composed client row of the boot graph handed to the shell as `globalThis.__DSH_BOOT__`. */
interface BootRow {
  id: string
  url: string
}

/** The composed client entry graph (current protocol). */
interface BootGraph {
  entries: BootRow[]
}

/**
 * The boot graph a generation inlines into the served document, or undefined
 * on generations that advertise their bundles by element attributes alone.
 * Parsed leniently: an unparseable payload falls back to the attribute scan
 * instead of failing the gate for a shape this generation need not know.
 * @param page - the served document, entity-unescaped.
 * @returns the graph rows, or undefined when this generation inlines none.
 */
function bootGraph(page: string): BootGraph | undefined {
  const match = /globalThis\["__DSH_BOOT__"\]\s*=\s*(\{[\s\S]*?\})\s*<\/script>/.exec(page)
  if (match?.[1] === undefined) return undefined
  try {
    const parsed = JSON.parse(match[1]) as { entries?: unknown }
    if (!Array.isArray(parsed.entries)) return undefined
    const entries = parsed.entries.filter((row): row is BootRow =>
      typeof row === 'object' && row !== null
      && typeof (row as BootRow).id === 'string' && typeof (row as BootRow).url === 'string')
    return { entries }
  } catch {
    return undefined
  }
}

/**
 * Every URL the served document advertises for the plugin's client bundle,
 * resolved to absolute form. Generations disagree on spelling — per-entry
 * `/plugins/<id>/client.js?rev=…` attributes on older lines, and on the current
 * line ONE document-relative `plugins/??<ids…>&rev=…` combo referenced both
 * from `href`/`src` and from the inlined boot graph — so the page's own
 * advertisement stays the only stable address, exactly as before; what changed
 * is that a relative URL and the graph payload now count as advertisements
 * too. The claim is "our module is advertised and served", never "the URL
 * looks like the shape of some earlier year".
 * @param page - the served document, entity-unescaped.
 * @param graph - the parsed boot graph, when this generation inlines one.
 * @param baseUrl - the boot's origin, the resolution base for relative URLs.
 * @returns absolute URLs to fetch, de-duplicated, in advertisement order.
 */
function advertisedBundleUrls(page: string, graph: BootGraph | undefined, baseUrl: string): string[] {
  const advertised = new Set<string>()
  for (const row of graph?.entries ?? []) {
    if (row.id === PLUGIN_ID) advertised.add(row.url)
  }
  for (const match of page.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = match[1] ?? ''
    if (url.includes(`${PLUGIN_ID}/client.js`)) advertised.add(url)
  }
  return [...advertised].map(url => new URL(url, `${baseUrl}/`).href)
}

describe.skipIf(!liveBootAvailable())('live harness integration', () => {
  test('the packed plugin registers in a freshly-booted profile', { timeout: 300_000 }, async () => {
    const boot = await liveBoot()
    try {
      // Gated harness generations (master / ≥0.1.2-alpha.1) refuse every
      // request without the session cookie; pre-auth generations boot with
      // an empty sessionCookie and plain-fetch exactly as before.
      const headers = boot.sessionCookie === '' ? {} : { Cookie: boot.sessionCookie }
      // Decode HTML-escaped ampersands ONCE over the whole page (combo URLs
      // arrive as `??a&amp;b&amp;rev=…`), then work with the plain text.
      const page = (await fetch(boot.baseUrl, { headers }).then(r => r.text()))
        .split('&amp;')
        .join('&')
      expect(page).toContain(PLUGIN_ID)
      const graph = bootGraph(page)
      // On the current protocol the graph IS the advertisement: our package
      // must be a composed row there, not merely a string somewhere in the HTML.
      if (graph !== undefined) {
        expect(graph.entries.filter(row => row.id === PLUGIN_ID)).toHaveLength(1)
      }
      const advertised = advertisedBundleUrls(page, graph, boot.baseUrl)
      expect(advertised.length).toBeGreaterThan(0)
      console.log(`live integration: dsh ${boot.bundleVersion} profile=${boot.profileDir} graph=${graph === undefined ? 'absent' : `${String(graph.entries.length)} rows`} advertised=${advertised.join(' ')}`)
      let body = ''
      for (const url of advertised) {
        const res = await fetch(url, { headers })
        expect(res.status).toBe(200)
        body += await res.text()
      }
      expect(body).toContain('window.__ModuleLoader__.load(')
      expect(body).toContain(PLUGIN_ID)
    } finally {
      boot.dispose()
    }
  })
})
