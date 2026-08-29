/**
 * Model capabilities client half: registers one `settings.section` entry
 * backed by its own controller, keeps it fresh on every pushed invalidation
 * (settings, provider topology, connection reset), and owns the section's
 * stylesheet for the fiber lifetime.
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
 * Register the section, the copy dictionaries, the pushed-refresh wiring,
 * and the stylesheet; every contribution disposes with the plugin fiber.
 * @param ctx - client root context, narrowed to the services this plugin uses.
 */
export declare function apply(ctx: ClientShim): void;
export type { CapsKey };
export type { CapabilitiesController };
export { CapabilitiesSection };
export type { CapabilitiesSectionInjected, CapabilitiesSectionProps } from './CapabilitiesSection.tsx';
export * from './types.ts';
