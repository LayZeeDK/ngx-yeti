---
id: T058
title: Give the focus ring inside a painted band a colour that reads (A11Y-35) and add the plain-button usage rule for painted bands (Y17)
wave: 9
deps: [T056, T057]
status: pending
agent: null
base: null
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
