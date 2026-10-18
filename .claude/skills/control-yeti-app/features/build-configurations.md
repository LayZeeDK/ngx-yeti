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

- No instance of this checkout is up (`node .claude/skills/control-yeti-app/scripts/control.mjs info --json` exits
  2), or run `node .claude/skills/control-yeti-app/scripts/control.mjs down --json` first: one instance per checkout.

Steps:

- **Development dev server.** Run `node .claude/skills/control-yeti-app/scripts/control.mjs up --json`, then
  `node .claude/skills/control-yeti-app/scripts/control.mjs doctor --json`. `doctor` reports `build` passing with
  `development build (window.ng present)` and a passing `hydration` check (measured 2026-10-15).
- **Production dev server.** Run `node .claude/skills/control-yeti-app/scripts/control.mjs down --json`, then
  `node .claude/skills/control-yeti-app/scripts/control.mjs up --configuration=production --json`, then
  `node .claude/skills/control-yeti-app/scripts/control.mjs doctor --json`. `doctor` reports
  `production build (window.ng absent)` and `hydration` skipped (measured 2026-10-15).
- **Production SSR.** Run `node .claude/skills/control-yeti-app/scripts/control.mjs down --json`, then
  `node .claude/skills/control-yeti-app/scripts/control.mjs up --mode=ssr --configuration=production --json`, then
  `node .claude/skills/control-yeti-app/scripts/control.mjs doctor --json`. `doctor` reports
  `production build (window.ng absent)`, `build-fresh` passing and `hydration` skipped (measured 2026-10-15).
- **Development SSR.** Run `node .claude/skills/control-yeti-app/scripts/control.mjs down --json`, then
  `node .claude/skills/control-yeti-app/scripts/control.mjs up --mode=ssr --configuration=development --json`, then
  `node .claude/skills/control-yeti-app/scripts/control.mjs doctor --json`. Use it for `@defer`, `hydrate never` and
  incremental-hydration cases: it serves built chunks, not the HMR dev server.
- **Proof.** Keep the `up` and `doctor` JSON in `<evidenceDir>` (redirect with `> <evidenceDir>/doctor.json`) and
  a screenshot from the item-routes recipe.

## Gotchas

- The `ssr` modes run Nx's `build` dependency first and share one output folder, `dist/apps/yeti-app`; switching
  configuration rebuilds it or restores it from the Nx cache. `build-fresh` trusts the Nx build that ran at launch
  and flags only files Git lists (tracked or untracked, not ignored) under `apps/yeti-app`, `packages/ngx-yeti` and
  `vendor/yeti` that changed after it; ignored output such as `node_modules`, `dist`, `storybook-static`,
  `vendor/yeti/docs` and Vitest's attachments and screenshots changes without changing the build.
- The dev server modes (`serve`) have no `build-fresh` check; `doctor` reads their `server.log` for errors instead
  (`build-log`).
- A build started by `up` and the e2e run (`npm exec nx -- e2e yeti-app-e2e`) write the same `dist` folder; do not
  run both at once in one checkout.
- The Tailwind C1 and C2 Fixture build configurations of the setup spec are `tailwind-c1` and `tailwind-c2` in
  `apps/yeti-app/project.json`, under `build` and `serve-ssr`. `scripts/control.mjs` does not launch them yet: its
  `--configuration` takes `development` or `production` only. `apps/yeti-app-e2e/src/tailwind.spec.ts` covers them
  (`FIXTURE_CONFIGURATION=tailwind-c1 npm exec nx -- e2e yeti-app-e2e`).
- Production frames can lose tokens to critical-CSS inlining (upstream bug A4); record such frames, do not treat
  them as a control-skill failure.
