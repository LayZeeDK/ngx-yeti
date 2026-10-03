# Research: Yeti's removed planning documents and its stated roadmap

Ticket: [31](../issues/31-research-yetis-removed-planning-documents.md). Researched 2026-10-03. Nothing here decides anything.

## Conventions

- **[read]** means read directly from a source and cited. **[inferred]** means my reading across sources; it is never cited as fact.
- Citations read `B:<path>:<lines>`, where `B` is commit `b23f8b8c2` (the parent of `fa61d90d2`, which removed the files), and `<path>` is relative to `docs/superpowers/`. Lines are the file's own line numbers. Shorthand for the five files:
  - **ARCH** = `specs/2026-09-12-yeti-architecture-design.md` (301 lines)
  - **P0D** = `specs/2026-09-12-yeti-phase-0-repo-transition-design.md` (296 lines)
  - **P0P** = `plans/2026-09-12-yeti-phase-0-repo-transition.md` (2,665 lines)
  - **RESET** = `research/2026-09-12-css-reset-survey.md` (81 lines)
  - **INSP** = `research/2026-09-12-inspiration-notes.md` (57 lines)
- `P` = the pin `f52d1e8b9` (2026-09-25), used where I compare the documents with the code today.
- Quoted phrases are short and in quotation marks; everything else is my paraphrase.

## Provenance and fate of the five files

- [read] The files were committed in `a994b2e29` (2026-09-12 11:22, "chore: clear the Foundation 6 tree for Yeti"), which lists all five under `docs/superpowers/` (`git ls-tree -r a994b2e29`). `git log -- docs/superpowers` printed only `fa61d90d2` in the read-only clone, so path-limited history alone does not show their addition.
- [read] `fa61d90d2` (2026-09-12 11:54:52 -0700, "chore: keep planning documents out of the repository") deleted the five files (3,400 lines) and added `docs/superpowers/` and `.superpowers/` to `.gitignore`. It was made 32 minutes after the add, in the middle of phase 0 tooling work (parent `b23f8b8c2`, "feat(tools): add the validator").
- [read] `d0edc5f37` (2026-09-23) later added `PRODUCT.md`, `.impeccable/`, and `DESIGN.md` to the same ignore list ("keep the design-tooling context files out of the repo"). That is a second set of ignored planning-type files; their contents are not in any commit.
- [read] The five files exist in no branch of the clone: `git log --all -- docs/superpowers` lists only `fa61d90d2`, and the remote branches are `develop`, `master`, `v5`, `v6`, and two dependabot branches. GitHub's `develop` tree has 0 paths matching `superpowers` (GitHub API).

## The architecture design (ARCH)

Master spec, "Draft for review", dated 2026-09-12, covering "the framework only" (B:ARCH:1-5). It says each build phase gets its own spec and plan when it begins (B:ARCH:5, 268).

- **Summary and test.** [read] Yeti is "CSS-first, native, zero-build", published by Foundation beside Inky and Proton, a ground-up rethink of Foundation for Sites 6 on cascade layers, custom properties, container queries, nesting, `dialog`, `popover`, and scroll-snap (B:ARCH:12). The test for every decision is whether it keeps the framework "legible, owned" and free of things that break on someone else's schedule (B:ARCH:14).
- **Decisions table** (B:ARCH:22-37). [read] Name Yeti, repo `foundation/yeti`, npm `yeti-css`, version "continues at 7.0.0" (24). Git-flow kept, `v6` cut from `develop` (25). Dev tooling on Node 22 with `node:test` and Playwright (26). Naming: class for identity, `data-*` for configuration, native or ARIA attributes for state (27). Browser floor Baseline 2025 (28). `pow()` unguarded (29). Bundling is concatenation only, no minifier at launch, Lightning CSS only as a user-side option (30). Manifest is `manifest.json` per component, checked against a checked-in JSON Schema and merged at build (31). npm: a new CSS-only package with "no dependencies, no scripts"; `foundation-sites` stays 6.x and is deprecated at 7.0 (32). Docs: generated Markdown committed to `docs/`, fetched by foundationcss.com at its build (33). Plan shape: this spec, then one spec and plan per phase (34). Layout names are Yeti's own, not Every Layout's (35). Palette in oklch (36). Reset synthesised from a survey (37).
- **Repo transition** (B:ARCH:41-49). [read] Five steps: cut `v6`; mark `v6.9.0` as the final planned 6.x feature release without a new tag; announce and rename the same day; clear `develop` (a long deletion list, keeping `LICENSE`, `code-of-conduct.md`, `SECURITY.md`, `.editorconfig`, and two GitHub templates); lay down the skeleton with `develop` at `7.0.0-alpha.0`.
- **Layout** (B:ARCH:53-100). [read] `src/` holds `yeti.css`, `layers.css`, `tokens/` (scale, color, space, type, radius), `base/` (reset, typography), `layouts/<name>/`, `components/<name>/` (each with `<name>.css`, `manifest.json`, `example.html`, and a `.js` "only if the component has a JS enhancement"), and `utilities/` ("deliberately short: visually-hidden, and little else"). `bin/` holds `build.js`, `validate.js`, `gen-docs.js`, `gen-types.js` ("phase 5"), and `release.js`. `dist/` is built on release only and gitignored, with `yeti.css`, `css/`, `js/` ("per-component ES modules"), `yeti.manifest.json`, and `yeti.d.ts`. Source CSS uses native `@import`, so `src/` loads unbuilt (B:ARCH:102).
- **Cascade layers** (B:ARCH:106-118). [read] One top-level `yeti` layer with five sublayers, `reset, base, layouts, components, utilities`, declared once in `layers.css`. Nothing unlayered; no `!important`; token declarations on `:root` live in `yeti.base`; users add their own layers after `yeti`.
- **Tokens** (B:ARCH:122-168). [read] One geometric scale from `--base: 1rem` and `--ratio: 1.25` (127-138); type and space alias the steps, with named sizes `xs` to `xl` so `data-gap="l"` is legible (146); fluid variants by `clamp()` are the default (152). Colour uses `light-dark()` with `color-scheme: light dark`, authored in `oklch()`, with a hex comment on each (156-159). Each token is flagged public or internal in the manifest; public ones are "the theming API", and internal ones "may change between minor versions" (160). Numeric and colour tokens that components animate are registered with `@property` (164). Spacing belongs to layouts: component CSS never sets outer margin on itself, enforced by a lint in `validate.js` (168).
- **Naming and contract** (B:ARCH:172-180). [read] Plain class for identity, no prefix; `data-variant`, `data-size`, `data-gap`, `data-align`, `data-columns` from a "short shared vocabulary"; booleans are bare attributes; state is native or ARIA; unknown user classes are ignored. Every item has a manifest contract. "Follow-up, not decided now": removing the `data-` prefix when typed `attr()` reaches Safari.
- **JavaScript policy** (B:ARCH:184-188). [read] CSS-only is the default state: accordion on `details`, modal on `dialog`, dropdowns and tooltips on `popover`, carousel on scroll-snap. JavaScript is "per-component, optional, dependency-free ES modules", with "No bundle, no global, no jQuery, no init call". "The JS budget for 7.0 is two modules": `tabs.js` and `dialog.js`; "Anything beyond this needs a stated reason in its phase spec". Positioning needs no JavaScript. Each interactive fixture is tested with and without its module.
- **Browser support** (B:ARCH:192-202). [read] Floor is Baseline 2025, stated plainly in the installation guide. Unguarded: layers, nesting, container size queries, subgrid, `:has()`, `light-dark()`, `@property`, `dialog`, Popover, `inert`, `@starting-style`, `details[name]`, and more. Behind `@supports` with a fallback: anchor positioning, `@scope`, container style queries, `field-sizing`, `sibling-index()`, scroll-driven animations, masonry. Not used in 7.0: typed `attr()`, `if()`, `@function`, `interpolate-size`, `::scroll-button()`, `reading-flow`, `accent-color`. "No polyfills."
- **Manifest and outputs** (B:ARCH:206-244). [read] The manifest entry has `name`, `kind` (layout, component, utility), `description`, `class`, `attributes[]`, `classes[]`, `children`, `tokens[]`, `a11y`, `js`, `support`, and `since` (210-222). `validate.js` checks schema, merging, every `example.html` and fenced guide snippet against the merged manifest, and the margin lint (227-232). Docs are generated per layout and component with Proton-style front matter (238). Open item: how foundationcss.com loads Yeti so examples render live, "before phase 2 docs land" (240). `gen-types.js` emits `yeti.d.ts` in phase 5, and an MCP server in phase 6 "reads `yeti.manifest.json` at runtime, and exposes list, describe, and validate tools" (244).
- **Testing and CI** (B:ARCH:248-256). [read] Three tiers on one Node 22 workflow: tooling tests, manifest conformance, and Playwright fixtures in Chromium, WebKit, and Firefox with computed-style assertions, axe, keyboard checks, and with-and-without-module runs. Screenshot regression is deferred to the phase 5 freeze.
- **Release** (B:ARCH:260-264). [read] `7.0.0-alpha.N` through phases 1 to 4, `7.0.0-beta.N` "from the phase 5 API freeze", then `7.0.0`; git-flow releases with `v7.x.y` tags; `master` stays 6.9.0 until 7.0.0; npm publishes `dist/` as `yeti-css`; jsDelivr is "prototyping-only", self-hosting is the production path. "Semantic versioning is strict": any change to a class name, attribute name, enumerated value, required child structure, or token name is a major.
- **Open items** (B:ARCH:282-289). [read] Removing the `data-` prefix; Lightning CSS as a user-side option; screenshot tests at the freeze; live examples on foundationcss.com; the `@foundation` npm scope ("Joe is contacting its holder"; if obtained, `yeti-css` becomes an alias); downstream naming for Stacks and themes.
- **Non-goals** (B:ARCH:301). [read] "Not a web component library. Not a utility framework. No required build step, ever. No Sass. No polyfills. No full-featured slider in core."
- **Out of scope** (B:ARCH:5). [read] Stacks integration, Stacks Pro themes, and Swatches.

## The phase 0 design (P0D)

"Draft for review", dated 2026-09-12; exit criterion is green CI on an empty framework, `v6` pushed, repo renamed, announcement published, `develop` at `7.0.0-alpha.0` (B:P0D:3-6).

- **Purpose.** [read] Turn the Foundation 6 repository into Yeti "without losing its history, stars, or the ability to ship 6.x fixes". Phase 0 "ships no CSS beyond the layer declaration" so the tooling is "proven on nothing before it is trusted on something" (B:P0D:12-14).
- **Phase decisions** (B:P0D:20-30). [read] npm with a committed lockfile; Node 22; dev dependencies are `playwright`, `@axe-core/playwright`, `parse5`; a hand-written JSON Schema subset validator instead of `ajv`; one browser smoke fixture; working branch `feature/yeti-phase-0`; tooling uses only `node:` modules and web APIs "so the runtime can be swapped later"; scripts in `bin/` with shared modules in `bin/lib/`; old docs not migrated.
- **Sequence** (B:P0D:36-48). [read] Nine steps, split between "Joe" (manual GitHub and npm actions) and "Claude" (file changes on the branch). `yeti-css` is "registered on npm at step 7 as an empty placeholder version `0.0.0`", with "its first real publish at `7.0.0-beta.0`" (48).
- **Removed tree** (B:P0D:54-66). [read] The long list of Foundation 6 files, kept on `v6` and in history. Open item: the LICENSE copyright line is Joe's call.
- **Skeleton and `package.json`** (B:P0D:70-146). [read] `"license": "MIT"` (116), `"engines": { "node": ">=22" }` (120), `exports` for `.`, `./css/*`, `./js/*`, and `./manifest` (123-128), `"files": ["dist", "LICENSE", "README.md"]` (121), and "No `main`. The package is CSS" (146).
- **Manifest schema** (B:P0D:154-191). [read] Draft 2020-12 subset; `$id` `https://foundationcss.com/yeti/schema/manifest.json`; `name` equals folder name and `class`; `a11y` carries `role`, `requiredAttributes`, `keyboard`, `notes`; `js` is `{ module, optional: true }` or null with "`optional` is always true in 7.0"; `additionalProperties` is false everywhere, "which is what stops the manifest drifting from the schema".
- **Tools** (B:P0D:193-226). [read] `validate.js` in five ordered checks (schema, merge, examples, spacing lint, layer check); `build.js` concatenates, copies `src/` to `dist/css/`, copies JS to `dist/js/`, and writes `dist/yeti.manifest.json` with a wrapper (`framework`, `version`, `generated`, `components`); `gen-docs.js` writes `docs/<name>.md` and deletes orphaned generated files; `release.js` is a skeleton, "Completed in phase 5".
- **Tests and CI** (B:P0D:230-258). [read] Tooling tests per module; one smoke spec asserting the first rule of `yeti.css` is a `CSSLayerStatementRule` naming the five layers; an axe pass; two CI jobs (tools, browser) with no matrix.
- **Written artifacts** (B:P0D:262-282). [read] README, a pinned announcement issue ("where to follow progress"), a v6.9.0 release note, issue templates, and CONTRIBUTING. Contributing states a "no-build promise" and a "manifest-first rule".
- **Out of scope** (B:P0D:296). [read] Tokens, reset, base (phase 1); the `foundation-sites` npm deprecation notice ("at 7.0.0"); the `@foundation` scope; the LICENSE line; downstream naming; the foundationcss.com ingestion beyond matching front matter.

## The phase 0 plan (P0P)

An implementation plan for agentic workers, 14 tasks (B:P0P:1-2665). It adds no direction beyond P0D; it is the step-by-step build of it.

- **Header** (B:P0P:1-27). [read] Goal, architecture, and stack as in P0D. Constraints: commit each task on `feature/yeti-phase-0` but "Never push, merge, tag, or publish"; the dev dependencies are exactly the three; package `yeti-css` at `7.0.0-alpha.0`, "license MIT"; "No CSS other than `src/layers.css` and `src/yeti.css` is written in this phase"; fixtures use fictional names "naming is decided in phase 2" (25).
- **Tasks** (B:P0P:59-2639). [read] 1 cleared tree; 2 package and skeleton; 3 schema-subset validator; 4 manifest schema and loader; 5 HTML helpers; 6 `@import` resolution; 7 the validator; 8 the build; 9 front matter and docs generation; 10 release skeleton; 11 browser smoke test; 12 CI; 13 written artifacts; 14 final verification (65 tooling tests and 6 browser tests expected, B:P0P:2646).
- **The announcement draft** (B:P0P:2584-2613). [read] Its text matches the live announcement (foundation/yeti#15554, opened 2026-09-12 by joeworkman) except that the live body adds a **Licensing** paragraph. Both say: "The architecture and every phase spec live in this repository under `docs/superpowers/`. Progress is tracked in milestones" (B:P0P:2610). Both say `yeti-css` ships on npm "when it reaches beta, versioned 7.0.0" (2605) and that `develop` "is unstable until the beta. Do not build on it yet" (2603).
- **README draft** (B:P0P:2394-2446). [read] Status: "`7.0.0-alpha`. Nothing here is stable yet ... Follow the announcement issue for milestones" (2402). Lists MCP among what Yeti is: "Legible to agents ... an MCP server" (2417).
- **CONTRIBUTING draft** (B:P0P:2451-2490). [read] "No build step, ever", "No new dependencies", "Manifest first", "Spacing belongs to layouts", and "Baseline 2025 is the floor".
- **Final step** (B:P0P:2663-2665). [read] Hands back to a human to merge, publish the announcement, and rename.

## The CSS reset survey (RESET)

Input to phase 1's reset; nine resets compared (B:RESET:1-81).

- [read] Surveyed: Andy Bell, Josh Comeau, Elly Loel, Kevin Powell, Chris Coyier's starter, Open Props normalize, Tailwind Preflight v4, sanitize.css v13, modern-normalize v3 (B:RESET:9-19). Confidence is stated: six read from source, two from fetch summaries, one excluded (5).
- [read] A rule-by-rule consensus table (B:RESET:27-51).
- [read] Judgments (B:RESET:55-64): adopt `field-sizing: content` on textarea behind `@supports`; adopt `interpolate-size` behind `@supports` and reduced motion; adopt `color-scheme: light dark`; adopt the `dialog` margin exemption; adopt `ul[role='list']` scoping; reject a blanket fluid line-height, `overflow-x: hidden`, `#root` isolation, theme-aware normalize; skip the `nav li::before` zero-width space unless re-verified.
- [read] Contested rules (B:RESET:68-71): body line-height near 1.5 derived from the scale; `text-size-adjust: none`; only a reduced-motion-guarded smooth scroll; a broad margin reset with a dialog exemption "fits our model" given spacing ownership.
- [read] The line between reset and base (B:RESET:75-81): reset undoes surprising user-agent defaults; base imposes design decisions. "The reset should be swappable without touching the framework's visual identity" (81).

## The inspiration notes (INSP)

Joe's bookmarks and thoughts, summarised (B:INSP:1-57).

- [read] Two licensed reference archives (Every Layout, Complete CSS) are held outside the repo; "every line of prose and CSS that ships in Yeti is written from scratch" (B:INSP:8-13).
- [read] Three decisions: layout names are Yeti's own, decided per primitive in phase 2 with the reason in the manifest description (17); oklch stays, mitigated by hex comments and a short theming explainer (18); the reset is researched (19).
- [read] Graffiti UI: take a **public token contract** (flag each token public or internal in the manifest, so docs and the MCP server "only advertise what is safe to override") and sensible bare-element styling "as a promise in the docs" (B:INSP:28-29).
- [read] Coyier's starter: a rule list for reset and base, and the idea that "reset removes hazards; base adds defaults", kept in separate sublayers (B:INSP:36-46).
- [read] a11ymyths.com: automated tools find a fraction, so "our axe pass in CI is a floor, not a pass mark"; semantic HTML first; the per-component `a11y` manifest block is the mechanism; "Overlays do not fix anything". A "Docs deliverable for phase 5: an accessibility guide" (B:INSP:51-57).

## Phases and future plans

[read] The phase table is B:ARCH:270-278; the prose is B:ARCH:268-280.

| Phase | Planned deliverable | Exit criterion |
| --- | --- | --- |
| 0 | Repo transition, skeleton, layers file, manifest schema, `build.js`, `validate.js`, `gen-docs.js` stub, CI | CI green on an empty framework; `v6` exists; announcement published |
| 1 | Tokens, reset from the survey, base typography and spacing, bare HTML coherent | Scale recomputes from `--ratio`; light and dark from one token set; every reset rule has a recorded reason |
| 2 | Layout primitives covering the Every Layout set (stack, cluster, sidebar, switcher, cover, grid, reel, frame, imposter, box, center), each renamed, then recipes (page shell, media object, masonry, split hero, sticky footer, container, card recipe) | Manifests, fixtures, generated docs; "every layout is zero-media-query" |
| 3 | Buttons and groups, cards, forms, tables, badges | Same, plus container-query behaviour on card and media object |
| 4 | Nav bar, mobile menu, breadcrumbs, pagination, accordion, tabs, dropdown, modal, tooltip, alerts, progress, scroll-snap carousel | "JS budget (§8) spent and no more; menu variations shipped as recipes, not components" |
| 5 | Guides (responsive mental model, migrating from 6, theming), `gen-types.js`, screenshot tests, API freeze | `7.0.0-beta.0`; "API declared stable" |
| 6 | MCP server, a "one-time token generator in a separate directory", `7.0.0` | "Downstream Stacks and theme work may begin" |

What the documents say about the areas the ticket asks about, all [read]:

- **JavaScript modules.** Two modules budgeted for 7.0 (`tabs.js`, `dialog.js`), everything else CSS-only, no bundle, no global, no init call, optional, tested with and without (B:ARCH:184-188, 252). Nothing in the five files plans a validation, carousel, range, toc, alert, hover, demo, or enter module.
- **Manifest.** Per-component JSON merged at build, checked in CI, the source for docs, types, and a phase 6 MCP server (B:ARCH:204-244).
- **Tokens.** One scale, fluid by default, `light-dark()`, oklch, `@property`, public and internal flags (B:ARCH:122-168; B:INSP:28-29). No theme files, starter page, or `yeti.theme` layer are planned.
- **Frozen surface.** Not defined as a list. The documents give a rule: "Semantic versioning is strict: any change to a class name, attribute name, enumerated value, required child structure, or token name is a major" (B:ARCH:264), and a freeze at phase 5 that yields `7.0.0-beta.0` (B:ARCH:260, 277). There is no `frozen.js`, no vocabulary file, and no module-name or event-name freeze in them.
- **Beta and npm.** `7.0.0-alpha.N` through phase 4; beta from the phase 5 freeze; `yeti-css` placeholder `0.0.0` at the rename, first real publish at `7.0.0-beta.0`, `7.0.0` after phase 6 (B:P0D:48; B:ARCH:260-263).
- **Milestones.** The documents contain no milestone names, dates, or numbers. The only words are "Progress is tracked in milestones" in the announcement text (B:P0P:2610) and "Follow the announcement issue for milestones" in the README draft (B:P0P:2402).
- **Not planned at all** [inferred from absence in the five files]: an Angular, framework, or web-component wrapper; component-level theming files; a `yeti.js` bundle; an `esbuild` or Lightning CSS custom-build guide beyond "documented as a user-side option" (B:ARCH:30, 285).

## Where the code at the pin differs from the plan

[read] at `P`, to show how far the documents have been overtaken (this is the code, not the documents):

- `package.json` licence is `FSL-1.1-MIT` and Node is `>=24` (`P:package.json`); `LICENSE` is the FSL text, adopted in `7f57ade17` (2026-09-12, the same day). The plan said MIT (B:P0D:116) and Node 22 (B:P0D:120).
- `src/layers.css` declares six sublayers including `yeti.theme` (`P:src/layers.css:7`), against five in the plan (B:ARCH:109).
- There are 10 module files, not 2 (`P:src/**`: alert, carousel, demo, dialog, hover, range, validate, tabs, toc, enter), and `package.json` exports `./yeti.js`, a bundle of all of them (`P:package.json`; `P:bin/build.js:129`). The plan said "No bundle" (B:ARCH:185).
- There are 49 manifests, a manifest `markers` list and an `example` field (`P:schema/manifest.schema.json`), `js` is an array of modules per item (`P:schema/manifest.schema.json:40-45`), and `bin/frozen.js`, `bin/gen-llms.js`, `bin/gen-ide.js`, themes, and a starter exist.
- `README.md` says "Yeti is at `7.0.0-beta`" and `src/guides/stability.md` says "From `7.0.0-beta.0`, the surface a page depends on is frozen" (`P:README.md:9`; `P:src/guides/stability.md:11`), while `package.json` says `7.0.0-alpha.0`. No `bin/mcp` or MCP file exists at `P` (`git ls-tree`: no match), though the README still says an MCP server is generated (`P:README.md:24`).

## Map decisions: contradicts, sharpens, or confirms

| Point in the documents | Map decision | Effect | Tag |
| --- | --- | --- | --- |
| Announcement: `develop` is "unstable until the beta. Do not build on it yet" (B:P0P:2603) | Standing ruling on readiness; [ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ticket 12 | Confirms the premise the pin is chosen against | read |
| Baseline 2025 floor, no polyfills (B:ARCH:28, 192-202) | [ADR 0002](../adr/0002-browser-target-baseline-2025.md); ticket 06 | Confirms. The documents also name features used behind `@supports` (anchor positioning, `@scope`, `field-sizing`), a list the specs can check against | read |
| `yeti.reset, base, layouts, components, utilities`, "Nothing is unlayered", users add layers after `yeti` (B:ARCH:106-118) | ADR 0060, ADR 0080 (`ngx-yeti` layer after `yeti`); ticket 23 | Confirms the "after `yeti`" convention for consumer layers. Contradicted in detail by the pin's six sublayers (`yeti.theme`) | read |
| Source CSS uses native `@import`, so `src/` loads unbuilt (B:ARCH:102); `dist/css/` copies `src/` verbatim (B:P0D:209) | ADR 0060 (one counted `<link>` per item file of the consumer's build) | Sharpens: the documents promise the per-item file tree that ADR 0060 depends on. They give no promise about the `?v=` path or `dist/` layout beyond `exports` (B:P0D:123-128) | read |
| "Concatenate only", no minifier; Lightning CSS "documented as a user-side option, never a repo dependency" (B:ARCH:30, 285) | Standing ruling on building Yeti (esbuild locally); ADR 0006; ticket 22 | Sharpens: the original intent was no build for the consumer. The pin's guides recommend esbuild for a custom build; the documents never mention it | read |
| `exports` map with `./css/*`, `./js/*`, `./manifest`; "No `main`" (B:P0D:121-146) | ADR 0006; ticket 21 (git dependency without `dist/`) | Confirms that `dist/` is the publish unit and the package is built, not source-shipped; consistent with prototype 21's finding | read |
| npm: `yeti-css`, "No dependencies, no scripts", placeholder `0.0.0`, first publish at `7.0.0-beta.0` (B:ARCH:32; B:P0D:48) | ADR 0006 (pin moves on "a beta tag or npm release"); ADR 0017 | Sharpens: the only stated trigger for an npm release is the beta (phase 5). "No scripts" matches why a git dependency installs without `dist/` (ticket 21). No release date exists | read |
| `7.0.0-alpha.N` phases 1-4; beta from phase 5 freeze; `7.0.0` after phase 6 (B:ARCH:260) | ADR 0017; ADR 0006; ticket 12 | Sharpens: it gives the order of Yeti's own milestones the map's pin policy refers to. Contradicted by the pin, which already calls itself `7.0.0-beta` in prose (`P:README.md:9`) | read |
| Frozen surface = class, attribute, enumerated value, required child structure, token name; "strict" semver (B:ARCH:264) | Frozen-surface language in ADR 0005, ADR 0006; ticket 12's gate `bin/frozen.js` | Sharpens: the documents define the principle only; the actual list is `stability.md` at the pin, which also freezes markers, module names, event names, schemas, and `exports`. Documents are narrower than the map's reading | read |
| Naming: class identity, `data-*` configuration, native or ARIA state, "short shared vocabulary", "Boolean options are bare attributes" (B:ARCH:172-178) | ADR 0003; ADR 0005; ADR 0070 (tickets 26) | Confirms. The shared vocabulary is the origin of the closed-union types | read |
| Follow-up: removing the `data-` prefix when typed `attr()` reaches Safari (B:ARCH:180, 284) | ADR 0070 (the `data-*` mapping rule); ticket 26 | Sharpens: a possible future rename of every attribute. [inferred] ADR 0070's mapping would need a migration if it happens; `typed attr()` is listed as not used in 7.0 (B:ARCH:200) | read, inferred |
| JavaScript policy: two modules (`tabs`, `dialog`), none global, no init call, safe on pages with none present (B:ARCH:184-188) | [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); ticket 03; ticket 09 | Contradicts the pin (10 modules, `yeti.js` bundle). Confirms the principle ADR 0040 relies on: modules are optional, so replacing all of them is within Yeti's own contract | read |
| `dialog.js`: "open triggers via `data-open`, focus return, optional close-on-backdrop" (B:ARCH:186) | ADR 0021 (dialog is a directive on the native `<dialog>`); ADR 0016 | Sharpens: the original design wanted focus return and backdrop close as the JavaScript's whole job, matching what ADR 0016 and 0021 implement | read |
| Tabs: "roving tabindex, arrow-key navigation, ARIA state" (B:ARCH:186) | Ticket 29 and 30 (Aria Tabs); building-blocks `tabs` row | Confirms the module's scope is what Angular Aria's tabs would replace | read |
| Positioning needs no JavaScript; anchor positioning inside `@supports`, centred top-layer fallback "is acceptable" (B:ARCH:187, 198) | Building-blocks "Anchored pane" row; ticket 09 (guarded anchor positioning) | Confirms | read |
| `a11y` manifest block is "the mechanism" for accessibility; axe in CI is "a floor, not a pass mark"; keyboard and screen-reader checks stay in tests (B:INSP:51-55) | ADR 0015 (WCAG 2.2 AA enforcement); ticket 17; ledger | Confirms and sharpens: Yeti itself says its axe pass is a floor, which supports the map's ledger of gaps the package closes. Nothing in the documents mentions `forced-colors` | read |
| "Overlays do not fix anything" (B:INSP:55) | Ledger rows on overlays | Confirms the stance; no ledger change implied | read |
| Public and internal token flag; internal tokens "may change between minor versions" (B:ARCH:160; B:INSP:29) | ADR 0004 (tokens are a consumer stylesheet surface); ADR 0005 | Confirms that only public tokens are an API. [inferred] a spec naming a token should name only public ones | read, inferred |
| Spacing belongs to layouts; components never set their own outer margin (B:ARCH:168) | ADR 0003 (directives set class and attributes); ADR 0004 | Sharpens: no directive may add margin to its host; a spec need not manage outer spacing | read |
| Phase 4 lists `tooltip`, `alerts`, `progress`, `pagination`; phase 3 `badges`, `tables`; phase 2 recipes incl. `masonry`, `sticky footer` (B:ARCH:274-276) | Spec list, ticket 11 (49 items, 17 layouts, 3 recipes, 22 components, 7 utilities) | [inferred] the final 49 items are more than these phases list; the plan names no item absent from Yeti's later manifest, but 16 items are new compared with the old map. Not verified item by item | inferred |
| Phase 6 MCP server; `gen-types.js` in phase 5 (B:ARCH:244, 277-278) | Ticket 14 (the README's MCP server does not exist); [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md) (generated `yeti.d.ts` copy) | Confirms that the MCP server was never in the first phases; at `P` `yeti.d.ts` exists and MCP does not. Both are planned phase 5 and 6 items | read |
| Screenshot regression deferred to the phase 5 freeze (B:ARCH:254) | ADR 0014 (testing stack); ticket 27 | Confirms the package should not rely on Yeti screenshots before beta | read |
| Docs generated from the manifest, committed to `docs/`; "Open item" on live examples (B:ARCH:238-240) | Sources and the `llms.txt` research (ticket 14) | Confirms the map's use of generated docs as a source; the open item is not resolved in the documents | read |
| "Not a web component library" (B:ARCH:301); no Angular or framework plan anywhere | Destination (Angular package wrapping Yeti) | [inferred] Neither confirms nor contradicts; Yeti plans no wrapper, so the package carries its own naming and releases. The stated Yeti non-goal is about web components, not Angular | inferred |
| Licence: plan says MIT (B:P0D:116); live announcement says FSL-1.1-MIT converting to MIT after two years (announcement body) | [ADR 0001](../adr/0001-yeti-licence-compatible-with-mit-package.md) | The documents contradict the live licence. [inferred] ADR 0001's premise should rest on `LICENSE` at the pin and the announcement, not the plan. The user's ruling stands | read, inferred |
| "Progress is tracked in milestones" (B:P0P:2610); no milestone defined (all five files) | Map notes on readiness; ticket 12 | See the next section: the milestones do not exist, so pin moves cannot depend on them | read |
| `v6.9.0` is the "final planned" 6.x feature release; `v6` maintained (B:ARCH:44; B:P0D:39-40) | Out of scope: Foundation 6.9 | Confirms the scope line | read |

## Do the documents or milestones exist anywhere public?

Findings of 2026-10-03:

- [read] **GitHub `develop`:** no path containing `superpowers` (GitHub tree API, recursive, 0 matches). `https://github.com/foundation/yeti/blob/develop/docs/superpowers` returns 404.
- [read] **Other branches and tags:** the clone's `git log --all` finds no commit after `fa61d90d2` that restores them. `v6` and `master` hold Foundation 6 docs; the `docs/` listing of `develop` is the generated per-item pages.
- [read] **The pin's `.gitignore`** lists `docs/superpowers/` and `.superpowers/` (`P:.gitignore:7-8`), plus three more entries added in `d0edc5f37`.
- [read] **Milestones:** `repos/foundation/yeti/milestones?state=all` returns 30; `?state=open` returns 0. [inferred from the user's note and the orchestrator's earlier check] all 30 are Foundation 6 milestones last updated in 2021; I did not re-read each one.
- [read] **Discussions:** `hasDiscussionsEnabled` is `false` and `discussions { totalCount }` is 0 (GraphQL, 2026-10-03). The announcement and README drafts say "Questions go in Discussions"; the feature is off.
- [read] **Announcement comments:** `issues/15554/comments` returns none. The issue is open and was created 2026-09-12 22:28 UTC (the plan's commit was 11:54 PDT the same day).
- [read] **Docs site:** `https://www.foundationcss.com/yeti/` returns 200; `/yeti/superpowers/` and `/yeti/roadmap/` return 404; `/yeti/llms.txt` has no match for "superpowers", "roadmap", "phase 0", or "milestone".
- [read] **GitHub code search:** `repo:foundation/yeti superpowers` returned a total count of 0.
- [inferred] The five documents and any phase specs after phase 0 live only on the maintainer's machine. The planning files were committed once, and 32 minutes later removed and ignored, so the announcement's pointer was already stale on the day it was written (its text was drafted in P0P and published the same day as `fa61d90d2`). No later phase spec (the documents promise one per phase) is anywhere public.
- [inferred] `PRODUCT.md`, `.impeccable/`, and `DESIGN.md` (ignored since `d0edc5f37`) are the same kind of local planning file; I did not look for them anywhere.

## What the map may want to note (not decided here)

- [inferred] Yeti's public roadmap is the stability page and the guides at the pin, not the removed documents. Of the questions in the ticket, the documents answer "which phases come after 0" (1 to 6, above) and "beta and npm release" (phase 5 and `7.0.0-beta.0`), and say nothing about milestones, dates, or the later modules.
- [inferred] The pin's own prose already claims beta while `package.json` says alpha; whichever Yeti tag appears first is the first event ADR 0006's pin policy can react to.
