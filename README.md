# better-model-provider

Sparse, non-destructive per-model overrides on official-catalog routes — including reasoning-effort levels and their wire spellings — without replacing the catalog.

**Custom models: edit declarations. Official models: edit overrides. Provider configuration remains official.**

[中文](README.zh.md)

![Editing one model row](https://raw.githubusercontent.com/sanshanya/better-model-provider/main/docs/screenshot.png)

## Why

The official Models page edits a model's input types and token capacities, but it does so by rewriting that route's whole `models` array: one field touched, and every other model on the route stops following the catalog — and sparse `modelOverrides` becomes illegal there. It also has no control for per-model reasoning effort.

This page is the other seam. On an official-catalog route it writes only the difference for the model you touched — including `reasoningEfforts` levels and their wire spellings — and leaves the rest of the catalog following upstream. On your own declared routes it edits the declarations directly.

## Install

    dsh plugin --profile web add github:sanshanya/better-model-provider#master

CI rebuilds and republishes ready-built artifacts to the `master` branch on every green main push, so this path never builds locally. Installing the default branch (`github:sanshanya/better-model-provider`) builds from source and prints one pnpm `allowBuilds` key to add, then rerun `add`; a local `link:` install must `npm install && npm run build` first. Restart `dsh web`, and the Settings sidebar gains **Model capabilities**.

    dsh plugin --profile web rm better-model-provider

![The plugin card on the Plugins page](https://raw.githubusercontent.com/sanshanya/better-model-provider/main/docs/plugins-page.png)

## Use

1. Configure the provider and API key on the official **Models** page first — keys and route lifecycle are always managed there; this page does not repeat them.
2. Expand a model row and edit its capabilities:
   - **Reasoning effort**: pick **Custom**, check the levels you need; to offer "off" too, check `off` (its wire value may stay blank).
   - **Vision models**: check `image` under input modalities — otherwise sending an image to this model gets refused.
   - **Capacities**: K/M spelling reads best (`380K`, `1M`). Tap Apply and the change takes effect at once.
3. Official-catalog routes: tap **Manage official models** and edit. Every change here stores only the difference from the official default — everything else keeps following catalog updates; **Reset to official defaults** undoes all of one model's edits at once.
4. **Manage official providers (N)** unfolds installed-but-unconfigured routes: pick one, apply the first change, and the route comes into being (its API key still goes on the official page).

The official Models page can also edit input types and capacities — but only by replacing a route's whole model list, which stops that route following the catalog and rules out overrides. Use this page when you want one model changed and the other thirty-seven still following it. Once a route's list *has* been replaced on the official page, this page edits that list like any declared route.

Dedicated-adapter apps (built-in DeepSeek / OpenAI Codex) declare their capabilities on their own settings pages and never appear here.

## Compatibility

| Harness line | Status |
|---|---|
| `dsh 0.1.7-alpha.2` (npm `alpha`) | verified end-to-end |
| `dsh 0.1.7-rc.1` (npm `next`) | verified end-to-end |
| `dsh 0.1.5-rc.3` (npm `latest`) | verified end-to-end |
| `0.1.2-alpha.1` … `0.1.6-alpha.2` | **not verified** — admitted by the peer ranges, no lane has run on them |
| `0.1.0-rc.7` … `0.1.1-rc.2` | refused: no `connection.api` generation here any more |

Verified means both lanes on a real harness: integration boots a checkout and serves the plugin's client module, functional drives a real browser through a capability write and its revert. They are opt-in — `BMP_DSH_DIR=/path/to/deepseek-harness npm run test:live` (see `CONTRIBUTING.md` for the functional lane) — and skip without it.

The peer ranges are **enumerated per published line** (`>=0.1.2-alpha.1 <0.2.0 || >=0.1.3-alpha.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0 || >=0.1.6-alpha.1 <0.2.0 || >=0.1.7-alpha.1 <0.2.0`) rather than one wide `>=0.1.0-rc.7` range, because dsh's admission gate evaluates prereleases with `includePrerelease: true` while npm's peer rule does not: a single wide range reads as unsatisfied to npm on versions dsh accepts. The nightly canary re-proves the `latest`, `next` and `alpha` channels, and a leg whose channel resolved but whose lane skipped fails the run instead of passing quietly; when a leg turns green again it closes that channel's accumulated red-tracking issues itself.

Field overlap: this page edits per-model `reasoningEfforts` (levels and their wire spellings) and sparse `modelOverrides` — the official Models page has no control for either. It also edits `input`, `contextWindow` and `maxTokens`, which the official page edits natively, so those are a convenience here rather than a unique capability. Recovery: if the official page rewrote a route's whole model list while overrides saved here linger beside it, write validation rejects the route — the card offers **Remove leftover overrides**, one explicit click, never automatic.

## License

MIT
