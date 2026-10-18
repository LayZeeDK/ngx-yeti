import { type Page } from '@playwright/test';
import { expect, routeKinds, test } from './support/fixtures';
import { waitForHydration } from './support/hydration';
import { clickWhileHeld, holdBackMainBundle } from './support/main-bundle';
import {
  delayCss,
  expectStyledFrames,
  itemLinks,
  recordFrames,
  recordItemRequests,
} from './support/style-probe';

/**
 * The consumer `@boundary` cases setup.md:343 keeps, as regression tests of
 * the setup spec's `@boundary` documentation.
 */

/**
 * Opens the route, hydrates, and breaks the reset case's card once it is the
 * page's only card and lift, so both item links have left `<head>`.
 */
async function breakTheOnlyCard(page: Page, prefix: string): Promise<void> {
  await page.goto(`${prefix}setup-boundaries`);
  await waitForHydration(page);

  await page
    .getByRole('button', { name: 'Remove the server-error cases' })
    .click();
  await page.getByRole('button', { name: 'Break the card' }).click();
  await expect(page.locator('#reset-card')).toHaveCount(0);
  await expect.poll(() => itemLinks(page)).toEqual([]);
}

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

    test('keeps the preloaded card styled after $reset()', async ({
      browserName,
      page,
    }) => {
      await breakTheOnlyCard(page, prefix);

      const cardPadding = await recordFrames(
        page,
        '#reset-card',
        'padding-top',
        { start: 'now' },
      );
      const requests = recordItemRequests(page);

      await delayCss(page, /\/card\.css\?/);
      await page.getByRole('button', { name: 'Reset the card' }).click();

      const card = page.locator('#reset-card');

      await expect(card).not.toHaveCSS('padding-top', '0px');
      await expect(card).not.toHaveCSS('transition-property', 'all');
      expect(await itemLinks(page)).toEqual(['card', 'lift']);

      // WebKit applies no newly loaded sheet while another is pending, so the
      // preloaded card waits for lift.css (upstream-bugs.md O17).
      expectStyledFrames(await cardPadding(), {
        styled: (value) => value !== '0px',
        label: `${browserName}, ${kind}, preloaded card after $reset()`,
        ...(browserName === 'webkit'
          ? { recordedAs: 'webkit-pending-sheet-frames' }
          : {}),
      });

      // Firefox serves a re-inserted link from memory even with its cache off.
      expect(requests()).toEqual(
        browserName === 'firefox' ? [] : ['utilities/lift/lift.css'],
      );
    });

    test("records the lift's frames after $reset() without a preload", async ({
      browserName,
      page,
    }) => {
      await breakTheOnlyCard(page, prefix);

      const liftTransition = await recordFrames(
        page,
        '#reset-card',
        'transition-property',
        { start: 'now' },
      );

      await delayCss(page);
      await page.getByRole('button', { name: 'Reset the card' }).click();

      const card = page.locator('#reset-card');

      await expect(card).not.toHaveCSS('transition-property', 'all');
      expect(await itemLinks(page)).toEqual(['card', 'lift']);

      expectStyledFrames(await liftTransition(), {
        styled: (value) => value !== 'all',
        label: `${browserName}, ${kind}, lift after $reset() without a preload`,
        recordedAs: 'no-preload-frames',
      });
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
