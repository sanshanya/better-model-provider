/**
 * Section interaction coverage: the full happy-path declare-edit-apply
 * flows, the mode transitions and validations, read-only behavior, load
 * failure, and the schema-driven hidden fallbacks.
 */

import { useSyncExternalStore } from 'react'
import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, fireEvent, getByLabelText, queryByLabelText, render, screen, waitFor } from '@testing-library/react'
import { CapabilitiesSection } from '../src/client/CapabilitiesSection.tsx'
import { CapabilitiesController } from '../src/client/store.ts'
import { en } from '../src/client/locales.ts'
import { IRemoteApi } from '../src/client/types.ts'
import { assertEmptyPayload, catalogArrangement, defaultArrangement, envelopeError, en as wrap, modelsEnvelope, piAiNamespace, providerEntry, scriptedFace, FaceArrangement, CATALOG_MODELS } from './helpers.ts'

/** Harness-side copy stand-in: exactly what the locale seam hands the page. */
const t = (key: keyof typeof en, params?: Record<string, string | number>): string => {
  let text: string = en[key]
  for (const [name, value] of Object.entries(params ?? {})) text = text.split(`{${name}}`).join(String(value))
  return text
}

/** Mounted handles for one scenario. */
interface Mounted {
  controller: CapabilitiesController
  api: IRemoteApi
  mutates: {
    ns: string
    ops: import('../src/client/types.ts').SettingsPathOpView[]
    expectedRevision: number | undefined
  }[]
}

/** Mount the section with a prebuilt api, waiting for the first paint. */
async function mountApi(api: IRemoteApi): Promise<CapabilitiesController> {
  const controller = new CapabilitiesController(api)
  const useSnapshot = () => useSyncExternalStore(controller.store.subscribe, controller.store.getSnapshot)
  render(<CapabilitiesSection controller={controller} useSnapshot={useSnapshot} t={t} close={() => {}} />)
  void controller.load()
  await waitFor(() => expect(screen.queryByText(en.loading)).toBeNull())
  return controller
}

/** Mount the section over a scripted face, waiting for the first ready paint. async initial load runs inside. */
async function mount(arrange: FaceArrangement = defaultArrangement()): Promise<Mounted> {
  const { api, mutates } = scriptedFace(arrange)
  const controller = await mountApi(api)
  return { controller, api, mutates }
}

/** A bare llm-pi-ai schema envelope declaring exactly `levels` (and `modalities` when given). */
/** Mount the section behind one whole-namespace schema override. */
async function mountWithSchema(schema: unknown): Promise<void> {
  const arrange = defaultArrangement()
  const { api } = scriptedFace(arrange)
  const ns = piAiNamespace(arrange)
  ns.schema = schema
  api.settings.describe = (payload) => {
    assertEmptyPayload('settings.describe', payload)
    return Promise.resolve(wrap({ writable: true, hasDocument: true, namespaces: [ns] }))
  }
  await mountApi(api)
}

function bareSchema(levels: readonly string[], modalities?: readonly string[]): unknown {
  const consts = (values: readonly string[]): readonly unknown[] => values.map(value => ({ type: 'const', value }))
  return modelsEnvelope({
    type: 'array',
    inner: {
      type: 'object',
      dict: {
        id: { type: 'string' },
        reasoningEfforts: {
          type: 'union',
          list: [
            { type: 'const', value: false },
            {
              type: 'dict',
              sKey: { type: 'union', list: consts(levels) },
              inner: { type: 'union', list: [{ type: 'string' }, { type: 'const', value: null }] },
            },
          ],
        },
        ...(modalities === undefined ? {} : { input: { type: 'array', inner: { type: 'union', list: consts(modalities) } } }),
      },
    },
  })
}

/** Expand the first model row's disclosure. */
async function expandFirstModel(): Promise<void> {
  const toggle = document.querySelector<HTMLButtonElement>('.bmp-modelMain .bmp-icon')
  expect(toggle).not.toBeNull()
  fireEvent.click(toggle as HTMLButtonElement)
  await waitFor(() => expect(document.querySelector('.bmp-modelAdvanced')).not.toBeNull())
}

/** The staged capability editors of the first open model row. */
function reasoningSelect(): HTMLSelectElement {
  return getByLabelText(document.body, en.modelReasoning) as HTMLSelectElement
}

/** The input-mode select of the first open model row. */
function inputSelect(): HTMLSelectElement {
  return getByLabelText(document.body, en.modelInput) as HTMLSelectElement
}

afterEach(() => { cleanup() })

describe('declared-route capability editing', () => {
  test('declare levels + modalities on one model, then apply writes models[]', async () => {
    const { mutates } = await mount()
    await expandFirstModel()
    // Custom mode seeds medium + max — the working default pair.
    fireEvent.change(reasoningSelect(), { target: { value: 'custom' } })
    fireEvent.change(inputSelect(), { target: { value: 'custom' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'image' }))
    await waitFor(() => expect(screen.queryByText(en.staged)).not.toBeNull())
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(mutates).toHaveLength(1))
    expect(mutates[0]?.ns).toBe('llm-pi-ai')
    expect(mutates[0]?.ops).toEqual([{
      op: 'set',
      path: ['providers', 'ksyun', 'models'],
      value: [{ id: 'Kimi-K3', name: 'Kimi', reasoningEfforts: { medium: 'medium', max: 'max' }, input: ['text', 'image'] }],
    }])
    await waitFor(() => expect(screen.queryByText(en.staged)).toBeNull())
  })

  test('mode transitions: inherit → non-reasoning → custom seed', async () => {
    await mount()
    await expandFirstModel()
    const select = reasoningSelect()
    expect(select.value).toBe('')
    fireEvent.change(select, { target: { value: 'off' } })
    expect(select.value).toBe('off')
    fireEvent.change(select, { target: { value: 'custom' } })
    expect(select.value).toBe('custom')
    fireEvent.click(screen.getByRole('button', { name: '2 selected' }))
    expect((getByLabelText(document.body, 'medium wire') as HTMLInputElement).value).toBe('medium')
    expect((getByLabelText(document.body, 'max wire') as HTMLInputElement).value).toBe('max')
    fireEvent.change(select, { target: { value: '' } })
    expect(select.value).toBe('')
  })

  test('blank wire on off stores null; blank elsewhere fails validation loudly', async () => {
    await mount()
    await expandFirstModel()
    fireEvent.change(reasoningSelect(), { target: { value: 'custom' } })
    fireEvent.click(screen.getByRole('button', { name: '2 selected' }))
    // The seed checks medium + max; blanking a beyond-off wire must fail loudly.
    expect((screen.getByRole('checkbox', { name: 'medium' }) as HTMLInputElement).checked).toBe(true)
    const mediumWire = getByLabelText(document.body, 'medium wire') as HTMLInputElement
    fireEvent.change(mediumWire, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(screen.queryByText(en.modelReasoningInvalid)).not.toBeNull())
    fireEvent.click(screen.getByRole('checkbox', { name: 'off' }))
    const offWire = getByLabelText(document.body, 'off wire') as HTMLInputElement
    expect(offWire.value).toBe('')
    fireEvent.change(offWire, { target: { value: 'disable' } })
    expect(offWire.value).toBe('disable')
    fireEvent.change(offWire, { target: { value: '' } })
    expect(offWire.value).toBe('')
    fireEvent.change(mediumWire, { target: { value: 'medium' } })
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(screen.queryByText(en.modelReasoningInvalid)).toBeNull())
  })

  test('unchecking the last modality restores inherit', async () => {
    await mount()
    await expandFirstModel()
    fireEvent.change(inputSelect(), { target: { value: 'custom' } })
    expect((screen.getByRole('checkbox', { name: 'text' }) as HTMLInputElement).checked).toBe(true)
    fireEvent.click(screen.getByRole('checkbox', { name: 'text' }))
    expect(inputSelect().value).toBe('')
  })

  test('selecting inherit from custom input clears all modalities', async () => {
      await mount()
      await expandFirstModel()
      fireEvent.change(inputSelect(), { target: { value: 'custom' } })
      expect(inputSelect().value).toBe('custom')
      fireEvent.change(inputSelect(), { target: { value: '' } })
      expect(inputSelect().value).toBe('')
    })

    test('a stored non-string wire renders as an empty wire field', async () => {
      const arrange = defaultArrangement()
      arrange.user = { providers: { ksyun: { models: [{ id: 'Kimi-K3', name: 'Kimi', reasoningEfforts: { minimal: 123 } }] } } }
      arrange.value = arrange.user
      await mount(arrange)
      await expandFirstModel()
      fireEvent.click(screen.getByRole('button', { name: /selected/ }))
      const wire = getByLabelText(document.body, 'minimal wire') as HTMLInputElement
      expect(wire.value).toBe('')
    })

    test('revert discards the staged state', async () => {
    await mount()
    await expandFirstModel()
    fireEvent.change(reasoningSelect(), { target: { value: 'off' } })
    await waitFor(() => expect(screen.queryByText(en.staged)).not.toBeNull())
    fireEvent.click(screen.getByRole('button', { name: en.revert }))
    await waitFor(() => expect(screen.queryByText(en.staged)).toBeNull())
    expect(reasoningSelect().value).toBe('')
  })

  test('the level checklist collapses: closed by default, toggle, outside/Escape dismiss, checked-only wire rows', async () => {
    await mount()
    await expandFirstModel()
    fireEvent.change(reasoningSelect(), { target: { value: 'custom' } })
    // Entering custom seeds medium + max but NEVER springs the picker: the
    // panel opens only on an explicit click.
    const picker = screen.getByRole('button', { name: '2 selected' })
    expect(picker.getAttribute('aria-expanded')).toBe('false')
    expect(document.querySelector('.bmp-msPanel')).toBeNull()
    fireEvent.click(picker)
    expect(getByLabelText(document.body, 'medium wire')).not.toBeNull()
    expect(getByLabelText(document.body, 'max wire')).not.toBeNull()
    expect(queryByLabelText(document.body, 'minimal wire')).toBeNull()
    // Unchecking drops the level and its wire field; re-checking restores it.
    fireEvent.click(screen.getByRole('checkbox', { name: 'max' }))
    expect(screen.getByRole('button', { name: '1 selected' })).not.toBeNull()
    expect(queryByLabelText(document.body, 'max wire')).toBeNull()
    fireEvent.click(screen.getByRole('checkbox', { name: 'max' }))
    expect(screen.getByRole('button', { name: '2 selected' })).not.toBeNull()
    expect(getByLabelText(document.body, 'max wire')).not.toBeNull()
    // The button closes the panel; the staged declaration survives a reopen.
    fireEvent.click(picker)
    expect(document.querySelector('.bmp-msPanel')).toBeNull()
    // Reopen, then an outside pointer press dismisses; an inside press does not.
    fireEvent.click(picker)
    fireEvent.mouseDown(screen.getByRole('checkbox', { name: 'low' }))
    expect(document.querySelector('.bmp-msPanel')).not.toBeNull()
    fireEvent.mouseDown(document.body)
    expect(document.querySelector('.bmp-msPanel')).toBeNull()
    // Reopen once more: non-Escape keys do not dismiss, Escape does.
    fireEvent.click(picker)
    expect(document.querySelector('.bmp-msPanel')).not.toBeNull()
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(document.querySelector('.bmp-msPanel')).not.toBeNull()
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(document.querySelector('.bmp-msPanel')).toBeNull()
    // Leaving custom mode closes the picker entirely.
    fireEvent.change(reasoningSelect(), { target: { value: 'off' } })
    expect(document.querySelector('.bmp-msWrap')).toBeNull()
  })

  test('a stored bad input list blocks apply with its own message', async () => {
    const arrange = defaultArrangement()
    arrange.user = { providers: { ksyun: { models: [{ id: 'Kimi-K3', input: ['video'] }] } } }
    arrange.value = arrange.user
    const { mutates } = await mount(arrange)
    await expandFirstModel()
    fireEvent.change(reasoningSelect(), { target: { value: 'off' } })
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(screen.queryByText(en.modelInputInvalid)).not.toBeNull())
    expect(mutates).toHaveLength(0)
  })

  test('row-local apply failure surfaces on the row', async () => {
    const { api } = await mount()
    api.settings.mutate = () => Promise.reject(new Error('nope'))
    await expandFirstModel()
    fireEvent.change(reasoningSelect(), { target: { value: 'off' } })
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeNull())
    expect(screen.queryByRole('alert')?.textContent).toBe('nope')
  })

  test('a no-op commit keeps the staged draft visible', async () => {
      const { controller } = await mount()
      controller.commit = async () => false
      await expandFirstModel()
      fireEvent.change(reasoningSelect(), { target: { value: 'off' } })
      await waitFor(() => expect(screen.queryByText(en.staged)).not.toBeNull())
      fireEvent.click(screen.getByRole('button', { name: en.apply }))
      await waitFor(() => expect(screen.queryByText(en.staged)).not.toBeNull())
    })

    test('an input-only edit does not unset reasoning or copy other fields', async () => {
    const { mutates } = await mount()
    await expandFirstModel()
    fireEvent.change(inputSelect(), { target: { value: 'custom' } })
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(mutates).toHaveLength(1))
    expect(mutates[0]?.ops).toEqual([{
      op: 'set',
      path: ['providers', 'ksyun', 'models'],
      value: [{ id: 'Kimi-K3', name: 'Kimi', input: ['text'] }],
    }])
  })
})

/** One capacity field of an open model row, addressed by model id and scale. */
function capacityField(modelId: string, scale: 'context' | 'max' = 'context'): HTMLInputElement {
  const label = scale === 'context' ? en.modelContextWindow : en.modelMaxTokens
  return getByLabelText(document.body, `${label} (${modelId})`) as HTMLInputElement
}

/** Expand the first card's manage gate to the loaded official-model list. */
async function manageFirstCatalogCard(): Promise<void> {
  fireEvent.click(screen.getByRole('button', { name: en.manageOfficial }))
  await waitFor(() => expect(document.querySelector('.bmp-modelRow')).not.toBeNull())
}

describe('capacity editing (contextWindow / maxTokens)', () => {

  test('unset capacities show the adapter hints; typing K/M spellings writes plain counts', async () => {
    const { mutates } = await mount()
    await expandFirstModel()
    expect(capacityField('Kimi-K3').placeholder).toBe('256K')
    expect(capacityField('Kimi-K3', 'max').placeholder).toBe('32K')
    fireEvent.change(capacityField('Kimi-K3'), { target: { value: '380K' } })
    fireEvent.change(capacityField('Kimi-K3', 'max'), { target: { value: '32K' } })
    await waitFor(() => expect(screen.queryByText(en.staged)).not.toBeNull())
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(mutates).toHaveLength(1))
    expect(mutates[0]?.ops).toEqual([{
      op: 'set',
      path: ['providers', 'ksyun', 'models'],
      value: [{ id: 'Kimi-K3', name: 'Kimi', contextWindow: 380000, maxTokens: 32000 }],
    }])
    await waitFor(() => expect(screen.queryByText(en.staged)).toBeNull())
    // The written counts render back in the same K vocabulary.
    expect(capacityField('Kimi-K3').value).toBe('380K')
    expect(capacityField('Kimi-K3', 'max').value).toBe('32K')
  })

  test('stored counts render formatted; clearing one field lifts only its leaf', async () => {
    const arrange = defaultArrangement()
    arrange.user = { providers: { ksyun: { models: [{ id: 'Kimi-K3', name: 'Kimi', contextWindow: 128000, maxTokens: 16000 }] } } }
    arrange.value = arrange.user
    const { mutates } = await mount(arrange)
    await expandFirstModel()
    expect(capacityField('Kimi-K3').value).toBe('128K')
    expect(capacityField('Kimi-K3', 'max').value).toBe('16K')
    fireEvent.change(capacityField('Kimi-K3'), { target: { value: '' } })
    // The first touch seeds the sibling from the stored entry — it must keep
    // showing 16K rather than reading as inherit.
    expect(capacityField('Kimi-K3', 'max').value).toBe('16K')
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(mutates).toHaveLength(1))
    expect(mutates[0]?.ops).toEqual([{
      op: 'set',
      path: ['providers', 'ksyun', 'models'],
      value: [{ id: 'Kimi-K3', name: 'Kimi', maxTokens: 16000 }],
    }])
  })

  test('a unreadable or fractional spelling refuses the write with the localized copy', async () => {
    const { mutates } = await mount()
    await expandFirstModel()
    fireEvent.change(capacityField('Kimi-K3'), { target: { value: 'abc' } })
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(screen.queryByText(en.modelCapacityInvalid)).not.toBeNull())
    expect(mutates).toHaveLength(0)
    fireEvent.change(capacityField('Kimi-K3'), { target: { value: '1.5' } })
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(screen.queryByText(en.modelCapacityInvalid)).not.toBeNull())
    expect(mutates).toHaveLength(0)
  })

  test('a valid context with an invalid max-tokens still refuses (the pair validates together)', async () => {
    const { mutates } = await mount()
    await expandFirstModel()
    fireEvent.change(capacityField('Kimi-K3', 'max'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(screen.queryByText(en.modelCapacityInvalid)).not.toBeNull())
    expect(mutates).toHaveLength(0)
  })

})

describe('write conflict posture', () => {
  test('a settings-conflict surfaces the localized conflict copy', async () => {
    const { api } = await mount()
    fireEvent.click(screen.getByRole('button', { name: 'expand' }))
    api.settings.mutate = () => Promise.resolve(envelopeError('settings-conflict', 'revision moved'))
    fireEvent.change(reasoningSelect(), { target: { value: 'off' } })
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(screen.queryByRole('alert')?.textContent).toBe(en.conflict))
    // The draft survives the conflict: the staged badge stays visible.
    expect(screen.queryByText(en.staged)).not.toBeNull()
  })
})

describe('read-only and failure postures', () => {
  test('an empty view points back to the official Models page', async () => {
    const arrange = defaultArrangement()
    arrange.user = {}
    arrange.value = {}
    await mount(arrange)
    expect(screen.queryByText(en.empty)).not.toBeNull()
    expect(screen.queryByText(en.emptyHint)).not.toBeNull()
  })

  test('a declared model list inherited from base renders read-only', async () => {
    const arrange = defaultArrangement()
    arrange.base = { providers: { ksyun: { models: [{ id: 'base-model' }] } } }
    arrange.user = {}
    arrange.value = arrange.base
    await mount(arrange)
    expect(screen.queryByText(en.inheritedModelList)).not.toBeNull()
    await expandFirstModel()
    expect(reasoningSelect().disabled).toBe(true)
  })

  test('an unclassified route never enters the page', async () => {
    const arrange = defaultArrangement()
    // A route the adapter cannot classify has no persistence story: declaring
    // editability on it would be a guess, so the join drops it entirely.
    arrange.user = { providers: { mystery: { models: [{ id: 'M-1' }] } } }
    arrange.value = arrange.user
    arrange.providers = [Object.assign(providerEntry('mystery', false), { declared: undefined })]
    await mount(arrange)
    expect(screen.queryByText(en.empty)).not.toBeNull()
    expect(screen.queryByText(en.emptyHint)).not.toBeNull()
    expect(screen.queryByText('mystery')).toBeNull()
  })

  test('read-only settings hides write affordances', async () => {
    const arrange = defaultArrangement()
    arrange.writable = false
    await mount(arrange)
    expect(screen.queryByText(en.readOnly)).not.toBeNull()
    await expandFirstModel()
    expect(reasoningSelect().disabled).toBe(true)
  })

  test('a load failure shows the error and retries', async () => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    api.llm.providers = (payload) => {
      assertEmptyPayload('llm.providers', payload)
      return Promise.reject(new Error('catalog down'))
    }
    await mountApi(api)
    await waitFor(() => expect(screen.queryByText('catalog down')).not.toBeNull())
    api.llm.providers = (payload) => {
      assertEmptyPayload('llm.providers', payload)
      return Promise.resolve(wrap({ providers: arrange.providers }))
    }
    fireEvent.click(screen.getByRole('button', { name: en.retry }))
    await waitFor(() => expect(screen.queryByText('catalog down')).toBeNull())
  })
})

describe('schema-driven edges', () => {
  test('a vocabulary with only off seeds the null wire', async () => {
    await mountWithSchema(bareSchema(['off'], ['text']))
    await expandFirstModel()
    fireEvent.change(reasoningSelect(), { target: { value: 'custom' } })
    fireEvent.click(screen.getByRole('button', { name: '1 selected' }))
    const offWire = getByLabelText(document.body, 'off wire') as HTMLInputElement
    expect(offWire.value).toBe('')
    expect((screen.getByRole('checkbox', { name: 'off' }) as HTMLInputElement).checked).toBe(true)
  })

  test('a vocabulary without medium/max seeds the first two levels beyond off', async () => {
    await mountWithSchema(bareSchema(['low', 'high'], ['text']))
    await expandFirstModel()
    fireEvent.change(reasoningSelect(), { target: { value: 'custom' } })
    fireEvent.click(screen.getByRole('button', { name: '2 selected' }))
    expect((screen.getByRole('checkbox', { name: 'low' }) as HTMLInputElement).checked).toBe(true)
    expect((screen.getByRole('checkbox', { name: 'high' }) as HTMLInputElement).checked).toBe(true)
  })

  test('a modality-free schema still validates a stored input', async () => {
    const arrange = defaultArrangement()
    arrange.user = { providers: { ksyun: { models: [{ id: 'Kimi-K3', input: ['video'] }] } } }
    arrange.value = arrange.user
    const { api, mutates } = scriptedFace(arrange)
    const bare = piAiNamespace(arrange)
    bare.schema = bareSchema(['off', 'max'])
    api.settings.describe = (payload) => {
      assertEmptyPayload('settings.describe', payload)
      return Promise.resolve(wrap({ writable: true, hasDocument: true, namespaces: [bare] }))
    }
    await mountApi(api)
    await expandFirstModel()
    fireEvent.change(reasoningSelect(), { target: { value: 'off' } })
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(mutates).toHaveLength(1))
    expect(mutates[0]?.ops).toEqual([{
      op: 'set',
      path: ['providers', 'ksyun', 'models'],
      value: [{ id: 'Kimi-K3', input: ['video'], reasoningEfforts: false }],
    }])
  })

  test('a model entry without an id renders its position fallback', async () => {
    const arrange = defaultArrangement()
    arrange.user = { providers: { ksyun: { models: [{ name: 'No Id' }] } } }
    arrange.value = arrange.user
    const { mutates } = await mount(arrange)
    expect(screen.queryByText('#1')).not.toBeNull()
    await expandFirstModel()
    fireEvent.change(reasoningSelect(), { target: { value: 'off' } })
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(mutates).toHaveLength(1))
    expect(mutates[0]?.ops).toEqual([{
      op: 'set',
      path: ['providers', 'ksyun', 'models'],
      value: [{ name: 'No Id', reasoningEfforts: false }],
    }])
  })
})

describe('hidden fallbacks', () => {
  test('schema without the fields hides both editors', async () => {
    await mountWithSchema(modelsEnvelope({ type: 'array', inner: { type: 'object', dict: { id: { type: 'string' } } } }))
    await expandFirstModel()
    expect(queryByLabelText(document.body, en.modelReasoning)).toBeNull()
    expect(queryByLabelText(document.body, en.modelInput)).toBeNull()
  })

})

describe('catalog capability overrides', () => {
  test('models stay behind the manage gate until asked', async () => {
    await mount(catalogArrangement())
    expect(screen.queryByText(en.catalogIntro)).not.toBeNull()
    expect(document.querySelector('.bmp-modelRow')).toBeNull()
    await manageFirstCatalogCard()
    expect(document.querySelectorAll('.bmp-modelRow')).toHaveLength(2)
    expect(screen.queryByText('GPT-5')).not.toBeNull()
  })

  test('official capacity baselines render next to their fields', async () => {
    await mount(catalogArrangement())
    await manageFirstCatalogCard()
    await expandFirstModel()
    expect(screen.queryByText(t('officialValue', { value: '400K' }))).not.toBeNull()
    expect(screen.queryByText(t('officialValue', { value: '128K' }))).not.toBeNull()
    expect(screen.queryByText(t('officialModelsCount', { count: 2 }))).not.toBeNull()
  })

  test('a capacity override writes exactly one sparse modelOverrides leaf', async () => {
    const { mutates } = await mount(catalogArrangement())
    await manageFirstCatalogCard()
    await expandFirstModel()
    fireEvent.change(capacityField('gpt-5'), { target: { value: '64K' } })
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(mutates).toHaveLength(1))
    expect(mutates[0]?.ops).toEqual([{
      op: 'set',
      path: ['providers', 'openai', 'modelOverrides', 'gpt-5', 'contextWindow'],
      value: 64000,
    }])
  })

  test('a checked level starts blank and is refused until spelled', async () => {
    const { mutates } = await mount(catalogArrangement())
    await manageFirstCatalogCard()
    await expandFirstModel()
    expect(reasoningSelect().querySelector(`option[value=""]`)?.textContent).toBe(en.keepOfficial)
    fireEvent.change(reasoningSelect(), { target: { value: 'custom' } })
    await waitFor(() => expect(screen.queryByText(en.wireMapNote)).not.toBeNull())
    // A blank map fails "no level beyond off" before any wire is involved.
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(screen.queryByText(en.modelReasoningInvalid)).not.toBeNull())
    expect(mutates).toHaveLength(0)
    // The level checklist stays collapsed behind its multi-select button.
    fireEvent.click(screen.getByRole('button', { name: t('levelsSelected', { count: 0 }) }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'high' }))
    const wireInput = getByLabelText(document.body, `high ${en.wire}`) as HTMLInputElement
    expect(wireInput.value).toBe('')
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(screen.queryByText(en.modelReasoningInvalid)).not.toBeNull())
    fireEvent.change(wireInput, { target: { value: 'enabled' } })
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(mutates).toHaveLength(1))
    expect(mutates[0]?.ops).toEqual([{
      op: 'set',
      path: ['providers', 'openai', 'modelOverrides', 'gpt-5', 'reasoningEfforts'],
      value: { high: 'enabled' },
    }])
  })

  test('an input override writes the sparse modality leaf', async () => {
    const { mutates } = await mount(catalogArrangement())
    await manageFirstCatalogCard()
    await expandFirstModel()
    const inputSelect = getByLabelText(document.body, en.modelInput) as HTMLSelectElement
    expect(inputSelect.querySelector(`option[value=""]`)?.textContent).toBe(en.keepOfficial)
    fireEvent.change(inputSelect, { target: { value: 'custom' } })
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(mutates).toHaveLength(1))
    expect(mutates[0]?.ops).toEqual([{
      op: 'set',
      path: ['providers', 'openai', 'modelOverrides', 'gpt-5', 'input'],
      value: ['text'],
    }])
  })

  test('an overridden model offers a reset that lifts its override', async () => {
    const arrange = catalogArrangement()
    arrange.user = {
      providers: {
        openai: { baseURL: 'https://x', modelOverrides: { 'gpt-5': { contextWindow: 131072 } } },
      },
    }
    arrange.value = arrange.user
    const { mutates } = await mount(arrange)
    await manageFirstCatalogCard()
    // The summary bar concatenates counts in one node; assert by substring.
    expect(screen.queryByText((content: string) => content.includes(t('overriddenCount', { count: 1 })))).not.toBeNull()
    await expandFirstModel()
    fireEvent.click(screen.getByRole('button', { name: en.resetOfficial }))
    await waitFor(() => expect(mutates).toHaveLength(1))
    expect(mutates[0]?.ops).toEqual([{
      op: 'unset',
      path: ['providers', 'openai', 'modelOverrides'],
    }])
    await waitFor(() => expect(screen.queryByRole('button', { name: en.resetOfficial })).toBeNull())
  })

  test('a rejected reset surfaces its wire reason on the row', async () => {
    const arrange = catalogArrangement()
    arrange.user = {
      providers: {
        openai: { baseURL: 'https://x', modelOverrides: { 'gpt-5': { contextWindow: 131072 } } },
      },
    }
    arrange.value = arrange.user
    const { api } = await mount(arrange)
    await manageFirstCatalogCard()
    await expandFirstModel()
    api.settings.mutate = () => Promise.resolve(envelopeError('internal', 'host down'))
    fireEvent.click(screen.getByRole('button', { name: en.resetOfficial }))
    await waitFor(() => expect(screen.queryByText('host down')).not.toBeNull())
  })

  test('a sparse discovered model renders without baselines or display name', async () => {
    const arrange = catalogArrangement()
    arrange.discoveries = { openai: [{ id: 'gpt-5-nano' }] }
    await mount(arrange)
    await manageFirstCatalogCard()
    expect(screen.queryByText('gpt-5-nano')).not.toBeNull()
    await expandFirstModel()
    expect(document.querySelectorAll('.bmp-officialHint')).toHaveLength(0)
    expect(document.querySelector('.bmp-modelName')).toBeNull()
  })

  test('a discovery failure names it and retries into rows', async () => {
    const arrange = catalogArrangement()
    arrange.discoveries = { openai: new Error('catalog down') }
    await mount(arrange)
    fireEvent.click(screen.getByRole('button', { name: en.manageOfficial }))
    await waitFor(() => expect(screen.queryByText(new RegExp(en.catalogLoadError))).not.toBeNull())
    arrange.discoveries = { openai: CATALOG_MODELS }
    fireEvent.click(screen.getByRole('button', { name: en.retry }))
    await waitFor(() => expect(document.querySelector('.bmp-modelRow')).not.toBeNull())
  })

  test('a catalog route narrowed by a user models list edits it as declared', async () => {
    const arrange = catalogArrangement()
    arrange.user = { providers: { openai: { models: [{ id: 'gpt-5', name: 'Narrowed' }] } } }
    arrange.value = arrange.user
    const { mutates } = await mount(arrange)
    expect(screen.queryByRole('button', { name: en.manageOfficial })).toBeNull()
    await expandFirstModel()
    fireEvent.change(capacityField('gpt-5'), { target: { value: '64K' } })
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(mutates).toHaveLength(1))
    expect(mutates[0]?.ops[0]?.path).toEqual(['providers', 'openai', 'models'])
  })
})

describe('dormant official providers', () => {
  /** One dormant catalog route and one discovered model behind its manage gate. */
  function dormantArrangement(): FaceArrangement {
    return catalogArrangement({ user: {} })
  }

  /** Unfold one dormant provider's card from its compact row. */
  function pickDormantRow(name: string): void {
    const rows = [...document.querySelectorAll('.bmp-dormantRow')]
    const row = rows.find(el => el.querySelector('.bmp-cardMeta')?.textContent?.trim() === name)
    if (row === undefined) throw new Error(`no dormant row for ${name}`)
    fireEvent.click(row)
  }

  test('dormant catalog routes wait as compact rows behind the add button', async () => {
    await mount(dormantArrangement())
    expect(screen.queryByText(en.empty)).not.toBeNull()
    expect(document.querySelectorAll('.bmp-dormantRow')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', {
      name: t('manageOfficialProviders', { count: 1 }),
    }))
    // The list shows the provider name, not a wall of cards.
    expect(document.querySelectorAll('.bmp-dormantRow')).toHaveLength(1)
    expect(screen.queryByText('OpenAI')).not.toBeNull()
    expect(document.querySelectorAll('.bmp-card')).toHaveLength(0)
    expect(screen.queryByText(en.dormantHint)).toBeNull()
    // Dedicated-adapter providers are named as never joining the list.
    expect(screen.queryByText(en.adapterBoundary)).not.toBeNull()
    // Picking the row unfolds the ordinary catalog card inline.
    pickDormantRow('openai')
    expect(screen.queryByText(en.dormantHint)).not.toBeNull()
    expect(screen.queryByText(en.catalogIntro)).not.toBeNull()
    // Picking it again folds the card back away.
    pickDormantRow('openai')
    expect(screen.queryByText(en.dormantHint)).toBeNull()
  })

  test('an onboarded route leaves the list; a still-dormant sibling keeps the region alive', async () => {
    const arrange = dormantArrangement()
    arrange.providers = [
      { ...providerEntry('openai', false), displayName: 'OpenAI' },
      { ...providerEntry('anthropic', false), displayName: 'Anthropic' },
    ]
    const { mutates } = await mount(arrange)
    fireEvent.click(screen.getByRole('button', {
      name: t('manageOfficialProviders', { count: 2 }),
    }))
    pickDormantRow('openai')
    await manageFirstCatalogCard()
    await expandFirstModel()
    fireEvent.change(capacityField('gpt-5'), { target: { value: '64K' } })
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(mutates).toHaveLength(1))
    // The onboarded route moved to the configured list: exactly one card
    // named openai exists (the main-region one), while the folded-fold
    // region keeps its SINGLE still-dormant sibling — no dangling duplicate.
    await waitFor(() => expect(screen.getByRole('button', {
      name: t('manageOfficialProviders', { count: 1 }),
    })).not.toBeNull())
    expect(document.querySelectorAll('.bmp-dormantRow')).toHaveLength(1)
    const openaiCards = [...document.querySelectorAll('.bmp-card')]
      .filter(card => card.querySelector('.bmp-cardMeta')?.textContent?.trim() === 'openai')
    expect(openaiCards).toHaveLength(1)
    const rows = [...document.querySelectorAll('.bmp-dormantRow')]
    expect(rows[0]?.querySelector('.bmp-cardMeta')?.textContent?.trim()).toBe('anthropic')
  })

  test('the first override on a dormant route materializes its profile', async () => {
    const arrange = dormantArrangement()
    const { mutates } = await mount(arrange)
    fireEvent.click(screen.getByRole('button', {
      name: t('manageOfficialProviders', { count: 1 }),
    }))
    pickDormantRow('openai')
    await manageFirstCatalogCard()
    await expandFirstModel()
    fireEvent.change(capacityField('gpt-5'), { target: { value: '64K' } })
    fireEvent.click(screen.getByRole('button', { name: en.apply }))
    await waitFor(() => expect(mutates).toHaveLength(1))
    expect(mutates[0]?.ops).toEqual([{
      op: 'set',
      path: ['providers', 'openai', 'modelOverrides', 'gpt-5', 'contextWindow'],
      value: 64000,
    }])
  })
})
