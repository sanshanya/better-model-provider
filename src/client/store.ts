/**
 * Model-capabilities page store. Joins `llm.providers` (the configurable
 * directory with declared/active and the settings address) and
 * `settings.describe` (serialized schema plus layered redacted values) into
 * one snapshot. The host stays the single fact source: every mutation writes
 * through the wire, and the page re-renders from the next load, pushed by
 * forwarded invalidations.
 *
 * @module better-model-provider/store
 */

import type {
  ConfigurableProviderView, DiscoveredModelView, IRemoteApi, SettingsNamespaceView,
  SettingsPathOpView, RpcResponse,
} from './types.ts'
import Schema from '@deepseek-ai/schemastery'
import { HarnessRpcError } from './types.ts'
import { getPath, hasPath, nodeAtPath } from './paths.ts'

/**
 * Rehydrate the wire schemastery envelope (`schema.toJSON()`) into a live
 * node tree — the same preparatory step the official models page performs
 * before probing structure; a malformed envelope yields undefined so the
 * vocabulary falls closed instead of reading a phantom tree.
 */
function rehydrateSchema(envelope: unknown): Schema | undefined {
  try {
    return new Schema(envelope as Schema)
  } catch {
    return undefined
  }
}

/** Unwrap one Remote envelope: business failures throw the typed wire error. */
export function unwrap<T>(response: RpcResponse<T>): T {
  if (!response.result.ok) throw new HarnessRpcError(response.result.error.code, response.result.error.message, response.result.error.details)
  return response.result.value
}

/** The settings namespace whose profiles this page edits. */
export const PI_AI_NS = 'llm-pi-ai'

/**
 * Any route key walks a dict schema to the same profile node, so the lookup
 * names one that cannot collide with a configured route.
 */
const PROBE_ROUTE = '\u0000probe'

/** Human text for a rejected wire call. */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** String literals of one union node's list — empty for any other shape. */
function unionStrings(node: unknown): string[] {
  const list = (node as { type?: string; list?: readonly { value?: unknown }[] } | undefined)
  if (list?.type !== 'union' || list.list === undefined) return []
  return list.list.map(member => member.value).filter((value): value is string => typeof value === 'string')
}

/**
 * Extract both capability vocabularies from one rehydrated schema walk.
 *
 * The reasoning and input vocabularies are not two independent parsing paths:
 * they both begin at the same `models` entry node inside the owning namespace.
 * Extracting them together keeps one conceptual schema-to-vocabulary operation;
 * a malformed envelope yields an empty vocabulary rather than a phantom tree.
 */
export function extractCapabilityVocabulary(
  namespace: SettingsNamespaceView | undefined,
): { levels: string[]; modalities: string[] } {
  const empty: { levels: string[]; modalities: string[] } = { levels: [], modalities: [] }
  if (namespace === undefined) return empty
  const models = nodeAtPath(rehydrateSchema(namespace.schema), ['providers', PROBE_ROUTE, 'models']) as
    | { type?: string; inner?: { type?: string; dict?: Record<string, unknown> } }
    | undefined
  const entry = models?.type === 'array' ? models.inner : undefined
  if (entry?.type !== 'object' || entry.dict === undefined) return empty

  // reasoning: union whose dict member keys off a union of level literals.
  const efforts = entry.dict['reasoningEfforts'] as { type?: string; list?: readonly unknown[] } | undefined
  const dict = efforts?.type === 'union' && efforts.list !== undefined
    ? efforts.list.find(member => (member as { type?: string }).type === 'dict') as
      | { sKey?: unknown }
      | undefined
    : undefined
  const levels = dict === undefined ? [] : unionStrings(dict.sKey)

  // input: array whose inner union lists the modality literals.
  const input = entry.dict['input'] as { type?: string; inner?: unknown } | undefined
  const modalities = input?.type === 'array' ? unionStrings(input.inner) : []

  return { levels, modalities }
}

/**
 * Whether one model entry's `reasoningEfforts` satisfies the adapter's
 * resolution rules: absent and `false` pass; a dict must declare a level
 * beyond `off`, and every level beyond `off` must carry a non-empty wire
 * spelling. Vocabulary stays with the owning schema.
 */
export function validReasoningEfforts(value: unknown): boolean {
  if (value === undefined || value === false) return true
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const entries = Object.entries(value as Record<string, unknown>)
  if (entries.length === 0) return false
  let beyondOff = false
  for (const [level, wire] of entries) {
    if (level.length === 0) return false
    if (wire === null) {
      if (level !== 'off') return false
    } else if (typeof wire !== 'string' || wire.length === 0) {
      return false
    }
    if (level !== 'off') beyondOff = true
  }
  return beyondOff
}

/**
 * Whether one model entry's `input` satisfies the schema: absent and an
 * empty list both mean "inherit" and pass; anything else must be a list of
 * non-empty strings, each one a modality `choices` declares when supplied.
 */
export function validInputModalities(value: unknown, choices: readonly string[] | undefined): boolean {
  if (value === undefined) return true
  if (!Array.isArray(value)) return false
  return value.every(entry => typeof entry === 'string' && entry.length > 0
    && (choices === undefined || choices.includes(entry)))
}

/** The settings layer from which a profile projection is read. */
type SettingsLayer = 'value' | 'user'

/** Read one provider profile from one explicit settings layer. */
function profileOf(
  namespace: SettingsNamespaceView,
  path: readonly string[],
  layer: SettingsLayer = 'value',
): Record<string, unknown> {
  const profile = getPath((layer === 'user' ? namespace.user : namespace.value) ?? {}, path)
  return typeof profile === 'object' && profile !== null && !Array.isArray(profile)
    ? profile as Record<string, unknown>
    : {}
}

/** One layer's `models` array as records, preserving fields the editor does not own. */
export function profileModels(
  namespace: SettingsNamespaceView,
  path: readonly string[],
  layer: SettingsLayer = 'value',
): Record<string, unknown>[] {
  const value = profileOf(namespace, path, layer)['models']
  if (!Array.isArray(value)) return []
  return value.map(entry =>
    typeof entry === 'object' && entry !== null && !Array.isArray(entry)
      ? entry as Record<string, unknown>
      : {})
}

/** Whether a declared route owns its `models` array in the user layer. */
export function userOwnsModels(
  namespace: SettingsNamespaceView,
  path: readonly string[],
): boolean {
  return hasPath(namespace.user ?? {}, [...path, 'models'])
}

/** Whether the user layer owns a NON-EMPTY `models[]` — only such a list makes the route's own list real. */
export function userOwnsNonEmptyModels(
  namespace: SettingsNamespaceView,
  path: readonly string[],
): boolean {
  return userOwnsModels(namespace, path) && profileModels(namespace, path, 'user').length > 0
}

/** Read a profile's `modelOverrides` dict from one explicit layer, as records. */
export function profileOverrides(
  namespace: SettingsNamespaceView,
  path: readonly string[],
  layer: SettingsLayer = 'value',
): Record<string, Record<string, unknown>> {
  const value = profileOf(namespace, path, layer)['modelOverrides']
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
  const out: Record<string, Record<string, unknown>> = {}
  for (const [id, override] of Object.entries(value as Record<string, unknown>)) {
    out[id] = typeof override === 'object' && override !== null && !Array.isArray(override)
      ? override as Record<string, unknown>
      : {}
  }
  return out
}

/**
 * Where one row's capability edits persist — derived from ownership facts,
 * never from the route label alone:
 *
 * - `declared-models`: the user layer owns the route's effective `models[]`
 *   — a hand-declared route, or a catalog route whose served list the user
 *   narrowed. Edits rewrite entries of that array.
 * - `catalog-overrides`: a catalog route with no effective `models[]`;
 *   edits land as sparse `modelOverrides[id]` leaves beside the installed
 *   catalog (overrides beside a non-empty `models` list are refused at write).
 * - `inherited-models`: models exist only in an inherited layer, or a
 *   declared route declares none at all yet; nothing here may be written.
 */
export type CapabilityWriteMode = 'declared-models' | 'catalog-overrides' | 'inherited-models'

/** Derive one row's write mode from the namespace layers and the directory entry. */
export function writeModeOf(
  namespace: SettingsNamespaceView,
  entry: ConfigurableProviderView,
): CapabilityWriteMode {
  // A hand-declared route owns its list the moment the key exists, empty or
  // not. A catalog route is different: the adapter treats user `models: []`
  // as no list (it serves the installed catalog, and overrides beside an
  // empty list stay legal) — so only a non-empty user list narrows it.
  if (entry.declared !== false) {
    return userOwnsModels(namespace, entry.settingsPath) ? 'declared-models' : 'inherited-models'
  }
  if (userOwnsNonEmptyModels(namespace, entry.settingsPath)) return 'declared-models'
  if (profileModels(namespace, entry.settingsPath).length === 0) return 'catalog-overrides'
  return 'inherited-models'
}

/** One row of the capabilities page. */
export interface CapabilityRowView {
  /** Route facts from the directory. */
  entry: ConfigurableProviderView
  /** Whether any layer configures this provider (its profile resolves). */
  configured: boolean
  /** The route's effective model entries (empty for a catalog-overrides row). */
  models: Record<string, unknown>[]
  /** Where this row's capability edits persist. */
  writeMode: CapabilityWriteMode
  /** User-layer `modelOverrides` of a catalog-overrides row, keyed by model id. */
  overrides: Record<string, Record<string, unknown>>
}

/** The snapshot the section renders. */
export interface CapabilitiesState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  /** Whole-load failure text; per-row write failures stay in the rows. */
  error: string | null
  /** Whether the settings provider accepts writes. */
  writable: boolean
  /** The pi-ai namespace view (schema, layers, revision). */
  namespace: SettingsNamespaceView | undefined
  /** Configured pi-ai providers joined with their profile models. */
  rows: readonly CapabilityRowView[]
  /** Dormant catalog routes: installed, not yet configured, one write from onboarding. */
  dormant: readonly CapabilityRowView[]
  /** Schema-derived reasoning levels vocabulary. */
  levels: readonly string[]
  /** Schema-derived request modalities vocabulary. */
  modalities: readonly string[]
}

/** A tiny snapshot store: one value, subscribe/getSnapshot, notify on set. (Exported: it lands in the controller's public type surface.) */
export interface SnapshotStore<T> {
  getSnapshot(): T
  setSnapshot(next: T): void
  subscribe(listener: () => void): () => void
}

/** Create one snapshot store with identity-stable reads between updates. */
export function createSnapshotStore<T>(initial: T): SnapshotStore<T> {
  let snapshot = initial
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => snapshot,
    setSnapshot(next) {
      if (Object.is(next, snapshot)) return
      snapshot = next
      const pending = Array.from(listeners)
      for (const listener of pending) listener()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

/**
 * The page controller: one async join plus the write paths the rows drive.
 * Not a Cordis store — the client plugin owns its instance directly.
 */
export class CapabilitiesController {
  readonly store: SnapshotStore<CapabilitiesState> = createSnapshotStore<CapabilitiesState>({
    status: 'idle',
    error: null,
    writable: true,
    namespace: undefined,
    rows: [],
    dormant: [],
    levels: [],
    modalities: [],
  })

  constructor(private readonly api: IRemoteApi) {}

  /** Latest load generation; older responses are never allowed to publish. */
  private generation = 0
  /** Abort the previous read when a newer invalidation supersedes it. */
  private activeAbort: AbortController | undefined
  /** Prevent a disposed plugin fiber from receiving a late response. */
  private disposed = false
  /** Serialize mutations so each write builds from the latest accepted namespace. */
  private mutationTail: Promise<void> = Promise.resolve()

  /** Stop in-flight reads and make every later response a no-op. */
  dispose(): void {
    this.disposed = true
    this.generation += 1
    this.activeAbort?.abort()
    this.activeAbort = undefined
    this.discoveries.clear()
  }

  /** Memoized official-catalog discovery per provider; lazily asked on manage-click. */
  private readonly discoveries = new Map<string, Promise<readonly DiscoveredModelView[]>>()

  /**
   * Ask the configuration-time discovery seam for one catalog route's
   * installed models. A catalog provider answers from the installed catalog
   * itself — before any endpoint, protocol, or credential work — so this
   * stays callable even when the route's baseURL is dead. A rejected ask is
   * not cached: the next click asks again.
   */
  discoverOfficialModels(provider: string): Promise<readonly DiscoveredModelView[]> {
    if (this.disposed) return Promise.reject(new Error('better-model-provider: controller disposed'))
    const existing = this.discoveries.get(provider)
    if (existing !== undefined) return existing
    const pending = this.api.llm.discoverModels({ settingsNs: PI_AI_NS, provider })
      .then(response => unwrap(response).models)
    this.discoveries.set(provider, pending)
    void pending.catch(() => {
      if (this.discoveries.get(provider) === pending && !this.disposed) this.discoveries.delete(provider)
    })
    return pending
  }

  /**
   * Fetch the join with a small latest-wins fence. The Host remains the source
   * of truth; this controller only protects the rendered view from an older
   * response and gives the browser request a lifetime tied to the page.
   */
  load(): Promise<void> {
    if (this.disposed) return Promise.resolve()
    const generation = ++this.generation
    // A generation advance means the join changed: catalog snapshots memoized
    // from an older generation may contradict freshly reloaded overrides —
    // they are cheap enough to ask again on the next manage click.
    this.discoveries.clear()
    this.activeAbort?.abort()
    const abort = new AbortController()
    this.activeAbort = abort
    return this.runLoad(generation, abort.signal).finally(() => {
      if (this.activeAbort === abort) this.activeAbort = undefined
    })
  }

  private isCurrent(generation: number): boolean {
    return !this.disposed && generation === this.generation
  }

  private async runLoad(generation: number, signal: AbortSignal): Promise<void> {
    const current = this.store.getSnapshot()
    // Only the very first load blanks the page: a background refresh keeps
    // showing the last accepted snapshot so open rows, drafts, and row errors
    // survive the refetch.
    if (current.namespace === undefined) {
      this.store.setSnapshot({ ...current, status: 'loading', error: null })
    }
    try {
      // Every Remote method is payload-direct: the carrier wraps the payload
      // in the envelope, and the host validates it against a `z.object({})`
      // request schema — so the empty object is the ONLY request the harness
      // accepts for these reads. Business failures ride `result.ok === false`
      // and are thrown here as ordinary load errors.
      const [settings, directory] = await Promise.all([
        this.api.settings.describe({}, signal).then(unwrap),
        this.api.llm.providers({}, signal).then(unwrap),
      ])
      if (!this.isCurrent(generation)) return
      const namespace = settings.namespaces.find(ns => ns.ns === PI_AI_NS)
      const joined: CapabilityRowView[] = directory.providers
        .filter(entry => entry.settingsNs === PI_AI_NS)
        .map(entry => ({
          entry,
          configured: namespace !== undefined && hasPath(namespace.value ?? {}, entry.settingsPath),
          models: namespace === undefined ? [] : profileModels(namespace, entry.settingsPath),
          writeMode: namespace === undefined ? 'inherited-models' as const : writeModeOf(namespace, entry),
          overrides: namespace === undefined ? {} : profileOverrides(namespace, entry.settingsPath, 'user'),
        }))
      this.store.setSnapshot({
        status: 'ready',
        error: null,
        writable: settings.writable,
        namespace,
        // Every classifiable configured route appears: declared routes edit
        // their own models[]; catalog routes overlay the installed catalog
        // with sparse modelOverrides. Routes the adapter cannot classify
        // (declared undefined) carry no persistence story and never appear.
        rows: joined.filter(row => row.configured && row.entry.declared !== undefined),
        // Dormant catalog routes wait one click away: the directory already
        // carries every installed catalog provider, and the first override
        // write materializes the profile — no bootstrap document, no key
        // handling here.
        dormant: joined.filter(row => !row.configured && row.entry.declared === false),
        ...extractCapabilityVocabulary(namespace),
        
      })
    } catch (error: unknown) {
      if (!this.isCurrent(generation)) return
      // A background refresh that failed leaves the last accepted snapshot
      // alone; nothing of the user's was touched and the next invalidation
      // simply retries. First-load failures surface in full.
      if (this.store.getSnapshot().namespace === undefined) {
        this.store.setSnapshot({ ...this.store.getSnapshot(), status: 'error', error: messageOf(error) })
      }
    }
  }

  /**
   * Build and apply a profile write from one atomic snapshot, then reload.
   *
   * The op builder receives the exact namespace that also supplies
   * `expectedRevision`, closing the stale-render-closure race. Mutations are
   * serialized so concurrent row saves build from sequentially refreshed
   * namespaces. Returns whether a write actually landed; an empty builder is a
   * no-op that still keeps the UI draft intact.
   */
  async commit(build: (namespace: SettingsNamespaceView) => SettingsPathOpView[]): Promise<boolean> {
    return this.enqueueMutation(async (): Promise<boolean> => {
      try {
        if (this.disposed) throw new Error('better-model-provider: controller disposed')
        const current = this.store.getSnapshot().namespace
        if (current === undefined) throw new Error('better-model-provider: settings namespace unavailable')
        const ops = build(current)
        // No-op commits do not establish a mutation fence: they abort no
        // refresh and trigger no reload.
        if (ops.length === 0) return false
        // Only a real write fences stale reads and owns the CAS baseline.
        const namespace = this.prepareMutation()
        const next = unwrap(await this.api.settings.mutate({
          ns: PI_AI_NS,
          ops,
          expectedRevision: namespace.revision,
        }))
        this.store.setSnapshot({ ...this.store.getSnapshot(), namespace: next })
        await this.reload()
        return true
      } catch (caught) {
        // Recovery is part of the serialized transaction: the next queued
        // commit must build from the refreshed namespace, not the stale one.
        await this.reload()
        throw caught
      }
    })
  }

  /** Serialize one mutation step after any prior queued mutation. */
  private enqueueMutation<T>(run: () => Promise<T>): Promise<T> {
    const pending = this.mutationTail.then(run, run)
    this.mutationTail = pending.then(() => undefined, () => undefined)
    return pending
  }

  /** Fence stale reads and return the authoritative mutation namespace. */
  private prepareMutation(): SettingsNamespaceView {
    // commit() has already validated liveness and the namespace before it
    // reaches here; this step only fences reads that started before the write.
    this.generation += 1
    this.activeAbort?.abort()
    this.activeAbort = undefined
    return this.store.getSnapshot().namespace as SettingsNamespaceView
  }

  /** Reload after a mutation lands (or any forwarded invalidation). */
  async reload(): Promise<void> {
    await this.load()
  }
}
