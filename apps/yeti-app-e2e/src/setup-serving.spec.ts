import { type Page } from '@playwright/test';
import { expect, isProduction, test } from './support/fixtures';
import { waitForHydration } from './support/hydration';
import { itemLinks, recordFrames } from './support/style-probe';

/** The `nx serve` entry of `playwright.config.mts`. */
const devServerURL = 'http://localhost:4312/sub/';

/** Whether every item link in `<head>` has loaded its stylesheet. */
async function itemSheetsLoaded(page: Page): Promise<boolean> {
  return page
    .locator('head link[data-ngx-yeti-styles]')
    .evaluateAll((links) =>
      links.every(
        (link) => link instanceof HTMLLinkElement && link.sheet !== null,
      ),
    );
}

/** Lists each CSP violation the page reports. Call before `goto`. */
async function recordCspViolations(
  page: Page,
): Promise<() => Promise<readonly string[]>> {
  const messages: string[] = [];

  page.on('console', (message) => {
    if (/Content Security Policy/i.test(message.text())) {
      messages.push(message.text());
    }
  });
  await page.addInitScript(() => {
    const violations: string[] = [];

    Reflect.set(window, '__cspViolations', violations);
    document.addEventListener('securitypolicyviolation', (event) => {
      violations.push(`${event.effectiveDirective} ${event.blockedURI}`);
    });
  });

  return async () => {
    const events: unknown = await page.evaluate((): unknown =>
      Reflect.get(window, '__cspViolations'),
    );

    return [...(Array.isArray(events) ? events.map(String) : []), ...messages];
  };
}

test.describe('the development server', () => {
  test('serves the setup route with every item link loaded and the card styled', async ({
    page,
  }) => {
    test.skip(
      isProduction,
      '`nx serve` runs the development build; the production run has no dev server',
    );

    await page.goto(`${devServerURL}setup`);
    await waitForHydration(page, '#interaction-host');

    expect(await itemLinks(page)).toEqual(['card', 'lift']);
    await expect.poll(() => itemSheetsLoaded(page)).toBe(true);
    await expect(page.locator('#shared-host')).not.toHaveCSS(
      'padding-top',
      '0px',
    );
  });
});

test.describe('the strict-CSP card route', () => {
  test('carries the nonce on every item link and inlined style with no violation', async ({
    page,
  }) => {
    const violations = await recordCspViolations(page);
    const response = await page.goto('server/card?csp');
    const policy = response?.headers()['content-security-policy'] ?? '';
    const nonce = /^style-src 'self' 'nonce-([^']+)'$/.exec(policy)?.[1] ?? '';

    expect(nonce, `a strict style-src policy: ${policy}`).not.toBe('');

    await waitForHydration(page);

    expect(await itemLinks(page)).toEqual(['card', 'lift']);

    // Browsers hide the `nonce` attribute; the property keeps its value.
    const nonced = await page
      .locator('head link[data-ngx-yeti-styles], style')
      .evaluateAll((elements) =>
        elements.map((element) =>
          element instanceof HTMLElement
            ? `${element.localName} ${element.nonce}`
            : '',
        ),
      );
    const expected = (tag: string): string => `${tag} ${nonce}`;

    expect(nonced, 'the card link carries the nonce').toContain(
      expected('link'),
    );
    expect(
      nonced.filter(
        (entry) => entry !== expected('link') && entry !== expected('style'),
      ),
      'every item link and style carries the nonce',
    ).toEqual([]);

    if (isProduction) {
      expect(
        nonced,
        "Angular's inlined critical CSS is a nonced style",
      ).toContain(expected('style'));
    }

    await expect(page.locator('article')).not.toHaveCSS('padding-top', '0px');
    expect(await violations(), 'no CSP violation').toEqual([]);
  });

  test('leaves the route without the flag as it was', async ({ page }) => {
    const response = await page.goto('server/card');

    expect(response?.headers()['content-security-policy']).toBeUndefined();

    const nonced = await page
      .locator('head link[data-ngx-yeti-styles]')
      .evaluateAll((links) => links.map((link) => link.hasAttribute('nonce')));

    expect(nonced.length, 'the route has item links').toBeGreaterThan(0);
    expect(nonced.every((hasNonce) => !hasNonce)).toBe(true);
  });
});

test.describe('upstream bug A4', () => {
  test("records the card's frames without padding while the global stylesheet is delayed", async ({
    browserName,
    page,
  }) => {
    const cardPadding = await recordFrames(page, 'article', 'padding');

    // Routing also turns the HTTP cache off.
    await page.route(/\/styles(-[A-Z0-9]+)?\.css$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.continue();
    });
    await page.goto('server/card');
    await waitForHydration(page);
    await expect(page.locator('article')).not.toHaveCSS('padding-top', '0px');

    const frames = (await cardPadding()).filter((value) => value !== '');

    expect(frames.length, 'the card was sampled').toBeGreaterThan(0);
    test.info().annotations.push({
      type: 'frames',
      description: `${browserName}, critical-CSS inlining ${isProduction ? 'on (production)' : 'off (development)'}: ${String(frames.filter((value) => value === '0px').length)} of ${String(frames.length)} frames with padding: 0`,
    });
  });
});
