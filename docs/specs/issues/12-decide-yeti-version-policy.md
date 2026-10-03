# 12. Decide: which Yeti version the specs target, and how the package tracks it

Type: grilling
Status: resolved
Blocked by: 05, 21, 22
Labels: wayfinder:grilling
Map: ../map.md

## Question

Which Yeti version do the specs target? The options are a commit of `develop`, `7.0.0-beta`, or `7.0.0` once released. Yeti is unpublished on npm today, so how does the package depend on it: a peer dependency, a pinned version, or vendored? And how do the specs handle what the stability guide leaves unfrozen? That is private `--_yeti-*` tokens, default token values, generated files, and browser minimums.

Moved here on 2026-10-01 from [Decide: whether Yeti's licence and readiness allow this package](15-decide-yeti-licence-and-readiness.md), whose licence half the user decided. The question is whether Yeti's release state allows specs to be written against it now. The announcement (foundation/yeti#15554) says "The `develop` branch is now Yeti 7 and is unstable until the beta. Do not build on it yet." The README says `7.0.0-beta`, `package.json` says `7.0.0-alpha.0`, no tag exists, and nothing is on npm. Under the triage rule this is HIGH impact; if confidence is not HIGH, it stays `OPEN FOR HUMAN`.

## User ruling, 2026-10-01

The user settled readiness, verbatim:

> Readiness: We will spec and build against a specific commit of `foundation/yeti`'s `develop` branch.

Orchestrator's reading: the specs target, and the package builds against, one pinned commit of `develop`, not a tag, a beta, or an npm release. This ticket still decides:

1. Which commit to pin first. The candidate is `f52d1e8b9` (2026-09-25), the clone's commit, which every research ticket reads.
2. When and how the pin moves: what triggers a move, whether `bin/frozen.js` gates it, and how the specs record the commit they target.
3. How the package depends on an unpublished Yeti: a git dependency at the commit, vendored built files, or a build step. [ADR 0001](../adr/0001-yeti-licence-compatible-with-mit-package.md) applies: Yeti's files keep Yeti's licence and notice.
4. How the specs treat what the stability guide leaves unfrozen.

## How to work it

AFK grilling against [Task: carry the old map's Yeti findings into this bundle](05-task-carry-yeti-findings-from-old-map.md), Yeti's `src/guides/stability.md` and `bin/frozen.js`, its release history, and the announcement (foundation/yeti#15554, read only). Record an ADR. Whether the specs may name only frozen surface is open (point 4); the user's readiness ruling does not say. Also an input: the MCP server Yeti's README mentions does not exist anywhere ([Research: Foundation's `llms.txt` and `llms-full.txt` as sources for this map](14-research-foundationcss-llms-txt.md)).

Note, 2026-10-01 (audit 0002, M6): also read [Prototype: Yeti as a dependency from GitHub at a pinned commit](21-prototype-yeti-as-github-dependency.md) and [Prototype: building, consuming, and theming Yeti from a pinned commit with Nx](22-prototype-building-and-consuming-yeti-with-nx.md); point 3 is what they measured.

Note, 2026-10-01 ([Task: carry the old map's Yeti findings into this bundle](05-task-carry-yeti-findings-from-old-map.md)): section 2 of [research/yeti-foundation-7.md](../research/yeti-foundation-7.md) covers Yeti's status, timeline, licence, publishing, and what the stability guide locks.

## Answer

Resolved 2026-10-01 by Opus 5.5, AFK under the map's override, within the user's readiness ruling: "Readiness: We will spec and build against a specific commit of `foundation/yeti`'s `develop` branch." Recorded as [ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md). One item stays `OPEN FOR HUMAN` (see `### Triage`): whether the licence ruling covers the published package carrying Yeti's built files.

### Decisions

1. **First pin: `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`** (`f52d1e8b9`, 2026-09-25). `develop` has not moved since: on 2026-10-01 `gh api repos/foundation/yeti/commits/develop` returned this sha, `pushed_at` is 2026-09-25T18:02:46Z, and the clone is level with `origin/develop`. Both of Yeti's CI checks on it ("Validate, test, build" and "Browser smoke") concluded `success`. Every research ticket and prototype of this map read this commit, so no finding has to be re-checked.
2. **How the pin moves:** only through a pin move, one commit that replaces the vendored tree and its `COMMIT` file. A move needs a trigger:
   - a Yeti commit that fixes a bug in [upstream-bugs.md](../upstream-bugs.md) the package works around;
   - a Yeti addition a spec needs;
   - a `v7.0.0-beta.0` tag or an npm release of `yeti-css`, which also reopens ADR 0006.

   A new `develop` commit is not a trigger on its own. `bin/frozen.js` gates the move but is not the whole gate. Its `surfaceAt` and `compareSurfaces` exports compare the old pin with the new one in a full Yeti clone, with no checkout, and each break must be resolved in the same move. A diff then covers what `frozen.js` does not read: the `exports` map, `engines`, `schema/`, event `detail` keys and targets, token defaults, and the README's browser support (a change there reopens ADR 0002). Last, the package's own build and tests run at the new pin. Each spec names the pin in its header, `Yeti: f52d1e8b9 (f52d1e8b93de5bbde322480ba77d5be26c49b0ef, develop, 2026-09-25)`, and cites Yeti as `path:line` at that commit.
3. **How the package depends on unpublished Yeti:**
   - In the workspace: vendored source at the pin as the npm workspace package `yeti-css`, the output of `git archive <sha> src bin schema package.json package-lock.json LICENSE README.md`, plus `COMMIT`. It is built by a local Nx `createNodes` plugin target `yeti-build` (`nx:run-commands`, `node bin/build.js`, cached `dist/`, git-ignored), and imported as `yeti-css/...` through Yeti's `exports` map. This is ticket 22's option B, which used a vendored copy of the clone at the pin.
   - In the published package: it carries the Yeti files it needs, built at the pin, with Yeti's `LICENSE` (ADR 0001), and has no `dependencies` or `peerDependencies` entry on `yeti-css` while Yeti is unpublished. The licence half of this is `OPEN FOR HUMAN`.
4. **Unfrozen surface:**
   - Specs may name anything on the frozen list.
   - Specs never name private `--_yeti-*` tokens (ADR 0004 already says so).
   - No spec or test depends on a public token's default value. A spec may quote one, marked "at the pin". Screenshot baselines are re-blessed at a pin move, with the reason given.
   - Package code reads only `yeti-css/manifest` and `yeti-css/tokens`, whose schemas are frozen. It never reads the types file, the editor data, the docs pages, or `llms*.txt`. Those are evidence cited at the pin, and the README's MCP server does not exist (Y5).
   - From `bin/`, the package uses only `bin/build.js` and `frozen.js`'s two exports, and each pin move checks that they still work.
   - Browser minimums follow ADR 0002.
   - A spec that loads a Yeti module covers what that module does with interaction tests, because module behaviour is not on the frozen list.

   The frozen list is Yeti's intent, not a guarantee, before beta. Protection comes from the pin and the move gate.

### Reasons

- The freeze is not in force yet, which is the main reason a gate exists at all. Commit `dda16fad8` (2026-09-24) removed `--yeti-color-scheme`, `--yeti-quote-border`, and `--yeti-quote-color` with the message "Nothing is frozen before beta (7.0.0-alpha.0), so removal is allowed". `frozen.js` reports exactly those three breaks from `f08e6425e` to the pin. Every `develop` commit is stamped `7.0.0-alpha.0`, so only a sha can name the target.
- The vendored source beat the other measured options for three reasons. Only `npm ci` is needed to install, with no network to GitHub. Imports go through the `exports` map with the same specifiers a future npm release resolves, and Nx's static dependency edge and cache work (ticket 22: 2/2 cache hits, `nx affected` follows the moved files). A pin move shows Yeti's own source diff in the package's review, so unfrozen changes such as token defaults are visible where the move is made.
- A peer dependency cannot be satisfied (npm 404) and cannot carry a commit to a consumer. Shipping the built files is the only measured route where a consumer's `npm install` alone gives exactly the pinned Yeti.
- The point 4 rules follow from what the stability guide does not freeze (`stability.md:25-31`), from ADR 0004's private-token rule, and from ADR 0005's unions, which are written against the pin and so move only at a pin move.

### Rejected options

- Plain git or codeload tarball dependency: installs no `dist/` (ticket 21, A and B).
- Git dependency on a Yeti commit that adds `prepare`: needs a Yeti change. Asking for one is an upstream action under the user's identity, so nothing was drafted or filed.
- Committed `npm pack` tarball (ticket 21 and 22, option C): a binary artefact, re-packed by hand, and Nx cannot install it.
- Git submodule (option D): the pin is a gitlink with no reviewable Yeti diff, it needs `npm install` after each move and a submodule fetch on CI, and it had one unexplained cache miss.
- Fetch and build at the pin (option E): needs GitHub on every cold build, uses relative imports into a git-ignored folder instead of the `exports` map, and has only an implicit Nx edge.
- `nx:run-script` over Yeti's `build` script (A1, A2): no cache without a workspace-wide default, and it takes the `build` name.
- `@nx/esbuild:esbuild`: cannot replace `bin/build.js`, and it names the CSS bundle `.js` (O1).
- Peer dependency on `yeti-css`: unsatisfiable while unpublished, and alpha.0 names every commit.
- Moving with every `develop` commit or on a calendar: 473 direct commits in 13 days, each costing a full gate.
- `frozen.js` as the only gate: it reads names and value lists only, not event `detail` keys, schemas, or the `exports` map. It lives in unfrozen `bin/`, and it throws on refs from 2026-09-18 and earlier.
- Specs limited to the frozen list alone: the freeze is not enforced before beta, so that limit would protect nothing the pin and gate do not already protect. Tokens, events, and modules a spec needs are named, with the rules above.

### Grilling record (AFK: each question asked of the sources, with the answer settled)

1. Has `develop` moved past `f52d1e8b9`? No. `gh api` gives the same tip, and `pushed_at` is 2026-09-25 (checked; no fetch was run in the clone).
2. Is `f52d1e8b9` a sound commit? Yes. Both CI check runs passed on it (checked).
3. Does the user's ruling leave room for `7.0.0-beta` or an npm release instead? No. It names a commit of `develop`, and neither a beta tag nor a package exists (checked: tags end at `v6.9.0`, npm 404).
4. Is the frozen list in force now? No. Maintainer commit `dda16fad8` says nothing is frozen before beta, and `frozen.js` measures three token breaks between `f08e6425e` and the pin (checked).
5. Can `frozen.js` compare two pins without changing the clone's checkout? Yes. A scratch script imported `surfaceAt` and `compareSurfaces` and compared refs read-only. Refs from 2026-09-22 onward work; 2026-09-15 and 2026-09-18 throw on the older manifest `js` shape (checked).
6. Does Yeti's own process run `frozen.js`? Only by hand. `CONTRIBUTING.md:47` asks for it before a merge, while `.github/workflows/ci.yml`, `bin/release.js`, and `package.json` scripts do not call it (checked with `rg`). So the package cannot rely on Yeti having run it.
7. Does `frozen.js` cover the whole frozen list? No. It reads classes, attributes, markers, vocabularies, token names, module names, and event names (`bin/frozen.js:20-45`), not `detail` keys, dispatch targets, schemas, or the `exports` map (checked).
8. Does the vendored tree need `test/` (6.5 MB) or `docs/`? No. `git archive f52d1e8b9 src bin schema package.json package-lock.json LICENSE README.md`, then `npm ci --ignore-scripts` and `node bin/build.js` in a scratch folder, exited 0 and wrote `dist/` (29 entries, the count ticket 21 recorded). The tree is 1.7 MB before install (checked). Whether its output is byte-identical to a full clone's build was not checked.
9. Which dependency option fits best? Vendored source with ticket 22's plugin target (reasons above; the measurements are tickets 21 and 22's, and the choice is inferred from them).
10. What does a consumer of the published package install? Only the package, which carries the built Yeti files at the pin (inferred; no registry install was tried, as ticket 21's unknowns say).
11. Does ADR 0001 cover that redistribution? Not settled. Its consequences name "vendored files" as an option and require Yeti's licence and notice, but the user's own words do not mention redistribution. See `### Triage`.
12. What does a pin move do to the package's version? Not decided here. Under the carried release policy, a break that reaches the package's public API ships only on an Angular major. The version number itself is for [Decide: which ADRs carry over](08-decide-inherited-adrs.md) (inferred from the map's "Inherited preferences and rulings").
13. Do the unfrozen items need inputs or APIs of their own? No. They need rules for specs, as in point 4.

### Checked and inferred

- **Checked:**
  - the `develop` tip, `pushed_at`, CI conclusions, tags, and npm 404;
  - the stability guide's text, `frozen.js`'s coverage, and where Yeti calls it;
  - the `dda16fad8` message and the three breaks;
  - the `git archive` subset building `dist/`;
  - commit cadence (473 commits on `v6.9.0..develop`).
- **Inferred:**
  - that vendored source is the best of the measured options;
  - that a consumer of the published package installs only the package;
  - that npm workspaces install Yeti's build devDependencies;
  - that a module's behaviour can change between pins.
- **Not tried:** a registry install of a package that carries Yeti's files; Linux CI.

### Triage

| Item | Impact | Confidence | Evidence | Result |
| --- | --- | --- | --- | --- |
| First pin `f52d1e8b9` | MEDIUM: a pin move can replace it | HIGH | `develop` tip, CI success, every ticket read it | decided |
| Pin-move triggers and gate | MEDIUM: procedure, reversible | HIGH | `dda16fad8`, measured breaks, `frozen.js` coverage | decided |
| Workspace dependency: vendored source plus Nx plugin target | MEDIUM: contained in the workspace, swappable | HIGH | tickets 21 and 22, the `git archive` build | decided |
| Published package carries Yeti's built files under FSL-1.1-MIT, with no `yeti-css` dependency entry | HIGH: published on npm under the user's identity, hard to retract, and ticket 13's `styleUrl` route would inline Yeti's CSS into the package in any case | NOT HIGH (MEDIUM): ADR 0001's consequences anticipate vendored files, but the user's verbatim ruling ("compatible with what we want to do as a free and open-source project") does not mention redistribution | ADR 0001; `LICENSE:63-70` (redistribution must carry the terms and notices) | `OPEN FOR HUMAN`. Recommended: yes, with Yeti's `LICENSE` and a notice naming the commit. If not, consumers build Yeti themselves at the documented commit (Yeti's install guide), and the package declares nothing. Specs proceed on the recommendation, since the workspace side does not depend on the answer. |
| Unfrozen surface rules | HIGH: every spec | HIGH | `stability.md:14-31`, ADR 0004, ADR 0005 | decided |

## User ruling on the open item, 2026-10-02

Asked whether the licence ruling covers shipping Yeti's built files inside the published package, the user answered, verbatim: "Vendoring: Yes, but if possible don't bundle Yeti's CSS in our package. Try to find a way to let the consumer". The message was cut off; the user then completed it, verbatim: "Vendoring: Try to find a way to let the consumer bring a build." So redistributing Yeti's files is allowed, but the package looks for a way to let the consumer bring their own build of Yeti. ADR 0006's point on the published package therefore stands for Yeti's JavaScript and data files, and is reopened for its CSS, which [Decide: how component styles load and unload](13-decide-style-loading.md) settles.
