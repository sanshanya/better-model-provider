/**
 * Pure builders mapping one row's touched capability patch to
 * `settings.mutate` path ops. An absent patch member means the user did not
 * touch that field; an explicit `{ value: undefined }` means "inherit" and
 * therefore unsets the user leaf. This distinction keeps inherited base
 * values out of the user layer.
 *
 * @module better-model-provider/writes
 */
import type { SettingsNamespaceView, SettingsPathOpView } from '@deepseek-ai/dsh-api-remotes/client';
/**
 * One level's spelling in a staged `reasoningEfforts` dict: a non-empty wire
 * string, or `null` for the explicit-off level. Staged (write-side) faces are
 * schema-narrow: validation from `unknown` happens only at the read seam.
 */
export type ReasoningEffortsDict = Record<string, string | null>;
/** One reasoning-effort declaration value (`false`, level dict, or absent → inherit). */
export type ReasoningEffortsValue = ReasoningEffortsDict | false | undefined;
/** The full staged capability state of one model row. */
export interface CapabilityState {
    /** New `reasoningEfforts`: a level dict, `false`, or absent (inherit). */
    reasoning: ReasoningEffortsDict | false | undefined;
    /** New `input` modality list, or absent (inherit). */
    input: readonly string[] | undefined;
    /** New `contextWindow` count, or absent (inherit the route default). */
    contextWindow: number | undefined;
    /** New `maxTokens` count, or absent (inherit the route default). */
    maxTokens: number | undefined;
}
/** The subset of capability fields the user actually touched in this row. */
export interface CapabilityPatch {
    reasoning?: {
        value: CapabilityState['reasoning'];
    };
    input?: {
        value: CapabilityState['input'];
    };
    contextWindow?: {
        value: CapabilityState['contextWindow'];
    };
    maxTokens?: {
        value: CapabilityState['maxTokens'];
    };
}
/**
 * Whether the staged state differs from what a row stores today, so a
 * row with no real change writes nothing.
 */
export declare function stagedDiffers(entry: Record<string, unknown>, state: CapabilityState): boolean;
/**
 * The locked four-field capability vocabulary as patch key → stored leaf, in
 * patch order — the single enumeration every write path derives from.
 */
export declare const CAPABILITY_FIELDS: readonly [readonly ["reasoning", "reasoningEfforts"], readonly ["input", "input"], readonly ["contextWindow", "contextWindow"], readonly ["maxTokens", "maxTokens"]];
/** The capability leaves a row may override — derived, never re-listed. */
export declare const CAPABILITY_LEAVES: ("reasoningEfforts" | "input" | "contextWindow" | "maxTokens")[];
/**
 * Stage one declared-route model's touched patch. The route's models array is
 * rewritten only when the user layer owns that array; an inherited base array
 * is intentionally not materialized by this thin editor.
 *
 * Addressing is identity-checked: `index` comes from the render-time list and
 * may drift before the commit tail re-reads the freshest namespace, so a
 * mismatched entry falls back to locating by id — a model that no longer
 * exists writes nothing rather than silently rewriting its neighbor.
 */
export declare function declaredEditOps(namespace: SettingsNamespaceView, path: readonly string[], index: number, expectedId: string, patch: CapabilityPatch): SettingsPathOpView[];
/** Whether an existing override carries any capability leaf this editor owns. */
export declare function hasCapabilityOverride(override: Record<string, unknown> | undefined): boolean;
/**
 * Stage one catalog model's touched patch as sparse `modelOverrides[id]`
 * leaves. Editing never materializes the catalog: a set op writes only the
 * touched leaf (the host creates intermediate dicts), an inherit against an
 * absent leaf is already true and spends no op, and untouched override leaves
 * — `name`, `compat` — are never addressed. A pure-inherit patch that would
 * empty the entry collapses exactly like `resetOverrideOps`: a stranded `{}`
 * entry passes today's validation only to freeze the namespace the day a
 * catalog upgrade reclassifies it.
 */
export declare function catalogEditOps(namespace: SettingsNamespaceView, path: readonly string[], modelId: string, patch: CapabilityPatch): SettingsPathOpView[];
/**
 * Reset one catalog model to the official declaration: unset every capability
 * leaf. When the user-layer override carries nothing else, the whole entry is
 * lifted — and when that entry was the dict's last occupant, the dict itself
 * lifts too. One step further: when that dict was the profile's only content
 * (the onboarding-minted shell), the profile lifts with it, so the route truly
 * returns to the dormant list instead of lingering as an active `{}` shell.
 */
export declare function resetOverrideOps(namespace: SettingsNamespaceView, path: readonly string[], modelId: string): SettingsPathOpView[];
