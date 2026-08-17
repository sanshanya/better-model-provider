/**
 * Store unit coverage: schema-derived vocabulary reads, validation rules,
 * path reads, and the controller's join; the write builders get their own
 * file so plan variants stay enumerable.
 */

import { describe, expect, test } from 'vitest'
import {
  CapabilitiesController, createSnapshotStore, extractCapabilityVocabulary, messageOf, profileModels,
  validInputModalities, validReasoningEfforts,
} from '../src/client/store.ts'
import type { SettingsNamespaceView } from '../src/client/types.ts'
import { assertEmptyPayload, defaultArrangement, envelopeError, envelopeOk, modelsEnvelope, piAiNamespace, scriptedFace } from './helpers.ts'

describe('vocabulary from the serialized schema', () => {
  const ns = piAiNamespace(defaultArrangement())

  test('reasoning levels follow the schema order', () => {
    expect(extractCapabilityVocabulary(ns).levels).toEqual(['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'])
  })

  test('input modalities follow the schema order', () => {
    expect(extractCapabilityVocabulary(ns).modalities).toEqual(['text', 'image'])
  })

  const bareNs = (schema: unknown): SettingsNamespaceView =>
    ({ ns: 'x', value: {}, applies: 'live', secrets: [], schema: schema as SettingsNamespaceView['schema'], revision: 0 })

  test.each([
    ['no namespace', undefined, []],
    ['no models field', bareNs({ type: 'object', dict: {} }), []],
    ['models not an array', bareNs(modelsEnvelope({ type: 'string' })), []],
    ['item not an object', bareNs(modelsEnvelope({ type: 'array', inner: { type: 'string' } })), []],
    ['schema not an object', bareNs('not-an-envelope'), []],
    ['malformed envelope rehydrate throws', bareNs(null), []],
  ])('%s yields an empty vocabulary', (_label, namespace, expected) => {
    expect(extractCapabilityVocabulary(namespace as SettingsNamespaceView).levels).toEqual(expected)
    expect(extractCapabilityVocabulary(namespace as SettingsNamespaceView).modalities).toEqual(expected)
  })

  test('a models item without the fields yields nothing', () => {
    const bare = bareNs(modelsEnvelope({ type: 'array', inner: { type: 'object', dict: { id: { type: 'string' } } } }))
    expect(extractCapabilityVocabulary(bare).levels).toEqual([])
    expect(extractCapabilityVocabulary(bare).modalities).toEqual([])
  })

  test('a dict key union without a list or with non-strings yields only strings', () => {
    const shaped = bareNs(modelsEnvelope({
      type: 'array',
      inner: {
        type: 'object',
        dict: {
          reasoningEfforts: {
            type: 'union',
            list: [{ type: 'dict', sKey: { type: 'union', list: [{ type: 'const', value: 'good' }, { type: 'const', value: 7 }] }, inner: { type: 'string' } }],
          },
          input: { type: 'array', inner: { type: 'union', list: [{ type: 'const', value: 3 }] } },
        },
      },
    }))
    expect(extractCapabilityVocabulary(shaped).levels).toEqual(['good'])
    expect(extractCapabilityVocabulary(shaped).modalities).toEqual([])

    const keyless = bareNs(modelsEnvelope({
      type: 'array',
      inner: {
        type: 'object',
        dict: {
          reasoningEfforts: {
            type: 'union',
            list: [{ type: 'dict', sKey: { type: 'string' }, inner: { type: 'string' } }],
          },
        },
      },
    }))
    expect(extractCapabilityVocabulary(keyless).levels).toEqual([])
  })

  test('a reasoningEfforts schema without the dict member yields nothing', () => {
    const without = bareNs(modelsEnvelope({
      type: 'array',
      inner: { type: 'object', dict: { reasoningEfforts: { type: 'boolean' }, input: { type: 'array', inner: { type: 'string' } } } },
    }))
    expect(extractCapabilityVocabulary(without).levels).toEqual([])
    expect(extractCapabilityVocabulary(without).modalities).toEqual([])
  })
})

describe('field validation', () => {
  test.each([
    ['absent', undefined, true],
    ['false', false, true],
    ['one level', { max: 'max' }, true],
    ['off plus level', { off: null, max: 'max' }, true],
    ['only off', { off: null }, false],
    ['empty dict', {}, false],
    ['non-off null wire', { max: null }, false],
    ['empty wire', { max: '' }, false],
    ['empty level name', { '': 'x' }, false],
    ['non-object', [], false],
    ['a string', 'max', false],
    ['null value', null, false],
  ])('reasoning: %s', (_label, value, expected) => {
    expect(validReasoningEfforts(value)).toBe(expected)
  })

  test.each([
    ['absent', undefined, ['text'], true],
    ['empty inherits', [], ['text'], true],
    ['modalities', ['text', 'image'], ['text', 'image'], true],
    ['absent vocabulary', ['text'], undefined, true],
    ['not an array', 'text', ['text'], false],
    ['unknown modality', ['video'], ['text'], false],
    ['non-string entry', [1], ['text'], false],
    ['empty string entry', [''], ['text'], false],
  ])('input: %s', (_label, value, choices, expected) => {
    expect(validInputModalities(value, choices)).toBe(expected)
  })
})

describe('profile reads', () => {
  const arrange = defaultArrangement()
  const ns = piAiNamespace(arrange)

  test('profileModels reads the effective layer by default and an explicit user layer on request', () => {
    expect(profileModels(ns, ['providers', 'ksyun'])).toEqual([{ id: 'Kimi-K3', name: 'Kimi' }])
    expect(profileModels(ns, ['providers', 'ksyun'], 'user')).toEqual([{ id: 'Kimi-K3', name: 'Kimi' }])
  })

  test('profileModels reads each layer independently', () => {
    const noUser = piAiNamespace({ ...arrange, user: undefined })
    expect(profileModels(noUser, ['providers', 'ksyun'])).toEqual([{ id: 'Kimi-K3', name: 'Kimi' }])
    expect(profileModels(noUser, ['providers', 'ksyun'], 'user')).toEqual([])
    const base = piAiNamespace({
      ...arrange,
      user: { providers: { ksyun: { models: [{ id: 'user' }] } } },
      base: { providers: { ksyun: { models: [{ id: 'base' }] } } },
      value: { providers: { ksyun: { models: [{ id: 'effective' }] } } },
    })
    expect(profileModels(base, ['providers', 'ksyun'], 'base')).toEqual([{ id: 'base' }])
    expect(profileModels(base, ['providers', 'ksyun'], 'user')).toEqual([{ id: 'user' }])
  })

  test('profileModels tolerates missing shapes', () => {
    const empty = piAiNamespace({ ...arrange, user: { providers: { ksyun: 'weird' } }, value: {} })
    expect(profileModels(empty, ['providers', 'ksyun'])).toEqual([])
    const oddRows = piAiNamespace({
      ...arrange,
      value: { providers: { ksyun: { models: ['not-a-record', null] } } },
    })
    expect(profileModels(oddRows, ['providers', 'ksyun'])).toEqual([{}, {}])
  })

  test('a user profile without the merged value is not configured', async () => {
    const arrange = defaultArrangement()
    arrange.value = undefined
    const { api } = scriptedFace(arrange)
    const controller = new CapabilitiesController(api)
    await controller.load()
    expect(controller.store.getSnapshot().rows).toEqual([])
    expect(controller.store.getSnapshot().status).toBe('ready')
  })

  test('absent user and value layers read as an empty profile', () => {
    const noLayers = piAiNamespace({ ...arrange, user: undefined, value: undefined })
    expect(profileModels(noLayers, ['providers', 'ksyun'])).toEqual([])
  })

  test('messageOf unwraps errors and stringifies the rest', () => {
    expect(messageOf(new Error('x'))).toBe('x')
    expect(messageOf('plain')).toBe('plain')
  })
})

describe('controller join', () => {
  test('joins the directory and settings into rows', async () => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    const controller = new CapabilitiesController(api)
    await controller.load()
    const snapshot = controller.store.getSnapshot()
    expect(snapshot.status).toBe('ready')
    expect(snapshot.rows).toHaveLength(1)
    expect(snapshot.rows[0]?.entry.provider).toBe('ksyun')
    expect(snapshot.rows[0]?.models).toEqual([{ id: 'Kimi-K3', name: 'Kimi' }])
    expect(snapshot.levels).toHaveLength(7)
    expect(snapshot.modalities).toEqual(['text', 'image'])
    await controller.commit(() => [{ op: 'set', path: ['providers', 'x'], value: {} }])
  })

  test('missing namespace leaves rows joined from an empty profile', async () => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    api.settings.describe = (payload) => {
      assertEmptyPayload('settings.describe', payload)
      return Promise.resolve(envelopeOk({ writable: true, hasDocument: true, namespaces: [] }))
    }
    const controller = new CapabilitiesController(api)
    await controller.load()
    expect(controller.store.getSnapshot().rows).toEqual([])
    expect(controller.store.getSnapshot().levels).toEqual([])
  })

  test('a rejected join surfaces its message', async () => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    api.llm.providers = (payload) => {
      assertEmptyPayload('llm.providers', payload)
      return Promise.reject(new Error('boom'))
    }
    const controller = new CapabilitiesController(api)
    await controller.load()
    const snapshot = controller.store.getSnapshot()
    expect(snapshot.status).toBe('error')
    expect(snapshot.error).toBe('boom')
  })

  test('mutate refuses without a namespace', async () => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    const controller = new CapabilitiesController(api)
    await expect(controller.commit(() => [])).rejects.toThrow('namespace unavailable')
  })

  test('setting the identical snapshot publishes nothing', () => {
    const store = createSnapshotStore({ marker: 1 })
    let notified = 0
    store.subscribe(() => { notified += 1 })
    store.setSnapshot(store.getSnapshot())
    expect(notified).toBe(0)
    store.setSnapshot({ marker: 2 })
    expect(notified).toBe(1)
    expect(store.getSnapshot()).toEqual({ marker: 2 })
    const dispose = store.subscribe(() => { notified += 10 })
    dispose()
    store.setSnapshot({ marker: 3 })
    expect(notified).toBe(2)
  })

  test.each([
    ['settings.describe', 'settings down'],
    ['llm.providers', 'directory down'],
  ] as const)('business failure in %s surfaces as a load error', async (method, message) => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    const failing = (payload: unknown) => {
      assertEmptyPayload(method, payload)
      return Promise.resolve(envelopeError('internal', message))
    }
    if (method === 'settings.describe') api.settings.describe = failing
    else api.llm.providers = failing
    const controller = new CapabilitiesController(api)
    await controller.load()
    expect(controller.store.getSnapshot().status).toBe('error')
    expect(controller.store.getSnapshot().error).toBe(message)
  })

  test('business failures keep the wire error code', async () => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    api.settings.mutate = () => Promise.resolve(envelopeError('settings-conflict', 'moved on'))
    const controller = new CapabilitiesController(api)
    await controller.load()
    await expect(controller.commit(() => [{ op: 'set', path: ['providers', 'x'], value: {} }])).rejects.toMatchObject({ code: 'settings-conflict', name: 'HarnessRpcError' })
  })

  test('business failures on mutate throw the error message', async () => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    const controller = new CapabilitiesController(api)
    await controller.load()
    api.settings.mutate = () => Promise.resolve(envelopeError('settings-conflict', 'revision moved'))
    await expect(controller.commit(() => [{ op: 'set', path: ['providers', 'x'], value: {} }])).rejects.toThrow('revision moved')
  })

  test('a mutation fences an in-flight refresh before advancing the CAS baseline', async () => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    const controller = new CapabilitiesController(api)
    await controller.load()

    const originalDescribe = api.settings.describe
    let release!: (value: Awaited<ReturnType<typeof originalDescribe>>) => void
    const slow = new Promise<Awaited<ReturnType<typeof originalDescribe>>>(resolve => { release = resolve })
    let describeCalls = 0
    api.settings.describe = payload => {
      describeCalls += 1
      assertEmptyPayload('settings.describe', payload)
      return describeCalls === 1 ? slow : originalDescribe(payload)
    }
    const staleNamespace = piAiNamespace(arrange)
    const refresh = controller.reload()
    await Promise.resolve()

    await controller.commit(() => [{
      op: 'set',
      path: ['providers', 'ksyun', 'models'],
      value: [{ id: 'Kimi-K3', reasoningEfforts: false }],
    }])
    expect(controller.store.getSnapshot().namespace?.revision).toBe(2)

    // The old read resolves after the write, but its generation is fenced and
    // must not put revision 1 back into the local CAS baseline.
    release(envelopeOk({ writable: true, hasDocument: true, namespaces: [staleNamespace] }))
    await refresh
    expect(controller.store.getSnapshot().namespace?.revision).toBe(2)
  })

  test('a newer load aborts the previous read and only its response publishes', async () => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    const originalDescribe = api.settings.describe
    let describeCalls = 0
    let firstSignal: AbortSignal | undefined
    let releaseFirst!: (value: Awaited<ReturnType<typeof originalDescribe>>) => void
    const first = new Promise<Awaited<ReturnType<typeof originalDescribe>>>(resolve => { releaseFirst = resolve })
    api.settings.describe = (payload, signal) => {
      assertEmptyPayload('settings.describe', payload)
      describeCalls += 1
      if (describeCalls === 1) {
        firstSignal = signal
        return first
      }
      return originalDescribe(payload, signal)
    }

    const controller = new CapabilitiesController(api)
    const stale = controller.load()
    await Promise.resolve()
    const fresh = controller.load()
    await fresh
    expect(describeCalls).toBe(2)
    expect(firstSignal?.aborted).toBe(true)
    expect(controller.store.getSnapshot().rows).toHaveLength(1)
    releaseFirst(envelopeOk({ writable: true, hasDocument: true, namespaces: [] }))
    await stale
    expect(controller.store.getSnapshot().rows).toHaveLength(1)
    expect(controller.store.getSnapshot().rows[0]?.entry.provider).toBe('ksyun')
  })

  test('a stale load failure does not replace a fresher snapshot either', async () => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    const fast = api.settings.describe.bind(api.settings)
    const controller = new CapabilitiesController(api)
    api.settings.describe = () => Promise.resolve(envelopeError('internal', 'stale boom'))
    const stale = controller.load()
    api.settings.describe = fast
    const fresh = controller.load()
    await Promise.all([stale, fresh])
    expect(controller.store.getSnapshot().status).toBe('ready')
    expect(controller.store.getSnapshot().rows).toHaveLength(1)
  })

  test('a failed refresh still advances the CAS baseline after a commit', async () => {
    const arrange = defaultArrangement()
    const { api, mutates } = scriptedFace(arrange)
    const controller = new CapabilitiesController(api)
    await controller.load()
    // Commit once: the server view lands with revision 2 and must become the
    // new baseline immediately.
    await controller.commit(() => [{ op: 'set', path: ['providers', 'ksyun'], value: {} }])
    expect(mutates[0]?.expectedRevision).toBe(1)
    // Now the background refresh fails: the revision must still have advanced.
    api.settings.describe = payload => {
      assertEmptyPayload('settings.describe', payload)
      return Promise.resolve(envelopeError('internal', 'transient'))
    }
    await controller.reload()
    expect(controller.store.getSnapshot().namespace?.revision).toBe(2)
    // The next write CASes against the committed revision, not the pre-write one.
    await controller.commit(() => [{ op: 'set', path: ['providers', 'ksyun'], value: {} }])
    expect(mutates[1]?.expectedRevision).toBe(2)
  })

  test('a refreshed failure keeps the last accepted snapshot', async () => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    const controller = new CapabilitiesController(api)
    await controller.load()
    expect(controller.store.getSnapshot().status).toBe('ready')
    api.settings.describe = () => Promise.resolve(envelopeError('internal', 'transient'))
    await controller.reload()
    const snapshot = controller.store.getSnapshot()
    expect(snapshot.status).toBe('ready')
    expect(snapshot.rows).toHaveLength(1)
  })

  test('a base-declared provider keeps models while user edits another provider', async () => {
    const arrange = defaultArrangement()
    // base declares ksyun WITH models; user only customizes unrelated openai.
    arrange.value = { providers: { ksyun: { models: [{ id: 'Kimi-K3', name: 'Kimi' }] }, openai: { baseURL: 'https://x' } } }
    arrange.base = { providers: { ksyun: { models: [{ id: 'Kimi-K3', name: 'Kimi' }] } } }
    arrange.user = { providers: { openai: { baseURL: 'https://x' } } }
    const { api } = scriptedFace(arrange)
    const controller = new CapabilitiesController(api)
    await controller.load()
    const ksyun = controller.store.getSnapshot().rows.find(row => row.entry.provider === 'ksyun')
    // The card exists (configured via effective value) AND declares its models.
    expect(ksyun?.configured).toBe(true)
    expect(ksyun?.models).toHaveLength(1)
  })

  test('a declared route inherited from base is visible but read-only', async () => {
    const arrange = defaultArrangement()
    arrange.base = { providers: { ksyun: { models: [{ id: 'base-model' }] } } }
    arrange.user = undefined
    arrange.value = arrange.base
    const { api } = scriptedFace(arrange)
    const controller = new CapabilitiesController(api)
    await controller.load()
    const row = controller.store.getSnapshot().rows[0]
    expect(row?.configured).toBe(true)
    expect(row?.models).toEqual([{ id: 'base-model' }])
    expect(row?.declaredEditable).toBe(false)
  })

  test('dispose aborts reads, drops late responses, and rejects later writes', async () => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    const originalDescribe = api.settings.describe
    let signal: AbortSignal | undefined
    let release!: (value: Awaited<ReturnType<typeof originalDescribe>>) => void
    const slow = new Promise<Awaited<ReturnType<typeof originalDescribe>>>(resolve => { release = resolve })
    api.settings.describe = (payload, nextSignal) => {
      assertEmptyPayload('settings.describe', payload)
      signal = nextSignal
      return slow
    }

    const controller = new CapabilitiesController(api)
    const pending = controller.load()
    await Promise.resolve()
    controller.dispose()
    expect(signal?.aborted).toBe(true)
    release(envelopeOk({ writable: true, hasDocument: true, namespaces: [piAiNamespace(arrange)] }))
    await pending
    expect(controller.store.getSnapshot().status).toBe('loading')
    expect(controller.store.getSnapshot().rows).toEqual([])
    await expect(controller.commit(() => [])).rejects.toThrow('controller disposed')
    await expect(controller.load()).resolves.toBeUndefined()
  })

  test('a reload after its first load refreshes', async () => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    const controller = new CapabilitiesController(api)
    await controller.load()
    arrange.providers = []
    await controller.reload()
    expect(controller.store.getSnapshot().rows).toEqual([])
  })

  test('commit returns false for empty ops without writing or reloading', async () => {
    const arrange = defaultArrangement()
    const { api, mutates } = scriptedFace(arrange)
    const controller = new CapabilitiesController(api)
    await controller.load()

    let describes = 0
    const before = api.settings.describe
    api.settings.describe = payload => {
      describes += 1
      return before(payload)
    }
    await expect(controller.commit(() => [])).resolves.toBe(false)
    expect(mutates).toEqual([])
    expect(describes).toBe(0)
  })

  test('commit writes, updates the baseline, and reloads', async () => {
    const arrange = defaultArrangement()
    const { api, mutates } = scriptedFace(arrange)
    const controller = new CapabilitiesController(api)
    await controller.load()

    let describes = 0
    const before = api.settings.describe
    api.settings.describe = payload => {
      describes += 1
      return before(payload)
    }
    await expect(controller.commit(() => [{
      op: 'set',
      path: ['providers', 'x'],
      value: { committed: true },
    }])).resolves.toBe(true)
    expect(mutates).toHaveLength(1)
    expect(mutates[0]?.expectedRevision).toBe(1)
    expect(describes).toBe(1)
  })

  test('concurrent commits serialize success: the second builder sees the first accepted namespace', async () => {
    const arrange = defaultArrangement()
    const { api, mutates } = scriptedFace(arrange)
    const controller = new CapabilitiesController(api)
    await controller.load()

    const seen: number[] = []
    const first = controller.commit(() => {
      seen.push(controller.store.getSnapshot().namespace?.revision ?? 0)
      return [{ op: 'set', path: ['providers', 'first'], value: {} }]
    })
    const second = controller.commit(() => {
      seen.push(controller.store.getSnapshot().namespace?.revision ?? 0)
      return [{ op: 'set', path: ['providers', 'second'], value: {} }]
    })
    await Promise.all([first, second])

    expect(seen).toEqual([1, 2])
    expect(mutates).toHaveLength(2)
    expect(mutates[0]?.expectedRevision).toBe(1)
    expect(mutates[1]?.expectedRevision).toBe(2)
  })

  test('concurrent commits serialize recovery: the second builder sees the post-reload namespace', async () => {
    const arrange = defaultArrangement()
    const { api, mutates } = scriptedFace(arrange)
    const controller = new CapabilitiesController(api)
    await controller.load()

    // Simulate an external revision advancing between the request load and A.
    arrange.revision = 2
    const seen: number[] = []
    const first = controller.commit(() => {
      seen.push(controller.store.getSnapshot().namespace?.revision ?? 0)
      return [{ op: 'set', path: ['providers', 'first'], value: {} }]
    })
    const second = controller.commit(() => {
      seen.push(controller.store.getSnapshot().namespace?.revision ?? 0)
      return [{ op: 'set', path: ['providers', 'second'], value: {} }]
    })

    await expect(first).rejects.toMatchObject({ code: 'settings-conflict', name: 'HarnessRpcError' })
    await expect(second).resolves.toBe(true)

    expect(seen).toEqual([1, 2])
    expect(mutates).toHaveLength(2)
    expect(mutates[0]?.expectedRevision).toBe(1)
    expect(mutates[1]?.expectedRevision).toBe(2)
  })
})
