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
export function getPath(value: unknown, path: readonly string[]): unknown {
  let current: unknown = value
  for (const key of path) {
    if (Array.isArray(current)) {
      current = current[Number(key)]
      continue
    }
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

/** Whether a draft explicitly carries the path (presence marks ownership). */
export function hasPath(value: unknown, path: readonly string[]): boolean {
  if (path.length === 0) return value !== undefined
  const parent = getPath(value, path.slice(0, -1))
  const key = path[path.length - 1] as string
  if (Array.isArray(parent)) return Number(key) < parent.length
  if (typeof parent !== 'object' || parent === null) return false
  return key in parent
}

/** The only structural fields a rehydrated node tree exposes to this walk. */
interface SchemaProbe {
  type?: string
  dict?: Record<string, unknown>
  inner?: unknown
}

/**
 * Walk a rehydrated schemastery node tree by path: object children by name,
 * dict and array through `inner`.
 */
export function nodeAtPath(root: unknown, path: readonly string[]): unknown {
  let node: unknown = root
  for (const key of path) {
    // Schemastery nodes are CALLABLE validators: `typeof node === 'function'`,
    // not 'object'. Rejecting functions here was the fail-closed path that
    // silently emptied every vocabulary in the live harness.
    if (node === null || (typeof node !== 'object' && typeof node !== 'function')) return undefined
    const probe = node as SchemaProbe
    if (probe.type === 'object' && probe.dict !== undefined) node = probe.dict[key]
    else if (probe.type === 'dict' || probe.type === 'array') node = probe.inner
    else return undefined
  }
  return node
}
