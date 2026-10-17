# ngx-yeti Storybook feature map

What an agent can reach in the `ngx-yeti` Storybook and how to drive it with `control-ngx-yeti-storybook`. The Storybook's user is a reviewer or a pipeline agent walking a story; its features are opening a story, running its play function, and reading its axe result.

## Baseline preconditions

- `npm ci` has run in this checkout and `npx playwright install chromium` has installed the browser the doctor uses.
- `node .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs up --json` exited 0 and `doctor --json` exited 0.
- Default viewport 1280 x 720 (playwright-cli's default; the axe report records it). No auth, no seed data: stories are self-contained.
- Every playwright-cli command runs from the repository root with `-s=<session>` from `info`.

## Driving conventions

- Every recipe runs on either flow, static or dev (`--dev`): take the URL and the session from `info` for the flow you started. The recipes show the example session `control-ngx-yeti-storybook-wt-1a2b3c4d-static` of a worktree's static flow on port 4483; the session is named per checkout and flow (`control-ngx-yeti-storybook-main-static` in the main checkout), never per port.
- Open stories in `<url>/iframe.html?id=<story-id>&viewMode=story`, with `&embed=true` when the play function must not run.
- Story ids are `<item>--<story>` in kebab case (`meta.id` pins the item, `ngx-yeti-stories`); `<url>/index.json` lists every id.
- Args go in the URL as `&args=<name>:<value>`, several joined with `;` (booleans `!true`); `openStory` in `apps/ngx-yeti-e2e/src/open-story.ts` lists the characters Storybook keeps.
- Take handles from a snapshot, not from the story template: directives add classes, roles and attributes at runtime.
- Wait after every `open` or `goto`, before reading anything, until the render settles; never a fixed sleep. The recipe returns the end phase, `finished`, `errored` or `aborted`:

```bash
playwright-cli -s=control-ngx-yeti-storybook-wt-1a2b3c4d-static --raw run-code 'async function settled(page) { await page.waitForFunction(() => ["finished", "errored", "aborted"].includes(window.__STORYBOOK_PREVIEW__?.currentRender?.phase ?? "")); return page.evaluate(() => window.__STORYBOOK_PREVIEW__.currentRender.phase); }'
```

## Proof and skip reporting

- Drive the story the way the reviewer does: open its URL, act through the page (`click`, `press`), not through component setters.
- Record the action and the state before and after it, not only the final screen: a snapshot before the action and one after the play function or the action (`<story-id>.before.yml`, `<story-id>.after-play.yml`), plus a screenshot.
- Check the side effects the action changes alongside the screen: the URL, the requests it sent (`requests`), and, for a story that navigates under a location mock, the routed content in its outlet (the iframe URL does not change).
- A story's location mock (`provideLocationMocks()`) proves the router navigated inside the story, not that the browser's URL changed or a page loaded: real navigation is a layer-4 claim on the Fixture app.
- Keep the story URL with the evidence; it reproduces the state.
- A verdict on a claim (verified, not verified or inconclusive, with a baseline for a fix) comes from `/lars-verify`, which runs a recipe such as `renderFinished` (`stories.md`) as its pass condition.
- A recipe that passed once after a fix runs a second time before it counts.
- The play function and the axe report are the repeatable proof; a by-hand recipe that keeps proving the same thing is a candidate play function. Suggest it; do not write it uninvited.
- Name every entry point you could not reach and its missing prerequisite; never report it as covered through another path.
- Screen-reader output is automated, not manual: `apps/screen-reader-e2e` runs real NVDA (CI's `nvda` job, and locally on Windows) and real VoiceOver in Safari (CI's `voiceover` job) on the static build's stories (ngx-yeti-testing, "Screen readers"); playwright-cli reads only the accessibility tree. Real Safari runs in CI's `safari` job.
- Manual only: Angular DevTools checks, and the manager UI's Accessibility and Interactions panels at `<url>/?path=/story/<story-id>`, which show the same report and play-function steps to people; drive `iframe.html` and read `storyFinished` instead.

## Feature entry contract

Each feature file has an H1, one paragraph of user-visible behaviour, and four H2s: `Sub-features`, `How to get to it (user POV)`, `Driving it with control-ngx-yeti-storybook`, `Gotchas`. The Driving section opens with a `Preconditions:` line.

## Features

| Feature                                         | File                |
| ----------------------------------------------- | ------------------- |
| Open a story by id, with or without play        | `stories.md`        |
| Run a story's play function and read its result | `play-functions.md` |
| Capture a story's axe result                    | `axe-results.md`    |
