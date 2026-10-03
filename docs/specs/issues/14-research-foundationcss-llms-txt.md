# 14. Research: Foundation's `llms.txt` and `llms-full.txt` as sources for this map

Type: research
Status: resolved
Blocked by:
Labels: wayfinder:research
Map: ../map.md

## Question

What do https://www.foundationcss.com/llms.txt and https://www.foundationcss.com/llms-full.txt contain? How do they relate to the repository's generated `docs/llms.txt` and `docs/llms-full.txt`, the manifest, the token catalogue, and the MCP server the README mentions ("the docs, type hints, and an MCP server are generated from it")? And how can this map use them?

## User instruction, 2026-10-01

> 19. Use subagents to read https://www.foundationcss.com/llms.txt and https://www.foundationcss.com/llms-full.txt and consider how they can be used for the new map.

## How to work it

Use a `/research` subagent. Fetch both URLs with the fallback chain; `llms-full.txt` may be large, so save it to `D:/tmp` and read it in parts. Then cover:

1. Their structure and coverage: Yeti only, or Foundation for Sites 6 too; which pages they include; their size; and what they say about versions and dates.
2. How they differ from `github.com/foundation/yeti/docs/llms.txt` and `llms-full.txt` at `f52d1e8b9`, measured by a diff; and which file the generator (`bin/`) writes them from.
3. The MCP server: where it lives, what tools it offers, whether it can run locally, and what it would give the agents of this map.
4. Concrete uses for this map, each with what it would save or risk. For example: a source for the inventory ticket, a context file for spec agents, a check that a spec names only documented attributes, or a frozen-surface check with `bin/frozen.js`. Include the risk that these files lag the `develop` branch.

Write `research/foundationcss-llms-txt.md`, and append an `## Answer`. Decide nothing; recommend how other tickets should use the files, and name the tickets.

## Answer

Resolved 2026-10-01 by Sonnet 5.5. Findings: [research/foundationcss-llms-txt.md](../research/foundationcss-llms-txt.md).

- The two URLs the user named cover Inky (email) and Proton (static sites) only, with no Yeti and no Foundation for Sites 6; Yeti's own pair is at `/yeti/llms.txt` (39,010 bytes) and `/yeti/llms-full.txt` (250,798 bytes). Cite those.
- `diff` against `docs/llms.txt` and `docs/llms-full.txt` at `f52d1e8b9` printed nothing for both `/yeti/` files: byte-identical, and `develop` is still that commit. Generator: `bin/gen-llms.js:94-97`, run by `package.json:43`.
- The files are 49 items (17 layouts, 3 recipes, 22 components, 7 utilities) with attributes, defaults, markers, 10 optional JS modules, accessibility contracts and a `--yeti-*` token catalogue (full file, `:2786-3086`); version is `7.0.0-alpha.0`, no dates.
- No MCP server exists in the clone, on npm, or at `/.well-known/mcp`; the README sentence (`README.md:24`) is unbacked. The shipped stand-ins are `yeti-css/manifest` and `yeti-css/tokens` JSON.
- Recommend: use the files as the index for the inventory ticket, per-item context slices for spec tickets, an attribute lint for the consistency review, and `bin/frozen.js` for the version-policy ticket; record the alpha/beta mismatch and the missing MCP server in the licence and readiness ticket.

## Orchestrator note, 2026-10-01

Where the URLs came from: the user wrote, verbatim, "The llms.txt and llms-full.txt URLs were listed at https://www.foundationcss.com/yeti/guides/install/#for-a-language-model", and later "Oh, so the yeti/llms.txt and yeti/llms-full.txt URLs were what I intended." (both 2026-10-01). That section names no URL and links nothing. It says "`llms.txt` and `llms-full.txt` sit at the root of the docs site and in the package" (`github.com/foundation/yeti/src/guides/install.md:203`; the rendered page has no `llms` link, checked with `curl`). Yeti's docs site is at `/yeti/`, so the files the guide means are `/yeti/llms.txt` and `/yeti/llms-full.txt` (both return 200), the pair this ticket found identical to `docs/llms*.txt`. At the domain root, `foundationcss.com/llms.txt` and `/llms-full.txt` are the site-wide files for Foundation CSS's other tools. The findings stand.
