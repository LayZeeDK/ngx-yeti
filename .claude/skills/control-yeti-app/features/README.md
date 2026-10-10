# Fixture app feature map

The maintained recipes for walking the Fixture app (`apps/yeti-app`) with control-yeti-app. Read this index, then
the feature file that matches the case.

## Baseline preconditions

- Run every command from the checkout root.
- `node .claude/skills/control-yeti-app/scripts/control.mjs up --json` exited 0, and `doctor --json` exited 0 for
  the build the case needs (`build` says `development` or `production`).
- `node .claude/skills/control-yeti-app/scripts/control.mjs info --json` gives `url` (`http://localhost:<port>/sub/`),
  `session` (`control-yeti-app-<flow id>`) and `evidenceDir` (`tmp/control-yeti-app/<run-id>/`). The recipes write
  these as `<url>`, `<session>` and `<evidenceDir>`.
- Viewport: playwright-cli's default. Resize with `playwright-cli -s=<session> resize <w> <h>` where a case names
  320 px or another width.
- Never drive an instance this run did not start, except on purpose through `doctor --url`.

## Driving conventions

- Routes come from the registry `apps/yeti-app/src/app/fixtures/fixtures.ts`: every key `<item>` is a prerendered
  route `<url><item>` and a server-rendered route `<url>server/<item>` (`app.routes.ts`,
  `app.routes.server.ts`). Read the registry for the current keys: one per item (`box`, `card`, `stack`, ...) plus
  case routes such as `replay`, `setup-order` and `table-without-tbody`.
- Prefer roles and accessible names from a snapshot; then the package's runtime attributes
  (`data-ngx-yeti-item-<item>`, `data-ngx-yeti-styles`); CSS last.
- Snapshot, one action, fresh snapshot, check the change. Wait on an end state inside `run-code`, never a sleep.
- Recipe scripts for `run-code --filename` are saved under `<evidenceDir>`; the commands below are literal apart
  from the three placeholders.

## Proof and skip reporting

- Drive the path a reader of the Fixture app takes (a route URL, a click, a key), not component internals.
- Record the state before and after the action: a snapshot each, plus a screenshot with the `Welcome yeti-app`
  heading in view.
- Check the side effect next to the screen: item links in the head, the `jsaction` count, the hydration summary in
  the console, the URL.
- A recipe that passed once after a fix runs a second time before it counts.
- For a fix, run the same recipe on a baseline (the parent commit in a second worktree on its own derived port) and
  report one verdict: verified, not verified, or inconclusive.
- Name an entry point you could not reach and why; never report it as covered through another path.
- Manual only: Angular DevTools checks, real screen readers, engines other than this machine's Chromium.

## Feature entry contract

Each feature file has an H1, one paragraph of user-visible behavior, and four H2s in this order: `Sub-features`,
`How to get to it (user POV)`, `Driving it with control-yeti-app` (starting with `Preconditions:`), and `Gotchas`.

## Features

- [Item routes](./item-routes.md): the prerendered and server-rendered route of each fixture, its item links and a
  screenshot.
- [JavaScript off](./javascript-off.md): the same routes as server HTML with no script.
- [Hydration and replay](./hydration-and-replay.md): the hydration summary, `main.js` held back, and a click
  replayed after hydration.
- [Build configurations](./build-configurations.md): development and production builds through `serve` and
  `serve-ssr`.
