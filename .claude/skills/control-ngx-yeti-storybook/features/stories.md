# Stories

Every item of the package has `<item>.stories.ts` in `packages/ngx-yeti/<item>/src/`, and each export is a story with the id `<item>--<story>`. Opening a story renders the item in isolation in Storybook's `iframe.html`, with Yeti's global stylesheet from `.storybook/styles.css` and the item's own stylesheet loaded by its directive.

## Sub-features

- Open a story with its play function off (`embed=true`), to look at or drive the rendered state yourself.
- Open a story with its play function on (no `embed`), to see the state the play function leaves.
- Set args through the URL.
- List the story ids the running build has.

## How to get to it (user POV)

- `<url>/index.json`: every id the running build has, under `entries`. Read the ids from there (the command below) rather than from a list: each item adds its own.
- `<url>/iframe.html?id=<story-id>&viewMode=story&embed=true`: the story alone, no play function.
- `<url>/iframe.html?id=<story-id>&viewMode=story`: the story after its play function.
- `<url>/?path=/story/<story-id>`: the manager UI with the Accessibility and Interactions panels, for people.
- Layer 4 opens the same ids through `openStory` (`apps/ngx-yeti-e2e/src/open-story.ts`).

## Driving it with control-ngx-yeti-storybook

List the ids:

```bash
playwright-cli -s=control-ngx-yeti-storybook-static-4483 --raw eval "async () => Object.keys((await (await fetch('/index.json')).json()).entries)"
```

Open without the play function and check autoplay is off:

```bash
playwright-cli -s=control-ngx-yeti-storybook-static-4483 open "http://localhost:4483/iframe.html?id=card--stretched-link&viewMode=story&embed=true"
playwright-cli -s=control-ngx-yeti-storybook-static-4483 --raw eval "() => window.__STORYBOOK_PREVIEW__.currentRender.renderOptions.autoplay"
playwright-cli -s=control-ngx-yeti-storybook-static-4483 snapshot
```

Then drive it through the snapshot loop, for example `click "getByRole('button', { name: 'Save' })"`, a fresh `snapshot`, and a check that the button now reads "Saved" (the step the `StretchedLink` play function covers).

With args: `iframe.html?id=card--inputs&viewMode=story&embed=true&args=<name>:<value>`.

Use `open` for the first story of a session and `goto` for the next.

## Gotchas

- `sb-show-main` appears before the story finishes rendering; wait for the phase, as `openStory` does.
- `sb-show-errordisplay` on `body` means the story threw; `#error-message` holds the text.
- Storybook drops a URL arg with characters outside `[a-zA-Z0-9 _-]` (numbers, hex and colour strings excepted) with only a console warning.
- In PowerShell, prefix with `--%` so `&` does not cut the URL.
