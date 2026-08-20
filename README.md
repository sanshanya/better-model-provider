# better-model-provider

Per-model capability editing for DeepSeek Harness: reasoning-effort levels (with wire spellings), input modalities, and token capacities — declarations on your own routes, sparse overrides on official-catalog routes.

**Custom models: edit declarations. Official models: edit overrides. Provider configuration remains official.**

[中文](README.zh.md)

![Editing one model row](https://raw.githubusercontent.com/sanshanya/better-model-provider/main/docs/screenshot.png)

## Why

Two per-model fields stayed YAML-only: `reasoningEfforts` and `input`. Until declared, the picker shows no effort control and image sessions refuse the model (`... does not accept image input`). This page edits them plus `contextWindow` / `maxTokens` — one row fully configures one model.

## Install

    dsh plugin --profile web add github:sanshanya/better-model-provider

GitHub installs print one pnpm `allowBuilds` key to add, then rerun `add`. A local `link:` install must `npm install && npm run build` first. Restart `dsh web`, and the Settings sidebar gains **Model capabilities**.

    dsh plugin --profile web rm better-model-provider

## Use

1. Configure the provider + API key on the official **Models** page first; keys and lifecycle never move here.
2. Expand a row: pick **Custom** under reasoning effort, check the levels (also check `off`, blank wire → `null`, if Off should exist); check `image` under input modalities for vision models; fill capacities in K/M spelling (`380K`, `1M`). Apply — the picker and image admission follow immediately.
3. Official-catalog routes: **Manage official models** — each field writes one sparse `modelOverrides` leaf; official capacities stay unless overridden; reasoning wire spellings are never guessed; **Reset to official defaults** lifts exactly what you overrode.
4. **Manage official providers (N)** lists installed catalog routes; pick one and the first override you apply materializes its profile.

Dedicated-adapter apps (built-in DeepSeek / OpenAI Codex) declare capabilities in their own adapter code and never appear here.

## Compatibility

Contract line `@deepseek-ai/dsh-api-remotes ^0.1.0-rc.7` (verified against the published harness); surfaces outside the contract degrade silently. Development gates, live lanes, and invariants: see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
