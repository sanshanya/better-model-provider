/**
 * Model capabilities client half: registers one `settings.section` entry
 * backed by its own controller, keeps it fresh on every pushed invalidation
 * (settings, provider topology, connection reset), and owns the section's
 * stylesheet for the fiber lifetime. Nothing registers until the harness
 * Remote face is genuinely usable (see mount).
 *
 * @module better-model-provider/client
 */
import { CapabilitiesController } from './store.ts';
import { CapabilitiesSection } from './CapabilitiesSection.tsx';
import { type CapsKey } from './locales.ts';
import type { ClientShim } from './types.ts';
/** Stable plugin id, matching the cordis.patch.yml row and the bundle id. */
export declare const name = "better-model-provider";
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
export declare const inject: string[];
/** Refetch the page only after its first load. */
export declare function refreshIfLoaded(controller: CapabilitiesController): void;
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
export declare function apply(ctx: ClientShim): void;
export type { CapsKey };
export type { CapabilitiesController };
export { CapabilitiesSection };
export type { CapabilitiesSectionInjected, CapabilitiesSectionProps } from './CapabilitiesSection.tsx';
export * from './types.ts';
