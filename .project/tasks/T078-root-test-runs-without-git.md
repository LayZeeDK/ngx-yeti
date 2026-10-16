---
id: T078
title: Make the root test target run in full in a checkout without .git, listing apps/ and packages/ without Git and running run-job's dry-run tests without a skip
wave: 17
deps: [T070, T077]
status: done
agent: build_t078
base: 23b3101b03a2500226db5b6b13c4948ce106cdb0
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
- 2026-10-17 — build_t078 (coder): implementation. navigation-budget.test.mjs lists with Nx's native `WorkspaceContext(directory, cacheDir).glob(['{apps,packages}/**/*.{ts,mts,mjs,tsx}'])` from `nx/src/native` (an explicit `exports` entry of the installed nx; default import, since Node cannot see its named CJS exports). Why: it is the walker that hashes the root test target's inputs (same glob syntax as project.json `inputs`); nx's walker.rs sets `require_git(false)` and adds `.nxignore`, so .gitignore applies with or without .git, and it yields files only. `@nx/devkit`'s `glob`/`globAsync` were not used: both need a `Tree` (only the internal `FsTree` builds one for a real folder), `globAsync` routes to the daemon, which globs the daemon's workspace instead of a temporary tree, and both share one module-level context whose data folder follows NX_WORKSPACE_DATA_DIRECTORY; the native class with a throwaway cache folder avoids all three. The `existsSync` filter stays. No branch on `.git`. Native comparison on this worktree: the Nx list and `git ls-files -co --exclude-standard -- apps packages` filtered to the four extensions are the same 361 paths (byte-sorted diff empty). run-job.mjs: `run` is exported and takes an optional `files` list (`files ?? sourceFiles()` at the same point as before); the CLI passes none, so a real run and the CLI dry run still list with `git ls-files -co --exclude-standard -z` filtered by `existsSync`, and the printed dry-run shape is unchanged. run-job.test.mjs: `gitRefusal` and both `{ skip }` options are gone; the two dry-run tests call `run(parseArgs([...args, '--dry-run']), ['package.json', 'package-lock.json'])` in-process with `console.log` mocked (node:test `mock.method`), so they never ask Git.
- 2026-10-17 — build_t078: red first. The new temp-tree test ("lists the source files .gitignore leaves in, in a tree without .git") ran against d63e7e0's Git listing (`git ls-files -co --exclude-standard -z -- apps packages` with cwd at the tree): tests 7, pass 6, fail 1, the new test failing with `fatal: not a git repository`. After the switch: tests 7, pass 7, fail 0. The fixture's ignored directory then held `__screenshots__/x.spec.ts/shot.ts` (a .ts file, so a missed ignore or a listed directory both fail it).
- 2026-10-17 — build_t078: pattern search re-run at base (rg for git, .git, execFileSync, spawnSync, spawn( over apps/, packages/, tools/, .claude/). Fixed here: navigation-budget.test.mjs listing; run-job.test.mjs :144-160 and :298 skips (run-job.mjs `sourceFiles()` reached by the dry run). Still safe for the stated reasons: lars-verify-spec.test.mjs :88/:106 and lars-verify-spec.mjs :252 (own `git init` repo; 19 tests pass in the leg below as part of the 79), scripts-coverage.test.mjs :30 (typecheck target, `static` has no container), vendor-yeti.mjs :37-43 (pin move only), .claude control.mjs/fingerprint.mjs (no target or workflow runs them), yeti-rank.node.spec.ts :14 and playwright-configs.test.mjs :32 (spawn node). Other hits checked: tools/package/pack-check.mjs spawns `npm pack` and other non-Git commands only, run by ci.yml's build step without a container; tools/playwright-server/container.mjs spawns node, server.mjs spawns docker and is not in the root test. No new site needs .git in a container job.
- 2026-10-17 — build_t078: Verify ran as written (through the heavy lock, HEAVY_DOCKER=1), exit 0. Native `@ngx-yeti/source:test`: tests 79, pass 79, fail 0, skipped 0. typecheck @ngx-yeti/source: pass (tsc 0 errors; scripts-coverage 1/1). prettier --check on the three files: pass. `run-job.mjs ci unit` (tree without .git): `=== pass ci-unit in 3 m 27 s`; nx test + test-storybook for 5 projects passed; the root test ran after the other projects' tests and reported tests 79, pass 79, fail 0, skipped 0, with both dry-run tests and all four listing tests passing.
- 2026-10-17 — build_t078: rule 13 checks. `npx prettier --check .`: all files pass. `nx affected --base=HEAD` (9 projects): lint + typecheck pass (18 tasks); test pass for 5 projects (vitest 1, 94, 705 tests and the root 79/79, 0 skipped); test-storybook (ngx-yeti, through the lock) 25 files, 170 tests passed. Git index untouched.
- 2026-10-17 — build_t078: review fixes (code F2, F3). F2: run-job.mjs `sourceFiles` is exported and takes the folder to list (`run` passes `root`; same `git ls-files -co --exclude-standard -z` plus `existsSync` filter). New run-job.test.mjs test "a real run ships the tracked and untracked files that exist, not the ignored ones": a temporary `git init` repository with tracked `.gitignore`/`tracked.txt`, tracked `deleted.txt` removed from disk without `git rm`, `untracked.txt` and ignored `ignored.txt`; expects exactly `.gitignore`, `tracked.txt`, `untracked.txt`. Red: with `-o` dropped from the listing it failed (tests 1, pass 0, fail 1, `untracked.txt` missing); restored: run-job.test.mjs tests 14, pass 14, fail 0, skipped 0. F3: navigation-budget's no-.git fixture now also holds `packages/lib/src/plain.mts` and `plain.tsx`, both expected in the list (7/7 pass).
- 2026-10-17 — build_t078: Verify re-run as written (heavy lock, HEAVY_DOCKER=1, 13873 MB free), exit 0. Native root test: tests 80, pass 80, fail 0, skipped 0. typecheck @ngx-yeti/source pass. prettier on the three files pass. `run-job.mjs ci unit`: `=== pass ci-unit in 3 m 8 s`; test + test-storybook for 5 projects passed; root test in the leg tests 80, pass 80, fail 0, skipped 0 (the new Git-repository test passes there too). Also `npx prettier --check .` pass; `nx affected -t lint typecheck --base=HEAD` pass for 9 projects. Git index untouched.
- 2026-10-16 — orchestrator Verify (isolate gsd-path-task/T078): pass, exit 0; output tail:
  ```
  npm warn deprecated @angular/platform-browser-dynamic@22.2.1: @angular/platform-browser-dynamic is deprecated. Use `@angular/platform-browser` instead.
  npm warn deprecated @yuku-parser/binding-win32-arm64@0.10.2: yuku-parser runs on yuku-core since 0.14
  npm warn deprecated @angular/animations@22.2.1: @angular/animations is deprecated. Use `animate.enter` and `animate.leave` instead. For more information see: https://v22.angular.dev/guide/animations.
  npm warn deprecated @ngtools/webpack@22.2.1: Angular's Webpack support is deprecated. Use the esbuild and Vite-based "@angular/build" package instead.
  npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
  npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
  npm warn deprecated @angular-devkit/build-angular@22.2.1: Angular's Webpack support is deprecated. Use the esbuild and Vite-based "@angular/build" package instead.
  npm warn deprecated eslint@9.39.5: This version is no longer supported. Please see https://eslint.org/version-support for other options.
  npm warn allow-scripts 9 packages have install scripts not yet covered by allowScripts:
  npm warn allow-scripts   esbuild@0.27.7 (postinstall: node install.js)
  npm warn allow-scripts   @parcel/watcher@2.6.0 (install: node scripts/build-from-source.js)
  npm warn allow-scripts   edgedriver@6.3.1 (install: test -f ./dist/install.js && node ./dist/install.js || echo "Skipping install, project not build!")
  npm warn allow-scripts   esbuild@0.28.2 (postinstall: node install.js)
  npm warn allow-scripts   geckodriver@6.1.1 (postinstall: test -f ./dist/install.js && node ./dist/install.js || echo "Skipping install, project not built!")
  npm warn allow-scripts   lmdb@3.5.6 (install: node-gyp-build-optional-packages)
  npm warn allow-scripts   msgpackr-extract@3.0.4 (install: node-gyp-build-optional-packages)
  npm warn allow-scripts   nx@23.2.1 (postinstall: node -e "try{require('./dist/bin/post-install')}catch(e){}")
  npm warn allow-scripts   esbuild@0.25.12 (postinstall: node install.js)
  npm warn allow-scripts
  npm warn allow-scripts Run `npm approve-scripts --allow-scripts-pending` to review, or `npm approve-scripts <pkg>` to allow.
  ```
