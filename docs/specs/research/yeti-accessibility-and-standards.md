# Yeti against WHATWG, WAI-ARIA, the APG, WCAG 2.2 AA, and Angular Aria, CDK, and Material

Ticket: [17. Research: Yeti against WHATWG, WAI-ARIA, the APG, and Angular Aria, CDK, and Material patterns](../issues/17-research-yeti-accessibility-and-standards.md). Researched 2026-10-01. Decides nothing.

Evidence labels used throughout: **measured** (a script ran it in a browser or a checker and the output is on disk), **read** (the cited file says so), **inferred** (reasoned from measured or read evidence, not run).

## 1. Sources, revisions, and method

| Short name | Path | Revision (checked) |
| --- | --- | --- |
| `YETI` | `github.com/foundation/yeti` | `f52d1e8b9`, clean tree; copied with `git clone` to `D:/tmp/ngx-yeti-17/yeti`, `npm install`, `npm run build` (`build: wrote dist/ (29 entries)`). The clone was not built in. |
| `APG` | `github.com/w3c/aria-practices/content/patterns` | `3f094fd` |
| `CMP` | `github.com/angular/components/src` | branch `22.2.x`, `v22.2.0-15-g708d4c6e2`, `package.json` `22.2.0` |
| `WHATWG` | `https://html.spec.whatwg.org/multipage/` | fetched 2026-10-01 through `markdown.new` (HTTP 200): `interactive-elements.html`, `popover.html` |

Line numbers in `YETI` are in `src/`; the a11y block of each manifest is cited as `<name>/manifest.json:<line of "a11y">`, read from the built `dist/yeti.manifest.json`, which equals the source after build-time normalisation (ticket 02). APG line numbers are lines of the source `.html` file.

**Harness (measured).** `D:/tmp/ngx-yeti-17/yeti/a11y/gen.mjs` wrote one page per manifest item (49): the item's `example.html` (the docs example, which the build inlines as the manifest `example`) inside `<!doctype html><html lang="en">`, `dist/yeti.css`, and `dist/yeti.js` (all ten modules) as a module script. The example is wrapped in `<main>` unless it already holds a `main` or is a `body` (shell). Missing example images (`photo.jpg` and similar) were answered with a 1600x900 SVG through `page.route`, because the 404 image changed one result (section 2.1). Pages were served by Yeti's own `test/browser/serve.js`.

| Tool | Version (checked) | Used for |
| --- | --- | --- |
| Playwright | 1.63.0 (Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6) | all browser runs |
| axe-core / `@axe-core/playwright` | 4.13.0 (from `testEngine.version` in every result) | tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`; a second run with `best-practice` |
| Nu Html Checker (`vnu-jar`) | 26.9.30, Java 17 | WHATWG conformance of all 49 pages |
| html-validate | 10.17.0, `recommended` + `a11y` presets | second HTML opinion |

Scripts and raw output, all in `D:/tmp/ngx-yeti-17/yeti/a11y/`: `run.mjs` (axe, Tab walk with focus-ring check, ARIA snapshots; `out/results.json`, `out/results-dark.json`, `out/summary.txt`, `out/summary-dark.txt`, `out/snap/`), `behave.mjs` (per-item keyboard and state scripts, reduced motion; `out/behave.json`, `out/behave-snaps.txt`), `states.mjs` (Chromium engine tree after opening; `out/states.txt`), `tip.mjs` (tooltip hover, focus, Escape; `out/tooltip.txt`), `extra.mjs` and `over.mjs` (reflow at 320 px, focus-ring contrast, axe `target-size`, forced-colors screenshots `out/fc-*.png`; `out/extra.txt`). HTML checker output: `D:/tmp/ngx-yeti-17/hv/vnu.txt`.

**Accessibility trees: what "engine tree" means here.** Playwright 1.63 no longer has `page.accessibility` (checked: no such API in `playwright-core/types/types.d.ts`; only `ariaSnapshot`). So:

- **Chromium:** the engine's own tree, from CDP `Accessibility.getFullAXTree` (`out/snap/<name>.chromium.cdp.txt`, `out/states.txt`). This is the only engine-native tree in this report.
- **Firefox and WebKit:** `locator.ariaSnapshot()` (`out/snap/<name>.<engine>.aria.yml`). That is Playwright's own role and name computation run inside each engine over that engine's DOM and styles; it is not the engine's accessibility API tree. It shows the DOM differences between engines (for example `details` content), not mapping differences. It also does not report `aria-expanded` derived from `popovertarget`, nor `aria-current` (checked by reading the snapshots).

**WebKit Tab behaviour.** In Playwright's WebKit, Tab skips links (measured on every page with links: `cluster`, `breadcrumbs`, `toc`, `nav` and others report no link stops in WebKit and full stops in Chromium and Firefox). That is WebKit's default "Tab to links" setting, not something Yeti does; link focusability in WebKit was checked with `element.focus()` instead.

## 2. Results across all 49 items (measured)

### 2.1 axe, WCAG 2.2 AA tags

- **0 violations on all 49 pages in all three engines**, light colour scheme (`out/summary.txt`) and dark (`colorScheme: 'dark'`, `out/summary-dark.txt`; the dark palette was confirmed active: body text `oklch(0.93 0.02 250)` against `oklch(0.15 0.02 250)` in light, `a11y/check-dark.mjs`).
- One violation appeared only while example images 404'd: `scrollable-region-focusable` (serious) on `overlay`'s `p[data-over]` in all three engines, because the missing image let the held child overflow its box. With a real-sized image it is gone. Recorded as an artefact of the docs example's missing asset, not a Yeti fault.
- **Incomplete (needs review) results**, all `color-contrast` that axe could not compute: `timeline` (3 `time` elements, "background color could not be determined due to a pseudo element", all engines); `layer` (`figcaption` over an image, all engines); `breakout`, `media`, `lede` (heading "partially obscured", Chromium and Firefox only). Yeti's own notes put text-over-image contrast on the author (`layer/manifest.json:72`: "the layer does not add one"). Not resolved here.
- `target-size` (2.5.8) ran and passed on `button` (5 nodes), `buttons` (5), `pagination` (6), `carousel` (3), `nav` (6), `alert` (1), `breadcrumbs` (2), `toc` (7) in Chromium (`out/extra.txt`).
- Best-practice run: only `page-has-heading-one`, which follows from the harness (an example on its own page), on most pages. No other best-practice rule fired.

### 2.2 HTML conformance (measured)

- **Nu Html Checker: no errors on any of the 49 pages.** 30 warnings, all advisory: "no heading of level 1" (13 pages, harness), "The `list` role is unnecessary" on `ol`/`ul` (breadcrumbs, carousel, enter, grid, nav, pagination, timeline, toc, visually-hidden), "Article lacks heading" (4, `scroller`), "Section lacks heading" (3 `seam`, 2 `tabs` panels) (`D:/tmp/ngx-yeti-17/hv/vnu.txt`).
- The redundant `role="list"` is deliberate: Yeti's reset removes list markers only where `role="list"` says the list is decorative, and the role restores list semantics in WebKit (read: `timeline/manifest.json:21`, `nav/manifest.json:277`, `toc/manifest.json:141`).
- html-validate, after dropping its style rules (`doctype-style`) and the same redundant-role finding: two remaining reports, both false positives on reading — `form-dup-name` for the `field` example's two checkboxes named `notify` (a checkbox group shares a name legitimately), and `prefer-native-element` for `scroller`'s `div role="region"` (a `section` with a name would map to the same region).
- WHATWG content model (read): `summary` may hold phrasing content "optionally intermixed with heading content" (WHATWG `interactive-elements.html#the-summary-element`), so Yeti's advice to put a heading inside `summary` (`accordion/manifest.json:23`) is conforming.

### 2.3 Keyboard reach and focus visibility (measured)

- A Tab walk (up to 14 presses) on every page recorded each stop and whether an outline or box-shadow was present. **Every focus stop in every engine had a ring** (`solid 2px`), except the `demo` iframe, which shows `ring=NONE` because focus passes into the frame's document (`out/summary.txt`).
- Focus ring contrast against the page background (Chromium, focused tab): light `oklch(0.52 0.15 250)` = rgb(0,107,187) on rgb(242,253,255), **5.31:1**; dark rgb(75,163,247) on rgb(3,8,15), **7.54:1** (`out/extra.txt`). Both meet 1.4.11's 3:1. Offset 2px.

### 2.4 Reflow at 320 CSS px (1.4.10, measured, Chromium)

46 of 49 pages had no page-level horizontal scroll at 320x640. Three did (`out/extra.txt`, `a11y/over.mjs`):

- `center`: `scrollWidth 322`; `main.center.box` ends at 322 px, persistent. The example combines `center`, `box`, and `data-border`; the 2 px is consistent with a border outside the centred inline size (inferred, the CSS was not traced).
- `demo`: `scrollWidth 333`, from a `code` line inside the `pre` (right edge 341). Code is the usual case WCAG's 1.4.10 understanding allows to scroll in two dimensions (inferred).
- `attention`: `scrollWidth 329` at 200 ms and 320 at 2.5 s: the one-off shake animation, transient.

### 2.5 Reduced motion (2.3.3 is AAA; 2.2.2 is A) (measured, all three engines)

With `reducedMotion: 'reduce'` every animation and transition measured collapsed to `0.00001s` (`1e-05s` in Chromium) and the spinner's iteration count went from `infinite` to `1`: accordion, dialog, dropdown, enter (`yeti-enter-rise 0.6s`), attention (`yeti-attention-pulse 0.6s`, iteration 1 in both modes), lift (`0.15s` transitions), spinner (`yeti-spin 0.8s infinite`) (`out/behave.json`, `motion-*` keys). The spinner is the only motion that runs indefinitely without the preference; whether a loading indicator falls under 2.2.2 is left open (section 7).

### 2.6 Forced colours (Windows High Contrast; not a WCAG 2.2 AA criterion of its own) (measured)

`rg -c "forced-colors"` over `YETI/src` and `dist/yeti.css` returns nothing: **Yeti has no forced-colours rules.** Screenshots with `forcedColors: 'active'` (`out/fc-*.png`, Chromium and Firefox; normal-mode screenshots beside them) show state that disappears:

| Item | What is lost under forced colours | Engines |
| --- | --- | --- |
| buttons, button | `aria-pressed="true"` "Bold" and checked `label.button` "Monthly" look the same as their unpressed siblings | Chromium (Firefox keeps a faint fill on "Bold"; "Monthly" lost) |
| tabs | selected and unselected tabs look the same (both show a bottom rule) | Chromium, Firefox |
| field | checked checkbox and radio show no mark; the switch shows no thumb or state; the range shows no track or fill, only a thumb | Chromium, Firefox |
| progress | the native `progress` bar is not drawn at all | Chromium |
| pagination | the `aria-current="page"` link looks like the others | Chromium |
| toc | the current link survives (bold) | Chromium |

The state is still in the accessibility tree (the CDP tree reports `pressed`, `selected`, `checked`), so screen reader users are unaffected; sighted forced-colours users lose it (inferred from the screenshots). Angular Material handles the same problem with the CDK `high-contrast` mixin (`CMP/cdk/a11y/_index.scss:48-65`, `@media (forced-colors: active)`), for example a checked radio's dot forced to `CanvasText` (`CMP/material/radio/_radio-common.scss:132-137`) and a checked button-toggle drawn with a border overlay "because the browser will render it using a brighter color" (`CMP/material/button-toggle/button-toggle.scss:267-275`). `HighContrastModeDetector` observes the same query in script (`CMP/cdk/a11y/high-contrast-mode/high-contrast-mode-detector.ts:43`, `:56`).

## 3. Stateless items that share a verdict

Verdict for every row: **conforms** as far as measured — axe 0 violations in three engines, light and dark; Nu checker no errors; Tab stops (where any) all show a ring; no APG pattern applies (layout or decoration only). Each manifest's a11y note says "Purely visual" or similar.

| Group | Items | Item-specific notes |
| --- | --- | --- |
| Layouts with no focusable content and no semantics of their own | box, breakout, center, cluster, columns, container, cover, frame, grid, icon, layer, masonry, overlay, sidebar, stack, timeline | `center`: 2 px reflow overflow at 320 px (2.4). `timeline`, `layer`, `breakout`: axe contrast incomplete (2.1). `overlay`: the 404-image artefact (2.1); its note sends anything modal to dialog or tooltip (`overlay/manifest.json:62`). `icon`: decorative SVG `aria-hidden` (`icon/manifest.json:21`). `masonry`: reading order in non-native masonry is column-first (`masonry/manifest.json:25`), a 1.3.2 risk the author owns (read). Reading order equals source order for the others (read in their notes). |
| Recipes | hero, media, shell | `shell` (`body` root): landmarks `banner`, `navigation "Section"`, `main`, `complementary`, `contentinfo` in the Chromium tree (`out/snap/shell.chromium.cdp.txt`); APG landmarks pattern (`APG/landmarks/landmarks-pattern.html`) is met by the markup. `media`: axe contrast incomplete on the heading. |
| Utilities | attention, billboard, enter, lede, lift, print, visually-hidden | Motion collapses under reduced motion (2.5); attention plays once (iteration count 1, measured). `attention` reflow transient (2.4). `lede`: contrast incomplete. `print`: `display: none` per medium removes it from the tree (read, `print/manifest.json:15`). `visually-hidden`: text stays in the name ("Read more about the trail map", measured Tab walk). `lift`: rides on the focus ring, does not replace it (read, `lift/manifest.json:46`; ring measured). |
| Static components | badge, seam | badge is text (`badge/manifest.json:41`); seam decorative (`seam/manifest.json:90`); the seam example's three `section`s without headings draw a Nu warning (advisory). |

## 4. Interactive and semantic items, one row each

Columns: APG pattern and deviations (read, with the pattern file); HTML (measured unless marked); axe (measured, 3 engines, light and dark); keyboard and focus (measured unless marked); Angular building block for what is missing (read, `file:line`).

### 4.1 accordion

- **APG:** accordion (`APG/accordion/accordion-pattern.html`). Yeti is native `details`/`summary` with `name` for exclusivity (`accordion/manifest.json:23`). Deviations (read and measured): the header is not "a button inside a heading" (`:70-75`); Chromium exposes each `summary` as `DisclosureTriangleGrouped` with `expanded=false|true` inside an unnamed `group` (`out/states.txt`); there is no `aria-controls` (`:79`); there is no region role on panels, which APG makes optional (`:82`). APG at this revision lists no arrow keys for accordion at all (`:47-63`), so the "arrow keys optional" reading in ticket 03 section 4.3 is out of date: only Enter, Space, and Tab are listed.
- **HTML:** conforming; heading inside `summary` allowed (2.2).
- **axe:** 0.
- **Keyboard:** Tab reaches both summaries with a ring; Enter opens, Space closes; opening the second closes the first (`[false, true]`) in all three engines; ArrowUp does nothing (`out/behave.json`). Firefox and WebKit ARIA snapshots include the open panel's text, Chromium's snapshot groups it under the summary name (Playwright view, section 1).
- **Angular:** `ngAccordionTrigger` is `role="button"` with `aria-expanded` and `aria-controls` (`CMP/aria/accordion/accordion-trigger.ts:48-51`), `expanded` model (`:85`), group `multiExpandable` and `wrap` (`CMP/aria/accordion/accordion-group.ts:93`, `:102`). It would replace the native element rather than add to it (ticket 03, 4.3). For what native lacks, a state mirror of `details.open` through the `toggle` event is the only gap (ticket 03, 4.2).

### 4.2 affix

- **APG:** none (form control grouping). Meaning in the prefix reaches the control through `aria-describedby` (`affix/manifest.json:79`).
- **HTML / axe:** conforming / 0.
- **Keyboard:** input then "Apply" button, rings present, all engines. Chromium tree: the input's description includes `$` (`out/snap/affix.chromium.cdp.txt`).
- **Angular:** `_IdGenerator.getId` for the span's id (`CMP/cdk/a11y/id-generator.ts:22`, `:31`).

### 4.3 alert

- **APG:** alert (`APG/alert/alert-pattern.html`): must not affect focus (`:28`), avoid auto-dismiss (`:32`), content present at load is not announced (`:25`). Yeti never auto-dismisses and does not move focus on arrival (read, `alert/manifest.json:43`). `role="status"` in the example; Chromium tree: `status` with `live="polite" atomic=true` (`out/states.txt`).
- **HTML / axe:** conforming / 0.
- **Keyboard and focus:** Dismiss reachable with a ring; Enter removes the alert in all three engines; focus then sits on the parent (`main`) with `tabindex="-1"` added (`out/behave.json`). APG says nothing about focus after a user dismissal; WCAG 2.4.3 is met in that focus is not lost to `body` (inferred).
- **Angular:** `LiveAnnouncer.announce` for alerts inserted from code, where `role` alone may race the insertion (`CMP/cdk/a11y/live-announcer/live-announcer.ts:37`, `:60-78`); `animate.leave` for removal (ticket 03, 4.6).

### 4.4 badge, seam

Grouped in section 3.

### 4.5 breadcrumbs

- **APG:** breadcrumb (`APG/breadcrumb/breadcrumb-pattern.html`): labelled landmark (`:44`), `aria-current="page"` on the current link, optional when it is not a link (`:46-47`). Yeti: labelled `nav`, current step as plain text with `aria-current="page"`, separators with empty alt text (`breadcrumbs.css:22`). Conforms.
- **HTML / axe:** conforming (advisory list-role warning) / 0.
- **Keyboard:** two links, rings (Chromium, Firefox); WebKit skips links (section 1).
- **Angular:** nothing missing; `routerLinkActive` style `aria-current` is the app's concern (not in scope).

### 4.6 button

- **APG:** button (`APG/button/button-pattern.html`): toggle via `aria-pressed` (`:30`, `:103`), Space and Enter (`:66-67`). Yeti uses native `button` and `label.button` around native checkboxes and radios (`button/manifest.json:48`). Conforms.
- **HTML / axe:** conforming / 0; `target-size` pass.
- **Keyboard:** three buttons then the checkbox input, rings; Space toggles the wrapped checkbox in all engines. Chromium tree: `checkbox "Offline" checked=true` (`out/snap/button.chromium.cdp.txt`).
- **Forced colours:** checked toggle state lost (2.6).
- **Angular:** CDK `high-contrast` mixin (`CMP/cdk/a11y/_index.scss:48`) for the forced-colours state; `FocusMonitor` origin if a wrapper ever needs keyboard-only styling beyond `:focus-visible` (`CMP/cdk/a11y/focus-monitor/focus-monitor.ts:34`, `:87`).

### 4.7 buttons

- **APG:** a set of `aria-pressed` buttons in `role="group"` is not an APG pattern; the nearest is toolbar (`APG/toolbar/toolbar-pattern.html`), which asks for one Tab stop and arrow keys between controls (`:30-38`, `:76-81`) and `role="toolbar"` (`:111`). Yeti uses `role="group"` with Tab between every button (`buttons/manifest.json:21`). The segmented control of native radios follows the radio group pattern natively (`APG/radio/radio-group-pattern.html:57-61`).
- **HTML / axe:** conforming / 0.
- **Keyboard:** Bold, Italic, Underline, then one radio (roving natively), rings; ArrowRight moves the checked radio in all engines; Enter on "Italic" leaves `aria-pressed="false"`, since Yeti ships no toggle script and says the page's script moves it (read and measured). Chromium tree: `button "Bold" pressed=true`.
- **Forced colours:** pressed and checked state lost (2.6).
- **Angular:** for a toggle group, Aria `ngToolbar` gives `role="toolbar"`, roving focus, `orientation`, `wrap` (`CMP/aria/toolbar/toolbar.ts:46-49`, `:78`, `:90`) and `ngToolbarWidget` (`CMP/aria/toolbar/toolbar-widget.ts:46`), if the package wants the APG toolbar form; a typed `pressed` model is the gap Yeti leaves to the page (inferred).

### 4.8 card

- **APG:** none. The stretched heading link is the one Tab stop; the footer "Read more" is `tabindex="-1"` so it is not a second stop for the same target (read, example; measured single stop in Chromium and Firefox).
- **HTML / axe:** conforming / 0.
- **Angular:** nothing missing (typed inputs only).

### 4.9 carousel

- **APG:** carousel (`APG/carousel/carousel-pattern.html`). Container: `section aria-roledescription="carousel" aria-label` → Chromium tree `region "Featured work" roledescription="carousel"` (`out/states.txt`), matching `:117-127`. Deviations (read and measured):
  - no previous and next buttons, listed as a needed feature (`:35`);
  - slides are `article` with no `role="group"`, no `aria-roledescription="slide"`, and no per-slide name (`:136-143`); the Chromium tree shows three unnamed `article` nodes;
  - the slide picker is links, not the APG's grouped buttons (`:174-178`) or tabs (`:157-167`), and the current slide is not marked (APG grouped picker: current button `aria-disabled="true"`, `:182`); measured `aria-current` null on all dots, which Yeti says is on purpose because CSS cannot know the current slide (`carousel/manifest.json:35`);
  - no auto-rotation, so the rotation-control rules (`:40-52`) do not apply.
- **HTML / axe:** conforming (advisory list-role warning) / 0.
- **Keyboard:** track (`group "Slides"`, `tabindex="0"`) then three dots, rings (WebKit: track only, links skipped). ArrowRight on the focused track scrolls `0 -> 1017` in all engines (native scroll). Enter on dot 3 scrolls to 2035 with `history.length` unchanged and no hash, in all engines (carousel.js working) (`out/behave.json`).
- **Angular:** for a current-slide state, an `IntersectionObserver` signal (ticket 03, 5) feeding `aria-current` or the APG `aria-disabled`; for a tabbed picker, Aria Tabs (`CMP/aria/tabs/tab-list.ts:80-109`); for arrow keys over a picker of buttons, CDK `FocusKeyManager` with `withHorizontalOrientation` and `withWrap` (`CMP/cdk/a11y/key-manager/focus-key-manager.ts:22`, `list-key-manager.ts:107`, `:126`), and `Directionality` for RTL (`CMP/cdk/bidi/directionality.ts:34`). Neither Aria, CDK, nor Material ships a carousel (checked: no such directory in `CMP/aria`, `CMP/cdk`, `CMP/material`).

### 4.10 demo

- **APG:** window splitter (`APG/windowsplitter/windowsplitter-pattern.html`) for the grip. Measured attributes: `role=separator aria-orientation=vertical aria-label="Resize Card" tabindex=0 aria-valuemin=256 aria-valuemax=998 aria-valuenow=998 aria-valuetext="lg, 998 pixels"` (`:81-93` met). Deviations: no `aria-controls` naming the pane (`:95`), measured absent; Enter does nothing (value unchanged), while APG lists Enter collapse/restore without marking it optional (`:59-60`). Arrow keys, Home, End work: `998 -> 768 -> 256 -> 998` in all engines.
- **HTML / axe:** conforming / 0. The iframe is titled "Card, live" (measured).
- **Keyboard:** iframe, grip, "View Code" summary (Chromium, WebKit); Firefox's walk ends inside the iframe. Docs-only item (ticket 03, 2.3).
- **Angular:** none needed for apps; `_IdGenerator` for `aria-controls` if kept (`CMP/cdk/a11y/id-generator.ts:31`).

### 4.11 dialog

- **APG:** dialog (modal) (`APG/dialog-modal/dialog-modal-pattern.html`). Native `dialog` opened by `commandfor`/`command="show-modal"`. Chromium tree: `dialog "Delete this project?" modal=true`, and nothing else from the page is exposed while it is open (`out/states.txt`); APG asks for `aria-modal` (`:125`), which the native modal state supplies (measured `modal=true`).
  - Initial focus: the first focusable, "Cancel", in all engines; APG prefers the least destructive action for irreversible steps (`:91`), which this is.
  - Tab: APG says Tab wraps from last to first inside the dialog (`:60-70`). Measured: Chromium and WebKit pass focus out to the browser's own UI after the last button (`activeElement` becomes `body`) and then back to "Cancel"; WebKit also makes the `dialog` element itself a stop; Firefox's `activeElement` stayed on "Delete" (focus in browser UI). The page behind is never reached in any engine. This is the HTML modal-dialog model, which lets focus leave to user-agent UI; it is a deviation from APG's wrap but not a leak into inert content (inferred).
  - Escape closes in all engines; focus returns to "Delete project" after a keyboard open and after a mouse open (WebKit included, the case `dialog.js` exists for); backdrop click closes; `yeti:open` and `yeti:close` fire on each of three opens (`out/behave.json`).
  - A visible closing button ("Cancel") is in the tab sequence (`:115`).
- **HTML / axe:** conforming / 0. WHATWG advises `autofocus` on the element the user should interact with first (WHATWG `interactive-elements.html#the-dialog-element`, initial-focus note); the example has none and relies on the dialog focusing steps (read).
- **Angular:** CDK `Dialog` gives `ariaModal`, `autoFocus: 'first-tabbable'`, `restoreFocus` (`CMP/cdk/dialog/dialog-config.ts:125`, `:132`, `:135`) and a focus trap that wraps inside (`CMP/cdk/a11y/focus-trap/focus-trap.ts:38`, `CdkTrapFocus` `:417`), but it is an overlay, not the native `dialog` (ticket 03, 4.3). If APG's strict wrap is wanted on the native element, `FocusTrap` over the `dialog` is the CDK piece (inferred, not tried). Escape handling with modifier check in CDK: `CMP/cdk/dialog/dialog-ref.ts:73`.

### 4.12 dropdown

- **APG:** disclosure (`APG/disclosure/disclosure-pattern.html`): button with `aria-expanded` (`:54-56`), Enter and Space (`:46-47`), `aria-controls` optional (`:60`). Yeti refuses `role="menu"` (`dropdown/manifest.json:111`), so the menu button pattern (`APG/menu-button/menu-button-pattern.html:44-67`) is deliberately not followed. Chromium tree: `button "Account" expanded=false`, then `expanded=true` after opening, from `popovertarget` alone (`out/snap/dropdown.chromium.cdp.txt`, `out/states.txt`).
- APG's disclosure-navigation example closes an open dropdown on Escape and on focus leaving the region, and says the Escape behaviour is needed for 1.4.13 (`APG/disclosure/examples/disclosure-navigation.html:164-168`). Measured: Escape closes and returns focus to "Account" in all engines; Tab past the last item does **not** close the panel (Chromium: focus to browser UI, then back to "Account", `open=true` throughout; Firefox and WebKit the same `open=true`). WHATWG light dismiss is defined on pointer events outside the popover, plus close requests (WHATWG `popover.html#popover-light-dismiss`), so focus-out is not a dismiss trigger (read).
- **HTML / axe:** conforming / 0.
- **Keyboard:** Enter opens; Tab walks Profile, Settings, Sign out (WebKit: Sign out only, links skipped). Arrow keys: none, which matches a disclosure (an earlier ArrowDown probe in `behave.mjs` was invalid because the panel had closed; not used).
- `data-trigger="hover"` (`hover.js`) was not exercised: the docs example does not use it.
- **Angular:** close on focus-out through `FocusMonitor` or a `focusout` host listener (`CMP/cdk/a11y/focus-monitor/focus-monitor.ts:181`); close on router navigation (ticket 03, 6); `BreakpointObserver` for hover capability (`CMP/cdk/layout/breakpoints-observer.ts:43`, `:74`). Aria `Menu` and CDK `CdkMenuTrigger` (`CMP/cdk/menu/menu-trigger.ts:80`, `:232`) are `role="menu"`, which Yeti refuses.

### 4.13 field

- **APG:** switch (`APG/switch/switch-pattern.html`): native checkbox with `role="switch"` uses `checked`, Space toggles (`:53`, `:72`) — Chromium tree `switch "Dark mode" checked=false`, Space toggles in all engines. Slider: native `input type=range` — Chromium `slider "Quality" valuetext=70`; ArrowRight gives `value=71`, `output "71"`, `--yeti-range-value 0.71` (range.js) in all engines. Radio and checkbox groups: native, in named `fieldset`s (`group "Notify me by"`, `group "Plan"`).
- **Validation (measured with a wrapper form added by script, `novalidate`, since the docs example has no form):** Enter in the empty required email refuses the submit, sets `aria-invalid="true"`, writes the browser's message into `[data-error]` ("Please fill out this field." in Chromium and Firefox, "Fill out this field" in WebKit), focuses the email input, and fires `yeti:invalid` with one control, in all engines. Playwright snapshot after: `textbox "Email *" [invalid]`. This meets 3.3.1 (error identified in text) as far as measured.
- **Finding (measured, read):** the required marker enters the accessible name. Chromium's engine tree names the input **"Email \*"** (`out/snap/field.chromium.cdp.txt`), because `field.css:193-194` generates `content: " *"` with no alternative text, while Yeti's note says "The required marker is decoration; the required attribute is what assistive tech reads" (`field/manifest.json:292`). Yeti uses `content: … / ""` elsewhere for exactly this (`breadcrumbs.css:22`, `base/media.css:55`, `toc/toc.css:76`). Not a WCAG failure (2.5.3 Label in Name still holds; inferred), but it contradicts Yeti's own note.
- **HTML / axe:** conforming / 0.
- **Forced colours:** checkbox, radio, switch and range state not drawn (2.6).
- **Angular:** Material's `matInput` binds `aria-invalid` (`CMP/material/input/input.ts:85`) and keeps `aria-describedby` in step with hints and errors (`setDescribedByIds`, `:560-566`; `form-field.ts:502`, `:547` `_syncDescribedByIds`); `@angular/forms` itself sets neither (ticket 03, 4.4). Those two bindings are the pattern a Yeti field directive would copy. Forced colours: Material's slide-toggle and slider use the CDK mixin (`CMP/material/slide-toggle/slide-toggle.scss:79`, `:291`; `CMP/material/slider/slider.scss:85`, `:155`).

### 4.14 nav

- **APG:** disclosure navigation (`APG/disclosure/examples/disclosure-navigation.html:158-168`); landmarks. At 400 px wide: `navigation "Site"`, `button "Menu" expanded=true` after opening, nested `button "More" expanded=true` (Chromium tree, `out/states.txt`).
- **Keyboard (measured, all engines):** Enter on "Menu" opens the list; Tab moves into it ("Docs"; WebKit "More"); Enter on "More" opens the nested panel with the outer still open; first Escape closes only the inner and focuses "More"; second Escape closes the outer and focuses "Menu". At 1000 px the toggle is not in the tree and the list is in the bar.
- Focus-out does not close the panels (inferred from the dropdown measurement; same popover mechanism, not run for nav).
- **HTML / axe:** conforming / 0.
- **Angular:** as dropdown (4.12); close on `NavigationEnd` for SPA routing (ticket 03, 6).

### 4.15 pagination

- **APG:** no pattern; links in a labelled `nav` with `aria-current="page"` and `rel` (read, `pagination/manifest.json:42`). Chromium tree `navigation "Pagination"` with seven links.
- **HTML / axe:** conforming (advisory) / 0; `target-size` pass (6).
- **Forced colours:** the current page is not distinguishable (2.6).
- **Angular:** CDK `high-contrast` mixin for the current-page style; Material's paginator is a different (button) design and not a fit (read: `CMP/material/paginator` exists).

### 4.16 progress

- **APG:** meter/progress not in APG as a widget; native `progress` → Chromium `progressbar "Upload"`; the reading-progress bar is `aria-hidden` (read, `progress/manifest.json:135`; measured absent from the tree).
- **HTML / axe:** conforming / 0.
- **Forced colours:** the native bar is not drawn in Chromium (2.6). Material's progress bar has forced-colours rules (`CMP/material/progress-bar/progress-bar.scss:57`, `:119`).

### 4.17 spinner

- **APG:** none; `role="status" aria-label="Loading"` → Chromium `status "Loading"`.
- **Motion:** `0.8s infinite` without the preference; one iteration under reduced motion (2.5).
- **HTML / axe:** conforming / 0.

### 4.18 table

- **APG:** table (`APG/table/table-pattern.html`), static: native `table` with `caption` and `scope="col"`; conforms (read, measured axe 0, Nu no errors).
- **Keyboard:** no stops; a wide table goes in a focusable `scroller` (read, `table/manifest.json:41`).

### 4.19 tabs

- **APG:** tabs (`APG/tabs/tabs-pattern.html`). Measured in all engines with `tabs.js`: one tab selected at load (`Profile:sel=true,ti=0 Billing:sel=false,ti=-1`, inactive panel `hidden`); ArrowRight moves focus and selection (selection follows focus, automatic activation, recommended at `:104`); ArrowRight from the last wraps (`:73-74`); Home and End (`:84-89`); Tab from the tab goes to the panel, which has `tabindex="0"` because it holds nothing focusable (`:61`, `:117`). Chromium tree `tablist "Account"`, `tab selected=true|false`, `tabpanel "Profile"`.
- Deviations: no manual activation mode and no Delete (both optional, `:49`, `:93`). **The vertical form sets no `aria-orientation="vertical"`** on the tablist: the docs example lacks it (`tabs/docs.md:23-24`) and `tabs.js` only reads `data-orientation` (`tabs.js:105`; `rg aria-orientation` over `src` finds only `demo.js:103`). APG requires it for a vertical list (`:137`). Read, not measured (the docs example measured is horizontal).
- Without the module every panel shows and every tab is focusable (read, `tabs/manifest.json:44`).
- **HTML / axe:** conforming (advisory section-heading warnings) / 0.
- **Forced colours:** selected tab not distinguishable (2.6).
- **Angular:** Aria Tabs: `ngTabList` with `orientation`, `wrap`, `focusMode`, `selectionMode: 'follow' | 'explicit'`, `selectedTab` model (`CMP/aria/tabs/tab-list.ts:80-109`), and it binds `aria-orientation` (`:53`); `ngTab` binds `aria-selected` and `tabindex` (`CMP/aria/tabs/tab.ts:42-46`). It hides an inactive panel with `inert` only (`CMP/aria/tabs/tab-panel.ts:49`), so a wrapper must also bind `hidden` (ticket 03, 4.3). Material tabs have a forced-colours rule only for disabled tabs (`CMP/material/tabs/tab-header.scss:21-28`), so they are not a model for the selected-state gap.

### 4.20 toc

- **APG:** none; same-page links in a labelled `nav`. Chromium tree `navigation "On this page"` with seven links. `aria-current="true"` is in the markup (read); neither tree view reports it (section 1).
- **HTML / axe:** conforming (advisory) / 0; `target-size` pass (7).
- **Forced colours:** current link survives (bold).
- **Angular:** router `fragment` signal plus `IntersectionObserver` (ticket 03, 5).

### 4.21 tooltip

- **APG:** tooltip (`APG/tooltip/tooltip-pattern.html`): `role="tooltip"`, trigger `aria-describedby` (`:58-59`), Escape dismisses (`:44`), shows on focus and hover (`:27-28`), focus stays on the trigger (`:48`). Chromium tree: `button "Save" desc="Saves without closing"` (measured).
- **Measured in all three engines (`out/tooltip.txt`):** hover shows it (opacity 1), pointer away hides it, pointer moved from the trigger onto the bubble keeps it (1.4.13 "hoverable" met), Tab to the trigger shows it (keyboard focus via `:has(:focus-visible)`), and **Escape does not hide it, either while hovered or while focused** (opacity stays 1). This is the 1.4.13 "dismissible" gap Yeti states (`tooltip/manifest.json:28`); APG's Escape (`:44`) is the same gap. A mouse click does not show it, by design (read, `tooltip/docs.md`).
- **HTML / axe:** conforming / 0. WHATWG `popover="hint"` has light dismiss and responds to close requests (WHATWG `popover.html`, popover attribute states table), but needs script or `interestfor` to show (read; Yeti rejects popover here for that reason, `tooltip.css:1-5`).
- **Angular:** Material tooltip routes Escape to hide when visible, with a modifier check (`CMP/material/tooltip/tooltip.ts:942-948`), and uses `AriaDescriber` for the description (`:198`; `CMP/cdk/a11y/aria-describer/aria-describer.ts:41`, `:64`). The smaller piece for Yeti's CSS tooltip is an Escape listener that sets a dismissed state until pointer leave or blur, plus `_IdGenerator` for the `aria-describedby` pairing (inferred; ticket 03, 5 names the same route).

### 4.22 scroller (the one interactive layout)

- **APG:** none; a focusable named region. Chromium tree `region "Featured articles" focusable`. Tab reaches it with a ring in all engines; ArrowRight scrolls `0 -> 401` (scrollWidth 1588, client 1000) in all engines (`out/behave.json`). Meets 2.1.1 for scrolled content (inferred). html-validate prefers a `section`; Nu does not object.

## 5. Angular building blocks against the gaps found

| Gap (items) | Evidence | Building block | Where |
| --- | --- | --- | --- |
| State invisible under forced colours (button, buttons, tabs, field, progress, pagination) | measured, 2.6 | CDK `high-contrast` Sass mixin; Material's per-control rules as worked examples; `HighContrastModeDetector` for script | `CMP/cdk/a11y/_index.scss:48-65`; `material/radio/_radio-common.scss:132-137`; `material/button-toggle/button-toggle.scss:267-275`; `cdk/a11y/high-contrast-mode/high-contrast-mode-detector.ts:43` |
| Tooltip not dismissible with Escape (tooltip) | measured | Material tooltip's Escape predicate; `AriaDescriber` | `CMP/material/tooltip/tooltip.ts:942-948`, `:198`; `cdk/a11y/aria-describer/aria-describer.ts:41` |
| Disclosure panels stay open on focus-out (dropdown, nav) | measured (dropdown), inferred (nav) | `FocusMonitor` / `focusout` host listener | `CMP/cdk/a11y/focus-monitor/focus-monitor.ts:87`, `:181` |
| Vertical tablist has no `aria-orientation` (tabs) | read | Aria `ngTabList` binds it | `CMP/aria/tabs/tab-list.ts:53`, `:80` |
| Tabs: manual activation, disabled tabs, value pairing (tabs) | read | Aria Tabs (`selectionMode`, `focusMode`, `selectedTab`) plus a `hidden` binding | `CMP/aria/tabs/tab-list.ts:99-109`, `tab-panel.ts:49` |
| Carousel lacks prev/next, slide roles and names, current-slide state (carousel) | read and measured | none ships a carousel; parts: Aria Tabs for a tabbed picker, `FocusKeyManager` for a button picker, `Directionality`, `LiveAnnouncer` | `CMP/aria/tabs/tab-list.ts:80`; `cdk/a11y/key-manager/focus-key-manager.ts:22`, `list-key-manager.ts:107`, `:126`; `cdk/bidi/directionality.ts:34`; `cdk/a11y/live-announcer/live-announcer.ts:37` |
| Toggle group has no single Tab stop or `aria-pressed` script (buttons) | read and measured | Aria `ngToolbar`, `ngToolbarWidget` | `CMP/aria/toolbar/toolbar.ts:46-90`, `toolbar-widget.ts:46` |
| `aria-invalid` and `aria-describedby` for fields under Angular forms (field) | read (ticket 03); `validate.js` measured working | Material `matInput` / form-field bindings as the pattern | `CMP/material/input/input.ts:85`, `:560-566`; `material/form-field/form-field.ts:502`, `:547` |
| Required marker in the accessible name (field) | measured | CSS alternative text `content: " *" / ""`, as Yeti does for breadcrumbs | `YETI/src/components/breadcrumbs/breadcrumbs.css:22` (pattern), `field/field.css:194` (gap) |
| Native modal Tab passes through browser UI rather than wrapping (dialog) | measured | CDK `FocusTrap` / `CdkTrapFocus` if strict APG wrap is wanted | `CMP/cdk/a11y/focus-trap/focus-trap.ts:38`, `:417` |
| Generated ids for `aria-controls`, `aria-describedby`, `commandfor`, `popovertarget` (affix, demo, tabs, tooltip, dialog, dropdown) | read | `_IdGenerator.getId` | `CMP/cdk/a11y/id-generator.ts:22`, `:31` |
| Reduced motion read in script (any wrapper that animates) | read | Material's `_animationsDisabled` reads `(prefers-reduced-motion)` through `MediaMatcher` | `CMP/material/core/animation/animation.ts:29-43` |

## 6. What was measured, read, and inferred

- **Measured:** axe 4.13.0 on 49 pages x 3 engines x 2 colour schemes; Nu checker and html-validate on 49 pages; Tab walks and ring presence; focus-ring contrast (one control, both schemes); reflow at 320 px (Chromium); reduced motion on eight items (3 engines); forced colours (Chromium, Firefox; seven pages); per-item keyboard scripts for accordion, alert, button, buttons, carousel, demo, dialog, dropdown, field, nav, tabs, tooltip, scroller (3 engines); Chromium engine trees for every page and opened states; the `validate.js` refusal through a script-added form.
- **Read:** every APG, Angular, Material, CDK, and WHATWG citation; Yeti manifests, CSS, docs, and module lines cited; the absence of `forced-colors` and of `aria-orientation` handling in Yeti (by `rg`).
- **Inferred:** nav focus-out behaviour; the `center` overflow's cause; that native-dialog Tab behaviour is the HTML model; that the forced-colours loss affects sighted users only; that 2.5.3 still holds with "Email \*"; the Angular remedies marked "(inferred)".
- **Not measured:** Firefox and WebKit engine-native trees (no Playwright API, section 1); real screen readers; `data-trigger="hover"`; the vertical tabs and other docs variants beyond `example.html`; text spacing (1.4.12); 200 % zoom (1.4.4) beyond the 320 px reflow; forced colours in WebKit (Playwright does not emulate it there; not tried).

## 7. Open questions for the specs (not decided here)

- Whether the package should add forced-colours rules for state, given Yeti ships none (2.6).
- Whether a wrapper should close disclosure panels on focus-out, as the APG example does, though the platform does not.
- Whether to follow APG's carousel (prev/next, slide groups, current marker) where Yeti declines.
- Whether the native dialog's Tab behaviour is accepted or a `FocusTrap` is layered on.
- Whether the infinitely spinning `spinner` needs a 2.2.2 treatment beyond reduced motion.
- Whether to report the `field` required marker and the vertical-tabs `aria-orientation` upstream (filing in the Yeti repository needs the user's explicit confirmation).
