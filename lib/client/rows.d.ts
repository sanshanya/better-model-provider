/**
 * The model row: header disclosure plus its staged capability draft and the
 * apply/revert/reset traffic. One row stages text first and parses at the
 * leaf — a half-typed capacity is a draft too — and every write is one
 * commit closure addressing the fresh namespace inside the mutation tail.
 *
 * @module better-model-provider/rows
 */
import type { ReactElement } from 'react';
import type { TFn } from './locales.ts';
import type { CapabilityPatch, CapabilityState, ReasoningEffortsValue } from './writes.ts';
/** Staged partial state of one row: null means untouched. */
export interface RowDraft {
    /** The row edited reasoning (`undefined` staged means "inherit"). */
    reasoningTouched: boolean;
    /** Staged reasoning-effort declaration. */
    reasoning?: ReasoningEffortsValue | undefined;
    /** The row edited input (`undefined` staged means "inherit"). */
    inputTouched: boolean;
    /** Staged input modalities. */
    input?: readonly string[] | undefined;
    /** The row edited either capacity field (blank text means "inherit"). */
    capacityTouched: boolean;
    /** Staged `contextWindow` text (K/M spellings; parsed on use). */
    contextWindowText: string;
    /** Staged `maxTokens` text (K/M spellings; parsed on use). */
    maxTokensText: string;
}
/** Build the row's whole state: stored entry overlaid with the draft. */
export declare function rowStateOf(entry: Record<string, unknown>, draft: RowDraft | null): CapabilityState;
/** One model row: header, disclosure with both editors, and its save traffic. */
export declare function ModelRow(props: {
    /** The stored entry the stage overlays (`{}` without declaration or override). */
    entry: Record<string, unknown>;
    /** Model id for display and edit addressing. */
    modelId: string;
    /** Display name; hidden when it equals the id. */
    displayName: string;
    /** Whether settings are writable. */
    writable: boolean;
    /** Schema-derived reasoning levels, or none. */
    levels: readonly string[];
    /** Schema-derived request modalities, or none. */
    modalities: readonly string[];
    /** Editor flavor: own declaration or sparse catalog override. */
    flavor: 'declared' | 'catalog';
    /** Apply traffic from the row: stage → commit; reload stays in commit. */
    applyRow: (patch: CapabilityPatch) => Promise<boolean>;
    /** Catalog rows only: lift the whole capability override back to official. */
    resetRow?: (() => Promise<boolean>) | undefined;
    /** Official context-window baseline text, when the discovery seam answers. */
    officialContext?: string | undefined;
    /** Official max-tokens baseline text, when the discovery seam answers. */
    officialMax?: string | undefined;
    /** Bound translate. */
    t: TFn;
}): ReactElement;
