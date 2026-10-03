---
status: accepted
---

# `nav` and `dropdown` are disclosure navigation, not Aria menus

Adapted from ADR 0004 (`menus-use-disclosure-navigation`) of `.scratch/next-foundation-specs/`, by [Decide: which ADRs carry over](../issues/08-decide-inherited-adrs.md), once [Decide: the spec list](../issues/11-decide-spec-list.md) kept `nav` and `dropdown`. That record bound nothing here.

The old record chose the APG's disclosure navigation pattern over `@angular/aria/menu` and `@angular/aria/tree` for every Foundation menu, because the APG warns against menu and tree roles for site navigation, and the Angular Aria guide says the same of `ngMenu`. Yeti already made that choice in its own markup: the dropdown is "a button and a panel of ordinary links and buttons ... No menu roles: a disclosure panel of links reads better than a half-built application menu" (`src/components/dropdown/dropdown.css:1-4`), and the nav's panel is a `popover` list with a nested `popovertarget` button for its one sub-level (`src/components/nav/example.html:3-8`), read at `f52d1e8b9`.

The user's standing ruling 37 asks the package to "utilize Angular Aria and CDK where possible to replace Yeti's JavaScript modules and comply with accessibility standards and best practices". For site navigation the best practice is the disclosure pattern, so Aria's menu and tree are not a fit here, and this record says so in advance so a spec does not reach for them.

We decided:

1. `yetiNav` and `yetiDropdown` keep Yeti's disclosure markup: native lists and links, a `<button>` with `popovertarget` per panel, no `menu`, `menubar`, `menuitem`, or `tree` role, and no roving tab stop.
2. The panel's open state, Escape, and outside-press closing are the platform's `popover`; the package adds closing on focus-out ([ADR 0016](0016-light-dismiss-is-the-platforms-plus-focus-out-and-tooltip-escape.md)) and closing on navigation (the navigation-close shared spec of ticket 11).
3. The current page is `aria-current` on its link, as Yeti's nav, breadcrumbs, pagination, and toc examples already write it.
4. The old record's Nested menu directive family, its mode signal, and its `is-<mode>-submenu*` classes are abandoned: Yeti has one sub-level, no menu modes, and no classes per mode, and its nav folds behind its toggle at its container's threshold in CSS.

## Considered options

- **Aria `ngMenuBar` and `ngMenu` for the dropdown, Aria `ngTree` for the nav.** Rejected for the APG's reason, which the old record verified against `@angular/aria` 22.2 (no item is a tab stop in server HTML; Aria's menu cancels Enter on a link item), and because it would replace Yeti's semantics, which the map's Implementation order note forbids.
- **Optional arrow-key movement between top-level buttons**, which the APG example allows. Left to the `nav` spec; it adds no role.

## Consequences

- The `nav` and `dropdown` specs name their APG pattern as Disclosure Navigation Menu and list their keyboard table from it.
- A spec that wants application-menu behaviour (a command menu, not navigation) is a new item, not a mode of these two.
