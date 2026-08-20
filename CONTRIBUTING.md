# Contributing

Toolchain here is npm only — the lockfile is `package-lock.json`, CI runs `npm ci`, and Dependabot tracks only the `@deepseek-ai/*` contract family weekly (typecheck is the arbiter); every other dependency moves by deliberate commit. Do not mix pnpm/pnpm-lock files into this repo.

Functionality merges only with every gate green, in this order:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
npm run verify:pack

# Opt-in, real-harness gates (need a local DeepSeek Harness checkout with
# `pnpm install` + `pnpm build` run; the functional lane also needs a
# Chromium-family executable — Chrome, Chromium, or Edge all work):
BMP_DSH_DIR=/path/to/deepseek-harness npm run test:live
BMP_DSH_DIR=/path/to/deepseek-harness \
BMP_CHROME_PATH="/path/to/chromium" npm run test:functional
```

The `ci` workflow runs the hermetic gates on every push and PR. The `live`
workflow runs both real-harness lanes nightly and on `workflow_dispatch`,
bootstrapping the harness checkout with the same commands above. A failed
gate is a failed gate.

## Non-negotiable rules

- The served Remote envelope (`{ rpcId, result: { ok, value | error } }`) is the only contract anchor: every business failure flows through `unwrap()` as a `HarnessRpcError`, carrying the wire's closed code union and its details pair.
- Loads are latest-wins: every new read aborts the previous read when the transport supports it, and a generation fence prevents an older response from publishing. Only the very first load blanks the page; refreshes keep the last accepted view visible.
- Pushed invalidations are scoped to this section's own namespace.
- Reads use an explicit layer: `namespace.value` for effective display, `namespace.user` for user-owned writes, and `namespace.base` only for diagnostics/comparison. A declared route whose `models[]` exists only in the base layer is displayed read-only rather than materialized into user settings.
- The page edits only model capabilities. Provider credentials, provider/model lifecycle, and route enablement remain owned by the official Models page.
- Each row's persistence derives from ownership, never from the route label. A user-owned `models[]` edits its entries (`declared-models`) — a hand-declared route owns its list the moment the key exists, but a catalog route owns it only when the user list is NON-EMPTY (the adapter treats `models: []` as no list, serves the installed catalog, and still allows overrides beside it); a catalog route with no effective `models[]` takes sparse `modelOverrides[id]` leaf writes (`catalog-overrides`); an inherited model list is read-only (`inherited-models`), and unclassified routes never appear. The harness refuses `modelOverrides` beside a non-empty `models` list, so the modes are exclusive by construction. Installed-but-unconfigured catalog routes join the dormant list behind **Manage official providers**: no document exists for them, and the first override write creates the profile (a sparse-override route is serviceable through catalog defaults — credentials remain the official Models page's). A catalog reset lifts the overridden leaves, the whole entry when it carried nothing else, the `modelOverrides` dict itself when the entry was the dict's last occupant — AND, when that dict was the profile's only content, the profile shell itself: the host never prunes empty parents, so a lingering `{}` would keep the route configured and ACTIVE forever, never returning to the dormant list. A PURE-INHERIT patch that would empty an override entry collapses the same way (otherwise a stranded `{}` entry passes today's validation and freezes the namespace on a future catalog upgrade).
- Each row produces a touched patch: untouched fields produce no operation, while an explicit inherit action removes the leaf. Structured leaves (dicts AND arrays) are cloned at the write seam — a staged object never becomes the stored object by reference. Declared rows write one `set` op rewriting the whole user-owned `models[]` array — addressed by model id: the render-time index is validated against the commit-time namespace and re-anchored by id on drift, and a model that vanished writes nothing rather than silently rewriting a neighbor. Catalog rows write per-leaf `set`/`unset` ops under `modelOverrides` — the catalog is never materialized, and an unset for a leaf the user never wrote is skipped rather than spending a revision. A catalog reset lifts exactly the capability leaves, or the whole entry when nothing else remains.
- Official models come from `llm.discoverModels`, the configuration-time seam that answers catalog routes from the installed catalog itself — lazily, on manage-click, so the page join stays light. It is never `llm.models` (the picker's display catalog, which carries no capacities). Official reasoning wire spellings are never fabricated: custom mapping starts with explicitly blank wires and every checked level must be spelled before it may be written.
- Mutations keep user drafts on failure: `settings-conflict` shows the localized conflict copy, every other wire failure shows its reason next to the action.
- The tests must not speak a protocol the harness does not serve: the scripted face and every stub override assert the payload is exactly `{}`, and envelope failures are real `RpcError` union members — no casts, no `as never`.
- `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` stay on; there is no `any` anywhere.
- Final artifact first: `verify:pack` packs the tarball, verifies every manifest export exists inside it, then installs it into an EMPTY consumer and typechecks a realistic import — a declaration-resolution problem is caught at this gate, not downstream.

## Coverage policy

v8 per-file 100% for lines / functions / statements and 95% for branches, enforced by `vitest.config.ts`; the one per-file exemption is the host half `src/index.ts`, a documented no-op keepalive. Guards exist only where UI or code can genuinely reach them; never reshape production code to satisfy coverage, and never the reverse (a guard that is unreachable gets removed, not ignored). The branch slack is earned, not spent in advance: a branch-only test whose scenario cannot plausibly occur (corrupted stored documents, impossible key events) is deleted, not kept for the number.

## Harness compatibility anchors

The wire faces in `src/client/types.ts` are `Pick`s of the published `@deepseek-ai/dsh-api-remotes/client` contract (peerDependency `^0.1.0-rc.7`, devDependency for local development). An upstream drift shows up as a typecheck failure in `npm ci` in any new env, and weekly Dependabot PRs fail CI when the bump breaks the contract.
