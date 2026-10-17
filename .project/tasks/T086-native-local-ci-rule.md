---
id: T086
title: Make the local-CI rule in AGENTS.md, references/ci-local.md, and the testing skill say that container jobs pass in CI and need no local run, while the native jobs and the real NVDA lane pass locally
wave: 18
deps: [T064, T070, T048]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - AGENTS.md
  - references/ci-local.md
  - .claude/skills/ngx-yeti-testing/SKILL.md
---

# T086 — Make the local-CI rule in AGENTS.md, references/ci-local.md, and the testing skill say that container jobs pass in CI and need no local run, while the native jobs and the real NVDA lane pass locally

## Context

INTENT SC8 was corrected on 2026-10-17 (Lars, verbatim: "We don't have to replay everything that runs in CI, in Docker containers. As long as we run CI checks that are possible natively and locally, I'm happy. Other checks may be deferred to CI." and "Correct SC8 now: native local checks only, real NVDA lane"). Read SC8, SC9, and `## Corrections` in .project/intent/INTENT.md. Every job of `.github/workflows/ci.yml` and `floor.yml` passes in CI. Locally, the checks that run natively pass: `npm run check`, the `static` and `package` jobs, the floor jobs `chromium-141` and `firefox-145`, the e2e projects `ngx-yeti-e2e` and `yeti-app-e2e` run natively, and the `nvda` lane as its job runs it (`npm exec nx -- run screen-reader-e2e:nvda` with no `BROWSERS`: Playwright's Chromium, then Firefox). The container jobs `unit`, `e2e`, `webkit-26-4`, and `firefox-146-e2e` need no local run; `node tools/ci-local/run-job.mjs` stays available to reproduce one. The macOS-only `safari` and `voiceover` jobs pass in CI only. The `BROWSERS=msedge` NVDA lane is faster but not evidence for the job.

Three files still state the old rule, that every job but the macOS ones passes both locally and in CI:

- AGENTS.md, section "Run CI locally", first paragraph: "Every job in ... passes locally and in CI before a push, except `ci.yml` `safari` and `voiceover` ... Run a job that has a `container` with `node tools/ci-local/run-job.mjs <workflow> <job>`, and every other job natively."
- references/ci-local.md, the paragraph under the title: "Every job ... runs locally except ... Every other job passes both locally and in CI before a push."
- .claude/skills/ngx-yeti-testing/SKILL.md, section "Engines", the paragraph that starts "A local Chromium run is not the whole gate.": "every job of `ci.yml` and `floor.yml` passes locally as well as in CI: each container job through `node tools/ci-local/run-job.mjs` ...", ending with a dated quote of the 2026-10-10 ruling that the correction narrowed.

README.md only says where to read how to run a CI job locally and states no rule, so it is not in scope.

## Approach

- Rewrite only those three passages. Keep everything else in the three files, including AGENTS.md's NVDA sentence, the `npm install --no-save playwright@<release>` note and the pointer to references/ci-local.md, ci-local.md's run-job.mjs reference, native-jobs table, NVDA lane section, pitfalls and measured runs, and the rest of the testing skill.
- Each rewritten passage says, in the reader's words: every job of `ci.yml` and `floor.yml` passes in CI; locally, the checks that run natively pass (name them: `npm run check`, `static`, `package`, `firefox-145`, `chromium-141`, the e2e projects run natively, and the `nvda` lane without `BROWSERS`); the container jobs (`unit`, `e2e`, `webkit-26-4`, `firefox-146-e2e`) need no local run, and `node tools/ci-local/run-job.mjs <workflow> <job>` reproduces one on demand; `safari` and `voiceover` need macOS and pass in CI only; `BROWSERS=msedge` is a faster NVDA lane that is not evidence for the job. Each of the three passages contains the exact words `need no local run`.
- Plain English, no planning ids, task ids, dates, or measurements in the new text. Drop the testing skill's dated 2026-10-10 quote together with the rule it states; do not replace it with the 2026-10-17 quote.
- No passage may still say that a job passes locally and in CI, locally as well as in CI, or both locally and in CI.
- references/ci-local.md's heading "Container jobs: run them from the workflow" and its body describe how to reproduce a container job; they may stay as they are, or gain one sentence that a local run is optional.

## Interface contract

- None

## Intent coverage

- SC8

## Acceptance criteria

1. SC8: AGENTS.md "Run CI locally", the opening paragraph of references/ci-local.md, and the local-gate paragraph of .claude/skills/ngx-yeti-testing/SKILL.md's "Engines" section each say that every job passes in CI, that locally the native checks pass (`npm run check`, `static`, `package`, `firefox-145`, `chromium-141`, the e2e projects run natively, and the `nvda` lane without `BROWSERS`), that the container jobs `unit`, `e2e`, `webkit-26-4`, and `firefox-146-e2e` need no local run and `tools/ci-local/run-job.mjs` reproduces one on demand, and that `safari` and `voiceover` pass in CI only; AGENTS.md and references/ci-local.md also say that the `BROWSERS=msedge` NVDA lane is not evidence for the job. Each of the three files contains `need no local run`, and none says that a job passes "locally and in CI", "locally as well as in CI", or "both locally and in CI".
2. Nothing else in the three files changes, and the new text carries no planning id, task id, date, or measurement.
3. `npx prettier --check` passes on the three files, and `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
set -o pipefail && npm ci && ! rg -q -i 'pass(es)? (both )?locally (and|as well as) in CI' AGENTS.md references/ci-local.md .claude/skills/ngx-yeti-testing/SKILL.md && rg -q -F 'need no local run' AGENTS.md && rg -q -F 'need no local run' references/ci-local.md && rg -q -F 'need no local run' .claude/skills/ngx-yeti-testing/SKILL.md && rg -q -F 'tools/ci-local/run-job.mjs' AGENTS.md && rg -q -F 'tools/ci-local/run-job.mjs' .claude/skills/ngx-yeti-testing/SKILL.md && rg -q -F 'not evidence for the job' AGENTS.md && rg -q -F 'not evidence for the job' references/ci-local.md && rg -q -F 'webkit-26-4' AGENTS.md && rg -q -F 'firefox-146-e2e' AGENTS.md && npx prettier --check AGENTS.md references/ci-local.md .claude/skills/ngx-yeti-testing/SKILL.md; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: no

## Log

- 2026-10-17 — created by planner (build repair after the SC8 intent correction)
