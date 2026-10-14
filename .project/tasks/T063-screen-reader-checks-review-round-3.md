---
id: T063
title: Make the spinner screen-reader check able to fail, guard the VoiceOver foreground, assert the decorative icon's role words, and share inOrder with card
wave: 11
deps: [T027, T052]
status: done
agent: build_T063
base: 3ec57a6562acaf2dc706b32351aa126287336fb4
worktree: null
task_branch: null
files:
  - apps/screen-reader-e2e/src/spinner.screen-reader.ts
  - apps/screen-reader-e2e/src/icon.screen-reader.ts
  - apps/screen-reader-e2e/src/card.screen-reader.ts
  - apps/screen-reader-e2e/src/support/voiceover.ts
---

# T063 — Make the spinner screen-reader check able to fail, guard the VoiceOver foreground, assert the decorative icon's role words, and share inOrder with card

## Context

Sixth build repair (2026-10-14): survivors of review round 3 of M002 (range fb1a8c6..2cedb1b; the product files are unchanged at 58ee259, so every line number below is at 2cedb1b; triaged by Claude on 2026-10-14 in the git-ignored local record tmp/afk-m002/lars-review/r3/triage.md, group D items 12 to 15, with the source reports g2-code-reviewer.md and g2-test-analyzer.md beside it and the advisory review tmp/afk-m002/wave8-10-thermos-quality.md). Every finding is inlined. Deferred by the triage, not in scope: self-tests for `inOrder` and `acceptsFocusReport` ("apps/screen-reader-e2e has no `test` target; adding one is a project-config change for two pure functions ... Owner: next milestone"). VoiceOver runs only in CI on macOS (AGENTS.md "Run CI locally"; INTENT SC8 and SC9), so this task's VoiceOver changes are checked statically here and their spoken output is confirmed by the first CI run on the milestone's pull request, as T027's were.

Triage item 12 (minor, fix): "spinner.screen-reader.ts:25 cannot fail (the text is not in the DOM before Finish); \"Loading\" is counted as a substring that also matches the visible paragraph; a repeated announcement only reaches the annotation (g2-code-reviewer, g2-test-analyzer 1 and 2; spinner.md:65 \"announced once, not repeated\"). Fix: drop the hollow line, count the status name on its own, assert it is spoken at most once." g2-test-analyzer 1, verbatim: "apps/screen-reader-e2e/src/spinner.screen-reader.ts:25 `expect(times(inserted, 'Loaded 12 posts')).toBe(0);` Evidence (measured, read): packages/ngx-yeti/spinner/src/spinner.stories.ts:365 renders `<p data-testid=\"result\" role=\"status\">@if (loaded()) {Loaded 12 posts}</p>`, and `loaded` is set only by Finish (:362). The text is not in the DOM after Load, so no reader can speak it, and the assertion passes whatever the reader or the package does. It reads like a negative control but it is not one. What it misses: spinner.md:65 (story 31) asks that the wait be 'announced once, not repeated while the ring turns'. Nothing in the test asserts or records repetition beyond the single `times(...)` count in the annotation. Fix direction: delete the line, or replace it with a check that can fail. One option: keep the counter and assert that 'Loading' is not spoken more than once during the settle (story 31)." g2-test-analyzer 2, verbatim: "spinner.screen-reader.ts:16-17 count `'Loading'` as a substring. The inserted markup (stories.ts:363) is `<span yetiSpinner role=\"status\" aria-label=\"Loading\"></span> Loading the latest posts`, so 'Loading' also matches the visible paragraph. Failure (inferred): if a reader speaks the inserted paragraph (VoiceOver can read inserted content near the cursor, and its result is still unmeasured, per T027 log line 81), the annotation records `\"Loading\" spoken once`. That would be spinner.md:197's measurement, and the speech came from the paragraph, not from the status region. ... Fix direction: count only phrases that match the status name on its own, for example by excluding `Loading the latest posts` before counting." g2-code-reviewer, verbatim: "the count of 'Loading' goes into an annotation only. The assertions check that 'Loaded 12 posts' is absent after Load and spoken exactly once after Finish. Record: spinner.md:65 'I want the wait announced once, not repeated while the ring turns'. spinner.md:197 leaves 'whether ... announced ... once' unmeasured, which explains recording 0 vs 1. A count above 1 would still break the user story. ... Fix direction: keep the annotation and add `expect(announced).toBeLessThanOrEqual(1)`." Measured in T027's Log: NVDA in Chromium, Firefox, and Edge spoke "Loading" not at all and "Loaded 12 posts" once.

Triage item 13 (minor, fix): "VoiceOver `change` has no foreground check, so a lost front window reads as \"not spoken\" (g2-test-analyzer 3). Fix: check the frontmost application after the settle and throw, as the NVDA lane does." g2-test-analyzer 3, verbatim: "apps/screen-reader-e2e/src/support/voiceover.ts:90-96. NVDA's `change` refuses when the story window lost the foreground (nvda.ts:149-158, 'fails the test instead of passing for silence'). VoiceOver's `change` makes no check like this, and Safari is brought to the front only in `open`. Failure (inferred): if Safari loses the front during the 3 s settle, VoiceOver stays silent. The Finish assertion then fails loudly. The Load step does not fail: it only annotates, and it records `\"Loading\" spoken not at all`, which looks like a real WebKit result in the first CI run's report. Fix direction: check the frontmost application (for example through `macOSActivate`, or an osascript query of the frontmost process) after the settle, and throw as the NVDA lane does."

Triage item 14 (minor, fix): "The VoiceOver decorative-icon row asserts no role word (g2-test-analyzer 5; T027 Approach \"the role word ... the count, and the name\"). Fix: 'link' and 'button' in spoken order; the first CI run confirms the order." g2-test-analyzer 5, verbatim: "icon.screen-reader.ts:23 `decorative: ['Download', 'Save']`. NVDA's row asserts `'link', 'Download', 'button', 'Save'`. Record: T027 Approach line 34, 'Assertions are per-lane substrings ...: the role word (\"list\", \"image\", \"button\", \"link\"), the count, and the name', and icon.md:59 'I hear \"Download, link\"'. Failure (inferred): in VoiceOver, a regression that makes the decorative SVG the link's only content, or that drops the link role, still passes. The check would only show that 'Download' and 'Save' are spoken and no 'image'. Fix direction: add `'link'` and `'button'` to the VoiceOver row in spoken order (VoiceOver says 'Download, link'), and let the first green CI run confirm the order, as T027 line 37 already plans for the other VoiceOver rows."

Triage item 15 (minor, fix): "card.screen-reader.ts keeps its own `inOrder` (g2-test-analyzer 4, first half). Fix: import the shared one; drop the browser versions in its comment (wave 8-10 thermos quality L3)." g2-test-analyzer 4, first half, verbatim: "apps/screen-reader-e2e/src/card.screen-reader.ts:47 still defines its own `inOrder`. T027 log line 73 notes this ('card's file, which still has its own copy and is not in this task's files'). The two copies can drift. Fix direction: card imports the shared `inOrder`." Wave 8-10 thermos quality L3, verbatim: "File: `apps/screen-reader-e2e/src/card.screen-reader.ts:11-13`. ... 'NVDA 2026.2 in Edge 154 and Playwright's Chromium 153 and Firefox 155.' is a record of what the phrases were heard with. ... Under the comment rule in the brief (no history, no measurements) the sentence is still a measurement, and it is wrong after the next Playwright or NVDA bump without any check noticing. The sentence that follows ('Down from the start marker enters the list at the first card ...') is the part the code cannot say."

## Approach

- Spinner (`apps/screen-reader-e2e/src/spinner.screen-reader.ts`): delete the hollow `Loaded 12 posts` line after Load; count the status name as its own phrase, so the visible "Loading the latest posts" paragraph is not counted as the status; keep the annotation (the spinner.md:197 measurement) and assert the status name is spoken at most once (spinner.md:65, story 31); keep the Finish assertion. Rename the test title if it no longer says what the test checks.
- VoiceOver foreground (`apps/screen-reader-e2e/src/support/voiceover.ts`): after the settle inside `change`, check that Safari is still the frontmost application and throw, naming that what VoiceOver spoke is not the page, when it is not, as `change` in `apps/screen-reader-e2e/src/support/nvda.ts` does through `requireForeground`. Use a public Guidepup or macOS call; the coder picks it. This code runs only in the `voiceover` job; typecheck and lint check it here.
- Icon (`apps/screen-reader-e2e/src/icon.screen-reader.ts`): the VoiceOver `decorative` row asserts the role words with the names in VoiceOver's spoken order (icon.md:59, "Download, link"); the first CI run confirms the order, and a wrong order is fixed from that run's phrase report.
- Card (`apps/screen-reader-e2e/src/card.screen-reader.ts`): import `inOrder` from `apps/screen-reader-e2e/src/support/screen-reader.ts` and delete the local copy; the comment above the NVDA row keeps only what the code cannot say, with no reader or browser versions.
- Prohibition N9 holds: no check is skipped, loosened, or turned into a manual test.
- The NVDA lane runs locally on this machine with no `BROWSERS` (Playwright's Chromium and then Firefox, the job's browsers); run it once, not back to back (two runs can collide on the static Storybook server, a watch item of the round). It needs the unlocked desktop; the orchestrator runs it with no other heavy command.
- Comments follow the repository rule: only what the code cannot say, no planning ids, dates, or measurements.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/ngx-yeti-accessibility/SKILL.md` (read only; T060 owns it in this wave), `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. The spinner check has no assertion that cannot fail, counts the status name on its own, records it in the annotation, and fails when the status name is spoken more than once; it still asserts the end of the wait is spoken once.
2. VoiceOver's `change` throws when Safari is not the frontmost application after the settle.
3. The VoiceOver decorative-icon row asserts `link` and `button` with `Download` and `Save` in spoken order.
4. `card.screen-reader.ts` imports the shared `inOrder`, has no copy of its own, and its comment names no reader or browser version.
5. Lint and typecheck of `screen-reader-e2e` pass, the `nvda` lane passes locally with no `BROWSERS`, and `npx prettier --check` passes on the four files.

## Verify

```bash
npm ci && npx playwright install chromium firefox && ! rg -q -F "times(inserted, 'Loaded 12 posts')" apps/screen-reader-e2e/src/spinner.screen-reader.ts && ! rg -q -F "function inOrder" apps/screen-reader-e2e/src/card.screen-reader.ts && ! rg -q -F "Chromium 153" apps/screen-reader-e2e/src/card.screen-reader.ts && rg -q -U "voiceover: \{[^}]*decorative: \[[^\]]*'link'" apps/screen-reader-e2e/src/icon.screen-reader.ts && npm exec nx -- run-many -t lint typecheck -p screen-reader-e2e && npm exec nx -- run screen-reader-e2e:nvda && npx prettier --check apps/screen-reader-e2e/src/spinner.screen-reader.ts apps/screen-reader-e2e/src/icon.screen-reader.ts apps/screen-reader-e2e/src/card.screen-reader.ts apps/screen-reader-e2e/src/support/voiceover.ts; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-15 — created by planner (build repair 6), from tmp/afk-m002/lars-review/r3/triage.md group D items 12 to 15.
- 2026-10-15 — coder build_T063: spinner.screen-reader.ts drops the hollow `Loaded 12 posts` line, counts `Loading` after stripping the visible paragraph "Loading the latest posts", keeps the annotation, asserts `announced <= 1`, test title renamed; voiceover.ts `change` queries the frontmost process through `osascript` (System Events; Guidepup's `runAppleScript` is not public) after the settle and throws "Safari lost the foreground to <app>: what VoiceOver spoke is not the page." unless it is Safari; icon.screen-reader.ts VoiceOver `decorative` row is `['Download', 'link', 'Save', 'button']` (VoiceOver says "Download, link"; the first CI run confirms the order); card.screen-reader.ts imports the shared `inOrder`, deletes its copy and drops the version sentence. VoiceOver changes checked statically only (lint, typecheck).
- Verify (exact, through the heavy lock): passed, exit 0. lint and typecheck of screen-reader-e2e green; `nvda` lane 22 passed (Chromium then Firefox, no BROWSERS; the spinner test passed in both); prettier --check on the four files clean.
- Rule 13: `npx prettier --check .` clean; `nx affected -t lint typecheck test test-storybook --base=HEAD` exit 0 (2 projects, 5 tasks, all cache hits of identical inputs; no Storybook project affected).
- 2026-10-14 — orchestrator Verify (isolate gsd-path-task/T063): pass, exit 0; output tail:
  ```
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
  [2m[WebServer] [22m(node:21344) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
  [2m[WebServer] [22m(Use `node --trace-deprecation ...` to show where the warning was created)
  (node:50180) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
  (Use `node --trace-deprecation ...` to show where the warning was created)
  (node:3172) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
  (Use `node --trace-deprecation ...` to show where the warning was created)
  ```
