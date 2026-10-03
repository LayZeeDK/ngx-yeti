# 87. Spec: seam (component)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `seam` component, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/seam.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

### Open

Six points no record settles. None is HIGH impact, so none is a trap-quadrant decision. Each is marked "(open: see ticket)" in the spec.

1. **Which elements may host `yetiSeam`, and so where HTML `size` is `inert`** (LOW impact, MEDIUM confidence). Ticket 26 row 138 marks `size` as `inert` "on Yeti's hosts" without naming them, and building-blocks 1.4 asks each spec to state the kind on its hosts. The spec's reading (usage rule 1): a block-level band element, `section` as every Yeti example writes it (`Y/src/components/seam/example.html`, `docs.md`, `Y/src/guides/components.md:159-166`), or `div`, `header`, `footer`, `article`, `aside`; never a form control or `hr` (where HTML `size` acts) and never a replaced element (`img`, `video`), which renders no `::before`/`::after`, so Yeti's in-flow depth would be missing. A `section` seam gets a heading or is a `div` (ticket 17 section 2.2: the example's three headingless `section`s draw the Nu warning "Section lacks heading"). Recommendation: accept usage rule 1 as written, as decision 77 did for the badge. Decided 2026-10-03 in ticket 50, decision 183 (orchestrator, full AFK mode).
2. **Padding so the clip does not cut a child's focus ring** (MEDIUM impact, MEDIUM confidence). `clip-path` and `mask-image` clip everything the section paints outside its border box, so a ring of a child flush with the section's inline edge is cut (WCAG 2.4.7; read in `seam.css`, not measured). Yeti's docs already say to give the section its padding (`docs.md`; `components.md:156`). Options: (a) usage rule 2 plus the `seam--focus` story and the layer-4 ring-pixel crop, no ledger row; (b) a package rule in `@layer ngx-yeti` adding padding to `.seam`, which would change Yeti's look and its "the seam never manages that padding" contract. Recommendation: (a), after decisions 37 and 56 (usage rule, no ledger row, no package CSS for content the author places). Decided 2026-10-03 in ticket 50, decision 184 (orchestrator, full AFK mode).
3. **A fixed height lets the clip cut overflowing text** (MEDIUM impact, MEDIUM confidence). With a fixed `block-size`, text grown by zoom or user text spacing overflows the box and is clipped by the polygon or mask instead of spilling (WCAG 1.4.4, 1.4.12; inferred from `seam.css`; Yeti's own fixture fixes 240 px for measurement). Recommendation: usage rule 3 (no fixed height; `min-block-size` allowed), the layer-1 spacer-clearance assertion, and the layer-4 200% zoom and text-spacing cases; no ledger row unless layer 4 finds Yeti's own example clipped, which would add a row on the A11Y-10a pattern. Decided 2026-10-03 in ticket 50, decision 185 (orchestrator, full AFK mode).
4. **Descendants that reach past the section's edges** (LOW impact, LOW confidence). A CSS-positioned tooltip bubble or any absolutely positioned child beyond the border box is clipped like the rest of the section; top-layer `popover` and `dialog` are not (inferred, not measured). Recommendation: usage rule 4 as written, and the layer-4 recorded (not asserted) tooltip and popover cases; the tooltip spec may state the same rule from its side. Decided 2026-10-03 in ticket 50, decision 186 (orchestrator, full AFK mode).
5. **The `data:` mask strips under a Content Security Policy** (LOW impact, LOW confidence). The curve and wave strips are `data:` SVG URLs (`seam.css:7-12`); an `img-src` without `data:` should block them (inferred). What the engines then draw is not measured. Recommendation: usage rule 6 as a documentation note for the `setup` spec's CSP guidance, plus the layer-4 recorded case under `img-src 'self'`; no package change, since the strips are Yeti's. Decided 2026-10-03 in ticket 50, decision 187 (orchestrator, full AFK mode).
6. **Forced colours** (LOW impact, HIGH confidence). Under `forced-colors: active` the section's background becomes the system canvas, so the cut no longer shows; the content stays readable and the cut carries no meaning (manifest: "Decorative only"). Recommendation: no ledger row and no package CSS, after decisions 30 and 78; layer 4 asserts text contrast and records a screenshot. Decided 2026-10-03 in ticket 50, decision 188 (orchestrator, full AFK mode).

Note for the orchestrator (not an open point of this spec): architecture-guide P6 says that for `seam box` "the spec of each says so", and the [box](../specs/box.md) spec names `center box` but not `seam box`. The box spec's composed story may want a `seam` line.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/seam.md](../specs/seam.md).

One item directive, `[yetiSeam]` (`YetiSeam`, `exportAs: 'yetiSeam'`, entry point `ngx-yeti/seam`), binding the static class `seam`, the presence attribute `data-ngx-yeti-item-seam`, and `data-shape`, `data-size`, `data-edge`, and `data-flip` from `shape: YetiShape`, `size: YetiSizeControl` (HTML `size` `inert`), `edge: YetiEdge`, and `flip: boolean` (`booleanAttribute`); unset renders nothing. Types only, native platform level 1, no Module, no Aria or CDK, no ledger row. It is written beside `yetiBox` and `yetiPaint` as Yeti's `seam box` example does, each item directive with its own presence attribute and item file (ADR 0045; ticket 50 decision 12). It acquires `components/seam/seam.css` (rank after `table`, before `nav`) through `injectYetiItemStyles('seam')`. The spec's accessibility work is usage rules for what the clip can cut (padding, height, overflow) and the stories and e2e cases that assert them.

Counts: 46 user stories, 6 open points (none HIGH impact; none blocks the spec).
