/**
 * Plugin-entry coverage: apply() wiring — locale registration, stylesheet
 * lifetime, pushed-refresh subscriptions, and the slot registration closure
 * — plus refreshIfLoaded's idle-vs-loaded gate.
 */

import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { cleanup } from '@testing-library/react'
import { apply, name, inject, refreshIfLoaded, CapabilitiesSection } from '../src/client/index.ts'
import { CapabilitiesController } from '../src/client/store.ts'
import { en } from '../src/client/locales.ts'
import type { ClientShim, DiscoverPayload, IRemoteApi } from '../src/client/types.ts'
import { defaultArrangement, scriptedFace } from './helpers.ts'

/**
 * The mounted `remote.settings` / `remote.llm` service pair answering one
 * scripted page face. The generated service clients take positional arguments
 * and resolve the slim `RemoteResult` envelope — the scripted face's carrier
 * `result` arm, with the directory and discovery values UNBOXED, exactly as the
 * services answer them. This bridge is therefore the SERVICE side of the same
 * projection `wire.ts` adapts back onto the page, and it stays live: each call
 * re-reads the (monkey-patchable) scripted methods.
 */
function servicePair(api: IRemoteApi): Record<string, unknown> {
  const settings = api.settings
  const llm = api.llm
  return {
    'remote.settings': {
      describe: () => settings.describe({}).then(response => response.result),
      mutate: (ns: string, ops: Parameters<typeof settings.mutate>[0]['ops'], expectedRevision?: number) =>
        settings.mutate({
          ns,
          ops,
          // The page's payload is exact-optional: an absent revision must stay
          // absent, never present-undefined.
          ...(expectedRevision === undefined ? {} : { expectedRevision }),
        }).then(response => response.result),
    },
    'remote.llm': {
      // Both llm methods answer the BARE value; the page's carrier boxes them
      // back into `{providers}` / `{models}` when it adapts the pair.
      listConfigurableProviders: () => llm.providers({}).then(({ result }) =>
        result.ok ? { ok: true, value: result.value.providers } : result),
      discoverModels: (settingsNs: string, request: Omit<DiscoverPayload, 'settingsNs'>, signal?: AbortSignal) =>
        llm.discoverModels({ settingsNs, ...request }, signal).then(({ result }) =>
          result.ok ? { ok: true, value: result.value.models } : result),
    },
  }
}

/** A fully scripted ClientShim whose seams the assertions read back. */
function fakeCtx(services: Record<string, unknown> = {}): {
  ctx: ClientShim
  effects: { fn: () => unknown; name: string | undefined }[]
  remotes: { event: string; handler: (...args: readonly unknown[]) => void }[]
  registrations: { options: Record<string, unknown>; component: unknown }[]
  binds: string[]
  dictionaries: { ns: string; dictionaries: Record<string, Record<string, string>> }[]
} {
  const effects: { fn: () => unknown; name: string | undefined }[] = []
  const remotes: { event: string; handler: (...args: readonly unknown[]) => void }[] = []
  const registrations: { options: Record<string, unknown>; component: unknown }[] = []
  const binds: string[] = []
  const dictionaries: { ns: string; dictionaries: Record<string, Record<string, string>> }[] = []
  const ctx: ClientShim = {
    locale: {
      register: (ns, dicts) => { dictionaries.push({ ns, dictionaries: dicts }); return () => {} },
      bind: ns => {
        binds.push(ns)
        return (key: string) => (en as Record<string, string>)[key] ?? key
      },
    },
    slots: {
      inject: (_slot, register) => {
        const result = register()
        if (typeof result === 'function') result()
        return () => {}
      },
      register: (options, component) => { registrations.push({ options: options as unknown as Record<string, unknown>, component }); return () => {} },
    },
    remote: { $on: (event, handler) => { remotes.push({ event, handler: handler as (...args: readonly unknown[]) => void }); return () => {} } },
    // The readiness probe observes the scripted service table through `get`
    // only: the plugin never declares `remote.<ns>` in its own inject list.
    // A caller with an empty table exercises the deferred, warned-once path.
    get: (name: string) => services[name],
    effect: (fn, name) => { effects.push({ fn, name }) },
    on: (event, handler) => {
      remotes.push({ event, handler })
      return () => {}
    },
  }
  return { ctx, effects, remotes, registrations, binds, dictionaries }
}

afterEach(() => {
  cleanup()
  // apply() owns its stylesheet for the fiber lifetime, but the fake ctx's
  // effects are manually driven per test: collect leftovers deterministically.
  for (const el of document.head.querySelectorAll('style[data-plugin="better-model-provider"]')) el.remove()
})

describe('plugin entry', () => {
  test('the fiber identity is stable', () => {
    expect(name).toBe('better-model-provider')
    // `connection` is deliberately absent: the ≤0.1.1 namespaced `api` face is
    // gone, and `connection/reset` is an event, not a service read.
    expect(inject).toEqual(['slots', 'locale', 'remote'])
  })

  test('apply registers copy, stylesheet, wiring, and the slot', async () => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    const { ctx, effects, remotes, registrations, binds, dictionaries } = fakeCtx(servicePair(api))
    apply(ctx)
    for (const effect of effects) void effect.fn()

    expect(dictionaries.map(d => d.ns)).toEqual(['better-model-provider'])
    expect(binds).toEqual(['better-model-provider'])
    const style = document.head.querySelector('style[data-plugin="better-model-provider"]')
    expect(style).not.toBeNull()
    // The sheet must parse and the row separators must survive: a dangling
    // selector once swallowed .bmp-modelRow while merging duplicate rules
    // (line-level inspection missed it — the CSSOM does not).
    const selectors = [...(style as HTMLStyleElement).sheet?.cssRules ?? []].map(rule => rule.cssText)
    expect(selectors.some(text => text.includes('.bmp-modelRow'))).toBe(true)

    // One effect per contribution: locale, stylesheet, controller lifetime,
    // and pushed invalidations.
    const names = effects.map(effect => effect.name).filter((value): value is string => value !== undefined)
    expect(names).toContain('better-model-provider: dictionaries')
    expect(names).toContain('better-model-provider: stylesheet')
    expect(names).toContain('better-model-provider: controller')
    expect(names).toContain('better-model-provider: pushed invalidations')

    expect(remotes.map(subscription => subscription.event)).toEqual([
      'settings/document-updated',
      'llm/adapters-updated',
      'connection/reset',
    ])

    expect(registrations).toHaveLength(1)
    const registration = registrations[0]
    expect(registration?.options['name']).toBe('settings.section')
    expect(registration?.options['id']).toBe('better-model-provider')
    expect(registration?.component).toBe(CapabilitiesSection)
    const label = registration?.options['label'] as () => string
    expect(label()).toBe(en.nav)
    interface Face {
      controller: import('../src/client/store.ts').CapabilitiesController
      useSnapshot: () => import('../src/client/store.ts').CapabilitiesState
      t: (k: string) => string
    }
    if (registration === undefined) throw new Error('no slot registration captured')
    const injectFace = (registration.options['inject'] as () => Face)()
    expect(typeof injectFace.t).toBe('function')

    // Style disposer removes the element.
    const stylesheet = effects.find(effect => effect.name === 'better-model-provider: stylesheet')
    const dispose = stylesheet?.fn() as (() => void) | undefined
    dispose?.()
    expect(document.head.querySelector('style[data-plugin="better-model-provider"]')).toBeNull()

    // Invoking the registered component works end to end.
    const controller = injectFace.controller
    const useSnapshot = injectFace.useSnapshot
    const Component = registration?.component as typeof CapabilitiesSection
    render(<Component controller={controller} useSnapshot={useSnapshot} t={injectFace.t} close={() => {}} />)
    void controller.load()
    await waitFor(() => expect(screen.queryByText(en.loading)).toBeNull())
    expect(screen.queryByText(en.nav)).not.toBeNull()

    // A pushed invalidation reloads once the page has loaded...
    let describes = 0
    const before = api.settings.describe
    api.settings.describe = async payload => {
      describes += 1
      return before(payload)
    }
    remotes[0]?.handler('llm-pi-ai')
    await waitFor(() => expect(describes).toBe(1))

    // ...and the fiber's composite disposer runs every subscription cleanup.
    const invalidations = effects.find(effect => effect.name === 'better-model-provider: pushed invalidations')
    const disposeAll = invalidations?.fn() as (() => void) | undefined
    disposeAll?.()

    // Unloading the fiber also makes the controller drop late responses.
    const controllerEffect = effects.find(effect => effect.name === 'better-model-provider: controller')
    const disposeController = controllerEffect?.fn() as (() => void) | undefined
    disposeController?.()
  })

  test('a Remote face still mounting defers EVERY registration instead of throwing', () => {
    // The harness mounts its `remote.<ns>` services one asynchronous namespace
    // at a time — settings lands before llm — so an apply running in that
    // window must WAIT rather than fail the loader entry (a throw here once
    // bricked the whole client composition).
    const services: Record<string, unknown> = {}
    const { ctx, effects, remotes, registrations } = fakeCtx(services)
    expect(() => apply(ctx)).not.toThrow()
    expect(registrations).toHaveLength(0)
    expect(document.head.querySelector('style[data-plugin="better-model-provider"]')).toBeNull()
    // Only the face-await effect is registered; the retry rides Cordis's
    // service-arrival event through the scripted `on` record.
    expect(effects.map(effect => effect.name)).toEqual(['better-model-provider: remote face await'])
    const waiter = remotes.find(subscription => subscription.event === 'internal/service')
    expect(waiter).toBeDefined()

    // Complete the assembly, then announce the final namespace: the whole
    // contribution — stylesheet, dictionaries effect, slot — lands at once.
    services['remote.settings'] = {
      describe: () => Promise.resolve({ ok: true, value: { writable: true, hasDocument: true, namespaces: [] } }),
      mutate: () => Promise.resolve({ ok: true, value: {} }),
    }
    services['remote.llm'] = {
      listConfigurableProviders: () => Promise.resolve({ ok: true, value: [] }),
      discoverModels: () => Promise.resolve({ ok: true, value: [] }),
    }
    waiter?.handler('remote.llm', {})
    expect(registrations).toHaveLength(1)
    expect(registrations[0]?.options['name']).toBe('settings.section')
    expect(document.head.querySelector('style[data-plugin="better-model-provider"]')).not.toBeNull()
  })

  test('unrelated settings documents do not refresh the page', () => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    let describes = 0
    const before = api.settings.describe
    api.settings.describe = async payload => {
      describes += 1
      return before(payload)
    }
    const { ctx, effects, remotes } = fakeCtx(servicePair(api))
    apply(ctx)
    for (const effect of effects) void effect.fn()
    remotes[0]?.handler('some-other-ns')
    expect(describes).toBe(0)
    remotes[0]?.handler('llm-pi-ai')
    expect(describes).toBe(0)
    // Topology and reset handlers refresh too; while idle they stay free.
    remotes[1]?.handler(undefined)
    remotes[2]?.handler(undefined)
    expect(describes).toBe(0)
  })

  test('mounting twice and disposing both leaves no duplicate artifacts', () => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    const first = fakeCtx(servicePair(api))
    const second = fakeCtx(servicePair(api))
    apply(first.ctx)
    apply(second.ctx)
    for (const effect of first.effects) void effect.fn()
    for (const effect of second.effects) void effect.fn()
    expect(document.head.querySelectorAll('style[data-plugin="better-model-provider"]')).toHaveLength(2)
    const disposeStylesheet = (effects: typeof first.effects): void => {
      const entry = effects.find(effect => effect.name === 'better-model-provider: stylesheet')
      ;(entry?.fn() as (() => void) | undefined)?.()
    }
    disposeStylesheet(first.effects)
    disposeStylesheet(second.effects)
    expect(document.head.querySelectorAll('style[data-plugin="better-model-provider"]')).toHaveLength(0)
  })

  test('a pushed refresh before the first load is a no-op', () => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    let describes = 0
    const before = api.settings.describe
    api.settings.describe = async payload => {
      describes += 1
      return before(payload)
    }
    const { ctx, effects, remotes } = fakeCtx(servicePair(api))
    apply(ctx)
    for (const effect of effects) void effect.fn()
    expect(remotes).toHaveLength(3)
    remotes[0]?.handler('llm-pi-ai')
    expect(describes).toBe(0)
  })

  test('refreshIfLoaded no-ops while idle and reloads once ready', async () => {
    const arrange = defaultArrangement()
    const { api } = scriptedFace(arrange)
    const controller = new CapabilitiesController(api)
    refreshIfLoaded(controller)
    await controller.load()
    let describes = 0
    const before = api.settings.describe
    api.settings.describe = async payload => {
      describes += 1
      return before(payload)
    }
    refreshIfLoaded(controller)
    await waitFor(() => expect(describes).toBe(1))
  })
})