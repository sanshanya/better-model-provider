/**
 * Manifest honesty: `dsh.client.inject` may only name rows that exist on EVERY
 * harness line this plugin claims, and the bundle's Cordis service list must
 * stay boot-safe. Both are invisible at runtime — an unknown inject id is
 * skipped silently (`packages/client/modules/src/client/system.ts` only arrives
 * an injected dependency `if (dependency !== undefined)`), and a pending client
 * fiber fails the WHOLE page (`packages/client/web/src/boot-client.ts:66-88`) —
 * so each is asserted here instead.
 *
 * ## How the injected rows are derived
 *
 * The bundle's Cordis `inject` (`src/client/index.ts`) names three SERVICES, and
 * each service is provided by one row; `dsh.client.inject` names those rows so
 * the host's module graph arrives the providers before this plugin:
 *
 * | service      | providing row                            | why |
 * |--------------|------------------------------------------|-----|
 * | `slots`      | `@deepseek-ai/dsh-client-ui-renderer`    | `SlotRegistry extends Service`, constructed and installed there (`ui-renderer/src/client/index.ts:45,86-95`) |
 * | `locale`     | `@deepseek-ai/dsh-client-locale`         | owns the dictionary registry this plugin registers into |
 * | `remote`     | `@deepseek-ai/dsh-api-gateway`           | installs the traced `remote.<ns>` carrier the sections read |
 *
 * `@deepseek-ai/dsh-client-connection` is deliberately NOT injected any more.
 * The page stopped reading `ctx.connection` when the ≤0.1.1 namespaced `api`
 * fallback was deleted (that face does not exist at 0.1.5-rc.3 or 0.1.7-rc.1),
 * and its one remaining use of that package is the `connection/reset` EVENT,
 * which needs no service dependency. The service is still provided in every
 * shipped profile — the web-app bundle mounts it itself
 * (`packages/bundle/web-app/cordis.patch.yml:197-198` at `dsh-v0.1.7-rc.1`) —
 * so the event keeps firing. Declaring a service this fiber never reads would
 * leave the fiber pending until that provider arrives, and a pending client
 * fiber fails the WHOLE page (`packages/client/web/src/boot-client.ts:66-88`).
 *
 * Three further rows do not provide a service of ours but must still be there:
 * `@deepseek-ai/dsh-api-remotes` MOUNTS the `remote.settings`/`remote.llm`
 * namespaces (the gateway alone carries no namespace), and the settings pair
 * `@deepseek-ai/dsh-client-ui-settings` (type contract for `settings.section`)
 * + `@deepseek-ai/dsh-client-ui-settings-general` (its runtime declarer and the
 * shell that renders the section) order the slot owner ahead of us.
 *
 * ## What this spec deliberately does NOT assert
 *
 * That each injected id is the RUNTIME DECLARER of the thing this plugin uses:
 * upstream does not enforce that convention (`ui-settings` owns only the
 * `settings.section` type contract while `ui-settings-general` declares the
 * runtime slot), so asserting it would invent a rule and fail on upstream's own
 * composition.
 *
 * @module better-model-provider/tests/manifest
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { inject as serviceInject } from '../src/client/index.ts'

// jsdom's `import.meta.url` is an http URL under vitest, so paths resolve from
// the repo root the runner is invoked in — exactly as the other specs read files.
const ROOT = process.cwd()
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
  name: string
  dsh: { client: { platform: string, inject: string[] } }
}
const injectRows: readonly string[] = pkg.dsh.client.inject

/** Row id -> the one line that justifies its presence (both directions asserted). */
const ROW_REASON: Readonly<Record<string, string>> = {
  '@deepseek-ai/dsh-client-ui-renderer': 'provides the `slots` service',
  '@deepseek-ai/dsh-client-locale': 'provides the `locale` service',
  '@deepseek-ai/dsh-api-gateway': 'provides the `remote` carrier',
  '@deepseek-ai/dsh-api-remotes': 'mounts the remote.settings/remote.llm namespaces',
  '@deepseek-ai/dsh-client-ui-settings': 'owns the settings.section type contract',
  '@deepseek-ai/dsh-client-ui-settings-general': 'declares and renders the settings.section slot',
}

/** Service name -> the row that provides it. */
const SERVICE_ROW: Readonly<Record<string, string>> = {
  slots: '@deepseek-ai/dsh-client-ui-renderer',
  locale: '@deepseek-ai/dsh-client-locale',
  remote: '@deepseek-ai/dsh-api-gateway',
}

/** The row upstream removed (present at dsh-v0.1.1-rc.2, gone by dsh-v0.1.2-alpha.5). */
const RETIRED_ROW = '@deepseek-ai/dsh-client-runtime'

/**
 * The service this bundle RETIRED: `connection` left the Cordis inject list and
 * `@deepseek-ai/dsh-client-connection` left `dsh.client.inject` together, when
 * the namespaced `api` generation was deleted. Asserted absent in both
 * directions so neither can come back alone.
 */
const RETIRED_SERVICE = 'connection'
const RETIRED_SERVICE_ROW = '@deepseek-ai/dsh-client-connection'

/** Every roster snapshot under `tests/rosters/`, keyed by file name. */
const rosters: ReadonlyMap<string, readonly string[]> = new Map(
  readdirSync(join(ROOT, 'tests/rosters'))
    .map(String)
    .filter(name => name.endsWith('.json') && !name.endsWith('.meta.json'))
    .sort()
    .map((name) => {
      const parsed: unknown = JSON.parse(readFileSync(join(ROOT, 'tests/rosters', name), 'utf8'))
      if (!Array.isArray(parsed) || parsed.some(row => typeof row !== 'string')) {
        throw new Error(`roster ${name} is not a JSON array of package ids`)
      }
      return [name, parsed as string[]] as const
    }),
)

/**
 * Inject ids a roster does not know: the assertion the negative control feeds a
 * dangling id through, so the check is proven able to fail.
 * @param ids - injected row ids.
 * @param roster - one line's client rows.
 * @returns the offending ids, in injection order.
 */
function unknownRows(ids: readonly string[], roster: readonly string[]): string[] {
  const known = new Set(roster)
  return ids.filter(id => !known.has(id))
}

describe('dsh.client.inject vs the harness rosters', () => {
  test('the snapshots cover at least the two claimed lines', () => {
    expect(rosters.size).toBeGreaterThanOrEqual(2)
    for (const [name, rows] of rosters) console.log(`${name}: ${String(rows.length)} client rows`)
  })

  test('names only rows that exist on EVERY claimed line', () => {
    for (const [name, rows] of rosters) {
      for (const id of injectRows) console.log(`  ${name}  ${rows.includes(id) ? 'in roster' : 'MISSING  '}  ${id}  (${ROW_REASON[id] ?? 'no stated reason'})`)
      expect(unknownRows(injectRows, rows), `${name} does not know these injected ids`).toEqual([])
    }
  })

  test('never names the row upstream removed', () => {
    for (const [name, rows] of rosters) expect(rows, `${name} still carries ${RETIRED_ROW}`).not.toContain(RETIRED_ROW)
    expect(injectRows).not.toContain(RETIRED_ROW)
  })

  test('leaves no injected row unexplained and no explanation orphaned', () => {
    expect([...injectRows].sort()).toEqual(Object.keys(ROW_REASON).sort())
  })

  test('maps every injected Cordis service to a row present on every line', () => {
    console.log(`bundle Cordis inject: ${serviceInject.join(', ')}`)
    for (const service of serviceInject) {
      const row = SERVICE_ROW[service]
      expect(row, `service "${service}" has no providing row in this spec`).toBeDefined()
      // Consistency, not declarer-ship: the service and its row are injected
      // together, so retiring one without the other fails here.
      expect(injectRows, `service "${service}" is injected but its row ${String(row)} is not`).toContain(row)
      for (const [name, rows] of rosters) expect(rows, `${name} does not carry ${String(row)}`).toContain(row)
    }
    for (const [service, row] of Object.entries(SERVICE_ROW)) {
      expect(serviceInject.includes(service), `row ${row} is injected without its service "${service}"`).toBe(injectRows.includes(row))
    }
  })

  test('the roster assertion rejects a dangling id (negative control)', () => {
    const [first] = [...rosters.values()]
    if (first === undefined) throw new Error('no roster snapshot to control against')
    expect(unknownRows([...injectRows, RETIRED_ROW], first)).toEqual([RETIRED_ROW])
    expect(unknownRows(injectRows, first)).toEqual([])
  })

  test('retires the connection service and its row together, on every line that has them', () => {
    // The pair left in one change when the namespaced `api` generation was
    // deleted: the page reads neither, and the shell provides the service
    // anyway. Asserted in BOTH directions so a partial revival fails here.
    expect(serviceInject).not.toContain(RETIRED_SERVICE)
    expect(injectRows).not.toContain(RETIRED_SERVICE_ROW)
    expect(Object.keys(SERVICE_ROW)).not.toContain(RETIRED_SERVICE)
    expect(Object.keys(ROW_REASON)).not.toContain(RETIRED_SERVICE_ROW)
    // ...while the ROW itself still exists upstream on every claimed line
    // (that is why its retirement is a choice, not a forced removal).
    for (const [name, rows] of rosters) {
      expect(rows, `${name} lost the connection row upstream`).toContain(RETIRED_SERVICE_ROW)
    }
  })
})