/**
 * Tiny path helpers shared by the store joins and the write builders:
 * `getPath`/`hasPath` walk arbitrary JSON values by key path, and `nodeAtPath`
 * walks the structural relations of a rehydrated schemastery node tree (the
 * wire envelope is rehydrated once upstream; the walk reads the live node's
 * `dict`/`inner` accessors, exactly like the official schema-form model).
 *
 * @module better-model-provider/paths
 */
/** Read a nested value by path; array indexes as strings. */
export declare function getPath(value: unknown, path: readonly string[]): unknown;
/** Whether a draft explicitly carries the path (presence marks ownership). */
export declare function hasPath(value: unknown, path: readonly string[]): boolean;
/**
 * Walk a rehydrated schemastery node tree by path: object children by name,
 * dict and array through `inner`.
 */
export declare function nodeAtPath(root: unknown, path: readonly string[]): unknown;
