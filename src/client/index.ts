/**
 * Model capabilities client half: registers one `settings.section` entry
 * backed by its own controller, keeps it fresh on every pushed invalidation
 * (settings, provider topology, connection reset), and owns the section's
 * stylesheet for the fiber lifetime.
 *
 * @module better-model-provider/client
 */

import { useSyncExternalStore } from 'react'
import { CapabilitiesController } from './store.ts'
import { CapabilitiesSection } from './CapabilitiesSection.tsx'
import type { CapabilitiesSectionInjected } from './CapabilitiesSection.tsx'
import { en, zh, type CapsKey } from './locales.ts'
import type { ClientShim } from './types.ts'
import { STYLES } from './styles.ts'

/** Stable plugin id, matching the cordis.patch.yml row and the bundle id. */
export const name = 'better-model-provider'

/** Dictionary namespace owned by this plugin. */
const NS = 'better-model-provider'

/** The settings namespace this plugin edits; unrelated documents do not reload it. */
const SETTINGS_NS = 'llm-pi-ai'

/** Cordis fiber dependencies of the browser half. */
export const inject = ['slots', 'locale', 'connection', 'remote']

/** Refetch the page only after its first load. */
export function refreshIfLoaded(controller: CapabilitiesController): void {
  const status = controller.store.getSnapshot().status
  if (status === 'idle') return
  void controller.reload()
}

/**
 * Register the section, the copy dictionaries, the pushed-refresh wiring,
 * and the stylesheet; every contribution disposes with the plugin fiber.
 * @param ctx - client root context, narrowed to the services this plugin uses.
 */
export function apply(ctx: ClientShim): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'better-model-provider: dictionaries')

  const style = document.createElement('style')
  style.dataset['plugin'] = 'better-model-provider'
  style.textContent = STYLES
  document.head.appendChild(style)
  ctx.effect(() => () => style.remove(), 'better-model-provider: stylesheet')

  const controller = new CapabilitiesController(ctx.connection.api)
  ctx.effect(() => () => controller.dispose(), 'better-model-provider: controller')
  const useSnapshot = (): ReturnType<CapabilitiesController['store']['getSnapshot']> =>
    useSyncExternalStore(
      controller.store.subscribe,
      controller.store.getSnapshot,
    )
  // Registration-time text (the nav label thunk) shares one bound translate
  // with the render-time face; copy freshness rides the locale revision.
  const t = ctx.locale.bind(NS) as CapabilitiesSectionInjected['t']
  const injectFace = (): CapabilitiesSectionInjected => ({ controller, useSnapshot, t })

  ctx.effect(() => {
    const refresh = (): void => { refreshIfLoaded(controller) }
    const disposers = [
      // The payload is `(ns, revision)`: edits to unrelated documents must
      // not cost this page a fresh join.
      ctx.remote.$on('settings/document-updated', ns => {
        if (ns === SETTINGS_NS) refreshIfLoaded(controller)
      }),
      ctx.remote.$on('llm/adapters-updated', refresh),
      ctx.on('connection/reset', refresh),
    ]
    return () => { for (const dispose of disposers) dispose() }
  }, 'better-model-provider: pushed invalidations')

  ctx.slots.inject('settings.section', () => ctx.slots.register({
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
