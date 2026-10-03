# Spec: hero (recipe)

Ticket: [68. Spec: hero (recipe)](../issues/68-spec-hero.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 18 and Part 1, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 70 to 77 and grilling Q3, Q6, Q12, Q13, Q15, and Q16, [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md), and [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decisions 2, 6, 8, 9, 10, 18, 21, 34, 35, 36, and 42. The item owns no [ledger.md](../ledger.md) row. `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NGP/` is `github.com/angular/angular/packages/` at 22.2.x. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 74, 75, and 76), and each is cited where it applies.

A **Recipe** is "one class for a common composition of layouts, which Yeti also shows built from the layouts themselves" ([CONTEXT.md](../CONTEXT.md)). Yeti's layouts guide says the most common compositions "ship as recipes, one class each, and every recipe page shows the same result built from primitives so nothing is hidden" (`Y/src/guides/layouts.md:177`). The hero is "the one-class form of a cover holding columns" (manifest `description`). This spec therefore specifies the hero's own directives and links to the layouts it stands for rather than restating them: [cover](cover.md) (the viewport-tall band), [columns](columns.md) (the row that becomes rows below a width), [frame](frame.md) (the cropped picture), and the `stack` layout ([Spec: stack](../issues/66-spec-stack.md)) for the copy.

## Problem Statement

Yeti's `hero` is "the opening of a landing page: a headline and a call to action on one side, a picture on the other, filling the first screen, or a shorter band with `data-height`, as a cover takes it" (`Y/src/recipes/hero/docs.md`). It is one **Identity class**, `hero`, on a wrapping flex row whose least block size is the viewport's by default, whose lines are centred in that height, and whose two children (the copy and the figure) share the row until the hero's own width falls below a **Threshold**, where they become rows. Six **Attributes** configure it (`data-threshold`, `data-gap`, `data-ratio`, `data-align`, `data-side`, `data-height`), and two **Markers** go on its children (`data-span`, a child's share of the row, and `data-min`, the narrowest a child may get while the two share it) (`Y/src/recipes/hero/manifest.json`, `hero.css`). It has no **Module** and no events.

An application developer using the package cannot write `class="hero"` or any of those `data-*` attributes and markers: the package's contract rule is that a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). In plain Yeti a misspelt `data-ratio="4:3"` or `data-side="left"` is silent; here it must fail to compile ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `hero` **Item file** loaded while a hero is on the page and removed when none is, as the map's lazy-styles requirement asks ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it the element is an ordinary block: the picture keeps its own shape, nothing is centred, the band has no least height, and nothing errors.

Three things make the hero more than a one-class layout. First, `align` and `height` are also HTML attribute names, and a static `align="center"` left on a `header` or a `div` centres its text in Chromium and WebKit ([ticket 26](../issues/26-decide-yeti-data-attributes-mapping.md) row 73). Second, `data-side` moves the figure to the other side of the row visually only, so the order a screen-reader user and a keyboard user meet the halves in stays the source order, and Yeti's accessibility note asks the author to write the copy first and keep the page's `h1` in it (manifest `a11y.notes`). Third, the hero crops its figure to a ratio with `object-fit: cover`, while every static image in the package's examples uses `NgOptimizedImage` (building-blocks 1.2), whose development-mode check warns about a rendered ratio that differs from the image's own (`NGP/common/src/directives/ng_optimized_image/ng_optimized_image.ts:1103-1123`, read).

## Solution

Two directives in the secondary entry point `ngx-yeti/hero` ([building-blocks.md](../building-blocks.md) Part 2 row 18: "`[yetiHero]` (`threshold`, `gap`, `ratio`, `align`, `side`, `height`); `[yetiHeroChild]` (`min`, `span`)", native platform, level 1, types only):

- **`YetiHero`**, the **Item directive**, on `[yetiHero]`. It binds `hero` as a static host class and the six attributes from typed inputs: `threshold` (`YetiWidth`), `gap` (`YetiGap`), `ratio` (`YetiRatio`), `align` (`YetiAlign`), `side` (`YetiSide`), and `height` (`YetiHeight`) (ticket 26 rows 70 to 75, kind R). Because `align` is a presentational hint on any element in Chromium and WebKit, it also binds `'[attr.align]': 'null'` (the `removed` kind, building-blocks 1.4). It sets the static presence attribute `data-ngx-yeti-item-hero` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), acquires the `hero` item file when it is created, on the server too, and releases it when it is destroyed (ADR 0060 point 2). It provides `yetiHeroToken`.
- **`YetiHeroChild`**, a **Part directive** for a child that takes a share of the row or a least width, on `[yetiHeroChild]`. It binds `data-span` from a `span` input typed `YetiSpan` and `data-min` from a `min` input typed `YetiWidthOrNone` (ticket 26 rows 76 and 77, kind C). It neither marks its host with a presence attribute nor acquires the item file ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 6).

The developer writes `<header yetiHero yetiBox threshold="sm" gap="lg" surface="sunken">` where Yeti's example writes `<header class="hero box" data-threshold="sm" data-gap="lg" data-surface="sunken">`, and `<div yetiHeroChild span="2" min="sm">` where Yeti's docs write `<div data-span="2" data-min="sm">`. A child that needs neither marker takes no directive. Unset inputs render nothing, so Yeti's defaults (`lg`, `lg`, `4/3`, `center`, source order, `full`) apply from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1).

Everything else is Yeti's CSS and the platform. The directives are **types only**: no listener, no render callback, and no DI beyond the part's optional parent token and the item file's acquisition (building-blocks Part 2, "Types only", with ticket 50 decision 18's note). Which child is the figure, how it is cropped, which side it takes, and when the row becomes rows are all decided in CSS by `:has()`, `aspect-ratio`, `object-fit`, and flex-basis arithmetic against the hero's own width, so the server HTML is Yeti's documented markup and the hero renders the same on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block.

## User Stories

1. As an application developer, I want to make an element a hero with one directive attribute, so that I never write Yeti's `hero` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="hero"`, so that Yeti's CSS, docs, and examples apply unchanged.
3. As an application developer, I want a hero with no settings to fill the viewport's height with my copy and picture side by side and centred, so that a landing page's first screen is one attribute.
4. As an application developer, I want the picture cropped to a 4 by 3 frame by default and to another ratio from a typed `ratio` input, so that any photo presents in the shape I chose.
5. As an application developer, I want a typed `threshold` input from Yeti's width scale, so that I choose the hero width below which copy and picture become rows, and a misspelt width fails to compile.
6. As an application developer, I want the switch to rows decided by the hero's own width, not the window's, so that a hero in a narrow column stacks even on a wide screen.
7. As an application developer, I want a typed `gap` input from Yeti's `gap` vocabulary, so that the space between copy and picture is one word.
8. As an application developer, I want a typed `align` input, so that copy and picture of different heights align at the start, centre, end, or stretch while side by side.
9. As an application developer, I want to write `align="center"` statically, so that the input reads like every other static input.
10. As an application developer, I want the HTML `align` attribute that a static `align="center"` would leave on the host removed, so that the browser's old presentational hint does not centre my headline's text.
11. As an application developer, I want a typed `side` input, so that the picture sits at the start or the end of the row whatever the source order.
12. As an application developer, I want `side` to move the picture only while the two share a row, so that a phone still meets my headline first.
13. As an application developer, I want a typed `height` input with Yeti's six values (`sm`, `md`, `lg`, `xl`, `half`, `full`), so that a band shorter than the viewport is one word.
14. As an application developer, I want the band's height to be a minimum, so that taller content grows it and nothing is cut off.
15. As an application developer, I want `span` on a child, so that the picture can take three fifths of the row beside copy that takes two.
16. As an application developer, I want `min` on the copy, so that its buttons keep their row at a middling width and the picture gives way instead.
17. As an application developer, I want `span` and `min` to do nothing once the hero has stacked, so that both halves are full width on a phone.
18. As an application developer, I want a picture with a caption to keep the caption below the cropped picture, so that a credit line is not cropped away.
19. As an application developer, I want the copy laid out as a column with Yeti's small gap, so that a headline, a sentence, and a button need no extra layout.
20. As an application developer, I want an unset input to render no attribute, so that Yeti's own default applies and my server HTML stays Yeti's minimal markup.
21. As an application developer, I want to bind every input from signals, so that the hero follows my state under zoneless change detection.
22. As an application developer, I want `yetiHero` and `yetiBox` on one element with one `gap` attribute, so that Yeti's own `class="hero box" data-gap="lg"` example is expressible.
23. As an application developer, I want `yetiHero` beside `yetiEnter` on one element to share one `side` input of one type, so that the one `data-side` Yeti declares for both compiles.
24. As an application developer, I want a component's host element to be a hero child, so that `<app-hero-copy yetiHeroChild min="sm">` works.
25. As an application developer, I want the same result as Yeti's "Built from primitives" form, so that I can move between the one-class form and a composition of `cover`, `columns`, `stack`, and `frame` without a visual change.
26. As an application developer, I want a headline that grows with the copy's column, so that I can write the [billboard](billboard.md) utility inside a [container](container.md) copy as Yeti's docs show.
27. As an application developer, I want to know how to write the picture with `NgOptimizedImage`, so that I get an optimized image without a development-mode warning I cannot act on.
28. As an application developer, I want the default least height to follow `--yeti-cover-height`, so that one token governs the hero, the cover, a filled stack, and the shell.
29. As an application developer, I want the package to offer no input per token, so that the hero's API stays the size of Yeti's contract.
30. As an application developer, I want a value newer than the pin to be bindable through `$any`, so that I am not blocked until the package's pin moves.
31. As an application developer, I want the hero's item file loaded when the first hero renders and removed after the last one leaves, so that I do not import `hero.css` globally.
32. As an application developer, I want the item file in the server HTML when a server-rendered page has a hero, so that the first paint already has the band and the cropped picture.
33. As an application developer, I want the hero laid out with JavaScript off under SSR and prerendering, so that the opening screen reads correctly before any script runs.
34. As an application developer, I want hydration to change nothing on a hero or its children, so that I get no `NG05xx` error and no jump on the most visible part of my page.
35. As an application developer, I want a hero inside a `@defer (hydrate on ...)` block to stay laid out before and after the block hydrates, so that incremental hydration does not collapse it.
36. As an application developer, I want a hero inside a `hydrate never` block to keep its styles for as long as it is on the page, so that a dehydrated opening screen is not collapsed when a live hero elsewhere leaves.
37. As an application developer, I want to know that a hero inside a client-only `@defer` block needs `hero` in the preload list for a flash-free first paint, so that I can avoid an unstyled frame.
38. As an application developer using `withI18nSupport()`, I want a translated headline to hydrate without being re-rendered, so that localised landing pages keep the server's DOM.
39. As an application developer, I want template references (`#h="yetiHero"`, `#c="yetiHeroChild"`), so that the hero follows the package's `exportAs` rule.
40. As an application developer, I want to import both directives from `ngx-yeti/hero`, so that a `@defer` block can split them with the rest of the item.
41. As an application developer, I want the usage rules stated (exactly two children, copy first, the `h1` in the copy, no media element directly in the copy, no static Yeti attributes), so that I use the hero as Yeti intends.
42. As a screen-reader user, I want the hero to add no role, name, or announcement, so that the page's own landmarks and headings are what I hear.
43. As a screen-reader user, I want the page's main heading in the copy and the copy before the picture in the DOM, so that I meet the headline first, as a phone reader does.
44. As a keyboard user, I want focus to follow the DOM order whichever side the picture is drawn on, so that `side` does not change where Tab goes.
45. As a low-vision user, I want the band to grow past the viewport when I zoom text to 200 %, so that the copy is never clipped.
46. As a low-vision user, I want the hero to become rows and reflow at 320 CSS pixels with no horizontal scrolling, so that the opening screen works on a narrow screen.
47. As a low-vision user who overrides text spacing, I want the copy to keep its content visible, so that my spacing settings do not clip it.
48. As a reader, I want a picture's caption to have enough contrast, so that a credit line in Yeti's muted colour stays readable.
49. As a mobile user, I want the default height to follow the visible viewport as the browser's toolbars collapse, so that the band stays one screen on a phone.
50. As a package maintainer, I want the contract check to cover the hero's class, its six attributes with their vocabularies, both markers on the part directive, and its empty event list, so that a pin move that adds or changes one fails before release.
51. As a package maintainer, I want the SSR smoke to assert the server HTML of a hero, a marked child, the removed `align`, and the item link, so that the first paint is proven.
52. As a package maintainer, I want the fixture app to render a hero in a prerendered route and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
53. As a package maintainer, I want an e2e case proving that no frame paints with the HTML `align` attribute present, so that the static form's hydration pass is measured, not assumed.
54. As a package maintainer, I want the geometry tests to follow Yeti's own `hero.spec.js` cases, including the comparison with the composed form, so that the package proves the same layout Yeti proves.
55. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default does not fail a test for no reason.
56. As a package maintainer, I want the class names `YetiHero` and `YetiHeroChild` checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/recipes/hero/manifest.json`, `hero.css`, `docs.md`, and `example.html`, and in `Y/src/layouts/attributes.css`, `Y/src/tokens/space.css`, and `Y/schema/vocabulary.json`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `hero`, `recipe`, `Page Layouts` |
| `class` | `hero` |
| `attributes` | `data-threshold`: vocabulary `width` (`2xs` to `2xl`), default `lg`, "The container width below which copy and figure become rows". `data-gap`: vocabulary `gap` (29 values), default `lg`. `data-ratio`: vocabulary `ratio` (`1/1`, `4/3`, `3/2`, `16/9`, `21/9`), default `4/3`, "The figure's aspect ratio". `data-align`: vocabulary `align` (`start`, `center`, `end`, `stretch`, `baseline`), default `center`, "Vertical alignment of copy and figure when side by side". `data-side`: vocabulary `side` (`start`, `end`), no default: "Moves it visually only; reading order stays as written". `data-height`: vocabulary `height` (`sm`, `md`, `lg`, `xl`, `half`, `full`), default `full`, "Content taller than the band grows it" |
| `classes` | empty |
| `children` | `> *` (min 2, max 2): "Exactly two: the copy and the figure (an img, video, or picture, or an element wrapping one); the copy ... must not have an img, video, or picture as a direct child (it would be taken for a second figure). A figure with a figcaption keeps its caption below the picture." `> [data-span]` (min 0, max 2) |
| `markers` | `data-min`: vocabulary `width-or-none`, `on: "> *"`, "The narrowest this child may get while the two share a row; the other gives way. Stacked, it has no effect." `data-span`: vocabulary `span` (`1` to `12`), `on: "> *"`, "How many shares of the row this child takes; the other child's default is 1." |
| `tokens` | public: `--yeti-cover-height`, `--yeti-width-lg`, `--yeti-space-lg`, `--yeti-space-sm`, `--yeti-text-sm`, `--yeti-color-text-muted`; private: `--_yeti-gap`, `--_yeti-threshold`, `--_yeti-align`, `--_yeti-aspect`, `--_yeti-height` |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "When the hero is the page's opening, keep the h1 inside the copy and write the copy first: data-side changes where the figure sits in the row, not where it is read, and not the stacked order." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: `flexbox gap`, `aspect-ratio`, `object-fit`, `:has()`, `dvh units`; `guarded`: empty |
| `since` | `7.0.0` |

How it works, in `@layer yeti.layouts` (read in `hero.css`): `.hero` is a wrapping flex row with `align-content: center`, `align-items` from the private align token, `min-block-size` from the private height token, and `gap` from the private gap token. Each `.hero:not([data-*])` rule supplies a default only when its attribute is absent. Every child gets `margin: 0`, `flex-grow: 1`, and `flex-basis: calc((threshold - 100%) * 999)`, the same arithmetic `columns` uses, so the row becomes rows when the hero's own content box is narrower than the threshold ([columns](columns.md); `Y/src/guides/responsive.md:29`: "`hero` switches the same way"). `> [data-span]` sets `flex-grow` from the private span token, and `> [data-min]` sets `min-inline-size: min(<width>, 100%)`. The figure is the child that is an `img`, `video`, or `picture`, or has one as a direct child (`:has()`); it takes `aspect-ratio` from the private aspect token with `overflow: hidden`, and its media `object-fit: cover`. A `figure` with a `figcaption` becomes a flex column whose media alone takes the ratio, with the caption at `--yeti-text-sm` in `--yeti-color-text-muted`. Every other child is the copy: a flex column with `--yeti-space-sm` between its children, whose own margins are zeroed. `data-side` reverses the row (`row-reverse` with `justify-content: flex-end`) only when the figure is not already on the asked side; a reversed wrapped row reverses items within a line and leaves the lines in source order, so once stacked the source order is the visual order (the comment in `hero.css`).

The value rules for `data-gap`, `data-align`, `data-threshold`, `data-height`, `data-min`, `data-ratio`, and `data-span` are in the **Always-loaded group**'s `layouts/attributes.css` (`:6-37`, `:147-152`, `:163-169`, `:179-190`, `:192-199`, `:221-226`, `:261-274`). `data-height="full"` reads `--yeti-cover-height`, which defaults to `100dvh` (`Y/src/tokens/space.css:54`, quoted at the pin as ADR 0006 allows). `data-side` has no value rule; `hero.css` reads it directly.

Yeti's committed `src/guides/layouts.md` attribute table is stale for three of the hero's names at the pin: it has no `data-height` row, its `data-min` row lists only `grid` and `masonry`, and its `data-span` row lists only `columns (> *)` with values `1` to `6`. The table the docs build generates from the manifests lists `hero` in all three, with `span`'s twelve values (`Y/docs/guides/layouts.md:104`, `:111`, `:122`, read at the pin). The package types every input from the manifest's vocabulary ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)); the `data-height` part is [upstream-bugs.md](../upstream-bugs.md) row Y9 (ticket 50 decision 34), and Y9 also records the `data-min` and `data-span` rows ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 74).

Attributes left to the consumer: none (ticket 26 rows 70 to 77; grilling Q2 and Q13). The elements, the image's `alt`, and any ARIA are the consumer's: Yeti's example uses a `header` holding a `div` of copy and an `img`.

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `hero` | static host class on `[yetiHero]` (`YetiHero`) | always present | ADR 0003 point 1; Part 2 row 18 |
| Attribute `data-threshold` | the width below which copy and figure become rows | input `threshold` on `yetiHero`: `YetiWidth \| undefined`, bound `[attr.data-threshold]`, `null` when unset | unset renders nothing; Yeti's `lg` applies. `threshold` is not an HTML attribute | ticket 26 row 70 (R) |
| Attribute `data-gap` | space between copy and figure | input `gap`: `YetiGap \| undefined`, bound `[attr.data-gap]` | unset renders nothing; Yeti's `lg` applies | ticket 26 row 71 (R) |
| Attribute `data-ratio` | the figure's aspect ratio | input `ratio`: `YetiRatio \| undefined`, bound `[attr.data-ratio]` | unset renders nothing; Yeti's `4/3` applies | ticket 26 row 72 (R) |
| Attribute `data-align` | vertical alignment side by side | input `align`: `YetiAlign \| undefined`, bound `[attr.data-align]`; plus `'[attr.align]': 'null'` | unset renders nothing; Yeti's `center` applies. Static form: `removed` (below) | ticket 26 row 73 (R); building-blocks 1.4; ticket 50 decision 9 |
| Attribute `data-side` | which side the figure takes in a row | input `side`: `YetiSide \| undefined`, bound `[attr.data-side]` | unset renders nothing; the source order holds. `side` is not an HTML attribute | ticket 26 row 74 (R) |
| Attribute `data-height` | the band's least height | input `height`: `YetiHeight \| undefined`, bound `[attr.data-height]` | unset renders nothing; Yeti's `full` applies. Static form: `inert` (below) | ticket 26 row 75 (R); building-blocks 1.4 |
| Marker `data-min` | the narrowest a child gets side by side | input `min` on `yetiHeroChild`: `YetiWidthOrNone \| undefined`, bound `[attr.data-min]` | unset renders nothing. Static form: `inert` (below) | ticket 26 row 76 (C) |
| Marker `data-span` | a child's share of the row | input `span` on `yetiHeroChild`: `YetiSpan \| undefined`, bound `[attr.data-span]` | unset renders nothing (one share). Static form: `inert` (below) | ticket 26 row 77 (C) |
| Children `> *` | the copy and the figure | a child with no marker needs no directive | not applicable | ticket 26 grilling Q6 |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Token `--yeti-cover-height` | default and `full` least height | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--yeti-width-lg`, `--yeti-space-lg` | default threshold and gap | the consumer's | not applicable | ADR 0004 |
| Tokens `--yeti-space-sm`, `--yeti-text-sm`, `--yeti-color-text-muted` | the copy's gap; the caption's size and colour | the consumer's | not applicable | ADR 0004 |
| Tokens `--_yeti-gap`, `--_yeti-threshold`, `--_yeti-align`, `--_yeti-aspect`, `--_yeti-height` (and the unlisted `--_yeti-span`, `--_yeti-min` that `hero.css` reads) | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-hero=""` on `[yetiHero]` only | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2; ticket 50 decision 6 |

The presentational-attribute kinds (building-blocks 1.4), confirmed for this item's hosts. The hero's hosts are elements that hold flow content (`header`, `section`, `div`, `article`, `main`); its children are a `div`, `section`, or a component host for the copy, and an `img`, `video`, `picture`, `figure`, or `div` for the figure (manifest `children`).

- `align` on `yetiHero`: `removed`. HTML's `align` is a presentational hint on any element in Chromium and WebKit, which maps it to `text-align` (ticket 26 row 73 and grilling Q15), so a static `align="center"` would centre the copy's text. The directive binds `'[attr.align]': 'null'` unconditionally, with a source comment naming the hint it prevents. The consumer may write `align` statically: hydration writes the static value back and the `null` binding removes it in the same pass, so the final DOM equals the server's (ticket 50 decision 9, a trap-quadrant decision with its options record there). Layer 4 asserts that no frame paints with `align` present.
- `height` on `yetiHero`: `inert`. HTML's `height` means something on `img`, `iframe`, `video`, `canvas`, `embed`, `object`, and the obsolete table forms, none of which can hold the hero's two children, so a static `height="md"` stays on the host beside `data-height="md"` and does nothing (ticket 26 row 75; the [cover](cover.md) spec confirms the same for its hosts).
- `min` and `span` on `yetiHeroChild`: `inert`. HTML's `min` means something only on `input`, `meter`, and `progress`, and `span` only on `col` and `colgroup` (ticket 26 rows 76 and 77, grilling Q15). None of them is a hero child: an `img`, `video`, `picture`, `figure`, or `div` gives neither attribute a meaning, so the static forms stay on the element and do nothing. `NgOptimizedImage` on the same `img` declares neither name (read in `ng_optimized_image.ts`).

**Module replaced:** none. Yeti's `hero` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 18, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads the six public tokens above, and through `attributes.css` the token behind whichever `threshold`, `gap`, `height`, or `min` value is bound (`--yeti-width-*`, `--yeti-space-*`, `--yeti-height-*`). The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block, in a **Theme** file after Yeti, or with a runtime `setProperty`. None is a hue, chroma, or scale input, so each also takes effect on one hero element and its descendants (`Y/src/guides/theming.md:38`), as Yeti's own fixture sets `--yeti-cover-height: 300px` on one hero (`Y/test/browser/fixtures/recipes/hero.html`). `--yeti-cover-height` also sizes the cover, a filled stack, and the shell, so a `:root` value reaches all four (the [cover](cover.md) spec's Tokens subsection says the same from its side). `--yeti-color-text-muted` is a **Derived token** of the neutral hue (`Y/src/tokens/color.css:100`). **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- `YetiHero` provides `yetiHeroToken` (`InjectionToken<YetiHero>`, `useExisting`), building-blocks 1.9 and 1.3's token naming.
- `YetiHeroChild` injects it with `{ optional: true, skipSelf: true }` ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) kind C). It reads nothing from it in the first milestone: no behaviour depends on the parent, and the **In-item check** that would use it (a marker on a grandchild, a third child) belongs to a later milestone (map, Milestones). A part outside a hero renders its markers and nothing else happens, because Yeti's rules are `.hero > [data-span]` and `.hero > [data-min]`.
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"); the recipe replaces the composition rather than hosting it. A consumer composes by writing directives beside each other: `yetiHero` with `yetiBox` on one element, as Yeti's example does, `yetiEnter` on the hero or on a child, or `yetiContainer` on the copy, as Yeti's billboard example does.
- Shared input names (building-blocks 1.4, shared vocabularies): `gap` is `YetiGap` on every reader, `align` `YetiAlign` on the eight items that declare it, `threshold` `YetiWidth`, `ratio` `YetiRatio` (with `frame`, `media`, and `card`), `side` `YetiSide` (with `media`, `sidebar`, `enter`, and `dropdown`), `height` `YetiHeight` (with `cover` and `demo`), `span` `YetiSpan` (with the `columns` and `grid` parts), and `min` `YetiWidthOrNone` (with `grid` and `masonry`). So no two package directives on one element declare one input name with different types. Where two of them sit on one element, one static attribute feeds both and both render the one `data-*` Yeti means (ticket 26 grilling Q16): on `yetiHero yetiBox`, `gap` is the box's padding and the hero's gap at once, as in Yeti's example; on `yetiHero yetiEnter`, `side` places the figure and names the side a `slide` arrives from at once (the [enter](enter.md) spec's shared-`side` note).
- The only other injection is the root styles service of ADR 0060, reached by `injectYetiItemStyles('hero')` from `ngx-yeti/styles` as the last statement of the constructor ([setup](setup.md); ticket 50 decisions 42 and 45), through which `YetiHero` acquires and releases the item file. That service is the [setup](setup.md) spec's and ADR 0060's. `YetiHeroChild` sets no presence attribute and acquires nothing, because Yeti's rules for it apply only under a `.hero`, whose own host keeps the link (ticket 50 decision 6).
- Generated ids and the platform's relationship attributes: none. The hero renders no `id` and references none, so it does not use [generated-ids](generated-ids.md).

### 4. API

| Member | `YetiHero` | `YetiHeroChild` |
| --- | --- | --- |
| Class name | checked at the Pin against the 46 names `yeti.d.ts` exports: neither `YetiHero` nor `YetiHeroChild` is among them, so each takes `Yeti`, not `NgxYeti` (ADR 0080 point 4; ticket 50 decision 10) | as left |
| Selector | `[yetiHero]` | `[yetiHeroChild]` |
| `exportAs` | `yetiHero` | `yetiHeroChild` |
| Entry point | `ngx-yeti/hero` (building-blocks 1.3; ADR 0011 clause 10) | same |
| Inputs | `threshold: YetiWidth \| undefined` (Yeti default `lg`); `gap: YetiGap \| undefined` (`lg`); `ratio: YetiRatio \| undefined` (`4/3`); `align: YetiAlign \| undefined` (`center`); `side: YetiSide \| undefined` (none: source order); `height: YetiHeight \| undefined` (`full`); each `input()` with no default value (ADR 0070 rule 1) | `span: YetiSpan \| undefined`; `min: YetiWidthOrNone \| undefined` |
| Host | static `class: 'hero'`; static `'data-ngx-yeti-item-hero': ''`; `'[attr.data-threshold]'`, `'[attr.data-gap]'`, `'[attr.data-ratio]'`, `'[attr.data-align]'`, `'[attr.data-side]'`, `'[attr.data-height]'` from the inputs, `null` when unset; `'[attr.align]': 'null'` with a source comment naming the presentational hint it prevents | `'[attr.data-span]'` and `'[attr.data-min]'` from the inputs, `null` when unset; no class, no presence attribute, no `[attr.span]` or `[attr.min]` binding (`inert`) |
| Providers | `yetiHeroToken` | none |
| Models, outputs, methods | none | none |
| Lifecycle | acquires the `hero` item file, on the server too, with `injectYetiItemStyles('hero')` as the last statement of its constructor (ticket 50 decisions 42 and 45), after anything there that can throw, and releases it through `DestroyRef` (ADR 0060 point 2; ticket 50 decision 42; building-blocks 1.9) | none |

Types come from the generated `yeti-types.ts` copy of Yeti's typings at the pin, re-exported by name (ADR 0060 point 10; building-blocks 1.3). The span and ratio vocabularies are string unions, so `span="3"` and `[ratio]="'16/9'"` compile and `[span]="3"` does not (ADR 0070 rule 2). The selectors are the ones Part 2 row 18 names; this spec fixes them, as ticket 26 left part selectors to the specs. No input changes a Yeti default.

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiHero` on an element that holds flow content (`header`, `section`, `div`, `article`, or `main`) with exactly two element children: the copy and the figure (manifest `children`, `> *` min 2, max 2). On those hosts the static `height` attribute is inert (section 2). A hero with no picture is a [cover](cover.md) (`docs.md`, "Why this name").
2. The figure is an `img`, `video`, or `picture`, or an element (a `div`, or a `figure` with an optional `figcaption`) that has one as a direct child. The copy must not have an `img`, `video`, or `picture` as a direct child, or it is taken for a second figure; put such media one level down, inside a wrapper in the copy (manifest `children`).
3. Write the copy first and keep the page's `h1` in it when the hero is the page's opening (manifest `a11y.notes`). Use `side` to draw the picture on the other side; it changes where the figure sits in the row, never where it is read, focused, or stacked.
4. Put `yetiHeroChild` on a direct child of the hero element, and only on a child that needs `span` or `min`. Yeti's selectors are child selectors, so a marker on a grandchild does nothing. A component's host element is the child: write `<app-hero-copy yetiHeroChild min="sm">`. `@if`, `@defer`, and `ng-container` add no element; a `@defer` block's placeholder or content is the child.
5. `span` and `min` act only while the two share a row; stacked, both children are full width (manifest markers). `min` is never wider than the row (`min(<width>, 100%)`), so it cannot cause horizontal scrolling.
6. Write `align` either way: `align="center"` or `[align]="alignment()"`. The directive removes the HTML `align` attribute the static form leaves (ticket 50 decision 9).
7. Do not write `class="hero"`, any of the hero's `data-*` attributes or markers, or `data-ngx-yeti-item-hero` statically. The directives bind them, and hydration writes a static attribute again before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"; ADR 0070 consequences). A value newer than the pin goes through `[ratio]="$any('5/4')"` (ADR 0070).
8. Bind every input from values that are the same on the server and the client, never from a browser-only read such as the window's width. The hero already responds to its own width through Yeti's CSS (building-blocks 1.7), and the hydration constraints require the same DOM on both sides.
9. Do not put `yetiFrame` on the hero's figure: the hero is the frame. A `frame` child reads its own `--_yeti-aspect` (`16/9` by default, `Y/src/layouts/frame/frame.css:11`) before the hero's, so the hero's `ratio` no longer reaches it (read, not measured). Use the hero's `ratio`, or the composed form of section 8 with no `yetiHero`.
10. The copy's spacing is the hero's: its children are separated by `--yeti-space-sm` with their own margins zeroed. The rule `.hero > :not(...)` outranks `.stack` in specificity, so a `yetiStack gap` on the copy does not change it (read in `hero.css` and `stack.css`, not measured); change `--yeti-space-sm` on the hero element, or nest a `yetiStack` inside the copy.
11. With `NgOptimizedImage` (building-blocks 1.2, images rule), write the figure's image with `ngSrc`, `width`, and `height`, and give the hero the image's own ratio as `ratio` (or crop the asset to the hero's ratio), because Angular's development-mode distortion check compares the rendered ratio with the image's own and does not read `object-fit` (`NGP/common/src/directives/ng_optimized_image/ng_optimized_image.ts:1103-1123`, read). Where the two ratios must differ, wrap the image in a `div` without a caption and use [frame](frame.md)'s rule: `fill`, plus `position: relative` on the wrapper in the consumer's own stylesheet (ticket 50 decision 35). Never use `fill` on an image that is itself the hero's child: `fill` positions it absolutely (`ng_optimized_image.ts:260`), so it leaves the flex row ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 75). The opening picture is usually the page's largest contentful paint, so mark it `priority`.
12. A `video` figure that plays by itself for more than five seconds needs a way to pause it (WCAG 2.2.2); the `video`'s attributes are the consumer's. Give a `video` its sources as `<source>` children, not a `src` attribute, because hydration writes a static `src` again and re-runs the load ([frame](frame.md) usage rule 7; ticket 50 decision 36).
13. Import every directive class the template writes. A **Forgotten import** of `YetiHero` with static inputs renders an unstyled block, and one of `YetiHeroChild` with static `span` and `min` renders equal halves, both with no error; only a bound input (`[gap]`, `[span]`) makes the compiler report it (NG8002) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `hero` | Nearest in Angular Material |
| --- | --- | --- |
| Shape | an item directive on the consumer's element, plus one part directive on a child that takes a share or a least width | none: Material has no page-opening or split layout. The nearest piece is `mat-card` with `mat-card-image` and `mat-card-content`, a component whose image is cropped by its own styles (`NC/src/material/card/card.ts`) |
| Responsive switch | the hero's own width against a threshold, in CSS | none; a consumer uses `BreakpointObserver`, which the package does not use (building-blocks 1.7) |
| Styling | Yeti's item file, loaded per item; tokens in the consumer's stylesheet | component styles and Sass theming |
| Accessibility | none of its own: the consumer's elements; DOM order is reading order | none of its own |
| API | six typed inputs, two typed part inputs, `exportAs` | `appearance` on the card |

Nothing from Material's API applies: the card is a contained surface, and the hero lays out the consumer's own copy and picture across a page. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 18; building-blocks 1.2). The reason, row 1's, which row 18 takes: Yeti's CSS does the whole job; the directives add the class, the typed attributes and markers, the `align` removal, the item-file acquisition, and `exportAs`. Flexbox `gap`, `aspect-ratio`, `object-fit`, `:has()`, and `dvh` units are inside Baseline 2025 (building-blocks 1.2; [Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md), whose section 6.4 lists the hero's `:has()` and found the manifests' `support.unguarded` lists agree with its scan). No Aria pattern applies (the recipe has no role), and no CDK piece is used: there is no id, focus, keyboard, observer, or direction read (Yeti's row and its reversal follow the writing direction by themselves), and no viewport or element measurement in script (building-blocks 1.7).

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The hero adds no role, state, or property, and no tab stop.
- **Keyboard:** none. Focusable content (the copy's link or button, a `video` with `controls`) keeps DOM order.
- **Names:** none. A `header` hero that is not inside an `article`, `aside`, `main`, `nav`, or `section` maps to the banner landmark; that is the consumer's element and the package adds nothing. The figure's text alternative is the consumer's `alt` (or the `video`'s own captions and name).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.1.1 Non-text Content | The figure's `img` carries the consumer's `alt`, empty only when the picture is decoration. The package renders no image; every story and example gives one (ADR 0015 point 4). |
| 1.3.1 Info and Relationships | The hero's elements are the consumer's; the directives add no role. Usage rule 3 keeps the page's `h1` in the copy, where its structure matches what is seen (manifest `a11y.notes`). |
| 1.3.2 Meaningful Sequence | `side` reverses the row's direction, never the DOM, and only while the two share a row; stacked, the source order is the visual order (read in `hero.css`; Yeti's `data-side places the figure only while the two share a row` case). Two independent halves side by side carry no sequence whose meaning a visual swap changes; usage rule 3 puts the copy first so the reading order starts with the headline. Layer 1 asserts that the accessibility tree order equals the DOM order with `side` set to either value. |
| 1.4.3 Contrast (Minimum) | The only text colour the hero's CSS sets is the caption's `--yeti-color-text-muted` at `--yeti-text-sm`. Yeti's example has no caption, so ticket 17's clean axe run did not cover it. The **Story gate** runs axe on the `hero--caption` story, and its play function also asserts the caption's ratio against the page surface at 4.5:1 with the exact WCAG formula in light and dark ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 8 and 76). The copy's colours are the consumer's or another item's (`box` surfaces). |
| 1.4.4 Resize Text | The least height is a minimum, never a fixed size, and the copy sets no overflow, so zoomed text grows the band past the viewport (manifest: "Content taller than the band grows it"). The threshold and `min` widths are `rem`, so zoomed text makes the hero stack sooner (read). Only the figure clips, and it holds media, not text; a caption sits outside the cropped box. Layer 4 repeats it at 200 % text zoom. |
| 1.4.10 Reflow | Below the threshold every child is full width; `min` is capped at `100%`. Ticket 17 measured no page-level horizontal scroll on 46 of 49 examples at 320 x 640, the hero's among them (section 2.4). Layer 4 asserts no horizontal overflow at a 320 px viewport for the default, `span` and `min`, and caption stories, and at 320 x 256 that the band grows past the viewport and the page scrolls in the block direction only. |
| 1.4.12 Text Spacing | The copy sets no height and no overflow; overridden spacing grows the copy and the band (read). |
| 2.2.2 Pause, Stop, Hide | A moving `video` figure is the consumer's; usage rule 12 states the requirement. The hero adds no motion. |
| 2.4.3 Focus Order | Focusable content keeps DOM order whichever side the figure is drawn on (1.3.2 above). |

**Ledger rows owned:** none (Part 2 row 18). The hero adds no feature Yeti lacks and closes no gap Yeti leaves: ticket 17 classed the three recipes as conforming as far as measured (section 3), and the caption assertion above tests Yeti's default rather than adding to it. A caption that fails 4.5:1 in a later pin would add a row under A11Y-10a's pattern (ticket 50 decision 8).

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<header yetiHero yetiBox threshold="sm" gap="lg" surface="sunken">
  <div>
    <h1 i18n>Every marked route in the park</h1>
    <p i18n>Printed maps you can walk by, updated each spring.</p>
    <a yetiButton routerLink="/maps" i18n>Get the maps</a>
  </div>
  <img ngSrc="ridge.jpg" width="1200" height="900" priority alt="A snow ridge at first light" i18n-alt />
</header>
```

Server HTML and the hydrated DOM are the same. The header carries `yetihero=""`, `yetibox=""`, `threshold="sm"`, `gap="lg"`, `surface="sunken"` (the static input attributes, matched by no rule), `class="hero box"` (the order of the two classes is Angular's and does not matter to Yeti's CSS), `data-threshold="sm"`, `data-gap="lg"` once, `data-surface="sunken"`, `data-ngx-yeti-item-hero=""`, and `data-ngx-yeti-item-box=""`, and no `data-ratio`, `data-align`, `data-side`, `data-height`, or `align`. Neither child carries anything from the hero, because neither needs a marker. With `align="center"` written statically the header also carries `data-align="center"` and still no `align`; with `height="md"` it carries `height="md"` (inert) and `data-height="md"`.

A marked child, after Yeti's docs: `<div yetiHeroChild span="2" min="sm">` carries `yetiherochild=""`, `span="2"` and `min="sm"` (inert), `data-span="2"`, and `data-min="sm"`, and no presence attribute.

The server also writes the item links into `<head>` in Yeti's order: for the `box` first, then for the hero, `rel="stylesheet"`, `href` `<url>recipes/hero/hero.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="hero"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5; `Y/src/yeti.css:29`, `:38`). The client adopts the links at bootstrap. The hero has no open or closed state.

The delta from Yeti's docs markup: the consumer writes `yetiHero` where the docs write `class="hero"`, the input names where they write each `data-*` attribute, and `yetiHeroChild span min` where they write `data-span` and `data-min`. Yeti's `src="peak.jpg"` becomes `ngSrc` with `width`, `height`, and `priority` (usage rule 11), and its `href="#"` a real route, neither of which the package changes.

The same result built from primitives, after Yeti's docs ("Built from primitives"), is the [cover](cover.md) spec's hero example: `yetiCover` holding an `NgxYetiColumns` with `yetiCoverChild center`, `threshold="lg"`, `gap="lg"`, and `align="center"`, which holds a `yetiStack gap="sm"` for the copy and a `yetiFrame ratio="4/3"` for the picture. Yeti's own test measures both forms against each other; layer 1 and layer 4 do the same with the package's directives.

### 9. Animation

None. The hero has no state and no transition, and Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). A consumer may remove a hero with a class-form `animate.leave`; the item link stays until Angular removes the host, because removal waits for the DOM (ADR 0060 point 4). A hero that is server-rendered never takes `animate.enter` (ADR 0011 clause 12). Changing an input at run time moves the layout at once, as Yeti's CSS has it. A consumer who wants the headline or the picture to arrive writes the `enter` utility's directive on that child (the [enter](enter.md) spec), whose `once` form is for content that starts below the fold (ticket 50 decision 21), which an opening screen is not.

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes and markers, and the item link in `<head>` (section 8). Everything at first paint is a host binding (ADR 0011 clause 1). The least height is `100dvh` in CSS and the switch to rows is flex-basis arithmetic, both resolved by the browser at first paint with no script. Nothing is **Pre-hydration state**: no person and no Yeti module can change a `data-*` attribute (ticket 26 grilling Q12).
- **Before hydration:** the directives create no node, read no layout, start no timer or observer, and touch no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is `YetiHero`'s item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** every element is claimed as is; bindings computed from the same inputs give the same values (usage rule 8); 0 style mutations (ADR 0060 point 5, measured for the mechanism). A static `align` is written back and removed again in the same pass (section 11).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the hero and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism). A `@defer` block inside a hero adds no element, so its content is the hero's child, and `yetiHeroChild` inside it works before and after the block hydrates. A hero and its marked child share one **Hydration boundary** unless such a block holds the child; either way both are static, so nothing differs.
- **`hydrate never`:** the hero is its server HTML and stays styled while its host is connected, whatever live heroes do (ADR 0060 point 4; ADR 0045). On a host shared with `box`, each item's presence attribute keeps its own link (ADR 0045). There is no Angular behaviour to lose; a bound input simply never changes.
- **Client-only `@defer`:** the item file is fetched when `YetiHero` is constructed, which can show unstyled frames; the consumer closes the gap with `provideYetiStyles({ preload: ['hero'] })` (ADR 0060 point 6; [setup](setup.md)). An opening screen is usually server-rendered, so this is the rarer case.
- **Event replay:** the directives declare no listener, so nothing replays and no `jsaction` is added by them. A link or button in the copy is the consumer's and replays as its own item says.
- **`withI18nSupport()`:** the headline, the copy, and the image's `alt` are translated with `i18n` and `i18n-alt` in the consumer's component. The directives add no `i18n` block; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** inputs are signals and host bindings read them, so any bound input refreshes with no zone (map, Standing rulings, item 43; ADR 0070 rule 4).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the band is viewport-tall, the picture cropped and on its side, and the row stacked below the threshold, because the attributes and the item link are in the server HTML. Nothing is lost: the hero has no behaviour. A client-only application gets no such promise.

### 11. Hydration constraints

The hero complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; every `data-*` attribute and marker comes from an input whose value usage rule 8 keeps equal on both sides; `[attr.align]` is always `null`.
- **No direct DOM manipulation:** the directives write nothing to the DOM outside host bindings. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directives change no element. The consumer's markup must be valid as written; for example a hero on a `p` cannot hold a heading, so the parser would repair it and differ from the server's DOM; usage rule 1's hosts avoid it.
- **`preserveWhitespaces`:** the directives have no template. A flex container ignores whitespace text between its children, and `:first-child` in the `side` rule counts elements only, so neither whitespace nor Angular's comment nodes change which child is the figure.
- **No output branched on the platform:** none.
- **Static attributes the directives bind:** usage rule 7 keeps the consumer from writing the `data-*` attributes. The static forms of `height`, `min`, and `span` are the inputs' own and stay on the element unchanged on both sides (`inert`). The static form of `align` is the one static attribute a directive also binds (to `null`); hydration writes it back and the binding removes it again in the same pass, so the final DOM equals the server's. This form is allowed by ticket 50 decision 9, and layer 4 asserts that no frame paints with `align` present.

### 12. Single-page application

None. The hero has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). A link in the copy is the consumer's. On a route change, a route's heroes leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-hero]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders a hero again re-inserts it.

### 13. Item file

`yeti-css/css/recipes/hero/hero.css`, one of Yeti's 49 and one of its three recipe files, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiHero]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:38`, after `media` and before `shell`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-hero` has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds every hero value rule and the `--yeti-cover-height` token), and optionally `provideYetiStyles({ preload: ['hero'] })`. The hero adds nothing to it. Cross-item files acquired: none. `hero.css` has no rule for another item, and the recipe works without `cover.css`, `columns.css`, `stack.css`, or `frame.css`, which it replaces rather than reads (ADR 0060 point 9).

One order matters inside `yeti.layouts` (read, not measured): `.hero > *` sets `margin: 0` at the same specificity as `.center`'s automatic inline margins, and `hero.css` comes after `center.css` in `yeti.css` (`:30`, `:38`), so a `center` written as a hero's child loses its inline centring in Yeti as in the package. ADR 0060 point 3 keeps that order whichever directive is created first, so the package matches full Yeti. It is the reverse of the cover's tie (the [cover](cover.md) spec, section 13), where `center` comes later and wins. No story relies on a `center` child.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class, attributes, and markers in the DOM, the item link, where the copy and the figure land, the figure's ratio, how tall the band is, and the reading order. It never asserts a private field, the parent token's value, or how the styles service counts. No test depends on a public token's default value ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): where a test needs a height, a width, or a gap, it compares with a probe element in the same page styled with the token, or reads the token's computed value, as Yeti's own `Y/test/browser/recipes/hero.spec.js` does with its `token()` helper. Geometry stories use `data:` URL images, as Yeti's fixture does, where building-blocks 1.2 allows a plain `img`; the `hero--optimized-image` story uses `NgOptimizedImage`. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `hero` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `hero--default`: section 8's markup (Yeti's example with `yetiBox` beside `yetiHero`). Asserts `class` contains `hero` and `box`, one `data-gap="lg"`, `data-threshold="sm"`, both presence attributes on the header, no `data-ratio`, `data-side`, or `data-height`, nothing from the hero on either child, and no `tabindex` or role added by the package. In a wide container asserts copy and picture side by side, the picture's width over height equal to 4/3 within 0.01, the row's vertical midpoint equal to the band's within 1 px, the band at least the probe's `var(--yeti-cover-height)`, every child's computed margins 0, and the accessibility tree order equal to the DOM order.
- `hero--settings`: every `YetiHero` input bound from a Storybook control. Asserts each attribute follows its control and that clearing a control removes it; for each `ratio` value the picture's ratio matches; for each `height` value the band's block size equals a probe styled with the matching token (`--yeti-height-sm` to `-xl`, `--yeti-height-half`, `--yeti-cover-height` for `full` and for unset); for each `align` value the children's block-start, centre, or block-end edges line up. With `align="center"` written statically, asserts `data-align="center"` and no `align` attribute.
- `hero--side`: Yeti's four cases (copy first or figure first, `side` `start` or `end`) in a container above and below the threshold. Asserts the figure on the asked side while side by side, the source order stacked whatever `side` says, and the accessibility tree order equal to the DOM order in every case. A narrow copy in a reversed, stacked hero sits at the start edge (Yeti's `narrow-start` case).
- `hero--span-and-min`: the copy with `yetiHeroChild span="2"` beside a figure with `span="3"`, and the same with `min="md"` on the copy. Asserts the figure takes three fifths of the row within 0.1; with `min`, the copy's width equals the probe's `--yeti-width-md` within 1 px and the figure stays inside the row; stacked, both are full width.
- `hero--caption`: a `figure` with a `figcaption` as the figure. Asserts the media alone takes the ratio, the caption sits below it inside the hero and is not clipped, and the caption's contrast against the page surface is at least 4.5:1 with the exact WCAG formula in light and dark (section 7; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 8 and 76).
- `hero--built-from-primitives`: the one-class hero beside the composed form of section 8 (`yetiCover`, `NgxYetiColumns` with `yetiCoverChild center`, `yetiStack`, `yetiFrame`), same content. Asserts the copies' and the figures' rectangles match relative to their bands within 1 px, side by side and stacked (Yeti's "matches the composed form" cases).
- `hero--optimized-image`: the two forms of usage rule 11, a direct `img` child with `ngSrc`, `width`, and `height` in the hero's ratio, and a wrapped `fill` image with `position: relative` on the wrapper and a different ratio. Asserts each figure's ratio and records the console output of both in development mode; neither may log Angular's distortion warning (usage rule 11; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 75). If the direct form warns anyway, usage rule 11 becomes "expect the development-mode warning when the ratios differ".

### Layer 2: browser-level (`npx nx test <lib>`, `hero.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiHero, { tagName: 'header' })`: the host has class `hero` and `data-ngx-yeti-item-hero`, and none of the six `data-*` attributes and no `align`; with `bindings` setting each input (`threshold` `'sm'`, `gap` `'xl'`, `ratio` `'16/9'`, `align` `'start'`, `side` `'end'`, `height` `'half'`), each attribute follows and `align` stays absent, and setting them back to `undefined` removes them.
- While a `YetiHero` fixture lives, one `<link data-ngx-yeti-styles="hero">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- `createDirective(YetiHeroChild, { tagName: 'img' })` and `{ tagName: 'div' }`: no `data-span` or `data-min` by default; bound `span` `'3'` and `min` `'sm'` render them; the host carries no presence attribute and acquires no link (ticket 50 decision 6).
- No directive adds a listener to its host.

A small test host covers what `createDirective` cannot: a child declared inside a `yetiHero` host resolves `yetiHeroToken` to the parent instance, and one outside any hero renders its markers with no error; template references `#h="yetiHero"` and `#c="yetiHeroChild"` resolve; a static `align="center"` renders `data-align="center"` and no `align` (the `removed` kind); a static `height="md"` renders both `height="md"` and `data-height="md"`, and static `span="2"` and `min="sm"` both their own and their `data-*` forms (the `inert` kind); `yetiHero yetiBox gap="lg"` renders one `data-gap="lg"` and both presence attributes; `yetiHero yetiEnter="slide" side="end"` renders one `data-side="end"`; and the consumer's own `class` on each host is kept.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `hero.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture of section 8's markup whose heading, paragraph, and `alt` carry `i18n` (building-blocks 1.11 decision 11, 1.12), with a static `align="center"` on the header and one `yetiHeroChild span="2"` on the copy: `whenStable()` resolves; the header renders `class="hero"`, `data-ngx-yeti-item-hero`, `data-align="center"`, and `data-height="md"` from a bound input, and no `align` attribute (building-blocks 1.4: the static form is written and the attribute asserted absent); the copy renders `data-span="2"` and no presence attribute; `<head>` holds one item link with `data-ngx-yeti-styles="hero"`, `data-beasties-skip`, and an `href` ending `recipes/hero/hero.css?v=<pin>`; no element carries a `jsaction` from the package.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the hero through the contract mapping: class `hero` has `YetiHero`; `data-threshold`, `data-gap`, `data-ratio`, `data-align`, `data-side`, and `data-height` have inputs whose unions equal the manifest's vocabularies `width`, `gap`, `ratio`, `align`, `side`, and `height`; the markers `data-span` and `data-min` have inputs on `YetiHeroChild` with the `span` and `width-or-none` vocabularies; the manifest's events for `hero` are empty. A pin move that adds an attribute, a value, or a marker fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids, after Yeti's own `hero.spec.js`, in containers of 1000 px and 400 px and at viewports of 1280 x 800 and 320 x 640:

- the one-class hero matches the composed form side by side and stacked; the default band is the viewport's height and the row is centred in it; the figure is 4/3;
- `height="xl"` is the probe's `--yeti-height-xl` and not the viewport-tall hero's height (Yeti's falsification case);
- `side` places the figure only while the two share a row (Yeti's four cases at both widths), and a narrow child in a reversed stacked hero sits at the start edge;
- `span` gives three fifths; `min` keeps the copy at the probe's `--yeti-width-md`; both stack full width at 400 px;
- every child has no margin;
- at 320 px the page has no horizontal overflow (1.4.10); at 320 x 256 and at 200 % text zoom the band grows past the viewport, the copy's bottom is inside it, and the page scrolls in the block direction only (1.4.4, 1.4.10).

That `100dvh` tracks a phone's collapsing toolbars (user story 49) is Yeti's CSS and the browser's; Playwright's device emulation does not collapse toolbars, so no layer asserts it (as the [cover](cover.md) spec says for the same token).

Fixture-app half, built with `outputMode: 'server'`, with a `/hero` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route renders section 8's markup with a static `align="center"` on the header:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`; after hydration the header has no `align` attribute;
- no frame paints with an `align` attribute on the header, from the first paint through hydration, and the headline's computed `text-align` is never `center` (ticket 50 decision 9);
- with JavaScript disabled the hero is viewport-tall, side by side at 1280 px and stacked at 320 px with the copy first, and `@axe-core/playwright` with the six tags reports no violation;
- a hero inside a client-only `@defer` block with `hero` in the preload list shows no unstyled frame; a hero with `box` on one element inside a `hydrate never` block keeps both item links after every live hero and box on the page is removed (ADR 0045's shared-host case);
- navigating from the hero route to a route without one removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` for the default story, and its `test/browser/recipes/hero.spec.js` with the fixture `test/browser/fixtures/recipes/hero.html` for the geometry cases and the comparison with the composed form; the [cover](cover.md) and [columns](columns.md) specs for the band and the threshold cases; the [grid](grid.md) and [columns](columns.md) specs for the `removed`-kind e2e case; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link.

## Out of Scope

- An input per token, or a `minHeight` or ratio input outside Yeti's vocabularies (ADR 0004; ADR 0005).
- A shared any-element `[yetiSpan]` or `[yetiMin]` directive (ADR 0070, considered options; ticket 26 grilling Q6).
- `span` or `min` inputs on `YetiHero`, or the hero's attributes on the part (ADR 0070 kinds R and C).
- A directive for the copy or the figure as such; a child with no marker takes none (ticket 26 grilling Q6).
- Hosting `cover`, `columns`, `stack`, or `frame` directives inside the hero's directives; the recipe replaces the composition, and the composed form is the consumer's (section 8).
- Any check that the hero has exactly two children, that the copy has no direct media child, that the part sits on a direct child, or that the copy comes first. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- A viewport-keyed input or any JavaScript size read (building-blocks 1.7).
- Package CSS for the hero: no `position: relative` for `NgOptimizedImage`'s `fill` and no rule for the copy's spacing (ticket 50 decision 35; ADR 0060 point 8).
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).
- The `media` recipe, a figure beside text, which has its own spec ([Spec: media](../issues/69-spec-media.md)).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiHero]` with six inputs; part directive `[yetiHeroChild]` with `span` and `min` | building-blocks Part 2 row 18; ticket 26 rows 70 to 77 |
| `data-span` and `data-min` are kind C (they change a child: "How many shares", "The narrowest") | ADR 0070; ticket 26 grilling Q6 and Q7 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by Yeti's vocabulary types; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2 |
| `align` is `removed`, unconditionally; `height`, `min`, and `span` are `inert` | building-blocks 1.4; ticket 26 rows 73 and 75 to 77 and grilling Q15 |
| Static `align` allowed; the `null` binding removes it in the hydration pass, and layer 4 proves no frame paints it | ticket 50 decision 9 (trap-quadrant record there) |
| Shared input names with one type per vocabulary; one static attribute feeds two directives on one element | building-blocks 1.4; ticket 26 grilling Q16 |
| The part injects `yetiHeroToken` optionally with `skipSelf` and reads nothing from it | ADR 0070 kind C; building-blocks 1.9 |
| Only the item directive marks its host and acquires the item file | ADR 0045; ticket 50 decision 6 |
| `exportAs` on both; class names checked against all 46 of Yeti's exported names | building-blocks 1.3; ADR 0080 points 3 and 4; ticket 50 decision 10 |
| Entry point `ngx-yeti/hero` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 18 |
| Tokens are the consumer's | ADR 0004 |
| Item file as a counted link in Yeti's order; presence attribute `data-ngx-yeti-item-hero` | ADR 0060 points 2 to 6; ADR 0045 |
| Inputs follow the manifest where Yeti's committed layouts guide is stale | ADR 0005; ticket 50 decision 34 (Y9); [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 74 extends Y9 |
| `NgOptimizedImage` with `width` and `height` in the hero's ratio; a wrapped `fill` image with the frame rule; never `fill` on a direct child | ticket 50 decision 35 for the wrapped form; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 75 for the direct child |
| Caption contrast asserted at 4.5:1 in the play function | ticket 50 decision 8 for the threshold; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 76 for asserting it here |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

The opening of a landing page, after Yeti's starter page (`Y/src/starter/index.html:45-57`), with a shorter band, the copy kept at least `sm` wide, and a captioned picture whose image already has the hero's 4 by 3 ratio:

```html
<section yetiHero threshold="md" gap="xl" height="md">
  <div yetiHeroChild min="sm">
    <h1 id="headline" i18n>Say what the site is for, in one line</h1>
    <p yetiLede i18n>A sentence or two that tells a visitor why they should keep reading.</p>
    <div yetiCluster gap="sm">
      <a yetiButton routerLink="/contact" i18n>The one thing to do</a>
      <a yetiButton emphasis="medium" routerLink="/features" i18n>Something else</a>
    </div>
  </div>
  <figure>
    <img ngSrc="valley.jpg" width="1200" height="900" priority alt="The valley trail at dusk" i18n-alt />
    <figcaption i18n>Photo: the park office</figcaption>
  </figure>
</section>
```

```ts
import { YetiHero, YetiHeroChild } from 'ngx-yeti/hero';
import { YetiLede } from 'ngx-yeti/lede';
import { YetiCluster } from 'ngx-yeti/cluster';
import { YetiButton } from 'ngx-yeti/button';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [YetiHero, YetiHeroChild, YetiLede, YetiCluster, YetiButton, NgOptimizedImage, RouterLink],
  templateUrl: './landing.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {}
```

The class names of the lede, cluster, and button directives are their specs'; the imports follow building-blocks 1.9's rule that a component imports every directive class its template writes.

The picture drawn at the start of the row while the copy stays first in the source, taking three fifths of the row: `<header yetiHero side="start">` with `<div yetiHeroChild span="2">` for the copy and `<img yetiHeroChild span="3" ngSrc="peak.jpg" width="1600" height="1200" priority alt="A snow ridge at first light" />` for the figure.

A headline that grows with its column, after Yeti's docs: the copy is `<div yetiContainer>` and the heading `<h1 yetiBillboard fit="xl-display" i18n>` (the [container](container.md) and [billboard](billboard.md) specs name those inputs).

A wide picture in a hero of another ratio, wrapped for `NgOptimizedImage`'s `fill` (usage rule 11): `<div class="hero-picture"><img ngSrc="ridge-wide.jpg" fill priority alt="..." /></div>` with `.hero-picture { position: relative; }` in the consumer's own stylesheet.

A hero only as tall as its content on one page, in the consumer's stylesheet after Yeti (`Y/src/tokens/tokens.json:124`, as the [cover](cover.md) spec cites): `.press-page { --yeti-cover-height: auto; }`. A ratio from state: `<header yetiHero [ratio]="wide() ? '16/9' : '4/3'">`. A value newer than the pin: `[ratio]="$any('5/4')"`. A page whose hero renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['hero'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `recipes/hero/hero.css`, loaded by `YetiHero` as a counted link (section 13). The consumer writes nothing for the hero beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps every `data-gap`, `data-align`, `data-threshold`, `data-height`, `data-min`, `data-ratio`, and `data-span` value to its private token (section 1); `tokens/space.css` declares `--yeti-cover-height`, the width, height, and space scales; `tokens/color.css` declares the caption's muted colour; `base/reset.css` makes media blocks with `block-size: auto`, which keeps an image's `width` and `height` attributes from fixing its rendered height.
3. **Cross-item rules:** none in `hero.css`. The tie with `center` (`.hero > *` against `.center`) is settled by ADR 0060 point 3's order, as in full Yeti (section 13). Items composed on the hero's element or its children (`box`, `enter`, `container`, `billboard`, `button`) load their own files through their own directives. A `frame` or a `stack` on a hero child is overridden by the hero's own rules (usage rules 9 and 10).
4. **Tokens:** reads the six public tokens of section 2 and the token behind a bound value; writes none.
5. **What breaks without the item file:** the element is an ordinary block with no least height, no row, and no gap; the picture keeps its own size and shape, the copy keeps its children's margins, `side`, `span`, and `min` do nothing, and nothing errors.
6. **Tailwind name collision:** none known. building-blocks 1.13 lists `container`, `grid`, `table`, and `hidden`, not `hero` (inferred, not measured).

### Platform features to adopt when the browser target moves

None. Every feature the manifest lists as unguarded (flexbox `gap`, `aspect-ratio`, `object-fit`, `:has()`, `dvh` units) is inside Baseline 2025 (section 6), and Yeti guards nothing for the hero. The package measures no size in script, so no future platform feature changes its code.

### Single-page-application pieces relied on

None: the hero uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
