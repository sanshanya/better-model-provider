/**
 * The Model capabilities section shell: inject face, load choreography, and
 * the top-level render split. Rows, cards, editors, and the dormant region
 * live in their own modules — this file only composes them from the snapshot.
 *
 * @module better-model-provider/CapabilitiesSection
 */
import type { ReactElement } from 'react';
import type { CapabilitiesController, CapabilitiesState } from './store.ts';
import type { TFn } from './locales.ts';
/** The section's inject face bound at registration time. */
export interface CapabilitiesSectionInjected {
    /** The page controller. */
    controller: CapabilitiesController;
    /** Identity-stable snapshot hook. */
    useSnapshot: () => CapabilitiesState;
    /** Bound translate for this section's dictionaries. */
    t: TFn;
}
/** Owner share of the settings.section entry. */
export interface CapabilitiesSectionProps extends CapabilitiesSectionInjected {
    /** Close the settings panel. */
    close: () => void;
}
/** The settings.section component for Model capabilities. */
export declare function CapabilitiesSection(props: CapabilitiesSectionProps): ReactElement;
