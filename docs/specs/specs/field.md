# Spec: field (component)

Ticket: [83. Spec: field (component)](../issues/83-spec-field.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [ADR 0020](../adr/0020-field-validity-comes-from-angular-forms.md) (validity comes from Angular forms: Signal Forms' `FORM_FIELD`, then `NgControl`); [building-blocks.md](../building-blocks.md) Part 2 row 33 (custom Angular) and Part 1; [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 117 to 121; [ledger.md](../ledger.md) rows A11Y-1d (checkbox, radio, switch, and range under forced colours), A11Y-6 (the required `*` in the accessible name), A11Y-14, A11Y-19, and A11Y-28 (ticket 50 decision 161); the [events](events.md) spec's `invalid` output; [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decisions 2, 6, 8, 18, and 42, and decision 46 (the `aria-describedby` merging rule, from ticket 72); the [affix](affix.md) spec's composition with fields; [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md) exception 1, [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0013](../adr/0013-parts-name-their-targets-by-reference.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md); [architecture-guide.md](../architecture-guide.md) P20 and P21 (which rank below the records). Evidence: [Research: what `validate.js` does, and replacing it with Angular Signal Forms](../issues/19-research-yeti-validate-and-signal-forms.md) ([research/yeti-validate-and-signal-forms.md](../research/yeti-validate-and-signal-forms.md)). `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NGP/` is `github.com/angular/angular/packages/` at `5db6fc4453` (22.2.0); `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x). The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 159 to 166), and each is cited where it applies.

## Problem Statement

Yeti's `field` is "one form control with its label, an optional hint, and an error that shows itself when the control is invalid" (`Y/src/components/field/manifest.json`). It is one **Identity class**, `field`, on a `div` or a `fieldset`, with three **Attributes** (`data-variant`, the colour of a checked checkbox or radio; `data-size`, the control's height and text; `data-inline`, the label beside the control) and two **Markers** (`data-hint` on the help text, `data-error` on the error message). Its CSS draws native controls in Yeti's look: text inputs, selects, textareas, checkboxes, radios, a checkbox with `role="switch"` as a switch, and a range with a filled track. The error stays hidden until the control matches `:user-invalid` or carries `aria-invalid="true"`, and a `required` control gets a `*` after its label (`Y/src/components/field/field.css`). Two optional **Modules** belong to it: `range.js`, which writes how far along a range's value sits into `--yeti-range-value` and the value into an `output`, and `validate.js`, which on a refused submit marks each invalid control `aria-invalid="true"`, writes the browser's message into an empty `[data-error]`, focuses the first invalid control, and dispatches `yeti:invalid` with the controls.

An application developer using ngx-yeti cannot use the item as Yeti documents it:

- The developer writes no Yeti class or attribute; directives bind them ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2).
- `validate.js` never runs under an Angular form directive. `FormRoot` and the reactive form directives call `preventDefault()` on the submit first, and `validate.js` returns when the submit is already prevented. So no control is marked and no message is written (measured in three engines, [ticket 19](../issues/19-research-yeti-validate-and-signal-forms.md)). The package loads no Module in any case ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md)).
- Angular's forms set neither `aria-invalid` nor `aria-describedby` (read, ticket 19). After a refused submit only a natively invalid control matches `:user-invalid`, so Yeti's CSS shows no error at all for an `email()`, `pattern()`, or custom rule of Signal Forms (measured, ticket 19).
- `range.js` scans the page once at load, misses every range Angular renders later, and paints the fill only after it runs, so the server-rendered first paint is wrong ([ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md) exception 1).
- Yeti's `*` after a required control's label is generated content with no alternative text, so the control's accessible name becomes "Email *" (ledger A11Y-6, measured in Chromium's engine tree).
- Under forced colours a checked checkbox or radio shows no mark, the switch no thumb or state, and the range no track or fill (ledger A11Y-1d, measured in Chromium and Firefox). Yeti ships no `forced-colors` rule.
- Before hydration a server-rendered form is plain HTML. A submit is a native GET that puts every field, passwords included, into the URL and reloads the page, losing the entry (ledger A11Y-19; [ADR 0020](../adr/0020-field-validity-comes-from-angular-forms.md) point 5).

## Solution

Five directives and one attribute-selector Angular component in the secondary entry point `ngx-yeti/field` ([building-blocks.md](../building-blocks.md) Part 2 row 33; 1.3):

- **`YetiField`**, the **Item directive** and **Coordinating directive**, on `[yetiField]` (a `div` or a `fieldset`), `exportAs: 'yetiField'`. It binds `field` as a static host class and `data-variant`, `data-size`, and `data-inline` from the inputs `variant` (`YetiVariant`), `size` (`YetiSizeControl`), and `inline` (`booleanAttribute`). It sets the static presence attribute `data-ngx-yeti-item-field` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), acquires the `field` **Item file** ([setup](setup.md)'s `injectYetiItemStyles('field')`, last in its constructor), and provides `yetiFieldToken`. It binds `[style.--yeti-range-value]` from a `computed` over its registered range control, rendered on the server (ADR 0004 exception 1).
- **`YetiFieldHint`** on `[yetiFieldHint]`, a **Part directive**, and **`YetiFieldError`** on `[yetiFieldError]`, an attribute-selector **Angular component**. Each sets its static marker (`data-hint`, `data-error`) and an `id` (the consumer's static `id`, else a generated one, [generated-ids](generated-ids.md)) and registers it with its field. The error renders the control's first error message where the consumer's slot is empty, as `validate.js` writes only into an empty slot. To do that without overwriting the consumer's text and without a DOM write, `YetiFieldError` is an attribute-selector Angular component whose template is one `ng-content` with the message as its fallback content ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 159).
- **`YetiFieldControl`** on `input[yetiFieldControl]`, `select[yetiFieldControl]`, and `textarea[yetiFieldControl]`. It reads field state by self-injection, Signal Forms' `FORM_FIELD` first, then `NgControl` (ADR 0020 point 1; building-blocks 1.9). It binds `aria-invalid` from one error-state policy, every control of a group included, and `aria-describedby` from the consumer's own ids followed by the hint's and the error's ids (ADR 0020 point 2; ticket 50 decision 46). A range control reports its share (`range.js:20-26`) to its field.
- **`YetiFieldOutput`** on `output[yetiFieldOutput]`, which renders the field's range value as its text (`range.js:37`).
- **`YetiForm`** on `form[yetiForm]`, a **Free behaviour directive** of the item, `exportAs: 'yetiForm'`: a read-only `ready` signal, false on the server and until the first client render callback (ADR 0020 point 5; A11Y-19), and the `invalid` output with `YetiInvalidDetail` (`{controls}`) when a submit is refused ([events](events.md)).

The package also adds two kinds of rule to its accessibility stylesheet in `@layer ngx-yeti` ([setup](setup.md); ADR 0060 point 8): the required marker with empty alternative text (A11Y-6), and the forced-colours rules for checked controls, the switch, and the range (A11Y-1d).

Validity stays Angular's. The package ports no validator, no message catalogue, and no submit handling. Native constraint validation and `:user-invalid` stay as they are; the package neither suppresses them nor adds a live region (ADR 0020 points 1 and 3). The native control keeps its own value and `checked`, and no directive implements `ControlValueAccessor` or `FormValueControl` (architecture-guide P20).

## User Stories

1. As an application developer, I want to write `yetiField` where Yeti's docs write `class="field"`, so that I never write Yeti's class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="field"` and `data-*` attributes, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want `variant`, `size`, and `inline` inputs typed by Yeti's own vocabularies, so that a misspelt value fails to compile.
4. As an application developer, I want an unset input to render no attribute, so that Yeti's defaults (`primary`, `md`) apply from its CSS.
5. As an application developer, I want to write `size="lg"` statically, so that the field and any affix in it scale together.
6. As an application developer, I want `inline` as a bare attribute, so that `<div yetiField inline>` puts the label beside the control.
7. As an application developer, I want the hint and the error marked by directives, so that I never write `data-hint` or `data-error`.
8. As an application developer, I want the hint's and the error's ids generated when I write none, so that I do not invent ids to link them.
9. As an application developer, I want my own `id` on a hint or an error kept, so that a server or a test can address it.
10. As an application developer, I want the control's `aria-describedby` composed from the hint's and the error's ids, so that a screen reader hears the help text and the error without my writing the ids.
11. As an application developer, I want my own `aria-describedby` ids kept first in the composed list, so that an affix's unit or another description is never replaced.
12. As an application developer, I want `aria-invalid="true"` set from my Angular form's state, so that Yeti's error look shows for every rule, not only for constraints the browser knows.
13. As an application developer using Signal Forms, I want the control directive to read the field through `[formField]`, so that I add one attribute beside it and nothing else.
14. As an application developer using reactive or template-driven forms, I want the same directive to read `NgControl`, so that existing forms get Yeti's error contract too.
15. As an application developer, I want the error to show after the person leaves the control or after a submit, so that nothing is red while they type their first character.
16. As an application developer, I want the error slot to show the failing rule's message when I leave it empty, so that I write each message once, in the schema.
17. As an application developer, I want the text I write in the error slot never to be overwritten, so that a fixed message stays as I wrote it.
18. As an application developer, I want every radio of a group marked invalid together, so that the group's error shows as Yeti designed it.
19. As an application developer, I want a group's hint and error on its `fieldset`, so that the message sits under the legend, as Yeti's examples show.
20. As an application developer, I want a range's fill correct in the server HTML, so that the first paint matches the value.
21. As an application developer, I want the range's fill and readout to follow the thumb as it is dragged, so that the number and the track agree.
22. As an application developer, I want the range readout rendered by a directive on an `output` element, so that I do not need `range.js`.
23. As an application developer, I want a checkbox with `role="switch"` drawn as a switch, so that I keep a native checkbox and its forms binding.
24. As an application developer, I want the `invalid` output on my form with the invalid controls, so that I can count them or scroll a summary into view, as Yeti's `yeti:invalid` allowed.
25. As an application developer, I want `$event.controls` typed as elements in document order, so that I can focus or scroll any of them.
26. As an application developer, I want focus moved to the first invalid control after a refused submit, so that the person starts where the first error is ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 160).
27. As an application developer, I want a `ready` signal on the form, so that I can keep the submit control disabled until the application is live.
28. As an application developer whose server handles native posts, I want to leave `ready` unbound and use `method="post"`, so that the form works before and without JavaScript.
29. As an application developer, I want a server-reported error written as a static `aria-invalid="true"` kept through hydration, so that Yeti's server round trip still works ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 164).
30. As an application developer, I want a server-reported error to clear once the person changes the value, so that a fixed field stops being red.
31. As an application developer, I want values typed before hydration kept after it, so that a person who starts filling the form early loses nothing ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 161).
32. As an application developer, I want an affix in the control slot to keep working with the field's label, hint, error, and size, so that I compose the two items as Yeti does.
33. As an application developer, I want the control inside an affix to find its field, so that `yetiFieldControl` works in the affix's control slot.
34. As an application developer, I want a template reference on each directive (`#f="yetiForm"`), so that I can bind `f.ready()` and read state.
35. As an application developer, I want to import everything from `ngx-yeti/field`, so that a `@defer` block can split the item.
36. As an application developer, I want the `field` item file loaded when the first field renders and removed after the last leaves, so that I do not import `field.css` globally.
37. As an application developer, I want the item file in the server HTML when a page has a field, so that the first paint is already styled.
38. As an application developer, I want hydration to change nothing on a pristine field, so that I get no `NG05xx` error and no reflow.
39. As an application developer, I want a form inside a `@defer (hydrate on ...)` block to work once it hydrates, with the submit held until then, so that incremental hydration loses no entry.
40. As an application developer, I want to know that a held form does not belong inside a `hydrate never` block, so that I do not ship a form whose submit never enables.
41. As an application developer, I want a form inside a client-only `@defer` block to show no unstyled frames when I preload `field`, so that the form does not jump.
42. As an application developer using `withI18nSupport()`, I want translated labels, hints, and messages to hydrate without a re-render, so that localised forms keep the server's DOM.
43. As an application developer using zoneless change detection, I want every state the directives bind to be a signal, so that the view refreshes without zone.js.
44. As a keyboard user, I want every control to keep its native keys, so that Tab, Space, arrows, and Enter behave as in any form.
45. As a keyboard user, I want the focus ring of every control visible, so that I always know where I am.
46. As a screen-reader user, I want a required control's name to be its label only, without "star", so that names match what I hear elsewhere.
47. As a screen-reader user, I want to hear that a control is required from its `required` state, so that the marker's meaning is not lost.
48. As a screen-reader user, I want an invalid control announced as invalid with its message as its description, so that I know what to fix when I reach it.
49. As a screen-reader user, I want the error's text out of the control's description while no error shows, so that I do not hear a message that is not on screen ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 163).
50. As a screen-reader user, I want a switch announced as a switch with its state, so that I know whether it is on.
51. As a screen-reader user, I want the range's value announced once, from the input, so that the visible readout does not repeat it.
52. As a low-vision user, I want the hint, the error, and the labels to meet 4.5:1 contrast in the light and dark schemes, so that I can read them.
53. As a low-vision user, I want an off switch's track and an invalid control's border to meet 3:1 against their background, so that state does not depend on faint lines.
54. As a forced-colours user, I want a checked checkbox or radio to show its mark, so that I can tell which choices are made.
55. As a forced-colours user, I want a switch to show whether it is on, so that I can use it at all.
56. As a forced-colours user, I want a range to show its track and how far it is filled, so that I can see the value.
57. As a person who submits before the page is live, I want nothing to happen rather than a GET that puts my password in the URL, so that my entry is safe and kept.
58. As a person filling a form with JavaScript off on a server-rendered page, I want every control to be usable, so that I can at least enter and read my data.
59. As a package maintainer, I want the contract check to assert the class, the three attributes, the two markers, and the `yeti:invalid` event against the manifest, so that a pin move that changes them fails first.
60. As a package maintainer, I want each behaviour of `range.js` and `validate.js` listed as kept, changed, or removed, so that the replacement can be checked against the pin.
61. As a package maintainer, I want the error-state policy as one pure function, so that it is tested once at the node level.
62. As a package maintainer, I want the package's forced-colours and required-marker rules to select only Yeti's state hooks, so that no private token is read.
63. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default fails no test for no reason.
64. As a package maintainer, I want the class names checked against Yeti's typings at the pin, so that a collision is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/field/manifest.json`, `field.css`, `range.js`, `validate.js`, `docs.md`, and `example.html`, and in `Y/src/layouts/attributes.css`, `Y/src/base/controls.css`, and Yeti's tests `Y/test/browser/components/field.spec.js` and `validate.spec.js`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `field`, `component`, `Forms and Actions` |
| `class` | `field` |
| `attributes` | `data-variant`, enum, vocabulary `variant` (nine values), default `primary`: "The color of a checked checkbox or radio." `data-size`, enum, vocabulary `size-control` (`sm`, `md`, `lg`), default `md`: "Scales the control's height and text." `data-inline`, boolean: "Put the label beside the control. Checkboxes and radios are inline without it." |
| `classes` | empty |
| `children` | `> label` (max 1, "with for pointing at the control's id. Required unless the field is a fieldset with a legend"); `> legend` (max 1); `> input`, `> select`, `> textarea` (max 1 each, "The control"); `> .affix` (max 1, "The control slot as an affix"); `> output` (max 1, "A range's value, written by range.js and drawn over the thumb. Put it before the input."); `> [data-hint]` (max 1); `> [data-error]` (max 1, "hidden until the control is invalid") |
| `markers` | `data-hint` on `> *` ("Help text, referenced by the control's aria-describedby"); `data-error` on `> *` ("The error message, hidden until the control is invalid") |
| `tokens` (public) | `--yeti-field-gap`, `--yeti-control-size`, `--yeti-control-radius`, `--yeti-control-border`, `--yeti-switch-track`, `--yeti-switch-thumb`, `--yeti-range-value` ("range.js sets it"), `--yeti-control-surface`, `--yeti-control-chevron`, `--yeti-color-alert`, `--yeti-color-primary` and its `-subtle`, `-soft`, `-strong`, `-text` stops, `--yeti-on-primary`, `--yeti-text-md`, `--yeti-space-sm`, `--yeti-weight-strong`, `--yeti-color-text`, `--yeti-border-width`, `--yeti-duration-fast`, `--yeti-ease`, `--yeti-color-border-strong`, `--yeti-radius-full`, `--yeti-space-xs`, `--yeti-text-sm`, `--yeti-color-text-muted`, `--yeti-color-alert-text`, `--yeti-space-md` |
| `tokens` (private) | `--_yeti-range-thumb`, `--_yeti-range-at`, `--_yeti-variant` and its stops, `--_yeti-on-variant`, `--_yeti-size-text`, `--_yeti-size-space` |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: the label's `for` must match the control's `id`; reference the hint and the error from the control with `aria-describedby`; `aria-invalid="true"` for errors found on the server; "The required marker is decoration; the required attribute is what assistive tech reads"; a switch is a checkbox with `role="switch"`; a range needs a label and `aria-valuetext` when the numbers are not what a person would say; with `validate.js`, `aria-invalid` and the browser's message are set on a refused submit |
| `js` | `range.js` (optional, no events); `validate.js` (optional), event `yeti:invalid` with `detail` `{ controls }`, "Dispatched on the form when a submit is refused, carrying the invalid controls in document order." |
| `support` | `unguarded`: `:has()`, `:user-invalid`, `appearance: none`, `lh unit`; `guarded`: empty |
| `since` | `7.0.0` |

How it works, in `@layer yeti.components` (`field.css`): `.field` is a flex column with `--yeti-field-gap` (`:5-9`). Without `data-variant` and `data-size` it sets its own private defaults (`:10-11`); with them, the always-loaded `layouts/attributes.css` sets the same private tokens (`:237-259`). Text-like controls, selects, and textareas take the control tokens and a border-colour transition (`:24-34`); a focused one takes `--yeti-color-border-strong` (`:47-49`). Checkboxes and radios are redrawn with `appearance: none`, and a checked one is filled with the variant colour inside an inset ring drawn with `box-shadow` (`:52-69`). A checkbox with `role="switch"` is a track with a thumb drawn as a `radial-gradient` background image that slides by `background-position` (`:76-93`). A range is a thin track whose fill is a `linear-gradient` sized by `--_yeti-range-at`, computed from `--yeti-range-value` on the field (`:15-16`, `:107-141`). An `output` before the range sits over the thumb (`:153-165`). Checkboxes, radios, and `data-inline` fields lay out in a row (`:168-176`). The hint is small muted text (`:179-182`). The error is `display: none` until the field `:has(:user-invalid, [aria-invalid="true"])`, and then the control's border, or an affixed control's, turns to `--yeti-color-alert` (`:183-190`). A field that holds a `[required]` control gets `content: " *"` after its label or legend in `--yeti-color-alert-text` (`:193-196`). A `fieldset.field` gets a padded, bordered box (`:199-204`).

Attributes left to the consumer: none of Yeti's three, by [ticket 26](../issues/26-decide-yeti-data-attributes-mapping.md) rows 117 to 121. The elements, the label's `for`, the control's `id`, `type`, `name`, `required`, `role="switch"`, `aria-valuetext`, and every form attribute are the consumer's or the forms library's (ADR 0003 point 3; building-blocks 1.4, "A directive may still read the consumer's own attributes it does not own").

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `field` | static host class on `[yetiField]` (`YetiField`) | always | ADR 0003 point 1; Part 2 row 33 |
| `data-variant` | 9 values (`variant`) | `variant: YetiVariant` on `yetiField`, bound to `[attr.data-variant]` | unset renders nothing; Yeti's default `primary` applies; not an HTML attribute name | ticket 26 row 117 |
| `data-size` | `sm`, `md`, `lg` | `size: YetiSizeControl` on `yetiField`, bound to `[attr.data-size]` | unset renders nothing (`md`); HTML `size` is a form-control attribute, so on Yeti's hosts (`div`, `fieldset`) it is `inert`: no binding, and a static `size="lg"` stays as an attribute with no effect | ticket 26 row 118; building-blocks 1.4 |
| `data-inline` | boolean | `inline: boolean` (`booleanAttribute`) on `yetiField`, bound to `[attr.data-inline]` as `''` or `null` | unset renders nothing | ticket 26 row 119 |
| Marker `data-hint` | on `> *` | `YetiFieldHint` sets static `data-hint=""` | always; no input | ticket 26 row 120; ADR 0070 rule P |
| Marker `data-error` | on `> *` | `YetiFieldError` sets static `data-error=""` | always; no input | ticket 26 row 121; ADR 0070 rule P |
| Children `> label`, `> legend` | the name | the consumer's elements; the label's `for` is the control's static `id` | not applicable | manifest; Yeti's validator |
| Children `> input`, `> select`, `> textarea` | the control | `YetiFieldControl` beside the consumer's forms directive | not applicable | Part 2 row 33; ADR 0020 point 1 |
| Child `> .affix` | the control slot as an affix | `YetiAffix` ([affix](affix.md)); the controls inside carry `YetiFieldControl` | not applicable | affix spec, section 3 |
| Child `> output` | a range's value | `YetiFieldOutput` | not applicable | Part 2 row 33; `range.js:34-37` |
| `aria-invalid` on each control | Yeti's state hook | `YetiFieldControl` binds `'true'` or `null` from the error-state policy | the consumer's static `aria-invalid="true"` is adopted ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 164) | ADR 0003 point 3; ADR 0020 point 2; A11Y-14 |
| `aria-describedby` on each control | the author's | `YetiFieldControl` binds the consumer's ids, then the hint's id, then the error's id while the error state is true ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 163), without duplicates; `null` when empty | input aliased `aria-describedby`; the static form is `output`: the consumer's static ids feed the input and the bound value replaces the attribute in the same pass | ADR 0020 point 2; ADR 0013; ticket 50 decision 46 (from ticket 72) |
| `id` on hint and error | the author's | `[attr.id]` from `injectYetiId('field-hint')` and `injectYetiId('field-error')`, the consumer's static `id` first | always rendered | ADR 0044; [generated-ids](generated-ids.md) |
| Error text | `validationMessage` written into an empty slot | the control's first error `message` as the fallback content of `YetiFieldError` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 159) | consumer content wins | Part 2 row 33; ADR 0020 point 2 and consequences |
| Event `yeti:invalid` on `form` | `{ controls }` | `invalid` output of `YetiForm`, `YetiInvalidDetail` | not applicable | [events](events.md) section 2; Part 2 row 33 |
| Token `--yeti-range-value` | written by `range.js` | `[style.--yeti-range-value]` on `yetiField` from a `computed` over its registered range control | `null` when the field has no range control | ADR 0004 exception 1; Part 2 row 33 |
| Other public tokens | the theming surface | the consumer's; the package writes none | not applicable | ADR 0004 |
| Private tokens | Yeti's | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-field=""` on `[yetiField]` only | always | ADR 0045; ticket 50 decision 6 |
| Injection tokens (package) | not Yeti's | `yetiFieldToken` (provided by `YetiField`); `yetiFormToken` (provided by `YetiForm`; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 162) | not applicable | Part 2 row 33; building-blocks 1.3, 1.9 |

**Module replaced: `range.js`** ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); ADR 0004 exception 1):

| `range.js` behaviour (line) | Package | Kept, changed, or removed |
| --- | --- | --- |
| The share: `min` default 0, `max` default 100, `(value - min) / span` clamped to 0..1, 0 for an empty or non-finite span (`:20-26`) | the same pure function, called by `YetiFieldControl` on a `type="range"` host | kept |
| Writes `--yeti-range-value` on the closest `.field`, else on the input (`:29-33`) | `YetiField` binds it on its own host; a range outside any field gets nothing, because Yeti styles a range only under `.field` (`field.css:107`) | kept on the field; changed outside a field |
| Writes `input.value` into the field's `> output` (`:34-37`) | `YetiFieldOutput` renders the value as its text | kept |
| Syncs every range once at load (`:40-41`) | host bindings rendered on the server, so the first paint is right | changed |
| One delegated `input` listener on `document` (`:45-48`) | the control's own `input` host listener, and the forms state where one is bound | changed |
| A `MutationObserver` for ranges added later (`:52-58`) | none: each directive sets up its own element when created | removed |

**Module replaced: `validate.js`** (ADR 0040; ADR 0020):

| `validate.js` behaviour (line) | Package | Kept, changed, or removed |
| --- | --- | --- |
| Needs `novalidate` on the form (`:73-75`) | `FormRoot` renders it, and the reactive and template-driven modules add it to every form in a template that imports them (ticket 19); usage rule 10 | changed |
| Validity from native constraint validation, `willValidate && !validity.valid` (`:113`) | validity from Angular's forms state: `FORM_FIELD`, then `NgControl` | changed (ADR 0020 point 1) |
| Runs on submit only, "never before" (`:69-71`) | the error-state policy shows the error once the control is touched or the form submitted (section 4) | changed |
| Returns when the page prevented the submit first (`:107-108`) | not needed: Angular's form directives prevent the submit, and `YetiForm` never calls `preventDefault()` | removed |
| Prevents the submit (`:115`) | `FormRoot` or the reactive form directive does | removed |
| Sets `aria-invalid="true"` on every invalid control, radios included (`:90`, `:116`) | `YetiFieldControl` binds it from the policy, every control of a group included | kept (ADR 0020 point 2) |
| Writes into the nearest field that has a `[data-error]` (`:96`) | a control's hint and error are its field's, else the nearest enclosing field's that has them (section 3) | kept |
| Writes `validationMessage` only into an empty slot or one it wrote before (`:87`, `:98-100`) | the rule's author message, as fallback content where the consumer's slot is empty; author text is never replaced ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 159) | changed (ADR 0020 consequences: the browser's localised message is not available from Signal Forms) |
| Focuses the first invalid control (`:119`) | `YetiForm` focuses the first invalid registered control on a refused submit ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 160) | kept |
| Dispatches `yeti:invalid` with `{ controls }` (`:120`) | the `invalid` output; no DOM event | changed ([events](events.md) rules 1 and 5) |
| Clears `aria-invalid` on `input` and `change` once valid, a radio group together (`:127-142`) | the policy follows the forms state continuously; radios bound to one path share one state | changed |
| Delegated on `document`, so later forms work (`:77-79`) | each `form[yetiForm]` has its own host listener | changed |

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads the public tokens listed in section 1. The package writes one, `--yeti-range-value`, as a host style binding on the field (exception 1), and no other. A consumer sets the rest in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`; derived tokens such as `--yeti-control-radius` and `--yeti-switch-track` also take effect on one field and its descendants (`Y/src/guides/theming.md:38`). Yeti's docs ask a theme that darkens the control border to set `--yeti-switch-track` and `--yeti-switch-thumb` so an off switch still clears 3:1 against the page (`docs.md:18`); the package keeps that as the theme author's. Private tokens are never read or written.

### 3. Hierarchy and DI shape

```
form[yetiForm]                         provides yetiFormToken; ready; (invalid)
  div[yetiField] | fieldset[yetiField] provides yetiFieldToken; injects its parent field (optional, skipSelf)
    label / legend                     the consumer's
    output[yetiFieldOutput]            injects yetiFieldToken (required)
    input|select|textarea[yetiFieldControl][formField]
                                       self-injects FORM_FIELD, else NgControl; injects yetiFieldToken
                                       and yetiFormToken (both optional); registers with both
    div[yetiAffix] > input[yetiFieldControl]   the affix spec's; DI reaches the field through the affix
    [yetiFieldHint]                    injects yetiFieldToken (required); registers its id
    [yetiFieldError]                   injects yetiFieldToken (required); registers its id; reads the control
    div[yetiField] (one per choice)    a nested field of a group
```

- `yetiFieldToken` (`InjectionToken<YetiField>`, in `field-tokens.ts` with `import type`, description `'yetiFieldToken'`), provided by `YetiField` with `useExisting` (building-blocks 1.3, 1.9). The hint and the error inject it without `optional`: neither has meaning outside a field, and Yeti styles them only under `.field >` (`field.css:179-188`). A hint or an error outside a field fails with NG0201, which names the token. `YetiFieldControl` and `YetiFieldOutput` inject it optionally; a control outside a field still gets `aria-invalid`, as `validate.js` marks a control outside every field (`:89-97`).
- Registration: the hint, the error, and the control register with their field at construction and unregister on destroy. They are unordered parts (one of each per field, manifest `max: 1`), so no sorting is needed (building-blocks 1.9; architecture-guide's DI principle: "an unordered part may register at construction"). A control also registers with its form through `yetiFormToken` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 162, for the token and for sorting the form's controls in document order only when a submit is refused).
- Groups: a `fieldset[yetiField]` holds one nested `div[yetiField]` per checkbox or radio, as Yeti's example does. Each `YetiField` injects its parent field (`yetiFieldToken`, `{optional: true, skipSelf: true}`). A control's hint and error are its own field's, else the nearest enclosing field's that has them, which is `validate.js`'s rule of "the nearest field that has a slot" (`validate.js:91-96`) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 165).
- Affix: `div[yetiAffix]` is an element between the field and its control in the same template, so `YetiFieldControl` inside it reaches `yetiFieldToken` through the element injector. This answers the affix spec's question in its section 3: the field's control directive finds a control nested in an affix. The affix's meaningful prefix id reaches the control's description through the merging rule (the consumer writes `aria-describedby="<span id>"`; the directive keeps it first), which settles the affix spec's usage rule 3 with option A of [ticket 72](../issues/72-spec-affix.md).
- Field state: `inject(FORM_FIELD, {self: true, optional: true})` from `@angular/forms/signals` first, then `inject(NgControl, {self: true, optional: true})` only when there is no `FORM_FIELD`, because on a `[formField]` element `NgControl` is Signal Forms' interop control (`NGP/forms/signals/src/directive/form_field.ts:106-118`, read; building-blocks 1.9). Signal Forms state is read from `FormField.state()` and `FormField.errors()`; reactive and template-driven state is read from `NgControl.control.events` into signals, because reactive forms have no public state signals. A form's submitted state under reactive and template-driven forms is read from `FormGroupDirective` or `NgForm` (`{optional: true}`), as Material's `ErrorStateMatcher` does (`NC/src/material/core/error/error-options.ts:32-44`).
- `YetiForm` injects `FormRoot` (`{self: true, optional: true}`, from `@angular/forms/signals`) and, failing that, `ControlContainer` (`{self: true, optional: true}`), to know whether a submit is refused (section 4).
- Ids: the hint and the error each call `injectYetiId` in a field initializer and bind `[attr.id]`, because their hosts render the ids (ADR 0044 point 1; [generated-ids](generated-ids.md), "Who calls `injectYetiId`"). The control reads the ids from its field through the token and binds them in `aria-describedby`. Both ends are host bindings with equal values on the server and the client, so hydration rewrites nothing.
- No `hostDirectives`. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"); `yetiAffix` and `yetiButton` are written as nested elements.
- The only other injection is the root styles service of ADR 0060, through `injectYetiItemStyles('field')` in `YetiField` ([setup](setup.md)). Part directives, `YetiFieldControl`, `YetiFieldOutput`, and `YetiForm` set no presence attribute and acquire no item file (ticket 50 decision 6).

### 4. API

Names: none of `YetiField`, `YetiFieldHint`, `YetiFieldError`, `YetiFieldControl`, `YetiFieldOutput`, `YetiForm`, `yetiFieldToken`, or `yetiFormToken` is among the 46 names `yeti.d.ts` exports at the Pin, so each takes `Yeti` (ADR 0080 point 4; ticket 50 decision 10). Input types reuse Yeti's `YetiVariant` and `YetiSizeControl` through the generated `yeti-types.ts` (ADR 0060 point 10). The output type `YetiInvalidDetail` comes from `ngx-yeti/events` ([events](events.md) section 4).

**`YetiField`**, selector `[yetiField]`, `exportAs: 'yetiField'`:

| Member | Kind | Type and default | Notes |
| --- | --- | --- | --- |
| `variant` | `input()` | `YetiVariant \| undefined`, unset | `[attr.data-variant]` |
| `size` | `input()` | `YetiSizeControl \| undefined`, unset | `[attr.data-size]`; static form `inert` |
| `inline` | `input()`, `booleanAttribute` | `false` | `[attr.data-inline]`, `''` or `null` |

Host: static `class: 'field'`, static `data-ngx-yeti-item-field: ''`, the three attribute bindings, and `[style.--yeti-range-value]` from a `computed` over the registered range control's share, `null` without one. Providers: `yetiFieldToken`. Lifecycle: `injectYetiItemStyles('field')` as the last statement of the constructor (ticket 50 decision 42). Its registration methods are public for its parts and documented as internal to the entry point.

**`YetiFieldHint`**, selector `[yetiFieldHint]`, `exportAs: 'yetiFieldHint'`: no inputs. Host: static `data-hint: ''`, `[attr.id]`. A consumer's static `id` wins (generated-ids, step 1).

**`YetiFieldError`**, selector `[yetiFieldError]`, `exportAs: 'yetiFieldError'`, an Angular component with `ChangeDetectionStrategy.OnPush`, no styles, and no `ViewEncapsulation` choice that matters, because it has no styles. Its template is a single `ng-content` whose fallback content is `message()`, so content the consumer writes is projected and the fallback never renders ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 159). No inputs. Read-only `message: Signal<string>`, the first error of the field's control that carries a `message` (Signal Forms' `FormField.errors()`, parse errors included), or `''`. Under reactive and template-driven forms errors carry no message, so the consumer writes the text (usage rule 6). Host: static `data-error: ''`, `[attr.id]`.

**`YetiFieldControl`**, selector `input[yetiFieldControl], select[yetiFieldControl], textarea[yetiFieldControl]`, `exportAs: 'yetiFieldControl'`:

| Member | Kind | Type and default | Notes |
| --- | --- | --- | --- |
| `userAriaDescribedBy` | `input()`, alias `aria-describedby` | `string \| null`, `null` | the consumer's ids; Material `MatInput` shape (`NC/src/material/input/input.ts:243`) |
| `userAriaInvalid` | `input()`, alias `aria-invalid` | `string \| null`, `null` | a static `aria-invalid="true"` reports a server-found error ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 164) |
| `errorState` | `Signal<boolean>` | read-only | the policy below; Material's name |

Host bindings and listeners:

| Binding | Value |
| --- | --- |
| `[attr.aria-invalid]` | `'true'` while `errorState()`, else `null`; on radios too, because Yeti's group error keys on it (ADR 0020 point 2) |
| `[attr.aria-describedby]` | the consumer's ids, then the hint's id, then the error's id while `errorState()` is true, split on white space and without duplicates; `null` when empty |
| `(input)`, `(change)` | end a server-reported error once the person changes the value; on a range host, update the value the share is computed from. No `preventDefault()`, so both are replay-safe (building-blocks 1.5) |

The error-state policy, one pure function in Material's `ErrorStateMatcher` shape (ADR 0020 point 2; `error-options.ts:32-44`): under Signal Forms, `invalid() && touched()` (Signal Forms' `submit()` marks the whole tree touched, `NGP/forms/signals/src/api/structure.ts:492`); under reactive and template-driven forms, `invalid && (touched || submitted)`; with no forms directive, `false`. A server-reported error (`userAriaInvalid() === 'true'` and no `input` or `change` since creation) makes the state true on its own. The policy has no per-control override and no Defaults token (building-blocks 1.4).

Range: on a `type="range"` host (read through `HostAttributeToken('type')`), the control computes the share from the value (`FormField.state().value()`, else the `NgControl` value, else the host's own value, first from its static `value` attribute and then from its `input` events), and from `min` and `max` (Signal Forms' `min()` and `max()` where the schema sets them, else the static `min` and `max` attributes, else 0 and 100, as `range.js:21-22`), and registers it with its field ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 166, for the value sources).

Pre-hydration values ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 161): at construction the control saves the host's `value` (or `checked` on a checkbox or radio). In `afterNextRender`, which runs before event replay, it compares the saved value with what the element shows after the forms library's first write; when they differ and the saved value is not empty or unchecked, it writes the saved value back and dispatches `input` (and `change` on a checkbox or radio) on the host, so the bound control parses it through its own value path. `input[type=file]` and `select[multiple]` are skipped. In a client-rendered form the saved value is always empty or equal to the model, so nothing happens.

**`YetiFieldOutput`**, selector `output[yetiFieldOutput]`, `exportAs: 'yetiFieldOutput'`: no inputs. Host: `[textContent]` from the field's range value as text (`range.js:37`), `[attr.for]` from the range control's `id`, and static `aria-hidden: 'true'`, because the input announces its own value and Yeti asks every author to hide the readout (`docs.md:20`; `field.css:150-152`) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 166, for `for` and `aria-hidden`).

**`YetiForm`**, selector `form[yetiForm]`, `exportAs: 'yetiForm'`:

| Member | Kind | Type | Notes |
| --- | --- | --- | --- |
| `ready` | `Signal<boolean>` | read-only | `false` on the server and until the first client render callback, then `true` (`afterNextRender`) (ADR 0020 point 5; A11Y-19) |
| `invalid` | `output<YetiInvalidDetail>()` | `{ controls: readonly HTMLElement[] }` | emitted when a submit is refused ([events](events.md) section 2) |

Host: `(submit)` listener, which never calls `preventDefault()` (the forms directive owns the submission). In it, the form is refused when Signal Forms' root field is invalid (`FormRoot.fieldTree()().invalid()`), or when the `ControlContainer`'s control is invalid; with neither directive it does nothing ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 162, for this reading of Part 2's "from Signal Forms' `onInvalid` or reactive forms' submit"). On a refused submit it sorts the registered controls whose field is invalid by `compareDocumentPosition`, emits `invalid` with their hosts, and focuses the first (ticket 50 decision 160, for the focus). Providers: `yetiFormToken`. It binds no class, sets no presence attribute, and acquires no item file: Yeti has no rule for the `form` element.

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiField` on a `div`, or on a `fieldset` with a `legend` for a group, as Yeti's examples do. One field holds one control, or one affix, or the nested fields of a group (manifest `children`, `max: 1`).
2. Every control in a field carries `yetiFieldControl` beside its forms directive (`[formField]`, `formControlName`, `[formControl]`, `ngModel`) and a static `id`; the field's `label` has `for` with that `id` (manifest `a11y.notes`; Yeti's validator). A label wraps no control.
3. Write `aria-describedby` on a control only for ids of your own, such as an affix's meaningful unit; the directive adds the hint's and the error's ids. Do not list the hint's or the error's id yourself.
4. Write `aria-invalid="true"` statically only for an error the server found; the directive owns the attribute otherwise (ADR 0020, Considered options).
5. Give a field at most one `yetiFieldHint` and one `yetiFieldError`, as its direct children, never inside the label (manifest `children`; Yeti's CSS selects `.field > [data-hint]` and `.field > [data-error]`).
6. Write the error's text inside `yetiFieldError`, or leave it empty for the failing rule's own message. Under Signal Forms, give every rule a `message` when its field's slot is empty. Under reactive and template-driven forms, write the text, because their errors carry none. Every field that can show an error needs text for it (WCAG 3.3.1).
7. Give every native constraint attribute on a control a matching rule in the Angular form (`type="email"` with `email()`; `pattern` with `pattern()`). Yeti's CSS also shows the error slot on `:user-invalid`, so a constraint only the browser knows shows the slot with no message (ticket 19, measured).
8. For a range, put `output[yetiFieldOutput]` before the input (manifest `children`), set `min` and `max` statically or in the schema, and add `aria-valuetext` when the numbers are not what a person would say (manifest `a11y.notes`).
9. A switch is `input type="checkbox" role="switch"` with its label after it (`docs.md`).
10. Put `yetiForm` on every `form` that holds package fields, beside `[formRoot]` or a reactive or template-driven form directive, so that `novalidate` is set and Angular owns the submit. A Signal Forms form with neither gets the browser's bubble instead of Yeti's error text (ticket 19, measured).
11. On a server-rendered page, bind the submit control's native `disabled` to `!form.ready()` (`#form="yetiForm"`), unless the form uses `method="post"` against a server that handles native submissions (ADR 0020 point 5). Never put a held form inside `@defer (hydrate never)` (ADR 0020 consequences).
12. Bind the radios of one group to one path, and give a checkbox group's rule to each box's path, so that every control of the group is invalid together and the group's error shows (ticket 19 section 5; Yeti's `fieldset.field:has([aria-invalid="true"])`).
13. Do not write `class="field"`, `data-variant`, `data-size`, `data-inline`, `data-hint`, `data-error`, `data-ngx-yeti-item-field`, or `--yeti-range-value` by hand. The directives bind them, and hydration writes a static attribute back (ADR 0003; building-blocks, "Hydration constraints (2026-10-03)"). `size="lg"` is the input's static form, not Yeti's attribute.
14. Import every directive a template writes: `YetiField`, `YetiFieldControl`, `YetiFieldHint`, `YetiFieldError`, `YetiFieldOutput`, `YetiForm`. A forgotten `YetiFieldControl` leaves its control with no `aria-invalid` and no description, with no error, unless a template reference names its `exportAs` (NG8003) (building-blocks 1.9). A forgotten `YetiField` also leaves a hint or an error without its token; that is reported at run time (NG0201) only if their directives are imported.
15. Keep a form and all its fields inside one hydration boundary, and wrap the whole form in a consumer `@defer`, never part of it (building-blocks 1.11 decision 6).

### 5. Material comparison

| Concern | Material 22.2 (`MatFormField`, `MatInput`, `MatHint`, `MatError`, `ErrorStateMatcher`) | ngx-yeti `field` |
| --- | --- | --- |
| Shape | `mat-form-field` component renders the label, outline, and subscript; `matInput` is a directive | directives on the consumer's own label, control, hint, and error, plus one attribute-selector component for the error's fallback text ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 159); no wrapper |
| Field state | `inject(FORM_FIELD, {optional, self})` (`NC/src/material/input/input.ts:303`), then `NgControl` | the same order |
| Error policy | injectable `ErrorStateMatcher`: `invalid && (touched \|\| submitted)`; Signal Forms: `invalid && touched` (`error-options.ts:32-44`); per-input override | the same two formulas as one pure function; no override (section 4) |
| `aria-invalid` | `errorState`, but `null` while empty and required (`input.ts:85`) | `'true'` whenever the error shows, radios included, because Yeti's CSS keys on it (ADR 0020 point 2) |
| `aria-describedby` | `userAriaDescribedBy` (`input.ts:243`) first, then hint ids or error ids (`form-field.ts:759-790`, `_syncDescribedByIds`) | the consumer's ids, then the hint's id, then the error's id while it shows; Yeti keeps the hint visible beside the error, so both are described |
| Error announcement | a polite live subscript | none: Yeti relies on focus and `aria-describedby` (ADR 0020 point 3 and Considered options) |
| Message text | the consumer's `mat-error` content | the consumer's content, else the rule's `message` |
| Range and switch | `MatSlider`, `MatSlideToggle`, components with their own markup | native `input type="range"` and `input type="checkbox" role="switch"` styled by Yeti |
| Forced colours | per-control rules from CDK's `high-contrast` mixin (`slide-toggle.scss:79`, `slider.scss:85`, `_radio-common.scss:132-137`) | the same shapes in the package's accessibility stylesheet (A11Y-1d) |
| Testing | harnesses | DOM-first assertions, no harness (building-blocks 1.12) |

Borrowed: the self-injection order, the `aria-describedby` alias and id composition, the error-state formula, and the forced-colours rule shapes. Not borrowed: the form-field component, appearance and floating labels, hint hiding, `aria-invalid` null on an empty required control, and a per-control matcher.

### 6. Implementation level and primitives

Custom Angular, level 4, over Angular forms (building-blocks Part 2 row 33). The reason: the platform's constraint validation is not what Signal Forms uses, and Yeti's CSS needs `aria-invalid` for every rule (ticket 19, measured); `@angular/aria` has no form-control or form-error pattern, and no Aria pattern applies to native controls (Part 2 row 33); CDK contributes nothing here beyond the id counter's token, which [generated-ids](generated-ids.md) owns. Native constraint validation, `:user-invalid`, `novalidate`, and the native controls stay (ADR 0020 point 3).

Primitives: `FORM_FIELD` and `FormField` (`NGP/forms/signals/src/directive/form_field.ts:79-81`, `:106`), `FieldState` (`invalid`, `touched`, `value`, `min`, `max`, `errors`; `NGP/forms/signals/src/api/types.ts`), `FormRoot` (`form_root.ts:35-56`: renders `novalidate`, prevents the submit, calls `submit()`), `NgControl` and `AbstractControl.events`, `FormGroupDirective` and `NgForm` for `submitted`, `RangeValueAccessor` for a reactive range (`NGP/forms/src/directives/range_value_accessor.ts:47-49`), `computed`, host bindings, `HostAttributeToken`, `afterNextRender` (`ready`; pre-hydration values), `injectYetiId`, `injectYetiItemStyles`, and `ng-content` fallback content for the error. Not used: `provideSignalFormsConfig({classes})`, which can add classes but not attributes, so it cannot produce Yeti's `aria-invalid` (ticket 19, `NGP/forms/signals/src/api/di.ts:20-36`); `setCustomValidity()`; a live region; `focusBoundControl()` inside the package (the package focuses the control element it registered, as `validate.js` does; a consumer's `onInvalid` may still call it).

Material is a pattern source, never a level (section 5).

### 7. ARIA, keyboard, and the ledger

There is no APG pattern for a form field or for validation. The native controls carry their own roles: textbox, combobox or listbox for a `select`, checkbox, radio in a named `fieldset` group, switch (APG switch: a native checkbox with `role="switch"`, Space toggles), and slider (a native range). Ticket 17 measured them in Yeti's example: `switch "Dark mode"`, `slider "Quality" valuetext=70`, `group "Notify me by"`, `group "Plan"` (Chromium tree, [research](../research/yeti-accessibility-and-standards.md) section 4.13).

| Element | ARIA and state | Who |
| --- | --- | --- |
| `form` | `novalidate` | `FormRoot`, or Angular's forms modules |
| Control | native label through `for`; native `required` (Signal Forms renders it, `form_field.ts`); `aria-invalid="true"` while the error shows; `aria-describedby` = consumer ids, hint, error while shown | `YetiFieldControl` (A11Y-14) |
| Switch | `role="switch"` on the checkbox; `checked` | the consumer; native |
| Range | native value; `aria-valuetext` where needed | the consumer |
| Range readout | `aria-hidden="true"` | `YetiFieldOutput` |
| Hint, error | `id`; hidden error is `display: none`, so out of the accessibility tree | `YetiFieldHint`, `YetiFieldError`; Yeti's CSS |
| Group | `fieldset` with `legend` | the consumer |

Keyboard: all native; the package handles no key. Tab and Shift+Tab move between controls; Space toggles a checkbox or switch; arrows move a radio group's selection and a range's value; Enter in a text input submits the form by implicit submission, which the platform blocks while the default submit control is disabled (usage rule 11).

Focus: after a refused submit, focus moves to the first invalid control in document order, which also scrolls it into view (`validate.js:59-61`'s behaviour kept; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 160). The message reaches assistive technology through `aria-describedby` and that focus (ADR 0020 point 3). No other focus move.

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | Label through `for`; group through `fieldset` and `legend`; hint and error through the composed `aria-describedby`; the consumer's description ids kept (merging rule). Layer 1 asserts the computed name and description. |
| 1.3.5 Identify Input Purpose | The consumer's `autocomplete` tokens; every usage example carries them. |
| 1.4.1 Use of Color | An error shows text (usage rule 6) and the alert border; the required state is the `required` attribute and the `*`, not colour alone. |
| 1.4.3 Contrast (Minimum) | Labels, hint (`--yeti-color-text-muted`), error and marker (`--yeti-color-alert-text`), and control text on Yeti's defaults; Yeti's own spec asserts AA for the field's text in both schemes. Play functions assert at least 4.5:1 with the exact WCAG formula in light and dark (ADR 0015 point 3; ticket 50 decision 8). |
| 1.4.11 Non-text Contrast | Control borders, the checked fill, the off switch track (Yeti's docs: 3:1 against the page, `docs.md:18`), the range track and thumb, and the alert border. axe has no 1.4.11 rule, so play functions assert 3:1 from computed colours; a Yeti default that fails becomes a ledger row under the A11Y-10a pattern. Under forced colours, the package's rules (A11Y-1d). |
| 1.4.12 Text Spacing | Controls and messages set no fixed height that clips text (read); a textarea grows with `field-sizing` where supported (Yeti's guarded `reset.css:53-55`). |
| 2.1.1 Keyboard | Native controls only. |
| 2.4.6 Headings and Labels, 3.3.2 Labels or Instructions | Every control has a label or a legend (usage rules 1 and 2); hints describe. |
| 2.4.7 Focus Visible | Yeti's base ring on every `:focus-visible` and the focused border (`field.css:47-49`). |
| 2.5.3 Label in Name | A required control's name is its label without `*` (A11Y-6's rule). |
| 2.5.8 Target Size (Minimum) | Checkboxes and radios are `1.25em` boxes whose label (`for`) is also a target; the **Story gate**'s `wcag22aa` tag runs axe's `target-size` rule, which passed on Yeti's examples (ticket 17). |
| 3.3.1 Error Identification | `aria-invalid` plus text referenced by `aria-describedby`, for every Angular rule (A11Y-14). |
| 3.3.3 Error Suggestion | The rule's author message or the consumer's text says how to fix it (usage rule 6). |
| 3.3.7 Redundant Entry | Entries survive a refused submit; the held submit stops a pre-hydration GET from reloading the page (A11Y-19); values typed before hydration are adopted (A11Y-28; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 161). |
| 4.1.2 Name, Role, Value | Native roles; `aria-invalid` state; switch role. |
| 4.1.3 Status Messages | No live region, as Yeti: the error after a refused submit is reached by focus, and an error that shows on leaving a control is announced when the person returns to it (ADR 0020 point 3 and Considered options). |

**Ledger rows owned** ([ledger.md](../ledger.md); Part 2 row 33):

- **A11Y-1d** (forced colours). Rules in `@layer ngx-yeti`, inside `@media (forced-colors: active)`, after CDK's `high-contrast` mixin shape (`NC/src/cdk/a11y/_index.scss:48-65`): a checked checkbox or radio inside `.field` (`.field :checked`) is filled with `CanvasText`, after Material's radio (`_radio-common.scss:132-137`), because forced colours remove the variant fill and the inset `box-shadow` ring; a switch (`.field [role="switch"]`) keeps its track border in `CanvasText` and draws its on state in a system colour, after Material's slide-toggle (`slide-toggle.scss:79`), because forced colours remove the gradient thumb; a range (`.field [type="range"]`) draws its track with a `CanvasText` border and its thumb in a system colour, after Material's slider (`slider.scss:85`), because forced colours remove the gradient fill. The rules select only state hooks and elements (`:checked`, `[role="switch"]`, `[type="range"]`), never a private token. What each rule must make visible is the test: checked differs from unchecked, on differs from off, and the range's track and thumb are visible (layer 4). The exact declarations are the implementer's, measured in Chromium and Firefox, where the gap was measured.
- **A11Y-6** (required marker in the name). One rule in `@layer ngx-yeti`, as the row and Part 2 row 33 give it: `.field:has([required]) > :is(label, legend)::after { content: " *" / ""; }`, over `field.css:193-196`, with Yeti's own technique from `breadcrumbs.css:22`. The rule replaces only `content`; Yeti's colour stays. The user chose "Ledger only" for drafting an upstream issue (map, Standing rulings), so none is drafted.
- **A11Y-14** (`aria-invalid`, composed `aria-describedby`, message). As section 4. Two details are this spec's reading: the error's id joins the description only while the error state is true, and the message is the error component's fallback content ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 163 and 159).
- **A11Y-19** (held submit). `YetiForm.ready()` with the documented disabled submit control (usage rule 11).
- **A11Y-28** (values typed before hydration). `YetiFieldControl`'s pre-hydration adoption, as section 4 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 161).

The segmented control of `buttons` (A11Y-1b) wraps its radios in `label.button`, whose checked state the button spec's A11Y-1a rule (`.button:has(> input:checked)`) already draws; A11Y-1d's `.field` rule does not reach it.

### 8. Rendered HTML

Consumer markup, Signal Forms, after Yeti's example (the `stack` directive is the [stack](stack.md) spec's; `yetiButton` the [button](button.md) spec's):

```html
<form yetiForm #signup="yetiForm" [formRoot]="form" (invalid)="onInvalid($event)">
  <div yetiStack gap="lg">
    <div yetiField>
      <label for="email" i18n>Email</label>
      <input id="email" type="email" autocomplete="email" yetiFieldControl [formField]="form.email" />
      <p id="email-hint" yetiFieldHint i18n>We only use it to sign you in.</p>
      <p yetiFieldError></p>
    </div>
    <div yetiField>
      <input id="dark" type="checkbox" role="switch" yetiFieldControl [formField]="form.dark" />
      <label for="dark" i18n>Dark mode</label>
    </div>
    <div yetiField>
      <label for="quality" i18n>Quality</label>
      <output yetiFieldOutput></output>
      <input id="quality" type="range" min="0" max="100" yetiFieldControl [formField]="form.quality" />
    </div>
    <button yetiButton type="submit" [disabled]="!signup.ready()" i18n>Sign up</button>
  </div>
</form>
```

Server HTML (pristine, `form.quality` is 70; the email rule `required` carries the message "Enter your email address."; attribute order not significant; the presence attributes and item links of other items omitted):

```html
<form yetiform="" novalidate="" jsaction="submit:;">
  <div yetistack="" class="stack" data-gap="lg">
    <div yetifield="" class="field" data-ngx-yeti-item-field="">
      <label for="email">Email</label>
      <input id="email" type="email" autocomplete="email" yetifieldcontrol="" name="..." required=""
             aria-describedby="email-hint" jsaction="input:;change:;blur:;">
      <p id="email-hint" yetifieldhint="" data-hint="">We only use it to sign you in.</p>
      <p yetifielderror="" data-error="" id="ngx-yeti-field-error-0">Enter your email address.</p>
    </div>
    <div yetifield="" class="field" data-ngx-yeti-item-field="">
      <input id="dark" type="checkbox" role="switch" yetifieldcontrol="" name="..." jsaction="...">
      <label for="dark">Dark mode</label>
    </div>
    <div yetifield="" class="field" data-ngx-yeti-item-field="" style="--yeti-range-value: 0.7;">
      <label for="quality">Quality</label>
      <output yetifieldoutput="" for="quality" aria-hidden="true">70</output>
      <input id="quality" type="range" min="0" max="100" yetifieldcontrol="" name="..." jsaction="...">
    </div>
    <button yetibutton="" type="submit" class="button" disabled="">Sign up</button>
  </div>
</form>
```

The error slot holds the rule's message while the field is invalid, but Yeti's CSS keeps it `display: none` until the control matches `:user-invalid` or carries `aria-invalid`, and the control's description leaves the error's id out until the error state is true, so nothing hidden is announced. No `aria-invalid` exists in the pristine server HTML. The submit control is disabled because `ready()` is false on the server. `<head>` holds the `field` link with `data-ngx-yeti-styles="field"`, `data-ngx-yeti-app`, `data-beasties-skip`, and `href` ending `components/field/field.css?v=<pin>` (ADR 0060 points 2 and 5), in Yeti's order (`Y/src/yeti.css:44`).

Hydrated, after the person left the email empty and submitted:

```html
<input id="email" ... required="" aria-describedby="email-hint ngx-yeti-field-error-0" aria-invalid="true">
<p id="email-hint" yetifieldhint="" data-hint="">We only use it to sign you in.</p>
<p yetifielderror="" data-error="" id="ngx-yeti-field-error-0">Enter your email address.</p>
<button yetibutton="" type="submit" class="button">Sign up</button>
```

The `invalid` output fired with `{ controls: [input#email] }`, and focus is on the email input. Before any interaction the hydrated DOM equals the server DOM apart from the enabled submit control. Generated ids are equal on both sides (ADR 0044).

The delta from Yeti's docs markup: `yetiField` where the docs write `class="field"`; `yetiFieldControl` beside the forms directive; `yetiFieldHint` and `yetiFieldError` where the docs write `data-hint` and `data-error`; no hand-written `aria-describedby` for the hint and the error; `yetiFieldOutput` with no hand-written `for` or `aria-hidden`; `yetiForm` with `[formRoot]` where the docs write `novalidate`.

### 9. Animation

None of the package's. Yeti's CSS transitions a control's border colour, a checkbox's fill, and a switch's thumb on native state (`field.css:33`, `:62`, `:85`), and its reduced-motion tokens collapse them (building-blocks 1.6 point 4). The error appears with `display`, not a transition, so no completion is awaited and no completion output exists. The package uses no `animate.enter` or `animate.leave`; a field a consumer inserts with `@if` may carry a class-form one of the consumer's, and a server-rendered field never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the classes, attributes, presence attributes, ids, the composed `aria-describedby`, `--yeti-range-value`, the readout's text, the error's fallback text, and the disabled submit control are all host bindings or component template output on signal state, so the server HTML is the first paint (ADR 0011 clause 1). Signal Forms renders `name`, `required`, `min`, `max`, `minlength`, and `maxlength`, and `FormRoot` renders `novalidate`. A static `aria-invalid="true"` from the consumer is kept (section 4).
- **Before hydration:** no directive creates a node, reads layout, starts a timer or observer, or touches `window`, `history`, or `location` (ADR 0011 clause 4). Reading the host's `value` or `checked` at construction (pre-hydration values) and `getAttribute('id')` in `injectYetiId` are the only DOM reads before the first render callback, and they write nothing. A person can type and toggle; Yeti's `:user-invalid` look works natively; a range's thumb moves, but its fill and readout stay at the server's value until hydration. The submit is blocked: the disabled default submit control stops both a click and Enter's implicit submission.
- **Full hydration:** hosts are claimed as they are; 0 style mutations for the item link (ADR 0060 point 5, measured for the mechanism). Angular forms' first pass writes the model into the controls, which would clear values typed before hydration; `YetiFieldControl` writes them back and dispatches `input` before replay ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 161). `ready` turns true in the first client render callback and the submit control enables.
- **Event replay:** `(submit)` on the form and `(input)` and `(change)` on controls are host listeners, annotated with `jsaction` and replayed; none calls `preventDefault()`. Signal Forms' own `input` and `blur` listeners replay into field state. No submit is ever replayed: before hydration it is blocked by the held control, and `FormRoot` would call `preventDefault()`, which throws during replay. The `invalid` output never fires for activity before hydration ([events](events.md) section 10).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the form, its link, and the disabled submit control; the form works natively while dehydrated (typing, toggling) and the submit stays held until the block hydrates. The whole form goes in one block (usage rule 15). A block of text fields hydrates on `viewport`, `idle`, or `immediate` rather than on `interaction`, because the keystroke that hydrates an `interaction` block races the value adoption (measured in the old bundle's prototype on Foundation markup, not re-measured).
- **`hydrate never`:** the form is its server HTML, Angular's forms never run, and the held submit control never enables, so a held form does not go there (ADR 0020 consequences). A `method="post"` form without `ready` works there as plain HTML. The link stays while the host is connected (ADR 0060 point 4; ADR 0045).
- **Client-only `@defer`:** the item file is fetched when `YetiField` is constructed, which can show unstyled frames (native controls, the error slot visible, no `*`); the consumer closes the gap with `provideYetiStyles({ preload: ['field'] })`, plus `affix` and `button` where the form uses them (ADR 0060 point 6; [setup](setup.md)).
- **`withI18nSupport()`:** labels, hints, error text, and the messages in the schema are the consumer's and are usually translated; a component with `i18n` blocks needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11). `YetiFieldError`'s template has no `i18n` block of its own: its fallback text is the consumer's message.
- **Zoneless:** every bound state is a signal: forms state through `FieldState` signals or `control.events` written into signals, the range value through its host listener into a signal, `ready` through `afterNextRender` into a signal (map, Standing rulings, item 43; building-blocks 1.5).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, JavaScript off; ADR 0011 consequences): every field is styled and readable, and every control works: typing, choosing, toggling, and dragging. Yeti's `:user-invalid` error look shows for the constraints the server rendered (`required`, `min`, `max`, length). Lost: the error text from Angular's rules, `aria-invalid` from Angular's state, the range's fill and readout following the thumb (both stay at the server's value), and submission of a `ready`-held form, whose control stays disabled. A `method="post"` form submits natively, and because `novalidate` is rendered, the server validates it. A client-only application gets no such promise.
- **Hydration boundary:** the form, its fields, and their parts in one boundary (usage rule 15); the ids are equal across boundaries anyway (ADR 0044), but registration and the held submit belong to one live form.

### 11. Hydration constraints

The item complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** every attribute is a host binding on signal state with the same value on both sides; ids are equal (ADR 0044); the error's fallback text is component template output. The consumer's static `aria-describedby` and `aria-invalid` feed inputs, are written back at hydration, and are replaced by the bound value in the same pass, the shape of ticket 50 decision 9; the e2e asserts no `NG05xx` and the composed value after hydration.
- **No direct DOM manipulation:** the only imperative calls are `focus()` on a refused submit and, for pre-hydration values, writing a saved value back and dispatching `input` and `change`, all after hydration in a handler or `afterNextRender` (building-blocks 1.5).
- **Valid HTML:** the directives change no element. The error component's host is the consumer's `p` or `div`, and its content is text. No control sits inside a `label` (usage rule 2).
- **`preserveWhitespaces`:** a whitespace-only `yetiFieldError` counts as empty only while whitespace is not preserved, Angular's default; with `preserveWhitespaces: true` the fallback never shows, so the application keeps one setting (documented).
- **No output branched on the platform:** none. `ready` is false on the server because `afterNextRender` never runs there, not because of a platform check.
- **Static attributes the directives bind:** usage rule 13.

### 12. Single-page application

None. The item has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). A route's fields leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-field]` host is connected (ADR 0060 point 4; ADR 0045). A refused submit moves focus within the page and navigates nowhere.

### 13. Item file

`yeti-css/css/components/field/field.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiField]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:44`, before `affix` at `:45`), and removed after the last host carrying `data-ngx-yeti-item-field` has left the DOM. Nested group fields count like any other. Part directives, the control, the output, and the form acquire nothing (ticket 50 decision 6). The consumer's part is ADR 0060 point 11's setup, owned by [setup](setup.md), including the package's accessibility stylesheet that holds this spec's A11Y-1d and A11Y-6 rules (setup usage rule 4); the item adds nothing to it. Cross-item files acquired: none (ADR 0060 point 9). `field.css`'s rules that reach into `.affix` (`:189-190`) style an element whose own directive loads `affix.css`.

## Testing Decisions

A good test asserts what a person or assistive technology observes: the class and attributes, `aria-invalid`, the computed name and description, whether the error slot shows and what it says, where focus lands, whether a submit happened, the fill's computed position, and computed contrast. It never reads a directive's field or how the styles service counts. No test depends on a public token's default value or a manifest default (ADR 0006; ADR 0015 point 3). Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group and the package's accessibility stylesheet globally, and the `field` item file through its directive (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `field--default`: Yeti's example (email with hint and error, switch, range with readout, checkbox group, radio group) under Signal Forms. Asserts each field's `class` and presence attribute; the email's computed name is "Email" and its description contains the hint; no `aria-invalid` anywhere; the error slot is not displayed; the range's field carries `--yeti-range-value` equal to the value's share; the readout's text is the value and it is out of the accessibility tree; contrast of labels, hint, and control text at least 4.5:1 in light and dark (ticket 50 decision 8).
- `field--required-name`: a required control. Asserts `toHaveAccessibleName('Email')` (A11Y-6), that the label's `::after` still shows the `*` (computed `content` begins with `" *"`), and that the control is announced as required (its `required` property).
- `field--form-invalid` (the id the events spec expects): Signal Forms with `[formRoot]`, an `email()` rule, a `pattern()` rule, and a custom rule. Submits the empty form and asserts: `invalid` fired once with the three controls in document order; each carries `aria-invalid="true"`; each error slot is displayed with its rule's message; each description now contains its error's id; focus is on the first control; the email field's border is the alert colour; the error text and the alert border meet 4.5:1 and 3:1. Then types a valid value into the first control and asserts its `aria-invalid` is gone and its description no longer contains the error's id.
- `field--reactive-forms`: the same form under `[formGroup]` with consumer-written error text. Asserts the error shows after blur, the slot keeps the consumer's text, and `invalid` fires on a refused submit.
- `field--message-slot`: two fields, one slot empty and one with the consumer's text. Asserts the empty slot shows the rule's message and the written slot keeps its text after the error changes kind.
- `field--server-error`: a control with a static `aria-invalid="true"` and the server's message in its slot. Asserts the slot is displayed and the control is invalid; typing clears `aria-invalid`.
- `field--groups`: a checkbox group with a shared rule and a radio group bound to one path, each with a hint and an error on its `fieldset`. Asserts a refused submit marks every control of a group, the group's error shows, and each control's description contains the group's hint and error ids.
- `field--switch`: asserts role `switch`, Space toggles `checked`, the thumb's computed `background-position` moves to the end, and the off track meets 3:1 against the page (`docs.md:18`).
- `field--range`: arrow keys change the value; asserts `--yeti-range-value` and the readout follow, and the share is clamped at `min` and `max`.
- `field--sizes`: `size="sm"`, unset, and `size="lg"`, plus an `inline` field. Asserts the control heights increase with size, `data-size` is absent when unset, and the inline field lays its label beside the control.
- `field--variants`: a checked checkbox per variant; asserts `data-variant` and that the checked fill differs between variants and meets 3:1 against the surface.
- `field--affix`: a field whose control slot is an affix with a meaningful prefix `span`. Asserts the control's description lists the prefix's id first, then the hint's, and that an error marks the affixed control's border (`field.css:189-190`). The affix spec's `affix--invalid` covers the affix side.
- `field--ready`: asserts the submit control is enabled once the story renders on the client (`ready()` true); layers 3 and 4 cover the server and pre-hydration sides.

### Layer 2: browser-level (`npx nx test <lib>`, `field.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note), with a test host only where a parent, a forms directive, or content is needed:

- `createDirective(YetiField, { tagName: 'div', bindings: [...] })`: class `field` and the presence attribute; `variant`, `size`, and `inline` render their attributes and render nothing when unset; while a fixture lives one `<link data-ngx-yeti-styles="field">` is in `document.head`, and after `fixture.destroy()` and an animation frame it is gone.
- `createDirective(YetiForm, { tagName: 'form' })`: `ready()` is false before the first render callback and true after `whenStable()`.
- Test hosts: a control under `[formField]` and under `formControlName` gets `aria-invalid` only after touch or submit; the consumer's `aria-describedby` stays first and duplicates are removed; the error's id joins only while the error state is true; a static `aria-invalid="true"` holds until the first `input` event; a control inside `yetiAffix` finds its field; a nested group field's control takes its hint and error from the `fieldset` field; a hint or an error outside a field throws NG0201; a refused submit emits `invalid` once with the controls in document order and focuses the first; a submit event whose `preventDefault` throws still emits (replay-shaped, building-blocks 1.12); a valid submit emits nothing; a range's share for `min`, `max`, a value outside them, and an empty span; pre-hydration values: a host whose value differs from the model after the first forms write gets it back with one `input` event, and an empty saved value changes nothing.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `field.ssr.spec.ts`)

Pure logic: the error-state policy for every combination of `invalid`, `touched`, `submitted`, and a server-reported error, under each forms API; the range share; the `aria-describedby` composition.

SSR smoke through the shared `renderServer()` helper with `withI18nSupport()` and section 8's markup with `i18n` labels (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the server HTML equals section 8's server HTML in the asserted attributes: classes, presence attributes, `data-*` attributes, the hint's consumer id and the error's generated id, the control's `aria-describedby` without the error's id, no `aria-invalid`, `--yeti-range-value: 0.7` on the range's field, the readout's text `70` with `aria-hidden="true"`, the error's fallback message, `novalidate` on the form, `disabled` on the submit control, `jsaction` with `submit` on the form and `input` and `change` on the controls; a static `size="lg"` stays as written beside `data-size="lg"`; a static `aria-invalid="true"` on a control is kept; `<head>` holds the `field` link before `affix`.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3): class `field` has `YetiField`; `data-variant`, `data-size`, and `data-inline` have inputs whose union members equal the manifest's values; `data-hint` and `data-error` have `YetiFieldHint` and `YetiFieldError`; `validate.js`'s `yeti:invalid` has `YetiForm.invalid` with keys equal to `controls`.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids: real key presses through each control, Space on the switch, arrows on the range and the radio group, Enter in the email field submitting `field--form-invalid` and landing focus on the first invalid control; with `emulateMedia({ forcedColors: 'active' })`, a checked checkbox and radio differ from unchecked ones in computed `background-color`, an on switch differs from an off one, and the range's track and thumb have a non-transparent system colour (A11Y-1d, after Yeti's own field spec cases; axe does not check it); `field--required-name`'s accessible name in all three engines (A11Y-6, measured so far in Chromium only); `field--range` in `dir="rtl"` records which side the fill and the readout start from, and a disagreement with the thumb becomes an `upstream-bugs.md` row.

Fixture-app half, built with `outputMode: 'server'`, with a `/field` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off (ticket 50 decision 2; ADR 0011 consequences). The route renders section 8's form, a reactive form, and a `method="post"` form without `ready`:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`, including for a control whose consumer wrote a static `aria-describedby` (affix spec, ticket 72 option A) and one with a static `aria-invalid="true"`, and the first control's `aria-describedby` equals the consumer's ids followed by the hint's id after hydration ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 46);
- with `main.js` held back, a click on the submit control and Enter in a field do nothing, and the URL is unchanged (A11Y-19); after hydration the submit control is enabled;
- with `main.js` held back, a value typed and a checkbox toggled before hydration are still there after hydration ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 161);
- with JavaScript disabled: every field is styled, `@axe-core/playwright` with the six tags reports no violation, every control takes input, the held submit control is disabled, and the `method="post"` form submits;
- a held form inside a `hydrate never` block keeps its submit control disabled (the stated residue); a field inside a client-only `@defer` block with `field` preloaded shows no unstyled frame;
- navigating to a route without a field removes the `field` link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and `docs.md` for the stories; `Y/test/browser/components/field.spec.js` (sizes, error showing, required marker, switch, range fill, fieldset, contrast, axe) and `validate.spec.js` (marking, message slots, `yeti:invalid` order, clearing, radio groups, controls outside a field) with their fixtures for the cases this spec replaces; ticket 19's probe (a temporary workspace, not shipped) for the forms orderings; the old bundle's Abide prototype for pre-hydration values and the held submit (evidence only); the [affix](affix.md) spec for the composition cases; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link.

## Out of Scope

- A validation engine, named patterns, an equality helper, or a message catalogue: Signal Forms' validators cover the rules, and the message is the rule's author's (ADR 0020 point 1).
- A live region or `role="alert"` on the error (ADR 0020, Considered options).
- A wrapper component for the field, a floating label, or a value API on any control: native controls keep their own value (architecture-guide P20).
- A per-control error-state override or a Defaults token for the policy (building-blocks 1.4).
- A form-level error summary: the `invalid` output gives the controls for the consumer's own summary, as Yeti's `yeti:invalid` did (`docs.md:37`).
- Dispatching `yeti:invalid` as a DOM event ([events](events.md) rule 5).
- Who wins when one control is also a tooltip's trigger and two directives bind `aria-describedby` on it: the [tooltip](../issues/92-spec-tooltip.md) spec states it (Part 2 row 42).
- The affix's own contract and the button's busy state: the [affix](affix.md) and [button](button.md) specs.
- How the styles service and the accessibility stylesheet load (ADR 0060; the [setup](setup.md) spec).
- Any check that a control has a label, an id, a `yetiFieldControl`, or a message for every rule. Checks belong to a later milestone (map, Milestones); the usage rules state them.

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Validity from Angular forms; `FORM_FIELD` first, then `NgControl` | ADR 0020 point 1; building-blocks 1.9 |
| `aria-invalid` on every control of a group from one Material-shaped policy | ADR 0020 point 2; Part 2 row 33 |
| The consumer's `aria-describedby` ids kept first and merged with the hint's and the error's | ticket 50 decision 46 (from ticket 72); ADR 0020 point 2; Material `userAriaDescribedBy` |
| The error's id described only while the error shows | this spec's reading, after Material's `_syncDescribedByIds` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 163) |
| The error's text: the consumer's content, else the rule's message as `ng-content` fallback in an attribute-selector component | Part 2 row 33's "where the consumer's slot is empty"; this spec's mechanism ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 159) |
| Yeti's native error look and `:user-invalid` stay; no live region | ADR 0020 point 3 |
| Parts linked by DI, never by DOM lookup; ids by `injectYetiId` | ADR 0020 point 4; ADR 0044 |
| `ready` signal and the held submit control | ADR 0020 point 5; A11Y-19 |
| `invalid` output with `YetiInvalidDetail` on `YetiForm` | [events](events.md); Part 2 row 33 |
| Focus to the first invalid control on a refused submit | `validate.js:61` kept under ADR 0040 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 160) |
| A server-reported `aria-invalid` adopted until the value changes | ADR 0020, Considered options, delegates it here ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 164) |
| Values typed before hydration adopted | this spec's reading, from ticket 19's transfer list ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 161) |
| `--yeti-range-value` a server-rendered host style binding on the field | ADR 0004 exception 1; Part 2 row 33 |
| The required marker's alternative text rule | A11Y-6; Part 2 row 33 |
| Forced-colours rules for checked controls, the switch, and the range | A11Y-1d; the user's "Accessibility CSS: Yes." (map, Standing rulings) |
| Only `YetiField` marks its host and acquires the item file | ADR 0045; ticket 50 decision 6 |
| `size` inert on Yeti's hosts | ticket 26 row 118; building-blocks 1.4 |
| Custom Angular, level 4 | building-blocks 1.2; Part 2 row 33 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

Signal Forms, with a rule message per rule and an empty slot:

```ts
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { YetiField, YetiFieldControl, YetiFieldError, YetiFieldHint, YetiForm } from 'ngx-yeti/field';
import type { YetiInvalidDetail } from 'ngx-yeti/events';
import { YetiButton } from 'ngx-yeti/button';

@Component({
  selector: 'app-sign-up',
  imports: [FormRoot, FormField, YetiForm, YetiField, YetiFieldControl, YetiFieldHint, YetiFieldError, YetiButton],
  templateUrl: './sign-up.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUp {
  readonly #api = inject(AccountApi);
  readonly #model = signal({ email: '' });

  protected readonly errorCount = signal(0);
  protected readonly form = form(
    this.#model,
    (p) => {
      required(p.email, { message: $localize`Enter your email address.` });
      email(p.email, { message: $localize`Enter an address with an @ in it.` });
    },
    { submission: { action: async (f) => this.#api.signUp(f().value()) } },
  );

  protected onInvalid({ controls }: YetiInvalidDetail): void {
    this.errorCount.set(controls.length);
  }
}
```

```html
<form yetiForm #f="yetiForm" [formRoot]="form" (invalid)="onInvalid($event)">
  <div yetiField>
    <label for="email" i18n>Email</label>
    <input id="email" type="email" autocomplete="email" yetiFieldControl [formField]="form.email" />
    <p yetiFieldHint i18n>We only use it to sign you in.</p>
    <p yetiFieldError></p>
  </div>
  <button yetiButton type="submit" [disabled]="!f.ready()" i18n>Sign up</button>
</form>
```

Reactive forms, with the consumer's own error text:

```html
<form yetiForm #f="yetiForm" [formGroup]="profile" (ngSubmit)="save()">
  <div yetiField size="lg">
    <label for="name" i18n>Name</label>
    <input id="name" autocomplete="name" required yetiFieldControl formControlName="name" />
    <p yetiFieldError i18n>Enter your name.</p>
  </div>
  <button yetiButton type="submit" [disabled]="!f.ready()" i18n>Save</button>
</form>
```

A radio group with its hint and error on the `fieldset`, and a switch:

```html
<fieldset yetiField>
  <legend i18n>Plan</legend>
  <div yetiField><input id="plan-free" type="radio" value="free" yetiFieldControl [formField]="form.plan" /><label for="plan-free" i18n>Free</label></div>
  <div yetiField><input id="plan-pro" type="radio" value="pro" yetiFieldControl [formField]="form.plan" /><label for="plan-pro" i18n>Pro</label></div>
  <p yetiFieldHint i18n>You can change it later.</p>
  <p yetiFieldError></p>
</fieldset>

<div yetiField variant="success">
  <input id="dark" type="checkbox" role="switch" yetiFieldControl [formField]="form.dark" />
  <label for="dark" i18n>Dark mode</label>
</div>
```

A range with its readout, and a server-reported error on a progressively enhanced form:

```html
<div yetiField>
  <label for="volume" i18n>Volume</label>
  <output yetiFieldOutput></output>
  <input id="volume" type="range" min="0" max="11" aria-valuetext="Loud" yetiFieldControl [formField]="form.volume" />
</div>

<form yetiForm method="post" action="/account" [formRoot]="form">
  <div yetiField>
    <label for="user" i18n>Username</label>
    <input id="user" autocomplete="username" aria-invalid="true" yetiFieldControl [formField]="form.user" />
    <p yetiFieldError i18n>That username is taken.</p>
  </div>
  <button yetiButton type="submit" i18n>Save</button>
</form>
```

A form that renders inside a client-only `@defer` block preloads its items: `provideYetiStyles({ preload: ['field', 'affix', 'button'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/field/field.css`, loaded by `YetiField` as a counted link (section 13). The consumer writes nothing for the item beyond the [setup](setup.md) spec's one-time configuration, which includes the package's accessibility stylesheet holding the A11Y-1d and A11Y-6 rules.
2. **Always-loaded rules relied on:** `layouts/attributes.css:237-259` sets the private variant and size tokens from `data-variant` and `data-size`; `base/controls.css` draws `label`, `legend`, controls outside a field, and `fieldset`'s base box; `base/reset.css:53-55` lets a textarea grow with `field-sizing` where supported; `base/typography.css` draws the focus ring; the token files declare every public token, `--yeti-range-value` included.
3. **Cross-item rules:** `field.css:189-190` turns an affixed control's border to the alert colour; `affix.css` sets its attachments' size from the field's private size tokens. Each item's directive loads its own file.
4. **Tokens:** reads the public tokens of section 1; writes `--yeti-range-value` on the field host only.
5. **What breaks without the item file:** controls are Yeti's neutral base controls; the field is not a column with its gap; checkboxes, radios, and switches are plain native checkboxes; a range is the browser's default; the hint is not muted; the error slot is always visible, because nothing sets `display: none`; no `*` follows a required label. The page works, with no error.
6. **Tailwind name collision:** none; `field` produced no utility in [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) (measured).

### Platform features to adopt when the browser target moves

None. Everything the item uses is inside Baseline 2025 (`:has()`, `:user-invalid`, `appearance: none`, the `lh` unit, Constraint Validation, `<input type="range">`), and `field-sizing` is guarded by Yeti in CSS with a working fallback (building-blocks 1.2).

### Single-page-application pieces relied on

None of the shared-utility specs' behaviour ([navigation-close](navigation-close.md), [fragment-links](fragment-links.md)). The item uses [events](events.md) for `YetiInvalidDetail`, [generated-ids](generated-ids.md) for the hint's and the error's ids, and ADR 0060's styles service for route changes (section 12).
