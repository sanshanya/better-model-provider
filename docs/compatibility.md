# Compatibility and evidence

Rule for this repository: **every compatibility sentence in `README.md`, `README.zh.md`, `CHANGELOG.md` and
`CONTRIBUTING.md` is a row in this file, and every row names a transcript on disk or a `file:line` in the harness
checkout.** A claim that is not in a row is not made, and a row that says "admitted" never gets read as "verified".

Harness paths are relative to a DeepSeek Harness checkout at the tag named in the row. Lane transcripts are local files
from this release's frozen-tree run; the command that produced each one is given so anybody can reproduce it, and the
nightly canary re-proves the published channels on its own.

- Repository: `better-model-provider@0.0.5`
- Frozen-tree evidence bundle: `/tmp/bmp-team/evidence/final-chain.log` (build → contract probe → coverage → pack →
  lanes on both lines → profile pins → `=== DONE ===`). Its `=== verify:pack ===` section is the **pre-fix throw**;
  the gate is green as of the probe-provisioning fix recorded in §2, with the first-hand transcript at
  `/tmp/bmp-team/evidence/g2-verifypack-firsthand.txt`.
- Checkout used for `file:line` rows: `/Users/sansm/Documents/github/deepseek-harness`, tag **`dsh-v0.1.7-rc.1`**

---

## 1. Verified end-to-end on a real harness

Command shape (identical for every row; `--coverage.enabled=false` because these are not coverage gates):

```sh
cd /path/to/better-model-provider
BMP_DSH_DIR=<checkout at dsh-v<version>> \
BMP_DSH_BUNDLE_VERSION=<version> \
BMP_LIVE_KEEP=1 TMPDIR=<a keep dir> \
  npx vitest run tests/integration.live.spec.ts --coverage.enabled=false      # integration
BMP_DSH_DIR=… BMP_DSH_BUNDLE_VERSION=… BMP_LIVE_KEEP=1 TMPDIR=… \
BMP_CHROME_PATH="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
  npx vitest run tests/functional.live.spec.ts --coverage.enabled=false      # functional
```

| Claim | Verified on | Evidence | Raw signal |
|---|---|---|---|
| The plugin mounts, and the running host advertises and serves its client module | `dsh-v0.1.7-rc.1` | `/tmp/bmp-team/evidence/final-chain.log` § *A1 integration 0.1.7-rc.1* | `live integration: dsh 0.1.7-rc.1 … graph=63 rows advertised=…better-model-provider/client.js…`; `Test Files 1 passed (1)`, `Tests 1 passed (1)` |
| A capability edit round-trips in a real browser and persists into the document that generation writes | `dsh-v0.1.7-rc.1` | same file, § *A1 functional 0.1.7-rc.1* | `live functional: dsh 0.1.7-rc.1 … settings=…/profiles/bmp-live/cordis.patch.yml`; `Tests 4 passed (4)` |
| Same two claims on the stable line | `dsh-v0.1.5-rc.3` | same file, § *A2 integration 0.1.5-rc.3* and § *A2 functional 0.1.5-rc.3* | `graph=54 rows`; `settings=…/settings.yaml`; `Tests 1 passed (1)` / `Tests 4 passed (4)` |
| The booted profile really installed the line it names | both | same file, § *profile pins* | `npm ls @deepseek-ai/dsh-base @deepseek-ai/dsh-web-app` → `@deepseek-ai/dsh-base@0.1.7-rc.1`, `@deepseek-ai/dsh-web-app@0.1.7-rc.1` |
| **Independent cross-check** (not the repo's own specs): the bytes the *running server* served are this repository's artifact, the served graph is the claimed generation, and every declared inject id is a row in that graph | `dsh-v0.1.7-rc.1` and `dsh-v0.1.5-rc.3` | `/tmp/bmp-team/evidence/g2-lane-0.1.7-rc.1.log`, `/tmp/bmp-team/evidence/g2-lane-0.1.5-rc.3.log` | `[G2] boot graph: 63 rows` / `54 rows`; `OK plugin admission: better-model-provider is an entry in the served graph`; 6/6 `OK inject row`; `OK generation marker: retired @deepseek-ai/dsh-client-runtime row absent`; `OK served bytes: 58462B served byte-identical to repo lib/client.js (sha256 5078e482…)`; `[G2] PASS` on both |

The last row is a lane written outside this repository, and it is the one that cannot be satisfied by a green unit test:
it boots the CLI from the checkout, reads the served `globalThis["__DSH_BOOT__"]` graph, resolves the
`better-model-provider` row's own resource URL with `new URL(row.url, origin)`, and compares the fetched payload with
`lib/client.js`. The payload is the artifact **plus exactly the harness's own 78-byte / 94-byte frame** — `;\n` per
entry and a `//# sourceMappingURL=…` stamp, both produced by `packages/client/modules/src/index.ts:400-405` with
`:305-319` — and the script prints that frame verbatim rather than tolerating an unexplained tail. A stale `lib/`, an
old tarball, a cached profile or a graph from the wrong generation all fail this row, which is why it exists next to
the repo's self-asserted lanes.

The four functional tests are: schema-derived reasoning/modal vocabulary; a capability write persists and its revert
lifts the leaf; a catalog override persists and reset lifts it; a dormant catalog route onboards on its first override
write and returns to dormancy when the last override lifts (`tests/functional.live.spec.ts`).

## 2. Hermetic gates on the frozen tree

| Gate | Status | Evidence |
|---|---|---|
| `npm run lint`, `npm run typecheck`, `npm run verify:contract` (default, `--lines`, `--lib`), `npm run test:coverage`, `npm run build` | green | `/tmp/bmp-team/evidence/final-chain.log` § *build* (`built lib/client.js (58462 bytes)`), § *verify-contract…* (three modes: `1 / 2 / 1 line(s) clean`), § *test:coverage* (`All files 100 % stmts / 99.46 % branch / 100 % funcs / 100 % lines`) |
| `npm run verify:pack` (+ `node scripts/verify-contract.mjs --lib`) | green | `/tmp/bmp-team/evidence/g2-verifypack-firsthand.txt` — `verify-pack: 21 upstream declaration gap(s) tolerated (none inside better-model-provider)`, `verify-pack: better-model-provider@0.0.5 tarball OK (incl. consumer-type probe)`, `swept 14 shipped declaration(s): no retired member imported`, exit 0 for both |

`verify:pack` packs the tarball and compiles it **where it lands** — tarball + typescript + the `@types/*` our shipped
declarations consume, with no `--skipLibCheck`. The 21 tolerated diagnostics are all upstream, and the reason is
structural: upstream's own type barrels reference packages they never declare
(`@deepseek-ai/dsh-api-remotes/lib/types/client/index.d.ts` → `@deepseek-ai/dsh-api-gateway/client`,
`@deepseek-ai/dsh-plugin-manager/types`; `@deepseek-ai/dsh-llm` → `@deepseek-ai/dsh-attachment`). The gate counts and
names them and fails on **any** diagnostic inside `better-model-provider`.

What the probe does *not* do is hide that graph to make itself green. It is provisioned from this repository's own
manifest ranges (`@types/react` / `@types/react-dom` read from `devDependencies`, typescript read from
`package-lock.json`), so it cannot drift from what the repo itself compiles against; restoring `--skipLibCheck` or
filtering the diagnostic would have blinded the gate to exactly the missing-declaration class it exists to catch.

The green is a checked green, because the failure it replaced is reproducible on demand: emptying the probe's
provisioning reproduces the pre-fix failure **inside our artifact** and exits 1 —
`lib/client/CapabilitiesSection.d.ts(8,35): error TS7016: Could not find a declaration file for module 'react'`
(`/tmp/bmp-team/evidence/compat-verifypack-red.txt` is that same reproduction recorded on the pre-fix tree). The fix
lives in `scripts/verify-pack.mjs:138-155` (provisioning) with the strict compile kept at `:162-177`.

Reproduction note: the first-hand run above used `npm_config_ignore_scripts=true`, so the gate's internal `npm pack`
did not re-run `prepack` → `npm run build`. That skips a redundant `lib/` write, not the packed bytes —
`lib/client.js` had already been proven byte-identical to a fresh rebuild of the current sources (58462 bytes,
`sha256 5078e482…`, `/tmp/bmp-team/evidence/g2-verify-frozen-tree.txt` § [1]) — and the run left `lib/` untouched
(same hash and mtime before and after).

## 3. The peer contract, and why the floor is enumerated per line

`package.json` declares, for `@deepseek-ai/dsh-api-remotes`, `dsh-client-connection`, `dsh-llm`, `dsh-settings` and
`dsh-typert-protocol` (the declaration owners this plugin's type seam resolves names into):

```
>=0.1.2-alpha.1 <0.2.0 || >=0.1.3-alpha.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0 || >=0.1.6-alpha.1 <0.2.0 || >=0.1.7-alpha.1 <0.2.0
```

One wide range would read differently to the two judges that matter. dsh's admission gate evaluates peers with
`semver.satisfies(runtimeVersion, range, { includePrerelease: true })`
(`packages/boot/app-boot/src/plugin-compatibility.ts:61-83`), while npm's peer resolution uses the default rule, where a
prerelease satisfies a comparator only when that comparator carries a prerelease in the **same** `major.minor.patch`
tuple. Measured on the published line list (`/tmp/bmp-team/evidence/compat-admission-matrix.txt`):

| Range shape | dsh gate verdict | npm peer verdict |
|---|---|---|
| `>=0.1.0-rc.7 <0.2.0` (0.0.4) | admits 0.1.0-rc.7 … 0.1.7-rc.1 | admits only 0.1.0-rc.x — **disagrees on 11 versions** |
| the enumerated range above | admits 0.1.2-alpha.1 … 0.1.7-rc.1; refuses 0.1.0-rc.7, 0.1.0-rc.8, 0.1.1-rc.2, 0.2.0 | **disagrees on 0 versions** |

**Admitted is not verified.** The peer range is an installation contract; the lanes in §1 are the verification. Lines
`0.1.2-alpha.1` … `0.1.6-alpha.2` are admitted by that contract but **no lane has been run on them in 0.0.5**, and they
are not claimed as verified anywhere. The nightly canary covers the published channels it can resolve
(`latest` → `0.1.5-rc.3`, `next` → `0.1.7-rc.1`, `alpha` → `0.1.7-alpha.2` at the time of writing) and fails a leg whose
channel resolved but whose lane skipped (`.github/workflows/live.yml`).

## 4. Field-by-field decision (what is ours, what is not)

Upstream 0.1.7's official Models page edits a model row's `id`, display `name`, `contextWindow`, `maxTokens` and input
types (`packages/client/ui-settings-models/src/client/ModelRow.tsx:86-108`,
`packages/client/ui-settings-models/src/client/ModelInputTypes.tsx:32-57`, documented in
`packages/client/ui-settings-models/README.md:40`). It deliberately does
**not** edit reasoning effort — same line: *"Reasoning effort is deliberately not among the editable fields"*.

| Field | Native editor on the official page? | Decision | Why (harness `file:line`) |
|---|---|---|---|
| `reasoningEfforts` (levels + wire spellings) | **No** | **KEEP** | `grep -rn "reasoningEfforts" packages/client` → **0 hits** (no authoring surface; the client only *consumes* the singular `reasoningEffort` when picking/routing: `packages/client/ui-model-selection/src/client/ModelSelect.tsx`, `packages/client/ui-model-selection/src/client/directory.ts`, `packages/client/ui-model-selection/src/client/index.ts`, recorded in `packages/client/ui-conversation/src/client/contract/records.ts`). The schema declares it host-side (`packages/llm/llm-pi-ai/src/config.ts:297`, `packages/llm/llm-pi-ai/src/config.ts:314`) and the catalog consumes it (`packages/llm/llm-pi-ai/src/catalog.ts:607`, `packages/llm/llm-pi-ai/src/catalog.ts:695`) |
| `input` (request modalities) | **Yes** — `packages/client/ui-settings-models/src/client/ModelInputTypes.tsx:32-57` | **KEEP, but not a differentiator** | The same pi-ai family is editable there; ours is the *sparse* path, not a unique capability |
| `contextWindow` | **Yes** — `packages/client/ui-settings-models/src/client/ModelRow.tsx:86-108` (`packages/client/ui-settings-models/src/client/ModelListEditor.tsx:368-378`) | **KEEP, but not a differentiator** | Same |
| `maxTokens` | **Yes** — same lines | **KEEP, but not a differentiator** | Same |
| sparse `modelOverrides` (the seam itself) | **No** | **KEEP — this is the remaining unique value** | `grep -rn "modelOverrides" packages/client` → **0 hits**; the mechanism is defined host-side (`packages/llm/llm-pi-ai/src/config.ts:303-324` shared fields, `packages/llm/llm-pi-ai/src/config.ts:331-332` `models` / `modelOverrides`, semantics `packages/llm/llm-pi-ai/src/catalog.ts:613-621`, resolution/validation `packages/llm/llm-pi-ai/src/catalog.ts:828-874`) and exposed upstream only through YAML |

One sentence, as it appears in the READMEs:

> Sparse, non-destructive per-model overrides on official-catalog routes — including reasoning-effort levels and their
> wire spellings — without replacing the catalog.

## 5. Known limitation (documented, not hidden)

When a pi-ai route is edited on the **official** page, that page writes the route's whole `models` array
(`packages/client/ui-settings-models/src/client/ModelListEditor.tsx:217-232`). The adapter then treats `models` as
replacing the served catalog and rejects `modelOverrides` beside it —
`packages/llm/llm-pi-ai/src/catalog.ts:850-852`: *"sets `modelOverrides` for `<id>` beside a `models` list; models
already replaces the served catalog, so declare the fields on its entries"*. Consequences for one route, once that has
happened:

- catalog inheritance is frozen for every model on the route (updates no longer flow into it);
- sparse overrides become **illegal** for that route, so this plugin switches to rewriting the user-owned `models`
  array (its `declared-models` write mode) instead of writing sparse leaves.

The sparse path applies while the route has **no user-owned `models[]`**; a route whose `models: []` exists (or no
`models` key at all) still takes `modelOverrides[id]` leaf writes. This is a property of the harness's own schema, not a
defect of this plugin.

## 6. The lane mechanism in 0.0.5, and what actually changed

Three things were wrong in the 0.0.4 lanes. None of them was the plugin: on `dsh-v0.1.7-rc.1` the section mounted, the
rows rendered and the writes landed — the oracles reading them were stale.

| What changed upstream | First tagged | Evidence | Effect on the lane |
|---|---|---|---|
| Web resources became document-relative (`eeb9b03465`, *feat(web): serve the shell, API and plugin resources from the document directory*) | `dsh-v0.1.7-alpha.1` | `/tmp/bmp-team/evidence/compat-upstream-tags.txt` | The integration lane's `(href\|src)="/plugins/…"` scan matched **0** URLs on a page whose combo URLs are now `plugins/??…&rev=…`; the lane reads the spliced `__DSH_BOOT__` graph instead |
| The home `settings.yaml` was retired into a one-time import (`601d6761e4`, *feat(settings): project volatile Config through profile-backed forms*) | `dsh-v0.1.7-alpha.1` | same file | The seeded document is imported and renamed `settings.yaml.imported`; the live document became `profiles/<name>/cordis.patch.yml`. The functional lane resolves the file the generation actually writes (`liveBoot().settingsDocument()`) instead of hard-coding the old path |
| Not an upstream change: a UI-settled vs file-visible race | — | `/tmp/bmp-team/evidence/rc1-race-rootcause.txt` | At 0.1.7 a `settings.mutate` round trip takes 423–505 ms (0.1.5: 10–34 ms) and the document is readable ~250 ms before the reply, so the lane's next click raced the still-open UI transaction; it now waits on the `.bmp-staged` fence |

**The bundle pins were inert, and that story must not survive.** The old lane pinned `@deepseek-ai/dsh-base` /
`@deepseek-ai/dsh-web-app` at `0.1.0-rc.7` while booting the checkout's CLI, but bundle resolution is
installation-anchor-first (`packages/boot/app-boot/src/profile.ts:617`), so the served graph was the checkout's own line:
a run whose profile pins read `0.1.0-rc.7` composed 63 rows including client packages that **do not exist at
0.1.0-rc.7** (`/tmp/bmp-team/evidence/compat-pins-inert.txt`). The defect was the absence of *proof*, not the wrong
generation: 0.0.5 pins both bundles to the checkout's own `packages/boot/app-boot/package.json` version, refuses a
mismatch (including a differing `BMP_DSH_BUNDLE_VERSION` assertion), and prints both the installed pins and the
versions the CLI's tree carries on every run.

The document-relative change is visible in the raw bytes of both lines' §1 cross-check: at `dsh-v0.1.7-rc.1` the graph
row's URL is `plugins/??better-model-provider/client.js&rev=…` and the server's source-map stamp is relative
(`//# sourceMappingURL=??better-model-provider/client.js.map&rev=…`, 78-byte frame), while at `dsh-v0.1.5-rc.3` both
carry the leading `/plugins/` (94-byte frame). Same artifact, two spellings — which is exactly why the lane reads the
URL out of the graph instead of scanning the page for an attribute shape.

**Not claimed anywhere:** that this release "fixed a mount failure". The removed
`@deepseek-ai/dsh-client-runtime` inject id was **inert**: the client module system only arrives an injected dependency
when a row with that id exists (`packages/client/modules/src/client/system.ts:267-270`), so a dangling id costs the
ordering guarantee it was meant to express and nothing else. The `connection` row was likewise redundant — the web-app
bundle mounts `@deepseek-ai/dsh-client-connection` itself
(`packages/bundle/web-app/cordis.patch.yml:197-198`), and the fiber no longer reads that service on any line this
release supports (the ≤0.1.1 `connection.api` generation was deleted in 0.0.5). `tests/manifest.client.spec.ts` states
the same derivation and holds each remaining id to a row that exists on **both** lines
(`tests/rosters/dsh-0.1.7-rc.1.json`, `tests/rosters/dsh-0.1.5-rc.3.json`, regenerated by `scripts/roster.mjs`).

## 7. Every version string in the shipped docs

`grep -n "0\.1\." README.md README.zh.md CONTRIBUTING.md CHANGELOG.md` prints 21 hit lines, and every one of them is a
row below (the self-check in §8 asserts each cited path exists and each cited line fits its file; the counts are
re-checked whenever the shipped docs change, because a doc edit shifts every line after it).

| Version string | Where it is used | Status | Evidence |
|---|---|---|---|
| `0.1.7-rc.1` | README.md:41, README.zh.md:41, CONTRIBUTING.md:22/:24/:60, CHANGELOG.md:10, :100 | **lane-verified** | §1 (`/tmp/bmp-team/evidence/final-chain.log` § *A1 integration* / § *A1 functional*) |
| `0.1.5-rc.3` | README.md:41, README.zh.md:41, CONTRIBUTING.md:60, CHANGELOG.md:11, :100 | **lane-verified** | §1 (same log, § *A2 integration* / § *A2 functional*) |
| `0.1.7` (prose, "the dsh 0.1.7 line") | CHANGELOG.md:9, :17, :26 | shorthand for the verified `0.1.7-rc.1` line | §1 |
| `0.1.5` (prose, "10–34 ms at 0.1.5") | CHANGELOG.md:26 | shorthand for the verified `0.1.5-rc.3` line | §1; §6 (race timings) |
| `0.1.2-alpha.1` | CHANGELOG.md:50 (the 0.0.5 peer-floor record), :89, :108, :139 (0.0.4/0.0.3 history) | peer floor **admitted, not lane-verified**; the three history hits are not current claims | §3 (`/tmp/bmp-team/evidence/compat-admission-matrix.txt`); `package.json` |
| `0.1.2-alpha.2` | CHANGELOG.md:79 (the 0.0.4 record) | **historical record**, closed by the superseded note at CHANGELOG.md:98-104 | CHANGELOG.md:77-104 |
| `0.1.0-rc.7` | CHANGELOG.md:34 (the 0.0.4 lane pins), :103 (superseded note), :216 (0.0.2 contract line) | historically shipped, **refused by the 0.0.5 peer floor on both rule sets** | §3; §6; `/tmp/bmp-team/evidence/compat-pins-inert.txt` |
| `0.1.7-alpha.1` | CHANGELOG.md:20 (first tag carrying both upstream changes) | upstream tag, not a supported-surface claim | `/tmp/bmp-team/evidence/compat-upstream-tags.txt` |
| `0.1.1` ("the ≤0.1.1 surface") | CHANGELOG.md:47 | the deleted legacy generation | §6 (deleted; absent on both verified lines) |

The peer floor is deliberately not respelled in `CONTRIBUTING.md` — that file points at §3 and at `package.json`, so
the range has exactly two shipped copies (the manifest and the 0.0.5 bullet at CHANGELOG.md:50). The enumerated terms
beyond the floor — `0.1.3-alpha.1`, `0.1.5-alpha.1`, `0.1.6-alpha.1` — appear only in this file (§3) and in
`package.json`; the grep above reads neither, and §3 carries their measured verdicts.

## 8. Regenerating and self-checking this evidence

The two checks that hold this file honest (`acceptance`: token coverage + path existence):

```sh
# 1) every 0.1.x string in the shipped docs must land on a §7 row
grep -n "0\.1\." README.md README.zh.md CONTRIBUTING.md CHANGELOG.md
python3 /tmp/bmp-team/evidence/pkg5-selfcheck.py
# 1b) and §7's line numbers must still point at those very lines (bidirectional: no unmapped hit, no stale citation)
python3 /tmp/bmp-team/evidence/pkg7-version-citation-check.py

# 2) the lanes themselves (serialized: they write the repo's lib/ and install a throwaway profile)
BMP_DSH_DIR=/tmp/dsh-0.1.7-rc.1 BMP_DSH_BUNDLE_VERSION=0.1.7-rc.1 BMP_LIVE_KEEP=1 TMPDIR=/tmp/lane-a1 \
  npx vitest run tests/integration.live.spec.ts --coverage.enabled=false
# … and tests/functional.live.spec.ts with BMP_CHROME_PATH set; same for /tmp/dsh-0.1.5-rc.3

# 2b) the independent cross-check of §1's last row. It is its own lane: it runs `npm run build` + `npm pack`, so it is
#     serialized like every other writer of lib/. `--expect` makes the generation assertion explicit.
node /tmp/bmp-team/gate2-lane.mjs --dsh /tmp/dsh-0.1.7-rc.1 --expect 0.1.7-rc.1 --keep /tmp/bmp-team/lanes/g2-rc1
node /tmp/bmp-team/gate2-lane.mjs --dsh /tmp/dsh-0.1.5-rc.3 --expect 0.1.5-rc.3 --keep /tmp/bmp-team/lanes/g2-rc2
# each run keeps its raw outputs (boot-graph.json, page.html, served-client.js) in its own work dir under --keep

# 3) peer-range verdicts
node /tmp/bmp-team/evidence/admission-matrix.mjs

# 3b) the artifact gate. Plain `npm run verify:pack` also works and runs `prepack` → `npm run build` first;
#     `npm_config_ignore_scripts=true` skips that rebuild when lib/ is already known current.
npm_config_ignore_scripts=true npm run verify:pack     # exit 0, 21 upstream gaps tolerated
node scripts/verify-contract.mjs --lib                # 14 shipped declarations swept, exit 0

# 4) which tag first carried each upstream change
git -C /path/to/deepseek-harness tag --contains eeb9b03465 | sort -V | head -1
git -C /path/to/deepseek-harness tag --contains 601d6761e4 | sort -V | head -1

# 5) the client rosters each inject id is held to
node scripts/roster.mjs next --meta tests/rosters/dsh-0.1.7-rc.1.meta.json > tests/rosters/dsh-0.1.7-rc.1.json
node scripts/roster.mjs latest --meta tests/rosters/dsh-0.1.5-rc.3.meta.json > tests/rosters/dsh-0.1.5-rc.3.json
```