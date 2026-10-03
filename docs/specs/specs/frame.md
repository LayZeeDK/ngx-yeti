# Spec: frame (layout)

Ticket: [58. Spec: frame (layout)](../issues/58-spec-frame.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 8 and Part 1, [Decide: the spec list](../issues/11-decide-spec-list.md) row 8 and Q9, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) row 30 and Q16, [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` and `NGP/` is `github.com/angular/angular/packages/`, both at 22.2.x. Its open points are decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 35 to 37).

## Problem Statement

Yeti's `frame` is for "images of unpredictable shape [that] must present as the same shape: card thumbnails, avatars, a video embed that should not reflow the page while it loads. The frame owns the shape; the media fills it" (`Y/src/layouts/frame/docs.md`). It is one **Identity class**, `frame`, with one **Attribute**, `data-ratio`, from the five-value `ratio` **Vocabulary**, default `16/9` (`Y/src/layouts/frame/manifest.json`). It holds exactly one child: an `img`, `video`, `picture`, `iframe`, `embed`, or `object` is stretched to fill and cropped with `object-fit: cover`, and anything else is centred (`frame.css`). It has no **Marker** of its own, no **Module**, and no **Event**. It replaces Foundation 6's `.responsive-embed` and `.flex-video` (`Y/src/guides/migrating.md:77`).

An application developer using the package cannot write `class="frame"` or `data-ratio="4/3"`: a consumer writes no Yeti class and no Yeti `data-*` attribute, and directives set them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). A misspelt `data-ratio="4:3"` is silent in plain Yeti, and worse than a fallback: with any `data-ratio` present, `frame.css`'s default rule (`.frame:not([data-ratio])`) no longer applies and no value rule in `attributes.css` matches, so the frame loses its ratio altogether (read). The package turns that into a compile error ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `frame` **Item file** loaded while a frame is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)).

Three accessibility facts come with cropping, and Yeti names two of them in its manifest: "Cropping hides parts of an image. Make sure the alt text describes what is visible, or use data-ratio to match the image so nothing is lost. An iframe needs a title saying what is in it, whatever shape it is cropped to" (`a11y.notes`). The third follows from the same CSS: a frame clips whatever does not fit its ratio, text included. None of them is something a directive can read or fix. Two Angular facts meet the frame's media too: Angular's `NgOptimizedImage`, which this repository's guidance asks for on static images, and hydration's rewrite of every static template attribute, which touches an embed's `src`.

## Solution

One **Item directive** in the secondary entry point `ngx-yeti/frame` (building-blocks Part 2 row 8; [Decide: the spec list](../issues/11-decide-spec-list.md) row 8 and Q9):

- `YetiFrame`, selector `[yetiFrame]`, `exportAs: 'yetiFrame'`. It binds `frame` as a static host class, sets `data-ngx-yeti-item-frame` on its host, acquires the `frame` item file when it is created (on the server too) and releases it when it is destroyed ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); ADR 0060 point 2), through `injectYetiItemStyles('frame')` from `ngx-yeti/styles` as the last statement of its constructor ([setup](setup.md); ticket 50 decisions 42 and 45). It has one input, `ratio` (`YetiRatio`), bound as `data-ratio` and rendering nothing when unset, so Yeti's 16/9 applies from its CSS.

There is no **Part directive**: the frame's one child is the consumer's element with no marker, and Yeti's CSS selects it by tag (`frame.css`; ticket 26 has no child row for `frame`). Everything else is Yeti's CSS and the platform. The value is a host binding on an input signal, so the server HTML is Yeti's documented markup and the frame renders the same before hydration, after it, with JavaScript off, and inside any `@defer` or hydrate block. The package writes no **Token** and offers no input per token ([ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md)).

The cropping facts become **Usage rules**, story assertions, and the **Story gate**'s axe rules (`image-alt`, `frame-title`, `object-alt`). The two Angular facts become usage rules with layer-4 measurements ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 35 and 36).

## User Stories

1. As an application developer, I want to give an element a fixed shape with one directive attribute, so that I never write Yeti's `frame` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="frame"`, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want to set the shape with a typed `ratio` input, so that a misspelt `"4:3"` fails to compile instead of removing the ratio.
4. As an application developer, I want a frame with no `ratio` to get Yeti's default shape, so that the plain directive does something useful.
5. As an application developer, I want the package not to write Yeti's default `16/9` into my markup, so that a pin move that changes Yeti's default reaches my page.
6. As an application developer, I want each of the five ratios (`1/1`, `4/3`, `3/2`, `16/9`, `21/9`), so that I can make avatars, thumbnails, photos, video, and panoramas.
7. As an application developer, I want an `img` in a frame to fill it without distortion, so that photos of any shape present as one shape.
8. As an application developer, I want a `picture` and its `img` to fill the frame the same way, so that art direction with `source` elements still crops.
9. As an application developer, I want a `video` to fill the frame, so that a player keeps the page from reflowing while it loads.
10. As an application developer, I want an `iframe`, `embed`, or `object` to fill the frame with no border of its own, so that a map, a remote video, or a PDF sits in a fixed shape.
11. As an application developer, I want any other child, such as an icon or a stand-in graphic, centred in the frame, so that an empty state keeps the layout's shape.
12. As an application developer, I want to bind `ratio` from state, so that a gallery can switch between square and wide thumbnails.
13. As an application developer, I want to put `yetiBorder` beside `yetiFrame`, so that a map or a photo on a light page gets Yeti's edge.
14. As an application developer, I want to change a bordered frame's edge colour with `--yeti-color-border` on the frame, as Yeti documents, so that the edge can match the page.
15. As an application developer, I want to tone the media with my own `filter` style, so that art direction stays mine.
16. As an application developer, I want to compose `yetiFrame` with `yetiBreakoutChild` on one element (`<div yetiFrame yetiBreakoutChild ratio="21/9" bleed>`), so that a picture can bleed out of a reading column, as Yeti's breakout example does.
17. As an application developer, I want a frame inside a `yetiSidebar`, a `yetiStack`, or a `yetiColumns`, so that I can build Yeti's media object, card, and hero from primitives.
18. As an application developer, I want to know how to use `NgOptimizedImage` inside a frame, so that I get Angular's image loading without a misplaced image or a console warning.
19. As an application developer, I want to know what hydration does to an `iframe` or `video` in a server-rendered frame, so that an embed does not load twice without my knowing.
20. As an application developer, I want the `frame` item file loaded when the first frame renders and removed after the last leaves, so that I do not import `frame.css` globally.
21. As an application developer, I want the item file in the server HTML when a server-rendered page has a frame, so that the first paint has the shape and no layout shift.
22. As an application developer, I want frames styled with JavaScript off under SSR and prerendering, so that the page reads correctly before any script runs.
23. As an application developer, I want hydration to change nothing on a frame, so that I get no `NG05xx` error and no flash.
24. As an application developer, I want `ratio` to work under zoneless change detection, so that a bound ratio updates without zone.js.
25. As an application developer, I want a frame inside a `hydrate never` block to keep its shape for as long as it is on the page, so that a dehydrated block is not unstyled when a live frame elsewhere leaves.
26. As an application developer, I want to know that a frame inside a client-only `@defer` block needs `frame` in the preload list for a flash-free first paint, so that an image does not show at its own size for a few frames.
27. As an application developer using `withI18nSupport()`, I want translated `alt` and `title` text inside a frame to hydrate without being re-rendered, so that localised pages keep the server's DOM.
28. As an application developer, I want to bind a value newer than the pin through the input with `$any`, so that I know the escape hatch when Yeti adds a ratio before the package does.
29. As an application developer, I want my own classes and attributes on the host kept, so that I can add application classes beside the directive.
30. As an application developer, I want the template reference `#f="yetiFrame"`, so that the directive follows the package's `exportAs` rule.
31. As an application developer, I want to import `YetiFrame` from `ngx-yeti/frame`, so that a `@defer` block can split it with the rest of the item.
32. As an application developer, I want the usage rules stated (one child, alt text for the visible crop, a title on every `iframe`, no text that must be read inside the frame), so that I use the frame as Yeti intends.
33. As an application developer using Tailwind v4 beside the package, I want to know whether `frame` collides with a Tailwind name, so that I can plan my cascade-layer statement.
34. As a screen-reader user, I want a frame to add no role and announce nothing, so that I hear only the image's alternative text or the embed's title.
35. As a screen-reader user, I want every image in the package's stories to have alternative text describing what is visible, so that the crop hides nothing I am told about.
36. As a screen-reader user, I want every `iframe` in the package's stories to carry a `title`, so that I know what the embedded document is before I enter it.
37. As a keyboard user, I want the frame to add no tab stop, so that focus reaches only the embed's own controls.
38. As a low-vision user, I want frames to scale with the page width at 320 CSS pixels, so that a fixed shape never forces horizontal scrolling.
39. As a low-vision user who enlarges text or overrides text spacing, I want no text I need to be clipped by a frame, so that my settings keep the content visible.
40. As a package maintainer, I want the contract check to cover the frame's class, its attribute, and the `ratio` union, so that a pin move that adds a ratio fails before release.
41. As a package maintainer, I want the SSR smoke to assert the server HTML of a frame with and without `ratio`, so that the first paint is proven.
42. As a package maintainer, I want the fixture app to render a frame route prerendered and server-rendered, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
43. As a package maintainer, I want no test to depend on Yeti's default ratio as a hard-coded number, so that a pin move that changes the default does not fail a test for no reason.
44. As a package maintainer, I want the exported class name checked against Yeti's typings at the pin, so that a collision is caught.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/layouts/frame/manifest.json`, `frame.css`, `docs.md`, and `example.html`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `frame`, `layout`, `Boxes and Stacks` |
| `class` | `frame` |
| `attributes` | `data-ratio` (enum, vocabulary `ratio`: `1/1`, `4/3`, `3/2`, `16/9`, `21/9`; default `16/9`; "Width to height.") |
| `classes`, `markers` | empty |
| `children` | `> *`, `min: 1`, `max: 1`: "One child: an image, video, picture, iframe, embed or object is stretched to fill and cropped; anything else is centered." |
| `tokens` | `--_yeti-aspect` (private) |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "Cropping hides parts of an image. Make sure the alt text describes what is visible, or use data-ratio to match the image so nothing is lost. An iframe needs a title saying what is in it, whatever shape it is cropped to." |
| `js` | `null`: no Module, no Events |
| `support` | `unguarded`: `aspect-ratio`, `object-fit`; `guarded` empty |
| `since` | `7.0.0` |

`frame.css`, in `@layer yeti.layouts`, makes `.frame` a centring flex box with `aspect-ratio: var(--_yeti-aspect)` and `overflow: hidden`, and sets `--_yeti-aspect: 16 / 9` when `data-ratio` is absent. It stretches a child `img`, `video`, `picture`, `iframe`, `embed`, or `object`, and an `img` inside a child `picture`, to `inline-size: 100%` and `block-size: 100%` with `object-fit: cover` and `border: 0` (`frame.css:4-29`). The five `data-ratio` values are mapped to `--_yeti-aspect` in the always-loaded `attributes.css` (`Y/src/layouts/attributes.css:221-226`), where `hero`, `media`, and `card` read the same attribute (`Y/src/guides/layouts.md:91`). `frame.css` sets no `position`. The example is a `div` with `data-ratio="16/9"` holding one `img` (`example.html`). The docs show `data-border` beside the class and `--yeti-color-border` set inline on the frame for a different edge (`docs.md`).

Attributes left to the consumer: none ([ticket 26](../issues/26-decide-yeti-data-attributes-mapping.md) row 30 maps the only one).

### 2. Contract mapping

| Contract piece | Yeti | Package | Record |
| --- | --- | --- | --- |
| Identity class | `frame` | static host class on `[yetiFrame]` (`YetiFrame`) | ADR 0003 point 1; Part 2 row 8 |
| Attribute `data-ratio` | width to height; default `16/9` | `ratio` on `yetiFrame`: `YetiRatio`, unset renders nothing | ticket 26 row 30 (R); ADR 0070 rule 1; ADR 0005 |
| Children | one `> *`, unmarked | no Part directive; the consumer's element | manifest `children`; ticket 26 (no child row) |
| Markers | none of its own | `data-border` beside it is the `box` spec's `yetiBorder` | [box](box.md); ticket 26 row 5 |
| Events | none | no output | manifest `js: null`; [events](events.md) |
| Private token `--_yeti-aspect` | Yeti's | never read or written | ADR 0004; CONTEXT.md **Private token** |
| Token `--yeti-color-border` (with `yetiBorder`) | the edge colour, settable on the frame (`docs.md`) | the consumer's | ADR 0004 |
| Host attribute (package) | not Yeti's | static `data-ngx-yeti-item-frame` (empty value) | [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); ADR 0080 point 2 |

`ratio` lowercases to no HTML attribute, so building-blocks 1.4's presentational-attribute kinds have nothing to apply to.

**Module replaced:** none. Yeti's `frame` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 8, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The manifest lists one token, the private `--_yeti-aspect`, which the package never touches. A frame with `yetiBorder` reads `--yeti-border-width` and `--yeti-color-border` through the always-loaded marker rule (`attributes.css:462-465`); Yeti's docs set `--yeti-color-border` on the frame itself, a **Derived token** that may be set on any element (`Y/src/guides/theming.md:38`). The package writes none of them and offers no input, provider, or theme for them. A toned plate is the consumer's own `filter` on the media (`docs.md`), not a token.

### 3. Hierarchy and DI shape

None. `YetiFrame` is standalone. It provides no **Injection token**, injects no parent, hosts no directive, and is hosted by none: no Yeti item always sits on another item's element (Part 2, "Two findings that hold across the matrix"). It is written beside other directives on one element (`<div yetiFrame yetiBorder>`, `<div yetiFrame yetiBreakoutChild bleed>`) and inside other layouts (`yetiSidebar`, `yetiStack`, `yetiColumns`), as building-blocks 1.9 has composed items. `ratio` is shared with `hero`, `media`, and `card`, each `YetiRatio` (ticket 26 rows 30, 72, 79, 101), so if two of them ever sit on one element one binding feeds both and renders the one `data-ratio` Yeti means (building-blocks 1.4, shared vocabularies).

The only injection is the root styles service of ADR 0060, through `injectYetiItemStyles('frame')` ([setup](setup.md); ticket 50 decisions 42 and 45), with which `YetiFrame` acquires and releases the `frame` item file. That service is the [setup](setup.md) spec's (`provideYetiStyles()`) and ADR 0060's.

Generated ids and the platform's relationship attributes: none. Nothing here renders or references an `id`, so the item does not use [generated-ids](generated-ids.md).

### 4. API

| Member | Value |
| --- | --- |
| Class | `YetiFrame`. Checked at the Pin: the 46 names of `yeti.d.ts` include `YetiRatio`, the input's type, and no `YetiFrame` (ADR 0080 point 4) |
| Selector, `exportAs` | `[yetiFrame]`, `yetiFrame` (Part 2 row 8; building-blocks 1.3) |
| Host | `class: 'frame'`; `'data-ngx-yeti-item-frame': ''` (static); `[attr.data-ratio]` from `ratio`, `null` when unset |
| Inputs | `ratio`: `YetiRatio \| undefined`, default `undefined` (ADR 0070 rule 1). Yeti's default `16/9` applies from its CSS. `YetiRatio` is Yeti's own vocabulary type, re-exported from the package's generated types module (ADR 0060 point 10; ADR 0005) |
| Models, outputs, methods | none |
| Lifecycle | `injectYetiItemStyles('frame')` is the last statement of its constructor, after anything there that can throw (nothing does today), so `frame` is acquired on the server too; the release runs through `DestroyRef` (ADR 0060 point 2; [setup](setup.md); ticket 50 decisions 42 and 45; building-blocks 1.9) |

**Usage rules** (numbered here and in the directive's JSDoc; the first milestone reports no breach, map, Milestones):

1. Write `yetiFrame` where Yeti's docs write `class="frame"`, and bind `ratio` where they write `data-ratio`. Do not write `class="frame"`, a static `data-ratio`, or `data-ngx-yeti-item-frame` on a host: the directive binds them, and hydration writes a static attribute again before the binding wins (ADR 0003; ADR 0070's 2026-10-03 note; building-blocks, "Hydration constraints (2026-10-03)"). A value newer than the pin is bound as `[ratio]="$any('2/1')"` (ADR 0070).
2. Give a frame exactly one child (manifest `children`, `min: 1`, `max: 1`). A second child is laid out by the frame's flex row and clipped.
3. An image's `alt` describes what is visible after the crop, or `ratio` matches the image so nothing is cropped (manifest `a11y.notes`; WCAG 1.1.1). A decorative image takes `alt=""`.
4. Every `iframe` carries a `title` saying what is in it (manifest `a11y.notes`; WCAG 4.1.2). An `object` carries a text alternative, and an `embed` sits in a frame only where the embedded content is accessible on its own (WCAG 1.1.1).
5. A frame's non-media child is what Yeti names, "a placeholder or an icon" (`docs.md`). Text the reader needs does not go inside a frame: the frame keeps its ratio and clips with `overflow: hidden`, so enlarged text or overridden spacing is cut off rather than growing the box (WCAG 1.4.4, 1.4.12; read in `frame.css` and inferred from CSS Sizing 4's rule that a box which clips gets no content-based minimum size). A caption goes beside the frame, for example a `figcaption` in a `figure` that holds the frame. No ledger row and no package CSS, after the `masonry` precedent ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 37).
6. `NgOptimizedImage` in a frame ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 35): use `fill` and give the frame `position: relative` in the consumer's own stylesheet or inline style. In `fill` mode Angular positions the image absolutely with `inset: 0` and 100% size (`NGP/common/src/directives/ng_optimized_image/ng_optimized_image.ts:260-263`), and `frame.css` sets no `position`, so without it the image is placed against the nearest positioned ancestor instead of the frame (read). The `width` and `height` form also renders, because Yeti's CSS stretches and crops the image, but in development mode Angular's distortion check warns whenever the frame's ratio differs from the image's, since the check compares the rendered and intrinsic ratios and does not read `object-fit` (read, `ng_optimized_image.ts:1103-1123`). The package adds no CSS and no host style binding for it. If the `frame--optimized-image` story shows that `fill` misbehaves, this rule becomes "use `width` and `height`, and expect the development-mode warning".
7. Embedded media under hydration ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 36): hydration writes every static template attribute again (`setupStaticAttributes`; ticket 18, measured), and the platform reloads an `iframe` whose `src` or `srcdoc` is set, even to the same value (measured for `srcdoc` in three engines, [Research: the decided records against Angular's hydration constraints](../issues/33-research-decided-records-against-hydration-constraints.md) C2; inferred for `src` from the HTML standard's "process the iframe attributes"). A `video` with a `src` attribute re-runs its load algorithm the same way (inferred from the HTML standard). So a server-rendered embed loads twice and loses any state a reader gave it before hydration. Give a `video` its sources as `<source>` children, whose `src` changes have no effect once inserted (HTML standard, read); the `iframe` reload is documented, and layer 4 counts loads across hydration. If that case confirms the `iframe` reload, an Angular row is added to `upstream-bugs.md`; filing it needs the user's confirmation. Security-sensitive `iframe` attributes (`sandbox`, `allow`, `allowFullscreen`, `referrerPolicy`, `csp`, `fetchPriority`, `credentialless`) must be static, because Angular refuses to bind them (`NGP/core/src/sanitization/dom_security_schema.ts:144-155`).
8. Import `YetiFrame` in every component whose template writes `yetiFrame`. A **Forgotten import** with no bound input renders the bare element with no error and no shape; a bound `[ratio]` makes the compiler report it (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `frame` | Nearest in Angular Material and Angular |
| --- | --- | --- |
| Shape | an attribute directive on the consumer's element, holding any one child | `MatCardImage`, `[mat-card-image]`, "a purely visual treatment" with no behaviour, on an image inside a `mat-card` (`NC/src/material/card/card.ts:183-189`) |
| Crop | `aspect-ratio` from `ratio` and `object-fit: cover` on the child | `object-fit: cover` on the card's image (`card.scss:185`), with no ratio input |
| Embeds | `iframe`, `embed`, `object`, `video` fill the same way | none |
| Angular | `NgOptimizedImage`'s `fill` mode fills a positioned parent (`ng_optimized_image.ts:260-263`); usage rule 6 | |
| Accessibility | none of its own: purely visual | none of its own |

Nothing from Material's API is adopted: its nearest piece is a card part and works only inside a card, while Yeti's frame is a layout for any media (`docs.md`, "a frame does the same for anything"). The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 8, "as row 1": "Yeti's CSS does the whole job; the directive adds the class, typed attributes, and `exportAs`"). `aspect-ratio` and `object-fit` are inside the browser target (manifest `support.unguarded`; building-blocks 1.2). No Aria pattern applies (a frame has no role), and no CDK piece is used: there is no id, focus, keyboard, direction, or observer. The frame's rules are logical (`inline-size`, `block-size`), so right-to-left needs nothing from the package.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. No role, state, or property; no tab stop.
- **Keyboard:** none. Focus reaches an `iframe`, a `video` with `controls`, or an `object` through the platform; the frame adds nothing and removes nothing.
- **Names:** none of the frame's. The child's name is the consumer's: `alt`, `title`, or the `object`'s fallback content (usage rules 3 and 4).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.1.1 Non-text Content | The consumer's. Usage rule 3 (alt text for the visible crop) and rule 4 (`object` alternative), from the manifest's `a11y.notes`. The **Story gate** runs axe's `image-alt` and `object-alt` on every story, and every story's image has `alt` text that describes its crop. |
| 1.3.1 Info and Relationships | The frame adds no semantics; a `figure` and `figcaption` around it are the consumer's (usage rule 5). |
| 1.4.4 Resize Text, 1.4.12 Text Spacing | Met for media. Text inside a frame is clipped rather than reflowed (usage rule 5, inferred from `frame.css`'s `overflow: hidden` with a fixed ratio); the package states the rule and shows only icons and stand-in graphics as non-media children ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 37). |
| 1.4.10 Reflow | The frame's size comes from its width, so it shrinks with the page and sets no minimum width (read). Layer 4 asserts no horizontal overflow at a 320 px viewport for a `21/9` frame. |
| 2.4.3 Focus Order, 2.1.1 Keyboard | Not affected: the frame takes no focus and adds no `tabindex`; an embed's own controls keep the platform's order. |
| 4.1.2 Name, Role, Value | The consumer's `title` on every `iframe` (usage rule 4; manifest `a11y.notes`). The Story gate runs axe's `frame-title` on every story with an `iframe`. |

Forced colours: the frame draws nothing of its own. A `yetiBorder` edge is the `box` spec's. No state is drawn, so no package CSS applies (building-blocks 1.10).

**Ledger rows owned:** none (Part 2 row 8). The frame's two accessibility notes are Yeti's own documented requirements on content, not gaps in Yeti, and the text-clipping rule follows the `masonry` row's shape, a usage rule for a risk the author owns with no ledger row (Part 2 row 12; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 37).

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<div yetiFrame ratio="16/9" class="photo">
  <img ngSrc="photo.jpg" fill alt="A lake at dawn, cropped to sixteen by nine" />
</div>
```

The image is `NgOptimizedImage` in `fill` mode, and the consumer's own stylesheet gives `.photo` `position: relative` (usage rule 6; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 35).

Server HTML and the hydrated DOM are the same. The `div` carries the consumer's static attributes as Angular renders them (`yetiframe=""`, `ratio="16/9"`, and the class `photo`), and from the package the class `frame`, `data-ngx-yeti-item-frame=""`, and `data-ratio="16/9"`. The server also writes one item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>layouts/frame/frame.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="frame"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts it at bootstrap.

A frame with no `ratio`, `<div yetiFrame>`, renders `class="frame"` and `data-ngx-yeti-item-frame=""` and no `data-ratio`, and Yeti's default ratio applies.

The delta from Yeti's docs markup: the consumer writes `yetiFrame` and `ratio` where the docs write the class and `data-ratio`, and `yetiBorder` where they write `data-border`. The frame has no closed or open state.

### 9. Animation

None. The frame has no state and no transition, and Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). A consumer may put the `enter` utility's directive beside a frame and may remove a frame with a class-form `animate.leave`; the item link stays until Angular removes the host, because removal waits for the DOM (ADR 0060 point 4). A server-rendered frame never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static class, `data-ngx-yeti-item-frame`, and a bound `data-ratio`, plus the item link in `<head>` (section 8). With the item file in the server HTML, the frame reserves its shape before the media loads, which is the "should not reflow the page while it loads" Yeti promises (`docs.md`). No value is **Pre-hydration state**: no person and no Module changes `data-ratio` (ticket 26 Q12; ADR 0003 point 4).
- **Before hydration:** the directive creates no node, reads no layout, starts no timer or observer, and touches no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). Its only constructor work is the item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** the element is claimed as is; the binding computes the same value; 0 style mutations (ADR 0060 point 5, measured for the mechanism). The child's own static attributes are written again by hydration, which reloads an `iframe` and a `video` with a `src` attribute (usage rule 7; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 36).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the frame, its child, and the link; a dehydrated host holds the link through `data-ngx-yeti-item-frame` for as long as it is on the page (ADR 0060 point 4; ADR 0045). A bound `ratio` changes only after the block hydrates. Inside a not-yet-hydrated block, the child's attributes are not rewritten until the block hydrates.
- **`hydrate never`:** the frame is its server HTML and keeps its shape while the host is connected, whatever live frames do (ADR 0060 point 4; ADR 0045). There is no behaviour to lose; a bound value stays at its server value, and the media are the platform's.
- **Client-only `@defer`:** `YetiFrame` fetches the item file when it is constructed, so an image can show at its own size and shift the layout for a few frames; the consumer closes the gap with `provideYetiStyles({ preload: ['frame'] })` (ADR 0060 point 6; [setup](setup.md)).
- **Event replay:** the directive declares no listener, so nothing replays and no `jsaction` is added.
- **`withI18nSupport()`:** the `alt` and `title` inside a frame are the consumer's and usually carry `i18n-alt` and `i18n-title`; the directive adds no `i18n` block. The consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** the value is an `input()` signal read by a host binding, the form ticket 18 measured refreshing zoneless (ADR 0070 rule 4; map, Standing rulings, item 43).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the frame has its shape and its media fill and crop, because the attribute and the item link are in the server HTML. An `iframe`, `video`, or `object` works as the platform makes it work. Nothing is lost: the item has no behaviour. A client-only application gets no such promise.
- **Hydration boundary:** a frame may sit in any boundary; it has no parts and no references.

### 11. Hydration constraints

The item complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and item attribute are static, and the `data-ratio` binding reads the same input value on both.
- **No direct DOM manipulation:** the directive writes nothing outside host bindings. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directive changes no element. A `div` frame inside a `p` would be invalid HTML; the consumer's element stays as written, and Yeti's examples use a `div`.
- **`preserveWhitespaces`:** the directive has no template.
- **No output branched on the platform:** none.
- **Static attributes the directive binds:** usage rule 1 keeps the consumer from writing them, because an unset input's removal of a static attribute is undone and redone at hydration (ADR 0070's 2026-10-03 note). The child's static attributes are the consumer's, and usage rule 7 covers what their rewrite does to embedded media.

### 12. Single-page application

None. The item has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). On a route change, a route's frames leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-frame]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders a frame again re-inserts it.

### 13. Item file

`yeti-css/css/layouts/frame/frame.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiFrame]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:26`, the rank table of point 3), and removed after the last `[data-ngx-yeti-item-frame]` host has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns, optionally with `provideYetiStyles({ preload: ['frame'] })`. Cross-item files acquired: none (`frame.css` has no cross-item rule; ADR 0060 point 9). The `data-ratio` values are in the always-loaded `attributes.css`, so they need no file of their own.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attribute in the DOM, the item link, the computed shape, how the child fills or is centred, and the names axe checks. It never asserts a private field or how the styles service counts. No test hard-codes Yeti's default ratio or reads a private token ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): a frame's shape is asserted as its rendered width over height against the value its `ratio` names, within one pixel, and the unset frame against the `data-ratio` default read from the built manifest at the pin (`dist/yeti.manifest.json`). Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `frame` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**), which covers `image-alt`, `frame-title`, and `object-alt`. Every image is a local asset in the Storybook build, so no story depends on the network. Story ids:

- `frame--default`: Yeti's example. Asserts `class="frame"`, `data-ngx-yeti-item-frame`, and `data-ratio="16/9"` on the `div`, no `tabindex`, and no `role` attribute from the package. Asserts the frame's rendered ratio is 16/9 and the `img` box equals the frame's box with computed `object-fit: cover`.
- `frame--ratios`: a frame per value of `YetiRatio` and one with no `ratio`, each holding a portrait image. Asserts each rendered ratio, the unset frame against the manifest's default, and that no `data-ratio` is rendered for it. Toggling a bound `ratio` to `undefined` removes `data-ratio`.
- `frame--media`: one frame each with a `picture` (with a `source`), a `video` with `<source>` children and `controls`, an `iframe` with a `title` and `srcdoc`, and an `object` with fallback text. Asserts each child's box equals the frame's, the `iframe`'s computed border width is 0, and the `video`'s controls are reachable by Tab.
- `frame--centred`: a frame holding an inline `svg` icon with `aria-hidden="true"`. Asserts the icon's centre equals the frame's centre within one pixel and its size is its own.
- `frame--bordered`: Yeti's docs map, `yetiFrame` with `yetiBorder` and `ratio="4/3"`, and a second with `--yeti-color-border` set inline on the frame. Asserts the border colour equals a probe element whose inline style reads the same token.
- `frame--composed`: Yeti's breakout example (`yetiFrame yetiBreakoutChild ratio="21/9" bleed` in a `yetiBreakout`), the media object from primitives (a `yetiSidebar` whose first child is a `1/1` frame), and the layouts guide's card (a bordered box holding a stack with a `4/3` frame). Asserts each frame keeps its ratio and the breakout frame spans the breakout's full width.
- `frame--with-caption`: a `figure` holding a frame and a `figcaption` beside it, the form usage rule 5 names.
- `frame--optimized-image`: `NgOptimizedImage` with `fill` in a frame with `position: relative`, and with `width` and `height` (usage rule 6). Asserts the image box equals the frame's in both and records the development-mode console warnings each form logs ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 35).

### Layer 2: browser-level (`npx nx test <lib>`, `frame.spec.ts`)

Through `TestBed.createDirective(type, { tagName, bindings })` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `YetiFrame` on a `div`: class `frame` and `data-ngx-yeti-item-frame`; with no bindings, no `data-ratio`; with a `bindings` entry for `ratio`, `data-ratio` carries each of the five values, and setting the bound signal to `undefined` removes it after `whenStable()`;
- while the fixture lives, one `<link data-ngx-yeti-styles="frame">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed;
- the directive leaves no listener on its host.

A small test host covers what `createDirective` cannot: the template reference resolves to the instance, the consumer's own `class` is kept beside `frame`, and `yetiFrame` beside `yetiBorder` and `yetiBreakoutChild` renders `class="frame"`, `data-border`, and `data-bleed` together.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `frame.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture whose frame holds an `img` with `i18n-alt` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the frame renders `class="frame"`, `data-ngx-yeti-item-frame`, and `data-ratio="4/3"`; a frame with no `ratio` renders no `data-ratio`; `<head>` holds exactly one item link with `data-ngx-yeti-styles="frame"`, `data-beasties-skip`, and an `href` ending `layouts/frame/frame.css?v=<pin>`; no element carries `jsaction`.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `frame` has `YetiFrame`; `data-ratio` has `ratio` with `YetiRatio`; the frame has no markers and no events. A pin move that adds a ratio or an attribute fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

On the fixture app, built with `outputMode: 'server'`, with a `/frame` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences):

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- with JavaScript disabled each frame has its ratio and its image fills and crops, and `@axe-core/playwright` with the six tags reports no violation;
- a frame route's image area has a layout-shift score of 0 while the image loads, with the item link in the server HTML;
- a frame holding an `iframe` with `srcdoc`, and one holding a `video` with a `src` attribute and one with `<source>` children: the test counts each embed's `load` or `loadstart` events across hydration and records whether hydration reloads it (usage rule 7; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 36);
- a frame inside a client-only `@defer` block with `frame` in the preload list shows its image cropped in its first frame; a frame inside a `hydrate never` block keeps its ratio after the live frames on the page are removed;
- navigating from the frame route to a route without a frame removes the item link, and navigating back re-inserts it;
- at a 320 px viewport a `21/9` frame causes no horizontal overflow (1.4.10).

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html`, `docs.md`, and the layouts guide's card for the stories; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; ticket 33's C2 probe for counting an `iframe`'s loads; the [box](box.md) and [lede](lede.md) specs' probe pattern.

## Out of Scope

- An input per token, a ratio beyond Yeti's vocabulary, an `object-fit` or `object-position` input, or a theme (ADR 0004). A consumer sets `object-position` on the media with their own style.
- A Part directive for the frame's child, or any wrapping of `NgOptimizedImage`.
- Making an embed load once under hydration; usage rule 7 documents it, and any package mechanism for it would be a new decision.
- A check that a frame has one child, that its image's `alt` fits the crop, that an `iframe` has a `title`, or that no text sits inside a frame. Checks belong to a later milestone (map, Milestones); the usage rules state them, and axe covers `alt` and `title` presence in the stories.
- `data-border` and its rules, the [box](box.md) spec's `yetiBorder`.
- `ratio` on `hero`, `media`, and `card`, owned by their specs.
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| One item directive `[yetiFrame]`, entry point `ngx-yeti/frame` | building-blocks Part 2 row 8; [Decide: the spec list](../issues/11-decide-spec-list.md) row 8 and Q9 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| `ratio` as a root input typed by Yeti's `YetiRatio` | ticket 26 row 30; ADR 0070 R; ADR 0005 |
| Unset `ratio` renders nothing; Yeti's `16/9` comes from its CSS | ADR 0070 rule 1 |
| No Part directive for the one child | manifest `children` (unmarked); ticket 26 (no child row) |
| Class `YetiFrame` (free at the Pin) | ADR 0080 point 4 |
| `exportAs`; secondary entry point | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 8 |
| Item file as a counted link; presence attribute `data-ngx-yeti-item-frame` | ADR 0060 points 2 to 6; ADR 0045 |
| `injectYetiItemStyles('frame')` last in the constructor | [setup](setup.md); ticket 50 decisions 42 and 45 |
| No ledger row | Part 2 row 8; the `masonry` precedent, Part 2 row 12; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 37 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |
| `NgOptimizedImage` in `fill` mode with a positioned frame | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 35 |
| Embedded media under hydration: `<source>` children for video, the `iframe` reload documented | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 36 |

### Usage examples

A card thumbnail from Yeti's layouts guide, in a bordered box with a stack:

```html
<div yetiBox yetiBorder>
  <div yetiStack gap="sm">
    <div yetiFrame ratio="4/3" class="thumb">
      <img ngSrc="trail.jpg" fill alt="A mountain trail at dawn, cropped to four by three" i18n-alt />
    </div>
    <h3 i18n>Weekend in the hills</h3>
    <p i18n>Six miles, one summit, and a view worth the early start.</p>
  </div>
</div>
```

```ts
import { NgOptimizedImage } from '@angular/common';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { YetiFrame } from 'ngx-yeti/frame';
import { YetiStack } from 'ngx-yeti/stack';

@Component({
  selector: 'app-trail-card',
  imports: [NgOptimizedImage, YetiBox, YetiBorder, YetiStack, YetiFrame],
  templateUrl: './trail-card.html',
  styleUrl: './trail-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrailCard {}
```

```css
/* NgOptimizedImage's fill mode needs a positioned parent (usage rule 6; ticket 50 decision 35) */
.thumb {
  position: relative;
}
```

A video embed that keeps the page still while it loads, with a title and static security attributes:

```html
<div yetiFrame>
  <iframe
    src="https://player.example/v/42"
    title="Product tour, two minutes"
    allow="fullscreen; picture-in-picture"
    loading="lazy"
    i18n-title
  ></iframe>
</div>
```

A square avatar from `NgOptimizedImage` in `fill` mode, with the frame positioned in the consumer's stylesheet (usage rule 6):

```html
<div yetiFrame ratio="1/1" class="avatar">
  <img ngSrc="ada.jpg" fill alt="Portrait of Ada Lovelace" />
</div>
```

```css
.avatar {
  position: relative;
}
```

A picture that bleeds out of a reading column: `<div yetiFrame yetiBreakoutChild ratio="21/9" bleed>`. A ratio from state: `<div yetiFrame [ratio]="wide() ? '21/9' : '4/3'">`. A captioned photo: a `figure` holding the frame and a `figcaption`. A value newer than the pin: `<div yetiFrame [ratio]="$any('2/1')">`. A page whose frame renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['frame'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `layouts/frame/frame.css`, loaded by `YetiFrame` as a counted link (section 13). The consumer writes nothing for the frame beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps the five `data-ratio` values to `--_yeti-aspect` (`:221-226`) and holds the `data-border` marker rule (`:462-465`); `base/reset.css` makes an image a fluid block (`Y/src/guides/base.md:403`).
3. **Cross-item rules:** none in `frame.css`. Yeti's `hero`, `media`, and `card` crop their own media with their own rules and do not load `frame.css` (`Y/src/recipes/hero/hero.css`, `media.css`, read).
4. **Tokens:** reads only the private `--_yeti-aspect`; writes none (section 2).
5. **What breaks without the item file:** the frame has no ratio and does not clip, so the media shows at its own size and shape, the page reflows when it loads, and an `iframe` keeps the browser's border; a non-media child is not centred. `data-ratio` sets a private property nothing reads. There is no error.
6. **Tailwind name collision:** none known. building-blocks 1.13 lists `container`, `grid`, `table`, and `hidden`, not `frame`; Tailwind's ratio utilities are named `aspect-*` (that Tailwind generates no `.frame` is inferred, not measured).

### Platform features to adopt when the browser target moves

None. `frame.css` uses flexbox, `aspect-ratio`, `overflow`, `object-fit`, and logical sizes, all inside Baseline 2025 (manifest `support`; building-blocks 1.2).

### Single-page-application pieces relied on

None: the item uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
