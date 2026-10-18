# Review — wave 16, cycle 1

Wave verdict: pass
Cycle: 1
Depth: full
Tasks reviewed: 1

## T077 — Fix wave 15 cycle 1 review findings in T071: pass

Landing 035c6086083be2c7fe203df162459aa0fdbb83f4 on base be4fd37b9d6f6c162e162568f3aa20ad4e1988d3 (the task file's `base`; `git log --format='%H %P'` shows the landing's parent is that base, serial). Review base f62d9da1bb25ce4bc859e384b9d1c0d1bf14e4d7. `git show --stat 035c608`: two paths, tools/playwright/navigation-budget.test.mjs (in `files`) and the task file. The task file diff changes only `status`, `agent` and `base` and appends Log entries; the contract body is unchanged. The product patch replaces the `globSync` scan (and `buildOutput`, the `basename` import and `exclude`) with `execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z', '--', 'apps', 'packages'])` filtered to the four extensions and to existing paths (navigation-budget.test.mjs:274-283), and adds the test `scans only regular files` (:333-339). That is the fix direction the Review findings `t071_ac5` give. apps/yeti-app-e2e/src/fixture-app.spec.ts and project.json are unchanged; project.json already runs the file (the Verify's `rg -q -F` step and the `node --test ... tools/playwright/navigation-budget.test.mjs` line of the recorded root `test` output).

- ✅ `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache` and `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` pass, lint and typecheck of yeti-app-e2e pass, and prettier passes on the three files. — pass. Recorded isolated Verify (.project/build/verify-ledger.jsonl last line, commit 035c608, sidecar gsd-path-verify/task-t077-verify, exit 0; finish-T077.json `landed[0].verify.exit_code` 0; its verify.json stdout reads `✔ scans only regular files`, `Successfully ran target test for project @ngx-yeti/source`, `Successfully ran target typecheck for project @ngx-yeti/source`, `Successfully ran targets lint, typecheck for project yeti-app-e2e`, then the prettier step and `Successfully ran target e2e for 3 projects` in the Firefox development leg). That Verify ran in a fresh sidecar with no git-ignored folder, the same blind spot that let cycle 1's defect pass, so this review re-ran the one test file on the condition the finding names: in this review's sidecar at f62d9da, after `npm ci --ignore-scripts` and `mkdir -p packages/ngx-yeti/lift/src/__screenshots__/lift.spec.ts` (git-ignored; `git status --short` showed only the staged review), `node --test tools/playwright/navigation-budget.test.mjs` gave tests 5, pass 5, fail 0. Positive control in the same sidecar with the same planted folder: the be4fd37 version of the file (`git show be4fd37:tools/playwright/navigation-budget.test.mjs`) gave tests 4, pass 3, fail 1, `Error: EISDIR: illegal operation on a directory, read`, so the check could fail and the patch is what makes it pass. The coder's red/green in the primary checkout with its three real ignored folders agrees (T077 Log: old glob tests 5, fail 2, listing the three folders; new code tests 5, pass 5). Both temporary files were removed after the run.

Warnings (non-blocking):
- No `review_findings.py repair-evidence` receipt was used: the helper refuses it for wave 15 cycle 1 with "repair base contains unlinked changes to original product", because T076 (72af0fc) also edited project.json, a T071 file, after T071 landed (as the brief records). Wave 8 cycle 2 met a refusal and reviewed without a receipt; this review did the same and judged the criterion on T077's landing patch, its recorded Verify and the re-run above. The orchestrator owns the missing provenance record.
- T077's Verify, like T071's, runs in a fresh worktree and so cannot see the git-ignored-folder case by itself; the new test `scans only regular files` now covers it from inside the root `test` target, and the planted-folder re-run above is this review's evidence that it does.
- The `existsSync` filter (navigation-budget.test.mjs:282) also drops a tracked file deleted from the working tree without `git rm`; the scan then skips it silently. It defeats no criterion (such a file is not on disk to load pages).
- The scan set changed from a glob to Git's view: git-ignored source under apps/ or packages/ is no longer scanned, and the tracked dot folder packages/ngx-yeti/.storybook/ now is, as the finding asked. Not a criterion change.

Contract violations (blocking):
- none

## Summary for orchestrator

- blocked findings: none.
- repeat offenders: none. The criterion failed once (wave 15 cycle 1, T071 AC5) and passes here.
- warnings worth a human eye: no repair-evidence receipt (helper refuses it because T076 edited project.json; judged on patch, Verify and a planted-folder re-run); the Verify itself runs in a fresh worktree and relies on the new regular-files test to catch the ignored-folder case.
