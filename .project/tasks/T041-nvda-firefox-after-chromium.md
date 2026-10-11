---
id: T041
title: Make the NVDA lane pass in Firefox after Chromium and with several tests in one worker
wave: 4
deps: [T031]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - apps/screen-reader-e2e/src/support/nvda.ts
  - apps/screen-reader-e2e/src/focus-guard.nvda.ts
  - apps/screen-reader-e2e/screen-reader.config.mts
  - apps/screen-reader-e2e/project.json
  - references/ci-local.md
---

# T041 — Make the NVDA lane pass in Firefox after Chromium and with several tests in one worker

## Context

Build repair before wave 4. User ruling, verbatim (2026-10-11): "6: Is the mod active in this session? Approve other item 6 sub-items." Item 6 put two things to the user: this NVDA fix, which the ruling approves, and a lockout in the `down` command of the control-yeti-app skill, which the user deferred and which is not in scope here.

The defect (T031's Log, measured 2026-10-11; the orchestrator measured it twice more; it also happens on the driver as T004 landed it, so T031 did not cause it). With no `BROWSERS`, `npm exec nx -- run screen-reader-e2e:nvda` runs Playwright's Chromium 153 and then Firefox 155, both x64 under emulation on this machine. Chromium passed every test. In Firefox, `card--list` and the guard test failed all three attempts: Windows reported the Firefox window as the foreground window, so the key guard sent the focus-report key, but NVDA reported `Terminal 1, ... edit, focused` (a VS Code terminal on the desktop), and `open` refused that report; no further key was sent. It happens only when the Firefox worker follows the Chromium worker; Firefox alone passes. T004 recorded the same run passing on 2026-10-10. The orchestrator's hand-off words the symptom as focus left on Firefox's toolbar; that wording was not measured again for this brief, so start from what NVDA reports.

Why it matters. The `nvda` job of `.github/workflows/ci.yml` runs exactly this, Chromium and then Firefox in one invocation on `windows-2025`, and it has never run in CI. T027 adds five test files to each browser, and `references/ci-local.md` records a second local limit: a second test in one Firefox worker can find the foreground taken by another window. T027 and T028 must pass the lane in both browsers, and SC8 needs the job green.

How the lane works today, in `apps/screen-reader-e2e/src/support/nvda.ts`. There is one worker at a time, and each browser project gets a fresh one. Its `startReader` starts NVDA in English and launches one headed browser; its `stopReader` closes the browser and stops NVDA. `open` loads the story, adds the start marker, raises the window by its title token (a PowerShell script minimizes, restores, and calls `SetForegroundWindow` until Windows reports that window in the foreground), waits until NVDA is quiet, sends the focus-report key through the key guard, and accepts the report only when it holds the token or the start marker.

## Approach

- Find the cause before changing anything. In the failing sequence record, at the moment `open` refuses: the foreground window's title, what NVDA reports as its focus, and in the page `document.hasFocus()` and the active element. Compare with a Firefox-alone run that passes. Candidates to test, not a prescription: the keyboard focus sits in the browser's own chrome after the raise; NVDA, restarted between the two workers, keeps a stale focus object until a real focus event arrives; the first worker's shutdown overlaps the second worker's start. Write the cause and its evidence in the Log.
- Fix the cause inside the lane: the driver, the config, or the target's commands. `.github/workflows/ci.yml` is not in this task's files, so the job's command stays `npx nx run screen-reader-e2e:nvda`. If each browser needs a Playwright invocation of its own, give the `nvda` target of `apps/screen-reader-e2e/project.json` one command per browser.
- Keep the key guard contract: every key the lane sends goes through the guard, and only `open` raises a window. A key that moves the focus into the document is a key like any other. A wait is on a condition; a fixed sleep is not the fix.
- `Lane` and `Driver` in `apps/screen-reader-e2e/src/support/screen-reader.ts` do not change (that file is not in this task's files), and `apps/screen-reader-e2e/src/card.screen-reader.ts` keeps passing unchanged.
- Show the second-test case with an automated test in `apps/screen-reader-e2e/src/focus-guard.nvda.ts`: one test opens two stories in turn in the same worker, and both `open` calls return with the story's focus report. T027's five files then need nothing of their own.
- Prohibition N9 (judgment): must not quietly fall back to a manual test, or skip or loosen a screen-reader check, when it flakes; a flaky VoiceOver check is retried within the job's stated retry budget and fixed or escalated to the user; it is never marked skipped, deleted, or turned into a manual test without the user's ruling. The same holds for the NVDA lane here. The budget in the config stays at 2 retries. A pass on a retry is recorded in the Log with its cause, never hidden; the aim is a first-attempt pass in both browsers.
- Run alone. The lane starts real NVDA, speaks, raises windows on the desktop, and serves the static Storybook on port 4401. While it runs, no other coder, Verify, or person may type, click, run a headed browser, or use port 4401 on this machine. The orchestrator dispatches this task in a round of its own and runs its Verify with nothing else running.
- Docs in this task: the NVDA lane section of `references/ci-local.md` says that locally a second test in one Firefox worker can find the foreground taken. Replace that with the measured cause and what the lane now does, and add the measured runs (browsers, versions, attempts per test).
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md` (Screen readers), `.claude/skills/ngx-yeti-accessibility/SKILL.md`, and `.claude/skills/type-safety/SKILL.md`. Read `references/ci-local.md` before running the lane.

## Interface contract

- Screen-reader project (T004): Nx project `screen-reader-e2e` at `apps/screen-reader-e2e` with targets `nvda` and `voiceover` and no `test`, `test-storybook`, or `e2e` target; one test file per item, `apps/screen-reader-e2e/src/{item}.screen-reader.ts`, run by both lanes; the lane drivers `apps/screen-reader-e2e/src/support/nvda.ts` and `apps/screen-reader-e2e/src/support/voiceover.ts` and the shared helpers in `apps/screen-reader-e2e/src/support/screen-reader.ts` open a static Storybook story by id and return the phrases the screen reader spoke; each lane writes the phrases it heard to a JSON report under dist/screen-reader-e2e/ (uploaded as an artifact in CI), and tests assert per-lane substrings.
- NVDA key guard (T031): in `apps/screen-reader-e2e/src/support/nvda.ts`, every key the NVDA lane sends, in `open`, `top`, `nextListItem`, and any move added later, goes through one guard that first reads the title of the foreground window and throws, sending nothing, unless the title holds the token `open` gave the story window; no lane move calls a Guidepup method that sends a key (such as `nvda.press`, `nvda.perform`, or `nvda.next`) outside that guard.
- NVDA lane runs (T041): `npm exec nx -- run screen-reader-e2e:nvda` passes on Windows with no `BROWSERS`, which runs Playwright's Chromium and then Firefox in one invocation, and with `BROWSERS=msedge`. In every browser, and whatever ran before it in the lane, `open` leaves the keyboard focus and NVDA's focus in the story document, or throws before any lane move sends a key. A test file added under `apps/screen-reader-e2e/src` needs no step of its own for that.

## Intent coverage

- None

## Acceptance criteria

1. `npm exec nx -- run screen-reader-e2e:nvda` with no `BROWSERS` passes on this machine with real NVDA: Chromium and then Firefox, every test file in both. Three lane runs in a row pass, and the Log records the attempts per test and per browser in each.
2. `BROWSERS=msedge npm exec nx -- run screen-reader-e2e:nvda` passes.
3. The Log states the cause of the Firefox-after-Chromium failure with its evidence: the foreground title, NVDA's focus report, and the document's focus, before and after the fix.
4. An automated test of the `nvda` lane opens two stories in turn in one worker, and both opens get the story document's focus.
5. Every key the lane sends still goes through the key guard, only `open` raises a window, `Lane` and `Driver` are unchanged, the retry budget is unchanged, and no test of the lane is skipped, deleted, loosened, or turned into a manual step (N9).
6. The NVDA lane section of `references/ci-local.md` states the cause, what the lane does about it, and the measured runs, in place of the known local limit.
7. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium firefox && test -f apps/screen-reader-e2e/src/support/nvda.ts && npm exec nx -- run-many -t lint typecheck -p screen-reader-e2e && npm exec nx -- run screen-reader-e2e:nvda && BROWSERS=msedge npm exec nx -- run screen-reader-e2e:nvda; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-11 — created by planner (build repair before wave 4; user ruling "Approve other item 6 sub-items."). Run alone: real NVDA takes the desktop and port 4401. On the current tree the Verify's lane run with no BROWSERS fails in Firefox (T031's Log), so the Verify fails if this task is skipped. The Verify ends by stopping the Nx daemon and keeps its own exit code; run it exactly as written and never set NX_DAEMON.
