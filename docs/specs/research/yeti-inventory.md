# Yeti inventory: components, layouts, recipes, utilities, and contract

Ticket: `.scratch/ngx-yeti-specs/issues/02-research-yeti-inventory.md`. Resolved 2026-10-01.

Source: `github.com/foundation/yeti` at `develop`, commit `f52d1e8b9` (checked with `git log`). The repository was copied to `D:/tmp/ngx-yeti-02/yeti`; `npm install` and `npm run build` ran in the copy (`build: wrote dist/ (29 entries)`). The clone was not touched. Paths below are relative to the repository root; `dist/...` paths are in the built copy and are not in the clone.

## 1. Count check

| Measure | Value | Source |
| --- | --- | --- |
| Entries in the built manifest's `components` object | 49 | `dist/yeti.manifest.json`, `components` key (counted with `Object.keys`) |
| By `kind` | 17 layouts, 3 recipes, 22 components, 7 utilities | same, grouped by each entry's `kind` |
| Rows in section 2 | 49 (17 + 3 + 22 + 7) | this file |
| Stability guide | "The forty-nine names in the manifest" | `src/guides/stability.md:15` |
| README | "seventeen layout primitives, three recipes, twenty-two components, and seven utilities" | `README.md:36` |
| Validator output quoted in a guide | `validate: ok (49 components)` | `src/guides/base.md:184` |
| Source manifests on disk | 49 `manifest.json` files under `src/layouts`, `src/recipes`, `src/components`, `src/utilities` | listing of those folders |
| Source manifest vs built manifest | equal for all 49 after three build-time normalisations: the build copies a vocabulary's `values` into each attribute that names one, inlines `example.html` as the `example` string, and adds empty `markers`/`classes`/`children` arrays | compared in a script; 0 differences |

The counts match. The manifest's word "components" is its container name for all four kinds; only 22 of the 49 have `kind: component`. Every entry has `since: "7.0.0"` (checked across all 49).

Two things in the repository disagree about the version, noted and not resolved here: `README.md:9` says "Yeti is at `7.0.0-beta`", while `package.json:3` and the built manifest's `version` say `7.0.0-alpha.0`. `src/guides/stability.md:11` ties the freeze to "From `7.0.0-beta.0`". So at this commit the build still reports an alpha version while the README and the guide describe the freeze as in force.

Licence in `package.json:5` is `FSL-1.1-MIT` (recorded only).

## 2. The 49 rows

Columns: `Attributes` lists each attribute with its vocabulary in brackets and its value count (or its type when it takes no value list); `Markers` are attributes placed on a child or any element, with what they sit on; `Public tokens listed` is the number of public tokens in the item's own manifest `tokens` array, with how many of those start with `--yeti-<name>-` in parentheses (the rest are shared tokens the item reads, such as `--yeti-space-md`); `Expected elements` gives the root tag of the item's `example.html` and the manifest's `children` selectors, with `(opt)` where `min` is 0; `Manifest line` is the line of `"name"` in the source manifest, and of `"js"` where there is one. No manifest has a non-empty `classes` array: each item has exactly one class, equal to its name (`dist/yeti.manifest.json`, `class` field, listed for all 49). Docs pages are generated into `docs/<name>.md` (`bin/gen-docs.js`, header comment of each page).

### layouts (17)

| Name | Docs page | Class | Attributes [vocabulary] (value count) | Markers (on, value count) | Public tokens listed (own-prefixed) | Expected elements | JS module; events | Manifest line | Frozen at 7.0.0-beta (stability.md) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| box | docs/box.md | `box` | `data-gap` [gap] (29); `data-gap-inline` [gap] (29); `data-gap-block` [gap] (29); `data-surface` [surface] (3) | `data-border` (*); `data-paint` (*, 20); `data-text` (*, 20) | 4 (0) | example root `<section>`; no children declared | none | src/layouts/box/manifest.json:3 | yes: names, values, markers, tokens |
| breakout | docs/breakout.md | `breakout` | `data-max` [width] (7); `data-gap` [gap] (29) | `data-bleed` (> *); `data-note` (> *) | 6 (0) | example root `<article>`; `> *` `> [data-bleed]` (opt) `> [data-note]` (opt) | none | src/layouts/breakout/manifest.json:3 | yes: names, values, markers, tokens |
| center | docs/center.md | `center` | `data-max` [width] (7); `data-gap` [gap] (29); `data-intrinsic` (boolean) | none | 2 (0) | example root `<main>`; no children declared | none | src/layouts/center/manifest.json:3 | yes: names, values, markers, tokens |
| cluster | docs/cluster.md | `cluster` | `data-gap` [gap] (29); `data-align` [align] (5); `data-justify` [justify] (6); `data-threshold` [width] (7) | none | 1 (0) | example root `<nav>`; `> *` | none | src/layouts/cluster/manifest.json:3 | yes: names, values, markers, tokens |
| columns | docs/columns.md | `columns` | `data-threshold` [width] (7); `data-gap` [gap] (29); `data-align` [align] (5); `data-justify` [justify] (6); `data-columns` [columns] (6) | `data-span` (> *, 12) | 2 (0) | example root `<div>`; `> *` `> [data-span]` (opt) | none | src/layouts/columns/manifest.json:3 | yes: names, values, markers, tokens |
| container | docs/container.md | `container` | none | `data-show` (*, 7); `data-hide` (*, 7) | 0 (0) | example root `<div>`; `> *` | none | src/layouts/container/manifest.json:3 | yes: names, values, markers, tokens |
| cover | docs/cover.md | `cover` | `data-gap` [gap] (29); `data-height` [height] (6) | `data-center` (> *) | 2 (1) | example root `<header>`; `> *` `> [data-center]` | none | src/layouts/cover/manifest.json:3 | yes: names, values, markers, tokens |
| frame | docs/frame.md | `frame` | `data-ratio` [ratio] (5) | none | 0 (0) | example root `<div>`; `> *` | none | src/layouts/frame/manifest.json:3 | yes: names, values, markers, tokens |
| grid | docs/grid.md | `grid` | `data-min` [width-or-none] (8); `data-columns` [columns] (6); `data-gap` [gap] (29); `data-rows` [rows] (5); `data-fold` (boolean); `data-tracks` [tracks] (11); `data-threshold` [width] (7) | `data-start` (> *, 12); `data-span` (> *, 12) | 2 (0) | example root `<ul>`; `> *` | none | src/layouts/grid/manifest.json:3 | yes: names, values, markers, tokens |
| icon | docs/icon.md | `icon` | `data-gap` [gap] (29); `data-align` [align] (5) | none | 1 (0) | example root `<p>`; `> svg` | none | src/layouts/icon/manifest.json:3 | yes: names, values, markers, tokens |
| layer | docs/layer.md | `layer` | `data-align` [align] (5) | `data-align-self` (> *, 5); `data-justify-self` (> *, 4) | 4 (0) | example root `<figure>`; `> *` `> [data-align-self]` (opt) `> [data-justify-self]` (opt) | none | src/layouts/layer/manifest.json:3 | yes: names, values, markers, tokens |
| masonry | docs/masonry.md | `masonry` | `data-min` [width-or-none] (8); `data-columns` [columns] (6); `data-gap` [gap] (29) | none | 2 (0) | example root `<div>`; `> *` | none | src/layouts/masonry/manifest.json:3 | yes: names, values, markers, tokens |
| overlay | docs/overlay.md | `overlay` | `data-gap` [gap] (29); `data-fixed` (boolean) | `data-over` (> *); `data-fill` (> [data-over]) | 1 (0) | example root `<div>`; `> *` `> [data-over]` | none | src/layouts/overlay/manifest.json:3 | yes: names, values, markers, tokens |
| scroller | docs/scroller.md | `scroller` | `data-gap` [gap] (29); `data-width` [width] (7); `data-snap` (boolean); `data-justify` (3) | none | 1 (0) | example root `<div>`; `> *` | none | src/layouts/scroller/manifest.json:3 | yes: names, values, markers, tokens |
| sidebar | docs/sidebar.md | `sidebar` | `data-side` [side] (2); `data-width` [width] (7); `data-gap` [gap] (29); `data-align` [align] (5) | `data-sticky` (> *) | 2 (0) | example root `<div>`; `> *` | none | src/layouts/sidebar/manifest.json:3 | yes: names, values, markers, tokens |
| stack | docs/stack.md | `stack` | `data-gap` [gap] (29); `data-align` [align] (5); `data-fill` (boolean); `data-rule` (boolean) | `data-split` (> *); `data-space` (> *, 29); `data-sticky` (> *) | 4 (0) | example root `<div>`; `> *` `> [data-split]` (opt) | none | src/layouts/stack/manifest.json:3 | yes: names, values, markers, tokens |
| timeline | docs/timeline.md | `timeline` | `data-gap` [gap] (29); `data-alternate` (boolean) | none | 2 (0) | example root `<ol>`; `> li` | none | src/layouts/timeline/manifest.json:3 | yes: names, values, markers, tokens |

### recipes (3)

| Name | Docs page | Class | Attributes [vocabulary] (value count) | Markers (on, value count) | Public tokens listed (own-prefixed) | Expected elements | JS module; events | Manifest line | Frozen at 7.0.0-beta (stability.md) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hero | docs/hero.md | `hero` | `data-threshold` [width] (7); `data-gap` [gap] (29); `data-ratio` [ratio] (5); `data-align` [align] (5); `data-side` [side] (2); `data-height` [height] (6) | `data-min` (> *, 8); `data-span` (> *, 12) | 6 (0) | example root `<header>`; `> *` `> [data-span]` (opt) | none | src/recipes/hero/manifest.json:3 | yes: names, values, markers, tokens |
| media | docs/media.md | `media` | `data-width` [width] (7); `data-ratio` [ratio] (5); `data-gap` [gap] (29); `data-align` [align] (5); `data-max` [width] (7); `data-side` [side] (2) | none | 5 (0) | example root `<div>`; `> *` | none | src/recipes/media/manifest.json:3 | yes: names, values, markers, tokens |
| shell | docs/shell.md | `shell` | `data-gap` [gap] (29); `data-width` [width] (7) | `data-sticky` (> div > :is(nav, aside)) | 3 (0) | example root `<body>`; `> *` `> header` (opt) `> footer` (opt) `> main` (opt) `> div` (opt) | none | src/recipes/shell/manifest.json:3 | yes: names, values, markers, tokens |

### components (22)

| Name | Docs page | Class | Attributes [vocabulary] (value count) | Markers (on, value count) | Public tokens listed (own-prefixed) | Expected elements | JS module; events | Manifest line | Frozen at 7.0.0-beta (stability.md) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| accordion | docs/accordion.md | `accordion` | none | none | 7 (5) | example root `<div>`; `> details` `summary` | none | src/components/accordion/manifest.json:3 | yes: names, values, markers, tokens |
| affix | docs/affix.md | `affix` | none | none | 7 (0) | example root `<div>`; `> *` `> input` (opt) `> select` (opt) `> span` (opt) `> .button` (opt) | none | src/components/affix/manifest.json:3 | yes: names, values, markers, tokens |
| alert | docs/alert.md | `alert` | `data-variant` [variant] (9); `data-emphasis` [emphasis] (3) | `data-close` (> button) | 14 (3) | example root `<div>`; `> svg` (opt) `> [data-close]` (opt) `> *` | alert.js; yeti:close | src/components/alert/manifest.json:3, js :44 | yes: names, values, markers, tokens, module file, events |
| badge | docs/badge.md | `badge` | `data-variant` [variant] (9); `data-emphasis` [emphasis] (3); `data-size` [size-control] (3) | none | 14 (2) | example root `<p>`; `> svg` (opt) | none | src/components/badge/manifest.json:3 | yes: names, values, markers, tokens |
| breadcrumbs | docs/breadcrumbs.md | `breadcrumbs` | `data-size` [size-control] (3) | none | 7 (1) | example root `<nav>`; `> ol` `li` | none | src/components/breadcrumbs/manifest.json:3 | yes: names, values, markers, tokens |
| button | docs/button.md | `button` | `data-variant` [variant] (9); `data-emphasis` [emphasis] (3); `data-size` [size-control] (3) | none | 20 (4) | example root `<div>`; `> svg` (opt) `> input` (opt) | none | src/components/button/manifest.json:3 | yes: names, values, markers, tokens |
| buttons | docs/buttons.md | `buttons` | `data-gap` [gap] (29); `data-affix` (boolean) | none | 2 (0) | example root `<div>`; `> .button` | none | src/components/buttons/manifest.json:3 | yes: names, values, markers, tokens |
| card | docs/card.md | `card` | `data-variant` [variant] (9); `data-threshold` [width] (7); `data-ratio` [ratio] (5); `data-raised` (boolean) | `data-stretch` (a) | 13 (5) | example root `<article>`; `> *` `> figure` (opt) `> footer` (opt) `[data-stretch]` (opt) | none | src/components/card/manifest.json:3 | yes: names, values, markers, tokens |
| carousel | docs/carousel.md | `carousel` | `data-slides` [slides] (4); `data-gap` [gap] (29) | `data-track` (> *); `data-slide` (> [data-track] > *); `data-dots` (> *) | 8 (3) | example root `<section>`; `> [data-track]` `[data-slide]` `> [data-dots]` (opt) | carousel.js; yeti:slide { index, slide } | src/components/carousel/manifest.json:3, js :44 | yes: names, values, markers, tokens, module file, events |
| demo | docs/demo.md | `demo` | `data-height` [height] (6); `data-width` [width] (7); `data-resize` [resize] (2); `data-stylesheet` (string) | `data-preview` (> div) | 22 (3) | example root `<figure>`; `> figcaption` (opt) `> [data-preview]` `> [data-preview] > iframe` (opt) `> details` (opt) | demo.js; no events | src/components/demo/manifest.json:3, js :64 | yes: names, values, markers, tokens, module file, events |
| dialog | docs/dialog.md | `dialog` | `data-max` [width] (7) | none | 11 (4) | example root `<button>`; `> *` `> footer` (opt) | dialog.js; yeti:open, yeti:close | src/components/dialog/manifest.json:3, js :107 | yes: names, values, markers, tokens, module file, events |
| dropdown | docs/dropdown.md | `dropdown` | `data-side` [side] (2); `data-trigger` [trigger] (2) | none | 14 (6) | example root `<div>`; `> button[popovertarget]` `> [popover]` | hover.js; no events | src/components/dropdown/manifest.json:3, js :129 | yes: names, values, markers, tokens, module file, events |
| field | docs/field.md | `field` | `data-variant` [variant] (9); `data-size` [size-control] (3); `data-inline` (boolean) | `data-hint` (> *); `data-error` (> *) | 30 (1) | example root `<div>`; `> label` (opt) `> legend` (opt) `> input` (opt) `> select` (opt) `> textarea` (opt) `> .affix` (opt) `> output` (opt) `> [data-hint]` (opt) `> [data-error]` (opt) | range.js, validate.js; yeti:invalid { controls } | src/components/field/manifest.json:3, js :297 | yes: names, values, markers, tokens, module file, events |
| nav | docs/nav.md | `nav` | `data-variant` [variant] (9); `data-threshold` [width] (7); `data-panel` [panel] (3); `data-gap` [gap] (29); `data-sticky` (boolean) | `data-brand` (> *); `data-close` (li); `data-actions` (> *) | 27 (8) | example root `<nav>`; `> [data-brand]` (opt) `> button[popovertarget]` `> ul[popover]` `li` `[data-close]` (opt) `.dropdown` (opt) `> [data-actions]` (opt) | none | src/components/nav/manifest.json:3 | yes: names, values, markers, tokens |
| pagination | docs/pagination.md | `pagination` | `data-variant` [variant] (9); `data-size` [size-control] (3); `data-threshold` [width] (7); `data-justify` [justify] (6) | none | 12 (1) | example root `<nav>`; `> ol` `li` | none | src/components/pagination/manifest.json:3 | yes: names, values, markers, tokens |
| progress | docs/progress.md | `progress` | `data-variant` [variant] (9); `data-size` [size-control] (3); `data-scroll` (boolean) | none | 14 (2) | example root `<div>`; no children declared | none | src/components/progress/manifest.json:3 | yes: names, values, markers, tokens |
| seam | docs/seam.md | `seam` | `data-shape` [shape] (3); `data-size` [size-control] (3); `data-edge` [edge] (3); `data-flip` (boolean) | none | 2 (1) | example root `<section>`; no children declared | none | src/components/seam/manifest.json:3 | yes: names, values, markers, tokens |
| spinner | docs/spinner.md | `spinner` | `data-variant` [variant] (9); `data-size` [size-control] (3) | none | 11 (2) | example root `<p>`; no children declared | none | src/components/spinner/manifest.json:3 | yes: names, values, markers, tokens |
| table | docs/table.md | `table` | `data-size` [size-control] (3); `data-striped` (boolean); `data-hover` (boolean); `data-border` (boolean); `data-nowrap` (boolean); `data-fixed` (boolean) | `data-numeric` (*); `data-nowrap` (th, td); `data-align` (th, td, tr, 3) | 9 (2) | example root `<table>`; `> caption` (opt) `> thead` (opt) `> tbody` `[data-numeric]` (opt) | none | src/components/table/manifest.json:3 | yes: names, values, markers, tokens |
| tabs | docs/tabs.md | `tabs` | `data-variant` [variant] (9); `data-orientation` [orientation] (2); `data-gap` [gap] (29); `data-emphasis` (1) | none | 15 (2) | example root `<div>`; `> [role="tablist"]` `[role="tab"]` `> [role="tabpanel"]` | tabs.js; yeti:select { tab, panel } | src/components/tabs/manifest.json:3, js :54 | yes: names, values, markers, tokens, module file, events |
| toc | docs/toc.md | `toc` | `data-variant` [variant] (9); `data-size` [size-control] (3); `data-numbered` (boolean) | none | 15 (3) | example root `<nav>`; `> ul` `li` | toc.js; yeti:current { link, heading } | src/components/toc/manifest.json:3, js :148 | yes: names, values, markers, tokens, module file, events |
| tooltip | docs/tooltip.md | `tooltip` | `data-placement` [placement] (4) | none | 8 (3) | example root `<span>`; `> *` `> [role="tooltip"]` | none | src/components/tooltip/manifest.json:3 | yes: names, values, markers, tokens |

### utilities (7)

| Name | Docs page | Class | Attributes [vocabulary] (value count) | Markers (on, value count) | Public tokens listed (own-prefixed) | Expected elements | JS module; events | Manifest line | Frozen at 7.0.0-beta (stability.md) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| attention | docs/attention.md | `attention` | `data-attention` [attention] (2) | none | 4 (3) | example root `<div>`; no children declared | none | src/utilities/attention/manifest.json:3 | yes: names, values, markers, tokens |
| billboard | docs/billboard.md | `billboard` | `data-fit` [fit] (28) | none | 10 (0) | example root `<div>`; no children declared | none | src/utilities/billboard/manifest.json:3 | yes: names, values, markers, tokens |
| enter | docs/enter.md | `enter` | `data-enter` [enter] (5); `data-side` [side] (2); `data-stagger` (boolean); `data-view` (boolean); `data-once` (boolean) | none | 6 (6) | example root `<ul>`; no children declared | enter.js; no events | src/utilities/enter/manifest.json:3, js :78 | yes: names, values, markers, tokens, module file, events |
| lede | docs/lede.md | `lede` | none | none | 3 (2) | example root `<article>`; no children declared | none | src/utilities/lede/manifest.json:3 | yes: names, values, markers, tokens |
| lift | docs/lift.md | `lift` | `data-lift` [lift] (2) | none | 5 (5) | example root `<div>`; no children declared | none | src/utilities/lift/manifest.json:3 | yes: names, values, markers, tokens |
| print | docs/print.md | `print` | `data-print` [print] (2) | none | 0 (0) | example root `<div>`; no children declared | none | src/utilities/print/manifest.json:3 | yes: names, values, markers, tokens |
| visually-hidden | docs/visually-hidden.md | `visually-hidden` | none | none | 0 (0) | example root `<ul>`; no children declared | none | src/utilities/visually-hidden/manifest.json:3 | yes: names, values, markers, tokens |


## 3. Vocabularies

32 named value lists in `schema/vocabulary.json` (48 lines, one key per list besides `$comment`). Attributes and markers name one with `"vocabulary"`. A vocabulary's values are frozen except that values may be added (`src/guides/stability.md:17`). Some attributes carry their own `values` with no vocabulary (for example `data-emphasis` on `tabs`, one value `high`), so value lists are not all in this table.

| Vocabulary | Values | Line | List |
| --- | --- | --- | --- |
| `gap` | 29 | schema/vocabulary.json:3 | none xs sm md lg xl 2xl 3xl xs-sm xs-md xs-lg xs-xl xs-2xl xs-3xl sm-md sm-lg sm-xl sm-2xl sm-3xl md-lg md-xl md-2xl md-3xl lg-xl lg-2xl lg-3xl xl-2xl xl-3xl 2xl-3xl |
| `align` | 5 | schema/vocabulary.json:4 | start center end stretch baseline |
| `justify` | 6 | schema/vocabulary.json:5 | start center end between around evenly |
| `width` | 7 | schema/vocabulary.json:6 | 2xs xs sm md lg xl 2xl |
| `width-or-none` | 8 | schema/vocabulary.json:7 | none 2xs xs sm md lg xl 2xl |
| `ratio` | 5 | schema/vocabulary.json:8 | 1/1 4/3 3/2 16/9 21/9 |
| `columns` | 6 | schema/vocabulary.json:9 | 1 2 3 4 5 6 |
| `side` | 2 | schema/vocabulary.json:10 | start end |
| `self` | 4 | schema/vocabulary.json:11 | start center end stretch |
| `variant` | 9 | schema/vocabulary.json:12 | primary secondary success warning alert danger neutral black white |
| `emphasis` | 3 | schema/vocabulary.json:13 | high medium low |
| `size-control` | 3 | schema/vocabulary.json:14 | sm md lg |
| `shape` | 3 | schema/vocabulary.json:15 | slant curve wave |
| `surface` | 3 | schema/vocabulary.json:16 | base raised sunken |
| `paint` | 20 | schema/vocabulary.json:17 | primary secondary success warning alert neutral white black grey grey-0 grey-10 grey-20 grey-30 grey-40 grey-50 grey-60 grey-70 grey-80 grey-90 grey-100 |
| `edge` | 3 | schema/vocabulary.json:18 | top bottom both |
| `span` | 12 | schema/vocabulary.json:19 | 1 2 3 4 5 6 7 8 9 10 11 12 |
| `tracks` | 11 | schema/vocabulary.json:20 | 2 3 4 5 6 7 8 9 10 11 12 |
| `start` | 12 | schema/vocabulary.json:21 | 1 2 3 4 5 6 7 8 9 10 11 12 |
| `rows` | 5 | schema/vocabulary.json:22 | 2 3 4 5 6 |
| `panel` | 3 | schema/vocabulary.json:23 | sheet drawer screen |
| `trigger` | 2 | schema/vocabulary.json:24 | click hover |
| `resize` | 2 | schema/vocabulary.json:28 | width both |
| `height` | 6 | schema/vocabulary.json:32 | sm md lg xl half full |
| `placement` | 4 | schema/vocabulary.json:40 | top bottom start end |
| `orientation` | 2 | schema/vocabulary.json:41 | horizontal vertical |
| `slides` | 4 | schema/vocabulary.json:42 | 1 2 3 4 |
| `enter` | 5 | schema/vocabulary.json:43 | fade rise fall slide scale |
| `attention` | 2 | schema/vocabulary.json:44 | pulse shake |
| `lift` | 2 | schema/vocabulary.json:45 | rise scale |
| `print` | 2 | schema/vocabulary.json:46 | only none |
| `fit` | 28 | schema/vocabulary.json:47 | xs-sm xs-md xs-lg xs-xl xs-2xl xs-3xl xs-display sm-md sm-lg sm-xl sm-2xl sm-3xl sm-display md-lg md-xl md-2xl md-3xl md-display lg-xl lg-2xl lg-3xl lg-display xl-2xl xl-3xl xl-display 2xl-3xl 2xl-display 3xl-display |

## 4. Markers

31 distinct marker names appear in the manifests' `markers` arrays (one name, `data-align`, is also an attribute of eight layouts; as a marker it is on table cells and rows). Format: marker, then the items that declare it and what it sits on (`*` is any element, `> *` a direct child).

| Marker | Declared by (on) |
| --- | --- |
| `data-border` | box@* |
| `data-paint` | box@* |
| `data-text` | box@* |
| `data-bleed` | breakout@> * |
| `data-note` | breakout@> * |
| `data-span` | columns@> *, grid@> *, hero@> * |
| `data-show` | container@* |
| `data-hide` | container@* |
| `data-center` | cover@> * |
| `data-start` | grid@> * |
| `data-align-self` | layer@> * |
| `data-justify-self` | layer@> * |
| `data-over` | overlay@> * |
| `data-fill` | overlay@> [data-over] |
| `data-sticky` | sidebar@> *, stack@> *, shell@> div > :is(nav, aside) |
| `data-split` | stack@> * |
| `data-space` | stack@> * |
| `data-min` | hero@> * |
| `data-close` | alert@> button, nav@li |
| `data-stretch` | card@a |
| `data-track` | carousel@> * |
| `data-slide` | carousel@> [data-track] > * |
| `data-dots` | carousel@> * |
| `data-preview` | demo@> div |
| `data-hint` | field@> * |
| `data-error` | field@> * |
| `data-brand` | nav@> * |
| `data-actions` | nav@> * |
| `data-numeric` | table@* |
| `data-nowrap` | table@th, td |
| `data-align` | table@th, td, tr |

Distinct attribute names across all manifests (`attributes` arrays): 54. The widest in use: `data-gap` (21 items), `data-align` (8), `data-threshold` (7); the rest are per item. The full per-item lists are in section 2.

## 5. Events

Six event names, seven declarations (`yeti:close` is declared by two items). Names are frozen, with the keys in `detail` (`src/guides/stability.md:21`). The six names match the guide's list. `src/guides/components.md:241` adds that all bubble, are composed, and none is cancelable (read; not exercised in a browser).

| Event | Dispatched on | `detail` | Module | Manifest line |
| --- | --- | --- | --- | --- |
| `yeti:close` | the `.alert`, after the fade and before removal | none declared | `alert.js` | `src/components/alert/manifest.json` (js block) |
| `yeti:open` | the dialog, once the browser opened it from a `commandfor` button | none declared | `dialog.js` | `src/components/dialog/manifest.json` |
| `yeti:close` | the dialog, however it closed | none declared | `dialog.js` | same |
| `yeti:select` | the `.tabs`, on click, arrow key or hash reveal | `{ tab, panel }` | `tabs.js` | `src/components/tabs/manifest.json` |
| `yeti:slide` | the `.carousel`, when a dot scrolls the track | `{ index, slide }` | `carousel.js` | `src/components/carousel/manifest.json` |
| `yeti:invalid` | the form, when a submit is refused | `{ controls }` | `validate.js` | `src/components/field/manifest.json:297` |
| `yeti:current` | the `.toc`, when the mark moves | `{ link, heading }` | `toc.js` | `src/components/toc/manifest.json` |

## 6. JavaScript modules

Ten files in `dist/js/` (listed from the build): `alert.js`, `carousel.js`, `demo.js`, `dialog.js`, `enter.js`, `hover.js`, `range.js`, `tabs.js`, `toc.js`, `validate.js`. All ten are named as frozen and optional (`src/guides/stability.md:20`); every `js` entry has `optional: true` in the manifests. Nine of the 49 items declare a module: alert, carousel, demo, dialog, dropdown (`hover.js`), field (`range.js`, `validate.js`), tabs, toc, and the utility `enter`. The other 40 have none.

Count disagreement inside the docs, checked: `src/guides/migrating.md:113` says "Eight components ship nine optional modules" and `src/guides/components.md:239` lists nine and omits `enter.js`; `src/guides/stability.md:20` and `dist/js/` have ten. The tenth is the utility `enter`, not a component, which is why the component-only count is nine.

`tabs` is the one item that needs its module to hide inactive panels; without it every panel shows and nothing breaks (`src/guides/components.md:216`). `hover.js` has an end date: it goes when `interestfor` reaches Baseline (`src/guides/components.md:243`).

## 7. Token catalogue

`dist/yeti.tokens.json` holds 297 tokens, every one `public: true`; 8 carry `declared: false` (inputs a page sets, such as `--yeti-base` and `--yeti-ratio`, with no default in the stylesheet). Private `--_yeti-*` tokens appear in manifests with `public: false` but not in the catalogue, and are not frozen (`src/guides/stability.md:26`). The catalogue is also at `src/tokens/tokens.json`, and a rendered page is `docs/tokens.md`. Token names are frozen; defaults may still be tuned (`src/guides/stability.md:19,27`).

| Group | Tokens | First line in the built catalogue |
| --- | --- | --- |
| scale | 8 | dist/yeti.tokens.json:8 |
| space | 15 | dist/yeti.tokens.json:66 |
| radius | 4 | dist/yeti.tokens.json:171 |
| width | 7 | dist/yeti.tokens.json:199 |
| height | 5 | dist/yeti.tokens.json:248 |
| text | 18 | dist/yeti.tokens.json:283 |
| font | 5 | dist/yeti.tokens.json:402 |
| motion | 6 | dist/yeti.tokens.json:444 |
| hue | 7 | dist/yeti.tokens.json:486 |
| color | 127 | dist/yeti.tokens.json:535 |
| layout | 3 | dist/yeti.tokens.json:866 |
| border | 1 | dist/yeti.tokens.json:887 |
| weight | 3 | dist/yeti.tokens.json:894 |
| shadow | 3 | dist/yeti.tokens.json:915 |
| control | 6 | dist/yeti.tokens.json:936 |
| button | 4 | dist/yeti.tokens.json:978 |
| badge | 2 | dist/yeti.tokens.json:1006 |
| card | 5 | dist/yeti.tokens.json:1020 |
| field | 4 | dist/yeti.tokens.json:1055 |
| table | 2 | dist/yeti.tokens.json:1076 |
| seam | 1 | dist/yeti.tokens.json:1090 |
| nav | 8 | dist/yeti.tokens.json:1098 |
| breadcrumbs | 1 | dist/yeti.tokens.json:1154 |
| pagination | 1 | dist/yeti.tokens.json:1161 |
| alert | 3 | dist/yeti.tokens.json:1168 |
| progress | 2 | dist/yeti.tokens.json:1190 |
| spinner | 2 | dist/yeti.tokens.json:1205 |
| accordion | 5 | dist/yeti.tokens.json:1219 |
| tabs | 2 | dist/yeti.tokens.json:1254 |
| dropdown | 6 | dist/yeti.tokens.json:1268 |
| dialog | 4 | dist/yeti.tokens.json:1310 |
| tooltip | 3 | dist/yeti.tokens.json:1338 |
| carousel | 3 | dist/yeti.tokens.json:1359 |
| toc | 3 | dist/yeti.tokens.json:1380 |
| demo | 3 | dist/yeti.tokens.json:1410 |
| enter | 6 | dist/yeti.tokens.json:1431 |
| lift | 5 | dist/yeti.tokens.json:1473 |
| attention | 3 | dist/yeti.tokens.json:1508 |
| fit | 1 | dist/yeti.tokens.json:1529 |

Groups before `control` are foundations (scale, space, radius, width, height, text, font, motion, hue, color, layout, border, weight, shadow); `color` alone is 127. The remaining groups are per-component or per-utility. Not every item has a group: for example `box` and `center` list only tokens shared with other items (section 2, own-prefixed count 0).

## 8. Themes, base layer, starter, and other published things

| Item | What it is | Source |
| --- | --- | --- |
| Themes | `soft` ("round, warm, roomy") and `sharp`, each 19 lines of token overrides loaded after `yeti.css`; built to `dist/themes/` | `src/themes/soft.css:1-19`, `src/themes/sharp.css`, `package.json` export `./themes/*` |
| Base layer | `reset.css`, `controls.css`, `media.css`, `prose.css`, `transitions.css`, `typography.css` | `src/base/`, `src/guides/base.md` |
| Cascade layers | six `yeti.*` sublayers declared once | `src/layers.css:7` (order: reset, base, theme, layouts, components, utilities), `src/layouts/attributes.css:4` |
| Shared attribute rules | one rule per `data-*` value of each vocabulary, 466 lines | `src/layouts/attributes.css` |
| Starter | `index.html` and `theme.css`; built to `dist/starter/` | `src/starter/` |
| Guides | 11 pages: animations, base, color, components, install, layouts, migrating, responsive, stability, theming, visibility | `src/guides/`, generated copies in `docs/guides/` |
| Reference pages | 49 item pages `docs/<name>.md`, plus `docs/tokens.md` | `docs/` (53 entries: 50 pages, `guides/`, `llms.txt`, `llms-full.txt`) |
| Editor data | `yeti.html-data.json`, `yeti.web-types.json` | `dist/`, `src/guides/install.md:178` |
| Types | `yeti.d.ts`, `yeti.manifest.d.ts`, `yeti.tokens.d.ts` | `dist/`, `package.json` exports |
| Assistants | `llms.txt`, `llms-full.txt` | `docs/`, `dist/`, `src/guides/install.md:201` |
| Package exports | `.` (CSS), `./css/*`, `./js/*`, `./yeti.js`, `./themes/*`, `./manifest`, `./tokens` | `package.json:20-` |
| Validation tooling | `bin/validate.js` (manifest, examples, guide snippets, CSS spacing, layer contract), `bin/validate-html.js` (a folder of built HTML against the manifest), `bin/frozen.js` (frozen names between two refs) | header comments of those files; `src/guides/stability.md:36` |
| Support floor | "Baseline 2025"; newer features behind `@supports` | `README.md:32` |

## 9. The contract: what is frozen at `7.0.0-beta`

From `src/guides/stability.md` (read in full):

Frozen (lines 15-22): component class names (the 49); attribute names and value lists (values may be added, none removed); vocabularies; marker names and values; public token names (defaults may change); the ten module file names and their being optional; the six event names, their dispatch targets and `detail` keys; the manifest and token catalogue schemas and the package `exports` map.

Not frozen (lines 26-30): private `--_yeti-*` tokens; default values of public tokens; the exact text of generated files (docs pages, `llms.txt`, editor data, types); test fixtures, baselines, and `bin/`; browser support minimums (they track Baseline).

A breaking change is a renamed class, removed attribute value, changed meaning of a value, renamed public token, or a module made required (line 34). A script, `node bin/frozen.js <ref>`, reads every frozen name at a ref and at the tree and exits non-zero on a break (line 38). Screenshot baselines are re-blessed in the commit that changes them (line 42).

What the guide does not freeze or mention: the HTML structure of an item (the `children` selectors in the manifests), the `a11y` blocks, and the `support` blocks. These are in the manifest but fall outside the lines above (inferred from the list, not stated by the guide).

Per-row frozen status is in the last column of section 2. Every row is covered by the same rule, so the column does not vary except for the module and events on the nine rows that have them.

## 10. Migration map: the old map's 55 specs against Yeti

Source: `https://www.foundationcss.com/yeti/guides/migrating/`, fetched through `markdown.new` (returned HTTP 200). Its tables have 58 data rows and match `src/guides/migrating.md` row for row, apart from code formatting lost in the conversion (compared in a script). Line numbers below are in `src/guides/migrating.md`. "Not in guide" means the old spec's family does not appear in the guide's tables; the Yeti column then comes from the manifests and other guides and is marked inferred.

`.scratch/next-foundation-specs/specs/` has 57 files; excluding `float-grid.md` and `flex-grid.md`, which the old map ruled out of scope on 2026-10-01 and which the migration guide's grid rows cover, leaves 55. (The earlier coverage pass in `.scratch/next-foundation-specs/research/yeti-foundation-7.md` section 4.2 speaks of 51 specs and groups some; the table below is per file.)

| Old spec | Yeti counterpart | Evidence |
| --- | --- | --- |
| abide | none | guide :83, "native validation attributes; the field shows the browser's state". Yeti does ship `validate.js` on `field`, which moves the browser message into the error slot (`src/components/field/manifest.json:297`). |
| accordion | `accordion` | :66, native `<details>`, `name` for one-at-a-time |
| accordion-menu | none | :63 |
| drilldown-menu | none | :63 |
| anchored-pane | none as a unit; `dropdown` and `tooltip` are popover-based | not in guide; inferred from :61, :65 |
| badge | `badge` | :56, one component with `label` |
| label | `badge` | :56 |
| breadcrumbs | `breadcrumbs` | :72 |
| breakpoint-service | none; widths are tokens read by container queries | not in guide; `src/guides/responsive.md:31,92`, `--yeti-width-*` in the `width` token group (`dist/yeti.tokens.json:199`) |
| button | `button` | :51, `data-variant`, `data-emphasis` replaces hollow and clear |
| button-group | `buttons` | :52 |
| callout | `alert` (message) or `box` with `data-border` (panel); `data-paint` for a coloured panel | :53-54 |
| card | `card` | :55 |
| close-button | `data-close` marker inside `alert` or `nav` | :74 |
| dropdown | `dropdown` | :61, popover, no script |
| dropdown-menu | `dropdown` inside a `nav` item, one level | :62 |
| equalizer | none | :84 |
| flexbox-utilities | partial: `data-align`, `data-justify`, `data-align-self` markers on layouts | :30 for the alignment classes; the rest of the flexbox utility set is not in the guide (inferred) |
| float-classes | none | :28 |
| forms | `field`, with `affix` for joined controls and `data-hint`/`data-error` | :80-82 |
| interchange | none | :85, `<picture>` and `srcset` |
| magellan | none in the guide; `toc` with `toc.js` marks the heading in view | :76; `src/components/toc/toc.js:1-11` (read). The guide says none; the module does cover the table-of-contents case. |
| media-object | `media` recipe | :79 |
| menu | `cluster` or `stack` of links; `nav` for a site menu | :60 |
| nested-menu | none | not in guide; follows from :62-63 (inferred) |
| off-canvas | partial: `nav` with `data-panel="drawer"` | :59; no general off-canvas region (inferred) |
| orbit | `carousel` | :68 |
| pagination | `pagination` | :73 |
| progress-bar | `progress` on native `<progress>` | :69 |
| prototyping-utilities | partial: `box` (`data-gap`, `-inline`, `-block`) for padding, `stack` gap and `data-space` for margin | :31-32; `src/guides/migrating.md:101` says "Yeti has no margin classes, on purpose" |
| responsive-accordion-tabs | none | not in guide; `tabs` has `data-orientation` but no accordion form (manifest; inferred) |
| responsive-embed | `frame` with `data-ratio` | :77 |
| responsive-menu | none as such; `nav` collapses at `data-threshold` | not in guide; `nav` description in the manifest (checked) |
| responsive-toggle | partial: the `nav` toggle | not in guide; inferred from the `nav` description |
| reveal | `dialog` opened by `commandfor` | :64 |
| slider | `field` around `<input type="range">` | :70 |
| smooth-scroll | none | not in guide; no `smooth` or scroll-behavior entry in the 49 manifests (inferred) |
| sticky | `data-sticky` marker | :75; declared on `sidebar`, `stack`, `shell`, and `nav` (`src/layouts/stack/manifest.json:60`) |
| switch | `field` around a checkbox with `role="switch"` | :71 |
| table | `table` with `data-hover`, `data-striped`; `scroller` for width | :57; the stacking table is gone |
| tabs | `tabs` | :67 |
| thumbnail | `frame` in a `box` with `data-border` | :78 |
| toggler | none | :86, :93 |
| tooltip | `tooltip` | :65 |
| top-bar | `nav` | :58 |
| triggers | none; the platform's `popovertarget`, `commandfor` | :93 describes what replaces Toggler; no triggers unit (inferred) |
| typography-helpers | partial: base typography, `lede`, `billboard` | not in guide; no `.subheader`/`.lead`/`.stat` classes in the manifests (inferred) |
| visibility-classes | `data-show`/`data-hide` inside a `container`; `visually-hidden`; the `hidden` attribute; `print` | :29, :40-45; `.show-on-focus` has no class but the base skip-link rule does it (`src/guides/visibility.md:113-125`); no `-only`, `-portrait`, `-landscape` (:99) |
| xy-grid | `center`, `columns` with `data-span`, `grid` with `data-columns`, `stack`, `cover` and `scroller` | :21-27; "shares, not twelfths", no 12-column grid |
| build-time-checks, family-checks, forgotten-import-checks, misuse-warnings, runtime-checks, variant-declaration-tooling | no counterpart as a spec; Yeti's own checks are `bin/validate.js`, `bin/validate-html.js`, `bin/frozen.js` | inferred: these old specs describe the old design's library checks, not Yeti items; Yeti's tools are repository tooling plus an HTML checker (header comments read) |

Old specs with no Yeti counterpart: abide (the module exists but the guide says none), accordion-menu, drilldown-menu, equalizer, float-classes, interchange, magellan (partial through `toc`), nested-menu, responsive-accordion-tabs, smooth-scroll, toggler, triggers, anchored-pane and breakpoint-service as units, and the six check/tooling specs. Partial: flexbox-utilities, off-canvas, prototyping-utilities, responsive-toggle, typography-helpers, responsive-menu.

Yeti items whose names do not appear in the guide's mapping tables (checked by searching `src/guides/migrating.md` for each name in backticks): layouts `breakout`, `icon`, `layer`, `masonry`, `overlay`, `timeline`; recipe `hero`; components `demo`, `seam`, `spinner`, `toc`; utilities `attention`, `billboard`, `enter`, `lede`, `lift`. That is 16 of 49 with no Foundation 6 row. Whether the others each match a single old spec is shown in the table above.

## 11. What was checked, what was inferred

Checked directly:

- the build ran and wrote the manifest (49 entries, 17/3/22/7) and the token catalogue (297 tokens, 39 groups, 8 `declared: false`);
- source manifests equal the built ones apart from three build-time normalisations;
- the per-row fields in section 2 are generated from the manifest, the example file, and the source manifest line numbers by script;
- the stability guide text, the README status line, the version fields, the module files, the six events;
- the live migration page against the source guide, row for row.

Inferred or not exercised:

- the mapping rows marked "not in guide", "inferred";
- that the old map's 55 specs are the right unit for comparison;
- the exact rendering and behaviour of any item (no component was loaded in a browser);
- the "frozen" status of structure (children selectors, a11y, support blocks), which the guide does not name;
- that `docs/<name>.md` pages carry the same content as the manifests; their headers say they are generated from them.
