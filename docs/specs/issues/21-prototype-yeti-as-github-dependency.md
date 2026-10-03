# 21. Prototype: Yeti as a dependency from GitHub at a pinned commit

Type: prototype
Status: resolved
Blocked by:
Labels: wayfinder:prototype
Map: ../map.md

## Question

Yeti is not on npm, and the user ruled that the package is built against a specific commit of `develop`. How can the package, and an application that uses it, depend on Yeti's built CSS, its JavaScript modules, and its static files (`dist/`, the manifest, and the token catalogue) from GitHub at that commit? The options are `package.json` syntax, esbuild, Vite, or anything else that works.

## User question, 2026-10-01

The user's own message to the orchestrator, verbatim:

> 27. Can we use package.json syntax or ESBuild/Vite to configure foundation/yeti as a JS/CSS/static dependency from GitHub?

## How to work it

Try each in an Angular 22.2 workspace under `D:/tmp/`, with npm as the package manager:

- an npm git dependency (`github:foundation/yeti#<commit>`, `git+https://...#<commit>`), and whether npm runs Yeti's `prepare` or `build` so that `dist/` exists;
- a GitHub tarball URL;
- `npm pack` of a local build;
- a git submodule;
- an esbuild or Vite plugin that fetches or resolves the files;
- anything the research finds.

Record for each:

- whether `dist/` and the `exports` map (`yeti-css/manifest`, `yeti-css/tokens`, `./css/*`, `./js/*`) resolve;
- whether `npm ci` is reproducible from the lockfile;
- install time;
- whether it works offline after the first install;
- what a downstream application of the package installs;
- licence and notice handling under [ADR 0001](../adr/0001-yeti-licence-compatible-with-mit-package.md).

Verify each with a real build that imports Yeti's CSS and one module. Capture under `prototypes/yeti-github-dependency/`, and append an `## Answer`. Decide nothing; [Decide: which Yeti version the specs target, and how the package tracks it](12-decide-yeti-version-policy.md) chooses.

## Answer

Resolved 2026-10-01 by Sonnet 5.5. Capture and commands: [prototypes/yeti-github-dependency/README.md](../prototypes/yeti-github-dependency/README.md). Pin: `f52d1e8b9`; Angular 22.2, npm 11.16.0, Node 24.18.0; every option checked with `npm ci` from a clean `node_modules` and `ng build` importing `yeti-css/css/components/alert/alert.css` and `yeti-css/js/tabs.js`.

- **Plain `package.json` syntax fails.** `github:foundation/yeti#f52d1e8b9` and the codeload tarball URL both install (`npm ci` exit 0) but leave only `LICENSE`, `package.json` and `README.md` in `node_modules/yeti-css`; `ng build` exits 1 with an unresolved import. Cause: `dist/` is git-ignored (0 tracked files) and Yeti has no `prepare` script.
- **`npm pack` of a local build works** (`file:vendor/yeti-css-7.0.0-alpha.0.tgz`): `npm ci` exit 0 in 14 s, `exports` resolve, `ng build` exit 0, CSS and JS markers found in the output. The lockfile carries an integrity hash; the tarball is a committed built artefact.
- **A git submodule at the commit works** (`file:vendor/yeti`, symlink): `ng build` exit 0, but only after `npm ci && npm run build` inside the submodule, which `npm ci` of the app does not do. The pin is the gitlink, not the lockfile.
- **A fetch-and-build script (`prebuild`: `git fetch --depth=1 <sha>`, `npm ci`, `npm run build` into `.yeti/`) works**: `npm run build` exit 0 and markers found, with relative imports (the `exports` map is not used). Needs Node 24 and GitHub on first run.
- **A git dependency works if Yeti adds `"prepare": "node bin/build.js"`** (tested on a local test branch of my own clone, not Yeti's repo): `npm ci` exit 0, `exports` resolve, `ng build` exit 0. Without a Yeti change this is unavailable.
- **Offline:** `npm ci --offline` with a warm cache exits 0 for the git, tarball, pack and submodule options. No esbuild/Vite plugin was built: the Angular builder takes none (inferred from the generated `angular.json`), and the missing step is building Yeti, not resolving it.
- **Unknowns:** downstream apps installing the package from a registry with `file:`-based options (untested); Linux CI (the git lock entry uses `git+ssh`); licence handling is Yeti's `LICENSE` travelling with the files in every option, but copying `dist/` into the package's own files was not tried.
