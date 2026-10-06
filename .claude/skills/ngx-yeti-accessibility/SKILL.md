---
name: ngx-yeti-accessibility
description: 'This skill should be used when an ngx-yeti spec''s accessibility criteria, ledger rows, or WCAG 2.2 AA requirements are implemented or tested: "assert the contrast", "non-text contrast", "axe says incomplete", "close the ledger row", "forced colours", "target size", "focus ring", "keyboard support", "add an accessibility CSS rule", "axe in e2e", "a11y", "contrast ratio", "forced-colors", "prefers-reduced-motion". Covers how WCAG 2.2 AA is enforced (story gate, play-function assertions, layer 4), the contrast helper and thresholds, where a fix goes (directive or the ngx-yeti accessibility stylesheet), and what stays a manual release test.'
---

# WCAG 2.2 AA in ngx-yeti

WCAG 2.2 AA is a requirement of every spec, never a recommendation (ADR 0015 point 1, `docs/specs/adr/0015-wcag-2-2-aa-enforcement-over-yeti.md`). Each spec has a criteria subsection naming the criteria its item touches, and each gap the package closes that Yeti leaves open is a row in `docs/specs/ledger.md`. A spec is not done until each of its ledger rows is closed by the test its Testing Decisions name.

## Where each criterion is checked

| Check                                                                                                          | Layer  | Tool                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| Everything axe checks, on every story                                                                          | 1      | The story gate (`ngx-yeti-stories` skill)                                                                              |
| Contrast axe leaves incomplete, non-text contrast (1.4.11), contrast in the dark scheme                        | 1      | Play-function assertion with the contrast helper                                                                       |
| Content the directive cannot read (an alert's text names its kind, a progress bar shows its value as text)     | 1      | Play-function assertion in every story that shows it (ADR 0015 point 4)                                                |
| Hover-only states, `forced-colors`, `prefers-reduced-motion`, 320 px reflow, 200 % zoom, text spacing (1.4.12) | 4      | Playwright `emulateMedia`, viewport, injected styles                                                                   |
| The JavaScript-disabled page and states no play function reaches                                               | 4      | `expectNoAxeViolations(page)` from `apps/ngx-yeti-e2e/src/axe.ts`, or the fixture app's axe helper, both on `wcagTags` |
| Screen-reader announcements and other assistive-technology behaviour                                           | Manual | A manual release test in the spec (ADR 0015 point 7)                                                                   |

Layer 2 runs no axe (ADR 0014 point 2).

## Contrast assertions

`@ngx-yeti/testing` exports the exact WCAG 2.x formula, unrounded: `parseColor`, `composite`, `relativeLuminance`, and `contrastRatio(foreground, background)`. They parse what browsers return from `getComputedStyle` (`rgb()`, `oklch()`, `oklab()`, `color(srgb ...)`, hex), so pass computed strings straight in. Yeti's colours compute to `oklch()`.

```ts
import { contrastRatio } from '@ngx-yeti/testing';

const { color, backgroundColor } = getComputedStyle(badge);
await expect(contrastRatio(color, backgroundColor)).toBeGreaterThanOrEqual(4.5);
```

- Thresholds: 4.5:1 for every text at any size, in the light and the dark scheme, unless a record says otherwise (ticket 50 decision 8). 3:1 for a visual state, a glyph, a focus ring, or another non-text part (1.4.11; decision 94).
- A translucent foreground is composited over the opaque background for you. A translucent scrim behind text is checked against both extremes: `composite(scrim, '#000')` and `composite(scrim, '#fff')` as the background, each at least 4.5:1 (decision 55).
- Read the background from the element that paints it, which may be an ancestor or the Yeti page surface. For the dark scheme, render the story with `withColorScheme('dark')`.
- Assert the criterion's ratio, never a token's value: a pin move that breaks the ratio has found a real regression (ADR 0006 point 7).
- Out-of-gamut colours are clipped per channel before the formula; browsers that gamut-map may paint a slightly different colour. A ratio within a hundredth of a threshold deserves a second look.
- Disabled and busy buttons are exempt from text contrast (WCAG 1.4.3 exception; `docs/specs/specs/button.md`).

## Where a fix goes

- Behaviour Yeti gets wrong (Escape, focus-out closing, focus return, ARIA attributes, keyboard handling): the directive binds it (ADR 0015 point 5). Key handlers compare `event.key` (with `hasModifierKey` from `@angular/cdk/keycodes`), change state first, and call `preventDefault()` last, because `preventDefault()` throws during event replay (building-blocks 1.11). Never call `event.composedPath()` in a handler; it throws during replay too. Test both with `replayShapedEvent` from `@ngx-yeti/testing`.
- Text whose Yeti default fails 4.5:1: the owning spec adds a package rule under the ledger row's A11Y-10a pattern (ticket 50 decision 8).
- Two states drawn by colour that fail 3:1 (a toggle, a current page link): no package CSS. The pair moves to an anti-pattern story with a ledger row owned by the item, and a usage rule steers consumers away from it (ticket 50 decision 94).
- Other CSS Yeti gets wrong (for example no `forced-colors` rules): one small rule in the package's `ngx-yeti/accessibility.css`, inside `@layer ngx-yeti`, selecting Yeti's state hooks (`aria-pressed`, `:checked`, `aria-selected`, `aria-current`, `[required]`), with no `--_yeti-*` token and no selector naming a package class (ADR 0015's 2026-10-02 note; setup spec). Add the rule inside the existing `@layer ngx-yeti` block of `packages/ngx-yeti/accessibility.css`, which both global stylesheets already import (`ngx-yeti-specs` skill, one-time tasks). Prove the rule draws the fix: the layer-4 comparison differs with the stylesheet and not without it.
- Target size (2.5.8): `wcag22aa` turns on axe's `target-size` rule; specs that name it also assert at least 24 by 24 CSS pixels from `getBoundingClientRect()`.

## Known limits

- `emulateMedia({ forcedColors: 'active' })` matches the query in WebKit too, but WebKit forces no colours, so a WebKit contrast measured under it checks the page's own palette (a departure from `docs/specs/specs/tooltip.md`, ticket 17; the `ngx-yeti-specs` skill's departures table has the row).
- Safari on macOS skips links on Tab unless Option+Tab (Playwright's `Alt+Tab`) is used or "Press Tab to highlight each item" is on; WebKitGTK and WPE on Linux, and so CI's Playwright WebKit, tab to links (a departure from `docs/specs/research/yeti-accessibility-and-standards.md`, same table).
- Playwright's Windows WebKit is a test build only, and reaches links by neither Tab nor Alt+Tab; don't design around it.
- A test that must run everywhere focuses links from script.
- Axe found 0 violations on Yeti's 49 docs examples in three engines and both schemes, so a gate failure almost always points at the package's own markup or bindings.
