---
id: T039
title: Record the entry-point export rule and the audited departures, and bound the accessibility stylesheet's Yeti selectors by ledger row
wave: 4
deps: [T035]
status: done
agent: build_T039
base: 2e703719aa0b3e6f0fd8df20ff64e80021886694
worktree: null
task_branch: null
files:
  - .claude/skills/ngx-yeti-specs/SKILL.md
  - .claude/skills/ngx-yeti-accessibility/SKILL.md
  - packages/ngx-yeti/src/published-output.node.spec.ts
  - packages/ngx-yeti/src/name-collision.node.spec.ts
  - packages/ngx-yeti/project.json
---

# T039 — Record the entry-point export rule and the audited departures, and bound the accessibility stylesheet's Yeti selectors by ledger row

## Context

Build repair before wave 4. User rulings, verbatim (2026-10-11): "1-3: Approve.", whose third item is "3 tighten the published-output check to an allowlist"; "Something named `YetiScroller*` belongs in `ngx-yeti/scroller` only, except if it causes an issue to only have it in a secondary entry point. Consider this a general rule for all secondary entry points and exports."; and "7: Audit docs/specs/ to inform your decision.", on four places where a spec's wording and the workspace differ. The audit ran on 2026-10-11 (read-only, at 7e0045f); its conclusions are Claude's decisions under that ruling, not the user's words. docs/specs is never edited except its two ledgers, so each wording difference becomes a row in the Departures table of `.claude/skills/ngx-yeti-specs/SKILL.md`. This task writes records and two guards and changes no product source.

The export rule. Built state: `YetiScrollerJustify` is declared in `packages/ngx-yeti/scroller/src/scroller.ts` and exported from `ngx-yeti/scroller` only, and the primary entry point `packages/ngx-yeti/src/index.ts` is `export type * from './yeti-types'`. The records say otherwise: scroller.md:153 ("declared in the item's entry point from `YetiJustify` and re-exported by name from the primary entry point beside the vocabulary types"), the example at scroller.md:403 (`import type { YetiScrollerJustify } from 'ngx-yeti';`), ticket 50 decision 60 ("exported beside the re-exported vocabulary types"), and table.md:142 for `YetiTableAlign` ("It is exported beside the re-exported vocabulary types."). The user's ruling overrules them: the built state stays, and the rule covers every item-named export. `YetiTabsEmphasis` (tabs.md:124) follows it when tabs is built.

The published-output check. `withoutPackageLayer` in `packages/ngx-yeti/src/published-output.node.spec.ts` deletes every `@layer ngx-yeti` block of the accessibility stylesheet before the spec looks for Yeti rules, so any rule on a Yeti class inside that layer passes "holds no Yeti rule in any shipped stylesheet". `packages/ngx-yeti/src/accessibility.node.spec.ts` reports only class names that start with `ngx-yeti` and checks forced-colours values, so a copy of Yeti's `.card` rule pasted into the layer passes both specs (review of wave 3, 2026-10-11). The audit found that no record asks for a selector table: setup.md:329 means no copy of Yeti's CSS, and setup.md:330 gives the three limits. A table is a second copy of the ledger's selectors. The user approved it to close the hole, so the spec ties each key to a ledger row.

The audited differences. In each the workspace is right and the record's wording is recorded:

- setup.md:329 says the published output holds "no Yeti selector or `@layer yeti` block in the FESM bundles or any shipped CSS". Its source, ticket 13, is about a copy of Yeti's CSS and names no accessibility stylesheet. setup.md:210, :306, and :330, button.md:241, spinner.md:215, ticket 50 decisions 95 and 193, and the ledger rows A11Y-1a, 1c, 1d, 1f, 6, and 32 put the accessibility rules on Yeti's classes.
- sidebar.md:272, :286, and :316 say a center inside a sidebar keeps its auto inline margins "at a wide container". T013 measured in an isolated Chromium page: side by side (width `xs`, a 1200 px container) the inner center's margins are 0 px and 0 px in either stylesheet order, because the sidebar child's `flex-grow: 1` takes all the free space; stacked (width `lg`, at 1200 px and at 700 px) they are 300 and 300 px, and 175 and 175 px, with the sidebar file first, and 0 and 0 with the center file first. The story `sidebar--holding-center` and the Fixture case assert the order on a stacked pair.
- cover.md:282 and :286 list viewports of 1280 x 800 and 320 x 640 and name none for the 200 % text-zoom growth case; hero.md:332 has the same sentence. The workspace runs that case at 640 x 360. T014 measured in Chromium that at 320 px wide with 200 % text zoom the default story's zoomed `h1` overflows by 63 px inline. 320 px at 200 % is the 160 CSS px equivalent, below the 320 CSS px that WCAG 1.4.10 covers, and 640 px at 200 % is that equivalent (W3C, Understanding Reflow).
- enter.md:86, ADR 0003 point 1, and building-blocks 1.1 say the identity class is a static host class. `NgxYetiEnter` binds it (`'[class.enter]': 'true'`). T034 measured in WebKit 26.4 that with the static class `enter--inserted-preloaded` failed 5 of 20 runs (the host was added with `class="enter"` and no `data-once`, and an `animationstart` fired before `data-once` arrived), and 0 of 180 with the binding. The server HTML is unchanged.
- Stale text in the same skill: the Departures row for setup.md:210 says M001 created the stylesheet "with no accessibility rule", and the One-time tasks bullet says it "holds no accessibility rule yet". A11Y-32's rule landed in wave 3.

## Approach

- The rule goes under "Where code goes" in the specs skill: an export named after an item is declared in and exported from that item's secondary entry point only; the primary entry point exports Yeti's own types and nothing the package declares; an exception needs a measured issue (a build failure, a consumer that cannot import it), stated in a Departures row. Quote the user's ruling with its date.
- Departures rows, in the table's five columns (the record, what it says, what the workspace does, why, the owning skill), one per difference in Context: setup.md:329; sidebar.md:272, :286, and :316; cover.md:282 and :286 with hero.md:332; enter.md:86 with ADR 0003 point 1 and building-blocks 1.1; and scroller.md:153, scroller.md:403, ticket 50 decision 60, and table.md:142 for the export rule, with the user's words as the reason. Put the measurements in the Why column. Correct the row for setup.md:210. The row for enter's package rule (enter.md:27, :174, :307, and :322) is T040's and lands with that rule. Prettier formats the table.
- One-time tasks: delete the stale bullet. Keep its facts that stay true (the stylesheet is published through the `assets` entry and the `exports` map, where it is imported, and how the two builds resolve it) as plain text under "Where code goes", and repair the pointer to the one-time tasks in "Where a fix goes" of `.claude/skills/ngx-yeti-accessibility/SKILL.md`. Keep the heading "One-time tasks" only if a bullet remains.
- Selector table: replace `withoutPackageLayer` with the table and the checks of the Interface contract, on the lightningcss visitor the file already uses. Today's one entry is A11Y-32, with `.spinner` and `.button[aria-busy='true']::after`. The FESM check and the check of every other shipped stylesheet stay as strong as they are.
- Update the file's own self-tests so each check is shown to fail: a Yeti rule pasted inside the layer (a `.card` rule, for example) is reported; a sanctioned selector outside the layer is reported; a table entry that matches no selector is reported.
- The comment above the old function cites a planning id ("INTENT E7"). The new comment cites ledger rows only.
- Ledger keys: the spec reads `docs/specs/ledger.md` and expects each key of the table to be a row id there. That file is outside the project, so add it to the inputs of the `test` target in `packages/ngx-yeti/project.json`; otherwise a ledger edit could replay a cached pass.
- Primary entry check: one more test in `packages/ngx-yeti/src/name-collision.node.spec.ts`, built from that file's `exportedNames` and `yetiExportedNames`. The names the built primary entry point's declaration file exports are exactly the 46 names Yeti exports. Show that it can fail: export a package-declared type from the primary entry in the working tree, see the test fail, revert, and record the run in the Log.
- No product source changes. `YetiScrollerJustify` stays where it is, and the package README and changelog already name it under `ngx-yeti/scroller`.
- Never edit a spec under docs/specs, and neither ledger changes in this task.
- Skills: `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/ngx-yeti-accessibility/SKILL.md`, `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/type-safety/SKILL.md`, and `.claude/skills/yeti-pin/SKILL.md`.

## Interface contract

- Sanctioned selectors (T039): `packages/ngx-yeti/src/published-output.node.spec.ts` holds the table `sanctionedSelectors`, which maps a row id of `docs/specs/ledger.md` to every selector of that row's rule in `packages/ngx-yeti/accessibility.css`, one string per comma-separated selector. The spec fails when a selector of that stylesheet names a Yeti class and is outside `@layer ngx-yeti` or absent from the table, when a table entry matches no selector of the stylesheet, and when a key is not a row id of the ledger. A task that adds, changes, or removes such a rule changes its entry in the same commit.
- Item-named exports (T039; user ruling 2026-10-11): an export named after an item, such as `YetiScrollerJustify` or `YetiTableAlign`, is declared in and exported from that item's secondary entry point only. `packages/ngx-yeti/src/name-collision.node.spec.ts` asserts that the names the built primary entry point exports are exactly the names Yeti's typings export at the pin, so a package-declared name there fails it.

## Intent coverage

- None

## Acceptance criteria

1. The specs skill states the export rule under "Where code goes", with the user's ruling quoted and dated and the condition for an exception.
2. The Departures table has a row for each of: setup.md:329; sidebar.md:272, :286, and :316; cover.md:282 and :286 with hero.md:332; enter.md:86 with ADR 0003 point 1 and building-blocks 1.1; and scroller.md:153, scroller.md:403, ticket 50 decision 60, and table.md:142. Each says what the record says, what the workspace does, and why, with the measurement or the user's words.
3. The row for setup.md:210 no longer says the stylesheet has no accessibility rule; the stale one-time bullet is gone, its facts that stay true are kept in the skill, and the accessibility skill's pointer to it leads somewhere that exists.
4. `packages/ngx-yeti/src/published-output.node.spec.ts` holds `sanctionedSelectors` with A11Y-32's two selectors and passes on the built package. Its self-tests show it reporting a Yeti rule pasted inside `@layer ngx-yeti`, a sanctioned selector outside the layer, and a table entry with no matching selector; it also fails for a key that is not a row id of `docs/specs/ledger.md`, which is an input of the `test` target.
5. `packages/ngx-yeti/src/name-collision.node.spec.ts` asserts that the built primary entry point exports exactly Yeti's names, and the Log records the run in which a package-declared export there made it fail.
6. No file under docs/specs and no product source file changes.
7. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && rg -q -F "sanctionedSelectors" packages/ngx-yeti/src/published-output.node.spec.ts && rg -q -F "scroller.md:153" .claude/skills/ngx-yeti-specs/SKILL.md && rg -q -F "table.md:142" .claude/skills/ngx-yeti-specs/SKILL.md && rg -q -F "setup.md:329" .claude/skills/ngx-yeti-specs/SKILL.md && rg -q -F "sidebar.md:286" .claude/skills/ngx-yeti-specs/SKILL.md && rg -q -F "cover.md:286" .claude/skills/ngx-yeti-specs/SKILL.md && rg -q -F "enter.md:86" .claude/skills/ngx-yeti-specs/SKILL.md && npm exec nx -- run-many -t lint typecheck -p ngx-yeti && npm exec nx -- test ngx-yeti -- src/published-output src/name-collision src/accessibility.node; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: no

## Log

- 2026-10-11 — created by planner (build repair before wave 4; user rulings "1-3: Approve." item 3, the entry-point export ruling, and "7: Audit docs/specs/ to inform your decision."). The audit's findings in Context are from two read-only audits of 2026-10-11, whose files are not in the repository. The Verify ends by stopping the Nx daemon and keeps its own exit code; run it exactly as written and never set NX_DAEMON.
- 2026-10-12 — coder (build_T039): implemented.
  - Specs skill: the export rule under "Where code goes" (the user's ruling quoted and dated, plus when an exception applies); Departures rows for setup.md:329, sidebar.md:272/:286/:316, cover.md:282/:286 with hero.md:332, enter.md:86 with ADR 0003 point 1 and building-blocks 1.1, and scroller.md:153/:403 with ticket 50 decision 60 and table.md:142; the setup.md:210 row corrected. The stale one-time bullet and its heading are gone, and its facts that stay true now sit under "Where code goes". The frontmatter description no longer mentions one-time tasks. The accessibility skill's pointer now leads to "Where code goes" and names `sanctionedSelectors`.
  - published-output.node.spec.ts: `withoutPackageLayer` is replaced by `sanctionedSelectors` (A11Y-32: `.spinner`, `.button[aria-busy='true']::after`). Selectors are compared as lightningcss-parsed JSON, and the check tracks whether it is inside `@layer ngx-yeti` with generic `Rule`/`RuleExit` visitors. Measured: lightningcss 1.33 never calls a keyed `RuleExit: { 'layer-block' }`, and returning a modified StyleSheet from a visitor throws "failed to deserialize ... Specifier" on accessibility.css. New self-tests show the check reporting a `.card` rule pasted inside the layer, a sanctioned selector outside it, an entry with no matching selector, and a key that is not a ledger row. One more test checks that every real key is a ledger row id.
  - project.json `test` inputs: DEVIATION FROM APPROACH, please review. `{workspaceRoot}/docs/specs/ledger.md` as a file input is a no-op because `.nxignore` lists `/docs/specs`. Measured: `nx show target inputs ngx-yeti:test --check docs/specs/ledger.md` reported "not inputs". I used a `runtime` input instead: a node one-liner that prints the ledger's sha256. Measured: two runs gave 3/3 cache hits; after a ledger edit (A11Y-32 renamed) `ngx-yeti:test` ran again and failed with "accessibility.css: A11Y-32 is not a row of the ledger"; the ledger was then restored with `git checkout`.
  - name-collision.node.spec.ts: a new test asserts that the built `types/ngx-yeti.d.ts` exports exactly Yeti's names (sorted equality). Fail run: with `export type NgxYetiProbe = 'probe';` appended to packages/ngx-yeti/src/index.ts, the test failed (`+ "NgxYetiProbe"`, 1 failed | 2 passed). The file was reverted with `git checkout`.
  - No docs/specs file or product source changed; the git status shows only the declared files and this task file.
  - Verify (run exactly as written, from the worktree root): exit 0. lint and typecheck passed for ngx-yeti; test: 3 files, 18 tests passed. The first Verify run exited 1 (TS2305: lightningcss exports `Rule`, not `CssRule`); that is fixed. Prettier --check on the changed files passes.
- 2026-10-11 — orchestrator Verify (isolate gsd-path-task/T039): pass, exit 0; output tail:
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
