# Research: what `@boundary` and `@error` could add to ngx-yeti

Ticket: [36. Research: what `@boundary` and `@error` could add to ngx-yeti](../issues/36-research-boundary-and-error-blocks.md). Written 2026-10-03 by Claude Opus 5.5. This file decides nothing; the table at the end lists where the blocks could add value or conflict, for the orchestrator and the user.

## Sources

- angular/angular#70463, "feat(core): introduce `@boundary` control flow and programmatic error handling" (read with `gh api`, read-only). GitHub shows it closed on 2026-09-09 without a merge, with the `action: merge` label; its commits landed through the caretaker and are in the local clone (`f6afb807c1`, `54ed62d240`, `f7597cb7d9`, `f4a5650ed9`, all "(#70463)"). The PR body still names the reset variable `$retry`, and says docs would follow in a later PR; the landed code and guide call it `$reset`.
- The Angular v22 announcement, section "A sneak peek at something new" (fetched through markdown.new on 2026-10-03).
- The local clone `github.com/angular/angular` at `5db6fc4453` (`NG` below):
  - compiler: `NG/packages/compiler/src/render3/r3_boundaries.ts`, `NG/packages/compiler/src/template/pipeline/src/ingest.ts:676-770`, `NG/packages/compiler/src/template/pipeline/src/phases/boundary_conditions.ts`, `NG/packages/compiler/src/typecheck/ops/boundary.ts`;
  - runtime: `NG/packages/core/src/render3/instructions/boundary.ts`, `NG/packages/core/src/render3/instructions/change_detection.ts`, `NG/packages/core/src/error_handler.ts`, `NG/packages/core/src/render3/view/listeners.ts`, `NG/packages/core/src/defer/rendering.ts`, `NG/packages/core/src/defer/triggering.ts`, `NG/packages/core/src/render3/after_render/manager.ts`, `NG/packages/core/src/render3/util/view_utils.ts`;
  - tests: `NG/packages/core/test/render3/error_boundary_spec.ts`, `NG/packages/platform-server/test/full_app_hydration_spec.ts:8042-8170`;
  - docs: `NG/adev/src/content/guide/templates/error-boundaries.md`, `NG/adev/src/content/reference/releases.md:163-169`.
- This bundle: [map.md](../map.md) (Notes, Standing rulings, Decisions so far), ADRs [0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [0011](../adr/0011-rendering-modes-contract-for-yeti.md), [0017](../adr/0017-release-policy-with-a-pinned-yeti.md), [0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [building-blocks.md](../building-blocks.md), [architecture-guide.md](../architecture-guide.md).
- No probe was run. The server and hydration claims below rest on Angular's own platform-server tests (read), and the claims that would need a probe are marked inferred and listed under Open questions.

Tags: **read** (a `file:line`, or the PR or blog section), **inferred** (reasoned from read code, not run), **measured** (none in this file).

## What the blocks do

### Syntax

- `@boundary { ... }` takes no parameters, and its only connected block is `@error` (read, `r3_boundaries.ts:33-44`).
- Each `@error` block gets two context variables, `$error` and `$reset`, which `let` can alias (`@error (let err; reset = $reset)`); any other name is a compile error (read, `r3_boundaries.ts:45-89`).
- An `@error` block may carry one `when <expression>`. Several `@error` blocks are allowed, evaluated in order. At most one has no `when`, and it must come last (read, `r3_boundaries.ts:92-155`; guide `error-boundaries.md:46-61`).
- If an error matches no `@error` block, or the `@boundary` has none, the runtime throws a `BoundaryError` whose `cause` is the original error (read, `boundary.ts:198-203`, `boundary_conditions.ts:35-38`).
- Type-checking renders the block as `try { primary } catch (err) { if (when) {...} else {...} }` (read, `typecheck/ops/boundary.ts:32-99`).

### Runtime model

- The compiler turns the block into a conditional: `boundary.error === null ? primary : <first matching @error>` (read, `boundary_conditions.ts:23-84`). `ɵɵboundaryUpdate` switches views like `@if`, with one embedded view in one container (read, `boundary.ts:84-207`).
- **Creation errors.** If creating the primary view throws (directive and component constructors, creation-mode template code), the error is stored and sent to the `ErrorHandler`. The view is not added to the DOM, and the host view is marked for refresh, so the same tick renders the `@error` block (read, `boundary.ts:156-187`; test "should intercept errors thrown during component constructor", `error_boundary_spec.ts:577`).
- **Update errors.** The primary view gets an `ON_ERROR` callback (read, `boundary.ts:128-155`). `refreshView`'s `catch` walks up the view tree to the nearest `ON_ERROR` (read, `change_detection.ts:365-404`). That `try` covers template bindings (`:242`), `OnInit`/`OnChanges`/`DoCheck` (`:248-260`), view effects (`:273`), embedded and child component views, content and view hooks, and host bindings (`:302`). The callback stores the error, reports it, destroys the primary view at once, and marks the host for refresh (read, `boundary.ts:149-153`; `removeLViewFromLContainer` runs `destroyLView`, `view/container.ts:128-137`).
- **What is caught, per the tests** (read, `error_boundary_spec.ts`):
  - template bindings (`:625`) and lifecycle hooks (`:598`);
  - a child view created during update (`:656`) and a `@for` (`:513`);
  - `effect()` (`:1026`);
  - components loaded by `@defer` once rendered (`:297`), and dynamically inserted components (`:475`);
  - nested boundaries, where an error falls to the outer one (`:416`).
- **What is not caught** (read):
  - **Event and output listeners.** `executeListenerWithErrorHandling` sends the error to the application error handler (`listeners.ts:82-100`), not to `ON_ERROR`. Replayed events take the same path (inferred: replay calls the same listener functions).
  - **`afterNextRender` and `afterRenderEffect` callbacks.** `AfterRenderManager` catches and calls `ErrorHandler.handleError` (`after_render/manager.ts:93-95`).
  - **`@defer` dependency loading failures and state-change errors.** Both go to `handleUncaughtError` (`defer/triggering.ts:278-279`, `defer/rendering.ts:214-218`). `@defer`'s own `@error` block covers loading.
  - **Content projected into a component whose template wraps `<ng-content>` in `@boundary`.** Projected content belongs to its declaring view (test `:340`; guide `:84-108`). A boundary around the receiving element and its content does catch it (`:378`).
  - **Errors thrown inside an `@error` block.** These are rethrown to the next outer boundary (`boundary.ts:188-189`; test `:685`; guide `:82`).
- **Effects run in a targeted pass.** `runEffectsInView` also runs outside `refreshView`, in `detectChangesInView`'s targeted branch (read, `change_detection.ts:545-548`). That branch has no `catch` of its own. So whether a boundary catches an effect that throws in a targeted pass depends on an ancestor being refreshed in the same pass (inferred, not tested).
- **What renders instead.** The first `@error` block whose `when` is true, with `$error` (non-`Error` throws wrapped in `ErrorBoundaryWrappedError`, `error_handler.ts:109-114`, `:129-139`) and `$reset` in context. The primary view's DOM is removed, and its directives are destroyed (read, above).
- **Retry.** `$reset()` clears the stored error and marks the host view for refresh. The next pass creates the primary view afresh (read, `boundary.ts:53-56`). The error state is per boundary instance, and nothing retries automatically (read).
- **Reporting.**
  - Every caught error still reaches the `ErrorHandler`: through the new optional `onViewError(error, details)` if the handler implements it, otherwise through `handleError` (read, `boundary.ts:133-147`, `:161-179`).
  - `ErrorDetails` (`@developerPreview 22.2`, `error_handler.ts:22-49`) carries the declaring type and instance, plus `boundary.type` and `boundary.reset`.
  - The same PR adds an `onError` option to `ViewContainerRef.createComponent`, `createEmbeddedView`, and the standalone `createComponent` (read, `view_container_ref.ts:186-197`, `:237-252`; `component.ts:80-114`). That path does not catch a constructor error (test `:137`).
- **Zoneless.** `markViewForRefresh` calls `markAncestorsForTraversal`, which notifies the change-detection scheduler (read, `view_utils.ts:208-216`, `:264-265`). So the swap to `@error`, and a `$reset()` called later from a `setTimeout`, schedule their own pass with no zone (read; test `:886`). Zoneless use as such was not measured here.

### SSR, hydration, incremental hydration, event replay, i18n

- **SSR.**
  - A server error inside a boundary renders the `@error` block into the server HTML, and the primary content is absent (read, platform-server test "should render fallback during SSR and recover...", `full_app_hydration_spec.ts:8086-8132`).
  - The error also reaches the server's `ErrorHandler` (read, `boundary.ts:161-179`).
  - Without a boundary, the same error fails the render (inferred from the unhandled path, `change_detection.ts:393-403`).
- **Hydration.**
  - With no error, the primary block hydrates with every node claimed (read, `:8043-8084`).
  - If the server rendered `@error` and the client does not throw, the client renders the primary content and the fallback disappears (read, `:8086-8132`).
  - If the client throws too, the fallback stays (read, `:8134-8170`).
  - The recovery test checks only the text. It does not call `verifyAllNodesClaimedForHydration`. On the client the boundary's state starts at `error === null`, so it asks for the primary template. That template's container holds no dehydrated view, because the server filled the `@error` template's container instead, so the primary content is created fresh rather than claimed (inferred from `boundary.ts:107-115` and the compiled condition). Whether a development build logs a hydration warning in that case was not checked.
- **Incremental hydration.** No test combines `@boundary` with `@defer (hydrate ...)` (read: `rg` over `NG/packages` finds `@boundary` only in the test files listed above and `hmr_spec.ts`). When a dehydrated block hydrates, its update runs in a change-detection pass, so an enclosing boundary should catch errors in it like any other update error (inferred).
- **Event replay.** Listener errors are never caught by a boundary (read, `listeners.ts:94`), so an error in a replayed handler is not caught either (inferred).
- **i18n.** The AST nodes carry `i18n` metadata (read, `r3_boundaries.ts:129`, `:173`), but no test covers `i18n` inside a boundary or `withI18nSupport()` (read, the same `rg`).
- **Developer preview.**
  - The guide marks `@boundary` as developer preview (read, `error-boundaries.md:3`), and so does `ErrorDetails` (`@developerPreview 22.2`).
  - `BoundaryError` and `ErrorBoundaryWrappedError` are tagged `@publicApi 22.2` (read, `boundary.ts:36`, `error_handler.ts:129`).
  - The blog said `@boundary` "will be available as a developer preview in Q3 2026" (blog, "A sneak peek at something new").
  - Angular's policy says developer-preview APIs "can change at any time, even in new patch versions" (read, `releases.md:169`).
  - The PR already renamed `$retry` to `$reset` between its description and the landed code (read).

## Where the blocks touch ngx-yeti

| Decision or use | What the blocks would add | Could conflict with | Evidence |
| --- | --- | --- | --- |
| Directives first, `demo` the only Angular component (ADR 0003; map, Directives first) | Nothing inside the package's directives: a directive has no template, so it cannot declare `@boundary`. A consumer's `@boundary` around markup that carries the package's directives catches errors from their constructors, inputs (`input.required` read too early), host bindings, `OnInit`, and effects | None. The package's API does not change | read (`boundary.ts:156-187`, `change_detection.ts:242-302`); the directive case itself inferred, since the tests use components |
| `demo`, the only component | Its template could wrap the preview in `@boundary`. But the preview is an `iframe` `srcdoc` built from a string, and an error in it never reaches Angular. The parts that could throw (the grip, `ResizeObserver` in `afterNextRender`) are listeners and render callbacks, which a boundary does not catch | A boundary in `demo` would put a developer-preview block into a published template (see ADR 0017 below) | read (`listeners.ts:94`, `after_render/manager.ts:93-95`); building-blocks row 30; value inferred |
| Browser-only work in render callbacks (ADR 0011 clause 4) and behaviour in host listeners (building-blocks 1.11) | Nothing: a boundary catches neither callbacks nor listeners. Most of what the package's directives do at run time happens in those two places | A spec or doc that says a consumer's `@boundary` contains the package's failures would be wrong for that work | read |
| Rendering-modes contract and the JavaScript-off guarantee (ADR 0011; standing ruling 55) | For a consumer: a server error inside a boundary no longer fails the whole render; the server HTML carries the `@error` content | With JavaScript off, a reader sees the fallback, not the item. The guarantee ("every item stays readable") holds only for items that rendered. A spec could say the guarantee covers the primary content of a boundary that did not catch, not its fallback | read (platform-server test `:8086-8132`); the guarantee reading inferred |
| Hydration constraints (standing ruling 54: the same DOM on the server and the client) | None for the package | When the server catches and the client does not, the client builds the primary content fresh. Any item inside it is created client-side, not hydrated, so state toggled before hydration (an open `details`, a `dialog` opened by `command`) is lost, as with a client `@if`. That is a constraint the consumer's template breaks, not the package. A Rendering modes subsection could name it | read (test); the effect on items inferred |
| Incremental hydration and `@defer` (ADR 0011 clause 10: no `@defer` in the package's templates) | A consumer can nest `@boundary` inside or around `@defer`. Render errors of deferred content are caught once rendered, loading errors are not | None found. Untested upstream with `hydrate` triggers | read (test `:297`; `defer/triggering.ts:279`); `hydrate` triggers inferred |
| Event replay and `yeti:*` outputs (ADR 0011 consequences; building-blocks 1.11) | Nothing: listener errors bypass boundaries, replayed or not | None | read (`listeners.ts:82-100`) |
| Zoneless (standing ruling 43) | The swap and `$reset` schedule their own pass, so a consumer's boundary works zoneless | None found | read (`view_utils.ts:264-265`; test `:886`) |
| `withI18nSupport()` (ADR 0011 clause 11) | Unknown | Untested upstream; an item with `i18n` inside a boundary is not covered by any Angular test | read (absence of tests) |
| Item styles as counted links (ADR 0060 points 2, 4, 5) | None | Three interactions, all inferred: (a) when a boundary swaps to `@error`, the primary view's directives are destroyed and release their items; the link goes in the next frame if no host is connected, so the fallback gets no item styles unless it holds the item too, which is correct; (b) `$reset()` re-acquires the item on construct, so a re-shown item can paint unstyled for a few frames, the gap point 6 measured for a client `@defer`, closable the same way with `provideYetiStyles({ preload })`; (c) on the server, a directive acquires its item in the constructor before a later sibling throws, so the server `<head>` can carry links for items the fallback replaced (point 4's removal waits for a `MutationObserver`, inferred not to run on the server), which costs bytes, not correctness | read (ADR 0060 points 2, 4, 6; `boundary.ts:149-150`); effects inferred |
| Generated ids (ADR 0042; ADR 0011 clause 7) | None | A `$reset()` creates the primary view afresh, so its generated ids change, as with any re-created view. A part and its target inside the same boundary change together; a reference from outside the boundary to an id inside goes stale (inferred) | inferred |
| The `setup` spec | It could document that the package needs nothing for `@boundary`. It could also show a consumer `ErrorHandler.onViewError` beside `provideYeti()`. Neither is setup the package requires | Documenting a developer-preview API in a setup spec ties that spec to its churn | read (guide `:63-80`); value inferred |
| Testing (ADR 0014) and checks deferred to a later milestone (map, Milestones) | A browser-level test could put an item inside a `@boundary`, throw beside it, and assert the counted link is released, the ids, and no stray listeners after `$reset()`. That is a test of the package's own destroy path, not a check | A boundary is not a check, so the Milestones ruling does not bear on it. A test against a developer-preview block may break on an Angular patch | inferred |
| Package code throwing errors (architecture-guide.md: "Avoided: ... a thrown error for a missing `role`") | None: the guide already avoids throwing. Errors that would reach a boundary are Angular's own, such as `input.required` read before it is set | None | read (architecture-guide.md:354) |
| Release policy (ADR 0017) | See below | See below | read |

## Developer-preview risk against ADR 0017

- ADR 0017 and the user's rulings let any 0.x release break, with the two-digit counter bumped and a `@deprecated` release before a removal (map, Standing rulings, "Breaking changes in 0.x"). The Angular packages are peers from the minor a release names (`^22.2.0`).
- Angular may change `@boundary` in a patch (read, `releases.md:169`). It has already renamed one context variable (read, the PR).
- **If the package uses the blocks** (a `@boundary` in `demo`'s template), compiled templates call private instructions (`ɵɵboundaryCreate`, `ɵɵboundaryUpdate`, read in `render3/index.ts:123-124`). The package's partially compiled output would then depend on the runtime of the consumer's Angular patch. A patch-level change could break a published release the package cannot bump in time (inferred). ADR 0017 sets no rule for developer-preview APIs.
- **If the package only documents or tests against them**, the risk is limited to docs and tests that can be edited in any release (inferred).
- **If the package ignores them**, there is no risk. A consumer's boundary works around the package's directives without the package doing anything (read and inferred, above).

## Open questions (not measured)

- Whether a development build logs a hydration warning when the server rendered `@error` and the client renders the primary block.
- Whether ADR 0060's server links persist for an item whose host was destroyed by a server-side boundary swap.
- `@boundary` with `@defer (hydrate on ...)`, with event replay of a handler inside it, and with `i18n` under `withI18nSupport()`.
- Whether an effect that throws in a targeted change-detection pass is caught.

Each could be probed in a ticket 29 workspace route with a development build.
