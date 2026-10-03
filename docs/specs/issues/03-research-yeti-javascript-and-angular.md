# 03. Research: Yeti's JavaScript modules and what Angular adds

Type: research
Status: resolved
Blocked by:
Labels: wayfinder:research
Map: ../map.md

## Question

How much of Yeti is JavaScript, what does each module do, and what would Angular add beyond replacing it? The stability guide names the optional modules: `alert.js`, `tabs.js`, `dialog.js`, `hover.js`, `carousel.js`, `demo.js`, `range.js`, `validate.js`, `toc.js`, `enter.js`. It also names the `yeti:*` events: `yeti:close`, `yeti:open`, `yeti:select`, `yeti:slide`, `yeti:invalid`, `yeti:current`.

## How to work it

Use a `/research` subagent against `github.com/foundation/yeti`, citing `file:line`. For each module, record:

- its size;
- the behaviour it adds;
- its ARIA, keyboard, and focus handling, compared with the matching WAI-ARIA APG pattern in `github.com/w3c/aria-practices`;
- the platform features it relies on, such as `popover`, `dialog`, `invoker` commands, and scroll snap;
- its events;
- what happens with no JavaScript.

Then, for each module and each component without one, say what an Angular wrapper would add, with sources from the Angular 22.2 clones:

- typed inputs and outputs in place of attributes and events;
- signal state and two-way binding;
- `@angular/aria` and `@angular/cdk` building blocks;
- forms integration (`validate.js`, `range.js`);
- SSR, hydration, `@defer`, and event replay;
- `animate.enter` and `animate.leave`;
- DI between parts.

Also list what the platform already does with no JavaScript, where a wrapper would add nothing but types.

Write `research/yeti-javascript-and-angular.md`, and append an `## Answer`. Decide nothing.

## Answer

Resolved 2026-10-01 by Claude Opus 5.5. Findings: [research/yeti-javascript-and-angular.md](../research/yeti-javascript-and-angular.md). Decides nothing.

- Yeti's JavaScript is ten optional modules, 760 lines, of which 304 are comments (about 412 lines of code, 37,706 bytes); `demo.js` (175) is docs-only, `tabs.js` (114) is the largest component module. Four modules dispatch no event (demo, hover, range, enter). Checked.
- The platform does the core work with no script: `details` for accordion, `popover` for dropdown and nav, invoker commands plus `showModal` for dialog, scroll snap for carousel, CSS for tooltip. For those, and for every attribute-only component and layout, an Angular wrapper adds only typed inputs, generated ids, and a state mirror.
- Angular adds real behaviour for tabs (Aria Tabs, server-rendered selection; Aria hides panels with `inert`, so a wrapper must also bind `hidden` for Yeti's CSS), forms (signal or reactive forms, but `@angular/forms` sets no `aria-invalid` or `aria-describedby`, and Angular's form directives prevent the submit before `validate.js` sees it), range (the fill as a server-rendered `computed`), alert (`animate.leave`), and tooltip (Escape dismissal through Yeti's `[hidden]`, a WCAG 1.4.13 gap Yeti states).
- Checked in the compiler: an Angular template cannot bind `(yeti:select)` on an element, because a colon names a global target and only `window`, `document`, `body` are allowed; Angular's DOM schema also lacks `popover` and invoker-command properties.
- Yeti in an SPA breaks in ways a wrapper would fix (inferred): `tabs.js`, `toc.js`, `enter.js` scan only at load; fragment links resolve against `<base href>`; popover panels stay open after a `routerLink` navigation; `tabs.js` writes attributes Angular may own.
- Hypothesis: for SSR, keeping `commandfor` and `popovertarget` in the rendered HTML beats Angular click handlers, since the platform acts before hydration and event replay only replays later.
- Not confirmed: browser behaviour (nothing was run), popover focus-out, and event replay's handling of fragment-link clicks.

Note, 2026-10-01 ([Task: carry the old map's Yeti findings into this bundle](05-task-carry-yeti-findings-from-old-map.md)): section 5 of [research/yeti-foundation-7.md](../research/yeti-foundation-7.md) is an earlier count of Yeti's JavaScript.
