# Axe results

`@storybook/addon-a11y` runs axe on every story after its play function, with `parameters.a11y.test = 'error'` and `runOnly` on the six `wcagTags` of `@ngx-yeti/testing` (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `best-practice`), and the `region` rule off (the addon's own default: `preview.ts` sets only `runOnly`, and the report's `toolOptions.rules` shows `region` disabled). A violation fails the story. This is the axe story gate of the `ngx-yeti-stories` skill; capturing its report is how a reviewer proves a story is axe-clean in the running Storybook.

## Sub-features

- Read the addon's own report for a story: status, violations, incomplete results, passes, and the rule options it ran with.
- Read the report for an anti-pattern story, which switches off only the rules it demonstrates.

## How to get to it (user POV)

- The manager UI's Accessibility panel at `<url>/?path=/story/<story-id>`, for people.
- The `storyFinished` event of the story's render, which carries the report in `reporters` (type `a11y`).
- `test-storybook` fails the story on a violation (`features/play-functions.md`).

## Driving it with control-ngx-yeti-storybook

Preconditions: the README baseline, on either flow; the story open without `embed=true`.

Open the story without `embed=true`, then capture the report with the `forceRemount` recipe in `features/play-functions.md`. The saved JSON has:

- `a11y[0].status`: `passed` or `failed`;
- `a11y[0].violations` and `a11y[0].incomplete`: rule ids;
- `reporters[0].result`: axe's full result (`testEngine` axe-core 4.13.0, `toolOptions` with the `runOnly` tags and `region` off, `testEnvironment` with the viewport, and the `violations`, `incomplete`, `passes` and `inapplicable` arrays with nodes).

Summarize a saved report:

```bash
node -e 'const r = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); console.log(JSON.stringify({ storyId: r.storyId, status: r.status, a11y: r.a11y }))' tmp/control-ngx-yeti-storybook/<run-id>/card--stretched-link.story-finished.json
```

Measured for `card--stretched-link`: `{"storyId":"card--stretched-link","status":"success","a11y":[{"status":"passed","violations":[],"incomplete":[],"passes":12}]}`.

For an anti-pattern story, run the same recipe with its id, for example `box--anti-pattern-low-contrast`, and read `reporters[0].result.toolOptions.rules`: measured `{"region":{"enabled":false},"color-contrast":{"enabled":false}}`, status `success`, a11y `passed` with 3 passes. Only the rule the story demonstrates is added to the addon's `region` default.

## Gotchas

- Axe reports some contrast as incomplete rather than failing (pseudo-element backgrounds, text over images); an `incomplete` id is not a pass. Those cases need a contrast assertion in the play function (`ngx-yeti-accessibility`).
- The report covers the state after the play function, not the first render.
- Layer 4's `expectNoAxeViolations` (`apps/ngx-yeti-e2e/src/axe.ts`) runs its own axe with the same tags; the addon's report is the layer-1 gate. Do not mix their results in one claim.
- A story-level `parameters.a11y.options.rules` merges with the preview's `runOnly`; read `toolOptions` in the report to see what ran.
