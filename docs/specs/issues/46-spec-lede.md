# 46. Spec: lede (utility)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `lede` utility, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/lede.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/lede.md](../specs/lede.md).

One item directive, `YetiLede` on `[yetiLede]`, in `ngx-yeti/lede`: a static `lede` host class, a static `data-ngx-yeti-item="lede"`, the `lede` item file acquired as a counted link ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)), `exportAs: 'yetiLede'`, and no input, output, listener, or token. Native platform, level 1 ([building-blocks.md](../building-blocks.md) Part 2 row 46). The spec owns ledger row A11Y-10e and meets it with an exact-formula contrast assertion in the play function ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 3). Checked at the pin: `YetiLede` is not among the 46 names `yeti.d.ts` exports, so the class takes `Yeti`.

Counts: 38 user stories, 4 usage rules, 4 story ids, 3 open points (none HIGH impact, so none is in the trap quadrant). No new ledger or upstream-bug row is written by this ticket; open points 2 and 3 ask the orchestrator for one correction and one row.

### Open

1. **The contrast threshold for the lede** (spec sections 7 and Testing, layer 1). No record says whether the play function asserts 4.5:1 (normal text) or 3:1 (large text). The lede's size is `--yeti-text-lg` at the pin, a fluid step of about 19 to 24 px, regular weight, so it counts as large text only at the top of its range, and a consumer may lower the token. Recommendation: assert at least 4.5:1 for the lede and for the heading above it, in the light and dark schemes, because the stricter threshold holds for any size a theme sets. Impact: MEDIUM (if Yeti's default passes 3:1 but fails 4.5:1, the stricter threshold would require a package rule under A11Y-10a). Confidence: HIGH.
   Decided 2026-10-03 in ticket 50, decision 8 (orchestrator, full AFK mode).
2. **Ledger A11Y-10e's "What Yeti does" cell** reads "as A11Y-10b" (text over an image; the author owns it, `layer/manifest.json:72`). The lede's example has no image, and ticket 17's incomplete result names the example's heading as "partially obscured" (Chromium and Firefox; cause not traced). Recommendation: the orchestrator edits the cell to "Plain text on the page surface; axe left `color-contrast` incomplete on the example's heading as partially obscured, cause not traced", and leaves the other columns as they are. The spec's play function already checks both the heading and the lede. Impact: LOW (documentation only). Confidence: HIGH that the current cell does not describe the lede; MEDIUM on the cause.
   Decided 2026-10-03 in ticket 50, decision 23 (orchestrator, full AFK mode).
3. **Yeti's manifest support block for `lede`** lists `support.unguarded` as empty, while `lede.css:17` uses `text-wrap: pretty`, which [ticket 01](01-research-browser-baseline-vs-yeti.md) finds outside Baseline 2025 (Firefox) and unguarded. Recommendation: add upstream-bugs row Y8 ("the `lede` manifest's `support.unguarded` omits `text-wrap: pretty`"; read; no minimal reproduction; not filed), unless Yeti counts cosmetic features as outside that list on purpose, which nothing read here says. Impact: LOW (cosmetic; the package does nothing either way). Confidence: MEDIUM.
   Decided 2026-10-03 in ticket 50, decision 25 (orchestrator, full AFK mode).
