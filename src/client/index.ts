/**
 * Model capabilities client half: registers one `settings.section` entry
 * backed by its own controller, keeps it fresh on every pushed invalidation
 * (settings, provider topology, connection reset), and owns the section's
 * stylesheet for the fiber lifetime. Nothing registers until the harness
 * Remote face is genuinely usable (see mount).
 *
 * @module better-model-provider/client
 */

import { useSyncExternalStore } from 'react'
import { CapabilitiesController, PI_AI_NS } from './store.ts'
import { resolveRemoteApiGently } from './wire.ts'
import { CapabilitiesSection } from './CapabilitiesSection.tsx'
import type { CapabilitiesSectionInjected } from './CapabilitiesSection.tsx'
import { en, zh, type CapsKey, type TFn } from './locales.ts'
import type { ClientShim, RemoteApi } from './types.ts'
import { STYLES } from './styles.ts'

/** Stable plugin id, matching the cordis.patch.yml row and the bundle id. */
export const name = 'better-model-provider'

/** Dictionary namespace owned by this plugin. */
const NS = 'better-model-provider'

/**
 * Cordis fiber dependencies of the browser half.
 *
 * `connection` is deliberately absent: the page no longer reads `ctx.connection`
 * (the ≤0.1.1 namespaced `api` fallback is gone) and its only remaining use of
 * that package is the `connection/reset` EVENT, which needs no service
 * dependency. The service is still provided in every shipped profile — the
 * web-app bundle mounts `@deepseek-ai/dsh-client-connection` itself
 * (`packages/bundle/web-app/cordis.patch.yml:197-198` at `dsh-v0.1.7-rc.1`) —
 * so the event keeps firing. Declaring a service this fiber does not read would
 * only leave it pending until that provider arrives, and a pending client fiber
 * fails the whole page (`packages/client/web/src/boot-client.ts:66-88`).
 */
export const inject = ['slots', 'locale', 'remote']

/** Refetch the page only after its first load. */
export function refreshIfLoaded(controller: CapabilitiesController): void {
  const status = controller.store.getSnapshot().status
  if (status === 'idle') return
  void controller.reload()
}

/**
 * Defer ALL contribution until the harness Remote face resolves. dsh
 * 0.1.2-alpha.1 mounts its `remote.<ns>` Cordis services SEQUENTIALLY and
 * asynchronously — remote.settings lands before remote.llm — so a
 * synchronous apply can observe the pair half-born; throwing (or registering
 * a section whose controller cannot join) in that window fails the whole
 * loader entry. The gentle resolver mounts as soon as the face completes and
 * never throws.
 * @param ctx - client root context, narrowed to the services this plugin uses.
 */
export function apply(ctx: ClientShim): void {
  resolveRemoteApiGently(ctx, api => mount(ctx, api))
}

/**
 * Register the section, the copy dictionaries, the pushed-refresh wiring,
 * and the stylesheet; every contribution disposes with the plugin fiber.
 * Runs exactly once, the first time the Remote face resolves.
 * @param ctx - client root context, narrowed to the services this plugin uses.
 * @param api - the resolved Remote face the page speaks.
 */
function mount(ctx: ClientShim, api: RemoteApi): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'better-model-provider: dictionaries')

  const style = document.createElement('style')
  style.dataset['plugin'] = 'better-model-provider'
  style.textContent = STYLES
  document.head.appendChild(style)
  ctx.effect(() => () => style.remove(), 'better-model-provider: stylesheet')

  const controller = new CapabilitiesController(api)
  ctx.effect(() => () => controller.dispose(), 'better-model-provider: controller')
  const useSnapshot = (): ReturnType<CapabilitiesController['store']['getSnapshot']> =>
    useSyncExternalStore(
      controller.store.subscribe,
      controller.store.getSnapshot,
    )
  // Registration-time text (the nav label thunk) shares one bound translate
  // with the render-time face; copy freshness rides the locale revision.
  const bound = ctx.locale.bind(NS)
  const t: TFn = (key, params) => bound(key, params)
  const injectFace = (): CapabilitiesSectionInjected => ({ controller, useSnapshot, t })

  ctx.effect(() => {
    const refresh = (): void => { refreshIfLoaded(controller) }
    const disposers = [
      // The payload is `(ns, revision)`: edits to unrelated documents must
      // not cost this page a fresh join.
      ctx.remote.$on('settings/document-updated', ns => {
        if (ns === PI_AI_NS) refreshIfLoaded(controller)
      }),
      ctx.remote.$on('llm/adapters-updated', refresh),
      ctx.on('connection/reset', refresh),
    ]
    return () => { for (const dispose of disposers) dispose() }
  }, 'better-model-provider: pushed invalidations')

  ctx.slots.inject('settings.section', () => ctx.slots.register<CapabilitiesSectionInjected, { close: () => void }>({
    name: 'settings.section',
    id: NS,
    order: 11,
    label: () => t('nav'),
    inject: injectFace,
  }, CapabilitiesSection))
}

export type { CapsKey }
export type { CapabilitiesController }
export { CapabilitiesSection }
export type { CapabilitiesSectionInjected, CapabilitiesSectionProps } from './CapabilitiesSection.tsx'
export * from './types.ts'
