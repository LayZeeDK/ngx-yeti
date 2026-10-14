---
id: T058
title: Give the focus ring inside a painted band a colour that reads (A11Y-35) and add the plain-button usage rule for painted bands (Y17)
wave: 9
deps: [T056, T057]
status: done
agent: build_T058
base: 0287445e264fc9160dbbd21408e3eb720521e517
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/ngx-yeti-globals.css
  - packages/ngx-yeti/src/published-output.node.spec.ts
  - packages/ngx-yeti/src/accessibility.node.spec.ts
  - packages/ngx-yeti/box/src/box.stories.ts
  - packages/ngx-yeti/box/src/box-paint.ts
  - packages/ngx-yeti/box/src/box.ts
  - packages/ngx-yeti/CHANGELOG.md
  - docs/specs/ledger.md
  - docs/specs/upstream-bugs.md
  - .claude/skills/ngx-yeti-specs/SKILL.md
  - .claude/skills/ngx-yeti-accessibility/SKILL.md
---

# T058 — Give the focus ring inside a painted band a colour that reads (A11Y-35) and add the plain-button usage rule for painted bands (Y17)

## Context

Fifth build repair (2026-10-13). Lars ruled on 2026-10-13, verbatim: "Resolve all blocked items that don't require a heavy load." Under that delegation Claude made two calls (STATE log of 2026-10-13; commit f85e1c7, a7884ee after the history rewrite): "A11Y-35 gets a package focus-ring rule inside painted bands after measuring all 20 paint values (next plan repair); Y17 gets a usage rule and ledger row, no package CSS (next plan repair)". Both are box gaps; they share `docs/specs/ledger.md` and `box.stories.ts`, so they are one task.

A11Y-35 (ledger row, verbatim in substance): "A focusable element inside a `primary` painted band shows a focus ring in the band's own colour: the ring is drawn, but it is 1.00:1 against the band in the light and the dark scheme." Source: WCAG 2.2 1.4.11 Non-text Contrast and 2.4.7 Focus Visible. What Yeti does: "`:focus-visible` draws `outline: 2px solid var(--yeti-color-focus)` at a 2 px offset (`src/base/typography.css:101-104`), `--yeti-color-focus` is `var(--yeti-color-primary)` (`src/tokens/color.css:107`), and `[data-paint=\"primary\"]` fills with the same `--yeti-color-primary` (`src/layouts/attributes.css:404`); no rule changes the ring inside a painted band". Package column today: "None yet ... One rule in `@layer ngx-yeti` that gives the ring a colour that reads on the band is pending the user's decision ...; the other paint values are not yet measured". Measured 2026-10-12 in Chromium: outline `oklch(0.52 0.15 250)` on a band of `oklch(0.52 0.15 250)` in the light scheme, `oklch(0.7 0.15 250)` on the same in the dark; the ring is 5.04:1 and 7.18:1 against the plain button's own fill. Upstream row Y16 says the same and "Other paint values were not measured. The accessibility gap is ledger row A11Y-35; the package adds no rule for it yet."

The grounds for a package rule: ADR 0015's 2026-10-02 note, verbatim: "The user ruled 'Accessibility CSS: Yes.' (map, Standing rulings): where Yeti's CSS fails, the package adds one small documented rule in its own `ngx-yeti` cascade layer, recorded as a ledger row that [the building-blocks map] gives an owning spec." No author workaround exists, because the ring colour is Yeti's. The box spec's 2.4.7 row (box.md:207) reads: "Not affected: nothing here takes focus. A focusable element inside a painted band keeps Yeti's focus ring; the paint story asserts the ring is drawn on a button inside a `primary` band (read, not measured for the box)." The rule departs from that row. INTENT's veto "Package CSS for a layout beyond a failing ledger assertion (box.md:325 ...)" allows it, because A11Y-35 is that failing assertion. box.md's Out of Scope also says "Package CSS for the middle greys or for forced colours: none", and prohibition N6 says forced-colours rules use only system colour keywords: leave forced colours to the user agent.

Y17 (upstream row, verbatim): "A plain `button` inside a painted band is unreadable. `src/base/controls.css:24-31` gives `button` the fill `--yeti-color-surface-raised` and sets no text colour, so inside `[data-paint=\"primary\"]` it inherits the band's `--yeti-on-primary` over that fill: 1.06:1 in the light scheme and 1.02:1 in the dark. Yeti's docs put a `.button` in a band, not a plain `button`. The package adds no rule for it; the `box--paint` story sets the button's colour with `yetiText`." Claude's call: no package CSS; a usage rule and a ledger row, with A11Y-34 as the precedent (its package column: "No package CSS. Usage rule 6 of the button spec, numbered in `YetiButton`'s JSDoc ...").

The `box--paint` story today (`packages/ngx-yeti/box/src/box.stories.ts`, `export const Paint`) renders the 17 text-bearing paints (`textPaints`) and the three middle greys (`fillPaints`, `grey-40` to `grey-60`), 20 values, in both schemes through `schemeWrapper`, with a `primary` band holding `<button type="button" yetiText="primary">Dismiss the news</button>`. Its focus check tabs to that button and asserts only that the ring is drawn ("Whether the ring stands out from the band is the ledger's, not asserted here").

## Approach

- Measure first, in a browser (Storybook's `box--paint`, Chromium): for each of the 20 paint values in the light and the dark scheme, the computed ring colour of a focused plain control inside the band, the band's background, and the band's text colour, and the ring-to-band ratio with the repository's contrast helper (`@ngx-yeti/testing`). Record the 40 measurements in the Log as a table before writing the rule.
- Then one rule in `@layer ngx-yeti` of `packages/ngx-yeti/ngx-yeti-globals.css` that draws the focus ring inside a painted band in the band's text colour (the colour Yeti made to read on that band), commented with its ledger row like the file's other rules, and the file's header comment kept true. Pitfall: `currentColor` on the focused element is its own text colour, not the band's (a `yetiButton` or a `yetiText` element sets its own), so the rule must reach the band's colour, not the control's. Change only the ring's colour: its style, width, and offset stay Yeti's. No `@media (forced-colors: active)` block, no Yeti token redefinition, no `--_yeti-*` token, no package class. If a paint value cannot reach 3:1 with the band's text colour, stop and write `NEEDS-ORCHESTRATOR:` with the measurements rather than choosing another colour scheme.
- `packages/ngx-yeti/src/published-output.node.spec.ts`: an `'A11Y-35'` entry in `sanctionedSelectors` naming the rule's selectors, as for `A11Y-1a`, `A11Y-32`, and `A11Y-33`. Add a check to `packages/ngx-yeti/src/accessibility.node.spec.ts` only if the rule needs one that the existing checks do not already make.
- `box--paint` asserts, for each of the 20 paint values in both schemes, that a focused control inside the band draws its ring with a ring-to-band ratio of at least 3:1 (WCAG 1.4.11). Assert it on a control that takes focus by keyboard, as the story's existing check does; keep the existing drawn-ring assertions. Replace the comment that says the ratio is not asserted.
- Y17: a usage rule numbered 8 in `NgxYetiPaint`'s JSDoc and in `YetiBox`'s (the box's rules are numbered as on `YetiBox`), worded "inside a painted band, use `yetiButton`, or set the button's text with `yetiText`", with the reason (a plain button keeps Yeti's raised fill and inherits the band's text colour).
- Records: ledger row A11Y-35's package, Verified, and Tested-by columns name the rule, the measurement, and the `box--paint` assertion. A new row A11Y-36 (owner box) for the plain button in a painted band: gap (1.06:1 light, 1.02:1 dark), source WCAG 2.2 1.4.3 Contrast (Minimum), what Yeti does (`src/base/controls.css:24-31`), package column "No package CSS" with usage rule 8 (as A11Y-34 words its usage rule), Tested by L1 `box--paint`. Upstream rows Y16 and Y17 point at A11Y-35's rule and at A11Y-36. A Departures row in `.claude/skills/ngx-yeti-specs/SKILL.md` for box.md:207 (the band keeps Yeti's ring) names the rule and its reason. One CHANGELOG entry for the rule and the usage rule. If `.claude/skills/ngx-yeti-accessibility/SKILL.md` lists the rules of the global stylesheet or their patterns, add this one.
- Engines: the focus ring and its colour can differ by engine, so the Verify runs the box stories in Chromium, Firefox, and WebKit through the `ci unit` container job.
- Skills: `.claude/skills/ngx-yeti-accessibility/SKILL.md` (contrast helper, thresholds, where a fix goes), `.claude/skills/ngx-yeti-stories/SKILL.md`, `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. The Log holds the ring, band, and band-text colours and the ring-to-band ratio for all 20 paint values in both schemes, measured before the rule.
2. `packages/ngx-yeti/ngx-yeti-globals.css` holds one rule in `@layer ngx-yeti`, commented with A11Y-35, that colours the focus ring inside a painted band with the band's text colour and changes nothing else about the ring and nothing under forced colours; `sanctionedSelectors` has an `'A11Y-35'` entry for it, and the published-output and accessibility node specs pass.
3. `box--paint` asserts a ring-to-band ratio of at least 3:1 for every one of the 20 paint values in the light and the dark scheme, and passes in Chromium, Firefox, and WebKit.
4. `NgxYetiPaint` and `YetiBox` carry usage rule 8 for buttons inside a painted band.
5. Ledger row A11Y-35 names the rule and its test; row A11Y-36 records the plain button in a band with usage rule 8 and no package CSS; upstream rows Y16 and Y17 point at them; the Departures table has the box.md:207 row; the CHANGELOG names both.
6. Lint and typecheck of `ngx-yeti` pass, and `npx prettier --check` passes on the changed files.

## Verify

```bash
npm ci && npx playwright install chromium && rg -q -F "A11Y-35" packages/ngx-yeti/ngx-yeti-globals.css && rg -q -F "'A11Y-35'" packages/ngx-yeti/src/published-output.node.spec.ts && rg -q -F "A11Y-36" docs/specs/ledger.md && rg -q -F "yetiButton" packages/ngx-yeti/box/src/box-paint.ts && npm exec nx -- run-many -t lint typecheck -p ngx-yeti && npm exec nx -- test ngx-yeti --skip-nx-cache -- src/published-output src/accessibility box/src && npm exec nx -- test-storybook ngx-yeti --skip-nx-cache -- box/src && node tools/ci-local/run-job.mjs ci unit -- npx nx test-storybook ngx-yeti --skip-nx-cache -- box/src && npx prettier --check packages/ngx-yeti/ngx-yeti-globals.css packages/ngx-yeti/src packages/ngx-yeti/box/src packages/ngx-yeti/CHANGELOG.md docs/specs/ledger.md docs/specs/upstream-bugs.md .claude/skills/ngx-yeti-specs/SKILL.md .claude/skills/ngx-yeti-accessibility/SKILL.md; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-13 — created by planner (build repair 5), from Claude's calls of 2026-10-13 on A11Y-35 and Y17 under Lars's ruling "Resolve all blocked items that don't require a heavy load." Assumption (planner): the new ledger row takes the next unused id, A11Y-36, and the new usage rule takes the next box number, 8.

- 2026-10-14 — build_T058 implementation note. Criterion 1, measured before the rule, taken from the orchestrator's spike (tmp/afk-m002/t058-spike/table.md, measure.mjs, results.json; Playwright Chromium, Firefox, WebKit, identical in all three; a plain button with data-text="primary" focused by Tab in a band of each paint value in a light and a dark color-scheme wrapper; ring = outline-color, band = background-color, ink = the band's text colour). 28 of the 40 values are under 3:1 without the rule (lowest 1.00 on primary in both schemes). "Before" is the ring-to-band ratio with Yeti alone, "after" with the rule (lowest 3.81, grey-50 dark):

| Case (scheme, paint, control) | Band | Band ink | Ring before | Before (Cr/Fx/Wk) | Ring after | After (Cr/Fx/Wk) |
|---|---|---|---|---|---|---|
| light, primary, plain | oklch(0.52 0.15 250) | oklch(0.99 0 0) | oklch(0.52 0.15 250) | 1 / 1 / 1 | oklch(0.99 0 0) | 5.36 / 5.36 / 5.36 |
| light, secondary, plain | oklch(0.52 0.15 300) | oklch(0.99 0 0) | oklch(0.52 0.15 250) | 1.07 / 1.07 / 1.07 | oklch(0.99 0 0) | 5.74 / 5.74 / 5.74 |
| light, success, plain | oklch(0.52 0.15 145) | oklch(0.99 0 0) | oklch(0.52 0.15 250) | 1.06 / 1.06 / 1.06 | oklch(0.99 0 0) | 5.04 / 5.04 / 5.04 |
| light, warning, plain | oklch(0.52 0.15 80) | oklch(0.99 0 0) | oklch(0.52 0.15 250) | 1.01 / 1.01 / 1.01 | oklch(0.99 0 0) | 5.42 / 5.42 / 5.42 |
| light, alert, plain | oklch(0.52 0.15 25) | oklch(0.99 0 0) | oklch(0.52 0.15 250) | 1.08 / 1.08 / 1.08 | oklch(0.99 0 0) | 5.8 / 5.8 / 5.8 |
| light, neutral, plain | oklch(0.52 0.02 250) | oklch(0.99 0 0) | oklch(0.52 0.15 250) | 1 / 1 / 1 | oklch(0.99 0 0) | 5.37 / 5.37 / 5.37 |
| light, white, plain | oklch(1 0 0) | oklch(0 0 0) | oklch(0.52 0.15 250) | 5.5 / 5.5 / 5.5 | oklch(0 0 0) | 21 / 21 / 21 |
| light, black, plain | oklch(0 0 0) | oklch(1 0 0) | oklch(0.52 0.15 250) | 3.82 / 3.82 / 3.82 | oklch(1 0 0) | 21 / 21 / 21 |
| light, grey, plain | oklch(0.565 0 0) | oklch(0 0 0) | oklch(0.52 0.15 250) | 1.21 / 1.21 / 1.21 | oklch(0 0 0) | 4.62 / 4.62 / 4.62 |
| light, grey-0, plain | oklch(0.99 0.02 250) | oklch(0.15 0.02 250) | oklch(0.52 0.15 250) | 5.31 / 5.31 / 5.31 | oklch(0.15 0.02 250) | 18.97 / 18.97 / 18.97 |
| light, grey-10, plain | oklch(0.906 0.02 250) | oklch(0.15 0.02 250) | oklch(0.52 0.15 250) | 4.15 / 4.15 / 4.15 | oklch(0.15 0.02 250) | 14.84 / 14.84 / 14.84 |
| light, grey-20, plain | oklch(0.822 0.02 250) | oklch(0.15 0.02 250) | oklch(0.52 0.15 250) | 3.17 / 3.17 / 3.17 | oklch(0.15 0.02 250) | 11.34 / 11.34 / 11.34 |
| light, grey-30, plain | oklch(0.738 0.02 250) | oklch(0.15 0.02 250) | oklch(0.52 0.15 250) | 2.36 / 2.36 / 2.36 | oklch(0.15 0.02 250) | 8.45 / 8.45 / 8.45 |
| light, grey-40, plain | oklch(0.654 0.02 250) | oklch(0.15 0.02 250) | oklch(0.52 0.15 250) | 1.73 / 1.73 / 1.73 | oklch(0.15 0.02 250) | 6.2 / 6.2 / 6.2 |
| light, grey-50, plain | oklch(0.57 0.02 250) | oklch(0.99 0.02 250) | oklch(0.52 0.15 250) | 1.24 / 1.24 / 1.24 | oklch(0.99 0.02 250) | 4.28 / 4.28 / 4.28 |
| light, grey-60, plain | oklch(0.486 0.02 250) | oklch(0.99 0.02 250) | oklch(0.52 0.15 250) | 1.16 / 1.16 / 1.16 | oklch(0.99 0.02 250) | 6.17 / 6.17 / 6.17 |
| light, grey-70, plain | oklch(0.402 0.02 250) | oklch(0.99 0.02 250) | oklch(0.52 0.15 250) | 1.66 / 1.66 / 1.66 | oklch(0.99 0.02 250) | 8.83 / 8.83 / 8.83 |
| light, grey-80, plain | oklch(0.318 0.02 250) | oklch(0.99 0.02 250) | oklch(0.52 0.15 250) | 2.33 / 2.33 / 2.33 | oklch(0.99 0.02 250) | 12.35 / 12.35 / 12.35 |
| light, grey-90, plain | oklch(0.234 0.02 250) | oklch(0.99 0.02 250) | oklch(0.52 0.15 250) | 3.03 / 3.03 / 3.03 | oklch(0.99 0.02 250) | 16.06 / 16.06 / 16.06 |
| light, grey-100, plain | oklch(0.15 0.02 250) | oklch(0.99 0.02 250) | oklch(0.52 0.15 250) | 3.58 / 3.58 / 3.58 | oklch(0.99 0.02 250) | 18.97 / 18.97 / 18.97 |
| dark, primary, plain | oklch(0.7 0.15 250) | oklch(0.15 0 0) | oklch(0.7 0.15 250) | 1 / 1 / 1 | oklch(0.15 0 0) | 7.39 / 7.39 / 7.39 |
| dark, secondary, plain | oklch(0.7 0.15 300) | oklch(0.15 0 0) | oklch(0.7 0.15 250) | 1.06 / 1.06 / 1.06 | oklch(0.15 0 0) | 7 / 7 / 7 |
| dark, success, plain | oklch(0.7 0.15 145) | oklch(0.15 0 0) | oklch(0.7 0.15 250) | 1.05 / 1.05 / 1.05 | oklch(0.15 0 0) | 7.79 / 7.79 / 7.79 |
| dark, warning, plain | oklch(0.7 0.15 80) | oklch(0.15 0 0) | oklch(0.7 0.15 250) | 1.02 / 1.02 / 1.02 | oklch(0.15 0 0) | 7.25 / 7.25 / 7.25 |
| dark, alert, plain | oklch(0.7 0.15 25) | oklch(0.15 0 0) | oklch(0.7 0.15 250) | 1.07 / 1.07 / 1.07 | oklch(0.15 0 0) | 6.91 / 6.91 / 6.91 |
| dark, neutral, plain | oklch(0.7 0.02 250) | oklch(0.15 0 0) | oklch(0.7 0.15 250) | 1 / 1 / 1 | oklch(0.15 0 0) | 7.4 / 7.4 / 7.4 |
| dark, white, plain | oklch(1 0 0) | oklch(0 0 0) | oklch(0.7 0.15 250) | 2.66 / 2.66 / 2.66 | oklch(0 0 0) | 21 / 21 / 21 |
| dark, black, plain | oklch(0 0 0) | oklch(1 0 0) | oklch(0.7 0.15 250) | 7.88 / 7.88 / 7.88 | oklch(1 0 0) | 21 / 21 / 21 |
| dark, grey, plain | oklch(0.565 0 0) | oklch(0 0 0) | oklch(0.7 0.15 250) | 1.7 / 1.7 / 1.7 | oklch(0 0 0) | 4.62 / 4.62 / 4.62 |
| dark, grey-0, plain | oklch(0.13 0.02 250) | oklch(0.93 0.02 250) | oklch(0.7 0.15 250) | 7.54 / 7.54 / 7.54 | oklch(0.93 0.02 250) | 16.34 / 16.34 / 16.34 |
| dark, grey-10, plain | oklch(0.21 0.02 250) | oklch(0.93 0.02 250) | oklch(0.7 0.15 250) | 6.65 / 6.65 / 6.65 | oklch(0.93 0.02 250) | 14.42 / 14.42 / 14.42 |
| dark, grey-20, plain | oklch(0.29 0.02 250) | oklch(0.93 0.02 250) | oklch(0.7 0.15 250) | 5.3 / 5.3 / 5.3 | oklch(0.93 0.02 250) | 11.49 / 11.49 / 11.49 |
| dark, grey-30, plain | oklch(0.37 0.02 250) | oklch(0.93 0.02 250) | oklch(0.7 0.15 250) | 3.9 / 3.9 / 3.9 | oklch(0.93 0.02 250) | 8.44 / 8.44 / 8.44 |
| dark, grey-40, plain | oklch(0.45 0.02 250) | oklch(0.93 0.02 250) | oklch(0.7 0.15 250) | 2.8 / 2.8 / 2.8 | oklch(0.93 0.02 250) | 6.07 / 6.07 / 6.07 |
| dark, grey-50, plain | oklch(0.53 0.02 250) | oklch(0.13 0.02 250) | oklch(0.7 0.15 250) | 1.98 / 1.98 / 1.98 | oklch(0.13 0.02 250) | 3.81 / 3.81 / 3.81 |
| dark, grey-60, plain | oklch(0.61 0.02 250) | oklch(0.13 0.02 250) | oklch(0.7 0.15 250) | 1.43 / 1.43 / 1.43 | oklch(0.13 0.02 250) | 5.28 / 5.28 / 5.28 |
| dark, grey-70, plain | oklch(0.69 0.02 250) | oklch(0.13 0.02 250) | oklch(0.7 0.15 250) | 1.04 / 1.04 / 1.04 | oklch(0.13 0.02 250) | 7.28 / 7.28 / 7.28 |
| dark, grey-80, plain | oklch(0.77 0.02 250) | oklch(0.13 0.02 250) | oklch(0.7 0.15 250) | 1.29 / 1.29 / 1.29 | oklch(0.13 0.02 250) | 9.75 / 9.75 / 9.75 |
| dark, grey-90, plain | oklch(0.85 0.02 250) | oklch(0.13 0.02 250) | oklch(0.7 0.15 250) | 1.69 / 1.69 / 1.69 | oklch(0.13 0.02 250) | 12.72 / 12.72 / 12.72 |
| dark, grey-100, plain | oklch(0.93 0.02 250) | oklch(0.13 0.02 250) | oklch(0.7 0.15 250) | 2.17 / 2.17 / 2.17 | oklch(0.13 0.02 250) | 16.34 / 16.34 / 16.34 |

  Also measured in the spike with the rule: a white band nested in a primary band (ring oklch(0 0 0), 21:1 light and dark) and a .button in a primary band (5.36 light, 7.39 dark). A registered <color> property set to currentColor fails the same 28 values (currentColor resolves at the focused control), so the rule maps each paint to its ink instead.
- Implementation: packages/ngx-yeti/ngx-yeti-globals.css holds, in @layer ngx-yeti, one --_ngx-yeti-band-ink line per paint value copied from Yeti's [data-paint] rules (vendor/yeti/src/layouts/attributes.css:404-423) and [data-paint] :focus-visible { outline-color: var(--_ngx-yeti-band-ink); }. published-output.node.spec.ts: 'A11Y-35' entry in sanctionedSelectors for '[data-paint] :focus-visible'; yetiRulesInStylesheet now asks isSanctioned for every selector (not only those naming a Yeti class) so an entry that names no class is matched and a vanished rule is reported ("matches no selector"), with one new unit test. accessibility.node.spec.ts: drift guard that parses the 20 [data-paint] colors of Yeti's attributes.css and asserts the globals mapping equals them, plus the ring rule. box--paint: 20 ring bands (a button with an aria-label and no text, so axe color-contrast has no text to judge) per scheme, each tabbed to, asserting the ring is drawn and at least 3:1 against the band; with the ring declaration removed the story failed at that assertion (checked, then restored). Usage rule 8 added to YetiBox and NgxYetiPaint JSDoc. Ledger A11Y-35 rewritten, A11Y-36 added; upstream Y16 and Y17 updated; Departures row for box.md:207, the globals paragraph and the accessibility skill bullet in the skills; CHANGELOG entry.
- UPSTREAM: yeti-css draws the focus ring in var(--yeti-color-primary) on every painted band, so the ring is under 3:1 against the band for 28 of 40 paint-and-scheme values (lowest 1.00 on primary), not only primary (row Y16 updated with this).
- Verify (exact command through the heavy lock with HEAVY_DOCKER=1, exit 0): lint and typecheck of ngx-yeti passed; node + unit run: 6 files, 55 tests passed; test-storybook box/src in Chromium: 1 file, 8 tests passed; ci unit container job (Chromium, Firefox, WebKit): 3 files, 24 tests passed; prettier --check on the changed paths passed. Criterion 6 extras (rule 13): npx prettier --check . passed; npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD passed for 6 projects and 2 dependency tasks, exit 0.
- 2026-10-14 — orchestrator Verify (isolate gsd-path-task/T058): pass, exit 0; output tail:
  ```
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/spinner
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/stack
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/table
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/timeline
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/visually-hidden
  ```
