# Research: Angular 22's browser baseline against what Yeti expects

Ticket: [01](../issues/01-research-browser-baseline-vs-yeti.md). Date: 2026-10-01. Model: Claude Opus 5.5. Decides nothing; [Decide: the browser target](../issues/06-decide-browser-target.md) chooses.

Source: `github.com/foundation/yeti` at `develop`, `f52d1e8b9` (committer date 2026-09-25), exported with `git archive f52d1e8b9 src README.md` into `D:/tmp/ngx-yeti-01/yeti/`. The clone was not touched. Paths below are relative to the Yeti repository root. "Checked" means measured by a script or tool in this session. "Inferred" means reasoned from the CSS, the JS, or the specifications, and not run in a browser. Nothing here was run in a browser.

## 1. Findings in brief

| Measure | Value | Status |
| --- | --- | --- |
| Files scanned | 69 CSS, 10 JS (all of them under `src/`), plus 50 `example.html` files as a supplementary markup scan | Checked |
| Construct uses recorded | 13,591 | Checked |
| web-features ids matched | 219 (179 from CSS and JS, 40 only from the HTML examples) | Checked |
| Used in CSS or JS and outside Angular 22's set | **33** | Checked |
| ... of which inside Yeti's own set (Baseline newly available by 2025-12-31) | 19 | Checked |
| ... of which outside both sets | 14 | Checked |
| Outside Angular's set, guarded on every use | 4: `anchor-positioning`, `field-sizing`, `interpolate-size`, `scroll-driven-animations` | Checked |
| Outside Angular's set, guarded on some uses | 2: `has` (12 of 82 uses), `popover` (19 of 148 uses) | Checked |
| Outside Angular's set, no guard on any use | 27 | Checked |
| Only in the HTML examples and outside Angular's set | 1: `details-name` (the accordion's exclusive mode) | Checked |

All 19 features that sit in Yeti's set but outside Angular's are unguarded, or only partly guarded. That matches Yeti's rule ("Anything that reached Baseline by the end of 2025 is used without guards", `README.md:32`). The 4 fully guarded features are all outside both sets, which also matches the rule. The rule is broken only by 10 features that web-features marks Baseline `false` and Yeti uses unguarded (section 5.3); all 10 are cosmetic (inferred).

The browser versions each set implies (checked, section 3):

| Set | Chrome | Chrome Android | Edge | Firefox | Firefox Android | Safari | Safari iOS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Angular 22: widely available on 2026-05-07 | 119 | 119 | 119 | 119 | 119 | 17 | 17 |
| Yeti: Baseline 2025 | 141 | 141 | 141 | 145 | 145 | 26.2 | 26.2 |

The features that break components in a browser that is in Angular's set but not in Yeti's (inferred, section 6): `light-dark()` takes out every colour role and the base focus ring; invoker commands leave the dialog with no way to open; `popover` breaks dropdown and nav in Firefox 119 to 124; `:has()` breaks tooltip, field errors (CSS and `validate.js`), the shell, hero, and media recipes, nav's bar mode, and pagination in Firefox 119 and 120; `pow()` takes out the xs, xl, 2xl, 3xl, and display text and space tokens in Chrome and Edge 119; alt text on generated content drops breadcrumb separators and toc numbering; `<details name>` loses the accordion's one-at-a-time mode.

## 2. Method

### 2.1 Tools, pinned

Installed with `npm i --save-exact` under `D:/tmp/ngx-yeti-01/` (checked from each `package.json`):

| Package | Version | Role |
| --- | --- | --- |
| `web-features` | 3.40.1 | Feature ids, Baseline status, dates, per-key status (`status.by_compat_key`), browser releases |
| `@mdn/browser-compat-data` | 8.1.4 | The set of BCD keys, to test whether a generated key exists |
| `postcss` | 8.5.28 | CSS parser |
| `postcss-value-parser` | 4.2.0 | Declaration values: words, functions, units, dividers |
| `postcss-selector-parser` | 7.1.6 | Selectors: pseudo-classes and pseudo-elements, attributes, combinators, nesting |
| `acorn` / `acorn-walk` | 8.18.0 / 8.3.5 | JavaScript parser and walker (`ecmaVersion: 'latest'`, module) |
| `parse5` | 8.0.1 | HTML parser for the example files |
| `baseline-browser-mapping` | 2.11.26 | Cross-check of the implied browser versions |

### 2.2 Scripts

All under `D:/tmp/ngx-yeti-01/`. Run in this order to reproduce: `node scan.mjs`, `node gen-confirm.mjs`, `node report.mjs`, then `node bbm.mjs` for the browser cross-check.

| Script | What it does | Output |
| --- | --- | --- |
| `scan.mjs` | Parses every CSS, JS, and HTML file under `yeti/src/`, generates BCD keys for each construct, and maps each key to its web-features id through the features' `compat_features` lists | `uses.json` (one row per use), `unmatched.json` (generated keys absent from BCD) |
| `gen-confirm.mjs` | Writes `js-confirm.json`: JS uses that the scanner could match only by member name, confirmed by reading the ten modules, each with its BCD key and guard | `js-confirm.json` |
| `report.mjs` | Groups uses by web-features id, takes the strictest status among the keys Yeti actually uses, sets the two set flags, counts guarded and unguarded uses, computes the implied browser versions | `report.json`, `report.md` (the table in section 7), `candidates.txt`, `summary.json` |
| `bbm.mjs` | Asks `baseline-browser-mapping` for the versions of both sets | console |
| `has-rules.mjs` | Lists every rule whose selector uses `:has()` outside a forgiving `:is()` or `:where()` | console |
| `manifests.mjs` | Collects `support.unguarded` and `support.guarded` from all 49 manifests | console |
| `keys.mjs`, `status.mjs` | Look up BCD keys by pattern; print a key's web-features id and per-key status | console |

### 2.3 What each construct maps to

- **At-rules:** `css.at-rules.<name>`; `@media` features (`css.at-rules.media.<feature>`, with `min-` and `max-` stripped) and range syntax; `@container` style and scroll-state queries; `@supports selector()`; `@import layer()` and `supports()`. Descriptors inside `@property` and other at-rules: `css.at-rules.<at>.<descriptor>`.
- **Properties:** `css.properties.<prop>`, vendor prefix stripped; custom properties and `var()` to `css.properties.custom-property`.
- **Values:** each keyword as `css.properties.<prop>.<keyword>` when BCD has that key; global keywords; 4- and 8-digit hex colours; functions by name under `css.types.*` and `css.properties.<prop>.<fn>`; relative colour syntax when a colour function's first word is `from`; `content: x / y` to `css.properties.content.alt_text`; units (with aliases for `fr`, `s`, `ms`, `px`, the `sv*`/`dv*`/`lv*` viewport units, and the `cq*` units); `transition` of `display` or `content-visibility` with `allow-discrete` to `css.properties.transition-behavior.transitionable_<prop>`.
- **Selectors:** every pseudo-class and pseudo-element (`css.selectors.<name>`, prefixed form first), `:not()` with a list, `:nth-child(of S)`, attribute selectors (and the attribute name as an HTML attribute key), `&` and nested style rules, combinators, type, class, id, universal.
- **JavaScript:** syntax nodes (optional chaining, `??`, logical assignment, class fields, private names, arrow functions, template literals, destructuring, spread, `for...of`, `import`/`export`, `const`/`let`, async, top-level `await`, regex flags); unbound globals (`api.<Name>`, `api.Window.<name>`, `javascript.builtins.<Name>`); static members of a global (`CSS.supports`); string selectors passed to `querySelector`, `querySelectorAll`, `matches`, and `closest`, parsed as selectors; attribute names passed to the `*Attribute` methods; event names passed to `addEventListener`.
- **HTML (supplementary):** each element (`html.elements.<tag>`) and attribute (`html.elements.<tag>.<attr>`, `html.global_attributes.<attr>`, and value subkeys such as `input.type_range`).

### 2.4 Guards

- **CSS `@supports`:** every ancestor `@supports` rule, recorded with its condition. `@supports not (...)` blocks count as guarded too: they are the fallback branch.
- **CSS cascade fallback:** an earlier declaration of the same property in the same block. None fired on an out-of-baseline feature.
- **Forgiving selector lists:** a `:has()` inside `:is()` or `:where()` is recorded as guarded. A browser without `:has()` drops that branch and keeps the rest of the rule (inferred from the forgiving selector list rules in Selectors Level 4; not run in a browser).
- **JS:** an ancestor `if`, `?:`, or `&&` whose test uses `in`, `typeof`, or `CSS.supports`; an earlier `if (...) return` with such a test in an enclosing block; `try`; an optional call (`x.f?.()`). One guard was confirmed by reading because it is indirect: `hover.js` returns `null` from `partsOf()` unless `panel?.showPopover` exists (`src/components/dropdown/hover.js:28`), and each caller returns early on `null`.
- **What each `@supports` tests** is recorded separately and is not counted as a use (22 tests; `report.json` key `supportsTests`).

### 2.5 Status and set membership

The status of a feature is the strictest status among the BCD keys Yeti actually uses, read from web-features' `status.by_compat_key`. Where that differs from the feature-level status, the table shows both. Two cases matter:

- `popover`: the keys Yeti uses (`html.global_attributes.popover`, `:popover-open`, `showPopover()`, `hidePopover()`, `popovertarget`, `popovertargetaction`, the popover `toggle` event, `ToggleEvent.newState`) are newly available 2024-04-16, with Firefox 125 the last. The feature-level date, 2025-01-27, comes from `api.HTMLElement.popover` on Safari iOS 18.3, which Yeti does not use. Checked.
- `anchor-positioning`: the keys Yeti uses are `low` with a low date of 2026-09-14; the feature as a whole is `false`. Checked.

Angular's set: Baseline `high` with a high date on or before 2026-05-07. Yeti's set: Baseline `low` or `high` with a low date on or before 2025-12-31.

### 2.6 Coverage of the scan

Checked:

- 0 CSS files failed to parse; 0 selectors failed to parse; 0 JS files failed to parse.
- 4 generated keys have no BCD entry, all WebKit pseudo-elements with no key in BCD 8.1.4: `::-webkit-details-marker`, `::-webkit-search-decoration`, `::-webkit-file-upload-button`, `::-webkit-outer-spin-button` (`unmatched.json`).
- 31 BCD keys used by Yeti belong to no web-features id, for example `html.global_attributes.class`, `css.properties.inline-size.auto`, the `-webkit-`/`-moz-` range and progress pseudo-elements, and `css.properties.transition.allow-discrete`. The last one was mapped by hand to `transition-behavior` (`report.mjs`, `HAND`); the rest are long-standing (`report.json` key `noFeature`).
- 381 JS member accesses can be matched only by name. The scanner lists every one whose candidate features include one outside Angular's set (180 lines, `candidates.txt`). I read all ten modules and confirmed 43 uses with their real BCD key (`gen-confirm.mjs`); the rest of the 180 are name collisions with no bearing (for example `.target` matched `touch-events`, `.get` matched `cookie-store`).

## 3. Browser versions each set implies

Checked with `report.mjs` (the highest version any feature in the set needs, per core browser) and cross-checked with `baseline-browser-mapping` 2.11.26 (`bbm.mjs`); both give the same answer.

| Set | Rule | Chrome | Chrome Android | Edge | Firefox | Firefox Android | Safari | Safari iOS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Angular 22 | widely available on 2026-05-07 | 119 | 119 | 119 | 119 | 119 | 17 | 17 |
| Yeti | Baseline 2025 (newly available by 2025-12-31) | 141 | 141 | 141 | 145 | 145 | 26.2 | 26.2 |

Angular's row matches the ticket's core table and the supported-browsers page it links. A second way of reading Angular's date, the latest release on or before 2023-11-07 (the date minus 30 months), gives the same versions except Safari 17.1 rather than 17 (checked from web-features' `browsers` release dates). For Yeti, the latest releases on 2025-12-31 were Chrome and Edge 143, Firefox 146, and Safari 26.2 (checked); the set itself needs only 141, 145, and 26.2.

The gap is about two years of releases: Chrome 119 shipped 2023-10-31; Safari 26.2 is the newest version Yeti's set needs.

## 4. The features the user named

Checked.

| Feature | web-features id | In Angular's set | In Yeti's set | Yeti's use |
| --- | --- | --- | --- | --- |
| Container queries | `container-queries` (high, 2025-08-14) | yes | yes | 177 uses, unguarded, which is correct for both sets |
| Container style queries | `container-style-queries` | - | - | not used (0 `style(` queries) |
| `popover` | `popover` (low, 2024-04-16 for the keys used) | no | yes | 148 uses in dropdown and nav; 19 guarded (`hover.js`, and the anchor-positioned panel rules) |
| `<dialog>` | `dialog` (high, 2024-09-14) | yes | yes | `dialog.js`, `dialog.css`; but it is opened only by invoker commands (`invoker-commands`, low 2025-12-12), outside Angular's set |
| Anchor positioning | `anchor-positioning` (false) | no | no | 49 uses, all inside `@supports` (dropdown, nav, tooltip) |
| Cascade layers | `cascade-layers` (high, 2024-09-14) | yes | yes | 71 uses |
| Native nesting | `nesting` | - | - | not used: 0 nested style rules and 0 `&` in 69 files. The nested blocks are `@layer`, `@media`, `@container`, and `@supports` |
| `light-dark()` | `light-dark` (low, 2024-05-13) | no | yes | 47 uses: 45 in `src/tokens/color.css` and 2 in `surface.css`, unguarded (count corrected by audit 0001, M3) |
| Scroll snap | `scroll-snap` (high, 2024-10-05) | yes | yes | 9 uses (carousel, scroller) |

## 5. Features outside Angular's set

Uses count CSS and JS only. "Lacking in Angular's set" names the core browsers at or above the Angular floor that do not support the keys Yeti uses, read from the per-key support versions.

### 5.1 In Yeti's set, outside Angular's (19, plus one from the HTML examples)

| web-features id | Status, low, high | Lacking in Angular's set | Uses (guarded) | Guard and fallback | Where (checked) |
| --- | --- | --- | --- | --- | --- |
| `light-dark` | low, 2024-05-13, - | Chrome/Edge 119-122, Firefox 119, Safari 17.0-17.4 | 45 (0) | None. No cascade fallback | `src/tokens/color.css:48-102`, `src/tokens/surface.css:14,24` |
| `invoker-commands` | low, 2025-12-12, - | every core browser in the set: Chrome/Edge to 134, Firefox to 143, Safari to 26.1 | 4 JS (0), plus the `commandfor`/`command` markup | None. `dialog.js` listens for the `command` event and never calls `showModal()` | `src/components/dialog/dialog.js:28,30,34` |
| `popover` | low, 2024-04-16, - (feature: 2025-01-27) | Firefox 119-124 | 148 (19) | `hover.js` checks `panel?.showPopover` (`hover.js:28`) and does nothing without it; 11 CSS uses sit inside the anchor-positioning `@supports`. The rest of the CSS has no guard | `src/components/dropdown/dropdown.css:7-58`, `src/components/nav/nav.css:38-278`, `src/components/dropdown/hover.js:26-91` |
| `has` | high, 2023-12-19, 2026-06-19 | Firefox 119-120 | 82 (12) | 12 uses inside a forgiving `:is()` (button pressed and disabled states, `button.css:74-106`); the other 70 have none | 14 components, layouts, recipes, utilities (section 6.4); also `src/components/field/validate.js:38` |
| `exp-functions` (`pow()`) | high, 2023-12-07, 2026-06-07 | Chrome/Edge 119 | 13 (0) | None | `src/tokens/scale.css:23-48` |
| `alt-text-generated-content` | low, 2024-07-09, - | Firefox 119-127, Safari 17.0-17.3 | 3 (0) | None | `src/components/breadcrumbs/breadcrumbs.css:22`, `src/components/toc/toc.css:76`, `src/base/media.css:55` |
| `masks` | high, 2023-12-07, 2026-06-07 | Chrome/Edge 119 (unprefixed) | 10 (0) | None; no `-webkit-mask-*` anywhere in `src/` (checked with `rg`) | `src/components/seam/seam.css:35-60` |
| `lh` | high, 2023-11-21, 2026-05-21 | Firefox 119 | 4 (0) | None | `src/base/controls.css:20`, `src/components/alert/alert.css:34,49`, `src/components/field/field.css:37` |
| `dir-pseudo` | high, 2023-12-07, 2026-06-07 | Chrome/Edge 119 | 5 (0) | None | `src/components/progress/progress.css:64`, `src/utilities/enter/enter.css:40,42` |
| `text-wrap` | high, 2024-03-05, 2026-09-05 | Firefox 119-120, Safari 17.0-17.3 | 4 (0) | None | `src/base/typography.css:30,40`, `src/components/nav/nav.css:27`, `src/utilities/lede/lede.css:17` |
| `text-wrap-balance` | low, 2024-05-13, - | Firefox 119-120, Safari 17.0-17.4 | 2 (0) | None | `src/base/typography.css:30`, `src/components/nav/nav.css:27` |
| `details-content` | low, 2025-09-16, - | Chrome/Edge 119-130, Firefox 119-142, Safari 17.0-18.3 | 2 (0) | None | `src/base/media.css:120`, `src/components/demo/demo.css:119` |
| `starting-style` | low, 2024-08-06, - | Firefox 119-128, Safari 17.0-17.4 | 3 (0) | None | `src/components/dialog/dialog.css:38`, `src/components/dropdown/dropdown.css:57`, `src/components/nav/nav.css:224` |
| `transition-behavior` | low, 2024-08-06, - | Firefox 119-128, Safari 17.0-17.3 | 3 (0) | None (key mapped by hand, section 2.6) | `src/base/media.css:122`, `src/components/dialog/dialog.css:34` |
| `registered-custom-properties` (`@property`) | low, 2024-07-09, - | Firefox 119-127 | 24 (0) | None needed: the same tokens are also set on `:root` (`src/tokens/color.css:25-31`, checked), so `@property` only protects against bad overrides | `src/tokens/color.css:11-16` |
| `relative-color` | low, 2024-09-16, - | Chrome/Edge 119-121, Firefox 119-127, Safari 17 | 66 (0) | None | `src/tokens/tone.css:36-121`. No Yeti CSS outside `tone.css` reads a hued tone (checked with `rg`, 0 matches) |
| `scrollbar-width` | low, 2024-12-11, - | Chrome/Edge 119-120, Safari 17.0-18.1 | 2 (0) | None | `src/components/carousel/carousel.css:22` |
| `print-color-adjust` | low, 2025-05-01, - | Chrome/Edge 119-135 | 2 (0) | None | `src/layouts/attributes.css:456` |
| `view-transitions` | low, 2025-10-14, - | Firefox 119-143, Safari 17 | 2 (0) | None; it only re-times a transition the site must opt into (`src/base/transitions.css:4-12`, read) | `src/base/transitions.css:38` |
| `details-name` (HTML examples only) | low, 2024-09-03, - | Chrome/Edge 119, Firefox 119-129, Safari 17.0-17.1 | 0 in CSS and JS | None; Yeti adds no script for it | `src/components/accordion/example.html` |

### 5.2 Outside both sets, guarded (4)

Checked: every use sits inside `@supports`.

| web-features id | Status | Guard | Fallback (from the component manifest, read) |
| --- | --- | --- | --- |
| `anchor-positioning` | false (keys used: low, 2026-09-14) | `@supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: ...)` at `src/components/dropdown/dropdown.css:46`, `src/components/nav/nav.css:135,201`, `src/components/tooltip/tooltip.css:64` | dropdown: "the panel is centred by the user agent"; nav: "the sheet starts at the top of the viewport, and a submenu in the open panel docks to the foot of it"; tooltip: "the bubble and its caret are placed above the trigger with absolute positioning" |
| `scroll-driven-animations` | false | `@supports (animation-timeline: scroll())` and `@supports not (...)` at `src/components/progress/progress.css:65,71`; `@supports (animation-timeline: view())` at `src/utilities/enter/enter.css:85` | progress hides the scroll bar; enter shows content without the animation |
| `field-sizing` | low, 2026-06-16 | `@supports (field-sizing: content)` at `src/base/reset.css:53` | textarea keeps its fixed height |
| `interpolate-size` | false | `@supports (interpolate-size: allow-keywords)` at `src/base/reset.css:90` | no height animation to `auto` |

A fifth guard, `@supports (grid-template-rows: masonry)` at `src/layouts/masonry/masonry.css:29`, tests a value that has no BCD key in 8.1.4 (checked: no key contains `masonry`). web-features maps native masonry to `grid-lanes` through `display: grid-lanes`, which Yeti does not test. The masonry manifest says the same: "add a display: grid-lanes guard when its companion properties settle". The multi-column fallback works everywhere (inferred). Not confirmed: whether any shipping browser passes the `grid-template-rows: masonry` test.

### 5.3 Outside both sets, unguarded (10)

These break Yeti's own rule in letter. Each is Baseline `false` in web-features because one core browser lacks it, often a mobile one. All are cosmetic (inferred).

| web-features id | Missing core browser (per-key support) | Uses | Where |
| --- | --- | --- | --- |
| `accent-color` | Chrome Android; Safari until 26.2 | 1 | `src/base/typography.css:14` |
| `cursor` | Safari iOS | 24 | base and 7 components |
| `display-animation` (transition of `display` / `content-visibility`) | Firefox | 2 | `src/base/media.css:122`, `src/components/dialog/dialog.css:34` |
| `focus-events` (`focus({ preventScroll })`) | Chrome Android, Firefox Android | 2 JS | `src/components/dialog/dialog.js:46`, `src/components/alert/alert.js:27` |
| `overscroll-behavior` | Safari | 4 | `src/components/carousel/carousel.css:17`, `src/layouts/scroller/scroller.css:8` |
| `resize` | Firefox Android, Safari iOS | 5 | `src/base/controls.css:21`, `src/components/demo/demo.css` |
| `selection` (`::selection`) | Safari iOS | 1 | `src/base/typography.css:106` |
| `text-size-adjust` | Firefox, Safari | 4 | `src/base/reset.css:18-19` |
| `text-wrap-pretty` | Firefox | 2 | `src/base/typography.css:40`, `src/utilities/lede/lede.css:17` |
| `user-select` | Safari (unprefixed) | 4 | `src/components/button/button.css:30`, `src/components/demo/demo.css:221` |

## 6. What each unguarded feature breaks in Angular's browsers

All of this section is inferred from the CSS, the JS, and the specifications, and none of it was run in a browser. "Breaks" means a component loses a function or an accessibility property; "degrades" means it loses polish only. The browser ranges are those in section 5.1.

### 6.1 Breaks

1. **`light-dark()`: every component, and focus visibility.** Each colour role token is one `light-dark()` value with no fallback (`src/tokens/color.css:48-102`). A custom property holding an unsupported function is invalid at computed-value time wherever it is read, so every `color`, `background-color`, and `border-color` that reads a role falls back to its inherited or initial value. A shorthand that reads one fails whole: the base focus ring is `outline: 2px solid var(--yeti-color-focus)` (`src/base/typography.css:102`), and `--yeti-color-focus` is `var(--yeti-color-primary)`, a `light-dark()` value (`src/tokens/color.css:107`). So every outline longhand is reset and the ring is not drawn. That is a WCAG 2.4.7 failure, in Chrome/Edge 119-122, Firefox 119, and Safari 17.0-17.4.
2. **Invoker commands: dialog.** The only documented way to open the dialog is a button with `commandfor` and `command="show-modal"` (`dialog.js:1-3`, read). Every core browser in Angular's set lacks it, so the button does nothing and `dialog.js`'s `command` listener never fires. A wrapper would have to call `showModal()` itself.
3. **`popover`: dropdown and nav, Firefox 119-124.** Without the attribute, a panel is not in the top layer and is not hidden by the user agent, and every `:popover-open` rule is dropped. So the dropdown panel and the nav sheet render in flow, and the toggle button does nothing. `hover.js` stays inert, which is correct. Chrome 119 and Safari 17 have the parts Yeti uses.
4. **`:has()`: Firefox 119-120.** A selector list that holds an unknown pseudo-class outside `:is()`/`:where()` is dropped whole (checked with `has-rules.mjs`, 60 rules):
   - tooltip: `.tooltip:hover > [role="tooltip"], .tooltip:has(:focus-visible) > [role="tooltip"]` (`src/components/tooltip/tooltip.css:56`) is one list, so the bubble never shows on hover or on focus.
   - field: the error slot never shows (`field.css:188`), the invalid border is lost (`:189`), and so is the required asterisk (`:193`). `validate.js` calls `closest('.field:has(> [data-error])')` (`validate.js:38`), which throws a `SyntaxError`. The submit is already cancelled (`:57`), so the form does not submit, the first control gets `aria-invalid`, and no message, focus move, or `yeti:invalid` event follows.
   - shell recipe: the whole row layout (`src/recipes/shell/shell.css:20-39`); hero and media recipes: image framing, captions, and side order (`hero.css:31-79`, `media.css:21-73`).
   - nav: the bar mode above each threshold (`nav.css:241-278`), on top of the `popover` gap.
   - pagination: the responsive collapse (`pagination.css:43-63`); every page link shows.
   - button: the focus ring for a toggle's hidden input (`button.css:123`), another WCAG 2.4.7 failure. Pressed and disabled states survive, because those `:has()` uses are inside `:is()`.
   - lift: the hover lift (`lift.css:23,43`, one list with `:hover`).
   - Smaller: card and breakout lose `container-type` (`card.css:23`, `breakout.css:18`), demo its grip styling, toc smooth scrolling (`toc.css:9`).
5. **`pow()`: Chrome/Edge 119.** `pow()` builds steps -2 and 2 to 5 (`src/tokens/scale.css:23-48`), which feed `--yeti-text-xs`, `-xl`, `-2xl`, `-3xl`, `-display` and `--yeti-space-xs`, `-xl`, `-2xl`, `-3xl` and their static and max forms (`src/tokens/type.css:4-11`, `src/tokens/space.css:7-29`, checked with `rg`). Those become invalid at computed-value time: headings and display text take the inherited size, and gaps and margins that read them fall to their initial values. 21 CSS files read one of them (checked). Steps -1, 0, and 1 (sm, md, lg) and the radii do not use `pow()`.
6. **Alt text on generated content: breadcrumbs and toc, Firefox 119-127 and Safari 17.0-17.3.** `content: <x> / ""` is invalid there, so the declaration is dropped: no breadcrumb separator (`breadcrumbs.css:22`), no section numbers in `.toc[data-numbered]` (`toc.css:76`), no dash before a blockquote's caption (`media.css:55`).
7. **`<details name>`: accordion's exclusive mode, Chrome/Edge 119, Firefox 119-129, Safari 17.0-17.1.** Every panel can stay open. HTML only; Yeti adds no script by design.

### 6.2 Degrades only

- `masks` (Chrome/Edge 119): seam's curve and wave edges render square.
- `lh` (Firefox 119): textarea minimum height, alert icon and close-button alignment.
- `dir-pseudo` (Chrome/Edge 119): the RTL variants of progress and enter run in the LTR direction.
- `starting-style`, `transition-behavior`, `display-animation`: dialog, dropdown, and nav open and close with no fade. The dialog's `transition` shorthand holds `allow-discrete`, so in Firefox 119-128 and Safari 17.0-17.3 the whole declaration is dropped, including its opacity and translate parts.
- `details-content`: the accordion panel opens and shuts at once (the accordion manifest states the same).
- `text-wrap`, `text-wrap-balance`, `text-wrap-pretty`, `scrollbar-width`, `print-color-adjust`, `view-transitions`, and the 10 features in section 5.3: polish only.
- `registered-custom-properties`: no loss, because the tokens are also set on `:root`.
- `relative-color`: no loss inside Yeti, because no Yeti rule reads a hued tone. A consumer's own classes that read `--yeti-color-<hue>-<n>` lose their colour.

### 6.3 Components by breaking feature

| Component | Breaking features, and where in Angular's set |
| --- | --- |
| every component (colour, focus ring) | `light-dark` |
| dialog | `invoker-commands` (all), `light-dark` |
| dropdown | `popover` (Firefox 119-124) |
| nav | `popover` (Firefox 119-124), `has` (Firefox 119-120) |
| tooltip | `has` (Firefox 119-120) |
| field (CSS and `validate.js`) | `has` (Firefox 119-120) |
| pagination, button (toggle focus ring), lift | `has` (Firefox 119-120) |
| shell, hero, media recipes | `has` (Firefox 119-120) |
| breadcrumbs, toc | `alt-text-generated-content` (Firefox 119-127, Safari 17.0-17.3) |
| accordion | `details-name` (exclusive mode only) |
| every component reading xs/xl/2xl/3xl/display text or space | `exp-functions` (Chrome/Edge 119) |

### 6.4 Yeti's manifests against the scan

Checked with `manifests.mjs`. The manifests' `support.unguarded` lists agree with the scan for each component that has one, but leave out features that live in shared files: no manifest names `light-dark()`, `pow()`, relative colour, or `@property` (all in `src/tokens/`), and the `:has()` uses in button, card, nav, demo, and breakout are not declared in those manifests (field, pagination, toc, tooltip, hero, media, shell, and lift do declare `:has()`). So a reading that starts from the manifests misses the token-level features, which are the ones with the widest reach.

## 7. Where this differs from the earlier reading-based pass

The earlier pass is `.scratch/next-foundation-specs/research/yeti-foundation-7.md` section 3 (the brief called it section 2; the browser tables are in 3.2 and 3.3). Checked against this scan:

- **`:has()` in button:** the earlier pass said "In Firefox 119 a selector list containing `:has()` is dropped whole" for `button.css:74-106`. Those 12 uses are inside a forgiving `:is()`, so the pressed and disabled states survive through their `aria-pressed` and `:disabled` branches. The unguarded `:has()` that matter are elsewhere (section 6.1, item 4).
- **`:has()` in JS:** the earlier pass did not list `validate.js:38`, which throws in Firefox 119-120.
- **Tooltip:** the earlier pass listed tooltip under `:has()` states. The scan shows the tooltip's only show rule is one list with `:has()`, so the bubble never shows at all.
- **`pow()`:** the earlier pass said every `--yeti-text-*`, `--yeti-space-*`, and `--yeti-radius-*` derives from it. Measured: only the xs, xl, 2xl, 3xl, and display steps do. sm, md, lg, and the radii do not.
- **`popover` dates:** the earlier pass gave 2025-01-27 and a Safari iOS 18.3 gap. That date belongs to `HTMLElement.popover`, which Yeti does not use. The keys Yeti uses date from 2024-04-16, and only Firefox 119-124 lacks them.
- **`light-dark()` and focus:** the earlier pass said colours fall back. It did not note that the base focus ring is an `outline` shorthand reading a `light-dark()` token, so the ring disappears (inferred).
- **Features the earlier pass did not list:** `text-wrap` (the property itself is widely available only on 2026-09-05), `print-color-adjust`, `display-animation`, `focus-events`, `cursor`, `selection`, and `text-size-adjust`.
- **The earlier pass's `content-visibility` row** is here `display-animation` plus `transition-behavior`: Yeti transitions `content-visibility` but never declares it, so the keys used are the transition ones.
- **Masonry:** the earlier pass listed the masonry guard as `grid-lanes` (Safari 26.4). The guard tests `grid-template-rows: masonry`, which BCD 8.1.4 has no key for (section 5.2).
- **Count:** the earlier pass had 20 unguarded rows, some of them merged. This scan has 27 features with no guard on any use, plus 2 partly guarded, out of 33 outside Angular's set.
- **Agreements:** invoker commands, `light-dark()`, relative colour unread by Yeti, `@property` safe by construction, `details name`, alt text, `lh`, `:dir()`, unprefixed masks, `@starting-style`, `scrollbar-width`, the four guarded features, no native nesting, no style or scroll-state queries.

## 8. Unknowns and not done

- Nothing was run in a browser. Every "breaks" and "degrades" in section 6 is inferred. A browser check would need Chrome 119, Firefox 119, and Safari 17 builds; none was used.
- The JS name-only matches were confirmed by reading, not by type analysis. 43 uses are confirmed in `js-confirm.json`. In-baseline APIs beyond those 43 are not all listed in the table, which matters only for completeness, not for the out-of-baseline answer: every line in `candidates.txt` was read.
- SVG elements and attributes in the HTML examples (`svg`, `path`, `viewBox`, `stroke-*`) were not mapped: the scan loads BCD's `css`, `api`, `html`, and `javascript` trees, not `svg`.
- Value keywords are mapped only where BCD has `css.properties.<prop>.<keyword>`. Context subfeatures such as `align-content` in block layout (`align-content-block`, low 2024-04-16) are not detected by the script. I checked that one by reading: all three `align-content` uses are on flex or grid containers (`src/recipes/hero/hero.css:8`, `src/recipes/shell/shell.css:23`, `src/base/media.css:116`), so it does not apply.
- `display: grid` on `<details>` (`src/base/media.css:107`) has no BCD key. Not confirmed: whether Chrome 119, Firefox 119, and Safari 17 honour it; I found no source in BCD 8.1.4 or web-features 3.40.1.
- `grid-template-rows: masonry` has no BCD key (section 5.2). Not confirmed which browsers pass the test.
- The Markdown docs, guides, and `docs/` were not scanned; the ticket asks for CSS and JS under `src/`.
- web-features' `false` status for the section 5.3 features comes from BCD data for one browser each. Not checked against the browsers themselves.

## 9. Full feature table

Generated by `report.mjs` into `D:/tmp/ngx-yeti-01/report.md` and copied here unchanged. One row per web-features id. "Baseline (keys used)", "Low", "High", and "Core support" are for the keys Yeti uses, with the feature-level value in parentheses where it differs. "Uses (guarded)" counts CSS and JS uses only. "HTML only" rows come from the `example.html` scan. Files and lines for every use are in `report.json` (`rows[].files`, `rows[].unguardedAt`). Sorted: outside Angular's set first, then by high date. The Guard and Components cells are cut at 160 and 200 characters; the full lists are in `report.json`.

| web-features id | Baseline (keys used) | Low | High | Angular 22 | Yeti 2025 | Core support (keys used) | Uses (guarded) | Guard | Components |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `lh` | high | 2023-11-21 | 2026-05-21 | no | yes | C109 E109 F120 S16.4 iOS16.4 | 4 (0) | - | base, component:alert, component:field |
| `dir-pseudo` | high | 2023-12-07 | 2026-06-07 | no | yes | C120 E120 F49 S16.4 iOS16.4 | 5 (0) | - | component:progress, utility:enter |
| `exp-functions` | high | 2023-12-07 | 2026-06-07 | no | yes | C120 E120 F118 S15.4 iOS15.4 | 13 (0) | - | tokens |
| `masks` | high | 2023-12-07 | 2026-06-07 | no | yes | C120 E120 F53 S15.4 iOS15.4 | 10 (0) | - | component:seam |
| `has` | high | 2023-12-19 | 2026-06-19 | no | yes | C105 E105 F121 S15.4 iOS15.4 | 82 (12) | inside forgiving :is() | component:button, component:buttons, component:card, component:demo, component:field, component:nav, component:pagination, component:toc, component:tooltip, layout:breakout, recipe:hero, recipe:media, |
| `text-wrap` | high (feature: low) | 2024-03-05 (feature: 2024-10-17) | 2026-09-05 (feature: -) | no | yes | C114 E114 F121 S17.4 iOS17.4 | 4 (0) | - | base, component:nav, utility:lede |
| `accent-color` | false | - | - | no | no | C93 E93 F92 S26.2 iOS26.2 | 1 (0) | - | base |
| `alt-text-generated-content` | low | 2024-07-09 | - | no | yes | C77 E79 F128 S17.4 iOS17.4 | 3 (0) | - | base, component:breadcrumbs, component:toc |
| `anchor-positioning` | low (feature: false) | 2026-09-14 (feature: -) | - | no | no | C151 E151 F151 S27 iOS27 | 49 (49) | @supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: block-end); @supports (anchor-name: --a) and (anchor-scope:  | component:dropdown, component:nav, component:tooltip |
| `cursor` | false | - | - | no | no | C1 E12 F1.5 S3 iOS- | 24 (0) | - | base, component:alert, component:button, component:demo, component:dropdown, component:field, component:nav, component:tabs |
| `details-content` | low | 2025-09-16 | - | no | yes | C131 E131 F143 S18.4 iOS18.4 | 2 (0) | - | base, component:demo |
| `details-name` | low | 2024-09-03 | - | no | yes | C120 E120 F130 S17.2 iOS17.2 | 0 (0) | - | HTML only: component:accordion |
| `display-animation` | false | - | - | no | no | C117 E117 F- S18 iOS18 | 2 (0) | - | base, component:dialog |
| `field-sizing` | low | 2026-06-16 | - | no | no | C123 E123 F152 S26.2 iOS26.2 | 2 (2) | @supports (field-sizing: content) | base |
| `focus-events` | false (feature: high) | - (feature: 2015-07-29) | - (feature: 2018-01-29) | no | no | C64 E17 F68 S15 iOS15.5 | 2 (0) | - | component:alert, component:dialog |
| `interpolate-size` | false | - | - | no | no | C129 E129 F- S- iOS- | 2 (2) | @supports (interpolate-size: allow-keywords) | base |
| `invoker-commands` | low | 2025-12-12 | - | no | yes | C135 E135 F144 S26.2 iOS26.2 | 4 (0) | - | component:dialog |
| `light-dark` | low | 2024-05-13 | - | no | yes | C123 E123 F120 S17.5 iOS17.5 | 45 (0) | - | tokens |
| `overscroll-behavior` | false | - | - | no | no | C144 E18 F150 S- iOS- | 4 (0) | - | component:carousel, layout:scroller |
| `popover` | low | 2024-04-16 (feature: 2025-01-27) | - | no | yes | C114 E114 F125 S17 iOS17 | 148 (19) | @supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: block-end); feature check: partsOf() returns null unless pan | component:dropdown, component:nav |
| `print-color-adjust` | low | 2025-05-01 | - | no | yes | C136 E136 F97 S15.4 iOS15.4 | 2 (0) | - | layout:attributes.css |
| `registered-custom-properties` | low | 2024-07-09 | - | no | yes | C85 E85 F128 S16.4 iOS16.4 | 24 (0) | - | tokens |
| `relative-color` | low | 2024-09-16 | - | no | yes | C122 E122 F128 S18 iOS18 | 66 (0) | - | tokens |
| `resize` | false | - | - | no | no | C1 E79 F4 S3 iOS- | 5 (0) | - | base, component:demo |
| `scroll-driven-animations` | false | - | - | no | no | C115 E115 F- S26 iOS26 | 5 (5) | @supports (animation-timeline: scroll()); @supports (animation-timeline: view()) | component:progress, utility:enter |
| `scrollbar-width` | low | 2024-12-11 | - | no | yes | C121 E121 F64 S18.2 iOS18.2 | 2 (0) | - | component:carousel |
| `selection` | false | - | - | no | no | C1 E12 F62 S1.1 iOS- | 1 (0) | - | base |
| `starting-style` | low | 2024-08-06 | - | no | yes | C117 E117 F129 S17.5 iOS17.5 | 3 (0) | - | component:dialog, component:dropdown, component:nav |
| `text-size-adjust` | false | - | - | no | no | C54 E79 F- S- iOS- | 4 (0) | - | base |
| `text-wrap-balance` | low | 2024-05-13 | - | no | yes | C114 E114 F121 S17.5 iOS17.5 | 2 (0) | - | base, component:nav |
| `text-wrap-pretty` | false | - | - | no | no | C117 E117 F- S26 iOS26 | 2 (0) | - | base, utility:lede |
| `transition-behavior` | low | 2024-08-06 | - | no | yes | C117 E117 F129 S17.4 iOS17.4 | 3 (0) | - | base, component:dialog |
| `user-select` | false | - | - | no | no | C54 E79 F69 S- iOS- | 4 (0) | - | component:button, component:demo |
| `view-transitions` | low | 2025-10-14 | - | no | yes | C109 E109 F144 S18 iOS18 | 2 (0) | - | base |
| `a` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 0 (0) | - | HTML only: component:breadcrumbs, component:card, component:carousel, component:dropdown, component:nav, component:pagination, component:toc, layout:cluster, layout:container, layout:cover, layout:ico |
| `absolute-positioning` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 19 (0) | - | base, component:button, component:card, component:demo, component:nav, component:tooltip, layout:overlay, layout:stack, layout:timeline, utility:visually-hidden |
| `article` | high | 2015-07-29 | 2018-01-29 | yes | yes | C5 E12 F4 S5 iOS4.2 | 0 (0) | - | HTML only: component:card, component:carousel, layout:breakout, layout:scroller, layout:sidebar, starter, utility:lede, utility:lift |
| `aside` | high | 2015-07-29 | 2018-01-29 | yes | yes | C5 E12 F4 S5 iOS4.2 | 0 (0) | - | HTML only: recipe:shell |
| `attr-contents` | high | 2015-07-29 | 2018-01-29 | yes | yes | C2 E12 F1 S3.1 iOS2 | 1 (0) | - | component:demo |
| `background` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 9 (0) | - | component:demo, component:field |
| `background-color` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 129 (0) | - | base, component:accordion, component:affix, component:alert, component:badge, component:button, component:card, component:carousel, component:demo, component:dialog, component:dropdown, component:fiel |
| `background-image` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 4 (0) | - | component:field, component:progress |
| `background-repeat` | high | 2015-07-29 (feature: 2016-09-20) | 2018-01-29 (feature: 2019-03-20) | yes | yes | C1 E12 F1 S1 iOS1 | 4 (0) | - | component:field |
| `background-size` | high | 2015-07-29 | 2018-01-29 | yes | yes | C3 E12 F4 S5 iOS4.2 | 2 (0) | - | component:field |
| `before-after` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1.5 S4 iOS3.2 | 45 (7) | @supports (animation-timeline: scroll()); @supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: block-start) | base, component:breadcrumbs, component:card, component:carousel, component:demo, component:field, component:progress, component:seam, component:spinner, component:toc, component:tooltip, layout:stack, |
| `blockquote` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S<=4 iOS<=3.2 | 0 (0) | - | HTML only: starter |
| `body` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 0 (0) | - | HTML only: recipe:shell, starter |
| `border-radius` | high | 2015-07-29 | 2018-01-29 | yes | yes | C4 E12 F4 S5 iOS4.2 | 42 (0) | - | base, component:accordion, component:affix, component:alert, component:badge, component:button, component:card, component:carousel, component:demo, component:dialog, component:dropdown, component:fiel |
| `borders` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 79 (0) | - | base, component:accordion, component:affix, component:alert, component:badge, component:button, component:card, component:demo, component:dialog, component:dropdown, component:field, component:nav, co |
| `box-shadow` | high | 2015-07-29 | 2018-01-29 | yes | yes | C10 E12 F4 S5.1 iOS5 | 23 (0) | - | component:card, component:dialog, component:dropdown, component:field, component:nav, component:table, utility:lift |
| `box-sizing` | high | 2015-07-29 | 2018-01-29 | yes | yes | C10 E12 F29 S5.1 iOS6 | 6 (0) | - | base, component:demo, layout:center |
| `button` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S<=4 iOS<=3.2 | 0 (0) | - | HTML only: component:affix, component:alert, component:button, component:buttons, component:dialog, component:dropdown, component:nav, component:tabs, component:tooltip, layout:icon, starter, utility: |
| `calc` | high | 2015-07-29 | 2018-01-29 | yes | yes | C26 E12 F16 S7 iOS7 | 204 (3) | @supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: block-start) | component:affix, component:alert, component:badge, component:button, component:buttons, component:card, component:carousel, component:demo, component:dropdown, component:field, component:progress, com |
| `ch` | high | 2015-07-29 | 2018-01-29 | yes | yes | C27 E12 F1 S7 iOS7 | 5 (0) | - | component:toc, tokens |
| `code` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S<=4 iOS<=3.2 | 0 (0) | - | HTML only: component:demo, starter |
| `color` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 114 (0) | - | base, component:affix, component:alert, component:badge, component:breadcrumbs, component:button, component:card, component:demo, component:dialog, component:dropdown, component:field, component:nav,  |
| `constraint-validation` | high | 2015-07-29 (feature: 2018-12-11) | 2018-01-29 (feature: 2021-06-11) | yes | yes | C5 E12 F4 S5 iOS4 | 2 (0) | - | component:field |
| `content` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 24 (0) | - | base, component:breadcrumbs, component:card, component:carousel, component:demo, component:field, component:progress, component:seam, component:spinner, component:toc, component:tooltip, layout:stack, |
| `counters` | high | 2015-07-29 | 2018-01-29 | yes | yes | C2 E12 F1.5 S3 iOS1 | 3 (0) | - | component:toc |
| `css-object-model` | high | 2015-07-29 (feature: 2015-09-30) | 2018-01-29 (feature: 2018-03-30) | yes | yes | C1 E12 F1 S6 iOS6 | 1 (0) | - | component:field |
| `cubic-bezier-easing` | high | 2015-07-29 | 2018-01-29 | yes | yes | C16 E12 F4 S6 iOS6 | 1 (0) | - | tokens |
| `dataset` | high | 2015-07-29 | 2018-01-29 | yes | yes | C7 E12 F6 S5.1 iOS5 | 1 (0) | - | component:demo |
| `display` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 155 (3) | @supports not (animation-timeline: scroll()); @supports (grid-template-rows: masonry) | base, component:affix, component:alert, component:badge, component:breadcrumbs, component:button, component:buttons, component:card, component:carousel, component:demo, component:dialog, component:dro |
| `div` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 0 (0) | - | HTML only: component:accordion, component:affix, component:alert, component:button, component:buttons, component:carousel, component:demo, component:dropdown, component:field, component:nav, component |
| `em-unit` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 46 (0) | - | base, component:alert, component:badge, component:button, component:field, component:nav, component:spinner, layout:icon, layout:timeline, tokens |
| `events` | high | 2015-07-29 | 2018-01-29 | yes | yes | C5 E12 F6 S5 iOS5 | 8 (0) | - | component:alert, component:carousel, component:dialog, component:field, component:tabs, component:toc |
| `fieldset` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S<=4 iOS<=3.2 | 0 (0) | - | HTML only: component:buttons, component:field |
| `figure` | high | 2015-07-29 | 2018-01-29 | yes | yes | C8 E12 F4 S5.1 iOS5 | 0 (0) | - | HTML only: component:demo, layout:layer, starter |
| `fixed-positioning` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 7 (3) | @supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: block-end); @supports (anchor-name: --a) and (anchor-scope:  | base, component:dropdown, component:nav, component:tooltip, layout:overlay |
| `font-face` | high | 2015-07-29 (feature: 2016-09-20) | 2018-01-29 (feature: 2019-03-20) | yes | yes | C1 E12 F1 S1 iOS1 | 7 (0) | - | component:seam, tokens |
| `font-family` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 4 (0) | - | base, component:demo |
| `font-shorthand` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 8 (0) | - | base, component:alert, component:button, component:dropdown, component:field, component:nav, component:tabs |
| `font-size` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 47 (0) | - | base, component:affix, component:badge, component:breadcrumbs, component:button, component:card, component:demo, component:field, component:nav, component:pagination, component:spinner, component:tabl |
| `font-weight` | high | 2015-07-29 | 2018-01-29 | yes | yes | C2 E12 F1 S1 iOS1 | 18 (0) | - | base, component:badge, component:breadcrumbs, component:button, component:demo, component:field, component:nav, component:table, component:tabs, component:toc |
| `form` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S3 iOS2 | 2 (0) | - | component:field |
| `get-computed-style` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S3 iOS1 | 6 (0) | - | component:alert, component:carousel, component:demo, component:dropdown |
| `gradients` | high | 2015-07-29 | 2018-01-29 | yes | yes | C26 E12 F16 S7 iOS7 | 10 (0) | - | component:demo, component:field, component:progress, component:seam |
| `hashchange` | high | 2015-07-29 | 2018-01-29 | yes | yes | C4 E12 F3.6 S5 iOS5 | 1 (0) | - | component:tabs |
| `head` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 0 (0) | - | HTML only: starter |
| `header-footer` | high | 2015-07-29 | 2018-01-29 | yes | yes | C5 E12 F4 S5 iOS4.2 | 0 (0) | - | HTML only: component:card, component:dialog, layout:cover, recipe:hero, recipe:shell, starter |
| `headings` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 0 (0) | - | HTML only: component:card, component:carousel, component:dialog, component:progress, layout:box, layout:breakout, layout:center, layout:columns, layout:cover, layout:sidebar, layout:stack, layout:time |
| `html` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 0 (0) | - | HTML only: starter |
| `img` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S3 iOS2 | 0 (0) | - | HTML only: component:card, layout:breakout, layout:frame, layout:layer, layout:masonry, layout:overlay, recipe:hero, recipe:media, starter |
| `import` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 65 (0) | - | yeti.css |
| `indeterminate` | high | 2015-07-29 (feature: 2020-01-15) | 2018-01-29 (feature: 2022-07-15) | yes | yes | C1 E12 F2 S3 iOS1 | 3 (0) | - | component:progress |
| `inherit-value` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 35 (0) | - | base, component:alert, component:button, component:demo, component:dropdown, component:field, component:nav, component:pagination, component:progress, component:tabs, layout:attributes.css |
| `input` | high | 2015-07-29 | 2018-01-29 | yes | yes | C4 E12 F4 S5 iOS4 | 0 (0) | - | HTML only: component:affix, component:button, component:buttons, component:field |
| `input-checkbox` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 0 (0) | - | HTML only: component:button, component:field |
| `input-email-tel-url` | high | 2015-07-29 | 2018-01-29 | yes | yes | C5 E12 F1 S5 iOS3 | 0 (0) | - | HTML only: component:field |
| `input-number` | high | 2015-07-29 | 2018-01-29 | yes | yes | C7 E12 F29 S5.1 iOS5 | 1 (0) | - | component:field |
| `input-radio` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 0 (0) | - | HTML only: component:buttons, component:field |
| `input-selectors` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S3.1 iOS2 | 13 (10) | inside forgiving :is() | base, component:button, component:field |
| `iterators` | high | 2015-07-29 | 2018-01-29 | yes | yes | C38 E12 F13 S7 iOS7 | 16 (0) | - | component:demo, component:field, component:tabs, component:toc, utility:enter |
| `javascript` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1.1 iOS1 | 8 (1) | try/catch | component:alert, component:carousel, component:demo, component:dropdown, component:tabs, component:toc |
| `label` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S<=4 iOS<=3.2 | 0 (0) | - | HTML only: component:affix, component:button, component:buttons, component:field |
| `lang-attr` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S<=4 iOS<=3.2 | 0 (0) | - | HTML only: starter |
| `letter-spacing` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 7 (0) | - | base, component:badge, component:button, utility:billboard |
| `line-height` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 9 (0) | - | base, component:badge, component:button, component:demo, component:field, utility:lede |
| `link` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S<=4 iOS<=3.2 | 0 (0) | - | HTML only: starter |
| `list-elements` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S<=4 iOS<=3.2 | 0 (0) | - | HTML only: component:breadcrumbs, component:carousel, component:nav, component:pagination, component:toc, layout:grid, layout:timeline, starter, utility:enter, utility:visually-hidden |
| `list-style` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 16 (0) | - | base, component:breadcrumbs, component:carousel, component:nav, component:pagination, component:toc, layout:timeline |
| `location` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 1 (0) | - | component:tabs |
| `main` | high | 2015-07-29 | 2018-01-29 | yes | yes | C26 E12 F21 S7 iOS7 | 0 (0) | - | HTML only: layout:center, recipe:shell, starter |
| `map` | high | 2015-07-29 | 2018-01-29 | yes | yes | C38 E12 F13 S8 iOS8 | 1 (0) | - | component:toc |
| `margin` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 57 (1) | @supports (grid-template-rows: masonry) | base, component:affix, component:alert, component:breadcrumbs, component:button, component:buttons, component:card, component:carousel, component:demo, component:dropdown, component:field, component:n |
| `matchmedia` | high | 2015-07-29 | 2018-01-29 | yes | yes | C9 E12 F6 S5.1 iOS5 | 1 (0) | - | component:dropdown |
| `media-queries` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S3 iOS1 | 8 (2) | @supports (interpolate-size: allow-keywords); @supports (animation-timeline: view()) | base, tokens, utility:enter, utility:print |
| `meta` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S<=4 iOS<=3.2 | 0 (0) | - | HTML only: starter |
| `mutationobserver` | high | 2015-07-29 | 2018-01-29 | yes | yes | C26 E12 F14 S7 iOS7 | 2 (0) | - | component:demo, component:field |
| `nav` | high | 2015-07-29 | 2018-01-29 | yes | yes | C5 E12 F4 S5 iOS4.2 | 0 (0) | - | HTML only: component:breadcrumbs, component:nav, component:pagination, component:toc, layout:cluster, layout:container, layout:cover, layout:sidebar, recipe:shell, starter |
| `nth-child` | high | 2015-07-29 | 2018-01-29 | yes | yes | C4 E12 F3.5 S3.1 iOS4 | 66 (1) | @supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: block-start) | base, component:accordion, component:affix, component:buttons, component:card, component:table, component:tooltip, layout:columns, layout:sidebar, layout:timeline, recipe:hero, recipe:media, utility:e |
| `opacity` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S2 iOS1 | 22 (0) | - | base, component:button, component:dialog, component:dropdown, component:nav, component:tooltip, utility:enter |
| `overflow-shorthand` | high | 2015-07-29 (feature: 2020-03-24) | 2018-01-29 (feature: 2022-09-24) | yes | yes | C1 E12 F3.5 S3 iOS2 | 49 (0) | - | base, component:accordion, component:button, component:card, component:carousel, component:demo, component:nav, component:progress, layout:frame, layout:overlay, layout:scroller, recipe:hero, recipe:m |
| `p` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 0 (0) | - | HTML only: component:accordion, component:badge, component:card, component:carousel, component:dialog, component:field, component:progress, component:seam, component:spinner, component:tabs, layout:bo |
| `padding` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 46 (0) | - | base, component:accordion, component:alert, component:badge, component:breadcrumbs, component:button, component:card, component:carousel, component:demo, component:dialog, component:dropdown, componen |
| `physical-properties` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 2 (0) | - | layout:overlay |
| `pointer-events` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1.5 S4 iOS3.2 | 4 (0) | - | component:demo, layout:stack |
| `position` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 48 (3) | @supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: block-end); @supports (anchor-name: --a) and (anchor-scope:  | base, component:affix, component:button, component:buttons, component:card, component:demo, component:dropdown, component:nav, component:tooltip, layout:attributes.css, layout:overlay, layout:scroller |
| `pre` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S<=4 iOS<=3.2 | 0 (0) | - | HTML only: component:demo |
| `progress` | high | 2015-07-29 | 2018-01-29 | yes | yes | C6 E12 F6 S6 iOS7 | 0 (0) | - | HTML only: component:progress |
| `relative-positioning` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 14 (0) | - | base, component:affix, component:button, component:buttons, component:card, component:demo, component:tooltip, layout:overlay, layout:scroller, layout:stack, layout:timeline |
| `rem` | high | 2015-07-29 | 2018-01-29 | yes | yes | C4 E12 F3.6 S5 iOS4 | 121 (0) | - | component:card, component:demo, component:dialog, component:nav, component:pagination, component:progress, component:tooltip, layout:attributes.css, layout:breakout, layout:cluster, layout:grid, layou |
| `root` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 14 (1) | @supports (interpolate-size: allow-keywords) | base, starter, theme:sharp.css, theme:soft.css, tokens |
| `section` | high | 2015-07-29 | 2018-01-29 | yes | yes | C5 E12 F4 S5 iOS4.2 | 0 (0) | - | HTML only: component:carousel, component:seam, component:tabs, layout:box, layout:columns, starter |
| `selectors` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S3 iOS1 | 3483 (565) | inside forgiving :is(); @supports (field-sizing: content); @supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: b | base, component:accordion, component:affix, component:alert, component:badge, component:breadcrumbs, component:button, component:buttons, component:card, component:carousel, component:demo, component: |
| `set` | high | 2015-07-29 | 2018-01-29 | yes | yes | C38 E12 F13 S8 iOS8 | 1 (0) | - | component:toc |
| `settimeout` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S4 iOS1 | 4 (0) | - | component:dialog, component:dropdown |
| `small` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S<=4 iOS<=3.2 | 0 (0) | - | HTML only: starter |
| `span` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 0 (0) | - | HTML only: component:affix, component:badge, component:card, component:carousel, component:pagination, component:spinner, component:tooltip, utility:visually-hidden |
| `static-positioning` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 6 (0) | - | component:nav |
| `strings` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 2 (0) | - | component:field, component:tabs |
| `strong` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S<=4 iOS<=3.2 | 0 (0) | - | HTML only: component:alert, starter, utility:attention |
| `style-attr` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 0 (0) | - | HTML only: starter |
| `tabindex` | high | 2015-07-29 (feature: 2018-10-02) | 2018-01-29 (feature: 2021-04-02) | yes | yes | C1 E12 F1.5 S3.1 iOS2 | 5 (1) | inside forgiving :is() | component:alert, component:card, component:tabs |
| `text-decoration` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F3 S1 iOS1 | 20 (0) | - | base, component:breadcrumbs, component:button, component:carousel, component:dropdown, component:nav, component:pagination, component:toc |
| `text-indent` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 2 (0) | - | component:toc |
| `title` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 0 (0) | - | HTML only: starter |
| `url` | high | 2015-07-29 | 2018-01-29 | yes | yes | C32 E12 F19 S7 iOS7 | 2 (0) | - | component:demo |
| `user-action-pseudos` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S2 iOS1 | 37 (20) | inside forgiving :is() | base, component:accordion, component:alert, component:breadcrumbs, component:button, component:carousel, component:demo, component:dropdown, component:nav, component:pagination, component:table, compo |
| `vertical-align` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 5 (0) | - | base, component:spinner, component:table |
| `viewport-units` | high | 2015-07-29 (feature: 2017-10-17) | 2018-01-29 (feature: 2020-04-17) | yes | yes | C20 E12 F19 S6 iOS6 | 1 (0) | - | tokens |
| `visibility` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 4 (0) | - | component:tooltip |
| `weakmap` | high | 2015-07-29 | 2018-01-29 | yes | yes | C36 E12 F6 S8 iOS8 | 3 (0) | - | component:dialog, component:dropdown |
| `white-space` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 12 (0) | - | base, component:affix, component:badge, component:button, component:table, utility:visually-hidden |
| `width-height` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 46 (0) | - | base, component:accordion, component:button, component:demo, component:field, component:tooltip, layout:attributes.css, layout:grid, layout:masonry, layout:timeline, theme:sharp.css, theme:soft.css, t |
| `window` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S3 iOS1 | 1 (0) | - | component:tabs |
| `z-index` | high | 2015-07-29 | 2018-01-29 | yes | yes | C1 E12 F1 S1 iOS1 | 8 (0) | - | base, component:affix, component:buttons, component:card, component:demo, component:tooltip, layout:attributes.css |
| `animations-css` | high | 2015-09-30 | 2018-03-30 | yes | yes | C43 E12 F16 S9 iOS9 | 69 (5) | @supports (animation-timeline: scroll()); @supports (animation-timeline: view()) | base, component:progress, component:spinner, tokens, utility:attention, utility:enter |
| `number` | high | 2015-09-30 (feature: 2015-07-29) | 2018-03-30 (feature: 2018-01-29) | yes | yes | C19 E12 F16 S9 iOS9 | 29 (0) | - | component:demo, component:field |
| `supports` | high | 2015-09-30 | 2018-03-30 | yes | yes | C28 E12 F22 S9 iOS9 | 10 (0) | - | base, component:dropdown, component:nav, component:progress, component:tooltip, layout:masonry, utility:enter |
| `template-literals` | high | 2015-09-30 (feature: 2020-01-15) | 2018-03-30 (feature: 2022-07-15) | yes | yes | C41 E12 F34 S9 iOS9 | 7 (0) | - | component:demo |
| `transforms2d` | high | 2015-09-30 | 2018-03-30 | yes | yes | C36 E12 F16 S9 iOS9 | 6 (0) | - | base, component:progress, component:spinner |
| `transitions` | high | 2015-09-30 | 2018-03-30 | yes | yes | C26 E12 F16 S9 iOS9 | 22 (0) | - | base, component:button, component:carousel, component:demo, component:dialog, component:dropdown, component:field, component:nav, component:progress, component:tabs, component:toc, component:tooltip,  |
| `weakset` | high | 2015-09-30 | 2018-03-30 | yes | yes | C36 E12 F34 S9 iOS9 | 3 (0) | - | component:dropdown, component:field |
| `spread` | high | 2015-10-14 (feature: 2020-01-15) | 2018-04-14 (feature: 2022-07-15) | yes | yes | C46 E12 F16 S8 iOS8 | 9 (0) | - | component:carousel, component:demo, component:field, component:tabs, component:toc |
| `initial-value` | high | 2015-11-12 | 2018-05-12 | yes | yes | C1 E13 F19 S1.2 iOS1 | 1 (0) | - | component:demo |
| `destructuring` | high | 2016-08-02 (feature: 2020-01-15) | 2019-02-02 (feature: 2022-07-15) | yes | yes | C49 E14 F41 S8 iOS8 | 3 (0) | - | component:carousel, component:demo |
| `functions` | high | 2016-09-20 (feature: 2015-07-29) | 2019-03-20 (feature: 2018-01-29) | yes | yes | C45 E12 F22 S10 iOS10 | 59 (0) | - | component:alert, component:carousel, component:demo, component:dialog, component:dropdown, component:field, component:tabs, component:toc, utility:enter |
| `let-const` | high | 2016-09-20 | 2019-03-20 | yes | yes | C49 E14 F44 S10 iOS10 | 131 (0) | - | component:alert, component:carousel, component:demo, component:dialog, component:dropdown, component:field, component:tabs, component:toc, utility:enter |
| `multi-column` | high | 2017-03-07 | 2019-09-07 | yes | yes | C50 E12 F52 S9 iOS9 | 7 (4) | @supports (grid-template-rows: masonry) | layout:masonry |
| `input-range` | high | 2017-03-16 | 2019-09-16 | yes | yes | C4 E12 F23 S3.1 iOS5 | 0 (0) | - | HTML only: component:field |
| `custom-properties` | high | 2017-04-05 | 2019-10-05 | yes | yes | C49 E15 F31 S9.1 iOS9.3 | 2990 (13) | @supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: block-end); @supports (anchor-name: --a) and (anchor-scope:  | base, component:accordion, component:affix, component:alert, component:badge, component:breadcrumbs, component:button, component:buttons, component:card, component:carousel, component:demo, component: |
| `outlines` | high | 2017-04-05 | 2019-10-05 | yes | yes | C1 E15 F1.5 S1.2 iOS1 | 3 (0) | - | base, component:accordion, component:button |
| `font-stretch` | high | 2017-09-19 (feature: 2020-01-15) | 2020-03-19 (feature: 2022-07-15) | yes | yes | C60 E12 F9 S11 iOS11 | 6 (0) | - | base, component:badge, component:nav |
| `time` | high | 2017-10-24 | 2020-04-24 | yes | yes | C62 E14 F22 S7 iOS4 | 0 (0) | - | HTML only: layout:timeline |
| `dom` | high | 2018-04-30 (feature: 2015-07-29) | 2020-10-30 (feature: 2018-01-29) | yes | yes | C54 E17 F49 S10 iOS10 | 41 (0) | - | component:alert, component:carousel, component:demo, component:dialog, component:dropdown, component:field, component:tabs, component:toc, utility:enter |
| `output` | high | 2018-10-02 | 2021-04-02 | yes | yes | C10 E<=18 F4 S7 iOS7 | 0 (0) | - | HTML only: component:field |
| `interaction` | high | 2018-12-11 | 2021-06-11 | yes | yes | C41 E12 F64 S9 iOS9 | 2 (0) | - | component:dropdown |
| `intersection-observer` | high | 2019-03-25 | 2021-09-25 | yes | yes | C51 E15 F55 S12.1 iOS12.2 | 2 (0) | - | component:toc, utility:enter |
| `sticky-positioning` | high | 2019-09-19 | 2022-03-19 | yes | yes | C56 E16 F32 S13 iOS13 | 2 (0) | - | component:demo, layout:attributes.css |
| `touch-action` | high | 2019-09-19 | 2022-03-19 | yes | yes | C36 E12 F52 S13 iOS13 | 2 (0) | - | component:demo |
| `background-position` | high | 2020-01-15 (feature: 2015-07-29) | 2022-07-15 (feature: 2018-01-29) | yes | yes | C1 E79 F1 S1 iOS1 | 6 (0) | - | component:field, component:progress |
| `clip-path` | high | 2020-01-15 (feature: 2021-01-21) | 2022-07-15 (feature: 2023-07-21) | yes | yes | C55 E79 F3.5 S9.1 iOS9.3 | 13 (3) | @supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: block-start) | base, component:button, component:seam, component:tooltip, utility:visually-hidden |
| `details` | high | 2020-01-15 | 2022-07-15 | yes | yes | C12 E79 F49 S6 iOS6 | 0 (0) | - | HTML only: component:accordion, component:demo |
| `font-variant-numeric` | high | 2020-01-15 | 2022-07-15 | yes | yes | C52 E79 F34 S9.1 iOS9.3 | 6 (0) | - | component:field, component:toc, layout:attributes.css |
| `iframe-srcdoc` | high | 2020-01-15 | 2022-07-15 | yes | yes | C20 E79 F25 S6 iOS6 | 1 (0) | - | component:demo |
| `object-fit` | high | 2020-01-15 | 2022-07-15 | yes | yes | C32 E79 F36 S10 iOS10 | 14 (0) | - | component:card, layout:frame, recipe:hero, recipe:media |
| `page-breaks` | high | 2020-01-15 (feature: 2019-01-29) | 2022-07-15 (feature: 2021-07-29) | yes | yes | C50 E79 F65 S10 iOS10 | 4 (2) | @supports (grid-template-rows: masonry) | layout:masonry |
| `prefers-reduced-motion` | high | 2020-01-15 | 2022-07-15 | yes | yes | C74 E79 F63 S10.1 iOS10.3 | 6 (2) | @supports (interpolate-size: allow-keywords); @supports (animation-timeline: view()) | base, tokens, utility:enter |
| `scope-pseudo` | high | 2020-01-15 | 2022-07-15 | yes | yes | C27 E79 F32 S7 iOS7 | 11 (0) | - | component:carousel, component:demo, component:dropdown, component:field |
| `scroll-elements` | high | 2020-01-15 (feature: 2020-09-16) | 2022-07-15 (feature: 2023-03-16) | yes | yes | C61 E79 F36 S10.1 iOS10.3 | 1 (0) | - | component:carousel |
| `shapes` | high | 2020-01-15 | 2022-07-15 | yes | yes | C37 E79 F54 S10.1 iOS10.3 | 13 (3) | @supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: block-start) | base, component:button, component:seam, component:tooltip, utility:visually-hidden |
| `table` | high | 2020-01-15 (feature: 2015-07-29) | 2022-07-15 (feature: 2018-01-29) | yes | yes | C14 E79 F1 S<=4 iOS<=3.2 | 7 (0) | - | base, component:table |
| `text-align` | high | 2020-01-15 (feature: 2015-07-29) | 2022-07-15 (feature: 2018-01-29) | yes | yes | C1 E79 F1 S<=4 iOS<=3.2 | 26 (0) | - | base, component:dropdown, component:table, component:tabs |
| `will-change` | high | 2020-01-15 | 2022-07-15 | yes | yes | C36 E79 F36 S9.1 iOS9.3 | 1 (0) | - | utility:lift |
| `web-animations` | high | 2020-07-27 (feature: 2020-09-16) | 2023-01-27 (feature: 2023-03-16) | yes | yes | C84 E84 F63 S13.1 iOS13.4 | 2 (0) | - | component:alert |
| `grid` | high | 2020-07-28 (feature: 2017-10-17) | 2023-01-28 (feature: 2020-04-17) | yes | yes | C57 E79 F76 S10.1 iOS10.3 | 140 (14) | @supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: block-end); @supports (anchor-name: --a) and (anchor-scope:  | base, component:alert, component:badge, component:breadcrumbs, component:button, component:buttons, component:card, component:carousel, component:demo, component:dialog, component:dropdown, component: |
| `min-max-clamp` | high | 2020-07-28 | 2023-01-28 | yes | yes | C79 E79 F75 S13.1 iOS13.4 | 13 (2) | @supports (grid-template-rows: masonry) | component:button, component:demo, component:dialog, component:field, component:nav, layout:breakout, layout:grid, layout:masonry, recipe:hero, tokens, utility:billboard |
| `nullish-coalescing` | high | 2020-07-28 (feature: 2020-09-16) | 2023-01-28 (feature: 2023-03-16) | yes | yes | C80 E80 F72 S13.1 iOS13.4 | 2 (0) | - | component:demo, component:tabs |
| `object-object` | high | 2020-07-28 (feature: 2015-07-29) | 2023-01-28 (feature: 2018-01-29) | yes | yes | C80 E80 F74 S13.1 iOS13.4 | 23 (0) | - | component:alert, component:carousel, component:demo, component:dialog, component:dropdown, component:field, component:tabs |
| `pointer-events-api` | high | 2020-07-28 | 2023-01-28 | yes | yes | C57 E17 F59 S13 iOS13 | 5 (0) | - | component:demo, component:dialog, component:dropdown |
| `resize-observer` | high | 2020-07-28 | 2023-01-28 | yes | yes | C64 E79 F69 S13.1 iOS13.4 | 2 (0) | - | component:demo |
| `scroll-into-view` | high | 2020-09-16 (feature: 2020-01-15) | 2023-03-16 (feature: 2022-07-15) | yes | yes | C61 E79 F36 S14 iOS14 | 1 (0) | - | component:tabs |
| `flexbox` | high | 2020-09-22 (feature: 2015-09-30) | 2023-03-22 (feature: 2018-03-30) | yes | yes | C29 E12 F81 S9 iOS9 | 263 (3) | @supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: block-end); @supports (anchor-name: --a) and (anchor-scope:  | base, component:affix, component:alert, component:badge, component:breadcrumbs, component:button, component:buttons, component:card, component:carousel, component:demo, component:dialog, component:dro |
| `text-underline-offset` | high | 2020-11-19 | 2023-05-19 | yes | yes | C87 E87 F70 S12.1 iOS12.2 | 1 (0) | - | base |
| `is` | high | 2021-01-21 | 2023-07-21 | yes | yes | C88 E88 F78 S14 iOS14 | 154 (6) | inside forgiving :is(); @supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: block-end) | base, component:affix, component:button, component:buttons, component:card, component:demo, component:field, component:nav, component:pagination, component:seam, component:table, layout:attributes.css |
| `not` | high | 2021-01-21 | 2023-07-21 | yes | yes | C88 E88 F84 S9 iOS9 | 264 (19) | inside forgiving :is(); @supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: block-end); @supports (animation-tim | base, component:accordion, component:affix, component:alert, component:badge, component:breadcrumbs, component:button, component:buttons, component:card, component:carousel, component:demo, component: |
| `where` | high | 2021-01-21 | 2023-07-21 | yes | yes | C88 E88 F78 S14 iOS14 | 5 (1) | inside forgiving :is() | component:field, component:table, layout:stack |
| `aspect-ratio` | high | 2021-09-20 | 2024-03-20 | yes | yes | C88 E88 F89 S15 iOS15 | 37 (0) | - | component:card, layout:frame, recipe:hero, recipe:media |
| `logical-properties` | high | 2021-11-02 (feature: 2021-09-20) | 2024-05-02 (feature: 2024-03-20) | yes | yes | C89 E89 F94 S15 iOS15 | 392 (16) | @supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: block-end); @supports (anchor-name: --a) and (anchor-scope:  | base, component:accordion, component:affix, component:alert, component:badge, component:button, component:buttons, component:card, component:carousel, component:demo, component:dialog, component:dropd |
| `color-scheme` | high | 2022-01-11 (feature: 2022-02-03) | 2024-07-11 (feature: 2024-08-03) | yes | yes | C81 E81 F96 S13 iOS13 | 3 (0) | - | tokens |
| `appearance` | high | 2022-03-14 | 2024-09-14 | yes | yes | C84 E84 F80 S15.4 iOS15.4 | 24 (0) | - | base, component:alert, component:field, component:nav, component:progress, component:tabs |
| `backdrop` | high | 2022-03-14 | 2024-09-14 | yes | yes | C37 E79 F47 S15.4 iOS15.4 | 5 (0) | - | component:dialog, component:nav |
| `cascade-layers` | high | 2022-03-14 | 2024-09-14 | yes | yes | C99 E99 F97 S15.4 iOS15.4 | 71 (0) | - | base, component:accordion, component:affix, component:alert, component:badge, component:breadcrumbs, component:button, component:buttons, component:card, component:carousel, component:demo, component: |
| `dialog` | high | 2022-03-14 | 2024-09-14 | yes | yes | C37 E79 F98 S15.4 iOS15.4 | 7 (0) | - | component:dialog |
| `focus-visible` | high | 2022-03-14 | 2024-09-14 | yes | yes | C86 E86 F85 S15.4 iOS15.4 | 18 (6) | inside forgiving :is() | base, component:accordion, component:affix, component:button, component:buttons, component:demo, component:field, component:tooltip, utility:lift |
| `scroll-behavior` | high | 2022-03-14 | 2024-09-14 | yes | yes | C61 E79 F36 S15.4 iOS15.4 | 4 (0) | - | base, component:carousel, component:toc |
| `text-decoration-skip-ink` | high | 2022-03-14 | 2024-09-14 | yes | yes | C64 E79 F70 S15.4 iOS15.4 | 2 (0) | - | base |
| `scroll-snap` | high | 2022-04-05 (feature: 2020-01-15) | 2024-10-05 (feature: 2022-07-15) | yes | yes | C69 E79 F99 S15 iOS15 | 9 (0) | - | base, component:carousel, layout:scroller |
| `individual-transforms` | high | 2022-08-05 | 2025-02-05 | yes | yes | C104 E104 F72 S14.1 iOS14.5 | 48 (4) | @supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: block-start) | base, component:carousel, component:dialog, component:field, component:nav, component:progress, component:spinner, component:tooltip, layout:icon, layout:overlay, utility:attention, utility:enter, uti |
| `overflow-clip` | high | 2022-09-12 | 2025-03-12 | yes | yes | C90 E90 F81 S16 iOS16 | 3 (0) | - | component:accordion, component:card, component:progress |
| `viewport-unit-variants` | high | 2022-12-05 | 2025-06-05 | yes | yes | C108 E108 F101 S15.4 iOS15.4 | 4 (0) | - | component:nav, tokens |
| `container-queries` | high | 2023-02-14 | 2025-08-14 | yes | yes | C105 E105 F110 S16 iOS16 | 177 (0) | - | component:card, component:demo, component:nav, component:pagination, layout:attributes.css, layout:breakout, layout:cluster, layout:container, layout:grid, layout:timeline, utility:billboard |
| `trig-functions` | high | 2023-03-13 | 2025-09-13 | yes | yes | C111 E111 F108 S15.4 iOS15.4 | 4 (0) | - | tokens, utility:billboard |
| `outline` | high | 2023-03-27 | 2025-09-27 | yes | yes | C94 E94 F88 S16.4 iOS16.4 | 4 (0) | - | base, component:button |
| `color-mix` | high | 2023-05-09 | 2025-11-09 | yes | yes | C111 E111 F113 S16.2 iOS16.2 | 18 (0) | - | component:alert, component:demo, component:spinner, tokens |
| `oklab` | high | 2023-05-09 | 2025-11-09 | yes | yes | C111 E111 F113 S15.4 iOS15.4 | 155 (0) | - | layout:attributes.css, tokens |
| `subgrid` | high | 2023-09-15 | 2026-03-15 | yes | yes | C117 E117 F71 S16 iOS16 | 2 (0) | - | component:card, layout:grid |
| `user-pseudos` | high | 2023-11-02 | 2026-05-02 | yes | yes | C119 E119 F88 S16.5 iOS16.5 | 4 (2) | inside forgiving :is() | component:field |

Correction, 2026-10-01 (audit 0001, M3): `light-dark()` appears 47 times in the token files, 45 in `src/tokens/color.css` and 2 in `src/tokens/surface.css`. Where this file says 45, it counts `color.css` only. Three more uses sit in guide prose, which no browser runs.
