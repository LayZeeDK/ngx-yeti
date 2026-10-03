# 37. Prototype: consumer `@boundary` and `@error` blocks around ngx-yeti, under SSR

Type: prototype
Status: resolved
Blocked by: 36
Labels: wayfinder:prototype
Map: ../map.md

## Question

[Research: what `@boundary` and `@error` could add to ngx-yeti](36-research-boundary-and-error-blocks.md) read that a consumer can wrap the package's directives in a `@boundary`, with no package change. It left these open, either unmeasured or only inferred:

1. With SSR, does the server-fallback path log a hydration warning or an `NG05xx` error in a development build? Does it meet the hydration constraints (map, Standing rulings)?
2. Counted style links ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)):
   - when the fallback replaces content on the server or the client, are the item's links released, kept, or left behind;
   - after `$reset()`, does an item paint unstyled, and for how many frames;
   - does a fallback rendered on the server leave stray links?
3. Generated ids ([ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md)): what does `$reset()` and a server-side swap do to ids and references, and to the `TransferState` seed?
4. A boundary inside and around `@defer (hydrate on ...)` and `hydrate never`, event replay of a click made before hydration, `withI18nSupport()`, and zoneless change detection.
5. The JavaScript-off guarantee ([ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md)): with SSR and with prerendering, what does the page show with JavaScript off when the server rendered the fallback?
6. Which errors from the package's own directives a boundary catches, in the constructor, host bindings, and effects, and which it misses, in listeners and render callbacks.

So what does a consumer need to know? Which of it belongs in the `setup` spec or in item specs, and does any of it require a package change?

## User instruction, 2026-10-03

The user's own message, verbatim:

> #57 Consider how `@boundary` and `@error` affect consumers using ngx-yeti, especially in SSR scenarios, run the suggested probe(s).

## How to work it

One prototype in the workspace of [Decide: how component styles load and unload](13-decide-style-loading.md) (it has ADR 0060's counted links) or a ticket 29 workspace. Add sketches of the package's directives for one styled item and the ADR 0044 id helper. Use development and production builds, SSR and prerendering, in Chromium, Firefox, and WebKit. Write `prototypes/consumer-boundaries/README.md`; the orchestrator appends the `## Answer`. Decide nothing.

## Answer

Resolved 2026-10-03 by a Claude Opus 5.5 prototype: [consumer-boundaries](../prototypes/consumer-boundaries/README.md). It used Angular 22.2.1, development and production builds, SSR and prerendering, and Chromium, Firefox, and WebKit, with JavaScript on and off. Results are measured unless marked.

- **Hydration:** no `NG05xx` anywhere. If only the server throws, the client silently replaces the fallback with a freshly built item. If only the client throws at hydration, the server's markup stays on the page as a dead copy beside the fallback (read, `views.ts:95`, `boundary.ts:156-187`). In both cases a click made before hydration is lost.
- **Not caught:** host listeners, `afterNextRender`, and a constructor error in `@defer` content when the boundary sits outside the `@defer`. That error goes to `handleError` and leaves the region empty, which corrects ticket 36's inference. A boundary inside the `@defer` catches it.
- **A possible Angular bug** (upstream-bugs A8): a constructor error on a template's first creation leaves its embedded TView half-built. After that, `$reset()` never recovers, every later SSR request in the same process renders the fallback, and one prerendered page was saved with the error in it.
- **Style links:** a catch on the server leaves a stray link, and a constructor error on the client leaks the count. After `$reset()`, with item CSS delayed 300 ms and the HTTP cache off, WebKit paints 16-19 unstyled frames; Chromium and Firefox paint 0, and all three paint 0 with the cache on.
- **Ids:** every id stays unique and every reference resolves. `$reset()` gives new ids. With JavaScript off, a page whose server caught an error shows the fallback, and the fallback's button does nothing.

**Orchestrator decisions under full AFK mode** (recorded in [Decide: the open points of the specs](50-decide-open-points-of-the-specs.md)):
- the package needs no change for consumer boundaries;
- every item directive acquires its item file after anything in its constructor that can throw, so an error leaks no count;
- the `setup` spec documents consumer boundaries, the preload list as the cover for `$reset()`, and the lost pre-hydration click;
- `demo` and every package template use no `@boundary`.

