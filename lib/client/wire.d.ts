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
import type { ClientShim, IRemoteApi } from './types.ts';
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
export declare function resolveRemoteApiGently(ctx: ClientShim, mount: (api: IRemoteApi) => void): void;
