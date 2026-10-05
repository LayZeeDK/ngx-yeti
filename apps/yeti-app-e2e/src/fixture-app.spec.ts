import { type Page } from '@playwright/test';
import { expect, routeKinds, test } from './support/fixtures';
import { waitForHydration } from './support/hydration';
import {
  clickWhileHeld,
  holdBackMainBundle,
  mainBundle,
} from './support/main-bundle';
import { recordStyleMutations } from './support/style-probe';

// The card route's hydration and JavaScript-off tests live in card.spec.ts,
// the global stylesheet's in setup.spec.ts.
for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} route`, () => {
    test('replays a click made before hydration', async ({
      browserName,
      page,
    }) => {
      const release = await holdBackMainBundle(page);
      const button = page.getByRole('button');

      await page.goto(`${prefix}replay`, { waitUntil: 'commit' });
      await clickWhileHeld(button, browserName);

      await expect(
        button,
        'the click is not handled before hydration',
      ).toHaveText('Clicked 0 times');

      release();

      await expect(button, 'the click is replayed after hydration').toHaveText(
        'Clicked 1 times',
      );
    });
  });
}

// Firefox hydrates the routed component while the main bundle runs, before
// DOMContentLoaded, so the probe must see a link moved there.
test('the style mutation probe sees an item link moved while the main bundle runs', async ({
  page,
}) => {
  const styleMutations = await recordStyleMutations(page);

  await page.route(mainBundle, async (route) => {
    const response = await route.fetch();
    const moveItemLinks = `for (const link of document.head.querySelectorAll('link[data-ngx-yeti-styles]')) { document.head.append(link); }\n`;

    await route.fulfill({
      response,
      body: moveItemLinks + (await response.text()),
    });
  });
  await page.goto('card');
  await waitForHydration(page);

  expect(await styleMutations()).toEqual([
    'remove link[data-ngx-yeti-styles="card"]',
    'add link[data-ngx-yeti-styles="card"]',
    'remove link[data-ngx-yeti-styles="lift"]',
    'add link[data-ngx-yeti-styles="lift"]',
  ]);
});

test.describe('the axe fixture', () => {
  async function violationsWithImageMissingAlt(
    page: Page,
    axeViolations: () => Promise<string[]>,
  ): Promise<string[]> {
    await page.goto('card');
    await page.locator('main').evaluate((main) => {
      main.append(document.createElement('img'));
    });

    return axeViolations();
  }

  test('reports a violation with JavaScript on', async ({
    axeViolations,
    page,
  }) => {
    expect(
      await violationsWithImageMissingAlt(page, axeViolations),
    ).toContainEqual(expect.stringMatching(/^image-alt: /));
  });

  test.describe('with JavaScript off', () => {
    test.use({ javaScriptEnabled: false });

    test('reports a violation', async ({ axeViolations, page }) => {
      expect(
        await violationsWithImageMissingAlt(page, axeViolations),
      ).toContainEqual(expect.stringMatching(/^image-alt: /));
    });
  });
});
