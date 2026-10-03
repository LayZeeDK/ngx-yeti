# Spec: box (layout)

Ticket: [51. Spec: box (layout)](../issues/51-spec-box.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 1 and Part 1, [Decide: the spec list](../issues/11-decide-spec-list.md) row 1 and Q9, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 1 to 7 and Q10, Q16, [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at 22.2.x. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 10 and 29 to 31), and each is cited where it applies.

## Problem Statement

Yeti's `box` is "the thing to reach for when content needs breathing room from its edges: a card body, a callout, a panel in a sidebar" (`Y/src/layouts/box/docs.md`). It is one **Identity class**, `box`, with four **Attributes**: `data-gap` for padding on every side, `data-gap-inline` and `data-gap-block` for one axis over it, and `data-surface` for one of three fills (`Y/src/layouts/box/manifest.json`). Its manifest also declares three **Markers** that work on any element, `data-border`, `data-paint`, and `data-text`, "because it is a box's most common marker" (manifest, `data-border`). Their rules are not in `box.css` but in the **Always-loaded group**'s `layouts/attributes.css` (`Y/src/layouts/attributes.css:403-466`). The box has no **Module** and no **Event**.

An application developer using the package cannot write `class="box"`, `data-surface="raised"`, or `data-paint="primary"`: a consumer writes no Yeti class and no Yeti `data-*` attribute, and directives set them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). A misspelt `data-surface="rasied"` or `data-paint="primray"` is silent in plain Yeti; the package turns it into a compile error ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `box` **Item file** loaded while a box is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)), while the three markers, whose rules are always loaded, must load nothing.

Two accessibility facts come with the markers. Yeti's own colour guide says that on the middle greys, `grey-40` to `grey-60`, "no text color reaches full contrast" (`Y/src/guides/color.md:80`), and `data-text` puts any colour of the list on whatever background the element has. Neither is something a directive can read or fix.

## Solution

One **Item directive** and three any-element marker directives, all in the secondary entry point `ngx-yeti/box` (building-blocks Part 2 row 1; [Decide: the spec list](../issues/11-decide-spec-list.md) Q9):

- `YetiBox`, selector `[yetiBox]`, `exportAs: 'yetiBox'`. It binds `box` as a static host class, sets `data-ngx-yeti-item-box` on its host, acquires the `box` item file when it is created (on the server too) and releases it when it is destroyed ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); ADR 0060 point 2), through `injectYetiItemStyles('box')` from `ngx-yeti/styles` as the last statement of its constructor ([setup](setup.md); ticket 50 decisions 42 and 45). It has four inputs, `gap`, `gapInline`, `gapBlock` (`YetiGap`) and `surface` (`YetiSurface`), each bound as its `data-*` attribute and rendering nothing when unset.
- `YetiBorder`, selector `[yetiBorder]`, `exportAs: 'yetiBorder'`, input `yetiBorder` (`boolean`, `booleanAttribute`): `<div yetiBorder>` renders `data-border`.
- `NgxYetiPaint`, selector `[yetiPaint]`, `exportAs: 'yetiPaint'`, required input `yetiPaint` (`YetiPaint`): `<section yetiPaint="primary">` renders `data-paint="primary"`. Its class takes `NgxYeti` because Yeti's typings export a type named `YetiPaint` (ADR 0080 point 4, section 4).
- `YetiText`, selector `[yetiText]`, `exportAs: 'yetiText'`, required input `yetiText` (`YetiPaint`): `<p yetiText="grey-70">` renders `data-text="grey-70"`.

The three marker directives bind no class, set no item attribute, and acquire no item file, because their rules live in the always-loaded `attributes.css` (Part 2 row 1; [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) kind G). They work on any element, a box or not.

Everything else is Yeti's CSS and the platform. Every value is a host binding on an input signal, so the server HTML is Yeti's documented markup, the box renders the same before hydration, after it, with JavaScript off, and inside any `@defer` or hydrate block. The package writes no **Token** and offers no input per token ([ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md)).

The contrast facts become usage rules, an **Anti-pattern story**, and play-function assertions with the exact WCAG formula ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) points 2 to 4).

## User Stories

1. As an application developer, I want to pad an element with one directive attribute, so that I never write Yeti's `box` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="box"` in the DOM, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want to set the padding with a typed `gap` input, so that a misspelt stop such as `"mdd"` fails to compile.
4. As an application developer, I want a box with no `gap` to get Yeti's default padding, so that the plain directive does something useful.
5. As an application developer, I want the package not to write Yeti's default `md` into my markup, so that a pin move that changes Yeti's default reaches my page.
6. As an application developer, I want `gapInline` and `gapBlock` to pad one axis over whatever `gap` set, so that a band can be wide at the sides and ordinary top and bottom.
7. As an application developer, I want the fluid pairs (`"sm-lg"`) accepted by every gap input, so that padding can grow with the page as Yeti's vocabulary allows.
8. As an application developer, I want to fill a box with `surface="raised"`, `"sunken"`, or `"base"`, so that I get a visible panel in the page's own tones.
9. As an application developer, I want a box with no surface to stay transparent, so that a box on an existing surface only adds room.
10. As an application developer, I want to draw a border on any element with `yetiBorder`, so that a box, a figure, or a list can carry Yeti's border without a box.
11. As an application developer, I want `[yetiBorder]="isSelected()"` to add and remove the border, so that I can draw it from state.
12. As an application developer, I want to paint any element with `yetiPaint="primary"`, so that the background and the text made for it come from one name.
13. As an application developer, I want to colour an element's words with `yetiText`, so that I can set text colour by name without a class.
14. As an application developer, I want `yetiText` to win over the automatic text of a painted element, so that I can pick the words' colour on a band, as Yeti documents.
15. As an application developer, I want `yetiPaint` and `yetiText` to require a value, so that a bare `yetiPaint` with no colour fails to compile instead of rendering nothing.
16. As an application developer, I want the marker directives to load no stylesheet, so that painting a span costs no request.
17. As an application developer, I want the `box` item file loaded when the first box renders and removed after the last leaves, so that I do not import `box.css` globally.
18. As an application developer, I want the item file in the server HTML when a server-rendered page has a box, so that the first paint is padded.
19. As an application developer, I want boxes and markers styled with JavaScript off under SSR and prerendering, so that the page reads correctly before any script runs.
20. As an application developer, I want hydration to change nothing on a box or a marker, so that I get no `NG05xx` error and no flash.
21. As an application developer, I want every input to work under zoneless change detection, so that a bound `surface` or `yetiPaint` updates without zone.js.
22. As an application developer, I want a box inside a `hydrate never` block to keep its padding for as long as it is on the page, so that a dehydrated block is not unstyled when a live box elsewhere leaves.
23. As an application developer, I want to know that a box inside a client-only `@defer` block needs `box` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
24. As an application developer, I want a box that leaves under my class-form `animate.leave` to keep its padding until Angular removes it, so that the leave animation is not unstyled.
25. As an application developer using `withI18nSupport()`, I want translated content inside a box to hydrate without being re-rendered, so that localised pages keep the server's DOM.
26. As an application developer, I want to compose `yetiBox` with another layout on one element (`<div yetiCenter yetiBox gap="lg">`), so that one `gap` binding feeds both, as Yeti's one attribute does.
27. As an application developer, I want `yetiBox`, `yetiBorder`, and `yetiStack` on one element or nested, so that I can build Yeti's documented panel (a raised, bordered box holding a stack).
28. As an application developer, I want to bind a value newer than the pin through the input with `$any`, so that I know the escape hatch when Yeti adds a value before the package does.
29. As an application developer, I want my own classes and attributes on the host kept, so that I can add application classes beside the directives.
30. As an application developer, I want template references (`#b="yetiBox"`, `#p="yetiPaint"`), so that the directives follow the package's `exportAs` rule.
31. As an application developer, I want to import all four directives from `ngx-yeti/box`, so that a `@defer` block can split them with the rest of the item.
32. As an application developer, I want the usage rules stated (no static Yeti attributes, `yetiBorder` not on a table, no text on the middle greys, readable `yetiText` colours), so that I use the box as Yeti intends.
33. As an application developer, I want to set the default padding and the three surface tones with Yeti's tokens in my stylesheet, so that my theme controls them.
34. As an application developer, I want a painted band to keep its colours on paper, so that its words, chosen for its background, still read when printed (Yeti's `print-color-adjust`).
35. As an application developer using Tailwind v4 beside the package, I want to know whether `box` collides with a Tailwind name, so that I can plan my cascade-layer statement.
36. As a screen-reader user, I want a box to add no role and announce nothing, so that the page reads as its own sections and paragraphs.
37. As a keyboard user, I want boxes and markers to add no tab stop, so that focus moves only to interactive content.
38. As a low-vision user, I want text on every painted element and every `yetiText` colour in the package's stories to meet 4.5:1 in light and dark schemes, so that I can read it.
39. As a low-vision user, I want a link inside a painted band to take the band's text colour, so that it does not turn primary on primary.
40. As a low-vision user, I want boxes to reflow at 320 CSS pixels, so that padding never forces horizontal scrolling.
41. As a low-vision user who overrides text spacing, I want a box to grow rather than clip, so that my spacing settings keep its content visible.
42. As a forced-colours user, I want a bordered box to keep its edge, so that a panel the author bordered stays a panel.
43. As a package maintainer, I want the contract check to cover the box's class, four attributes, three markers, and their unions, so that a pin move that adds a value or a marker fails before release.
44. As a package maintainer, I want the SSR smoke to assert the server HTML of a box with every input and of each marker, so that the first paint is proven.
45. As a package maintainer, I want the fixture app to render a box route prerendered and server-rendered, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
46. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default does not fail a test for no reason.
47. As a package maintainer, I want every exported class name checked against Yeti's typings at the pin, so that a collision such as `YetiPaint` is caught.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/layouts/box/manifest.json`, `box.css`, `docs.md`, and `example.html`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `box`, `layout`, `Boxes and Stacks` |
| `class` | `box` |
| `attributes` | `data-gap` (enum, vocabulary `gap`, 29 values, default `md`); `data-gap-inline` and `data-gap-block` (enum, `gap`, no default); `data-surface` (enum, vocabulary `surface`: `base`, `raised`, `sunken`; no default) |
| `classes`, `children` | empty |
| `markers` | `data-border` (boolean, `on: "*"`); `data-paint` (enum, vocabulary `paint`, 20 values, `on: "*"`); `data-text` (enum, `paint`, `on: "*"`) |
| `tokens` | `--yeti-space-md` (public, the default padding); `--yeti-color-surface`, `--yeti-color-surface-raised`, `--yeti-color-surface-sunken` (public, the three fills); `--_yeti-gap` (private) |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "Purely visual. A box has no semantics; use a section or article element when the content is one." |
| `js` | `null`: no Module, no Events |
| `support` | `unguarded` and `guarded` both empty |
| `since` | `7.0.0` |

`box.css`, in `@layer yeti.layouts`, pads `.box` with `--_yeti-gap`, sets it to `--yeti-space-md` when `data-gap` is absent, adds `padding-inline` and `padding-block` when `data-gap-inline` or `data-gap-block` is present, and fills `.box[data-surface=...]` with the three surface tokens (`box.css:4-18`). It has no corner radius, on purpose: "a rounded panel that lifts off the page is a `card`" (`docs.md`). The values of all three gap attributes are mapped to private properties in the always-loaded `attributes.css` (`:5-37`, `:44-75`, `:78-109`), which Yeti did "rather than read by box.css so the fluid pairs are written once" (`:40-43`). The three markers' rules sit in `@layer yeti.utilities` in the same file: `data-paint` sets a background and the text made for it, `data-text` sets the words and wins over paint at equal specificity, a plain link (`a:not([class])`) or `figcaption` inside a painted or texted element inherits its colour, a painted element keeps its colours in print, and `[data-border]:not(.table)` draws `--yeti-border-width` in `--yeti-color-border` (`:403-466`). The box's example is a `section` with `data-gap="lg" data-surface="raised" data-border` (`example.html`).

Attributes left to the consumer: none ([ticket 26](../issues/26-decide-yeti-data-attributes-mapping.md): "no row is a static attribute the consumer writes, and none is left to the consumer").

### 2. Contract mapping

| Contract piece | Yeti | Package | Record |
| --- | --- | --- | --- |
| Identity class | `box` | static host class on `[yetiBox]` (`YetiBox`) | ADR 0003 point 1; Part 2 row 1 |
| Attribute `data-gap` | padding on every side; default `md` | `gap` on `yetiBox`: `YetiGap`, unset renders nothing | ticket 26 row 1 (R); ADR 0070 rule 1 |
| Attribute `data-gap-inline` | padding on the two sides over `data-gap` | `gapInline` on `yetiBox`: `YetiGap` | ticket 26 row 2 (R) |
| Attribute `data-gap-block` | padding top and bottom over `data-gap` | `gapBlock` on `yetiBox`: `YetiGap` | ticket 26 row 3 (R) |
| Attribute `data-surface` | one of three fills; absent, transparent | `surface` on `yetiBox`: `YetiSurface` | ticket 26 row 4 (R) |
| Marker `data-border` (`on: "*"`) | a border in the border colour, on any element but a table | `yetiBorder` on `[yetiBorder]` (`YetiBorder`): `boolean` with `booleanAttribute`; `true` renders `data-border=""`, `false` renders nothing | ticket 26 row 5 (G); ADR 0070 kind G |
| Marker `data-paint` (`on: "*"`) | a background by name, with its text | `yetiPaint` on `[yetiPaint]` (`NgxYetiPaint`): `YetiPaint`, required | ticket 26 row 6 (G) |
| Marker `data-text` (`on: "*"`) | the words' colour by name | `yetiText` on `[yetiText]` (`YetiText`): `YetiPaint`, required | ticket 26 row 7 (G) |
| Children | none | none | manifest `children: []` |
| Events | none | no output | manifest `js: null`; [events](events.md) |
| Token `--yeti-space-md` | the default padding | the consumer's; the package writes none | ADR 0004 |
| Tokens `--yeti-color-surface`, `-raised`, `-sunken` | the three fills | the consumer's | ADR 0004 |
| Tokens read by the markers (`--yeti-border-width`, `--yeti-color-border`, the six hues and their `--yeti-on-*` pairs, `--yeti-white`, `--yeti-black`, `--yeti-grey`, `--yeti-grey-0` to `-100`, `--yeti-color-text`) | not in the box's manifest; read by `attributes.css:403-466` | the consumer's | ADR 0004 |
| Private token `--_yeti-gap` | Yeti's | never read or written | ADR 0004; CONTEXT.md **Private token** |
| Host attribute (package) | not Yeti's | static `data-ngx-yeti-item-box` (empty value) on `[yetiBox]` only | [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); ADR 0080 point 2 |

No input name lowercases to an HTML attribute (`gap`, `gapinline`, `gapblock`, `surface`, `yetiborder`, `yetipaint`, `yetitext`), so building-blocks 1.4's presentational-attribute kinds have nothing to apply to.

**Module replaced:** none. Yeti's `box` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 1, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The box reads the four manifest tokens; the markers read the colour and border tokens above. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`. The surface and border tokens are derived colour roles and may also be set on any element; hues, chroma, and the scale stay on `:root` (`Y/src/guides/theming.md:38`). The scheme is the consumer's `color-scheme` (building-blocks 1.13).

### 3. Hierarchy and DI shape

None. The four directives are standalone. None provides an **Injection token**, injects a parent, hosts a directive, or is hosted: no Yeti item always sits on another item's element (Part 2, "Two findings that hold across the matrix"). They are written beside each other on one element (`<section yetiBox yetiBorder yetiPaint="primary">`), and beside other items (`<div yetiCenter yetiBox>`, `<section yetiSeam yetiBox>` for a band whose padding keeps a child's focus ring inside the seam's clip ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 189; architecture-guide P6), Yeti's `center box`), as building-blocks 1.9 has composed items. Two directives that declare the same input name share its type: `gap` is `YetiGap` on `yetiBox` and on every other layout that reads the vocabulary, so one binding feeds both and both render the one `data-gap` Yeti means (building-blocks 1.4, shared vocabularies; ticket 26 Q16). The marker inputs are selector-named, so no other directive's input on the element receives their value (ADR 0070, considered options).

The only injection is `YetiBox`'s use of the root styles service of ADR 0060, through `injectYetiItemStyles('box')` from `ngx-yeti/styles` ([setup](setup.md); ticket 50 decisions 42 and 45), which acquires and releases the `box` item file. That service is the [setup](setup.md) spec's (`provideYetiStyles()`) and ADR 0060's. The marker directives inject nothing.

Generated ids and the platform's relationship attributes: none. Nothing here renders or references an `id`, so the item does not use [generated-ids](generated-ids.md).

### 4. API

**`YetiBox`**

| Member | Value |
| --- | --- |
| Class | `YetiBox`. Checked at the Pin: the 46 names of `yeti.d.ts` include no `YetiBox` (ADR 0080 point 4; Yeti's built `dist/yeti.d.ts` at the pin, which ADR 0080 used) |
| Selector, `exportAs` | `[yetiBox]`, `yetiBox` (Part 2 row 1; building-blocks 1.3) |
| Host | `class: 'box'`; `'data-ngx-yeti-item-box': ''` (static); `[attr.data-gap]`, `[attr.data-gap-inline]`, `[attr.data-gap-block]`, `[attr.data-surface]` from the inputs, `null` when unset |
| Inputs | `gap`, `gapInline`, `gapBlock`: `YetiGap \| undefined`; `surface`: `YetiSurface \| undefined`; all default `undefined` (ADR 0070 rule 1). Yeti's default for `data-gap` is `md` and applies from its CSS |
| Models, outputs, methods | none |
| Lifecycle | `injectYetiItemStyles('box')` is the last statement of its constructor, after anything there that can throw (nothing does today); it acquires `box`, on the server too, and releases it on destroy, through `DestroyRef` (ADR 0060 point 2; building-blocks 1.9; [setup](setup.md); ticket 50 decisions 42 and 45) |

**`YetiBorder`**, **`NgxYetiPaint`**, **`YetiText`**

| Member | `YetiBorder` | `NgxYetiPaint` | `YetiText` |
| --- | --- | --- | --- |
| Selector, `exportAs` | `[yetiBorder]`, `yetiBorder` | `[yetiPaint]`, `yetiPaint` | `[yetiText]`, `yetiText` |
| Input | `yetiBorder: boolean`, `booleanAttribute`, default `false` | `yetiPaint: YetiPaint`, required | `yetiText: YetiPaint`, required |
| Host | `[attr.data-border]`: `''` when true, `null` when false | `[attr.data-paint]` | `[attr.data-text]` |
| Class, item attribute, item file | none | none | none |

Why `NgxYetiPaint`: `yeti.d.ts` at the Pin exports `type YetiPaint`, the `paint` vocabulary type (`:15`), which is also this item's input type and which the package re-exports from its generated types module (ADR 0060 point 10). ADR 0080 point 4 says "The same test applies to every TypeScript name the package exports, not only item classes", so the class takes `NgxYeti`; the selector and `exportAs` keep `yeti`. ADR 0080's list of five counts item classes only; `NgxYetiPaint` is the sixth collision, from a marker directive, and the name-collision test covers every exported name against all 46 names `yeti.d.ts` exports ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 10, recorded as notes on ADR 0080 and building-blocks 1.3). `YetiBorder` and `YetiText` were checked against the same 46 names and are free.

Why the two colour inputs are required: ticket 26 rows 6 and 7 type them "(required)", and `data-paint` and `data-text` have no default to fall back to, so a bare attribute would render nothing.

**Usage rules** (numbered here and in each directive's JSDoc; the first milestone reports no breach, map, Milestones):

1. Write `yetiBox` where Yeti's docs write `class="box"`, and bind the four inputs where they write the attributes. Do not write `class="box"`, a static `data-gap`, `data-gap-inline`, `data-gap-block`, `data-surface`, `data-border`, `data-paint`, `data-text`, or `data-ngx-yeti-item-box` on a host: the directives bind them, and hydration writes a static attribute again before the binding wins (ADR 0003; ADR 0070's 2026-10-03 note; building-blocks, "Hydration constraints (2026-10-03)"). A value newer than the pin is bound as `[surface]="$any('new')"` (ADR 0070).
2. A box adds no semantics. Use a `section` or `article` when the content is one, as Yeti's manifest says (`a11y.notes`); the directive changes no element.
3. Do not put `yetiBorder` on a `table[yetiTable]`. Yeti's border marker skips `.table`, and the table's own `data-border` means cell borders; use the table's `border` input (ticket 26 Q16; `attributes.css:462-465`).
4. Do not put text on `yetiPaint="grey-40"`, `"grey-50"`, or `"grey-60"`. Yeti: "The middle steps, `grey-40` to `grey-60`, suit a fill more than a block of text: no text color reaches full contrast on them" (`Y/src/guides/color.md:80`). Use them for fills without text (ADR 0015 point 4).
5. A `yetiText` colour must reach 4.5:1, at any text size (ticket 50 decision 8), against the background it sits on. The package cannot read the background, so this is the author's (ADR 0015 point 4). A `yetiText` value on a painted element replaces the colour Yeti chose for that background.
6. Inside a painted element, a link that carries any class keeps its own colour, because Yeti's inheritance rule matches only `a:not([class])` (`attributes.css:450-451`). A package directive that binds a class on a link (`yetiButton`) keeps its own colours by design; a link with an **Application class** inside a band takes `yetiText` to stay readable.
7. Import each directive in every component whose template writes its attribute. A **Forgotten import** of `YetiBox` or `YetiBorder` with no bound input renders the bare element with no error; a bound input, or `yetiPaint` and `yetiText` with their required input, makes the compiler report it (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `box` and markers | Nearest in Angular Material |
| --- | --- | --- |
| Shape | attribute directives on the consumer's element | `mat-card`, a component with its own element and content slots (`NC/src/material/card/card.ts`) |
| Fill and edge | `surface` (three page tones), `yetiBorder`, `yetiPaint`; square corners | `appearance: 'outlined' \| 'raised' \| 'filled'` (`card.ts:18`), rounded, with elevation |
| Padding | `gap`, `gapInline`, `gapBlock` from Yeti's `gap` vocabulary | fixed by the card's content parts; no padding input |
| Accessibility | none of its own: purely visual | none of its own |
| API | inputs and `exportAs` | one input and a defaults token |

Nothing from Material's API is adopted: Yeti's own docs keep the box apart from the `card` ("the two should not blur into each other", `docs.md`), and Material's nearest piece is a card. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 1; building-blocks 1.2). The reason: "Yeti's CSS does the whole job; the directive adds the class, typed attributes, and `exportAs`" (row 1). No Aria pattern applies (a box has no role), and no CDK piece is used: there is no id, focus, keyboard, direction, or observer. Yeti's CSS is logical (`padding-inline`, `padding-block`), so right-to-left needs nothing from the package.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. No role, state, or property; no tab stop.
- **Keyboard:** none.
- **Names:** none. The directives name nothing and are named by nothing.

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The box adds no semantics (manifest `a11y.notes`); a sectioning element is the consumer's (usage rule 2). Fill, border, and paint carry no meaning the DOM must also carry; where an author uses a colour to mean something, the text must say it. |
| 1.4.1 Use of Color | Not met by the directives and not claimed: a status shown only by `yetiPaint="alert"` is the author's to also state in text, a requirement on content the directives cannot read (ADR 0015 point 4). Stories that show a coloured band put its meaning in its words. |
| 1.4.3 Contrast (Minimum) | Each hue paints its base colour with the `--yeti-on-<hue>` text made for it; the constants take the constant that reads on them; greys up to `grey-40` take the page text and from `grey-50` the page surface (`attributes.css:390-402`). Yeti itself says the middle greys reach no full contrast (`color.md:80`), and `yetiText` can put any colour on any background. So: usage rules 4 to 6, the **Story gate** on every story, and play functions that compute every shown painted and texted pair with the exact WCAG formula, unrounded, in the light and dark schemes, asserting at least 4.5:1 (ADR 0015 point 3). The middle-grey case is shown only in the anti-pattern story (ADR 0015 point 2). The gap is [ledger](../ledger.md) row A11Y-21, owned by this spec ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 29). |
| 1.4.10 Reflow | Padding is from Yeti's fluid space tokens in `rem`-based stops and sets no minimum width. Layer 4 asserts no horizontal overflow at a 320 px viewport for a box with `gap="3xl"`. The 2 px overflow ticket 17 measured on `main.center.box` with `data-border` is [ledger](../ledger.md) row A11Y-9, owned by the `center` spec; this spec owns no part of it. |
| 1.4.11 Non-text Contrast | Not claimed. The border and the surfaces mark no UI component or state: the border sits at Yeti's divider contrast, "1.4:1 and is meant to" (`Y/src/tokens/surface.css:23`), and a raised surface is one step from the page. A spec that draws a state with them (none today) would own its own assertion (building-blocks 1.10). |
| 1.4.12 Text Spacing | The rules set no height and no overflow; overridden spacing grows the box (read). |
| 2.4.7 Focus Visible | Not affected: nothing here takes focus. A focusable element inside a painted band keeps Yeti's focus ring; the paint story asserts the ring is drawn on a button inside a `primary` band (read, not measured for the box). |

Forced colours: the platform replaces backgrounds, so a `surface` fill or a `yetiPaint` band loses its tone, while a `yetiBorder` edge stays. No state is drawn by either, forced colours is not an AA criterion (ticket 17 section 2.6; ADR 0015 consequences), so this spec adds no ledger row and no package CSS for it (inferred, not measured); the e2e case that records the border surviving `forcedColors: 'active'` stays ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 30).

**Ledger rows owned:** A11Y-21 (WCAG 2.2 1.4.3; Yeti documents that no text colour reaches full contrast on `grey-40` to `grey-60`, `color.md:80`; the package adds usage rules 4 to 6, the anti-pattern story, and play-function ratio assertions on every shown pair, with no package CSS; verified *read*; tested by L1), from [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 29.

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<section yetiBox gap="lg" surface="raised" yetiBorder>
  <h2>A box you can see</h2>
  <p>Prose inside a box keeps its rhythm; the box only adds room around it.</p>
</section>
```

Server HTML and the hydrated DOM are the same. The `section` carries the consumer's static attributes as Angular renders them (`yetibox=""`, `gap="lg"`, `surface="raised"`, `yetiborder=""`), and from the package `class="box"`, `data-ngx-yeti-item-box=""`, `data-gap="lg"`, `data-surface="raised"`, and `data-border=""`. The server also writes one item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>layouts/box/box.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="box"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts it at bootstrap.

A marker alone, `<p yetiText="grey-70">Muted words</p>`, renders `data-text="grey-70"` and nothing else from the package: no class, no item attribute, no link.

The delta from Yeti's docs markup: the consumer writes `yetiBox` and inputs where the docs write the class and `data-*` attributes, and `yetiBorder`, `yetiPaint`, `yetiText` where they write the markers. The box has no closed or open state.

### 9. Animation

None. The box and the markers have no state and no transition, and Yeti's reduced-motion handling does not reach them (building-blocks 1.6 point 4). A consumer may put the `enter` utility's directive beside a box, and may remove a box with a class-form `animate.leave`; the item link stays until Angular removes the host, because removal waits for the DOM (ADR 0060 point 4). A server-rendered box never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static class, `data-ngx-yeti-item-box`, and every bound `data-*` attribute, plus the item link in `<head>` (section 8). No value is **Pre-hydration state**: no person and no Module changes these attributes (ticket 26 Q12; ADR 0003 point 4).
- **Before hydration:** the directives create no node, read no layout, start no timer or observer, and touch no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). `YetiBox`'s only constructor work is the item acquisition, which ADR 0060 runs on the server too; the marker directives do none.
- **Full hydration:** each element is claimed as is; the bindings compute the same values; 0 style mutations (ADR 0060 point 5, measured for the mechanism).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the box, its markers, and the link; a dehydrated host holds the link through its `data-ngx-yeti-item-box` for as long as it is on the page (ADR 0060 point 4; ADR 0045). An input bound to state changes only after the block hydrates.
- **`hydrate never`:** the box is its server HTML and stays styled while the host is connected, whatever live boxes do (ADR 0060 point 4; ADR 0045). The markers' rules are always loaded, so they need nothing. There is no behaviour to lose; bound values stay at their server values.
- **Client-only `@defer`:** `YetiBox` fetches the item file when it is constructed, which can show unpadded frames; the consumer closes the gap with `provideYetiStyles({ preload: ['box'] })` (ADR 0060 point 6; [setup](setup.md)). The markers render styled at once.
- **Event replay:** no directive declares a listener, so nothing replays and no `jsaction` is added.
- **`withI18nSupport()`:** content inside a box is the consumer's and usually carries `i18n`; the directives add no `i18n` block. The consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** every value is an `input()` signal read by a host binding, the form ticket 18 measured refreshing zoneless (ADR 0070 rule 4; map, Standing rulings, item 43).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the box is padded, filled, bordered, and painted, because every attribute and the item link are in the server HTML. Nothing is lost: the item has no behaviour. A client-only application gets no such promise.
- **Hydration boundary:** a box and its markers may sit in any boundary; they have no parts and no references.

### 11. Hydration constraints

The item complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and item attribute are static, and the `data-*` bindings read the same input values on both.
- **No direct DOM manipulation:** the directives write nothing outside host bindings. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directives change no element; the consumer's element stays as written.
- **`preserveWhitespaces`:** the directives have no template.
- **No output branched on the platform:** none.
- **Static attributes the directives bind:** usage rule 1 keeps the consumer from writing them, because an unset input's removal of a static attribute is undone and redone at hydration (ADR 0070's 2026-10-03 note).

### 12. Single-page application

None. The item has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). On a route change, a route's boxes leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-box]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders a box again re-inserts it.

### 13. Item file

`yeti-css/css/layouts/box/box.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiBox]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:29`, the rank table of point 3), and removed after the last `[data-ngx-yeti-item-box]` host has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns, optionally with `provideYetiStyles({ preload: ['box'] })`. Cross-item files acquired: none (`box.css` has no cross-item rule; ADR 0060 point 9).

The marker directives acquire no item file: their rules are in `layouts/attributes.css`, part of the always-loaded group the consumer's global stylesheet carries (Part 2 row 1; ticket 11 row 1, whose "part file" is the **Item file**). They also set no `data-ngx-yeti-item-*` attribute, because ADR 0045 gives one to "each item directive" and a marker directive is not one (ticket 26 Q10: "the marker is not an item"); a marker on a page with no box keeps no `box.css` loaded.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attributes in the DOM, the item link, the computed padding, fill, border, and colours, and the contrast. It never asserts a private field or how the styles service counts. No test depends on a public token's default value ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): where a test needs to know a rule applied, it compares the element's computed value with a probe element in the same story whose inline style reads the same public token (`padding: var(--yeti-space-lg)`, `background-color: var(--yeti-color-surface-raised)`, `border: var(--yeti-border-width) solid var(--yeti-color-border)`), so the assertion holds for any token value. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `box` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `box--default`: Yeti's example. Asserts `class="box"`, `data-ngx-yeti-item-box`, `data-gap="lg"`, `data-surface="raised"`, `data-border` on the `section`, no `tabindex`, and no `role` attribute from the package. Asserts computed padding, fill, and border equal the probes.
- `box--gaps`: a box with no inputs (padding equals a `--yeti-space-md` probe and no `data-gap` is rendered), one with `gapInline="xl"` alone (inline padding equals the `xl` probe, block padding the `md` probe), one with `gap="sm" gapBlock="lg"`, and one with a fluid pair. Toggling a bound `gap` to `undefined` removes `data-gap`.
- `box--surfaces`: the three surfaces and a box with none (transparent), each against its probe, in a light and a `color-scheme: dark` wrapper.
- `box--border-anywhere`: `yetiBorder` on a `figure` and a `ul` outside any box; asserts the border equals the probe, no `box` class, and no `box.css` link while no box is on the story. A bound `[yetiBorder]` toggled to `false` removes `data-border`.
- `box--paint`: every text-bearing `yetiPaint` value (the six hues, the three constants, `grey-0` to `grey-30`, `grey-70` to `grey-100`) as a band with words, and `grey-40` to `grey-60` as text-free fills (usage rule 4). Asserts `data-paint` on each and the exact WCAG ratio of each band's words against its computed background, unrounded, at least 4.5:1, in light and dark schemes. A plain link inside the `primary` band takes the band's colour; a button inside it keeps its focus ring.
- `box--text`: `yetiText` values on the page surface and one `yetiText` inside a painted band overriding its automatic colour. Asserts `data-text` and the computed colour against a probe, and the exact ratio of each shown pair at least 4.5:1 in both schemes. The implementer measures which `yetiText` values clear 4.5:1 on the page surface with the play function's formula: passing values go in this story, failing ones in `box--anti-pattern-low-contrast`; this spec states no list ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 31).
- `box--composed`: `<div yetiCenter yetiBox gap="lg">` and Yeti's docs panel (a raised bordered box holding a `yetiStack`). Asserts one `data-gap="lg"` and that both `box` and `center` apply.
- `box--anti-pattern-low-contrast` (**Anti-pattern story**, ADR 0015 point 2): text on `grey-40` to `grey-60` and failing `yetiText` pairs, with only axe's `color-contrast` rule switched off, labelled as what not to write.

### Layer 2: browser-level (`npx nx test <lib>`, `box.spec.ts`)

Through `TestBed.createDirective(type, { tagName, bindings })` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `YetiBox` on a `div`: class `box` and `data-ngx-yeti-item-box`; with no bindings, none of the four `data-*` attributes; with `bindings` for `gap`, `gapInline`, `gapBlock`, and `surface`, each attribute carries its value, and setting a bound signal to `undefined` removes it after `whenStable()`;
- `YetiBox`: while the fixture lives, one `<link data-ngx-yeti-styles="box">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed;
- `YetiBorder`: `true` renders `data-border=""`, `false` renders none, and the static bare attribute (a `tagName` host with `yetiBorder=""`) is `true` through `booleanAttribute`;
- `NgxYetiPaint` and `YetiText`: the bound value is rendered as `data-paint` and `data-text`, and changes with the binding;
- for all three markers: no class, no `data-ngx-yeti-item-*` attribute, and no item link in `document.head`;
- no directive leaves a listener on its host.

A small test host covers what `createDirective` cannot: the four template references resolve to their instances, the consumer's own `class` is kept beside `box`, and `yetiBox` beside `yetiCenter` with one `gap` binding renders one `data-gap`.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `box.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture whose box holds a heading and a paragraph with `i18n` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the box renders `class="box"`, `data-ngx-yeti-item-box`, and its bound attributes; a box with unset inputs renders none of them; a `p` with `yetiText` and a `span` with `yetiPaint` render their attribute and no class; `<head>` holds exactly one item link with `data-ngx-yeti-styles="box"`, `data-beasties-skip`, and an `href` ending `layouts/box/box.css?v=<pin>`; a fixture with markers and no box writes no item link; no element carries `jsaction`.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `box` has `YetiBox`; `data-gap`, `data-gap-inline`, `data-gap-block`, and `data-surface` have their inputs with `YetiGap` and `YetiSurface`; markers `data-border`, `data-paint`, and `data-text` have `yetiBorder`, `yetiPaint`, and `yetiText` with `boolean` and `YetiPaint`; the box has no events. A pin move that adds a value, an attribute, or a marker fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

On the fixture app, built with `outputMode: 'server'`, with a `/box` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences):

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- with JavaScript disabled the box's padding, fill, and border and a painted band's colours match their probes, and `@axe-core/playwright` with the six tags reports no violation;
- a box inside a client-only `@defer` block with `box` in the preload list shows no unpadded frame; a box inside a `hydrate never` block stays padded after the live boxes on the page are removed;
- navigating from the box route to a route without a box removes the item link, and navigating back re-inserts it; a route with only markers loads no `box.css`;
- at a 320 px viewport a box with `gap="3xl"` causes no horizontal overflow (1.4.10);
- with `emulateMedia({ forcedColors: 'active' })` a `yetiBorder` box keeps a visible border (computed `border-style` not `none`), recorded as behaviour, not as a ledger assertion;
- printed with `page.pdf()` in Chromium, a painted band keeps `print-color-adjust: exact` (Yeti's rule, asserted from computed style).

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and the colour guide's paint examples (`Y/src/guides/color.md`) for the stories; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; ticket 17's contrast harness for the formula; the [lede](lede.md) spec's probe pattern.

## Out of Scope

- An input per token, a padding or colour input beyond Yeti's attributes, or a theme (ADR 0004).
- Corner radius, elevation, or any look Yeti gives the `card` instead (`docs.md`).
- Package CSS for the middle greys or for forced colours: none; the greys are ledger row A11Y-21's usage rules and ratio assertions ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 29 and 30).
- A check that a `yetiText` colour reads on its background, that `yetiBorder` is not on a table, or that a box with content is a sectioning element. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- `data-show` and `data-hide` (the `container` spec) and `data-numeric` (the `table` spec), the other any-element markers.
- The 2 px overflow of `center` with a border, A11Y-9, owned by the `center` spec.
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| One item directive `[yetiBox]` plus three any-element marker directives, one entry point | building-blocks Part 2 row 1; [Decide: the spec list](../issues/11-decide-spec-list.md) row 1 and Q9 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| `gap`, `gapInline`, `gapBlock`, `surface` as root inputs typed by Yeti's vocabulary types | ticket 26 rows 1 to 4; ADR 0070 R; ADR 0005 |
| Selector-named, class-free marker directives `yetiBorder`, `yetiPaint`, `yetiText` | ticket 26 rows 5 to 7 and Q10; ADR 0070 G; the user's "Selector name (Recommended)" (map, Standing rulings) |
| Unset inputs render nothing; Yeti's `md` default comes from its CSS | ADR 0070 rule 1 |
| `yetiPaint` and `yetiText` required | ticket 26 rows 6 and 7 |
| Class `NgxYetiPaint`; `YetiBox`, `YetiBorder`, `YetiText` free | ADR 0080 point 4 (checked at the Pin); ticket 50 decision 10 |
| `exportAs` on all four; entry point `ngx-yeti/box` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 1 |
| Item file as a counted link; presence attribute `data-ngx-yeti-item-box` on the box only | ADR 0060 points 2 to 6; ADR 0045 |
| `injectYetiItemStyles('box')` last in the constructor | [setup](setup.md); ticket 50 decisions 42 and 45 |
| Markers load no item file and set no item attribute | Part 2 row 1; ticket 11 row 1; ADR 0045 ("each item directive") |
| `yetiBorder` not on a table | ticket 26 Q16 |
| Contrast asserted in play functions; middle greys only in an anti-pattern story | ADR 0015 points 2 to 4 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

Yeti's documented panel, a raised bordered box holding a stack:

```html
<section yetiBox surface="raised" yetiBorder aria-labelledby="plan-title">
  <div yetiStack gap="sm">
    <h3 id="plan-title" i18n>Pro plan</h3>
    <p i18n>Everything in Basic, plus priority support.</p>
  </div>
</section>
```

```ts
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { YetiStack } from 'ngx-yeti/stack';

@Component({
  selector: 'app-plan',
  imports: [YetiBox, YetiBorder, YetiStack],
  templateUrl: './plan.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Plan {}
```

A band wide at the sides, painted in the brand hue, with a link that takes the band's colour and a button painted to read on it:

```html
<section yetiBox gapInline="xl" yetiPaint="primary">
  <p i18n>New: dark mode. <a href="/changelog">Read the changelog</a>.</p>
  <button yetiButton yetiPaint="white" type="button" i18n>Try it</button>
</section>
```

```ts
import { NgxYetiPaint, YetiBox } from 'ngx-yeti/box';
import { YetiButton } from 'ngx-yeti/button';
```

A border drawn from state, on an element that is not a box: `<li [yetiBorder]="isSelected()">`. Muted words: `<p yetiText="grey-70">`. A value newer than the pin: `<div yetiBox [surface]="$any('overlay')">`.

A theme that loosens the default padding and warms the raised surface, in the consumer's stylesheet after Yeti:

```css
:root {
  --yeti-space-md: 1.25rem;
  --yeti-color-surface-raised: oklch(0.97 0.01 80);
}
```

A page whose box renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['box'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `layouts/box/box.css`, loaded by `YetiBox` as a counted link (section 13). The marker directives load none. The consumer writes nothing for the box beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps every `data-gap`, `data-gap-inline`, and `data-gap-block` value (`:5-109`) and holds all three markers' rules (`:403-466`); `tokens/space.css`, `tokens/color.css`, and `tokens/surface.css` declare the space stops, the surfaces, the paint colours, and the border width.
3. **Cross-item rules:** none in `box.css`. In `attributes.css`, `[data-border]` skips `.table`, and `table.css` gives a table's own `data-border` cell borders (usage rule 3).
4. **Tokens:** reads the manifest's four and the markers' colour and border tokens, writes none (section 2).
5. **What breaks without the item file:** a box loses its padding and fill, so content runs to its edges and a surface box is transparent, with no error. `gapInline` and `gapBlock` do nothing, because the private properties `attributes.css` sets are read only by `box.css`. A `yetiBorder` on the box still draws its border, and the markers are unaffected.
6. **Tailwind name collision:** none known. building-blocks 1.13 lists `container`, `grid`, `table`, and `hidden`, not `box`. Tailwind's `box-border` and `box-content` utilities are different class names (that Tailwind generates no `.box` is inferred, not measured).

### Platform features to adopt when the browser target moves

None. `box.css` and the marker rules use only padding, logical properties, background, border, `print-color-adjust`, and the tokens Yeti declares; nothing is outside Baseline 2025 for the package to adopt. The colour tokens they read use `light-dark()`, which is inside the target (building-blocks 1.2).

### Single-page-application pieces relied on

None: the item uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
