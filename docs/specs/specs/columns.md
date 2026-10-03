# Spec: columns (layout)

Ticket: [55. Spec: columns (layout)](../issues/55-spec-columns.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 5 and Part 1, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 19 to 24, [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at 22.2.x. The points no record settled are decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 6, 9, and 33).

## Problem Statement

Yeti's `columns` layout is for "a set of equals: pricing tiers, feature summaries, a row of statistics" that sit side by side when there is room and one under another when there is not, where "the container, not the screen, should decide which" (`Y/src/layouts/columns/docs.md`). It is one **Identity class**, `columns`, on a parent element, five attributes (`data-threshold`, `data-gap`, `data-align`, `data-justify`, `data-columns`), and one **Marker**, `data-span`, on a child that takes several shares of a row. Every direct child is a column. It has no **Module** and no events (`Y/src/layouts/columns/manifest.json`).

An application developer using the package cannot write `class="columns"` or any of those `data-*` attributes: a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). Written by hand, `data-columns="7"` or `data-threshold="medium"` compiles and silently falls back to Yeti's default. The developer also needs the `columns` **Item file** loaded while a columns layout is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)); without it the children stack as plain blocks at every width, with no error.

Two more things make the item more than a class. The `data-span` marker only works on a direct child of a `.columns` element (`.columns > [data-span]` in `columns.css`), so the package needs a second directive for that child role ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) kind C). And the natural class name, `YetiColumns`, is already the name of Yeti's `columns` vocabulary type in `yeti.d.ts`, so the class needs another name ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 4).

## Solution

Two directives in the secondary entry point `ngx-yeti/columns` ([building-blocks.md](../building-blocks.md) Part 2 row 5; 1.3):

- The **Item directive** `NgxYetiColumns`, selector `[yetiColumns]`, `exportAs: 'yetiColumns'`. It binds `columns` as a static host class, binds `data-threshold`, `data-gap`, `data-align`, `data-justify`, and `data-columns` from the typed inputs `threshold`, `gap`, `align`, `justify`, and `columns`, sets its presence attribute `data-ngx-yeti-item-columns` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), and acquires the `columns` item file when it is created, on the server too, and releases it when it is destroyed (ADR 0060 point 2). It provides `yetiColumnsToken`.
- The **Part directive** for a column, `YetiColumnsChild`, selector `[yetiColumnsChild]`, `exportAs: 'yetiColumnsChild'`. It binds `data-span` from the typed input `span`. It binds no class, because a column has none in Yeti's markup. A column without a span needs no directive (ticket 26, grilling question 6).

The developer writes `<div yetiColumns threshold="sm" columns="2">` where Yeti's docs write `<div class="columns" data-threshold="sm" data-columns="2">`, and `<article yetiColumnsChild span="2">` where the docs write `<article data-span="2">`. An unset input renders no attribute, so Yeti's own default applies from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1). Both directives are **types only** in building-blocks' sense: no listener, no render callback, no service, and no DI beyond the child's optional parent token.

Everything else is Yeti's CSS and the platform. The switch between columns and rows is flex-basis arithmetic against the container's width, so it is right on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block.

## User Stories

1. As an application developer, I want to lay out a set of equals with one directive attribute, so that I never write Yeti's `columns` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="columns"` and `data-*` attributes, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want to set the switching width with a `threshold` input typed by Yeti's `width` vocabulary, so that a typo such as `threshold="medium"` fails to compile.
4. As an application developer, I want to set the gutter with a `gap` input typed by Yeti's `gap` vocabulary, fluid pairs included, so that I use the same gap values as every other layout.
5. As an application developer, I want to set vertical alignment with an `align` input and row distribution with a `justify` input, typed by Yeti's vocabularies, so that I can align columns of different heights.
6. As an application developer, I want to cap how many columns share a row with a `columns` input typed `'1'` to `'6'`, so that `columns="3"` compiles and `columns="7"` does not.
7. As an application developer, I want a static attribute such as `columns="3"` to type-check, so that I need no property binding for a constant.
8. As an application developer, I want an input I leave unset to render no attribute, so that Yeti's own default applies and the server HTML stays Yeti's minimal markup.
9. As an application developer, I want to change a bound input at run time and see the layout follow, so that a setting in my UI can change the column count.
10. As an application developer, I want one child to take several shares of a row with `yetiColumnsChild span="2"`, so that I get a two-thirds and one-third split without a breakpoint.
11. As an application developer, I want a plain column to need no directive, so that only the child with a span carries a second attribute.
12. As an application developer, I want the span typed by Yeti's `span` vocabulary, so that `span="13"` fails to compile.
13. As an application developer, I want the switch between columns and rows decided by the container's width, so that the same markup works in a sidebar and a full-width band.
14. As an application developer, I want the columns item file loaded when the first columns layout renders and removed after the last leaves, so that I do not import `columns.css` globally.
15. As an application developer, I want the item file in the server HTML when a server-rendered page has a columns layout, so that the first paint is already in columns.
16. As an application developer, I want the layout right with JavaScript off under SSR and prerendering, so that the page reads the same before any script runs.
17. As an application developer, I want hydration to change nothing on a columns layout, so that I get no `NG05xx` error and no reflow.
18. As an application developer, I want the layout to work under zoneless change detection, so that the package fits Angular's recommended mode.
19. As an application developer, I want a columns layout inside a `hydrate never` block to keep its styles for as long as it is on the page, so that a dehydrated block is not unstyled when a live layout elsewhere leaves.
20. As an application developer, I want to know that a columns layout inside a client-only `@defer` block needs `columns` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
21. As an application developer, I want `@for` and `@if` inside the layout to add columns without wrapper elements, so that a list of plans renders as columns.
22. As an application developer, I want a component of mine to be a column, so that `<app-plan>` hosts can be the children.
23. As an application developer, I want a child to be both a column and another item (`<section yetiBox yetiColumnsChild span="2">`), so that I can write Yeti's own example with boxes.
24. As an application developer, I want a columns layout nested in another to keep its own defaults, so that an inner layout does not inherit the outer `gap`.
25. As an application developer, I want the HTML `align` attribute that a static `align="center"` would leave on the host removed, so that the browser's old presentational hint does not centre my text.
26. As an application developer, I want a static `span="2"` on a column to do nothing beyond the input, so that the HTML `span` attribute has no effect on my element.
27. As an application developer, I want template references (`#c="yetiColumns"`, `#s="yetiColumnsChild"`), so that both directives follow the package's `exportAs` rule.
28. As an application developer, I want to import both directives from `ngx-yeti/columns`, so that a `@defer` block can split them with the rest of the item.
29. As an application developer, I want the input value types re-exported by name from the package (`YetiWidth`, `YetiGap`, `YetiAlign`, `YetiJustify`, `YetiColumns`, `YetiSpan`), so that I can type my own signals that feed the inputs.
30. As an application developer, I want the usage rules stated (direct children, at least two, source order is reading order), so that I use the layout as Yeti intends.
31. As an application developer using Tailwind v4 beside the package, I want to know whether `columns` collides with a Tailwind name, so that I can plan my layer statement.
32. As a screen-reader user, I want the columns announced in source order with no role of their own, so that the layout changes nothing about what I hear.
33. As a keyboard user, I want the focus order to follow the visual order in both arrangements, in left-to-right and right-to-left pages, so that focus does not jump around.
34. As a low-vision user, I want the columns to become rows when I zoom in or the container narrows, so that I never scroll sideways to read a column.
35. As a low-vision user who overrides text spacing, I want columns to grow with their content, so that my spacing settings clip nothing.
36. As a package maintainer, I want the contract check to cover the five attributes, the `span` marker, and every value of their vocabularies, so that a pin move that adds a value or attribute fails before release.
37. As a package maintainer, I want the SSR smoke to assert the server HTML of a columns layout, its child, and its item link, so that the first paint is proven.
38. As a package maintainer, I want the fixture app to render the layout on a prerendered and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
39. As a package maintainer, I want no test to depend on a public token's default value or on Yeti's default threshold, so that a pin move that changes a default fails no test for no reason.
40. As a package maintainer, I want the class name checked against Yeti's typings at the pin, so that `NgxYetiColumns` stays correct and a future `YetiColumnsChild` type is caught.
41. As a package maintainer, I want the layout to need no shared-utility spec, so that its entry point stays two directives and a token.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/layouts/columns/manifest.json`, `columns.css`, `docs.md`, and `example.html`, and in `Y/schema/vocabulary.json` and `Y/src/layouts/attributes.css`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `columns`, `layout`, `Grids and Rows` |
| `class` | `columns` |
| `attributes` | `data-threshold` (vocabulary `width`: `2xs` to `2xl`; default `md`), `data-gap` (vocabulary `gap`, 29 values; default `md`), `data-align` (vocabulary `align`: `start`, `center`, `end`, `stretch`, `baseline`; default `stretch`), `data-justify` (vocabulary `justify`: `start`, `center`, `end`, `between`, `around`, `evenly`; default `start`), `data-columns` (vocabulary `columns`: `1` to `6`; no default) |
| `classes` | empty |
| `children` | `> *` (min 2, max none: "The columns. Each gets an equal share of the row."); `> [data-span]` (min 0) |
| `markers` | `data-span` (vocabulary `span`: `1` to `12`), `on: "> *"`: "How many shares of the row the child takes" |
| `tokens` | `--yeti-width-md` (public, the default threshold), `--yeti-space-md` (public, the default gap), and four private tokens (`--_yeti-gap`, `--_yeti-threshold`, `--_yeti-align`, `--_yeti-justify`) |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "Purely visual. Reading order is source order in both arrangements." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: "flexbox gap", "calc() in flex-basis"; `guarded`: empty |
| `since` | `7.0.0` |

How it works, in `@layer yeti.layouts`: `.columns` is a wrapping flex row whose `align-items`, `justify-content`, and `gap` read private tokens. Each `.columns:not([data-*])` rule supplies a default only when its attribute is absent, so a nested layout never inherits a parent's value (`attributes.css`, header comment). Every child gets `flex-grow: 1` and `flex-basis: calc((var(--_yeti-threshold) - 100%) * 999)`. Wider than the threshold, the basis is hugely negative and clamps to zero, so the children share the row equally. Narrower, it is hugely positive, so each child takes a row. `.columns > [data-span]` sets `flex-grow: var(--_yeti-span)`. `.columns[data-columns="N"] > :nth-child(n + N+1)` sets `flex-basis: 100%`, so every child past the cap takes a full row. The value rules for all six names (`[data-threshold="sm"] { --_yeti-threshold: var(--yeti-width-sm) }`, `[data-span="2"] { --_yeti-span: 2 }`, and the rest) are in the always-loaded `layouts/attributes.css`. The item file holds only the `.columns` rules. Neither file uses `@container`: the switch is decided by the flex container's own inline size, because `100%` in `flex-basis` resolves against it.

Attributes left to the consumer: none. Ticket 26 maps all six declarations (rows 19 to 24) and leaves none to the consumer.

### 2. Contract mapping

| Contract piece | Yeti | Package | Static form of an HTML-named input | Record |
| --- | --- | --- | --- | --- |
| Identity class | `columns` | static host class on `[yetiColumns]` (`NgxYetiColumns`) | not applicable | ADR 0003 point 1; Part 2 row 5 |
| `data-threshold` | width below which the columns become rows; default `md` | `threshold` on `yetiColumns`: `YetiWidth`, default `undefined`, bound `[attr.data-threshold]` | not an HTML attribute | ticket 26 row 19 (R) |
| `data-gap` | space between columns and rows; default `md` | `gap`: `YetiGap`, default `undefined`, `[attr.data-gap]` | not an HTML attribute | ticket 26 row 20 (R) |
| `data-align` | vertical alignment; default `stretch` | `align`: `YetiAlign`, default `undefined`, `[attr.data-align]` | `removed`: `'[attr.align]': 'null'`, because HTML `align` is a presentational hint on any element in Chromium and WebKit | ticket 26 row 21 (R); building-blocks 1.4 |
| `data-justify` | distribution along the row; default `start` | `justify`: `YetiJustify`, default `undefined`, `[attr.data-justify]` | not an HTML attribute | ticket 26 row 22 (R) |
| `data-columns` | the most columns on one row; no default | `columns`: `YetiColumns`, default `undefined`, `[attr.data-columns]` | not an HTML attribute | ticket 26 row 23 (R) |
| Marker `data-span` (on `> *`) | a child's shares of the row | `span` on `[yetiColumnsChild]` (`YetiColumnsChild`): `YetiSpan`, default `undefined`, `[attr.data-span]` | `inert`: HTML `span` applies only to `col` and `colgroup`, which cannot be a flex child of a columns host, so no binding | ticket 26 row 24 (C); building-blocks 1.4 |
| Children `> *` | the columns | no directive for a plain column | not applicable | ticket 26 grilling question 6 |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Token `--yeti-width-md` | the default threshold | the consumer's; the package writes none | not applicable | ADR 0004 |
| Token `--yeti-space-md` | the default gap | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--yeti-width-*`, `--yeti-space-*` | the values each `threshold` and `gap` value reads (`attributes.css`) | the consumer's; the package writes none | not applicable | ADR 0004 |
| Host attribute (package) | not Yeti's | static `data-ngx-yeti-item-columns` (empty value) on `[yetiColumns]` | not applicable | ADR 0045; ADR 0060 point 2; ADR 0080 point 2 |
| Injection token | not Yeti's | `yetiColumnsToken`, provided by `NgxYetiColumns` | not applicable | ADR 0070 kind C; building-blocks 1.9 |

The part directive `YetiColumnsChild` sets no presence attribute and acquires no item file: its only rule, `.columns > [data-span]`, applies under a `[yetiColumns]` host, which already holds the link ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 6).

The input value types are Yeti's own, imported from the package's generated `yeti-types.ts` and re-exported by name from the primary entry point, never redeclared ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5 and its 2026-10-02 note; ADR 0060 point 10). Each is a full vocabulary, so no `Extract` and no package-declared `Yeti<Item><Input>` type is needed.

**Module replaced:** none. Yeti's `columns` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 5, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads `--yeti-width-md` and `--yeti-space-md` for its defaults, and through the always-loaded value rules whichever `--yeti-width-*` and `--yeti-space-*` (or the fluid `--yeti-space-*-static` and private pair tokens) a set attribute names. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`. They are derived tokens, not hue, chroma, or scale inputs, so they also take effect on any element (`Y/src/guides/theming.md:38`). **Private tokens** (`--_yeti-*`) are never read or written: the four the manifest lists are Yeti's implementation.

### 3. Hierarchy and DI shape

`NgxYetiColumns` provides `yetiColumnsToken` (`InjectionToken<NgxYetiColumns>`, declared with `import type`, exported from `ngx-yeti/columns`) as `{provide: yetiColumnsToken, useExisting: NgxYetiColumns}`. `YetiColumnsChild` injects it with `{optional: true, skipSelf: true}` ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) kind C; building-blocks 1.9). Nothing in this milestone depends on the reference: the span works through Yeti's CSS alone. A child with no parent token (standalone, or projected from a template that declares no `yetiColumns`) behaves the same, and binds its `data-span`. That attribute does nothing unless the element is a direct DOM child of a `.columns` element. This is the "degrades as its spec documents" case of building-blocks 1.9.

No item directive hosts another. Part 2's finding holds: no Yeti item always sits on another item's element. A consumer composes `yetiColumns` or `yetiColumnsChild` beside other item directives on one element by writing both attributes (`<section yetiBox yetiColumnsChild span="2">`, Yeti's own example). Two directives on one element that declare the same input name share the vocabulary's exported type (building-blocks 1.4, shared vocabularies): `yetiColumns` beside `yetiBox` both declare `gap: YetiGap`, so one static `gap="lg"` feeds both and both bind the same `data-gap`, which is what Yeti's single attribute means on that element (ticket 26 grilling question 16). Each directive sets its own presence attribute, so the box's item file and the columns' item file are each held (ADR 0045).

The only other injection is the root styles service of ADR 0060, reached by `injectYetiItemStyles('columns')` from `ngx-yeti/styles` as the last statement of the constructor ([setup](setup.md); ticket 50 decisions 42 and 45), through which `NgxYetiColumns` acquires and releases the `columns` item file. That service belongs to the [setup](setup.md) spec and ADR 0060.

Generated ids and the platform's relationship attributes: none. The layout renders no `id` and references none, so it does not use [generated-ids](generated-ids.md).

### 4. API

**`NgxYetiColumns`**

| Member | Value |
| --- | --- |
| Class | `NgxYetiColumns`. Checked at the Pin: `yeti.d.ts` exports 46 names, among them `YetiColumns` (`export type YetiColumns = '1' \| '2' \| '3' \| '4' \| '5' \| '6'`), so the class takes `NgxYeti` (ADR 0080 point 4; checked against Yeti's built `dist/yeti.d.ts` at the pin, the build ADR 0080 used) |
| Selector | `[yetiColumns]` (Part 2 row 5) |
| `exportAs` | `yetiColumns` (building-blocks 1.3; ADR 0080 point 4: the selector and `exportAs` keep `yeti`) |
| Entry point | `ngx-yeti/columns` (building-blocks 1.3; ADR 0011 clause 10) |
| Inputs | `threshold: YetiWidth \| undefined`, `gap: YetiGap \| undefined`, `align: YetiAlign \| undefined`, `justify: YetiJustify \| undefined`, `columns: YetiColumns \| undefined`, each `input()` with no default value (ADR 0070 rule 1) |
| Host | static `class: 'columns'`; static `'data-ngx-yeti-item-columns': ''`; `'[attr.data-threshold]'`, `'[attr.data-gap]'`, `'[attr.data-align]'`, `'[attr.data-justify]'`, `'[attr.data-columns]'` from the inputs, `null` when unset; `'[attr.align]': 'null'` with a source comment naming the presentational hint it prevents (building-blocks 1.4) |
| Providers | `{provide: yetiColumnsToken, useExisting: NgxYetiColumns}` |
| Models, outputs, methods, listeners | none |
| Lifecycle | acquires the `columns` item file, on the server too, with `injectYetiItemStyles('columns')` as the last statement of its constructor (ticket 50 decisions 42 and 45) and releases it on destroy through `DestroyRef` (ADR 0060 point 2; building-blocks 1.9) |

**`YetiColumnsChild`**

| Member | Value |
| --- | --- |
| Class | `YetiColumnsChild`. Checked at the Pin: not among the 46 names `yeti.d.ts` exports, so the part keeps `Yeti` (ADR 0080 point 4: "A part directive of a colliding item keeps `Yeti` unless its own name collides") |
| Selector | `[yetiColumnsChild]` (Part 2 row 5; ticket 26 row 24; this spec fixes the provisional name, as [Decide: the glossary](../issues/10-decide-glossary.md) Q9 left part names to the specs) |
| `exportAs` | `yetiColumnsChild` |
| Inputs | `span: YetiSpan \| undefined`, `input()` with no default |
| Host | `'[attr.data-span]'` from the input, `null` when unset. No class, no presence attribute ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 6), no `[attr.span]` binding (`inert`) |
| Injection | `yetiColumnsToken`, `{optional: true, skipSelf: true}` |
| Models, outputs, methods, listeners | none |

No input default differs from Yeti's: every input is `undefined` until the consumer sets it, and Yeti's CSS supplies the manifest's default (ADR 0070 rule 1). A static attribute type-checks as a string literal under `strictTemplates`, so `columns="3"` compiles and `columns="7"` does not (ADR 0070 rule 2; ticket 26 grilling question 14, read, not run).

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiColumns` on the element whose DOM children are the columns, and give it at least two (manifest `children` `min: 2`). Every direct child element is a column: an element, or a component's host element. `@for`, `@if`, and `ng-container` add no element, so the elements they render are the columns. A wrapper element inside a component makes that wrapper the single column.
2. Put `yetiColumnsChild` only on a direct child of a `yetiColumns` host, and only on a child that takes a `span`. A plain column needs no directive. Outside a columns host it compiles and does nothing, because Yeti scopes the marker to its parent (ADR 0070, Considered options).
3. Do not write `class="columns"`, any of Yeti's `data-*` attributes, or `data-ngx-yeti-item-columns` statically on either host. The directives bind them, and a static copy is written back and removed again at hydration (ADR 0003 point 1; ADR 0070's 2026-10-03 consequence; building-blocks, "Hydration constraints (2026-10-03)"). A value newer than the pin goes through `$any` (`[columns]="$any('7')"`, ADR 0070).
4. Keep reading order as source order. Do not reorder columns visually with CSS `order` or a reversed direction: Yeti's note "Reading order is source order in both arrangements" holds only for the markup Yeti documents (manifest `a11y.notes`; WCAG 1.3.2, 2.4.3).
5. Choose a threshold at which each column's content fits its share. Above the threshold the children share the row whatever their content, and a long unbreakable word can overflow a narrow share (WCAG 1.4.10; the author's risk, as for masonry's reading order in Part 2 row 12).
6. Write `align` either way: `align="center"` or `[align]="alignment()"`. The directive removes the HTML `align` attribute that the static form leaves ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 9).
7. Import `NgxYetiColumns`, and `YetiColumnsChild` where a template writes it, in every component whose template writes the attribute. A **Forgotten import** renders plain blocks with no error unless an input is bound (`[columns]`, NG8002) or a template reference names the `exportAs` (NG8003) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `columns` | Nearest in Angular Material: `MatGridList` |
| --- | --- | --- |
| Shape | an attribute directive on the consumer's element, plus a part directive on a spanning child | a component `<mat-grid-list>` with `<mat-grid-tile>` children (`NC/src/material/grid-list/grid-list.ts:40`, `grid-tile.ts:25`) |
| Count | `columns` caps the count per row; the threshold switches to rows by the container's width | `cols` fixes the count (`grid-list.ts:87`); no switch to rows |
| Gutter | `gap` from Yeti's `gap` vocabulary | `gutterSize`, a CSS length string (`grid-list.ts:96`) |
| Span | `span` on the part directive, a share of the row | `colspan` on the tile (`grid-tile.ts:56`) |
| Parent link | `yetiColumnsToken`, optional | `MAT_GRID_LIST`, optional (`grid-tile.ts:40`) |
| Layout engine | Yeti's CSS, flex-basis arithmetic | the component's tile styler computes each tile's position in TypeScript |
| `exportAs` | `yetiColumns`, `yetiColumnsChild` | `matGridList`, `matGridTile` (`grid-list.ts:41`, `grid-tile.ts:26`) |

The part's optional parent token follows Material's tile shape. Nothing else applies: the grid list positions tiles in script and has fixed rows, while columns has neither.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 5; building-blocks 1.2). The reason: Yeti's CSS does the whole job; the directives add the class, the typed attributes, the item-file acquisition, and `exportAs` (row 1's reason, which row 5 takes, "as row 1"). No Aria pattern applies (a layout has no role; Aria's `Grid` is the APG grid composite, as Part 2 row 9 notes for `grid`), and no CDK piece is used: there is no id, focus, keyboard, direction read, or observer. Flex layout follows the CSS `direction` by itself, so RTL needs no `Directionality`.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The layout adds no role, state, or property, and no tab stop.
- **Keyboard:** none. Focus moves through the columns' own content in DOM order.
- **Names:** none.

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The layout adds no structure. The consumer's elements keep their semantics; a list host keeps its list semantics, and whether it keeps its markers is Yeti's reset's (`:is(ul, ol)[role="list"]`, `Y/src/base/reset.css:83-86`). |
| 1.3.2 Meaningful Sequence | Columns and rows both follow DOM order: the flex row wraps forward, and no rule reorders a child (manifest `a11y.notes`). Usage rule 4 keeps the consumer from reordering. |
| 1.4.4 Resize Text | Thresholds and gaps are `rem`-based tokens (`--yeti-width-md: 32rem`, `Y/src/tokens/space.css:39`), so text zoom raises the threshold with the text (read, not measured). |
| 1.4.10 Reflow | Below the threshold every child takes a full row. Layer 4 asserts no horizontal overflow at a 320 px viewport for Yeti's example. A threshold set below the content's needs is the author's risk (usage rule 5). |
| 1.4.12 Text Spacing | The rules set no height and no overflow; columns grow with their content (read). |
| 2.4.3 Focus Order | Visual order equals DOM order in left-to-right and right-to-left pages, because the flex row follows `direction` (layer 1, `columns--rtl`). |

**Ledger rows owned:** none ([ledger.md](../ledger.md); Part 2 row 5, "Ledger: none"). The package adds no accessibility or standards feature that Yeti lacks, and ticket 17 found no gap on Yeti's columns example (building-blocks 1.10: 0 violations on all 49 examples; `columns` is not among the five with an incomplete contrast check).

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<div yetiColumns threshold="md">
  <section yetiBox surface="raised" yetiBorder><h2>Plan</h2><p>Three equal columns in a wide container.</p></section>
  <section yetiBox surface="raised" yetiBorder><h2>Build</h2><p>Three rows in a narrow one.</p></section>
  <section yetiBox surface="raised" yetiBorder yetiColumnsChild span="2"><h2>Ship</h2><p>No breakpoint anywhere.</p></section>
</div>
```

Server HTML and the hydrated DOM are the same. The parent carries `yeticolumns=""`, `threshold="md"` (the static input attribute, matched by no rule), `class="columns"`, `data-threshold="md"`, and `data-ngx-yeti-item-columns=""`, and no `data-gap`, `data-align`, `data-justify`, `data-columns`, or `align`. The third section carries `yeticolumnschild=""`, `span="2"` (inert), and `data-span="2"`, beside the box's own class and attributes. The server also writes one item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>layouts/columns/columns.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="columns"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts that link at bootstrap. A static `align="center"` on the parent renders `data-align="center"` and no `align` in the server HTML.

The delta from Yeti's docs markup: the consumer writes `yetiColumns` and input names where the docs write `class="columns"` and `data-*` names, and `yetiColumnsChild span` where they write `data-span`. The layout has no closed or open state.

### 9. Animation

None. The layout has no state and no transition; Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). Changing a bound input moves the columns at once. A column the consumer inserts or removes with `@if` or `@for` may carry a class-form `animate.enter` or `animate.leave` of the consumer's or Yeti's `enter` utility. The item link stays until Angular removes the last host, because removal waits for the DOM (ADR 0060 point 4). A server-rendered columns layout never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static class, the presence attribute, the bound `data-*` attributes, and the item link in `<head>` (section 8). Nothing is state a person or a module can change, so nothing is Angular-owned **Pre-hydration state** (ADR 0003 point 4; ticket 26: "the consumer's binding only" on rows 19 to 24).
- **Before hydration:** neither directive creates a node, reads layout, starts a timer or observer, or touches `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is the item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** both hosts are claimed as they are; 0 style mutations (ADR 0060 point 5, measured for the mechanism). A static `align` is written back and removed again in the same pass (section 11).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the layout and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism).
- **`hydrate never`:** the layout is its server HTML and stays styled while the host is connected, whatever live layouts do (ADR 0060 point 4). Nothing is lost except changing a bound input, which needs Angular.
- **Client-only `@defer`:** the item file is fetched when `NgxYetiColumns` is constructed, which can show unstyled frames (the children stacked); the consumer closes the gap with `provideYetiStyles({ preload: ['columns'] })` (ADR 0060 point 6; [setup](setup.md)). A `@defer` block inside the host renders its placeholder or loading element as a direct child, so that element is a column while it shows (inferred from Yeti's `> *` selector).
- **Event replay:** neither directive declares a listener, so nothing replays and no `jsaction` is added.
- **`withI18nSupport()`:** column content is usually translated with `i18n` in the consumer's component. The directives add no `i18n` block of their own; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** inputs are `input()` signals read by host bindings, so a changed input refreshes its attribute with no zone (ADR 0070 rule 4; map, Standing rulings, item 43).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the layout is readable and in columns or rows by the container's width, because the class, the attributes, and the item link are in the server HTML. Nothing is lost: the layout has no behaviour. A client-only application gets no such promise.
- **Hydration boundary:** the parent and its columns may sit in different boundaries. The layout has no ids or references, and a deferred column hydrates on its own.

### 11. Hydration constraints

The layout complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** host bindings read only inputs, which are equal on both, so both render the same class and attributes.
- **No direct DOM manipulation:** the directives write nothing to the DOM outside host bindings. The item link belongs to the ADR 0060 service, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directives change no element. The usage rules put no constraint on the host's element type; a host whose content model the children break (a `p` holding `div` columns) would be repaired by the parser and differ from the server's DOM, so the consumer's markup must already be valid HTML.
- **`preserveWhitespaces`:** the directives have no template. Whitespace text between columns is not a flex item that takes a share (CSS: white-space-only text in a flex container is not rendered).
- **No output branched on the platform:** none.
- **Static attributes the directives bind:** usage rule 3 keeps the consumer from writing them. The one static form that the records invite is `align="center"`, an input whose name is also an HTML attribute that the directive removes (building-blocks 1.4). Hydration writes it back before the `null` binding removes it again in the same pass (ADR 0070's 2026-10-03 consequence, read in ticket 33). The final DOM equals the server's, and no frame paints between the two writes (inferred; layer 4 asserts it). The static form is accepted; if the layer-4 case fails, every `removed`-kind spec switches to bound-only inputs ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 9).

### 12. Single-page application

None. The layout has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). On a route change, a route's layouts leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-columns]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders a layout again re-inserts it.

### 13. Item file

`yeti-css/css/layouts/columns/columns.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiColumns]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:23`, after `sidebar` and before `cover`, the rank table of point 3), and removed after the last host has left the DOM. `YetiColumnsChild` acquires nothing ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 6). The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement, and optionally `provideYetiStyles({ preload: ['columns'] })`. The layout adds nothing to it. Cross-item files acquired: none. `columns.css` has no cross-item rule, and the value rules it depends on are in the always-loaded `layouts/attributes.css` (ADR 0060 point 9).

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attributes in the DOM, the item link, and where the columns land. It never asserts a private field or how the styles service counts. No test depends on a public token's default value or on a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3). A layout test sets `threshold` explicitly and sizes the container against a probe element in the same story whose inline style is `inline-size: var(--yeti-width-<value>)`: the container is the probe's width plus `2rem` for the columns case and minus `2rem` for the rows case, so the assertion holds for any token value. "Share a row" means equal `offsetTop`; "equal shares" means widths equal within 1 px. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `columns` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `columns--default`: Yeti's example (three raised, bordered boxes) with `threshold="md"`, in a resizable container. Asserts `class="columns"`, `data-threshold="md"`, `data-ngx-yeti-item-columns`, and no other `data-*` from the package on the parent. Wider than the probe: the three share a row in equal shares. Narrower: each starts its own row at the parent's full width. No child has a role or `tabindex` from the package.
- `columns--capped`: `columns="2"` with three children above the threshold. Asserts `data-columns="2"`, the first two share a row, and the third takes the full width on the next row (Yeti's docs example).
- `columns--span`: an `article` with `yetiColumnsChild span="2"` beside a plain `aside`, above the threshold. Asserts `data-span="2"` and `span="2"` on the article, and that the article's width is twice the aside's within 1 px once the gap is subtracted. Below the threshold both take full rows.
- `columns--inputs`: Storybook controls bind `gap`, `align`, `justify`, and `columns`. The play function sets each, asserts the matching `data-*` value, resets it to unset, and asserts the attribute is absent. With `align="center"` written statically, asserts `data-align="center"` and no `align` attribute (building-blocks 1.4).
- `columns--nested`: a columns layout with `gap="2xl"` holding a columns layout with no `gap`, beside a third top-level columns layout with no `gap`. Asserts that the inner layout's computed `column-gap` equals the third layout's, not the outer's (`attributes.css`: "a nested layout never inherits a parent's value").
- `columns--rtl`: `columns--default` inside `dir="rtl"`. Asserts the first DOM child is the rightmost column, and that Tab moves through the columns' links in DOM order.

### Layer 2: browser-level (`npx nx test <lib>`, `columns.spec.ts`)

Through `TestBed.createDirective(NgxYetiColumns, { tagName: 'div', bindings })` and `TestBed.createDirective(YetiColumnsChild, { tagName: 'article', bindings })` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- the parent host has class `columns` and `data-ngx-yeti-item-columns`; with no bindings it has no `data-threshold`, `data-gap`, `data-align`, `data-justify`, or `data-columns`;
- each input binding renders its attribute, a changed binding updates it after `whenStable()`, and binding `undefined` removes it;
- while the fixture lives, one `<link data-ngx-yeti-styles="columns">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed;
- the child host has `data-span` from its binding, no class, no presence attribute, and no `span` binding; created alone, it injects no parent and throws nothing.

A small test host covers what `createDirective` cannot: a child declared inside a `yetiColumns` host resolves `yetiColumnsToken` to the parent instance; template references `#c="yetiColumns"` and `#s="yetiColumnsChild"` resolve; the consumer's own `class` on the parent is kept beside `columns`; a static `align="center"` leaves no `align` attribute; `yetiColumns` beside a `yetiBox` with one static `gap="lg"` gives one `data-gap="lg"` and both presence attributes.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `columns.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture of Yeti's example whose headings carry `i18n`, with a static `align="center"` on the parent and one `yetiColumnsChild span="2"` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the parent renders `class="columns"`, `data-threshold`, `data-align="center"`, and `data-ngx-yeti-item-columns`, and no `align`; the child renders `data-span="2"`; `<head>` holds one item link with `data-ngx-yeti-styles="columns"`, `data-beasties-skip`, and an `href` ending `layouts/columns/columns.css?v=<pin>`; no element carries `jsaction`.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `columns` has `NgxYetiColumns`; `data-threshold`, `data-gap`, `data-align`, `data-justify`, and `data-columns` have inputs whose unions equal the manifest's vocabularies; the marker `data-span` has `span` on `YetiColumnsChild` with the `span` vocabulary; the item has no events. A pin move that adds an attribute, a marker, or a value fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer 1 story ids: `columns--default` and `columns--span` resize the container, not the viewport, across the threshold in Chromium, Firefox, and WebKit, and assert the arrangement on each side (building-blocks 1.7 and 1.12).

Fixture half, on the **Fixture app** built with `outputMode: 'server'`, with a `/columns` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route renders Yeti's example with a static `align="center"` and a spanning child:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`; after hydration the parent has no `align` attribute, and a `MutationObserver` with a `requestAnimationFrame` probe asserts that no frame paints while the written-back `align` is present ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 9);
- with JavaScript disabled, the columns' positions equal those with JavaScript on at the same width, and `@axe-core/playwright` with the six tags reports no violation;
- a layout inside a client-only `@defer` block with `columns` in the preload list shows no unstyled frame; a layout inside a `hydrate never` block stays in columns after a live layout on the page is removed;
- navigating from the columns route to a route without one removes the item link, and navigating back re-inserts it;
- at a 320 px viewport the page has no horizontal overflow and the example's children are rows (1.4.10).

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and `docs.md` examples for the stories; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; the [lede](lede.md) spec's probe technique for token-independent assertions.

## Out of Scope

- An input per token, or a threshold given as a length rather than Yeti's `width` vocabulary (ADR 0004; ADR 0070 rule 2).
- A viewport breakpoint input of any kind (building-blocks 1.7).
- A check that the host has at least two children, that a `yetiColumnsChild` sits under a `yetiColumns` host, or that no child is reordered. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- A shared any-element `[yetiSpan]` directive for `columns`, `grid`, and `hero` (ADR 0070, Considered options).
- Package CSS for the layout (building-blocks 1.13).
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiColumns]` with five inputs; part directive `[yetiColumnsChild]` with `span` | building-blocks Part 2 row 5; ticket 26 rows 19 to 24; [Decide: the spec list](../issues/11-decide-spec-list.md) row 5 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| The marker goes on a per-item part directive, not a shared marker directive | ADR 0070 kind C; ticket 26 grilling question 6 |
| Class `NgxYetiColumns`; `YetiColumnsChild` keeps `Yeti`; selectors and `exportAs` keep `yeti` | ADR 0080 point 4 |
| Input types are Yeti's vocabulary types from the generated `yeti-types.ts` | ADR 0080 point 5; ADR 0060 point 10 |
| Unset input renders no attribute | ADR 0070 rule 1 |
| `align` is `removed`; `span` is `inert` | building-blocks 1.4; ticket 26 rows 21 and 24 |
| Static `align` written back and removed at hydration is accepted | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 9 |
| Optional parent token, used by nothing in this milestone | ADR 0070 kind C; building-blocks 1.9 |
| Presence attribute `data-ngx-yeti-item-columns` on the item directive only | ADR 0045; the child's absence is [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 6 |
| Entry point `ngx-yeti/columns` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 5 |
| Tokens are the consumer's | ADR 0004 |
| Item file as a counted link | ADR 0060 points 2 to 6 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

Pricing tiers that switch to rows below the `lg` width, at most three on a row:

```html
<div yetiColumns threshold="lg" columns="3" gap="lg">
  @for (plan of plans(); track plan.id) {
    <section yetiBox surface="raised" yetiBorder>
      <h2>{{ plan.name }}</h2>
      <p i18n>{{ plan.summary }}</p>
    </section>
  }
</div>
```

```ts
import { NgxYetiColumns } from 'ngx-yeti/columns';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';

@Component({
  selector: 'app-pricing',
  imports: [NgxYetiColumns, YetiBox, YetiBorder],
  templateUrl: './pricing.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pricing {
  readonly plans = input.required<readonly Plan[]>();
}
```

Two thirds and one third, from Yeti's docs:

```html
<div yetiColumns>
  <article yetiColumnsChild span="2">Two thirds.</article>
  <aside>One third.</aside>
</div>
```

A column count the user picks, typed by Yeti's vocabulary:

```ts
import type { YetiColumns } from 'ngx-yeti';

readonly perRow = signal<YetiColumns>('3');
```

```html
<ul yetiColumns [columns]="perRow()" role="list">
  @for (stat of stats(); track stat.label) {
    <li>{{ stat.value }} {{ stat.label }}</li>
  }
</ul>
```

A page whose columns render inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['columns'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `layouts/columns/columns.css`, loaded by `NgxYetiColumns` as a counted link (section 13). The consumer writes nothing for the layout beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps every `data-threshold`, `data-gap`, `data-align`, `data-justify`, and `data-span` value to its private token; `tokens/space.css` declares `--yeti-width-*` and `--yeti-space-*`. `attributes.css` also holds `[data-columns]` rules for `grid` and `masonry` (`--_yeti-column-cap`, `--_yeti-column-count`), which `columns.css` does not read.
3. **Cross-item rules:** none. A `box` as a column (Yeti's example) loads its own item file through its own directive.
4. **Tokens:** reads `--yeti-width-md` and `--yeti-space-md` by default and the named `--yeti-width-*` and `--yeti-space-*` through the value rules; writes none (section 2).
5. **What breaks without the item file:** the children render as plain blocks, one under another at every width, with no error. The `data-*` attributes still set their private tokens, which nothing reads.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled all 49 of Yeti's class names with Tailwind 4.3.3, and only `container`, `grid`, and `table` (plus the attribute name `hidden`) produced a utility (measured; `prototypes/yeti-tailwind/results/collisions.json`). `columns` and `data-columns` produced none.

### Platform features to adopt when the browser target moves

None. Both features the manifest lists as unguarded, flexbox `gap` and `calc()` in `flex-basis`, are inside Baseline 2025 (building-blocks 1.2), and the layout needs no feature outside it. The switch is deliberately not a container query, so `container-type` is not needed either. [building-blocks.md](../building-blocks.md) 1.7 and `architecture-guide.md` say the change is decided by the container's width: a container query on `nav`, flex-basis arithmetic on `columns` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 33). [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md)'s Considered options already name "flex-basis arithmetic".

### Single-page-application pieces relied on

None: the layout uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
