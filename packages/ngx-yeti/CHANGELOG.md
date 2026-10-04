# Changelog

Versions follow `0.<Angular major><Angular minor, two digits><breaking counter, two digits>.<patch>-yeti.<Yeti version>.g<Yeti commit SHA>`. A change in the two-digit counter marks a breaking release. Install an exact version.

## 0.220200.0-yeti.7.0.0-alpha.0.gf52d1e8 (unreleased)

Built against Yeti `7.0.0-alpha.0` at commit `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`. Build Yeti at that commit.

### Entry points

- `ngx-yeti`: types only, generated from Yeti's `yeti.d.ts` at the pin, such as `YetiComponentName`, `YetiVariant`, `YetiWidth`, `YetiRatio`, and `YetiLift`.
- `ngx-yeti/styles`: `provideYetiStyles` with its `YetiStylesConfig` type, and `injectYetiItemStyles`, which load each item's Yeti file as a counted link in `<head>` on the server and the client.
- `ngx-yeti/card`: `YetiCard`, `YetiCardLink`, and `yetiCardToken`.
- `ngx-yeti/lift`: `NgxYetiLift`.
- `ngx-yeti/accessibility.css`: the package's accessibility stylesheet, in `@layer ngx-yeti`. Import it after the Yeti imports in the global stylesheet, before your theme and application CSS. It has no accessibility rule yet; it carries a workaround that makes Yeti's sizes render in Firefox 145 to 152, which reject the `atan2()` division of relative lengths that Yeti's scale uses.

The package declares no `yeti-css` dependency or peer dependency, and its declarations never import `yeti-css`.
