# Changelog

Versions follow `0.<Angular major><Angular minor, two digits><breaking counter, two digits>.<patch>-yeti.<Yeti version>.g<Yeti commit SHA>`. A change in the two-digit counter marks a breaking release. Install an exact version.

## 0.220200.0-yeti.7.0.0-alpha.0.gf52d1e8 (unreleased)

Built against Yeti `7.0.0-alpha.0` at commit `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`. Build Yeti at that commit.

### Entry points

- `ngx-yeti`: types only, generated from Yeti's `yeti.d.ts` at the pin, such as `YetiComponentName`, `YetiVariant`, `YetiWidth`, `YetiRatio`, and `YetiLift`.
- `ngx-yeti/styles`: `provideYetiStyles` with its `YetiStylesConfig` type, and `injectYetiItemStyles`, which load each item's Yeti file as a counted link in `<head>` on the server and the client.
- `ngx-yeti/box`: `YetiBox`, and the any-element markers `YetiBorder`, `NgxYetiPaint`, and `YetiText`, which load no item file.
- `ngx-yeti/breakout`: `YetiBreakout`, `YetiBreakoutChild`, `YetiBreakoutNote`, and `yetiBreakoutToken`.
- `ngx-yeti/card`: `YetiCard`, `YetiCardLink`, and `yetiCardToken`.
- `ngx-yeti/center`: `YetiCenter`.
- `ngx-yeti/cluster`: `YetiCluster`.
- `ngx-yeti/columns`: `NgxYetiColumns`, `YetiColumnsChild`, and `yetiColumnsToken`.
- `ngx-yeti/cover`: `YetiCover`, `YetiCoverChild`, and `yetiCoverToken`.
- `ngx-yeti/enter`: `NgxYetiEnter`, which plays Yeti's entrance animation on load or when the element scrolls into view.
- `ngx-yeti/frame`: `YetiFrame`.
- `ngx-yeti/grid`: `YetiGrid`, `YetiGridChild`, and `yetiGridToken`.
- `ngx-yeti/layer`: `YetiLayer`, `YetiLayerChild`, and `yetiLayerToken`.
- `ngx-yeti/lift`: `NgxYetiLift`.
- `ngx-yeti/masonry`: `YetiMasonry`.
- `ngx-yeti/overlay`: `YetiOverlay`, `YetiOverlayChild`, and `yetiOverlayToken`.
- `ngx-yeti/scroller`: `YetiScroller` and the `YetiScrollerJustify` type. The scroller is a focusable region, so keyboard users can scroll it.
- `ngx-yeti/sidebar`: `YetiSidebar`, `YetiSidebarChild`, and `yetiSidebarToken`.
- `ngx-yeti/spinner`: `YetiSpinner`.
- `ngx-yeti/stack`: `YetiStack`, `YetiStackChild`, and `yetiStackToken`.
- `ngx-yeti/timeline`: `YetiTimeline`.
- `ngx-yeti/visually-hidden`: `YetiVisuallyHidden`.
- `ngx-yeti/accessibility.css`: the package's accessibility stylesheet, in `@layer ngx-yeti`. Import it after the Yeti imports in the global stylesheet, before your theme and application CSS. Under forced colours it keeps the turning edge of the spinner's ring, and of a busy button's ring, visible. It also carries a workaround that makes Yeti's sizes render in Firefox 145 to 152, which reject the `atan2()` division of relative lengths that Yeti's scale uses.

The package declares no `yeti-css` dependency or peer dependency, and its declarations never import `yeti-css`.
