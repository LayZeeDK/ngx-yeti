# Hydration and replay

The client takes over the server-rendered page without re-rendering it: in a development build Angular logs one
hydration summary with no skipped component and no `NG05xx` message, and event replay removes every `jsaction`
attribute when it finishes. A click made before the main bundle runs is replayed to the component's handler after
hydration.

## Sub-features

- `hydration-summary` logs `Angular hydrated <n> component(s) and <n> node(s), 0 component(s) were skipped.`
  (development builds only).
- `hydration-clean` logs no `NG05xx` hydration message.
- `held-main` shows the server page, its item links and its `jsaction` markers while `main.js` is held back.
- `replay-click` replays a click made before hydration: on `<url>replay` the button reads `Clicked 1 times`
  afterwards.

## How to get to it (user POV)

- Open any route and let the client boot; the summary appears in the browser console.
- On a slow connection, click a control before the page has finished loading; the click takes effect once the app
  boots.

## Driving it with control-yeti-app

Preconditions:

- Baseline from the README, a development build (`doctor` says `build: development`) for the summary. The held
  recipes work in both builds: the pattern matches `main.js` and the hashed `main-<HASH>.js`.

- **Summary.** Run `playwright-cli -s=<session> open <url>card`, then `playwright-cli -s=<session> console`. The
  console log holds `Angular is running in development mode.` and
  `Angular hydrated 2 component(s) and 59 node(s), 0 component(s) were skipped.` (measured on `serve` development).
- **Hold `main.js` back on an item route.** Save this as `<evidenceDir>/held-card.js` (it follows
  `holdBackMainBundle` in `apps/yeti-app-e2e/src/support/main-bundle.ts`) and replace `<evidenceDir>` inside it:

  ```js
  async (page) => {
    let release;
    const released = new Promise((resolve) => {
      release = resolve;
    });
    await page.route(/\/main(-[0-9A-Z]+)?\.js$/, async (route) => {
      await released;
      await route.continue();
    });
    await page.goto(page.url().replace(/[^/]*$/, 'card'), { waitUntil: 'commit' });
    await page.locator('article').first().waitFor();
    const held = {
      itemLinks: await page.locator('head link[data-ngx-yeti-styles]').evaluateAll((links) => links.map((link) => link.getAttribute('data-ngx-yeti-styles'))),
      jsaction: await page.locator('[jsaction]').count(),
    };
    await page.screenshot({ path: '<evidenceDir>/card-held.png' });
    release();
    await page.waitForFunction(() => !document.querySelector('[jsaction]'));
    await page.unrouteAll();
    return { held, jsactionAfter: await page.locator('[jsaction]').count() };
  };
  ```

  From a page of the app, run `playwright-cli -s=<session> --raw run-code --filename=<evidenceDir>/held-card.js`.
  It prints `{"held":{"itemLinks":["card","lift"],"jsaction":7},"jsactionAfter":0}` (measured on `serve`
  development): the item links are in place before any client code, and hydration clears the markers once released.

- **Replay a click.** Save this as `<evidenceDir>/held-replay.js` and replace `<evidenceDir>` inside it:

  ```js
  async (page) => {
    let release;
    const released = new Promise((resolve) => {
      release = resolve;
    });
    await page.route(/\/main(-[0-9A-Z]+)?\.js$/, async (route) => {
      await released;
      await route.continue();
    });
    await page.goto(page.url().replace(/[^/]*$/, 'replay'), { waitUntil: 'commit' });
    const button = page.getByRole('button', { name: /Clicked/ });
    await button.waitFor();
    const jsaction = await page.locator('[jsaction]').count();
    await page.screenshot({ path: '<evidenceDir>/replay-held.png' });
    await button.click();
    release();
    await page.waitForFunction(() => !document.querySelector('[jsaction]'));
    await page.unrouteAll();
    return { jsaction, text: (await button.textContent()).trim() };
  };
  ```

  Run `playwright-cli -s=<session> --raw run-code --filename=<evidenceDir>/held-replay.js`. The text is
  `Clicked 1 times` (measured on `serve` development): the click made before hydration reached the handler.

- **Proof.** Keep the screenshot the script wrote, the printed JSON, and the console log file named in the
  command output (`.playwright-cli/console-*.log`).

## Gotchas

- A held module script also holds back `DOMContentLoaded`; navigate with `waitUntil: 'commit'`, as the e2e helper
  does, or `goto` never returns.
- Production builds log no hydration summary; `doctor` skips that check there. Use the `jsaction` count as the
  hydration-done signal in both builds.
- With the bundle held, WebKit can paint no frame on a sparse page (upstream bugs O4 and O7); this recipe runs in
  Chromium only.
- `page.url()` must be an app page before the script runs, because the script derives the target from it; open
  `<url>card` first.
