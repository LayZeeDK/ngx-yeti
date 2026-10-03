# 25. Decide: the building-blocks map for every ngx-yeti item

Type: grilling
Status: resolved
Blocked by: 06, 07, 09, 11, 13, 16, 17, 18, 19, 20, 22, 23
Labels: wayfinder:grilling
Map: ../map.md

## Question

For every item the spec list keeps, which primitive is each directive or component built on? The candidates are the native platform, `@angular/aria`, `@angular/cdk`, Angular Material as a pattern source, or custom Angular. Which of Yeti's JavaScript modules does each replace or keep? And what goes into the ledger of features the package adds that Yeti lacks? The old map's Building-blocks map and cross-cutting architecture decisions (ticket 14, `building-blocks-map`) and its `building-blocks.md` are the model for the shape of the answer, as evidence only.

## User instructions, 2026-10-01

The user's own messages to the orchestrator, verbatim:

> 36. Every accessibility/browser spec feature (including WHATWG, WAI-ARIA, WCAG, ARIA APG, and so on) added that isn't supported by Yeti itself must be documented in a ledger or something like that, for example to keep track of which accessibilty checks that is compliant because of ngx-yeti, not because of Yeti itself. The same goes for features added inspired by or for feature parity/overlap with Angular Aria/CDK/Material.
>
> 37. Make sure we utilize Angular Aria and CDK where possible to replace Yeti's JavaScript modules and comply with accessibility standards and best practices.
>
> 38. Make a building blocks audit for every component going into ngx-yeti like we did for Foundation for Sites v6.9 components going into ngx-foundation-sites.

## How to work it

AFK grilling, with `/domain-modeling`, against these inputs:

- the research and prototype tickets this one is blocked by;
- [Research: Yeti against WHATWG, WAI-ARIA, the APG, and Angular Aria, CDK, and Material patterns](17-research-yeti-accessibility-and-standards.md), for each deviation and the building block that fills it;
- [Research: Yeti's JavaScript modules and what Angular adds](03-research-yeti-javascript-and-angular.md);
- [Prototype: Yeti's modules in a single-page Angular app](20-prototype-yeti-in-single-page-apps.md), which found that the modules must be replaced, not loaded;
- the user's ruling that a component with `styleUrl` may replace a directive where lazy styles need it.

Write `building-blocks.md`. It has one row per item:

- the primitive;
- the Yeti module it replaces or keeps;
- the Aria or CDK building block, with its `file:line`;
- the reason for the implementation level;
- the cross-cutting rules.

Also write `ledger.md`. It has one row per feature the package adds that Yeti does not provide:

- the standard or source (WHATWG, WAI-ARIA, WCAG 2.2 criterion, APG pattern, or Angular Aria, CDK, or Material parity);
- the Yeti item;
- what Yeti does;
- what the package adds;
- how it is tested;
- the spec that owns it.

Every spec later adds its rows. Seed `ledger.md` with the accessibility issues found so far, which the user ruled go there rather than in [upstream-bugs.md](../upstream-bugs.md) (map, Standing rulings, item 44). They come from [Research: Yeti against WHATWG, WAI-ARIA, the APG, and Angular Aria, CDK, and Material patterns](17-research-yeti-accessibility-and-standards.md):

- the tooltip ignores Escape;
- dropdown and nav panels stay open on focus-out;
- the carousel pattern is incomplete;
- vertical tabs lack `aria-orientation`;
- the required `*` is in a field's name;
- the demo grip has no `aria-controls`;
- there are no `forced-colors` rules;
- the dialog's Tab order passes through the browser UI in Chromium and WebKit.

Each row records whether it was measured or read, and whether a minimal reproduction exists. Record ADRs for cross-cutting calls. Where Aria or CDK is available but not used, the row says why (map, Standing rulings, item 37).

This is the architecture ticket of the map, so it runs on `fable-high`, as the map's Models note allows for cross-cutting decisions.

Note, 2026-10-01 (audit 0002, L8): add these findings of ticket 17 to the ledger seeds as well: the `center` layout overflows by 2 px at 320 px (WCAG 1.4.10); five items need a manual contrast check; the accordion header is not a button inside a heading; the `buttons` group has no toolbar single Tab stop; and the spinner spins forever (WCAG 2.2.2, open).

## User answers, 2026-10-02

Recorded by the orchestrator in the map's Standing rulings. On the four Aria-fallback rows the user answered, verbatim: "For each item, prototype and analyze whether using Angular Aria would keep Yeti's styles and whether it would fully replace any Yeti JavaScript where applicable." Those rows waited for [Prototype: Angular Aria for the four items that keep a native pattern](29-prototype-aria-for-the-native-pattern-items.md); the user decided them on 2026-10-03 (see the note under `### Triage`). The user added a `setup` spec ("Add a `setup` spec (Recommended)") and kept A11Y-5 and A11Y-6 as ledger rows ("Ledger only").

## Answer

Resolved 2026-10-02 by Claude Fable 5.1, AFK grilling under the map's AFK override, with `/domain-modeling`'s terms from [CONTEXT.md](../CONTEXT.md), against Yeti at `f52d1e8b9` (read-only clone; the built `dist/` of ticket 02 at `D:/tmp/ngx-yeti-02/yeti/dist/`), Angular components at `708d4c6e2` (`22.2.x`), Angular at `5db6fc4453` (`22.2.0`), the APG at `3f094fd`, the resolved tickets this one is blocked by, ADRs 0003, 0010 to 0025, 0040, 0060, 0070, and 0080, and the old map's `building-blocks.md` and its ticket 14 as evidence of the shape only. No probe was needed: every claim below is read in source at the commit named, cited to the ticket that measured it, or marked inferred. The map, other tickets, other ADRs, `CONTEXT.md`, and `architecture-guide.md` are not edited here; what they need is listed under "For the orchestrator".

**Decision.** [building-blocks.md](../building-blocks.md) Part 2 has 53 rows, one per spec of [ticket 11](11-decide-spec-list.md): 49 items in manifest order and the four shared-utility specs. By primitive: native platform 46 (17 layouts, 3 recipes, 19 component items, 7 utilities), `@angular/aria` 1 (`tabs`), `@angular/cdk` 1 (`generated-ids`), custom Angular 5 (`field`, `demo`, `navigation-close`, `fragment-links`, `events`). 35 of the 49 items are types only. Every one of Yeti's ten modules is replaced and none kept ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md)); `demo` is the only Angular component. [ledger.md](../ledger.md) has its final eleven-column format and 29 rows (the thirteen findings of ticket 17, split where owners differ, plus six features the matrix introduces), every row with an owner. Three new ADRs record the cross-item calls: [ADR 0041](../adr/0041-closing-on-navigation-is-a-per-instance-subscription.md) (closing on navigation is a per-instance subscription; the Router is an optional peer; no registry service), [ADR 0042](../adr/0042-generated-ids-come-from-cdk-idgenerator-through-one-helper.md) (ids from CDK's `_IdGenerator` through one helper; the consumer's id wins), and [ADR 0043](../adr/0043-light-dismiss-additions-are-host-listeners-not-cdk-services.md) (focus-out, the tooltip's Escape, and focus return are host listeners; CDK's a11y services are not injected in the first milestone). Parts 3 and 4 of `building-blocks.md` are brought up to tickets 11, 13, 26, and 27, and the Part 1 sentences that named candidates now name the decision (listed below).

### What each deliverable holds

| Deliverable | Content | Checked how |
| --- | --- | --- |
| `building-blocks.md` Part 2 | Per row: Angular shape (directives, inputs by name, models, outputs, host bindings), primitive and level, the module replaced, the Aria or CDK building block with `file:line` or why one is not used, the reason for the level, the Part 1 rules at work, the ledger rows owned. Two cross-matrix findings: no item always sits on another item's element (so no item directive hosts another), and Tabs is the one Aria pattern hosted | every `file:line` printed from the clones on 2026-10-02 (`scratchpad/cites.sh`); the three `children` selectors naming another item's class found with `rg` over the manifests |
| `building-blocks.md` Part 3 | The old utilities' fates (unchanged), the four shared specs as decided (rows 50 to 53), and the shared pieces with no spec: the `@layer ngx-yeti` stylesheet, keyboard rules, the host-listener rule | read against ticket 11 and ADR 0060 |
| `building-blocks.md` Part 4 | The four Aria-fallback rows awaiting the user, ticket 27's result and what remains open (which floor option the test layers adopt), the accessibility-CSS ruling, and ticket 13's result (ruling 28 triggers nowhere) | read |
| `ledger.md` | Columns ID, Item, Gap or feature, Source, What Yeti does, What the package adds, Building block, Verified, Minimal reproduction, Tested by, Owner. Rows A11Y-1a to 1f (forced colours, one owner each), 2, 3a and 3b, 4 to 9, 10a to 10e, 11 to 13 (ticket 17's findings), 14 to 19 (field validity bindings, closing on navigation, fragment links, tabs' server-rendered state, tabs' Aria parity, the form's `ready` gate) | every "measured" cites ticket 17, 19, or 20; the ADR 0020 `ready` row is marked as measured in the old bundle only |
| ADRs 0041 to 0043 | As above | each cites its sources at the commit |
| This ticket | Answer, grilling record, checked and inferred, Triage, For the orchestrator | |

### Grilling record (both sides, AFK)

1. **What is a row: an item, a directive, or a spec?** A spec (53). The ticket says "one row per item", and the spec list makes the four shared specs rows a spec writer needs just as much; a per-directive table would repeat ticket 26's 168 rows.
2. **Does any Yeti item always sit on another item's element, so that one directive should host another through `hostDirectives` (1.9)?** No. The manifests' `children` selectors that name another item's class are `buttons > .button`, `affix > .button`, and `nav .dropdown` (checked with `rg`), all nested elements. The docs compose `center box` and `seam box` on one element as two directives written beside each other. So no item directive hosts another; only Aria's Tabs is hosted.
3. **Which Aria patterns are hosted?** Tabs only (Part 1 had decided it; row 40 fixes the composition). Accordion, Toolbar, Menu or Tree, and Tabs-for-the-picker each plausibly fit an item and would each replace an element or a role Yeti chose (`details`, `role="group"` with a Tab stop per button, a bar of links, fragment-link dots). The planning repository's `AGENTS.md` (ngx-foundation-sites-next) says to ask before falling back from Aria, and this run cannot ask, so each row says why and is `OPEN FOR HUMAN` below with a recommendation, even where an earlier ADR already records the choice (ADR 0019, ADR 0024).
4. **`FocusMonitor` or a `focusout` listener for focus-out closing?** The listener (ADR 0043). `monitor()` emits `null` when focus leaves the subtree (`focus-monitor.ts:178-181`, read) and nothing about where it went; a press on non-focusable panel content moves focus to `body`, which both approaches must tell apart from a departure with a `pointerdown` guard, so the service adds only document listeners. The dropdown and nav specs measure the inside-press case in three engines.
5. **Closing on navigation: a service with a registry, or each panel's own subscription?** Each panel's own (ADR 0041). The panel knows it is open from the `toggle` or `close` event it already observes; a registry would be shared state with no sharing. The Router is injected optionally, so the package works without `@angular/router`.
6. **Is CDK's underscore-prefixed `_IdGenerator` acceptable?** Yes, through one helper (ADR 0042). It is in `@angular/cdk/a11y`'s public export list (`public-api.ts:39`), Aria's own directives use it (`tab.ts:62`), and a swap is one file. `@angular/core` has no public id generator (searched `packages/core/src`).
7. **What does the carousel add for the APG, and with which pieces?** Previous and next part directives on consumer-written buttons, `role="group"` and `aria-roledescription="slide"` on each slide with the consumer's name (1.10 forbids package strings), and `aria-current="true"` on the dot of the slide in view from an `IntersectionObserver`. Not `FocusKeyManager`: the APG's grouped picker keeps every control in the Tab sequence (`carousel-pattern.html:110-111`, "a series of tab stops"; corrected 2026-10-03 after audit 0003 L2, the earlier `:182-183` is about `aria-disabled`), so Yeti's dots stay Tab stops. Not `LiveAnnouncer`: there is no auto-rotation, and the APG's live region is a static `aria-live` on the track (`:150`), the spec's call. Not `Directionality`: scroll geometry follows the track's computed direction (1.5).
8. **Does the dialog get a `FocusTrap`?** No, in the first milestone. The native modal never lets focus reach the page (ticket 17, measured), the Tab-into-browser-UI reading is inferred from a headless run, and a trap changes the native model for every consumer. The dialog spec may measure in headed browsers and reopen it (A11Y-8).
9. **Where does the tabs' `orientation` input live?** On `yetiTabList`, exposed from Aria's `TabList`, because Aria reads `aria-orientation` and the arrow-key axis from that input (`tab-list.ts:53`, `:80`) and a wrapper cannot write a hosted directive's input; the root mirrors it into `data-orientation` from the registered tab list. This deviates from ticket 26 row 153 (`orientation` on `yetiTabs`) and is listed for the orchestrator.
10. **How is the field's required-marker name leak closed?** One CSS rule in `@layer ngx-yeti` with alternative text (`content: " *" / ""`), Yeti's own technique from `breadcrumbs.css:22`, over `field.css:193-196`; the user's ruling of 2026-10-02 allows package CSS. It is also an upstream candidate, which needs the user's confirmation to file.
11. **Does `affix` generate the `aria-describedby` to a meaningful prefix?** No; it stays the consumer's, as the manifest asks. A package control directive on the input would collide with the field's control directive, which owns `aria-describedby` on the same input (1.4: two package directives on one element must not both own an attribute). The tooltip's trigger has the same hazard, recorded in row 42 for the spec.
12. **What is the ledger's final format?** Eleven columns (above). One owner per row, so findings with several items are split with letter suffixes (A11Y-1a to 1f, 3a and 3b, 10a to 10e); IDs are never reused; "Tested by" names a test layer, because a row the package closes must be a row the package tests.
13. **Does the spinner's indefinite animation fail WCAG 2.2.2?** No: a loading indicator is movement that is part of an essential activity, which the criterion excepts, and Yeti's reduced-motion rules stop it (ticket 17 section 2.5, measured). The spinner spec records the reading; the row stays as an accepted finding.
14. **Who owns the package's accessibility stylesheet and the consumer's setup?** Each rule belongs to the item spec whose ledger row it closes, and the first such spec creates the file (Part 3). The consumer-facing setup (the layer statement, the `assets` entry, `provideYetiStyles()`, `provideYetiFragmentLinks()`, the stylesheet's import line) has no owning spec among the 53; ticket 13 and ADR 0060 call it "the shared-setup spec", which ticket 11 never created. Listed for the orchestrator.
15. **Should `LiveAnnouncer` back the alert?** No. The alert's live role is a static attribute the consumer writes, and an announcement from code would double it. (Corrected 2026-10-03 after audit 0003 L2: the APG does not say the role should be present at load. `alert-pattern.html:24-25` says dynamically rendered alerts are announced and alerts present before page load completes are not; that the static role serves this item is inferred.)
16. **Does `InteractivityChecker` have a use?** No. The dialog's initial focus is the platform's focusing steps or the consumer's `autofocus`; Aria's `TabPanel` sets the panel's `tabindex` itself (`tab-panel.ts:48`), which replaces `tabs.js:22`'s selector list.
17. **Does `hover.js` survive as CDK or Aria?** No: Aria's `Menu` hover expansion and CDK's `CdkMenuTrigger` are `role="menu"` (ADR 0019). Hover intent is two non-replayed pointer listeners per instance with delays read from computed style (Y1, Y2).

### Checked and inferred

- **Checked (read in source at the commits named):** every `file:line` in Part 2, the ledger, and ADRs 0041 to 0043 (printed with `scratchpad/cites.sh` on 2026-10-02); the Aria entry-point listing (no dialog, tooltip, carousel, disclosure, or splitter); `_IdGenerator`'s export and signature; `FocusMonitor.monitor`'s contract; the APG's grouped-picker Tab rule and live-region rule; the APG's disclosure example's `onBlur`; Yeti's module lines cited; `field.css:193-196`; `tooltip.css:56-60`; `buttons.css` has no `role` selector; the three manifest `children` selectors that name another item's class; `nav/docs.md:16`'s close markup; `cdk/dialog/dialog-config.ts:148`'s `closeOnNavigation`; the counts (53 rows, 46/1/1/5, 35 types only, 29 ledger rows).
- **Measured, cited to the ticket that ran it:** ticket 17 (axe, keyboard, forced colours, reflow, reduced motion, the dropdown's focus-out, the tooltip's Escape, the field's name), ticket 18 (JavaScript off, hydration, `animate.leave`, Y1), ticket 19 (`validate.js` under Angular forms), ticket 20 (routes, fragments, shell panels), ticket 16 (events), ticket 13 (styles).
- **Inferred:** that `hidePopover()` restores focus to the invoker (the dropdown and nav specs measure it); the nav's focus-out behaviour (from the dropdown's); the dialog's Tab behaviour (ticket 17's own label); the `center` overflow's cause; that the `pointerdown` guard covers WebKit's click-without-focus sequence; that the spinner falls under 2.2.2's essential exception; that no Yeti item added at a later pin will sit on another's element (the finding is checked at this pin only).

### Triage

Rule: the map's AFK override. Only HIGH impact with NOT-HIGH confidence stays `OPEN FOR HUMAN`, plus the Aria-fallback rows the planning repository's `AGENTS.md` (ngx-foundation-sites-next) asks the user about, which the brief keeps open whatever their rating.

| Point | Impact | Confidence | Evidence | Outcome |
| --- | --- | --- | --- | --- |
| 46 rows stop at the native platform; types only for 35 | HIGH | HIGH | Yeti's own design (ticket 03 section 7, ticket 17 section 3); the map's Implementation order note | decided |
| Tabs hosts Aria Tabs with `hidden` beside `inert`; `orientation` on the tab list | HIGH | HIGH | Part 1 (ticket 09); `tab-list.ts:53`, `tab-panel.ts:49`, `:84` read; Angular input semantics | decided; the ticket 26 row 153 deviation goes to the orchestrator |
| `accordion` stays `details`, Aria Accordion not used (row 21, A11Y-11) | MEDIUM (additive later: Aria could be offered as an alternative item) | HIGH (`details` does the work with no script; ticket 18 measured; the APG accordion does not govern `details`) | row 21 | `OPEN FOR HUMAN` under the ask-first rule of the planning repository's `AGENTS.md`. Recommendation: keep `details`; hosting Aria Accordion would replace Yeti's element and its no-script behaviour |
| `buttons` keeps `role="group"`, Aria Toolbar written beside by the consumer (row 27, A11Y-12) | MEDIUM | HIGH (Yeti's CSS keys on the class, not the role, checked; a toolbar is a different APG pattern) | row 27 | `OPEN FOR HUMAN` under the same rule. Recommendation: keep the group as the default and document and test the `ngToolbar` composition as the opt-in for toggle sets |
| `nav` and `dropdown` stay disclosure navigation, Aria Menu or Tree not used (rows 32 and 34) | HIGH | HIGH (ADR 0019; the APG's own warning; Yeti refuses `role="menu"`) | rows 32, 34 | `OPEN FOR HUMAN` under the same rule, though ADR 0019 records it. Recommendation: keep ADR 0019 |
| The carousel's picker stays links, Aria Tabs not used (row 29) | MEDIUM | HIGH (ADR 0024; ticket 18 measured the dots working with JavaScript off) | row 29 | `OPEN FOR HUMAN` under the same rule, though ADR 0024 records it. Recommendation: keep ADR 0024 |
| No `FocusTrap` on the dialog in the first milestone (A11Y-8) | MEDIUM (additive later) | MEDIUM (the gap is inferred; the page is never reached, measured) | ADR 0043; ticket 17 | decided; the dialog spec may reopen with a headed measurement |
| Focus-out closing is a `focusout` listener with a `pointerdown` guard, not `FocusMonitor` (ADR 0043) | MEDIUM (internal mechanism, no public API) | MEDIUM (`FocusMonitor`'s contract read; the WebKit press sequence inferred) | ADR 0043 | decided; the specs measure in three engines |
| Closing on navigation is a per-instance subscription; `@angular/router` optional; no service (ADR 0041) | MEDIUM | HIGH (ticket 20 measured the need and a 15-line fix; no shared state exists) | ADR 0041 | decided |
| Ids from `_IdGenerator` through one helper (ADR 0042) | MEDIUM (an underscore API) | HIGH (public export; Aria depends on it; one swap site) | ADR 0042 | decided |
| Carousel: no `FocusKeyManager`, no `LiveAnnouncer`; prev and next on consumer buttons; `aria-current` on the dot | LOW | HIGH (APG read) | row 29 | decided |
| Field: required-marker fix as one CSS rule; `aria-invalid` and `aria-describedby` from forms state; `ready` gate | MEDIUM | HIGH (user's CSS ruling; ADR 0020; ticket 19 measured) | row 33 | decided |
| Forced-colours rules per item after Material's (A11Y-1a to 1f) | MEDIUM | HIGH (user's ruling; Material's rules read) | ledger | decided; each spec writes its rule |
| Spinner: 2.2.2 does not apply (A11Y-13) | LOW | MEDIUM | ledger | decided; the spec records the reading |
| `affix` and the tooltip trigger: `aria-describedby` ownership against the field's control directive | LOW | HIGH (1.4's one-owner rule) | rows 22, 42 | decided (affix: the consumer's); the tooltip spec states which wins |
| The ledger's eleven-column format with letter-suffixed splits | LOW | HIGH | ledger | decided |
| The consumer setup (layer statement, `assets` entry, providers, stylesheet import) has no owning spec | HIGH (it changes the Destination's count if a spec is added) | HIGH that it is unowned (ticket 11's list read against ADR 0060 point 11) | Part 3 | not this ticket's to decide: for the orchestrator |

Note, 2026-10-03 (orchestrator, after audit 0003 M3): the four Aria-fallback rows above are no longer `OPEN FOR HUMAN`. After tickets 29 to 34 the user decided each row ([map](../map.md), Standing rulings, "The Aria rows, one by one (2026-10-03)"):

- `buttons` (row 27): "Aria Toolbar by composition (Recommended)". `yetiButtons` hosts `ngToolbar`, and a part directive, `yetiButtonsItem`, written beside `yetiButton` on each button of the group, hosts `ngToolbarWidget` with the busy alias and the `tabindex` hand-over; `yetiButton` hosts nothing from Aria. Which directive hosts the widget is the orchestrator's change of mechanism after audit 0003 H1, not a user ruling: `ToolbarWidget` injects a required parent `Toolbar` (`src/aria/toolbar/toolbar-widget.ts:67` in `angular/components` at `708d4c6e2`), so a `yetiButton` outside a group could not host it. Inferred from source, not yet measured.
- `accordion` (row 21): "Heading in summary (Recommended)".
- The carousel's picker (row 29): "Custom: links + prev/next (Recommended)".
- `nav` and `dropdown` (rows 32 and 34): "Custom disclosure nav (Recommended)".

[building-blocks.md](../building-blocks.md) section "Aria decisions (2026-10-03)" records how each row changes. The consumer setup row above is settled too: the user chose "Add a `setup` spec (Recommended)" (map, Standing rulings, Ticket 25's open items).

### For the orchestrator

Files outside this ticket's edit scope that the Answer touches:

1. **The map:** a Decisions so far line for this ticket; the Destination's "53 specs" may become 54 if the setup spec below is created.
2. **Ticket 26, row 153:** `orientation` is the tab list directive's input, not the root's (Part 2 row 40 says why). The attribute `data-orientation` is still rendered on the root.
3. **Ticket 11, Shared-utility specs:** no spec owns the consumer-facing setup that ADR 0060 point 11 and ticket 13 assign to "the shared-setup spec" (the layer statement, the `assets` entry, `provideYetiStyles()`, the package's `@layer ngx-yeti` stylesheet file and its import, `provideYetiFragmentLinks()`, a generator). Recommendation: a fifth shared-utility spec, `setup`, which makes 54 specs; the alternative is to fold it into ADR 0060's consumer guide with no spec.
4. **ADR 0013, Consequences:** "whether the package keeps the old record's shared interface ... is not decided here" is now decided: no shared `Openable` interface; each opening item has its own opener or toggle part (Part 2 rows 31, 32, 34).
5. **ADR 0015 point 6** ("not settled here") and **ADR 0016's** "the building block for each is ticket 25's": settled by the user's ruling of 2026-10-02 and by ADR 0043; a dated note on each.
6. **ADR 0021 point 3's** Considered option ("whether the package adds a `FocusTrap` is ticket 25's ledger seed"): decided, no trap in the first milestone (A11Y-8).
7. **`architecture-guide.md`:** three stale phrases: the Kinds table's "a `NavigationStart` closer if ticket 25 makes it shared" (it is a function, ADR 0041), "The package writes no CSS of its own, pending ticket 07's open item" (the user ruled on 2026-10-02), and the Platform principles' "`FocusMonitor` closing a dropdown on focus-out" (a `focusout` host listener, ADR 0043); and the Kinds table's Component row "None decided" (`demo` is decided by ticket 11).
8. **Upstream candidates that need the user's confirmation before filing:** the field's required marker (A11Y-6) and the vertical tabs docs example's missing `aria-orientation` (A11Y-5), as ticket 17 section 7 already listed.
9. **A security note for the `demo` spec:** the iframe's `srcdoc` runs whatever the code holds (`demo.js:74`); the spec decides the frame's `sandbox` attribute.
10. **Part 1 edits made here**, each a sentence that named a candidate and now names the decision: the header paragraph (Parts 2 to 4 written); 1.2's CDK bullet and Aria bullet; 1.5's services bullet; 1.8's focus-out parenthesis; 1.10's deviations bullet (including the stale `OPEN FOR HUMAN` on package CSS, which Part 4 and 1.13 had already recorded as ruled) and its Focus bullet. No substance of ticket 09's decisions changed; the candidates it listed were resolved by this ticket as 1.2 foresaw.
