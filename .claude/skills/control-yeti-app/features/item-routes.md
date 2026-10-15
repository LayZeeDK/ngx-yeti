# Item routes

Each fixture of the Fixture app renders one item's markup at two addresses: a prerendered page built at build time
and a page the Node server renders per request. The page shows the app heading `Welcome yeti-app` and the fixture
below it, and its head carries one `link[data-ngx-yeti-styles="<item>"]` per item the page uses.

## Sub-features

- `route-prerendered` serves `<url><item>` from HTML rendered at build time (`ng-server-context="ssg"`).
- `route-server` serves `<url>server/<item>` rendered per request.
- `item-links` lists the item stylesheets in the head, in Yeti's rank order whatever order they arrive in.
- `item-markup` shows the host classes and `data-*` attributes the directives write.
- `route-leave` removes an item's link when no host of it remains (for example the card fixture's
  `Leave for a page without cards` link).
- `route-csp` serves `<url>server/<item>?csp` under a strict `style-src` policy with a per-request nonce on every
  item link (`apps/yeti-app/src/server.ts`); a prerendered route gets no nonce.

## How to get to it (user POV)

- Open `<url><item>` or `<url>server/<item>` for a key of `apps/yeti-app/src/app/fixtures/fixtures.ts`.
- Follow an in-page router link, such as `Leave for a page without cards` on `card`, which goes to `<url>replay`.
- Add `?csp` to a server-rendered route, as the strict-CSP e2e case does (`apps/yeti-app-e2e/src/setup-serving.spec.ts`).

## Driving it with control-yeti-app

Preconditions:

- Baseline from the README; any mode works, `--mode=ssr` when the fixture has `@defer` or `hydrate never` blocks.

Steps:

- **Open.** Open the prerendered card route. Run `playwright-cli -s=<session> open <url>card`. The page title is
  `yeti-app` and the snapshot shows heading `Welcome yeti-app` and heading `Weekend trips`.
- **Snapshot.** Run `playwright-cli -s=<session> snapshot --filename=<evidenceDir>/card.yml`. The snapshot holds
  link `Weekend in the hills` and three list items.
- **Item links.** Save this as `<evidenceDir>/item-links.js`:

  ```js
  async function itemLinks(page) {
    return page.locator('head link[data-ngx-yeti-styles]').evaluateAll((links) => links.map((link) => link.getAttribute('data-ngx-yeti-styles')));
  }
  ```

  Run `playwright-cli -s=<session> --raw run-code --filename=<evidenceDir>/item-links.js`. On `card` it prints
  `["grid","button","card","spinner","lift"]` (measured 2026-10-15).

- **Server-rendered.** Run `playwright-cli -s=<session> goto <url>server/card` and repeat the two steps above. The
  same heading and item links appear (measured in both modes; on `serve` the page carries `ng-server-context="ssr"`,
  the prerendered one `ng-server-context="ssg"`).
- **Strict CSP.** Run `curl -s -D <evidenceDir>/card-csp.headers -o <evidenceDir>/card-csp.html "<url>server/card?csp"`,
  then `rg -i '^content-security-policy' <evidenceDir>/card-csp.headers`: it prints
  `content-security-policy: style-src 'self' 'nonce-<nonce>'`. Then
  `rg -o '<link[^>]*data-ngx-yeti-styles[^>]*>' <evidenceDir>/card-csp.html | rg -c 'nonce='` counts the item links
  that carry a nonce: `5` on `card`, every one (measured 2026-10-15 on `ssr` production; `serve` sends the same
  header).
- **Leave.** Click `Leave for a page without cards`:
  `playwright-cli -s=<session> click "getByRole('link', { name: 'Leave for a page without cards' })"`. The URL becomes `<url>replay`; rerun the item-links script: it prints `[]` (measured 2026-10-15).
- **Proof.** Run `playwright-cli -s=<session> screenshot --filename=<evidenceDir>/card.png`. The screenshot shows
  `Welcome yeti-app` and the card grid.

## Gotchas

- Use `localhost`, not `127.0.0.1`: the server allows only the `localhost` host, and the dev server listens on
  `::1` only.
- The e2e suite asserts item links as containment where later items add entries; compare lists the same way when a
  later task extends a fixture.
- `nx serve` loads every `@defer` dependency eagerly under HMR (`NG0751`); a `@defer` case on `--mode=serve` does not
  show the real loading order.
- `run-code` has no `URL` global; derive addresses with string operations.
