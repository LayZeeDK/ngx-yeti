# Spec: scroller (layout)

Ticket: [64. Spec: scroller (layout)](../issues/64-spec-scroller.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 14 and Part 1, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 52 to 55 and grilling Q3, Q13, Q15, and Q16, [Decide: the spec list](../issues/11-decide-spec-list.md) row 14, [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). The item owns no [ledger.md](../ledger.md) row. `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x); `NGP/` is `github.com/angular/angular/packages/` at 22.2.x. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 59 to 62), and each is cited where it applies.

## Problem Statement

Yeti's `scroller` is "for a row that should stay a row: a strip of photos, a set of related cards, a filmstrip of steps. Where a cluster would wrap, a scroller keeps everything on one line and lets the visitor move along it" (`Y/src/layouts/scroller/docs.md`). It is one **Identity class**, `scroller`, on a flex row with `overflow-x: auto` whose children do not shrink, and four attributes: `data-gap` (the space between items), `data-width` (one width for every item), `data-snap` (scroll snapping), and `data-justify` (where a snapping item settles). It has no **Marker**, no **Module**, and no events (`Y/src/layouts/scroller/manifest.json`, `scroller.css`). It is also the one interactive layout: a region whose content scrolls must be reachable from the keyboard, so the manifest's `a11y` block requires `role="region"`, `tabindex`, and a name (`manifest.json:23-31`), and Yeti's validator refuses a scroller without them (`Y/bin/validate.js:106-112`).

An application developer using the package cannot write `class="scroller"` or any of the four `data-*` attributes: a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). Written by hand, `data-width="medium"` or `data-justify="between"` compiles and silently does nothing ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `scroller` **Item file** loaded while a scroller is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)); without it the items wrap or shrink to the container and nothing scrolls, with no error.

The keyboard part is where a hand-written scroller usually fails. A `div` with `overflow-x: auto` and no `tabindex` is a region a mouse or touch user can scroll and a keyboard user cannot reach when its items hold nothing focusable: a strip of images or text cards fails WCAG 2.1.1 Keyboard, and axe reports it as `scrollable-region-focusable` (serious). A region with a `tabindex` and no name is announced as a nameless stop. The package must give every scroller the focus stop and the role in every rendering mode, before any script runs, and must make the name a requirement the consumer cannot miss.

## Solution

One directive in the secondary entry point `ngx-yeti/scroller` (building-blocks Part 2 row 14; 1.3):

- **`YetiScroller`**, the **Item directive**, on `[yetiScroller]`, `exportAs: 'yetiScroller'`. It binds `scroller` as a static host class, the manifest's required `role="region"` and `tabindex="0"` as static host attributes (Part 2 row 14, `scroller/manifest.json:24-25`), and `data-gap`, `data-width`, `data-snap`, and `data-justify` from the typed inputs `gap`, `width`, `snap`, and `justify` (ticket 26 rows 52 to 55). It sets its presence attribute `data-ngx-yeti-item-scroller` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)). It acquires the `scroller` item file when it is created, on the server too, and releases it when it is destroyed (ADR 0060 point 2).

The developer writes `<div yetiScroller snap width="sm" aria-label="Featured articles">` where Yeti's docs write `<div class="scroller" data-snap data-width="sm" role="region" aria-label="Featured articles" tabindex="0">`. The accessible name stays the consumer's `aria-label` or `aria-labelledby`, as a **Usage rule**, and the directive declares no name input (building-blocks 1.10, Names; Part 2 row 14). An unset input renders no attribute, so Yeti's defaults apply from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1).

Everything else is Yeti's CSS and the platform. The directive declares no listener, no render callback, and no service; its only constructor work is the item acquisition. The focus stop and the arrow-key scrolling are the browser's own behaviour for a focused scrolling element (ticket 17 section 4.22, measured in three engines). So the **Scroll region** works the same on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block.

## User Stories

1. As an application developer, I want to make an element a horizontal scroller with one directive attribute, so that I never write Yeti's `scroller` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="scroller"` and `data-*` attributes, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want the directive to render `role="region"` and `tabindex="0"` itself, so that I cannot forget the two attributes Yeti's validator requires.
4. As an application developer, I want to name the region with my own `aria-label` or `aria-labelledby`, so that the name is in my language and my template, as for every other element I write.
5. As an application developer, I want the usage rules to say that the name is required, so that I know an unnamed scroller is a misuse even though nothing reports it in the first milestone.
6. As an application developer, I want a typed `gap` input drawn from Yeti's `gap` vocabulary, fluid pairs included, so that a misspelt value fails to compile.
7. As an application developer, I want a typed `width` input drawn from Yeti's `width` vocabulary, so that every item takes one width and `width="medium"` fails to compile.
8. As an application developer, I want a boolean `snap` input that I can write as a bare attribute, so that `<div yetiScroller snap>` turns on scroll snapping.
9. As an application developer, I want a `justify` input typed `'start' | 'center' | 'end'`, so that `justify="between"`, which Yeti's scroller does not take, fails to compile.
10. As an application developer, I want the usage rules to say that `justify` does nothing without `snap`, so that I do not expect it to align a plain track.
11. As an application developer, I want an input I leave unset to render no attribute, so that Yeti's own default applies and my server HTML stays Yeti's minimal markup.
12. As an application developer, I want to bind every input from signals, so that the strip follows my state under zoneless change detection.
13. As an application developer, I want the input value types re-exported by name from the package (`YetiGap`, `YetiWidth`, and the package's `YetiScrollerJustify`), so that I can type my own signals that feed the inputs.
14. As an application developer, I want a value newer than the pin to be bindable through `$any`, so that I am not blocked until the package's pin moves.
15. As an application developer, I want a static `width="sm"` to do nothing beyond setting the input, so that the HTML `width` attribute has no effect on my `div` or `section`.
16. As an application developer, I want cards, images, or a wide table as the scroller's children, so that I can use it for every row that should stay a row.
17. As an application developer, I want a wide table inside a scroller to scroll inside its region while the page stays put, so that I follow Yeti's table docs without turning the table into cards.
18. As an application developer, I want an image or a video wider than the track to keep its width, so that a filmstrip overflows the track instead of shrinking.
19. As an application developer, I want a text child to keep the prose measure, so that a caption in a scroller does not run to one long line.
20. As an application developer, I want a visually hidden label inside a scroller to stay inside the track, so that it does not widen the page.
21. As an application developer, I want `@for` and `@if` inside the scroller to add items without wrapper elements, so that a list of cards renders as one strip.
22. As an application developer, I want a component of mine to be an item, so that `<app-card>` hosts can be the children.
23. As an application developer, I want template references (`#s="yetiScroller"`), so that the scroller follows the package's `exportAs` rule.
24. As an application developer, I want to import the directive from `ngx-yeti/scroller`, so that a `@defer` block can split it with the rest of the item.
25. As an application developer, I want the scroller's item file loaded when the first scroller renders and removed after the last leaves, so that I do not import `scroller.css` globally.
26. As an application developer, I want the item file in the server HTML when a server-rendered page has a scroller, so that the first paint is already one row.
27. As an application developer, I want hydration to change nothing on a scroller, so that I get no `NG05xx` error and no jump.
28. As an application developer, I want a scroller inside a `hydrate never` block to keep its styles and its keyboard access for as long as it is on the page, so that a dehydrated strip still works.
29. As an application developer, I want to know that a scroller inside a client-only `@defer` block needs `scroller` in the preload list for a flash-free first paint, so that I can avoid a wrapped frame.
30. As an application developer using `withI18nSupport()`, I want my translated `aria-label` and item text to hydrate without being re-rendered, so that localised pages keep the server's DOM.
31. As an application developer, I want the usage rules to say which elements may host a scroller, so that the region role does not replace a list's or a table's own role.
32. As a keyboard user, I want Tab to reach the scroller even when it holds nothing focusable, so that I can scroll a strip of images or text.
33. As a keyboard user, I want the arrow keys to scroll the focused scroller, so that I can move along the row without a mouse.
34. As a keyboard user, I want a visible focus ring on the scroller, so that I know which region the arrow keys will scroll.
35. As a keyboard user, I want the scroller to work before the page's script has loaded and with JavaScript off, so that keyboard access does not wait for Angular.
36. As a keyboard user, I want a scroll or a focus I made before hydration to survive hydration, so that the page does not jump back under me.
37. As a keyboard user, I want Tab to move through the items' own links and buttons in DOM order after the region, so that focus order matches the row.
38. As a screen-reader user, I want the scroller announced as a region with a name, so that I know what the strip holds.
39. As a screen-reader user, I want the items read in DOM order, so that the reading order matches the visual order in both directions.
40. As a user of a right-to-left page, I want the scroller to start at the inline start and scroll toward the inline end, so that the row reads in my direction.
41. As a low-vision user, I want a scroller to scroll inside its own box at 320 CSS pixels while the page never scrolls sideways, so that only the strip needs a horizontal scroll.
42. As a touch user, I want a horizontal swipe in the scroller not to trigger the browser's back navigation, so that scrolling the strip does not leave the page.
43. As a package maintainer, I want the contract check to cover the scroller's class, its four attributes, every value of their vocabularies, and its empty event list, so that a pin move that adds or changes one fails before release.
44. As a package maintainer, I want the SSR smoke to assert the class, the role, the `tabindex`, the bound attributes, and the item link in the server HTML, so that the first paint is proven.
45. As a package maintainer, I want a test that proves axe's `scrollable-region-focusable` rule actually ran against an overflowing scroller, so that a passing **Story gate** is not a rule that never applied.
46. As a package maintainer, I want the fixture app to render a scroller on a prerendered route and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
47. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default does not fail a test for no reason.
48. As a package maintainer, I want the geometry tests to follow Yeti's own `scroller.spec.js` cases, so that the package proves the same layout Yeti proves.
49. As a package maintainer, I want the class name and the `justify` type name checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/layouts/scroller/manifest.json`, `scroller.css`, `docs.md`, and `example.html`, and in `Y/src/layouts/attributes.css`, `Y/src/tokens/space.css`, and `Y/schema/vocabulary.json`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `scroller`, `layout`, `Grids and Rows` |
| `class` | `scroller` |
| `attributes` | `data-gap`: enum, vocabulary `gap` (29 values), default `md`, "Space between items". `data-width`: enum, vocabulary `width` (`2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`), no default, "Give every item this width instead of its natural one". `data-snap`: boolean, "Snap each item's start edge into place as the track scrolls". `data-justify`: enum with its own `values` `start`, `center`, `end`, no default, "Where each item settles along the track when data-snap is set ... Nothing without data-snap" |
| `classes` | empty |
| `children` | `> *` (min 1, no max): "The items. None shrinks; the track scrolls instead. A single wide item (a table, an image) is legal" |
| `markers` | none |
| `tokens` | public: `--yeti-space-md` ("The default gap"); private: `--_yeti-gap`, `--_yeti-snap` |
| `a11y` | `role`: `region`; `requiredAttributes`: `tabindex`, `aria-label \| aria-labelledby`; `keyboard`: Tab "Focuses the track so the arrow keys can scroll it", ArrowLeft / ArrowRight "Scroll the track"; notes: "A scrollable region must be reachable from the keyboard: give it tabindex=\"0\", role=\"region\", and a name with aria-label." (`:23-31`) |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: `flexbox gap`, `scroll snap`, `overscroll-behavior`; `guarded`: empty |
| `since` | `7.0.0` |

The rules, in `@layer yeti.layouts`: `.scroller` is `display: flex` with `gap: var(--_yeti-gap)`, `overflow-x: auto`, `overscroll-behavior-x: contain`, and `position: relative`, so an absolutely positioned descendant (a **Visually hidden** label) is contained by the track instead of the page; `.scroller:not([data-gap])` sets the gap to `--yeti-space-md`; `.scroller > *` sets `margin: 0` and `flex: 0 0 auto`; `.scroller > :is(img, picture, video, canvas, svg)` lifts the reset's `max-inline-size: 100%` for media only, so text children keep the prose measure (`Y/src/base/reset.css:22-26`, `Y/src/base/prose.css:22-24`); `.scroller[data-width] > *` sets `inline-size: var(--_yeti-width)`; `.scroller[data-snap]` sets `scroll-snap-type: x mandatory`, its children `scroll-snap-align: var(--_yeti-snap, start)`, and `[data-justify="center"]` and `"end"` set `--_yeti-snap`. The value rules for `data-gap` and `data-width` are in the **Always-loaded group**'s `layouts/attributes.css` (`:6-37` for gap, `:171-177` for width). `attributes.css` also maps every `data-justify` value to `--_yeti-justify` (`:154-160`), which `scroller.css` does not read: the scroller maps its own three values to `--_yeti-snap`, because scroll snapping does not take flex keywords (`scroller.css` comment).

Attributes left to the consumer: the accessible name, `aria-label` or `aria-labelledby`, which the directive cannot know (building-blocks 1.10, Names; Part 2 row 14). Ticket 26 maps all four `data-*` attributes and leaves none to the consumer (rows 52 to 55).

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `scroller` | static host class on `[yetiScroller]` (`YetiScroller`) | always | ADR 0003 point 1; Part 2 row 14 |
| `a11y.role` | `region` | static host attribute `role="region"` | always | Part 2 row 14; `manifest.json:24` |
| `a11y.requiredAttributes`: `tabindex` | required | static host attribute `tabindex="0"` | always | Part 2 row 14; `manifest.json:25`; ticket 11 row 14 |
| `a11y.requiredAttributes`: `aria-label \| aria-labelledby` | required | the consumer's; no input (usage rule 2) | not rendered by the package | building-blocks 1.10, Names; Part 2 row 14 |
| Attribute `data-gap` | space between items; default `md` | input `gap`: `YetiGap \| undefined`, bound `[attr.data-gap]`, `null` when unset | unset renders nothing; Yeti's `md` applies. `gap` is not an HTML attribute | ticket 26 row 52 (R) |
| Attribute `data-width` | one width for every item; no default | input `width`: `YetiWidth \| undefined`, bound `[attr.data-width]`, `null` when unset | unset renders nothing and items keep their natural width. Static form: `inert` (below) | ticket 26 row 53 (R); building-blocks 1.4 |
| Attribute `data-snap` | scroll snapping; boolean | input `snap`: `boolean` with `booleanAttribute`, default `false`, bound `[attr.data-snap]` as `''` when true and `null` when false | `false` renders nothing. `snap` is not an HTML attribute | ticket 26 row 54 (R) |
| Attribute `data-justify` | where a snapping item settles: `start`, `center`, `end`; no default | input `justify`: `YetiScrollerJustify \| undefined`, bound `[attr.data-justify]`, `null` when unset | unset renders nothing; items settle at their start edge. `justify` is not an HTML attribute | ticket 26 row 55 (R); ADR 0070 rule 2; ADR 0080 point 5 |
| Children `> *` | the items | no directive | not applicable | manifest `children`; ticket 26 grilling Q6 |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Token `--yeti-space-md` | default gap | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--yeti-space-*`, `--yeti-width-*` | the values each `gap` and `width` value reads (`attributes.css`) | the consumer's | not applicable | ADR 0004 |
| Tokens `--_yeti-gap`, `--_yeti-snap`, and `--_yeti-width` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-scroller=""` on `[yetiScroller]` | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2 |

`YetiScrollerJustify` is `Extract<YetiJustify, 'start' | 'center' | 'end'>`: ADR 0070 rule 2 gives an attribute with its own value list the `Extract` of the vocabulary that holds its values, naming this attribute as its example, and ADR 0080 point 5 gives it a package-declared name `Yeti<Item><Input>`. The name is exported beside Yeti's re-exported vocabulary types ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 60).

The `inert` kind for `width` (building-blocks 1.4): HTML's `width` means something on `img`, `table`, `iframe`, `video`, `canvas`, and the obsolete forms on `hr`, `col`, and table cells, none of which can host a scroller under usage rule 1, so a static `width="sm"` stays on the host beside `data-width="sm"` and does nothing. The directive binds nothing for it (ticket 26 row 53 and grilling Q15, which this spec confirms for its hosts, `div` and `section`). A bound `[width]` renders no `width` attribute.

**Module replaced:** none. Yeti's `scroller` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 14, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads `--yeti-space-md` for its default gap, and through the always-loaded value rules whichever `--yeti-space-*` (or fluid pair) and `--yeti-width-*` a set attribute names. The page's `:focus-visible` ring reads `--yeti-color-focus` (`Y/src/base/typography.css:101-104`), a base rule, not the item's. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`. They are derived tokens, not hue, chroma, or scale inputs, so each also takes effect on one scroller and its descendants (`Y/src/guides/theming.md:38`). **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

None. `YetiScroller` is standalone: it provides no **Injection token**, injects no parent, hosts no directive, and is hosted by none (Part 2, "Two findings that hold across the matrix"). The scroller has no **Part directive**: its children carry no marker, so a child needs no directive (ticket 26 grilling Q6), and the multi-part-items decision of 2026-10-03 (ticket 50) does not apply.

Composition. A consumer puts item directives on the scroller's children (`<article yetiCard>`, `<div yetiFrame>`, `<table yetiTable>`), as Yeti's example puts boxes there. On the scroller's own element, `yetiBox` may sit beside it: both declare `gap: YetiGap`, so one static `gap="lg"` feeds both and renders the one `data-gap` Yeti means, the box's padding and the scroller's gap at once (ticket 26 grilling Q16; building-blocks 1.4, shared vocabularies), and each sets its own presence attribute (ADR 0045). `width` is `YetiWidth` on every root directive that declares it (`sidebar`, `media`, `shell`, `demo`; ticket 26 rows 57, 78, 85, 110). `justify` is narrower here than on `cluster`, `columns`, and `pagination` (`YetiJustify`, ticket 26 rows 17, 22, 133). Those three set the element's `display` as the scroller does, and Yeti's docs never put two of them on one element, so this spec reads, as the [cluster](cluster.md) spec does, that a scroller never shares its element with another layout, and states it as usage rule 5 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 61).

The only injection is the root styles service of ADR 0060, reached by `injectYetiItemStyles('scroller')` from `ngx-yeti/styles` as the last statement of the constructor ([setup](setup.md); ticket 50 decisions 42 and 45), through which `YetiScroller` acquires and releases the `scroller` item file. That service is the [setup](setup.md) spec's (`provideYetiStyles()`) and ADR 0060's.

Generated ids and the platform's relationship attributes: none. The directive renders no `id` and references none, so it does not use [generated-ids](generated-ids.md). An `aria-labelledby` names the consumer's own heading by the consumer's own static `id`.

### 4. API

| Member | Value |
| --- | --- |
| Class | `YetiScroller`. Checked at the Pin: the 46 names `yeti.d.ts` exports include neither `YetiScroller` nor `YetiScrollerJustify` (the list in the shared brief, checked against Yeti's built `dist/yeti.d.ts` at the pin, the build ADR 0080 used), so both take `Yeti` (ADR 0080 point 4) |
| Selector, `exportAs` | `[yetiScroller]`, `yetiScroller` (Part 2 row 14; building-blocks 1.3) |
| Entry point | `ngx-yeti/scroller` (building-blocks 1.3; ADR 0011 clause 10) |
| Inputs | `gap: YetiGap \| undefined` (Yeti default `md`); `width: YetiWidth \| undefined` (no Yeti default); `snap: boolean`, `booleanAttribute`, default `false`; `justify: YetiScrollerJustify \| undefined` (no Yeti default; `start` applies under `snap`) |
| Host | static `class: 'scroller'`; static `role: 'region'`; static `tabindex: '0'`; static `'data-ngx-yeti-item-scroller': ''`; `[attr.data-gap]`, `[attr.data-width]`, `[attr.data-justify]` from the inputs, `null` when unset; `[attr.data-snap]`: `''` when `snap()` is true, else `null` |
| Providers | none |
| Models, outputs, methods, listeners | none |
| Lifecycle | acquires the `scroller` item file, on the server too, with `injectYetiItemStyles('scroller')` as the last statement of its constructor (ticket 50 decisions 42 and 45) and releases it through `DestroyRef` (ADR 0060 point 2; building-blocks 1.9) |

Types come from the generated `yeti-types.ts` copy of Yeti's typings at the pin, re-exported by name (ADR 0060 point 10; ADR 0080 point 5). `YetiScrollerJustify` is declared in the item's entry point from `YetiJustify` and re-exported by name from the primary entry point beside the vocabulary types ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 60). No input changes a Yeti default. A static attribute type-checks as a string literal under `strictTemplates`, so `justify="center"` compiles and `justify="between"` does not (ADR 0070 rule 2; ticket 26 grilling Q14, read, not run).

The three static host attributes are not inputs. A consumer's static attribute of the same name on the element wins over a directive's static host attribute: Angular merges the directives' host attributes first and the template's attributes last, "so that they have the highest priority" (`NGP/core/src/render3/view/elements.ts:54-55`, `view/directives.ts:198-200`, read, not run). So a consumer's `role` or `tabindex` replaces the directive's, which usage rule 3 forbids.

**Usage rules** (numbered here and in the directive's JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiScroller` on a `div` or a `section`, the hosts whose own role the static `role="region"` may replace: a `div` has none, and a `section` with a name already maps to a region, so the attribute only restates it (inferred from ARIA in HTML; html-validate's `prefer-native-element` prefers the `section`, ticket 17). Never put it on a `ul`, `ol`, `table`, `nav`, or other element whose own role the page depends on: `role="region"` would replace that role, so a list's `li` children would lose their list and a table its table semantics. axe's `aria-allowed-role` (in the `best-practice` tag the Story gate runs) and `listitem` report the list case (inferred). A list of cards keeps its semantics as the items' own markup; a wide table goes inside the scroller as its one child, as Yeti's table docs write it (`Y/src/components/table/docs.md:19`, `table/manifest.json:41`; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 59).
2. Name every scroller with `aria-label` or `aria-labelledby` on the same element (manifest `a11y.requiredAttributes`; building-blocks 1.10, Names). Translate an `aria-label` with `i18n-aria-label`. When the strip has a visible title, put the heading before the scroller, not inside it (every direct child is an item, usage rule 6), and point `aria-labelledby` at the heading's own static `id`. An unnamed scroller is a Tab stop announced only as "region"; the first milestone reports nothing.
3. Do not write `class="scroller"`, `role`, `tabindex`, `data-gap`, `data-width`, `data-snap`, `data-justify`, or `data-ngx-yeti-item-scroller` on the element. The directive renders them; a consumer's static `role` or `tabindex` would replace the directive's (above), and a static `data-*` copy is written back and removed again at hydration (ADR 0003 points 1 and 2; ADR 0070's 2026-10-03 consequence; building-blocks, "Hydration constraints (2026-10-03)"). There is no opt-out of the focus stop: a scroller whose content never overflows keeps its `tabindex`, as Yeti's validator requires of every scroller (`Y/bin/validate.js:106-112`). A value newer than the pin goes through `$any` (`[width]="$any('3xl')"`, ADR 0070).
4. Set `justify` only with `snap`. Without `data-snap`, `data-justify` does nothing on a scroller (manifest description; `scroller.css`).
5. Do not put `yetiScroller` on the same element as another layout that sets `display` (`yetiCluster`, `yetiColumns`, `yetiGrid`, `yetiStack`, and the rest); write the other layout inside an item instead. `yetiBox` beside it is fine (section 3; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 61).
6. Give the scroller at least one element child (manifest `children`, `> *` min 1). Every direct child is an item: an element, or a component's host element. `@for`, `@if`, `@defer`, and `ng-container` add no element, so the elements they render are the items. A wrapper element inside a component makes that wrapper the single item.
7. Keep reading order as source order: do not reorder items with CSS `order` or a reversed direction (WCAG 1.3.2, 2.4.3).
8. Bind the inputs from values that are the same on the server and the client, never from a browser-only read such as the window's width; the hydration constraints require the same DOM on both sides.
9. Import `YetiScroller` in every component whose template writes the attribute. A **Forgotten import** renders a plain `div` with no class, no role, and no `tabindex`, with no error, unless an input is bound (`[width]`, NG8002) or a template reference names the `exportAs` (NG8003) (building-blocks 1.9). It also fails the Story gate's `scrollable-region-focusable` wherever the content overflows and holds nothing focusable.

### 5. Material comparison

| Aspect | ngx-yeti `scroller` | Nearest in Angular CDK and Material |
| --- | --- | --- |
| Shape | an item directive on the consumer's element | `CdkScrollable` (`[cdkScrollable]`, `NC/src/cdk/scrolling/scrollable.ts:40`), a directive that reports scroll events to `ScrollDispatcher`; `cdk-virtual-scroll-viewport` (`NC/src/cdk/scrolling/virtual-scroll-viewport.ts:70`), a component that renders only the visible items of a data source |
| Layout | Yeti's CSS: one flex row, optional equal widths and snapping | none in `CdkScrollable`; the viewport sizes items from a scroll strategy |
| Keyboard access | static `tabindex="0"` and `role="region"`, name from the consumer | neither adds a `tabindex` or a role (the viewport's host binds only its class and orientation classes, `virtual-scroll-viewport.ts:73-80`, read) |
| API | four typed inputs, `exportAs` | `CdkScrollable`: `elementScrolled()`, `scrollTo()`, `measureScrollOffset()`; the viewport: `orientation`, `itemSize`, `scrolledIndexChange` |

Nothing from either API applies. The scroller renders the consumer's own items with no data source and reports no scroll position; CDK's pieces serve overlays' repositioning and long lists. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1 (Part 2 row 14; building-blocks 1.2). The reason, row 14's: a focusable scroll container in which the arrow keys are the browser's (ticket 17 section 4.22, measured: Tab reached the example's region with a ring, and ArrowRight scrolled it from 0 to 401 px, in Chromium, Firefox, and WebKit). The directive adds the class, the typed attributes, the two static attributes the manifest requires, the item-file acquisition, and `exportAs`. It declares no listener, render callback, or service, so its run-time shape is the **types only** shape plus two static host attributes. No Aria pattern applies: the APG has no pattern for a scrolling region, and a `region` landmark has no keyboard table of its own. No CDK piece is used: there is no id, focus management, key handling, observer, or direction read; scrolling follows the CSS `direction` by itself. `scroll snap` and flexbox `gap` are inside Baseline 2025 ([Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md); building-blocks 1.2); `overscroll-behavior` is not (Further Notes, "Platform features to adopt when the browser target moves").

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The scroller is a named region with one Tab stop.
- **Roles and states:** `role="region"`, static. No state.
- **Names:** the consumer's `aria-label` or `aria-labelledby` (usage rule 2). Chromium's engine tree for Yeti's example: `region "Featured articles" focusable` (ticket 17 section 4.22, measured).
- **Focus:** the region is one Tab stop in DOM order, before any focusable content of its items. Focus moves into the items' own links and buttons by Tab, and the browser scrolls a focused item into view. The directive moves no focus.

| Key (focus on the scroller) | Action | Owner |
| --- | --- | --- |
| Tab, Shift+Tab | Focus the scroller, then the items' own focusable content, in DOM order | the platform (`tabindex="0"`) |
| ArrowLeft, ArrowRight | Scroll the track | the browser's scrolling of a focused scroll container (measured, ticket 17) |
| Other scrolling keys (Home, End, Page Up, Page Down, Space) | Whatever the browser does for a focused horizontal scroll container | the browser; not asserted |

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The region role and the consumer's name identify the strip; items keep their own semantics. Usage rule 1 keeps the role off elements whose own role the page depends on. |
| 1.3.2 Meaningful Sequence | One flex row in DOM order; no rule reorders a child. Usage rule 7 keeps the consumer from reordering. Layer 1 asserts that the accessibility tree order equals the DOM order. |
| 1.4.4 Resize Text | Item widths and gaps are `rem`-based tokens (`--yeti-width-sm: 24rem`, `Y/src/tokens/space.css:38`), so text zoom widens the items, and the track scrolls rather than clipping (read, not measured). |
| 1.4.10 Reflow | Content that needs a horizontal row (a wide table, a filmstrip of images) is the two-dimensional exception the criterion allows, and it scrolls inside the region, never the page. Yeti's own test asserts the page's `scrollWidth` equals the viewport at 390 px with a positioned child (`Y/test/browser/layouts/scroller.spec.js`, "a positioned child stays inside the track"). Layer 4 asserts no page-level horizontal overflow at 320 px. |
| 1.4.11 Non-text Contrast | The focus ring is the base rule's 2 px outline in `--yeti-color-focus` (`Y/src/base/typography.css:101-104`); ticket 17 measured ring contrast on one control only. Layer 1 asserts that the ring around the focused scroller reaches 3:1 against the background behind it, with the exact WCAG formula on computed colours ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 3; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 62). |
| 2.1.1 Keyboard | The static `tabindex="0"` makes the region reachable with no focusable content inside, and the arrow keys scroll it (measured, ticket 17). axe's `scrollable-region-focusable` rule (tags `wcag2a`, `wcag211`, `wcag213`; it passes on `focusable-element` or `focusable-content`, read in axe-core 4.11.0's `axe.js:32215-32223` in this repository's `node_modules`) runs in the Story gate on every story whose track overflows; layer 4 proves it applies (Testing Decisions). |
| 2.4.3 Focus Order | The region's stop and its items' stops follow DOM order, in left-to-right and right-to-left pages. |
| 2.4.7 Focus Visible | Yeti's `:focus-visible` outline draws on the focused region in all three engines (ticket 17 section 4.22, measured). |
| 4.1.2 Name, Role, Value | Role from the directive; name from the consumer (usage rule 2). |

**Ledger rows owned:** none ([ledger.md](../ledger.md); Part 2 row 14, "Not a ledger row: Yeti's docs require these attributes and the package only renders them"). The package renders what Yeti's manifest requires; it adds no feature Yeti lacks. Ticket 17 classed the scroller as matching its pattern's required keyboard behaviour (Answer), and axe found no violation on its example (building-blocks 1.10).

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<div yetiScroller snap width="sm" aria-label="Featured articles" i18n-aria-label>
  <article yetiBox yetiBorder surface="raised"><h2>One</h2></article>
  <article yetiBox yetiBorder surface="raised"><h2>Two</h2></article>
  <article yetiBox yetiBorder surface="raised"><h2>Three</h2></article>
  <article yetiBox yetiBorder surface="raised"><h2>Four</h2></article>
</div>
```

Server HTML and the hydrated DOM are the same. The `div` carries `yetiscroller=""`, `snap=""`, `width="sm"` (inert), `aria-label="Featured articles"`, `class="scroller"`, `role="region"`, `tabindex="0"`, `data-ngx-yeti-item-scroller=""`, `data-snap=""`, and `data-width="sm"`, and no `data-gap` or `data-justify`. The headings are this spec's addition to Yeti's example, because the Nu checker warns "Article lacks heading" on it (ticket 17). The server also writes the item links into `<head>` in Yeti's order: for the scroller, `rel="stylesheet"`, `href` `<url>layouts/scroller/scroller.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="scroller"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided, followed by the `box` link, which comes later in `yeti.css` (ADR 0060 points 2, 3, and 5; `Y/src/yeti.css:27`, `:29`). The client adopts the links at bootstrap. The scroller has no closed or open state; its scroll position is the browser's, not an attribute.

The delta from Yeti's docs markup: the consumer writes `yetiScroller` where the docs write `class="scroller"`, `role="region"`, and `tabindex="0"`, and `snap`, `width`, `gap`, and `justify` where they write the `data-*` names. The `aria-label` is written as in the docs.

### 9. Animation

None. The scroller has no state and no transition. Scroll snapping is the browser's settling of a scroll position, not an animation the package times, and Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). The scroller sets no `scroll-behavior`. An item the consumer inserts or removes with `@if` or `@for` may carry a class-form `animate.enter` or `animate.leave`; the item link stays until Angular removes the last host, because removal waits for the DOM (ADR 0060 point 4). A server-rendered scroller never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static class, role, `tabindex`, and presence attribute, the bound `data-*` attributes, and the item link in `<head>` (section 8). Everything at first paint is a host binding (ADR 0011 clause 1). Nothing is Angular-owned **Pre-hydration state**: no person and no Yeti module can change a `data-*` attribute (ticket 26 grilling Q12), and the scroll position and focus a person changes before hydration are the browser's, not attributes.
- **Before hydration:** the directive creates no node, reads no layout, starts no timer or observer, and touches no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is the item acquisition, which ADR 0060 runs on the server too. The region is focusable and scrolls by keyboard as soon as the server HTML is parsed.
- **Full hydration:** the host is claimed as it is; its static and bound attributes are written again with the same values (usage rule 8). Hydration claims the existing element rather than replacing it, so a scroll position or focus a person set before hydration stays (inferred from hydration's node claiming, ADR 0011 and building-blocks 1.11; layer 4 measures it). 0 style mutations (ADR 0060 point 5, measured for the mechanism).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the scroller and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism), and keyboard access needs no hydration. A `@defer` block inside a scroller adds no element, so its content is the scroller's direct children; its placeholder or loading element is an item while it shows (inferred from Yeti's `> *` selector).
- **`hydrate never`:** the scroller is its server HTML: styled, focusable, and scrollable by keyboard while the host is connected, whatever live scrollers do (ADR 0060 point 4; ADR 0045's presence attribute is what the check queries). Nothing is lost except changing a bound input, which needs Angular.
- **Client-only `@defer`:** the item file is fetched when `YetiScroller` is constructed, which can show frames with the items wrapping or shrinking; the role and `tabindex` are there from the first frame. The consumer closes the gap with `provideYetiStyles({ preload: ['scroller'] })` (ADR 0060 point 6; [setup](setup.md)).
- **Event replay:** the directive declares no listener, so nothing replays and the directive adds no `jsaction`. Keyboard scrolling is native and needs no replay.
- **`withI18nSupport()`:** the name is usually translated with `i18n-aria-label` and the items' text with `i18n` in the consumer's component, which needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11). The directive adds no `i18n` block and renders no string of its own (building-blocks 1.10).
- **Zoneless:** inputs are `input()` signals read by host bindings, so a changed input refreshes its attribute with no zone (ADR 0070 rule 4; map, Standing rulings, item 43).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the strip is laid out, named, focusable by Tab, and scrollable by the arrow keys, by touch, and by a pointer, because the class, the role, the `tabindex`, the attributes, and the item link are in the server HTML. Nothing is lost: the scroller has no behaviour of its own. A client-only application gets no such promise.
- **Hydration boundary:** the scroller and its items may sit in different boundaries. The scroller has no ids, no references, and no parts, and a deferred item hydrates on its own.

### 11. Hydration constraints

The scroller complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class, role, `tabindex`, and presence attribute are static; `data-gap`, `data-width`, `data-snap`, and `data-justify` come from inputs whose values usage rule 8 keeps equal on both sides.
- **No direct DOM manipulation:** the directive writes nothing to the DOM outside host bindings. The item link belongs to the ADR 0060 service, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directive changes no element. The consumer's markup must already be valid as written; usage rule 1's hosts can hold any flow content, including a `table`.
- **`preserveWhitespaces`:** the directive has no template. White-space-only text between items is not rendered as a flex item.
- **No output branched on the platform:** none.
- **Static attributes the directive binds:** usage rule 3 keeps the consumer from writing them. The one static form the records invite is `width="sm"`, an input whose name is an HTML attribute that is `inert` on the allowed hosts, so it needs no binding and hydration writes back the value the server rendered.

### 12. Single-page application

None. The scroller has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). A link inside an item is the consumer's link. On a route change, a route's scrollers leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-scroller]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders a scroller again re-inserts it, at scroll position 0.

### 13. Item file

`yeti-css/css/layouts/scroller/scroller.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiScroller]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:27`, after `frame` and before `overlay`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-scroller` has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the `[data-gap]` and `[data-width]` value rules, the reset's media cap that the scroller lifts, and the base focus ring), and optionally `provideYetiStyles({ preload: ['scroller'] })`. The scroller adds nothing to it. Cross-item files acquired: none. `scroller.css` has no rule that names another item's class, and the items' own directives load their own files (ADR 0060 point 9).

One order inside `yeti.layouts` touches the scroller's items (read, not measured): `.scroller > *` sets `margin: 0` at the same specificity as the item rules of later files, so an item that is a `center` keeps its `margin-inline: auto` because `center.css` comes after `scroller.css` (`Y/src/yeti.css:27`, `:30`). ADR 0060 point 3 keeps that order whichever directive is created first.

## Testing Decisions

A good test asserts what a reader, a keyboard user, or a consumer observes: the class, role, `tabindex`, and attributes in the DOM, the item link, where the items land, that Tab reaches the region, and that the arrow keys scroll it. It never asserts a private field or how the styles service counts. No test depends on a public token's default value or on a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): where a test needs a width or a gap, it compares with a probe element in the same story styled `inline-size: var(--yeti-width-<value>)` or reads the token's computed value, as Yeti's own `Y/test/browser/layouts/scroller.spec.js` does with its `token()` helper. Every story that tests keyboard access sizes the scroller's container so the track overflows, because axe's `scrollable-region-focusable` applies only to an element that actually scrolls (its `scrollable-region-focusable-matches` filter, read in `axe.js:32218`). Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `scroller` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**), which includes `scrollable-region-focusable`. Story ids:

- `scroller--default`: section 8's markup in a container narrower than the four items. Asserts `class="scroller"`, `role="region"`, `tabindex="0"`, `data-ngx-yeti-item-scroller`, `data-snap`, `data-width="sm"`, and no `data-gap` or `data-justify`; the accessible role is `region` with the name "Featured articles"; `scrollWidth` is greater than `clientWidth`; the items share one `offsetTop`, each item's width equals the probe's `var(--yeti-width-sm)` within 1 px, and the space between two items equals the computed `--yeti-space-md`; every item's computed margins are 0; the accessibility tree order equals the DOM order.
- `scroller--keyboard`: a strip of six text cards with no focusable content, beside a button before it. Tab from the button focuses the scroller; the scroller matches `:focus-visible`, its computed `outline-style` is not `none`, and the ring colour against the background behind it reaches 3:1 with the exact WCAG formula on computed colours (ADR 0015 point 3; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 62); ArrowRight increases `scrollLeft`, ArrowLeft decreases it; Tab again leaves the scroller.
- `scroller--settings`: `gap`, `width`, `snap`, and `justify` bound from Storybook controls. Asserts each `data-*` attribute follows its control and clearing a control removes it; `snap` off gives `scroll-snap-type: none`, on gives a value starting `x`; with `snap` on, items' `scroll-snap-align` is `start` for unset `justify` and `center` and `end` for those values; with `snap` off, `scroll-snap-align` is `none` whatever `justify` is (Yeti's "data-justify says where a snapping item settles" case).
- `scroller--wide-table`: Yeti's table docs example, a `table yetiTable` with a caption as the scroller's one child, `aria-labelledby` pointing at the caption's id, and a header cell holding a `yetiVisuallyHidden` span. Asserts the scroller overflows, the page does not, and after scrolling to the end the hidden span's box is inside the scroller's box (Yeti's "a positioned child stays inside the track" case).
- `scroller--media`: a `section` host with `aria-labelledby` naming a heading before it, holding an `NgOptimizedImage` 900 px wide and a long paragraph. Asserts the image keeps its 900 px width and overflows the track, and the paragraph's width is at most the computed `--yeti-measure` plus 1 px (Yeti's media-cap and prose-measure cases).
- `scroller--rtl`: `scroller--default` inside `dir="rtl"`. Asserts the first DOM child is the rightmost item at scroll position 0, and that ArrowLeft moves the track toward the last item (`scrollLeft` becomes negative, per the CSSOM's right-to-left scroll origin, inferred).

### Layer 2: browser-level (`npx nx test <lib>`, `scroller.spec.ts`)

Through `TestBed.createDirective(YetiScroller, { tagName: 'div', bindings })` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- with no bindings the host has class `scroller`, `role="region"`, `tabindex="0"`, and `data-ngx-yeti-item-scroller`, and no `data-gap`, `data-width`, `data-snap`, or `data-justify`;
- each input binding renders its attribute (`snap` bound `true` renders `data-snap=""`), a changed binding updates it after `whenStable()`, and binding `undefined` or `false` removes it;
- while the fixture lives, one `<link data-ngx-yeti-styles="scroller">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed;
- the directive adds no listener to its host.

A small test host covers what `createDirective` cannot: the template reference `#s="yetiScroller"` resolves; a static `snap` attribute sets the input through `booleanAttribute`; a static `width="sm"` renders both `width="sm"` and `data-width="sm"` (the `inert` kind); the consumer's own `class`, `aria-label`, and `aria-labelledby` are kept; `yetiScroller yetiBox gap="lg"` renders one `data-gap="lg"` and both presence attributes; and a consumer's static `tabindex="-1"` on the host replaces the directive's `0`, which documents why usage rule 3 exists (Angular's merge order, section 4).

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `scroller.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture of section 8 whose `aria-label` carries `i18n-aria-label` and whose headings carry `i18n` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the host renders `class="scroller"`, `role="region"`, `tabindex="0"`, the `aria-label`, `data-ngx-yeti-item-scroller`, `data-snap=""`, `data-width="sm"`, and `width="sm"`; `<head>` holds one item link with `data-ngx-yeti-styles="scroller"`, `data-beasties-skip`, and an `href` ending `layouts/scroller/scroller.css?v=<pin>`; no element carries a `jsaction` from the package.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `scroller` has `YetiScroller`; `data-gap` and `data-width` have inputs whose unions equal the manifest's vocabularies `gap` and `width`; `data-snap` has a boolean input; `data-justify`'s input union equals the manifest's own `values` (`start`, `center`, `end`); the item has no events. A pin move that adds an attribute or a value fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids, at a 1280 x 800 viewport and a 320 x 640 viewport, after Yeti's own `scroller.spec.js`:

- `scroller--keyboard`: real Tab and arrow key presses in Chromium, Firefox, and WebKit focus the scroller and change `scrollLeft`;
- `scroller--settings` with `snap` and `justify="center"`: after setting `scrollLeft` to the third item's `offsetLeft` and waiting 400 ms, the third item's midpoint equals the track's within 1 px (Yeti's centering case);
- at 320 px every story's page has no horizontal overflow (1.4.10), while each scroller's `scrollWidth` exceeds its `clientWidth`;
- the rule control for 2.1.1: on `scroller--keyboard`, `@axe-core/playwright` run with only `scrollable-region-focusable` reports no violation; after the test removes the host's `tabindex` with `page.evaluate`, the same run reports one violation on the scroller. This proves the rule applied to the story and that the static `tabindex` is what passes it.

Fixture-app half, built with `outputMode: 'server'`, with a `/scroller` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route renders section 8's markup and the wide-table story's markup:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- with JavaScript disabled, Tab focuses the scroller and ArrowRight scrolls it, the items share one row, and `@axe-core/playwright` with the six tags reports no violation;
- with `main.js` held back, a person's Tab to the scroller and ArrowRight scroll before hydration are still in place after `main.js` is released and hydration completes: the scroller is still `document.activeElement` and `scrollLeft` is unchanged (section 10, inferred until this case runs);
- a scroller inside a client-only `@defer` block with `scroller` in the preload list shows no frame with wrapped items; a scroller inside a `hydrate never` block stays one row and focusable after every live scroller on the page is removed;
- navigating from the scroller route to a route without one removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` for the default story, its `test/browser/layouts/scroller.spec.js` with the fixture `test/browser/fixtures/layouts/scroller.html` for the geometry, focus, media, measure, and positioned-child cases, and Yeti's table docs for the wide-table story; ticket 17's keyboard script for the arrow-key measurement; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; the [cover](cover.md) and [columns](columns.md) specs' probe technique for token-independent assertions.

## Out of Scope

- A name input (`label`, `ariaLabel`) or a generated name. The name is the consumer's markup (building-blocks 1.10, Names).
- An opt-out of the focus stop, or a `tabindex` that depends on whether the track overflows. That would need a `ResizeObserver` and a client-only attribute that differs from the server's, and Yeti requires the stop on every scroller (usage rule 3).
- Scroll buttons, a scroll position model, a "current item" output, or arrow-key handling of the package's own. The carousel is the item with controls and a current slide ([ADR 0024](../adr/0024-carousel-slides-are-not-inert-before-live.md); Part 2 row 29).
- Virtual scrolling of a data source (CDK's `cdk-virtual-scroll-viewport`).
- An input per token (ADR 0004).
- A check that the scroller is named, sits on an allowed host, or has a child. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- Package CSS for the scroller. The item owns no ledger row (ADR 0060 point 8).
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| One item directive `[yetiScroller]` with `gap`, `width`, `snap`, and `justify`; no part directive | building-blocks Part 2 row 14; ticket 26 rows 52 to 55; ticket 11 row 14 |
| Static host `role="region"` and `tabindex="0"`, the manifest's required attributes | Part 2 row 14; ticket 11 row 14 |
| The name is the consumer's `aria-label` or `aria-labelledby`, a usage rule; no name input | building-blocks 1.10, Names; Part 2 row 14 |
| Not a ledger row | Part 2 row 14 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by `YetiGap`, `YetiWidth`, `boolean`, and `Extract<YetiJustify, 'start' \| 'center' \| 'end'>`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2 |
| The `justify` type is named `YetiScrollerJustify` | ADR 0080 point 5 with ADR 0070 rule 2; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 60 |
| `width` is an `inert` presentational-attribute input on `div` and `section` | building-blocks 1.4; ticket 26 row 53 and grilling Q15 |
| `yetiScroller` and `yetiBox` on one element share one `gap` | ticket 26 grilling Q16; building-blocks 1.4 |
| Hosts limited to `div` and `section`; no other layout on the same element | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 59 and 61 |
| Class names with no collision | ADR 0080 points 3 and 4 |
| Entry point `ngx-yeti/scroller` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1; no listener, render callback, or service | building-blocks 1.2; Part 2 row 14 |
| Tokens are the consumer's | ADR 0004 |
| Item file as a counted link in Yeti's order; presence attribute `data-ngx-yeti-item-scroller` | ADR 0060 points 2 to 6; ADR 0045 |
| Focus-ring contrast asserted in a play function at 3:1 | ADR 0015 point 3; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 62 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A strip of related cards with snapping, named by the heading before it. The heading stays outside the scroller, because every direct child of the scroller is an item of the row:

```html
<h2 id="trail-heading" i18n>Nearby trails</h2>
<div yetiScroller snap width="sm" gap="lg" aria-labelledby="trail-heading">
  @for (trail of trails(); track trail.id) {
    <article yetiCard>
      <h3>{{ trail.name }}</h3>
      <p>{{ trail.summary }}</p>
    </article>
  }
</div>
```

```ts
import { YetiScroller } from 'ngx-yeti/scroller';
import { YetiCard } from 'ngx-yeti/card';

@Component({
  selector: 'app-nearby-trails',
  imports: [YetiScroller, YetiCard],
  templateUrl: './nearby-trails.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NearbyTrails {
  readonly trails = input.required<readonly Trail[]>();
}
```

A wide table, after Yeti's table docs (`Y/src/components/table/docs.md:19`):

```html
<div yetiScroller aria-label="Quarterly results" i18n-aria-label>
  <table yetiTable>
    <caption i18n>Quarterly results</caption>
    <!-- thead and an explicit tbody -->
  </table>
</div>
```

A filmstrip that centres each frame as it snaps, with the settling point chosen from state:

```ts
import type { YetiScrollerJustify } from 'ngx-yeti';

readonly settle = signal<YetiScrollerJustify>('center');
```

```html
<div yetiScroller snap [justify]="settle()" aria-label="Photos from the ridge" i18n-aria-label>
  @for (photo of photos(); track photo.src) {
    <img [ngSrc]="photo.src" width="640" height="480" [alt]="photo.alt" />
  }
</div>
```

The filmstrip's imports are `YetiScroller` and `NgOptimizedImage` (building-blocks 1.2, images rule); the wide table's are `YetiScroller` and `YetiTable`.

A page whose scroller renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['scroller'] })`. A value newer than the pin: `<div yetiScroller [width]="$any('3xl')" aria-label="...">`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `layouts/scroller/scroller.css`, loaded by `YetiScroller` as a counted link (section 13). The consumer writes nothing for the scroller beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps `data-gap` and `data-width` to the private gap and width (`:6-37`, `:171-177`); `base/reset.css` caps media at 100 % (`:22-26`), which the scroller lifts for its media children; `base/prose.css` gives text children the measure (`:22-24`); `base/typography.css` draws the focus ring (`:101-104`); `tokens/space.css` declares the space and width scales.
3. **Cross-item rules:** none in `scroller.css`. Items composed inside (`card`, `box`, `frame`, `table`) and `box` on the scroller's own element load their own files through their own directives. The `center` item tie is settled by ADR 0060 point 3's order (section 13).
4. **Tokens:** reads `--yeti-space-md` by default and the named `--yeti-space-*` and `--yeti-width-*` through the value rules; writes none (section 2).
5. **What breaks without the item file:** the element is an ordinary block, the items stack or wrap and media shrink to the container, nothing scrolls, and the attributes set private tokens nothing reads. The role and `tabindex` stay, so the region is still a named Tab stop, with nothing to scroll.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) found that only `container`, `grid`, and `table` (plus the attribute name `hidden`) of Yeti's 49 class names produced a utility (building-blocks 1.13).

### Platform features to adopt when the browser target moves

None for package code. Yeti's `overscroll-behavior-x: contain`, which keeps a swipe in the track from triggering the browser's back navigation (user story 42), is outside both browser sets in web-features data because Safari lacks it, and Yeti uses it unguarded as a cosmetic feature ([Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md), section 5.3 of its research file, `scroller.css:8`). Where Safari lacks it, a swipe at the track's end can scroll or navigate the page; the package adds no guard or fallback, because the effect is Yeti's CSS and needs no package code when the target moves. Flexbox `gap` and scroll snap are inside Baseline 2025.

### Single-page-application pieces relied on

None: the scroller uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
