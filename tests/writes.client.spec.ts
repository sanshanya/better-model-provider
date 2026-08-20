/**
 * Write-builder coverage: touched capability patches only. The assertions
 * deliberately inspect the exact path operations because an extra unset or a
 * copied effective-layer sibling would change the user's settings ownership.
 */

import { describe, expect, test } from 'vitest'
import { catalogEditOps, declaredEditOps, hasCapabilityOverride, resetOverrideOps, stagedDiffers } from '../src/client/writes.ts'
import type { CapabilityPatch, CapabilityState } from '../src/client/writes.ts'
import { defaultArrangement, piAiNamespace } from './helpers.ts'

describe('declared-route edits', () => {
  test('rewrites a user-owned models array while preserving untouched siblings', () => {
    const arrange = defaultArrangement()
    arrange.user = {
      providers: {
        ksyun: { models: [{ id: 'm1', name: 'M1' }, { id: 'm2', input: ['image'] }] },
      },
    }
    arrange.value = arrange.user
    const ns = piAiNamespace(arrange)
    const patch: CapabilityPatch = {
      reasoning: { value: { max: 'max' } },
    }
    expect(declaredEditOps(ns, ['providers', 'ksyun'], 0, 'm1', patch)).toEqual([{
      op: 'set',
      path: ['providers', 'ksyun', 'models'],
      value: [
        { id: 'm1', name: 'M1', reasoningEfforts: { max: 'max' } },
        { id: 'm2', input: ['image'] },
      ],
    }])
  })

  test('explicit inherit removes only the touched fields', () => {
    const arrange = defaultArrangement()
    arrange.user = {
      providers: {
        ksyun: {
          models: [{ id: 'm1', reasoningEfforts: false, input: ['text', 'image'], name: 'M1' }],
        },
      },
    }
    arrange.value = arrange.user
    const patch: CapabilityPatch = {
      reasoning: { value: undefined },
      input: { value: undefined },
    }
    expect(declaredEditOps(piAiNamespace(arrange), ['providers', 'ksyun'], 0, 'm1', patch)).toEqual([{
      op: 'set',
      path: ['providers', 'ksyun', 'models'],
      value: [{ id: 'm1', name: 'M1' }],
    }])
  })

  test('a capacity patch lands on the addressed entry and leaves siblings untouched', () => {
    const arrange = defaultArrangement()
    arrange.user = {
      providers: {
        ksyun: { models: [{ id: 'm1', contextWindow: 128000 }, { id: 'm2' }] },
      },
    }
    arrange.value = arrange.user
    const patch: CapabilityPatch = {
      contextWindow: { value: 380000 },
      maxTokens: { value: 32000 },
    }
    expect(declaredEditOps(piAiNamespace(arrange), ['providers', 'ksyun'], 1, 'm2', patch)).toEqual([{
      op: 'set',
      path: ['providers', 'ksyun', 'models'],
      value: [
        { id: 'm1', contextWindow: 128000 },
        { id: 'm2', contextWindow: 380000, maxTokens: 32000 },
      ],
    }])
  })

  test('capacity inherit patches remove the leaves from the addressed entry', () => {
    const arrange = defaultArrangement()
    arrange.user = {
      providers: {
        ksyun: { models: [{ id: 'm1', contextWindow: 128000, maxTokens: 16000 }] },
      },
    }
    arrange.value = arrange.user
    expect(declaredEditOps(
      piAiNamespace(arrange),
      ['providers', 'ksyun'],
      0,
      'm1',
      { contextWindow: { value: undefined }, maxTokens: { value: undefined } },
    )).toEqual([{
      op: 'set',
      path: ['providers', 'ksyun', 'models'],
      value: [{ id: 'm1' }],
    }])
  })

  test('an out-of-range index yields no ops', () => {
    const ns = piAiNamespace(defaultArrangement())
    expect(declaredEditOps(ns, ['providers', 'ksyun'], 5, 'x', { reasoning: { value: false } })).toEqual([])
    expect(declaredEditOps(ns, ['providers', 'ksyun'], -1, 'x', { reasoning: { value: false } })).toEqual([])
  })

  test('a base-owned models array is never materialized into user settings', () => {
    const arrange = defaultArrangement()
    arrange.base = { providers: { ksyun: { models: [{ id: 'base-model' }] } } }
    arrange.user = { providers: { unrelated: { baseURL: 'https://example.test' } } }
    arrange.value = {
      providers: {
        ksyun: { models: [{ id: 'base-model' }] },
        unrelated: { baseURL: 'https://example.test' },
      },
    }
    expect(declaredEditOps(
      piAiNamespace(arrange),
      ['providers', 'ksyun'],
      0,
      'base-model',
      { reasoning: { value: false } },
    )).toEqual([])
  })

  test('an entry that drifted from its index is re-anchored by id', () => {
    const arrange = defaultArrangement()
    arrange.user = {
      providers: {
        ksyun: { models: [{ input: ['text'] }, { id: 'm2', contextWindow: 1 }] },
      },
    }
    arrange.value = arrange.user
    const ns = piAiNamespace(arrange)
    // The id-less neighbour occupies the claimed index: re-anchoring walks the
    // whole array and lands on the real owner anyway.
    expect(declaredEditOps(ns, ['providers', 'ksyun'], 0, 'm2', { reasoning: { value: false } })).toEqual([{
      op: 'set',
      path: ['providers', 'ksyun', 'models'],
      value: [{ input: ['text'] }, { id: 'm2', contextWindow: 1, reasoningEfforts: false }],
    }])
    expect(declaredEditOps(ns, ['providers', 'ksyun'], 0, 'ghost', { reasoning: { value: false } })).toEqual([])
  })
})

/** Row factory for the differs table: four keys stay explicit (exactOptionalPropertyTypes). */
function st(
  reasoning: CapabilityState['reasoning'] = undefined,
  input: CapabilityState['input'] = undefined,
  contextWindow: CapabilityState['contextWindow'] = undefined,
  maxTokens: CapabilityState['maxTokens'] = undefined,
): CapabilityState {
  return { reasoning, input, contextWindow, maxTokens }
}

describe('staged differs gate', () => {
  test.each<{ label: string; entry: Record<string, unknown>; state: CapabilityState; differs: boolean }>([
    { label: 'identical values', entry: { reasoningEfforts: { max: 'max' }, input: ['text'] }, state: st({ max: 'max' }, ['text']), differs: false },
    { label: 'from absent to staged', entry: {}, state: st(false), differs: true },
    { label: 'dropped', entry: { reasoningEfforts: { max: 'max' } }, state: st(), differs: true },
    { label: 'same dict different identity', entry: { reasoningEfforts: { max: 'max' } }, state: st({ max: 'max' }), differs: false },
    { label: 'dict reworded', entry: { reasoningEfforts: { max: 'max' } }, state: st({ max: 'ultra' }), differs: true },
    { label: 'false vs dict', entry: { reasoningEfforts: false }, state: st({ max: 'max' }), differs: true },
    { label: 'dict vs false', entry: { reasoningEfforts: { max: 'max' } }, state: st(false), differs: true },
    { label: 'input swap', entry: { input: ['text'] }, state: st(undefined, ['image']), differs: true },
    { label: 'identical capacity', entry: { contextWindow: 380000 }, state: st(undefined, undefined, 380000), differs: false },
    { label: 'capacity changed', entry: { contextWindow: 380000 }, state: st(undefined, undefined, 256000), differs: true },
    { label: 'capacity staged from absent', entry: {}, state: st(undefined, undefined, 380000), differs: true },
    { label: 'capacity dropped to inherit', entry: { maxTokens: 32000 }, state: st(), differs: true },
  ])('$label', ({ entry, state, differs }) => {
    expect(stagedDiffers(entry, state)).toBe(differs)
  })
})

describe('catalog override edits', () => {
  const catalogNs = (overrides: Record<string, unknown> = {}): ReturnType<typeof piAiNamespace> => {
    const arrange = defaultArrangement()
    arrange.user = { providers: { openai: { baseURL: 'https://x', modelOverrides: { ...overrides } } } }
    arrange.value = arrange.user
    return piAiNamespace(arrange)
  }

  test('a touched field writes exactly one leaf under modelOverrides', () => {
    const ns = catalogNs()
    const patch: CapabilityPatch = { contextWindow: { value: 131072 } }
    expect(catalogEditOps(ns, ['providers', 'openai'], 'gpt-5', patch)).toEqual([{
      op: 'set',
      path: ['providers', 'openai', 'modelOverrides', 'gpt-5', 'contextWindow'],
      value: 131072,
    }])
  })

  test('an untouched field writes nothing', () => {
    const ns = catalogNs()
    expect(catalogEditOps(ns, ['providers', 'openai'], 'gpt-5', {})).toEqual([])
  })

  test('an explicit inherit unsets the leaf the user actually owns', () => {
    const ns = catalogNs({ 'gpt-5': { contextWindow: 131072, name: 'kept' } })
    const patch: CapabilityPatch = { contextWindow: { value: undefined } }
    expect(catalogEditOps(ns, ['providers', 'openai'], 'gpt-5', patch)).toEqual([{
      op: 'unset',
      path: ['providers', 'openai', 'modelOverrides', 'gpt-5', 'contextWindow'],
    }])
  })

  test('an inherit for a leaf the user never wrote is skipped — no phantom revision', () => {
    const ns = catalogNs({ 'gpt-5': { name: 'kept' } })
    const patch: CapabilityPatch = { contextWindow: { value: undefined }, maxTokens: { value: 8192 } }
    expect(catalogEditOps(ns, ['providers', 'openai'], 'gpt-5', patch)).toEqual([{
      op: 'set',
      path: ['providers', 'openai', 'modelOverrides', 'gpt-5', 'maxTokens'],
      value: 8192,
    }])
  })

  test('inherit on a model with no override at all stays a no-op commit', () => {
    const ns = catalogNs()
    const patch: CapabilityPatch = { contextWindow: { value: undefined }, reasoning: { value: undefined } }
    expect(catalogEditOps(ns, ['providers', 'openai'], 'gpt-5', patch)).toEqual([])
  })

  test('a pure-inherit patch that empties the entry collapses like a reset', () => {
    // Sole occupant, all leaves inherited away: the dict itself lifts — no
    // `modelOverrides: {}` litter, the same rule resets obey.
    const sole = catalogNs({ 'gpt-5': { contextWindow: 131072 } })
    expect(catalogEditOps(sole, ['providers', 'openai'], 'gpt-5', { contextWindow: { value: undefined } })).toEqual([{
      op: 'unset',
      path: ['providers', 'openai', 'modelOverrides'],
    }])
    // A sibling entry in the same dict keeps the collapse at the entry address.
    const arrange = defaultArrangement()
    arrange.user = {
      providers: {
        openai: {
          baseURL: 'https://x',
          modelOverrides: { 'gpt-5': { contextWindow: 131072 }, 'gpt-5-mini': { maxTokens: 1000 } },
        },
      },
    }
    arrange.value = arrange.user
    expect(catalogEditOps(piAiNamespace(arrange), ['providers', 'openai'], 'gpt-5', { contextWindow: { value: undefined } })).toEqual([{
      op: 'unset',
      path: ['providers', 'openai', 'modelOverrides', 'gpt-5'],
    }])
  })

  test('a mixed set+inherit patch emits both op kinds', () => {
    const ns = catalogNs({ 'gpt-5': { contextWindow: 131072, name: 'kept' } })
    const patch: CapabilityPatch = { contextWindow: { value: undefined }, maxTokens: { value: 8192 } }
    expect(catalogEditOps(ns, ['providers', 'openai'], 'gpt-5', patch)).toEqual([
      { op: 'set', path: ['providers', 'openai', 'modelOverrides', 'gpt-5', 'maxTokens'], value: 8192 },
      { op: 'unset', path: ['providers', 'openai', 'modelOverrides', 'gpt-5', 'contextWindow'] },
    ])
  })

  test('a modality list is cloned out of the staged array', () => {
    const ns = catalogNs()
    const staged: readonly string[] = ['text', 'image']
    const patch: CapabilityPatch = { input: { value: staged } }
    const ops = catalogEditOps(ns, ['providers', 'openai'], 'gpt-5', patch)
    expect(ops).toEqual([{ op: 'set', path: ['providers', 'openai', 'modelOverrides', 'gpt-5', 'input'], value: ['text', 'image'] }])
    const value = (ops[0] as { value: unknown }).value
    expect(value).not.toBe(staged)
    expect(value).toEqual(['text', 'image'])
  })
})

describe('reset to official', () => {
  const withOverride = (override: Record<string, unknown> | undefined): ReturnType<typeof piAiNamespace> => {
    const arrange = defaultArrangement()
    arrange.user = {
      providers: {
        openai: override === undefined ? { baseURL: 'https://x' } : { baseURL: 'https://x', modelOverrides: { 'gpt-5': override } },
      },
    }
    arrange.value = arrange.user
    return piAiNamespace(arrange)
  }

  test('an override carrying only capability leaves lifts the whole dict', () => {
    const ns = withOverride({ contextWindow: 131072, reasoningEfforts: { high: 'enabled' } })
    expect(resetOverrideOps(ns, ['providers', 'openai'], 'gpt-5')).toEqual([{
      op: 'unset',
      path: ['providers', 'openai', 'modelOverrides'],
    }])
  })

  test('a same-dict sibling keeps the reset at the entry address', () => {
    const arrange = defaultArrangement()
    arrange.user = {
      providers: {
        openai: {
          baseURL: 'https://x',
          modelOverrides: {
            'gpt-5': { contextWindow: 131072 },
            'gpt-5-mini': { maxTokens: 1000 },
          },
        },
      },
    }
    arrange.value = arrange.user
    const ns = piAiNamespace(arrange)
    expect(resetOverrideOps(ns, ['providers', 'openai'], 'gpt-5')).toEqual([{
      op: 'unset',
      path: ['providers', 'openai', 'modelOverrides', 'gpt-5'],
    }])
  })

  test('a foreign leaf keeps the entry; only capability leaves lift', () => {
    const ns = withOverride({ name: 'My GPT', contextWindow: 131072, input: ['text'] })
    expect(resetOverrideOps(ns, ['providers', 'openai'], 'gpt-5')).toEqual([
      { op: 'unset', path: ['providers', 'openai', 'modelOverrides', 'gpt-5', 'input'] },
      { op: 'unset', path: ['providers', 'openai', 'modelOverrides', 'gpt-5', 'contextWindow'] },
    ])
  })

  test('a non-capability-only override resets nothing', () => {
    const ns = withOverride({ compat: { thinkingFormat: 'deepseek' } })
    expect(resetOverrideOps(ns, ['providers', 'openai'], 'gpt-5')).toEqual([])
  })

  test('an absent override resets nothing', () => {
    const ns = withOverride(undefined)
    expect(resetOverrideOps(ns, ['providers', 'openai'], 'gpt-5')).toEqual([])
  })

  test('hasCapabilityOverride names what the reset button guards on', () => {
    expect(hasCapabilityOverride(undefined)).toBe(false)
    expect(hasCapabilityOverride({})).toBe(false)
    expect(hasCapabilityOverride({ name: 'x' })).toBe(false)
    expect(hasCapabilityOverride({ name: 'x', maxTokens: 1 })).toBe(true)
    expect(hasCapabilityOverride({ reasoningEfforts: false })).toBe(true)
  })
  test('a reset on an overrides-only onboarding shell lifts the whole profile', () => {
    const arrange = defaultArrangement()
    arrange.user = { providers: { openai: { modelOverrides: { 'gpt-5': { contextWindow: 131072 } } } } }
    arrange.value = arrange.user
    expect(resetOverrideOps(piAiNamespace(arrange), ['providers', 'openai'], 'gpt-5')).toEqual([{
      op: 'unset',
      path: ['providers', 'openai'],
    }])
  })

  test('a pure-inherit collapse on the onboarding shell lifts the profile too', () => {
    const arrange = defaultArrangement()
    arrange.user = { providers: { openai: { modelOverrides: { 'gpt-5': { contextWindow: 131072 } } } } }
    arrange.value = arrange.user
    expect(catalogEditOps(piAiNamespace(arrange), ['providers', 'openai'], 'gpt-5', { contextWindow: { value: undefined } })).toEqual([{
      op: 'unset',
      path: ['providers', 'openai'],
    }])
  })

})
