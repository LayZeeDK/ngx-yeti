# 68. Spec: hero (recipe)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `hero` recipe, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/hero.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/hero.md](../specs/hero.md).

56 user stories, 3 open points. The spec maps the recipe's class and six attributes to `YetiHero` (`[yetiHero]`, `exportAs: 'yetiHero'`; inputs `threshold: YetiWidth`, `gap: YetiGap`, `ratio: YetiRatio`, `align: YetiAlign`, `side: YetiSide`, `height: YetiHeight`) and its two markers to the Part directive `YetiHeroChild` (`[yetiHeroChild]`; `span: YetiSpan`, `min: YetiWidthOrNone`), in `ngx-yeti/hero`: native platform, level 1, types only. `align` is the `removed` kind (`'[attr.align]': 'null'`, static form allowed by [ticket 50](50-decide-open-points-of-the-specs.md) decision 9, with the no-painted-frame e2e case); `height`, `min`, and `span` are `inert` on the hero's hosts. Only `YetiHero` sets `data-ngx-yeti-item-hero` and acquires `recipes/hero/hero.css` (decision 6). Neither class name is among the 46 names `yeti.d.ts` exports, so no `NgxYeti` prefix. Building-blocks Part 2 row 18 and [ticket 26](26-decide-yeti-data-attributes-mapping.md) rows 70 to 77 agree. As a recipe, the spec links to the [cover](../specs/cover.md), [columns](../specs/columns.md), [frame](../specs/frame.md), and stack specs for the composed form rather than restating them, and its layer-1 and layer-4 cases compare the two forms as Yeti's own test does. No ledger row and no upstream-bug row is owned.

Checked: the manifest, `hero.css`, `docs.md`, `example.html`, the browser test and fixture, `attributes.css` line ranges, `yeti.css:38`, and the committed and generated layouts guides at `f52d1e8b9` (the Yeti clone is unchanged); `NgOptimizedImage`'s `fill` style binding and distortion check in the Angular 22.2.x clone. Inferred, not measured: every geometry and specificity reading of Yeti's CSS the usage rules rest on (a `frame` child overriding the hero's ratio, a `stack` copy losing its gap, the `center` tie).

### Open

1. **Extend upstream-bugs Y9 to the hero's rows.** Impact LOW, confidence HIGH. Yeti's committed `src/guides/layouts.md` is stale for more than `data-height`: its `data-min` row lists only `grid, masonry`, and its `data-span` row lists only `columns (> *)` with values `1` to `6`, while the generated `docs/guides/layouts.md` at the pin lists `hero (> *)` in both and `span`'s twelve values (`:111`, `:122`, read). The package already follows the manifest (ADR 0005). **Recommendation:** add the two rows to Y9's text and cite this spec beside the cover's; no upstream report without the user's confirmation. Decided 2026-10-03 in ticket 50, decision 74 (orchestrator, full AFK mode).
2. **`NgOptimizedImage` on a direct `img` child of the hero.** Impact MEDIUM, confidence MEDIUM. Decision 35 settles an image inside a wrapper (`fill` plus `position: relative` on the wrapper). A direct child cannot take `fill`: Angular binds `position: absolute` for it (`NGP/common/src/directives/ng_optimized_image/ng_optimized_image.ts:260`, read), which takes the image out of the flex row, so the copy would fill the row alone (inferred from the CSS flexbox rule for absolutely positioned children, not measured). With `width` and `height`, `base/reset.css` gives media `block-size: auto` and the hero crops with `object-fit: cover`, but the development-mode distortion check (`:1103-1123`, read) warns whenever the hero's `ratio` differs from the image's own. A `figure` with a `figcaption` cannot take the wrapper form either, because a `fill` image would cover the caption. **Recommendation:** usage rule 11 as written: `width` and `height` with the image's ratio equal to the hero's `ratio`; the wrapper with decision 35's rule where they must differ; never `fill` on a direct child; `priority` on the opening picture. The `hero--optimized-image` story records both forms' console output. If the direct form warns anyway, the rule becomes "expect the development-mode warning when the ratios differ". Decided 2026-10-03 in ticket 50, decision 75 (orchestrator, full AFK mode).
3. **A play-function contrast assertion for the caption.** Impact LOW, confidence MEDIUM. The caption is the only text colour `hero.css` sets (`--yeti-color-text-muted` at `--yeti-text-sm`), and Yeti's example has no caption, so ticket 17's clean axe run never rendered it. ADR 0015 point 3 asks for a play-function assertion only where axe leaves contrast incomplete; axe should compute a caption on a plain surface, so the Story gate alone may suffice. **Recommendation:** keep the assertion in `hero--caption` at 4.5:1 in light and dark (decision 8's threshold), because it costs one helper call and catches a pin move that lowers the muted token's contrast even if axe's result becomes incomplete. If the orchestrator reads ADR 0015 point 3 strictly, remove the assertion and the 1.4.3 row's sentence about it; the Story gate still runs. Decided 2026-10-03 in ticket 50, decision 76 (orchestrator, full AFK mode).

No open point has HIGH impact with confidence below HIGH, so none needs a trap-quadrant record. None blocks the spec.
