# Patch Findings

Reviewed HEAD: 1ac159a21be091ed19cbeb6b4646ecc467f528a6
State: ship/blocked

## Findings

### P001 — Route-level provideYetiStyles still preloads

- **Source**: `.project/review/final-gap-3.md`
- **Locator**: `Risk: Documented provideYetiStyles placement matches the loader`
- **Evidence**: A route-level `provideYetiStyles()` is not without effect: its `preload` list runs at route-injector creation and writes preload links (using the root `url`), while its `url` is silently ignored. This contradicts setup.md:196, README rule 10, and the JSDoc, which all say a route-level call has no effect.
- **Fix direction**: Make the code match setup.md (which outranks the README): the preload initializer must act only when provideYetiStyles is in the root environment injector, e.g. in the initializer, skip unless `inject(EnvironmentInjector) === inject(ApplicationRef).injector` (or move preload into the root YetiStyles reading `yetiStylesConfig.preload` from the root injector, so a route-level config is never read). Add a spec like the one above asserting no preload link and default url after a route-level call.
