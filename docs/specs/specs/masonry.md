# Spec: masonry (layout)

Ticket: [62. Spec: masonry (layout)](../issues/62-spec-masonry.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 12 and Part 1, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 45 to 47, [ADR 0002](../adr/0002-browser-target-baseline-2025.md), [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at 22.2.x. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 53 and 54), and each is cited where it applies.

## Problem Statement

Yeti's `masonry` layout is for "a wall of photos, cards of unpredictable length, quotes of different sizes: anything where equal rows would leave holes under the short items" (`Y/src/layouts/masonry/docs.md`). It is one **Identity class**, `masonry`, on a parent element, and three attributes (`data-min`, `data-columns`, `data-gap`). Every direct child is an item that keeps its own height. It has no **Marker**, no **Module**, and no events (`Y/src/layouts/masonry/manifest.json`).

An application developer using the package cannot write `class="masonry"` or any of those `data-*` attributes: a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). Written by hand, `data-min="tiny"` compiles and silently falls back to Yeti's default. The developer also needs the `masonry` **Item file** loaded while a masonry layout is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)); without it the items stack as plain blocks at every width, with no error.

Two more things make this layout different from its neighbours. First, Yeti ships it on two code paths. Everywhere, it is a CSS multi-column layout, in which items "flow down the first column, then the next, so the reading order runs in columns". Where a browser passes `@supports (grid-template-rows: masonry)`, the same element becomes a grid with masonry rows and "items read across as in a grid" (`docs.md`). Which browsers in the target take the native path is not confirmed (section 1). Second, in either path the order a sighted reader scans can differ from source order, and focus follows source order. Yeti's manifest leaves that to the author: "In browsers without native masonry, items read down each column and then across. Keep the source order meaningful on its own" (`manifest.json:25`). [building-blocks.md](../building-blocks.md) Part 2 row 12 makes it a usage rule: "column-first reading order is the author's 1.3.2 risk".

## Solution

One directive in the secondary entry point `ngx-yeti/masonry` ([building-blocks.md](../building-blocks.md) Part 2 row 12; 1.3):

- The **Item directive** `YetiMasonry`, selector `[yetiMasonry]`, `exportAs: 'yetiMasonry'`. It binds `masonry` as a static host class, binds `data-min`, `data-columns`, and `data-gap` from the typed inputs `min`, `columns`, and `gap`, sets its presence attribute `data-ngx-yeti-item-masonry` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), and acquires the `masonry` item file when it is created, on the server too, and releases it when it is destroyed (ADR 0060 point 2), through `injectYetiItemStyles('masonry')` from `ngx-yeti/styles` as the last statement of its constructor ([setup](setup.md); ticket 50 decisions 42 and 45).

The developer writes `<div yetiMasonry min="xs" columns="3">` where Yeti's docs write `<div class="masonry" data-min="xs" data-columns="3">`. An unset input renders no attribute, so Yeti's own default applies from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1). The directive is **types only** in building-blocks' sense: no listener, no render callback, no service, and no DI. It has no part directive, because the manifest declares no marker and an item needs none.

Everything else is Yeti's CSS and the platform. The column count is decided by the container's width through `column-width` (or, on the native path, `repeat(auto-fill, minmax(...))`), so the layout is right on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block. The package adds no CSS, no feature detection, and no reordering: the reading-order risk stays the author's, stated as usage rules 3 and 4.

## User Stories

1. As an application developer, I want to pack items of uneven height into columns with one directive attribute, so that I never write Yeti's `masonry` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="masonry"` and `data-*` attributes, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want to set the narrowest column with a `min` input typed by Yeti's `width-or-none` vocabulary, so that `min="tiny"` fails to compile.
4. As an application developer, I want to cap the column count with a `columns` input typed `'1'` to `'6'`, so that `columns="3"` compiles and `columns="7"` does not.
5. As an application developer, I want `min="none"` with `columns="3"` to give exactly three columns at every width, so that I can ask for a fixed count.
6. As an application developer, I want the spec to tell me that `min="none"` without `columns` gives one full-width column, so that I do not mistake it for "no minimum".
7. As an application developer, I want to set the space between columns and between items with a `gap` input typed by Yeti's `gap` vocabulary, fluid pairs included, so that I use the same gap values as every other layout.
8. As an application developer, I want a static attribute such as `columns="3"` to type-check, so that I need no property binding for a constant.
9. As an application developer, I want an input I leave unset to render no attribute, so that Yeti's own default applies and the server HTML stays Yeti's minimal markup.
10. As an application developer, I want to change a bound input at run time and see the layout follow, so that a density setting in my UI can change the column count.
11. As an application developer, I want the column count decided by the container's width, so that the same markup works in a sidebar and a full-width band.
12. As an application developer, I want each item to keep its own height with no hole under a short one, so that a photo wall looks packed.
13. As an application developer, I want an item never split across two columns, so that a card stays whole.
14. As an application developer, I want the spec to tell me that the layout sets the space under each item, so that I do not add item margins that fight it.
15. As an application developer, I want the same markup to use native masonry wherever a browser supports it, with nothing to change in my code, so that a browser update improves the layout on its own.
16. As an application developer, I want to know which order my items read in on each code path, so that I can write source order that makes sense in both.
17. As an application developer, I want to know that the multi-column fallback is one gap taller than the native form, so that I do not file it as a bug.
18. As an application developer, I want the masonry item file loaded when the first masonry layout renders and removed after the last leaves, so that I do not import `masonry.css` globally.
19. As an application developer, I want the item file in the server HTML when a server-rendered page has a masonry layout, so that the first paint is already in columns.
20. As an application developer, I want the layout right with JavaScript off under SSR and prerendering, so that the page reads the same before any script runs.
21. As an application developer, I want hydration to change nothing on a masonry layout, so that I get no `NG05xx` error and no reflow.
22. As an application developer, I want the layout to work under zoneless change detection, so that the package fits Angular's recommended mode.
23. As an application developer, I want a masonry layout inside a `hydrate never` block to keep its styles for as long as it is on the page, so that a dehydrated block is not unstyled when a live layout elsewhere leaves.
24. As an application developer, I want to know that a masonry layout inside a client-only `@defer` block needs `masonry` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
25. As an application developer, I want `@for` and `@if` inside the layout to add items without wrapper elements, so that a list of photos renders as items.
26. As an application developer, I want a component of mine to be an item, so that `<app-photo>` hosts can be the children.
27. As an application developer, I want images in my items to use `NgOptimizedImage` with their dimensions, so that an image that loads late does not move items between columns.
28. As an application developer, I want a static `min="xs"` to do nothing beyond the input, so that the HTML `min` attribute has no effect on my element.
29. As an application developer, I want a template reference (`#m="yetiMasonry"`), so that the directive follows the package's `exportAs` rule.
30. As an application developer, I want to import the directive from `ngx-yeti/masonry`, so that a `@defer` block can split it with the rest of the item.
31. As an application developer, I want the input value types re-exported by name from the package (`YetiWidthOrNone`, `YetiColumns`, `YetiGap`), so that I can type my own signals that feed the inputs.
32. As an application developer, I want the usage rules stated (direct children, at least two, meaningful source order, no visual reordering), so that I use the layout as Yeti intends.
33. As an application developer using Tailwind v4 beside the package, I want to know whether `masonry` collides with a Tailwind name, so that I can plan my layer statement.
34. As a screen-reader user, I want the items announced in source order with no role from the layout, so that the layout changes nothing about what I hear.
35. As a sighted keyboard user, I want Tab to move through the items in an order I can follow on screen, so that focus does not seem to jump at random.
36. As a sighted reader, I want the items' source order to make sense whether I read down the columns or across them, so that the arrangement never changes the meaning.
37. As a low-vision user, I want the layout to fall to one column when I zoom in or the container narrows, so that I never scroll sideways to read an item.
38. As a low-vision user who overrides text spacing, I want items to grow with their content, so that my spacing settings clip nothing.
39. As a package maintainer, I want the contract check to cover the three attributes and every value of their vocabularies, so that a pin move that adds a value or attribute fails before release.
40. As a package maintainer, I want the e2e run to record which code path each engine takes, so that a browser that gains native masonry shows up in CI rather than in a bug report.
41. As a package maintainer, I want the order assertions to branch on the path the engine takes, as Yeti's own test does, so that the suite passes in every engine while asserting each path's order.
42. As a package maintainer, I want the SSR smoke to assert the server HTML of a masonry layout and its item link, so that the first paint is proven.
43. As a package maintainer, I want the fixture app to render the layout on a prerendered and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
44. As a package maintainer, I want no test to depend on a public token's default value or on Yeti's default `min`, so that a pin move that changes a default fails no test for no reason.
45. As a package maintainer, I want the class name checked against Yeti's typings at the pin, so that `YetiMasonry` stays correct if Yeti ever exports a type of that name.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/layouts/masonry/manifest.json`, `masonry.css`, `docs.md`, and `example.html`, in `Y/schema/vocabulary.json` and `Y/src/layouts/attributes.css`, and in Yeti's own test `Y/test/browser/layouts/masonry.spec.js` with its fixture:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `masonry`, `layout`, `Grids and Rows` |
| `class` | `masonry` |
| `attributes` | `data-min` (vocabulary `width-or-none`: `none`, `2xs` to `2xl`; default `xs`: "The narrowest a column may be. none is meant to be paired with data-columns, which then gives an exact count; alone it gives a single full-width column."), `data-columns` (vocabulary `columns`: `1` to `6`; no default: "The most columns allowed. Fewer appear when the container cannot fit that many at data-min."), `data-gap` (vocabulary `gap`, 29 values; default `md`: "Space between columns and between items.") |
| `classes` | empty |
| `children` | `> *` (min 2, max none: "The items. Each keeps its own height.") |
| `markers` | none |
| `tokens` | `--yeti-width-xs` (public, the default minimum column width), `--yeti-space-md` (public, the default gap), and four private tokens (`--_yeti-gap`, `--_yeti-min`, `--_yeti-column-count`, `--_yeti-column-cap`) |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "In browsers without native masonry, items read down each column and then across. Keep the source order meaningful on its own." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: "multi-column layout", "break-inside"; `guarded`: "grid-template-rows: masonry (add a display: grid-lanes guard when its companion properties settle)" |
| `since`, `demo` | `7.0.0`; docs demo height `xl` |

How it works, in `@layer yeti.layouts`:

- **The fallback path, in every browser.** `.masonry` sets `column-width: var(--_yeti-min)`, `column-count: var(--_yeti-column-count)`, and `column-gap: var(--_yeti-gap)`. Each `.masonry:not([data-*])` rule supplies a default only when its attribute is absent: `--yeti-space-md` for the gap, `--yeti-width-xs` for the minimum, and `column-count: auto` with a zero cap when `data-columns` is absent. `.masonry[data-min="none"]:not([data-columns])` gives one full-width column, because with no floor "both the column and the grid path repeat until the gaps overflow" (the source comment). Every child gets `margin: 0 0 var(--_yeti-gap)` and `break-inside: avoid`: "The layout sets the space under each item; the item never does." The browser fills the first column top to bottom, then the next, and balances the column heights.
- **The native path, behind `@supports (grid-template-rows: masonry)`.** `.masonry` becomes `display: grid` with `grid-template-columns: repeat(auto-fill, minmax(min(max(var(--_yeti-min), var(--_yeti-column-cap)), 100%), 1fr))`, `grid-template-rows: masonry`, and `gap`, and resets the column properties. Children lose the margin and `break-inside`. Under the CSS Grid Level 3 masonry draft, each item in source order goes to the track with the most room, so the first items fill the first row in order and later ones go under the shortest track (inferred from the draft's placement model; the draft was not read at a fixed revision, and nothing was measured).
- **Value rules**, all in the always-loaded `layouts/attributes.css`: `[data-min="none"]` sets `--_yeti-min: 0px` and each width sets `--_yeti-min: var(--yeti-width-<value>)` (`attributes.css:192-199`); `[data-columns="N"]` sets `--_yeti-column-count: N` and `--_yeti-column-cap: calc((100% - (N-1) * var(--_yeti-gap)) / N)`, commented as "a count for masonry's multi-column fallback" and "a minimum track width for grids" (`:228-235`); the `data-gap` values set `--_yeti-gap`. The item file holds only the `.masonry` rules. Neither file uses `@container`: the count follows the masonry element's own inline size.

**Against the browser target** (ADR 0002; [Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md), `research/browser-baseline-vs-yeti.md`, read):

| Feature the item file uses | web-features status | In the target? |
| --- | --- | --- |
| Multi-column layout (`column-width`, `column-count`, `column-gap`) | `multi-column`, Baseline high since 2017 (Chrome 50, Firefox 52, Safari 9) | yes, unguarded |
| `break-inside: avoid` | `page-breaks`, Baseline high since 2020 (Chrome 50, Edge 79, Firefox 65, Safari 10) | yes, unguarded |
| `display: grid`, `gap`, `repeat(auto-fill, minmax())`, `min()`, `max()` | Baseline high | yes; used only inside the guard |
| `grid-template-rows: masonry` | no browser-compat-data key; web-features maps native masonry to `grid-lanes` (`display: grid-lanes`, Safari 26.4 only, per [research/yeti-foundation-7.md](../research/yeti-foundation-7.md) section 3.3) | **no**; guarded by Yeti, fallback: the multi-column path |

So the only feature outside the target is the native path, and Yeti guards it. The guard tests a syntax with no compat key, and whether any shipping browser passes it is not confirmed ([upstream-bugs.md](../upstream-bugs.md) row Y6, struck through as a gap in the compat data, not a Yeti bug). The package relies on Yeti's fallback and adds no guard (building-blocks 1.2: "Yeti guards it in CSS with a stated fallback; the package relies on Yeti's fallback and adds no guard"). Building-blocks 1.2's table lists native masonry (`grid-template-rows: masonry`, `masonry.css:29`) in that column, with the multi-column fallback, where items read down each column ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 54). The item uses no Module: `js` is `null`, and `Y/dist/js/` has no masonry file.

Attributes left to the consumer: none. Ticket 26 maps all three (rows 45 to 47) and leaves none to the consumer.

### 2. Contract mapping

| Contract piece | Yeti | Package | Static form of an HTML-named input | Record |
| --- | --- | --- | --- | --- |
| Identity class | `masonry` | static host class on `[yetiMasonry]` (`YetiMasonry`) | not applicable | ADR 0003 point 1; Part 2 row 12 |
| `data-min` | the narrowest column, or `none`; default `xs` | `min` on `yetiMasonry`: `YetiWidthOrNone`, default `undefined`, bound `[attr.data-min]` | `inert`: HTML `min` applies to form controls (`input`, `meter`), which cannot hold a masonry's items, so no binding | ticket 26 row 45 (R; "HTML `min` (form controls): `inert` on Yeti's hosts") |
| `data-columns` | the most columns; no default | `columns`: `YetiColumns`, default `undefined`, `[attr.data-columns]` | not an HTML attribute | ticket 26 row 46 (R) |
| `data-gap` | space between columns and items; default `md` | `gap`: `YetiGap`, default `undefined`, `[attr.data-gap]` | not an HTML attribute | ticket 26 row 47 (R) |
| Children `> *` | the items | no directive | not applicable | manifest `children`; no marker |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Token `--yeti-width-xs` | the default minimum column width | the consumer's; the package writes none | not applicable | ADR 0004 |
| Token `--yeti-space-md` | the default gap | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--yeti-width-*`, `--yeti-space-*` | the values each `min` and `gap` value reads (`attributes.css`) | the consumer's; the package writes none | not applicable | ADR 0004 |
| Host attribute (package) | not Yeti's | static `data-ngx-yeti-item-masonry` (empty value) on `[yetiMasonry]` | not applicable | ADR 0045; ADR 0060 point 2; ADR 0080 point 2 |
| Injection token | not Yeti's | none: the item has no part directive to find it | not applicable | ADR 0070 kind C applies only to a marker on a child; the manifest has none |

The input value types are Yeti's own, imported from the package's generated `yeti-types.ts` and re-exported by name from the primary entry point, never redeclared ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5 and its 2026-10-02 note; ADR 0060 point 10). Each is a full vocabulary, so no `Extract` and no package-declared `Yeti<Item><Input>` type is needed.

**Module replaced:** none. Yeti's `masonry` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 12, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads `--yeti-width-xs` and `--yeti-space-md` for its defaults, and through the always-loaded value rules whichever `--yeti-width-*` and `--yeti-space-*` (or the fluid pair tokens) a set attribute names. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`. They are derived tokens, so they also take effect on any element (`Y/src/guides/theming.md:38`). **Private tokens** (`--_yeti-*`) are never read or written: the four the manifest lists are Yeti's implementation.

### 3. Hierarchy and DI shape

`YetiMasonry` provides nothing and injects only the root styles service of ADR 0060, through `injectYetiItemStyles('masonry')` from `ngx-yeti/styles` ([setup](setup.md); ticket 50 decisions 42 and 45), which acquires and releases the `masonry` item file. That service belongs to the [setup](setup.md) spec and ADR 0060. No injection token is declared: building-blocks 1.9 gives an item a token for its part directives to find it, and this item has none. If a later pin adds a marker, the part directive and its token come with it (ADR 0070 kind C).

No item directive hosts another (Part 2, "Two findings that hold across the matrix"). A consumer composes `yetiMasonry` beside another item directive on one element by writing both attributes. Two directives on one element that declare the same input name share the vocabulary's exported type (building-blocks 1.4, shared vocabularies): `yetiMasonry` beside `yetiBox` both declare `gap: YetiGap`, so one static `gap="lg"` feeds both and both bind the same `data-gap`, which is what Yeti's single attribute means on that element. Each directive sets its own presence attribute, so both item files are held (ADR 0045). An item directive on a masonry's child (`<article yetiBox>`) is an ordinary item; `.masonry > *` styles it as an item.

Generated ids and the platform's relationship attributes: none. The layout renders no `id` and references none, so it does not use [generated-ids](generated-ids.md).

### 4. API

**`YetiMasonry`**

| Member | Value |
| --- | --- |
| Class | `YetiMasonry`. Checked at the Pin: not among the 46 names `yeti.d.ts` exports (checked against Yeti's built `dist/yeti.d.ts` at the pin, the build ADR 0080 used), so it keeps `Yeti` (ADR 0080 point 4) |
| Selector | `[yetiMasonry]` (Part 2 row 12) |
| `exportAs` | `yetiMasonry` (building-blocks 1.3) |
| Entry point | `ngx-yeti/masonry` (building-blocks 1.3; ADR 0011 clause 10) |
| Inputs | `min: YetiWidthOrNone \| undefined`, `columns: YetiColumns \| undefined`, `gap: YetiGap \| undefined`, each `input()` with no default value (ADR 0070 rule 1). All three types exist in that `yeti.d.ts` (`YetiWidthOrNone` at line 34, `YetiColumns` at line 5, `YetiGap` at line 10) |
| Host | static `class: 'masonry'`; static `'data-ngx-yeti-item-masonry': ''`; `'[attr.data-min]'`, `'[attr.data-columns]'`, `'[attr.data-gap]'` from the inputs, `null` when unset. No `[attr.min]` binding (`inert`) |
| Providers | none |
| Models, outputs, methods, listeners | none |
| Lifecycle | `injectYetiItemStyles('masonry')` is the last statement of its constructor, after anything there that can throw (nothing does today); it acquires the `masonry` item file, on the server too, and releases it on destroy through `DestroyRef` (ADR 0060 point 2; building-blocks 1.9; [setup](setup.md); ticket 50 decisions 42 and 45) |

No input default differs from Yeti's: every input is `undefined` until the consumer sets it, and Yeti's CSS supplies the manifest's default (ADR 0070 rule 1). A static attribute type-checks as a string literal under `strictTemplates`, so `columns="3"` compiles and `columns="7"` does not (ADR 0070 rule 2).

**Usage rules** (numbered here and in the directive's JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiMasonry` on the element whose DOM children are the items, and give it at least two (manifest `children` `min: 2`). Every direct child element is an item: an element, or a component's host element. `@for`, `@if`, and `ng-container` add no element, so the elements they render are the items. A wrapper element inside a component makes that wrapper the single item.
2. Use `min="none"` only together with `columns`, which then gives an exact count. Alone it gives one full-width column (manifest `data-min` description).
3. Write the items in a source order that makes sense when read down each column and when read across. On the multi-column path, which every target browser takes unless it passes Yeti's guard, items read and take focus down the first column, then the next. On the native path they read roughly across. Screen readers and Tab follow source order on both. Where the order carries meaning (a timeline, ranked results, steps), use `grid` or `stack` instead (manifest `a11y.notes`; Part 2 row 12; WCAG 1.3.2, 2.4.3).
4. Do not reorder items visually with CSS `order`, `grid-row`, `grid-column`, or a reversed direction. Either path places items from source order, and a reorder on top would break usage rule 3 in a way neither path can show (WCAG 1.3.2, 2.4.3).
5. Do not give the items a margin. "The layout sets the space under each item; the item never does" (`masonry.css`). A consumer's unlayered item margin wins over Yeti's `yeti.layouts` rule and changes the gap on the fallback path only.
6. Give every image in an item its dimensions (`NgOptimizedImage` with `width` and `height`, building-blocks 1.2), so that the multi-column path can balance its columns before the image loads. An image without dimensions grows when it loads, and the browser moves items between columns to rebalance (inferred from multi-column balancing; not measured).
7. Do not write `class="masonry"`, any of Yeti's `data-*` attributes, or `data-ngx-yeti-item-masonry` statically on the host. The directive binds them, and a static copy is written back and removed again at hydration (ADR 0003 point 1; building-blocks, "Hydration constraints (2026-10-03)"). A value newer than the pin goes through `$any` (`[columns]="$any('7')"`, ADR 0070).
8. Import `YetiMasonry` in every component whose template writes the attribute. A **Forgotten import** renders plain blocks with no error unless an input is bound (`[columns]`, NG8002) or a template reference names the `exportAs` (NG8003) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `masonry` | Nearest in Angular Material: `MatGridList` |
| --- | --- | --- |
| Shape | an attribute directive on the consumer's element | a component `<mat-grid-list>` with `<mat-grid-tile>` children (`NC/src/material/grid-list/grid-list.ts:40`, `grid-tile.ts:25`) |
| Item height | each item keeps its own height | every tile in a row has the row's height (`rowHeight`, `grid-list.ts:91`) |
| Count | `min` sets the narrowest column and `columns` caps the count; the count follows the container's width | `cols` fixes the count (`grid-list.ts:87`) |
| Gutter | `gap` from Yeti's `gap` vocabulary | `gutterSize`, a CSS length string (`grid-list.ts:96`) |
| Layout engine | Yeti's CSS: multi-column layout, or native masonry where a browser supports it | the component's tile styler computes each tile's position in TypeScript |
| `exportAs` | `yetiMasonry` | `matGridList` (`grid-list.ts:41`) |

Material has no masonry layout, and nothing of the grid list applies: it positions tiles in script, in fixed rows, which is what masonry avoids.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 12; building-blocks 1.2). The reason: Yeti's CSS does the whole job; the directive adds the class, the typed attributes, the item-file acquisition, and `exportAs` (row 1's reason, which row 12 takes, "as row 1"). No Aria pattern applies (a layout has no role), and no CDK piece is used: there is no id, focus, keyboard, direction read, or observer. Multi-column layout and grid follow the CSS `direction` by themselves, so RTL needs no `Directionality`. The package does no feature detection: Yeti's `@supports` block is the only switch between the paths (building-blocks 1.2, "One code path per behaviour in package code").

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The layout adds no role, state, or property, and no tab stop.
- **Keyboard:** none. Focus moves through the items' own content in DOM order.
- **Names:** none.

**Reading order against visual order.** The layout never changes the DOM, so the accessibility tree and the Tab sequence always follow source order. What changes is where each item is drawn:

| Path | Where item n is drawn | Sequence a sighted reader sees | Tab and screen-reader sequence |
| --- | --- | --- | --- |
| Multi-column (every target browser unless it passes the guard) | down the first column, then the next; columns balanced by height | down each column, then across, if the reader reads by column; out of source order if the reader scans across rows | source order: down the first column, then to the top of the next. It matches the column-wise visual order. |
| Native masonry (guarded) | the first items fill the first row in order; each later item goes under the track with the most room | roughly across, row by row | source order: mostly across, but Tab can move up or down between neighbouring tracks where heights differ (inferred from the CSS Grid Level 3 placement model; not measured) |

So on both paths focus follows a sequence that can be traced on screen, and on neither path does it match a row-by-row scan of the multi-column form. The package cannot align them: the only platform piece that makes focus follow a visual order, CSS `reading-flow`, is outside the target and unused by Yeti (`research/yeti-planning-documents.md`, "Not used in 7.0"; not read for masonry). The records leave the risk with the author (Part 2 row 12; manifest `a11y.notes`), and usage rules 3 and 4 state it.

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The layout adds no structure. The consumer's elements keep their semantics; a list host keeps its list semantics, and whether it keeps its markers is Yeti's reset's (`:is(ul, ol)[role="list"]`, `Y/src/base/reset.css:83-86`). |
| 1.3.2 Meaningful Sequence | Neither path changes the DOM, so the programmatic sequence is source order. The visual sequence differs by path (table above). The author keeps source order meaningful in both (usage rules 3 and 4). This is the author's risk, as Part 2 row 12 and ledger row [A11Y-23](../ledger.md) record ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 53). |
| 1.4.4 Resize Text | Column widths and gaps are `rem`-based tokens (`--yeti-width-xs: 16rem`, `Y/src/tokens/space.css:37`), so text zoom widens the minimum with the text (read, not measured). |
| 1.4.10 Reflow | `column-width` is an ideal that the browser shrinks to the container, and the native path's track minimum is clamped with `min(..., 100%)`, so a narrow container gets one full-width column. Layer 4 asserts no horizontal overflow at a 320 px viewport for Yeti's example. |
| 1.4.12 Text Spacing | The rules set no height and no overflow; items grow with their content and `break-inside: avoid` keeps each whole (read). |
| 2.4.3 Focus Order | Focus follows source order, which on the multi-column path runs down each column, as the columns are drawn. On the native path it runs roughly across, with possible steps between tracks. Usage rules 3 and 4 keep the order meaningful; layer 1 and layer 4 assert the order each path draws. |

**Ledger rows owned:** A11Y-23 ([ledger.md](../ledger.md); Part 2 row 12; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 53), WCAG 2.2 1.3.2 and 2.4.3, verified *read*, tested by layer 1 and layer 4 (`masonry--order`). The package adds no accessibility or standards feature that Yeti lacks. Ticket 17 found 0 violations on Yeti's masonry example and named the column-first order as "a 1.3.2 risk the author owns (read)" ([Research: Yeti against WHATWG, WAI-ARIA, the APG, and Angular Aria, CDK, and Material patterns](../issues/17-research-yeti-accessibility-and-standards.md); `research/yeti-accessibility-and-standards.md`). The ledger's header asks for "every accessibility gap found in Yeti, whether or not the package closes it", so the risk is that row, whose **What the package adds** is none: usage rules 3 and 4 state the author's responsibility (ticket 50 decision 53).

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<div yetiMasonry min="xs" columns="3">
  <img ngSrc="one.jpg" width="800" height="1200" alt="A tall waterfall">
  <img ngSrc="two.jpg" width="1200" height="800" alt="A wide valley">
  <img ngSrc="three.jpg" width="1000" height="1000" alt="A square pond">
  <img ngSrc="four.jpg" width="800" height="1200" alt="A tall pine">
  <img ngSrc="five.jpg" width="1200" height="800" alt="A wide ridge">
</div>
```

Server HTML and the hydrated DOM are the same. The parent carries `yetimasonry=""`, `min="xs"` and `columns="3"` (the static input attributes, matched by no rule), `class="masonry"`, `data-min="xs"`, `data-columns="3"`, and `data-ngx-yeti-item-masonry=""`, and no `data-gap`. The images carry what `NgOptimizedImage` renders for them, which this spec does not own. The server also writes one item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>layouts/masonry/masonry.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="masonry"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts that link at bootstrap.

The delta from Yeti's docs markup: the consumer writes `yetiMasonry` and input names where the docs write `class="masonry"` and `data-*` names, and `NgOptimizedImage` with dimensions where the docs write a plain `<img src>`. The layout has no closed or open state.

### 9. Animation

None. The layout has no state and no transition; Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). Changing a bound input moves the items at once. An item the consumer inserts or removes with `@if` or `@for` may carry a class-form `animate.enter` or `animate.leave` of the consumer's or Yeti's `enter` utility; on the multi-column path the browser then rebalances the columns, which moves other items without animation. The item link stays until Angular removes the last host, because removal waits for the DOM (ADR 0060 point 4). A server-rendered masonry layout never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static class, the presence attribute, the bound `data-*` attributes, and the item link in `<head>` (section 8). Nothing is state a person or a module can change, so nothing is Angular-owned **Pre-hydration state** (ADR 0003 point 4; ticket 26: "the consumer's binding only" on rows 45 to 47).
- **Before hydration:** the directive creates no node, reads no layout, starts no timer or observer, and touches no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is the item acquisition, which ADR 0060 runs on the server too. The choice between the two paths is the browser's `@supports`, made on first paint with no script.
- **Full hydration:** the host is claimed as it is; 0 style mutations (ADR 0060 point 5, measured for the mechanism).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the layout and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism).
- **`hydrate never`:** the layout is its server HTML and stays styled while the host is connected, whatever live layouts do (ADR 0060 point 4). Nothing is lost except changing a bound input, which needs Angular.
- **Client-only `@defer`:** the item file is fetched when `YetiMasonry` is constructed, which can show unstyled frames (the items stacked); the consumer closes the gap with `provideYetiStyles({ preload: ['masonry'] })` (ADR 0060 point 6; [setup](setup.md)). A `@defer` block inside the host renders its placeholder or loading element as a direct child, so that element is an item while it shows (inferred from Yeti's `> *` selector).
- **Event replay:** the directive declares no listener, so nothing replays and no `jsaction` is added.
- **`withI18nSupport()`:** item content is usually translated with `i18n` in the consumer's component. The directive adds no `i18n` block of its own; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** inputs are `input()` signals read by host bindings, so a changed input refreshes its attribute with no zone (ADR 0070 rule 4; map, Standing rulings, item 43).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the layout is readable and in columns by the container's width, on whichever path the browser takes, because the class, the attributes, and the item link are in the server HTML. Nothing is lost: the layout has no behaviour. A client-only application gets no such promise.
- **Hydration boundary:** the parent and its items may sit in different boundaries. The layout has no ids or references, and a deferred item hydrates on its own.

### 11. Hydration constraints

The layout complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** host bindings read only inputs, which are equal on both, so both render the same class and attributes. Neither path of Yeti's CSS changes the DOM.
- **No direct DOM manipulation:** the directive writes nothing to the DOM outside host bindings. The item link belongs to the ADR 0060 service, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directive changes no element. The usage rules put no constraint on the host's element type; a host whose content model the items break (a `p` holding `div` items) would be repaired by the parser and differ from the server's DOM, so the consumer's markup must already be valid HTML.
- **`preserveWhitespaces`:** the directive has no template. Whitespace text between items is not drawn as an item: in a multi-column container it collapses between block children, and on the native path white-space-only text in a grid container is not rendered.
- **No output branched on the platform:** none. The server cannot know which path a browser takes, and it does not need to: both paths read the same attributes.
- **Static attributes the directive binds:** usage rule 7 keeps the consumer from writing them. The one HTML-named input, `min`, is `inert`, so its static form `min="xs"` is never bound, never removed, and equal on the server and the client. The orchestrator's decision on static presentational attributes (ticket 50, 2026-10-03) concerns the `removed` kind and does not reach it.

### 12. Single-page application

None. The layout has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). On a route change, a route's layouts leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-masonry]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders a layout again re-inserts it.

### 13. Item file

`yeti-css/css/layouts/masonry/masonry.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiMasonry]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:32`, after `icon` and before `breakout`, the rank table of point 3), and removed after the last host has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement, and optionally `provideYetiStyles({ preload: ['masonry'] })`. The layout adds nothing to it. Cross-item files acquired: none. `masonry.css` has no cross-item rule, and the value rules it depends on are in the always-loaded `layouts/attributes.css` (ADR 0060 point 9).

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attributes in the DOM, the item link, and where the items land in what order. It never asserts a private field or how the styles service counts. No test depends on a public token's default value or on a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3). A layout test sets `min` explicitly and reads the widths it needs from probe elements in the same story (`inline-size: var(--yeti-width-<value>)` for the minimum, `inline-size: var(--yeti-space-<value>)` for the gap), so an expected column count, `floor((W + gap) / (min + gap))` as in Yeti's own test, holds for any token value. "A column" is a set of items with equal rounded `left`; the column count is the number of distinct values.

Order assertions branch on the path the engine takes, read with `CSS.supports('grid-template-rows', 'masonry')` inside the test, as Yeti's own `masonry.spec.js` does. That is test code, not package code, so building-blocks 1.2's "no package feature detection" is kept. On the multi-column path, the column index never decreases in source order (items read down each column, then across). On the native path, the first `k` items, `k` being the column count, share one `top` and their `left` follows source order. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `masonry` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Stories other than `masonry--default` use eight blocks of fixed, different heights, after Yeti's fixture, each holding a link, so that Tab order can be checked. Story ids:

- `masonry--default`: Yeti's example (five images with `NgOptimizedImage` and their dimensions) with `min="xs"` and `columns="3"`, in a resizable container. Asserts `class="masonry"`, `data-min="xs"`, `data-columns="3"`, `data-ngx-yeti-item-masonry`, and no `data-gap` from the package on the parent. No child has a role or `tabindex` from the package.
- `masonry--fit`: no `columns`, `min` set explicitly, in a container whose width is a multiple of the probes. Asserts the column count equals the expected count, then shrinks the container and asserts the new count.
- `masonry--capped`: `columns="2"` in a container wide enough for more. Asserts two columns (Yeti's test, "data-columns caps the count").
- `masonry--exact`: `min="none"` with `columns="3"`. Asserts three columns at two container widths; and `min="none"` alone gives one full-width column.
- `masonry--order`: the eight blocks with a link each. Asserts the path's order (above) and that Tab visits the links in source order. On the multi-column path it also asserts that consecutive items in one column are separated by the gap read from the probe, within 1 px (Yeti's test, "packs items under each other with the gap between").
- `masonry--inputs`: Storybook controls bind `min`, `columns`, and `gap`. The play function sets each, asserts the matching `data-*` value, resets it to unset, and asserts the attribute is absent. With `min="xs"` written statically, asserts `data-min="xs"` and that `min="xs"` is left as written (`inert`).
- `masonry--rtl`: `masonry--order` inside `dir="rtl"`. Asserts the first item is in the rightmost column and that Tab still visits the links in source order.

### Layer 2: browser-level (`npx nx test <lib>`, `masonry.spec.ts`)

Through `TestBed.createDirective(YetiMasonry, { tagName: 'div', bindings })` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- the host has class `masonry` and `data-ngx-yeti-item-masonry`; with no bindings it has no `data-min`, `data-columns`, or `data-gap`;
- each input binding renders its attribute, a changed binding updates it after `whenStable()`, and binding `undefined` removes it;
- while the fixture lives, one `<link data-ngx-yeti-styles="masonry">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed;
- the directive injects no parent and provides no token.

A small test host covers what `createDirective` cannot: the template reference `#m="yetiMasonry"` resolves; the consumer's own `class` on the host is kept beside `masonry`; a static `min="xs"` stays as written beside `data-min="xs"`; `yetiMasonry` beside a `yetiBox` with one static `gap="lg"` gives one `data-gap="lg"` and both presence attributes.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `masonry.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture of Yeti's example whose items carry `i18n` captions, with a static `min="xs"` and `columns="3"` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the parent renders `class="masonry"`, `data-min="xs"`, `data-columns="3"`, and `data-ngx-yeti-item-masonry`; `<head>` holds one item link with `data-ngx-yeti-styles="masonry"`, `data-beasties-skip`, and an `href` ending `layouts/masonry/masonry.css?v=<pin>`; no element carries `jsaction`.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `masonry` has `YetiMasonry`; `data-min`, `data-columns`, and `data-gap` have inputs whose unions equal the manifest's vocabularies (`width-or-none`, `columns`, `gap`); the item has no markers and no events. A pin move that adds an attribute, a marker, or a value fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer 1 story ids: `masonry--fit` and `masonry--order` resize the container, not the viewport, in Chromium, Firefox, and WebKit, and assert the count and the path's order on each side (building-blocks 1.7 and 1.12). Each engine's run records the result of `CSS.supports('grid-template-rows', 'masonry')` in the test report, so a browser that starts passing Yeti's guard is visible.

Fixture half, on the **Fixture app** built with `outputMode: 'server'`, with a `/masonry` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route renders Yeti's example and the eight-block order fixture:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- with JavaScript disabled, the items' positions equal those with JavaScript on at the same width, and `@axe-core/playwright` with the six tags reports no violation;
- a layout inside a client-only `@defer` block with `masonry` in the preload list shows no unstyled frame; a layout inside a `hydrate never` block stays in columns after a live layout on the page is removed;
- navigating from the masonry route to a route without one removes the item link, and navigating back re-inserts it;
- at a 320 px viewport the page has no horizontal overflow and the example's items are in one column (1.4.10).

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically). It matters more here than for most layouts, because the floor and the current engines may differ in which path they take.

Prior art: Yeti's `example.html`, `docs.md`, and `test/browser/layouts/masonry.spec.js` with its fixture (the column count formula, the path branch, the gap check) for the stories; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; the [columns](columns.md) spec's probe technique for token-independent assertions.

## Out of Scope

- An input per token, or a minimum given as a length rather than Yeti's `width-or-none` vocabulary (ADR 0004; ADR 0070 rule 2).
- A viewport breakpoint input of any kind (building-blocks 1.7).
- Feature detection in the package, an input to choose a path, or package CSS that forces one path (building-blocks 1.2 and 1.13).
- Reordering items in script to make the visual order match a row-by-row scan, or a JavaScript masonry fallback. Yeti's docs name a JavaScript library as "the thing this layout replaces".
- A check that the host has at least two children, that `min="none"` comes with `columns`, or that no item is reordered or given a margin. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiMasonry]` with `min`, `columns`, `gap`; no part directive | building-blocks Part 2 row 12; ticket 26 rows 45 to 47; [Decide: the spec list](../issues/11-decide-spec-list.md) row 12 ("Attribute-only.") |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Class `YetiMasonry`; selector and `exportAs` keep `yeti` | ADR 0080 point 4; checked against `yeti.d.ts` at the pin |
| Input types are Yeti's vocabulary types from the generated `yeti-types.ts` | ADR 0080 point 5; ADR 0060 point 10 |
| Unset input renders no attribute | ADR 0070 rule 1 |
| `min` is `inert` | ticket 26 row 45; building-blocks 1.4 |
| No injection token | building-blocks 1.9 (a token serves part directives; this item has none) |
| Presence attribute `data-ngx-yeti-item-masonry` | ADR 0045 |
| Entry point `ngx-yeti/masonry` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 12 |
| Yeti's `@supports` chooses the path; the package detects nothing | building-blocks 1.2; ADR 0002 consequences |
| Reading order is the author's risk, stated as usage rules | Part 2 row 12; manifest `a11y.notes`; ticket 17; ledger row A11Y-23 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 53) |
| Tokens are the consumer's | ADR 0004 |
| Item file as a counted link | ADR 0060 points 2 to 6 |
| `injectYetiItemStyles('masonry')` last in the constructor | [setup](setup.md); ticket 50 decisions 42 and 45 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A photo wall, at most four columns, none narrower than `sm`:

```html
<div yetiMasonry min="sm" columns="4" gap="sm">
  @for (photo of photos(); track photo.id) {
    <img [ngSrc]="photo.src" [width]="photo.width" [height]="photo.height" [alt]="photo.alt">
  }
</div>
```

```ts
import { NgOptimizedImage } from '@angular/common';
import { YetiMasonry } from 'ngx-yeti/masonry';

@Component({
  selector: 'app-gallery',
  imports: [YetiMasonry, NgOptimizedImage],
  templateUrl: './gallery.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Gallery {
  readonly photos = input.required<readonly Photo[]>();
}
```

Quotes of different lengths in exactly three columns at every width:

```html
<ul yetiMasonry min="none" columns="3" role="list">
  @for (quote of quotes(); track quote.id) {
    <li><blockquote>{{ quote.text }}</blockquote></li>
  }
</ul>
```

A density the user picks, typed by Yeti's vocabulary:

```ts
import type { YetiColumns } from 'ngx-yeti';

readonly perRow = signal<YetiColumns>('3');
```

```html
<section yetiMasonry [columns]="perRow()">...</section>
```

A page whose masonry renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['masonry'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `layouts/masonry/masonry.css`, loaded by `YetiMasonry` as a counted link (section 13). The consumer writes nothing for the layout beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps every `data-min`, `data-columns`, and `data-gap` value to its private token (`--_yeti-min`, `--_yeti-column-count` and `--_yeti-column-cap`, `--_yeti-gap`); `tokens/space.css` declares `--yeti-width-*` and `--yeti-space-*`.
3. **Cross-item rules:** none. An item directive on a child (a `box` or a `card` as an item) loads its own item file through its own directive.
4. **Tokens:** reads `--yeti-width-xs` and `--yeti-space-md` by default and the named `--yeti-width-*` and `--yeti-space-*` through the value rules; writes none (section 2).
5. **What breaks without the item file:** the items render as plain blocks, one under another at every width, with no error. The `data-*` attributes still set their private tokens, which nothing reads.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled all 49 of Yeti's class names with Tailwind 4.3.3, and only `container`, `grid`, and `table` (plus the attribute name `hidden`) produced a utility (measured; `prototypes/yeti-tailwind/results/collisions.json`). `masonry` produced none.

### Platform features to adopt when the browser target moves

- **Native masonry** (`grid-lanes`, through `display: grid-lanes`; today Safari 26.4 only, per `research/yeti-foundation-7.md` section 3.3). Yeti owns this: its manifest plans "a display: grid-lanes guard when its companion properties settle". When a pin move brings that guard, the package changes nothing, but the order assertions above follow the engines that move to the native path, and the docs' reading-order note changes with them.
- **CSS `reading-flow`**, the platform's way to make focus and reading order follow the drawn order. It is outside the target and Yeti does not use it in 7.0 (`research/yeti-planning-documents.md`). Whether it applies to a masonry container was not read. If it does and Yeti adopts it, usage rule 3 relaxes on the native path.

Everything else the item file uses is inside Baseline 2025 (section 1).

### Single-page-application pieces relied on

None: the layout uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
