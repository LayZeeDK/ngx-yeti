# Spec: grid (layout)

Ticket: [59. Spec: grid (layout)](../issues/59-spec-grid.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 9 and Part 1, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 31 to 39, [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md), and [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 6. The grid owns no [ledger.md](../ledger.md) row. `Y/` is `github.com/foundation/yeti/` at the **Pin**. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 51 and 52), and each is cited where it applies.

## Problem Statement

Yeti's `grid` is the layout for a collection of like things in equal cells: it "Fits as many equal columns as the container allows at a minimum width, up to an optional maximum count" (`Y/src/layouts/grid/manifest.json`). Its CSS has two modes. The fitted mode is `repeat(auto-fit, minmax(min(max(min, cap), 100%), 1fr))`, where `data-min` is the narrowest a cell may be and `data-columns` caps the count by splitting the container N ways; `data-fold` makes that count halve as the grid narrows instead of stepping down by one. The tracks mode, `data-tracks`, gives a fixed number of equal tracks that children are placed on by line with the markers `data-start` and `data-span`, and below `data-threshold`, measured on the grid's own width, every child takes the whole row in source order. `data-rows` makes each child a subgrid of the grid's rows, so the parts of neighbouring cells line up (`Y/src/layouts/grid/grid.css`, `docs.md`). There is no **Module** and there are no events.

An application developer using the package cannot write `class="grid"` or any of the grid's seven attributes and two markers: the package's contract rule is that a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). In plain Yeti a misspelt `data-columns="four"`, a `data-span="13"`, or a `data-start` on a grandchild fails silently: the grid falls back to its defaults or the child flows into the next free track. The developer also needs the `grid` **Item file** loaded while a grid is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it every cell stacks at full width in normal flow, with no error.

Two names need care. `grid` is also a Tailwind v4 utility, which a consumer running both must know about ([building-blocks.md](../building-blocks.md) 1.13). And `start`, the grid child's input, is an HTML attribute that renumbers an `ol`, so on a child that is an `ol` the package must keep the input from changing the list's numbering (building-blocks 1.4; ticket 26 row 38).

## Solution

Two directives in the secondary entry point `ngx-yeti/grid` ([building-blocks.md](../building-blocks.md) Part 2 row 9):

- **`YetiGrid`**, the **Item directive**, on `[yetiGrid]`. It binds `grid` as a static host class and seven typed inputs to Yeti's attributes: `min` (`YetiWidthOrNone`) to `data-min`, `columns` (`YetiColumns`) to `data-columns`, `gap` (`YetiGap`) to `data-gap`, `rows` (`YetiRows`) to `data-rows`, `fold` (`boolean`, `booleanAttribute`) to `data-fold`, `tracks` (`YetiTracks`) to `data-tracks`, and `threshold` (`YetiWidth`) to `data-threshold` (ticket 26 rows 31 to 37, kind R). It sets the static presence attribute `data-ngx-yeti-item-grid` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), acquires the `grid` item file when it is created, on the server too, and releases it when destroyed. It provides `yetiGridToken`.
- **`YetiGridChild`**, the child directive for a cell placed on a tracks grid, on `[yetiGridChild]`. It binds `data-start` from a `start` input typed `YetiStart` and `data-span` from a `span` input typed `YetiSpan` (ticket 26 rows 38 and 39, kind C). It also binds `[attr.start]` to `null`, so that the input's static form never renumbers an `ol` child (the `removed` kind, building-blocks 1.4).

The developer writes `<ul yetiGrid min="2xs" columns="3" role="list">` where Yeti's docs write `<ul class="grid" data-min="2xs" data-columns="3" role="list">`, and `<figure yetiGridChild start="2" span="6">` where they write `<figure data-start="2" data-span="6">`. Unset inputs render nothing, so Yeti's defaults (`min` `xs`, `gap` `md`, `threshold` `md`, and no cap, rows, fold, or tracks) apply from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1). `role="list"` stays the consumer's (building-blocks 1.1; ticket 26).

Everything else is Yeti's CSS and the platform. The directives are **types only**: no listener, no render callback, no service, and no DI beyond the child's optional parent token. Server HTML is Yeti's documented markup, so the layout renders the same on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block. The combinations Yeti's validator refuses (a fold without 2, 4, or 6 columns, a fold on a tracks grid, a placement past the last track) are usage rules; their checks belong to a later milestone (map, Milestones).

## User Stories

1. As an application developer, I want to mark a list of cards as a grid with one directive attribute, so that I never write Yeti's `grid` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="grid"` in the DOM, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want to set the narrowest a cell may be with a `min` input typed by Yeti's width-or-none vocabulary, so that `min="small"` fails to compile.
4. As an application developer, I want to cap the column count with a `columns` input typed `'1'` to `'6'`, so that `columns="7"` fails to compile and four products never become five on a wide screen.
5. As an application developer, I want `min="none"` with `columns` to give an exact count, so that I can have "always four across" when the cells are small enough.
6. As an application developer, I want to set the space between cells with a `gap` input typed by Yeti's gap vocabulary, including the fluid pairs, so that I get the same 29 values Yeti documents.
7. As an application developer, I want an unset input to render no attribute, so that Yeti's own default applies and moves with the pin.
8. As an application developer, I want `fold` to make the count halve as the grid narrows (four, two, one, never three), so that a product wall never leaves one orphan in a row of three.
9. As an application developer, I want `[fold]="false"` to remove `data-fold`, so that I can toggle the fold from state.
10. As an application developer, I want `rows` to line up the parts of neighbouring cells (pictures, titles, footers), so that cards in a row align without fixed heights.
11. As an application developer, I want `tracks` to give a fixed number of equal tracks, so that I can lay out an exhibition wall or an editorial spread with deliberate empty tracks.
12. As an application developer, I want to place a cell on a tracks grid with `start` and `span` on a child directive, typed `'1'` to `'12'`, so that a placement is checked at compile time.
13. As an application developer, I want a cell with no placement to need no directive, so that a plain grid of cards carries no extra attributes.
14. As an application developer, I want `threshold` to set the grid's own width below which every placed cell takes the whole row in source order, so that a wall reads as a column in a narrow pane.
15. As an application developer, I want the fold and the threshold to follow the grid's own width, not the screen's, so that a grid in a sidebar behaves by the sidebar's width.
16. As an application developer, I want a `start` on a child that is an `ol` to place it and leave its numbering alone, so that a numbered list used as a cell keeps counting from one.
17. As an application developer, I want the grid's item file loaded when the first grid renders, so that I do not import `grid.css` globally.
18. As an application developer, I want the item file removed after the last grid leaves the page, so that a route without a grid carries none of its CSS.
19. As an application developer, I want the item file in the server HTML when a server-rendered page has a grid, so that the first paint already has the columns.
20. As an application developer, I want the layout correct with JavaScript off under SSR and prerendering, so that a catalogue page is usable before any script runs.
21. As an application developer, I want hydration to change nothing on a grid or its cells, so that I get no `NG05xx` error and no layout shift.
22. As an application developer, I want the grid to work under zoneless change detection, including any input bound from a signal, so that the package fits Angular's recommended mode.
23. As an application developer, I want a grid inside a `@defer (hydrate on ...)` block to keep its layout before and after the block hydrates, so that incremental hydration does not collapse the columns.
24. As an application developer, I want a grid inside a `hydrate never` block to keep its styles for as long as it is on the page, so that a dehydrated catalogue is not unstyled when a live grid elsewhere leaves.
25. As an application developer, I want to know that a grid inside a client-only `@defer` block needs `grid` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
26. As an application developer using `withI18nSupport()`, I want translated cells to hydrate without being re-rendered, so that localised pages keep the server's DOM.
27. As an application developer, I want cells rendered with `@for` to be the grid's children with no wrapper, so that the grid sees each cell.
28. As an application developer, I want to put `yetiBox` or `yetiCard` on the cells beside `yetiGridChild`, so that I can compose items as Yeti's example does.
29. As an application developer, I want to know that `yetiGridChild` works only on direct children, and that a component's host element is the child, so that I put `start` and `span` on the right element.
30. As an application developer, I want the usage rules for the combinations Yeti refuses stated in the JSDoc, so that I do not write a fold on a tracks grid or a span past the last track.
31. As an application developer, I want to set the default minimum and gap through Yeti's public tokens, so that my theme controls them.
32. As an application developer, I want the package to offer no input per token, so that the grid's API stays the size of Yeti's contract.
33. As an application developer, I want my own classes and attributes on the grid and its cells to be kept, so that I can style the list beside the directive.
34. As an application developer, I want template references (`#g="yetiGrid"`, `#c="yetiGridChild"`), so that the grid follows the package's `exportAs` rule.
35. As an application developer, I want to import both directives from `ngx-yeti/grid`, so that a `@defer` block can split them with the rest of the item.
36. As an application developer using Tailwind v4 beside the package, I want to know that Tailwind also generates `.grid`, and that it changes nothing visible, so that I can plan my layer statement.
37. As a screen-reader user, I want the grid to add no role, so that a list of cards is announced as the list the author wrote, with its item count.
38. As a screen-reader user, I want cells in source order, including on a tracks grid, so that what I hear matches the visual order.
39. As a keyboard user, I want the grid to add no tab stop and no arrow-key handling, so that focus moves through the cells' own controls in source order.
40. As a low-vision user, I want the grid to reflow to one column at 320 CSS pixels with no horizontal scrolling, so that I can read every cell at high zoom.
41. As a low-vision user who zooms text, I want the column count to fall as the text grows, so that cells are never squeezed below their minimum.
42. As a low-vision user who overrides text spacing, I want cells to grow with their content, so that my spacing settings do not clip text.
43. As a package maintainer, I want the contract check to cover the class, all seven attributes, and both markers, so that a pin move that adds or renames one fails before release.
44. As a package maintainer, I want the SSR smoke to assert the server HTML of a grid, a placed child, the removed `start`, and the item link, so that the first paint is proven.
45. As a package maintainer, I want the fixture app to render a grid in a prerendered route and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
46. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default does not fail a test for no reason.
47. As a package maintainer, I want the class names checked against Yeti's typings at the pin, so that a future Yeti type named `YetiGrid` is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/layouts/grid/manifest.json`, `grid.css`, `docs.md`, and `example.html`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `grid`, `layout`, `Grids and Rows` |
| `class` | `grid` |
| `attributes` | `data-min` (vocabulary `width-or-none`: `none`, `2xs` to `2xl`, default `xs`), "The narrowest a column may be."; `data-columns` (vocabulary `columns`: `1` to `6`), "The most columns allowed."; `data-gap` (vocabulary `gap`, 29 values, default `md`); `data-rows` (vocabulary `rows`: `2` to `6`), "how many rows each child spans, one per part"; `data-fold` (boolean), "Halve the column count as the grid narrows ... Needs data-columns 2, 4, or 6"; `data-tracks` (vocabulary `tracks`: `2` to `12`), "Replaces the fitted columns ... does not mix with data-fold"; `data-threshold` (vocabulary `width`, default `md`), "With data-tracks: the grid's own width below which every child takes the whole row" |
| `classes` | empty |
| `children` | `> *` (min 1): "The cells. All are the same width, except in a tracks grid" |
| `markers` | `data-start` (vocabulary `start`: `1` to `12`, on `> *`): "In a tracks grid, the column line the child begins on"; `data-span` (vocabulary `span`: `1` to `12`, on `> *`): "In a tracks grid, how many tracks the child covers" |
| `tokens` | public: `--yeti-width-xs`, `--yeti-space-md`; private: `--_yeti-gap`, `--_yeti-min`, `--_yeti-column-cap` |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "Purely visual. Use a list when the cells are a list of like things." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: "grid auto-fit", "min() and max() inside minmax()"; `guarded`: empty |
| `since` | `7.0.0` |

The rules, in `@layer yeti.layouts`: `.grid` is a grid with `gap: var(--_yeti-gap)` and the fitted track list above. `:not([data-gap])`, `:not([data-min])`, and `:not([data-columns])` set the private defaults; `[data-min="none"]:not([data-columns])` sets the cap to `100%`, a single column. A folded grid (`[data-fold]:not([data-tracks])`) is an inline-size container with twelve tracks, and container queries set each child's span at thresholds that are count times the width token's default, written as literal `rem` values "because a container condition cannot read a token" (24 queries, `xs` to `2xl`). A tracks grid (`[data-tracks]`) is an inline-size container with `repeat(var(--_yeti-tracks), minmax(0, 1fr))`; `> [data-start]` sets `grid-column-start` and `> [data-span]` sets `grid-column-end: span`; seven container queries, also literal `rem`, put every child at `grid-column: 1 / -1` below the threshold. `[data-rows] > *` makes each child a subgrid spanning `--_yeti-rows` rows. `.grid > *` zeroes margins. The value rules that set `--_yeti-min`, `--_yeti-column-cap`, `--_yeti-gap`, `--_yeti-tracks`, `--_yeti-start`, `--_yeti-span`, and `--_yeti-rows` are in the **Always-loaded group** (`Y/src/layouts/attributes.css:5-13`, `:192-199`, `:230-235`, `:263-308`), not in the item file. Yeti's validator refuses a fold without `data-columns` 2, 4, or 6, a fold on a tracks grid, and a `data-start` or `data-start` plus `data-span` past the last track (`Y/bin/validate.js:79-99`).

Attributes left to the consumer: none (ticket 26 rows 31 to 39). `role="list"` on a list host is the consumer's, as building-blocks 1.1 and ticket 26 leave it.

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `grid` | static host class on `[yetiGrid]` (`YetiGrid`) | always present | ADR 0003 point 1; Part 2 row 9 |
| Attribute `data-min` | the narrowest cell | input `min` on `yetiGrid`: `YetiWidthOrNone \| undefined`, bound `[attr.data-min]` | unset renders nothing (Yeti's `xs` applies); `min` is an HTML attribute name, kind `inert` on the grid's hosts | ticket 26 row 31 (R); ADR 0070 rule 1; building-blocks 1.4 |
| Attribute `data-columns` | the most columns | input `columns`: `YetiColumns \| undefined`, bound `[attr.data-columns]` | unset renders nothing (no cap) | ticket 26 row 32 (R) |
| Attribute `data-gap` | space between cells | input `gap`: `YetiGap \| undefined`, bound `[attr.data-gap]` | unset renders nothing (Yeti's `md` applies) | ticket 26 row 33 (R) |
| Attribute `data-rows` | rows per child, one per part | input `rows`: `YetiRows \| undefined`, bound `[attr.data-rows]` | unset renders nothing; `rows` is an HTML attribute name, kind `inert` on the grid's hosts | ticket 26 row 34 (R); building-blocks 1.4 |
| Attribute `data-fold` | halving count | input `fold`: `boolean` with `booleanAttribute`, bound `[attr.data-fold]` as `''` when true and `null` when false | default `false`, renders nothing | ticket 26 row 35 (R) |
| Attribute `data-tracks` | fixed track count | input `tracks`: `YetiTracks \| undefined`, bound `[attr.data-tracks]` | unset renders nothing (fitted mode) | ticket 26 row 36 (R) |
| Attribute `data-threshold` | width below which a tracks grid is one column | input `threshold`: `YetiWidth \| undefined`, bound `[attr.data-threshold]` | unset renders nothing (Yeti's `md` applies) | ticket 26 row 37 (R) |
| Marker `data-start` | the column line a child begins on | input `start` on `yetiGridChild`: `YetiStart \| undefined`, bound `[attr.data-start]`; plus `'[attr.start]': 'null'` | unset renders nothing; `start` kind `removed` | ticket 26 row 38 (C); building-blocks 1.4; ADR 0070 consequences |
| Marker `data-span` | how many tracks a child covers | input `span` on `yetiGridChild`: `YetiSpan \| undefined`, bound `[attr.data-span]` | unset renders nothing (one track); `span` kind `inert` | ticket 26 row 39 (C) |
| Children | `> *`, the cells | a cell with no marker needs no directive | not applicable | ticket 26 grilling Q6 |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Token `--yeti-width-xs` | default minimum cell width | the consumer's; the package writes none | not applicable | ADR 0004 |
| Token `--yeti-space-md` | default gap | the consumer's | not applicable | ADR 0004 |
| Tokens `--_yeti-gap`, `--_yeti-min`, `--_yeti-column-cap` (and the unlisted `--_yeti-tracks`, `--_yeti-start`, `--_yeti-span`, `--_yeti-rows`) | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-grid=""` on `[yetiGrid]` only | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2; ticket 50 decision 6 |

The presentational-attribute kinds (building-blocks 1.4), confirmed for this item's hosts:

- `min` and `rows` on `yetiGrid`: `inert`. HTML's `min` means something only on `input`, `meter`, and `progress`, and `rows` only on `textarea`; none of them can hold the grid's element children, so a static `min="2xs"` stays on the host beside `data-min="2xs"` and does nothing (ticket 26 rows 31 and 34, grilling Q15). The grid's hosts are `ul`, `ol`, `div`, `section`, and the like.
- `span` on `yetiGridChild`: `inert`. HTML's `span` means something only on `col` and `colgroup`, which cannot be a grid's child (ticket 26 row 39).
- `start` on `yetiGridChild`: `removed`. HTML's `start` sets an `ol`'s first number, and a grid cell may be an `ol` (a numbered step list as one cell), so the directive binds `'[attr.start]': 'null'` with a source comment naming the effect it prevents: the input's static form renumbering the list (ticket 26 row 38). The binding is unconditional: on any other element `start` means nothing, so removing it changes nothing. The consumer may write `start` statically: hydration writes the static value back and the `null` binding removes it in the same pass, so the final DOM equals the server's (ticket 50 decision 9). A consumer who wants an `ol` cell to count from another number writes `value` on its first `li` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 51).

**Module replaced:** none. Yeti's `grid` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 9, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads two public tokens, `--yeti-width-xs` (the default minimum) and `--yeti-space-md` (the default gap), and through the always-loaded value rules the width and space token named by any `min` or `gap` value. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block, in a **Theme** file after Yeti, or with a runtime `setProperty`; neither is a hue, chroma, or scale input, so either also takes effect on one grid element (`Y/src/guides/theming.md:38`). Changing a width token moves the fitted minimum but not the fold's or the threshold's container queries, whose limits are literal (`grid.css`; `docs.md`: "a theme that changes the token moves the token, not the fold"). **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- `YetiGrid` provides `yetiGridToken` (`InjectionToken<YetiGrid>`, `useExisting`), building-blocks 1.9 and 1.3's token naming.
- `YetiGridChild` injects it with `{ optional: true, skipSelf: true }` ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) kind C). It reads nothing from it in the first milestone: no behaviour depends on the parent, and the **In-item check** that would use it (a placement past the last track, a placement on a grid without `tracks`) belongs to a later milestone (map, Milestones). A child outside a grid, or in a fitted grid, renders its markers and nothing else happens, because Yeti's rules are `.grid[data-tracks] > [data-start]` and `> [data-span]`.
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"). A consumer composes by writing directives beside each other: `yetiBox` or `yetiCard` on a cell beside `yetiGridChild`, as Yeti's example puts `box` on each `li`. The grid's inputs share their types with every other reader of the vocabulary (`min` with `masonry`, `columns` with `columns` and `masonry`, `threshold` with `columns`, `cluster`, and the rest, `span` with the `columns` and `hero` children), so no two package directives on one element declare one input name with different types (building-blocks 1.4, shared vocabularies).
- The only other injection is the root styles service of ADR 0060, reached by `injectYetiItemStyles('grid')` from `ngx-yeti/styles` as the last statement of the constructor ([setup](setup.md); ticket 50 decisions 42 and 45), through which `YetiGrid` acquires and releases the item file. That service is the [setup](setup.md) spec's and ADR 0060's. `YetiGridChild` sets no presence attribute and acquires nothing, because Yeti's rules for it apply only under a `.grid`, whose own host keeps the link (ticket 50 decision 6).
- Generated ids and the platform's relationship attributes: none. The grid renders no `id` and references none, so it does not use [generated-ids](generated-ids.md).

### 4. API

| Member | `YetiGrid` | `YetiGridChild` |
| --- | --- | --- |
| Class name | checked at the Pin: `yeti.d.ts` exports 46 names and neither is among them, so each takes `Yeti`, not `NgxYeti` (ADR 0080 point 4) | as left |
| Selector | `[yetiGrid]` | `[yetiGridChild]` |
| `exportAs` | `yetiGrid` | `yetiGridChild` |
| Entry point | `ngx-yeti/grid` (building-blocks 1.3; ADR 0011 clause 10) | same |
| Inputs | `min: YetiWidthOrNone \| undefined` (Yeti default `xs`); `columns: YetiColumns \| undefined`; `gap: YetiGap \| undefined` (Yeti default `md`); `rows: YetiRows \| undefined`; `fold: boolean`, `booleanAttribute`, default `false`; `tracks: YetiTracks \| undefined`; `threshold: YetiWidth \| undefined` (Yeti default `md`) | `start: YetiStart \| undefined`; `span: YetiSpan \| undefined` |
| Host | static `class: 'grid'`; static `data-ngx-yeti-item-grid: ''`; `[attr.data-min]`, `[attr.data-columns]`, `[attr.data-gap]`, `[attr.data-rows]`, `[attr.data-tracks]`, `[attr.data-threshold]` from the inputs, `null` when unset; `[attr.data-fold]`: `''` when `fold()` is true, else `null` | `[attr.data-start]` and `[attr.data-span]` from the inputs, `null` when unset; `'[attr.start]': 'null'` |
| Providers | `yetiGridToken` | none |
| Models, outputs, methods | none | none |
| Lifecycle | acquires the `grid` item file, on the server too, with `injectYetiItemStyles('grid')` as the last statement of its constructor (ticket 50 decisions 42 and 45) and releases it through `DestroyRef` (ADR 0060 point 2; building-blocks 1.9) | none |

Types come from the generated `yeti-types.ts` copy of Yeti's typings at the pin, re-exported by name (ADR 0060 point 10; building-blocks 1.3). The numeric vocabularies are string unions, so `columns="3"` and `[span]="'6'"` compile and `[span]="6"` does not (ADR 0070 rule 2). The selectors are the ones Part 2 row 9 names; this spec fixes them, as ticket 26 left child selectors to the specs.

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiGrid` on the element that holds the cells, with at least one child (manifest `children`, `> *` min 1). When the cells are a list of like things, use a `ul` or `ol` with `role="list"`, as Yeti's example and manifest note do; the role is the consumer's.
2. Put `yetiGridChild` on direct children of the grid element, and only on a cell that needs `start` or `span`. Yeti's selectors are child selectors, so a marker on a grandchild does nothing. A component's host element is the child: write `<app-work yetiGridChild start="2">`. `@if`, `@for`, and `ng-container` add no element and need no care.
3. Use `start` and `span` only in a grid with `tracks`; in a fitted grid they do nothing. Keep each placement inside the tracks: `start` at most `tracks`, and `start` plus `span` minus one at most `tracks` (`Y/bin/validate.js:88-99`). A line past the last track makes an implicit track, not an error.
4. Use `fold` only with `columns` set to `'2'`, `'4'`, or `'6'`, never with `tracks`, and not with `min="none"`, because the fold needs a width per column (manifest; `Y/bin/validate.js:79-87`).
5. Pair `min="none"` with `columns`; alone it gives a single full-width column (manifest `data-min`).
6. With `tracks`, leave `min` and `columns` unset; they have no effect on a tracks grid (manifest `data-tracks`). `threshold` has an effect only with `tracks`.
7. With `rows`, give the number of parts of the fullest cell; a cell with fewer leaves its last rows empty, and a cell that spans rows cannot also be a size container (`docs.md`).
8. Do not write `class="grid"`, any of the grid's `data-*` attributes or markers, or `data-ngx-yeti-item-grid` statically. The directives bind them, and hydration writes a static attribute again before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"; ADR 0070 consequences). A value newer than the pin goes through `[columns]="$any('7')"` (ADR 0070).
9. On a child that is an `ol`, `start` places the cell and never sets the list's first number; set that with `value` on the first `li` (section 2; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 51). Writing `start` statically is allowed (ticket 50 decision 9).
10. Bind every input from values that are the same on the server and the client, never from a browser-only read such as the window's width. The grid already responds to its own width through Yeti's CSS (building-blocks 1.7), and the hydration constraints require the same DOM on both sides.
11. Import every directive class the template writes. A **Forgotten import** of `YetiGridChild` with static `start` and `span` renders an unplaced cell, and one of `YetiGrid` with static inputs renders a plain list, both with no error; only a bound input (`[columns]`, `[span]`) makes the compiler report it (NG8002) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `grid` | Nearest in Angular Material |
| --- | --- | --- |
| Shape | an item directive on the consumer's list or `div`, plus a child directive on a placed cell | `mat-grid-list` with `mat-grid-tile` children, both components (`NC/src/material/grid-list/grid-list.ts:40`, `grid-tile.ts:25`) |
| Column count | fitted by width in CSS (`min`, `columns`, `fold`), or fixed tracks | fixed `cols` (`grid-list.ts:85-87`); positions computed in TypeScript by a tile coordinator (`tile-coordinator.ts`) |
| Placement | `start` and `span` on a tracks grid, CSS only | `colspan` and `rowspan` on the tile, reflected as `[attr.colspan]` and `[attr.rowspan]` (`grid-tile.ts:29-32`) |
| Spacing | `gap` from Yeti's vocabulary | `gutterSize` as a CSS length string (`grid-list.ts:95-101`) |
| Styling | Yeti's item file, loaded per item; tokens in the consumer's stylesheet | component styles and Sass theming |
| Accessibility | none of its own; the consumer's list semantics | none of its own |

Two things carry over from Material. Its tile reflects `colspan` as an attribute on an element where HTML gives it no meaning, which is the `inert` kind this spec confirms for `span`. And Material has no fitted mode, so nothing else applies: `mat-grid-list` places tiles it owns in rows of a fixed height, while the grid lays out the consumer's own content at its natural height. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one. Angular Aria's `ngGrid` (`NC/src/aria/grid/grid.ts:55`) is the APG grid composite, a focusable two-dimensional widget with `role="grid"`, not a layout, and is not used (Part 2 row 9).

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 9; building-blocks 1.2). The reason, row 1's, which row 9 takes: Yeti's CSS does the whole job; the directives add the class, the typed attributes and markers, the item-file acquisition, and `exportAs`. CSS grid with `auto-fit`, `min()` and `max()` inside `minmax()`, container queries, and subgrid are all inside Baseline 2025 (building-blocks 1.2; [Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md), whose table puts container queries at newly available 2023-02-14 and subgrid at 2023-09-15). No Aria pattern applies (the layout has no role), and no CDK piece is used: there is no id, focus, keyboard, observer, or direction read (Yeti's tracks follow the writing direction by themselves).

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The grid adds no role, state, or property, and no tab stop. In particular it is not the APG grid pattern, which is an interactive composite with arrow-key navigation; a layout grid of cards must not take `role="grid"`.
- **Keyboard:** none.
- **Names:** none. A `ul` or `ol` with `role="list"` keeps list semantics, including in WebKit, where the role restores what `list-style: none` removes (`Y/src/base/reset.css:83-86`; [Research: Yeti against WHATWG, WAI-ARIA, the APG, and Angular Aria, CDK, and Material patterns](../issues/17-research-yeti-accessibility-and-standards.md), read). Without the role the list keeps its bullets and prose padding (`Y/src/base/prose.css:26-28`).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The grid's elements are the consumer's; the directives add no role. A list of like things is a list (usage rule 1; manifest `a11y.notes`). |
| 1.3.2 Meaningful Sequence | The grid places cells only. In fitted and folded mode cells flow in source order. In tracks mode `grid.css` sets only column lines, with no row placement and no `grid-auto-flow: dense`, so auto-placement keeps source order across rows (read in `grid.css`; that the placement algorithm never moves a later cell before an earlier one is inferred from CSS Grid's sparse placement, not measured), and below the threshold every cell takes a row in source order. Ticket 17 read the grid among the layouts whose reading order equals source order. Layer 1 asserts that the accessibility tree order equals the DOM order. |
| 1.4.3 Contrast (Minimum) | The grid renders no text and sets no colour. Text inside cells is the consumer's or another item's (`box` surfaces in Yeti's example); the **Story gate** runs axe on it. No ledger row names the grid, and ticket 17's summary lists no finding for the grid's example (axe left `color-contrast` incomplete on five other items, not the grid). |
| 1.4.4 Resize Text | The minimum widths and the fold and threshold limits are in `rem`, so zoomed text lowers the column count and moves a tracks grid to one column sooner (read, not measured). |
| 1.4.10 Reflow | The fitted track minimum is `min(..., 100%)`, so one cell never exceeds the container, and a tracks grid below its threshold is one column. Layer 4 asserts no horizontal overflow at a 320 px viewport for the default, folded, and tracks stories. `min="none"` with a high `columns`, and a tracks grid with `threshold="2xs"`, keep several narrow columns at 320 px by the consumer's choice; content wider than its cell is the consumer's. |
| 1.4.12 Text Spacing | The rules set no height and no overflow on cells; overridden spacing grows the rows, and with `rows` the subgrid rows grow together (read). |
| 2.4.3 Focus Order | Focusable content keeps DOM order (1.3.2 above). |

**Ledger rows owned:** none (Part 2 row 9). No new ledger row: the grid adds no feature Yeti lacks.

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<ul yetiGrid min="2xs" columns="3" role="list">
  @for (item of items(); track item.id) {
    <li yetiBox surface="raised" border>{{ item.name }}</li>
  }
</ul>
```

and a tracks grid, after Yeti's docs:

```html
<div yetiGrid tracks="12" threshold="md">
  <figure yetiGridChild start="2" span="6">The first work</figure>
  <figure yetiGridChild start="9" span="4">The second work</figure>
</div>
```

Server HTML and the hydrated DOM are the same. The list carries `yetigrid=""`, `min="2xs"` (inert), `columns="3"`, `role="list"`, `class="grid"`, `data-ngx-yeti-item-grid=""`, `data-min="2xs"`, and `data-columns="3"`, and no `data-gap`, `data-rows`, `data-fold`, `data-tracks`, or `data-threshold`, because those inputs are unset. Each `li` carries the box's own class and attributes. The tracks grid carries `data-tracks="12"` and `data-threshold="md"`. Each figure carries `yetigridchild=""`, `span="6"` (inert), `data-start="2"`, and `data-span="6"`, and no `start` attribute (removed).

The server also writes one item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>layouts/grid/grid.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="grid"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts that link at bootstrap. The grid has no open or closed state.

The delta from Yeti's docs markup: the consumer writes `yetiGrid` where the docs write `class="grid"`, the input names where they write each `data-*` attribute, and `yetiGridChild start span` where they write `data-start` and `data-span`.

### 9. Animation

None. The grid has no state and no transition, and Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). A consumer may remove a grid with a class-form `animate.leave`; the item link stays until Angular removes the host, because removal waits for the DOM (ADR 0060 point 4). A grid that is server-rendered never takes `animate.enter` (ADR 0011 clause 12). Changing an input at run time, or a cell entering through `@for`, moves the layout at once, as Yeti's CSS has it; a consumer who wants a cell to arrive animated uses the `enter` utility on the cell.

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes and markers, and the item link in `<head>` (section 8). Everything at first paint is a host binding (ADR 0011 clause 1). Nothing is **Pre-hydration state**: no person and no Yeti module can change a `data-*` attribute (ticket 26 grilling Q12). The fold's and the threshold's container queries are CSS and apply before any script.
- **Before hydration:** the directives create no node, read no layout, start no timer or observer, and touch no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is `YetiGrid`'s item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** every element is claimed as is; bindings computed from the same inputs give the same values (usage rule 10); 0 style mutations (ADR 0060 point 5, measured for the mechanism).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the grid and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism). A grid and its placed children share one **Hydration boundary** by construction, because `yetiGridChild` must sit on direct children (usage rule 2); a deferred block inside a grid makes its own wrapper element the cell, unless the block's content is the cell itself.
- **`hydrate never`:** the grid is its server HTML and stays styled while its host is connected, whatever live grids do (ADR 0060 point 4; ADR 0045). There is no Angular behaviour to lose; a bound input simply never changes.
- **Client-only `@defer`:** the item file is fetched when `YetiGrid` is constructed, which can show unstyled frames; the consumer closes the gap with `provideYetiStyles({ preload: ['grid'] })` (ADR 0060 point 6; [setup](setup.md)). No entry animation needs the file.
- **Event replay:** the directives declare no listener, so nothing replays and no `jsaction` is added by them.
- **`withI18nSupport()`:** cell text is translated with `i18n` in the consumer's component. The directives add no `i18n` block; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** inputs are signals and host bindings read them, so any bound input refreshes with no zone (map, Standing rulings, item 43; ADR 0070 rule 4).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the cells are laid out in their columns, folded, placed, or row-aligned, because the attributes and the item link are in the server HTML. Nothing is lost: the grid has no behaviour. A client-only application gets no such promise.

### 11. Hydration constraints

The grid complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; every `data-*` attribute comes from an input whose value usage rule 10 keeps equal on both sides; `[attr.start]` is always `null`.
- **No direct DOM manipulation:** the directives write nothing to the DOM outside host bindings. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directives change no element. The consumer's markup must be valid as written; for example the cells of a `ul` grid are `li` elements, never a `div` directly in the `ul`, and a `@for` inside a `ul` renders `li`.
- **`preserveWhitespaces`:** the directives have no template. The grid ignores whitespace text between cells.
- **No output branched on the platform:** none.
- **Static attributes the directives bind:** usage rule 8 keeps the consumer from writing the `data-*` attributes. The static forms of `min`, `rows`, and `span` are the inputs' own and stay on the element unchanged on both sides (`inert`). The static form of `start` is the one static attribute a directive also binds (to `null`); hydration writes it back and the binding removes it again in the same pass, so the final DOM equals the server's. This form is allowed by ticket 50 decision 9, and layer 4 asserts that no frame paints with `start` present.

### 12. Single-page application

None. The grid has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). On a route change, a route's grids leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-grid]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders a grid again re-inserts it.

### 13. Item file

`yeti-css/css/layouts/grid/grid.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiGrid]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:25`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-grid` has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds every grid value rule), and optionally `provideYetiStyles({ preload: ['grid'] })`. The grid adds nothing to it. Cross-item files acquired: none. `grid.css` has no rule for another item (ADR 0060 point 9). The card's rule for a card in a row-aligned grid (`.grid[data-rows] > .card`, `Y/src/components/card/card.css:99-114`) is in `card.css`, which the card's own directive loads.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class, attributes, and markers in the DOM, the item link, the column count and where cells land, and the reading order. It never asserts a private field, the parent token's value, or how the styles service counts. No test depends on a public token's default value ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): where a test needs a width or a gap, it reads the token's computed value in the same page, as Yeti's own `test/browser/layouts/grid.spec.js` does (`expected(width, min, gap)` from `--yeti-width-xs` and `--yeti-space-md`). The fold and threshold cases use container widths clear of the literal limits in `grid.css` at the pin, which are CSS, not token defaults; a pin move that changes them fails those cases, as it should. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `grid` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). No contrast assertion: the grid owns no ledger row and renders no text of its own. Story ids:

- `grid--default`: Yeti's example (a `ul` with `role="list"`, `min="2xs"`, `columns="3"`, five `box` cells). Asserts `class="grid"` and `data-ngx-yeti-item-grid` on the list, `data-min="2xs"` and `data-columns="3"`, no `data-gap`, and no `tabindex` or role added by the package. Asserts the list still exposes role `list` with five items and has no inline padding, as Yeti's own test does. Asserts at most three cells per row. Asserts the accessibility tree order equals the DOM order.
- `grid--settings`: every `YetiGrid` input bound from a Storybook control. Asserts each attribute follows its control, that clearing a control removes the attribute, and that toggling `fold` adds and removes `data-fold`.
- `grid--exact-count`: `min="none"` with `columns="4"`, and `min="none"` alone. Asserts four cells per row at a narrow and a wide container, and one column without `columns`.
- `grid--fold`: `fold`, `columns="4"`, default `min`, in a container resized across the fold's limits. Asserts four, two, and one cells per row and never three.
- `grid--tracks`: Yeti's wall (`tracks="12"`, two children with `start` and `span`, one child with `span` only, one with neither), in a container above and below the threshold. Asserts each placed child's first column line and width in tracks, that track 1 and track 8 stay empty, and that below the threshold every child spans the row in source order with the accessibility tree order unchanged.
- `grid--rows`: three cells of three parts each (a picture, a heading, a footer) with `rows="3"`, one cell with a longer heading. Asserts that every cell's footer starts at the same block offset.

### Layer 2: browser-level (`npx nx test <lib>`, `grid.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiGrid, { tagName: 'ul' })`: the host has class `grid` and `data-ngx-yeti-item-grid`, and none of the seven `data-*` attributes; with `bindings` setting each input (`min` `'none'`, `columns` `'4'`, `gap` `'sm-lg'`, `rows` `'3'`, `fold` `true`, `tracks` `'12'`, `threshold` `'lg'`), each attribute follows, and setting them back to `undefined` or `false` removes them.
- While a `YetiGrid` fixture lives, one `<link data-ngx-yeti-styles="grid">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- `createDirective(YetiGridChild, { tagName: 'figure' })`: no `data-start` or `data-span` by default; bound `start` `'2'` and `span` `'6'` render them; the host carries no presence attribute and acquires no link (ticket 50 decision 6).
- `createDirective(YetiGridChild, { tagName: 'ol' })` with `start` bound: the host has `data-start` and no `start` attribute.
- No directive adds a listener to its host.

A small test host covers what `createDirective` cannot: template references `#g="yetiGrid"` and `#c="yetiGridChild"` resolve; a static `fold` attribute sets the input through `booleanAttribute`; a static `min="2xs"` renders both `min="2xs"` and `data-min="2xs"` and a static `span="6"` both `span="6"` and `data-span="6"` (the `inert` kind); a static `start="2"` on an `ol` child renders `data-start="2"`, no `start` attribute, and the list's first marker as 1 (the `removed` kind); a child outside any grid renders its markers with no error; and the consumer's own `class` and `role` on each host are kept.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `grid.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture whose cells carry `i18n` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the list renders `class="grid"`, `data-ngx-yeti-item-grid`, and `data-columns="3"` from a bound input; a tracks grid renders `data-tracks="12"`; a child renders `data-start` and `data-span`; an `ol` child written with static `start="2"` renders no `start` attribute (building-blocks 1.4: the static form is written and the attribute asserted absent); `<head>` holds one item link with `data-ngx-yeti-styles="grid"`, `data-beasties-skip`, and an `href` ending `layouts/grid/grid.css?v=<pin>`; no element carries a `jsaction` from the package.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the grid through the contract mapping: class `grid` has `YetiGrid`; `data-min`, `data-columns`, `data-gap`, `data-rows`, `data-fold`, `data-tracks`, and `data-threshold` have inputs whose types are the manifest's vocabularies or `boolean`; `data-start` and `data-span` have inputs on `YetiGridChild`; the manifest's events for `grid` are empty. A pin move that adds an attribute or marker fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids: the column counts of Yeti's own `grid.spec.js` cases (fitted count at 1000 and 500 px from computed tokens, capped count at 1000 and 300 px, exact count at 300 and 1000 px, fold at 1100, 900, 700, and 400 px, tracks placement at 1000 px and one column at 400 px); at a 320 px viewport the default, fold, and tracks stories have no horizontal overflow (1.4.10).

Fixture-app half, built with `outputMode: 'server'`, with a `/grid` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences):

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- with JavaScript disabled the fitted, folded, and tracks grids land as in the Storybook half, and `@axe-core/playwright` with the six tags reports no violation;
- a grid inside a client-only `@defer` block with `grid` in the preload list shows no unstyled frame; a grid inside a `hydrate never` block stays styled after a live grid on the page is removed;
- an `ol` cell written with static `start="2"` and `span="6"`: no frame paints with a `start` attribute on it, from the first paint through hydration, and its first marker reads 1 (ticket 50 decision 9);
- navigating from the grid route to a route without one removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` for the default story and its `test/browser/layouts/grid.spec.js` and fixture for the geometry cases; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; ticket 24's prototype for the Tailwind case.

## Out of Scope

- An input per token, or a token for the fold's or the threshold's limits (ADR 0004; Yeti writes them as literals).
- A shared any-element `[yetiSpan]` or `[yetiStart]` directive (ADR 0070, considered options; ticket 26 grilling Q6).
- `start` or `span` inputs on `YetiGrid`, or `fold` on the child (ADR 0070 kinds R and C).
- Any check of the combinations Yeti's validator refuses, of placements past the last track, of markers on grandchildren, or of a grid with no child. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- A type that forbids `fold` without `columns` 2, 4, or 6, or `start` plus `span` past `tracks`; the inputs are typed by Yeti's vocabularies only (ADR 0005; ADR 0070 rule 2).
- `role="list"` or any other role written by the package (building-blocks 1.1; ticket 26).
- Angular Aria's `ngGrid` or any keyboard navigation between cells (Part 2 row 9).
- A viewport-keyed input or any JavaScript size read (building-blocks 1.7).
- Package CSS for the grid.
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiGrid]` with seven inputs; child directive `[yetiGridChild]` with `start` and `span` | building-blocks Part 2 row 9; ticket 26 rows 31 to 39 |
| `data-start` and `data-span` are kind C (they change a child) | ADR 0070; ticket 26 rows 38 and 39 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by Yeti's vocabulary types; `fold` with `booleanAttribute`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2; building-blocks 1.4 |
| `min`, `rows`, `span` are `inert`; `start` is `removed`, unconditionally | building-blocks 1.4; ticket 26 rows 31, 34, 38, 39 and grilling Q15; ADR 0070 consequences |
| Static `start` allowed; the `null` binding removes it in the hydration pass | ticket 50 decision 9 |
| An `ol` cell's numbering through `value` on its first `li` | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 51 |
| Child injects `yetiGridToken` optionally with `skipSelf` and reads nothing from it | ADR 0070 kind C; building-blocks 1.9 |
| Only the item directive marks its host and acquires the item file | ADR 0045; ticket 50 decision 6 |
| `exportAs` on both; class names with no collision | building-blocks 1.3; ADR 0080 points 3 and 4 |
| Entry point `ngx-yeti/grid` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only; Aria `Grid` not used | building-blocks 1.2; Part 2 row 9 |
| Tokens are the consumer's | ADR 0004 |
| Item file as a counted link; presence attribute `data-ngx-yeti-item-grid` | ADR 0060 points 2 to 6; ADR 0045 |
| `role="list"` is the consumer's | building-blocks 1.1; ticket 26 |
| Combination rules are usage rules, checked in a later milestone | map, Milestones |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A product list that never shows more than four across, with aligned card parts:

```html
<ul yetiGrid min="xs" columns="4" rows="3" gap="sm-lg" role="list">
  @for (product of products(); track product.id) {
    <li yetiCard>
      <img [ngSrc]="product.image" width="640" height="480" [alt]="product.alt" />
      <h3>{{ product.name }}</h3>
      <footer>{{ product.price }}</footer>
    </li>
  }
</ul>
```

```ts
import { NgOptimizedImage } from '@angular/common';
import { YetiCard } from 'ngx-yeti/card';
import { YetiGrid } from 'ngx-yeti/grid';

@Component({
  selector: 'app-products',
  imports: [NgOptimizedImage, YetiCard, YetiGrid],
  templateUrl: './products.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Products {
  readonly products = input.required<readonly Product[]>();
}
```

A folded wall of six that steps 6, 3, 1: `<div yetiGrid min="sm" columns="6" fold>`.

An exhibition wall with an empty first track, which reads as a column below `lg`:

```html
<div yetiGrid tracks="12" threshold="lg">
  <figure yetiGridChild start="2" span="6">...</figure>
  <figure yetiGridChild start="9" [span]="wide() ? '4' : '3'">...</figure>
</div>
```

A smaller default minimum for one catalogue, in the consumer's stylesheet after Yeti:

```css
.catalogue {
  --yeti-width-xs: 12rem;
}
```

A page whose grid renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['grid'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `layouts/grid/grid.css`, loaded by `YetiGrid` as a counted link (section 13). The consumer writes nothing for the grid beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps every `data-min`, `data-columns`, `data-gap`, `data-tracks`, `data-start`, `data-span`, and `data-rows` value to its private token (section 1); `tokens/space.css` declares the width and space tokens; `base/reset.css` removes a `role="list"` list's markers and padding.
3. **Cross-item rules:** none in `grid.css`. `card.css` holds the card's rule for a row-aligned grid and turns off the card's own container there, loaded by the card's directive. Items placed in cells keep their own rules; `.grid > *` zeroes their outer margins, as every gap-based layout does.
4. **Tokens:** reads two public tokens, writes none (section 2).
5. **What breaks without the item file:** cells stack at full width in normal flow with their own margins, placements, folds, and row alignment do nothing, and nothing errors.
6. **Tailwind name collision:** yes, `grid`. Tailwind v4 generates `.grid { display: grid; }` when its scanner finds the word in the consumer's sources; ticket 24 measured it from Yeti markup in a template. With the package the class comes from the directive, so whether Tailwind generates the rule depends on the consumer's other sources (inferred). Measured in ticket 24's prototype in three engines: Tailwind's rule sets the same `display` Yeti does, and the grid's columns matched Yeti alone in every layer order ([Prototype: the package beside Tailwind v4 in one Angular application](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md); `prototypes/yeti-tailwind/results/collisions.json`). So no `@source not inline(...)` line is needed for it, unlike `container`; the consumer still uses the shared layer statement of ADR 0060 point 7. None of the grid's attributes or markers collided.

### Platform features to adopt when the browser target moves

None. Every feature `grid.css` uses is inside Baseline 2025 (building-blocks 1.2): `auto-fit` and `min()` and `max()` inside `minmax()`, which the manifest lists as unguarded, and container queries and subgrid, which it does not list (`grid.css` declares `container-type: inline-size` for the fold and tracks modes and `grid-template-rows: subgrid` for `data-rows`; the research's table counts the grid among the users of both). [upstream-bugs.md](../upstream-bugs.md) row Y8 records the omission (verified *read*, no minimal reproduction, not filed), and the package does nothing either way ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 52).

### Single-page-application pieces relied on

None: the grid uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
