/**
 * The provider cards and the dormant region. `ProviderCard` is deliberately
 * hookless: it is the flavor dispatch point between the declared card and the
 * catalog card, so a write-mode flip across a reload swaps component identity
 * cleanly instead of changing one component's hook count mid-render.
 *
 * @module better-model-provider/cards
 */
import type { ReactElement } from 'react';
import type { TFn } from './locales.ts';
import type { CapabilitiesController, CapabilityRowView } from './store.ts';
/** Shared props of one provider card flavor. */
export interface ProviderCardProps {
    /** Joined row: route facts + profile models. */
    row: CapabilityRowView;
    /** The page controller. */
    controller: CapabilitiesController;
    /** Schema vocabularies. */
    levels: readonly string[];
    /** Schema vocabularies. */
    modalities: readonly string[];
    /** Whether settings are writable. */
    writable: boolean;
    /** Bound translate. */
    t: TFn;
}
/**
 * The flavor dispatch — hookless BY CONTRACT. A row's writeMode can flip
 * across a reload under the same React key (a models[] list deleted elsewhere,
 * a composition layer appearing); with hooks in this component, that flip
 * would change its hook count mid-lifetime and unmount the whole subtree.
 */
export declare function ProviderCard(props: ProviderCardProps): ReactElement;
/**
 * The dormant official providers region: collapsed by default, expanding it
 * shows one compact row per installed catalog route not yet configured.
 * Picking a row unfolds that provider's ordinary catalog card inline — the
 * region stores nothing (the first override write materializes the profile),
 * and at most one card is open at a time.
 */
/**
 * The shared card inputs a region forwards to whichever provider is picked. */
export type CardContextProps = Omit<ProviderCardProps, 'row'>;
export declare function DormantRegion(props: CardContextProps & {
    /** Dormant catalog rows. */
    dormant: readonly CapabilityRowView[];
}): ReactElement;
