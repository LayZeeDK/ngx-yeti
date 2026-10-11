import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectItemSheetsApplied } from './item-styles';
import { openStory } from './open-story';

/**
 * The used width of the threshold token, read from a probe so no assertion
 * depends on a token's default (columns.md, Testing Decisions).
 */
async function thresholdWidth(frame: Locator, value: string): Promise<number> {
  return frame.evaluate((element, threshold) => {
    const probe = document.createElement('div');
    probe.style.inlineSize = `var(--yeti-width-${threshold})`;
    element.append(probe);
    const { width } = probe.getBoundingClientRect();
    probe.remove();

    return width;
  }, value);
}

type Arrangement = 'one row' | 'rows' | 'neither';

/**
 * Sizes the container to `width` px and reads how the columns sit: one row
 * means equal tops; rows means each child starts below the last and is as
 * wide as the layout.
 */
async function arrangement(
  frame: Locator,
  width: number,
): Promise<Arrangement> {
  return frame.evaluate((element, inlineSize): Arrangement => {
    if (!(element instanceof HTMLElement)) {
      throw new Error('The frame is not an HTML element');
    }

    element.style.inlineSize = `${String(inlineSize)}px`;

    const columns = element.querySelector('[yetiColumns]');

    if (columns === null || columns.children.length < 2) {
      throw new Error('The story has no columns layout with two children');
    }

    const box = columns.getBoundingClientRect();
    const items = [...columns.children].map((child) =>
      child.getBoundingClientRect(),
    );
    const [first] = items;

    if (first === undefined) {
      throw new Error('No columns');
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
  }, width);
}

/** Upstream bug O2: read geometry only once the item sheets have applied. */
async function expectColumnsStyled(
  page: Page,
  root: Locator,
  items: readonly string[],
): Promise<void> {
  await expectItemSheetsApplied(page, items);
  await expect(root.locator('[yetiColumns]').first()).toHaveCSS(
    'flex-wrap',
    'wrap',
  );
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

      await expectColumnsStyled(page, root, items);

      const width = await thresholdWidth(frame, threshold);

      expect(await arrangement(frame, width + 32)).toBe('one row');
      expect(await arrangement(frame, width - 32)).toBe('rows');
      expect(await arrangement(frame, width + 32)).toBe('one row');
    });
  }
});
