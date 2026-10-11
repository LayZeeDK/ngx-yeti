---
id: T031
title: Check the foreground window before every NVDA key and prove the guard refuses a wrong window
wave: 2
deps: [T004]
status: done
agent: build_T031
base: 3c65638f70b81f54fecec7b45f9004f3acc76354
worktree: null
task_branch: null
files:
  - apps/screen-reader-e2e/src/support/nvda.ts
  - apps/screen-reader-e2e/src/focus-guard.nvda.ts
  - apps/screen-reader-e2e/screen-reader.config.mts
  - references/ci-local.md
---

# T031 — Check the foreground window before every NVDA key and prove the guard refuses a wrong window

## Context

Build repair. User ruling, verbatim (2026-10-11): "Wave-1 defects: Approve recommendation." The recommendation it approves: "A patch wave through plan: one or two fix tasks appended to M002, each with its own Verify and review. This costs a plan re-gate with your approval. It fixes `doctor` before wave-3 coders rely on it to walk their routes, and the stub tests before 28 routes depend on them." This task fixes the confirmed defect in the NVDA lane driver T004 landed (7ad619f). It breaks no acceptance criterion of T004, so T004's contract stays as it is. The evidence, verbatim from the hand-off:

D4. The NVDA focus guard accepts any focus report containing "document"

- Where: `apps/screen-reader-e2e/src/support/nvda.ts:81-92`, and `top()` at `:99-103`.
- Observed: the guard is one case-sensitive `phrase.includes('document')`, checked once per `open`; nothing re-checks before `Control+Home`, Down, or the list-item key of later steps. `references/ci-local.md` records that another window did take the foreground between tests in Firefox.
- Fix direction: re-read the foreground window title against the token before each key-sending move (`foreground(token)` already returns it), and match NVDA's phrase against the story's start marker rather than the word "document".
- Landed by: T004 (7ad619f). T027 (wave 5) extends the same harness files.

Why it matters (T004's Log, measured): NVDA's keys go to whichever window has the foreground, and before the first guard existed they went into the terminal that ran the lane. T004 also recorded the phrase NVDA speaks for the story document on its focus report: `screen-reader-e 2e-518862816, document, focused, read only`. NVDA speaks the window title token `screen-reader-e2e-518862816` with a space inside it. T027 adds five more test files and new moves to this driver in wave 5, so the guard must cover every key before then.

## Approach

- Guard every key. In `apps/screen-reader-e2e/src/support/nvda.ts`, each key the lane sends (the focus report of `open`, `Control+Home` and the first move of `top`, the list-item key of `nextListItem`) goes through one guard that first reads the title of the foreground window and throws, naming that title and sending nothing, unless it holds the token `activate` gave this story's window. The Interface contract makes that guard the only way a key leaves the lane, so the moves T027 adds are covered too.
- The check before a key only reads. The script behind `foreground(token)` also raises the story window (it minimizes, restores, and calls `SetForegroundWindow`); raising in the middle of a walk makes NVDA speak and can move its position, so a window that lost the foreground fails the test loudly and the retry starts clean. Only `open` raises. Give the guard a path that reads the foreground title and changes nothing.
- Match the story, not the word. `open` accepts NVDA's focus report only when it holds this story's own text: the window title token as NVDA speaks it (see the measured phrase in Context; compare without depending on where NVDA puts spaces) or the start marker `startMarkerText` of `apps/screen-reader-e2e/src/support/screen-reader.ts`. A report from another application's document, which also contains "document", is refused. Record the phrases NVDA speaks for the accepted report in the Log.
- Keep the driver's shape: `Lane` and `Driver` in `apps/screen-reader-e2e/src/support/screen-reader.ts` and `apps/screen-reader-e2e/src/support/voiceover.ts` are not in this task's files and do not change; `apps/screen-reader-e2e/src/card.screen-reader.ts` keeps passing unchanged.
- The proof is an automated test, never a manual step (the user's rule that automated screen-reader tests replace manual ones). It lives in `apps/screen-reader-e2e/src/focus-guard.nvda.ts` and runs in the `nvda` lane only: `apps/screen-reader-e2e/screen-reader.config.mts` matches `*.nvda.ts` files for the `nvda` lane beside `*.screen-reader.ts`, and the `voiceover` lane never loads them, so no test is skipped by lane and the VoiceOver lane never imports the NVDA driver. The test opens a story through the `lane` fixture, brings a second window to the foreground (a decoy page with its own title token, for example Playwright's `page` fixture, which the lane's project launches headed, raised with the script `nvda.ts` already has; export what the test needs), confirms that Windows reports the decoy as the foreground window before any lane move, and then asserts that `top` and `nextListItem` each reject with the guard's error naming the decoy's title. If the decoy never gets the foreground the test fails without calling a lane move. On the current driver both moves resolve and send their keys to the decoy, which is harmless there. Where NVDA passes keys through to the decoy (a focused text field), also assert that the decoy recorded no keydown, and record in the Log whether that held.
- The test file also proves the phrase half without a second application: it gives the accepting check recorded phrases and asserts that the measured story report is accepted and that a report of another document (one with "document" but neither this story's token nor the start marker) is refused.
- Leave the worker usable: close the decoy, and the next `open` raises the story window again. This task adds the lane's second test file, so the local limit `references/ci-local.md` records (a second test in one Firefox worker can find the foreground taken by another window) can now show in a run; a pass on a retry is inside the lane's stated budget of 2 retries and is recorded in the Log, never hidden.
- Prohibition N9 (judgment): must not quietly fall back to a manual test, or skip or loosen a screen-reader check, when it flakes; a flaky VoiceOver check is retried within the job's stated retry budget and fixed or escalated to the user; it is never marked skipped, deleted, or turned into a manual test without the user's ruling. The same holds for the NVDA lane here: the guard makes a lost foreground a failure, and the retry budget in the config does not change.
- Run alone. The lane starts real NVDA, speaks, raises windows on the desktop, and serves the static Storybook on port 4401. While it runs, no other coder, Verify, or person may type, click, run a headed browser, or use port 4401 on this machine. The orchestrator dispatches this task in a round of its own and runs its Verify with nothing else running.
- CI: the `nvda` job of `.github/workflows/ci.yml` runs the lane in Playwright's Chromium and Firefox on `windows-2025`, so the new test must not depend on Edge. Locally `BROWSERS=msedge` is the native arm64 browser; also run the lane once without `BROWSERS` and record the result in the Log, as T004 did.
- Docs in this task: the NVDA lane section of `references/ci-local.md` says the lane checks once that NVDA reports the story document as the focus. Update it to the check before every key, the story-specific report, and the guard test; keep its measured notes.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md` (Screen readers), `.claude/skills/ngx-yeti-accessibility/SKILL.md`, `.claude/skills/type-safety/SKILL.md`. Read `references/ci-local.md` before running the lane.

## Interface contract

- Screen-reader project (T004): Nx project `screen-reader-e2e` at `apps/screen-reader-e2e` with targets `nvda` and `voiceover` and no `test`, `test-storybook`, or `e2e` target; one test file per item, `apps/screen-reader-e2e/src/{item}.screen-reader.ts`, run by both lanes; the lane drivers `apps/screen-reader-e2e/src/support/nvda.ts` and `apps/screen-reader-e2e/src/support/voiceover.ts` and the shared helpers in `apps/screen-reader-e2e/src/support/screen-reader.ts` open a static Storybook story by id and return the phrases the screen reader spoke; each lane writes the phrases it heard to a JSON report under dist/screen-reader-e2e/ (uploaded as an artifact in CI), and tests assert per-lane substrings.
- NVDA key guard (T031): in `apps/screen-reader-e2e/src/support/nvda.ts`, every key the NVDA lane sends, in `open`, `top`, `nextListItem`, and any move added later, goes through one guard that first reads the title of the foreground window and throws, sending nothing, unless the title holds the token `open` gave the story window; no lane move calls a Guidepup method that sends a key (such as `nvda.press`, `nvda.perform`, or `nvda.next`) outside that guard.

## Intent coverage

- None

## Acceptance criteria

1. Before every key the NVDA lane sends (the focus report of `open`, both keys of `top`, and the key of `nextListItem`), the driver reads the foreground window's title and, unless it holds this story's token, throws an error that names the title and sends no key. The read changes no window. On the current driver only `open` checks, once.
2. `open` accepts NVDA's focus report only when it holds this story's own text (the window title token as NVDA speaks it, or the start marker); a report that holds "document" but neither is refused.
3. An automated test in apps/screen-reader-e2e/src/focus-guard.nvda.ts, run by the `nvda` lane and not loaded by the `voiceover` lane, opens a story, brings a decoy window to the foreground, confirms the decoy has it, and asserts that `top` and `nextListItem` each reject with the guard's error naming the decoy's title; it also asserts with recorded phrases that the story's measured focus report is accepted and another document's report is refused. On the current driver the two moves resolve, so the test fails.
4. `BROWSERS=msedge npm exec nx -- run screen-reader-e2e:nvda` passes on this machine with real NVDA, running the card check and the guard test, within the lane's unchanged retry budget; the Log records the phrases heard, any retry, and the result of one run without `BROWSERS`.
5. `Lane` and `Driver` are unchanged, and no test of the lane is skipped, deleted, or turned into a manual step (N9).
6. The NVDA lane section of references/ci-local.md describes the check before every key and the guard test.
7. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f apps/screen-reader-e2e/src/focus-guard.nvda.ts && npm exec nx -- run-many -t lint typecheck -p screen-reader-e2e && SCREEN_READER=nvda BROWSERS=msedge npx --no-install playwright test -c apps/screen-reader-e2e/screen-reader.config.mts --list focus-guard.nvda.ts && BROWSERS=msedge npm exec nx -- run screen-reader-e2e:nvda; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-11 — created by planner (build repair of the wave 1 defect D4; user ruling "Wave-1 defects: Approve recommendation."). Run alone: real NVDA takes the desktop and port 4401. The Verify's `--list` step proves the `nvda` lane collects the guard test before the lane runs it (measured on the current tree: Playwright's `--list` exits 1 with "No tests found" for a file the lane does not match and 0 for card.screen-reader.ts). The Verify ends by stopping the Nx daemon and keeps its own exit code, as every pending task's does; run it exactly as written and never set NX_DAEMON.
- 2026-10-11 — coder (build_T031): implemented.
  - `src/support/nvda.ts`: every key (`open`'s focus report, `top`'s Control+Home and `nvda.next()`, `nextListItem`'s list-item key) goes through the module-private `sendKey(token, send)`. It reads the foreground title with a read-only PowerShell script (`foregroundTitle()`: GetForegroundWindow + GetWindowText, no raise), and when the title lacks the token from the last `open` it throws `NVDA lane: no key sent; the foreground window is "<title>", not the story window <token>.` without sending. `rg "nvda\.(press|perform|next|previous|type|act)"` finds the four calls, all inside `key(...)`. Only `open` raises the window (`activate`, which now returns its token and takes an optional name prefix). `acceptsFocusReport(phrases, token)` accepts a report only when it holds the token or `startMarkerText`, with whitespace stripped from both sides. `activate`, `foregroundTitle` and `acceptsFocusReport` are exported for the test. `Lane`, `Driver`, `voiceover.ts`, `screen-reader.ts` and `card.screen-reader.ts` are unchanged.
  - `screen-reader.config.mts`: `testMatch` adds `**/*.nvda.ts` for the `nvda` lane only. `src/focus-guard.nvda.ts` has two tests: (1) open `card--list`, launch a decoy browser of the same type (headed, closed in `finally`) holding a focused text field that records keydowns, raise it with `activate(decoy, 'decoy')`, assert `foregroundTitle()` contains the decoy token, then soft-assert that `top()` and `nextListItem()` reject with that title and that the decoy recorded no keydown; (2) recorded phrases: T004's `screen-reader-e 2e-518862816, document, focused, read only` and `Story start` are accepted, and `Untitled - Notepad, document, focused` is refused. `references/ci-local.md` NVDA lane section updated; its measured notes are kept.
  - Red proof on the unguarded driver (guard disabled and the old `includes('document')` check, `BROWSERS=msedge`, `--retries=0`): test 1 failed because `top()` resolved to `["list, with 3 items, heading, level 3, link, Weekend in the hills"]` and `nextListItem()` resolved to `["A day by the lake, link, heading, level 3, ..."]`. The decoy recorded no keydown even then, and NVDA spoke the story's content although Windows reported the decoy as foreground. Test 2 failed because the old check refused the `Story start` report. With the guard, both pass.
  - Phrases heard on the accepted focus report (Edge 154): `screen-reader-e 2e-<n>, document, focused, read only`. On a fresh worker's first test it was once `screen-reader-e 2e-554141534, document, http: slash slash localhost:4401 slash iframe dot html id equals card--list and view Mode equals story and embed equals true, focused, read only`, which is accepted by the token. Decoy keydown with the guard: none recorded (held).
  - Verify, exactly as written: exit 0. `npm ci` and `playwright install chromium` ok; lint and typecheck for screen-reader-e2e passed; `--list focus-guard.nvda.ts` exited 0; `nvda` lane: 2 passed, 1 flaky. card--list failed its first attempt and passed on retry #1. The guard let every key through on that attempt (foreground correct), but NVDA answered the three list-item keys with `Not supported in this document`. The retry heard the full list. This is inside the unchanged budget of 2 retries. A second `BROWSERS=msedge` lane run: 3 passed, no retry.
  - Without `BROWSERS` (Playwright Chromium 153 + Firefox 155, x64 under emulation): exit 1. Chromium passed all 3. In Firefox, card--list and the guard test failed all 3 attempts. Windows reported the Firefox window as foreground, so the guard sent the focus-report key, but NVDA reported `Terminal 1, ... edit, focused` (a VS Code terminal on this desktop), and `open` refused it. No further key was sent. This happens only when the Firefox worker follows the Chromium worker. On the base driver (7ad619f's nvda.ts restored temporarily, card only, `--retries=0`) the same sequence fails the same way, and Firefox alone passes on both the base and the T031 driver. So it predates T031 and is not caused by it; T004 recorded this run passing on 2026-10-10. Not fixed here (outside T031's criteria); it is a candidate for the orchestrator to route.
  - AC7 check: `npx prettier --check .` passed; `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD` (working tree; affected: @ngx-yeti/source, screen-reader-e2e) passed. Cleanup: no NVDA, Playwright browser or Storybook I started is left running; port 4401 is free; the Nx daemon is stopped.
- 2026-10-11 — orchestrator Verify (sidecar gsd-path-verify/task-t031-verify): pass, exit 0; output tail:
  ```
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
  [2m[WebServer] [22m(node:20156) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
  [2m[WebServer] [22m(Use `node --trace-deprecation ...` to show where the warning was created)
  (node:17108) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
  (Use `node --trace-deprecation ...` to show where the warning was created)
  ```
