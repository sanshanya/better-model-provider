# better-model-provider

Per-model capability editing for DeepSeek Harness: reasoning-effort levels (with wire spellings), input modalities, and token capacities — declarations on your own routes, sparse overrides on official-catalog routes.

**Custom models: edit declarations. Official models: edit overrides. Provider configuration remains official.**

[中文](README.zh.md)

![Editing one model row](https://raw.githubusercontent.com/sanshanya/better-model-provider/main/docs/screenshot.png)

## Why

Two per-model fields stayed YAML-only: `reasoningEfforts` and `input`. Until declared, the picker shows no effort control and image sessions refuse the model (`... does not accept image input`). This page edits them plus `contextWindow` / `maxTokens` — one row fully configures one model.

## Install

    dsh plugin --profile web add github:sanshanya/better-model-provider#master

CI rebuilds and republishes ready-built artifacts to the `master` branch on every green main push, so this path never builds locally. Installing the default branch (`github:sanshanya/better-model-provider`) builds from source and prints one pnpm `allowBuilds` key to add, then rerun `add`; a local `link:` install must `npm install && npm run build` first. Restart `dsh web`, and the Settings sidebar gains **Model capabilities**.

    dsh plugin --profile web rm better-model-provider

## Use

1. Configure the provider and API key on the official **Models** page first — keys and route lifecycle are always managed there; this page does not repeat them.
2. Expand a model row and edit its capabilities:
   - **Reasoning effort**: pick **Custom**, check the levels you need; to offer "off" too, check `off` (its wire value may stay blank).
   - **Vision models**: check `image` under input modalities — otherwise sending an image to this model gets refused.
   - **Capacities**: K/M spelling reads best (`380K`, `1M`). Tap Apply and the change takes effect at once.
3. Official-catalog routes: tap **Manage official models** and edit. Every change here stores only the difference from the official default — everything else keeps following catalog updates; **Reset to official defaults** undoes all of one model's edits at once.
4. **Manage official providers (N)** unfolds installed-but-unconfigured routes: pick one, apply the first change, and the route comes into being (its API key still goes on the official page).

Dedicated-adapter apps (built-in DeepSeek / OpenAI Codex) declare their capabilities on their own settings pages and never appear here.

## Compatibility

We declare compatibility with the whole **dsh 0.1.x line**: contract `@deepseek-ai/dsh-api-remotes >=0.1.0-rc.7 <0.2.0`, real-harness lanes verified on rc.7, rc.8, 0.1.1-rc.2, and 0.1.2-alpha.1/alpha.2 — a daily CI canary re-proves both published channels (rc and alpha) against their current npm dist-tags. Surfaces outside the contract degrade silently. Development gates, live lanes, and invariants: see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
