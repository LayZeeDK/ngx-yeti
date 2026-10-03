# 32. Research: where Angular Aria's attribute directives fit Yeti's own markup

Type: research
Status: resolved
Blocked by: 30
Labels: wayfinder:research
Map: ../map.md

## Question

Every Angular Aria directive has an attribute selector (`[ngAccordionTrigger]`, `[ngToolbarWidget]`, `[ngTab]`, and so on), so it can sit on any element. Only the deferred-content directives require `ng-template` (`ng-template[ngAccordionContent]`, `[ngTabContent]`, `[ngMenuContent]`, `[ngComboboxPopup]`, `[ngTreeItemGroup]`). This was read in `angular/components` `708d4c6e2`, `src/aria/**`. Ticket 29's Aria variants used Aria's documented markup, not Yeti's, and its accordion's lost selectors came from that choice. Its hybrid on `<summary>` kept every Yeti selector.

The selectors leave Aria free of markup, but its host bindings are not. It writes static roles (for example `role="button"` on the accordion trigger, `accordion-trigger.ts:48`), `tabindex`, `inert`, and `aria-*` attributes, and it defers content.

For every item in the spec list ([ticket 11](11-decide-spec-list.md)), and for each Aria pattern that addresses an accessibility feature Yeti lacks ([ledger.md](../ledger.md)), can Aria's directives be applied to Yeti's own markup? Answer per item:

- which Yeti elements each directive would sit on;
- which host bindings conflict with Yeti's native semantics or CSS: a role over a native role, `inert` or `tabindex` in the server HTML (upstream bug A5), or deferred content;
- whether directive composition can settle each conflict, using [Prototype: fitting Angular Aria to Yeti by directive composition](30-prototype-fitting-aria-by-directive-composition.md)'s findings;
- whether the result meets the hydration constraints (map, Standing rulings, 2026-10-03).

## User instructions

The user's rule, 2026-10-02, verbatim:

> Generally, only reach for Angular Aria when it addresses an accesibility feature that Yeti is missing. If Angular Aria itself introduces accessibility or SSR/hydration issues or violates any other constraint, first see if it can be modified to fit using other patterns like directive composition. If fitting Angular Aria doesn't seem possible and CDK does not provide a suitable alternative either, add custom, modern Angular-native code.

The user's question, 2026-10-03, verbatim:

> accordion: 54. Isn't Angular Aria pretty much markup-agnostic? Does its directives target specific elements or only attribute selectors? If markup-agnostic, reconsider how Angular Aria can be applied to Yeti's components and other specs output by the destination.

## How to work it

Use a `/research` subagent once ticket 30 is resolved. Read Aria's source and Yeti's markup, and measure where a claim needs it. Write `research/aria-on-yeti-markup.md` with one row per item and pattern, and append an `## Answer`. Decide nothing: the building-blocks rows change only by the user's decision.

## Answer

Resolved 2026-10-03 by a Claude Opus 5.5 research run. Findings: [research/aria-on-yeti-markup.md](../research/aria-on-yeti-markup.md). Sources: Aria at `708d4c6e2` and Yeti at `f52d1e8b9` (read); tickets 29, 30, and 33; one new measurement (M1) in ticket 29's accordion workspace (route `/c32`, development build, Chromium, Firefox, and WebKit). Decides nothing.

**Question 54 [the user's 2026-10-03 question in this ticket's User instructions, not the hydration ruling also numbered 54 in the map] (read).** Aria is free of markup in its selectors: 24 of its 29 directives use a bare attribute selector. Only the five lazy-content directives require `ng-template` (`ngAccordionContent`, `ngTabContent`, `ngMenuContent`, `ngComboboxPopup`, `ngTreeItemGroup`). Its host bindings are not free of markup. They write static roles, `tabindex` and `inert` set from client-only render effects, and ids with a random infix. Its key handler also cancels the native Enter and Space of `summary` and links.

**M1 (measured).** On Yeti's `summary`, a package `[attr.role]` set to null removes Aria's `role="button"`, so the native disclosure role stays. A panel binding that alternates between `null` and `undefined` with Aria's `visible()` keeps `inert` off in the server HTML, with JavaScript off, inside `hydrate never`, and after every toggle. Closed text stays findable by `window.find()`. axe reports 0, no `NG05xx` was logged, and Aria's keys still work. Ticket 30's constant override did not hold. Remaining: Aria's ids change at hydration, the role is written back for one pass, and the `open` sync is not fixed.

**Rows** (item and pattern, then where the user's rule leads; a finding, not a decision):

| Item and pattern | Gap | Conflicts settled by composition | Hydration | Outcome | Part 2 today |
| --- | --- | --- | --- | --- | --- |
| `accordion`, Accordion | A11Y-11 in part (`aria-controls`, region; no heading) | role and `inert` (M1), content (ticket 30); not the `open` sync forced by Aria's key handling | at risk | custom Angular, or nothing | native (row 21) |
| `buttons`, Toolbar | A11Y-12 | role, `tabindex`, busy (ticket 30); ids by `id` input (inferred) | complies with two usage rules | Aria fitted, hosted by the package | consumer's `ngToolbar`, not hosted (row 27) |
| `carousel` picker, Tabs | A11Y-4 in part | server HTML (ticket 30); not the swipe Tab stop (private API) or the link semantics | complies | custom Angular | custom (row 29) |
| `dropdown`, Menu | A11Y-3a | `tabindex` (inferred); not the menu roles or Enter on links | breaks (Chromium pre-hydration click) | custom Angular | custom (row 32) |
| `nav`, Menubar | none (sheet not closed) | as dropdown | at risk | custom Angular | custom (row 34) |
| `nav`, Menu on the toggle | A11Y-3b (inferred) | as dropdown; the inline bar has no answer (inferred) | at risk | custom Angular | custom (row 34) |
| `tabs`, Tabs | A11Y-5, 17, 18 | `tabindex`, `inert`, content, ids (ticket 30) | complies | Aria fitted | Aria (row 40) |

**Differences from Part 2:** `buttons` would be hosted by the package rather than composed by the consumer. `tabs` keeps its level, but row 40 lacks the `tabindex` hand-over and the `id` input, and A11Y-17's layer-3 check expects a `hidden` panel in the server HTML, which ticket 30 avoided in order to meet building-blocks 1.11. For `accordion`, two custom bindings (unbuilt) would carry what Aria adds. Items with ledger gaps that no Aria pattern addresses (forced colours, `tooltip`, `demo`, `dialog`, `center`, the contrast rows, `spinner`, `field`, `navigation-close`, `fragment-links`) are listed in the findings with reasons. The workspace server on port 4632 was stopped.
