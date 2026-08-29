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
/** Cordis fiber dependencies of the browser half. */
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
