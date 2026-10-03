# Spec: media (recipe)

Ticket: [69. Spec: media (recipe)](../issues/69-spec-media.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 19 and Part 1, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 78 to 83 and grilling questions 3, 12, 15, and 16, [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md), [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) (decisions 2, 8, 9, 18, 35, 36, and 42), and [ledger.md](../ledger.md) row A11Y-10d. The recipe is built from three layouts, each with its own spec: [sidebar](sidebar.md), [frame](frame.md), and [stack](stack.md). It shares `data-side` with the [enter](enter.md) utility (ticket 26, grilling question 3) and its figure rules with the `hero` recipe ([Spec: hero](../issues/68-spec-hero.md), not yet written). `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x); `NGP/` is `github.com/angular/angular/packages/` at 22.2.x. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 79 to 82), and each is cited where it applies.

## Problem Statement

Yeti's `media` **Recipe** puts a picture beside a few lines of text: "A comment with an avatar, a product with its thumbnail, a speaker with a headshot: whenever a picture sits beside a few lines of text, this is the shape" (`Y/src/recipes/media/docs.md`). It is one **Identity class**, `media`, on a wrapping flex row with exactly two children: the figure (an `img`, `video`, or `picture`, or an element wrapping one) and the body. The two sit side by side while the body keeps at least half the width, and stack when it cannot, with no breakpoint. Six **Attributes** configure it: `data-width` (the figure's width, and so where the two stack, default `xs`), `data-ratio` (the figure's crop, default `1/1`), `data-gap` (default `md`), `data-align` (default `stretch`), `data-max` (a cap on the body's width, so the figure takes the rest of a wide row), and `data-side` (put the figure at the start or the end while side by side, whatever the source order) (`Y/src/recipes/media/manifest.json`). It has no **Marker**, no **Module**, and no **Event**. Yeti says what it is: "the one-class form of a sidebar holding a frame and a stack" (manifest `description`), and its own test proves the two forms render the same geometry (`Y/test/browser/recipes/media.spec.js`).

An application developer using the package cannot write `class="media"` or any of those six attributes: a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). In plain Yeti a misspelt `data-width="small"` or `data-ratio="4:3"` fails silently: the attribute is present, so the `:not([data-width])` and `:not([data-ratio])` defaults in `media.css` stop applying, and no value rule in the **Always-loaded group** matches, so the figure loses its width or its crop altogether (read in `media.css` and `Y/src/layouts/attributes.css`). The package turns those into compile errors ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `media` **Item file** loaded while a `media` is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it the figure and the body stack as plain blocks at every width, the picture is not cropped, and nothing errors.

Four things need care. `align` is an HTML attribute that Chromium and WebKit still read as a text-alignment hint on any element, so the package must keep the input's static form from aligning the body's text (building-blocks 1.4; ticket 26 row 81). `side` is one attribute that two package directives declare: Yeti's `enter` utility reads the same `data-side` for the side a slide comes from, so `yetiMedia` and `yetiEnter` on one element must agree on one value (ticket 26 grilling question 3; ADR 0070, considered options). `side` also moves the figure visually while leaving the reading order alone, which touches WCAG 2.2's 1.3.2 Meaningful Sequence and 2.4.3 Focus Order. And the `media` is one of five items whose contrast axe could not compute on Yeti's own example (ticket 17, measured: `color-contrast` incomplete on the heading, Chromium and Firefox), so the package must check that contrast itself ([ledger.md](../ledger.md) A11Y-10d; [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 3).

## Solution

One directive in the secondary entry point `ngx-yeti/media` ([building-blocks.md](../building-blocks.md) Part 2 row 19):

- **`YetiMedia`**, the **Item directive**, on `[yetiMedia]`. It binds `media` as a static host class and six typed inputs to Yeti's attributes: `width` (`YetiWidth`) to `data-width`, `ratio` (`YetiRatio`) to `data-ratio`, `gap` (`YetiGap`) to `data-gap`, `align` (`YetiAlign`) to `data-align`, `max` (`YetiWidth`) to `data-max`, and `side` (`YetiSide`) to `data-side` (ticket 26 rows 78 to 83, kind R). It binds `[attr.align]` to `null`, so the input's static form never aligns the body's text (the `removed` kind, building-blocks 1.4). It sets the static presence attribute `data-ngx-yeti-item-media` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), acquires the `media` item file when it is created, on the server too, and releases it when destroyed.

There is no **Part directive**. The figure and the body carry no marker; Yeti's CSS finds the figure by what it is or holds (`.media > :is(img, video, picture)` and `.media > :has(> :is(img, video, picture))`) and treats the other child as the body (`media.css`), so a child needs no directive (building-blocks 1.1: "a child Yeti styles only by element and position gets no directive"; ticket 26 has no child row for `media`).

The developer writes `<article yetiMedia width="sm" max="md">` where Yeti's docs write `<article class="media" data-width="sm" data-max="md">`. Unset inputs render nothing, so Yeti's defaults (`width` `xs`, `ratio` `1/1`, `gap` `md`, `align` `stretch`, no cap, and the figure where the source puts it) apply from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1). A developer who wants to change a part the recipe fixes (the body's gap, a figure that is not a picture) writes the composed form from the three layouts' own directives instead, as Yeti's docs suggest: `yetiSidebar` holding a `yetiFrame` and a `yetiStack`.

Everything else is Yeti's CSS and the platform. The directive is **types only**: no listener, no render callback, no service, and no DI beyond the item file acquisition through ADR 0060's styles service (building-blocks Part 2, "Types only", and its note of 2026-10-03; ticket 50 decision 18). Server HTML is Yeti's documented markup, so the recipe renders the same on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block. What Yeti's manifest limits (exactly two children; no picture as a direct child of the body) are usage rules; their checks belong to a later milestone (map, Milestones). The `media--default` story's play function computes the contrast of the heading, the body text, and a figure caption with the exact WCAG formula, which closes what axe left incomplete (A11Y-10d).

## User Stories

1. As an application developer, I want to mark an element as a media object with one directive attribute, so that I never write Yeti's `media` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="media"` in the DOM, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want to set the figure's width with a `width` input typed by Yeti's width vocabulary, so that `width="small"` fails to compile instead of removing the figure's width.
4. As an application developer, I want the figure's width to decide where the two children stack, so that a small avatar stays beside its text down to a phone without a breakpoint.
5. As an application developer, I want to set the figure's crop with a `ratio` input typed `1/1`, `4/3`, `3/2`, `16/9`, or `21/9`, so that `ratio="4:3"` fails to compile instead of removing the crop.
6. As an application developer, I want to set the space between figure and body with a `gap` input typed by Yeti's gap vocabulary, including the fluid pairs, so that I get the same 29 values Yeti documents.
7. As an application developer, I want to set the vertical alignment of figure and body with an `align` input typed `start`, `center`, `end`, `stretch`, or `baseline`, so that a short body can sit at the top of a tall figure.
8. As an application developer, I want a static `align="center"` to align the two children and never the body's text, so that the HTML `align` hint does not change my copy.
9. As an application developer, I want to cap the body's width with a `max` input typed by the width vocabulary, so that on a wide row the text keeps a reading measure and the figure takes the rest.
10. As an application developer, I want `width` to still decide where the two stack when I set `max`, so that the cap changes only the wide case.
11. As an application developer, I want to put the figure at the start or the end with a `side` input typed `start` or `end`, so that I can mirror a list of speakers without changing the source order.
12. As an application developer, I want `side` to do nothing once the two have stacked, so that a stacked layout keeps the source order I chose.
13. As an application developer, I want an unset input to render no attribute, so that Yeti's own default applies and moves with the pin.
14. As an application developer, I want to bind every input from state, and clearing a bound input to remove its attribute, so that a list can switch between small and large figures.
15. As an application developer, I want the figure to be an `img`, a `video`, a `picture`, or an element wrapping one, so that I can use a link around an avatar or a `figure` with a caption.
16. As an application developer, I want a `figure` with a `figcaption` to keep the caption below the picture and crop only the picture, so that captioned thumbnails work as Yeti documents.
17. As an application developer, I want to know that the body must not hold a picture as a direct child, so that a body image is not taken for a second figure.
18. As an application developer, I want to know how to use `NgOptimizedImage` for the figure, so that I get Angular's image loading without breaking the row or seeing a misleading warning.
19. As an application developer, I want the media's item file loaded when the first `media` renders, so that I do not import `media.css` globally.
20. As an application developer, I want the item file removed after the last `media` leaves the page, so that a route without one carries none of its CSS.
21. As an application developer, I want the item file in the server HTML when a server-rendered page has a `media`, so that the first paint already has the row and the crop.
22. As an application developer, I want the layout correct with JavaScript off under SSR and prerendering, so that a page is readable before any script runs.
23. As an application developer, I want hydration to change nothing on a `media` or its children, so that I get no `NG05xx` error and no layout shift.
24. As an application developer, I want the directive to work under zoneless change detection, including any input bound from a signal, so that the package fits Angular's recommended mode.
25. As an application developer, I want a `media` inside a `@defer (hydrate on ...)` block to keep its layout before and after the block hydrates, so that incremental hydration does not unstack or uncrop it.
26. As an application developer, I want a `media` inside a `hydrate never` block to keep its styles while it is on the page, so that a dehydrated section is not unstyled when a live `media` elsewhere leaves.
27. As an application developer, I want to know that a `media` inside a client-only `@defer` block needs `media` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
28. As an application developer using `withI18nSupport()`, I want translated body text and `alt` text to hydrate without being re-rendered, so that localised pages keep the server's DOM.
29. As an application developer, I want a `@for` of comments, each a `media`, so that a comment list with avatars needs one directive per row.
30. As an application developer, I want to write `yetiEnter="slide"` beside `yetiMedia` and have one `side` input feed both, so that the slide comes from the side the figure sits on, as Yeti's single attribute means.
31. As an application developer, I want to put `yetiBox` or `yetiBorder` beside `yetiMedia`, and `yetiBox` on the body, so that I can pad and edge the recipe as Yeti's fixtures pad its body.
32. As an application developer, I want to be told not to put `yetiFrame` or `yetiStack` on the media's own children, so that I use the composed form when I want those layouts' knobs.
33. As an application developer, I want the usage rules for exactly two children and for a component host as the figure stated in the JSDoc, so that I do not write markup the recipe cannot read.
34. As an application developer, I want to set the default figure width, the default gap, the body's gap, and the caption's size and colour through Yeti's public tokens, so that my theme controls them.
35. As an application developer, I want the package to offer no input per token, so that the recipe's API stays the size of Yeti's contract.
36. As an application developer, I want my own classes and attributes on the `media` and its children kept, so that I can style them beside the directive.
37. As an application developer, I want a template reference (`#m="yetiMedia"`), so that the recipe follows the package's `exportAs` rule.
38. As an application developer, I want to import the directive from `ngx-yeti/media`, so that a `@defer` block can split it out with the rest of the item.
39. As a screen-reader user, I want the recipe to add no role, so that an `article`, a list item, or a comment is announced as the author wrote it.
40. As a screen-reader user, I want the figure and the body read in source order whatever `side` is, so that what I hear does not depend on where the picture is drawn.
41. As a screen-reader user, I want the figure's `alt` text to describe what the crop shows, so that I am not told about parts of the picture that are cut away.
42. As a keyboard user, I want the recipe to add no tab stop and no key handling, so that focus moves through the children's own controls in source order.
43. As a low-vision user, I want the recipe to stack at 320 CSS pixels with no horizontal scrolling, so that I can read the text at high zoom.
44. As a low-vision user, I want the heading, the body text, and a figure caption to meet 4.5:1 contrast, so that I can read them in light and dark schemes.
45. As a low-vision user who overrides text spacing, I want the body to grow with its content, so that my spacing settings do not clip text.
46. As a package maintainer, I want the A11Y-10d contrast asserted in the play function with the exact WCAG formula, so that the ledger row is met by a test, not by assumption.
47. As a package maintainer, I want the contract check to cover the class and all six attributes, so that a pin move that adds or renames one fails before release.
48. As a package maintainer, I want the SSR smoke to assert the server HTML of a `media`, the removed `align`, and the item link, so that the first paint is proven.
49. As a package maintainer, I want a test that the one-class form and the composed form of `sidebar`, `frame`, and `stack` land in the same place, so that the recipe keeps Yeti's promise through the package's directives.
50. As a package maintainer, I want the fixture app to render a `media` in a prerendered route and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
51. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default does not fail a test for no reason.
52. As a package maintainer, I want the class name checked against Yeti's typings at the pin, so that a future Yeti type named `YetiMedia` is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/recipes/media/manifest.json`, `media.css`, `docs.md`, and `example.html`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `media`, `recipe`, `Boxes and Stacks` |
| `description` | "Puts a figure beside a block of text and stacks them when the text would drop below half the width; the one-class form of a sidebar holding a frame and a stack." |
| `class` | `media` |
| `attributes` | `data-width` (vocabulary `width`: `2xs` to `2xl`, 7 values, default `xs`), "The figure's preferred width."; `data-ratio` (vocabulary `ratio`: `1/1`, `4/3`, `3/2`, `16/9`, `21/9`, default `1/1`), "The figure's aspect ratio."; `data-gap` (vocabulary `gap`, 29 values, default `md`), "Space between the figure and the text."; `data-align` (vocabulary `align`, default `stretch`), "Vertical alignment of figure and text when side by side."; `data-max` (vocabulary `width`, no default), "The widest the text may run side by side; the figure takes the rest of a wide row. data-width still sets where the two stack."; `data-side` (vocabulary `side`: `start`, `end`, no default), "Put the figure at the start or the end while side by side, regardless of source order. Stacked, the source order holds." |
| `classes`, `markers` | empty, none |
| `children` | `> *` (min 2, max 2): "Exactly two: the figure (an img, video, or picture, or an element wrapping one) and the body; the body must not have an img, video, or picture as a direct child (it would be taken for a second figure). A figure with a figcaption keeps its caption below the picture." |
| `tokens` | public: `--yeti-width-xs` ("The default figure width"), `--yeti-space-md` ("The default gap"), `--yeti-space-sm` ("The gap between the body's children"), `--yeti-text-sm` ("Text size of the caption"), `--yeti-color-text-muted` ("The caption"); private: `--_yeti-max`, `--_yeti-gap`, `--_yeti-width`, `--_yeti-align`, `--_yeti-aspect` |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "The figure is cropped to its ratio, so alt text should describe what is visible. data-side changes where the figure sits, not where it is read." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: "flexbox gap", "aspect-ratio", "object-fit", ":has()"; `guarded`: empty |
| `since` | `7.0.0` |

The rules, in `@layer yeti.layouts` (`media.css`): `.media` is a wrapping flex row with `align-items: var(--_yeti-align)` and `gap: var(--_yeti-gap)`; `:not([data-gap])`, `:not([data-width])`, `:not([data-align])`, `:not([data-ratio])`, and `:not([data-max])` set the private defaults; `.media > *` zeroes margins. The figure is the child that is, or directly holds, an `img`, `video`, or `picture`: it takes `flex-basis: var(--_yeti-width)`, `flex-grow: 1`, the ratio, and `overflow: hidden`, and the picture inside fills and is cropped with `object-fit: cover` (the wrapped case reaches an `img` inside a `picture` inside a wrapper). A `figure` with a `figcaption` crops only its picture and sets the caption in `--yeti-text-sm` and `--yeti-color-text-muted`. The body is every child that is not the figure: a flex column with `gap: var(--yeti-space-sm)`, `flex-basis: 0`, `flex-grow: 999`, `min-inline-size: 50%`, and `max-inline-size: var(--_yeti-max)`, whose own children's margins are zeroed. `data-side` reverses the row with `row-reverse` and `justify-content: flex-end` only when the figure is not already on the asked side, decided by `:has()` on the first child; stacked, nothing reverses.

The value rules that set `--_yeti-gap`, `--_yeti-width`, `--_yeti-max`, `--_yeti-aspect`, and `--_yeti-align` are in the **Always-loaded group** (`Y/src/layouts/attributes.css`: `data-align` from `:148`, `data-width` from `:172`, `data-max` from `:201`, `data-ratio` from `:222`), not in the item file. `data-side` has no value rule; `media.css` reads the attribute itself.

`docs.md` states what the usage rules repeat: put the picture first for picture-left and last for picture-right, and the reading order follows; the body must not hold a picture as a direct child; a smaller figure holds the row down to a narrower window; "The text's half of the row wins over the cap"; and the one difference from the composed form: "the sidebar's `data-side` picks which child is the sidebar, while the recipe's `data-side` reverses the row, which changes where the figure sits beside the text but not where it is read, and does nothing once the two have stacked". Yeti's validator has no `media`-specific check (`Y/bin/validate.js`, searched at the pin).

Attributes left to the consumer: none (ticket 26 rows 78 to 83). The figure's `alt`, a `video`'s `<source>` children and controls, and any role on the host are the consumer's, as building-blocks 1.10 and ticket 26 leave names and roles.

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `media` | static host class on `[yetiMedia]` (`YetiMedia`) | always present | ADR 0003 point 1; Part 2 row 19 |
| Attribute `data-width` | the figure's width and the stack point | input `width`: `YetiWidth \| undefined`, bound `[attr.data-width]` | unset renders nothing (Yeti's `xs` applies); `width` kind `inert` | ticket 26 row 78 (R); building-blocks 1.4 |
| Attribute `data-ratio` | the figure's crop | input `ratio`: `YetiRatio \| undefined`, bound `[attr.data-ratio]` | unset renders nothing (Yeti's `1/1` applies) | ticket 26 row 79 (R) |
| Attribute `data-gap` | space between figure and body | input `gap`: `YetiGap \| undefined`, bound `[attr.data-gap]` | unset renders nothing (Yeti's `md` applies) | ticket 26 row 80 (R) |
| Attribute `data-align` | cross-axis alignment while side by side | input `align`: `YetiAlign \| undefined`, bound `[attr.data-align]`; plus `'[attr.align]': 'null'` | unset renders nothing (Yeti's `stretch` applies); `align` kind `removed` | ticket 26 row 81 (R); building-blocks 1.4; ticket 50 decision 9 |
| Attribute `data-max` | the body's widest measure | input `max`: `YetiWidth \| undefined`, bound `[attr.data-max]` | unset renders nothing (no cap); `max` kind `inert` | ticket 26 row 82 (R) |
| Attribute `data-side` | figure at the start or the end while side by side | input `side`: `YetiSide \| undefined`, bound `[attr.data-side]` | unset renders nothing (the source order decides) | ticket 26 row 83 (R); shared with `enter` (row 163) |
| Children | `> *`, exactly two | no directive on either child | not applicable | building-blocks 1.1; ticket 26 (no child row) |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Tokens `--yeti-width-xs`, `--yeti-space-md` | the default figure width and gap | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--yeti-space-sm`, `--yeti-text-sm`, `--yeti-color-text-muted` | the body's gap; the caption's size and colour | the consumer's | not applicable | ADR 0004 |
| Tokens `--_yeti-max`, `--_yeti-gap`, `--_yeti-width`, `--_yeti-align`, `--_yeti-aspect` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-media=""` on `[yetiMedia]` | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2 |

The presentational-attribute kinds (building-blocks 1.4), confirmed for this item's hosts. The host is the element holding the two children: a `div`, `article`, `section`, `li`, or `a`.

- `align`: `removed`. HTML's `align` is a text-alignment hint that Chromium and WebKit honour on any element (ticket 26 row 81 and grilling question 15, from old ticket 139's measurement M1), so a static `align="center"` would centre the body's text as well as aligning the two children. The directive binds `'[attr.align]': 'null'` unconditionally, with a source comment naming the effect it prevents. The consumer may write `align` statically: hydration writes the static value back and the `null` binding removes it in the same pass, so the final DOM equals the server's ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 9).
- `width`: `inert`. HTML's `width` is presentational only on `img`, `table`, `iframe`, `video`, and `canvas` (ticket 26 row 78), none of which can hold the recipe's two children, so a static `width` stays on the host beside `data-width` and does nothing.
- `max`: `inert`. HTML's `max` belongs to form controls (ticket 26 row 82), which are not hosts, so a static `max` stays on the host and does nothing.
- `ratio`, `gap`, and `side` are not HTML attributes; their static forms stay on the element and do nothing.

**Module replaced:** none. Yeti's `media` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 19, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads five public tokens: `--yeti-width-xs` (the default figure width, `16rem` at the pin, `Y/src/tokens/space.css:37`), `--yeti-space-md` (the default gap), `--yeti-space-sm` (the body's gap), and `--yeti-text-sm` and `--yeti-color-text-muted` (a figure's caption). Through the always-loaded value rules it reads the width or space token named by any `width`, `max`, or `gap` value. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block, in a **Theme** file after Yeti, or with a runtime `setProperty`; none is a hue, chroma, or scale input, so each also takes effect on one `media` and its descendants (`Y/src/guides/theming.md:38`). The width scale reaches further than the recipe: `--yeti-width-*` also sizes the `sidebar`, the `scroller`, the `center`, and the `breakout` ([sidebar](sidebar.md) section 2). **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- `YetiMedia` is standalone. It provides no **Injection token**, injects no parent, hosts no directive, and is hosted by none: no Yeti item always sits on another item's element (Part 2, "Two findings that hold across the matrix"). It has no part or child directive to find it, so a token would have no reader.
- It is written beside other directives on one element: `yetiEnter` (an arriving row), `yetiBox` (padding and a surface), `yetiBorder`. Inside, the body may carry `yetiBox`. Building-blocks 1.9 has composed items written beside each other.
- Shared input names (building-blocks 1.4, shared vocabularies; ticket 26 grilling question 16): `width` is `YetiWidth` on `sidebar`, `scroller`, `shell`, and `demo`; `max` is `YetiWidth` on `breakout`, `center`, and `dialog`; `ratio` is `YetiRatio` on `frame`, `hero`, and `card`; `gap` is `YetiGap` on every item that has it; `align` is `YetiAlign` wherever the vocabulary is `align`; `side` is `YetiSide` on `sidebar`, `hero`, `dropdown`, and `enter` (ticket 26 rows 8, 12, 30, 53, 56, 57, 72, 74, 85, 101, 110, 114, 115, 163). So no two package directives on one element declare one input name with different types. Where two directives on one element share an input name, one static attribute or one binding feeds both and both render the one `data-*` attribute, which is what Yeti's single attribute means (ADR 0070, considered options on defaults).
- The case that matters is `side` with `enter`: `<div yetiMedia yetiEnter="slide" side="end">` puts the figure at the end and makes the row slide in from the end edge, from one `data-side="end"` ([enter](enter.md) user story 21 and Further Notes). `enter`'s own default is `start` and the recipe's is none, and neither directive writes its default, so an unset `side` renders nothing for both (ticket 26 grilling question 3; ADR 0070 rule 1). A consumer who wants the slide to come from a side other than the figure's puts `yetiEnter` on a wrapper around the `media`, not on the `media` itself (usage rule 7).
- The only other injection is the root styles service of ADR 0060, through `injectYetiItemStyles('media')` from `ngx-yeti/styles` as the last statement of `YetiMedia`'s constructor, after anything there that can throw ([setup](setup.md); [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 42 and 45). It acquires the item file on the server too and releases it through `DestroyRef`. That service is the [setup](setup.md) spec's and ADR 0060's.
- Generated ids and the platform's relationship attributes: none. The recipe renders no `id` and references none, so it does not use [generated-ids](generated-ids.md).

### 4. API

| Member | `YetiMedia` |
| --- | --- |
| Class name | checked at the Pin: `yeti.d.ts` exports 46 names and `YetiMedia` is not among them, so the class takes `Yeti`, not `NgxYeti` (ADR 0080 point 4 and its 2026-10-03 note) |
| Selector | `[yetiMedia]` |
| `exportAs` | `yetiMedia` |
| Entry point | `ngx-yeti/media` (building-blocks 1.3; ADR 0011 clause 10) |
| Inputs | `width: YetiWidth \| undefined` (Yeti default `xs`); `ratio: YetiRatio \| undefined` (Yeti default `1/1`); `gap: YetiGap \| undefined` (Yeti default `md`); `align: YetiAlign \| undefined` (Yeti default `stretch`); `max: YetiWidth \| undefined` (no Yeti default: no cap); `side: YetiSide \| undefined` (no Yeti default: the source order) |
| Host | static `class: 'media'`; static `data-ngx-yeti-item-media: ''`; `[attr.data-width]`, `[attr.data-ratio]`, `[attr.data-gap]`, `[attr.data-align]`, `[attr.data-max]`, and `[attr.data-side]` from the inputs, `null` when unset; `'[attr.align]': 'null'` |
| Providers | none |
| Models, outputs, methods | none |
| Lifecycle | its constructor ends with `injectYetiItemStyles('media')` from `ngx-yeti/styles`, which acquires the `media` item file, on the server too, and releases it through `DestroyRef` (ADR 0060 point 2; building-blocks 1.9; [setup](setup.md); ticket 50 decisions 42 and 45) |

Types come from the generated `yeti-types.ts` copy of Yeti's typings at the pin, re-exported by name (ADR 0060 point 10; building-blocks 1.3). The selector and inputs are the ones Part 2 row 19 and ticket 26 name.

**Usage rules** (numbered here and in the directive's JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiMedia` on an element with exactly two element children: the figure and the body (manifest `children`, min 2, max 2). `@if`, `@for`, and `ng-container` add no element; a branch that removes one child leaves a `media` the recipe cannot read.
2. The figure is an `img`, a `video`, or a `picture`, or an element whose direct child is one (a link around an avatar, a `figure` with a `figcaption`). A component's host element counts as the wrapper when its template renders the picture as the host's direct child: `<app-avatar>` rendering `<img>` works; one rendering `<span><img></span>` does not (`media.css`'s `:has(> :is(img, video, picture))`).
3. The body must not hold an `img`, `video`, or `picture` as a direct child, or it is taken for a second figure (manifest `children`). Wrap a picture inside the body in a paragraph or another element.
4. Put the figure first in the source when it should be read first, and last when it should be read after the text. `side` changes only where the figure is drawn while side by side, not where it is read or focused (manifest `a11y.notes`; `docs.md`; section 7, 1.3.2 and 2.4.3; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 81).
5. The figure is cropped to `ratio`, so its `alt` text describes what the crop shows; give a decorative figure `alt=""` (manifest `a11y.notes`).
6. With `NgOptimizedImage`, give a figure that is the `img` itself `width` and `height` from the image file and never `fill`: `fill` positions the image absolutely (`NGP/common/src/directives/ng_optimized_image/ng_optimized_image.ts:260-263`), which takes it out of the flex row. Where the image's own ratio differs from `ratio`, expect Angular's development-mode distortion warning, which compares the rendered and intrinsic ratios and does not read `object-fit` (`ng_optimized_image.ts:1103-1123`). A wrapped figure may use `fill` with `position: relative` on the wrapper in the consumer's own stylesheet, as the [frame](frame.md) spec's usage rule 6 has it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 35). The `img` inside an art-directed `<picture>` stays a plain `img` (building-blocks 1.2). Ticket 50 decision 80.
7. One `side` feeds every package directive on the element that declares it. With `yetiEnter` on the same element, the slide comes from the figure's side; to slide from another side, put `yetiEnter` on a wrapper (ticket 26 grilling question 3; [enter](enter.md) section 3).
8. Do not put `yetiFrame` or `yetiStack` on the media's own children. The recipe already crops the figure and spaces the body, and its rules outrank those layouts' rules on the same element (`.media > :not(...)` against `.stack`, read in the CSS, not measured), while their private properties meet on one element with results Yeti does not document. When you need a layout's own knobs, write the composed form, `yetiSidebar` holding a `yetiFrame` and a `yetiStack` (`docs.md`, "Built from primitives"). `yetiBox` on the body is fine: it only pads it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 82).
9. A `center` that is a `media`'s child loses its auto margins, because `.media > *` sets `margin: 0` at the same specificity as `.center` and `media.css` comes after `center.css` in Yeti's order (`Y/src/yeti.css:30`, `:37`). That is Yeti's own result, and ADR 0060 point 3's insertion in Yeti's order keeps it the same whichever loads first; put the `center` inside the body instead.
10. A `video` figure takes `<source>` children rather than a `src` attribute, as the [frame](frame.md) spec has it, because hydration writes static attributes again ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 36).
11. Do not write `class="media"`, any of the six `data-*` attributes, or `data-ngx-yeti-item-media` statically. The directive binds them, and hydration writes a static attribute again before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"; ADR 0070 consequences). A value newer than the pin goes through `[width]="$any('3xl')"` (ADR 0070). Writing `align` statically is allowed (ticket 50 decision 9).
12. Bind every input from values that are the same on the server and the client, never from a browser-only read such as the window's width; the stack point already follows the container in CSS (building-blocks 1.7), and the hydration constraints require the same DOM on both sides.
13. Import `YetiMedia` wherever the template writes it. A **Forgotten import** with static inputs renders two plain blocks with no error; only a bound input (`[width]`) or the template reference makes the compiler report it (NG8002, NG8003) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `media` | Nearest in Angular Material |
| --- | --- | --- |
| Shape | an item directive on the consumer's element; the two children carry nothing | content-projection slots: `matListItemAvatar` on a list item's picture (`NC/src/material/list/list-item-sections.ts:86-89`), `mat-card-avatar` and `mat-card-sm-image` beside a card's title group (`NC/src/material/card/card.ts:195`, `:231-234`; `card-title-group.html:8`) |
| Where it applies | any element, any content | inside a `mat-list-item` or a `mat-card` only |
| Figure size and crop | `width` and `ratio` from Yeti's vocabularies; `object-fit: cover` | fixed sizes in the component's styles; the consumer's CSS otherwise |
| Stacking | intrinsic: the two stack when the body would fall below half the row | none; the slots stay side by side |
| Order | source order, with `side` for the visual side | fixed slot positions |
| Accessibility | none of its own | none of its own: the avatar slots are presentational, and the image's `alt` is the consumer's |

Nothing is taken from Material. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one; it shows that Material ties the shape to a list or a card, while Yeti's recipe goes on any element.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 19; building-blocks 1.2). The reason, row 1's, which row 19 takes: Yeti's CSS does the whole job; the directive adds the class, the typed attributes, the item file acquisition, and `exportAs`. Flexbox `gap`, `aspect-ratio`, `object-fit`, and `:has()` (the manifest's unguarded list) are inside Baseline 2025 (building-blocks 1.2; [Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md), which names the `media` recipe among the `:has()` users that break only in Firefox 119 and 120, outside the target). No Aria pattern applies (the recipe has no role), and no CDK piece is used: there is no id, focus, keyboard, observer, or direction read (`row-reverse` and `justify-content` follow the writing direction by themselves).

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The recipe adds no role, state, or property, and no tab stop.
- **Keyboard:** none.
- **Names:** none. The host's semantics are the consumer's (an `article` for a comment, an `li` in a `role="list"` list). The figure's name is its `alt`, the consumer's (usage rule 5).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.1.1 Non-text Content | The figure's `alt` is the consumer's. Because the figure is cropped, usage rule 5 asks for `alt` text that describes the visible crop, as the manifest's note does. Every story's figure has `alt`, and the **Story gate** runs axe's `image-alt` rule. |
| 1.3.1 Info and Relationships | The elements are the consumer's; the directive adds no role. A `figure` with a `figcaption` keeps its native relationship: the caption is moved below the picture by CSS, not out of the `figure`. |
| 1.3.2 Meaningful Sequence | Stacked, the source order holds (manifest). Side by side, `side` may draw the figure on the other side by `row-reverse`, while the accessibility tree and reading order stay the source order: "data-side changes where the figure sits, not where it is read" (manifest `a11y.notes`). With two children, a figure and a body, the visual side of the figure does not change the meaning of the text, so the sequence stays meaningful when the author follows usage rule 4 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 81). Test layer 1 asserts that the accessibility tree order equals the DOM order with and without `side`. |
| 1.4.3 Contrast (Minimum) | axe left `color-contrast` incomplete on Yeti's example heading in Chromium and Firefox (ticket 17). The play function computes the ratio of the heading, the body paragraph, and a `figcaption` from computed colours with the exact WCAG formula, unrounded, in the light and dark schemes, each against its effective background (the nearest ancestor with an opaque background colour), and asserts at least 4.5:1 ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 3; A11Y-10d; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 8). The caption is small muted text, so it is the closest to the threshold. A package rule is added only if an assertion fails (A11Y-10a's "package rule only if it fails"). |
| 1.4.4 Resize Text | The figure's width comes from the width scale in `rem`, and the body grows with its text; zoomed text stacks the two sooner rather than clipping (read, not measured). |
| 1.4.10 Reflow | The two stack when the body would fall below half the row, with no breakpoint; the default figure width is `16rem` (256 CSS px), under 320. Test layer 4 asserts no horizontal overflow at a 320 px viewport for the default story and for `width="lg"`, where the figure shrinks with the row (`flex-shrink` stays at its initial 1). Content wider than the body is the consumer's. |
| 1.4.12 Text Spacing | The body sets no height and no overflow; only the figure clips, and it holds no text except a caption, which sits outside the cropped picture (`media.css`, the `figure:has(> figcaption)` rules). Overridden spacing grows the body (read). |
| 2.4.3 Focus Order | Focusable content keeps DOM order. A focusable figure (a link around an avatar) drawn at the end by `side="end"` is still focused first when it comes first in the source. With one figure and one body, the order still preserves meaning and operation, and usage rule 4 asks the author to put the figure where it is read ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 81). |

**Ledger rows owned:** A11Y-10d only ([ledger.md](../ledger.md); Part 2 row 19). This spec confirms its **What the package adds** column as written ("As A11Y-10a": a play-function assertion with the exact formula; a package rule only if it fails). Its **What Yeti does** column read "as A11Y-10b" (text over an image, the author's responsibility), which did not describe the `media`: its text sits beside the picture, never over it, and axe's incomplete result names the example's heading. The cell now reads like A11Y-10c's and A11Y-10e's after [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 23 and 24: text beside a cropped picture on the page surface, with axe's incomplete `color-contrast` result on the example's heading recorded and its cause not traced (ticket 50 decision 79). No new ledger row: the recipe adds no feature Yeti lacks.

### 8. Rendered HTML

Consumer markup, after Yeti's example and docs:

```html
<article yetiMedia width="sm" max="md">
  <img ngSrc="ada.jpg" width="600" height="600" alt="Portrait of Ada Lovelace" />
  <div>
    <h3 i18n>Ada Lovelace</h3>
    <p i18n>Wrote the first published algorithm, for Babbage's Analytical Engine.</p>
  </div>
</article>
```

and a captioned figure drawn at the end, beside an arriving row:

```html
<div yetiMedia yetiEnter="slide" side="end" ratio="4/3" align="start">
  <figure>
    <img ngSrc="hills.jpg" width="800" height="600" alt="A ridge path above the clouds" />
    <figcaption>A view worth the early start.</figcaption>
  </figure>
  <div yetiBox surface="raised">
    <h3>Weekend in the hills</h3>
    <p>Six miles, one summit.</p>
  </div>
</div>
```

Server HTML and the hydrated DOM are the same. The `article` carries `yetimedia=""`, `width="sm"` (inert), `max="md"` (inert), `class="media"`, `data-ngx-yeti-item-media=""`, `data-width="sm"`, and `data-max="md"`, and no `data-ratio`, `data-gap`, `data-align`, `data-side`, or `align`. The `img` carries `NgOptimizedImage`'s own attributes. The second host carries `class="media enter"`, `data-ngx-yeti-item-media=""`, `data-ngx-yeti-item-enter=""`, `data-enter="slide"`, one `data-side="end"`, `data-ratio="4/3"`, and `data-align="start"`, and no `align` attribute (removed); its body carries the box's class and attributes.

The server also writes one item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>recipes/media/media.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="media"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The link is keyed by the item name, not by the last segment of its URL, so it is never confused with Yeti's always-loaded `base/media.css` (ADR 0060, considered options, on Angular's external styles). The client adopts that link at bootstrap. The recipe has no open or closed state.

The delta from Yeti's docs markup: the consumer writes `yetiMedia` where the docs write `class="media"` and the input names where they write each `data-*` attribute. The children are written as Yeti writes them.

### 9. Animation

None of its own. The recipe has no state and no transition, and Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). A consumer who wants the row to arrive writes `yetiEnter` beside `yetiMedia` (section 3; usage rule 7), and the `enter` spec owns that motion. A consumer may remove a `media` with a class-form `animate.leave`; the item link stays until Angular removes the host, because removal waits for the DOM (ADR 0060 point 4). A `media` that is server-rendered never takes `animate.enter` (ADR 0011 clause 12). An input changed at run time moves the layout at once, as Yeti's CSS has it.

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes, the removed `align`, and the item link in `<head>` (section 8). Everything at first paint is a host binding (ADR 0011 clause 1). Nothing is **Pre-hydration state**: no person and no Yeti module can change a `data-*` attribute (ticket 26 grilling question 12). The row, the crop, the stack point, and the side are CSS and apply before any script.
- **Before hydration:** the directive creates no node, reads no layout, starts no timer or observer, and touches no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is the item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** every element is claimed as is; bindings computed from the same inputs give the same values (usage rule 12); 0 style mutations (ADR 0060 point 5, measured for the mechanism).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the `media` and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism). With no part directive, a `media` cannot be split across **Hydration boundaries**; a deferred block inside it must render its whole child, because a block's content that adds or removes a child breaks usage rule 1.
- **`hydrate never`:** the `media` is its server HTML and stays styled while its host is connected, whatever live `media` hosts do (ADR 0060 point 4; ADR 0045). There is no Angular behaviour to lose; a bound input never changes.
- **Client-only `@defer`:** the item file is fetched when `YetiMedia` is constructed, which can show unstyled frames (the two children stacked and the picture uncropped); the consumer closes the gap with `provideYetiStyles({ preload: ['media'] })` (ADR 0060 point 6; [setup](setup.md)). With `yetiEnter` on the same element, the `enter` file must be present before insertion too, so both go in the preload list ([enter](enter.md) section 11).
- **Event replay:** the directive declares no listener, so nothing replays and it adds no `jsaction`.
- **`withI18nSupport()`:** body text and `alt` text are translated with `i18n` and `i18n-alt` in the consumer's component. The directive adds no `i18n` block; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** inputs are signals and host bindings read them, so any bound input refreshes with no zone (map, Standing rulings, item 43; ADR 0070 rule 4).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the figure and the body sit side by side or stack, cropped and capped as bound, because the attributes and the item link are in the server HTML. Nothing is lost: the recipe has no behaviour. An `NgOptimizedImage` figure renders its server `src` and `srcset`. A client-only application gets no such promise.

### 11. Hydration constraints

The recipe complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; every `data-*` attribute comes from an input whose value usage rule 12 keeps equal on both sides; `[attr.align]` is always `null`.
- **No direct DOM manipulation:** the directive writes nothing to the DOM outside host bindings. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directive changes no element. The consumer's markup must be valid as written: a `figcaption` is the first or last child of its `figure`, and a body inside an `a` host holds no interactive content.
- **`preserveWhitespaces`:** the directive has no template. Whitespace text between the two children is not a flex item.
- **No output branched on the platform:** none.
- **Static attributes the directive binds:** usage rule 11 keeps the consumer from writing the `data-*` attributes. The static forms of `width`, `ratio`, `gap`, `max`, and `side` are the inputs' own and stay on the element unchanged on both sides. The static form of `align` is the one static attribute the directive also binds (to `null`); hydration writes it back and the binding removes it again in the same pass, so the final DOM equals the server's. This form is allowed by [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 9, and Test layer 4 asserts that no frame paints with `align` present.
- **Embedded pictures:** a `video` figure takes `<source>` children (usage rule 10), so hydration's rewrite of static attributes does not touch its source.

### 12. Single-page application

None. The recipe has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). On a route change, a route's `media` hosts leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-media]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders one again re-inserts it in Yeti's order.

### 13. Item file

`yeti-css/css/recipes/media/media.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiMedia]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:37`, after every layout file and before `hero.css`, through the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-media` has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds every `media` value rule and the tokens), and optionally `provideYetiStyles({ preload: ['media'] })`. The recipe adds nothing to it. Cross-item files acquired: none. `media.css` has no rule for another item, and the composed form's `sidebar`, `frame`, and `stack` files are not needed by the one-class form (`docs.md`: "a project that prefers the composed form can leave `css/recipes/media/media.css` out of a hand-built bundle"; ADR 0060 point 9).

One order matters inside `yeti.layouts`: `.media > *` sets `margin: 0` and `.center` sets `margin-inline: auto` at equal specificity, and `media.css` comes after `center.css`, so a `center` that is a `media`'s child is not centred in full Yeti either (usage rule 9). ADR 0060 point 3 inserts links in Yeti's order whichever directive is created first, so the package's result equals full Yeti's in both load orders (read in `yeti.css`, not measured). Test layer 4 asserts it.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attributes in the DOM, the item link, where the figure and the body land, the crop, the reading order, and contrast ratios. It never asserts a private field or how the styles service counts. No test depends on a public token's default value ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): where a test needs a width or a gap, it reads the token's computed value in the same page, as Yeti's own `test/browser/recipes/media.spec.js` does with its `token()` helper (`--yeti-width-xs`, `--yeti-width-md`, `--yeti-space-md`). Every test runs zoneless (map, Standing rulings, item 43). The four test layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Test layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `media` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Every figure is an `NgOptimizedImage` with `width` and `height` from the image file (usage rule 6), except the `picture` case. Story ids:

- `media--default`: Yeti's example with a heading and a paragraph, plus a third row whose figure is a `figure` with a `figcaption`, each `media` in a resizable container set to 60rem. Asserts `class="media"` and `data-ngx-yeti-item-media` on the host, no `data-*` attribute of Yeti's from the package, and no `tabindex` or role added. Asserts the figure's width is within 2 px of the computed `--yeti-width-xs` and its ratio is 1 (Yeti's case), the body is to the figure's inline-end side, every child's computed margins are 0, and the accessibility tree order equals the DOM order. Asserts the WCAG contrast ratio of the heading, the paragraph, and the caption, each against its effective background, with the exact formula, unrounded, at least 4.5:1, in the light and dark schemes (A11Y-10d; ticket 50 decision 8).
- `media--settings`: every input bound from Storybook controls. Asserts each attribute follows its control and that clearing a control removes the attribute.
- `media--side`: four rows: figure first, figure last, figure first with `side="end"`, and figure last with `side="start"`, in a 60rem container. Asserts the figure's inline position for each (Yeti's "data-side overrides the side" case), that each host's accessibility tree order equals its DOM order, and that a focusable figure link in the third row comes first in the Tab sequence. Then sets the container to 18.75rem (300 px) and asserts the source order holds when stacked.
- `media--cap`: `max="md"` beside the default at 60rem. Asserts the capped body's width is within 1 px of the computed `--yeti-width-md` and the figure takes the rest of the row less the gap (Yeti's case).
- `media--composed`: Yeti's example as `yetiMedia` and, below it, the same content as `yetiSidebar width="xs"` holding a `yetiFrame ratio="1/1"` and a `yetiStack gap="sm"` (Yeti's fixture pair). Asserts both hosts carry their own class and presence attribute, and that the two forms' figures and bodies have the same size relative to their rows. Test layer 4 repeats the comparison at two widths in three engines.
- `media--figures`: a wrapped `picture` inside a `div`, a `figure` with a caption, and an `a` around an avatar `img`. Asserts the inner `img` fills its wrapper, the caption sits below the picture and the picture keeps the ratio, and the link is the figure (Yeti's cases).

### Test layer 2: browser-level (`npx nx test <lib>`, `media.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiMedia, { tagName: 'article' })`: the host has class `media` and `data-ngx-yeti-item-media`, and none of the six `data-*` attributes; with `bindings` setting each input (`width` `'sm'`, `ratio` `'16/9'`, `gap` `'sm-lg'`, `align` `'start'`, `max` `'md'`, `side` `'end'`), each attribute follows, and setting them back to `undefined` removes them; the host never has an `align` attribute.
- While a `YetiMedia` fixture lives, one `<link data-ngx-yeti-styles="media">` is in `document.head`, with an `href` ending `recipes/media/media.css?v=<pin>`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- The directive adds no listener to its host.

A small test host covers what `createDirective` cannot: the template reference `#m="yetiMedia"` resolves; a static `width="sm"` and `max="md"` render both the HTML attribute and the `data-*` form (the `inert` kind); a static `align="center"` renders `data-align="center"` and no `align` attribute, and the body's computed `text-align` is `start` (the `removed` kind); `yetiMedia` beside `NgxYetiEnter` with one static `side="end"` renders one `data-side="end"` and both presence attributes, and with `side` unset renders no `data-side`; and the consumer's own `class` and `role` on the host are kept.

### Test layer 3: node-level and SSR smoke (`npx nx test <lib>`, `media.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture whose body text carries `i18n` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the host renders `class="media"`, `data-ngx-yeti-item-media`, and `data-width="sm"` from a bound input; a host written with static `align="center"` renders `data-align="center"` and no `align` attribute (building-blocks 1.4: the static form is written and the attribute asserted absent); `<head>` holds one item link with `data-ngx-yeti-styles="media"`, `data-beasties-skip`, and an `href` ending `recipes/media/media.css?v=<pin>`, and no other link whose `data-ngx-yeti-styles` names `media`; no element carries a `jsaction` from the package.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the recipe through the contract mapping: class `media` has `YetiMedia`; `data-width`, `data-ratio`, `data-gap`, `data-align`, `data-max`, and `data-side` have inputs whose types are the manifest's vocabularies; the manifest declares no marker and no event for `media`. A pin move that adds an attribute fails here before any story does.

### Test layer 4: Playwright e2e (three engines in CI)

Storybook half, on the Test layer 1 story ids: the geometry of Yeti's own `media.spec.js` cases. On `media--composed`, the one-class form matches the composed form of the package's own directives side by side at 1000 px and stacked at 400 px: the figures' and bodies' boxes are the same relative to their rows. Also: the figure is found wherever it sits, `side` moves the figure in the row only, the fill reaches an `img` inside a `picture` inside a wrapper, the caption sits below the image, `max` caps the body and `width` still sets the stack point, a reversed `media` keeps a narrow stacked child at the start edge, children have no margins, and `side` follows the writing direction inside `dir="rtl"`. At a 320 px viewport the default story and a `width="lg"` row have no horizontal overflow (1.4.10).

Fixture-app half, built with `outputMode: 'server'`, with a `/media` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences):

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- with JavaScript disabled the figure and body land as in the Storybook half, cropped and capped, and `@axe-core/playwright` with the six tags reports no violation;
- a `media` inside a client-only `@defer` block with `media` in the preload list shows no unstyled frame; a `media` inside a `hydrate never` block stays styled after a live `media` on the page is removed;
- a `media` written with static `align="center"`: no frame paints with an `align` attribute on it, from the first paint through hydration, and its body text stays start-aligned (ticket 50 decision 9);
- the order with `center`: on a route whose `center` renders first and whose `media`, holding a `center` child, renders later inside a client-only `@defer`, the inner center's inline size and position equal those of the same markup with both files loaded at first paint (usage rule 9; ADR 0060 point 3);
- a `video` figure with `<source>` children counts one load across hydration (usage rule 10; ticket 50 decision 36);
- navigating from the `media` route to a route without one removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` for the default story, its `test/browser/recipes/media.spec.js` and `test/browser/fixtures/recipes/media.html` for the geometry cases and the composed-form comparison; the [frame](frame.md) spec's `frame--optimized-image` story for `NgOptimizedImage`; the [lede](lede.md) and [breakout](breakout.md) specs' contrast assertions for A11Y-10d; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link.

## Out of Scope

- A part directive for the figure or the body, or a marker for either (Yeti declares none; building-blocks 1.1).
- An input per token, including the body's gap and the caption's size and colour (ADR 0004).
- A `side` input that sets only the figure's side when `yetiEnter` sits on the same element (one Yeti attribute, one value; ticket 26 grilling question 3).
- Any check of the child count, of a picture as a direct child of the body, or of a figure the recipe cannot find. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- Wrapping `NgOptimizedImage`, or a package style for an image in `fill` mode.
- A role written by the package, or any reordering of the DOM to follow `side`.
- A viewport-keyed input or any JavaScript size read (building-blocks 1.7).
- Package CSS for the recipe, unless an A11Y-10d contrast assertion fails.
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiMedia]` with `width`, `ratio`, `gap`, `align`, `max`, `side`; no part directive | building-blocks Part 2 row 19 and 1.1; ticket 26 rows 78 to 83 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by Yeti's vocabulary types; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2; building-blocks 1.4 |
| `align` is `removed`, unconditionally; `width` and `max` are `inert` | building-blocks 1.4; ticket 26 rows 78, 81, and 82 and grilling question 15; ADR 0070 consequences |
| Static `align` allowed; the `null` binding removes it in the hydration pass | ticket 50 decision 9 |
| `side` shared with `enter` on one element: one value, one attribute, no default | ticket 26 grilling questions 3 and 16; ADR 0070, considered options; building-blocks 1.4 |
| No injection token, no host directives | building-blocks 1.9; Part 2, "Two findings that hold across the matrix" |
| Presence attribute `data-ngx-yeti-item-media`; item file as a counted link in Yeti's order | ADR 0045; ADR 0060 points 2 to 6 |
| `injectYetiItemStyles('media')` last in the constructor, after anything that can throw | [setup](setup.md); ticket 50 decisions 42 and 45 |
| `exportAs`; class name with no collision | building-blocks 1.3; ADR 0080 point 4 and its 2026-10-03 note |
| Entry point `ngx-yeti/media` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 19 and "Types only" with its note (ticket 50 decision 18) |
| Tokens are the consumer's | ADR 0004 |
| Contrast asserted in the play function, 4.5:1 for text, light and dark | ADR 0015 point 3; ledger A11Y-10d; ticket 50 decision 8 |
| `side` and reading and focus order: a usage rule, no ledger row | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 81 |
| `NgOptimizedImage`: `width` and `height` on a direct `img`, `fill` only in a wrapper | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 80; the wrapper form from ticket 50 decision 35 |
| No `yetiFrame` or `yetiStack` on the media's own children | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 82 |
| A `video` figure takes `<source>` children | ticket 50 decision 36 |
| Usage rules stated now, checked in a later milestone | map, Milestones |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A comment list with avatars, each row a `media`:

```html
<ol role="list" yetiStack gap="lg">
  @for (comment of comments(); track comment.id) {
    <li yetiMedia width="2xs" align="start">
      <img [ngSrc]="comment.avatar" width="96" height="96" alt="" />
      <div>
        <p><strong>{{ comment.author }}</strong></p>
        <p>{{ comment.text }}</p>
      </div>
    </li>
  }
</ol>
```

```ts
import { NgOptimizedImage } from '@angular/common';
import { YetiMedia } from 'ngx-yeti/media';
import { YetiStack } from 'ngx-yeti/stack';

@Component({
  selector: 'app-comments',
  imports: [NgOptimizedImage, YetiMedia, YetiStack],
  templateUrl: './comments.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Comments {
  readonly comments = input.required<readonly Comment[]>();
}
```

The avatar's `alt` is empty because the author's name follows it in the body, so the picture adds nothing a reader needs (usage rule 5).

A product row whose thumbnail links to the product, kept beside its text down to a phone and capped on a wide screen:

```html
<article yetiMedia width="2xs" max="md" gap="sm">
  <a [routerLink]="['/products', product.id]">
    <img [ngSrc]="product.thumbnail" width="400" height="400" [alt]="product.name" />
  </a>
  <div>
    <h3>{{ product.name }}</h3>
    <p>{{ product.summary }}</p>
  </div>
</article>
```

A speakers page that alternates the picture's side without changing the source, so every speaker is read picture first:

```html
@for (speaker of speakers(); track speaker.id; let odd = $odd) {
  <section yetiMedia width="xs" [side]="odd ? 'end' : 'start'">
    <img [ngSrc]="speaker.photo" width="600" height="600" [alt]="speaker.photoAlt" />
    <div>
      <h2>{{ speaker.name }}</h2>
      <p>{{ speaker.bio }}</p>
    </div>
  </section>
}
```

A page whose `media` renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['media'] })`.

When a part of the recipe must change beyond its six attributes, the composed form from the three layouts' own directives:

```html
<div yetiSidebar width="sm">
  <div yetiFrame ratio="1/1">
    <img ngSrc="ada.jpg" width="600" height="600" alt="Portrait of Ada Lovelace" />
  </div>
  <div yetiStack gap="sm">
    <h3>Ada Lovelace</h3>
    <p>Wrote the first published algorithm, for Babbage's Analytical Engine.</p>
  </div>
</div>
```

Here `side` belongs to the [sidebar](sidebar.md) and picks which child is the sidebar, not where the figure is drawn (`docs.md`, "Built from primitives").

### Styles

Per building-blocks 1.13:

1. **Item file:** `recipes/media/media.css`, loaded by `YetiMedia` as a counted link in Yeti's order (section 13). The consumer writes nothing for the recipe beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps every `data-width`, `data-max`, `data-ratio`, `data-gap`, and `data-align` value to its private property (section 1); `tokens/space.css` declares the width and space scales; `tokens/type.css` and `tokens/color.css` declare the caption's size and colour; `base/reset.css` makes an `img`, `picture`, or `video` a block with `block-size: auto`, which lets the figure's `aspect-ratio` win over an `NgOptimizedImage`'s `height` attribute; `base/media.css` styles a `figcaption` outside a `media` too.
3. **Cross-item rules:** none in `media.css`. The tie with `center` is settled by ADR 0060 point 3's order and leaves Yeti's own result (section 13; usage rule 9). Items composed on the recipe (`enter`, `box`, `border`) load their own files through their own directives.
4. **Tokens:** reads `--yeti-width-xs`, `--yeti-space-md`, `--yeti-space-sm`, `--yeti-text-sm`, and `--yeti-color-text-muted`, and through its values any width or space token named; writes none (section 2).
5. **What breaks without the item file:** the figure and the body stack as plain blocks at every width, the picture is shown whole and uncropped at its own ratio, `width`, `max`, `ratio`, `align`, and `side` do nothing, the children keep their own margins, and nothing errors.
6. **Tailwind name collision:** none. Tailwind generates no `media` class; of Yeti's names it generated only `container`, `grid`, `table`, and `hidden` ([Prototype: the package beside Tailwind v4 in one Angular application](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md)). The consumer still uses the shared layer statement of ADR 0060 point 7.

### Platform features to adopt when the browser target moves

None. Every feature the recipe's rules use is inside Baseline 2025 (building-blocks 1.2): flexbox `gap`, `aspect-ratio`, `object-fit`, and `:has()`, which the manifest lists as unguarded, and `row-reverse` with logical alignment, which it does not list.

### Single-page-application pieces relied on

None: the recipe uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
