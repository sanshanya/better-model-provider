/**
 * The provider cards and the dormant region. `ProviderCard` is deliberately
 * hookless: it is the flavor dispatch point between the declared card and the
 * catalog card, so a write-mode flip across a reload swaps component identity
 * cleanly instead of changing one component's hook count mid-render.
 *
 * @module better-model-provider/cards
 */

import { useCallback, useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import type { TFn } from './locales.ts'
import type { CapabilitiesController, CapabilityRowView, CapabilityWriteMode } from './store.ts'
import { messageOf } from './store.ts'
import type { CapabilityPatch } from './writes.ts'
import { catalogEditOps, declaredEditOps, hasCapabilityOverride, resetOverrideOps } from './writes.ts'
import type { DiscoveredModelView } from './types.ts'
import { formatCapacity } from './capacity.ts'
import { ModelRow } from './rows.tsx'

/** Shared props of one provider card flavor. */
export interface ProviderCardProps {
  /** Joined row: route facts + profile models. */
  row: CapabilityRowView
  /** The page controller. */
  controller: CapabilitiesController
  /** Schema vocabularies. */
  levels: readonly string[]
  /** Schema vocabularies. */
  modalities: readonly string[]
  /** Whether settings are writable. */
  writable: boolean
  /** Bound translate. */
  t: TFn
}

/**
 * The card tag is a persistence fact, not a route label: who owns the served
 * model list decides which copy is true, and only claims the code verifies.
 */
function tagOf(writeMode: CapabilityWriteMode, declared: boolean | undefined): 'officialCatalog' | 'officialUserList' | 'declaredRoute' | 'inheritedRoute' {
  switch (writeMode) {
    case 'catalog-overrides': return 'officialCatalog'
    case 'inherited-models': return 'inheritedRoute'
    case 'declared-models': return declared === false ? 'officialUserList' : 'declaredRoute'
  }
}

/** The card shell: title, route key, persistence tag. */
function CardShell(props: {
  /** The joined row. */
  row: CapabilityRowView
  /** Bound translate. */
  t: TFn
  /** The card body. */
  children: ReactElement | readonly (ReactElement | false | null | undefined)[]
}): ReactElement {
  const { row, t, children } = props
  return (
    <section className="bmp-card">
      <header className="bmp-cardHeader">
        <span className="bmp-cardTitle">{row.entry.displayName}</span>
        <span className="bmp-cardMeta">{row.entry.provider}</span>
        <span className="bmp-tag">{t(tagOf(row.writeMode, row.entry.declared))}</span>
      </header>
      {children}
    </section>
  )
}

/**
 * The flavor dispatch — hookless BY CONTRACT. A row's writeMode can flip
 * across a reload under the same React key (a models[] list deleted elsewhere,
 * a composition layer appearing); with hooks in this component, that flip
 * would change its hook count mid-lifetime and unmount the whole subtree.
 */
export function ProviderCard(props: ProviderCardProps): ReactElement {
  return props.row.writeMode === 'catalog-overrides'
    ? <CatalogCard {...props} />
    : <DeclaredCard {...props} />
}

/** One declared provider card: header + its user-owned models with capability editors. */
function DeclaredCard(props: ProviderCardProps): ReactElement {
  const { row, controller, levels, modalities, writable, t } = props
  const applyRow = useCallback(async (
    index: number,
    modelId: string,
    patch: CapabilityPatch,
  ): Promise<boolean> => {
    // commit() builds the ops from the same authoritative snapshot that
    // supplies expectedRevision; identity-checked addressing lives inside
    // declaredEditOps so the index may not outrank the model id.
    return controller.commit(snapshot => declaredEditOps(snapshot, row.entry.settingsPath, index, modelId, patch))
  }, [controller, row.entry.settingsPath])
  // Ownership decided at the join: only a user-owned models[] is editable.
  const rowWritable = writable && row.writeMode === 'declared-models'
  return (
    <CardShell row={row} t={t}>
      {row.writeMode === 'inherited-models' && (
        <p className="bmp-muted">{t('inheritedModelList')}</p>
      )}
      <div className="bmp-models">
        {row.models.map((model, index) => {
          const id = typeof model['id'] === 'string' ? model['id'] as string : ''
          return (
            <ModelRow
              key={id === '' ? `model-${index}` : id}
              entry={model}
              modelId={id === '' ? `#${index + 1}` : id}
              displayName={typeof model['name'] === 'string' ? model['name'] as string : ''}
              writable={rowWritable}
              levels={levels}
              modalities={modalities}
              flavor="declared"
              applyRow={patch => applyRow(index, id, patch)}
              t={t}
            />
          )
        })}
      </div>
    </CardShell>
  )
}

/** Lazy discovery outcome of one catalog card's manage gate. */
type CatalogDiscovery =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; models: readonly DiscoveredModelView[] }
  | { status: 'error'; message: string }

/**
 * One official-catalog provider card. Models stay behind the manage gate:
 * clicking asks the configuration-time discovery seam, which answers catalog
 * routes from the installed catalog itself (no endpoint round-trip, no dead
 * baseURL fallout). Edits land as sparse `modelOverrides` leaves.
 */
function CatalogCard(props: ProviderCardProps): ReactElement {
  const { row, controller, levels, modalities, writable, t } = props
  // Manage is a pure UX gate: no write, no persisted "managed" state —
  // discovery is asked once and memoized by the controller for reopens.
  const [managed, setManaged] = useState(false)
  const [discovery, setDiscovery] = useState<CatalogDiscovery>({ status: 'idle' })
  useEffect(() => {
    if (!managed || discovery.status !== 'idle') return
    setDiscovery({ status: 'loading' })
    // No cancellation: the controller memoizes one promise per provider, and
    // on React ≥18 a late resolve on an unmounted card is a harmless no-op.
    // (A cleanup here once cancelled this very fetch when the status change
    // re-entered the effect, wedging the card on "loading" forever.)
    void controller.discoverOfficialModels(row.entry.provider).then(
      models => setDiscovery({ status: 'ready', models }),
      (error: unknown) => setDiscovery({ status: 'error', message: messageOf(error) }),
    )
  }, [managed, discovery.status, controller, row.entry.provider])
  const overridden = Object.keys(row.overrides)
    .filter(id => hasCapabilityOverride(row.overrides[id]))
  const summary = [
    discovery.status === 'ready' ? t('officialModelsCount', { count: discovery.models.length }) : '',
    overridden.length > 0 ? t('overriddenCount', { count: overridden.length }) : '',
  ].filter(part => part.length > 0).join(' · ')
  return (
    <CardShell row={row} t={t}>
      <p className="bmp-muted">{t('catalogIntro')}</p>
      {row.configured === false && <p className="bmp-muted">{t('dormantHint')}</p>}
      <div className="bmp-catalogBar">
        <span className="bmp-muted">{summary}</span>
        <button
          type="button"
          className="bmp-button"
          aria-expanded={managed}
          onClick={() => setManaged(open => !open)}
        >
          {managed ? t('collapse') : t('manageOfficial')}
        </button>
      </div>
      {managed && (
        <div className="bmp-models">
          {(discovery.status === 'idle' || discovery.status === 'loading') && (
            <p className="bmp-muted">{t('loading')}</p>
          )}
          {discovery.status === 'error' && (
            <>
              <div className="bmp-error" role="alert">{t('catalogLoadError')}: {discovery.message}</div>
              <button
                type="button"
                className="bmp-button"
                onClick={() => setDiscovery({ status: 'idle' })}
              >
                {t('retry')}
              </button>
            </>
          )}
          {discovery.status === 'ready' && discovery.models.map(model => {
            const override = row.overrides[model.id]
            // Sparse baseline = the user's override leaves: dirty means
            // "differs from the current override", never from the catalog.
            // A wire-absent name stays ABSENT on the hover text too —
            // own-key `undefined` is a third state no reader expects.
            const entry: Record<string, unknown> = {
              id: model.id,
              ...(model.name === undefined ? {} : { name: model.name }),
              ...override,
            }
            return (
              <ModelRow
                key={model.id}
                entry={entry}
                modelId={model.id}
                displayName={model.name ?? ''}
                writable={writable}
                levels={levels}
                modalities={modalities}
                flavor="catalog"
                applyRow={patch => controller.commit(ns =>
                  catalogEditOps(ns, row.entry.settingsPath, model.id, patch))}
                resetRow={hasCapabilityOverride(override)
                  ? () => controller.commit(ns => resetOverrideOps(ns, row.entry.settingsPath, model.id))
                  : undefined}
                officialContext={model.contextWindow === undefined ? undefined : formatCapacity(model.contextWindow)}
                officialMax={model.maxTokens === undefined ? undefined : formatCapacity(model.maxTokens)}
                t={t}
              />
            )
          })}
        </div>
      )}
    </CardShell>
  )
}

/**
 * The dormant official providers region: collapsed by default, expanding it
 * shows one compact row per installed catalog route not yet configured.
 * Picking a row unfolds that provider's ordinary catalog card inline — the
 * region stores nothing (the first override write materializes the profile),
 * and at most one card is open at a time.
 */
/**
 * The shared card inputs a region forwards to whichever provider is picked. */
export type CardContextProps = Omit<ProviderCardProps, 'row'>

export function DormantRegion(props: CardContextProps & {
  /** Dormant catalog rows. */
  dormant: readonly CapabilityRowView[]
}): ReactElement {
  const { dormant, ...cardProps } = props
  const { t } = props
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  // A first-write materializes the profile: the picked route leaves the
  // dormant list on the post-commit reload, and the dangling pick must not
  // keep rendering a rowless card.
  useEffect(() => {
    if (picked !== null && !dormant.some(row => row.entry.provider === picked)) setPicked(null)
  }, [dormant, picked])
  const pickedRow = picked === null ? undefined : dormant.find(row => row.entry.provider === picked)
  return (
    <div className="bmp-dormant">
      <button
        type="button"
        className="bmp-button"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        {t('manageOfficialProviders', { count: dormant.length })}
      </button>
      {open && (
        <div className="bmp-dormantList">
          {dormant.map(row => (
            <button
              key={row.entry.provider}
              type="button"
              className="bmp-dormantRow"
              aria-expanded={picked === row.entry.provider}
              onClick={() => setPicked(value => value === row.entry.provider ? null : row.entry.provider)}
            >
              <span className="bmp-cardTitle">{row.entry.displayName}</span>
              <span className="bmp-cardMeta">{row.entry.provider}</span>
              <span className="bmp-tag">{t('officialCatalog')}</span>
            </button>
          ))}
        </div>
      )}
      {open && pickedRow !== undefined && <CatalogCard {...cardProps} row={pickedRow} />}
      {open && <p className="bmp-muted">{t('adapterBoundary')}</p>}
    </div>
  )
}
