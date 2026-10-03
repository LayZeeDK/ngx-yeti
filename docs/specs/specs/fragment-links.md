# Spec: fragment-links

Ticket: [Spec: Fragment links (shared spec)](../issues/41-spec-fragment-links.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [ADR 0023](../adr/0023-fragment-links-are-same-document-links.md); [building-blocks.md](../building-blocks.md) 1.15 and Part 2 rows 29 (`carousel`), 40 (`tabs`), 41 (`toc`), 21 (`accordion`), and 51 (this spec); the map's Standing rulings on deployment URLs (only `baseHref`), hydration constraints, JavaScript off, zoneless, open state, and directive testing ([map.md](../map.md)); [Prototype: Yeti's modules in a single-page Angular app](../issues/20-prototype-yeti-in-single-page-apps.md); ledger row A11Y-16 ([ledger.md](../ledger.md)). The points no record settled were decided on 2026-10-03 by the orchestrator in full AFK mode, in [ticket 50](../issues/50-decide-open-points-of-the-specs.md); each is marked "(decided in ticket 50)" and listed under `### Open` in this spec's ticket.

## Problem Statement

A developer building an Angular application with **ngx-yeti** writes fragment links the way Yeti's docs write them: `href="#id"` on a contents list's links, on a carousel's dots, on a deep link into a tab, and on the page's own **Skip link**. Every Angular CLI application ships `<base href>`, so on any route other than the base URL the browser resolves a bare `#id` against the base, not against the current page. [Prototype: Yeti's modules in a single-page Angular app](../issues/20-prototype-yeti-in-single-page-apps.md) measured it in Chromium, Firefox, and WebKit: on `/sub/tabs` a bare `href="#t-target"` reloads the whole document to `/sub/#t-target` and lands on the root route. The visitor loses the page they were on, the application loses its state, and a skip link that reloads the page bypasses nothing (WCAG 2.2 2.4.1).

The obvious Angular fixes break something else. `routerLink` with `fragment`, and `router.navigate([], {fragment})`, keep the route but push history without a `hashchange` event, so the parts that react to the fragment (a tab revealing the panel that holds the target, `:target` styles) never hear about it (ticket 20, R3b). An Angular `click` listener on each link fixes the click only after hydration: before hydration, with JavaScript off, inside a `hydrate never` block, and for a middle click, "copy link", or "open in new tab", the link still points at the wrong document. Inside a still-dehydrated block a host `click` listener on an `<a>` even cancels the link's navigation, because Angular's dispatcher calls `preventDefault()` while it queues the event ([ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) clause 3).

Yeti itself fixes only its carousel's dots, and only after its module loads (`carousel.js:11-25`). Its toc, its tab deep links, and every consumer link are left to the page.

## Solution

The package ships one **Shared-utility spec**'s worth of code in the `ngx-yeti/fragment-links` entry point, in two pieces ([ADR 0023](../adr/0023-fragment-links-are-same-document-links.md); [building-blocks.md](../building-blocks.md) Part 2 row 51):

1. **Links the package's directives sit on render a same-document `href`.** A toc link, a carousel dot, and any other **Part** link a spec owns render the current path (with its query) plus the fragment, under the application's base href, in the server HTML. To the browser such a link is in-page in every rendering mode: before hydration, with JavaScript off, in a dehydrated or `hydrate never` block, on a modified click, and when copied. The `href` stays current when the URL changes, so a component the Router reuses never keeps a stale path. The piece is `injectSameDocumentHref(fragment)`, which the owning item directives call.
2. **Other bare `#id` links in the consumer's markup** (skip links, CMS content, hand-written deep links) are handled once the application is live, by one document-level `click` listener held by a root service, `YetiFragmentLinks`. On an unmodified primary click of an `a[href^="#"]` that would open in the same browsing context, it sets `location.hash` to the link's fragment and cancels the reload. The route is kept, the browser scrolls, and `hashchange` and `:target` work as they do on a page with no base href (ticket 20, R3a). The toc, carousel, and tabs directives inject the service, and a consumer whose page has none of them starts it with `provideYetiFragmentLinks()`, which the `setup` spec places in the documented setup.

Where the page lands and how smoothly it scrolls stay CSS: Yeti's own `scroll-behavior` rule and the consumer's `scroll-margin-top` or `scroll-padding-top`. Native and intercepted jumps land on the same spot. The URL takes the fragment, because `location.hash` is what keeps `hashchange` and `:target` working.

Only `baseHref` (`<base href>`, `--base-href`, `APP_BASE_HREF`) is supported. `deployUrl` is not, by the user's ruling: "29. `deployUrl`/`--deploy-url` is unsupported/to-be-removed as per https://angular.dev/tools/cli/build-system-migration#manual-migration-to-the-new-application-builder so we don't need to support it. Only `baseHref`/`--base-href`/`<base href>` should be supported." (map, Standing rulings).

## User Stories

1. As a consumer, I want a toc link written as Yeti's `href="#intro"` to move to the heading on the current route, so that following it never reloads my application.
2. As a consumer, I want my toc links to work before my application hydrates, so that a visitor who clicks during load stays on the page.
3. As a consumer, I want my toc links to work with JavaScript off on my SSR and prerendered pages, so that the package's no-JavaScript guarantee holds for in-page navigation.
4. As a consumer, I want a carousel dot's server-rendered `href` to point at the current page, so that with JavaScript off the dot scrolls to its slide instead of loading the root route.
5. As a visitor, I want "open link in new tab" on a toc link to open the same page at that heading, so that the copied or opened URL is the one I see.
6. As a visitor, I want a middle click or Ctrl-click on a package-owned fragment link to behave like any other link, so that the browser's own link features keep working.
7. As a consumer, I want a skip link written as `href="#main"` to move focus and scroll to my main content on any route after the application is live, so that keyboard users can bypass repeated blocks (WCAG 2.4.1).
8. As a consumer, I want fragment links in CMS-provided HTML to stay on the current route after the application is live, so that I do not have to rewrite third-party content.
9. As a consumer, I want to opt into bare-link handling with one provider, `provideYetiFragmentLinks()`, so that a page with no toc, carousel, or tabs still gets it.
10. As a consumer, I want bare-link handling to start automatically on pages that use the toc, carousel, or tabs, so that I cannot forget it where Yeti's own markup needs it.
11. As a consumer, I want the URL to show the fragment after an intercepted click, so that the address bar, bookmarks, and shared links reflect where the visitor is.
12. As a consumer, I want `hashchange` to fire after an intercepted click, so that code and items that react to the fragment, such as a tab revealing the panel that holds the target, keep working.
13. As a consumer, I want `:target` to match the fragment's element after an intercepted click, so that my `:target` styles highlight it as on a static page.
14. As a consumer, I want the query string kept when a fragment link is followed, so that the page's filters or search parameters survive.
15. As a consumer, I want a click my own handler already cancelled to be left alone, so that my `(click)` logic on an `href="#"` link wins.
16. As a consumer, I want a link with `target="_blank"` or `download` to be left alone, so that the browser does what the attribute says.
17. As a consumer, I want links whose `href` is a path, a full URL, or a `routerLink` to be left alone, so that the package never changes navigation it does not need to fix.
18. As a consumer, I want a package-owned link's `href` to follow the URL when the Router reuses my component for another path, so that the link never points at the previous route.
19. As a consumer, I want my application's `<base href>` honoured in every rendered `href`, so that a deployment under a subpath works.
20. As a consumer, I want sticky headers handled with `scroll-margin-top` or `scroll-padding-top` in my CSS, so that native and intercepted jumps land in the same place and I configure the offset once.
21. As a visitor who prefers reduced motion, I want fragment jumps not to scroll smoothly, so that the page does not animate against my setting.
22. As a consumer, I want the package to add no listener on the server, so that SSR and prerendering never touch `document` or `location` outside the browser.
23. As a consumer, I want the package-owned `href` to be the same in the server HTML and after hydration, so that hydration rewrites nothing and no mismatch is reported.
24. As a consumer, I want fragment handling to work under zoneless change detection, so that the `href` refreshes from a signal without zone.js.
25. As a consumer, I want the document listener removed when my application is destroyed, so that tests and micro-frontends leave no listener behind.
26. As a consumer, I want one listener for the whole application rather than one per link, so that pages with many links cost nothing extra.
27. As a consumer, I want a fragment target inside a closed `details` to open when the link is followed, so that the visitor sees the target; the platform does this, and the accordion's open state follows its `toggle`.
28. As a consumer, I want a deep link into a tab panel to select that tab after hydration and on `hashchange`, so that the target is visible; the tabs spec does this from the `hashchange` this spec guarantees.
29. As a consumer, I want a carousel dot's click handled by the carousel without a history entry, so that dot clicks do not fill the back button; this spec leaves a click the carousel already cancelled alone.
30. As a consumer, I want to know which links still leave the page before hydration and with JavaScript off, so that I can write those links with the current path where it matters.
31. As a consumer writing my own directive, I want to call `injectSameDocumentHref(fragment)` myself, so that my own links get the same treatment as the package's.
32. As a consumer, I want the package to work without `@angular/router`, so that an application with no Router still gets correct fragment links.
33. As a consumer, I want the package to use no `deployUrl` and to document that only `baseHref` is supported, so that I know the deployment shape to use.
34. As a consumer using `withI18nSupport()`, I want fragment handling unaffected, so that translated pages behave the same.
35. As a consumer, I want a package-owned link inside a `@defer (hydrate on ...)` block to work natively before that block hydrates, so that deferring part of a page costs nothing for in-page links.
36. As a consumer, I want a package-owned link inside a `hydrate never` block to keep its server-rendered `href`, so that it stays in-page with no Angular code running.
37. As a maintainer, I want the bare-link listener to act only on what the browser would treat as a same-document fragment navigation, so that the package never changes the outcome of a link the browser would open elsewhere ([ADR 0023](../adr/0023-fragment-links-are-same-document-links.md), carried from old ADR 0038).
38. As a maintainer, I want the listener to change the URL before it cancels the click, so that it follows the package's rule of changing state first and calling `preventDefault()` last ([building-blocks.md](../building-blocks.md) 1.5).
39. As a maintainer, I want an e2e test under a non-root `<base href>` on a non-root route, so that the measured failure (a reload to the base) can never come back unnoticed (ledger A11Y-16, L4).
40. As a maintainer, I want the Router's `scrollPositionRestoration` and `anchorScrolling` measured against an intercepted jump, so that the spec records whether they fight it (ADR 0023 point 4).
41. As an accessibility reviewer, I want ledger row A11Y-16 to name what the package adds, its building block, and its tests, so that the 2.4.1 compliance is traceable to ngx-yeti rather than to Yeti.
42. As a visitor using a screen reader, I want the browser's sequential focus starting point to move to the fragment's target after an intercepted click, as it does for a native fragment navigation, so that the next Tab continues from the target.

## Implementation Decisions

### 1. Yeti contract

This spec maps no Yeti **Item**: it has no **Identity class**, no **Attribute**, no **Marker**, no **Event**, and no **Item file**. What it touches of Yeti:

- Yeti writes bare fragment links in its toc (`toc.js` selects `a[href^="#"]`), its carousel's dots (`src/components/carousel/example.html:8-10`), and tab deep links (`tabs.js:55-88` reveals on `hashchange`), all read at `f52d1e8b9` ([ADR 0023](../adr/0023-fragment-links-are-same-document-links.md); [research/yeti-javascript-and-angular.md](../research/yeti-javascript-and-angular.md)).
- `carousel.js:11-25` intercepts its own dot clicks so a dot adds no history entry; the package's carousel dot directive keeps that ([building-blocks.md](../building-blocks.md) row 29). This spec generalises the interception to every bare link, like for like (row 51's "Yeti module" column), but with `location.hash` rather than a scroll without a URL change, for the hash reasons above.
- Smooth scrolling: `toc.css:6-9` sets `scroll-behavior: var(--yeti-toc-scroll)` on `html:has(.toc, .nav a[href^="#"]:not([href="#"]))`; the **Token** is `smooth`, and `auto` under `prefers-reduced-motion: reduce` (`tokens/components.css:102`, `:178-182`; [ticket 23](../issues/23-research-yeti-layers-and-import-order.md), read and measured).

### 2. Contract mapping

| Contract piece | ngx-yeti | Notes |
| --- | --- | --- |
| Identity class | none | No item. |
| Attributes and markers | none | The `href` of a package-owned link is set by the owning **Part directive** through `injectSameDocumentHref` (toc link, carousel dot); see section 4. |
| Events | none dispatched | The package dispatches no DOM event of its own (map, Prefix ruling). The platform's `hashchange` and `popstate` fire from the fragment navigation. |
| Token `--yeti-toc-scroll` | the consumer's | Read by Yeti's `toc.css`; the package writes it nowhere ([ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md)). |
| `scroll-margin-top`, `scroll-padding-top` | the consumer's CSS | No offset input ([ADR 0023](../adr/0023-fragment-links-are-same-document-links.md) point 3). |

Module replaced: none in full. The dot interception of `carousel.js` is kept by the carousel spec; this spec generalises its click filter to every bare link.

### 3. Hierarchy and DI shape

- **`YetiFragmentLinks`**: a root `@Service()` ([building-blocks.md](../building-blocks.md) 1.5: the one service ticket 25 placed, because the listener is state shared across instances). It is created on first injection. In its constructor it schedules the listener's start with `afterNextRender`, so nothing runs on the server, and it registers the removal on its injector's `DestroyRef` ([building-blocks.md](../building-blocks.md) 1.9 and 1.15, "every `addEventListener` in code has its removal in `DestroyRef.onDestroy`").
- **Who injects it**: the toc root, the carousel dot, and the tabs root directives inject it eagerly ([building-blocks.md](../building-blocks.md) row 51). Eager, not `injectAsync`: 1.9 leaves that choice to the owning spec, and the listener must be in place before the first click after the application is live, which a lazily loaded service cannot promise.
- **`provideYetiFragmentLinks()`**: returns environment providers that create the service at application start, for a page with no toc, carousel, or tabs. It takes no options: there is nothing to configure (no offset, ADR 0023 point 3; no defaults token, 1.4). Its place in the consumer's setup is the `setup` spec's ([building-blocks.md](../building-blocks.md) Part 3).
- **`injectSameDocumentHref(fragment)`**: an injection-context function, called by a part directive at construction. It injects Angular's `Location` (provided in root, so no Router is needed) and returns a signal of the same-document `href`. It subscribes to `Location.onUrlChange` (`NGP/common/src/location/location.ts:232`, read by ticket 25) and removes that subscription on `DestroyRef`.
- **Router**: optional. Nothing in this spec injects `Router` or `ActivatedRoute`; `Location` already sees Router navigations and `popstate` (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).
- **Generated ids**: none. A fragment target is addressed from outside the application, so its `id` is consumer-supplied ([building-blocks.md](../building-blocks.md) 1.5 and 1.11 decision 8; ADR 0011 clause 8).

### 4. API

Entry point `ngx-yeti/fragment-links`. It exports three names and no import arrays ([ADR 0018](../adr/0018-no-import-arrays-and-later-milestone-import-checks.md)). There is no directive, so there is no selector and no `exportAs`.

**`injectSameDocumentHref(fragment)`**

- Input: the fragment without its `#`, as a string or as a signal of one, so a part whose fragment can change stays current.
- Returns: a read-only signal of the `href`. Its value is `Location.prepareExternalUrl(Location.path())` followed by `#` and the fragment. `Location.path()` is the current path *with its query string*, and `prepareExternalUrl` adds the application's base href. Both are needed for the link to be same-document: two URLs that differ in path or query are different documents (ADR 0023, carried from old ADR 0038's rule).
- Recomputes on every `Location.onUrlChange` callback (Router navigations, `popstate`, `Location.go` and `replaceState`). The callback writes a signal, so the host binding refreshes under zoneless change detection ([building-blocks.md](../building-blocks.md) 1.5).
- On the server, `Location` reads the request URL (SSR) or the prerendered route (prerendering), so the server HTML holds the right `href` without a browser.
- The owning part binds it as `[attr.href]` in `host`. Where the fragment comes from is the owning spec's, under this spec's usage rule 2 (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).

**`YetiFragmentLinks`** (root `@Service()`; no public members)

The listener, a bubble-phase `click` listener on `DOCUMENT`, started in `afterNextRender`, acts only when all of these hold. Together they make the click one the browser would treat as a same-document fragment navigation if `<base href>` were the page URL (ticket 20's R3a, with ADR 0023's same-document rule):

1. `event.defaultPrevented` is false, so a consumer handler or the carousel dot, which ran earlier in the bubble path, wins.
2. `event.button` is 0, and none of `ctrlKey`, `metaKey`, `shiftKey`, `altKey` is set.
3. The closest `a` element from the event target has a raw `href` attribute (read with `getAttribute`) that starts with `#`.
4. That link has no `download` attribute, and its `target` is absent, empty, or `_self`.

When they hold, the listener sets `location.hash` to the raw fragment and then calls `preventDefault()` ([building-blocks.md](../building-blocks.md) 1.5: state first, `preventDefault()` last). It does not check that an element with the id exists: a native fragment navigation to a missing id also changes the URL and scrolls nowhere. `href="#"` therefore behaves as natively on a page with no base: the URL gains an empty fragment and the page scrolls to the top.

**`provideYetiFragmentLinks()`**: `EnvironmentProviders`; no arguments.

**Usage rules**

1. Every fragment target carries a consumer-supplied `id` ([building-blocks.md](../building-blocks.md) 1.5).
2. On a link a package directive sits on, the consumer writes Yeti's `href="#id"`, and the directive renders the same-document `href` from it ([ADR 0023](../adr/0023-fragment-links-are-same-document-links.md) Consequences; decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)). A link rendered from data writes no static `href`: it binds the selector-named input, `yetiCarouselDot` or `yetiTocLink`, with the target id, and the directive renders the same-document `href` from that (ticket 50 decisions 126 and 208).
3. A consumer's own bare link works only once the application is live. Where it must work before hydration or with JavaScript off, the consumer writes the current path into the `href` (ADR 0023 point 2), or binds it from `injectSameDocumentHref` in a directive of their own. `routerLink` with `fragment` does not reload either, but it fires no `hashchange` (ticket 20, R3b), so a tab holding the target is not revealed.
4. Sticky headers are offset with `scroll-margin-top` on targets or `scroll-padding-top` on the scrolling element.
5. The application uses Angular's default path location strategy. `HashLocationStrategy` puts the route in the fragment, and no fragment link can work beside it (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).
6. Only `baseHref` is supported; `deployUrl` is not (map, Standing rulings).

### 5. Material comparison

| Concern | Angular Router, CDK, Material | ngx-yeti | Why |
| --- | --- | --- | --- |
| In-page link | `routerLink` with `fragment`; `anchorScrolling` | same-document `href` on package links, document listener for bare links | `routerLink` and `router.navigate` push history without `hashchange` (ticket 20, R3a against R3b) |
| Scrolling to an anchor | `ViewportScroller.scrollToAnchor` | the browser's own fragment scroll | no URL change, so no `:target` and no `hashchange` (inferred from ADR 0023 point 4's reason) |
| Offset | `ViewportScroller.setOffset` | consumer CSS | ADR 0023 point 3 |
| Material component | none | none | Material ships no fragment-link utility |

### 6. Implementation level and primitives

Custom Angular, level 4 ([building-blocks.md](../building-blocks.md) row 51), over the platform's fragment navigation, `location.hash`, `hashchange`, and `:target`, and Angular's `Location` (`NGP/common/src/location/location.ts:232`). No Aria pattern applies ([research/aria-on-yeti-markup.md](../research/aria-on-yeti-markup.md): "Router and URL behaviour. No widget pattern applies."), and CDK has no counterpart. Level 1 alone does not cover it: the platform resolves a bare `#id` against `<base href>`, which is the measured failure.

### 7. ARIA, keyboard, and the ledger

- No role, state, or key handler. A link activated with Enter fires `click`, so keyboard activation takes the same path as a pointer click.
- Focus: setting `location.hash` performs a fragment navigation, which moves the browser's sequential focus navigation starting point to the target, as a native in-page link does. That this holds for the intercepted path is inferred; the e2e test measures it (section Testing, layer 4).
- Ledger: owns **A11Y-16** ("Bare `#id` links stay same-document under `<base href>`"; WHATWG URL resolution and same-document navigation; WCAG 2.2 2.4.1). This spec confirms the row's **What the package adds** and **Tested by** columns as they read and adds no row.
- WCAG 2.2 AA criteria touched:
  - 2.4.1 Bypass Blocks: a skip link moves to its target without a reload once the application is live, and package links do so in every mode.
  - 2.4.3 Focus Order: the focus starting point follows the target, as above.
  - 2.4.11 Focus Not Obscured (Minimum): a target under a sticky header is the consumer's to offset (usage rule 4).
  - 2.3.3 Animation from Interactions is AAA and outside the target; Yeti's token already turns smooth scrolling off under reduced motion.

### 8. Rendered HTML

- A toc link as the consumer writes it: `<a yetiTocLink href="#intro">`. Server HTML on `/sub/guide?lang=da` under `<base href="/sub/">`: `<a href="/sub/guide?lang=da#intro" aria-current="true">` (the `aria-current` is the toc spec's). After hydration: the same value. After a Router navigation to `/sub/reference` that reuses the component: `/sub/reference#intro`.
- A consumer skip link, `<a href="#main">`, renders as written. Nothing of this spec appears in the server HTML for it.
- The service renders nothing.

### 9. Animation

None. Smooth scrolling is Yeti's `scroll-behavior` rule under its reduced-motion token ([building-blocks.md](../building-blocks.md) 1.6 rule 4; ADR 0023 point 3). Ticket 23 found that `toc.css` holds that rule, so a nav of fragment links scrolls smoothly only while a toc's item file is loaded (its X3, "Accept and document").

### 10. Rendering modes

| Mode | Package-owned link (`injectSameDocumentHref`) | Consumer bare link (`YetiFragmentLinks`) |
| --- | --- | --- |
| SSR | `href` is the request path plus the fragment | rendered as written; no listener on the server |
| Prerendering | `href` is the prerendered route's path plus the fragment (`REQUEST` is null and not read; 1.11 decision 10) | as SSR |
| JavaScript off (SSR and prerendered) | in-page; the fragment scrolls natively and opens a closed `details` that holds it | **lost**: reloads to the base URL plus the fragment (ADR 0023 point 2) |
| Before hydration | in-page natively | **lost**: reloads |
| Full hydration | same value on both ends, so hydration rewrites nothing | listener starts in the first `afterNextRender` |
| Incremental hydration, block not yet hydrated | server `href`, in-page natively | handled once the root has rendered: a plain link carries no `jsaction`, so the document listener sees the click (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)) |
| `hydrate never` | server `href`; never updated, so it goes stale only if the Router reuses the route's component for another path (stated residue) | as the row above (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)) |
| Client `@defer`, `@if`, routed views | `href` computed at creation from the current URL | handled |
| Event replay | nothing to replay: package links have no `click` listener from this spec, so ADR 0011 clause 3 cannot cancel them | not replayed (a `document` listener; 1.11), which is correct: before hydration the link has already navigated |
| `withI18nSupport()` | no strings, no effect | no effect |
| Zoneless | `href` is a signal written from `onUrlChange` | the listener writes no view state |

Hydration constraints (map, Standing rulings, item 54): the server and client DOM are equal, because the `href` is computed from the same URL on both ends; there is no DOM manipulation outside a host binding, apart from the listener's `location.hash` write after hydration, which is navigation, not DOM; there is no platform branch in any template; and the HTML is valid. The consumer's static `href="#id"` is the one documented case of a consumer's static attribute that a directive reads: the directive reads it once through `HostAttributeToken('href')` (ADR 0023's 2026-10-03 note; decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).

### 11. Single-page application

- **Navigation**: setting `location.hash` fires `popstate` and `hashchange`, and Angular's `Location` hands the `popstate` to the Router, which is expected to run a fragment-only navigation. That navigation's `NavigationStart` would close open panels through navigation-close ([ADR 0041](../adr/0041-closing-on-navigation-is-a-per-instance-subscription.md)). This is inferred; layer 4 measures it (case 8), and the closing is accepted as ADR 0041 reads (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)). Whether `scrollPositionRestoration` or `anchorScrolling` then fights the jump is measured by layer 4 (ADR 0023 point 4).
- **Fragment targets that need revealing**:
  - `tabs`: the tabs root reveals the tab whose panel holds the target after hydration and on `hashchange`, nesting outward ([building-blocks.md](../building-blocks.md) row 40). This spec's part is that every in-page link fires `hashchange`: package links natively, and bare links through the listener. With JavaScript off every panel shows (map, Standing rulings, "All panels show"), so the native fragment scroll finds the target.
  - `details` (`accordion`): the browser opens a closed `details` that holds the fragment's target. Measured for a loaded page in Chromium, Firefox, and WebKit; on a cold load before hydration Chromium and WebKit hold it back until the deferred `main.js` has run ([prototypes/aria-composition-accordion/README.md](../prototypes/aria-composition-accordion/README.md), section C.3). Under the open-state ruling no directive binds `open`; the accordion item reads it once and follows `toggle` (map, Standing rulings, "Never bind; read once (Recommended)"), so a fragment reveal is never undone. This spec adds nothing for it.
  - `carousel`: the dot directive scrolls the track itself and cancels the click, so no history entry is added ([building-blocks.md](../building-blocks.md) 1.15 and row 29). The listener's `defaultPrevented` check leaves that click alone.
  - `toc`: its links are package-owned (point 1), and its current link comes from its own observer, not from the fragment ([ADR 0025](../adr/0025-toc-finds-its-headings-from-its-links.md)).

## Testing Decisions

A good test here asserts what a visitor and the browser observe: the final URL, whether the document reloaded (a marker on `window` that survives only without a reload), the scroll position against the target's box, `:target`, `hashchange`, the focus starting point, and the `href` attribute in server and hydrated HTML. It never asserts on the service's fields or on listener counts beyond the one leak check. Four layers, as in [ADR 0014](../adr/0014-testing-stack-for-yeti.md) and [building-blocks.md](../building-blocks.md) 1.12, all zoneless. Prior art: [Prototype: Yeti's modules in a single-page Angular app](../prototypes/yeti-spa/README.md) (R3a, R3b, and the reload table).

### Layer 1: story play functions

Stories under the title `fragment-links`, ids pinned by `meta.id`:

- `fragment-links--skip-link`: a skip link and a `main` target, with `provideYetiFragmentLinks()`. The play function presses Tab and Enter, then asserts that the URL fragment is `#main`, that the reload marker survives, that `main` matches `:target`, and that the next Tab reaches the first focusable element inside `main`. Axe runs with the six tags.
- `fragment-links--bare-links`: a bare link, an `href="#"` link whose `(click)` cancels, a `target="_blank"` link, and a `download` link. The play function asserts that only the first changes the hash.
- `fragment-links--same-document-href`: a story-local directive that binds `injectSameDocumentHref('intro')`. It asserts that the rendered `href` is the Storybook iframe's path and query plus `#intro`, and that a click keeps the reload marker.

Storybook's iframe has no subpath `<base href>`, so the subpath cases live in layer 4.

### Layer 2: browser-level (Vitest browser mode, `npx nx test <lib>`)

- `injectSameDocumentHref` through `TestBed.createDirective` (map, Standing rulings, 2026-10-03; ADR 0014's 2026-10-03 note) on a small test directive whose host binds the signal, with `bindings` setting the fragment input. `provideLocationMocks()` and `APP_BASE_HREF` set to `/sub/` drive the URL. The test asserts the `href` for a path with a query, after `Location.go` to another path, after a simulated `popstate`, and after a change of the fragment signal, plus no update after the directive is destroyed.
- `YetiFragmentLinks` with the real `location` of the test iframe: a dispatched unmodified primary click on `a[href="#x"]` sets the hash and is cancelled. Each excluded case is left untouched: modifier keys, `button` 1, `defaultPrevented`, `download`, `target="_blank"`, an `href` that is a path, and an SVG `a`. The listener is absent before the first render and gone after the environment injector is destroyed (a click after destroy changes nothing). A replay-shaped event whose `preventDefault` throws still leaves the hash set (1.12's replay-safe check).

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `fragment-links.ssr.spec.ts`)

`renderApplication` through the shared `renderServer()` helper with the URL `/sub/guide?lang=da` and `APP_BASE_HREF` `/sub/`, a fixture holding the test directive, a consumer skip link, `provideYetiFragmentLinks()`, `withI18nSupport()`, and one `i18n` text. Asserts: the `href` is `/sub/guide?lang=da#intro`; the skip link renders as written; `whenStable()` resolves; no error is thrown from a `document` or `location` access on the server.

### Layer 4: Playwright e2e (three engines in CI)

Fixture application half, prerendered and served under `<base href="/sub/">`, on a non-root route with a query, as ticket 20 measured and ledger row A11Y-16 names ("under `/sub/`: toc link, carousel dot, tab deep link, a consumer skip link; reload is a failure"):

1. Package-owned link (toc link and carousel dot): no reload and the URL is the route plus fragment, with JavaScript disabled, before hydration (`main.js` held back), and after hydration.
2. Consumer skip link after hydration: no reload, `hashchange` fired once, `:target` matches, and the next Tab lands inside the target.
3. Consumer skip link before hydration and with JavaScript disabled: reloads to `/sub/#main`. This is asserted as the documented residue, so a change in it is noticed.
4. Ctrl-click and middle click on both kinds open a new page at the right URL and leave the first page unchanged.
5. Route reuse: a `routerLink` to the same component with another parameter updates the package-owned `href`.
6. A bare link inside a `@defer (hydrate on interaction)` block before it hydrates, and inside a `hydrate never` block, after the root is live (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).
7. The Router with `scrollPositionRestoration: 'enabled'` and `anchorScrolling: 'enabled'`: after an intercepted jump, the scroll position is the target's (minus `scroll-margin-top`), and Back returns to the previous position (ADR 0023 point 4).
8. With an open shell dropdown holding a fragment link: whether the jump closes it, recorded (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).
9. A deep link into a non-selected tab panel and into a closed `details`: after the jump, the panel is shown and the `details` is open. This is the shared half of the tabs and accordion specs' own tests.
10. `emulateMedia({reducedMotion: 'reduce'})`: the jump completes in one frame.
11. Hydration without NG05xx and `componentsSkippedHydration === 0` on the route.

The manifest attribute-and-value check covers nothing here: this spec renders no Yeti class, attribute, or marker.

## Out of Scope

- `deployUrl` and `--deploy-url` (map, Standing rulings).
- `HashLocationStrategy` (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).
- Fragments inside a consumer's Shadow DOM: `getElementById` cannot reach them natively either, and the package never uses Shadow DOM ([ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) clause 11).
- Links whose `href` is a path or a full URL with a fragment (`/sub/other#x`, cross-route deep links). They are ordinary navigations, and the Router's `anchorScrolling` is the consumer's choice for them.
- An offset input, a smooth-scroll input, or a scroll service (ADR 0023 point 3).
- Revealing targets inside items. Each item spec owns its own reveal (tabs, accordion); this spec guarantees only the `hashchange` and the native fragment navigation they rely on.
- Reporting a link that is not in-page. In the first milestone nothing reports it ([ADR 0018](../adr/0018-no-import-arrays-and-later-milestone-import-checks.md); ADR 0023 Consequences).
- Making a consumer's bare link work before hydration or without JavaScript. That needs the consumer's own path-written `href` (usage rule 3).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Package-owned links render a same-document `href`, kept current through `Location.onUrlChange` | ADR 0023 point 1; building-blocks row 51 |
| One document `click` listener for other bare links, setting `location.hash` | ADR 0023 point 2; ticket 20 R3a; ADR 0011 clause 3 (no per-link listener) |
| Smoothness and offset stay CSS | ADR 0023 point 3 |
| The URL takes the fragment | ADR 0023 point 4 |
| `router.navigate` and `routerLink` fragment rejected | ADR 0023 Considered options; ticket 20 R3b |
| A root `@Service()` for the listener | building-blocks 1.5, row 51 |
| Listener started in `afterNextRender`, removed on `DestroyRef` | building-blocks 1.11 decision 3, 1.9, 1.15 |
| Service injected eagerly, not through `injectAsync` | building-blocks 1.9 (left to this spec): the listener must exist before the first click after the application is live |
| `href` includes the query string | ADR 0023's same-document rule; ticket 20 ("the query string is kept") |
| `defaultPrevented`, `download`, and `target` exclusions | ADR 0023's rule (the browser's own outcome decides); ticket 20's ordering note on `carousel.js` |
| Only `baseHref` | map, Standing rulings, item 29 |
| No directive binds `open`, so a fragment opening a `details` survives | map, Standing rulings (open state); ADR 0021 |
| Layer 2 uses `TestBed.createDirective` | map, Standing rulings (directive testing); ADR 0014 note |

### Usage examples

- A page with no toc, carousel, or tabs that has a skip link adds `provideYetiFragmentLinks()` to its application providers (placed by the `setup` spec) and writes `<a href="#main">Skip to content</a>` with `<main id="main">`.
- A toc imports the toc directives from `ngx-yeti/toc` and writes Yeti's markup, `<nav yetiToc aria-label="On this page"><a yetiTocLink href="#intro">Introduction</a></nav>`, with `id="intro"` on the heading. Nothing from `ngx-yeti/fragment-links` is imported, because the toc directives use it.
- A consumer's own directive for a "back to top" link calls `injectSameDocumentHref('top')` and binds the signal to `[attr.href]` in its `host`, so the link works before hydration and with JavaScript off.
- A sticky header: `:root { scroll-padding-top: 4rem; }` in the consumer's stylesheet.

### Styles

None: this is a utility without styles. It loads no **Item file** and writes no token. It relies on `toc.css`'s `scroll-behavior` rule where a toc is on the page, and with no toc loaded, fragment jumps are instant ([ticket 23](../issues/23-research-yeti-layers-and-import-order.md) X3). No Tailwind name collides.

### Platform features to adopt when the browser target moves

Not checked against [ADR 0002](../adr/0002-browser-target-baseline-2025.md)'s engines in this spec; each is adopted when every target engine ships it:

- The Navigation API's `navigate` event could replace the document `click` listener, and would also see keyboard and programmatic navigations.
- `hidden="until-found"` with `beforematch` on tab panels would let the browser reveal a fragment's panel before scrolling. That is the tabs spec's to adopt, and it would remove the dependency on `hashchange` timing.

### Single-page-application pieces it relies on

Angular's `Location` and its `onUrlChange`; the Router only through `Location`. It interacts with navigation-close ([ADR 0041](../adr/0041-closing-on-navigation-is-a-per-instance-subscription.md)) as section 11 says.
