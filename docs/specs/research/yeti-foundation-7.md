> Copied on 2026-10-01 from `.scratch/next-foundation-specs/research/yeti-foundation-7.md` (commit `4e02060`), the findings of the old map's Research: Yeti, Foundation's version 7 (ticket 194, `research-yeti-foundation-7`), by [Task: carry the old map's Yeti findings into this bundle](../issues/05-task-carry-yeti-findings-from-old-map.md). The text is unchanged except that its relative links point back into the old bundle. Later research in this bundle supersedes it where they differ: the browser scan of ticket 01, the inventory of ticket 02, and the JavaScript and styles research of tickets 03 and 04.

# Yeti, Foundation's version 7: what it is and what wrapping it would change

Ticket: Research: Yeti, Foundation's version 7 (old map ticket 194, `research-yeti-foundation-7`). Model: Fable 5.1, high effort. Resolved 2026-10-01.

This file decides nothing. It reports what Yeti is on 2026-10-01, how far its platform floor sits above the map's browser target, which Foundation 6.9 families it keeps, drops, or replaces, how it is styled without Sass, how much of it is JavaScript, and which of this effort's records would change if the destination wrapped Yeti instead of Foundation for Sites 6.9. Whether to change the destination is the user's call.

Sources and path prefixes:

- `YETI/` = `github.com/foundation/yeti`, the orchestrator's clone of `foundation/yeti` on `develop` at `f52d1e8b9` (committed 2026-09-25, read 2026-10-01). The repository's `docs/` is generated from `src/` (`YETI/.github/workflows/ci.yml:22-31`); this file cites the generated `docs/guides/*.md` where the docs site shows the same page, and `src/` for CSS, JavaScript, manifests, and tools.
- `FDN/` = `github.com/foundation/foundation-sites`, Foundation for Sites 6.9.0 at `337be7a8d`. Its `origin/develop` is the same `f52d1e8b9`; the local branch was never moved. A throwaway worktree of `origin/develop` under `D:/tmp/yeti-develop` was used for the first reads and removed afterwards (`git worktree list` shows only the clone).
- Upstream metadata read with `gh` on 2026-10-01: issue [#15554](https://github.com/foundation/yeti/issues/15554), `gh repo view foundation/foundation-sites` (redirects to `foundation/yeti`), branches, tags, releases, milestones, pull requests.
- Docs site, fetched 2026-10-01: https://www.foundationcss.com/yeti/ (markdown.new), https://www.foundationcss.com/yeti/guides/migrating/ and https://www.foundationcss.com/yeti/guides/stability/ (markdown.new; the migration table was also read through WebFetch because markdown.new cut the page short), https://www.foundationcss.com/yeti/guides/install/ (WebFetch; markdown.new returned no content twice). Every page matched the clone's `docs/guides/<name>.md` text where compared (the migration guide's lede, all 38 component rows, the six "What Yeti does instead" headings, and the five habits; the install guide's "not released" sentence and its four always-kept groups).
- Baseline data: `web-features` 3.40.1, installed under `D:/tmp/web-features` and queried with `D:/tmp/web-features/lookup.mjs` (not committed). "Target" below means the map's browser decision: Baseline widely available on 2026-05-07, and the core table Chrome, Edge, Firefox 119 and Safari 17 (map, Notes). A feature is IN the target when its `baseline_high_date` is on or before 2026-05-07; the core table check is whether every core browser's first supporting version is at or below the table's version.
- npm registry read with `npm view` on 2026-10-01.
- Spec, ADR, and map paths are relative to the effort directory (`.scratch/next-foundation-specs/`).

"Measured" marks a count or a lookup made from the sources above. "Inferred" marks a reading of source or docs that was not run in a browser; no Yeti page was rendered for this ticket.

## 1. Findings in brief

1. **Yeti is a rewrite, not a Foundation 7.** The repository `foundation-sites` was renamed `foundation/yeti`; its `develop` branch was cleared on 2026-09-12 (`YETI` commit `a994b2e29`, "chore: clear the Foundation 6 tree for Yeti") and refilled with 473 commits by one author over 13 days, the last on 2026-09-25 (section 2). The migration guide's first sentence: "Yeti is not Foundation 7 in the sense of being version 6 with new names" (`YETI/docs/guides/migrating.md:12`).
2. **There is nothing to wrap yet.** No `v7*` tag among 175 tags, no release after v6.9.0 (2024-09-27), no npm package (`npm view yeti-css` returns 404; `foundation-sites` is at 6.9.0, last modified 2024-09-27), `package.json` says `7.0.0-alpha.0` while the README says `7.0.0-beta`, and the install guide says "Yeti is not released yet. There is no package on npm and nothing to download" (`YETI/docs/guides/install.md:41`). The announcement says "The `develop` branch is now Yeti 7 and is unstable until the beta. Do not build on it yet." (#15554). The licence is FSL-1.1-MIT (section 2.4).
3. **Yeti's floor is two platform years above the map's target.** Yeti targets "Baseline 2025" and uses anything Baseline by end of 2025 without a guard (`YETI/README.md:32`). Measured against web-features 3.40.1, 20 features Yeti uses without a guard are outside the target, and five more are guarded. The unguarded ones include the four that carry its components: `popover` (dropdown, nav), invoker commands `commandfor`/`command` (the only way the dialog opens), `light-dark()` (every colour token), and `pow()` (the whole type and space scale); and `:has()`, `lh`, `:dir()`, and unprefixed `mask-image` miss the core table in Firefox 119 or Chrome 119 by one or two versions (section 3). Yeti does not use container style queries or native nesting (measured: 0 `style(` queries, 0 style rules nested in style rules).
4. **Coverage: about half of the bundle's families have a Yeti counterpart.** Of the 21 Foundation plugins, 9 have a counterpart (Accordion, Dropdown, DropdownMenu as one level, Orbit, Reveal, Slider, Sticky, Tabs, Tooltip), 3 are partial (OffCanvas as the nav's drawer, ResponsiveToggle as the nav's own toggle, Magellan's scroll-spy as `toc.js`), and 9 are dropped (Abide, AccordionMenu, Drilldown, Equalizer, Interchange, ResponsiveAccordionTabs, ResponsiveMenu, SmoothScroll, Toggler). Every CSS-only component has a counterpart, often merged (Label and Badge, Callout split into `alert` and `box`); the XY Grid, Prototyping Utilities, Flexbox Utilities, Visibility Classes, Float Classes, and Typography Helpers have no class-for-class counterpart and are replaced by 17 layout primitives and 7 utilities, with margin helpers and the 12-column grid dropped on purpose (section 4).
5. **JavaScript is a tenth of the source and optional everywhere.** 10 files, 760 lines (304 of them comments), 37.7 KB, against 69 CSS files, 5,276 lines, 265.6 KB (measured). Only tabs needs its module to work at all; the rest add a close button, hover opening, a backdrop click, a filled range track, validation messages, scroll-spy, and docs frames (section 5).
6. **The styling model is the one this effort ruled out.** 297 public `--yeti-*` tokens recomputed at runtime, two example themes that are token values on `:root`, six fixed cascade layers, a manifest and a token catalogue with JSON schemas, and no Sass anywhere (section 6). The map's Out of scope lists "Runtime theming through custom properties as a component contract" (old map `map.md`, Out of scope). Wrapping Yeti means adopting it.
7. **For the lazy family styles question, Yeti removes the hard half and keeps the Angular half.** Every component file is identical for every consumer (settings are runtime tokens), is wrapped in its own `@layer yeti.<kind>` block, and depends on nothing but the always-loaded group (layers, tokens, base, `attributes.css`: 99 KB of the 266 KB source, measured). So a directive can ship or link its family's CSS with the public toolchain and no Sass plugin, which is what old map `research/style-loading-consult.md` proposal A needed an unsupported extension point for. The `SharedStylesHost` count, the leave-animation leak, hydration, and Beasties stay exactly as old map `research/lazy-style-loading.md` measured them (section 7).
8. **Wrapping Yeti would supersede ADR 0012, ADR 0005, and most of ADR 0040, redraw ADR 0039's three class kinds, retarget the browser decision or accept fallbacks for Yeti's four carrying features, and re-run every spec**, because each spec's CSS class mapping, Sass subsection, inputs, and State host bindings describe Foundation 6.9 classes (section 8).

## 2. Point 1 and point 6: status, timeline, licence, publishing, and what is locked

### 2.1 Version and release state

| Fact | Value | Source |
| --- | --- | --- |
| Package name | `yeti-css` | `YETI/package.json:2` |
| Version in `package.json` | `7.0.0-alpha.0` | `YETI/package.json:3` |
| Version in the README | "Yeti is at `7.0.0-beta`" | `YETI/README.md:9` |
| Version in the stability guide | "From `7.0.0-beta.0`, the surface a page depends on is frozen" | `YETI/docs/guides/stability.md:12` |
| `since` in every manifest | `7.0.0` (49 of 49) | `YETI/src/*/*/manifest.json`, measured |
| Tags | 175, none starting `v7`; newest `v6.9.0` | `git tag` in `YETI`; `gh api .../tags` |
| GitHub releases | latest `v6.9.0`, published 2024-09-27 | `gh repo view` `latestRelease` |
| npm | `yeti-css`: 404. `foundation-sites`: `latest` 6.9.0, `time.modified` 2024-09-27 | `npm view`, 2026-10-01 |
| Docs site | "Yeti is not released yet, so there is nothing to install" | https://www.foundationcss.com/yeti/ Quick Start; `YETI/docs/guides/install.md:41` |
| Default branch | `develop`; branches `develop`, `master`, `v5`, `v6`, two dependabot | `gh repo view`, `gh api .../branches` |
| Last push | 2026-09-25T18:02:46Z | `gh repo view` `pushedAt` |
| Node | `>=24` | `YETI/package.json:9-11`, `.nvmrc` |

The three version statements disagree: the package is stamped alpha, the README and homepage say beta ("**Beta** — class names, attributes, values and public tokens are frozen", https://www.foundationcss.com/yeti/), and the stability guide dates the freeze "from `7.0.0-beta.0`", a tag that does not exist. `bin/frozen.js`'s usage comment names `v7.0.0-beta.0` as the ref to compare against (`YETI/bin/frozen.js:10`), so the freeze is a stated policy, enforced against `develop` by script, not a tagged point.

### 2.2 Timeline and cadence (measured on `v6.9.0..origin/develop`)

- 473 commits, all by one author (Joe Workman), between 2026-09-12 11:10 and 2026-09-25 11:02 (-07:00), on 13 calendar days: 76, 24, 38, 49, 23, 6, 23, 24, 64, 32, 89, 24 commits per active day, with 2026-09-19 and 2026-09-20 empty. The one earlier commit on the range is the 2024-09-27 merge of the v6.9.0 tag. No commit since 2026-09-25 as of the clone's fetch on 2026-10-01 (the repository's `pushedAt` agrees).
- Phase 0 landed as PR #15553, "Yeti phase 0: repo transition and tooling skeleton", merged 2026-09-12. Since then there is no pull request: every later change is a direct commit on `develop`. The nine other pull requests on the repository are Foundation 6 contributions from 2025 and 2026, still open or closed.
- Announcement issue #15554 (2026-09-12, pinned, no comments) says: the repository will be renamed (done: `gh` resolves `foundation/foundation-sites` to `foundation/yeti`); Foundation 6 "lives on the `v6` branch and keeps getting bug fixes", "`foundation-sites` npm package continues to publish 6.x from that branch", "v6.9.0 is the final planned feature release"; "Yeti ships as `yeti-css` on npm when it reaches beta, versioned 7.0.0"; "The architecture and every phase spec live in this repository under `docs/superpowers/`. Progress is tracked in milestones." Measured: `docs/superpowers/` exists in no commit reachable from any ref (`git log --all -- docs/superpowers` is empty), all 46 milestones are closed and predate Yeti, and GitHub Discussions has zero threads. The planning documents the issue points to are not in the repository.
- The `v6` branch has two commits since `v6.9.0`: the tag merge, and a 2026-09-12 dependency pin (`0b20a7936`, "build(deps): pin shelljs >=0.8.5"). No 6.x release or npm publish has followed it. 64 issues are open on the repository; two were opened in September 2026, the announcement and a spacing-token question.

### 2.3 Release process (read from source; nothing has run it)

- Git-flow: "Work happens on `feature/*` branches cut from `develop` and merged back by pull request. Releases go through `release/*` to `master` and are tagged `v7.x.y`. Foundation for Sites 6 maintenance happens on `v6`." (`YETI/CONTRIBUTING.md:75-77`.) Measured: `master` still points at the v6.9.0 release merge.
- `bin/release.js` refuses to run outside a `release/*` branch or on a dirty tree, runs `validate`, `test:tools`, and `test:browser` first with no skip flag, stamps `package.json`, builds `dist/`, regenerates `docs/`, zips `dist/`, and "never commits, tags, or publishes; those stay manual git-flow steps so a human reviews the diff first" (`YETI/bin/release.js:2-5`, `:23-39`, `:97`). There is no publish workflow: `.github/workflows/ci.yml` is the only workflow and runs validate, tools tests, build, a docs-regeneration diff, and Playwright in three engines with screenshot comparison off (`YETI/.github/workflows/ci.yml:9-50`).
- What a release will ship: `dist/` with `yeti.css`, `yeti.min.css`, the unbundled source under `css/`, the modules under `js/` and in one `yeti.js` with `yeti.min.js`, two themes under `themes/`, the starter under `starter/`, and the machine-readable files (`YETI/docs/guides/install.md:43`); `bin/build.js` writes exactly that (`YETI/bin/build.js:86-163`). Until then: "clone the repository and run `npm run build`" (`install.md:45`).

### 2.4 Licence

- `YETI/LICENSE:1-7`: "Functional Source License, Version 1.1, MIT Future License", "Copyright 2026 Aspect Services, LLC". `package.json` `license` is `FSL-1.1-MIT` (`:5`).
- A Permitted Purpose is "any purpose other than a Competing Use", which "means making the Software available to others in a commercial product or service that: 1. substitutes for the Software; 2. substitutes for any other product or service we offer using the Software ...; or 3. offers the same or substantially similar functionality as the Software." Permitted Purposes include internal use, non-commercial education and research, and professional services (`YETI/LICENSE:32-50`). Redistribution must carry the terms and copyright notices (`:63-70`). "We hereby irrevocably grant you an additional license to use the Software under the MIT license that is effective on the second anniversary of the date we make the Software available" (`:84-87`).
- README and #15554 restate it: "use it freely in your own sites and products, modify it, redistribute it; the one thing it reserves is offering Yeti itself as a competing product. Every release converts to plain MIT two years after it ships. Foundation for Sites 6 stays MIT." (#15554; `YETI/README.md:62`.)
- What this means for an MIT-licensed Angular wrapper is a legal question this file does not answer. Two readings are both plausible from the text: a wrapper that depends on `yeti-css` as a peer, as the bundle depends on `foundation-sites` today (old map ADR 0012 (`sass-packaging`)), ships none of Yeti and so redistributes nothing; a wrapper that copies Yeti's CSS into its own package redistributes it under the FSL terms, and whether "an Angular component library offering Yeti's components" is "substantially similar functionality" is for the user or counsel to judge. Foundation 6.9 is MIT (`FDN/LICENSE`), so the current destination has no such question. Inferred; `OPEN FOR HUMAN`.

### 2.5 What is locked at `7.0.0-beta` and what may change (point 6)

Frozen (`YETI/docs/guides/stability.md:14-23`): component class names ("the forty-nine names in the manifest"); attribute names and their value lists ("a value may be added, none will be removed or renamed"); vocabularies; marker names and values; public token names ("Their default values may still be tuned; their names and meanings will not change"); module file names (ten are listed: `alert.js`, `tabs.js`, `dialog.js`, `hover.js`, `carousel.js`, `demo.js`, `range.js`, `validate.js`, `toc.js`, `enter.js`) "and that each is optional"; event names and their `detail` keys; the manifest and token catalogue schemas and the package `exports` map.

Not frozen (`stability.md:25-31`): private `--_yeti-*` tokens; the default value of any public token; the internal layout of generated files (docs, `llms.txt`, editor data, the types file); fixtures, baselines, and `bin/`; "Browser support minimums, which track Baseline."

"What a breaking change would look like" (`stability.md:33-35`): renaming a class, removing an attribute value, changing what a value does, renaming a public token, or making a module required; "None of these happens before `7.0.0`. After `7.0.0`, any of them is a major version." The check is `node bin/frozen.js <ref>` (`stability.md:37-39`; `YETI/bin/frozen.js:20-45` reads every manifest, `schema/vocabulary.json`, and `src/tokens/tokens.json` at a ref and at HEAD and exits non-zero on any removal).

Effect of each possible change on a wrapper (inferred):

| May change | Effect on a wrapping library |
| --- | --- |
| Public token defaults | Visual changes under the wrapper's stories and screenshot tests with no API change; the wrapper's own custom CSS, if any reads a token, keeps working. |
| Private `--_yeti-*` tokens (449 distinct names, measured) | Any directive that reads or sets one (for example `--_yeti-gap`, which `attributes.css` writes from `data-gap`) breaks on a minor. A wrapper must bind the `data-*` attributes and never the private properties. |
| Additions of attribute values, attributes, events | Allowed in beta and in minors. A wrapper whose input types are generated from `yeti-css/manifest` has to regenerate per release; a hand-typed union goes stale silently in the permissive direction (a new value rejected until the wrapper updates). |
| Generated files' layout | `yeti.manifest.json` and `yeti.tokens.json` are schema-frozen; the `.d.ts`, `web-types`, and `html-data` files are not, so a wrapper generates from the two JSON files, not from the types file. |
| Browser minimums tracking Baseline | Yeti's floor moves each year ("Baseline 2025" today); the map's target moves only with the Angular major. The gap in section 3 widens over time rather than closing. |
| Module behaviour | Module names and events are frozen; what a module does is not listed as frozen. A wrapper that replaces the modules is insulated; one that loads them is not. |
| Everything before `7.0.0-beta.0` is actually tagged | The freeze is asserted on `develop` by `frozen.js`, with no tagged baseline; the alpha stamp and "Do not build on it yet" in #15554 both say the surface could still move. |

### 2.6 What migrating from 6.x means (point 6)

The migration guide's map (`YETI/docs/guides/migrating.md:18-88`, identical on the docs site) and its five habits (`:106-116`):

- "Attributes, not modifier classes": `.button.primary.large.hollow` becomes `class="button" data-variant="primary" data-size="lg" data-emphasis="medium"`; "a value outside the list is a validator error. Your own classes never collide with Yeti's, because Yeti only ever has one."
- "Native state, not `is-` classes": "There is no `.is-active`, `.is-open`, `.is-invalid-input`. An open accordion has the `open` attribute, the current page has `aria-current="page"`, an invalid field has `aria-invalid="true"`, a selected tab has `aria-selected="true"`."
- "A threshold, not a breakpoint": "There are no `small-`, `medium-`, `large-` prefixes and nothing at all that asks the window how wide an element is."
- "Nothing to initialise": "There is no `Foundation.init()`, no `data-` attributes for plugins, no jQuery. Eight components ship nine optional modules."
- "The browser does the opening and closing": "Dropdowns and the nav's menu are popovers; the dialog is a dialog; the accordion is `<details>`."

Section 4 maps the table onto the bundle's 51 specs.

## 3. Points 2 and 7: browser support against the map's target

### 3.1 Yeti's own statement

"Yeti targets **Baseline 2025**. Anything that reached Baseline by the end of 2025 is used without guards; newer features sit behind `@supports` with a working fallback." (`YETI/README.md:32`; `CONTRIBUTING.md:61`.) "Minified is not transpiled. `light-dark()`, `@starting-style`, container queries, `oklch()` and anchor positioning are left exactly as they are written, because Yeti's floor is Baseline 2025 and every browser at that floor already has them." (`YETI/docs/guides/install.md:73`.) Each manifest declares what its component uses under `support.unguarded` and `support.guarded` (`YETI/schema/manifest.schema.json:46-54`); the 49 declarations are aggregated below and cross-checked against the CSS.

The map's target admits a feature only if it was Baseline widely available on 2026-05-07, which means Baseline newly available by 2023-11-07 (web-features adds 30 months). Yeti's floor admits anything newly available by 2025-12-31. The two floors are about two years apart.

### 3.2 Features outside the target that Yeti uses with no guard

Measured with web-features 3.40.1. "Core" names the core-table browser whose listed version lacks the feature.

| Feature (web-features id) | Baseline | Newly available | Widely available | Core gap | Where Yeti uses it | Fallback in Yeti |
| --- | --- | --- | --- | --- | --- | --- |
| `popover` attribute, `popovertarget`, `:popover-open`, `showPopover()`/`hidePopover()` (`popover`) | low | 2025-01-27 | not yet | Firefox 125, Safari iOS 18.3 | dropdown panel, nav menu (`src/components/dropdown/dropdown.css`, `nav/nav.css`, `hover.js`; 69 CSS matches) | None. Inferred: without the attribute the panel renders in flow and the button does nothing. |
| Invoker commands `commandfor`/`command`, the `command` event (`invoker-commands`) | low | 2025-12-12 | not yet | Chrome 135, Firefox 144, Safari 26.2 | the only documented way to open the dialog (`dialog/example.html:1`; `dialog/docs.md:9`); `dialog.js:28-51` listens for `command` and never calls `showModal()` itself (measured: `showModal` appears only in a comment) | None. Inferred: in a browser without invoker commands the dialog cannot be opened by Yeti's markup or module. |
| `light-dark()` (`light-dark`) | low | 2024-05-13 | not yet | Chrome 123, Firefox 120, Safari 17.5 | every colour role token, 47 declarations, each written once (`src/tokens/color.css:47-57` and on) | None. Inferred: the tokens are invalid at computed-value time, so every colour that reads them falls back to inherited or initial values. |
| Relative colour syntax `oklch(from …)` (`relative-color`) | low | 2024-09-16 | not yet | Chrome 125, Firefox 128, Safari 18 | the 66 hued tone tokens `--yeti-color-<hue>-0…100` (`src/tokens/tone.css:36-45` and on) | None, but measured: no Yeti CSS outside `tone.css` reads a hued tone; they exist for consumers' own classes and `data-paint` reads the roles instead (`src/layouts/attributes.css:404-405`). |
| `@starting-style` (`starting-style`) | low | 2024-08-06 | not yet | Chrome 117 is fine; Firefox 129, Safari 17.5 | dialog, dropdown, nav entry animations | None needed: no entry animation. |
| `transition-behavior: allow-discrete` (`transition-behavior`) | low | 2024-08-06 | not yet | Firefox 129, Safari 17.4 | dialog `display` transition (`dialog.css:34`), details panel (`base/media.css:122`) | None needed: the change is instant. |
| `content-visibility` transition (`content-visibility`) | low | 2025-09-15 | not yet | Firefox 130, Safari 26 | `details::details-content` panel animation (`base/media.css:120-122`) | Manifest states the degrade: "the panel still grows open and shuts at once rather than shrinking" (`accordion/manifest.json`). |
| `::details-content` (`details-content`) | low | 2025-09-16 | not yet | Chrome 131, Firefox 143, Safari 18.4 | same rule, and `demo.css:119` | Same degrade. |
| `<details name>` (`details-name`) | low | 2024-09-03 | not yet | Chrome 120, Firefox 130, Safari 17.2 | the accordion's one-at-a-time mode (`accordion/example.html`; `components.md:275`) | None: every panel can stay open. Yeti adds no script for it by design. |
| Alt text on generated content `content: "/" / ""` (`alt-text-generated-content`) | low | 2024-07-09 | not yet | Firefox 128, Safari 17.4 | breadcrumbs separator ("seen and not read", `breadcrumbs/manifest.json`) | None. Inferred: the whole `content` declaration is invalid, so no separator is drawn. |
| `:has()` (`has`) | high | 2023-12-19 | 2026-06-19 | Firefox 121 | 86 matches: button pressed and disabled states through a wrapped input (`button.css:74-106`), field, pagination, toc, tooltip, lift, hero, media, shell | None. In Firefox 119 a selector list containing `:has()` is dropped whole. Six weeks past the target date. |
| `pow()` (`exp-functions`) | high | 2023-12-07 | 2026-06-07 | Chrome 120, Firefox 118 | the fluid type and space scale, 13 uses (`src/tokens/scale.css:23-48`); every `--yeti-text-*`, `--yeti-space-*`, and `--yeti-radius-*` derives from it | None. One month past the target date; Chrome 119 lacks it. Inferred: every size token is invalid in Chrome 119. |
| `lh` unit (`lh`) | high | 2023-11-21 | 2026-05-21 | Firefox 120 | alert and field, 4 uses | None; two weeks past the target date. |
| `:dir()` (`dir-pseudo`) | high | 2023-12-07 | 2026-06-07 | Chrome 120 | RTL variants of progress and enter, 6 uses | None; RTL only. |
| Unprefixed `mask-image` (`masks`) | high | 2023-12-07 | 2026-06-07 | Chrome 120 | seam (`seam.css:48-58`) | None; Chrome 119 needs `-webkit-mask-image`. |
| `@property` (`registered-custom-properties`) | low | 2024-07-09 | not yet | Firefox 128 | hue and chroma registration (`color.css:11-16`) | Yes, by construction: the same tokens are also declared on `:root` (`color.css:25-31`), so `@property` is only a guard against bad overrides. |
| `text-wrap: balance` / `pretty` (`text-wrap-balance`, `text-wrap-pretty`) | low / false | 2024-05-13 / - | not yet | Firefox 121 / none | headings, nav, lede | Cosmetic. |
| `scrollbar-width` (`scrollbar-width`) | low | 2024-12-11 | not yet | Chrome 121, Safari 18.2 | carousel track (`carousel.css:22`) | Cosmetic. |
| `overscroll-behavior`, `accent-color`, `user-select`, `resize` | web-features marks each `false` for Safari or Safari iOS | - | - | Safari | scroller, base typography, button, demo | Cosmetic. |
| `::view-transition-old(root)` timing (`view-transitions`) | low | 2025-10-14 | not yet | Firefox 144, Safari 18 | `base/transitions.css:38-42` only re-times a transition the site must opt into; cross-document transitions are left off (`:4-12`) | Not applicable unless the site opts in. |

Container style queries and scroll-state queries: not used (measured, 0 matches for `style(` and `scroll-state(`). Native CSS nesting: not used (measured with `nesting-check.mjs`: 0 style rules nested inside style rules in 69 files; the nested blocks are `@container`, `@media`, and `@supports` inside `@layer`, which is cascade layers, not nesting, and `&` never appears). The README's "native nesting" claim (`README.md:17`) describes the platform Yeti targets, not a construct its stylesheets use today.

### 3.3 Features outside the target that Yeti guards

| Feature | Baseline | Where | Guard and fallback (`@supports`) |
| --- | --- | --- | --- |
| Anchor positioning (`anchor-positioning`: Chrome 125, Safari 27, no Firefox) | false | dropdown, nav, tooltip | `dropdown.css:46`, `nav.css:135`, `:201`, `tooltip.css:64`. Manifest fallbacks: dropdown "the panel is centred by the user agent"; nav "the sheet starts at the top of the viewport, and a submenu in the open panel docks to the foot of it"; tooltip "the bubble and its caret are placed above the trigger with absolute positioning". Note: every Firefox user, and every Chrome user before 125, gets a dropdown panel centred in the viewport. |
| Scroll-driven animations (`scroll-driven-animations`: Chrome 115, Safari 26, no Firefox) | false | `enter[data-view]`, `progress[data-scroll]` | `enter.css:85`; `progress.css:65-73` hides the scroll progress bar where unsupported. |
| `grid-template-rows: masonry` (`grid-lanes`: Safari 26.4 only) | false | masonry | `masonry.css:29`; multi-column fallback. |
| `interpolate-size: allow-keywords` (`interpolate-size`: Chrome 129 only) | false | details panel height animation | `reset.css:90-93`. |
| `field-sizing: content` (`field-sizing`: Chrome 123, Firefox 152, Safari 26.2) | low 2026-06-16 | textarea | `reset.css:53-56`. |

### 3.4 Features Yeti uses that are inside the target

Container size queries and `cq*` units (widely available 2025-08-14; Chrome 105, Firefox 110, Safari 16), cascade layers (2024-09-14), `<dialog>`, `::backdrop`, `:modal`, `inert`, scroll snap, `scroll-behavior`, `color-mix()` (2025-11-09), `oklch()` (2025-11-09), subgrid (2026-03-15), grid row animation `0fr`→`1fr`, `:user-invalid` (2026-05-02; Chrome 119 exactly), `tan()`/`atan2()`, `translate` and the individual transform properties, `dvh`, media query range syntax, `overflow: clip`, logical properties and logical border radii, `aspect-ratio`, `clip-path`, `object-fit`, flexbox gap, `font-variant-numeric`, `@media print`, `iframe srcdoc`, `IntersectionObserver`, `ResizeObserver`, `MutationObserver`, `WeakMap`, `CustomEvent`, `scrollIntoView()`, the Constraint Validation API, `dialog.close()` and `showModal()`.

### 3.5 Reading

Six of Yeti's unguarded features carry its components rather than decorate them: `popover` (dropdown, nav), invoker commands (dialog), `light-dark()` (every colour), `pow()` (every size), `:has()` (button, field, pagination, toc, tooltip states), and `<details name>` (accordion exclusivity). None has a fallback in Yeti, and the map's rule is "No progressive enhancement onto a not-usable feature in the first specs: one code path per behaviour" (old map `building-blocks.md` 1.2). A wrapper on the current target would either carry fallbacks Yeti refuses to ("No polyfills", `README.md:30`), or the target would move to Yeti's floor, which the map ties to Angular's own browser support. Angular 22's target is the user's decision, not Yeti's.

## 4. Point 3: coverage against this bundle

### 4.1 Inventory

49 manifests: 17 layouts, 3 recipes, 22 components, 7 utilities (`YETI/src/*/*/manifest.json`, measured; `README.md:38` says the same). Every `since` is `7.0.0`.

- Layouts: box, breakout, center, cluster, columns, container, cover, frame, grid, icon, layer, masonry, overlay, scroller, sidebar, stack, timeline.
- Recipes: hero, media, shell.
- Components: accordion, affix, alert, badge, breadcrumbs, button, buttons, card, carousel, demo, dialog, dropdown, field, nav, pagination, progress, seam, spinner, table, tabs, toc, tooltip.
- Utilities: attention, billboard, enter, lede, lift, print, visually-hidden.

### 4.2 The bundle's 51 specs against Yeti

From the migration guide (`YETI/docs/guides/migrating.md:20-88`) and the manifests. "Partial" means Yeti covers one use of the Foundation family, not the family.

| Foundation 6.9 family (bundle spec) | Yeti | Notes |
| --- | --- | --- |
| Abide | none | "native validation attributes; the field shows the browser's state"; `validate.js` moves the browser's message into the field's error slot on submit (`field/validate.js:1-13`). |
| Accordion | `accordion` | native `<details>`/`<summary>`; `name` for one-at-a-time; no module. |
| AccordionMenu | none | "a site tree is a list of links in a `stack`; the browser's `<details>` disclosure for a section". |
| Drilldown | none | same row. |
| Dropdown | `dropdown` | `popover`; "no script and no z-index"; `hover.js` opt-in. |
| DropdownMenu | `dropdown` inside a `nav` item | "one level; a mega menu is not shipped". |
| Equalizer | none | "`columns` and `grid` align heights on their own". |
| Interchange | none | "`<picture>` and `srcset`". |
| Magellan | none (partial: `toc` + `toc.js`) | the guide says "scroll spying is script the page can add if it must"; `toc.js` does move `aria-current` to the heading in view with an `IntersectionObserver` (`toc/toc.js:1-10`), so the behaviour exists for a table of contents. |
| OffCanvas | partial: `nav` with `data-panel="drawer"` | the drawer is the nav's own panel; no general off-canvas region. |
| Orbit | `carousel` | scroll snap; dots are links; `carousel.js` only stops history entries. |
| ResponsiveAccordionTabs | none | not in the guide; `tabs` has `data-orientation` but no accordion form. |
| ResponsiveMenu | none | not in the guide; `nav` collapses one list at `data-threshold`. |
| ResponsiveToggle | partial: `nav`'s own toggle | the toggle is a `popovertarget` button hidden by the nav's container query (`components.md:216`). |
| Reveal | `dialog` | opened by `commandfor`/`command="show-modal"`; `dialog.js` adds backdrop click and focus return. |
| Slider | `field` around `<input type="range">` | `range.js` fills the track from `--yeti-range-value`. |
| SmoothScroll | none | not in the guide; `scroll-behavior` where Yeti scrolls. |
| Sticky | `data-sticky` marker | on a child of `sidebar`, `shell`, `stack`, or on `nav`; `--yeti-sticky-offset`. |
| Tabs | `tabs` + `tabs.js` | the one component that needs its module to work (`components.md:271`). |
| Toggler | none | "`<details>`, `popover`, `<dialog>`, and `:has()` cover every case it had". |
| Tooltip | `tooltip` | hover and focus, CSS only; anchor positioning guarded. |
| Button | `button` | `data-variant`, `data-emphasis` (replaces `.hollow`/`.clear`), `data-size`. |
| Button Group | `buttons` | `data-affix` joins them. |
| Close Button | `data-close` inside `alert` or `nav` | "a close button belongs to what it closes". |
| Switch | `field` around a checkbox with `role="switch"` | native, styled. |
| Menu | `cluster` or `stack` of links; `nav` for a site menu | "a menu is a list of links". |
| Top Bar (Title Bar, Menu Icon) | `nav` | collapses behind a toggle at its own threshold. |
| Pagination | `pagination` | `aria-current`; compacts below its threshold. |
| Breadcrumbs | `breadcrumbs` | generated separator. |
| Callout | `alert` (message) or `box` with `data-border` (panel); `data-paint` for a coloured panel | "the callout did two jobs". |
| Card | `card` | figure bleeds; `data-stretch` for a whole-card link; container query at `md`. |
| Media Object | `media` recipe | or `sidebar` and `frame`. |
| Table | `table` | `data-hover`, `data-striped`; `scroller` for width; "the stacking table is gone". |
| Badge, Label | `badge` | one component; `data-emphasis` is the difference. |
| Progress Bar | `progress` on native `<progress>` | indeterminate when no value. |
| Responsive Embed | `frame` with `data-ratio` | native `aspect-ratio`. |
| Thumbnail | `frame` in a `box` with `data-border` | two primitives. |
| Forms | `field`, `affix` | `data-hint`, `data-error`; `aria-invalid` replaces `.is-invalid-input`. |
| XY Grid | `center` (`.grid-container`), `columns` with `data-span` (`.grid-x`/`.cell`), `grid` with `data-columns` (`.small-up-N`), `stack` (`.grid-y`), `cover` and `scroller` (`.grid-frame`/`.cell-block`) | "shares, not twelfths"; the gap is a token. No 12-column grid. |
| Prototyping Utilities | partial: `box` with `data-gap*` for padding; a `stack` gap and `data-space` for margins; `data-align`/`data-justify` for text alignment | "Yeti has no margin classes, on purpose" (`migrating.md:102`). |
| Flexbox Utilities | `data-align`, `data-justify`, `data-align-self` on layouts | alignment is a layout's attribute. |
| Visibility Classes | `data-show`/`data-hide` inside a size `container`; `visually-hidden`; the `hidden` attribute; `print` with `data-print` | no `-only`, no `-portrait`/`-landscape`; `.show-on-focus` is the base skip-link rule. |
| Float Classes | none | out of scope in the bundle already. |
| Typography Helpers | partial: base typography, `lede`, `billboard` with `data-fit` | not in the guide; no `.subheader`, `.lead`, `.stat`, `.text-*` classes. |
| Breakpoint service (shared utility) | none | no breakpoint list exists; seven width stops as `--yeti-width-*` tokens read by container queries and `calc()` wrapping (`responsive.md:39`, `:45-57`). |
| Triggers (shared utility) | none | the platform's `popovertarget`, `commandfor`, `<form method="dialog">`. |
| Anchored pane (shared utility) | none | `popover` plus guarded anchor positioning. |
| Nested menu (shared utility) | none | AccordionMenu and Drilldown are dropped; DropdownMenu is one level. |
| Variant declaration tooling, forgotten-import checks, the four checks specs | not applicable | see section 6.3. |

Counts: of the 21 plugins, 9 have a counterpart, 3 partial, 9 none. Of the 18 CSS-only component pages, all have a counterpart (Badge and Label merge; Callout splits). Of the 6 layout and utility families still in the destination, the XY Grid and Flexbox Utilities are replaced wholesale, Visibility Classes largely, Prototyping Utilities and Typography Helpers in part, Float Classes not at all.

### 4.3 New in Yeti with no Foundation 6.9 page

Layouts box, breakout, center, cluster, columns, container, cover, frame, grid, icon, layer, masonry, overlay, scroller, sidebar, stack, timeline; recipes hero, media, shell; components affix, alert (as a separate thing from a panel), demo, nav (as one list in two modes), seam, spinner, toc, dialog (native); utilities attention, billboard, enter, lede, lift, print, visually-hidden; the tokens, two themes, the starter page and theme, the manifest, `llms.txt`, editor data, and types. A wrapper that keeps the destination's "one spec per docs page" rule would write 49 specs for Yeti's pages, most of them new.

## 5. Points 3 and 8: how much is JavaScript, and what Angular would add

### 5.1 Measured

- CSS: 69 files, 5,276 lines, 265,580 bytes in `YETI/src/**/*.css`. JavaScript: 10 files, 760 lines (304 comment lines), 37,706 bytes. Lines of JavaScript are 12.6% of the source; by bytes 12.4%. The install guide says the nine component modules together are "about nine kilobytes compressed" (`install.md:149`).
- The ten files and what each does, from their header comments: `alert.js` (31 lines) fades and removes an alert on its close button, delegated on `document`; `carousel.js` (48) scrolls the track when a dot is followed so the fragment navigation adds no history entry; `demo.js` (175) builds a docs demo's `iframe` from the code beneath it; `dialog.js` (75) closes on a backdrop click and returns focus to the opener, because `closedby="any"` "is not Baseline" and WebKit does not focus a clicked button; `hover.js` (93) opens a `data-trigger="hover"` dropdown under the pointer, "a stopgap with a stated end" until `interestfor` reaches Baseline; `range.js` (58) keeps a range's filled track and readout in step with the thumb; `validate.js` (84) puts the browser's validation message into the field's error slot and stops the submit; `tabs.js` (114) hides inactive panels, moves `aria-selected`, and roves focus with arrow keys; `toc.js` (51) moves `aria-current` to the heading in view; `enter.js` (31) removes `data-once` when an element nears the viewport so its CSS animation plays once. The install and components guides count "nine modules" and the stability guide lists ten names; `enter.js` belongs to a utility and is the tenth.
- Platform APIs the modules use (measured by occurrence): `CustomEvent` (every module that dispatches), `WeakMap` (dialog, hover), `IntersectionObserver` (toc, enter), `MutationObserver` (demo, range), `ResizeObserver` (demo), `getComputedStyle`, `scrollTo()`, `scrollIntoView()`, `checkValidity()`/`validationMessage`, `matchMedia`, `showPopover()`/`hidePopover()` (hover), the `command` event with `event.command`/`event.source` (dialog), `dialog.close()`, `pointerover`/`pointerout`. No module imports or exports anything; each is a plain script loaded once (`CONTRIBUTING.md:38`; `build.js:51-53`).
- What the platform does instead of script: opening and closing of dropdown, nav menu, dialog, and accordion; Escape and light dismiss; the modal focus trap and `inert`; `aria-expanded` on a `popovertarget` button; details exclusivity through `name`; the carousel's movement through scroll snap; tooltip on hover and focus; sticky positioning; container-query shape changes (`components.md:271`; `migrating.md:116`).
- Reach of the modules: `tabs.js` and `toc.js` "are not picked up" for elements added after load (`tabs.js:4`; `toc.js:10`); the delegated modules (alert, carousel, dialog, hover) handle later elements. No module has a teardown. Events are dispatched after the fact and are not cancelable (`install.md:177`).

### 5.2 What Angular would add beyond replacing those 760 lines (inferred)

- **Typed inputs from a frozen vocabulary.** Yeti validates `data-*` values with its own validator and ships editor data (`install.md:181-191`); nothing checks an application's HTML at build time. A directive whose inputs are typed from `yeti-css/manifest` makes `data-variant="prmary"` a compile error, which is ADR 0040's goal without ADR 0040's Sass problem (section 6.3).
- **The class rule.** Yeti still asks the author to write `class="card"`, `class="button" data-variant="primary"`, `popovertarget="menu"`, `commandfor="share" command="show-modal"`, `aria-labelledby`, `aria-controls`, and matching ids by hand (`dialog/example.html`, `nav/example.html`, `tabs` manifest a11y notes). A directive binds the identity class and the attributes and generates the ids and pairings, so the consumer writes `<dialog nfsDialog>` and `<button [nfsDialogTrigger]="dialog">`.
- **Accessibility the manifests leave to the author.** Each `a11y.notes` says what the author must add: "Give the dialog a name with aria-labelledby pointing at its heading", "Give the tablist a name", "The trigger needs a name" (`dialog`, `tabs`, `dropdown` manifests). A directive can require or supply these, as the bundle's specs do (old map ADR 0022 (`wcag-2-2-aa-enforcement`)).
- **Fallbacks for the out-of-target features**, if the target stays: a click handler that calls `showModal()` where invoker commands are missing; the bundle's Anchored pane where `popover` or anchor positioning is missing (ADR 0002); a directive-managed exclusive accordion where `<details name>` is missing. `light-dark()` and `pow()` cannot be fixed from a directive; they need a transpiled stylesheet, which Yeti refuses to ship (`install.md:73`), so a wrapper would transpile at its own build (Lightning CSS is already Yeti's minifier, `package.json:62`; whether it lowers `light-dark()` and `pow()` was not checked).
- **Rendering modes.** The modules run at load on `document`; they have no server, hydration, or `@defer` story, and the server renders Yeti markup only as the author wrote it. Directives render host attributes and classes on the server (building-blocks 1.11), replay events, hydrate incrementally, and load their code per family under `@defer`, as the bundle specifies today.
- **Dynamic content and lifecycle.** Directives see elements created later, carry per-instance state as signals (`model()` for the selected tab, the open dialog, the current toc link), and tear down on destroy; `tabs.js` and `toc.js` do neither.
- **Forms.** `validate.js` writes `validationMessage` into `[data-error]` on submit and sets `aria-invalid`. Angular's reactive forms carry the same state with typed validators, async validators, and `markAllAsTouched`; a `field` directive binds `aria-invalid`, `aria-describedby`, and the error slot from the control's status (the bundle's Forms and Abide specs already describe this).
- **Outputs.** `yeti:open`, `yeti:close`, `yeti:select`, `yeti:slide`, `yeti:invalid`, `yeti:current` become typed outputs, with the cancelable "before" phase Yeti declines to offer (`install.md:177`) available where the platform event allows (`beforetoggle`, `cancel`).
- **The families Yeti dropped.** AccordionMenu, Drilldown, Equalizer, Interchange, Magellan beyond a toc, Toggler, ResponsiveMenu, and ResponsiveAccordionTabs would be Angular additions on Yeti's primitives or would stay out of scope; Yeti supplies no CSS for them.
- **Lazy style loading** (section 7). Yeti has no loader; a page links one stylesheet.

## 6. Point 4: the styling model, and what it means for the bundle's records

### 6.1 Tokens, themes, layers, manifest

- **Tokens.** 297 public `--yeti-*` tokens in 39 groups (`YETI/src/tokens/tokens.json`, measured; groups listed in `schema/tokens.schema.json:13`), 127 of them colour; 449 distinct private `--_yeti-*` names (measured). Eight public tokens are "override-only inputs Yeti never declares" (`--yeti-base`, `--yeti-ratio`, `--yeti-link-color`, and five more; `tokens.schema.json:15`), and `--yeti-range-value` is per-element, not for themes (`:16`).
- **Runtime derivation.** Two inputs, base and ratio, each fluid between `--yeti-viewport-min` and `-max`, feed every step through `pow()`; "`tan(atan2(a, b))` equals a / b as a plain number, which is the only way to divide two lengths in `calc()` on the Baseline 2025 floor" (`src/tokens/scale.css:4-48`). Six hues and one chroma feed every colour role through `oklch()` and `light-dark()` (`src/tokens/color.css:1-6`, `:25-57`); greys through `color-mix()` and hued tones through relative colour (`tone.css:20-45`).
- **Themes.** "A theme is the same idea moved into its own file: a stylesheet of token values on `:root`, and optionally a few rules for bare HTML elements, loaded after `yeti.css`" (`docs/guides/theming.md:88`). The two shipped themes are 16 and 15 token declarations (`src/themes/soft.css`, `sharp.css`). Element rules go in `@layer yeti.theme`, where the validator "refuses a class, id or attribute selector, `*`, the sibling combinators, `:is()`, `:where()`, `:has()` or `:not()`, any pseudo-class other than `:hover`, `:focus-visible`, `:active` and `:visited`, a custom property inside the layer, a rule outside it, and a token it doesn't recognize" (`theming.md:95`). "A component's skin stays token-only: a class name belongs to Yeti, and a theme that restyled one would break when its internals change" (`:116`).
- **Layers.** `@layer yeti.reset, yeti.base, yeti.theme, yeti.layouts, yeti.components, yeti.utilities;` declared once in `src/layers.css:7`, imported first (`src/yeti.css:1-4`), checked for exact text by the validator (`bin/validate.js:312-333`) and asserted in CSSOM by a browser test (`bin/lib/layers.js:1-2`). Every shipped rule is inside one of the six (`layers.css:2-3`); measured, each of the 49 component, layout, recipe, and utility files opens with its kind's `@layer` block. A consumer's unlayered CSS beats all of Yeti.
- **Shared attributes.** `src/layouts/attributes.css` maps every shared `data-*` value to a private property once ("`[data-gap="md"] { --_yeti-gap: var(--yeti-space-md); }`"), and "layouts read the property and supply their own default only when the attribute is absent, so a nested layout never inherits a parent's value" (`attributes.css:1-4`). It is 36 KB and must always load (`install.md:96`).
- **Manifest and vocabulary.** Each component folder holds `manifest.json`, its CSS, `example.html`, and `docs.md` (`CONTRIBUTING.md:53`). The manifest schema requires `name`, `kind`, `class`, `attributes`, `classes`, `children`, `tokens`, `a11y` (`role`, `requiredAttributes`, `keyboard`, `notes`), `js` (modules with events), `support`, `since`, `example` (`schema/manifest.schema.json:8-58`). Attribute value lists are inline or a named vocabulary from `schema/vocabulary.json` (`gap`, `variant`, `width`, `size-control`, and 26 more). The build merges them into `dist/yeti.manifest.json` and `dist/yeti.tokens.json`, exported as `yeti-css/manifest` and `yeti-css/tokens` with `.d.ts` files (`package.json:20-37`; `build.js:137-163`), plus `yeti.html-data.json`, `web-types`, `llms.txt`.
- **Customising without Sass.** Set tokens on `:root` after `yeti.css` (`theming.md:12-23`); override a derived colour directly (`:31`); pin a scheme with `color-scheme` on any element (`:53`); change the width stops in one place (`responsive.md:57`); "a color by name on anything" with `data-paint` (`attributes.css:390-405`); a custom build is a copied `@import` list with lines deleted, bundled with `npx esbuild site.css --bundle --minify` (`install.md:75-106`).

### 6.2 The lazy family styles question (182 to 192)

What changes under Yeti, against the findings those tickets recorded:

- **No consumer settings reach the CSS at build time**, because there are none: every setting is a runtime custom property. old map ADR 0012 (`sass-packaging`)'s reason for "No library component or directive carries `styles`" ("compiled at library build time, where the consumer's settings do not exist") does not apply. A per-component file compiled into the library is the same file the consumer would compile.
- **The structure/theme split that old map `research/structure-theme-split.md` could reach only by compile diffing is Yeti's design.** There, 25% of Foundation's first-milestone bytes were invariant and the rest depended on settings through selectors and presence (palette loops, `$breakpoint-classes`). Here, 100% of a component file is invariant and the theme is a `:root` block of tokens. Yeti's variants are fixed attribute values, not setting-generated classes, so no selector depends on a setting.
- **Cascade order is declared, not positional.** old map `research/lazy-style-loading.md` section 6 and the 184 prototype needed an `@layer` order statement so a late-inserted family sheet would not beat the consumer's CSS. Yeti ships that statement (`layers.css`) and wraps every rule in its layer, so a family file inserted at any time lands in `yeti.components`, below the consumer's unlayered CSS and above `yeti.base` and `yeti.theme`. Within one layer, "inside a group a later file still wins a tie" (`install.md:98`), so the order in which two component files are inserted can decide a tie between rules of equal specificity; the install guide says cross-file rules exist only "for the two used together, a spinner inside a button or a dropdown inside a nav" (`:98`). A library would fix that with one sub-layer per component declared in `yeti.css`'s order (`@import url(...) layer(yeti.components.nav)` nests the file's own `@layer yeti.components` block inside it). Inferred, untested.
- **Companion loading is optional.** Rules that mention another component "simply match nothing once the other part is gone" (`install.md:98`), so a family loads alone. The always-group (`layers.css`, `tokens/*`, `base/*`, `layouts/attributes.css`; 99,050 bytes of 265,580 unminified source, 37%, measured) is global and styles bare HTML, so it belongs in the consumer's global stylesheet or is provided once by the library, not per family.
- **Per-family sizes** (measured, unminified source): components 96.7 KB in 22 files, nav the largest; layouts 67.2 KB in 18 files, of which `attributes.css` is 36.3 KB; utilities 22.9 KB; recipes 8.4 KB; tokens 43.3 KB; base 18.1 KB.
- **The Angular half is unchanged.** Whoever inserts the CSS, `SharedStylesHost` counts per component instance, loses the decrement when any `animate.leave` is running, and does not count dehydrated instances (old map `research/lazy-style-loading.md` 3.3); Beasties inlines what the server rendered; the `<link>` flash is structural when the fetch starts at construct (192 critique). Of 192's proposals, A no longer needs a Sass esbuild plugin: a `.css` file imported by the directive's module, or a component `styleUrls` with `ViewEncapsulation.None` compiled at library build, is enough, so the `@experimental` `buildApplication` extension point the orchestrator flagged is not needed. B's settings fingerprint becomes moot (no settings in the CSS). C, D, E, F, and G stand as written. 188's `own-style` runtime gains the build it lacked.
- **Variant properties and the generator lose their reader** (section 6.3), which also removes 185's point 7 (records that assume one global compile).

### 6.3 The class rule (ADR 0039), typed Variant inputs (ADR 0040), and Sass packaging (ADR 0012)

- **ADR 0039.** Its three class kinds map onto Yeti as: Structural class → the one identity class per component ("Identity is a plain class (`.card`)", `CONTRIBUTING.md:59`), with children addressed by element and by markers (`data-close`, `data-brand`, `data-track`); Variant class → `data-*` attributes with closed value lists ("Configuration is a `data-` attribute with a short shared vocabulary"); State class → none ("State is native or ARIA (`[open]`, `[aria-current]`), never invented"). The rule that "consumers write no Foundation or NFS class" survives as "consumers write no Yeti class or `data-*` attribute": directives bind the class and the attributes, and the State host bindings become the ARIA and native attributes the directives already own for accessibility. Its "every State class is a host binding" consequence and the `Renderer2` exception for `is-off-canvas-open` and `is-reveal-open` have nothing to bind.
- **ADR 0040.** Yeti's vocabularies are closed and frozen (`stability.md:17-18`): nine `data-variant` values, three sizes, seven widths (`schema/vocabulary.json`). There is no palette map, no size map, no `$breakpoint-classes`, and no way for a consumer to add a name; a theme changes the six hues' values, not their count. So the Open Variant family, the Variant registries, the declaration file generated from the compiled stylesheet, the sync generator and builder, the Variant properties `--nfs-<setting>`, and the Runtime checks `strictVariantNames`/`strictVariantProperties` have no Sass to read and nothing open to extend. What remains of ADR 0040 is its first bullet: closed types. They would be generated once, at library build, from `yeti-css/manifest` and `vocabulary.json`, and regenerated per Yeti release because values may be added. The Spec: Variant declaration tooling (old map ticket 136, `spec-variant-declaration-tooling`) and the check specs that read Variant properties would be superseded.
- **ADR 0005 (breakpoints).** Foundation's `$breakpoints` map, its `em` media queries, the `--nfs-breakpoint-<name>` properties, and `MediaMatcher` have no counterpart: Yeti has seven width stops as tokens and asks each component's own container (`responsive.md:14-39`, `:109-120`). Responsive Variant inputs over Class breakpoints (ADR 0040) become `data-threshold`, `data-max`, `data-width`, `data-min`, `data-show`, `data-hide` inputs over the `width` vocabulary.
- **ADR 0012.** Superseded in full under Yeti: no `@import 'ngx-foundation-sites'` after Foundation, no `nfs-<plugin>` mixins reading settings, no `-zf-bp-to-em`, no `foundation-sites` peer. Library CSS Foundation "cannot express" becomes plain CSS, placed in a layer the library declares (Yeti ships nothing in `yeti.theme` and reserves it for themes, `layers.css:4-6`; a library layer would be declared after Yeti's statement). The peer becomes `yeti-css`, which does not exist on npm yet and carries the FSL question (section 2.4).

## 7. Point 9: lazy loading under Yeti against the 192 requirements

Consult: new approaches to loading family styles (old map ticket 192, `consult-fable-style-loading`) measured proposal A against: zero unstyled frames on a client-only `@defer`; enter animations on time; `main.js` holds no family rule; hashed names; the server HTML carries the `<style>` and hydration adds nothing; no consumer TypeScript; the consumer's Foundation settings reach the CSS; unload when no instance remains. Under Yeti (inferred from source; nothing prototyped):

| Requirement | Foundation 6.9 (as measured in 182 to 192) | Yeti |
| --- | --- | --- |
| Settings reach the CSS | Only the consumer's Sass compile has them; the library needs a build plugin or consumer-side carriers | Not a requirement: tokens are runtime. The library's copy of `components/nav/nav.css` is the consumer's copy. |
| Family CSS source | Compiled per consumer from Foundation's export mixins; 25% invariant | A file per component under `yeti-css/css/<kind>/<name>/<name>.css` (`package.json:28`; `build.js:95-99` copies `src/` verbatim); 100% invariant |
| CSS in the directive's chunk (192 A) | Needs an esbuild plugin through `buildApplication`'s unsupported `extensions` | A static `import` of the `.css` file, or a carrier component with `styleUrls` and `ViewEncapsulation.None`, both with the public toolchain; Angular's build copies plain CSS |
| Zero unstyled frames | A: 0; `<link>` loaders: 17-20 | Same as A when the CSS rides in the chunk; `<link>` to the package file keeps the fetch gap |
| Cascade order after late insertion | Needed an `@layer` statement the library adds (184) | Declared by Yeti (`layers.css`); each file wraps its rules in its layer; tie order within a layer is by insertion, fixable with sub-layers |
| Companion families | `menu` before `dropdown-menu`, enforced by the loader or static imports | None required; cross-file rules match nothing when the other file is absent (`install.md:98`) |
| Always-loaded part | Foundation's global styles, grid, typography (later-milestone families) | `layers.css`, `tokens/*`, `base/*`, `layouts/attributes.css` (99 KB source, 37%); styles bare HTML, so it is the consumer's global stylesheet or one library-provided sheet |
| Hashed names | Possible on library-compiled CSS | Not possible: Yeti's class names are the frozen public contract and its own rules select them; collisions are avoided by design ("Yeti only ever has one" class per component) |
| Server HTML carries the style, hydration adds nothing | Measured for `SharedStylesHost` paths | Unchanged: whichever insertion path is chosen behaves as 182 measured |
| Unload when no instance remains; leave-animation guard | Measured gaps in `SharedStylesHost` (182 3.3; 188) | Unchanged |
| Beasties critical CSS | Measured (182 3.4; 192 C) | Unchanged |
| Theme switching at runtime | Out of scope in the bundle | Native: a `:root` block or a second `<link>`; the library does nothing |
| Minification | Angular's build | Angular's build, or Lightning CSS as Yeti itself uses (`package.json:62`; `build.js:46`) |

Net: Yeti removes the build-side obstacle (settings) and the ordering obstacle (layers) that drove tickets 183, 184, 189, 191, and most of 192, and leaves the runtime obstacles (counting, leave animations, hydration, Beasties) that 182 and 188 measured. It adds one new question, the always-group, and one new limit, no hashed class names.

## 8. Point 5: what wrapping Yeti would change in the destination and the records (high level)

- **Destination text.** "every UI component, layout system, and utility class family in Foundation for Sites 6.9 ... one per Foundation docs page" becomes Yeti's 49 manifests (17 layouts, 3 recipes, 22 components, 7 utilities) plus whatever the user keeps of the 9 dropped plugins and the 3 partial ones. The 51-spec count, the 26 re-runs under the class rule, and the later-milestone family rulings of 2026-09-30 and 2026-10-01 describe Foundation pages that Yeti does not have.
- **Domain note.** "Foundation for Sites 6.9 ships Sass plus jQuery plugins. The next library keeps Foundation's Sass and CSS class contract" becomes: Yeti ships plain CSS in layers, runtime tokens, and ten optional scripts; the library keeps Yeti's identity classes, `data-*` vocabularies, tokens, and events, and replaces the scripts.
- **Browser support decision.** Kept as is, 20 unguarded Yeti features are outside the target and six carry components (section 3.5); the map's "one code path" rule then forbids the fallbacks a wrapper would need. Moved to Yeti's floor, the target leaves Angular 22's own support statement, which the user tied it to. Either way this is the user's decision and the first one a Yeti destination would need.
- **Standing preferences.** "Foundation CSS classes and state classes (`.is-active`, `.is-open`) are the styling contract. The library reuses Foundation for Sites' SCSS (its mixins, partials, settings, and classes)" has no object; "Input names come from Foundation `data-*` options in camelCase" maps directly onto Yeti's `data-*` attributes; the animation, rendering-mode, accessibility, release-policy, and testing preferences are unaffected.
- **Out of scope.** "Runtime theming through custom properties as a component contract" is Yeti's contract; the line would be removed. "Foundation's jQuery plugin API surface" and "Motion UI" become moot.
- **Records superseded or rewritten** (inferred from the ADR texts): ADR 0012 (Sass packaging) superseded; ADR 0005 (breakpoints) superseded; ADR 0040 (Variant registries from Sass) reduced to closed types generated from the manifest; ADR 0039 (class rule) kept as a principle with its three kinds and State consequences rewritten; ADR 0002 (anchored pane) reopened, because Yeti's dropdown, nav, and tooltip stand on `popover` and guarded anchor positioning that the target rejects, so the bundle's Anchored pane becomes the fallback or the target moves; ADR 0007 (Reveal on `<dialog>`), ADR 0004 (menus as disclosure navigation, which matches Yeti's refusal of `role="menu"`, `components.md:277`), ADR 0003 (CSS animations), ADR 0045 (release policy), and ADR 0046 (forgotten imports) stand.
- **Specs.** Every published spec's CSS class mapping, Sass subsection, Library mixin, Variant inputs, Responsive Variants, and State host bindings describe Foundation 6.9 classes; each would be rewritten against a manifest, not re-run. The shared-utility specs Breakpoint service, Triggers, Anchored pane, and Nested menu lose their Foundation basis (section 4.2); Variant declaration tooling and the build-time, runtime, misuse-warning, and family-check specs that read Sass or Variant properties are superseded or re-scoped to the manifest.
- **Supporting documents.** building-blocks Tables A, B, and D (per-plugin mechanics), 1.7 (breakpoints), 1.13 (Sass and theming), 1.14 (spec shape's CSS class mapping); `storybook-conventions.md`'s `foundation-everything` preview; the Foundation inventories and `foundation-sass-per-family.md`, `structure-theme-split.md`, and `typed-variant-inputs.md` under `research/`; `CONTEXT.md`'s glossary entries for Library mixin, Variant property, and Class breakpoint.
- **Tickets 182 to 193.** 185 and 186 would be decided on a different footing (section 7); 183, 184, 189, 191, and 193 answered a Sass problem that Yeti does not have; 182 and 188 stand.
- **Not a change of destination but a precondition.** There is no package, tag, or release to pin a peer dependency to, the stated freeze has no tagged baseline, the project is thirteen days old with one author and no public plan documents, and its floor is Baseline 2025 by policy. Wrapping Yeti today means tracking a moving `develop`.

## 9. Open points and what was not done

- No Yeti page was rendered; every degrade in section 3 marked "inferred" follows from the CSS and the platform's invalid-value and unsupported-attribute rules, not from a browser run. A short Playwright run of `test/browser/smoke.html` in the three engines Yeti itself tests would confirm them, and a run in Chrome 119 and Firefox 119 would confirm the core-table gaps.
- Whether Lightning CSS or `@angular/build`'s esbuild pipeline can lower `light-dark()`, `pow()`, `:has()`, and relative colour for the target was not checked.
- The licence reading in section 2.4 is not legal advice; `OPEN FOR HUMAN`.
- The sub-layer idea for tie order in section 6.2 is untested.
- The announcement's `docs/superpowers/` phase specs were not found in any ref; the orchestrator may want to ask upstream where they live, which this ticket's rules did not allow.
