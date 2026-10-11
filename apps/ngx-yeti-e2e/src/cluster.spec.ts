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

/** The boxes of an element's children, in DOM order. */
async function childRects(parent: Locator): Promise<Box[]> {
  return parent.evaluate((element) =>
    [...element.children].map((child) => {
      const { top, bottom, left, right, width } = child.getBoundingClientRect();

      return { top, bottom, left, right, width };
    }),
  );
}

function rowCount(boxes: readonly Box[]): number {
  return new Set(boxes.map((box) => Math.round(box.top))).size;
}

/** The box at `index`, which the story's markup is known to hold. */
function boxAt(boxes: readonly Box[], index: number): Box {
  const box = boxes[index];

  if (box === undefined) {
    throw new Error(`No child ${String(index)}`);
  }

  return box;
}

/**
 * The used length of a public token, read from a probe in the story, so no
 * assertion depends on a token's default (cluster.md, Testing Decisions).
 */
async function token(root: Locator, name: string): Promise<number> {
  return root.evaluate((element, property) => {
    const probe = document.createElement('div');
    probe.style.blockSize = `var(${property})`;
    element.append(probe);
    const { height } = probe.getBoundingClientRect();
    probe.remove();

    return height;
  }, name);
}

/** Upstream bug O2: read geometry only once the cluster's sheet has applied. */
async function expectClusterStyled(
  page: Page,
  cluster: Locator,
): Promise<void> {
  await expectItemSheetsApplied(page, ['cluster']);
  await expect(cluster).toHaveCSS('display', 'flex');
}

async function resize(stage: Locator, inlineSize: string): Promise<void> {
  await stage.evaluate((element, size) => {
    element.style.inlineSize = size;
  }, inlineSize);
}

test.describe('cluster--default', () => {
  test('keeps its eight links on one row at a 1600 px viewport, one sm gap apart', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });

    const root = await openStory(page, 'cluster--default');
    const cluster = root.getByTestId('cluster');

    await expectClusterStyled(page, cluster);
    await expectItemSheetsApplied(page, ['box']);

    const sm = await token(root, '--yeti-space-sm');
    const boxes = await childRects(cluster);

    expect(boxes).toHaveLength(8);
    expect(rowCount(boxes)).toBe(1);

    for (const [index, box] of boxes.slice(1).entries()) {
      expect(box.left - boxAt(boxes, index).right).toBeCloseTo(sm, 0);
    }
  });

  test('wraps at a 320 px viewport, with the sm gap between rows and no horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });

    const root = await openStory(page, 'cluster--default');
    const cluster = root.getByTestId('cluster');

    await expectClusterStyled(page, cluster);
    await expectItemSheetsApplied(page, ['box']);

    const sm = await token(root, '--yeti-space-sm');
    const boxes = await childRects(cluster);
    const first = boxAt(boxes, 0);
    const nextRow = boxes.find((box) => box.top > first.top + 1);

    expect(rowCount(boxes)).toBeGreaterThan(1);
    expect(nextRow, 'an item starts a second row').toBeDefined();
    expect((nextRow?.top ?? 0) - first.bottom).toBeCloseTo(sm, 0);
    expect(
      await page.evaluate(() => {
        const { scrollWidth, clientWidth } = document.documentElement;

        return scrollWidth - clientWidth;
      }),
    ).toBeLessThanOrEqual(0);
  });
});

test.describe('cluster--threshold', () => {
  test('follows its own width, not the viewport, across every threshold', async ({
    page,
  }) => {
    const root = await openStory(page, 'cluster--threshold');
    const stage = root.getByTestId('stage');
    const cluster = root.getByTestId('cluster');
    const viewport = page.viewportSize();

    await expectClusterStyled(page, cluster);
    await expect(cluster).toHaveCSS('container-type', 'inline-size');

    await resize(stage, '10rem');
    await expect
      .poll(async () => rowCount(await childRects(cluster)), {
        message: 'a column below the threshold',
      })
      .toBe(3);

    const width = await cluster.evaluate(
      (element) => element.getBoundingClientRect().width,
    );

    for (const box of await childRects(cluster)) {
      expect(box.width).toBeCloseTo(width, 0);
    }

    await resize(stage, '90rem');
    await expect
      .poll(async () => rowCount(await childRects(cluster)), {
        message: 'one row above the threshold',
      })
      .toBe(1);

    await resize(stage, '10rem');
    await expect
      .poll(async () => rowCount(await childRects(cluster)), {
        message: 'a column again',
      })
      .toBe(3);

    expect(page.viewportSize(), 'the viewport never changed').toEqual(viewport);
  });
});
