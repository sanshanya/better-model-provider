/**
 * Bundle smoke: build the client artifact fresh, execute its
 * `window.__ModuleLoader__.load` wrapper inside the jsdom realm, and drive
 * the exported section through a full render against the scripted face.
 * This proves the packaged shape the DSH shell actually serves.
 */

import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, test } from 'vitest'
import { cleanup } from '@testing-library/react'
import { createElement, useSyncExternalStore } from 'react'
import { en } from '../src/client/locales.ts'
import type { IRemoteApi } from '../src/client/types.ts'
import { defaultArrangement, scriptedFace } from './helpers.ts'

/** Loader entry the wrapper registers. */
interface LoadedBundle {
  id: string
  factory: (require: (spec: string) => unknown) => {
    name?: string
    inject?: readonly string[]
    apply?: (ctx: unknown) => void
    CapabilitiesSection?: unknown
  }
}

let bundle: LoadedBundle
let react: unknown
let jsxRuntime: unknown

beforeAll(async () => {
  execFileSync('node', ['scripts/build-client.mjs'], { stdio: 'pipe', cwd: process.cwd() })
  react = await import('react')
  jsxRuntime = await import('react/jsx-runtime')
  const code = await readFile('lib/client.js', 'utf8')
  const registered: LoadedBundle[] = []
  const windowShim = {
    __ModuleLoader__: {
      load: (entry: LoadedBundle) => { registered.push(entry) },
    },
  }
  new Function('window', code)(windowShim)
  const first = registered[0]
  if (first === undefined) throw new Error('bundle smoke: no load entry registered')
  bundle = first
})

afterEach(() => { cleanup() })

/** Resolve externals the way the shell's module table does. */
function shellRequire(spec: string): unknown {
  if (spec === 'react') return react
  if (spec === 'react/jsx-runtime') return jsxRuntime
  throw new Error(`bundle smoke: unexpected external ${spec}`)
}

describe('packed client bundle', () => {
  test('registers the expected id and factory exports', () => {
    expect(bundle.id).toBe('better-model-provider')
    const exports = bundle.factory(shellRequire)
    expect(exports.name).toBe('better-model-provider')
    expect(exports.inject).toEqual(['slots', 'locale', 'connection', 'remote'])
    expect(typeof exports.apply).toBe('function')
    expect(typeof exports.CapabilitiesSection).toBe('function')
  })

  test('the exported section renders through the bundle-owned jsx runtime', async () => {
    const exports = bundle.factory(shellRequire)
    const arrange = defaultArrangement()
    const { api }: { api: IRemoteApi } = scriptedFace(arrange)
    const { CapabilitiesController } = await import('../src/client/store.ts')
    const controller = new CapabilitiesController(api)
    const Component = exports.CapabilitiesSection as (props: Record<string, unknown>) => import('react').ReactElement
    const t = (key: string): string => (en as Record<string, string>)[key] ?? key
    render(createElement(Component, {
      controller,
      useSnapshot: () => useSyncExternalStore(controller.store.subscribe, controller.store.getSnapshot),
      t,
      close: () => {},
    }))
    // Self-sufficiency: NOBODY may call controller.load() on the section's
    // behalf — an idle controller renders `loading` forever if the component
    // fails to own its first fetch, which is exactly what this guards.
    expect(controller.store.getSnapshot().status).not.toBe('idle')
    await waitFor(() => expect(screen.queryByText(en.loading)).toBeNull())
    expect(screen.queryByText(en.title)).not.toBeNull()
  })
})
