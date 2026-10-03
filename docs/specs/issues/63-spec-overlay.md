# 63. Spec: overlay (layout)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `overlay` layout, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/overlay.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

### Open

Each point is marked "(open: see ticket)" in the spec. Impact and confidence follow the trap-quadrant rule (map, Standing rulings, 2026-10-03). Neither point is in the trap quadrant, and neither blocks the spec.

1. **`fill` means two things on one element that is both a `stack` and a held child** (spec sections 3 and 4, usage rule 8). Impact MEDIUM: `yetiStack` (ticket 26 row 63) and `yetiOverlayChild` (row 51) both declare a boolean `fill`, so the compiler accepts both on one element and one `fill` attribute sets both. Yeti gives the word two meanings (`stack/docs.md`: "It is the stack that fills; on a child of an `overlay`, the same word means the child covers its box"). Measured on 2026-10-03 against Yeti's built CSS at the pin, in Chromium and Firefox: a `.stack` held child with `data-fill` in a 200 px box was 800 px tall, the viewport's height. Confidence HIGH. Recommendation: keep the overlay spec's usage rule ("put the stack inside the held child"), and have the orchestrator ask the [stack](66-spec-stack.md) writer to carry the same rule, so the two specs agree. No rename: input names follow Yeti's (building-blocks 1.3), and renaming one `fill` would break that rule for a case a usage rule covers. To overrule: rename one input (for example `coverBox`) in ticket 26 and both specs. Decided 2026-10-03 in ticket 50, decision 50 (orchestrator, full AFK mode).
2. **Yeti's docs veil is as tall as the viewport, not the box it covers** (spec section 8, usage rule 8). Impact LOW (Yeti's documentation, not its CSS contract), confidence HIGH. `Y/src/layouts/overlay/docs.md` puts `class="cover" data-over data-fill` on the veil; `.cover` sets `min-block-size: var(--yeti-cover-height)`, `100dvh` by default, and the held-child rules do not reset it. Measured as above: the docs veil was 800 px tall over a 76 px form at an 800 px viewport; with `--yeti-cover-height: auto` on the veil it was 76 px with the message centred. Recommendation: the orchestrator adds a Yeti row to `upstream-bugs.md` (docs example; verified: measured, Chromium and Firefox; minimal reproduction: the docs snippet itself), with no upstream report unless the user confirms one (map, Standing rulings, item 44). The spec's veil example already sets the token, so the spec does not change. Decided 2026-10-03 in ticket 50, decision 67 (orchestrator, full AFK mode).

Settled without an open point: the `fill` presentational-attribute kind on an `svg` held child. Ticket 26 row 51 reads "`inert` unless the element is an `svg`"; the spec confirms `inert` on every host, because the static forms `booleanAttribute` reads as true (`''`, `'true'`) are invalid SVG paint and are ignored (measured: same computed `fill` as no attribute, Chromium and Firefox), and adds usage rule 7 against a paint value. Also settled by records: the presence attribute and item file on the root only (ticket 50, multi-part items).

Evidence for the measurements: a probe page and script in the session's scratchpad, run against `D:/tmp/ngx-yeti-02/yeti/dist/yeti.css` (the build of `f52d1e8b9` ticket 26 used). WebKit was not measured: the installed WebKit build did not load the cross-directory `file:` stylesheet.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/overlay.md](../specs/overlay.md).

- User stories: 48.
- Open points: 2 (above), neither in the trap quadrant and neither blocking the spec.
- `YetiOverlay` (`[yetiOverlay]`, `exportAs: 'yetiOverlay'`) binds the class `overlay`, `gap` (`YetiGap`) and a boolean `fixed`, sets `data-ngx-yeti-item-overlay` (ADR 0045), acquires the item file, and provides `yetiOverlayToken`. `YetiOverlayChild` (`[yetiOverlayChild]`) binds `data-over` and `data-fill` from boolean `over` and `fill` inputs (ADR 0070 kind C); `fill` is `inert`. Both are types only; Yeti has no module for the overlay.
- No ledger row. The two accessibility requirements the overlay raises are on the consumer's markup and are usage rules (ADR 0015 point 4): covered controls are made `inert` (Yeti's visibility guide; WCAG 2.4.11), and a held child that can overflow is a Scroll region (ticket 17's measured `scrollable-region-focusable`; WCAG 2.1.1). Anything modal is the dialog's (manifest `a11y.notes`; Part 2 row 13).
- Usage rules also name the compositions that fight the centring, read from Yeti's CSS: anything that sets `translate` on a centred held child (`lift`, the moving `enter` arrivals, `attention="shake"`), and a fixed containing block from a transformed or `will-change` ancestor. A query container does not trap a `fixed` held child (measured, Chromium and Firefox).
