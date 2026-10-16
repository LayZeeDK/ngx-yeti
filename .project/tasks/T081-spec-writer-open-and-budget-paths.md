---
id: T081
title: Refuse an --open value that leaves the app's URL in the lars-verify spec writer, and resolve the loop-budget gate's listed paths as file-system paths
wave: 17
deps: [T076, T078]
status: pending
agent: null
base: null
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
