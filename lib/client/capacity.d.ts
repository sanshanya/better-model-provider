/**
 * Token-capacity spellings (`contextWindow` / `maxTokens`): the user types
 * `380K` or `1M` and the profile stores a plain count. The vocabulary is the
 * official Models page's — `K` is 1000, `M` is 1000K — so a value this page
 * writes reads identically there, and vice versa. The wire schema admits
 * positive integers only (`step(1).min(1)`), which `capacityError` enforces
 * before any write.
 *
 * @module better-model-provider/capacity
 */
/** Per-field placeholder hints, spelled as the adapter's route-level fallbacks. */
export declare const CAPACITY_HINT: {
    readonly contextWindow: "256K";
    readonly maxTokens: "32K";
};
/**
 * Read a typed capacity.
 * @param text - raw field text.
 * @returns the count; `undefined` when blank (inherit); `NaN` when
 *   unreadable (the row refuses the write and names the field).
 */
export declare function parseCapacity(text: string): number | undefined;
/**
 * Spell a stored count back in the shortest form that round-trips through
 * {@link parseCapacity}; a count that is not a whole number of thousands
 * stays written out.
 */
export declare function formatCapacity(value: unknown): string;
/**
 * Whether a parsed capacity is writeable: the schema admits positive
 * integers (`z.number().step(1).min(1)`); `undefined` is inheritance, not a
 * value, and always passes.
 */
export declare function validCapacity(value: number | undefined): boolean;
