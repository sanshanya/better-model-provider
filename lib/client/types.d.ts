/**
 * The harness surfaces this page consumes.
 *
 * The page speaks the MOUNTED services' own shapes (`remote.settings` /
 * `remote.llm`): positional methods answering the contract's `RemoteResult`
 * envelope. Those generated declarations live in the per-namespace owner
 * packages this plugin does not depend on and name their interfaces with hashed
 * service keys, so the two shapes are projected here — the one place that knows
 * them, and what `wire.ts` probes for. Value types are imported straight from
 * `@deepseek-ai/dsh-api-remotes/client` at each consumer; this module re-exports
 * nothing, so a contract rename surfaces exactly where it is consumed.
 *
 * @module better-model-provider/types
 */
import type { LlmConfigurableProvider, LlmDiscoveredModel, LlmModelDiscoveryRequest, RemoteResult, SettingsDescribeValue, SettingsNamespaceView, SettingsPathOpView } from '@deepseek-ai/dsh-api-remotes/client';
/**
 * `remote.settings`: `describe` answers the redacted namespace descriptors,
 * `mutate` applies revision-fenced path ops positionally. `RemoteResult` is the
 * envelope the generated clients resolve — no outer `rpcId`/`result` wrapper —
 * whose failure arm carries `{code, message, details}` with the
 * slash-namespaced codes the host produces (`settings/conflict`,
 * `packages/api/settings-controller/src/index.ts:261` at `dsh-v0.1.7-rc.1`).
 */
export interface SettingsRemote {
    describe(): Promise<RemoteResult<SettingsDescribeValue>>;
    mutate(ns: string, ops: SettingsPathOpView[], expectedRevision?: number): Promise<RemoteResult<SettingsNamespaceView>>;
}
/**
 * `remote.llm`: the configurable directory and endpoint discovery. Both answer
 * BARE values — the provider array, and the model array with the namespace
 * lifted out of the request into the first positional argument.
 */
export interface LlmRemote {
    listConfigurableProviders(): Promise<RemoteResult<LlmConfigurableProvider[]>>;
    discoverModels(settingsNs: string, request: LlmModelDiscoveryRequest, signal?: AbortSignal): Promise<RemoteResult<LlmDiscoveredModel[]>>;
}
/** The Remote face the page speaks. */
export interface RemoteApi {
    settings: SettingsRemote;
    llm: LlmRemote;
}
/**
 * Wire failure codes this page branches on. The envelope's `code` is a plain
 * `string` upstream, so this union names what a branch may compare against —
 * never a closed world — and an unknown code stays representable and renders
 * through its `message`. Both members are the spellings the mounted host
 * produces (`settings/conflict`, `llm/model-discovery-rejected`).
 */
export type CapabilityWireCode = 'settings/conflict' | 'settings/rejected' | 'llm/model-discovery-rejected';
/** A wire code as carried: one this page knows, or any other the harness names. */
export type WireCode = CapabilityWireCode | (string & {});
/** A business failure carried out of a Remote envelope, its `code` kept for branch semantics. */
export declare class HarnessRpcError extends Error {
    readonly code: WireCode;
    /** The wire-level details payload, opaque to this page. */
    readonly details: object;
    constructor(code: WireCode, message: string, 
    /** The wire-level details payload, opaque to this page. */
    details: object);
}
/** Event disposer returned by any subscription call. */
export type Unsubscribe = () => void;
/** The `remote` client service: subscribe to forwarded host events. */
export interface RemoteFace {
    /** Settings document changed; carries the namespace and the new revision. */
    $on(event: 'settings/document-updated', handler: (ns: string, revision: number) => void): Unsubscribe;
    /** Route topology changed; no payload, refresh whatever the page renders. */
    $on(event: 'llm/adapters-updated', handler: () => void): Unsubscribe;
}
/** Locale dictionary registration shape. */
export interface LocaleFace {
    /** Register one namespace's dictionaries; `en` is the key source. */
    register(ns: string, dictionaries: Record<string, Record<string, string>>): Unsubscribe;
    /** Bind a translator for one namespace, fresh on locale change. */
    bind(ns: string): (key: string, params?: Record<string, string | number>) => string;
}
/** Slot registration entry this plugin writes. */
export interface SlotRegistration<I> {
    /** Slot name as declared by the shell. */
    name: string;
    /** Stable registration id. */
    id: string;
    /** Ordering hint inside the list (lower first). */
    order: number;
    /** Localized nav label thunk. */
    label: () => string;
    /** Props face thunk, called at render. */
    inject: () => I;
}
/** The `slots` client service rendering contributions. */
export interface SlotsFace {
    /** Register once the named slot's declared shape is on the ledger; returns the waiter's disposer. */
    inject(name: string, register: () => Unsubscribe | void): Unsubscribe;
    /**
     * Register one component at the named slot. The component receives the
     * injected face intersected with the shell's owner props (`close`), so a
     * prop-shape drift is a compile error here instead of a first-render break.
     */
    register<I, O>(options: SlotRegistration<I>, component: (props: I & O) => unknown): Unsubscribe;
}
/** Client-side effect/disposer seam used from the plugin's apply. */
export interface ClientEffectRegistrar {
    /** Register a side effect; its disposer runs on stop/unload. */
    effect(effect: () => Unsubscribe | void | Promise<Unsubscribe | void>, name?: string): void;
    /** Subscribe to a broadcast event; returns the disposer. */
    on(event: string, handler: (...args: readonly unknown[]) => void): Unsubscribe;
}
/** The client Cordis context as this plugin narrows it. */
export interface ClientShim extends ClientEffectRegistrar {
    /**
     * Optional service lookup: the dynamic-plugin facade allows `ctx.get` for
     * services NOT declared in inject — `wire.ts` depends on it to observe
     * `remote.settings` / `remote.llm` only where they exist, because declaring
     * either on the plugin's fiber would park it until that namespace mounts.
     */
    get(name: string): unknown;
    /** Pushed-event and Remote seam. */
    remote: RemoteFace;
    /** Locale registration seam. */
    locale: LocaleFace;
    /** Slot registry seam. */
    slots: SlotsFace;
}
