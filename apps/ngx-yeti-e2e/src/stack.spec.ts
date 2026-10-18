import {
  childRects,
  expectItemSheetsApplied,
  horizontalOverflow,
  rect,
  usedLength,
  type Box,
} from '@ngx-yeti/testing/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { openStory } from './open-story';
import { skipUnlessTabReachesLinks } from './tab-to-links';

/** The box at `index`, which the story's markup is known to hold. */
function boxAt(boxes: readonly Box[], index: number): Box {
  const box = boxes[index];

  if (box === undefined) {
    throw new Error(`No child ${String(index)}`);
  }

  return box;
}

/** The rule's line above each child: Yeti draws it with `::before`. */
async function ruleLines(
  parent: Locator,
): Promise<{ content: string; top: number; width: number }[]> {
  return parent.evaluate((element) =>
    [...element.children].map((child) => {
      const style = getComputedStyle(child, '::before');

      return {
        content: style.content,
        top: parseFloat(style.top),
        width: parseFloat(style.borderTopWidth),
      };
    }),
  );
}

async function scrollTo(page: Page, top: number): Promise<void> {
  await page.evaluate((y) => {
    window.scrollTo(0, y);
  }, top);
}

test.describe('stack--default', () => {
  test('spaces its children by the gap token, and one child by its own space', async ({
    page,
  }) => {
    const root = await openStory(page, 'stack--default');
    const stack = root.getByTestId('stack');

    await expectItemSheetsApplied(page, ['stack']);
    await expect(stack).toHaveCSS('display', 'flex');

    const lg = await usedLength(root, 'var(--yeti-space-lg)', 'block');
    const wide = await usedLength(root, 'var(--yeti-space-3xl)', 'block');
    const boxes = await childRects(stack);
    const gapBefore = (index: number): number =>
      boxAt(boxes, index).top - boxAt(boxes, index - 1).bottom;

    expect(gapBefore(1)).toBeCloseTo(lg, 1);
    expect(gapBefore(2)).toBeCloseTo(lg, 1);
    // `space` changes the gap before one child only.
    expect(gapBefore(3)).toBeCloseTo(wide, 1);
    expect(gapBefore(4)).toBeCloseTo(lg, 1);
    expect(wide).toBeGreaterThan(lg);
  });

  test('is as tall as the viewport with fill, and its split child reaches the end', async ({
    page,
  }) => {
    const root = await openStory(page, 'stack--default');
    const stack = root.getByTestId('stack');

    await expectItemSheetsApplied(page, ['stack']);
    await expect(stack).toHaveCSS('display', 'flex');

    const box = await rect(stack);
    const boxes = await childRects(stack);
    const split = boxAt(boxes, 5);

    expect(box.height).toBeCloseTo(
      await page.evaluate(() => window.innerHeight),
      0,
    );
    expect(split.bottom).toBeCloseTo(box.bottom, 1);
    expect(split.top - boxAt(boxes, 4).bottom).toBeGreaterThan(
      await usedLength(root, 'var(--yeti-space-lg)', 'block'),
    );
  });

  test('reflows at a 320 px viewport without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const root = await openStory(page, 'stack--default');

    await expectItemSheetsApplied(page, ['stack']);
    await expect(root.getByTestId('stack')).toHaveCSS('display', 'flex');
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
});

test.describe('stack--align', () => {
  test('stops stretching its children with align start', async ({ page }) => {
    const root = await openStory(page, 'stack--align');
    const start = root.getByTestId('start');
    const stretch = root.getByTestId('stretch');

    await expectItemSheetsApplied(page, ['stack']);
    await expect(start).toHaveCSS('display', 'flex');

    expect(boxAt(await childRects(start), 0).width).toBeLessThan(
      (await rect(start)).width,
    );
    expect(boxAt(await childRects(stretch), 0).width).toBeCloseTo(
      (await rect(stretch)).width,
      1,
    );
  });
});

test.describe('stack--rule', () => {
  test('draws a line in the middle of each gap and keeps the gap', async ({
    page,
  }) => {
    const root = await openStory(page, 'stack--rule');
    const ruled = root.getByTestId('ruled');

    await expectItemSheetsApplied(page, ['stack']);
    await expect(ruled).toHaveCSS('display', 'flex');

    const [sm, xs, border] = [
      await usedLength(root, 'var(--yeti-space-sm)', 'block'),
      await usedLength(root, 'var(--yeti-space-xs)', 'block'),
      await usedLength(root, 'var(--yeti-border-width)', 'block'),
    ];
    const boxes = await childRects(ruled);
    const lines = await ruleLines(ruled);
    const line = (index: number): (typeof lines)[number] => {
      const found = lines[index];

      if (found === undefined) {
        throw new Error(`No child ${String(index)}`);
      }

      return found;
    };
    const gapBefore = (index: number): number =>
      boxAt(boxes, index).top - boxAt(boxes, index - 1).bottom;

    // The first child has no gap before it, so its `space` does nothing.
    expect(boxAt(boxes, 0).top).toBeCloseTo((await rect(ruled)).top, 1);
    expect(line(0).content).toBe('none');
    expect(gapBefore(1)).toBeCloseTo(sm, 1);
    expect(line(1).width).toBe(border);
    expect(line(1).top).toBeCloseTo(-sm / 2, 1);
    expect(gapBefore(2)).toBeCloseTo(xs, 1);
    expect(line(2).top).toBeCloseTo(-xs / 2, 1);
    // A child that is itself a stack sets its own gap; the line is still
    // placed by the ruled stack's.
    expect(gapBefore(3)).toBeCloseTo(sm, 1);
    expect(line(3).top).toBeCloseTo(-sm / 2, 1);
    expect(sm).toBeGreaterThan(xs);
  });

  test('reflows at a 320 px viewport without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const root = await openStory(page, 'stack--rule');

    await expectItemSheetsApplied(page, ['stack']);
    await expect(root.getByTestId('ruled')).toHaveCSS('display', 'flex');
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
});

test.describe('stack--sticky', () => {
  test('pins the sticky child at the sticky offset, as wide as the column', async ({
    page,
  }) => {
    const root = await openStory(page, 'stack--sticky');
    const stack = root.getByTestId('stack');
    const pinned = root.getByTestId('pinned');

    await expectItemSheetsApplied(page, ['stack']);
    await expect(stack).toHaveCSS('display', 'flex');

    const offset = await usedLength(root, 'var(--yeti-sticky-offset)', 'block');
    const before = await rect(stack);

    expect((await rect(pinned)).width).toBeCloseTo(before.width, 0);

    // Scrolled from the stack's own top, as Yeti's sticky test does.
    await scrollTo(page, before.top + 200);

    await expect
      .poll(async () => (await rect(stack)).top, {
        message: "the stack's top has scrolled out",
      })
      .toBeLessThan(-100);
    await expect
      .poll(async () => (await rect(pinned)).top)
      .toBeCloseTo(offset, 0);
  });

  // WCAG 2.4.11 with usage rule 7 followed (ledger row A11Y-22's shared
  // case): the page starts scrolled to its end, so the first Tab pulls a
  // link back into view from above, where the pinned child sits.
  test('keeps every focused link at least partly clear of the pinned child, with the scroll padding set to its height', async ({
    browserName,
    page,
  }) => {
    await skipUnlessTabReachesLinks(page, browserName);

    const root = await openStory(page, 'stack--sticky');
    const pinned = root.getByTestId('pinned');
    const links = root.getByRole('link');

    await expectItemSheetsApplied(page, ['stack']);
    await expect(root.getByTestId('stack')).toHaveCSS('display', 'flex');
    await page.evaluate(
      (height) => {
        document.documentElement.style.setProperty(
          '--yeti-scroll-padding',
          `${String(height)}px`,
        );
      },
      (await rect(pinned)).height,
    );
    await scrollTo(
      page,
      await page.evaluate(() => document.documentElement.scrollHeight),
    );
    await expect
      .poll(async () => (await rect(links.first())).bottom, {
        message: 'the first link has scrolled out above the viewport',
      })
      .toBeLessThan(0);

    const count = await links.count();

    expect(count).toBeGreaterThan(1);

    for (let index = 0; index < count; index++) {
      const link = links.nth(index);

      await page.keyboard.press('Tab');
      await expect(link).toBeFocused();

      const [box, cover] = [await rect(link), await rect(pinned)];

      if (index === 0) {
        // Recorded: how much of the link pulled in from above stays clear.
        test.info().annotations.push({
          type: 'focus-not-obscured',
          description: `${browserName}: the first link sits at ${String(box.top)} to ${String(box.bottom)} px, the pinned child at ${String(cover.top)} to ${String(cover.bottom)} px`,
        });
      }

      expect(
        box.top >= cover.top && box.bottom <= cover.bottom,
        `the pinned child (${String(cover.top)} to ${String(cover.bottom)}) entirely covers link ${String(index + 1)} (${String(box.top)} to ${String(box.bottom)})`,
      ).toBe(false);
    }
  });
});
