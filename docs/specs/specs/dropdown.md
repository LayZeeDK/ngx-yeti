# Spec: dropdown (component)

Ticket: [82. Spec: dropdown (component)](../issues/82-spec-dropdown.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 32, Part 1 (1.2, 1.4, 1.5, 1.6, 1.8, 1.9, 1.10, 1.11, 1.15), and "Aria decisions (2026-10-03)" row 32/34, which records the user's choice "Custom disclosure nav (Recommended)" (map, Standing rulings); [ADR 0019](../adr/0019-nav-and-dropdown-are-disclosure-navigation.md) (disclosure navigation, not Aria menus); [ADR 0016](../adr/0016-light-dismiss-is-the-platforms-plus-focus-out-and-tooltip-escape.md) and [ADR 0043](../adr/0043-light-dismiss-additions-are-host-listeners-not-cdk-services.md) (focus-out with a `pointerdown` guard; light dismiss is the platform's); [ADR 0041](../adr/0041-closing-on-navigation-is-a-per-instance-subscription.md) and the [navigation-close](navigation-close.md) spec; [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md) (`hover.js` replaced by `trigger="hover"`, building-blocks 1.8); the [events](events.md) spec (`opened` and `closed` after the transition, [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 3); the open-state ruling, "Never bind; read once (Recommended)" (map, Standing rulings, 2026-10-03); [Prototype: Angular Aria for the four items that keep a native pattern](../issues/29-prototype-aria-for-the-native-pattern-items.md) and [Research: where Angular Aria's attribute directives fit Yeti's own markup](../issues/32-research-aria-directives-on-yetis-own-markup.md) (why Aria Menu was rejected); [ledger.md](../ledger.md) rows A11Y-3a and A11Y-27 (ticket 50 decision 157); [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 115 and 116 and its points 4 and 5; [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0010](../adr/0010-animation-is-yetis-css-with-class-form-enter-and-leave.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0013](../adr/0013-parts-name-their-targets-by-reference.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md); [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decisions 2, 3, 5, 6, 8, 10, 42, and 45. The Opener is the [button](button.md) spec's `yetiButton` where Yeti's example styles it as a button. `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x); `NGP/` is `github.com/angular/angular/packages/` at `5db6fc4453` (22.2.0); `APG/` is `github.com/w3c/aria-practices/content/patterns/` at `3f094fd`. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 91, 92, and 155 to 158), and each is cited where it applies.

## Problem Statement

Yeti's `dropdown` is "a button and a panel of links and buttons that opens under it, closing on Escape or a click outside, with no script unless it is asked to open on hover" (`Y/src/components/dropdown/manifest.json`). It is one **Identity class**, `dropdown`, on a wrapper; two **Attributes**, `data-side` (which edge of the Opener the panel lines up with) and `data-trigger` (`click`, or `hover` added on top); and two **Parts**: a `button` carrying `popovertarget` and a panel carrying `popover`. The platform does the work: "the top layer, light dismiss, Escape and the button's expanded state are all the browser's" (`dropdown.css:1-4`). Yeti adds the surface and the placement, by CSS anchor positioning behind an `@supports` guard, with the user agent centring the panel where anchoring is missing (`dropdown.css:42-56`). Its one optional **Module**, `hover.js`, opens the panel under a hovering pointer for `data-trigger="hover"`, and calls itself "a stopgap with a stated end", `interestfor` (`hover.js:11-13`).

An application developer using the package cannot write Yeti's markup as it stands:

- The consumer writes no `class="dropdown"`, `data-side`, `data-trigger`, `popover`, or `popovertarget`, and no id that links them ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1, 2, and 5; [ADR 0013](../adr/0013-parts-name-their-targets-by-reference.md)). A misspelt `data-side="right"` must fail to compile ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)), and a hand-typed id must not be what links the Opener to its panel.
- `hover.js` cannot be loaded beside the package ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md)), so `trigger="hover"` does nothing unless the package owns that behaviour.
- The panel stays open when focus leaves it, so a panel in the top layer can cover the next focused control (WCAG 2.2 2.4.11; [ledger.md](../ledger.md) A11Y-3a, measured in [ticket 17](../issues/17-research-yeti-accessibility-and-standards.md)).
- In a routed application a dropdown in the persistent shell stays open over the new route after a `routerLink` inside it navigates ([Prototype: Yeti's modules in a single-page Angular app](../issues/20-prototype-yeti-in-single-page-apps.md), measured in three engines).
- The developer has no Angular state to bind, no typed notification when the panel has opened or closed, and no `dropdown` **Item file** loading while a dropdown is on the page ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)).

And it must not get worse than Yeti: the panel must open with JavaScript off, before hydration, and inside `hydrate never`, and it must keep Yeti's disclosure semantics, with no menu roles ([ADR 0019](../adr/0019-nav-and-dropdown-are-disclosure-navigation.md)).

## Solution

Three directives in the secondary entry point `ngx-yeti/dropdown` (building-blocks Part 2 row 32; 1.3):

- **`YetiDropdown`**, the **Item directive** and **Coordinating directive**, on `[yetiDropdown]` (a `div`, or a nav's `li`), `exportAs: 'yetiDropdown'`. It binds `dropdown` as a static host class, `data-side` and `data-trigger` from the typed inputs `side` (`YetiSide`) and `trigger` (`YetiTrigger`), and the static presence attribute `data-ngx-yeti-item-dropdown` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)). It provides `yetiDropdownToken`, holds the `isOpen` model, emits the **Completion outputs** `opened` and `closed`, and carries the host listeners that add what the platform leaves out: closing when focus leaves (ADR 0043), hover intent for `trigger="hover"` (`hover.js` replaced), and closing on navigation through `injectCloseOnNavigation` ([navigation-close](navigation-close.md)). It acquires the `dropdown` item file last in its constructor ([setup](setup.md); ticket 50 decisions 42 and 45).
- **`YetiDropdownToggle`**, a **Part directive** on `button[yetiDropdownToggle]`, `exportAs: 'yetiDropdownToggle'`: the **Opener**. It renders `popovertarget` from the panel's id.
- **`YetiDropdownPanel`**, a Part directive on `[yetiDropdownPanel]`, `exportAs: 'yetiDropdownPanel'`. It renders `popover` and its `id` (the consumer's static `id`, else a generated `ngx-yeti-dropdown-<n>`; [generated-ids](generated-ids.md)), follows the panel's `toggle` event into the root's `isOpen`, and waits for the opening transition before the root emits `opened`.

The developer writes:

```html
<div yetiDropdown side="end">
  <button yetiButton yetiDropdownToggle type="button" emphasis="low">More</button>
  <div yetiDropdownPanel>
    <a routerLink="/duplicate">Duplicate</a>
    <button type="button" (click)="archive()">Archive</button>
  </div>
</div>
```

where Yeti's docs write `<div class="dropdown" data-side="end"><button class="button" type="button" popovertarget="row-actions" data-emphasis="low">More</button><div id="row-actions" popover>...`. The server HTML is Yeti's markup with a generated id. The platform still opens, places, and dismisses the panel; the directives observe it and add four things: focus-out closing, hover opening, navigation closing, and Angular state. No menu role, no roving focus, and no Aria or CDK menu is used ("Aria decisions" row 32/34; ADR 0019).

## User Stories

1. As an application developer, I want to make a dropdown with one directive on its wrapper and one on each of its two parts, so that I never write Yeti's `dropdown` class, `popover`, or `popovertarget` by hand.
2. As an application developer, I want the server HTML to be Yeti's documented markup, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want the panel's id generated and `popovertarget` bound to it, so that I never type an id and a duplicated or misspelt one cannot happen.
4. As an application developer, I want my own static `id` on the panel to win, so that I can address the panel from my own code or tests.
5. As an application developer, I want the generated id to be the same on the server and the client, so that hydration rewrites nothing.
6. As an application developer, I want a `side` input typed by Yeti's `side` vocabulary, so that `side="end"` compiles and `side="right"` does not.
7. As an application developer, I want `side="end"` to line the panel up with the Opener's end edge, so that a dropdown near the inline end of a row does not run off the page.
8. As an application developer, I want a `trigger` input typed by Yeti's `trigger` vocabulary, so that `trigger="hover"` compiles and `trigger="focus"` does not.
9. As an application developer, I want an input I leave unset to render no attribute, so that Yeti's defaults (`start`, `click`) apply from its CSS and the manifest.
10. As an application developer, I want to use `yetiButton` on the Opener beside `yetiDropdownToggle`, so that the Opener looks like Yeti's example.
11. As an application developer, I want the Opener to be a plain `button` when the dropdown sits in a nav, so that it takes the nav's own item look.
12. As an application developer, I want to put the dropdown on a nav's `li`, so that I can build Yeti's nav example with a submenu.
13. As a pointer user, I want a click on the Opener to open and close the panel, so that the dropdown works without any script.
14. As a keyboard user, I want Enter and Space on the Opener to open and close the panel, so that I can reach the links without a pointer.
15. As a keyboard user, I want Tab from the Opener to walk into the open panel's links and buttons, so that the items are ordinary tab stops.
16. As a keyboard user, I want Escape to close the panel and put focus back on the Opener, so that I do not lose my place.
17. As a keyboard user, I want the panel to close when I Tab past its last item, so that it never covers the control I moved to (WCAG 2.4.11; A11Y-3a).
18. As a keyboard user, I want Shift+Tab from the first item back to the Opener to keep the panel open, so that moving inside the dropdown does not close it.
19. As a pointer user, I want a press on the panel's padding or non-focusable text to keep it open, so that the panel does not shut under my pointer (ADR 0043 point 1).
20. As a pointer user, I want a press outside the dropdown to close it, so that it behaves like every popover.
21. As a pointer user with a mouse, I want a `trigger="hover"` dropdown to open when my pointer rests on it, so that a site menu opens as I expect.
22. As a pointer user, I want a pointer that only crosses the Opener not to flash the panel open, so that the page stays calm (`--yeti-dropdown-open-delay`).
23. As a pointer user, I want the gap between the Opener and the panel to be forgiving, so that the panel does not close as I move onto it (`--yeti-dropdown-close-delay`).
24. As a pointer user, I want hovering the open panel to keep it open, so that I can reach its items.
25. As a pointer user, I want a panel I opened with a click or Enter to stay open when my pointer wanders off, so that a deliberate act outranks an accidental one (`hover.js:16-19`).
26. As a pointer user, I want a press on the Opener while hover has the panel open to close it, and a press to cancel an opening that has not happened yet, so that one gesture never does opposite things.
27. As a touch user, I want a hover dropdown to keep the tap, so that hover opening never applies where the pointer cannot hover.
28. As a user of a tablet that gains a mouse, I want hover opening to start working, so that the capability is read when I use it, not at page load.
29. As a theme author, I want the hover delays to come from `--yeti-dropdown-open-delay` and `--yeti-dropdown-close-delay`, so that I tune them in my stylesheet as Yeti documents.
30. As a theme author, I want a minified token such as `.1s` read as 100 ms, so that a production build does not shrink the delays (Y1, Y2).
31. As a consumer with a routed application, I want an open dropdown in the shell to close when a `routerLink` inside it navigates, so that the new route is not covered (ADR 0041; A11Y-15).
32. As a keyboard user, I want focus on the Opener after a navigation closes the panel I navigated from, so that my place is kept (ADR 0041 point 4).
33. As a consumer with no Router, I want the dropdown to behave exactly as Yeti's does, so that a static site pays nothing.
34. As an application developer, I want an `isOpen` model I can read and bind two-way, so that my view can show or react to the panel's state.
35. As an application developer, I want `isOpen` to follow the platform, however the panel opened or closed (click, Enter, Escape, outside press, focus-out, hover, navigation, my own code), so that the model never drifts from what is on screen.
36. As an application developer, I want `opened` after the panel's opening transition and `closed` after it has closed, so that I act on settled UI (events spec; ticket 50 decision 3).
37. As an application developer, I want no `opened` or `closed` for the state the panel had when the app started, so that a page load does not look like a user action (events spec rule 9).
38. As a user who opened a dropdown before the application hydrated, I want it to stay open when the application starts, so that my action is not undone (the open-state ruling).
39. As a user, I want a dropdown to open before hydration and with JavaScript off, so that the page works while it loads and on a server-rendered page without script.
40. As a user of a JavaScript-off page, I want Escape, an outside press, and Tab into the panel to work, so that the dropdown is usable even though focus-out and hover closing need script.
41. As an application developer, I want a dropdown inside a `hydrate never` block to keep opening and closing natively and to keep its styles, so that static regions still work.
42. As an application developer, I want a dropdown inside a client-only `@defer` block to work from its first interaction, so that deferred content has no setup gap.
43. As an application developer, I want to know that a client-only `@defer` dropdown needs `dropdown` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
44. As an application developer using `withI18nSupport()`, I want translated Opener labels and items to hydrate without being re-rendered, so that localised pages keep the server's DOM.
45. As an application developer running zoneless, I want `isOpen` and the outputs to refresh my view, so that no zone is needed.
46. As an application developer, I want the `dropdown` item file loaded while a dropdown is on the page and removed after the last leaves, so that I do not import `dropdown.css` globally.
47. As an application developer, I want a panel that sits in the top layer to be placed under its Opener where anchor positioning exists and centred where it does not, so that it always opens and reads correctly (Yeti's fallback).
48. As a screen-reader user, I want the Opener announced as a button with its expanded state, and the panel's items as ordinary links and buttons, so that nothing promises a menu that does not behave like one (ADR 0019).
49. As a screen-reader user, I want the Opener to have a name, so that I hear "Account, button, collapsed", not "button".
50. As a low-vision user, I want the panel's text and its items under the pointer to contrast at least 4.5:1 with their backgrounds in both colour schemes, so that I can read them.
51. As a pointer user, I want each item at least 24 by 24 CSS pixels, so that I do not miss it (WCAG 2.5.8).
52. As a user at 320 CSS pixels wide, I want the open panel inside the viewport, so that I never scroll in two dimensions to read it (WCAG 1.4.10).
53. As a forced-colours user, I want the open panel and its focused item to stay visible, so that I can use the dropdown in high-contrast mode.
54. As a user who prefers reduced motion, I want the panel to appear without its fade, so that motion follows my setting.
55. As a right-to-left reader, I want `side` to follow the writing direction, so that `start` and `end` mean the same thing in Arabic as in English.
56. As an application developer, I want template references (`#d="yetiDropdown"`), so that I can read `isOpen` in my template.
57. As an application developer, I want the vocabulary types re-exported by name (`YetiSide`, `YetiTrigger`), so that I can type my own signals that feed the inputs.
58. As an application developer, I want the usage rules stated (one Opener and one panel, `type="button"`, a name, no menu roles, the whole dropdown in one hydration boundary), so that I use the item as Yeti intends.
59. As a package maintainer, I want the contract check to cover both attributes and every vocabulary value, so that a pin move that adds one fails before release.
60. As a package maintainer, I want every behaviour of `hover.js` listed against the directive, so that the replacement is checkable against the pinned commit (ADR 0040).
61. As a package maintainer, I want the inside-press case of the focus-out rule tested in three engines, so that WebKit, which does not focus a clicked button, is covered (ADR 0043 consequences).
62. As a package maintainer, I want the pre-hydration open, the replayed `toggle`, and the replayed `focusout` measured in the fixture app, so that ADR 0043's replay residue is known.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/dropdown/manifest.json`, `dropdown.css`, `docs.md`, `example.html`, and `hover.js`, and in `Y/schema/vocabulary.json` and `Y/src/tokens/components.css`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `dropdown`, `component`, `Navigation` |
| `class` | `dropdown` |
| `attributes` | `data-side`: enum, vocabulary `side` (`start`, `end`), default `start`, "Which edge of the trigger the panel lines up with." `data-trigger`: enum, vocabulary `trigger` (`click`, `hover`), default `click`, "What opens the panel. Click always works; hover adds opening under the pointer, and needs the optional module and a pointer that hovers." |
| `classes` | empty |
| `children` | `> button[popovertarget]` (min 1, max 1): "The trigger; its popovertarget names the panel's id." `> [popover]` (min 1, max 1): "The panel, holding ordinary links and buttons." |
| `markers` | none |
| `tokens` | all public: `--yeti-dropdown-surface`, `--yeti-dropdown-radius`, `--yeti-dropdown-padding`, `--yeti-dropdown-min` (`12rem`), `--yeti-shadow-md`, `--yeti-control-size`, `--yeti-dropdown-open-delay` (`100ms`), `--yeti-dropdown-close-delay` (`200ms`), `--yeti-color-text`, `--yeti-duration-fast`, `--yeti-ease`, `--yeti-space-xs`, `--yeti-space-sm`, `--yeti-color-surface-sunken` (defaults from `Y/src/tokens/components.css:71-78`) |
| `a11y` | `requiredAttributes` empty; `keyboard`: "Enter / Space: On the trigger, opens or closes the panel." "Tab: Walks the items, which are ordinary links and buttons." "Escape: Closes the panel and returns focus to the trigger."; `notes`: hover changes nothing else, "the click, the keyboard, focus and the expanded state are all still the browser's"; "The trigger needs a name, and the browser sets its expanded state from popovertarget"; no menu roles; "Inside a nav, put the dropdown in the li beside the link it belongs to." |
| `js` | `hover.js`, optional; no events |
| `support` | `unguarded`: `popover`, `@starting-style`; `guarded`: "anchor positioning (fallback: the panel is centred by the user agent)" |
| `since` | `7.0.0` |

How it works, in `@layer yeti.components` (`dropdown.css`): `.dropdown` is `inline-block`; `.dropdown > [popover]` loses the user agent's margin, border, and background; `:popover-open` lays the panel out as a column at least `--yeti-dropdown-min` wide with the dropdown's surface, radius, text colour, shadow, and an `opacity` transition over `--yeti-duration-fast` (`:13-22`), starting from `opacity: 0` in `@starting-style` (`:57-59`). Items (`a` and `button` in the panel) are flex rows at least `--yeti-control-size` tall with the sunken surface under the pointer (`:23-40`). Under `@supports` for `anchor-name`, `anchor-scope`, `position-anchor`, and `position-area`, each `.dropdown` scopes the anchor `--yeti-dropdown`, its `> button[popovertarget]` is the anchor, and the open panel is `position: fixed` at `position-area: block-end span-inline-end` with a small gap, or `span-inline-start` for `[data-side="end"]` (`:46-56`). `data-trigger` is read by no CSS rule (ticket 26 point 5). Inside an open nav sheet, `nav.css` turns the panel into a full-width block docked under its Opener (`Y/src/components/nav/nav.css:175-215`); that is the `nav` item's file.

Attributes left to the consumer (ticket 26 rows 115 and 116 map both attributes; nothing of Yeti's is left out): the Opener's `type` and its name (text or `aria-label`), the panel's items and their own attributes, and an optional static `id` on the panel. The Opener's expanded state is the platform's and nobody writes `aria-expanded` (`docs.md`, Accessibility).

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `dropdown` | static host class on `YetiDropdown` | always | ADR 0003 point 1; Part 2 row 32 |
| Attribute `data-side` | which edge the panel lines up with | input `side`: `YetiSide \| undefined`, bound `[attr.data-side]`, `null` when unset | unset renders nothing; Yeti's `start` applies. `side` is not an HTML attribute | ticket 26 row 115 (R) |
| Attribute `data-trigger` | what opens the panel | input `trigger`: `YetiTrigger \| undefined`, bound `[attr.data-trigger]`; the hover listeners read the effective value `trigger() ?? 'click'` | unset renders nothing; Yeti's `click` applies. Rendered although no CSS reads it. Not an HTML attribute | ticket 26 row 116 (R), points 4 and 5 |
| Child `> button[popovertarget]` | the Opener | `YetiDropdownToggle` on `button[yetiDropdownToggle]`, binding `[attr.popovertarget]` to the panel's id | always bound | ADR 0003 point 5; ADR 0013 point 2; Part 2 row 32 |
| Child `> [popover]` | the panel | `YetiDropdownPanel` on `[yetiDropdownPanel]`, static `popover=""` (auto) and `[attr.id]` | always | ADR 0003 point 5; Part 2 row 32 |
| State `:popover-open` | open or closed | the platform's; mirrored into the `isOpen` model from the panel's `toggle` event | never bound | building-blocks 1.4 (open-state ruling); [architecture-guide.md](../architecture-guide.md) P11 |
| Expanded state of the Opener | the browser's, from `popovertarget` | nothing written; no `aria-expanded` | not applicable | `dropdown/docs.md` Accessibility; ADR 0013 consequences |
| Module `hover.js` | opening on hover | replaced by `YetiDropdown`'s host listeners for `trigger="hover"` (section "Module replaced") | not applicable | ADR 0040; building-blocks 1.8 |
| Events | none (`hover.js` dispatches none) | outputs `opened` and `closed`, `void`, which map no Yeti event | not applicable | [events](events.md), "Outputs that map no Yeti event" and rule 3 |
| Tokens (manifest, public) | the panel's look, the item size, the transition, the hover delays | the consumer's; the package writes none. `YetiDropdown` reads `--yeti-dropdown-open-delay` and `--yeti-dropdown-close-delay` through computed style in its hover handlers, parsed with their unit | not applicable | ADR 0004; building-blocks 1.8; Y1, Y2 |
| Private tokens (`--_yeti-*`) | none in `dropdown.css` | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-dropdown=""` on `YetiDropdown`'s host only | always present | ADR 0045; ADR 0060 point 2; ticket 50 decision 6 |
| Generated id (package) | Yeti's ids are the author's | `ngx-yeti-dropdown-<n>` on the panel unless the consumer wrote a static `id` | not applicable | ADR 0044; [generated-ids](generated-ids.md) |
| Injection token | not Yeti's | `yetiDropdownToken`, provided by `YetiDropdown` | not applicable | building-blocks 1.3, 1.9 |

The input value types are Yeti's own `YetiSide` and `YetiTrigger`, from the package's generated `yeti-types.ts`, re-exported by name and never redeclared (ADR 0080 point 5; ADR 0060 point 10). `YetiSide` is the type `sidebar`, `hero`, `media`, and `enter` also read, so two directives on one element never declare `side` with different types (building-blocks 1.4, shared vocabularies). Neither class name, `YetiDropdown`, `YetiDropdownToggle`, nor `YetiDropdownPanel`, is among the 46 names `yeti.d.ts` exports at the Pin, and neither is `yetiDropdownToken` (ADR 0080 point 4; ticket 50 decision 10).

The part directives set no presence attribute and acquire no item file: Yeti's part rules apply only under `.dropdown`, whose own attribute keeps the link (ticket 50 decision 6; ADR 0045's scope note).

**Module replaced: `hover.js`** (ADR 0040; Part 2 row 32, "`hover.js` replaced"). Every behaviour, line by line:

| `hover.js` behaviour | Lines | Package | Kept, changed, or removed |
| --- | --- | --- | --- |
| Opt-in per instance by `data-trigger="hover"`; click untouched | `:2-3`, `:44` | the hover listeners act only while `trigger() ?? 'click'` is `'hover'`; click stays the platform's `popovertarget` | kept; keyed on the input, not on the attribute in the DOM (ticket 26 row 116) |
| Any popover component gets it by declaring `data-trigger` | `:8-9` | only `yetiDropdown` | changed: the attribute is the dropdown's only (manifest); no other item declares it |
| Hover only where `(hover: hover) and (pointer: fine)`, read at event time | `:14`, `:50-51`, `:84` | `matchMedia(...)` read in each handler | kept (building-blocks 1.5) |
| Delegated `pointerover` and `pointerout` on `document`, with a `contains(relatedTarget)` crossing test | `:4-6`, `:40-53`, `:83-87` | `pointerenter` and `pointerleave` host listeners on the root, which fire only when the pointer crosses the root's boundary; the panel is a DOM child of the root even in the top layer, so moving onto it is not a crossing | changed: per instance, not document-level (building-blocks 1.8; Part 2 row 32; ADR 0011 clause 6) |
| The panel is the one the Opener's `popovertarget` names | `:23-29` | the panel part registers with the root through `yetiDropdownToken`; the Opener binds its id | changed: registration, not a DOM query (architecture-guide P4) |
| Open after `--yeti-dropdown-open-delay`; close after `--yeti-dropdown-close-delay`; one pending timer per dropdown, each new one replacing the last | `:31-38`, `:55`, `:88` | one timer per root, started in the handler; the delay read from the root's computed style and parsed with its unit (`ms` or `s`); an absent or unparsable value means no wait | changed: the unit is parsed, where `hover.js` used `parseFloat` and would read a minified `.1s` as 0.1 ms (Y2, inferred; Y1 measured the same for `alert.js`) |
| `showPopover()` only when closed; `hidePopover()` only when open | `:56-58`, `:89-91` | the same guards, on `:popover-open` | kept |
| Closes only a panel it opened itself | `:16-19`, `:59`, `:90` | a private flag set when the hover timer opens the panel | kept |
| However the panel closes next, it stops being hover's | `:60-70` | the panel's `toggle` listener clears the flag when the panel closes | kept, through the listener `YetiDropdownPanel` already has |
| A press cancels a pending open | `:74-81` | the root's `pointerdown` host listener clears the timer | kept; bubble phase on the root rather than capture on `document`, which sees every press inside the root (inferred) |
| Pressing the Opener while hover has the panel open closes it | `docs.md:27` | the platform's `popovertarget` toggle | kept, unchanged |
| Listeners for dropdowns added after load | `:4-6` | each directive sets up its own host when created, in any rendering mode | changed: per instance (ADR 0011 clause 5) |
| Stated end: `interestfor` | `:11-13` | named under "Platform features to adopt" | kept as the plan (ADR 0040 consequences; building-blocks 1.2) |

Added over `hover.js`, which the module never did: focus-out closing (A11Y-3a; ADR 0043), closing on navigation (A11Y-15, owned by [navigation-close](navigation-close.md); ADR 0041), the `isOpen` model, and the `opened` and `closed` outputs. Removed: nothing a consumer could observe. The hover behaviour is like-for-like and is not a ledger row (ADR 0040 consequences).

**Tokens subsection** (ADR 0004; building-blocks 1.13). The item reads the public tokens the manifest lists. The package writes none, offers no input per token, and ships no theme. A consumer sets them in a `:root` block, in a **Theme** after Yeti, or on one dropdown or an ancestor, because they are plain public tokens read through the cascade (`Y/src/guides/theming.md:38`): a per-dropdown `--yeti-dropdown-open-delay: 0ms` in the consumer's stylesheet makes that dropdown open at once on hover. The two delay tokens are read by the directive in its handlers, so a change takes effect on the next pointer crossing. **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- **Root and parts.** `YetiDropdown` provides `yetiDropdownToken` (`InjectionToken` typed with `import type`, `useExisting`; building-blocks 1.9). `YetiDropdownToggle` and `YetiDropdownPanel` inject it, required, because neither can exist alone (manifest `children` `min: 1`): a forgotten root fails at creation with Angular's DI error.
- **The panel registers.** `YetiDropdownPanel` registers itself with the root at construction (an unordered part; architecture-guide P4) and unregisters on destroy. The root reads the panel's element and id from that registration for every imperative call (`showPopover()`, `hidePopover()`) and for the Opener's binding. One panel per root (usage rule 1).
- **Ids and the relationship attribute.** The directive whose host renders the `id` generates it (ticket 50 decision 5; architecture-guide P4): `YetiDropdownPanel` calls `injectYetiId('dropdown')` in a field and binds `[attr.id]`. The consumer's static `id` wins (ADR 0044 step 1). `YetiDropdownToggle` reads the registered panel's id through the token and binds `[attr.popovertarget]` (ADR 0013 point 2). Both ends are host bindings with the same value on the server and the client, so hydration rewrites nothing (ADR 0044 point 4).
- **No host directives.** Nothing from Aria or CDK is hosted ("Aria decisions" row 32/34). `yetiButton` on the Opener is written beside `yetiDropdownToggle`, never hosted (building-blocks 1.9, "Two findings").
- **Inside a nav.** A dropdown in a nav item is a nested element with its own directives on the `li` (`Y/src/components/nav/manifest.json:76`; Part 2 row 34). The nav's focus-out and navigation closing are the nav's; each closes its own panel. Building-blocks 1.9 and [architecture-guide.md](../architecture-guide.md) P6 and P22 name "a dropdown inside or outside a nav" as an optional injection of `yetiNavToken`; this spec finds no behaviour that needs it and injects nothing from the nav ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 156).
- **Other injections.** `Router` through `injectCloseOnNavigation` (optional, [navigation-close](navigation-close.md)); `DestroyRef`; the ADR 0060 styles service through `injectYetiItemStyles('dropdown')` ([setup](setup.md)); `DOCUMENT` for `matchMedia`'s window and `activeElement`, used only in handlers.
- **Hydration boundary.** The root and both parts belong to one hydration boundary: a consumer's `@defer` wraps the whole dropdown, never one part (building-blocks 1.11 decision 6; usage rule 9).

### 4. API

| Member | `YetiDropdown` | `YetiDropdownToggle` | `YetiDropdownPanel` |
| --- | --- | --- | --- |
| Selector | `[yetiDropdown]` | `button[yetiDropdownToggle]` | `[yetiDropdownPanel]` |
| `exportAs` | `yetiDropdown` | `yetiDropdownToggle` | `yetiDropdownPanel` |
| Entry point | `ngx-yeti/dropdown` | same | same |
| Inputs | `side: YetiSide \| undefined` (Yeti default `start`); `trigger: YetiTrigger \| undefined` (Yeti default `click`); each `input()` with no default value | none | none |
| Model | `isOpen: ModelSignal<boolean>`, default `false`, following the platform (below) | none | none |
| Outputs | `opened: OutputRef<void>`, `closed: OutputRef<void>`: Completion outputs | none | none |
| Methods | none: programmatic open and close go through `isOpen`; no item but the dialog has public `open()`, `close()`, or `toggle()` methods ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 91, as amended by decision 222) | none | none |
| Host | static `class: 'dropdown'`; static `data-ngx-yeti-item-dropdown: ''`; `[attr.data-side]`, `[attr.data-trigger]`, `null` when unset; listeners `(focusout)`, `(pointerdown)`, `(pointerenter)`, `(pointerleave)` | `[attr.popovertarget]` from the token | static `popover: ''`; `[attr.id]`; listeners `(toggle)`, `(transitionend)` |
| Providers | `{provide: yetiDropdownToken, useExisting: YetiDropdown}` | none | none |
| Lifecycle | calls `injectCloseOnNavigation(isOpen, closeForNavigation)` and, as its last constructor statement, `injectYetiItemStyles('dropdown')`; on destroy clears its hover timer and its pending completion wait | none | registers at construction, unregisters on destroy |

No input default differs from Yeti's (ADR 0070 rule 1). A static attribute type-checks as a string literal under `strictTemplates`, so `side="end"` compiles and `side="right"` does not (ADR 0070 rule 2).

**Behaviour, by listener:**

1. **`toggle` on the panel** (`YetiDropdownPanel`). Writes `isOpen` from the event's `newState` when it differs from the current value, so `isOpenChange` emits once per real change and a replayed `toggle` that matches the state read at start-up emits nothing (events rule 9). On `closed` it clears the hover flag. It starts the completion wait for the root (item 5).
2. **`focusout` on the root** (ADR 0043 point 1; Part 2 row 32; A11Y-3a). While the panel is `:popover-open`: if `event.relatedTarget` is outside the root, call `hidePopover()`; if `relatedTarget` is `null` and item 3's one-shot press flag is set, clear the flag and do nothing, because a press on non-focusable panel content moves focus to `body`. Otherwise (`null` with no such press, for example the window losing focus) it closes, as the APG example's `contains(relatedTarget)` test does (`APG/disclosure/examples/js/disclosureMenu.js:87-92`; inferred for the window case, recorded in layer 4). It moves no focus, since focus has already left (ADR 0016 consequences). It changes state and calls no `preventDefault()` (ADR 0043 consequences).
3. **`pointerdown` on the root.** Sets a one-shot flag for item 2's guard, which the next `focusout` consumes and a zero-delay timer clears, because event replay may dispatch the queued events in one synchronous loop (inferred; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 92), and clears a pending hover timer (`hover.js:74-81`). It calls no `preventDefault()`.
4. **`pointerenter` and `pointerleave` on the root**, acting only while `trigger() ?? 'click'` is `'hover'` and `matchMedia('(hover: hover) and (pointer: fine)').matches` at event time. `pointerenter` replaces any pending timer with one of the open delay that, if the panel is still closed, calls `showPopover()` and sets the hover flag. `pointerleave` replaces any pending timer with one of the close delay that, if the flag is set and the panel is open, calls `hidePopover()`. Neither event is replayed (`NGP/core/primitives/event-dispatch/src/event_type.ts:287-292`, `MOUSE_SPECIAL_EVENT_TYPES`, which the replay contract skips; read), so hover never acts before hydration (ADR 0011 clause 6; building-blocks 1.11 decision 4). A change of `trigger` away from `'hover'` clears a pending timer.
5. **Completion** (building-blocks 1.6 rule 1; events rule 7; ticket 50 decision 3). When `toggle` reports `open`, the panel directive reads its host's computed `transition-duration` once (the longest entry, parsed with its unit) and waits for a `transitionend` whose `target` is the panel, or for that duration plus 100 ms, whichever comes first; then the root emits `opened`. Yeti's open transition is `opacity` over `--yeti-duration-fast` from `@starting-style` (`dropdown.css:21`, `:57-59`). When `toggle` reports `closed`, the closed panel declares no transition (Yeti puts the `transition` only on `:popover-open`), so the measured duration is zero and `closed` is emitted at once (read in `dropdown.css`; inferred, measured in layer 2). A measured zero, as under reduced motion, completes at once. A wait still running when the opposite change starts completes at once, so a `closed` always follows the `opened` before it, as the dialog and nav specs have it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 91 and 153).
6. **Closing on navigation** (ADR 0041; [navigation-close](navigation-close.md)). `closeForNavigation` calls `hidePopover()` on the panel when it is open. The platform's hiding steps return focus to the element that had it when the panel opened, but only when focus is inside the panel (inferred from the HTML standard; not read for this spec, and WebKit leaves a clicked button unfocused). ADR 0041 point 4 leaves it to this spec to measure that and add `focus()` on the Opener if the platform does not: this spec's reading is that the close path focuses the Opener when focus was inside the panel before the call and is not on the Opener after it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 155).
7. **`isOpen` from outside.** `isOpen` is read once from the panel's `:popover-open` when the directive is created, and then follows `toggle` (the open-state ruling; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 91). On the server the read reports closed, because the server's DOM never has an open popover; on the client at hydration it sees what the user did before hydration. At the first render a bound `[(isOpen)]` that differs from the element is set from the element, which emits `isOpenChange`, so the parent's two-way state follows the panel; `opened` does not emit for the state found at creation. A parent's later write to the model is a command, applied with `showPopover()` or `hidePopover()` in an `afterRenderEffect` write phase, guarded by `:popover-open` because both throw on a no-op (`hover.js:56`, `:89`); it emits no `isOpenChange`, and `opened` or `closed` follows the change. The root has no `open()`, `close()`, or `toggle()` method.
8. **Destroy** (building-blocks 1.9). Clears the hover timer and the completion wait. An open panel leaves the top layer with its element (the HTML removal steps hide a popover; ticket 20 measured a panel in a destroyed route closed by its removal), so nothing else is restored.

No key handler: Enter, Space, Tab, and Escape are the platform's, and the APG's arrow keys, Home, and End are optional for disclosure navigation (`APG/disclosure/examples/disclosure-navigation.html:172-181`, `:231-268`); Part 2 row 32 lists no key listener ("what remains is three listeners"), and building-blocks 1.5's "the dropdown implements its APG key table directly" is met by the platform's keys with no Aria.

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. A dropdown has exactly one `button[yetiDropdownToggle]` and one `[yetiDropdownPanel]`, both direct children of the `yetiDropdown` element, the Opener first (manifest `children`; Yeti's CSS uses the `>` combinator, `dropdown.css:7`, `:48`).
2. Give the Opener `type="button"`. A submit button with a form owner does not run the `popovertarget` activation (inferred from the HTML standard), and Yeti's examples write `type="button"` (building-blocks 1.10).
3. Give the Opener a name: its text, or `aria-label` on an icon-only Opener (manifest `a11y.notes`; building-blocks 1.10 Names). Never write `aria-expanded`, `aria-haspopup`, or `aria-controls` on it: the browser sets the expanded state from `popovertarget` (`docs.md`, Accessibility).
4. The panel holds ordinary links and buttons, with no `role="menu"`, `menuitem`, or roving `tabindex` (ADR 0019 point 1). For choosing a value in a form, use a `select` inside a field (`docs.md`, "When to use it").
5. Do not write `class="dropdown"`, `data-side`, `data-trigger`, `popover`, `popovertarget`, or `data-ngx-yeti-item-dropdown` on any of the three elements; the directives bind them, and hydration writes a static attribute back before the binding wins (ADR 0003; building-blocks, "Hydration constraints (2026-10-03)"). A static `id` on the panel is allowed and wins (ADR 0044 step 1); never bind `[id]` on it (ticket 50 decision 5, the generated-ids usage rules).
6. Inside a nav, put `yetiDropdown` on the `li` that holds the Opener and the panel, and give the Opener no `yetiButton`, so it takes the nav's item look (`Y/src/components/nav/example.html:7-14`; manifest `a11y.notes`).
7. Where the Opener sits in the inline-end half of a row (an account menu at the end of a bar), set `side="end"`, so the panel grows towards the inline start and stays in the viewport (`docs.md`, "How it works"; WCAG 1.4.10; ledger [A11Y-27](../ledger.md); [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 157).
8. `trigger="hover"` adds to the click; it never replaces it, and a touch screen keeps the tap (manifest). Do not hide content only a hovering pointer can reach elsewhere on the page.
9. Put the whole dropdown, root and both parts, inside one hydration boundary; never `@defer` one part (building-blocks 1.11 decision 6).
10. Bind every input from values that are the same on the server and the client (hydration constraints).
11. Import all three directives where a template writes them. A **Forgotten import** of `YetiDropdownToggle` renders a button with no `popovertarget` and no error, and of `YetiDropdownPanel` a `div` with no `popover`, so the panel shows inline and never opens (building-blocks 1.9; ADR 0018). A bound input or a template reference makes the compiler report it (NG8002, NG8003).
12. A `routerLink` or `href` inside the panel is the consumer's; a bare `href="#id"` under `<base href>` needs `provideYetiFragmentLinks()` ([fragment-links](fragment-links.md); [setup](setup.md)).

### 5. Material comparison

| Aspect | ngx-yeti `dropdown` | Angular Material `MatMenu` and `MatMenuTrigger` |
| --- | --- | --- |
| Pattern and roles | APG disclosure navigation; the items keep their link and button roles (ADR 0019) | APG menu button; `role="menu"` and `menuitem` (`NC/src/material/menu/menu-item.ts:35`, `:60`) |
| Shape | three attribute directives on the consumer's wrapper, `button`, and panel; the panel stays in place in the DOM | a trigger directive `[matMenuTriggerFor]` (`menu-trigger.ts:29`) and a `mat-menu` component whose template CDK Overlay attaches elsewhere |
| Opening | the platform's `popovertarget`, before hydration and with no script | a `click` and `keydown` handler, after bootstrap |
| Placement | Yeti's CSS anchor positioning with the user agent's centring fallback; `side` (`start`, `end`) | CDK Overlay's measured positions; `xPosition`, `yPosition`, `overlapTrigger` (`menu.ts:58-64`, `:209`) |
| Dismissal | the platform's Escape and outside press; focus-out by a host listener (A11Y-3a) | overlay backdrop or outside click, Escape, and Tab out with the reason `'tab'` (`menu.ts:53`, `:298`) |
| Hover | `trigger="hover"` on any dropdown, with token delays | only nested submenu triggers open on hover (`menu-trigger.ts:208-211`) |
| State | `isOpen` model | `menuOpen` getter (`menu-trigger-base.ts:177`) |
| Notifications | `opened`, `closed`: `output()`, `void`, after the transition | `menuOpened`, `menuClosed`: `@Output() EventEmitter<void>` (`menu-trigger.ts:79`, `:90`) |
| Methods | none ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 91) | `openMenu()`, `closeMenu()`, `toggleMenu()` (`menu-trigger.ts:122-133`) |
| Focus on close | the platform's restore, plus the navigation case (section 4 item 6) | `restoreFocus`, default `true` (`menu-trigger.ts:76`) |
| `exportAs` | `yetiDropdown`, `yetiDropdownToggle`, `yetiDropdownPanel` | `matMenuTrigger` (`menu-trigger.ts:39`), `matMenu` (`menu.ts:101`) |

Borrowed: `void` notifications for open and closed, and the closing-when-focus-leaves behaviour Material reaches through its key manager's `tabOut`. Not borrowed: the menu roles and keys (ADR 0019), the overlay and its positions (building-blocks 1.8), the methods ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 91), and `restoreFocus` as an input (the platform restores focus on Escape; navigation is section 4 item 6).

### 6. Implementation level and primitives

Native platform, level 1 (Part 2 row 32): `popover`, `popovertarget`, `:popover-open`, light dismiss, the top layer, and the Opener's expanded state are the platform's and inside Baseline 2025 (building-blocks 1.2); anchor positioning is Yeti's guarded CSS with its stated fallback, and the package adds no positioner and no feature check (1.2, 1.8). What remains is host listeners and signals: "the top layer, light dismiss, Escape, and `aria-expanded` are the platform's (`dropdown.css:1-4`); what remains is three listeners" (row 32's reason).

- `@angular/aria` is not used. Aria `Menu` (`NC/src/aria/menu/menu.ts:150`) and CDK `CdkMenuTrigger` (`NC/src/cdk/menu/menu-trigger.ts:80`) put `role="menu"` on Yeti's panel, which Yeti refuses (ADR 0019; `dropdown.css:1-4`). Ticket 29 measured Aria's menu family on Yeti's markup in three engines: the styles survive only through a 40-line bridge that keeps `popover` and `popovertarget`; `hover.js` is not replaced, because Aria has no hover opening for a trigger; Enter on a link item is cancelled; every item is `tabindex="-1"` with JavaScript off, before hydration, and inside `hydrate never` (upstream-bugs A5); and in Chromium a click before hydration is undone at hydration (A7) ([prototypes/aria-nav-dropdown/README.md](../prototypes/aria-nav-dropdown/README.md)). Ticket 32 recommends custom Angular for the dropdown for the same reasons (its rows for `dropdown`, Menu). The user then chose "Custom disclosure nav (Recommended)" ("Aria decisions" row 32/34; map, Standing rulings).
- `@angular/cdk` is not used for behaviour: `FocusMonitor` (`NC/src/cdk/a11y/focus-monitor/focus-monitor.ts:178-181`) reports that focus left, not where it went, so it cannot tell the inside press from a departure, and it adds document listeners (ADR 0043 point 4). `BreakpointObserver` and `MediaMatcher` are not used (building-blocks 1.7); the hover capability query is read in the handler. CDK Overlay is not used (building-blocks 1.8).
- Custom Angular pieces: the four root listeners, the panel's two, the `isOpen` model, the two outputs, and the timers, all per instance. Ticket 29's variant A sketched this row and reproduced every `hover.js` behaviour with three listeners, focus-out with the guard, and navigation closing, with 0 computed-style differences from Yeti's example and 0 axe violations (`prototypes/aria-nav-dropdown/README.md`, Results and finding 2; measured).

### 7. ARIA, keyboard, accessibility, and the ledger

- **APG pattern:** Disclosure Navigation Menu (ADR 0019 consequences; `APG/disclosure/examples/disclosure-navigation.html`). Ticket 17 found Yeti's dropdown matching its required keys, with focus-out the one deviation.
- **Roles:** the Opener is a `button`; the panel has no role (a `div`); its items are `link` and `button`. Ticket 29 measured the tree as `button "Account"` followed by `link "Profile"`, `link "Settings"`, `button "Sign out"`, with Chromium's own tree reporting `expanded=true` on the Opener from `popovertarget`, with no attribute.
- **States:** expanded, the platform's from `popovertarget`; nothing else.
- **Names:** the Opener's text or the consumer's `aria-label` (usage rule 3); the directives declare no name input (building-blocks 1.10).

| Key | On the Opener | In the open panel | Record |
| --- | --- | --- | --- |
| Enter, Space | open or close the panel; focus stays on the Opener | activate the focused link or button | platform; manifest `a11y.keyboard` |
| Tab | move into the panel, its items in DOM order | to the next item; past the last item, focus leaves and the panel closes | platform; the package's `focusout` (A11Y-3a) |
| Shift+Tab | to the previous control; if focus leaves the root, the panel closes | to the previous item, then to the Opener, the panel staying open | platform; `focusout` |
| Escape | close the panel | close the panel and return focus to the Opener | platform close request (ticket 29 measured the return, except in WebKit after a click, where the clicked Opener never had focus) |
| Arrow keys, Home, End | nothing | nothing | APG marks them optional; row 32 adds no key listener |

Focus: the page's focus ring on every item and on the Opener (Yeti's base rule). The package moves focus only in the navigation case (section 4 item 6). Escape inside a dropdown inside an open nav sheet closes the dropdown first, as the platform's close request does (ADR 0016 consequences; `nav/docs.md:27`).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value | Native roles; the expanded state from `popovertarget`; no menu roles (ADR 0019). Play functions assert the Opener's role, name, and expanded state (the tree, not an attribute) and the items' roles. |
| 1.3.2 Meaningful Sequence, 2.4.3 Focus Order | The panel follows the Opener in the DOM (usage rule 1), so Tab reaches the items next, though the panel paints in the top layer. `dropdown--default` asserts the Tab sequence. |
| 1.4.3 Contrast (Minimum) | The panel's text on `--yeti-dropdown-surface`, and an item's text on `--yeti-color-surface-sunken` under the pointer, at least 4.5:1, light and dark, asserted with the exact WCAG formula on computed colours (ADR 0015 point 3; ticket 50 decision 8). |
| 1.4.10 Reflow | At 320 CSS pixels the open panel stays inside the viewport with usage rule 7 followed (`dropdown--narrow`, layer 4 in three engines), and its position with the Opener at the inline end and `side` left at `start` is recorded (ledger [A11Y-27](../ledger.md); [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 157). |
| 1.4.11 Non-text Contrast | The focus ring is Yeti's, asserted at least 3:1 against the panel's surface; the panel's own edge is a shadow, and the items are identified by their text, so no boundary ratio is asserted. Under forced colours, see the forced-colours note below. |
| 1.4.13 Content on Hover or Focus | For `trigger="hover"`: dismissible by Escape (the platform's close request) without moving the pointer; hoverable, because the panel is inside the root and the close waits `--yeti-dropdown-close-delay`; persistent until the pointer leaves, Escape, an outside press, or focus leaves. A click-opened panel is not content on hover. `dropdown--hover` asserts all three. |
| 2.1.1 Keyboard | Every function is reachable by the platform's keys; hover only adds. |
| 2.4.7 Focus Visible | Yeti's ring on the Opener and every item; layer 4 asserts it on keyboard focus. |
| 2.4.11 Focus Not Obscured (Minimum) | The panel closes when focus leaves it (A11Y-3a), so it never covers the control focus moved to. `dropdown--focus-out` asserts it. |
| 2.5.8 Target Size (Minimum) | Items are at least `--yeti-control-size` tall (`dropdown.css:28`); the play function asserts every item and the Opener at least 24 by 24 CSS pixels. |
| 3.2.1 On Focus | Focusing the Opener opens nothing; only activation or a resting pointer with `trigger="hover"` does. |

Forced colours: the open panel is drawn by a background and a shadow with `border: 0` (`dropdown.css:10`, `:18-20`), so under `forced-colors: active` its edge against the page may disappear while its text and focus ring remain. This spec adds no package CSS and no ledger row, after the decisions for decoration and surfaces ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 26, 30, and 78), and layer 4 records the panel's computed border and a screenshot in three engines ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 158).

**Ledger rows owned:** A11Y-3a and A11Y-27 ([ledger.md](../ledger.md); Part 2 row 32). A11Y-27 is the panel's reflow at 320 CSS px: usage rule 7 and the `dropdown--narrow` measurement, with no package CSS until measured ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 157). The panel stays open when focus leaves it (WCAG 2.2 2.4.11; the APG example's rule; Material menu parity); Yeti's `popover` light dismiss covers an outside press and Escape, not focus-out. The package adds the root's `focusout` host listener with the `pointerdown` guard (section 4 items 2 and 3). This spec confirms the row as written, with its "Tested by" L1 and L4, plus the layer-2 cases below. The replay case is section 10's. Row A11Y-15 (closing on navigation) is owned by [navigation-close](navigation-close.md); this item uses it. The hover behaviour is like-for-like and adds no row (ADR 0040 consequences).

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<div yetiDropdown>
  <button yetiButton yetiDropdownToggle type="button" emphasis="medium" i18n>Account</button>
  <div yetiDropdownPanel>
    <a routerLink="/profile" i18n>Profile</a>
    <a routerLink="/settings" i18n>Settings</a>
    <button type="button" (click)="signOut()" i18n>Sign out</button>
  </div>
</div>
```

Server HTML and the hydrated DOM are the same (attribute order aside):

```html
<div yetidropdown class="dropdown" data-ngx-yeti-item-dropdown="" jsaction="focusout:;pointerdown:;">
  <button yetibutton yetidropdowntoggle type="button" emphasis="medium" class="button" data-ngx-yeti-item-button="" data-emphasis="medium" popovertarget="ngx-yeti-dropdown-0">Account</button>
  <div yetidropdownpanel popover="" id="ngx-yeti-dropdown-0" jsaction="toggle:;">...</div>
</div>
```

`jsaction` appears for the replayable listeners only: `focusout` and `pointerdown` on the root and `toggle` on the panel; `pointerenter`, `pointerleave`, and `transitionend` are not on Angular's replay list (`NGP/core/primitives/event-dispatch/src/event_type.ts:287-372`, read). The exact `jsaction` value is Angular's; the SSR smoke asserts which events it names, not its text. With `side="end"` and `trigger="hover"` the root also carries `data-side="end"` and `data-trigger="hover"`; unset inputs render nothing. A consumer `id="row-actions"` on the panel gives `id="row-actions"` and `popovertarget="row-actions"`.

Closed and open: the DOM does not change when the panel opens. Open is the panel's `:popover-open` state, which the platform sets; no attribute marks it, and the package binds none. The server always renders the panel closed: a popover has no attribute that opens it, so a page cannot ship a dropdown open (read: `popover` in the HTML standard has no open attribute; the `isOpen` default is `false`).

The server also writes the item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>components/dropdown/dropdown.css?v=<pin>` (`Y/src/yeti.css:57`, after `nav` and before `dialog`), with `data-ngx-yeti-styles="dropdown"`, `data-ngx-yeti-app`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) points 2, 3, and 5). The Opener's `yetiButton` writes the `button` and `spinner` links ([button](button.md)).

The delta from Yeti's docs markup: the consumer writes three directive attributes where the docs write `class="dropdown"`, `popovertarget`, `popover`, and the shared `id`, and input names where they write `data-*` names.

### 9. Animation

Yeti's own transition only: the open panel's `opacity` from `@starting-style` over `--yeti-duration-fast` with `--yeti-ease` (`dropdown.css:21`, `:57-59`), and the items' background on hover. No closing transition is declared, so the panel disappears at once when it closes (read). The directives add no class and no inline style for it (ADR 0010 point 1; building-blocks 1.6 rule 1); the completion wait (section 4 item 5) only times the outputs. Reduced motion is Yeti's: its tokens collapse the duration, and a measured zero completes at once (1.6 rule 4). No `animate.enter` or `animate.leave`: the panel persists in the DOM and is server-rendered (ADR 0011 clause 12). A dropdown the consumer inserts or removes with `@if` may carry a class-form `animate.enter` or `animate.leave` of the consumer's on its root, and its item link stays until Angular removes the last host (ADR 0060 point 4).

### 10. Rendering modes

- **Server output and first paint:** the root's class, presence attribute, and bound `data-*` attributes; the panel's `popover` and id; the Opener's `popovertarget`; the item link (section 8). Every value is a host binding or a static host attribute (ADR 0011 clause 1). The panel is closed at first paint; `isOpen` is `false` on the server. No listener runs, no timer starts, and `injectCloseOnNavigation` subscribes to nothing, because nothing is open ([navigation-close](navigation-close.md), Rendering modes).
- **Pre-hydration state:** the panel's open state, which a person changes by clicking the Opener before hydration (ticket 18, measured: "the dropdown by `popover`"). It is never bound (the open-state ruling) and has no attribute for hydration to write back. The directive reads it once when it is created, which reports closed on the server and the user's state at hydration, and then follows `toggle` (section 4 item 7; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 91).
- **Before hydration:** the platform opens, places, and dismisses the panel; Escape and an outside press close it; Tab walks into it. Hover does nothing (Yeti's own behaviour without `hover.js`: "the attribute does nothing and the dropdown still works by click", `docs.md`). Focus-out does not close it until the app is live.
- **Event replay:** the panel's `toggle` replays; a panel opened before hydration is found open by the creation-time read, so the replayed `toggle` emits nothing; `isOpenChange` emits once at the first render only where a bound `isOpen` differs, and no `opened` emits (events rule 9; ticket 50 decision 91). The root's `focusout` replays: a `focusout` before hydration whose `relatedTarget` was outside the root closes a panel the user opened before hydration, as the live handler would have (ADR 0043's 2026-10-03 note; inferred). Angular replays `pointerdown` (`event_type.ts:335`, read here and in the dialog spec's ticket 81; ADR 0043's correcting note of 2026-10-03), so the replayed press, queued before the `focusout`, sets the guard's one-shot flag, and a press on non-focusable content before hydration leaves the panel open, as it does live (inferred; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 92). Layer 4 measures it. `pointerenter` and `pointerleave` never replay (section 4 item 4). Every handler changes state and calls no `preventDefault()` (building-blocks 1.5).
- **Full hydration:** the three elements are claimed as they are; the panel's id is adopted from the server's (ADR 0044 step 2); bindings give the same values (usage rule 10); 0 style mutations for the link (ADR 0060 point 5).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the dropdown and its link; before the trigger it behaves as before hydration, with the presence attribute holding the link (ADR 0060 point 4). `hydrate on interaction` hydrates on the first click on the Opener, which the platform has already acted on (the panel is open), and replays it to no package listener, because the Opener has none; the directive then reads the panel as open (inferred; layer 4).
- **`hydrate never`:** the residue is the platform's dropdown, as Yeti's without `hover.js`: it opens, places, closes on Escape and an outside press, and walks by Tab; it never closes on focus-out or navigation, never opens on hover, and emits nothing. It stays styled while its host is connected (ADR 0060 point 4; ADR 0045).
- **Client-only `@defer`:** the directives set up their own hosts when created (ADR 0011 clause 5), so hover, focus-out, and navigation closing work from the first interaction. The item file is fetched on construction, which can show the panel's unstyled content for a few frames; `provideYetiStyles({ preload: ['dropdown'] })` closes the gap (ADR 0060 point 6; [setup](setup.md)). The panel itself is hidden by the user agent's own `[popover]` rule before the file arrives (inferred from the HTML standard's user-agent stylesheet), so the gap shows an unstyled Opener rather than an exposed panel.
- **`withI18nSupport()`:** the Opener's label and the items are usually translated with `i18n`; the directives add no `i18n` block, and the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** `isOpen` is a signal written from the `toggle` listener, and the outputs are emitted from listeners or the completion timer; views reading them refresh with no zone (map, Standing rulings, item 43; building-blocks 1.5).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the panel opens by `popovertarget`, is placed by Yeti's CSS, closes on Escape and an outside press, and its links navigate by document loads. Lost: focus-out closing (A11Y-3a's addition), hover opening, closing on navigation (there is no Router; the new page renders the dropdown closed), `isOpen`, and the outputs. A client-only application gets no such promise.
- **Hydration boundary:** the whole dropdown (usage rule 9; building-blocks 1.11 decision 6).

### 11. Hydration constraints

The item complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class, the presence attribute, and `popover` are static host attributes; `data-side`, `data-trigger`, the id, and `popovertarget` are host bindings whose values are equal on both sides (usage rule 10; ADR 0044).
- **No direct DOM manipulation:** the only imperative calls are `showPopover()` and `hidePopover()` on the panel, from handlers, timers started in handlers, the navigation subscription, and an `afterRenderEffect` for the model (building-blocks 1.5); none runs on the server or before hydration. The open state is never bound (the open-state ruling).
- **Valid HTML:** the directives change no element; a nav's `li` host keeps its list semantics, and the panel's links and buttons stay outside the Opener.
- **`preserveWhitespaces`:** no template. Ticket 29 measured a 4 to 5 px offset of a second dropdown when Angular removes the white space between two `inline-block` roots; it is the consumer's template setting and equal on both sides.
- **No output branched on the platform:** none.
- **Static attributes the directives bind:** usage rule 5 keeps the consumer from writing them. The consumer's static `id` on the panel is read through `HostAttributeToken` and bound with the same value (ADR 0044 step 1).

### 12. Single-page application

The item uses [navigation-close](navigation-close.md): `YetiDropdown` calls `injectCloseOnNavigation(isOpen, closeForNavigation)` once at construction (ADR 0041 point 5; section 4 item 6). An open shell dropdown closes on the first `NavigationStart` after the application's initial navigation; a dropdown inside a destroyed route is closed by its removal (ticket 20, measured). Focus follows section 4 item 6. Without a Router nothing is subscribed.

A dropdown inside an open nav sheet: both the nav's and the dropdown's subscriptions run on one `NavigationStart`. Hiding the nav's list hides the nested panel with it (the platform's popover nesting), so whichever runs second finds its panel closed and does nothing; where focus ends is recorded in layer 4, which the [nav](../issues/84-spec-nav.md) spec shares (inferred).

Fragment links: none of the item's own. A `routerLink` with a `fragment` inside the panel closes it like any Router navigation; a bare `href="#id"` goes through the [fragment-links](fragment-links.md) document listener, whose spec records whether the jump closes an open shell dropdown (its layer-4 case 8). On a route change each item link is removed after its last host leaves (ADR 0060 point 4).

### 13. Item file

`yeti-css/css/components/dropdown/dropdown.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060 through `injectYetiItemStyles('dropdown')`, the last statement of `YetiDropdown`'s constructor ([setup](setup.md); ticket 50 decisions 42 and 45): acquired when the first `YetiDropdown` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:57`), and removed after the last host carrying `data-ngx-yeti-item-dropdown` has left the DOM and the live count is zero. The parts acquire nothing (ticket 50 decision 6).

Cross-item files: none acquired by the dropdown. A dropdown's Opener styled as a button acquires `button` and `spinner` through its own `yetiButton`; a dropdown in a nav relies on `nav.css`'s rules for the sheet, which the nav's own directive loads, and those rules "simply match nothing once the other part is gone" (`Y/src/guides/install.md:97`).

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class, attributes, and ids in the DOM; whether the panel is `:popover-open`; roles, names, and the expanded state in the accessibility tree; where focus is; when the outputs fire; and computed colours and sizes. It never asserts a private field, the hover flag, or the timer. No test depends on a public token's default value (ADR 0006; ADR 0015 point 3): hover cases set `--yeti-dropdown-open-delay` and `--yeti-dropdown-close-delay` explicitly on the story's root and poll for the state, as Yeti's own `dropdown.spec.js` polls (`Y/test/browser/components/dropdown.spec.js:60-64`). Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group and the package's accessibility stylesheet globally and the item files through the directives, as a consumer would (ADR 0014 point 1). Axe runs on every story, closed and open, with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `dropdown--default`: Yeti's example (an "Account" Opener with `yetiButton`, two links, one button). Asserts `class="dropdown"`, `data-ngx-yeti-item-dropdown`, `popover` on the panel, an `ngx-yeti-dropdown-<n>` id equal to the Opener's `popovertarget`, and no `aria-expanded`, `aria-haspopup`, `aria-controls`, or `role` from the package. Click opens (`:popover-open`), the tree reports the Opener expanded, `isOpen` reads `true` through the template reference; Tab from the Opener reaches "Profile", then "Settings", then "Sign out" (WebKit with Alt+Tab, as Yeti's test does); Escape closes and focus is on the Opener; a click outside closes. Asserts each item and the Opener at least 24 by 24 CSS pixels and the panel's text at least 4.5:1 on its surface, and an item's text on the sunken surface under the pointer, light and dark (ticket 50 decision 8). Asserts one `<link data-ngx-yeti-styles="dropdown">` in `<head>`.
- `dropdown--side-end`: two dropdowns in a `yetiCluster` row, the second with `side="end"`. Where anchor positioning is supported, asserts the first panel's left edge within 4 px of its Opener's and the second panel's right edge within 4 px of its Opener's, both below their Opener, after Yeti's test (`dropdown.spec.js:33-49`); where it is not, records that the user agent centres the panel.
- `dropdown--focus-out`: an open dropdown followed by a link. Tab past the last item closes the panel and focus is on the link (A11Y-3a); Shift+Tab from the first item to the Opener keeps it open; a press on the panel's padding keeps it open while focus moves to `body`; a press on an item that is a button keeps it open until the item's own action.
- `dropdown--hover`: `trigger="hover"` with both delay tokens set to known values on the root. Hovering the Opener does not open it at once, then opens it; hovering the panel keeps it open past the close delay; moving off closes it; a dropdown without `trigger` beside it does not open on hover; Enter on a parked-pointer hover dropdown opens it and a pointer sweep over and off leaves it open (`hover.js:16-19`); a click while hover has it open closes it; leaving, coming back, and pressing at once leaves it closed after both delays (`dropdown.spec.js:106-148`); Escape closes a hover-opened panel with the pointer still over it (1.4.13). The play function first asserts that the runner's `matchMedia('(hover: hover) and (pointer: fine)')` matches, as Yeti's test does.
- `dropdown--outputs`: the `opened`, `closed`, and `isOpenChange` actions in `argTypes`. Opening by click logs `isOpenChange(true)` and then `opened` once; closing by Escape logs `isOpenChange(false)` and `closed`; a focus-out close and a hover close log the same; a story arg that sets `isOpen` to `true` opens the panel and logs `opened` and no `isOpenChange` (ticket 50 decision 91).
- `dropdown--consumer-id`: a panel with `id="row-actions"`. Asserts `popovertarget="row-actions"` and no generated id.
- `dropdown--in-nav`: Yeti's nav example with `li[yetiDropdown]` holding a plain `button[yetiDropdownToggle]`, in a container wide enough for the bar and in one narrow enough for the sheet. Asserts the dropdown's panel is a card under its Opener in the bar, the nav's sheet styles apply in the sheet, and Escape in an open dropdown inside the open sheet closes the dropdown first and leaves the sheet open (ADR 0016 consequences). The [nav](../issues/84-spec-nav.md) spec owns the nav's own cases.
- `dropdown--narrow`: a 320 px wide viewport with one dropdown at the inline start and one at the inline end with `side="end"`. Asserts both open panels are inside the viewport (1.4.10); records the inline-end Opener with `side` unset (A11Y-27; ticket 50 decision 157).
- `dropdown--rtl`: `dropdown--side-end` inside `dir="rtl"`. Asserts `side="start"` lines the panel up with the Opener's right edge, where anchoring is supported.

### Layer 2: browser-level (`npx nx test <lib>`, `dropdown.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note) for the root alone, and a small test host for the composed cases, which need content (ADR 0014's note):

- `createDirective(YetiDropdown, { tagName: 'div' })`: the host has class `dropdown` and `data-ngx-yeti-item-dropdown`, and no `data-side` or `data-trigger`; with `bindings` setting `side` and `trigger`, the attributes follow after `whenStable()`, and `undefined` removes them. One `<link data-ngx-yeti-styles="dropdown">` is in `document.head` while the fixture lives, and it is gone an animation frame after `fixture.destroy()`.
- A test host with the three directives: the panel has `popover` and an `ngx-yeti-dropdown-<n>` id equal to the Opener's `popovertarget`; a static `id` wins; neither part carries a presence attribute; a part outside a root throws Angular's DI error.
- `isOpen` follows `showPopover()`, `hidePopover()`, and a dispatched click on the Opener, and `isOpenChange` emits once per change; a panel already open when the directive is created sets `isOpen` with no `opened`; on such a panel a bound `isOpen` of `false` is set to `true` at the first render with one `isOpenChange(true)`; a parent write opens or closes the panel with no `isOpenChange` and with `opened` or `closed` (ticket 50 decision 91).
- Completion: `opened` fires after a `transitionend` whose target is the panel, not after one bubbling from an item; with the transition removed by an inline zero duration it fires on the next task; `closed` fires at once after a close; a close during the opening wait completes it at once, so `opened` precedes `closed` (ticket 50 decisions 91 and 153).
- Focus-out: a `focusout` with a `relatedTarget` outside the root closes the open panel; one inside does not; a `null` `relatedTarget` after a `pointerdown` inside the root does not, and consumes the flag, so a second `null` one closes; a flag left unconsumed is cleared by the zero-delay timer (fake timers); a `null` one with no press closes (ticket 50 decision 92). Each handler is also driven with an event whose `preventDefault` throws, and the state still changes (building-blocks 1.12, replay-safe handlers).
- Hover, with the timer under Vitest's fake timers and `matchMedia` stubbed: no hover while `trigger` is unset or `click`, or while the query does not match; `pointerenter` opens after the open delay read from the root's computed style, with `100ms`, `.1s`, and an absent token (0) each parsed correctly (Y2); `pointerleave` closes after the close delay only a panel hover opened; `pointerdown` cancels a pending open; changing `trigger` to `click` cancels a pending timer; destroying the fixture cancels it.
- Navigation: under `provideRouter` with `provideLocationMocks()`, an open panel closes on a navigation after the initial one, and not during the initial one ([navigation-close](navigation-close.md)'s point 4); focus inside the panel before the navigation ends on the Opener (section 4 item 6).
- No `CustomEvent` is dispatched on the host or the document (events rule 5).

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `dropdown.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and section 8's markup, whose labels carry `i18n`, plus a second dropdown with `side="end"`, `trigger="hover"`, and a static panel `id` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the root renders `class="dropdown"`, the presence attribute, and the bound `data-*` attributes; the panel renders `popover=""` and its id, generated `ngx-yeti-dropdown-0` and the consumer's `row-actions`; each Opener's `popovertarget` equals its panel's id; no `aria-expanded` is rendered; `jsaction` on the root names `focusout` and `pointerdown` and on the panel names `toggle`, and nothing names `pointerenter`, `pointerleave`, or `transitionend`; the root's creation-time read of `:popover-open` runs on the server's DOM without an error and reports closed, so the server's `isOpen` is `false` (ticket 50 decision 91); `<head>` holds one `dropdown` link with `data-beasties-skip` and an `href` ending `components/dropdown/dropdown.css?v=<pin>`; no `close` callback runs.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `dropdown` has `YetiDropdown`; `data-side` and `data-trigger` have inputs whose unions equal the vocabularies `side` and `trigger`; the item has no markers and no events.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids: real Tab, Shift+Tab, Enter, Space, and Escape on `dropdown--default` and `dropdown--focus-out` in three engines, including the inside press, where WebKit does not focus a clicked button (ADR 0043 consequences; A11Y-3a "Tested by"); after Escape, where focus is in each engine after a keyboard open and after a click open (ADR 0016 consequences); the window losing focus with the panel open, recorded; real pointer moves on `dropdown--hover`; on `dropdown--default` under `emulateMedia({ reducedMotion: 'reduce' })`, `opened` fires with no measurable wait; under `emulateMedia({ forcedColors: 'active' })`, the open panel's computed border and a screenshot, recorded, and the focus ring present (ticket 50 decision 158); `dropdown--narrow` at 320 px in three engines.

Fixture-app half, built with `outputMode: 'server'`, with a `/dropdown` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route renders section 8's markup in a shell with a `routerLink` in the panel, a hover dropdown, a dropdown inside `@defer (hydrate on interaction)`, and one inside `@defer (hydrate never)`:

- hydration logs no `NG05xx`, `componentsSkippedHydration === 0`, and the panels' ids and the Openers' `popovertarget` are unchanged by hydration;
- with JavaScript disabled: a click opens the panel, Tab walks its items, Escape and an outside press close it, a link navigates by a document load; `@axe-core/playwright` with the six tags reports no violation with the panel open;
- with `main.js` held back: the panel opened before hydration is still open after hydration, and `isOpen` reads `true` with no `opened` emitted; then a press on the panel's padding before hydration, followed by hydration, asserts that the panel stays open, because the replayed `pointerdown` sets the guard's flag (ADR 0043's correcting note; ticket 50 decision 92); then Tab past the last item before hydration records whether the replayed `focusout` closes it;
- a `routerLink` in the open shell panel closes it on navigation with focus on the Opener (A11Y-15, after [navigation-close](navigation-close.md)'s case); Back with the panel open closes it;
- the `hydrate on interaction` dropdown opens on its first click and is read as open after its block hydrates;
- the `hydrate never` dropdown opens and closes natively, does not close on focus-out or navigation, and keeps its link after every live dropdown leaves the page (ADR 0045);
- a client-only `@defer` dropdown with `dropdown` in the preload list shows no unstyled frame;
- navigating to a route without a dropdown removes the link, and back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and `docs.md` for the stories, and `test/browser/components/dropdown.spec.js` with its fixture `test/browser/fixtures/components/dropdown.html` for the open, outside-press, anchoring, Tab, and hover cases; [ticket 29](../issues/29-prototype-aria-for-the-native-pattern-items.md)'s variant A (`prototypes/aria-nav-dropdown/`), which sketched this row's directives and measured them in all rendering modes; [ticket 20](../issues/20-prototype-yeti-in-single-page-apps.md)'s shell popover for navigation; ticket 18's fixture app for replay; the [navigation-close](navigation-close.md) and [button](button.md) specs.

## Out of Scope

- Menu roles, roving focus, arrow keys, typeahead, and Aria `Menu`, `MenuBar`, or `Tree` (ADR 0019; "Aria decisions" row 32/34). An application command menu is a new item, not a mode of this one (ADR 0019 consequences).
- Submenus inside a dropdown: Yeti has one level, a dropdown inside a nav (`Y/src/guides/migrating.md:62`; ADR 0019 point 4).
- A positioner, a measured placement, CDK Overlay, or a package `@supports` check (building-blocks 1.2, 1.8).
- A close reason output, as Material's `MenuCloseReason` (ADR 0016 consequences leave it to the spec; nothing in the records asks for one).
- `interestfor` and `popover="hint"`, outside the target (building-blocks 1.2).
- The nav's own toggle, list, focus-out, and sheet (the [nav](../issues/84-spec-nav.md) spec).
- The Opener's button look (the [button](button.md) spec).
- A defaults token for the hover delays: they are Yeti's tokens (ADR 0004; building-blocks 1.4).
- Checks that a dropdown has one Opener and one panel, that the Opener has `type="button"` or a name, or that the panel holds no menu roles: a later milestone (map, Milestones); the usage rules state them.

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Three directives: `YetiDropdown` (root), `YetiDropdownToggle` (Opener), `YetiDropdownPanel` | building-blocks Part 2 row 32; 1.3 |
| Disclosure navigation, no menu roles, no Aria or CDK menu | ADR 0019; "Aria decisions" row 32/34 (the user's "Custom disclosure nav (Recommended)"); tickets 29 and 32 |
| Opening, light dismiss, Escape, the expanded state, and the top layer are the platform's `popover` | ADR 0016 point 1; ADR 0003 point 5; ADR 0011 clause 2 |
| `popover` and `popovertarget` rendered by the directives with a generated id; the consumer's id wins | ADR 0003 point 5; ADR 0013; ADR 0044; ticket 50 decision 5 |
| Focus-out closing by a root `focusout` host listener with a `pointerdown` guard | ADR 0016 point 2; ADR 0043 point 1; A11Y-3a |
| `hover.js` replaced by `trigger="hover"` with per-instance `pointerenter` and `pointerleave`, delays from tokens parsed with their unit | ADR 0040; building-blocks 1.8; Part 2 row 32; ADR 0011 clause 6; Y1, Y2 |
| Closing on navigation through `injectCloseOnNavigation` | ADR 0041; [navigation-close](navigation-close.md) |
| Focus to the Opener after a navigation close when focus was in the panel | ADR 0041 point 4; ticket 50 decision 155 |
| `isOpen` model, read once from the element at creation and following `toggle`, never bound; later parent writes are commands | the open-state ruling; building-blocks 1.4; Part 2 row 32; ticket 50 decision 91 |
| `opened` and `closed`, `void`, after the transition | events spec rules 3 and 7; ticket 50 decision 3 |
| No methods; no key listener; no defaults token | Part 2 row 32; APG (optional keys); building-blocks 1.4; ticket 50 decision 91 |
| No injection of `yetiNavToken` | building-blocks 1.9; ticket 50 decision 156 |
| Inputs `side: YetiSide`, `trigger: YetiTrigger`; unset renders nothing; `data-trigger` rendered | ADR 0005; ADR 0070 rules 1 and 2; ticket 26 rows 115, 116, points 4 and 5 |
| Only the root marks its host and acquires the item file, last in its constructor | ADR 0045; ticket 50 decisions 6, 42, and 45 |
| Native platform, level 1 | building-blocks 1.2; Part 2 row 32 |
| Tokens are the consumer's | ADR 0004 |
| Directive tests through `TestBed.createDirective`; fixture app with prerendered and server routes | map, Standing rulings, Directive testing; ADR 0014 note; ticket 50 decision 2 |

### Usage examples

A row of actions with a dropdown at its end:

```html
<div yetiCluster gap="sm" justify="end">
  <button yetiButton type="button" (click)="edit()" i18n>Edit</button>
  <div yetiDropdown side="end" #more="yetiDropdown" (closed)="onMenuClosed()">
    <button yetiButton yetiDropdownToggle type="button" emphasis="low" i18n>More</button>
    <div yetiDropdownPanel>
      <a [routerLink]="['/items', id(), 'duplicate']" i18n>Duplicate</a>
      <button type="button" (click)="archive()" i18n>Archive</button>
    </div>
  </div>
</div>
```

```ts
import { YetiButton } from 'ngx-yeti/button';
import { YetiCluster } from 'ngx-yeti/cluster';
import { YetiDropdown, YetiDropdownPanel, YetiDropdownToggle } from 'ngx-yeti/dropdown';

@Component({
  selector: 'app-item-actions',
  imports: [RouterLink, YetiButton, YetiCluster, YetiDropdown, YetiDropdownPanel, YetiDropdownToggle],
  templateUrl: './item-actions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemActions {
  readonly id = input.required<string>();
}
```

A site menu that also opens on hover, with a faster open on this one dropdown set in the consumer's stylesheet (`.products { --yeti-dropdown-open-delay: 50ms; }`, an **Application class**):

```html
<div yetiDropdown trigger="hover" class="products">
  <button yetiButton yetiDropdownToggle type="button" emphasis="low" i18n>Products</button>
  <div yetiDropdownPanel>
    <a routerLink="/products" i18n>Overview</a>
    <a routerLink="/pricing" i18n>Pricing</a>
  </div>
</div>
```

Inside a nav item, after Yeti's nav example: `<li yetiDropdown><button yetiDropdownToggle type="button" i18n>More</button><div yetiDropdownPanel>...</div></li>`. Reading the state: `@if (more.isOpen()) { ... }`, or `[(isOpen)]="menuOpen"` with a signal. A page whose dropdowns render inside a client-only `@defer` block preloads the file: `provideYetiStyles({ preload: ['dropdown'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/dropdown/dropdown.css`, loaded by `YetiDropdown` as a counted link (section 13). The consumer writes nothing for the item beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** the tokens (the surfaces, radius, spacing, control size, shadow, durations and their reduced-motion values, the two delays) and the base focus ring. The user agent's own `[popover]:not(:popover-open)` rule hides the closed panel, not Yeti's.
3. **Cross-item rules:** `nav.css` restyles a dropdown inside an open nav sheet (`nav.css:175-215`) and its Opener as a nav item (`nav.css:71`, `:84`, `:110`); `button.css` styles an Opener that carries `yetiButton`. Each item loads its own file.
4. **Tokens:** reads the manifest's public tokens; the directive reads the two delays through computed style; writes none (section 2).
5. **What breaks without the item file:** the closed panel is still hidden and still opens, because `popover` is the platform's, but it opens with the user agent's popover look (centred, bordered, no shadow), and its items lose their row layout and hover surface; with no error.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) found only `container`, `grid`, and `table` (and the attribute name `hidden`) among Yeti's class names producing a utility (measured); `dropdown` produced none.

### Platform features to adopt when the browser target moves

- **`interestfor`:** the stated end of `hover.js` (`hover.js:11-13`; `docs.md:40`). When it is in the target, `trigger="hover"` maps to `interestfor` on the Opener and the hover listeners, the timer, and the hover flag are deleted (ADR 0040 consequences; building-blocks 1.2). Not in Baseline 2025 today.
- **Anchor positioning** is already used through Yeti's `@supports` guard; when the target covers it, the user agent's centring fallback stops mattering and nothing changes in the package (building-blocks 1.2).
- **A focus-out light dismiss in the platform**, if one is ever standardised for `popover`, would replace the `focusout` listener and its guard (inferred; no proposal was checked for this spec).

### Single-page-application pieces relied on

[navigation-close](navigation-close.md) (`injectCloseOnNavigation`), [generated-ids](generated-ids.md) (`injectYetiId`), [events](events.md) (the output rules), [setup](setup.md) (`injectYetiItemStyles`, `provideYetiStyles`, and `provideYetiFragmentLinks()` for bare fragment links in the panel), and [fragment-links](fragment-links.md) for those links.
