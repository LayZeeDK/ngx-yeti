# 31. Research: Yeti's removed planning documents and its stated roadmap

Type: research
Status: resolved
Blocked by:
Labels: wayfinder:research
Map: ../map.md

## Question

Yeti's announcement (foundation/yeti#15554) says: "The architecture and every phase spec live in this repository under `docs/superpowers/`. Progress is tracked in milestones." The orchestrator checked on 2026-10-03:

- At the pin `f52d1e8b9`, `.gitignore` lists `docs/superpowers/` and `.superpowers/`.
- Commit `fa61d90d2` (2026-09-12, "chore: keep planning documents out of the repository") deleted five files under `docs/superpowers/`, 3,400 lines in all. They are an architecture design spec, a phase 0 plan and its design, and two research notes.
- `develop` on GitHub has no `docs/superpowers/`.
- The repository has no open milestones. Its 30-plus milestones are all closed Foundation 6 ones, last updated in 2021.

The announcement therefore points at documents that are gone from the tree and at milestones that do not exist. What did the removed documents say about Yeti's architecture, its phases, and its intended future? In particular: which phases come after phase 0, what is planned for the JavaScript modules, the manifest, the tokens, the frozen surface, and the beta and npm release? Does any of it contradict or sharpen what this map has decided (ADRs 0001-0006, 0040, 0060, 0070, and the spec list)? Are the planning documents published anywhere else, for example in Discussions, the docs site, or a later commit or branch?

## User instruction, 2026-10-03

The user's own message, verbatim:

> 53. Did you investigate the foundation/yeti repo's current/future state based on this, both `docs/superpowers/` and milestones? I do not see any milestones at https://github.com/foundation/yeti/ milestones or any https://github.com/foundation/yeti/tree/develop/docs/superpowers though.

## How to work it

Use a `/research` subagent. Read the deleted files from history in the read-only clone at `github.com/foundation/yeti` with `git show fa61d90d2^:<path>`. Do not check out, fetch, or modify the clone. Read the announcement and the repository's Discussions through `gh api`, read-only. Write `research/yeti-planning-documents.md`, with findings tagged read (with commit and path) or inferred, and append an `## Answer`. Decide nothing.

## Answer

Resolved 2026-10-03. Findings: [research/yeti-planning-documents.md](../research/yeti-planning-documents.md). Each point is tagged read (with commit and line) or inferred.

- The five files (architecture spec, phase 0 design, phase 0 plan, reset survey, inspiration notes) were committed in `a994b2e29` and removed and ignored 32 minutes later in `fa61d90d2` (both 2026-09-12). Read from `fa61d90d2^` in full, one section each in the findings file. They exist on no branch and not on `develop`.
- Planned phases: 0 repo transition and skeleton, 1 tokens and reset, 2 layouts and recipes, 3 styled essentials, 4 navigation and interactive items, 5 guides, `gen-types.js`, screenshots, API freeze and `7.0.0-beta.0`, 6 MCP server and `7.0.0`. The first npm publish of `yeti-css` is `7.0.0-beta.0`. No dates or milestone names appear.
- JavaScript was budgeted at two modules (`tabs.js`, `dialog.js`); the pin has ten and a `yeti.js` bundle. The frozen surface is stated only as a strict-semver principle; the list lives in `stability.md` at the pin. The documents plan no Angular or wrapper work.
- Public availability: no `docs/superpowers/` on `develop` or any branch, 0 open milestones (30 closed), Discussions are disabled, the announcement has no comments, and the docs site has no roadmap page. The announcement's pointers are already stale.
- Map decisions: mostly confirmed (Baseline 2025, layers, naming contract, optional modules, public-token flag, WCAG floor). Contradicted by the pin: MIT licence (now FSL-1.1-MIT), five layers (six), two modules (ten). Table in the findings file.
