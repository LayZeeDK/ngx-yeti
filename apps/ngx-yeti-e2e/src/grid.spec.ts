import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectItemSheetsApplied } from './item-styles';
import { openStory } from './open-story';

interface Box {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly width: number;
}

async function rect(locator: Locator): Promise<Box> {
  return locator.evaluate((element) => {
    const { top, bottom, left, right, width } = element.getBoundingClientRect();

    return { top, bottom, left, right, width };
  });
}

/** The boxes of an element's children, in DOM order. */
async function childRects(parent: Locator): Promise<Box[]> {
  return parent.evaluate((element) =>
    [...element.children].map((child) => {
      const { top, bottom, left, right, width } = child.getBoundingClientRect();

      return { top, bottom, left, right, width };
    }),
  );
}

/** The box at `index`, which the story's markup is known to hold. */
function boxAt(boxes: readonly Box[], index: number): Box {
  const box = boxes[index];

  if (box === undefined) {
    throw new Error(`No child ${String(index)}`);
  }

  return box;
}

/** How many cells share the first row. */
async function perRow(grid: Locator): Promise<number> {
  const tops = (await childRects(grid)).map((box) => Math.round(box.top));
  const first = Math.min(...tops);

  return tops.filter((top) => top === first).length;
}

/**
 * The used length of a public token, read from a probe in the story, so no
 * expected count depends on a token's default (grid.md, Testing Decisions).
 */
async function token(root: Locator, name: string): Promise<number> {
  return root.evaluate((element, property) => {
    const probe = document.createElement('div');
    probe.style.inlineSize = `var(${property})`;
    element.append(probe);
    const { width } = probe.getBoundingClientRect();
    probe.remove();

    return width;
  }, name);
}

/** The root font size in px, which Yeti's literal `rem` limits scale with. */
async function rem(page: Page): Promise<number> {
  return page.evaluate(() =>
    parseFloat(getComputedStyle(document.documentElement).fontSize),
  );
}

/** Resizes the container, not the viewport (building-blocks.md:96). */
async function resize(element: Locator, width: number): Promise<void> {
  await element.evaluate((node, value) => {
    if (node instanceof HTMLElement) {
      node.style.inlineSize = `${String(value)}px`;
    }
  }, width);
}

/** Upstream bug O2: read geometry only once the grid's sheet has applied. */
async function expectGridStyled(page: Page, grid: Locator): Promise<void> {
  await expectItemSheetsApplied(page, ['grid']);
  await expect(grid).toHaveCSS('display', 'grid');
}

/** How far the page's content is wider than the viewport, in px. */
async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const { scrollWidth, clientWidth } = document.documentElement;

    return scrollWidth - clientWidth;
  });
}

/** Yeti's count: as many columns of `min` as fit, one gap apart. */
function fitted(width: number, min: number, gap: number): number {
  return Math.floor((width + gap) / (min + gap));
}

test.describe('grid--settings', () => {
  test('fits as many columns as the default minimum allows', async ({
    page,
  }) => {
    const root = await openStory(page, 'grid--settings');
    const grid = root.getByTestId('grid');

    await expectGridStyled(page, grid);

    const [min, gap] = [
      await token(root, '--yeti-width-xs'),
      await token(root, '--yeti-space-md'),
    ];
    const cells = (await childRects(grid)).length;

    for (const width of [1000, 500]) {
      await resize(grid, width);

      expect(await perRow(grid)).toBe(Math.min(cells, fitted(width, min, gap)));
    }
  });
});

test.describe('grid--default', () => {
  test('caps the count at three and still shrinks below it', async ({
    page,
  }) => {
    const root = await openStory(page, 'grid--default');
    const grid = root.getByTestId('grid');

    await expectGridStyled(page, grid);

    const [min, gap] = [
      await token(root, '--yeti-width-2xs'),
      await token(root, '--yeti-space-md'),
    ];

    await resize(grid, 1000);

    expect(await perRow(grid)).toBe(3);

    await resize(grid, 300);

    expect(await perRow(grid)).toBe(Math.min(3, fitted(300, min, gap)));
  });

  test('reflows at a 320 px viewport without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const root = await openStory(page, 'grid--default');

    await expectGridStyled(page, root.getByTestId('grid'));
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
});

test.describe('grid--exact-count', () => {
  test('gives four across with min none at 300 and 1000 px, and one column without columns', async ({
    page,
  }) => {
    const root = await openStory(page, 'grid--exact-count');
    const stage = root.getByTestId('stage');
    const exact = root.getByTestId('exact');
    const loose = root.getByTestId('loose');

    await expectGridStyled(page, exact);

    for (const width of [300, 1000]) {
      await resize(stage, width);

      expect(await perRow(exact)).toBe(4);
      expect(await perRow(loose)).toBe(1);
    }
  });
});

test.describe('grid--fold', () => {
  test('halves the count as the container narrows and never shows three', async ({
    page,
  }) => {
    const root = await openStory(page, 'grid--fold');
    const stage = root.getByTestId('stage');
    const grid = root.getByTestId('grid');

    await expectGridStyled(page, grid);

    // Yeti's widths, in its default 16 px rem; the fold's limits scale with
    // the root font size.
    const scale = (await rem(page)) / 16;

    for (const [width, count] of [
      [1100, 4],
      [900, 2],
      [700, 2],
      [400, 1],
    ] as const) {
      await resize(stage, width * scale);

      expect(await perRow(grid), `${String(width)} px`).toBe(count);
    }
  });

  test('reflows at a 320 px viewport without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const root = await openStory(page, 'grid--fold');

    await expectGridStyled(page, root.getByTestId('grid'));
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
});

test.describe('grid--tracks', () => {
  test('places cells by column line at 1000 px, leaving tracks 1 and 8 empty', async ({
    page,
  }) => {
    const root = await openStory(page, 'grid--tracks');
    const stage = root.getByTestId('stage');
    const grid = root.getByTestId('grid');

    await expectGridStyled(page, grid);
    await resize(stage, 1000);

    const gap = await token(root, '--yeti-space-sm');
    const box = await rect(grid);
    const cells = await childRects(grid);
    const track = (box.width - 11 * gap) / 12;
    const line = (n: number): number => box.left + (n - 1) * (track + gap);
    const [first, second, spanned, plain] = [0, 1, 2, 3].map((index) =>
      boxAt(cells, index),
    );

    if (
      first === undefined ||
      second === undefined ||
      spanned === undefined ||
      plain === undefined
    ) {
      throw new Error('The wall has four cells');
    }

    expect(first.left).toBeCloseTo(line(2), 0);
    expect(first.width).toBeCloseTo(6 * track + 5 * gap, 0);
    expect(second.left).toBeCloseTo(line(9), 0);
    expect(second.width).toBeCloseTo(4 * track + 3 * gap, 0);
    expect(second.top).toBeCloseTo(first.top, 0);
    expect(second.left - first.right).toBeCloseTo(track + 2 * gap, 0);
    expect(spanned.top).toBeGreaterThan(first.bottom);
    expect(spanned.left).toBeCloseTo(line(1), 0);
    expect(plain.left).toBeCloseTo(line(4), 0);
  });

  test('puts every cell on its own full row in source order at 400 px', async ({
    page,
  }) => {
    const root = await openStory(page, 'grid--tracks');
    const stage = root.getByTestId('stage');
    const grid = root.getByTestId('grid');

    await expectGridStyled(page, grid);
    await resize(stage, 400);

    const box = await rect(grid);
    const cells = await childRects(grid);

    for (const cell of cells) {
      expect(cell.width).toBeCloseTo(box.width, 0);
      expect(cell.left).toBeCloseTo(box.left, 0);
    }

    for (let index = 1; index < cells.length; index++) {
      expect(boxAt(cells, index).top).toBeGreaterThan(
        boxAt(cells, index - 1).bottom,
      );
    }
  });

  test('reflows at a 320 px viewport without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const root = await openStory(page, 'grid--tracks');

    await expectGridStyled(page, root.getByTestId('grid'));
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
});
