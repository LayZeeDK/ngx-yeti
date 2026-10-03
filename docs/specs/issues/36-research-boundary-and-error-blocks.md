# 36. Research: what `@boundary` and `@error` could add to ngx-yeti

Type: research
Status: resolved
Blocked by:
Labels: wayfinder:research
Map: ../map.md

## Question

Angular 22.2 adds the `@boundary` and `@error` template blocks as a developer preview (angular/angular#70463; the Angular v22 announcement). What do they do?
- What do they catch: errors in rendering, change detection, effects, event handlers, or child component creation?
- What renders in their place?
- How do they interact with SSR, full and incremental hydration, event replay, `@defer`, zoneless change detection, and i18n?

Could they add value to ngx-yeti, given what this map has decided?
- Directives first (ADR 0003); the `demo` component as the only Angular component.
- The rendering-modes contract and the JavaScript-off guarantee (ADR 0011).
- The hydration-constraints ruling.
- Item styles as counted links (ADR 0060).
- Checks deferred to a later milestone (map, Milestones).

For example, could the package use them, recommend them to consumers, document them in the `setup` spec, or test against them? Or do they not apply to a library made of directives? Their developer-preview status also has to be weighed against the release policy (ADR 0017).

## User instruction, 2026-10-03

The user's own message, verbatim:

> 57. Consider whether `@boundary` + `@error` (in `@developerPreview` in Angular 22.2) could add value to ngx-yeti, see https://github.com/angular/angular/pull/70463 and https://blog.angular.dev/announcing-angular-v22-c52bb83a4664.

## How to work it

Use a `/research` subagent. Read the PR, the blog post, and the compiler and runtime source in the local clone `github.com/angular/angular` (for example `packages/compiler/src/render3/r3_boundaries.ts`). Add a small probe in a ticket 29 workspace if a claim about SSR or hydration needs one. Write `research/boundary-and-error-blocks.md`, and append an `## Answer`. Decide nothing.

## Answer

Resolved 2026-10-03. Findings in [research/boundary-and-error-blocks.md](../research/boundary-and-error-blocks.md), by Claude Opus 5.5. The sources were read (angular/angular#70463, the v22 announcement, and the compiler, runtime, tests, and guide at `5db6fc4453`). No probe was run, so nothing is measured.

- **What they catch:** errors thrown while the `@boundary`'s content is created or change-detected: constructors, template bindings, lifecycle hooks, host bindings, view effects, child and `@for` views, and `@defer` content once rendered. Not caught: event and output listeners (replayed ones included), `afterNextRender` and `afterRenderEffect` callbacks, `@defer` loading failures, content projected into a component that wraps `<ng-content>` itself, and errors inside `@error` (read).
- **What renders instead:** the first `@error` block whose `when` holds, with `$error` and `$reset`. The primary view is destroyed. `$reset()` re-creates it on the next pass. Caught errors still reach the `ErrorHandler`, through `onViewError` if the handler implements it (read).
- **Server and hydration:** a server error renders the fallback into the server HTML. If the client then succeeds, it builds the primary content fresh (Angular's platform-server tests, read). Zoneless scheduling works through `markAncestorsForTraversal` (read). Incremental hydration, event replay, and `i18n` inside a boundary have no upstream tests.
- **For ngx-yeti:** directives cannot declare the block. A consumer's boundary works around the package's directives without the package doing anything. Most of the package's run-time work sits in listeners and render callbacks, which a boundary does not catch. The table lists one possible use in `demo`, which adds little because its preview is an iframe, and docs and test options. It also lists three inferred interactions with ADR 0060's counted links and one with generated ids.
- **Risk:** `@boundary` is developer preview and may change in an Angular patch. ADR 0017 has no rule for developer-preview APIs. Using the block in a published template ties a release to private instructions; documenting it or testing against it does not.
- **Open, not measured:** a hydration warning on the server-fallback path, server links after a server-side swap, `hydrate` triggers, replay, `i18n`, and effects in a targeted pass.
