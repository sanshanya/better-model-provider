# Contributing

Toolchain is npm only — the lockfile is `package-lock.json`, CI runs `npm ci`, and Dependabot tracks the
`@deepseek-ai/*` declaration owners this plugin's type seam resolves into (the contract gate and `npm run typecheck`
are the arbiters) weekly. Every other dependency moves by deliberate commit. Do not mix pnpm/pnpm-lock files into this
repo. Against a RUNNING host process, adding or removing a `package.json` `exports` entry never
takes effect — Node caches the package.json/exports map per process, so an export added mid-session
keeps answering `ERR_PACKAGE_PATH_NOT_EXPORTED` until the host is restarted. Locale files under the
already-exported `locale/*.json` wildcard (added or removed), icon bytes, and the CONTENT of an
existing locale file are re-read on the spot; a page refresh is enough for those.

## Gates

```sh
npm ci
npm run lint
npm run typecheck
npm run verify:contract                      # src/ against the INSTALLED harness declarations; no test shim in the program
npm run build
npm run verify:pack                          # packs the artifact, executes the bundle, type-checks it in a bare consumer

# Opt-in full-chain lane. Needs a local DeepSeek Harness checkout with `pnpm install` + `pnpm build` run; the
# functional lane also needs a Chromium-family executable (Chrome, Chromium, or Edge). Both skip when BMP_DSH_DIR is
# unset. The lane pins its client bundles to the CHECKOUT's own version and refuses a mismatch, so name the version
# you mean and keep that assertion on:
BMP_DSH_DIR=/path/to/deepseek-harness BMP_DSH_BUNDLE_VERSION=0.1.7-rc.1 \
  npm run test:live
BMP_DSH_DIR=/path/to/deepseek-harness BMP_DSH_BUNDLE_VERSION=0.1.7-rc.1 \
BMP_CHROME_PATH="/path/to/chromium" npm run test:functional
```

`npm run typecheck` and `verify:contract` both inherit `skipLibCheck: true`, because upstream's own type barrels
reference packages they never declare, so a strict whole-graph compile is permanently red. What `verify:contract`
adds is the PROGRAM: `include: ["src"]`, so the harness declarations are read by our shipped source alone and no
test-side shim can sit inside the program — that shim is how 0.0.4 passed while its client entry named four members
0.1.7 had removed. The declaration GRAPH is gated by `verify:pack`, whose bare-consumer probe compiles the packed
artifact with no `skipLibCheck` and fails on any diagnostic inside it.

There is no hermetic/unit test step. A hand-projected fake face can be green while the real contract has moved (an
audit found 53 real contract errors behind a green 212-test suite), so the behavioural gate is the full-chain lane: the
`ci` workflow runs the static and artifact gates, and `live` boots both supported lines nightly and on
`workflow_dispatch` for each published channel (`latest`, `next`, `alpha`), hands the resolved version to the lane, and
FAILS a leg whose channel resolved while its lane skipped — rather than reporting a green placebo. A failed gate is a
failed gate.

## Non-negotiable rules

- Remote calls go through the mounted `remote.settings` / `remote.llm` services' own positional signatures and their `RemoteResult` envelope (`{ ok: true, value } | { ok: false, error: { code, message, details } }`): the service shape is the contract anchor, and a rename upstream surfaces on the consuming line. Business failures become a `HarnessRpcError` carrying the code and its details pair; `CapabilityWireCode` names the codes this page branches on and is explicitly NOT a closed world — an unknown code stays representable and renders through its message. No casts, no `as never`.
- Loads are latest-wins through a generation fence: an older response can never publish over a newer one. Only the very first load blanks the page; refreshes keep the last accepted view visible. (No abort ceremony: neither service read accepts a signal.)
- Pushed invalidations are scoped to this section's own namespace.
- Reads use an explicit layer: `namespace.value` for effective display, `namespace.user` for user-owned writes, and `namespace.base` only for diagnostics/comparison. A declared route whose `models[]` exists only in the base layer is displayed read-only rather than materialized into user settings.
- The page edits only model capabilities. Provider credentials, provider/model lifecycle, and route enablement remain owned by the official Models page.
- Each row's persistence derives from ownership, never from the route label. A user-owned `models[]` edits its entries (`declared-models`) — a hand-declared route owns its list the moment the key exists, but a catalog route owns it only when the user list is NON-EMPTY (the adapter treats `models: []` as no list, serves the installed catalog, and still allows overrides beside it); a catalog route with no effective `models[]` takes sparse `modelOverrides[id]` leaf writes (`catalog-overrides`); an inherited model list is read-only (`inherited-models`), and unclassified routes never appear. The harness refuses `modelOverrides` beside a non-empty `models` list, so the modes are exclusive by construction. Installed-but-unconfigured catalog routes join the dormant list behind **Manage official providers**: no document exists for them, and the first override write creates the profile (a sparse-override route is serviceable through catalog defaults — credentials remain the official Models page's). A catalog reset lifts the overridden leaves, the whole entry when it carried nothing else, the `modelOverrides` dict itself when the entry was the dict's last occupant — AND, when that dict was the profile's only content, the profile shell itself: the host never prunes empty parents, so a lingering `{}` would keep the route configured and ACTIVE forever, never returning to the dormant list. A PURE-INHERIT patch that would empty an override entry collapses the same way (otherwise a stranded `{}` entry passes today's validation and freezes the namespace on a future catalog upgrade).
- Each row produces a touched patch: untouched fields produce no operation, while an explicit inherit action removes the leaf. Structured leaves (dicts AND arrays) are cloned at the write seam — a staged object never becomes the stored object by reference. Declared rows write one `set` op rewriting the whole user-owned `models[]` array — addressed by model id: the render-time index is validated against the commit-time namespace and re-anchored by id on drift, and a model that vanished writes nothing rather than silently rewriting a neighbor. Catalog rows write per-leaf `set`/`unset` ops under `modelOverrides` — the catalog is never materialized, and an unset for a leaf the user never wrote is skipped rather than spending a revision. A catalog reset lifts exactly the capability leaves, or the whole entry when nothing else remains.
- Official models come from `llm.discoverModels`, the configuration-time seam that answers catalog routes from the installed catalog itself — lazily, on manage-click, so the page join stays light. It is never `llm.models` (the picker's display catalog, which carries no capacities). Official reasoning wire spellings are never fabricated: custom mapping starts with explicitly blank wires and every checked level must be spelled before it may be written.
- Mutations keep user drafts on failure: `settings/conflict` shows the localized conflict copy, every other wire failure shows its reason next to the action.
- Two fences in the golden lane are load-bearing: the `.bmp-staged` wait (without it a click races the still-open UI transaction and reads a half-written document — a 423–505 ms round trip at 0.1.7) and the generation assertion (without it a lane can pin one harness line and silently boot another, because bundle resolution is installation-anchor-first).
- `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` stay on; there is no `any` anywhere.
- Final artifact first: `verify:pack` packs the tarball, verifies every manifest export exists inside it, then installs it into an EMPTY consumer and typechecks a realistic import — a declaration-resolution problem is caught at this gate, not downstream.

## Harness compatibility anchors

The wire faces in `src/client/types.ts` are `Pick`s of the published `@deepseek-ai/dsh-api-remotes/client` contract; the peer ranges are **enumerated per published line**, because one wide range reads as unsatisfied to npm's peer rule while dsh's admission gate (`includePrerelease: true`) accepts it. Verified lines and what is *not* lane-verified: the README compatibility table.

Weekly Dependabot PRs patrol exactly the declaration owners those peers name — `dsh-api-remotes`, `dsh-client-connection`, `dsh-llm`, `dsh-settings`, `dsh-typert-protocol` — one PR at a time; a bump that breaks the contract fails CI.
