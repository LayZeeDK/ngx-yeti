# ngx-yeti-testing

Test helpers shared by the `ngx-yeti` specs, stories, and the e2e projects. The project is never built or published.

- `@ngx-yeti/testing`: browser helpers, such as `itemStylesLoaded`, `contrastRatio`, and `wcagTags`.
- `@ngx-yeti/testing/server`: Node-only helpers, such as `renderServer`, `checkContract`, the HTML readers `head`, `openingTags`, `itemLinkOf`, and `jsactionTags`, and Yeti's value lists `gaps`, `widths`, and `widthsOrNone`.
- `@ngx-yeti/testing/test-bed`: `createDirectiveHost`, which creates a directive alone with `TestBed.createDirective` for a layer-2 spec. It imports Angular's testing module, so it is not in the browser entry.
- `@ngx-yeti/testing/playwright`: Playwright helpers of the two e2e apps, such as `rect`, `usedLength`, `resize`, and `expectItemSheetsApplied`. It imports `@playwright/test` and nothing of Angular.
