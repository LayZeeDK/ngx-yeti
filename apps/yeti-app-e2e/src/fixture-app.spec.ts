import { type Page } from '@playwright/test';
import { expect, routeKinds, test } from './support/fixtures';
import { holdBackMainBundle } from './support/main-bundle';

// The card route's hydration and JavaScript-off tests live in card.spec.ts,
// the global stylesheet's in setup.spec.ts.
for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} route`, () => {
    test('replays a click made before hydration', async ({ page }) => {
      const release = await holdBackMainBundle(page);
      const button = page.getByRole('button');

      await page.goto(`${prefix}replay`, { waitUntil: 'commit' });
      // With the bundle held, WebKit sometimes paints no frame at all (when the
      // card style preload lands after parsing ends), so the click's wait for
      // two stable animation frames never ends. The forced click is still a
      // real pointer event before hydration, which the assertions below need.
      // eslint-disable-next-line playwright/no-force-option -- the page may paint no frame until hydration, see above
      await button.click({ force: true });

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
