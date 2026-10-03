# 01. Research: Angular 22's browser baseline against what Yeti expects

Type: research
Status: resolved
Blocked by:
Labels: wayfinder:research
Map: ../map.md

## Question

Which web platform features does Yeti's CSS and JavaScript use, and which of them fall outside Angular 22's browser baseline? For each one that falls outside, does Yeti guard it with a fallback?

The baselines are:

- Angular 22's: Baseline widely available on 2026-05-07, https://web-platform-dx.github.io/supported-browsers/?widelyAvailableOnDate=2026-05-07&includeDownstream=false, with the core table Chrome, Edge, and Firefox 119 and Safari 17.
- Yeti's: its README says "Yeti targets **Baseline 2025**. Anything that reached Baseline by the end of 2025 is used without guards; newer features sit behind `@supports` with a working fallback."

## User instruction, 2026-10-01

> Compare Angular 22's browser baseline to what Yeti expects to be available in a browser.

An earlier request named these features as examples: "container queries, `popover`s, `dialog`s, anchor positioning, cascade layers, native nesting, `light-dark()`, and scroll-snap".

## How to work it

Use a `/research` subagent with a scripted, exhaustive scan rather than a reading.

1. Parse every CSS file under `github.com/foundation/yeti/src/` with a CSS parser, and every JavaScript module with a JS parser.
2. Map each property, value, selector, at-rule, function, unit, and DOM API to its `web-features` id. Use the `web-features` npm package, pinned, installed under `D:/tmp`.
3. For each feature, record:
   - its Baseline status, low date, and high date;
   - whether it is in Angular 22's set on 2026-05-07;
   - whether it is in Yeti's set, Baseline newly available by 2025-12-31;
   - whether Yeti guards it (`@supports`, a feature check in JS) and what the fallback does;
   - the files and lines that use it.
4. Report the features in Yeti's set but not in Angular's, with their guard status, and say which Yeti components depend on each unguarded one. Report the browser versions each baseline implies.

Write `research/browser-baseline-vs-yeti.md` with the table, the method, and the unknowns. Append an `## Answer`. Decide nothing; [Decide: the browser target](06-decide-browser-target.md) chooses.

## Answer

Resolved 2026-10-01 by Claude Opus 5.5. Findings: [research/browser-baseline-vs-yeti.md](../research/browser-baseline-vs-yeti.md). Scan scripts: `D:/tmp/ngx-yeti-01/` (`scan.mjs`, `gen-confirm.mjs`, `report.mjs`, `bbm.mjs`). Decides nothing.

- The sets imply Chrome, Edge, and Firefox 119 and Safari 17 for Angular 22, against Chrome and Edge 141, Firefox 145, and Safari 26.2 for Yeti's Baseline 2025. Checked with web-features 3.40.1 and `baseline-browser-mapping` 2.11.26.
- A parser-based scan of all 69 CSS and 10 JS files at `f52d1e8b9` matched 179 web-features ids (219 with the HTML examples). 33 fall outside Angular's set: 19 inside Yeti's set and 14 outside both. Checked.
- Guards: 4 are guarded on every use (anchor positioning, scroll-driven animations, `field-sizing`, `interpolate-size`), 2 on some uses (`:has()` 12 of 82, `popover` 19 of 148), and 27 on none. `<details name>` appears only in the HTML examples, unguarded. This matches Yeti's rule, except for 10 cosmetic Baseline-`false` features it uses unguarded. Checked.
- Breaks components in Angular's browsers (inferred, not run in a browser): `light-dark()` (every colour role, and the base focus ring is lost); invoker commands (the dialog cannot open in any core browser of Angular's set); `popover` (dropdown and nav, Firefox 119-124); `:has()` (tooltip never shows, field errors are hidden and `validate.js:38` throws, plus shell, hero, media, nav bar mode, pagination, and the toggle focus ring, Firefox 119-120); `pow()` (xs, xl, 2xl, 3xl, and display text and space tokens, Chrome/Edge 119); alt text on generated content (breadcrumb separators, toc numbers); `<details name>` (accordion exclusive mode).
- Of the named features, container queries, `<dialog>`, cascade layers, and scroll snap are inside both sets. `popover` and `light-dark()` are inside Yeti's set only, and anchor positioning is outside both but guarded. Native nesting is not used: 0 nested rules, 0 `&`. Checked.
- Corrections to the earlier reading-based pass: button's `:has()` is inside forgiving `:is()`, and so survives; `pow()` feeds only five steps, not every size or radius; the keys Yeti uses date `popover` to 2024-04-16, with Firefox the only gap; the pass missed `validate.js`'s `:has()` and seven features. Checked.
- Not confirmed: real browser behaviour; which browsers pass `@supports (grid-template-rows: masonry)` (it has no BCD key); `display: grid` on `<details>` in the floor browsers; SVG features in the examples.

Note, 2026-10-01 ([Task: carry the old map's Yeti findings into this bundle](05-task-carry-yeti-findings-from-old-map.md)): section 3 of [research/yeti-foundation-7.md](../research/yeti-foundation-7.md) is the earlier reading-based pass of the same question (20 unguarded features), which this ticket's scan corrects.
