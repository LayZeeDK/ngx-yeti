# Prototype: subclassing Aria's directives, and `[open]` against `[attr.open]`

Ticket: [34. Prototype: subclassing Aria's directives, and `[open]` against `[attr.open]`](../../issues/34-prototype-subclassing-aria-and-open-binding-forms.md). Built and measured 2026-10-03 by Claude Opus 5.5. **Throwaway code.** Nothing here is decided.

Tags: **measured** (this run, Chromium, Firefox, and WebKit unless an engine is named), **read** (`file:line`), **inferred**.

## Setup

- **Workspaces** (new files and routes only):
  - `D:/tmp/ngx-yeti-29-buttons/ws`: [`src/buttons-s34.ts`](src/buttons-s34.ts), routes `/s34` and `/s34-never` (`@defer (hydrate never)`), probe [`tools/probe34-buttons.mjs`](tools/probe34-buttons.mjs). Port 4734.
  - `D:/tmp/ngx-yeti-29-accordion/ws`: [`src/accordion-pages-34.ts`](src/accordion-pages-34.ts), routes `/s34-acc`, `/o34`, `/o34-never`, probes [`tools/probe34-acc.mjs`](tools/probe34-acc.mjs), [`tools/probe34-open.mjs`](tools/probe34-open.mjs), [`tools/modal-blocked34.mjs`](tools/modal-blocked34.mjs). Port 4735. Its `dist/` now holds a development build (ticket 30 left a production build there).
- Angular, `@angular/aria`, `@angular/cdk` 22.2.1, zoneless, `provideClientHydration()`, `outputMode: server`. **Development builds** (`nx run ws:build --optimization=false`); every page logged "Angular is running in development mode", so the hydration checks ran. Playwright 1.63.0 (Chromium, Firefox, WebKit, headless), axe-core 4.13.0 via `@axe-core/playwright`.
- **Sources read:** Angular `github.com/angular/angular` at `5db6fc4453` (`NG/`); Aria `github.com/angular/components` at `708d4c6e2` (`NC/`); the domino copy shipped in the workspace's `@angular/platform-server` 22.2.1 (`PS/third_party/domino/bundled-domino.mjs`). Yeti was not needed beyond the markup tickets 29 and 30 already use.
- **States.** Server HTML: `curl`. JS off: a context with `javaScriptEnabled: false` (axe cannot run there; its DOM equalled the before-hydration DOM in every snapshot). Before hydration: `main-*.js` held with `page.route`. Hydrated: after release, waiting for Aria's `data-active="true"` or the app's `whenStable` flag. `hydrate never`: the same markup inside `@defer (hydrate never)`. A `MutationObserver` added by `addInitScript` records `role`, `tabindex`, `open`, and others with old values. **Change from ticket 30's method:** the value each write produced is taken from the next record's old value (or the final value), so a write that is undone in the same batch shows up. A `requestAnimationFrame` loop logs frames into the same log.
- **Servers:** both stopped at the end (checked: nothing listening on 4734 or 4735).

## Point 1: subclassing against composition

### How inheritance merges host metadata (read)

- The compiler adds `ɵɵInheritDefinitionFeature` when the class extends another (`NG/packages/compiler/src/render3/view/compiler.ts:134-135`). Static `host` entries compile to `hostAttrs` (`compiler.ts:502`).
- **Host bindings are chained, not replaced:** the subclass's `hostBindings` becomes "the superclass's, then the subclass's own" (`NG/packages/core/src/render3/features/inherit_definition_feature.ts:215-228`). `hostVars` are summed (`:160-174`), so each class keeps its own binding slots. Angular's guide: "Child classes end up with the _union_ of all of their ancestors' inputs, outputs, and host bindings" (`NG/adev/src/content/guide/components/inheritance.md:61-62`).
- **Static host attributes are merged by name, and the subclass's value wins:** `mergeHostAttrsAcrossInheritance` merges from the base down (`inherit_definition_feature.ts:160-174`), and `mergeHostAttribute` overwrites the value of a key already present (`NG/packages/core/src/render3/util/attrs_utils.ts:191-197`). A static attribute cannot be removed this way, only given another value.
- On the element, directive `hostAttrs` merge first and the template's own attributes last, "so that they have the highest priority" (`NG/packages/core/src/render3/view/directives.ts:200`, `NG/packages/core/src/render3/view/elements.ts:54-55`). A subclass's static value therefore still loses to a consumer's static attribute.
- **Not inherited:** `providers` and `exportAs` (the merge copies inputs, outputs, host bindings, queries, and features marked `ngInherit`, `inherit_definition_feature.ts:74-127`; `hostDirectives` is `ngInherit`, `NG/packages/core/src/render3/features/host_directives_feature.ts:61`). Measured: the compiled `YetiButtonS` definition has no `exportAs`.
- **Inputs:** a subclass that names an inherited input in its own `inputs` metadata replaces the inherited entry (`inherit_definition_feature.ts:140-142`).

### What was built

| | (C) composition | (S) subclass |
| --- | --- | --- |
| Toolbar | `yetiButtonsC` hosts `Toolbar`, `[attr.role]: "toolbar"`; `yetiButtonC` hosts `ToolbarWidget` with `inputs: ['disabled: busy']` and ticket 30's `[attr.tabindex]` hand-over | `YetiButtonsS extends Toolbar` with `providers: [{ provide: Toolbar, useExisting: YetiButtonsS }]` and `[attr.role]: "toolbar"`; `YetiButtonS extends ToolbarWidget` with the same `[attr.tabindex]` hand-over, reading its own inherited `active()` |
| Accordion trigger on `summary` | ticket 32's `yetiAccordionTrigger32`: hosts `AccordionTrigger`, `[attr.role]: 'null'` | **S-null**: `extends AccordionTrigger`, `[attr.role]: 'null'`. **S-empty**: `extends AccordionTrigger`, static `role: ''`. Both provide `AccordionTrigger` with `useExisting` |
| Code (non-blank, non-comment lines) | buttons 37; trigger 12 | buttons 34; trigger 6 |

Each toolbar variant has an action set (no consumer role, busy Export) and a toggle set written with a consumer `role="group"`. The accordion variants share ticket 30's group, item (`[attr.open]` sync), and ticket 32's alternating-`inert` panel.

### Results: toolbar (`/s34`, `/s34-never`), [results/buttons-summary.txt](results/buttons-summary.txt)

All measured, identical in Chromium, Firefox, and WebKit, and **identical between C and S** in every row.

| State | C and S |
| --- | --- |
| Server HTML ([results/server-buttons-s34.html](results/server-buttons-s34.html)) | both groups `role="toolbar"` (the consumer's `role="group"` overridden); widgets `tabindex` `0,-1,-1`; busy Export `aria-disabled="true" aria-busy="true"` |
| JS off | as served |
| Before hydration | as served; axe 0 |
| Hydrated | as served (no `tabindex` change at rest); ArrowRight moves focus and the stop to Cancel (`-1,0,-1`); Space toggles `aria-pressed`; axe 0 |
| `hydrate never` | as served, for good; ArrowRight does nothing (no Aria); axe 0 |
| Console | the development-mode line and Angular's hydration summary only. No `NG05xx`, no warning, no page error |

**At hydration, both forms write the same intermediate values (measured):**

- The consumer's static `role="group"` is written back, then the binding writes `toolbar`: `toolbar -> group -> toolbar`. The two writes arrive in **separate** observer callbacks 9 to 38 ms apart. An animation frame ran between them in Chromium in this run, not in Firefox or WebKit (see also the accordion runs below).
- **The first widget's `tabindex` goes `0 -> -1 -> 0`**: Aria's binding writes `-1` (no active item yet), then the package's binding writes `0`, in the same observer callback, with no frame between, in all three engines. This corrects ticket 30, which reported no `tabindex` change at hydration; its probe compared each record's old value with the final value, which hides a write undone in the same batch.
- Aria's random widget ids are rewritten (12 of 12), as ticket 30 measured.

**Inputs (measured):** `inputs: ['disabled: busy']` in the subclass's own metadata compiled, but the server threw `TypeError: ctx.disabled is not a function` ([results/buttons-alias-error.txt](results/buttons-alias-error.txt)). The compiled definition lists `disabled: [0, "busy", "disabled"]`, flag `0`, so the inherited signal input was re-declared as a plain one and the binding assigned `true` over the signal. The subclass therefore exposes Aria's own `disabled` input; there is no `busy` alias.

### Results: accordion trigger on `summary` (`/s34-acc`), [results/accordion-summary.txt](results/accordion-summary.txt)

All measured, all three engines.

| | composition (`[attr.role]` null) | S-null | S-empty (static `role=""`) |
| --- | --- | --- | --- |
| Server HTML, JS off, before hydration, `hydrate never` ([results/server-accordion-s34.html](results/server-accordion-s34.html)) | no `role` on `summary` | no `role` | `role=""` |
| Role writes at hydration | `null -> button -> null` | `null -> button -> null` | `"" -> ""` (same value) |
| Hydrated: Enter opens item 1 through Aria, `open` and the model follow; ArrowDown moves focus to item 2 | yes | yes | yes |
| axe, before and after hydration | 0 | 0 | 0 |
| Chromium accessibility tree (CDP) | `DisclosureTriangleGrouped` | `DisclosureTriangleGrouped` | `DisclosureTriangleGrouped` |
| Console | Aria's `ngAccordionContent` warning per hydrated panel (as tickets 30 and 32); no `NG05xx` | same | same |

- **Frames (measured, two runs):** the `button` write and its removal came in separate observer callbacks 11 to 40 ms apart. An animation frame ran between them in Chromium in both runs, Firefox in one, WebKit in one. Across all three probes, 5 of 9 engine runs had a frame between a written-back static attribute and the binding that removes it. **Inferred:** in those runs the intermediate value was in the DOM during a rendering update, so it may have been painted and exposed for one frame. Whether assistive technology announced it was not measured.
- **S-empty is the only variant with no rewrite**, because the subclass's static value replaced Aria's in the merged definition and the same value is written back. `role=""` in the HTML is the cost. Firefox's and WebKit's trees were not inspected for it. Whether an empty `role` passes HTML conformance checking was not checked (inferred: WAI-ARIA tells user agents to fall back to the implicit role when no token is valid, which matches Chromium's tree here).
- After opening one item in each group, axe reports `landmark-unique` (moderate) once: three open `region`s share the name "Does Yeti need JavaScript?". That is this page's repeated text, not a variant.
- **Query and provider (measured):** the item's `contentChild(AccordionTrigger)` found the subclass through `{ provide: AccordionTrigger, useExisting: … }` (the `open` sync worked). Without that provider it was not tried; **inferred** to find nothing, because the query token is Aria's class.

### What a subclass depends on (read unless marked)

- **Providers it must restate.** `ToolbarWidget` does `inject(Toolbar)` (`NC/src/aria/toolbar/toolbar-widget.ts:67`), so a `Toolbar` subclass provides `Toolbar` itself (measured: works). Aria's own `useExisting` providers are not inherited: `ACCORDION_GROUP` (`NC/src/aria/accordion/accordion-group.ts:69`), `TAB_LIST` (`NC/src/aria/tabs/tab-list.ts:59`), `TABS` (`NC/src/aria/tabs/tabs.ts:55`), `TOOLBAR_WIDGET_GROUP` (`NC/src/aria/toolbar/toolbar-widget-group.ts:33`). Queries keyed on Aria's classes, such as `contentChildren(ToolbarWidget)` (`toolbar-widget-group.ts:46`), need the subclass provided under that class too.
- **Constructor and field order.** Aria builds its pattern in a field initializer from `{...this}` (`toolbar-widget.ts:91-97`; `NC/src/aria/toolbar/toolbar.ts:93-100`; `AccordionTrigger` in `ngOnInit`, `NC/src/aria/accordion/accordion-trigger.ts:122-128`). The subclass's own fields do not exist yet at that point, and `inject()` in Aria's field initializers is inherited without a constructor (`inheritance.md:66`). **Inferred:** a subclass that redefines a field Aria passes to its pattern (an input, `id`) changes nothing in the pattern; the alias failure above is one measured case of overriding an inherited input.
- **Members.** The subclasses here use only public members: `active()`, `disabled()`, inputs. TypeScript `private` members (`_elementRef`, `_toolbar`, `_accordionGroup`) are out of reach. Underscore members (`_pattern`, `_collection`) are in the public API report (`NC/goldens/aria/toolbar/index.api.md:17-24`, `:49-50`), and an Aria maintainer wrote that `_` means private by convention (angular/components#33803, read). A subclass also exposes every Aria public member and input under Aria's names, where composition exposes only the inputs it lists.
- **`exportAs`.** Not inherited (above); a template that wants `#x="ngToolbarWidget"` on a subclass gets nothing (inferred).
- **Supported?** Aria 22.2.0 added "export aria injection tokens to support custom subclasses" (commit `8d3da9ea3`, #33607, 2026-07-31; tag `v22.2.0`), with a test that subclasses `GridRow` and `GridCell` and provides the tokens (`NC/src/aria/grid/grid.spec.ts:1179`). The Aria guides say nothing about subclassing or host directives (searched `NG/adev/src/content/guide/aria/*.md`). Aria's source names the host-directive use in two comments (`toolbar-widget.ts:49`, `accordion-trigger.ts:56-58`). Stability: an Aria maintainer said in 21.2 that Aria "is still in developer preview so we may need to introduce the occasional API change. We expect to hit stable in v22" (angular/components#32977); a patch release in 21.2 changed `AccordionTrigger`'s required input. Searches of angular/components issues for subclassing or host directives found nothing else.

### Comparison

| | Composition | Subclass |
| --- | --- | --- |
| Server HTML, JS off, before hydration, `hydrate never`, hydrated values | as wanted | identical (measured) |
| Static attribute written back at hydration (consumer's `role="group"`, Aria's `role="button"`) | yes, then removed by the binding | **yes** with a binding (measured). Avoided only by a static replacement that is itself the wanted value (S-empty, measured), which cannot remove an attribute or beat a consumer's static one (read) |
| Aria's binding writes its own value first at hydration (`tabindex 0 -> -1 -> 0`) | yes | yes (measured) |
| `NG05xx`, warnings, axe | none, none beyond Aria's, 0 | the same (measured) |
| Package code | buttons 37, trigger 12 lines | buttons 34, trigger 6 lines |
| Inputs | renamed through `hostDirectives.inputs` (`busy`) | Aria's names; renaming an inherited signal input broke (measured) |
| Depends on | Aria's public inputs and signals | the same, plus restating providers Aria declares, Aria's field order, and its public class surface (read) |

## Point 2: `[open]` against `[attr.open]`

`/o34` binds both forms on: `details` bound `true` (dT) and `false` (dF); a non-modal `dialog` bound `true` (nT, closed by a `command="close"` invoker) and `false` (nF); a modal `dialog` bound `false` (mF), opened by a `command="show-modal"` invoker. Invokers need no Angular listener, so they work with JS off and before hydration; all three engines support them (measured, `'commandForElement' in HTMLButtonElement.prototype`). Raw: [results/open-summary.txt](results/open-summary.txt), [results/modal-blocked.txt](results/modal-blocked.txt), server HTML [results/server-o34.html](results/server-o34.html).

**Every row below is identical for `[open]` and `[attr.open]`, and in Chromium, Firefox, and WebKit** (measured).

| Question | `details` | non-modal `dialog` | modal `dialog` |
| --- | --- | --- | --- |
| Server HTML carries `open` when bound `true` | yes, `open=""` | yes, `open=""` | (bound `false`: no `open`) |
| JS off | as served; a click toggles natively | as served; Close works | `show-modal` opens it as modal |
| Hydration writes the value again | yes: an `open` record `present -> present` on each element bound `true`; no record on elements bound `false` and shut | same | same |
| A toggle made before hydration | **undone**: dT closed by the visitor reopens, dF opened closes; `toggle` events follow | **undone**: nT closed by the visitor reopens | **broken**: hydration removes `open`, the dialog stays `:modal` but is hidden. Clicks reach nothing (`elementFromPoint` returns `html`), Escape does not close it, no `close` event fires |
| `hydrate never` | toggles kept | Close kept | `show-modal` kept |
| axe, before and after hydration | 0 | 0 | 0 |
| Console | no `NG05xx`, no warning | | |

**Modal dialog after hydration (measured):** after `showModal()`, binding `true` changes nothing visible (`open` already set). Binding `false` removes `open`: the dialog stays `:modal`, hidden, and the page stays blocked, the same state as the pre-hydration case. Both forms, all three engines.

**Why (read):**

- **The server reflects the property.** Angular's renderer sets a property binding as `el[name] = value` (`NG/packages/platform-browser/src/dom/dom_renderer.ts:462-470`). Domino defines `open` as a reflected boolean attribute on `HTMLDetailsElement` (`PS/third_party/domino/bundled-domino.mjs:7490-7499`) and `HTMLDialogElement` (`:8466-8480`; `show`, `showModal`, and `close` are "not yet implemented" there).
- **Hydration writes every binding once.** Binding slots start as `NO_CHANGE`, so the first pass always writes (`NG/packages/core/src/render3/bindings.ts:44-55`), for properties (`NG/packages/core/src/render3/instructions/property.ts:45`) and attributes (`NG/packages/core/src/render3/instructions/attribute.ts:34`) alike. A static `open` is written back too (`NG/packages/core/src/render3/instructions/shared.ts:599`, `NG/packages/core/src/render3/dom_node_manipulation.ts:141-145`; measured for statics in ticket 18).
- **No template form keeps a pre-hydration toggle without reading the DOM** (measured for both binding forms; read for a static attribute). Under `hydrate never` the bindings never run on the client, so toggles survive there. Ticket 30's constructor read of `open` is the measured exception for `details`.
- **Inferred:** a modal dialog's top-layer and blocking state is set by `showModal()`, not by the `open` attribute, so removing the attribute hides the dialog without leaving modal mode. The HTML specification text was not checked in this run.

## For the user

- **Subclassing an Aria directive works and matches composition in every measured state:** the same server HTML, the same hydrated behaviour, no `NG05xx`, axe 0, three engines. It needs a few lines less code, but it has to restate Aria's providers, it inherits all of Aria's public members and input names, and renaming an inherited signal input (`disabled` as `busy`) threw at runtime.
- **Subclassing does not avoid the write-back at hydration when the override is a binding:** Aria's static `role="button"` and a consumer's `role="group"` come back and are removed again, with an animation frame in between in 5 of 9 engine runs. Only a static replacement with the wanted value avoids it (`role=""`, Chromium's tree shows the native disclosure role). That cannot remove an attribute or beat a consumer's static value.
- **Correction to ticket 30:** at hydration the first widget's `tabindex` goes `0 -> -1 -> 0` in one observer callback with no frame between, for composition and subclass alike. The earlier probe could not see a write that was undone in the same batch.
- **`[open]` and `[attr.open]` behave the same:** the server writes `open` for both on `details` and `dialog`, and hydration writes the bound value again in all three engines.
- **Both forms undo a pre-hydration toggle** on `details` and on a non-modal `dialog`. On a modal dialog opened with `command="show-modal"`, both forms leave a hidden modal that blocks the page, with no way out by Escape. The same happens after hydration if the bound value goes `false` while the dialog is open through `showModal()`. Only `hydrate never` kept every toggle.
- Both workspaces keep the new `s34`/`o34` files and routes; the accordion workspace's `dist/` is now a development build. Both servers were stopped.
