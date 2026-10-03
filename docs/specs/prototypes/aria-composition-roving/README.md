# Prototype: hosting Aria's Toolbar and Tabs to fix the server HTML (roving focus)

Ticket: [30. Prototype: fitting Angular Aria to Yeti by directive composition](../../issues/30-prototype-fitting-aria-by-directive-composition.md), point 1. Built and measured 2026-10-02 and 2026-10-03 by Claude Opus 5.5. **Throwaway code.** Nothing here is decided.

## Question

Can the package's directives, hosting Aria's (`yetiButtons`/`yetiButton` over `ngToolbar`/`ngToolbarWidget`; `yetiTabs`/`yetiTabList`/`yetiTab`/`yetiTabPanel` over `ngTabs`/`ngTabList`/`ngTab`/`ngTabPanel`), give the server HTML exactly one Tab stop (the first widget, or the selected tab), hand over to Aria's roving value after hydration without the two bindings fighting, and keep `inert` off every panel and slide in the server HTML? For `buttons`, can a busy button keep `aria-disabled="true"`, and can a consumer's static `role="group"` be kept from overriding `toolbar`? For the carousel, how much of ticket 29's glue is still needed? All of this must respect the hydration constraints (`adev/src/content/guide/hydration.md:97-135`, `:214-216`).

## Setup

- **Workspace:** ticket 29's carousel workspace, `D:/tmp/ngx-yeti-29-carousel/ws`, with new files only: `src/app/r30/` (copied here as [`src/`](src/)), four new routes (`/r30-buttons`, `/r30-tabs`, `/r30-carousel`, `/r30-never`), two reference pages ([`public/`](public/)), and [`tools/probe30.mjs`](tools/probe30.mjs) plus [`tools/summarize30.mjs`](tools/summarize30.mjs). Ticket 29's routes are unchanged. This workspace was used because it already loads every Yeti stylesheet (`button`, `buttons`, `tabs`, `carousel`) and is a **development build**, so Aria's dev-mode checks and Angular's hydration warnings are active.
- Angular, `@angular/aria`, and `@angular/cdk` 22.2.1; zoneless; `provideClientHydration()` (incremental hydration and event replay included); `outputMode: server`. Playwright 1.63.0 (Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6, headless); axe-core 4.13.0 through `@axe-core/playwright`, scoped to `[data-testid]`.
- **Yeti** `f52d1e8b9`. Markup is Yeti's own: `buttons/example.html` and the docs' busy example, `tabs/example.html`, and `carousel/example.html` (with ticket 29's tablist changes: `role="none"` on each `li`, a name on the `ol`). References: ticket 29's `ref-buttons.html`, and `tabs/example.html` verbatim with and without `tabs.js` ([`public/`](public/)).
- **Sources read:** Aria at `github.com/angular/components` `708d4c6e2` (`NC/src/aria/...`); Angular at `5db6fc4453` (`NG/...`).

```sh
cd D:/tmp/ngx-yeti-29-carousel/ws
NX_DAEMON=false node_modules/.bin/nx build ws
NG_ALLOWED_HOSTS=localhost PORT=4437 node dist/ws/server/server.mjs &
node tools/probe30.mjs chromium firefox webkit   # results/r30-<engine>.json
node tools/summarize30.mjs                       # results/r30-summary.txt
```

States: **JS off** is a context with `javaScriptEnabled: false`. **Before hydration** holds `main.js` back with `page.route`, then walks Tab and runs axe, then releases it. **`hydrate never`** is `/r30-never`, all three items inside `@defer (hydrate never)`. **Hydrated** waits for Aria's `data-active="true"`. A `MutationObserver` added by `addInitScript` records `tabindex`, `inert`, `hidden`, `role`, `aria-disabled`, `aria-selected`, and `aria-pressed` from first paint, with old values. A "flip" is a value that comes back within one window (hydration, or one key press). Raw summary: [`results/r30-summary.txt`](results/r30-summary.txt). Server HTML: [`results/server-*.html`](results/).

## The composition

The mechanism, the same for all three items (read): a host directive's host bindings run before the host's (`NG/adev/src/content/guide/directives/directive-composition-api.md:122-131`; order in `NG/packages/core/src/render3/features/host_directives_feature.ts:76-86`), and an attribute binding writes only when its own value changes (`NG/packages/core/src/render3/instructions/attribute.ts:34`). So the package's `[attr.tabindex]` wins on the first pass (server, and the client's first pass). After that, it hands over by giving the same value as Aria's, so neither binding has anything left to override.

Hand-over without a platform check: Aria's active item is private (`activeItem: signal(undefined)`, `NC/src/aria/toolbar/toolbar.ts:96`, `NC/src/aria/tabs/tab-list.ts:127`). It is first set in an `afterRenderEffect` that never runs on the server (`toolbar.ts:103`, `tab-list.ts:137-139`). The public `active()` of each widget or tab (`toolbar-widget.ts:85`, `tab.ts:76`) is therefore `false` everywhere until Aria is live. The package reads "no item active yet" as "use the server value", which is the same value on the server and on the client until Aria acts. No `isPlatformBrowser`, no `afterNextRender` flag, and no private API.

```ts
// yetiButton (src/roving.ts:27-50), hosting ngToolbarWidget
hostDirectives: [{ directive: ToolbarWidget, inputs: ['disabled: busy'] }],
host: { '[attr.tabindex]': 'tabIndex()', '[attr.aria-busy]': 'busy() ? "true" : null', ... },
tabIndex = computed(() => this.#group.ariaLive()
  ? (this.widget.active() ? 0 : -1)
  : (this.#group.buttons()[0] === this ? 0 : -1));
// yetiButtons (src/roving.ts:11-25), hosting ngToolbar
host: { '[attr.role]': '"toolbar"' },
ariaLive = computed(() => this.buttons().some((b) => b.widget.active()));

// yetiTab (src/roving.ts:83-99): the same, with the server stop = the selected tab, else the first.
// yetiTabPanel (src/roving.ts:101-114): '[attr.inert]' and '[attr.hidden]' = ariaLive() && !panel.visible()
// yetiCarouselSlide (src/roving.ts:116-126): '[attr.inert]' only, never hidden.
```

Package code: `buttons` 2 directives, about 25 lines, of which about 12 do the override. `tabs` 4 directives, about 45 lines, of which about 20 do the override. The carousel reuses `yetiTabList` and `yetiTab`, adds `yetiCarouselSlide` (about 10 lines), and keeps the glue (66 non-blank lines, [`src/carousel-glue.ts`](src/carousel-glue.ts)).

## Results

Every row held in all three engines, except where a row names an engine. All are **measured** unless tagged.

### Server HTML (curl, and identical in every engine with JavaScript off)

| | `buttons` | `tabs` | carousel picker |
| --- | --- | --- | --- |
| Tab stops among items | 1 per toolbar: the first widget `tabindex="0"`, the rest `-1`; toolbar `-1` | the selected tab `0`, the other `-1`; panel 1 `0` (Aria's), panel 2 `-1` | dot 1 `0`, dots 2-3 `-1`; slide 1 `0` (Aria's) |
| `inert` | none | **none on either panel**, and no `hidden` | **none on any slide** (ADR 0024 point 1 holds) |
| Other | `role="toolbar"` on all three groups, including the one written `role="group"` and the one bound `[attr.role]="'group'"`; busy Export `aria-disabled="true" aria-busy="true"` | `aria-selected="true"` on Profile; ids are the consumer's (`tab-profile`, `panel-profile`) because `id` is exposed as an input | `aria-selected="true"` on dot 1 |

### Per state

| State | `buttons` | `tabs` | carousel picker |
| --- | --- | --- | --- |
| **JS off** | Tab: Save, Bold, One, out. Exactly one stop per toolbar | Tab: Profile, panel Profile, out. Both panels on screen | Tab: track, slide 1, dot 1, out. All slides reachable by scrolling, none inert. In WebKit dot 1 is reached too, because it carries an explicit `tabindex` |
| **Before hydration** (`main.js` held) | same as JS off; axe: 0 violations | same; axe 0 | same; axe: `aria-allowed-role` (minor) on the 3 `article[role=tabpanel]`, `heading-order` (page artefact, also on Yeti's page) |
| **`hydrate never`** | same as JS off, for good. Arrow keys do nothing (no Aria behaviour) | same, for good. All panels stay on screen, ArrowRight does nothing | same, for good. Axe as before hydration |
| **Hydrated** | Aria's roving takes over: one stop per toolbar; ArrowRight, ArrowRight, ArrowRight wraps; End, Home, ArrowLeft wrap; Space toggles `aria-pressed`; Tab leaves; Shift+Tab returns to the remembered widget. The busy Export is reached by the arrows and is `aria-disabled="true"` when focused. axe 0 | ArrowRight selects Billing; Tab goes to panel Billing; Shift+Tab back; Home and End. The unselected panel is `hidden` + `inert` (`checkVisibility()` false). axe 0 | ArrowRight, End, Home move the stop and the selection; the glue scrolls the track; 0 history entries for a dot click; axe: `aria-allowed-role` (minor) on the one non-inert slide, `heading-order` |

### Hand-over: do the bindings fight?

- **Measured, `tabindex` and `inert`:** from releasing `main.js` to settled, `tabindex` changed on **no** element in any engine. The writes Angular and Aria made at hydration were same-value (`buttons` 35 of 43 records, `tabs` 18 of 22, carousel 31 of 36). The only changes were the intended ones: `inert` (and for `tabs`, `hidden`) added to the unselected panels and slides once Aria went live. No value came back.
- **Measured, `role` flips at hydration in `buttons`:** on the two groups with a static `role="group"`, the observer saw `toolbar -> group -> toolbar` during hydration in all three engines. **Read:** hydration re-applies the element's merged static attributes to the claimed node (`NG/packages/core/src/render3/instructions/shared.ts:599`, `NG/packages/core/src/render3/dom_node_manipulation.ts:141-145`), where the template's `role="group"` beats Aria's static `role: 'toolbar'` (`NC/src/aria/toolbar/toolbar.ts:49`). The package's `[attr.role]` binding then writes `toolbar` again. **Inferred:** both writes happen in one synchronous task, so nothing paints `group`. A bound `[attr.role]="'group'"` from the consumer did not flip, and the package's binding still won (server and live `role="toolbar"`). The static role cannot be removed from the DOM before hydration re-applies it, but it does not survive hydration.
- **Measured, key presses:** in `buttons` and `tabs`, no attribute flipped within a key press in any engine. Aria's binding and the package's change together, and the second write is the same value.
- **Measured, carousel key presses in Firefox and WebKit:** End and Home (Firefox), and Home (WebKit), flipped `aria-selected`, `tabindex`, and `inert` within one key press (for example `tab-2.aria-selected false -> true -> false`). In Firefox, the selection went back to the previous slide. With `reducedMotion: 'reduce'` the same keys flipped nothing in any engine. **Inferred:** the cause is the glue's own `IntersectionObserver` seeing the old slide during the smooth scroll and setting `selectedTab` back. That is the glue against Aria's selection, not the package's `tabindex` binding against Aria's.
- **Measured, a Tab race (ticket 29's finding 6, unchanged):** ArrowRight, then Tab, then Shift+Tab right away, should land on Italic. In the final run it went elsewhere in 2 of 4 tries in Chromium and 1 of 4 in Firefox and WebKit. An earlier run gave 3 of 4 in WebKit. The composition neither causes nor fixes it.
- **Measured, ids:** Aria's generated ids change at hydration (`ng-toolbar-widget-a72575-*` on the server, `-a17645-*` live; the same for the carousel's `ng-tab-*`, and so `aria-controls` and `aria-labelledby`). **Read:** `_IdGenerator` puts a random infix per process (`NC/src/cdk/a11y/id-generator.ts:24`), and `toolbar-widget.ts:70` and `tab.ts:62` request it. This alters server HTML attributes at hydration. The `tabs` page avoided it by exposing `id` as a host-directive input and using Yeti's ids. `yetiButton` and the carousel did not expose `id` here.

### Console and hydration warnings (every variant, every engine)

- No `NG05xx` hydration mismatch, no hydration warning, no page error, on any route, including `/r30-never` (Angular logged "hydrated 2 component(s) ... 3 defer block(s) were configured to use incremental hydration").
- `buttons`: no warnings.
- `tabs` and carousel: Aria's dev-mode warning "ngTabPanel must have an ngTabContent structural directive to render." for each panel (`NC/src/aria/tabs/tab-panel.ts:108-110`), as in ticket 29. Content is projected directly so that it is in the server HTML.

### Busy button and `role`

- **Measured:** routing busy through Aria's `disabled` input (`inputs: ['disabled: busy']`, one `[busy]` binding sets both the package's `busy` and `ToolbarWidget.disabled`) gives `aria-disabled="true"` in the server HTML, before hydration, under `hydrate never`, and live. The button stays focusable (`softDisabled` defaults to `true`, `toolbar.ts:84`). Computed styles of the busy button match Yeti's reference (`cursor: not-allowed`, `opacity: 0.6`), and axe has no `color-contrast` finding, which ticket 29's version had.
- **Measured:** `[attr.role]: '"toolbar"'` on `yetiButtons` overrides a consumer's static `role="group"` and a consumer's bound `[attr.role]`, in the server HTML and live. axe's `aria-allowed-attr` finding from ticket 29 is gone. The cost is the one-task `group` written at hydration (above).

### Computed styles against Yeti's `example.html`

- **Measured, `buttons`:** 14 properties on the group and every member (action group and toggle set): 0 differences from `ref-buttons.html`, ignoring the role name.
- **Measured, `tabs` hydrated against `example.html` with `tabs.js`:** 0 differences on the root, the tablist, both tabs, and both panels (the hidden panel is `display: none` in both). Tab order matches too: Profile, panel Profile, out.
- **Measured, `tabs` JS off against `example.html` without `tabs.js`:** one difference. The Profile tab is drawn selected (`color oklch(0.35 0.12 250)`, underline `oklch(0.52 0.15 250)`) because Aria renders `aria-selected="true"` on the server, and Yeti's no-script page has no selected tab. Both show every panel.
- **Read, carousel:** the composition changes no attribute that `carousel.css` keys on (`carousel.css:11-57`). Ticket 29's 29-property comparison stands. Not re-measured.

### What Yeti's `tabs` does before its script runs (read, and measured on the reference page)

`tabs.css:1-5` never hides a panel, and `tabs.js:1-3` says "Without this module the CSS hides nothing, so every panel is readable". The manifest's a11y note says "Without it nothing is hidden and every tab is focusable". Measured on `example.html` without `tabs.js`: Tab goes Profile, Billing, out, and both panels are on screen. With `tabs.js` (`tabs.js:13-24`), the unselected panel gets `hidden` (not `inert`), the selected tab `tabindex=0`, and the other tab `-1`. So, before the script runs, Yeti shows **all panels**. The composition matches that for panels (no `inert`, no `hidden` until Aria is live), but not for tabs: its server HTML has one tab stop and a selected tab where Yeti's no-script markup has two stops and none selected. After hydration the package adds `hidden` itself, because Aria only sets `inert` (`tab-panel.ts:29-30`, `:49`) and Yeti's CSS hides nothing.

### APG keyboard (hydrated)

- `buttons`: the APG toolbar keys, as ticket 29 measured; unchanged by the composition.
- `tabs`: the APG Tabs keys with automatic activation (Aria's default `selectionMode: 'follow'`, `tab-list.ts:106`). Yeti's `tabs.js` keys (`tabs.js:103-117`) are the same set.
- Carousel: as ticket 29's G variant, with the in-key flip above in Firefox and WebKit.

### Carousel: what of ticket 29's glue is still needed

All of it. The composition fixes only the server HTML (`tabindex` and `inert`). Each of the glue's three parts covers a behaviour that Aria lacks, and the composition does not add any of them. The glue moved onto `yetiCarousel` (66 non-blank lines against ticket 29's roughly 95 with comments). It now uses `contentChildren(YetiCarouselSlide, { read: ElementRef })` instead of `querySelectorAll`, following the hydration guide's direct-DOM note (`hydration.md:105-107`):

1. Selection scrolls the track and emits `slide`. Still needed: measured, ArrowRight brings slide 2 into view.
2. An `IntersectionObserver` makes the selection follow a swipe. Still needed: measured, after scrolling back to slide 1, slide 1 is selected and not inert. Two problems remain. **Measured:** the roving stop stays on dot 3 after the swipe (`dotTabindex ["-1","-1","0"]`), as in ticket 29. **Read:** `selectedTab` and `open()` do not move the private `activeItem` (`NC/src/aria/private/tabs/tabs.ts:276-286`, `list-focus.ts:93`), and no public API moves it without focusing the tab. The second problem is the smooth-scroll flip above.
3. `preventDefault` on an unmodified dot click. Still needed: measured, a click on dot 3 added 0 history entries and left the hash empty.

A server-only override did not need private API for any item. The one thing that does need it is moving the roving stop after a swipe: `activeItem` is private (`tab-list.ts:127`), and the public `open(value)` (`tab-list.ts:178-180`) only selects.

## For the user

- **`buttons`:** Aria Toolbar fits by composition at about 12 lines of override inside 2 directives, with public API only. The server HTML has one Tab stop per toolbar in every state, busy keeps `aria-disabled="true"` through Aria's `disabled` input, and `role="toolbar"` beats a consumer's `role="group"`. No hydration warning, and axe passes in every state. Still unsolved: a static `role="group"` is written back for one task during hydration, generated widget ids change at hydration unless `id` is exposed, and ticket 29's Tab race remains.
- **`tabs`:** Aria Tabs fits by composition at about 20 lines of override inside 4 directives. The server HTML has no `inert` or `hidden`, so every panel is on screen as in Yeti's no-script page, with one Tab stop on the selected tab. Once live, the result matches Yeti's `tabs.js` page in computed styles and Tab order, because the package adds `hidden` that Aria does not. Still unsolved: with JS off, one tab is drawn selected and only one tab is reachable, where Yeti's no-script page has every tab reachable and none selected; Aria's dev-mode `ngTabContent` warning shows once per panel.
- **Carousel picker:** the composition (`yetiTab`, `yetiTabList`, about 10 lines for `yetiCarouselSlide`) meets ADR 0024 point 1: no inert slide and one reachable dot in the server HTML, in every state. All three parts of ticket 29's glue are still needed (66 lines). Still unsolved: the tab stop does not follow a swipe without private API, and in Firefox and WebKit a smooth-scrolled End or Home can undo the selection through the glue's observer.
- **Servers:** the probe server (port 4437) was stopped. Ticket 29's workspace keeps the new `r30` files and routes.
- **Hydration constraints:** no binding branches on the platform. The server value lasts until Aria's public `active()` turns true, and Angular logged no hydration warning for any variant. The DOM structure is unchanged. Two attribute changes at hydration remain: the `role` written back for one task, and Aria's random ids.
