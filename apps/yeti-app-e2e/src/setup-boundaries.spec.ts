import { expect, routeKinds, test } from './support/fixtures';
import { waitForHydration } from './support/hydration';
import { clickWhileHeld, holdBackMainBundle } from './support/main-bundle';
import { delayCss, itemLinks, recordFrames } from './support/style-probe';

/**
 * Ticket 37's consumer `@boundary` cases as setup.md:343 keeps them, as
 * regression tests of the setup spec's `@boundary` documentation.
 */

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} setup-boundaries route`, () => {
    test('shows the item after hydration when only the server threw', async ({
      page,
    }) => {
      await page.goto(`${prefix}setup-boundaries`);
      await waitForHydration(page);

      await expect(page.locator('#server-error-card')).toBeVisible();
      await expect(page.locator('#server-error-fallback')).toHaveCount(0);
    });

    test('leaves the region empty with the boundary outside a client-only @defer, and shows the fallback with it inside', async ({
      page,
    }) => {
      await page.goto(`${prefix}setup-boundaries`);
      await waitForHydration(page);

      await page
        .getByRole('button', {
          name: 'Show the card with the boundary outside',
        })
        .click();
      await page
        .getByRole('button', { name: 'Show the card with the boundary inside' })
        .click();

      const inside = page.locator('#defer-inside');
      const outside = page.locator('#defer-outside');

      await expect(inside).toContainText(
        'Fallback: the boundary inside caught the error.',
      );
      await expect(inside.locator('article')).toHaveCount(0);
      await expect(
        outside.getByRole('button'),
        'the placeholder has gone',
      ).toHaveCount(0);
      await expect(outside.locator('article')).toHaveCount(0);
      await expect(outside).not.toContainText('Fallback');
    });

    test('loses a click on replaced markup made before hydration', async ({
      browserName,
      page,
    }) => {
      const release = await holdBackMainBundle(page);
      const fallbackButton = page.getByRole('button', {
        name: 'Count a click on the fallback',
      });

      await page.goto(`${prefix}setup-boundaries`, { waitUntil: 'commit' });
      await clickWhileHeld(fallbackButton, browserName);
      release();
      await waitForHydration(page);

      await expect(
        page.locator('#replaced-card'),
        'the client replaced the fallback with the card',
      ).toBeVisible();
      await expect(fallbackButton).toHaveCount(0);
      await expect(page.locator('#replaced-clicks')).toHaveText(
        'Clicks on the fallback: 0',
      );
    });

    test('records the unstyled frames after $reset() with and without a preload', async ({
      page,
    }) => {
      const cardPadding = await recordFrames(
        page,
        '#reset-card',
        'padding-top',
      );

      await page.goto(`${prefix}setup-boundaries`);
      await waitForHydration(page);

      // Leave the reset case's card as the page's only card and lift.
      await page
        .getByRole('button', { name: 'Remove the server-error cases' })
        .click();
      await page.getByRole('button', { name: 'Break the card' }).click();
      await expect(page.locator('#reset-card')).toHaveCount(0);
      await expect.poll(() => itemLinks(page)).toEqual([]);

      const liftTransition = await recordFrames(
        page,
        '#reset-card',
        'transition-property',
        { start: 'now' },
      );

      await delayCss(page);
      await page.getByRole('button', { name: 'Reset the card' }).click();

      const card = page.locator('#reset-card');

      await expect(card).not.toHaveCSS('padding-top', '0px');
      await expect(card).not.toHaveCSS('transition-property', 'all');
      expect(await itemLinks(page)).toEqual(['card', 'lift']);

      const card0 = await cardPadding();
      const lift = await liftTransition();

      test.info().annotations.push(
        {
          type: 'frames',
          description: `card (preloaded): ${String(card0.filter((value) => value === '0px').length)} of ${String(card0.length)} frames without Yeti`,
        },
        {
          type: 'frames',
          description: `lift (not preloaded): ${String(lift.filter((value) => value === 'all').length)} of ${String(lift.length)} frames without Yeti`,
        },
      );
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('shows the fallback when the server threw', async ({ page }) => {
        await page.goto(`${prefix}setup-boundaries`);

        await expect(page.locator('#server-error-fallback')).toHaveText(
          'Fallback: the card failed on the server.',
        );
        await expect(page.locator('#server-error-card')).toHaveCount(0);
      });
    });
  });
}
