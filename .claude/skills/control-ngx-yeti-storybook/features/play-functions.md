# Play functions

A story's `play` function drives the rendered item and asserts on the DOM; it is test layer 1 (ADR 0014 point 1). Around every play function the preview (`packages/ngx-yeti/.storybook/preview.ts`) spies on `console.error` in `beforeEach` and fails the story in `afterEach` if it was called; the a11y addon then runs axe. Storybook reports the outcome as one status: `success`, or `error` when the play function threw, the console gate failed, or the axe report failed.

## Sub-features

- Run the play function once by opening the story without `embed=true`.
- Run it again and capture its status and reports with `forceRemount` and the `storyFinished` event.
- Run it as the repository's own test through `test-storybook`, without a server.

## How to get to it (user POV)

- `<url>/iframe.html?id=<story-id>&viewMode=story`: autoplay is on, the play function runs after render.
- The manager UI's Interactions panel at `<url>/?path=/story/<story-id>`, for people.
- `npm exec -- nx run ngx-yeti:test-storybook --skipNxCache -- <item>/src/<item>.stories.ts -t "<Story Name>"`: Vitest names each test after the story's display name (`StretchedLink` is `Stretched Link`).

## Driving it with control-ngx-yeti-storybook

Preconditions: the README baseline, on either flow; for the two browser recipes, the story open without `embed=true`. The commands use the example session and port 4483; take yours from `info`.

Run it once, wait for the render (the README's wait recipe), and read the end state:

```bash
playwright-cli -s=control-ngx-yeti-storybook-wt-1a2b3c4d-static open "http://localhost:4483/iframe.html?id=card--stretched-link&viewMode=story"
playwright-cli -s=control-ngx-yeti-storybook-wt-1a2b3c4d-static --raw run-code 'async function settled(page) { await page.waitForFunction(() => ["finished", "errored", "aborted"].includes(window.__STORYBOOK_PREVIEW__?.currentRender?.phase ?? "")); return page.evaluate(() => window.__STORYBOOK_PREVIEW__.currentRender.phase); }'
playwright-cli -s=control-ngx-yeti-storybook-wt-1a2b3c4d-static --raw eval "() => ({ phase: window.__STORYBOOK_PREVIEW__.currentRender.phase, autoplay: window.__STORYBOOK_PREVIEW__.currentRender.renderOptions.autoplay, errored: document.body.classList.contains('sb-show-errordisplay') })"
playwright-cli -s=control-ngx-yeti-storybook-wt-1a2b3c4d-static snapshot --filename=tmp/control-ngx-yeti-storybook/<run-id>/card--stretched-link.after-play.yml
```

`autoplay: true` and phase `finished` without the error display mean the play function ran to the end. For `card--stretched-link` the snapshot then shows the button named "Saved" and the paragraph "The hills page" (the play function clicks Save, then the stretched link).

Run it again with its status and reports, and save them (the story must be open without `embed=true`; with autoplay off, `forceRemount` renders without playing):

```bash
playwright-cli -s=control-ngx-yeti-storybook-wt-1a2b3c4d-static --raw run-code 'async function rerun(page) { return page.evaluate((storyId) => new Promise((resolve) => { const channel = window.__STORYBOOK_ADDONS_CHANNEL__; const timer = setTimeout(() => resolve({ storyId, status: "timeout" }), 60000); channel.once("storyFinished", (event) => { clearTimeout(timer); resolve({ storyId: event.storyId, status: event.status, a11y: event.reporters.filter((r) => r.type === "a11y").map((r) => ({ status: r.status, violations: r.result.violations.map((v) => v.id), incomplete: r.result.incomplete.map((v) => v.id), passes: r.result.passes.length })), reporters: event.reporters }); }); channel.emit("forceRemount", { storyId }); }), "card--stretched-link"); }' > tmp/control-ngx-yeti-storybook/<run-id>/card--stretched-link.story-finished.json
```

Measured result for `card--stretched-link`: `status: "success"`, a11y `passed`, no violations, no incomplete results, 12 passes. A play function that throws ends with `status: "error"` and empty `reporters` (Storybook 10.6.1 `preview/runtime.js`, read, not provoked).

Run it as the repository's test:

```bash
npm exec -- nx run ngx-yeti:test-storybook --skipNxCache -- card/src/card.stories.ts -t "Stretched Link"
```

Measured: 1 passed, every other story of the file skipped.

## Gotchas

- `run-code` has no `require` or `process`; return an object and redirect `--raw` output to the evidence file.
- Storybook runs the play function only when autoplay is on and the render is a remount; reloading an `embed=true` URL never plays it.
- `userEvent.hover` from `storybook/test` does not set CSS `:hover`; a play function cannot prove a hover style.
- A story that navigates (the stretched link's `routerLink`) stays on `iframe.html`: the stories use location mocks, so the routed page shows in the story's outlet.
