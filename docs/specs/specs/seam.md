# Spec: seam (component item)

Ticket: [87. Spec: seam (component)](../issues/87-spec-seam.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 37 and Part 1 (1.3, 1.4, 1.9, 1.10 to 1.14), [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 137 to 140 and grilling questions 3, 13, 14, 15, and 16, [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) (decisions 2, 7, 8, 10, 12, 18, 30, 42, and 58), [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md); [architecture-guide.md](../architecture-guide.md) P6 (`seam box`). The item owns no [ledger.md](../ledger.md) row (Part 2 row 37). `Y/` is `github.com/foundation/yeti/` at the **Pin**. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 183 to 188), and each is cited where it applies.

## Problem Statement

Yeti's `seam` "gives a section a shaped edge, a slant, a curve, or a wave, cut from its own background so whatever is behind shows through" (`Y/src/components/seam/manifest.json`). It is for the joins between bands of a landing page, "where a straight line between two backgrounds looks cut from cardboard" (`docs.md`). It is one **Identity class**, `seam`, on a section, and four **Attributes**: `data-shape` (slant, curve, or wave), `data-size` (the depth of the cut), `data-edge` (top, bottom, or both), and the boolean `data-flip` (mirror the shape, for alternating sections). It has no **Module**, no **Marker**, no declared child, and no **Event**. Yeti's own example composes it with `box` and a paint on one element: `<section class="seam box" data-shape="wave" data-edge="both" data-paint="primary" data-gap="lg">` (`example.html`).

An application developer using the package cannot write `class="seam"` or any of those `data-*` attributes: a consumer writes no Yeti class or attribute, and the directive binds them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). Written by hand, `data-shape="wavy"` or `data-edge="left"` compiles and silently falls back to Yeti's slant on the bottom edge; here it must fail to compile ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `seam` **Item file** loaded while a seam is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it the section has a straight edge and no added depth, with no error.

The item is decoration: "Decorative only; nothing changes for assistive tech" (manifest `a11y.notes`). But the cut is real clipping: a slant is a `clip-path` and a curve or wave a `mask-image`, and both remove from view everything the section paints outside the shape, its own content included. Yeti keeps text out of the cut by adding the depth as in-flow space on the cut edge. That only holds while the section's height follows its content and its content stays inside its padding, which the package cannot read. So the package must state those requirements as usage rules, show them in every example, and assert them in its stories and end-to-end tests ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 4).

## Solution

One directive in the secondary entry point `ngx-yeti/seam` ([building-blocks.md](../building-blocks.md) Part 2 row 37; 1.3):

- **`YetiSeam`**, the **Item directive**, on `[yetiSeam]`, `exportAs: 'yetiSeam'`. It binds `seam` as a static host class, and binds `data-shape`, `data-size`, `data-edge`, and `data-flip` from the typed inputs `shape` (`YetiShape`), `size` (`YetiSizeControl`), `edge` (`YetiEdge`), and `flip` (`boolean`, `booleanAttribute`). It sets the static presence attribute `data-ngx-yeti-item-seam` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), acquires the `seam` item file when it is created, on the server too, and releases it when it is destroyed (ADR 0060 point 2), through `injectYetiItemStyles('seam')` from `ngx-yeti/styles` as the last statement of its constructor ([setup](setup.md)).

The developer writes `<section yetiSeam yetiBox shape="wave" edge="both" yetiPaint="primary" gap="lg">` where Yeti's example writes `<section class="seam box" data-shape="wave" data-edge="both" data-paint="primary" data-gap="lg">`. `yetiBox` and `yetiPaint` are the box spec's directives, written beside `yetiSeam` ([architecture-guide.md](../architecture-guide.md) P6; the [box](box.md) spec). An unset input renders no attribute, so Yeti's own defaults (`slant`, `md`, `bottom`, not flipped) apply from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1).

The directive is **types only**: no listener, no render callback, no service of its own, and no DI beyond the styles service every item directive uses (Part 2, "Types only", with ticket 50 decision 18). Everything visible is Yeti's CSS, so a seam is right on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block.

## User Stories

1. As an application developer, I want to give a section a shaped edge with one directive attribute, so that I never write Yeti's `seam` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="seam"` and `data-*` attributes, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want a seam with no inputs to be Yeti's default, a medium slant on the bottom edge, so that the common case needs no configuration.
4. As an application developer, I want a `shape` input typed by Yeti's `shape` vocabulary, so that `shape="wavy"` fails to compile.
5. As an application developer, I want an `edge` input typed by Yeti's `edge` vocabulary, so that I can cut the top, the bottom, or both, and `edge="left"` fails to compile.
6. As an application developer, I want a `size` input typed by Yeti's `size-control` vocabulary, so that I can make the cut shallower or deeper.
7. As an application developer, I want a boolean `flip` input, so that I can write `<section yetiSeam flip>` to mirror the shape for the next section down.
8. As an application developer, I want a static attribute such as `shape="curve"` to type-check, so that I need no property binding for a constant.
9. As an application developer, I want an input I leave unset to render no attribute, so that Yeti's own default applies and the server HTML stays Yeti's minimal markup.
10. As an application developer, I want `flip` unset or `false` to render no `data-flip`, so that a section is not mirrored by an empty attribute.
11. As an application developer, I want to bind `shape` and `flip` from my data, so that a run of sections alternates its cut, under zoneless change detection.
12. As an application developer, I want a static `size="lg"` to do nothing beyond the input, so that the HTML `size` attribute has no effect on my section.
13. As an application developer, I want `yetiSeam` beside `yetiBox` and `yetiPaint` on one element, as Yeti's example writes `seam box`, so that the section gets its padding, its paint, and its cut with no wrapper.
14. As an application developer, I want the seam's inputs never to share a name with `yetiBox`'s, `yetiCenter`'s, or the marker directives' inputs, so that the directives compose with no shared-name conflict.
15. As an application developer, I want the depth of the cut added as space on the cut edge, so that my section's padding is untouched and no text sits in the cut.
16. As an application developer, I want the cut to be taken from the section itself, with no extra element, so that the page or the section behind shows through the cut.
17. As an application developer, I want to fix the depth for every size through `--yeti-seam-size`, so that a theme changes every seam with no input.
18. As an application developer, I want the usage rules stated (a block-level host that is not a form control, padding on the section, a height that follows the content, nothing that must stay visible beyond the section's edges, no static Yeti attributes), so that I use the seam as Yeti intends.
19. As an application developer, I want the package never to add a role, `aria-hidden`, or a name to my section, so that its semantics stay the ones I wrote.
20. As an application developer, I want the seam item file loaded when the first seam renders and removed after the last leaves, so that I do not import `seam.css` globally.
21. As an application developer, I want the item file in the server HTML when a server-rendered page has a seam, so that the first paint is already cut.
22. As an application developer, I want a seam right with JavaScript off under SSR and prerendering, so that the page reads and looks right before any script runs.
23. As an application developer, I want hydration to change nothing on a seam, so that I get no `NG05xx` error and no flash.
24. As an application developer, I want a seam inside a `@defer (hydrate on ...)` block to stay cut before and after the block hydrates, so that incremental hydration does not strip it.
25. As an application developer, I want a seam inside a `hydrate never` block to keep its styles for as long as it is on the page, so that it does not lose its cut when a live seam elsewhere leaves.
26. As an application developer, I want to know that a seam inside a client-only `@defer` block needs `seam` in the preload list for a flash-free first paint, so that I can avoid frames with a straight edge.
27. As an application developer using `withI18nSupport()`, I want translated text inside a seam to hydrate without being re-rendered, so that localised pages keep the server's DOM.
28. As an application developer, I want a template reference (`#s="yetiSeam"`), so that the directive follows the package's `exportAs` rule.
29. As an application developer, I want to import the directive from `ngx-yeti/seam`, so that a `@defer` block can split it with the rest of the item.
30. As an application developer, I want the input value types re-exported by name (`YetiShape`, `YetiSizeControl`, `YetiEdge`), so that I can type my own signals that feed the inputs.
31. As an application developer with a strict Content Security Policy, I want to know that the curve and wave masks are `data:` images, so that I can allow them or choose the slant.
32. As a screen-reader user, I want a seam to change nothing I hear, so that the section's content, order, and landmarks are what the author wrote.
33. As a keyboard user, I want the focus ring of a link or a button inside a seam to be drawn in full, so that the cut never hides where focus is.
34. As a low-vision user, I want the text inside a seam to meet 4.5:1 against the section's background in the light and the dark scheme, so that the paint that the cut shapes is readable.
35. As a low-vision user who zooms text, I want a seam's section to grow with its text and the cut to stay below or above it, so that no line of text is cut.
36. As a low-vision user who overrides text spacing, I want no text inside a seam clipped by the cut, so that my spacing settings remove nothing.
37. As a user on a narrow screen, I want the shape redrawn to the section's width with no horizontal scroll, so that the page reflows at 320 CSS pixels.
38. As a forced-colours user, I want the section's content to stay readable when the paint and the cut are replaced by system colours, so that the decoration's loss takes nothing with it.
39. As a package maintainer, I want the contract check to cover the four attributes and every value of their vocabularies, so that a pin move that adds a value fails before release.
40. As a package maintainer, I want the SSR smoke to assert the server HTML of a seam and its item link, so that the first paint is proven.
41. As a package maintainer, I want the fixture app to render seams on a prerendered and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
42. As a package maintainer, I want a `hydrate never` case that removes every live seam and checks the dehydrated one keeps its cut, so that the gap ADR 0060 closes cannot return.
43. As a package maintainer, I want a shared-host case for `seam` with `box` inside `hydrate never`, so that both presence attributes keep both links.
44. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default fails no test for no reason.
45. As a package maintainer, I want the play functions and end-to-end tests to follow Yeti's own `seam.spec.js` cases, so that the package proves what Yeti proves and more.
46. As a package maintainer, I want the class name `YetiSeam` checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/seam/manifest.json`, `seam.css`, `docs.md`, and `example.html`, in `Y/src/layouts/attributes.css`, `Y/src/tokens/tokens.json`, `Y/schema/vocabulary.json`, and `Y/src/guides/components.md`, and in Yeti's test `Y/test/browser/components/seam.spec.js` with its fixture `Y/test/browser/fixtures/components/seam.html`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `seam`, `component`, `Content` |
| `class` | `seam` |
| `attributes` | `data-shape`: enum, vocabulary `shape` (`slant`, `curve`, `wave`), default `slant`, "The shape of the cut edge." `data-size`: enum, vocabulary `size-control` (`sm`, `md`, `lg`), default `md`, "The depth of the cut: twice the size's space step." `data-edge`: enum, vocabulary `edge` (`top`, `bottom`, `both`), default `bottom`, "Which edge is cut." `data-flip`: boolean, "Mirror the shape horizontally, for alternating sections. A curve is symmetric and does not change." |
| `classes`, `children`, `markers` | empty, empty, none |
| `tokens` | public: `--yeti-seam-size` ("Fix the depth for every size."), `--yeti-space-sm` ("The depth when data-size is absent."); private: `--_yeti-seam`, the six `--_yeti-seam-curve-*` and `--_yeti-seam-wave-*` strips, `--_yeti-size-space`, `--_yeti-seam-top`, `--_yeti-seam-bottom` |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "Decorative only; nothing changes for assistive tech. The seam adds its depth as space on a cut edge so text never sits in the cut." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: `clip-path: polygon()`, `mask-image`; `guarded`: empty |
| `since` | `7.0.0` |
| `demo` | `height: xl`, `bleed: true` |

How it works, in `@layer yeti.components`: `.seam` sets `--_yeti-seam` to `var(--yeti-seam-size, calc(var(--_yeti-size-space) * 2))` and declares six private SVG strips as `data:` URLs. `.seam:not([data-size])` sets `--_yeti-size-space` to `--yeti-space-sm`, which is what `[data-size="md"]` sets too (`attributes.css:257`), so absent and `md` match. The depth is a generated block of `block-size: var(--_yeti-seam)` in flow: `::after` unless the edge is `top`, and `::before` when the edge is `top` or `both`. A slant is a `clip-path: polygon(...)` per edge and flip; a curve or a wave is a `mask-image` of a solid `linear-gradient` body plus one strip per cut edge, with `mask-repeat: no-repeat`, sized `100%` wide and `--_yeti-seam` tall. `data-flip` changes the slant's polygon and the wave's strips; the curve has no flipped strip. The polygon's coordinates are physical (`0` is the left edge), so `data-flip`, not the writing direction, mirrors the shape. `--yeti-seam-size` is declared nowhere at the pin (`tokens.json:156`, `"declared": false`; [Research: Yeti's styling model, and loading component styles lazily](../issues/04-research-yeti-styles-and-lazy-loading.md), "Reads defined nowhere"), so it is an override-only input with a `var()` fallback. No other item's CSS names `.seam` (checked with `rg` over `Y/src/**/*.css`).

The value rules for `data-size` are in the **Always-loaded group** (`Y/src/layouts/attributes.css:256-259`: `sm` reads `--yeti-space-xs`, `md` `--yeti-space-sm`, `lg` `--yeti-space-md`). `data-shape`, `data-edge`, and `data-flip` have no rule outside `seam.css`.

Attributes left to the consumer: none (ticket 26 rows 137 to 140). The element, its content, its background and padding (through `yetiBox` and `yetiPaint`, or the consumer's own CSS, as Yeti's docs do with a `style` attribute), and any heading are the consumer's.

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `seam` | static host class on `[yetiSeam]` (`YetiSeam`) | always | ADR 0003 point 1; Part 2 row 37 |
| Attribute `data-shape` | the shape of the cut | input `shape`: `YetiShape \| undefined`, bound `[attr.data-shape]`, `null` when unset | unset renders nothing; Yeti's `slant` applies. `shape` is not an HTML attribute | ticket 26 row 137 (R) |
| Attribute `data-size` | the depth of the cut | input `size`: `YetiSizeControl \| undefined`, `[attr.data-size]` | unset renders nothing; Yeti's `md` applies. Static form: `inert` (below) | ticket 26 row 138 (R); building-blocks 1.4 |
| Attribute `data-edge` | which edge is cut | input `edge`: `YetiEdge \| undefined`, `[attr.data-edge]` | unset renders nothing; Yeti's `bottom` applies. Not an HTML attribute | ticket 26 row 139 (R) |
| Attribute `data-flip` | mirror the shape | input `flip`: `boolean`, `booleanAttribute`, default `false`; `[attr.data-flip]` is `''` when true and `null` when false | `false` renders nothing; a bare static `flip` renders `data-flip=""`. Not an HTML attribute | ticket 26 row 140 (R); building-blocks 1.4 |
| Children, markers | none | none | not applicable | manifest |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Token `--yeti-seam-size` | the depth for every size, override-only | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--yeti-space-xs`, `--yeti-space-sm`, `--yeti-space-md` | the space step each size reads | the consumer's | not applicable | ADR 0004 |
| Private tokens `--_yeti-seam*`, `--_yeti-size-space` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-seam=""` on `[yetiSeam]` | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2 |
| Injection token | not Yeti's | none: the item has no part that would read one | not applicable | building-blocks 1.9 |

The `inert` kind for `size` (building-blocks 1.4; ticket 26 row 138 and grilling question 15): HTML's `size` acts on `input` and `select` (and obsolete `font`, `hr`, and `basefont`), none of which is a seam's host. On the hosts usage rule 1 names, a static `size="lg"` stays on the host beside `data-size="lg"`, does nothing, and the directive binds nothing for it (ticket 26 row 138: "`inert` on Yeti's hosts"). The host list is the spec's reading of Yeti's examples, which all use `section` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 183).

The input value types are Yeti's own, from the package's generated `yeti-types.ts`, re-exported by name and never redeclared ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5; ADR 0060 point 10). Each is a full vocabulary, so no `Extract` is needed. `YetiShape` and `YetiEdge` are among the 46 names `yeti.d.ts` exports, which is why they are reused and why no package type takes those names.

**Module replaced:** none. Yeti's `seam` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 37, "Yeti module: none"; [Research: Yeti's JavaScript modules and what Angular adds](../issues/03-research-yeti-javascript-and-angular.md) lists the seam as "layout only" and among the items whose gain is "only types"). So no module behaviour is kept, changed, or removed, and the item uses neither Aria nor CDK.

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads `--yeti-seam-size` when a consumer declares it; otherwise twice `--yeti-space-sm` with no `size`, or twice the space step a set `size` names through the always-loaded value rules (`--yeti-space-xs`, `--yeti-space-sm`, or `--yeti-space-md`). The package writes none of them and offers no input, provider, or theme for them. A consumer sets `--yeti-seam-size` on `:root` in any stylesheet, in a **Theme** file after Yeti, on one section in its own stylesheet, or with a runtime `setProperty`; the space scale only on `:root` (`Y/src/guides/theming.md:38`). `--yeti-seam-size` is one of the tokens Yeti's components guide names as belonging to one component alone (`Y/src/guides/components.md:247`). The section's background is not a seam token: it is the consumer's paint or surface (the [box](box.md) spec's `yetiPaint` and `surface`). **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- One directive, no parts and no children. So the item provides no injection token (building-blocks 1.9: a token is the parent handle a part injects).
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"). Yeti's example composes `seam` with `box` and a paint on one element, so the consumer writes `yetiSeam`, `yetiBox`, and `yetiPaint` beside each other ([architecture-guide.md](../architecture-guide.md) P6 names `seam box` as such a pair, "and the spec of each says so"). Each item directive sets its own presence attribute and acquires its own item file, so a `seam box` host carries `data-ngx-yeti-item-seam` and `data-ngx-yeti-item-box` and holds both links (ADR 0045; ticket 50 decision 12). `yetiPaint` sets no presence attribute and acquires nothing (ticket 50 decision 7).
- Shared input names (building-blocks 1.4, shared vocabularies; ticket 26 grilling question 16): `shape`, `edge`, and `flip` are declared by no other item (ticket 26 rows 137, 139, and 140 are their only rows). `size` is `YetiSizeControl` on every item that declares it (badge, breadcrumbs, button, field, pagination, progress, spinner, table, toc), and none of those sits on a section in Yeti's markup. The directives a consumer writes beside a seam declare no `size`: `yetiBox` declares `gap`, `gapInline`, `gapBlock`, and `surface`, `yetiCenter` declares `max`, `gap`, and `intrinsic`, and the any-element marker directives (`yetiPaint`, `yetiText`, `yetiBorder`) declare selector-named inputs only ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) kind G). So no name collides.
- The only injection is the root styles service of ADR 0060, through which `YetiSeam` acquires and releases the item file (ticket 50 decision 18). That service is the [setup](setup.md) spec's and ADR 0060's.
- Generated ids and the platform's relationship attributes: none. The seam renders no `id` and references none, so it does not use [generated-ids](generated-ids.md).

### 4. API

| Member | `YetiSeam` |
| --- | --- |
| Class name | not among the 46 names `yeti.d.ts` exports at the Pin (ticket 50 decision 10; ADR 0080's 2026-10-03 note), so it takes `Yeti`, not `NgxYeti` (ADR 0080 point 4) |
| Selector | `[yetiSeam]` (Part 2 row 37) |
| `exportAs` | `yetiSeam` (building-blocks 1.3) |
| Entry point | `ngx-yeti/seam` (building-blocks 1.3; ADR 0011 clause 10) |
| Inputs | `shape: YetiShape \| undefined` (Yeti default `slant`); `size: YetiSizeControl \| undefined` (`md`); `edge: YetiEdge \| undefined` (`bottom`); `flip: boolean` with `transform: booleanAttribute` (default `false`, no attribute); each an `input()` |
| Host | static `class: 'seam'`; static `data-ngx-yeti-item-seam: ''`; `[attr.data-shape]`, `[attr.data-size]`, `[attr.data-edge]` from the inputs, `null` when unset; `[attr.data-flip]` `''` when `flip()` is true, else `null`. No binding for HTML `size` (`inert`) |
| Providers | none |
| Injection | the ADR 0060 styles service, through `injectYetiItemStyles('seam')` |
| Models, outputs, methods, listeners | none |
| Lifecycle | acquires the `seam` item file as the last statement of its constructor, after anything there that can throw (nothing does today), and releases it through `DestroyRef` (ADR 0060 point 2; ticket 50 decisions 18, 42, and 45) |

No input default differs from Yeti's (ADR 0070 rule 1; ticket 26 grilling question 3). A static attribute type-checks as a string literal under `strictTemplates`, so `shape="curve"` compiles and `shape="wavy"` does not (ADR 0070 rule 2; ticket 26 grilling question 14, read, not run).

**Usage rules** (numbered here and in the directive's JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiSeam` on a block-level element that holds a band of the page: `section`, as Yeti's examples do, or `div`, `header`, `footer`, `article`, or `aside` where that element's meaning fits. Not on a form control, an `hr`, or a replaced element such as `img` or `video`: HTML `size` is inert only on the former hosts (section 2), and a replaced element renders no `::before` or `::after`, so the depth Yeti adds to keep content out of the cut would be missing. A `section` the seam marks gets a heading, as Yeti's docs example has, or is a `div`: Yeti's own example draws the Nu checker's advisory "Section lacks heading" ([Research: Yeti's accessibility and standards](../issues/17-research-yeti-accessibility-and-standards.md) section 2.2). ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 183)
2. Give the section its own padding, with `yetiBox`'s `gap` or the consumer's CSS, as Yeti's docs say ("give the section its padding as usual"; `Y/src/guides/components.md:156`: "the seam never manages that padding for you"). The clip and the mask remove everything the section paints outside its border box, so a focus ring, an outline, or a shadow of a child that touches the section's inline edges is cut without padding (WCAG 2.4.7). ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 184)
3. Let the section's height follow its content: give it no fixed `height` or `block-size` (a `min-block-size` is fine). With a fixed height, content that grows under text zoom or user text spacing overflows the box, and the clip or the mask cuts it away instead of letting it spill (WCAG 1.4.4, 1.4.12). Yeti's own test fixture fixes `block-size: 240px` for measurement only. ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 185)
4. Keep anything that must stay visible beyond the section's edges out of the seam, or inside the top layer: a CSS-positioned bubble of Yeti's `tooltip` item or any absolutely positioned child that reaches past the border box is clipped like the rest of the section's painting. A `popover` or a modal `dialog` renders in the top layer and is not clipped (inferred, not measured). ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 186)
5. The background that the seam cuts is the section's own: give it a paint, a surface, or a background of the consumer's, as Yeti's examples do. A seam on a section with no background cuts nothing visible. The text on that background is the paint's: the [box](box.md) spec's contrast rules apply (ledger A11Y-21 for the grey paints).
6. Under a Content Security Policy, the curve and wave strips are `data:` SVG images, so `img-src` must allow `data:` for them; the slant uses no image (`seam.css:7-12`). Whether a blocked strip leaves a straight cut or no cut is not measured (inferred: the CSS Masking rule treats an image that fails to load as a transparent layer). ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 187)
7. Do not write `class="seam"`, `data-shape`, `data-size`, `data-edge`, `data-flip`, or `data-ngx-yeti-item-seam` statically on the host. The directive binds them, and hydration writes a static attribute back before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"; ADR 0070 consequences). A value newer than the pin goes through `$any` (`[shape]="$any('zigzag')"`, ADR 0070; ticket 26 grilling question 13).
8. Bind every input from values that are the same on the server and the client, never from a browser-only read (a viewport width, `matchMedia`). The hydration constraints require the same DOM on both sides.
9. Import `YetiSeam` in every component whose template writes the attribute. A **Forgotten import** with only static inputs renders a section with a straight edge and no error; only a bound input (`[shape]`) makes the compiler report it (NG8002), or a template reference naming the `exportAs` (NG8003) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `seam` | Nearest in Angular Material |
| --- | --- | --- |
| Shape | an item directive on the consumer's own section that clips its edge | none: Material and the CDK have no section, band, or shaped-edge component (checked: no such directory under `NC/src/material/` or `NC/src/cdk/`) |
| Accessibility | none added: the seam is decoration (manifest `a11y.notes`) | not applicable |
| `exportAs` | `yetiSeam` | not applicable |

Nothing from Material's API applies. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 37; building-blocks 1.2). The reason, row 1's, which row 37 takes ("as row 1"): Yeti's CSS does the whole job; the directive adds the class, the typed attributes, the item-file acquisition, and `exportAs`. The two features the manifest lists as unguarded are inside Baseline 2025: `clip-path` with basic shapes and unprefixed `mask-image` (Chrome and Edge 120, Firefox 53, Safari 15.4; Baseline high since 2023-12-07; [Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md), the `masks` and `clip-path` rows). The browser target's floor, Chrome and Edge 141, is above 120, so no engine of the target renders the curve and wave square. No Aria pattern applies (a seam has no role), and no CDK piece is used: there is no id, focus, keyboard, observer, or direction read. The polygon is physical, so RTL needs no `Directionality`: a right-to-left page gets the same shape, and the consumer flips it with `flip` where wanted.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The directive adds no role, state, or property, and no tab stop.
- **Keyboard:** none. Focusable content inside a seam keeps its own order and ring (usage rule 2).
- **Names:** none written by the package (building-blocks 1.10, Names). The host keeps the element's own role: a `section` with no accessible name is a generic element, and one the consumer names with `aria-labelledby` is a `region` landmark, both the consumer's choice.

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.1.1 Non-text Content | The cut is CSS, not content: no image element and no text alternative. The `data:` strips are CSS images, which the accessibility tree does not expose (read in Yeti's `docs.md`, "Purely visual"). |
| 1.3.1 Info and Relationships, 1.3.2 Meaningful Sequence | The clip and the mask change nothing about the content, its order, or its size for assistive technology (`docs.md`, Accessibility). `seam--default` asserts the accessibility tree's text order equals the DOM order and the host gets no role from the package. |
| 1.4.3 Contrast (Minimum) | No text sits in the cut: the depth is in-flow space after or before the content (`seam.css:16-23`), so text is on the section's own background. Yeti's test asserts AA on the fixture's text in light and dark (`seam.spec.js`, `data-contrast`); ticket 17 measured the example axe-clean in both schemes (section 3). The package asserts at least 4.5:1 for every text in its stories, with the exact WCAG formula on computed colours, in a light and a dark `color-scheme` wrapper (ADR 0015 point 3; ticket 50 decision 8). The paint is the [box](box.md) spec's (usage rule 5). |
| 1.4.4 Resize Text | The depth is a space token, so it scales with the root size; the section's height follows its content (usage rule 3), and the spacer keeps the last line clear of the cut at any zoom (inferred from `seam.css`; Yeti's test measures the spacer). Layer 4 asserts it at 200% text zoom. |
| 1.4.10 Reflow | The polygon is in percentages and the strips are `100%` wide with `preserveAspectRatio='none'`, so the shape is redrawn to the section's width ("drag the box narrower and the wave is redrawn to fit", `example.html`). Ticket 17 measured no page-level horizontal scroll on the seam example at 320 x 640 (section 2.4). Layer 4 asserts it for the stories. |
| 1.4.11 Non-text Contrast | The cut edge is decoration, not a boundary a reader needs to find a control or a state ("Decorative only", manifest). No assertion beyond the Story gate, as for the decorative line of [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 58. |
| 1.4.12 Text Spacing | With the section's height following its content (usage rule 3), spacing that grows the text grows the section and the spacer stays after it. Layer 4 applies the 1.4.12 values and asserts that the last child of every seam ends at least the depth above the section's cut edge. |
| 2.4.7 Focus Visible, 2.4.11 Focus Not Obscured (Minimum) | The base ring is `2px` at `2px` offset (ticket 17 section 2.3). With the section's padding (usage rule 2) the ring of a child sits inside the border box and is drawn in full. Layer 4 asserts a link at the inline-start edge of the padded content keeps the ring's pixels on all four sides. |

Forced colours (not an AA criterion of its own, ticket 17 section 2.6): under `forced-colors: active` the section's background is replaced by the system canvas, so the cut no longer shows against the page, while the content stays readable, because the cut carries no meaning. The spec adds no package CSS and no ledger row, after [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 30 for surfaces and paint, and layer 4 records the forced-colours screenshot and asserts the text's contrast (ticket 50 decision 188).

**Ledger rows owned:** none ([ledger.md](../ledger.md); Part 2 row 37, "Ledger: none"). The package adds no accessibility or standards feature that Yeti lacks: the seam is decoration, ticket 17 classed it with the items that "conform as measured" (section 3), and its requirements on the consumer's markup are Yeti's own advice (padding, a section's content) stated as usage rules.

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<section yetiCenter yetiBox max="lg">
  <p i18n>A plain section above.</p>
</section>
<section yetiSeam yetiBox shape="wave" edge="both" yetiPaint="primary" gap="lg"
         aria-labelledby="pricing-heading">
  <h2 id="pricing-heading" i18n>Pricing</h2>
  <p i18n>A wave cut into both edges of this section, out of its own background.</p>
</section>
<section yetiCenter yetiBox max="lg">
  <p i18n>And a plain section below, showing through the cut above it.</p>
</section>
```

Server HTML and the hydrated DOM are the same. The middle section carries `yetiseam=""`, `yetibox=""`, `shape="wave"`, `edge="both"`, `yetipaint="primary"`, and `gap="lg"` (the static input attributes, matched by no Yeti rule except the box's own bindings), `class="seam box"`, `data-shape="wave"`, `data-edge="both"`, `data-paint="primary"`, `data-gap="lg"`, `data-ngx-yeti-item-seam=""`, and `data-ngx-yeti-item-box=""`, and no `data-size` or `data-flip`. The order of the two classes in `class` follows Angular's merge of the static host classes and is not asserted. No element carries a role, an `id`, or an ARIA attribute from the package.

The server also writes the item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>components/seam/seam.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="seam"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). Its rank is `Y/src/yeti.css:47`, after `table` and before `nav`. The `box` and `center` links sit at their own ranks. The client adopts the links at bootstrap. The seam has no closed or open state.

The delta from Yeti's docs markup: the consumer writes `yetiSeam` and input names where the docs write `class="seam"` and `data-*` names, and writes the background through `yetiPaint` or a surface rather than an inline `style`, which Yeti's docs use for brevity.

### 9. Animation

None. The seam has no state and no transition, and Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). Changing a bound input repaints the cut at once. A seam the consumer inserts or removes with `@if` may carry a class-form `animate.enter` or `animate.leave` of the consumer's or Yeti's `enter` utility (the [enter](enter.md) spec), written beside `yetiSeam`; the item link stays until Angular removes the last host, because removal waits for the DOM (ADR 0060 point 4). A server-rendered seam never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes, and the item link in `<head>` (section 8). Everything at first paint is a host binding (ADR 0011 clause 1). Nothing is **Pre-hydration state**: no person and no Yeti module can change a seam's `data-*` attribute (ticket 26, "the consumer's binding only"; grilling question 12).
- **Before hydration:** the directive creates no node, reads no layout, starts no timer or observer, and touches no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is the item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** the host is claimed as it is; bindings computed from the same inputs give the same values (usage rule 8); 0 style mutations (ADR 0060 point 5, measured for the mechanism).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the seam and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism).
- **`hydrate never`:** the seam is its server HTML and keeps its cut while its host is connected, whatever live seams do (ADR 0060 point 4 and ADR 0045's presence attribute; layer 4 asserts it). A `seam box` host keeps both links (ADR 0045's shared-host case). Nothing is lost except changing a bound input, which needs Angular.
- **Client-only `@defer`:** the item file is fetched when `YetiSeam` is constructed, which can show frames with a straight edge and no added depth; the consumer closes the gap with `provideYetiStyles({ preload: ['seam'] })` (ADR 0060 point 6; [setup](setup.md)). A composed box needs `box` in the same list.
- **Event replay:** the directive declares no listener, so nothing replays and it adds no `jsaction`. Controls inside a seam replay as their own directives say.
- **`withI18nSupport()`:** the seam's text is the consumer's content, translated with `i18n` on its elements. The directive adds no `i18n` block; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11). `i18n` on a child leaves the host's bindings alone (inferred).
- **Zoneless:** inputs are `input()` signals read by host bindings, so a changed input refreshes its attribute with no zone (map, Standing rulings, item 43; ADR 0070 rule 4).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the seam is cut and its content readable, because the class, the attributes, and the item link are in the server HTML. Nothing is lost: the seam has no behaviour. A client-only application gets no such promise.
- **Hydration boundary:** a seam may sit in any boundary. It has no ids or references.

### 11. Hydration constraints

The seam complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; `data-shape`, `data-size`, `data-edge`, and `data-flip` come from inputs whose values usage rule 8 keeps equal on both sides.
- **No direct DOM manipulation:** the directive writes nothing to the DOM outside host bindings. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client. The `::before` and `::after` spacers are CSS generated content, not DOM nodes.
- **Valid HTML:** the directive changes no element. Usage rule 1's hosts are flow content where sections are allowed; a `section` inside a `p` would be repaired by the parser and differ from the server's DOM.
- **`preserveWhitespaces`:** the directive has no template.
- **No output branched on the platform:** none.
- **Static attributes the directive binds:** usage rule 7 keeps the consumer from writing them. The static `size` is `inert` and never bound, so hydration writes back the same value the server rendered. A bare static `flip` is the input's static form, not the `data-flip` attribute, and stays on the host as `flip=""`, matched by no Yeti rule.

### 12. Single-page application

None. The seam has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). On a route change, a route's seams leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-seam]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders a seam again re-inserts it. A seam in the persistent shell outside the `router-outlet` keeps its link across routes.

### 13. Item file

`yeti-css/css/components/seam/seam.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiSeam]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:47`, after `table` and before `nav`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-seam` has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the `[data-size]` value rules and the tokens), and optionally `provideYetiStyles({ preload: ['seam'] })`. The seam adds nothing to it. Cross-item files acquired: none (`seam.css` names no other item, and no other item's CSS names `.seam`; ADR 0060 point 9). A composed `box` loads its own file through `yetiBox`.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attributes in the DOM, the item link, which corner or middle of an edge is cut, the spacer's size against the computed depth, where the content ends against the cut, the focus ring's pixels, and the text's contrast. It never asserts a private field, a private token, or how the styles service counts. No test depends on a public token's default value or on a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): the depth is compared with twice the computed space token the size reads, as Yeti's `seam.spec.js` does with its `token()` helper, and contrast asserts the criterion's ratio, never a colour value. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `seam` item file through the directive, as a consumer would (ADR 0014 point 1), with Yeti's `demo` hint applied: the story bleeds to the frame's edges on a background of its own, so the cut shows against something. Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Every play function asserts, for each seam in the story, that the host has no role, `tabindex`, or `aria-*` attribute from the package, and that its last child ends at least the computed depth above each cut edge (usage rules 2 and 3). Story ids:

- `seam--default`: Yeti's example, three sections, the middle one `yetiSeam yetiBox shape="wave" edge="both" yetiPaint="primary" gap="lg"` with a heading. Asserts `class` contains `seam` and `box`, `data-shape="wave"`, `data-edge="both"`, `data-ngx-yeti-item-seam` and `data-ngx-yeti-item-box`, and no `data-size` or `data-flip`; the computed `mask-image` is not `none`; the section's own padding equals its `gap` (the seam leaves it untouched); the text in the accessibility tree is in DOM order; every text is at least 4.5:1 against the section's paint in a light and a dark `color-scheme` wrapper (ticket 50 decision 8).
- `seam--shapes`: three sections on a contrasting stage, `slant`, `curve`, and `wave` on the bottom edge, after Yeti's fixture. Asserts the slant's computed `clip-path` is a polygon and its `mask-image` is `none`, and that a point 3 px inside its bottom-right corner hits the stage, not the section, while the bottom-left corner hits the section (Yeti's hit test); the curve's and wave's `mask-image` is not `none` and their `clip-path` is `none`; the curve's strip is transparent near its ends and opaque at its middle (Yeti's alpha sample of the computed strip).
- `seam--edges`: slant sections with `edge` unset, `top`, and `both`, each with and without `flip`, in a left-to-right and a `dir="rtl"` wrapper. Asserts `::after` has a block size equal to the depth unless the edge is `top`, and `::before` when it is `top` or `both`; the cut corner moves with `flip` (hit test); and the computed `clip-path` is the same in both directions (the shape is physical).
- `seam--inputs`: Storybook controls bind `shape`, `size`, `edge`, and `flip`. The play function sets each, asserts the matching `data-*` value (`data-flip=""` for `true`), resets it to unset or `false`, and asserts the attribute is absent. With `size="sm"`, `"md"`, and `"lg"`, asserts the spacer's block size is twice `--yeti-space-xs`, `--yeti-space-sm`, and `--yeti-space-md` as computed on the page; unset equals `md`'s. A static `size="lg"` renders both `size="lg"` and `data-size="lg"` (the `inert` kind).
- `seam--alternating`: Yeti's components-guide run, a wave on the way out of one section and an unflipped wave on the way into the next (`Y/src/guides/components.md:159-166`), and the docs' slant on both edges with `flip` and `size="lg"`. Asserts both sections' text is at least 4.5:1 against their own backgrounds in both schemes, and that the two sections' boxes do not overlap.
- `seam--focus`: a padded seam holding a link at the inline-start edge of its content and a button at the end. With `focus()` and `:focus-visible` forced by a key press, asserts the focused element's outline box lies inside the section's border box and outside the cut region (usage rule 2; WCAG 2.4.7).
- `seam--custom-depth`: a wrapper that sets `--yeti-seam-size: 3rem` on the section in a story stylesheet. Asserts the spacer's block size equals the computed `3rem` for every `size` (the token wins, `seam.css:6`).

### Layer 2: browser-level (`npx nx test <lib>`, `seam.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiSeam, { tagName: 'section' })`: the host has class `seam` and `data-ngx-yeti-item-seam`, and no `data-shape`, `data-size`, `data-edge`, `data-flip`, or `size`; with `bindings` setting each input, the attributes follow after `whenStable()`; binding `undefined` removes the three enum attributes, and binding `flip` to `false` removes `data-flip`.
- While a `YetiSeam` fixture lives, one `<link data-ngx-yeti-styles="seam">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- The directive adds no listener to its host and no attribute beyond the class, the presence attribute, and the four `data-*` attributes.

A small test host covers what `createDirective` cannot: the template reference `#s="yetiSeam"` resolves; a bare static `flip` renders `data-flip=""`, and `flip="false"` renders none (`booleanAttribute`); a static `size="lg"` renders both `size="lg"` and `data-size="lg"`; `<section yetiSeam yetiBox yetiPaint="primary" gap="lg">` renders both item classes, both presence attributes, both item links, `data-paint`, and `data-gap` (ADR 0045; ticket 50 decisions 7 and 12); and the consumer's own `class` on the host is kept.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `seam.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture of section 8's markup whose text carries `i18n`, plus a section with a static `size="lg"`, a bare static `flip`, and a bound `shape` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; each seam renders `class` containing `seam` and `data-ngx-yeti-item-seam`, the bound `data-shape`, `data-size="lg"` beside the inert `size="lg"`, `data-flip=""`, and no `data-*` for an unset input; `<head>` holds one item link with `data-ngx-yeti-styles="seam"`, `data-beasties-skip`, and an `href` ending `components/seam/seam.css?v=<pin>`, ranked before the `nav` link when one is present and after the `table` link; no element carries a `jsaction` from the package.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `seam` has `YetiSeam`; `data-shape`, `data-size`, and `data-edge` have inputs whose unions equal the manifest's vocabularies `shape`, `size-control`, and `edge`; `data-flip` is a boolean input; the item has no markers, children, or events. A pin move that adds an attribute or a value fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids, after Yeti's own `seam.spec.js`: the hit tests, the strip alpha samples, the spacer sizes, and the contrast assertions in three engines, with `emulateMedia({ colorScheme: 'light' })` and `'dark'`; at a 320 px viewport `seam--default` and `seam--alternating` have no horizontal overflow (1.4.10); at 200% text zoom and with the 1.4.12 text-spacing values applied, every seam's last child ends at least the computed depth above its cut edge and no text node's box crosses the cut (1.4.4, 1.4.12; usage rule 3); with real key presses, Tab onto each control of `seam--focus` and a screenshot crop around each shows the ring's colour on all four sides (2.4.7); with `emulateMedia({ forcedColors: 'active' })`, every text keeps a contrast of at least 4.5:1 against its background, and a screenshot is recorded, not asserted (after [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 30 and 78). Recorded, not asserted (usage rules 4 and 6): a Yeti tooltip at a seam's edge (whether its bubble is clipped), a `popover` opened from inside a seam (whether it is drawn in full), and a curve seam served under `Content-Security-Policy: img-src 'self'` (which edge it draws).

Fixture-app half, built with `outputMode: 'server'`, with a `/seam` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route renders section 8's markup:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`; the seams' attributes after hydration equal the server HTML's;
- with JavaScript disabled, each seam's computed `clip-path`, `mask-image`, padding, and spacer size equal those with JavaScript on, and `@axe-core/playwright` with the six tags reports no violation;
- a `seam box` inside a `hydrate never` block keeps both item links and its computed `mask-image` and padding after every live seam and box on the page is removed (ADR 0060 point 4; ADR 0045's shared-host case);
- a seam inside a client-only `@defer` block with `seam` and `box` in the preload list shows no frame with `mask-image: none`;
- navigating from the seam route to a route without one removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html`, `docs.md`, and the components guide's alternating run for the stories, and its `test/browser/components/seam.spec.js` with the fixture `test/browser/fixtures/components/seam.html` for the hit tests, the strip alpha samples, the in-flow spacer, the per-scheme AA check, and axe; ticket 18's fixture app for the `hydrate never` case; ADR 0060's prototype for the server HTML and the item link; the [box](box.md) spec's composed story and painted-band contrast assertions; the [affix](affix.md) spec's ring-pixel screenshot crop.

## Out of Scope

- An input per token, a depth input in length units, or a shape outside Yeti's `shape` vocabulary (ADR 0004; ADR 0070 rule 2).
- A background, paint, or padding input on `yetiSeam`: those are `yetiPaint`'s, `yetiBox`'s, or the consumer's CSS (Part 2 row 37 names four inputs).
- Mirroring the shape by writing direction: Yeti's polygon is physical, and `flip` is the consumer's choice (section 6).
- Any check that the host is a block-level section, that it has padding, that its height follows its content, or that nothing overflows its edges. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- Package CSS for the seam, including forced colours and clipping guards: none; usage rules 2 to 4 and the layer-4 cases cover the clip (building-blocks 1.13; ADR 0060 point 8; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 184 to 188).
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiSeam]` with `shape`, `size`, `edge`, `flip`; no part directive | building-blocks Part 2 row 37; ticket 26 rows 137 to 140; [Decide: the spec list](../issues/11-decide-spec-list.md) row 37 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by Yeti's `YetiShape`, `YetiSizeControl`, `YetiEdge`, and `booleanAttribute`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2; ADR 0080 point 5; building-blocks 1.4 |
| `size` is `inert` on the seam's hosts | building-blocks 1.4; ticket 26 row 138, grilling question 15; the host list is usage rule 1 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 183) |
| `yetiSeam` beside `yetiBox` and `yetiPaint`, never hosting them; one presence attribute and one item file per item | architecture-guide P6; building-blocks 1.9; ADR 0045; ticket 50 decisions 7 and 12 |
| `YetiSeam` marks its host with `data-ngx-yeti-item-seam` and acquires the item file last in its constructor | ADR 0045; ADR 0060 point 2; ticket 50 decisions 42 and 45 |
| `exportAs`; class name with no collision | building-blocks 1.3; ADR 0080 points 3 and 4; ticket 50 decision 10 |
| Entry point `ngx-yeti/seam` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only; no Module | building-blocks 1.2; Part 2 row 37; ADR 0040 |
| Tokens are the consumer's, `--yeti-seam-size` included | ADR 0004 |
| Item file as a counted link in Yeti's order | ADR 0060 points 2 to 6 |
| Requirements on markup (host, padding, height, overflow, CSP) as usage rules asserted or recorded in the stories and e2e | ADR 0015 point 4; manifest `a11y.notes`; `docs.md`; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 183 to 187 |
| 4.5:1 text contrast asserted in both schemes; the cut edge is decoration with no 1.4.11 assertion | ADR 0015 point 3; ticket 50 decisions 8 and 58 |
| No ledger row; forced colours recorded, not fixed | Part 2 row 37; ticket 50 decisions 30 and 78 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 188) |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

An alternating run of bands, each flipped from the one before, from the consumer's data:

```html
@for (band of bands(); track band.id; let odd = $odd) {
  <section yetiSeam yetiBox gap="xl" [yetiPaint]="band.paint" shape="slant" [flip]="odd"
           [attr.aria-labelledby]="band.id">
    <h2 [id]="band.id">{{ band.title }}</h2>
    <p>{{ band.text }}</p>
  </section>
}
```

```ts
import { YetiBox, NgxYetiPaint } from 'ngx-yeti/box';
import { YetiSeam } from 'ngx-yeti/seam';

@Component({
  selector: 'app-landing-bands',
  imports: [YetiSeam, YetiBox, NgxYetiPaint],
  templateUrl: './landing-bands.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingBands {
  readonly bands = input.required<readonly Band[]>();
}
```

`NgxYetiPaint` is in the box spec's entry point. A wave out of one section and into the next, after Yeti's components guide: `<section yetiSeam yetiBox gap="xl" shape="wave">...</section>` followed by `<section yetiSeam yetiBox gap="xl" surface="raised" shape="wave" edge="top">...</section>`. A deeper cut on the top edge only: `<header yetiSeam yetiBox gap="lg" yetiPaint="secondary" edge="top" size="lg">`. A value newer than the pin: `<section yetiSeam [shape]="$any('zigzag')">`. A page whose seams render inside a client-only `@defer` block preloads the items: `provideYetiStyles({ preload: ['seam', 'box'] })`. One depth for every seam, in the consumer's stylesheet after Yeti: `:root { --yeti-seam-size: 4rem; }`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/seam/seam.css`, loaded by `YetiSeam` as a counted link (section 13). The consumer writes nothing for the seam beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps `data-size` to a space step (`:256-259`), and `data-paint` and `data-gap` for a composed box and paint (the [box](box.md) spec); the space token files declare `--yeti-space-*`.
3. **Cross-item rules:** none. `seam.css` names no other item, and no other item's CSS names `.seam`. A composed `box` loads its own file through `yetiBox`; its padding is what keeps content off the section's inline edges (usage rule 2).
4. **Tokens:** reads `--yeti-seam-size` when declared, else the space step of the size (section 2); writes none.
5. **What breaks without the item file:** the section keeps its background and padding with a straight edge, no cut, and no added depth, with no error. The `data-size` attribute still sets a private token, which nothing reads.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled all 49 of Yeti's class names and its attribute names with Tailwind 4.3.3, and only `container`, `grid`, and `table` (plus the attribute name `hidden`) produced a utility (measured); `seam` produced none.

### Platform features to adopt when the browser target moves

None. `clip-path` with `polygon()` and unprefixed `mask-image`, the two features the manifest lists as unguarded, are inside Baseline 2025 (section 6), and Yeti guards nothing for the seam.

### Single-page-application pieces relied on

None: the seam uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
