# Changelog

Notable changes to better-model-provider. Versions track the published git
tags (npm artifact when it ships); the verification matrix each release was
held to lives in `CONTRIBUTING.md`.

## [Unreleased]

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
