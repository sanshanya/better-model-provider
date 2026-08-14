# Changelog

Notable changes to better-model-provider. Versions track the published npm
artifact; the verification matrix each release was held to lives in
`CONTRIBUTING.md`.

## [0.0.1] - 2026-08-15

First public form. Per-model declaration, on your declared routes, of:

- **reasoning-effort levels with wire spellings** — a collapsed multi-select
  picker (click-only open; inline wire edits on checked rows), seeded with
  `medium` + `max`;
- **request modalities** (`text` / `image`);
- **token capacities** (`contextWindow` / `maxTokens`), in the official
  Models page's K/M vocabulary, validated before any write.

Writes are layer-safe `settings.mutate` path ops (CAS-fenced, touched-fields
only; a rejected write keeps your draft). Dual locale (en/zh), dark-theme-safe
tokens, hermetic + real-harness gates, published-artifact consumer probe.
