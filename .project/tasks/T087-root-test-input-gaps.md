---
id: T087
title: Hash every file the root test target's tests read, including floor.yml and package-lock.json, and guard those inputs
wave: 19
deps: [T085]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - project.json
  - tools/nx/browser-floor-inputs.test.mjs
---

# T087 — Hash every file the root test target's tests read, including floor.yml and package-lock.json, and guard those inputs

## Context

The wave 18 cycle 1 review passed and recorded a MAJOR inherited defect under Lars's ruling, verbatim: "Nx cache/inputs/outputs issues are important". The root `@ngx-yeti/source:test` target (project.json `targets.test`) hashes `{workspaceRoot}/.github/workflows/ci.yml` but not `.github/workflows/floor.yml`, which tools/ci-local/run-job.test.mjs:278-283 reads for every job (`['ci', 'floor']`) and asserts on (:297-306, :309-322). Measured at 8a710a8: `npm exec nx -- show target inputs @ngx-yeti/source:test --json` lists 394 files and only ci.yml among the workflows. A cached pass therefore replays after a floor.yml change that would fail those assertions. The advisory thermos reviews (tmp/afk-m002/wave18-thermos-bugs.md and wave18-thermos-quality.md, H1 in both) raise the same gap; the quality review's L3 adds that tools/ci-local/run-job.mjs:736-737 parses `package-lock.json`, which the target hashes only through package versions. T085 last changed project.json and tools/nx/browser-floor-inputs.test.mjs: its self-check loop (the `for (const file of [floor, 'package.json', ...])` block that asserts `@ngx-yeti/source:test hashes ${file}`) is the guard to extend. Lars, 2026-10-17, verbatim: "Other checks may be deferred to CI" — this task's Verify has no run-job leg.

## Approach

- First sweep every test file in `targets.test.command` (tools/playwright/engines.test.mjs, browser-projects.test.mjs, vitest-configs.test.mjs, playwright-configs.test.mjs, navigation-budget.test.mjs, tools/playwright-server/container.test.mjs, tools/ci-local/run-job.test.mjs, tools/verification/lars-verify-spec.test.mjs, tools/nx/browser-floor-inputs.test.mjs) and the modules they import for every repository file they read: `readFileSync`/`readFile`, paths built with `join`/`resolve`/`new URL`, globs, `git ls-files` or other listings, spawned scripts, and imports outside the listed inputs. Files created under `tmpdir()` and files from `node_modules` packages (hashed through external dependency versions) are not repository inputs. Record the sweep in the Log: each test file, the repository files it reads, and whether each is already an input. This is meant to be the last such gap.
- In project.json `targets.test.inputs`, add every swept file that is not yet an input; at least `{workspaceRoot}/.github/workflows/floor.yml` (or `{workspaceRoot}/.github/workflows/*.yml`) and `{workspaceRoot}/package-lock.json`. Keep every existing input; change no other target.
- Confirm with `npm exec nx -- show target inputs @ngx-yeti/source:test --json` that each added file is in `files`, and record the file count before and after in the Log.
- Extend the self-check list in tools/nx/browser-floor-inputs.test.mjs so it asserts `.github/workflows/floor.yml`, `package-lock.json`, and every other file the sweep added are in `@ngx-yeti/source:test`'s inputs. Run the extended guard on the current project.json first and record the failing run (the cases that failed) in the Log, then make it pass.
- Follow the repository's script rules (typed `.mjs`, `// @ts-check`) and the type-safety skill; no new files.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. tools/nx/browser-floor-inputs.test.mjs asserts that `@ngx-yeti/source:test` hashes `.github/workflows/floor.yml`, `package-lock.json`, and every other repository file the Log's sweep found the target's tests read and added; the Log records those cases failing on the unchanged project.json first, and the guard passes after the change.
2. project.json `targets.test.inputs` includes `{workspaceRoot}/.github/workflows/floor.yml` (or a `{workspaceRoot}/.github/workflows/*.yml` pattern) and `{workspaceRoot}/package-lock.json`, keeps every earlier input, and `npm exec nx -- show target inputs @ngx-yeti/source:test --json` lists both files; no other target changes.
3. The Log records the sweep of every test file in `targets.test.command`: the repository files each reads and whether each was already an input.
4. `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache`, `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache`, and `npx prettier --check` on the two files pass.

## Verify

```bash
set -o pipefail && npm ci && node --test tools/nx/browser-floor-inputs.test.mjs && npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && npx prettier --check project.json tools/nx/browser-floor-inputs.test.mjs; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: no

## Log

- 2026-10-17 — created by planner (build repair after the wave 18 cycle 1 review)
