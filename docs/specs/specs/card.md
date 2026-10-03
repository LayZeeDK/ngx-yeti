# Spec: card (component)

Ticket: [78. Spec: card (component)](../issues/78-spec-card.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 28 and Part 1, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 99 to 103 and grilling questions 6, 7, 12, 14, and 16, [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) (decisions 2, 6, 8, 10, 12, 18, and 42), [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). Evidence: [Research: Yeti against WHATWG, WAI-ARIA, the APG, and Angular Aria, CDK, and Material patterns](../research/yeti-accessibility-and-standards.md) section 4.8 (ticket 17). The item owns no [ledger.md](../ledger.md) row (Part 2 row 28). `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x); `NGP/` is `github.com/angular/angular/packages/` at 22.2.x. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 118 to 120), and each is cited where it applies.

## Problem Statement

Yeti's `card` is "a bordered surface for one thing: an optional figure that bleeds to the edges, a body, and a footer that sits at the bottom; a row with the picture beside the text once the card's content reaches the md width" (`Y/src/components/card/manifest.json`). It is one **Identity class**, `card`, on an `article` or an `li`. Four **Attributes** configure it: `data-variant` (a tinted border with a bar along the top), `data-threshold` (the card's own width from which a picture sits beside the text), `data-ratio` (the picture's crop while it sits on top), and `data-raised` (a shadow instead of a border). One **Marker**, `data-stretch`, goes on one link inside the card and stretches it over the whole card, so the card is clickable while the link keeps its own name. The item has no **Module** and no events (`js: null`).

An application developer using the package cannot write `class="card"`, any of those attributes, or `data-stretch`: a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). Written by hand, `data-threshold="medium"` or `data-ratio="16:9"` compiles and silently falls back to Yeti's default; here it must fail to compile ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `card` **Item file** loaded while a card is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it a card is plain flow content with no border, no bleed, no footer at the bottom, and a stretched link that stretches over nothing, with no error.

The card is the one component item whose accessibility rests on how the consumer writes a link. Yeti's manifest says, "Never wrap a card in a link: the whole card's text would become the link's name. Put the link on the heading and give it data-stretch so the card is clickable and the link is named by the heading" (`a11y.notes`). Its docs add that a footer that repeats the link gets `tabindex="-1"`, so a keyboard user meets the destination once, and that a card in a list is an `li` "so the list is announced with its count" (`Y/src/components/card/docs.md`, Accessibility). None of this is something a directive can read or enforce, so the package must state it, show it in every example, and test it. And Yeti puts the card on one element with another item, `.card.lift` (`Y/src/utilities/lift/example.html`), which is the case [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md) was written for.

## Solution

Two directives in the secondary entry point `ngx-yeti/card` ([building-blocks.md](../building-blocks.md) Part 2 row 28; 1.3):

- **`YetiCard`**, the **Item directive**, on `[yetiCard]`, `exportAs: 'yetiCard'`. It binds `card` as a static host class, and binds `data-variant`, `data-threshold`, `data-ratio`, and `data-raised` from the typed inputs `variant` (`YetiVariant`), `threshold` (`YetiWidth`), `ratio` (`YetiRatio`), and `raised` (`boolean`). It sets the static presence attribute `data-ngx-yeti-item-card` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), and acquires the `card` item file through `injectYetiItemStyles('card')` as the last statement of its constructor, on the server too, releasing it when it is destroyed ([setup](setup.md); ADR 0060 point 2; ticket 50 decision 42). It provides `yetiCardToken`.
- **`YetiCardLink`**, a **Part directive** for the link that stretches, on `a[yetiCardLink]`, `exportAs: 'yetiCardLink'`. It binds `data-stretch` from a `stretch` input with `booleanAttribute` (ticket 26 row 103, kind C). It sets no presence attribute and acquires no item file (ticket 50 decision 6).

The developer writes `<article yetiCard threshold="xs">` where Yeti's docs write `<article class="card" data-threshold="xs">`, and `<a yetiCardLink stretch routerLink="/hills">` where they write `<a href="/hills" data-stretch>`. An unset input renders no attribute, so Yeti's own defaults (`md` for the threshold, `16/9` for the ratio, no variant, a border rather than a shadow) apply from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1).

Everything else is Yeti's CSS and the platform. Both directives are **types only**: no listener, no render callback, no service of their own, and no DI beyond the part's optional parent token and the styles helper (building-blocks Part 2, "Types only", with ticket 50 decision 18). The bleed, the crop, the footer at the bottom, the switch to a row (a container query on the card's own width), and the stretched link (a pseudo-element of the link) are CSS, so all of them are right on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block. The whole-card link pattern is the consumer's markup; the spec states it as usage rules, shows it in every example, and asserts the link's accessible name and the single Tab stop in the play functions.

## User Stories

1. As an application developer, I want to turn an `article` or an `li` into a card with one directive attribute, so that I never write Yeti's `card` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="card"` and `data-*` attributes, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want a picture, video, or `figure` placed first to bleed to the card's edges, so that the card's media looks like Yeti's with no extra markup.
4. As an application developer, I want to set the picture's crop with a `ratio` input typed by Yeti's `ratio` vocabulary, so that `ratio="16:9"` fails to compile while `ratio="4/3"` works.
5. As an application developer, I want to set the card's width from which the picture moves beside the text with a `threshold` input typed by Yeti's `width` vocabulary, so that `threshold="medium"` fails to compile.
6. As an application developer, I want the switch to a row decided by the card's own width, not the screen's, so that the same card works in a sidebar and across a full page.
7. As an application developer, I want to tint the card's border with a `variant` input typed by Yeti's `variant` vocabulary, so that a warning card draws a bar along the top with the text left plain.
8. As an application developer, I want to trade the border for a shadow with a bare `raised` attribute, so that `<article yetiCard raised>` reads like Yeti's markup.
9. As an application developer, I want an input I leave unset to render no attribute, so that Yeti's own default applies and the server HTML stays Yeti's minimal markup.
10. As an application developer, I want a static attribute such as `threshold="xs"` to type-check, so that I need no property binding for a constant.
11. As an application developer, I want to bind every input from signals, so that the card follows my state under zoneless change detection.
12. As an application developer, I want a `footer` placed last to sit at the bottom of the card, so that a row of cards of different lengths keeps its actions aligned.
13. As an application developer, I want cards in a grid with `rows` to line up their parts with their neighbours', so that headings and footers align across a row.
14. As an application developer, I want a `figure` that is a `layer` to put its caption over the picture with a scrim, so that I can caption an image without losing readability.
15. As an application developer, I want to make the whole card clickable by putting `yetiCardLink stretch` on the heading's link, so that a pointer user can click anywhere on the card.
16. As an application developer, I want the stretched link to keep the heading text as its accessible name, so that a screen-reader user hears a short, meaningful link name rather than the whole card.
17. As an application developer, I want a button or another link in the footer to still take its own click when the heading link is stretched, so that secondary actions keep working.
18. As an application developer, I want `yetiCardLink` to work with `routerLink` as well as a plain `href`, so that card links navigate inside my application.
19. As an application developer, I want to toggle `stretch` from state, so that a card becomes a whole-card link only when my UI asks it to.
20. As an application developer, I want the docs to tell me never to wrap a card in a link and to put the link on the heading instead, so that I do not give the link an over-long name or nest interactive content.
21. As an application developer, I want the docs to tell me to give a footer link that repeats the heading's destination `tabindex="-1"`, so that keyboard users do not meet the same destination twice.
22. As an application developer, I want the docs to tell me to use `article` for a card that stands alone and `li` for cards in a list, so that a list of cards is announced with its count.
23. As an application developer, I want to write `<article yetiCard yetiLift raised>`, so that a card rises on hover and focus exactly as Yeti's `.card.lift` does.
24. As an application developer, I want a card that shares its element with `lift` to keep both item files loaded while it is on the page, in every rendering mode, so that neither half loses its styles.
25. As an application developer, I want `yetiCard` beside another item's part directive on the same element (a grid child, an enter target), so that a card can be a placed child of a layout.
26. As an application developer, I want a component of mine to host the card directive, so that `<app-trail-card>` can be the card.
27. As an application developer, I want the card item file loaded when the first card renders and removed after the last leaves, so that I do not import `card.css` globally.
28. As an application developer, I want the item file in the server HTML when a server-rendered page has a card, so that the first paint is already a card.
29. As an application developer, I want a card right with JavaScript off under SSR and prerendering, so that the page reads, the picture is cropped, and the whole card follows its link before any script runs.
30. As an application developer, I want hydration to change nothing on a card or its link, so that I get no `NG05xx` error and no reflow.
31. As an application developer, I want a card inside a `@defer (hydrate on ...)` block to stay a card before and after the block hydrates, so that incremental hydration does not unstyle it.
32. As an application developer, I want a card inside a `hydrate never` block to keep its styles for as long as it is on the page, so that a dehydrated card is not unstyled when a live one elsewhere leaves.
33. As an application developer, I want to know that a card inside a client-only `@defer` block needs `card` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
34. As an application developer using `withI18nSupport()`, I want a card holding translated text to hydrate without being re-rendered, so that localised pages keep the server's DOM.
35. As an application developer, I want template references (`#c="yetiCard"`, `#l="yetiCardLink"`), so that both directives follow the package's `exportAs` rule.
36. As an application developer, I want to import both directives from `ngx-yeti/card`, so that a `@defer` block can split them with the rest of the item.
37. As an application developer, I want the input value types re-exported by name (`YetiVariant`, `YetiWidth`, `YetiRatio`), so that I can type my own signals that feed the inputs.
38. As an application developer, I want to know how to use `NgOptimizedImage` for a card's picture, so that I get Angular's image loading with the card's bleed and crop.
39. As a screen-reader user, I want a card's link to be named by the card's heading, so that a list of links is short and distinct.
40. As a screen-reader user, I want a list of cards announced as a list with its count, so that I know how many there are.
41. As a screen-reader user, I want a card's content read in source order whether the picture is on top or beside the text, so that the row form changes nothing I hear.
42. As a keyboard user, I want one Tab stop per card for its main destination, so that tabbing through a grid of cards is not twice as long as it needs to be.
43. As a keyboard user, I want a visible focus ring on the card's link, so that I can see where I am (and, with `lift`, see the whole card rise).
44. As a keyboard user, I want every other control in the card to stay reachable and operable, so that the stretched link never hides a secondary action.
45. As a pointer user, I want the whole card to be the target of its link, so that I do not have to aim at the heading text.
46. As a low-vision user, I want a card's text to meet 4.5:1 contrast on the card's surface in light and dark schemes, so that I can read it.
47. As a low-vision user, I want a card to stack its picture on top when I zoom in or its container narrows, so that I never scroll sideways to read it.
48. As a user who overrides text spacing, I want the card to grow with its text, so that my spacing settings clip nothing.
49. As a package maintainer, I want the contract check to cover the four attributes, the `stretch` marker, and every value of their vocabularies, so that a pin move that adds a value or attribute fails before release.
50. As a package maintainer, I want the SSR smoke to assert the server HTML of a card, its stretched link, and its item link, so that the first paint is proven.
51. As a package maintainer, I want the fixture app to render a card on a prerendered and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
52. As a package maintainer, I want the shared-host case of ADR 0045 tested with a card and a lift inside `hydrate never`, so that the per-item presence attribute is proven where it was decided.
53. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default fails no test for no reason.
54. As a package maintainer, I want the geometry and click tests to follow Yeti's own `card.spec.js` cases, so that the package proves the same component Yeti proves.
55. As a package maintainer, I want the class names `YetiCard` and `YetiCardLink` checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/card/manifest.json`, `card.css`, `docs.md`, and `example.html`, and in `Y/src/layouts/attributes.css`, `Y/src/tokens/components.css`, and `Y/schema/vocabulary.json`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `card`, `component`, `Content` |
| `class` | `card` |
| `attributes` | `data-variant`: enum, vocabulary `variant` (`primary`, `secondary`, `success`, `warning`, `alert`, `danger`, `neutral`, `black`, `white`), no default, "Tints the border and adds a bar along the top; the body stays plain." `data-threshold`: enum, vocabulary `width` (`2xs` to `2xl`), default `md`, "The card's own width from which the picture sits beside the text instead of on top." `data-ratio`: enum, vocabulary `ratio` (`1/1`, `4/3`, `3/2`, `16/9`, `21/9`), default `16/9`, "The picture's aspect ratio while it sits on top of the body. Past data-threshold the picture moves beside the body and fills that column, and the ratio stops applying." `data-raised`: boolean, "A shadow instead of a border." |
| `classes` | empty |
| `children` | `> *` (min 1): "A figure first if there is one, then the body, then an optional footer." `> figure` (max 1): "only the media is cropped." `> footer` (max 1): "Actions, pushed to the bottom of the card; in a grid with data-rows it takes the last row." `[data-stretch]` (max 1): "One link that is stretched over the whole card, so the card is clickable while the link keeps its own name." |
| `markers` | `data-stretch`: boolean, `on: "a"`: "Stretches the link over the whole card, so the card is clickable while the link keeps its own name." |
| `tokens` | public: `--yeti-card-radius`, `--yeti-card-padding`, `--yeti-card-gap`, `--yeti-card-border`, `--yeti-card-surface`, `--yeti-shadow-sm`, `--yeti-color-text`, `--yeti-border-width`, `--yeti-space-xs`, `--yeti-text-sm`, `--yeti-color-text-muted`, `--yeti-color-scrim`, `--yeti-space-sm`; private: `--_yeti-aspect` |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "Never wrap a card in a link: the whole card's text would become the link's name. Put the link on the heading and give it data-stretch so the card is clickable and the link is named by the heading. Use article for cards that stand alone and li for cards in a list." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: `container size queries`, `aspect-ratio`, `overflow: clip`; `guarded`: empty. The `:has()` uses in `card.css` are not declared ([upstream-bugs.md](../upstream-bugs.md) Y8; the package does nothing either way) |
| `since` | `7.0.0` |

How it works, in `@layer yeti.components` (`card.css`, read): `.card` is a `position: relative` flex column with the card's gap, padding, surface, border, radius, and `overflow: clip`. `.card > *` zeroes block margins. A picture, video, or `figure` first in the card (`> :is(img, video, picture, figure):first-child`) widens by twice the padding and pulls out by a negative margin, so it bleeds to the padding box's edges, and is cropped to `--_yeti-aspect` with `object-fit: cover`; inside a first `figure` only the media is cropped, and a `figcaption` takes the small muted style, or the scrim style when the figure is a `layer`. Only a card whose first child is media is a size container (`container-type: inline-size`), because a card that always was one "collapsed to its padding" as a cluster item (Yeti's comment and `card.spec.js`). `.card > footer` is a wrapping flex row with `margin-block-start: auto`, so it sits at the bottom of a taller card. `.card[data-raised]` makes the border transparent and adds `--yeti-shadow-sm`; `.card[data-variant]` colours the border from the private `--_yeti-variant` and makes the top border four border widths. Under `.grid[data-rows] > .card` the card becomes a subgrid of the grid's rows, the footer takes the last row, and `container-type` is turned off. Seven `@container (inline-size >= <width>)` blocks, one per `data-threshold` stop (`md` also serving the card with no attribute), put the first media absolutely at 40 % of the card's inline size and full height, and indent the rest by that column plus the gap; none applies under `.grid[data-rows]`.

The stretched link: `.card [data-stretch]::after` is an empty absolutely positioned box with `inset: 0`, so it covers the nearest positioned ancestor, which is the card, and every press on the card lands on the link. `.card :is(a, button, input, select, textarea, summary, [tabindex]):not([data-stretch])` gives every other pressable element `position: relative; z-index: 1`, so a footer button sits above the pseudo-element and takes its own click (Yeti's comment, and `card.spec.js`, "a footer button still takes the click when the heading link is stretched"). The marker's rule is a descendant selector, so the link may sit anywhere in the card, usually inside its heading.

Value rules in the **Always-loaded group**'s `layouts/attributes.css`: `[data-threshold]` sets `--_yeti-threshold` (`:163-169`; the card's container blocks match the attribute value directly, so it reads none of it), `[data-ratio]` sets `--_yeti-aspect` (`:221` onward), `[data-variant]` sets `--_yeti-variant` and its siblings (`:239-254`), and `[data-rows]` sets `--_yeti-rows` (`:304` onward), which the card's subgrid rule reads. `card.css` itself sets the ratio's default (`.card:not([data-ratio]) { --_yeti-aspect: 16 / 9; }`). `data-raised` and `data-stretch` have no value rule outside `card.css`. Component tokens default in `Y/src/tokens/components.css:17-21` (`--yeti-card-radius: var(--yeti-radius-md)`, `--yeti-card-padding: var(--yeti-space-md)`, `--yeti-card-gap: var(--yeti-space-sm)`, `--yeti-card-border: var(--yeti-color-border)`, `--yeti-card-surface: var(--yeti-color-surface-raised)`), quoted at the pin as [ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md) allows.

Attributes left to the consumer: none (ticket 26 rows 99 to 103). The elements, the heading level, `href` or `routerLink`, `role="list"` on a list of cards, and the footer link's `tabindex="-1"` are the consumer's (Part 2 row 28; ticket 17 section 4.8).

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `card` | static host class on `[yetiCard]` (`YetiCard`) | always | ADR 0003 point 1; Part 2 row 28 |
| Attribute `data-variant` | tinted border and top bar | input `variant` on `yetiCard`: `YetiVariant \| undefined`, bound `[attr.data-variant]`, `null` when unset | unset renders nothing; Yeti's plain border applies. Not an HTML attribute | ticket 26 row 99 (R) |
| Attribute `data-threshold` | the card's own width from which the picture sits beside the text | input `threshold`: `YetiWidth \| undefined`, `[attr.data-threshold]` | unset renders nothing; Yeti's `md` applies. Not an HTML attribute | ticket 26 row 100 (R) |
| Attribute `data-ratio` | the picture's crop while it sits on top | input `ratio`: `YetiRatio \| undefined`, `[attr.data-ratio]` | unset renders nothing; Yeti's `16/9` applies. Not an HTML attribute | ticket 26 row 101 (R) |
| Attribute `data-raised` | a shadow instead of a border | input `raised`: `boolean` with `booleanAttribute`, bound `[attr.data-raised]` as `''` when true and `null` when false | default `false`, renders nothing. Not an HTML attribute | ticket 26 row 102 (R); building-blocks 1.4 |
| Marker `data-stretch` (on `a`) | stretches the link over the card | input `stretch` on `a[yetiCardLink]` (`YetiCardLink`): `boolean` with `booleanAttribute`, bound `[attr.data-stretch]` as `''` when true and `null` when false | default `false`, renders nothing. Not an HTML attribute | ticket 26 row 103 (C) |
| Children `> figure`, `> footer`, media first | styled by element and position | no directive | not applicable | building-blocks 1.1 ("a child Yeti styles only by element and position gets no directive") |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Tokens `--yeti-card-radius`, `--yeti-card-padding`, `--yeti-card-gap`, `--yeti-card-border`, `--yeti-card-surface` | the card's own component tokens | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--yeti-shadow-sm`, `--yeti-color-text`, `--yeti-color-text-muted`, `--yeti-color-scrim`, `--yeti-border-width`, `--yeti-space-xs`, `--yeti-space-sm`, `--yeti-text-sm` | shared tokens the card reads | the consumer's | not applicable | ADR 0004 |
| Token `--_yeti-aspect`, and `--_yeti-variant`, `--_yeti-rows` from the value rules | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-card=""` on `[yetiCard]` only | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2; ticket 50 decision 6 |
| Injection token | not Yeti's | `yetiCardToken`, provided by `YetiCard` | not applicable | ADR 0070 kind C; building-blocks 1.9 |

No input on either directive is named like an HTML attribute (`variant`, `threshold`, `ratio`, `raised`, and `stretch` are not), so building-blocks 1.4's presentational-attribute kinds do not apply, and no static form needs a `removed` binding. A static input attribute stays on the host beside its `data-*` form, matched by no rule.

The part directive `YetiCardLink` sets no presence attribute and acquires no item file: Yeti's rule for the marker applies only under `.card`, and the root's presence attribute keeps the file loaded (ticket 50 decision 6).

The input value types are Yeti's own, from the package's generated `yeti-types.ts`, re-exported by name and never redeclared ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5; ADR 0060 point 10). Each is a full vocabulary, so no `Extract` is needed.

**Module replaced:** none. Yeti's `card` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 28, "Yeti module: none"). Foundation 6's card had none either; Yeti's migration guide maps `.card` to `card`, with "the figure bleeds on its own; `data-stretch` for a whole-card link" (`Y/src/guides/migrating.md:55`).

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The card reads the five `--yeti-card-*` tokens, `--yeti-shadow-sm` when raised, `--yeti-border-width` (four of them for the variant's bar), `--yeti-color-text` and `--yeti-color-text-muted` for its text and caption, `--yeti-color-scrim` behind a caption over a `layer` figure, `--yeti-space-xs` and `--yeti-text-sm` for the caption, and `--yeti-space-sm` for the footer's gap. Through the always-loaded value rules a `variant` reads that variant's colour tokens. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block, in a **Theme** file after Yeti (Yeti's `soft` and `sharp` themes set the card's tokens, `Y/src/themes/soft.css:13-16`, `sharp.css:16`), or on one card or section as derived tokens (`Y/src/guides/theming.md:38`; ticket 04 measured a derived token taking effect on a card). The width stops (`--yeti-width-*`) are not tokens the card's query reads: a container condition "cannot read custom properties", so each stop is a literal mirroring its token (`card.css`, the threshold comments), and a theme that changes `--yeti-width-md` does not move the card's switch. **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- `YetiCard` provides `yetiCardToken` (`InjectionToken<YetiCard>`, `useExisting`), building-blocks 1.9 and 1.3's token naming.
- `YetiCardLink` injects it with `{ optional: true, skipSelf: true }` (ADR 0070 kind C). Nothing in this milestone reads it: the marker works through Yeti's CSS alone, and the **In-item check** that would use it belongs to a later milestone (map, Milestones). A `yetiCardLink` outside a card renders `data-stretch`, which matches no rule outside `.card`, so the link stays an ordinary link. This is building-blocks 1.9's "degrades as its spec documents" case.
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"). A consumer composes by writing directives beside each other: `yetiCard` with `yetiLift` on one element as Yeti's lift example does, `yetiCard` with a grid's part directive on a card that is a placed grid child, or a card inside an element carrying `yetiEnter` as Yeti's enter example does.
- Shared input names (building-blocks 1.4, shared vocabularies; ticket 26 grilling question 16): `variant` is `YetiVariant` on every item that reads it, `threshold` is `YetiWidth` on `card`, `nav`, `pagination`, and the layouts that read it, and `ratio` is `YetiRatio` on `frame`, `hero`, and `media`. So two package directives on one element never declare one input name with different types. `yetiLift`'s input is selector-named ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) U), so `<article yetiCard yetiLift raised>` feeds `raised` to the card alone.
- The only other injection is the root styles service of ADR 0060, reached through `injectYetiItemStyles` ([setup](setup.md)).
- Generated ids and the platform's relationship attributes: none. The card renders no `id` and references none, so it does not use [generated-ids](generated-ids.md).

### 4. API

| Member | `YetiCard` | `YetiCardLink` |
| --- | --- | --- |
| Class name | not among the 46 names `yeti.d.ts` exports at the Pin (the orchestrator's check of 2026-10-03 under ADR 0080; ticket 50 decision 10), so it takes `Yeti`, not `NgxYeti` (ADR 0080 point 4) | as left |
| Selector | `[yetiCard]` (Part 2 row 28) | `a[yetiCardLink]` (Part 2 row 28; ticket 26 row 103; the manifest's `on: "a"`). This spec fixes the provisional name, as [Decide: the glossary](../issues/10-decide-glossary.md) left part names to the specs |
| `exportAs` | `yetiCard` | `yetiCardLink` |
| Entry point | `ngx-yeti/card` (building-blocks 1.3; ADR 0011 clause 10) | same |
| Inputs | `variant: YetiVariant \| undefined` (no Yeti default); `threshold: YetiWidth \| undefined` (`md`); `ratio: YetiRatio \| undefined` (`16/9`); `raised: boolean`, `booleanAttribute`, default `false`; each `input()` with no default value beyond `false` | `stretch: boolean`, `booleanAttribute`, default `false` |
| Host | static `class: 'card'`; static `data-ngx-yeti-item-card: ''`; `[attr.data-variant]`, `[attr.data-threshold]`, `[attr.data-ratio]` from the inputs, `null` when unset; `[attr.data-raised]`: `''` when `raised()` is true, else `null` | `[attr.data-stretch]`: `''` when `stretch()` is true, else `null` |
| Providers | `yetiCardToken` | none |
| Injection | the ADR 0060 styles service, through `injectYetiItemStyles('card')` | `yetiCardToken`, `{ optional: true, skipSelf: true }` |
| Models, outputs, methods, listeners | none | none. No `click` listener: the link's navigation is the platform's or `RouterLink`'s (ADR 0011 clause 3) |
| Lifecycle | `injectYetiItemStyles('card')` is the last statement of its constructor, after anything there that can throw (nothing does today), and its release runs through `DestroyRef` (ADR 0060 point 2; [setup](setup.md); ticket 50 decisions 18 and 42) | none |

No input default differs from Yeti's (ADR 0070 rule 1). A static attribute type-checks as a string literal under `strictTemplates`, so `ratio="4/3"` compiles and `ratio="4:3"` does not (ADR 0070 rule 2; ticket 26 grilling question 14, read, not run).

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiCard` on an `article` for a card that stands alone, or on an `li` for cards in a list, and give that list `role="list"`, as Yeti's examples do (manifest `a11y.notes`; Yeti's reset removes list markers, and the role restores list semantics in WebKit, ticket 17 section 2.2). A `section` or `div` also renders a card, without the article's or list item's semantics.
2. **Never wrap a card in a link, and never put `yetiCard` on an `a` or a `button`** (manifest `a11y.notes`). The whole card's text would become the control's name, and a footer action inside it would be interactive content inside interactive content, which HTML does not allow.
3. **The whole-card link pattern.** To make the whole card clickable, put the link inside the card's heading, write `yetiCardLink stretch` on it, and let the heading's text be the link's text. The link's accessible name is then the heading text alone, the card is one press target, and the link is the card's one Tab stop for that destination (manifest `children`: `[data-stretch]` max 1; `docs.md`, Accessibility). Give one link per card `stretch`.
4. If the footer repeats the stretched link's destination as a button-styled link, give that footer link `tabindex="-1"`, so a keyboard user does not meet the same destination twice; it still takes a pointer click (Yeti's `docs.md` and `example.html`; ticket 17 section 4.8, measured as a single stop in Chromium and Firefox). Any other control in the card (a footer `button`, a second link to a different destination, a `details`) keeps its own Tab stop and takes its own click above the stretched link.
5. Put no positioned element between the card and the stretched link: the pseudo-element covers the nearest positioned ancestor, which is the card only when nothing between them is positioned (read in `card.css`; inferred, not measured). The heading and a plain `div` are not positioned by Yeti; a `stack` with `rule` positions its children (`Y/src/layouts/stack/stack.css:38`, read), so a stretched link inside such a child would cover only that child; a `layer` figure is the card's first child and never holds the stretched link.
6. Put the card's picture first: an `img`, `video`, or `picture` directly, or a `figure` holding the media and an optional `figcaption`. Write alternative text that describes what is visible after the crop, or empty alternative text for a decorative picture; `ratio` may be set to the picture's own ratio so nothing is cropped (after the frame's manifest note on cropping, which the card's crop shares; WCAG 1.1.1).
7. Use `NgOptimizedImage` on the card's `img` in its `width` and `height` form, with `width` and `height` giving the image's intrinsic size, never in `fill` mode: `fill` positions the image absolutely against the card itself, over the whole card (`NGP/common/src/directives/ng_optimized_image/ng_optimized_image.ts:260-263`, read). Where the card's crop or its row form gives the image a different rendered ratio from its intrinsic one by more than 0.1, `NgOptimizedImage` logs its development-mode distortion warning (`ng_optimized_image.ts:1080-1123`, read), although `object-fit: cover` crops rather than distorts ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 118).
8. Put the `footer` last, so it sits at the bottom of the card and takes the grid's last row under `rows`.
9. Do not write `class="card"`, `data-variant`, `data-threshold`, `data-ratio`, `data-raised`, `data-stretch`, or `data-ngx-yeti-item-card` statically on either host. The directives bind them, and hydration writes a static attribute back before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"; ADR 0070 consequences). A value newer than the pin goes through `$any` (`[threshold]="$any('3xl')"`, ADR 0070).
10. Bind every input from values that are the same on the server and the client, never from a browser-only read such as the window's width. The card already follows its own width in CSS (building-blocks 1.7), and the hydration constraints require the same DOM on both sides.
11. Import `YetiCard`, and `YetiCardLink` where a template writes it, in every component whose template writes the attribute. A **Forgotten import** of `YetiCardLink` with a static `stretch` renders a link that does not stretch, with no error; only a bound input (`[stretch]`, `[threshold]`) makes the compiler report it (NG8002), or a template reference naming the `exportAs` (NG8003) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `card` | Nearest in Angular Material: `MatCard` |
| --- | --- | --- |
| Shape | an item directive on the consumer's `article` or `li`, plus a part directive on the stretched link; the figure, body, and footer are plain elements Yeti styles by position | a component `<mat-card>` with content directives and components `mat-card-header`, `mat-card-title`, `mat-card-content`, `mat-card-actions`, `mat-card-footer`, and `[mat-card-image]` (`NC/src/material/card/card.ts:36`, `:68`, `:94`, `:120`, `:167`, `:186`) |
| Surface | `raised` (a shadow instead of a border); `variant` tints the border | `appearance`: `'outlined' \| 'raised' \| 'filled'`, default `raised` (`card.ts:18`, `:50`, `:54`) |
| Defaults | none: Yeti's tokens are the theme (ADR 0004; building-blocks 1.4, defaults tokens) | `MAT_CARD_CONFIG` sets the default appearance (`card.ts:27`, `:53`) |
| Actions | a `footer` last, at the bottom; its alignment is Yeti's | `mat-card-actions` with an `align` input, which Material itself notes conflicts with the native `align` attribute (`card.ts:128-132`) |
| Responsive form | the picture moves beside the text by a container query on the card's own width | none |
| Whole-card link | `yetiCardLink stretch` on the heading's link, named by the heading | none; Material's card has no link pattern |
| Accessibility | none of its own beyond the consumer's semantics; the usage rules carry the link pattern | none of its own: no role, no keyboard |
| `exportAs` | `yetiCard`, `yetiCardLink` | `matCard`, `matCardActions` (`card.ts:46`, `:121`) |

Nothing from Material's API applies: `appearance` is Yeti's `raised` and border, a defaults token would duplicate Yeti's tokens (ADR 0004), and an `align` input is the presentational-attribute name Material regrets. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 28; building-blocks 1.2). The reason, row 1's, which row 28 takes ("as row 1"): Yeti's CSS does the whole job; the directives add the class, the typed attributes and the marker, the item-file acquisition, and `exportAs`. Container size queries, `aspect-ratio`, `overflow: clip`, subgrid, and `:has()` are inside Baseline 2025 (building-blocks 1.2). No Aria pattern applies (a card has no role of its own and the APG has no card pattern; ticket 17 section 4.8, "APG: none"), and no CDK piece is used: there is no id, focus, keyboard, observer, direction read, or measurement in script. The row form is logical (`inset-inline-start`, `margin-inline-start`), so RTL needs no `Directionality`.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none (ticket 17 section 4.8). The card adds no role, state, or property.
- **Keyboard:** none of the package's. The stretched link is a native link: Tab reaches it and Enter follows it. Other controls in the card keep their native keys.
- **Names:** the stretched link is named from its content, the heading text, by the usage rule; the package adds no `aria-label` (building-blocks 1.10, Names). An `article` card exposes the article role; an `li` card is a list item of a list the consumer marks `role="list"`.
- **Focus:** the focus ring is the reset's on the link (ticket 17 section 2.3 measured a ring at every Tab stop, the card example included). With `yetiLift`, the whole card also rises while focus is inside it (`:has(:focus-visible)`, the [lift](lift.md) spec).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.1.1 Non-text Content | The picture's alternative text is the consumer's; usage rule 6 asks that it describe what is visible after the crop. Every image in the package's stories has alternative text. |
| 1.3.1 Info and Relationships | The card is the consumer's `article` or `li` (usage rule 1); a list of cards keeps `role="list"`; the heading is a real heading. The directives add no role. Layer 1 asserts the list role and item count on `card--list`. |
| 1.3.2 Meaningful Sequence | The row form moves the picture with absolute positioning and an inline margin and never reorders; the reading order is the source order in both forms (read in `card.css`). Layer 1 asserts the accessibility tree order equals the DOM order in the row form. |
| 1.4.3 Contrast (Minimum) | Text sits on `--yeti-card-surface`. axe found no violation and no incomplete result on the card example (ticket 17 sections 2.1 and 3), so the **Story gate** covers it. Play functions also assert at least 4.5:1 with the exact formula on the body text, the link, and a caption under a figure, in light and dark schemes (ticket 50 decision 8; ADR 0015 point 3), as Yeti's own card test does for the same elements (`Y/test/browser/components/card.spec.js`, "text meets AA", read, not run). A caption over a `layer` figure is text over a picture, which the [ledger](../ledger.md) row A11Y-10b assigns to the author; this spec repeats that as the layer spec's usage rule and asserts nothing over a picture. If a Yeti default fails 4.5:1, a package rule follows under A11Y-10a's pattern (ticket 50 decision 8). |
| 1.4.4 Resize Text | The card's widths and the row switch are `rem`-based (`32rem` for `md`, read), so text zoom raises the switch with the text (read, not measured). Layer 4 repeats the row case at 200 % text zoom. |
| 1.4.10 Reflow | Below the threshold the picture stacks on top and the card is a flex column at its container's width. Ticket 17 measured no page-level horizontal scroll on the card example at 320 x 640 in Chromium (section 2.4). Layer 4 asserts it at a 320 px viewport. |
| 1.4.11 Non-text Contrast | The card is not a control: its border and the variant's bar are decoration, and the link is text, so no boundary needs 3:1. Nothing is asserted beyond the gate. |
| 1.4.12 Text Spacing | No rule sets a height on the card or its text; the picture in the row form takes the card's full height, which grows with the text (read). |
| 2.1.1 Keyboard | The stretched link is reachable by Tab. A footer link with `tabindex="-1"` leaves keyboard reach, but only where it repeats the stretched link's destination (usage rule 4), so every function stays available by keyboard. |
| 2.4.3 Focus Order | Focus moves through the card's links and controls in DOM order in both forms and in right-to-left pages (layer 1, `card--rtl`). |
| 2.4.4 Link Purpose (In Context) | The stretched link's name is the card's heading (usage rule 3). A footer "Read more" link is in the same `article` or `li` as that heading, which is its programmatic context. Layer 1 asserts the stretched link's computed name equals the heading's text. |
| 2.4.7 Focus Visible | The reset's ring on the link; ticket 17 measured it on the card example. The card's `overflow: clip` sits outside the padding the link's ring is drawn in, so it does not clip it (read; layer 1 asserts `outline-style` is not `none` on the focused link). |
| 2.5.8 Target Size (Minimum) | The stretched link's target is the whole card; other controls in the card keep their own size and sit above it (`z-index: 1`). A footer control's own size is its item's (the button spec). |

**Ledger rows owned:** none ([ledger.md](../ledger.md); Part 2 row 28, "Ledger: none"). The package adds no accessibility or standards feature that Yeti lacks: ticket 17 classed the card as conforming, with "Angular: nothing missing (typed inputs only)" (section 4.8), and the whole-card link pattern is Yeti's own, stated by the package as usage rules. Forced colours are not a criterion of WCAG 2.2 AA (ticket 17 section 2.6), and the card draws no state by colour; a raised card's shadow is not drawn under forced colours, and whether its transparent border then shows is recorded by layer 4, with no ledger row ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 119). The stretched link's pseudo-element also makes the card's text hard to select with a pointer, which is the pattern's known cost and no WCAG 2.2 AA criterion; the docs say so, with no ledger row ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 120).

### 8. Rendered HTML

Consumer markup, after Yeti's example (`Y/src/components/card/example.html`):

```html
<article yetiCard threshold="xs">
  <img ngSrc="trail.jpg" width="1600" height="900" alt="A mountain trail at dawn" />
  <h3><a yetiCardLink stretch routerLink="/hills">Weekend in the hills</a></h3>
  <p i18n>Six miles, one summit, and a view worth the early start.</p>
  <footer>
    <span yetiBadge variant="success">Open</span>
    <a yetiButton emphasis="low" routerLink="/hills" tabindex="-1">Read more</a>
  </footer>
</article>
```

Server HTML and the hydrated DOM are the same. The `article` carries `yeticard=""`, `threshold="xs"` (the static input attribute, matched by no rule), `class="card"`, `data-threshold="xs"`, and `data-ngx-yeti-item-card=""`, and no `data-variant`, `data-ratio`, or `data-raised`. The heading's `a` carries `yeticardlink=""`, `stretch=""`, `data-stretch=""`, and the `href` that `RouterLink` renders, and no presence attribute. The `img` carries what `NgOptimizedImage` renders. The badge and the footer link carry their own items' classes, attributes, and presence attributes (the badge and button specs). With `raised` bound true, the `article` adds `data-raised=""`.

The server also writes the item links into `<head>` in Yeti's order: `button`, then `badge`, then `card` (`Y/src/yeti.css:40`, `:42`, `:43`). The card's link has `rel="stylesheet"`, `href` `<url>components/card/card.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="card"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts the links at bootstrap. The card has no closed or open state.

With `yetiLift` beside `yetiCard` (`<article yetiCard yetiLift raised>`, after `Y/src/utilities/lift/example.html`), the host carries `class="card lift"`, `data-raised=""`, `data-ngx-yeti-item-card=""`, and `data-ngx-yeti-item-lift=""`, and the `lift` link follows the `card` link in `<head>` (`Y/src/yeti.css:69`) ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); the [lift](lift.md) spec).

The delta from Yeti's docs markup: the consumer writes `yetiCard` and input names where the docs write `class="card"` and `data-*` names, `yetiCardLink stretch` where they write `data-stretch`, and `NgOptimizedImage`'s `ngSrc`, `width`, and `height` on the `img` (building-blocks 1.2, images rule). Yeti's `href="/hills"` becomes a `routerLink`, which the package does not require.

### 9. Animation

None of the card's own. The card has no state and no transition; changing a bound input changes the card at once, and the row switch is a container query, not an animation. A card the consumer inserts or removes with `@if` or `@for` may carry a class-form `animate.enter` or `animate.leave` of the consumer's, or sit in an element carrying Yeti's `enter` utility (the [enter](enter.md) spec). The item link stays until Angular removes the last host, because removal waits for the DOM (ADR 0060 point 4). A server-rendered card never takes `animate.enter` (ADR 0011 clause 12). The hover and focus rise is the `lift` utility's, with its own reduced-motion answer ([lift](lift.md)).

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes and marker, and the item link in `<head>` (section 8). Everything at first paint is a host binding (ADR 0011 clause 1). Nothing is **Pre-hydration state**: no person and no Yeti module can change a `data-*` attribute (ticket 26 grilling question 12).
- **Before hydration:** neither directive creates a node, reads layout, starts a timer or observer, or touches `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is `YetiCard`'s item acquisition, which ADR 0060 runs on the server too. A press anywhere on the card before hydration is a press on the stretched link, because the pseudo-element belongs to it: a plain `href` navigates natively, and a `routerLink` link's own listener is `RouterLink`'s, whose replay is the router's behaviour, not the package's (inferred). `yetiCardLink` declares no `click` listener, so it adds nothing that could stop a native navigation inside a deferred region (ADR 0011 clause 3).
- **Full hydration:** both hosts are claimed as they are; bindings computed from the same inputs give the same values (usage rule 10); 0 style mutations (ADR 0060 point 5, measured for the mechanism).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the card and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism). A dehydrated card's stretched link already works, because it is a link and CSS.
- **`hydrate never`:** the card is its server HTML and stays styled while its host is connected, whatever live cards do (ADR 0060 point 4; ADR 0045's presence attribute is what the check queries). On a host shared with `lift`, each item's presence attribute keeps its own link (ADR 0045). The stretched link still covers the card. Nothing is lost except changing a bound input, which needs Angular.
- **Client-only `@defer`:** the item file is fetched when `YetiCard` is constructed, which can show unstyled frames (no border, the picture at its intrinsic size, the footer not at the bottom); the consumer closes the gap with `provideYetiStyles({ preload: ['card'] })` (ADR 0060 point 6; [setup](setup.md)).
- **Event replay:** neither directive declares a listener, so nothing replays and no `jsaction` is added by them.
- **`withI18nSupport()`:** card text is usually translated with `i18n` in the consumer's component. The directives add no `i18n` block; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** inputs are `input()` signals read by host bindings, so a changed input refreshes its attribute with no zone (map, Standing rulings, item 43; ADR 0070 rule 4).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the card is readable and styled, its picture is cropped or beside the text by the card's width, and the whole card follows its link, because the class, the attributes, the marker, and the item link are in the server HTML and a link needs no script. A `routerLink` link has its `href` in the server HTML and navigates as a document load. Nothing is lost: the card has no behaviour. A client-only application gets no such promise.
- **Hydration boundary:** the card and its link may sit in different boundaries. The card has no ids or references, and the link's marker is CSS.

### 11. Hydration constraints

The card complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; `data-variant`, `data-threshold`, `data-ratio`, `data-raised`, and `data-stretch` come from inputs whose values usage rule 10 keeps equal on both sides.
- **No direct DOM manipulation:** the directives write nothing to the DOM outside host bindings. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directives change no element. The consumer's markup must be valid as written: a card is not an `a` and holds no link around block content (usage rule 2), so the parser repairs nothing; an `li` card sits in a `ul` or `ol`.
- **`preserveWhitespaces`:** the directives have no template. Whitespace-only text is not a flex item, and `:first-child` counts elements only, so whitespace changes neither which child is the bleeding media nor the layout.
- **No output branched on the platform:** none.
- **Static attributes the directives bind:** usage rule 9 keeps the consumer from writing them. No input of the card is a presentational-attribute name, so the decided exception of ticket 50 decision 9 does not arise.

### 12. Single-page application

None. The card has no navigation or fragment behaviour of its own, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). The stretched link is the consumer's link: a `routerLink` navigates inside the application, and a bare `#id` link under `<base href>` is handled by `provideYetiFragmentLinks()` when the consumer provides it ([fragment-links](fragment-links.md), the document listener for other bare links), as Yeti's test fixtures write `href="#hills"`. On a route change, a route's cards leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-card]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders a card again re-inserts it.

### 13. Item file

`yeti-css/css/components/card/card.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiCard]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:43`, after `badge` and before `field`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-card` has left the DOM. `YetiCardLink` acquires nothing (section 2). The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the `[data-variant]`, `[data-threshold]`, `[data-ratio]`, and `[data-rows]` value rules and the tokens), and optionally `provideYetiStyles({ preload: ['card'] })`. The card adds nothing to it.

Cross-item files acquired: none (ADR 0060 point 9). `card.css` holds two rules that name another item, `.grid[data-rows] > .card` and `.card > figure.layer:first-child > figcaption`, but both live in the card's own file, so they load with the card. The `grid`'s and `layer`'s own rules load through `yetiGrid` and `yetiLayer` on their own elements. No tie needs Yeti's order: the card's rules are in `yeti.components`, which comes after `yeti.layouts` (`Y/src/layers.css:7`), so they beat the grid's and the layer's whatever the link order; the lift's are in `yeti.utilities`, after both, which is why a raised card's resting shadow gives way to the lift's (the [lift](lift.md) spec).

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class, attributes, and marker in the DOM, the item link, where the picture and the footer land, which element a press lands on, the link's accessible name, and the Tab stops. It never asserts a private field, the parent token's value, or how the styles service counts. No test depends on a public token's default value or on a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): a geometry test sets `threshold` and `ratio` explicitly and sizes the card against the literal stop it mirrors (the `xs` stop is `16rem` of content, read in `card.css`) plus a probe styled `padding-inline: var(--yeti-card-padding); border-inline: var(--yeti-border-width) solid`, so the assertion holds for any padding or border value; gaps and border widths are read from computed style, as Yeti's own `card.spec.js` does with its `token()` helper. "Row form" means the title's left edge is past the picture's right edge and the picture is 40 % of the card's width within 1 px; "stacked" means the title's top is at or below the picture's bottom. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `card` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Every image has alternative text and uses `NgOptimizedImage` (building-blocks 1.2). Story ids:

- `card--default`: section 8's markup in a resizable container. Asserts the `article`'s `class` is `card`, `data-threshold="xs"`, `data-ngx-yeti-item-card`, and no `data-variant`, `data-ratio`, or `data-raised`; the link has `data-stretch` and no presence attribute; no element has a role or `tabindex` from the package. Narrow: stacked, the picture's left, right, and top edges within 1 px of the card's padding box (the bleed), and its ratio the explicit `ratio` set for the story within 0.1. Wide: row form.
- `card--stretched-link`: the whole-card link pattern (usage rules 3 and 4). Asserts the stretched link's computed accessible name equals the heading's text content; a press near the card's bottom-right corner lands on the link (`elementFromPoint` returns the link) and navigates to its destination; a press on a footer `button` lands on the button, fires its click, and does not navigate (Yeti's "a footer button still takes the click"); the footer link with `tabindex="-1"` is not a Tab stop; Tab from before the card reaches the stretched link, then the footer button, then leaves the card; the focused link's `outline-style` is not `none`.
- `card--inputs`: Storybook controls bind `variant`, `threshold`, `ratio`, and `raised`. The play function sets each, asserts the matching `data-*` value, resets it to unset, and asserts the attribute is absent. With `raised`, asserts `box-shadow` is not `none` and the top border colour is transparent; with `variant="warning"`, asserts the top border width is four times the left border width within 0.1 px.
- `card--figure`: a card whose first child is a `figure` with an image and a `figcaption`. Asserts the image bleeds to the padding box, the caption sits below the image, and the caption's contrast on the card's surface is at least 4.5:1 in light and dark schemes (ticket 50 decision 8).
- `card--layer-caption`: a card whose first child is `<figure yetiLayer>` with a caption over the picture, as Yeti's fixture has it. Asserts the caption's bottom equals the picture's bottom within 1 px and the caption has a non-transparent background. No contrast assertion over the picture (A11Y-10b is the layer's).
- `card--grid-rows`: three cards of different lengths as `li` children of a `yetiGrid` with `rows`, each with a footer. Asserts every footer's bottom is equal within 1 px and the picture still bleeds (Yeti's "cards in a ranked grid").
- `card--list`: three `li` cards in a `ul` with `role="list"`. Asserts the list role, three list items, and each card's stretched link named by its heading.
- `card--with-lift`: Yeti's lift example, three `article` cards with `yetiCard`, `yetiLift`, and `raised`, each with a stretched link. Asserts each host's `class` contains `card` and `lift`, each carries `data-ngx-yeti-item-card` and `data-ngx-yeti-item-lift`, and Tab to the first link leaves that card's `translate` not `none` (the lift's own cases are the [lift](lift.md) spec's).
- `card--rtl`: `card--default` inside `dir="rtl"` at a wide container. Asserts the picture is on the right in the row form, and that Tab moves through the card's controls in DOM order.
- `card--anti-pattern-wrapped-link`: an **Anti-pattern story** with a whole card wrapped in one `a` (usage rule 2). Its play function asserts the link's computed name contains the paragraph's text as well as the heading's, which is why the pattern is refused. It switches off no gate rule: axe does not flag it.
- Contrast: `card--default` and `card--inputs` also assert at least 4.5:1 for the heading link and the paragraph on the card's surface, in light and dark schemes, with the exact WCAG formula on computed colours (ticket 50 decision 8; ADR 0015 point 3).

### Layer 2: browser-level (`npx nx test <lib>`, `card.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiCard, { tagName: 'article' })`: the host has class `card` and `data-ngx-yeti-item-card`, and no `data-variant`, `data-threshold`, `data-ratio`, or `data-raised`; with `bindings` setting each input, the attributes follow after `whenStable()` (`raised` true renders `data-raised=""`), and binding `undefined` or `false` removes them.
- While a `YetiCard` fixture lives, one `<link data-ngx-yeti-styles="card">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- `createDirective(YetiCardLink, { tagName: 'a' })`: no `data-stretch` by default; `stretch` bound `true` renders `data-stretch=""`, `false` removes it; the host carries no presence attribute and acquires no link; created alone, it injects no parent and throws nothing.
- No directive adds a listener to its host.

A small test host covers what `createDirective` cannot: a link declared inside a `yetiCard` host resolves `yetiCardToken` to the card instance; template references `#c="yetiCard"` and `#l="yetiCardLink"` resolve; static `raised` and `stretch` attributes set their inputs through `booleanAttribute`; a static `threshold="xs"` renders both `threshold="xs"` and `data-threshold="xs"`; `<article yetiCard yetiLift raised>` renders `class="card lift"`, one `data-raised=""`, and both presence attributes, and destroying it releases both links; `yetiCardLink` on a `routerLink` anchor keeps the `href` `RouterLink` renders; and the consumer's own `class` on the card is kept.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `card.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture of section 8's markup whose paragraph carries `i18n`, with a bound `ratio` and a static `raised` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the `article` renders `class="card"`, `data-ngx-yeti-item-card`, `data-threshold="xs"`, `data-ratio`, and `data-raised=""`; the heading's link renders `data-stretch=""` and an `href`; `<head>` holds one item link with `data-ngx-yeti-styles="card"`, `data-beasties-skip`, and an `href` ending `components/card/card.css?v=<pin>`, after the `button` and `badge` links; no element carries a `jsaction` from the package.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `card` has `YetiCard`; `data-variant`, `data-threshold`, and `data-ratio` have inputs whose unions equal the manifest's vocabularies `variant`, `width`, and `ratio`; `data-raised` has a boolean input; the marker `data-stretch` has the boolean `stretch` input on `YetiCardLink`; the item has no events. A pin move that adds an attribute, a value, or a marker fails here before any story does. The name-collision test checks `YetiCard`, `YetiCardLink`, and `yetiCardToken` against the 46 names `yeti.d.ts` exports (ticket 50 decision 10).

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids, after Yeti's own `card.spec.js`: `card--default` resizes the container, not the viewport, across the `xs` stop (building-blocks 1.7 and 1.12) and asserts the row form above it and the stacked form below it; at a 320 px viewport the page has no horizontal overflow and the card is stacked; at 200 % text zoom the switching width rises with the text (1.4.4, 1.4.10). On `card--stretched-link`, a real mouse click near the card's corner navigates, a real click on the footer button does not, and real Tab presses reach the stretched link and the footer button only (skipped in WebKit where headless WebKit does not move focus on Tab, as the [lift](lift.md) spec does). With `emulateMedia({ forcedColors: 'active' })` on `card--inputs` with `raised`, the card's edge and the focused link's outline are recorded, not asserted ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 119).

Fixture-app half, built with `outputMode: 'server'`, with a `/card` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route renders section 8's markup and a grid of cards with `yetiLift`:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`; 0 attribute mutations on the card hosts at hydration;
- with JavaScript disabled, the card's geometry equals that with JavaScript on at the same width, a click near the card's corner navigates to the stretched link's `href`, and `@axe-core/playwright` with the six tags reports no violation;
- **the shared-host case of [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)**: a `card` with `lift` inside a `hydrate never` block keeps both the `card` and the `lift` item links after every live card and every live lift on the page has been removed, and it still lifts on hover and keeps its border; the [lift](lift.md) spec runs the same case from the lift's side;
- a card inside a client-only `@defer` block with `card` in the preload list shows no unstyled frame; without it the unstyled frames are recorded (ADR 0060 point 6);
- the `NgOptimizedImage` console output for a cropped card picture and for the row form is recorded in development mode ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 118);
- navigating from the card route to a route without one removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and `docs.md` examples for the stories; its `test/browser/components/card.spec.js` with the fixture `test/browser/fixtures/components/card.html` for the geometry, click, contrast, and axe cases (the bleed and crop, the footer at the bottom, the footer button's click, the intrinsic width in a cluster, the row form and `data-threshold`, raised and tinted, the layer caption, the ranked grid, AA in light and dark); ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; the [lift](lift.md) spec's card cases; the [sidebar](sidebar.md) spec's probe technique for token-independent widths.

## Out of Scope

- An input per token, a defaults token, or an `appearance` input in Material's shape (ADR 0004; building-blocks 1.4, defaults tokens).
- A viewport breakpoint input of any kind, or a script that decides when the picture moves beside the text (building-blocks 1.7).
- Making the card itself a link or a button, a `link` or `href` input on `yetiCard`, or a `click` output: the whole-card link is the consumer's `yetiCardLink stretch` (manifest `a11y.notes`; ADR 0011 clause 3).
- Hosting `yetiLift` from `yetiCard`, or a `lift` input on the card: no item always carries the lift (building-blocks 1.9 and Part 2; the [lift](lift.md) spec).
- Directives for the figure, body, or footer: Yeti styles them by element and position (building-blocks 1.1).
- Setting or removing the footer link's `tabindex="-1"` for the consumer, or any `aria-*` on the card (Part 2 row 28; building-blocks 1.10, Names).
- Any check that the card's host is an `article` or `li`, that it is not wrapped in a link, that only one link stretches, that the stretched link sits in the heading, or that a repeated footer link has `tabindex="-1"`. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- Package CSS for the card (building-blocks 1.13; ADR 0060 point 8): the item owns no ledger row.
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).
- The `box` layout's `surface="raised"`, which Yeti calls "a tone", not a card (`Y/src/components/card/docs.md`), and the `media` recipe, each with its own spec.

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiCard]` with `variant`, `threshold`, `ratio`, `raised`; part directive `a[yetiCardLink]` with `stretch` | building-blocks Part 2 row 28; ticket 26 rows 99 to 103; [Decide: the spec list](../issues/11-decide-spec-list.md) |
| `data-stretch` is kind C (Yeti's description says what to do to the element: "Stretches") on a per-item part directive restricted to `a` | ADR 0070; ticket 26 grilling questions 6 and 7; manifest `on: "a"` |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by Yeti's `YetiVariant`, `YetiWidth`, `YetiRatio`; booleans through `booleanAttribute`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2; ADR 0080 point 5; building-blocks 1.4 |
| No presentational-attribute kind applies: no input is named like an HTML attribute | building-blocks 1.4; ticket 26 grilling question 15 |
| The part injects `yetiCardToken` optionally with `skipSelf` | ADR 0070 kind C; building-blocks 1.9 |
| Only `YetiCard` marks its host with `data-ngx-yeti-item-card` and acquires the item file | ADR 0045; ticket 50 decision 6 |
| `card` with `lift` on one element: one presence attribute each, both links kept in `hydrate never` | ADR 0045; ticket 50 decision 12 |
| The whole-card link, the heading as its name, `tabindex="-1"` on a repeated footer link, and `article` or `li` hosts are usage rules, not package behaviour | manifest `a11y.notes`; Yeti's card docs; Part 2 row 28; ticket 17 section 4.8 |
| `exportAs` on both; class names with no collision | building-blocks 1.3; ADR 0080 points 3 and 4; ticket 50 decision 10 |
| Entry point `ngx-yeti/card` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 28 and "Types only" |
| Tokens are the consumer's; the threshold's width stops are literals in Yeti's CSS | ADR 0004; `card.css` |
| Item file as a counted link in Yeti's order; no cross-item file | ADR 0060 points 2 to 6 and 9 |
| `injectYetiItemStyles('card')` last in the constructor | [setup](setup.md); ticket 50 decision 42 |
| Contrast assertions at 4.5:1 for text on the card's surface | ticket 50 decision 8; ADR 0015 point 3 |
| `NgOptimizedImage` in its `width` and `height` form, never `fill`; the development-mode warning documented | this spec's reading, after building-blocks 1.2's images rule and ticket 50 decision 35 for `frame` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 118) |
| No ledger row for forced colours or for text selection under the stretched link | this spec's reading, after ticket 50 decisions 26 and 30 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 119 and 120) |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A grid of linked cards that rise on hover and focus, as a list (Yeti's docs and lift examples):

```html
<ul yetiGrid min="sm" role="list">
  @for (trip of trips(); track trip.id) {
    <li yetiCard yetiLift raised>
      <figure>
        <img [ngSrc]="trip.image" width="1600" height="900" [alt]="trip.imageAlt" />
        <figcaption>{{ trip.credit }}</figcaption>
      </figure>
      <h3><a yetiCardLink stretch [routerLink]="['/trips', trip.id]">{{ trip.title }}</a></h3>
      <p>{{ trip.summary }}</p>
    </li>
  }
</ul>
```

```ts
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { YetiCard, YetiCardLink } from 'ngx-yeti/card';
import { YetiGrid } from 'ngx-yeti/grid';
import { NgxYetiLift } from 'ngx-yeti/lift';

@Component({
  selector: 'app-trip-list',
  imports: [YetiCard, YetiCardLink, YetiGrid, NgxYetiLift, NgOptimizedImage, RouterLink],
  templateUrl: './trip-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripList {
  readonly trips = input.required<readonly Trip[]>();
}
```

A card with no picture, a warning tint, and a footer action that is a different destination, so it keeps its own Tab stop: `<article yetiCard variant="warning"><h3>No picture</h3><p>A card is fine without one.</p><footer><a yetiButton emphasis="medium" routerLink="/details">Details</a></footer></article>`. Cards in a ranked grid that line up their parts: `<ul yetiGrid min="sm" rows="3" role="list">` with `li yetiCard` children, each heading, body, and footer in that order. A card that becomes a whole-card link only on request: `<a yetiCardLink [stretch]="clickable()">`. A value newer than the pin: `<article yetiCard [threshold]="$any('3xl')">`. A page whose cards render inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['card'] })`.

Tuning one section's cards with derived tokens, in the consumer's stylesheet after Yeti (ADR 0004):

```css
.trip-list {
  --yeti-card-padding: var(--yeti-space-lg);
  --yeti-card-radius: var(--yeti-radius-lg);
}
```

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/card/card.css`, loaded by `YetiCard` as a counted link (section 13). The consumer writes nothing for the card beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps `data-ratio`, `data-variant`, and `data-rows` to private tokens (`:221` onward, `:239-254`, `:304` onward); `tokens/components.css:17-21` declares the card's component tokens; the reset draws the focus ring on the stretched link and removes list markers, so a list of cards needs `role="list"` to keep its semantics in WebKit (ticket 17 section 2.2).
3. **Cross-item rules:** `card.css` itself holds the card-in-a-ranked-grid rule and the layer-caption rule (section 13); the `grid` and `layer` items load their own files through their own directives. On a card with `lift`, the lift's `yeti.utilities` rules win over the card's `yeti.components` shadow while hovered or focused (the [lift](lift.md) spec). A `button` or `badge` in the footer loads its own file.
4. **Tokens:** reads the five `--yeti-card-*` tokens and the shared tokens of the manifest (section 2); writes none.
5. **What breaks without the item file:** the card renders as plain flow content: no border, surface, padding, or radius; the picture at its own size with no bleed or crop; the footer straight after the body; no row form; and the stretched link's pseudo-element has no rule, so only the link text is clickable. The `data-*` attributes still set their private tokens, which nothing reads, with no error.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled all 49 of Yeti's class names and its attribute names with Tailwind 4.3.3, and only `container`, `grid`, and `table` (plus the attribute name `hidden`) produced a utility (measured). `card` produced none.

### Platform features to adopt when the browser target moves

None for the card: every feature its manifest lists as unguarded (container size queries, `aspect-ratio`, `overflow: clip`) and the `:has()` it does not list are inside Baseline 2025 (section 6), and Yeti guards nothing for the card. Container style queries reading a custom property would let one rule replace the seven threshold blocks, which is Yeti's change to make, not the package's (inferred from Yeti's comment that "container conditions cannot read custom properties"; nothing was checked against web-features data for this spec).

### Single-page-application pieces relied on

None of its own: the card uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). A consumer's bare `#id` stretched link under `<base href>` relies on `provideYetiFragmentLinks()` from [fragment-links](fragment-links.md). It relies on ADR 0060's styles service for route changes (section 12).
