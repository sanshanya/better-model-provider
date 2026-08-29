/**
 * Wire-adapter coverage: pins `resolveRemoteApiGently` — the ONLY resolver,
 * and the one the page mount path runs — against BOTH harness generations:
 * the ≤0.1.1 legacy `connection.api` face (passed through untouched) and
 * the 0.1.2-alpha.1 `remote.settings`/`remote.llm` Cordis services (call
 * shapes adapted back to the legacy face the page speaks). The alpha
 * projections live only in `src/client/wire.ts`, so this spec is their
 * contract of record: upstream argument lists, carrier re-boxing, the exact
 * failure-envelope semantics `unwrap` in store.ts depends on, and the
 * event-driven retry that carries the page across alpha's sequential
 * namespace mounts without ever throwing.
 */

import { afterEach, describe, expect, test, vi } from 'vitest'
import { resolveRemoteApiGently } from '../src/client/wire.ts'
import { unwrap } from '../src/client/store.ts'
import { HarnessRpcError } from '../src/client/types.ts'
import type { ClientShim, IRemoteApi, Unsubscribe } from '../src/client/types.ts'
import {
  CATALOG_MODELS, defaultArrangement, envelopeError, piAiNamespace, providerEntry, scriptedFace,
} from './helpers.ts'

/** One recorded upstream call on a scripted alpha service. */
interface RecordedCall {
  method: string
  args: unknown[]
}

/** Scripted alpha-generation `remote.<ns>` services recording every call. */
function alphaRemotes(handlers: {
  describe?: () => Promise<unknown>
  mutate?: () => Promise<unknown>
  listConfigurableProviders?: () => Promise<unknown>
  discoverModels?: () => Promise<unknown>
}): { services: Record<string, unknown>; calls: RecordedCall[] } {
  const calls: RecordedCall[] = []
  const record = (method: string, handler: (() => Promise<unknown>) | undefined): ((...args: unknown[]) => Promise<unknown>) =>
    (...args: unknown[]) => {
      calls.push({ method, args })
      if (handler === undefined) throw new Error(`alphaRemotes: no handler arranged for ${method}`)
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
 * A ClientShim stub for the resolver: the two probe seams (`get` and
 * `connection.api`), a scripted `on` emitter (the retry rides Cordis's
 * real service-arrival event), and a recorded `effect` seam the tests
 * drive manually. The cast acknowledges the mock implements a slice of
 * the face, mirroring how each generation's guard presents its own slice.
 */
function gentleCtx(services: Record<string, unknown>, api?: IRemoteApi): {
  ctx: ClientShim
  /** Fire one event at every subscribed listener (args travel like Cordis's). */
  emit(event: string, ...args: readonly unknown[]): void
  effects: RecordedEffect[]
  /** Live listener count, keyed by event — the retry's heartbeat. */
  listenerCount(event: string): number
} {
  const connection = api === undefined ? {} : { api }
  const listeners = new Map<string, ((...args: readonly unknown[]) => void)[]>()
  const effects: RecordedEffect[] = []
  const ctx = {
    get: (name: string) => services[name],
    connection,
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
 * Drive the resolver against a fully-present generation and return the
 * mounted face. Every immediate/identity/adaptation pin rides the page
 * path itself: the scripted on/effect doubles above complete on the first
 * attempt, so resolution is synchronous and installs no retry machinery.
 */
function resolveGently(services: Record<string, unknown>, api?: IRemoteApi): IRemoteApi {
  const mounted: IRemoteApi[] = []
  resolveRemoteApiGently(gentleCtx(services, api).ctx, face => mounted.push(face))
  const resolved = mounted[0]
  if (resolved === undefined) throw new Error('expected the face to resolve immediately')
  return resolved
}

describe('resolveRemoteApiGently — legacy generation (dsh ≤0.1.1)', () => {
  test('returns the connection.api face untouched when no alpha services answer', () => {
    const { api } = scriptedFace(defaultArrangement())
    const resolved = resolveGently({}, api)
    // Identity, not shape: the adapter must not re-wrap the legacy face —
    // its envelopes already carry the host-minted rpcId echo.
    expect(resolved).toBe(api)
  })
})

describe('resolveRemoteApiGently — alpha generation (dsh 0.1.2-alpha.1)', () => {
  test('describe drops its validated-empty payload and re-wraps the slim envelope', async () => {
    const arrange = defaultArrangement()
    const value = { writable: true, hasDocument: true, namespaces: [piAiNamespace(arrange)] }
    const { services, calls } = alphaRemotes({ describe: () => Promise.resolve({ ok: true, value }) })
    // A legacy face sitting beside the alpha services must be IGNORED: the
    // alpha branch wins once remote.settings answers.
    const { api: legacy } = scriptedFace(arrange)
    const resolved = resolveGently(services, legacy)
    expect(resolved).not.toBe(legacy)

    const response = await resolved.settings.describe({}, new AbortController().signal)
    // The alpha method is parameterless: neither the {} payload nor the
    // legacy carrier's signal may cross.
    expect(calls).toEqual([{ method: 'settings.describe', args: [] }])
    expect(response.result).toEqual({ ok: true, value })
    // The adapter stamps the constant rpcId echo the alpha envelope no longer carries.
    expect(String(response.rpcId)).toBe('bmp-alpha')
  })

  test('mutate becomes positional and keeps the namespace view value', async () => {
    const arrange = defaultArrangement()
    const namespace = piAiNamespace(arrange)
    const { services, calls } = alphaRemotes({ mutate: () => Promise.resolve({ ok: true, value: namespace }) })
    const resolved = resolveGently(services)

    const ops = [{ op: 'set' as const, path: ['providers', 'openai', 'models'], value: [] }]
    const response = await resolved.settings.mutate({ ns: 'llm-pi-ai', ops, expectedRevision: 3 })
    expect(calls).toEqual([{ method: 'settings.mutate', args: ['llm-pi-ai', ops, 3] }])
    expect(response.result).toEqual({ ok: true, value: namespace })
  })

  test('providers maps listConfigurableProviders back to the {providers} carrier', async () => {
    const providers = [{ ...providerEntry('openai', false), displayName: 'OpenAI' }]
    const { services, calls } = alphaRemotes({
      listConfigurableProviders: () => Promise.resolve({ ok: true, value: providers }),
    })
    const resolved = resolveGently(services)

    const response = await resolved.llm.providers({}, new AbortController().signal)
    expect(calls).toEqual([{ method: 'llm.listConfigurableProviders', args: [] }])
    // The alpha answers the BARE array; the page reads the boxed carrier.
    expect(response.result).toEqual({ ok: true, value: { providers } })
  })

  test('discoverModels lifts settingsNs positionally, forwards the signal, re-boxes {models}', async () => {
    const { services, calls } = alphaRemotes({
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

  test('a settings-conflict failure surfaces through the legacy envelope so unwrap throws HarnessRpcError', async () => {
    const message = 'expected revision 1, actual 2'
    const failure = { code: 'settings-conflict', message, details: { ns: 'llm-pi-ai', expected: 1, actual: 2 } }
    const { services } = alphaRemotes({ mutate: () => Promise.resolve({ ok: false, error: failure }) })
    const resolved = resolveGently(services)

    const response = await resolved.settings.mutate({
      ns: 'llm-pi-ai',
      ops: [{ op: 'set', path: ['providers', 'ksyun', 'models'], value: [] }],
      expectedRevision: 1,
    })
    // EXACTLY the legacy failure arm — code, message, and the CAS details
    // triple travel untouched, as if connection.api had answered.
    const legacy = envelopeError('settings-conflict', message)
    expect(response.result).toEqual(legacy.result)
    if (response.result.ok) throw new Error('expected the failure branch')
    expect(response.result.error.code).toBe('settings-conflict')
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
    expect(caught).toMatchObject({ name: 'HarnessRpcError', code: 'settings-conflict', message })
  })

  test('a carrier-folded failure rides the value-mapping arm untouched', async () => {
    // Upstream folds carrier failures into the same error branch
    // (transportError's 'internal' catch-all) — the boxing helpers must not
    // mistake such a failure for a mappable success.
    const failure = { code: 'internal', message: 'connection reset by peer', details: {} }
    const { services } = alphaRemotes({
      listConfigurableProviders: () => Promise.resolve({ ok: false, error: failure }),
    })
    const resolved = resolveGently(services)

    const response = await resolved.llm.providers({})
    const legacy = envelopeError('internal', 'connection reset by peer')
    expect(response.result).toEqual(legacy.result)
    expect(() => unwrap(response)).toThrowError(HarnessRpcError)
  })
})

describe('resolveRemoteApiGently — the page path', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('a complete alpha pair mounts immediately and never subscribes', async () => {
    const { services, calls } = alphaRemotes({
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

  test('the legacy generation mounts immediately without subscribing', () => {
    const { api } = scriptedFace(defaultArrangement())
    const harness = gentleCtx({}, api)
    const mounted: IRemoteApi[] = []
    resolveRemoteApiGently(harness.ctx, face => mounted.push(face))
    expect(mounted).toEqual([api])
    expect(harness.listenerCount('internal/service')).toBe(0)
    expect(harness.effects).toHaveLength(0)
  })

  test('the partial alpha window defers, warns once, and mounts on the completing arrival', () => {
    const arrange = defaultArrangement()
    const value = { writable: true, hasDocument: true, namespaces: [piAiNamespace(arrange)] }
    const { services } = alphaRemotes({ describe: () => Promise.resolve({ ok: true, value }) })
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
    const { services: llmOnly } = alphaRemotes({})
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
    const { services } = alphaRemotes({
      describe: () => Promise.resolve({ ok: true, value: { writable: true, hasDocument: true, namespaces: [] } }),
    })
    delete services['remote.settings']
    delete services['remote.llm']
    const harness = gentleCtx(services)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mounted: IRemoteApi[] = []

    expect(() => resolveRemoteApiGently(harness.ctx, api => mounted.push(api))).not.toThrow()
    expect(mounted).toHaveLength(0)
    // The mandated idle-diagnostic: exactly one warn, naming BOTH missing
    // generations and the self-healing follow-up, fired at the first
    // not-ready observation — never stacked by later arrivals.
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toMatch(/no harness Remote face is available yet/)
    expect(warn.mock.calls[0]?.[0]).toMatch(/remote\.settings\/remote\.llm/)
    expect(warn.mock.calls[0]?.[0]).toMatch(/connection\.api/)
    expect(harness.listenerCount('internal/service')).toBe(1)

    // settings arriving alone upgrades nothing (and stays silent about it).
    services['remote.settings'] = alphaRemotes({}).services['remote.settings']
    harness.emit('internal/service', 'remote.settings', services['remote.settings'])
    expect(warn).toHaveBeenCalledTimes(1)
    expect(mounted).toHaveLength(0)

    services['remote.llm'] = alphaRemotes({}).services['remote.llm']
    harness.emit('internal/service', 'remote.llm', services['remote.llm'])
    expect(mounted).toHaveLength(1)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  test('remote.llm answering first warns about remote.settings — never lies "neither"', () => {
    // The reversed mount order: llm present while settings is still in
    // flight is PARTIAL awaiting remote.settings, not "absent".
    const { services } = alphaRemotes({})
    delete services['remote.settings']
    const harness = gentleCtx(services)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mounted: IRemoteApi[] = []

    resolveRemoteApiGently(harness.ctx, api => mounted.push(api))
    expect(mounted).toHaveLength(0)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toMatch(/remote\.llm answered but remote\.settings has not/)
    expect(harness.listenerCount('internal/service')).toBe(1)

    services['remote.settings'] = alphaRemotes({}).services['remote.settings']
    harness.emit('internal/service', 'remote.settings', services['remote.settings'])
    expect(mounted).toHaveLength(1)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(harness.listenerCount('internal/service')).toBe(0)
  })

  test('a reentrant arrival emitted mid-mount cannot double-mount', () => {
    // mount's own contributions run synchronously inside one dispatch; if
    // any of them emits another service arrival, exactly-once must be
    // structural (the done latch), not a race against the unsubscribe.
    const { services } = alphaRemotes({
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

    services['remote.llm'] = alphaRemotes({}).services['remote.llm']
    harness.emit('internal/service', 'remote.llm', services['remote.llm'])
    expect(mounted).toHaveLength(1)
    expect(harness.listenerCount('internal/service')).toBe(0)
  })

  test('disposing the fiber before completion stops the retry', () => {
    const { services } = alphaRemotes({
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

    services['remote.llm'] = alphaRemotes({}).services['remote.llm']
    harness.emit('internal/service', 'remote.llm', services['remote.llm'])
    expect(mounted).toHaveLength(0)
  })

  test('a mount throw at the immediate attempt is logged once and never escapes apply', () => {
    // Cordis emits `internal/service` with NO try/catch, and the first
    // attempt runs synchronously inside apply(): an escaping mount throw
    // would fail the whole loader entry.
    const { services } = alphaRemotes({})
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
    const { services } = alphaRemotes({})
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

    services['remote.llm'] = alphaRemotes({}).services['remote.llm']
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
