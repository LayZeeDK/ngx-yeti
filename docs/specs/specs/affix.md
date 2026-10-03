# Spec: affix (component)

Ticket: [72. Spec: affix (component)](../issues/72-spec-affix.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 22, its "Two findings that hold across the matrix", and Part 1; [Decide: the building-blocks map for every ngx-yeti item](../issues/25-decide-building-blocks-map.md) grilling questions 2 and 11 and its Triage row on `aria-describedby` ownership; [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) (no row: the item declares no attribute and no marker); [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decisions 2, 6, 8, 18, and 42; [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). The item owns no [ledger.md](../ledger.md) row (Part 2 row 22). `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x). The point the ticket listed as open was decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decision 46), and it is cited where it applies.

## Problem Statement

Yeti's `affix` "joins a control with what belongs beside it, a unit, a symbol, a button, or another control, into one thing with a shared border and height" (`Y/src/components/affix/manifest.json`). A price with its currency, a site name with its fixed domain, a search box with its button, a phone number with its country code. It is one **Identity class**, `affix`, on a flex row of at least two members: every `input` and `select` grows to share the row, a `span` becomes a labelled box on the sunken surface, and a `.button` keeps its own colours. Inner corners are squared and each member overlaps the next by one border width, so the seam is a single line (`Y/src/components/affix/affix.css`, `docs.md`). It has no **Attribute**, no **Marker**, no **Module**, and no **Event**. It takes its size from the `field` around it, not from an attribute of its own (`Y/src/guides/components.md:99`), and "usually the affix is the control slot of a field" (manifest `a11y.notes`).

An application developer using the package cannot write `class="affix"`: a consumer writes no Yeti class or attribute, and directives bind them ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). The developer also needs the `affix` **Item file** loaded while an affix is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it the members sit side by side as plain inline controls with their own rounded corners and a double border at each seam, and a `span` attachment is plain text, with no error.

The item's only accessibility requirement is the developer's, and Yeti says so: a prefix or suffix that carries meaning (a currency, a unit) must reach the control's accessible name or description, and when the affix holds more than one control, each control other than the one the field's label names needs its own `aria-label` (manifest `a11y.notes`; `docs.md` Accessibility). Inside a package `field`, the control's `aria-describedby` is bound by the field's control directive (Part 2 row 33), and that directive merges the consumer's ids, the prefix's among them, ahead of its own ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 46; the [field](../issues/83-spec-field.md) spec).

## Solution

One directive in the secondary entry point `ngx-yeti/affix` ([building-blocks.md](../building-blocks.md) Part 2 row 22; 1.3):

- **`YetiAffix`**, the **Item directive**, on `[yetiAffix]`, `exportAs: 'yetiAffix'`. It binds `affix` as a static host class, sets the static presence attribute `data-ngx-yeti-item-affix` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), acquires the `affix` item file when it is created, on the server too, and releases it when it is destroyed (ADR 0060 point 2). It has no input, output, model, method, listener, provider, or token.

The developer writes `<div yetiAffix>` where Yeti's docs write `<div class="affix">`, and writes the members as Yeti does: native `input` and `select` controls, `span` attachments, and buttons carrying `yetiButton` where the docs write `class="button"` (the [button](../issues/76-spec-button.md) spec's directive). No member gets a directive from this item: Yeti styles each one only by element and position (building-blocks 1.1, "a child Yeti styles only by element and position gets no directive").

Everything else is Yeti's CSS and the platform. The directive is **types only** (Part 2 row 22): no listener, no render callback, no service of its own, and no DI beyond ADR 0060's styles service (ticket 50 decision 18). The join, the squared inner corners, the shared height, and the focus lift are CSS, so all of them are right on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block. The `aria-describedby` from a control to a meaningful prefix stays the consumer's, as the manifest asks (Part 2 row 22; ticket 25 grilling question 11).

## User Stories

1. As an application developer, I want to join a control with a prefix or suffix using one directive attribute, so that I never write Yeti's `affix` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="affix"`, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want a currency symbol before a price input to read as one bordered control, so that the unit looks attached to the value.
4. As an application developer, I want a fixed domain after a text input, so that a site-name field shows what the address will end with.
5. As an application developer, I want a button after a search input sharing its border and height, so that the input and its action read as one control.
6. As an application developer, I want a country-code `select` beside a phone `input`, so that two controls join into one row.
7. As an application developer, I want every control in the row to grow and share the remaining width, so that the attachments keep their natural width.
8. As an application developer, I want a control in the row to be able to shrink below its intrinsic width, so that the row never overflows a narrow container.
9. As an application developer, I want the seam between two members to be a single line, so that the row looks like one control.
10. As an application developer, I want only the row's outer corners rounded, so that it reads as one shape.
11. As an application developer, I want the outer corners to follow the writing direction, so that the row is correct in a right-to-left page.
12. As an application developer, I want a button attachment to keep its own variant and emphasis colours, so that the action still looks like a button.
13. As an application developer, I want the affix to take its size from the field around it, so that `size="lg"` on the field scales the whole row.
14. As an application developer, I want an affix outside a field to fall back to Yeti's default spacing and text size, so that it works on its own.
15. As an application developer, I want the field's invalid border to reach the controls inside the affix, so that an error shows on the joined control.
16. As an application developer, I want the field's label, hint, and error to keep working when the control slot is an affix, so that I compose the two items as Yeti does.
17. As an application developer, I want the directive to add no role or `aria-*` attribute, so that the native controls keep their own semantics.
18. As an application developer, I want to know how to connect a meaningful prefix to the control's description, so that a screen-reader user hears "dollars" with the price.
19. As an application developer inside a package field, I want my prefix's id and the field's hint and error ids all to reach the control's description, so that neither replaces the other ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 46).
20. As an application developer, I want the usage rules stated (at least two members, controls are `input` or `select`, at most two text and two button attachments, a name for every control), so that I use the item as Yeti intends.
21. As an application developer, I want `yetiAffix` to have no inputs, so that there is nothing to configure and nothing to get wrong.
22. As an application developer, I want a template reference (`#a="yetiAffix"`), so that the directive follows the package's `exportAs` rule.
23. As an application developer, I want to import the directive from `ngx-yeti/affix`, so that a `@defer` block can split it with the rest of the item.
24. As an application developer, I want the affix item file loaded when the first affix renders and removed after the last leaves, so that I do not import `affix.css` globally.
25. As an application developer, I want the item file in the server HTML when a server-rendered page has an affix, so that the first paint is already joined.
26. As an application developer, I want the affix's rules to win over the field's control rules whichever directive is created first, so that the composition never depends on load order.
27. As an application developer, I want the row joined and its controls usable with JavaScript off under SSR and prerendering, so that a form can be read and filled before any script runs.
28. As an application developer, I want hydration to change nothing on an affix or its members, so that I get no `NG05xx` error and no reflow.
29. As an application developer, I want an affix inside a `@defer (hydrate on ...)` block to stay joined before and after the block hydrates, so that incremental hydration does not split the row.
30. As an application developer, I want an affix inside a `hydrate never` block to keep its styles for as long as it is on the page, so that it is not split when a live affix elsewhere leaves.
31. As an application developer, I want to know that an affix inside a client-only `@defer` block needs `affix` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
32. As an application developer using `withI18nSupport()`, I want translated labels and attachments to hydrate without being re-rendered, so that localised forms keep the server's DOM.
33. As an application developer using zoneless change detection, I want the affix to need nothing from a zone, so that it works in any application.
34. As a keyboard user, I want Tab to move through the controls and the button in source order, so that the row behaves like the separate controls it is.
35. As a keyboard user, I want the focused member's whole focus ring visible above its neighbours, so that the overlap never hides where focus is.
36. As a keyboard user, I want the lifted member to stay below sticky bars and the skip link, so that the lift never paints over page chrome.
37. As a screen-reader user, I want a meaningful prefix or suffix read with the control, so that I hear the unit as well as the value.
38. As a screen-reader user, I want each control in a two-control row to have its own name, so that I know which one I am in.
39. As a screen-reader user, I want a button attachment to be an ordinary button named by its text, so that its action is announced as usual.
40. As a low-vision user, I want an attachment's text to meet 4.5:1 contrast in the light and dark schemes, so that I can read the unit.
41. As a low-vision user, I want the row to shrink its controls rather than overflow when I zoom in, so that I never scroll sideways to fill a field.
42. As a low-vision user who overrides text spacing, I want the attachments to grow with their text, so that my settings clip nothing.
43. As a forced-colours user, I want the members' borders to remain, so that I can still see where the row and its controls are.
44. As a pointer user, I want a button attachment as tall as the control beside it, so that it is an easy target.
45. As a package maintainer, I want the contract check to assert that the item declares no attribute, marker, or event, so that a pin move that adds one fails before release.
46. As a package maintainer, I want the SSR smoke to assert the server HTML of an affix and its item link, so that the first paint is proven.
47. As a package maintainer, I want the fixture app to render the item on a prerendered and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
48. As a package maintainer, I want the geometry tests to follow Yeti's own `affix.spec.js` cases, so that the package proves the same join Yeti proves.
49. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default fails no test for no reason.
50. As a package maintainer, I want the class name `YetiAffix` checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/affix/manifest.json`, `affix.css`, `docs.md`, and `example.html`, and in `Y/src/components/field/field.css` and `manifest.json`, `Y/src/layouts/attributes.css`, and `Y/test/browser/components/affix.spec.js`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `affix`, `component`, `Forms and Actions` |
| `class` | `affix` |
| `attributes`, `classes`, `markers` | empty |
| `children` | `> *` (min 2, no max): "The controls and their attachments, in visual order." `> input` (min 0): "A control; every control grows to share the row." `> select` (min 0): the same. `> span` (min 0, max 2): "A text prefix or suffix." `> .button` (min 0, max 2): "A button prefix or suffix." |
| `tokens` | all public: `--yeti-control-radius` ("Outer corners."), `--yeti-control-border` ("Border of the attachments."), `--yeti-border-width` ("The width the members overlap by."), `--yeti-space-sm` ("Inline padding of an attachment."), `--yeti-text-md` ("Text size of an attachment."), `--yeti-color-text-muted` ("Text of an attachment."), `--yeti-color-surface-sunken` ("Background of an attachment.") |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "A prefix or suffix that carries meaning (a currency, a unit) must reach the control's accessible name or description: give the span an id and add it to the control's aria-describedby, or say it in the label. When the affix holds more than one control, the field's label names one of them and each other control needs its own aria-label. A button in the affix is an ordinary button. Usually the affix is the control slot of a field." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: `flexbox`, `logical border radii`; `guarded`: empty |
| `since` | `7.0.0` |

How it works, in `@layer yeti.components`: `.affix` is a flex row with `align-items: stretch`, so every member takes the row's height. `.affix > *` zeroes margins. `.affix > :is(input, select)` takes `flex: 1` and `min-inline-size: 0`, so controls share the row and may shrink. `.affix > span` is a flex box with inline padding `var(--_yeti-size-space, var(--yeti-space-sm))`, font size `var(--_yeti-size-text, var(--yeti-text-md))`, muted text on the sunken surface, the control border and radius, and `white-space: nowrap`. `.affix > .button` takes the control radius. `.affix > :not(:first-child)` squares the start corners and pulls the member back by one border width (`margin-inline-start: calc(-1 * var(--yeti-border-width))`); `.affix > :not(:last-child)` squares the end corners. `.affix > :focus-visible` sets `position: relative; z-index: 1`, so the focused member and its ring paint above the neighbour that overlaps it. All radii and margins are logical, so the row follows the writing direction.

The two **Private tokens** the attachments read, `--_yeti-size-space` and `--_yeti-size-text`, are set by `data-size` on a field through the **Always-loaded group**'s `layouts/attributes.css` ([Research: Yeti's styling model](../issues/04-research-yeti-styles-and-lazy-loading.md) section 3, "Reads that resolve only in `layouts/attributes.css`"); outside a field the fallbacks apply. The controls themselves are drawn by `field.css` inside a field (`.field :is(input..., select, textarea)`, `field.css:24-33`) and by the always-loaded `base/controls.css` elsewhere. `field.css:189-190` reaches into the affix: an invalid control inside `.field > .affix` turns the affix's controls' borders to the alert colour. `Y/src/base/typography.css:79` and `attributes.css:333-342` rank the lift: the affixed controls at 1, sticky bars at 2, the skip link at 3.

Attributes left to the consumer: none to map (ticket 26 has no `affix` row). The members, their `id`s, `aria-describedby`, `aria-label`, `type`, and every form attribute are the consumer's (Part 2 row 22).

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `affix` | static host class on `[yetiAffix]` (`YetiAffix`) | always | ADR 0003 point 1; Part 2 row 22 |
| Attributes | none | no input | not applicable | manifest `attributes: []`; ticket 26 |
| Markers | none | no part directive | not applicable | manifest; building-blocks 1.1 |
| Children `> input`, `> select` | the controls | no directive from this item; the consumer's native controls, with `yetiFieldControl` beside them inside a package field (Part 2 row 33) | not applicable | building-blocks 1.1 |
| Child `> span` | a text attachment | no directive; the consumer's `span`, with the consumer's `id` where it carries meaning | not applicable | Part 2 row 22; manifest `a11y.notes` |
| Child `> .button` | a button attachment | no directive from this item; the consumer writes `yetiButton` on the `button`, which renders `.button` (the [button](../issues/76-spec-button.md) spec) | not applicable | Part 2 rows 22 and 26; building-blocks Part 2, "Two findings" |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Tokens (the seven above) | outer radius, attachment border, overlap width, attachment padding, text size and colour, attachment surface | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--_yeti-size-space`, `--_yeti-size-text` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-affix=""` on `[yetiAffix]` | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2 |
| Injection token | not Yeti's | none: the item has no part to find it | not applicable | building-blocks 1.9 (a parent handle exists for parts) |

**Module replaced:** none. Yeti's `affix` has no Module (manifest `js: null`; Part 2 row 22, "Yeti module: none"; [Research: Yeti's JavaScript modules and what Angular adds](../issues/03-research-yeti-javascript-and-angular.md), whose table lists the affix as "flex row; `aria-describedby` by the author"). So there is no module behaviour to keep, change, or remove ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md)). Foundation 6's `.input-group` is `affix` inside `field` in Yeti (`Y/src/guides/migrating.md:80`).

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads the seven public tokens above, and through the controls and buttons it holds, whatever `field.css`, `base/controls.css`, and `button.css` read. The package writes none and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`; derived tokens such as `--yeti-control-radius` also take effect on one affix and its descendants (`Y/src/guides/theming.md:38`). Size is not a token here: it is the field's `size` input, which the field spec owns. **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- One item directive. No part directive, no provider, no injection token, and no `hostDirectives`. No Yeti item always sits on another's element, and `affix > .button` is a nested element, written inside, never on the same element (Part 2, "Two findings that hold across the matrix"; `affix/manifest.json:36`).
- Composition with `field`: the consumer writes `<div yetiAffix>` as the direct child of a `yetiField` host, where Yeti's field manifest puts `> .affix` ("The control slot as an affix", `field/manifest.json:62-65`). `YetiAffix` reads nothing from the field and the field reads nothing from it; Yeti's CSS relates the two (`field.css:189-190`, and the private size tokens above). Whether the field's control directive finds a control nested inside an affix is the field spec's (Part 2 row 33; [Spec: field](../issues/83-spec-field.md)).
- Composition with `button`: each button attachment carries `yetiButton`, which binds `.button` and acquires the `button` item file through its own directive. `affix.css`'s `.affix > .button` rule only adds the radius, so the affix acquires no other item file (ADR 0060 point 9).
- The only injection is the root styles service of ADR 0060, reached by `injectYetiItemStyles('affix')` from `ngx-yeti/styles` as the last statement of the constructor ([setup](setup.md); ticket 50 decisions 42 and 45), through which `YetiAffix` acquires and releases the item file ([setup](setup.md)).
- Generated ids and the platform's relationship attributes: none. The `span`'s id that a meaningful prefix needs is the consumer's: "`_IdGenerator` not used here (the consumer's id does the job)" (Part 2 row 22), so the item does not use [generated-ids](generated-ids.md). Ticket 17's suggestion of `_IdGenerator.getId` for that id ([research](../research/yeti-accessibility-and-standards.md) section 4.2) was not adopted by row 22.
- `aria-describedby` ownership (ticket 25 grilling question 11, Triage row "decided (affix: the consumer's)"): the affix has no directive on the control, because a package control directive there would collide with the field's control directive, which owns `aria-describedby` on the same input (building-blocks 1.4, "two package directives on one element"). How the consumer's prefix id and the field's hint and error ids meet on one control is usage rule 3 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 46).

### 4. API

| Member | `YetiAffix` |
| --- | --- |
| Class name | not among the 46 names `yeti.d.ts` exports at the Pin (the orchestrator's list of 2026-10-03 under ADR 0080), so it takes `Yeti`, not `NgxYeti` (ADR 0080 point 4) |
| Selector | `[yetiAffix]` (Part 2 row 22) |
| `exportAs` | `yetiAffix` (building-blocks 1.3) |
| Entry point | `ngx-yeti/affix` (building-blocks 1.3; ADR 0011 clause 10) |
| Inputs, models, outputs, methods, listeners | none |
| Host | static `class: 'affix'`; static `data-ngx-yeti-item-affix: ''` |
| Providers | none |
| Injection | the ADR 0060 styles service, through `injectYetiItemStyles('affix')` only |
| Lifecycle | acquires the `affix` item file with `injectYetiItemStyles('affix')` as the last statement of its constructor, after anything there that can throw (nothing does today), and releases it through `DestroyRef` (ADR 0060 point 2; ticket 50 decisions 18 and 42; [setup](setup.md)'s item-file helper) |

**Usage rules** (numbered here and in the directive's JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiAffix` on a `div`, as Yeti's examples do, and give it at least two direct children (manifest `children`, `> *` min 2). Controls are `input` and `select`; a `textarea` is not one of Yeti's members and does not grow (`.affix > :is(input, select)`). Use at most two `span` attachments and at most two button attachments (manifest, max 2 each). `@if`, `@for`, `@defer`, and `ng-container` add no element, so the elements they render are the members; a `@defer` block's placeholder element is a member while it shows (inferred from Yeti's `> *` and `:first-child` selectors).
2. Write the members in visual order: the source order is the order on screen and the order Tab follows (manifest `children`, "in visual order"). Do not reorder them with CSS `order` or a reversed direction (WCAG 1.3.2, 2.4.3).
3. A `span` that carries meaning (a currency, a unit, a domain) must reach the control's accessible name or description: give the `span` an `id` and list it in the control's `aria-describedby`, or say it in the label ("Price in dollars") (manifest `a11y.notes`). Inside a `yetiField` whose control carries `yetiFieldControl`, which binds `aria-describedby` from the hint's and error's ids (Part 2 row 33), the consumer writes `aria-describedby="<span id>"` on the control and the field's control directive, through an input aliased `aria-describedby`, merges it with the hint and error ids, the consumer's ids first and never replaced, as Material's `matInput` composes `userAriaDescribedBy` (`NC/src/material/input/input.ts:243`; `form-field.ts:759`). This is [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 46, which the [field](../issues/83-spec-field.md) spec states for `yetiFieldControl`. The label form stays correct everywhere.
4. When the affix holds more than one control, the field's label names one of them with `for`, and every other control carries its own `aria-label` (manifest `a11y.notes`; Yeti's phone example).
5. A button attachment is a `<button>` with `yetiButton`, `type="button"` unless it submits, named by its text; it is an ordinary button (manifest `a11y.notes`). Its look comes from the button's own inputs.
6. Do not write `class="affix"` or `data-ngx-yeti-item-affix` statically on the host. The directive binds them, and hydration writes a static attribute back (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)").
7. Size the row through the field around it (the field's `size` input); the affix has no size of its own (`Y/src/guides/components.md:99`).
8. Import `YetiAffix` in every component whose template writes `yetiAffix`. The directive has no input, so a **Forgotten import** is never reported by the compiler: the members render unjoined with no error, unless a template reference names the `exportAs` (NG8003) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `affix` | Nearest in Angular Material: `matPrefix`, `matSuffix`, `matTextPrefix`, `matTextSuffix` in `MatFormField` |
| --- | --- | --- |
| Shape | an item directive on the consumer's row; members are the consumer's elements in source order | marker directives on projected content (`NC/src/material/form-field/directives/prefix.ts:20`, `suffix.ts:20`), placed by the form field's template into prefix and suffix containers (`form-field.html:62-90`) |
| Text attachment | a `span` on the sunken surface with its own border | `matTextPrefix` and `matTextSuffix`, text inside the field's outline |
| Button attachment | a `yetiButton` member sharing the row's border and height | `matIconSuffix` and `matSuffix` usually hold an icon button inside the outline |
| Two controls | allowed; each control grows | one control per form field |
| Description from the attachment | the consumer's `aria-describedby` (usage rule 3) | none automatic; the consumer's `aria-describedby` on `matInput` is kept as `userAriaDescribedBy` and composed with hint and error ids (`input.ts:243`; `form-field.ts:759`) |
| Size | from the field's `size` | from the form field's appearance and density |
| `exportAs` | `yetiAffix` | none on the prefix and suffix directives |

What carries over from Material is the composition rule of usage rule 3: the consumer's own description ids are kept beside the field's. Material also links no text prefix to the control on its own, which matches Part 2 row 22's choice to leave the id to the consumer.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 22; building-blocks 1.2). The reason, row 1's, which row 22 takes ("as row 1"): Yeti's CSS does the whole job; the directive adds the class, the item-file acquisition, and `exportAs`. Flexbox and logical border radii, the two features the manifest lists as unguarded, are inside Baseline 2025 ([Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md) rows `flexbox` and `logical-properties`). No Aria pattern applies: the APG has none for a form-control grouping ([Research: Yeti against WHATWG, WAI-ARIA, the APG](../issues/17-research-yeti-accessibility-and-standards.md) section 4.2), and the controls are native. No CDK piece is used: `_IdGenerator` is not needed because the consumer's id does the job (Part 2 row 22), and `FocusMonitor` is not needed because Yeti keys the lift on `:focus-visible` itself.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The directive adds no role, state, or property, and no tab stop. The row is not a `group`: Yeti's markup has no role on it, and each control is labelled on its own.
- **Keyboard:** none of the package's. Tab moves through the controls and buttons in DOM order; each control keeps its native keys.
- **Names and descriptions:** the consumer's, by usage rules 3 to 5.
- **Focus:** the focused member is lifted above its neighbours by `.affix > :focus-visible`. [Prototype: Angular Aria for the four items that keep a native pattern](../issues/29-prototype-aria-for-the-native-pattern-items.md) measured the same rule shape on an affixed `buttons` group (`buttons.css:28`): the focused member got `position: relative; z-index: 1` and its outline, in three engines, by Tab and by an arrow key. For `affix` the rule is read, not measured; layer 4 measures it.

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | A meaningful attachment reaches the control's description or name through the consumer's `aria-describedby` or label (usage rule 3). Ticket 17 measured the example's input description including `$` in Chromium (section 4.2). Layer 1 asserts the computed description. |
| 1.3.2 Meaningful Sequence, 2.4.3 Focus Order | The members are in visual order by usage rule 2; the item reorders nothing. Layer 1 asserts the accessibility-tree order equals the DOM order, and the RTL story asserts Tab follows the DOM order. |
| 1.4.3 Contrast (Minimum) | Attachment text is `--yeti-color-text-muted` on `--yeti-color-surface-sunken`. axe found no violation on the example (ticket 17), and Yeti's own spec asserts AA on the `span` in both schemes (`affix.spec.js`). The play function asserts at least 4.5:1 with the exact WCAG formula in light and dark (ADR 0015 point 3; ticket 50 decision 8). |
| 1.4.10 Reflow | Controls take `min-inline-size: 0`, so the row shrinks its controls before it overflows. A long `nowrap` attachment can still overflow a very narrow row; layer 4 asserts no horizontal overflow for the documented examples at a 320 px viewport. |
| 1.4.11 Non-text Contrast | The row's boundary and the controls' borders are Yeti's control border, drawn by `field.css` or `base/controls.css`; the field spec owns the control's own contrast. The single seam adds no new boundary. The **Story gate** covers what axe checks. |
| 1.4.12 Text Spacing | Attachments size to their content; no height or overflow is set (read). |
| 2.4.7 Focus Visible, 2.4.11 Focus Not Obscured (Minimum) | The base ring is `2px` at `2px` offset on every `:focus-visible` (`typography.css:101-104`). The member after the focused one overlaps it by one border width; the lift paints the focused member and its ring above it, below sticky bars and the skip link (section 1). Layer 4 asserts the lift on each member and that the ring's pixels next to the seam are the ring's colour. |
| 2.5.8 Target Size (Minimum) | A button attachment is stretched to the row's height (`align-items: stretch`). The Story gate's `wcag22aa` tag runs axe's `target-size` rule. |
| 3.3.2 Labels or Instructions, 4.1.2 Name, Role, Value | Native controls; the field's label names one control, and every other control has its own `aria-label` (usage rule 4). |

**Forced colours:** the row draws no state, so nothing is lost beyond the sunken background, and the borders render in the system colour. No ledger row and no package CSS, after the `box` and `lift` precedent (ticket 50 decisions 26 and 30); layer 4 records that the members' borders remain under `forcedColors: 'active'`.

**Ledger rows owned:** none ([ledger.md](../ledger.md); Part 2 row 22, "Ledger: none"). The package adds no accessibility or standards feature Yeti lacks: the item conformed as measured in ticket 17 (section 3, "Conforms as measured"), and the description link stays the consumer's, as Yeti documents.

### 8. Rendered HTML

Consumer markup, after Yeti's example, inside a package field:

```html
<div yetiField>
  <label for="price" i18n>Price</label>
  <div yetiAffix>
    <span id="price-unit">$</span>
    <input id="price" type="number" min="0" step="0.01" yetiFieldControl aria-describedby="price-unit" />
    <button yetiButton type="button" emphasis="medium" i18n>Apply</button>
  </div>
</div>
```

Server HTML and the hydrated DOM are the same for the affix. Its host carries `yetiaffix=""`, `class="affix"`, and `data-ngx-yeti-item-affix=""`, and nothing else from the package. The `span` and the `input` carry only the consumer's attributes and whatever the field's control directive binds on the `input` (the field spec's; usage rule 3). The `button` carries the button directive's class and attributes. The server also writes the item links into `<head>` in Yeti's order: `button` (`Y/src/yeti.css:40`), `field` (`:44`), then `affix` (`:45`). The affix link has `rel="stylesheet"`, `href` `<url>components/affix/affix.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="affix"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts the links at bootstrap. The item has no closed or open state.

The delta from Yeti's docs markup: `yetiAffix` where the docs write `class="affix"`, `yetiField` and `yetiFieldControl` where they write the field's class and the control, and `yetiButton` with `emphasis` where they write `class="button" data-emphasis="medium"`.

### 9. Animation

None of the item's. The only transition inside the row is the field's border-colour transition on its controls (`field.css:33`), keyed on `:focus-visible` and validity, which Yeti's reduced-motion tokens collapse (building-blocks 1.6 point 4). The lift is not animated. A member the consumer inserts or removes with `@if` may carry a class-form `animate.enter` or `animate.leave` of the consumer's; the row re-squares its corners at once, because `:first-child` and `:last-child` follow the DOM. A server-rendered affix never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute and the item link in `<head>` (section 8). Everything at first paint is a static host binding (ADR 0011 clause 1). Nothing is **Pre-hydration state**: the item has no attribute that a person or a module changes. What a person changes before hydration is the controls' own values, which Angular's forms own: hydration's first forms update clears them, and only a control inside a package field keeps them, through `YetiFieldControl`'s adoption before hydration ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 161; ledger A11Y-28). An affix control outside a package field is not covered.
- **Before hydration:** the directive creates no node, reads no layout, starts no timer or observer, and touches no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). Its only constructor work is the item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** the host is claimed as it is; 0 style mutations (ADR 0060 point 5, measured for the mechanism). Typing into a control before hydration is kept only where the control is a package field's `YetiFieldControl`, which adopts the value (decision 161; A11Y-28); the affix directive binds nothing on it.
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the row and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism). The controls work while dehydrated, because they are native.
- **`hydrate never`:** the row is its server HTML and stays joined while its host is connected, whatever live affixes do (ADR 0060 point 4; ADR 0045). The controls and buttons keep their native behaviour; a button's Angular click handler, if the consumer wrote one, never runs, which is the button's and the consumer's concern.
- **Client-only `@defer`:** the item file is fetched when `YetiAffix` is constructed, which can show unstyled frames (members unjoined, double seams, a plain-text `span`); the consumer closes the gap with `provideYetiStyles({ preload: ['affix'] })` (ADR 0060 point 6; [setup](setup.md)). A field around it needs `field` in the same list.
- **Event replay:** the directive declares no listener, so nothing of it replays and it adds no `jsaction`. Clicks on a button attachment replay through the consumer's own handlers, as for any button (building-blocks 1.11).
- **`withI18nSupport()`:** labels, attachments, and button text are usually translated with `i18n` in the consumer's component, which needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11). The directive adds no `i18n` block.
- **Zoneless:** the directive has no input and no state, so nothing in it depends on change detection (map, Standing rulings, item 43).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the row is joined and readable, and its native controls and buttons work: a value can be typed and selected, and a submit button submits the form natively (subject to the field spec's `ready` rule, A11Y-19). Nothing of the affix is lost; it has no behaviour. A client-only application gets no such promise.
- **Hydration boundary:** the affix belongs inside the same boundary as the field around it, because the field's control directive links the control to the hint and error by id (building-blocks 1.11 decision 6; the field spec's). The affix itself has no ids.

### 11. Hydration constraints

The item complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static and the directive binds nothing else.
- **No direct DOM manipulation:** the directive writes nothing to the DOM outside its static host attributes. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directive changes no element. A `div` may hold the `span`, `input`, `select`, and `button` members; usage rule 1 keeps the host a `div`. Putting the affix inside a `label` would nest interactive content, so it is not done; Yeti's examples do not.
- **`preserveWhitespaces`:** the directive has no template. White-space-only text in a flex container is not a flex item, and `:first-child` and `:last-child` count elements only, so whitespace changes neither the join nor the squared corners.
- **No output branched on the platform:** none.
- **Static attributes the directive binds:** none besides its own static host attributes; usage rule 6 keeps the consumer from writing them. A static `aria-describedby` on a control that a field control directive also binds is the field spec's case, which merges it rather than replacing it (usage rule 3; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 46).

### 12. Single-page application

None. The item has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). On a route change, a route's affixes leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-affix]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders an affix again re-inserts it.

### 13. Item file

`yeti-css/css/components/affix/affix.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiAffix]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:45`, after `field` at `:44` and `button` at `:40`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-affix` has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds `base/controls.css`, the `data-size` rules that set the private size tokens, and the tokens), and optionally `provideYetiStyles({ preload: ['affix'] })`. The item adds nothing to it. Cross-item files acquired: none (ADR 0060 point 9). The rules that name another item, `.affix > .button` here and `.field ... .affix` in `field.css`, style an element whose own directive loads its own file.

Order inside `yeti.components` (read, not measured): `.affix > :not(:first-child)` and `.affix > :not(:last-child)` (specificity 0,2,0) outrank `field.css`'s control rule `.field :is(input:not(:where(...)), select, textarea)` (0,1,1) and `button.css`'s `.button` radius, so the squared corners win in any insertion order; ADR 0060 point 3 inserts `affix` after `field` and `button` in any case.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and presence attribute in the DOM, the item link, where the members land, their corners and seams, the lift, and the accessible description. It never asserts a private field or how the styles service counts. No test depends on a public token's default value or on a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): an overlap is compared with the computed `--yeti-border-width`, as Yeti's own `affix.spec.js` does with its `token()` helper, and a radius with zero or non-zero, never a value. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `affix`, `field`, and `button` item files through their directives, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `affix--default`: section 8's markup (Yeti's example). Asserts the host's `class` contains `affix` and it carries `data-ngx-yeti-item-affix`; no member has a role, `tabindex`, or `aria-*` attribute from the package; every member's computed margin-block is 0; the `span`, `input`, and `button` share one top and one height within 1 px; each seam's overlap equals the computed border width within 1 px; the `span`'s start corners are rounded and its end corners square, the `input`'s corners all square, the `button`'s start corners square and end corners rounded; the input is wider than half the row; the input's computed accessible description contains `$`; the `span`'s text is at least 4.5:1 against its background in the light and dark schemes (ticket 50 decision 8).
- `affix--suffix`: Yeti's docs example, a site-name input with a `.foundationcss.com` suffix inside a field with `size="lg"`, beside a default-size field. Asserts the large field's attachment font size and control height exceed the default's (Yeti's "reads the size of the field around it" case), and the description contains the domain.
- `affix--two-controls`: Yeti's phone example, a `select` with `aria-label="Country code"` and an `input` labelled by the field. Asserts both controls share one top, both grow (their widths sum to the row's within 2 px), the seam overlaps by the border width, and each control has a non-empty accessible name.
- `affix--search`: an affix outside any field, an `input` with `aria-label` and a submit `yetiButton`. Asserts the join and that the attachment padding falls back without a field (the members still share one height).
- `affix--keyboard`: `affix--default`. Tabs to the input and then to the button and asserts, on each, `:focus-visible` true, computed `position: relative` and `z-index: 1`, and that the previous member has `z-index: auto` again; asserts the Tab order equals the DOM order.
- `affix--invalid`: inside a `yetiField`, the control made invalid through the field's forms state. Asserts both controls of the affix take the field's alert border colour (`field.css:189-190`). Its forms setup and the error state are the field spec's; this story covers the composition.
- `affix--rtl`: `affix--default` inside `dir="rtl"`. Asserts the first DOM member is the rightmost, its right-side corners are the rounded ones, and Tab follows the DOM order.

### Layer 2: browser-level (`npx nx test <lib>`, `affix.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiAffix, { tagName: 'div' })`: the host has class `affix` and `data-ngx-yeti-item-affix`, and no other attribute from the package; the directive adds no listener to its host.
- While a `YetiAffix` fixture lives, one `<link data-ngx-yeti-styles="affix">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.

A small test host covers what `createDirective` cannot: the template reference `#a="yetiAffix"` resolves; the consumer's own `class` on the host is kept beside `affix`; a `yetiAffix` inside a `yetiField` and holding a `yetiButton` renders all three presence attributes on their own hosts and each item's own link, and no affix presence attribute on any member.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `affix.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture of section 8's markup whose label and button text carry `i18n` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the host renders `class="affix"` and `data-ngx-yeti-item-affix`; the `span` and `input` render with the consumer's `id` and `aria-describedby` unchanged by this directive; `<head>` holds the item links in the order `button`, `field`, `affix`, the affix link with `data-ngx-yeti-styles="affix"`, `data-beasties-skip`, and an `href` ending `components/affix/affix.css?v=<pin>`; no element carries a `jsaction` from this directive.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `affix` has `YetiAffix`; the manifest declares no attribute, marker, or event for the item, and the check fails if a pin move adds one, so the spec is revisited before release.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids, after Yeti's own `affix.spec.js`: the join and corner cases in all three engines; at a 320 px viewport the page has no horizontal overflow and the controls have shrunk (1.4.10); with real key presses, Tab onto each member of `affix--default` and `affix--two-controls` gives that member `z-index: 1`, and a screenshot crop around the seam on the focused member's end side shows the ring's colour, not the neighbour's border (2.4.7, 2.4.11; the lift measured for `affix`, as ticket 29 did for `buttons`); with `forcedColors: 'active'`, every member keeps a visible border (recorded, after ticket 50 decision 30).

Fixture-app half, built with `outputMode: 'server'`, with an `/affix` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route renders section 8's markup and the phone example:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- with JavaScript disabled, the members' positions equal those with JavaScript on at the same width, a value can be typed into each control and an option chosen, and `@axe-core/playwright` with the six tags reports no violation;
- a value typed into the price input, a package field's `YetiFieldControl`, before hydration (with `main.js` held back) is still there after hydration (decision 161; A11Y-28);
- an affix inside a client-only `@defer` block with `affix` and `field` in the preload list shows no unstyled frame; an affix inside a `hydrate never` block keeps its link after every live affix on the page is removed;
- navigating from the affix route to a route without one removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and `docs.md` examples for the stories, and its `test/browser/components/affix.spec.js` with the fixture `test/browser/fixtures/components/affix.html` for the geometry, size, contrast, and two-control cases and axe; ticket 29's affixed-`buttons` measurement for the lift; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; the [sidebar](sidebar.md) spec for a types-only item's layer-2 and layer-3 cases.

## Out of Scope

- A directive on any member: a control directive for `aria-describedby` (Part 2 row 22; ticket 25 grilling question 11), a part directive on the `span`, or a generated id for it.
- A `size` input on the affix: the size is the field's (`Y/src/guides/components.md:99`).
- A role on the row, or any keyboard behaviour across its members.
- An input per token, or package CSS for the item (ADR 0004; building-blocks 1.13).
- Any check that the affix has at least two members, that its controls are `input` or `select`, that it has at most two attachments of each kind, or that a meaningful attachment is linked. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- How the field's control directive composes `aria-describedby`, its forms integration, and its error state: the [field](field.md) spec's.
- The button's own contract, busy state, and its `spinner` acquisition: the [button](../issues/76-spec-button.md) spec's.
- A row of buttons joined the same way: that is `buttons` with `affix` (Part 2 row 27; `docs.md`, "When to use it"), the [buttons](../issues/77-spec-buttons.md) spec's.
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiAffix]`, class only, no inputs | building-blocks Part 2 row 22; [Decide: the spec list](../issues/11-decide-spec-list.md) row 22 |
| Static host class; the consumer writes no Yeti class | ADR 0003 points 1 and 2 |
| No directive on any member; members are styled by element and position | building-blocks 1.1 |
| `aria-describedby` to a meaningful prefix stays the consumer's; no generated id | Part 2 row 22; ticket 25 grilling question 11 and Triage |
| The consumer's description ids are composed with the field's hint and error ids by the field's control directive | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 46, after Material's `userAriaDescribedBy` |
| No injection token, no host directives | building-blocks 1.9; Part 2, "Two findings that hold across the matrix" |
| `YetiAffix` marks its host with `data-ngx-yeti-item-affix` and acquires the item file | ADR 0045; ADR 0060 point 2; ticket 50 decisions 6 and 42 |
| No cross-item acquisition (`button` and `field` load through their own directives) | ADR 0060 point 9 |
| `exportAs` `yetiAffix`; class name with no collision | building-blocks 1.3; ADR 0080 points 3 and 4 |
| Entry point `ngx-yeti/affix` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 22; ticket 50 decision 18 |
| Tokens are the consumer's | ADR 0004 |
| Item file as a counted link in Yeti's order | ADR 0060 points 2 to 6 |
| No ledger row; no forced-colours rule | Part 2 row 22; ticket 50 decisions 26 and 30 as precedent |
| Contrast assertion at 4.5:1 in both schemes | ADR 0015 point 3; ticket 50 decision 8 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A price with its currency, with no forms binding on the control, the unit linked by id:

```html
<div yetiField>
  <label for="amount" i18n>Amount</label>
  <div yetiAffix>
    <span id="amount-unit" i18n>EUR</span>
    <input id="amount" type="number" min="0" aria-describedby="amount-unit" />
  </div>
</div>
```

```ts
import { YetiAffix } from 'ngx-yeti/affix';
import { YetiField } from 'ngx-yeti/field';

@Component({
  selector: 'app-amount',
  imports: [YetiField, YetiAffix],
  templateUrl: './amount.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Amount {}
```

The unit said in the label instead, which needs no id and is always correct (usage rule 3):

```html
<div yetiField>
  <label for="distance" i18n>Distance in kilometres</label>
  <div yetiAffix>
    <input id="distance" type="number" yetiFieldControl [formField]="form.distance" />
    <span>km</span>
  </div>
</div>
```

Two controls, the second named by its own `aria-label` (usage rule 4), and a search box with its button outside any field:

```html
<div yetiAffix>
  <select aria-label="Country code" i18n-aria-label><option>+1</option><option>+44</option></select>
  <input id="phone" type="tel" />
</div>

<form role="search">
  <div yetiAffix>
    <input type="search" aria-label="Search the docs" i18n-aria-label />
    <button yetiButton type="submit" i18n>Search</button>
  </div>
</form>
```

A page whose form renders inside a client-only `@defer` block preloads the items: `provideYetiStyles({ preload: ['field', 'affix', 'button'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/affix/affix.css`, loaded by `YetiAffix` as a counted link (section 13). The consumer writes nothing for the item beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` sets the private size tokens from a field's `data-size`; `base/controls.css` draws controls outside a field; `base/typography.css` draws the focus ring and ranks the lift below sticky bars and the skip link (`:79`, `:101-104`); the token files declare the seven tokens.
3. **Cross-item rules:** `.affix > .button` in `affix.css` (the button's radius), and `field.css:189-190` (the invalid border on an affix's controls). Each item's directive loads its own file; the affix acquires none of theirs (section 13).
4. **Tokens:** reads the seven public tokens of section 1; writes none.
5. **What breaks without the item file:** the members sit inline with their own margins, each rounded on all corners, with a double border at every seam; a `span` attachment is plain text with no box; controls do not grow to fill the row, and nothing lifts the focused member. The page still works, with no error.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled all 49 of Yeti's class names with Tailwind 4.3.3, and only `container`, `grid`, and `table` produced a utility (measured); `affix` produced none.

### Platform features to adopt when the browser target moves

None. Flexbox and logical border radii, the two features the manifest lists as unguarded, are inside Baseline 2025, and Yeti guards nothing for the item (section 6).

### Single-page-application pieces relied on

None: the item uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
