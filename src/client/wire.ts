/**
 * Remote assembly resolution for the browser half.
 *
 * The harness mounts the settings/llm namespaces as traced `remote.<ns>` Cordis
 * services whose generated clients take positional arguments and resolve the
 * slim `RemoteResult` envelope. The page consumes those shapes directly
 * (`types.ts`), so this module holds no call adapter: it decides WHEN the pair is
 * usable and hands it to `mount` exactly once.
 *
 * The service-side shapes are unchanged from 0.1.2-alpha.1 through the
 * 0.1.5-rc.3 and 0.1.7-rc.1 lines: `describe()`,
 * `mutate(ns, ops, expectedRevision)`, `listConfigurableProviders()` and
 * `discoverModels(settingsNs, request, signal?)`, all answering
 * `RemoteResult<…>` (`packages/api/settings-controller/lib/typert.remote-client.d.ts`
 * and `packages/llm/llm/lib/typert.remote-client.d.ts` at `dsh-v0.1.7-rc.1`).
 * The ≤0.1.1 `connection`-service generation is gone from this module: it does
 * not exist on any line this package claims (the service is
 * `ctx.provide('connection', handle)`,
 * `packages/client/connection/src/client/index.ts:310` at `dsh-v0.1.7-rc.1`), and
 * no lane this package runs could reach it.
 *
 * @module better-model-provider/wire
 */

import type { ClientShim, LlmRemote, RemoteApi, SettingsRemote, Unsubscribe } from './types.ts'

/** One probe of the harness Remote assembly's readiness for this page. */
type FaceProbe =
  /** Both namespaces answered; the pair is what the page speaks. */
  | { readonly kind: 'ready'; readonly api: RemoteApi }
  /** Exactly one answered; `awaiting` names the namespace still coming. */
  | { readonly kind: 'partial'; readonly awaiting: 'remote.llm' | 'remote.settings' }
  /** Neither namespace answered. */
  | { readonly kind: 'absent' }

/** The not-ready half of a probe. */
type FaceProbeNotReady = Exclude<FaceProbe, { readonly kind: 'ready' }>

/**
 * Probe the assembly once, BOTH namespaces before any conclusion: a half-born
 * pair — in EITHER mount order — reads as partial, so a page that lands
 * mid-sequence is never told "neither" while one side is already up. The probe
 * cannot ride `inject`: declaring either namespace on the plugin's fiber would
 * park that fiber until it mounts, and the mount order is asynchronous
 * (`packages/client/web/src/boot-client.ts:66-88` — a pending client fiber fails
 * the WHOLE page).
 */
function probeRemoteApi(ctx: ClientShim): FaceProbe {
  const settings = ctx.get('remote.settings') as SettingsRemote | undefined
  const llm = ctx.get('remote.llm') as LlmRemote | undefined
  if (settings !== undefined && llm !== undefined) return { kind: 'ready', api: { settings, llm } }
  if (settings !== undefined) return { kind: 'partial', awaiting: 'remote.llm' }
  if (llm !== undefined) return { kind: 'partial', awaiting: 'remote.settings' }
  return { kind: 'absent' }
}

/**
 * Cordis's service-arrival event (`vendor/cordis/src/events.ts:341`):
 * `ReflectService.notify` emits it once per changed service name, and
 * `fiber.ts` `_updateState` re-notifies a fiber's provided impls on its ACTIVE
 * transition — which is how a just-mounted `remote.<ns>` namespace announces
 * itself. The dynamic-plugin facade forwards `ctx.on` unfiltered
 * (`packages/extensions/cordis-client-runner/src/client/guard.ts`), and the
 * client runner opens no isolate realm, so a plain non-`global` listener
 * receives every arrival. The re-probe ignores the payload, like the Host
 * gateway's own claim-cache clear on ANY arrival
 * (`packages/api/gateway/src/index.ts:229-231`).
 */
const SERVICE_EVENT = 'internal/service'

/**
 * The ONE diagnostic an idle page ever emits: it names what has not arrived and
 * promises the self-healing follow-up, so one firing covers both the
 * boot-transient and the permanently-faceless reading without a second, louder
 * line. A PARTIAL observation accuses exactly the namespace that is missing.
 */
function notReadyWarning(probe: FaceProbeNotReady): string {
  return probe.kind === 'absent'
    ? 'better-model-provider: no harness Remote face is available yet — neither remote.settings nor remote.llm has arrived; the capabilities section stays idle and registers the moment the pair is announced'
    : `better-model-provider: ${probe.awaiting} has not arrived — the harness mounts its Remote namespaces sequentially; the capabilities section registers as soon as it does`
}

/**
 * Resolve the Remote face the PAGE speaks, gently: attempt once; if the assembly
 * is still mounting (the harness mounts its Remote namespaces SEQUENTIALLY, so a
 * synchronous apply can observe the pair half-born or not yet born), subscribe
 * to service arrivals and re-attempt until it completes, then `mount` exactly
 * once. This is the ONLY resolution variant, precisely because the mount path
 * must NOT throw: a synchronous apply can land inside that sequential window,
 * and throwing there fails the whole loader entry — registration defers instead.
 * NEVER throws: a face that never completes simply leaves the section
 * unregistered, with exactly ONE console warning fired at the first not-ready
 * observation (the latch is single-fire even when sequential arrivals flip the
 * awaited namespace mid-boot). A `mount` that throws is caught, logged ONCE via
 * console.error, and latched done — the arrival listener still unsubscribes,
 * later listeners on the same dispatch still fire (Cordis emits
 * `internal/service` with no try/catch), and the failure never escapes.
 * @param ctx - client root context (guarded dynamic facade).
 * @param mount - runs exactly once, the first time the face resolves.
 */
export function resolveRemoteApiGently(ctx: ClientShim, mount: (api: RemoteApi) => void): void {
  let warned = false
  // Latched BEFORE mount runs: exactly-once is structural, never a race
  // against a reentrant arrival emitted by mount's own contributions.
  let done = false
  const attempt = (): boolean => {
    if (done) return true
    const probe = probeRemoteApi(ctx)
    if (probe.kind !== 'ready') {
      if (!warned) {
        warned = true
        console.warn(notReadyWarning(probe))
      }
      return false
    }
    done = true
    try {
      mount(probe.api)
    } catch (error) {
      // The done latch already settled: exactly-once still holds, this is the
      // ONLY report, and no retry will ever fire.
      console.error(
        'better-model-provider: the Remote face resolved but mounting the capabilities section threw — the section stays unregistered rather than taking the harness dispatch down',
        error,
      )
    }
    return true
  }
  if (attempt()) return
  const off: Unsubscribe = ctx.on(SERVICE_EVENT, () => {
    if (attempt()) off()
  })
  // The real facade already hangs listeners on the calling fiber; the explicit
  // effect makes the retry's stop observable and disposes it with the fiber.
  ctx.effect(() => off, 'better-model-provider: remote face await')
}
