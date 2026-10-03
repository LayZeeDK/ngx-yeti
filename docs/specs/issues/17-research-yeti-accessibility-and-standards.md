# 17. Research: Yeti against WHATWG, WAI-ARIA, the APG, and Angular Aria, CDK, and Material patterns

Type: research
Status: resolved
Blocked by: 02, 03
Labels: wayfinder:research
Map: ../map.md

## Question

For each of Yeti's 49 items, does its documented markup and behaviour conform to the WHATWG HTML standard, WAI-ARIA, and the matching WAI-ARIA APG pattern, and meet WCAG 2.2 AA? Where Yeti falls short or leaves a choice open, which patterns or accessibility techniques should the package adopt from `@angular/aria`, `@angular/cdk`, or Angular Material?

## User instruction, 2026-10-01

The user's own message to the orchestrator, verbatim:

> 22. We should also evaluate Yeti for compatibility with WHATWG, WAI-ARIA, ARIA APG, and component patterns/accessibility techniques to adopt from Angular Aria/CDK/Material.

## How to work it

Use a `/research` subagent with these local sources:

- `github.com/foundation/yeti` at `f52d1e8b9` (manifest accessibility notes, `src/`, `docs/`);
- `github.com/w3c/aria-practices` and `github.com/w3c/aria`;
- `github.com/angular/components` at `22.2.x` (`src/aria`, `src/cdk`, `src/material`);
- the WHATWG HTML standard online.

Run axe with the WCAG 2.2 AA rule set over each item's docs example in Chromium, Firefox, and WebKit, and record the engines' accessibility trees for the interactive items. Then, per item, record:

- the APG pattern and the deviations, citing the pattern's file;
- HTML conformance;
- the axe result;
- keyboard and focus behaviour;
- the Angular Aria, CDK, or Material building block that would supply what is missing, with its `file:line`.

Mark what was measured and what was read. Write `research/yeti-accessibility-and-standards.md`, and append an `## Answer`. Decide nothing.

## Answer

Resolved 2026-10-01 by Claude Opus 5.5. Findings: [research/yeti-accessibility-and-standards.md](../research/yeti-accessibility-and-standards.md).

- **Measured:** axe-core 4.13.0 with the WCAG 2.2 AA tags found 0 violations on all 49 docs examples in Chromium, Firefox, and WebKit, in light and dark schemes. The Nu Html Checker found no errors on any page. Every Tab stop had a 2px focus ring, at 5.31:1 (light) and 7.54:1 (dark) contrast.
- **Conforms as measured:** the 16 layouts other than scroller, the 3 recipes, the 7 utilities, and badge, seam, affix, breadcrumbs, button, card, table, spinner, progress, toc, pagination. Accordion, alert, field, tabs, dialog, dropdown, nav, and scroller match their APG patterns' required keyboard behaviour. Exceptions are listed below.
- **Deviations by item:** tooltip cannot be dismissed with Escape (measured in all 3 engines; Yeti says so itself). Dropdown and nav panels stay open when focus leaves (measured for dropdown). Carousel has no previous/next buttons, no slide `group`/`aria-roledescription="slide"`, and no current-slide marker (read and measured). The demo grip has no `aria-controls` and no Enter collapse. The vertical tabs example has no `aria-orientation` (read). In Chromium and WebKit, the native modal dialog's Tab passes through the browser's own UI instead of wrapping (measured). The field's required `*` ends up in the accessible name ("Email *", Chromium engine tree).
- **Forced colours (measured, not a WCAG AA criterion):** Yeti has no `forced-colors` rules. Under forced colours you can't see pressed or checked toggles, the selected tab, checkbox, radio, switch, and range state, the native progress bar, or the current page in pagination.
- **Other measured notes:** at 320 px, `center` overflows the page width by 2 px. Reduced motion collapses every animation measured. axe left `color-contrast` incomplete for timeline, layer, breakout, media, and lede, so their contrast still needs a manual check.
- **Building blocks that would supply what is missing:** the CDK `high-contrast` mixin and Material's per-control rules (forced colours); Material tooltip's Escape handling plus `AriaDescriber`; `FocusMonitor` (close on focus-out); Aria `ngTabList` (`aria-orientation`, manual activation) with a `hidden` binding; Aria `ngToolbar` (toggle groups); `FocusKeyManager`, `Directionality`, and `LiveAnnouncer` for a carousel, since none ships one; Material `matInput` and form-field `aria-invalid`/`aria-describedby` bindings; `_IdGenerator`; `FocusTrap` if strict APG wrapping is wanted in the dialog.
- **Not measured:** Firefox's and WebKit's own accessibility trees (Playwright has no API for them; their snapshots are Playwright's role and name computation), real screen readers, `data-trigger="hover"`, and the other docs variants beyond `example.html`.

Note, 2026-10-01 (audit 0002, M2): the focus-ring contrast (5.31:1 light, 7.54:1 dark) was measured on one control; ring presence was checked at every Tab stop. axe left `color-contrast` incomplete on five items (timeline, layer, breakout, media, lede), which need a manual check. The dialog Tab reading ("passes through the browser's own UI") is inferred, because headless `activeElement` became `body`.
