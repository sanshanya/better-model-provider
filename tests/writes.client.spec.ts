/**
 * Write-builder coverage: touched capability patches only. The assertions
 * deliberately inspect the exact path operations because an extra unset or a
 * copied effective-layer sibling would change the user's settings ownership.
 */

import { describe, expect, test } from 'vitest'
import { declaredEditOps, stagedDiffers } from '../src/client/writes.ts'
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
    expect(declaredEditOps(ns, ['providers', 'ksyun'], 0, patch)).toEqual([{
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
    expect(declaredEditOps(piAiNamespace(arrange), ['providers', 'ksyun'], 0, patch)).toEqual([{
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
    expect(declaredEditOps(piAiNamespace(arrange), ['providers', 'ksyun'], 1, patch)).toEqual([{
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
      { contextWindow: { value: undefined }, maxTokens: { value: undefined } },
    )).toEqual([{
      op: 'set',
      path: ['providers', 'ksyun', 'models'],
      value: [{ id: 'm1' }],
    }])
  })

  test('an out-of-range index yields no ops', () => {
    const ns = piAiNamespace(defaultArrangement())
    expect(declaredEditOps(ns, ['providers', 'ksyun'], 5, { reasoning: { value: false } })).toEqual([])
    expect(declaredEditOps(ns, ['providers', 'ksyun'], -1, { reasoning: { value: false } })).toEqual([])
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
      { reasoning: { value: false } },
    )).toEqual([])
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
