# Spec: progress (component item)

Ticket: [86. Spec: progress (component)](../issues/86-spec-progress.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 36 and Part 1 (1.2, 1.3, 1.4, 1.10 to 1.14), [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 134 to 136 and grilling question 15, [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) (decisions 2, 6, 8, 10, 18, 42, 45, and 68), [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). The item owns [ledger.md](../ledger.md) row A11Y-1e. `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x). The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 179 to 182), and each is cited where it applies.

## Problem Statement

Yeti's `progress` is "the native progress element as a thin bar in a hue, filled to its value, or striped and moving when it has none" (`Y/src/components/progress/manifest.json`). It is for "work with a known length: an upload, a wizard's steps, a quota", and with the value left off it says "busy" instead of "40%" (`docs.md`). It is one **Identity class**, `progress`, and three **Attributes**: `data-variant` (the hue of the filled part), `data-size` (the bar's thickness, half the size's space step), and `data-scroll` (a reading-progress bar that fills with how far the nearest scroll container has been scrolled). The ordinary form is a native `<progress>` element. The reading-progress form is "the one form of progress that is not a `progress` element, because there is no value to announce": a `div` with the class, hidden from assistive tech with `aria-hidden` (`docs.md`). It has no **Module**, no **Marker**, and no **Event**. It replaces Foundation 6's `.progress` and `.progress-meter` (`Y/src/guides/migrating.md:69`).

An application developer using the package cannot write `class="progress"` or any of those `data-*` attributes: a consumer writes no Yeti class or attribute, and the directive binds them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). Written by hand, `data-variant="sucess"` compiles and silently falls back to the primary hue; here it must fail to compile ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `progress` **Item file** loaded while a bar is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it a `progress` element is the browser's own bar and a reading bar is an empty block, with no error.

Three accessibility needs make the item more than a class, and none of them is in Yeti's CSS:

- **The name and the value are content the directive cannot read.** A `progress` "needs a name, from `aria-label` or `aria-labelledby`" (`docs.md`), and the package requires a **Visible value**, text a sighted user reads for the value, because the bar alone does not meet non-text contrast ([CONTEXT.md](../CONTEXT.md); [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 4: "a progress bar shows its value as text"). The package must state both, show them in every example, and assert them in every story.
- **Forced colours erase the bar.** Yeti switches the native drawing off (`appearance: none`) and paints the track and the fill with backgrounds, and ships no `forced-colors` rule, so under forced colours "the native `progress` bar is not drawn at all" (ledger A11Y-1e; [Research: Yeti against WHATWG, WAI-ARIA, the APG](../issues/17-research-yeti-accessibility-and-standards.md) section 2.6, measured in Chromium). The package closes it with one rule in its accessibility stylesheet, after Material's progress bar.
- **The indeterminate state is the absence of an attribute.** A `progress` with no `value` attribute is indeterminate, and Yeti styles it through `:indeterminate`. That state must be right in the server HTML, with JavaScript off, and when the work becomes known or unknown at runtime.

`meter` is not this item. A gauge (disk use, a password's strength) is a native `meter`, which has its own role and its own engine pseudo-elements; Yeti has no `meter` style, and the directive does not select it (section 6; Out of Scope).

## Solution

One directive in the secondary entry point `ngx-yeti/progress` ([building-blocks.md](../building-blocks.md) Part 2 row 36; 1.3):

- **`YetiProgress`**, the **Item directive**, on `progress[yetiProgress]` and `div[yetiProgress]`, `exportAs: 'yetiProgress'`. It binds `progress` as a static host class, and binds `data-variant`, `data-size`, and `data-scroll` from the typed inputs `variant` (`YetiVariant`), `size` (`YetiSizeControl`), and `scroll` (`boolean`, `booleanAttribute`). It sets the static presence attribute `data-ngx-yeti-item-progress` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), and calls `injectYetiItemStyles('progress')` as the last statement of its constructor ([setup](setup.md); ticket 50 decisions 42 and 45), which acquires the item file on the server too and releases it on destroy.

The developer writes `<progress yetiProgress variant="success" [attr.value]="done()" max="5" aria-labelledby="steps-label">` where Yeti's docs write `<progress class="progress" data-variant="success" value="3" max="5" aria-label="Steps">`, and `<div yetiProgress scroll aria-hidden="true">` where they write `<div class="progress" data-scroll aria-hidden="true">`. Unset inputs render nothing, so Yeti's defaults (`primary`, `md`, no scroll) apply from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1).

Everything else stays native and the consumer's ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) point 3; Part 2 row 36): the `value` and `max` attributes, the fallback text between the tags, the name (`aria-label` or `aria-labelledby`), the visible value next to the bar, and the reading bar's `aria-hidden`. The directive is **types only**: no listener, no render callback, no service of its own, and no DI beyond the styles service every item directive uses (Part 2, "Types only", with ticket 50 decision 18). So a bar is right on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block. The package adds one forced-colours rule to its accessibility stylesheet for the native bar (A11Y-1e).

## User Stories

1. As an application developer, I want to style a native `progress` element as Yeti's bar with one directive attribute, so that I never write Yeti's `progress` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="progress"` and `data-*` attributes, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want a bar with no inputs to be Yeti's default, a medium-thickness bar filled in the primary hue, so that the common case needs no configuration.
4. As an application developer, I want a `variant` input typed by Yeti's `variant` vocabulary, so that `variant="sucess"` fails to compile.
5. As an application developer, I want a `size` input typed by Yeti's `size-control` vocabulary, so that a bar beside large text can be thicker.
6. As an application developer, I want a static attribute such as `variant="success"` to type-check, so that I need no property binding for a constant.
7. As an application developer, I want an input I leave unset to render no attribute, so that Yeti's own default applies and the server HTML stays Yeti's minimal markup.
8. As an application developer, I want to bind `variant` from state, so that a failing upload turns its bar to `alert` under zoneless change detection.
9. As an application developer, I want a static `size="lg"` to do nothing beyond the input, so that HTML's `size` attribute has no effect on my bar.
10. As an application developer, I want to keep writing `value` and `max` myself, as the platform defines them, so that the bar is the native element I know.
11. As an application developer, I want a documented binding form for the value that renders in the server HTML, so that a server-rendered bar shows its value at first paint and with JavaScript off.
12. As an application developer, I want to leave the value off for work of unknown length, so that the bar turns indeterminate and shows Yeti's moving stripes.
13. As an application developer, I want to switch a bar between indeterminate and determinate by binding the value to `null` and back, so that one element covers "preparing" and "uploading".
14. As an application developer, I want the filled part to slide when the value changes, so that progress reads as movement without code of mine.
15. As an application developer, I want a reading-progress bar on a `div` with a `scroll` input, so that a long article shows how far the reader has scrolled with no script.
16. As an application developer, I want the reading bar pinned to the top of the page by putting it as the first child of a stack with `yetiStackChild sticky`, so that it stays in view, as Yeti's docs show.
17. As an application developer, I want the reading bar hidden in engines without scroll timelines, as Yeti does, so that no bar ever claims the reader has not started.
18. As an application developer, I want to make a reading bar a hairline by setting `--yeti-progress-size` and `--yeti-sticky-offset` on the bar itself, so that it sits on the edge of the page.
19. As an application developer, I want to set the bar's corner through `--yeti-progress-radius`, so that a theme changes every bar with no input.
20. As an application developer, I want the usage rules stated (the hosts, the name, the visible value, the value binding, the reading bar's `aria-hidden`, no static Yeti attributes), so that I use the bar as Yeti intends.
21. As an application developer, I want the progress item file loaded when the first bar renders and removed after the last leaves, so that I do not import `progress.css` globally.
22. As an application developer, I want the item file in the server HTML when a server-rendered page has a bar, so that the first paint is already Yeti's bar.
23. As an application developer, I want a bar right with JavaScript off under SSR and prerendering, so that the page shows its value before any script runs.
24. As an application developer, I want hydration to change nothing on a bar, so that I get no `NG05xx` error and no flash from stripes to a filled bar.
25. As an application developer, I want a bar inside a `@defer (hydrate on ...)` block to keep its styles before and after the block hydrates, so that incremental hydration does not strip it.
26. As an application developer, I want a bar inside a `hydrate never` block to keep its styles for as long as it is on the page, so that it is not unstyled when a live bar elsewhere leaves.
27. As an application developer, I want to know that a bar inside a client-only `@defer` block needs `progress` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
28. As an application developer using `withI18nSupport()`, I want a translated name and visible value to hydrate without being re-rendered, so that localised pages keep the server's DOM.
29. As an application developer, I want a template reference (`#bar="yetiProgress"`), so that the directive follows the package's `exportAs` rule.
30. As an application developer, I want to import the directive from `ngx-yeti/progress`, so that a `@defer` block can split it with the rest of the item.
31. As an application developer, I want the input value types re-exported by name (`YetiVariant`, `YetiSizeControl`), so that I can type my own signals that feed the inputs.
32. As an application developer, I want to know that a gauge is a native `meter` and not this item, so that I do not put the directive on the wrong element.
33. As a screen-reader user, I want every bar announced as a progress bar with a name, so that I know what is loading.
34. As a screen-reader user, I want a determinate bar's value announced from the element, so that I hear "40 percent" on the upload bar.
35. As a screen-reader user, I want an indeterminate bar announced as busy with no percentage, so that I am not told a false value.
36. As a screen-reader user, I want the reading bar kept out of the accessibility tree, so that I am not told about a bar that only mirrors my own scrolling.
37. As a screen-reader user, I want completion or failure of the work told to me as a status message, so that I know when the upload ended without polling the bar.
38. As a sighted user, I want the value written as text beside the bar, so that I can read "40%" without judging the length of a thin bar.
39. As a colour-blind user, I want a bar's state never carried by its hue alone, so that a red and a green bar are told apart by their words.
40. As a low-vision user, I want the visible value and the name to meet 4.5:1 contrast in the light and the dark scheme, so that I can read them.
41. As a forced-colours user, I want the bar's track and its filled part drawn in system colours, so that I can see how far the work has gone.
42. As a user who prefers reduced motion, I want the indeterminate stripes to stand still, so that the busy bar does not keep moving.
43. As a keyboard user, I want the bar never to be a Tab stop, so that a status indicator does not slow my way through the page.
44. As a package maintainer, I want the contract check to cover the three attributes and every value of their vocabularies, so that a pin move that adds a value fails before release.
45. As a package maintainer, I want the SSR smoke to assert the server HTML of a determinate bar, an indeterminate bar, a reading bar, and the item link, so that the first paint is proven.
46. As a package maintainer, I want the forced-colours rule proven by a test that fails with the accessibility stylesheet left out, so that the rule, not the engine, is shown to draw the bar.
47. As a package maintainer, I want the fixture app to render bars on a prerendered and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
48. As a package maintainer, I want the play functions to follow Yeti's own `progress.spec.js` cases, so that the package proves what Yeti proves.
49. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default fails no test for no reason.
50. As a package maintainer, I want the class name `YetiProgress` checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/progress/manifest.json`, `progress.css`, `docs.md`, and `example.html`, in `Y/src/layouts/attributes.css`, `Y/src/tokens/components.css`, `Y/src/tokens/motion.css`, `Y/src/tokens/tokens.json`, and `Y/schema/vocabulary.json`, and in Yeti's test `Y/test/browser/components/progress.spec.js` with its fixture:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `progress`, `component`, `Feedback` |
| `class` | `progress` |
| `attributes` | `data-variant`: enum, vocabulary `variant` (`primary`, `secondary`, `success`, `warning`, `alert`, `danger`, `neutral`, `black`, `white`), default `primary`, "The hue of the filled part." `data-size`: enum, vocabulary `size-control` (`sm`, `md`, `lg`), default `md`, "The bar's thickness: half the size's space step." `data-scroll`: boolean, "Fill with how far the nearest scroll container has been scrolled ... On a block with the class, not a progress element, and hidden from assistive tech; where a scroll timeline is unsupported the bar is not shown." |
| `classes`, `children`, `markers` | empty, empty, none |
| `tokens` | public: `--yeti-progress-radius`, `--yeti-progress-size`, `--yeti-color-surface-sunken` (the track), the five `--yeti-color-primary*` stops and `--yeti-on-primary` (the default variant), `--yeti-text-md` and `--yeti-space-sm` (the default size), `--yeti-duration-base`, `--yeti-ease`, `--yeti-motion-iterations`; private: `--_yeti-variant`, `--_yeti-variant-subtle`, `--_yeti-size-space`, `--_yeti-variant-soft`, `--_yeti-variant-strong`, `--_yeti-variant-text`, `--_yeti-on-variant`, `--_yeti-size-text` |
| `a11y` | `requiredAttributes`: `aria-label \| aria-labelledby \| aria-hidden`; `keyboard` empty; notes: "Put the class on a progress element and give it a name with aria-label or aria-labelledby. Keep its text content current ("40%"), since older assistive tech reads that. Leave out value for work whose length is unknown; the element is then indeterminate and says so. A reading-progress bar has no value to announce, so it carries aria-hidden instead of a name; the rule accepts either." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: `appearance: none on progress`, `:dir()`; `guarded`: `animation-timeline: scroll()` |
| `since` | `7.0.0` |

How it works, in `@layer yeti.components`: `.progress` sets `appearance: none`, `display: block`, full inline size, a block size of `var(--yeti-progress-size, calc(var(--_yeti-size-space) / 2))`, no border, `border-radius: var(--yeti-progress-radius)`, the `--yeti-color-surface-sunken` track as background, and `overflow: clip`. `:not([data-variant])` and `:not([data-size])` supply the primary ladder and the `sm` space step only when the attribute is absent. The filled part is the variant colour through the engines' own pseudo-elements, `::-webkit-progress-value` and `::-moz-progress-bar`, with `border-radius: inherit` and a `transition` on `inline-size` of `--yeti-duration-base` with `--yeti-ease`; `::-webkit-progress-bar` is transparent. `:indeterminate` paints diagonal stripes of the subtle stop and the track with a `repeating-linear-gradient` and runs `yeti-progress` for four times `--yeti-duration-base`, `--yeti-motion-iterations` times, with the value pseudo-elements transparent. `[data-scroll]::before` is a full-size block in the variant colour, scaled from the start edge (`:dir(rtl)` moves the origin), driven by `animation-timeline: scroll()` inside `@supports`, and `@supports not (animation-timeline: scroll())` hides the whole bar (`progress.css`).

The value rules for `data-variant` and `data-size` are in the **Always-loaded group** (`Y/src/layouts/attributes.css:237-254`, `:256-259`), as for every item that reads those vocabularies. `--yeti-progress-radius` defaults to `var(--yeti-radius-full)` (`Y/src/tokens/components.css:50`), and `--yeti-progress-size` is declared nowhere and read with its fallback (`tokens.json:171`, `"declared": false`). Under `prefers-reduced-motion: reduce` the motion tokens collapse to `--yeti-duration-base: 0.01ms` and `--yeti-motion-iterations: 1` (`Y/src/tokens/motion.css:28-29`), so the stripes stand still and a value change jumps. The root sets `accent-color: var(--yeti-color-primary)` (`Y/src/base/typography.css:14`), which colours a bare native `progress` that carries no class. No other item's CSS names `.progress` (checked with `rg` over `Y/src/**/*.css`; `button.css` uses only the `progress` cursor keyword).

Attributes left to the consumer (ticket 26 rows 134 to 136 map only the three `data-*` attributes; everything else is native): `value` and `max` (the element's own state, ADR 0003 point 3 and its rejected option "The directive owns native state too"), the fallback text content, `aria-label` or `aria-labelledby`, an optional `aria-valuetext`, and the reading bar's `aria-hidden` (Part 2 row 36: "the reading bar's `aria-hidden` is the consumer's").

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `progress` | static host class on `progress[yetiProgress]` and `div[yetiProgress]` (`YetiProgress`) | always | ADR 0003 point 1; Part 2 row 36 |
| Attribute `data-variant` | the hue of the filled part | input `variant`: `YetiVariant \| undefined`, bound `[attr.data-variant]`, `null` when unset | unset renders nothing; Yeti's `primary` applies. `variant` is not an HTML attribute | ticket 26 row 134 (R) |
| Attribute `data-size` | the thickness | input `size`: `YetiSizeControl \| undefined`, `[attr.data-size]` | unset renders nothing; Yeti's `md` applies. Static form: `inert` (below) | ticket 26 row 135 (R); building-blocks 1.4 |
| Attribute `data-scroll` | the reading-progress form | input `scroll`: `boolean` with `booleanAttribute`, `[attr.data-scroll]` as `''` when true and `null` when false | unset renders nothing. `scroll` is not an HTML attribute | ticket 26 row 136 (R) |
| Native `value`, `max` | the element's state; no `value` means indeterminate | the consumer's; the directive declares no input of these names and binds neither | usage rule 3 gives the binding form | ADR 0003 point 3; ticket 26 (not a Yeti attribute) |
| `aria-label`, `aria-labelledby`, `aria-hidden` | `a11y.requiredAttributes`, one of them | the consumer's; no name input | usage rules 4 and 6 | building-blocks 1.10, Names; Part 2 row 36 |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Tokens `--yeti-progress-radius`, `--yeti-progress-size` | the bar's own skin | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--yeti-color-surface-sunken`, `--yeti-color-<hue>*`, `--yeti-on-<hue>`, `--yeti-text-*`, `--yeti-space-*`, `--yeti-duration-base`, `--yeti-ease`, `--yeti-motion-iterations` | track, ladders, steps, motion | the consumer's | not applicable | ADR 0004 |
| Private tokens `--_yeti-variant*`, `--_yeti-on-variant`, `--_yeti-size-*` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-progress=""` on both hosts | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2 |
| Forced-colours rule (package) | Yeti has none | one rule in `@layer ngx-yeti` on the native bar (section 7) | in the package's accessibility stylesheet | ledger A11Y-1e; map, Package CSS for accessibility |
| Injection token | not Yeti's | none: the item has no part that would read one | not applicable | building-blocks 1.9 |

The `inert` kind for `size` (building-blocks 1.4; ticket 26 row 135, "HTML `size` (form controls): `inert` on Yeti's hosts", and grilling question 15): HTML's `size` acts on `input` and `select`, not on `progress` or `div`. A static `size="lg"` stays on the host beside `data-size="lg"`, does nothing, and the directive binds nothing for it.

The input value types are Yeti's own, from the package's generated `yeti-types.ts`, re-exported by name and never redeclared ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5; ADR 0060 point 10). Each is a full vocabulary, so no `Extract` is needed.

**Module replaced:** none. Yeti's `progress` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 36, "Yeti module: none"; [Research: Yeti's JavaScript modules and what Angular adds](../issues/03-research-yeti-javascript-and-angular.md)). The reading bar is Yeti's guarded scroll-driven animation, CSS only (Part 2 row 36; building-blocks 1.2), so no module behaviour is kept, changed, or removed.

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads `--yeti-progress-radius`, `--yeti-progress-size`, `--yeti-color-surface-sunken`, `--yeti-duration-base`, `--yeti-ease`, and `--yeti-motion-iterations`; with no `variant`, the primary stops; with no `size`, `--yeti-space-sm` and `--yeti-text-md`; and through the always-loaded value rules whichever hue and step a set attribute names. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, with a runtime `setProperty`, or on one element for a derived token: Yeti's own advice for a reading bar is `--yeti-sticky-offset: 0` and `--yeti-progress-size: 2px` "on the bar itself" (`docs.md`), which a consumer writes as a static `style` attribute or a `[style.--yeti-progress-size]` binding, neither of which the directive binds. Hues, chroma, and the scale go only on `:root` (`Y/src/guides/theming.md:38`). **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- One directive, two host selectors, no parts. Neither form has a child Yeti styles (manifest `children` empty), so the item provides no injection token (building-blocks 1.9).
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"). The reading bar in Yeti's docs carries the always-loaded `data-sticky` marker as the first child of a stack; in the package that is `yetiStackChild` with `sticky` written beside `yetiProgress` on the same `div` ([stack](stack.md); ticket 26 row 67). `YetiStackChild` is a child directive, so it sets no presence attribute (ticket 50 decision 6), and its inputs (`split`, `space`, `sticky`) share no name with `variant`, `size`, or `scroll`.
- Shared input names (building-blocks 1.4, shared vocabularies): `variant` is `YetiVariant` and `size` is `YetiSizeControl` on every item that declares them (ticket 26). A progress host is its own element in Yeti's markup; the any-element marker directives a consumer may write beside it declare selector-named inputs only ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) kind G), so no name collides.
- The only injection is the root styles service of ADR 0060, reached through `injectYetiItemStyles('progress')` ([setup](setup.md); ticket 50 decisions 18 and 45).
- Generated ids and the platform's relationship attributes: none. The name's `aria-labelledby` references an id the consumer writes on its own label, so the directive does not use [generated-ids](generated-ids.md).

### 4. API

| Member | `YetiProgress` |
| --- | --- |
| Class name | not among the 46 names `yeti.d.ts` exports at the Pin (ticket 50 decision 10; ADR 0080's 2026-10-03 note), so it takes `Yeti`, not `NgxYeti` (ADR 0080 point 4) |
| Selector | `progress[yetiProgress], div[yetiProgress]` (Part 2 row 36) |
| `exportAs` | `yetiProgress` (building-blocks 1.3) |
| Entry point | `ngx-yeti/progress` (building-blocks 1.3; ADR 0011 clause 10) |
| Inputs | `variant: YetiVariant \| undefined` (Yeti default `primary`); `size: YetiSizeControl \| undefined` (`md`); `scroll: boolean` with `booleanAttribute` (default `false`). No input default differs from Yeti's (ADR 0070 rule 1) |
| Host | static `class: 'progress'`; static `data-ngx-yeti-item-progress: ''`; `[attr.data-variant]`, `[attr.data-size]` from the inputs, `null` when unset; `[attr.data-scroll]` as `''` or `null`. No binding for HTML `size` (`inert`), `value`, `max`, `role`, or any ARIA attribute |
| Providers | none |
| Injection | the ADR 0060 styles service, through `injectYetiItemStyles` |
| Models, outputs, methods, listeners | none |
| Lifecycle | `injectYetiItemStyles('progress')` is the constructor's last statement, after anything there that can throw (nothing does today); the helper releases through `DestroyRef` ([setup](setup.md); ticket 50 decisions 42 and 45) |

A static attribute type-checks as a string literal under `strictTemplates`, so `variant="success"` compiles and `variant="sucess"` does not (ADR 0070 rule 2).

**Usage rules** (numbered here and in the directive's JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiProgress` on a `progress` element for a bar with a value or an indeterminate bar, and on a `div` only for the reading-progress form (`docs.md`, "Reading progress"). The selector admits no other element. Never on `meter`: a measurement within a known range (a quota's use, a score) is a native `meter`, which Yeti does not style (section 6).
2. Write `scroll` only on the `div` host, never on a `progress` element. Yeti's reading-bar rules draw a `::before` the native element "would never draw", and the no-support fallback hides the whole host (`progress.css`), so a `progress` with `scroll` would vanish in an engine without scroll timelines, Firefox 145 among them (section 6).
3. Bind a changing value as an attribute, `[attr.value]="done()"`, with `null` for unknown work, and write `max` statically or as `[attr.max]`. A `progress` is indeterminate exactly when it has no `value` attribute, so `null` gives Yeti's stripes and a number gives the filled bar. The property form `[value]` is not used for a server-rendered bar: the DOM emulation of the Angular server renderer has no `value` reflection for `progress`, so the server HTML would carry no `value` and paint the indeterminate stripes until hydration, and a property cannot be removed to return to indeterminate (read in the bundled emulation of `@angular/platform-server` 21.0.6, which reflects only `max` for `progress`; not measured at 22.2) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 179).
4. Give every `progress` element a name with `aria-labelledby` pointing at its visible label, or with `aria-label` (manifest `a11y.requiredAttributes`; `docs.md`, Accessibility; building-blocks 1.10, Names). A `label for` names a `progress` in the platform but does not satisfy Yeti's validator, which accepts only the listed attributes (`Y/bin/validate.js:106-111`).
5. Show a **Visible value** for every determinate bar: text a sighted user reads beside the bar, such as "40%" or "3 of 5", outside the `progress` element, kept equal to the value ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 4; [CONTEXT.md](../CONTEXT.md)). For an indeterminate bar, the visible text says what is happening ("Preparing upload"). The text between the `progress` tags is fallback content that the target engines do not draw (inferred from WHATWG's rendering of `progress` as a widget, not measured); keep it current too, "since older assistive tech reads that" (manifest `a11y.notes`). Where the value is not a percentage, `aria-valuetext` may say it ("Step 3 of 5"); it is the consumer's.
6. Give the reading bar `aria-hidden="true"` and no name: "there is no value to announce" (`docs.md`; manifest `a11y.notes`, "the rule accepts either"). Never put `aria-hidden` on a `progress` element.
7. The hue is decoration; the visible text carries the meaning. A bar that turns `alert` on failure also says so in words (WCAG 1.4.1).
8. Announce completion and failure of the work as a status message outside the bar, for example in an `alert` with `role="status"`; the bar's own value changes are not announced as they happen (WCAG 4.1.3; building-blocks 1.10, Strings) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 181).
9. Remove an indeterminate bar, or give it a value, when the work ends. The stripes repeat `--yeti-motion-iterations` times, which is `infinite` unless the user prefers reduced motion (`Y/src/tokens/motion.css:13`) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 180).
10. Do not write `class="progress"`, `data-variant`, `data-size`, `data-scroll`, or `data-ngx-yeti-item-progress` statically on the host. The directive binds them, and hydration writes a static attribute back before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"; ADR 0070 consequences). A value newer than the pin goes through `$any` (`[variant]="$any('info')"`, ADR 0070).
11. Bind every input, `value`, and `max` from values that are the same on the server and the client, never from a browser-only read. The hydration constraints require the same DOM on both sides.
12. Import `YetiProgress` in every component whose template writes the attribute. A **Forgotten import** with only static inputs renders the browser's own bar with no class and no error; only a bound input (`[variant]`) makes the compiler report it (NG8002), or a template reference naming the `exportAs` (NG8003) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `progress` | Nearest in Angular Material: `MatProgressBar` |
| --- | --- | --- |
| Shape | an item directive on the consumer's native `progress` element (or a `div` for the reading bar) | a component, `mat-progress-bar` (`NC/src/material/progress-bar/progress-bar.ts:87`), with its own template of `div`s |
| Role and value | native: the `progress` element is a progress bar, and the browser derives its value from `value` and `max` | `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"`, and `[attr.aria-valuenow]` bound to `null` when indeterminate (`:90-96`) |
| Value input | none: the native `value` and `max` (usage rule 3) | `value` input, clamped to 0 to 100 (`:158-167`) |
| Mode | the presence of `value` (determinate or indeterminate), and the separate `scroll` form | `mode`: `determinate`, `indeterminate`, `buffer`, `query` (`:84`, `:190-204`) |
| Hue and size | `variant` from Yeti's nine values; `size` from three | `color` (`:152`); the thickness is a theme token |
| Focus | not focusable | `tabindex="-1"` "so screen readers will read the aria-label" (`:93-95`) |
| Completion | none; the consumer's status message (usage rule 8) | `animationEnd` output after the value transition (`:185`, `:240-248`) |
| Forced colours | one rule in `@layer ngx-yeti` (A11Y-1e, section 7) | an outline in `CanvasText` on the track and `ButtonBorder` for the buffer dots under the CDK `high-contrast` mixin (`progress-bar.scss:57`, `:119`) |
| `exportAs` | `yetiProgress` | `matProgressBar` (`:88`) |

Borrowed: the forced-colours technique, a system-colour boundary on the track as Material draws it (`progress-bar.scss:57`), which is A11Y-1e's building block. Not borrowed: the component and its template (the native element is the pattern, building-blocks 1.10, Native elements first), the explicit ARIA value attributes (the native element computes them; binding them would duplicate native state, ADR 0003 point 3), `tabindex="-1"` (a status bar is not focused in Yeti's model, and focus on a non-interactive element is not needed for a named progress bar), the `buffer` and `query` modes (Yeti has no form for them), and the `animationEnd` output (the package dispatches no event Yeti does not have, building-blocks 1.4).

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 36; building-blocks 1.2). The `progress` element is the pattern: role, value, the indeterminate state, and its announcement are the platform's. No Aria pattern exists for a progress bar ([Research: Yeti against WHATWG, WAI-ARIA, the APG](../issues/17-research-yeti-accessibility-and-standards.md) section 4.16: "meter/progress not in APG as a widget"), and no CDK piece is used: there is no id, focus, keyboard, observer, or direction read. The forced-colours rule takes the CDK `high-contrast` mixin's shape, `@media (forced-colors: active)`, as plain CSS (`NC/src/cdk/a11y/_index.scss:48-65`; building-blocks 1.2). RTL is Yeti's: the native fill follows the element's direction, and the reading bar's origin moves under `:dir(rtl)` (`progress.css`), so the package needs no `Directionality`.

`appearance: none` on `progress` and `:dir()` are the two features the manifest lists as unguarded; both are inside Baseline 2025 (building-blocks 1.2 lists `:dir()`; `appearance` is Baseline "high" since 2022 in [research/browser-baseline-vs-yeti.md](../research/browser-baseline-vs-yeti.md), line 474). `animation-timeline: scroll()` is guarded by Yeti with the fallback "not shown" (building-blocks 1.2, "scroll-driven animations (the progress bar's scroll mode)"). Its web-features entry lists Chrome and Edge 115 and Safari 26 but no Firefox version (the same file, line 297), so in Firefox 145 the reading bar is hidden, and the package adds no guard.

Why not `meter`: Yeti's fill rules target `::-webkit-progress-value` and `::-moz-progress-bar`, which a `meter` does not have (its fill is `::-webkit-meter-optimum-value` and its relatives, and `::-moz-meter-bar`), so `appearance: none` on a `meter` would leave an empty track. A `meter` is also a different role (`meter`, not `progressbar`) and a different meaning: a measurement, not work toward completion. Part 2 row 36 names the two hosts, and the selector admits neither `meter` nor any other element.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none (above). The native `progress` maps to role `progressbar` ("native `progress` -> Chromium `progressbar "Upload"`", ticket 17 section 4.16, measured). The directive adds no role, state, or property.
- **Values:** the platform's. A determinate bar exposes its value as a percentage of `max`; an indeterminate bar exposes no current value and is announced as busy ("An indeterminate bar is announced as busy with no percentage, which is right", `docs.md`). `aria-valuetext` is the consumer's option (usage rule 5).
- **Keyboard and focus:** none. A `progress` is not focusable and the directive adds no `tabindex` (building-blocks 1.10, Focus).
- **Names:** the consumer's `aria-labelledby` or `aria-label` (usage rule 4); the reading bar is out of the tree through the consumer's `aria-hidden` (usage rule 6), "measured absent from the tree" (ticket 17 section 4.16).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.1.1 Non-text Content | The bar is a named progress bar (usage rule 4) whose value is also text (usage rule 5). The reading bar is decoration that mirrors the reader's scrolling, hidden from assistive tech (usage rule 6). Every story's play function asserts a non-empty computed name on every `progress` and `aria-hidden="true"` on every reading bar. |
| 1.3.1 Info and Relationships | The native role and value carry the structure; the visible label is the name through `aria-labelledby`. `progress--default` asserts the computed role and name. |
| 1.4.1 Use of Color | The hue is decoration; the visible text carries the state (usage rule 7). `progress--variants` asserts every bar has a visible value or status text. |
| 1.4.3 Contrast (Minimum) | The name and the visible value are the page's own text. Play functions assert at least 4.5:1 for them with the exact WCAG formula on computed colours, in a light and a dark `color-scheme` wrapper (ADR 0015 point 3; ticket 50 decision 8). |
| 1.4.11 Non-text Contrast | The fill against the track is not asserted: the bar alone does not meet non-text contrast, which is why the **Visible value** is required ([CONTEXT.md](../CONTEXT.md); ADR 0015 point 4). With usage rule 5 followed, the bar is not the only way to perceive the value. |
| 2.2.2 Pause, Stop, Hide | The indeterminate stripes repeat without end unless the user prefers reduced motion, where they run once and stand still (Yeti's own test, `progress.spec.js`, "under reduced motion the stripes stand still"). The package adds no pause control and relies on usage rule 9 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 180). The reading bar never moves on its own ("the fill follows the reader's hand", `docs.md`). |
| 2.3.3 Animation from Interactions | AAA, not required; Yeti's reduced-motion collapse covers the value transition (`motion.css:28`). |
| 4.1.2 Name, Role, Value | Role and value are native; the name is the consumer's (usage rule 4). The directive binds no ARIA, so nothing it writes can contradict the native semantics. |
| 4.1.3 Status Messages | The bar's value changes are not a live region. Completion and failure are the consumer's status message (usage rule 8) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 181). |

**Forced colours** (not an AA criterion of its own, ticket 17 section 2.6; the package's accessibility CSS by the user's ruling "Accessibility CSS: Yes.", map, Standing rulings).

**Ledger rows owned:** A11Y-1e ([ledger.md](../ledger.md); Part 2 row 36). Under forced colours the native `progress` bar is not drawn at all, because Yeti replaces the native drawing with backgrounds (`appearance: none`; the track's `background-color` and the value pseudo-elements' `background-color`), which forced-colours mode replaces, and ships no `forced-colors` rule (measured in Chromium, ticket 17 section 2.6; not measured in Firefox or WebKit). The package adds one rule to its accessibility stylesheet, inside `@layer ngx-yeti` and `@media (forced-colors: active)`, on `progress.progress`: the track gets a boundary in a system colour, as Material's `outline-color: CanvasText` under the same query (`NC/src/material/progress-bar/progress-bar.scss:57`), and the filled part, through `::-webkit-progress-value` and `::-moz-progress-bar`, is drawn in a system colour distinct from the track's (Material's `ButtonBorder` at `:119` is the model for a non-text system colour). It selects Yeti's class on the native element and the engines' value pseudo-elements only, reads no private token, and names no package class (map, Package CSS for accessibility; [setup](setup.md), the package's accessibility stylesheet, `ngx-yeti/accessibility.css`, ticket 50 decision 68). The exact declarations, including whether the value pseudo-elements need `forced-color-adjust: none` to keep a system colour in each engine, are the implementer's within those limits; layer 4 asserts the outcome. An indeterminate bar under the rule shows the outlined track; whether Yeti's stripe gradient survives forced colours is not measured, and the **Visible value** text carries the busy state either way. The reading bar is not covered: it is out of the tree, decoration that mirrors the scroll position the scrollbar already shows, and A11Y-1e names the native bar only; layer 4 records its forced-colours screenshot ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 182). The row's "What the package adds" ("One rule after Material's progress bar") stands as written.

### 8. Rendered HTML

Consumer markup, after Yeti's example and docs:

```html
<p id="upload-label" i18n>Upload <span>{{ percent() }}%</span></p>
<progress yetiProgress [attr.value]="percent()" max="100" aria-labelledby="upload-label" i18n>
  {{ percent() }}%
</progress>

<p id="prep-label" i18n>Preparing files</p>
<progress yetiProgress variant="neutral" aria-labelledby="prep-label" i18n>Preparing files</progress>

<div yetiStack>
  <div yetiProgress scroll yetiStackChild sticky aria-hidden="true"></div>
  <article>...</article>
</div>
```

Server HTML and the hydrated DOM are the same. The first bar carries `yetiprogress=""`, `value="40"` (from the attribute binding), `max="100"`, `aria-labelledby="upload-label"`, `class="progress"`, and `data-ngx-yeti-item-progress=""`, and no `data-variant`, `data-size`, or `data-scroll`, so Yeti's primary hue and `md` thickness apply. The second carries `variant="neutral"` (the static input attribute, matched by no rule), `data-variant="neutral"`, the class and presence attribute, and no `value`, so `:indeterminate` matches and the stripes run. The reading bar carries `scroll=""`, `sticky=""`, `aria-hidden="true"`, `class="progress"`, `data-scroll=""`, `data-sticky=""` (from `YetiStackChild`), and `data-ngx-yeti-item-progress=""`. No host carries a role, an `id`, or an ARIA attribute from the package.

The server also writes the item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>components/progress/progress.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="progress"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). Its rank is `Y/src/yeti.css:53`, after `alert` and before `spinner`. The client adopts the link at bootstrap.

When `percent()` becomes `null`, Angular removes `value` and the bar turns indeterminate; when it becomes a number again, the attribute returns and the fill slides from the start (usage rule 3).

The delta from Yeti's docs markup: the consumer writes `yetiProgress` and input names where the docs write `class="progress"` and `data-*` names, `yetiStackChild sticky` where they write `data-sticky`, and `[attr.value]` where a static `value` would not change.

### 9. Animation

Yeti's own, all CSS, with no package code (building-blocks 1.6; [ADR 0010](../adr/0010-animation-is-yetis-css-with-class-form-enter-and-leave.md)):

- **Value changes:** the fill's `inline-size` transitions over `--yeti-duration-base` with `--yeti-ease` when the `value` attribute changes (`progress.css`). Nothing completes in the package's sense: there is no output and no completion timer.
- **Indeterminate:** the stripes move by `background-position` for four times `--yeti-duration-base` per cycle, `--yeti-motion-iterations` times, `infinite` by default.
- **Reading bar:** a scroll-driven `scale` from the start edge, paced by the scroll, never by the clock, and kept under reduced motion because "nothing in it moves on its own" (`docs.md`; `Y/src/guides/animations.md:50`).
- **Reduced motion:** the motion tokens collapse (`motion.css:28-29`): the value jumps, and the stripes run one 0.04 ms cycle and stand still (Yeti's test asserts six frames with the same position).
- **Enter and leave:** a bar the consumer inserts or removes with `@if` may carry a class-form `animate.enter` or `animate.leave` of the consumer's or Yeti's `enter` utility (the [enter](enter.md) spec). The item link stays until Angular removes the last host, because removal waits for the DOM (ADR 0060 point 4). A server-rendered bar never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes, the consumer's `value` (as an attribute binding, usage rule 3), `max`, name, and fallback text, and the item link in `<head>` (section 8). Everything at first paint is a host binding or the consumer's template (ADR 0011 clause 1). Nothing is **Pre-hydration state**: no person and no Yeti module can change a bar's attributes before hydration (ticket 26 rows 134 to 136, "the consumer's binding only").
- **Before hydration:** the directive creates no node, reads no layout, starts no timer or observer, and touches no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is the item acquisition, which ADR 0060 runs on the server too. The stripes and the reading bar move by CSS before hydration.
- **Full hydration:** the host is claimed as it is; bindings computed from the same values give the same attributes (usage rule 11); 0 style mutations (ADR 0060 point 5, measured for the mechanism). A `[value]` property binding would add the value only at this point, turning server stripes into a filled bar, which usage rule 3 avoids.
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the bar, its value, and its link; a dehydrated host holds the link while it is connected (ADR 0060 point 4). The value stays at its server value until the block hydrates and the binding runs.
- **`hydrate never`:** the bar is its server HTML: styled, named, at its server value or striped, and the reading bar still fills with the scroll. It never updates, because updating a value needs Angular. ADR 0060 point 4 and ADR 0045's presence attribute keep its link while live bars elsewhere leave; layer 4 asserts it.
- **Client-only `@defer`:** the item file is fetched when `YetiProgress` is constructed, which can show unstyled frames (the browser's own bar, or an empty reading bar); the consumer closes the gap with `provideYetiStyles({ preload: ['progress'] })` (ADR 0060 point 6; [setup](setup.md)).
- **Event replay:** the directive declares no listener, so nothing replays and it adds no `jsaction`.
- **`withI18nSupport()`:** the name and the visible value are usually translated with `i18n` on the label and on the fallback text. The directive adds no `i18n` block; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11). `i18n` on the host translates its fallback text and leaves the directive's bindings alone (inferred).
- **Zoneless:** inputs are `input()` signals read by host bindings, and a consumer's `[attr.value]` binding reads its own signal, so a changed value or input refreshes its attribute with no zone (map, Standing rulings, item 43; ADR 0070 rule 4).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): every bar is styled, named, and at its server value, and its visible value is readable, because all of it is in the server HTML. What is lost: the value never changes after the page loads, since updating it needs Angular. The indeterminate stripes and the reading bar still move by CSS. A client-only application gets no such promise.
- **Hydration boundary:** a bar may sit in any boundary. Its `aria-labelledby` target is the consumer's static id, so the two ends may hydrate at different times without a stale reference (ADR 0011 clause 7 concerns generated ids, which the item has none of). The bar and its visible value should sit in one boundary so that they update in the same pass (usage rule 5).

### 11. Hydration constraints

The item complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; `data-variant`, `data-size`, and `data-scroll` come from inputs, and `value` and `max` from the consumer's bindings, whose values usage rule 11 keeps equal on both sides. Usage rule 3 keeps `value` an attribute on both sides; the property form is the one way the DOM would differ (read, section 4 rule 3).
- **No direct DOM manipulation:** the directive writes nothing to the DOM outside host bindings. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directive changes no element. A `progress` is phrasing content and a `div` is flow content; Yeti's reading bar is a `div` "as the first child of the page's stack" (`docs.md`), which is valid where a `div` is.
- **`preserveWhitespaces`:** the directive has no template. White space in the fallback text is the consumer's and is not drawn.
- **No output branched on the platform:** none.
- **Static attributes the directive binds:** usage rule 10 keeps the consumer from writing them. The static `size` is `inert` and never bound, so hydration writes back the same value the server rendered.

### 12. Single-page application

None. The bar has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). On a route change, a route's bars leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-progress]` host is connected (ADR 0060 point 4; ADR 0045). A reading bar measures the nearest scroll container, so in an application whose routed views scroll the document it keeps tracking the page across routes; one inside a `scroller` tracks that scroller (`docs.md`). A bar in the persistent shell outside the `router-outlet` keeps its link across routes.

### 13. Item file

`yeti-css/css/components/progress/progress.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `YetiProgress` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:53`, after `alert` and before `spinner`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-progress` has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the `[data-variant]` and `[data-size]` value rules, the `[data-sticky]` rule, and the tokens), the package's accessibility stylesheet (which holds A11Y-1e's rule), and optionally `provideYetiStyles({ preload: ['progress'] })`. Cross-item files acquired: none (`progress.css` names no other item, and no other item's CSS names `.progress`; ADR 0060 point 9). A reading bar written with `yetiStackChild` sits in a `yetiStack`, which acquires the stack's own item file.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attributes in the DOM, the `value` attribute and the `:indeterminate` state, the item link, the bar's thickness relative to its size step, the computed role and name, the visible value's contrast, and the forced-colours drawing. It never asserts a private field or how the styles service counts. No test depends on a public token's default value or a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): the thickness test compares the bar's height with half of the resolved `--yeti-space-*` step, as Yeti's `progress.spec.js` does, and contrast asserts the criterion's ratio, never a colour value. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group and the package's accessibility stylesheet globally and the `progress` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Every play function asserts, for each `progress` in the story, a non-empty computed name and role `progressbar`, and for each determinate one, a visible text in the document that contains its value (usage rules 4 and 5; ADR 0015 point 4); for each reading bar, `aria-hidden="true"` and its absence from the accessibility tree (usage rule 6). Story ids:

- `progress--default`: Yeti's upload bar, `value="40" max="100"`, named by its visible label. Asserts `class="progress"`, `data-ngx-yeti-item-progress`, and no `data-variant`, `data-size`, or `data-scroll`; no `role`, `id`, `tabindex`, or `aria-value*` on the host from the package; the host is not focusable; the height is half the resolved `--yeti-space-sm` within 1 px; the corner radius is not zero; the visible value meets 4.5:1 in a light and a dark `color-scheme` wrapper (ticket 50 decision 8).
- `progress--indeterminate`: Yeti's "Loading" bar with no value. Asserts `:indeterminate` matches, `background-image` is not `none`, and `animation-name` is `yeti-progress` (after Yeti's test); the computed role has no current value.
- `progress--toggle-value`: a bar whose `[attr.value]` is bound to a signal through a Storybook control. The play function sets `null` and asserts no `value` attribute and `:indeterminate`; sets 3 of 5 and asserts `value="3"`, not indeterminate, and the visible "3 of 5"; sets `null` again and asserts indeterminate (usage rule 3).
- `progress--variants`: the seven hued variants and `black` and `white` on suitable paints, each with its visible text. Asserts each `data-variant` value, a visible status text per bar (usage rule 7), and 4.5:1 for the visible texts in both scheme wrappers.
- `progress--sizes`: `sm`, `md`, `lg`, and a bar with `--yeti-progress-size: 2px` set on itself beside one without. Asserts each height is half the matching resolved space step, the 2 px bar is 2 px, and its neighbour keeps the step (after Yeti's test); a static `size="lg"` renders both `size="lg"` and `data-size="lg"` (the `inert` kind).
- `progress--inputs`: Storybook controls bind `variant`, `size`, and `scroll` on a `div` host. The play function sets each, asserts the matching `data-*` value, resets it, and asserts the attribute is absent.
- `progress--reading`: Yeti's example: a `yetiStack` whose first child is a `div` with `yetiProgress scroll yetiStackChild sticky aria-hidden="true"` and a tall article. Where `CSS.supports('animation-timeline: scroll()')`, scrolling the story's scroll container to half and to the end gives a `::before` scale near 0.5 and 1 (after Yeti's test, waiting two frames per move); where it is not supported, the bar's `display` is `none`. A plain value bar beside it has no `::before` content.

### Layer 2: browser-level (`npx nx test <lib>`, `progress.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiProgress, { tagName: 'progress' })`: the host has class `progress` and `data-ngx-yeti-item-progress`, and no `data-variant`, `data-size`, `data-scroll`, `size`, `value`, `role`, or ARIA attribute; with `bindings` setting each input, the attributes follow after `whenStable()`, and binding `undefined` or `false` removes them.
- `createDirective(YetiProgress, { tagName: 'div', bindings: [inputBinding('scroll', () => true)] })`: `data-scroll=""` is present.
- While a `YetiProgress` fixture lives, one `<link data-ngx-yeti-styles="progress">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- The directive adds no listener to its host and no attribute beyond the class, the presence attribute, and the three `data-*` attributes.

A small test host covers what `createDirective` cannot: the template reference `#bar="yetiProgress"` resolves; `[attr.value]` bound to `null` leaves `:indeterminate` matching and bound to `40` does not; a static `size="sm"` renders both attributes; `<div yetiProgress scroll yetiStackChild sticky>` renders both directives' attributes and only the progress presence attribute (ticket 50 decision 6); a `meter yetiProgress` gets no class (the selector does not match); the consumer's own `class` on the host is kept.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `progress.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture of section 8's markup whose labels and fallback texts carry `i18n` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the determinate bar renders `value="40"` and `max="100"` from `[attr.value]` and the static `max`; the indeterminate bar renders no `value`; each host renders `class="progress"` and `data-ngx-yeti-item-progress`, the bound `data-*` attributes, the inert static `size`, and no `data-*` for an unset input; the reading bar renders `data-scroll=""`, `data-sticky=""`, and `aria-hidden="true"`; `<head>` holds one item link with `data-ngx-yeti-styles="progress"`, `data-beasties-skip`, and an `href` ending `components/progress/progress.css?v=<pin>`; no element carries a `jsaction` from the package. One more case records, without asserting, whether a `[value]` property binding renders a `value` attribute in the server HTML at 22.2, the measurement usage rule 3's open point waits on.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `progress` has `YetiProgress`; `data-variant` and `data-size` have inputs whose unions equal the manifest's vocabularies `variant` and `size-control`, and `data-scroll` a boolean input; the item has no markers and no events. A pin move that adds an attribute or a value fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids:

- **Forced colours (A11Y-1e):** on `progress--default` and `progress--toggle-value` (at 3 of 5) under `emulateMedia({ forcedColors: 'active' })`, the track's computed outline or border is a non-transparent system colour, and a screenshot pixel probe finds the filled part's colour differs from the track's, in Chromium, Firefox, and WebKit; with the package's accessibility stylesheet left out, the same probe finds no difference, which proves the rule is what draws the bar (axe does not check it). `progress--indeterminate` and `progress--reading` under forced colours record a screenshot, not asserted.
- **Reduced motion:** on `progress--indeterminate` with `emulateMedia({ reducedMotion: 'reduce' })`, `animation-iteration-count` is `1` and six frames show the same `background-position` (after Yeti's test).
- **Reading bar:** `progress--reading` fills to about half and to full with the page's scroll in Chromium and WebKit, and is `display: none` in Firefox, whose web-features entry has no version for scroll-driven animations (section 6); the assertion branches on `CSS.supports('animation-timeline: scroll()')`, as Yeti's test does, so an engine that adds the feature moves to the first branch.
- **Reflow and contrast:** at a 320 px viewport no story overflows horizontally (1.4.10); `progress--variants` repeats the visible-text contrast assertions with `emulateMedia({ colorScheme: 'light' })` and `'dark'`.

Fixture-app half, built with `outputMode: 'server'`, with a `/progress` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route renders section 8's markup:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`; every bar's attributes after hydration equal the server HTML's, and the determinate bar is never `:indeterminate` in any frame from first paint to hydration;
- with JavaScript disabled, the determinate bar shows its fill at the server value, the indeterminate bar shows stripes, the visible values are present, and `@axe-core/playwright` with the six tags reports no violation;
- a bar inside a `hydrate never` block keeps its item link and its computed height after every live bar on the page is removed (ADR 0060 point 4; ADR 0045);
- a bar inside a client-only `@defer` block with `progress` in the preload list shows no unstyled frame;
- navigating from the progress route to a route without a bar removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and `docs.md` examples for the stories, and its `test/browser/components/progress.spec.js` with the fixture `test/browser/fixtures/components/progress.html` for the thickness, the variant fill (Firefox only), the stripes, reduced motion, the scroll fill and its fallback, the per-element size token, and axe; ticket 17's forced-colours screenshots (`out/fc-*.png`) for the measured loss; the [button](button.md) spec's forced-colours comparison with the accessibility stylesheet left out; ticket 18's fixture app for the `hydrate never` case; ADR 0060's prototype for the server HTML and the item link.

## Out of Scope

- `meter`: no directive, no style, and no host (usage rule 1; section 6). A gauge is a bare native `meter`, which the root's `accent-color` may tint in some engines (`Y/src/base/typography.css:10-14` names checkbox, radio, range, and progress).
- A `value`, `max`, or `mode` input, a `buffer` or `query` mode, explicit `aria-valuenow`, `aria-valuemin`, or `aria-valuemax`, and a completion output (ADR 0003 point 3 and its rejected option; Part 2 row 36 names three inputs; section 5).
- A visible-value element, a label, or any text the package renders (building-blocks 1.10, Strings); the consumer writes them (usage rules 4 and 5).
- A live region or announcement of value changes (usage rule 8).
- A pause control for the indeterminate stripes (usage rule 9).
- A JavaScript fallback for the reading bar where scroll timelines are missing; Yeti's fallback is to hide it (building-blocks 1.2).
- An input per token, a radius or thickness input, or a hue outside Yeti's `variant` vocabulary (ADR 0004; ADR 0070 rule 2).
- A forced-colours rule for the reading bar (section 7) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 182).
- Any check that the host is `progress` or `div`, that a name and a visible value exist, or that `scroll` sits on a `div`. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive on `progress[yetiProgress]` and `div[yetiProgress]` with `variant`, `size`, `scroll`; no part directive | building-blocks Part 2 row 36; ticket 26 rows 134 to 136; [Decide: the spec list](../issues/11-decide-spec-list.md) |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by Yeti's `YetiVariant`, `YetiSizeControl`, and `booleanAttribute`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2; ADR 0080 point 5 |
| `size` is `inert` on the item's hosts | building-blocks 1.4; ticket 26 row 135, grilling question 15 |
| `value`, `max`, the name, the visible value, and the reading bar's `aria-hidden` are the consumer's | ADR 0003 point 3; Part 2 row 36; building-blocks 1.10, Names |
| The value is bound as an attribute (usage rule 3) | this spec's reading of the platform and the server renderer ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 179) |
| A **Visible value** for every determinate bar, asserted in every story | ADR 0015 point 4; [CONTEXT.md](../CONTEXT.md) |
| `YetiProgress` marks its host with `data-ngx-yeti-item-progress` and calls `injectYetiItemStyles('progress')` last | ADR 0045; ADR 0060 point 2; ticket 50 decisions 42 and 45 |
| `exportAs`; class name with no collision | building-blocks 1.3; ADR 0080 points 3 and 4; ticket 50 decision 10 |
| Entry point `ngx-yeti/progress` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only; no Module; no Aria or CDK piece | building-blocks 1.2; Part 2 row 36; ADR 0040 |
| One forced-colours rule on the native bar in `@layer ngx-yeti` | ledger A11Y-1e; map, Package CSS for accessibility; Part 2 row 36 |
| Tokens are the consumer's, including the reading bar's per-element `--yeti-progress-size` | ADR 0004 |
| Item file as a counted link in Yeti's order | ADR 0060 points 2 to 6 |
| 4.5:1 text contrast asserted for the name and the visible value, in both schemes | ADR 0015 point 3; ticket 50 decision 8 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

An upload with a known length, its value bound from state as an attribute, and its visible value as the name:

```html
<p id="upload-label">
  <span i18n>Upload</span> <span>{{ percent() }}%</span>
</p>
<progress
  yetiProgress
  [variant]="failed() ? 'alert' : 'primary'"
  [attr.value]="percent()"
  max="100"
  aria-labelledby="upload-label"
>
  {{ percent() }}%
</progress>
@if (failed()) {
  <div yetiAlert variant="alert" role="status" i18n>The upload failed.</div>
}
```

```ts
import { YetiProgress } from 'ngx-yeti/progress';
import { YetiAlert } from 'ngx-yeti/alert';

@Component({
  selector: 'app-upload',
  imports: [YetiProgress, YetiAlert],
  templateUrl: './upload.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Upload {
  readonly percent = input<number | null>(null);
  readonly failed = input(false);
}
```

While `percent()` is `null`, the bar is indeterminate; the label's text should then say what is happening rather than show an empty percentage (usage rule 5).

Wizard steps, after Yeti's docs: `<progress yetiProgress variant="success" size="lg" [attr.value]="step()" max="5" aria-label="Steps" [attr.aria-valuetext]="'Step ' + step() + ' of 5'">{{ step() }} of 5</progress>` beside a visible "Step 3 of 5".

A reading bar pinned at the top of an article, a hairline on the edge:

```html
<div yetiStack>
  <div
    yetiProgress
    scroll
    yetiStackChild
    sticky
    aria-hidden="true"
    style="--yeti-sticky-offset: 0; --yeti-progress-size: 2px"
  ></div>
  <article>...</article>
</div>
```

The imports are `YetiProgress`, `YetiStack`, and `YetiStackChild`. A page whose bars render inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['progress'] })`. A square-cornered theme, in the consumer's stylesheet after Yeti: `:root { --yeti-progress-radius: 0; }`. A gauge, not this item: `<meter min="0" max="100" [attr.value]="used()" aria-label="Disk used">{{ used() }}%</meter>`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/progress/progress.css`, loaded by `YetiProgress` as a counted link (section 13). The consumer writes nothing for the bar beyond the [setup](setup.md) spec's one-time configuration, which includes the package's accessibility stylesheet for A11Y-1e.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps `data-variant` to a hue's ladder (`:237-254`) and `data-size` to a text and space step (`:256-259`), and holds the `[data-sticky]` rule a pinned reading bar uses (`:332-343`); `tokens/components.css` declares `--yeti-progress-radius` (`:50`); `tokens/motion.css` declares the motion tokens and their reduced-motion values; `base/typography.css` sets the root `accent-color`.
3. **Cross-item rules:** none. `progress.css` names no other item, and no other item's CSS names `.progress`. A reading bar in a stack uses the stack's child directive and the always-loaded sticky rule, not a cross-item rule; the [stack](stack.md) spec's usage rule 5 notes that a ruled stack draws no line on a child that clips its overflow, "a progress bar" among them.
4. **Tokens:** reads the radius, thickness, track, motion, and default-variant and default-size tokens, plus the named ladders and steps through the value rules; writes none (section 2).
5. **What breaks without the item file:** a `progress` element renders as the browser's own bar, tinted by the root `accent-color`, at the engine's default size, and an indeterminate one shows the engine's own busy drawing; a reading bar is an empty `div` with no height and no fill, with no error. The `data-*` attributes still set their private tokens, which nothing reads.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled all 49 of Yeti's class names with Tailwind 4.3.3, and only `container`, `grid`, and `table` (plus the attribute name `hidden`) produced a utility (measured); `progress` produced none.

### Platform features to adopt when the browser target moves

- **Scroll-driven animations** (`animation-timeline: scroll()`): when every target engine has them, Yeti's `@supports` fallback stops hiding the reading bar anywhere. The package changes nothing; usage rule 2 and the layer-4 per-engine record follow the target.
- No other: `appearance: none` on `progress` and `:dir()` are inside Baseline 2025 (section 6).

### Single-page-application pieces relied on

None: the bar uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
