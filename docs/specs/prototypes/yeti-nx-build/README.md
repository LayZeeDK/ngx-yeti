# Prototype: building, consuming, and theming Yeti from a pinned commit with Nx

Ticket: [22](../../issues/22-prototype-building-and-consuming-yeti-with-nx.md). Pin: `foundation/yeti` commit `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`). Builds on [ticket 21's capture](../yeti-github-dependency/README.md).

## Question

How does an Nx workspace build Yeti from a pinned `develop` commit, and consume and theme it, the way Yeti's own docs expect in this pre-release stage? It must work on Nx 23.2 today and still work under Nx 24.

## Step 1: what Yeti's own docs say (read in `github.com/foundation/yeti` at `f52d1e8b9`)

Building:

- `README.md:20`: "Zero build, ever. ... The repository's own `npm run build` concatenates the source and writes a minified copy beside it; nobody using Yeti has to run it."
- `README.md:36-40`: to try it today, link the unbuilt `src/yeti.css`, or install the package and follow the install guide.
- `src/guides/install.md:40`: "Yeti is not released yet. There is no package on npm and nothing to download".
- `src/guides/install.md:44`: "To try Yeti before the release, clone the repository and run `npm run build`. That writes the same `dist/` the package will ship".
- `bin/build.js:2-3`: "Produces dist/ ... Concatenation only. No transforms." It runs the validator (`:34`), concatenates `src/yeti.css`'s import tree (`:22-31`), minifies the CSS with lightningcss (`:46`) and the JS bundle with esbuild (`:66`), copies `src/` to `dist/css/` (`:95-99`), themes, starter and modules (`:101-135`), and writes the manifest, tokens, IDE data, types and `llms*.txt` (`:137-163`).
- `package.json`: `"build": "node bin/build.js"`; no `prepare`/`prepack`/`postinstall`; `engines.node >=24`; devDependencies `esbuild 0.25.12`, `lightningcss`, `parse5`, `playwright`, `@axe-core/playwright`. `version` is `7.0.0-alpha.0` while `README.md:9` says `7.0.0-beta`.

Consuming:

- `src/guides/install.md:48-59`: one `<link>` to `node_modules/yeti-css/dist/yeti.css`, before your own styles; a theme is a second stylesheet after it.
- `src/guides/install.md:74-105`: a custom build: copy `dist/css/yeti.css` (a list of `@import`s), delete lines, then `npx esbuild site.css --bundle --minify --outfile=site.min.css`. Four groups must stay (`:90-95`).
- `src/guides/install.md:107-122`: scripts need no build; to ship one file, list `import "yeti-css/js/<module>.js"` in `site.js` and run `npx esbuild site.js --bundle --minify`. Paths must be `yeti-css/js/...` because of the `exports` map.
- `src/guides/install.md:142-152` and `src/guides/components.md:235-239`: each of nine modules is a `<script type="module">` with no init call, safe on a page without its component.
- So esbuild in the docs is for the optional custom (subset) build; `npm run build` in a clone is the pre-release step.

Theming:

- `src/guides/theming.md:11`: "Yeti is themed by setting tokens, not by editing CSS ... Set them on `:root` in your own stylesheet, after Yeti's".
- `src/guides/theming.md:26-30, :38`: hues and chroma are inputs and work only on `:root`; derived colors (`--yeti-color-primary`) can be overridden on any element.
- `src/guides/theming.md:87-115`: a theme file is `:root` token blocks outside any layer plus element rules inside `@layer yeti.theme`; it repeats the layer order statement; class selectors are refused by the validator.
- `src/guides/theming.md:117-127` and `src/guides/components.md:247`: component tokens (`--yeti-button-radius` and others) are the skin surface; the example sets `--yeti-hue-primary: 30` and `--yeti-button-radius: var(--yeti-radius-full)`.
- `src/guides/color.md:15, :30-48`: six hues and one chroma derive every color at runtime; setting a derived color directly gives up the contrast promise for that role.
- Docs site (fetched 2026-10-01): https://www.foundationcss.com/yeti/ "Quick Start" says "Yeti is not released yet, so there is nothing to install ... until then it says how to build `dist/` from the repository"; https://www.foundationcss.com/yeti/guides/install/ (plain fetch; markdown.new refused that URL) carries the same "Getting the files" and `npx esbuild site.css` text as `install.md`; https://www.foundationcss.com/yeti/guides/theming/ matches `theming.md`.

## Step 2: Nx docs (the `nx_docs` MCP tool returned HTTP 500 twice; read nx.dev through markdown.new)

- https://nx.dev/docs/concepts/inferred-tasks, section "Inferred tasks": plugins read tool configuration and create tasks; Nx merges inferred, `targetDefaults` and project configuration, later winning.
- https://nx.dev/docs/extending-nx/project-graph-plugins, sections "Create projects and tasks" and "Verify your plugin": a plugin exports `createNodes`, a tuple of a glob and a function that receives all matching files in one batch; targets take `command`, `cache`, `inputs`, `outputs`, `dependsOn` as in `project.json`; restart the daemon (`NX_DAEMON=false`) to pick up plugin changes.
- In `nx@23.2.1`'s `dist/src/project-graph/plugins/public-api.d.ts`: `createNodes` now has the batch signature; `createNodesV2` and `CreateNodesFunctionV2` are `@deprecated`, and `CreateNodesResultV2` "will be removed in Nx 24". So a plugin written for 23.2 exports `createNodes`, not `createNodesV2`.
- https://nx.dev/blog/look-mum-no-executors, sections "What is being removed" and "Executors removed in Nx v24": kept are `nx:run-commands`, the `@nx/js` build executors, `@nx/esbuild:esbuild`, every `@nx/angular` executor; removed include `@nx/vite:*`, `@nx/vitest:test`, `@nx/jest:jest`, `@nx/eslint:lint`, `@nx/playwright:playwright`, `@nx/storybook:*`, `@nx/webpack:*`, `@nx/rollup:rollup`, `@nx/rspack:*`.
- Nx 24 is not on npm (orchestrator's finding, 2026-10-01: `latest` 23.2.1, `next` 23.3.0-beta.7). The user's ruling, recorded in the map's Notes: "41. Approve recommendation." The recommendation was to stay on 23.2, use only what v24 keeps, run `nx g infer-targets`, and check no target uses an executor on the removal list. Nothing here ran on Nx 24.

## How to run

Windows 11 arm64, Node 24.18.0, npm 11.16.0. Workspace `D:/tmp/ngx-yeti-22/ws` made with `npx create-nx-workspace@23.2.1 ws --preset=angular-monorepo --appName=demo --style=css --bundler=esbuild --ssr=false` (Angular 22.1, `CLAUDECODE` unset). Yeti is a copy of the local clone checked out at the pin, with `.git` removed, at `vendor/yeti`, listed in the root `workspaces` and as dependency `yeti-css`. The decisive files are under [`workspace/`](workspace/); the scripts under [`scripts/`](scripts/):

- `scripts/move-pin.sh <sha>`: replace `vendor/yeti` with a copy of the clone at another commit, then print changed files, `nx show projects --affected --base=HEAD`, and the `nx build demo` cache line.
- `scripts/v24-check.mjs <ws>`: list every target's executor and flag any on the v24 removal list. Output: [`results/v24-check.txt`](results/v24-check.txt).
- `scripts/theme-check.mjs <ws>`: serve `dist/apps/demo/browser` and a control page (Yeti alone), read the `.button`'s computed radius, background and `--yeti-hue-primary` in Chromium, Firefox and WebKit. Output: [`results/theme-check.txt`](results/theme-check.txt).

## Step 3 and 4: options, measured

Each "run 1 / run 2" is the same command twice; "restore" is run 3 after deleting the outputs.

| Option | Target and executor | Run 1 | Run 2 | Cache inputs / outputs | Pin moves (`nx affected`) |
| --- | --- | --- | --- | --- | --- |
| A1. Nx's own inference of Yeti's `package.json` scripts (no config) | `yeti-css:build`, `nx:run-script` (`npm run build`) | exit 0, 3.7 s | exit 0, 3.0 s, **0/1 hit**: script targets are not cached | none / none | Yeti and dependents affected |
| A2. A1 plus `targetDefaults["nx:run-script"] = { cache: true, inputs: ["default"], outputs: ["{projectRoot}/dist"] }` | same | exit 0 | exit 0, 1/1 hit; restore from cache after `rm -rf dist`: hit, 18 entries back | all project files / `dist` (the default applies to every script target in the workspace, 13 of them in Yeti) | as A1 |
| B. Local inferred-tasks plugin [`tools/yeti-plugin.cjs`](workspace/tools/yeti-plugin.cjs) (`createNodes`, glob `**/schema/manifest.schema.json`, checks `name === "yeti-css"`) | `yeti-css:yeti-build`, `nx:run-commands` (`node bin/build.js`, `cwd` the Yeti root) | exit 0, 1.2 s | exit 0, 169 ms, 1/1 hit; restore after `rm -rf dist`: `[local cache]`, 18 entries back | `src/**`, `bin/**`, `schema/**`, `package.json`, external `esbuild`, `lightningcss`, `parse5` / `{projectRoot}/dist` | Pin `f52d1e8b9` to `f63dfa910` (only `test/` differs): `["yeti-css","demo"]` affected, `yeti-build` **cache hit**, `demo:build` miss. Pin to `4f02c4b9f` (`src/guides/install.md` differs): both miss, then both hit on the next run |
| B, consumed by an Angular app (`apps/demo`) | `demo:build`, `@angular/build:application`, `dependsOn: ["^yeti-build"]` | exit 0, 2 tasks, 0/2 | exit 0, **2/2 hit** | the graph edge `demo -> yeti-css` is `static`, found from `import 'yeti-css/js/tabs.js'` in `main.ts` | see row above |
| C. `npm pack` of the built Yeti (ticket 21 option C), as a second plugin target | `yeti-css:yeti-pack`, `nx:run-commands`, `dependsOn: ["yeti-build"]` | exit 0, writes `dist/yeti-pack/yeti-css-7.0.0-alpha.0.tgz` (263 `package/dist/` entries) | exit 0, 2/2 hit | `yeti-build` outputs + `package.json` / `dist/yeti-pack` | as B; but the app installs the `.tgz` with `npm ci`, which runs before any Nx task, so the tarball has to be committed (as in ticket 21) and re-packed by hand when the pin moves |
| D. Git submodule at the pin (ticket 21 option D), same plugin | as B | exit 0, `yeti-build` and `demo:build` both missed after converting the folder (not explained) | 2/2 hit | as B | Submodule moved to `f63dfa910`: `git status` shows only ` M vendor/yeti`; affected `["yeti-css","yeti-custom","demo"]`, both uncommitted (`--base=HEAD`) and committed (`--base=HEAD~1 --head=HEAD`); `yeti-build` hit, `demo:build` miss. Needs `npm install` after each move (the submodule checkout drops Yeti's nested `node_modules`) |
| E. Fetch-and-build (ticket 21 option E) as an Nx project [`tools/yeti-fetch`](workspace/tools/yeti-fetch/) | `yeti-fetch:yeti-build`, `nx:run-commands` (`git fetch --depth=1` the sha in `yeti.pin`, `npm ci --ignore-scripts`, `npm run build` in `.yeti/`) | exit 0, 78 s (network) | exit 0, 13 s wall, 1/1 hit; restore after `rm -rf .yeti`: `[local cache]`, only `.yeti/dist` comes back | `yeti.pin`, `fetch-yeti.mjs` / `.yeti/dist` | `yeti.pin` changed to `f63dfa910`: `["yeti-fetch","demo-e"]` affected, 0/2 hits; back to the pin: 2/2 hits |
| E, consumed by `apps/demo-e` (relative imports `../../../.yeti/dist/...`, `implicitDependencies: ["yeti-fetch"]`) | `demo-e:build` | exit 0, 1/2 | exit 0, 2/2 hit | edge is `implicit` (no package import to detect) | as above |
| F. Git dependency with a `prepare` script (ticket 21 option F) | not built | - | - | - | Needs a change in Yeti; npm runs the build at install, so there is no Nx step to measure |
| G. `@nx/esbuild:esbuild` for the docs' custom build (`libs/yeti-custom`: `site.css` = Yeti's import list minus tooltip, carousel, demo; `site.js` = dialog + tabs) | `custom-css`, `custom-js`, `dependsOn: ["^yeti-build"]` | exit 0 | exit 0, but **0 hits** until `cache: true` and `inputs` were added to the target (then 3/3 hit) | `{projectRoot}/**` + dependent outputs / `outputPath` | via `implicitDependencies: ["yeti-css"]` |
| G, CSS output name | `custom-css` | the CSS bundle (132,672 bytes, starts with Yeti's `@layer` statement) is written as `site.js` | attempt 2 `outputFileName: "site.min.css"` gives `site.min.js`; attempt 3 `esbuildOptions.outExtension {".js": ".css"}` still `site.min.js` | - | - |
| G2. The docs' own command through `nx:run-commands` | `custom-css-cli`: `esbuild libs/yeti-custom/site.css --bundle --minify --outfile=.../site.min.css` | exit 0, `site.min.css` 132,672 bytes (same size as G) | exit 0, 2/2 hit | `site.css`, dependent outputs, external `esbuild` / output folder | as G |

Does Yeti's build reduce to esbuild? No: `bin/build.js` validates, concatenates, minifies CSS with lightningcss and only uses esbuild to minify the JS bundle, then writes the manifest, tokens, types and IDE files. `@nx/esbuild:esbuild` can only stand in for the consumer-side custom build (G), and for CSS it names the file `.js`. The esbuild run by G2 is the workspace's hoisted 0.28.2 (Angular's), not Yeti's pinned 0.25.12.

Angular build output, checked for every app build above: `rg` finds `yeti.components` in `dist/apps/demo/browser/styles-*.css` and `dist/apps/demo-e/browser/styles-*.css`, `--yeti-hue-primary: 30` in the demo's styles, and `yeti:select` (from `tabs.js`) in `main-*.js` of both.

Gotchas found:

- A plugin target named `build` (attempt 1, `options.targetName: "build"`) loses to Nx's `package.json` script inference: `nx show project yeti-css` kept `executor: nx:run-script` and only merged the description, so B uses `yeti-build`.
- With the generated `dependsOn: ["^build"]`, `nx build demo` ran three tasks: the uncached `yeti-css:build` script every time, plus `yeti-build`, plus the app (run 2: 2/3 hits). Replacing it with `["^yeti-build"]` gave two tasks and 2/2 hits.
- The generated `inputs: ["production", "^production"]` hashes every file of the Yeti project into the app, so a pin move that changes only Yeti's tests still rebuilds the app (B and D rows).
- A target given `options.commands` but no `command` needs `executor: "nx:run-commands"`; without it the target ran as a no-op and exited 0 (pack, attempt 1). `npm pack --pack-destination` fails with `ENOENT` if the folder does not exist.
- With `vendor/yeti`'s nested `node_modules` deleted, `node bin/build.js` still ran, resolving the workspace's esbuild instead of Yeti's pinned one.

Nx v24 check (the user's ruling "41. Approve recommendation."): `npx nx g infer-targets` printed "No inference plugin found" (exit 0; nothing to convert). [`results/v24-check.txt`](results/v24-check.txt): 26 targets, 0 on the removal list. Executors in use: `nx:run-commands`, `nx:run-script`, `@nx/esbuild:esbuild`, `@angular/build:application`, `@angular/build:dev-server`, and two not named in the blog post's keep list: `@nx/web:file-server` (generated `serve-static`) and `@nx/js:release-publish` (inferred `nx-release-publish`).

## Step 4: what an application of the package adds

Inferred from the runs above; checked only for this workspace's app.

- B (plugin): the plugin file and its `nx.json` `plugins` entry; Yeti as a workspace package (`workspaces` + `"yeti-css"` dependency) so `yeti-css/...` resolves through the `exports` map; `@import 'yeti-css'` (or a `styles` entry) and one `import 'yeti-css/js/<module>.js'` per module; `dependsOn: ["^yeti-build"]` on the app's build target.
- A2: the same minus the plugin, plus the `nx:run-script` target default.
- C: the committed `.tgz` and a `file:` dependency; Nx can only produce it, not install it.
- D: the submodule, `npm install` after each move, and B's configuration.
- E: the fetch project, relative `../.yeti/dist/` imports (no `exports` map), `implicitDependencies`, Node >= 24 and GitHub access on a cold cache.
- G/G2: a library with `site.css`/`site.js` and an esbuild target; the app then has to load the bundle itself (not tried as an Angular `styles` entry).

## Step 5: theming, three browsers

`apps/demo/src/styles.css` imports Yeti, then sets `--yeti-hue-primary: 30` and `--yeti-button-radius: var(--yeti-radius-full)` on `:root` outside any layer, as `theming.md:11` and `:117-127` describe. The component is `<button class="button" data-variant="primary">`. [`results/theme-check.txt`](results/theme-check.txt), exit 0:

| Browser | Themed radius / background / hue | Control (Yeti alone) |
| --- | --- | --- |
| Chromium 153.0.8010.12 | `9999px` / `oklch(0.52 0.15 30)` / `30` | `9px` / `oklch(0.52 0.15 250)` / `250` |
| Firefox 155.0 | same | same |
| WebKit 26.6 | same | same |

## Verdict

Options that build, cache (second run a cache hit), and put Yeti's CSS and a module into an Angular build on Nx 23.2.1: A2, B, C (build and pack only; installing the tarball stays outside Nx), D, E. A1 builds but never caches. G (`@nx/esbuild:esbuild`) builds the docs' custom subset, but it cannot replace Yeti's own build and writes the CSS bundle with a `.js` name after three attempts; G2 (the docs' esbuild command through `nx:run-commands`) does the same job with a `.css` name. F needs a change in Yeti. Every target uses only executors the v24 post keeps, or Nx's own `nx:run-script`. This records results only; [ticket 12](../../issues/12-decide-yeti-version-policy.md) decides.

## Unknowns

- Nothing ran on Nx 24, which is not published. Whether `nx:run-script` (A1/A2), `@nx/web:file-server`, and `@nx/js:release-publish` survive is not stated in the blog post.
- Why the first build after the submodule conversion (D) missed the cache with the same file contents.
- The `nx_docs` MCP tool failed (HTTP 500), so the Nx citations are nx.dev pages as fetched on 2026-10-01.
- Windows only; Linux CI, the Nx daemon on CI, and remote cache were not tried.
- An app consuming the package from a registry (not from the workspace) was not tried; ticket 21's unknowns still apply.
- G's CSS bundle as an Angular `styles` entry, and Yeti's `themes/*.css` route, were not tried.
