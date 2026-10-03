# Spec: shell (recipe)

Ticket: [70. Spec: shell (recipe)](../issues/70-spec-shell.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 20 and Part 1 (1.2, 1.3, 1.4, 1.9, 1.11, 1.13, 1.15), [Decide: the spec list](../issues/11-decide-spec-list.md) row 20, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 84 to 86 and grilling questions 6, 7, 12, 14, 15, and 16, [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) (decisions 2, 6, 17, 18, 32, and 42), [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0041](../adr/0041-closing-on-navigation-is-a-per-instance-subscription.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). The recipe owns no [ledger.md](../ledger.md) row (Part 2 row 20); its sticky regions share row A11Y-22, owned by the [sidebar](sidebar.md) spec ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 48). `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x). The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 48 and 83 to 86), and each is cited where it applies.

## Problem Statement

Yeti's `shell` is the page frame: "a header, a footer that should sit at the bottom of the screen even when the page is short, and a middle that may have navigation down one side or related material down the other" (`Y/src/recipes/shell/docs.md:3`). It is a **Recipe**, one class for a composition Yeti also shows built from two layouts: a [stack](stack.md) with `data-fill` and a split footer, holding a [sidebar](sidebar.md) (`docs.md:9-23`). The one-class form adds a third region: an `aside` after `main` in the same body row. The **Identity class** `shell` goes on the page's outermost element; its direct children are an optional `header`, the body (a `div` holding `nav`, `main`, and `aside` in that source order, or a bare `main`), and an optional `footer`. Two attributes configure it, `data-gap` and `data-width`, and one **Marker**, `data-sticky`, pins the body row's `nav` or `aside` at `--yeti-sticky-offset` from the top of the scrollport while `main` scrolls past (`Y/src/recipes/shell/manifest.json`, `shell.css`). It has no **Module** and no events. Its accessibility note says that "the landmarks do the work: one main; a label on nav when the page has more than one; aside for content that is complementary, not primary" (manifest `a11y.notes`).

An application developer using the package cannot write `class="shell"` or its `data-*` attributes: a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). A hand-written `data-width="small"` compiles and silently falls back to Yeti's default; here it must fail to compile ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `shell` **Item file** loaded while a shell is on the page ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it the regions render as plain blocks, the footer stops at the end of a short page, and `nav`, `main`, and `aside` never share a row, with no error.

Three things are particular to the shell in an Angular application. First, Yeti puts the class on `body`, which no Angular template can reach, so the package must say where the class goes ([Decide: the spec list](../issues/11-decide-spec-list.md) row 20 left this to the spec). Second, the shell persists across routes. [Prototype: Yeti's modules in a single-page Angular app](../issues/20-prototype-yeti-in-single-page-apps.md) measured, in three engines, that a popover and a modal dialog in the persistent shell stay open over the new route after a `routerLink` inside them navigates, and that the dialog leaves the page inert. Third, the routed view renders inside the shell's `main`, so the landmark structure (one `main`, labelled `nav`s, a skip link) has to survive every route (WCAG 1.3.1, 2.4.1).

## Solution

Two directives in the secondary entry point `ngx-yeti/shell` ([building-blocks.md](../building-blocks.md) Part 2 row 20; 1.3):

- **`YetiShell`**, the **Item directive**, on `[yetiShell]`, `exportAs: 'yetiShell'`. It binds `shell` as a static host class and binds `data-gap` and `data-width` from the typed inputs `gap` (`YetiGap`) and `width` (`YetiWidth`) (ticket 26 rows 84 and 85). It sets the static presence attribute `data-ngx-yeti-item-shell` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), acquires the `shell` item file when it is created, on the server too, and releases it when it is destroyed (ADR 0060 point 2), through `injectYetiItemStyles('shell')` from `ngx-yeti/styles` as the last statement of its constructor ([setup](setup.md); ticket 50 decisions 42 and 45). It provides `yetiShellToken`.
- **`YetiShellRegion`**, a **Part directive** for a body-row `nav` or `aside` that sticks, on `[yetiShellRegion]`, `exportAs: 'yetiShellRegion'`. It binds `data-sticky` from a `sticky` input with `booleanAttribute` (ticket 26 row 86, kind C). A region that does not stick needs no directive (ticket 26 grilling question 6).

The developer puts `yetiShell` on the outermost element of the root component's template, because a template cannot reach `<body>` (ticket 11 row 20; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 83). Where Yeti's docs write `<body class="shell" data-width="xs">`, the developer writes `<div yetiShell width="xs">` as the first element of `app-root`'s template, with the `router-outlet` inside `main`. An unset input renders no attribute, so Yeti's own defaults (`md` gap, `sm` width) apply from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1).

Everything else is Yeti's CSS, the platform, and the package's other items. Both directives are **types only**: no listener, no render callback, no service, and no DI beyond the part's optional parent token and the item file's styles service (ticket 50 decision 18). The landmarks are the consumer's elements. Closing a shell panel on navigation is done by the `nav`, `dropdown`, and `dialog` directives that sit in the shell, through [navigation-close](navigation-close.md), so "the shell itself needs nothing" (Part 2 row 20; ADR 0041 point 5). The column, the footer at the bottom, the body row, and sticking are all CSS, so they are right on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block.

## User Stories

1. As an application developer, I want to turn my root template's outermost element into Yeti's page frame with one directive attribute, so that I never write Yeti's `shell` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="shell"` and `data-*` attributes, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want the shell to be at least as tall as the viewport, so that the footer sits at the bottom of a short page.
4. As an application developer, I want the body row to take the free height, so that the footer sits at the bottom with no spacer of my own.
5. As an application developer, I want `nav`, `main`, and `aside` in the body row to sit side by side while there is room and stack when there is not, so that the frame works from a phone to a wide screen with no breakpoint.
6. As an application developer, I want `main` never to fall below half the row's width, so that the content stays readable before the side regions stack.
7. As an application developer, I want a page with only `main` to skip the body-row `div`, so that a simple page needs no extra element.
8. As an application developer, I want to set the space between the rows and between the regions with a `gap` input typed by Yeti's `gap` vocabulary, so that `gap="medium"` fails to compile.
9. As an application developer, I want to set the preferred width of `nav` and `aside` with a `width` input typed by Yeti's `width` vocabulary, so that `width="small"` fails to compile.
10. As an application developer, I want a static attribute such as `width="xs"` to type-check, so that I need no property binding for a constant.
11. As an application developer, I want an input I leave unset to render no attribute, so that Yeti's own default applies and the server HTML stays Yeti's minimal markup.
12. As an application developer, I want a static `width="xs"` to do nothing beyond the input, so that the HTML `width` attribute has no effect on my element.
13. As an application developer, I want to pin the body row's `nav` or `aside` with `yetiShellRegion sticky`, so that the section navigation stays in view beside a long page.
14. As an application developer, I want a sticky region to keep its own height rather than the row's, so that it actually sticks.
15. As an application developer, I want to toggle `sticky` from state, so that a region sticks only when my UI asks it to.
16. As an application developer, I want a region that does not stick to need no directive, so that my markup stays Yeti's landmarks.
17. As an application developer, I want `yetiShellRegion sticky` beside `yetiNav sticky` on one `nav` to render one `data-sticky`, so that the two directives agree.
18. As an application developer, I want to set how far below the top a sticky region stops with `--yeti-sticky-offset`, so that it clears my own sticky header.
19. As an application developer, I want to bind every input from signals, so that the frame follows my state under zoneless change detection.
20. As an application developer, I want to put the `router-outlet` inside `main`, so that every routed view renders in the one main landmark and the body row keeps its layout.
21. As an application developer, I want a component whose selector names the region's element (`nav[appSiteNav]`) to be a region, so that my navigation component's host is the landmark.
22. As an application developer, I want the shell's `nav`, `dropdown`, and `dialog` panels to close when a `routerLink` inside them navigates, so that the new route is not covered by a stale panel or left inert.
23. As an application developer, I want focus to return to a panel's opener when navigation closes it, so that keyboard users are not left on a removed element.
24. As an application developer, I want the shell to need no directive of its own for closing on navigation, so that the behaviour lives with the items that open panels.
25. As an application developer, I want a skip link that works on every route, so that keyboard users can bypass the header and the navigation.
26. As an application developer, I want the composed form (`yetiStack fill` with a `yetiSidebar` and a split footer) to give the same geometry as the one-class form, so that I can choose either and switch later.
27. As an application developer, I want a `center` inside `main` to keep its centring, so that a centred content column works inside the frame.
28. As an application developer, I want the shell item file loaded with the shell and kept for the whole session, so that I do not import `shell.css` globally.
29. As an application developer, I want the item file in the server HTML, so that the first paint already has the footer at the bottom and the regions in their row.
30. As an application developer, I want the frame right with JavaScript off under SSR and prerendering, so that the page reads and its landmarks exist before any script runs.
31. As an application developer, I want hydration to change nothing on the shell or its regions, so that I get no `NG05xx` error and no reflow.
32. As an application developer, I want a region inside a `@defer (hydrate on ...)` block to stay laid out before and after the block hydrates, so that incremental hydration does not collapse the frame.
33. As an application developer using `withI18nSupport()`, I want translated header and footer text to hydrate without being re-rendered, so that localised pages keep the server's DOM.
34. As an application developer, I want template references (`#s="yetiShell"`, `#r="yetiShellRegion"`), so that both directives follow the package's `exportAs` rule.
35. As an application developer, I want to import both directives from `ngx-yeti/shell`, so that the root component imports only what it uses.
36. As an application developer, I want the input value types re-exported by name (`YetiGap`, `YetiWidth`), so that I can type my own signals that feed the inputs.
37. As an application developer, I want the usage rules stated (where the host goes, the children's order, the outlet inside `main`, one `main`, labelled `nav`s, the skip link, sticky regions, panels through the package's directives), so that I use the recipe as Yeti intends.
38. As a screen-reader user, I want the page to expose banner, navigation, main, complementary, and contentinfo landmarks, so that I can jump between the page's regions.
39. As a screen-reader user, I want exactly one main landmark on every route, so that "jump to main" lands in the content.
40. As a screen-reader user, I want each navigation landmark named when the page has more than one, so that I can tell the site navigation from the section navigation.
41. As a screen-reader user, I want the regions read in source order (nav, main, aside) whatever their arrangement, so that the order I hear matches the order I see.
42. As a keyboard user, I want the skip link to be the first stop on the page and to move focus into `main`, so that I bypass the repeated blocks.
43. As a keyboard user, I want focus to follow the visual order in both arrangements and in left-to-right and right-to-left pages, so that focus does not jump around.
44. As a keyboard user, I want a focused control in `main` never to be hidden entirely behind a sticky region, so that I can see where focus is.
45. As a keyboard user, I want a shell dialog to stop making the page inert once its link has navigated, so that I can reach the new route.
46. As a low-vision user, I want the regions to stack when I zoom in or the window narrows, so that I never scroll sideways to read the content.
47. As a low-vision user who overrides text spacing, I want every region to grow with its content, so that my spacing settings clip nothing.
48. As a package maintainer, I want the contract check to cover both attributes, the `sticky` marker, and every value of their vocabularies, so that a pin move that adds a value or attribute fails before release.
49. As a package maintainer, I want the SSR smoke to assert the server HTML of a shell, a sticky region, and the item link, so that the first paint is proven.
50. As a package maintainer, I want the fixture app's root template to be a shell on a prerendered and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested on the persistent frame.
51. As a package maintainer, I want an e2e case that opens a shell `nav` panel and a shell `dialog`, follows a `routerLink`, and asserts both closed with focus on the opener, so that ticket 20's failure stays fixed in the recipe's real setting.
52. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default fails no test for no reason.
53. As a package maintainer, I want the geometry tests to follow Yeti's own `shell.spec.js` cases, so that the package proves the same layout Yeti proves.
54. As a package maintainer, I want the class names `YetiShell` and `YetiShellRegion` checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/recipes/shell/manifest.json`, `shell.css`, `docs.md`, and `example.html`, in Yeti's own test `Y/test/browser/recipes/shell.spec.js` with its fixture, and in `Y/src/layouts/attributes.css`, `Y/src/tokens/space.css`, `Y/src/base/typography.css`, and `Y/schema/vocabulary.json`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `shell`, `recipe`, `Page Layouts` |
| `class` | `shell` |
| `attributes` | `data-gap`: enum, vocabulary `gap` (29 values), default `md`, "Space between the rows, and between nav, main, and aside." `data-width`: enum, vocabulary `width` (`2xs` to `2xl`), default `sm`, "The preferred width of nav and aside. Three regions share a row once the container is about four times this width plus the gaps; two regions need about half that." |
| `classes` | empty |
| `children` | `> *` (min 1): "In order: an optional header, the body (a div holding nav, main, and aside, in that source order, or a bare main when there are no side regions), and an optional footer."; `> header`, `> footer`, `> main`, `> div` (each min 0, max 1); the `div` is "The body row. Its nav and aside take data-width; its main takes the rest and never drops below half." |
| `markers` | `data-sticky`: boolean, `on: "> div > :is(nav, aside)"`: "Pins the nav or the aside at --yeti-sticky-offset from the top of the scrollport while main scrolls past it." |
| `tokens` | public: `--yeti-cover-height` ("The shell's minimum block size; the viewport by default."), `--yeti-space-md` ("The default gap."), `--yeti-width-sm` ("The default nav and aside width."); private: `--_yeti-gap`, `--_yeti-width` |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "Meant for body or the page's outermost element. The landmarks do the work: one main; a label on nav when the page has more than one; aside for content that is complementary, not primary." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: `flexbox gap`, `dvh units`, `:has()`; `guarded`: empty |
| `since` | `7.0.0` |

How it works, in `@layer yeti.layouts` (`shell.css:4-40`): `.shell` is a flex column with `min-block-size: var(--yeti-cover-height)` and a gap from a private token; `.shell:not([data-gap])` and `.shell:not([data-width])` supply the defaults only when the attribute is absent. `.shell > *` zeroes every child's margins. `.shell > :is(main, div:has(> :is(nav, main, aside)))` takes `flex-grow: 1`, which puts the footer at the bottom. The body row is `.shell > div:has(> :is(nav, main, aside))`: a wrapping flex row with `align-content: start`, so a plain `div` in a shell that holds none of the three is left alone. In it, `nav` and `aside` take `flex-basis: var(--_yeti-width)` and `flex-grow: 1`; `main` takes `flex-basis: 0`, `flex-grow: 999`, and `min-inline-size: 50%`. So three regions share a row once the container is about four times the width plus the gaps, and two need about half that (read; Yeti's `shell.spec.js` measures both, and its three-region case needs 1200 px with `xs` because `main`'s 50 % floor forces a wrap below about 1096 px). `> :is(nav, aside)[data-sticky]` in the body row sets `align-self: start`, so a sticky region keeps its own height. Neither file uses `@container`.

The value rules for `data-gap` and `data-width` are in the **Always-loaded group**'s `layouts/attributes.css` (`:6-37` for gap, `:171-177` for width). The marker's own rule is also always loaded: `[data-sticky]` in `@layer yeti.utilities` sets `position: sticky`, `inset-block-start: var(--yeti-sticky-offset)`, and `z-index: 2` (`attributes.css:333-342`); its comment says the start alignment that a stretched row needs "lives in sidebar.css and shell.css". `--yeti-cover-height` defaults to `100dvh` (`Y/src/tokens/space.css:54`), `--yeti-sticky-offset` to `var(--yeti-space-md)` (`:61`), and `--yeti-scroll-padding` to `var(--yeti-sticky-offset)` (`:69`), which the root reads as `scroll-padding-block-start` (`Y/src/base/typography.css:8`); all quoted at the pin as [ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md) allows.

Two base rules outside the item matter to a page frame. The reset zeroes every element's margin but a `dialog`'s (`Y/src/base/reset.css:12-14`), so a shell on an inner element has no body margin to fight. The **Skip link** rule styles `body > a[href^="#"]:first-child` (`Y/src/base/typography.css:62-99`): visually hidden until focused, then fixed at the top start corner at `z-index: 3`, above every sticky bar. Yeti's starter puts the skip link first in a `body.shell` (`Y/src/starter/index.html:27-28`).

Attributes left to the consumer: none (ticket 26 rows 84 to 86). The landmark elements and their ARIA are the consumer's: Yeti's example puts `aria-label="Section"` on the body row's `nav`.

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `shell` | static host class on `[yetiShell]` (`YetiShell`) | always | ADR 0003 point 1; Part 2 row 20 |
| Attribute `data-gap` | space between the rows and the regions | input `gap` on `yetiShell`: `YetiGap \| undefined`, bound `[attr.data-gap]`, `null` when unset | unset renders nothing; Yeti's `md` applies. `gap` is not an HTML attribute | ticket 26 row 84 (R) |
| Attribute `data-width` | the preferred width of `nav` and `aside` | input `width`: `YetiWidth \| undefined`, `[attr.data-width]` | unset renders nothing; Yeti's `sm` applies. Static form: `inert` (below) | ticket 26 row 85 (R); building-blocks 1.4 |
| Marker `data-sticky` (on `> div > :is(nav, aside)`) | pins the region below the top of the scrollport | input `sticky` on `[yetiShellRegion]` (`YetiShellRegion`): `boolean` with `booleanAttribute`, bound `[attr.data-sticky]` as `''` when true and `null` when false | default `false`, renders nothing. `sticky` is not an HTML attribute | ticket 26 row 86 (C) |
| Children `header`, `div`, `main`, `footer`, and the body row's `nav`, `main`, `aside` | the regions | no directive; the consumer's landmark elements | not applicable | manifest `children`; ticket 26 grilling question 6 |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Token `--yeti-cover-height` | the shell's least block size | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--yeti-space-md`, `--yeti-width-sm`, and the `--yeti-space-*` and `--yeti-width-*` each value names | defaults and set values | the consumer's | not applicable | ADR 0004 |
| Tokens `--yeti-sticky-offset`, `--yeti-scroll-padding` | where a sticky region stops; where a scroll into view stops | the consumer's | not applicable | ADR 0004; building-blocks 1.13 |
| Tokens `--_yeti-gap`, `--_yeti-width` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-shell=""` on `[yetiShell]` only | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2; ticket 50 decision 6 |
| Injection token | not Yeti's | `yetiShellToken`, provided by `YetiShell` | not applicable | ADR 0070 kind C; building-blocks 1.9 |

The `inert` kind for `width` (building-blocks 1.4; ticket 26 row 85 and grilling question 15): HTML's `width` is a presentational hint on `img`, `table`, `iframe`, `video`, `canvas`, and a few obsolete forms, none of which can hold a page's regions, so it does nothing on the shell's hosts (`div`, and `body` in Yeti's own docs). A static `width="xs"` stays on the host beside `data-width="xs"`, and the directive binds nothing for it. The shell has no `align` input, so no input of its own is of the `removed` kind.

The part directive `YetiShellRegion` sets no presence attribute and acquires no item file: Yeti's start alignment for a sticky region applies only under a `.shell`, whose own presence attribute keeps the file loaded, and the marker's `position: sticky` is in the always-loaded group (ticket 50 decision 6).

The input value types are Yeti's own, from the package's generated `yeti-types.ts`, re-exported by name and never redeclared ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5; ADR 0060 point 10). Each is a full vocabulary, so no `Extract` is needed.

**Module replaced:** none. Yeti's `shell` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 20, "Yeti module: none"). The single-page behaviour the shell needs, closing its panels on navigation, is not a module's either: it is the package's, owned by [navigation-close](navigation-close.md) and used by the items that open panels (ADR 0040 consequences; ADR 0041 point 5).

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads `--yeti-cover-height`, `--yeti-space-md`, and `--yeti-width-sm` for its defaults, and through the always-loaded value rules whichever `--yeti-space-*` and `--yeti-width-*` a set attribute names. A sticky region reads `--yeti-sticky-offset`, and the root reads `--yeti-scroll-padding`. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block, in a **Theme** file after Yeti, or with a runtime `setProperty`. The space, width, sticky-offset, and cover-height tokens are derived tokens, so they also take effect on the shell and its descendants (`Y/src/guides/theming.md:38`); Yeti's starter sets `--yeti-sticky-offset: 0` on its page-top bar alone (`Y/src/starter/index.html:31`). `--yeti-scroll-padding` is root-level (`Y/src/tokens/tokens.json:126`), so it is set on `:root`, never on the shell. **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- `YetiShell` provides `yetiShellToken` (`InjectionToken<YetiShell>`, `useExisting`), building-blocks 1.9 and 1.3's token naming.
- `YetiShellRegion` injects it with `{ optional: true, skipSelf: true }` (ADR 0070 kind C). The region is a grandchild of the shell (`> div > nav`), and both sit in the root component's template, so the element injector chain reaches the shell. Nothing in this milestone reads the token: the marker works through Yeti's CSS alone, and the **In-item check** that would use it belongs to a later milestone (map, Milestones). A region outside a shell renders its marker and still sticks through the always-loaded rule, but without `align-self: start` a stretched flex item has nowhere to move (`attributes.css:318-332`), building-blocks 1.9's "degrades as its spec documents" case.
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"). A consumer composes by writing directives beside each other: `yetiShellRegion` with `yetiNav` or `yetiBox` on a `nav`, `yetiBox` on a `header`, `main`, `aside`, or `footer` as in Yeti's example, `yetiStack` or `yetiCenter` inside `main`.
- Shared input names (building-blocks 1.4, shared vocabularies; ticket 26 grilling question 16): `gap` is `YetiGap` on every reader, `width` is `YetiWidth` on `media`, `scroller`, `sidebar`, and `shell`, and `sticky` is `boolean` on `yetiNav`, `yetiStackChild`, `yetiSidebarChild`, and `yetiShellRegion`. So `<nav yetiNav yetiShellRegion sticky>` renders one `data-sticky=""` (Part 2 row 20: "written beside `yetiNav` where the region is a nav").
- The only other injection is the root styles service of ADR 0060, through `injectYetiItemStyles('shell')` ([setup](setup.md); ticket 50 decisions 42 and 45), with which `YetiShell` acquires and releases the item file. That service is the [setup](setup.md) spec's and ADR 0060's.
- Generated ids and the platform's relationship attributes: none. The recipe renders no `id` and references none, so it does not use [generated-ids](generated-ids.md). The skip link's target `id` on `main` is the consumer's.
- Closing on navigation: no injection. The `nav`, `dropdown`, and `dialog` directives in the shell each call `injectCloseOnNavigation` ([navigation-close](navigation-close.md); ADR 0041 points 1 and 5; Part 2 row 20).

### 4. API

| Member | `YetiShell` | `YetiShellRegion` |
| --- | --- | --- |
| Class name | not among the 46 names `yeti.d.ts` exports at the Pin (the orchestrator's check of 2026-10-03 under ADR 0080; ticket 50 decision 10), so it takes `Yeti`, not `NgxYeti` (ADR 0080 point 4) | as left |
| Selector | `[yetiShell]` (Part 2 row 20) | `[yetiShellRegion]` (Part 2 row 20; ticket 26 row 86; this spec fixes the provisional name, as [Decide: the glossary](../issues/10-decide-glossary.md) left part names to the specs) |
| `exportAs` | `yetiShell` | `yetiShellRegion` |
| Entry point | `ngx-yeti/shell` (building-blocks 1.3; ADR 0011 clause 10) | same |
| Inputs | `gap: YetiGap \| undefined` (Yeti default `md`); `width: YetiWidth \| undefined` (`sm`); each `input()` with no default value | `sticky: boolean`, `booleanAttribute`, default `false` |
| Host | static `class: 'shell'`; static `data-ngx-yeti-item-shell: ''`; `[attr.data-gap]` and `[attr.data-width]` from the inputs, `null` when unset | `[attr.data-sticky]`: `''` when `sticky()` is true, else `null` |
| Providers | `yetiShellToken` | none |
| Injection | the ADR 0060 styles service, through `injectYetiItemStyles('shell')` | `yetiShellToken`, `{ optional: true, skipSelf: true }` |
| Models, outputs, methods, listeners | none | none |
| Lifecycle | `injectYetiItemStyles('shell')` is the last statement of its constructor, after anything there that can throw (nothing does today), so the `shell` item file is acquired on the server too; the release runs through `DestroyRef` (ADR 0060 point 2; [setup](setup.md); ticket 50 decisions 18, 42, and 45) | none |

No input default differs from Yeti's (ADR 0070 rule 1). A static attribute type-checks as a string literal under `strictTemplates`, so `width="xs"` compiles and `width="xxs"` does not (ADR 0070 rule 2; ticket 26 grilling question 14, read, not run).

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiShell` on the outermost element of the root component's template, a `div`, once per application. A template cannot reach `<body>`, and the package writes no class to `body` itself, because a directive binds its class as a static host class (ADR 0003 point 1) and the hydration constraints forbid direct DOM manipulation (map, Standing rulings, item 54). With Yeti's reset, an inner host behaves like Yeti's `body.shell`: no body margin and `min-block-size` of the viewport (ticket 11 row 20; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 83).
2. Give the shell, in this order, an optional `header`, then the body, then an optional `footer`, at most one of each (manifest `children`). The body is a `div` holding `nav`, `main`, and `aside` in that source order, any of the side regions optional, or a bare `main` when there are none. Each region is an element, or a component whose selector names that element (`nav[appSiteNav]`), so that the host is the landmark and Yeti's `> nav` selectors match. A component host such as `<app-site-nav>` is neither a `nav` nor a region: it gets no region width and, if it is the body row's only child, the row is not a body row (read in `shell.css:14-35`, not measured). `@if`, `@for`, and `ng-container` add no element and need no care.
3. Put the `router-outlet` inside `main`, never as a direct child of the shell or of the body row. The outlet is an element: as a direct child it would be one more flex item with a gap of its own, and the routed component's host beside it would be a plain item rather than `main` (inferred from Yeti's child selectors and flex `gap`; layer 4 measures it; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 84). Routed views render no `main` of their own, so every route has exactly one main landmark (manifest `a11y.notes`; WCAG 1.3.1).
4. Label every `nav` with `aria-label` or `aria-labelledby` when the page has more than one, and use `aside` only for content that is complementary, not primary (manifest `a11y.notes`). Keep `header` and `footer` direct children of the shell, outside any `article`, `aside`, `main`, `nav`, or `section`, so that they map to the banner and contentinfo landmarks.
5. Write the **Skip link** as the first child of `body` in `index.html`, before the root component's host, pointing at an `id` on `main`, and add `provideYetiFragmentLinks()` ([fragment-links](fragment-links.md) usage rules; [setup](setup.md)). Yeti's skip-link rule matches only `body > a[href^="#"]:first-child` (`Y/src/base/typography.css:70`), which no element inside an Angular template can be ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 85). Under `<base href>`, before hydration and with JavaScript off, the link reloads the document to the base URL plus the fragment; that is the residue the fragment-links spec documents and ledger row A11Y-16 records.
6. Put `yetiShellRegion` only on a `nav` or `aside` that is a direct child of the body row, and only on one that sticks (manifest marker `on`). A region that does not stick needs no directive.
7. A sticky region must stay usable when it is stuck, as the [sidebar](sidebar.md) spec's usage rule 4 states ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 48; ledger [A11Y-22](../ledger.md)). Stick only a region no taller than the smallest viewport the page supports. Once the body row has stacked, a sticky `nav` comes first and sits above `main` while it scrolls under, so set `--yeti-scroll-padding` on `:root` to at least the region's height on pages where that happens, or stick only the `aside`, which comes last. The same holds for a page-top bar that sticks above the whole shell, as in Yeti's starter: set the scroll padding to the bar's height (`Y/src/tokens/tokens.json:125-126`).
8. Open every top-layer panel in the shell through the package's directives (`yetiNav`'s panel, `yetiDropdown`, `yetiDialog`), never through a bare `popover` or `dialog` the consumer controls alone. Those directives close their panel on `NavigationStart` with focus back on the opener; a bare one stays open over the new route, and a bare modal dialog keeps the page inert (ticket 20, measured; [navigation-close](navigation-close.md); ADR 0041). Keep shell panels in hydrated regions, not in a `hydrate never` block or a `@defer (hydrate on ...)` block that has not hydrated, because a panel with no live directive is not closed ([navigation-close](navigation-close.md), Rendering modes).
9. Put a [center](center.md) inside `main` or inside another region, never as a direct child of the shell or of the body row. In Yeti's order `shell.css` comes after `center.css`, so `.shell > * { margin: 0; }` wins over `.center`'s `margin-inline: auto` at equal specificity and a direct-child center is not centred (ticket 23 measured 0 margins; `Y/src/yeti.css:30`, `:39`). The body row's `> *` rule has higher specificity than `.center` and wins in any order (read). The package reproduces Yeti's result and changes nothing (section 13).
10. Do not write `class="shell"`, `data-gap`, `data-width`, `data-sticky`, or `data-ngx-yeti-item-shell` statically on either host. The directives bind them, and hydration writes a static attribute back before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"; ADR 0070 consequences). A value newer than the pin goes through `$any` (`[width]="$any('3xl')"`, ADR 0070).
11. Bind every input from values that are the same on the server and the client, never from a browser-only read such as the window's width. The body row already follows its own width in CSS (building-blocks 1.7), and the hydration constraints require the same DOM on both sides.
12. Import `YetiShell`, and `YetiShellRegion` where the template writes it, in the root component. A **Forgotten import** of `YetiShellRegion` with a static `sticky` renders a region that does not stick, with no error; a **Forgotten import** of `YetiShell` renders unstyled regions. Only a bound input (`[sticky]`, `[width]`) makes the compiler report it (NG8002), or a template reference naming the `exportAs` (NG8003) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `shell` | Nearest in Angular Material: `MatToolbar` with `MatSidenavContainer` |
| --- | --- | --- |
| Shape | an item directive on the consumer's outermost element, the consumer's landmark elements as regions, and a part directive on a sticky region | a `<mat-toolbar>` component for the header (`NC/src/material/toolbar/toolbar.ts:32-33`) and `<mat-sidenav-container>` with `<mat-sidenav>` and `<mat-sidenav-content>` for the body (`NC/src/material/sidenav/sidenav.ts:27`, `:47`, `:108`) |
| Regions | `header`, `nav`, `main`, `aside`, `footer`, each the platform's landmark | elements the components render; the consumer adds landmark roles inside them |
| Side regions | `nav` before and `aside` after `main`, both at `width`; they stack below the threshold | up to two drawers, `position` `start` or `end`, overlaying or pushing the content and never stacking |
| Footer at the bottom | the column's least height is `--yeti-cover-height` and the body row grows | none; the consumer's CSS |
| Staying in view | `sticky` on a region, CSS `position: sticky` | `fixedInViewport` with `fixedTopGap` and `fixedBottomGap` on a sidenav |
| Navigation | panels in the shell close on `NavigationStart` through their own directives | the drawer does not close on navigation by itself; CDK's dialog has `closeOnNavigation`, which reacts only to `popstate` (ledger A11Y-15) |
| `exportAs` | `yetiShell`, `yetiShellRegion` | `matToolbar`, `matSidenav`, `matSidenavContainer` (`toolbar.ts:33`; `sidenav.ts:48`, `:109`) |

Nothing from Material's API applies: Material has no page-frame component, and its drawers are behavioural panels that open and close, while the shell's regions are always shown and place the consumer's own landmarks. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 20; building-blocks 1.2). The reason, row 1's, which row 20 takes ("as row 1"): Yeti's CSS does the whole job, and the directives add the class, the typed attributes and the marker, the item-file acquisition, and `exportAs`. Flexbox `gap`, `dvh` units, `:has()`, and sticky positioning are inside Baseline 2025 (building-blocks 1.2; [Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md), which names `:has()` as what the shell's row layout needs, `shell.css:20-39`). The landmarks are HTML elements, so no ARIA role is added. No Aria pattern applies (a layout has no role), and no CDK piece is used: there is no id, focus, keyboard, observer, direction read, or scroll measurement in script. Closing on navigation is custom Angular, level 4, but it belongs to [navigation-close](navigation-close.md) and the items that call it, not to the shell.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** the landmark regions pattern, met by the consumer's markup (ticket 17, section 3: in Yeti's example, the Chromium tree has `banner`, `navigation "Section"`, `main`, `complementary`, and `contentinfo`). The directives add no role, state, or property, and no tab stop.
- **Keyboard:** none of its own. Focus moves through the regions' content in DOM order. The skip link is the first stop (usage rule 5).
- **Names:** none of its own. Each `nav` is named by the consumer (usage rule 4).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The regions are HTML landmark elements and keep their semantics; the directives add no role. Usage rules 2 to 4 keep one `main` on every route, a named `nav` when there are several, and `header` and `footer` as banner and contentinfo. Layer 1 asserts the landmark tree; layer 4 asserts one main landmark on two routes. |
| 1.3.2 Meaningful Sequence | The body row places `nav`, `main`, and `aside` in source order and never reorders them, in both arrangements (manifest `children`). Layer 1 asserts that the accessibility tree order equals the DOM order. |
| 1.4.4 Resize Text | Widths and gaps are `rem`-based tokens, so text zoom raises the switching width with the text (read, not measured). Layer 4 repeats the stacking case at 200 % text zoom. |
| 1.4.10 Reflow | Below the threshold the regions stack at full width. Ticket 17 measured no page-level horizontal scroll on the shell example at 320 x 640 in Chromium (section 2.4: 46 of 49 pages clean, and the three that were not do not include `shell`). Layer 4 asserts it at a 320 px viewport. A sticky region taller than the viewport is usage rule 7's and row A11Y-22's ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 48). |
| 1.4.3 Contrast (Minimum), 1.4.11 Non-text Contrast | The recipe draws nothing; its regions' colours are theirs. axe reported no violation on the shell example in three engines, light and dark (ticket 17, section 3), so the **Story gate** covers it and no play-function assertion is added. |
| 1.4.12 Text Spacing | The rules set no height cap and no overflow; every region grows with its content (read). |
| 2.4.1 Bypass Blocks | The `main` landmark and the skip link of usage rule 5. The skip link works without a reload once the application is live through `provideYetiFragmentLinks()` (ledger A11Y-16, owned by [fragment-links](fragment-links.md)). Layer 4 asserts Tab, Enter, and the next Tab inside `main` on a non-root route under `<base href>`. |
| 2.4.3 Focus Order | Visual order equals DOM order in both arrangements and in right-to-left pages (layer 1, `shell--rtl`). A shell panel closed by navigation returns focus to its opener rather than leaving it in a closed panel (ledger A11Y-15, owned by [navigation-close](navigation-close.md)). |
| 2.4.11 Focus Not Obscured (Minimum) | Side by side, a sticky region sits beside `main` and covers none of it. Stacked, a sticky `nav` paints above `main` while it scrolls under (`z-index: 2`), and a control that focus scrolls into view stops at `--yeti-scroll-padding`, which by default clears only the offset. Usage rule 7 states how the consumer avoids it, and layer 4 asserts the backward-Tab case with the rule followed and records it with Yeti's defaults (row A11Y-22; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 48). |

**Ledger rows owned:** none ([ledger.md](../ledger.md); Part 2 row 20, "Ledger: none"). Ticket 17 classed the shell with the items that conform as far as measured (section 3), on an example with no sticky region. Two rows owned by other specs cover what the package adds in the shell's setting: A11Y-15 (navigation-close: shell panels close on navigation with focus back on the opener) and A11Y-16 (fragment-links: the skip link stays a same-document link under `<base href>`). The stacked sticky case shares [A11Y-22](../ledger.md), "a stuck sticky child can obscure focus", owned by the [sidebar](sidebar.md) spec and shared with `stack`, `shell`, `nav`, and `table` (ticket 50 decisions 170 and 195) (WCAG 2.2 2.4.11 and 1.4.10), verified *inferred* and tested by layer 4, with no package CSS ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 17, 32, 47, and 48).

### 8. Rendered HTML

Consumer markup in the root component's template, after Yeti's example, with the outlet inside `main`:

```html
<div yetiShell width="xs">
  <header yetiBox yetiBorder surface="raised">Site header</header>
  <div>
    <nav yetiBox yetiBorder surface="raised" yetiShellRegion sticky aria-label="Section">
      <a routerLink="/guide">Guide</a>
    </nav>
    <main yetiBox yetiBorder surface="raised" id="main">
      <router-outlet />
    </main>
    <aside yetiBox yetiBorder surface="raised">Related links</aside>
  </div>
  <footer yetiBox yetiBorder surface="raised">Site footer</footer>
</div>
```

and, in `index.html`, `<body><a href="#main">Skip to content</a><app-root></app-root></body>`.

Server HTML and the hydrated DOM are the same. The shell host carries `yetishell=""`, `width="xs"` (inert), `class="shell"`, `data-width="xs"`, and `data-ngx-yeti-item-shell=""`, and no `data-gap`. The `nav` carries `yetishellregion=""`, `sticky=""`, and `data-sticky=""` beside the box's own class, attributes, and presence attribute, and no presence attribute of the shell (section 2). The body-row `div`, `header`, `main`, `aside`, and `footer` carry only their box attributes and the consumer's own. The `router-outlet` element and the routed component's host follow inside `main`.

The server also writes the item links into `<head>` in Yeti's order: `box` first, then `shell` (`Y/src/yeti.css:29`, `:39`), each with `rel="stylesheet"`; for the shell, `href` `<url>recipes/shell/shell.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="shell"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts the links at bootstrap. The recipe has no closed or open state.

The delta from Yeti's docs markup: the class moves from `body` to the root template's outermost `div`; the skip link stays first in `body`, in `index.html`; the consumer writes `yetiShell` and input names where the docs write `class="shell"` and `data-*` names, and `yetiShellRegion sticky` where they write `data-sticky`; `main` holds the `router-outlet`.

### 9. Animation

None. The recipe has no state and no transition, and Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). Changing a bound input moves the regions at once, and sticking is scroll-linked positioning, not an animation. A route's view entering `main` may carry the consumer's class-form `animate.enter` or Yeti's `enter` utility ([enter](enter.md)); the shell is outside the outlet and does not move. The shell is server-rendered in a server-rendered application and never takes `animate.enter` there (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes and marker, the consumer's landmarks, the skip link from `index.html`, and the item link in `<head>` (section 8). Everything at first paint is a host binding or the consumer's markup (ADR 0011 clause 1). Nothing is **Pre-hydration state**: no person and no Yeti module can change a `data-*` attribute (ticket 26 grilling question 12). Scrolling before hydration moves a sticky region by CSS alone.
- **Before hydration:** neither directive creates a node, reads layout, starts a timer or observer, or touches `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is `YetiShell`'s item acquisition, which ADR 0060 runs on the server too. Shell panels opened before hydration through the platform's attributes stay open at hydration; the navigation-close spec covers them (its user stories 12 and 13).
- **Full hydration:** both hosts are claimed as they are; bindings computed from the same inputs give the same values (usage rule 11); 0 style mutations (ADR 0060 point 5, measured for the mechanism).
- **Incremental hydration (`@defer (hydrate on ...)`):** the shell is in the root template and hydrates with the application. A region whose content sits in a hydrate block keeps its layout before and after the block hydrates, because the region element and its attributes are server HTML. A panel inside a block that has not hydrated is not closed on navigation (usage rule 8).
- **`hydrate never`:** a shell region's content in such a block is its server HTML and stays styled while the shell host is connected (ADR 0060 point 4; ADR 0045). A panel there has no directive to close it on navigation (usage rule 8; [navigation-close](navigation-close.md) records the residue).
- **Client-only `@defer`:** not expected for the shell itself, which is in the root template. A client-only application (no SSR) fetches the item file when `YetiShell` is constructed, which can show unstyled frames; `provideYetiStyles({ preload: ['shell'] })` closes the gap (ADR 0060 point 6; [setup](setup.md)).
- **Event replay:** neither directive declares a listener, so nothing replays and no `jsaction` is added by them. A `routerLink` clicked in the shell before hydration is replayed by Angular, and the navigation-close spec describes what then closes.
- **`withI18nSupport()`:** header, navigation, and footer text is usually translated with `i18n` in the root component. The directives add no `i18n` block; the root component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** inputs are `input()` signals read by host bindings, so a changed input refreshes its attribute with no zone (map, Standing rulings, item 43; ADR 0070 rule 4).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the frame is readable, the footer is at the bottom, the regions sit in their row or stack, and a sticky region sticks, because the class, the attributes, the marker, and the item link are in the server HTML. Every link is a full page load, so no panel outlives a navigation. The skip link reloads to the base URL plus its fragment under `<base href>` (usage rule 5), which is fragment-links' documented residue. A client-only application gets no such promise.
- **Hydration boundary:** the shell and its regions are in the root component; a routed view inside `main` hydrates on its own. The recipe has no ids or references across boundaries.

### 11. Hydration constraints

The recipe complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; `data-gap`, `data-width`, and `data-sticky` come from inputs whose values usage rule 11 keeps equal on both sides.
- **No direct DOM manipulation:** the directives write nothing to the DOM outside host bindings, and nothing to `body` (usage rule 1). The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directives change no element. The landmarks are valid where usage rules 2 and 4 put them; a `main` inside another `main` from a routed view is what usage rule 3 forbids.
- **`preserveWhitespaces`:** the directives have no template. White-space-only text in a flex container is not a flex item, and `:has(> ...)` and `> *` match elements only, so whitespace changes no part of the layout.
- **No output branched on the platform:** none.
- **Static attributes the directives bind:** usage rule 10 keeps the consumer from writing them. The static `width` is `inert` and never bound, so hydration writes back the same value the server rendered.

### 12. Single-page application

The shell is the persistent frame of a routed application, and this is where building-blocks 1.15's measured failures happen.

- **Closing on navigation:** a popover or a modal dialog in the shell stays open over the new route after a `routerLink` inside it, and the dialog leaves the page inert (ticket 20, measured in three engines under `<base href="/sub/">`). The shell adds nothing: its `nav` panel, `dropdown`, and `dialog` close on `NavigationStart` with focus back on the opener through their own directives' `injectCloseOnNavigation` call ([navigation-close](navigation-close.md); ADR 0041 point 5; Part 2 row 20; ledger A11Y-15). Usage rule 8 keeps every shell panel on those directives. Their specs are tickets [81](../issues/81-spec-dialog.md), [82](../issues/82-spec-dropdown.md), and [84](../issues/84-spec-nav.md).
- **Fragment links:** the skip link is a bare `#main` link, handled by `provideYetiFragmentLinks()` once the application is live ([fragment-links](fragment-links.md); ledger A11Y-16). A fragment jump stops at `--yeti-scroll-padding` from the top (usage rule 7).
- **Route changes:** the shell host is never destroyed, so the `shell` item link stays for the session, and a sticky region stays stuck with nothing to reset. A route's own items leave with the route (ADR 0060 point 4).
- **Focus after a route change:** moving focus into `main` or announcing the new page on navigation is not the package's. The [architecture guide](../architecture-guide.md)'s single-page rule lists what the package owns in a single-page application (setup for Angular-rendered DOM, closing top-layer panels on navigation, fragment links) and says "It owns nothing else"; building-blocks 1.15 has the same list.

### 13. Item file

`yeti-css/css/recipes/shell/shell.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when `[yetiShell]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:39`, after `hero` and before `button`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-shell` has left the DOM, which in a routed application is never. `YetiShellRegion` acquires nothing (section 2). The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the `[data-gap]` and `[data-width]` value rules, the `[data-sticky]` rule, the skip-link rule, and the tokens), and optionally `provideYetiStyles({ preload: ['shell'] })`. The recipe adds nothing to it. Cross-item files acquired: none (`shell.css` has no cross-item rule; ADR 0060 point 9).

One order matters inside `yeti.layouts`: `.shell > *` sets `margin: 0`, and `.center` sets `margin-inline: auto`, at equal specificity, and `shell.css` comes after `center.css` in `yeti.css` (`:30`, `:39`). So in full Yeti a `center` that is a direct child of a shell has 0 inline margins; reversed, it got 102 px ([Research: Yeti's cascade layers and stylesheet order](../research/yeti-layers-and-import-order.md), section 4.4, measured). ADR 0060 point 3 inserts links in Yeti's order whichever directive is created first, so the package gives the same result as full Yeti, and usage rule 9 keeps a center inside `main`. The setup spec lists this pair among the order-sensitive ones ([setup](setup.md), "The loader's behaviour", item 5), and its wording, like the [center](center.md) spec's section 13 and user story 11, now says that Yeti's order keeps a center centred inside a `stack` but gives a center placed directly in a `shell` 0 margins ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 86). Layer 4 tests that both arrival orders end in Yeti's result.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class, attributes, and marker in the DOM, the item link, the landmark tree, where the regions land, where a sticky region stops, and what happens to a shell panel on navigation. It never asserts a private field, the parent token's value, or how the styles service counts. No test depends on a public token's default value or on a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3). A layout test sets `width` and `gap` explicitly and sizes the container against a probe element in the same story: for two regions, `inline-size: calc(2 * (var(--yeti-width-<w>) + var(--yeti-space-<g>)))`; for three, `calc(4 * (var(--yeti-width-<w>) + var(--yeti-space-<g>)))`, after Yeti's own threshold arithmetic in `shell.spec.js`. The container is the probe's width plus `2rem` for the side-by-side case and minus `2rem` for the stacked case. The least height compares with a probe styled `block-size: var(--yeti-cover-height)`, and a sticky test with a probe styled `block-size: var(--yeti-sticky-offset)`, as Yeti's `token()` helper does. "Side by side" means equal `offsetTop`; "stacked" means each later region's top is at or below the earlier one's bottom. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `shell` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Each story renders one shell, so the landmark rules apply as on a page. Story ids:

- `shell--default`: section 8's markup with static content in `main` and without `sticky` (Yeti's example), in a story whose shell host is the story root. Asserts the host's `class` is `shell`, `data-width="xs"`, `data-ngx-yeti-item-shell`, and no `data-gap`; no region has a role or `tabindex` from the package; every shell child and body-row child has computed margins of 0 (Yeti's `expectNoChildMargins`). The accessibility tree has, in order, banner, navigation "Section", main, complementary, and contentinfo, and exactly one main. The shell's height is at least the cover-height probe's, and the footer's bottom equals the shell's bottom within 1 px.
- `shell--composed`: the one-class form beside the composed form from Yeti's docs, built with `yetiStack fill`, a `yetiSidebar` body, and a `yetiStackChild split` footer ([stack](stack.md), [sidebar](sidebar.md)), each in its own iframe-height container. Asserts, side by side and stacked, that header, nav, main, and footer have the same geometry in both forms within Yeti's `same` tolerance (Yeti's first two `shell.spec.js` cases).
- `shell--three-regions`: `nav`, `main`, and `aside`. Wider than the four-times probe: all three share a row, nav first and aside last, each side region within 2 px of a width probe (Yeti's tolerance, since `flex-grow: 1` against 999 leaves a fraction over the basis). Narrower than the two-times probe: each region below the previous one, and the accessibility tree order equals the DOM order.
- `shell--main-only`: header, a bare `main`, and footer. Asserts the footer sits at the bottom on a short page and `main` takes the free height.
- `shell--plain-div`: a shell whose middle child is a `div` holding neither `nav`, `main`, nor `aside`. Asserts its children stack as plain blocks, so the body-row rule left it alone (Yeti's fourth case). Its contents sit in a `main` of the story's own, outside the shell, so the landmark rules hold.
- `shell--inputs`: Storybook controls bind `gap` and `width`. The play function sets each, asserts the matching `data-*` value, resets it to unset, and asserts the attribute is absent.
- `shell--sticky`: section 8's markup with a long `main` in a page-height story. Scrolls past the start of the body row. Side by side: asserts `data-sticky=""` on the `nav`, its top stays at the sticky-offset probe from the scrollport's top within 1 px, its height is less than the row's, and it overlaps no part of `main`. Toggling `sticky` off removes `data-sticky` and the `nav` scrolls away.
- `shell--rtl`: `shell--three-regions` inside `dir="rtl"`. Asserts the `nav` is the rightmost region when side by side, and that Tab moves through the regions' links in DOM order.
- `shell--routed`: the root-template form with a `yetiNav` panel and a `yetiDialog` in the header, each holding a `routerLink`, under `provideRouter` with `provideLocationMocks()` (as the navigation-close stories do). Play: open the nav panel, click its link, assert the panel is closed, focus is on its opener, and the outlet in `main` shows the new route; repeat for the dialog and assert it is closed and the page is not inert. After both routes, the tree still has exactly one main landmark.

### Layer 2: browser-level (`npx nx test <lib>`, `shell.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiShell, { tagName: 'div' })`: the host has class `shell` and `data-ngx-yeti-item-shell`, and no `data-gap` or `data-width`; with `bindings` setting each input, the attributes follow after `whenStable()`, and binding `undefined` removes them.
- While a `YetiShell` fixture lives, one `<link data-ngx-yeti-styles="shell">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone.
- `createDirective(YetiShellRegion, { tagName: 'nav' })`: no `data-sticky` by default; `sticky` bound `true` renders `data-sticky=""`, `false` removes it; the host carries no presence attribute and acquires no link; created alone, it injects no parent and throws nothing.
- No directive adds a listener to its host.

A small test host covers what `createDirective` cannot: a region declared in a body-row `div` inside a `yetiShell` host resolves `yetiShellToken` to the shell instance; template references `#s="yetiShell"` and `#r="yetiShellRegion"` resolve; a static `sticky` attribute sets the input through `booleanAttribute`; a static `width="xs"` renders both `width="xs"` and `data-width="xs"` (the `inert` kind); `<nav yetiNav yetiShellRegion sticky>` renders one `data-sticky=""`; and the consumer's own `class` on each host is kept.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `shell.ssr.spec.ts`)

Through the shared `renderServer()` helper with `provideRouter`, `withI18nSupport()`, and a root component holding section 8's markup whose header and footer text carry `i18n`, with a bound `gap` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the host renders `class="shell"`, `data-ngx-yeti-item-shell`, `data-width="xs"`, and `data-gap`; the `nav` renders `data-sticky=""`; `main` holds the routed view; `<head>` holds one item link with `data-ngx-yeti-styles="shell"`, `data-beasties-skip`, and an `href` ending `recipes/shell/shell.css?v=<pin>`; no element carries a `jsaction` from the package; nothing is written to `body`'s attributes.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `shell` has `YetiShell`; `data-gap` and `data-width` have inputs whose unions equal the manifest's vocabularies `gap` and `width`; the marker `data-sticky` has the boolean `sticky` input on `YetiShellRegion`; the item has no events. A pin move that adds an attribute, a value, or a marker fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids, after Yeti's own `shell.spec.js`: `shell--default`, `shell--composed`, and `shell--three-regions` resize the container, not the viewport, across both thresholds (building-blocks 1.7 and 1.12), and assert the arrangement on each side. At a 320 px viewport the page has no horizontal overflow and the regions are stacked; at 200 % text zoom the switching width rises with the text (1.4.4, 1.4.10). On `shell--sticky`, stacked at a 320 x 640 viewport with usage rule 7 followed (`--yeti-scroll-padding` on the root set to the sticky region's height), Shift+Tab from `main`'s last link to each earlier one leaves each focused link at least partly visible below the stuck `nav` (2.4.11). The same walk with Yeti's default scroll padding is recorded, not asserted, as evidence for row A11Y-22 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 48).

Fixture-app half, built with `outputMode: 'server'`, whose root component is section 8's shell, with `/shell` and `/shell/other` routes marked `RenderMode.Prerender` and `RenderMode.Server`, each run with JavaScript on and off, under `<base href="/sub/">` ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences):

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`; `body` carries no attribute the package wrote;
- on both routes the page has exactly one main landmark, and banner, navigation, complementary, and contentinfo landmarks; `@axe-core/playwright` with the six tags reports no violation, with JavaScript on and off;
- with JavaScript on, after hydration, Tab reaches the skip link first, Enter moves to `#main` with no reload on the non-root route, and the next Tab lands inside `main` (2.4.1; ledger A11Y-16); with JavaScript off the reload to `/sub/#main` is recorded as fragment-links' residue;
- open the shell's `nav` panel below its threshold and click a `routerLink` in it: the panel is closed and focus is on the toggle; open the shell `dialog` and click its `routerLink`: the dialog is closed, a hit test on the new route's heading lands on the heading (the page is not inert), and focus is on the opener (ticket 20's cases; ledger A11Y-15);
- with JavaScript disabled, the regions' positions equal those with JavaScript on at the same width, the footer is at the bottom of a short route, and the sticky `nav` sticks when the page scrolls;
- a variant fixture with the `router-outlet` as a direct child of the body row, beside `nav`, is measured and recorded (the extra gap and the routed host's width), as the evidence for usage rule 3 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 84);
- a page that renders a `center` directly in the shell and a `center` inside `main`, in both arrival orders of the `shell` and `center` links, ends with the direct-child center's inline margins at 0 and the inner center's equal and non-zero, as in full Yeti (section 13).

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html`, `docs.md`, and starter page for the stories; its `test/browser/recipes/shell.spec.js` with the fixture `test/browser/fixtures/recipes/shell.html` for the geometry cases (the composed form side by side and stacked, three regions at 1200 px with `xs`, the plain `div`, no child margins, axe); ticket 17's landmark snapshot of the shell example; ticket 20's fixture for the shell popover and dialog across a `routerLink`; the [navigation-close](navigation-close.md) and [fragment-links](fragment-links.md) e2e cases; ticket 23's tie measurement for the order case; the [sidebar](sidebar.md) and [stack](stack.md) specs' probe and sticky techniques.

## Out of Scope

- Putting the class on `<body>`, by a provider, a `DOCUMENT` write, or `Renderer2` (usage rule 1; ADR 0003 point 1; map, Standing rulings, item 54).
- An input per token, an offset input for a sticky region, or a width given as a length rather than Yeti's `width` vocabulary (ADR 0004; ADR 0070 rule 2).
- A viewport breakpoint input, or a script that decides when the body row stacks (building-blocks 1.7).
- Directives for `header`, `main`, `footer`, the body-row `div`, or a region that does not stick; the landmarks are the consumer's elements (ticket 26 grilling question 6).
- A shared any-element `[yetiSticky]` directive for `sidebar`, `stack`, and `shell` (ADR 0070, considered options; ticket 26 grilling question 6).
- Closing panels on navigation from the shell; it is the panels' own directives' ([navigation-close](navigation-close.md); ADR 0041).
- Moving focus or announcing the page on a route change (section 12).
- Any check that the shell has the children in order, that one `main` exists, that `nav`s are labelled, that the outlet is inside `main`, or that a sticky region fits the viewport. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- Package CSS for the recipe; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 48 adds none for the sticky case (building-blocks 1.13; ADR 0060 point 8).
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).
- The `media` and `hero` recipes, each with its own spec.

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiShell]` with `gap` and `width`; part directive `[yetiShellRegion]` with `sticky` | building-blocks Part 2 row 20; ticket 26 rows 84 to 86; [Decide: the spec list](../issues/11-decide-spec-list.md) row 20 |
| The host is the outermost element of the root component's template, not `body` | ticket 11 row 20 (inferred there); [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 83 |
| `data-sticky` is kind C on a per-item part directive, on the body row's `nav` or `aside` | ADR 0070; ticket 26 row 86, grilling questions 6 and 7 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by Yeti's `YetiGap` and `YetiWidth`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2; ADR 0080 point 5 |
| `width` is `inert` | building-blocks 1.4; ticket 26 row 85, grilling question 15 |
| Shared input names across directives on one element (`gap`, `width`, `sticky`) | building-blocks 1.4, shared vocabularies; ticket 26 grilling question 16 |
| The part injects `yetiShellToken` optionally with `skipSelf` | ADR 0070 kind C; building-blocks 1.9 |
| Only `YetiShell` marks its host with `data-ngx-yeti-item-shell` and acquires the item file | ADR 0045; ticket 50 decision 6 |
| `injectYetiItemStyles('shell')` last in the constructor | [setup](setup.md); ticket 50 decisions 42 and 45 |
| `exportAs` on both; class names with no collision | building-blocks 1.3; ADR 0080 points 3 and 4; ticket 50 decision 10 |
| Entry point `ngx-yeti/shell` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 20 |
| Shell panels close on navigation through their own directives; the shell adds nothing | Part 2 row 20; ADR 0041 point 5; [navigation-close](navigation-close.md) |
| The skip link is fragment-links' and lives in `index.html` | ledger A11Y-16; [fragment-links](fragment-links.md); [setup](setup.md); [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 85 |
| The `router-outlet` goes inside `main` | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 84 |
| A center directly in a shell is not centred, as in full Yeti | ticket 23 (measured); ADR 0060 point 3 |
| Tokens are the consumer's, `--yeti-sticky-offset` and `--yeti-scroll-padding` included | ADR 0004 |
| Item file as a counted link in Yeti's order | ADR 0060 points 2 to 6 |
| A stuck region over stacked content follows the sidebar's usage rule and shares row A11Y-22 | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 47 and 48, after ticket 50 decisions 17 and 32 |
| No contrast assertion beyond the Story gate | ADR 0015 point 3; ticket 17 section 3 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

The root component of a routed application, with a site header holding the package's nav, a sticky section nav, and a footer:

```html
<div yetiShell gap="lg" width="xs">
  <header>
    <nav yetiNav threshold="md" aria-label="Site" i18n-aria-label>
      <!-- the nav spec's brand, toggle, and panel with routerLinks -->
    </nav>
  </header>
  <div>
    <nav yetiShellRegion sticky aria-label="Section" i18n-aria-label>
      <ul yetiStack gap="xs" role="list">
        <li><a routerLink="/trails">Trails</a></li>
        <li><a routerLink="/huts">Huts</a></li>
      </ul>
    </nav>
    <main id="main">
      <router-outlet />
    </main>
  </div>
  <footer i18n>Mountain Club</footer>
</div>
```

```ts
import { YetiShell, YetiShellRegion } from 'ngx-yeti/shell';
import { YetiNav } from 'ngx-yeti/nav';
import { YetiStack } from 'ngx-yeti/stack';

@Component({
  selector: 'app-root',
  imports: [YetiShell, YetiShellRegion, YetiNav, YetiStack, RouterLink, RouterOutlet],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
```

`index.html` keeps the skip link first in `body`, and the application config adds `provideYetiFragmentLinks()`:

```html
<body>
  <a href="#main">Skip to content</a>
  <app-root></app-root>
</body>
```

The same frame built from layouts, after Yeti's docs ("Built from primitives"), for a page that wants a sidebar's two-region rules instead of the recipe's three: `<div yetiStack fill>` holding a `header`, a `<div yetiSidebar width="sm">` with the `nav` and `main`, and a `<footer yetiStackChild split>` ([stack](stack.md), [sidebar](sidebar.md)).

A section nav component that is its own region: `@Component({ selector: 'nav[appSectionNav]', ... })`, written `<nav appSectionNav yetiShellRegion sticky aria-label="Section">` in the body row.

A page with a sticky site bar of 4rem, so the sticky section nav stops below it and a focused control or a fragment jump stops below both, in the consumer's stylesheet after Yeti (`Y/src/tokens/tokens.json:125-126`):

```css
.app-body-row {
  --yeti-sticky-offset: 5rem;
}
:root {
  --yeti-scroll-padding: 5rem;
}
```

A client-only application preloads the item: `provideYetiStyles({ preload: ['shell'] })`. A value newer than the pin: `<div yetiShell [width]="$any('3xl')">`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `recipes/shell/shell.css`, loaded by `YetiShell` as a counted link (section 13). The consumer writes nothing for the recipe beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps `data-gap` and `data-width` to the private tokens (`:6-37`, `:171-177`) and holds the `[data-sticky]` rule in `yeti.utilities` (`:333-342`); `tokens/space.css` declares `--yeti-cover-height`, `--yeti-space-*`, `--yeti-width-*`, `--yeti-sticky-offset`, and `--yeti-scroll-padding`; `base/reset.css` zeroes margins; `base/typography.css` reads the scroll padding on the root and holds the skip-link rule.
3. **Cross-item rules:** none in `shell.css`. The tie with `center` (`.shell > *` against `.center`) is an order, which ADR 0060 point 3 reproduces as in full Yeti (section 13). Items composed in the regions (`box`, `nav`, `stack`, `center`, `dialog`, `dropdown`) load their own files through their own directives.
4. **Tokens:** reads `--yeti-cover-height`, `--yeti-space-md`, and `--yeti-width-sm` by default and the named `--yeti-space-*` and `--yeti-width-*` through the value rules; a sticky region reads `--yeti-sticky-offset`; writes none (section 2).
5. **What breaks without the item file:** the regions render as plain blocks one under another at every width, the footer follows the content instead of sitting at the bottom of a short page, and a sticky `nav` still sticks from the always-loaded rule, above the regions after it, with no error. The landmarks are unaffected.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled all 49 of Yeti's class names with Tailwind 4.3.3, and only `container`, `grid`, and `table` (plus the attribute name `hidden`) produced a utility (measured). `shell` and `data-sticky` produced none.

### Platform features to adopt when the browser target moves

None for the recipe: flexbox `gap`, `dvh` units, and `:has()`, the three features the manifest lists as unguarded, and sticky positioning are inside Baseline 2025 (section 6), and Yeti guards nothing for the shell. CSS scroll-state container queries (`@container scroll-state(stuck: top)`) are the candidate the sidebar spec names for the stacked sticky case once they are in the target (inferred; not checked against web-features data).

### Single-page-application pieces relied on

- [navigation-close](navigation-close.md), through the `nav`, `dropdown`, and `dialog` directives in the shell (section 12; ledger A11Y-15).
- [fragment-links](fragment-links.md), for the skip link through `provideYetiFragmentLinks()` (usage rule 5; ledger A11Y-16).
- ADR 0060's styles service, which keeps the shell's link for the session.
- Not used: [events](events.md) (the recipe has none) and [generated-ids](generated-ids.md) (it renders no id).
