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
import type { ClientShim, IRemoteApi } from './types.ts';
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
export declare function resolveRemoteApiGently(ctx: ClientShim, mount: (api: IRemoteApi) => void): void;
