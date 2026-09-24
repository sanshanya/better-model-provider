/**
 * Wire-adapter coverage: pins `resolveRemoteApiGently` — the ONLY resolver,
 * and the one the page mount path runs — against the `remote.settings` /
 * `remote.llm` Cordis services: the generated call shapes `wire.ts` adapts
 * onto the page's carrier frame, the exact failure-envelope semantics `unwrap`
 * in store.ts depends on, and the event-driven retry that carries the page
 * across the harness's sequential namespace mounts without ever throwing.
 *
 * The ≤0.1.1 namespaced `api` generation is not covered here because it no
 * longer exists: the probe has no branch for it.
 */

import { afterEach, describe, expect, test, vi } from 'vitest'
import { resolveRemoteApiGently } from '../src/client/wire.ts'
import { unwrap } from '../src/client/store.ts'
import { HarnessRpcError } from '../src/client/types.ts'
import type { ClientShim, IRemoteApi, Unsubscribe } from '../src/client/types.ts'
import {
  CATALOG_MODELS, defaultArrangement, envelopeError, piAiNamespace, providerEntry,
} from './helpers.ts'

/** One recorded upstream call on a scripted service. */
interface RecordedCall {
  method: string
  args: unknown[]
}

/** Scripted `remote.<ns>` services recording every call. */
function remoteServices(handlers: {
  describe?: () => Promise<unknown>
  mutate?: () => Promise<unknown>
  listConfigurableProviders?: () => Promise<unknown>
  discoverModels?: () => Promise<unknown>
}): { services: Record<string, unknown>; calls: RecordedCall[] } {
  const calls: RecordedCall[] = []
  const record = (method: string, handler: (() => Promise<unknown>) | undefined): ((...args: unknown[]) => Promise<unknown>) =>
    (...args: unknown[]) => {
      calls.push({ method, args })
      if (handler === undefined) throw new Error(`remoteServices: no handler arranged for ${method}`)
      return handler()
    }
  const services: Record<string, unknown> = {
    'remote.settings': {
      describe: record('settings.describe', handlers.describe),
      mutate: record('settings.mutate', handlers.mutate),
    },
    'remote.llm': {
      listConfigurableProviders: record('llm.listConfigurableProviders', handlers.listConfigurableProviders),
      discoverModels: record('llm.discoverModels', handlers.discoverModels),
    },
  }
  return { services, calls }
}

/** One recorded resolver effect registration. */
interface RecordedEffect {
  fn: () => unknown
  name: string | undefined
}

/**
 * A ClientShim stub for the resolver: the `get` probe seam, a scripted `on`
 * emitter (the retry rides Cordis's real service-arrival event), and a recorded
 * `effect` seam the tests drive manually. The cast acknowledges the mock
 * implements a slice of the face, mirroring how the guarded dynamic facade
 * presents its own slice.
 */
function gentleCtx(services: Record<string, unknown>): {
  ctx: ClientShim
  /** Fire one event at every subscribed listener (args travel like Cordis's). */
  emit(event: string, ...args: readonly unknown[]): void
  effects: RecordedEffect[]
  /** Live listener count, keyed by event — the retry's heartbeat. */
  listenerCount(event: string): number
} {
  const listeners = new Map<string, ((...args: readonly unknown[]) => void)[]>()
  const effects: RecordedEffect[] = []
  const ctx = {
    get: (name: string) => services[name],
    on: (event: string, handler: (...args: readonly unknown[]) => void): Unsubscribe => {
      const bucket = listeners.get(event) ?? []
      bucket.push(handler)
      listeners.set(event, bucket)
      return () => {
        const live = listeners.get(event) ?? []
        const at = live.indexOf(handler)
        if (at !== -1) live.splice(at, 1)
      }
    },
    effect: (fn: () => unknown, name?: string) => { effects.push({ fn, name }) },
  } as unknown as ClientShim
  return {
    ctx,
    emit: (event, ...args) => {
      // .slice() snapshots the bucket: a handler that disposes itself
      // mid-emit (the on-success unsubscribe) splices the live array.
      for (const handler of (listeners.get(event) ?? []).slice()) handler(...args)
    },
    effects,
    listenerCount: event => (listeners.get(event) ?? []).length,
  }
}

/**
 * Drive the resolver against a fully-present assembly and return the mounted
 * face. Every immediate/identity/adaptation pin rides the page path itself:
 * the scripted on/effect doubles above complete on the first attempt, so
 * resolution is synchronous and installs no retry machinery.
 */
function resolveGently(services: Record<string, unknown>): IRemoteApi {
  const mounted: IRemoteApi[] = []
  resolveRemoteApiGently(gentleCtx(services).ctx, face => mounted.push(face))
  const resolved = mounted[0]
  if (resolved === undefined) throw new Error('expected the face to resolve immediately')
  return resolved
}

describe('resolveRemoteApiGently — the service generation', () => {
  test('describe drops its validated-empty payload and re-frames the slim envelope', async () => {
    const arrange = defaultArrangement()
    const value = { writable: true, hasDocument: true, namespaces: [piAiNamespace(arrange)] }
    const { services, calls } = remoteServices({ describe: () => Promise.resolve({ ok: true, value }) })
    const resolved = resolveGently(services)

    const response = await resolved.settings.describe({}, new AbortController().signal)
    // The service method is parameterless: neither the {} payload nor the
    // page's carrier signal may cross.
    expect(calls).toEqual([{ method: 'settings.describe', args: [] }])
    expect(response.result).toEqual({ ok: true, value })
    // The adapter stamps the constant rpcId echo the service envelope does not carry.
    expect(String(response.rpcId)).toBe('bmp-carrier')
  })

  test('mutate becomes positional and keeps the namespace view value', async () => {
    const arrange = defaultArrangement()
    const namespace = piAiNamespace(arrange)
    const { services, calls } = remoteServices({ mutate: () => Promise.resolve({ ok: true, value: namespace }) })
    const resolved = resolveGently(services)

    const ops = [{ op: 'set' as const, path: ['providers', 'openai', 'models'], value: [] }]
    const response = await resolved.settings.mutate({ ns: 'llm-pi-ai', ops, expectedRevision: 3 })
    expect(calls).toEqual([{ method: 'settings.mutate', args: ['llm-pi-ai', ops, 3] }])
    expect(response.result).toEqual({ ok: true, value: namespace })
  })

  test('providers maps listConfigurableProviders back to the {providers} carrier', async () => {
    const providers = [{ ...providerEntry('openai', false), displayName: 'OpenAI' }]
    const { services, calls } = remoteServices({
      listConfigurableProviders: () => Promise.resolve({ ok: true, value: providers }),
    })
    const resolved = resolveGently(services)

    const response = await resolved.llm.providers({}, new AbortController().signal)
    expect(calls).toEqual([{ method: 'llm.listConfigurableProviders', args: [] }])
    // The service answers the BARE array; the page reads the boxed carrier.
    expect(response.result).toEqual({ ok: true, value: { providers } })
  })

  test('discoverModels lifts settingsNs positionally, forwards the signal, re-boxes {models}', async () => {
    const { services, calls } = remoteServices({
      discoverModels: () => Promise.resolve({ ok: true, value: [...CATALOG_MODELS] }),
    })
    const resolved = resolveGently(services)

    const { signal } = new AbortController()
    const response = await resolved.llm.discoverModels({ settingsNs: 'llm-pi-ai', provider: 'openai' }, signal)
    expect(calls).toHaveLength(1)
    const call = calls[0]
    expect(call?.method).toBe('llm.discoverModels')
    expect(call?.args).toEqual(['llm-pi-ai', { provider: 'openai' }, signal])
    // The request positional must not retain the namespace it was lifted from.
    expect(call?.args[1]).not.toHaveProperty('settingsNs')
    expect(response.result).toEqual({ ok: true, value: { models: CATALOG_MODELS } })
  })

  test('a settings/conflict failure crosses the carrier frame untranslated so unwrap throws HarnessRpcError', async () => {
    const message = 'expected revision 1, actual 2'
    const failure = { code: 'settings/conflict', message, details: { ns: 'llm-pi-ai', expected: 1, actual: 2 } }
    const { services } = remoteServices({ mutate: () => Promise.resolve({ ok: false, error: failure }) })
    const resolved = resolveGently(services)

    const response = await resolved.settings.mutate({
      ns: 'llm-pi-ai',
      ops: [{ op: 'set', path: ['providers', 'ksyun', 'models'], value: [] }],
      expectedRevision: 1,
    })
    // EXACTLY the code the host produced — no fold — with the CAS details
    // triple crossing untouched, which is the arm `envelopeError` builds.
    const carrier = envelopeError('settings/conflict', message)
    expect(response.result).toEqual(carrier.result)
    if (response.result.ok) throw new Error('expected the failure branch')
    expect(response.result.error.code).toBe('settings/conflict')
    expect(response.result.error.details).toEqual({ ns: 'llm-pi-ai', expected: 1, actual: 2 })

    // ...which is what makes the store's CAS recovery fire: unwrap throws
    // the typed wire error, not a generic one.
    let caught: unknown
    try {
      unwrap(response)
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(HarnessRpcError)
    expect(caught).toMatchObject({ name: 'HarnessRpcError', code: 'settings/conflict', message })
  })

  test('a RemoteError-shaped failure crosses fieldwise, message included', async () => {
    // A real RemoteError INSTANCE: `message` is Error-inherited and therefore
    // non-enumerable, so a spread would drop it — the carrier must be built
    // fieldwise, and the slash code must arrive as it was sent.
    class FakeRemoteError extends Error {
      readonly code = 'settings/conflict'
      readonly details = { ns: 'llm-pi-ai', expected: 1, actual: 2 }
    }
    const fake = new FakeRemoteError('expected revision 1, actual 2')
    expect(Object.keys(fake)).not.toContain('message')
    const { services } = remoteServices({ mutate: () => Promise.resolve({ ok: false, error: fake }) })
    const resolved = resolveGently(services)

    const response = await resolved.settings.mutate({
      ns: 'llm-pi-ai',
      ops: [{ op: 'set', path: ['providers', 'ksyun', 'models'], value: [] }],
      expectedRevision: 1,
    })
    if (response.result.ok) throw new Error('expected the failure branch')
    expect(response.result.error).toEqual({
      code: 'settings/conflict',
      message: 'expected revision 1, actual 2',
      details: { ns: 'llm-pi-ai', expected: 1, actual: 2 },
    })
  })

  test('a non-conflict failure rides the value-mapping arm untouched', async () => {
    // Upstream folds transport failures into the same error branch
    // (transportError's 'internal' catch-all) — the boxing helpers must not
    // mistake such a failure for a mappable success.
    const failure = { code: 'internal', message: 'connection reset by peer', details: {} }
    const { services } = remoteServices({
      listConfigurableProviders: () => Promise.resolve({ ok: false, error: failure }),
    })
    const resolved = resolveGently(services)

    const response = await resolved.llm.providers({})
    const carrier = envelopeError('internal', 'connection reset by peer')
    expect(response.result).toEqual(carrier.result)
    expect(() => unwrap(response)).toThrowError(HarnessRpcError)
  })
})

describe('resolveRemoteApiGently — the page path', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('a complete pair mounts immediately and never subscribes', async () => {
    const { services, calls } = remoteServices({
      describe: () => Promise.resolve({ ok: true, value: { writable: true, hasDocument: true, namespaces: [] } }),
    })
    const harness = gentleCtx(services)
    const mounted: IRemoteApi[] = []
    resolveRemoteApiGently(harness.ctx, api => mounted.push(api))
    expect(mounted).toHaveLength(1)
    // No retry machinery at all: no subscription, no effect.
    expect(harness.listenerCount('internal/service')).toBe(0)
    expect(harness.effects).toHaveLength(0)
    // The mounted face is the ADAPTED one, not a raw service object.
    await mounted[0]?.settings.describe({})
    expect(calls).toEqual([{ method: 'settings.describe', args: [] }])
  })

  test('the partial window defers, warns once, and mounts on the completing arrival', () => {
    const arrange = defaultArrangement()
    const value = { writable: true, hasDocument: true, namespaces: [piAiNamespace(arrange)] }
    const { services } = remoteServices({ describe: () => Promise.resolve({ ok: true, value }) })
    // The boot-time race verbatim: settings mounted, llm still in flight.
    delete services['remote.llm']
    const harness = gentleCtx(services)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mounted: IRemoteApi[] = []

    expect(() => resolveRemoteApiGently(harness.ctx, api => mounted.push(api))).not.toThrow()
    expect(mounted).toHaveLength(0)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toMatch(/remote\.llm/)
    expect(harness.listenerCount('internal/service')).toBe(1)
    expect(harness.effects.map(effect => effect.name)).toEqual(['better-model-provider: remote face await'])

    // An unrelated arrival (settings' own announcement) re-probes and holds.
    harness.emit('internal/service', 'remote.settings', services['remote.settings'])
    expect(mounted).toHaveLength(0)
    expect(warn).toHaveBeenCalledTimes(1)

    // The completing arrival mounts exactly once and unsubscribes.
    const { services: llmOnly } = remoteServices({})
    services['remote.llm'] = llmOnly['remote.llm']
    harness.emit('internal/service', 'remote.llm', services['remote.llm'])
    expect(mounted).toHaveLength(1)
    expect(harness.listenerCount('internal/service')).toBe(0)

    // No late re-mount on later service churn.
    harness.emit('internal/service', 'remote.other', {})
    expect(mounted).toHaveLength(1)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  test('an absent boot waits idle with ONE warning and mounts on completion', () => {
    const { services } = remoteServices({
      describe: () => Promise.resolve({ ok: true, value: { writable: true, hasDocument: true, namespaces: [] } }),
    })
    delete services['remote.settings']
    delete services['remote.llm']
    const harness = gentleCtx(services)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mounted: IRemoteApi[] = []

    expect(() => resolveRemoteApiGently(harness.ctx, api => mounted.push(api))).not.toThrow()
    expect(mounted).toHaveLength(0)
    // The mandated idle-diagnostic: exactly one warn, naming the missing pair
    // and the self-healing follow-up, fired at the first not-ready
    // observation — never stacked by later arrivals.
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toMatch(/no harness Remote face is available yet/)
    expect(warn.mock.calls[0]?.[0]).toMatch(/remote\.settings\/remote\.llm/)
    expect(harness.listenerCount('internal/service')).toBe(1)

    // settings arriving alone upgrades nothing (and stays silent about it).
    services['remote.settings'] = remoteServices({}).services['remote.settings']
    harness.emit('internal/service', 'remote.settings', services['remote.settings'])
    expect(warn).toHaveBeenCalledTimes(1)
    expect(mounted).toHaveLength(0)

    services['remote.llm'] = remoteServices({}).services['remote.llm']
    harness.emit('internal/service', 'remote.llm', services['remote.llm'])
    expect(mounted).toHaveLength(1)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  test('remote.llm answering first warns about remote.settings — never lies "neither"', () => {
    // The reversed mount order: llm present while settings is still in
    // flight is PARTIAL awaiting remote.settings, not "absent".
    const { services } = remoteServices({})
    delete services['remote.settings']
    const harness = gentleCtx(services)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mounted: IRemoteApi[] = []

    resolveRemoteApiGently(harness.ctx, api => mounted.push(api))
    expect(mounted).toHaveLength(0)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toMatch(/remote\.llm answered but remote\.settings has not/)
    expect(harness.listenerCount('internal/service')).toBe(1)

    services['remote.settings'] = remoteServices({}).services['remote.settings']
    harness.emit('internal/service', 'remote.settings', services['remote.settings'])
    expect(mounted).toHaveLength(1)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(harness.listenerCount('internal/service')).toBe(0)
  })

  test('a reentrant arrival emitted mid-mount cannot double-mount', () => {
    // mount's own contributions run synchronously inside one dispatch; if
    // any of them emits another service arrival, exactly-once must be
    // structural (the done latch), not a race against the unsubscribe.
    const { services } = remoteServices({
      describe: () => Promise.resolve({ ok: true, value: { writable: true, hasDocument: true, namespaces: [] } }),
    })
    delete services['remote.llm']
    const harness = gentleCtx(services)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mounted: IRemoteApi[] = []
    resolveRemoteApiGently(harness.ctx, api => {
      mounted.push(api)
      harness.emit('internal/service', 'remote.other', {})
    })

    services['remote.llm'] = remoteServices({}).services['remote.llm']
    harness.emit('internal/service', 'remote.llm', services['remote.llm'])
    expect(mounted).toHaveLength(1)
    expect(harness.listenerCount('internal/service')).toBe(0)
  })

  test('disposing the fiber before completion stops the retry', () => {
    const { services } = remoteServices({
      describe: () => Promise.resolve({ ok: true, value: { writable: true, hasDocument: true, namespaces: [] } }),
    })
    delete services['remote.llm']
    const harness = gentleCtx(services)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mounted: IRemoteApi[] = []
    resolveRemoteApiGently(harness.ctx, api => mounted.push(api))
    expect(harness.listenerCount('internal/service')).toBe(1)

    // The fiber's composite disposal drives the recorded effect's disposer.
    const disposer = harness.effects[0]?.fn() as (() => void) | undefined
    disposer?.()
    expect(harness.listenerCount('internal/service')).toBe(0)

    services['remote.llm'] = remoteServices({}).services['remote.llm']
    harness.emit('internal/service', 'remote.llm', services['remote.llm'])
    expect(mounted).toHaveLength(0)
  })

  test('a mount throw at the immediate attempt is logged once and never escapes apply', () => {
    // Cordis emits `internal/service` with NO try/catch, and the first
    // attempt runs synchronously inside apply(): an escaping mount throw
    // would fail the whole loader entry.
    const { services } = remoteServices({})
    const harness = gentleCtx(services)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    let mountCalls = 0
    expect(() =>
      resolveRemoteApiGently(harness.ctx, () => {
        mountCalls += 1
        throw new Error('mount boom')
      }),
    ).not.toThrow()
    expect(mountCalls).toBe(1)
    expect(error).toHaveBeenCalledTimes(1)
    // Resolved-at-first-attempt still means: no retry machinery exists.
    expect(harness.listenerCount('internal/service')).toBe(0)
    expect(harness.effects).toHaveLength(0)
  })

  test('a mount throw on arrival starves no later listener, still unsubscribes, never retries', () => {
    // Cordis dispatches to every listener in order with NO try/catch: the
    // contained throw must leave the dispatch — and the self-unsubscribe —
    // intact.
    const { services } = remoteServices({})
    delete services['remote.llm']
    const harness = gentleCtx(services)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    let mountCalls = 0
    resolveRemoteApiGently(harness.ctx, () => {
      mountCalls += 1
      throw new Error('mount boom')
    })
    const later = vi.fn()
    harness.ctx.on('internal/service', later)

    services['remote.llm'] = remoteServices({}).services['remote.llm']
    harness.emit('internal/service', 'remote.llm', services['remote.llm'])
    expect(mountCalls).toBe(1)
    expect(error).toHaveBeenCalledTimes(1)
    expect(later).toHaveBeenCalledTimes(1)
    // The attempt reported done, so the resolver's own listener is gone;
    // only the unrelated second listener remains.
    expect(harness.listenerCount('internal/service')).toBe(1)

    // The done latch holds: later churn retries nothing and logs nothing.
    harness.emit('internal/service', 'remote.other', {})
    expect(mountCalls).toBe(1)
    expect(error).toHaveBeenCalledTimes(1)
    expect(later).toHaveBeenCalledTimes(2)
  })
})