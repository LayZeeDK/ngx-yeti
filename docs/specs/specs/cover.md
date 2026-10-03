# Spec: cover (layout)

Ticket: [57. Spec: cover (layout)](../issues/57-spec-cover.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 7 and Part 1, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 27 to 29 and grilling Q6, Q15, and Q16, [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). The item owns no [ledger.md](../ledger.md) row. `Y/` is `github.com/foundation/yeti/` at the **Pin**. Its open points are decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 6 and 34).

## Problem Statement

Yeti's `cover` is "the hero section, the sign-in screen, the 'coming soon' page: one thing centered in the height of the viewport, with a navigation bar above it or a footnote below it when you want them" (`Y/src/layouts/cover/docs.md`). It is one **Identity class**, `cover`, on a flex column whose least block size is the viewport's by default. Two attributes configure it: `data-gap`, the least space between the centered child and its neighbours, and `data-height`, a band shorter than the viewport. One **Marker**, `data-center`, goes on exactly one direct child, which takes automatic block margins and so sits in the middle of the free space (`Y/src/layouts/cover/cover.css`, `manifest.json`). It has no **Module** and no events.

An application developer using the package cannot write `class="cover"`, `data-gap`, `data-height`, or `data-center`. The contract rule is that a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). A misspelt `data-height="ful"` is silent in Yeti and must fail to compile here ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `cover` **Item file** loaded while a cover is on the page and removed when none is, as the map's lazy-styles requirement asks ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it the block has no least height, nothing is centered, and the children keep their own margins, with no error.

The cover is also a hero's frame, so the page's main heading usually sits inside it. Yeti's accessibility note asks that it stays there and calls the layout "Purely visual" (manifest `a11y.notes`). The package must keep it purely visual in every rendering mode, and must not let a viewport-tall band cut off zoomed or reflowed content.

## Solution

Two directives in the secondary entry point `ngx-yeti/cover` (building-blocks Part 2 row 7; 1.3):

- **`YetiCover`**, the **Item directive**, on `[yetiCover]`. It binds `cover` as a static host class, `data-gap` from a `gap` input typed `YetiGap`, and `data-height` from a `height` input typed `YetiHeight`. It sets the static presence attribute `data-ngx-yeti-item-cover` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)). It acquires the `cover` item file when it is created, on the server too, and releases it when it is destroyed (ADR 0060 point 2). It provides `yetiCoverToken`.
- **`YetiCoverChild`**, a **Part directive** for the child that is centered, on `[yetiCoverChild]`. It binds `data-center` from a `center` input with `booleanAttribute` (ticket 26 row 29, kind C).

The developer writes `<header yetiCover gap="lg">` where Yeti's docs write `<header class="cover" data-gap="lg">`, and `<h1 yetiCoverChild center>` where they write `<h1 data-center>`. Unset inputs render nothing, so Yeti's defaults (`md` and `full`) apply from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1).

Everything else is Yeti's CSS and the platform. The directives are **types only**: no listener, no render callback, no service, and no DI beyond the part's optional parent token. The server HTML is Yeti's documented markup, so the cover renders the same on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block. The least height is CSS (`100dvh` by default, through a **Token**), so no script measures the viewport.

## User Stories

1. As an application developer, I want to make an element a cover with one directive attribute, so that I never write Yeti's `cover` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="cover"` in the DOM, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want a cover with no settings to be at least as tall as the viewport, so that a hero or a sign-in screen fills the first screen by default.
4. As an application developer, I want to mark the one child to center with `yetiCoverChild center`, so that it sits in the middle of the space the other children leave.
5. As an application developer, I want any other children to sit at their natural size above or below the centered one, so that a navigation bar stays at the top and a footnote at the bottom.
6. As an application developer, I want a typed `gap` input drawn from Yeti's `gap` vocabulary, so that a misspelt or missing value fails to compile.
7. As an application developer, I want a typed `height` input with Yeti's six values (`sm`, `md`, `lg`, `xl`, `half`, `full`), so that a band shorter than the viewport is one word and a wrong word fails to compile.
8. As an application developer, I want `height="md"` with a centered heading to give me a band with more room than the spacing scale has, so that I follow Yeti's own answer to "more padding than the scale has".
9. As an application developer, I want the least height to be a minimum and never a fixed size, so that content taller than the band grows it and nothing is cut off.
10. As an application developer, I want an unset `gap` or `height` to render no attribute, so that Yeti's own default applies and my server HTML stays Yeti's minimal markup.
11. As an application developer, I want to bind `gap`, `height`, and `center` from signals, so that the layout follows my state under zoneless change detection.
12. As an application developer, I want to toggle `center` from state, so that which child is centered can change without rewriting markup.
13. As an application developer, I want to put `yetiCover` and `yetiBox` on one element with one `gap` attribute, so that Yeti's own `class="cover box" data-gap="lg"` example is expressible.
14. As an application developer, I want `yetiCoverChild` beside another item's directive on the same child (a `columns`, a `center`, a `box`), so that a hero can be built from layouts as Yeti's hero docs show.
15. As an application developer, I want a `center` layout inside a cover to keep its own inline centring, so that the two layouts compose whatever order their item files load in.
16. As an application developer, I want to set the default least height with `--yeti-cover-height`, for example `auto` for a cover only as tall as its content, so that my theme controls it.
17. As an application developer, I want to know that `--yeti-cover-height` is shared with a filled `stack`, `hero`, and `shell`, so that I know what a `:root` change reaches.
18. As an application developer, I want the cover's default gap to follow `--yeti-space-md`, so that one spacing token governs it.
19. As an application developer, I want the package to offer no input per token, so that the cover's API stays the size of Yeti's contract.
20. As an application developer, I want a value newer than the pin to be bindable through `$any`, so that I am not blocked until the package's pin moves.
21. As an application developer, I want the cover's item file loaded when the first cover renders and removed after the last one leaves, so that I do not import `cover.css` globally.
22. As an application developer, I want the item file in the server HTML when a server-rendered page has a cover, so that the first paint already fills the viewport.
23. As an application developer, I want the cover laid out with JavaScript off under SSR and prerendering, so that the hero reads correctly before any script runs.
24. As an application developer, I want hydration to change nothing on a cover or its children, so that I get no `NG05xx` error and no jump.
25. As an application developer, I want a cover inside a `@defer (hydrate on ...)` block to stay laid out before and after the block hydrates, so that incremental hydration does not collapse it.
26. As an application developer, I want a cover inside a `hydrate never` block to keep its styles for as long as it is on the page, so that a dehydrated hero is not collapsed when a live cover elsewhere leaves.
27. As an application developer, I want to know that a cover inside a client-only `@defer` block needs `cover` in the preload list for a flash-free first paint, so that I can avoid a collapsed frame.
28. As an application developer, I want a cover that leaves under my class-form `animate.leave` to keep its layout until Angular removes it, so that the leave animation is not drawn collapsed.
29. As an application developer using `withI18nSupport()`, I want a translated hero to hydrate without being re-rendered, so that localised pages keep the server's DOM.
30. As an application developer, I want template references (`#c="yetiCover"`, `#m="yetiCoverChild"`), so that the cover follows the package's `exportAs` rule.
31. As an application developer, I want to import both directives from `ngx-yeti/cover`, so that a `@defer` block can split them with the rest of the item.
32. As an application developer, I want the usage rules stated (one centered direct child, the page's `h1` inside a hero cover, no static Yeti attributes), so that I use the cover as Yeti intends.
33. As a screen-reader user, I want the cover to add no role, name, or announcement, so that the page's own landmarks and headings are what I hear.
34. As a screen-reader user, I want the page's main heading inside the hero cover, in reading order, so that I meet it where a sighted reader does.
35. As a keyboard user, I want the cover to add no tab stop and to keep focus in DOM order, so that the centered child does not change where Tab goes.
36. As a low-vision user, I want a cover's content to grow past the viewport when I zoom text to 200 %, so that nothing is clipped.
37. As a low-vision user, I want the cover to reflow at 320 CSS pixels with no horizontal scrolling, so that a hero works on a narrow screen.
38. As a low-vision user who overrides text spacing, I want the cover's children to keep their content visible, so that my spacing settings do not clip them.
39. As a mobile user, I want the default height to follow the visible viewport as the browser's toolbars collapse, so that the centered child stays centered on a phone.
40. As a package maintainer, I want the contract check to cover the cover's class, both attributes with their vocabularies, the `data-center` marker, and its empty event list, so that a pin move that adds or changes one fails before release.
41. As a package maintainer, I want the SSR smoke to assert the server HTML of a cover, its marked child, and its item link, so that the first paint is proven.
42. As a package maintainer, I want the fixture app to render a cover in a prerendered route and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
43. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default does not fail a test for no reason.
44. As a package maintainer, I want the geometry tests to follow Yeti's own `cover.spec.js` cases, so that the package proves the same layout Yeti proves.
45. As a package maintainer, I want the class names `YetiCover` and `YetiCoverChild` checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/layouts/cover/manifest.json`, `cover.css`, `docs.md`, and `example.html`, and in `Y/src/layouts/attributes.css`, `Y/src/tokens/space.css`, and `Y/schema/vocabulary.json`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `cover`, `layout`, `Page Layouts` |
| `class` | `cover` |
| `attributes` | `data-gap`: enum, vocabulary `gap` (29 values), default `md`, "Minimum space between the centered child and whatever sits above or below it". `data-height`: enum, vocabulary `height` (`sm`, `md`, `lg`, `xl`, `half`, `full`), default `full`, "The band's least height ... Content taller than the band grows it; nothing is cut off." |
| `classes` | empty |
| `children` | `> *` (min 1, no max): "A header, the centered child, a footer: any of them optional except the centered one"; `> [data-center]` (min 1, max 1) |
| `markers` | `data-center`: boolean, `on: "> *"`, "Centers the child in the space the others leave; exactly one child carries it." |
| `tokens` | public: `--yeti-cover-height` ("The least height with no data-height, and at data-height=\"full\""), `--yeti-space-md` ("The default gap"); private: `--_yeti-gap`, `--_yeti-height` |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "Purely visual. Keep the page's h1 inside the cover when the cover is the hero." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: `flexbox gap`, `dvh units`; `guarded`: empty |
| `since` | `7.0.0` |

The rules, in `@layer yeti.layouts`: `.cover` is `display: flex; flex-direction: column` with `min-block-size: var(--_yeti-height)` and `gap: var(--_yeti-gap)`; `.cover:not([data-gap])` sets the gap to `--yeti-space-md`; `.cover:not([data-height])` sets the height to `--yeti-cover-height`; `.cover > *` zeroes every child's margins; `.cover > [data-center]` gets `margin-block: auto`. The value rules for `data-gap` and `data-height` are in the **Always-loaded group**'s `layouts/attributes.css` (`:6-37` for gap, `:185-190` for height, where `full` reads `--yeti-cover-height` and `half` reads `--yeti-height-half`, `50dvh`). `--yeti-cover-height` defaults to `100dvh` (`Y/src/tokens/space.css:54`, quoted at the pin as ADR 0006 allows).

Yeti's committed `src/guides/layouts.md` attribute table has no `data-height` row at the pin, while the table the docs build generates from the manifests has one (`| data-height | sm, md, lg, xl, half, full | cover, hero |`, read in Yeti's built `docs/guides/layouts.md:104` at the pin). The package follows the manifest; the stale guide is recorded as docs-only row Y9 in [upstream-bugs.md](../upstream-bugs.md) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 34).

Attributes left to the consumer: none (ticket 26 rows 27 to 29; grilling Q2 and Q13). The element and any ARIA on it are the consumer's: Yeti's example uses a `header`, and a `nav` inside it carries its own `aria-label`.

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `cover` | static host class on `[yetiCover]` (`YetiCover`) | always | ADR 0003 point 1; Part 2 row 7 |
| Attribute `data-gap` | least space around the centered child | input `gap` on `yetiCover`: `YetiGap \| undefined`, bound `[attr.data-gap]`, `null` when unset | unset renders nothing; Yeti's `md` applies. `gap` is not an HTML attribute | ticket 26 row 27 (R) |
| Attribute `data-height` | the band's least height | input `height` on `yetiCover`: `YetiHeight \| undefined`, bound `[attr.data-height]`, `null` when unset | unset renders nothing; Yeti's `full` applies. Static form: `inert` (below) | ticket 26 row 28 (R); building-blocks 1.4 |
| Marker `data-center` | the child centered in the free space | input `center` on `yetiCoverChild`: `boolean` with `booleanAttribute`, bound `[attr.data-center]` as `''` when true and `null` when false | default `false`, renders nothing. `center` is not an HTML attribute | ticket 26 row 29 (C) |
| Children `> *` | header, centered child, footer | no directive for a child with no marker | not applicable | ticket 26 grilling Q6 ("a child with no marker needs no directive") |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Token `--yeti-cover-height` | default and `full` least height | the consumer's; the package writes none | not applicable | ADR 0004 |
| Token `--yeti-space-md` | default gap | the consumer's | not applicable | ADR 0004 |
| Tokens `--_yeti-gap`, `--_yeti-height` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-cover=""` on `[yetiCover]` | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2 |

The `inert` kind for `height` (building-blocks 1.4): a static `height="md"` stays on the host beside `data-height="md"`. HTML's `height` means something on `img`, `iframe`, `video`, `canvas`, `embed`, `object`, and the obsolete table forms, none of which can hold the cover's flow children, so it does nothing on the cover's hosts and the directive binds nothing for it (ticket 26 row 28 and grilling Q15, which this spec confirms for its hosts: `header`, `section`, `main`, `article`, `footer`, `div`). A bound `[height]` renders no `height` attribute.

**Module replaced:** none. Yeti's `cover` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 7, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads the two public tokens above, and through `attributes.css` the token behind whichever `data-gap` or `data-height` value is bound (`--yeti-space-*`, `--yeti-height-*`). The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`. None is a hue, chroma, or scale input, so each also takes effect on one cover element and its descendants (`Y/src/guides/theming.md:38`), as Yeti's own fixture sets `--yeti-cover-height: 400px` on one cover (`Y/test/browser/fixtures/layouts/cover.html`). Yeti's catalogue notes that `--yeti-cover-height` set to `auto` gives a cover "only as tall as its content" (`Y/src/tokens/tokens.json:124`). The same token sizes a filled `stack`, the `hero`, and the `shell` (`Y/src/layouts/stack/stack.css:25`, `Y/src/recipes/hero/hero.css:14`, `Y/src/recipes/shell/shell.css:8`), so a `:root` value reaches all four; the package documents this and adds nothing. **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- `YetiCover` provides `yetiCoverToken` (`InjectionToken<YetiCover>`, `useExisting`), building-blocks 1.9 and 1.3's token naming.
- `YetiCoverChild` injects it with `{ optional: true, skipSelf: true }` ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) kind C). It reads nothing from it in the first milestone: no behaviour depends on the parent, and the **In-item check** that would use it belongs to a later milestone (map, Milestones). A part outside a cover renders its marker and nothing else happens, because Yeti's rule is `.cover > [data-center]`.
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"). A consumer composes by writing directives beside each other: `yetiCover` with `yetiBox` on one element, as Yeti's example does, or `yetiCoverChild` with `yetiColumns`, `yetiCenter`, or `yetiBox` on one child. The cover's `gap` shares `YetiGap` with every other `gap` reader, and `height` shares `YetiHeight` with `hero` and `demo`, so no two package directives on one element declare one input name with different types (building-blocks 1.4, shared vocabularies). Where `box` and `cover` sit on one element, one `gap` attribute feeds both and both render the one `data-gap` Yeti means (ticket 26 grilling Q16): it is the box's padding and the cover's gap at once, as in Yeti's example.
- The only other injection is the root styles service of ADR 0060, reached by `injectYetiItemStyles('cover')` from `ngx-yeti/styles` as the last statement of the constructor ([setup](setup.md); ticket 50 decisions 42 and 45), through which `YetiCover` acquires and releases the item file. That service is the [setup](setup.md) spec's and ADR 0060's. `YetiCoverChild` sets no presence attribute and acquires no item file, because only an item's root directive does: its rule matches only under a `.cover`, whose own host holds the link for as long as it is connected ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 6).
- Generated ids and the platform's relationship attributes: none. The cover renders no `id` and references none, so it does not use [generated-ids](generated-ids.md).

### 4. API

| Member | `YetiCover` | `YetiCoverChild` |
| --- | --- | --- |
| Class name | checked at the Pin: `yeti.d.ts` exports 46 names and neither is among them (Yeti's `YetiChild` is a manifest type, a different name), so each takes `Yeti`, not `NgxYeti` (ADR 0080 point 4; read in Yeti's built `dist/yeti.d.ts` at the pin, which ADR 0080 used) | as left |
| Selector | `[yetiCover]` | `[yetiCoverChild]` |
| `exportAs` | `yetiCover` | `yetiCoverChild` |
| Entry point | `ngx-yeti/cover` (building-blocks 1.3; ADR 0011 clause 10) | same |
| Inputs | `gap: YetiGap \| undefined` (Yeti default `md`); `height: YetiHeight \| undefined` (Yeti default `full`) | `center: boolean`, `booleanAttribute`, default `false` |
| Host | static `class: 'cover'`; static `data-ngx-yeti-item-cover: ''`; `[attr.data-gap]` and `[attr.data-height]` from the inputs, `null` when unset | `[attr.data-center]`: `''` when `center()` is true, else `null` |
| Providers | `yetiCoverToken` | none |
| Models, outputs, methods | none | none |
| Lifecycle | acquires the `cover` item file, on the server too, with `injectYetiItemStyles('cover')` as the last statement of its constructor (ticket 50 decisions 42 and 45) and releases it through `DestroyRef` (ADR 0060 point 2; building-blocks 1.9) | none |

Types come from the generated `yeti-types.ts` copy of Yeti's typings at the pin, re-exported by name (ADR 0060 point 10; building-blocks 1.3). The selectors are the ones Part 2 row 7 names; this spec fixes them, as ticket 26 left part selectors to the specs. No input changes a Yeti default.

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiCover` on an element that holds flow content (`header`, `section`, `main`, `article`, `footer`, or `div`), with at least one child (manifest `children`, `> *` min 1). On those hosts the static `height` attribute is inert (section 2).
2. Mark exactly one direct child with `yetiCoverChild center` (manifest `children`, `> [data-center]` min 1, max 1). With none, nothing is centered and every child sits at the top; with two, the free space is split between them (read in `cover.css`, not measured). Toggling `center` between children is fine as long as one carries it at a time.
3. Put `yetiCoverChild` on a direct child of the cover element. Yeti's selector is a child selector, so a marker on a grandchild does nothing. A component's host element is the child: write `<app-hero-copy yetiCoverChild center>`, not the directive inside the component's template. `@if`, `@for`, `@defer`, and `ng-container` add no element and need no care.
4. When the cover is the page's hero, keep the page's `h1` inside it (manifest `a11y.notes`). The cover takes no role; the element the consumer picks gives the semantics (Yeti's example uses `header`, and a `nav` inside it carries its own `aria-label`).
5. Do not write `class="cover"`, `data-gap`, `data-height`, `data-center`, or `data-ngx-yeti-item-cover` statically. The directives bind them, and hydration writes a static attribute again before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"; ADR 0070 consequences). A value newer than the pin goes through `[height]="$any('new')"` (ADR 0070).
6. Bind `gap`, `height`, and `center` from values that are the same on the server and the client, never from a browser-only read such as the window's height. The cover already follows the viewport through `dvh` in CSS (building-blocks 1.7), and the hydration constraints require the same DOM on both sides.
7. Import every directive class the template writes. A **Forgotten import** of `YetiCoverChild` with a static `center` renders an uncentered child with no error; only a bound input (`[gap]`, `[center]`) makes the compiler report it (NG8002) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `cover` | Nearest in Angular Material |
| --- | --- | --- |
| Shape | an item directive on the consumer's element, plus one part directive on the centered child | none: Material has no full-height or vertical-centring layout; `mat-drawer-container` fills its parent's height for a drawer layout (`NC/src/material/sidenav/drawer.ts:774`, `:788`) |
| Styling | Yeti's item file, loaded per item; tokens in the consumer's stylesheet | component styles and Sass theming |
| Accessibility | none of its own: purely visual | the drawer manages focus and a backdrop, which a cover has no counterpart for |
| API | two typed inputs, one boolean part input, `exportAs` | `autosize`, `hasBackdrop` |

Nothing from Material's API applies: the drawer container is a behavioural component, and the cover places the consumer's own content. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 7; building-blocks 1.2). The reason, row 1's, which row 7 takes: Yeti's CSS does the whole job; the directives add the class, the typed attributes and the marker, the item-file acquisition, and `exportAs`. Flexbox `gap` and the `dvh` unit are inside Baseline 2025 (building-blocks 1.2; `viewport-unit-variants` is inside both sets in [Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md), section 9, and its section 6.4 found the manifests' `support.unguarded` lists agree with the scan). No Aria pattern applies (the layout has no role), and no CDK piece is used: there is no id, focus, keyboard, observer, or direction read, and no viewport measurement in script (building-blocks 1.7).

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The cover adds no role, state, or property, and no tab stop.
- **Keyboard:** none.
- **Names:** none. A `header` cover that is not inside an `article`, `aside`, `main`, `nav`, or `section` maps to the banner landmark, and a `nav` inside it to a navigation landmark named by its own `aria-label`, as in Yeti's example; those are the consumer's elements and the package adds nothing.

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The cover's elements are the consumer's; the directives add no role. Usage rule 4 keeps the page's `h1` in the hero, where its structure matches what is seen. |
| 1.3.2 Meaningful Sequence | The flex column sets no `order` and no reversed direction; automatic margins move the centered child within its own place in the sequence. DOM order is reading order. Layer 1 asserts that the accessibility tree order equals the DOM order. |
| 1.4.4 Resize Text | The least height is a minimum, never a fixed size, and the rule sets no overflow, so zoomed text grows the band past the viewport (`docs.md`: "nothing is cut off"; Yeti's own "content taller than the band grows it" test). Layer 4 repeats it at 200 % text zoom. |
| 1.4.10 Reflow | Nothing sets an inline size. Ticket 17 measured no page-level horizontal scroll on the cover example at 320 x 640 in Chromium (section 2.4, 46 of 49 pages clean). Layer 4 asserts no horizontal overflow at a 320 px viewport, and at 320 x 256 that the band grows past the viewport and the page scrolls in the block direction only. |
| 1.4.11 Non-text Contrast, 1.4.3 Contrast (Minimum) | The cover draws nothing; its children's colours are theirs. axe reported no violation and no incomplete result on the cover example in light and dark (ticket 17, section 3), so the **Story gate** covers it and no play-function assertion is added. |
| 1.4.12 Text Spacing | The rules set no height and no overflow on children; overridden spacing grows them and the band (read). |
| 2.4.3 Focus Order | Focusable content keeps DOM order; the layout moves no element out of it. |

**Ledger rows owned:** none. The cover adds no feature Yeti lacks and closes no gap Yeti leaves: ticket 17 classed it with the layouts that "conform as far as measured" (section 3), and Part 2 row 7's Ledger column is "none".

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<header yetiCover yetiBox gap="lg" surface="sunken">
  <nav yetiBox yetiBorder surface="raised" aria-label="Site"><a href="/">Yeti</a></nav>
  <h1 yetiBox yetiBorder surface="raised" yetiCoverChild center>A heading centered in the viewport</h1>
  <p yetiBox yetiBorder surface="raised">Pinned to the bottom.</p>
</header>
```

Server HTML and the hydrated DOM are the same. The header carries `yeticover=""`, `yetibox=""`, `gap="lg"`, `surface="sunken"`, `class="cover box"` (the order of the two classes is Angular's and does not matter to Yeti's CSS), `data-gap="lg"` once, `data-surface="sunken"`, `data-ngx-yeti-item-cover=""`, and `data-ngx-yeti-item-box=""`. It has no `data-height`, because `height` is unset. The heading carries `yetiCoverChild`'s `center=""` and `data-center=""` beside the box's own class, attributes, and presence attribute, and no presence attribute of the cover (section 3). With `height="md"` the header also carries `height="md"` (inert) and `data-height="md"`.

The server also writes the item links into `<head>` in Yeti's order: for the cover, `rel="stylesheet"`, `href` `<url>layouts/cover/cover.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="cover"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided, followed by the `box` link, which comes later in `yeti.css` (ADR 0060 points 2, 3, and 5; `Y/src/yeti.css:24`, `:29`). The client adopts the links at bootstrap. The cover has no closed or open state.

The delta from Yeti's docs markup: the consumer writes `yetiCover` where the docs write `class="cover"`, `gap` and `height` where they write `data-gap` and `data-height`, and `yetiCoverChild center` where they write `data-center`. The `href="#"` of Yeti's example becomes a real route, which the package does not change.

### 9. Animation

None. The cover has no state and no transition, and Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). A consumer may remove a cover with a class-form `animate.leave`; the item link stays until Angular removes the host, because removal waits for the DOM (ADR 0060 point 4). A cover that is server-rendered never takes `animate.enter` (ADR 0011 clause 12). Changing `gap`, `height`, or `center` at run time moves the layout at once, with no transition, as Yeti's CSS has it. A consumer who wants the centered child to arrive writes the `enter` utility's directive beside `yetiCoverChild` (the [enter](enter.md) spec).

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes and marker, and the item link in `<head>` (section 8). Everything at first paint is a host binding (ADR 0011 clause 1). The least height is `100dvh` in CSS, which the browser resolves at first paint with no script. Nothing is **Pre-hydration state**: no person and no Yeti module can change a `data-*` attribute (ticket 26 grilling Q12).
- **Before hydration:** the directives create no node, read no layout, start no timer or observer, and touch no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is `YetiCover`'s item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** every element is claimed as is; bindings computed from the same inputs give the same values (usage rule 6); 0 style mutations (ADR 0060 point 5, measured for the mechanism).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the cover and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism). A `@defer` block inside a cover adds no element, so its content is the cover's direct child, and `yetiCoverChild` inside it works before and after the block hydrates.
- **`hydrate never`:** the cover is its server HTML and stays styled while its host is connected, whatever live covers do (ADR 0060 point 4; ADR 0045's presence attribute is what the check queries). On a host shared with `box`, each item's presence attribute keeps its own link (ADR 0045). There is no Angular behaviour to lose; a bound input simply never changes.
- **Client-only `@defer`:** the item file is fetched when `YetiCover` is constructed, which can show collapsed frames; the consumer closes the gap with `provideYetiStyles({ preload: ['cover'] })` (ADR 0060 point 6; [setup](setup.md)). No entry animation needs the file.
- **Event replay:** the directives declare no listener, so nothing replays and no `jsaction` is added by them.
- **`withI18nSupport()`:** a hero's text is translated with `i18n` in the consumer's component. The directives add no `i18n` block; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** inputs are signals and host bindings read them, so a bound `gap`, `height`, or `center` refreshes with no zone (map, Standing rulings, item 43; ADR 0070 rule 4).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the hero is readable and laid out, viewport-tall and centered, because the attributes and the item link are in the server HTML. Nothing is lost: the cover has no behaviour. A client-only application gets no such promise.
- **Hydration boundary:** a cover and its marked child share one **Hydration boundary** unless a `@defer` block inside the cover holds the child; either way both are static, so nothing differs between the two.

### 11. Hydration constraints

The cover complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; `data-gap`, `data-height`, and `data-center` come from inputs whose values usage rule 6 keeps equal on both sides.
- **No direct DOM manipulation:** the directives write nothing to the DOM outside host bindings. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directives change no element. The consumer's markup must be valid as written; for example a cover on a `p` cannot hold a heading, so the parser would repair it and differ from the server's DOM; usage rule 1's hosts avoid it.
- **`preserveWhitespaces`:** the directives have no template. A flex container ignores whitespace text between its children.
- **No output branched on the platform:** none.
- **Static attributes the directives bind:** usage rule 5 keeps the consumer from writing them.

### 12. Single-page application

None. The cover has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). A link inside a cover's `nav` is the consumer's link. On a route change, a route's covers leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-cover]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders a cover again re-inserts it.

### 13. Item file

`yeti-css/css/layouts/cover/cover.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiCover]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:24`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-cover` has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the `[data-gap]` and `[data-height]` value rules and the `--yeti-cover-height` token), and optionally `provideYetiStyles({ preload: ['cover'] })`. The cover adds nothing to it. Cross-item files acquired: none (`cover.css` has no cross-item rule; ADR 0060 point 9).

One order matters inside `yeti.layouts` (read, not measured): `.cover > *` sets `margin: 0`, and `.center` sets `margin-inline: auto`, at equal specificity, so a `center` that is a cover's child keeps its inline centring only because `center.css` comes after `cover.css` in `yeti.css` (`:24`, `:30`). ADR 0060 point 3 inserts links in that order whichever directive is created first, which is the case ticket 23 measured for `stack` and `center`. Layer 4 tests it for the cover.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class, attributes, and marker in the DOM, the item link, where the children land, and how tall the band is. It never asserts a private field, the parent token's value, or how the styles service counts. No test depends on a public token's default value ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): where a test needs a height or a gap, it compares with a probe element in the same page styled `block-size: var(--yeti-cover-height)` or `var(--yeti-height-md)`, or reads the token's computed value, as Yeti's own `Y/test/browser/layouts/cover.spec.js` does with its `token()` helper. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `cover` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `cover--default`: section 8's markup (Yeti's example with `yetiBox` beside `yetiCover`). Asserts `class` contains `cover` and `box`, one `data-gap="lg"`, both presence attributes on the header, no `data-height`, `data-center` on the heading only, and no `tabindex` or role added by the package. Asserts the cover's block size is at least the probe's `var(--yeti-cover-height)`; the `nav` is at the top and the paragraph at the bottom of the cover's content box; and the heading's vertical midpoint equals the midpoint between the `nav`'s bottom and the paragraph's top within 1 px (Yeti's "centers the data-center child" case). Asserts every child's computed margins are 0 and that the accessibility tree order equals the DOM order.
- `cover--settings`: `gap`, `height`, and which child is `center` bound from Storybook controls. Asserts `data-gap` and `data-height` follow each control and that clearing a control removes the attribute; for each `height` value the cover's block size equals a probe styled with the matching token (`--yeti-height-sm` to `-xl`, `--yeti-height-half`, `--yeti-cover-height` for `full` and for unset); moving `center` moves `data-center` to the chosen child and the centring with it.
- `cover--grows`: `height="sm"` holding a centered child taller than the band (Yeti's fixture's `#overflow` case). Asserts the band is taller than the probe's `--yeti-height-sm`, at least as tall as the child, the child's bottom is inside the band, and the cover's `scrollHeight` equals its `clientHeight` (nothing clipped).
- `cover--holding-center`: a hero built from layouts, `<div yetiCenter yetiCoverChild center>` inside a cover. Asserts the center's left and right margins are equal and non-zero at a wide container, so the cover's `margin: 0` on children did not win (section 13).
- `cover--themed`: the story sets `--yeti-cover-height: 400px` on one cover and `auto` on another. Asserts the first cover's block size follows a probe inside the same wrapper and the second is only as tall as its content plus gaps.

### Layer 2: browser-level (`npx nx test <lib>`, `cover.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiCover, { tagName: 'header' })`: the host has class `cover` and `data-ngx-yeti-item-cover`, and no `data-gap` or `data-height`; with `bindings` setting `gap` to `'lg'` and `height` to `'half'`, the attributes follow, and setting them back to `undefined` removes them.
- While a `YetiCover` fixture lives, one `<link data-ngx-yeti-styles="cover">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- `createDirective(YetiCoverChild, { tagName: 'h1' })`: no `data-center` by default; `center` bound `true` renders `data-center=""`, `false` removes it; the host carries no presence attribute and acquires no link (this spec's reading, section 3).
- No directive adds a listener to its host.

A small test host covers what `createDirective` cannot: template references `#c="yetiCover"` and `#m="yetiCoverChild"` resolve, and the part's injected token is the cover instance (a DI fact, not a rendered one); a static `center` attribute sets the input through `booleanAttribute`; a static `height="md"` renders both `height="md"` and `data-height="md"` (the `inert` kind); a part outside any cover renders its marker with no error; `yetiCover yetiBox gap="lg"` renders one `data-gap="lg"` and both presence attributes; and the consumer's own `class` on each host is kept.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `cover.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture whose heading and paragraph carry `i18n` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the header renders `class="cover"`, `data-ngx-yeti-item-cover`, and `data-height="md"` from a bound input; the centered child renders `data-center=""`; `<head>` holds one item link with `data-ngx-yeti-styles="cover"`, `data-beasties-skip`, and an `href` ending `layouts/cover/cover.css?v=<pin>`; no element carries a `jsaction` from the package.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the cover through the contract mapping: class `cover` has `YetiCover`; `data-gap` and `data-height` have inputs whose types are the manifest's vocabularies `gap` and `height`; `data-center` has the `center` input on `YetiCoverChild`; the manifest's events for `cover` are empty. A pin move that adds an attribute, a value, or a marker fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids, at viewports of 1280 x 800 and 320 x 640, after Yeti's own `cover.spec.js`:

- the default cover is at least the viewport's height; `height="half"` is half the viewport's height, and `md` is the probe's `--yeti-height-md` and shorter than the full cover (Yeti's falsification case);
- the centered child's midpoint is the midpoint between its neighbours within 1 px;
- at 320 px the page has no horizontal overflow (1.4.10); at 320 x 256 and at 200 % text zoom the band grows past the viewport, its content's bottom is inside it, and the page scrolls in the block direction only (1.4.4, 1.4.10).

That `100dvh` tracks a phone's collapsing toolbars (user story 39) is Yeti's CSS and the browser's; Playwright's device emulation does not collapse toolbars, so no layer asserts it (read, `docs.md`).

Fixture-app half, built with `outputMode: 'server'`, with a `/cover` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences):

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- with JavaScript disabled the cover is viewport-tall with its child centered, as in the Storybook half, and `@axe-core/playwright` with the six tags reports no violation;
- a cover inside a client-only `@defer` block with `cover` in the preload list shows no collapsed frame; a cover with `box` on one element inside a `hydrate never` block keeps both item links after every live cover and box on the page is removed (ADR 0045's shared-host case);
- a page that first shows a standalone `center` and then inserts a cover holding a `center` keeps the inner center's auto inline margins, so the `cover` link went in before the `center` link (ADR 0060 point 3; section 13);
- navigating from the cover route to a route without one removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` for the default story, and its `test/browser/layouts/cover.spec.js` with the fixture `test/browser/fixtures/layouts/cover.html` for the geometry cases; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; ticket 23's measurement of the `stack` and `center` tie for the order case.

## Out of Scope

- An input per token, or a `minHeight` input outside Yeti's `height` vocabulary (ADR 0004; ADR 0005).
- A shared any-element `[yetiCenter]`-style marker directive for `data-center` (ADR 0070, considered options; ticket 26 grilling Q6). `[yetiCenter]` is the `center` layout's selector.
- A directive for the cover's unmarked children (ticket 26 grilling Q6).
- Any check that exactly one direct child is centered, that the part sits on a direct child, or that a cover has a child. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- A viewport-keyed input or any JavaScript read of the viewport's height (building-blocks 1.7).
- Package CSS for the cover. The cover owns no ledger row, so no accessibility rule applies (ADR 0060 point 8).
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).
- The `hero` recipe, which is "the one-class form of a cover holding columns" with its own spec (Part 2 row 18).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiCover]` with `gap` and `height`; part directive `[yetiCoverChild]` with `center` | building-blocks Part 2 row 7; ticket 26 rows 27 to 29 |
| `data-center` is kind C (a modifier: "Centers") on a per-item part directive | ADR 0070; ticket 26 grilling Q6 and Q7 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by Yeti's `YetiGap` and `YetiHeight`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2 |
| `height` is an `inert` presentational-attribute input on the cover's hosts | building-blocks 1.4; ticket 26 row 28 and grilling Q15 |
| `yetiCover` and `yetiBox` on one element share one `gap` | ticket 26 grilling Q16; building-blocks 1.4 |
| The part injects `yetiCoverToken` optionally with `skipSelf` | ADR 0070 kind C; building-blocks 1.9 |
| `exportAs` on both; class names with no collision | building-blocks 1.3; ADR 0080 points 3 and 4 |
| Entry point `ngx-yeti/cover` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 7 |
| Tokens are the consumer's | ADR 0004 |
| Item file as a counted link in Yeti's order; presence attribute `data-ngx-yeti-item-cover` | ADR 0060 points 2 to 6; ADR 0045 |
| Only the item directive marks its host and acquires the item file | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 6 |
| No contrast assertion beyond the Story gate | ADR 0015 point 3 (only for what axe leaves incomplete); ticket 17 section 3 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A sign-in screen, centered in the viewport, with a footnote:

```html
<main yetiCover gap="lg">
  <form yetiCoverChild center (ngSubmit)="signIn()">
    <h1 i18n>Sign in</h1>
    <!-- fields -->
  </form>
  <p i18n>Need help? Contact the park office.</p>
</main>
```

```ts
import { YetiCover, YetiCoverChild } from 'ngx-yeti/cover';

@Component({
  selector: 'app-sign-in',
  imports: [YetiCover, YetiCoverChild],
  templateUrl: './sign-in.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignIn {}
```

A band with more room than the spacing scale has (`docs.md`): `<section yetiCover height="md"><h2 yetiCoverChild center i18n>Trail maps</h2></section>`.

A hero built from layouts, after Yeti's hero docs ("Built from primitives"):

```html
<header yetiCover>
  <div yetiColumns yetiCoverChild center threshold="lg" gap="lg" align="center">
    <div yetiStack gap="sm">
      <h1 i18n>Every marked route in the park</h1>
      <p i18n>Printed maps you can walk by.</p>
    </div>
    <div yetiFrame ratio="4/3">
      <img ngSrc="valley.jpg" width="1200" height="900" alt="The valley trail at dusk" i18n-alt />
    </div>
  </div>
</header>
```

The imports are `YetiCover`, `YetiCoverChild`, `NgxYetiColumns`, `YetiStack`, `YetiFrame`, and `NgOptimizedImage` (building-blocks 1.2, images rule; 1.3, `NgxYetiColumns`).

A cover only as tall as its content on one page, in the consumer's stylesheet after Yeti (`Y/src/tokens/tokens.json:124`):

```css
.press-page {
  --yeti-cover-height: auto;
}
```

The centered child chosen from state: `<p yetiCoverChild [center]="!hasHeading()">`. A value newer than the pin: `<section yetiCover [height]="$any('2xl')">`. A page whose cover renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['cover'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `layouts/cover/cover.css`, loaded by `YetiCover` as a counted link (section 13). The consumer writes nothing for the cover beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps `data-gap` and `data-height` to the private gap and height (`:6-37`, `:185-190`); `tokens/space.css` declares `--yeti-cover-height`, the height family, and the space scale.
3. **Cross-item rules:** none in `cover.css`. The tie with `center` (`.cover > *` against `.center`) is settled by ADR 0060 point 3's order (section 13). Items composed on the cover's element or its children (`box`, `columns`, `center`, `stack`) load their own files through their own directives.
4. **Tokens:** reads `--yeti-cover-height` and `--yeti-space-md`, and the token behind a bound value; writes none (section 2).
5. **What breaks without the item file:** the element is an ordinary block with no least height, no gap, and no centring; children keep their own margins and sit at the top, with no error.
6. **Tailwind name collision:** none known. building-blocks 1.13 lists `container`, `grid`, `table`, and `hidden`, not `cover`. Tailwind's `bg-cover` and `object-cover` are different class names (inferred, not measured).

### Platform features to adopt when the browser target moves

None. Both features the manifest lists as unguarded, flexbox `gap` and `dvh` units, are inside Baseline 2025 (section 6), and Yeti guards nothing for the cover. The package measures no viewport in script, so no future platform feature changes its code.

### Single-page-application pieces relied on

None: the cover uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
