---
name: ngx-yeti-stories
description: 'This skill should be used when writing or changing a Storybook story or play function in ngx-yeti, or when nx test-storybook fails: "write the stories for the alert", "story for a directive", "add a dark-scheme story", "axe fails on my story", "the story logged a console error", "switch off an axe rule", "add an anti-pattern story", "the hover assertion fails in the play function", "story id". Covers the axe story gate, story ids, how stories load Yeti, the colour-scheme decorator, anti-pattern exceptions, what play functions can and cannot assert, and the commands.'
---

# Stories and the story gate

Stories are test layer 1 (ADR 0014 point 1): the single home of interaction and accessibility tests. Typing rules for `Meta`, `StoryObj`, args, and awaited `play` assertions are in the `type-safety` skill, `rules/storybook-stories.md`. That file shows a component story; most Yeti items are attribute directives, which use the pattern under Directive stories.

## The story gate

`packages/ngx-yeti/.storybook/preview.ts` runs axe on every story through `@storybook/addon-a11y` with `parameters.a11y.test = 'error'` and `runOnly` set to `wcagTags` from `@ngx-yeti/testing` (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `best-practice`). Any violation fails the story's test in `nx test-storybook ngx-yeti`, which `npm run check`, `npm run affected`, and CI run. That is the enforcing check of ADR 0015 point 2.

- Never lower `test`, set `disable`, or switch off a rule to make a story pass. Fix the markup or the directive. A Yeti default that fails is a finding: record it, and the spec's ledger row decides the fix.
- The only exception is an **Anti-pattern story**: markup the package tells consumers not to write, shown to say why (`docs/specs/CONTEXT.md`). It switches off only the rules it demonstrates, and only when axe flags it:

  ```ts
  export const ArticleSlides: Story = {
    parameters: {
      a11y: { options: { rules: { 'aria-allowed-role': { enabled: false } } } },
    },
  };
  ```

  Story-level `options.rules` merges with the preview's `runOnly`, so every other rule still runs (verified: a story that switched off `button-name` and `image-alt` still failed on `link-name`).

- Axe reports some colour contrast as incomplete rather than failing (pseudo-element backgrounds, text over images). Those cases need a contrast assertion in the play function; see the `ngx-yeti-accessibility` skill.
- Any `console.error` during a story fails it too (`beforeEach` and `afterEach` in the preview), because Angular reports runtime errors there and keeps rendering. Fix the error; do not silence the console.
- Images: every static `<img>` uses `NgOptimizedImage`, and a plain `<img>` is only for a `data:` or `blob:` URL (building-blocks 1.2). `staticDirs` serves only `yeti-css/`, so use `data:` URLs, or add an images `staticDirs` entry in the change that first needs one. A missing image produced a false `scrollable-region-focusable` violation in Yeti's own axe run.

## Directive stories

`packages/ngx-yeti/src/lib/highlight/highlight.stories.ts` is the pattern:

```ts
const meta: Meta<YetiBadge> = {
  id: 'badge',
  component: YetiBadge,
  decorators: [moduleMetadata({ imports: [YetiBadge] })],
  args: { variant: 'info' },
  render: (args) => ({
    props: { badgeVariant: args.variant },
    template: '<span yetiBadge [variant]="badgeVariant">New</span>',
  }),
};
```

- Keep `component` (the `storybook/csf-component` lint rule wants it).
- Name template props differently from the directive's inputs. A prop named like an input collides with it once `component` is set; Angular logs `ctx.<input> is not a function`, which fails the story (measured).
- Story args are typed by `Meta<YetiBadge>`: signal inputs take their value type.
- Outputs are args set to `fn()` from `storybook/test`, bound in the template (`(closed)="onClosed($event)"` with `props: { onClosed: args.closed }`), so they log to the Actions panel and the play function asserts them: `await expect(args.closed).toHaveBeenCalledWith(...)` (`docs/specs/specs/events.md`; verified with a throwaway directive story).

## Story ids and files

- One `<item>.stories.ts` per item in `packages/ngx-yeti/<item>/src/`. Pin the id with `meta.id: '<item>'`, so story ids are `<item>--<story>` in kebab case (building-blocks 1.3). Use the ids the spec's Testing Decisions name; layer 4 opens the same ids.
- Do not set `title` (`storybook/no-title-property-in-meta`).

## How stories load Yeti

The preview imports `.storybook/styles.css`, the setup spec's global stylesheet (the `@layer yeti, ngx-yeti;` statement and Yeti's always-loaded files in the setup spec's order). `staticDirs` serves the built Yeti CSS under `yeti-css/`, as an application's `assets` entry does. An item's own CSS file loads through its directive (`injectYetiItemStyles`), never through a story import. Yeti is built before any Storybook target runs (`^yeti-build`).

## Colour schemes

A story renders in the light scheme. For the dark scheme, render the story on Yeti's dark page surface:

```ts
import { withColorScheme } from '../../.storybook/decorators';

export const DarkScheme: Story = {
  decorators: [withColorScheme('dark')],
};
```

The gate runs axe on that story like any other, so a dark-scheme story is how a spec's "axe in light and dark" is met. Play functions read computed colours from inside the wrapper.

## What a play function asserts

- DOM first: the class, `data-*` attributes and values, roles, ARIA, `hidden`, `open`, `inert` (building-blocks 1.12). Never instance fields.
- Every `expect` and `userEvent` call is awaited.
- Content requirements a directive cannot read are asserted in every story that shows them (ADR 0015 point 4), for example an alert's text naming its kind.
- `userEvent.hover` from `storybook/test` dispatches synthetic events and does not set `:hover` (measured: `matches(':hover')` stayed false). Assert anything that depends on CSS `:hover` in layer 2 (Vitest browser mode's `userEvent`) or layer 4 (Playwright), even where a spec lists it under layer 1.
- Media emulation (`prefers-reduced-motion`, `forced-colors`, print) belongs to layer 4 (building-blocks 1.12).
- Routing stories use `provideRouter` with `provideLocationMocks()` so the Storybook iframe's URL does not change.

## Commands

| Command                                  | What it runs                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `npx nx test-storybook ngx-yeti`         | Every story's render, play function, and axe gate; Chromium locally, three engines when `CI` is set |
| `npx nx test-storybook ngx-yeti -c fast` | The same with Analog `fastCompile`; run `npx nx typecheck ngx-yeti -c stories` beside it            |
| `npx nx storybook ngx-yeti`              | Storybook on port 4400, with the Accessibility panel                                                |
| `npx nx build-storybook ngx-yeti`        | The static build layer 4 opens                                                                      |

A green `test-storybook` says nothing about types; `typecheck` does (`references/fast-compile.md`).
