# Yeti's JavaScript modules, and what Angular adds

Ticket: [Research: Yeti's JavaScript modules and what Angular adds](../issues/03-research-yeti-javascript-and-angular.md). Researched 2026-10-01. Decides nothing.

## Sources and revisions

| Short name | Path | Revision (checked) |
| --- | --- | --- |
| `YETI` | `github.com/foundation/yeti` | `f52d1e8b9`, clean tree |
| `NG` | `github.com/angular/angular` | `package.json` `"version": "22.2.0"`, HEAD `5db6fc4453` (2026-09-25) |
| `CMP` | `github.com/angular/components` | `package.json` `"version": "22.2.0"`, `v22.2.0-15-g708d4c6e2` |
| `APG` | `github.com/w3c/aria-practices/content/patterns` | `3f094fd` |

Paths below are relative to those roots. `YETI/src/...` lines are the source; `docs/` is generated from it. Every claim marked **checked** was read in the file cited; **inferred** means reasoned from the cited source without running code; **hypothesis** marks bolder readings. Nothing was run in a browser; `D:/tmp/ngx-yeti-03` was not needed, since every measure here is a line count or a source read.

## 1. How much is JavaScript (checked)

`YETI/src` holds exactly ten `.js` files (a `find` over `src` returned only these), and the build bundles every `.js` under `src` into `yeti.js` (`bin/build.js:59`). Totals: **760 lines, 304 comment lines, 44 blank lines, 37,706 bytes**, which matches the old map's count (`next-foundation-specs/research/yeti-foundation-7.md` section 5.1). So about 412 lines are code.

| Module | Component | Lines | Comment lines | gzip bytes |
| --- | --- | --- | --- | --- |
| `alert.js` | alert | 31 | 12 | 892 |
| `carousel.js` | carousel | 48 | 26 | 1,385 |
| `demo.js` | demo | 175 | 48 | 3,292 |
| `dialog.js` | dialog | 75 | 39 | 1,716 |
| `hover.js` | dropdown | 93 | 36 | 1,856 |
| `range.js` | field | 58 | 28 | 1,400 |
| `validate.js` | field | 84 | 48 | 1,964 |
| `tabs.js` | tabs | 114 | 25 | 1,855 |
| `toc.js` | toc | 51 | 20 | 1,243 |
| `enter.js` | enter (utility) | 31 | 22 | 870 |

Every module is optional and frozen by file name (`src/guides/stability.md:20`); events are frozen by name, target, and `detail` keys (`stability.md:21`). The install guide says "all nine at once, about nine kilobytes compressed" (`src/guides/install.md:148`) and lists nine behaviours (`install.md:142`); the tenth name, `enter.js`, belongs to a utility. Modules import and export nothing and run once at load.

Two corrections to the old map's section 5.1 (checked): `validate.js` deliberately does **not** call `checkValidity()`, it reads `validity` so that it fires no `invalid` events (`validate.js:51-55`); and four modules dispatch no event at all (`demo.js`, `hover.js`, `range.js`, `enter.js`).

Events (checked, `install.md:158-166`; all bubble and are composed, none is cancelable, `install.md:176`, `src/guides/components.md:241`):

| Event | Module | Target | `detail` | Source |
| --- | --- | --- | --- | --- |
| `yeti:close` | alert | `.alert`, after the fade, before removal | none | `alert.js:17` |
| `yeti:open` | dialog | `dialog.dialog`, a task after a `show-modal` command | none | `dialog.js:49` |
| `yeti:close` | dialog | `dialog.dialog`, on every `close` | none | `dialog.js:72-75` |
| `yeti:select` | tabs | `.tabs`, on click, arrow key, or hash reveal | `{ tab, panel }` | `tabs.js:31-35`, `76-80` |
| `yeti:slide` | carousel | `.carousel`, on a dot click it handled | `{ index, slide }` | `carousel.js:43-47` |
| `yeti:invalid` | validate | `form`, when a submit is refused | `{ controls }` | `validate.js:62` |
| `yeti:current` | toc | `.toc`, when the mark moves | `{ link, heading }` | `toc.js:36` |

## 2. Per module (checked unless marked)

### 2.1 `alert.js` (31 lines)

- **Behaviour:** one delegated `click` listener on `document` for `.alert > [data-close]`; fades the alert with the Web Animations API over `--yeti-duration-fast`, dispatches `yeti:close`, removes the element (`alert.js:4-18`). Respects a page listener's `preventDefault` (`alert.js:6`).
- **ARIA, keyboard, focus:** if focus was inside, focus moves to the alert's parent, adding a temporary `tabindex="-1"` only when the parent had none (`alert.js:24-29`). No ARIA set; the author picks `role="status"` or `role="alert"` (`components/alert/docs.md:20`). APG alert: alerts must not affect focus and should not disappear on their own (`APG/alert/alert-pattern.html:28`, `32`); Yeti never moves focus on arrival and never auto-dismisses, and the focus move happens only after the user's own dismissal, which APG does not address.
- **Platform:** `Element.animate`, `getComputedStyle`, `CustomEvent`.
- **No JavaScript:** the close button does nothing; the docs say leave it out (`alert/docs.md:9`).

### 2.2 `carousel.js` (48 lines)

- **Behaviour:** takes an unmodified primary click on a dot link (`.carousel > [data-dots] a[href^="#"]`) that names a slide of its own track, prevents the fragment navigation, and scrolls the track with an absolute `scrollTo` measured from bounding boxes, writing-direction aware (`carousel.js:11-36`). Purpose: no history entry per dot (`carousel.js:1-8`, `carousel/docs.md:34`).
- **ARIA, keyboard, focus:** none of its own. Markup supplies `aria-roledescription="carousel"`, a labelled `role="group"` track with `tabindex="0"`, and dots as named links (`carousel/docs.md:11`, `14-24`, `30`). Against APG carousel: APG lists previous and next buttons as a needed feature (`APG/carousel/carousel-pattern.html:35`) and each slide as `role="group"` with `aria-roledescription="slide"` (`:136`); Yeti's slides carry neither (`carousel/example.html:3-5`) and Yeti has no previous or next buttons. Yeti does not auto-rotate, so APG's rotation-control rules (`:40-52`) do not apply. Yeti says the dots do not report the current slide, on purpose (`carousel/docs.md:32`).
- **Platform:** scroll snap, `scroll-behavior` from a token, `scrollTo`, `getBoundingClientRect`.
- **Events:** `yeti:slide`, about the choice, not the arrival (`carousel.js:38-41`).
- **No JavaScript:** dots are fragment links that work; each click adds a history entry (`carousel.js:7-8`).

### 2.3 `demo.js` (175 lines)

- **Behaviour:** documentation-only. Builds an `iframe` `srcdoc` from the `pre` under a demo (`demo.js:55-75`) and adds a resize grip (`demo.js:98-161`); a `MutationObserver` on `body` picks up later demos (`demo.js:169-175`). Writes the code's `textContent` into `srcdoc` (`demo.js:74`), so the frame runs whatever the `pre` holds.
- **ARIA, keyboard, focus:** the grip is `role="separator"`, `aria-orientation="vertical"`, named, focusable, with `aria-valuemin/max/now/valuetext` (`demo.js:102-116`); Arrow Left/Right step between width stops, Home/End go to the ends, RTL mirrored (`demo.js:151-160`). Against APG window splitter: role, value attributes, arrows, Home and End match (`APG/windowsplitter/windowsplitter-pattern.html:54-67`, `81-84`); the grip sets no `aria-controls` naming the pane, which APG lists (`:95`), and no Enter collapse (`:59`).
- **Platform:** `ResizeObserver`, `MutationObserver`, pointer capture, `srcdoc`.
- **Events:** none.
- **No JavaScript:** the code shows, a framed box stays empty, and the browser's own resize corner remains (`demo/docs.md:28-30`).

### 2.4 `dialog.js` (75 lines)

- **Behaviour:** the dialog opens through invoker commands, `commandfor` plus `command="show-modal"`, with no script (`dialog.js:1-3`, `dialog/docs.md:9`). The module adds a backdrop click that closes (requiring both press and release outside the box, ignoring keyboard clicks with `detail === 0`) (`dialog.js:53-65`) and focus return to the opener recorded from the `command` event's `source` (`dialog.js:28-50`). It does this because `closedby="any"` is missing in Safari and not Baseline, and WebKit does not focus a clicked button (`dialog.js:4-8`).
- **ARIA, keyboard, focus:** inert background, focus containment, and Escape come from `showModal` (`dialog/docs.md:7`). APG modal dialog: Tab stays inside (`APG/dialog-modal/dialog-modal-pattern.html:30`), Escape closes (`:73`), focus returns to the invoker (`:97`); native plus module covers all three. Naming via `aria-labelledby` is the author's (`dialog/docs.md:25`).
- **Platform:** `<dialog>`, `showModal`, invoker commands and the `command` event, `::backdrop`, `close` event.
- **Events:** `yeti:open` (a `setTimeout` after the command, so only once the dialog is really open, `dialog.js:35-50`), `yeti:close` on every close (`dialog.js:72-75`).
- **No JavaScript:** opens, Escape and `form method="dialog"` close; lost are the backdrop click and, in Safari, focus return (`dialog/docs.md:27`).

### 2.5 `hover.js` (93 lines)

- **Behaviour:** opt-in `data-trigger="hover"` opens the wrapper's popover under a fine pointer after `--yeti-dropdown-open-delay` and closes after `--yeti-dropdown-close-delay`, closing only a panel it opened (`hover.js:14-19`, `49-93`); a press cancels a pending open (`hover.js:78-81`). It reads `matchMedia('(hover: hover) and (pointer: fine)')` at event time (`hover.js:14`, `50-51`). A stated stopgap until `interestfor` is Baseline (`hover.js:11-13`).
- **ARIA, keyboard, focus:** touches none (`dropdown/docs.md:46`). The dropdown refuses `role="menu"` and is a disclosure of links and buttons (`dropdown/docs.md:44`). APG disclosure navigation closes an open dropdown on Escape and when focus leaves the region (`APG/disclosure/examples/disclosure-navigation.html:164-165`); popover gives Escape and light dismiss on outside clicks, not focus-out (inferred from the popover model).
- **Platform:** `popover`, `popovertarget`, `showPopover`/`hidePopover`, `toggle` event, `:popover-open`, pointer events.
- **Events:** none.
- **No JavaScript:** the attribute does nothing; click opens (`dropdown/docs.md:23`).

### 2.6 `range.js` (58 lines)

- **Behaviour:** writes `--yeti-range-value` (a 0 to 1 share) on the `.field` and the value into a sibling `output` (`range.js:20-38`); runs at load, on `input`, and on added nodes through a `MutationObserver` (`range.js:41-58`).
- **ARIA, keyboard, focus:** none; the native range announces its value and the `output` is `aria-hidden` (`range.js:35-37`, `field/docs.md:20`). No APG slider work is needed for a native `input type="range"`.
- **Platform:** `input type="range"`, custom properties, `MutationObserver`.
- **Events:** none.
- **No JavaScript:** the fill sits at whatever `--yeti-range-value` says, settable by hand (`field/docs.md:24`, `35`).

### 2.7 `validate.js` (84 lines)

- **Behaviour:** on `submit` (skipped if `defaultPrevented`, `validate.js:50`), finds every invalid control in the form, sets `aria-invalid="true"`, writes `validationMessage` into the nearest field's empty `[data-error]`, focuses the first invalid control, prevents the submit, and dispatches `yeti:invalid` (`validate.js:46-63`). Clears `aria-invalid` on `input`/`change` once valid, radio groups together (`validate.js:69-84`). Requires `novalidate` on the form (`validate.js:15-17`, `field/docs.md:39`).
- **ARIA, keyboard, focus:** `aria-invalid`, first-invalid focus. No APG pattern covers form validation.
- **Platform:** Constraint Validation (`validity`, `willValidate`, `validationMessage`), `:user-invalid` in CSS (`field/docs.md:7`).
- **Events:** `yeti:invalid` with `{ controls }`.
- **No JavaScript:** without `novalidate` the browser's own bubble; with it and no module, the form submits invalid (`validate.js:6-9`).

### 2.8 `tabs.js` (114 lines)

- **Behaviour:** at load, pairs each `[role="tab"]` of a root's own tablist with the panel its `aria-controls` names, and selects the `aria-selected="true"` tab or the first (`tabs.js:8-41`); click and keydown are delegated (`tabs.js:90-114`). Reveals the tab whose panel holds the URL fragment, at load and on `hashchange`, nesting outward (`tabs.js:55-88`). Tabs added after load are not picked up (`tabs.js:4`).
- **ARIA, keyboard, focus:** sets `aria-selected`, roving `tabIndex`, and `hidden` on panels; gives a panel with nothing focusable `tabIndex=0` (`tabs.js:13-24`). Arrows by `data-orientation`, wrapping, Home and End, selection follows focus (`tabs.js:98-114`). Against APG tabs: automatic activation recommended (`APG/tabs/tabs-pattern.html:104`), Home and End optional (`:84-88`), panel `tabindex="0"` when it has no focusable content (`:117`); Yeti matches. No `Delete` and no manual-activation mode.
- **Platform:** `hidden`, `hashchange`, `scrollIntoView`.
- **Events:** `yeti:select`, not for the load pass (`tabs.js:26-27`; manifest `components/tabs/manifest.json:55`).
- **No JavaScript:** CSS hides nothing; every panel is readable (`tabs.js:2-3`, `tabs/docs.md:7`).

### 2.9 `toc.js` (51 lines)

- **Behaviour:** one `IntersectionObserver` per `.toc` at load marks the link of the topmost visible heading with `aria-current="true"`, keeping the last mark between headings (`toc.js:11-51`). Tocs added after load are not picked up (`toc.js:8-10`).
- **ARIA, keyboard, focus:** owns `aria-current` on toc links and strips other values (`toc/docs.md:41`). No APG pattern; links are plain same-page links.
- **Platform:** `IntersectionObserver`, `compareDocumentPosition`.
- **Events:** `yeti:current` with `{ link, heading }`.
- **No JavaScript:** a working list of links; a page can ship `aria-current` itself (`toc/docs.md:9`).

### 2.10 `enter.js` (31 lines)

- **Behaviour:** one `IntersectionObserver` with `rootMargin: 0 0 10% 0` removes `data-once` from `.enter[data-once]` once near the viewport, so the CSS arrival plays once (`enter.js:23-31`). Elements added after load are not picked up (`enter.js:20-22`).
- **ARIA, keyboard, focus:** none; reading and focus order unchanged (`utilities/enter/docs.md:35`).
- **Platform:** `IntersectionObserver`, CSS animations; `data-view` uses scroll-driven animations under `@supports` (`enter/docs.md:27`).
- **Events:** none.
- **No JavaScript:** `data-once` elements stay present and never animate (`enter.js:1-4`, `enter/docs.md:29`, `35`).

## 3. Components with no module (checked from each `docs.md`)

| Component | What does the work with no script | Source |
| --- | --- | --- |
| accordion | `details`/`summary` open, keyboard, announced state; `name` gives exclusivity; height via a grid in the base layer | `accordion/docs.md:7`, `13`, `19`, `36` |
| affix | flex row; `aria-describedby` by the author | `affix/docs.md:7`, `21` |
| badge | text; colour is decoration | `badge/docs.md:21` |
| breadcrumbs | `nav` with `aria-label`, `aria-current="page"`, generated separators with empty alt | `breadcrumbs/docs.md:20` |
| button | states from the element (`:hover`, `:disabled`, `aria-pressed`, `aria-busy`); toggle via `label.button` around a native radio or checkbox | `button/docs.md:7`, `27`, `40` |
| buttons | group with `role="group"`; segmented control of native radios | `buttons/docs.md:16`, `28`, `32` |
| card | container query switch at `md` | `card/docs.md:7` |
| nav | `popover` list, `popovertarget` toggle, container query `data-threshold` puts it back in the bar | `nav/docs.md:7`, `9`, `43` |
| pagination | `nav`, `aria-current="page"`, `rel` | `pagination/docs.md:22` |
| progress | native `progress`; `data-scroll` is CSS scroll-linked and `aria-hidden` | `progress/docs.md:16`, `31` |
| seam | layout only | `seam/docs.md` |
| spinner | CSS ring; `role="status"` by the author | `spinner/docs.md:15` |
| table | native table, `scroller` region | `table/docs.md:30` |
| tooltip | `:hover` and `:has(:focus-visible)`; not a popover; cannot be dismissed while hovered (WCAG 1.4.13 gap, stated) | `tooltip/docs.md:7`, `22`, `26` |

Layouts (17 under `src/layouts`), recipes, and the six other utilities (attention, billboard, lede, lift, print, visually-hidden) have no module (checked: `find` over `src` found no other `.js`).

## 4. What Angular 22.2 adds, per capability

### 4.1 Typed inputs and outputs

- **API:** `input()` (`NG/packages/core/src/authoring/input/input.ts:171`), `model()` (`model/model.ts:114`), `output()` (`output/output.ts:69`), `booleanAttribute` and `numberAttribute` (`util/coercion.ts:23`, `41`).
- **Beats Yeti:** a closed union per `data-*` vocabulary turns `data-variant="prmary"` into a compile error. Yeti's only check is its own validator on its own docs and editor data (old map section 5.2, inferred). Typed outputs replace `yeti:*` listeners.
- **Checked, and a real gap:** an Angular template **cannot listen to a `yeti:*` event on an element**. The event-name parser splits at the first colon into target and name (`NG/packages/compiler/src/template_parser/binding_parser.ts:698-700`, `compiler/src/util.ts:23-31`), and only `window`, `document`, and `body` are allowed targets; anything else throws "Unexpected global target" (`compiler/src/template/pipeline/src/phases/reify.ts:26-30`, `324-329`). So `(yeti:select)="..."` on a `.tabs` fails to compile. `(document:yeti:select)` parses as target `document`, event `yeti:select` (inferred from the same split, not compiled). Per-element listening needs `Renderer2.listen` or `addEventListener` in a directive. A typed output is therefore more than sugar.
- **Checked:** Angular's DOM schema has no `popover`, `popoverTargetElement`, `commandForElement`, `command`, or `closedBy` properties (`compiler/src/schema/dom_element_schema_registry.ts:88`, `105`; `rg` for those names over `compiler/src/schema` found nothing). Static attributes and `[attr.popovertarget]`, `[attr.commandfor]` work; a property binding to the element-reference forms would be rejected without a schema exception (inferred from `checkTemplateElementProperty`, `compiler-cli/src/ngtsc/typecheck/src/dom.ts:90`). A directive can set those properties imperatively, which removes the hand-written id pairing.
- **Only types:** for every component whose look is attributes alone (badge, card, seam, table, progress, spinner, breadcrumbs, pagination, affix, buttons, button, layouts, utilities), typed inputs are the whole gain.

### 4.2 Signal state and two-way binding

- **API:** `model()` (above), `linkedSignal` (`core/src/render3/reactivity/linked_signal.ts:29`), `afterRenderEffect` (`after_render_effect.ts:318`), `afterNextRender` (`after_render/hooks.ts:316`).
- **Beats Yeti:** per-instance state readable and writable from the app: `[(selectedTab)]` for tabs, `[(open)]` mirroring `details.open` and `dialog.open` through the `toggle` and `close` events (both in the schema, `dom_element_schema_registry.ts:88`, `111-112`), the current toc link, the current slide. Yeti's state lives only in the DOM and is reported after the fact.
- **Beats Yeti on lifecycle:** `tabs.js`, `toc.js`, and `enter.js` bind once at load and miss later elements (`tabs.js:4`, `toc.js:10`, `enter.js:20-22`); a directive instance exists per element, whenever it is created, and cleans up through `DestroyRef`. No Yeti module has a teardown (checked: no listener removal except `demo.js:146`).

### 4.3 `@angular/aria` and `@angular/cdk`

Aria 22.2 ships accordion, combobox, grid, listbox, menu, tabs, toolbar, tree (`CMP/src/aria/` listing). No dialog, tooltip, carousel, disclosure, or splitter.

- **Tabs:** `ngTabs`, `ngTabList` (`orientation`, `wrap`, `focusMode`, `selectionMode: 'follow' | 'explicit'`, `selectedTab` model, `CMP/src/aria/tabs/tab-list.ts:80-109`), `ngTab` and `ngTabPanel` paired by `value`, not by id (`tab.ts:73`, `tab-panel.ts:81`), generated ids (`tab.ts:62`, `tab-panel.ts:73`), lazy panel content through `ngTabContent` (`tab-content.ts:30`) and `DeferredContentAware` (`tab-panel.ts:52-56`). Adds manual activation, disabled tabs, and generated pairing over `tabs.js`. **Checked mismatch:** Aria hides an inactive panel with `inert` only (`tab-panel.ts:49`), while Yeti's CSS never hides a panel and relies on `[hidden]` (`tabs/docs.md:7`, `base/reset.css:77`); a wrapper must also bind `hidden`, or every panel shows, inert.
- **Accordion:** Aria's accordion is button-plus-region (`accordion-trigger.ts:47-56`, `accordion-panel.ts:51-56`), not `details`. Yeti is `details` by design and refuses a script there (`accordion/docs.md:19`). Aria adds nothing Yeti's accordion lacks except arrow keys between headers, which APG marks optional (out of date: the APG at `3f094fd` no longer mentions arrow keys for the accordion, per [research/yeti-accessibility-and-standards.md](yeti-accessibility-and-standards.md) 4.1; corrected by audit 0002, L7); adopting it would replace the native element.
- **Menu:** Aria `Menu` has hover expansion with `expansionDelay` (`CMP/src/aria/menu/menu.ts:150`) and CDK menu triggers open on `mouseenter` (`CMP/src/cdk/menu/menu-trigger.ts:232`), but both are `role="menu"`, which Yeti's dropdown refuses (`dropdown/docs.md:44`). Neither replaces `hover.js` without changing semantics.
- **CDK pieces that fit:** `Directionality` with `valueSignal` (`CMP/src/cdk/bidi/directionality.ts:34`, `43`) for the carousel's RTL scroll; `_IdGenerator` (`a11y/id-generator.ts:22`) for `aria-controls`, `aria-labelledby`, `commandfor`, `popovertarget`; `MediaMatcher`/`BreakpointObserver` (`layout/media-matcher.ts:19`, `layout/breakpoints-observer.ts:43`) for hover capability; `SharedResizeObserver` (`observers/private/shared-resize-observer.ts:98`, private) and `ContentObserver` (`observers/observe-content.ts:67`); `InteractivityChecker` (`a11y/interactivity-checker/interactivity-checker.ts:31`) for the tab panel's "has focusable content" test, more exact than `tabs.js:22`'s selector list; `LiveAnnouncer` (`a11y/live-announcer/live-announcer.ts:37`) for a slide or validation summary announcement. CDK `Dialog` has `restoreFocus` (`dialog/dialog-config.ts:135`) but is an overlay, not the native `dialog` Yeti styles.

### 4.4 Forms (`validate.js`, `range.js`)

- **Signal forms:** `form()` (`NG/packages/forms/signals/src/api/structure.ts:120`), `submit()` marks the tree touched and calls `onInvalid` instead of the action (`structure.ts:463-511`), `focusBoundControl` (`field/node.ts:107`), `[formField]` (`directive/form_field.ts:106`) which writes native `min`, `max`, `minLength`, `maxLength`, `disabled`, `required`, `readonly`, `name` onto native controls (`form_field.ts:416-438`), and `form[formRoot]` which sets `novalidate` and prevents the submit (`directive/form_root.ts:36-48`). Typed validators: `email`, `min`, `pattern` and more (`api/rules/validation/`).
- **Classic forms:** `RangeValueAccessor` on `input[type=range]` with `formControl`/`ngModel` (`forms/src/directives/range_value_accessor.ts:47-52`).
- **Beats Yeti:** typed, async, and cross-field validation; server errors through `submit` (`structure.ts:425-443` example); `yeti:invalid`'s `{ controls }` becomes `onInvalid` with the field tree. For range, `--yeti-range-value` becomes a `computed` from the form value bound as `[style.--yeti-range-value]`, so the server HTML already has the fill and `range.js`'s `MutationObserver` is not needed (inferred).
- **What Angular does not do (checked):** nothing in `@angular/forms` or `@angular/forms/signals` sets `aria-invalid` or `aria-describedby` (`rg` over both `src` trees, specs excluded, returned nothing). Yeti's error shows on `aria-invalid="true"` or `:user-invalid` (`field/docs.md:7`), so a Yeti field directive must bind `aria-invalid` from `invalid() && touched()` and the error slot's id into `aria-describedby`. Angular validators produce error kinds, not the browser's localised sentence that `validate.js` writes (`validate.js:1-3`, `41`); keeping that sentence means reading `validationMessage` from the native control, which works for constraints `[formField]` mirrors natively (`required`, `min`, `max`, lengths) but not for `email` or `pattern` validators unless `type` and `pattern` are also on the element (inferred from `form_field.ts:416-438`; `pattern` is a binding key in `directive/bindings.ts:37` but not in the native list).
- **Checked conflict:** `validate.js` and Angular forms exclude each other. `FormRoot` calls `preventDefault` on submit (`form_root.ts:46`), and `NgForm`/`FormGroupDirective` return `false` from their submit handler for non-dialog forms (`forms/src/directives/ng_form.ts:122`, `341`; `reactive_directives/abstract_form.directive.ts:321`), which the renderer turns into `preventDefault` (`platform-browser/src/dom/dom_renderer.ts:528-534`). Those listeners sit on the form, before `validate.js`'s `document` listener, which then returns at `validate.js:50`.

### 4.5 SSR, hydration, `@defer`, event replay

- **API:** `withEventReplay` (`NG/packages/platform-browser/src/hydration.ts:127`), `withIncrementalHydration` (`:149`), `@defer` triggers including `on viewport` over `IntersectionObserver` (`adev/src/content/guide/templates/defer.md:187`, `208`) and `hydrate on viewport|interaction|hover|idle|timer` (`adev/src/content/guide/incremental-hydration.md:51-66`). Server renders a defer block's placeholder unless a `hydrate` trigger is set (`defer.md:381-383`).
- **Beats Yeti:** host bindings render state on the server: the selected tab's `aria-selected`, roving `tabindex`, and `hidden`; the toc's `aria-current` for a routed page; the range fill. `tabs.js` writes those only after load, so the first paint shows every panel (`tabs.js:2-3`). Per-family code splits under `@defer`, against Yeti's whole-file modules.
- **Where the platform beats Angular here (inferred):** invoker commands and `popovertarget` act at once on server-rendered HTML with no script, before hydration; an Angular `(click)="dialog.showModal()"` waits for replay (`adev/src/content/guide/hydration.md:76-91`, "native browser events"). So the Yeti route of keeping `commandfor` and `popovertarget` in the markup is the stronger SSR story, and a wrapper could render those attributes rather than replace them with click handlers, an option for the specs to weigh (reworded by audit 0001, M7).

### 4.6 `animate.enter` and `animate.leave`

- **API:** compiler-supported on elements and as host bindings; classes are removed after the longest animation; `animate.leave` keeps the element until its animation ends (`adev/src/content/guide/animations/enter-and-leave.md:10`, `22-24`, `46-48`; types in `NG/packages/core/src/animation/interfaces.ts:21`).
- **Alert:** an alert inside `@if` with `animate.leave` replaces `alert.js`'s `Element.animate` plus `remove()` (`alert.js:13-18`) and keeps Angular's view in charge of removal; focus-return still needs code (`alert.js:24-29`). Child-component leave animations do not run (`enter-and-leave.md:68`).
- **Enter:** `animate.enter` fires on insertion, not on viewport entry, so it does not replace `data-once` for server-rendered content; `enter.css`'s own CSS already animates on load (`enter/docs.md:7`). Not a replacement (inferred).
- **Dialog, dropdown, nav, tooltip, accordion:** these stay in the DOM and change state, so `animate.*` does not apply; Yeti's CSS transitions do the work (old map 1.6 rule 1, evidence only).

### 4.7 DI between parts

- **API:** `InjectionToken` with `useExisting` and `inject(token, {optional: true, skipSelf: true})` (the planning repository's `AGENTS.md` (ngx-foundation-sites-next), Content Projection and DI), `hostDirectives` for hosting Aria (old map 1.9, evidence only).
- **Beats Yeti:** Yeti pairs parts by DOM structure and ids (`tabs.js:8-11`, `hover.js:23-29`, `carousel.js:18-23`, `validate.js:38`). DI pairs a field with its control and error slot, a tab with its tablist, a dot with its carousel, a dialog trigger with its dialog, without ids and across `@for`. Nested `.tabs` resolve by injector, which is what `tabs.js:5-11` does by `closest`.

## 5. Per module and component: what a wrapper adds

| Item | Gain beyond types | Only types? |
| --- | --- | --- |
| alert | `animate.leave` removal inside Angular's view; typed `closed` output; focus-return kept | no |
| carousel | typed `slide` output; `Directionality`; a current-slide signal Yeti declines (`carousel/docs.md:32`) via `IntersectionObserver`; router-safe dots (section 6) | no |
| demo | none useful for apps; docs tooling (Storybook already frames stories) | a candidate to leave out, for the spec list to decide (reworded by audit 0001, M7) |
| dialog | a typed `open` model and `opened`/`closed` outputs; `commandfor` set by element reference; generated `aria-labelledby`; `cancel` event for veto | partly; native does the core |
| dropdown (`hover.js`) | timers cleared on destroy; capability from `BreakpointObserver`; focus-out close per APG (`disclosure-navigation.html:165`); close on router navigation (section 6) | no |
| field, `range.js` | fill as a `computed` rendered on the server; forms value | no |
| field, `validate.js` | signal or reactive forms; `aria-invalid` and `aria-describedby` bindings Angular itself lacks; first-invalid focus via `focusBoundControl` | no |
| tabs | Aria Tabs (manual mode, disabled, value pairing, lazy content) plus a `hidden` binding; server-rendered selection; router fragment instead of `hashchange` | no |
| toc | `aria-current` signal from `ActivatedRoute.fragment`/`fragmentSignal` (`NG/packages/router/src/router_state.ts:161`, `200`) and `IntersectionObserver`; router-safe links | no |
| enter | a directive with one shared `IntersectionObserver` per instance lifecycle; nothing Angular-specific beats `enter.js` | mostly types and lifecycle |
| accordion | `[(open)]` mirror of `details.open` | types plus state mirror |
| nav | close the popover on navigation; typed `data-threshold`, `data-panel` | no (SPA only) |
| tooltip | Escape dismissal through Yeti's own `[hidden]` rule (`base/reset.css:77`), meeting WCAG 1.4.13 that Yeti cannot (`tooltip/docs.md:26`); generated `aria-describedby` | no |
| affix, badge, breadcrumbs, button, buttons, card, pagination, progress, seam, spinner, table, layouts, recipes, other utilities | typed vocabularies, generated ids for `aria-describedby` (affix) | **yes** |

## 6. Yeti's modules inside an Angular app (inferred unless marked)

- **Load-once modules miss Angular-rendered DOM.** `tabs.js`, `toc.js`, `enter.js` scan once at load (`tabs.js:4`, `toc.js:10`, `enter.js:20-22`); in a client-rendered or route-changed view they find nothing. The delegated ones (`alert`, `carousel`, `dialog`, `hover`, `validate`) and the observed one (`range`) do see later elements.
- **Direct DOM writes fight bindings.** `tabs.js` writes `aria-selected`, `tabIndex`, `hidden` (`tabs.js:16-22`) and `alert.js` removes nodes (`alert.js:18`) that Angular may own.
- **Fragment links under `<base href>`.** Yeti's carousel dots, toc links, and tab deep links are `href="#id"`. In an Angular app with `<base href="/">` on a non-root route, `#id` resolves against the base, so following it navigates to another document (old map building-blocks 1.1, evidence only; HTML URL resolution). `carousel.js` happens to prevent this for its own dots (`carousel.js:25`); `toc.js` does not intercept clicks.
- **Popover panels in a SPA.** Light dismiss closes a popover on outside clicks and Escape; a `routerLink` inside the nav or dropdown panel is an inside click, so the panel stays open after the route changes. On a multi-page site the page reload hid this.

## 7. What the platform already does with no JavaScript (a wrapper adds only types here)

From Yeti's docs, checked: `details`/`summary` open, keyboard, state, and `name` exclusivity (`accordion/docs.md:7`, `19`); popover open, top layer, Escape, light dismiss, and the button's expanded state for dropdown and nav (`dropdown/docs.md:7`, `nav/docs.md:7`); modal dialog open via invoker commands, inert background, focus containment, Escape, `form method="dialog"` close (`dialog/docs.md:7-9`); scroll snap and fragment dots for the carousel (`carousel/docs.md:7`); tooltip on hover and keyboard focus (`tooltip/docs.md:7`); native toggles and segmented controls (`button/docs.md:27`, `buttons/docs.md:16`); native `progress`; container-query shape changes for card, nav, pagination; scroll-linked progress (`progress/docs.md:16`). For these, an Angular wrapper's honest gain is typed inputs, generated ids, and a state mirror, unless one of the section 6 Angular-specific problems applies.

## 8. Hypotheses (labelled; not verified)

- **Hypothesis:** the wrapper's biggest value is not replacing 412 lines of code but fixing what breaks when Yeti meets an SPA: load-once modules, `<base href>` fragments, popovers that survive navigation, and `yeti:*` events that templates cannot bind.
- **Hypothesis:** for dialog, dropdown, and nav, the best SSR result keeps `commandfor` and `popovertarget` in rendered HTML and has the directive only observe (`command`, `toggle`, `close`) and add state, because the platform acts before hydration and event replay cannot.
- **Hypothesis:** with event replay, a pre-hydration click on a carousel dot follows the fragment natively (adding history) before any handler can prevent it; Angular's replayed handler cannot cancel what already happened. Not tested.
- **Hypothesis:** Aria Tabs is the only Aria pattern that fits Yeti without changing its element choices; accordion and menu would change Yeti's semantics, and dialog, tooltip, carousel, disclosure have no Aria directive.
- **Hypothesis:** `hover.js` has the shortest life of the modules, given its stated end at `interestfor` Baseline (`hover.js:11-13`); a wrapper that maps `data-trigger="hover"` to `interestfor` later would need no API change.

## 9. Checked, inferred, not confirmed

- **Checked by reading:** every Yeti line cited; all ten modules read in full; line, comment, byte, and gzip counts measured; Angular and components on 22.2.0; Aria directory list and the Tabs, Accordion, and Menu inputs and host bindings; the compiler's event-target rule and DOM schema; signal forms `FormRoot`, `FormField`, `submit`; classic forms' submit return value and the renderer's `preventDefault`; the absence of `aria-invalid` in `@angular/forms`; APG lines cited.
- **Inferred:** that `(document:yeti:select)` compiles; that property bindings to `popoverTargetElement` fail type checking; that `[formField]` keeps `validationMessage` meaningful for mirrored constraints; every behaviour in section 6; that `animate.enter` cannot replace `data-once`.
- **Not confirmed (where looked):** whether popover light dismiss closes on focus-out was not checked against the HTML spec (no spec clone used); event replay's handling of `preventDefault` on anchors was not traced past `NG/packages/core/primitives/event-dispatch/src/event.ts` and `hydration.md:76-95`; browser behaviour was not run.
