# Review — wave 5, cycle 1

Wave verdict: pass
Cycle: 1
Depth: full
Tasks reviewed: 1

## T016 — Make a route-level provideYetiStyles() call have no effect while the root call keeps preloading: pass

- ✅ A `provideYetiStyles({ url: 'x/', preload: ['card'] })` call in a child environment injector (a route's providers) under a root with no `provideYetiStyles` writes no `<link rel="preload">` to `<head>`, and a root-loader acquisition after it uses the default yeti-css/ url; `packages/ngx-yeti/styles/src/provide-yeti-styles.spec.ts` asserts both and fails against the code at `1ac159a`. — landing a551705: provide-yeti-styles.ts:50-54 returns early unless `inject(EnvironmentInjector) === inject(ApplicationRef).injector`; spec "has no effect in a route injector" asserts `preloadHrefs()` is `[]` and stack href `yeti-css/layouts/stack/stack.css?v=${yetiPin}`. Url is never read from the child (root YetiStyles reads root config, yeti-styles.ts unchanged), so the route call now changes neither url nor preload (setup.md:196). Coder Log records the route case failing against 1ac159a's provide-yeti-styles.ts (`expected [ Array(1) ] to strictly equal []`); consistent with final-gap-3 Observed. Orchestrator Verify exit 0 (T016 Log; verify-ledger.jsonl commit a551705).
- ✅ A `provideYetiStyles({ preload: ['card'] })` call in the root providers still writes exactly one card preload link; the new spec asserts it. — spec "preloads from the root providers" asserts `toStrictEqual([card href])`; passed in orchestrator Verify.
- ✅ Root-level behaviour is unchanged: the existing `yeti-styles.spec.ts` and `setup.ssr.spec.ts` cases (url override, preload dedupe, CSP nonce, server write, client adoption) pass without edits to their assertions. — `git diff 6cbac61 a551705 --stat` touches neither spec; full `nx test ngx-yeti` in orchestrator Verify passed. setup.ssr.spec.ts:35,81-112 puts `provideYetiStyles({ preload: ['lift'] })` in the root providers of a server render and still asserts the lift preload link and its nonce, so on the server path the root environment injector equals ApplicationRef.injector. Coder also recorded uncached yeti-app-e2e (80 passed) for client adoption.
- ✅ The public exports of `packages/ngx-yeti/styles/src/index.ts` are unchanged. — index.ts not in the landing diff.
- ✅ Bisect-safe: `npx prettier --check .` and `npx nx run-many -t lint typecheck test -p ngx-yeti` pass. — coder Log: uncached `run-many -t lint typecheck test test-storybook -p ngx-yeti --skip-nx-cache` exit 0 and `prettier --check .` exit 0; orchestrator Verify (test + typecheck) exit 0.

Warnings (non-blocking):
- none

Contract violations (blocking):
- none — landing changes only provide-yeti-styles.ts, provide-yeti-styles.spec.ts (declared) and the task file (frontmatter status/agent/base plus appended Log). No runtime misuse warning added (Scope: out respected).

## Summary for orchestrator

- blocked findings: none
- repeat offenders: none
- warnings worth a human eye: none
