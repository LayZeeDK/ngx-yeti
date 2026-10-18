---
id: T027
title: Add the timeline, icon, spinner, grid, and cluster screen-reader checks and retire the manual tests
wave: 5
deps: [T004, T009, T010, T012, T016, T021, T031, T041]
status: done
agent: build_T027
base: d229acf7e1e11fa7b8eb1da43fcee1a9bace1e53
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
- The `nvda` lane runs locally on this machine, with `BROWSERS=msedge` and with no `BROWSERS` (Playwright's Chromium and then Firefox, the browsers of the CI job, which T041 made pass in one run); the `voiceover` lane runs in CI only, first on the milestone's pull request; write its assertions so the first green run records its phrases.
- Docs, in this task: `.claude/skills/ngx-yeti-accessibility/SKILL.md` line 19 (the Manual row) becomes the VoiceOver and NVDA lanes of `screen-reader-e2e`, with spinner's single human listen per release as the only manual leftover (listed for release readiness); `.claude/skills/ngx-yeti-specs/SKILL.md` Departures table gains the rows that SC9 replaces ADR 0015 point 7 (adr/0015:19) and the manual tests of icon.md:304, timeline.md:326, and spinner.md:197 and :332, naming the lanes and the spinner listen. Prettier formats the table.
- Skills: `.claude/skills/ngx-yeti-accessibility/SKILL.md`, `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- Screen-reader project (T004): Nx project `screen-reader-e2e` at `apps/screen-reader-e2e` with targets `nvda` and `voiceover` and no `test`, `test-storybook`, or `e2e` target; one test file per item, `apps/screen-reader-e2e/src/{item}.screen-reader.ts`, run by both lanes; the lane drivers `apps/screen-reader-e2e/src/support/nvda.ts` and `apps/screen-reader-e2e/src/support/voiceover.ts` and the shared helpers in `apps/screen-reader-e2e/src/support/screen-reader.ts` open a static Storybook story by id and return the phrases the screen reader spoke; each lane writes the phrases it heard to a JSON report under dist/screen-reader-e2e/ (uploaded as an artifact in CI), and tests assert per-lane substrings.
- NVDA key guard (T031): in `apps/screen-reader-e2e/src/support/nvda.ts`, every key the NVDA lane sends, in `open`, `top`, `nextListItem`, and any move added later, goes through one guard that first reads the title of the foreground window and throws, sending nothing, unless the title holds the token `open` gave the story window; no lane move calls a Guidepup method that sends a key (such as `nvda.press`, `nvda.perform`, or `nvda.next`) outside that guard.
- NVDA lane runs (T041): `npm exec nx -- run screen-reader-e2e:nvda` passes on Windows with no `BROWSERS`, which runs Playwright's Chromium and then Firefox in one invocation, and with `BROWSERS=msedge`. In every browser, and whatever ran before it in the lane, `open` leaves the keyboard focus and NVDA's focus in the story document, or throws before any lane move sends a key. A test file added under `apps/screen-reader-e2e/src` needs no step of its own for that.

## Intent coverage

- SC9

## Acceptance criteria

1. The `nvda` lane passes locally on this machine for timeline, icon, spinner, grid, and cluster: timeline, grid, and cluster announced as lists with their counts and their entries as list items, icon's decorative form with no "image" in the link or button name and its standalone form named as an image, and spinner's capture recorded. It passes with `BROWSERS=msedge` and with no `BROWSERS` (Playwright's Chromium and then Firefox).
2. E16: every check asserts recorded substrings, not whole phrases, and has a negative control that must not produce the phrase: timeline and grid without `role="list"` (VoiceOver lane only) and icon's decorative SVG without `aria-hidden`; the `voiceover` job runs the same files in real Safari on the milestone's pull request.
3. Spinner's inserted status region is captured with phrase capture in both lanes and the result (announced once, or not at all) is recorded as spinner.md:197's measurement in the phrase report and the accessibility skill.
4. The accessibility skill's Manual row names the two lanes and spinner's single human listen per release, and the ngx-yeti-specs Departures table records that SC9 replaces ADR 0015 point 7 and the specs' manual release tests.
5. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium firefox && test -f apps/screen-reader-e2e/src/timeline.screen-reader.ts && test -f apps/screen-reader-e2e/src/spinner.screen-reader.ts && npm exec nx -- run-many -t lint typecheck -p screen-reader-e2e && npm exec nx -- run screen-reader-e2e:nvda && BROWSERS=msedge npm exec nx -- run screen-reader-e2e:nvda; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-10 — created by planner
- 2026-10-10 — orchestrator: plan-defect repair (Verify only), user ruling "Resolve the NX_DAEMON=false issue". Verify now ends by stopping the Nx daemon and keeps its own exit code. Measured cause: for a serial task, the pipeline reverts and deletes the verify sidecar right after Verify (`git restore`, then `git clean -fdx`); a daemon that Verify left running rewrites `.nx/workspace-data` and `node_modules/.vite-temp` during that cleanup and it fails with "Directory not empty" (2 of 2 with T004's diff; passes once the daemon is stopped). Run Verify exactly as written; never set NX_DAEMON.
- 2026-10-11 — planner: build repair (user ruling "Wave-1 defects: Approve recommendation."). `deps` gains T031 and the Interface contract gains T031's NVDA key guard, identical to T031's text: T031 (wave 2) changes apps/screen-reader-e2e/src/support/nvda.ts, which this task extends, and every key this task's new moves send goes through that guard. Acceptance criteria, files, wave, and Verify are unchanged.
- 2026-10-11 — planner: build repair before wave 4 (user rulings of 2026-10-11, quoted in T035 to T041). `deps` gains T041 and the Interface contract gains T041's lane-run shape: T041 makes the lane pass in Firefox after Chromium and edits apps/screen-reader-e2e/src/support/nvda.ts, which this task extends. The Verify and criterion 1 also run the lane with no BROWSERS, as the CI job does. Files and wave are unchanged.
- 2026-10-14 — coder (build_T027): implementation. New files `timeline`, `grid`, `cluster`, `icon` and `spinner.screen-reader.ts`, each with per-lane substring tables. The `Lane` interface in `support/screen-reader.ts` gains `next()` (NVDA down arrow, VoiceOver VO-Right) and `change(script, argument, settle)`, which runs a script in the story document and returns what the reader said meanwhile. The shared helpers gain `walk`, `inOrder` (moved out of card's file, which still has its own copy and is not in this task's files), `dropListRole` and `clickButton`, and the phrase report now includes the test's annotations. In `nvda.ts`, `next` and `change` go through the T031 guard: `change` runs inside `nvda.capture`, which sends NVDA's stop-speech key, and after the settle it re-reads the foreground title, so a window that takes the foreground fails the test instead of passing on silence. In `voiceover.ts`, `change` runs inside `voiceOver.capture`. The list negative controls (timeline, grid, cluster without `role="list"`) are defined only in the VoiceOver lane. `ci.yml` is unchanged: the retry budget stays at 2. Docs: the accessibility skill's Manual row is replaced by a Screen reader row plus a spinner row that names the measurement and the single human VoiceOver listen per release. The ngx-yeti-specs Departures table gains two rows: ADR 0015 point 7, and icon.md:304 / timeline.md:326 / spinner.md:197, :332.
- 2026-10-14 — coder (build_T027): UPSTREAM: Guidepup 0.35.0 NVDA and VoiceOver clients add a phrase to `spokenPhraseLog` only while one of Guidepup's own actions runs (`NVDAClient.enqueueAndTap`). Speech caused by the page, such as a live region, is dropped. Measured in Edge 154 with NVDA 2026.2: `role="alert"` and `aria-live="polite"` text inserted through `page.evaluate` logged no phrase. The same insertions inside `nvda.capture` logged "Alert text one" and "Polite text two". This is a documented API rather than a bug, so the lanes use `capture`. Recorded here for the registry task to decide.
- 2026-10-14 — coder (build_T027): measurements (NVDA 2026.2, Guidepup 0.35.0, Edge 154 arm64 and Playwright's x64 Chromium and Firefox; phrase reports under `dist/screen-reader-e2e/nvda/`). The temporary probe `src/zz-measure.screen-reader.ts`, outside `files`, has been deleted.
  - Timeline: NVDA enters the list on the first entry's date line ("list, with 3 items, 12 September"), and its list-item key then reads each later entry whole ("13 September, The layouts, heading, level 3, ..."). So the NVDA substrings are the dates plus the second and third headings, and "The plan" is not asserted in NVDA.
  - Grid and cluster: "list, with 5 items, One" … "no next list item" and "list, with 3 items, css" … "no next list item", the same in all three browsers.
  - Icon (decorative): "same page, link, Download" and "button, Save", with no "graphic".
  - Icon (standalone): "button, graphic, Close" and "graphic, Warning".
  - Icon negative control, a deviation from the Approach: with only `aria-hidden` removed, the SVG has no role and no name, and NVDA says no "graphic" in Edge, Chromium or Firefox. Adding `role="img"` without a label also gives no "graphic". So the bare-removal case "it must then add image" cannot be asserted in the NVDA lane. The control test therefore records the bare removal as an annotation (both lanes, so the first green VoiceOver run records WebKit's result). It then asserts on the same link's SVG with `aria-hidden` removed plus `role="img"` and `aria-label="Arrow"`: NVDA says "same page, link, graphic, Arrow" in all three browsers. The reviewer should confirm this reading of criterion 2.
  - Spinner (spinner.md:197's measurement), NVDA in Chromium, Firefox and Edge: the inserted `role="status" aria-label="Loading"` region with no text was not announced ("Loading" spoken not at all, phrase `""`), and "Loaded 12 posts" was spoken once. Both are recorded in the test annotation, the phrase report and the accessibility skill. VoiceOver's result is recorded on the first CI run.
  - Watch item (O18/O19): no lane run hung. Every run exited by itself under `timeout 900` (Verify under `timeout 2400`). After every run no `nvda.exe` was listed. One probe step was refused by the guard because the window "ngx-yeti - gsd-path/M002" took the foreground. The guard sent nothing, and that probe file has been deleted.
- 2026-10-14 — coder (build_T027): Verify, as written, through the heavy lock in `timeout 2400 bash -c`: exit 0. Lint and typecheck passed for screen-reader-e2e. `screen-reader-e2e:nvda` with no BROWSERS: 22 passed (Chromium and Firefox, 11 each). `BROWSERS=msedge`: 11 passed. No retries were used. The VoiceOver-only list controls are not defined in the NVDA lane. An earlier Verify attempt failed 2 of 22 because of a bug of mine: `exposeImage` called a module function from inside `page.evaluate`. It was fixed, and the icon file then passed 9 of 9 in Edge, Chromium and Firefox before the passing Verify.
- 2026-10-14 — coder (build_T027): rule 13. `npx prettier --check .`: all files pass. `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD`, run through the lock: exit 0, 2 projects with lint, typecheck and test, plus 1 dependency task, and no test-storybook target affected. Git index untouched.
- 2026-10-13 — orchestrator Verify (isolate gsd-path-task/T027): pass, exit 0; output tail:
  ```
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
  [2m[WebServer] [22m(node:50684) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
  [2m[WebServer] [22m(Use `node --trace-deprecation ...` to show where the warning was created)
  (node:31544) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
  (Use `node --trace-deprecation ...` to show where the warning was created)
  (node:40752) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
  (Use `node --trace-deprecation ...` to show where the warning was created)
  [2m[WebServer] [22m(node:27516) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
  [2m[WebServer] [22m(Use `node --trace-deprecation ...` to show where the warning was created)
  (node:12208) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
  (Use `node --trace-deprecation ...` to show where the warning was created)
  ```
