# 02. Research: inventory of Yeti's components, layouts, recipes, utilities, and contract

Type: research
Status: resolved
Blocked by:
Labels: wayfinder:research
Map: ../map.md

## Question

What exactly does Yeti offer, and what is its contract? List every component, layout, recipe, and utility; every class, attribute and value list, marker, public `--yeti-*` token, theme, and event; and every docs page. Mark which parts the stability guide freezes at `7.0.0-beta`. The manifest and the token catalogue are the source.

## How to work it

Use a `/research` subagent against `github.com/foundation/yeti` at `develop` (`f52d1e8b9`). Use the built manifest and token catalogue (run the repository's own `npm run build` in a copy under `D:/tmp`, never in the clone), `src/`, `docs/`, and `src/guides/stability.md`, citing `file:line` throughout.

Produce one row per item with:

- its name and kind;
- its docs page;
- its classes, attributes, markers, tokens, and events;
- the HTML elements it expects;
- whether it has a JavaScript module;
- its frozen status.

Check the row count against the manifest's own count (the stability guide says "The forty-nine names in the manifest"). Also read https://www.foundationcss.com/yeti/guides/migrating/ and map each Foundation for Sites 6.9 component, layout system, and utility family that `.scratch/next-foundation-specs/` specified to its Yeti counterpart, if any.

Write `research/yeti-inventory.md`, and append an `## Answer`. Decide nothing.

## Answer

Resolved 2026-10-01 by Sonnet 5.5. Findings: [../research/yeti-inventory.md](../research/yeti-inventory.md). Source: Yeti `develop` at `f52d1e8b9`, built in a copy under `D:/tmp`.

- The count matches. The built manifest has 49 entries: 17 layouts, 3 recipes, 22 components, 7 utilities. That equals the stability guide's "forty-nine names" (`src/guides/stability.md:15`) and the README (`README.md:38`). The manifest calls all four kinds "components"; only 22 have `kind: component`. Checked.
- The inventory has one row per item (49), each with docs page, class, attributes and value counts, markers, tokens, expected elements, module and events, and a `file:line` for its source manifest. All source manifests equal the built manifest apart from build-time expansion. Checked.
- The catalogue has 297 public tokens in 39 groups (127 are colour), 32 vocabularies, 31 distinct markers, 54 distinct attribute names, 6 event names (7 declarations), 10 optional modules (nine items declare one), and two themes. Checked.
- Frozen at `7.0.0-beta`: class names, attribute names and value lists, vocabularies, markers, public token names, module file names, event names and `detail` keys, the two schemas, and the `exports` map. Not frozen: private tokens, public defaults, generated file text, `bin/`, support minimums. The guide does not name HTML structure or the `a11y` blocks (that gap is inferred).
- Inconsistencies in the repository, not resolved: `README.md:9` says `7.0.0-beta` while `package.json:3` and the manifest say `7.0.0-alpha.0`; `components.md:239` lists nine modules and `migrating.md:113` says eight components with nine, while `stability.md:20` and `dist/js/` have ten (the tenth is the utility `enter`). Checked.
- Migration map: 55 old specs mapped (checked against the live page, which matches the source guide). No Yeti counterpart: accordion-menu, drilldown-menu, equalizer, float-classes, interchange, toggler, abide (guide says none, though `validate.js` exists), magellan (guide says none, `toc` partly covers it), plus rows the guide does not cover, marked inferred in the file. 16 Yeti items have no Foundation 6 row.

Note, 2026-10-01 ([Task: carry the old map's Yeti findings into this bundle](05-task-carry-yeti-findings-from-old-map.md)): section 4 of [research/yeti-foundation-7.md](../research/yeti-foundation-7.md) maps Foundation 6.9 to Yeti from an earlier pass.
