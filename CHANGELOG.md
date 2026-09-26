# Changelog

Notable changes to better-model-provider. Versions track the published git
tags (npm artifact when it ships); what each release was verified against is the
README compatibility table.

## [0.0.6] - 2026-09-24

Subtraction release. Behaviour is unchanged — the sole full-chain gate is the
golden lane, green on `dsh-v0.1.7-rc.1` and `dsh-v0.1.5-rc.3` — while 18 files
are gone and 5,968 lines were deleted (`git show --shortstat` on this release's
commit: −5,968; the insertion side is dominated by the documentation that
replaced the deleted tooling, so it is not cited as a fixed number).

- Deleted the call adapter (`wire.ts` 292 → 136) and the contract mirror
  (`types.ts` 226 → 151): the page calls the mounted services' own signatures, so
  one wire vocabulary replaces two. `store.ts` lost its AbortController machinery
  (neither read accepts a signal, so it could never cancel anything).
- The test surface is now only the two full-chain golden lanes. Eight hermetic
  specs, `tests/helpers.ts` and `tests/manifest.client.spec.ts` are gone
  (3,381 lines under `tests/`), plus the roster generator and its snapshots
  (`scripts/roster.mjs`, 222): they asserted against hand-projected fake faces
  and were green while the same source had 53 real contract errors. The
  inject-row truth they guarded now comes from the served boot graph inside the
  integration lane.
- `verify-contract` is a 9-line `tsconfig.contract.json` overlay (was a 389-line
  probe); `verify-pack` keeps its strict packed-artifact probe.
- `@deepseek-ai/schemastery` pinned to `3.18.1`: the incidental `3.18.4`
  re-resolution added 1,615 bytes — 33% of the artifact — and no one chose it.
  The pin rides an npm `overrides` entry: the type-owner devDeps this package
  needs peer `~3.18.4`, so a plain direct pin makes `npm ci` fail on ERESOLVE.
- Artifact 55,689 bytes (0.0.4: 56,642; 0.0.5: 58,462). `src/` 2,681 lines
  (0.0.4: 2,813). Tracked files 39 (0.0.4: 47). Verification tooling 122 lines
  (was 810); all of `scripts/` 235 (was 932) — 2 over the 120 this release
  aimed for, stated rather than hidden.

## [0.0.5] - 2026-09-24

- **Re-aimed at dsh 0.1.7, still verified on 0.1.5.** Both real-harness lanes
  pass on `dsh-v0.1.7-rc.1` (npm `next`) and `dsh-v0.1.5-rc.3` (npm `latest`):
  integration serves the plugin's client module, functional drives a real browser
  through all four workflows (schema-derived vocabulary, capability write +
  revert, catalog override + reset, dormant-route onboarding and closure).

- **The red lanes were stale oracles, not a broken plugin.** Plugin resources
  became document-relative and combo-batched (`eeb9b03465`, first tagged
  `dsh-v0.1.7-alpha.1`), so the integration lane reads the served `__DSH_BOOT__`
  graph instead of an attribute shape that no longer exists; home
  `settings.yaml` became a one-time import writing
  `profiles/<name>/cordis.patch.yml` (`601d6761e4`), so the functional lane
  resolves the document the generation actually writes; and a `settings.mutate`
  round trip taking 423–505 ms at 0.1.7 (10–34 ms at 0.1.5) is awaited on the
  staged-edit fence.

- **The lane can no longer lie about its generation** — both bundles are pinned
  to the checkout's own `packages/boot/app-boot/package.json` version and a
  mismatch is refused; the old `0.1.0-rc.7` pins were inert, since
  installation-first resolution had been serving the checkout's line all along.
  **Manifest honesty:** the six `dsh.client.inject` ids are held to rows of that
  served graph. The removed `@deepseek-ai/dsh-client-runtime` id was **inert**
  (an unknown inject id is skipped), so this fixed a declaration, not a mount
  failure. The ≤0.1.1 `connection.api` surface is gone, and the peer ranges
  enumerate the published lines from `>=0.1.2-alpha.1` because one wide range
  reads as unsatisfied to npm's peer rule while dsh's admission gate accepts it.

- **Gates:** `verify:contract` compiles `src/` — and only `src/`, so no test-side
  shim can hide in the program — against the lockfile-pinned declarations; the
  audit found 53 real contract errors the old `npm run typecheck` could not see.
  It inherits `skipLibCheck: true` (a strict pass is permanently red on upstream
  barrels that import packages they never declare), so the declaration GRAPH is
  gated by `verify:pack`, whose bare-consumer probe compiles the packed artifact
  with no `skipLibCheck`. The canary covers `latest`, `next` and `alpha` and
  FAILS a leg whose channel resolved while its lane skipped.

## [0.0.4] - 2026-08-31

- **dsh 0.1.2-alpha.2 support.** The alpha folded owner failures into a
  shared `RemoteError` class and rebadged the hyphenated wire codes into
  slash namespaces — `settings-conflict` → `settings/conflict`,
  `settings-rejected` → `settings/rejected`, `model-discovery-failed` →
  `llm/model-discovery-rejected` — with every details payload unchanged.
  The adapter now folds the rename back at the failure arm, so the CAS
  conflict keeps its localized, actionable message; the copy is fieldwise
  because the alpha's real `RemoteError` instance carries `message` as an
  Error-inherited non-enumerable a spread would silently drop. All four
  face methods are untouched; both live lanes pass against the alpha.2
  checkout (and 0.1.2-alpha.1 and the published rc line).

- **The CI canary is now a two-channel radar.** The weekly live lane
  becomes a daily matrix over both published harness channels (rc and
  alpha), each resolved from its npm dist-tag to the matching
  `dsh-v<version>` git tag, so an upstream publish is tested against us
  on the next run — and a red channel opens ONE tracking issue instead of
  waiting to be noticed by hand.

> **Superseded by 0.0.5 — read the 0.0.3/0.0.4 entries as history, not as current evidence.** The dual-generation
> claims described above (the `connection.api` fallback, the hyphenated wire-code fold) describe a surface no supported
> line still has: it is absent at both `0.1.5-rc.3` and `0.1.7-rc.1`, and 0.0.5 deleted that code. Those releases also
> read their lane results through oracles later found stale — the integration lane matched a bundle-URL attribute shape
> that stopped existing, and the functional lane asserted a settings document path that was retired — and their bundle
> pins named `0.1.0-rc.7` without asserting which generation the boot actually served. The 0.0.5 entry above names
> the mechanism. Their "both live lanes pass" is a record of what those releases believed, not evidence for this one.

## [0.0.3] - 2026-08-29

- **dsh 0.1.2-alpha.1 (source master) support, without dropping the npm line.**
  master removed the `connection.api` bundle wholesale: the settings/llm
  remotes now live as traced `remote.<ns>` Cordis services generated from
  `TypertRemoteService`, and every call we make moved with them —
  `settings.describe()` takes no payload, `settings.mutate(ns, ops,
  expectedRevision)` goes positional, `llm.providers` was renamed
  `listConfigurableProviders`, `llm.discoverModels(settingsNs, request,
  signal)` hoists the namespace, and the envelope slims to
  `{ok, value} | {ok, error}`. The new `src/client/wire.ts` probes the new
  services first, adapts their shapes back to the legacy face, and falls
  back to `connection.api` unchanged on the published rc line — page logic
  speaks one face either way.

- **Mounting is race-proof and never throws.** master mounts its Remote
  namespaces sequentially (settings before llm), so a synchronous apply
  meets the pair half-born — registration instead defers onto cordis
  `internal/service` arrivals until the face genuinely completes. One
  resolution path only, and it names the namespace actually awaited in
  either mount order; a throwing section mount is contained (logged
  once, the exactly-once latch holds, the listener unsubscribes) and can
  never escape `apply()` into cordis's unguarded dispatch or brick the
  web shell.

- **Live lanes follow the web login gate and combo bundles.** master
  prints a tokenized `dsh web` URL and gates page, bundles, and RPC on a
  303 cookie exchange: the lanes capture the full URL, perform the
  exchange, and carry the session cookie. The pre-auth line degrades to
  plain traffic on the same code path, and the integration lane follows
  the page's advertised rev-keyed combo URLs.

- Verified: hermetic 213/218 (wire.ts 100% lines/branches/functions/
  statements), and both live lanes against the real 0.1.2-alpha.1 master
  checkout — schema-derived vocabulary, CAS write/revert round-trips,
  catalog overrides, dormant-route onboarding; served bundle 56,510 bytes.

## [0.0.2] - 2026-08-24

- **Zero-build distribution.** CI publishes ready-built artifacts to the
  `master` branch on every green main push: `dsh plugin --profile web add
  github:sanshanya/better-model-provider#master` never runs a local build,
  sidestepping the pnpm `allowBuilds` catch described for source installs.
  The CI bundle matches a local `npm run build` byte-for-byte on the verified
  commit.

- **Promise shape corrected.** `@deepseek-ai/schemastery` is a build-time
  asset only (esbuild bundles it into the client half; the runtime never
  requires it): moved to `devDependencies` instead of `peerDependencies`.

- **Boundary copy tracks rc.8's own settings pages.** The dedicated-adapter
  note now names where those families genuinely declare capability (their
  own settings pages — llm-deepseek's per-model `inputModalities` landed in
  rc.8), since "in their adapter code" read stale the moment rc.8 shipped
  configuration for it.

- **Official catalog providers are now manageable (sparse capability
  overrides).** A configured catalog route shows an "official catalog"
  card; **Manage official models** lazily asks `llm.discoverModels` — the
  configuration-time seam that answers catalog routes from the installed
  catalog itself, endpoint round-trip free and dead-baseURL proof — and
  renders the official models with their official capacity baselines. Edits
  write sparse `modelOverrides[id]` leaves; untouched fields keep following
  catalog updates. Reasoning overrides start with explicitly blank wires
  (the official spelling is never fabricated), and **Reset to official
  defaults** lifts exactly the overridden leaves (entry when it carried
  nothing else, the whole dict when it was the last occupant). Ownership,
  not the route label, decides the write mode: a catalog route whose
  `models[]` the user owns edits that list like any declared route and is
  tagged **official · user-listed**; the adapter treats an empty user
  `models[]` as no list, so that route still overlays the catalog.

- **Installed-but-unconfigured catalog providers onboard from the page.**
  The directory already carries every built-in provider; they now wait as
  compact rows behind a **Manage official providers** region — picking one
  unfolds the ordinary catalog card inline, and the first override write
  materializes its profile. No bootstrap document, no keys (still the
  official Models page's); and the lifecycle closes: a reset of the last
  override on an onboarding-minted profile lifts the shell too, returning
  the route to the dormant list instead of leaving an active `{}` ghost.
  The on-page note states the boundary in owning-namespace terms: routes
  under dedicated namespaces (llm-deepseek / llm-openai-codex) declare
  capabilities in their adapters and never appear — while a pi-ai catalog
  route of the same brand name is a different route and does appear.

- **Correctness repairs inside the write and render paths.** Declared-row
  writes re-anchor by model id when the render-time index has drifted
  (previously a wrong-model silent write); pure-inherit catalog patches
  collapse the emptied override entry like resets do (a stranded `{}` entry
  passed today's validation only to freeze the namespace on a future
  catalog upgrade); structured leaves are cloned at the write seam; the
  section no longer re-renders with a changed hook count on write-mode
  flips, and catalog discovery memoization invalidates with each load
  generation.

- **Module layout.** `CapabilitiesSection.tsx` (899 LOC) split into
  `editors.tsx` / `rows.tsx` / `cards.tsx` behind a thin section; the
  four-field capability vocabulary and the capacity-field/管理-card
  helpers now have one source each; test suites consolidated onto
  `writeModeOf` tables and shared mount/schema helpers (−3 tests, −300+
  assertion lines).

- **Artifact economics + gates.** The client bundle ships without its
  sourcemap (the map outweighed the bundle 4×) and `docs/` no longer rides
  the tarball (the README links the raw URL): packed artifact ≈ −76%.
  `verify:pack` now *executes* the bundle under a stubbed module loader and
  asserts the `name`/`inject`/`apply` triple in addition to the consumer
  type probe; `prepare` became `prepack` (install no longer builds); the
  probe typechecks with the repo-lockfile typescript.

- **Contract line follows the published `0.1.0-rc.7`** (npm published
  2026-08-17; ancestry rc.2 → rc.3 → rc.6 → rc.7, no rc.4/5). Peer and dev
  dependencies and the live-lane bundle pins moved from rc.6; typecheck is
  the arbiter (the wire faces are unchanged). Verified against a real rc.7
  harness: the packed plugin registers in a fresh profile (integration),
  and the real-browser lane walks declared write + revert, catalog
  override + reset, and dormant-route onboarding into `settings.yaml`.

- **Install + release hygiene.** Both READMEs document the GitHub
  build-script catch (pnpm does not run a git dependency's `prepare`;
  allow the printed key under `allowBuilds` in the profile's
  `pnpm-workspace.yaml`) and state that a `link:` install must build
  first. Package metadata completed (`repository`, `homepage`, `bugs`,
  `keywords`); `build` cleans `lib/` first; the coverage exemption for the
  host keepalive is disclosed.

## [0.0.1] - 2026-08-15

First public form. The repository history was deliberately squashed for
this rebirth: everything before this tag is a finished conversation, not
lineage.

Per-model declaration, on your declared routes, of:

- **reasoning-effort levels with wire spellings** — a collapsed multi-select
  picker (click-only open; inline wire edits on checked rows), seeded with
  `medium` + `max`;
- **request modalities** (`text` / `image`);
- **token capacities** (`contextWindow` / `maxTokens`), in the official
  Models page's K/M vocabulary, validated before any write.

Writes are layer-safe `settings.mutate` path ops (CAS-fenced, touched-fields
only; a rejected write keeps your draft). Dual locale (en/zh), dark-theme-safe
tokens, hermetic + real-harness gates, published-artifact consumer probe.
