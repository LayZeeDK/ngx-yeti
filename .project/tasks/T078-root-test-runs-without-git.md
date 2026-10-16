---
id: T078
title: Make the root test target run in full in a checkout without .git, listing apps/ and packages/ without Git and running run-job's dry-run tests without a skip
wave: 17
deps: [T070, T077]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - tools/playwright/navigation-budget.test.mjs
  - tools/ci-local/run-job.test.mjs
  - tools/ci-local/run-job.mjs
---

# T078 — Make the root test target run in full in a checkout without .git, listing apps/ and packages/ without Git and running run-job's dry-run tests without a skip

## Context

Final-review patch, ship attempt 2, finding P001 of `.project/review/PATCH-FINDINGS.md` (reviewed HEAD d63e7e0, source `.project/review/final-gap-1.md`, locator "Risk: project Verify"), fixed in M002 under Lars's ruling of 2026-10-16, verbatim: "Approve, resolve in M002".

Evidence, verbatim: "Project Verify failed at the reviewed commit."

Fix direction, verbatim: "Resolve the recorded command failure before shipping."

Measured by the orchestrator (2026-10-16, from the recorded output in `.project/build/verify-ledger.jsonl` at d63e7e0): the project Verify failed in its `node tools/ci-local/run-job.mjs ci unit` step. In the container, `node --test ... tools/playwright/navigation-budget.test.mjs ...` (the root `@ngx-yeti/source:test` target) throws at module load, navigation-budget.test.mjs:274: `execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z', '--', 'apps', 'packages'])` exits 128, `fatal: not a git repository (or any of the parent directories): .git`. run-job ships the tree into the container by tar (run-job.mjs:527-529, :575, :643), so there is no .git. ci unit otherwise passed 70 of 73 (2 skipped, one being run-job.test.mjs's own skip "git ls-files refused the checkout ... not a git repository"). Later Verify steps did not run. The machine was quiet (16.2/15.1 GB free). T077's Verify ran the root test natively (with .git) and only the `ci e2e` leg in a container, which is why it passed there.

Measured by the planner (2026-10-16, reading the same ledger entry): both skips of that leg are in tools/ci-local/run-job.test.mjs, "every dry-run leg mounts the report folder legPaths names for it" (`{ skip: gitRefusal }` at :160) and "every container job of the real workflows dry-runs" (:298), each with "# git ls-files refused the checkout: Error: Command failed: git ls-files -z". `gitRefusal` (:144-155) asks Git, and the dry run reaches `sourceFiles()` (run-job.mjs:528-536, called at :725), which runs `git ls-files -co --exclude-standard -z`. A guard that skips in the container leg is not a guard there. Inferred, not measurable before a push: GitHub's `unit` container may refuse Git too, on "dubious ownership" (T061 Context, triage item 5), so the module-load failure can also hit CI.

Pattern search by the planner at d63e7e0 (rg for `git`, `.git`, `execFileSync`, `spawnSync` and `spawn(` over apps/, packages/, tools/ and .claude/; the container jobs are ci.yml `unit` (`run-many -t test test-storybook`) and `e2e` (`run-many -t e2e`) and floor.yml `webkit-26-4` and `firefox-146-e2e` (`nx test ngx-yeti -- --project=browser` and `run-many -t e2e`)):

- tools/playwright/navigation-budget.test.mjs:274, root `test`, runs in `unit`: fails without .git. In this task.
- tools/ci-local/run-job.test.mjs:144-160 and :298, root `test`, runs in `unit`: two tests skip without .git. In this task, with tools/ci-local/run-job.mjs `sourceFiles()`.
- tools/verification/lars-verify-spec.test.mjs:88 and :106 and tools/verification/lars-verify-spec.mjs:252, root `test`: safe. The test creates its own repository in a temporary folder with `git init` and needs only the git binary, which the image has (the leg's `fatal:` line came from git itself); all 19 of its tests passed in the d63e7e0 leg (ledger).
- tools/typecheck/scripts-coverage.test.mjs:30: safe. It runs in `@ngx-yeti/source:typecheck`, which only ci.yml `static` runs (:32), and `static` has no `container` (:21-32), so run-job never runs it.
- tools/yeti/vendor-yeti.mjs:37-43: safe. Only a pin move runs it by hand (yeti-pin skill); no project.json, nx.json or workflow names it.
- .claude/skills/control-*/scripts/control.mjs and fingerprint.mjs (`.git` stat, `git ls-files`): safe. No Nx target or workflow runs them or their tests.
- No `.ts`, `.mts` or `.tsx` file under apps/ or packages/ spawns git: the only subprocesses there are packages/ngx-yeti/styles/src/yeti-rank.node.spec.ts:14 (node with tools/yeti/generate-sources.mjs, which spawns nothing) and tools/playwright/playwright-configs.test.mjs:32 (node).

## Approach

- One listing in tools/playwright/navigation-budget.test.mjs that needs no `.git` and keeps the three properties T077 gave it: only regular files, ignored output left out (what the root `.gitignore` excludes, as Nx's input globs leave it out of the target's hash), and the tracked dot folder `packages/ngx-yeti/.storybook/` covered. The coder picks the means and records why: Nx's workspace glob (the walker that hashes the target's inputs honours `.gitignore` and `.nxignore` without Git; prefer an export of `@nx/devkit`, which `apps/ngx-yeti-e2e/src/color-scheme-wrappers.spec.ts` already imports), or a walk that applies `.gitignore` itself. A listing that branches on whether `.git` exists must give the same list on the repository with and without it, shown in the native run.
- The listing works inside the run-job leg, where earlier tasks of the same run have already written ignored output (builds, `storybook-static`, `__screenshots__`) into the shipped tree.
- Keep T077's `existsSync` handling: a tracked file deleted from the working tree does not make the scan throw.
- run-job.test.mjs: no skip tied to Git. The two dry-run tests run in the leg; the dry run either lists the tree without Git or takes the list from the test (export or injection, as `parseArgs`, `legChecks` and `quote` are exported). A real run keeps shipping exactly `git ls-files -co --exclude-standard` filtered by `existsSync`; what reaches a container does not change. The dry run's printed shape does not change.
- No new dependency in package.json and no new module, so the root `test` target's `inputs` (which hash `tools/playwright/**/*` and the two run-job files) stay complete without a project.json edit.
- Typed scripts: keep `// @ts-check` and the JSDoc types; no `any`, no unchecked assertion; `npm exec nx -- typecheck @ngx-yeti/source` stays at 0 errors.
- Comments say only what the code cannot; no planning ids, dates or measurements in code.
- Read `.claude/skills/ngx-yeti-testing/SKILL.md`, `references/ci-local.md` and AGENTS.md "Scripts" and "Run CI locally" first.

## Interface contract

- `files` in tools/playwright/navigation-budget.test.mjs is a `string[]` of repository-relative, `/`-separated paths of regular files under `apps/` and `packages/` whose names end in `.ts`, `.mts`, `.mjs` or `.tsx`, with ignored output left out; every consumer resolves each entry against the checkout as a file-system path.

## Intent coverage

- None

## Acceptance criteria

1. `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache` passes natively, and inside `node tools/ci-local/run-job.mjs ci unit`, whose tree has no `.git`, the root test's `node --test` summary reads `fail 0` and `skipped 0` and the leg passes.
2. navigation-budget.test.mjs proves its listing on a temporary tree with no `.git` that holds a `.gitignore`d directory named like a spec file (for example `__screenshots__/x.spec.ts/`), a `.gitignore`d source file, plain source files and a dot folder with a source file: exactly the plain files and the dot folder's file are listed, and each is a regular file. On the repository, `packages/ngx-yeti/.storybook/main.ts` is listed. The temporary-tree test is shown failing against d63e7e0's Git listing first, and the Log records that run.
3. tools/ci-local/run-job.test.mjs has no skip tied to Git; "every dry-run leg mounts the report folder legPaths names for it" and "every container job of the real workflows dry-runs" pass natively and in the leg. A real run's shipped list is unchanged.
4. The Log confirms each site of the Context's pattern search at the task's base: fixed in this task's files, or still safe for the stated reason. A new site that needs `.git` inside a container job blocks with `NEEDS-ORCHESTRATOR` instead of growing the files.
5. `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` passes and `npx prettier --check` passes on the three files.

## Verify

```bash
set -o pipefail && npm ci && npx playwright install chromium && npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && npx prettier --check tools/playwright/navigation-budget.test.mjs tools/ci-local/run-job.test.mjs tools/ci-local/run-job.mjs && log="$(mktemp)" && node tools/ci-local/run-job.mjs ci unit 2>&1 | tee "$log" && rg -q 'skipped 0' "$log" && ! rg -q 'skipped [1-9]|fail [1-9]' "$log"; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-16 — created by planner
