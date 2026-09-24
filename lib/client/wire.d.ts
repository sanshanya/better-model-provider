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
import type { ClientShim, RemoteApi } from './types.ts';
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
export declare function resolveRemoteApiGently(ctx: ClientShim, mount: (api: RemoteApi) => void): void;
