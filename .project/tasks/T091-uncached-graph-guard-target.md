---
id: T091
title: Run the project-graph guard in its own uncached root target that the root test target depends on, and drop the graph-only inputs no remaining root test reads
wave: 21
deps: [T088]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - project.json
  - tools/nx/browser-floor-inputs.test.mjs
---

# T091 — Run the project-graph guard in its own uncached root target that the root test target depends on, and drop the graph-only inputs no remaining root test reads

## Context

The wave 20 cycle 1 review (.project/plan/build-recovery-6f4a1ecf27c63b8ef80bce139419fed8d8a8596b/review/wave-20.cycle1.md, first warning under T088) passed and recorded a MAJOR warning under Lars's ruling, verbatim: "Nx cache/inputs/outputs issues are important". The root `@ngx-yeti/source:test` target hashes only the root eslint.config.mjs, so a later root eslint.config.js (ESLint 9 searches it first) or a project-level `.js`, `.cjs` or `.cts` config beside an existing one changes what tools/nx/browser-floor-inputs.test.mjs's `nx show` spawns return without changing the hash, and Nx replays a cached pass. It is the fourth case of one class: waves 18, 19 and 20 each found one more file the root test target misses, because the guard's result depends on the whole project graph (every file any Nx plugin reads, present or absent), and a hand-run tracer plus a mirror-list guard cannot bound that set. Advisory evidence: tmp/afk-m002/wave20-thermos-bugs.md (H1) and tmp/afk-m002/wave20-thermos-quality.md (M2). The orchestrator chose the review's structural fix over the narrow glob alternative: the guard leaves the cached target and runs on every run, so no input list has to cover the graph.

Today (at 6f4a1ec) project.json's `targets.test.command` runs nine files under one `node --test`, the last of which is tools/nx/browser-floor-inputs.test.mjs, with `"dependsOn": []` and `"cache": true`; nx.json's `targetDefaults.test.dependsOn` is `["^yeti-build"]`, which the root's explicit `dependsOn` overrides. The guard's last block (tools/nx/browser-floor-inputs.test.mjs:114-145) asserts `@ngx-yeti/source:test` hashes a fixed list of files. CI runs the root test through `npx nx run-many --output-style=static -t test test-storybook --parallel=1` (.github/workflows/ci.yml:69). T088 is the last landed task that changed both files (file overlap).

## Approach

- Move `node --test tools/nx/browser-floor-inputs.test.mjs` out of `targets.test.command` into a new root target in project.json with `"cache": false`, and add that target to `targets.test.dependsOn`, so `nx run-many -t test`, `nx affected -t ... test ...`, CI's `run-many -t test test-storybook` and AGENTS.md's per-commit check run it on every run. You name the target; it must not be called `test`. Keep the remaining eight test files in `test` and keep `test` cached.
- Sweep every test file left in the root `test` command, and the modules they import, for the repository files they read, the way T087 and T088 did. Then drop from `targets.test.inputs` only the graph-only entries no remaining test reads. Candidates: nx.json, `{apps,packages}/*/project.json`, the `{apps,packages}/*/tsconfig.json`, apps/yeti-analog/tsconfig.app.json and eslint.config.mjs entries, tools/yeti/nx-plugin.mjs, tools/nx/browser-floor-inputs.test.mjs, and any other entry the sweep shows unread (check the manifests, vendor/yeti/COMMIT, `browserFloor` and project.json too). Keep every entry a remaining test reads; when unsure, keep it and say why in the Log. Record the sweep result per test file in the Log.
- Shrink the guard's self-check list of root-test inputs to match the inputs that remain, and add assertions that the new target exists with `cache: false` and that `test.dependsOn` includes it. Show it failing first: run the changed guard against the unchanged project.json and record the failing cases in the Log, then change project.json.
- Measure the cache behaviour: two consecutive `npm exec nx -- run @ngx-yeti/source:test` runs; the second must read `test` from the cache and run the guard target (not from the cache), and the guard target must run in both. Paste both run summaries in the Log. If `test` misses the cache on the second run because of its uncached dependency, stop and report it as blocked rather than changing the design.
- nx.json is not in this task's files: no named input needs to change. If one must, block and report instead of editing it.
- Follow the repository's script rules (typed `.mjs`, `// @ts-check`) and the type-safety skill; no new files.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. project.json has a root target, not named `test`, whose command is `node --test tools/nx/browser-floor-inputs.test.mjs` and which has `"cache": false`; `targets.test.command` no longer runs tools/nx/browser-floor-inputs.test.mjs; `targets.test.dependsOn` includes the new target; `test` stays cached.
2. The Log records the sweep of every test file left in `targets.test.command` for the repository files it reads, with the result per file, and `targets.test.inputs` keeps every entry a remaining test reads and drops the graph-only entries none reads.
3. tools/nx/browser-floor-inputs.test.mjs asserts the new target exists with `cache: false` and that `test.dependsOn` includes it, and its root-test self-check list matches the remaining inputs; the Log records the guard failing on the unchanged project.json, naming the failing cases, and passing after the change.
4. Two consecutive `npm exec nx -- run @ngx-yeti/source:test` runs both pass; the second reads `test` from the cache and runs the guard target without the cache, and the guard target runs in both. The Log holds both run summaries.
5. `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache`, `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` and `npx prettier --check` on project.json and tools/nx/browser-floor-inputs.test.mjs pass.

## Verify

```bash
set -o pipefail && npm ci && node --test tools/nx/browser-floor-inputs.test.mjs && first=$(NX_TUI=false NO_COLOR=1 npm exec nx -- run @ngx-yeti/source:test --output-style=static 2>&1) && printf '%s\n' "$first" && rg -q -F 'and 1 task it depends on' <<<"$first" && second=$(NX_TUI=false NO_COLOR=1 npm exec nx -- run @ngx-yeti/source:test --output-style=static 2>&1) && printf '%s\n' "$second" && rg -q -F 'and 1 task it depends on' <<<"$second" && rg -q -F 'Nx read the output from the cache instead of running the command for 1 out of 2 tasks.' <<<"$second" && npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && npx prettier --check project.json tools/nx/browser-floor-inputs.test.mjs; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: no

## Log

- 2026-10-18 — created by planner (build repair after the wave 20 cycle 1 review's MAJOR warning on the root test target's graph inputs)
- 2026-10-18 — build_T091 (serial round, primary checkout, base a0a5478). BLOCKED: the Verify command as written cannot pass. Under `set -o pipefail`, `printf '%s\n' "$first" | rg -q -F 'and 1 task it depends on'` exits 141 (SIGPIPE): the run output is about 151 KB, more than the pipe buffer, and `rg -q` exits at the first match, at line 14, before printf finishes writing. Measured: the full Verify, through heavy-lock, exited 141 right after the first `nx run` (npm ci ok, guard 32/32 pass, first run printed and succeeded). Replaying the saved run output through the same pipe gives `pipe=141`, and `rg -F -c` on the same pipe gives exit 0, count 2. The fix is in the Verify text, which is outside this task's files. One way: check with `rg -F -c ... >/dev/null`, or with a here-string `rg -q -F '...' <<<"$first"`, in place of `printf | rg -q`. The product change is complete, and every Verify step passes when run separately (below).
  Change: project.json gains root target `cache-inputs` (`node --test tools/nx/browser-floor-inputs.test.mjs`, `"dependsOn": []`, `"cache": false`). `test.command` no longer runs that file. `test.dependsOn` is `["cache-inputs"]` (it was `[]`, which overrode nx.json's `^yeti-build`, and still does). `test` stays `"cache": true`. `test.inputs` drops `{workspaceRoot}/project.json`, `{apps,packages}/*/tsconfig.json`, `apps/yeti-analog/tsconfig.app.json`, `eslint.config.mjs`, `tools/nx/browser-floor-inputs.test.mjs`, `{apps,packages}/*/project.json`, `tools/yeti/nx-plugin.mjs`, `browserFloor`, `{apps,packages}/*/package.json` and `vendor/yeti/COMMIT`. It keeps every other entry, nx.json and the root package.json included. Measured with `nx show target inputs @ngx-yeti/source:test --json`: 407 files before, 382 after. The 25 dropped files are exactly .browserslistrc, the 8 project.json files, the root project.json, the 8 tsconfig.json files, apps/yeti-analog/tsconfig.app.json, eslint.config.mjs, packages/ngx-yeti/package.json, apps/yeti-analog/package.json, tools/nx/browser-floor-inputs.test.mjs, tools/yeti/nx-plugin.mjs and vendor/yeti/COMMIT. No file was added.
  Sweep method: a new one-off read tracer in the session scratchpad (not the T088 file), run once. It is an `--import` hook in NODE_OPTIONS that logs repository paths passed to fs read, stat, exists, readdir, open and access calls, plus resolved imports. It ran over the eight remaining files in one `node --test`. In that run lars-verify-spec.test.mjs failed only because the hook's realpathSync wrapper dropped `.native`, so that file is covered statically. The Playwright config children get a fixed env, so the hook did not reach them. For those children I ran a one-line in-process probe that loads @nx/devkit and runs nxE2EPreset on apps/yeti-app-e2e/playwright.config.mts. I also read the code of each file. Per file (repository files read -> kept input):
  - tools/playwright/engines.test.mjs: engines.mjs (tools/playwright/**). Vite createServer probes .env, .env.local, .env.development, .env.development.local, the .postcssrc* and postcss.config.* names, and `public`. All are absent, and none was an input before. Not added: out of scope, see the note at the end.
  - tools/playwright/browser-projects.test.mjs: browser-projects.mjs and engines.mjs (tools/playwright/**).
  - tools/playwright/vitest-configs.test.mjs: globs and reads the vitest and vite configs under {apps,packages} and the modules they import (config globs and `{apps,packages}/**/*.{ts,mts,mjs,tsx}`). The trace saw no tsconfig, project.json, nx.json or package.json under a project.
  - tools/playwright/playwright-configs.test.mjs: the playwright.config.mts files and browser-projects.mjs/engines.mjs (kept globs). In each child, @nx/devkit reads nx.json at load (stat, exists and readFileSync measured by the probe), so nx.json is KEPT. nxE2EPreset reads the root package.json (workspaces) and stats tsconfig.base.json and tsconfig.json; tsconfig.base.json is already hashed implicitly. The child also probes lerna.json, nx-cloud.env and bun/yarn/pnpm lockfiles; package-lock.json is kept.
  - tools/playwright-server/container.test.mjs: container.mjs (kept); playwright-core from node_modules (external).
  - tools/ci-local/run-job.test.mjs: run-job.mjs, ci.yml, floor.yml, package.json and package-lock.json (all kept). The trace also shows existsSync on pnpm-workspace.yaml and lerna.json (absent).
  - tools/playwright/navigation-budget.test.mjs: the readdir walk and reads of `{apps,packages}/**/*.{ts,mts,mjs,tsx}` (kept). The Nx native WorkspaceContext glob reads .gitignore and .nxignore, which Nx hashes implicitly (both are among the 382). The trace logged readdir of packages/ngx-yeti/storybook-static, which is gitignored build output; the glob filters on the TS extensions, so the result does not depend on it.
  - tools/verification/lars-verify-spec.test.mjs (static, as in T087 and T090): lars-verify-spec.mjs (kept); everything else is a tmpdir() checkout.
  No remaining test read any dropped entry: no project.json, tsconfig*.json, eslint.config.*, tools/yeti/nx-plugin.mjs, vendor/yeti/COMMIT, .browserslistrc or project package.json appears in the trace, the probe or the code.
  Guard: tools/nx/browser-floor-inputs.test.mjs gains the test "@ngx-yeti/source:cache-inputs is not cached and @ngx-yeti/source:test depends on it". It checks `cache-inputs.cache === false`, that `test.dependsOn` includes 'cache-inputs', and that `test.cache === true`, through `nx show project`. The root-test self-check list is now the single-file inputs that remain: nx.json, package.json, package-lock.json, ci.yml, floor.yml, container.mjs, container.test.mjs, run-job.mjs, run-job.test.mjs, lars-verify-spec.mjs and lars-verify-spec.test.mjs.
  Red first (unchanged project.json, changed guard): tests 32, pass 31, fail 1. The failing case was "@ngx-yeti/source:cache-inputs is not cached and @ngx-yeti/source:test depends on it": strict-equal on `cache-inputs.cache`, undefined against false. After the change: tests 32, pass 32, fail 0.
  AC4, two consecutive `NX_TUI=false NO_COLOR=1 npm exec nx -- run @ngx-yeti/source:test --output-style=static` runs, both exit 0. The first is the Verify run; it ran both tasks. The two runs that followed have identical summaries:
  ```
  NX   Running target test for project @ngx-yeti/source and 1 task it depends on:
  > nx run @ngx-yeti/source:cache-inputs
  ... (guard: tests 32, pass 32)
  > nx run @ngx-yeti/source:test  [existing outputs match the cache, left as is]
  NX   Successfully ran target test for project @ngx-yeti/source and 1 task it depends on
  Nx read the output from the cache instead of running the command for 1 out of 2 tasks.
        @ngx-yeti/source:cache-inputs    1m 18s   (1m 17s on the other run)
  ```
  So `test` replays from the cache and `cache-inputs` runs every time. The uncached dependency does not make `test` miss.
  AC5, run separately: `nx run @ngx-yeti/source:test --skip-nx-cache` exit 0 (guard 32/32, root test 88/88). `nx typecheck @ngx-yeti/source --skip-nx-cache` exit 0 (1/1). `npx prettier --check project.json tools/nx/browser-floor-inputs.test.mjs` is clean. The daemon is stopped. Per the brief, no `nx affected` or `run-many` ran. The Git index is untouched.
  Note for a later task (not in scope; this task only drops inputs): the remaining root test still probes absent names that are not inputs: Vite's .env*, .postcssrc* and postcss.config.* in engines.test.mjs, and lerna.json, pnpm-workspace.yaml and nx-cloud.env in the Nx and run-job reads. Creating one of them later would not change the `test` hash.
- 2026-10-18 — orchestrator (Claude): attempt 1 rejected only for the Verify defect the entry above measured; product unchanged. Attempt 1 diff saved as tmp/afk-m002/tools/T091-attempt1.patch (project.json +8 -13, tools/nx/browser-floor-inputs.test.mjs +28 -19; sha256 ee2676bf423c6541b393093536657e1f7309f6ee5303e92ce680df4404840661). Plan-defect repair, Verify field only: the three `printf '%s\n' "$x" | rg -q -F '...'` checks became `rg -q -F '...' <<<"$x"`, which cannot SIGPIPE under `set -o pipefail` (measured on a 300 KB string in Git Bash: here-string match 0, here-string miss 1, the old pipe 141). The task returns to pending for attempt 2 with the same bytes.
