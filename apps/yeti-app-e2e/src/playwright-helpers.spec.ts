import {
  expectItemSheetsApplied,
  horizontalOverflow,
} from '@ngx-yeti/testing/playwright';
import { type Page } from '@playwright/test';
import { expect, test } from './support/fixtures';

const origin = 'http://playwright-helpers.test';

/**
 * Opens a page whose head holds one item link of `item`, served `css` from a
 * route this test fulfils, so no Fixture build is involved.
 */
async function openWithItemSheet(
  page: Page,
  item: string,
  css: string,
): Promise<void> {
  await page.route(`${origin}/**`, async (route) => {
    const { pathname } = new URL(route.request().url());

    await (pathname === '/item.css'
      ? route.fulfill({ contentType: 'text/css', body: css })
      : route.fulfill({
          contentType: 'text/html',
          body: `<!doctype html><html lang="en"><head><title>Helpers</title><link rel="stylesheet" data-ngx-yeti-styles="${item}" href="/item.css"></head><body><p>Helpers</p></body></html>`,
        }));
  });
  await page.goto(`${origin}/`);
}

test.describe('horizontalOverflow', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('is positive for content wider than the viewport', async ({ page }) => {
    await page.setContent(
      '<body style="margin: 0"><div style="inline-size: 500px; block-size: 10px"></div></body>',
    );

    expect(await horizontalOverflow(page)).toBeGreaterThan(0);
  });

  test('is 0 for content that fits the viewport', async ({ page }) => {
    await page.setContent(
      '<body style="margin: 0"><div style="inline-size: 100px; block-size: 10px"></div></body>',
    );

    expect(await horizontalOverflow(page)).toBe(0);
  });
});

test.describe('expectItemSheetsApplied', () => {
  test('passes when the item link has a sheet with a rule', async ({
    page,
  }) => {
    await openWithItemSheet(page, 'stack', '.stack { display: flex; }');

    await expect(expectItemSheetsApplied(page, ['stack'])).resolves.toBe(
      undefined,
    );
  });

  test('rejects when an item has no link', async ({ page }) => {
    await openWithItemSheet(page, 'stack', '.stack { display: flex; }');

    await expect(
      expectItemSheetsApplied(page, ['stack', 'center']),
    ).rejects.toThrow('toHaveCount');
  });

  test("rejects when the item's sheet has no rule", async ({ page }) => {
    await openWithItemSheet(page, 'stack', '');

    await expect(expectItemSheetsApplied(page, ['stack'])).rejects.toThrow(
      'item sheets loaded with rules',
    );
  });
});
