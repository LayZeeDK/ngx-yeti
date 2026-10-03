---
status: accepted
---

# Yeti is pinned to one `develop` commit, vendored as source, built by Nx, and moved only through a gated pin move

The user ruled, verbatim (2026-10-01): "Readiness: We will spec and build against a specific commit of `foundation/yeti`'s `develop` branch." Yeti has no tag for version 7, nothing on npm (`npm view yeti-css`: 404), and stamps every commit `7.0.0-alpha.0`, so a version range cannot name a commit. Its stability guide lists a frozen surface "from `7.0.0-beta.0`" (`src/guides/stability.md:12-23`), but that freeze is not in force yet: commit `dda16fad8` (2026-09-24) removed three public tokens with the message "Nothing is frozen before beta (7.0.0-alpha.0), so removal is allowed", and `bin/frozen.js` reports exactly those three breaks between `f08e6425e` (the last commit of 2026-09-24) and the pin. A plain git or tarball dependency installs without `dist/`, because Yeti git-ignores it and has no `prepare` script ([ticket 21](../issues/21-prototype-yeti-as-github-dependency.md)). Decided in [Decide: which Yeti version the specs target, and how the package tracks it](../issues/12-decide-yeti-version-policy.md).

We decided:

1. **The pin is `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`** (`f52d1e8b9`, `develop`, 2026-09-25). It was still `develop`'s tip on 2026-10-01, and both of Yeti's CI checks passed on it.
2. **The package's workspace vendors Yeti's source at the pin** as an npm workspace package named `yeti-css`: the output of `git archive <sha> src bin schema package.json package-lock.json LICENSE README.md`, plus a one-line `COMMIT` file holding the full sha. A local Nx `createNodes` plugin gives it a cached `yeti-build` target (`nx:run-commands`, `node bin/build.js`, output `dist/`, git-ignored). Package code imports `yeti-css/...` through Yeti's `exports` map, the same specifiers a future npm release resolves.
3. **The published package carries the Yeti files it needs, built at the pin, with Yeti's `LICENSE`,** and declares no `dependencies` or `peerDependencies` entry on `yeti-css` while Yeti is unpublished. Whether the licence ruling covers that redistribution is `OPEN FOR HUMAN` in the ticket; if it does not, the fallback is that consumers build Yeti themselves at the documented commit, as Yeti's install guide describes.
4. **The pin moves only through a pin move**, one commit that replaces the vendored tree and `COMMIT` and passes these checks:
   - the target commit is on `develop` and Yeti's CI passed on it;
   - `surfaceAt` and `compareSurfaces` from `bin/frozen.js` compare the old pin with the new one in a full Yeti clone. Each break is resolved in the same move, and each addition the package exposes is added to its unions ([ADR 0005](0005-closed-unions-from-yetis-vocabularies.md));
   - a diff of what `frozen.js` does not read: `package.json` `exports` and `engines`, `schema/`, event `detail` keys and targets in the manifests, public token defaults in `src/tokens/tokens.json`, and the README's browser support;
   - the package's own build and tests at the new pin, with any screenshot re-blessed and the reason given.
   The commit message names both shas and `frozen.js`'s summary line.
5. **What triggers a move:** a Yeti commit that fixes an [upstream bug](../upstream-bugs.md) the package works around; a Yeti addition a spec needs; or a `v7.0.0-beta.0` tag or an npm release of `yeti-css`, which also reopens this record. A new commit on `develop` is not by itself a trigger.
6. **Every spec records its target** as `Yeti: f52d1e8b9 (f52d1e8b93de5bbde322480ba77d5be26c49b0ef, develop, 2026-09-25)` in its header, and cites Yeti as `path:line` at that commit.
7. **Unfrozen surface in specs:**
   - Specs may name anything on the stability guide's frozen list.
   - Specs never name private `--_yeti-*` tokens ([ADR 0004](0004-yeti-tokens-are-a-consumer-stylesheet-surface.md)).
   - No spec or test depends on a public token's default value. A spec may quote one, marked "at the pin".
   - Package code reads only `yeti-css/manifest` and `yeti-css/tokens`, never the types file, the editor data, the docs pages, or `llms*.txt`.
   - From `bin/`, the package uses only `bin/build.js` and `frozen.js`'s two exports, and each pin move checks that they still work.
   - Browser minimums follow [ADR 0002](0002-browser-target-baseline-2025.md).
   - A spec that loads one of Yeti's modules covers what that module does with interaction tests, because module behaviour is not on the frozen list.

## Considered options

- **A git or tarball dependency** (`github:foundation/yeti#<sha>`, codeload URL): installs with no `dist/`, so `ng build` fails (ticket 21, options A and B).
- **A git dependency once Yeti adds `"prepare": "node bin/build.js"`**: works (ticket 21, option F, on a local branch), but needs a change in Yeti, and asking for one is an upstream action that needs the user's confirmation.
- **A committed `npm pack` tarball**: a binary artefact whose provenance is only the build that made it; it must be re-packed by hand at each move, and Nx cannot install it ([ticket 22](../issues/22-prototype-building-and-consuming-yeti-with-nx.md), option C).
- **A git submodule**: the pin is a gitlink, so a move shows no Yeti diff in the package's own review; it needs `npm install` after each move and a submodule fetch on CI, and one cache miss after the conversion was not explained (ticket 22, option D).
- **Fetch and build at the pin** (`yeti.pin` plus a script): needs GitHub on every cold build, imports by relative path into a git-ignored folder instead of through the `exports` map, and has only an implicit Nx dependency (ticket 22, option E).
- **Nx's own `nx:run-script` over Yeti's `build` script**: never caches until a workspace-wide default covers all 13 of Yeti's script targets, and it takes the `build` name (ticket 22, options A1 and A2).
- **A peer dependency on `yeti-css`**: nothing on npm satisfies it, and `7.0.0-alpha.0` names every commit, so it cannot carry the pin to a consumer.
- **Moving the pin with every `develop` commit, or on a calendar**: `develop` took 473 direct commits in 13 days, and the freeze is not yet enforced, so each move costs a full check.
- **`frozen.js` alone as the gate**: it reads names and value lists only, not event `detail` keys, the schemas, or the `exports` map that the guide also freezes; it lives under `bin/`, which is itself unfrozen; and it throws on refs from 2026-09-18 and earlier. Its breaks are an input to the gate, not the gate.

## Consequences

- A pin move shows Yeti's own source diff in the package's review, so changes to token defaults and other unfrozen surface are visible where the move is made.
- The workspace needs Node 24 or later (Yeti's `engines.node`) and installs Yeti's build devDependencies (`esbuild` 0.25.12, `lightningcss`, `parse5`) through npm workspaces (inferred from ticket 22).
- [ADR 0003](0003-directives-set-yetis-class-attributes-and-markers.md) says a pin move "inside `7.x` adds values rather than renaming them". Before beta that is Yeti's intent, not a guarantee: the `frozen.js` check catches the difference.
- Under the release policy the map carries over (breaking changes and removals only when the Angular major changes), a pin move whose `frozen.js` breaks reach the package's public API, such as a removed value in an exported union, can ship only on an Angular major. Until then the pin stays where it is. How a pin move shows in the package's own version number is for [Decide: which ADRs carry over](../issues/08-decide-inherited-adrs.md), which rewrites that policy (old ADR 0045).
- Where `frozen.js` runs as a test layer beside the pin-move check is for the testing decision (map, "Inherited preferences and rulings", Testing).

- 2026-10-02: the user ruled on the open vendoring item, verbatim: "Vendoring: Yes, but if possible don't bundle Yeti's CSS in our package. Try to find a way to let the consumer" (the message ends there). Redistributing Yeti's files is allowed; whether the package ships Yeti's CSS is reopened and goes to [Decide: how component styles load and unload](../issues/13-decide-style-loading.md), on the orchestrator's reading that the consumer should provide it.
- 2026-10-02: the user completed the vendoring ruling, verbatim: "Vendoring: Try to find a way to let the consumer bring a build." [Decide: how component styles load and unload](../issues/13-decide-style-loading.md) looks for that route first.
- 2026-10-02: point 7's last rule is amended by the user's prefix ruling (map, Standing rulings): the package's input types import Yeti's exported vocabulary types from `yeti.d.ts`, so the package's published type declarations depend on the types file at the pin, recorded by [Decide: the glossary](../issues/10-decide-glossary.md). Package runtime code still reads only `yeti-css/manifest` and `yeti-css/tokens`. [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) adds a requirement for how the package depends on Yeti: a consumer's TypeScript must resolve `yeti.d.ts`, because with `skipLibCheck` an unresolved import silently turns every input type into `any` (inferred). [Decide: how component styles load and unload](../issues/13-decide-style-loading.md) has to keep that true when the consumer brings their own build.
- 2026-10-02: [Decide: how component styles load and unload](../issues/13-decide-style-loading.md) adds two build-time reads to point 7: `yeti-css/css/yeti.css` for the order item files are inserted in, and `yeti.d.ts`, of which the package ships a generated copy at the pin ([ADR 0060](0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) point 10), because without it every input type silently becomes `any` (measured). The package ships none of Yeti's CSS: the consumer brings a build of Yeti at the pin, as the user's vendoring ruling asked.
