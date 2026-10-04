# Gap Review — 3: Documented provideYetiStyles placement matches the loader

Reviewed HEAD: 1ac159a21be091ed19cbeb6b4646ecc467f528a6
Gap verdict: blocked
Risk: Documented provideYetiStyles placement matches the loader
Waves checked: 1, 3

## Checked evidence

- **Check**: `npx nx test ngx-yeti --skip-nx-cache -- gap3-route` (after `npm ci --no-audit --no-fund`), with a temporary browser spec packages/ngx-yeti/styles/src/gap3-route.spec.ts (deleted afterwards): a TestBed root with no provideYetiStyles, then `createEnvironmentInjector([provideYetiStyles({ url: 'x/', preload: ['card'] })], root)`, then root `YetiStyles.acquire('stack')`; the spec asserted a sentinel so the observed values print in the diff.
- **Observed**: received `{ before: 0, links: ["yeti-css/components/card/card.css?v=f52d1e8b93de5bbde322480ba77d5be26c49b0ef"], stack: "yeti-css/layouts/stack/stack.css?v=f52d1e8b93de5bbde322480ba77d5be26c49b0ef" }`. The route-level call ignored `url` (stack used the default `yeti-css/`), but it ADDED a `<link rel="preload">` for `card` to `<head>` through the root loader.
- **Reference**: packages/ngx-yeti/styles/src/provide-yeti-styles.ts:41-52 (provideEnvironmentInitializer injects root YetiStyles and calls preload); packages/ngx-yeti/styles/src/yeti-styles.ts:58-59 (url read once from the root injector); docs/specs/specs/setup.md:196 ("a call in a route's providers has no effect") and :225 (rule 10); packages/ngx-yeti/README.md:144 (rule 10 restated); provide-yeti-styles.ts:17-18 (JSDoc restates "no effect").

## Finding

- **Found**: A route-level `provideYetiStyles()` is not without effect: its `preload` list runs at route-injector creation and writes preload links (using the root `url`), while its `url` is silently ignored. This contradicts setup.md:196, README rule 10, and the JSDoc, which all say a route-level call has no effect.
- **Fix direction**: Make the code match setup.md (which outranks the README): the preload initializer must act only when provideYetiStyles is in the root environment injector, e.g. in the initializer, skip unless `inject(EnvironmentInjector) === inject(ApplicationRef).injector` (or move preload into the root YetiStyles reading `yetiStylesConfig.preload` from the root injector, so a route-level config is never read). Add a spec like the one above asserting no preload link and default url after a route-level call.
