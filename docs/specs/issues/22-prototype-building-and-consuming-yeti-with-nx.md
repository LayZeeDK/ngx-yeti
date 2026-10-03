# 22. Prototype: building, consuming, and theming Yeti from a pinned commit with Nx

Type: prototype
Status: resolved
Blocked by: 21
Labels: wayfinder:prototype
Map: ../map.md

## Question

How does an Nx workspace build Yeti from a pinned `develop` commit, and consume and theme it, the way Yeti's own documentation expects in its alpha stage? It must do so with Nx 23.2 today and still work under Nx 24, which removes most built-in executors in favour of inferred tasks.

## User instruction, 2026-10-01

The user's own message to the orchestrator, verbatim:

> 31. As written in Yeti's documentation, it is expected that in this alpha stage, the consumer must run npm build in the repo and `esbuild` locally to use their CSS (and JS). If we need to compile it, we can use an `@nx/*` plugin/executor to automate this process. Note that Nx 24 was just released and removes all/most executors, replacing them with inferred task plugins. Read its docs and README on building, consuming, and customizing/theming it.

The user then pointed at https://nx.dev/blog/look-mum-no-executors. The orchestrator's summary is in the map's Standing rulings: v24 is announced, not yet released, and it keeps `nx:run-commands`, `@nx/esbuild:esbuild`, the `@nx/js` build executors, and every `@nx/angular` executor.

## How to work it

1. Read Yeti's own documentation on building, consuming, and customising or theming, and cite each with `file:line`:
   - `README.md`;
   - `src/guides/install.md`, `theming.md`, `color.md`, and `components.md`;
   - `bin/build.js` and the `package.json` scripts;
   - the docs site pages at https://www.foundationcss.com/yeti/.
2. Read the Nx docs on inferred tasks and on writing an inferred-tasks plugin (`createNodesV2`), through the `nx_docs` tool or nx.dev, citing the pages.
3. In a workspace under `D:/tmp/` with Yeti at `f52d1e8b9`, build and measure:
   - an inferred target for Yeti's build: a small local plugin, or `nx:run-commands` over Yeti's `npm run build`;
   - `@nx/esbuild:esbuild`, if Yeti's build reduces to esbuild;
   - the [Prototype: Yeti as a dependency from GitHub at a pinned commit](21-prototype-yeti-as-github-dependency.md) options that need a build step.
4. For each, record cache inputs and outputs, `nx affected` behaviour when the pin moves, and what an application of the package must add.
5. Theme one component with Yeti's documented mechanism, and confirm it in Chromium, Firefox, and WebKit.

Capture under `prototypes/yeti-nx-build/`, and append an `## Answer`. Decide nothing; [Decide: which Yeti version the specs target, and how the package tracks it](12-decide-yeti-version-policy.md) chooses.

## Answer

Resolved 2026-10-01 by Opus 5.5. Capture, commands and per-option table: [prototypes/yeti-nx-build/README.md](../prototypes/yeti-nx-build/README.md). Nx 23.2.1, Angular 22.1, Node 24.18.0, npm 11.16.0, Yeti copied from the clone at `f52d1e8b9`.

- **Yeti's docs:** before release, "clone the repository and run `npm run build`" (`src/guides/install.md:44`); esbuild is only for an optional subset build of `site.css`/`site.js` (`install.md:74-122`); the README calls Yeti zero-build (`README.md:20`). Theming is token values on `:root` after Yeti, outside any layer, with component tokens as the skin surface (`theming.md:11`, `:87-127`).
- **Yeti's build does not reduce to esbuild:** `bin/build.js` validates, concatenates, minifies CSS with lightningcss, uses esbuild only for the JS bundle, and writes the manifest, tokens and types.
- **Local inferred-tasks plugin (`createNodes`, `nx:run-commands` over `node bin/build.js`) works:** exit 0, second run a cache hit (169 ms), `dist/` restored from cache, and the Angular app's build depends on it through a detected static edge (2/2 hits). In 23.2.1 `createNodesV2` is deprecated; `createNodes` has the batch signature.
- **Nx's own `package.json` script inference (`nx:run-script`) builds but never caches** until a `targetDefaults["nx:run-script"]` entry adds `cache` and `outputs`, and it takes the `build` name, so the generated `^build` dependency runs it every time.
- **Ticket 21's options as Nx targets:** pack (C), submodule (D) and fetch-and-build (E) all build, cache, and reach the Angular output; a moved pin marks Yeti and its apps affected in each (D's gitlink change included). C's tarball still has to be installed by `npm ci` before Nx runs; F needs a Yeti change.
- **`@nx/esbuild:esbuild`** builds the docs' custom subset, but writes the CSS bundle as `site.js` after three attempts; the docs' `esbuild` command through `nx:run-commands` gives `site.min.css` and caches.
- **Nx 24:** not published, so nothing ran on it (the user's ruling: "41. Approve recommendation."). `nx g infer-targets` found nothing to convert; 0 of 26 targets use a removed executor; `nx:run-script`, `@nx/web:file-server` and `@nx/js:release-publish` are not on the blog post's keep list either.
- **Theming:** `--yeti-hue-primary: 30` and `--yeti-button-radius: var(--yeti-radius-full)` on `:root` turned the button to `9999px` / `oklch(0.52 0.15 30)` (Yeti alone: `9px` / hue 250) in Chromium 153, Firefox 155 and WebKit 26.6.

Note, 2026-10-01 (audit 0002, L4, L14): the prototype ran on Angular 22.1, the version the preset pins, not 22.2; that it works on 22.2 is inferred. "0 of 26 targets use a removed executor" covers this prototype's targets only.
