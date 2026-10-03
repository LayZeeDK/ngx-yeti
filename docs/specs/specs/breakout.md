# Spec: breakout (layout)

Ticket: [52. Spec: breakout (layout)](../issues/52-spec-breakout.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 2 and Part 1, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 8 to 11, [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md), and [ledger.md](../ledger.md) row A11Y-10c. `Y/` is `github.com/foundation/yeti/` at the **Pin**. The points no record settled are decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 6, 8, 24, and 25).

## Problem Statement

Yeti's `breakout` is the layout for a long read: it "Keeps its children in a centered reading column with gutters, and lets any child carrying data-bleed span the full width" (`Y/src/layouts/breakout/manifest.json`). Its CSS is a three-track grid (gutter, column, gutter). The column is `data-max` wide, or the container minus two gutters when that is less. A child marked `data-bleed` spans all three tracks. A child marked `data-note` is a margin note: in the end gutter beside the child it follows once the breakout's content box is at least 64rem wide, in the column below that (`Y/src/layouts/breakout/breakout.css`). Headings inside keep the flow's rhythm (`--yeti-heading-space-before` and `--yeti-heading-space-after`) over the row gap. There is no **Module** and there are no events.

An application developer using the package cannot write `class="breakout"`, `data-max`, `data-gap`, `data-bleed`, or `data-note`: the package's contract rule is that a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). A misspelt `data-max="medium"` or a `data-bleed` on a grandchild fails silently in plain Yeti. The developer also needs the `breakout` **Item file** loaded while a breakout is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it, every child renders at full width in normal flow, with no error.

The breakout is also one of five items whose contrast axe could not compute on Yeti's own example (ticket 17, measured: `color-contrast` incomplete on a heading "partially obscured", Chromium and Firefox). So the package must check that contrast itself ([ledger.md](../ledger.md) A11Y-10c; [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 3).

## Solution

Three directives in the secondary entry point `ngx-yeti/breakout` ([building-blocks.md](../building-blocks.md) Part 2 row 2):

- **`YetiBreakout`**, the **Item directive**, on `[yetiBreakout]`. It binds `breakout` as a static host class, `data-max` from a `max` input typed `YetiWidth`, and `data-gap` from a `gap` input typed `YetiGap`. It sets the static presence attribute `data-ngx-yeti-item-breakout` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), acquires the `breakout` item file when it is created, on the server too, and releases it when destroyed, through `injectYetiItemStyles('breakout')` from `ngx-yeti/styles` as the last statement of its constructor ([setup](setup.md); ticket 50 decisions 42 and 45). It provides `yetiBreakoutToken`.
- **`YetiBreakoutChild`**, a **Part directive** for a child that changes placement, on `[yetiBreakoutChild]`. It binds `data-bleed` from a `bleed` input with `booleanAttribute` (ticket 26 row 10, kind C).
- **`YetiBreakoutNote`**, a **Part directive** for a margin note, on `[yetiBreakoutNote]`. It binds `data-note` as a static host attribute and takes no input (ticket 26 row 11, kind P).

The developer writes `<article yetiBreakout max="md">` where Yeti's docs write `<article class="breakout" data-max="md">`, `<figure yetiBreakoutChild bleed>` where they write `<figure data-bleed>`, and `<aside yetiBreakoutNote>` where they write `<aside data-note>`. Unset inputs render nothing, so Yeti's defaults (`md` and `md`) apply from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1).

Everything else is Yeti's CSS and the platform. The directives are **types only**: no listener, no render callback, no service, and no DI beyond the parts' optional parent token. Server HTML is Yeti's documented markup, so the layout renders the same on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block.

The `breakout--default` story's play function computes the contrast of the heading, the body text, and a note with the exact WCAG formula, which closes what axe left incomplete (A11Y-10c).

## User Stories

1. As an application developer, I want to mark an article as a breakout with one directive attribute, so that I never write Yeti's `breakout` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="breakout"` in the DOM, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want to set the column's maximum width with a `max` input typed by Yeti's width vocabulary, so that `max="medium"` fails to compile.
4. As an application developer, I want to set the gutter and the row gap with a `gap` input typed by Yeti's gap vocabulary, including the fluid pairs (`sm-lg`), so that I get the same 29 values Yeti documents.
5. As an application developer, I want an unset `max` or `gap` to render no attribute, so that Yeti's own default applies and moves with the pin.
6. As an application developer, I want to make one child span the full width with `bleed` on a part directive, so that a picture or a quote band breaks out of the column without negative margins.
7. As an application developer, I want `[bleed]="false"` to remove `data-bleed`, so that I can toggle a child's bleed from state.
8. As an application developer, I want to mark a margin note with one part directive, so that a citation sits beside its paragraph on a wide layout and in the column on a narrow one.
9. As an application developer, I want the margin note to move by the breakout's own width, not the screen's, so that a breakout in a narrow pane keeps its note in the column.
10. As an application developer, I want the breakout's item file loaded when the first breakout renders, so that I do not import `breakout.css` globally.
11. As an application developer, I want the item file removed after the last breakout leaves the page, so that a route without a long read carries none of its CSS.
12. As an application developer, I want the item file in the server HTML when a server-rendered page has a breakout, so that the first paint already has the column.
13. As an application developer, I want the layout correct with JavaScript off under SSR and prerendering, so that a long read is readable before any script runs.
14. As an application developer, I want hydration to change nothing on a breakout or its children, so that I get no `NG05xx` error and no layout shift.
15. As an application developer, I want the breakout to work under zoneless change detection, including a `max`, `gap`, or `bleed` bound from a signal, so that the package fits Angular's recommended mode.
16. As an application developer, I want a breakout inside a `@defer (hydrate on ...)` block to keep its layout before and after the block hydrates, so that incremental hydration does not collapse the column.
17. As an application developer, I want a breakout inside a `hydrate never` block to keep its styles for as long as it is on the page, so that a dehydrated long read is not unstyled when a live breakout elsewhere leaves.
18. As an application developer, I want to know that a breakout inside a client-only `@defer` block needs `breakout` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
19. As an application developer using `withI18nSupport()`, I want a translated long read to hydrate without being re-rendered, so that localised pages keep the server's DOM.
20. As an application developer, I want to put `yetiBreakout` beside another item's directive on the same element (a `box`), so that I can compose layouts as Yeti does.
21. As an application developer, I want `yetiBreakoutChild` beside another item's directive on the same child (a `frame` that bleeds), so that Yeti's own example is expressible.
22. As an application developer, I want to know that the part directives work only on direct children, and that a component's host element is the child, so that I put `bleed` on the right element.
23. As an application developer, I want to set the column width, the gutter, the heading spacing, and the note's size and colour through Yeti's public tokens, so that my theme controls them.
24. As an application developer, I want to open chapters wider by setting `--yeti-heading-space-before` on one breakout, so that one long read differs from the rest of the site.
25. As an application developer, I want the package to offer no input per token, so that the breakout's API stays the size of Yeti's contract.
26. As an application developer, I want my own classes and attributes on the breakout and its children to be kept, so that I can style the article beside the directive.
27. As an application developer, I want template references (`#b="yetiBreakout"`, `#c="yetiBreakoutChild"`, `#n="yetiBreakoutNote"`), so that the breakout follows the package's `exportAs` rule.
28. As an application developer, I want to import the three directives from `ngx-yeti/breakout`, so that a `@defer` block can split them with the rest of the item.
29. As an application developer, I want the usage rules stated (direct children, one note after the child it annotates, no static Yeti attributes), so that I use the breakout as Yeti intends.
30. As an application developer using Tailwind v4 beside the package, I want to know whether `breakout` collides with a Tailwind name, so that I can plan my layer statement.
31. As a screen-reader user, I want the breakout to add no role and no announcement, so that the long read is announced as its own article and headings.
32. As a screen-reader user, I want a bleeding child and a margin note in source order, so that I hear the note right after the paragraph it belongs to.
33. As a keyboard user, I want the breakout to add no tab stop, so that focus moves only through the content's own controls, in source order.
34. As a low-vision user, I want the heading, the body text, and the note's small muted text to meet WCAG 2.2 AA contrast in light and dark schemes, so that I can read all of them.
35. As a low-vision user, I want the breakout to reflow at 320 CSS pixels with no horizontal scrolling, so that the column shrinks to the width minus two gutters.
36. As a low-vision user who zooms text, I want the note to fall back into the column when the zoomed breakout is narrower than 64rem, so that it is never squeezed into a narrow gutter.
37. As a low-vision user who overrides text spacing, I want the column and the note to keep their content visible, so that my spacing settings do not clip text.
38. As a package maintainer, I want the contrast of A11Y-10c asserted in the play function with the exact WCAG formula, so that the ledger row is met by a test, not by assumption.
39. As a package maintainer, I want the contract check to cover the class, both attributes, and both markers, so that a pin move that adds or renames one fails before release.
40. As a package maintainer, I want the SSR smoke to assert the server HTML of a breakout, a bleeding child, a note, and the item link, so that the first paint is proven.
41. As a package maintainer, I want the fixture app to render a breakout in a prerendered route and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
42. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default does not fail a test for no reason.
43. As a package maintainer, I want the class names checked against Yeti's typings at the pin, so that a future Yeti type named `YetiBreakout` is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/layouts/breakout/manifest.json`, `breakout.css`, `docs.md`, and `example.html`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `breakout`, `layout`, `Page Layouts` |
| `class` | `breakout` |
| `attributes` | `data-max` (vocabulary `width`: `2xs` to `2xl`, default `md`), "The widest the reading column may be."; `data-gap` (vocabulary `gap`, 29 values, default `md`), "The gutter on each side, and the space between children." |
| `classes` | empty |
| `children` | `> *` (min 1, the content, in the column); `> [data-bleed]` (min 0); `> [data-note]` (min 0) |
| `markers` | `data-bleed` (boolean, on `> *`): "Breaks the child out of the column to span the full width."; `data-note` (boolean, on `> *`): "A margin note: in the end gutter beside the child it follows when the breakout is wide, in the column when it is not." |
| `tokens` | public: `--yeti-width-md`, `--yeti-space-md`, `--yeti-heading-space-before`, `--yeti-heading-space-after`, `--yeti-text-sm`, `--yeti-color-text-muted`; private: `--_yeti-max`, `--_yeti-gap` |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "Purely visual. A bleeding child is still in reading order." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: "grid named lines", "min() in track sizes"; `guarded`: empty |
| `since` | `7.0.0` |

The rules, in `@layer yeti.layouts`: `.breakout` is a grid with tracks `[full-start] minmax(gap, 1fr) [content-start] min(100% - 2 * gap, max) [content-end] minmax(gap, 1fr) [full-end]` and `row-gap: gap`; `.breakout:has(> [data-note])` becomes an inline-size container; `.breakout:not([data-max])` and `:not([data-gap])` set the private tokens to `--yeti-width-md` and `--yeti-space-md`; `.breakout > *` zeroes margins and sits in `content`; `.breakout > [data-bleed]` sits in `full`; two heading-rhythm rules adjust `margin-block-start` around headings; `.breakout > [data-note]` takes `--yeti-text-sm` and `--yeti-color-text-muted`, and under `@container (inline-size >= 64rem)` moves to track 3 with `padding-inline-start` of the gap. The `[data-max]` and `[data-gap]` value rules that set `--_yeti-max` and `--_yeti-gap` are in the **Always-loaded group** (`Y/src/layouts/attributes.css:5-13` for the gap stops), not in the item file. Prose inside is also capped at `--yeti-measure` by `Y/src/base/prose.css:23`, so a column set wider than the measure is not filled by paragraphs (`docs.md`).

Attributes left to the consumer: none (ticket 26 rows 8 to 11; ADR 0070's "no row is left to the consumer").

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `breakout` | static host class on `[yetiBreakout]` (`YetiBreakout`) | always present | ADR 0003 point 1; Part 2 row 2 |
| Attribute `data-max` | the column's maximum width | input `max` on `yetiBreakout`: `YetiWidth \| undefined`, bound `[attr.data-max]` | unset renders nothing (Yeti's `md` applies); `max` is an HTML attribute name, kind `inert` on the breakout's hosts | ticket 26 row 8 (R); ADR 0070 rule 1; building-blocks 1.4 |
| Attribute `data-gap` | the gutter and the row gap | input `gap` on `yetiBreakout`: `YetiGap \| undefined`, bound `[attr.data-gap]` | unset renders nothing (Yeti's `md` applies) | ticket 26 row 9 (R) |
| Marker `data-bleed` | child spans the full width | input `bleed` on `yetiBreakoutChild`: `boolean` with `booleanAttribute`, bound `[attr.data-bleed]` as `''` when true and `null` when false | default `false`, renders nothing | ticket 26 row 10 (C) |
| Marker `data-note` | margin note | static host attribute `data-note=""` on `[yetiBreakoutNote]` (`YetiBreakoutNote`); no input | always present | ticket 26 row 11 (P) |
| Children | `> *`, `> [data-bleed]`, `> [data-note]` | a child with no marker needs no directive | not applicable | ticket 26 grilling Q6 |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Token `--yeti-width-md` | default column width | the consumer's; the package writes none | not applicable | ADR 0004 |
| Token `--yeti-space-md` | default gutter and row gap | the consumer's | not applicable | ADR 0004 |
| Token `--yeti-heading-space-before` | space above a heading | the consumer's | not applicable | ADR 0004 |
| Token `--yeti-heading-space-after` | space between a heading and what it opens | the consumer's | not applicable | ADR 0004 |
| Token `--yeti-text-sm` | the note's text size | the consumer's | not applicable | ADR 0004 |
| Token `--yeti-color-text-muted` | the note's text colour | the consumer's | not applicable | ADR 0004 |
| Tokens `--_yeti-max`, `--_yeti-gap` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-breakout=""` on `[yetiBreakout]` | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2 |

The `inert` kind for `max` (building-blocks 1.4): a static `max="lg"` stays on the host beside `data-max="lg"`. HTML's `max` means something only on `input`, `meter`, and `progress`, none of which can hold the breakout's children, so it does nothing on the breakout's hosts and the directive binds nothing for it (ticket 26 row 8 and grilling Q15, which this spec confirms for its hosts: `article`, `main`, `section`, `div`).

**Module replaced:** none. Yeti's `breakout` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 2, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads the six public tokens above. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`. None is a hue, chroma, or scale input, so each also takes effect on one breakout element: Yeti's docs suggest setting `--yeti-heading-space-before` to `var(--yeti-space-3xl)` on a breakout "for chapters that open wider" (`docs.md`; `Y/src/guides/base.md:93`; `Y/src/guides/theming.md:38`). **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- `YetiBreakout` provides `yetiBreakoutToken` (`InjectionToken<YetiBreakout>`, `useExisting`), building-blocks 1.9 and 1.3's token naming.
- `YetiBreakoutChild` injects it with `{ optional: true, skipSelf: true }` ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) kind C). `YetiBreakoutNote` injects it the same way, as building-blocks 1.9 has a part that may stand alone do. Neither reads anything from it in the first milestone: no behaviour depends on the parent, and the **In-item check** that would use it belongs to a later milestone (map, Milestones). A part outside a breakout renders its marker and nothing else happens, because Yeti's rules are `.breakout > [data-bleed]` and `.breakout > [data-note]`.
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"). A consumer composes by writing directives beside each other: `yetiBreakout` with `yetiBox` on one element, or `yetiBreakoutChild` with `yetiFrame` on one child, as Yeti's example does. The breakout's `max` and `gap` share their types with `center`'s and every other `gap` reader, so no two package directives on one element declare one input name with different types (building-blocks 1.4, shared vocabularies). Where `box` and `breakout` sit on one element, one `gap` attribute feeds both, which is what Yeti's single attribute means (ticket 26 grilling Q16).
- The only other injection is the root styles service of ADR 0060, through `injectYetiItemStyles('breakout')` ([setup](setup.md)), with which `YetiBreakout` acquires and releases the item file. That service is the [setup](setup.md) spec's and ADR 0060's. The two part directives set no presence attribute and acquire no item file: their rules match only under a `.breakout`, whose own host holds the link for as long as it is connected ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 6).
- Generated ids and the platform's relationship attributes: none. The breakout renders no `id` and references none, so it does not use [generated-ids](generated-ids.md).

### 4. API

| Member | `YetiBreakout` | `YetiBreakoutChild` | `YetiBreakoutNote` |
| --- | --- | --- | --- |
| Class name | checked at the Pin: `yeti.d.ts` exports 46 names and none of the three is among them, so each takes `Yeti`, not `NgxYeti` (ADR 0080 point 4; read in Yeti's built `dist/yeti.d.ts` at the pin, which ADR 0080 used) | as left | as left |
| Selector | `[yetiBreakout]` | `[yetiBreakoutChild]` | `[yetiBreakoutNote]` |
| `exportAs` | `yetiBreakout` | `yetiBreakoutChild` | `yetiBreakoutNote` |
| Entry point | `ngx-yeti/breakout` (building-blocks 1.3; ADR 0011 clause 10) | same | same |
| Inputs | `max: YetiWidth \| undefined` (Yeti default `md`); `gap: YetiGap \| undefined` (Yeti default `md`) | `bleed: boolean`, `booleanAttribute`, default `false` | none |
| Host | static `class: 'breakout'`; static `data-ngx-yeti-item-breakout: ''`; `[attr.data-max]` and `[attr.data-gap]` from the inputs, `null` when unset | `[attr.data-bleed]`: `''` when `bleed()` is true, else `null` | static `data-note: ''` |
| Providers | `yetiBreakoutToken` | none | none |
| Models, outputs, methods | none | none | none |
| Lifecycle | `injectYetiItemStyles('breakout')` from `ngx-yeti/styles` is the last statement of its constructor, after anything there that can throw (nothing does today); it acquires the `breakout` item file, on the server too, and releases it through `DestroyRef` (ADR 0060 point 2; building-blocks 1.9; [setup](setup.md); ticket 50 decisions 42 and 45) | none | none |

Types come from the generated `yeti-types.ts` copy of Yeti's typings at the pin, re-exported by name (ADR 0060 point 10; building-blocks 1.3). The selectors are the ones Part 2 row 2 names; this spec fixes them, as ticket 26 left part selectors to the specs.

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiBreakout` on the element that holds a long read's flow (`article`, `main`, `section`, or `div`), with at least one child (manifest `children`, `> *` min 1).
2. Put `yetiBreakoutChild` and `yetiBreakoutNote` on direct children of the breakout element. Yeti's selectors are child selectors (`breakout.css`), so a marker on a grandchild does nothing. A component's host element is the child: write `<app-figure yetiBreakoutChild bleed>`, not the directive inside the component's template. `@if`, `@for`, and `ng-container` add no element and need no care.
3. Put a note directly after the child it annotates, in source order, and at most one note per child. Yeti: "One note per paragraph; a second note after the same paragraph stacks below the first and pushes the next paragraph down a row" (`docs.md`).
4. Do not write `class="breakout"`, `data-max`, `data-gap`, `data-bleed`, `data-note`, or `data-ngx-yeti-item-breakout` statically. The directives bind them, and hydration writes a static attribute again before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"; ADR 0070 consequences). A value newer than the pin goes through `[max]="$any('new')"` (ADR 0070).
5. Bind `max`, `gap`, and `bleed` from values that are the same on the server and the client, never from a browser-only read such as the window's width. The layout already responds to its own width through Yeti's CSS (building-blocks 1.7), and the hydration constraints require the same DOM on both sides.
6. Import every directive class the template writes. A **Forgotten import** of `YetiBreakoutChild` with a static `bleed` renders a plain child with no error; only a bound input (`[max]`, `[bleed]`) makes the compiler report it (NG8002) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `breakout` | Nearest in Angular Material |
| --- | --- | --- |
| Shape | an item directive on the consumer's article, plus two part directives on its children | none for a reading column; `mat-grid-list` is a component that lays out tiles in fixed rows (`NC/src/material/grid-list/grid-list.ts:40`) |
| Styling | Yeti's item file, loaded per item; tokens in the consumer's stylesheet | component styles and Sass theming |
| Accessibility | none of its own: purely visual | none of its own |
| API | two typed inputs, one boolean part input, one marker part, `exportAs` | `cols`, `rowHeight`, `gutterSize` |

Nothing from Material's API applies: `mat-grid-list` places generated tiles, and the breakout places the consumer's own flow content. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 2; building-blocks 1.2). The reason, row 1's, which row 2 takes: Yeti's CSS does the whole job; the directives add the class, the typed attributes and markers, the item-file acquisition, and `exportAs`. CSS grid, named lines, `min()` in track sizes, `:has()`, and container queries are all inside Baseline 2025 (building-blocks 1.2). No Aria pattern applies (the layout has no role), and no CDK piece is used: there is no id, focus, keyboard, observer, or direction read (Yeti's tracks are logical, so right-to-left puts the note in the left gutter by itself).

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The breakout adds no role, state, or property, and no tab stop.
- **Keyboard:** none.
- **Names:** none. A note is the consumer's element; an `aside` with no name maps to no landmark when it sits inside an `article` or `section`, which is what Yeti's markup does. A consumer who names it makes it a complementary landmark; that is the consumer's choice and the package adds nothing.

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The breakout's elements are the consumer's; the directives add no role. A note's relation to its paragraph is its position right after it in the DOM (usage rule 3). |
| 1.3.2 Meaningful Sequence | The grid changes placement only; DOM order is reading order. A bleeding child stays in reading order (manifest `a11y.notes`); a note moves beside the child it follows, which is also its place in the source. Layer 1 asserts that the accessibility tree order equals the DOM order. |
| 1.4.3 Contrast (Minimum) | axe left `color-contrast` incomplete on Yeti's example in Chromium and Firefox (ticket 17). The play function computes the ratio of the heading, a body paragraph, and a note from computed colours with the exact WCAG formula, unrounded, in the light and dark schemes, and asserts at least 4.5:1 for each ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 3; A11Y-10c). It uses the normal-text threshold for the heading too, as the lede spec does, because the size is a token a consumer may lower ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 8). The note is small muted text, so it is the closest to the threshold. A package rule is added only if an assertion fails (A11Y-10a's "package rule only if it fails"). |
| 1.4.4 Resize Text | The column and gutters are in `rem` tokens and the note's container query is in `rem`, so zoomed text narrows the effective layout; a zoomed breakout below 64rem puts the note back in the column (read, not measured). |
| 1.4.10 Reflow | The column is `min(100% - 2 * gap, max)`, so it never exceeds the container; a bleeding child takes the container's width. Layer 4 asserts no horizontal overflow at a 320 px viewport. Wide content inside a child (a table, a code block) is the consumer's. |
| 1.4.12 Text Spacing | The rules set no height and no overflow on children; overridden spacing grows the rows (read). |
| 2.4.3 Focus Order | Focusable content keeps DOM order; the layout moves no element out of it. |

**Ledger rows owned:** A11Y-10c only ([ledger.md](../ledger.md)). This spec confirms its **What the package adds** column as written ("As A11Y-10a": a play-function assertion with the exact formula; a package rule only if it fails). Its **What Yeti does** column describes the breakout: Yeti's example has a bleeding image with no text over it, and axe left `color-contrast` incomplete on the example's heading as partially obscured, cause not traced ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 24). No new ledger row: the breakout adds no feature Yeti lacks.

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<article yetiBreakout>
  <h1>A long read</h1>
  <p>Every paragraph here sits in the same narrow column ...</p>
  <div yetiFrame ratio="21/9" yetiBreakoutChild bleed>
    <img ngSrc="valley.jpg" width="2100" height="900" alt="A valley at dusk, edge to edge" />
  </div>
  <p>The picture is the exception ...</p>
  <aside yetiBreakoutNote>A citation, or a caveat, that would interrupt the flow.</aside>
  <p>Then the text picks up at exactly the width it left off ...</p>
</article>
```

Server HTML and the hydrated DOM are the same. The article carries `yetibreakout=""`, `class="breakout"`, and `data-ngx-yeti-item-breakout=""`, and no `data-max` or `data-gap`, because both inputs are unset. The bleeding child carries `yetibreakoutchild=""`, `bleed=""`, and `data-bleed=""` beside the frame's own class, attributes, and presence attribute. The note carries `yetibreakoutnote=""` and `data-note=""`. With `max="lg"` the article also carries `max="lg"` (inert) and `data-max="lg"`.

The server also writes one item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>layouts/breakout/breakout.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="breakout"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts that link at bootstrap. The breakout has no closed or open state.

The delta from Yeti's docs markup: the consumer writes `yetiBreakout` where the docs write `class="breakout"`, `max` and `gap` where they write `data-max` and `data-gap`, `yetiBreakoutChild bleed` where they write `data-bleed`, and `yetiBreakoutNote` where they write `data-note`.

### 9. Animation

None. The breakout has no state and no transition, and Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). A consumer may remove a breakout with a class-form `animate.leave`; the item link stays until Angular removes the host, because removal waits for the DOM (ADR 0060 point 4). A breakout that is server-rendered never takes `animate.enter` (ADR 0011 clause 12). Changing `max`, `gap`, or `bleed` at run time moves the layout at once, with no transition, as Yeti's CSS has it.

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes and markers, and the item link in `<head>` (section 8). Everything at first paint is a host binding (ADR 0011 clause 1). Nothing is **Pre-hydration state**: no person and no Yeti module can change a `data-*` attribute (ticket 26 grilling Q12).
- **Before hydration:** the directives create no node, read no layout, start no timer or observer, and touch no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is `YetiBreakout`'s item acquisition, which ADR 0060 runs on the server too. The container query for the note is CSS and needs no script.
- **Full hydration:** every element is claimed as is; bindings computed from the same inputs give the same values (usage rule 5); 0 style mutations (ADR 0060 point 5, measured for the mechanism).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the breakout and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism). A breakout and its marked children share one **Hydration boundary** by construction, because the part directives must sit on direct children (usage rule 2); a deferred block inside a breakout makes its own wrapper element the child, unless the block's content is the child itself.
- **`hydrate never`:** the breakout is its server HTML and stays styled while its host is connected, whatever live breakouts do (ADR 0060 point 4; ADR 0045's presence attribute is what the check queries). There is no Angular behaviour to lose; a bound input simply never changes.
- **Client-only `@defer`:** the item file is fetched when `YetiBreakout` is constructed, which can show unstyled frames; the consumer closes the gap with `provideYetiStyles({ preload: ['breakout'] })` (ADR 0060 point 6; [setup](setup.md)). No entry animation needs the file.
- **Event replay:** the directives declare no listener, so nothing replays and no `jsaction` is added by them.
- **`withI18nSupport()`:** a long read's text is translated with `i18n` in the consumer's component. The directives add no `i18n` block; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** inputs are signals and host bindings read them, so a bound `max`, `gap`, or `bleed` refreshes with no zone (map, Standing rulings, item 43; ADR 0070 rule 4).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the long read is readable and laid out, with the column, the bleeds, and the notes, because the attributes and the item link are in the server HTML. Nothing is lost: the breakout has no behaviour. A client-only application gets no such promise.

### 11. Hydration constraints

The breakout complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class, presence attribute, and `data-note` are static; `data-max`, `data-gap`, and `data-bleed` come from inputs whose values usage rule 5 keeps equal on both sides.
- **No direct DOM manipulation:** the directives write nothing to the DOM outside host bindings. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directives change no element. The consumer's markup must be valid as written; for example a note is an `aside` or `p` beside the paragraph, never inside a `p`, which the parser would repair and so differ from the server's DOM.
- **`preserveWhitespaces`:** the directives have no template. The grid ignores whitespace text between children.
- **No output branched on the platform:** none.
- **Static attributes the directives bind:** usage rule 4 keeps the consumer from writing them.

### 12. Single-page application

None. The breakout has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). A fragment link to a heading inside a breakout is the consumer's link and goes through the fragment-links spec like any other. On a route change, a route's breakouts leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-breakout]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders a breakout again re-inserts it.

### 13. Item file

`yeti-css/css/layouts/breakout/breakout.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiBreakout]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:33`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-breakout` has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the `[data-max]` and `[data-gap]` value rules), and optionally `provideYetiStyles({ preload: ['breakout'] })`. The breakout adds nothing to it. Cross-item files acquired: none (`breakout.css` has no cross-item rule; ADR 0060 point 9). An item placed inside or beside a breakout (`frame`, `box`) loads its own file through its own directive.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class, attributes, and markers in the DOM, the item link, where children land, and the contrast. It never asserts a private field, the parent token's value, or how the styles service counts. No test depends on a public token's default value ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): where a test needs a width or a gap, it reads the token's computed value in the same page, as Yeti's own `test/browser/layouts/breakout.spec.js` does, or compares with a probe element styled `inline-size: var(--yeti-width-lg)`. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `breakout` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `breakout--default`: Yeti's example (heading, paragraphs, a bleeding `frame` with an `NgOptimizedImage`), plus one note. Asserts `class="breakout"` and `data-ngx-yeti-item-breakout` on the article, no `data-max` or `data-gap`, `data-bleed` on the frame and `data-note` on the note, and no `tabindex` or role added by the package. Asserts a plain child's width equals the computed `--yeti-width-md` and is centred, and the bleeding child spans the breakout. Asserts the accessibility tree order equals the DOM order. Asserts the WCAG contrast ratio of the heading, a paragraph, and the note, each against its computed background, with the exact formula, unrounded, at least 4.5:1 (A11Y-10c).
- `breakout--dark-scheme`: the same markup in a wrapper with the consumer's `color-scheme: dark` (ADR 0004 consequences). Repeats the contrast assertions (ticket 17 measured both schemes).
- `breakout--settings`: `max` and `gap` bound from Storybook controls. Asserts `data-max` and `data-gap` follow each control, that clearing a control removes the attribute, and that toggling `bleed` adds and removes `data-bleed` and moves the child between the column and the full width.
- `breakout--note`: a paragraph followed by a note, rendered in a container resized past and below 64rem (building-blocks 1.7). Asserts the note sits in the end gutter beside its paragraph when wide, and below it in the column when narrow, as Yeti's own test does.
- `breakout--heading-rhythm`: a paragraph, an `h2`, and a paragraph in a breakout with `gap="lg"`, and the same with `--yeti-heading-space-before` set on the breakout. Asserts the spacing equals the computed heading tokens, not the gap.

### Layer 2: browser-level (`npx nx test <lib>`, `breakout.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiBreakout, { tagName: 'article' })`: the host has class `breakout` and `data-ngx-yeti-item-breakout`, and no `data-max` or `data-gap`; with `bindings` setting `max` to `'lg'` and `gap` to `'sm-lg'`, the attributes follow, and setting them back to `undefined` removes them.
- While a `YetiBreakout` fixture lives, one `<link data-ngx-yeti-styles="breakout">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- `createDirective(YetiBreakoutChild, { tagName: 'figure' })`: no `data-bleed` by default; `bleed` bound `true` renders `data-bleed=""`, `false` removes it; the host carries no presence attribute and acquires no link (this spec's reading, section 3).
- `createDirective(YetiBreakoutNote, { tagName: 'aside' })`: the host carries `data-note=""` and no other package attribute.
- No directive adds a listener to its host.

A small test host covers what `createDirective` cannot: template references `#b="yetiBreakout"`, `#c="yetiBreakoutChild"`, `#n="yetiBreakoutNote"` resolve; a static `bleed` attribute on a child sets the input through `booleanAttribute`; a static `max="lg"` renders both `max="lg"` and `data-max="lg"` (the `inert` kind); a part outside any breakout renders its marker with no error; and the consumer's own `class` on each host is kept.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `breakout.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture whose heading and paragraphs carry `i18n` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the article renders `class="breakout"`, `data-ngx-yeti-item-breakout`, and `data-max="lg"` from a bound input; the bleeding child renders `data-bleed=""`; the note renders `data-note=""`; `<head>` holds one item link with `data-ngx-yeti-styles="breakout"`, `data-beasties-skip`, and an `href` ending `layouts/breakout/breakout.css?v=<pin>`; no element carries a `jsaction` from the package.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the breakout through the contract mapping: class `breakout` has `YetiBreakout`; `data-max` and `data-gap` have inputs whose types are the manifest's vocabularies; `data-bleed` has the `bleed` input on `YetiBreakoutChild`; `data-note` has `YetiBreakoutNote`; the manifest's events for `breakout` are empty. A pin move that adds an attribute or marker fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids: at container widths of 1000, 600, and 400 px the column, the gutters, and the bleed match Yeti's own `breakout.spec.js` cases, with sizes read from computed tokens; at a 320 px viewport the page has no horizontal overflow (1.4.10).

Fixture-app half, built with `outputMode: 'server'`, with a `/breakout` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences):

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- with JavaScript disabled the column, the bleed, and the note land as in the Storybook half, and `@axe-core/playwright` with the six tags reports no violation;
- a breakout inside a client-only `@defer` block with `breakout` in the preload list shows no unstyled frame; a breakout inside a `hydrate never` block stays styled after a live breakout on the page is removed;
- navigating from the breakout route to a route without one removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` for the default story and its `test/browser/layouts/breakout.spec.js` and fixture for the geometry cases; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; ticket 17's contrast harness for the formula.

## Out of Scope

- An input per token, or inputs for the heading spacing or the note's size and colour (ADR 0004).
- A shared any-element `[yetiBleed]` or `[yetiNote]` directive (ADR 0070, considered options; ticket 26 grilling Q6).
- A `note` input on `YetiBreakoutChild`, or a `bleed` input on the note (ADR 0070 kinds C and P are separate directives).
- Any check that parts sit on direct children, that a note follows a child, or that a breakout has a child. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- A viewport-keyed input or any JavaScript size read (building-blocks 1.7).
- Package CSS for the breakout, unless a contrast assertion fails (A11Y-10a's rule).
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiBreakout]` with `max` and `gap`; part directives `[yetiBreakoutChild]` (`bleed`) and `[yetiBreakoutNote]` (static `data-note`) | building-blocks Part 2 row 2; ticket 26 rows 8 to 11 |
| `data-bleed` is kind C (a modifier), `data-note` kind P (a part) | ADR 0070; ticket 26 grilling Q7 ("the note is content of its own kind and the bleed is a placement") |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by Yeti's `YetiWidth` and `YetiGap`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2 |
| `max` is an `inert` presentational-attribute input on the breakout's hosts | building-blocks 1.4; ticket 26 row 8 and grilling Q15 |
| Parts inject `yetiBreakoutToken` optionally with `skipSelf` | ADR 0070 kind C; building-blocks 1.9 |
| `exportAs` on all three; class names with no collision | building-blocks 1.3; ADR 0080 points 3 and 4 |
| Entry point `ngx-yeti/breakout` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 2 |
| Tokens are the consumer's | ADR 0004 |
| Item file as a counted link; presence attribute `data-ngx-yeti-item-breakout` | ADR 0060 points 2 to 6; ADR 0045 |
| Only the item directive marks its host and acquires the item file | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 6 |
| `injectYetiItemStyles('breakout')` last in the constructor | [setup](setup.md); ticket 50 decisions 42 and 45 |
| Contrast asserted in the play function | ADR 0015 point 3; ledger A11Y-10c |
| Normal-text 4.5:1 threshold for every text checked | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 8 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A long read with a bleeding figure and a margin note:

```html
<article yetiBreakout max="md" gap="sm-lg">
  <h1 i18n>Trail maps</h1>
  <p i18n>Every marked route in the park, printed at a scale you can walk by.</p>
  <figure yetiFrame ratio="21/9" yetiBreakoutChild bleed>
    <img ngSrc="valley.jpg" width="2100" height="900" alt="The valley trail at dusk" i18n-alt />
  </figure>
  <p i18n>The valley loop is the easiest of the marked routes.</p>
  <aside yetiBreakoutNote i18n>Closed from November to March.</aside>
</article>
```

```ts
import { NgOptimizedImage } from '@angular/common';
import { YetiBreakout, YetiBreakoutChild, YetiBreakoutNote } from 'ngx-yeti/breakout';
import { YetiFrame } from 'ngx-yeti/frame';

@Component({
  selector: 'app-trail-maps',
  imports: [NgOptimizedImage, YetiBreakout, YetiBreakoutChild, YetiBreakoutNote, YetiFrame],
  templateUrl: './trail-maps.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrailMaps {}
```

A bleed toggled from state: `<pre yetiBreakoutChild [bleed]="wide()">`.

Chapters that open wider in one long read, in the consumer's stylesheet after Yeti (`docs.md`):

```css
.trail-guide {
  --yeti-heading-space-before: var(--yeti-space-3xl);
}
```

A page whose breakout renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['breakout'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `layouts/breakout/breakout.css`, loaded by `YetiBreakout` as a counted link (section 13). The consumer writes nothing for the breakout beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps `data-max` and `data-gap` values to the private tokens; `tokens/space.css` declares `--yeti-width-md` and `--yeti-space-md`; `tokens/type.css` the heading-space tokens and `--yeti-text-sm`; `base/prose.css` caps prose at `--yeti-measure`.
3. **Cross-item rules:** none in `breakout.css`. Items placed inside it keep their own rules; `.breakout > *` zeroes their outer margins, as every gap-based layout does (`docs.md`).
4. **Tokens:** reads six public tokens, writes none (section 2).
5. **What breaks without the item file:** every child renders at full width in normal flow with its own margins, bleeds and notes look like any other child, and nothing errors.
6. **Tailwind name collision:** none known. building-blocks 1.13 lists `container`, `grid`, `table`, and `hidden`, not `breakout` (that Tailwind generates no `breakout` utility is inferred, not measured). The markers `data-bleed` and `data-note` are among the attributes ticket 24's prototype checked against Tailwind's output, which found one attribute collision, `hidden`, and none for them (`prototypes/yeti-tailwind/results/collisions.json`, read).

### Platform features to adopt when the browser target moves

None. Every feature `breakout.css` uses is inside Baseline 2025 (building-blocks 1.2): grid named lines and `min()` in track sizes, which the manifest lists as unguarded, and `:has()` and container queries, which it does not list ([Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md), whose `research/browser-baseline-vs-yeti.md` notes that the breakout manifest omits `:has()`). The omission is recorded as upstream-bugs row Y8, not filed ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 25).

### Single-page-application pieces relied on

None: the breakout uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
