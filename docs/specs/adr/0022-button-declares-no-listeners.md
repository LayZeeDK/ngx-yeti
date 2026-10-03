---
status: accepted
---

# The button directive declares no event listeners; a disabled link is a placeholder link

Adapted from ADR 0011 (`button-listener-free-disabled-contract`) of `.scratch/next-foundation-specs/`, by [Decide: which ADRs carry over](../issues/08-decide-inherited-adrs.md), once [Decide: the spec list](../issues/11-decide-spec-list.md) kept `button`. That record bound nothing here. Its general rule, no host `click` listener on an `<a>` whose navigation must stay native in a deferred region, is already [ADR 0011](0011-rendering-modes-contract-for-yeti.md) clause 3; this record is the button's own part.

Yeti's button is a class on `button`, `a`, or `input`, with its disabled look keyed on the state itself: `.button:is(:disabled, [aria-disabled="true"], :has(> input:disabled))`, and a busy button also carries `aria-disabled` (`src/components/button/button.css:88`, `:128-130`, read at `f52d1e8b9`). State stays native ([ADR 0003](0003-directives-set-yetis-class-attributes-and-markers.md) point 3): a `<button>` or `<input>` is disabled by the consumer's own `disabled`.

The old record's reasons are Angular's and still hold: a blocking listener never runs before hydration or in `hydrate never`, replay calls every stashed listener, and any `click` listener on an `<a>` makes Angular's dispatcher cancel its navigation inside a dehydrated block (`packages/core/primitives/event-dispatch/src/dispatcher.ts:127-140`, read).

We decided:

1. **`yetiButton` declares no event listener.**
2. **A disabled `<a>` is an HTML placeholder link**: the consumer binds `href` or `routerLink` to `null`, and the directive marks it `role="link"` and `aria-disabled="true"`, which Yeti's CSS already styles. The directive does not own `href`, because RouterLink writes it through its own host binding.
3. **A focusable disabled button** (Material's `disabledInteractive`, if the `button` spec offers it) renders `aria-disabled="true"` and `type="button"` while disabled, so the platform performs no submit or reset; the consumer's own handlers check the state, as Material documents.

## Considered options

- **Material's listener-based anchor disabling.** Rejected for the three failures above, as in the old record.
- **A `disabled` input on every host that binds native `disabled`.** Rejected by ADR 0003's rule that native state stays the consumer's.

## Consequences

- Disabling a link takes two bindings (the target and the disabled state); in the first milestone nothing reports a forgotten one ([ADR 0018](0018-no-import-arrays-and-later-milestone-import-checks.md)), so the `button` spec states it as documented usage.
- A single-text-field form can still submit implicitly while its only submit button is focusably disabled; the form's submit handler checks the state, as the old record found.
