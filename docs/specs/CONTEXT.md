# ngx-yeti

An Angular package of directives that wraps Yeti, Foundation's version 7 (`yeti-css`), at a pinned commit: it sets each item's class, attributes, and markers from typed inputs and owns the behaviour of Yeti's optional modules. This glossary is the shared language of the map, the ADRs, the building-blocks map, and the specs. Decided by [Decide: the glossary](issues/10-decide-glossary.md).

Each term names its origin: **Yeti** (Yeti's own docs, guides, or manifest at `f52d1e8b9`, used in Yeti's sense), **old glossary** (`.scratch/next-foundation-specs/CONTEXT.md`, carried over or adapted), or **this map** (a record of this bundle). Where a word has more than one meaning in the sources, the entry says which one this bundle uses and lists the others under _Avoid_.

## Language

### Yeti's surface

**Yeti**:
Foundation's version 7: one CSS-first stylesheet, runtime tokens, and optional JavaScript modules, published (when published) as `yeti-css`; in this bundle always the pinned commit of its `develop` branch.
_Avoid_: Foundation for Sites, Foundation 6, `yeti-css` (for the framework; it is the package name), ngx-yeti (for Yeti)
_Origin_: Yeti (`README.md`); this map (Domain, ADR 0006)

**Item**:
One of the 49 entries of Yeti's manifest, of any kind, named by its manifest name; the unit of one spec and one entry point.
_Avoid_: component (for all four kinds, even though the manifest's key is `components` and its type is `YetiComponent`), part (Yeti's install guide's word for a whole item), family, widget, plugin
_Origin_: this map (ticket 11's term, the architecture guide); Yeti's manifest for the 49

**Item name**:
An item's manifest `name`, equal to its identity class and its folder, written in code font (`card`, `layer`, `container`, `grid`, `media`, `enter`) whenever the item is meant, so it is never read as the plain word.
_Avoid_: title, display name, a bare plain-English word for the item (layer, container, grid, frame, media, overlay, scroller, stack, enter, print)
_Origin_: Yeti (`schema/manifest.schema.json`: "Must equal the folder name"); this map for the code-font rule

**Kind**:
Which of Yeti's four sorts an item is: `layout`, `recipe`, `component`, or `utility`.
_Avoid_: type, category, group (the manifest's `group` is a docs navigation heading)
_Origin_: Yeti (`YetiKind`; manifest `kind`)

**Layout**:
An item of kind `layout` (17): in Yeti's words, "a class that arranges its children and owns the gaps between them".
_Avoid_: layout system, grid (bare), primitive, XY Grid
_Origin_: Yeti (`src/guides/base.md`, `src/guides/layouts.md`)

**Recipe**:
An item of kind `recipe` (3: `shell`, `media`, `hero`): one class for a common composition of layouts, which Yeti also shows built from the layouts themselves.
_Avoid_: pattern, template, composite, recipe component
_Origin_: Yeti (`src/guides/layouts.md`)

**Component item**:
An item of kind `component` (22): in Yeti's words, "a class with a look of its own and a manifest that describes it". Bare "component" means this only in a sentence about kinds.
_Avoid_: component (bare, where an Angular component could be meant), CSS-only component, widget
_Origin_: Yeti (`src/guides/base.md`; manifest `kind`); replaces the old glossary's CSS-only component and Plugin split

**Utility**:
An item of kind `utility` (7: `attention`, `billboard`, `enter`, `lede`, `lift`, `print`, `visually-hidden`).
_Avoid_: utility class, utility family, helper, shared utility (which is a Shared-utility spec)
_Origin_: Yeti (manifest `kind`); replaces the old glossary's Utility class and Utility family

**Identity class**:
The one class an item declares, equal to its item name; Yeti has no other class an item's markup carries.
_Avoid_: Structural class, Variant class, State class, block class, component class
_Origin_: Yeti (`schema/manifest.schema.json`: "The identity class")

**Attribute**:
A `data-*` configuration attribute an item declares for its root element, of type enum, boolean, number, or string, with a default.
_Avoid_: Option, Variant class, modifier, setting, data attribute (bare, where a Marker could be meant)
_Origin_: Yeti (manifest `attributes`, "configuration attributes"); replaces the old glossary's Option and Variant class

**Marker**:
A `data-*` attribute that a descendant of an item's root carries and the item reads (Yeti: "A bare attribute a parent reads"); a few may sit on any element (`on: "*"`), such as `data-paint` and `data-show`.
_Avoid_: child attribute, part attribute, flag, modifier
_Origin_: Yeti (`src/guides/base.md`; manifest `markers`, "data-* attributes that descendants carry, not the root")

**Vocabulary**:
One of the 32 named, closed lists of values in Yeti's `schema/vocabulary.json` that attributes and markers draw from (`gap`, `width`, `variant`); an attribute without one has its own value list.
_Avoid_: enum, palette, scale, value list (for a named vocabulary), Open or Closed Variant family
_Origin_: Yeti (`src/guides/stability.md`)

**Threshold**:
A width from the `width` vocabulary at which one item changes its behaviour, measured on the item's own box, never the screen's.
_Avoid_: breakpoint, media query, Breakpoint query, Class breakpoint
_Origin_: Yeti (`src/guides/responsive.md`, "A threshold, not a breakpoint")

**Part**:
An element of an item's markup below its root that the manifest names in `children` or marks with a Marker (a nav's toggle and list, a field's hint and error, a carousel's track and slides); a part's name comes from its marker or its role, in Yeti's words, and each spec fixes its own.
_Avoid_: sub-component, child component, element (bare), part (for a whole item, as Yeti's install guide uses it)
_Origin_: this map (architecture guide, building-blocks 1.3); Yeti's manifest `children` and `markers`

**Token**:
One of Yeti's 297 public `--yeti-*` custom properties in its catalogue, the theming surface a page sets in its own stylesheet.
_Avoid_: CSS variable, design token, theme token, variable; token (bare) for a DI token, which is an Injection token
_Origin_: Yeti (`src/guides/theming.md`; base guide: "A custom property a theme may set"); this map (ADR 0004)

**Private token**:
A `--_yeti-*` custom property: Yeti's implementation, not frozen, never read, written, or named by the package.
_Avoid_: internal token (bare), private variable
_Origin_: Yeti (`src/guides/stability.md`)

**Derived token**:
A Token Yeti computes on `:root` from the hue, chroma, and scale inputs (`--yeti-color-primary`), which a page may override on any element.
_Avoid_: computed colour, colour role (bare)
_Origin_: Yeti (`src/guides/theming.md`); this map (ADR 0004 exception 2)

**Theme**:
A set of Token values a page sets on `:root` after Yeti's stylesheet; Yeti's `soft` and `sharp` files are examples. The package ships, wraps, and generates none.
_Avoid_: theme provider, skin, Sass settings, palette
_Origin_: Yeti (`src/guides/theming.md`); this map (ADR 0004)

**Module**:
One of Yeti's 10 optional JavaScript files (`alert.js`, `tabs.js`, `dialog.js`, and the rest), each belonging to one item; the package replaces every one and loads none.
_Avoid_: plugin, script, NgModule (Angular's, always written in full), ES module (for this)
_Origin_: Yeti (`src/guides/stability.md`, `src/guides/components.md`); this map (ADR 0040)

**Event**:
A `yeti:*` DOM event a Module dispatches on its item's element (`yeti:close`, `yeti:open`, `yeti:select`, `yeti:slide`, `yeti:invalid`, `yeti:current`), with frozen `detail` keys; the package's counterpart is an `output()` named by its verb.
_Avoid_: callback, hook, `zf` event, package event (the package dispatches no DOM event of its own)
_Origin_: Yeti (`src/guides/components.md`); this map (ADR 0040)

**Frozen surface**:
What Yeti's stability guide promises not to change from `7.0.0-beta.0`: identity classes, attribute names and values, vocabularies, markers, public token names, module file names, event names and `detail` keys, the two schemas, and the `exports` map. Before beta it is Yeti's intent, not a guarantee.
_Avoid_: Yeti's public API, stable API, frozen API
_Origin_: Yeti (`src/guides/stability.md`); this map (ADR 0006)

**Manifest**:
Yeti's built `yeti-css/manifest`, one entry per item with its class, attributes, children, markers, tokens, accessibility block, module, and support notes.
_Avoid_: schema (the manifest's schema is a separate file), registry, Selector manifest (the package's own later-milestone list)
_Origin_: Yeti (`src/guides/install.md`, `schema/manifest.schema.json`)

**Bubble**:
The text element of Yeti's `tooltip`, shown while its Trigger is hovered or focused.
_Avoid_: Tip, popup, tooltip element, overlay
_Origin_: Yeti (`src/components/tooltip/docs.md`); replaces the old glossary's Tip

**Trigger**:
Yeti's word, in the `tooltip`, for the element whose hover or focus shows the Bubble. It opens nothing; an element that opens something is an Opener.
_Avoid_: trigger (for an Opener, though Yeti's dropdown docs say it), anchor, host
_Origin_: Yeti (`src/components/tooltip/docs.md`); the old glossary's Trigger is retired

**Overlay**:
Only Yeti's `overlay` layout.
_Avoid_: overlay (for popovers, dialogs, or the top layer), CDK Overlay, Anchored pane
_Origin_: this map (ticket 11)

**Example page**:
A showcase page on Yeti's docs site, which is neither an item nor a spec.
_Avoid_: demo (which is the `demo` item), example (bare, for Yeti's per-item `example.html`)
_Origin_: this map (ticket 11)

### Styles and loading

**Always-loaded group**:
Yeti's `layers.css`, every file under `tokens/` and `base/`, and `layouts/attributes.css`: loaded globally, styling bare HTML and declaring every token, and managed by no directive.
_Avoid_: base styles, core CSS, global styles (bare), reset
_Origin_: Yeti (`src/guides/install.md`, "Four groups always stay"); this map (Notes, The always-loaded group)

**Item file**:
The loading unit: one item's own stylesheet among Yeti's 49, `yeti-css/css/<kind>/<name>/<name>.css` (`components/card/card.css`). It is loaded as a counted `<link>` when the item's first instance renders and removed after its last ([ADR 0060](adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). The name follows [ticket 13](issues/13-decide-style-loading.md), which owns the mechanism. It replaces this glossary's first name, "part file", because a Part is an element below an item's root and has no file of its own.
_Avoid_: part file, family styles, component styles, loading unit (as a name), chunk, Export mixin
_Origin_: this map (Notes, Lazy styles; tickets 04, 07, 13, 23); Yeti (`src/guides/install.md`: "each layout, recipe, component and utility is one file")

**Cascade layer**:
A CSS `@layer`, always written in full: Yeti's own layers, and the package's single `ngx-yeti` layer after them for the accessibility rules it adds.
_Avoid_: layer (bare: `layer` is a Yeti layout and a Test layer is the package's)
_Origin_: this map (ticket 23; Standing rulings, Prefix and Package CSS for accessibility)

### Tracking Yeti

**Pin**:
The one commit of Yeti's `develop` branch the specs and the package build against, today `f52d1e8b9`.
_Avoid_: Yeti version, release, tag
_Origin_: this map (the user's readiness ruling; ADR 0006)

**Pin move**:
The one commit that replaces the vendored Yeti tree with another commit, behind the gate ADR 0006 sets.
_Avoid_: upgrade, bump, Yeti update
_Origin_: this map (ADR 0006, ADR 0017)

**Browser target**:
Yeti's Baseline 2025: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2; a feature inside it may be used without a guard.
_Avoid_: Angular's baseline, browserslist, support matrix, compat target
_Origin_: old glossary, adapted (its set was Angular's 2026-05-07 baseline); this map (ADR 0002)

**Upstream bug**:
A defect found in Yeti, Angular, or another upstream, recorded in `upstream-bugs.md` with whether it is verified and has a minimal reproduction; accessibility issues are Ledger rows instead.
_Avoid_: issue (bare), Yeti bug (for an Angular one)
_Origin_: this map (Standing rulings, item 44)

**Ledger row**:
A row of `ledger.md` for one standards, accessibility, or Angular Aria, CDK, or Material feature the package adds that Yeti lacks, so a reader can tell what complies because of the package and not Yeti.
_Avoid_: compliance note, a11y log, parity list
_Origin_: this map (Standing rulings, item 36)

### The package

**ngx-yeti**:
This package: Angular directives over Yeti, released under MIT.
_Avoid_: ngx-foundation-sites, nfs, Yeti (for the package), the library (bare, where Yeti could be meant)
_Origin_: this map (the user's ruling, Package name)

**Contract**:
What an item gives a page to write: its identity class, attributes, markers, events, and the tokens it reads, all of which the package's directives manage so the consumer writes none of Yeti's classes or attributes.
_Avoid_: class contract, API (for Yeti's side), markup contract
_Origin_: this map (ADR 0003); replaces the old glossary's Structural, Variant, and State class contract

**Contract mapping**:
The table in each spec with one row per class, attribute, marker, event, and token of its item and the input, binding, or output that manages it.
_Avoid_: class mapping, CSS class mapping
_Origin_: this map (Notes, Spec shape)

**Item directive**:
The one attribute directive per item on the element Yeti's docs put the identity class on, binding that class and setting the item's attributes from typed inputs.
_Avoid_: root component, wrapper, directive family, Plugin directive
_Origin_: this map (architecture guide, Kinds of building block)

**Part directive**:
A directive on a Part that carries an input, a generated id or reference, an output, or behaviour, and sets the part's marker.
_Avoid_: child directive, sub-directive, Wrapper component
_Origin_: this map (architecture guide)

**Free behaviour directive**:
A directive that binds no identity class or Yeti attribute and is written beside another item's directive, never hosted by it, such as a dialog's opener on a button.
_Avoid_: helper directive, behaviour mixin, Trigger
_Origin_: this map (architecture guide)

**Coordinating directive**:
An Item directive that provides an Injection token its parts read and with which ordered parts register.
_Avoid_: container component, controller, parent component
_Origin_: this map (architecture guide); old P4

**Angular component**:
An Angular `@Component`, used only where a part needs structure the consumer should not hand-write or where a `styleUrl` is what makes lazy styles meet the requirements. The package has two, both on attribute selectors: `figure[yetiDemo]`, the `demo` item, and `[yetiFieldError]`, the field's error slot, whose `ng-content` falls back to the rule's message ([ticket 50](issues/50-decide-open-points-of-the-specs.md) decisions 136 and 159).
_Avoid_: component (bare, where a Component item could be meant), Wrapper component
_Origin_: this map (ADR 0003 point 6; standing ruling 28; ticket 11)

**Shared-utility spec**:
One of the five specs for package behaviour that no Yeti item owns: navigation-close, fragment-links, events, generated-ids, and setup (the consumer-facing setup: the cascade-layer statement, the `assets` entry for the Yeti build, `provideYetiStyles()`, the package's accessibility stylesheet, `provideYetiFragmentLinks()`).
_Avoid_: utility (bare), utility spec, shared utility (for an item)
_Origin_: this map (ticket 11; `setup` added by the user's choice of 2026-10-02, map, Standing rulings, Ticket 25's open items)

**Vocabulary type**:
Yeti's own exported TypeScript type for one Vocabulary (`YetiGap`, `YetiWidth`, `YetiVariant`), a closed union of its values, which the package reuses as the type of every input that takes that vocabulary and never redeclares.
_Avoid_: Variant registry, Variant input, union (bare), a package-declared copy of the type
_Origin_: Yeti (`dist/yeti.d.ts`, `src/guides/install.md`); this map (ADR 0005, ADR 0080)

**Injection token**:
A DI `InjectionToken`, named in camelCase with a `Token` suffix (`yetiNavToken`).
_Avoid_: token (bare), `SCREAMING_SNAKE` names
_Origin_: old glossary's naming, adapted (ADR 0012, ADR 0080)

**Defaults token**:
An optional per-item Injection token of application-wide defaults for an option the package owns, declared only where a spec says why; there is none by default and no umbrella provider.
_Avoid_: config token, options token, global options
_Origin_: old glossary, adapted (building-blocks 1.4)

**Opener**:
The element that opens a dialog, a popover panel, or a `details` through the platform's own attribute (`commandfor` with `command`, `popovertarget`, `summary`); Yeti calls a dialog's one its opener and a dropdown's one its trigger.
_Avoid_: Trigger (Foundation's term and Yeti's tooltip word), invoker (the HTML standard's, used only when quoting it), toggle (bare)
_Origin_: this map (building-blocks 1.8); Yeti (`src/components/dialog/docs.md`); replaces the old glossary's Trigger and Openable

**Light dismiss**:
Closing an open popover panel on an outside press or Escape, which the platform does, and when focus leaves both the panel and its Opener, which the package adds.
_Avoid_: click-outside, closeme, auto-close, Backdrop press
_Origin_: old glossary, adapted (ADR 0016: the registry is gone)

**Backdrop press**:
A pointer press that starts and ends outside a modal dialog's box, on its `::backdrop`, which closes the dialog as Yeti's `dialog.js` did.
_Avoid_: overlay click, outside click, backdrop click
_Origin_: old glossary, adapted (Yeti `src/components/dialog/dialog.js`; ADR 0040)

**Disclosure navigation**:
The APG navigation pattern of native lists, buttons that show and hide panels, and `aria-current`, with no menu or tree roles; Yeti's `nav` and `dropdown` follow it.
_Avoid_: menubar, ARIA menu, mega menu
_Origin_: old glossary, carried over

**Current link**:
The link a `nav`, `breadcrumbs`, `pagination`, or `toc` marks as where the reader is, by `aria-current`, which is also the hook Yeti's CSS styles; no class marks it.
_Avoid_: active item, is-active item, selected link, Current section
_Origin_: old glossary, adapted (Yeti's `aria-current` rules in those items' CSS)

**Completion output**:
A past-tense output (`opened`, `closed`) emitted once a state change is committed and its transition has finished.
_Avoid_: event (bare), callback, start event
_Origin_: old glossary, adapted (building-blocks 1.4, 1.6)

**Lazy content**:
Panel, tab, or slide content that renders when first shown, through Aria's template content directives where a spec offers it; distinct from a consumer's `@defer` block, which loads code.
_Avoid_: deferred content, lazy panel, on-demand content
_Origin_: old glossary, carried over (ADR 0011 clause 9)

**Application class**:
A CSS class the consumer defines in its own stylesheet, never one of Yeti's or the package's.
_Avoid_: custom class, own class (bare), user class
_Origin_: old glossary, carried over

**Visually hidden**:
Hidden from sight but kept in the accessibility tree, as Yeti's `visually-hidden` utility does; distinct from hidden, which hides from everyone, and from `aria-hidden`.
_Avoid_: screen-reader-only, sr-only, invisible
_Origin_: old glossary, adapted (Yeti's `visually-hidden` replaces `.show-for-sr`)

**Skip link**:
The first link in the body, when it points at a fragment, which Yeti's base rules keep Visually hidden until it takes focus.
_Avoid_: skip-to-content button, bypass link, jump link
_Origin_: old glossary, adapted (Yeti `src/guides/base.md`)

**Scroll region**:
An element whose content scrolls inside it and that the keyboard can focus, with a role and an accessible name.
_Avoid_: scroller (bare: `scroller` is a Yeti layout), scroll container (bare), overflow wrapper
_Origin_: old glossary, carried over

**Visible value**:
The text a sighted user reads for a `progress` item's value, which the package requires because the bar alone does not meet non-text contrast; distinct from `aria-valuetext`.
_Avoid_: value text, percentage label, caption
_Origin_: old glossary, adapted (ADR 0015 point 4)

**Usage rule**:
A rule of documented usage a spec states for a directive's host, numbered in its API section and in the directive's JSDoc; the first milestone reports no breach.
_Avoid_: constraint, validation rule
_Origin_: old glossary, carried over

### Names

**Angular-side name**:
A name that lives in Angular's namespaces: a selector (`[yetiCard]`, `figure[yetiDemo]`), an `exportAs`, an Injection token, a provider function (`provideYeti()`), or an entry point (`ngx-yeti/card`); it takes `yeti`.
_Avoid_: nfs, pfx, yt, ngx-yeti (for these, except the package name in an entry point)
_Origin_: this map (the user's Prefix ruling; ADR 0080)

**Runtime name**:
A name the package writes into the page that Yeti, the consumer, or other code may also use at run time: a custom property (`--ngx-yeti-*`), a Cascade layer (`ngx-yeti`), a data attribute (`data-ngx-yeti-*`), or a generated id (`ngx-yeti-nav-1`); it takes `ngx-yeti`.
_Avoid_: `yeti-` or `--yeti-` for a package name (Yeti owns those), a package DOM event
_Origin_: this map (the user's Prefix ruling; ADR 0080, generated ids added there)

**Colliding name**:
A TypeScript name the package would export as `Yeti` plus a PascalCase name that equals a name Yeti's `yeti.d.ts` exports; it takes `NgxYeti` instead (`NgxYetiColumns`).
_Avoid_: aliasing Yeti's export, a suffix (`YetiColumnsDirective`)
_Origin_: this map (the user's Prefix ruling; ADR 0012 point 4; ADR 0080)

### Rendering modes

**Rendering modes**:
The set every directive must support and every spec must describe: client rendering, server-side rendering, prerendering, full and incremental hydration, event replay, plain `@defer`, and `withI18nSupport()`.
_Avoid_: SSR support (as the whole set), hydration mode, universal
_Origin_: old glossary, adapted (ADR 0011; the user's hydration ruling adds `withI18nSupport()`)

**Dehydrated state**:
What a directive looks like as server HTML before hydration or inside an unhydrated block: Yeti's identity class, attributes, markers, ARIA, and the platform's opening attributes, with no Angular behaviour yet.
_Avoid_: static render, placeholder (which is `@placeholder`)
_Origin_: old glossary, adapted (Foundation's classes become Yeti's contract)

**Pre-hydration state**:
An attribute a person or a Yeti mechanism can change before hydration (an `open`, an `aria-selected`, a `data-once`), which the package owns as Angular state because hydration writes every static attribute again.
_Avoid_: Pre-hydration input (the old, narrower term), static attribute (for this)
_Origin_: old glossary's Pre-hydration input, adapted (ADR 0003 point 4; ticket 18)

**Hydration boundary**:
The unit that hydrates in one pass: the whole page under full hydration, or one `@defer (hydrate on ...)` block. Since ADR 0044 generated ids are equal on the server and the client, so a widget and the parts its ids link no longer need to share one for their ids to match.
_Avoid_: defer boundary, island, hydration zone
_Origin_: old glossary, carried over (ADR 0011 clause 7; its id reason retired by ADR 0044)

**Replayed event**:
A native user event fired before hydration that reaches a package handler late, once its Hydration boundary hydrates; no Event is ever replayed.
_Avoid_: queued click, captured event
_Origin_: old glossary, carried over (ticket 16)

**Replay guard**:
The rule that a Replayed key event an Aria-hosted widget has handled stops at that widget's container and is not handled again by an outer widget.
_Avoid_: replay fix, key shield
_Origin_: old glossary, carried over (building-blocks 1.9)

### Testing and later milestones

**Test layer**:
One of the four test layers: story play functions, the browser-level layer, the node-level layer, and Playwright e2e.
_Avoid_: layer (bare), tier, suite (for a layer)
_Origin_: this map (ADR 0014)

**Browser-level test**:
The Test layer that renders a directive under TestBed in a real browser, outside Storybook, for the logic no story reaches.
_Avoid_: unit test (for this layer), component test, Playwright component test
_Origin_: old glossary, carried over (ADR 0014)

**Contract check**:
The node-level test that reads the Manifest at the Pin and asserts that every class, attribute, marker, value, and event a spec maps has its input, union member, or output, and nothing more.
_Avoid_: class-rule review, manifest lint, sync check
_Origin_: this map (ADR 0014 point 3)

**Story gate**:
The story-level axe run with the WCAG 2.2 AA tags that fails a story on any violation; the check that enforces the package's accessibility requirement.
_Avoid_: Accessibility gate (the old name), a11y check, axe run (as the name), lint
_Origin_: old glossary's Accessibility gate, renamed after ADR 0014 and ADR 0015

**Anti-pattern story**:
A story that renders markup the package tells consumers not to write, to show why; the only story allowed to switch off Story gate rules, and only the ones it demonstrates.
_Avoid_: bad example, negative story, a11y exception
_Origin_: old glossary, carried over (ADR 0015 point 2)

**Story id**:
Storybook's id of a story, `<item>--<story>`, where `<item>` is the entry point folder name; play functions and Playwright e2e tests address the same story by it.
_Avoid_: story name, test id, scenario
_Origin_: old glossary, adapted (building-blocks 1.3)

**Fixture app**:
The prerendered Angular application with one route per item, which the Playwright e2e layer drives to test the Rendering modes.
_Avoid_: demo app, kitchen sink, SSR app
_Origin_: old glossary, adapted (ADR 0014 point 4)

**Forgotten import**:
A package directive attribute written in a template whose component does not import the directive, so the element renders as bare HTML with no compiler error; the first milestone reports none.
_Avoid_: missing import, unimported directive, dead attribute
_Origin_: old glossary, carried over (ADR 0018)

**Selector manifest**:
The package's later-milestone list of its exported directives and components with their selectors, entry points, and identity classes, which the forgotten-import checks match against.
_Avoid_: directive manifest, Manifest (which is Yeti's)
_Origin_: old glossary, carried over (ADR 0018 point 3)

**In-item check**:
A later-milestone development warning from one Part directive of an item about a peer: an element carrying the peer's attribute with no instance of it.
_Avoid_: in-family check (ADR 0018's wording, from before this glossary), family check, peer check
_Origin_: old glossary's In-family check, renamed (ADR 0018 point 3)

**Misuse warning**:
A later-milestone development warning from a directive about how the consumer used it, reading only its host, inputs, content, or page; in the first milestone each such rule is a Usage rule.
_Avoid_: dev check, lint, sanity check
_Origin_: old glossary, carried over (ADR 0018 consequences)
