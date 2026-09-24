/**
 * Remote adapter, current generation only. dsh installs the settings/llm
 * namespaces as traced `remote.<ns>` Cordis services whose generated Typert
 * proxies take positional arguments, rename `providers` to
 * `listConfigurableProviders`, and resolve the slim `RemoteResult` envelope
 * (no outer `rpcId`/`result` wrapper, values unboxed from their
 * `{providers}`/`{models}` carriers); owner failures ride that envelope's
 * error arm as `RemoteError` with the slash-namespaced codes. The page logic
 * keeps speaking ONE face — {@link IRemoteApi}, the carrier frame declared in
 * `types.ts` — so this module is the only place that knows the service-side
 * call shapes.
 *
 * The service-side shapes are unchanged from 0.1.2-alpha.1 through the
 * 0.1.5-rc.3 and 0.1.7-rc.1 lines: the generated clients at `dsh-v0.1.7-rc.1`
 * (`packages/api/settings-controller/lib/typert.remote-client.d.ts`,
 * `packages/llm/llm/lib/typert.remote-client.d.ts`) declare exactly
 * `describe()`, `mutate(ns, ops, expectedRevision)`,
 * `listConfigurableProviders()` and `discoverModels(settingsNs, request,
 * signal?)`, all answering `RemoteResult<…>`.
 *
 * The ≤0.1.1 generation is GONE from this module: namespaced `api` face does not
 * exist on any line this package claims (the service is
 * `ctx.provide('connection', handle)`,
 * `packages/client/connection/src/client/index.ts:310` at `dsh-v0.1.7-rc.1`,
 * and `git grep '\.api\b' dsh-v0.1.5-rc.3 -- packages/client/connection/src` is
 * empty), no lane this package runs could reach it, and the hyphen→slash code
 * fold it existed to serve was incomplete besides (it folded
 * `settings/conflict` while `settings/rejected`,
 * `llm/model-discovery-rejected`, `credential/rejected` and `gateway/*`
 * arrived unfolded).
 *
 * The service-side METHOD SIGNATURES stay projected here rather than
 * imported: the generated files live in the per-namespace owner packages this
 * plugin does not depend on and name their interfaces with hashed service
 * keys, while the page speaks ONE face. The projection is therefore pinned by
 * `tests/wire.client.spec.ts` against the runtime behavior of the services.
 * The ENVELOPE is not hand-declared: `RemoteResult` and `RemoteFailure` are
 * the published contract's own types, and the carrier frame reuses the
 * contract's `RpcResponse`/`RpcResult`.
 *
 * @module better-model-provider/wire
 */

import type {
  ClientShim, ConfigurableProviderView, DiscoveredModelView, IRemoteApi,
  RemoteFailure, RemoteResult, RpcId, RpcResponse, Unsubscribe, WireFailure,
} from './types.ts'

/** Legacy method aliases so the adapter's signatures stay upstream-derived, not re-typed. */
type DescribeFn = IRemoteApi['settings']['describe']
type MutateFn = IRemoteApi['settings']['mutate']
type ProvidersFn = IRemoteApi['llm']['providers']
type DiscoverFn = IRemoteApi['llm']['discoverModels']
type MutatePayload = Parameters<MutateFn>[0]
type DiscoverPayload = Parameters<DiscoverFn>[0]

/** The business value one legacy face method's success envelope carries. */
type PageValue<F extends (...args: never[]) => unknown> =
  Awaited<ReturnType<F>> extends RpcResponse<infer V> ? V : never

/**
 * Face projection of the `remote.settings` Cordis service
 * (`packages/api/settings-controller/lib/typert.remote-client.d.ts` at
 * `dsh-v0.1.7-rc.1`): `describe` drops its validated-empty payload entirely,
 * `mutate` goes positional. Value shapes derive from the page's own face.
 */
interface SettingsServiceFace {
  describe(): Promise<RemoteResult<PageValue<DescribeFn>>>
  mutate(
    ns: MutatePayload['ns'],
    ops: MutatePayload['ops'],
    expectedRevision: MutatePayload['expectedRevision'],
  ): Promise<RemoteResult<PageValue<MutateFn>>>
}

/**
 * Face projection of the `remote.llm` Cordis service
 * (`packages/llm/llm/lib/typert.remote-client.d.ts` at `dsh-v0.1.7-rc.1`):
 * `providers` is renamed `listConfigurableProviders` and answers the BARE
 * provider array; `discoverModels` takes the namespace positionally with the
 * remaining draft fields as its request, answering the BARE models array.
 */
interface LlmServiceFace {
  listConfigurableProviders(): Promise<RemoteResult<ConfigurableProviderView[]>>
  discoverModels(
    settingsNs: DiscoverPayload['settingsNs'],
    request: Omit<DiscoverPayload, 'settingsNs'>,
    signal?: AbortSignal,
  ): Promise<RemoteResult<DiscoveredModelView[]>>
}

/**
 * The ONE carrier id for every re-framed envelope: the carrier frame this page
 * speaks REQUIRES an `rpcId` echo, but nothing consumes its uniqueness —
 * business code only ever logs it — so a per-call counter was state without
 * semantics, and a plain constant reads as exactly what it is.
 */
const CARRIER_RPC_ID = 'bmp-carrier' as RpcId

/**
 * Carry one service-side failure into the carrier failure frame fieldwise,
 * never as a spread: a `RemoteError` instance has its `message`
 * Error-inherited and non-enumerable, so `{...error}` would silently drop it.
 * The code travels UNTRANSLATED — the page compares the current spellings the
 * host produces — and the CAS details (`{ns, expected, actual}`) cross as they
 * are, so the store's conflict branch stays put.
 */
function toCarrierError(error: RemoteFailure): WireFailure {
  return {
    code: error.code,
    message: error.message,
    details: error.details,
  }
}

/**
 * Re-wrap the slim service envelope as the carrier frame the page's `unwrap`
 * reads: stamp the shared `rpcId` echo the service envelope does not carry,
 * box the value arm, and carry the failure arm across fieldwise.
 */
function toCarrierFrame<T>(call: Promise<RemoteResult<T>>): Promise<RpcResponse<T>> {
  return call.then(result =>
    result.ok
      ? { rpcId: CARRIER_RPC_ID, result }
      : { rpcId: CARRIER_RPC_ID, result: { ok: false, error: toCarrierError(result.error) } },
  )
}

/** Map the success arm of one service call, forwarding the failure arm untouched. */
async function mapOk<T, U>(call: Promise<RemoteResult<T>>, f: (value: T) => U): Promise<RemoteResult<U>> {
  const result = await call
  return result.ok ? { ok: true, value: f(result.value) } : result
}

/**
 * Adapt one complete service pair onto the face the page speaks. Both services
 * mount under one namespace fiber's ACTIVE transition, so a probe that sees
 * them together sees them fully usable.
 */
function adaptServices(settingsService: SettingsServiceFace, llmService: LlmServiceFace): IRemoteApi {
  // `describe`'s payload is the validated-empty `{}` and its signal bounded
  // only the page's carrier, so neither crosses: the service method is
  // parameterless by its generated declaration.
  const describe: DescribeFn = (_payload, _signal) =>
    toCarrierFrame(settingsService.describe())

  const mutate: MutateFn = (payload, _signal) =>
    toCarrierFrame(settingsService.mutate(payload.ns, payload.ops, payload.expectedRevision))

  const providers: ProvidersFn = (_payload, _signal) =>
    toCarrierFrame(mapOk(llmService.listConfigurableProviders(), list => ({ providers: list })))

  const discoverModels: DiscoverFn = (payload, signal) => {
    const { settingsNs, ...request } = payload
    return toCarrierFrame(mapOk(llmService.discoverModels(settingsNs, request, signal), models => ({ models })))
  }

  return {
    settings: { describe, mutate },
    llm: { providers, discoverModels },
  }
}

/** One probe of the harness Remote assembly's readiness for this page. */
type FaceProbe =
  /** A complete face answered; `api` already speaks the page's carrier frame. */
  | { readonly kind: 'ready'; readonly api: IRemoteApi }
  /** Exactly one of the pair answered; `awaiting` names the namespace still coming. */
  | { readonly kind: 'partial'; readonly awaiting: 'remote.llm' | 'remote.settings' }
  /** Neither namespace answered. */
  | { readonly kind: 'absent' }

/** The not-ready half of a probe: either a partial pair or nothing at all. */
type FaceProbeNotReady = Extract<FaceProbe, { readonly kind: 'partial' | 'absent' }>

/**
 * Probe the Remote assembly once. BOTH remotes are inspected before any
 * conclusion, so a half-born pair — in EITHER mount order — reads as partial
 * (naming the namespace still coming) and is never reported as faceless while
 * one side is already up. The probe cannot ride `inject`: declaring
 * `remote.settings` or `remote.llm` on the plugin's own fiber would park that
 * fiber until the namespace mounts, and the mount order is asynchronous.
 */
function probeRemoteApi(ctx: ClientShim): FaceProbe {
  const settingsService = ctx.get('remote.settings') as SettingsServiceFace | undefined
  const llmService = ctx.get('remote.llm') as LlmServiceFace | undefined
  if (settingsService !== undefined && llmService !== undefined) {
    return { kind: 'ready', api: adaptServices(settingsService, llmService) }
  }
  if (settingsService !== undefined) return { kind: 'partial', awaiting: 'remote.llm' }
  if (llmService !== undefined) return { kind: 'partial', awaiting: 'remote.settings' }
  return { kind: 'absent' }
}

/**
 * Cordis's service-arrival event: `ReflectService.notify` emits it once per
 * changed service name (vendor/cordis/src/reflect.ts — `provide` notifies,
 * and fiber.ts `_updateState` re-notifies a fiber's provided impls on its
 * ACTIVE transition, which is how a just-mounted `remote.<ns>` namespace
 * announces itself); declared at vendor/cordis/src/events.ts:341. The
 * dynamic-plugin facade forwards `ctx.on` with NO name filtering
 * (packages/extensions/cordis-client-runner/src/client/guard.ts: `on` is a
 * CTX_VERB applied onto the real context), and because the client runner
 * opens no isolate realm, the default notify filter resolves provider and
 * listener to the same root isolate symbol — a plain, non-`global` listener
 * receives every arrival. The payload-agnostic re-probe mirrors master
 * itself: the Host gateway clears its claim cache on ANY arrival
 * (packages/api/gateway/src/index.ts:199), and the agent-presets invariant
 * is the reading-the-`name`-argument precedent
 * (packages/preset/agent-presets/src/invariant.ts:34).
 */
const SERVICE_EVENT = 'internal/service'

/**
 * The ONE diagnostic an idle page ever emits. Each not-ready kind is
 * transient on a healthy boot (the pair is mid-sequence or not yet started)
 * and permanent on a harness with no Remote layer at all, so every message
 * names what is missing AND promises the self-healing follow-up — one firing
 * covers both readings without a second, louder line. A PARTIAL observation
 * accuses exactly the namespace that has not answered (whichever of the two
 * that is — the harness mounts the pair sequentially in one order, but a page
 * that lands mid-sequence must never be told "neither" while one side is
 * already up).
 */
function notReadyWarning(probe: FaceProbeNotReady): string {
  if (probe.kind === 'absent') {
    return 'better-model-provider: no harness Remote face is available yet — the remote.settings/remote.llm pair has not arrived; the capabilities section stays idle and registers the moment it is announced'
  }
  return probe.awaiting === 'remote.llm'
    ? 'better-model-provider: remote.settings answered but remote.llm has not — the harness mounts its Remote namespaces sequentially; the capabilities section registers as soon as remote.llm arrives'
    : 'better-model-provider: remote.llm answered but remote.settings has not — the harness mounts its Remote namespaces sequentially; the capabilities section registers as soon as remote.settings arrives'
}

/**
 * Resolve the Remote face the PAGE speaks, gently: attempt once; if the
 * assembly is still mounting (the harness mounts its Remote namespaces
 * SEQUENTIALLY — remote.settings lands before remote.llm, so a synchronous
 * apply can observe the pair half-born or not yet born), subscribe to
 * service arrivals and re-attempt until it completes, then `mount` exactly
 * once. This is the ONLY resolution variant, precisely because the mount
 * path must NOT throw: a synchronous apply can land inside that sequential
 * window, and throwing there fails the whole loader entry — registration
 * defers instead. NEVER throws: a face that never completes simply leaves
 * the section unregistered, with exactly ONE console warning — fired at the
 * first not-ready observation, whichever kind — so a permanently faceless
 * harness is diagnosable while boot-transient states never stack messages.
 * The warned-once latch is single-fire even when sequential arrivals flip
 * the awaited namespace mid-boot (remote.llm answering first, say): the
 * first observation's line is the only one ever printed. A `mount` that
 * throws is caught, logged ONCE via console.error, and latched done — the
 * arrival listener still unsubscribes, later listeners on the same dispatch
 * still fire (Cordis emits `internal/service` with no try/catch), and the
 * failure never escapes this entry.
 * @param ctx - client root context (guarded dynamic facade).
 * @param mount - runs exactly once, the first time the face resolves.
 */
export function resolveRemoteApiGently(ctx: ClientShim, mount: (api: IRemoteApi) => void): void {
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
  // The real facade already hangs listeners on the calling fiber; the
  // explicit effect makes the retry's stop observable and test-double-able.
  ctx.effect(() => off, 'better-model-provider: remote face await')
}
