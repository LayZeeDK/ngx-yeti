---
id: T079
title: Make .browserslistrc a cache input of every Nx target that reads the browser floor, through one named input, with a standing test that lists the readers
wave: 17
deps: [T076]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - nx.json
  - project.json
  - tools/nx/browser-floor-inputs.test.mjs
  - packages/ngx-yeti/project.json
  - packages/ngx-yeti-testing/project.json
---

# T079 — Make .browserslistrc a cache input of every Nx target that reads the browser floor, through one named input, with a standing test that lists the readers

## Context

Final-review patch, ship attempt 2, finding P002 of `.project/review/PATCH-FINDINGS.md` (reviewed HEAD d63e7e0, source `.project/review/final-gap-2.md`, locator "Risk: .browserslistrc is not a cache input of the Nx targets that read it (ngx-yeti:build-storybook, ngx-yeti:test-storybook, ngx-yeti-e2e:e2e and its e2e-ci shards, ngx-yeti:build, yeti-app:build), so a browser-floor change replays results built for the old CSS target"), fixed in M002 under Lars's rulings of 2026-10-16, verbatim: "Approve, resolve in M002" and "Nx cache/inputs/outputs issues are important".

Evidence, verbatim: "Measured. All six cached targets in the risk read the browser floor at run time, directly or through a nested build, and none of them hashes `.browserslistrc`. yeti-app-e2e:e2e has the same gap. If someone raises, lowers or breaks the floor, Nx replays the cached Storybook build and test-storybook pass, the cached ngx-yeti-e2e results (color-scheme-wrappers.spec.ts included, the spec that guards T075's cssTarget fix), the cached ngx-yeti package and the cached yeti-app bundle, all built for the old CSS target. This goes against Lars's ruling of 2026-10-16, "Nx cache/inputs/outputs issues are important", and against AGENTS.md "Run CI locally", which expects every job to pass both locally and in CI. A replayed local run is not proof of the current floor. T075 AC1 still holds, because it runs with `--skip-nx-cache`, but its cached runs are not protected. Inferred, not measured: whether @angular/build:unit-test (ngx-yeti:test) also reads the floor."

Fix direction, verbatim: "In nx.json `namedInputs`, add `"browserFloor": ["{workspaceRoot}/.browserslistrc"]`. Then add `"browserFloor"` to `targetDefaults["@angular/build:application"].inputs`, `targetDefaults["@nx/angular:package"].inputs`, `targetDefaults["build-storybook"].inputs` and `targetDefaults["test-storybook"].inputs`, and to the `e2e` named input. The `e2e` entry covers `e2e` and every `e2e-ci--**/*` shard of ngx-yeti-e2e and yeti-app-e2e. Use a named input rather than `sharedGlobals`: `sharedGlobals` feeds `default`, which every lint, typecheck and unit-test target and every `^default` consumer hashes, so a floor edit would invalidate targets that never read the file. Per-target globs would repeat one path in five places, while one named input keeps a single owner. Check: before the change, a `node --test` file that runs `nx show target inputs <t> --json` for the six cached targets plus yeti-app-e2e:e2e and asserts `.browserslistrc` is in `files` fails. After the change it passes, and a negative control (ngx-yeti:lint does not list the file) still holds. tmp/gap2-inputs.mjs in this sidecar is a working start for that test."

Measured by the gap reviewer at d63e7e0 (final-gap-2.md): `browserslistrc=false` for ngx-yeti:build-storybook, ngx-yeti:test-storybook, ngx-yeti:static-storybook, ngx-yeti-e2e:e2e, ngx-yeti-e2e:e2e-ci--src/color-scheme-wrappers.spec.ts, ngx-yeti-e2e:e2e-ci, ngx-yeti:build, yeti-app:build, yeti-app-e2e:e2e and screen-reader-e2e nvda and voiceover; the positive control `nx show target inputs ngx-yeti:typecheck --json` lists `tsconfig.base.json`. Not cached, so unable to replay: static-storybook (@nx/web:file-server), nvda and voiceover (`cache=false`). The readers are packages/ngx-yeti/.storybook/main.ts:22 (and :96, `build.cssTarget`), @angular/build's `supported-browsers.js:25` (yeti-app:build) and ng-packagr's stylesheet processor (ngx-yeti:build). The gap reviewer's tmp/gap2-inputs.mjs is not in this checkout.

Planner's note (read at d63e7e0): ngx-yeti:test is `vitest run --config vitest.unit.config.mts` with inline inputs in packages/ngx-yeti/project.json, not @angular/build:unit-test; yeti-app:test is @angular/build:unit-test; ngx-yeti:build-fast (`vite build --config vite.lib.config.mts`) and ngx-yeti-testing:test (vitest) have inline inputs. Whether these read the floor is not measured.

## Approach

- One owner: the `browserFloor` named input in nx.json `namedInputs`, added where the Fix direction names. Not in `sharedGlobals` or `default`, and no per-target copy of the path.
- Settle each target the planner's note leaves open (yeti-app:test, ngx-yeti:test, ngx-yeti:build-fast, ngx-yeti-testing:test, and yeti-analog's cached targets) by evidence: read the executor or tool source in node_modules for a browserslist read, or run the target with a broken floor and see whether it fails. A target that reads the floor gets `browserFloor` (its target default or its project.json `inputs`); one that does not becomes a negative control. Record each verdict and its evidence in the Log.
- tools/nx/browser-floor-inputs.test.mjs (new, typed `.mjs` per AGENTS.md "Scripts") runs `nx show target inputs <project>:<target> --json` for every reader (one `e2e-ci--*` shard per e2e project that has them, picked from `nx show project`) and asserts `.browserslistrc` is in `files`; it asserts the file is absent for ngx-yeti:lint, ngx-yeti:typecheck and every target measured not to read it. Each assertion names the target it failed on.
- Add the test to the root project.json `test` command. Add the test file, `{workspaceRoot}/nx.json` and the project.json files that carry inline `inputs` to that target's `inputs`, so an inputs edit reruns it.
- The test runs inside the run-job `unit` leg as part of the root `test` target: it must work in a tree without `.git`, with `CI` set and no Nx daemon.
- Comments say only what the code cannot; no planning ids, dates or measurements in code.
- Read `references/fast-compile.md` before touching a target that compiles with `fastCompile`, and the nx-workspace skill for `nx show`.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. nx.json `namedInputs` has `"browserFloor": ["{workspaceRoot}/.browserslistrc"]`, and `.browserslistrc` reaches targets only through it: `rg -F '.browserslistrc' nx.json project.json packages/ngx-yeti/project.json packages/ngx-yeti-testing/project.json` matches that one line.
2. `nx show target inputs <target> --json` lists `.browserslistrc` for ngx-yeti:build-storybook, ngx-yeti:test-storybook, ngx-yeti-e2e:e2e and an `e2e-ci--*` shard of it, ngx-yeti:build, yeti-app:build, yeti-app-e2e:e2e and an `e2e-ci--*` shard of it, and every other target the Log records as a reader; it does not list it for ngx-yeti:lint, ngx-yeti:typecheck or any target the Log records as not reading the floor.
3. tools/nx/browser-floor-inputs.test.mjs asserts criterion 2, is shown failing at d63e7e0's nx.json first (the Log records the run and the targets it named), passes after the change, and runs in the root `test` target, whose `inputs` include the test file and nx.json.
4. The test passes inside a run-job `unit` container, whose tree has no `.git`.
5. `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache` and `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` pass, and `npx prettier --check` passes on the task's files.

## Verify

```bash
set -o pipefail && npm ci && npx playwright install chromium && rg -q -F 'tools/nx/browser-floor-inputs.test.mjs' project.json && node --test tools/nx/browser-floor-inputs.test.mjs && npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && npx prettier --check nx.json project.json packages/ngx-yeti/project.json packages/ngx-yeti-testing/project.json tools/nx/browser-floor-inputs.test.mjs && node tools/ci-local/run-job.mjs ci unit -- node --test tools/nx/browser-floor-inputs.test.mjs; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-16 — created by planner
