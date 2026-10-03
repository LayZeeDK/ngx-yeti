# Spec: dialog (component item)

Ticket: [81. Spec: dialog (component)](../issues/81-spec-dialog.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 31 and Part 1 (1.3, 1.4, 1.5, 1.6, 1.8, 1.9, 1.10, 1.11, 1.13, 1.15), [ADR 0021](../adr/0021-dialog-is-a-directive-on-the-native-dialog.md) with its notes of 2026-10-02 and 2026-10-03 (the open-state ruling, map, Standing rulings: "Never bind; read once (Recommended)"), [Prototype: subclassing Aria's directives, and `[open]` against `[attr.open]`](../issues/34-prototype-subclassing-aria-and-open-binding-forms.md) (a bound `open` hides a modal dialog opened before hydration), [ADR 0016](../adr/0016-light-dismiss-is-the-platforms-plus-focus-out-and-tooltip-escape.md), [ADR 0043](../adr/0043-light-dismiss-additions-are-host-listeners-not-cdk-services.md), [ADR 0041](../adr/0041-closing-on-navigation-is-a-per-instance-subscription.md) through the [navigation-close](navigation-close.md) spec, the [events](events.md) spec ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 3: `opened` and `closed` fire after the transition), the [generated-ids](generated-ids.md) spec, [ADR 0010](../adr/0010-animation-is-yetis-css-with-class-form-enter-and-leave.md), [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0013](../adr/0013-parts-name-their-targets-by-reference.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md), [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) row 114, [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 2, 5, 6, 8, 10, and 42, [ledger.md](../ledger.md) rows A11Y-8 and A11Y-15 and the forced-colours rows A11Y-1a to A11Y-1f, [upstream-bugs.md](../upstream-bugs.md) A3, [Prototype: Yeti's modules in a single-page Angular app](../issues/20-prototype-yeti-in-single-page-apps.md), and the [button](button.md) spec (the opener's look). `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x); `NGP/` is `github.com/angular/angular/packages/` at `5db6fc4453` (22.2.0); `APG/` is the aria-practices clone at `3f094fd`. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 92 and 146 to 154), and each is cited where it applies.

## Problem Statement

Yeti's `dialog` is "the native dialog element as a modal, opened by a button whose commandfor names it, with the page behind it inert and focus held inside" (`Y/src/components/dialog/manifest.json:6`). It is one **Identity class**, `dialog`, on a `<dialog>`, with one **Attribute**, `data-max`, which caps its width from Yeti's `width` scale. The platform does the core work: a `button` with `commandfor="<id>"` and `command="show-modal"` calls `showModal()` with no script, which makes the page inert, keeps focus inside, closes on Escape, and paints a `::backdrop`; a button inside `<form method="dialog">` closes it with no script (`Y/src/components/dialog/docs.md:7-9`). Yeti's **Module** `dialog.js` adds two things the platform lacks: a **Backdrop press** closes the dialog, and focus returns to the opener, because WebKit does not focus a clicked button. It also dispatches `yeti:open` and `yeti:close` (`dialog.js:1-75`).

An application developer using the package cannot use any of that as Yeti documents it:

- A consumer writes no Yeti class, `data-*` attribute, `commandfor`, or `command`; directives render them ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1, 2, and 5). Written by hand, `commandfor="delte-project"` fails silently, and a `data-max="medium"` silently falls back to Yeti's default; here both must fail to compile ([ADR 0013](../adr/0013-parts-name-their-targets-by-reference.md); [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)).
- The package replaces `dialog.js` and loads no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md)), so the Backdrop press and the focus return must come from the directive, per instance, in every rendering mode.
- `(yeti:close)` does not compile in an Angular template, and the package dispatches no DOM event of its own ([events](events.md)). The developer needs typed outputs and a two-way open state.
- Binding the dialog's `open` breaks it. A bound `open`, as a property or an attribute, is written again at hydration: on a modal dialog the user opened before hydration, the dialog is left hidden while the page stays blocked, and Escape does not recover it (ticket 34, measured in three engines). The package must never bind `open`, yet still offer `isOpen`.
- In a routed application, a shell dialog with a `routerLink` inside it stays open over the new route and leaves the page inert (ticket 20, measured in three engines).
- The `dialog` **Item file** must be loaded while a dialog is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it the dialog has the browser's default border and no backdrop wash, with no error.

## Solution

Two directives in the secondary entry point `ngx-yeti/dialog` ([building-blocks.md](../building-blocks.md) Part 2 row 31; 1.3):

- **`YetiDialog`**, the **Item directive**, on `dialog[yetiDialog]`, `exportAs: 'yetiDialog'`. It binds `dialog` as a static host class and `data-max` from a typed `max` input (`YetiWidth`), sets the static presence attribute `data-ngx-yeti-item-dialog` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), renders the host's `id` (the consumer's, else a generated one), and loads the item file. It owns an `isOpen` model, `opened` and `closed` **Completion outputs**, `open()` and `close()` methods, and a `closePredicate` veto input. Its host listeners do what `dialog.js` did: `command` records the opener, `close` returns focus to it, and `pointerdown` with `click` close the dialog on a Backdrop press. It closes on navigation through `injectCloseOnNavigation` ([ADR 0041](../adr/0041-closing-on-navigation-is-a-per-instance-subscription.md)).
- **`YetiDialogOpener`**, a **Free behaviour directive**, on `button[yetiDialogOpener]`, `exportAs: 'yetiDialogOpener'`. It takes a template reference to the dialog and renders `commandfor` with the dialog's id and `command="show-modal"`, so the dialog opens before hydration and with JavaScript off ([ADR 0021](../adr/0021-dialog-is-a-directive-on-the-native-dialog.md) point 1). It renders no `aria-expanded` (point 4). The opener's look is `yetiButton`, written beside it ([button](button.md) spec).

The developer writes `<button yetiButton type="button" [yetiDialogOpener]="confirm">` and `<dialog yetiDialog #confirm="yetiDialog" aria-labelledby="...">` where Yeti's docs write `<button class="button" commandfor="..." command="show-modal">` and `<dialog class="dialog" id="..." aria-labelledby="...">`. The platform opens, holds focus, closes on Escape, and paints the backdrop. The directive observes and adds state; it never owns activation with a `click` handler ([building-blocks.md](../building-blocks.md) 1.8; [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) clause 2).

## User Stories

1. As an application developer, I want to turn my own `<dialog>` into a Yeti dialog with one directive attribute, so that I never write `class="dialog"` by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="dialog"` and `data-max`, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want to cap the dialog's width with a `max` input typed by Yeti's `width` vocabulary, so that `max="medium"` fails to compile.
4. As an application developer, I want an unset `max` to render no attribute, so that Yeti's default width (`md`) applies.
5. As an application developer, I want to relate an opener to its dialog by a template reference, so that a misspelt target fails to compile instead of failing silently.
6. As an application developer, I want the opener to render `commandfor` and `command="show-modal"`, so that the dialog opens with no script, before hydration, and with JavaScript off.
7. As an application developer, I want the dialog's `id` generated when I write none, so that I never invent ids for dialogs inside `@for` rows.
8. As an application developer, I want my own static `id` on the dialog to win, so that a deep link or a test can address it.
9. As an application developer, I want generated ids to be the same in the server HTML and after hydration, so that the opener works before, during, and after hydration.
10. As an application developer, I want the opener's look to come from `yetiButton` beside it, so that any button variant can open a dialog.
11. As an application developer, I want a two-way `isOpen` model, so that my component can open and close the dialog from state.
12. As an application developer, I want `open()` and `close()` on the directive through `#d="yetiDialog"`, so that a handler can open or close it.
13. As an application developer, I want an `opened` output once the dialog has finished arriving, so that I can act on settled UI.
14. As an application developer, I want a `closed` output once the dialog has finished leaving, however it was closed, so that I can react to Escape, the backdrop, a form button, or my own code alike.
15. As an application developer, I want `opened` and `closed` to carry nothing, so that the binding is as simple as Yeti's `yeti:open` and `yeti:close`.
16. As an application developer, I want a press that starts and ends on the backdrop to close the dialog, so that it behaves as Yeti's module does in every engine, Safari included.
17. As an application developer, I want a drag that starts inside the dialog and ends on the backdrop not to close it, so that selecting text never dismisses it.
18. As an application developer, I want a keyboard activation never to count as a Backdrop press, so that pressing Enter on a control near the edge does not close the dialog.
19. As an application developer, I want a `form method="dialog"` button to close the dialog with no script, so that Yeti's no-script close keeps working.
20. As an application developer, I want a `closePredicate` that can refuse Escape and the backdrop, so that a dialog with unsaved changes can ask before it closes.
21. As an application developer, I want a refused Escape to stay refused when the user presses Escape repeatedly, so that the platform does not close the dialog anyway.
22. As an application developer, I want my own `form method="dialog"` button and my own `close()` call never to be vetoed, so that I always have a way out.
23. As an application developer, I want a dialog in my persistent shell to close when a `routerLink` inside it navigates, so that the new route is not inert behind it.
24. As an application developer, I want a dialog the user opened before hydration to stay open and usable when the application hydrates, so that hydration never hides a dialog while the page stays blocked.
25. As an application developer, I want the dialog's open state found at creation to emit nothing, so that a page that hydrates with the dialog open does not fire `opened` on load.
26. As an application developer, I want a dialog opened by my own `showModal()` call to report through `isOpen` and `opened` too, so that every open path is covered.
27. As an application developer, I want a dialog opened from inside another dialog to return focus to its own opener, so that nested dialogs keep the user's place.
28. As an application developer, I want the `dialog` item file loaded when the first dialog renders and removed after the last leaves, so that I do not import `dialog.css` globally.
29. As an application developer, I want the item file in the server HTML when a server-rendered page has a dialog, so that an opener clicked before hydration opens a styled dialog.
30. As an application developer, I want the dialog to work with JavaScript off under SSR and prerendering, so that it opens, closes on Escape, and closes from a form button before any script runs.
31. As an application developer, I want hydration to change nothing on the dialog or its opener, so that I get no `NG05xx` error.
32. As an application developer, I want a dialog inside a `@defer (hydrate on ...)` block to open natively before the block hydrates and gain its additions after, so that incremental hydration loses nothing permanently.
33. As an application developer, I want to know what a dialog inside a `hydrate never` block keeps and loses, so that I do not rely on the package there.
34. As an application developer, I want to know that a dialog closed before hydration emits no `closed`, so that I do not expect one (upstream bug A3).
35. As an application developer using `withI18nSupport()`, I want translated dialog content to hydrate without being re-rendered, so that localised pages keep the server's DOM.
36. As an application developer using zoneless change detection, I want `isOpen`, `opened`, and `closed` to refresh my views, so that the dialog works without zone.js.
37. As an application developer, I want template references (`#d="yetiDialog"`, `#o="yetiDialogOpener"`), so that both directives follow the package's `exportAs` rule.
38. As an application developer, I want to import both directives from `ngx-yeti/dialog`, so that a `@defer` block can split the dialog with the rest of its item.
39. As an application developer, I want the usage rules stated (name the dialog, never write `open`, keep a visible close control, where initial focus goes, one hydration boundary), so that I use the dialog as Yeti and the APG intend.
40. As an application developer who knows Angular Material, I want to know how `yetiDialog` maps to `MatDialog`'s options, so that I can predict it.
41. As a keyboard user, I want focus to move into the dialog when it opens and back to the button that opened it when it closes, in every engine, so that I keep my place on the page.
42. As a keyboard user, I want Escape to close the dialog, so that I can leave it without a pointer.
43. As a keyboard user, I want Tab never to reach the page behind the dialog, so that I cannot act on content I cannot see.
44. As a screen-reader user, I want the dialog announced as a modal dialog with its heading as its name, so that I know where I am.
45. As a screen-reader user, I want the page behind the dialog to be inert, so that I cannot wander out of it.
46. As a screen-reader user, I want the opener to be announced as a plain button, with no stale expanded state, so that I hear what HTML maps for it.
47. As a pointer user on a small screen, I want the dialog narrower than the viewport by a gutter, so that I never scroll sideways to reach it.
48. As a user who prefers reduced motion, I want the dialog to arrive and leave without motion, so that it does not move on screen.
49. As a forced-colours user, I want the dialog's edge to stay visible, so that I can tell it from the page behind it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 152).
50. As a package maintainer, I want the contract check to cover the class, `data-max` and its vocabulary, and both events, so that a pin move that adds a value, an attribute, or an event fails before release.
51. As a package maintainer, I want the SSR smoke to assert the server HTML of an opener and its dialog and the item link, so that the no-script opening is proven.
52. As a package maintainer, I want an e2e case that opens the dialog before hydration and checks it stays visible and modal after hydration, so that ticket 34's failure never comes back.
53. As a package maintainer, I want the module's own test cases ported from Yeti's `dialog.spec.js`, so that the package proves what Yeti proves.
54. As a package maintainer, I want the Tab behaviour measured in three engines, so that ledger row A11Y-8 rests on a measurement.
55. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default fails no test for no reason.
56. As a package maintainer, I want the class names `YetiDialog` and `YetiDialogOpener` checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/dialog/manifest.json`, `dialog.css`, `dialog.js`, `docs.md`, and `example.html`, and in `Y/src/layouts/attributes.css`, `Y/src/tokens/components.css`, `Y/src/tokens/tokens.json`, and `Y/schema/vocabulary.json`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `dialog`, `component`, `Forms and Actions` |
| `class` | `dialog` |
| `attributes` | `data-max`: enum, vocabulary `width` (`2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`), default `md`, "The widest the dialog may grow, from the width scale; it is always narrower than the viewport by a gutter." |
| `classes`, `markers` | empty; none |
| `children` | `> *` (min 1): "The contents: a heading that names the dialog, then whatever it is for." `> footer` (0 to 1): "The buttons, at the end edge. A button inside a form with method=\"dialog\" closes it with no script." |
| `tokens` | public: `--yeti-dialog-surface`, `--yeti-dialog-radius`, `--yeti-dialog-padding`, `--yeti-dialog-backdrop`, `--yeti-shadow-md`, `--yeti-space-md`, `--yeti-color-text`, `--yeti-width-md`, `--yeti-space-sm`, `--yeti-duration-fast`, `--yeti-ease`; private: `--_yeti-max` |
| `a11y` | `requiredAttributes` empty; keyboard: Escape "Closes the dialog.", Tab "Cycles inside the dialog, since the rest of the page is inert."; notes: name the dialog with `aria-labelledby`; the platform makes the page inert, holds focus, and closes on Escape; `dialog.js` adds the Backdrop press and the focus return |
| `js` | `dialog.js`, optional; events `yeti:open` ("Dispatched on the dialog once the browser has opened it from a commandfor button") and `yeti:close` ("Dispatched on the dialog when it closes, however it was closed"), no `detail` |
| `support` | `unguarded`: invoker commands, `dialog`, `::backdrop`, `@starting-style`, `transition-behavior: allow-discrete`; `guarded`: empty |
| `since` | `7.0.0` |

How it looks, in `@layer yeti.components` (`dialog.css:5-42`): `.dialog` caps its inline size at `min(var(--_yeti-max), 100% - 2 * var(--yeti-space-md))`, has no border, the dialog tokens' padding, radius, and surface, the text colour, and `--yeti-shadow-md`. Without `data-max`, `--_yeti-max` is `--yeti-width-md`. `::backdrop` takes `--yeti-dialog-backdrop`. `> footer` is a wrapping flex row at the end edge. Arriving and leaving: `opacity`, `translate`, and `display` and `overlay` with `allow-discrete` transition over `--yeti-duration-fast`; a closed dialog and its backdrop have opacity 0, and `@starting-style` starts an open one 1rem lower and transparent. The `data-max` value rules are in the **Always-loaded group** (`Y/src/layouts/attributes.css:201-207`), as are the reset's exemption of `dialog` from the universal margin rule (`Y/src/base/reset.css:11-12`) and the prose spacing of a dialog's children (`Y/src/base/prose.css:7`, `:12`). `--yeti-dialog-surface` defaults to `--yeti-color-surface-raised`, `--yeti-dialog-radius` to `--yeti-radius-lg`, `--yeti-dialog-padding` to `--yeti-space-lg`, and `--yeti-dialog-backdrop` to black at 60 % (`Y/src/tokens/components.css:80-87`); quoted at the pin as [ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md) allows, never asserted.

Attributes left to the consumer: `aria-labelledby` on the dialog, pointing at its heading (manifest `a11y.notes`; building-blocks 1.10, Names), and `type` on the opener, written `type="button"` as Yeti's example does (1.10, native elements first). `data-max` is ticket 26 row 114.

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `dialog` | static host class on `dialog[yetiDialog]` (`YetiDialog`) | always | ADR 0003 point 1; Part 2 row 31 |
| Attribute `data-max` | the widest the dialog may grow | input `max` on `yetiDialog`: `YetiWidth \| undefined`, bound `[attr.data-max]`, `null` when unset | unset renders nothing; Yeti's `md` applies. Static form: `inert`. HTML `max` belongs to form controls and does nothing on `dialog`, so a static `max="sm"` stays on the host beside `data-max="sm"` and the directive binds nothing for it | ticket 26 row 114 (R); building-blocks 1.4 |
| Children `> *`, `> footer` | contents; the actions | no directive; the consumer's elements | not applicable | ticket 26 (no row); building-blocks 1.1 |
| Native state `open` | set by `showModal()` and `close()` | never bound, as a property or an attribute; read once when `YetiDialog` is created, then followed through the `toggle` and `close` events; the `isOpen` model reflects it | not applicable | ADR 0021 note of 2026-10-03; map, Standing rulings, Open state; ticket 34 |
| Event `yeti:open` | on the dialog once open | output `opened`, `void`, a Completion output emitted after the arrival transition | not applicable | [events](events.md) section 2; ticket 50 decision 3 |
| Event `yeti:close` | on the dialog on every close | output `closed`, `void`, a Completion output emitted after the leaving transition | not applicable | events section 2; ticket 50 decision 3 |
| Two-way state | not Yeti's | model `isOpen: boolean`, `isOpenChange` | `false` until the element is read | building-blocks 1.3, 1.4; ADR 0021 point 1 |
| `id` on the dialog | the author's, in Yeti's docs | `[attr.id]` from `injectYetiId('dialog')`: the consumer's static `id`, else the adopted server id, else `ngx-yeti-dialog-<n>` | always rendered | ADR 0044; [generated-ids](generated-ids.md); architecture-guide P4 |
| `commandfor` on the opener | the dialog's id | `[attr.commandfor]` on `button[yetiDialogOpener]` (`YetiDialogOpener`) from the referenced dialog's `id` | always rendered | ADR 0003 point 5; ADR 0013 points 1 and 2; ADR 0021 point 1 |
| `command` on the opener | `show-modal` | host binding `'[attr.command]': '"show-modal"'` on `YetiDialogOpener`, a constant | always rendered | ADR 0021 point 1; architecture-guide P12 |
| `aria-expanded` on the opener | none | none | never rendered | ADR 0021 point 4 |
| `aria-haspopup`, `aria-controls` on the opener | none | none ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 151) | never rendered | ADR 0021 point 4 leaves it to this spec |
| `aria-labelledby` on the dialog | the author's | the consumer's; no input | not applicable | building-blocks 1.10, Names |
| Token `--yeti-dialog-surface`, `-radius`, `-padding`, `-backdrop` | the dialog's skin | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--yeti-shadow-md`, `--yeti-space-md`, `--yeti-space-sm`, `--yeti-color-text`, `--yeti-width-md` and the `--yeti-width-*` that `max` names | shadow, gutter, footer gap, text, widths | the consumer's | not applicable | ADR 0004 |
| Tokens `--yeti-duration-fast`, `--yeti-ease` | the arrival and leaving transition | the consumer's; the directive reads the computed `transition-duration`, never the token's text | not applicable | ADR 0004; building-blocks 1.6 rule 1; `upstream-bugs.md` Y1 |
| Token `--_yeti-max` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-dialog=""` on `dialog[yetiDialog]` only | always present | ADR 0045; ADR 0060 point 2; ticket 50 decision 6 |
| Injection token | not Yeti's | none: the opener reaches the dialog by template reference, and nothing else needs the dialog | not applicable | ADR 0013 point 1; building-blocks 1.8 |

The input value type is Yeti's own `YetiWidth`, from the package's generated `yeti-types.ts`, re-exported by name and never redeclared ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5; ADR 0060 point 10). The full vocabulary is the attribute's, so no `Extract` is needed.

`YetiDialogOpener` sets no presence attribute and acquires no item file: it is not an item root, and it binds no Yeti class or attribute (ticket 50 decisions 6 and 7; CONTEXT.md, Free behaviour directive).

**Module replaced** (`dialog.js`, [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 31; ADR 0021 point 2):

| `dialog.js` behaviour | Lines | Fate | In the package |
| --- | --- | --- | --- |
| Delegated listeners on `document`, so dialogs added later work, safe on a page with none | `:8-9` | changed | host listeners on each `dialog[yetiDialog]`; they exist only where the directive is, work on any Angular-rendered dialog in any rendering mode, and go with their host (building-blocks 1.15) |
| The opener is remembered per dialog, so a dialog opened from inside another returns focus to its own opener | `:10-12` | kept | one recorded opener per directive instance |
| A `command` capture listener: acts on a closed `dialog.dialog`, `command === 'show-modal'`, with a `source` | `:24-30` | changed | a `(command)` host listener on the dialog (the event is dispatched on the dialog and does not bubble), with the same three conditions |
| Records `event.source` as the opener before the default action moves focus | `:31-34` | kept | recorded in the `command` handler |
| A task after the command confirms the dialog really opened, so a cancelled command leaks nothing | `:35-44` | changed | the open is observed through the dialog's `toggle` event, inside the target since Chrome 132, Firefox 133, and Safari 26 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 147); the 0 ms task is kept only to clear an opener whose command did not open the dialog (building-blocks 1.11 decision 4 allows a timer started in a handler) |
| On `close`, focuses the opener with `preventScroll` and forgets it | `:45-48` | kept | a `(close)` host listener focuses the recorded opener with `{ preventScroll: true }` when it is still connected, then forgets it (ADR 0043 point 3); a dialog found open at creation has no recorded opener ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 149) |
| Dispatches `yeti:open` once the browser opened it from a `commandfor` button | `:49` | changed | the `opened` Completion output, after the arrival transition, for every open the `toggle` event reports, not only a command's ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 3 and 147) |
| `pointerdown` capture listener records whether the press began outside the box | `:53-56` | changed | a `(pointerdown)` host listener on the dialog, recording only while it is open; a press on the backdrop targets the dialog itself |
| `click`: ignores a keyboard activation (`detail === 0`); closes when the release and the press both land outside the box | `:58-65` | kept, extended | a `(click)` host listener with the same geometry (`getBoundingClientRect()` against `clientX` and `clientY`), which also asks `closePredicate` before closing |
| `close` capture listener dispatches `yeti:close` on every close | `:67-75` | changed | the `closed` Completion output, after the leaving transition, on every close; no DOM event is dispatched (events spec rule 5) |

What the package adds beyond the Module: the `isOpen` model and the `open()` and `close()` methods (building-blocks 1.4; ADR 0021 point 1), the `closePredicate` veto over `cancel` and Escape (1.4; ADR 0021 point 3), closing on navigation (ADR 0041; ledger A11Y-15, owned by navigation-close), closing an open dialog when the directive is destroyed (1.9), the opener directive with its generated id (ADR 0013; ADR 0044), and the focus-return fallback for a dialog opened before hydration ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 149).

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The dialog reads `--yeti-dialog-surface`, `--yeti-dialog-radius`, `--yeti-dialog-padding`, `--yeti-dialog-backdrop`, `--yeti-shadow-md`, `--yeti-color-text`, `--yeti-space-md` (the viewport gutter), `--yeti-space-sm` (the footer gap), `--yeti-width-md` by default and the `--yeti-width-*` that `max` names through the always-loaded value rules, and `--yeti-duration-fast` and `--yeti-ease` for its transition, which collapse to `0.01ms` under `prefers-reduced-motion` (`Y/src/tokens/motion.css:5`, `:27`). The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block, in a **Theme** file after Yeti, or with a runtime `setProperty`; the dialog tokens are derived tokens, so they also take effect on one dialog (`Y/src/guides/theming.md:38`). The directive measures the transition from the computed `transition-duration` and never parses a token's text (building-blocks 1.6 rule 1; `upstream-bugs.md` Y1). **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- No injection token, no parent, and no parts. The dialog's children are the consumer's elements; its close control is the consumer's `form method="dialog"` button or a `(click)` that calls `close()` (Part 2 row 31).
- The opener is a Free behaviour directive linked by a typed template reference (`[yetiDialogOpener]="confirm"` with `#confirm="yetiDialog"`), never by an id string and never by nearest-ancestor injection ([ADR 0013](../adr/0013-parts-name-their-targets-by-reference.md) point 1; building-blocks 1.8, 1.9). A link across component boundaries passes the `YetiDialog` reference through an input (ADR 0013 point 3).
- The opener registers itself with the dialog it references from an `effect` whose cleanup unregisters, because the reference can change at runtime; it writes only the dialog's registry signal, so it is safe on the server (building-blocks 1.5's one exception). The dialog uses the registry only for the focus-return fallback of a dialog found open at creation ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 149).
- No host directives: the opener's look is `yetiButton` written beside it, never hosted (architecture-guide P6; the [button](button.md) spec). `YetiButton` declares `variant`, `emphasis`, and `size`; `YetiDialogOpener` declares only `yetiDialogOpener`, so no input name is declared twice on one button (building-blocks 1.4).
- Ids: `YetiDialog` calls `injectYetiId('dialog')` in a field initializer and binds it as `[attr.id]`; the opener binds the same value as `commandfor` through its reference (the [generated-ids](generated-ids.md) spec; ticket 50 decision 5, "the directive whose host renders an `id` generates it"). The consumer's static `id` wins.
- Other injection: `DestroyRef`, the item-file helper of the [setup](setup.md) spec, and, through `injectCloseOnNavigation`, the optional `Router` ([navigation-close](navigation-close.md)). No CDK a11y service is injected: no `FocusTrap`, `InteractivityChecker`, or `FocusMonitor` ([ADR 0043](../adr/0043-light-dismiss-additions-are-host-listeners-not-cdk-services.md) points 3 and 4).

### 4. API

| Member | `YetiDialog` | `YetiDialogOpener` |
| --- | --- | --- |
| Class name | not among the 46 names `yeti.d.ts` exports at the Pin, so `Yeti`, not `NgxYeti` (ADR 0080 point 4; ticket 50 decision 10) | as left |
| Selector | `dialog[yetiDialog]` (Part 2 row 31; architecture-guide P5: Yeti's own `dialog.dialog`) | `button[yetiDialogOpener]` (this spec fixes Part 2's provisional `[yetiDialogOpener]` by P5, because `commandfor` and `command` are attributes of the HTML `button` element) |
| `exportAs` | `yetiDialog` | `yetiDialogOpener` |
| Entry point | `ngx-yeti/dialog` (building-blocks 1.3; ADR 0011 clause 10) | same |
| Inputs | `max: YetiWidth \| undefined` (Yeti default `md`), `input()` with no default; `closePredicate: (() => boolean) \| undefined`, default `undefined`, meaning every close is allowed ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 150) | `yetiDialogOpener: YetiDialog`, `input.required()` |
| Models | `isOpen: boolean`, `model(false)`; see "Open state" below | none |
| Outputs | `opened: void`, `closed: void`, both `output()` Completion outputs ([events](events.md) rules 1 to 3 and 7) | none |
| Methods | `open()`: calls `showModal()` on the host when it is closed; `close()`: calls `close()` on the host when it is open. Both act only through the platform, so the host listeners report them | none |
| Read-only members | `id: string`, the value bound as the host's `id` | none |
| Host | static `class: 'dialog'`; static `data-ngx-yeti-item-dialog: ''`; `[attr.data-max]` from `max`, `null` when unset; `[attr.id]`; listeners `(command)`, `(toggle)`, `(close)`, `(cancel)`, `(pointerdown)`, `(click)`, and `(window:keydown)`. No binding of `open`, `tabindex`, `role`, or any ARIA attribute | `'[attr.command]': '"show-modal"'`, a constant (architecture-guide P12); `[attr.commandfor]` from the reference's `id`; no listener |
| Providers | none | none |
| Lifecycle | the item file is acquired by the last statement of the constructor (ticket 50 decision 42; [setup](setup.md)); `injectCloseOnNavigation(isOpen, () => this.close())` is called in the constructor; on destroy an open host is closed (building-blocks 1.9) | registration with the referenced dialog from an `effect` with cleanup |

**Open state** (the open-state ruling; ADR 0021 note of 2026-10-03; events rule 9):

1. When `YetiDialog` is created it reads the host's `open` once. On the server this is the server render's closed dialog; under hydration it is whatever the user did before hydration.
2. At the first render after creation, the element wins over the parent's initial `isOpen` binding: the model is set to the element's state, and `isOpenChange` emits only when that differs from the bound value, so the parent's two-way state follows the dialog; `opened` does not emit. An initial bound `true` therefore opens nothing; a dialog that must open on load is opened with `open()` from `afterNextRender` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 146).
3. After that, a `toggle` event whose live state is open sets `isOpen` to `true` if it was `false` (emitting `isOpenChange`) and starts the arrival wait; a `close` event sets `isOpen` to `false` if it was `true` (emitting `isOpenChange`), returns focus, and starts the leaving wait. Each handler reads the host's live `open`, never the event's `newState`, so a replayed `toggle` that no longer matches the element changes nothing.
4. A parent's later write to `isOpen` calls `showModal()` (for `true` on a closed host) or `close()` (for `false` on an open host) in an `afterRenderEffect` write phase, and emits no `isOpenChange`, as `model()` does not for a parent write. The platform's `toggle` or `close` then follows, and `opened` or `closed` emits after the transition, because those outputs follow every open and close of the element, as `yeti:close` did "however it was closed" (events rule 9; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 148).
5. `open()` and `close()` emit through the same handlers, as events rule 9 says a method call does.

**Completion** (building-blocks 1.6 rule 1; ticket 50 decision 3): after an open or close is observed, the directive waits for the first `transitionend` whose `target` is the host and whose `pseudoElement` is empty (the `::backdrop`'s transitions report the dialog as their target), with a fallback timer of the longest computed `transition-duration` on the host plus 100 ms, a measured zero completing at once. A wait still running when the opposite change starts completes at once, so a `closed` always precedes the next `opened` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 153). The timer starts in the handler and is cleared on destroy.

**Backdrop press**: `pointerdown` records, while the host is open, whether the press began outside `getBoundingClientRect()`; `click` closes the host when it is open, `event.detail !== 0`, the release is outside the box, the press began outside it, and `closePredicate` is unset or returns `true`. Neither handler calls `preventDefault()`.

**Veto** (ADR 0021 point 3; building-blocks 1.4): while the host is open and `closePredicate` returns `false`, the `(window:keydown)` handler calls `preventDefault()` on an Escape keydown without modifiers (`hasModifierKey`) whose target is inside the host, before the keydown becomes a close request, so repeated Escape cannot make the `cancel` non-cancelable; the `(cancel)` handler calls `preventDefault()` for any other close request the platform sends. In both, `preventDefault()` is the last statement (building-blocks 1.5). The predicate is not asked for `close()`, a model write, a `form method="dialog"` submission, or a navigation, so the consumer always keeps a way to close it (WCAG 2.1.2).

**Focus return** (ADR 0021 point 2; ADR 0043 point 3): the `close` handler focuses the opener recorded from the `command` event's `source`, with `{ preventScroll: true }`, when it is still connected, and forgets it. With no recorded opener (a dialog opened by `open()`, a model write, or the consumer's own `showModal()`), the platform's own focus restoration stands. A dialog found open at creation, which the user opened before hydration, has no recorded opener because `command` is not replayed; when exactly one `YetiDialogOpener` is registered with it, focus returns to that opener ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 149).

No input default differs from Yeti's (ADR 0070 rule 1). A static attribute type-checks as a string literal under `strictTemplates`, so `max="sm"` compiles and `max="medium"` does not (ADR 0070 rule 2).

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiDialog` on a `<dialog>` and name it with `aria-labelledby` pointing at a visible heading inside it (manifest `a11y.notes`; APG dialog (modal), `APG/content/patterns/dialog-modal/dialog-modal-pattern.html`; building-blocks 1.10, Names). The heading's `id` is the consumer's and must be unique on the page, so a dialog inside `@for` derives it from the row.
2. Open the dialog only through `button[yetiDialogOpener]`, `open()`, an `isOpen` write, or your own `showModal()`. Never write `open` on the dialog, never bind `[open]` or `[attr.open]`, and never call `show()`: Yeti's dialog is modal only (ADR 0021 point 5), a static `open` is written again at hydration, and a bound one hides a modal dialog opened before hydration (ticket 34).
3. Write the opener as `<button yetiButton type="button" [yetiDialogOpener]="ref">`. Never write `commandfor` or `command` on it yourself (ADR 0003 point 5).
4. Give every dialog a visible control that closes it, preferably a `form method="dialog"` button, which closes with no script and is never vetoed (APG dialog (modal): "strongly recommended"; manifest `children`).
5. Initial focus is the platform's dialog focusing steps. Write `autofocus` on the control the user should meet first, the least destructive one for an action that cannot be undone (APG dialog (modal), initial focus note; WHATWG's `dialog` initial-focus note, ticket 17 section 4.11). Never put `autofocus` or `tabindex` on the `dialog` itself (building-blocks 1.10, Focus; architecture-guide P26).
6. Ids: write a static `id` on the dialog only when something outside the template must address it. Never bind `[id]`, and never use the `ngx-yeti-` prefix in your own ids (the [generated-ids](generated-ids.md) spec; ticket 50 decision 5).
7. Do not write `class="dialog"`, `data-max`, or `data-ngx-yeti-item-dialog` statically. The directives bind them, and hydration writes a static attribute back before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"). A value newer than the pin goes through `$any` (`[max]="$any('3xl')"`, ADR 0070).
8. Keep an opener and its dialog inside one hydration boundary, and keep a shell dialog in a hydrated region (building-blocks 1.11 decision 6; ADR 0021 consequences). Since ADR 0044 their ids match across boundaries, so a split opener still opens the dialog, but the Backdrop press, the focus return, the outputs, and closing on navigation need the dialog's own boundary hydrated.
9. Call `open()` and `close()` only from event handlers and render callbacks, never in a constructor or during a server render (building-blocks 1.5; ADR 0011 clause 3).
10. Close a dialog before removing it from the page, and remove it on `(closed)`. An open dialog removed by `@if` or a route is closed by the platform and by the directive's destroy, but no focus return runs (inferred from the HTML removing steps).
11. Keep `closePredicate` free of side effects: it can run twice for one Escape (on `keydown` and on `cancel`).
12. Import `YetiDialog` and `YetiDialogOpener` in every component whose template writes them. A **Forgotten import** of `YetiDialogOpener` is a compile error (NG8002), because its input is always bound; a forgotten `YetiDialog` with `#d="yetiDialog"` is NG8003, and without a template reference it renders an unstyled dialog that nothing opens, with no error (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `dialog` | Angular Material `MatDialog` (`NC/src/material/dialog/`) |
| --- | --- | --- |
| Shape | a directive on the consumer's native `<dialog>`, in the page's markup, opened by invoker commands | a service that renders a component through CDK Overlay; rejected by ADR 0021 for losing the no-script opening and the in-place server HTML |
| Role | the native modal `dialog` (`modal=true`, ticket 17) | `role` config, `'dialog'` by default (`dialog-config.ts:57`), `ariaModal` (`:123`) |
| Name | the consumer's `aria-labelledby` | `ariaLabelledBy` (`:113`), filled from `matDialogTitle` |
| Backdrop | always; a Backdrop press closes unless `closePredicate` refuses | `hasBackdrop` (`:63`) |
| Veto | `closePredicate` input ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 150) | `disableClose` (`:69`), `closePredicate` (`:72`) |
| Initial focus | the platform's focusing steps or the consumer's `autofocus` | `autoFocus`, `'first-tabbable'` by default (`:130`) |
| Focus return | to the opener recorded from `command` | `restoreFocus`, `true` by default (`:133`) |
| Closing on navigation | always, on `NavigationStart` ([navigation-close](navigation-close.md)) | `closeOnNavigation`, `true` by default (`:146`), on `popstate` only (ledger A11Y-15's note) |
| Focus trap | none; the native modal keeps focus off the page (A11Y-8) | CDK `FocusTrap` wraps Tab (`NC/src/cdk/a11y/focus-trap/focus-trap.ts:38`) |
| Lifecycle | `opened` and `closed` outputs, `isOpen` model | `afterOpened()`, `beforeClosed()`, `afterClosed()` on the reference (`dialog-ref.ts:161`, `:175`, `:168`) |
| Close control | the consumer's `form method="dialog"` button | `matDialogClose` (`exportAs: 'matDialogClose'`, `dialog-content-directives.ts:30`) |
| Result | the native `returnValue`, set by the submitting button's `value`, read from the element | `close(result)` and `afterClosed()` |

The package takes Material's veto name and the default of closing on navigation, and leaves the rest to the platform: Yeti's dialog is the native element, and the platform already supplies the modality, the focus containment, Escape, and the initial focus.

### 6. Implementation level and primitives

Native platform, level 1: `<dialog>`, `showModal()`, invoker commands (`commandfor`, `command`), `::backdrop`, `form method="dialog"`, and the `command`, `toggle`, `close`, and `cancel` events (Part 2 row 31; building-blocks 1.2, where all are inside Baseline 2025). The reason (row 31): the dialog opens before hydration and with no script (ticket 18, measured), and the Module's two additions are two host listeners. No Aria pattern exists for a dialog (ticket 03, section 4.3), and none is hosted. CDK `Dialog` is not used: it is an overlay, not the native element (ADR 0021, Considered options). CDK `FocusTrap` (`NC/src/cdk/a11y/focus-trap/focus-trap.ts:38`, `CdkTrapFocus` `:417`) is not added in the first milestone, and `InteractivityChecker` is not used, because initial focus is the dialog focusing steps or the consumer's `autofocus` (ADR 0043 points 3 and 4). CDK's pure pieces used: `hasModifierKey` from `@angular/cdk/keycodes` for the Escape veto (building-blocks 1.5), and `_IdGenerator` through `injectYetiId` (ADR 0044). The custom Angular parts are the listeners, the model, and the outputs, and `injectCloseOnNavigation` (custom Angular over `@angular/router`, row 50).

### 7. Accessibility (WCAG 2.2 AA), ARIA, and keyboard

- **APG pattern:** Dialog (Modal) (building-blocks 1.10). The native modal state supplies the role and `aria-modal` (ticket 17 measured `dialog "Delete this project?" modal=true` and nothing else of the page exposed while open).
- **Opener:** a native `button`; no `aria-expanded`, because HTML-AAM maps no expanded state for `command="show-modal"` and the opener is inert while the dialog is open (ADR 0021 point 4); no `aria-haspopup` and no `aria-controls` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 151).

| Key | Where | Behaviour | Owner |
| --- | --- | --- | --- |
| Enter, Space | opener | opens the dialog modally; focus moves inside by the dialog focusing steps | platform (invoker commands) |
| Tab, Shift+Tab | inside | moves among the dialog's controls; never reaches the inert page; in Chromium and WebKit focus passes through the browser's own UI before coming back (A11Y-8) | platform |
| Escape | inside | closes the dialog, unless `closePredicate` refuses | platform; the veto is the directive's |
| Enter, Space | a `form method="dialog"` button | closes the dialog and sets `returnValue` | platform |
| none | on close | focus returns to the recorded opener | directive (`dialog.js:45-48` kept) |

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The native `dialog` role, named by the consumer's `aria-labelledby` (usage rule 1); the directives add no role. |
| 1.4.3 Contrast (Minimum), 1.4.11 Non-text Contrast | Text on `--yeti-dialog-surface` is Yeti's. axe reported no violation on the dialog shut and open in three engines and both schemes (ticket 17), and the **Story gate** runs on a story that ends with the dialog open (`dialog--open`). The play function asserts at least 4.5:1 for the heading and body text against the surface in both schemes (ticket 50 decision 8). |
| 1.4.10 Reflow | The dialog is never wider than the viewport less two gutters (`dialog.css:7`), and the user agent's modal style scrolls tall content inside it (inferred from the UA stylesheet, not read). Layer 4 asserts no page-level horizontal overflow at 320 x 640 with a tall dialog open, and that its last control can be reached. |
| 2.1.1 Keyboard | Opening, moving, and closing are native keys; the Backdrop press has the keyboard equivalent of Escape and the close button. |
| 2.1.2 No Keyboard Trap | Escape closes. A refusing `closePredicate` never reaches the `form method="dialog"` button or `close()` (section 4, Veto; usage rule 4), so the dialog always has a keyboard way out. |
| 2.4.3 Focus Order | Focus moves into the dialog by the platform and returns to the opener on close by the directive, in every engine including WebKit, where a clicked button never has focus (ADR 0021 point 2). The navigation close returns focus the same way (A11Y-15). The pre-hydration case is the focus-return fallback ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 149; ledger A11Y-25). |
| 2.4.7 Focus Visible | Yeti's focus ring on the controls inside; the `dialog` itself is never focused by the package (building-blocks 1.10). |
| 2.4.11 Focus Not Obscured (Minimum) | While the dialog is open the page is inert, so no focus can sit behind it; a control inside scrolls into view within the dialog. |
| 2.5.8 Target Size (Minimum) | The opener and the footer controls are `yetiButton`s (the [button](button.md) spec). |
| 4.1.2 Name, Role, Value | The dialog's role and modal state are native, its name the consumer's; the opener is a button with no expanded state (ADR 0021 point 4). |

**Ledger rows owned:** [A11Y-8](../ledger.md) (Tab passes through the browser's own UI in Chromium and WebKit). This spec confirms the row: no `FocusTrap` in the first milestone (ADR 0043 point 3; ADR 0021 note of 2026-10-02). Layer 4 measures Tab and Shift+Tab from the last and first controls in headed runs in all three engines, asserts that focus never reaches the page, and records where it goes; the measurement may reopen the point under ADR 0043 point 5. A11Y-15 is owned by navigation-close and used here. Added: [A11Y-1g](../ledger.md) for the dialog's edge under forced colours, after A11Y-1a to A11Y-1f, and [A11Y-25](../ledger.md) for the focus-return fallback and [A11Y-26](../ledger.md) for the veto, which go beyond what `dialog.js` did (building-blocks 1.8: "Each is a `ledger.md` row where it is more than Yeti's module did") ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 149, 150, and 152). The Backdrop press and the recorded-opener focus return are like-for-like replacements and are not rows (ADR 0040 consequences).

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<button yetiButton type="button" variant="alert" [yetiDialogOpener]="confirm" i18n>Delete project</button>

<dialog yetiDialog #confirm="yetiDialog" aria-labelledby="delete-project-title" (closed)="onClosed(confirm)">
  <h2 id="delete-project-title" i18n>Delete this project?</h2>
  <p i18n>Everything in it goes too, and this cannot be undone.</p>
  <footer>
    <form method="dialog">
      <button yetiButton type="submit" emphasis="medium" value="cancel" autofocus i18n>Cancel</button>
    </form>
    <button yetiButton type="button" variant="alert" (click)="deleteProject(); confirm.close()" i18n>Delete</button>
  </footer>
</dialog>
```

Server HTML, which hydration leaves unchanged:

- The opener carries `yetibutton=""`, `type="button"`, `variant="alert"`, the button's `class="button"`, `data-variant="alert"`, and `data-ngx-yeti-item-button=""`, plus `commandfor="ngx-yeti-dialog-0"` and `command="show-modal"`. No `aria-expanded`, `aria-haspopup`, or `aria-controls`. The bound `[yetiDialogOpener]` renders no attribute.
- The dialog carries `yetidialog=""`, `aria-labelledby="delete-project-title"`, `class="dialog"`, `id="ngx-yeti-dialog-0"`, and `data-ngx-yeti-item-dialog=""`, and no `data-max` and no `open`. With `max="sm"` it carries `max="sm"` (inert) and `data-max="sm"`. With a static `id="delete-project"` the dialog keeps it and the opener's `commandfor` is `delete-project`.
- The dialog carries a `jsaction` for the replayable host listeners, `click`, `pointerdown`, and `toggle`; `command`, `close`, and `cancel` are not on Angular's replay list, and the `window:` listener is not replayed (`NGP/core/primitives/event-dispatch/src/event_type.ts:295-366`; `NGP/core/src/hydration/event_replay.ts:248-255`; read, not measured).

Open, after a click on the opener: the platform adds `open` and the dialog matches `:modal`; the directive writes nothing to the DOM. Closed again: the platform removes `open`. Neither state is a binding, so no server HTML ever shows the dialog open: the server renders it closed, and a modal state cannot be server-rendered (domino does not implement `showModal()`, ticket 34, read).

The server also writes the item links into `<head>` in Yeti's order: the `button` link (`Y/src/yeti.css:40`) and then the `dialog` link (`:58`), each `rel="stylesheet"` with `href` `<url>components/<item>/<item>.css?v=<pin>`, `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles`, `data-ngx-yeti-app`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5).

The delta from Yeti's docs markup: the consumer writes `yetiDialog` and `[yetiDialogOpener]` where the docs write `class="dialog"`, an `id`, `commandfor`, and `command`; the `id` and `commandfor` are generated unless the consumer writes a static `id`.

### 9. Animation

Yeti's own CSS, keyed on native state (ADR 0010 point 1; building-blocks 1.6 rule 1): `opacity` and `translate` with `display` and `overlay` transitioned `allow-discrete`, and `@starting-style` for the arrival (`dialog.css:30-41`). The directive adds no class, no inline style, and no keyframes, and `close()` needs no wait before it (ADR 0010, context). It awaits the transition only to emit `opened` and `closed` (section 4, Completion). Under `prefers-reduced-motion` Yeti's duration collapses to `0.01ms`, and the outputs follow at once (ticket 17 measured the dialog's motion collapsing in three engines). A server-rendered dialog never takes `animate.enter`, and the package puts no `animate.enter` or `animate.leave` on the dialog: it stays in the DOM and changes state (ADR 0010 point 3; ADR 0011 clause 12). A dialog the consumer inserts with `@if` arrives closed, so there is nothing to animate until it opens.

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, `data-max`, the `id`, the opener's `commandfor` and `command`, and the item links (section 8). Everything at first paint is a host binding (ADR 0011 clause 1). The dialog is closed on the server.
- **Before hydration:** neither directive creates a node, reads layout, starts a timer, or touches `window`, `history`, or `location` (ADR 0011 clauses 3 and 4). The opener opens the dialog natively, Escape and a `form method="dialog"` button close it, and the page is inert while it is open (ticket 18, measured). The dialog's `open` is **Pre-hydration state**, which is why it is never bound (ticket 34).
- **Full hydration:** both hosts are claimed as they are; the `id` and `commandfor` are equal on both sides (ADR 0044, measured). `YetiDialog` reads `open` once: a dialog the user opened before hydration stays open, visible, and modal, and `isOpen` reads `true` with no `opened` (events rule 9). The opener of that open is unknown, because `command` is not replayed (section 4, Focus return).
- **Event replay:** `click` and `pointerdown` on the dialog replay, so a Backdrop press made before hydration closes the dialog once its boundary hydrates, as a live press would, late but once (read in `event_type.ts:335`; this corrects ADR 0043's note that `pointerdown` is not replayed, [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 92). `toggle` replays and is matched against the live state, so it changes nothing. `close` is never replayed (`upstream-bugs.md` A3): a dialog opened and closed before hydration reads as closed at creation and emits no `closed`. `command` and `cancel` are not replayed, and neither is the `window:keydown` veto, so before hydration Escape always closes.
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the dialog and its link; the opener opens it natively before the block hydrates, and the dehydrated host holds its link (ADR 0060 point 4). Once the block hydrates, the directive reads the open state and adds its behaviour. A click on an opener inside a `hydrate on interaction` block both opens the dialog natively and hydrates the block.
- **`hydrate never`:** the dialog is its server HTML and stays styled while its host is connected (ADR 0060 point 4; ADR 0045). The platform opens it, holds focus, closes it on Escape and from a form button. Lost: the Backdrop press, the focus return in WebKit, the outputs, the model, the veto, and closing on navigation, which is why a shell dialog belongs in a hydrated region (usage rule 8; building-blocks 1.11 decision 7).
- **Client-only `@defer`:** the item file is fetched when `YetiDialog` is constructed. The dialog arrives closed, so an unstyled frame shows only if it is opened at once; `provideYetiStyles({ preload: ['dialog'] })` closes that gap (ADR 0060 point 6; [setup](setup.md)).
- **`withI18nSupport()`:** dialog content is usually translated with `i18n` in the consumer's component, which needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11). The directives add no `i18n` block and render no string of their own (building-blocks 1.10, Strings).
- **Zoneless:** `isOpen` is a signal written from host listeners, `max` an input signal read by a host binding, and the outputs are emitted from host listeners, so views refresh with no zone (map, Standing rulings, item 43; building-blocks 1.5).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the opener opens the dialog modally, Escape and the `form method="dialog"` button close it, the page behind is inert, and the dialog is styled because its link is in the server HTML. Lost: the Backdrop press, the focus return in WebKit (Yeti's docs say the same of a page without the module, `docs.md:27`), the outputs, the veto, and closing on navigation, which has no Router to react to. A client-only application gets no such promise.
- **Hydration boundary:** usage rule 8.

### 11. Hydration constraints

The dialog complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static and `command` is a constant binding; `data-max` comes from an input; the `id` and `commandfor` are equal by ADR 0044. `open` is never bound, so hydration never writes it (ticket 34's failure cannot occur).
- **No direct DOM manipulation:** the directives write the DOM only through host bindings. `showModal()`, `close()`, and `focus()` run in handlers or in an `afterRenderEffect`, never on the server and never before hydration (building-blocks 1.5).
- **Valid HTML:** the directives change no element. The consumer's `dialog` must sit where flow content is allowed, and a `footer` inside it is valid; `form method="dialog"` is the consumer's.
- **`preserveWhitespaces`:** the directives have no template.
- **No output branched on the platform:** none.
- **Static attributes the directives bind:** usage rules 2, 3, and 7 keep the consumer from writing `open`, `commandfor`, `command`, `class="dialog"`, and `data-max`. A static `max` is `inert` and never bound. A static `id` is the documented exception: the directive reads it once through `HostAttributeToken('id')` and binds the same value, so hydration writes back what the server rendered (the [generated-ids](generated-ids.md) spec).

### 12. Single-page application

- **Closing on navigation:** `YetiDialog` calls `injectCloseOnNavigation(isOpen, () => this.close())` at construction ([navigation-close](navigation-close.md); ADR 0041; row 50). While the dialog is open, the first `NavigationStart` after the Router's first navigation closes it; the `close` handler returns focus to the opener and `closed` follows. The initial navigation never closes a dialog the user opened before hydration (navigation-close, API point 4). Ticket 20 measured the failure this fixes in three engines. A dialog inside a destroyed route is closed by its removal and needs nothing.
- **Destroy:** an open dialog whose directive is destroyed is closed (building-blocks 1.9); usage rule 10 covers focus.
- **Fragment links:** none of the item's own. A fragment link inside a dialog is the consumer's and goes through the [fragment-links](fragment-links.md) spec only if the consumer provides it; when the Router handles it, the dialog closes like any navigation.
- **Route changes and the item file:** the item link is removed in the animation frame after no `[data-ngx-yeti-item-dialog]` host is connected, and re-inserted when a route renders a dialog again (ADR 0060 point 4; ADR 0045).

### 13. Item file

`yeti-css/css/components/dialog/dialog.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `dialog[yetiDialog]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:58`, after the `button` and `buttons` files at `:40-41`), and removed after the last host carrying `data-ngx-yeti-item-dialog` has left the DOM. `YetiDialog` calls `injectYetiItemStyles('dialog')` from `ngx-yeti/styles` as the last statement of its constructor (ticket 50 decision 42; the [setup](setup.md) spec owns the loader). `YetiDialogOpener` acquires nothing. The consumer's part is the setup spec's one-time configuration and, for a dialog first rendered by the client and opened at once, `provideYetiStyles({ preload: ['dialog'] })`. Cross-item files acquired: none; `dialog.css` has no cross-item rule (ADR 0060 point 9). The buttons inside the dialog load the `button` file through their own directives.

## Testing Decisions

A good test asserts what a user or a consumer observes: whether the dialog is open and `:modal`, where focus is, whether the page is inert, the attributes in the DOM, the item link, and when the outputs fire. It never asserts a private field, the recorded opener, or how the styles service counts. No test depends on a public token's default value or a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): a width test sets `max` and compares with a probe styled `inline-size: var(--yeti-width-<w>)`. "Open" means the host has `open` and matches `:modal`; "closed" means neither. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s, and the shared output cases are the [events](events.md) spec's.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `dialog` and `button` item files through the directives (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the Story gate). `opened`, `closed`, and `isOpenChange` are declared as actions. Story ids:

- `dialog--default`: section 8's markup. Asserts the opener's `commandfor` equals the dialog's `id`, `command="show-modal"`, and no `aria-expanded`, `aria-haspopup`, or `aria-controls`; the dialog's `class` is `dialog`, `data-ngx-yeti-item-dialog` is present, and `data-max` and `open` are absent. Clicks the opener: the dialog is open, focus is on Cancel (`autofocus`), `isOpenChange(true)` and then `opened` fired, and a hit test on the page behind lands in the dialog. Presses Escape: closed, focus on the opener, `isOpenChange(false)` and then `closed` fired. Opens again and clicks Cancel: closed, `returnValue` is `cancel`, focus on the opener. No `yeti:*` event reached a `document` listener (events spec).
- `dialog--open`: the play function opens the dialog and leaves it open, so the Story gate runs axe on the open dialog (`aria-dialog-name`, contrast). Asserts at least 4.5:1 between the heading and body text and the dialog's surface, from the exact WCAG formula on computed colours, in the light and dark schemes (ticket 50 decision 8).
- `dialog--backdrop`: asserts, after Yeti's `dialog.spec.js`: a press and release on the backdrop closes; a click inside does not; a drag from text inside to the backdrop does not; a keyboard activation of a control near the edge (`detail === 0`) does not.
- `dialog--max`: Storybook controls bind `max`. With `max="sm"`, asserts `data-max="sm"` and a width no greater than a probe's `var(--yeti-width-sm)` within 1 px; unset removes `data-max`; at a container narrower than the probe, the dialog is narrower than the viewport by two probe `var(--yeti-space-md)` gutters.
- `dialog--model-and-methods`: a host component binds `[(isOpen)]="open"` and has buttons that set `open` and call `d.open()` and `d.close()`. Setting the signal to `true` opens the dialog with no `isOpenChange` and with `opened` after the transition; `d.close()` closes it with `isOpenChange(false)` and `closed`; setting `false` while open closes it with `closed` and no `isOpenChange`.
- `dialog--close-predicate`: `closePredicate` returns `false` until a "Discard changes" checkbox inside the dialog is checked. Escape, pressed three times, leaves it open; a Backdrop press leaves it open; the `form method="dialog"` button closes it. With the box checked, Escape closes it.
- `dialog--nested`: a dialog opened from a button inside another, as in Yeti's test. Closing the inner one returns focus to its own opener inside the outer one; closing the outer returns focus to the page's opener.

### Layer 2: browser-level (`npx nx test <lib>`, `dialog.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiDialog, { tagName: 'dialog' })`: the host has class `dialog`, `data-ngx-yeti-item-dialog`, and an `id` with the shape `ngx-yeti-dialog-<n>`, and no `data-max`, `open`, `role`, `tabindex`, or ARIA attribute; `max` bound through `bindings` renders `data-max` and `undefined` removes it.
- With the host connected: `open()` makes it `:modal`, `isOpen()` is `true`, `isOpenChange` emitted once; `opened` emits after a `transitionend` dispatched on the host, not after one carrying `pseudoElement: '::backdrop'`, and, with no `transitionend`, after the fallback timer (fake timers). `close()` mirrors it with `closed`. A close started during the arrival wait completes the wait at once, so `opened` precedes `closed`.
- `isOpen` bound through `bindings` with a writable signal: setting `true` after the first render opens the host and emits no `isOpenChange`; an initial bound `true` on a closed host leaves it closed and sets the signal to `false` (section 4, Open state, point 2; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 146).
- A `CommandEvent` with `command: 'show-modal'` and a `source` button dispatched on the closed host, followed by `showModal()`, then a `close()`: focus moves to the source button. The same with the source removed from the document before the close: no error and no focus call. A `command` with no following open: the recorded opener is cleared after the 0 ms task, and a later `open()` and `close()` move no focus to it.
- `pointerdown` and `click` with coordinates outside the host's box and `detail: 1` close an open host; `detail: 0`, a `pointerdown` inside, or a closed host do not; a `closePredicate` returning `false` keeps it open. A replay-shaped `click` whose `preventDefault` throws still closes (no handler calls it).
- With `closePredicate` returning `false`: an Escape `keydown` on a control inside the open host is `defaultPrevented`; one with a modifier, one outside the host, or one while closed is not; a `cancel` event is `defaultPrevented`. With the predicate returning `true`, neither is.
- A `toggle` event dispatched while the live state is closed changes nothing and emits nothing.
- Under `provideRouter` with `provideLocationMocks()`: after the initial navigation, open, navigate: the host is closed and `closed` emits; closed, navigate: nothing. Without a Router: creation does not throw.
- Destroying the fixture while open closes the host; no output emits after destroy; one `<link data-ngx-yeti-styles="dialog">` is in `document.head` while a fixture lives and is gone an animation frame after the last is destroyed.
- No `CustomEvent` is dispatched on the host or the document.

A small test host covers what `createDirective` cannot: `<button yetiButton [yetiDialogOpener]="d">` with `<dialog yetiDialog #d="yetiDialog">` renders `commandfor` equal to the dialog's `id` and `command="show-modal"`, and both directives' classes, attributes, and presence attributes on the button; a static `id="confirm"` on the dialog makes `commandfor="confirm"`; rebinding the reference to a second dialog updates `commandfor`; a static `max="sm"` renders both `max` and `data-max`; template references `#d="yetiDialog"` and `#o="yetiDialogOpener"` resolve; the opener's registration follows its reference ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 149).

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `dialog.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and section 8's markup, whose texts carry `i18n` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the opener renders `commandfor="ngx-yeti-dialog-0"` and `command="show-modal"` and no `aria-expanded`; the dialog renders `class="dialog"`, `id="ngx-yeti-dialog-0"`, and `data-ngx-yeti-item-dialog`, and no `open` and no `data-max`; with `max="sm"` written statically it renders `max="sm"` and `data-max="sm"`; `<head>` holds the `button` link before the `dialog` link, each with `data-beasties-skip` and an `href` ending `components/<item>/<item>.css?v=<pin>`; the dialog's `jsaction` names `click`, `pointerdown`, and `toggle` and nothing else (section 8, read); no `close()`, `showModal()`, or `focus()` ran on the server.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item: class `dialog` has `YetiDialog`; `data-max` has the `max` input, whose union equals the manifest's vocabulary `width`; the events `yeti:open` and `yeti:close` of `js[0].events` have the `void` outputs `opened` and `closed` (events spec, Testing). A pin move that adds an attribute, a value, or an event fails here first.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids, after Yeti's own `Y/test/browser/components/dialog.spec.js` (open by `commandfor` and close by Escape; backdrop press and the inside click; the drag; a form button with focus back on the opener; the backdrop painted; the inert page; the nested dialog; `data-max`):

- real mouse and keys in Chromium, Firefox, and WebKit: Enter and Space on the opener open the dialog; after a mouse open, Escape returns focus to the opener in WebKit (the case `dialog.js` exists for);
- A11Y-8, in headed runs: Tab from the last control and Shift+Tab from the first, ten presses each; asserts focus is never on an element of the page behind and returns into the dialog, and records where focus went in each engine (ADR 0043 point 3);
- `emulateMedia({ reducedMotion: 'reduce' })`: `opened` and `closed` fire within one frame of the change, after the 100 ms fallback at most;
- `emulateMedia({ forcedColors: 'active' })` in Chromium and Firefox: a screenshot and the computed border and outline of the open dialog, recorded for the forced-colours point ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 152; ledger A11Y-1g);
- at a 320 x 640 viewport with a tall dialog open: no page-level horizontal overflow, and the last control can be scrolled into view and activated (1.4.10).

Fixture-app half, built with `outputMode: 'server'`, with a `/dialog` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route renders section 8's markup and a second dialog inside a `@defer (hydrate on interaction)` block:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`; the `id` and `commandfor` are unchanged after hydration;
- **ticket 34's regression case:** with `main.js` held back, click the opener; release the bundle; wait for stability: the dialog is still open, matches `:modal`, is visible (non-zero opacity, `elementFromPoint` inside it lands in it), Escape closes it, and no `opened` was emitted; then focus is on the opener (the fallback, [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 149), and `closed` fired once;
- with `main.js` held back, open and close with Escape: after hydration the dialog is closed, `isOpen` reads `false`, and no `closed` fires (A3, the stated residue);
- with `main.js` held back, open and make a Backdrop press: after hydration the replayed press closes the dialog (records the result for the ADR 0043 note point);
- with JavaScript disabled: the opener opens the dialog modally, Escape closes it, the Cancel button closes it, a Backdrop press does nothing, and `@axe-core/playwright` with the six tags reports no violation with the dialog open; the page's focus is not moved at load by the `autofocus` inside the closed dialog;
- the deferred dialog opens natively before its block hydrates and gains its Backdrop press after;
- a shell dialog with a `routerLink` closes on navigation with focus on the opener (the [navigation-close](navigation-close.md) spec owns the case; this route supplies the dialog);
- navigating from the dialog route to a route without one removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and `docs.md` for the stories, and `Y/test/browser/components/dialog.spec.js` for the module cases; ticket 34's `/o34` fixture (`prototypes/aria-subclass-and-open/`) for the pre-hydration modal case; ticket 18's fixture app for the server HTML, JavaScript-off, and replay cases; ticket 20's shell dialog for navigation; the [alert](alert.md) spec's "Module replaced" tests for a replaced module's behaviours.

## Out of Scope

- A non-modal dialog (`show()`), Foundation's size classes, and a scroll lock (ADR 0021 point 5: Yeti opens its dialog only with `show-modal` and locks nothing).
- A CDK `FocusTrap` or any Tab wrapping, unless layer 4's measurement reopens A11Y-8 (ADR 0043 points 3 and 5).
- A dialog service, a dialog rendered from a component type, CDK `Dialog`, or CDK Overlay (ADR 0021, Considered options; building-blocks 1.8).
- `closedby="any"` while Safari lacks it (ADR 0021, Considered options; building-blocks 1.2).
- A `closeOnBackdrop` input and a `yetiDialogDefaultsToken`: `closePredicate` covers the veto, and no spec reason for an application-wide default exists (building-blocks 1.4, Defaults tokens).
- A result value passed to `close()`; the native `returnValue` serves (section 5).
- An `ariaLabel` or `ariaLabelledBy` input, a generated heading id, or a role input (building-blocks 1.10, Names).
- A DOM event for non-Angular code (events spec; ADR 0040 consequences).
- Any check that the dialog is named, that an opener is a `button`, or that a close control exists. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive on the consumer's native `<dialog>`, opened by invoker commands | ADR 0021 point 1; Part 2 row 31 |
| `max: YetiWidth`, static form `inert` | ticket 26 row 114; ADR 0005; ADR 0070 |
| Opener is a Free behaviour directive with a typed reference, rendering `commandfor` and `command="show-modal"` | ADR 0013; ADR 0003 point 5; building-blocks 1.8; architecture-guide P6, P29 |
| Opener selector `button[yetiDialogOpener]` | architecture-guide P5; Part 2's provisional selector |
| Opener renders no `aria-expanded` | ADR 0021 point 4 |
| `open` never bound; read once at creation; follows `close` and the commands | ADR 0021 note of 2026-10-03; map, Standing rulings, Open state; ticket 34 |
| `isOpen` model; `open()` and `close()` methods | building-blocks 1.3, 1.4; ADR 0021 point 1 |
| `opened` and `closed` are `void` Completion outputs after the transition | events spec rules 3 and 7; ticket 50 decision 3 |
| Backdrop press with both ends outside the box and `detail !== 0` | ADR 0021 point 2; `dialog.js:53-65` |
| Focus return to the opener from the `command` event's `source` | ADR 0021 point 2; ADR 0043 point 3 |
| Veto: `closePredicate` over `cancel`, plus Escape `keydown` on `window` | building-blocks 1.4; ADR 0021 point 3; architecture-guide P14 |
| No `FocusTrap`; A11Y-8 stays a ledger row and is measured | ADR 0043 points 3 and 4; ADR 0021 note of 2026-10-02 |
| Closes on navigation through `injectCloseOnNavigation` | ADR 0041; navigation-close spec |
| Generated `id` through `injectYetiId('dialog')`; the consumer's static `id` wins | ADR 0044; generated-ids spec; ticket 50 decision 5 |
| Only `YetiDialog` marks its host and acquires the item file | ADR 0045; ticket 50 decisions 6 and 42 |
| Native platform, level 1; no Aria; no CDK a11y service | building-blocks 1.2; Part 2 row 31; ADR 0043 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |
| Element wins over the parent's initial `isOpen`; observing the open through `toggle`; the focus-return fallback; the predicate's shape; the completion details; the opener's ARIA; the forced-colours row | this spec's readings ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 146, 147, and 149 to 153) |

### Usage examples

A confirmation that runs an action, with the outputs:

```ts
import { YetiButton } from 'ngx-yeti/button';
import { YetiDialog, YetiDialogOpener } from 'ngx-yeti/dialog';

@Component({
  selector: 'app-project-actions',
  imports: [YetiButton, YetiDialog, YetiDialogOpener],
  templateUrl: './project-actions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectActions {
  protected readonly projects = inject(Projects);

  protected deleteProject(): void {
    this.projects.delete();
  }
}
```

The template is section 8's markup.

Opening from state, with a veto while a form has unsaved changes:

```html
<button yetiButton type="button" (click)="editing.set(true)" i18n>Edit profile</button>

<dialog yetiDialog max="sm" aria-labelledby="edit-title" [(isOpen)]="editing" [closePredicate]="canClose">
  <h2 id="edit-title" i18n>Edit profile</h2>
  <form [formGroup]="profile" (ngSubmit)="save()">...</form>
  <footer>
    <form method="dialog"><button yetiButton type="submit" emphasis="medium" i18n>Discard</button></form>
  </footer>
</dialog>
```

```ts
protected readonly editing = signal(false);
protected readonly canClose = () => this.profile.pristine;
```

A dialog in a shell, opened from a header button and closed by its own links on navigation, with no extra code:

```html
<header>
  <button yetiButton type="button" [yetiDialogOpener]="menu" i18n>Menu</button>
</header>
<dialog yetiDialog #menu="yetiDialog" aria-labelledby="menu-title">
  <h2 id="menu-title" i18n>Menu</h2>
  <nav aria-label="Site" i18n-aria-label>
    <a routerLink="/trails" i18n>Trails</a>
    <a routerLink="/huts" i18n>Huts</a>
  </nav>
  <footer>
    <form method="dialog"><button yetiButton type="submit" i18n>Close</button></form>
  </footer>
</dialog>
```

A dialog rendered by the client inside a `@defer` block and opened at once preloads the item: `provideYetiStyles({ preload: ['dialog'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/dialog/dialog.css`, loaded by `YetiDialog` as a counted link (section 13). The consumer writes nothing for the item beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css:201-207` maps `data-max` to `--_yeti-max`; `base/reset.css:11-12` exempts `dialog` from the universal margin rule, so the browser's centring survives; `base/prose.css:7` and `:12` space the dialog's children; `tokens/components.css:80-87` declares the dialog tokens.
3. **Cross-item rules:** none in `dialog.css`. The opener and the footer buttons are `yetiButton`s and load the `button` file.
4. **Tokens:** section 2's Tokens subsection; the package writes none.
5. **What breaks without the item file:** the dialog still opens modally, but with the browser's default border and padding and no width cap, the backdrop is the user agent's, the footer is not a row at the end edge, and the arrival and leaving have no fade. Nothing reports an error.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) found only `container`, `grid`, `table`, and the attribute name `hidden` producing a utility (measured; `prototypes/yeti-tailwind/results/collisions.json`); `dialog` produced none.

### Platform features to adopt when the browser target moves

- **`closedby="any"`** on the dialog: the platform's own light dismiss for a modal dialog, which would replace the Backdrop press listeners. Safari lacks it (`dialog.js:5-6`), and `@mdn/browser-compat-data` 8.1.4, the copy ticket 01 installed, lists Safari as "preview" (read). The veto would then move to the `cancel` event alone.
- **`requestClose()`:** the same data lists it in Chrome 134, Firefox 139, and Safari 18.4, which is inside Baseline 2025, as building-blocks 1.8's correcting note now says (read; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 154). It would let the Backdrop press go through `cancel`, so one listener could ask `closePredicate`.
- Neither changes the server HTML or the opener.

### Single-page-application pieces relied on

[navigation-close](navigation-close.md) (`injectCloseOnNavigation`), [generated-ids](generated-ids.md) (`injectYetiId`), the [events](events.md) rules for `opened` and `closed`, and ADR 0060's styles service for route changes. It does not use [fragment-links](fragment-links.md).
