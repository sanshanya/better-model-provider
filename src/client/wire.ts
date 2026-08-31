/**
 * Dual-generation Remote adapter. dsh ≤0.1.1-rc.2 carries the settings/llm
 * namespaces on the `connection.api` face; dsh 0.1.2-alpha.1 installs them as
 * traced `remote.<ns>` Cordis services whose generated Typert proxies take
 * positional arguments, rename `providers` to `listConfigurableProviders`,
 * and resolve the slimmer `RemoteResult` envelope (no outer `rpcId`/`result`
 * wrapper, values unboxed from their `{providers}`/`{models}` carriers);
 * 0.1.2-alpha.2 then wraps owner failures in `RemoteError` and rebadges the
 * hyphen codes into slash namespaces. The page logic keeps speaking ONE face
 * — {@link IRemoteApi}, the legacy published contract, with those renames
 * folded back — so this module is the only place that knows both generations.
 *
 * The alpha-generation METHOD SIGNATURES are hand-projected here from the
 * generated clients in the harness checkout: the npm-published
 * `@deepseek-ai/dsh-api-remotes` predates the refactor (see the
 * peer-dependency note in package.json), so typecheck can only pin the legacy
 * branch directly. The VALUE shapes need no projection — both generations
 * serve the same views — so the alpha faces below derive theirs from the
 * legacy method types, and `tests/wire.client.spec.ts` pins every projected
 * signature against the runtime behavior of both generations.
 *
 * @module better-model-provider/wire
 */

import type {
  ClientShim, ConfigurableProviderView, DiscoveredModelView, IRemoteApi,
  RpcError, RpcId, RpcResponse, Unsubscribe,
} from './types.ts'

/**
 * Slim Remote failure carried by the alpha generation's error branch: a
 * code-discriminated `RemoteError` union instance since alpha.2, wire-cardinal
 * `code`/`message`/`details` fields throughout both alphas.
 */
interface AlphaRemoteFailure {
  readonly code: string
  readonly message: string
  readonly details: object
}

/** `RemoteResult<T>` of the alpha.1 generation: no `rpcId`, no `result` wrapper. */
type AlphaRemoteResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: AlphaRemoteFailure }

/** Legacy method aliases so the adapter's signatures stay upstream-derived, not re-typed. */
type DescribeFn = IRemoteApi['settings']['describe']
type MutateFn = IRemoteApi['settings']['mutate']
type ProvidersFn = IRemoteApi['llm']['providers']
type DiscoverFn = IRemoteApi['llm']['discoverModels']
type MutatePayload = Parameters<MutateFn>[0]
type DiscoverPayload = Parameters<DiscoverFn>[0]

/** The business value one legacy face method's success envelope carries. */
type LegacyValue<F extends (...args: never[]) => unknown> =
  Awaited<ReturnType<F>> extends RpcResponse<infer V> ? V : never

/**
 * Face projection of the alpha.1 `remote.settings` Cordis service
 * (`packages/api/settings-controller/lib/typert.remote-client.d.ts`):
 * `describe` drops its validated-empty payload entirely, `mutate` goes
 * positional. Value shapes derive from the legacy contract.
 */
interface AlphaSettingsRemote {
  describe(): Promise<AlphaRemoteResult<LegacyValue<DescribeFn>>>
  mutate(
    ns: MutatePayload['ns'],
    ops: MutatePayload['ops'],
    expectedRevision: MutatePayload['expectedRevision'],
  ): Promise<AlphaRemoteResult<LegacyValue<MutateFn>>>
}

/**
 * Face projection of the alpha.1 `remote.llm` Cordis service
 * (`packages/llm/llm/lib/typert.remote-client.d.ts`): `providers` is renamed
 * `listConfigurableProviders` and answers the BARE provider array;
 * `discoverModels` takes the namespace positionally with the remaining draft
 * fields as its request, answering the BARE models array.
 */
interface AlphaLlmRemote {
  listConfigurableProviders(): Promise<AlphaRemoteResult<ConfigurableProviderView[]>>
  discoverModels(
    settingsNs: DiscoverPayload['settingsNs'],
    request: Omit<DiscoverPayload, 'settingsNs'>,
    signal?: AbortSignal,
  ): Promise<AlphaRemoteResult<DiscoveredModelView[]>>
}

/**
 * The ONE carrier id for every synthetic envelope: the legacy RpcResponse
 * frame REQUIRES an `rpcId` echo, but nothing consumes its uniqueness —
 * business code only ever logs it — so a per-call counter was state
 * without semantics, and a plain constant reads as exactly what it is.
 */
const ALPHA_RPC_ID = 'bmp-alpha' as RpcId

/**
 * alpha.2 rebadged the hyphen wire codes into slash namespaces
 * (`settings-conflict` → `settings/conflict`) with details unchanged; the
 * page branches on the legacy union, so the adapter folds the renames back.
 */
const ALPHA_TO_LEGACY_CODES: Readonly<Record<string, RpcError['code']>> = {
  'settings/conflict': 'settings-conflict',
}

/** Fold an alpha failure into the legacy RpcError frame: translate the renamed codes, carry message/details. */
function toLegacyError(error: AlphaRemoteFailure): RpcError {
  // Fieldwise, never a spread: alpha.2's RemoteError instance has its `message`
  // Error-inherited and non-enumerable, so `{...error}` would silently drop it.
  return {
    code: ALPHA_TO_LEGACY_CODES[error.code] ?? error.code,
    message: error.message,
    details: error.details,
  } as RpcError
}

/**
 * Re-wrap the slim alpha envelope as the legacy carrier frame the page's
 * `unwrap` reads: stamp the shared `rpcId` echo the alpha no longer
 * carries, box the value arm, and translate the failure arm. The CAS details
 * (`{ns, expected, actual}`) survive the code rename untouched, so the
 * store's conflict branch stays put.
 */
function toLegacyEnvelope<T>(call: Promise<AlphaRemoteResult<T>>): Promise<RpcResponse<T>> {
  return call.then(result =>
    result.ok
      ? { rpcId: ALPHA_RPC_ID, result }
      : { rpcId: ALPHA_RPC_ID, result: { ok: false, error: toLegacyError(result.error) } },
  )
}

/** Map the success arm of one alpha call, forwarding the failure arm untouched. */
async function mapOk<T, U>(call: Promise<AlphaRemoteResult<T>>, f: (value: T) => U): Promise<AlphaRemoteResult<U>> {
  const result = await call
  return result.ok ? { ok: true, value: f(result.value) } : result
}

/**
 * Adapt one complete alpha-generation pair into the legacy-shaped face. Both
 * services mount under one namespace fiber's ACTIVE transition, so a probe
 * that sees them together sees them fully usable.
 */
function adaptAlpha(alphaSettings: AlphaSettingsRemote, alphaLlm: AlphaLlmRemote): IRemoteApi {
  // `describe`'s payload is the validated-empty `{}` and its signal bounded
  // only the legacy carrier, so neither crosses: the alpha method is
  // parameterless by its generated declaration.
  const describe: DescribeFn = (_payload, _signal) =>
    toLegacyEnvelope(alphaSettings.describe())

  const mutate: MutateFn = (payload, _signal) =>
    toLegacyEnvelope(alphaSettings.mutate(payload.ns, payload.ops, payload.expectedRevision))

  const providers: ProvidersFn = (_payload, _signal) =>
    toLegacyEnvelope(mapOk(alphaLlm.listConfigurableProviders(), list => ({ providers: list })))

  const discoverModels: DiscoverFn = (payload, signal) => {
    const { settingsNs, ...request } = payload
    return toLegacyEnvelope(mapOk(alphaLlm.discoverModels(settingsNs, request, signal), models => ({ models })))
  }

  return {
    settings: { describe, mutate },
    llm: { providers, discoverModels },
  }
}

/** One probe of the harness Remote assembly's readiness for this page. */
type FaceProbe =
  /** A complete face answered; `api` already speaks the legacy shape. */
  | { readonly kind: 'ready'; readonly api: IRemoteApi }
  /** Exactly one of the 0.1.2-alpha.1 pair answered; `awaiting` names the namespace still coming. */
  | { readonly kind: 'partial'; readonly awaiting: 'remote.llm' | 'remote.settings' }
  /** Neither generation answered. */
  | { readonly kind: 'absent' }

/** The not-ready half of a probe: either a partial pair or nothing at all. */
type FaceProbeNotReady = Extract<FaceProbe, { readonly kind: 'partial' | 'absent' }>

/**
 * Probe the Remote assembly once, alpha generation first. BOTH alpha
 * remotes are inspected before the legacy face is consulted, so a
 * half-born pair — in EITHER mount order — reads as partial (naming the
 * namespace still coming) and is never mistaken for a legacy-only or
 * faceless harness. The probe cannot ride `inject`: declaring
 * `remote.settings` on a ≤0.1.1 harness would park the plugin forever,
 * since that service is only born on 0.1.2.
 */
function probeRemoteApi(ctx: ClientShim): FaceProbe {
  const alphaSettings = ctx.get('remote.settings') as AlphaSettingsRemote | undefined
  const alphaLlm = ctx.get('remote.llm') as AlphaLlmRemote | undefined
  if (alphaSettings !== undefined && alphaLlm !== undefined) {
    return { kind: 'ready', api: adaptAlpha(alphaSettings, alphaLlm) }
  }
  if (alphaSettings !== undefined) return { kind: 'partial', awaiting: 'remote.llm' }
  if (alphaLlm !== undefined) return { kind: 'partial', awaiting: 'remote.settings' }
  const legacy = ctx.connection.api
  return legacy === undefined ? { kind: 'absent' } : { kind: 'ready', api: legacy }
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
 * transient on a healthy master boot (the alpha pair is mid-sequence or not
 * yet started) and permanent on a harness with no Remote layer at all, so
 * every message names what is missing AND promises the self-healing
 * follow-up — one firing covers both readings without a second, louder line.
 * A PARTIAL observation accuses exactly the namespace that has not answered
 * (whichever of the two that is — the alpha mounts the pair sequentially in
 * one order, but a page that lands mid-sequence must never be told
 * "neither" while one side is already up).
 */
function notReadyWarning(probe: FaceProbeNotReady): string {
  if (probe.kind === 'absent') {
    return 'better-model-provider: no harness Remote face is available yet — neither the remote.settings/remote.llm pair (dsh ≥0.1.2) nor connection.api (dsh ≤0.1.1) has arrived; the capabilities section stays idle and registers the moment either is announced'
  }
  return probe.awaiting === 'remote.llm'
    ? 'better-model-provider: remote.settings answered but remote.llm has not — dsh ≥0.1.2 mounts its Remote namespaces sequentially; the capabilities section registers as soon as remote.llm arrives'
    : 'better-model-provider: remote.llm answered but remote.settings has not — dsh ≥0.1.2 mounts its Remote namespaces sequentially; the capabilities section registers as soon as remote.settings arrives'
}

/**
 * Resolve the Remote face the PAGE speaks, gently: attempt once; if the
 * assembly is still mounting (dsh 0.1.2-alpha.1 mounts its Remote namespaces
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
