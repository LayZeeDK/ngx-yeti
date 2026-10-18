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
set -o pipefail && npm ci && node --test tools/nx/browser-floor-inputs.test.mjs && first=$(NX_TUI=false NO_COLOR=1 npm exec nx -- run @ngx-yeti/source:test --output-style=static 2>&1) && printf '%s\n' "$first" && printf '%s\n' "$first" | rg -q -F 'and 1 task it depends on' && second=$(NX_TUI=false NO_COLOR=1 npm exec nx -- run @ngx-yeti/source:test --output-style=static 2>&1) && printf '%s\n' "$second" && printf '%s\n' "$second" | rg -q -F 'and 1 task it depends on' && printf '%s\n' "$second" | rg -q -F 'Nx read the output from the cache instead of running the command for 1 out of 2 tasks.' && npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && npx prettier --check project.json tools/nx/browser-floor-inputs.test.mjs; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: no

## Log

- 2026-10-18 — created by planner (build repair after the wave 20 cycle 1 review's MAJOR warning on the root test target's graph inputs)
