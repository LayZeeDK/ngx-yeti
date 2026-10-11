import { type Locator, type Page } from '@playwright/test';
import { expect, isProduction, routeKinds, test } from './support/fixtures';
import {
  nextFrames,
  waitForHydration,
  watchHydration,
} from './support/hydration';
import {
  delayCss,
  itemLinks,
  itemSheetsLoaded,
  recordFrames,
} from './support/style-probe';

interface Position {
  readonly top: number;
  readonly left: number;
}

/** The rounded positions of an element's children, in DOM order. */
async function positions(parent: Locator): Promise<Position[]> {
  return parent.evaluate((element) =>
    [...element.children].map((child) => {
      const { top, left } = child.getBoundingClientRect();

      return { top: Math.round(top), left: Math.round(left) };
    }),
  );
}

/** How many columns the children are drawn in. */
function columnCount(boxes: readonly Position[]): number {
  return new Set(boxes.map((box) => box.left)).size;
}

/** The masonry links in `<head>`; later items may add others. */
async function masonryLinks(page: Page): Promise<readonly string[]> {
  return (await itemLinks(page)).filter((item) => item === 'masonry');
}

/** Upstream bug O2: read geometry only once the masonry's sheet has applied. */
async function expectMasonrySheetApplied(
  page: Page,
  masonry: Locator,
): Promise<void> {
  await expect
    .poll(() => itemSheetsLoaded(page, ['masonry']), {
      message: 'the masonry stylesheet is loaded',
    })
    .toBe(true);
  await expect(masonry).not.toHaveCSS('column-gap', 'normal');
}

/** The positions of both walls' items, with the sheet applied. */
async function wallPositions(page: Page): Promise<{
  readonly photos: readonly Position[];
  readonly blocks: readonly Position[];
}> {
  await expectMasonrySheetApplied(page, page.locator('#block-wall'));

  return {
    photos: await positions(page.locator('#photo-wall')),
    blocks: await positions(page.locator('#block-wall')),
  };
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} masonry route`, () => {
    test('hydrates with 0 skipped components and no NG05xx message', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}masonry`);

      await expect(page.locator('#block-wall')).toBeVisible();
      await expectCleanHydration();
    });

    test('places the items with JavaScript off where it places them with JavaScript on', async ({
      browser,
      page,
    }) => {
      await page.goto(`${prefix}masonry`);
      await waitForHydration(page);

      const live = await wallPositions(page);

      expect(
        columnCount(live.blocks),
        'the blocks are in columns',
      ).toBeGreaterThan(1);

      const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: page.viewportSize(),
      });

      try {
        const off = await context.newPage();

        await off.goto(page.url());

        expect(await wallPositions(off)).toEqual(live);
      } finally {
        await context.close();
      }
    });

    test('keeps the hydrate-never layout in columns after every live layout leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}masonry`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live layouts' })
        .click();
      await expect(page.locator('#photo-wall, #block-wall')).toHaveCount(0);
      await nextFrames(page);

      const wall = page.locator('#never-wall');

      await expect(wall).toHaveAttribute('data-ngx-yeti-item-masonry', '');
      expect(
        await masonryLinks(page),
        'the hydrate never host keeps the masonry link',
      ).toEqual(['masonry']);
      await expect(wall).not.toHaveCSS('column-gap', 'normal');
      expect(columnCount(await positions(wall))).toBe(2);
    });

    // The server hosts keep the masonry link in <head>, so the client-only
    // layout reuses it.
    test('renders a client-only layout with 0 unstyled frames while the server hosts hold the masonry link', async ({
      page,
    }) => {
      const gaps = await recordFrames(page, '#client-wall', 'column-gap');

      await delayCss(page);
      await page.goto(`${prefix}masonry`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only layout' })
        .click();

      const wall = page.locator('#client-wall');

      await expect(wall).toBeVisible();
      await expect(wall).not.toHaveCSS('column-gap', 'normal');

      const frames = await gaps();

      expect(
        frames.length,
        'the client-only layout was sampled',
      ).toBeGreaterThan(0);
      expect(
        frames.filter((value) => value === 'normal'),
        'no frame shows the client-only layout without Yeti',
      ).toEqual([]);
    });

    test('removes the masonry link on leaving the route and re-inserts it on returning', async ({
      page,
    }) => {
      await page.goto(`${prefix}masonry`);
      await waitForHydration(page);

      expect(await masonryLinks(page)).toEqual(['masonry']);

      await page
        .getByRole('link', { name: 'Leave for a page without masonry' })
        .click();
      await expect(page).toHaveURL(/\/replay$/);
      await expect(page.locator('[data-ngx-yeti-item-masonry]')).toHaveCount(0);
      await expect.poll(() => masonryLinks(page)).toEqual([]);

      await page.goBack();
      await expect(page.locator('#block-wall')).toBeVisible();
      await expect.poll(() => masonryLinks(page)).toEqual(['masonry']);
      await expectMasonrySheetApplied(page, page.locator('#block-wall'));
    });

    test('puts the example in one column with no horizontal overflow at a 320 px viewport', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}masonry`);
      await waitForHydration(page);

      const photos = page.locator('#photo-wall');

      await expectMasonrySheetApplied(page, photos);

      expect(columnCount(await positions(photos))).toBe(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(320);
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the layouts with their attributes and item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}masonry`);

        const photos = page.locator('#photo-wall');

        await expect(photos).toHaveClass('masonry');
        await expect(photos).toHaveAttribute('data-ngx-yeti-item-masonry', '');
        await expect(photos).toHaveAttribute('data-min', 'xs');
        await expect(photos).toHaveAttribute('data-columns', '3');
        await expect(photos).not.toHaveAttribute('data-gap');
        await expect(page.locator('#block-wall')).toHaveAttribute(
          'data-gap',
          'sm',
        );
        expect(await masonryLinks(page)).toEqual(['masonry']);
      });

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}masonry`);

        expect(await axeViolations()).toEqual([]);
      });
    });
  });
}
