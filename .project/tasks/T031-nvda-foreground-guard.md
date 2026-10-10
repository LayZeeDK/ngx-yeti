---
id: T031
title: Check the foreground window before every NVDA key and prove the guard refuses a wrong window
wave: 2
deps: [T004]
status: pending
agent: null
base: null
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
