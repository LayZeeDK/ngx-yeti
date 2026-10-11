import {
  childRects,
  expectItemSheetsApplied,
  horizontalOverflow,
  rect,
  resize,
  usedLength,
  type Box,
} from '@ngx-yeti/testing/playwright';
import { expect, test } from '@playwright/test';
import { openStory } from './open-story';

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

test.describe('cluster--default', () => {
  test('keeps its eight links on one row at a 1600 px viewport, one sm gap apart', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });

    const root = await openStory(page, 'cluster--default');
    const cluster = root.getByTestId('cluster');

    await expectItemSheetsApplied(page, ['cluster', 'box']);
    await expect(cluster).toHaveCSS('display', 'flex');

    // Read from a probe, so no assertion depends on a token's default
    // (cluster.md, Testing Decisions).
    const sm = await usedLength(root, 'var(--yeti-space-sm)', 'block');
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

    await expectItemSheetsApplied(page, ['cluster', 'box']);
    await expect(cluster).toHaveCSS('display', 'flex');

    // Read from a probe, so no assertion depends on a token's default
    // (cluster.md, Testing Decisions).
    const sm = await usedLength(root, 'var(--yeti-space-sm)', 'block');
    const boxes = await childRects(cluster);
    const first = boxAt(boxes, 0);
    const nextRow = boxes.find((box) => box.top > first.top + 1);

    expect(rowCount(boxes)).toBeGreaterThan(1);
    expect(nextRow, 'an item starts a second row').toBeDefined();
    expect((nextRow?.top ?? 0) - first.bottom).toBeCloseTo(sm, 0);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
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

    await expectItemSheetsApplied(page, ['cluster']);
    await expect(cluster).toHaveCSS('display', 'flex');
    await expect(cluster).toHaveCSS('container-type', 'inline-size');

    await resize(stage, await usedLength(stage, '10rem'));
    await expect
      .poll(async () => rowCount(await childRects(cluster)), {
        message: 'a column below the threshold',
      })
      .toBe(3);

    const { width } = await rect(cluster);

    for (const box of await childRects(cluster)) {
      expect(box.width).toBeCloseTo(width, 0);
    }

    await resize(stage, await usedLength(stage, '90rem'));
    await expect
      .poll(async () => rowCount(await childRects(cluster)), {
        message: 'one row above the threshold',
      })
      .toBe(1);

    await resize(stage, await usedLength(stage, '10rem'));
    await expect
      .poll(async () => rowCount(await childRects(cluster)), {
        message: 'a column again',
      })
      .toBe(3);

    expect(page.viewportSize(), 'the viewport never changed').toEqual(viewport);
  });
});
