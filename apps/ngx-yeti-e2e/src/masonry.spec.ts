import {
  childRects,
  expectItemSheetsApplied,
  resize,
  usedLength,
  type Box,
} from '@ngx-yeti/testing/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openStory } from './open-story';
import { skipUnlessTabReachesLinks } from './tab-to-links';

/** The rounded left edges of the columns, in screen order. */
function columnLefts(boxes: readonly Box[]): number[] {
  return [...new Set(boxes.map((box) => Math.round(box.left)))].toSorted(
    (a, b) => a - b,
  );
}

/** Whether this engine takes Yeti's guarded native path. */
async function nativePath(page: Page): Promise<boolean> {
  return page.evaluate(() => CSS.supports('grid-template-rows', 'masonry'));
}

/**
 * Records which path the engine takes, so a browser that starts passing
 * Yeti's guard is visible in the report (masonry.md, Testing Decisions,
 * layer 4).
 */
async function recordPath(page: Page, browserName: string): Promise<boolean> {
  const native = await nativePath(page);

  test.info().annotations.push({
    type: 'masonry-native-path',
    description: `${browserName}: CSS.supports('grid-template-rows', 'masonry') is ${String(native)}`,
  });

  return native;
}

/**
 * Expects the order the engine's path draws: on the multi-column path the
 * column index never decreases in source order; on the native path the
 * first row holds the first items in source order.
 */
function expectPathOrder(boxes: readonly Box[], native: boolean): void {
  const lefts = columnLefts(boxes);
  const columns = boxes.map((box) => lefts.indexOf(Math.round(box.left)));

  expect(lefts.length, 'more than one column').toBeGreaterThan(1);

  if (native) {
    const firstRow = boxes.slice(0, lefts.length);

    expect(new Set(firstRow.map((box) => Math.round(box.top))).size).toBe(1);
    expect(columns.slice(0, lefts.length)).toEqual(
      lefts.map((_, index) => index),
    );

    return;
  }

  expect(columns).toEqual(columns.toSorted((a, b) => a - b));
}

test.describe('masonry--fit', () => {
  test('fits the column count to the container on each side of a resize', async ({
    browserName,
    page,
  }) => {
    const root = await openStory(page, 'masonry--fit');
    const stage = root.getByTestId('stage');
    const masonry = root.getByTestId('masonry');

    await expectItemSheetsApplied(page, ['masonry']);
    await expect(masonry).not.toHaveCSS('column-gap', 'normal');

    const native = await recordPath(page, browserName);
    const min = await usedLength(root, 'var(--yeti-width-xs)');
    const gap = await usedLength(root, 'var(--yeti-space-sm)');

    for (const count of [3, 2]) {
      await resize(stage, count * min + (count - 1) * gap + 8);

      await expect
        .poll(async () => columnLefts(await childRects(masonry)).length)
        .toBe(count);
      expectPathOrder(await childRects(masonry), native);
    }
  });
});

test.describe('masonry--order', () => {
  test('draws the order of its path on each side of a container resize (A11Y-23)', async ({
    browserName,
    page,
  }) => {
    const root = await openStory(page, 'masonry--order');
    const stage = root.getByTestId('stage');
    const masonry = root.getByTestId('masonry');

    await expectItemSheetsApplied(page, ['masonry']);
    await expect(masonry).not.toHaveCSS('column-gap', 'normal');

    const native = await recordPath(page, browserName);
    const min = await usedLength(root, 'var(--yeti-width-2xs)');
    const gap = await usedLength(root, 'var(--yeti-space-sm)');

    for (const count of [4, 2]) {
      await resize(stage, count * min + (count - 1) * gap + 8);

      await expect
        .poll(async () => columnLefts(await childRects(masonry)).length)
        .toBe(count);
      expectPathOrder(await childRects(masonry), native);
    }
  });

  test('moves focus through the links in source order with Tab (A11Y-23)', async ({
    browserName,
    page,
  }) => {
    await skipUnlessTabReachesLinks(page, browserName);

    const root = await openStory(page, 'masonry--order');
    const masonry = root.getByTestId('masonry');
    const links = masonry.getByRole('link');

    await expectItemSheetsApplied(page, ['masonry']);
    await expect(masonry).not.toHaveCSS('column-gap', 'normal');

    const count = await links.count();

    expect(count).toBeGreaterThan(1);

    for (let index = 0; index < count; index++) {
      await page.keyboard.press('Tab');
      await expect(links.nth(index)).toBeFocused();
    }
  });
});
