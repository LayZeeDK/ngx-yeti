# 58. Spec: frame (layout)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `frame` layout, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/frame.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/frame.md](../specs/frame.md).

44 user stories, 3 open points. The spec maps the frame's class and its one attribute to `YetiFrame` (`[yetiFrame]`, `exportAs: 'yetiFrame'`, input `ratio: YetiRatio`) in `ngx-yeti/frame`: native platform, level 1, types only, with no Part directive for the one unmarked child. The directive sets the presence attribute `data-ngx-yeti-item-frame` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)) and acquires `frame.css`. `YetiFrame` is not among the 46 names `yeti.d.ts` exports, so no `NgxYeti` prefix is needed. Building-blocks Part 2 row 8, [ticket 11](11-decide-spec-list.md) row 8, and [ticket 26](26-decide-yeti-data-attributes-mapping.md) row 30 agree. No ledger row and no upstream-bug row is owned.

### Open

1. **`NgOptimizedImage` inside a frame.** Impact MEDIUM, confidence MEDIUM. In `fill` mode Angular positions the image absolutely with `inset: 0` (`NGP/common/src/directives/ng_optimized_image/ng_optimized_image.ts:260-263`, read). `frame.css` sets no `position` (read), so the image is placed against the nearest positioned ancestor instead. With `width` and `height`, Yeti's CSS still stretches and crops the image. But Angular's development-mode distortion check compares the rendered and intrinsic ratios and does not read `object-fit` (`:1103-1123`, read), so it warns whenever the frame's ratio differs from the image's. Nothing was measured. **Recommendation:** usage rule 6 as written: `fill`, plus `position: relative` on the frame in the consumer's own stylesheet. Add no package CSS, because the package's own CSS is for accessibility only (map, Standing rulings, 2026-10-02), and add no host style binding, because ADR 0004 allows one only for a token a Module writes. The `frame--optimized-image` story records both forms' console output. If it shows that `fill` misbehaves in a frame, the rule becomes "use `width` and `height`, and expect the development-mode warning".
   Decided 2026-10-03 in ticket 50, decision 35 (orchestrator, full AFK mode).
2. **Embedded media reload at hydration.** Impact MEDIUM, confidence MEDIUM. Hydration writes every static template attribute again (ticket 18, measured). An `iframe` reloads when `srcdoc` is set to its same value (ticket 33 C2, measured in three engines). The HTML standard reloads an `iframe` on any `src` set and re-runs a media element's load algorithm on any `src` set (read; inferred for an Angular build). So a server-rendered embed in a frame loads twice, and anything a reader did before hydration is lost. The frame is the item Yeti names for embeds (`docs.md`), but the cause is Angular's and the platform's, not the directive's. **Recommendation:** keep usage rule 7 (a `video` takes `<source>` children, whose `src` is inert once inserted; the `iframe` reload is documented) and the layer-4 case that counts loads across hydration. If the case confirms the `iframe` reload, add an Angular row to `upstream-bugs.md`. Filing it upstream needs the user's confirmation. A package mechanism that avoids the reload, such as rendering the embed only on the client, would cost the JavaScript-off guarantee and is not proposed.
   Decided 2026-10-03 in ticket 50, decision 36 (orchestrator, full AFK mode).
3. **Text inside a frame, and a ledger row for it.** Impact LOW, confidence MEDIUM. `frame.css` gives a fixed `aspect-ratio` with `overflow: hidden` (read). Under CSS Sizing 4, a box that clips gets no content-based minimum size (inferred, not measured), so text that is enlarged or spaced out (WCAG 1.4.4, 1.4.12) is cut off instead of growing the frame. Yeti names the non-media child "a placeholder or an icon" (`docs.md`), and Part 2 row 8 gives the item no ledger row. **Recommendation:** usage rule 5 as written (text the reader needs goes beside the frame, for example in a `figcaption`), with no ledger row and no package CSS. This follows Part 2 row 12's `masonry` precedent: a risk the author owns is a usage rule. Revisit if the ledger is read as covering every author-owned risk Yeti's CSS creates.
   Decided 2026-10-03 in ticket 50, decision 37 (orchestrator, full AFK mode).

No open point has HIGH impact with confidence below HIGH, so none needs a trap-quadrant record. None blocks the spec.
