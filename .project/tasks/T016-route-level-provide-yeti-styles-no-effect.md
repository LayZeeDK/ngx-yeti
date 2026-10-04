---
id: T016
title: Make a route-level provideYetiStyles() call have no effect while the root call keeps preloading
wave: 5
deps: [T002, T014]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/styles/src/provide-yeti-styles.ts
  - packages/ngx-yeti/styles/src/yeti-styles.ts
  - packages/ngx-yeti/styles/src/provide-yeti-styles.spec.ts
---

# T016 — Make a route-level provideYetiStyles() call have no effect while the root call keeps preloading

## Context

Final review finding P001 (.project/review/PATCH-FINDINGS.md, source .project/review/final-gap-3.md, locator `Risk: Documented provideYetiStyles placement matches the loader`), reviewed HEAD `1ac159a21be091ed19cbeb6b4646ecc467f528a6`. Evidence, verbatim:

- **Check**: `npx nx test ngx-yeti --skip-nx-cache -- gap3-route` (after `npm ci --no-audit --no-fund`), with a temporary browser spec packages/ngx-yeti/styles/src/gap3-route.spec.ts (deleted afterwards): a TestBed root with no provideYetiStyles, then `createEnvironmentInjector([provideYetiStyles({ url: 'x/', preload: ['card'] })], root)`, then root `YetiStyles.acquire('stack')`; the spec asserted a sentinel so the observed values print in the diff.
- **Observed**: received `{ before: 0, links: ["yeti-css/components/card/card.css?v=f52d1e8b93de5bbde322480ba77d5be26c49b0ef"], stack: "yeti-css/layouts/stack/stack.css?v=f52d1e8b93de5bbde322480ba77d5be26c49b0ef" }`. The route-level call ignored `url` (stack used the default yeti-css/), but it ADDED a `<link rel="preload">` for `card` to `<head>` through the root loader.
- **Reference**: packages/ngx-yeti/styles/src/provide-yeti-styles.ts:41-52 (provideEnvironmentInitializer injects root YetiStyles and calls preload); packages/ngx-yeti/styles/src/yeti-styles.ts:58-59 (url read once from the root injector); docs/specs/specs/setup.md:196 ("a call in a route's providers has no effect") and :225 (rule 10); packages/ngx-yeti/README.md:144 (rule 10 restated); provide-yeti-styles.ts:17-18 (JSDoc restates "no effect").
- **Found**: A route-level `provideYetiStyles()` is not without effect: its `preload` list runs at route-injector creation and writes preload links (using the root `url`), while its `url` is silently ignored. This contradicts setup.md:196, README rule 10, and the JSDoc, which all say a route-level call has no effect.
- **Fix direction**: Make the code match setup.md (which outranks the README): the preload initializer must act only when provideYetiStyles is in the root environment injector, e.g. in the initializer, skip unless `inject(EnvironmentInjector) === inject(ApplicationRef).injector` (or move preload into the root YetiStyles reading `yetiStylesConfig.preload` from the root injector, so a route-level config is never read). Add a spec like the one above asserting no preload link and default url after a route-level call.

setup.md:196 is the governing text: "Called once, in the application's root providers. The loader is a root service and reads the configuration from the root injector, so a call in a route's providers has no effect (follows from ADR 0060 point 2's root service)." Usage rule 10 (setup.md:225) says "Call `provideYetiStyles()` at most once, in the root providers." The README rule 10 and the `provideYetiStyles` JSDoc already state "no effect"; after this task they are true.

## Approach

- Root cause: the preload side effect is attached to whichever environment injector receives the providers (`provideEnvironmentInitializer` in `provide-yeti-styles.ts`), while `url` is read by the root `YetiStyles` service. Fix it in one place so every route-level injector is covered; either fix direction in the finding is acceptable. If preload moves into `YetiStyles` (reading `yetiStylesConfig.preload` from the root injector), it must still run at application start on the server and the client, as setup.md "The loader's behaviour" rule 4 requires.
- Keep the root-level behaviour exactly as today: the `url` override, one preload link per item with the same-`href` dedupe, the `CSP_NONCE` attribute on preload links, preload links written on the server, and adoption of server links at hydration. The existing specs `packages/ngx-yeti/styles/src/yeti-styles.spec.ts` (e.g. "writes one preload link per item, never beside one present") and `packages/ngx-yeti/styles/src/setup.ssr.spec.ts` (lift preload link, nonce) cover these and must pass unchanged.
- Public API stays as is: `provideYetiStyles(config?: YetiStylesConfig): EnvironmentProviders` and `YetiStylesConfig` exported from `packages/ngx-yeti/styles/src/index.ts`; `YetiStyles` stays unexported. Do not add a runtime warning for a route-level call: misuse warnings are out of this program (INTENT.md Scope: out).
- New browser spec `packages/ngx-yeti/styles/src/provide-yeti-styles.spec.ts`, modelled on the gap reviewer's check and the `createEnvironmentInjector` pattern in `yeti-styles.spec.ts` ("keeps two loaders of two applications apart"): a TestBed root with no `provideYetiStyles`, a child `createEnvironmentInjector([provideYetiStyles({ url: 'x/', preload: ['card'] })], root)`, then root `YetiStyles.acquire('stack')`; assert no `<link rel="preload">` in `<head>` and the stack link href starts with the default url yeti-css/. A second case with `provideYetiStyles({ preload: ['card'] })` in the TestBed root providers asserts the card preload link is written.
- Follow the `type-safety` and `ngx-yeti-testing` skills (SIFERS `setup()`, no hooks, no `as`, `expect.assertions`). Leave the README and JSDoc wording unchanged unless the fix makes a sentence wrong.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. A `provideYetiStyles({ url: 'x/', preload: ['card'] })` call in a child environment injector (a route's providers) under a root with no `provideYetiStyles` writes no `<link rel="preload">` to `<head>`, and a root-loader acquisition after it uses the default yeti-css/ url; `packages/ngx-yeti/styles/src/provide-yeti-styles.spec.ts` asserts both and fails against the code at `1ac159a`.
2. A `provideYetiStyles({ preload: ['card'] })` call in the root providers still writes exactly one card preload link; the new spec asserts it.
3. Root-level behaviour is unchanged: the existing `yeti-styles.spec.ts` and `setup.ssr.spec.ts` cases (url override, preload dedupe, CSP nonce, server write, client adoption) pass without edits to their assertions.
4. The public exports of `packages/ngx-yeti/styles/src/index.ts` are unchanged.
5. Bisect-safe: `npx prettier --check .` and `npx nx run-many -t lint typecheck test -p ngx-yeti` pass.

## Verify

```bash
npm ci --no-audit --no-fund && test -f packages/ngx-yeti/styles/src/provide-yeti-styles.spec.ts && npx nx test ngx-yeti -- provide-yeti-styles.spec && npx nx test ngx-yeti && npx nx typecheck ngx-yeti
```

Heavy: no

## Log

- 2026-10-04 — created by planner (final-review patch mode, finding P001)
