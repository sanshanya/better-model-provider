# Contributing

Toolchain here is npm only — the lockfile is `package-lock.json`, CI runs `npm ci`, and Dependabot manages bumps. Do not mix pnpm/pnpm-lock files into this repo.

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
# `pnpm install` run; the functional lane also needs a Chromium executable):
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
- Each row produces a touched patch: untouched fields produce no operation, while an explicit inherit action produces an `unset` operation. Catalog rows write capability leaves under `modelOverrides`; declared rows rewrite only a user-owned `models[]` array.
- Mutations keep user drafts on failure: `settings-conflict` shows the localized conflict copy, every other wire failure shows its reason next to the action.
- The tests must not speak a protocol the harness does not serve: the scripted face and every stub override assert the payload is exactly `{}`, and envelope failures are real `RpcError` union members — no casts, no `as never`.
- `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` stay on; there is no `any` anywhere.
- Final artifact first: `verify:pack` packs the tarball, verifies every manifest export exists inside it, then installs it into an EMPTY consumer and typechecks a realistic import — a declaration-resolution problem is caught at this gate, not downstream.

## Coverage policy

v8 per-file 100% for lines / functions / statements and 95% for branches, enforced by `vitest.config.ts`. Guards exist only where UI or code can genuinely reach them; never reshape production code to satisfy coverage, and never the reverse (a guard that is unreachable gets removed, not ignored). The branch slack is earned, not spent in advance: a branch-only test whose scenario cannot plausibly occur (corrupted stored documents, impossible key events) is deleted, not kept for the number.

## Harness compatibility anchors

The wire faces in `src/client/types.ts` are `Pick`s of the published `@deepseek-ai/dsh-api-remotes/client` contract (peerDependency `^0.1.0-rc.5 || ^0.1.0-rc.6`, devDependency for local development). An upstream drift shows up as a typecheck failure in `npm ci` in any new env, and weekly Dependabot PRs fail CI when the bump breaks the contract.
