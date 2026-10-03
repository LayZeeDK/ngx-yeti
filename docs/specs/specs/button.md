# Spec: button (component)

Ticket: [76. Spec: button (component)](../issues/76-spec-button.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 26, Part 1, and "Aria decisions (2026-10-03)" row 27 (with [audit 0003](../audits/0003-third-wave.md) H1); [ADR 0022](../adr/0022-button-declares-no-listeners.md); [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 94 to 96; [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) (decisions 2, 6, 8, 9, 10, 38, 40, and 42); [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0021](../adr/0021-dialog-is-a-directive-on-the-native-dialog.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) (point 9 for the busy ring), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md); [ledger.md](../ledger.md) row A11Y-1a. `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x); `NGP/` is `github.com/angular/angular/packages/` at `5db6fc4453` (22.2.0). The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 94 and 107 to 111), and each is cited where it applies.

## Problem Statement

Yeti's `button` is "an action with a face: a hue, an emphasis, and a size, with every state taken from the element itself" (`Y/src/components/button/manifest.json`). It is one **Identity class**, `button`, which Yeti puts "on a button, an a, a submit input, or a label wrapping a radio or checkbox, nothing else", and three **Attributes**: `data-variant` (which hue's ladder it uses), `data-emphasis` (a solid fill, an outline, or text alone), and `data-size`. Every state comes from the element: hover, active, focus, `:disabled`, `aria-disabled="true"`, `aria-pressed="true"`, a wrapped input's `:checked` and `:disabled`, and `aria-busy="true"` (`Y/src/components/button/button.css`). The busy ring that a waiting button shows after its label is not in `button.css` at all: it is a rule of the `spinner` item, `.button[aria-busy="true"]::after` (`Y/src/components/spinner/spinner.css:5`, `:24`). The item has no **Module** and no events.

An application developer using the package cannot write `class="button"` or `data-variant="alert"`: a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). Written by hand, `data-emphasis="outline"` compiles and silently falls back to a solid fill; here it must fail to compile ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `button` **Item file** loaded while a button is on the page and removed when none is, and the `spinner` item file present whenever a button may be busy, or the busy ring silently disappears ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) point 9; ticket 23 measured that removing `spinner.css` removes every busy button's ring).

Three things make the item more than a class. A button sits in deferred and dehydrated regions of server-rendered pages, where any `click` listener on an `<a>` cancels its navigation, so the directive must declare no listener at all ([ADR 0022](../adr/0022-button-declares-no-listeners.md); [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) clause 3). A link that is a button has no native disabled state, so the package must say how a link is disabled. And Yeti draws a pressed toggle and a checked `label.button` only with colour, which forced-colours mode erases ([ledger.md](../ledger.md) A11Y-1a, measured in Chromium).

## Solution

Two directives in the secondary entry point `ngx-yeti/button` ([building-blocks.md](../building-blocks.md) Part 2 row 26; 1.3):

- **`YetiButton`**, the **Item directive**, on `button[yetiButton]`, `a[yetiButton]`, `input[yetiButton]`, and `label[yetiButton]` (the last one is this spec's addition to row 26, from Yeti's manifest note; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 107), `exportAs: 'yetiButton'`. It binds `button` as a static host class, and binds `data-variant`, `data-emphasis`, and `data-size` from the typed inputs `variant` (`YetiVariant`), `emphasis` (`YetiEmphasis`), and `size` (`YetiSizeControl`). It sets the static presence attribute `data-ngx-yeti-item-button` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), acquires the `button` and `spinner` item files when it is created, on the server too, and releases both when it is destroyed (ADR 0060 points 2 and 9; acquiring `spinner` unconditionally is this spec's reading; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 109). It declares no listener, no output, no model, and no `disabled`, `pressed`, or `busy` input.
- **`YetiButtonDisabledLink`**, a **Free behaviour directive**, on `a[yetiButton][disabled]`, `exportAs: 'yetiButtonDisabledLink'`. It takes a `disabled` input and, while it is true, marks the link `role="link"` and `aria-disabled="true"`, which Yeti's CSS already styles. The consumer binds the link's `href` or `routerLink` to `null` at the same time, so the link becomes an HTML placeholder link ([ADR 0022](../adr/0022-button-declares-no-listeners.md) point 2). Putting the link's disabled state on its own directive, rather than a `disabled` input on `YetiButton`, keeps a `[disabled]` binding on a `button` host going to the native property ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 108; the options are recorded there).

The developer writes `<button yetiButton type="button" emphasis="medium">` where Yeti's docs write `<button class="button" type="button" data-emphasis="medium">`. An unset input renders no attribute, so Yeti's own default (`primary`, `high`, `md`) applies from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1).

Every state stays native and the consumer's (ADR 0003 point 3; Part 2 row 26): `disabled` on a `button` or `input`, the wrapped input's `checked` and `disabled` on a `label`, and `aria-pressed`, `aria-busy`, and `aria-disabled` on a `button`. The package adds one rule to its accessibility stylesheet, in `@layer ngx-yeti`, that draws the pressed and checked states under forced colours (A11Y-1a). Everything else is Yeti's CSS and the platform: activation by Enter and Space, form submission, `commandfor` with `command`, `popovertarget`, focus, and the focus ring. So a button behaves the same on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block.

## User Stories

1. As an application developer, I want to make a `button`, a link, a submit input, or a toggle label look like a Yeti button with one directive attribute, so that I never write Yeti's `button` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="button"` and `data-*` attributes, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want to pick the hue with a `variant` input typed by Yeti's `variant` vocabulary, so that `variant="danger"` compiles and `variant="red"` does not.
4. As an application developer, I want to pick how loud a button is with an `emphasis` input (`high`, `medium`, `low`), so that one main action per view stands out and the rest step back.
5. As an application developer, I want to scale the text and the padding together with a `size` input (`sm`, `md`, `lg`), so that a large button matches a large field in a row.
6. As an application developer, I want a static attribute such as `emphasis="low"` to type-check, so that I need no property binding for a constant.
7. As an application developer, I want an input I leave unset to render no attribute, so that Yeti's own default applies and the server HTML stays Yeti's minimal markup.
8. As an application developer, I want to bind every input from signals, so that the button follows my state under zoneless change detection.
9. As an application developer, I want `variant="black"` and `variant="white"` to keep their look on a painted band in both colour schemes, so that a call to action never vanishes into its band's own hue.
10. As an application developer, I want `<a yetiButton>` to look like a button and never be underlined, so that a navigation that looks like an action keeps its link semantics.
11. As an application developer, I want `<a yetiButton routerLink>` to work like any router link, so that the directive never takes over navigation.
12. As an application developer, I want `<input yetiButton type="submit">` styled as a button, so that a form written with a submit input matches the rest.
13. As an application developer, I want `<label yetiButton>` wrapping a checkbox or radio to be a toggle that needs no script, so that the choice submits with the form and the arrow keys move a radio group's choice.
14. As an application developer, I want my own `[disabled]` binding on a `button` or `input` host to reach the native `disabled` property, so that the platform blocks clicks, keyboard activation, and implicit submission.
15. As an application developer, I want to disable a button link with `[disabled]` and a `null` target, so that pagination and wizard links can be disabled.
16. As an application developer, I want a disabled link announced as a link that is unavailable, so that screen-reader users know it exists and cannot be followed.
17. As a keyboard user, I want a disabled link skipped by Tab and never followed, so that it behaves like a disabled control in every browser.
18. As an application developer, I want a toggle button that carries `aria-pressed` to look pressed while I bind it to `true`, so that my state drives the look with no class of mine.
19. As an application developer, I want a waiting button that carries `aria-busy="true"` and `aria-disabled="true"` to dim, show a progress cursor, and show Yeti's busy ring after its label, so that a wait looks like a wait with no spinner markup of mine.
20. As an application developer, I want the busy ring present whenever a button is busy, whether or not a standalone spinner is on the page, so that the ring never depends on another item's lifetime.
21. As an application developer, I want a waiting button to keep focus while it waits, so that keyboard and screen-reader users do not lose their place to the page body.
22. As an application developer, I want an icon beside the label sized to the text, so that `<button yetiIcon yetiButton>` works as Yeti's `class="icon button"` does.
23. As an application developer, I want `yetiButton` beside `[yetiDialogOpener]` on one `button`, so that the button that opens a dialog looks like any other button and opens the dialog before hydration and with JavaScript off.
24. As an application developer, I want `yetiButton` beside a dropdown's toggle, a tooltip's trigger, `yetiPrint`, `yetiStackChild`, or the `buttons` group's part directive on one element, so that I can build Yeti's documented compositions.
25. As an application developer, I want the directive to bind no attribute that another directive on the same element binds, so that compositions never fight over an attribute.
26. As an application developer, I want the `button` item file loaded when the first button renders and removed after the last leaves, so that I do not import `button.css` globally.
27. As an application developer, I want both item files in the server HTML when a server-rendered page has a button, so that the first paint is already a styled button, busy or not.
28. As an application developer, I want buttons right with JavaScript off under SSR and prerendering, so that forms submit, links navigate, toggle labels check, and dialog openers open before any script runs.
29. As an application developer, I want hydration to change nothing on a button, so that I get no `NG05xx` error and no flash.
30. As an application developer, I want a click made before hydration to reach my own `(click)` handler once the app is live, so that an early press is not lost.
31. As an application developer, I want a button inside a `@defer (hydrate on ...)` block to stay styled and native before and after the block hydrates, so that incremental hydration does not change it.
32. As an application developer, I want a button inside a `hydrate never` block to keep its styles for as long as it is on the page, so that a dehydrated button is not unstyled when a live one elsewhere leaves.
33. As an application developer, I want to know that a button inside a client-only `@defer` block needs `button` and `spinner` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
34. As an application developer using `withI18nSupport()`, I want translated button labels to hydrate without being re-rendered, so that localised pages keep the server's DOM.
35. As an application developer, I want template references (`#b="yetiButton"`, `#l="yetiButtonDisabledLink"`), so that both directives follow the package's `exportAs` rule.
36. As an application developer, I want to import both directives from `ngx-yeti/button`, so that a `@defer` block can split them with the rest of the item.
37. As an application developer, I want the input value types re-exported by name (`YetiVariant`, `YetiEmphasis`, `YetiSizeControl`), so that I can type my own signals that feed the inputs.
38. As an application developer, I want the usage rules stated (which element for which job, `type` on every `button`, how to disable a link, how to mark a toggle and a wait), so that I use the item as Yeti intends.
39. As a screen-reader user, I want a `button` announced as a button and a link as a link, so that what I hear matches what happens.
40. As a screen-reader user, I want a toggle announced as pressed or not pressed, or as checked or not checked, so that I know its state.
41. As a screen-reader user, I want an icon-only button to have a name, so that I hear "Close, button", not "button".
42. As a speech-input user, I want a button's name to contain its visible text, so that I can say "click Save".
43. As a keyboard user, I want every enabled button and link reachable by Tab and operated by Enter and Space as the platform does, so that I need no pointer.
44. As a keyboard user, I want the page's focus ring on every button, and on a toggle label while its hidden input has focus, so that I can see where focus is.
45. As a pointer user, I want every button, icon-only ones included, at least 24 by 24 CSS pixels, so that I do not miss it.
46. As a low-vision user, I want every label to contrast at least 4.5:1 with its fill at rest and under the pointer, in both colour schemes, so that I can read it.
47. As a forced-colours user, I want a pressed toggle and a checked toggle label drawn differently from their siblings, so that I can see which one is on.
48. As a user who prefers reduced motion, I want the busy ring to stop turning after one turn, so that a long wait does not animate forever.
49. As a package maintainer, I want the contract check to cover the three attributes and every value of their vocabularies, so that a pin move that adds a value or attribute fails before release.
50. As a package maintainer, I want the SSR smoke to assert the server HTML of every host kind and both item links, so that the first paint is proven.
51. As a package maintainer, I want the fixture app to render buttons on a prerendered and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
52. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default fails no test for no reason.
53. As a package maintainer, I want the class names `YetiButton` and `YetiButtonDisabledLink` checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.
54. As a package maintainer, I want a test that a `button` host's `[disabled]` binding sets the native property, so that no later input on `YetiButton` silently captures it.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/button/manifest.json`, `button.css`, `docs.md`, and `example.html`, in `Y/src/components/spinner/spinner.css` and `manifest.json`, and in `Y/schema/vocabulary.json`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `button`, `component`, `Forms and Actions` |
| `class` | `button` |
| `attributes` | `data-variant`: enum, vocabulary `variant` (`primary`, `secondary`, `success`, `warning`, `alert`, `danger`, `neutral`, `black`, `white`), default `primary`, "Which hue's ladder the button uses." `data-emphasis`: enum, vocabulary `emphasis` (`high`, `medium`, `low`), default `high`, "How loud: high is a solid fill, medium an outline, low text alone." `data-size`: enum, vocabulary `size-control` (`sm`, `md`, `lg`), default `md`, "Scales the text and the padding together." |
| `classes` | empty |
| `children` | `> svg` (min 0, max 1): "An optional icon, sized to the text." `> input` (min 0, max 1): "On a label.button, the radio or checkbox that makes it a toggle: hidden from sight, still focusable, pressed while checked." |
| `markers` | none |
| `tokens` | public: `--yeti-button-radius`, `--yeti-button-weight`, `--yeti-button-padding`, `--yeti-button-padding-block`, `--yeti-control-size`, `--yeti-border-width`, `--yeti-space-xs`, `--yeti-leading-tight`, `--yeti-duration-fast`, `--yeti-ease`, `--yeti-color-primary` and its `-subtle`, `-soft`, `-strong`, and `-text` stops, `--yeti-on-primary`, `--yeti-text-md`, `--yeti-space-sm`, `--yeti-opacity-muted`, `--yeti-color-focus`; private: `--_yeti-variant` and its `-subtle`, `-soft`, `-strong`, `-text` forms, `--_yeti-on-variant`, `--_yeti-size-text`, `--_yeti-size-space` |
| `a11y` | `requiredAttributes` empty; `keyboard`: "Enter / Space: Activates a button element; Enter follows a link." and "Space / Arrow keys: On a label.button toggle, Space checks its input; the arrow keys move the choice within a radio group."; `notes`: "Put the class on a button, an a, a submit input, or a label wrapping a radio or checkbox, nothing else. Use button for actions and a for navigation. An icon-only button needs an aria-label. A toggle is a label wrapping a native radio or checkbox, which needs no script, or a button with aria-pressed, which needs your script to move it; a button that is waiting sets aria-busy=\"true\" together with aria-disabled=\"true\", and your handler ignores presses while it waits." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: `inline flexbox`, `logical properties`; `guarded`: empty. The `:has()` rules are not listed ([upstream-bugs.md](../upstream-bugs.md) Y8; `:has()` is inside Baseline 2025, building-blocks 1.2) |
| `since` | `7.0.0` |

How it works, in `@layer yeti.components`: `.button` is an inline flex row, at least the control height plus whatever the size's space step exceeds the default by (`button.css:13`), with a border and fill in the variant colour and the variant's "on" colour for text. `:not([data-variant])` and `:not([data-size])` rules supply the defaults only when the attribute is absent. `[data-emphasis="medium"]` makes the fill transparent and keeps the border; `[data-emphasis="low"]` makes both transparent. Hover and active step to the strong stop (high) or the subtle tint (medium, low). `.button:is([aria-pressed="true"], :has(> input:checked))` fills with the strong stop (`:83-87`), and a pressed medium or low toggle keeps that fill on hover (`:74-78`). `.button:is(:disabled, [aria-disabled="true"], :has(> input:disabled))` sets `opacity: var(--yeti-opacity-muted)` and `cursor: not-allowed`, and keeps the resting colours on hover (`:88-106`). A wrapped radio or checkbox is visually hidden but stays in the Tab order, and the label draws the focus ring with `--yeti-color-focus` while the input is `:focus-visible` (`:111-128`). `.button[aria-busy="true"]` dims and sets `cursor: progress`, after the disabled rule so a busy button keeps the progress cursor (`:131-134`). The ring itself is `spinner.css`'s `.button[aria-busy="true"]::after`: a one-em ring in `currentColor` turning by `yeti-spin` for `--yeti-motion-iterations` turns (`spinner.css:5-15`, `:24-28`), which is one turn under reduced motion (spinner manifest). An `input` host is a replaced element and draws no `::after`, so a busy submit input shows no ring (inferred from CSS generated-content rules, not measured).

Attributes left to the consumer (ticket 26 rows 94 to 96 map all three; nothing of Yeti's is left out): the element itself, its `type`, `href`, `disabled`, `name`, and `value`; the wrapped input of a toggle label; `aria-pressed`, `aria-busy`, and `aria-disabled` on a `button` (Part 2 row 26; ADR 0003 point 3); and the name of an icon-only button (building-blocks 1.10, Names; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 40).

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `button` | static host class on `YetiButton`'s four selectors | always | ADR 0003 point 1; Part 2 row 26 |
| Attribute `data-variant` | which hue's ladder | input `variant`: `YetiVariant \| undefined`, bound `[attr.data-variant]`, `null` when unset | unset renders nothing; Yeti's `primary` applies. `variant` is not an HTML attribute | ticket 26 row 94 (R) |
| Attribute `data-emphasis` | how loud | input `emphasis`: `YetiEmphasis \| undefined`, `[attr.data-emphasis]` | unset renders nothing; Yeti's `high` applies. Not an HTML attribute | ticket 26 row 95 (R) |
| Attribute `data-size` | text and padding scale | input `size`: `YetiSizeControl \| undefined`, `[attr.data-size]` | unset renders nothing; Yeti's `md` applies. Static form: `inert` (below) | ticket 26 row 96 (R); building-blocks 1.4 |
| Children `> svg`, `> input` | an icon; a toggle label's input | the consumer's elements; no directive | not applicable | manifest `children`; building-blocks 1.1 (a child styled only by element and position gets no directive) |
| State `:disabled`, `:has(> input:disabled)`, `:has(> input:checked)` | disabled, checked | native state on the consumer's element or wrapped input | not applicable | ADR 0003 point 3; ADR 0022 |
| State `aria-pressed`, `aria-busy`, `aria-disabled` on a `button` | pressed, busy, focusably disabled | the consumer's attributes, bound from the consumer's signals | not applicable | Part 2 row 26; ADR 0003 point 3; "Aria decisions" row 27 |
| State `role="link"` and `aria-disabled="true"` on a disabled `a` | a placeholder link | `YetiButtonDisabledLink`, from its `disabled` input | `null` while not disabled | ADR 0022 point 2; this spec's directive split ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 108) |
| Static `disabled` on an `a` | not Yeti's; not valid HTML on `a` | `YetiButtonDisabledLink` binds `'[attr.disabled]': 'null'` | kind `removed` (below) | building-blocks 1.4; ticket 50 decision 9 |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Tokens (manifest `tokens`, public) | radius, weight, padding, control size, border, gap, leading, transition, the primary ladder, text and space defaults, muted opacity, focus colour | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--yeti-spinner-duration`, `--yeti-spinner-width`, `--yeti-motion-iterations` | the busy ring | the consumer's | not applicable | ADR 0004; spinner manifest |
| Private tokens (`--_yeti-*`) | private | never read or written, by the package's code or its accessibility rule | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-button=""` on `YetiButton`'s host only | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2; ticket 50 decision 6 |
| Cross-item file | `spinner.css` holds the busy ring | `YetiButton` acquires `spinner` with `button` | always, while a `YetiButton` lives ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 109) | ADR 0060 point 9; Part 2 row 26 |
| Package CSS | none in Yeti for `forced-colors` | one rule in `@layer ngx-yeti` for the pressed and checked states | in the package's accessibility stylesheet | ledger A11Y-1a; map, Package CSS for accessibility |
| Injection token | not Yeti's | none: the item has no parts that read a parent | not applicable | building-blocks 1.9 |

The `inert` kind for `size` (building-blocks 1.4; ticket 26 row 96): HTML's `size` means something only on text-like `input` types and `select`. On Yeti's four hosts (`button`, `a`, a submit `input`, `label`) it does nothing, so a static `size="lg"` stays on the host beside `data-size="lg"` and the directive binds nothing for it. An attribute the host does not define changes no DOM structure, so hydration and the hydration constraints are unaffected (inferred).

The `removed` kind for `disabled` on `YetiButtonDisabledLink`: a static `<a yetiButton disabled>` is accepted (a link that is always disabled). The directive binds `'[attr.disabled]': 'null'`, with a source comment saying `disabled` is not an attribute of `a`, so the server HTML has none; hydration writes the static value back and the `null` binding removes it in the same pass, so the final DOM equals the server's (ticket 50 decision 9). `a[disabled]` matches no Yeti rule (`button.css` keys on `:disabled`, which an `a` never matches), so no frame can paint differently; layer 4 still asserts the attribute is gone after hydration.

`YetiButtonDisabledLink` sets no presence attribute and acquires no item file: it is not an item's root directive, and its host always carries `YetiButton`'s presence attribute (ticket 50 decision 6; ADR 0045's scope note).

The input value types are Yeti's own, from the package's generated `yeti-types.ts`, re-exported by name and never redeclared ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5; ADR 0060 point 10). Each is a full vocabulary, so no `Extract` is needed.

**Module replaced:** none. Yeti's `button` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 26, "Yeti module: none"). The two things Yeti leaves to "your script" stay the consumer's: moving `aria-pressed` on a toggle button, and ignoring presses while a button is busy (manifest `a11y.notes`).

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads the public tokens the manifest lists; the variant and size it shows read the matching `--yeti-color-<variant>` ladder and `--yeti-text-<size>` and `--yeti-space-<size>` steps through Yeti's private tokens. A busy button also reads the spinner's `--yeti-spinner-width`, `--yeti-spinner-duration`, and `--yeti-motion-iterations`. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`; the radius, weight, padding, and control size are **Derived tokens**, so they also take effect on one button and its descendants (`Y/src/guides/theming.md:38`). `--yeti-control-size` is also the field's height, so changing it on `:root` keeps a button and a field matched in a row (`docs.md`, "How it works"). **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- No parent, no parts, no injection token. The button stands alone or sits inside other items' elements: a `buttons` group (`buttons > .button`), an `affix` (`affix > .button`), a `field`'s form, a `dialog`, a `cluster`, a `nav`'s actions (Part 2, "Two findings": the `buttons > .button` and `affix > .button` children are nested elements, never the same element).
- No host directives. `YetiButton` hosts nothing from Aria ("Aria decisions" row 27; audit 0003 H1): `ToolbarWidget` injects a required parent `Toolbar` (`NC/src/aria/toolbar/toolbar-widget.ts:67`), so a button outside a group would fail. Inside a `buttons` group that hosts Aria Toolbar, the consumer writes the group's part directive `yetiButtonsItem` beside `yetiButton` on each button, and that directive, not this one, hosts `ngToolbarWidget`, its `busy` alias, and the `tabindex` hand-over; the [buttons](../issues/77-spec-buttons.md) spec owns them.
- Compositions on one element are written beside each other: `yetiIcon yetiButton` (Yeti's `class="icon button"`), `yetiButton yetiPrint="none"`, `yetiButton yetiStackChild`, `yetiButton yetiButtonsItem`, `yetiButton [yetiDialogOpener]`, a dropdown toggle with `yetiButton` (Yeti's dropdown example puts `class="button"` on the `popovertarget` button), and a tooltip trigger with `yetiButton`. `YetiButton` declares only `variant`, `emphasis`, and `size`, and binds only the class, the three `data-*` attributes, and its presence attribute, so no input name is declared twice with different types on any of these elements (building-blocks 1.4, shared vocabularies) and no attribute has two writers. In particular it binds no `aria-disabled`, `tabindex`, `role`, `type`, `commandfor`, `command`, `popovertarget`, or `aria-describedby`; the prototype of ticket 29 measured `ngToolbarWidget`'s `aria-disabled` binding overwriting a second writer's value (`prototypes/aria-buttons/README.md`, finding 2).
- The opener of a dialog is the dialog spec's free directive `[yetiDialogOpener]`, which renders `commandfor` and `command="show-modal"` from the dialog's id ([ADR 0021](../adr/0021-dialog-is-a-directive-on-the-native-dialog.md) point 1; [ADR 0013](../adr/0013-parts-name-their-targets-by-reference.md); building-blocks 1.8). The button item knows nothing about it, which keeps the dialog's bundle free of button code (architecture-guide P8's reason).
- `YetiButtonDisabledLink` matches only an `a[yetiButton]` that also has `disabled`, static or bound: Angular matches attribute selectors against property-binding names as well as static attributes (`NGP/compiler/src/render3/view/util.ts:213-217`, read). It reads nothing from `YetiButton`.
- The only other injection is the root styles service of ADR 0060, through `injectYetiItemStyles('button')` and `injectYetiItemStyles('spinner')` from `ngx-yeti/styles` as the last statements of `YetiButton`'s constructor ([setup](setup.md); [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 42, 45, and 109), which acquire its two item files on the server too and release them through `DestroyRef`. That service is the [setup](setup.md) spec's and ADR 0060's.
- Generated ids and the platform's relationship attributes: none of the item's own. The button renders no `id` and references none, so it does not use [generated-ids](generated-ids.md). Openers on the same element render theirs.

### 4. API

| Member | `YetiButton` | `YetiButtonDisabledLink` |
| --- | --- | --- |
| Class name | not among the 46 names `yeti.d.ts` exports at the Pin, so `Yeti`, not `NgxYeti` (ADR 0080 point 4; ticket 50 decision 10) | as left; the second directive is decision 108's option C ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 108) |
| Selector | `button[yetiButton], a[yetiButton], input[yetiButton], label[yetiButton]` (Part 2 row 26; `label` is this spec's addition, [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 107) | `a[yetiButton][disabled]` (ticket 50 decision 108) |
| `exportAs` | `yetiButton` | `yetiButtonDisabledLink` (building-blocks 1.3) |
| Entry point | `ngx-yeti/button` (building-blocks 1.3; ADR 0011 clause 10) | same |
| Inputs | `variant: YetiVariant \| undefined` (Yeti default `primary`); `emphasis: YetiEmphasis \| undefined` (`high`); `size: YetiSizeControl \| undefined` (`md`); each `input()` with no default value | `disabled: boolean`, `booleanAttribute`, default `false` |
| Host | static `class: 'button'`; static `data-ngx-yeti-item-button: ''`; `[attr.data-variant]`, `[attr.data-emphasis]`, `[attr.data-size]` from the inputs, `null` when unset | `[attr.role]`: `'link'` while `disabled()`, else `null`; `[attr.aria-disabled]`: `'true'` while `disabled()`, else `null`; `'[attr.disabled]': 'null'` with its source comment |
| Providers | none | none |
| Injection | the ADR 0060 styles service, through `injectYetiItemStyles('button')` and `injectYetiItemStyles('spinner')` ([setup](setup.md)) | none |
| Models, outputs, methods, listeners | none ([ADR 0022](../adr/0022-button-declares-no-listeners.md) point 1) | none (ADR 0022 point 1 applies to it as well) |
| Lifecycle | its constructor ends with `injectYetiItemStyles('button')` and `injectYetiItemStyles('spinner')` from `ngx-yeti/styles`, after anything there that can throw (nothing does today), which acquire the `button` and `spinner` item files, on the server too, and release both through `DestroyRef` (ADR 0060 points 2 and 9; [setup](setup.md); ticket 50 decisions 42, 45, and 109) | none |

No input default differs from Yeti's (ADR 0070 rule 1). A static attribute type-checks as a string literal under `strictTemplates`, so `emphasis="low"` compiles and `emphasis="quiet"` does not (ADR 0070 rule 2).

`YetiButton` declares no `disabled` input. Angular sets a bound property on a directive input instead of on the element whenever a directive on the element declares that input (`setPropertyAndInputs` returns after `setAllInputsForProperty` matched, `NGP/core/src/render3/instructions/shared.ts:259-265`, read), so a `disabled` input on `YetiButton` would take `[disabled]="saving()"` away from a `button`'s native property. ADR 0022's considered options reject the other way out, an input that binds native `disabled` on every host. The anchor's disabled state therefore lives on `YetiButtonDisabledLink`, whose selector never matches a `button`, `input`, or `label` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 108).

`YetiButton` declares no `pressed`, `busy`, `ariaDisabled`, `disabledInteractive`, or `type` input: those states are the consumer's (Part 2 row 26; ADR 0003 point 3), and a focusable-disabled input is not offered in the first milestone ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 111). Inside a `buttons` group the `busy` name belongs to `yetiButtonsItem` ("Aria decisions" row 27), and `YetiButton` must not declare it.

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiButton` on a `button` for an action, on an `a` for navigation, on an `input type="submit"` where a form uses a submit input, or on a `label` that wraps exactly one `input type="checkbox"` or `type="radio"` as its first-level child, and on nothing else (manifest `a11y.notes`; `docs.md`, Accessibility). The class changes the look, not the role.
2. Give every `button` host an explicit `type`: `type="button"` for an action, `type="submit"` only for the form's submit (building-blocks 1.10, "triggers are `<button type="button">`"; Yeti's examples). The directive binds no `type`.
3. Disable a `button` or `input` host with its own native `disabled`, static or bound (`[disabled]="saving()"`); disable a toggle label through its wrapped input's `disabled` (ADR 0022; ADR 0003 point 3).
4. Disable a link with two bindings together: `[disabled]` on the `a`, and its `href` or `routerLink` bound to `null` while disabled. A disabled link that keeps its target still navigates; an enabled `a[yetiButton]` without a target is not focusable (ADR 0022 point 2 and consequences). Import `YetiButtonDisabledLink` wherever a template binds `[disabled]` on an `a[yetiButton]`; without it the compiler reports NG8002, because `disabled` is not a property of `a` (building-blocks 1.9; inferred from the binding rule, not run). Do not write a static `role` or `aria-disabled` on such a link.
5. A toggle is a `label` wrapping a native checkbox or radio, which needs no script, or a `button` carrying `aria-pressed`, bound from a signal: `[attr.aria-pressed]="bold()"` with the consumer's own `(click)` handler moving it. `aria-pressed` is state a person changes, so it is bound, never written statically on a toggle that changes ([Research: where Angular Aria's attribute directives fit Yeti's own markup](../research/aria-on-yeti-markup.md), row 2; ADR 0003 point 4). Never put `aria-pressed` on an `a` or a `label`.
6. A toggle uses `emphasis="medium"` or `"low"`, as all of Yeti's toggle examples do, because their pressed state changes from no fill to a solid fill; a high-emphasis toggle changes only from one shade of its hue to a darker one ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 94).
7. A button that waits carries `[attr.aria-busy]` and `[attr.aria-disabled]` together, both `'true'` while it waits, and its handler ignores presses until the wait ends (manifest `a11y.notes`). It keeps focus because it stays enabled. A busy submit button still submits on Enter and on click, so the form's submit handler checks the state too (ADR 0022 consequences). Its visible label says what is happening ("Saving"), and the result is announced by the consumer's own live region where it is a status message (WCAG 4.1.3). Inside a `buttons` group that hosts Aria Toolbar, the `aria-disabled` half goes through `yetiButtonsItem`'s `busy` instead ("Aria decisions" row 27).
8. An icon-only button has a name. The package's examples give the SVG `role="img"` and an `aria-label`; an `aria-label` on the button itself is equally accepted (`docs.md`, Accessibility; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 40). A decorative icon beside a text label has `aria-hidden="true"`, so the name is the visible text (WCAG 2.5.3).
9. Do not write `class="button"`, `data-variant`, `data-emphasis`, `data-size`, or `data-ngx-yeti-item-button` statically on a host. The directive binds them, and hydration writes a static attribute back before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"; ADR 0070 consequences). A value newer than the pin goes through `$any` (`[variant]="$any('accent')"`, ADR 0070).
10. Put no `(click)` handler on an `a[yetiButton]`; an action is a `button` (rule 1). A `click` listener on an `<a>` makes Angular's dispatcher cancel its navigation inside a still-dehydrated block (ADR 0011 clause 3). `routerLink` adds Angular's own listener to the link, and clause 3 applies to it as it does to any router link (inferred).
11. Bind every input from values that are the same on the server and the client, never from a browser-only read. The hydration constraints require the same DOM on both sides.
12. Import `YetiButton` in every component whose template writes `yetiButton`. A **Forgotten import** with only static inputs renders the browser's own button with no error; a bound input (`[variant]`) makes the compiler report it (NG8002), and so does a template reference naming the `exportAs` (NG8003) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `button` | Angular Material `MatButton` |
| --- | --- | --- |
| Shape | an attribute directive on the consumer's `button`, `a`, `input`, or `label`; no template | a component on `button` and `a` with a template around the content (`NC/src/material/button/button.ts:28-42`) |
| Look | `variant` (9 hues), `emphasis` (`high`, `medium`, `low`), `size` (`sm`, `md`, `lg`), Yeti's vocabularies | the `matButton` appearance (`text`, `filled`, `elevated`, `outlined`, `tonal`) and the legacy `color` |
| Disabled `button` | the consumer's native `disabled`, untouched | a `disabled` input that binds `[attr.disabled]` (`button-base.ts:60`, `:111-121`, `:205-207`) |
| Disabled `a` | a placeholder link: `role="link"` and `aria-disabled="true"` from `YetiButtonDisabledLink`, target `null` by the consumer, no listener | `aria-disabled`, `tabindex="-1"`, and a `click` listener that cancels navigation (`button-base.ts:193-203`, `:216-221`, and `_setupAsAnchor` at `:223`) |
| Focusable disabled | not offered as an input; the consumer's `aria-disabled` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 111) | `disabledInteractive` (`button-base.ts:126-140`) and an `aria-disabled` input (`:123-124`); a global default in `MAT_BUTTON_CONFIG` |
| Busy | the consumer's `aria-busy` and `aria-disabled`; Yeti draws the ring | a `showProgress` input that sets a class (`button-base.ts:59`, `:155-156`) |
| Toggle | the consumer's `aria-pressed`, or a native input in a `label` | a separate `MatButtonToggle` with its own group and value |
| Forced colours | one package rule for the pressed and checked states (A11Y-1a) | a high-contrast stylesheet per component (`button.ts:35`), and for the toggle an overlay border (`button-toggle.scss:267-280`) |
| `exportAs` | `yetiButton`, `yetiButtonDisabledLink` | `matButton, matAnchor` (`button.ts:39`) |

Borrowed: the directive-on-native-element shape, one class for the button's look on every host, and the forced-colours technique of drawing a checked toggle with a border, because the browser renders a border in a system colour where it does not paint a background (Material's comment at `button-toggle.scss:268-270`). Not borrowed: the template, the anchor click blocker (ADR 0022), the `disabled` input that owns native `disabled` (ADR 0003 point 3; ADR 0022), `showProgress` and `disabledInteractive` as inputs (Part 2 row 26), and the config token (building-blocks 1.4, no defaults token by default).

### 6. Implementation level and primitives

Native platform, level 1 (Part 2 row 26; building-blocks 1.2). Row 26's reason: "the element is the behaviour". Activation, focus, the Tab order, form submission, `disabled`, a placeholder link's unfocusability, a native checkbox's and radio group's keys, and `commandfor` with `command` are the platform's. `@angular/aria` has no button pattern, and its Toolbar belongs to the `buttons` group's part directive, not to this item ("Aria decisions" row 27). `@angular/cdk` is not used: `FocusMonitor` is not needed because Yeti styles `:focus-visible` itself (row 26), and the forced-colours rule takes the CDK `high-contrast` mixin's shape, `@media (forced-colors: active)`, as plain CSS (`NC/src/cdk/a11y/_index.scss:48-65`; building-blocks 1.2). The Angular layer is host bindings over `input()` signals and the two item acquisitions; no `effect`, no timer, no observer, no render callback. Row 26 does not class the item as types only; it differs from that definition only by the second item acquisition and the disabled link's three bindings.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** Button (`APG/button/button-pattern.html`), including the toggle button with `aria-pressed`. Ticket 17 found Yeti conforming (section 4.6, measured: three buttons, then the checkbox input, rings; Space toggles the wrapped checkbox in all engines).
- **Roles:** from the element. A `button` and a submit `input` are `button`; an `a` with a target is `link`; a disabled `a` is a placeholder with `role="link"` and `aria-disabled="true"`; a toggle `label` adds nothing, and its input is `checkbox` or `radio`.
- **States:** `disabled` (native), `aria-pressed` (consumer), `aria-busy` with `aria-disabled` (consumer), `checked` (the wrapped input's), `aria-disabled` on a disabled link (`YetiButtonDisabledLink`).
- **Names:** from content, or from the consumer's `aria-label` or an SVG's `role="img"` and `aria-label` on an icon-only button (usage rule 8). The directive declares no name input (building-blocks 1.10, Names).

| Key | Native `button`, submit `input` | `a` with a target | Disabled `a` | Toggle `label` | Record |
| --- | --- | --- | --- | --- | --- |
| Tab, Shift+Tab | reaches every enabled one, `aria-disabled` and `aria-busy` ones included; skips natively disabled ones | reaches it | skips it (no `href`) | reaches the hidden input, not the label | native; manifest `a11y.keyboard` |
| Enter | activates; on a submit button submits the form | follows the link | nothing | no change of state (the platform's) | native |
| Space | activates | scrolls the page (the platform's) | scrolls | checks or unchecks the input | native |
| Arrow keys | nothing | nothing | nothing | move the choice within a radio group | native |

Focus: the page's focus ring on `:focus-visible`, never removed (`docs.md`, Accessibility); on a toggle label the label draws the ring while its input is `:focus-visible` (`button.css:126-129`). The package adds no `tabindex` and moves no focus.

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.1.1 Non-text Content | An icon-only button is named by usage rule 8; a decorative SVG is hidden. Axe's `button-name`, `link-name`, and `svg-img-alt` rules in the **Story gate** catch an unnamed control, and every story's play function asserts each control's computed name (ADR 0015 point 4). |
| 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value | Roles and states come from the element and the consumer's ARIA; the disabled link's state is `aria-disabled="true"` with `role="link"`, in the server HTML. Play functions of `button--disabled`, `button--toggle`, `button--toggle-input`, and `button--busy` assert role, name, and state. |
| 1.4.1 Use of Color | Disabled and busy add opacity and a cursor change, not colour alone. A pressed toggle is drawn by fill alone; usage rule 6 keeps it on emphases where the fill appears or disappears, and `button--toggle` asserts at least 3:1 between the pressed and resting fills (building-blocks 1.10; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 94). |
| 1.4.3 Contrast (Minimum) | Yeti says "Text over every fill meets AA in both color schemes; the test suite checks each variant" (`docs.md`). Axe checks the resting state in every story; `button--variants` also asserts at least 4.5:1 on hover and on press for every variant and emphasis, in the light scheme and in a container with the consumer's `color-scheme: dark`, with the exact WCAG formula on computed colours, unrounded (ADR 0015 point 3; ticket 50 decision 8). Disabled and busy buttons are inactive and exempt. |
| 1.4.11 Non-text Contrast | A button's boundary needs no contrast when its text identifies it (Understanding 1.4.11). The pressed state against the resting state is asserted as in 1.4.1. An icon-only button's SVG is asserted at least 3:1 against its fill, as the icon spec does for its standalone story. Under forced colours the pressed and checked states are drawn by the package's rule (A11Y-1a, below). |
| 2.1.1 Keyboard | Native; the directive adds no key handling. |
| 2.4.7 Focus Visible | Yeti's ring on every host, the toggle label's included; Yeti's own test asserts it appears on keyboard focus only. Layer 4 repeats it. |
| 2.5.3 Label in Name | A button's name is its visible text; a decorative icon is hidden (usage rule 8). Play functions assert the exact name. |
| 2.5.8 Target Size (Minimum) | A button's block size is at least `--yeti-control-size` (`button.css:13`). `button--sizes` asserts every size, and an icon-only button at every size, at least 24 by 24 CSS pixels ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 38; ticket 17 found axe's `target-size` passing on Yeti's button example). |
| 2.2.2 Pause, Stop, Hide | The busy ring is the spinner's indefinite turn, which ledger row A11Y-13 (owned by the [spinner](../issues/88-spec-spinner.md) spec) reads as essential to a loading activity and which stops after one turn under reduced motion. |
| 3.2.2 On Input | A toggle label changes only its own input's checkedness; nothing submits or navigates on change unless the consumer's handler does. |

**Ledger rows owned:** A11Y-1a ([ledger.md](../ledger.md); Part 2 row 26). Under forced colours a pressed toggle (`aria-pressed="true"`) and a checked `label.button` look like their siblings, because Yeti draws both states with a background colour and ships no `forced-colors` rule (measured in Chromium; Firefox keeps a faint fill). The package adds one rule to its accessibility stylesheet, inside `@layer ngx-yeti` and `@media (forced-colors: active)`, on `.button[aria-pressed="true"]` and `.button:has(> input:checked)`, drawing the state with a border in a system colour, after Material's button toggle (`NC/src/material/button-toggle/button-toggle.scss:267-280`) and the CDK `high-contrast` mixin's query. It selects Yeti's state hooks only, reads no private token, and names no package class (map, Package CSS for accessibility; [setup](setup.md), the package's accessibility stylesheet). The exact declarations are the implementer's within those limits; layer 4 asserts the outcome. This spec writes the first rule of that stylesheet for the button, and the [buttons](../issues/77-spec-buttons.md) spec relies on the same rule for its group's buttons (A11Y-1b). The row's "What the package adds" stands as written.

### 8. Rendered HTML

Consumer markup, after Yeti's examples:

```html
<button yetiButton type="button">Save</button>
<button yetiButton type="button" emphasis="medium" [attr.aria-pressed]="bold()" (click)="bold.set(!bold())">Bold</button>
<button yetiButton type="submit" [attr.aria-busy]="saving()" [attr.aria-disabled]="saving()">Saving</button>
<label yetiButton emphasis="medium"><input type="checkbox" name="offline" checked /> Keep maps offline</label>
<a yetiButton variant="secondary" size="lg" routerLink="/docs">Read the docs</a>
<a yetiButton [disabled]="last()" [routerLink]="last() ? null : ['/page', next()]">Next</a>
```

Server HTML and the hydrated DOM are the same. Each host carries its directive attribute (`yetibutton=""`), any static input attributes (`emphasis="medium"`, `size="lg"`, the latter inert), `class="button"`, the bound `data-*` attributes, and `data-ngx-yeti-item-button=""`, and no `data-*` for an unset input. The toggle carries the consumer's `aria-pressed="false"`; the busy button carries the consumer's `aria-busy` and `aria-disabled` only while `saving()` is true (an attribute binding to `false` renders `"false"`, which Yeti's `="true"` selectors ignore). The `label` keeps its `input` as written. The enabled `Next` link carries `href` from `routerLink`; the disabled one carries `role="link"`, `aria-disabled="true"`, no `href`, and no `disabled`. Neither directive adds `type`, `tabindex`, an id, or a `jsaction`.

The server also writes the item links into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>components/button/button.css?v=<pin>` and then `<url>components/spinner/spinner.css?v=<pin>` (`Y/src/yeti.css:40`, `:54`), with `url` defaulting to `yeti-css/` relative to `<base href>`, each with `data-ngx-yeti-styles="<item>"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, 5, and 9). The client adopts the links at bootstrap.

States: a button has no closed or open state of its own. Pressed, busy, disabled, and checked are the attributes above, each in the server HTML when the consumer's state says so.

The delta from Yeti's docs markup: the consumer writes `yetiButton` and input names where the docs write `class="button"` and `data-*` names; a disabled link writes `[disabled]` and a `null` target where Yeti's state table would have the author write `role` and `aria-disabled` by hand; a toggle's `aria-pressed`, a wait's `aria-busy` and `aria-disabled` are bindings rather than static values.

### 9. Animation

Yeti's own transitions only: `background-color`, `border-color`, and `color` over `--yeti-duration-fast` with `--yeti-ease` on hover, press, and state changes (`button.css:29-33`), and the busy ring's `yeti-spin` (`spinner.css:12`, `:28-30`). The directive adds no class and no inline style for them and awaits no transition (building-blocks 1.6 point 1). Reduced motion is Yeti's: its tokens collapse the durations, and the ring turns once (`--yeti-motion-iterations`; building-blocks 1.6 point 4). A button the consumer inserts or removes with `@if` may carry a class-form `animate.enter` or `animate.leave` of the consumer's or Yeti's `enter` utility; a server-rendered button never takes `animate.enter` (ADR 0011 clause 12). The item links stay until Angular removes the last host, because removal waits for the DOM (ADR 0060 point 4).

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes, the disabled link's `role` and `aria-disabled`, the consumer's own ARIA, and both item links in `<head>` (section 8). Everything at first paint is a host binding or the consumer's binding (ADR 0011 clause 1).
- **Pre-hydration state:** none of the directives' bindings can be changed by a person or a Yeti module before hydration. A person can check a toggle label's input before hydration; that is the input's own checkedness, which the directives never bind. Once a person has changed it, a re-written static `checked` attribute no longer changes it (HTML's dirty checkedness flag; inferred, not measured), and the consumer who reads the choice binds it through Angular forms or a `change` listener, which event replay delivers (building-blocks 1.11).
- **Before hydration:** neither directive creates a node, reads layout, starts a timer or observer, or touches `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is `YetiButton`'s two item acquisitions, which ADR 0060 runs on the server too. A button submits its form, a link navigates, a toggle label checks, and a `[yetiDialogOpener]` button opens its dialog natively (ADR 0011 clause 2, measured in ticket 18 for the dialog).
- **Event replay:** neither directive declares a listener (ADR 0022 point 1), so neither adds a `jsaction`, and nothing of theirs replays. A consumer's `(click)` on a `button[yetiButton]` replays after hydration as any template listener does (building-blocks 1.11). The consumer's handler sets state before any `preventDefault()`, because `preventDefault()` throws during replay (building-blocks 1.5); a toggle's handler only flips a signal.
- **Full hydration:** each host is claimed as it is; bindings computed from the same inputs give the same values (usage rule 11); 0 style mutations (ADR 0060 point 5, measured for the mechanism). A static `disabled` on a disabled link is written back and removed again in the same pass (section 2).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the button and its links; a dehydrated host holds the `button` link for as long as it is on the page (ADR 0060 point 4). A `hydrate on interaction` block holding a button hydrates on the press and replays it to the consumer's handler.
- **`hydrate never`:** the button is its server HTML and stays styled while its host is connected, whatever live buttons do (ADR 0060 point 4; ADR 0045's presence attribute is what the check queries). On a host shared with `icon` or `print`, each item's presence attribute keeps its own link (ADR 0045). It submits, navigates, checks, and opens dialogs natively; the consumer's handlers never run. A button the server rendered busy inside such a block keeps its dim and cursor, but its ring depends on the `spinner` link, which no presence attribute on the button holds once every live button and spinner has left (inferred; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 110).
- **Client-only `@defer`:** the item files are fetched when `YetiButton` is constructed, which can show unstyled frames (the browser's own button, an underlined link); the consumer closes the gap with `provideYetiStyles({ preload: ['button', 'spinner'] })` (ADR 0060 point 6; [setup](setup.md)).
- **`withI18nSupport()`:** button labels are usually translated with `i18n`, and an icon-only button's `aria-label` with `i18n-aria-label`. The directives add no `i18n` block; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** inputs are `input()` signals read by host bindings, so a changed input refreshes its attribute with no zone (map, Standing rulings, item 43; ADR 0070 rule 4). The consumer's `aria-pressed`, `aria-busy`, and `aria-disabled` must come from signals for the same reason (usage rules 5 and 7).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): every button is styled and keeps its native behaviour: a submit button submits, a link navigates, a toggle label checks and submits its value, a disabled link is a placeholder, and a dialog opener opens its dialog. Lost: the consumer's own handlers, and so a `button` toggle's `aria-pressed` never moves and a busy state never starts. A client-only application gets no such promise.
- **Hydration boundary:** a button needs none of its own. A dialog opener and its dialog share one boundary unless the dialog has a static `id` (ADR 0021 consequences), which is the dialog spec's.

### 11. Hydration constraints

The item complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; the `data-*` attributes, `role`, and `aria-disabled` come from inputs whose values usage rule 11 keeps equal on both sides.
- **No direct DOM manipulation:** the directives write nothing outside host bindings. The item links are the ADR 0060 service's.
- **Valid HTML:** the directives change no element. A `label` host holds phrasing content and its one input; a `button` holds no interactive content (an `a` or another `button` inside it would be invalid and the parser may repair it, so the consumer's markup must be valid as written). The `removed` binding keeps `disabled` off an `a`.
- **`preserveWhitespaces`:** the directives have no template. White space between an icon and its label is the consumer's text; the button's `gap` spaces the two flex items whatever the setting.
- **No output branched on the platform:** none.
- **Static attributes the directives bind:** usage rule 9 keeps the consumer from writing them, and usage rule 4 from writing `role` or `aria-disabled` on a link that takes `[disabled]`. The static `disabled` on a link is the decided exception (ticket 50 decision 9). The static `size` is `inert` and never bound.

### 12. Single-page application

None of the item's own: it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). An `a[yetiButton]` with `routerLink` navigates through the Router. A bare `href="#contact"` on an `a[yetiButton]`, as in Yeti's starter page, is a consumer fragment link: under `<base href>` it reloads the document unless the [fragment-links](fragment-links.md) document listener runs, which `provideYetiFragmentLinks()` guarantees ([setup](setup.md); ledger A11Y-16). Because `yetiButton` adds no `click` listener, that listener handles such a link like any other. On a route change, a route's buttons leave with it, and each item link is removed in the animation frame after no host carrying its presence attribute is connected and its live count is zero (ADR 0060 point 4). A button in the persistent shell keeps both links.

### 13. Item file

`yeti-css/css/components/button/button.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `YetiButton` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:40`, after `breadcrumbs` and before `buttons`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-button` has left the DOM and the live count is zero.

**Cross-item file acquired: `spinner`** (`yeti-css/css/components/spinner/spinner.css`, `Y/src/yeti.css:54`), because the busy ring is `spinner.css`'s rule (ADR 0060 point 9; ticket 23, measured in three engines). `YetiButton` acquires it with `button`, unconditionally, and releases it on destroy. ADR 0060 point 9 says "while a button is busy", but the busy state is the consumer's `aria-busy` (Part 2 row 26), which no directive input sees, and row 26 names unconditional acquisition as "the smallest answer"; this spec takes it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 109). The button's host carries no spinner presence attribute, so in a dehydrated block a server-rendered busy button relies on a live button or spinner elsewhere for its ring (ticket 50 decision 110).

`YetiButtonDisabledLink` acquires nothing. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement, the always-loaded group (which holds the tokens, the reset, and the page's focus ring), the package's accessibility stylesheet (which holds A11Y-1a's rule), and optionally `provideYetiStyles({ preload: ['button', 'spinner'] })`.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attributes in the DOM, roles, names, and states in the accessibility tree, the item links, what a press does natively, and computed colours and sizes. It never asserts a private field or how the styles service counts. No test depends on a public token's default value or on a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): a size test compares with a probe styled `block-size: var(--yeti-control-size)`, and a colour test compares two computed colours or a computed ratio, never a token's text. Colours are read through a canvas-normalising helper, as Yeti's own `button.spec.js` does, because Chromium serialises an `oklch` page's computed colours as `oklch`. Hover and press reads wait for the element's running transitions to finish, as Yeti's test does with `getAnimations()`. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group and the package's accessibility stylesheet globally and the item files through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `button--default`: Yeti's example, three `type="button"` buttons (high, medium, low) in a `yetiCluster`. Asserts `class="button"`, `data-ngx-yeti-item-button`, and the `data-emphasis` values; no `data-variant`, `data-size`, `type` change, `tabindex`, role, or ARIA from the package; each is a `button` named exactly by its text. Tab reaches all three in order. Asserts one `<link data-ngx-yeti-styles="button">` and one `<link data-ngx-yeti-styles="spinner">` in `<head>`.
- `button--variants`: every variant at every emphasis, in a light-scheme container and a container with `color-scheme: dark`, and `black` and `white` on a `yetiBox` painted band. Asserts the text-to-fill ratio at rest, on hover, and on press is at least 4.5:1 for each, unrounded (ticket 50 decision 8). Asserts `black` and `white` keep the same computed fill in both schemes, after Yeti's own test.
- `button--sizes`: `sm`, `md`, and `lg`, each with text and icon-only (an SVG with `role="img"` and `aria-label`). Asserts each block size is at least the control-size probe's, `lg` taller than `md`, and every box at least 24 by 24 CSS pixels (2.5.8; ticket 50 decision 38). Asserts a static `size="lg"` leaves the inert `size` attribute beside `data-size="lg"`.
- `button--link`: `a[yetiButton]` with `routerLink`, and one with `href`. Asserts role `link`, `text-decoration-line` of `none` at rest and on hover, and the same height as a `md` `button` within 1 px, as Yeti's test does.
- `button--submit-input`: an `input yetiButton type="submit" value="Sign up"` in a form beside a field. Asserts the class, role `button`, name "Sign up", and that its height matches a `md` button within 1 px.
- `button--disabled`: a natively disabled `button` bound with `[disabled]`, a disabled submit `input`, a toggle label whose input is disabled, and a disabled link with `[disabled]` and a `null` `routerLink`. Asserts the `button` and `input` have `disabled` as a property and are skipped by Tab; the label's input is disabled; the link has no `href`, `role="link"`, `aria-disabled="true"`, no `disabled` attribute, is skipped by Tab, and is announced as a link that is unavailable (`toBeDisabled` through `aria-disabled`, name "Next"). Toggling the bound state off restores the native `disabled` property to `false`, the link's `href`, and removes `role` and `aria-disabled`. Asserts each disabled control's computed opacity equals a probe's `var(--yeti-opacity-muted)` and its cursor is `not-allowed`.
- `button--toggle`: three medium-emphasis toggle buttons bound to signals (Yeti's `buttons` example markup, outside a `buttons` group). Clicking and pressing Space on "Italic" flips its `aria-pressed` to `true`; the tree reports `pressed`. Asserts the pressed fill differs from the resting fill and is at least 3:1 against the page for medium and low emphasis, and records the ratio between the two states' fills against each other and against the page, the high-emphasis pair included (building-blocks 1.10; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 94). Hovering a pressed toggle keeps its pressed fill (`button.css:74-78`).
- `button--toggle-input`: a checkbox label and a two-radio segmented control of labels (`buttons/docs.md`'s billing example, without the group directive). Space on the focused checkbox checks it and the label's fill changes; ArrowRight moves the radio choice; focusing the input with the keyboard draws an outline on the label, and the input itself has no visible box. The tree reports `checkbox` "Keep maps offline" with its checked state.
- `button--busy`: a `type="submit"` button inside a form with `aria-busy` and `aria-disabled` bound to a signal. While busy: the button stays focusable and in the Tab order; the tree reports it disabled and its name is unchanged ("Saving", not including the ring); its `::after` has `content: ""` and a non-zero border (the ring from `spinner.css`); the cursor is `progress`. Releasing the signal removes both attributes and the ring. An unrelated `yetiSpinner` is not on the page, so the ring comes from the button's own acquisition.
- `button--icon`: `<button yetiIcon yetiButton>` with a decorative SVG and text, and an icon-only one named through the SVG (usage rule 8). Asserts both classes and both presence attributes on one host, the SVG's box equals the host's computed `font-size`, the names "Save" and "Close", and the icon-only SVG's colour at least 3:1 against its fill.
- `button--dialog-opener`: `<button yetiButton type="button" [yetiDialogOpener]="dlg">` with a `dialog[yetiDialog]`. Asserts the host carries `class="button"`, `commandfor`, and `command="show-modal"`, and that a click opens the dialog. The [dialog](../issues/81-spec-dialog.md) spec owns the opener's own cases.
- `button--rtl`: `button--icon` inside `dir="rtl"`. Asserts the icon sits at the inline start (right) and Tab order follows the DOM.

### Layer 2: browser-level (`npx nx test <lib>`, `button.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiButton, { tagName })` for `button`, `a`, `input`, and `label`: the host has class `button` and `data-ngx-yeti-item-button`, and no `data-variant`, `data-emphasis`, `data-size`, `role`, `aria-disabled`, `type`, or `tabindex`; with `bindings` setting each input, the attributes follow after `whenStable()`, and binding `undefined` removes them.
- While a `YetiButton` fixture lives, one `<link data-ngx-yeti-styles="button">` and one `<link data-ngx-yeti-styles="spinner">` are in `document.head`, `button` before `spinner`; after `fixture.destroy()` and an animation frame both are gone; two fixtures share one link each until both are destroyed; a `YetiSpinner` fixture created alongside keeps the `spinner` link after the button fixture is destroyed.
- `createDirective(YetiButtonDisabledLink, { tagName: 'a' })`: with `disabled` bound `true`, the host has `role="link"` and `aria-disabled="true"`; bound `false`, neither; the host never carries `disabled`; it carries no presence attribute and acquires no link.
- No directive adds a listener to its host.

A small test host covers what `createDirective` cannot: `<button yetiButton [disabled]="d()">` sets the native `disabled` property to `true` and back to `false` (decision 108's guard); `<a yetiButton [disabled]="d()" [routerLink]="d() ? null : '/x'">` gets `YetiButtonDisabledLink` and loses its `href` while disabled; a static `<a yetiButton disabled>` renders `role="link"`, `aria-disabled="true"`, and no `disabled`; `<button yetiButton disabled>` keeps its native `disabled` and gets no `YetiButtonDisabledLink`; template references `#b="yetiButton"` and `#l="yetiButtonDisabledLink"` resolve; `yetiIcon yetiButton` and `yetiButton yetiPrint="none"` render both classes and both presence attributes; a consumer `[attr.aria-pressed]`, `[attr.aria-busy]`, and `[attr.aria-disabled]` on a `button` host render as written; and the consumer's own `class` is kept.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `button.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture of section 8's markup whose labels carry `i18n`, plus a static `<a yetiButton disabled>` and an icon-only button whose SVG `aria-label` carries `i18n-aria-label` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; each host renders `class="button"`, `data-ngx-yeti-item-button`, and its bound `data-*` attributes; the disabled links render `role="link"`, `aria-disabled="true"`, no `href`, and no `disabled`; the static `size="lg"` is present (inert); `<head>` holds one `button` link and one `spinner` link in that order, each with `data-beasties-skip` and an `href` ending `components/<item>/<item>.css?v=<pin>`; no element carries a `jsaction` from the package.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `button` has `YetiButton`; `data-variant`, `data-emphasis`, and `data-size` have inputs whose unions equal the manifest's vocabularies `variant`, `emphasis`, and `size-control`; the item has no markers and no events. A pin move that adds an attribute or a value fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids: on `button--default`, a click does not draw the ring and Tab does, in Chromium and Firefox; headless WebKit does not Tab to buttons by default, which Yeti's own test skips, so WebKit focuses by script and asserts the ring on `:focus-visible` (`Y/test/browser/components/button.spec.js:101-115`). On `button--toggle` and `button--toggle-input` under `emulateMedia({ forcedColors: 'active' })`, the pressed toggle's and the checked label's computed border colour or width differs from their resting siblings', and with the package's accessibility stylesheet left out the same comparison finds no difference, which proves the rule is what draws the state (A11Y-1a; axe does not check it). On `button--busy` under `emulateMedia({ reducedMotion: 'reduce' })`, the ring's `animation-iteration-count` is 1. Real Space and Enter presses on `button--toggle-input` and `button--disabled` in three engines.

Fixture-app half, built with `outputMode: 'server'`, with a `/button` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route renders section 8's markup in a form, a static `<a yetiButton disabled>`, a busy button rendered busy on the server, and a `[yetiDialogOpener]` button with its dialog:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`; after hydration no link carries `disabled`, and a `MutationObserver` registered before the client bundle loads sees `disabled` only between the write-back and its removal in one pass (ticket 50 decision 9);
- with JavaScript disabled: the submit button submits the form; the enabled link navigates; the disabled link is not focusable and does not navigate; Space checks the toggle label's input and the form submits its value; the opener opens the dialog; the busy button shows its ring; `@axe-core/playwright` with the six tags reports no violation;
- with `main.js` held back, a click on the toggle button before hydration reaches the consumer's handler after hydration and `aria-pressed` becomes `true` (event replay);
- a button inside a client-only `@defer` block with `button` and `spinner` in the preload list shows no unstyled frame; a `yetiIcon yetiButton` host inside a `hydrate never` block keeps both the `button` and `icon` links after every live button and icon on the page is removed (ADR 0045's shared-host case);
- a server-rendered busy button inside a `hydrate never` block, after every live button and spinner is removed: its ring is recorded, not asserted, documenting the residue of having no spinner presence attribute ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 110);
- navigating from the button route to a route without one removes both item links, and navigating back re-inserts them;
- under `<base href="/sub/">`, an `a[yetiButton] href="#contact"` with `provideYetiFragmentLinks()` keeps the route and moves to the target (the [fragment-links](fragment-links.md) spec's case, repeated for a button link).

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and `docs.md` examples for the stories; its `test/browser/components/button.spec.js` and fixture `test/browser/fixtures/components/button.html` for the height, emphasis, pressed-hover, disabled-hover, link, icon, focus-ring, contrast, and black-and-white cases, and `spinner.spec.js` for the ring; ticket 17's forced-colours screenshots and keyboard scripts; ticket 23's `probe.mjs` for the ring's dependence on `spinner.css`; ticket 18's fixture app and ADR 0060's prototype for the server HTML, replay, and item links; the [icon](icon.md) spec's standalone story for the icon-only size and name.

## Out of Scope

- A `pressed` model, a `busy` input, an `ariaDisabled` input, a `disabledInteractive` input, a `type` default, or a defaults token on `YetiButton` (Part 2 row 26; ADR 0003 point 3; building-blocks 1.4; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 111 for `disabledInteractive`).
- A `disabled` input on `button`, `input`, or `label` hosts (ADR 0022, considered options).
- A spinner element inserted into a busy button: Yeti draws the ring with `::after` (`spinner.css`).
- The `buttons` group, its Aria Toolbar, `yetiButtonsItem`, its `busy` alias, and A11Y-1b and A11Y-12 (the [buttons](../issues/77-spec-buttons.md) spec; "Aria decisions" row 27).
- The dialog opener's own behaviour, `commandfor`, `command`, and focus return (the [dialog](../issues/81-spec-dialog.md) spec; ADR 0021), and the dropdown's and nav's toggles (their specs).
- A check that a disabled link has no target, that a host is one of the four elements, or that a toggle label wraps exactly one input. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- An input per token (ADR 0004).
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `YetiButton` on `button`, `a`, `input` with `variant`, `emphasis`, `size` | building-blocks Part 2 row 26; ticket 26 rows 94 to 96 |
| `label[yetiButton]` as a fourth host | Yeti's manifest note and docs; building-blocks 1.1 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 107) |
| No event listener on either directive | ADR 0022 point 1; ADR 0011 clause 3 |
| A disabled link is a placeholder link with `role="link"` and `aria-disabled="true"`; the consumer nulls the target | ADR 0022 point 2 |
| The link's disabled state on `YetiButtonDisabledLink` (`a[yetiButton][disabled]`), so `YetiButton` declares no `disabled` | this spec's reading of ADR 0022 and Angular's binding rule ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 108, trap-quadrant record) |
| `aria-pressed`, `aria-busy`, `aria-disabled`, native `disabled` and `checked` are the consumer's | Part 2 row 26; ADR 0003 point 3; "Aria decisions" row 27 |
| No `disabledInteractive` in the first milestone | ADR 0022 point 3 leaves it to this spec ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 111) |
| `YetiButton` hosts nothing from Aria; `yetiButtonsItem` does inside a group | "Aria decisions" row 27; audit 0003 H1 |
| `spinner` acquired unconditionally with `button`; no spinner presence attribute on the button | ADR 0060 point 9; Part 2 row 26 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 109 and 110) |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by `YetiVariant`, `YetiEmphasis`, `YetiSizeControl`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2; ADR 0080 point 5 |
| `size` is `inert`; the link's `disabled` is `removed`, its static form accepted | building-blocks 1.4; ticket 26 row 96; ticket 50 decision 9 |
| Only `YetiButton` marks its host and acquires item files | ADR 0045; ticket 50 decision 6 |
| `injectYetiItemStyles('button')` and `injectYetiItemStyles('spinner')` last in the constructor, after anything that can throw | [setup](setup.md); ticket 50 decisions 42, 45, and 109 |
| `exportAs` on both; no class-name collision | building-blocks 1.3; ADR 0080 points 3 and 4; ticket 50 decision 10 |
| Entry point `ngx-yeti/button` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1 | building-blocks 1.2; Part 2 row 26 |
| One forced-colours rule in `@layer ngx-yeti` for pressed and checked | ledger A11Y-1a; map, Package CSS for accessibility |
| Icon-only names: both placements accepted, examples name the SVG | ticket 50 decision 40 |
| Icon-only target at least 24 by 24, asserted | ticket 50 decision 38 |
| Text contrast at least 4.5:1 at rest, hover, and press | ADR 0015 point 3; ticket 50 decision 8 |
| Toggles use medium or low emphasis; the state ratio is asserted | building-blocks 1.10 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 94) |
| Tokens are the consumer's | ADR 0004 |
| Item files as counted links in Yeti's order | ADR 0060 points 2 to 6 and 9 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A form's actions, with a wait on the submit button:

```html
<form (submit)="save($event)">
  <!-- fields -->
  <div yetiCluster gap="sm">
    <button yetiButton type="submit" [attr.aria-busy]="saving()" [attr.aria-disabled]="saving()">
      @if (saving()) {
        <span i18n>Saving</span>
      } @else {
        <span i18n>Save</span>
      }
    </button>
    <button yetiButton type="button" emphasis="low" (click)="cancel()" i18n>Cancel</button>
  </div>
</form>
```

```ts
import { YetiButton } from 'ngx-yeti/button';
import { YetiCluster } from 'ngx-yeti/cluster';

@Component({
  selector: 'app-profile-form',
  imports: [YetiButton, YetiCluster],
  templateUrl: './profile-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileForm {
  protected readonly saving = signal(false);

  protected save(event: Event): void {
    if (!this.saving()) {
      this.saving.set(true);
      // start the request; set saving to false when it settles
    }

    event.preventDefault();
  }
}
```

The handler checks the state first and ignores a press while busy, as usage rule 7 says, and calls `preventDefault()` last, because `preventDefault()` throws during event replay (building-blocks 1.5).

Pagination-style links, disabled at the ends:

```html
<a yetiButton emphasis="medium" [disabled]="first()" [routerLink]="first() ? null : ['/page', page() - 1]" i18n>Previous</a>
<a yetiButton emphasis="medium" [disabled]="last()" [routerLink]="last() ? null : ['/page', page() + 1]" i18n>Next</a>
```

The imports are `YetiButton`, `YetiButtonDisabledLink`, and `RouterLink`.

A toggle with no script, and a toggle button:

```html
<label yetiButton emphasis="medium"><input type="checkbox" name="offline" /> <span i18n>Keep maps offline</span></label>
<button yetiButton type="button" emphasis="medium" [attr.aria-pressed]="bold()" (click)="bold.set(!bold())" i18n>Bold</button>
```

An icon-only button, named through its SVG, and the opener of a dialog:

```html
<button yetiIcon yetiButton type="button" emphasis="low" (click)="close()">
  <svg role="img" aria-label="Close" i18n-aria-label viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" /></svg>
</button>
<button yetiButton type="button" variant="alert" [yetiDialogOpener]="confirm" i18n>Delete project</button>
```

A share button that does not print, from Yeti's print example: `<button yetiButton yetiPrint="none" type="button" (click)="share()">`. A call to action on a painted band: `<a yetiButton variant="black" routerLink="/book">` inside a `yetiBox yetiPaint="warning"` band. A value newer than the pin: `<button yetiButton [variant]="$any('accent')">`. A page whose buttons render inside a client-only `@defer` block preloads both files: `provideYetiStyles({ preload: ['button', 'spinner'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/button/button.css`, loaded by `YetiButton` as a counted link (section 13). The consumer writes nothing for the item beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** the tokens (`--yeti-control-size`, the colour ladders, the text and space steps, `--yeti-opacity-muted`, `--yeti-color-focus`, the durations and their reduced-motion values) and the base focus ring on `:focus-visible`. Yeti sets `text-decoration: none` on `a.button` inside its layer, so a consumer's unlayered `a:hover { text-decoration: underline }` outranks it; Yeti's docs say to write `a:hover:not(.button)` (`docs.md`), and the same advice holds for the package.
3. **Cross-item rules:** the busy ring is `spinner.css`'s `.button[aria-busy="true"]::after`, so `YetiButton` acquires `spinner` (section 13). `buttons.css` styles `.buttons > .button` and `affix.css` styles `.affix > .button`; those items load their own files through their own directives, and their rules "simply match nothing once the other part is gone" (`Y/src/guides/install.md:97`).
4. **Tokens:** reads the manifest's public tokens and, through the ring, the spinner's; writes none (section 2).
5. **What breaks without the item file:** the host renders as the browser's own button, link, input, or label: an underlined link, a grey native button, a visible checkbox beside its label text, and no pressed, disabled, or busy look, with no error. Without `spinner.css` only the busy ring is missing; the dim and the progress cursor are `button.css`'s.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled all 49 of Yeti's class names with Tailwind 4.3.3, and only `container`, `grid`, and `table` (plus the attribute name `hidden`) produced a utility (measured); `button` produced none. Tailwind's preflight restyles `button` elements, which the shared layer statement of ticket 24 keeps below Yeti (building-blocks 1.13).

### Platform features to adopt when the browser target moves

None that changes this item: everything it uses is inside Baseline 2025 (`:has()`, `:focus-visible`, inline flexbox, logical properties, `color-mix()` for the ring). Two neighbouring features may change compositions rather than the item: `interestfor` for a hover-opened dropdown whose toggle is a `yetiButton` (the dropdown spec; `Y/src/components/dropdown/hover.js:11-13`), and `closedby="any"` for a dialog opened by a `yetiButton` (the dialog spec; building-blocks 1.8). `:state()` and a native `button` busy state are not proposals Yeti tracks; nothing was checked against web-features data for this spec.

### Single-page-application pieces relied on

None of the shared-utility specs is used by the item itself ([events](events.md), [generated-ids](generated-ids.md), [navigation-close](navigation-close.md)). A bare fragment `href` on an `a[yetiButton]` relies on [fragment-links](fragment-links.md)' document listener, which the consumer starts with `provideYetiFragmentLinks()` (section 12). The item relies on ADR 0060's styles service for route changes.
