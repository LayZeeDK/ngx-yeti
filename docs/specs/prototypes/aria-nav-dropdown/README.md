# PROTOTYPE: `nav` and `dropdown` on Angular Aria's menu family

Throwaway. Ticket: [29. Prototype: Angular Aria for the four items that keep a native pattern](../../issues/29-prototype-aria-for-the-native-pattern-items.md). Run 2026-10-02. Decides nothing.

## Question

Ticket 25 rows 32 (`dropdown`) and 34 (`nav`) keep the disclosure navigation of [ADR 0019](../../adr/0019-nav-and-dropdown-are-disclosure-navigation.md): a `popovertarget` opener, a `popover` panel, focus-out closing ([ADR 0043](../../adr/0043-light-dismiss-additions-are-host-listeners-not-cdk-services.md), ledger A11Y-3a and A11Y-3b), and closing on navigation ([ADR 0041](../../adr/0041-closing-on-navigation-is-a-per-instance-subscription.md)). If both items are built on Aria's `ngMenuTrigger`/`ngMenu`/`ngMenuItem`/`ngMenuBar` instead, do Yeti's styles still apply unchanged with no package CSS, does Aria replace Yeti's JavaScript, and what does it cost in the rendering modes and in accessibility?

Both sources warn against the menu roles here, and were measured anyway because the user asked for the measurement:

- Yeti: "It is a bar of links, not a menu system" (`Y/src/components/nav/docs.md:21`); "No menu roles: a disclosure panel of links reads better than a half-built application menu" (`Y/src/components/dropdown/dropdown.css:1-4`).
- APG: "This implementation of site navigation does not use the menu role because it does not provide the complex functionality that assistive technologies expect in a widget that has the menu role" (`aria-practices@3f094fd content/patterns/disclosure/examples/disclosure-navigation.html:35-37`).
- Angular's own guide: avoid menus when "Building site navigation (use navigation landmarks instead)" (`angular@5db6fc4453 adev/src/content/guide/aria/menu.md:53`); avoid menubars when "Navigation belongs in a sidebar or header navigation pattern" (`menubar.md:57`). The tree guide lists "Implementing site navigation with nested sections" as a use (`tree.md:30`).

## Setup

- Workspace `D:/tmp/ngx-yeti-29-nav-dropdown/ws`: config and `src` files copied from `D:/tmp/ngx-yeti-18/ws` (no `node_modules`), then `npm install`. Nx 23.2.1, Angular 22.2.1 (SSR, `outputMode: server`, zoneless, `provideClientHydration()`), `@angular/aria` 22.2.1 and `@angular/cdk` 22.2.1, `yeti-css` from `D:/tmp/ngx-yeti-18/yeti/yeti-css-7.0.0-alpha.0.tgz` (Yeti `f52d1e8b9`; its `nav.css` and `dropdown.css` are byte-identical to the clone's `src/`).
- Yeti's built `yeti.css` is linked globally (`<link>` in `index.html`); the loading mechanism does not affect this question. `hover.js` is loaded only by the reference page.
- Playwright 1.63.0 with Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6; `@axe-core/playwright` 4.13.0.
- Pages, all rendered on the server per request:
  - `/ref.html`: a static page with Yeti's `nav/example.html`, `dropdown/example.html`, and the docs' `data-trigger="hover"` example verbatim, plus `hover.js` (`src/ref.html`).
  - `/a`: variant A, the same markup with row 32/34's directives sketched (`src/a/yeti-a.ts`, `src/a/demo-a.ts`).
  - `/b`: variant B, the same markup with Aria's menu directives and a 40-line bridge directive (`src/b/demo-b.ts`).
  - `/b2`: B with `role="none"` on each `li`, the APG menubar markup.
  - `/a-never` and `/b-never`: A and B inside `@defer (hydrate never)`.
  - Three links (`Profile`, `Blog`, `Guides`) are `routerLink`s with a query parameter, so that closing on navigation can be measured.

```sh
cd D:/tmp/ngx-yeti-29-nav-dropdown/ws
npx nx build ws --skip-nx-cache
NG_ALLOWED_HOSTS=localhost PORT=4391 node dist/ws/server/server.mjs &
node tools/probe.mjs            # results/<engine>.json
node tools/replay.mjs           # click before hydration, then hydration
node tools/summary.mjs [styles|behaviours|modes|a11y]
```

`results/results.json` here is the three engines' output with the raw computed-style dumps removed, plus the replay run. `results/server-b-with-role-list.html` is B's server HTML before `role="list"` was removed (finding 2).

### What variant B is

Aria's `Menu` never hides itself: it writes `data-visible` and nothing else (`NC/src/aria/menu/menu.ts:65`; the Aria examples show it with CDK Overlay or a `[data-visible='false']` rule, `NC/src/components-examples/aria/menubar/menubar.css:30`). To keep Yeti's `[popover]` and `:popover-open` selectors, B keeps Yeti's `popover` on each panel and `popovertarget` on each opener, and adds `[yetiMenuPopover]`: an `afterRenderEffect` that calls `showPopover()`/`hidePopover()` from Aria's `expanded()`, and a `toggle` listener that calls Aria's `close()` when the platform closes the panel (light dismiss, Escape). Mapping:

| Yeti element | B |
| --- | --- |
| `.dropdown > button[popovertarget]` | `+ ngMenuTrigger [menu]` |
| `.dropdown > [popover]` | `+ ngMenu [yetiMenuPopover]` |
| panel links and buttons | `+ ngMenuItem` |
| `.nav > button[popovertarget]` (the toggle) | unchanged: Aria has no trigger for a menubar |
| `.nav > ul[popover]` | `+ ngMenuBar`, `role="list"` removed |
| nav links; the nested `More` button | `+ ngMenuItem`; `More` gets `[submenu]` |
| the nested `#more-menu` panel | `+ ngMenu [yetiMenuPopover]` |

Aria Tree was read, not built: its child group must be an `ng-template[ngTreeItemGroup]` rendered inline (`NC/src/aria/tree/tree-item-group.ts:43`), which replaces Yeti's `div[popover]` sub-panel and its top-layer behaviour, and `ngTree` is vertical by default (`tree.ts:99`). It does have a navigation mode with `aria-current` (`tree.ts:146-153`). Inferred: it fits Yeti's markup less well than the menu family.

## Results

| Point | A (row 32/34) | B (Aria menu family + bridge) |
| --- | --- | --- |
| 1. Styles vs `example.html` | 0 computed-style differences, 0 selectors lost, 3 engines, 2 widths, 4 states | 0 differences, 0 selectors lost (B and B2), but only because B keeps `popover`, `popovertarget`, and the bridge; `role="list"` had to go |
| 2. Yeti JavaScript | `hover.js` behaviours all reproduced (3 listeners) | `hover.js`: not provided for a dropdown trigger; partly inside menus. Platform behaviours: mostly provided, two lost (Enter on a link, close on navigation) |
| 3a. JavaScript off | works: panels open, Tab reaches every link | panels open (native), but every nav link and every panel item is `tabindex="-1"`: unreachable by keyboard |
| 3b. Before hydration | as JavaScript off | as JavaScript off; a click before hydration is undone by event replay in Chromium |
| 3c. `hydrate never` | works as hydrated, minus the directives | stays at server HTML: no keyboard access to panel items or nav links; `aria-expanded="false"` while open |
| 4. axe | 0 violations | B: 3 (2 critical) from `li` between `menubar` and `menuitem`; B2 (`li role="none"`): 0 |
| 4. Keyboard | APG Disclosure Navigation | APG Menu Button and Menubar, except the narrow sheet: horizontal arrow keys in a vertical column |

## Findings

### 1. Styles

1. **Measured.** Computed styles of 21 elements (30 properties plus the bounding box) on `/a`, `/b`, `/b2` against `/ref.html`, at 1000 and 400 px wide, in four states (closed, dropdown open, nav sheet open at 400 px, `More` open). Chromium and Firefox: no differences. WebKit: a 0.016 px width difference and a mid-transition background on the trigger, the same on A, B, and B2. The only other difference, a 4-5 px x offset of the second dropdown, comes from Angular removing the whitespace text node between two `inline-block` wrappers; it is the same on A, B, and B2.
2. **Measured.** Every selector in Yeti's rules that names `.nav` or `.dropdown` (61) was tested with `querySelector` in each state (`:hover` and `::backdrop` removed). The reference matched 25 at 1000 px and 30 at 400 px; A, B, and B2 matched the same ones. None lost, none gained. No package CSS was needed on any variant.
3. **Measured.** On Yeti's markup unchanged, `ngMenuBar`'s host `role="menubar"` (`NC/src/aria/menu/menu-bar.ts:59`) loses to the template's static `role="list"`: the server HTML has `<ul role="list" ... ngmenubar>` with `role="menuitem"` children (`results/server-b-with-role-list.html`, line 30). B removes `role="list"`. Styles did not change, because `.nav > ul[popover]` sets `list-style: none` itself (`Y/src/components/nav/nav.css:62-66`).
4. **Read.** The styles survive only through what B keeps from A. Without the bridge, Aria leaves every panel visible and the panel rules (`dropdown.css:7-56`, `nav.css:62-219`) depend on `[popover]`/`:popover-open`. Without `popovertarget` on the dropdown trigger, `.dropdown > button[popovertarget]` (`dropdown.css:48`, `anchor-name`) misses and the panel is no longer anchored; the nav toggle rules key on it too (`nav.css:38`, `:54-56`, `:244`), but B leaves the toggle native.
5. **Measured.** The bridge's timing matters: with the `write` phase, keyboard opening left focus on the trigger, because Menu focuses its first item in its own `write`-phase `afterRenderEffect` (`NC/src/aria/menu/menu.ts:182-189`) while the popover is still closed. The bridge uses `earlyRead`.

### 2. Yeti JavaScript and the behaviours the rows rely on

At `f52d1e8b9` there is no `nav.js` or `dropdown.js`. `nav` declares `"js": null` (`Y/src/components/nav/manifest.json:358`). `dropdown` has one optional module, `hover.js` (`dropdown/manifest.json:276-281`). The table lists every `hover.js` behaviour (read in full), then the platform behaviours the brief names, then the package additions of rows 32 and 34. "Measured" columns: same result in all three engines unless stated.

| Behaviour | Source | Ref (Yeti) | A | B: Aria provides |
| --- | --- | --- | --- | --- |
| Opt-in per instance by `data-trigger="hover"` | `hover.js:8-9`, `:44` | yes | yes (`trigger` input) | **not**: no hover input on `ngMenuTrigger` (`menu-trigger.ts:44-55`) |
| Hover only where `(hover: hover) and (pointer: fine)`, read at event time | `:14`, `:50-51` | yes | yes | **not**; inside menus Aria opens submenus on `mouseover` with no media check (`private/menu/menu.ts:239-295`) |
| Open delay from `--yeti-dropdown-open-delay` (100 ms) | `:33`, `:55` | closed at 40 ms, open at 340 ms | same | **not** for the trigger (measured: never opened); submenus use a numeric `expansionDelay` input, default 100 ms, not a token (`menu.ts:150`) |
| Close delay from `--yeti-dropdown-close-delay` (200 ms) | `:88` | open at 80 ms, closed at 480 ms | same | **not** (nothing opened) |
| Hovering the panel keeps it open | `:40-47` | yes | yes | n/a |
| Closes only a panel it opened (a click-opened panel survives the pointer leaving) | `:16-19`, `:90` | yes | yes | n/a (B never closes on pointer leave) |
| A press cancels a pending open | `:74-81` | read | `pointerdown` clears the timer | **not** |
| Delegated, so dropdowns added later work | `:4-6`, `:49` | read | per-instance host listeners | n/a |
| Panel found through the trigger's `popovertarget` | `:23-29` | read | `contentChild` | Aria uses `[menu]` |
| Click toggles | platform, `popovertarget` | yes | yes | **fully** (`menu-trigger.ts:51`; `private/menu/menu.ts:718-721`), and moves focus to the first item |
| Escape closes, focus returns to the trigger | platform | yes (WebKit: focus on `body`, a click does not focus the button) | yes (same) | **fully** for dropdown and submenu (`private/menu/menu.ts:182`, `:684`), focus back on the trigger in all three engines; the nav sheet's Escape stays the platform's |
| Outside click closes | platform light dismiss | yes | yes | **partly**: Aria has no pointer rule; it closes on the trigger's or menu's `focusout` (`private/menu/menu.ts:342-370`, `:730-741`). B also keeps the platform's light dismiss through the bridge |
| Anchor positioning under the trigger | `dropdown.css:46-56` | 10 px under, start-aligned | same | **not**: Yeti's CSS does it, because B keeps `popovertarget` |
| `toggle` event | platform | `before:open, open, before:closed, closed` | same | **not**: Aria uses signals; the events come from the `popover` B keeps |
| Expanded state on the trigger | platform | no attribute; engine tree `expanded=true` (Chromium CDP) | same | **fully**, as an attribute (`menu-trigger.ts:49`), plus `aria-haspopup="menu"` and `aria-controls`; but the server HTML's `aria-expanded="false"` stays while a native open happens before hydration (point 3) |
| Focus-out closes the dropdown (A11Y-3a) | ADR 0043 | no: Tab past the last item leaves it open | yes | **fully**: Tab from the open menu closes it and moves to the next control |
| A press on non-focusable panel content keeps it open | ADR 0043 guard | stays open, focus to `body` | stays open (guard) | **fully**: stays open, focus moves to the menu element (`tabindex="-1"`) |
| Focus-out closes the nav sheet (A11Y-3b) | ADR 0043, row 34 | no | yes | **not**: the sheet stayed open with focus on `Account`, `Products`, `After` (`ngMenuBar` does not own the sheet) |
| Closes on a `routerLink` click in the panel | ADR 0041 | n/a | yes | **partly**: activating an item closes its menu (`private/menu/menu.ts:403-420`); the nav sheet stayed open after `Blog` |
| Closes on other navigation (history back) | ADR 0041 | n/a | yes | **not**: stayed open |
| Enter on a link item follows the link | platform | yes | yes (`?p=profile`) | **lost**: the menu cancels Enter (`private/behaviors/event-manager/keyboard-event-manager.ts:34`, `preventDefault: true`); the URL did not change and the menu closed. A mouse click still navigates |

### 3. Rendering modes (ADR 0011)

Measured per variant: JavaScript off (`javaScriptEnabled: false`), before hydration (JavaScript on, the `main-*.js` request aborted, the inline event-replay contract still present), hydrated, each also inside `@defer (hydrate never)`.

1. **A, all six cases.** Panels open and close by click, Enter, and Escape with no script, styled as hydrated (panel background `oklch(0.97 0.02 250)` in every case). Tab from the open trigger reaches `Profile` (WebKit: `Sign out`, see 4.5). Inside `hydrate never` A loses only its three additions (focus-out, hover, navigation), as ticket 25's row assumes.
2. **B, JavaScript off and before hydration.** The server HTML carries Aria's attributes (`results/server-b-with-role-list.html`). The panels still open by click and Enter and close on Escape, because `popovertarget` is kept. But every `ngMenuItem` is `tabindex="-1"` and the menubar is `tabindex="-1"`, because Aria picks its active item in an `afterRenderEffect` that the server does not run (`NC/src/aria/menu/menu-bar.ts:124`, `menu.ts:191`; `private/menu/menu.ts:544-558`). Measured Tab order: A walks `Yeti, Docs, Blog, More, About, Get started, Account, Products, After`; B walks `Yeti, Get started, Account, Products, After`. Tab from the open dropdown goes to `Products`, past all three items, and ArrowDown does nothing. ADR 0019's "Considered options" carried this over from the old record ("no item is a tab stop in server HTML"); this run measured it in three engines.
3. **B, `aria-expanded` before hydration.** After the native open of `More`, the attribute is still `"false"`, so Playwright's ARIA snapshot shows the `menuitem "More"` as collapsed while its menu is open. Hydrated B shows `[expanded]`.
4. **B, `hydrate never`.** Identical to JavaScript off: the deferred block never runs Aria, so the nav links stay out of the Tab order and the panel items stay unreachable for the page's life.
5. **B, a click before hydration (`tools/replay.mjs`, run twice).** The trigger was clicked while the bundle was held, then the bundle was released. A: the panel stays open after hydration and the next click closes it, in all three engines. B in Firefox and WebKit: open, `aria-expanded="true"`. **B in Chromium: closed after hydration**, `aria-expanded="false"`; the next click opens it. Inferred cause, not investigated: the replayed click reaches Aria's `(click)` listener and the button's `popovertarget` activation a second time.

### 4. Accessibility

1. **Measured, axe 4.13** on `main`, 3 engines, both widths, closed, dropdown open, and `More` open. Ref and A: 0 violations everywhere. B: `aria-required-children` (critical, `#site-menu`), `aria-required-parent` (critical, the four nav items), and `listitem` (serious, the four `li`) whenever the list is rendered (always at 1000 px, only with the sheet open at 400 px). B2, with `role="none"` on each `li`: 0 violations.
2. **Measured, roles and names.** A (as ref): `navigation "Site" > list > listitem > link "Docs"` ..., `listitem > button "More"` followed by `link "Guides"` ...; the dropdown is `button "Account"` and then `link "Profile"`, `link "Settings"`, `button "Sign out"`. Chromium's own tree (CDP) gives the button `expanded=true` from `popovertarget`, with no attribute. B: `navigation "Site" > menubar > listitem > menuitem "Docs"` ..., `menuitem "More" [expanded] > menu > menuitem "Guides"` ...; the dropdown is `button "Account" [expanded]` (CDP: `hasPopup=menu`, `controls=account-menu`) and `menu` (no name) `> menuitem "Profile"`, `"Settings"`, `"Sign out"`. In B the links lose the link role, so they are no longer listed as links by a screen reader's links list (inferred).
3. **Measured, A's keyboard, against APG Disclosure Navigation Menu.** Enter and Space toggle with focus kept on the trigger; Tab walks the items; Escape closes and returns focus; arrows, Home, End, and letters do nothing (the APG makes arrows optional). Enter on a link follows it.
4. **Measured, B's keyboard, against APG Menu Button and Menubar.** Dropdown: Enter or Space opens and focuses `Profile`; ArrowDown, ArrowUp, Home, End move; Escape closes and focuses the trigger; Tab closes and moves to `Products`. Typing `s` with focus on `Settings` left focus on `Settings`. Menubar at 1000 px: one Tab stop (`Docs`); ArrowRight and ArrowLeft move; ArrowDown on `More` opens it and focuses `Guides`; Escape closes the submenu onto `More`; ArrowRight from an open submenu moves to `About` and closes it. At 400 px the sheet is a vertical column, but the menubar keeps horizontal keys: ArrowDown on `Docs` does nothing, ArrowRight moves down the column, ArrowDown on `More` opens it. Same in all three engines.
5. **Measured, WebKit.** Playwright's WebKit does not put links in the Tab order, so on ref and A Tab skips every link (it reaches `More`, `Account`, `Products`). In B the menu items carry `tabindex`, so WebKit's Tab reaches `Docs`. This is the engine's default, not a variant difference in the markup.

## For the user

- Yeti's styles survive B unchanged and with no package CSS, but only because B keeps Yeti's `popover` and `popovertarget` and adds a package directive that maps Aria's state onto them; Aria's menu alone shows every panel and anchors nothing. `role="list"` on the nav list has to go, or `li role="none"` has to be added for axe to pass.
- Aria does not replace `hover.js`: it has no hover opening for a dropdown trigger. It does replace focus-out closing for the dropdown and adds roving focus, arrow keys, Home, End, and typeahead. It does not close the nav sheet on focus-out or any panel on navigation other than an item click.
- B cancels Enter on link items, so a keyboard user cannot follow `Profile`, `Docs`, or any menu link with Enter; A follows links like Yeti.
- B fails ticket 25's rendering-modes contract where A passes: with JavaScript off, before hydration, and inside `hydrate never`, every nav link and panel item is `tabindex="-1"` and unreachable by keyboard, and `aria-expanded` reads "false" while a panel is open. In Chromium, a click before hydration is undone when the app hydrates.
- B changes what is announced from links in a list to an application menu and menubar, which Yeti's docs, the APG, and Angular's own Aria guide advise against for site navigation; A keeps Yeti's semantics and passes axe as it stands.
