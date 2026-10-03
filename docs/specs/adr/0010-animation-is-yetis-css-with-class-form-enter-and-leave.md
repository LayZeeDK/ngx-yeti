---
status: accepted
---

# Animation is Yeti's own CSS; the package adds only class-form `animate.enter` and `animate.leave` where Angular inserts or removes an element

Adapted from ADR 0003 (`animation-mechanics`) of `.scratch/next-foundation-specs/`, by [Decide: which ADRs carry over](../issues/08-decide-inherited-adrs.md). That record bound nothing here. Its starting rule, that `@angular/animations` and JavaScript-timed animation are out, was the user's decision there and is already carried as this map's "Animation" note by [Decide: which standing preferences and user rulings carry over](../issues/07-decide-inherited-preferences-and-rulings.md). This record adapts the mechanism. The wording is this map's, not the user's.

The old mechanism was built for Foundation and for a browser target without `@starting-style`, `transition-behavior: allow-discrete`, or `interpolate-size`: State classes the directive bound, a wait for `transitionend` or `animationend` with a fallback timer before a dependent DOM step such as `dialog.close()`, a `grid-template-rows` auto-height rule for collapsing content, and `nfs-*` keyframe classes under Motion UI's names. None of that has a Yeti counterpart. Yeti has no State classes ([ADR 0003](0003-directives-set-yetis-class-attributes-and-markers.md)). Its dialog arrives and leaves on its own, with `display` and `overlay` transitioned `allow-discrete` and an `@starting-style` block (`src/components/dialog/dialog.css:30-38`, read at `f52d1e8b9`), so `close()` needs no wait. And the target is Baseline 2025 ([ADR 0002](0002-browser-target-baseline-2025.md)), where those features are available.

We decided:

1. **Persistent elements animate through Yeti's CSS on native state.** The package binds the attribute or state Yeti's CSS reads (`open`, `:popover-open`, `aria-selected`, `hidden`) and lets Yeti's transitions run. It does not await a transition before a DOM step, ships no keyframes, and offers no Motion input.
2. **An element Angular inserts or removes takes `animate.enter` or `animate.leave` in the class form only**, naming a Yeti class or a class whose rule reuses Yeti's tokens. Measured in [Prototype: Yeti under SSR, hydration, `@defer`, event replay, and `animate.enter` and `animate.leave`](../issues/18-prototype-yeti-rendering-modes.md): an `animate.leave` class reused Yeti's own dialog transition and the element was removed after 153 to 192 ms; `animate.enter="enter"` played Yeti's `enter` utility. The function form `(animate.leave)` is not used anywhere in the package, because a permanent function-form listener anywhere on the page kept a component's `styleUrl` styles loaded after its last instance left (angular/angular#66244, measured in the same prototype; `upstream-bugs.md` A1).
3. **A server-rendered element that persists never takes `animate.enter`**, because `animate.enter` plays at hydration in every rendering mode (measured in the old bundle's Prototype: `animate.enter` at hydration (ticket 52, `prototype-animate-enter-hydration`) on Angular 22.2; not re-measured here).
4. **`animate.enter` does not replace Yeti's `data-once` arrival**, which is viewport-driven; a `.enter[data-once]` inserted after load never arrives (measured in ticket 18). The directive that replaces `enter.js` owns that arrival ([ADR 0040](0040-package-replaces-yetis-optional-modules.md)).
5. **Reduced motion is Yeti's.** Yeti's own reduced-motion rules collapsed every animation measured ([Research: Yeti against WHATWG, WAI-ARIA, the APG](../issues/17-research-yeti-accessibility-and-standards.md)); a class the package names for `animate.leave` is one of Yeti's or reads Yeti's duration tokens, so it collapses with them. That Angular then removes the element at once is inferred, not measured under reduced motion.

## Considered options

- **Carry the old mechanism, binding a state hook and awaiting `transitionend` with a fallback timer.** Rejected: there is no State class to bind, and Yeti's own transitions already handle the steps the wait protected (the dialog's exit before it leaves the top layer).
- **Port the `nfs-*` Motion classes and inputs.** Rejected: Motion UI is Foundation's; Yeti ships its own `enter` utility.
- **Allow the function form where a spec needs a callback.** Rejected on the measured leak, until angular/angular#66244 is fixed; a spec that needs a callback reopens this record.

## Consequences

- Each spec names the Yeti transition or class its item uses, and, for an element Angular inserts or removes, the `animate.enter` or `animate.leave` class.
- The old record's `nfsAnimationsToken` for turning animations off in tests has no successor: the package owns no animation to turn off. A test that needs no motion emulates `prefers-reduced-motion`.
- Production CSS minifies `--yeti-duration-fast` to `.15s`, which a module that reads the token as milliseconds misreads (`alert.js:12`, measured in ticket 18). A directive that reads a duration token parses its unit.
