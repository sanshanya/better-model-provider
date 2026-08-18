# Changelog

Notable changes to better-model-provider. Versions track the published git
tags (npm artifact when it ships); the verification matrix each release was
held to lives in `CONTRIBUTING.md`.

## [Unreleased]

- **Contract line follows the published `0.1.0-rc.7`.** Peer and dev
  dependencies and the live-lane bundle pins moved from rc.6 to rc.7
  (typecheck is the arbiter: the wire faces this plugin consumes are
  unchanged between rc.6 and rc.7). Verified against a real rc.7 harness
  checkout: both real-harness lanes are green — the packed plugin registers
  in a freshly booted profile (integration), and a real-browser capability
  write persists into `settings.yaml` and reverts (functional).

- **Declared-only product boundary, made explicit.** The page lists declared
  routes only: catalog routes and routes the adapter cannot classify are
  filtered at the join instead of rendering a contradictory read-only card
  (the old "unknown route" copy claimed editing was disabled while the
  editors were not). The empty state now speaks declared-model semantics,
  and `CONTRIBUTING.md` no longer describes the never-shipped catalog
  `modelOverrides` write path.
- **Install docs close the distribution gap.** Both READMEs document the
  GitHub build-script catch (pnpm does not run a git dependency's `prepare`;
  allow the printed key under `allowBuilds` in the profile's
  `pnpm-workspace.yaml`) and state that a `link:` install must build first.
- **Release hygiene.** Peer contract range reduced to `^0.1.0-rc.6`
  (matching the README's own npm-ancestry note); package metadata completed
  (`repository`, `homepage`, `bugs`, `keywords`); `docs/` ships in the
  tarball so README images resolve; builds clean `lib/` first (stale
  artifact removed); the leftover one-off diagnostic step in the `live`
  workflow is gone; the coverage exemption for the host keepalive is
  disclosed.

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
