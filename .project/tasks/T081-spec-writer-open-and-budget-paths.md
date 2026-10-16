---
id: T081
title: Refuse an --open value that leaves the app's URL in the lars-verify spec writer, and resolve the loop-budget gate's listed paths as file-system paths
wave: 17
deps: [T076, T078]
status: done
agent: build_t081
base: 72ef155eec8ea86c05ef06294ec9f4e4f5df3fe1
worktree: null
task_branch: null
files:
  - tools/verification/lars-verify-spec.mjs
  - tools/verification/lars-verify-spec.test.mjs
  - tools/playwright/navigation-budget.test.mjs
---

# T081 — Refuse an --open value that leaves the app's URL in the lars-verify spec writer, and resolve the loop-budget gate's listed paths as file-system paths

## Context

Final-review patch, ship attempt 2, finding P004 of `.project/review/PATCH-FINDINGS.md` (reviewed HEAD d63e7e0, source `.project/review/final-gap-5.md`, locator "Risk: tools/verification/lars-verify-spec.mjs accepts an --open value that changes the url's host or port, and tools/playwright/navigation-budget.test.mjs resolves listed paths with new URL, so a lars-verify spec or the loop-budget gate can check the wrong target"), fixed in M002 under Lars's rulings, verbatim: "Approve, resolve in M002" (2026-10-16) and "Verification artifacts should be runnable by /lars-verify" (2026-10-16).

Evidence, verbatim: "The risk holds on both halves, with measured evidence for each. 1. The spec writer accepts an `--open` value that changes the port of a control-ngx-yeti-storybook spec ("1/iframe.html" gives port 44001). It also accepts one that leaves the control-yeti-app `/sub/` base (`../` and `%2e%2e/`). This contradicts the writer's stated guard and the T076 review-fix intent. Such a spec drives whatever listens on the other port, or the server root, so /lars-verify can return a verdict for the wrong target. 2. The loop-budget gate silently skips a listed file whose name holds `#` or `?`. It reads a different file for a `%2e%2e` or `%20` name. A fixed-budget loop in `mutant#x.spec.ts` passed the gate, and the same content under a plain name failed it. Both cases are latent. No committed `--open` example and no file in the repository uses such a value or name today, and the severity is low. They are still demonstrated gaps in guards that exist to stop exactly these cases."

Fix direction, verbatim: "(1) tools/verification/lars-verify-spec.mjs: in the `--open` guard at :244, also refuse a value whose first character is a digit, because only digits can extend a url that ends in a port. Also refuse any `/`-separated segment (before `?` or `#`) that equals `.` or `..` after decoding `%2e`/`%2E`. Add three refusal cases to tools/verification/lars-verify-spec.test.mjs: `--open 1/iframe.html`, `--open ../card` and `--open %2e%2e/card`. Each should expect exit 2, the "is not a path below the app's URL" message, and nothing written. Run them first against the current writer, where they fail.; (2) tools/playwright/navigation-budget.test.mjs: resolve listed paths as file-system paths, not URL references. Use `join(fileURLToPath(root), path)` from node:path and node:url at :282, :335 and :347. Add a test that writes an untracked `apps/.../loop#x.spec.ts` with a fixed-budget `goto` loop and expects the repository scan to flag it. Alternatively, add an inline unit check that the resolved path for `a#b.spec.ts` ends in `a#b.spec.ts`. That test fails first against the current `new URL` resolution, then passes.; (3) Check: `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache`."

Measured by the gap reviewer at d63e7e0 (final-gap-5.md): with the storybook url `http://localhost:4400`, `--open 1/iframe.html` gives host `localhost:44001` and `--open 0` gives `localhost:44000`; with the yeti-app url `http://localhost:4300/sub/`, `--open ../`, `--open ..` and `--open %2e%2e/%2e%2e/` resolve to `/` on port 4300; `#` and `?` values stay on the right host and port. Through `fileURLToPath(new URL(path, root))`, `apps/a/x#b.spec.ts` and `apps/a/x?b.spec.ts` resolve to `apps\a\x`, `apps/%2e%2e/tools/evil.ts` to `tools\evil.ts`, and `apps/a/x%20y.spec.ts` to `apps\a\x y.spec.ts`. No listed path holds `#`, `?` or `%` today.

In the Evidence quote, one code span ("1/iframe.html") is set in double quotes instead of backticks, because the task-brief gate reads a backticked span as a repository path; the text is otherwise verbatim.

T078 lands first and rewrites the listing in navigation-budget.test.mjs, so the line numbers above move; find each `new URL(path, root)` use by its code.

## Approach

- The `--open` guard keeps its current refusals and message and adds the two in the Fix direction (a leading digit; a `.` or `..` segment before `?` or `#`, after decoding `%2e` and `%2E`). The documented value `/iframe.html?id=<story-id>&viewMode=story` (control-ngx-yeti-storybook features/stories.md:65), `card` (T076's Verify) and an empty `--open` stay accepted.
- Every read of a listed path in navigation-budget.test.mjs resolves it as a file-system path under the checkout; no `new URL(path, root)` is left for a listed path. A name with `#`, `?`, `%2e%2e` or `%20` reads exactly the file of that name.
- The new navigation-budget test plants nothing in the repository that can outlive it: a temporary tree, or an untracked file removed in a `finally`, or the inline resolution check the Fix direction allows.
- Typed scripts: keep `// @ts-check` and the JSDoc types; `npm exec nx -- typecheck @ngx-yeti/source` stays at 0 errors.
- Comments say only what the code cannot; no planning ids, dates or measurements in code.

## Interface contract

- `files` in tools/playwright/navigation-budget.test.mjs is a `string[]` of repository-relative, `/`-separated paths of regular files under `apps/` and `packages/` whose names end in `.ts`, `.mts`, `.mjs` or `.tsx`, with ignored output left out; every consumer resolves each entry against the checkout as a file-system path.

## Intent coverage

- None

## Acceptance criteria

1. `lars-verify-spec.mjs --open 1/iframe.html`, `--open ../card` and `--open %2e%2e/card` each exit 2 with "is not a path below the app's URL" and write nothing; three tests in lars-verify-spec.test.mjs prove it and fail against d63e7e0's writer (Log).
2. `--open "/iframe.html?id=button--variants&viewMode=story"`, `--open card` and an empty `--open` are still written as before (existing tests, or one more case).
3. navigation-budget.test.mjs resolves listed paths as file-system paths, and a test proves that a fixed-budget loop in a file whose name holds `#` is flagged (or that the resolved path of `a#b.spec.ts` ends in `a#b.spec.ts`); it fails against the `new URL` resolution first (Log).
4. `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache` and `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` pass, and `npx prettier --check` passes on the three files.

## Verify

```bash
set -o pipefail && npm ci && npx playwright install chromium && rg -q -- '1/iframe[.]html' tools/verification/lars-verify-spec.test.mjs && rg -q -F -- '../card' tools/verification/lars-verify-spec.test.mjs && rg -q -F -- '%2e%2e/card' tools/verification/lars-verify-spec.test.mjs && ! rg -q -F 'new URL(path, root)' tools/playwright/navigation-budget.test.mjs && node --test tools/verification/lars-verify-spec.test.mjs tools/playwright/navigation-budget.test.mjs && npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && npx prettier --check tools/verification/lars-verify-spec.mjs tools/verification/lars-verify-spec.test.mjs tools/playwright/navigation-budget.test.mjs; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: no

## Log

- 2026-10-16 — created by planner
- 2026-10-17 — build_t081: Red first, measured at base 72ef155 (whose writer guard matches d63e7e0's) with only the new tests added: `node --test tools/verification/lars-verify-spec.test.mjs tools/playwright/navigation-budget.test.mjs` gave 31 tests, 27 pass, 4 fail. The 4 failures: the three new refusals (`--open 1/iframe.html`, `--open ../card`, `--open %2e%2e/card` exited 0 and wrote a spec), and the new navigation-budget test "reads a listed file whose name holds #, %2e%2e or %20", which failed with ENOENT on `apps\loop.spec.ts` because `new URL` resolution read the wrong file.
- 2026-10-17 — build_t081: Implementation. In tools/verification/lars-verify-spec.mjs, the `--open` guard keeps its earlier refusals and message, and also refuses a leading digit and any `.` or `..` segment before `?`/`#` after `%2e`/`%2E` decoding. In tools/verification/lars-verify-spec.test.mjs: three refusal cases (exit 2, the "is not a path below the app's URL" message, no stdout, no out dir), plus one accept case for `/iframe.html?id=button--variants&viewMode=story`. `card` (default args) and empty `--open` stay covered by existing tests. In tools/playwright/navigation-budget.test.mjs: listed paths are now read with `join(checkout, path)`, and the repository scan moved into `fixedBudgetLoops(directory)`, which lists through `sourceFiles` and reads with `join`. The new test plants `apps/a/loop#x.spec.ts`, `apps/a/%2e%2e/loop.spec.ts` and `apps/a/loop%20x.spec.ts` in a temporary tree (removed in `finally`) and expects each to be flagged. `?` is left out of the planted names because Windows file names cannot hold `?`. No `new URL(path, root)` is left.
- 2026-10-17 — build_t081: Verify ran exactly as written through the heavy lock: exit 0. Counts: node --test of the two files 31 tests / 31 pass; `@ngx-yeti/source:test` 85 tests / 85 pass; `@ngx-yeti/source:typecheck` passed with 0 errors (scripts-coverage 1/1); prettier --check on the three files passed. A first Verify run failed at typecheck (TS2532 on `split(...)[0]`); I changed it to `.replace(/[?#].*/s, '')` and re-ran the whole Verify, which passed. Rule 13: `npx prettier --check .` passed. `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD` (through the lock) succeeded for 9 projects and the 2 tasks they depend on: 25 tasks, 7 from cache, 0 failed.
- 2026-10-16 — orchestrator Verify (isolate gsd-path-task/T081): pass, exit 0; output tail:
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
