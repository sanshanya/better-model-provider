/**
 * The Model capabilities section shell: inject face, load choreography, and
 * the top-level render split. Rows, cards, editors, and the dormant region
 * live in their own modules — this file only composes them from the snapshot.
 *
 * @module better-model-provider/CapabilitiesSection
 */

import { useEffect } from 'react'
import type { ReactElement } from 'react'
import type { CapabilitiesController, CapabilitiesState } from './store.ts'
import type { TFn } from './locales.ts'
import { DormantRegion, ProviderCard } from './cards.tsx'

/** The section's inject face bound at registration time. */
export interface CapabilitiesSectionInjected {
  /** The page controller. */
  controller: CapabilitiesController
  /** Identity-stable snapshot hook. */
  useSnapshot: () => CapabilitiesState
  /** Bound translate for this section's dictionaries. */
  t: TFn
}

/** Owner share of the settings.section entry. */
export interface CapabilitiesSectionProps extends CapabilitiesSectionInjected {
  /** Close the settings panel. */
  close: () => void
}

/** The settings.section component for Model capabilities. */
export function CapabilitiesSection(props: CapabilitiesSectionProps): ReactElement {
  const { controller, useSnapshot, t } = props
  const snapshot = useSnapshot()
  const status = snapshot.status
  // The first mount owns the first fetch: the controller starts idle and
  // pushed invalidations deliberately skip it, so this effect is the page's
  // only way into its first load — an effect, never a render-phase write.
  useEffect(() => { if (status === 'idle') void controller.load() }, [status, controller])
  const namespace = snapshot.namespace
  if (status === 'idle' || status === 'loading') {
    return <div className="bmp-section"><p className="bmp-muted">{t('loading')}</p></div>
  }
  if (status === 'error') {
    return (
      <div className="bmp-section">
        <div className="bmp-error" role="alert">{snapshot.error}</div>
        <button type="button" className="bmp-button" onClick={() => void controller.reload()}>{t('retry')}</button>
      </div>
    )
  }
  return (
    <div className="bmp-section">
      <h2 className="bmp-title">{t('title')}</h2>
      <p className="bmp-muted">{t('intro')}</p>
      {!snapshot.writable && <p className="bmp-muted">{t('readOnly')}</p>}
      {snapshot.rows.length === 0 && (
        <div className="bmp-empty">
          <div className="bmp-emptyTitle">{t('empty')}</div>
          <div className="bmp-muted">{t('emptyHint')}</div>
        </div>
      )}
      {namespace !== undefined && snapshot.rows.map(row => (
        <ProviderCard
          key={row.entry.provider}
          row={row}
          controller={controller}
          levels={snapshot.levels}
          modalities={snapshot.modalities}
          writable={snapshot.writable}
          t={t}
        />
      ))}
      {namespace !== undefined && snapshot.dormant.length > 0 && (
        <DormantRegion
          dormant={snapshot.dormant}
          controller={controller}
          levels={snapshot.levels}
          modalities={snapshot.modalities}
          writable={snapshot.writable}
          t={t}
        />
      )}
    </div>
  )
}
