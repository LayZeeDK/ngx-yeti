---
id: T093
title: Make pack-check find the packed tarball under both npm 11 and npm 12
wave: 22
deps: [T053, T091]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - tools/package/pack-check.mjs
  - tools/package/pack-tarball.mjs
  - tools/package/pack-tarball.test.mjs
  - project.json
  - tools/nx/browser-floor-inputs.test.mjs
---

# T093 — Make pack-check find the packed tarball under both npm 11 and npm 12

## Context

Build repair (2026-10-18): npm 12 breaks pack-check. Measured by the orchestrator:

- A diagnostic run of PLAN.md's project Verify at b04cc90 (product tree identical to 8222987, where the recorded Verify passed pack-check under npm 11) failed in `npm exec nx -- run-many -t build pack-check`: tools/package/pack-check.mjs:97 `const [{ filename: tarball }] = JSON.parse(pack.stdout);` threw "TypeError: object is not iterable (cannot read property Symbol(Symbol.iterator))".
- Cause: npm 12.2.0 became the live npm on this machine at 05:21 on 2026-10-18 (a global npm in the user's npm prefix, which Node's npm shim defers to; not changed by this pipeline). A probe package shows npm 12's `npm pack --json` prints an object keyed by package name (`{"probe-pkg": {"id": ..., "filename": ...}}`), where npm 11 printed an array of such objects. CI's actions/setup-node with node-version 24 ships npm 11 (inferred), so CI is unaffected, but INTENT SC8's local native checks include the `package` job.
- Only tools/package/pack-check.mjs:93 parses npm JSON output in apps/, packages/ and tools/ (measured by search). Every other diagnostic Verify step passed under npm 12 (firefox-145 floor 507/507, both e2e projects, nvda 22 passed, chromium-141 floor and e2e).

Planner's reading at 0152898: pack-check.mjs empties tmp/pack-check (`rmSync(workDir, ...)`) and runs `npm pack --json --pack-destination "<workDir>" "<dist/packages/ngx-yeti>"` with `shell: true`, then extracts `../${tarball}` from tmp/pack-check/consumer. The ngx-yeti:pack-check target (packages/ngx-yeti/project.json:114) already hashes `{workspaceRoot}/tools/package/**/*`, so a new module under tools/package is a pack-check input. The root `@ngx-yeti/source:test` target (project.json) runs a fixed list of `node --test` files and hashes an explicit input list that covers no tools/package file; its `cache-inputs` dependency runs tools/nx/browser-floor-inputs.test.mjs, which asserts by name each repository file the root test target must hash (:159-171). T093's deps T053 and T091 are the last landed tasks that changed tools/package/pack-check.mjs and project.json with tools/nx/browser-floor-inputs.test.mjs (file overlap). T092, the other wave 22 task, shares no file and exchanges no shape with T093.

## Approach

- Make pack-check find the tarball under npm 11 and npm 12. Weigh and record in the Log one of: accept both `npm pack --json` shapes (array of objects, or object keyed by package name), or stop depending on the JSON shape and take the single `.tgz` in tmp/pack-check after `npm pack` (pack-check empties that folder first, so it holds exactly one tarball). Either way, fail loudly through pack-check's `check()` style with a clear message when no tarball or more than one is found.
- Put the tarball lookup in a small exported function in the new typed module tools/package/pack-tarball.mjs, imported by pack-check.mjs, with a `node:test` file tools/package/pack-tarball.test.mjs covering the npm 11 array shape, the npm 12 object shape (or, for a folder-based lookup, a folder holding exactly one `.tgz`) and the error cases (none, more than one). Record the red run first: the npm 12 case fails against the current expression `const [{ filename: tarball }] = JSON.parse(stdout)`.
- Add the new test file to the root `@ngx-yeti/source:test` command in project.json. The target's inputs glob does not cover tools/package (checked in project.json at 0152898; confirm with `npm exec nx -- show project @ngx-yeti/source --json` and say so in the Log), so add tools/package/pack-tarball.mjs and tools/package/pack-tarball.test.mjs to `targets.test.inputs`, and add both to the hashed-file list in tools/nx/browser-floor-inputs.test.mjs so the guard proves the hash covers them.
- No new dependency, no change to the package's contents, and no change to the ngx-yeti:pack-check target, nx.json, or any other Nx target or input beyond the root test entries above unless a measurement makes one necessary; then stop and report blocked. Observation for the Log, not a change: pack-check's hash does not include the npm version, so the Verify runs it with `--skip-nx-cache`.
- Scripts follow AGENTS.md "Scripts": typed `.mjs`, `// @ts-check` with JSDoc types, covered by tsconfig.scripts.json (its `**/*.mjs` include already covers tools/package). Follow the type-safety skill and the repository's JS style (braces and blank lines around control flow).

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. `npm exec nx -- run ngx-yeti:pack-check --skip-nx-cache` passes on this machine under npm 12, and the Log records `npm --version` and the passing output.
2. tools/package/pack-tarball.test.mjs passes and covers the npm 12 object shape (or single-tarball folder), the npm 11 array shape, and the no-tarball and several-tarball errors, each error with a clear message; the Log records the red run of the npm 12 case against the old parse expression.
3. pack-check.mjs takes the tarball from the new exported function and no longer destructures `JSON.parse(pack.stdout)` as an array.
4. The root `@ngx-yeti/source:test` command runs tools/package/pack-tarball.test.mjs, its inputs hash tools/package/pack-tarball.mjs and tools/package/pack-tarball.test.mjs, and tools/nx/browser-floor-inputs.test.mjs asserts both; `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache` passes.
5. `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` passes, and prettier passes on every changed file.
6. No new dependency, no change to package contents, and no Nx target or input change other than criterion 4's.

## Verify

```bash
npm ci && npm --version && node --test tools/package/pack-tarball.test.mjs && npm exec nx -- run ngx-yeti:pack-check --skip-nx-cache && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache && npx prettier --check tools/package/pack-check.mjs tools/package/pack-tarball.mjs tools/package/pack-tarball.test.mjs project.json tools/nx/browser-floor-inputs.test.mjs; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: no

## Log

- 2026-10-18 — created by planner (build repair: npm 12 breaks pack-check)
