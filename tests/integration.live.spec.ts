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
      expect(page).toContain('better-model-provider')
      // Plugin bundle URLs are rev-keyed and minted by the running
      // generation — current harnesses combine every client entry into ONE
      // `/plugins/??<ids…>&rev=…` batch (`packages/client/modules`), older
      // ones mint per-entry `?rev=` URLs — so the page's own advertisement
      // is the only stable address: follow every advertised URL that names
      // our module instead of hard-coding a shape.
      const advertised = [...page.matchAll(/(?:href|src)="(\/plugins\/[^"]+)"/g)]
        .map(match => match[1] ?? '')
        .filter(url => url.includes('better-model-provider/client.js'))
      expect(advertised.length).toBeGreaterThan(0)
      let body = ''
      for (const url of advertised) {
        const res = await fetch(`${boot.baseUrl}${url}`, { headers })
        expect(res.status).toBe(200)
        body += await res.text()
      }
      expect(body).toContain('window.__ModuleLoader__.load(')
      expect(body).toContain('better-model-provider')
    } finally {
      boot.dispose()
    }
  })
})
