---
id: T056
title: Record the loader's stable gate and the press-ratio departure, and bring stale docs and doc comments up to date
wave: 9
deps: []
status: done
agent: build_T056
base: 1580f84eba8c4b8018f6e3e80a01bd524d964700
worktree: null
task_branch: null
files:
  - .claude/skills/ngx-yeti-specs/SKILL.md
  - packages/ngx-yeti/README.md
  - packages/ngx-yeti/styles/src/provide-yeti-styles.ts
  - packages/ngx-yeti/enter/src/enter.ts
  - packages/ngx-yeti/icon/src/icon.ts
  - docs/specs/ledger.md
  - apps/screen-reader-e2e/src/support/nvda.ts
---

# T056 — Record the loader's stable gate and the press-ratio departure, and bring stale docs and doc comments up to date

## Context

Fifth build repair (2026-10-13): survivors of review round 2 of M002 (range 4504b4c..7793730, which the history rewrite of 2026-10-13 maps to 0172a0a..fb1a8c6 with the same contents for these files; line numbers at 7793730; triaged by Claude on 2026-10-13 in the git-ignored local record tmp/afk-m002/lars-review/r2/triage.md, items 1, 7, 8, the Departures part of item 14, and item 15, from the source reports g1-code-reviewer.md, g1-silent-failure.md, g1-type-design.md, g4-code-reviewer.md, g2-test-analyzer.md, and g3-comments.md beside it). Every finding is inlined; find each site by its quoted code. No code behaviour changes in this task: it adds two Departures rows, widens one, and corrects wording.

Triage item 1 (minor): "The styles loader's first-stable gate (`#settled`, yeti-styles.ts:133-146, :240-248) departs from setup.md:201 (rule 2, 'schedules a check for the next animation frame') and ADR 0060 point 4 with no Departures row (g1-code-reviewer 1, g1-silent-failure 1; re-checked: `rg whenStable .claude/skills docs/specs/ledger.md` finds nothing). Fix: Departures row in .claude/skills/ngx-yeti-specs/SKILL.md naming the gate, T050's measured reason, and the never-stable consequence; one README sentence beside setup rule 2. No code change." Source evidence, verbatim: "`#scheduleCheck` now returns early until `appRef.whenStable()` has resolved once (`!this.#settled`). So a release, and every DOM mutation, before the first stable point schedules no check. setup.md:201 (rule 2): 'A release lowers the count and schedules a check for the next animation frame.' setup.md:240 lists the primitives and does not include `ApplicationRef`." And: "ADR 0060 point 4: 'A link is removed in the animation frame after its live count reached zero and no element with `data-ngx-yeti-item=\"<item>\"` is connected'. ... Claimed failure: an application that never becomes stable, for example a zone.js app with a `setInterval` poll or a `PendingTasks` entry that is never cleared, keeps every item link it ever acquired for the whole session. ... The gate also applies to client-only apps with no hydration, where its stated reason ... does not apply. There, adopted links are empty and the only effect is the delay. The cost is limited: a kept link with no host styles nothing, because Yeti scopes rules to item classes." The loader's own comment states the reason: "No check runs before the application first becomes stable: the first render callback can run before the initial navigation has activated its route components, and an adopted link that only such a component acquires must stay the server's element through hydration. An application that never becomes stable keeps its unused links." T050's measured reason: T025's attempt 1 failed three yeti-app-e2e cases because hydration removed and re-inserted the server's `spinner` link once the card held a `yetiButton`, which breaks ADR 0060 point 5 ("0 style mutations after `DOMContentLoaded`"). Settled, not to be reopened (known-items of the round): "T050: the styles loader holds removal checks until `ApplicationRef.whenStable()` (public API, chosen for hydration)." Declined by the triage: a dev-mode warning for a never-stable app ("not required by any record; not added").

Triage item 7 (cosmetic): "'accessibility stylesheet' after the rename: provide-yeti-styles.ts:42, enter.ts:83-84, enter.spec.ts:72-73, docs/specs/ledger.md:68 (A11Y-33). Fix: 'the package's global stylesheet (\"ngx-yeti/ngx-yeti-globals.css\")'." Source evidence: `packages/ngx-yeti/styles/src/provide-yeti-styles.ts:42` ("import the accessibility stylesheet after it (rule 4)"), `packages/ngx-yeti/enter/src/enter.ts:83-84` ("A named arrival is withheld through the package's accessibility stylesheet (ledger row A11Y-33)"); "these JSDoc lines ship in the published `.d.ts`. A consumer reading the hover docs looks for an 'accessibility stylesheet' that the README no longer names". Ledger row A11Y-33 (g4-code-reviewer F2): "the same cell names the file \"ngx-yeti/ngx-yeti-globals.css\", then says 'a consumer whose global stylesheet leaves out the accessibility stylesheet keeps Yeti's behaviour'. ... Fix direction: 'leaves out \"ngx-yeti/ngx-yeti-globals.css\"'." The enter.spec.ts site belongs to T057, which owns that file.

Triage item 8 (cosmetic): "icon.ts:80-85 `align` doc names 2 of the 5 `YetiAlign` values (g1-type-design C1)." Source evidence, verbatim: "the doc says 'How the icon lines up with the text: centred on the line, or on the baseline', while the type is `YetiAlign` (`'start' | 'center' | 'end' | 'stretch' | 'baseline'`, src/yeti-types.ts:3). The type is correct: icon.md:140 says '`align: YetiAlign | undefined` (Yeti default `center`)' ... Fix direction: add one clause, for example '`start`, `end`, and `stretch` set the row's cross-axis alignment like any flex row'. Doc-only."

Triage item 14, Departures part (cosmetic): "the hover-row Departures row widened to ':hover or :active' with the press-ratio reason". The row today: "| Any spec | A CSS `:hover` assertion in a play function | The assertion goes in layer 2 or 4 | Storybook's `userEvent.hover` does not set `:hover` (measured) | `ngx-yeti-stories` |". g2-test-analyzer F5, verbatim: "`packages/ngx-yeti/button/src/button.stories.ts:249-254` ('the press ratios in `ngx-yeti-e2e`: Storybook's pointer sets neither `:hover` nor `:active`') and `packages/ngx-yeti/button/src/button.spec.ts:625-627` ('(ngx-yeti-specs, Departures)'). Record: button.md:315, 'Asserts the text-to-fill ratio at rest, on hover, and on press is at least 4.5:1 for each'; the Departures row ... names `:hover` only. ... Fix direction: widen the row to '`:hover` or `:active`' with the measured reason".

Triage item 15 (minor and cosmetic, from g3-comments): "apps/ngx-yeti-e2e/src/button.spec.ts:240-242 cites a Departures row for the press ratio (button.md:315) that does not exist (g3-comments, minor; same root as g2-test-analyzer F5): add the row 'button.md:315 press ratio asserted at layer 4 because Storybook's pointer sets no :active' with the widened hover row (item 14). Cosmetic: nvda.ts:174, :177 doc examples carry per-run tokens and a browser build name: use placeholders." The comment today: "// button.md:315 puts the press ratio in the story; Storybook's pointer does not set `:active`, so a real pointer holds each button down here (ngx-yeti-specs, Departures)." The nvda.ts examples: "(`screen-reader-e 2e-518862816, document, focused, read only`)" and "(`screen-reader-e 2e-947894595 — Nightly, frame, read only`)"; g3-comments' fix direction: "write the shapes with a placeholder, such as `screen-reader-e 2e-<n>, document, focused, read only` and `<title> — <browser>, frame, read only`."

The brief for this repair names triage items 1 to 14 plus the last two seats of the round if complete; both seats (g3-test-analyzer, no findings; g3-comments, item 15) ended `Status: complete`.

## Approach

- Departures table of `.claude/skills/ngx-yeti-specs/SKILL.md` (the one list of departures; keep its column format and Prettier's table alignment):
  - A new row for setup.md:201 (rule 2) and :240 and ADR 0060 point 4: the loader schedules no removal check before `ApplicationRef.whenStable()` first resolves; the reason is T050's measured hydration churn (an adopted link that only a route component acquires must stay the server's element through hydration); the consequence is that an application that never becomes stable keeps its unused item links, which style nothing because Yeti scopes rules to item classes. Skill column `ngx-yeti-specs`.
  - The `:hover` row becomes "`:hover` or `:active`", with the measured reason for each (Storybook's `userEvent.hover` sets no `:hover`; Storybook's pointer sets no `:active`).
  - A new row for button.md:315: the press ratio is asserted in layer 4 (`apps/ngx-yeti-e2e/src/button.spec.ts`, a real pointer holding each button down) because Storybook's pointer sets no `:active`; the rest and hover ratios keep their places. The existing citations "(ngx-yeti-specs, Departures)" in the button specs then point at a real row and stay as they are.
- `packages/ngx-yeti/README.md`: one sentence where it says when the loader removes an item link (the triage says beside setup rule 2): removal waits until the application first becomes stable, so an application that never does keeps its unused links. Consumer wording, no planning ids.
- Wording: `provide-yeti-styles.ts` and `enter.ts` say "the package's global stylesheet" with the specifier "ngx-yeti/ngx-yeti-globals.css" where they now say "accessibility stylesheet"; ledger row A11Y-33's package column says "leaves out \"ngx-yeti/ngx-yeti-globals.css\"" in place of "leaves out the accessibility stylesheet". Change no other ledger cell (T058 edits rows A11Y-35 and adds A11Y-36 after this task).
- `icon.ts`: the `align` doc names what all five `YetiAlign` values do; doc only.
- `nvda.ts`: the two doc examples use placeholders for the per-run token and the browser name; the code does not change.
- `docs/specs/` is otherwise immutable; only `ledger.md` is edited here (AGENTS.md "Specs and skills").
- Skills: `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/ngx-yeti-accessibility/SKILL.md` (ledger rows).

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. The Departures table has a row naming `whenStable` for setup.md:201 and ADR 0060 point 4 with the reason and the never-stable consequence, a row for button.md:315's press ratio, and the hover row covers `:active`.
2. `packages/ngx-yeti/README.md` states that link removal waits for the application's first stable point.
3. No "accessibility stylesheet" wording remains in `provide-yeti-styles.ts`, `enter.ts`, or ledger row A11Y-33.
4. The `align` doc of `icon.ts` names `start`, `end`, and `stretch` as well as `center` and `baseline`.
5. The nvda.ts doc examples hold no per-run token and no browser build name.
6. `npm exec nx -- run-many -t lint typecheck -p ngx-yeti screen-reader-e2e` and `npx prettier --check` on the changed files pass.

## Verify

```bash
npm ci && rg -q -F "whenStable" .claude/skills/ngx-yeti-specs/SKILL.md && rg -q -F "button.md:315" .claude/skills/ngx-yeti-specs/SKILL.md && rg -q -F ":active" .claude/skills/ngx-yeti-specs/SKILL.md && rg -q -i "stable" packages/ngx-yeti/README.md && ! rg -q -U "accessibility(\s|\*)+stylesheet" packages/ngx-yeti/styles/src/provide-yeti-styles.ts packages/ngx-yeti/enter/src/enter.ts docs/specs/ledger.md && rg -q -F "stretch" packages/ngx-yeti/icon/src/icon.ts && ! rg -q -e "2e-518862816" -e "2e-947894595" -e "Nightly" apps/screen-reader-e2e/src/support/nvda.ts && npm exec nx -- run-many -t lint typecheck -p ngx-yeti screen-reader-e2e && npx prettier --check .claude/skills/ngx-yeti-specs/SKILL.md packages/ngx-yeti/README.md packages/ngx-yeti/styles/src/provide-yeti-styles.ts packages/ngx-yeti/enter/src/enter.ts packages/ngx-yeti/icon/src/icon.ts docs/specs/ledger.md apps/screen-reader-e2e/src/support/nvda.ts; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: no

## Log

- 2026-10-13 — created by planner (build repair 5), from review round 2 triage items 1, 7, 8, 14 (Departures part), and 15 (tmp/afk-m002/lars-review/r2/triage.md).
- 2026-10-14 — build_T056: widened the `:hover` Departures row to `:hover` or `:active`; added Departures rows for button.md:315 (press ratio in layer 4) and for the `whenStable` gate (setup.md:201/:240, ADR 0060 point 4, reason, never-stable consequence); one README sentence on usage rule 12; "global stylesheet" wording in provide-yeti-styles.ts, enter.ts and ledger row A11Y-33; icon.ts `align` doc names all five values; nvda.ts examples use `<n>`, `<title>`, `<browser>`. No code behaviour changed. Verify exactly as written: exit 0 (lint and typecheck for ngx-yeti and screen-reader-e2e, 5 tasks, all passed; prettier --check on the 7 files passed). Rule 13: `npx prettier --check .` passed; `nx affected -t lint typecheck test --base=HEAD`: 6 projects plus 2 dependency tasks, 15 tasks, all successful (6 from cache); test-storybook not in the affected run.
- 2026-10-13 — orchestrator Verify (isolate gsd-path-task/T056): pass, exit 0; output tail:
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
