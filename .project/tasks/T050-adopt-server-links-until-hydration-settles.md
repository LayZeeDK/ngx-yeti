---
id: T050
title: Keep the server's spinner link through hydration on the button route, so hydration adds and removes no item link
wave: 4
deps: [T020, T021]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/styles/src/yeti-styles.ts
  - packages/ngx-yeti/styles/src/provide-yeti-styles.ts
  - packages/ngx-yeti/styles/src/inject-yeti-item-styles.spec.ts
  - apps/yeti-app-e2e/src/button.spec.ts
---

# T050 — Keep the server's spinner link through hydration on the button route, so hydration adds and removes no item link

## Context

Fourth build repair (2026-10-13). T025's coder measured a defect of landed work at base d60b479: at hydration the client removes the server's `link[data-ngx-yeti-styles="spinner"]` and inserts a new one (`remove link[data-ngx-yeti-styles="spinner"]`, then `add link[data-ngx-yeti-styles="spinner"]`). That breaks ADR 0060 point 5 ("0 style mutations after `DOMContentLoaded`") and the setup spec's full-hydration case (setup.md:263: "0 `<style>` or `<link>` additions or removals after `DOMContentLoaded`"; user story 25: "the client adopts the server's links at hydration, so that no stylesheet is added or removed"). `/sub/button` shows it at the base; the card route shows it once T025 gives the card a `yetiButton`, which failed 3 yeti-app-e2e cases of T025's attempt 1 ("adopts the server's card link at hydration" on both route kinds, and "the style mutation probe sees an item link moved while the main bundle runs"). The cause is inferred from reading, not instrumented: `YetiStyles` (`packages/ngx-yeti/styles/src/yeti-styles.ts`) adopts the server's links with count 0 (setup.md "The loader's behaviour" rule 3); `provideYetiStyles()` creates it at application start (`provide-yeti-styles.ts`, environment initializer), so its first render callback and the check it schedules run before the router has activated the route component; the check (rule 2) keeps a count-0 link only while a `[data-ngx-yeti-item-<item>]` host is connected. Every item's server host is in the DOM then, so its link survives, except `spinner` on a route with buttons and no spinner: `YetiButton` (`packages/ngx-yeti/button/src/button.ts`, landed by T020) acquires `spinner` with no spinner presence host, so the link is dropped and the button's acquisition a moment later inserts it again.

The fix belongs in the loader, not in the button. The records settle the button side: ticket 50 decision 109 makes `YetiButton` acquire `spinner` unconditionally, decision 110 rules out a spinner presence attribute on the button host (button.md:387, "`spinner` acquired unconditionally with `button`; no spinner presence attribute on the button"), and the item-names spec (`packages/ngx-yeti/src/item-names.node.spec.ts`, as T021 fixed it) requires the first styles call to be the presence item and allows further calls only for named acquired items. The setup spec owns adoption and removal (setup.md:32, "adopts it at hydration ... removes it only once no host for that item is connected"), so a cross-item file that no presence host holds is the loader's case to handle, and every consumer with SSR gets the fix, not only the Fixture app.

## Approach

- Constraint (the loader, `packages/ngx-yeti/styles/src/yeti-styles.ts`): on the client, no check removes an adopted link before the application's first render after bootstrap has settled, that is, before the initial navigation has activated its route components and hydration has run their constructors. A link that the hydrating application then acquires is the same element the server wrote: no removal and no insertion. A link that nothing acquires and no presence host holds is still removed once that point has passed, so the existing case "adopts a link of its own application and leaves another alone" stays as it is.
- After that point, rule 2's timing is unchanged: removal in the animation frame after the count reaches zero with no connected presence host, triggered by a release or by the `MutationObserver`. The existing cases of `inject-yeti-item-styles.spec.ts` (counting, detached hosts, re-insertion, order, two applications, a destroyed loader, a throwing constructor, no observer before the first render callback) keep passing unchanged, and so do the `setup--*` stories, `setup--item-links`'s "both links gone in the frame after the toggle hides the last host" among them.
- Public Angular API only: never an Angular private symbol (`ɵ` or `ɵɵ`, including `ɵPendingTasks` or hydration internals). `ApplicationRef.whenStable()`, `PendingTasks`, and the render callbacks are public; the coder picks the mechanism. The server still removes nothing, and nothing runs on the server that did not before (setup.md:271: only the observer is client-only, through `afterNextRender`).
- Pitfall: if the chosen signal can wait a long time (an application that stays unstable), the only cost is an unused link kept longer; never an unstyled frame or a removed link that a host needs. Say in the Log which signal was chosen and why it is not earlier than the route's hydration.
- Do not touch `packages/ngx-yeti/button/src/button.ts`: no spinner presence attribute, no conditional `spinner` acquisition (decisions 109 and 110).
- `packages/ngx-yeti/styles/src/provide-yeti-styles.ts`: its comment says the check "removes a server link with no host even before any item renders"; update it to what the loader does after this task. Update the comments of `yeti-styles.ts` the same way; no planning ids in comments.
- Layer-2 test in `packages/ngx-yeti/styles/src/inject-yeti-item-styles.spec.ts`: an adopted link of an item with no presence host in the DOM, acquired by a directive that is created only after the first render callback and its frame have run while the application has not yet settled (for example, a pending task the test holds through the public `PendingTasks`), is the same element afterwards (`toBe` the adopted link) and was never disconnected; and with nothing acquiring it, the adopted link is gone once the application has settled. The test must fail at the base (it would see the adopted link disconnected). Follow the file's SIFERS `setup()` pattern and the type-safety skill.
- Layer-4 test in `apps/yeti-app-e2e/src/button.spec.ts`, inside the existing `routeKinds` loop: "adopts the server's button and spinner links at hydration". Pattern: card.spec.ts's "adopts the server's card link at hydration" (`recordStyleMutations` before `page.goto`, `waitForHydration`, then `expectOnlyClientPreloads`). It asserts no item-link addition or removal at hydration with JavaScript on, that the head holds one `button` and one `spinner` link, and that each is still the server's element (for example, a marker property set on the link before hydration is still there afterwards). It runs in development and production. It must fail at the base on `/sub/button`.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/type-safety/SKILL.md`; records ADR 0060 points 4 and 5, setup.md "The loader's behaviour" and "Rendering modes", button.md section 3 and its cross-item row.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. On `/sub/button` and `/sub/server/button`, with JavaScript on, in the development and production builds, hydration adds and removes no item link: the yeti-app-e2e case "adopts the server's button and spinner links at hydration" passes, asserts that the head holds one `button` and one `spinner` link, and that both are the server's elements; at the base it fails.
2. A layer-2 case in `inject-yeti-item-styles.spec.ts` shows that an adopted link with no presence host, acquired after the first render callback but before the application has settled, is never removed and re-inserted, and that an adopted link nothing acquires is still removed afterwards; at the base it fails.
3. Every existing case of `packages/ngx-yeti/styles/src` (layer 2, layer 3, and the `setup--*` stories) and of `packages/ngx-yeti/button/src` passes unchanged, and the button, setup, and spinner Fixture-route specs pass.
4. `packages/ngx-yeti/button/src/button.ts` is unchanged, and no file in `files` imports or names an Angular `ɵ` symbol.
5. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && rg -q -F "adopts the server's button and spinner links at hydration" apps/yeti-app-e2e/src/button.spec.ts && ! rg -q -F "ɵ" packages/ngx-yeti/styles/src/yeti-styles.ts packages/ngx-yeti/styles/src/inject-yeti-item-styles.spec.ts && npm exec nx -- run-many -t lint typecheck -p ngx-yeti yeti-app-e2e && npm exec nx -- test ngx-yeti -- styles/src button/src && npm exec nx -- test-storybook ngx-yeti -- styles/src && npm exec nx -- e2e yeti-app-e2e -- button.spec.ts setup.spec.ts spinner.spec.ts && FIXTURE_CONFIGURATION=production npm exec nx -- e2e yeti-app-e2e -- button.spec.ts setup.spec.ts spinner.spec.ts; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-13 — created by planner (build repair 4). Evidence: T025's Log and its attempt-1 record tmp/afk-m002/tools/T025-attempt1.log.md.
