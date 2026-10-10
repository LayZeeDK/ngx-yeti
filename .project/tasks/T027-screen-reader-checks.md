---
id: T027
title: Add the timeline, icon, spinner, grid, and cluster screen-reader checks and retire the manual tests
wave: 5
deps: [T004, T009, T010, T012, T016, T021, T031]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - apps/screen-reader-e2e/src/timeline.screen-reader.ts
  - apps/screen-reader-e2e/src/icon.screen-reader.ts
  - apps/screen-reader-e2e/src/spinner.screen-reader.ts
  - apps/screen-reader-e2e/src/grid.screen-reader.ts
  - apps/screen-reader-e2e/src/cluster.screen-reader.ts
  - apps/screen-reader-e2e/src/support/screen-reader.ts
  - apps/screen-reader-e2e/src/support/nvda.ts
  - apps/screen-reader-e2e/src/support/voiceover.ts
  - .github/workflows/ci.yml
  - .claude/skills/ngx-yeti-accessibility/SKILL.md
  - .claude/skills/ngx-yeti-specs/SKILL.md
---

# T027 — Add the timeline, icon, spinner, grid, and cluster screen-reader checks and retire the manual tests

## Context

SC9 (user, 2026-10-10: "Approve SC9."; automated screen-reader tests are always preferable) turns the specs' manual release tests into automated checks on the harness T004 built: timeline is announced as a list with its entry count and each entry as a list item, and the same markup without `role="list"` is not announced as a list (timeline.md:326); icon's decorative form adds no "image" to its link or button name and its standalone form is announced with its name as an image (icon.md:304); spinner's inserted status region is captured with phrase capture and the result (announced once, or not at all) recorded as the measurement spinner.md:197 asks for; grid's and cluster's list semantics (grid.md:66, cluster.md:69) get the timeline-style check (card's landed in T004). NVDA proves Chromium's and Gecko's trees, VoiceOver WebKit's, so the WebKit list checks and their negative controls are asserted only in the VoiceOver lane (INTENT SC9, E16). Departure rows record that these checks replace ADR 0015 point 7's manual release tests; spinner keeps one human listen per release until VoiceOver's phrase capture is proven not to merge live-region phrases.

## Approach

- Test files per the Interface contract, one per item, run by both lanes. Pages: `timeline--default`, `icon--default`, `icon--standalone`, `spinner--waiting`, `grid--default`, and `cluster--tags`.
- Assertions are per-lane substrings, never whole phrases (E16): the role word ("list", "image", "button", "link"), the count, and the name. Each check has a negative control that must not produce the phrase, made by editing the opened story's DOM in the test before the reader reaches it, so no new story is needed: remove `role="list"` from the timeline's `ol` and the grid's list (VoiceOver lane only: in Chromium and Gecko an `ol` keeps its list semantics, INTENT SC9), and remove `aria-hidden` from icon's decorative SVG (it must then add "image").
- Spinner: start the reader with phrase capture of every phrase (`capture: true`), clear the log, trigger the insertion through the page, wait a short settle time, and read the phrase log; record whether "Loading" was spoken once or not at all as an annotation and in the phrase report, and assert that the end-of-wait status text is spoken once. Write the finding into the accessibility skill row below.
- Prohibition N9 (judgment): must not quietly fall back to a manual test, or skip or loosen a screen-reader check, when it flakes; a flaky VoiceOver check is retried within the job's stated retry budget and fixed or escalated to the user; it is never marked skipped, deleted, or turned into a manual test without the user's ruling. Change the job's retry budget in `.github/workflows/ci.yml` only with the reason in a comment.
- The `nvda` lane runs locally on this machine (`BROWSERS=msedge`); the `voiceover` lane runs in CI only, first on the milestone's pull request; write its assertions so the first green run records its phrases.
- Docs, in this task: `.claude/skills/ngx-yeti-accessibility/SKILL.md` line 19 (the Manual row) becomes the VoiceOver and NVDA lanes of `screen-reader-e2e`, with spinner's single human listen per release as the only manual leftover (listed for release readiness); `.claude/skills/ngx-yeti-specs/SKILL.md` Departures table gains the rows that SC9 replaces ADR 0015 point 7 (adr/0015:19) and the manual tests of icon.md:304, timeline.md:326, and spinner.md:197 and :332, naming the lanes and the spinner listen. Prettier formats the table.
- Skills: `.claude/skills/ngx-yeti-accessibility/SKILL.md`, `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- Screen-reader project (T004): Nx project `screen-reader-e2e` at `apps/screen-reader-e2e` with targets `nvda` and `voiceover` and no `test`, `test-storybook`, or `e2e` target; one test file per item, `apps/screen-reader-e2e/src/{item}.screen-reader.ts`, run by both lanes; the lane drivers `apps/screen-reader-e2e/src/support/nvda.ts` and `apps/screen-reader-e2e/src/support/voiceover.ts` and the shared helpers in `apps/screen-reader-e2e/src/support/screen-reader.ts` open a static Storybook story by id and return the phrases the screen reader spoke; each lane writes the phrases it heard to a JSON report under dist/screen-reader-e2e/ (uploaded as an artifact in CI), and tests assert per-lane substrings.
- NVDA key guard (T031): in `apps/screen-reader-e2e/src/support/nvda.ts`, every key the NVDA lane sends, in `open`, `top`, `nextListItem`, and any move added later, goes through one guard that first reads the title of the foreground window and throws, sending nothing, unless the title holds the token `open` gave the story window; no lane move calls a Guidepup method that sends a key (such as `nvda.press`, `nvda.perform`, or `nvda.next`) outside that guard.

## Intent coverage

- SC9

## Acceptance criteria

1. The `nvda` lane passes locally on this machine for timeline, icon, spinner, grid, and cluster: timeline, grid, and cluster announced as lists with their counts and their entries as list items, icon's decorative form with no "image" in the link or button name and its standalone form named as an image, and spinner's capture recorded.
2. E16: every check asserts recorded substrings, not whole phrases, and has a negative control that must not produce the phrase: timeline and grid without `role="list"` (VoiceOver lane only) and icon's decorative SVG without `aria-hidden`; the `voiceover` job runs the same files in real Safari on the milestone's pull request.
3. Spinner's inserted status region is captured with phrase capture in both lanes and the result (announced once, or not at all) is recorded as spinner.md:197's measurement in the phrase report and the accessibility skill.
4. The accessibility skill's Manual row names the two lanes and spinner's single human listen per release, and the ngx-yeti-specs Departures table records that SC9 replaces ADR 0015 point 7 and the specs' manual release tests.
5. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium firefox && test -f apps/screen-reader-e2e/src/timeline.screen-reader.ts && test -f apps/screen-reader-e2e/src/spinner.screen-reader.ts && npm exec nx -- run-many -t lint typecheck -p screen-reader-e2e && BROWSERS=msedge npm exec nx -- run screen-reader-e2e:nvda; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-10 — created by planner
- 2026-10-10 — orchestrator: plan-defect repair (Verify only), user ruling "Resolve the NX_DAEMON=false issue". Verify now ends by stopping the Nx daemon and keeps its own exit code. Measured cause: for a serial task, the pipeline reverts and deletes the verify sidecar right after Verify (`git restore`, then `git clean -fdx`); a daemon that Verify left running rewrites `.nx/workspace-data` and `node_modules/.vite-temp` during that cleanup and it fails with "Directory not empty" (2 of 2 with T004's diff; passes once the daemon is stopped). Run Verify exactly as written; never set NX_DAEMON.
- 2026-10-11 — planner: build repair (user ruling "Wave-1 defects: Approve recommendation."). `deps` gains T031 and the Interface contract gains T031's NVDA key guard, identical to T031's text: T031 (wave 2) changes apps/screen-reader-e2e/src/support/nvda.ts, which this task extends, and every key this task's new moves send goes through that guard. Acceptance criteria, files, wave, and Verify are unchanged.
