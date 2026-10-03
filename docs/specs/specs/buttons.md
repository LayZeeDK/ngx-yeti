# Spec: buttons (component)

Ticket: [77. Spec: buttons (component)](../issues/77-spec-buttons.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) "Aria decisions (2026-10-03)" row 27, as amended by [audit 0003](../audits/0003-third-wave.md) H1 (which wins over Part 2 row 27 and over 1.2's Toolbar bullet), Part 1, and Part 2 row 27; the user's choice "Aria Toolbar by composition (Recommended)" and the composition ruling (map, Standing rulings, 2026-10-03); [Prototype: Angular Aria for the four items that keep a native pattern](../issues/29-prototype-aria-for-the-native-pattern-items.md), [Prototype: fitting Angular Aria to Yeti by directive composition](../issues/30-prototype-fitting-aria-by-directive-composition.md), and [Prototype: subclassing Aria's directives, and `[open]` against `[attr.open]`](../issues/34-prototype-subclassing-aria-and-open-binding-forms.md) with their READMEs ([aria-buttons](../prototypes/aria-buttons/README.md), [aria-composition-roving](../prototypes/aria-composition-roving/README.md), [aria-subclass-and-open](../prototypes/aria-subclass-and-open/README.md)); [ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md) with its notes (`provideYetiAriaIds()` on `yetiButtonsItem`, scoped to Aria's prefix by [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 1); [ledger.md](../ledger.md) rows A11Y-12 and A11Y-1b and its 2026-10-03 note; [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 97 and 98; [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md); ticket 50 decisions 2, 5, 6, 8, and 42; and the sibling [button](button.md) spec. `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x); `NGP/` is `github.com/angular/angular/packages/` at `5db6fc4453` (22.2.0); `APG/` is `github.com/w3c/aria-practices/content/patterns/` at `3f094fd`. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 112 to 117), and each is cited where it applies. Decision 113 changed this spec's first reading: every member keeps its native Tab stop until Aria is live.

## Problem Statement

Yeti's `buttons` is "a group of buttons: a wrapping row, or one joined control with data-affix" (`Y/src/components/buttons/manifest.json`). It is one **Identity class**, `buttons`, two **Attributes** (`data-gap`, `data-affix`), and two or more `.button` children. Yeti asks the author to write `role="group"` and a name, and leaves two things to "your script": moving `aria-pressed` across a toggle set, and any keyboard model beyond one Tab stop per button. A segmented control is Yeti's other form: `label.button` members wrapping radios that share a name, inside a `fieldset`, where the platform gives one Tab stop and the arrow keys (`Y/src/components/buttons/docs.md`). The item has no **Module** and no events.

An application developer using the package cannot write `class="buttons"` or `data-affix` ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2), and needs the `buttons` **Item file** loaded while a group is on the page ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). A keyboard user meets a toggle set or a toolbar row with one Tab stop per button, where the APG toolbar pattern gives one Tab stop for the whole set and arrow keys between its controls ([ledger.md](../ledger.md) A11Y-12; `APG/toolbar/toolbar-pattern.html:30-38`, `:62-86`).

The user chose to close that gap with Angular Aria's Toolbar, hosted by composition ("Aria Toolbar by composition (Recommended)", map, Standing rulings, 2026-10-03). Aria's Toolbar, used as it ships, fails the package's contracts in four measured ways: every server-rendered member has `tabindex="-1"`, so with JavaScript off, before hydration, and inside `hydrate never` no member can be reached by Tab (`upstream-bugs.md` A5; ticket 29); its widget writes `aria-disabled="false"` over a busy button's `aria-disabled="true"`, which breaks Yeti's busy look, the announced state, and axe's contrast exemption (ticket 29, finding 2); a consumer's static `role="group"` beats Aria's static `role="toolbar"` (ticket 29, finding 3); and its widget ids carry a random infix, so they change at hydration (`upstream-bugs.md` A6). And `ToolbarWidget` requires a parent `Toolbar` (`NC/src/aria/toolbar/toolbar-widget.ts:67`), so it cannot sit on the `button` item's own directive, which is used everywhere (audit 0003 H1).

## Solution

Two directives in the secondary entry point `ngx-yeti/buttons` ([building-blocks.md](../building-blocks.md) 1.3; "Aria decisions" row 27):

- **`YetiButtons`**, the **Item directive** and **Coordinating directive**, on `[yetiButtons]`, `exportAs: 'yetiButtons'`. It hosts Aria's `Toolbar` through `hostDirectives`, binds `buttons` as a static host class, binds `data-gap` and `data-affix` from the typed inputs `gap` (`YetiGap`) and `affix` (`boolean`), binds `[attr.role]` to `toolbar` so that a written `role="group"` cannot win, carries the **Replay guard**, provides `yetiButtonsToken`, sets the static presence attribute `data-ngx-yeti-item-buttons` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), and acquires the `buttons` item file, on the server too, through `injectYetiItemStyles('buttons')` from `ngx-yeti/styles` as the last statement of its constructor ([setup](setup.md); ticket 50 decisions 42 and 45).
- **`YetiButtonsItem`**, a **Part directive**, on `button[yetiButtonsItem]`, `a[yetiButtonsItem]`, and `input[yetiButtonsItem]`, `exportAs: 'yetiButtonsItem'`, written beside `yetiButton` on each member of the group. It hosts Aria's `ToolbarWidget` with `inputs: ['disabled: busy']`, lists `provideYetiAriaIds()` in its `providers` ([ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md)), and binds `[attr.tabindex]` to `null` until Aria's public `active()` turns true, so the server HTML keeps a native Tab stop on every member, then passes Aria's roving value through ("Aria decisions" row 27 as amended; ticket 50 decision 113). It sets no presence attribute and acquires no item file (ticket 50 decision 6).

`YetiButton` hosts nothing from Aria ([button](button.md) spec; audit 0003 H1). The consumer writes `<div yetiButtons affix aria-label="Text style">` with `<button yetiButton yetiButtonsItem type="button" emphasis="medium" [attr.aria-pressed]="bold()">` members where Yeti's docs write `<div class="buttons" role="group" aria-label="Text style" data-affix>` with `<button class="button" ...>` members. Aria then owns the single Tab stop, Left and Right with wrap, Home and End, and the RTL key swap; Space and Enter stay each button's own. Moving `aria-pressed` stays the consumer's, as Yeti and Aria both leave it (ticket 29, finding 5; [button](button.md) usage rule 5).

A segmented control of radios keeps the platform's own keyboard and has no `yetiButtonsItem` member; it renders as Yeti's plain group (section 3; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 112).

## User Stories

1. As an application developer, I want one directive attribute to make a set of buttons a Yeti group, so that I never write the `buttons` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="buttons"`, `data-gap`, and `data-affix`, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want to set the space between loose buttons with a `gap` input typed by Yeti's `gap` vocabulary, so that `gap="md"` compiles and `gap="medium"` does not.
4. As an application developer, I want `affix` as a boolean attribute (`<div yetiButtons affix>`), so that I can join the members into one segmented shape with no binding.
5. As an application developer, I want an input I leave unset to render no attribute, so that Yeti's own default gap applies and the server HTML stays minimal.
6. As an application developer, I want every group to be an APG toolbar, so that a keyboard user meets one Tab stop per set instead of one per button.
7. As an application developer, I want to mark each member with `yetiButtonsItem` beside `yetiButton`, so that the button item stays usable on its own everywhere else.
8. As an application developer, I want `yetiButton` to work outside a group with no toolbar code, so that a dialog opener or a lone call to action never fails for a missing parent.
9. As a keyboard user, I want Tab to enter the group on its first member and leave it in one step, so that a long toolbar does not cost me many Tab presses.
10. As a keyboard user, I want Left and Right to move between members and wrap at the ends, so that I can reach every control.
11. As a keyboard user, I want Home and End to go to the first and last member, so that I can jump across a long set.
12. As a keyboard user, I want Shift+Tab back into the group to return me to the member I last used, so that I do not lose my place.
13. As a keyboard user in a right-to-left page, I want Left and Right to follow the reading direction, so that the keys match what I see.
14. As a keyboard user, I want Space and Enter to press the focused member as a native button does, so that toggles toggle and submit buttons submit.
15. As a keyboard user, I want a busy member to stay focusable and announced as unavailable, so that I learn it exists and is waiting.
16. As a screen-reader user, I want the group announced as a toolbar with its name, so that I know what the set of controls is for.
17. As a screen-reader user, I want each toggle in the toolbar announced as pressed or not pressed, so that I know its state.
18. As an application developer, I want a written `role="group"` overridden by the package's `toolbar`, so that a copy of Yeti's markup does not leave an `aria-orientation` on a `group` (axe `aria-allowed-attr`).
19. As an application developer, I want a busy member to keep Yeti's busy look, so that Aria's `aria-disabled` never overwrites the wait with `"false"`.
20. As an application developer, I want one `[busy]` binding to reach Aria's disabled state, so that I do not bind `aria-disabled` by hand on a member.
21. As an application developer, I want the members' ids equal on the server and the client, so that hydration rewrites no id.
22. As an application developer, I want the toolbar's ids to leave the ids of Material, CDK, or Aria content inside a member unchanged, so that the package changes only ids it owns.
23. As an application developer, I want every member reachable by Tab in the server HTML, and one Tab stop once Aria is live, so that the toolbar is never unreachable before Aria is live ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 113).
24. As an application developer, I want hydration to log no `NG05xx` error and keep each member's final `tabindex`, so that a server-rendered toolbar stays stable.
25. As an application developer, I want a press made before hydration to reach my handler once the app is live, so that an early toggle is not lost.
26. As an application developer, I want an arrow key pressed before hydration and replayed to move focus once and stop at the toolbar, so that an outer widget does not handle it again.
27. As an application developer, I want a segmented control of native radios inside a `fieldset` to keep the platform's arrow keys and one Tab stop, so that the choice still submits with the form and works with no script.
28. As an application developer, I want a group with no toolbar members not to show up as an empty or disabled toolbar, so that a segmented control is announced by its `fieldset` alone.
29. As an application developer, I want the `buttons` item file loaded when the first group renders and removed after the last leaves, so that I do not import `buttons.css` globally.
30. As an application developer, I want the item link in the server HTML when a server-rendered page has a group, so that the first paint already has the gap and the joined borders.
31. As an application developer, I want a group right with JavaScript off under SSR and prerendering, so that its buttons stay styled and pressable.
32. As an application developer, I want a group inside a `@defer (hydrate on ...)` block to work natively until the block hydrates and as a toolbar after, so that incremental hydration does not change its look.
33. As an application developer, I want to know what a group inside a `hydrate never` block keeps and loses, so that I place toolbars knowingly.
34. As an application developer, I want to know that a group inside a client-only `@defer` block needs `buttons` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
35. As an application developer using `withI18nSupport()`, I want translated member labels and toolbar names to hydrate without being re-rendered, so that localised pages keep the server's DOM.
36. As an application developer, I want template references (`#g="yetiButtons"`, `#m="yetiButtonsItem"`), so that both directives follow the package's `exportAs` rule.
37. As an application developer, I want to import both directives from `ngx-yeti/buttons`, so that a `@defer` block splits them with the rest of the item.
38. As an application developer, I want the `gap` type re-exported by name (`YetiGap`), so that I can type my own signal that feeds it.
39. As an application developer, I want the usage rules stated (which members carry `yetiButtonsItem`, how to disable one, which attributes not to write, how to name the toolbar), so that I use the item as Yeti and the APG intend.
40. As an application developer, I want `yetiButtons` beside other layout directives on the group's element where Yeti allows it, so that I can compose as Yeti's docs do.
41. As a forced-colours user, I want a pressed member and a checked segment drawn differently from their siblings, so that I can see which one is on.
42. As a keyboard user, I want the focused member of an affixed group lifted above its neighbours, so that its focus ring is whole.
43. As a pointer user, I want a click on a member to move the toolbar's Tab stop to it, so that Tab and Shift+Tab return to where I last acted.
44. As a low-vision user, I want an affixed group at 320 CSS pixels wide to keep its members on one row without page scrolling where the labels allow, so that I can read it at high zoom.
45. As a package maintainer, I want the hand-over of the Tab stop tested at the browser level and in the fixture app, so that a mechanism inferred from source is measured before release.
46. As a package maintainer, I want the contract check to cover `data-gap`, `data-affix`, and every gap value, so that a pin move that adds one fails before release.
47. As a package maintainer, I want the SSR smoke to assert the toolbar's server HTML, a native Tab stop on every member, Aria's ids, and the item link, so that the first paint is proven.
48. As a package maintainer, I want the measured Shift+Tab race and the one-pass role rewrite recorded as known issues with their tests, so that a later Aria release that fixes or worsens them is noticed.
49. As a package maintainer, I want the class names `YetiButtons` and `YetiButtonsItem` checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.
50. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default fails no test for no reason.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/buttons/manifest.json`, `buttons.css`, `docs.md`, and `example.html`, and in `Y/schema/vocabulary.json`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `buttons`, `component`, `Forms and Actions` |
| `class` | `buttons` |
| `attributes` | `data-gap`: enum, vocabulary `gap` (29 values: `none`, `xs` to `3xl`, and the fluid pairs `xs-sm` to `2xl-3xl`), default `sm`, "Space between buttons when not affixed." `data-affix`: boolean, "Join the buttons into one segmented control that shares borders." |
| `classes`, `markers` | none |
| `children` | `> .button`, min 2, no max: "The buttons." |
| `tokens` | public: `--yeti-space-sm` (the default gap), `--yeti-border-width` (the overlap of joined members); private: `--_yeti-gap` |
| `a11y` | `role`: `group`; `requiredAttributes`: `role`, `aria-label \| aria-labelledby`; `keyboard`: "Arrow keys: In a segmented control of radios, move the choice to the previous or next option."; `notes`: `role="group"` with a name; inside a `fieldset` with a `legend` the fieldset is the named group and the div needs neither; a segmented control is `label.button` members wrapping radios that share one name; a toggle of buttons sets `aria-pressed` and "needs a script to move it"; a set of tabs is the tabs component |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: `flexbox gap`, `logical border radii`; `guarded`: empty |
| `since` | `7.0.0` |

How it works, in `@layer yeti.components`: `.buttons` is a wrapping flex row with `gap: var(--_yeti-gap)` (`buttons.css:6-10`); `.buttons:not([data-gap])` sets the gap to `--yeti-space-sm` (`:11`), and the `[data-gap="..."]` rules that set `--_yeti-gap` are in the always-loaded `layouts/attributes.css` (`Y/src/layouts/attributes.css:5-13` and the fluid pairs after them). `.buttons[data-affix]` removes the gap and the wrap (`:17`), squares the inner corners, and overlaps each border by `--yeti-border-width` (`:18-26`). A member that is `:focus-visible`, or whose wrapped input is, gets `position: relative; z-index: 1` so its ring is whole (`:28-31`). Yeti's CSS keys on no `role`, `tabindex`, `aria-orientation`, `id`, or `data-active` (checked, ticket 29), so Aria's attributes change nothing Yeti draws except `aria-disabled`, which `button.css` keys on.

Attributes left to the consumer: the group's name (`aria-label` or `aria-labelledby`, building-blocks 1.10, Names), the members' own `type`, `aria-pressed`, and `aria-busy` ([button](button.md) usage rules 2, 5, and 7), and the `fieldset` and `legend` around a segmented control. Yeti's `role="group"` is not the consumer's any more: the package binds `role` ("Aria decisions" row 27).

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `buttons` | static host class on `YetiButtons` | always | ADR 0003 point 1; Part 2 row 27 |
| Attribute `data-gap` | space between loose members | input `gap`: `YetiGap \| undefined`, `[attr.data-gap]`, `null` when unset | unset renders nothing; Yeti's `sm` applies. Not an HTML attribute | ticket 26 row 97 (R) |
| Attribute `data-affix` | join the members | input `affix`: `boolean` (`booleanAttribute`), `[attr.data-affix]`: `''` when true, `null` when false | default `false`; `<div yetiButtons affix>` works. Not an HTML attribute | ticket 26 row 98 (R); building-blocks 1.4 |
| Children `> .button` | the members | the [button](button.md) item's `YetiButton` on each; `YetiButtonsItem` beside it on each toolbar member | not applicable | manifest `children`; "Aria decisions" row 27 |
| `role` | `group`, the author's | `[attr.role]` on `YetiButtons`: `'toolbar'` (`null` for an item-less group; ticket 50 decision 112) | the consumer writes none (usage rule 3) | "Aria decisions" row 27; ticket 30 |
| Group name | `aria-label` or `aria-labelledby` | the consumer's | required by Yeti, and by the APG wherever a page has more than one toolbar (`APG/toolbar/toolbar-pattern.html:113-114`) | building-blocks 1.10, Names |
| Aria `Toolbar` host attributes | none | Aria's own on the root: `[attr.tabindex]` (`-1`), `[attr.aria-disabled]`, `[attr.aria-orientation]` (`horizontal`), and listeners for `keydown`, `click`, `pointerdown`, `focusin` (`NC/src/aria/toolbar/toolbar.ts:48-57`) | not bound by the consumer | "Aria decisions" row 27 |
| Aria `ToolbarWidget` host attributes | none | Aria's own on each member: `ngtoolbarwidget=""`, `data-active`, `[attr.tabindex]` (overridden, below), `[attr.inert]` and `[attr.disabled]` (`null` while Aria's `softDisabled` is true), `[attr.aria-disabled]`, `[id]` (`toolbar-widget.ts:48-57`) | not bound by the consumer | "Aria decisions" row 27 |
| Member `tabindex` | none (a native Tab stop per button) | `[attr.tabindex]` on `YetiButtonsItem`: `null` until any member's `active()` is true, then Aria's value | server HTML: no `tabindex` on any member, so each keeps its native Tab stop with JavaScript off, before hydration, and inside `hydrate never`; once Aria is live, one Tab stop per toolbar | "Aria decisions" row 27 as amended; ticket 50 decision 113 |
| Busy member | `aria-busy="true"` with `aria-disabled="true"`, the author's | input `busy` on `YetiButtonsItem`, the alias of `ToolbarWidget.disabled`; Aria renders `aria-disabled="true"` and keeps the member focusable (`softDisabled` defaults to `true`, `toolbar.ts:84`); `aria-busy` stays the consumer's | default `false`, which Aria renders as `aria-disabled="false"` (Yeti's `="true"` selectors ignore it) | "Aria decisions" row 27; ticket 30, measured; [button](button.md) usage rule 7 |
| Member ids | none | `ng-toolbar-widget-<n>` from the per-application counter through `provideYetiAriaIds()`, no random infix | equal on the server and the client | ADR 0044 point 1 and its notes; ticket 50 decision 1 |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Tokens `--yeti-space-sm`, `--yeti-border-width` | the default gap; the overlap | the consumer's; the package writes none | not applicable | ADR 0004 |
| Private token `--_yeti-gap` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-buttons=""` on `YetiButtons` only | always present | ADR 0045; ticket 50 decision 6 |
| Injection token | not Yeti's | `yetiButtonsToken`, provided by `YetiButtons` with `useExisting`, injected by `YetiButtonsItem` (required) | not applicable | building-blocks 1.3, 1.9 |
| Package CSS | none in Yeti for `forced-colors` | none of this item's own: the [button](button.md) spec's A11Y-1a rule covers a pressed member and a checked segment | in the package's accessibility stylesheet | ledger A11Y-1b |

The value types are Yeti's own (`YetiGap`), from the package's generated `yeti-types.ts`, re-exported by name and never redeclared ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5; ADR 0060 point 10). `affix` is `boolean`, not a Yeti type.

Neither input name is an HTML attribute, so neither has a static-form kind (building-blocks 1.4). `role` is bound by the package and is not an input.

**Module replaced:** none. Yeti's `buttons` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); manifest `js: null`). What Yeti leaves to "your script" maps as follows:

| Left to the page by Yeti | Package behaviour | Record |
| --- | --- | --- |
| One keyboard model for a toggle set or toolbar row | Aria Toolbar: one Tab stop, arrows with wrap, Home, End, RTL swap, click moves the stop | "Aria decisions" row 27; ticket 29 |
| Moving `aria-pressed` across a toggle set | kept the consumer's: Aria has no notion of `aria-pressed` (ticket 29, finding 5, read); the consumer's `(click)` handler moves it | Part 2 row 26; [button](button.md) usage rule 5 |
| A segmented control's keys | kept the platform's: native radios in a `fieldset` | manifest `a11y.notes`; ticket 50 decision 112 |

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads `--yeti-space-sm` for its default gap, the `--yeti-space-*` steps its `data-gap` values select through the always-loaded `attributes.css`, and `--yeti-border-width` for the overlap; the members read the [button](button.md) item's tokens. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them on `:root`, in a **Theme** file after Yeti, or with a runtime `setProperty`; the space steps and the border width are tokens of the always-loaded group and so change every item that reads them. **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- **Root:** `YetiButtons` hosts `Toolbar` through `hostDirectives` with no inputs exposed (ticket 50 decision 114), adds `class="buttons"` and the presence attribute in `host`, and provides `{ provide: yetiButtonsToken, useExisting: YetiButtons }` (building-blocks 1.9, Parent handle and Aria composition). `ToolbarWidget` injects `Toolbar` itself (`toolbar-widget.ts:67`), which the hosted `Toolbar` satisfies.
- **Members:** `YetiButtonsItem` hosts `ToolbarWidget` with `inputs: ['disabled: busy']`, injects `yetiButtonsToken` with no `optional` flag (a member cannot exist outside a toolbar, building-blocks 1.9), and reaches its widget with `inject(ToolbarWidget)`. It lists `provideYetiAriaIds()` in `providers`, which provides CDK's `_IdGenerator` on the member only and answers only the `ng-toolbar-widget-` prefix; any other prefix goes to the parent `_IdGenerator` (ADR 0044's ticket-50 note).
- **Ordered members:** `YetiButtons` holds a `contentChildren(YetiButtonsItem, { descendants: true })` query. Building-blocks 1.9 allows a content query exactly where a directive must write a default during the server render that a collection sorted after the first render cannot give; whether the group has any member is that case, because it decides the item-less group's server HTML (ticket 50 decision 112), as the tabs' first-tab default is. Aria's own `SortedCollection` registration (`toolbar.ts:66`, `:105-107`; `toolbar-widget.ts:99-105`) orders the members for the keys.
- **The hand-over** (from ticket 30's prototype, measured in three engines, and ticket 34's correction; trimmed to the decision; in the record, the widget sits on `YetiButtonsItem`, not on the prototype's `yetiButton`; the server branch is `null`, not the prototype's first-member `0`, by [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 113):

```ts
// YetiButtons: hosts Toolbar
host: { '[attr.role]': '"toolbar"' },
readonly ariaLive = computed(() => this.members().some((m) => m.widget.active()));

// YetiButtonsItem: hosts ToolbarWidget with inputs: ['disabled: busy']
host: { '[attr.tabindex]': 'tabIndex()' },
protected readonly tabIndex = computed(() =>
  this.#group.ariaLive()
    ? (this.widget.active() ? 0 : -1)
    : null);
```

  A host directive's host bindings run before the host's (Angular's `adev/src/content/guide/directives/directive-composition-api.md:122-131`, read in ticket 30), and an attribute binding writes only when its own value changes, so the package's value wins on the first pass, on the server and on the client. `active()` (`toolbar-widget.ts:85`) is false everywhere until Aria's `afterRenderEffect` sets its active item (`toolbar.ts:103`), so the server value holds with no platform check and no private API. Until then every member renders with no `tabindex` and keeps its native Tab stop, Yeti's own no-script group, so every member stays reachable by keyboard with JavaScript off, before hydration, and inside `hydrate never` (ticket 50 decision 113; [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md)'s note). Once Aria is live the package's value equals Aria's in every pass, which building-blocks 1.9's rule for a shared attribute requires: members 2 to n change to `-1`, a state change after hydration, as `tabs` adds `hidden` once live. Ticket 34 measured the first-member form (`0`, `-1`, `0` inside one batch with no frame between); layer 4 measures the `null` form's pass at hydration and the later `-1` writes.
- **Same-element siblings on a member:** `yetiButton` (class and `data-*`), `yetiButtonsItem` (Aria's widget and the hand-over), and optionally an opener such as `[yetiDialogOpener]` or a tooltip trigger. `YetiButton` binds none of the attributes Aria binds ([button](button.md) section 3), so no attribute has two writers, provided the consumer follows usage rules 4 to 6.
- **Item-less group:** a group whose content query finds no `YetiButtonsItem` (Yeti's segmented control of radios, which has `label.button` members only). Read in Aria's source: with no items, `ListFocus.isListDisabled()` is true (`NC/src/aria/private/behaviors/list-focus/list-focus.ts:62-64`, `every` over an empty list), so Aria renders the toolbar itself `tabindex="0"` and `aria-disabled="true"` (`:77-83`; `toolbar.ts:50-51`), and its `keydown` handler returns at once (`NC/src/aria/private/toolbar/toolbar.ts:202-206`), so the radios keep their native arrow keys (inferred, not measured). Decided (ticket 50 decision 112): while no member is registered, `YetiButtons` binds `role`, `tabindex`, `aria-disabled`, and `aria-orientation` to `null`, so the element renders as Yeti's plain group inside its `fieldset`; while at least one member is registered, its `role` is `toolbar` and the other three equal Aria's values, computed from the same public signals (`Toolbar.disabled()`, `Toolbar.orientation()`, and each member's `ToolbarWidget.disabled()`), so the 1.9 rule holds; the replay guard is inactive while the group is item-less.
- **Generated ids and relationship attributes:** the members' `ng-toolbar-widget-<n>` ids only. The group references none of them. A member that is an opener renders its own relationship attributes through its own directive.
- **Styles service:** `YetiButtons` acquires the `buttons` item file through `injectYetiItemStyles('buttons')` as the last statement of its constructor and releases it on destroy ([setup](setup.md); ADR 0060 point 2; ticket 50 decisions 42 and 45). It does not acquire `button`: each member's `YetiButton` does.

### 4. API

| Member | `YetiButtons` | `YetiButtonsItem` |
| --- | --- | --- |
| Class name | not among the 46 names `yeti.d.ts` exports at the Pin, so `Yeti` (ADR 0080 point 4; ticket 50 decision 10) | same |
| Selector | `[yetiButtons]` | `button[yetiButtonsItem], a[yetiButtonsItem], input[yetiButtonsItem]`; not `label`, because a label is not focusable and Aria's `tabindex` would make it a Tab stop of its own (this spec fixes the part selector, which Part 2 leaves to the spec; ticket 50 decision 116) |
| `exportAs` | `yetiButtons` | `yetiButtonsItem` (building-blocks 1.3) |
| Entry point | `ngx-yeti/buttons` | same |
| Host directives | `Toolbar`, no inputs exposed (ticket 50 decision 114) | `ToolbarWidget`, `inputs: ['disabled: busy']` |
| Inputs | `gap: YetiGap \| undefined` (Yeti default `sm`); `affix: boolean`, `booleanAttribute`, default `false` | `busy: boolean`, `booleanAttribute` (Aria's), default `false` |
| Host | static `class: 'buttons'`; static `data-ngx-yeti-item-buttons: ''`; `[attr.data-gap]`, `[attr.data-affix]`; `[attr.role]`; while item-less, `[attr.tabindex]`, `[attr.aria-disabled]`, `[attr.aria-orientation]` as section 3 says; `(keydown)` replay guard | `[attr.tabindex]` hand-over |
| Providers | `yetiButtonsToken` with `useExisting` | `provideYetiAriaIds()` |
| Injection | `Toolbar` (its host directive); the ADR 0060 styles service, through `injectYetiItemStyles('buttons')` | `yetiButtonsToken` (required); `ToolbarWidget` (its host directive) |
| Members read by the part | `members` (the content query) and `ariaLive`, documented as internal | none |
| Models, outputs, methods | none | none |
| Lifecycle | `injectYetiItemStyles('buttons')` is the last statement of its constructor, so `buttons` is acquired on the server too; the release runs through `DestroyRef` (ADR 0060 point 2; [setup](setup.md); ticket 50 decisions 42 and 45) | none |

No input default differs from Yeti's (ADR 0070 rule 1). A static attribute type-checks as a string literal under `strictTemplates`, so `gap="md"` compiles and `gap="medium"` does not (ADR 0070 rule 2).

**Replay guard** (building-blocks 1.9, Aria composition; CONTEXT.md): `YetiButtons` declares a `keydown` host listener that, for the keys Aria's toolbar handles (Left, Right, Up, Down, Home, End, with no modifier, `hasModifierKey`), calls `stopPropagation()`. Aria's keyboard manager runs its handler and then `preventDefault()` and `stopPropagation()` (`NC/src/aria/private/behaviors/event-manager/event-manager.ts:67-77`); during replay `preventDefault()` throws (building-blocks 1.11), so Aria's own `stopPropagation()` is skipped and the guard is what stops the key at the toolbar. The guard calls nothing that throws.

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiButtons` on the element Yeti's docs put `class="buttons"` on, usually a `div`, holding two or more members (manifest `children`).
2. Name every toolbar with `aria-label` or `aria-labelledby` on the `yetiButtons` element (manifest `requiredAttributes`; `APG/toolbar/toolbar-pattern.html:113-114`). Inside a `fieldset` with a `legend` (the segmented control) write no name: the fieldset names the group.
3. Write no `role`, `tabindex`, `aria-orientation`, or `aria-disabled` on the `yetiButtons` element. The package and Aria bind them; a static `role="group"` is written back by hydration for one task before the binding wins (known issue 2, section 7).
4. Write `yetiButtonsItem` beside `yetiButton` on every `button`, `a`, or submit `input` member of a toolbar, and on nothing else. A member without it is outside Aria's roving and keeps its own Tab stop.
5. Write no `id`, `tabindex`, `aria-disabled`, or `disabled` on a member. Aria binds `[id]` and `[attr.tabindex]`, and its `[attr.disabled]` and `[attr.aria-disabled]` bindings overwrite a consumer's value on the first pass (`toolbar-widget.ts:52-56`; read; ticket 29 measured the `aria-disabled` and `tabindex` cases). A deep link targets an element outside the member (ticket 50 decision 5, from [generated-ids](generated-ids.md)).
6. Disable or mark busy a member only through `[busy]`, which renders `aria-disabled="true"` and keeps the member focusable, as the APG allows for toolbars (`APG/toolbar/toolbar-pattern.html:99-101`). A waiting member also binds `[attr.aria-busy]` and its handler ignores presses, as the [button](button.md) spec's usage rule 7 says. A native `disabled` on a member and `YetiButtonDisabledLink` on a link member are not supported inside a toolbar (ticket 50 decision 115).
7. A toggle member binds `[attr.aria-pressed]` from a signal and moves it in its own `(click)` handler ([button](button.md) usage rule 5); use `emphasis="medium"` or `"low"` for toggles ([button](button.md) usage rule 6).
8. A segmented control is `label` members wrapping radios that share one `name`, inside a `fieldset` with a `legend`, with `yetiButton` on each label and no `yetiButtonsItem` (Yeti's docs; section 3, item-less group).
9. Do not write `class="buttons"`, `data-gap`, `data-affix`, or `data-ngx-yeti-item-buttons` statically (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)").
10. A consumer `@defer` wraps the whole group, never some of its members (building-blocks 1.11 decision 6).
11. Import `YetiButtons` and `YetiButtonsItem` (and `YetiButton`) in every component whose template writes them. A **Forgotten import** of `YetiButtonsItem` leaves a member with its own Tab stop and no error; a forgotten `YetiButtons` with `yetiButtonsItem` imported fails at creation, because the member's required `yetiButtonsToken` and Aria's required `Toolbar` are missing (building-blocks 1.9; inferred from the injections).
12. Bind every input from values that are the same on the server and the client (the hydration constraints).

### 5. Material comparison

| Aspect | ngx-yeti `buttons` | Angular Material `MatButtonToggleGroup` |
| --- | --- | --- |
| Shape | attribute directives on the consumer's group and members; members are native buttons, links, or submit inputs | a component `mat-button-toggle-group` with `mat-button-toggle` components that render their own `button` (`NC/src/material/button-toggle/button-toggle.ts:125`, `:549`) |
| Role | `toolbar` (Aria), or a plain group for a segmented control in a `fieldset` | `group` when `multiple`, else `radiogroup` (`button-toggle.ts:133`); members `presentation` around a button (`:566`) |
| Keyboard | Aria's roving Tab stop, arrows, Home, End | roving `tabindex` over the toggles, arrows within the group |
| Selection | none of its own: `aria-pressed` is the consumer's, radios are native | a `value` model, single or multiple selection |
| Disabled | `[busy]` per member through Aria's soft disabled; Aria's toolbar `disabled` is not exposed | `disabled` on the group, binding `aria-disabled` (`:134`), and per toggle |
| Orientation | horizontal only | `vertical` input (`:188-189`) |
| `exportAs` | `yetiButtons`, `yetiButtonsItem` | `matButtonToggleGroup`, `matButtonToggle` |

Borrowed: one Tab stop for the set and the arrow keys between members. Not borrowed: the selection model and value (the members are Yeti's buttons and the consumer's state), the generated button template, and the vertical form (Yeti's group is a row).

### 6. Implementation level and primitives

`@angular/aria`, level 2 ("Aria decisions" row 27; building-blocks Part 2 counts since 2026-10-03: Aria 2, `tabs` and `buttons`). The user's rule for when to use Aria (map, Standing rulings, 2026-10-02) is met: Aria addresses an accessibility feature Yeti lacks (the APG toolbar's single Tab stop, A11Y-12), and the four problems Aria brings are fitted by composition (Problem Statement; ticket 30). Building blocks: `Toolbar` (`NC/src/aria/toolbar/toolbar.ts:45-118`) and `ToolbarWidget` (`toolbar-widget.ts:45-106`), through their public inputs and `active()` only; `ToolbarWidgetGroup` is not used. CDK: `_IdGenerator` only as the token `provideYetiAriaIds()` provides (ADR 0044 point 6), `Directionality` through Aria for the RTL swap, and `hasModifierKey` in the replay guard (building-blocks 1.5). Subclassing was measured to give the same results with a little less code and rejected by the user's composition ruling (ticket 34). `FocusKeyManager` is not used: Aria owns the roving focus.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** Toolbar (`APG/toolbar/toolbar-pattern.html`), for every group with members; the segmented control is the platform's radio group inside a `fieldset`.
- **Roles:** the group `toolbar` (package binding over Aria's static role); members keep their element's role (`button`, `link`); an item-less group has none, and its `fieldset` is the group.
- **States:** `aria-orientation="horizontal"` (Aria), `aria-disabled` on the toolbar (Aria; `"true"` only when every member is disabled or the group is item-less, where this spec binds `null`), `aria-disabled` per member from `busy` (Aria), `aria-pressed` and `aria-busy` (consumer).
- **Names:** the consumer's `aria-label` or `aria-labelledby` on the group; members are named from content ([button](button.md) usage rule 8).

| Key | Hydrated toolbar (Aria) | Before hydration, JavaScript off, `hydrate never` | Segmented control | Record |
| --- | --- | --- | --- | --- |
| Tab, Shift+Tab | enters on the remembered member, else the first; leaves in one step | reaches every member, each a native Tab stop (ticket 50 decision 113) | reaches the checked radio | ticket 30, measured; native |
| Left, Right | previous, next member, wrapping; swapped in RTL | nothing | move the choice | `NC/src/aria/private/toolbar/toolbar.ts:81-94`, `:117-121`; ticket 29 |
| Up, Down | nothing in a horizontal toolbar | nothing | move the choice | ticket 29, measured |
| Home, End | first, last member | nothing | nothing | `toolbar.ts:120-121` |
| Space, Enter | the member's own activation | the member's own activation | Space checks | native |

Focus: the page's ring on `:focus-visible`; Aria's `.focus()` inside a key handler counts as keyboard focus in all three engines, so the affixed group's lift rule applies (ticket 29, measured). A pointer press on a member moves the toolbar's Tab stop to it (`toolbar.ts:216-220`).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value | `role="toolbar"` with the consumer's name, `aria-orientation`, members with their own roles and states, all in the server HTML. `aria-orientation` is never left on a `group` (ticket 29's `aria-allowed-attr` finding is closed by the role binding, measured in ticket 30). Play functions assert role, name, and states. |
| 1.4.3 Contrast (Minimum) | The members' text is the [button](button.md) item's, asserted there. A busy member keeps `aria-disabled="true"` through `busy`, so axe's inactive-control exemption applies as in Yeti's example (ticket 29's `color-contrast` finding is gone, measured in ticket 30). `buttons--toggle-set` asserts at least 4.5:1 on every enabled member (ticket 50 decision 8). |
| 1.4.10 Reflow | An affixed group never wraps; its members narrow and their labels wrap inside them (`buttons.css:14-17`). Layer 4 asserts no horizontal page scroll at a 320 px viewport for the stories' affixed groups. |
| 1.4.11 Non-text Contrast | Pressed and checked states are the [button](button.md) item's; under forced colours they are drawn by A11Y-1a's rule (A11Y-1b, below). |
| 2.1.1 Keyboard | Every member is reachable by Tab plus the arrows once Aria is live. Before Aria is live, with JavaScript off, and inside `hydrate never`, every member is a native Tab stop (ticket 50 decision 113). |
| 2.4.3 Focus Order | One Tab stop per toolbar; the stop follows the last active member; DOM order is the arrow order. |
| 2.4.7 Focus Visible | Yeti's ring on every member, lifted above its neighbours in an affixed group (`buttons.css:28-31`). |
| 2.4.11 Focus Not Obscured (Minimum) | The lift rule keeps the focused member's ring above the overlapping borders. |
| 2.5.8 Target Size (Minimum) | Members are buttons at least `--yeti-control-size` high ([button](button.md) section 7). An affixed group's members abut, which 2.5.8's spacing exception does not need because each target is at least 24 by 24 CSS pixels; `buttons--affix` asserts it. |

**Ledger rows owned:**

- **A11Y-12** ([ledger.md](../ledger.md)): a toggle set has no single Tab stop. Closed by Aria Toolbar hosted by `yetiButtons`, with each widget hosted by `yetiButtonsItem` (the ledger's 2026-10-03 note; "Aria decisions" row 27). The toggle script for `aria-pressed` stays the consumer's (above). The row's cells were rewritten for this composition (ticket 50 decision 117): inferred from source and measured in ticket 30, tested by L1, L2, L3, and L4.
- **A11Y-1b:** a pressed member and a checked segment look like their siblings under forced colours. The [button](button.md) spec's rule on `.button[aria-pressed="true"]` and `.button:has(> input:checked)` covers both (A11Y-1a), so this item adds no CSS; layer 4 asserts the outcome on this item's stories.

**Known issues** (the ledger's 2026-10-03 note asks this spec to carry both):

1. **Shift+Tab race.** Aria writes the roving `tabindex` in change detection after the `keydown`, not inside it, so a Shift+Tab pressed right after an arrow key can land on the member the arrow just left (ticket 29 finding 6: Chromium in both runs, WebKit in one; ticket 30: 2 of 4 tries in Chromium, 1 of 4 in Firefox and WebKit). A person pressing keys a frame apart is unlikely to hit it; a test runner can. The composition neither causes nor fixes it (ticket 30). Layer 4 records it, never asserts it, and waits a frame between keys in every other keyboard case.
2. **One-pass role rewrite at hydration.** A consumer's static `role="group"` on the group is written back by hydration (`NGP/core/src/render3/instructions/shared.ts:599`) and then replaced by the package's `toolbar`, 9 to 38 ms later in a separate observer callback, with an animation frame between the two writes in Chromium in ticket 34's run (measured, three engines). The server HTML and the hydrated result are `toolbar`. Usage rule 3 forbids the static role; layer 4 records the flip for a fixture written against the rule.

### 8. Rendered HTML

Consumer markup, after Yeti's example and docs:

```html
<div yetiButtons affix aria-label="Text style">
  <button yetiButton yetiButtonsItem type="button" emphasis="medium" [attr.aria-pressed]="bold()" (click)="bold.set(!bold())">Bold</button>
  <button yetiButton yetiButtonsItem type="button" emphasis="medium" [attr.aria-pressed]="italic()" (click)="italic.set(!italic())">Italic</button>
  <button yetiButton yetiButtonsItem type="button" emphasis="medium" [busy]="saving()" [attr.aria-busy]="saving()">Save</button>
</div>

<fieldset>
  <legend>Billing</legend>
  <div yetiButtons affix>
    <label yetiButton emphasis="medium"><input type="radio" name="billing" value="monthly" checked /> Monthly</label>
    <label yetiButton emphasis="medium"><input type="radio" name="billing" value="yearly" /> Yearly</label>
  </div>
</fieldset>
```

Server HTML of the toolbar (ticket 30's measured server HTML, with the record's directive names and ADR 0044's ids): the group carries `yetibuttons=""`, `affix=""`, `class="buttons"`, `data-affix=""`, `data-ngx-yeti-item-buttons=""`, `role="toolbar"`, `tabindex="-1"`, `aria-disabled="false"`, `aria-orientation="horizontal"`, and the consumer's `aria-label`. Each member carries its [button](button.md) attributes, `ngtoolbarwidget=""`, `data-active="false"`, `aria-disabled="false"` (or `"true"` while busy), `id="ng-toolbar-widget-<n>"`, and no `tabindex`, so each member is a native Tab stop (ticket 50 decision 113). Nothing is `inert` or `disabled`. `<head>` holds the `buttons` link, and the `button` and `spinner` links of the members.

Hydrated, once Aria is live: the first member's `data-active="true"` and `tabindex="0"`, and the others' `tabindex="-1"`, written after hydration; an arrow key moves `tabindex="0"` and `data-active="true"` to the next member.

The segmented control's server and hydrated HTML (ticket 50 decision 112): `class="buttons"`, `data-affix=""`, the presence attribute, and no `role`, `tabindex`, `aria-disabled`, or `aria-orientation`; the labels and radios as written.

The delta from Yeti's docs markup: directive attributes and input names where the docs write the class and `data-*` names; no `role="group"` (the package binds `toolbar`); `yetiButtonsItem` on each toolbar member; `[busy]` with `[attr.aria-busy]` where the docs write `aria-busy` and `aria-disabled`.

### 9. Animation

None of the item's own. The members' transitions are the [button](button.md) item's; the directives add no class and no inline style for them (building-blocks 1.6). Reduced motion is Yeti's. The item link stays until Angular removes the last group (ADR 0060 point 4).

### 10. Rendering modes

- **Server output and first paint:** section 8. Every value at first paint is a host binding: the class, the presence attribute, `data-*`, the role, Aria's attributes, the package's `tabindex`, and the members' ids (ADR 0011 clause 1).
- **Pre-hydration state:** none of the bindings can be changed by a person before hydration. Focus moves natively among every member and whatever is outside the toolbar.
- **Before hydration** (ticket 30, measured in three engines): every member is a native Tab stop (ticket 50 decision 113; ticket 30 measured the first-member form); arrows do nothing; pointer presses work natively; axe reports 0. No directive creates a node, reads layout, or starts an observer before hydration; Aria's `afterRenderEffect` and `afterNextRender` run only in the browser (ADR 0011 clauses 1 and 4).
- **Event replay:** a press on a member before hydration reaches the consumer's `(click)` after hydration, and Aria moves the Tab stop to the pressed member (ticket 29, measured). Aria's `keydown`, `click`, `pointerdown`, and `focusin` on the root and the replay guard are host listeners, so they carry `jsaction` and replay; the replay guard keeps a replayed arrow key from reaching an outer widget.
- **Full hydration:** no `NG05xx`, no hydration warning (tickets 30 and 34, development builds, three engines); ids equal on both ends (ADR 0044, measured in ticket 35 for `ng-toolbar-widget-`); no member has a `tabindex` until Aria is live, and members 2 to n then take `-1` after hydration (ticket 50 decision 113; layer 4 measures the pass); a consumer's static `role` flips for one task (known issue 2).
- **Incremental hydration (`@defer (hydrate on ...)`):** the group is its server HTML until its trigger: a native Tab stop per member, native presses, item link held by the presence attribute (ADR 0060 point 4). It becomes a live toolbar when the block hydrates. `hydrate on interaction` replays the triggering press.
- **`hydrate never`:** the group stays its server HTML: styled, a native Tab stop on every member, arrows inert, presses native, toggles never move (ticket 50 decision 113).
- **Client-only `@defer`:** the item file is fetched when `YetiButtons` is constructed, which can show an unjoined row for a few frames; the consumer closes the gap with `provideYetiStyles({ preload: ['buttons', 'button', 'spinner'] })` (ADR 0060 point 6; [setup](setup.md)). Aria is live after the first render, so the Tab stop is Aria's from the start.
- **`withI18nSupport()`:** member labels and the group's `aria-label` (`i18n-aria-label`) are the consumer's translations; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11).
- **Zoneless:** every value is a signal read by a host binding, Aria's included; the consumer's `aria-pressed`, `aria-busy`, and `busy` come from signals (map, Standing rulings, item 43).
- **JavaScript off under SSR and prerendering** (ADR 0011 consequences): styled, every member pressable, forms submit, the segmented control works fully. Lost: the toolbar keys, the consumer's handlers (so `aria-pressed` never moves), and the single Tab stop: every member keeps its own (ticket 50 decision 113). A client-only application gets no such promise.
- **Hydration boundary:** the group and all its members in one boundary (usage rule 10; building-blocks 1.11 decision 6).

### 11. Hydration constraints

- **Same DOM on the server and the client:** every binding is computed from inputs and from `active()`, which is false on both ends until Aria acts in the browser; ids are equal by ADR 0044. The item-less group's `null` bindings depend only on the content query, which is equal on both ends.
- **No direct DOM manipulation:** the directives write only host bindings; Aria's `focus()` calls run in key handlers after hydration.
- **Valid HTML:** the directives change no element. A `fieldset` around the segmented control is the consumer's.
- **`preserveWhitespaces`:** no template; the flex gap ignores white-space text between members.
- **No output branched on the platform:** none; the hand-over reads Aria's public state, not the platform (ticket 30).
- **Static attributes the directives bind:** usage rules 3, 5, and 9 keep the consumer from writing them; known issue 2 records what happens to a static `role` written anyway.

### 12. Single-page application

None of the item's own: it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). A link member with `routerLink` navigates through the Router; a link member with a bare fragment `href` relies on the [fragment-links](fragment-links.md) document listener, as any `a[yetiButton]` does. On a route change the route's groups leave with it, and the item link is removed after the last host carrying `data-ngx-yeti-item-buttons` leaves (ADR 0060 point 4).

### 13. Item file

`yeti-css/css/components/buttons/buttons.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `YetiButtons` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:41`, right after `button`), and removed after the last host carrying `data-ngx-yeti-item-buttons` has left and the live count is zero. `YetiButtonsItem` acquires nothing (ticket 50 decision 6). The `data-gap` value rules are in the always-loaded `layouts/attributes.css`, so no other item file is needed for the gap. The members' `button` and `spinner` files are acquired by their own `YetiButton` ([button](button.md) section 13). The consumer's part is the [setup](setup.md) spec's one-time configuration.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attributes in the DOM, roles, names, and states in the accessibility tree, which element has focus after each key, the item link, and computed styles. It never asserts a private field of the package or of Aria. No test depends on a public token's default value ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): the gap is compared with a probe styled with the same token. Every test runs zoneless. Keyboard cases wait one animation frame between keys, except the case that records known issue 1. The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s. The hand-over is inferred from source for the record's directive names, so it has both a layer-2 and a layer-4 test ("Aria decisions" row 27).

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group and the package's accessibility stylesheet globally and the item files through the directives. Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `buttons--default`: Yeti's docs' form actions, Save (`type="submit"`) and Cancel, as a toolbar named "Form actions" inside a form. Asserts `class="buttons"`, `data-ngx-yeti-item-buttons`, no `data-gap`, role `toolbar` with its name, `aria-orientation="horizontal"`; the gap between members equals a probe's `var(--yeti-space-sm)`; one `<link data-ngx-yeti-styles="buttons">` in `<head>`. Tab enters on Save, Right goes to Cancel, Right wraps to Save, Tab leaves the toolbar.
- `buttons--toggle-set`: Yeti's `example.html` toggle set (Bold, Italic, Underline, `affix`, medium emphasis) bound to signals. Asserts the members' squared inner corners and overlap of one border width, as Yeti's own test does; Home and End; Space toggles `aria-pressed` on the focused member and the tree reports `pressed`; Shift+Tab back into the toolbar lands on the last active member; text contrast of every enabled member at least 4.5:1 (ticket 50 decision 8).
- `buttons--gap`: loose groups at `gap="none"`, `"md"`, and one fluid pair. Asserts each computed gap equals a probe styled with the matching token.
- `buttons--busy-member`: a toolbar with one member bound `[busy]` and `[attr.aria-busy]`. Asserts the member has `aria-disabled="true"` and `aria-busy="true"`, stays reachable by the arrows, is reported disabled, has the cursor `progress` and Yeti's muted opacity, and shows the busy ring; releasing the signal restores `aria-disabled="false"`.
- `buttons--segmented`: Yeti's billing example, `yetiButtons affix` inside a `fieldset` with two radio labels and no `yetiButtonsItem`. Asserts the group has no `role`, `tabindex`, `aria-disabled`, or `aria-orientation` (ticket 50 decision 112); Tab reaches the checked radio; Right moves the choice natively and the checked label's fill changes; the tree has a group named "Billing" (the fieldset) and no toolbar.
- `buttons--links`: a toolbar of two `a[yetiButton][yetiButtonsItem]` with `routerLink`. Asserts the roving keys move between the links and Enter follows the focused one.
- `buttons--two-toolbars`: two named toolbars in a row. Tab moves from the first toolbar's stop to the second's; each keeps its own remembered member.
- `buttons--rtl`: `buttons--toggle-set` inside a CDK `dir="rtl"` wrapper. Right moves to the previous member in DOM order, Left to the next.

### Layer 2: browser-level (`npx nx test <lib>`, `buttons.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note), and a test host where a parent and content are needed:

- `createDirective(YetiButtons, { tagName: 'div' })`: class `buttons`, the presence attribute, no `data-gap` or `data-affix`; `bindings` set `gap` and `affix` and the attributes follow after `whenStable()`; item-less, no `role`, `tabindex`, `aria-disabled`, or `aria-orientation` (ticket 50 decision 112); one `buttons` link in `document.head` while the fixture lives, gone an animation frame after `destroy()`.
- **Hand-over** (test host: a `yetiButtons` with three `button[yetiButton][yetiButtonsItem]`): before the first render callback, no member has a `tabindex` and none has `data-active="true"`; after `whenStable()` and a render, the first member is active with `tabindex` `0` and the others `-1` (ticket 50 decision 113); focusing the second member and dispatching ArrowRight moves `tabindex="0"` to the third; a `MutationObserver` over the members records no value that survives a batch other than the intended moves.
- **Busy:** binding `busy` true renders `aria-disabled="true"` on that member and no `disabled` or `inert`; the member is still focusable.
- **Role:** the group renders `role="toolbar"` with a static `role="group"` written on it and with a bound `[attr.role]="'group'"` (ticket 30's two cases).
- **Ids:** members get `ng-toolbar-widget-0`, `-1`, `-2` with no random infix; a CDK id consumer (`_IdGenerator.getId('cdk-test-')`) inside a member gets CDK's own id (ADR 0044's ticket-50 note).
- **Replay guard:** an outer `keydown` listener on the host's parent sees no ArrowRight dispatched on a member; a dispatched ArrowRight whose `preventDefault` throws still moves focus and still does not reach the outer listener (building-blocks 1.12, replay-safe handlers).
- **Required parent:** creating `YetiButtonsItem` without a `yetiButtons` ancestor throws a missing-provider error (usage rule 11).
- **Native `disabled` on a member** (evidence for decision 115's usage rule; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 115): `<button yetiButton yetiButtonsItem disabled>` is recorded after the first pass, not asserted.
- Template references `#g="yetiButtons"` and `#m="yetiButtonsItem"` resolve.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `buttons.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and section 8's markup with `i18n` labels and an `i18n-aria-label` group name: `whenStable()` resolves; the toolbar's server HTML is section 8's exactly (role, `tabindex="-1"`, `aria-orientation`, no `tabindex` on any member, a busy member `aria-disabled="true"`, ids `ng-toolbar-widget-<n>` with no infix, nothing `inert` or `disabled`); the `TransferState` entry `ngx-yeti-ids` holds the `ng-toolbar-widget-` count (ADR 0044 point 3); the segmented group renders none of the four toolbar attributes; `<head>` holds one `buttons` link with `data-beasties-skip`; the root carries `jsaction` for its `keydown` and `click`.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item: class `buttons` has `YetiButtons`; `data-gap` has an input whose union equals the `gap` vocabulary; `data-affix` has a boolean input; no markers and no events.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids: real key presses for the toolbar table in section 7 in three engines, a frame apart; the Shift+Tab race recorded (known issue 1) by pressing ArrowRight, Tab, and Shift+Tab with no wait, four times per engine, and logging where focus lands; under `emulateMedia({ forcedColors: 'active' })`, a pressed member of `buttons--toggle-set` and the checked segment of `buttons--segmented` have a computed border that differs from their siblings', and with the package's accessibility stylesheet left out the difference is gone (A11Y-1b through A11Y-1a); at a 320 px viewport, `document.documentElement.scrollWidth` equals the viewport width on `buttons--toggle-set` and `buttons--segmented` (1.4.10); on an affixed group, the focused member's `z-index` is `1` after an arrow key (WebKit focuses by script, as Yeti's own test does).

Fixture-app half, built with `outputMode: 'server'`, with a `/buttons` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each with JavaScript on and off ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 2). The route renders section 8's markup, a toolbar inside `@defer (hydrate on interaction)`, one inside `@defer (hydrate never)`, and a toolbar written with a static `role="group"` against usage rule 3:

- **The hand-over, measured:** with a `MutationObserver` registered before the client bundle loads, from first paint to settled, no member has a `tabindex` until Aria is live, any value the hydration pass writes is gone within the same batch, members 2 to n then take `-1` and the first `0` after hydration, and no `NG05xx` is logged; `componentsSkippedHydration === 0`; ids equal before and after hydration;
- with JavaScript disabled: Tab reaches every member of each toolbar and the checked radio (ticket 50 decision 113); the segmented control's arrows move the choice and the form submits it; every member is pressable by pointer; `@axe-core/playwright` with the six tags reports no violation; the count of keyboard-reachable members equals the count of members;
- with `main.js` held back: same as JavaScript off; a press on Italic before hydration is replayed, `aria-pressed` becomes `true`, and Italic holds the Tab stop after hydration; an ArrowRight pressed before hydration and replayed moves focus once;
- the `hydrate on interaction` toolbar becomes live after a press on a member, and the press is replayed;
- the `hydrate never` toolbar keeps a native Tab stop on every member and native presses for good, and its `buttons` link stays after every live group is removed from the page;
- the static-role toolbar is `role="toolbar"` in the server HTML and after hydration, and the one-task flip to `group` is recorded with whether a frame ran between the writes (known issue 2);
- navigating to a route without a group removes the `buttons` link, and back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html`, `docs.md`, and `test/browser/components/buttons.spec.js` (gap, affix overlap, lifted focus, segmented radios); ticket 29's and ticket 30's probes (`tools/probe.mjs`, `tools/probe30.mjs`) and ticket 34's observer method (`tools/probe34-buttons.mjs`), which records each write's own value; ticket 35's prototype for the id comparison; the [button](button.md) spec's stories for the members.

## Out of Scope

- Moving `aria-pressed` for the consumer, a selection model, a `value`, or single-choice toggling (Aria has none; Part 2 row 26 keeps `aria-pressed` the consumer's).
- `ToolbarWidgetGroup`, nested groups, and a vertical toolbar (Yeti's group is a row; ticket 50 decision 114).
- Making the segmented control's radios Aria widgets: native radios already give one Tab stop and the arrow keys (ticket 29, finding 8).
- A `disabled` state for a member other than `busy`, and disabled link members (ticket 50 decision 115).
- Tabs written with an affixed group: tabs are the [tabs](../issues/90-spec-tabs.md) item (manifest `a11y.notes`).
- The `button` item's own directives, states, and A11Y-1a rule (the [button](button.md) spec).
- A check that each member carries `yetiButtonsItem`, that the group has a name, or that no static `role` is written. Checks belong to a later milestone (map, Milestones).
- An input per token (ADR 0004); how the styles service counts links (ADR 0060; [setup](setup.md)).
- Fixing Aria's server `tabindex`, random ids, or the Shift+Tab race upstream; filing needs the user's confirmation (map, AFK override).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Every group with members is an Aria Toolbar, hosted by composition | the user's choice, "Aria Toolbar by composition (Recommended)"; "Aria decisions" row 27; map, Standing rulings (composition) |
| `yetiButtons` hosts `Toolbar`; `yetiButtonsItem` hosts `ToolbarWidget` with `inputs: ['disabled: busy']`; `yetiButton` hosts nothing from Aria | "Aria decisions" row 27 as amended by audit 0003 H1 (the orchestrator's change of mechanism) |
| `[attr.tabindex]` hand-over to Aria's public `active()` | "Aria decisions" row 27; ticket 30, measured; ticket 34's correction |
| `[attr.role]` binding keeps `toolbar` over a written `role` | "Aria decisions" row 27; ticket 30, measured |
| `busy` through Aria's `disabled`; `aria-busy` stays the consumer's | "Aria decisions" row 27; ticket 30; [button](button.md) usage rule 7 |
| `provideYetiAriaIds()` on `yetiButtonsItem`, answering only `ng-toolbar-widget-` | ADR 0044 and its notes; ticket 50 decision 1 |
| No consumer `id` on a member | ticket 50 decision 5 ([generated-ids](generated-ids.md)) |
| Composition, not subclassing | map, Standing rulings, 2026-10-03; ticket 34 |
| Replay guard on the root | building-blocks 1.9; CONTEXT.md |
| Content query that detects a member-less group for its server HTML | building-blocks 1.9, Ordered parts; ticket 50 decision 112 |
| Item-less group renders as Yeti's plain group | Aria's source; ticket 50 decision 112 |
| Every member a native Tab stop until Aria is live | "Aria decisions" row 27 as amended; ticket 50 decision 113 |
| No Aria toolbar input exposed | building-blocks 1.9; ticket 50 decision 114 |
| Part selector `button`, `a`, `input`; members disabled only through `busy` | Part 2's provisional part selectors; `toolbar-widget.ts:52-56`; ticket 50 decisions 115 and 116 |
| Inputs `gap: YetiGap`, `affix: boolean`; unset renders nothing | ticket 26 rows 97 and 98; ADR 0005; ADR 0070 |
| Only `YetiButtons` marks its host and acquires `buttons` | ADR 0045; ticket 50 decisions 6 and 42 |
| `injectYetiItemStyles('buttons')` last in the constructor | [setup](setup.md); ticket 50 decisions 42 and 45 |
| Shift+Tab race and role rewrite carried as known issues | ledger.md 2026-10-03 note; tickets 29, 30, 34 |
| No package CSS of the item's own; A11Y-1a's rule covers A11Y-1b | ledger A11Y-1b; [button](button.md) |
| Directive tests through `TestBed.createDirective`; fixture app with prerendered and server routes | map, Standing rulings; ADR 0014 notes; ticket 50 decision 2 |

### Usage examples

A text-style toolbar of toggles:

```ts
import { YetiButton } from 'ngx-yeti/button';
import { YetiButtons, YetiButtonsItem } from 'ngx-yeti/buttons';

@Component({
  selector: 'app-text-style',
  imports: [YetiButton, YetiButtons, YetiButtonsItem],
  template: `
    <div yetiButtons affix aria-label="Text style" i18n-aria-label>
      <button yetiButton yetiButtonsItem type="button" emphasis="medium" [attr.aria-pressed]="bold()" (click)="bold.set(!bold())" i18n>Bold</button>
      <button yetiButton yetiButtonsItem type="button" emphasis="medium" [attr.aria-pressed]="italic()" (click)="italic.set(!italic())" i18n>Italic</button>
      <button yetiButton yetiButtonsItem type="button" emphasis="medium" [attr.aria-pressed]="underline()" (click)="underline.set(!underline())" i18n>Underline</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextStyle {
  protected readonly bold = signal(true);
  protected readonly italic = signal(false);
  protected readonly underline = signal(false);
}
```

Form actions with a wait on the submit member:

```html
<div yetiButtons aria-label="Form actions" i18n-aria-label>
  <button yetiButton yetiButtonsItem type="submit" [busy]="saving()" [attr.aria-busy]="saving()" i18n>Save</button>
  <button yetiButton yetiButtonsItem type="button" emphasis="low" (click)="cancel()" i18n>Cancel</button>
</div>
```

The submit handler ignores a press while `saving()` is true and calls `preventDefault()` last ([button](button.md) usage rule 7; building-blocks 1.5).

A segmented control, with no toolbar members (ticket 50 decision 112):

```html
<fieldset>
  <legend i18n>Billing</legend>
  <div yetiButtons affix>
    <label yetiButton emphasis="medium"><input type="radio" name="billing" value="monthly" checked /> <span i18n>Monthly</span></label>
    <label yetiButton emphasis="medium"><input type="radio" name="billing" value="yearly" /> <span i18n>Yearly</span></label>
  </div>
</fieldset>
```

A toolbar member that opens a dialog: `<button yetiButton yetiButtonsItem type="button" [yetiDialogOpener]="confirm" i18n>Delete</button>`. A page whose groups render inside a client-only `@defer` block preloads `provideYetiStyles({ preload: ['buttons', 'button', 'spinner'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/buttons/buttons.css`, loaded by `YetiButtons` as a counted link (section 13).
2. **Always-loaded rules relied on:** the `[data-gap]` rules in `layouts/attributes.css`, the space and border tokens, and the base focus ring.
3. **Cross-item rules:** `.buttons > .button` and `.buttons[data-affix] > .button` style the members, so a group needs the `button` item file, which each member's `YetiButton` loads; `buttons.css`'s rules "simply match nothing once the other part is gone" (`Y/src/guides/install.md:97`).
4. **Tokens:** reads `--yeti-space-sm`, the `--yeti-space-*` steps, and `--yeti-border-width`; writes none (section 2).
5. **What breaks without the item file:** the members render as separate inline buttons with no gap, no wrap rule, and, in an affixed group, rounded corners, doubled borders, and a focus ring that a neighbour can cover; the toolbar's keys still work.
6. **Tailwind name collision:** none; `buttons` produced no utility in ticket 24's run of all 49 class names (measured).

### Platform features to adopt when the browser target moves

None for the item: flexbox `gap` and logical border radii are inside Baseline 2025. The server `tabindex` hand-over exists only because Aria sets its active item in `afterRenderEffect` (`upstream-bugs.md` A5); if Aria renders a server Tab stop itself, the hand-over is removed with a test proving the server HTML unchanged. The same holds for `provideYetiAriaIds()` if Aria stops requesting random ids (A6). `focusgroup` is not checked against web-features data for this spec.

### Single-page-application pieces relied on

None of the shared-utility specs is used by the item itself. [generated-ids](generated-ids.md) provides `provideYetiAriaIds()`; [events](events.md) applies only in that the item has no events. A link member with a bare fragment relies on [fragment-links](fragment-links.md). The item relies on ADR 0060's styles service for route changes.
