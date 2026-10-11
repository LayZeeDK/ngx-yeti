import { type Locator, type Page } from '@playwright/test';
import {
  expect,
  expectOnlyClientPreloads,
  isProduction,
  routeKinds,
  test,
} from './support/fixtures';
import {
  nextFrames,
  waitForHydration,
  watchHydration,
} from './support/hydration';
import {
  itemLinks,
  itemSheetsLoaded,
  recordFrames,
  recordHostAttributes,
  recordStyleMutations,
} from './support/style-probe';

/** The largest box Yeti's recipe may leave (visually-hidden.md:275). */
const largestBox = 1.5;

async function box(
  locator: Locator,
): Promise<{ width: number; height: number }> {
  return locator.evaluate((element) => {
    const { width, height } = element.getBoundingClientRect();

    return { width, height };
  });
}

/** Upstream bug O2: read geometry only once the item sheet has applied. */
async function expectHidden(page: Page, span: Locator): Promise<void> {
  await expect
    .poll(() => itemSheetsLoaded(page, ['visually-hidden']), {
      message: 'the visually-hidden stylesheet is loaded',
    })
    .toBe(true);
  await expect(span).toHaveCSS('position', 'absolute');

  const { width, height } = await box(span);

  expect(width).toBeLessThanOrEqual(largestBox);
  expect(height).toBeLessThanOrEqual(largestBox);
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} visually-hidden route`, () => {
    test('hydrates with 0 skipped components and no NG05xx message', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}visually-hidden`);

      await expect(page.locator('#read-more')).toBeVisible();
      await expectCleanHydration();
    });

    test('changes no attribute or style on the spans and adds or removes no item link at hydration', async ({
      page,
    }) => {
      const styleMutations = await recordStyleMutations(page);
      const hostAttributes = await recordHostAttributes(
        page,
        '[yetivisuallyhidden]',
      );

      await page.goto(`${prefix}visually-hidden`);
      await waitForHydration(page);

      expectOnlyClientPreloads(await styleMutations());
      expect(
        await hostAttributes(),
        'hydration changes no attribute, style included, on the spans',
      ).toEqual([]);
      expect(await itemLinks(page)).toContain('visually-hidden');
    });

    test('keeps the link and the words hidden in the hydrate-never block after the live spans leave', async ({
      page,
    }) => {
      await page.goto(`${prefix}visually-hidden`);
      await waitForHydration(page);

      await page.getByRole('button', { name: 'Remove the live links' }).click();
      await expect(page.locator('#read-more, #long-link')).toHaveCount(0);
      await nextFrames(page);

      const span = page.locator('#never-words');

      await expect(span).toHaveAttribute(
        'data-ngx-yeti-item-visually-hidden',
        '',
      );
      expect(
        await itemLinks(page),
        'the hydrate never host keeps the link',
      ).toContain('visually-hidden');
      await expectHidden(page, span);
      await expect(
        page.getByRole('link', { name: 'Read more about the mountain hut' }),
      ).toBeVisible();
    });

    test('never shows a preloaded client-only span larger than its box', async ({
      page,
    }) => {
      await page.goto(`${prefix}visually-hidden`);
      await waitForHydration(page);

      const widths = await recordFrames(page, '#client-words', 'width', {
        start: 'now',
      });
      const heights = await recordFrames(page, '#client-words', 'height', {
        start: 'now',
      });

      await page
        .getByRole('button', { name: 'Show the client-only link' })
        .click();

      const span = page.locator('#client-words');

      await expectHidden(page, span);

      for (const frames of [await widths(), await heights()]) {
        expect(frames.length, 'the span was sampled').toBeGreaterThan(0);
        expect(
          frames.filter((value) => !(parseFloat(value) <= largestBox)),
          'no frame after insertion shows a larger box',
        ).toEqual([]);
      }
    });

    test('leaves no horizontal overflow at a 320 px viewport with a long hidden phrase', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}visually-hidden`);
      await waitForHydration(page);
      await expectHidden(page, page.locator('#long-words'));

      expect(
        await page.evaluate(() => {
          const { scrollWidth, clientWidth } = document.documentElement;

          return scrollWidth - clientWidth;
        }),
        'horizontal overflow in px',
      ).toBeLessThanOrEqual(0);
    });

    test('removes the link on leaving the route and re-inserts it on returning', async ({
      page,
    }) => {
      await page.goto(`${prefix}visually-hidden`);
      await waitForHydration(page);

      expect(await itemLinks(page)).toContain('visually-hidden');

      await page
        .getByRole('link', { name: 'Leave for the replay page' })
        .click();
      await expect(page).toHaveURL(/\/replay$/);
      await expect(
        page.locator('[data-ngx-yeti-item-visually-hidden]'),
      ).toHaveCount(0);
      await expect.poll(() => itemLinks(page)).not.toContain('visually-hidden');

      await page.goBack();
      await expect(page.locator('#read-more')).toBeVisible();
      await expect.poll(() => itemLinks(page)).toContain('visually-hidden');
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('names each link with its hidden words and keeps their box at most 1.5 px', async ({
        page,
      }) => {
        await page.goto(`${prefix}visually-hidden`);

        await expect(
          page.getByRole('link', { name: 'Read more about the trail map' }),
        ).toBeVisible();
        await expect(
          page.getByRole('link', {
            name: 'Details about every trail, hut, ford, and ridge on the long northern route through the mountains',
          }),
        ).toBeVisible();
        await expect(page.locator('#hidden-words')).toHaveClass(
          'visually-hidden',
        );
        await expectHidden(page, page.locator('#hidden-words'));
        await expectHidden(page, page.locator('#never-words'));
      });

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}visually-hidden`);

        expect(await axeViolations()).toEqual([]);
      });
    });
  });
}
