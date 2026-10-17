---
id: T085
title: Fix wave 17 cycle 1 review findings in T079
wave: 18
deps: [T079]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - nx.json
  - packages/ngx-yeti-testing/project.json
  - packages/ngx-yeti/project.json
  - project.json
  - tools/nx/browser-floor-inputs.test.mjs
---

# T085 — Fix wave 17 cycle 1 review findings in T079

## Context

Repair task created from the wave 17 cycle 1 review of T079.
The failed criteria and every reviewer observation are recorded verbatim under Review findings.
The source task contracts are unchanged; read them and .project/intent/INTENT.md before editing.

## Approach

- Fix only what the Review findings name, inside the listed files; do not change the source
  tasks' acceptance criteria or interface contracts.
- Re-run the source tasks' Verify commands after the fix and record the result in the Log.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. tools/nx/browser-floor-inputs.test.mjs asserts criterion 2, is shown failing at d63e7e0's nx.json first (the Log records the run and the targets it named), passes after the change, and runs in the root `test` target, whose `inputs` include the test file and nx.json.

## Verify

```bash
set -e
(
set -o pipefail && npm ci && npx playwright install chromium && rg -q -F 'tools/nx/browser-floor-inputs.test.mjs' project.json && node --test tools/nx/browser-floor-inputs.test.mjs && npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && npx prettier --check nx.json project.json packages/ngx-yeti/project.json packages/ngx-yeti-testing/project.json tools/nx/browser-floor-inputs.test.mjs; status=$?; npx --no-install nx daemon --stop; exit $status
)
```

Heavy: yes

## Review findings

### t079_ac3
Criterion: tools/nx/browser-floor-inputs.test.mjs asserts criterion 2, is shown failing at d63e7e0's nx.json first (the Log records the run and the targets it named), passes after the change, and runs in the root `test` target, whose `inputs` include the test file and nx.json.
- tools/nx/browser-floor-inputs.test.mjs asserts criterion 2, is shown failing at d63e7e0's nx.json first (the Log records the run and the targets it named), passes after the change, and runs in the root `test` target, whose `inputs` include the test file and nx.json. — found: the assertion, the red run and the inclusion in the target all hold. The red run is in the Log: 17 tests, 10 failed, each target named; `git diff d63e7e0 23b3101` on the four config files is empty, so the base nx.json is d63e7e0's. project.json `test.command` names the file, and `inputs` list the file, `{workspaceRoot}/nx.json`, `{workspaceRoot}/{apps,packages}/*/project.json` and `tools/yeti/nx-plugin.mjs`. But the cache key the test runs under misses files whose change flips its result, so a cached pass of this standing guard replays after the change it exists to catch. This is an Nx inputs gap, which T079's own Context ruling ("Nx cache/inputs/outputs issues are important") rates as major. Measured at e6a870e: T081 and T082 do not touch project.json or nx.json (`git log 69323b6..e6a870e` on both is empty). In that state, `npm exec nx -- show target inputs @ngx-yeti/source:test --json` lists 389 files without `.browserslistrc`, `package.json`, `packages/ngx-yeti/package.json`, `apps/yeti-analog/package.json` or `vendor/yeti/COMMIT`. It does list `nx.json`, `.nxignore` and `.gitignore`, so the thermos claim about those two ignore files does not hold. Nx lists only files that exist. If `.browserslistrc` is deleted, or the floor moves into package.json's `browserslist` key, the 10 reader assertions fail, and so does the e2e shard assertion: `browserFloor` matches nothing. The root target's hash does not change, so `nx run @ngx-yeti/source:test`, `npm run check` and `nx affected` replay the earlier pass (that replay is inferred from Nx's hash rules, not run). The package.json files feed the project graph through their `nx` key and the workspaces list. `vendor/yeti/COMMIT` creates the yeti-css project (tools/yeti/nx-plugin.mjs:11), whose `yeti-css:yeti-build` the test asserts. The thermos bug and quality reviews (tmp/afk-m002/wave17-thermos-bugs.md H1, wave17-thermos-quality.md) raise the same gap. fix: in root project.json `targets.test.inputs`, add `"browserFloor"`, `"{workspaceRoot}/package.json"`, `"{workspaceRoot}/{apps,packages}/*/package.json"` and `"{workspaceRoot}/vendor/yeti/COMMIT"`. Run `npm exec nx -- show target inputs @ngx-yeti/source:test --json` and confirm all of them are in `files`. Then add one case to tools/nx/browser-floor-inputs.test.mjs that asserts `@ngx-yeti/source:test` lists `.browserslistrc` and package.json, so the guard covers its own inputs. Show that case failing on the current project.json first. Every path is in T079's `files`.

## Log

- 2026-10-17 — created by dispatch_driver.py fix-tasks from wave 17 cycle 1
- 2026-10-17 — orchestrator: plan-defect repair of Verify under Lars's ruling of 2026-10-17, verbatim: "We don't have to replay everything that runs in CI, in Docker containers. As long as we run CI checks that are possible natively and locally, I'm happy. Other checks may be deferred to CI." The `run-job ci unit` leg was removed from Verify; the PLAN.md project Verify still runs `ci unit`, and CI runs it on the pull request. The fix is also to add the four inputs the review names and a guard case asserting `@ngx-yeti/source:test` lists .browserslistrc and package.json, shown failing first.
