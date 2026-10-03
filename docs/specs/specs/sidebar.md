# Spec: sidebar (layout)

Ticket: [65. Spec: sidebar (layout)](../issues/65-spec-sidebar.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 15 and Part 1, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 56 to 60 and grilling questions 6, 7, 12, 14, 15, and 16, [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) (decisions 2, 6, 9, 18, and 42), [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). The item owns [ledger.md](../ledger.md) row A11Y-22, shared with `stack`, `shell`, `nav`, and `table` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 47, 170, and 195). `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x). The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decision 47), and each is cited where it applies.

## Problem Statement

Yeti's `sidebar` "pairs something with a natural width, such as a navigation list, a figure, or a form's summary, with content that should take whatever is left" (`Y/src/layouts/sidebar/docs.md`). The two sit side by side while the content keeps at least half the width, and stack when it cannot, with no breakpoint. It is one **Identity class**, `sidebar`, on a wrapping flex row with exactly two children. Four attributes configure it: `data-side` (which child is the sidebar, the first or the last), `data-width` (the sidebar's preferred width), `data-gap`, and `data-align`. One **Marker**, `data-sticky`, goes on either child and pins it at `--yeti-sticky-offset` from the top of the scrollport while the other scrolls past (`Y/src/layouts/sidebar/manifest.json`, `sidebar.css`). It has no **Module** and no events.

An application developer using the package cannot write `class="sidebar"` or any of those `data-*` attributes: a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). Written by hand, `data-width="small"` or `data-side="right"` compiles and silently falls back to Yeti's default; here it must fail to compile ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `sidebar` **Item file** loaded while a sidebar is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it the two children stack as plain blocks at every width, with no error.

Two more things make the item more than a class. The `data-sticky` marker sits on a child, and its start alignment applies only under a `.sidebar` (`.sidebar > [data-sticky]`), so the package needs a second directive for that child role ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) kind C). And a sticky child is the one part of this layout that can hide content: it paints above what scrolls under it, which matters for keyboard focus once the two children have stacked.

## Solution

Two directives in the secondary entry point `ngx-yeti/sidebar` ([building-blocks.md](../building-blocks.md) Part 2 row 15; 1.3):

- **`YetiSidebar`**, the **Item directive**, on `[yetiSidebar]`, `exportAs: 'yetiSidebar'`. It binds `sidebar` as a static host class, and binds `data-side`, `data-width`, `data-gap`, and `data-align` from the typed inputs `side` (`YetiSide`), `width` (`YetiWidth`), `gap` (`YetiGap`), and `align` (`YetiAlign`). It sets the static presence attribute `data-ngx-yeti-item-sidebar` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), acquires the `sidebar` item file when it is created, on the server too, and releases it when it is destroyed (ADR 0060 point 2), through `injectYetiItemStyles('sidebar')` from `ngx-yeti/styles` as the last statement of its constructor ([setup](setup.md); ticket 50 decisions 42 and 45). It provides `yetiSidebarToken`.
- **`YetiSidebarChild`**, a **Part directive** for a child that sticks, on `[yetiSidebarChild]`, `exportAs: 'yetiSidebarChild'`. It binds `data-sticky` from a `sticky` input with `booleanAttribute` (ticket 26 row 60, kind C). A child that does not stick needs no directive (ticket 26 grilling question 6).

The developer writes `<div yetiSidebar width="xs" gap="lg">` where Yeti's docs write `<div class="sidebar" data-width="xs" data-gap="lg">`, and `<nav yetiSidebarChild sticky>` where they write `<nav data-sticky>`. An unset input renders no attribute, so Yeti's own default (`start`, `sm`, `md`, `stretch`) applies from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1).

Everything else is Yeti's CSS and the platform. Both directives are **types only**: no listener, no render callback, no service, and no DI beyond the part's optional parent token. The switch between side by side and stacked is flex-basis arithmetic against the container's width, and sticking is CSS `position: sticky`, so both are right on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block.

## User Stories

1. As an application developer, I want to pair a fixed-width child with flexible content using one directive attribute, so that I never write Yeti's `sidebar` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="sidebar"` and `data-*` attributes, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want the first child to be the sidebar by default, so that a navigation list written first sits at the start.
4. As an application developer, I want `side="end"` to make the last child the sidebar, so that I can put the main content first in the source and still show the sidebar after it.
5. As an application developer, I want `side` typed by Yeti's `side` vocabulary, so that `side="right"` fails to compile.
6. As an application developer, I want to set the sidebar's preferred width with a `width` input typed by Yeti's `width` vocabulary, so that `width="small"` fails to compile.
7. As an application developer, I want to set the space between the two children with a `gap` input typed by Yeti's `gap` vocabulary, fluid pairs included, so that the gap matches every other layout's.
8. As an application developer, I want to set the vertical alignment of the two children with an `align` input, so that a short sidebar can sit at the top of a tall article.
9. As an application developer, I want a static attribute such as `width="xs"` to type-check, so that I need no property binding for a constant.
10. As an application developer, I want an input I leave unset to render no attribute, so that Yeti's own default applies and the server HTML stays Yeti's minimal markup.
11. As an application developer, I want the two children to stack when the content would fall below half the width, so that the layout handles awkward middle widths with no breakpoint.
12. As an application developer, I want the switch decided by the sidebar's own width, so that the same markup works in a narrow panel and across a full page.
13. As an application developer, I want to pin either child with `yetiSidebarChild sticky`, so that a section nav stays in view beside a long article.
14. As an application developer, I want a sticky child to take its own height rather than the row's, so that it actually sticks.
15. As an application developer, I want to toggle `sticky` from state, so that a child sticks only when my UI asks it to.
16. As an application developer, I want a child that does not stick to need no directive, so that only the child that sticks carries a second attribute.
17. As an application developer, I want to set how far below the top a sticky child stops with `--yeti-sticky-offset`, so that it clears my own sticky header.
18. As an application developer, I want to bind every input from signals, so that the layout follows my state under zoneless change detection.
19. As an application developer, I want a static `align="center"` to leave no HTML `align` attribute on the host, so that the browser's old presentational hint does not centre my text.
20. As an application developer, I want a static `width="xs"` to do nothing beyond the input, so that the HTML `width` attribute has no effect on my element.
21. As an application developer, I want to put `yetiSidebar` beside `yetiBox` with one `gap`, so that one attribute is both the box's padding and the sidebar's gap, as Yeti's single attribute means.
22. As an application developer, I want `yetiSidebarChild` beside another item's directive on the same child (a `box`, a `stack`, a `frame`, a `nav`), so that I can build Yeti's media object and section-nav examples from layouts.
23. As an application developer, I want `yetiSidebarChild sticky` beside `yetiNav sticky` on one `nav` to share one `sticky` attribute, so that one `data-sticky` is rendered.
24. As an application developer, I want a `center` layout inside a sidebar child to keep its inline centring, so that the two layouts compose whatever order their item files load in.
25. As an application developer, I want a component of mine to be a sidebar child, so that `<app-section-nav>` hosts can be the children.
26. As an application developer, I want the sidebar item file loaded when the first sidebar renders and removed after the last leaves, so that I do not import `sidebar.css` globally.
27. As an application developer, I want the item file in the server HTML when a server-rendered page has a sidebar, so that the first paint is already side by side or stacked.
28. As an application developer, I want the layout right with JavaScript off under SSR and prerendering, so that the page reads and the sticky child sticks before any script runs.
29. As an application developer, I want hydration to change nothing on a sidebar or its children, so that I get no `NG05xx` error and no reflow.
30. As an application developer, I want a sidebar inside a `@defer (hydrate on ...)` block to stay laid out before and after the block hydrates, so that incremental hydration does not collapse it.
31. As an application developer, I want a sidebar inside a `hydrate never` block to keep its styles for as long as it is on the page, so that a dehydrated sidebar is not unstyled when a live one elsewhere leaves.
32. As an application developer, I want to know that a sidebar inside a client-only `@defer` block needs `sidebar` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
33. As an application developer using `withI18nSupport()`, I want translated sidebar content to hydrate without being re-rendered, so that localised pages keep the server's DOM.
34. As an application developer, I want template references (`#s="yetiSidebar"`, `#c="yetiSidebarChild"`), so that both directives follow the package's `exportAs` rule.
35. As an application developer, I want to import both directives from `ngx-yeti/sidebar`, so that a `@defer` block can split them with the rest of the item.
36. As an application developer, I want the input value types re-exported by name (`YetiSide`, `YetiWidth`, `YetiGap`, `YetiAlign`), so that I can type my own signals that feed the inputs.
37. As an application developer, I want the usage rules stated (exactly two direct children, content first in the source when it matters more, a sticky child that fits the viewport, no static Yeti attributes), so that I use the layout as Yeti intends.
38. As a screen-reader user, I want the sidebar to add no role, name, or announcement, so that the page's own landmarks and headings are what I hear.
39. As a screen-reader user, I want the two children read in source order whichever side the sidebar shows on, so that `side="end"` changes nothing about what I hear.
40. As a keyboard user, I want focus to follow the visual order in both arrangements, in left-to-right and right-to-left pages, so that focus does not jump around.
41. As a keyboard user, I want a focused control in the content never to be hidden entirely behind a sticky child, so that I can see where focus is.
42. As a low-vision user, I want the two children to stack when I zoom in or the container narrows, so that I never scroll sideways to read the content.
43. As a low-vision user who overrides text spacing, I want both children to grow with their content, so that my spacing settings clip nothing.
44. As a package maintainer, I want the contract check to cover the four attributes, the `sticky` marker, and every value of their vocabularies, so that a pin move that adds a value or attribute fails before release.
45. As a package maintainer, I want the SSR smoke to assert the server HTML of a sidebar, its sticky child, and its item link, so that the first paint is proven.
46. As a package maintainer, I want the fixture app to render the layout on a prerendered and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
47. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default fails no test for no reason.
48. As a package maintainer, I want the geometry tests to follow Yeti's own `sidebar.spec.js` cases, so that the package proves the same layout Yeti proves.
49. As a package maintainer, I want the class names `YetiSidebar` and `YetiSidebarChild` checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/layouts/sidebar/manifest.json`, `sidebar.css`, `docs.md`, and `example.html`, and in `Y/src/layouts/attributes.css`, `Y/src/tokens/space.css`, `Y/src/tokens/tokens.json`, and `Y/schema/vocabulary.json`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `sidebar`, `layout`, `Page Layouts` |
| `class` | `sidebar` |
| `attributes` | `data-side`: enum, vocabulary `side` (`start`, `end`), default `start`, "Which child is the sidebar: the first (start) or the last (end)." `data-width`: enum, vocabulary `width` (`2xs` to `2xl`), default `sm`, "The sidebar's preferred width." `data-gap`: enum, vocabulary `gap` (29 values), default `md`. `data-align`: enum, vocabulary `align` (`start`, `center`, `end`, `stretch`, `baseline`), default `stretch`, "Vertical alignment of the two children when side by side." |
| `classes` | empty |
| `children` | `> *` (min 2, max 2): "Exactly two: the sidebar and the content, in either order according to data-side." |
| `markers` | `data-sticky`: boolean, `on: "> *"`: "Pins this child at --yeti-sticky-offset from the top of the scrollport while the other one scrolls past it. It takes its own height rather than the row's, since a stretched item has nowhere to move." |
| `tokens` | public: `--yeti-width-sm` ("The default sidebar width."), `--yeti-space-md` ("The default gap."); private: `--_yeti-gap`, `--_yeti-width`, `--_yeti-align` |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "Purely visual. Put the content first in the source when it matters more, and use data-side=\"end\" to show the sidebar after it." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: `flexbox gap`; `guarded`: empty |
| `since` | `7.0.0` |

How it works, in `@layer yeti.layouts`: `.sidebar` is a wrapping flex row whose `align-items` and `gap` read private tokens, and each `.sidebar:not([data-*])` rule supplies a default only when its attribute is absent. `.sidebar > *` zeroes every child's margins. The sidebar child (`:first-child`, or `:last-child` under `[data-side="end"]`) takes `flex-basis: var(--_yeti-width)` and `flex-grow: 1`. The content child takes `flex-basis: 0`, `flex-grow: 999`, and `min-inline-size: 50%`. So the two share a row while the container's inline size is at least twice the sidebar's width plus the gap, and wrap to one child per row below that, both at full width (read; Yeti's `sidebar.spec.js` measures both sides). `.sidebar > [data-sticky]` sets `align-self: start`, so a sticky child keeps its own height. Neither file uses `@container`.

The value rules for `data-width`, `data-gap`, and `data-align` are in the **Always-loaded group**'s `layouts/attributes.css` (`:6-37` for gap, `:147-152` for align, `:171-177` for width). `data-side` has no value rule: `sidebar.css` matches `[data-side="end"]` directly. The marker's own rule is also always loaded: `[data-sticky]` in `@layer yeti.utilities` sets `position: sticky`, `inset-block-start: var(--yeti-sticky-offset)`, and `z-index: 2` (`attributes.css:333-342`), so a sticky element sticks under any scroller, and `sidebar.css` adds only the start alignment that a row needs. `--yeti-width-sm` defaults to `24rem` (`Y/src/tokens/space.css:38`), `--yeti-sticky-offset` to `var(--yeti-space-md)` (`:61`), and `--yeti-scroll-padding` to `var(--yeti-sticky-offset)` (`:69`), which the root reads as `scroll-padding-block-start` (`Y/src/base/typography.css:8`); all quoted at the pin as [ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md) allows.

Attributes left to the consumer: none (ticket 26 rows 56 to 60). The elements and any ARIA on them are the consumer's: Yeti's example puts `aria-label="Section"` on a `nav` sidebar child.

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `sidebar` | static host class on `[yetiSidebar]` (`YetiSidebar`) | always | ADR 0003 point 1; Part 2 row 15 |
| Attribute `data-side` | which child is the sidebar | input `side` on `yetiSidebar`: `YetiSide \| undefined`, bound `[attr.data-side]`, `null` when unset | unset renders nothing; Yeti's `start` applies. `side` is not an HTML attribute | ticket 26 row 56 (R) |
| Attribute `data-width` | the sidebar's preferred width | input `width`: `YetiWidth \| undefined`, `[attr.data-width]` | unset renders nothing; Yeti's `sm` applies. Static form: `inert` (below) | ticket 26 row 57 (R); building-blocks 1.4 |
| Attribute `data-gap` | space between the two children | input `gap`: `YetiGap \| undefined`, `[attr.data-gap]` | unset renders nothing; Yeti's `md` applies. Not an HTML attribute | ticket 26 row 58 (R) |
| Attribute `data-align` | vertical alignment when side by side | input `align`: `YetiAlign \| undefined`, `[attr.data-align]` | unset renders nothing; Yeti's `stretch` applies. Static form: `removed`, `'[attr.align]': 'null'`, because HTML `align` is a presentational hint on any element in Chromium and WebKit | ticket 26 row 59 (R); building-blocks 1.4 |
| Marker `data-sticky` (on `> *`) | pins the child below the top of the scrollport | input `sticky` on `[yetiSidebarChild]` (`YetiSidebarChild`): `boolean` with `booleanAttribute`, bound `[attr.data-sticky]` as `''` when true and `null` when false | default `false`, renders nothing. `sticky` is not an HTML attribute | ticket 26 row 60 (C) |
| Children `> *` | the sidebar and the content | no directive for a child that does not stick | not applicable | ticket 26 grilling question 6 |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Token `--yeti-width-sm` | the default sidebar width | the consumer's; the package writes none | not applicable | ADR 0004 |
| Token `--yeti-space-md` | the default gap | the consumer's | not applicable | ADR 0004 |
| Tokens `--yeti-width-*`, `--yeti-space-*` | the values each `width` and `gap` value reads | the consumer's | not applicable | ADR 0004 |
| Tokens `--yeti-sticky-offset`, `--yeti-scroll-padding` | where a sticky child stops; where a scroll into view stops | the consumer's; the package writes none | not applicable | ADR 0004; building-blocks 1.9 |
| Tokens `--_yeti-gap`, `--_yeti-width`, `--_yeti-align` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-sidebar=""` on `[yetiSidebar]` only | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2; ticket 50 decision 6 |
| Injection token | not Yeti's | `yetiSidebarToken`, provided by `YetiSidebar` | not applicable | ADR 0070 kind C; building-blocks 1.9 |

The `inert` kind for `width` (building-blocks 1.4; ticket 26 row 57 and grilling question 15): HTML's `width` is a presentational hint on `img`, `table`, `iframe`, `video`, `canvas`, and a few obsolete forms, none of which can hold two flow children as a flex container, so it does nothing on the sidebar's hosts (`div`, `section`, `main`, `article`, `aside`, `header`, `footer`, `form`). A static `width="xs"` stays on the host beside `data-width="xs"`, and the directive binds nothing for it.

The `removed` kind for `align`: a static `align="center"` is accepted. The directive binds the HTML attribute to `null`, so the server HTML has none; hydration writes the static value back and the `null` binding removes it in the same pass, so the final DOM equals the server's (ticket 50 decision 9). Layer 4 asserts that no frame paints with `align` present.

The part directive `YetiSidebarChild` sets no presence attribute and acquires no item file. Only an item's root directive does, because Yeti's CSS for a part applies only under the root's class, and the root's presence attribute keeps the file loaded (ticket 50 decision 6). The marker's own `position: sticky` rule is in the always-loaded group, so it needs no item file either.

The input value types are Yeti's own, from the package's generated `yeti-types.ts`, re-exported by name and never redeclared ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5; ADR 0060 point 10). Each is a full vocabulary, so no `Extract` is needed.

**Module replaced:** none. Yeti's `sidebar` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 15, "Yeti module: none"). Foundation 6's Sticky plugin, with its placeholder element and pin offset, is the `data-sticky` marker in Yeti (`Y/src/guides/migrating.md:97`), which needs no script.

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads `--yeti-width-sm` and `--yeti-space-md` for its defaults, and through the always-loaded value rules whichever `--yeti-width-*` and `--yeti-space-*` (or the fluid `--yeti-space-*-static` and private pair tokens) a set attribute names. A sticky child reads `--yeti-sticky-offset`, and the root's scroll padding reads `--yeti-scroll-padding`. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`. The width, space, and sticky-offset tokens are derived tokens, so they also take effect on one sidebar and its descendants (`Y/src/guides/theming.md:38`); Yeti's catalogue says to set `--yeti-sticky-offset` "to a sticky bar's height on whatever holds the things that stick below it" (`Y/src/tokens/tokens.json:125`). `--yeti-scroll-padding` is "Root-level: it is read by the root's scroll padding" (`tokens.json:126`), so on a sidebar it does nothing. `--yeti-width-sm` is also the threshold or width of any other item a consumer sets to `sm` (`columns`, `nav`, `media`, `scroller`, `shell`), so a `:root` value reaches them all; the package documents this and adds nothing. **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- `YetiSidebar` provides `yetiSidebarToken` (`InjectionToken<YetiSidebar>`, `useExisting`), building-blocks 1.9 and 1.3's token naming.
- `YetiSidebarChild` injects it with `{ optional: true, skipSelf: true }` (ADR 0070 kind C). Nothing in this milestone reads it: the marker works through Yeti's CSS alone, and the **In-item check** that would use it belongs to a later milestone (map, Milestones). A part outside a sidebar renders its marker and still sticks through the always-loaded rule, but without `align-self: start` a stretched flex or grid item has nowhere to move (`attributes.css:318-332`). This is building-blocks 1.9's "degrades as its spec documents" case.
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"). A consumer composes by writing directives beside each other: `yetiSidebar` with `yetiBox` on one element, or `yetiSidebarChild` with `yetiBox`, `yetiStack`, `yetiFrame`, or `yetiNav` on one child, as Yeti's example and media docs do.
- Shared input names (building-blocks 1.4, shared vocabularies; ticket 26 grilling question 16): `gap` is `YetiGap` on every reader, `align` is `YetiAlign` on all 8, `width` is `YetiWidth` on `media`, `scroller`, and `shell`, `side` is `YetiSide` on `media`, `hero`, `dropdown`, and `enter`, and `sticky` is `boolean` on `yetiNav`, `yetiStackChild`, and `yetiShellRegion`. So two package directives on one element never declare one input name with different types, and one static attribute feeds both and both bind the one `data-*` Yeti means. `<nav yetiNav yetiSidebarChild sticky>` renders one `data-sticky=""`.
- The only other injection is the root styles service of ADR 0060, through `injectYetiItemStyles('sidebar')` ([setup](setup.md)), with which `YetiSidebar` acquires and releases the item file. That service is the [setup](setup.md) spec's and ADR 0060's.
- Generated ids and the platform's relationship attributes: none. The layout renders no `id` and references none, so it does not use [generated-ids](generated-ids.md).

### 4. API

| Member | `YetiSidebar` | `YetiSidebarChild` |
| --- | --- | --- |
| Class name | not among the 46 names `yeti.d.ts` exports at the Pin (the orchestrator's check of 2026-10-03 under ADR 0080), so it takes `Yeti`, not `NgxYeti` (ADR 0080 point 4) | as left |
| Selector | `[yetiSidebar]` (Part 2 row 15) | `[yetiSidebarChild]` (Part 2 row 15; ticket 26 row 60; this spec fixes the provisional name, as [Decide: the glossary](../issues/10-decide-glossary.md) left part names to the specs) |
| `exportAs` | `yetiSidebar` | `yetiSidebarChild` |
| Entry point | `ngx-yeti/sidebar` (building-blocks 1.3; ADR 0011 clause 10) | same |
| Inputs | `side: YetiSide \| undefined` (Yeti default `start`); `width: YetiWidth \| undefined` (`sm`); `gap: YetiGap \| undefined` (`md`); `align: YetiAlign \| undefined` (`stretch`); each `input()` with no default value | `sticky: boolean`, `booleanAttribute`, default `false` |
| Host | static `class: 'sidebar'`; static `data-ngx-yeti-item-sidebar: ''`; `[attr.data-side]`, `[attr.data-width]`, `[attr.data-gap]`, `[attr.data-align]` from the inputs, `null` when unset; `'[attr.align]': 'null'` with a source comment naming the presentational hint it prevents | `[attr.data-sticky]`: `''` when `sticky()` is true, else `null` |
| Providers | `yetiSidebarToken` | none |
| Injection | the ADR 0060 styles service, through `injectYetiItemStyles('sidebar')` | `yetiSidebarToken`, `{ optional: true, skipSelf: true }` |
| Models, outputs, methods, listeners | none | none |
| Lifecycle | `injectYetiItemStyles('sidebar')` from `ngx-yeti/styles` is the last statement of its constructor, after anything there that can throw (nothing does today); it acquires the `sidebar` item file, on the server too, and releases it through `DestroyRef` (ADR 0060 point 2; building-blocks 1.9; [setup](setup.md); ticket 50 decisions 18, 42, and 45) | none |

No input default differs from Yeti's (ADR 0070 rule 1). A static attribute type-checks as a string literal under `strictTemplates`, so `width="xs"` compiles and `width="xxs"` does not (ADR 0070 rule 2; ticket 26 grilling question 14, read, not run).

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiSidebar` on an element that holds flow content (`div`, `section`, `main`, `article`, `aside`, `header`, `footer`, or `form`), and give it exactly two direct children (manifest `children`, min 2, max 2). Each child is an element or a component's host element. `@if`, `@for`, `@defer`, and `ng-container` add no element, so the elements they render are the children; a `@defer` block's placeholder or loading element is a child while it shows (inferred from Yeti's `> *` selectors). With one child, that child matches both the sidebar and the content rules; with three, the middle one matches neither (read in `sidebar.css`, not measured).
2. Put the content first in the source when it matters more, and use `side="end"` to show the sidebar after it (manifest `a11y.notes`). `side` picks which child is the sidebar and never reorders them, so the reading order is the source order on both sides. Do not reorder the children with CSS `order` or a reversed direction (WCAG 1.3.2, 2.4.3).
3. Put `yetiSidebarChild` only on a direct child of a `yetiSidebar` host, and only on a child that sticks. A child that does not stick needs no directive.
4. A sticky child must stay usable when it is stuck ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 47; ledger row [A11Y-22](../ledger.md)). Stick only a child no taller than the smallest viewport the page supports, so that its own content can be reached. Once the two children have stacked, a sticky child that comes first sits above the other one while it scrolls under, so set `--yeti-scroll-padding` on the root to at least the sticky child's height on pages where that happens, or stick only a child that comes last in the stacked order. Yeti's default scroll padding is the sticky offset, which clears no bar of its own (`Y/src/tokens/space.css:56-69`).
5. Do not write `class="sidebar"`, `data-side`, `data-width`, `data-gap`, `data-align`, `data-sticky`, or `data-ngx-yeti-item-sidebar` statically on either host. The directives bind them, and hydration writes a static attribute back before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"; ADR 0070 consequences). A value newer than the pin goes through `$any` (`[width]="$any('3xl')"`, ADR 0070).
6. Write `align` either way: `align="center"` or `[align]="alignment()"`. The directive removes the HTML `align` attribute that the static form leaves (section 2).
7. Bind every input from values that are the same on the server and the client, never from a browser-only read such as the window's width. The sidebar already follows its own width in CSS (building-blocks 1.7), and the hydration constraints require the same DOM on both sides.
8. Import `YetiSidebar`, and `YetiSidebarChild` where a template writes it, in every component whose template writes the attribute. A **Forgotten import** of `YetiSidebarChild` with a static `sticky` renders a child that does not stick, with no error; only a bound input (`[sticky]`, `[width]`) makes the compiler report it (NG8002), or a template reference naming the `exportAs` (NG8003) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `sidebar` | Nearest in Angular Material: `MatSidenavContainer` and `MatSidenav` |
| --- | --- | --- |
| Shape | an item directive on the consumer's element, plus a part directive on a sticky child | components `<mat-sidenav-container>` with `<mat-sidenav>` and `<mat-sidenav-content>` (`NC/src/material/sidenav/sidenav.ts:27`, `:47`; `drawer.ts:716`) |
| Side | `side`: `start` or `end`, which child is the sidebar | `position`: `'start' \| 'end'` (`drawer.ts:216-219`) |
| Width | `width` from Yeti's `width` vocabulary; the pair stacks below twice the width plus the gap | set by the consumer's CSS; the drawer overlays or pushes content, and never stacks |
| Staying in view | `sticky` on either child, CSS `position: sticky`, offset by `--yeti-sticky-offset` | `fixedInViewport` with `fixedTopGap` and `fixedBottomGap`, bound as inline `top` and `bottom` styles (`sidenav.ts:61-63`, `:72-86`) |
| Accessibility | none of its own: purely visual | the drawer manages focus, a backdrop, and Escape for its modes |
| `exportAs` | `yetiSidebar`, `yetiSidebarChild` | `matSidenav`, `matDrawer`, `matDrawerContainer` (`sidenav.ts:48`; `drawer.ts:171`, `:717`) |

Nothing from Material's API applies beyond the `start` and `end` vocabulary, which Yeti's `side` already has: the sidenav is a behavioural drawer that opens and closes, while the sidebar is always shown and places the consumer's own content. Material's offset is a number input in pixels; Yeti's is a token (ADR 0004). The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 15; building-blocks 1.2). The reason, row 1's, which row 15 takes ("as row 1"): Yeti's CSS does the whole job; the directives add the class, the typed attributes and the marker, the item-file acquisition, and `exportAs`. Flexbox `gap` and sticky positioning are inside Baseline 2025 (building-blocks 1.2; `sticky-positioning` is high-Baseline since 2019 in [Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md)). No Aria pattern applies (a layout has no role), and no CDK piece is used: there is no id, focus, keyboard, observer, direction read, or scroll measurement in script. Flex layout follows the CSS `direction` by itself, so RTL needs no `Directionality`, and sticking needs no `ScrollDispatcher`.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The layout adds no role, state, or property, and no tab stop.
- **Keyboard:** none. Focus moves through the children's own content in DOM order.
- **Names:** none. A `nav` or `aside` child maps to its landmark and is named by its own `aria-label`, as in Yeti's example; those are the consumer's elements and the package adds nothing.

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The children are the consumer's elements and keep their semantics; the directives add no role. |
| 1.3.2 Meaningful Sequence | `side` picks which child takes the sidebar's basis and never reorders, so both arrangements and both sides follow DOM order (manifest `a11y.notes`). Usage rule 2 keeps the consumer from reordering. Layer 1 asserts that the accessibility tree order equals the DOM order with `side="end"`. |
| 1.4.4 Resize Text | Widths and gaps are `rem`-based tokens (`--yeti-width-sm: 24rem`), so text zoom raises the switching width with the text (read, not measured). Layer 4 repeats the stacking case at 200 % text zoom. |
| 1.4.10 Reflow | Below twice the sidebar's width plus the gap, both children take the full width. Ticket 17 measured no page-level horizontal scroll on the sidebar example at 320 x 640 in Chromium (section 2.4, 46 of 49 pages clean). Layer 4 asserts it at a 320 px viewport. A sticky child taller than the viewport is usage rule 4's and ledger row [A11Y-22](../ledger.md)'s ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 47). |
| 1.4.11 Non-text Contrast, 1.4.3 Contrast (Minimum) | The layout draws nothing; its children's colours are theirs. axe reported no violation and no incomplete result on the sidebar example (ticket 17, section 3), so the **Story gate** covers it and no play-function assertion is added. |
| 1.4.12 Text Spacing | The rules set no height and no overflow; both children grow with their content (read). |
| 2.4.3 Focus Order | Visual order equals DOM order in left-to-right and right-to-left pages and on both sides (layer 1, `sidebar--rtl` and `sidebar--end`). |
| 2.4.11 Focus Not Obscured (Minimum) | Side by side, a sticky child sits beside the content and covers none of it. Stacked, a sticky first child paints above the content scrolling under it (`z-index: 2`, `attributes.css:333-342`), and a control that focus scrolls into view stops at `--yeti-scroll-padding` from the top, which by default clears only the offset, not the stuck child. Usage rule 4 states how the consumer avoids it, and layer 4 asserts the backward-Tab case with the rule followed and records it with Yeti's defaults; ledger row [A11Y-22](../ledger.md) records the gap ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 47). |

**Ledger rows owned:** A11Y-22 ([ledger.md](../ledger.md); Part 2 row 15), shared with `stack`, `shell`, `nav`, and `table` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 47, 170, and 195). The package adds no accessibility or standards feature that Yeti lacks, and ticket 17 classed the sidebar with the layouts that "conform as far as measured" (section 3), on an example with no sticky child. A11Y-22, "a stuck sticky child can obscure focus" (WCAG 2.2 2.4.11 and 1.4.10), covers the stacked sticky case, verified *inferred* and tested by layer 4, with no package CSS, after the ledger's rule that every gap found is a row whether or not it is closed ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 17).

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<div yetiSidebar width="xs" gap="lg">
  <nav yetiBox yetiBorder surface="raised" yetiSidebarChild sticky aria-label="Section">
    <a routerLink="/overview">Overview</a>
  </nav>
  <article yetiBox yetiBorder surface="raised">
    <h2>Content</h2>
    <p>Takes the remaining width, and the whole width once the two no longer fit.</p>
  </article>
</div>
```

Server HTML and the hydrated DOM are the same. The parent carries `yetisidebar=""`, `width="xs"` (inert), `gap="lg"` (the static input attribute, matched by no rule), `class="sidebar"`, `data-width="xs"`, `data-gap="lg"`, and `data-ngx-yeti-item-sidebar=""`, and no `data-side`, `data-align`, or `align`. The `nav` carries `yetisidebarchild=""`, `sticky=""`, and `data-sticky=""` beside the box's own class, attributes, and presence attribute, and no presence attribute of the sidebar (section 2). The `article` carries only its box attributes. With `align="center"` written statically, the parent carries `data-align="center"` and no `align` in the server HTML and after hydration.

The server also writes the item links into `<head>` in Yeti's order: for the sidebar, `rel="stylesheet"`, `href` `<url>layouts/sidebar/sidebar.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="sidebar"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided, followed by the `box` link, which comes later in `yeti.css` (ADR 0060 points 2, 3, and 5; `Y/src/yeti.css:22`, `:29`). The client adopts the links at bootstrap. The layout has no closed or open state.

The delta from Yeti's docs markup: the consumer writes `yetiSidebar` and input names where the docs write `class="sidebar"` and `data-*` names, and `yetiSidebarChild sticky` where they write `data-sticky`. The `href="#"` of Yeti's example becomes a real route, which the package does not change.

### 9. Animation

None. The layout has no state and no transition, and Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). Changing a bound input moves the children at once, and sticking is scroll-linked positioning, not an animation. A child the consumer inserts or removes with `@if` may carry a class-form `animate.enter` or `animate.leave` of the consumer's or Yeti's `enter` utility (the [enter](enter.md) spec). The item link stays until Angular removes the last host, because removal waits for the DOM (ADR 0060 point 4). A server-rendered sidebar never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes and marker, and the item link in `<head>` (section 8). Everything at first paint is a host binding (ADR 0011 clause 1). Nothing is **Pre-hydration state**: no person and no Yeti module can change a `data-*` attribute (ticket 26 grilling question 12). Scrolling before hydration moves a sticky child by CSS alone and writes nothing to the DOM.
- **Before hydration:** neither directive creates a node, reads layout, starts a timer or observer, or touches `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is `YetiSidebar`'s item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** both hosts are claimed as they are; bindings computed from the same inputs give the same values (usage rule 7); 0 style mutations (ADR 0060 point 5, measured for the mechanism). A static `align` is written back and removed again in the same pass (section 2).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the layout and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism). A `@defer` block inside a sidebar adds no element, so its content is a direct child, and `yetiSidebarChild` inside it works before and after the block hydrates.
- **`hydrate never`:** the layout is its server HTML and stays styled while its host is connected, whatever live sidebars do (ADR 0060 point 4; ADR 0045's presence attribute is what the check queries). On a host shared with `box`, each item's presence attribute keeps its own link (ADR 0045). A sticky child still sticks. Nothing is lost except changing a bound input, which needs Angular.
- **Client-only `@defer`:** the item file is fetched when `YetiSidebar` is constructed, which can show unstyled frames (the two children stacked, the sticky child not sticking); the consumer closes the gap with `provideYetiStyles({ preload: ['sidebar'] })` (ADR 0060 point 6; [setup](setup.md)).
- **Event replay:** neither directive declares a listener, so nothing replays and no `jsaction` is added by them.
- **`withI18nSupport()`:** sidebar content is usually translated with `i18n` in the consumer's component. The directives add no `i18n` block; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** inputs are `input()` signals read by host bindings, so a changed input refreshes its attribute with no zone (map, Standing rulings, item 43; ADR 0070 rule 4).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the layout is readable, side by side or stacked by the container's width, and a sticky child sticks, because the class, the attributes, the marker, and the item link are in the server HTML. Nothing is lost: the layout has no behaviour. A client-only application gets no such promise.
- **Hydration boundary:** the parent and its children may sit in different boundaries. The layout has no ids or references, and a deferred child hydrates on its own.

### 11. Hydration constraints

The layout complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; `data-side`, `data-width`, `data-gap`, `data-align`, and `data-sticky` come from inputs whose values usage rule 7 keeps equal on both sides.
- **No direct DOM manipulation:** the directives write nothing to the DOM outside host bindings. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directives change no element. The consumer's markup must be valid as written; a sidebar on a `p` cannot hold a `nav`, so the parser would repair it and differ from the server's DOM; usage rule 1's hosts avoid it.
- **`preserveWhitespaces`:** the directives have no template. White-space-only text in a flex container is not a flex item, and `:first-child` and `:last-child` count elements only, so whitespace changes neither which child is the sidebar nor the layout.
- **No output branched on the platform:** none.
- **Static attributes the directives bind:** usage rule 5 keeps the consumer from writing them. The static `align` of usage rule 6 is the decided exception: the `null` binding removes it in the same hydration pass, and layer 4 asserts that no frame paints with it (ticket 50 decision 9). The static `width` is `inert` and never bound, so hydration writes back the same value the server rendered.

### 12. Single-page application

None. The layout has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). A link inside a sidebar's `nav` is the consumer's link. A fragment jump to a heading in the content stops at `--yeti-scroll-padding` from the top, the root's scroll padding (usage rule 4). On a route change, a route's sidebars leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-sidebar]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders a sidebar again re-inserts it. A sidebar in the persistent shell outside the `router-outlet` keeps its sticky child stuck across routes, with nothing to reset.

### 13. Item file

`yeti-css/css/layouts/sidebar/sidebar.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiSidebar]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:22`, after `cluster` and before `columns`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-sidebar` has left the DOM. `YetiSidebarChild` acquires nothing (section 2). The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the `[data-width]`, `[data-gap]`, and `[data-align]` value rules, the `[data-sticky]` rule, and the tokens), and optionally `provideYetiStyles({ preload: ['sidebar'] })`. The layout adds nothing to it. Cross-item files acquired: none (`sidebar.css` has no cross-item rule; ADR 0060 point 9).

One order matters inside `yeti.layouts` (read, not measured): `.sidebar > *` sets `margin: 0`, and `.center` sets `margin-inline: auto`, at equal specificity, so a `center` that is a sidebar's child keeps its inline centring only because `center.css` comes after `sidebar.css` in `yeti.css` (`:22`, `:30`). ADR 0060 point 3 inserts links in that order whichever directive is created first, which is the case ticket 23 measured for `stack` and `center`. Layer 4 tests it for the sidebar.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class, attributes, and marker in the DOM, the item link, where the two children land, and where a sticky child stops. It never asserts a private field, the parent token's value, or how the styles service counts. No test depends on a public token's default value or on a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3). A layout test sets `width` and `gap` explicitly and sizes the container against a probe element in the same story whose inline style is `inline-size: calc(2 * (var(--yeti-width-<w>) + var(--yeti-space-<g>)))`: the container is the probe's width plus `2rem` for the side-by-side case and minus `2rem` for the stacked case, so the assertion holds for any token value. A sticky test compares with a probe styled `block-size: var(--yeti-sticky-offset)`, or reads the token's computed value, as Yeti's own `Y/test/browser/layouts/sidebar.spec.js` does with its `token()` helper. "Side by side" means equal `offsetTop`; "stacked" means the second child's top is at or below the first child's bottom and both have the container's width within 1 px. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `sidebar` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `sidebar--default`: section 8's markup without `sticky` (Yeti's example), in a resizable container. Asserts the parent's `class` is `sidebar`, `data-width="xs"`, `data-gap="lg"`, `data-ngx-yeti-item-sidebar`, and no `data-side` or `data-align`; no child has a role or `tabindex` from the package; every child's computed margins are 0. Wider than the probe: the two sit side by side, the `nav` within 2 px of a probe styled `inline-size: var(--yeti-width-xs)` (Yeti's own tolerance, since `flex-grow: 1` against 999 leaves a fraction over the basis), and the gap equals a probe's `var(--yeti-space-lg)` within 1 px. Narrower: stacked, both at the container's full width.
- `sidebar--end`: `side="end"` with the content first in the source (Yeti's docs example). Asserts `data-side="end"`, the last child is the one at the sidebar's width and sits after the content in the inline direction, and the accessibility tree order equals the DOM order.
- `sidebar--inputs`: Storybook controls bind `side`, `width`, `gap`, and `align`. The play function sets each, asserts the matching `data-*` value, resets it to unset, and asserts the attribute is absent. With `align="start"` and a tall content child, asserts the sidebar child's height is its own, not the row's. With `align="center"` written statically, asserts `data-align="center"` and no `align` attribute (building-blocks 1.4).
- `sidebar--sticky`: section 8's markup in a page-height story with a long article. Scrolls the story's scroller past the start of the sidebar. Side by side: asserts `data-sticky=""` on the `nav`, the `nav`'s top stays at the probe's `var(--yeti-sticky-offset)` from the scrollport's top within 1 px, its height is less than the row's (`align-self: start`), and it overlaps no part of the article. Toggling `sticky` off removes `data-sticky` and the `nav` scrolls away with the page.
- `sidebar--holding-center`: a sidebar whose content child is `<div yetiCenter>`. Asserts the center's left and right margins are equal and non-zero at a wide container, so the sidebar's `margin: 0` on children did not win (section 13).
- `sidebar--rtl`: `sidebar--default` inside `dir="rtl"`. Asserts the first DOM child is the rightmost when side by side, and that Tab moves through the children's links in DOM order.

### Layer 2: browser-level (`npx nx test <lib>`, `sidebar.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiSidebar, { tagName: 'div' })`: the host has class `sidebar` and `data-ngx-yeti-item-sidebar`, and no `data-side`, `data-width`, `data-gap`, `data-align`, or `align`; with `bindings` setting each input, the attributes follow after `whenStable()`, and binding `undefined` removes them.
- While a `YetiSidebar` fixture lives, one `<link data-ngx-yeti-styles="sidebar">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- `createDirective(YetiSidebarChild, { tagName: 'nav' })`: no `data-sticky` by default; `sticky` bound `true` renders `data-sticky=""`, `false` removes it; the host carries no presence attribute and acquires no link; created alone, it injects no parent and throws nothing.
- No directive adds a listener to its host.

A small test host covers what `createDirective` cannot: a child declared inside a `yetiSidebar` host resolves `yetiSidebarToken` to the parent instance; template references `#s="yetiSidebar"` and `#c="yetiSidebarChild"` resolve; a static `sticky` attribute sets the input through `booleanAttribute`; a static `width="xs"` renders both `width="xs"` and `data-width="xs"` (the `inert` kind); a static `align="center"` leaves no `align` attribute; `yetiSidebar yetiBox gap="lg"` renders one `data-gap="lg"` and both presence attributes; `<nav yetiNav yetiSidebarChild sticky>` renders one `data-sticky=""`; and the consumer's own `class` on each host is kept.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `sidebar.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture of section 8's markup whose heading and paragraph carry `i18n`, with a static `align="center"` and a bound `side` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the parent renders `class="sidebar"`, `data-ngx-yeti-item-sidebar`, `data-side`, `data-width="xs"`, `data-align="center"`, and no `align`; the `nav` renders `data-sticky=""`; `<head>` holds one item link with `data-ngx-yeti-styles="sidebar"`, `data-beasties-skip`, and an `href` ending `layouts/sidebar/sidebar.css?v=<pin>`; no element carries a `jsaction` from the package.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `sidebar` has `YetiSidebar`; `data-side`, `data-width`, `data-gap`, and `data-align` have inputs whose unions equal the manifest's vocabularies `side`, `width`, `gap`, and `align`; the marker `data-sticky` has the boolean `sticky` input on `YetiSidebarChild`; the item has no events. A pin move that adds an attribute, a value, or a marker fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids, after Yeti's own `sidebar.spec.js`: `sidebar--default` and `sidebar--end` resize the container, not the viewport, across the switching width (building-blocks 1.7 and 1.12), and assert the arrangement on each side. At a 320 px viewport the page has no horizontal overflow and the children are stacked; at 200 % text zoom the switching width rises with the text (1.4.4, 1.4.10). On `sidebar--sticky`, stacked at a 320 x 640 viewport with usage rule 4 followed (`--yeti-scroll-padding` set on the root to the sticky child's height), Shift+Tab from the article's last link to each earlier one leaves each focused link at least partly visible below the stuck `nav` (2.4.11). The same walk with Yeti's default scroll padding is recorded, not asserted, as the evidence for ledger row A11Y-22 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 47).

Fixture-app half, built with `outputMode: 'server'`, with a `/sidebar` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route renders section 8's markup with a static `align="center"`:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`; after hydration the parent has no `align` attribute;
- a `MutationObserver` registered before the client bundle loads, and a `requestAnimationFrame` loop sampling the parent from the first frame, see no painted frame in which the parent carries `align` (ticket 50 decision 9);
- with JavaScript disabled, the children's positions equal those with JavaScript on at the same width, the `nav` sticks when the page scrolls, and `@axe-core/playwright` with the six tags reports no violation;
- a sidebar inside a client-only `@defer` block with `sidebar` in the preload list shows no unstyled frame; a sidebar with `box` on one element inside a `hydrate never` block keeps both item links after every live sidebar and box on the page is removed (ADR 0045's shared-host case);
- a page that first shows a standalone `center` and then inserts a sidebar holding a `center` keeps the inner center's auto inline margins, so the `sidebar` link went in before the `center` link (ADR 0060 point 3; section 13);
- navigating from the sidebar route to a route without one removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and `docs.md` examples for the stories, and its `test/browser/layouts/sidebar.spec.js` with the fixture `test/browser/fixtures/layouts/sidebar.html` for the geometry cases (side by side at the token width, stacked at 400 px, `data-side="end"`, no child margins, axe); ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; ticket 23's measurement of the `stack` and `center` tie for the order case; the [columns](columns.md) spec's probe technique for token-independent widths.

## Out of Scope

- An input per token, an offset input for the sticky child, or a width given as a length rather than Yeti's `width` vocabulary (ADR 0004; ADR 0070 rule 2).
- A viewport breakpoint input of any kind, or a script that decides when the pair stacks (building-blocks 1.7).
- A shared any-element `[yetiSticky]` directive for `sidebar`, `stack`, and `shell` (ADR 0070, Considered options; ticket 26 grilling question 6).
- A directive for a child that does not stick (ticket 26 grilling question 6).
- Any check that the host has exactly two children, that a `yetiSidebarChild` sits under a `yetiSidebar` host, that no child is reordered, or that a sticky child fits the viewport. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- Package CSS for the layout; the stacked sticky case takes usage rule 4 instead ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 47; building-blocks 1.13; ADR 0060 point 8).
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).
- The `media` recipe, "the one-class form of a sidebar holding a frame", with its own spec (Part 2; `Y/src/recipes/media/media.css:1`).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiSidebar]` with `side`, `width`, `gap`, `align`; part directive `[yetiSidebarChild]` with `sticky` | building-blocks Part 2 row 15; ticket 26 rows 56 to 60; [Decide: the spec list](../issues/11-decide-spec-list.md) |
| `data-sticky` is kind C (a modifier: "Pins") on a per-item part directive | ADR 0070; ticket 26 grilling questions 6 and 7 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by Yeti's `YetiSide`, `YetiWidth`, `YetiGap`, `YetiAlign`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2; ADR 0080 point 5 |
| `align` is `removed`; `width` is `inert` | building-blocks 1.4; ticket 26 rows 57 and 59, grilling question 15 |
| A static `align` is accepted; layer 4 asserts no frame paints with it | ticket 50 decision 9 |
| Shared input names across directives on one element (`gap`, `align`, `width`, `side`, `sticky`) | building-blocks 1.4, shared vocabularies; ticket 26 grilling question 16 |
| The part injects `yetiSidebarToken` optionally with `skipSelf` | ADR 0070 kind C; building-blocks 1.9 |
| Only `YetiSidebar` marks its host with `data-ngx-yeti-item-sidebar` and acquires the item file | ADR 0045; ticket 50 decision 6 |
| `injectYetiItemStyles('sidebar')` last in the constructor | [setup](setup.md); ticket 50 decisions 42 and 45 |
| `exportAs` on both; class names with no collision | building-blocks 1.3; ADR 0080 points 3 and 4 |
| Entry point `ngx-yeti/sidebar` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 15 |
| Tokens are the consumer's, `--yeti-sticky-offset` and `--yeti-scroll-padding` included | ADR 0004 |
| Item file as a counted link in Yeti's order | ADR 0060 points 2 to 6 |
| A stuck child over stacked content: usage rule 4, ledger row A11Y-22 (verified inferred), and a layer-4 measurement; no package CSS | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 47, after decisions 17 and 32 |
| No contrast assertion beyond the Story gate | ADR 0015 point 3 (only for what axe leaves incomplete); ticket 17 section 3 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A section nav that stays in view beside a long article, with the article first in the source:

```html
<div yetiSidebar side="end" width="xs" gap="lg">
  <article>
    <h1 i18n>Trail conditions</h1>
    <!-- long content -->
  </article>
  <nav yetiSidebarChild sticky aria-label="On this page" i18n-aria-label>
    <ul yetiStack gap="xs" role="list">
      <li><a routerLink="." fragment="north">North loop</a></li>
      <li><a routerLink="." fragment="south">South loop</a></li>
    </ul>
  </nav>
</div>
```

```ts
import { YetiSidebar, YetiSidebarChild } from 'ngx-yeti/sidebar';
import { YetiStack } from 'ngx-yeti/stack';

@Component({
  selector: 'app-trail-page',
  imports: [YetiSidebar, YetiSidebarChild, YetiStack, RouterLink],
  templateUrl: './trail-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrailPage {}
```

A media object built from layouts, after Yeti's media docs ("three layouts you already know"):

```html
<div yetiSidebar width="sm">
  <div yetiFrame ratio="1/1">
    <img ngSrc="ada.jpg" width="600" height="600" alt="Portrait of Ada Lovelace" i18n-alt />
  </div>
  <div yetiStack gap="sm">
    <h3>Ada Lovelace</h3>
    <p i18n>Wrote the first published algorithm, for Babbage's Analytical Engine.</p>
  </div>
</div>
```

The imports are `YetiSidebar`, `YetiFrame`, `YetiStack`, and `NgOptimizedImage` (building-blocks 1.2, images rule).

A page with its own sticky header of 4rem, so things that stick stop below it and a focused control or a fragment jump stops below both, in the consumer's stylesheet after Yeti (`Y/src/tokens/tokens.json:125-126`):

```css
.page-body {
  --yeti-sticky-offset: 5rem;
}
:root {
  --yeti-scroll-padding: 5rem;
}
```

The sticky child chosen from state: `<aside yetiSidebarChild [sticky]="pinSummary()">`. A value newer than the pin: `<div yetiSidebar [width]="$any('3xl')">`. A page whose sidebar renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['sidebar'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `layouts/sidebar/sidebar.css`, loaded by `YetiSidebar` as a counted link (section 13). The consumer writes nothing for the layout beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps `data-width`, `data-gap`, and `data-align` to the private tokens (`:6-37`, `:147-152`, `:171-177`) and holds the `[data-sticky]` rule in `yeti.utilities` (`:333-342`); `tokens/space.css` declares `--yeti-width-*`, `--yeti-space-*`, `--yeti-sticky-offset`, and `--yeti-scroll-padding`; `base/typography.css:8` reads the scroll padding on the root.
3. **Cross-item rules:** none in `sidebar.css`. The tie with `center` (`.sidebar > *` against `.center`) is settled by ADR 0060 point 3's order (section 13). Items composed on the sidebar's element or its children (`box`, `stack`, `frame`, `nav`, `center`) load their own files through their own directives.
4. **Tokens:** reads `--yeti-width-sm` and `--yeti-space-md` by default and the named `--yeti-width-*` and `--yeti-space-*` through the value rules; a sticky child reads `--yeti-sticky-offset`; writes none (section 2).
5. **What breaks without the item file:** the two children render as plain blocks, one under the other at every width, with their own margins. A sticky child is still `position: sticky` from the always-loaded rule, so a first child sticks above the second as in the stacked arrangement, and a last child has nothing below it to stick over, with no error. The `data-*` attributes still set their private tokens, which nothing reads.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled all 49 of Yeti's class names and its attribute names with Tailwind 4.3.3, and only `container`, `grid`, and `table` (plus the attribute name `hidden`) produced a utility (measured; `prototypes/yeti-tailwind/results/collisions.json`). `sidebar` and `data-sticky` produced none. Tailwind's own `sticky` class is a different name from Yeti's attribute (inferred, not measured).

### Platform features to adopt when the browser target moves

None for the layout: flexbox `gap`, the one feature the manifest lists as unguarded, and sticky positioning are inside Baseline 2025 (section 6), and Yeti guards nothing for the sidebar. CSS scroll-state container queries (`@container scroll-state(stuck: top)`) would let a stylesheet react to a child being stuck, and so are a candidate for the stacked sticky case of usage rule 4 once they are in the target. That is inferred; nothing was checked against web-features data for this spec.

### Single-page-application pieces relied on

None: the layout uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
