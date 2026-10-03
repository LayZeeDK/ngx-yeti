# Prototype: Angular Aria Tabs for the `carousel`'s picker

Ticket: [29. Prototype: Angular Aria for the four items that keep a native pattern](../../issues/29-prototype-aria-for-the-native-pattern-items.md), item `carousel` (the dots). Built and measured 2026-10-02 by Claude Opus 5.5. **Throwaway code.** Nothing here is decided.

## Question

If the carousel's dots become Aria Tabs (`ngTabs`, `ngTabList`, `ngTab`, `ngTabPanel`), with the dots as tabs and the slides as tab panels (the APG's "tabbed carousel", `carousel-pattern.html:108`, `:154-169`), and not ticket 25 row 29's fragment links over a scroll-snap track ([ADR 0024](../../adr/0024-carousel-slides-are-not-inert-before-live.md), ledger A11Y-4), do Yeti's styles still apply unchanged with no package CSS, does Aria replace `carousel.js`, and what does it cost under [ADR 0011](../../adr/0011-rendering-modes-contract-for-yeti.md)'s rendering modes and in accessibility? ADR 0024 point 1 forbids `inert` or `hidden` slides in server HTML.

## Setup

- **Workspace:** `D:/tmp/ngx-yeti-29-carousel/ws`. Config and source files copied from `D:/tmp/ngx-yeti-18/ws` (no `node_modules`), then `npm install`. Installed: `@angular/core` 22.2.1, `@angular/aria` 22.2.1, `@angular/cdk` 22.2.1, Nx 23.2.1, `@axe-core/playwright` 4.13.0, Playwright 1.63.0. Development build (`optimization: false`, so Aria's dev-mode checks run), `outputMode: server`, `provideClientHydration()` (includes incremental hydration and event replay in 22.2), zoneless. `yeti/yeti.js` was removed from `index.html`, so no Yeti module runs on the Angular pages (ADR 0040).
- **Aria source:** `github.com/angular/components/src/aria/` at `708d4c6e2`; the installed 22.2.1 build carries the same `TabPanel` host bindings (`node_modules/@angular/aria/fesm2022/tabs.mjs:702-705`, read).
- **Yeti:** `f52d1e8b9`, ticket 18's tarball. `src/styles.css` is ticket 18's global `@import` list, `carousel.css` included. ADR 0060's counted links were not used: which selectors match does not depend on how the file loads.
- **APG:** `github.com/w3c/aria-practices` at `3f094fd`, `content/patterns/carousel/carousel-pattern.html` (cited as `carousel-pattern.html:N`).
- **Browsers:** Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6, headless, 1024x768.
- **Pages** ([`src/pages.ts`](src/pages.ts)). Every Angular page uses Yeti's `example.html` text inside `<main class="container stack">`. Hrefs carry the route path (`/a#work-2`), because `<base href="/">` turns a bare `#work-2` into `/#work-2` (building-blocks 1.15); the package's `injectSameDocumentHref` would write the same string.
  - `/yeti-example.html` **(Y)**: Yeti's `example.html` word for word, with `yeti.css` and `carousel.js` ([`src/yeti-example.html`](src/yeti-example.html)).
  - `/a` **(A)**: row 29 sketched ([`src/a-carousel.ts`](src/a-carousel.ts)): `section[yetiCarousel]` with a `slide` output and a `current` signal from an `IntersectionObserver`; `[yetiCarouselSlide]` binds `role="group"` and `aria-roledescription="slide"` (the `aria-label="1 of 3"` is the consumer's); `a[yetiCarouselDot]` with a `click` host listener that runs `carousel.js:34-47` and binds `aria-current`; consumer-written `button[yetiCarouselPrevious]` and `button[yetiCarouselNext]`.
  - `/b` **(B)**: Aria Tabs on Yeti's markup. `section.carousel[ngTabs]`; each `article[data-slide]` is `ngTabPanel` with the consumer's `id`; `ol[data-dots]` is `ngTabList` with `[(selectedTab)]` starting at `work-1` and `aria-label="Choose a slide"`; each `li` gets `role="none"` and each `a` is `ngTab`. Yeti's `role="list"` on the `ol` is removed. Panel content is static, which makes Aria log a dev-mode violation (`tab-panel.ts:108-110`).
  - `/b-content` **(C)**: B with each panel's content inside `ng-template[ngTabContent]`, Aria's documented shape (`tab-panel.ts:32-38`).
  - `/b-glue` **(G)**: B plus [`src/b-glue.ts`](src/b-glue.ts), about 95 lines that add what Aria leaves out: `preventDefault` on an unmodified dot click, a scroll of the track when the selection changes, a `slide` output, and selection following an `IntersectionObserver`.
  - `/never`: A and B each inside `@defer (hydrate never)`.

```sh
cd D:/tmp/ngx-yeti-29-carousel/ws
NX_DAEMON=false node_modules/.bin/nx build ws
NG_ALLOWED_HOSTS=localhost PORT=4329 node dist/ws/server/server.mjs &
node tools/probe.mjs        # 3 engines -> results/probe.json (250 KB, kept in the workspace)
node tools/summarize.mjs    # -> results/summary.txt
node tools/axtree.mjs       # Chromium's own accessibility tree over CDP, axe node detail
```

"Before hydration" holds `main.js` back 10 s with `page.route`, then walks Tab, runs axe, clicks dot 2, waits for hydration, and records again. "JavaScript off" is a context with `javaScriptEnabled: false`. Copies: [`results/summary.txt`](results/summary.txt), [`results/axtree-chromium.txt`](results/axtree-chromium.txt), [`results/server-html.txt`](results/server-html.txt).

## Results

The three engines agreed on every row. The only difference was WebKit's Tab key, which skips links (point 4).

| Point | (A) row 29: fragment-link dots | (B) Aria Tabs | (C) B with `ngTabContent` | (G) B plus glue |
| --- | --- | --- | --- | --- |
| 1. Styles vs Y | all 7 `carousel.css` selectors match as in Y. 0 differences across 29 properties on the section, track, slides, `ol`, `li`, dots and dot `::before`. The section is taller only because of the added previous and next buttons | all 7 selectors match. 0 differences, inert slides included | same as B once live. With JavaScript off the slides are empty boxes | same as B |
| 2. `carousel.js` behaviours | all replaced: no history entry, scroll, `slide` output on the choice, modified clicks left to the browser. Adds a current marker that follows scrolling | the picker works, but none of carousel.js's behaviours is provided: a click adds a history entry and changes the hash; the arrow keys, Home, End and Enter select a tab and the track does not move; no slide event. The selection does not follow a swipe, so the slide in view stays `inert` | same as B | all replaced, at about 95 lines. Leftover problem: the roving tab stop stays on the old dot after a swipe |
| 3a. Server HTML / JavaScript off | no `inert` or `hidden`. Dots are Tab stops and follow their fragments. Previous and next do nothing | `inert="true"` on slides 2 and 3, against ADR 0024 point 1. All three tabs and the tablist have `tabindex="-1"`, so Tab never reaches the picker. A dot click scrolls an inert slide into view | the same, and every panel is empty, the selected one included | same as B (the glue runs only in the browser) |
| 3b. Before hydration | as JavaScript off. On hydration, `aria-current` moves to the slide in view. The `slide` output did not fire for the early click | as JavaScript off. On hydration, the replayed click selects slide 2 and moves `inert` | not measured separately (same server HTML as B, but empty) | not measured |
| 3c. `hydrate never` | dots work natively (+1 history each). `aria-current` stays on dot 1. Previous and next do nothing | permanent: 2 of 3 slides `inert`, picker unreachable by Tab, arrow keys do nothing | not measured | not measured |
| 4. axe (hydrated) | `aria-allowed-role` (minor) on the 3 `article[role=group]`; `heading-order` (page artefact, also in Y) | `aria-allowed-role` (minor) on the one non-inert `article[role=tabpanel]`; `heading-order` | as B | as B |
| 4. Keyboard | Tab: track, dot 1, dot 2, dot 3, Previous, Next (Chromium, Firefox). Enter on a dot scrolls with no history entry. Arrows do nothing on a dot (they are links) | Tab: track, panel 1 (`tabindex=0`), selected tab, out. Arrows, Home and End move focus and selection (follow focus). Enter adds no history entry. The track does not scroll | as B | as B, and the track scrolls |
| 4. Tree (Chromium CDP) | region "Featured work" (roledescription carousel) > group "Slides" > 3 x group "n of 3" (roledescription slide); list > 3 links "Slide n"; 2 buttons | region > group "Slides" > **only** tabpanel "Slide 1" (the inert ones are gone); tablist "Choose a slide" > 3 tabs, `selected` on one | as B | as B |

## Findings

### 1. Styles

- **Measured:** `carousel.css` keys on `.carousel`, `> [data-track]`, `> [data-track] > *`, `> [data-dots]`, `> [data-dots] > li`, and `> [data-dots] a` (`carousel.css:11-57`). B keeps every one of those hooks, so all 7 selectors match the same number of elements as in Y. Computed styles of the section, track, two slides, `ol`, first `li`, two dots, and the dots' `::before` match Y in all three engines (29 properties each, including `scroll-snap-type`, `scroll-snap-align`, `inline-size`, `scrollbar-width`, and the dot circle's size and colour). An `inert` slide shows no computed difference (`opacity`, `pointer-events`, `user-select`, `visibility` all unchanged), so the scroll-snap track keeps its layout and every slide stays visible and scrollable. Aria hides nothing on screen; it makes slides unreachable.
- **Measured:** A differs from Y only in the section's height (167.8 px against 225.3 px), from the two consumer-written buttons below the dots.
- **Read:** B changes Yeti's markup, though none of the changes is a selector: `role="list"` on the `ol` gives way to `role="tablist"` (`tab-list.ts:50`), each `li` needs `role="none"` (otherwise a `listitem` sits inside a `tablist`), and the `tablist` needs a name (`carousel-pattern.html:164`).
- **Read:** `yeti.css` has no carousel rule for `aria-current` or `aria-selected` (searched the built `yeti.css`; the `[aria-selected]` rules are under `.tabs >` only). So a visible current dot needs package CSS in A and in B alike. Neither option needs package CSS just to look like Y.

### 2. Yeti JavaScript: `carousel.js`, behaviour by behaviour

| # | Behaviour (`carousel.js`) | Aria Tabs (B) | Notes |
| --- | --- | --- | --- |
| 1 | One delegated `document` click listener for `.carousel > [data-dots] a[href^="#"]`; dots added later work (`:10-12`) | **partly**: per-instance `click` and `keydown` host listeners on the tablist (`tab-list.ts:55-57`); tabs added later register through `SortedCollection` | Same effect for Angular-rendered dots |
| 2 | Modified, non-primary, or already-prevented clicks are left to the browser (`:14-16`) | **fully**, in effect: Aria never prevents a click's default (`click-event-manager.ts:47`) and its tab-list click handler is registered for unmodified clicks only (`tabs.ts:194-198` in `private/`, `click-event-manager.ts:83`, `:88-90`) | read, not measured |
| 3 | Only a dot pointing at a slide in its own track is handled (`:18-23`) | **fully**, by construction: a tab finds its panel by `value` (`tab.ts:65-67`) | |
| 4 | `preventDefault()`: following a dot adds no history entry and leaves the URL alone (`:1-8`, `:25`) | **not** for clicks: measured +1 `history.length` and `#work-2` in the URL in all three engines. **Fully** for keys: Enter, Space and the arrows are prevented (`keyboard-event-manager.ts:34`); measured 0 history after Enter | G restores it with a click listener |
| 5 | Scrolls the track to the slide, measured from the boxes and against the start edge for the writing direction (`:26-36`) | **not**. A mouse click scrolls only because the browser follows the fragment. Arrow keys, Home, End and Enter change the selection and leave the track where it is (measured: slide 1 still in view after ArrowRight and End, in all three engines). Aria's `Directionality` turns the arrow keys for RTL (`private/tabs/tabs.ts:159-172`) but scrolls nothing | G restores it |
| 6 | No `behavior` passed, so the scroll takes the track's `scroll-behavior` token, which reduced motion collapses (`:28-33`) | **not applicable**: CSS. Measured `smooth`, and `auto` under `prefers-reduced-motion: reduce`, on Y, A, B, C and G | |
| 7 | `yeti:slide` with `{ index, slide }`, bubbling and composed, on the choice and not the arrival (`:38-47`) | **partly**: the `selectedTab` model (`tab-list.ts:109`) changes on the choice, with the panel's `value` and no index or element. It also changes on keys, which `carousel.js` never sees. Not a DOM event | G emits `slide` from the model |
| - | Current-dot tracking while scrolling: **not in Yeti** ("the module deliberately does not track it either", `docs.md:32`) | **partly**: `aria-selected` marks the chosen tab, and it does not follow a swipe or trackpad scroll. Measured: after a scroll to slide 3, slide 2 stays selected, and slide 3, the one on screen, is `inert` | A's `IntersectionObserver` and G's do follow it |
| - | Autoplay: **none** in Yeti | not applicable | |
| - | Previous and next buttons: **none** in Yeti (A11Y-4) | **not**: Aria has no such part, and the APG's tabbed carousel still needs them ("Tabbed: Has basic controls plus...", `carousel-pattern.html:107-108`) | A adds them as row 29 says |

- **Measured (G):** the glue gives 0 history entries, a track that follows the selection, `slide` events, and a selection that follows scrolling, in all three engines. One residue: after a swipe moves the selection to slide 3, the roving `tabindex="0"` stays on dot 2. Setting `selectedTab` does not move Aria's `activeItem`, which decides the tab stop (`list-focus.ts:86-94`, `tab-list.ts:127`).

### 3. Rendering modes

- **Measured (server HTML, [`results/server-html.txt`](results/server-html.txt)):** B's server output has `inert="true"` on slides 2 and 3, and `tabindex="-1"` on the tablist and on all three tabs. Both come from Aria's host bindings: `[attr.inert]` is `!visible()` (`tab-panel.ts:49`), and a tab's `tabindex` is 0 only for the `activeItem` (`list-focus.ts:93`), which is first set in an `afterRenderEffect` (`tab-list.ts:137-139`). That effect does not run on the server. **This breaks ADR 0024 point 1 by itself.** Avoiding it would mean replacing Aria's own `inert` binding (inferred).
- **Measured (JavaScript off, all three engines):** B is styled and its dots still follow their fragments (track at 1041 px, slide 2 flush with the start edge). But slide 2 is then on screen and `inert`, which is the WCAG 1.3.1 case ADR 0024 rejects. Tab goes track, panel 1, and out, never reaching a dot. Chromium's accessibility tree with JavaScript off holds only panel 1. A has no `inert`, Tab reaches all three dots and both buttons, and the buttons do nothing (they need JavaScript; a residue row 29 would state).
- **Measured (C, JavaScript off):** with `ngTabContent`, every panel in the server HTML is `<!--container-->` only, the selected one included, because `DeferredContent` creates its view in an `afterRenderEffect` (`deferred-content.ts:56-63`). The no-JavaScript carousel shows three empty boxes. Without `ngTabContent`, Aria logs "ngTabPanel must have an ngTabContent structural directive to render." for each panel in dev mode (measured in all three engines). The content still renders.
- **Measured (before hydration):** A's dot click follows the fragment (+1 history). After hydration the observer moves `aria-current` to dot 2, and the `slide` output did not fire for that click (cause not pinned). B's dot click follows the fragment too. After hydration the replayed click (the tablist's `jsaction`) selects slide 2 and moves `inert` to slides 1 and 3. Neither variant logged an error, so nothing called `preventDefault()` during replay.
- **Measured (`hydrate never`):** A's dots keep working natively. `aria-current` stays on dot 1 for good, which becomes wrong once another slide is in view. Next slide does nothing. B stays in its server state for good: slides 2 and 3 `inert`, the picker unreachable by Tab, and the arrow keys only scroll the focused track.
- **Measured:** hydration logged no mismatch for any route.

### 4. Accessibility

- **Measured (axe 4.13.0, scoped to the carousel):** every page gets `heading-order` (moderate), because the page goes from `h1` to the slides' `h3`; Y gets it too. A adds `aria-allowed-role` (minor) on the 3 `article[role="group"]`. B, C and G add `aria-allowed-role` (minor) on `article[role="tabpanel"]`, 1 node, because axe skips the 2 inert panels. Either goes away if the slide is a `div`, which would change Yeti's example markup. The violation sets were the same with JavaScript held back.
- **Measured (keyboard, APG):** B meets the Tabs pattern's keys: one Tab stop on the selected tab, ArrowRight, Home and End move focus and select (Aria's default `selectionMode: 'follow'`, `tab-list.ts:106`), and Enter adds no history entry. Two things happen that the APG carousel does not describe: the slide panel itself is a Tab stop (`tabindex="0"`, `tab-panel.ts:48`, `private/tabs/tabs.ts:101`) and comes *before* the tablist, because Yeti puts the track before the dots; and the visible slide does not change when a key selects another one. A follows the APG's grouped carousel in that every picker control is a Tab stop (`carousel-pattern.html:110`), but its pickers are links, not buttons, the list has no group name (`:171-182`), and it marks the current dot with `aria-current`, not the APG's `aria-disabled` (`:182`). These are row 29's and ledger A11Y-4's stated deviations.
- **Measured (WebKit):** WebKit's Tab key skips links by default, so in Y and A, Tab never reaches a dot in WebKit (Tab went track, Previous, Next). B's tabs carry `tabindex`, so WebKit's Tab reaches the selected one. This is the one keyboard result that favours B. It holds only once the page is live: in B's server HTML every tab is `-1`.
- **Measured (Chromium tree over CDP, [`results/axtree-chromium.txt`](results/axtree-chromium.txt)):** see the table. In B the tabpanel's name comes from its tab ("Slide 1", `tab-panel.ts:50`), and the panels have no `aria-roledescription`, as the APG's tabbed carousel wants (`carousel-pattern.html:157`). Firefox and WebKit were read through Playwright's `ariaSnapshot()`, which lists the inert panels too, so it does not show what those engines expose.

## For the user

- **Styles:** both A and B keep Yeti's look with no package CSS: every `carousel.css` selector matches and the computed styles are the same as Yeti's own example. B changes the markup (tablist in place of `role="list"`, `role="none"` on each `li`).
- **`carousel.js`:** Aria Tabs replaces none of its behaviours. Clicks still add history entries, the keys select a tab without scrolling the track, there is no slide event, and the selection does not follow a swipe. A package directive of about 95 lines on top of Aria closes those gaps, and one roving-focus problem remains.
- **Rendering modes, the deciding cost:** Aria renders `inert` on every unselected slide and `tabindex="-1"` on every tab in the server HTML. So with JavaScript off, before hydration, and inside `hydrate never`, the picker cannot be reached by keyboard, and a slide scrolled into view is visible but inert. That is exactly what ADR 0024 point 1 forbids, and Aria's documented `ngTabContent` shape makes it worse: every slide is empty.
- **Accessibility once live:** B gets the APG Tabs keyboard model, named panels, a selected state, and in WebKit a picker that Tab reaches. A gets the APG slide roles, previous and next buttons, and a current marker that follows scrolling, but it keeps links where the APG wants buttons and three Tab stops in the picker. axe reports one minor role finding against each.
- **Trade-off:** to adopt B, ADR 0024 would have to be reversed or Aria's `inert` binding replaced, and the package would still write the scroll, history, and event code that A already needs. A keeps the native, script-free carousel and adds the APG pieces itself.
