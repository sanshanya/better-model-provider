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
import type { LlmConfigurableProvider, LlmDiscoveredModel, RemoteResult, SettingsNamespaceView, SettingsPathOpView } from '@deepseek-ai/dsh-api-remotes/client';
import { type RemoteApi } from './types.ts';
/** Unwrap one Remote envelope: business failures throw the typed wire error. */
export declare function unwrap<T>(result: RemoteResult<T>): T;
/** The settings namespace whose profiles this page edits. */
export declare const PI_AI_NS = "llm-pi-ai";
/** Human text for a rejected wire call. */
export declare function messageOf(error: unknown): string;
/**
 * Extract both capability vocabularies from one rehydrated schema walk.
 *
 * The reasoning and input vocabularies are not two independent parsing paths:
 * they both begin at the same `models` entry node inside the owning namespace.
 * Extracting them together keeps one conceptual schema-to-vocabulary operation;
 * a malformed envelope yields an empty vocabulary rather than a phantom tree.
 */
export declare function extractCapabilityVocabulary(namespace: SettingsNamespaceView | undefined): {
    levels: string[];
    modalities: string[];
};
/**
 * Whether one model entry's `reasoningEfforts` satisfies the adapter's
 * resolution rules: absent and `false` pass; a dict must declare a level
 * beyond `off`, and every level beyond `off` must carry a non-empty wire
 * spelling. Vocabulary stays with the owning schema.
 */
export declare function validReasoningEfforts(value: unknown): boolean;
/**
 * Whether one model entry's `input` satisfies the schema: absent and an
 * empty list both mean "inherit" and pass; anything else must be a list of
 * non-empty strings, each one a modality `choices` declares when supplied.
 */
export declare function validInputModalities(value: unknown, choices: readonly string[] | undefined): boolean;
/** The settings layer from which a profile projection is read. */
type SettingsLayer = 'value' | 'user';
/** One layer's `models` array as records, preserving fields the editor does not own. */
export declare function profileModels(namespace: SettingsNamespaceView, path: readonly string[], layer?: SettingsLayer): Record<string, unknown>[];
/** Whether a declared route owns its `models` array in the user layer. */
export declare function userOwnsModels(namespace: SettingsNamespaceView, path: readonly string[]): boolean;
/** Whether the user layer owns a NON-EMPTY `models[]` — only such a list makes the route's own list real. */
export declare function userOwnsNonEmptyModels(namespace: SettingsNamespaceView, path: readonly string[]): boolean;
/** Read a profile's `modelOverrides` dict from one explicit layer, as records. */
export declare function profileOverrides(namespace: SettingsNamespaceView, path: readonly string[], layer?: SettingsLayer): Record<string, Record<string, unknown>>;
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
export type CapabilityWriteMode = 'declared-models' | 'catalog-overrides' | 'inherited-models';
/** Derive one row's write mode from the namespace layers and the directory entry. */
export declare function writeModeOf(namespace: SettingsNamespaceView, entry: LlmConfigurableProvider): CapabilityWriteMode;
/** One row of the capabilities page. */
export interface CapabilityRowView {
    /** Route facts from the directory. */
    entry: LlmConfigurableProvider;
    /** Whether any layer configures this provider (its profile resolves). */
    configured: boolean;
    /** The route's effective model entries (empty for a catalog-overrides row). */
    models: Record<string, unknown>[];
    /** Where this row's capability edits persist. */
    writeMode: CapabilityWriteMode;
    /** User-layer `modelOverrides` of a catalog-overrides row, keyed by model id. */
    overrides: Record<string, Record<string, unknown>>;
}
/** The snapshot the section renders. */
export interface CapabilitiesState {
    status: 'idle' | 'loading' | 'ready' | 'error';
    /** Whole-load failure text; per-row write failures stay in the rows. */
    error: string | null;
    /** Whether the settings provider accepts writes. */
    writable: boolean;
    /** The pi-ai namespace view (schema, layers, revision). */
    namespace: SettingsNamespaceView | undefined;
    /** Configured pi-ai providers joined with their profile models. */
    rows: readonly CapabilityRowView[];
    /** Dormant catalog routes: installed, not yet configured, one write from onboarding. */
    dormant: readonly CapabilityRowView[];
    /** Schema-derived reasoning levels vocabulary. */
    levels: readonly string[];
    /** Schema-derived request modalities vocabulary. */
    modalities: readonly string[];
}
/** A tiny snapshot store: one value, subscribe/getSnapshot, notify on set. (Exported: it lands in the controller's public type surface.) */
export interface SnapshotStore<T> {
    getSnapshot(): T;
    setSnapshot(next: T): void;
    subscribe(listener: () => void): () => void;
}
/** Create one snapshot store with identity-stable reads between updates. */
export declare function createSnapshotStore<T>(initial: T): SnapshotStore<T>;
/**
 * The page controller: one async join plus the write paths the rows drive.
 * Not a Cordis store — the client plugin owns its instance directly.
 */
export declare class CapabilitiesController {
    private readonly api;
    readonly store: SnapshotStore<CapabilitiesState>;
    constructor(api: RemoteApi);
    /** Latest load generation; older responses are never allowed to publish. */
    private generation;
    /** Prevent a disposed plugin fiber from receiving a late response. */
    private disposed;
    /** Serialize mutations so each write builds from the latest accepted namespace. */
    private mutationTail;
    /** Make every later response a no-op: the generation fence drops in-flight reads. */
    dispose(): void;
    /** Memoized official-catalog discovery per provider; lazily asked on manage-click. */
    private readonly discoveries;
    /**
     * Ask the configuration-time discovery seam for one catalog route's
     * installed models. A catalog provider answers from the installed catalog
     * itself — before any endpoint, protocol, or credential work — so this
     * stays callable even when the route's baseURL is dead. A rejected ask is
     * not cached: the next click asks again.
     */
    discoverOfficialModels(provider: string): Promise<readonly LlmDiscoveredModel[]>;
    /**
     * Fetch the join with a small latest-wins fence. The Host remains the source
     * of truth; this controller only protects the rendered view from an older
     * response and gives the browser request a lifetime tied to the page.
     */
    load(): Promise<void>;
    private isCurrent;
    private runLoad;
    /**
     * Build and apply a profile write from one atomic snapshot, then reload.
     *
     * The op builder receives the exact namespace that also supplies
     * `expectedRevision`, closing the stale-render-closure race. Mutations are
     * serialized so concurrent row saves build from sequentially refreshed
     * namespaces. Returns whether a write actually landed; an empty builder is a
     * no-op that still keeps the UI draft intact.
     */
    commit(build: (namespace: SettingsNamespaceView) => SettingsPathOpView[]): Promise<boolean>;
    /** Serialize one mutation step after any prior queued mutation. */
    private enqueueMutation;
    /** Fence stale reads and return the authoritative mutation namespace. */
    private prepareMutation;
    /** Reload after a mutation lands (or any forwarded invalidation). */
    reload(): Promise<void>;
}
export {};
