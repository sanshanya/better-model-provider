/**
 * The model row: header disclosure plus its staged capability draft and the
 * apply/revert/reset traffic. One row stages text first and parses at the
 * leaf — a half-typed capacity is a draft too — and every write is one
 * commit closure addressing the fresh namespace inside the mutation tail.
 *
 * @module better-model-provider/rows
 */

import { useRef, useState } from 'react'
import type { ReactElement } from 'react'
import type { TFn } from './locales.ts'
import type { CapabilityPatch, CapabilityState, ReasoningEffortsValue } from './writes.ts'
import { stagedDiffers } from './writes.ts'
import { validCapacity } from './capacity.ts'
import { formatCapacity, parseCapacity } from './capacity.ts'
import { validInputModalities, validReasoningEfforts } from './store.ts'
import { CapacityEditor, Chevron, InputEditor, ReasoningEditor, writeErrorText } from './editors.tsx'

/** Staged partial state of one row: null means untouched. */
export interface RowDraft {
  /** The row edited reasoning (`undefined` staged means "inherit"). */
  reasoningTouched: boolean
  /** Staged reasoning-effort declaration. */
  reasoning?: ReasoningEffortsValue | undefined
  /** The row edited input (`undefined` staged means "inherit"). */
  inputTouched: boolean
  /** Staged input modalities. */
  input?: readonly string[] | undefined
  /** The row edited either capacity field (blank text means "inherit"). */
  capacityTouched: boolean
  /** Staged `contextWindow` text (K/M spellings; parsed on use). */
  contextWindowText: string
  /** Staged `maxTokens` text (K/M spellings; parsed on use). */
  maxTokensText: string
}

/** The untouched draft — every `setDraft` seeds from one literal. */
const EMPTY_DRAFT: RowDraft = {
  reasoningTouched: false,
  inputTouched: false,
  capacityTouched: false,
  contextWindowText: '',
  maxTokensText: '',
}

/** Build the row's whole state: stored entry overlaid with the draft. */
export function rowStateOf(entry: Record<string, unknown>, draft: RowDraft | null): CapabilityState {
  return {
    // Read seam: entry leaves stay wire-unknown until apply-time validation
    // (validReasoningEfforts/validInputModalities) certifies a write over them.
    reasoning: draft?.reasoningTouched === true
      ? draft.reasoning
      : entry['reasoningEfforts'] as ReasoningEffortsValue,
    input: draft?.inputTouched === true
      ? draft.input
      : entry['input'] as readonly string[] | undefined,
    // Capacities stage as text (a half-typed "38" is a draft too) and parse at
    // the leaf: an unreadable spelling parses to NaN, differs from anything
    // stored, and is refused by the apply-time validation below.
    contextWindow: draft?.capacityTouched === true
      ? parseCapacity(draft.contextWindowText)
      : entry['contextWindow'] as number | undefined,
    maxTokens: draft?.capacityTouched === true
      ? parseCapacity(draft.maxTokensText)
      : entry['maxTokens'] as number | undefined,
  }
}

/** Convert the row's touched flags into a patch that preserves inheritance. */
function patchOf(state: CapabilityState, draft: RowDraft): CapabilityPatch {
  const patch: CapabilityPatch = {}
  if (draft.reasoningTouched) patch.reasoning = { value: state.reasoning }
  if (draft.inputTouched) patch.input = { value: state.input }
  if (draft.capacityTouched) {
    patch.contextWindow = { value: state.contextWindow }
    patch.maxTokens = { value: state.maxTokens }
  }
  return patch
}

/** One model row: header, disclosure with both editors, and its save traffic. */
export function ModelRow(props: {
  /** The stored entry the stage overlays (`{}` without declaration or override). */
  entry: Record<string, unknown>
  /** Model id for display and edit addressing. */
  modelId: string
  /** Display name; hidden when it equals the id. */
  displayName: string
  /** Whether settings are writable. */
  writable: boolean
  /** Schema-derived reasoning levels, or none. */
  levels: readonly string[]
  /** Schema-derived request modalities, or none. */
  modalities: readonly string[]
  /** Editor flavor: own declaration or sparse catalog override. */
  flavor: 'declared' | 'catalog'
  /** Apply traffic from the row: stage → commit; reload stays in commit. */
  applyRow: (patch: CapabilityPatch) => Promise<boolean>
  /** Catalog rows only: lift the whole capability override back to official. */
  resetRow?: (() => Promise<boolean>) | undefined
  /** Official context-window baseline text, when the discovery seam answers. */
  officialContext?: string | undefined
  /** Official max-tokens baseline text, when the discovery seam answers. */
  officialMax?: string | undefined
  /** Bound translate. */
  t: TFn
}): ReactElement {
  const {
    entry, modelId, displayName, writable, levels, modalities, flavor,
    applyRow, resetRow, officialContext, officialMax, t,
  } = props
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<RowDraft | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const expandRef = useRef<HTMLButtonElement | null>(null)
  const state = rowStateOf(entry, draft)
  const dirty = draft !== null && stagedDiffers(entry, state)
  const touch = (patch: Partial<RowDraft>): void => {
    setDraft(previous => ({ ...EMPTY_DRAFT, ...previous, ...patch }))
    setError(null)
  }
  // One write scaffold for apply and reset: busy/error toggling, the wire
  // error text, and focus back to the row's expander when the action row
  // unmounts (the Apply button held focus until success).
  const runWrite = async (action: () => Promise<boolean>, settle?: () => void): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      if (await action()) settle?.()
    } catch (caught: unknown) {
      // commit() already reloads on failure to re-anchor every sibling surface.
      setError(writeErrorText(caught, t))
    } finally {
      setBusy(false)
    }
  }
  const clearDraft = (): void => {
    expandRef.current?.focus()
    setDraft(null)
  }
  // The Apply button exists only while a draft exists, so the action takes
  // the patch as an argument — no unreachable inner guard. Validate the
  // declaration before any write; the button is disabled while nothing differs.
  const apply = (patch: CapabilityPatch): void => {
    if (!validReasoningEfforts(state.reasoning)) {
      setError(t('modelReasoningInvalid'))
      return
    }
    if (!validInputModalities(state.input, modalities.length === 0 ? undefined : [...modalities])) {
      setError(t('modelInputInvalid'))
      return
    }
    if (!validCapacity(state.contextWindow) || !validCapacity(state.maxTokens)) {
      setError(t('modelCapacityInvalid'))
      return
    }
    void runWrite(() => applyRow(patch), clearDraft)
  }
  /** Lift the override — the disclosure removes the Reset button on success. */
  const reset = (doReset: () => Promise<boolean>): void => {
    void runWrite(doReset, () => expandRef.current?.focus())
  }
  return (
    <div className="bmp-modelRow">
      <div className="bmp-modelMain">
        <span className="bmp-modelId" title={modelId}>{modelId}</span>
        {displayName !== '' && displayName !== modelId && <span className="bmp-modelName">{displayName}</span>}
        {draft !== null && <span className="bmp-staged">{t('staged')}</span>}
        <button
          ref={expandRef}
          type="button"
          className="bmp-icon"
          aria-label={open ? t('collapse') : t('expand')}
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          <Chevron pointing={open ? 'down' : 'right'} />
        </button>
      </div>
      {open && (
        <div className="bmp-modelAdvanced">
          <CapacityEditor
            contextText={draft?.capacityTouched === true
              ? draft.contextWindowText
              : formatCapacity(entry['contextWindow'])}
            maxText={draft?.capacityTouched === true
              ? draft.maxTokensText
              : formatCapacity(entry['maxTokens'])}
            onChange={(key, text) => {
              // First capacity touch seeds BOTH fields from the stored entry:
              // the staged state covers the field pair as one group, so an
              // unseeded sibling would read as "inherit" and blank its display.
              setDraft(previous => {
                const base: RowDraft = previous ?? EMPTY_DRAFT
                const seeded = base.capacityTouched ? base : {
                  ...base,
                  contextWindowText: formatCapacity(entry['contextWindow']),
                  maxTokensText: formatCapacity(entry['maxTokens']),
                }
                return { ...seeded, capacityTouched: true, [key]: text }
              })
              setError(null)
            }}
            enabled={writable && !busy}
            t={t}
            modelId={modelId}
            officialContext={officialContext}
            officialMax={officialMax}
          />
          <ReasoningEditor
            levels={levels}
            value={state.reasoning}
            onChange={value => touch({ reasoningTouched: true, reasoning: value })}
            enabled={writable && !busy}
            t={t}
            modelId={modelId}
            official={flavor === 'catalog'}
          />
          <InputEditor
            modalities={modalities}
            value={state.input}
            onChange={value => touch({ inputTouched: true, input: value })}
            enabled={writable && !busy}
            t={t}
            modelId={modelId}
            official={flavor === 'catalog'}
          />
          {error !== null && <div className="bmp-error" role="alert">{error}</div>}
          {resetRow !== undefined && draft === null && (
            <div className="bmp-rowActions">
              <button
                type="button"
                className="bmp-link bmp-danger"
                disabled={busy}
                onClick={() => { if (resetRow !== undefined) reset(resetRow) }}
              >
                {busy ? t('applying') : t('resetOfficial')}
              </button>
            </div>
          )}
          {draft !== null && (
            <div className="bmp-rowActions">
              <button
                type="button"
                className="bmp-button"
                disabled={!dirty || busy}
                onClick={() => { if (draft !== null) apply(patchOf(state, draft)) }}
              >
                {busy ? t('applying') : t('apply')}
              </button>
              <button
                type="button"
                className="bmp-link bmp-danger"
                disabled={busy}
                onClick={clearDraft}
              >
                {t('revert')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
