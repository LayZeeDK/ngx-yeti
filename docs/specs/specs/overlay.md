# Spec: overlay (layout)

Ticket: [63. Spec: overlay (layout)](../issues/63-spec-overlay.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 13 and Part 1, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 48 to 51 and grilling Q6, Q15, and Q16, [Decide: the spec list](../issues/11-decide-spec-list.md) row 13 and its reserved name, [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md), and [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decisions 6 and 9. The item owns no [ledger.md](../ledger.md) row. `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x). The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 50 and 67), and each is cited where it applies.

In this spec, **Overlay** means only Yeti's `overlay` layout ([CONTEXT.md](../CONTEXT.md); ticket 11). It is not a popover, a dialog, the top layer, or CDK Overlay.

## Problem Statement

Yeti's `overlay` "holds one thing on top of another without taking part in the layout underneath: a 'sold out' stamp on a product image, a loading message over a form, a notice over the whole page with `data-fixed`. It is the positioning half of a dialog; the behaviour half is a component's job" (`Y/src/layouts/overlay/docs.md`). It is one **Identity class**, `overlay`, on the box being covered, which becomes `position: relative`. Two attributes configure it: `data-gap`, the least space kept between the held child and the box's edges, and `data-fixed`, which centres the held child on the viewport instead. Two **Markers** go on one direct child, the held child: `data-over`, which takes it out of the flow and centres it over the box, and `data-fill`, which makes it cover the box instead of sitting centred in it. It has no **Module** and no events (`Y/src/layouts/overlay/manifest.json`, `overlay.css`).

An application developer using the package cannot write `class="overlay"`, `data-gap`, `data-fixed`, `data-over`, or `data-fill`. A consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). A misspelt `data-gap="large"` is silent in Yeti and must fail to compile here ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `overlay` **Item file** loaded while an overlay is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it the held child is an ordinary block in the flow below the content it should cover, with no error.

The overlay draws over other content, so it can hide what it covers. Yeti calls it "Positioning only" and sends anything modal to the dialog and the tooltip (manifest `a11y.notes`). The package must keep it a positioning primitive in every rendering mode. It must also state what the consumer owns when a held child covers focusable content or holds more than fits.

## Solution

Two directives in the secondary entry point `ngx-yeti/overlay` (building-blocks Part 2 row 13; 1.3):

- **`YetiOverlay`**, the **Item directive**, on `[yetiOverlay]`. It binds `overlay` as a static host class, `data-gap` from a `gap` input typed `YetiGap`, and `data-fixed` from a boolean `fixed` input. It sets the static presence attribute `data-ngx-yeti-item-overlay` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)). It acquires the `overlay` item file when it is created, on the server too, and releases it when it is destroyed (ADR 0060 point 2). It provides `yetiOverlayToken`.
- **`YetiOverlayChild`**, the **Part directive** for the held child, on `[yetiOverlayChild]`. It binds `data-over` from a boolean `over` input and `data-fill` from a boolean `fill` input (ticket 26 rows 50 and 51, kind C).

The developer writes `<div yetiOverlay>` where Yeti's docs write `<div class="overlay">`, and `<p yetiOverlayChild over>` where they write `<p data-over>`. A veil is `<div yetiOverlayChild over fill>`. Unset inputs render nothing, so Yeti's default gap (`md`) applies from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1).

Everything else is Yeti's CSS and the platform. The directives are **types only**: no listener, no render callback, no service, and no DI beyond the part's optional parent token. Centring is `top: 50%; left: 50%; translate: -50% -50%` in CSS, so no script measures the box or the viewport, and the overlay renders the same on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block. Focus management, dismissal, and inertness of the content underneath are not the overlay's: the dialog and the tooltip provide them, and for a non-modal veil the consumer writes `inert` on what is covered, as Yeti's visibility guide says (`Y/src/guides/visibility.md:68`).

## User Stories

1. As an application developer, I want to make an element an overlay with one directive attribute, so that I never write Yeti's `overlay` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="overlay"` in the DOM, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want to mark the held child with `yetiOverlayChild over`, so that it leaves the flow and sits centred over the box.
4. As an application developer, I want the other children to keep their normal flow and size, so that the held child changes nothing about the box it covers.
5. As an application developer, I want the held child centred whatever its size, so that a short stamp and a long message are both centred.
6. As an application developer, I want a typed `gap` input drawn from Yeti's `gap` vocabulary, so that the edge gap uses the same values as every other layout and a misspelt value fails to compile.
7. As an application developer, I want the held child never larger than the box minus the gap on each side, so that it never spills out of what it covers.
8. As an application developer, I want a held child whose content is larger than that cap to scroll inside itself, so that nothing is cut off.
9. As an application developer, I want `fill` beside `over` to make the held child cover the whole box, so that I can build a veil, a dimmer, or a loading state.
10. As an application developer, I want a filled held child to keep its own content where its own layout puts it, so that I can centre a message inside a veil with a layout directive.
11. As an application developer, I want `fixed` on the overlay to centre the held child on the viewport and keep it there while the page scrolls, so that a page-wide notice needs no script.
12. As an application developer, I want `fixed`, `over`, and `fill` to take `booleanAttribute`, so that a bare attribute turns them on and `[fixed]="saving()"` binds them.
13. As an application developer, I want an unset `gap` and a false `fixed`, `over`, or `fill` to render no attribute, so that Yeti's own default applies and my server HTML stays Yeti's minimal markup.
14. As an application developer, I want to toggle `over` from state, so that a child can move between the flow and the held position.
15. As an application developer, I want to bind every input from signals, so that the layout follows my state under zoneless change detection.
16. As an application developer, I want the held child to stay centred in right-to-left pages, so that the layout needs no direction handling.
17. As an application developer, I want to put `yetiOverlay` beside another item's directive on one element (a `box`, a `frame`), so that a framed image can be the box being covered.
18. As an application developer, I want `yetiOverlayChild` beside another item's directive on the held child (a `box` with a paint, a `cover`), so that Yeti's own "sold out" stamp and veil examples are expressible.
19. As an application developer, I want to know which of my other directives fight the overlay's centring (a `stack` or `cover` that sets a least height, a `lift` or a moving `enter` that sets `translate`), so that I do not build a veil that is taller than its box or a stamp that jumps.
20. As an application developer, I want a static `fill` on any held child, an `svg` included, to do nothing beyond the input, so that the SVG `fill` attribute does not paint my element.
21. As an application developer, I want the default edge gap to follow `--yeti-space-md`, so that one spacing token governs it.
22. As an application developer, I want the package to offer no input per token, so that the overlay's API stays the size of Yeti's contract.
23. As an application developer, I want a value newer than the pin to be bindable through `$any`, so that I am not blocked until the package's pin moves.
24. As an application developer, I want the overlay's item file loaded when the first overlay renders and removed after the last one leaves, so that I do not import `overlay.css` globally.
25. As an application developer, I want the item file in the server HTML when a server-rendered page has an overlay, so that the first paint already holds the child over the box.
26. As an application developer, I want an overlay laid out with JavaScript off under SSR and prerendering, so that a stamp or a notice reads correctly before any script runs.
27. As an application developer, I want hydration to change nothing on an overlay or its held child, so that I get no `NG05xx` error and no jump.
28. As an application developer, I want an overlay inside a `@defer (hydrate on ...)` block to stay laid out before and after the block hydrates, so that incremental hydration never puts the held child back into the flow.
29. As an application developer, I want an overlay inside a `hydrate never` block to keep its styles for as long as it is on the page, so that a dehydrated stamp stays in place when a live overlay elsewhere leaves.
30. As an application developer, I want to know that an overlay inside a client-only `@defer` block needs `overlay` in the preload list for a flash-free first paint, so that the held child never shows in the flow.
31. As an application developer, I want a loading veil I insert with `@if` to be able to take a class-form `animate.enter` and `animate.leave`, so that it can fade in and out.
32. As an application developer using `withI18nSupport()`, I want a translated stamp or message to hydrate without being re-rendered, so that localised pages keep the server's DOM.
33. As an application developer, I want template references (`#o="yetiOverlay"`, `#h="yetiOverlayChild"`), so that the overlay follows the package's `exportAs` rule.
34. As an application developer, I want to import both directives from `ngx-yeti/overlay`, so that a `@defer` block can split them with the rest of the item.
35. As an application developer, I want the usage rules stated (one held child, a direct child, `fill` only with `over`, `inert` on covered controls, the dialog for anything modal), so that I use the overlay as Yeti intends.
36. As a screen-reader user, I want the held child read where it is in the source, so that the stamp or message comes in the order the author wrote it.
37. As a screen-reader user, I want the overlay to add no role, name, or announcement, so that the page's own semantics are what I hear.
38. As a keyboard user, I want controls hidden under a veil to be out of the Tab order while they are covered, so that focus never lands on something I cannot see.
39. As a keyboard user, I want a held child whose content scrolls to be reachable and scrollable from the keyboard, so that I can read all of it.
40. As a keyboard user, I want the overlay to add no tab stop and to keep focus in DOM order, so that the held child does not change where Tab goes.
41. As a low-vision user, I want the held child to scroll inside itself rather than overflow when I zoom text to 200 %, so that nothing is clipped.
42. As a low-vision user, I want an overlay to reflow at 320 CSS pixels with no horizontal scrolling, so that a stamp works on a narrow screen.
43. As a package maintainer, I want the contract check to cover the overlay's class, both attributes, both markers, and its empty event list, so that a pin move that adds or changes one fails before release.
44. As a package maintainer, I want the SSR smoke to assert the server HTML of an overlay, its held child, and its item link, so that the first paint is proven.
45. As a package maintainer, I want the fixture app to render an overlay in a prerendered route and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
46. As a package maintainer, I want the geometry tests to follow Yeti's own `overlay.spec.js` cases, so that the package proves the same layout Yeti proves.
47. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default does not fail a test for no reason.
48. As a package maintainer, I want the class names `YetiOverlay` and `YetiOverlayChild` checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/layouts/overlay/manifest.json`, `overlay.css`, `docs.md`, and `example.html`, and in `Y/src/layouts/attributes.css`, `Y/src/tokens/space.css`, and `Y/schema/vocabulary.json`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `overlay`, `layout`, `Boxes and Stacks` |
| `class` | `overlay` |
| `attributes` | `data-gap`: enum, vocabulary `gap` (29 values), default `md`, "The least space kept between the held child and the edges of the box". `data-fixed`: boolean, no default, "Center the held child over the viewport instead of this box, and keep it there while the page scrolls." |
| `classes` | empty |
| `children` | `> *` (min 2, no max): "The content underneath, in normal flow, and one held child"; `> [data-over]` (min 1, max 1): "Exactly one child carries data-over; it leaves the flow and is centered over the box." |
| `markers` | `data-over`: boolean, `on: "> *"`, "Lifts the child out of the flow and centers it over the box; exactly one child carries it." `data-fill`: boolean, `on: "> [data-over]"`, "On the same child: cover the box rather than sit centred in it, which is what a veil, a dimmer or a loading state wants. Positioning only, so a veil that wants its own content centred puts a layout inside itself." |
| `tokens` | public: `--yeti-space-md` ("The default edge gap"); private: `--_yeti-gap` |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "Positioning only. The held child stays in reading order where it is in the source. A held child that interrupts the page needs focus management and a way to dismiss it, which the dialog and tooltip components provide; use those rather than this primitive alone for anything modal." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: `translate property`; `guarded`: empty |
| `since` | `7.0.0` |

The rules, in `@layer yeti.layouts`: `.overlay` is `position: relative`; `.overlay:not([data-gap])` sets the private gap to `--yeti-space-md`; `.overlay > [data-over]` is `position: absolute` at `top: 50%; left: 50%` with `translate: -50% -50%`, `margin: 0`, `max-inline-size` and `max-block-size` of `calc(100% - 2 * var(--_yeti-gap))`, and `overflow: auto`; `.overlay > [data-over][data-fill]` sets `inset: 0`, `translate: none`, and both size caps to `none`; `.overlay[data-fixed] > [data-over]` is `position: fixed`. The value rules for `data-gap` are in the **Always-loaded group**'s `layouts/attributes.css` (`:6-37`); `data-fixed`, `data-over`, and `data-fill` have no rule outside `overlay.css` (checked with `rg`). Yeti's committed `src/guides/layouts.md` lists all four names with overlay (`:79`, `:80`, `:82`, `:90`), so the guide and the manifest agree.

Attributes left to the consumer: none (ticket 26 rows 48 to 51). The elements, their semantics, any `role` or live region on a message, and `inert` on covered content are the consumer's (usage rules 4 to 6).

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `overlay` | static host class on `[yetiOverlay]` (`YetiOverlay`) | always | ADR 0003 point 1; Part 2 row 13 |
| Attribute `data-gap` | least space between the held child and the box's edges | input `gap` on `yetiOverlay`: `YetiGap \| undefined`, bound `[attr.data-gap]`, `null` when unset | unset renders nothing; Yeti's `md` applies. `gap` is not an HTML attribute | ticket 26 row 48 (R) |
| Attribute `data-fixed` | centre on the viewport, fixed | input `fixed` on `yetiOverlay`: `boolean` with `booleanAttribute`, bound `[attr.data-fixed]` as `''` when true and `null` when false | default `false`, renders nothing. `fixed` is not an HTML attribute | ticket 26 row 49 (R) |
| Marker `data-over` (on `> *`) | the held child | input `over` on `yetiOverlayChild`: `boolean` with `booleanAttribute`, `[attr.data-over]` as `''` or `null` | default `false`, renders nothing. `over` is not an HTML attribute | ticket 26 row 50 (C) |
| Marker `data-fill` (on `> [data-over]`) | the held child covers the box | input `fill` on `yetiOverlayChild`: `boolean` with `booleanAttribute`, `[attr.data-fill]` as `''` or `null` | default `false`, renders nothing. Static form: `inert` on every host, `svg` included (below) | ticket 26 row 51 (C); building-blocks 1.4 |
| Children `> *` | the content underneath | no directive for a child with no marker | not applicable | ticket 26 grilling Q6 |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Token `--yeti-space-md` | default edge gap | the consumer's; the package writes none | not applicable | ADR 0004 |
| Token `--_yeti-gap` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-overlay=""` on `[yetiOverlay]` only | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2; ticket 50 decision 6 |
| Injection token | not Yeti's | `yetiOverlayToken`, provided by `YetiOverlay` | not applicable | ADR 0070 kind C; building-blocks 1.9 |

The `inert` kind for `fill` (building-blocks 1.4; ticket 26 row 51, "SVG `fill`: `inert` unless the element is an `svg`", which grilling Q15 leaves each spec to confirm on its own hosts). On an HTML element `fill` means nothing. On an `svg` held child, the SVG `fill` presentation attribute would paint, but only with a valid paint value. The static forms `booleanAttribute` reads as true are a bare `fill` (`''`) and `fill="true"`, and neither is a valid paint, so the browser ignores both. Measured on 2026-10-03 against Yeti's built CSS at the pin, in Chromium and Firefox: a `circle` inside an `svg` held child with `fill=""`, with `fill="true"`, and with no `fill` had the same computed `fill`. So the directive binds nothing for `fill`, a static `fill` stays on the host beside `data-fill`, and a bound `[fill]` renders no `fill` attribute. A static `fill="red"` on an `svg` would paint and also set the input true; usage rule 7 rules it out. No HTML-named input of this item is of the `removed` kind, so ticket 50 decision 9 needs no e2e case here.

**Module replaced:** none. Yeti's `overlay` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 13, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads `--yeti-space-md` for its default gap, and through `attributes.css` the `--yeti-space-*` token (or fluid pair) behind whichever `data-gap` value is bound. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`. They are derived tokens, so each also takes effect on one overlay and its descendants (`Y/src/guides/theming.md:38`). Yeti's docs pair a veil with `--yeti-color-scrim`, "the framework's wash for exactly this" (`docs.md`, How it works); the overlay does not read it, and a consumer paints a veil with it in their own stylesheet or through an element's paint. **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- `YetiOverlay` provides `yetiOverlayToken` (`InjectionToken<YetiOverlay>`, declared with `import type`, exported from `ngx-yeti/overlay`) as `{provide: yetiOverlayToken, useExisting: YetiOverlay}` (building-blocks 1.9; 1.3's token naming).
- `YetiOverlayChild` injects it with `{optional: true, skipSelf: true}` ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) kind C). It reads nothing from it in the first milestone: no behaviour depends on the parent, and the **In-item check** that would use it belongs to a later milestone (map, Milestones). A part outside an overlay renders its markers and nothing else happens, because Yeti's rules are `.overlay > [data-over]`.
- Only `YetiOverlay` sets a presence attribute and acquires the item file; `YetiOverlayChild` does neither, because Yeti's rules for the held child apply only under the root's class, and the root's attribute keeps the file loaded ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 6).
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"). A consumer composes by writing directives beside each other. On the overlay's element: `yetiBox` (both declare `gap: YetiGap`, so one `gap` attribute feeds both and renders the one `data-gap` Yeti means: the box's padding and the overlay's edge gap at once; ticket 26 grilling Q16; building-blocks 1.4, shared vocabularies) or `yetiFrame` around an image. On the held child: `yetiBox` and `yetiPaint`, as Yeti's example does, or a layout such as `yetiCover` inside a veil, as Yeti's docs do.
- One shared input name needs care. `fill` is declared by `yetiOverlayChild` and by `yetiStack` (ticket 26 row 63), both `boolean`, so the compiler accepts them on one element and one `fill` attribute sets both. Yeti gives the word two meanings: "It is the stack that fills; on a child of an `overlay`, the same word means the child covers its box" (`Y/src/layouts/stack/docs.md`). On one element both apply: measured on 2026-10-03 in Chromium and Firefox, a `.stack` held child with `data-fill` in a 200 px box was 800 px tall, the viewport's height, because `.stack[data-fill]` sets a least block size of `--yeti-cover-height` (`stack.css:25`). Usage rule 8 keeps the two apart, and the [stack](stack.md) spec carries the same rule ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 50).
- The only other injection is the root styles service of ADR 0060, reached by `injectYetiItemStyles('overlay')` from `ngx-yeti/styles` as the last statement of the constructor ([setup](setup.md); ticket 50 decisions 42 and 45), through which `YetiOverlay` acquires and releases the item file. That service is the [setup](setup.md) spec's and ADR 0060's.
- Generated ids and the platform's relationship attributes: none. The overlay renders no `id` and references none, so it does not use [generated-ids](generated-ids.md).

### 4. API

| Member | `YetiOverlay` | `YetiOverlayChild` |
| --- | --- | --- |
| Class name | checked at the Pin: `yeti.d.ts` exports 46 names and neither is among them, so each takes `Yeti`, not `NgxYeti` (ADR 0080 point 4; the list the orchestrator checked on 2026-10-03 from the build ADR 0080 used) | as left |
| Selector | `[yetiOverlay]` | `[yetiOverlayChild]` |
| `exportAs` | `yetiOverlay` | `yetiOverlayChild` |
| Entry point | `ngx-yeti/overlay` (building-blocks 1.3; ADR 0011 clause 10) | same |
| Inputs | `gap: YetiGap \| undefined` (Yeti default `md`); `fixed: boolean`, `booleanAttribute`, default `false` | `over: boolean`, `booleanAttribute`, default `false`; `fill: boolean`, `booleanAttribute`, default `false` |
| Host | static `class: 'overlay'`; static `data-ngx-yeti-item-overlay: ''`; `[attr.data-gap]` from `gap`, `null` when unset; `[attr.data-fixed]`: `''` when `fixed()` is true, else `null` | `[attr.data-over]`: `''` when `over()` is true, else `null`; `[attr.data-fill]`: `''` when `fill()` is true, else `null`. No class, no presence attribute, no `[attr.fill]` binding (`inert`) |
| Providers | `yetiOverlayToken` | none |
| Injection | the ADR 0060 styles service, through `injectYetiItemStyles('overlay')` | `yetiOverlayToken`, `{optional: true, skipSelf: true}` |
| Models, outputs, methods, listeners | none | none |
| Lifecycle | acquires the `overlay` item file, on the server too, with `injectYetiItemStyles('overlay')` as the last statement of its constructor (ticket 50 decisions 42 and 45) and releases it through `DestroyRef` (ADR 0060 point 2; building-blocks 1.9) | none |

Types come from the generated `yeti-types.ts` copy of Yeti's typings at the pin, re-exported by name (ADR 0060 point 10; ADR 0080 point 5; building-blocks 1.3). The selectors are the ones Part 2 row 13 and ticket 26 rows 50 and 51 name; this spec fixes them, as ticket 26 left part selectors to the specs. No input changes a Yeti default. `fill` renders `data-fill` whether or not `over` is true, as ADR 0070 rule 3 renders every declared attribute; Yeti's rule needs both (`.overlay > [data-over][data-fill]`), so `fill` alone does nothing (usage rule 3).

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiOverlay` on the box to be covered, with at least two direct children: the content underneath and the held child (manifest `children`, `> *` min 2). A component's host element counts as a child; `@if`, `@for`, `@defer`, and `ng-container` add no element.
2. Mark exactly one direct child with `yetiOverlayChild over` (manifest `children`, `> [data-over]` min 1, max 1). Yeti's selector is a child selector, so a marker on a grandchild does nothing. Two held children are both centred on the same point (read in `overlay.css`, not measured). Write `<app-badge yetiOverlayChild over>`, not the directive inside the component's template.
3. Write `fill` only beside `over` on the same element (manifest `markers`, `data-fill` on `> [data-over]`).
4. For anything modal, or anything that interrupts the page and needs focus management or a way to dismiss it, use the [dialog](../issues/81-spec-dialog.md) or the [tooltip](../issues/92-spec-tooltip.md), not the overlay (manifest `a11y.notes`; Part 2 row 13). A `fixed` held child is not in the top layer and does not make the page inert.
5. When a held child covers focusable content, make the covered content `inert` for as long as it is covered, for example `[attr.inert]="saving() ? '' : null"` on a wrapper of the covered controls, as Yeti's visibility guide says for "the page behind something — a custom overlay you built yourself, a form region disabled while a request is in flight" (`Y/src/guides/visibility.md:68`). Never put `inert` on the overlay itself, which would also make the held child inert. This is what keeps a focused control from being hidden under the veil (WCAG 2.4.11; section 7).
6. If a held child's content can be larger than the box minus the gap, it scrolls inside itself (`overflow: auto`), so it must be a **Scroll region**: the consumer gives it `tabindex="0"`, a role such as `region`, and a name ([CONTEXT.md](../CONTEXT.md); ADR 0015 point 4). Ticket 17 measured axe's serious `scrollable-region-focusable` violation on Yeti's own example when a missing image let the held child overflow (research section 2.1). A message whose content always fits needs none of this. A status message such as "Saving..." is the consumer's live region (`role="status"`, WCAG 4.1.3); the package adds no role.
7. Write `fill` bare or bound (`fill`, `[fill]="saving()"`), never with a paint value such as `fill="red"`, which on an `svg` held child would paint it (section 2).
8. Do not write `yetiStack` and a filled `yetiOverlayChild` on one element: the one `fill` sets both, and the stack's meaning makes the held child at least as tall as the viewport (section 3, measured). Put the stack inside the held child instead. A `yetiCover` as a veil has the same least height by default; give that element `--yeti-cover-height: auto` (Yeti's own "only as tall as its content", `Y/src/tokens/tokens.json:124`) so the veil is the box's height (measured; section 8; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 67, [upstream-bugs.md](../upstream-bugs.md) row Y10).
9. On a centred held child (`over` without `fill`), do not use anything that sets `translate`: `yetiLift` (`lift.css:28`), the `rise`, `fall`, and `slide` arrivals of `yetiEnter` (`enter.css:122-136`), or `yetiAttention="shake"` (`attention.css:24-27`). Each replaces the centring `translate: -50% -50%` while it runs, so the child leaves the centre (read, not measured). The `fade` and `scale` arrivals set no `translate`. A moving element can go inside the held child instead. A filled held child has `translate: none`, so the rule does not apply to it.
10. With `fixed`, the held child centres on the viewport unless an ancestor of the overlay establishes a containing block for fixed-position descendants: a `transform`, `translate`, `scale`, or `filter` other than none, `will-change` of one of them (Yeti's `lift` with `data-lift="scale"` sets `will-change: scale`, `lift.css:42`), or `contain: layout` or `paint` (CSS Positioning and CSS Will Change, read). A query container does not: measured on 2026-10-03 in Chromium and Firefox, a fixed held child inside a `.container` (`container-type: inline-size`) still centred on the viewport.
11. Do not write `class="overlay"`, `data-gap`, `data-fixed`, `data-over`, `data-fill`, or `data-ngx-yeti-item-overlay` statically. The directives bind them, and hydration writes a static attribute again before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"; ADR 0070 consequences). A value newer than the pin goes through `[gap]="$any('new')"` (ADR 0070).
12. Bind `gap`, `fixed`, `over`, and `fill` from values that are the same on the server and the client, never from a browser-only read; the hydration constraints require the same DOM on both sides.
13. Import every directive class the template writes. A **Forgotten import** of `YetiOverlayChild` with a static `over` renders the held child in the flow with no error; only a bound input (`[over]`, `[gap]`) or a template reference makes the compiler report it (NG8002, NG8003) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `overlay` | Nearest in Angular Material and CDK |
| --- | --- | --- |
| Shape | an item directive on the consumer's box, plus one part directive on the held child, both in place in the consumer's markup | none in Material. CDK Overlay's `GlobalPositionStrategy` centres a pane on the viewport (`centerHorizontally()`, `centerVertically()`, `NC/src/cdk/overlay/position/global-position-strategy.ts:162`, `:174`), but it moves the content into a container at the end of `body` |
| Styling | Yeti's item file, loaded per item; tokens in the consumer's stylesheet | the overlay container's structural styles |
| Accessibility | none of its own: positioning only; the consumer's `inert` and Scroll region rules (usage rules 5 and 6) | behaviour lives in its users (Dialog's focus trap and restore); the pane adds a backdrop when asked (`hasBackdrop`, `overlay-config.ts:25`) |
| API | a typed `gap`, a boolean `fixed`, boolean `over` and `fill` on the part, `exportAs` | a position strategy object, `hasBackdrop`, `disposeOnNavigation` (`overlay-config.ts:62`) |

Nothing from CDK's API applies. CDK Overlay is a service that moves content out of the consumer's markup and is not used anywhere in the package (building-blocks 1.2, "CDK Overlay ... are not used"; 1.8). The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 13; building-blocks 1.2). The reason, row 1's, which row 13 takes: Yeti's CSS does the whole job; the directives add the class, the typed attributes and markers, the item-file acquisition, and `exportAs`. Row 13 adds: "anything modal is the dialog's". The one unguarded feature the manifest lists, the individual `translate` property, is inside Baseline 2025 (`individual-transforms`, Baseline high 2022, in [Research: Angular 22's browser baseline against what Yeti expects](../research/browser-baseline-vs-yeti.md)), as are absolute and fixed positioning and `overflow`. No Aria pattern applies (the layout has no role), and no CDK piece is used: there is no id, focus, keyboard, observer, direction read, or measurement in script. Centring with `left: 50%` and a `-50%` translate is symmetric, so right-to-left needs no `Directionality` (Yeti's "stays centered under direction: rtl" case, `Y/test/browser/layouts/overlay.spec.js`).

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The overlay adds no role, state, or property, and no tab stop. Anything modal is the dialog's (usage rule 4).
- **Keyboard:** none from the package. Focus moves through the content in DOM order; a held child that scrolls is a consumer Scroll region (usage rule 6).
- **Names:** none. A held child that is a region or a status message carries the consumer's name or role.
- **Hidden content:** the package uses no `hidden`, `inert`, or `aria-hidden`. Covered content is made `inert` by the consumer (usage rule 5), the form Yeti's guide names, and never `aria-hidden` (building-blocks 1.10).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The elements are the consumer's; the directives add no role. |
| 1.3.2 Meaningful Sequence | "The held child stays in reading order where it is in the source" (manifest `a11y.notes`): positioning moves the box, not the DOM. Layer 1 asserts that the accessibility tree order equals the DOM order. |
| 1.4.3 Contrast (Minimum) | The held child's text is drawn on the consumer's background (Yeti's example paints it `alert`). Text over content underneath is the arrangement axe left `color-contrast` incomplete for on `layer` (ticket 17, section 2.1), so the default story's play function asserts the held child's text against its own painted background at 4.5:1 with the exact formula (ADR 0015 point 3). |
| 1.4.4 Resize Text | The held child never grows past the box minus the gap; it scrolls inside itself (`overflow: auto`), so zoomed text is never clipped. Layer 4 asserts at 200 % text zoom that the held child's `scrollHeight` reaches its content and the child stays inside the box. |
| 1.4.10 Reflow | Nothing sets an inline size beyond the cap, which follows the box. Ticket 17 found no page-level horizontal scroll on the overlay example at 320 x 640 (research section 2.4, 46 of 49 pages clean; `overlay` was not among the three). Layer 4 repeats it. |
| 1.4.11 Non-text Contrast | The overlay draws nothing. |
| 2.1.1 Keyboard | A held child that scrolls must be a Scroll region with `tabindex="0"` (usage rule 6); ticket 17's measured `scrollable-region-focusable` violation is the failure this prevents. |
| 2.4.3 Focus Order | Focusable content keeps DOM order. |
| 2.4.11 Focus Not Obscured (Minimum) | A held child can hide a focused control. Usage rule 5 makes covered controls `inert`, so no covered control can take focus; a stamp that covers no control needs nothing. Layer 1 asserts it on the veil story. |
| 4.1.3 Status Messages | A loading message is the consumer's `role="status"` (usage rule 6); the package adds none. |

**Ledger rows owned:** none. The package adds no feature Yeti lacks: the two requirements above are on the consumer's markup, as Yeti's own notes and guide put them, and are stated as usage rules under ADR 0015 point 4. Ticket 17 classed the overlay with the layouts that have no focusable content and no semantics of their own (research section 3), and Part 2 row 13's Ledger column is "none".

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<div yetiOverlay>
  <img ngSrc="lake.jpg" width="1200" height="800" alt="A lake at dawn" />
  <p yetiBox yetiPaint="alert" yetiOverlayChild over i18n>Sold out</p>
</div>
```

Server HTML and the hydrated DOM are the same. The `div` carries `yetioverlay=""`, `class="overlay"`, and `data-ngx-yeti-item-overlay=""`, and no `data-gap` or `data-fixed`. The paragraph carries `yetioverlaychild=""`, `over=""`, `data-over=""`, no `data-fill`, and the box's and the paint's own class and attributes, with the box's presence attribute and no presence attribute of the overlay (section 3). The image carries `NgOptimizedImage`'s attributes (building-blocks 1.2, images rule). The server also writes the item links into `<head>` in Yeti's order: for the overlay, `rel="stylesheet"`, `href` `<url>layouts/overlay/overlay.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="overlay"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided, followed by the `box` link, which comes later in `yeti.css` (ADR 0060 points 2, 3, and 5; `Y/src/yeti.css:28`, `:29`). The client adopts the links at bootstrap.

A veil, after Yeti's docs ("How it works"), with the covered controls made inert:

```html
<form yetiOverlay>
  <div [attr.inert]="saving() ? '' : null">
    <label for="email" i18n>Email</label>
    <input id="email" type="email" />
  </div>
  @if (saving()) {
    <div yetiCover yetiOverlayChild over fill class="veil" animate.enter="veil-in">
      <p yetiCoverChild center role="status" i18n>Saving...</p>
    </div>
  }
</form>
```

with `.veil { --yeti-cover-height: auto; background: var(--yeti-color-scrim); }` in the consumer's stylesheet. Yeti's docs example puts `class="cover"` on the veil with no such token, and its veil is then as tall as the viewport, not the form: measured on 2026-10-03 against Yeti's built CSS at the pin, in Chromium and Firefox, the docs veil was 800 px tall over a 76 px form at an 800 px viewport, and with `--yeti-cover-height: auto` it was 76 px with the message centred. This is [upstream-bugs.md](../upstream-bugs.md) row Y10 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 67). The `role="status"` element is inserted together with its text, so whether a screen reader announces it depends on the reader; a consumer who needs a reliable announcement keeps the live region in the DOM and changes its text (read, WAI-ARIA live regions; the consumer's choice). The veil is client-inserted, so it may take a class-form `animate.enter` with a class of the consumer's own (`veil-in`, an `opacity` keyframe in the consumer's stylesheet; ADR 0011 clause 12; building-blocks 1.6 point 2).

The delta from Yeti's docs markup: the consumer writes `yetiOverlay` where the docs write `class="overlay"`, `gap` and `fixed` where they write `data-gap` and `data-fixed`, and `yetiOverlayChild over` and `fill` where they write `data-over` and `data-fill`. The overlay has no closed or open state of its own: a held child shown and hidden by `@if` is the consumer's state.

### 9. Animation

None of the overlay's own. It has no state and no transition, and Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). A held child the consumer inserts or removes with `@if` may take a class-form `animate.enter` or `animate.leave` (ADR 0010; building-blocks 1.6 point 2); a server-rendered held child never takes `animate.enter` (ADR 0011 clause 12). On a centred held child, an arrival or a leave must not animate `translate` (usage rule 9); `opacity` and `scale` are safe. The item link stays until Angular removes the last host, because removal waits for the DOM (ADR 0060 point 4). Changing `gap`, `fixed`, `over`, or `fill` moves the held child at once, with no transition, as Yeti's CSS has it.

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound attributes and markers, and the item link in `<head>` (section 8). Everything at first paint is a host binding (ADR 0011 clause 1). Centring and the size caps are CSS, resolved at first paint with no script. Nothing is **Pre-hydration state**: no person and no Yeti module can change a `data-*` attribute (ticket 26 rows 48 to 51, "the consumer's binding only").
- **Before hydration:** the directives create no node, read no layout, start no timer or observer, and touch no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is `YetiOverlay`'s item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** every element is claimed as is; bindings computed from the same inputs give the same values (usage rule 12); 0 style mutations (ADR 0060 point 5, measured for the mechanism). A static `fill` is inert and is written back unchanged.
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the overlay and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism). A `@defer` block inside an overlay adds no element, so its content is a direct child, and `yetiOverlayChild` inside it works before and after the block hydrates.
- **`hydrate never`:** the overlay is its server HTML and stays styled while its host is connected, whatever live overlays do (ADR 0060 point 4; ADR 0045's presence attribute is what the check queries). There is no Angular behaviour to lose; a bound input simply never changes, so a veil inside such a block stays as rendered.
- **Client-only `@defer`:** the item file is fetched when `YetiOverlay` is constructed, which can show the held child in the flow for a few frames; the consumer closes the gap with `provideYetiStyles({ preload: ['overlay'] })` (ADR 0060 point 6; [setup](setup.md)).
- **Event replay:** the directives declare no listener, so nothing replays and no `jsaction` is added by them.
- **`withI18nSupport()`:** a stamp's or a message's text is translated with `i18n` in the consumer's component. The directives add no `i18n` block; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** inputs are signals and host bindings read them, so a bound `gap`, `fixed`, `over`, or `fill` refreshes with no zone (map, Standing rulings, item 43; ADR 0070 rule 4).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the held child is centred over its box, or over the viewport with `fixed`, and covers the box with `fill`, because the attributes and the item link are in the server HTML. A server-rendered `inert` on covered content holds too. Nothing is lost: the overlay has no behaviour. What is lost is the consumer's state changes (removing a veil when saving ends). A client-only application gets no such promise.
- **Hydration boundary:** the overlay and its held child may sit in different boundaries; both are static, so nothing differs between them.

### 11. Hydration constraints

The overlay complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; `data-gap`, `data-fixed`, `data-over`, and `data-fill` come from inputs whose values usage rule 12 keeps equal on both sides.
- **No direct DOM manipulation:** the directives write nothing to the DOM outside host bindings. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directives change no element. The consumer's markup must be valid as written; Yeti's own example puts the overlay on a `div` and a `form`, and its held child is a `p` or a `div`.
- **`preserveWhitespaces`:** the directives have no template. Whitespace text in the overlay is in the flow and does not move the held child, which is positioned.
- **No output branched on the platform:** none.
- **Static attributes the directives bind:** usage rule 11 keeps the consumer from writing them. The one static HTML-named form, `fill`, is `inert`: no directive binds it, so hydration writes it back unchanged (section 2).

### 12. Single-page application

None. The overlay has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). A `fixed` held child is not a top-layer panel, so navigation-close does not close it; one placed in a persistent shell stays across routes until the consumer's own state removes it. On a route change, a route's overlays leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-overlay]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders an overlay again re-inserts it.

### 13. Item file

`yeti-css/css/layouts/overlay/overlay.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiOverlay]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:28`, after `scroller` and before `box`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-overlay` has left the DOM. `YetiOverlayChild` acquires nothing (section 3). The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the `[data-gap]` value rules and the space tokens), and optionally `provideYetiStyles({ preload: ['overlay'] })`. The overlay adds nothing to it. Cross-item files acquired: none (`overlay.css` has no cross-item rule; ADR 0060 point 9).

Order inside `yeti.layouts` (read, not measured): the held-child rules have the specificity of two or three classes (`.overlay > [data-over]`, `.overlay > [data-over][data-fill]`), above the one-class rules of the items composed on a held child (`.box`, `.cover`, `.center`, `.stack`), so for the properties both set (`margin`, the size caps) the overlay wins whatever the insertion order. Properties only the other item sets still apply: a `cover` or `stack` least height (usage rule 8, measured). `lift`, `enter`, and `attention` are in later cascade layers than `yeti.layouts`, so their `translate` wins over the centring whatever the specificity (usage rule 9).

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class, attributes, and markers in the DOM, the item link, where the held child lands, and what can take focus. It never asserts a private field, the parent token's value, or how the styles service counts. No test depends on a public token's default value ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): where a test needs the edge gap, it compares with a probe element in the same page styled `inline-size: var(--yeti-space-md)` (or the bound value's token), as Yeti's own `Y/test/browser/layouts/overlay.spec.js` reads geometry from the page. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `overlay` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `overlay--default`: section 8's first markup, in a box of fixed block size, with an image the story ships so it never 404s (ticket 17's artefact). Asserts `class="overlay"` and `data-ngx-yeti-item-overlay` on the box, no `data-gap` or `data-fixed`; `data-over` on the paragraph only, no `data-fill`, and no presence attribute of the overlay on it; no `tabindex` or role added by the package. Asserts the held child's centre equals the box's within 1 px, the image's top equals the box's top (Yeti's "the rest flows as usual"), and the held child's width and height are at most the box's minus twice the probe's gap. Asserts the accessibility tree order equals the DOM order, and the held child's text contrast against its own painted background is at least 4.5:1 with the exact WCAG formula, in the light and dark schemes (section 7).
- `overlay--settings`: `gap`, `fixed`, `over`, and `fill` bound from Storybook controls. Asserts each attribute follows its control and that clearing or turning one off removes it; with `over` off the held child is back in the flow below the content; with `fill` on and `over` off nothing moves (usage rule 3).
- `overlay--veil`: section 8's veil, with a button that toggles `saving`. Asserts the veil's four edges equal the box's within 1 px (Yeti's "Every edge, not just the size" case); the message is centred in the veil; while saving, the covered input is `inert`, Tab from before the form does not reach it, and `document.activeElement` is never a covered control; after saving ends, the veil is gone and the input is reachable again. The "Saving..." text on `var(--yeti-color-scrim)` is at least 4.5:1 with the scrim's computed colour composited over pure black and over pure white, in the light and dark schemes ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 8 and 55).
- `overlay--fixed`: a `fixed` overlay in a page taller than the viewport. Asserts the held child's centre equals the viewport's within 1 px, and still does after the page scrolls.
- `overlay--scrolls`: a held child with more text than the box holds, written as a Scroll region (`tabindex="0"`, `role="region"`, `aria-label`). Asserts the child's `scrollHeight` exceeds its `clientHeight`, its bottom is inside the box minus the gap, it takes focus with Tab, and the arrow keys scroll it. The Story gate's `scrollable-region-focusable` rule passes.
- `overlay--rtl`: `overlay--default` inside `dir="rtl"`. Asserts the held child stays centred (Yeti's RTL case).

### Layer 2: browser-level (`npx nx test <lib>`, `overlay.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiOverlay, { tagName: 'div' })`: the host has class `overlay` and `data-ngx-yeti-item-overlay`, and no `data-gap` or `data-fixed`; with `bindings` setting `gap` to `'lg'` and `fixed` to `true`, the attributes follow (`data-fixed=""`), and setting them back to `undefined` and `false` removes them.
- While a `YetiOverlay` fixture lives, one `<link data-ngx-yeti-styles="overlay">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- `createDirective(YetiOverlayChild, { tagName: 'p' })`: no `data-over` or `data-fill` by default; `over` and `fill` bound `true` render `data-over=""` and `data-fill=""`, `false` removes each; the host carries no class, no presence attribute, and no `fill` attribute from a binding, and acquires no link; created alone it injects no parent and throws nothing.
- No directive adds a listener to its host.

A small test host covers what `createDirective` cannot: template references `#o="yetiOverlay"` and `#h="yetiOverlayChild"` resolve, and the part's injected token is the overlay instance (a DI fact, not a rendered one); static `over`, `fill`, and `fixed` attributes set the inputs through `booleanAttribute`; a static `fill` on a `p` and on an `svg` stays as `fill=""` beside `data-fill=""` (the `inert` kind), and the `svg` child's `circle` has the same computed `fill` as one with no attribute; a part outside any overlay renders its markers with no error; `yetiOverlay yetiBox gap="lg"` renders one `data-gap="lg"` and both presence attributes; `yetiStack yetiOverlayChild fill` renders one `data-fill` on the element, the composition usage rule 8 forbids (a test of what the compiler accepts, not a recommendation); the consumer's own `class` on each host is kept.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `overlay.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture of section 8's first markup whose held child carries `i18n`, with a bound `gap` of `'sm'` and a static `fill` on a second, filled overlay (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the boxes render `class="overlay"`, `data-ngx-yeti-item-overlay`, and `data-gap="sm"`; the held children render `data-over=""`, and the filled one `data-fill=""` beside its static `fill=""`; `<head>` holds one item link with `data-ngx-yeti-styles="overlay"`, `data-beasties-skip`, and an `href` ending `layouts/overlay/overlay.css?v=<pin>`; no element carries a `jsaction` from the package.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the overlay through the contract mapping: class `overlay` has `YetiOverlay`; `data-gap` has an input whose type is the manifest's vocabulary `gap`; `data-fixed` has the boolean `fixed`; the markers `data-over` and `data-fill` have `over` and `fill` on `YetiOverlayChild`; the manifest's events for `overlay` are empty. A pin move that adds an attribute, a value, or a marker fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids, at viewports of 1280 x 800 and 320 x 640, after Yeti's own `overlay.spec.js`:

- the held child is centred over the box and the rest flows as usual; with `fill` it covers the box on every edge; without `fill` it is smaller than the box;
- with `fixed` it is centred on the viewport, before and after scrolling;
- under `dir="rtl"` it stays centred;
- at 320 px the page has no horizontal overflow (1.4.10); at 200 % text zoom the held child of `overlay--default` stays inside the box minus the gap and scrolls rather than clips (1.4.4);
- on `overlay--veil`, Tab never reaches a covered control while the veil shows (2.4.11).

Fixture-app half, built with `outputMode: 'server'`, with an `/overlay` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences):

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- with JavaScript disabled the held child is centred over the box as in the Storybook half, a `fixed` one over the viewport, and `@axe-core/playwright` with the six tags reports no violation;
- an overlay inside a client-only `@defer` block with `overlay` in the preload list never shows its held child in the flow; an overlay inside a `hydrate never` block keeps its item link after every live overlay on the page is removed;
- navigating from the overlay route to a route without one removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and `docs.md` examples for the stories, and its `test/browser/layouts/overlay.spec.js` with the fixture `test/browser/fixtures/layouts/overlay.html` for the geometry cases; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; ticket 17's overlay finding for the Scroll region case.

## Out of Scope

- Focus management, dismissal, Escape, a backdrop press, or the top layer. They are the [dialog](../issues/81-spec-dialog.md)'s and the [tooltip](../issues/92-spec-tooltip.md)'s (manifest `a11y.notes`; Part 2 row 13).
- A package binding of `inert` on covered content, or of a role or live region on the held child. They are the consumer's, as Yeti's guide and notes put them (usage rules 5 and 6).
- CDK Overlay or any positioner in script (building-blocks 1.2 and 1.8).
- An input per token, or a gap outside Yeti's `gap` vocabulary (ADR 0004; ADR 0005).
- A shared any-element marker directive for `data-over` or `data-fill` (ADR 0070, considered options; ticket 26 grilling Q6).
- A directive for the content underneath (ticket 26 grilling Q6).
- Any check that exactly one child is held, that `fill` sits beside `over`, that the part is a direct child, or that `yetiStack` and a filled `yetiOverlayChild` are not on one element. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- Package CSS for the overlay. It owns no ledger row, so no accessibility rule applies (ADR 0060 point 8).
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).
- The `layer` layout, which stacks every child in flow and grows to the tallest (`docs.md`), with its own spec (Part 2).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiOverlay]` with `gap` and `fixed`; part directive `[yetiOverlayChild]` with `over` and `fill` | building-blocks Part 2 row 13; ticket 26 rows 48 to 51 |
| `data-over` and `data-fill` are kind C on one per-item part directive | ADR 0070; ticket 26 grilling Q6 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| `gap` typed by Yeti's `YetiGap`; booleans with `booleanAttribute`; unset or false renders nothing | ADR 0005; ADR 0070 rules 1 and 2; building-blocks 1.4 |
| `fill` is an `inert` presentational-attribute input on every host, `svg` included | building-blocks 1.4; ticket 26 row 51 and grilling Q15, confirmed by measurement (section 2) |
| `yetiOverlay` and `yetiBox` on one element share one `gap` | ticket 26 grilling Q16; building-blocks 1.4 |
| The part injects `yetiOverlayToken` optionally with `skipSelf` | ADR 0070 kind C; building-blocks 1.9 |
| Only the item directive marks its host and acquires the item file | ADR 0045; ticket 50 decision 6 |
| `exportAs` on both; class names with no collision | building-blocks 1.3; ADR 0080 point 4 |
| Entry point `ngx-yeti/overlay` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only; anything modal is the dialog's | building-blocks 1.2; Part 2 row 13 |
| Tokens are the consumer's | ADR 0004 |
| Item file as a counted link in Yeti's order; presence attribute `data-ngx-yeti-item-overlay` | ADR 0060 points 2 to 6; ADR 0045 |
| Covered content made `inert`, an overflowing held child made a Scroll region, by the consumer | `Y/src/guides/visibility.md:68`; manifest `a11y.notes`; ADR 0015 point 4; ticket 17 section 2.1 |
| Contrast of the held child's text asserted in the play function | ADR 0015 point 3; ticket 17 section 2.1 (`layer` incomplete) |
| `yetiStack` and a filled held child not on one element; a cover veil sets `--yeti-cover-height: auto` | measured (section 3, section 8); [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 50 for the stack spec's mirror rule and ticket 50 decision 67 (Y10) for Yeti's docs |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

Yeti's "sold out" stamp, imported:

```ts
import { NgOptimizedImage } from '@angular/common';
import { YetiOverlay, YetiOverlayChild } from 'ngx-yeti/overlay';
import { NgxYetiPaint, YetiBox } from 'ngx-yeti/box';

@Component({
  selector: 'app-product-image',
  imports: [YetiOverlay, YetiOverlayChild, YetiBox, NgxYetiPaint, NgOptimizedImage],
  template: `
    <div yetiOverlay>
      <img [ngSrc]="src()" width="1200" height="800" [alt]="alt()" />
      @if (soldOut()) {
        <p yetiBox yetiPaint="alert" yetiOverlayChild over i18n>Sold out</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductImage {
  readonly src = input.required<string>();
  readonly alt = input.required<string>();
  readonly soldOut = input(false);
}
```

The `@if` adds no element, so the paragraph is a direct child; the image alone is one child when the stamp is absent, which leaves the overlay with nothing to hold and changes nothing visible.

A loading veil over a form: section 8's second example, with `YetiCover` and `YetiCoverChild` from `ngx-yeti/cover` added to the imports, and the covered controls wrapped in an element that takes `[attr.inert]`.

A notice over the whole page while it scrolls:

```html
<div yetiOverlay fixed gap="lg">
  <main><!-- the page --></main>
  <p yetiBox yetiPaint="primary" yetiOverlayChild over role="status" i18n>Offline: changes will sync later.</p>
</div>
```

It covers part of the page, so it must not cover a control the reader needs (usage rule 5); a notice that must be dismissed is a [dialog](../issues/81-spec-dialog.md) (usage rule 4).

A held child chosen from state: `<p yetiOverlayChild [over]="compact()">`. A value newer than the pin: `<div yetiOverlay [gap]="$any('4xl')">`. A page whose overlay renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['overlay'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `layouts/overlay/overlay.css`, loaded by `YetiOverlay` as a counted link (section 13). The consumer writes nothing for the overlay beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps `data-gap` to the private gap (`:6-37`); `tokens/space.css` declares the space scale. `data-fixed`, `data-over`, and `data-fill` have no always-loaded rule.
3. **Cross-item rules:** none in `overlay.css`. The held-child rules outrank one-class item rules by specificity, and the `translate` of `lift`, `enter`, and `attention` wins by layer (section 13; usage rules 8 and 9). Items composed on the box or the held child (`box`, `paint`, `cover`, `frame`) load their own files through their own directives.
4. **Tokens:** reads `--yeti-space-md` and the token behind a bound `gap`; writes none (section 2). A veil's `--yeti-color-scrim` and a cover veil's `--yeti-cover-height: auto` are the consumer's.
5. **What breaks without the item file:** the box is not positioned and the held child sits in the flow after the content it should cover, with no size cap and no centring, with no error.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled all 49 of Yeti's class names and 93 attribute names with Tailwind 4.3.3, and only `container`, `grid`, `table`, and the attribute name `hidden` produced a utility (measured; `prototypes/yeti-tailwind/results/collisions.json`, `classCollisions` and `attrCollisions`). `overlay`, `data-gap`, `data-fixed`, `data-over`, and `data-fill` produced none.

### Platform features to adopt when the browser target moves

None. The one feature the manifest lists as unguarded, the individual `translate` property, is inside Baseline 2025 (section 6), and Yeti guards nothing for the overlay. CSS anchor positioning, which Yeti guards for the dropdown and the tooltip (building-blocks 1.2), is not used by the overlay, whose box is its parent.

### Single-page-application pieces relied on

None: the overlay uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
