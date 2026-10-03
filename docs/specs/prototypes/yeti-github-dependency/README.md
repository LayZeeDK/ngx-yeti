# Prototype: Yeti as a dependency from GitHub at a pinned commit

Ticket: [21](../../issues/21-prototype-yeti-as-github-dependency.md). Pin: `foundation/yeti` commit `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, tip of `develop`, public).

## Question

Can the package, and an application that uses it, depend on Yeti's built CSS, JS modules and static files (`dist/`, manifest, tokens) from GitHub at a pinned commit, using `package.json` syntax, esbuild/Vite, or anything else?

## Facts about Yeti at that commit (from `package.json`, `.gitignore`, `git ls-files`)

- `dist/` is git-ignored: 0 tracked files under `dist/`. `scripts` has `build` but **no `prepare`, `prepack` or `postinstall`**.
- `files` is `["dist","LICENSE","README.md"]`; `exports` maps `.`, `./css/*`, `./js/*`, `./manifest`, `./tokens`, `./themes/*`, `./yeti.js` into `dist/`.
- `engines.node >=24`; build devDependencies are `esbuild`, `lightningcss`, `parse5`, `playwright`, `@axe-core/playwright`.
- `npm ci` + `npm run build` in a clone: exit 0, ~5 s each, writes 29 entries to `dist/`. `dist/js/*.js` are side-effect modules (no exports).

## How to run

Environment: Windows 11 arm64, Node 24.18.0, npm 11.16.0, Angular CLI 22.2 (`ng new base --defaults --ssr=false --style=css`, `CLAUDECODE` unset). Workspaces live in `D:/tmp/ngx-yeti-21/optA..optF`. `scripts/mk.sh <dir> [dep-spec]` copies the base app and adds `@import 'yeti-css/css/components/alert/alert.css'` to `styles.css` and `import 'yeti-css/js/tabs.js'` to `main.ts`. `scripts/check.sh <dir>` deletes `node_modules`, runs `npm ci`, `npx ng build`, then looks for markers in the output: `yeti.components` (the layer name in `alert.css`) in the built CSS and `yeti:select` (an event name in `tabs.js`) in the built JS. Each option dir holds its `package.json`, `styles.css`, `main.ts`, last build log lines and its lockfile entry.

## Results

All `npm ci` runs: clean `node_modules`, lockfile present. Times include Angular's own packages (about 14 s warm cache).

| Option | Dependency spec | `npm ci` | `dist/` + `exports` resolve | `ng build` + CSS/JS in output |
|---|---|---|---|---|
| A. npm git dep | `github:foundation/yeti#f52d1e8b9` | exit 0, 37 s (first install 96 s) | **No**: `node_modules/yeti-css` holds only `LICENSE`, `package.json`, `README.md` | exit 1, `Could not resolve "yeti-css/css/components/alert/alert.css"` |
| B. GitHub tarball URL | `https://codeload.github.com/foundation/yeti/tar.gz/f52d1e8b9` | exit 0, 14 s | **No**: same three files | exit 1, same error |
| C. `npm pack` of a local build | `file:vendor/yeti-css-7.0.0-alpha.0.tgz` | exit 0, 14 s | Yes | exit 0, 6 s; both markers found |
| D. git submodule + local build | `file:vendor/yeti` (symlink), submodule pinned by gitlink `f52d1e8b9` | exit 0 (18 s offline run) | Yes, only after `npm ci && npm run build` inside `vendor/yeti` | exit 0, 10 s; both markers found |
| E. fetch-and-build script (`prebuild`) | none; `scripts/fetch-yeti.mjs` does `git fetch --depth=1 <sha>`, `npm ci`, `npm run build` into git-ignored `.yeti/`; app imports `../.yeti/dist/...` | exit 0 | Files yes; the `exports` map is not used (relative paths) | `npm run build` exit 0, ~10 s including fetch/build; both markers found |
| F. git dep on a commit that adds `"prepare": "node bin/build.js"` (local test branch of my own clone, not Yeti's repo) | `git+file:///.../yeti-local#prep` | exit 0, 23 s | Yes (npm installs devDependencies and runs `prepare` for git deps) | exit 0, 7 s; both markers found |

Other tried or noted:

- A first attempt at E-as-postinstall (run `npm ci` and `build` inside `node_modules/yeti-css` from a git dep): `npm install` exit 1. The git/tarball install strips everything outside `files`, so there is no `package-lock.json` or `bin/` to build from.
- esbuild/Vite plugin: Angular's `@angular/build:application` builder exposes no plugin option in the workspace config (inferred from the generated `angular.json`; a third-party builder was not tried). A plugin would also not make `dist/` appear, because the missing step is building Yeti. Not built.

### Other fields

- **Reproducible from the lockfile.** A: lock entry `resolved: git+ssh://git@github.com/foundation/yeti.git#f52d1e8b93de...` (full sha; the `ssh` form needs SSH access to GitHub on a CI machine; `npm ci` worked here). B: `resolved` URL plus `integrity` sha512 (the tarball for a sha is stable). C: `file:` path plus integrity of the vendored `.tgz`, which is committed to the repo. D: lockfile says `link: true`; the pin is the submodule gitlink (`160000 f52d1e8b9...`), not the lockfile; the `dist/` is not reproducible from `npm ci` alone. E: the pin is the `sha` constant in the script. F: as A.
- **Offline after first install.** `npm ci --offline` with a warm cache and clean `node_modules`: A, B, C, D all exit 0 (14-18 s). E: `npm ci --offline` exit 0, and `npm run build` exit 0 offline once `.yeti/` exists. A cold E needs network to GitHub.
- **Install time.** See table; the pure delta of Yeti is small for A/B/C/D (~0 s once cached). Cold build of Yeti: `npm ci` 4.6 s + `build` 5.9 s on this machine.
- **What a downstream app of the package installs.** Inferred, not tested: if the package lists A, B or F in its `dependencies`, the app's `npm install` fetches Yeti the same way (A/B give no `dist/`). C and D use `file:` paths relative to the package repo, so they do not carry over to an app that installs the package from a registry; they would need the files bundled into the package (for example `bundledDependencies` or copying `dist/` into the package) which I did not try.
- **Licence and notice (ADR 0001).** Every option keeps Yeti's `LICENSE` with Yeti's files: the packed tarball (C) and the `files`-filtered installs (A, B, F) include `LICENSE` (checked: A/B list `LICENSE` in `node_modules/yeti-css`; the C tarball contains it). D and E keep the full clone including `LICENSE`. Any option that copies `dist/` into the package's own published files must also copy Yeti's `LICENSE`; nothing here does it.

## Verdict

Options that work end to end: C, D, E, and F (F needs a change in Yeti). A and B, the plain `package.json` git/tarball syntax, install but give no `dist/` and fail the build, because Yeti has no `prepare` script and `dist/` is not committed. The most reproducible without a Yeti change: C (one committed `.tgz` with an integrity hash; no network at install) but it makes the package repo hold a built artefact whose provenance is only as good as the build that made it; E and D pin by commit but rebuild from source (needs Node >= 24 and the network on first run). F is the cleanest if Yeti adds a `prepare` script.

## Unknowns

- Whether the Yeti maintainers would accept a `prepare` script (not asked; filing is gated).
- Downstream behaviour of C/D/E through a registry-published package (untested).
- Windows-only run; Linux CI not tried (the `git+ssh` lock URL in A matters there).
- Whether npm `--allow-scripts` handling changes with `prepare` for git deps in other npm versions (npm 11.16.0 only; the warnings listed only registry packages, not Yeti).
