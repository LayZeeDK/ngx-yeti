# Review — wave 16, cycle 1

Wave verdict: pass
Cycle: 1
Depth: full
Tasks reviewed: 1

Re-review after the 2026-10-17 SC8/SC9 intent correction (reviewer r5). Review base 217b67d7e3ebe4f7c0d6a677b2a3b229382a38bd (sidecar `git rev-parse HEAD`). Prior review (read-only): .project/plan/build-recovery-16f8ff041ef0bcec0ff6bfb50cc5b0fa719afd37/review/wave-16.cycle1.md, pass. Unchanged since then, measured: `git diff --stat 16f8ff0 HEAD -- .project/tasks/T077-fix-wave-15-cycle-1.md` is empty and the PLAN.md wave 16 section lies outside every PLAN.md diff hunk since 16f8ff0. Landing 035c6086083be2c7fe203df162459aa0fdbb83f4, parent be4fd37b9d6f6c162e162568f3aa20ad4e1988d3 = task `base` (serial). Verify evidence: .project/build/verify-ledger.jsonl line 37 (`commit` 035c608, sidecar gsd-path-verify/task-t077-verify, `exit_code` 0, evidence .git/gsd-path/dispatch/gsd-path-M002/6930b5dd9a3f353e4194c5eee08b2cca373dbca1/T077/attempt-1/verify.json). No task Verify and no project Verify was re-run. T077 owns no INTENT success criterion, so this review has no Intent coverage section.

## T077 — Fix wave 15 cycle 1 review findings in T071: pass

Landing 035c6086083be2c7fe203df162459aa0fdbb83f4, base be4fd37b9d6f6c162e162568f3aa20ad4e1988d3. Spot-check: `git show 035c608 -- tools/playwright/navigation-budget.test.mjs` adds the `['ls-files', '-co', '--exclude-standard', '-z', '--', 'apps', 'packages']` listing the prior review cites; ledger line 37 exit 0.

- ✅ `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache` and `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` pass, lint and typecheck of yeti-app-e2e pass, and prettier passes on the three files. — carried from wave-16.cycle1.md: pass. Recorded isolated Verify (.project/build/verify-ledger.jsonl last line, commit 035c608, sidecar gsd-path-verify/task-t077-verify, exit 0; finish-T077.json `landed[0].verify.exit_code` 0; its verify.json stdout reads `✔ scans only regular files`, `Successfully ran target test for project @ngx-yeti/source`, `Successfully ran target typecheck for project @ngx-yeti/source`, `Successfully ran targets lint, typecheck for project yeti-app-e2e`, then the prettier step and `Successfully ran target e2e for 3 projects` in the Firefox development leg). That Verify ran in a fresh sidecar with no git-ignored folder, the same blind spot that let cycle 1's defect pass, so this review re-ran the one test file on the condition the finding names: in this review's sidecar at f62d9da, after `npm ci --ignore-scripts` and `mkdir -p packages/ngx-yeti/lift/src/__screenshots__/lift.spec.ts` (git-ignored; `git status --short` showed only the staged review), `node --test tools/playwright/navigation-budget.test.mjs` gave tests 5, pass 5, fail 0. Positive control in the same sidecar with the same planted folder: the be4fd37 version of the file (`git show be4fd37:tools/playwright/navigation-budget.test.mjs`) gave tests 4, pass 3, fail 1, `Error: EISDIR: illegal operation on a directory, read`, so the check could fail and the patch is what makes it pass. The coder's red/green in the primary checkout with its three real ignored folders agrees (T077 Log: old glob tests 5, fail 2, listing the three folders; new code tests 5, pass 5). Both temporary files were removed after the run.

Warnings (non-blocking):
- Carried from wave-16.cycle1.md: no `review_findings.py repair-evidence` receipt (helper refuses it because T076 edited project.json); judged on patch, recorded Verify and the prior planted-folder re-run plus its be4fd37 positive control.
- The Git listing this task added was replaced in wave 17 by T078's Nx WorkspaceContext glob (so the root test runs without .git); T078's own criteria keep the regular-files, ignored-output and dot-folder properties and passed in its review.

Contract violations (blocking):
- none

## Summary for orchestrator

- blocked findings: none.
- repeat offenders: none.
- warnings worth a human eye: no repair-evidence receipt for T077 (carried).
