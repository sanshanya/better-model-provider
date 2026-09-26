/**
 * English and Chinese copy for the Model capabilities section.
 *
 * @module better-model-provider/locales
 */
/** A locale-bound translator over this section's copy keys. */
export type TFn = (key: CapsKey, params?: Record<string, string | number>) => string;
/** English dictionary — the key source. */
export declare const en: {
    readonly nav: "Model capabilities";
    readonly title: "Model capabilities";
    readonly intro: string;
    readonly loading: "Loading providers…";
    readonly retry: "Retry now";
    readonly conflict: "The settings document changed elsewhere. Your edits are kept below — review the refreshed state, then apply again.";
    readonly empty: "No configurable providers yet";
    readonly emptyHint: string;
    readonly declaredRoute: "declared";
    readonly officialCatalog: "official catalog";
    readonly catalogIntro: string;
    readonly manageOfficial: "Manage official models";
    readonly officialModelsCount: "{count} official models";
    readonly overriddenCount: "{count} overridden";
    readonly keepOfficial: "Keep official";
    readonly disableReasoning: "Disable reasoning";
    readonly customMapping: "Custom mapping";
    readonly wireMapNote: string;
    readonly officialValue: "Official: {value}";
    readonly resetOfficial: "Reset to official defaults";
    readonly catalogLoadError: "Could not load the official model list";
    readonly manageOfficialProviders: "Manage official providers ({count})";
    readonly dormantHint: string;
    readonly officialUserList: "official · user-listed";
    readonly inheritedRoute: "inherited list";
    readonly residualOverrides: string;
    readonly removeResidualOverrides: "Remove leftover overrides";
    readonly adapterBoundary: string;
    readonly inheritedModelList: "This model list is inherited from the active composition and is read-only here.";
    readonly readOnly: "Settings are read-only in this view";
    readonly expand: "expand";
    readonly collapse: "collapse";
    readonly modelContextWindow: "Context window";
    readonly modelMaxTokens: "Max output tokens";
    readonly modelReasoning: "Reasoning effort";
    readonly inherit: "Provider default";
    readonly reasoningOff: "No reasoning (false)";
    readonly custom: "Custom";
    readonly wire: "wire";
    readonly modelInput: "Input modalities";
    readonly apply: "Apply";
    readonly revert: "Revert";
    readonly applying: "Applying…";
    readonly modelReasoningInvalid: "invalid reasoning declaration: name a level beyond off, and give each level beyond off a wire value";
    readonly modelInputInvalid: "invalid input modalities: choose from the declared vocabulary";
    readonly modelCapacityInvalid: "invalid capacity: use a positive whole count, K for thousands, M for millions (blank inherits)";
    readonly staged: "unapplied";
    readonly levelsSelected: "{count} selected";
    readonly levelGroup: "Reasoning effort levels of {model}";
    readonly modalityGroup: "Input modalities of {model}";
};
/** Union of copy keys the section consumes. */
export type CapsKey = keyof typeof en;
/** Chinese dictionary, one-to-one with `en`. */
export declare const zh: Record<CapsKey, string>;
