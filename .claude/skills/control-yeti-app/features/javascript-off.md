# JavaScript off

With JavaScript disabled, a Fixture route is exactly the HTML the server sent: every item is visible, styled by the
item links in the head, and no client code runs. This is the package's JavaScript-off guarantee under SSR and SSG.

## Sub-features

- `jsoff-render` shows each fixture's content readable and styled with no script.
- `jsoff-item-links` keeps the server-written item links in the head.
- `jsoff-markup` keeps the classes and `data-*` attributes the server wrote (for example `class="card"` and
  `data-threshold="xs"` on the card's `article`).
- `jsoff-keyboard` lets Tab reach links and focusable regions without hydration.

## How to get to it (user POV)

- Open `<url><item>` or `<url>server/<item>` in a browser with JavaScript disabled.

## Driving it with control-yeti-app

Preconditions:

- Baseline from the README.
- `up` wrote `<evidenceDir>/js-off.json`: `{ "browser": { "contextOptions": { "javaScriptEnabled": false } } }`.
- The JavaScript-off browser runs in its own session, `<session>-jsoff` (`info` lists it under `sessions`); `down`
  closes it together with `<session>`.

Steps:

- **Open with JavaScript off.** Run
  `playwright-cli -s=<session>-jsoff open <url>card --config=<evidenceDir>/js-off.json`. The snapshot shows
  heading `Welcome yeti-app`, heading `Weekend trips` and link `Weekend in the hills` (measured).
- **Snapshot.** Run `playwright-cli -s=<session>-jsoff snapshot --filename=<evidenceDir>/card-jsoff.yml`.
- **Item links.** Read them from the served HTML, which is the page with JavaScript off:
  `curl -s <url>card | rg -o 'data-ngx-yeti-styles="[^"]+"'`. On `card` it prints one line each for `grid`,
  `button`, `card`, `spinner` and `lift`, in that order (measured 2026-10-15).
- **Markup.** The served HTML holds the markup too: `curl -s <url>card | rg -o '<article[^>]*>'` prints
  `<article data-ngx-yeti-item-card="" yeticard="" threshold="xs" class="card" data-threshold="xs">` (measured
  2026-10-16).
- **Keyboard.** Run `playwright-cli -s=<session>-jsoff press Tab` and take a fresh snapshot; the focused element is
  marked `[active]`.
- **Proof.** Run `playwright-cli -s=<session>-jsoff screenshot --filename=<evidenceDir>/card-jsoff.png` (measured:
  works with JavaScript off). Then `playwright-cli -s=<session>-jsoff close`.

## Gotchas

- In a JavaScript-off session, `eval` and `run-code` hang (measured: a trivial `async page => page.url()` ran past
  40 s) and block every later command of that session until `close`. Use `snapshot`, `find`, `click`, `press`
  and `screenshot` there, and `curl` for the head.
- Do not open the JavaScript-off browser under `<session>`: the main session's `run-code` recipes need
  JavaScript.
- A computed-style claim with JavaScript off (geometry, colour) needs a script; take it to the e2e suite, which
  evaluates in a JavaScript-off context through Playwright's locator API.
