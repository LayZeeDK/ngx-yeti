---
id: T044
title: Walk nested selector lists in the published-output and accessibility gates, and state both once rules in enter's doc comment
wave: 4
deps: [T020, T021, T023, T049]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/src/published-output.node.spec.ts
  - packages/ngx-yeti/src/accessibility.node.spec.ts
  - packages/ngx-yeti/ngx-yeti-globals.css
  - packages/ngx-yeti/enter/src/enter.ts
  - packages/ngx-yeti/enter/src/enter.spec.ts
---

# T044 — Walk nested selector lists in the published-output and accessibility gates, and state both once rules in enter's doc comment

## Context

Third build repair, review round 1 of M002 (range f35b35f..1747fe0, triaged by the orchestrator on 2026-10-12; the triage file is a git-ignored local record, so every finding this task fixes is inlined here). This task holds the round's major on the package gates (triage item 20) and the package-code minors that share its files (items 1 and 8, and one batched cosmetic). Line numbers are at 1747fe0; T020, T021, and T023 edit three of these files first, so lines may have moved. T049 renames packages/ngx-yeti/accessibility.css to `packages/ngx-yeti/ngx-yeti-globals.css` before this task (the user's ruling of 2026-10-12); the quoted findings keep the old name.

Finding, major (triage item 20; g2 test analyzer, re-checked by the orchestrator). Criterion: setup.md:329 and its Departures row, the published-output check that no Yeti rule ships; setup.md:330 for the accessibility check. Observed, verbatim: "packages/ngx-yeti/src/published-output.node.spec.ts:101-110 (setup.md:329 and its Departures row). The `Selector` visitor collects only top-level `class` components. I checked the top-level `flatMap`; the agent probed lightningcss. lightningcss nests the selectors of `:where()`, `:is()`, `:not()` and `:has()` inside a pseudo-class component, so a Yeti class inside one of them is never collected and never reaches the `sanctionedSelectors` allowlist. A Yeti rule pasted in Yeti's own `:where(...)` idiom would ship unreported, and no negative test covers a nested class. Nothing in today's accessibility.css slips through this hole: the enter rule's `.enter` is top-level. accessibility.node.spec.ts:53-56 (setup.md:330) has the same root cause." Code at 1747fe0: `const classes = selector.flatMap((component) => component.type === 'class' && yetiClasses.has(component.name) ? [`.${component.name}`] : []);` and, in accessibility.node.spec.ts, `for (const component of selector) { if (component.type === 'class' && component.name.startsWith('ngx-yeti')) { classSelectors.push(component.name); } }`.

Finding, minor (g2 test analyzer): "published-output.node.spec.ts:43-46. The FESM regex `[^{};()]*\{` cannot cross a parenthesis, so `.card:not([x]) {` and `:where(.card) {` are not matched (agent probe)." Code: `` String.raw`\.(?:${[...yetiClasses]...join('|')})(?![\w-])[^{};()]*\{` ``.

Finding, cosmetic (g2 test analyzer, batched by the triage as "forced-colors block scan wording"): "packages/ngx-yeti/src/accessibility.node.spec.ts:99. `nonSystemColours` scans only blocks written exactly as `@media (forced-colors: active) {`." Code: `const opening = /@media\s*\(\s*forced-colors\s*:\s*active\s*\)\s*\{/g;`.

Finding, cosmetic (triage item 8; g1 code reviewer): "packages/ngx-yeti/accessibility.css:1-3. Evidence: `/* Each accessibility rule arrives with the item spec whose ledger row it closes. The two other rules are the enter once fix and the Firefox scale workaround below. */`. The enter once rule is itself the rule of ledger row A11Y-33 and arrived with the enter spec. Its own comment, lines 107-113, says "(upstream Y14, ledger row A11Y-33)", and the ledger's package column gives this exact rule. Claimed failure: the header counts the A11Y-33 rule as outside the "rule per ledger row" set, which contradicts its first sentence and the ledger. The Firefox workaround is the only rule with no ledger row."

Finding, minor (triage item 1; g1 type design). Criterion, enter.md:138: "the arrival is one-way; once `arrived` is true, no later value of `once` renders `data-once` again. A `once` that is `false` at the first client render is treated as already arrived, because the element has played its load arrival." Doc comment, enter.ts:77-79: "The arrival is one-way: once played, or when `once` is false at the first render in the browser, a later `true` renders nothing." Observed, verbatim: "`#arrived` is set only in two places: in `afterNextRender` when `once()` is false at the first client render (:97-101), and by the observer when the host intersects (:106-108). Say `once` is true at the first client render and its binding goes true, then false, then true before the host nears the viewport. The false step removes `data-once`, so Yeti's CSS plays the arrival. `#arrived` stays false and the observer stays connected, so the second true puts `data-once` back. The first intersection then removes it again and the arrival plays a second time. That breaks the one-way rule the doc comment promises." Triage fix: "latch `#arrived` when `once` reads false in the browser after the first render; layer-2 test for the toggle."

## Approach

- Selector gates: collect a class wherever it sits in a selector, including inside the selector lists of `:where()`, `:is()`, `:not()`, and `:has()` (and any other pseudo-class lightningcss gives a nested selector list), in both `packages/ngx-yeti/src/published-output.node.spec.ts` and `packages/ngx-yeti/src/accessibility.node.spec.ts`. One recursive walk per file is enough; do not add a shared helper module for two callers unless a third appears. Probe lightningcss's component shapes before relying on them (its version is the installed one).
- The `sanctionedSelectors` contract of T039 is unchanged (Interface contract): an entry still matches one comma-separated selector of a rule in `packages/ngx-yeti/ngx-yeti-globals.css`. A nested Yeti class in a sanctioned selector is sanctioned with it; a nested Yeti class in any other selector is reported.
- The FESM check: a Yeti class followed by its rule's `{` is found when a parenthesised part such as `:not([x])` or `:where(...)` sits between them, and when the class itself sits inside `:where(`, `:is(`, `:not(`, or `:has(`. It must still not report a class name inside a string that is not a rule.
- Negative tests that show each gate can fail: for each of `:where()`, `:is()`, `:not()`, and `:has()`, a stylesheet with a Yeti class (published-output) or an `ngx-yeti` class (accessibility) only inside that pseudo-class is reported; the two FESM shapes of the finding are reported. Write them the way the existing negative cases of `sanctionedSelectors` are written. The real stylesheet and the built package still pass.
- `nonSystemColours`: find the forced-colours blocks whatever the spacing, case, or added conditions of the media query (for example `@media (forced-colors: active) and (prefers-contrast: more)`), preferably through lightningcss's parsed media queries, which the spec already uses, rather than a wider regex. A negative test with one such form.
- `packages/ngx-yeti/ngx-yeti-globals.css`: only the header comment changes. It says every rule but the Firefox scale workaround closes a ledger row; the rules, their order, and their selectors do not change.
- Enter: after the first client render, `once` reading false latches the arrival (the arrival has played, as enter.md:138's reasoning says), so a later true renders no `data-once` and the observer, if any, is disconnected. A `once` true at the first render with no false since keeps today's behaviour. Keep the host bindings, the server HTML, and `packages/ngx-yeti/enter/src/enter.ssr.spec.ts` unchanged. The doc comment of `once` states the rule in the code's terms; no task id or date in it.
- Enter test first (TDD, AGENTS.md's red-commit exception): a layer-2 case in `packages/ngx-yeti/enter/src/enter.spec.ts` with the host below the fold and `once` bound through `inputBinding` to a signal: true at the first render, then false, then true; it expects no `data-once` after the second true, and exactly one `animationstart` on the host after it is scrolled into view (the spec's existing recorder and below-the-fold setup, `onTestFinished` restores). Run it on the current code and record the failure in the Log; a red commit names the failing test and says the next commit makes it pass, or the test and fix land in one commit with the red run in the Log.
- Bisect-safe commits: each commit passes `npx prettier --check .` and the affected lint, typecheck, and test targets.
- Skills: `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/ngx-yeti-accessibility/SKILL.md`, `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- Global stylesheet (T049): the package's own stylesheet is `packages/ngx-yeti/ngx-yeti-globals.css`, published as "ngx-yeti/ngx-yeti-globals.css" through the `exports` key "./ngx-yeti-globals.css"; its rules live inside one `@layer ngx-yeti` block. No file of the repository outside `docs/specs/`, `docs/decisions/`, `.project/`, and verbatim quotes names `accessibility.css`.
- Sanctioned selectors (T039): `packages/ngx-yeti/src/published-output.node.spec.ts` holds the table `sanctionedSelectors`, which maps a row id of `docs/specs/ledger.md` to every selector of that row's rule in `packages/ngx-yeti/ngx-yeti-globals.css`, one string per comma-separated selector. The spec fails when a selector of that stylesheet names a Yeti class and is outside `@layer ngx-yeti` or absent from the table, when a table entry matches no selector of the stylesheet, and when a key is not a row id of the ledger. A task that adds, changes, or removes such a rule changes its entry in the same commit.

## Intent coverage

- None

## Acceptance criteria

1. `packages/ngx-yeti/src/published-output.node.spec.ts` reports a Yeti class that appears only inside `:where()`, `:is()`, `:not()`, or `:has()` of a stylesheet selector outside `sanctionedSelectors`, with one negative test per pseudo-class, and its FESM check reports `.card:not([x]) {` and `:where(.card) {`; the real stylesheet and the built package pass.
2. `packages/ngx-yeti/src/accessibility.node.spec.ts` reports an `ngx-yeti` class nested in each of the four pseudo-classes, with one negative test per pseudo-class, and `nonSystemColours` scans a forced-colours block written with an added media condition, with a negative test; the real stylesheet passes.
3. The header comment of `packages/ngx-yeti/ngx-yeti-globals.css` names the Firefox scale workaround as the only rule without a ledger row; no rule or selector of the file changes.
4. A layer-2 case of `packages/ngx-yeti/enter/src/enter.spec.ts` binds `once` true, then false, then true below the fold and expects no `data-once` after the second true and one `animationstart` on arrival. The Log records it failing on the code at this task's base and passing after the fix, in Chromium, and the case passes in the `ci unit` container in Chromium, Firefox, and WebKit.
5. `packages/ngx-yeti/enter/src/enter.ssr.spec.ts` and every earlier case of `packages/ngx-yeti/enter/src/enter.spec.ts` pass unchanged.
6. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at each task commit.

## Verify

```bash
npm ci && npx playwright install chromium && rg -q -F ":where(" packages/ngx-yeti/src/published-output.node.spec.ts && rg -q -F ":has(" packages/ngx-yeti/src/accessibility.node.spec.ts && npm exec nx -- run-many -t lint typecheck -p ngx-yeti && npm exec nx -- test ngx-yeti -- src/published-output src/accessibility enter/src && node tools/ci-local/run-job.mjs ci unit -- npx nx test ngx-yeti -- --project=browser enter/src; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-12 — created by planner (build repair #3, review round 1 fixes; triage items 1, 8, 20 and the forced-colors scan cosmetic). Neither node spec holds `:where(` or `:has(` at 1747fe0, so the Verify fails if this task is skipped. deps T020, T021, T023 are file overlap only: each edits `packages/ngx-yeti/ngx-yeti-globals.css`, `packages/ngx-yeti/src/accessibility.node.spec.ts`, and `packages/ngx-yeti/src/published-output.node.spec.ts` before this task. The Verify ends by stopping the Nx daemon and keeps its own exit code; run it exactly as written and never set NX_DAEMON.
- 2026-10-12 — planner (build repair #3, the user's ruling to rename the package stylesheet, T049): deps gains T049 for file overlap (packages/ngx-yeti/ngx-yeti-globals.css and the two node specs). Paths outside the verbatim finding quotes now read ngx-yeti-globals.css, and the Interface contract gains the T049 global-stylesheet bullet; the quoted findings keep the file's old name.
