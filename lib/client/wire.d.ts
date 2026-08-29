/**
 * Dual-generation Remote adapter. dsh ≤0.1.1-rc.2 carries the settings/llm
 * namespaces on the `connection.api` face; dsh 0.1.2-alpha.1 (the current
 * harness master) installs them as traced `remote.<ns>` Cordis services whose
 * generated Typert proxies take positional arguments, rename `providers` to
 * `listConfigurableProviders`, and resolve the slimmer `RemoteResult`
 * envelope (no outer `rpcId`/`result` wrapper, values unboxed from their
 * `{providers}`/`{models}` carriers). The page logic keeps speaking ONE face
 * — {@link IRemoteApi}, the legacy published contract — so this module is the
 * only place in the plugin that knows both generations.
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
import type { ClientShim, IRemoteApi } from './types.ts';
/**
 * Resolve the Remote face this page speaks — STRICT variant: it throws when
 * neither generation answers or the alpha pair is incomplete. Correct for
 * callers that may fail loudly; the page mount path must NOT use it (a
 * synchronous apply can land inside the alpha's sequential-mount window, and
 * throwing there fails the whole loader entry — see resolveRemoteApiGently).
 * @param ctx - client root context (guarded dynamic facade).
 * @returns the legacy-shaped face whichever generation answers.
 */
export declare function resolveRemoteApi(ctx: ClientShim): IRemoteApi;
/**
 * Resolve the Remote face the PAGE speaks, gently: attempt once; if the
 * assembly is still mounting (dsh 0.1.2-alpha.1 mounts its Remote namespaces
 * SEQUENTIALLY — remote.settings lands before remote.llm, so a synchronous
 * apply can observe the pair half-born or not yet born), subscribe to
 * service arrivals and re-attempt until it completes, then `mount` exactly
 * once. NEVER throws: a face that never completes simply leaves the section
 * unregistered, with exactly ONE console warning — fired at the first
 * not-ready observation, whichever kind — so a permanently faceless harness
 * is diagnosable while boot-transient states never stack messages.
 * @param ctx - client root context (guarded dynamic facade).
 * @param mount - runs exactly once, the first time the face resolves.
 */
export declare function resolveRemoteApiGently(ctx: ClientShim, mount: (api: IRemoteApi) => void): void;
