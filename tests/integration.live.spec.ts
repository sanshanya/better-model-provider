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
      const page = await fetch(boot.url).then(r => r.text())
      expect(page).toContain('better-model-provider')
      const bundle = await fetch(`${boot.url}/plugins/better-model-provider/client.js`)
      expect(bundle.status).toBe(200)
      expect(await bundle.text()).toContain('window.__ModuleLoader__.load(')
    } finally {
      boot.dispose()
    }
  })
})
