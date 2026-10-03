# Spec: tabs (component item)

Ticket: [90. Spec: tabs (component)](../issues/90-spec-tabs.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 40 and its "Aria decisions (2026-10-03)" row 40 (Aria Tabs by composition, the `tabindex` hand-over for the selected tab, ids that match across hydration, and every panel visible with JavaScript off, with `hidden` added to non-selected panels once the app is live), Part 1, and Part 2 rows 51 to 53; the map's Standing rulings on composition ("Composition (Recommended)"), on `tabs` with JavaScript off ("All panels show (Recommended)"), on hydration constraints, JavaScript off, zoneless, package CSS for accessibility ("Accessibility CSS: Yes."), and directive testing ([map.md](../map.md)); [ticket 26](../issues/26-decide-yeti-data-attributes-mapping.md) rows 152 to 155 and its 2026-10-02 note moving `orientation` to `yetiTabList`; [Prototype: Angular Aria for the four items that keep a native pattern](../issues/29-prototype-aria-for-the-native-pattern-items.md), [Prototype: fitting Angular Aria to Yeti by directive composition](../issues/30-prototype-fitting-aria-by-directive-composition.md) with [aria-composition-roving](../prototypes/aria-composition-roving/README.md), [Research: where Angular Aria's attribute directives fit Yeti's own markup](../issues/32-research-aria-directives-on-yetis-own-markup.md), and [Prototype: subclassing Aria's directives, and `[open]` against `[attr.open]`](../issues/34-prototype-subclassing-aria-and-open-binding-forms.md); [ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md) and `provideYetiAriaIds()` on `yetiTab` and `yetiTabPanel`, scoped to Aria's prefixes ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 1 and 5); the shared specs [fragment-links](fragment-links.md) (revealing the tab whose panel holds a fragment's target), [events](events.md) (the `select` output), [generated-ids](generated-ids.md), and [setup](setup.md); ledger rows A11Y-1c, A11Y-5, A11Y-17 (with its 2026-10-03 note), and A11Y-18 ([ledger.md](../ledger.md)); [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0013](../adr/0013-parts-name-their-targets-by-reference.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0023](../adr/0023-fragment-links-are-same-document-links.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 198 to 206), and each is cited where it applies.

`Y/` is `github.com/foundation/yeti/` at the Pin; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x); `APG/` is `github.com/w3c/aria-practices/content/patterns/` at `3f094fd`. Every `file:line` below was read on 2026-10-03 unless marked otherwise.

## Problem Statement

Yeti's `tabs` is "a row of tabs over their panels, showing one at a time when its module is loaded and all of them when it is not" (`Y/src/components/tabs/manifest.json:6`). It is one **Identity class**, `tabs`, with four **Attributes** (`data-variant`, `data-orientation`, `data-gap`, `data-emphasis`), a `[role="tablist"]` of two or more `[role="tab"]` buttons, and two or more `[role="tabpanel"]` siblings. Its CSS never hides a panel, on purpose: "a page that does not load `tabs.js`, or where the script fails, shows every panel under its own tab, so nothing a reader came for is locked away" (`Y/src/components/tabs/docs.md:7`). Its **Module**, `tabs.js`, pairs each tab with the panel its `aria-controls` names, selects one, hides the others with `hidden`, keeps a roving `tabindex`, moves the selection with the arrow keys, Home, and End, reveals the tab whose panel holds the URL's fragment, and dispatches `yeti:select` (`Y/src/components/tabs/tabs.js:1-114`).

An application developer using Yeti through Angular hits five problems:

- `tabs.js` scans the page once, at load ("Tabs added after load are not picked up", `tabs.js:4`), so a tabs set rendered by a route, `@if`, or a client `@defer` never works ([ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) clause 5; ticket 20, measured).
- `tabs.js` writes `aria-selected`, `tabindex`, and `hidden` before hydration, and hydration writes the template's static attributes back: a static `aria-selected="true"` left two tabs selected (ticket 18, measured; building-blocks 1.4).
- The author must write every `id`, `aria-controls`, and `aria-labelledby` by hand, and keep them unique across `@for` rows ([ADR 0013](../adr/0013-parts-name-their-targets-by-reference.md)).
- `(yeti:select)` does not compile in a template ([events](events.md)).
- The vertical form has no `aria-orientation="vertical"` (ledger A11Y-5), the selected tab vanishes under forced colours (A11Y-1c), and nothing about the selection is in the server HTML (A11Y-17).

Angular Aria's Tabs closes the accessibility gaps, but used as it ships it breaks the package's rendering-modes contract: it sets the roving `tabindex` and its initial state in `afterRenderEffect`, which never runs on the server, so every server-rendered tab has `tabindex="-1"` and non-selected panels are `inert` (upstream bug A5; ticket 29); its generated ids change at hydration (upstream bug A6); it hides a panel only with `inert`, which Yeti's CSS does not key on (`NC/src/aria/tabs/tab-panel.ts:29-30`, `:49`); and with no bound selection it selects nothing (`NC/src/aria/private/tabs/tabs.ts:227-246` sets the active tab, not the selected one).

## Solution

Four directives in `ngx-yeti/tabs` host Aria's four Tabs directives by composition (the user's "Composition (Recommended)", map, Standing rulings), through Aria's public API only (ticket 30):

- **`YetiTabs`** on the set's element binds `class="tabs"` and `data-variant`, `data-gap`, `data-emphasis`, and `data-orientation`, hosts `ngTabs`, provides `yetiTabsToken`, emits `select` with `{ tab, panel }` when a reader changes the selection, and reveals the tab whose panel holds the URL's fragment after hydration and on every `hashchange`, nesting outward.
- **`YetiTabList`** on the `tablist` hosts `ngTabList` and exposes `orientation` (which binds `aria-orientation`), `wrap`, `selectionMode`, `softDisabled`, and the selection as the `selected` model. It selects the first tab when none is bound, so the server HTML always shows a selected tab, and it stops a replayed key at the list.
- **`YetiTab`** on each `button` hosts `ngTab` (`value`, `disabled`) and gives the selected tab the one Tab stop in the server HTML until Aria's own roving takes over.
- **`YetiTabPanel`** on each panel hosts `ngTabPanel` (`value`) and keeps every panel visible and not inert until Aria is live, then adds `hidden` to the panels that are not selected, beside Aria's `inert`.

The consumer writes Yeti's markup with directive attributes and `value` pairs in place of ids and `aria-*` references. Ids come from `provideYetiAriaIds()` on the tab and the panel, so the server and the client render the same `ng-tab-<n>` and `ng-tabpanel-<n>` ([ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md)).

With JavaScript off, before hydration, and inside `hydrate never`, every panel shows, as Yeti's own page without its script does, and the selected tab is the one Tab stop of the list (the user's "All panels show (Recommended)"; ticket 30, measured). The `buttons` toolbar decided differently: every member keeps its native Tab stop until Aria is live ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 113, option B, from ticket 77's open point 2). The reason for the difference, in one sentence: with every panel on screen, a tab that is not selected leads to nothing a reader cannot already reach, because its panel and everything focusable in it are already visible and in the Tab sequence, while a toolbar member is itself the control a keyboard user has to press.

The selected tab's look under forced colours is restored by one rule in the package's accessibility stylesheet (A11Y-1c). The `tabs` **Item file** loads with the first set and unloads after the last ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)).

## User Stories

1. As an application developer, I want to write `yetiTabs`, `yetiTabList`, `yetiTab`, and `yetiTabPanel` where Yeti's docs write the class, the `tablist`, the tabs, and the panels, so that my markup stays Yeti's.
2. As an application developer, I want to pair each tab with its panel by a `value`, so that I write no `id`, `aria-controls`, or `aria-labelledby` by hand.
3. As an application developer, I want the tab and panel ids to be equal on the server and the client, so that hydration rewrites no reference.
4. As an application developer, I want ids that stay unique across `@for` rows and several tabs sets on one page, so that every `aria-controls` names one panel.
5. As an application developer, I want a tabs set to select its first tab when I bind nothing, so that it behaves like Yeti's module at load.
6. As an application developer, I want to bind the selected tab with `[(selected)]` on the tab list, so that the selection is part of my component's state.
7. As an application developer, I want a parent's write to `selected` to change the selection without emitting `select`, so that my own code does not report itself as a reader's choice.
8. As an application developer, I want `(select)` with `{ tab, panel }` on the set when a reader clicks a tab, presses an arrow key, or follows a link into a hidden panel, so that I can port code that listened for `yeti:select`.
9. As an application developer, I want no `select` when the page loads, so that a selection already on screen is not reported as a change.
10. As an application developer, I want `variant`, `gap`, and `emphasis` typed by Yeti's vocabularies, so that a misspelt value fails to compile.
11. As an application developer, I want `orientation="vertical"` on the tab list to set Yeti's vertical look, the vertical arrow keys, and `aria-orientation`, so that one input does all three.
12. As an application developer, I want an unset input to render no attribute, so that Yeti's own defaults apply.
13. As an application developer, I want automatic activation by default and `selectionMode="explicit"` for manual activation, so that I can choose the APG variant that fits slow panels.
14. As an application developer, I want to disable a tab and still let keyboard users reach it, so that they learn it exists.
15. As an application developer, I want tabs that never wrap at the ends when I set `wrap` to false, so that I can match an application's convention.
16. As an application developer, I want a tabs set inside another set's panel to keep its own selection and keys, so that nested sets work as in Yeti.
17. As an application developer, I want a tabs set rendered by a route, `@if`, `@for`, or a client `@defer` to work, so that I am not limited to the first page load.
18. As an application developer, I want the `tabs` item file loaded while a set is on the page and removed after the last one, so that pages without tabs do not load its CSS.
19. As an application developer, I want every directive to have an `exportAs`, so that I can take a template reference to it.
20. As an application developer, I want a forgotten directive to fail loudly where it can, so that I do not ship a broken set.
21. As an application developer, I want a deep link to an element inside a hidden panel to show that panel, so that a link from elsewhere is never a dead end.
22. As an application developer, I want deep links to work under `<base href>` on any route, so that a bare `#id` does not reload my application.
23. As an application developer, I want the deep-link reveal to work for sets nested two levels deep, so that every enclosing panel opens.
24. As an application developer, I want a reveal not to move keyboard focus, so that a reader who did not touch the tabs is not moved.
25. As an application developer, I want the server HTML to show every panel, so that crawlers and readers without JavaScript see all the content.
26. As an application developer, I want the server HTML to mark one tab selected and give it the one Tab stop, so that the first paint is already a tab list.
27. As an application developer, I want hydration to log no `NG05xx` error and leave the server's ids and selection unchanged, so that hydration stays clean.
28. As an application developer, I want a click on a tab made before hydration to select that tab once hydration runs, so that an early reader is not ignored.
29. As an application developer, I want a set inside `hydrate never` to stay readable with every panel shown, so that a never-hydrated block loses nothing a reader came for.
30. As an application developer, I want a set inside `@defer (hydrate on ...)` to work natively until it hydrates, so that deferring costs nothing visible.
31. As an application developer using `withI18nSupport()`, I want translated tab labels and panels to hydrate, so that localisation does not re-render the set.
32. As an application developer using zoneless change detection, I want the selection, the panels, and the Tab stop to refresh from signals, so that the set works without zone.js.
33. As an application developer, I want the package to dispatch no `yeti:select` DOM event and to load no `tabs.js`, so that nothing runs twice.
34. As a keyboard user, I want one Tab stop for the tab list, on the selected tab, so that Tab moves from the list to its panel.
35. As a keyboard user, I want Left and Right (Up and Down in a vertical list) to move between tabs, with Home and End to the ends, so that the list works as the APG describes.
36. As a keyboard user in a right-to-left page, I want Left and Right swapped, so that the arrows follow the reading direction.
37. As a keyboard user, I want Tab from the selected tab to reach its panel, so that I never skip the content.
38. As a keyboard user with JavaScript off, I want to reach the selected tab and every panel's content by Tab, so that nothing is unreachable.
39. As a screen-reader user, I want each tab announced as a tab with its selected state and its position, so that I know which view is shown.
40. As a screen-reader user, I want each panel named by its tab, so that I know which view I am reading.
41. As a screen-reader user, I want a vertical list announced as vertical, so that I use the right arrows.
42. As a screen-reader user, I want the tab list to have its own name, so that I can tell two sets apart.
43. As a screen-reader user, I want a hidden panel out of the accessibility tree once the app is live, so that I do not read views that are not shown.
44. As a forced-colours user, I want the selected tab drawn differently from the others, so that I can see which view is shown.
45. As a low-vision user, I want the selected tab's mark and text to meet WCAG contrast in the light and dark schemes, so that I can see the selection.
46. As a pointer user, I want each tab at least 24 by 24 CSS pixels, so that I can hit it.
47. As a user on a 320 px wide screen, I want the tab list to wrap rather than scroll the page sideways, so that I can read without two-dimensional scrolling.
48. As a user who prefers reduced motion, I want the tab colours to change without a transition, so that the page does not animate against my setting.
49. As an accessibility reviewer, I want ledger rows A11Y-1c, A11Y-5, A11Y-17, and A11Y-18 to say what the package adds and how it is tested, so that I can tell what complies because of the package.
50. As a package maintainer, I want the package to use Aria's public API only, so that an Aria release breaks nothing private.
51. As a package maintainer, I want every attribute the package and Aria both bind to change together, so that the two bindings never fight.
52. As a package maintainer, I want the contract check to fail if the Pin adds an attribute, a value, or an event to `tabs`, so that a Pin move cannot slip past the spec.
53. As a package maintainer, I want the `orientation` input's union to equal Yeti's `orientation` vocabulary, so that Aria's type and Yeti's do not drift apart unnoticed.
54. As a package maintainer, I want the four test layers to cover the hand-over, the default selection, the reveal, and the rendering modes, so that what ticket 30 measured stays measured.
55. As a package maintainer, I want `provideYetiAriaIds()` to leave ids of Material, CDK, or Aria content inside a panel alone, so that the package changes only its own ids.

## Implementation Decisions

### 1. Yeti contract

From the manifest at the Pin (`Y/src/components/tabs/manifest.json`):

- **Class** `tabs`, kind `component`, group "Navigation", since `7.0.0`.
- **Attributes:** `data-variant` (vocabulary `variant`, 9 values, default `primary`), `data-orientation` (vocabulary `orientation`: `horizontal`, `vertical`; default `horizontal`), `data-gap` (vocabulary `gap`, 29 values, default `md`), `data-emphasis` (own value list: `high`; no default). No **Markers**.
- **Children:** `> [role="tablist"]` (exactly one, "with a name of its own"), `[role="tab"]` (two or more, "a button whose aria-controls names its panel"), `> [role="tabpanel"]` (two or more, "a panel whose aria-labelledby names its tab").
- **Tokens:** `--yeti-tabs-border`, `--yeti-tabs-padding`, `--yeti-border-width`, `--yeti-space-md`, `--yeti-color-primary` with its `-subtle`, `-soft`, `-strong`, and `-text` stops, `--yeti-on-primary`, `--yeti-space-xs`, `--yeti-weight-strong`, `--yeti-duration-fast`, `--yeti-ease`, `--yeti-radius-sm`, and seven **Private tokens**.
- **a11y:** no required attribute; keyboard "Left / Right", "Up / Down", "Home / End", and "Tab leaves the list for the selected panel"; notes: name the tablist, pair tabs and panels, and "Without it nothing is hidden and every tab is focusable, which is plainer but never traps content".
- **Module and event:** `tabs.js`, optional, dispatching `yeti:select` with `{ tab, panel }` "when a click, an arrow key, or a hash reveal selects a tab; never for the pass at load that finds no hash to reveal".
- **support:** `unguarded: ["logical properties"]`, inside Baseline 2025.

How it looks (`Y/src/components/tabs/tabs.css`, `@layer yeti.components`): `.tabs` is a flex column with `gap: var(--_yeti-gap)` (`:7-12`); the tab list wraps and draws the line under it (`:14-19`); a tab is an unstyled button with padding and a transparent 2x border on its block end (`:20-36`); the selected tab, `[aria-selected="true"]`, takes the variant's text colour and border (`:38-41`), or with `data-emphasis="high"` a filled chip with rounded leading corners (`:47-57`); `data-orientation="vertical"` turns the set into a row, the list into a column, and the mark to the inline end (`:60-75`). No rule hides a panel (`:1-5`). The `[data-gap="..."]` and `[data-variant="..."]` rules that set `--_yeti-gap` and `--_yeti-variant*` are in the always-loaded `layouts/attributes.css` (`:9`, `:240`), and the `[hidden]` rule a hidden panel relies on is in the always-loaded reset (`Y/src/base/reset.css:77-79`).

Left to the consumer (ticket 26 leaves no attribute to the consumer; these are the consumer's because they are content or names, building-blocks 1.10): the list's `aria-label` or `aria-labelledby`, each tab's label, each panel's content, and `type="button"` on each tab.

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `tabs` | static host class on `[yetiTabs]` (`YetiTabs`) | always | ADR 0003 point 1; Part 2 row 40 |
| `data-variant` | the hue of the selected tab and its edge | `variant` on `yetiTabs`, type `YetiVariant`, `[attr.data-variant]` | unset renders nothing (Yeti's `primary` applies); not an HTML attribute name | ticket 26 row 152; ADR 0070 rule 1 |
| `data-orientation` | list along the top or down the side | `orientation` on `yetiTabList`, Aria's input (`'horizontal' \| 'vertical'`, Aria default `horizontal`, `NC/src/aria/tabs/tab-list.ts:80`); `yetiTabs` binds `[attr.data-orientation]` to `vertical` while its registered list is vertical, otherwise `null` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 200) | not an HTML attribute name | ticket 26 row 153 and its 2026-10-02 note; Part 2 row 40 |
| `data-gap` | space between the list and the panels | `gap` on `yetiTabs`, type `YetiGap`, `[attr.data-gap]` | unset renders nothing (`md` applies) | ticket 26 row 154 |
| `data-emphasis` | the selected tab filled | `emphasis` on `yetiTabs`, type `YetiTabsEmphasis` (`Extract<YetiEmphasis, 'high'>`, exported beside the re-exported vocabulary types), `[attr.data-emphasis]` | unset renders nothing (underline) | ticket 26 row 155; ADR 0080 point 5; ticket 50 decision 60's naming precedent |
| `> [role="tablist"]` | the tabs, named | `[yetiTabList]` (`YetiTabList`) hosting `TabList`; Aria's static `role="tablist"` (`tab-list.ts:50`) | the consumer writes no `role` (usage rule 4) | Part 2 row 40 |
| `[role="tab"]` | a button | `button[yetiTab]` (`YetiTab`) hosting `Tab`; Aria's static `role="tab"` (`tab.ts:42`) | as above | Part 2 row 40 |
| `> [role="tabpanel"]` | a panel | `[yetiTabPanel]` (`YetiTabPanel`) hosting `TabPanel`; Aria's static `role="tabpanel"` (`tab-panel.ts:46`) | as above | Part 2 row 40 |
| `id`, `aria-controls`, `aria-labelledby` | the author's, by hand | Aria's bindings from `value` pairing (`tab.ts:44`, `:48`; `tab-panel.ts:47`, `:50`), ids `ng-tab-<n>` and `ng-tabpanel-<n>` from `provideYetiAriaIds()` on `yetiTab` and `yetiTabPanel` | the consumer writes none of the three on a tab or a panel (usage rule 4) | ADR 0044 point 1 and its 2026-10-03 note; ticket 50 decisions 1, 5, and 198 |
| `value` (package) | not Yeti's | `value` on `yetiTab` and `yetiTabPanel`, Aria's required `string` input (`tab.ts:73`, `tab-panel.ts:81`) | a static attribute stays on the element; on `button type="button"` it is `inert` (the button submits nothing); on a panel it is no HTML attribute | building-blocks 1.4 (kinds), 1.9 (value pairing) |
| `aria-selected` | written by `tabs.js` | Aria's binding from the `selected` model (`tab.ts:46`); the first tab is selected when nothing is bound (section 4; ticket 50 decision 199) | never static (usage rule 5; a static `aria-selected="true"` left two tabs selected, ticket 18) | A11Y-17; building-blocks 1.4 |
| `tabindex` on tabs | roving, written by `tabs.js` | Aria's roving value once live; before that the package's hand-over: the selected tab `0`, the others `-1` | never static | "Aria decisions" row 40; ticket 30, measured |
| `hidden` on panels | written by `tabs.js` | `[attr.hidden]` on `yetiTabPanel`: `""` while Aria is live and the panel is not visible, otherwise `null` | absent in the server HTML (every panel shows) | "Aria decisions" row 40; A11Y-17's 2026-10-03 note |
| `inert` on panels | not Yeti's | Aria's binding (`tab-panel.ts:49`), overridden by `[attr.inert]` on `yetiTabPanel` with the same condition as `hidden` and Aria's value `true` | absent in the server HTML | building-blocks 1.9 (a binding computed from the same public signal); ticket 30, measured |
| `tabindex` on panels | `0` or `-1` by focusable content (`tabs.js:22`) | Aria's: `0` for the visible panel, `-1` otherwise (`tab-panel.ts:48`) | never static | Part 2 row 40 (`InteractivityChecker` not used) |
| `aria-orientation` | absent (A11Y-5) | Aria's binding on the list from `orientation` (`tab-list.ts:53`) | `horizontal` unless `orientation` is `vertical` | A11Y-5 |
| `aria-disabled` on tabs | none | Aria's, from `disabled` (`tab.ts:47`) | `false` unless disabled | A11Y-18 |
| `disabled` on a tab (HTML) | none | `[attr.disabled]` bound to `null` on `button[yetiTab]`, kind `removed` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 202) | a static `disabled` is written back at hydration and removed in the same pass | building-blocks 1.4; ticket 50 decision 9's pattern |
| `aria-label`, `aria-labelledby` on the list | the author's | the consumer's; no name input | required by usage rule 2 | building-blocks 1.10 |
| `type="button"` on a tab | the author's | the consumer's | required by usage rule 3 | `tab.ts:96-98` |
| `data-active` (Aria's) | not Yeti's | Aria's binding on each tab (`tab.ts:43`), `false` in the server HTML | not styled by Yeti | Aria; ticket 30 server HTML |
| Event `yeti:select` | on `.tabs`, `{ tab, panel }` | `select` output on `yetiTabs`, type `YetiSelectDetail` from `ngx-yeti/events` | emits nothing at creation | [events](events.md) section 2; Part 2 row 40 |
| Tokens (section 1) | the line, padding, colours, timing, corner | the consumer's; the package writes none and offers no input | not applicable | ADR 0004 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-tabs=""` on `[yetiTabs]` only | always | ADR 0045; ticket 50 decision 6 |
| Injection token | not Yeti's | `yetiTabsToken`, provided by `YetiTabs` | not applicable | building-blocks 1.9; Part 2 row 40 |
| Package CSS | none in Yeti for `forced-colors` | one rule in `@layer ngx-yeti` for the selected tab under forced colours | in the package's accessibility stylesheet | A11Y-1c; map, Package CSS for accessibility |

**Module replaced: `tabs.js`** ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 40). No Yeti Module is loaded beside the package.

| `tabs.js` behaviour | Source | Package | Kept, changed, or removed |
| --- | --- | --- | --- |
| Pair each tab with the panel its `aria-controls` names | `:8-24` | Aria pairs by `value`; ids generated ([ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md)) | changed |
| A root's tabs are only those in its own tablist, never a nested set's | `:5-11` | DI scoping: each part injects the nearest `yetiTabsToken` and Aria's nearest `TABS` and `TAB_LIST`; `YetiTabList`'s content query covers its own tabs | kept |
| At load, select the tab with `aria-selected="true"`, else the first | `:38-41` | the bound `selected`, else the first tab, written when the list is created, in every rendering mode (section 4) | changed: the consumer binds `selected`; a static `aria-selected` is not read |
| Only at load; tabs added later are not picked up | `:4` | every set is set up when created (building-blocks 1.15) | changed |
| `aria-selected` on every tab | `:16` | Aria (`tab.ts:46`) | kept |
| Roving `tabindex` | `:17` | Aria, with the package's server value until Aria is live | kept, and present in the server HTML (A11Y-17) |
| `hidden` on the panels not selected | `:19` | `[attr.hidden]` on `yetiTabPanel` once live | kept; absent before Aria is live, as Yeti's page without `tabs.js` |
| A panel takes `tabindex="0"` only if nothing inside it is focusable | `:20-22` | Aria: the visible panel is always `0` | changed (Part 2 row 40) |
| A click selects the tab, focuses it, and dispatches `yeti:select` | `:28-36`, `:90-96` | Aria's `click` on the list (`tab-list.ts:56`) selects and focuses; `yetiTabs` emits `select` | kept, except that a click on the tab already selected emits nothing ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 201) |
| Arrow keys by `data-orientation`, wrapping, Home and End, `preventDefault` | `:98-114` | Aria's key handling (`NC/src/aria/private/tabs/tabs.ts:159-191`), from `orientation`, `wrap`, and `Directionality` | kept; Left and Right swap in right-to-left (changed) |
| Ignore a click or key a page listener already prevented | `:91-92`, `:99-100` | Aria checks no `defaultPrevented` (no match in `NC/src/aria/`); a consumer vetoes a tab with `disabled` | changed |
| Reveal the tab whose panel holds the fragment's target, at load and on `hashchange`, outward through nested sets, without moving focus, scrolling the target into view (instantly on the first pass), dispatching `yeti:select` per changed set | `:43-88` | `yetiTabs` after hydration and on `hashchange` (section 4) | kept; "at load" becomes "after hydration" |
| A hash that cannot be decoded, names nothing, or names an element outside any panel changes nothing | `:59-66`, `:71` | the same | kept |
| Dispatch `yeti:select` on the `.tabs`, bubbling and composed | `:31-35` | the `select` output; no DOM event ([events](events.md) rule 5) | changed |
| Never dispatch for the pass at load | `:26-27` | the default selection emits no `select` | kept |

**Tokens subsection** (ADR 0004; building-blocks 1.13). The item reads the tokens listed in section 1 (`--yeti-tabs-border` defaults to `var(--yeti-color-border)` and `--yeti-tabs-padding` to `var(--yeti-space-sm) var(--yeti-space-md)`, `Y/src/tokens/components.css:68-69`). The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block, in a **Theme** file after Yeti, or with a runtime `setProperty`; derived tokens such as `--yeti-color-primary` may be set on the set's own element (`Y/src/guides/theming.md:38`). Private tokens are never read or written.

### 3. Hierarchy and DI shape

- **Root.** `YetiTabs` hosts Aria's `Tabs` through `hostDirectives` with no inputs exposed (`NC/src/aria/tabs/tabs.ts:52-57`), provides `{ provide: yetiTabsToken, useExisting: YetiTabs }` (`InjectionToken<YetiTabs>` in the tokens file, `import type`; building-blocks 1.9), and holds the tab list registered with it in a signal. It injects `YetiFragmentLinks` eagerly, so a bare `#id` link on the page fires `hashchange` instead of reloading under `<base href>` ([fragment-links](fragment-links.md) section 3; Part 2 row 51). Its last constructor statement is `injectYetiItemStyles('tabs')` ([setup](setup.md); ticket 50 decisions 42 and 45).
- **List.** `YetiTabList` hosts `TabList` with `inputs: ['orientation', 'wrap', 'selectionMode', 'softDisabled', 'selectedTab: selected']` and `outputs: ['selectedTabChange: selectedChange']`, so `[(selected)]` works on it (`tab-list.ts:80-109`; ticket 26's note: Aria reads `orientation` here, and a wrapper cannot set a hosted directive's input). It injects `yetiTabsToken` (required: a list cannot exist alone, building-blocks 1.9) and registers with the root in `ngOnInit`, unregistering on destroy. It holds `contentChildren(YetiTab, { descendants: true })`: building-blocks 1.9 allows a content query exactly where a directive must write a default during the server render, and names "the tabs' first-tab default". A nested set sits inside a panel, never inside the list, so the query holds only the list's own tabs. It carries the **Replay guard** (below).
- **Tab.** `YetiTab` hosts `Tab` with `inputs: ['value', 'disabled']`, lists `provideYetiAriaIds()` in its `providers`, and injects `yetiTabsToken` (required) and `Tab`. Aria's own `Tab` already injects `TAB_LIST` without `optional` (`tab.ts:59`), so a tab outside a list fails at creation either way.
- **Panel.** `YetiTabPanel` hosts `TabPanel` with `inputs: ['value']`, lists `provideYetiAriaIds()`, injects `yetiTabsToken` (required) and `TabPanel`, and registers with the root (for the reveal; order is not needed).
- **Aria composition** (building-blocks 1.9). Every binding the package adds on an attribute Aria also binds is computed from the same public Aria signals, so the two never fight: the tab's `tabindex` from `Tab.active()` and `Tab.selected()`, the panel's `inert` and `hidden` from `TabPanel.visible()` (`tab.ts:76`, `:79`; `tab-panel.ts:84`). "Aria is live" is the list's computed `some(tab => tab.active())`: Aria's active item is private and first set in an `afterRenderEffect` that never runs on the server (`tab-list.ts:127`, `:137-139`), so `active()` is `false` on every tab until then, on both ends (ticket 30, read and measured). No platform check, no `afterNextRender` flag, and no private API.
- **Generated ids.** `provideYetiAriaIds()` on `yetiTab` and `yetiTabPanel` answers only `ng-tab-` and `ng-tabpanel-` and passes every other `_IdGenerator` call to the parent injector, so Material, CDK, or Aria content inside a panel keeps its own ids (ADR 0044's 2026-10-03 note; ticket 50 decision 1). The package's directives call no `injectYetiId`: the only ids the item renders are Aria's.
- **Not hosted.** No Yeti item always sits on a tabs element (Part 2, "Two findings that hold across the matrix"). Aria's `TabContent` is not used: panel content is projected (building-blocks 1.11 decision 2).

**Replay guard** (building-blocks 1.9; CONTEXT.md). `YetiTabList` declares a `keydown` host listener that calls `stopPropagation()` for the keys Aria's list handles (the previous and next arrow for its orientation and direction, Home, End, Space, Enter), when `hasModifierKey` is false. Aria's keyboard manager runs its handler, then `preventDefault()`, then `stopPropagation()` (`NC/src/aria/private/behaviors/event-manager/event-manager.ts:67-77`; `keyboard-event-manager.ts:34-35`); during replay `preventDefault()` throws (building-blocks 1.11), so Aria's own `stopPropagation()` is skipped and the guard stops the key. It sits on the list rather than the root because Aria's `keydown` listener is on the list (`tab-list.ts:55`), the same element-level reading the [buttons](buttons.md) spec uses ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 203).

### 4. API

| Member | `YetiTabs` | `YetiTabList` | `YetiTab` | `YetiTabPanel` |
| --- | --- | --- | --- | --- |
| Class name | none of the four equals one of the 46 names `yeti.d.ts` exports at the Pin, so each takes `Yeti` (ADR 0080 point 4; ticket 50 decision 10) | as left | as left | as left |
| Selector | `[yetiTabs]` | `[yetiTabList]` | `button[yetiTab]` | `[yetiTabPanel]` |
| `exportAs` | `yetiTabs` | `yetiTabList` | `yetiTab` | `yetiTabPanel` |
| Entry point | `ngx-yeti/tabs` | same | same | same |
| Host directive | `Tabs`, no inputs | `TabList`, inputs and output above | `Tab`, `value`, `disabled` | `TabPanel`, `value` |
| Inputs | `variant: YetiVariant \| undefined`, `gap: YetiGap \| undefined`, `emphasis: YetiTabsEmphasis \| undefined` | `orientation: 'horizontal' \| 'vertical'` (default `horizontal`), `wrap: boolean` (default `true`), `selectionMode: 'follow' \| 'explicit'` (default `follow`), `softDisabled: boolean` (default `true`), all Aria's | `value: string` (required), `disabled: boolean` (default `false`), Aria's | `value: string` (required), Aria's |
| Models | none | `selected: string \| undefined` with `selectedChange` (Aria's `selectedTab`, aliased) | none | none |
| Outputs | `select: YetiSelectDetail` | `selectedChange` (the model's) | none | none |
| Methods | none | none | none | none |
| Host | static `class: 'tabs'`; static `data-ngx-yeti-item-tabs: ''`; `[attr.data-variant]`, `[attr.data-gap]`, `[attr.data-emphasis]`, `[attr.data-orientation]`; `(window:hashchange)` | `(keydown)` replay guard | `[attr.tabindex]` hand-over; `[attr.disabled]: 'null'` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 202) | `[attr.hidden]`, `[attr.inert]` |
| Providers | `yetiTabsToken` | none | `provideYetiAriaIds()` | `provideYetiAriaIds()` |
| Injection | `YetiFragmentLinks`; `DOCUMENT`; the ADR 0060 styles service through `injectYetiItemStyles('tabs')`, last | `yetiTabsToken`; `TabList` | `yetiTabsToken`; `Tab` | `yetiTabsToken`; `TabPanel`; its own `ElementRef` |

No Defaults token: nothing the package owns needs an application-wide default (building-blocks 1.4). No method selects a tab: the `selected` model is the way, as Aria's own public API is (`TabList.open(value)` stays Aria's and is not re-exported).

**The default selection** (A11Y-17; building-blocks 1.9 and 1.15). When `YetiTabList`'s content is initialised and `selected` holds no value that names one of its tabs, it writes the value of the first tab that is not `disabled` into Aria's `selectedTab` model. Angular runs a view's content hooks before its host bindings in the same pass (inferred from the order of a view refresh; not run), so Aria's `aria-selected`, the tab's `tabindex`, and the panel's `aria-labelledby` and `tabindex` already reflect it in the server HTML, and the client's first pass computes the same values. The write emits `selectedChange` once with that value, so `[(selected)]="tab"` with `tab` unset takes the first tab's value; it emits no `select` (events rule 9) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 199).

**When `select` fires** ([events](events.md) rules 2, 3, 7, 9). `yetiTabs` subscribes to its registered list's `selectedChange` and emits `select` with `{ tab, panel }` (the selected tab's element and the panel element with the same `value`, or `null`) for each change that comes from Aria's click or key handling or from the reveal below. The default write emits nothing; a parent's write through `[selected]` emits no `selectedChange` (`model()` emits only for its own `set`, `NGP/core/src/authoring/model/model_signal.ts:80-84`), so it emits no `select` either; a change to a value that names no tab emits nothing. `select` marks the choice, not the end of the colour transition.

**The reveal** (Part 2 row 40; `tabs.js:43-88`; [fragment-links](fragment-links.md) section 11). `yetiTabs` reveals once in `afterNextRender` after it is created, and again on every `window` `hashchange`:

1. It reads `location.hash`; an empty hash, one that `decodeURIComponent` rejects, or one that decodes to an empty string changes nothing.
2. It finds the target with `getElementById` on `DOCUMENT`; no target changes nothing.
3. For each panel registered with this root whose element contains the target (the panel itself included), whose tab is not selected, it selects that panel's value through Aria's `selectedTab` model. Each set does this for its own panels, so a target two levels deep opens the inner set and the outer one, each from its own root.
4. Each root whose selection changed scrolls the target into view after the next render, with `behavior: 'instant'` on the first pass and the page's own scroll behaviour on a `hashchange`, as `tabs.js:84` does.
5. It never moves focus. Each changed set emits `select` once.

The reveal runs in a render callback and a `window` listener only, so the server never reads `location` (building-blocks 1.11 decision 3). The `window:` host listener does not replay, which is right: before hydration every panel shows and the browser's own fragment scroll finds the target.

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiTabs` on a block element (`div` in Yeti's examples) whose direct children are one `yetiTabList` element and then the `yetiTabPanel` elements, and put the `button[yetiTab]` elements as direct children of the list (manifest `children`; `tabs.css` reaches tabs only through `> [role="tablist"] >`). `@if`, `@for`, and `ng-container` add no element.
2. Name every tab list with `aria-label` or `aria-labelledby` (manifest `a11y.notes`; building-blocks 1.10).
3. Write each tab as `<button type="button" yetiTab value="...">`. With no `type`, Aria's `Tab` writes `type="button"` itself in its constructor (`tab.ts:96-98`), a direct DOM write the hydration constraints rule out. Give each tab of a set a unique `value` and give exactly one panel the same `value` (Aria's development checks warn otherwise, `tab-list.ts:157-161`, `tab.ts:105-108`).
4. Write no `class="tabs"`, `data-*` attribute, `data-ngx-yeti-item-tabs`, `role`, `id`, `tabindex`, `aria-selected`, `aria-controls`, `aria-labelledby`, `aria-orientation`, `hidden`, or `inert` on the set or its parts. The directives and Aria bind them; a static `aria-selected` is written back at hydration (ticket 18), and a consumer `id` on an Aria-hosted part is not supported ([generated-ids](generated-ids.md), `provideYetiAriaIds()`; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 5 and 198).
5. Choose the first selection by binding `selected` on the list (`selected="billing"`, `[selected]`, or `[(selected)]`), never with `aria-selected`.
6. A deep link targets an element inside a panel that carries a consumer `id`, never the panel or the tab, whose ids are generated (ticket 50 decision 5; building-blocks 1.5). The root starts [fragment-links](fragment-links.md)' listener, so a bare `#id` link works under `<base href>` once the application is live; where a link must work before hydration or with JavaScript off, write the current path into its `href` ([fragment-links](fragment-links.md) usage rule 3). A `routerLink` with `fragment` fires no `hashchange`, so it does not reveal (ticket 20, R3b).
7. Project panel content directly into the panel. Aria's `ngTabContent` is not supported: its content is created after the first render, so a panel would be empty in the server HTML and with JavaScript off (building-blocks 1.11 decision 2).
8. Wrap a whole tabs set in one `@defer` block, never a part of it (building-blocks 1.11 decision 6).
9. Disable a tab with `disabled` on `yetiTab`; with `softDisabled` at its default the tab stays focusable and announced as disabled (A11Y-18). Do not rely on a `(click)` handler's `preventDefault()` to veto a tab: Aria does not check it.
10. Put a nested set inside a panel, as its own `yetiTabs` element.
11. Import all four directives in every component whose template writes them. A forgotten `YetiTabList` or `YetiTabs` fails at creation, because Aria's `Tab` and `TabList` inject their parents without `optional` (`tab.ts:59`, `tab-list.ts:69`); a forgotten `YetiTabPanel` leaves a panel that no tab controls, which Aria's development check reports (`tab.ts:105-108`); a forgotten `YetiTab` leaves a plain button outside the list's roving (building-blocks 1.9; inferred from the injections).
12. Use tabs for alternative views of one thing, not for steps in a sequence or for content a reader must compare (Yeti's docs, "When to use it").

### 5. Material comparison

| Concern | Material `MatTabGroup` (`NC/src/material/tabs/`) | ngx-yeti | Why |
| --- | --- | --- | --- |
| Shape | a component that renders its own header, ink bar, and body (`tab-group.ts`) | attribute directives on Yeti's markup | building-blocks 1.1; Yeti owns the look |
| Selection state | `selectedIndex` input, `selectedIndexChange` (`tab-group.ts:170`, `:274`) | `selected` model by `value` (Aria's) | Part 2 row 40: value pairing |
| Change output | `selectedTabChange` with a change event object (`:284`), `focusChange` (`:277`) | `select` with `{ tab, panel }` | Yeti's frozen `detail` keys ([events](events.md)) |
| Activation | manual: arrows move focus, Enter or Space selects (`paginated-tab-header.ts:336-349`) | automatic by default, manual through `selectionMode="explicit"` | Yeti's `tabs.js` and the APG's recommendation (`APG/tabs/tabs-pattern.html:104`); A11Y-18 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 204) |
| Disabled tab | `disabled` on `mat-tab` | `disabled`, soft by default | A11Y-18 |
| Lazy content | `matTabContent`, `preserveContent` (`tab-group.ts:232`) | not offered | usage rule 7 |
| Panel focus | `contentTabIndex` (`:205`) | Aria's panel `tabindex` | Part 2 row 40 |
| Animation | `animationDuration` (`:182-196`) | Yeti's colour transition only; panels switch at once | building-blocks 1.6 |
| Header position, ink bar fitting, stretch, alignment | inputs (`:142-179`) | not applicable: Yeti's CSS and tokens | ADR 0004 |
| Links as tabs | `mat-tab-nav-bar` | not offered: Yeti's tabs are buttons | manifest `children` |
| Defaults | `MAT_TABS_CONFIG` | none | building-blocks 1.4 |
| Forced colours | no selected-state rule (`tab-header.scss:21-28` covers disabled only) | one rule (A11Y-1c) | ledger A11Y-1c |

Borrowed: a model for the selection, a change output, disabled tabs. Not borrowed: generated structure, lazy content, animation inputs, the defaults token.

### 6. Implementation level and primitives

`@angular/aria`, level 2 (Part 2 row 40; building-blocks Part 2 counts since 2026-10-03: Aria 2, `tabs` and `buttons`). Row 40's reason: Tabs is "the one Aria pattern that fits Yeti's elements without replacing them", and it adds manual activation, soft-disabled tabs, value pairing, and server-rendered selection. The user's rule for when to use Aria (map, Standing rulings, 2026-10-02) is met: Aria addresses accessibility features Yeti lacks (A11Y-5, A11Y-17, A11Y-18), and the problems Aria brings (A5's server `tabindex` and `inert`, A6's ids, the missing `hidden`, no default selection) are fitted by composition (ticket 30) and [ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md). Building blocks: `Tabs` (`NC/src/aria/tabs/tabs.ts:52-116`), `TabList` (`tab-list.ts:46-186`), `Tab` (`tab.ts:38-124`), `TabPanel` (`tab-panel.ts:42-130`), through their public inputs, models, and `active()`, `selected()`, `visible()` only; `TabContent` is not used. CDK: `_IdGenerator` only through `provideYetiAriaIds()` ([generated-ids](generated-ids.md)), `hasModifierKey` for the replay guard, and `Directionality`, which Aria's list injects for the right-to-left swap (`tab-list.ts:83`). `InteractivityChecker` is not used: Aria sets the panel's `tabindex` (Part 2 row 40). Native platform: `hidden` through Yeti's `[hidden]` rule, `location.hash`, `hashchange`, `scrollIntoView`.

### 7. Accessibility (WCAG 2.2 AA), ARIA, and keyboard

APG pattern: Tabs (`APG/tabs/tabs-pattern.html`), automatic activation by default (`:104`), manual activation as the option (`:49`; A11Y-18).

**Roles, states, and properties** (all Aria's bindings unless marked):

| Element | Role | States and properties |
| --- | --- | --- |
| `yetiTabList` | `tablist` | `aria-orientation` (`horizontal` or `vertical`, A11Y-5); `aria-disabled="false"`; `tabindex="-1"` in roving mode; its name is the consumer's (usage rule 2) |
| `yetiTab` | `tab` | `aria-selected`; `aria-controls` to its panel's `ng-tabpanel-<n>`; `aria-disabled`; `id` `ng-tab-<n>`; `tabindex` (the package's hand-over, then Aria's roving) |
| `yetiTabPanel` | `tabpanel` | `aria-labelledby` to its tab's id; `id` `ng-tabpanel-<n>`; `tabindex` `0` when visible, `-1` otherwise; `inert` and `hidden` (the package's) while live and not visible |

**Keyboard** (Aria's, `NC/src/aria/private/tabs/tabs.ts:159-191`; Yeti's manifest `a11y.keyboard`):

| Key | Once Aria is live | Before Aria is live (JavaScript off, before hydration, `hydrate never`) |
| --- | --- | --- |
| Tab | enters the list on the active tab, which is the selected tab until the reader moves it; the next Tab reaches the selected panel | reaches the selected tab, then the selected panel, then the focusable content of the other panels, which all show |
| Left, Right (horizontal) | previous and next tab, wrapping by default; swapped in right-to-left; selection follows focus in `follow` mode | nothing |
| Up, Down (vertical) | previous and next tab | nothing |
| Home, End | first and last tab | nothing |
| Space, Enter | select the focused tab (`explicit` mode); in `follow` mode it is already selected | the button's own activation, which selects nothing; a press before hydration is replayed (section 10) |
| Pointer press on a tab | selects and focuses it | nothing before hydration, then replayed |

**Focus:** one Tab stop for the list (building-blocks 1.10), on the selected tab in the server HTML and on Aria's active tab once live; the focus ring is Yeti's `:focus-visible` rule from the always-loaded group. A reveal never moves focus. Aria moves the active tab, and so the Tab stop, only through a reader's click or key: a reveal or a parent's write after the reader has interacted with the list leaves the stop on the previously active tab, because Aria's active item is private (`tab-list.ts:127`; `setDefaultStateEffect` stops after the first interaction, `NC/src/aria/private/tabs/tabs.ts:248-251`; read, not run) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 205).

**WCAG 2.2 AA criteria the item touches:**

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | roles, `aria-controls`, and `aria-labelledby` from Aria, with ids that resolve on both ends (ADR 0044) |
| 1.3.2 Meaningful Sequence | panels follow the list in DOM order, and the list follows the DOM order of its tabs (usage rule 1) |
| 1.4.1 Use of Color | the selected tab carries an underline or a fill, not only a text colour (`tabs.css:38-57`) |
| 1.4.3 Contrast (Minimum) | every tab label, selected or not, at least 4.5:1 against what it sits on, including the on-variant text of a filled tab, in the light and dark schemes; asserted in play functions with the exact formula (ADR 0015 point 3; ticket 50 decision 8) |
| 1.4.10 Reflow | the list wraps (`tabs.css:16`), so a set at 320 px does not scroll the page sideways; asserted in layer 4 |
| 1.4.11 Non-text Contrast | the selected tab's underline (or its fill with `emphasis="high"`) at least 3:1 against the adjacent background, asserted between the selected and an unselected tab in the play function (building-blocks 1.10); the focus ring is Yeti's |
| 2.1.1 Keyboard | once live, every tab by Tab and the arrows; before Aria is live, the selected tab and every panel's content by Tab, which reaches everything because every panel shows (user's "All panels show (Recommended)") |
| 2.4.3 Focus Order | Tab goes from the selected tab to its panel (manifest `a11y.keyboard`) |
| 2.4.7 Focus Visible | Yeti's ring on `:focus-visible`; Aria's `.focus()` inside a key handler counts as keyboard focus (ticket 29, measured for the toolbar; inferred for tabs) |
| 2.5.8 Target Size (Minimum) | each tab's box at least 24 by 24 CSS pixels with Yeti's padding; asserted in play functions |
| 4.1.2 Name, Role, Value | role, `aria-selected`, `aria-orientation` (A11Y-5), `aria-disabled` (A11Y-18); the list's name is the consumer's |

**Ledger rows owned** ([ledger.md](../ledger.md)):

- **A11Y-1c**, forced colours: the selected tab looks like the others, because Yeti draws it with a colour and ships no `forced-colors` rule (measured in Chromium and Firefox). The package adds one rule to its accessibility stylesheet, inside `@layer ngx-yeti` and `@media (forced-colors: active)`, on `.tabs > [role="tablist"] > [role="tab"][aria-selected="true"]`, drawing the selected tab with a border in a system colour on the edge Yeti marks (the block end, or the inline end in a vertical set), after the CDK `high-contrast` mixin's query (`NC/src/cdk/a11y/_index.scss:48-65`) and the shape of the button's A11Y-1a rule ([button](button.md) section 7). It selects Yeti's state hook only, reads no private token, and names no package class (map, Package CSS for accessibility). The first spec to write a rule creates the stylesheet (building-blocks Part 3); the [setup](setup.md) spec loads it (`ngx-yeti/accessibility.css`, ticket 50 decision 68). Tested by L4.
- **A11Y-5**, `aria-orientation` on a vertical list: Aria's `TabList` binds it from `orientation` (`tab-list.ts:53`). Tested by L1 (`tabs--vertical`) and L3.
- **A11Y-17**, the selected tab and one Tab stop in the server HTML: Aria's host bindings with the package's default selection and `tabindex` hand-over render on the server; under the 2026-10-03 note every panel is visible in the server HTML, with no `hidden` and no `inert`, and the non-selected panels are hidden only once the app is live. Tested by L3 (one `aria-selected="true"`, one tab with `tabindex="0"`, no `hidden` or `inert` on any panel) and L4 (hidden once live). Verified: measured in ticket 30 with a bound selection; the unbound default is measured by this spec's layer 3.
- **A11Y-18**, manual activation, soft-disabled tabs, and value pairing: exposed from the hosted Aria directives (`selectionMode`, `softDisabled`, `disabled`, `value`). Tested by L1.

The row texts of A11Y-17 and the Part 2 row 40 sentence on `hidden` were older than the user's "All panels show" ruling; both now say that every panel shows until Aria is live and that the panel binds `hidden` and `inert` after that ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 206).

### 8. Rendered HTML

Consumer markup (Yeti's docs example, `Y/src/components/tabs/docs.md:12-19`, with the package's attributes):

```html
<div yetiTabs emphasis="high" (select)="onSelect($event)">
  <div yetiTabList aria-label="Report" [(selected)]="view">
    <button yetiTab type="button" value="summary">Summary</button>
    <button yetiTab type="button" value="detail">Detail</button>
  </div>
  <section yetiTabPanel value="summary"><p>Summary panel.</p></section>
  <section yetiTabPanel value="detail"><p>Detail panel.</p></section>
</div>
```

Server HTML, with `view` unset (trimmed; attribute order as the server writes it; shape from ticket 30's `results/server-tabs.html` and the ids from ADR 0044; the unbound default is ticket 50 decision 199):

```html
<div yetitabs="" emphasis="high" class="tabs" data-ngx-yeti-item-tabs="" data-emphasis="high">
  <div role="tablist" yetitablist="" aria-label="Report" tabindex="-1" aria-disabled="false" aria-orientation="horizontal" jsaction="keydown:;click:;focusin:;">
    <button role="tab" yetitab="" type="button" value="summary" data-active="false" id="ng-tab-0" tabindex="0" aria-selected="true" aria-disabled="false" aria-controls="ng-tabpanel-0">Summary</button>
    <button role="tab" yetitab="" type="button" value="detail" data-active="false" id="ng-tab-1" tabindex="-1" aria-selected="false" aria-disabled="false" aria-controls="ng-tabpanel-1">Detail</button>
  </div>
  <section role="tabpanel" yetitabpanel="" value="summary" id="ng-tabpanel-0" tabindex="0" aria-labelledby="ng-tab-0"><p>Summary panel.</p></section>
  <section role="tabpanel" yetitabpanel="" value="detail" id="ng-tabpanel-1" tabindex="-1" aria-labelledby="ng-tab-1"><p>Detail panel.</p></section>
</div>
```

`<head>` holds the `tabs` item link (ADR 0060 point 5). Both panels show; the Summary tab is drawn selected (ticket 30 measured this one difference from Yeti's page without `tabs.js`, where no tab is drawn selected); `view` becomes `'summary'` through `selectedChange`.

Hydrated, once Aria is live: the same attributes, plus `data-active="true"` on the active tab, and `inert="true"` and `hidden=""` on the Detail panel (`checkVisibility()` false). Ids, references, and `aria-selected` are unchanged (ticket 30 and ADR 0044, measured). After ArrowRight: Detail is selected and active, the Summary panel takes `inert` and `hidden`, and `select` fires with the Detail button and its panel.

A vertical set (`orientation="vertical"` on the list): the root adds `data-orientation="vertical"` and the list `aria-orientation="vertical"`.

### 9. Animation

Yeti's own CSS transition on a tab's `color`, `background-color`, and `border-color` (`--yeti-duration-fast`, `--yeti-ease`; `tabs.css:31-35`), keyed on `aria-selected`. Panels switch at once through `hidden`, as with `tabs.js`. The package adds no class, no inline style, no `animate.enter` or `animate.leave`, and no **Completion output**: `select` marks the choice (building-blocks 1.6; [events](events.md) rule 7). Reduced motion is Yeti's: its tokens collapse the durations under `prefers-reduced-motion` (building-blocks 1.6 rule 4).

### 10. Rendering modes

- **Server output and first paint:** the class, the presence attribute, the typed attributes, Aria's roles and ids, the default or bound selection, one Tab stop on the selected tab, every panel visible and not inert, and the item link in `<head>` (section 8). Every visible state is a host binding on signal state (ADR 0011 clause 1).
- **Before hydration:** no directive creates a node, reads layout, starts an observer, or touches `window`, `history`, or `location` (building-blocks 1.11 decision 3). Aria's `afterRenderEffect`s and the root's `afterNextRender` run only on the client. Every panel shows; Tab reaches the selected tab and the panels' content (ticket 30, measured).
- **Full hydration:** the hosts are claimed as they are; the first client pass computes the server's values (the default selection, the hand-over, the ids, ADR 0044), so no `NG05xx` is logged (ticket 30, measured with a bound selection). At hydration the selected tab's `tabindex` goes `0`, `-1`, `0` within one batch, a write undone in the same batch (ticket 34, measured on the toolbar; inferred for tabs). Once Aria is live, non-selected panels take `hidden` and `inert`: a state change after hydration, not a mismatch. The user's words are the option label "All panels show (Recommended)"; hiding the other panels once live is the map's description of that option, and `inert` beside `hidden` is [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 206 (map, Standing rulings).
- **Event replay:** Aria's `keydown`, `click`, and `focusin` on the list are host listeners and carry `jsaction` (ticket 30's server HTML), so a press on a tab before hydration selects that tab once the set hydrates, and `select` fires once ([events](events.md) layer 4). Aria's click handler calls no `preventDefault()` (`click-event-manager.ts:47-48`); its key handler changes state before `preventDefault()` (`event-manager.ts:67-77`), and the replay guard stops a replayed key at the list. The `hashchange` listener is a `window:` listener and does not replay; nothing needs it to.
- **Incremental hydration (`@defer (hydrate on ...)`):** the set is server-rendered and works natively until its block hydrates (every panel shows); with `hydrate on interaction`, the click that hydrates the block is replayed and selects the clicked tab (inferred from the replay above; layer 4 measures it). The dehydrated root holds the item link (ADR 0060 point 4).
- **`hydrate never`:** the set stays its server HTML: styled, every panel visible, one Tab stop on the selected tab, the arrows and clicks select nothing, no reveal, no `select` (ticket 30, measured), and the item link stays while the host is connected (ADR 0045). This is the residue decision 206 accepts under the user's choice "All panels show (Recommended)".
- **Client-only `@defer`, `@if`, routed views:** the set is set up when created (building-blocks 1.15). Aria goes live after the first render, so for that first frame the client-created set shows every panel; the item file is fetched when `YetiTabs` is constructed, which can show unstyled frames until it arrives, closed with `provideYetiStyles({ preload: ['tabs'] })` (ADR 0060 point 6; [setup](setup.md)). Both are inferred; layer 4 records the frames.
- **`withI18nSupport()`:** tab labels and panels are usually translated with `i18n` in the consumer's component, which needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11). The directives render no string (building-blocks 1.10).
- **Zoneless:** the selection, "Aria is live", the hand-over, and the panels' `hidden` are signals or computeds over Aria's signals; `select` is emitted from a subscription to a model the view reads, so the view refreshes without zone.js (building-blocks 1.5; ticket 30 ran zoneless).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, JavaScript off; ADR 0011 consequences): every panel is readable and styled under its tab list, the selected tab is drawn and is the one Tab stop, and every panel's content is reachable by Tab. Lost: switching tabs, the arrow keys, the reveal (the browser's own fragment scroll still finds a target, since every panel shows), `select`, and keyboard access to the tabs that are not selected, which lead to nothing the reader cannot already reach. A consumer's bare `#id` link reloads to the base URL ([fragment-links](fragment-links.md) usage rule 3). A client-only application gets no such promise.
- **Hydration boundary:** the root, the list, the tabs, and the panels belong to one boundary (building-blocks 1.11 decision 6; usage rule 8): the parts inject the root's and Aria's parents, and the hand-over reads the list's tabs. Ids no longer need it (ADR 0044).

### 11. Hydration constraints

The item complies with Angular's hydration constraints (map, Standing rulings, item 54; ticket 33):

- **Same DOM on the server and the client:** structure is the consumer's; every attribute the package or Aria binds is computed from the same signals on both ends (ticket 30, measured: no hydration warning, the same tree). The ids are adopted ([ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md), measured).
- **Server HTML not altered at hydration:** no id, reference, `aria-selected`, or panel visibility changes during hydration. The `tabindex` written and undone in one batch (section 10) is not a painted change (inferred). `hidden` and `inert` appear after Aria is live, as the map describes the user's choice "All panels show (Recommended)" and decision 206 specifies.
- **No direct DOM manipulation:** the package writes only through host bindings; the reveal reads `location.hash` and `getElementById` and calls `scrollIntoView()` in a render callback or a `window` listener after hydration (building-blocks 1.11 decision 3); `YetiTabPanel` reads its own host only to compare it with the target. Aria's `type="button"` write is avoided by usage rule 3.
- **Valid HTML:** `button` inside a `div` with `role="tablist"`, panels as `section` or `div`; no interactive content inside a tab.
- **`preserveWhitespaces`:** the directives have no template; Yeti's selectors match elements only.
- **No output branched on the platform:** none. The "Aria is live" test reads Aria's public `active()`, not the platform.
- **Static attributes the directives bind:** the consumer writes none of them (usage rule 4). A static `disabled` on a tab is the one `removed`-kind case ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 202).

### 12. Single-page application

- **Navigation:** a tabs set is not a top-layer panel, so it does not use [navigation-close](navigation-close.md). A route's sets leave with the route; the item link is removed in the animation frame after no `[data-ngx-yeti-item-tabs]` host is connected (ADR 0060 point 4; ADR 0045). A set the Router reuses keeps its selection.
- **Fragment links:** `yetiTabs` injects `YetiFragmentLinks`, so a bare `#id` link on the page sets `location.hash` instead of reloading under `<base href>`, and the `hashchange` it fires drives the reveal ([fragment-links](fragment-links.md) sections 3 and 11; Part 2 row 51; A11Y-16, owned by fragment-links). The set owns no link, so it does not call `injectSameDocumentHref`. A `routerLink` with `fragment` fires no `hashchange` and does not reveal (usage rule 6).

### 13. Item file

`yeti-css/css/components/tabs/tabs.css`, one of Yeti's 49, loaded as a counted `<link>` by the ADR 0060 styles service: acquired when the first `[yetiTabs]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:56`, after `accordion` and before `dropdown`, through ADR 0060 point 3's rank table), and removed after the last host carrying `data-ngx-yeti-item-tabs` has left the DOM. `YetiTabList`, `YetiTab`, and `YetiTabPanel` acquire nothing and set no presence attribute (ticket 50 decision 6). The consumer's part is the [setup](setup.md) spec's one-time configuration: Yeti's build at the Pin, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds `[hidden]`, the `data-gap` and `data-variant` rules, the tokens, and the focus ring), the package's `ngx-yeti/accessibility.css` (which holds A11Y-1c's rule), and optionally `provideYetiStyles({ preload: ['tabs'] })`. Cross-item files acquired: none; `tabs.css` names no other item (ADR 0060 point 9). Items inside a panel load their own files through their own directives.

## Testing Decisions

A good test asserts what a reader, a keyboard user, or a consumer observes: the class and attributes, roles and ARIA, which panel is visible (`hidden`, `inert`, `checkVisibility()`), where Tab and the arrows go, the `select` payload, `selected` as the consumer reads it, the ids and references in the server and hydrated HTML, and the item link. It never asserts a private field, Aria's internal patterns, or how the styles service counts. No test depends on a public token's default value ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): contrast assertions compute ratios from the painted colours. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s. Prior art: Yeti's `Y/test/browser/components/tabs.spec.js` with `Y/test/browser/fixtures/components/tabs.html` (every panel readable without the module, one shown with it, click and arrow selection, the vertical arrows, the focusable panel, the hue and the fill, axe, `yeti:select` and the silent load pass, hash reveals instant then smooth, without focus, outside a panel, on a tab, encoded, nested two levels); ticket 30's `aria-composition-roving` probe (Tab walks per state, `MutationObserver` traces from first paint, the computed-style comparison with Yeti's page).

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group and `ngx-yeti/accessibility.css` globally and the `tabs` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**), in light and dark. `select` and `selectedChange` are declared as actions in `argTypes`. Story ids:

- `tabs--default`: Yeti's example (Profile, Billing), nothing bound. Asserts the root's `class` is `tabs` with `data-ngx-yeti-item-tabs` and no `data-*` attribute; the list's role, name, and `aria-orientation="horizontal"`; Profile `aria-selected="true"` with `tabindex="0"` and Billing `-1`; each tab's `aria-controls` names a `tabpanel` whose `aria-labelledby` names it back; Billing's panel is `hidden` and `inert`; no `select` fired on load and `selectedChange` fired once with `profile`; a click on Billing selects it, shows its panel, and fires one `select` with the Billing button and panel ([events](events.md) layer 1); ArrowRight, Home, and End move the selection; Tab from the selected tab focuses its panel; the contrast and target-size assertions of section 7 between the selected and an unselected tab; no `yeti:*` event reached a `document` listener.
- `tabs--vertical`: `orientation="vertical"`. Asserts `data-orientation="vertical"` on the root, `aria-orientation="vertical"` on the list (A11Y-5), Down and Up move the selection, and Left and Right do nothing.
- `tabs--emphasis`: `emphasis="high"` with each `variant` the story shows. Asserts `data-emphasis="high"`, the filled selected tab's on-variant text at 4.5:1 and the fill at 3:1 against the page, in both schemes and both orientations.
- `tabs--explicit`: `selectionMode="explicit"`. Asserts ArrowRight moves focus without selecting, Enter selects, and `select` fires only then (A11Y-18).
- `tabs--disabled`: the middle of three tabs `disabled`. Asserts `aria-disabled="true"`, no `disabled` attribute on the button, ArrowRight reaches it, and Enter and a click do not select it (A11Y-18; ticket 50 decision 202).
- `tabs--bound`: `[(selected)]` to a story signal set to the second tab, with a story button that sets the signal. Asserts the second tab is selected at first render with no `select`, and the button's write changes the selection with no `select`.
- `tabs--nested`: a set inside the first panel of another. Asserts the outer arrows leave the inner selection alone and the inner arrows move only the inner list (Yeti's nested tests).
- `tabs--fragment`: a target with `id="invoice-3"` inside the second panel of a nested set inside the outer second panel. The play function sets the story frame's `location.hash` and asserts both sets select the panels that hold it, the target is in view, focus has not moved, and each set fired one `select`. The subpath cases are in layer 4.
- `tabs--rtl`: `tabs--default` inside `dir="rtl"`. Asserts Left selects the next tab and Right the previous.

### Layer 2: browser-level (`npx nx test <lib>`, `tabs.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note) where a directive stands alone, and a test host where a part needs its parents or content:

- `createDirective(YetiTabs, { tagName: 'div' })`: class `tabs` and `data-ngx-yeti-item-tabs`; no `data-*` attribute; `bindings` set `variant`, `gap`, and `emphasis`, and the attributes follow after `whenStable()`; one `<link data-ngx-yeti-styles="tabs">` in `document.head` while it lives, gone after `fixture.destroy()` and an animation frame.
- Test host, Yeti's example: the default selection writes the first tab's value once and emits no `select`; with `selected` bound to the second value, nothing is written; with `selected` bound to a value that names no tab, the first tab is selected ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 199); a first tab that is `disabled` is skipped.
- Hand-over: after `whenStable()` every tab's `tabindex` equals Aria's roving value, the non-selected panel has `hidden` and `inert`, and the selected one has neither; after ArrowRight the two panels swap. The server branch, before Aria is live, is asserted in layer 3, where no render callback runs.
- `select`: one emission per click and per arrow key; none for a parent's write; none for a click on the tab already selected ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 201); payload elements are the button and the `section`.
- Replay-safe: a dispatched ArrowRight whose `preventDefault` throws still moves the selection, and an outer `keydown` listener on the root's parent does not see it (building-blocks 1.12; the replay guard).
- Reveal: setting the iframe's `location.hash` to a target in a hidden panel selects it after the `hashchange`, scrolls it into view, leaves `document.activeElement` unchanged, and emits one `select`; an undecodable hash, an unknown id, and an id outside any panel change nothing; two levels of nesting open both.
- `orientation`: `vertical` on the list sets `data-orientation="vertical"` on the root; `horizontal` and unset set none ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 200).
- Ids (test host): tabs and panels get `ng-tab-0`, `ng-tabpanel-0`, and so on with no random infix; a CDK id consumer and an Aria `Listbox` inside a panel keep CDK's own ids (ADR 0044's 2026-10-03 note; ticket 50 decision 1).
- RTL by wrapping the fixture in CDK's `[dir="rtl"]`: Left selects the next tab.
- Template references `#t="yetiTabs"`, `#l="yetiTabList"`, `#b="yetiTab"`, `#p="yetiTabPanel"` resolve.
- A `yetiTab` outside a list throws at creation (usage rule 11).

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `tabs.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture of section 8's markup whose labels and panels carry `i18n` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the root renders `class="tabs"`, `data-ngx-yeti-item-tabs`, and `data-emphasis="high"`; with `selected` unbound, exactly one tab has `aria-selected="true"` (the first) and exactly one has `tabindex="0"` (the same); with `selected` bound to the second, the second; no panel carries `hidden` or `inert`, and both panels' text is in the HTML (A11Y-17 and its 2026-10-03 note); ids are `ng-tab-<n>` and `ng-tabpanel-<n>` and every `aria-controls` and `aria-labelledby` resolves to one element; the list carries `jsaction` for `keydown`, `click`, and `focusin`; a vertical fixture renders `data-orientation="vertical"` and `aria-orientation="vertical"`; a static `disabled` on a tab is absent from the HTML ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 202); a bound `(select)` adds no attribute; `<head>` holds one item link with `data-ngx-yeti-styles="tabs"` and an `href` ending `components/tabs/tabs.css?v=<pin>`; the transfer state holds `ngx-yeti-ids` with the `ng-tab-` and `ng-tabpanel-` counts.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `tabs` has `YetiTabs`; `data-variant`, `data-gap`, and `data-emphasis` have `yetiTabs` inputs whose unions equal the manifest's values (`variant`, `gap`, and `high`); `data-orientation` has `yetiTabList`'s `orientation`, whose union equals the `orientation` vocabulary; `yeti:select` has `select` on `yetiTabs` with `YetiSelectDetail`'s keys equal to `tab` and `panel`. A Pin move that adds an attribute, a value, or an event fails here first. Type tests with `expectTypeOf`: `YetiTabsEmphasis` is exactly `'high'`.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids: real Tab, arrow, Home, End, Space, and Enter presses in three engines, including the right-to-left swap; under `emulateMedia({ reducedMotion: 'reduce' })` the tab colour change completes in one frame; at a 320 px viewport the page has no horizontal overflow with five tabs (1.4.10); under `emulateMedia({ forcedColors: 'active' })` in Chromium and Firefox, the selected tab's computed border width or colour differs from its neighbours', and with the accessibility stylesheet left out the same comparison finds no difference, which proves the rule draws it (A11Y-1c; axe does not check it); a screenshot per engine is recorded.

Fixture-app half, built with `outputMode: 'server'`, with a `/tabs` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences), under `<base href="/sub/">`:

- hydration logs no `NG05xx` (development build) and `componentsSkippedHydration === 0`; a `MutationObserver` from first paint records no change of `id`, `aria-controls`, `aria-labelledby`, or `aria-selected` during hydration (ADR 0044), records the selected tab's `tabindex` writes (ticket 34's `0`, `-1`, `0`), and then sees `hidden` and `inert` added to the non-selected panel only;
- with JavaScript disabled: every panel is visible, the first tab is drawn selected, Tab goes from the selected tab to its panel and on into the other panels' focusable content, and `@axe-core/playwright` with the six tags reports no violation;
- with `main.js` held back: the same as JavaScript off; a click on the second tab, then release: the second tab is selected and `select` was logged once ([events](events.md) layer 4);
- a cold load of `/sub/tabs#invoice-3` (a target in a hidden, nested panel): after hydration both sets show the panels that hold it, the target is in view, focus is on `body`, and `select` was logged once per changed set; whether any frame paints the target's panel hidden between hydration and the reveal is recorded;
- a consumer's bare link `href="#invoice-3"` after hydration: no reload, the panels open (the shared half of [fragment-links](fragment-links.md) layer-4 case 9);
- after a click on the first tab, then a reveal of the second panel: where Tab from outside lands is recorded ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 205);
- a set inside `@defer (hydrate on interaction)`: one click hydrates the block and selects the clicked tab; inside `hydrate never`: every panel stays visible, arrows do nothing, and the item link stays after every live set has left;
- a set inside a client-only `@defer` block, with and without `tabs` in the preload list: the frames before the item link applies and before Aria is live are recorded;
- navigating from the tabs route to one without tabs removes the item link, and navigating back re-inserts it;
- a `MutationObserver` installed before the main bundle records the `disabled` attribute's rewrite and removal on a `button[yetiTab]` whose consumer wrote a static `disabled` during hydration, and a `requestAnimationFrame` probe records whether a frame is painted while it is present; the test asserts the attribute is absent after hydration and that no frame is painted while it is present ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 9 and 202).

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

## Out of Scope

- Aria's `ngTabContent` and any other **Lazy content** (usage rule 7; building-blocks 1.11 decision 2; the user's "All panels show" ruling).
- Aria's `focusMode="activedescendant"` and the list-level `disabled`: not exposed (Part 2 row 40 lists the exposed inputs; building-blocks 1.9: a wrapper exposes only the inputs it wants). Adding one later is not breaking.
- A consumer `id` on a tab or a panel, and deep links to a panel or a tab itself (ticket 50 decisions 5 and 198).
- Links as tabs (Material's `mat-tab-nav-bar`), deletable tabs (the APG's optional Delete, `APG/tabs/tabs-pattern.html:93`), and a tab context menu.
- A public method to select a tab; the `selected` model covers it.
- Moving the roving Tab stop after a reveal or a parent's write once the reader has interacted: no public Aria API does it without focusing the tab ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 205).
- Any animation of the panel switch.
- Dispatching `yeti:select` as a DOM event ([events](events.md) rule 5).
- A misuse warning for the usage rules: checks belong to a later milestone (map, Milestones).
- Filing upstream bugs A5 and A6, or Aria's development warning for panels without `ngTabContent`: no upstream report without the user's confirmation (map, Standing rulings, Upstream bugs).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Aria Tabs hosted by composition through `hostDirectives`, public API only | Part 2 row 40; "Aria decisions" row 40; map, Standing rulings, "Composition (Recommended)"; ticket 30 |
| The selected tab keeps the one Tab stop in the server HTML until Aria's `active()` turns true | "Aria decisions" row 40; ticket 30, measured |
| Every panel shows with JavaScript off; `hidden` (with `inert`) only once live | map, Standing rulings, "All panels show (Recommended)"; A11Y-17's 2026-10-03 note |
| Tabs keep one stop while `buttons` keeps one per member until live: a tab not selected leads to nothing a reader cannot already reach while every panel shows | this spec's reading of the user's tabs ruling beside [ticket 77](../issues/77-spec-buttons.md) point 2 |
| Ids from `provideYetiAriaIds()` on `yetiTab` and `yetiTabPanel`, scoped to `ng-tab-` and `ng-tabpanel-`; no `id` input | ADR 0044 and its notes; ticket 50 decisions 1, 5, and 198 |
| `orientation` on `yetiTabList`; the root mirrors it into `data-orientation` | ticket 26's 2026-10-02 note; Part 2 row 40 |
| `aria-orientation` from Aria (A11Y-5) | ledger A11Y-5 |
| First-tab default written at content init through a content query | building-blocks 1.9 and 1.15; A11Y-17 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 199) |
| `select` on the root, `{ tab, panel }`, not for the load pass | [events](events.md); Part 2 row 40 |
| Reveal after hydration and on `hashchange`, outward, without focus | Part 2 row 40; `tabs.js:43-88`; [fragment-links](fragment-links.md) |
| `YetiFragmentLinks` injected eagerly | Part 2 row 51; [fragment-links](fragment-links.md) section 3 |
| Replay guard on the list | building-blocks 1.9 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 203) |
| Projected content, no `ngTabContent` | building-blocks 1.11 decision 2 |
| Forced-colours rule in `@layer ngx-yeti` | A11Y-1c; map, Package CSS for accessibility |
| Presence attribute on the root only; item file acquired last in its constructor | ADR 0045; ticket 50 decisions 6, 42, 45 |
| `YetiTabsEmphasis` as a named `Extract` type | ticket 26 row 155; ADR 0080 point 5; ticket 50 decision 60 |

### Usage examples

Imports, in the consumer's component: `imports: [YetiTabs, YetiTabList, YetiTab, YetiTabPanel]` from `ngx-yeti/tabs`, and `YetiSelectDetail` by type from `ngx-yeti/events`.

The default, Yeti's example: section 8's markup without `[(selected)]` and `(select)`; the first tab is selected.

A vertical settings set with manual activation:

```html
<div yetiTabs gap="lg">
  <div yetiTabList orientation="vertical" selectionMode="explicit" aria-label="Settings">
    <button yetiTab type="button" value="general">General</button>
    <button yetiTab type="button" value="keys">API keys</button>
    <button yetiTab type="button" value="billing" disabled>Billing</button>
  </div>
  <section yetiTabPanel value="general"><p>General settings.</p></section>
  <section yetiTabPanel value="keys"><p>Your API keys.</p></section>
  <section yetiTabPanel value="billing"><p>Billing is managed by your organisation.</p></section>
</div>
```

The selection as state, with Yeti's install-guide URL update ported to `select` ([events](events.md) usage examples), writing the tab's `value` rather than its generated id:

```html
<div yetiTabs (select)="remember($event)">
  <div yetiTabList aria-label="Account" [(selected)]="view">...</div>
  ...
</div>
```

```ts
readonly view = signal<string | undefined>('profile');

remember({ tab }: YetiSelectDetail): void {
  history.replaceState(null, '', `?view=${tab.getAttribute('value')}`);
}
```

A deep link into a panel: give the target inside the panel an `id` (`<h3 id="invoices">`) and link to `#invoices`; the set reveals its panel after hydration and on `hashchange`.

### Styles

1. **Item file:** `components/tabs/tabs.css` through ADR 0060's counted link (section 13); the consumer's one line is [setup](setup.md)'s optional `provideYetiStyles({ preload: ['tabs'] })` for client-only `@defer`.
2. **Always-loaded rules relied on:** `[hidden] { display: none !important; }` (`Y/src/base/reset.css:77-79`), which hides a non-selected panel; the `[data-gap]` and `[data-variant]` rules (`Y/src/layouts/attributes.css:9`, `:240`); the focus ring; the tokens.
3. **Cross-item rules:** none. A set nested in a panel keeps its own look, because every tab rule goes through the set's own `> [role="tablist"] >` (`tabs.css:1-5`).
4. **Tokens:** read as listed in section 1; the package writes none (section 2's Tokens subsection).
5. **Without the item file:** the tabs are plain buttons in a column with no line, no padding, and no selected mark, and the panels sit flush under them; once live, non-selected panels are still hidden by the always-loaded `[hidden]` rule.
6. **Tailwind:** no name collision (`tabs` is not a Tailwind class; Tailwind's `hidden` is a class, not the attribute).

### Platform features to adopt when the browser target moves

Not checked against [ADR 0002](../adr/0002-browser-target-baseline-2025.md)'s engines in this spec; each is adopted when every target engine ships it:

- `hidden="until-found"` with `beforematch` on the non-selected panels would let find-in-page and fragment navigation reveal a panel before scrolling, without waiting for `hashchange` ([fragment-links](fragment-links.md), Platform features).
- The Navigation API's `navigate` event could replace the `hashchange` listener for the reveal.

### Single-page-application pieces relied on

[fragment-links](fragment-links.md) (`YetiFragmentLinks`, injected by the root), [generated-ids](generated-ids.md) (`provideYetiAriaIds()`), [events](events.md) (`YetiSelectDetail`), and [setup](setup.md) (`injectYetiItemStyles`, `provideYetiStyles`, the accessibility stylesheet).

### Known issues

- Aria's development builds warn "ngTabPanel must have an ngTabContent structural directive to render." once per panel (`NC/src/aria/tabs/tab-panel.ts:108-110`; ticket 30, measured), because content is projected. Production builds log nothing. Tests that fail on console warnings allow this one message.
- With JavaScript off, before hydration, and inside `hydrate never`, one tab is drawn selected while every panel shows, where Yeti's page without `tabs.js` draws none selected (ticket 30, measured). This follows from A11Y-17, decision 206, and the user's choice "All panels show (Recommended)".
- The selected tab's `tabindex` is written `0`, `-1`, `0` within one batch at hydration (ticket 34, measured on the toolbar; inferred for tabs).
- The roving Tab stop does not follow a reveal or a parent's write after the reader has interacted with the list (section 7; ticket 50 decision 205).
