# ngx-yeti Storybook feature map

What an agent can reach in the `ngx-yeti` Storybook and how to drive it with `control-ngx-yeti-storybook`. The Storybook's user is a reviewer or a pipeline agent walking a story; its features are opening a story, running its play function, and reading its axe result.

## Baseline preconditions

- `npm ci` has run in this checkout and `npx playwright install chromium` has installed the browser the doctor uses.
- `node .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs up --json` exited 0 and `doctor --json` exited 0.
- Default viewport 1280 x 720 (playwright-cli's default; the axe report records it). No auth, no seed data: stories are self-contained.
- Every playwright-cli command runs from the repository root with `-s=<session>` from `info`.

## Driving conventions

- Open stories in `<url>/iframe.html?id=<story-id>&viewMode=story`, with `&embed=true` when the play function must not run.
- Story ids are `<item>--<story>` in kebab case (`meta.id` pins the item, `ngx-yeti-stories`); `<url>/index.json` lists every id.
- Args go in the URL as `&args=<name>:<value>` (booleans `!true`); `openStory` in `apps/ngx-yeti-e2e/src/open-story.ts` lists the characters Storybook keeps.
- Take handles from a snapshot, not from the story template: directives add classes, roles and attributes at runtime.
- Wait on `window.__STORYBOOK_PREVIEW__.currentRender.phase` reaching `finished`, `errored` or `aborted`, or on the `storyFinished` event; never a fixed sleep.

## Proof and skip reporting

- Drive the story the way the reviewer does: open its URL, act through the page (`click`, `press`), not through component setters.
- Record the state after the action, not only the final screen: a snapshot after the play function or the action, plus a screenshot.
- Keep the story URL with the evidence; it reproduces the state.
- For a fix, run the same recipe on the parent commit in a second worktree (its own derived port) and on the change, then report one verdict: verified, not verified, or inconclusive.
- A recipe that passed once after a fix runs a second time before it counts.
- The play function and the axe report are the repeatable proof; a by-hand recipe that keeps proving the same thing is a candidate play function. Suggest it; do not write it uninvited.
- Name every entry point you could not reach and its missing prerequisite; never report it as covered through another path.
- Manual only: Angular DevTools checks; screen-reader output (playwright-cli reads the accessibility tree, not speech); real Safari (CI's `safari` job).

## Feature entry contract

Each feature file has an H1, one paragraph of user-visible behaviour, and four H2s: `Sub-features`, `How to get to it (user POV)`, `Driving it with control-ngx-yeti-storybook`, `Gotchas`.

## Features

| Feature                                         | File                |
| ----------------------------------------------- | ------------------- |
| Open a story by id, with or without play        | `stories.md`        |
| Run a story's play function and read its result | `play-functions.md` |
| Capture a story's axe result                    | `axe-results.md`    |
