/**
 * The controlled capability editors — reasoning mapping, input modalities,
 * and the K/M capacity pair — plus the small shared shells (mode select,
 * chevron, write-error text) every row composes from. Editors are pure staged
 * state machines: they know the copy and the vocabulary, never the write path.
 *
 * @module better-model-provider/editors
 */

import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import type { TFn } from './locales.ts'
import type { ReasoningEffortsDict, ReasoningEffortsValue } from './writes.ts'
import { HarnessRpcError } from './types.ts'
import { messageOf } from './store.ts'
import { CAPACITY_HINT } from './capacity.ts'

/** Surface a rejected write: settings-conflict gets the localized, actionable message. */
export function writeErrorText(caught: unknown, t: TFn): string {
  if (caught instanceof HarnessRpcError && caught.code === 'settings-conflict') return t('conflict')
  return messageOf(caught)
}

/** The disclosures' chevron: direction is the only variation. */
export function Chevron(props: { readonly pointing: 'up' | 'down' | 'right' }): ReactElement {
  const { pointing } = props
  const d = pointing === 'up' ? 'M4 10l4-4 4 4' : pointing === 'down' ? 'M4 6l4 4 4-4' : 'M6 4l4 4-4 4'
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * The shared mode-select shell: label-wired select with the option list
 * supplied declaratively. The first option is the inherit choice — its copy
 * differs by flavor ("跟随官方" over a catalog row), never by geometry.
 */
function ModeSelect(props: {
  /** Accessible name. */
  label: string
  /** Current mode option value. */
  mode: string
  /** Whether editing is enabled. */
  enabled: boolean
  /** `[value, label]` pairs in render order. */
  options: readonly [string, string][]
  /** Change the mode. */
  onChange: (mode: string) => void
}): ReactElement {
  const { label, mode, enabled, options, onChange } = props
  return (
    <select
      className="bmp-select"
      aria-label={label}
      value={mode}
      disabled={!enabled}
      onChange={event => onChange(event.target.value)}
    >
      {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
    </select>
  )
}

/** Reasoning-effort mode of the staged state select. */
type ReasoningMode = '' | 'off' | 'custom'

/** Derive the select mode of one staged value. */
function reasoningModeOf(value: ReasoningEffortsValue): ReasoningMode {
  if (value === undefined) return ''
  if (value === false) return 'off'
  return 'custom'
}

/** One level's current wire spelling within the staged dict. */
function wireTextOf(dict: ReasoningEffortsDict, level: string): string {
  // Read seam: the stored document can hold anything a hand-edited YAML
  // carried; non-strings render blank rather than leaking into the field.
  const wire: unknown = dict[level]
  return typeof wire === 'string' ? wire : ''
}

/** The controlled reasoning-effort editor. */
export function ReasoningEditor(props: {
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
  /** Catalog-override flavor: keep-official posture, never a fabricated wire spelling. */
  official: boolean
}): ReactElement | null {
  const { levels, value, onChange, enabled, t, modelId, official } = props
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
  const setMode = (nextMode: string): void => {
    if (nextMode === '') onChange(undefined)
    else if (nextMode === 'off') onChange(false)
    else {
      if (official) {
        // Sparse posture: an override that names no level yet. The wire map
        // is NEVER self-seeded — a level's id is not its spelling on the
        // wire, and inventing one would fabricate a fact the host cannot
        // answer. The user checks levels and spells every wire value.
        onChange({})
        return
      }
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
  const toggle = (current: ReasoningEffortsDict, level: string, checked: boolean): void => {
    const next: ReasoningEffortsDict = { ...current }
    // Catalog overrides spell nothing for the user: a freshly checked level
    // starts blank and apply-validation demands an explicit wire value.
    if (checked) next[level] = level === 'off' ? null : (official ? '' : level)
    else Reflect.deleteProperty(next, level)
    onChange(next)
  }
  const setWire = (current: ReasoningEffortsDict, level: string, raw: string): void => {
    const next: ReasoningEffortsDict = { ...current }
    if (raw === '' && level === 'off') next[level] = null
    else next[level] = raw
    onChange(next)
  }
  return (
    <div className="bmp-block" ref={rootRef}>
      <div className="bmp-blockLabel">{t('modelReasoning')}</div>
      {/* The capacity pair's two-cell discipline: mode select left, detail control right. */}
      <div className="bmp-modeGrid">
        <ModeSelect
          label={t('modelReasoning')}
          mode={mode}
          enabled={enabled}
          options={[
            ['', official ? t('keepOfficial') : t('inherit')],
            ['off', official ? t('disableReasoning') : t('reasoningOff')],
            ['custom', official ? t('customMapping') : t('custom')],
          ]}
          onChange={setMode}
        />
        {mode === 'custom' && dict !== undefined && (
          <div className="bmp-msWrap">
            <button
              type="button"
              className="bmp-select bmp-msButton"
              aria-haspopup="dialog"
              aria-expanded={pickerOpen}
              aria-controls={`bmp-levels-${modelId}`}
              disabled={!enabled}
              onClick={() => setPickerOpen(open => !open)}
            >
              <span>{t('levelsSelected', { count: checked.length })}</span>
              <Chevron pointing={pickerOpen ? 'up' : 'down'} />
            </button>
            {pickerOpen && (
              <div
                className="bmp-msPanel"
                id={`bmp-levels-${modelId}`}
                role="group"
                aria-label={t('levelGroup', { model: modelId })}
              >
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
                        placeholder={level === 'off' ? 'null' : official ? '…' : level}
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
      {official && mode === 'custom' && <p className="bmp-muted">{t('wireMapNote')}</p>}
    </div>
  )
}

/** The controlled input-modalities editor. */
export function InputEditor(props: {
  /** Schema-derived modality vocabulary. */
  modalities: readonly string[]
  /** Staged value (`undefined` inherit / list). */
  value: readonly string[] | undefined
  /** Set the staged value. */
  onChange: (value: readonly string[] | undefined) => void
  /** Whether editing is enabled. */
  enabled: boolean
  /** Binding for copy. */
  t: TFn
  /** Model id for a11y group labels. */
  modelId: string
  /** Catalog-override flavor: inherit reads as "keep official". */
  official: boolean
}): ReactElement | null {
  const { modalities, value, onChange, enabled, t, modelId, official } = props
  if (modalities.length === 0) return null
  const list = value ?? []
  const mode = list.length === 0 ? '' : 'custom'
  const setMode = (nextMode: string): void => {
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
        <ModeSelect
          label={t('modelInput')}
          mode={mode}
          enabled={enabled}
          options={[
            ['', official ? t('keepOfficial') : t('inherit')],
            ['custom', t('custom')],
          ]}
          onChange={setMode}
        />
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
export function CapacityEditor(props: {
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
  /** Official catalog baseline for the context field, when the wire answers one. */
  officialContext?: string | undefined
  /** Official catalog baseline for the max-tokens field, when the wire answers one. */
  officialMax?: string | undefined
}): ReactElement {
  const { contextText, maxText, onChange, enabled, t, modelId, officialContext, officialMax } = props
  const field = (
    label: string,
    hint: string,
    text: string,
    key: 'contextWindowText' | 'maxTokensText',
    official: string | undefined,
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
      {official !== undefined && <span className="bmp-officialHint">{t('officialValue', { value: official })}</span>}
    </label>
  )
  return (
    <div className="bmp-block">
      <div className="bmp-capacityGrid">
        {field(t('modelContextWindow'), CAPACITY_HINT.contextWindow, contextText, 'contextWindowText', officialContext)}
        {field(t('modelMaxTokens'), CAPACITY_HINT.maxTokens, maxText, 'maxTokensText', officialMax)}
      </div>
    </div>
  )
}
