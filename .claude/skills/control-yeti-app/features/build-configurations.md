# Build configurations

The Fixture app is served in four ways that differ in what a reader of the page can observe: the Vite dev server
or the built Node server, each in the development or production configuration. Only development builds expose
`window.ng` and log hydration diagnostics; production builds hash their bundles and inline critical CSS.

## Sub-features

- `serve-dev` runs `nx run yeti-app:serve:development` (HMR on, `window.ng` present).
- `serve-prod` runs `nx run yeti-app:serve:production`.
- `ssr-dev` builds with `build:development` and runs `node dist/apps/yeti-app/server/server.mjs`.
- `ssr-prod` builds with `build:production` and runs the same server; this is what the production e2e run uses.
- `build-detect` tells which build answers (`doctor` check `build`).

## How to get to it (user POV)

- A developer starts the app with one of the targets above; a reader opens `<url><item>` on it.

## Driving it with control-yeti-app

Preconditions:

- No instance of this checkout is up (`info` exits 2), or run `down` first: one instance per checkout.

- **Development dev server.** Run `node .claude/skills/control-yeti-app/scripts/control.mjs up --json`, then
  `doctor --json`. `doctor` reports `build: development` and a passing `hydration` check (measured).
- **Production SSR.** Run `node .claude/skills/control-yeti-app/scripts/control.mjs down --json`, then
  `node .claude/skills/control-yeti-app/scripts/control.mjs up --mode=ssr --configuration=production --json`, then
  `doctor --json`. `doctor` reports `build: production`, `build-fresh` passing and `hydration` skipped (measured;
  ready in 5 s on a cache hit).
- **Development SSR.** `up --mode=ssr --configuration=development`. Use it for `@defer`, `hydrate never` and
  incremental-hydration cases: it serves built chunks, not the HMR dev server.
- **Proof.** Keep the `up` and `doctor` JSON in `<evidenceDir>` (redirect with `> <evidenceDir>/doctor.json`) and
  a screenshot from the item-routes recipe.

## Gotchas

- The `ssr` modes run Nx's `build` dependency first and share one output folder, `dist/apps/yeti-app`; switching
  configuration rebuilds it or restores it from the Nx cache. `build-fresh` trusts the Nx build that ran at launch
  and flags only source files changed after it.
- A build started by `up` and the e2e run (`npm exec nx -- e2e yeti-app-e2e`) write the same `dist` folder; do not
  run both at once in one checkout.
- The Tailwind C1 and C2 Fixture build configurations of the setup spec do not exist yet in
  `apps/yeti-app/project.json`; when a task adds them, add them to `--configuration` in
  `scripts/control.mjs` and to this file.
- Production frames can lose tokens to critical-CSS inlining (upstream bug A4); record such frames, do not treat
  them as a control-skill failure.
