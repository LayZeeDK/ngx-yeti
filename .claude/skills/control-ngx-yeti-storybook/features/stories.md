# Stories

Every item of the package has `<item>.stories.ts` in `packages/ngx-yeti/<item>/src/`, and each export is a story with the id `<item>--<story>`. The loader's stories are the exception: `packages/ngx-yeti/styles/src/setup.stories.ts` sets `meta.id: 'setup'`, so its ids are `setup--item-links` and `setup--shared-host`. Opening a story renders the item in isolation in Storybook's `iframe.html`, with Yeti's global stylesheet from `.storybook/styles.css` and the item's own stylesheet loaded by its directive.

## Sub-features

- Open a story with its play function off (`embed=true`), to look at or drive the rendered state yourself.
- Open a story with its play function on (no `embed`), to see the state the play function leaves.
- Set args through the URL.
- List the story ids the running build has.
- Claim that a story finished rendering (`renderFinished`, the pass condition `/lars-verify` runs).

## How to get to it (user POV)

- `<url>/index.json`: every id the running build has, under `entries`. Read the ids from there (the command below) rather than from a list: each item adds its own.
- `<url>/iframe.html?id=<story-id>&viewMode=story&embed=true`: the story alone, no play function.
- `<url>/iframe.html?id=<story-id>&viewMode=story`: the story after its play function.
- `<url>/?path=/story/<story-id>`: the manager UI with the Accessibility and Interactions panels, for people.
- Layer 4 opens the same ids through `openStory` (`apps/ngx-yeti-e2e/src/open-story.ts`).

## Driving it with control-ngx-yeti-storybook

Preconditions: the README baseline, on either flow. The commands use the example session and port 4483; take yours from `info`.

Open without the play function, wait for the render (the README's wait recipe), and check autoplay is off:

```bash
playwright-cli -s=control-ngx-yeti-storybook-wt-1a2b3c4d-static open "http://localhost:4483/iframe.html?id=card--stretched-link&viewMode=story&embed=true"
playwright-cli -s=control-ngx-yeti-storybook-wt-1a2b3c4d-static --raw run-code 'async function settled(page) { await page.waitForFunction(() => ["finished", "errored", "aborted"].includes(window.__STORYBOOK_PREVIEW__?.currentRender?.phase ?? "")); return page.evaluate(() => window.__STORYBOOK_PREVIEW__.currentRender.phase); }'
playwright-cli -s=control-ngx-yeti-storybook-wt-1a2b3c4d-static --raw eval "() => window.__STORYBOOK_PREVIEW__.currentRender.renderOptions.autoplay"
playwright-cli -s=control-ngx-yeti-storybook-wt-1a2b3c4d-static snapshot
```

List the ids, from a page open on the Storybook (`eval` needs an open session, and the fetch is relative to the page's origin):

```bash
playwright-cli -s=control-ngx-yeti-storybook-wt-1a2b3c4d-static --raw eval "async () => Object.keys((await (await fetch('/index.json')).json()).entries)"
```

Then drive it through the snapshot loop, for example `click "getByRole('button', { name: 'Save' })"`, a fresh `snapshot`, and a check that the button now reads "Saved" (the step the `StretchedLink` play function covers).

With args: `iframe.html?id=card--inputs&viewMode=story&embed=true&args=<name>:<value>`, several as `args=raised:!true;threshold:xs`. A value with a character Storybook drops, such as the `/` of `ratio`'s `4/3`, cannot pass through the URL: the story keeps its default and the console logs a warning.

Use `open` for the first story of a session and `goto` for the next, and run the wait recipe after each.

Claim that a story rendered and, with its play function on, played to the end. This is the pass condition `/lars-verify` runs; save it as `<evidenceDir>/renderFinished.js`:

```js
async function renderFinished(page) {
  const phase = () => page.evaluate(() => window.__STORYBOOK_PREVIEW__?.currentRender?.phase ?? 'none');
  try {
    await page.waitForFunction(() => ['finished', 'errored', 'aborted'].includes(window.__STORYBOOK_PREVIEW__?.currentRender?.phase ?? ''), undefined, { timeout: 30000 });
  } catch {
    throw new Error(`CLAIM: the render did not settle in 30 s (phase ${await phase()}, body ${await page.evaluate(() => document.body.className)})`);
  }
  const seen = await phase();
  const errorDisplay = await page.evaluate(() => document.body.classList.contains('sb-show-errordisplay'));
  if (seen !== 'finished' || errorDisplay) {
    throw new Error(`CLAIM: the render ended in phase ${seen}${errorDisplay ? ' with the error display' : ''}, not finished`);
  }
}
```

After `open` or `goto`, run `playwright-cli -s=<session> run-code --filename=<evidenceDir>/renderFinished.js`: it exits 0 on a story that finished. On a story that does not, it exits 1 and prints `Error: CLAIM: ...` with the phase it saw. For a verdict, with no instance of this checkout up, write a spec and run it:
`node tools/verification/lars-verify-spec.mjs --skill .claude/skills/control-ngx-yeti-storybook --feature stories --recipe renderFinished --open "/iframe.html?id=<story-id>&viewMode=story" --claim "<claim>" --out tmp/control-ngx-yeti-storybook/verify/stories/<run-id>/spec`, then `node ~/.claude/skills/lars-verify/scripts/verdict.mjs run --spec <that folder>/spec.json --out tmp/control-ngx-yeti-storybook/verify/stories/<run-id>/run`. The spec starts the static flow with `up --json` and stops it with `down`.

## Gotchas

- `sb-show-main` appears before the story finishes rendering; wait for the phase, as `openStory` does.
- `sb-show-errordisplay` on `body` means the story threw; `#error-message` holds the text.
- Storybook drops a URL arg with characters outside `[a-zA-Z0-9 _-]` (numbers, hex and colour strings excepted) with only a console warning.
- In PowerShell, prefix with `--%` so `&` does not cut the URL.
