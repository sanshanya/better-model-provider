/**
 * The controlled capability editors — reasoning mapping, input modalities,
 * and the K/M capacity pair — plus the small shared shells (mode select,
 * chevron, write-error text) every row composes from. Editors are pure staged
 * state machines: they know the copy and the vocabulary, never the write path.
 *
 * @module better-model-provider/editors
 */
import type { ReactElement } from 'react';
import type { TFn } from './locales.ts';
import type { ReasoningEffortsValue } from './writes.ts';
/** Surface a rejected write: settings-conflict gets the localized, actionable message. */
export declare function writeErrorText(caught: unknown, t: TFn): string;
/** The disclosures' chevron: direction is the only variation. */
export declare function Chevron(props: {
    readonly pointing: 'up' | 'down' | 'right';
}): ReactElement;
/** The controlled reasoning-effort editor. */
export declare function ReasoningEditor(props: {
    /** Schema-derived level vocabulary. */
    levels: readonly string[];
    /** Staged value (`undefined` inherit / `false` / dict). */
    value: ReasoningEffortsValue;
    /** Set the staged value. */
    onChange: (value: ReasoningEffortsValue) => void;
    /** Whether editing is enabled. */
    enabled: boolean;
    /** Binding for copy. */
    t: TFn;
    /** Model id for a11y group labels. */
    modelId: string;
    /** Catalog-override flavor: keep-official posture, never a fabricated wire spelling. */
    official: boolean;
}): ReactElement | null;
/** The controlled input-modalities editor. */
export declare function InputEditor(props: {
    /** Schema-derived modality vocabulary. */
    modalities: readonly string[];
    /** Staged value (`undefined` inherit / list). */
    value: readonly string[] | undefined;
    /** Set the staged value. */
    onChange: (value: readonly string[] | undefined) => void;
    /** Whether editing is enabled. */
    enabled: boolean;
    /** Binding for copy. */
    t: TFn;
    /** Model id for a11y group labels. */
    modelId: string;
    /** Catalog-override flavor: inherit reads as "keep official". */
    official: boolean;
}): ReactElement | null;
/** The controlled capacity editor: `contextWindow` + `maxTokens` in K/M spelling. */
export declare function CapacityEditor(props: {
    /** Staged text of the `contextWindow` field. */
    contextText: string;
    /** Staged text of the `maxTokens` field. */
    maxText: string;
    /** Re-stage one field's text. */
    onChange: (field: 'contextWindowText' | 'maxTokensText', text: string) => void;
    /** Whether editing is enabled. */
    enabled: boolean;
    /** Binding for copy. */
    t: TFn;
    /** Model id for a11y group labels. */
    modelId: string;
    /** Official catalog baseline for the context field, when the wire answers one. */
    officialContext?: string | undefined;
    /** Official catalog baseline for the max-tokens field, when the wire answers one. */
    officialMax?: string | undefined;
}): ReactElement;
