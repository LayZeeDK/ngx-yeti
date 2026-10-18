import {
  expectItemSheetsApplied,
  horizontalOverflow,
  rect,
  resize,
  usedLength,
} from '@ngx-yeti/testing/playwright';
import { expect, test } from '@playwright/test';
import { openStory } from './open-story';

test.describe('breakout--default', () => {
  // Yeti's own breakout.spec.js cases at 1000 and 400 px, and one between.
  for (const width of [1000, 600, 400]) {
    test(`keeps the column, gutters, and bleed at a ${String(width)} px container`, async ({
      page,
    }) => {
      const root = await openStory(page, 'breakout--default');
      const frame = root.getByTestId('frame');
      const breakout = root.getByTestId('breakout');

      await resize(frame, width);
      await expectItemSheetsApplied(page, ['breakout']);
      await expect(breakout).toHaveCSS('display', 'grid');

      // Tokens are read from a probe, so no assertion depends on a token's
      // default (breakout.md, Testing Decisions).
      const gap = await usedLength(root, 'var(--yeti-space-md)');
      const max = await usedLength(root, 'var(--yeti-width-md)');
      const [box, plain, bleed] = await Promise.all([
        rect(breakout),
        rect(root.getByTestId('plain')),
        rect(root.getByTestId('bleed')),
      ]);

      expect(box.width).toBeCloseTo(width, 0);
      expect(plain.width).toBeCloseTo(Math.min(width - 2 * gap, max), 0);
      expect(plain.left - box.left).toBeCloseTo(box.right - plain.right, 0);
      expect(plain.left - box.left).toBeGreaterThanOrEqual(gap - 0.5);
      expect(bleed.width).toBeCloseTo(width, 0);
      expect(bleed.left).toBeCloseTo(box.left, 0);
      // The plain child follows the bleed one row gap below it.
      expect(plain.top - bleed.bottom).toBeCloseTo(gap, 0);
    });
  }
});

test.describe('breakout at a 320 px viewport', () => {
  for (const id of ['breakout--settings', 'breakout--heading-rhythm']) {
    test(`${id} reflows without horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      const root = await openStory(page, id);

      await expectItemSheetsApplied(page, ['breakout']);
      await expect(root.locator('[yetibreakout]').first()).toHaveCSS(
        'display',
        'grid',
      );
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }
});
