/**
 * Wire-surface types this plugin consumes, DERIVED from the published harness
 * client contract (`@deepseek-ai/dsh-api-remotes/client`, devDependencies)
 * rather than hand-declared: the view shapes, carrier envelopes, and Remote
 * value types below ARE the upstream contract, so a harness-side drift is a
 * compile error in `npm run typecheck`, not a browser surprise — and
 * `scripts/verify-contract.mjs` additionally proves every specifier resolves to
 * a real declaration, which `skipLibCheck` alone would hide.
 *
 * Two surfaces live here and must not be confused:
 *
 * - the `RemoteResult` envelope the `remote.<ns>` Cordis services answer
 *   (`wire.ts` projects their generated positional signatures and re-frames
 *   them for the page);
 * - the carrier frame `RpcResponse`/`RpcResult`, which this page speaks
 *   internally and `wire.ts` re-builds for that adapted response.
 *
 * Both are CURRENT contract types. The page's carrier frame is not a legacy
 * artifact: `RpcResponse`/`RpcResult` are published by
 * `@deepseek-ai/dsh-client-connection` at 0.1.7 and re-exported by the remotes
 * entry this module imports (see `verify-contract`'s resolved-file report); it
 * is the shape that carries an explicit `rpcId` echo alongside the result, so
 * the page keeps one frame across every call it makes. What this package no
 * longer carries is the ≤0.1.1 namespaced `api` generation, which stopped
 * existing upstream by 0.1.5 (the service is `ctx.provide('connection',
 * handle)`, `packages/client/connection/src/client/index.ts:310` at
 * `dsh-v0.1.7-rc.1`) and which no lane this package runs could exercise.
 *
 * The import is type-only — erased by every build, so the served bundle still
 * depends on nothing but the harness services it consumes at runtime.
 *
 * @module better-model-provider/types
 */

import type {
  LlmConfigurableProvider, LlmDiscoveredModel, LlmModelDiscoveryRequest,
  RemoteFailure, RemoteResult, RpcId, RpcResponse, RpcResult,
  SettingsDescribeValue, SettingsNamespaceView, SettingsPathOpView,
} from '@deepseek-ai/dsh-api-remotes/client'

export type {
  LlmConfigurableProvider, LlmDiscoveredModel, LlmModelDiscoveryRequest,
  RemoteFailure, RemoteResult, RpcId, RpcResponse, RpcResult,
  SettingsDescribeValue, SettingsNamespaceView, SettingsPathOpView,
}

/**
 * One JSON value as the settings document carries it, derived from the
 * contract's own write op (the `set` arm of `SettingsPathOpView`) rather than
 * imported from the value package underneath it: every staged row, leaf, and
 * op payload this page builds was serialized into the document by the harness
 * to begin with.
 */
export type WireJson = Extract<SettingsPathOpView, { op: 'set' }>['value']

/**
 * The two view names this page's own code speaks. Upstream renamed the shapes
 * at 0.1.2 (`ConfigurableProviderView` → {@link LlmConfigurableProvider},
 * `DiscoveredModelView` → {@link LlmDiscoveredModel}); the aliases keep ONE
 * vocabulary inside the page while every fact still comes from the contract.
 * They retire in the package that renames their consumers.
 */
export type ConfigurableProviderView = LlmConfigurableProvider
/** @see ConfigurableProviderView */
export type DiscoveredModelView = LlmDiscoveredModel

/**
 * The failure arm of one carrier frame, derived from the contract's own
 * `RpcResult` rather than re-declared: `{code, message, details}` with `code` a
 * plain wire string (`packages/client/connection/src/rpc.ts`,
 * `ConnectionRpcFailure`).
 */
export type WireFailure = Extract<RpcResult<unknown>, { readonly ok: false }>['error']

/**
 * Wire failure codes this page's logic keys on. The carrier's `code` is a
 * plain `string` upstream, so this union names what a branch may compare
 * against — never a closed world — and an unknown code stays representable and
 * renders through its `message`. Both members are the CURRENT spellings the
 * mounted host produces: `settings/conflict`
 * (`packages/api/settings-controller/src/index.ts:261` at `dsh-v0.1.7-rc.1`)
 * and `llm/model-discovery-rejected` (`packages/llm/llm/src/index.ts:642`).
 * The hyphen spellings belong to the retired pre-0.1.2 wire and are not
 * comparable here.
 */
export type CapabilityWireCode = 'settings/conflict' | 'settings/rejected' | 'llm/model-discovery-rejected'

/**
 * A wire code as carried: one of the codes this page knows, or any other code
 * the harness names.
 */
export type WireCode = CapabilityWireCode | (string & {})

/**
 * A business failure carried out of a Remote envelope, with the wire `code`
 * retained for callers that branch on semantics (e.g. `settings/conflict`).
 */
export class HarnessRpcError extends Error {
  constructor(
    /** The wire-level error code, narrowed to the codes this page knows. */
    readonly code: WireCode,
    message: string,
    /** The wire-level details payload, opaque to this page. */
    readonly details: object,
  ) {
    super(message)
    this.name = 'HarnessRpcError'
  }
}

/**
 * Argument bundle of one `settings.mutate` call on the page's carrier face; the
 * mounted `remote.settings` service takes the same three values positionally
 * (`wire.ts` spreads them back out).
 */
export interface MutatePayload {
  ns: string
  ops: SettingsPathOpView[]
  expectedRevision?: number
}

/**
 * Argument bundle of one `llm.discoverModels` call: the harness namespace plus
 * the discovery request that the mounted `remote.llm` service splits out as its
 * second positional argument.
 */
export interface DiscoverPayload extends LlmModelDiscoveryRequest {
  settingsNs: string
}

/**
 * The `settings` methods this page calls: `describe` answers the redacted
 * namespace descriptors, `mutate` applies revision-fenced path ops.
 */
export interface SettingsRemoteApi {
  describe(payload: Record<string, never>, signal?: AbortSignal): Promise<RpcResponse<SettingsDescribeValue>>
  mutate(payload: MutatePayload, signal?: AbortSignal): Promise<RpcResponse<SettingsNamespaceView>>
}

/**
 * The `llm` methods this page calls: `providers` answers the configurable
 * directory, `discoverModels` interrogates one endpoint draft.
 */
export interface LlmRemoteApi {
  providers(payload: Record<string, never>, signal?: AbortSignal): Promise<RpcResponse<{ providers: LlmConfigurableProvider[] }>>
  discoverModels(payload: DiscoverPayload, signal?: AbortSignal): Promise<RpcResponse<{ models: LlmDiscoveredModel[] }>>
}

/**
 * The Remote face this plugin calls, speaking ONE shape: the page's carrier
 * frame, with the mounted `remote.<ns>` services' generated positional methods
 * adapted onto it by `wire.ts`.
 */
export interface IRemoteApi {
  settings: SettingsRemoteApi
  llm: LlmRemoteApi
}

/** Event disposer returned by any subscription call. */
export type Unsubscribe = () => void

/** The `remote` client service: subscribe to forwarded host events. */
export interface RemoteFace {
  /** Settings document changed; carries the namespace and the new revision. */
  $on(event: 'settings/document-updated', handler: (ns: string, revision: number) => void): Unsubscribe
  /** Route topology changed; no payload, refresh whatever the page renders. */
  $on(event: 'llm/adapters-updated', handler: () => void): Unsubscribe
}

/** Locale dictionary registration shape. */
export interface LocaleFace {
  /** Register one namespace's dictionaries; `en` is the key source. */
  register(ns: string, dictionaries: Record<string, Record<string, string>>): Unsubscribe
  /** Bind a translator for one namespace, fresh on locale change. */
  bind(ns: string): (key: string, params?: Record<string, string | number>) => string
}

/** Slot registration entry this plugin writes. */
export interface SlotRegistration<I> {
  /** Slot name as declared by the shell. */
  name: string
  /** Stable registration id. */
  id: string
  /** Ordering hint inside the list (lower first). */
  order: number
  /** Localized nav label thunk. */
  label: () => string
  /** Props face thunk, called at render. */
  inject: () => I
}

/** The `slots` client service rendering contributions. */
export interface SlotsFace {
  /** Register once the named slot's declared shape is on the ledger; returns the waiter's disposer. */
  inject(name: string, register: () => Unsubscribe | void): Unsubscribe
  /**
   * Register one component at the named slot. The component receives the
   * injected face intersected with the shell's owner props (`close`), so a
   * prop-shape drift is a compile error here instead of a first-render break.
   */
  register<I, O>(options: SlotRegistration<I>, component: (props: I & O) => unknown): Unsubscribe
}

/** Client-side effect/disposer seam used from the plugin's apply. */
export interface ClientEffectRegistrar {
  /** Register a side effect; its disposer runs on stop/unload. */
  effect(effect: () => Unsubscribe | void | Promise<Unsubscribe | void>, name?: string): void
  /** Subscribe to a broadcast event; returns the disposer. */
  on(event: string, handler: (...args: readonly unknown[]) => void): Unsubscribe
}

/** The client Cordis context as this plugin narrows it. */
export interface ClientShim extends ClientEffectRegistrar {
  /**
   * Optional service lookup: the dynamic-plugin facade allows `ctx.get` for
   * services NOT declared in inject — `wire.ts` depends on it to observe
   * `remote.settings` / `remote.llm` only where they exist, because declaring
   * either on the plugin's fiber would park it until that namespace mounts.
   */
  get(name: string): unknown
  /** Pushed-event and Remote seam. */
  remote: RemoteFace
  /** Locale registration seam. */
  locale: LocaleFace
  /** Slot registry seam. */
  slots: SlotsFace
}