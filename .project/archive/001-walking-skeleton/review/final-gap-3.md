# Gap Review — 3: Documented provideYetiStyles placement matches the loader

Reviewed HEAD: b5854c5c8a0770047ced0030d271d9c92f95a1c9
Gap verdict: pass
Risk: Documented provideYetiStyles placement matches the loader
Waves checked: 1, 3, 5

## Checked evidence

- **Check**: `npm ci --no-audit --no-fund`; `npx nx test ngx-yeti --skip-nx-cache -- provide-yeti-styles.spec setup.ssr.spec yeti-styles.spec`; `npx nx test ngx-yeti --skip-nx-cache -- gap3-probe` with a temporary reviewer-written browser spec packages/ngx-yeti/styles/src/gap3-probe.spec.ts (deleted afterwards): case 1 a TestBed root with no provideYetiStyles, then `createEnvironmentInjector([provideYetiStyles({ url: 'x/', preload: ['card'] })], root)`, then root `YetiStyles.acquire('stack')`, asserting zero `link[rel="preload"]` and a stack href starting `yeti-css/layouts/stack/stack.css`; case 2 root providers `provideYetiStyles({ preload: ['card'] })`, asserting exactly one preload link starting `yeti-css/components/card/card.css`
- **Observed**: npm ci exit 0; named specs: Test Files 3 passed (3), Tests 139 passed (139); probe: Test Files 1 passed (1), Tests 2 passed (2). The route-level call wrote no preload link and did not change the url (stack loaded from the default `yeti-css/`); the root call wrote exactly one card preload link. The earlier blocked behaviour at 1ac159a (a card preload link from a route-level call) no longer occurs.
- **Reference**: packages/ngx-yeti/styles/src/provide-yeti-styles.ts:49-55 (initializer returns unless `inject(EnvironmentInjector) === inject(ApplicationRef).injector`); provide-yeti-styles.ts:19-21 (JSDoc: route-level call has no effect); packages/ngx-yeti/styles/src/provide-yeti-styles.spec.ts (T016 spec); docs/specs/specs/setup.md:196 and :225 (rule 10); packages/ngx-yeti/README.md:146 (rule 10); .project/tasks/T016-route-level-provide-yeti-styles-no-effect.md

## Finding

- **Found**: A route-level provideYetiStyles changes neither url nor preload, and a root-level call still preloads exactly once, matching setup.md:196 and :225, README rule 10, and the JSDoc. Confirmed by both T016's spec and an independent reviewer probe at the reviewed HEAD.
- **Fix direction**: none
