import {
  childRects,
  expectItemSheetsApplied,
  type Box,
} from '@ngx-yeti/testing/playwright';
import { type Locator, type Page } from '@playwright/test';
import { expect, routeKinds, test } from './support/fixtures';
import { nextFrames, waitForHydration } from './support/hydration';
import { describeStandardRouteCases } from './support/standard-cases';
import {
  delayCss,
  expectStyledFrames,
  itemLinks,
  recordFrames,
} from './support/style-probe';

type Position = Pick<Box, 'top' | 'left'>;

/** The rounded positions of an element's children, in DOM order. */
async function positions(parent: Locator): Promise<Position[]> {
  return (await childRects(parent)).map(({ top, left }) => ({
    top: Math.round(top),
    left: Math.round(left),
  }));
}

/** How many columns the children are drawn in. */
function columnCount(boxes: readonly Position[]): number {
  return new Set(boxes.map((box) => box.left)).size;
}

/** The positions of both walls' items, with the sheet applied. */
async function wallPositions(page: Page): Promise<{
  readonly photos: readonly Position[];
  readonly blocks: readonly Position[];
}> {
  await expectItemSheetsApplied(page, ['masonry']);
  await expect(page.locator('#block-wall')).not.toHaveCSS(
    'column-gap',
    'normal',
  );

  return {
    photos: await positions(page.locator('#photo-wall')),
    blocks: await positions(page.locator('#block-wall')),
  };
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} masonry route`, () => {
    describeStandardRouteCases({
      item: 'masonry',
      prefix,
      liveHost: '#block-wall',
      leaveLink: 'Leave for a page without masonry',
      styled: { property: 'column-gap', value: /^(?!normal$)/ },
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
        await itemLinks(page, 'masonry'),
        'the hydrate never host keeps the masonry link',
      ).toEqual(['masonry']);
      await expect(wall).not.toHaveCSS('column-gap', 'normal');
      expect(columnCount(await positions(wall))).toBe(2);
    });

    // The server hosts keep the masonry link in <head>, so the client-only
    // layout reuses it.
    test('renders a client-only layout with 0 unstyled frames while the server hosts hold the masonry link', async ({
      browserName,
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

      expectStyledFrames(await gaps(), {
        styled: (value) => value !== 'normal',
        label: `${browserName}, ${kind}, client-only masonry`,
      });
    });

    test('puts the example in one column with no horizontal overflow at a 320 px viewport', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}masonry`);
      await waitForHydration(page);

      const photos = page.locator('#photo-wall');

      await expectItemSheetsApplied(page, ['masonry']);
      await expect(photos).not.toHaveCSS('column-gap', 'normal');

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
        expect(await itemLinks(page, 'masonry')).toEqual(['masonry']);
      });
    });
  });
}
