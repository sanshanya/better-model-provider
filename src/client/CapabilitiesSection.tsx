/**
 * The Model capabilities section: one settings page that declares per-model
 * reasoning-effort levels (with wire spellings) and request modalities.
 * Declared routes edit their `models` rows in place. Every write is a
 * minimal `settings.mutate` path op against the owning `llm-pi-ai`
 * namespace.
 *
 * @module better-model-provider/CapabilitiesSection
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import type {
  CapabilitiesController, CapabilitiesState, CapabilityRowView, ReasoningEffortsValue,
} from './store.ts'
import { messageOf, validInputModalities, validReasoningEfforts } from './store.ts'
import type { CapabilityPatch, CapabilityState } from './writes.ts'
import { declaredEditOps, stagedDiffers } from './writes.ts'
import { CAPACITY_HINT, formatCapacity, parseCapacity, validCapacity } from './capacity.ts'
import { HarnessRpcError } from './types.ts'
import type { CapsKey } from './locales.ts'

/** Bound translator the section and its rows consume. */
export type TFn = (key: CapsKey, params?: Record<string, string | number>) => string

/** The section's inject face bound at registration time. */
export interface CapabilitiesSectionInjected {
  /** The page controller. */
  controller: CapabilitiesController
  /** Identity-stable snapshot hook. */
  useSnapshot: () => CapabilitiesState
  /** Bound translate for this section's dictionaries. */
  t: TFn
}

/** Surface a rejected write: settings-conflict gets the localized, actionable message. */
function writeErrorText(caught: unknown, t: TFn): string {
  if (caught instanceof HarnessRpcError && caught.code === 'settings-conflict') return t('conflict')
  return messageOf(caught)
}

/** Owner share of the settings.section entry. */
export interface CapabilitiesSectionProps extends CapabilitiesSectionInjected {
  /** Close the settings panel. */
  close: () => void
}

/* ================================================================== */
/* Controlled capability editors                                       */
/* ================================================================== */

/** Reasoning-effort mode of the staged state select. */
type ReasoningMode = '' | 'off' | 'custom'

/** Derive the select mode of one staged value. */
function reasoningModeOf(value: ReasoningEffortsValue): ReasoningMode {
  if (value === undefined) return ''
  if (value === false) return 'off'
  return 'custom'
}

/** One level's current wire spelling within the staged dict. */
function wireTextOf(dict: Record<string, unknown>, level: string): string {
  const wire = dict[level]
  if (wire === null) return ''
  return typeof wire === 'string' ? wire : ''
}

/** The controlled reasoning-effort editor. */
function ReasoningEditor(props: {
  /** Schema-derived level vocabulary. */
  levels: readonly string[]
  /** Staged value (`undefined` inherit / `false` / dict). */
  value: ReasoningEffortsValue
  /** Set the staged value. */
  onChange: (value: ReasoningEffortsValue) => void
  /** Whether editing is enabled. */
  enabled: boolean
  /** Binding for copy. */
  t: TFn
  /** Model id for a11y group labels. */
  modelId: string
}): ReactElement | null {
  const { levels, value, onChange, enabled, t, modelId } = props
  // The level checklist collapses behind a multi-select button: the typical
  // declaration checks two or three levels, and wire spellings edit inline on
  // their picker rows — no standing stack of seven rows.
  const [pickerOpen, setPickerOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const mode = reasoningModeOf(value)
  // The picker opens ONLY on an explicit click; leaving custom mode tidies it
  // away. Closing NEVER discards the staged declaration.
  useEffect(() => { if (mode !== 'custom') setPickerOpen(false) }, [mode])
  // Dismiss on outside pointer or Escape while open; nothing else may close it.
  useEffect(() => {
    if (!pickerOpen) return
    const onPointerDown = (event: Event): void => {
      if (rootRef.current !== null && event.target instanceof Node && !rootRef.current.contains(event.target)) setPickerOpen(false)
    }
    const onKeyDown = (event: Event): void => {
      if ((event as globalThis.KeyboardEvent).key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [pickerOpen])
  if (levels.length === 0) return null
  const dict = typeof value === 'object' && value !== null ? value : undefined
  const checked = dict === undefined ? [] : levels.filter(level => level in dict)
  const setMode = (nextMode: ReasoningMode): void => {
    if (nextMode === '') onChange(undefined)
    else if (nextMode === 'off') onChange(false)
    else {
      // Seed the working default `medium` + `max` (the pair most deployments
      // actually declare). Vocabularies lacking either fall back to the first
      // two levels beyond `off`; an only-`off` dict fails the adapter's
      // resolution ("no level beyond off"), so `off` alone still seeds null.
      const preferred = levels.filter(level => level === 'medium' || level === 'max')
      const picked = preferred.length > 0 ? preferred : levels.filter(level => level !== 'off').slice(0, 2)
      if (picked.length === 0) onChange({ off: null })
      else onChange(Object.fromEntries(picked.map(level => [level, level])))
    }
  }
  const toggle = (current: Record<string, unknown>, level: string, checked: boolean): void => {
    const next: Record<string, unknown> = { ...current }
    if (checked) next[level] = level === 'off' ? null : level
    else Reflect.deleteProperty(next, level)
    onChange(next)
  }
  const setWire = (current: Record<string, unknown>, level: string, raw: string): void => {
    const next: Record<string, unknown> = { ...current }
    if (raw === '' && level === 'off') next[level] = null
    else next[level] = raw
    onChange(next)
  }
  return (
    <div className="bmp-block" ref={rootRef}>
      <div className="bmp-blockLabel">{t('modelReasoning')}</div>
      {/* The capacity pair's two-cell discipline: mode select left, detail control right. */}
      <div className="bmp-modeGrid">
        <select
          className="bmp-select"
          aria-label={t('modelReasoning')}
          value={mode}
          disabled={!enabled}
          onChange={event => setMode(event.target.value as ReasoningMode)}
        >
          <option value="">{t('inherit')}</option>
          <option value="off">{t('reasoningOff')}</option>
          <option value="custom">{t('custom')}</option>
        </select>
        {mode === 'custom' && dict !== undefined && (
          <div className="bmp-msWrap">
            <button
              type="button"
              className="bmp-select bmp-msButton"
              aria-haspopup="true"
              aria-expanded={pickerOpen}
              disabled={!enabled}
              onClick={() => setPickerOpen(open => !open)}
            >
              <span>{t('levelsSelected', { count: checked.length })}</span>
              <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                <path
                  d={pickerOpen ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4'}
                  fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </button>
            {pickerOpen && (
              <div className="bmp-msPanel" role="group" aria-label={t('levelGroup', { model: modelId })}>
                {levels.map(level => (
                  <div key={level} className="bmp-msItem">
                    {/* Checkbox and wire input are SIBLINGS: nesting the input
                        inside the label would toggle the level on every click. */}
                    <label className="bmp-msItemCheck">
                      <input
                        type="checkbox"
                        disabled={!enabled}
                        checked={level in dict}
                        onChange={event => toggle(dict, level, event.target.checked)}
                      />
                      <span>{level}</span>
                    </label>
                    {level in dict && (
                      <input
                        className="bmp-input bmp-msWire"
                        aria-label={`${level} ${t('wire')}`}
                        placeholder={level === 'off' ? 'null' : level}
                        value={wireTextOf(dict, level)}
                        disabled={!enabled}
                        onChange={event => setWire(dict, level, event.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Input-modalities mode of the staged state select. */
type InputMode = '' | 'custom'

/** The controlled input-modalities editor. */
function InputEditor(props: {
  /** Schema-derived modality vocabulary. */
  modalities: readonly string[]
  /** Staged value (`undefined` inherit / list). */
  value: readonly unknown[] | undefined
  /** Set the staged value. */
  onChange: (value: readonly unknown[] | undefined) => void
  /** Whether editing is enabled. */
  enabled: boolean
  /** Binding for copy. */
  t: TFn
  /** Model id for a11y group labels. */
  modelId: string
}): ReactElement | null {
  const { modalities, value, onChange, enabled, t, modelId } = props
  if (modalities.length === 0) return null
  const list = value ?? []
  const mode: InputMode = list.length === 0 ? '' : 'custom'
  const setMode = (nextMode: InputMode): void => {
    onChange(nextMode === '' ? undefined : modalities.slice(0, 1))
  }
  const toggle = (modality: string, checked: boolean): void => {
    const next = checked ? [...list, modality] : list.filter(entry => entry !== modality)
    onChange(next.length === 0 ? undefined : next)
  }
  return (
    <div className="bmp-block">
      <div className="bmp-blockLabel">{t('modelInput')}</div>
      <div className="bmp-modeGrid">
        <select
          className="bmp-select"
          aria-label={t('modelInput')}
          value={mode}
          disabled={!enabled}
          onChange={event => setMode(event.target.value as InputMode)}
        >
          <option value="">{t('inherit')}</option>
          <option value="custom">{t('custom')}</option>
        </select>
        {mode === 'custom' && (
          <div className="bmp-modalityRow" role="group" aria-label={t('modalityGroup', { model: modelId })}>
            {modalities.map(modality => (
              <label key={modality} className="bmp-toggle">
                <input
                  type="checkbox"
                  disabled={!enabled}
                  checked={list.includes(modality)}
                  onChange={event => toggle(modality, event.target.checked)}
                />
                <span>{modality}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** The controlled capacity editor: `contextWindow` + `maxTokens` in K/M spelling. */
function CapacityEditor(props: {
  /** Staged text of the `contextWindow` field. */
  contextText: string
  /** Staged text of the `maxTokens` field. */
  maxText: string
  /** Re-stage one field's text. */
  onChange: (field: 'contextWindowText' | 'maxTokensText', text: string) => void
  /** Whether editing is enabled. */
  enabled: boolean
  /** Binding for copy. */
  t: TFn
  /** Model id for a11y group labels. */
  modelId: string
}): ReactElement {
  const { contextText, maxText, onChange, enabled, t, modelId } = props
  const field = (
    label: string,
    hint: string,
    text: string,
    key: 'contextWindowText' | 'maxTokensText',
  ): ReactElement => (
    <label className="bmp-capacityField">
      <span className="bmp-blockLabel">{label}</span>
      <input
        className="bmp-input"
        aria-label={`${label} (${modelId})`}
        placeholder={hint}
        inputMode="numeric"
        value={text}
        disabled={!enabled}
        onChange={event => onChange(key, event.target.value)}
      />
    </label>
  )
  return (
    <div className="bmp-block">
      <div className="bmp-capacityGrid">
        {field(t('modelContextWindow'), CAPACITY_HINT.contextWindow, contextText, 'contextWindowText')}
        {field(t('modelMaxTokens'), CAPACITY_HINT.maxTokens, maxText, 'maxTokensText')}
      </div>
    </div>
  )
}

/* ================================================================== */
/* Model row                                                           */
/* ================================================================== */

/** Staged partial state of one row: null means untouched. */
interface RowDraft {
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
function rowStateOf(entry: Record<string, unknown>, draft: RowDraft | null): CapabilityState {
  return {
    reasoning: draft?.reasoningTouched === true
      ? draft.reasoning
      : entry['reasoningEfforts'] as ReasoningEffortsValue,
    input: draft?.inputTouched === true
      ? draft.input
      : entry['input'] as readonly unknown[] | undefined,
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
function ModelRow(props: {
  /** The stored entry the stage overlays (`{}` without declaration). */
  entry: Record<string, unknown>
  /** Model id for display and edit addressing. */
  modelId: string
  /** Display name; hidden when it equals the id. */
  displayName: string
  /** Row address into the profile: `models[index]`. */
  index: number
  /** Whether settings are writable. */
  writable: boolean
  /** Schema-derived reasoning levels, or none. */
  levels: readonly string[]
  /** Schema-derived request modalities, or none. */
  modalities: readonly string[]
  /** Apply traffic from the row: stage → commit; reload stays in commit. */
  applyRow: (index: number, patch: CapabilityPatch) => Promise<boolean>
  /** Bound translate. */
  t: TFn
}): ReactElement {
  const { entry, modelId, displayName, index, writable, levels, modalities, applyRow, t } = props
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<RowDraft | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const state = rowStateOf(entry, draft)
  const dirty = draft !== null && stagedDiffers(entry, state)
  const touch = (patch: Partial<RowDraft>): void => {
    setDraft(previous => ({
      reasoningTouched: false, inputTouched: false, capacityTouched: false,
      contextWindowText: '', maxTokensText: '',
      ...previous, ...patch,
    }))
    setError(null)
  }
  // The button is disabled while nothing differs, so apply always carries a
  // real change; validate the declaration before any write.
  const apply = async (): Promise<void> => {
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
    setBusy(true)
    setError(null)
    try {
      // The action is rendered only while a draft exists; keeping this path
      // total avoids a second async state machine for an impossible event.
      const wrote = await applyRow(index, patchOf(state, draft!))
      if (wrote) setDraft(null)
    } catch (caught: unknown) {
      setError(writeErrorText(caught, t))
      // commit() already reloads on failure to re-anchor every sibling surface.
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="bmp-modelRow">
      <div className="bmp-modelMain">
        <span className="bmp-modelId" title={modelId}>{modelId}</span>
        {displayName !== '' && displayName !== modelId && <span className="bmp-modelName">{displayName}</span>}
        {draft !== null && <span className="bmp-staged">{t('staged')}</span>}
        <button
          type="button"
          className="bmp-icon"
          aria-label={open ? t('collapse') : t('expand')}
          onClick={() => setOpen(v => !v)}
        >
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path
              d={open ? 'M4 6l4 4 4-4' : 'M6 4l4 4-4 4'}
              fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
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
                const base: RowDraft = previous
                  ?? { reasoningTouched: false, inputTouched: false, capacityTouched: false, contextWindowText: '', maxTokensText: '' }
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
          />
          <ReasoningEditor
            levels={levels}
            value={state.reasoning}
            onChange={value => touch({ reasoningTouched: true, reasoning: value })}
            enabled={writable && !busy}
            t={t}
            modelId={modelId}
          />
          <InputEditor
            modalities={modalities}
            value={state.input}
            onChange={value => touch({ inputTouched: true, input: value })}
            enabled={writable && !busy}
            t={t}
            modelId={modelId}
          />
          {error !== null && <div className="bmp-error" role="alert">{error}</div>}
          {draft !== null && (
            <div className="bmp-rowActions">
              <button
                type="button"
                className="bmp-button"
                disabled={!dirty || busy}
                onClick={() => void apply()}
              >
                {busy ? t('applying') : t('apply')}
              </button>
              <button
                type="button"
                className="bmp-link bmp-danger"
                disabled={busy}
                onClick={() => { setDraft(null); setError(null) }}
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

/* ================================================================== */
/* Provider card                                                       */
/* ================================================================== */

/** One provider card: header + its models with capability editors. */
function ProviderCard(props: {
  /** Joined row: route facts + profile models. */
  row: CapabilityRowView
  /** The page controller. */
  controller: CapabilitiesController
  /** Schema vocabularies. */
  levels: readonly string[]
  /** Schema vocabularies. */
  modalities: readonly string[]
  /** Whether settings are writable. */
  writable: boolean
  /** Bound translate. */
  t: TFn
}): ReactElement {
  const { row, controller, levels, modalities, writable, t } = props
  const applyRow = useCallback(async (
    index: number,
    patch: CapabilityPatch,
  ): Promise<boolean> => {
    // commit() builds from the same authoritative snapshot that supplies
    // expectedRevision, writes, and owns the success/failure reload.
    return controller.commit(snapshot => declaredEditOps(snapshot, row.entry.settingsPath, index, patch))
  }, [controller, row.entry.settingsPath])
  // Rows are declared routes by construction (the store filters), so the
  // only writable question left is whether the user layer owns models[].
  const rowWritable = writable && row.declaredEditable
  return (
    <section className="bmp-card">
      <header className="bmp-cardHeader">
        <span className="bmp-cardTitle">{row.entry.displayName}</span>
        <span className="bmp-cardMeta">{row.entry.provider}</span>
        <span className="bmp-tag">
          {t('declaredRoute')}
        </span>
      </header>
      {row.entry.declared === true && !row.declaredEditable && (
        <p className="bmp-muted">{t('inheritedModelList')}</p>
      )}
      <div className="bmp-models">
        {row.models.map((model, index) => {
          const id = typeof model['id'] === 'string' ? model['id'] as string : ''
          return (
            <ModelRow
              key={id === '' ? `model-${index}` : id}
              entry={model}
              modelId={id === '' ? `#${index + 1}` : id}
              displayName={typeof model['name'] === 'string' ? model['name'] as string : ''}
              index={index}
              writable={rowWritable}
              levels={levels}
              modalities={modalities}
              applyRow={applyRow}
              
              t={t}
            />
          )
        })}
      </div>
    </section>
  )
}

/* ================================================================== */
/* Section                                                             */
/* ================================================================== */

/** The settings.section component for Model capabilities. */
export function CapabilitiesSection(props: CapabilitiesSectionProps): ReactElement {
  const { controller, useSnapshot, t } = props
  const snapshot = useSnapshot()
  const namespace = snapshot.namespace
  // The first mount owns the first fetch: idle is only ever observed here
  // (the controller starts idle and pushed invalidations deliberately skip
  // it), so kicking load() on this render is the page's only way out. Call it
  // directly in the render path like the official Models page does — hook
  // order stays fixed because no hook runs conditionally.
  if (snapshot.status === 'idle') void controller.load()
  if (snapshot.status === 'idle' || snapshot.status === 'loading') {
    return <div className="bmp-section"><p className="bmp-muted">{t('loading')}</p></div>
  }
  if (snapshot.status === 'error') {
    return (
      <div className="bmp-section">
        <div className="bmp-error" role="alert">{snapshot.error}</div>
        <button type="button" className="bmp-button" onClick={() => void controller.reload()}>{t('retry')}</button>
      </div>
    )
  }
  return (
    <div className="bmp-section">
      <h2 className="bmp-title">{t('title')}</h2>
      <p className="bmp-muted">{t('intro')}</p>
      {!snapshot.writable && <p className="bmp-muted">{t('readOnly')}</p>}
      {snapshot.rows.length === 0 && (
        <div className="bmp-empty">
          <div className="bmp-emptyTitle">{t('empty')}</div>
          <div className="bmp-muted">{t('emptyHint')}</div>
        </div>
      )}
      {namespace !== undefined && snapshot.rows.map(row => (
        <ProviderCard
          key={row.entry.provider}
          row={row}
          controller={controller}
          levels={snapshot.levels}
          modalities={snapshot.modalities}
          writable={snapshot.writable}
          t={t}
        />
      ))}
    </div>
  )
}
