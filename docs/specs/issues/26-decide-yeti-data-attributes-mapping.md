# 26. Decide: how the package maps each of Yeti's `data-*` attributes

Type: grilling
Status: resolved
Blocked by: 02, 07, 11, 16, 18, 20
Labels: wayfinder:grilling
Map: ../map.md

## Question

How does the package expose or manage each `data-*` attribute, marker, and vocabulary value in Yeti's contract? The manifest lists 32 vocabularies and 31 markers, per [Research: inventory of Yeti's components, layouts, recipes, utilities, and contract](02-research-yeti-inventory.md). The ways are:

- a typed input bound to the attribute;
- a host binding the directive owns;
- state Angular owns and writes;
- a static attribute the consumer writes;
- leaving it to the consumer.

What decides which, item by item?

## User instruction, 2026-10-01

The user's own message to the orchestrator, verbatim:

> 42. Audit Yeti's `data-*` attributes and determine how each will be mapped/managed by ngx-yeti.

## How to work it

AFK grilling. Start from the inventory's attribute table and the built manifest (`dist/yeti.manifest.json` of a build of `f52d1e8b9` under `D:/tmp`). Audit every attribute: its element, its values, and its default.

Apply these findings:

- From [Prototype: Yeti under SSR, hydration, `@defer`, event replay, and `animate.enter` and `animate.leave`](18-prototype-yeti-rendering-modes.md): hydration writes static template attributes again, so an attribute a user or a Yeti module can change before load must be Angular-owned state, not a static attribute.
- From [Research: binding Yeti's `yeti:*` events in Angular templates](16-research-yeti-events-in-angular-templates.md): how state changes are reported.
- From [Decide: which standing preferences and user rulings carry over](07-decide-inherited-preferences-and-rulings.md): whether the consumer writes Yeti's attributes at all.

Record one row per attribute in the Answer:

- the attribute;
- its item;
- its values;
- the mapping;
- the input name and type;
- the reason;
- what changes it at run time.

Then record an ADR for the rule that decides the mapping. Every mapping must work zoneless (map, Standing rulings).

## Answer

Resolved 2026-10-02 by Claude Opus 5.5, AFK grilling under the map's AFK override, against Yeti's built manifest, `dist/yeti.d.ts`, `dist/yeti.css`, and `dist/js/` at `f52d1e8b9` (the read-only build at `D:/tmp/ngx-yeti-02/yeti/`, `git log -1` = `f52d1e8b9`), the Angular 22.2.x clone, and ADRs 0003, 0004, 0005, 0011, 0012, 0013, and 0040. The rule is [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md). The map and `CONTEXT.md` are not edited here.

**Decision:** where a declaration sits decides its mapping. An attribute of the item's own element is a typed input on the item's root directive (R). A marker that changes a child is a typed input on the item's child directive (C). A marker that names a part is the part directive itself, as a static host attribute (P). A marker that works on any element is its own directive with a selector-named input (G). A utility attribute named as its item is the utility's selector-named input (U). The one attribute a Yeti module changes at run time, `data-once`, is Angular-owned state (S). Unset inputs render nothing, so Yeti's defaults apply; types are Yeti's own; no row is a static attribute the consumer writes, and none is left to the consumer.

### Counts per mapping kind (checked against the manifest)

| Kind | Mapping | Rows |
| --- | --- | --- |
| R | typed input on the item's root directive | 127 |
| U | typed input on the utility's root directive, selector-named | 4 |
| S | typed input plus Angular-owned state | 1 |
| C | typed input on the item's child directive | 19 |
| G | typed input on an any-element directive, selector-named | 6 |
| P | host attribute the part directive owns, static (10), or the `demo` component's template binding from a typed input (1) | 11 |
| - | static attribute the consumer writes | 0 |
| - | left to the consumer | 0 |
| | **Total** | **168** |

The row count matches the manifest's own counts: 49 items declare 132 attributes (R 127 + U 4 + S 1) and 36 markers (C 19 + G 6 + P 11), so 168 rows. They use 54 distinct attribute names and 31 distinct marker names, 6 of them both (`data-align`, `data-min`, `data-fill`, `data-sticky`, `data-border`, `data-nowrap`), for 79 distinct names. The inventory's 54 and 31 match ([ticket 02](02-research-yeti-inventory.md)). Attributes use 28 of the 32 vocabularies and markers alone use the other 4 (`paint`, `span`, `start`, `self`); `schema/vocabulary.json` has 32 vocabularies and `dist/yeti.d.ts` exports a `Yeti*` type for each. Three declarations carry their own value list rather than a vocabulary: the scroller's `data-justify`, the tabs' `data-emphasis`, and the table cell's `data-align`. Counted with a script over `yeti.manifest.json`, which also generated the table below, so every row's values and default are the manifest's.

### Reading the table

- **Reason codes** are ADR 0070's: R (an attribute of the item's own element), C (a marker on a child, which Yeti's CSS scopes to the parent), P (a marker that names a part), G (a marker with `on: "*"`, whose rule is in the always-loaded `attributes.css`, binding no class), U (an attribute named as its utility item; `''`, the bare selector, renders no attribute), S (Angular-owned state). Notes after the code say which Yeti module reads the attribute (checked with `rg` over `dist/js/`) and, where the input's name is an HTML attribute, the recommended kind under old map ticket 139 (`decide-inputs-named-like-presentational-attributes`)'s rule (`output`, `removed`, `inert`); each spec confirms the kind on its own hosts.
- **Yeti default** is the manifest's `default`. The input itself defaults to `undefined` (`false` for a boolean) and then renders no attribute, so Yeti's CSS applies that default (ADR 0070 rule 1).
- **Input** gives the input's name, the directive that declares it, and its type. Root selectors are `yeti` plus the item's PascalCase name, per the user's prefix ruling (map, Standing rulings). Child and part selectors (`yetiStackChild`, `yetiCardLink`, `yetiTableCell`, `yetiShellRegion`, `yetiCarouselTrack`, and so on) are provisional; each spec names them, as [Decide: the glossary](10-decide-glossary.md) Q9 left part names to the specs (corrected 2026-10-03, audit 0003 L7), and the input names stay. Types are imported from `yeti-css` (`dist/yeti.d.ts`), never redeclared; an own value list is an `Extract` of the vocabulary that holds it. Every input is an `input()` signal and every binding is `[attr.data-*]` from it, so every row works zoneless (ADR 0070 rule 4).
- **What changes it at run time**: "the consumer's binding only" means the value changes only when the consumer's bound input changes; no Yeti module is loaded beside the package ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md)), and no person can change a `data-*` attribute. "Never" means a static part marker.

### The table

| # | Attribute | Item | Values | Yeti default | Mapping | Input: name and type | Reason | What changes it at run time |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `data-gap` | box | 29 values (`gap`) | md | typed input | `gap` on `yetiBox`: `YetiGap` | R | the consumer's binding only |
| 2 | `data-gap-inline` | box | 29 values (`gap`) |  | typed input | `gapInline` on `yetiBox`: `YetiGap` | R | the consumer's binding only |
| 3 | `data-gap-block` | box | 29 values (`gap`) |  | typed input | `gapBlock` on `yetiBox`: `YetiGap` | R | the consumer's binding only |
| 4 | `data-surface` | box | base, raised, sunken |  | typed input | `surface` on `yetiBox`: `YetiSurface` | R | the consumer's binding only |
| 5 | `data-border` (marker, on `*`) | box | boolean |  | typed input on an any-element directive (selector-named) | `yetiBorder` on `[yetiBorder]`: `boolean` (`booleanAttribute`) | G | the consumer's binding only |
| 6 | `data-paint` (marker, on `*`) | box | 20 values (`paint`) |  | typed input on an any-element directive (selector-named) | `yetiPaint` on `[yetiPaint]`: `YetiPaint` (required) | G | the consumer's binding only |
| 7 | `data-text` (marker, on `*`) | box | 20 values (`paint`) |  | typed input on an any-element directive (selector-named) | `yetiText` on `[yetiText]`: `YetiPaint` (required) | G | the consumer's binding only |
| 8 | `data-max` | breakout | 2xs, xs, sm, md, lg, xl, 2xl | md | typed input | `max` on `yetiBreakout`: `YetiWidth` | R; HTML `max` (form controls): `inert` on Yeti's hosts | the consumer's binding only |
| 9 | `data-gap` | breakout | 29 values (`gap`) | md | typed input | `gap` on `yetiBreakout`: `YetiGap` | R | the consumer's binding only |
| 10 | `data-bleed` (marker, on `> *`) | breakout | boolean |  | typed input on the item's child directive | `bleed` on `yetiBreakoutChild`: `boolean` (`booleanAttribute`) | C | the consumer's binding only |
| 11 | `data-note` (marker, on `> *`) | breakout | boolean |  | host attribute the part directive owns (static) | none; presence of `yetiBreakoutNote` | P | never |
| 12 | `data-max` | center | 2xs, xs, sm, md, lg, xl, 2xl | xl | typed input | `max` on `yetiCenter`: `YetiWidth` | R; HTML `max` (form controls): `inert` on Yeti's hosts | the consumer's binding only |
| 13 | `data-gap` | center | 29 values (`gap`) | md | typed input | `gap` on `yetiCenter`: `YetiGap` | R | the consumer's binding only |
| 14 | `data-intrinsic` | center | boolean |  | typed input | `intrinsic` on `yetiCenter`: `boolean` (`booleanAttribute`) | R | the consumer's binding only |
| 15 | `data-gap` | cluster | 29 values (`gap`) | md | typed input | `gap` on `yetiCluster`: `YetiGap` | R | the consumer's binding only |
| 16 | `data-align` | cluster | start, center, end, stretch, baseline | center | typed input | `align` on `yetiCluster`: `YetiAlign` | R; HTML `align` (a hint on any element in Chromium and WebKit): `removed` | the consumer's binding only |
| 17 | `data-justify` | cluster | start, center, end, between, around, evenly | start | typed input | `justify` on `yetiCluster`: `YetiJustify` | R | the consumer's binding only |
| 18 | `data-threshold` | cluster | 2xs, xs, sm, md, lg, xl, 2xl |  | typed input | `threshold` on `yetiCluster`: `YetiWidth` | R | the consumer's binding only |
| 19 | `data-threshold` | columns | 2xs, xs, sm, md, lg, xl, 2xl | md | typed input | `threshold` on `yetiColumns`: `YetiWidth` | R | the consumer's binding only |
| 20 | `data-gap` | columns | 29 values (`gap`) | md | typed input | `gap` on `yetiColumns`: `YetiGap` | R | the consumer's binding only |
| 21 | `data-align` | columns | start, center, end, stretch, baseline | stretch | typed input | `align` on `yetiColumns`: `YetiAlign` | R; HTML `align` (a hint on any element in Chromium and WebKit): `removed` | the consumer's binding only |
| 22 | `data-justify` | columns | start, center, end, between, around, evenly | start | typed input | `justify` on `yetiColumns`: `YetiJustify` | R | the consumer's binding only |
| 23 | `data-columns` | columns | 1, 2, 3, 4, 5, 6 |  | typed input | `columns` on `yetiColumns`: `YetiColumns` | R | the consumer's binding only |
| 24 | `data-span` (marker, on `> *`) | columns | 12 values (`span`) |  | typed input on the item's child directive | `span` on `yetiColumnsChild`: `YetiSpan` | C; HTML `span` (form controls, `col`): `inert` on Yeti's hosts | the consumer's binding only |
| 25 | `data-show` (marker, on `*`) | container | 2xs, xs, sm, md, lg, xl, 2xl |  | typed input on an any-element directive (selector-named) | `yetiShow` on `[yetiShow]`: `YetiWidth` (required) | G | the consumer's binding only |
| 26 | `data-hide` (marker, on `*`) | container | 2xs, xs, sm, md, lg, xl, 2xl |  | typed input on an any-element directive (selector-named) | `yetiHide` on `[yetiHide]`: `YetiWidth` (required) | G | the consumer's binding only |
| 27 | `data-gap` | cover | 29 values (`gap`) | md | typed input | `gap` on `yetiCover`: `YetiGap` | R | the consumer's binding only |
| 28 | `data-height` | cover | sm, md, lg, xl, half, full | full | typed input | `height` on `yetiCover`: `YetiHeight` | R; HTML `height` (img, table, iframe, video, canvas): `inert` on Yeti's hosts | the consumer's binding only |
| 29 | `data-center` (marker, on `> *`) | cover | boolean |  | typed input on the item's child directive | `center` on `yetiCoverChild`: `boolean` (`booleanAttribute`) | C | the consumer's binding only |
| 30 | `data-ratio` | frame | 1/1, 4/3, 3/2, 16/9, 21/9 | 16/9 | typed input | `ratio` on `yetiFrame`: `YetiRatio` | R | the consumer's binding only |
| 31 | `data-min` | grid | none, 2xs, xs, sm, md, lg, xl, 2xl | xs | typed input | `min` on `yetiGrid`: `YetiWidthOrNone` | R; HTML `min` (form controls): `inert` on Yeti's hosts | the consumer's binding only |
| 32 | `data-columns` | grid | 1, 2, 3, 4, 5, 6 |  | typed input | `columns` on `yetiGrid`: `YetiColumns` | R | the consumer's binding only |
| 33 | `data-gap` | grid | 29 values (`gap`) | md | typed input | `gap` on `yetiGrid`: `YetiGap` | R | the consumer's binding only |
| 34 | `data-rows` | grid | 2, 3, 4, 5, 6 |  | typed input | `rows` on `yetiGrid`: `YetiRows` | R; HTML `rows` (form controls): `inert` on Yeti's hosts | the consumer's binding only |
| 35 | `data-fold` | grid | boolean |  | typed input | `fold` on `yetiGrid`: `boolean` (`booleanAttribute`) | R | the consumer's binding only |
| 36 | `data-tracks` | grid | 11 values (`tracks`) |  | typed input | `tracks` on `yetiGrid`: `YetiTracks` | R | the consumer's binding only |
| 37 | `data-threshold` | grid | 2xs, xs, sm, md, lg, xl, 2xl | md | typed input | `threshold` on `yetiGrid`: `YetiWidth` | R | the consumer's binding only |
| 38 | `data-start` (marker, on `> *`) | grid | 12 values (`start`) |  | typed input on the item's child directive | `start` on `yetiGridChild`: `YetiStart` | C; HTML `start` on `ol`: `removed` where the child may be an `ol` | the consumer's binding only |
| 39 | `data-span` (marker, on `> *`) | grid | 12 values (`span`) |  | typed input on the item's child directive | `span` on `yetiGridChild`: `YetiSpan` | C; HTML `span` (form controls, `col`): `inert` on Yeti's hosts | the consumer's binding only |
| 40 | `data-gap` | icon | 29 values (`gap`) | xs | typed input | `gap` on `yetiIcon`: `YetiGap` | R | the consumer's binding only |
| 41 | `data-align` | icon | start, center, end, stretch, baseline | center | typed input | `align` on `yetiIcon`: `YetiAlign` | R; HTML `align` (a hint on any element in Chromium and WebKit): `removed` | the consumer's binding only |
| 42 | `data-align` | layer | start, center, end, stretch, baseline | stretch | typed input | `align` on `yetiLayer`: `YetiAlign` | R; HTML `align` (a hint on any element in Chromium and WebKit): `removed` | the consumer's binding only |
| 43 | `data-align-self` (marker, on `> *`) | layer | start, center, end, stretch, baseline |  | typed input on the item's child directive | `alignSelf` on `yetiLayerChild`: `YetiAlign` | C | the consumer's binding only |
| 44 | `data-justify-self` (marker, on `> *`) | layer | start, center, end, stretch |  | typed input on the item's child directive | `justifySelf` on `yetiLayerChild`: `YetiSelf` | C | the consumer's binding only |
| 45 | `data-min` | masonry | none, 2xs, xs, sm, md, lg, xl, 2xl | xs | typed input | `min` on `yetiMasonry`: `YetiWidthOrNone` | R; HTML `min` (form controls): `inert` on Yeti's hosts | the consumer's binding only |
| 46 | `data-columns` | masonry | 1, 2, 3, 4, 5, 6 |  | typed input | `columns` on `yetiMasonry`: `YetiColumns` | R | the consumer's binding only |
| 47 | `data-gap` | masonry | 29 values (`gap`) | md | typed input | `gap` on `yetiMasonry`: `YetiGap` | R | the consumer's binding only |
| 48 | `data-gap` | overlay | 29 values (`gap`) | md | typed input | `gap` on `yetiOverlay`: `YetiGap` | R | the consumer's binding only |
| 49 | `data-fixed` | overlay | boolean |  | typed input | `fixed` on `yetiOverlay`: `boolean` (`booleanAttribute`) | R | the consumer's binding only |
| 50 | `data-over` (marker, on `> *`) | overlay | boolean |  | typed input on the item's child directive | `over` on `yetiOverlayChild`: `boolean` (`booleanAttribute`) | C | the consumer's binding only |
| 51 | `data-fill` (marker, on `> [data-over]`) | overlay | boolean |  | typed input on the item's child directive | `fill` on `yetiOverlayChild`: `boolean` (`booleanAttribute`) | C; SVG `fill`: `inert` unless the element is an `svg` | the consumer's binding only |
| 52 | `data-gap` | scroller | 29 values (`gap`) | md | typed input | `gap` on `yetiScroller`: `YetiGap` | R | the consumer's binding only |
| 53 | `data-width` | scroller | 2xs, xs, sm, md, lg, xl, 2xl |  | typed input | `width` on `yetiScroller`: `YetiWidth` | R; HTML `width` (img, table, iframe, video, canvas): `inert` on Yeti's hosts | the consumer's binding only |
| 54 | `data-snap` | scroller | boolean |  | typed input | `snap` on `yetiScroller`: `boolean` (`booleanAttribute`) | R | the consumer's binding only |
| 55 | `data-justify` | scroller | start, center, end |  | typed input | `justify` on `yetiScroller`: `Extract<YetiJustify, 'start' \| 'center' \| 'end'>` | R | the consumer's binding only |
| 56 | `data-side` | sidebar | start, end | start | typed input | `side` on `yetiSidebar`: `YetiSide` | R | the consumer's binding only |
| 57 | `data-width` | sidebar | 2xs, xs, sm, md, lg, xl, 2xl | sm | typed input | `width` on `yetiSidebar`: `YetiWidth` | R; HTML `width` (img, table, iframe, video, canvas): `inert` on Yeti's hosts | the consumer's binding only |
| 58 | `data-gap` | sidebar | 29 values (`gap`) | md | typed input | `gap` on `yetiSidebar`: `YetiGap` | R | the consumer's binding only |
| 59 | `data-align` | sidebar | start, center, end, stretch, baseline | stretch | typed input | `align` on `yetiSidebar`: `YetiAlign` | R; HTML `align` (a hint on any element in Chromium and WebKit): `removed` | the consumer's binding only |
| 60 | `data-sticky` (marker, on `> *`) | sidebar | boolean |  | typed input on the item's child directive | `sticky` on `yetiSidebarChild`: `boolean` (`booleanAttribute`) | C | the consumer's binding only |
| 61 | `data-gap` | stack | 29 values (`gap`) | md | typed input | `gap` on `yetiStack`: `YetiGap` | R | the consumer's binding only |
| 62 | `data-align` | stack | start, center, end, stretch, baseline | stretch | typed input | `align` on `yetiStack`: `YetiAlign` | R; HTML `align` (a hint on any element in Chromium and WebKit): `removed` | the consumer's binding only |
| 63 | `data-fill` | stack | boolean |  | typed input | `fill` on `yetiStack`: `boolean` (`booleanAttribute`) | R; SVG `fill`: `inert` unless the element is an `svg` | the consumer's binding only |
| 64 | `data-rule` | stack | boolean |  | typed input | `rule` on `yetiStack`: `boolean` (`booleanAttribute`) | R | the consumer's binding only |
| 65 | `data-split` (marker, on `> *`) | stack | boolean |  | typed input on the item's child directive | `split` on `yetiStackChild`: `boolean` (`booleanAttribute`) | C | the consumer's binding only |
| 66 | `data-space` (marker, on `> *`) | stack | 29 values (`gap`) |  | typed input on the item's child directive | `space` on `yetiStackChild`: `YetiGap` | C | the consumer's binding only |
| 67 | `data-sticky` (marker, on `> *`) | stack | boolean |  | typed input on the item's child directive | `sticky` on `yetiStackChild`: `boolean` (`booleanAttribute`) | C | the consumer's binding only |
| 68 | `data-gap` | timeline | 29 values (`gap`) | lg | typed input | `gap` on `yetiTimeline`: `YetiGap` | R | the consumer's binding only |
| 69 | `data-alternate` | timeline | boolean |  | typed input | `alternate` on `yetiTimeline`: `boolean` (`booleanAttribute`) | R | the consumer's binding only |
| 70 | `data-threshold` | hero | 2xs, xs, sm, md, lg, xl, 2xl | lg | typed input | `threshold` on `yetiHero`: `YetiWidth` | R | the consumer's binding only |
| 71 | `data-gap` | hero | 29 values (`gap`) | lg | typed input | `gap` on `yetiHero`: `YetiGap` | R | the consumer's binding only |
| 72 | `data-ratio` | hero | 1/1, 4/3, 3/2, 16/9, 21/9 | 4/3 | typed input | `ratio` on `yetiHero`: `YetiRatio` | R | the consumer's binding only |
| 73 | `data-align` | hero | start, center, end, stretch, baseline | center | typed input | `align` on `yetiHero`: `YetiAlign` | R; HTML `align` (a hint on any element in Chromium and WebKit): `removed` | the consumer's binding only |
| 74 | `data-side` | hero | start, end |  | typed input | `side` on `yetiHero`: `YetiSide` | R | the consumer's binding only |
| 75 | `data-height` | hero | sm, md, lg, xl, half, full | full | typed input | `height` on `yetiHero`: `YetiHeight` | R; HTML `height` (img, table, iframe, video, canvas): `inert` on Yeti's hosts | the consumer's binding only |
| 76 | `data-min` (marker, on `> *`) | hero | none, 2xs, xs, sm, md, lg, xl, 2xl |  | typed input on the item's child directive | `min` on `yetiHeroChild`: `YetiWidthOrNone` | C; HTML `min` (form controls): `inert` on Yeti's hosts | the consumer's binding only |
| 77 | `data-span` (marker, on `> *`) | hero | 12 values (`span`) |  | typed input on the item's child directive | `span` on `yetiHeroChild`: `YetiSpan` | C; HTML `span` (form controls, `col`): `inert` on Yeti's hosts | the consumer's binding only |
| 78 | `data-width` | media | 2xs, xs, sm, md, lg, xl, 2xl | xs | typed input | `width` on `yetiMedia`: `YetiWidth` | R; HTML `width` (img, table, iframe, video, canvas): `inert` on Yeti's hosts | the consumer's binding only |
| 79 | `data-ratio` | media | 1/1, 4/3, 3/2, 16/9, 21/9 | 1/1 | typed input | `ratio` on `yetiMedia`: `YetiRatio` | R | the consumer's binding only |
| 80 | `data-gap` | media | 29 values (`gap`) | md | typed input | `gap` on `yetiMedia`: `YetiGap` | R | the consumer's binding only |
| 81 | `data-align` | media | start, center, end, stretch, baseline | stretch | typed input | `align` on `yetiMedia`: `YetiAlign` | R; HTML `align` (a hint on any element in Chromium and WebKit): `removed` | the consumer's binding only |
| 82 | `data-max` | media | 2xs, xs, sm, md, lg, xl, 2xl |  | typed input | `max` on `yetiMedia`: `YetiWidth` | R; HTML `max` (form controls): `inert` on Yeti's hosts | the consumer's binding only |
| 83 | `data-side` | media | start, end |  | typed input | `side` on `yetiMedia`: `YetiSide` | R | the consumer's binding only |
| 84 | `data-gap` | shell | 29 values (`gap`) | md | typed input | `gap` on `yetiShell`: `YetiGap` | R | the consumer's binding only |
| 85 | `data-width` | shell | 2xs, xs, sm, md, lg, xl, 2xl | sm | typed input | `width` on `yetiShell`: `YetiWidth` | R; HTML `width` (img, table, iframe, video, canvas): `inert` on Yeti's hosts | the consumer's binding only |
| 86 | `data-sticky` (marker, on `> div > :is(nav, aside)`) | shell | boolean |  | typed input on the item's child directive | `sticky` on `yetiShellRegion`: `boolean` (`booleanAttribute`) | C | the consumer's binding only |
| 87 | `data-variant` | alert | 9 values (`variant`) | primary | typed input | `variant` on `yetiAlert`: `YetiVariant` | R | the consumer's binding only |
| 88 | `data-emphasis` | alert | high, medium, low | medium | typed input | `emphasis` on `yetiAlert`: `YetiEmphasis` | R | the consumer's binding only |
| 89 | `data-close` (marker, on `> button`) | alert | boolean |  | host attribute the part directive owns (static) | none; presence of `yetiAlertClose` | P; selected by `alert.js:7`; the part directive owns the close | never |
| 90 | `data-variant` | badge | 9 values (`variant`) | primary | typed input | `variant` on `yetiBadge`: `YetiVariant` | R | the consumer's binding only |
| 91 | `data-emphasis` | badge | high, medium, low | medium | typed input | `emphasis` on `yetiBadge`: `YetiEmphasis` | R | the consumer's binding only |
| 92 | `data-size` | badge | sm, md, lg | md | typed input | `size` on `yetiBadge`: `YetiSizeControl` | R; HTML `size` (form controls): `inert` on Yeti's hosts | the consumer's binding only |
| 93 | `data-size` | breadcrumbs | sm, md, lg | md | typed input | `size` on `yetiBreadcrumbs`: `YetiSizeControl` | R; HTML `size` (form controls): `inert` on Yeti's hosts | the consumer's binding only |
| 94 | `data-variant` | button | 9 values (`variant`) | primary | typed input | `variant` on `yetiButton`: `YetiVariant` | R | the consumer's binding only |
| 95 | `data-emphasis` | button | high, medium, low | high | typed input | `emphasis` on `yetiButton`: `YetiEmphasis` | R | the consumer's binding only |
| 96 | `data-size` | button | sm, md, lg | md | typed input | `size` on `yetiButton`: `YetiSizeControl` | R; HTML `size` (form controls): `inert` on Yeti's hosts | the consumer's binding only |
| 97 | `data-gap` | buttons | 29 values (`gap`) | sm | typed input | `gap` on `yetiButtons`: `YetiGap` | R | the consumer's binding only |
| 98 | `data-affix` | buttons | boolean |  | typed input | `affix` on `yetiButtons`: `boolean` (`booleanAttribute`) | R | the consumer's binding only |
| 99 | `data-variant` | card | 9 values (`variant`) |  | typed input | `variant` on `yetiCard`: `YetiVariant` | R | the consumer's binding only |
| 100 | `data-threshold` | card | 2xs, xs, sm, md, lg, xl, 2xl | md | typed input | `threshold` on `yetiCard`: `YetiWidth` | R | the consumer's binding only |
| 101 | `data-ratio` | card | 1/1, 4/3, 3/2, 16/9, 21/9 | 16/9 | typed input | `ratio` on `yetiCard`: `YetiRatio` | R | the consumer's binding only |
| 102 | `data-raised` | card | boolean |  | typed input | `raised` on `yetiCard`: `boolean` (`booleanAttribute`) | R | the consumer's binding only |
| 103 | `data-stretch` (marker, on `a`) | card | boolean |  | typed input on the item's child directive | `stretch` on `yetiCardLink`: `boolean` (`booleanAttribute`) | C | the consumer's binding only |
| 104 | `data-slides` | carousel | 1, 2, 3, 4 | 1 | typed input | `slides` on `yetiCarousel`: `YetiSlides` | R | the consumer's binding only |
| 105 | `data-gap` | carousel | 29 values (`gap`) | md | typed input | `gap` on `yetiCarousel`: `YetiGap` | R | the consumer's binding only |
| 106 | `data-track` (marker, on `> *`) | carousel | boolean |  | host attribute the part directive owns (static) | none; presence of `yetiCarouselTrack` | P; selected by `carousel.js:19` | never |
| 107 | `data-slide` (marker, on `> [data-track] > *`) | carousel | boolean |  | host attribute the part directive owns (static) | none; presence of `yetiCarouselSlide` | P; selected by `carousel.js:42`; no CSS reads it | never |
| 108 | `data-dots` (marker, on `> *`) | carousel | boolean |  | host attribute the part directive owns (static) | none; presence of `yetiCarouselDots` | P; selected by `carousel.js:12` | never |
| 109 | `data-height` | demo | sm, md, lg, xl, half, full | md | typed input | `height` on `<yeti-demo>`: `YetiHeight` | R; HTML `height` (img, table, iframe, video, canvas): `inert` on Yeti's hosts | the consumer's binding only |
| 110 | `data-width` | demo | 2xs, xs, sm, md, lg, xl, 2xl |  | typed input | `width` on `<yeti-demo>`: `YetiWidth` | R; HTML `width` (img, table, iframe, video, canvas): `inert` on Yeti's hosts | the consumer's binding only |
| 111 | `data-resize` | demo | width, both | width | typed input | `resize` on `<yeti-demo>`: `YetiResize` | R | the consumer's binding only |
| 112 | `data-stylesheet` | demo | string |  | typed input | `stylesheet` on `<yeti-demo>`: `string` | R; read by `demo.js:51`; no CSS reads it; the component reads its own input to build the frame | the consumer's binding only |
| 113 | `data-preview` (marker, on `> div`) | demo | string |  | component template binding from a typed input | `preview` on `<yeti-demo>`: `string` | P; `demo` is a component (ticket 11), whose template renders the preview box; read by `demo.js:56` | the consumer's binding only |
| 114 | `data-max` | dialog | 2xs, xs, sm, md, lg, xl, 2xl | md | typed input | `max` on `yetiDialog`: `YetiWidth` | R; HTML `max` (form controls): `inert` on Yeti's hosts | the consumer's binding only |
| 115 | `data-side` | dropdown | start, end | start | typed input | `side` on `yetiDropdown`: `YetiSide` | R | the consumer's binding only |
| 116 | `data-trigger` | dropdown | click, hover | click | typed input | `trigger` on `yetiDropdown`: `YetiTrigger` | R; read by `hover.js:44`; no CSS reads it; the dropdown directive reads its own input for hover opening | the consumer's binding only |
| 117 | `data-variant` | field | 9 values (`variant`) | primary | typed input | `variant` on `yetiField`: `YetiVariant` | R | the consumer's binding only |
| 118 | `data-size` | field | sm, md, lg | md | typed input | `size` on `yetiField`: `YetiSizeControl` | R; HTML `size` (form controls): `inert` on Yeti's hosts | the consumer's binding only |
| 119 | `data-inline` | field | boolean |  | typed input | `inline` on `yetiField`: `boolean` (`booleanAttribute`) | R | the consumer's binding only |
| 120 | `data-hint` (marker, on `> *`) | field | boolean |  | host attribute the part directive owns (static) | none; presence of `yetiFieldHint` | P | never |
| 121 | `data-error` (marker, on `> *`) | field | boolean |  | host attribute the part directive owns (static) | none; presence of `yetiFieldError` | P; selected by `validate.js:38` | never |
| 122 | `data-variant` | nav | 9 values (`variant`) | primary | typed input | `variant` on `yetiNav`: `YetiVariant` | R | the consumer's binding only |
| 123 | `data-threshold` | nav | 2xs, xs, sm, md, lg, xl, 2xl | md | typed input | `threshold` on `yetiNav`: `YetiWidth` | R | the consumer's binding only |
| 124 | `data-panel` | nav | sheet, drawer, screen | sheet | typed input | `panel` on `yetiNav`: `YetiPanel` | R | the consumer's binding only |
| 125 | `data-gap` | nav | 29 values (`gap`) | sm | typed input | `gap` on `yetiNav`: `YetiGap` | R | the consumer's binding only |
| 126 | `data-sticky` | nav | boolean |  | typed input | `sticky` on `yetiNav`: `boolean` (`booleanAttribute`) | R | the consumer's binding only |
| 127 | `data-brand` (marker, on `> *`) | nav | boolean |  | host attribute the part directive owns (static) | none; presence of `yetiNavBrand` | P | never |
| 128 | `data-close` (marker, on `li`) | nav | boolean |  | host attribute the part directive owns (static) | none; presence of `yetiNavClose` | P | never |
| 129 | `data-actions` (marker, on `> *`) | nav | boolean |  | host attribute the part directive owns (static) | none; presence of `yetiNavActions` | P | never |
| 130 | `data-variant` | pagination | 9 values (`variant`) | primary | typed input | `variant` on `yetiPagination`: `YetiVariant` | R | the consumer's binding only |
| 131 | `data-size` | pagination | sm, md, lg | md | typed input | `size` on `yetiPagination`: `YetiSizeControl` | R; HTML `size` (form controls): `inert` on Yeti's hosts | the consumer's binding only |
| 132 | `data-threshold` | pagination | 2xs, xs, sm, md, lg, xl, 2xl | sm | typed input | `threshold` on `yetiPagination`: `YetiWidth` | R | the consumer's binding only |
| 133 | `data-justify` | pagination | start, center, end, between, around, evenly | start | typed input | `justify` on `yetiPagination`: `YetiJustify` | R | the consumer's binding only |
| 134 | `data-variant` | progress | 9 values (`variant`) | primary | typed input | `variant` on `yetiProgress`: `YetiVariant` | R | the consumer's binding only |
| 135 | `data-size` | progress | sm, md, lg | md | typed input | `size` on `yetiProgress`: `YetiSizeControl` | R; HTML `size` (form controls): `inert` on Yeti's hosts | the consumer's binding only |
| 136 | `data-scroll` | progress | boolean |  | typed input | `scroll` on `yetiProgress`: `boolean` (`booleanAttribute`) | R | the consumer's binding only |
| 137 | `data-shape` | seam | slant, curve, wave | slant | typed input | `shape` on `yetiSeam`: `YetiShape` | R | the consumer's binding only |
| 138 | `data-size` | seam | sm, md, lg | md | typed input | `size` on `yetiSeam`: `YetiSizeControl` | R; HTML `size` (form controls): `inert` on Yeti's hosts | the consumer's binding only |
| 139 | `data-edge` | seam | top, bottom, both | bottom | typed input | `edge` on `yetiSeam`: `YetiEdge` | R | the consumer's binding only |
| 140 | `data-flip` | seam | boolean |  | typed input | `flip` on `yetiSeam`: `boolean` (`booleanAttribute`) | R | the consumer's binding only |
| 141 | `data-variant` | spinner | 9 values (`variant`) | primary | typed input | `variant` on `yetiSpinner`: `YetiVariant` | R | the consumer's binding only |
| 142 | `data-size` | spinner | sm, md, lg | md | typed input | `size` on `yetiSpinner`: `YetiSizeControl` | R; HTML `size` (form controls): `inert` on Yeti's hosts | the consumer's binding only |
| 143 | `data-size` | table | sm, md, lg | md | typed input | `size` on `yetiTable`: `YetiSizeControl` | R; HTML `size` (form controls): `inert` on Yeti's hosts | the consumer's binding only |
| 144 | `data-striped` | table | boolean |  | typed input | `striped` on `yetiTable`: `boolean` (`booleanAttribute`) | R | the consumer's binding only |
| 145 | `data-hover` | table | boolean |  | typed input | `hover` on `yetiTable`: `boolean` (`booleanAttribute`) | R | the consumer's binding only |
| 146 | `data-border` | table | boolean |  | typed input | `border` on `yetiTable`: `boolean` (`booleanAttribute`) | R; HTML `border` on `table`: `removed` | the consumer's binding only |
| 147 | `data-nowrap` | table | boolean |  | typed input | `nowrap` on `yetiTable`: `boolean` (`booleanAttribute`) | R; HTML `nowrap` (cells only): `inert` on `table` | the consumer's binding only |
| 148 | `data-fixed` | table | boolean |  | typed input | `fixed` on `yetiTable`: `boolean` (`booleanAttribute`) | R | the consumer's binding only |
| 149 | `data-numeric` (marker, on `*`) | table | boolean |  | typed input on an any-element directive (selector-named) | `yetiNumeric` on `[yetiNumeric]`: `boolean` (`booleanAttribute`) | G | the consumer's binding only |
| 150 | `data-nowrap` (marker, on `th, td`) | table | boolean |  | typed input on the item's child directive | `nowrap` on `yetiTableCell`: `boolean` (`booleanAttribute`) | C; HTML `nowrap` on `th`/`td`, same meaning: `output` | the consumer's binding only |
| 151 | `data-align` (marker, on `th, td, tr`) | table | start, center, end |  | typed input on the item's child directive | `align` on `yetiTableCell`: `Extract<YetiAlign, 'start' \| 'center' \| 'end'>` | C; HTML `align` on `th`/`td`/`tr`: `removed` | the consumer's binding only |
| 152 | `data-variant` | tabs | 9 values (`variant`) | primary | typed input | `variant` on `yetiTabs`: `YetiVariant` | R | the consumer's binding only |
| 153 | `data-orientation` | tabs | horizontal, vertical | horizontal | typed input | `orientation` on `yetiTabs`: `YetiOrientation` | R; read by `tabs.js:105`; the tabs directive reads its own input for arrow keys and `aria-orientation` | the consumer's binding only |
| 154 | `data-gap` | tabs | 29 values (`gap`) | md | typed input | `gap` on `yetiTabs`: `YetiGap` | R | the consumer's binding only |
| 155 | `data-emphasis` | tabs | high |  | typed input | `emphasis` on `yetiTabs`: `Extract<YetiEmphasis, 'high'>` | R | the consumer's binding only |
| 156 | `data-variant` | toc | 9 values (`variant`) | primary | typed input | `variant` on `yetiToc`: `YetiVariant` | R | the consumer's binding only |
| 157 | `data-size` | toc | sm, md, lg | md | typed input | `size` on `yetiToc`: `YetiSizeControl` | R; HTML `size` (form controls): `inert` on Yeti's hosts | the consumer's binding only |
| 158 | `data-numbered` | toc | boolean |  | typed input | `numbered` on `yetiToc`: `boolean` (`booleanAttribute`) | R | the consumer's binding only |
| 159 | `data-placement` | tooltip | top, bottom, start, end | top | typed input | `placement` on `yetiTooltip`: `YetiPlacement` | R | the consumer's binding only |
| 160 | `data-attention` | attention | pulse, shake | pulse | typed input (selector-named) | `yetiAttention` on `yetiAttention`: `YetiAttention \| ''` | U | the consumer's binding only |
| 161 | `data-fit` | billboard | 28 values (`fit`) | md-3xl | typed input | `fit` on `yetiBillboard`: `YetiFit` | R | the consumer's binding only |
| 162 | `data-enter` | enter | fade, rise, fall, slide, scale | fade | typed input (selector-named) | `yetiEnter` on `yetiEnter`: `YetiEnter \| ''` | U | the consumer's binding only |
| 163 | `data-side` | enter | start, end | start | typed input | `side` on `yetiEnter`: `YetiSide` | R | the consumer's binding only |
| 164 | `data-stagger` | enter | boolean |  | typed input | `stagger` on `yetiEnter`: `boolean` (`booleanAttribute`) | R | the consumer's binding only |
| 165 | `data-view` | enter | boolean |  | typed input | `view` on `yetiEnter`: `boolean` (`booleanAttribute`) | R | the consumer's binding only |
| 166 | `data-once` | enter | boolean |  | typed input + Angular-owned state | `once` on `yetiEnter`: `boolean` (`booleanAttribute`) | S; `enter.js:26` removes it at run time, and ticket 18 measured hydration restoring a static `data-once` | the enter directive, when the element first nears the viewport (an `IntersectionObserver` in `afterNextRender`, writing a signal); replaces `enter.js:23-31` (same `rootMargin`) |
| 167 | `data-lift` | lift | rise, scale | rise | typed input (selector-named) | `yetiLift` on `yetiLift`: `YetiLift \| ''` | U | the consumer's binding only |
| 168 | `data-print` | print | only, none | only | typed input (selector-named) | `yetiPrint` on `yetiPrint`: `YetiPrint \| ''` | U | the consumer's binding only |

### Angular-owned state

One attribute: `data-once` on the `enter` utility (row 166). It is the only `data-*` attribute any of Yeti's ten modules writes (`enter.js:26` removes it; `rg` over `dist/js/` finds no other `data-*` write, only `aria-*`, `tabindex`, `hidden`, and `role`, which ADR 0003 point 3 already gives to the owning directives). The enter directive binds `[attr.data-once]` to a `computed` of its `once` input and an `arrived` signal, and sets `arrived` from its own `IntersectionObserver` (`rootMargin: '0px 0px 10% 0px'`, as `enter.js:29`), started in `afterNextRender` and disconnected on destroy. So:

- the server HTML and a no-script page carry `data-once`, and `.enter[data-once]` sits still, which is Yeti's no-script state;
- hydration finds a binding, not a static attribute, so it restores nothing (ticket 18 measured hydration restoring a static `data-once`, which stopped the arrival);
- a client-rendered `@defer`, `@if`, or routed `enter` arrives, which `enter.js` never did (tickets 18 and 20);
- in a `hydrate never` block the directive never runs, so the element stays still and visible, as without `enter.js`;
- zoneless, the signal write refreshes the host binding (ticket 18 measured signals refreshing zoneless).

Yeti's `enter` declares no event (`js[0].events` is empty), so the directive adds no output for the arrival ([Research: binding Yeti's `yeti:*` events](16-research-yeti-events-in-angular-templates.md)). No other attribute is reported through an event either: none of the six `yeti:*` events carries a `data-*` change.

### Grilling record (both sides, AFK)

1. **Is the unit of a row the distinct attribute name (79) or the declaration (168)?** The declaration. The ticket asks for "its item" per row, and one name means different things on different items (`data-gap` is padding on a box and a gutter on a center). The distinct counts are given above as the cross-check.
2. **Does every attribute on an item's own element become a root input?** Yes, all 132, under ADR 0003 point 2. I looked for an attribute that should stay the consumer's and found none: every one has a closed value list or is a boolean, and none is native state.
3. **Should an input default to Yeti's default value?** No. Yeti's public defaults are not frozen (`src/guides/stability.md`; ticket 02), and two directives on one element that share an attribute (`center` with `box`, `media` with `enter`) get one static attribute, so they bind the same value only if neither invents a default. An unset input renders nothing.
4. **Then how does a behaviour that depends on the value work, such as the tabs' arrow keys or the dropdown's hover?** The directive computes the effective value from the manifest default at the pin (`orientation() ?? 'horizontal'`, `trigger() ?? 'click'`). A pin move that changes such a default is caught by the pin gate's manifest diff ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md)).
5. **Should attributes that only a module reads still be rendered (`data-slide`, `data-stylesheet`, `data-trigger`)?** Yes. They cost one binding each, keep the server HTML equal to Yeti's markup, keep the testing record's manifest check meaningful, and `data-trigger="hover"` is where `interestfor` will go (ADR 0040). Checked that these three are the only declared names no rule in `yeti.css` matches.
6. **Child markers: one directive per item and element role, or one directive per marker shared by all parents?** Per item and role. Yeti's CSS applies each one only under its parent (checked: `.columns > [data-span]`, `.cover > [data-center]`, `.breakout > [data-bleed]`, `.card [data-stretch]`), so a shared `[yetiSpan]` would compile on any element and do nothing outside three parents. A per-item child can inject its parent's token, carries only the inputs its parent reads (grid's child has `start`, columns' child does not), and follows Aria's and Material's per-pattern parts. The cost is two attributes on a child that carries a marker (`<div yetiStackChild split>`); a child with no marker needs no directive.
7. **Which child markers are parts and which are modifiers?** Yeti's own description decides. Where it names the element ("The close button", "The scrolling track", "One slide", "The list of links", "Help text", "The error message", "The site's name or mark", "The item holding the button", "Buttons at the end of the bar", "A margin note"), the marker is a part (P, 10 static plus `demo`'s preview). Where it says what to do to an element ("Stretches", "Pins", "Centers", "Breaks the child out", "Lifts", "How many shares"), it is a modifier (C, 19). `data-note` and `data-bleed` on the breakout fall on opposite sides; the note is content of its own kind and the bleed is a placement, so the split holds.
8. **Why does a part marker take no input?** It is always present on its part and never changes, and its part directive owns more than the marker (the alert's close, the slide's id for the dots, the hint's id for `aria-describedby`). `[yetiCarouselTrack]` already says "this is the track"; `track` as an input would repeat it.
9. **How is `demo`'s string marker `data-preview` set?** `demo` is the one component (ticket 11), and its template renders the preview box, so the box's `data-preview` is a template binding from the component's `preview` input. Its `data-stylesheet` is a root input that the component also reads to build the frame.
10. **Where do the six any-element markers live, and what is their input called?** Each is its own directive that binds no class, because the marker is not an item. The input has the selector's name (`yetiPaint`), so one attribute does the job and the input never shares a name with another directive's input on the same element. No item directive also declares the input (the table's own `data-border` attribute is the table's root input; the box's `data-border` marker is `yetiBorder`). The naming is the one open point (Triage).
11. **What about the four utilities whose attribute is named as the item?** Same reasoning as 10: `<p yetiEnter="rise">`, with `''` in the type so the bare selector compiles and renders nothing, leaving Yeti's default (checked in `enter.css`, `print.css`, `attention.css`, `lift.css`: an absent attribute gets the default gesture or medium). The same open point.
12. **Which attributes can change before hydration or at run time?** Only `data-once`, by `enter.js`, and the package replaces `enter.js` (ADR 0040). No person can change a `data-*` attribute through the platform. So S is one row, and every other row changes only through the consumer's binding.
13. **Does any row need the consumer to write the attribute?** No. Two cases stay with the consumer because no directive reaches them: markup outside an Angular template (`index.html`, `[innerHTML]`), written as Yeti documents it; and a value newer than the pin, bound as `[variant]="$any('new')"`. A static `data-variant` does not work there, because the directive's unset binding removes it (`setElementAttribute`, `packages/core/src/render3/instructions/shared.ts:530-535`, read). This corrects a consequence of ADR 0005 (see Findings).
14. **Does a static attribute such as `columns="3"` type-check against `YetiColumns`?** Yes, under `strictTemplates`: the type-check block emits a static attribute as a quoted string literal (`translateInput`, `packages/compiler/src/typecheck/ops/inputs.ts:34-37`) and checks it unless `strictAttributeTypes` is off (`:199`). Read, not run.
15. **Which input names are also HTML attributes?** `align` (a hint on any element in Chromium and WebKit, per ticket 139's M1: `removed`), `border` on a table (`removed`), `nowrap` on a cell (the same meaning: `output`), `start` where a grid child is an `ol` (`removed`), and `width`, `height`, `size`, `span`, `rows`, `max`, `min`, and `fill` (`inert` on the hosts Yeti allows). The table marks each row; each spec states the kind on its own hosts, as ticket 07 carried over.
16. **Two directives on one element declaring the same attribute: conflict?** Not under rule 1: one static attribute feeds both inputs and both bind the same value, which is what Yeti's single attribute means. The one mixed case is `yetiBorder` beside the table's `border` input on a `<table>`; the table spec says to use the table's input.

### Terms for the glossary ([ticket 10](10-decide-glossary.md); not written to `CONTEXT.md` from here)

- **part marker**: a marker that names the element it sits on (the carousel's track, the field's hint); the part directive is the marker.
- **child marker** (or modifier): a marker that changes a child of the item (a stack child's split); an input on the item's child directive.
- **any-element marker**: a marker with `on: "*"` (`data-paint`, `data-show`); its own directive, binding no class.
- **child directive**: the directive for an item's child element role that carries child markers; not a "part" unless the glossary decides so.

### Findings for the orchestrator (no file here edits them)

- **ADR 0005, Consequences, second bullet** says a consumer can write a newer value as a static attribute and it "still works because the directive binds its inputs and leaves unknown attributes alone". That holds for an attribute no directive on the element declares. For an attribute the directive owns, its unset host binding removes the static attribute on the first change detection (read in `shared.ts:530-535`, not run). The escape hatch is `[variant]="$any('new')"`. ADR 0070's Consequences record this; ADR 0005 is not edited here.
- **Type resolution.** The package's declarations import `Yeti*` types from `yeti-css`. If a consumer's compiler cannot resolve `yeti-css`, the unions become `any` under `skipLibCheck` and every typo compiles. ADR 0006 and [Decide: how component styles load and unload](13-decide-style-loading.md) (the vendoring ruling, "let the consumer" provide Yeti's CSS) must keep `dist/yeti.d.ts` reachable, as a dependency or as a vendored copy the package re-exports.

### Checked and inferred

- **Checked:**
  - the counts: 49 items, 132 attribute and 36 marker declarations, 54 and 31 distinct names, 79 in all, 32 vocabularies in `schema/vocabulary.json` and in `dist/yeti.d.ts`, 28 used by attributes (script over the built manifest);
  - every row's values, default, `on`, and type name (generated from the manifest; the script fails on a vocabulary with no `Yeti*` type, and none failed);
  - that `enter.js:26` is the only `data-*` write in `dist/js/` (`rg`);
  - which module reads which attribute (`rg`, line numbers cited);
  - that 76 of the 79 names appear in `yeti.css` and that `data-slide`, `data-stylesheet`, and `data-trigger` do not;
  - that child markers are scoped to their parent in `yeti.css` (four selectors read);
  - that an absent `data-enter`, `data-print`, `data-attention`, or `data-lift` gets Yeti's default (the four CSS files read);
  - `yeti-css`'s `exports` map (`.` has `types: ./dist/yeti.d.ts`).
- **Read in source, not run:**
  - Angular removes an attribute bound to `null` (`shared.ts:530-535`);
  - a static attribute type-checks as a string literal (`inputs.ts:34-37`, `:199`).
- **Inferred:**
  - the zoneless and hydration behaviour of each binding, from ticket 18's measurements of signals and static attributes, not run per row;
  - the presentational-attribute kinds, from ticket 139's measurements on Foundation's hosts, not re-measured on Yeti's;
  - that the noun-or-verb test gives the right P and C split for markers Yeti adds later.

### Triage

| Point | Impact | Confidence | Evidence | Outcome |
| --- | --- | --- | --- | --- |
| Placement decides the mapping (R, C, P, G, U, S), 168 rows | HIGH | HIGH | ADR 0003 point 2; the manifest's `on` field; Yeti's CSS scoping (checked); ticket 11's "a host directive per element role" | decided, [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) |
| An unset input renders no attribute; the package never writes Yeti's default | MEDIUM | HIGH | Yeti's defaults are not frozen (`stability.md`); shared attributes on one element (Q3) | decided |
| Child markers go on a per-item child directive, not on shared marker directives | HIGH | HIGH | CSS scoping (checked); ADR 0013 point 1; Aria and Material per-pattern parts; per-item input sets | decided |
| The noun-or-verb test for part markers (P) against child markers (C) | MEDIUM | MEDIUM | Yeti's frozen marker names with their descriptions; a marker can move between P and C before the first release without renaming the attribute | decided |
| Selector-named inputs for the 6 any-element markers and the 4 item-named utility attributes (`yetiPaint="primary"`, `yetiEnter="rise"`, `''` for the default) against the map's Input naming record (`data-paint` to `paint`) | HIGH | MEDIUM | For: one attribute instead of two; no name shared with another directive's input on the element; the prefix ruling puts `yeti` on selectors; old ADR 0044 chose the same for utilities; `routerLink` and `matTooltip` use the form. Against: the letter of the map's Input naming record, which ticket 07 adapted from the old map's standing preferences. Ten public input names, fixed at the first release. | decided by the user, 2026-10-02: "Selector name (Recommended)" (map, Standing rulings) |
| `data-once` is Angular-owned state | MEDIUM | HIGH | `enter.js:26` (checked); ticket 18 measured the hydration restore; ticket 11 row 45 | decided |
| Module-only attributes are still rendered | LOW | HIGH | Q5 | decided |
| Types come from `yeti-css`'s `yeti.d.ts`, with `Extract` for own value lists | MEDIUM | HIGH | the approved recommendation in the map's Prefix bullet (map, Standing rulings, "Prefix"); `exports` map (checked) | decided; resolvability handed to ADR 0006 and ticket 13 (Findings) |
| ADR 0005's static-attribute consequence does not hold for an owned attribute; `$any` binding instead | MEDIUM | MEDIUM | `shared.ts:530-535`, read, not run | recorded in ADR 0070; ADR 0005 left to the orchestrator |
| Presentational-attribute kinds per row | LOW | MEDIUM | ticket 139's measurements on other hosts | recommended per row; each spec confirms |

### Later notes

- 2026-10-02: [Decide: the building-blocks map for every ngx-yeti item](../issues/25-decide-building-blocks-map.md) moves row 153's `orientation` input from `yetiTabs` to `yetiTabList`, because Aria's tabs read it there and a wrapping directive cannot set an input of a directive it hosts. The root still renders `data-orientation` for Yeti's CSS.
- 2026-10-03 ([ticket 50](50-decide-open-points-of-the-specs.md), decision 195; the orchestrator's, full AFK mode): the table's pinned head, `data-sticky` on `> thead`, has no row here because the table manifest declares no marker for it (upstream-bugs Y13). The [table](../specs/table.md) spec maps it as a kind C input: `sticky: boolean` with `booleanAttribute` on the part directive `thead[yetiTableHead]` (`YetiTableHead`), the same name and type as rows 60, 67, 86, and 126. Row 150's `nowrap` on a cell is `removed`, not `output`, because HTML's `nowrap` is obsolete (decision 196).
- 2026-10-03 ([ticket 50](50-decide-open-points-of-the-specs.md), decisions 136 and 223; the orchestrator's): rows 109 to 113 write the demo's host as `<yeti-demo>`. The host is `figure[yetiDemo]`, an attribute-selector component (`YetiDemo`); each row's input lives on that host, with its kind unchanged.
