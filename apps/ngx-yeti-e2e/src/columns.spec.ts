import {
  childRects,
  expectItemSheetsApplied,
  rect,
  resize,
  usedLength,
} from '@ngx-yeti/testing/playwright';
import { expect, test, type Locator } from '@playwright/test';
import { openStory } from './open-story';

type Arrangement = 'one row' | 'rows' | 'neither';

/**
 * Sizes the container to `width` px and reads how the columns sit: one row
 * means equal tops; rows means each child starts below the last and is as
 * wide as the layout.
 */
async function arrangement(
  frame: Locator,
  columns: Locator,
  width: number,
): Promise<Arrangement> {
  await resize(frame, width);

  const box = await rect(columns);
  const items = await childRects(columns);
  const [first] = items;

  if (first === undefined || items.length < 2) {
    throw new Error('The story has no columns layout with two children');
  }

  if (items.every((item) => Math.abs(item.top - first.top) <= 1)) {
    return 'one row';
  }

  return items.every(
    (item, index) =>
      Math.abs(item.width - box.width) <= 1 &&
      (index === 0 || item.top >= (items[index - 1]?.bottom ?? 0) - 0.5),
  )
    ? 'rows'
    : 'neither';
}

test.describe('columns across the threshold', () => {
  // The container, not the viewport, is resized across the threshold.
  for (const { id, threshold, items } of [
    { id: 'columns--default', threshold: 'md', items: ['columns', 'box'] },
    { id: 'columns--span', threshold: 'sm', items: ['columns'] },
  ]) {
    test(`${id} shares one row above the threshold and takes a row per child below it`, async ({
      page,
    }) => {
      const root = await openStory(page, id);
      const frame = root.getByTestId('frame');
      const columns = frame.locator('[yetiColumns]').first();

      await expectItemSheetsApplied(page, items);
      await expect(root.locator('[yetiColumns]').first()).toHaveCSS(
        'flex-wrap',
        'wrap',
      );

      // Read from a probe, so no assertion depends on a token's default
      // (columns.md, Testing Decisions).
      const width = await usedLength(frame, `var(--yeti-width-${threshold})`);

      expect(await arrangement(frame, columns, width + 32)).toBe('one row');
      expect(await arrangement(frame, columns, width - 32)).toBe('rows');
      expect(await arrangement(frame, columns, width + 32)).toBe('one row');
    });
  }
});
