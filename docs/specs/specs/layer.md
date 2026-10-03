# Spec: layer (layout)

Ticket: [61. Spec: layer (layout)](../issues/61-spec-layer.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 11 and Part 1, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 42 to 44, [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md), [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md), and [ledger.md](../ledger.md) row A11Y-10b. `Y/` is `github.com/foundation/yeti/` at the **Pin**. In this spec `layer` in code font is the item; a CSS `@layer` is always written "cascade layer", and the four test layers are "Test layer 1" to "Test layer 4" (glossary, **Cascade layer** and **Test layer**). The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 55 to 57), and each is cited where it applies.

## Problem Statement

Yeti's `layer` "Stacks its children in one box, later ones on top, with the box as tall as the tallest of them" (`Y/src/layouts/layer/manifest.json`). Its CSS is a grid with one named area, `layer`, into which every child is placed, so later children paint over earlier ones and every child stays in flow. `data-align` on the `layer` sets where every child sits vertically when it is shorter than the box (default `stretch`; `baseline` behaves as `start`). A child places itself with the markers `data-align-self` and `data-justify-self`. A `figcaption` that is a direct child of a `figure.layer` gets a scrim and the plain text colour, so a caption over a picture stays readable (`Y/src/layouts/layer/layer.css`). The uses Yeti names: a caption over a picture, a badge in the corner of a thumbnail, a heading over a hero image, a loading message over a form (`docs.md`). There is no **Module** and there are no events.

An application developer using the package cannot write `class="layer"`, `data-align`, `data-align-self`, or `data-justify-self`: the package's contract rule is that a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). A misspelt `data-justify-self="right"` or a marker on a grandchild fails silently in plain Yeti. The developer also needs the `layer` **Item file** loaded while a `layer` is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it, the children render one after another in normal flow, a caption sits under its picture with no scrim, and nothing errors.

The `layer` is also one of five items whose contrast axe could not compute on Yeti's own example (ticket 17, measured: `color-contrast` incomplete on the `figcaption` over an image, in all three engines). Yeti puts text-over-image contrast on the author: "Text laid over a picture needs a contrast treatment (a scrim or a solid panel); the layer does not add one" (manifest `a11y.notes`). So the package checks the contrast of what its stories show and states the author's responsibility as a usage rule ([ledger.md](../ledger.md) A11Y-10b; [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) points 3 and 4).

## Solution

Two directives in the secondary entry point `ngx-yeti/layer` ([building-blocks.md](../building-blocks.md) Part 2 row 11):

- **`YetiLayer`**, the **Item directive**, on `[yetiLayer]`. It binds `layer` as a static host class and `data-align` from an `align` input typed `YetiAlign` (ticket 26 row 42, kind R). Because `align` is also an HTML attribute that is a presentational hint on any element in Chromium and WebKit, it binds `'[attr.align]': 'null'` (the `removed` kind, ticket 26 row 42 and grilling Q15; building-blocks 1.4). It sets the static presence attribute `data-ngx-yeti-item-layer` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), acquires the `layer` item file when it is created, on the server too, and releases it when destroyed (ADR 0060 point 2), through `injectYetiItemStyles('layer')` from `ngx-yeti/styles` as the last statement of its constructor ([setup](setup.md); ticket 50 decisions 42 and 45). It provides `yetiLayerToken`.
- **`YetiLayerChild`**, a **Part directive** for a child that places itself, on `[yetiLayerChild]`. It binds `data-align-self` from an `alignSelf` input typed `YetiAlign` and `data-justify-self` from a `justifySelf` input typed `YetiSelf` (ticket 26 rows 43 and 44, kind C). It neither marks its host with a presence attribute nor acquires the item file ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 6).

The developer writes `<figure yetiLayer>` where Yeti's docs write `<figure class="layer">`, and `<span yetiLayerChild alignSelf="start" justifySelf="end">` where they write `<span data-align-self="start" data-justify-self="end">`. Unset inputs render nothing, so Yeti's defaults apply from its CSS: `stretch` for the `layer`, and the `layer`'s alignment for a child ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1).

Everything else is Yeti's CSS and the platform. The directives are **types only**: no listener, no render callback, no service, and no DI beyond the part's optional parent token. Server HTML is Yeti's documented markup, so the layout renders the same on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block.

The `layer--default` story's play function computes the contrast of the caption over its scrim with the exact WCAG formula, bounded over any picture, and the `layer--badge` story does the same for a badge on a solid panel. Both close what axe left incomplete (A11Y-10b).

## User Stories

1. As an application developer, I want to mark an element as a `layer` with one directive attribute, so that I never write Yeti's `layer` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="layer"` in the DOM, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want to set every child's vertical alignment with an `align` input typed by Yeti's align vocabulary, so that `align="bottom"` fails to compile.
4. As an application developer, I want an unset `align` to render no attribute, so that Yeti's default, `stretch`, applies and moves with the pin.
5. As an application developer, I want `align="baseline"` to behave as `start`, as Yeti documents, so that I am not surprised by a grid with no shared baseline.
6. As an application developer, I want a static `align="end"` not to leave HTML's old `align` attribute on my element, so that the browser's presentational hint does not change my text alignment.
7. As an application developer, I want to place one child vertically with an `alignSelf` input on a part directive, so that a caption sits at the bottom of the picture.
8. As an application developer, I want to place one child horizontally with a `justifySelf` input typed by Yeti's `self` vocabulary, so that a badge sits in the top-right corner and `justifySelf="right"` fails to compile.
9. As an application developer, I want an unset `alignSelf` or `justifySelf` to render no marker, so that the child follows the `layer`'s alignment.
10. As an application developer, I want to bind `alignSelf` and `justifySelf` from signals and clear them with `undefined`, so that a child can move between corners from state.
11. As an application developer, I want the box to be as tall as its tallest child, so that a stacked caption or message never overlaps the content after the `layer`.
12. As an application developer, I want later children to paint over earlier ones, so that source order decides what is on top, bottom first.
13. As an application developer, I want a `figure`'s caption over its picture to get Yeti's scrim, so that the caption is readable with no CSS of my own.
14. As an application developer, I want the `layer`'s item file loaded when the first `layer` renders, so that I do not import `layer.css` globally.
15. As an application developer, I want the item file removed after the last `layer` leaves the page, so that a route without one carries none of its CSS.
16. As an application developer, I want the item file in the server HTML when a server-rendered page has a `layer`, so that the first paint already stacks the children.
17. As an application developer, I want the layout correct with JavaScript off under SSR and prerendering, so that a captioned picture reads right before any script runs.
18. As an application developer, I want hydration to change nothing on a `layer` or its children, so that I get no `NG05xx` error and no layout shift.
19. As an application developer, I want the `layer` to work under zoneless change detection, including `align`, `alignSelf`, or `justifySelf` bound from a signal, so that the package fits Angular's recommended mode.
20. As an application developer, I want a `layer` inside a `@defer (hydrate on ...)` block to keep its layout before and after the block hydrates, so that incremental hydration does not unstack the children.
21. As an application developer, I want a `layer` inside a `hydrate never` block to keep its styles for as long as it is on the page, so that a dehydrated picture is not unstyled when a live `layer` elsewhere leaves.
22. As an application developer, I want to know that a `layer` inside a client-only `@defer` block needs `layer` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
23. As an application developer using `withI18nSupport()`, I want a translated caption to hydrate without being re-rendered, so that localised pages keep the server's DOM.
24. As an application developer, I want to put `yetiLayer` beside another item's directive on the same element (a `frame`), so that I can compose layouts as Yeti does.
25. As an application developer, I want `yetiLayerChild` beside another directive on the same child (`yetiPaint` for a solid badge), so that a placed child can also carry its own contrast treatment.
26. As an application developer, I want to know that the part directive works only on direct children, and that a component's host element is the child, so that I put `alignSelf` on the right element.
27. As an application developer, I want to set the caption's scrim, text colour, and padding through Yeti's public tokens, so that my theme controls them.
28. As an application developer, I want the package to offer no input per token, so that the `layer`'s API stays the size of Yeti's contract.
29. As an application developer, I want my own classes and attributes on the `layer` and its children to be kept, so that I can style the box beside the directive.
30. As an application developer, I want template references (`#l="yetiLayer"`, `#c="yetiLayerChild"`), so that the `layer` follows the package's `exportAs` rule.
31. As an application developer, I want to import both directives from `ngx-yeti/layer`, so that a `@defer` block can split them with the rest of the item.
32. As an application developer, I want the usage rules stated (at least two direct children, bottom first, a contrast treatment for text over a picture, nothing focusable hidden under a later child, no static Yeti attributes), so that I use the `layer` as Yeti intends.
33. As an application developer, I want to be told that text I lay over a picture needs a scrim or a solid panel, and that only a `figure`'s caption gets one from Yeti, so that I do not ship unreadable text.
34. As an application developer using Tailwind v4 beside the package, I want to know whether `layer` collides with a Tailwind name, so that I can plan my cascade-layer statement.
35. As a screen-reader user, I want the `layer` to add no role and no announcement, so that a figure is announced as a figure with its caption.
36. As a screen-reader user, I want the stacked children read in source order, bottom first, so that I hear the picture's description before its caption.
37. As a keyboard user, I want the `layer` to add no tab stop, so that focus moves only through the content's own controls, in source order.
38. As a keyboard user, I want the usage rules to keep a focusable control from being covered by a later opaque child, so that I can always see where focus is.
39. As a low-vision user, I want a caption over a picture and a badge over a thumbnail to meet WCAG 2.2 AA contrast in light and dark schemes, so that I can read them over any picture.
40. As a low-vision user, I want the `layer` to reflow at 320 CSS pixels with no horizontal scrolling, so that a stacked caption wraps inside the box.
41. As a low-vision user who overrides text spacing, I want a taller caption to make the box taller, so that my spacing settings do not clip text.
42. As a package maintainer, I want the contrast of A11Y-10b asserted in play functions with the exact WCAG formula, so that the ledger row is met by a test, not by assumption.
43. As a package maintainer, I want the contract check to cover the class, the attribute, and both markers, so that a pin move that adds or renames one fails before release.
44. As a package maintainer, I want the SSR smoke to assert the server HTML of a `layer`, a placed child, the absence of a static `align`, and the item link, so that the first paint and the `removed` kind are proven.
45. As a package maintainer, I want the fixture app to render a `layer` in a prerendered route and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
46. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default does not fail a test for no reason.
47. As a package maintainer, I want the class names checked against Yeti's typings at the pin, so that a future Yeti type named `YetiLayer` is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/layouts/layer/manifest.json`, `layer.css`, `docs.md`, and `example.html`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `layer`, `layout`, `Boxes and Stacks` |
| `class` | `layer` |
| `attributes` | `data-align` (vocabulary `align`: `start`, `center`, `end`, `stretch`, `baseline`; default `stretch`), "Vertical alignment of every child in the box. baseline behaves as start here." |
| `classes` | empty |
| `children` | `> *` (min 2, "The layers, bottom first."); `> [data-align-self]` (min 0); `> [data-justify-self]` (min 0) |
| `markers` | `data-align-self` (enum, vocabulary `align`, on `> *`): "Where the child sits vertically: start, center, end, stretch, or baseline."; `data-justify-self` (enum, vocabulary `self`: `start`, `center`, `end`, `stretch`; on `> *`): "Where the child sits horizontally: start, center, end, or stretch." |
| `tokens` | public: `--yeti-color-scrim`, `--yeti-color-text`, `--yeti-space-xs`, `--yeti-space-sm`; private: `--_yeti-align`, `--_yeti-align-self`, `--_yeti-justify-self` |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "Everything stays in reading order. Text laid over a picture needs a contrast treatment (a scrim or a solid panel); the layer does not add one." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: "grid-template-areas"; `guarded`: empty |
| `since` | `7.0.0` |

The rules, in the cascade layer `yeti.layouts`: `.layer` is a grid with `grid-template-areas: "layer"` and `align-items: var(--_yeti-align)`; `.layer:not([data-align])` sets `--_yeti-align: stretch`; `.layer[data-align="baseline"]` sets it to `start`, because "Grid has no baseline to share between items of different natural heights stacked in one area"; `.layer > *` zeroes margins, sits in the area `layer`, and takes `align-self` and `justify-self` from the private tokens; `.layer > :not([data-align-self])` and `:not([data-justify-self])` set those tokens to `auto`; `figure.layer > figcaption` takes padding `--yeti-space-xs` by `--yeti-space-sm`, `color: var(--yeti-color-text)`, and `background-color: var(--yeti-color-scrim)`. The `[data-align]`, `[data-align-self]`, and `[data-justify-self]` value rules that set the private tokens are in the **Always-loaded group** (`Y/src/layouts/attributes.css:147-152` and `:209-219`), not in the item file. `--yeti-color-scrim` is `color-mix(in oklch, var(--yeti-color-surface) 85%, transparent)` (`Y/src/tokens/color.css:106`), a translucent surface. The `card` item has its own rule for a `figure.layer` that is a card's first child (`Y/src/components/card/card.css:58-64`), in the card's item file.

Attributes left to the consumer: none (ticket 26 rows 42 to 44; ADR 0070's "no row is left to the consumer").

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `layer` | static host class on `[yetiLayer]` (`YetiLayer`) | always present | ADR 0003 point 1; Part 2 row 11 |
| Attribute `data-align` | every child's vertical alignment | input `align` on `yetiLayer`: `YetiAlign \| undefined`, bound `[attr.data-align]` | unset renders nothing (Yeti's `stretch` applies). `align` is an HTML attribute name: kind `removed`, the directive binds `'[attr.align]': 'null'` | ticket 26 row 42 (R) and grilling Q15; ADR 0070 rule 1; building-blocks 1.4 |
| Marker `data-align-self` | one child's vertical place | input `alignSelf` on `yetiLayerChild`: `YetiAlign \| undefined`, bound `[attr.data-align-self]` | unset renders nothing (the child follows the `layer`). `alignSelf` lowercases to `alignself`, which is no HTML attribute, so no kind applies | ticket 26 row 43 (C); building-blocks 1.4 |
| Marker `data-justify-self` | one child's horizontal place | input `justifySelf` on `yetiLayerChild`: `YetiSelf \| undefined`, bound `[attr.data-justify-self]` | unset renders nothing. `justifyself` is no HTML attribute, so no kind applies | ticket 26 row 44 (C) |
| Children | `> *` (min 2), `> [data-align-self]`, `> [data-justify-self]` | a child with no marker needs no directive | not applicable | ticket 26 grilling Q6 |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Token `--yeti-color-scrim` | wash behind a figure's caption | the consumer's; the package writes none | not applicable | ADR 0004 |
| Token `--yeti-color-text` | a figure caption's text colour | the consumer's | not applicable | ADR 0004 |
| Token `--yeti-space-xs` | the caption's block padding | the consumer's | not applicable | ADR 0004 |
| Token `--yeti-space-sm` | the caption's inline padding | the consumer's | not applicable | ADR 0004 |
| Tokens `--_yeti-align`, `--_yeti-align-self`, `--_yeti-justify-self` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-layer=""` on `[yetiLayer]` only | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2; ticket 50 decision 6 |

The `removed` kind for `align` (building-blocks 1.4; ticket 26 grilling Q15, which this spec confirms for the `layer`'s hosts: `figure`, `div`, `section`, `header`, `a`, and any other element that holds flow content). A static `align="end"` sets the input and would also leave HTML's `align="end"` on the host, which Chromium and WebKit map to `text-align` on several of these hosts. The host binding `'[attr.align]': 'null'` removes it, with a source comment naming the effect it prevents, as Material's `MatHint` does. The static form stays allowed: hydration writes the static value back and the `null` binding removes it in the same pass, so the final DOM equals the server's (ticket 50 decision 9).

**Module replaced:** none. Yeti's `layer` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 11, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads the four public tokens above, all for a `figure`'s caption. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`. `--yeti-color-scrim` and `--yeti-color-text` are derived colour tokens, and the spacing tokens are steps of the scale, so each can also be set on one `layer` element to change one caption (`Y/src/guides/theming.md:38`). A consumer who lowers the scrim's opacity owns the caption's contrast (usage rule 3). **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- `YetiLayer` provides `yetiLayerToken` (`InjectionToken<YetiLayer>`, `useExisting`), building-blocks 1.9 and 1.3's token naming.
- `YetiLayerChild` injects it with `{ optional: true, skipSelf: true }` ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) kind C). It reads nothing from it in the first milestone: no behaviour depends on the parent, and the **In-item check** that would use it belongs to a later milestone (map, Milestones). A part outside a `layer` renders its markers and nothing else happens, because Yeti's alignment is read only by `.layer > *`.
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"). A consumer composes by writing directives beside each other: `yetiLayer` with `yetiFrame` on one element, or `yetiLayerChild` with `yetiPaint` on one child. `align` shares its type, `YetiAlign`, with every other item that reads the `align` vocabulary (8 items, building-blocks 1.4, shared vocabularies), so a `layer` composed with another such item on one element declares one input name with one type, and one static `align` feeds both (ticket 26 grilling Q16). `alignSelf` and `justifySelf` are declared by no other package directive (ticket 26, read).
- The only other injection is the root styles service of ADR 0060, through `injectYetiItemStyles('layer')` from `ngx-yeti/styles` ([setup](setup.md); ticket 50 decisions 42 and 45), with which `YetiLayer` acquires and releases the item file. That service is the [setup](setup.md) spec's and ADR 0060's. `YetiLayerChild` neither marks its host nor acquires the file, because its markers act only under a `.layer`, whose own host holds the link for as long as it is connected (ticket 50 decision 6).
- Generated ids and the platform's relationship attributes: none. The `layer` renders no `id` and references none, so it does not use [generated-ids](generated-ids.md). A `figure`'s caption names the figure through the platform's own `figure`/`figcaption` relation, which the package does not touch.

### 4. API

| Member | `YetiLayer` | `YetiLayerChild` |
| --- | --- | --- |
| Class name | checked against the 46 type names `yeti.d.ts` exports at the Pin (the list ADR 0080 used): neither name is among them, so each takes `Yeti`, not `NgxYeti` (ADR 0080 point 4) | as left |
| Selector | `[yetiLayer]` | `[yetiLayerChild]` |
| `exportAs` | `yetiLayer` | `yetiLayerChild` |
| Entry point | `ngx-yeti/layer` (building-blocks 1.3; ADR 0011 clause 10) | same |
| Inputs | `align: YetiAlign \| undefined` (Yeti default `stretch`) | `alignSelf: YetiAlign \| undefined`; `justifySelf: YetiSelf \| undefined` (no Yeti default: unset follows the `layer`) |
| Host | static `class: 'layer'`; static `data-ngx-yeti-item-layer: ''`; `[attr.data-align]` from `align()`, `null` when unset; `'[attr.align]': 'null'` (`removed`) | `[attr.data-align-self]` and `[attr.data-justify-self]` from the inputs, `null` when unset |
| Providers | `yetiLayerToken` | none |
| Models, outputs, methods | none | none |
| Lifecycle | `injectYetiItemStyles('layer')` is the last statement of its constructor, after anything there that can throw (nothing does today); it acquires the `layer` item file, on the server too, and releases it through `DestroyRef` (ADR 0060 point 2; building-blocks 1.9; [setup](setup.md); ticket 50 decisions 42 and 45) | none |

Types come from the generated `yeti-types.ts` copy of Yeti's typings at the pin, re-exported by name (ADR 0060 point 10; building-blocks 1.3). The selectors are the ones Part 2 row 11 names; this spec fixes them, as ticket 26 left part selectors to the specs.

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiLayer` on the element that holds the stacked content, with at least two direct children, bottom first (manifest `children`, `> *` min 2). A `figure` with a picture and a `figcaption` is Yeti's example; a `div` with a thumbnail and a badge is its docs' second.
2. Put `yetiLayerChild` on direct children of the `layer` element. Yeti's alignment is read by `.layer > *` (`layer.css`), so markers on a grandchild do nothing. A component's host element is the child: write `<app-badge yetiLayerChild alignSelf="start">`, not the directive inside the component's template. `@if`, `@for`, `@defer`, and `ng-container` add no element, so the top-level elements they render are the children.
3. Text laid over a picture needs a contrast treatment, a scrim or a solid panel, and the author owns it (manifest `a11y.notes`; ledger A11Y-10b). Yeti gives one only to a `figcaption` that is a direct child of a `figure` `layer`. Any other text over a picture gets the consumer's own treatment, for example `yetiPaint` on the child (a solid panel), and the consumer checks its contrast. A consumer who changes `--yeti-color-scrim` checks the caption's contrast again ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 4).
4. Do not put a focusable control in a child that a later, opaque child covers. Later children paint over earlier ones, so such a control can receive focus while it cannot be seen (WCAG 2.2 2.4.11) and cannot be pressed. Put controls in the top child, or give the covering child a size that leaves them visible ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 56).
5. Do not write `class="layer"`, `data-align`, `data-align-self`, `data-justify-self`, or `data-ngx-yeti-item-layer` statically. The directives bind them, and hydration writes a static attribute again before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"; ADR 0070 consequences). A value newer than the pin goes through `[justifySelf]="$any('new')"` (ADR 0070). `align` may be written in its static form (`align="end"`), and the directive removes the HTML attribute it would otherwise leave (building-blocks 1.4, `removed` kind); hydration writes it back and removes it in the same pass, and the final DOM equals the server's (ticket 50 decision 9).
6. Bind `align`, `alignSelf`, and `justifySelf` from values that are the same on the server and the client, never from a browser-only read such as the window's width. The hydration constraints require the same DOM on both sides.
7. Import every directive class the template writes. A **Forgotten import** of `YetiLayerChild` with static `alignSelf` and `justifySelf` renders a child that stretches with no error; only a bound input (`[alignSelf]`) makes the compiler report it (NG8002) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `layer` | Nearest in Angular Material |
| --- | --- | --- |
| Shape | an item directive on the consumer's element, plus a part directive on the children that place themselves | `mat-grid-tile` with `mat-grid-tile-header` or `mat-grid-tile-footer` (`NC/src/material/grid-list/grid-tile.ts:25`, `:102`, `:112`), components that overlay a text bar on a tile with absolute positioning (`grid-list.scss:22`, `:37`) |
| Styling | Yeti's item file, loaded per item; tokens in the consumer's stylesheet | component styles and Sass theming |
| Accessibility | none of its own: purely visual, reading order kept | none of its own |
| API | one typed input on the `layer`, two typed inputs on a child, `exportAs` | content projection into fixed header and footer slots |

Nothing from Material's API applies: a grid tile's header and footer are fixed slots on a generated tile and taken out of flow, while the `layer` keeps every child in flow and lets each place itself. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 11; building-blocks 1.2). The reason, row 1's, which row 11 takes: Yeti's CSS does the whole job; the directives add the class, the typed attribute and markers, the `removed` binding, the item-file acquisition, and `exportAs`. CSS grid and `grid-template-areas` are inside Baseline 2025 (building-blocks 1.2). No Aria pattern applies (the layout has no role), and no CDK piece is used: there is no id, focus, keyboard, observer, or direction read (`justify-self` is logical, so right-to-left moves `end` to the left by itself).

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The `layer` adds no role, state, or property, and no tab stop.
- **Keyboard:** none.
- **Names:** none. A `figure`'s accessible name comes from its `figcaption`, which is the platform's; a picture's text alternative is the consumer's `alt`, and a picture under a caption that repeats it may take `alt=""` (Yeti's docs example).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.1.1 Non-text Content | The picture is the consumer's element with the consumer's `alt`; every story gives it one and the story gate checks it. |
| 1.3.1 Info and Relationships | The elements are the consumer's; the directives add no role. A caption stays a `figcaption` of its `figure`. |
| 1.3.2 Meaningful Sequence | Every child stays in flow and in DOM order (manifest `a11y.notes`); stacking changes paint order, not reading order. Test layer 1 asserts that the accessibility tree order equals the DOM order. |
| 1.4.3 Contrast (Minimum) | axe left `color-contrast` incomplete on the caption over the picture in all three engines (ticket 17), because the effective background depends on the picture under a translucent scrim. The `layer--default` play function computes the caption's text colour and the scrim's colour with its alpha, composites the scrim over pure black and over pure white, the two extremes any picture can show through it, and asserts at least 4.5:1 against both, with the exact WCAG formula, unrounded, in the light and dark schemes (ADR 0015 point 3; A11Y-10b; the bounding method is [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 55). The `layer--badge` play function asserts at least 4.5:1 for the badge's text against its opaque `yetiPaint` panel. The threshold is 4.5:1 for all text checked (ticket 50 decisions 6 and 8). Text over a picture with no treatment is the author's responsibility, stated as usage rule 3 (A11Y-10b's "What the package adds"). A package rule is added only if an assertion on Yeti's scrim fails (A11Y-10a's "package rule only if it fails"). |
| 1.4.4 Resize Text | The caption's padding is in `rem` tokens; zoomed text makes the caption, and so the box, taller (read, not measured). |
| 1.4.10 Reflow | The grid has one auto-sized column, so children take the box's width and text wraps. Test layer 4 asserts no horizontal overflow at a 320 px viewport. A wide child (a fixed-width picture) is the consumer's. |
| 1.4.12 Text Spacing | The rules set no height and no overflow; the box is as tall as its tallest child, so overridden spacing grows it (read). |
| 2.4.3 Focus Order | Focusable content keeps DOM order; the layout moves no element out of it. |
| 2.4.11 Focus Not Obscured (Minimum) | A focusable control in an earlier child can be covered by a later opaque child. The package cannot know which children are opaque, so usage rule 4 states it, and no story puts a control under another child; there is no ledger row and no check ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 56). |

**Ledger rows owned:** A11Y-10b only ([ledger.md](../ledger.md)). This spec confirms its **What the package adds** column as written ("As A11Y-10a; the spec states the author's responsibility as a usage rule": usage rule 3 and the play-function assertions). Its **What Yeti does** cell reads that Yeti adds a scrim to a `figure`'s caption and that other text over an image is the author's (`layer/manifest.json:72`; `layer.css:24-34`), the case Yeti's example and ticket 17's incomplete result show ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 57). [upstream-bugs.md](../upstream-bugs.md) row Y11 records that the manifest's a11y note says the layer adds no scrim while its CSS scrims a `figure`'s direct-child `figcaption` (verified *read*, not filed). No new ledger row: the `layer` adds no feature Yeti lacks.

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<figure yetiLayer>
  <img ngSrc="harbour.jpg" width="1200" height="800" alt="Boats in a harbour at dawn" />
  <figcaption yetiLayerChild alignSelf="end">Dawn at the harbour</figcaption>
</figure>
```

Server HTML and the hydrated DOM are the same. The `figure` carries `yetilayer=""`, `class="layer"`, and `data-ngx-yeti-item-layer=""`, and no `data-align`, because `align` is unset. The caption carries `yetilayerchild=""`, `alignself="end"` (the input's static form, no HTML meaning), and `data-align-self="end"`, and no `data-justify-self`. With `align="end"` on the `figure`, the server HTML carries `data-align="end"` and no `align` attribute, because the `removed` binding renders it as absent (section 2).

The server also writes one item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>layouts/layer/layer.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="layer"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts that link at bootstrap. The `layer` has no closed or open state.

The delta from Yeti's docs markup: the consumer writes `yetiLayer` where the docs write `class="layer"`, `align` where they write `data-align`, and `yetiLayerChild alignSelf justifySelf` where they write `data-align-self` and `data-justify-self`.

### 9. Animation

None. The `layer` has no state and no transition, and Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). A consumer may fade a top child (a loading message over a form) with a class-form `animate.enter` or `animate.leave` on that child; that is the consumer's, and the item link stays while the `layer`'s host is connected (ADR 0060 point 4). A `layer` that is server-rendered never takes `animate.enter` (ADR 0011 clause 12). Changing `align`, `alignSelf`, or `justifySelf` at run time moves the children at once, with no transition, as Yeti's CSS has it.

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attribute and markers, and the item link in `<head>` (section 8). Everything at first paint is a host binding (ADR 0011 clause 1). Nothing is **Pre-hydration state**: no person and no Yeti module can change a `data-*` attribute (ticket 26 grilling Q12).
- **Before hydration:** the directives create no node, read no layout, start no timer or observer, and touch no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is `YetiLayer`'s item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** every element is claimed as is; bindings computed from the same inputs give the same values (usage rule 6); 0 style mutations (ADR 0060 point 5, measured for the mechanism). A static `align` is written back and removed again in the same pass (ticket 33 row 6, read), so the final DOM equals the server's (ticket 50 decision 9).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the `layer` and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism). A `layer` and its placed children share one **Hydration boundary** unless a child is the top-level element of a deferred block inside the `layer`, in which case that child hydrates with its block and keeps its server markers until then.
- **`hydrate never`:** the `layer` is its server HTML and stays styled while its host is connected, whatever live `layer`s do (ADR 0060 point 4; ADR 0045's presence attribute is what the check queries). There is no Angular behaviour to lose; a bound input simply never changes.
- **Client-only `@defer`:** the item file is fetched when `YetiLayer` is constructed, which can show unstyled frames (the children one after another); the consumer closes the gap with `provideYetiStyles({ preload: ['layer'] })` (ADR 0060 point 6; [setup](setup.md)). No entry animation needs the file.
- **Event replay:** the directives declare no listener, so nothing replays and no `jsaction` is added by them.
- **`withI18nSupport()`:** a caption is translated with `i18n` in the consumer's component, and a picture's `alt` with `i18n-alt`. The directives add no `i18n` block; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** inputs are signals and host bindings read them, so a bound `align`, `alignSelf`, or `justifySelf` refreshes with no zone (map, Standing rulings, item 43; ADR 0070 rule 4).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the children are stacked and placed, and a `figure`'s caption has its scrim, because the attributes and the item link are in the server HTML. Nothing is lost: the `layer` has no behaviour. A client-only application gets no such promise.

### 11. Hydration constraints

The `layer` complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; `data-align`, `data-align-self`, and `data-justify-self` come from inputs whose values usage rule 6 keeps equal on both sides; `align` is `null` on both. The one difference during hydration is a static `align` written back and removed again in the same pass ([Research: the decided records against Angular's hydration constraints](../issues/33-research-decided-records-against-hydration-constraints.md) row 6, "at risk", read); the final DOM equals the server's, and Test layer 4 asserts no frame paints with `align` present (ticket 50 decision 9).
- **No direct DOM manipulation:** the directives write nothing to the DOM outside host bindings. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directives change no element. The consumer's markup must be valid as written; for example a `figcaption` is the first or last child of its `figure`, never wrapped in another element, which would also put it out of reach of `figure.layer > figcaption`.
- **`preserveWhitespaces`:** the directives have no template. The grid ignores whitespace text between children.
- **No output branched on the platform:** none.
- **Static attributes the directives bind:** usage rule 5 keeps the consumer from writing them.

### 12. Single-page application

None. The `layer` has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). A fragment link to an element inside a `layer` is the consumer's link and goes through the fragment-links spec like any other. On a route change, a route's `layer`s leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-layer]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders a `layer` again re-inserts it.

### 13. Item file

`yeti-css/css/layouts/layer/layer.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiLayer]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:34`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-layer` has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the cascade-layer statement and the always-loaded group (which holds the `[data-align]`, `[data-align-self]`, and `[data-justify-self]` value rules), and optionally `provideYetiStyles({ preload: ['layer'] })`. The `layer` adds nothing to it. Cross-item files acquired: none (`layer.css` has no selector naming another item; ADR 0060 point 9). A `layer` inside a `card` keeps the card's own caption rule, which is in the card's item file and loaded by the card's directive; an item placed inside a `layer` (`frame`, `badge`) loads its own file through its own directive.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class, attribute, and markers in the DOM, the item link, where children land, and the contrast. It never asserts a private field, the parent token's value, or how the styles service counts. No test depends on a public token's default value ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): geometry is asserted relative to the box and the other children, as Yeti's own `test/browser/layouts/layer.spec.js` does, and contrast is asserted as a ratio from computed colours, never as a token value. Every test runs zoneless (map, Standing rulings, item 43). The four test layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Test layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `layer` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `layer--default`: Yeti's example (a `figure` with an `NgOptimizedImage` and a `figcaption` with `alignSelf="end"`). Asserts `class="layer"` and `data-ngx-yeti-item-layer` on the `figure`, no `data-align` and no `align`, `data-align-self="end"` on the caption and no `data-justify-self`, and no `tabindex` or role added by the package. Asserts the picture and the caption share the box's top-left corner area: the caption's bottom equals the box's bottom and its width the box's, and the box's height equals the taller child's. Asserts the accessibility tree order equals the DOM order. Asserts the caption's contrast (A11Y-10b): its computed text colour against the scrim composited over black and over white, exact formula, unrounded, at least 4.5:1 for both.
- `layer--dark-scheme`: the same markup in a wrapper with the consumer's `color-scheme: dark` (ADR 0004 consequences). Repeats the contrast assertions (ticket 17 measured both schemes).
- `layer--badge`: Yeti's docs' second example, a `div` `layer` with a thumbnail (`alt=""`) and a badge child with `alignSelf="start"`, `justifySelf="end"`, and `yetiPaint="primary"`. Asserts the badge's top and right edges equal the box's and its width is less than half the box's, as Yeti's test does. Asserts the badge's contrast against its opaque panel, at least 4.5:1, in both schemes.
- `layer--settings`: `align` on the `layer` and `alignSelf` and `justifySelf` on one child bound from Storybook controls, with one tall and one short child. Asserts each attribute follows its control and that clearing a control removes it; that `align="end"` puts the short child's bottom on the box's bottom; that `align="baseline"` puts it at the top, as `start` does; and that a child's `alignSelf` and `justifySelf` win over the `layer`'s `align` for that child only.

### Test layer 2: browser-level (`npx nx test <lib>`, `layer.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiLayer, { tagName: 'figure' })`: the host has class `layer` and `data-ngx-yeti-item-layer`, and no `data-align` or `align`; with `bindings` setting `align` to `'end'`, `data-align="end"` follows and no `align` appears; setting it back to `undefined` removes `data-align`.
- While a `YetiLayer` fixture lives, one `<link data-ngx-yeti-styles="layer">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- `createDirective(YetiLayerChild, { tagName: 'span' })`: no marker by default; `alignSelf` bound `'start'` and `justifySelf` bound `'end'` render `data-align-self="start"` and `data-justify-self="end"`; `undefined` removes each; the host carries no presence attribute and acquires no link (ticket 50 decision 6).
- No directive adds a listener to its host.

A small test host covers what `createDirective` cannot: template references `#l="yetiLayer"` and `#c="yetiLayerChild"` resolve; a static `align="end"` on the `layer` renders `data-align="end"` and no `align` attribute (the `removed` kind, building-blocks 1.4); static `alignSelf="end"` and `justifySelf="center"` set the inputs; a part outside any `layer` renders its markers with no error; and the consumer's own `class` on each host is kept.

### Test layer 3: node-level and SSR smoke (`npx nx test <lib>`, `layer.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture whose caption carries `i18n` and whose picture carries `i18n-alt` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the `figure` renders `class="layer"`, `data-ngx-yeti-item-layer`, and `data-align="end"` from a static `align="end"`, and no `align` attribute (building-blocks 1.4: the SSR smoke writes the static form and asserts the attribute is absent); the caption renders `data-align-self="end"`; `<head>` holds one item link with `data-ngx-yeti-styles="layer"`, `data-beasties-skip`, and an `href` ending `layouts/layer/layer.css?v=<pin>`; no element carries a `jsaction` from the package.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the `layer` through the contract mapping: class `layer` has `YetiLayer`; `data-align` has an input whose type is the manifest's `align` vocabulary; `data-align-self` and `data-justify-self` have inputs on `YetiLayerChild` typed by `align` and `self`; the manifest's events for `layer` are empty. A pin move that adds an attribute or marker fails here before any story does.

### Test layer 4: Playwright e2e (three engines in CI)

Storybook half, on the Test layer 1 story ids: at container widths of 600 and 400 px the stacking, the `align` cases, and the corner badge match Yeti's own `layer.spec.js` cases; children have no margins; at a 320 px viewport the page has no horizontal overflow (1.4.10).

Fixture-app half, built with `outputMode: 'server'`, with a `/layer` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences):

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- a `layer` written with a static `align="end"` shows no `align` attribute in any frame recorded from first paint to stable (ticket 50 decision 9);
- with JavaScript disabled the children stack and the caption lands at the bottom with its scrim, as in the Storybook half, and `@axe-core/playwright` with the six tags reports no violation;
- a `layer` inside a client-only `@defer` block with `layer` in the preload list shows no unstyled frame; a `layer` inside a `hydrate never` block stays styled after a live `layer` on the page is removed;
- navigating from the `layer` route to a route without one removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and `docs.md` for the default and badge stories, and its `test/browser/layouts/layer.spec.js` for the geometry cases; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; ticket 17's contrast harness for the formula.

## Out of Scope

- An input per token, or inputs for the caption's scrim, colour, or padding (ADR 0004).
- A scrim, panel, or contrast treatment the package adds to text over a picture other than Yeti's own `figure` caption rule (A11Y-10b: the author owns it; a package rule only if an assertion on Yeti's scrim fails).
- Shared any-element `[yetiAlignSelf]` or `[yetiJustifySelf]` directives (ADR 0070, considered options; ticket 26 grilling Q6).
- Any check that a part sits on a direct child, that a `layer` has two children, or that text over a picture has a treatment. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- A viewport-keyed input or any JavaScript size read (building-blocks 1.7).
- Taking a child out of the flow and centring it over the rest: that is the `overlay` item's spec.
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiLayer]` with `align`; part directive `[yetiLayerChild]` with `alignSelf` and `justifySelf` | building-blocks Part 2 row 11; ticket 26 rows 42 to 44 |
| `data-align` is kind R; `data-align-self` and `data-justify-self` are kind C (they say where to put the child) | ADR 0070; ticket 26 grilling Q7 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by Yeti's `YetiAlign` and `YetiSelf`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2 |
| `align` is the `removed` kind: `'[attr.align]': 'null'` | building-blocks 1.4; ticket 26 row 42 and grilling Q15 |
| The part injects `yetiLayerToken` optionally with `skipSelf` | ADR 0070 kind C; building-blocks 1.9 |
| `exportAs` on both; class names with no collision | building-blocks 1.3; ADR 0080 points 3 and 4 |
| Entry point `ngx-yeti/layer` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 11 |
| Tokens are the consumer's | ADR 0004 |
| Item file as a counted link; presence attribute `data-ngx-yeti-item-layer` on the item directive only | ADR 0060 points 2 to 6; ADR 0045; ticket 50 decision 6 |
| `injectYetiItemStyles('layer')` last in the constructor | [setup](setup.md); ticket 50 decisions 42 and 45 |
| Contrast asserted in play functions, 4.5:1 for text; the author's responsibility as a usage rule | ADR 0015 points 3 and 4; ledger A11Y-10b; ticket 50 |
| A translucent scrim's contrast bounded over black and white | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 55 |
| Usage rule against focusable content under a later opaque child | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 56 |
| Static `align` accepted through hydration, with an e2e frame check | ticket 50 decision 9 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A captioned picture:

```html
<figure yetiLayer>
  <img ngSrc="harbour.jpg" width="1200" height="800" alt="Boats in a harbour at dawn" i18n-alt />
  <figcaption yetiLayerChild alignSelf="end" i18n>Dawn at the harbour</figcaption>
</figure>
```

A badge in the corner of a thumbnail, on a solid panel:

```html
<a yetiLayer routerLink="/trails/valley">
  <img ngSrc="valley-thumb.jpg" width="320" height="200" alt="The valley trail" />
  <span yetiLayerChild alignSelf="start" justifySelf="end" yetiPaint="primary" i18n>New</span>
</a>
```

```ts
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgxYetiPaint } from 'ngx-yeti/box';
import { YetiLayer, YetiLayerChild } from 'ngx-yeti/layer';

@Component({
  selector: 'app-trail-card',
  imports: [NgOptimizedImage, RouterLink, NgxYetiPaint, YetiLayer, YetiLayerChild],
  templateUrl: './trail-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrailCard {}
```

A loading message over a form, centred while the form stays in flow and sets the height: `<div yetiLayer><form>...</form> @if (saving()) { <p yetiLayerChild alignSelf="center" justifySelf="center" yetiPaint="secondary" role="status">Saving</p> }</div>`. The form's controls are under the message while it shows, so the consumer also makes the form `inert` while saving (usage rule 4).

A child moved from state: `<span yetiLayerChild [justifySelf]="corner()">`.

A page whose `layer` renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['layer'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `layouts/layer/layer.css`, loaded by `YetiLayer` as a counted link (section 13). The consumer writes nothing for the `layer` beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps `data-align`, `data-align-self`, and `data-justify-self` values to the private tokens; `tokens/color.css` declares `--yeti-color-scrim` and `--yeti-color-text`; `tokens/space.css` the spacing tokens.
3. **Cross-item rules:** none in `layer.css`. `card.css` has its own rule for a `figure.layer` that is a card's first child; it is the card's and loaded by the card's directive.
4. **Tokens:** reads four public tokens, writes none (section 2).
5. **What breaks without the item file:** the children render one after another in normal flow with their own margins, a caption sits under its picture with no scrim, the markers do nothing, and nothing errors.
6. **Tailwind name collision:** none known. building-blocks 1.13 lists `container`, `grid`, `table`, and `hidden`, not `layer`, and ticket 24's prototype found class collisions only for the first three (`prototypes/yeti-tailwind/results/collisions.json`, read). The markers `data-align-self` and `data-justify-self` are among the attributes that prototype checked, which found one attribute collision, `hidden`, and none for them (read). Tailwind's `@layer` at-rule is a cascade layer and has nothing to do with the `layer` class.

### Platform features to adopt when the browser target moves

None. The one feature `layer.css` uses, `grid-template-areas`, is inside Baseline 2025 (building-blocks 1.2), and the manifest's support block lists it as unguarded and nothing else.

### Single-page-application pieces relied on

None: the `layer` uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
