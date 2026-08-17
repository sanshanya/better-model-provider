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
import { profileModels, userOwnsModels } from './store.ts'
import type { ReasoningEffortsValue } from './store.ts'
import { parseCapacity } from './capacity.ts'

/** The full staged capability state of one model row. */
export interface CapabilityState {
  /** New `reasoningEfforts`: a level dict, `false`, or absent (inherit). */
  reasoning: Record<string, unknown> | false | undefined
  /** New `input` modalidies list, or absent (inherit). */
  input: readonly unknown[] | undefined
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

/** Staged partial state of one row: null means untouched. */
export interface RowDraft {
  /** The row edited reasoning (`undefined` staged means "inherit"). */
  reasoningTouched: boolean
  /** Staged reasoning-effort declaration. */
  reasoning?: ReasoningEffortsValue | undefined
  /** The row edited input (`undefined` staged means "inherit"). */
  inputTouched: boolean
  /** Staged input modalities. */
  input?: readonly unknown[] | undefined
  /** The row edited either capacity field (blank text means "inherit"). */
  capacityTouched: boolean
  /** Staged `contextWindow` text (K/M spellings; parsed on use). */
  contextWindowText: string
  /** Staged `maxTokens` text (K/M spellings; parsed on use). */
  maxTokensText: string
}

/** Build the row's whole state: stored entry overlaid with the draft. */
export function rowStateOf(entry: Record<string, unknown>, draft: RowDraft | null): CapabilityState {
  return {
    reasoning: draft?.reasoningTouched === true
      ? draft.reasoning
      : entry['reasoningEfforts'] as ReasoningEffortsValue,
    input: draft?.inputTouched === true
      ? draft.input
      : entry['input'] as readonly unknown[] | undefined,
    contextWindow: draft?.capacityTouched === true
      ? parseCapacity(draft.contextWindowText)
      : entry['contextWindow'] as number | undefined,
    maxTokens: draft?.capacityTouched === true
      ? parseCapacity(draft.maxTokensText)
      : entry['maxTokens'] as number | undefined,
  }
}

/** Convert the row's touched flags into a patch that preserves inheritance. */
export function patchOf(state: CapabilityState, draft: RowDraft): CapabilityPatch {
  const patch: CapabilityPatch = {}
  if (draft.reasoningTouched) patch.reasoning = { value: state.reasoning }
  if (draft.inputTouched) patch.input = { value: state.input }
  if (draft.capacityTouched) {
    patch.contextWindow = { value: state.contextWindow }
    patch.maxTokens = { value: state.maxTokens }
  }
  return patch
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

/** Capability patch key → stored entry leaf, in patch order. */
const CAPABILITY_FIELDS = [
  ['reasoning', 'reasoningEfforts'],
  ['input', 'input'],
  ['contextWindow', 'contextWindow'],
  ['maxTokens', 'maxTokens'],
] as const

/** Reconcile one entry's capability fields with the staged state. */
function applyPatch(entry: Record<string, unknown>, patch: CapabilityPatch): Record<string, unknown> {
  const next: Record<string, unknown> = { ...entry }
  for (const [key, leaf] of CAPABILITY_FIELDS) {
    const part = patch[key]
    if (part === undefined) continue
    if (part.value === undefined) Reflect.deleteProperty(next, leaf)
    else next[leaf] = Array.isArray(part.value) ? [...part.value] : part.value
  }
  return next
}

/**
 * Stage one declared-route model's touched patch. The route's models array is
 * rewritten only when the user layer owns that array; an inherited base array
 * is intentionally not materialized by this thin editor.
 */
export function declaredEditOps(
  namespace: SettingsNamespaceView,
  path: readonly string[],
  index: number,
  patch: CapabilityPatch,
): SettingsPathOpView[] {
  const models = profileModels(namespace, path, 'user')
  if (!userOwnsModels(namespace, path) || index < 0 || index >= models.length) return []
  const nextModels = models.map((entry, i) => (i === index ? applyPatch(entry, patch) : { ...entry }))
  return [{ op: 'set', path: [...path, 'models'], value: nextModels }]
}


