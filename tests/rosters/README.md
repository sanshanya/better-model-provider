# tests/rosters — client rosters of the harness lines we claim

Each `dsh-<version>.json` is the exact stdout of the generator, byte-for-byte,
and a `dsh-<version>.meta.json` provenance header sits beside it, written by the
same invocation:

```bash
node scripts/roster.mjs next   --meta tests/rosters/dsh-0.1.7-rc.1.meta.json > tests/rosters/dsh-0.1.7-rc.1.json
node scripts/roster.mjs latest --meta tests/rosters/dsh-0.1.5-rc.3.meta.json > tests/rosters/dsh-0.1.5-rc.3.json
```

Channels are **resolved against npm at snapshot time** (`next` → `0.1.7-rc.1`,
`latest` → `0.1.5-rc.3` today), and the header records the dist-tag, the resolved
version, the resolution timestamp, the row count and the exact command. That is
what makes a stale snapshot visible instead of plausible: once `next` moves, the
header still names the old version and the filename no longer matches what the
tag resolves to. `node scripts/roster.mjs <version>` (e.g. `0.1.7-rc.1`) is
accepted too and records `distTag: null`.

A roster is every package in the published `@deepseek-ai/dsh-base` +
`@deepseek-ai/dsh-web-app` **dependency closure** at that version whose manifest
declares `dsh.client.platform === "web"`, sorted by id. Those are precisely the
ids a plugin's `dsh.client.inject` may name on that line: the host composes one
client row per declaring package, and an id naming nothing is silently ignored
(`packages/client/modules/src/client/system.ts` skips unknown inject names), so
a dangling row costs a real ordering guarantee and never fails loudly.

## Regenerate when a line moves

The closure is resolved from the published packages, so a snapshot is only as
stable as the registry at generation time. Prerelease lines can receive new
builds: regenerate, `diff`, and treat a changed roster as a signal.

```bash
node scripts/roster.mjs next | diff - tests/rosters/dsh-0.1.7-rc.1.json   # empty = current
```

## Two things the generator deliberately does

* **`--legacy-peer-deps`.** npm's strict resolver cannot build the 0.1.5-rc.3
  tree at all: `@deepseek-ai/dsh-web-app@0.1.5-rc.3` pins
  `cordis-plugin-loader@1.0.3` as a peer while `cordis-plugin-include@1.0.9`
  (reachable through the same bundle) wants `~1.0.5`. pnpm tolerates that; npm
  refuses. The uniform mode means "the `dependencies` closure, peers not
  auto-installed" — verified at 0.1.7-rc.1 to produce a roster identical to a
  strict install, so the mode costs no rows on the newer line.
* **Installed package roots only.** A blind recursive scan also finds manifests
  shipped *inside* packages (skill templates, fixtures, examples) — e.g.
  `@local/my-decoration`, a decoration template under
  `@deepseek-ai/dsh-agent-preset/skills/`, which is not on the registry at all.
  Those are payload, not client rows.

## What a roster does and does not prove

A roster is the **declared** superset: a package may declare a client face and
still not be mounted in a given profile. The **mounted** truth for a profile is
the composed boot graph (`globalThis["__DSH_BOOT__"]` on the served page), which
is what the live lanes inspect. Every mounted row is in the roster; the reverse
is not guaranteed. Consumers should treat the roster as the necessary condition
(`inject ⊆ roster` on each claimed line) and the boot graph as the sufficient
one.