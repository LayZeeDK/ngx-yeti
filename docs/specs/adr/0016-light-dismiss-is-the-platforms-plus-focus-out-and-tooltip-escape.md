---
status: accepted
---

# Light dismiss is the platform's popover; the package adds closing on focus-out and the tooltip's Escape

Adapted from ADR 0024 (`anchored-pane-light-dismiss-model`) of `.scratch/next-foundation-specs/`, by [Decide: which ADRs carry over](../issues/08-decide-inherited-adrs.md). That record bound nothing here.

The old record built a Light dismiss registry that applied the HTML standard's `popover="auto"` light-dismiss model by hand, because `popover` was outside that map's browser target: a pointer press dismisses only when both ends land outside, nesting comes from containment, a sibling opening closes the others but never an ancestor, Escape closes only the topmost entry, and focus moving outside an entry closes it. It said why: WCAG 2.2 AA 1.4.13 (dismissible) and 2.4.11 (a pane never stays over the next focused control). And it said what would happen next: "When `popover="auto"` reaches the browser target, Dropdown panes and submenus can drop the registry without a behaviour change."

That has happened. `popover` is inside Baseline 2025 ([ADR 0002](0002-browser-target-baseline-2025.md); [Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md)), and Yeti's dropdown and nav panels are `popover` elements opened by `popovertarget`, so, in Yeti's words, "the top layer, light dismiss, Escape and the button's expanded state are all the browser's" (`src/components/dropdown/dropdown.css:1-4`; the nav's panel likewise, `src/components/nav/example.html:3-4`; read at `f52d1e8b9`). One rule of the old model is not part of the platform's: popover light dismiss closes on an outside press and on Escape, not when focus leaves. [Research: Yeti against WHATWG, WAI-ARIA, the APG](../issues/17-research-yeti-accessibility-and-standards.md) measured the dropdown staying open when focus left it. And Yeti's tooltip is CSS-only by design, not a popover, and "cannot be dismissed while the trigger stays hovered or focused", which Yeti itself names as a WCAG 1.4.13 gap (`src/components/tooltip/docs.md:7`, `:26`, read; measured in three engines in ticket 17).

We decided:

1. **No registry.** Pointer dismissal, nesting, sibling closing, and Escape for the topmost open panel are the platform's `popover="auto"` behaviour, and the package adds no document listener for them.
2. **An open panel the package owns closes when focus moves outside both the panel and its invoker.** This is the old record's focus rule, kept for its 2.4.11 reason, and it is what the APG's disclosure navigation example does (`content/patterns/disclosure/examples/js/disclosureMenu.js:87-92` in the aria-practices clone, read: it closes the open menu on `focusout` when the related target is outside). It applies to the items whose spec keeps a popover panel (Yeti's dropdown and nav).
3. **The tooltip closes on Escape while its trigger stays hovered or focused**, meeting 1.4.13, through the hook Yeti's CSS already reads, so the bubble stays hidden until the pointer or focus leaves and returns.
4. **Both are `ledger.md` rows**: features the package adds that Yeti lacks (the user's standing ruling 36).

The building block for each (for example CDK `FocusMonitor`, Material tooltip's Escape handling, `AriaDescriber`) is [Decide: the building-blocks map](../issues/25-decide-building-blocks-map.md)'s; this record fixes the behaviour.

## Considered options

- **Carry the registry**, so the package's model is exact in every engine. Rejected: it duplicates the platform's own algorithm, which the old record adopted because it was the model `popover` would bring.
- **Leave focus-out to the platform**, keeping Yeti's behaviour. Rejected: an open panel in the top layer can cover the next focused control (2.4.11), and the APG's own example closes it.
- **Make the tooltip a `popover="hint"`.** Rejected: Yeti chose a CSS-only tooltip so that it needs no script (`tooltip/docs.md:7`); the package adds Escape on top of Yeti's tooltip rather than replacing it.

## Consequences

- A close caused by focus-out or Escape is reported through the panel's own `toggle` event; whether a spec also offers a close reason, as the old record did with Material's `MenuCloseReason` words, is the spec's.
- Escape inside a nested panel closes the innermost open popover first, as the platform's close request does; a spec that nests a package panel inside a modal dialog states the order it measured.
- A focus-out close moves no focus, since focus has already left. After an Escape close the platform returns focus to the invoker (inferred from the HTML standard's popover hiding steps, not measured); each spec measures it.
- 2026-10-02: [Decide: the building-blocks map for every ngx-yeti item](../issues/25-decide-building-blocks-map.md) chose the building blocks, recorded as [ADR 0043](0043-light-dismiss-additions-are-host-listeners-not-cdk-services.md): focus-out is a `focusout` host listener with a `pointerdown` guard, and the tooltip's Escape is a `keydown` listener. CDK's `FocusMonitor` and `AriaDescriber` are not injected in the first milestone.
