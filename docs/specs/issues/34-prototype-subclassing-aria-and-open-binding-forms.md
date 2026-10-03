# 34. Prototype: subclassing Aria's directives, and `[open]` against `[attr.open]`

Type: prototype
Status: resolved
Blocked by: 30, 33
Labels: wayfinder:prototype
Map: ../map.md

## Question

1. **Subclassing against composition for Aria's host bindings.** [Prototype: fitting Angular Aria to Yeti by directive composition](30-prototype-fitting-aria-by-directive-composition.md) measured composition replacing Aria's server `tabindex` (a hand-over to `active()`) and `role` (`[attr.role]`, null on `summary`, in [Research: where Angular Aria's attribute directives fit Yeti's own markup](32-research-aria-directives-on-yetis-own-markup.md)). In both cases hydration wrote a static host attribute once more before the binding won.
   - Can a package directive that `extends` an Aria directive class (for example `ToolbarWidget`, `AccordionTrigger`, `Tab`) replace a static host attribute (`role`) and a host binding (`[attr.tabindex]`) through its own `host` metadata?
   - How do Angular's inherited host attributes and bindings merge? Read `ɵɵInheritDefinitionFeature` and the compiler's handling of `host` on a subclass.
   - Does a subclass avoid the one-pass rewrite at hydration that composition shows?
   - What does a subclass depend on: protected or private members, the constructor's `inject()` calls, `exportAs`, and providers? Is subclassing an Aria directive supported or stable across Aria releases (read the package's public API and any docs or issues)?
   - Compare it with composition on server HTML, hydration, warnings, and lines of package code.
2. **`[open]` (property) against `[attr.open]` (attribute) on `details` and `dialog`.** Ticket 18 measured a `[open]` property binding closing a `details` the user opened before hydration. Ticket 30 measured the same with `[attr.open]`. Neither compared the two forms side by side, and neither tested `dialog`. For each form, on `details` and on a non-modal and a modal `dialog`, measure:
   - whether the server HTML carries the `open` attribute when the bound value is true (does the server DOM reflect the `open` property?);
   - whether hydration writes the value again;
   - whether a toggle the user made before hydration survives;
   - what a `dialog` opened by `showModal()` or a `command="show-modal"` invoker does when `open` is set as a property or an attribute;
   - whether any form keeps a pre-hydration toggle without reading the DOM.

## User instructions, 2026-10-03

The user's own messages, verbatim:

> #54 (markup-agnostic) A. Host bindings: Can directive composition or directive sub-classing be used replace for example fixed roles Angular Aria host bindings?
>   B. Similarily, can directive composition or sub-classing be used to fix server-rendered HTML for example to fix tabindex="-1" until hydration?

> 56. Did you consider that there's a difference between `[open]` (Element property binding) and `[attr.open]` (Element attribute binding)?

## How to work it

One prototype in ticket 29's workspaces (`D:/tmp/ngx-yeti-29-buttons/ws`, `D:/tmp/ngx-yeti-29-accordion/ws`), using development builds so that Angular's hydration checks run. Measure in Chromium, Firefox, and WebKit. Write `prototypes/aria-subclass-and-open/README.md`; the orchestrator appends the `## Answer`. Decide nothing.

## Answer

Resolved 2026-10-03 by a Claude Opus 5.5 prototype: [aria-subclass-and-open](../prototypes/aria-subclass-and-open/README.md). It used development builds in Chromium, Firefox, and WebKit, with Angular and `@angular/aria` 22.2.1, and logged no `NG05xx` error anywhere. Results are measured unless marked. Decides nothing.

**Point 1: subclassing gives the same results as composition.** Server HTML, JavaScript off, before hydration, `hydrate never`, and after hydration all matched, with axe at 0. A subclass is slightly smaller: 34 lines against 37 for `buttons`, and 6 against 12 for the accordion trigger.
- Neither form avoids the rewrite at hydration. A role overridden by a binding comes back and is removed again 9 to 40 ms later (`group` on the toolbar, `button` on `summary`), with an animation frame between the two writes in 5 of 9 engine runs. A static replacement in the subclass (`role: ''`) avoids it, and Chromium then shows the native disclosure role. But a static value cannot remove an attribute or beat a consumer's static one (read). Firefox and WebKit were not inspected for `role=""`.
- **Correction to ticket 30:** at hydration the first widget's `tabindex` goes `0`, `-1`, `0` within one batch, in both forms. Ticket 30's probe could not see a write undone within the same batch.
- What a subclass depends on: it restates Aria's `useExisting` providers, because providers and `exportAs` are not inherited (read). Re-aliasing an inherited signal input (`inputs: ['disabled: busy']`) threw at run time. Aria 22.2.0 exported its injection tokens "to support custom subclasses" (`8d3da9ea3`, angular/components#33607, read). A maintainer called Aria a developer preview expected to be stable in v22 (#32977, read).

**Point 2: `[open]` and `[attr.open]` behave the same, in every engine.**
- The server writes `open=""` for both, because domino reflects `open` on `details` and `dialog` (read).
- Hydration writes `open` again in both forms. Both undo a toggle made before hydration, on `details` and on a non-modal `dialog`.
- On a modal `dialog` opened before hydration by `command="show-modal"`, hydration removes `open`. The dialog stays modal but hidden, the page stays blocked, and Escape does not recover it. The same happens after hydration if the bound value turns false while `showModal()` has the dialog open.
- No binding form keeps a toggle made before hydration without reading the DOM. Only `hydrate never` kept every toggle.
