# 61. Spec: layer (layout)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `layer` layout, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/layer.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/layer.md](../specs/layer.md).

Two directives in `ngx-yeti/layer`, native platform, level 1, types only ([building-blocks.md](../building-blocks.md) Part 2 row 11):

- **`YetiLayer`**, the item directive, on `[yetiLayer]`. It binds the static `layer` class, `align: YetiAlign` to `data-align`, and `'[attr.align]': 'null'` (the `removed` kind, ticket 26 row 42). It sets the presence attribute `data-ngx-yeti-item-layer` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), loads the `layer` item file as a counted link, and provides `yetiLayerToken`.
- **`YetiLayerChild`**, a part directive, on `[yetiLayerChild]`. It binds `alignSelf: YetiAlign` and `justifySelf: YetiSelf` to `data-align-self` and `data-justify-self` (ticket 26 rows 43 and 44, kind C). It neither marks its host nor loads the file ([ticket 50](50-decide-open-points-of-the-specs.md), multi-part items).

The spec follows ticket 50's static-presentational-attribute decision for `align`, including the e2e frame check. It owns ledger row A11Y-10b. It meets that row with 4.5:1 exact-formula assertions on Yeti's caption scrim and on a badge with a solid `yetiPaint` panel, and with usage rule 3, which states the author's responsibility. Checked against the 46 names `yeti.d.ts` exports at the pin: neither `YetiLayer` nor `YetiLayerChild` is among them.

Counts: 47 user stories, 7 usage rules, 4 story ids, 3 open points (none HIGH impact, so none is in the trap quadrant).

### Open

1. **How to assert contrast over a translucent scrim** (spec sections 7 and Test layer 1). Impact MEDIUM, confidence MEDIUM. `--yeti-color-scrim` is the surface at 85% opacity (`Y/src/tokens/color.css:106`), so the caption's real background depends on the picture. That is why axe left the result incomplete. Options: (a) composite the scrim's computed colour over pure black and over pure white, the two extremes any picture can show through it, and assert at least 4.5:1 against both; (b) sample the story picture's pixels under the caption through a canvas; (c) ignore the alpha and test against the opaque surface. Recommendation: (a). It bounds every picture, needs no image decoding, and holds for any theme. (b) tests only one picture and is fragile across engines. (c) overstates the ratio. Inferred, not measured: with light and dark surfaces near Yeti's defaults, (a) gives about 9:1 or more, so no package rule is expected. To overrule: replace the two composites in the `layer--default` and `layer--dark-scheme` play functions with the chosen method. Decided 2026-10-03 in ticket 50, decision 55 (orchestrator, full AFK mode).
2. **Usage rule 4: no focusable control under a later opaque child** (sections 4 and 7, WCAG 2.2 2.4.11). Impact LOW, confidence HIGH. No record covers it. The stacking is Yeti's own documented behaviour, and the package cannot tell which children are opaque. Recommendation: keep it as a usage rule only, with no ledger row (the package adds no feature) and no check (checks belong to a later milestone). The loading-message example makes the covered form `inert`. To overrule: remove the rule and the 2.4.11 row, or add a ledger row if the orchestrator counts the rule as a package addition. Decided 2026-10-03 in ticket 50, decision 56 (orchestrator, full AFK mode).
3. **Ledger A11Y-10b's "What Yeti does" cell** reads "Text over an image; the author owns it". Yeti's own CSS adds a scrim to a `figcaption` that is a direct child of a `figure` `layer` (`Y/src/layouts/layer/layer.css:24-34`). That is the case in its example and in ticket 17's incomplete result, while the manifest's a11y note says "the layer does not add one". Impact LOW, confidence HIGH (read). Recommendation: change the cell to "Adds a scrim to a `figure` caption; other text over an image is the author's (`layer/manifest.json:72`)". Optionally, add an upstream-bugs row for the inconsistency between the manifest note and the CSS (read; not filed). To overrule: leave the cell as it is. The spec's usage rule 3 is the same either way. Decided 2026-10-03 in ticket 50, decision 57 (orchestrator, full AFK mode).
