# Spec: spinner (component item)

Ticket: [88. Spec: spinner (component)](../issues/88-spec-spinner.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 38 and Part 1 (1.2, 1.3, 1.4, 1.6, 1.9 to 1.14), [Decide: the building-blocks map for every ngx-yeti item](../issues/25-decide-building-blocks-map.md) grilling question 13, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 141 and 142, [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) (decisions 2, 6, 8, 10, 18, 42, and 45), [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0010](../adr/0010-animation-is-yetis-css-with-class-form-enter-and-leave.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) (points 2 to 6 and 9), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). The item owns [ledger.md](../ledger.md) row A11Y-13. The [button](button.md) spec acquires this item's file for its busy ring. `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x). The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 190 to 194), and each is cited where it applies.

## Problem Statement

Yeti's `spinner` is "a turning ring in a hue, the size of the text, for waiting with no known end; a busy button shows the same ring after its label" (`Y/src/components/spinner/manifest.json`). It is for "a wait with no known end: a page section still fetching, a search running"; "when the length is known, use `progress`", and "when the wait belongs to a button, set `aria-busy="true"` on the button and the ring appears there by itself" (`docs.md`). It is one **Identity class**, `spinner`, and two **Attributes**: `data-variant` (the hue of the bright edge) and `data-size` (the ring is one em of the size's text step). It has no **Module**, no **Marker**, no **Event**, and no children. Yeti's example is an empty `span` inside a sentence: `<p><span class="spinner" role="status" aria-label="Loading"></span> Loading the latest posts</p>` (`example.html`).

An application developer using the package cannot write `class="spinner"` or `data-variant="success"`: a consumer writes no Yeti class or attribute, and the directive binds them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). Written by hand, `data-size="xl"` compiles and silently falls back to the medium ring; here it must fail to compile ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `spinner` **Item file** loaded while a spinner is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it a spinner is an empty inline box with no size and no ring, with no error.

`spinner.css` is also where the busy button's ring lives: `.button[aria-busy="true"]::after` shares the ring's rule (`spinner.css:5`, `:24`), so removing the file removes every busy button's ring (ticket 23, measured in three engines). The file therefore has two acquirers: this item's directive and the `button` item's ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) point 9; [button](button.md) section 13).

Three accessibility needs make the item more than a class, and none of them is in Yeti's CSS:

- **The role and the name are content the directive cannot read.** Yeti's docs ask for `role="status"` and an `aria-label` such as "Loading" on a spinner that stands alone, "so the wait is announced once and not again" (`docs.md`), and Part 2 row 38 keeps both the consumer's. The package must state them, show them in every example, and assert them in every story.
- **The ring turns without end.** It repeats `--yeti-motion-iterations` times, `infinite` unless the user prefers reduced motion ([Research: Yeti against WHATWG, WAI-ARIA, the APG](../issues/17-research-yeti-accessibility-and-standards.md) section 2.5, measured). Ledger row A11Y-13 reads this as the essential exception of WCAG 2.2.2 for a loading indicator; that reading holds only while the work runs, so the spinner must leave when the work ends.
- **The end of the wait is a status message.** The spinner says "waiting"; what the wait produced, or that it failed, is text the consumer writes (WCAG 4.1.3; building-blocks 1.10, Strings).

## Solution

One directive in the secondary entry point `ngx-yeti/spinner` ([building-blocks.md](../building-blocks.md) Part 2 row 38; 1.3):

- **`YetiSpinner`**, the **Item directive**, on `[yetiSpinner]`, `exportAs: 'yetiSpinner'`. It binds `spinner` as a static host class, and binds `data-variant` and `data-size` from the typed inputs `variant` (`YetiVariant`) and `size` (`YetiSizeControl`). It sets the static presence attribute `data-ngx-yeti-item-spinner` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), and calls `injectYetiItemStyles('spinner')` as the last statement of its constructor ([setup](setup.md); ticket 50 decisions 42 and 45), which acquires the item file on the server too and releases it on destroy.

The developer writes `<span yetiSpinner role="status" aria-label="Loading"></span>` where Yeti's docs write `<span class="spinner" role="status" aria-label="Loading"></span>`. Unset inputs render nothing, so Yeti's defaults (`primary`, `md`) apply from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1).

Everything else stays native and the consumer's (ADR 0003 point 3; Part 2 row 38): the element, its `role="status"`, its name, the visible text beside it, the status message when the wait ends, and the `@if` that inserts and removes it. The directive is **types only**: no listener, no render callback, no service of its own, and no DI beyond the styles service every item directive uses (Part 2, "Types only", with ticket 50 decision 18). So a spinner is right on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block, and it turns by CSS in all of them. Reduced motion is Yeti's (building-blocks 1.6 rule 4), and the package adds no pause control and no CSS for it (ledger A11Y-13).

## User Stories

1. As an application developer, I want to show Yeti's waiting ring with one directive attribute, so that I never write Yeti's `spinner` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="spinner"` and `data-*` attributes, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want a spinner with no inputs to be Yeti's default, a medium ring with a primary bright edge, so that the common case needs no configuration.
4. As an application developer, I want a `variant` input typed by Yeti's `variant` vocabulary, so that `variant="sucess"` fails to compile.
5. As an application developer, I want a `size` input typed by Yeti's `size-control` vocabulary, so that a spinner beside large text is a larger ring.
6. As an application developer, I want a static attribute such as `size="lg"` to type-check, so that I need no property binding for a constant.
7. As an application developer, I want an input I leave unset to render no attribute, so that Yeti's own default applies and the server HTML stays Yeti's minimal markup.
8. As an application developer, I want to bind `variant` from state, so that a spinner can change hue under zoneless change detection.
9. As an application developer, I want a static `size="lg"` on a `span` to do nothing beyond the input, so that HTML's `size` attribute has no effect on my spinner.
10. As an application developer, I want the ring sized to the text around it, so that a spinner inside a sentence sits on the line like a glyph.
11. As an application developer, I want to write `role="status"` and `aria-label` myself, as Yeti's docs do, so that I choose the words and translate them.
12. As an application developer, I want the usage rules stated (the host, the role and name, visible text beside the ring, removal when the work ends, the completion message, no static Yeti attributes, never inside a button), so that I use the spinner as Yeti intends.
13. As an application developer, I want to insert the spinner with `@if` when the work starts and remove it when the work ends, so that it is on the page only while something is waiting.
14. As an application developer, I want a waiting button to show its ring through `aria-busy` on the button, not through a spinner I put inside it, so that the button keeps one name and one state.
15. As an application developer, I want a busy button's ring to keep working when no standalone spinner is on the page, so that the two items never depend on each other's lifetime.
16. As an application developer, I want to change one turn's length and the ring's thickness through `--yeti-spinner-duration` and `--yeti-spinner-width`, so that a theme changes every spinner and every busy button with no input.
17. As an application developer, I want the spinner item file loaded when the first spinner renders and removed after the last leaves and no button needs it, so that I do not import `spinner.css` globally.
18. As an application developer, I want the item file in the server HTML when a server-rendered page has a spinner, so that the first paint is already a turning ring.
19. As an application developer, I want a spinner to turn with JavaScript off under SSR and prerendering, so that a server-rendered wait looks like a wait before any script runs.
20. As an application developer, I want hydration to change nothing on a spinner, so that I get no `NG05xx` error and no restart of the ring.
21. As an application developer, I want a spinner inside a `@defer (hydrate on ...)` block to keep its styles before and after the block hydrates, so that incremental hydration does not strip it.
22. As an application developer, I want a spinner inside a `hydrate never` block to keep its styles for as long as it is on the page, so that it is not unstyled when a live spinner elsewhere leaves.
23. As an application developer, I want to know that a spinner inside a client-only `@defer` block needs `spinner` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
24. As an application developer, I want a spinner as the `@placeholder` or `@loading` content of a `@defer` block, so that a deferred section shows a wait while it loads.
25. As an application developer using `withI18nSupport()`, I want a translated `aria-label` to hydrate without being re-rendered, so that localised pages keep the server's DOM.
26. As an application developer, I want a template reference (`#ring="yetiSpinner"`), so that the directive follows the package's `exportAs` rule.
27. As an application developer, I want to import the directive from `ngx-yeti/spinner`, so that a `@defer` block can split it with the rest of the item.
28. As an application developer, I want the input value types re-exported by name (`YetiVariant`, `YetiSizeControl`), so that I can type my own signals that feed the inputs.
29. As an application developer, I want to know that work with a known length is a `progress`, not a spinner, so that I pick the item that can show a value.
30. As a screen-reader user, I want a standalone spinner exposed as a status with a name such as "Loading", so that I know something is waiting.
31. As a screen-reader user, I want the wait announced once, not repeated while the ring turns, so that the page is not noisy.
32. As a screen-reader user, I want the end of the wait, or its failure, told to me as a status message, so that I know the content arrived without hunting for it.
33. As a screen-reader user, I want a spinner that only decorates text already in a status region kept out of the tree, so that I do not hear "Loading" twice.
34. As a sighted user, I want words beside the ring that say what is waiting, so that I know what the ring is for.
35. As a low-vision user, I want the ring's bright edge to stand out from the surface behind it, so that I can see that something is turning.
36. As a low-vision user, I want the words beside the ring to meet 4.5:1 contrast in the light and the dark scheme, so that I can read them.
37. As a colour-blind user, I want no meaning carried by the ring's hue alone, so that a red and a green spinner are told apart by their words.
38. As a user who prefers reduced motion, I want the ring to stand still, so that a long wait does not keep moving.
39. As a user who does not prefer reduced motion, I want the ring to stop when the work ends, because the consumer removes it, so that nothing on the page turns for no reason.
40. As a forced-colours user, I want to still see that the ring is waiting, so that the wait is not invisible to me.
41. As a keyboard user, I want the spinner never to be a Tab stop, so that a status indicator does not slow my way through the page.
42. As a package maintainer, I want the contract check to cover the two attributes and every value of their vocabularies, so that a pin move that adds a value fails before release.
43. As a package maintainer, I want the SSR smoke to assert the server HTML of a spinner and the item link, so that the first paint is proven.
44. As a package maintainer, I want one test proving that a live `YetiButton` keeps the `spinner` link after the last `YetiSpinner` leaves, and the reverse, so that the shared file's count is proven from both sides.
45. As a package maintainer, I want the play functions and e2e cases to follow Yeti's own `spinner.spec.js` cases, so that the package proves what Yeti proves.
46. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default fails no test for no reason.
47. As a package maintainer, I want the class name `YetiSpinner` checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/spinner/manifest.json`, `spinner.css`, `docs.md`, and `example.html`, in `Y/src/layouts/attributes.css`, `Y/src/tokens/components.css`, `Y/src/tokens/motion.css`, `Y/src/tokens/tokens.json`, and `Y/schema/vocabulary.json`, and in Yeti's test `Y/test/browser/components/spinner.spec.js` with its fixture `Y/test/browser/fixtures/components/spinner.html`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `spinner`, `component`, `Feedback` |
| `class` | `spinner` |
| `attributes` | `data-variant`: enum, vocabulary `variant` (`primary`, `secondary`, `success`, `warning`, `alert`, `danger`, `neutral`, `black`, `white`), default `primary`, "The hue of the bright edge." `data-size`: enum, vocabulary `size-control` (`sm`, `md`, `lg`), default `md`, "The ring is one em of the size's text step." |
| `classes`, `children`, `markers` | empty, empty, none |
| `tokens` | public: `--yeti-spinner-duration` ("One turn."), `--yeti-spinner-width` ("Thickness of the ring."), `--yeti-motion-iterations` ("How many times the ring turns; one under reduced motion."), the five `--yeti-color-primary*` stops and `--yeti-on-primary` (the default variant), `--yeti-text-md` and `--yeti-space-sm` (the default size); private: `--_yeti-variant`, `--_yeti-variant-subtle`, `--_yeti-size-text`, `--_yeti-variant-soft`, `--_yeti-variant-strong`, `--_yeti-variant-text`, `--_yeti-on-variant`, `--_yeti-size-space` |
| `a11y` | `requiredAttributes` empty; `keyboard` empty; notes: "Standing alone, give it role="status" and an aria-label such as "Loading", so the wait is announced once. Inside a button that carries aria-busy="true" it needs nothing: the button already says it is busy, and the ring appears by itself. Under reduced motion the ring stands still." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: individual transform properties, `color-mix()`; `guarded`: none |
| `since` | `7.0.0` |

How it works, in `@layer yeti.components`: `.spinner` and `.button[aria-busy="true"]::after` share one rule: `display: inline-block`, an inline and block size of `1em`, `flex: none`, a border of `--yeti-spinner-width` in `--_yeti-variant-subtle` with the block-start edge in `--_yeti-variant`, `border-radius: 50%`, and `animation: yeti-spin var(--yeti-spinner-duration) linear var(--yeti-motion-iterations)`. `.spinner` adds `font-size: var(--_yeti-size-text)` and `vertical-align: -0.15em`, so the ring is one em of the size's text step and sits on the line. `:not([data-variant])` and `:not([data-size])` supply the primary ladder and the `md` text and `sm` space steps only when the attribute is absent. The busy-button rule replaces the hue with `currentColor` (the ring at 30 % through `color-mix()`, the bright edge at full) and adds `content: ""`. `@keyframes yeti-spin` turns to `rotate: 1turn` (`spinner.css`).

The value rules for `data-variant` and `data-size` are in the **Always-loaded group** (`Y/src/layouts/attributes.css:237-254`, `:256-259`). `--yeti-spinner-duration` defaults to `0.8s` and `--yeti-spinner-width` to `0.15em` (`Y/src/tokens/components.css:52-53`). Under `prefers-reduced-motion: reduce`, `--yeti-spinner-duration` becomes `0.01ms` (`components.css:180`) and `--yeti-motion-iterations` becomes `1` (`Y/src/tokens/motion.css:28-29`): Yeti's comment explains that the component's own `infinite` would otherwise outrank the reset and "strobe" at a random phase every frame (`motion.css:8-13`). So the ring runs one 0.01 ms turn and stands still with its bright edge at the top. No item other than `button` is named by `spinner.css`, and no other item's CSS names `.spinner` (checked with `rg` over `Y/src/**/*.css`).

Attributes left to the consumer (ticket 26 rows 141 and 142 map only the two `data-*` attributes; everything else is native): `role="status"`, `aria-label` (or `aria-labelledby`), and, in the form where the ring only decorates text already in a status region, `aria-hidden="true"` (section 7; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 190).

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `spinner` | static host class on `[yetiSpinner]` (`YetiSpinner`) | always | ADR 0003 point 1; Part 2 row 38 |
| Attribute `data-variant` | the hue of the bright edge | input `variant`: `YetiVariant \| undefined`, bound `[attr.data-variant]`, `null` when unset | unset renders nothing; Yeti's `primary` applies. `variant` is not an HTML attribute | ticket 26 row 141 (R) |
| Attribute `data-size` | the ring's em | input `size`: `YetiSizeControl \| undefined`, `[attr.data-size]` | unset renders nothing; Yeti's `md` applies. Static form: `inert` (below) | ticket 26 row 142 (R); building-blocks 1.4 |
| `role="status"`, `aria-label`, `aria-labelledby`, `aria-hidden` | Yeti's docs ask for the role and a name on a standalone spinner | the consumer's; no role, name, or `decorative` input | usage rules 2 to 4 | building-blocks 1.10, Names; Part 2 row 38 |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Tokens `--yeti-spinner-duration`, `--yeti-spinner-width` | one turn, the thickness; also the busy button's ring | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--yeti-motion-iterations`, `--yeti-color-<hue>*`, `--yeti-on-<hue>`, `--yeti-text-*`, `--yeti-space-*` | iterations, ladders, steps | the consumer's | not applicable | ADR 0004 |
| Private tokens `--_yeti-variant*`, `--_yeti-on-variant`, `--_yeti-size-*` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-spinner=""` | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2 |
| Cross-item acquirer (package) | `.button[aria-busy="true"]::after` lives in `spinner.css` | `YetiButton` acquires `spinner` with `button`; this item acquires nothing else | while any `YetiButton` or `YetiSpinner` lives | ADR 0060 point 9; [button](button.md) section 13 |
| Injection token | not Yeti's | none: the item has no part that would read one | not applicable | building-blocks 1.9 |

The `inert` kind for `size` (building-blocks 1.4; ticket 26 row 142, "HTML `size` (form controls): `inert` on Yeti's hosts"): HTML's `size` acts on `input` and `select`, never on a spinner's host (usage rule 1). A static `size="lg"` stays on the host beside `data-size="lg"`, does nothing, and the directive binds nothing for it.

The input value types are Yeti's own, from the package's generated `yeti-types.ts`, re-exported by name and never redeclared ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5; ADR 0060 point 10). Each is a full vocabulary, so no `Extract` is needed.

**Module replaced:** none. Yeti's `spinner` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 38, "Yeti module: none"; [Research: Yeti's JavaScript modules and what Angular adds](../issues/03-research-yeti-javascript-and-angular.md), "spinner: CSS ring; `role="status"` by the author"). No module behaviour is kept, changed, or removed.

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads `--yeti-spinner-duration`, `--yeti-spinner-width`, and `--yeti-motion-iterations`; with no `variant`, the primary stops; with no `size`, `--yeti-text-md` and `--yeti-space-sm`; and through the always-loaded value rules whichever hue and step a set attribute names. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`. `--yeti-spinner-width` is in `em`, so it follows the ring's size; `--yeti-spinner-duration` and `--yeti-spinner-width` also reach every busy button's ring, because the two share one rule. A consumer who sets `--yeti-spinner-duration` also sets it to `0.01ms` inside `@media (prefers-reduced-motion: reduce)`, as Yeti does, or the reduced-motion ring runs one long visible turn (the same usage rule as ticket 50 decision 15 for `--yeti-attention-duration`). Hues, chroma, and the scale go only on `:root` (`Y/src/guides/theming.md:38`). **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- One directive, no parts. The ring has no child Yeti styles (manifest `children` empty), so the item provides no injection token (building-blocks 1.9).
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix").
- The busy button's ring is not a `YetiSpinner`. It is Yeti's `::after` on a `button` that carries the consumer's `aria-busy="true"`, and the [button](button.md) spec owns it; that spec's Out of Scope excludes a spinner element inserted into a busy button. The two directives share only the item file, through ADR 0060's count. Neither imports the other, and neither entry point depends on the other. [architecture-guide.md](../architecture-guide.md)'s entry-point rule gives "a spinner inside a button" as an example of a lightweight token for finding an optional parent; at this pin no directive of either item looks for the other, so no such token exists (usage rule 7 keeps the spinner out of the button).
- Shared input names (building-blocks 1.4, shared vocabularies): `variant` is `YetiVariant` and `size` is `YetiSizeControl` on every item that declares them (ticket 26). The any-element marker directives a consumer may write beside a spinner declare selector-named inputs only ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) kind G), so no name collides.
- The only injection is the root styles service of ADR 0060, reached through `injectYetiItemStyles('spinner')` ([setup](setup.md); ticket 50 decisions 18 and 45).
- Generated ids and the platform's relationship attributes: none. A spinner named with `aria-labelledby` points at an id the consumer writes, so the directive does not use [generated-ids](generated-ids.md).

### 4. API

| Member | `YetiSpinner` |
| --- | --- |
| Class name | not among the 46 names `yeti.d.ts` exports at the Pin (ticket 50 decision 10; ADR 0080's 2026-10-03 note), so it takes `Yeti`, not `NgxYeti` (ADR 0080 point 4) |
| Selector | `[yetiSpinner]` (Part 2 row 38) |
| `exportAs` | `yetiSpinner` (building-blocks 1.3) |
| Entry point | `ngx-yeti/spinner` (building-blocks 1.3; ADR 0011 clause 10) |
| Inputs | `variant: YetiVariant \| undefined` (Yeti default `primary`); `size: YetiSizeControl \| undefined` (`md`). No input default differs from Yeti's (ADR 0070 rule 1) |
| Host | static `class: 'spinner'`; static `data-ngx-yeti-item-spinner: ''`; `[attr.data-variant]` and `[attr.data-size]` from the inputs, `null` when unset. No binding for HTML `size` (`inert`), `role`, `tabindex`, or any ARIA attribute |
| Providers | none |
| Injection | the ADR 0060 styles service, through `injectYetiItemStyles` |
| Models, outputs, methods, listeners | none |
| Lifecycle | `injectYetiItemStyles('spinner')` is the constructor's last statement, after anything there that can throw (nothing does today); the helper releases through `DestroyRef` ([setup](setup.md); ticket 50 decisions 42 and 45) |

A static attribute type-checks as a string literal under `strictTemplates`, so `size="lg"` compiles and `size="xl"` does not (ADR 0070 rule 2).

**Usage rules** (numbered here and in the directive's JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiSpinner` on an empty, non-interactive inline element, `span` as Yeti's example writes it, placed in the line of text it belongs to. Never on a `button`, a link, or a form control, and never with content of its own: the host is a 1 em box whose border is the ring ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 194).
2. A spinner that stands alone carries `role="status"` and a name, `aria-label` or `aria-labelledby`, such as "Loading" (manifest `a11y.notes`; `docs.md`, Accessibility; Part 2 row 38; building-blocks 1.10, Names). Never write `aria-label` without the role: a `span` has the generic role, which prohibits a name.
3. Write visible text beside the ring that says what is waiting ("Loading the latest posts", Yeti's example), so the ring is never the only visual sign of the wait and its hue carries no meaning on its own (WCAG 1.4.1, 1.4.11) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 191).
4. Where the visible text is already inside a status region of the consumer's, the ring carries `aria-hidden="true"` and no role or name, so the wait is not announced twice ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 190).
5. Insert the spinner when the work starts and remove it when the work ends, with `@if` or by leaving a `@defer` block's `@loading` state. The ring repeats `--yeti-motion-iterations` times, which is `infinite` unless the user prefers reduced motion (`Y/src/tokens/motion.css:13`), and ledger A11Y-13's essential-activity reading of WCAG 2.2.2 holds only while the activity runs ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 192).
6. Announce the end of the wait, its result or its failure, as a status message the consumer writes, for example in an `alert` with `role="status"`, present before the message changes (WCAG 4.1.3; building-blocks 1.10, Strings). The spinner's own status says "waiting", not "done".
7. Never put `yetiSpinner` inside a `yetiButton` to show a busy button. Set the consumer's `aria-busy="true"` with `aria-disabled="true"` on the button and Yeti draws the ring after its label (manifest `a11y.notes`; `docs.md`; the [button](button.md) spec's usage rule 7).
8. Use `progress` for work with a known length; a spinner shows no value (`docs.md`, "When to use it").
9. Do not write `class="spinner"`, `data-variant`, `data-size`, or `data-ngx-yeti-item-spinner` statically on the host. The directive binds them, and hydration writes a static attribute back before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"; ADR 0070 consequences). A value newer than the pin goes through `$any` (`[variant]="$any('info')"`, ADR 0070).
10. Bind every input and the `@if` that shows the spinner from values that are the same on the server and the client, never from a browser-only read. The hydration constraints require the same DOM on both sides.
11. A consumer who sets `--yeti-spinner-duration` also sets it to `0.01ms` under `prefers-reduced-motion: reduce` (section 2, Tokens; after ticket 50 decision 15).
12. Import `YetiSpinner` in every component whose template writes the attribute. A **Forgotten import** with only static inputs renders an empty `span` with no ring and no error; only a bound input (`[variant]`) makes the compiler report it (NG8002), or a template reference naming the `exportAs` (NG8003) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `spinner` | Nearest in Angular Material: `MatProgressSpinner` |
| --- | --- | --- |
| Shape | an item directive on the consumer's empty `span`; the ring is a CSS border | a component, `mat-progress-spinner` and `mat-spinner` (`NC/src/material/progress-spinner/progress-spinner.ts:64`), with an SVG template |
| Role and name | the consumer's `role="status"` and `aria-label` (Yeti's docs) | `role="progressbar"`, `aria-valuemin`, `aria-valuemax`, and `aria-valuenow` only when determinate (`:67`, `:79-81`) |
| Mode | indeterminate only; a known length is `progress` | `mode`: `determinate` or `indeterminate`; `mat-spinner` is indeterminate (`:123`) |
| Size | `size` from three text steps; the ring is one em | `diameter` and `strokeWidth` in pixels (`:36-38`, `:75-78`) |
| Hue | `variant` from Yeti's nine values | `color` (M2 themes only, `:28-34`) |
| Focus | not focusable | `tabindex="-1"` "so screen readers will read the aria-label" (`:69-71`) |
| Reduced motion | Yeti's tokens: one 0.01 ms turn, then still | the animation slowed by 25 % (`progress-spinner.scss:60`, `progress-spinner.ts:125-126`) |
| Forced colours | none in Yeti (section 7; ticket 50 decision 193: no rule now) | the arc's stroke set to `CanvasText` under the CDK `high-contrast` mixin (`progress-spinner.scss:46-54`, `:103-105`) |
| `exportAs` | `yetiSpinner` | `matProgressSpinner` (`:65`) |

Borrowed: nothing in the first milestone; the forced-colours technique, a `CanvasText` arc, is the model if the layer-4 record shows a lost bright edge (ticket 50 decision 193). Not borrowed: the component and its SVG (Yeti's ring is the item, building-blocks 1.10, Native elements first), `role="progressbar"` (Yeti's docs and Part 2 row 38 make the role the consumer's and name `status`), `tabindex="-1"` (a status is not focused in Yeti's model), the determinate mode (`progress` covers it), and the slowed reduced-motion animation (reduced motion is Yeti's, building-blocks 1.6 rule 4).

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 38; building-blocks 1.2). The ring is CSS, and the role and the announcement are the platform's `status` role on the consumer's element. No Aria pattern exists for a spinner ([Research: Yeti against WHATWG, WAI-ARIA, the APG](../issues/17-research-yeti-accessibility-and-standards.md) section 4.17: "APG: none"; [Research: where Angular Aria's attribute directives fit Yeti's own markup](../issues/32-research-aria-directives-on-yetis-own-markup.md): "accepted under WCAG 2.2.2's exception, no behaviour to add"). No CDK piece is used: there is no id, focus, keyboard, observer, or direction read, and `LiveAnnouncer` is considered and not used (building-blocks 1.2), because the role is the consumer's markup and the package renders no strings (building-blocks 1.10, Strings). The ring is a circle, so direction does not change it.

Individual transform properties (`rotate`) and `color-mix()` are the manifest's unguarded features; both are inside Baseline 2025 ([research/browser-baseline-vs-yeti.md](../research/browser-baseline-vs-yeti.md), lines 482 and 488).

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none (above). Yeti's form maps to role `status` with the consumer's name ("`role="status" aria-label="Loading"` -> Chromium `status "Loading"`", ticket 17 section 4.17, measured in the tree). The directive adds no role, state, or property.
- **Announcement:** a `status` region is a polite live region. Whether a screen reader announces a status region inserted with a name and no text content, once, is not measured in any record (ticket 17 measured the tree, not screen readers); it is a manual release test (ADR 0015 point 7) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 190).
- **Keyboard and focus:** none. The host is not focusable and the directive adds no `tabindex` (building-blocks 1.10, Focus).
- **Names:** the consumer's `aria-label` or `aria-labelledby` (usage rule 2); a decorating ring is out of the tree through the consumer's `aria-hidden` (usage rule 4).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.1.1 Non-text Content | A standalone ring is a named status (usage rule 2); a decorating ring is hidden (usage rule 4). Every story's play function asserts, for each spinner, either a non-empty computed name with role `status`, or `aria-hidden="true"` with an ancestor or sibling status region holding the visible text. |
| 1.3.1 Info and Relationships | The role and name are the consumer's markup; the visible text beside the ring carries the same words (usage rule 3). `spinner--default` asserts the computed role and name. |
| 1.4.1 Use of Color | The hue is decoration; the visible text says what is waiting (usage rule 3). `spinner--variants` asserts every ring has visible text beside it. |
| 1.4.3 Contrast (Minimum) | The visible text is the page's own text. Play functions assert at least 4.5:1 for it with the exact WCAG formula on computed colours, in a light and a dark `color-scheme` wrapper (ADR 0015 point 3; ticket 50 decision 8). |
| 1.4.11 Non-text Contrast | The bright edge against the surface behind the ring: `spinner--default` asserts at least 3:1 for the default variant in both schemes, and `spinner--variants` records the ratio of every other variant on the surface it is shown on (ADR 0015 point 3) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 191). |
| 2.2.2 Pause, Stop, Hide | Ledger A11Y-13: the ring is movement that is part of an essential activity, a wait in progress, which the criterion excepts, and Yeti's reduced-motion tokens stop it after one 0.01 ms turn ([Decide: the building-blocks map for every ngx-yeti item](../issues/25-decide-building-blocks-map.md) grilling question 13; ticket 17 section 2.5, measured). The package adds no pause control and no CSS. The exception holds while the work runs, so usage rule 5 removes the ring when the work ends; the same reading covers the busy button's ring (the [button](button.md) spec's 2.2.2 row) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 192, the removal rule, with decision 180). |
| 2.3.3 Animation from Interactions | AAA, not required; the ring does not start from an interaction of the reader's. |
| 4.1.2 Name, Role, Value | The role and the name are the consumer's (usage rule 2). The directive binds no ARIA, so nothing it writes can contradict them. |
| 4.1.3 Status Messages | The wait is the consumer's `role="status"` (usage rule 2); its end is the consumer's status message (usage rule 6). The package adds no live region and no announcer ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 190, the form of the announcement). |

**Forced colours** (not an AA criterion of its own, ticket 17 section 2.6). Ticket 17 did not measure the spinner under forced colours. Forced colours replace border colours with a system colour, so the subtle ring and the bright edge are inferred to become one colour, and a turning ring of one colour looks still (inferred, not measured). The status, its name, and the visible text are unaffected. No ledger row and no package CSS now; layer 4 measures the ring's border colours under `forcedColors: 'active'` in Chromium and Firefox. If the bright edge is lost, a ledger row owned by `spinner` and one `@layer ngx-yeti` rule follow, after Material's `CanvasText` arc, on both selectors of Yeti's shared rule (`.spinner` and `.button[aria-busy="true"]::after`), as ticket 50 decision 88 set for the breadcrumbs ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 193).

**Ledger rows owned:** A11Y-13 ([ledger.md](../ledger.md); Part 2 row 38). The row's "What the package adds" ("None: ... the spec records this reading") stands; this section and usage rule 5 are the record. Verified *read*; tested by L4 (reduced-motion emulation: one iteration), as the row says.

### 8. Rendered HTML

Consumer markup, after Yeti's example and docs:

```html
@if (loading()) {
  <p><span yetiSpinner role="status" aria-label="Loading" i18n-aria-label></span> <span i18n>Loading the latest posts</span></p>
}

<p>Searching <span yetiSpinner size="lg" variant="neutral" role="status" aria-label="Searching"></span></p>
```

Server HTML and the hydrated DOM are the same. The first spinner carries `yetispinner=""`, `role="status"`, `aria-label="Loading"`, `class="spinner"`, and `data-ngx-yeti-item-spinner=""`, and no `data-variant` or `data-size`, so Yeti's primary hue and `md` text step apply. The second carries `size="lg"` (the static input attribute, inert), `variant="neutral"` (matched by no rule), `data-size="lg"`, `data-variant="neutral"`, the class, the presence attribute, and the consumer's role and name. No host carries a `tabindex`, an `id`, or an ARIA attribute from the package.

The server also writes the item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>components/spinner/spinner.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="spinner"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). Its rank is `Y/src/yeti.css:54`, after `progress` and before `accordion`. A page with a `yetiButton` has the same one link, acquired by both items (ADR 0060 point 9). The client adopts the link at bootstrap.

The delta from Yeti's docs markup: the consumer writes `yetiSpinner` and input names where the docs write `class="spinner"` and `data-*` names, and inserts and removes the spinner with `@if`.

### 9. Animation

Yeti's own, all CSS, with no package code (building-blocks 1.6; [ADR 0010](../adr/0010-animation-is-yetis-css-with-class-form-enter-and-leave.md)):

- **The turn:** `yeti-spin`, one `rotate: 1turn` per `--yeti-spinner-duration`, linear, `--yeti-motion-iterations` times, `infinite` by default. It runs from first paint, before hydration, and with JavaScript off. Nothing completes in the package's sense: there is no output and no timer.
- **Reduced motion:** the tokens collapse (`components.css:180`; `motion.css:28-29`): one 0.01 ms turn, then the ring stands still at its start angle (Yeti's test samples six frames with one angle).
- **Hydration:** the host is claimed, not re-created, so the running animation is not restarted (inferred from hydration reusing the server's nodes; layer 4 asserts it).
- **Enter and leave:** a spinner the consumer inserts or removes with `@if` may carry a class-form `animate.enter` or `animate.leave` of the consumer's or Yeti's `enter` utility (the [enter](enter.md) spec). The item link stays until Angular removes the last host, because removal waits for the DOM (ADR 0060 point 4). A server-rendered spinner never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes, the consumer's role and name, and the item link in `<head>` (section 8). Everything at first paint is a host binding or the consumer's template (ADR 0011 clause 1). Nothing is **Pre-hydration state**: no person and no Yeti module can change a spinner's attributes before hydration (ticket 26 rows 141 and 142, "the consumer's binding only").
- **Before hydration:** the directive creates no node, reads no layout, starts no timer or observer, and touches no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is the item acquisition, which ADR 0060 runs on the server too. The ring turns by CSS.
- **Full hydration:** the host is claimed as it is; bindings computed from the same values give the same attributes (usage rule 10); 0 style mutations (ADR 0060 point 5, measured for the mechanism). A server-rendered spinner whose `@if` is false on the client is a hydration mismatch, which usage rule 10 prevents.
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the spinner and its link; a dehydrated host holds the link while it is connected (ADR 0060 point 4). It turns until the block hydrates and the consumer's state removes it.
- **`@defer` placeholders:** a spinner in a `@placeholder` or `@loading` block is ordinary template content; on the server, Angular renders the placeholder of a non-hydrate `@defer`, so the spinner and its link are in the server HTML, and the block's main content replaces it on the client (Angular's documented `@defer` server behaviour; inferred for this item, asserted in layer 3). When the spinner leaves, ADR 0060 point 4 removes the link unless another spinner or a button holds it.
- **`hydrate never`:** the spinner is its server HTML and turns for as long as it is on the page; it never leaves on its own, because removing it needs Angular. ADR 0060 point 4 and ADR 0045's presence attribute keep its link while live spinners elsewhere leave; layer 4 asserts it. A wait inside such a block that never ends is a consumer error under usage rule 5.
- **Client-only `@defer`:** the item file is fetched when `YetiSpinner` is constructed, which can show an empty, unsized `span` for a few frames; the consumer closes the gap with `provideYetiStyles({ preload: ['spinner'] })` (ADR 0060 point 6; [setup](setup.md)). A page whose buttons may be busy in such a block already preloads `spinner` with `button` (the [button](button.md) spec).
- **Event replay:** the directive declares no listener, so nothing replays and it adds no `jsaction`.
- **`withI18nSupport()`:** the name is usually translated with `i18n-aria-label` on the host and the visible text with `i18n`. The directive adds no `i18n` block; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** inputs are `input()` signals read by host bindings, and the consumer's `@if` reads its own signal, so a changed input or a finished wait refreshes the DOM with no zone (map, Standing rulings, item 43; ADR 0070 rule 4).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): every server-rendered spinner is styled, named, and turning, and its visible text is readable. What is lost: the spinner never leaves, because ending the wait needs Angular, so a page that server-renders a wait it ends on the client shows the ring until hydration, and forever with JavaScript off. A prerendered page should therefore not render a spinner for work that only the client does, except as a `@defer` placeholder (usage rule 10). A client-only application gets no such promise.
- **Hydration boundary:** a spinner may sit in any boundary. An `aria-labelledby` target is the consumer's static id (ADR 0011 clause 7 concerns generated ids, which the item has none of). The spinner and the status message that replaces it should sit in one boundary so that they change in the same pass (usage rules 5 and 6).

### 11. Hydration constraints

The item complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; `data-variant` and `data-size` come from inputs, and the role, name, and `@if` from the consumer's state, which usage rule 10 keeps equal on both sides.
- **No direct DOM manipulation:** the directive writes nothing to the DOM outside host bindings. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directive changes no element. A `span` is phrasing content and is valid inside a `p` (usage rule 1).
- **`preserveWhitespaces`:** the directive has no template. The host is empty (usage rule 1), so white space inside it would be the consumer's; Yeti's ring ignores it.
- **No output branched on the platform:** none.
- **Static attributes the directive binds:** usage rule 9 keeps the consumer from writing them. The static `size` is `inert` and never bound, so hydration writes back the same value the server rendered.

### 12. Single-page application

None. The spinner has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). On a route change, a route's spinners leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-spinner]` host is connected and no `YetiButton` or `YetiSpinner` holds a count (ADR 0060 point 4; ADR 0045). A route-level loading indicator in the persistent shell outside the `router-outlet` keeps its link across routes and is the consumer's `@if` on the router's navigation state.

### 13. Item file

`yeti-css/css/components/spinner/spinner.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `YetiSpinner` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:54`, after `progress` and before `accordion`, the rank table of point 3), and removed after the live count reaches zero and no host carrying `data-ngx-yeti-item-spinner` is connected. The count is shared: `YetiButton` acquires the same item unconditionally with `button`, because the busy ring is this file's rule (ADR 0060 point 9; [button](button.md) section 13; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 109). So the link stays while any `YetiButton` or `YetiSpinner` lives. A server-rendered busy button inside a `hydrate never` block carries no spinner presence attribute, which the button spec documents and layer 4 records (ticket 50 decision 110).

The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the `[data-variant]` and `[data-size]` value rules and the tokens, among them the motion tokens), the package's accessibility stylesheet, and optionally `provideYetiStyles({ preload: ['spinner'] })`. Cross-item files acquired by this item: none (`spinner.css` names `.button` for the two used together, and "those rules simply match nothing once the other part is gone", `Y/src/guides/install.md:97`).

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attributes in the DOM, the item link, the ring's size relative to its text, that it turns, that it stands still under reduced motion, the computed role and name, and the contrast of the visible text and the bright edge. It never asserts a private field or how the styles service counts. No test depends on a public token's default value or a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): the size test compares the ring's box with its own computed `font-size`, as Yeti's `spinner.spec.js` does, the reduced-motion test asserts an iteration count of 1 and a still angle, never a duration value beyond Yeti's own "at most 0.01 ms" bound, and contrast asserts the criterion's ratio, never a colour value. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group and the package's accessibility stylesheet globally and the `spinner` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Every play function asserts, for each spinner, either role `status` with a non-empty computed name, or `aria-hidden="true"` inside or beside a status region; and visible text in the same line (usage rules 2 to 4; ADR 0015 point 4). Ring measurements pause the ring's animations at `currentTime = 0` first, because a turning square's bounding box grows by up to the square root of 2 (after Yeti's test). Story ids:

- `spinner--default`: Yeti's example, `<p><span yetiSpinner role="status" aria-label="Loading"></span> Loading the latest posts</p>`. Asserts `class="spinner"`, `data-ngx-yeti-item-spinner`, and no `data-variant` or `data-size`; no `tabindex`, `id`, or ARIA attribute from the package (a test-host variant without the consumer's role carries no role); the host is not focusable; the computed role is `status` and the name "Loading"; the ring's width and height equal its own `font-size` within 1 px; a corner radius is not `0px`; `animation-name` is `yeti-spin` and an animation is `running`; the bright edge meets 3:1 against the surface and the visible text 4.5:1, in a light and a dark `color-scheme` wrapper (ADR 0015 point 3; ticket 50 decision 8; section 7, open point).
- `spinner--sizes`: `sm`, `md`, `lg` in lines of matching text. Asserts each `data-size` value, each ring's width equal to its own `font-size`, the `lg` ring wider than the `md` one, and a static `size="lg"` rendering both `size="lg"` and `data-size="lg"` (the `inert` kind).
- `spinner--variants`: the seven hued variants on the page surface and `black` and `white` on suitable paints, each with visible text. Asserts each `data-variant` value and visible text per ring (usage rule 3), and 4.5:1 for the texts in both scheme wrappers; records, without asserting, the bright edge's ratio for each (section 7; ticket 50 decision 191).
- `spinner--inputs`: Storybook controls bind `variant` and `size`. The play function sets each, asserts the matching `data-*` value, resets it, and asserts the attribute is absent.
- `spinner--waiting`: a consumer status region and a button-less "Load" control: pressing it inserts the spinner with `@if`; finishing removes it and writes "Loaded 12 posts" into the status region. Asserts the spinner exists only while waiting, the status region is in the DOM before and after, and its text changes to the completion message (usage rules 5 and 6).
- `spinner--decorative`: the ring with `aria-hidden="true"` inside a consumer's `role="status"` paragraph whose text says "Loading". Asserts the ring is absent from the accessibility tree and the paragraph's computed role is `status` (usage rule 4).
- `spinner--defer-placeholder`: a spinner in a `@defer` block's `@loading` content. Asserts it is shown while the block loads and gone after.

### Layer 2: browser-level (`npx nx test <lib>`, `spinner.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiSpinner, { tagName: 'span' })`: the host has class `spinner` and `data-ngx-yeti-item-spinner`, and no `data-variant`, `data-size`, `size`, `role`, `tabindex`, or ARIA attribute; with `bindings` setting each input, the attributes follow after `whenStable()`, and binding `undefined` removes them.
- While a `YetiSpinner` fixture lives, one `<link data-ngx-yeti-styles="spinner">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- With a `YetiButton` fixture created alongside, destroying the `YetiSpinner` fixture keeps the `spinner` link, and destroying the button fixture afterwards removes it (the reverse of the [button](button.md) spec's case; ADR 0060 point 9).
- The directive adds no listener to its host and no attribute beyond the class, the presence attribute, and the two `data-*` attributes.

A small test host covers what `createDirective` cannot: the template reference `#ring="yetiSpinner"` resolves; a static `size="sm"` renders both attributes; the consumer's `role`, `aria-label`, `i18n-aria-label`, and own `class` on the host are kept as written; `@if` toggled on and off creates and destroys the directive and releases its count.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `spinner.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture of section 8's markup whose names and texts carry `i18n` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; each host renders `class="spinner"`, `data-ngx-yeti-item-spinner`, the bound `data-*` attributes, the inert static `size`, the consumer's `role="status"` and `aria-label`, and no `data-*` for an unset input; a `@defer` block with a spinner in `@placeholder` renders the spinner; `<head>` holds one item link with `data-ngx-yeti-styles="spinner"`, `data-beasties-skip`, and an `href` ending `components/spinner/spinner.css?v=<pin>`; a fixture with both a spinner and a `yetiButton` still holds exactly one `spinner` link; no element carries a `jsaction` from the package.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `spinner` has `YetiSpinner`; `data-variant` and `data-size` have inputs whose unions equal the manifest's vocabularies `variant` and `size-control`; the item has no markers and no events. A pin move that adds an attribute or a value fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids:

- **Reduced motion (A11Y-13):** on `spinner--default` with `emulateMedia({ reducedMotion: 'reduce' })`, `animation-duration` is at most 0.01 ms and `animation-iteration-count` is `1`; after the page has painted twice, six animation frames read the same computed `rotate` (after Yeti's test, which explains why the iteration count, not the duration, is what stops the strobe).
- **Without the preference:** on `spinner--default`, the ring's animation is `running` and two frames 100 ms apart read different angles.
- **Forced colours:** on `spinner--default` under `emulateMedia({ forcedColors: 'active' })` in Chromium and Firefox, record the computed block-start border colour and another edge's, and a screenshot; asserted only once a rule is added (ticket 50 decision 193).
- **Reflow and contrast:** at a 320 px viewport no story overflows horizontally (1.4.10); `spinner--variants` repeats the visible-text contrast assertions with `emulateMedia({ colorScheme: 'light' })` and `'dark'`.

Fixture-app half, built with `outputMode: 'server'`, with a `/spinner` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route renders section 8's markup with `loading()` true on the server, and a `@defer (on idle)` block with a spinner placeholder:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`; every spinner's attributes after hydration equal the server HTML's; the ring's animation is not restarted at hydration (its `currentTime` keeps growing across hydration);
- with JavaScript disabled, the spinner is styled, its animation is running, its name and visible text are present, and `@axe-core/playwright` with the six tags reports no violation;
- a spinner inside a `hydrate never` block keeps its item link and its computed size after every live spinner and button on the page is removed (ADR 0060 point 4; ADR 0045);
- a spinner inside a client-only `@defer` block with `spinner` in the preload list shows no unstyled frame;
- navigating from the spinner route to a route with no spinner and no button removes the item link, and navigating back re-inserts it; navigating to a route with a `yetiButton` and no spinner keeps it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically). The screen-reader announcement of an inserted status (section 7) is a manual release test (ADR 0015 point 7).

Prior art: Yeti's `example.html` and `docs.md` for the stories, and its `test/browser/components/spinner.spec.js` with the fixture `test/browser/fixtures/components/spinner.html` for the one-em ring, the running animation, the larger `lg` ring, reduced motion, and axe; the busy-button case there belongs to the [button](button.md) spec's `button--busy`; ticket 17's motion measurements (`out/behave.json`, `motion-*` keys); ticket 23's `probe.mjs` for the busy ring's dependence on `spinner.css`; the [progress](progress.md) spec's reduced-motion and indeterminate cases; ticket 18's fixture app for the `hydrate never` case; ADR 0060's prototype for the server HTML and the item link.

## Out of Scope

- The busy button's ring, its `aria-busy` and `aria-disabled`, its acquisition of this item file, and its `hydrate never` residue: the [button](button.md) spec's.
- A spinner element inside a busy button (usage rule 7).
- A determinate mode, a `value` input, `role="progressbar"`, or ARIA value attributes: work with a known length is `progress` (usage rule 8; section 5).
- A `role`, `label`, or `decorative` input, a default name, or any text the package renders (building-blocks 1.10, Names and Strings); the consumer writes them (usage rules 2 to 4).
- A live region, `LiveAnnouncer`, or an announcement of the end of the wait (usage rule 6).
- A pause control, a maximum iteration count, or package CSS for motion (ledger A11Y-13; usage rule 5).
- A forced-colours rule in the first cut (section 7) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 193).
- An input per token, a thickness or speed input, or a hue outside Yeti's `variant` vocabulary (ADR 0004; ADR 0070 rule 2).
- Any check that the host is empty, that a standalone spinner has a role and name, or that it is not inside a button. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive on `[yetiSpinner]` with `variant` and `size`; no part directive | building-blocks Part 2 row 38; ticket 26 rows 141 and 142; [Decide: the spec list](../issues/11-decide-spec-list.md) |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by Yeti's `YetiVariant` and `YetiSizeControl`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2; ADR 0080 point 5 |
| `size` is `inert` on the item's hosts | building-blocks 1.4; ticket 26 row 142 |
| `role="status"`, the name, the visible text, and the completion message are the consumer's | Part 2 row 38; building-blocks 1.10, Names and Strings; ADR 0003 point 3 |
| The empty-`span` host, the visible text, and the decorative form (usage rules 1, 3, 4) | this spec's reading of Yeti's example and docs ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 190, 191, and 194) |
| WCAG 2.2.2: the essential exception, Yeti's reduced motion, no package code; the consumer removes the ring when the work ends | ledger A11Y-13; ticket 25 grilling question 13; building-blocks 1.6 rule 4; usage rule 5 (ticket 50 decision 192, decided with the [progress](progress.md) spec's indeterminate stripes, decision 180) |
| `YetiSpinner` marks its host with `data-ngx-yeti-item-spinner` and calls `injectYetiItemStyles('spinner')` last | ADR 0045; ADR 0060 point 2; ticket 50 decisions 42 and 45 |
| The item file is shared with `YetiButton`'s unconditional acquisition | ADR 0060 point 9; [button](button.md) section 13 |
| `exportAs`; class name with no collision | building-blocks 1.3; ADR 0080 points 3 and 4; ticket 50 decision 10 |
| Entry point `ngx-yeti/spinner` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only; no Module; no Aria or CDK piece | building-blocks 1.2; Part 2 row 38; ADR 0040 |
| Tokens are the consumer's; a custom duration is collapsed under reduced motion by the consumer | ADR 0004; ticket 50 decision 15 |
| Item file as a counted link in Yeti's order | ADR 0060 points 2 to 6 |
| 4.5:1 text contrast and 3:1 for the bright edge, in both schemes | ADR 0015 point 3; ticket 50 decision 8 (the 3:1 assertion: ticket 50 decision 191) |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A section that loads, with the wait announced by the ring and the result announced by a status region of the consumer's:

```html
@if (loading()) {
  <p>
    <span yetiSpinner role="status" aria-label="Loading" i18n-aria-label></span>
    <span i18n>Loading the latest posts</span>
  </p>
}
<div yetiAlert variant="success" role="status">
  @if (loaded()) {
    <ng-container i18n>Loaded {{ count() }} posts.</ng-container>
  }
</div>
```

```ts
import { YetiSpinner } from 'ngx-yeti/spinner';
import { YetiAlert } from 'ngx-yeti/alert';

@Component({
  selector: 'app-posts',
  imports: [YetiSpinner, YetiAlert],
  templateUrl: './posts.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Posts {
  readonly loading = input(false);
  readonly loaded = input(false);
  readonly count = input(0);
}
```

The status region stays in the DOM before its text changes, so the completion is announced (usage rule 6); the spinner leaves when the work ends (usage rule 5).

A decorating ring inside text that is already a status: `<p role="status"><span yetiSpinner aria-hidden="true"></span> Searching</p>` (usage rule 4). A deferred section's wait: `@defer (on viewport) { <app-comments /> } @placeholder { <p><span yetiSpinner role="status" aria-label="Loading comments"></span> Loading comments</p> }`. A busy button, not this item: `<button yetiButton type="submit" [attr.aria-busy]="saving()" [attr.aria-disabled]="saving()">Saving</button>` (usage rule 7). A slower, thinner ring for every spinner and busy button, in the consumer's stylesheet after Yeti: `:root { --yeti-spinner-duration: 1.2s; --yeti-spinner-width: 0.1em; } @media (prefers-reduced-motion: reduce) { :root { --yeti-spinner-duration: 0.01ms; } }` (usage rule 11). A page whose spinners render inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['spinner'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/spinner/spinner.css`, loaded by `YetiSpinner` and by `YetiButton` as one counted link (section 13). The consumer writes nothing for the spinner beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps `data-variant` to a hue's ladder (`:237-254`) and `data-size` to a text and space step (`:256-259`); `tokens/components.css` declares `--yeti-spinner-duration` and `--yeti-spinner-width` (`:52-53`) and their reduced-motion value (`:180`); `tokens/motion.css` declares `--yeti-motion-iterations` and its reduced-motion value.
3. **Cross-item rules:** `spinner.css` holds `.button[aria-busy="true"]::after`, the busy button's ring, which is why `YetiButton` acquires this file (ADR 0060 point 9). No other item's CSS names `.spinner`.
4. **Tokens:** reads the duration, width, iterations, and default-variant and default-size tokens, plus the named ladders and steps through the value rules; writes none (section 2).
5. **What breaks without the item file:** a spinner is an empty inline `span` with no size, no border, and no turn, with no error, and every busy button loses its ring while keeping its dim and progress cursor. The `data-*` attributes still set their private tokens, which nothing reads.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled all 49 of Yeti's class names with Tailwind 4.3.3, and only `container`, `grid`, and `table` (plus the attribute name `hidden`) produced a utility (measured); `spinner` produced none. Tailwind's own `animate-spin` utility is a different name and does not touch `.spinner`.

### Platform features to adopt when the browser target moves

None that changes this item: individual transforms and `color-mix()` are inside Baseline 2025 (section 6). Nothing else was checked against web-features data for this spec.

### Single-page-application pieces relied on

None: the spinner uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
