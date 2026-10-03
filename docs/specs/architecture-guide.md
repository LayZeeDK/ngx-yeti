# Architecture guide: directives and components for Yeti

Ticket: [Decide: which architecture principles and building-blocks rules carry over](issues/09-decide-inherited-principles-and-building-blocks.md). Written 2026-10-02 from the old `.scratch/next-foundation-specs/architecture-guide.md` (P1 to P26, evidence only, cited as `old P<n>`), tested against this map's Notes (Standing rulings; Inherited preferences and rulings), this bundle's ADRs 0001 to 0005 and 0040, and the resolved research and prototype tickets 01 to 04 and 16 to 24. Each principle keeps its origin: the old principle it carries, adapts, or replaces, and the record that decides it here. The ticket's Answer holds the verdict table.

Precedence: the map's Notes, the ADRs, and `building-blocks.md` outrank this guide (map, Inherited preferences and rulings, Precedence). Where a principle restates one of them it cites it and does not change its substance. Where a principle restates an old ADR, [Decide: which ADRs carry over](issues/08-decide-inherited-adrs.md) owns that ADR's record here; the principle names the old number and says so. Where this guide adds a rule no record covers, the principle says "New" in its Decided-by line and the ticket's Answer rates it under the map's triage rule.

Names follow the user's prefix ruling as [ADR 0080](adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) records it (map, Standing rulings, Prefix): `yeti` for selectors, `exportAs`, injection tokens, provider functions, and entry points (`<article yetiCard>`, `yetiCardToken`); `Yeti` for TypeScript names (`YetiCard`), and `NgxYeti` where a `Yeti` name equals a name Yeti's `yeti.d.ts` exports (today `NgxYetiColumns`, `NgxYetiAttention`, `NgxYetiEnter`, `NgxYetiLift`, `NgxYetiPrint`); Yeti's own vocabulary types for inputs (`YetiGap`); and `ngx-yeti` for the custom properties, cascade layers, data attributes, and generated ids the package writes. Words follow [CONTEXT.md](CONTEXT.md) ([Decide: the glossary](issues/10-decide-glossary.md)): Yeti's own words for Yeti's things, as its docs and manifest use them: an item (one of the 49 entries of the manifest: a layout, recipe, component, or utility), its identity class, its attributes and their vocabularies, its markers, its tokens, its module, its item file, and its events.

How to audit a spec against it: each principle has one rule. For each, an auditor answers "meets it" or "falls short, at <section>" from the spec's contract mapping, hierarchy and DI shape, API, ARIA and keyboard tables, rendered HTML, rendering modes, styles subsection, and Testing Decisions (building-blocks 1.14). The Preferred and Avoided examples use Yeti's documented markup (`src/components/<item>/example.html` at `f52d1e8b9`); a spec that matches an Avoided form falls short. A finding is recorded once, under the lowest-numbered principle it falls short of; other principles it touches are cited, not counted.

## Statement of intent

The package gives every Yeti item the spec list keeps its Angular form: attribute directives on the markup Yeti documents, which set the item's one class, its `data-*` attributes and markers from typed inputs, and the platform's own relationship attributes with generated ids, and which own the behaviour Yeti's optional modules had (ADR 0003; ADR 0040). State stays native and is read from the element and from ARIA, as Yeti designs it ("No component invents a state attribute", `src/guides/components.md:83`); where a directive owns a state it binds the attribute Yeti's CSS reads, and where hydration or a module would fight the markup the state is Angular's (ADR 0003 points 3 and 4). Every state visible at first paint is in the server HTML, so Yeti's CSS styles the first paint in every rendering mode and the platform opens dialogs, popovers, and `details` before any script runs (ticket 18, measured). Each behaviour is built on the first level that covers it inside Baseline 2025: native platform, then `@angular/aria`, then `@angular/cdk`, then custom Angular, and most items stop at the first (map, Implementation order; ADR 0002). Yeti's tokens are the consumer's stylesheet surface (ADR 0004). WCAG 2.2 AA and the matching APG pattern are requirements enforced by tests, and every gap the package closes that Yeti leaves is a row in `ledger.md` (map, Accessibility). Behaviour composes through `hostDirectives` and directives written beside each other; nothing is subclassed (map, Composition over subclassing).

## Kinds of building block

A directive can be of more than one kind at once. The kind decides which principles apply.

| Kind | What it is | Decided by | Examples |
| --- | --- | --- | --- |
| Item directive | One attribute directive per item on the element Yeti's docs put the class on: binds the class as a static host class, sets the item's `data-*` attributes from typed inputs, binds the ARIA state it owns from signals, and carries the behaviour the item's module had. | ADR 0003 points 1, 2, 3; ADR 0040; building-blocks 1.1 | `button[yetiButton]` (`.button`, `variant`, `emphasis`, `size`), `article[yetiCard]`, `dialog[yetiDialog]`, `nav[yetiNav]` (`threshold`, `panel`, `sticky`), `div[yetiTabs]`, `div[yetiField]` |
| Part directive | A directive on an element of an item's markup that Yeti marks with a marker (`data-brand`, `data-close`, `data-track`, `data-slide`, `data-dots`, `data-hint`, `data-error`) or names in the manifest's `children` (`> button[popovertarget]`, `> ul[popover]`, `[role="tab"]`), where the part carries an input, a generated id or reference, an output, or behaviour. It sets the marker, because the consumer writes no Yeti attribute (ADR 0003 point 2). A child Yeti styles only by element and position (`.nav > ul[popover] > li`) gets no directive. | ADR 0003 point 2; building-blocks 1.1, 1.3; [Decide: how the package maps each of Yeti's `data-*` attributes](issues/26-decide-yeti-data-attributes-mapping.md) for each marker | `button[yetiNavToggle]`, `ul[yetiNavList]`, `button[yetiTab]` (hosts Aria's `Tab`), `section[yetiTabPanel]`, `p[yetiFieldError]`, `a[yetiCarouselDot]` |
| Free behaviour directive | Binds no item class or `data-*` attribute, may sit on any element, and is written beside the item directive of its host, never hosted by it: the opener of a dialog (`commandfor` and `command` with the dialog's id), and the single-page-application pieces ticket 25 places (fragment links under `<base href>`). | ADR 0003 point 5; ADR 0040; building-blocks 1.8, 1.9 | `button[yetiButton] [yetiDialogOpener]="dialog"`, `a[yetiFragmentLink]` |
| Coordinating directive | A parent that provides a lightweight token its parts read, with which ordered parts register; may host an Aria pattern through `hostDirectives`. Coordination never makes it a component. | building-blocks 1.9; old P4 carried | `div[yetiTabs]` (`yetiTabsToken`, hosts Aria's `Tabs`), `nav[yetiNav]` (`yetiNavToken`, generated id shared by toggle and list), `div[yetiField]` (`yetiFieldToken`, composes `aria-describedby`), `div[yetiCarousel]`, `nav[yetiToc]` |
| Component | Only where a part needs structure the consumer should not hand-write, or where a `styleUrl` is what makes lazy styles meet the requirements under the user's standing ruling 28 (map, Standing rulings). No Yeti item generates structure; the second reason never applies, because [ADR 0060](adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) loads every item file as a counted link. On a consumer element it takes an attribute selector. | ADR 0003 point 6; map, Directives first; tickets 13 and 25 | Two: `figure[yetiDemo]` (`demo`) and `[yetiFieldError]` (`YetiFieldError`, the field's error slot, whose `ng-content` falls back to the rule's message) ([building-blocks.md](building-blocks.md) Part 2 rows 30 and 33; [ticket 50](issues/50-decide-open-points-of-the-specs.md) decisions 136 and 159) |
| Shared service, function, token, or type | A service only for state shared across instances; otherwise an injection-context function, a token, or a type in the primary entry point. | building-blocks 1.5, 1.9; ADR 0005; old P15, P22 | Yeti's 32 vocabulary types (`YetiGap`, `YetiWidth`, `YetiVariant`), re-exported, never redeclared (ADR 0080 point 5), `injectCloseOnNavigation`, the per-instance injection-context function that closes an open panel on `NavigationStart`, with no service ([ADR 0041](adr/0041-closing-on-navigation-is-a-per-instance-subscription.md)), `injectYetiId` with its per-application counter, and CDK's `_IdGenerator` as the token Aria injects ([ADR 0044](adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md)) |
| Item file | The styles side: one of Yeti's 49 item files, loaded with its directives and unloaded after the last instance, over the always-loaded group (map, Lazy styles; The always-loaded group). The package ships none of Yeti's CSS; its own CSS is the accessibility rules the user allowed on 2026-10-02 (map, Standing rulings). | ADR 0004; map, Lazy styles; [ADR 0060](adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) (mechanism) | `components/card/card.css`, `layouts/stack/stack.css`; the always-loaded `layers.css`, `tokens/*`, `base/*`, `layouts/attributes.css` |

The old kinds that have no Yeti counterpart: the Plugin element directive without a Structural class (Yeti's parts carry markers, so they are part directives), the layout-system and utility-family directive (Yeti's 17 layouts and 7 utilities are items like any other: one class and a few attributes, ticket 07), and the Library mixin (Yeti has no Sass; ticket 07 abandoned ADR 0012).

## Decision framework

Ask in this order; each question names the principle or record that decides it.

1. Is it Yeti's? An item of the manifest, one of its attributes, markers, tokens, events, or modules is in scope, one spec per item ([Decide: the spec list](issues/11-decide-spec-list.md)); the always-loaded group and the guide pages are not (map, The always-loaded group). Application behaviour is out (P15). A mechanism Yeti itself has replaced is out (map, Scope shape).
2. What does the platform already do with no script, and does Yeti's CSS or module rely on it? `details`, `popover`, invoker commands, `showModal()`, `form method="dialog"`, scroll snap, `:user-invalid`, container queries (ticket 03 section 7). That is level 1, and the directive keeps the attributes in the server HTML and observes the platform's events (P16, P12; ADR 0003 point 5).
3. Which module did the item have, and what did it add over the platform? The directive owns that behaviour (P15; ADR 0040).
4. Does Yeti give the element a class, a marker, or a `children` selector? The class gets the item directive; a marked or named part that carries an input, an id, an output, or behaviour gets a part directive; a position-styled child gets none (P2).
5. Is there structure the consumer should not write, or a `styleUrl` ticket 13 needs? Then a component, with an attribute selector on a consumer element; everything else is a directive (P1).
6. Do several elements cooperate? The parent is a directive providing a lightweight token; parts inject it (required when they cannot exist alone, optional when they can) and register; the platform's relationship attributes (`popovertarget`, `commandfor`, `aria-controls`, `for`, `details name`) carry generated or consumer ids (P4).
7. Does the directive always sit on another item's element? Then it hosts that item's directive through `hostDirectives`; two items a consumer composes on one element (`center box`) are written beside each other (P6, P8).
8. Who owns each state? The element and ARIA, as Yeti designs it; the directive binds only the ARIA state it computes; state a person or a module can change before hydration is Angular's (P11; ADR 0003 points 3 and 4).
9. What is the server HTML, what acts before hydration, what replays, what never replays (`yeti:*`, `dialog` `close`), and what is the hydration boundary? (P12)
10. Which name does each input take from Yeti's attribute, which type from its vocabulary, which output from its event, and for a name that is also an HTML attribute, what does the directive render for the static form? (P13, P14, P9; ADR 0005)
11. Which entry point owns it, and what crosses entry points? (P22)
12. Which criteria, pattern, and checks does it need for WCAG 2.2 AA, which Yeti deviation does it close, and which ledger rows does it add? (P17, P26)
13. Which item file does it load, which tokens does it read, and which of them does it write? (P18; ADR 0004; ticket 13)

## Principles

Each principle: Rule, Why, Preferred, Avoided, Origin (the old principle and the verdict), Decided by, Sources. `Y/` is `github.com/foundation/yeti/` at `f52d1e8b9`, `NG/` is `github.com/angular/angular/adev/src/content/`, `NGP/` is `github.com/angular/angular/packages/`, `NC/` is `github.com/angular/components/`, both clones at 22.2.x; tickets are this bundle's unless written `old ticket`. "Checked" means read in the source named or measured by the ticket named; "inferred" is marked where it applies.

### Shape

#### P1. Directive on the consumer's element; a component only for structure the consumer should not write, or for a `styleUrl` lazy styles need

Rule: Every item becomes attribute directives on the elements Yeti's docs put its class and markers on. A component is allowed only where a part needs structure the consumer should not hand-write, or where a `styleUrl` is what makes lazy styles meet the requirements, and ticket 13 is the record that grants the second; on a consumer element it takes an attribute selector.

Why: all 49 items are one class plus `data-*` attributes on markup the consumer writes, with an empty `classes` array, and none generates structure (ticket 02; `Y/src/components/card/manifest.json`); Angular's criterion for a component is a template, and Aria ships no component; an element component inside a `ul` or a `dialog` is non-conforming HTML. The second reason is the user's standing ruling 28, conditional in the user's own words ("where applicable").

Preferred: `<dialog yetiDialog>`, `<nav yetiNav threshold="sm" panel="drawer">`, `<div yetiTabs>`, `<article yetiCard raised>`.
Avoided: `<yeti-dialog>`, `<yeti-nav>`, `<yeti-card>`; a component for a state Yeti does not have.

Origin: old P1, adapted (second component reason added; the old three cases have no Yeti counterpart).
Decided by: ADR 0003 point 6; map, Directives first; ticket 13.
Sources: `Y/src/components/*/manifest.json` (`"classes": []`, read for the 22 components; inferred for layouts and utilities from the same shape, ticket 07 question 2); `NG/guide/directives/overview.md`; `NC/src/aria/accordion/accordion-group.ts:61-69`; ticket 04 (a library `styleUrl` with `ViewEncapsulation.None` measured working over Yeti's CSS).

#### P2. One directive per item class; one per part that carries something; none for a position-styled child

Rule: Every item has one attribute directive that binds its class as a static host class even when that is all it does, sets the item's `data-*` attributes from typed inputs, binds the ARIA state it owns, and carries the behaviour the item's module had; the styling and the behaviour of one item are never split into two directives (an item written beside another, P6, is not a split). A part of the item's markup that Yeti marks (`data-close`, `data-track`, `data-error`) or names in the manifest's `children` gets a part directive where it carries an input, a generated id or reference, an output, or behaviour, and that directive sets the marker; a child Yeti styles only by element and position gets no directive.

Why: two attributes for one element leave the element unstyled when one is forgotten (old ADR 0041's finding, carried as reasoning); a marker is a Yeti attribute, and the consumer writes none (ADR 0003 point 2); a bare `li` under `.nav > ul[popover]` has nothing to set and nothing to own.

Preferred: `button[yetiTab]` sets nothing of Yeti's but hosts Aria's `Tab` and carries `aria-controls`; `li[yetiNavClose]` sets `data-close` and holds the hide button; `p[yetiFieldHint]` sets `data-hint` and gives the field its `aria-describedby` id; `article[yetiCard]` binds `.card` and nothing else; a bare `<li>` in a nav list.
Avoided: `<div yetiTabs yetiTabsKeyboard>`; `<li yetiNavItem>` for a position-styled `li`; `<p data-hint>` written by the consumer; a second directive for an item's own module behaviour.

Origin: old P2, adapted (Structural class becomes the item class; the Plugin-element case becomes the marked part; no Variant or State classes to split over).
Decided by: ADR 0003 points 1 and 2; ADR 0040; building-blocks 1.1, 1.3; ticket 26 (per marker).
Sources: `Y/src/components/nav/manifest.json` (`children`: `> [data-brand]`, `> button[popovertarget]`, `> ul[popover]`, `li`, `[data-close]`, `.dropdown`); `Y/src/components/field/example.html:2-7` (`data-hint`, `data-error`, `aria-describedby`); ticket 02 (31 markers, 54 attribute names).

#### P3. The consumer writes no Yeti class or attribute; a typed input takes Yeti's value

Rule: Consumer markup keeps the element structure of Yeti's docs and carries directive attributes where the docs carry the class, the `data-*` attributes, the markers, and the platform's relationship attributes (`popovertarget`, `commandfor`, `command`, `popover`, generated ids); no Yeti class or `data-*` attribute appears in consumer code. An input takes the vocabulary value itself (`variant="alert"`, `gap="lg"`), typed as a closed union, and a class name is never a value. Inputs that apply the consumer's own classes stay the consumer's. Attributes Yeti's docs ask the author to write and the package neither generates nor owns (`aria-label` on a `nav`, `role="list"`, `required`) are stated per spec as the consumer's, with the reason (ADR 0003 consequences; ticket 26).

Why: the user's class rule, whose reasoning covers an attribute whose value list the package can type (ADR 0003); a misspelt `data-variant="prmary"` is silent in Yeti and a compile error here (ADR 0005); host bindings render on the server, so the server HTML still carries Yeti's documented markup.

Preferred: `<button yetiButton variant="alert" emphasis="medium">`; `<div yetiStack gap="lg">`; `<nav yetiNav aria-label="Site">` with the consumer's `aria-label`.
Avoided: `<button class="button" data-variant="alert">`; `<div class="stack" data-gap="lg">`; `<button yetiButton class="button">`; `popovertarget="menu"` written by hand beside a nav directive that generates the id.

Origin: old P3, adapted (classes become class plus attributes and markers; "not even as a value" becomes "a vocabulary value is the value"; the later-milestone note is ticket 11's shape).
Decided by: ADR 0003; ADR 0005; map, The contract the package manages; ticket 26.
Sources: ADR 0003 considered options; `Y/src/guides/stability.md:15-18` (names and value lists frozen); ticket 07 question 2.

#### P4. Coordination is a parent directive with a lightweight token; the platform's relationship attributes carry the ids; DI follows the declaration site

Rule: A parent provides an `InjectionToken` typed with `import type` of its class through `useExisting`; a part injects it, required when it cannot exist alone and optional when it can, with its documented usage stating where it belongs; ordered parts register with the parent in `ngOnInit` and unregister on destroy, an unordered part may register at construction, and a part linked by a reference input registers from an `effect` with cleanup; order comes from registration, not `contentChildren`. Where the platform relates two elements by id (`popovertarget`, `commandfor`, `aria-controls`, `aria-labelledby`, `aria-describedby`, `label for`), the directive whose host renders the `id` generates it by calling `injectYetiId`, the directive at the other end reads the value and binds it, and the consumer's own id wins (ADR 0044; [ticket 50](issues/50-decide-open-points-of-the-specs.md), 2026-10-03); where no parent exists (a dialog and its opener anywhere on the page), the link is a template reference on the opener. Where projection can hide a provider, a directive walks the DOM once after hydration, only when the token is absent.

Why: Angular resolves projected content against the injector where it is declared; registration survives `@for`, `@defer`, and projection; a token instead of a class keeps the parent's class out of every part's bundle (P22); Yeti's own modules resolve by the declared relationship, never by "any popover" (`hover.js:26-27`, `tabs.js`), and so does the package.

Preferred: `nav[yetiNav]` provides `yetiNavToken`, `ul[yetiNavList]` calls `injectYetiId` for the `id` its host renders, and `button[yetiNavToggle]` reads that value and binds it as `popovertarget`; `div[yetiField]` composes `aria-describedby` from its hint's and error's generated ids; `[yetiDialogOpener]="confirm"` with `#confirm="yetiDialog"`; `button[yetiTab]` paired with its panel by Aria's value pairing.
Avoided: `<yeti-nav>` as the coordinator; `contentChildren(YetiTab)` for order; a DOM walk that also runs when the token is present; a popover found by `querySelector('[popover]')`.

Origin: old P4, carried over (examples change; the ids clause is Yeti's relationship attributes). Old ADRs 0009, 0013, and 0043 are ticket 08's; the rule here does not depend on them.
Decided by: building-blocks 1.9; ADR 0003 point 5.
Sources: `NG/guide/components/content-projection.md`; `NG/guide/di/lightweight-injection-tokens.md`; `Y/src/components/dropdown/hover.js:24-30`; `Y/src/components/dialog/example.html:1-3`; `NC/src/cdk/a11y/id-generator.ts:22`.

#### P5. Native element first; selectors name the element Yeti's manifest expects

Rule: The directive's selector names the native element wherever Yeti's manifest, CSS, or the ARIA depends on it: `dialog[yetiDialog]` (Yeti's own `dialog.dialog`), `nav[yetiNav]`, `button[yetiNavToggle]`, `ul[yetiNavList]`, `details` inside an accordion, `input[type=range]` in a field, `a[href]` for links. Because a hosted directive's selector is ignored, the host's own selector carries the restriction. The platform element is the one Yeti documents; the package never swaps it for another to fit an Aria pattern.

Why: Yeti's validator refuses markup that does not match the manifest's `children`, and its CSS is written against the element (`.nav > button[popovertarget]`, `dialog.dialog`); the APG and the platform behaviour (top layer, `::backdrop`, Escape, `details name`) come from the element; replacing a working native element with an Aria pattern would change Yeti's semantics (map, Implementation order).

Preferred: `dialog[yetiDialog]`, `details` with a consumer `name` inside `div[yetiAccordion]`, `button[type=button][yetiTab]`, `input[type=checkbox][role=switch]` as Yeti writes a switch.
Avoided: `<yeti-dialog>`; an accordion rebuilt on buttons and `region`s to host Aria's Accordion; a `div` toggle for the nav.

Origin: old P5, carried over (strengthened by Yeti's validator).
Decided by: building-blocks 1.2, 1.10; map, Implementation order; ADR 0003.
Sources: `Y/src/components/dialog/dialog.js:30-31` (`dialog.dialog`); `Y/src/components/nav/nav.css:38-39`; `Y/src/components/accordion/docs.md:7`, `:19`; `Y/src/components/field/example.html:9`; `NG/guide/directives/directive-composition-api.md` (hosted selectors ignored).

#### P6. Host a directive whose element is always another item's element; write every other combination beside

Rule: A directive whose element is always another item's element hosts that item's directive through `hostDirectives` and exposes its inputs under their own names, so the class and its attributes have one owner. Two items a consumer may compose on one element (`center box`, `seam box`) are written beside each other, and the spec of each says so. An opener is never hosted by the panel it opens, and no panel writes an attribute on its opener other than through the opener's own directive.

Why: hosting gives one owner without two attributes; hosting a free combination would put one item's class on elements that are not that item; the dialog opener beside `yetiButton` stacks with any button look and keeps the dialog's bundle free of button code; Yeti relates a trigger and its panel by `popovertarget` or `commandfor`, which the opener's directive renders (ADR 0003 point 5).

Preferred: `<div yetiCenter yetiBox>` where Yeti's docs compose them; `<button yetiButton [yetiDialogOpener]="confirm">`; a `.dropdown` inside a nav as a nested element with its own directive, read by the nav through the dropdown's optional injection of `yetiNavToken`.
Avoided: `yetiCenter` hosting `YetiBox`; an opener hosted by `yetiDialog`; a dropdown directive that writes `data-side` on the nav.

Origin: old P6, carried over (the Trigger clause becomes the opener clause; ticket 25 found that no Yeti item sits on another item's element: the 49 manifests declare composition by `children`, not by shared element).
Decided by: building-blocks 1.9; ADR 0003 point 5; ticket 25.
Sources: ticket 07 question 2 (`center box`, `seam box` in the examples); `Y/src/components/nav/manifest.json` (`.dropdown` as a child); `NG/guide/directives/directive-composition-api.md`.

#### P7. Composition over inheritance

Rule: The package reuses and extends behaviour only through `hostDirectives` and directives written beside each other on one element. No spec asks a consumer to subclass a package directive or to wrap one to retype an input; a consumer component may host a package directive through `hostDirectives`.

Why: the user's rule; a subclass inherits host bindings, inputs, outputs, and hooks but not `providers`, its selector, or `exportAs`, so a consumer subclass of a token-providing directive leaves its parts silently without a parent.

Preferred: `<button yetiButton [yetiDialogOpener]="confirm">`; a consumer card component hosting `YetiCard`.
Avoided: `class MyButton extends YetiButton`; an exported abstract base for consumers to type an input.

Origin: old P7, carried over (the `NfsOpenable` consumer-implemented contract is gone with Triggers, P8 of the building blocks).
Decided by: map, Composition over subclassing (the user's rule, 2026-09-27).
Sources: `NC/CODING_STANDARDS.md` (prefer composition); `NG/guide/components/inheritance.md`.

#### P8. `hostDirectives` within its fixed limits

Rule: Host directives are applied statically, their selectors are ignored, their inputs and outputs are hidden unless listed, a wrapper cannot change a hosted input's default or set a hosted `input.required` from code, one hosted input under two aliases is a compile error, and a host binding over a hosted directive's attribute holds only when the hosted value never changes after the host's last write, or equals the host's whenever it changes, or changes in every pass in which the hosted value does, which a binding computed from the same hosted signal guarantees. A mode that must swap patterns at runtime needs a component template, not conditional hosting.

Why: Angular's documented constraints and the old bundle's measurements with 22.2.0; since 22.0 a directive reached several times through host directives is created once with the input maps merged, and a template match wins over host-directive matches. Two Aria patterns are hosted by composition: Tabs, which fits Yeti without changing its elements (ticket 03 hypothesis, ticket 17 reading), and, since the user chose "Aria Toolbar by composition (Recommended)" on 2026-10-03 (map, Standing rulings), Toolbar for `buttons` (`yetiButtons` hosts `ngToolbar`; a part directive on each button of the group, `yetiButtonsItem`, hosts `ngToolbarWidget`, while `yetiButton` hosts nothing from Aria, because `ToolbarWidget` requires a parent `Toolbar`; which directive hosts the widget is the orchestrator's change of mechanism after audit 0003 H1, inferred from source, not measured). Aria's `TabPanel` binds `inert` while Yeti's CSS and `tabs.js` key on `hidden`, so the wrapper binds `hidden` from the same `visible()` signal Aria binds `inert` from, and only once Aria is live: with JavaScript off and before hydration every panel shows, as Yeti's own no-script state does (the user's choice of 2026-10-03, "All panels show (Recommended)"; ticket 30 measured the form below).

Preferred: `section[yetiTabPanel]` hosting Aria's `TabPanel` with `'[attr.hidden]': 'off() ? "" : null'`, where `off = computed(() => tabs.ariaLive() && !panel.visible())` is derived from Aria's own signals, so the server HTML hides no panel ([ticket 30](issues/30-prototype-fitting-aria-by-directive-composition.md), `prototypes/aria-composition-roving/src/roving.ts:101-114`); `button[yetiTab]` hosting `Tab`.
Avoided: a `hostDirectives` entry behind a condition; a plain `[attr.hidden]` override that can disagree with Aria's `inert`; the same Aria input exposed under two names.

Origin: old P8, carried over (examples change to Tabs; the server-visible panels and the Toolbar hosting are from the 2026-10-03 rulings).
Decided by: building-blocks 1.9 (Aria composition); map, Implementation order.
Sources: `NG/guide/directives/directive-composition-api.md`; `github.com/angular/angular/CHANGELOG.md:937` (22.0.0, "de-duplicate host directives", checked); `NC/src/aria/tabs/tab-panel.ts:49`, `:84` (`[attr.inert]` from `visible()`, checked); ticket 03 section 4.3; ticket 17 (Aria `ngTabList` for `aria-orientation`).

#### P9. Input names on one element never collide; a shared vocabulary is one shared type; a name that is also an HTML attribute states what its static form renders

Rule: Two package directives that can share an element do not declare one input name with different types. Where two items read the same vocabulary (`data-gap` on 21 items, `data-align` on 8, `data-threshold` on `nav` and `columns`), their inputs share the vocabulary's exported type, so two items composed on one element agree. An input named like an HTML attribute keeps its name, and its directive owns what the static attribute renders, by the kind its spec states: `output` (bound from the input, the attribute is what the input means), `removed` (bound to `null` where the browser would apply it as a presentational hint), `insertion` (bound to `null` where the browser acts on it at insertion, `autofocus`, with the usage rule that it is never written statically on a host that can take focus), or `inert` (left alone where it does nothing on the allowed hosts). Yeti's `data-width`, `data-height`, `data-align`, `data-size`, and `data-span` make this a live case for `width`, `height`, `align`, `size`, and `span`.

Why: Angular sets a template binding on every directive on the element that declares the input, so a shared name with different types fails to compile; a static input attribute stays on the element and HTML lowercases it, so `align` on any element maps to `text-align` in Blink and WebKit, and the browser acts on `autofocus` when the element is inserted, before any host binding runs (measured by old ticket 139 in three engines; carried as evidence by ticket 07).

Preferred: `<div yetiStack gap="lg">` and `<div yetiCluster gap="lg">` sharing `YetiGap`; `<table yetiTable align="end">` with `YetiTable` binding `'[attr.align]': 'null'` and `data-align` from the input; a `width` input whose spec row says `removed` on `img` and `inert` on `div`.
Avoided: two directives on one element declaring `size` as different unions; a static `align` left in the DOM; a static `autoFocus` on a dialog.

Origin: old P9, adapted (the `nfs`-prefixed Utility attribute shape is abandoned with old ADR 0044, ticket 07; the shared-vocabulary clause is new for Yeti; the presentational-attribute kinds carry from old ticket 139).
Decided by: ADR 0005 consequences; map, Input naming; ticket 26 (the kind per attribute).
Sources: ticket 02 (vocabulary sharing counts); `old research/presentational-attribute-inputs.md` (the measurements, evidence only); `NC/src/material/form-field/directives/hint.ts:19-25` (`align` bound to `null`).

### State and API

#### P10. Signals-first public API, with transforms, and `effect()` kept out of it

Rule: Public API is `input()` (with `booleanAttribute` on boolean attributes and markers and `numberAttribute` on counts, closed unions on enum attributes), `model()` for state Yeti exposes as both an attribute and an event (a tab's selection, a dialog's open state, a toc's current link; a carousel's index is a read-only `current` signal, not a model, by [ticket 50](issues/50-decide-open-points-of-the-specs.md) decision 121), `output()` for each `yeti:*` event the item would have dispatched, a read-only `Signal` or `computed()` for derived state a consumer needs, and `linkedSignal()` for derived-but-writable state, all `readonly`; no `@Input`, `@Output`, `EventEmitter`, `@HostBinding`, or `@HostListener`. `effect()` is never public API, never writes the DOM, `history`, or a timer, and never copies one signal into another; its two uses are the reverse-link registration of a reference input with cleanup (an opener registering with its dialog), and nothing else until a spec states a third with its reason.

Why: Angular recommends the signal functions and calls `effect()` the last API to reach for; effects run on the server; a plain field written from a `yeti:slide` listener does not refresh the view zoneless while a signal does (ticket 18, measured); `model()` takes no transform, so a boolean model has no bare-attribute form; Yeti's boolean attributes (`data-raised`, `data-sticky`, `data-once`) are presence attributes that `booleanAttribute` turns into `<article yetiCard raised>`.

Preferred: `readonly raised = input(false, {transform: booleanAttribute})`; `readonly selected = model<string | null>(null)` on the tabs root; `readonly slide = output<{index: number; slide: HTMLElement}>()` for `yeti:slide`; `readonly fill = computed(() => ...)` behind `'[style.--yeti-range-value]'`.
Avoided: `@Input() variant`; `readonly open = input(false)` on a boolean attribute without the transform; an `effect()` that calls `showModal()`; an `effect()` that mirrors `selected` into `aria-selected` (a host binding does it).

Origin: old P10, carried over (the `nfsVariantBoolean` transform is gone with Variant classes; the rendered-state exception is gone with the breakpoint swaps, P11 and building-blocks 1.5).
Decided by: map, State and reactivity; map, The contract the package manages (events as outputs); ADR 0005.
Sources: `NG/guide/signals/effect.md`; `NG/guide/components/inputs.md`; `NGP/core/src/authoring/model/model_signal.ts`; ticket 18 (zoneless measurement); ticket 16 (outputs measured working zoneless and under SSR).

#### P11. One source per state: the element's and ARIA's, as Yeti designs it; state that changes before hydration is Angular's

Rule: Each state has one writer and one representation, and it is the platform's: `:hover`, `:focus-visible`, `:disabled`, `:checked`, `:user-invalid`, `[open]`, `:popover-open`, and ARIA (`aria-pressed`, `aria-busy`, `aria-current`, `aria-invalid`, `aria-selected`, `hidden`). The package binds no state class, because Yeti has none, and adds no state attribute of its own. Where the state is the consumer's (`required`, `disabled`, `role="status"`, a `details` a page ships open), the consumer sets it and the directive leaves it alone. Where the directive owns a state, it binds the ARIA attribute Yeti's CSS reads from a signal, and the look and the announcement come from that one attribute. An attribute a person or a Yeti module can change before hydration is Angular-owned state bound from an input or model, never a static template attribute, because hydration writes every static attribute again. Initial state is bound, never read from a static attribute, with one exception: `open`. No directive binds `open` on a `details` or a `dialog`, as a property or an attribute; the directive reads the element's open state once, when it is created, then follows the native `toggle` and `close` events, and a dialog opens only through `command` or `showModal()` (the user's choice of 2026-10-03, "Never bind; read once (Recommended)", map, Standing rulings; [ADR 0021](adr/0021-dialog-is-a-directive-on-the-native-dialog.md) 2026-10-03 note). A `details` the page ships open is the consumer's static attribute; ticket 33 found, from ticket 18's measurement, that it undoes a toggle the user made before hydration, and the `accordion` spec documents that residue.

Why: "No component invents a state attribute" (`Y/src/guides/components.md:83`), with seven states from the element or ARIA; a second source drifts; `:open`, `:popover-open`, and `:has()` are inside Baseline 2025 (ADR 0002), so they can be a source, which they could not be under the old target; measured: a static `open` reopens a `details` the user closed, a static `aria-selected="true"` leaves two tabs selected after `tabs.js` moved the selection, and a restored `data-once` stops the arrival from ever playing (ticket 18, three engines).

Preferred: `[attr.aria-selected]` from the tabs model on each tab; a dialog's `isOpen` model that is never bound to `open` ([ADR 0021](adr/0021-dialog-is-a-directive-on-the-native-dialog.md); ticket 34 measured that a bound `open`, as a property or an attribute, undoes a toggle made before hydration, and leaves a modal dialog opened before hydration hidden while the page stays blocked); `aria-pressed` bound by a toggle button's directive from its model; `aria-current` left to the consumer or to `RouterLinkActive` with `ariaCurrentWhenActive="page"` on a nav link, and bound by the toc directive from its `IntersectionObserver` state.
Avoided: a `data-ngx-yeti-open` attribute beside `[open]`; a directive reading a static `aria-selected` to seed its model; a static `open` on a `details` inside `@if`; a `Renderer2` write of a state class.

Origin: old P11, adapted (platform state is the only source; the two old exceptions, a `Renderer2` State class on `html` or `body` and the `data-nfs-<state>` hook, have no Yeti counterpart and are abandoned; the hydration clause is new from ticket 18).
Decided by: ADR 0003 points 3 and 4; map, The contract the package manages; ADR 0002; map, Standing rulings (Open state, 2026-10-03).
Sources: `Y/src/guides/components.md:81-95` (checked); ticket 18 Answer (static attributes, measured); `Y/src/components/dropdown/dropdown.css:13` (`:popover-open` as Yeti's own state hook); `Y/src/components/nav/docs.md` (Accessibility: `aria-current="page"` is the author's).

#### P12. Rendering modes are a design input for every directive

Rule: Every state visible at first paint is a host binding on signal state, so the server HTML is Yeti's documented markup; the platform's opening attributes (`popovertarget`, `popover`, `commandfor`, `command`) and ids are in the server HTML with no script, and the directive observes `command`, `toggle`, and `close` rather than owning activation with a `click` handler. No node creation, `Renderer2` write, `window`, measurement, observer, timer, focus, `history`, or `location` before `afterNextRender` or `afterRenderEffect`, which are the package's only platform check (`isPlatformBrowser` and `ngServerMode` are not used); a handler that does act on a replayed native event changes state first and calls `preventDefault()` last. Each spec states what never replays: `yeti:*` events (replaced by outputs, which also do not replay), a `dialog`'s `close`, `pointerenter`, and anything added in code; what the directive sets up for content client-rendered inside `@defer`, since no module ever ran there; that `i18n` blocks need `withI18nSupport()`; and that a `hydrate never` block keeps the platform behaviour and loses a `styleUrl`'s styles when the last live instance leaves (`upstream-bugs.md` A2). A composite widget and an opener with its panel share one hydration boundary. Package templates contain no `@defer`; `ngSkipHydration` and Shadow DOM are never used.

Why: measured in eight production SSR builds in three engines: with JavaScript off the dialog opens by invoker commands, the dropdown by `popover`, and the accordion by `details`, while a click handler waits for replay; `provideClientHydration()` alone turns on incremental hydration and event replay; without `withI18nSupport()` an `i18n` component is serialised `ngSkipHydration` and re-rendered destructively; all seven client `@defer` triggers insert content `tabs.js` never initialised (ticket 18). Hydration matches nodes by type and tag, `ngSkipHydration` works only on component hosts, and replay reaches only template and `host` listeners on a fixed list of native events (`NG/guide/hydration.md`; ticket 16).

Preferred: `'[attr.commandfor]': 'dialogId()'` and `'[attr.command]': '"show-modal"'` on the opener; `(command)`, `(toggle)`, and `(close)` host listeners; `afterNextRender` to create the toc's `IntersectionObserver`, and an `afterEveryRender` callback that resolves its missing or disconnected headings again, because a heading rendered later by `@defer` or `@if` changes no signal an `afterRenderEffect` would read ([ticket 50](issues/50-decide-open-points-of-the-specs.md) decision 210); a tabs directive that sets its selection from the model in the server HTML.
Avoided: a `(click)` handler that calls `showModal()` as the only way to open; a `(document:yeti:select)` listener as the package's event path; an `@if (isBrowser)` template branch; `ngSkipHydration` on a component; `ViewEncapsulation.ShadowDom`.

Origin: old P12, adapted (the "primary activation is a `click` or `keydown` listener" clause is replaced by the platform's opening attributes; the never-replays list, `withI18nSupport()`, client-rendered `@defer` content, and the `hydrate never` styles gap are new from tickets 16 and 18). Old ADR 0008's record is ticket 08's.
Decided by: ADR 0003 points 4 and 5; map, Rendering modes; ADR 0040.
Sources: ticket 18 Answer (checked); ticket 16 Answer (no replay for any option); `NGP/platform-browser/src/hydration.ts:159` (`withNoIncrementalHydration`, checked); `NG/guide/hydration.md`; `Y/src/components/dialog/dialog.js:1-9` (what the platform does and what the module adds, checked).

#### P13. Every public name by a stated rule

Rule: Classes are `Yeti` plus the PascalCase of the item's manifest name (`YetiCard`, `YetiNav`, `YetiButtons` for the `buttons` group), and `NgxYeti` plus it where that name equals one Yeti's `yeti.d.ts` exports (`NgxYetiColumns`, `NgxYetiAttention`, `NgxYetiEnter`, `NgxYetiLift`, `NgxYetiPrint`); a part directive is the item plus the part's marker or role in PascalCase (`YetiNavToggle`, `YetiNavList`, `YetiNavClose`, `YetiFieldError`, `YetiCarouselDot`, `YetiTab`, `YetiTabPanel`); directive selectors are `yeti`-prefixed camelCase attributes, components `yeti-`-prefixed dash-case elements; tokens are camelCase with the `Token` suffix (`yetiNavToken`); inputs take Yeti's attribute and marker names in camelCase (`data-variant` to `variant`, `data-threshold` to `threshold`) and their types are Yeti's own vocabulary types (`YetiVariant`, `YetiWidth`), never redeclared; each `yeti:*` event becomes an output named by its verb without the prefix (`yeti:select` to `select` or `selected`, `yeti:slide` to `slide`, `yeti:current` to `current`, `yeti:open` and `yeti:close` to `opened` and `closed`), one form per spec, with Material's vocabulary for methods (`open()`, `close()`, `toggle()`, `select()`) and `xChange` from models, never an `on` prefix; `exportAs` is the directive's camelCase name, and every directive and component has one. Names the package writes into the page at run time (custom properties, cascade layers, data attributes, generated ids) take `ngx-yeti`.

Why: bare class names collide with Aria's `Tabs`, `Tab`, and `TabPanel`, which the package hosts; Yeti's 49 names, 54 attribute names, 31 markers, and 6 event names are frozen (`stability.md`), so names derived from them are stable; Aria names its own `exportAs` after the directive (`ngTab`, `ngTabPanel`); the user ruled an `exportAs` on every directive (2026-09-29).

Preferred: `YetiDialog` with `exportAs: 'yetiDialog'`, `readonly closed = output<void>()`; `YetiTabs` with `readonly select = output<{tab: HTMLElement; panel: HTMLElement | null}>()`; `yetiFieldToken`; `threshold: YetiWidth`.
Avoided: `Tabs` (Aria's name); `YETI_NAV` as a token; `onSelect`; `yetiSelect` as an output name; `exportAs: 'tabs'`; a directive without `exportAs`.

Origin: old P13, adapted (the Structural-class and Variant naming orders are replaced by Yeti's names; outputs come from events rather than from a Foundation event map; the `exportAs` clause carries as the user's ruling).
Decided by: map, Input naming; map, The contract the package manages; ADR 0005; ADR 0080 (the prefix, the user's ruling).
Sources: `Y/src/guides/stability.md:15-22` (checked); `NC/src/aria/tabs/tab.ts:40`, `tab-panel.ts:44`, `tabs.ts:54` (`exportAs`, checked); `NG/best-practices/style-guide.md`; ticket 07 (input naming row, `exportAs` row).

#### P14. Every input earns its place by tracing to Yeti, Aria, the APG, WCAG, or Material; no count

Rule: Every input traces to a Yeti attribute or marker of the item's manifest, to a token exception ADR 0004 allows, to a hosted `@angular/aria` input, to an APG or WCAG requirement, or to a Material precedent, and its JSDoc names the Yeti attribute; every manifest attribute is an input unless ticket 26 maps it otherwise, each exception listed with its reason; no two public members set or read one state under different names, and no cancelable event exists beside a predicate; there is no target input count.

Why: Material's standard, "once a feature is released, it never goes away"; Yeti's attributes are all vocabularies and markers (ticket 02), so none of the old removed-option categories (jQuery options, HTML-string options, class-name options, timing options) exists, and Yeti's timings are tokens (`--yeti-dropdown-open-delay`, `--yeti-duration-fast`) that stay the consumer's under ADR 0004; what remains to leave out is what ticket 26 leaves to the consumer.

Preferred: `YetiNav` with `variant`, `threshold`, `panel`, `gap`, `sticky`, the five attributes of its manifest; a `closePredicate` from Material where a dialog needs a veto, beside the native `cancel` event; `orientation` from Aria's `TabList` where the vertical tabs need `aria-orientation` (ticket 17).
Avoided: a `2-5 inputs` cap; an `openDelay` input for a token; a cancelable `closing` output beside `closePredicate`; an attribute left out without a row in ticket 26.

Origin: old P14, adapted (the removed-options categories have no Yeti counterpart; the token exception is ADR 0004's).
Decided by: map, Input naming; ADR 0004; ADR 0005; ticket 26.
Sources: `NC/CODING_STANDARDS.md` (API stability); `Y/src/components/nav/manifest.json` (attributes, checked); ticket 17 Answer (`aria-orientation`).

#### P15. Yeti's behaviour is in, in Angular's form, plus what a single-page application needs; application behaviour is out

Rule: The package owns every behaviour a Yeti module had (ADR 0040) and what Yeti's modules lack in a single-page application: setup for Angular-rendered DOM, closing a top-layer panel in the persistent shell on navigation with focus back on the opener, and fragment links that work under `<base href>`. It owns nothing else: no business logic, API calls, application state, or domain workflow. A service exists only for state shared across instances; everything else is directive-local state plus DI links.

Why: library declarations are designed stateless; measured in three engines: a bare `href="#id"` on `/sub/tabs` reloads the document to `/sub/#id`, a shell popover and a shell modal dialog with a `routerLink` stay open over the new route, and a `NavigationStart` closer of about 15 lines fixes both with focus back on the opener (ticket 20); the user ruled that only `baseHref` is supported, never `deployUrl` (map, Standing rulings).

Preferred: a nav directive that closes its popover on `NavigationStart`; a carousel dot directive that scrolls the track and fires `slide` without a history entry, as `carousel.js` did; validation through Angular's forms with `aria-invalid` and `aria-describedby` bound by the field directives (ticket 19).
Avoided: a data-fetching input; a global store; a directive that loads `tabs.js`; a public service for per-instance state.

Origin: old P15, adapted (the single-page-application clause is new from ticket 20).
Decided by: ADR 0040; building-blocks 1.5 (services), 1.15; map, Deployment URLs; ticket 25 (where the shared pieces live).
Sources: ticket 20 Answer (checked); ticket 19 Answer; `NG/tools/libraries/creating-libraries.md`; `Y/src/components/carousel/carousel.js:1-9`.

### Platform, accessibility, styling

#### P16. Native platform first, inside Baseline 2025; Yeti's CSS fallbacks are the fallbacks

Rule: Each behaviour stops at the first level that covers it: native platform, then `@angular/aria`, then `@angular/cdk`, then custom Angular, and each spec says which level and why. A platform feature is usable without a guard if it is in Baseline 2025 (Chrome and Edge 141, Firefox 145, Safari 26.2); a newer one needs a fallback, as Yeti does (ADR 0002). The package writes one code path per behaviour and no JavaScript feature detection in the first milestone: where Yeti guards a feature in CSS with a working fallback (anchor positioning, scroll-driven animations, `field-sizing`, `interpolate-size`), the package relies on Yeti's fallback and the spec states it; a JavaScript feature outside the target (`interestfor`, `closedby`) is not used, and the spec names it as the feature it adopts when the target moves. CDK is used where it is the smallest correct piece: `_IdGenerator` (as the token through which Aria's ids reach the package's per-application counter, ADR 0044), `Directionality`, and `hasModifierKey`; `FocusMonitor`, `LiveAnnouncer`, `AriaDescriber`, `FocusKeyManager`, and `InteractivityChecker` were considered per item and are not injected in the first milestone (building-blocks 1.2; ADR 0043); `FocusTrap` only if a spec wants strict APG wrapping the native dialog does not give (ticket 17); `MediaMatcher` and `BreakpointObserver` are not used, because no Yeti behaviour reads a viewport breakpoint; CDK Overlay, Dialog, Menu, Accordion, and Listbox are not used, because `popover`, `dialog`, and `details` are the platform's and Yeti's.

Why: Yeti is platform-first by design and the user chose its target (ADR 0002); two code paths double the test matrix; Yeti's own guards are `@supports` blocks with a stated fallback ("Where anchor positioning exists the sheet sits exactly under the bar; elsewhere it starts at the top of the viewport", `nav/docs.md`), so a package guard would duplicate them; the only Aria patterns that fit Yeti's elements are Tabs and Toolbar, which `tabs` and `buttons` host by composition (ticket 03, ticket 17; map, Standing rulings, "The Aria rows, one by one").

Preferred: `details` with a consumer `name` for the exclusive accordion; `popover` for the dropdown and the nav, positioned by Yeti's CSS; Aria Tabs under `div[yetiTabs]`; `IntersectionObserver` for the toc and the `enter` utility; `FocusKeyManager`, `Directionality`, and `LiveAnnouncer` for the carousel, which no Aria pattern covers.
Avoided: a package `@supports` check or a `'anchorName' in document.documentElement.style` test; a `getBoundingClientRect` positioner for the dropdown; CDK Overlay for a popover; Aria's Accordion over `details`; `MediaMatcher` for `data-threshold`.

Origin: old P16, adapted (target, feature lists, and the CDK list change; the "no progressive enhancement" clause becomes "Yeti's CSS fallbacks, no package guards", because ADR 0002 requires a fallback for anything newer and Yeti already provides it in CSS).
Decided by: ADR 0002; map, Implementation order; building-blocks 1.2; ADR 0040.
Sources: `Y/README.md:30-32` (checked); `Y/src/components/dropdown/dropdown.css:44-58`, `Y/src/components/nav/nav.css:118-121`, `:135`, `Y/src/components/tooltip/tooltip.css:64` (the `@supports` guards, checked); `Y/src/components/dropdown/hover.js:11-13` (`interestfor`), `Y/src/components/dialog/dialog.js:5-6` (`closedby`); ticket 01 Answer (guards, checked by scan); `NC/src/cdk/a11y/*` (classes named, checked); `NC/src/cdk/layout/media-matcher.ts:19`.

#### P17. Accessibility is a requirement with a gate

Rule: Every directive and component meets WCAG 2.2 AA, follows the matching APG pattern with its full keyboard table (no role without one), and is axe-clean under the six tags (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `best-practice`), enforced by the story gate in CI; never a recommendation and never a silenced rule. Each spec names the criteria its item touches and how each is met, and each deviation of Yeti's that the package closes is a row in `ledger.md` with the building block that closes it: the tooltip's Escape through Yeti's own `[hidden]` rule, closing a dropdown or nav panel when focus leaves (a `focusout` host listener, [ADR 0043](adr/0043-light-dismiss-additions-are-host-listeners-not-cdk-services.md)), `aria-orientation` on vertical tabs (Aria `TabList`), the carousel's `group` and `aria-roledescription="slide"` and a current-slide marker, `aria-controls` on the demo grip, the required `*` kept out of the field's name. Hidden in-DOM content gets `hidden` where Yeti's CSS keys on it and Aria's `inert` where Aria adds it, never `aria-hidden` to hide; a `dialog` and a popover manage their own inertness. Names come from the consumer's `aria-labelledby` or `aria-label` on elements the consumer writes, as Yeti's docs ask, and a directive declares no name input for such an element. Where Yeti's own CSS is what fails (no `forced-colors` rules), the package adds one small documented rule per gap in its own `ngx-yeti` layer above Yeti's, each a ledger row, by the user's ruling of 2026-10-02, "Accessibility CSS: Yes." (map, Standing rulings, Package CSS for accessibility).

Why: axe-core 4.13.0 with the WCAG 2.2 AA tags found 0 violations on all 49 of Yeti's examples in three engines, so the gate mostly guards the package's own additions (ticket 17, measured); eight behaviour deviations remain, each with an Aria, CDK, or Material building block; "a role is a promise"; the user's standing ruling 36 asks for the ledger.

Preferred: a tooltip directive that sets `hidden` on Escape (WCAG 1.4.13); a `focusout` host listener with a `pointerdown` guard closing a dropdown on focus-out ([ADR 0043](adr/0043-light-dismiss-additions-are-host-listeners-not-cdk-services.md)); `role="list"` required by the nav spec's usage rule as Yeti's docs state it; `inert` from Aria plus `hidden` from the wrapper on a tab panel.
Avoided: "should support keyboard navigation" without a key table; `parameters.a11y.test` lowered for a Yeti default; `aria-hidden` to hide a closed panel; a `label` input on the nav directive; a package `forced-colors` rule outside `@layer ngx-yeti`, or one with no ledger row.

Origin: old P17, adapted (the Sass settings and Library mixin enforcement are gone; the ledger and the package's accessibility CSS, which the user allowed on 2026-10-02, are this map's; the `inert` and `hidden` clause follows Yeti's CSS and Aria). Old ADR 0022's record is ticket 08's.
Decided by: map, Accessibility; map, Standing rulings 36 and 37, and Package CSS for accessibility (2026-10-02); ADR 0043; ticket 25 (the ledger's format).
Sources: ticket 17 Answer (checked); `Y/src/components/tooltip/docs.md:26` (Yeti states the Escape gap); `Y/src/components/nav/docs.md` (Accessibility); `NC/src/cdk/a11y/focus-monitor/focus-monitor.ts:87`; `NC/src/aria/tabs/tab-panel.ts:49`.

#### P18. Yeti's CSS is the look and its tokens are the consumer's; the package ships no CSS and loads each item file with its directives

Rule: The package re-implements no Yeti style and ships none of Yeti's CSS; its own CSS is the accessibility rules the user allowed on 2026-10-02 (map, Standing rulings). Yeti's `--yeti-*` tokens are a consumer stylesheet surface: each spec names the tokens its item reads and how a consumer sets them in Yeti's way, and the package offers no input per token and no theme provider, with ADR 0004's two exceptions (a token a module wrote as state becomes a host style binding from a `computed`, `--yeti-range-value`; one derived token as an input where a spec says why). Private `--_yeti-*` tokens are never read or written. The always-loaded group (`layers.css`, `tokens/*`, `base/*`, `layouts/attributes.css`) is the consumer's global stylesheet and is not specified; each item's item file loads when its first instance renders and unloads after the last, by the mechanism ticket 13 decides, in Yeti's layer order with `layers.css` declared first. No directive carries styles; a component carries a `styleUrl` only where ticket 13 makes that the mechanism.

Why: Yeti has no Sass and no compile step, and every input is a runtime custom property (ticket 04); the 297 public token names are frozen but their defaults are not (`stability.md`); hues, chroma, and the scale take effect only on `:root` (`theming.md:38`); a component's skin is token-only and a class name belongs to Yeti (`theming.md:115`); each of the 49 item files loads alone beside the always-loaded group, 40 of them differ without `layouts/attributes.css`, and a part placed before `layers.css` broke 65 of 98 pages (tickets 04 and 23, three engines).

Preferred: a Tokens subsection listing `--yeti-card-padding` and how a consumer sets it; `'[style.--yeti-range-value]': 'fill()'`; `layers.css` in the consumer's global stylesheet before anything else.
Avoided: `styles: [...]` on a directive; a `padding` input mapped to a token; a theme provider writing `:root`; a item file linked before `layers.css`; a package rule selecting `.button`.

Origin: old P18, adapted (its theming half: consumer owns theming, library adds no styles, an implementation channel exists for a runtime value; its Sass half is abandoned with old ADR 0012, ticket 07, and the part-file clause is this map's Lazy styles record).
Decided by: ADR 0004; map, Tokens; map, Lazy styles; map, The always-loaded group; ticket 13.
Sources: `Y/src/guides/theming.md:38`, `:52`, `:94-96`, `:113-117` (checked); `Y/src/guides/install.md:92-97` (checked); `Y/src/guides/stability.md:19`, `:26`; ticket 04 Answer; ticket 23 Answer; ticket 24 Answer (Tailwind coexistence, building-blocks 1.13).

#### P19. Animation through Yeti's CSS on native state; `animate.enter` and `animate.leave` in the class form, only for content the package or the consumer inserts or removes

Rule: An element that stays in the DOM animates through Yeti's own CSS keyed on native state (`:popover-open`, `[open]`, `@starting-style`, the `enter` utility), and the directive adds no class for it. An element inserted or removed in a template uses `animate.enter` and `animate.leave` in the class form only, with Yeti's own classes or the consumer's; the function form is never used anywhere in the package or its stories, because one permanent function-form `(animate.leave)` listener keeps every component's styles loaded (`upstream-bugs.md` A1). `animate.enter` is not used on a server-rendered element, because it plays at hydration, and it does not replace Yeti's `data-once` arrival, which is viewport-driven. Where a directive must act after a transition (focus after a panel closes), it awaits `transitionend` or `animationend` filtered by target, with a fallback timer of the duration read from the host's computed `transition-duration` or `animation-duration` plus 100 ms, a measured zero completing at once; it never parses a token's text, because a production build writes `--yeti-duration-fast` as `.15s` (`upstream-bugs.md` Y1). Reduced motion is Yeti's: its tokens collapse every animation under `prefers-reduced-motion`, and a directive adds no reduced-motion logic of its own except to skip a wait. No `@angular/animations`, no JavaScript-timed animation.

Why: the user's rule; measured: an `animate.leave` class reused Yeti's own dialog transition and was removed after 153 to 192 ms, `animate.enter="enter"` played Yeti's `enter` utility, Yeti's `@starting-style` played on insertion, a `.enter[data-once]` inserted after load never arrives, and the function form kept `badge.css` loaded while the class form did not (ticket 18); reduced motion collapsed every animation measured (ticket 17); `animate.enter` with transitions needs `@starting-style`, which is in Baseline 2025 (ADR 0002), so Yeti's transition classes work with it where Foundation's Motion UI could not.

Preferred: `animate.leave="leaving"` with a Yeti transition on an alert the consumer removes with `@if`; `animate.enter="enter"` on a client-inserted card; a dropdown that animates by `:popover-open` and `@starting-style` with no package class.
Avoided: `(animate.leave)="fn($event)"`; `animate.enter` on a server-rendered dialog; `element.animate()`; `parseFloat(getComputedStyle(el).getPropertyValue('--yeti-duration-fast'))` as a timer; a `reducedMotion()` signal of the package's own.

Origin: old P19, adapted (State classes become native-state CSS; the Motion name types and the `nfs-motion` mixin are gone; the function-form ban, the `data-once` limit, and the token-parsing hazard are new from ticket 18). Old ADR 0003's record is ticket 08's.
Decided by: map, Animation; ADR 0002; ADR 0004 (tokens stay the consumer's).
Sources: ticket 18 Answer (checked); `upstream-bugs.md` A1, Y1; `NG/guide/animations/enter-and-leave.md:10`, `:28` (class form, host binding form, `@starting-style`; checked); `NGP/core/src/animation/interfaces.ts:40-46` (`MAX_ANIMATION_TIMEOUT`, 4 s default, checked); `Y/src/components/dropdown/dropdown.css:57-58` (`@starting-style`); `Y/src/utilities/enter/enter.js:1-14`.

#### P20. The native control carries the value; Angular's forms own validity; the package binds what Yeti's CSS reads

Rule: A native control the package only styles (every control in a `field`, the switch, the range) keeps its own value, `checked`, and forms directives and gets no value API from the package; no directive implements `ControlValueAccessor` or `FormValueControl` for a control the platform already handles. Validity is Angular's: Signal Forms first, reactive forms where the application already has them; the field directives bind `aria-invalid` from field state so Yeti's CSS shows its error look for every rule, compose `aria-describedby` to the hint and the error, fill the `[data-error]` slot from the field's errors, and move focus to the first invalid control in an `onInvalid` recipe; `validate.js` is never loaded, and the `yeti:invalid` event becomes an `invalid` output of the form directive. The range fill is a server-rendered `computed` (ADR 0004 exception 1).

Why: a second value source beside the native control drifts; measured in three engines: under `FormRoot` and reactive forms Angular prevents the submit before `validate.js` runs, so no `aria-invalid` and no message; a form invalid only through `pattern()` or a custom rule submits with `validate.js` alone; after a refused submit only natively invalid fields match `:user-invalid`, so Yeti's CSS shows nothing for `email()`, `pattern()`, or custom rules unless the package binds `aria-invalid` (ticket 19); `@angular/forms` sets neither `aria-invalid` nor `aria-describedby` (ticket 03, ticket 19).

Preferred: `input[yetiFieldControl]` beside `[formField]`, binding `aria-invalid` and `aria-describedby`; `p[yetiFieldError]` rendering the field's first error message; `'[style.--yeti-range-value]'` on the range field.
Avoided: `<yeti-input>` re-rendering the control; a `checked` model on a switch; a directive implementing both forms contracts; loading `validate.js`; a `role="alert"` error that Yeti's contract does not have.

Origin: old P20, adapted (no transformed control remains, so no forms contract is implemented; the `aria-invalid` and `:user-invalid` findings are new from ticket 19). Old ADRs 0006 and 0026 are ticket 08's.
Decided by: ADR 0040; ADR 0004 exception 1; ticket 19 (evidence); the field spec (the per-field decisions).
Sources: ticket 19 Answer (checked); `Y/src/guides/components.md:97-99` (the field's contract); `Y/src/components/field/example.html:2-7`; `NG/guide/forms/signals/`.

#### P21. No package strings; direction from `Directionality`; a scroll follows the rendered direction

Rule: The package renders no human-readable string of its own: every label, role description, formatted value, and error message comes from consumer markup, a consumer function, the browser's own `validationMessage`, or the author's message per rule; a directive declares no name input for an element the consumer writes. Direction is read from `Directionality.valueSignal`, never from `html[dir]`. One exception, a read of the rendered layout: a directive that scrolls a track or reads a scroll position (the carousel's dots, as `carousel.js` does) takes the track's computed `direction` in its client handler, because scroll geometry follows CSS direction, which `Directionality` does not see below a `dir` it does not track.

Why: Yeti renders no strings either and asks the author for every name (`nav/docs.md`, Accessibility); `validate.js` writes the browser's localised message, and Signal Forms gives the author's; Aria ships no default label string and reads `Directionality` for reversed navigation; Yeti's CSS is already logical (`inline-size`, `inset-inline-start`), so the package has no CSS to make logical.

Preferred: the nav's `aria-label` from the consumer; the field error from the rule's message; `Directionality.valueSignal()` for the carousel's arrow keys; `getComputedStyle(track).direction` in the dot click handler.
Avoided: a `closeLabel` input with an English default; `document.documentElement.dir` reads outside a scroll handler; a package-written "Required" string.

Origin: old P21, carried over (the slider's exception becomes the carousel's; the logical-properties clause has nothing to apply to, since the package ships no CSS).
Decided by: building-blocks 1.5 (direction), 1.10 (names); ADR 0040.
Sources: `NC/src/cdk/bidi/directionality.ts:43` (`valueSignal`, checked); `Y/src/components/carousel/carousel.js:31-33` (computed `direction`, checked); `Y/src/components/nav/nav.css:71`, `:110` (logical properties); ticket 19 Answer (messages); `NC/src/aria` (no default strings, the old bundle's source reading, carried as evidence).

### Delivery

#### P22. One entry point per item; nothing unused reaches a bundle

Rule: Every item the spec list keeps is its own secondary entry point (`ngx-yeti/<item>`), so a consumer can `@defer` per item and a item file travels with its directives. A class another entry point needs only to find an optional parent or part goes through a lightweight token typed with `import type` (a dropdown inside a nav, a spinner inside a button); a required dependency (a hosted Aria directive, the primary entry point's vocabulary types) is a value import by package path; Yeti's 32 vocabulary types are re-exported from the primary entry point and imported as types. Global configuration is a purpose-named provider function where a spec needs one, never an umbrella `provideYeti()` or an NgModule; no item has a defaults token unless its spec says why, because Yeti's defaults are the manifest's and a token would be a second place to look.

Why: entry points define the granularity of lazy loading and preventing retention is the package author's job; measured: a badge in its own secondary entry point inside `@defer` rode in a hashed lazy chunk of 575 bytes transfer and was styled when inserted, while in one entry point it went into `main.js` (ticket 04); a class referenced as a value for an optional part is retained even when unused (old bundle measurement, carried as evidence).

Preferred: `ngx-yeti/nav`, `ngx-yeti/dropdown`; `inject(yetiNavToken, {optional: true})` in the dropdown; `import type {YetiGap} from 'ngx-yeti'`.
Avoided: one entry point for the whole package; `inject(YetiNav)` in the dropdown; `provideYeti()` as an umbrella provider; a defaults token per item by habit.

Origin: old P22, adapted (the unit is the item; the Variant registries are gone and the vocabulary unions take their place; defaults tokens become opt-in per spec).
Decided by: building-blocks 1.3, 1.9; ADR 0005 consequences; ticket 11 (the list).
Sources: `NG/tools/libraries/angular-package-format.md`; `NG/guide/di/lightweight-injection-tokens.md`; ticket 04 Answer (checked).

#### P23. Every misuse a type cannot catch is stated as documented usage

Rule: Each misuse the compiler cannot see (a part outside a parent it may stand without, a missing name, a `details` without `name` where the spec expects exclusivity, a `label for` that names nothing, a `ul` without `role="list"`, a run-time value outside a vocabulary) is a usage rule of the directive's spec, stated in its API text, its usage section, and its JSDoc, and the spec's usage examples follow it; the first milestone ships no development check of its own. A part that cannot stand alone is a required injection, whose NG0201 is Angular's report.

Why: the user's reasons for deferring checks (map, Milestones); the closed unions catch a literal value at compile time (ADR 0005); Yeti's own validator refuses mismatched markup in Yeti's repository, not in a consumer's, so the package's bar is the same as Yeti's: its items, used as documented, pass; whether a later-milestone check spec is worth writing at all is decided in the ticket's Answer: no, because Angular's NG0201, NG8002, and NG8003 and the compile-time unions cover what a check would, and the remaining gap (a static attribute with no imported directive, a computed value outside a vocabulary) is one Yeti itself never needed a check for.

Preferred: "Put `role="list"` on the `ul`: Yeti's reset only removes list markers where that role says the list is decorative" as the nav spec's usage rule; `inject(yetiTabsToken)` required in `YetiTab`.
Avoided: a rule that only a check states; a thrown error for a missing `role`; a `strictParents` option.

Origin: old P23, carried over (the Yeti examples are new; the later-milestone check spec is abandoned, recorded in the ticket's Answer). Old ADR 0046's record is ticket 08's.
Decided by: map, Milestones; ADR 0005; the ticket's Answer (question 14).
Sources: `Y/src/components/nav/docs.md` (Accessibility, checked); `Y/src/guides/components.md:99` (the validator refuses a `for` that does not match); `NC/src/aria/accordion/accordion-group.ts:119` (required injection).

#### P24. A forgotten import of an attribute directive fails silently; entry points export classes, not import arrays

Rule: Entry points export their directive classes and no import arrays. A component lists in its `imports` every directive class whose attribute its template writes. A spec's TypeScript usage examples import every directive they use, and its class and attribute assertions run in the story gate, so a story whose `moduleMetadata.imports` misses a directive fails on the element it leaves bare, which in Yeti's case is an element with no class and no `data-*` attributes at all.

Why: Angular reports no error for a static attribute that matches no imported directive; a bound input on the missing directive fails (NG8002), a static one does not; an exported array hides its members from the unused-imports diagnostic; the user ruled against arrays (2026-09-28). Yeti strengthens the detection: a bare element renders unstyled rather than half-styled, because the class itself is the directive's.

Preferred: `imports: [YetiNav, YetiNavToggle, YetiNavList, YetiNavClose]`; `[threshold]="'sm'"`, which fails to compile when `YetiNav` is not imported.
Avoided: an exported `YETI_NAV` array; a TypeScript example that shows `<button yetiButton>` without its import.

Origin: old P24, carried over.
Decided by: map, Milestones (entry points export classes and no import arrays, the user's ruling); building-blocks 1.9.
Sources: `NG/guide/components/selectors.md`; `NG/reference/errors/NG8002.md`; `NC/src/aria/accordion/public-api.ts`.

#### P25. Tests assert the DOM; no harness classes in the first specs

Rule: Assertions at every test layer are DOM-first (the class, the `data-*` attributes and their values, roles, ARIA, `hidden`, `inert`, `open`), never instance fields; every spec names the four test layers with its Story ids and cases; Story ids and arg names are the contract between a spec's own test layers, and renaming one breaks that spec's e2e tests and the spec says so; the attribute-and-value check against Yeti's built manifest is a DOM assertion over the same stories; no custom harness classes ship in the first specs.

Why: Yeti's class and attribute contract is the DOM the directives bind, and it is frozen, so tests can assert it directly and against the manifest; Material's harnesses exist because its DOM is not a contract.

Preferred: `await expect(nav).toHaveAttribute('data-threshold', 'sm')`; `await expect(tab).toHaveAttribute('aria-selected', 'true')`; `nav--drawer` listed in the spec's Testing Decisions.
Avoided: `expect(fixture.componentInstance.nav.threshold()).toBe('sm')`; a `YetiNavHarness` in a spec.

Origin: old P25, carried over (the manifest check is this map's Testing addition). Old ADR 0018's record is ticket 08's.
Decided by: map, Testing; building-blocks 1.12.
Sources: `NG/guide/testing/component-harnesses-overview.md`; ticket 07 (Testing row); `Y/src/guides/stability.md:15-18`.

#### P26. Shared baselines the audit checks by section

Rule: Every spec meets the shared baselines the records state, checked against the record's own text: focus (building-blocks 1.10: one tab stop per composite, focus returned to the opener when a dialog or popover closes, as `dialog.js` and the nav's docs do, never focus on the `dialog` element itself); disabled (1.10: `:disabled` or `aria-disabled` on a link acting as a button, as Yeti's state table has it; Aria's `softDisabled` for composite items); ids (1.5: the consumer's id wins, `injectYetiId` with the item prefix, a per-application counter seeded on the client through `TransferState`, a server-rendered id adopted at hydration, Aria's prefixes kept on the same counter through `provideYetiAriaIds()`, every reference to a generated id a host binding, so the server and the client render the same ids ([ADR 0044](adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md)), and fragment links and `details name` need consumer values); restoring globals on destroy (1.9: an open popover or dialog closed, a `NavigationStart` subscription removed); keys (1.5: `event.key`, `hasModifierKey`, no `keyCode`); output payloads (1.4: an output carries the typed `detail` of the event it replaces, `{tab, panel}`, `{index, slide}`, `{link, heading}`, `{controls}`; a part-level output is `void`); images (1.2: `NgOptimizedImage` for every static `<img>` in stories and examples); a requirement on content the directives cannot read is stated as a requirement, shown in every recipe, and asserted by every story; member visibility (the planning repository's `AGENTS.md`: `#` for private members, `protected` for template and query members, no `private`).

Why: each is a recorded rule; restating them here would risk rewording them, so the audit reads the section.

Preferred: a dialog directive that focuses the opener on `close` (`dialog.js:54-57` is the behaviour it keeps); `ngx-yeti-nav-` ids; a `select` output typed `{tab: HTMLElement; panel: HTMLElement | null}`.
Avoided: focusing the `<dialog>` element itself; `keyCode` comparisons; a plain `<img>` in a story where `NgOptimizedImage` can be used.

Origin: old P26, adapted (the items point to this bundle's sections and Yeti's behaviours).
Decided by: building-blocks 1.2, 1.4, 1.5, 1.9, 1.10; the planning repository's `AGENTS.md`, Member Visibility.
Sources: the sections named; `Y/src/components/dialog/dialog.js:52-58` (focus return, checked); `Y/src/guides/stability.md:21-22` (event `detail` keys frozen, checked).

### New for Yeti

#### P27. The package replaces Yeti's modules; it never loads one beside itself

Rule: A consumer loads none of Yeti's optional modules. Each directive owns the behaviour the item's module had, sets up its own element when created in any rendering mode, and tears down what it created on destroy; each spec names the module it replaces and what of it is kept, changed, or removed. `demo.js` is docs tooling, and ticket 11 says whether `demo` is specified.

Why: ADR 0040, from ticket 20's measurements: load-once modules miss every route, the writing modules fight bindings and hydration, and re-running them costs N+1 events per run.

Preferred: a tabs directive with Aria Tabs and no `tabs.js`; a dialog directive that keeps the platform's `commandfor` and adds `dialog.js`'s backdrop click and focus return itself.
Avoided: `<script type="module" src="yeti-css/js/tabs.js">` in a consumer's `index.html`; a directive that `preventDefault`s to keep a module out.

Origin: New for Yeti.
Decided by: ADR 0040.
Sources: ticket 20 Answer; ticket 18 Answer; `Y/src/guides/stability.md:20` (each module optional).

#### P28. Breakpoints are the container's; the package reads no viewport

Rule: Every size-dependent change in Yeti is decided by a container's width in CSS (`data-threshold`: a container query on `nav`, flex-basis arithmetic on `columns`; `data-show` and `data-hide` in `layouts/attributes.css`; the card's and pagination's shape changes), so the package has no breakpoint service, no server breakpoint, no breakpoint token, no `MediaMatcher`, and no rule-string parser. A directive that needs its own size observes its element with `ResizeObserver` from a render callback and says why; a spec never adds a viewport-keyed input.

Why: checked: no Yeti module reads `matchMedia` for a breakpoint or `innerWidth` (`hover.js:14` reads a pointer capability, which is not a breakpoint); `attributes.css:368-387` keys `data-show` and `data-hide` on `@container (inline-size ...)`; the nav collapses at "its own width, not the screen's" (`nav/docs.md`); so the old server-breakpoint problem (a first client render swapping a mode) does not arise, and the old rendered-state rule that existed for it is not needed.

Preferred: `<nav yetiNav threshold="md">`, which Yeti's CSS resolves with no script; `ResizeObserver` in `afterNextRender` where a spec measures.
Avoided: a `YetiMediaQuery` service; `serverBreakpoint`; a `[hideFor]` input; `matchMedia('(min-width: ...)')` anywhere in the package.

Origin: New for Yeti (abandons old building-blocks 1.7 and the Breakpoint service of old Part 3).
Decided by: this guide; building-blocks 1.7; the ticket's Answer (question 6, impact MEDIUM, confidence HIGH).
Sources: `Y/src/layouts/attributes.css:368-387` (checked); `Y/src/components/nav/docs.md` (How it works, checked); `Y/src/components/nav/manifest.json` (`data-threshold`); `rg matchMedia|innerWidth src --glob '*.js'` at `f52d1e8b9` (one hit, `hover.js:14`, a capability query; checked).

#### P29. Openers, panels, and placement are the platform's; the package positions nothing

Rule: A trigger and its panel are related by the platform's attributes, rendered by the opener's or the parent's directive with generated ids: `popovertarget` and `popover` for the dropdown and the nav, `commandfor` and `command` for the dialog, `details` and `summary` for the accordion. Opening, the top layer, light dismiss, Escape, the toggle's expanded state, and focus containment are the platform's, and placement is Yeti's CSS: anchor positioning behind Yeti's `@supports` guard with Yeti's documented fallback. The package has no positioner, no light-dismiss registry, no `Openable` contract, and no measured placement. What it adds over the platform is behaviour the modules had or the APG asks for: hover intent with the delays read from Yeti's tokens (`hover.js`), the backdrop click and the focus return (`dialog.js`), closing on focus-out (ticket 17), closing on navigation (ticket 20), and `yeti:open` and `yeti:close` as `opened` and `closed` outputs.

Why: measured with JavaScript off: the dialog opens by invoker commands and the dropdown by `popover` (ticket 18); Yeti's dropdown, nav, and tooltip position by `position-anchor` and `position-area` inside `@supports (anchor-name: --a) and (anchor-scope: --a) and (position-anchor: --a) and (position-area: block-end)`, with the user agent centring the panel or the sheet starting at the top of the viewport where anchor positioning is missing (`dropdown.css:44-56`, `nav.css:118-138`, `tooltip.css:64-69`); anchor positioning is outside Baseline 2025 but guarded, so ADR 0002 keeps Yeti's fallback; `interestfor` and `closedby` are the stated ends of `hover.js` and the backdrop click and are not yet in the target.

Preferred: `<button yetiButton [yetiDialogOpener]="confirm">` rendering `commandfor` and `command="show-modal"`; `nav[yetiNav]` giving its list `popover` and its toggle `popovertarget`; `data-trigger="hover"` as a `trigger="hover"` input whose directive keeps `hover.js`'s `pointerover` and `pointerout` behaviour with `--yeti-dropdown-open-delay` read from computed style.
Avoided: a `getBoundingClientRect` positioner; CDK Overlay; a `nfsLightDismiss` registry; a `click` handler calling `showPopover()` as the primary path; `closedby="any"` or `interestfor` before they reach the target.

Origin: New for Yeti (abandons old building-blocks 1.8 Triggers, the Anchored pane of old Part 3, and old ADR 0002; adapts their reasoning into the platform's attributes).
Decided by: ADR 0003 point 5; ADR 0002; ADR 0040; the ticket's Answer (questions 7 and 8).
Sources: `Y/src/components/dropdown/dropdown.css:1-3`, `:44-58` (checked); `Y/src/components/nav/nav.css:1-3`, `:118-138`, `:201-216` (checked); `Y/src/components/tooltip/tooltip.css:1-3`, `:64-69` (checked); `Y/src/components/dialog/dialog.js:1-9` (checked); ticket 18 Answer; ticket 01 Answer (anchor positioning guarded, outside both sets).

#### P30. Events are outputs; no event-manager plugin and no re-dispatcher

Rule: Each `yeti:*` event an item would have dispatched is an `output()` of the directive that replaces its module, named without the prefix and typed by the event's frozen `detail` keys; the directive does not dispatch the DOM event, the package registers no `EVENT_MANAGER_PLUGINS` alias, and no platform service re-dispatches `yeti:*` as `yeti-*`. A consumer binds `(select)`, `(slide)`, `(current)`, `(opened)`, `(closed)`, and `(invalid)` as any Angular output.

Why: `(yeti:select)` is a compile error (`Unexpected global target 'yeti'`), so a plugin never sees the name; an aliasing plugin and a re-dispatcher both work but type `detail` only through global augmentation or not at all, cost one extra event per Yeti event on every page in the re-dispatcher's case, and gain nothing once the modules that dispatch the events are not loaded (ADR 0040); the directive `output()` was measured working zoneless and under SSR, typed without augmentation, and costing nothing where unused (ticket 16).

Preferred: `readonly select = output<{tab: HTMLElement; panel: HTMLElement | null}>()`; `<div yetiTabs (select)="onSelect($event)">`.
Avoided: `(yeti:select)`; `(yeti-select)` through a plugin; `(document:yeti:select)`; `dispatchEvent(new CustomEvent('yeti:select'))` from a directive.

Origin: New for Yeti as a principle; the record is the map's "The contract the package manages" line (ticket 07) and ADR 0040's consequences.
Decided by: map, The contract the package manages; ADR 0040.
Sources: ticket 16 Answer (checked); `NGP/compiler/src/template/pipeline/src/phases/reify.ts:27-29` (`window`, `document`, `body` as the only global targets, checked); `Y/src/guides/stability.md:21-22`.

## Release policy (decided by the user, not audited)

In 0.x (map, Standing rulings, Version format and Breaking changes in 0.x, 2026-10-02; [ADR 0017](adr/0017-release-policy-with-a-pinned-yeti.md)'s 2026-10-02 notes): the version is `0.<Angular major><Angular minor, two digits><breaking counter, two digits>.<patch>-yeti.<Yeti version>.g<Yeti commit SHA>`, a prerelease tag npm keeps, published with `npm publish --tag latest` and pinned exactly by consumers (the user chose "Prerelease tag (Recommended)"). Any 0.x release may break, and a breaking release bumps the counter; everything else bumps the patch (the user chose "Counter replaces it in 0.x (Recommended)"). A removal still needs a `@deprecated` release before it, a changelog entry, and a migration where one can be written, but no longer waits a whole Angular major. Migrations are Nx migrations first, reused for `ng update`. The rule carried over from the user's ruling of 2026-09-28 (the Angular devkit's scheme `0.<Angular major><Angular minor, two digits>.<patch>`; breaking changes, removals, and consumer-visible platform upgrades only when the Angular major changes; one Angular major of deprecation before a removal) returns at 1.0. What a Yeti pin move does to the version, and how the package depends on unpublished Yeti, are [Decide: which ADRs carry over](issues/08-decide-inherited-adrs.md)'s and [Decide: which Yeti version the specs target](issues/12-decide-yeti-version-policy.md)'s. Yeti's own promise bounds the pin: from `7.0.0-beta.0` names are frozen and a value may be added but none removed or renamed, and browser minimums track Baseline and are not frozen (`Y/src/guides/stability.md`). Specs are not audited against this section.

## Idioms from other libraries and their form here

| Idiom | Form here | Why |
| --- | --- | --- |
| `asChild`, `render`, `as` (Radix, Base UI, Headless UI, Ark UI) | Nothing: an attribute directive attaches to the element Yeti documents; `hostDirectives` for a directive that must always carry another's behaviour (P6) | A React part owns its element; a directive never renders one |
| Context (`Accordion.Item` reaching `Accordion.Root`) | A lightweight token with `useExisting`; template references for an opener and its dialog (P4) | DI follows the declaration site; tokens keep classes out of part bundles |
| Controlled and uncontrolled props | `model()`; `linkedSignal()` for internal state that tracks a bound value but may diverge (P10) | Unbound, a model is the default; bound two-way, it is controlled |
| `data-*` state attributes (`data-open`, `data-pressed`) | None: Yeti's `data-*` attributes are looks, set from typed inputs; its state is native and ARIA (P11) | A parallel state system would be a second source, and Yeti's CSS does not read one |
| Floating UI, `@floating-ui/dom`, CDK Overlay | None: `popover` plus Yeti's anchor positioning with Yeti's fallback (P29) | The platform and Yeti's CSS place the panel; a positioner would fight them |
| Explicit state machines (Zag, Ark UI) | `computed()` over signals | `computed()` cannot go stale; a statechart runtime is a dependency the Implementation order does not call for |
| Copy-in distribution (shadcn/ui) | A published, versioned package with one entry point per item (P22) | The Destination is one published package |
| Open UI's part names | A cross-check only; Yeti's and the APG's names win (P13) | Open UI's charter disclaims inventing patterns |

## Conflicts between the records and the old guide, and how they are settled

1. Implementation order. The planning repository's `AGENTS.md` (ngx-foundation-sites-next) puts `@angular/aria` first; the map's order puts the native platform first and says it wins (map, Implementation order). P16 states the map's order. Yeti makes the conflict sharper than Foundation did: Aria's Accordion over `details` or Aria's Menu over a nav of links would change Yeti's semantics (`Y/src/components/accordion/docs.md:19`; `nav/docs.md`, "It is a bar of links, not a menu system").
2. The DI example. The pattern in the planning repository's `AGENTS.md` injects a parent token with `{optional: true, skipSelf: true}` in every child; building-blocks 1.9 injects it required when the part cannot exist alone and optional when it can. P4 and P23 follow building-blocks; the map's Precedence line covers it.
3. One code path against ADR 0002's "anything newer needs a fallback". The old P16 forbade progressive enhancement onto a not-usable feature; ADR 0002 requires a fallback for a feature outside Baseline 2025. P16 settles it by taking Yeti's CSS fallbacks as the fallbacks and adding no package guard: both records hold, and the package's own code stays one path.
4. Package CSS for WCAG gaps. P17 and P18 did not settle it; the user did on 2026-10-02 ("Accessibility CSS: Yes.", map, Standing rulings). The package adds one small documented rule per gap in its own `ngx-yeti` cascade layer, each a row in [ledger.md](ledger.md), and each spec decides its rows.

## What this guide adds beyond the records

New rules, each rated in the ticket's Answer: P28 (breakpoints are the container's), P29 (openers, panels, and placement are the platform's), and the shared-vocabulary clause of P9; P27 and P30 restate ADR 0040 and the map's contract line. Every other principle restates a recorded decision, cited in its Decided-by line.
