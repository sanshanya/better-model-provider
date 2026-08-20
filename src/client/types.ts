/**
 * Wire-surface types this plugin consumes, DERIVED from the published harness
 * client contract (`@deepseek-ai/dsh-api-remotes/client`, devDependencies)
 * rather than hand-declared: the Remote method signatures, envelopes, and
 * view shapes below ARE the upstream contract, so a harness-side drift is a
 * compile error in `npm run typecheck`, not a browser surprise. The import is
 * type-only — erased by every build, so the served bundle still depends on
 * nothing but the harness services it consumes at runtime.
 *
 * @module better-model-provider/types
 */

import type {
  IApiClient, RpcError,
} from '@deepseek-ai/dsh-api-remotes/client'

export type { ConfigurableProviderView, DiscoveredModelView, RpcResponse, SettingsNamespaceView, SettingsPathOpView } from
  '@deepseek-ai/dsh-api-remotes/client'

/**
 * A business failure carried out of a Remote envelope, with the wire `code`
 * retained for callers that branch on semantics (e.g. settings-conflict).
 */
export class HarnessRpcError extends Error {
  constructor(
    /** The wire-level error code — the closed upstream union, never a free string. */
    readonly code: RpcError['code'],
    message: string,
    /** The wire-level details payload — required per upstream error arm. */
    readonly details: RpcError['details'],
  ) {
    super(message)
    this.name = 'HarnessRpcError'
  }
}

/** The `settings` Remote methods this plugin calls, picked from the contract. */
export type SettingsRemoteApi = Pick<IApiClient['settings'], 'describe' | 'mutate'>

/** The `llm` Remote methods this plugin calls, picked from the contract. */
export type LlmRemoteApi = Pick<IApiClient['llm'], 'providers' | 'discoverModels'>

/**
 * The union of Remote faces this plugin calls: per-method picks of the
 * published `IApiClient`, narrowed so a mock implements exactly the consumed
 * surface but every signature — payload shape included — is upstream's.
 */
export interface IRemoteApi {
  settings: SettingsRemoteApi
  llm: LlmRemoteApi
}

/** The `connection` client service carrying the Remote faces. */
export interface ConnectionFace {
  /** Namespaced Remote proxies. */
  api: IRemoteApi
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

/** Client-side effect/disposer seam used ftom the plugin's apply. */
export interface ClientEffectRegistrar {
  /** Register a side effect; its disposer runs on stop/unload. */
  effect(effect: () => Unsubscribe | void | Promise<Unsubscribe | void>, name?: string): void
  /** Subscribe to a broadcast event; returns the disposer. */
  on(event: string, handler: (...args: readonly unknown[]) => void): Unsubscribe
}

/** The client Cordis context as this plugin narrows it. */
export interface ClientShim extends ClientEffectRegistrar {
  /** Pushed-event and Remote seam. */
  remote: RemoteFace
  /** Connection seam with the Remote faces. */
  connection: ConnectionFace
  /** Locale registration seam. */
  locale: LocaleFace
  /** Slot registry seam. */
  slots: SlotsFace
}
