---
name: yeti-pin
description: 'This skill should be used when code, tests, or stories read Yeti (yeti-css), when a build fails because vendor/yeti/dist is missing, or when asked to "move the Yeti pin", "update Yeti", "read the Yeti manifest", "use a Yeti token", "look up Yeti''s docs for an item", or "why is yeti-css not a dependency", "Cannot find module ''yeti-css/manifest''", "yeti-build". Covers the vendored Yeti package, its yeti-build target, which Yeti files package code may read, the token rules, and the gated pin move of ADR 0006.'
---

# The vendored Yeti

Yeti (`yeti-css`, Foundation 7) has no npm release. The workspace vendors its source at one `develop` commit, the pin, whose full sha is in `vendor/yeti/COMMIT` (ADR 0006, `docs/specs/adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md`).

## Layout

- `vendor/yeti/` holds exactly the files of `git archive <pin> src bin schema package.json package-lock.json LICENSE README.md`, plus `COMMIT` with the full sha. Never edit a file there; a pin move replaces the whole tree.
- It is the npm workspace package `yeti-css`, so `node_modules/yeti-css` links to it and imports resolve through Yeti's `exports` map: `yeti-css/manifest`, `yeti-css/tokens`, `yeti-css/css/<path>`.
- `.nxignore` hides `vendor/yeti/package.json` from Nx, which would otherwise turn Yeti's npm scripts (its `test` among them) into workspace targets. `tools/yeti/nx-plugin.mjs` defines the `yeti-css` project with one target.

## Building Yeti

```sh
npx nx yeti-build yeti-css
```

It runs Yeti's `node bin/build.js`, writes `vendor/yeti/dist/` (git-ignored), and is cached on the files of `vendor/yeti`, `COMMIT` among them, so a pin move always rebuilds, and on Yeti's build tools. Yeti's own validator runs inside it, so a build is also Yeti's check (ADR 0014 point 5).

A target that reads `dist/` must depend on it. `nx.json` `targetDefaults` give the Storybook, test, typecheck, lint, application build, dev-server, and unit-test targets a `^yeti-build` dependency, which reaches `yeti-css` through any project in between. A project that reads `yeti-css` declares `implicitDependencies: ["yeti-css"]`, as `ngx-yeti` and `yeti-app` do. A "cannot find module 'yeti-css/manifest'" error means a target is missing that dependency, or the worktree case below.

In a second git worktree of this repository (an agent's `isolation: worktree` checkout), Nx shares the `~/.nx` cache with the main checkout, and a `yeti-build` cache hit can report `[local cache]` without writing `vendor/yeti/dist` (measured; the cause is not diagnosed, and the main checkout restores `dist` from the same cache correctly). If `dist` is missing after such a hit, run `npx nx yeti-build yeti-css --skip-nx-cache` once. Never run `nx reset` while another checkout runs Nx: it deletes that shared cache under the running tasks.

## What package code may read

- Package code reads Yeti only through `yeti-css/manifest` and `yeti-css/tokens` (ADR 0006 point 7), and only at build or test time: the package ships no Yeti file and declares no `yeti-css` dependency (ADR 0060). Lint enforces it: `yeti-css` is a non-buildable project, so an import of it from `ngx-yeti` source fails `@nx/enforce-module-boundaries`, while specs and stories may import it. Data an item needs at run time is generated into committed package source by `npx nx yeti-sources ngx-yeti` at a pin move (departures table of the `ngx-yeti-specs` skill); `nx build ngx-yeti` generates nothing.
- At a pin move, `yeti-sources` reads `yeti-css/css/yeti.css` for the item order and `yeti.d.ts`, of which the package ships a generated copy, `yeti-types.ts` (ADR 0006 2026-10-02 notes; ADR 0060 point 10). Input types import Yeti's vocabulary types from that copy, never from `yeti-css`.
- The package ships none of Yeti's CSS and declares no `yeti-css` dependency or peer dependency; the consumer brings a build of Yeti at the pin (ADR 0060).
- Never read or write a private `--_yeti-*` token (ADR 0004). The exceptions are the demo spec's two edge tokens and the Firefox scale workaround's `--_yeti-t` in `packages/ngx-yeti/accessibility.css` (departures table of the `ngx-yeti-specs` skill).

## Tokens in tests

No test depends on a public token's default value (ADR 0006 point 7). Compare against the token at run time instead: style a probe element with `inline-size: var(--yeti-space-md)` and compare computed sizes. A contrast assertion checks the WCAG ratio, never a colour value (ADR 0015 point 3).

## Reading Yeti

- `vendor/yeti/src/guides/*.md`: Yeti's own guides (theming, components, stability, migrating).
- `vendor/yeti/src/<kind>/<item>/`: each item's `<item>.css`, `docs.md`, `example.html` (Yeti's own markup, a starting point for stories), and `manifest.json`. `<kind>` is `layouts`, `recipes`, `components`, or `utilities`.
- `vendor/yeti/dist/yeti.manifest.json` after a build: `components` maps each item name to its class, `attributes` (name, vocabulary, values, default), markers, and `js[].events`. The specs' Contract mapping sections map these names to directive inputs and outputs.
- Specs cite Yeti as `Y/<path>:<line>` at the pin. For `src/`, `bin/`, and `schema/`, `vendor/yeti/<path>` is the same file. `Y/dist/...` exists only after `yeti-build`. `Y/test/...` is not vendored: read it at `https://github.com/foundation/yeti/blob/<pin>/<path>`, with the sha from `vendor/yeti/COMMIT`.

## Moving the pin

A pin move is one commit, and only a trigger in ADR 0006 point 5 starts one: a Yeti fix for a bug the package works around, a Yeti addition a spec needs, or a `v7.0.0-beta.0` tag or npm release. A new `develop` commit is not a trigger. Steps:

1. Check that the target commit is on `develop` and Yeti's CI passed on it.
2. `node tools/yeti/vendor-yeti.mjs <new full sha>` replaces `vendor/yeti` and `COMMIT`.
3. In a full Yeti clone checked out at the new pin, run `node bin/frozen.js <old full sha>`; it compares that ref with HEAD through `surfaceAt` and `compareSurfaces` and exits 1 on a break. Resolve each break in the same commit; add each addition the package exposes to its union (ADR 0005).
4. Diff what `frozen.js` does not read: `package.json` `exports` and `engines`, `schema/`, event `detail` keys and targets in the manifests, public token defaults in `src/tokens/tokens.json`, and the README's browser support.
5. Regenerate `packages/ngx-yeti/src/yeti-types.ts` and the rank table `packages/ngx-yeti/styles/src/yeti-rank.ts` with `npx nx yeti-sources ngx-yeti` (it runs `tools/yeti/generate-sources.mjs` after `yeti-build`) and commit both. `node tools/yeti/generate-sources.mjs --check` writes nothing and exits 1 when a committed output differs, and `packages/ngx-yeti/styles/src/yeti-rank.node.spec.ts` runs it. Then rerun ADR 0080's `NgxYeti` collision test against the names `dist/yeti.d.ts` exports, check that every vocabulary type still resolves, then run `npm run check`, the builds, and both e2e projects. `packages/ngx-yeti/src/yeti-manifest.node.spec.ts` pins the manifest's component count and fails when a pin move changes it.
6. Set `version` in `packages/ngx-yeti/package.json` to the new Yeti version and short sha in ADR 0017's format (`packages/ngx-yeti/src/version.node.spec.ts` fails until it matches), and add a `packages/ngx-yeti/CHANGELOG.md` entry that names the new full sha: a pin move is a changelog entry of its own (ADR 0017 point 1).
7. Update every file outside `docs/specs` and `vendor/yeti` that names the old sha, such as `packages/ngx-yeti/README.md`: `rg --hidden <old full sha> --glob '!docs/specs/**' --glob '!vendor/**' --glob '!.git/**'`. Search for the old short sha too.
8. The commit message names both shas and `frozen.js`'s summary line. A break that reaches the public API ships only on an Angular major (ADR 0017).
