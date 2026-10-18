---
id: T093
title: Make pack-check find the packed tarball under both npm 11 and npm 12
wave: 22
deps: [T053, T091]
status: done
agent: build_T093
base: d3512e8c70e611a3602ad0906fe3e96657227bf5
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
- 2026-10-18 — build_T093 implementation: chose to accept both `npm pack --json` shapes rather than scan tmp/pack-check for one `.tgz`. Reason: the JSON is npm's own report of what it packed, so the tests can pin both real shapes and the red run is literal; a folder scan would also work but tests a side effect instead. New typed module tools/package/pack-tarball.mjs exports `packedTarball(stdout)`: an array (npm 11) or the values of an object keyed by package name (npm 12) are filtered to entries with a string `filename`; zero entries throw "npm pack --json reported no tarball: <stdout>", more than one throws "npm pack --json reported N tarballs, expected one: <names>". pack-check.mjs imports it and turns a throw into `check(false, 'npm pack reported one tarball', ...)`; the array destructure of `JSON.parse(pack.stdout)` is gone. Root `@ngx-yeti/source:test` command now also runs tools/package/pack-tarball.test.mjs; `targets.test.inputs` gained tools/package/pack-tarball.mjs and tools/package/pack-tarball.test.mjs (before the change, project.json's test inputs at base held no glob covering tools/package, read from the file; after it, `nx show project @ngx-yeti/source --json` lists both); tools/nx/browser-floor-inputs.test.mjs asserts both are hashed. No other target, input, dependency or package content changed. Observation: pack-check's hash does not include the npm version, so the Verify runs it with `--skip-nx-cache`.
- 2026-10-18 — build_T093 red run: tools/package/pack-tarball.mjs first held the old expression `const [{ filename: tarball }] = JSON.parse(stdout); return tarball;`. `node --test tools/package/pack-tarball.test.mjs`: tests 7, pass 1 (npm 11 array), fail 6; the npm 12 object case threw "TypeError: object is not iterable (cannot read property Symbol(Symbol.iterator))", the same error as the diagnostic Verify. After the fix: tests 7, pass 7.
- 2026-10-18 — build_T093 Verify (run once through the heavy lock, exactly as written): the first run failed at `nx typecheck @ngx-yeti/source` (TS2322/TS2345 from noUncheckedIndexedAccess in pack-tarball.mjs:45 and pack-tarball.test.mjs:26); fixed by destructuring the first tarball and typing the test cases as objects. Second run exit 0: `npm ci` added 1950 packages; `npm --version` 12.2.0; pack-tarball.test.mjs tests 7 pass 7 fail 0; `nx run ngx-yeti:pack-check --skip-nx-cache` succeeded (with build) and printed ngx-yeti-0.220200.0-yeti.7.0.0-alpha.0.gf52d1e8.tgz; `nx typecheck @ngx-yeti/source --skip-nx-cache` succeeded (scripts-coverage tests 1 pass 1); `nx run @ngx-yeti/source:test --skip-nx-cache` succeeded (cache-inputs tests 35 pass 35, root tests 96 pass 96, fail 0); prettier: all matched files use Prettier code style; daemon stopped.
- 2026-10-18 — build_T093 bisect check: `npx prettier --check .` all files pass. `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD` (through the heavy lock): 6 affected projects (@ngx-yeti/source, ngx-yeti, screen-reader-e2e, ngx-yeti-e2e, yeti-app, yeti-app-e2e), 18 tasks succeeded, 15 read from cache, exit 0.
- 2026-10-18 — build_T093 review fixes (orchestrator triage of the thermos reviews; quality M1/L1-L5, bugs L1/L2; M2 declined): the export is renamed `packedTarballNames(stdout)` and returns `string[]`, the names of every result `npm pack --json` printed (npm 11 array or npm 12 object keyed by package name), with no count rule. It throws, naming the stdout, only when npm's output is malformed: "npm pack --json printed no JSON: <stdout>" (parse failure, with the SyntaxError as `cause`), "npm pack --json printed neither an array nor an object: <stdout>", and "npm pack --json printed a result without a filename: <stdout>" (malformed entries are now an error, not filtered out). pack-check.mjs has no try/catch and no `let tarball = ''`: it destructures the names and calls `check(tarball !== undefined && tarballs.length === 1, 'npm pack produced exactly one tarball', pack.stdout)`, so the no-tarball and several-tarball cases fail through pack-check's own `check()` once, and the test file covers them as the returned `[]` and two-name arrays (their message now lives in pack-check, not the module). A malformed-output throw is uncaught in pack-check and exits non-zero with the stdout in the message. The JSDoc keeps only the npm 11/12 shape note; pre-existing pack-check.mjs comments untouched.
- 2026-10-18 — build_T093 correction to the earlier Log line: the statement that pack-check needs `--skip-nx-cache` because its hash lacks the npm version is wrong. ngx-yeti:pack-check has no `cache` key, and Nx 23.2.1 treats such a target as uncached (create-task-graph.js:207, measured by the bugs reviewer; not re-measured by build_T093), so pack-check runs every time and `--skip-nx-cache` changes nothing for it. The Verify command is left as written.
- 2026-10-18 — build_T093 new red run (the test assertions changed from a string to `string[]` and from throw-on-count to returned arrays, so the old red run no longer applied): pack-tarball.mjs temporarily held the old expression adapted to the new signature, `const [{ filename }] = JSON.parse(stdout); return [filename];`. `node --test tools/package/pack-tarball.test.mjs`: tests 7, pass 1 (npm 11 array), fail 6; the npm 12 object case threw "TypeError: object is not iterable (cannot read property Symbol(Symbol.iterator))". After the fix: tests 7, pass 7.
- 2026-10-18 — build_T093 Verify rerun after the review fixes (through the heavy lock, exactly as written): exit 0. `npm ci` added 1950 packages; `npm --version` 12.2.0; pack-tarball.test.mjs tests 7 pass 7 fail 0; `nx run ngx-yeti:pack-check --skip-nx-cache` succeeded and printed ngx-yeti-0.220200.0-yeti.7.0.0-alpha.0.gf52d1e8.tgz; `nx typecheck @ngx-yeti/source --skip-nx-cache` succeeded (scripts-coverage tests 1 pass 1); `nx run @ngx-yeti/source:test --skip-nx-cache` succeeded (cache-inputs 35/35, root tests 96/96, fail 0); prettier: all matched files pass; daemon stopped.
- 2026-10-18 — build_T093 bisect check rerun: `npx prettier --check .` all files pass; `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD` (heavy lock): 6 projects, 18 tasks succeeded (15 from cache), exit 0.
- 2026-10-18 — orchestrator: the AC2 placement of the no-tarball and several-tarball messages in pack-check.mjs's check() (the module returns the names) follows the orchestrator's triage of thermos quality M1 (one error style, scratchpad T093-thermos-quality.md); the test covers both cases as returned arrays and pack-check reports each with one clear message. Bugs review ruling: no Nx inputs gap, ngx-yeti:pack-check is uncached.
- 2026-10-18 — orchestrator Verify (isolate gsd-path-task/T093): pass, exit 0; output tail:
  ```
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/table
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/timeline
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/visually-hidden
  npm notice run @ngx-yeti/source@0.0.0 npx
  npm notice run nx typecheck @ngx-yeti/source --skip-nx-cache
  npm notice run @ngx-yeti/source@0.0.0 npx
  npm notice run nx run @ngx-yeti/source:test --skip-nx-cache
  npm notice run @ngx-yeti/source@0.0.0 npx
  npm notice run prettier --check tools/package/pack-check.mjs tools/package/pack-tarball.mjs tools/package/pack-tarball.test.mjs project.json tools/nx/browser-floor-inputs.test.mjs
  npm notice run @ngx-yeti/source@0.0.0 npx
  npm notice run nx daemon --stop
  ```
