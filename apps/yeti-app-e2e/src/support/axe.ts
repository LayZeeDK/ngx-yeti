import { AxeBuilder } from '@axe-core/playwright';
import { violationLines, wcagTags } from '@ngx-yeti/testing';
import { type Browser, type Page } from '@playwright/test';
import axe from 'axe-core';

/**
 * With JavaScript disabled, Playwright still evaluates scripts, but timers
 * never fire, so `axe.run` never settles (measured in Chromium and WebKit).
 * axe only uses `setTimeout` to yield, so a microtask does the same job
 * there. Page scripts never run on such a page, so nothing else sees the
 * change. The shim would also fire axe's preload timeout at once and log
 * "Couldn't load preload assets", so preload is off there. axe then runs its
 * preload rules (css-orientation-lock, which `wcagTags` leaves out as
 * experimental, and no-autoplay-audio) without the preloaded CSSOM and
 * media, as it did after that timeout.
 */
const microtaskTimers = `window.setTimeout = (callback) => {
  Promise.resolve().then(callback);
  return 0;
};
`;

/**
 * One `id: help (targets)` line per violation (`violationLines`). Tests use
 * it through the `axeViolations` fixture of `fixtures.ts`.
 */
export async function axeViolations(
  page: Page,
  javaScriptEnabled: boolean,
): Promise<string[]> {
  const { violations } = await new AxeBuilder({
    page,
    ...(javaScriptEnabled ? {} : { axeSource: microtaskTimers + axe.source }),
  })
    // options() replaces every run option, so it comes before withTags().
    .options(javaScriptEnabled ? {} : { preload: false })
    .withTags([...wcagTags])
    .analyze();

  return violationLines(violations);
}

/**
 * `axeViolations` for a JavaScript-disabled page in Firefox. Firefox runs no
 * microtask on such a page, so axe cannot settle there (measured). The
 * page's DOM is served instead as a snapshot, with every script removed, its
 * `<noscript>` content unwrapped and `script-src 'none'`, to a new page with
 * JavaScript on, so axe can run there and no script of the page's own can.
 * The snapshot renders as the JavaScript-disabled page does: axe results and
 * computed styles matched in Chromium, and computed styles in Firefox
 * (measured). It carries markup only, not focus, scroll, form values set by
 * property, runtime routes, `emulateMedia`, iframes, declarative shadow roots
 * or response headers.
 */
export async function axeViolationsOfSnapshot(
  browser: Browser,
  page: Page,
): Promise<string[]> {
  const url = new URL(page.url());

  url.hash = '';

  const html = (await page.content())
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?noscript\b[^>]*>/gi, '');
  // browser.newContext() takes the test's use options, so JavaScript stays
  // off unless set here.
  const context = await browser.newContext({
    javaScriptEnabled: true,
    viewport: page.viewportSize(),
  });

  try {
    const served: string[] = [];

    await context.route(
      (requestUrl) => requestUrl.href === url.href,
      (route) => {
        served.push(route.request().url());

        return route.fulfill({
          contentType: 'text/html; charset=utf-8',
          headers: { 'content-security-policy': "script-src 'none'" },
          body: html,
        });
      },
    );

    const snapshot = await context.newPage();
    const warnings: string[] = [];

    snapshot.on('console', (message) => {
      if (message.type() === 'warning') {
        warnings.push(message.text());
      }
    });
    await snapshot.goto(url.href);

    if (served.length === 0) {
      throw new Error(`The snapshot of ${url.href} was not served`);
    }

    const violations = await axeViolations(snapshot, true);

    if (warnings.length > 0) {
      throw new Error(`The snapshot logged warnings: ${warnings.join('; ')}`);
    }

    return violations;
  } finally {
    await context.close();
  }
}
