# Prototype: fitting Aria Accordion to Yeti's `details`/`summary` by composition, and a heading without Aria

Ticket: [30. Prototype: fitting Angular Aria to Yeti by directive composition](../../issues/30-prototype-fitting-aria-by-directive-composition.md), point 2 (`accordion`). Built and measured 2026-10-02 and 2026-10-03 by Claude Opus 5.5. **Throwaway code.** Nothing here is decided.

## Question

Can Aria's trigger on Yeti's `<summary>` keep the panel content in the server HTML, keep the summary's native activation or stay in sync through `open`, and still let find-in-page and fragment links open a closed item (candidate **C**)? And does a heading inside Yeti's `<summary>`, with no Aria, keep Yeti's styles and expose a heading in all three engines, which would close ledger row A11Y-11 without Aria (candidate **D**)? Both are compared with ticket 29's (A), plain `details`/`summary`.

## Setup

- **Workspace:** ticket 29's `D:/tmp/ngx-yeti-29-accordion/ws`, extended in place. Ticket 29's routes are unchanged, and the new pages and tools carry a `30` suffix. Angular, `@angular/aria`, and CDK 22.2.1, `@angular/build` 22.2, Playwright 1.63.0 (Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6), axe-core 4.13.0, Yeti `f52d1e8b9` (ticket 18's tarball). `outputMode: server`, `provideClientHydration()` (incremental hydration and event replay included), zoneless. Headless at 1000x900, except for the UIA runs, which are headed.
- **Production build** on port 4893 for every probe. A **development build** (`--optimization=false`, so `ngDevMode` is on) on port 4894 was used only to collect dev-mode console warnings. Both servers were stopped at the end.
- **Routes** ([src/pages-30.ts](src/pages-30.ts), [src/yeti-accordion-c.ts](src/yeti-accordion-c.ts)). Each uses the text of Yeti's `example.html` in `#live` and again inside `@defer (hydrate never)` in `#never`. `/` (ref) and `/a` (A) are ticket 29's.
  - `/c` **(C)**: Aria by composition, with content projected directly.
  - `/c-noinert` **(C-noinert)**: C, with Aria's `inert` overridden by the hosting directive.
  - `/c-open`: C with the first item `[expanded]="true"`, to check what the server writes.
  - `/d` **(D)**: (A) with `<summary><h3>...</h3></summary>`.
  - `/d-role` **(D-role)**: (A) with `<summary><span role="heading" aria-level="3">...</span></summary>`.

```sh
cd D:/tmp/ngx-yeti-29-accordion/ws
npx nx run ws:build
PORT=4893 NG_ALLOWED_HOSTS=localhost node dist/ws/server/server.mjs &
node tools/probe30.mjs; node tools/summary30.mjs     # states, find, fragment, axe, styles -> results30/
node tools/kb30.mjs; node tools/axtree30.mjs; node tools/styles-diff30.mjs
node tools/prehyd-trace30.mjs; node tools/prehyd-fragment-trace30.mjs; node tools/structure30.mjs
node tools/headed30.mjs firefox d 30 &  powershell.exe -File tools/uia30.ps1   # engine tree over UIA
```

"Before hydration" holds back `main-*.js` with `page.route`, acts, records, then releases the script, as ticket 29 did. In the results, "visible" means `checkVisibility()`, a height above 0, and no `[inert]` ancestor.

## C: the composition

Four package directives host Aria's (57 lines of code without comments, including the C-noinert variant of the panel; about 45 with one panel directive):

```ts
@Directive({ selector: '[yetiAccordion]', host: { class: 'accordion' },
  hostDirectives: [{ directive: AccordionGroup, inputs: ['multiExpandable', 'wrap', 'disabled'] }] })
export class YetiAccordionC {}

@Directive({ selector: 'summary[yetiAccordionTrigger]',
  hostDirectives: [{ directive: AccordionTrigger,
    inputs: ['panel: yetiAccordionTrigger', 'expanded', 'disabled'], outputs: ['expandedChange'] }] })
export class YetiAccordionTrigger {}

@Directive({ selector: '[yetiAccordionPanel]', exportAs: 'yetiAccordionPanel',
  hostDirectives: [{ directive: AccordionPanel, inputs: ['id'] }] })
export class YetiAccordionPanel { readonly aria = inject(AccordionPanel); }

@Directive({ selector: 'details[yetiAccordionItem]',
  host: { '[attr.open]': "expanded() ? '' : null", '(toggle)': 'onToggle()' } })
export class YetiAccordionItemC implements AfterContentInit {
  protected readonly trigger = contentChild(AccordionTrigger);
  protected readonly expanded = computed(() => this.trigger()?.expanded() ?? false);
  readonly #details = inject<ElementRef<HTMLDetailsElement>>(ElementRef).nativeElement;
  readonly #openAtStart = this.#details.hasAttribute('open');
  ngAfterContentInit() { if (this.#openAtStart) { this.trigger()?.expanded.set(true); } }
  protected onToggle() { this.trigger()?.expanded.set(this.#details.open); }
}
```

```html
<div yetiAccordion [multiExpandable]="false">
  <details name="faq" yetiAccordionItem>
    <summary [yetiAccordionTrigger]="p1.aria" [(expanded)]="e1">Does Yeti need JavaScript?</summary>
    <p yetiAccordionPanel #p1="yetiAccordionPanel" id="ans1">Almost never. ...</p>
  </details>
  ...
```

Only public Aria API is used: the directives, their inputs, and the `expanded` model. `contentChild(AccordionTrigger)` finds the trigger when it is a host directive (measured: the sync works).

### C.1 Content in the server HTML: direct projection

- **Read.** `ngAccordionContent` is a structural directive on `ng-template` (`accordion-content.ts:31`) hosting `DeferredContent`, which creates the view in an `afterRenderEffect` (`deferred-content.ts:56-67`). `AccordionPanel` needs neither: its only use of the content is a dev-mode check that warns when there is no `ngAccordionContent` (`accordion-panel.ts:92-105`, `private/utils/violations.ts:10-16`).
- **Measured.** With the content placed directly in the panel element, the server HTML has every panel's content, in `#live` and in `#never`. `/c-open` writes `open=""` on the `details`, `aria-expanded="true"`, and a panel without `inert` ([results/server-c-and-c-open.html.txt](results/server-c-and-c-open.html.txt)). Every trigger has `tabindex="0"`, so the roving-`tabindex` problem of ticket 29 (A5) does not arise here (read: the accordion pattern makes every focusable trigger 0, `private/accordion/accordion.ts:196-198`).
- **Measured.** Aria still writes `inert="true"` on every closed panel in the server HTML (`accordion-panel.ts:55`). That decides most of what follows.
- **Measured (dev build).** Each hydrated panel logs `Violations found on element` and `ngAccordionPanel must have an ngAccordionContent to render.` as console warnings in all three engines: 4 on `/c` and `/c-noinert`, and 2 on `/c-open`. The production build logs nothing. The `#never` copy logs nothing, because it never hydrates.

### C.2 Keeping `details[open]` and Aria's `expanded` in sync, and the summary's Enter and Space

- **Read.** Aria's group handles `keydown` and `click` on its host (`accordion-group.ts:64-68`). Its keydown manager toggles on Enter and Space (`private/accordion/accordion.ts:73-81`) and calls `preventDefault`, which suppresses the summary's own activation (ticket 29, B3). Clicks are not prevented, so a click toggles both the native `details` and Aria.
- **The composition:** `open` follows `expanded` through an attribute binding on the `details` (an attribute, so the server writes it), and the `details`' `toggle` sets `expanded`. After hydration, Enter and Space therefore work through Aria, and the binding moves `open` along with them.
- **Measured, all three engines, after hydration:** a click, Enter, and Space each open and close the item. One at a time holds, through both `multiExpandable=false` and the consumer's `name`. ArrowDown, ArrowUp, Home, and End move focus between summaries (no wrap), and Tab and Shift+Tab reach each summary. The state output always matches `open`. No console errors.
- **Measured: the bindings fought at hydration, and one fix holds.** Run 1 ([results/probe-summary-run1.txt](results/probe-summary-run1.txt)) set `expanded` from `event.newState`. A click before hydration opened the `details` natively. After hydration it was closed again in Chromium and WebKit, and open in Firefox. [results/prehyd-trace.txt](results/prehyd-trace.txt) shows why. **Hydration writes every host binding once more** (`open=null`, `aria-expanded`, `inert`), so the `[attr.open]` binding removes the `open` the visitor set, and the `toggle` event it causes is queued behind the replayed events. Run 2 added `#openAtStart`, which reads `open` in the constructor (before the first binding pass) and hands it to Aria in `ngAfterContentInit`, and `onToggle`, which now reads the live `open` instead of `newState`. With both, a click before hydration stays open, `expanded` becomes `true`, and `inert` is removed, in all three engines.
- **Known gap (inferred from the same mechanism, not measured).** An item that the server rendered open and that the visitor closes before hydration would be reopened, because no public API tells a hydrating directive apart from a fresh client render.

### C.3 `inert` inside a closed `details`: find-in-page and fragment links

`window.find('Anything Yeti does not declare')` looks for text in the second, closed item. Fragment means loading `#ans2`, the second panel's `id`.

| State | Engine | (A)/(D) | C (Aria's `inert`) | C-noinert |
| --- | --- | --- | --- | --- |
| hydrated, `window.find()` | Chromium | found, stays shut | **not found** | found, stays shut |
| | Firefox | found, **opens** | **not found** | found, opens, `expanded=true` |
| | WebKit | found, stays shut | found, stays shut | found, stays shut |
| hydrated, fragment | all three | opens | opens; `toggle` sets `expanded=true` and removes `inert` | opens, `expanded=true` |
| JavaScript off, `window.find()` | as hydrated | as hydrated | Chromium and Firefox not found; WebKit found, shut | as (A) |
| JavaScript off, fragment | all three | opens | **opens, but the panel stays `inert`** | opens, panel usable |
| before hydration, fragment | Firefox | opens at once | opens, `inert` until hydration, then `expanded=true` | opens, then `expanded=true` |
| | Chromium, WebKit | opens only when `main.js` has run | **ends shut** (`false,false`) | **ends shut** |

All cells were measured ([results/probe-summary.txt](results/probe-summary.txt)).

- **Measured.** Aria's `inert` stops `window.find()` from finding closed content in Chromium and Firefox. It does not stop a fragment link from opening the `details` in any engine. With JavaScript off, inside `hydrate never`, and before hydration, though, the opened panel keeps `inert`: the text is on screen but cannot be selected or clicked, and it is not in the accessibility tree.
- **Measured.** Chromium and WebKit hold the fragment reveal back until the deferred `main.js` has run, for (A) and (D) as well. In C the reveal then lands inside hydration's first pass: after the constructor has read `open`, and before the `[attr.open]` binding removes it again. The queued `toggle` arrives with `open=false` ([results/prehyd-fragment-trace.txt](results/prehyd-fragment-trace.txt)). This is a race between the browser and the binding. It does not happen on a page that has finished loading (the "hydrated" row).
- **Not measurable.** Chromium's and WebKit's find bar cannot be driven: Playwright has no access to browser UI. `window.find()` is the only scripted find, and it opened a `details` only in Firefox, as in ticket 29. Whether the real find bar opens a closed item (Chromium's `hidden=until-found` and auto-expanding `details` behaviour) under Aria's `inert` was therefore not measured. It is **inferred** to behave like `window.find()` in Chromium, because the HTML spec lets user agents skip inert nodes in find-in-page (from memory; not checked in this run).

### C.4 Overriding Aria's `inert` (C-noinert): the bindings fight

- **Read.** Angular's guide: "components with `hostDirectives` can override any host bindings specified by a host directive" (`directive-composition-api.md:131`).
- **Measured.** The override `host: { '[attr.inert]': 'null' }` removes `inert` from the server HTML. It also removes it with JavaScript off, inside `hydrate never` (the opened panel is visible and usable), and before hydration, all three engines. The trace shows both bindings writing at hydration, with the override written last.
- **Measured.** After hydration, the override lasts only until Aria's own value next changes. Open item 1, open item 2 (which closes item 1), and item 1's panel has `inert="true"` again, in all three engines. **Inferred:** each binding writes the attribute only when its own value changes, so a constant override wins only on the first pass. Closed panels the visitor has toggled are then inert again, so `window.find()` in Chromium and Firefox can no longer reach them.
- **Inferred, not tried.** A complete override would bind `inert` to a value that changes whenever Aria's does, for example `[attr.inert]` bound to the same `visible()` signal with the opposite meaning. That makes the hosting directive restate Aria's binding.

### C.5 What C adds over plain `<details>`

- **Measured: accessibility tree (Chromium CDP).** (A) has `group` > `DisclosureTriangleGrouped "..." expanded` > text, then `paragraph`. C has `group` > `button "..." expanded`, then `region "..."` (named by the trigger through `aria-labelledby`), and `aria-controls` points at the panel. The closed panel is not in the tree. **Firefox (UIA):** C has `Button expand=Expanded`, then `Group [region] "Does Yeti need JavaScript?"` > text ([results/uia.txt](results/uia.txt)). C has no heading.
- **Measured: keyboard.** ArrowDown, ArrowUp, Home, and End between summaries, which the APG marks optional. Enter, Space, Tab, and Shift+Tab are the same as (A).
- **Read.** C replaces the summary's native role with `role="button"`. MDN lists "Permitted ARIA roles: No role permitted" for `summary`. axe did not flag it (measured).

## D: a heading inside the summary, with no Aria

```html
<details name="faq" yetiAccordionItem (openChange)="s1.set($event)">
  <summary><h3>Does Yeti need JavaScript?</h3></summary>
  <p id="ans1">Almost never. ...</p>
</details>
```

The directives are ticket 29's (A) unchanged: 16 lines, a class and a `toggle` listener. D-role puts `role="heading" aria-level="3"` on a `span` instead.

- **Valid HTML (read).** MDN gives `summary`'s permitted content as "Phrasing content, optionally intermixed with Heading content", and Yeti's own docs advise it: "if the rows are section titles, put a heading element inside each one" (`src/components/accordion/docs.md:36`). **Measured:** the browser's parse of the server HTML has the same element tree as the hydrated DOM, in all three engines.
- **Styles (measured).** Every selector of `accordion.css` and of the base layer's `details` rules matches, as in (A). The summary's own properties are identical to ref. But the `h3` brings Yeti's base heading rule (`base/typography.css:25-34`): 29.17 px at weight 700, where the summary text is 17.42 px at weight 600. Each row grows from 60.9 px to 68.4 px (the accordion from 124.9 px to 139.7 px shut), and the chevron moves because the text is wider. This is the same in all three engines ([results/styles-diff.txt](results/styles-diff.txt)). D-role has 0 property differences and the same heights, because Yeti has no rule for `[role=heading]`. An `h3` that should look like ref needs package or consumer CSS (for example `summary > h3 { font: inherit; }`, not tried) or a heading class. Yeti has no such class (searched `src/`: only component-scoped `font: inherit` rules).
- **Accessibility tree.**
  - **Chromium (CDP), measured:** D and D-role both give `DisclosureTriangleGrouped "..." expanded=true/false` > `heading "..." level=3`. The summary stays the expandable control, and the heading is its child, not flattened.
  - **Firefox (Windows UIA, headed), measured:** D gives `Button "..." expand=Expanded/Collapsed` > `Text` with localized type "overskrift" (heading) for every item. For D-role, the item that was clicked open showed "tekst" (plain text) instead of a heading in two runs, while the other items showed headings. The cause was not isolated. UIA did not report the heading level (`AriaProperties` was empty).
  - **WebKit: not inspected.** Playwright's WebKit build on Windows exposed nothing under its window to UIA, and Playwright 1.63 has no engine accessibility API (`page.accessibility` is gone). Chromium also exposed no web content to this UIA walk (cause not investigated), so CDP was used for it.
  - **Playwright `ariaSnapshot`** (Playwright's own computation, the same in every engine, not an engine tree): `group` > `heading "..." [level=3]`, then `paragraph`.
  - **Not measured:** whether a screen reader's heading navigation (NVDA H, JAWS H, VoiceOver rotor) stops on these headings. **Read:** MDN warns that some browsers give `summary` a button role with presentational children, which would remove the heading. Chromium and Firefox did not do that here.
- **Rendering modes (measured):** the same as (A) in every state. JavaScript off: opens, closes, one at a time by `name`. Before hydration: a click opens at once and the replayed `toggle` reaches the model (`true,false`). Fragment before hydration: opens (in Chromium and WebKit once `main.js` has run). `hydrate never`: works. `window.find()` and fragment: as (A).
- **axe and keyboard (measured):** 0 violations, shut and open, in all three engines. Enter, Space, Tab, and Shift+Tab, with no arrows, Home, or End: the same as (A).

## Hydration constraints (`adev/src/content/guide/hydration.md:97-135`, `:214-216`)

- **Same DOM on server and client, measured:** for `/a`, `/c`, `/c-noinert`, `/c-open`, `/d`, `/d-role`, and `/b2`, the element tree of `#live` (tags, attribute names, text and comment nodes) parsed from the server HTML with JavaScript off equals the tree after hydration, in all three engines ([tools/structure30.mjs](tools/structure30.mjs)). Projecting content directly into Aria's panel does not change the structure between server and client. With `ngAccordionContent` (B2), the closed tree is also the same, and the content is added later through `createEmbeddedView` (read, `deferred-content.ts:61`).
- **Hydration errors and warnings, measured:** no NG0500-series error and no console error or warning in the production build, for every variant and engine. The development build adds only Aria's `ngAccordionContent` warning on C (C.1).
- **Direct DOM manipulation, read:** C's `YetiAccordionItemC` reads `hasAttribute('open')` and `.open` on its own host element. It writes nothing, queries nothing, and never touches `document`. The guide names "accessing the `document`, querying for specific elements, and injecting additional nodes" (`hydration.md:105`), and a read of the host is not among them. Whether it counts is for the user to judge. Aria itself sets `type="button"` only on `<button>` triggers (`accordion-trigger.ts`, constructor), which does not apply to `summary`. D's package code does no DOM access.
- **Valid HTML:** D is valid (above). C's `role="button"` on `summary` is not permitted by ARIA in HTML (read, MDN), but that is a conformance rule, not a parser change, and the trees matched.
- **No platform branches:** none of the code uses `isPlatformBrowser` or `isPlatformServer`.
- **Measured consequence for any `[open]` binding:** hydration writes every host binding once more (C.2). An `open` binding therefore undoes a toggle made before hydration unless the directive reads the DOM first, as C's `#openAtStart` does.

## Comparison

All engine rows hold in Chromium, Firefox, and WebKit unless noted. All measured unless marked.

| | (A) `details`/`summary` (ticket 29) | (C) Aria by composition (`/c`; C-noinert where different) | (D) `<summary><h3>` (D-role: `span[role=heading]`) |
| --- | --- | --- | --- |
| Package code | 16 lines | about 45 lines (57 with both panel variants), plus Aria | 16 lines (same as A) |
| Yeti selectors and computed styles vs ref | identical | identical (panel on the `p`) | selectors identical. `h3`: 29.17 px / 700 text, rows +7.4 px. D-role: identical |
| Panel content in server HTML | yes | yes, but closed panels `inert="true"` (C-noinert: no `inert`) | yes |
| JavaScript off | works | opens and closes, but the content stays `inert` (C-noinert: works) | works |
| Before hydration, click | opens at once, kept | opens at once (`inert` until hydration), kept after the run 2 fix | as A |
| Before hydration, fragment | opens | Firefox: opens. Chromium, WebKit: **ends shut** (race with the `[attr.open]` binding) | as A |
| `hydrate never` | works | opens, content stays `inert` (C-noinert: works) | works |
| After hydration: click, Enter, Space | native | through Aria, `open` kept in sync | native |
| Arrows, Home, End | none | yes (APG optional) | none |
| `window.find()` on closed text | found; opens only in Firefox | Chromium, Firefox: **not found**; WebKit: found, shut (C-noinert: as A, until an item has been toggled) | as A |
| Fragment link, loaded page | opens | opens, Aria follows | opens |
| Tree (Chromium CDP) | `DisclosureTriangleGrouped` expanded, no heading | `button` expanded + `aria-controls`, labelled `region`, no heading | `DisclosureTriangleGrouped` expanded > `heading` level 3 |
| Tree (Firefox UIA) | not run (inferred as D without the heading) | `Button` expand + `Group [region]` | `Button` expand > heading (D-role: lost on the clicked item) |
| Tree (WebKit) | not inspectable | not inspectable | not inspectable |
| axe | 0 | 0 (`role` on `summary` not flagged) | 0 |
| Console, prod / dev | 0 / 0 | 0 / 2 warnings per hydrated panel | 0 / 0 |
| Server/client DOM tree | same | same | same |

## For the user

- **Aria can be fitted to Yeti's `details`/`summary` by composition**, in about 45 lines of package code. The content can be projected directly, with no `ngAccordionContent`, so it is in the server HTML. Every Yeti style holds, every trigger is reachable by Tab, and Enter and Space stay working through an `open` binding kept in sync both ways. The cost is a development-mode Aria warning on every panel.
- **What stays unsolved in C is Aria's `inert`.** It keeps opened content inert with JavaScript off, inside `hydrate never`, and before hydration, and it hides closed text from `window.find()` in Chromium and Firefox. Overriding it from the hosting directive works only until the item is first toggled after hydration.
- **The `open` binding fights hydration.** Hydration writes it once more and undoes a visitor's earlier toggle. Reading `open` first fixes the click case. A fragment link followed before hydration still ends shut in Chromium and WebKit, and closing an item that started open is not handled.
- **D (an `h3` inside `summary`, no Aria) needs no new package code.** It keeps every Yeti selector and every rendering mode. It exposes a level-3 heading inside the still-expandable summary in Chromium (CDP) and Firefox (UIA). WebKit's tree could not be inspected, and no screen reader was run. The `h3` picks up Yeti's heading size (29 px, bold, rows 7 px taller), so matching ref needs a CSS rule. `span[role=heading]` matches ref exactly, but Firefox reported no heading role on the item that was clicked open.
- **C adds over (A) and (D):** arrow, Home, and End keys (APG optional), a labelled `region`, and `aria-controls`. (D) adds the heading the APG asks for, which C does not provide.
