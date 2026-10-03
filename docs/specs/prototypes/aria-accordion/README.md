# Prototype: Angular Aria Accordion for Yeti's `accordion`

Ticket: [29. Prototype: Angular Aria for the four items that keep a native pattern](../../issues/29-prototype-aria-for-the-native-pattern-items.md), item `accordion`. Built and measured 2026-10-02 by Claude Opus 5.5. **Throwaway code.** Nothing here is decided.

## Question

If Yeti's `accordion` is built on Aria Accordion (`ngAccordionGroup`, `ngAccordionTrigger`, `ngAccordionPanel`) instead of ticket 25 row 21's `details`/`summary` (ledger A11Y-11), do Yeti's styles still apply unchanged with no package CSS, does Aria cover what `details` does natively (Yeti has no accordion module), and what does it cost under ADR 0011's rendering modes and in accessibility?

## Setup

- **Workspace:** `D:/tmp/ngx-yeti-29-accordion/ws`. Source and config files were copied from `D:/tmp/ngx-yeti-18/ws` (no `node_modules`), then `npm install` was run. Installed: `@angular/core` 22.2.1, `@angular/aria` 22.2.1, `@angular/cdk` 22.2.1, Nx 23.2.1, `@axe-core/playwright` 4.13.0 (axe-core 4.13.0), Playwright 1.63.0. One production build, `outputMode: server`, with `provideClientHydration()` (in 22.2 this includes incremental hydration and event replay, as ticket 18 recorded). Zoneless.
- **Yeti:** `f52d1e8b9`, the ticket 18 tarball (`D:/tmp/ngx-yeti-18/yeti/yeti-css-7.0.0-alpha.0.tgz`). `src/styles.css` is ticket 18's global `@import` list, which includes `components/accordion/accordion.css`. ADR 0060's counted links were not used: the question is which selectors match, and how the CSS is loaded does not change that.
- **Browsers:** Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6, headless, 1000x900.
- **Routes** ([`src/pages.ts`](src/pages.ts), [`src/yeti-accordion.ts`](src/yeti-accordion.ts)). Every page uses the text of Yeti's `src/components/accordion/example.html`. Every page except `/` also has a second copy inside `@defer (hydrate never)`.
  - `/` **ref**: Yeti's `example.html` markup word for word, with no directives.
  - `/a` **(A)**: row 21. `[yetiAccordion]` adds the class. `details[yetiAccordionItem]` sets an `open` model from a `toggle` host listener. `name="faq"` is the consumer's.
  - `/b` **(B)**: Aria Accordion as its own docs write it (`accordion-group.ts:34-56`): `div[ngAccordionGroup].accordion > div > h3 > button[ngAccordionTrigger]`, then `div[ngAccordionPanel] > ng-template[ngAccordionContent] > p`. `[multiExpandable]="false"` takes the place of Yeti's shared `name`.
  - `/b2` **(B2, hybrid)**: the trigger on Yeti's `summary` and the panel as a `div` inside the `details`, with `[open]` bound to the trigger's `expanded`. This tests whether the trigger can sit on a `<summary>`.
  - `/b3`: B2 without the `[open]` binding.
  - `/b-open`: B with the first panel expanded from the start, to check what the server renders.

```sh
cd D:/tmp/ngx-yeti-29-accordion/ws
npx nx run ws:build
PORT=4791 NG_ALLOWED_HOSTS=localhost node dist/ws/server/server.mjs &
node tools/probe.mjs     # styles, behaviour, JS off, before hydration, hydrate never, axe -> results/probe.json
node tools/kb.mjs        # APG keyboard walk and Playwright aria snapshots -> results/kb.json
node tools/axtree.mjs    # Chromium's own accessibility tree over CDP -> results/axtree-chromium.json
node tools/summary.mjs; node tools/styles-diff.mjs
```

"Before hydration" holds `main-*.js` back with `page.route`, clicks, records, then releases it. Copies of the results are in [`results/`](results/). The full `probe.json` (380 KB) stays in the workspace.

## Results

The three engines agreed on every row except the one about `window.find()`.

| Point | (A) `details`/`summary` | (B) Aria Accordion (docs markup) | (B2) Aria trigger on `summary` |
| --- | --- | --- | --- |
| 1. Styles vs ref | identical: 0 property differences, same heights (124.9 px shut, 186.8 px open) | 13 of 14 selectors match nothing; only `.accordion` applies. 35 (shut) and 36 (open) property differences. No chevron, no row padding or surface, no line between rows, and `h3` and base `button` styles in their place. Package CSS needed to restore the look | every selector matches. Same heights. The only difference is that the panel padding lands on the panel `div` instead of the `p`, and the layout is the same |
| 2. Native `details` behaviour | all native | toggle (click, Enter, Space): full. Exclusivity: full (`multiExpandable=false`). Find-in-page and fragment opening: not provided. Open state with no script: not provided | toggle works only with `[open]` bound (B3 goes out of sync). Exclusivity comes from Aria, not `name`. Find and fragment: not provided |
| 3a. JavaScript off | opens, closes, one at a time by `name` | triggers do nothing, and every panel is empty in the server HTML | `details` opens to an empty panel. Both can be open at once |
| 3b. Before hydration | click opens at once. After hydration it stays open and the replayed `toggle` sets the model (`true,false`) | click does nothing until hydration, then the replayed click opens it | `details` opens empty at once. After hydration the replayed click fills it |
| 3c. `hydrate never` | works | dead: no listeners, empty panels | `details` opens, empty |
| 4. axe | 0 violations, shut or open | 0 | 0 |
| 4. Keyboard (APG) | Tab, Shift+Tab, Enter, Space. No arrows, Home, or End | Tab, Shift+Tab, Enter, Space, ArrowUp, ArrowDown, Home, End | same as B |
| 4. Tree (Chromium CDP) | `group` > `DisclosureTriangleGrouped "..." expanded=true/false` > `paragraph` | `heading` > `button "..." expanded`, then `region "..."` (labelled by the trigger) > `paragraph` | `group` > `button "..." expanded`, `region "..."` |

## Findings

### 1. Styles

- **Measured.** (A) matches ref in every property read on the container, items, summary, `summary::after`, panel, and content, in all three engines.
- **Measured.** For (B), the selectors that match nothing are: `.accordion > details + details`, `.accordion > details > summary` (and its `:hover` and `:focus-visible` forms), `.accordion > details[open] > summary`, `.accordion > details > :not(summary)`, `.accordion > details > :not(summary):last-child` (`accordion.css:16-38`), and the base layer's `details > summary`, `details > summary::after`, `details[open] > summary::after`, `details`, `details[open]`, and `details::details-content` (`base/media.css:63-123`). The chevron, the grid-row open animation, the summary padding, weight, and surface, the separators, and the panel margins all go. The trigger picks up Yeti's base `button` rules instead (`base/controls.css:24`: 1 px border, 4.35 px radius, light background, `inline-block`, about 390 px wide instead of full width), and its `h3` sets 29.2 px bold text (`base/typography.css:34`). Restoring Yeti's look on (B) would need package CSS that restates Yeti's rules against the new markup.
- **Measured.** (B2) keeps every Yeti selector, because the `details > summary` structure and `[open]` are still there.

### 2. What `details` does that Aria would have to replace (Yeti has no module: `manifest.json` `"js": null`)

- **Toggle on click, Enter, and Space.** (B) does all of it (measured; `accordion.ts:73-91`). In (B2) Aria's keydown handler calls `preventDefault` (`keyboard-event-manager.ts:34`), so the summary's own activation is suppressed: read, and measured in B3, where Enter set `aria-expanded=true` while the `details` stayed shut. Clicks are not prevented (`click-event-manager.ts:47`), so in B3 a click toggles both the `details` and Aria, and exclusivity then closes Aria's panel but leaves the native `details` open (measured). B2 works only because `[open]` follows `expanded`.
- **`name` exclusivity.** `multiExpandable=false` gives the same one-at-a-time result in (B) and (B2) (measured). The default is `true` (`accordion-group.ts:93`).
- **Find-in-page and fragment opening.** With (A), going to `/a#ans2` opened the second item in all three engines (measured). `window.find()` found the text everywhere, but it opened the `details` only in Firefox (measured). Chromium's and WebKit's find bar was not driven, because Playwright cannot reach it. In (B) and (B2), a closed panel's content is not in the DOM: `DeferredContent` creates the view only while it is visible (`deferred-content.ts:56-67`; read). So `window.find()` returned `false` and the fragment target did not exist (measured).
- **State announced with no script.** (A) relies on the platform's `expanded` (Chromium `DisclosureTriangleGrouped`, measured). (B) sets `aria-expanded` from Angular (`accordion-trigger.ts:46-54`), and the server writes it (measured).

### 3. Rendering modes

- **Measured.** The server HTML for (B) has empty `div[role=region][inert]` panels ([results/server-main.html.txt](results/server-main.html.txt)). Even `/b-open`, with `expanded=true` from the start, renders `aria-expanded="true"` above an empty, non-inert panel. **Read:** `DeferredContent` renders from an `afterRenderEffect` (`deferred-content.ts:56`), which does not run on the server. With JavaScript off, (B) shows two styled-as-button headings that do nothing.
- **Measured.** Before hydration, a click on (B) has no visible effect. Event replay applies it once `main.js` runs, so the panel opens late. (A) opens at once, and the replayed `toggle` reaches the model.
- **Measured.** Inside `@defer (hydrate never)`, (B) never gets its listeners and stays shut. (B2)'s `details` opens natively but shows an empty panel. (A) works.
- **Inferred.** (B) has `[expanded]` and `inert` bindings that hydration re-applies. Ticket 18's finding that static attributes are put back does not arise here, because these are bindings, not static attributes. This was not measured separately.

### 4. Accessibility

- **Measured.** axe found 0 violations on `#live` for ref, A, B, B2, and B3, shut and open, in all three engines.
- **Measured.** Keyboard walk ([results/kb.json](results/kb.json)): (A) toggles with Enter and Space, and Tab moves between summaries. Arrows, Home, and End do nothing, which the APG marks as optional. (B) and (B2) add ArrowDown and ArrowUp between triggers (no wrap, `wrap` defaults to `false`, `accordion-group.ts:102`) and Home and End. Every trigger stays in the Tab order (`tabIndex` 0 for every focusable trigger, `accordion.ts:196-198`).
- **Measured.** Roles. (A) is a `group` per `details`, with a disclosure-triangle summary. It has no heading, no `aria-controls`, and no region, which is A11Y-11. (B) is the APG structure: a heading holding a button with `aria-expanded` and `aria-controls`, and a `region` labelled by the trigger. Chromium leaves the closed, inert region out of its tree. (B2) has the button and region roles, but no heading, and `role="button"` replaces the summary's native mapping. Playwright's `ariaSnapshot` does not map `summary` (it shows text), so the A rows come from CDP.

## For the user

- (B) as Aria documents it changes Yeti's markup: 13 of the 14 accordion and base `details` selectors stop matching, so the chevron, padding, separators, and open animation would need package CSS that restates Yeti's styles.
- Putting the Aria trigger on Yeti's `summary` (B2) keeps every Yeti style, but it only stays in sync when `[open]` is bound to Aria's `expanded`, and the shared `name` gives way to `multiExpandable=false`.
- With either Aria variant, panel content is never in the server HTML, even when expanded. JavaScript off and `hydrate never` therefore give dead (B) or empty (B2) panels, and find-in-page and fragment links cannot reach closed content. `details` (A) works in all three cases.
- Aria adds what the APG accordion asks for and (A) lacks: a heading, a button, `aria-controls`, a labelled region, and arrow, Home, and End keys. axe passes all variants equally.
- Yeti has no accordion module, so Aria replaces no Yeti JavaScript. What it would replace is the platform's own `details` behaviour.
