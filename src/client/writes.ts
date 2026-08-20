/**
 * Pure builders mapping one row's touched capability patch to
 * `settings.mutate` path ops. An absent patch member means the user did not
 * touch that field; an explicit `{ value: undefined }` means "inherit" and
 * therefore unsets the user leaf. This distinction keeps inherited base
 * values out of the user layer.
 *
 * @module better-model-provider/writes
 */

import type { SettingsNamespaceView, SettingsPathOpView } from './types.ts'
import { getPath } from './paths.ts'
import { profileModels, profileOverrides, userOwnsModels } from './store.ts'

/**
 * One level's spelling in a staged `reasoningEfforts` dict: a non-empty wire
 * string, or `null` for the explicit-off level. Staged (write-side) faces are
 * schema-narrow: validation from `unknown` happens only at the read seam.
 */
export type ReasoningEffortsDict = Record<string, string | null>

/** One reasoning-effort declaration value (`false`, level dict, or absent → inherit). */
export type ReasoningEffortsValue = ReasoningEffortsDict | false | undefined

/** The full staged capability state of one model row. */
export interface CapabilityState {
  /** New `reasoningEfforts`: a level dict, `false`, or absent (inherit). */
  reasoning: ReasoningEffortsDict | false | undefined
  /** New `input` modality list, or absent (inherit). */
  input: readonly string[] | undefined
  /** New `contextWindow` count, or absent (inherit the route default). */
  contextWindow: number | undefined
  /** New `maxTokens` count, or absent (inherit the route default). */
  maxTokens: number | undefined
}

/** The subset of capability fields the user actually touched in this row. */
export interface CapabilityPatch {
  reasoning?: { value: CapabilityState['reasoning'] }
  input?: { value: CapabilityState['input'] }
  contextWindow?: { value: CapabilityState['contextWindow'] }
  maxTokens?: { value: CapabilityState['maxTokens'] }
}



/**
 * Whether the staged state differs from what a row stores today, so a
 * row with no real change writes nothing.
 */
export function stagedDiffers(entry: Record<string, unknown>, state: CapabilityState): boolean {
  const reasoning = entry['reasoningEfforts']
  const input = entry['input']
  if (state.reasoning !== reasoning) {
    if (state.reasoning === undefined || reasoning === undefined) return true
    if (state.reasoning === false || reasoning === false) return true
    if (JSON.stringify(state.reasoning) !== JSON.stringify(reasoning)) return true
  }
  if (state.input !== input) {
    if (state.input === undefined || input === undefined) return true
    if (JSON.stringify(state.input) !== JSON.stringify(input)) return true
  }
  // Capacities are plain counts: identity IS the comparison.
  if (state.contextWindow !== entry['contextWindow']) return true
  if (state.maxTokens !== entry['maxTokens']) return true
  return false
}

/**
 * The locked four-field capability vocabulary as patch key → stored leaf, in
 * patch order — the single enumeration every write path derives from.
 */
export const CAPABILITY_FIELDS = [
  ['reasoning', 'reasoningEfforts'],
  ['input', 'input'],
  ['contextWindow', 'contextWindow'],
  ['maxTokens', 'maxTokens'],
] as const

/** The capability leaves a row may override — derived, never re-listed. */
export const CAPABILITY_LEAVES = CAPABILITY_FIELDS.map(([, leaf]) => leaf)

/** Reconcile one entry's capability fields with the staged state. */
function applyPatch(entry: Record<string, unknown>, patch: CapabilityPatch): Record<string, unknown> {
  const next: Record<string, unknown> = { ...entry }
  for (const [key, leaf] of CAPABILITY_FIELDS) {
    const part = patch[key]
    if (part === undefined) continue
    if (part.value === undefined) {
      Reflect.deleteProperty(next, leaf)
    } else {
      // Clone structured leaves: a staged dict/array must never become the
      // stored object by reference.
      next[leaf] = Array.isArray(part.value) ? [...part.value] : (typeof part.value === 'object' ? { ...part.value } : part.value)
    }
  }
  return next
}

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
export function declaredEditOps(
  namespace: SettingsNamespaceView,
  path: readonly string[],
  index: number,
  expectedId: string,
  patch: CapabilityPatch,
): SettingsPathOpView[] {
  const models = profileModels(namespace, path, 'user')
  if (!userOwnsModels(namespace, path) || index < 0 || index >= models.length) return []
  const atIndex = models[index]
  let target = atIndex !== undefined && (atIndex['id'] ?? '') === expectedId ? index : -1
  if (target < 0) target = models.findIndex(entry => (entry['id'] ?? '') === expectedId)
  if (target < 0) return []
  const nextModels = models.map((entry, i) => (i === target ? applyPatch(entry, patch) : { ...entry }))
  return [{ op: 'set', path: [...path, 'models'], value: nextModels }]
}

/** Whether an existing override carries any capability leaf this editor owns. */
export function hasCapabilityOverride(override: Record<string, unknown> | undefined): boolean {
  if (override === undefined) return false
  return CAPABILITY_LEAVES.some(leaf => leaf in override)
}

/**
 * Whether the user-layer profile carries NOTHING but overrides: such a profile
 * was minted by onboarding (the first override write materialized it), and
 * when the last override lifts, the whole shell must lift too — the host never
 * prunes empty parents, so a lingering `{}` would keep the route configured
 * and ACTIVE forever, never returning to the dormant list.
 */
function overridesOnlyProfile(namespace: SettingsNamespaceView, path: readonly string[]): boolean {
  // Callers reach here only behind a populated overrides dict, which already
  // proves the user-layer profile exists as an object — no shape defense.
  const keys = Object.keys(getPath(namespace.user ?? {}, path) as Record<string, unknown>)
  return keys.length === 1 && keys[0] === 'modelOverrides'
}

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
export function catalogEditOps(
  namespace: SettingsNamespaceView,
  path: readonly string[],
  modelId: string,
  patch: CapabilityPatch,
): SettingsPathOpView[] {
  const overrides = profileOverrides(namespace, path, 'user')
  const existing = overrides[modelId]
  const sets: SettingsPathOpView[] = []
  const unsets: string[] = []
  for (const [key, leaf] of CAPABILITY_FIELDS) {
    const part = patch[key]
    if (part === undefined) continue
    const opPath = [...path, 'modelOverrides', modelId, leaf]
    if (part.value === undefined) {
      if (existing !== undefined && leaf in existing) unsets.push(leaf)
    } else {
      const value = part.value
      sets.push({ op: 'set', path: opPath, value: Array.isArray(value) ? [...value] : (typeof value === 'object' ? { ...value } : value) })
    }
  }
  if (sets.length > 0) {
    return [...sets, ...unsets.map(leaf => ({ op: 'unset' as const, path: [...path, 'modelOverrides', modelId, leaf] }))]
  }
  if (unsets.length === 0 || existing === undefined) return []
  if (Object.keys(existing).filter(key => !unsets.includes(key)).length === 0) {
    if (Object.keys(overrides).length !== 1) {
      return [{ op: 'unset', path: [...path, 'modelOverrides', modelId] }]
    }
    return overridesOnlyProfile(namespace, path)
      ? [{ op: 'unset', path: [...path] }]
      : [{ op: 'unset', path: [...path, 'modelOverrides'] }]
  }
  return unsets.map(leaf => ({ op: 'unset', path: [...path, 'modelOverrides', modelId, leaf] }))
}

/**
 * Reset one catalog model to the official declaration: unset every capability
 * leaf. When the user-layer override carries nothing else, the whole entry is
 * lifted — and when that entry was the dict's last occupant, the dict itself
 * lifts too. One step further: when that dict was the profile's only content
 * (the onboarding-minted shell), the profile lifts with it, so the route truly
 * returns to the dormant list instead of lingering as an active `{}` shell.
 */
export function resetOverrideOps(
  namespace: SettingsNamespaceView,
  path: readonly string[],
  modelId: string,
): SettingsPathOpView[] {
  const overrides = profileOverrides(namespace, path, 'user')
  const existing = overrides[modelId]
  if (existing === undefined) return []
  const keys = Object.keys(existing)
  const foreign = keys.filter(key => !CAPABILITY_LEAVES.includes(key as (typeof CAPABILITY_LEAVES)[number]))
  if (foreign.length > 0) {
    // Sibling leaves the user owns (e.g. a hand-written name) are not reset.
    return CAPABILITY_LEAVES.filter(leaf => leaf in existing)
      .map(leaf => ({ op: 'unset' as const, path: [...path, 'modelOverrides', modelId, leaf] }))
  }
  if (Object.keys(overrides).length === 1) {
    return overridesOnlyProfile(namespace, path)
      ? [{ op: 'unset', path: [...path] }]
      : [{ op: 'unset', path: [...path, 'modelOverrides'] }]
  }
  return [{ op: 'unset', path: [...path, 'modelOverrides', modelId] }]
}


