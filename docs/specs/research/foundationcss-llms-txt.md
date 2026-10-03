# Research: Foundation's `llms.txt` and `llms-full.txt` as sources for this map

Ticket: [14](../issues/14-research-foundationcss-llms-txt.md). Date: 2026-10-01. Model: Sonnet 5.5.

Downloads are in `D:/tmp/ngx-yeti-14/`: `llms.txt`, `llms-full.txt` (site root), `yeti-llms.txt`, `yeti-llms-full.txt` (from `/yeti/`), each with a `.headers` file. Clone: `github.com/foundation/yeti` at `f52d1e8b9` (committer date 2026-09-25T11:02:08-07:00). "Checked" means measured by a tool in this session; "inferred" means reasoned.

## 1. The two URLs the user named are not about Yeti

Checked. `curl` with a browser User-Agent returned 200 for both; no fallback was needed.

| File | Bytes | Lines | `last-modified` | Content |
| --- | --- | --- | --- | --- |
| `https://www.foundationcss.com/llms.txt` | 2,699 | 40 | Fri, 25 Sep 2026 17:35:09 GMT | Index of two projects: Inky, an email framework (`llms.txt:9-23`), and Proton, a static-site compiler (`llms.txt:25-36`); points to `llms-full.txt` as "Optional" (`llms.txt:38-40`) |
| `https://www.foundationcss.com/llms-full.txt` | 110,959 | 3,649 | same | Heading `# Foundation CSS — Full Documentation` (`llms-full.txt:1`); Inky from line 9, Proton from line 3135 (`# Proton — Static Site Compiler`) |

`rg -c -i yeti` on both root files printed nothing (no matches). They cover neither Yeti nor Foundation for Sites 6. They hold no version number and no date beyond the HTTP `last-modified` header.

Yeti has its own pair one directory down. Checked with `curl`: `https://www.foundationcss.com/yeti/llms.txt` returns 200, 39,010 bytes; `https://www.foundationcss.com/yeti/llms-full.txt` returns 200, 250,798 bytes. Both carry `last-modified: Fri, 25 Sep 2026 17:35:09 GMT` (`yeti-llms.txt.headers`, `yeti-llms-full.txt.headers`). The root `llms.txt` does not link to them (`llms.txt:38-40` links only `llms-full.txt`), so an agent that starts at the root never finds Yeti. Recommend the map cite the `/yeti/` URLs, not the ones in the user's instruction.

## 2. Diff against the repository copies

Checked with `diff` (GNU diffutils, Git Bash):

- `diff d:/.../yeti/docs/llms.txt D:/tmp/ngx-yeti-14/yeti-llms.txt` printed nothing, exit 0.
- `diff d:/.../yeti/docs/llms-full.txt D:/tmp/ngx-yeti-14/yeti-llms-full.txt` printed nothing, exit 0.

Both published Yeti files are byte-identical to the clone at `f52d1e8b9` (39,010 and 250,798 bytes in both places; 522 and 3,086 lines). For contrast, the diff of the clone's `llms-full.txt` against the root `llms-full.txt` is 6,536 lines long, as expected for different products.

Currency, checked with `gh api repos/foundation/yeti/commits/develop`: `develop` was still `f52d1e8b9` (2026-09-25T18:02:08Z) on 2026-10-01, so the published copy is current today. One oddity: the site's `last-modified` (17:35:09Z) is 27 minutes before that commit's timestamp (18:02:08Z). Inferred: the site was built from a slightly earlier commit whose docs output is identical, or the two timestamps come from different clocks. The bytes match, so nothing changes today, but the deploy is not provably tied to a commit.

Generator: `bin/gen-llms.js`. It runs from the `docs` script, `node bin/gen-docs.js && node bin/gen-llms.js` (`package.json:43`), and from the build (`bin/build.js:13` imports `writeLlms`, `bin/build.js:163` calls it). The strings are built at `gen-llms.js:94`, then written to `dist/` at `gen-llms.js:96` and to `docs/` at `gen-llms.js:97`. Inputs: the merged manifests (`gen-llms.js:8` imports `loadAndMerge`), each component's `docs.md` (`gen-llms.js:89`) and the token catalogue `src/tokens/tokens.json` (`gen-llms.js:92-93`). The header comment (`gen-llms.js:2-6`) says every string comes from the manifest or a docs fragment, "so the file cannot say something the validator does not enforce". `package.json:14-18` ships only `dist` (plus licence and README), and `package.json:20-36` exports `./manifest` and `./tokens` JSON but no llms entry.

## 3. Structure of the Yeti files

`yeti-llms.txt` (checked by `rg`): preamble (`:1-5`; `# Yeti 7.0.0-alpha.0`; three rules: class is identity, `data-*` is configuration, native or ARIA is state), then 49 `## name (kind, class="...")` blocks sorted by kind then name (`gen-llms.js:10-11`): 17 layouts (from `box` at `:7`), 3 recipes (hero, media, shell), 22 components (accordion to tooltip), 7 utilities (attention to visually-hidden). Each block has a description, `Attributes:` (44 blocks), `On children:` markers (19 blocks), and `module: x.js (optional)` entries with `- event` lines for 10 modules: alert, carousel, demo, dialog, hover, range, validate, tabs, toc, enter (`yeti-llms.txt:254, 316, 332, 341, 353, 368, 370, 453, 465, 500`). Enum attributes list every value and mark the default.

`yeti-llms-full.txt` adds, per `gen-llms.js:56-75`: the docs fragment with headings demoted (for example `### When to use it` and `### How it works` in the `stack` block, `yeti-llms-full.txt:710-730`), `Children:` constraints, per-component `Tokens:`, and an `Accessibility contract:` (required attributes, keyboard table, notes). It ends with `## Tokens` at line 2786 (`gen-llms.js:77`), a flat catalogue of `--yeti-*` custom properties with group and default (`yeti-llms-full.txt:2788-3086`; last entry `--yeti-color-neutral-100` at `:3086`).

Version and dates: only `# Yeti 7.0.0-alpha.0` (`:1`), which comes from `package.json:3`. The README says `7.0.0-beta`; the files follow `package.json`. No date appears in either body.

## 4. The MCP server

Checked, and the answer is that there is no server code to find:

- The only mentions in the clone are `README.md:24` ("the docs, type hints, and an MCP server are generated from it") and `schema/manifest.schema.json:14` (a manifest `description` is "used verbatim in docs and the MCP server"). A search of `README.md`, `schema/`, `package.json`, `bin/` and `CONTRIBUTING.md` for "mcp" and "modelcontext" found only those two lines. A search of `src/`, `test/` and `docs/` (excluding the llms files) found no file.
- `package.json` has no MCP script, bin entry, dependency or export. The generators under `bin/` are `gen-docs.js`, `gen-ide.js` (VS Code custom data and JetBrains web-types, `gen-ide.js:1-6`), `gen-llms.js`, `gen-types.js`, plus `frozen.js`, `validate.js`, `validate-html.js`, `build.js`, `release.js`, `shots.js`. None writes an MCP server.
- npm registry probes (`registry.npmjs.org/yeti-css`, `/yeti-mcp`, `/@yeti-css%2Fmcp`) returned 404. `gh search issues --repo foundation/yeti mcp` returned only #15554. `https://www.foundationcss.com/.well-known/mcp` returned 404.

So the README sentence describes a plan or an unpublished feature. Whether it runs locally, and which tools it has, cannot be answered from the sources. The stand-ins the clone does ship are the manifest and token JSON exported at `package.json:28-35` (`yeti-css/manifest`, `yeti-css/tokens`) with TypeScript declarations (`bin/gen-types.js:1-10`): the data an MCP server would serve, as files that an agent or build script reads with no server.

## 5. Uses for this map

Each use names a ticket by its title.

1. **Source for [Research: inventory of Yeti's components, layouts, recipes, utilities, and contract](../issues/02-research-yeti-inventory.md).** `yeti-llms.txt` is a ready 49-item list with kind, class, attributes, values, defaults and markers. It saves hand-reading 49 manifests. Risk: it is a rendering of the manifests, so the inventory should cite the manifests for anything a spec relies on. Use the llms file as the index and cross-check against the manifest JSON.
2. **Context file for the spec tickets that follow [Decide: the spec list](../issues/11-decide-spec-list.md).** Each spec brief can include the matching `## name` block of `yeti-llms-full.txt` (roughly 30 to 180 lines) and the `## Tokens` section. It saves tokens and keeps every agent on the same facts. Risk: the full file is 250 KB and 3,086 lines; hand over slices, not the whole file.
3. **Attribute check for specs.** The file states "a value not in its list is an error" (`yeti-llms.txt:3`). A spec lint can extract `data-*` names and values from a spec and compare them with the enum lists; anything not in the list is either wrong or must be flagged as an Angular addition. This serves the consistency review and the term list in [Decide: the glossary](../issues/10-decide-glossary.md).
4. **Input for [Research: Yeti's JavaScript modules and what Angular adds](../issues/03-research-yeti-javascript-and-angular.md).** The 10 `module:` entries, 7 `- event` lines and each `Accessibility contract:` give the keyboard and ARIA behaviour the optional JavaScript provides today, for comparison with `@angular/aria` and the CDK.
5. **Token catalogue for [Research: Yeti's styling model, and loading component styles lazily](../issues/04-research-yeti-styles-and-lazy-loading.md) and [Decide: how component styles load and unload](../issues/13-decide-style-loading.md).** `## Tokens` (`yeti-llms-full.txt:2786-3086`) lists the public `--yeti-*` properties with defaults, which bounds what a typed theming surface would need to cover. It says nothing about layers or load order, so it cannot settle those tickets.
6. **Frozen-surface check.** The generated files have no history, so they cannot do this alone. `bin/frozen.js` is the tool (`frozen.js:1-12`): `node bin/frozen.js <ref>` compares class names, attribute and marker names with value lists, vocabularies, token names, and module and event names at a ref against HEAD, and exits 1 on a break. Use it in [Decide: which Yeti version the specs target, and how the package tracks it](../issues/12-decide-yeti-version-policy.md) to measure drift from a pinned commit to `develop` before choosing a policy. A plain `diff` of `docs/llms.txt` between two commits is a cheaper partial check.
7. **Pinning facts for [Decide: which Yeti version the specs target, and how the package tracks it](../issues/12-decide-yeti-version-policy.md) and [Decide: whether Yeti's licence and readiness allow this package](../issues/15-decide-yeti-licence-and-readiness.md).** The published files say `7.0.0-alpha.0` (`package.json:3`) while the README says `7.0.0-beta`; the files give no licence text; and the MCP server the README promises does not exist in any source checked.

Risks of lagging `develop`: the published pair equals `develop` today (checked), but `develop` is declared unstable (map note on foundation/yeti#15554), the site's `last-modified` is not tied to a commit, and the repository copies change only when someone runs `npm run docs`. Each spec should record the Yeti commit it was checked against, and the consistency review should re-diff `docs/llms*.txt` against the pinned commit.

Do not use the files as: a source for Foundation for Sites 6 (absent), a source for Inky or Proton (out of scope), or evidence that an MCP server exists.

## 6. Recommendations (nothing decided)

- Cite `https://www.foundationcss.com/yeti/llms.txt` and `/yeti/llms-full.txt`, or the clone's `docs/llms*.txt`; they are identical today.
- Tell the inventory ticket (use 1) to treat `yeti-llms.txt` as an index and the manifests as the authority.
- Offer [Decide: the spec list](../issues/11-decide-spec-list.md) the 49-item count (17 layouts, 3 recipes, 22 components, 7 utilities) as the starting universe.
- Record the missing MCP server as a fact in [Decide: whether Yeti's licence and readiness allow this package](../issues/15-decide-yeti-licence-and-readiness.md): the README claims it; no code, package or endpoint was found.
