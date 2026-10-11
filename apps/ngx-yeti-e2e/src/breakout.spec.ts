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

/**
 * The used length of a public token, read from a probe in the story, so no
 * assertion depends on a token's default (breakout.md, Testing Decisions).
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

/** Upstream bug O2: read geometry only once the breakout's sheet has applied. */
async function expectBreakoutStyled(
  page: Page,
  breakout: Locator,
): Promise<void> {
  await expectItemSheetsApplied(page, ['breakout']);
  await expect(breakout).toHaveCSS('display', 'grid');
}

/** How far the page's content is wider than the viewport, in px. */
async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const { scrollWidth, clientWidth } = document.documentElement;

    return scrollWidth - clientWidth;
  });
}

test.describe('breakout--default', () => {
  // Yeti's own breakout.spec.js cases at 1000 and 400 px, and one between.
  for (const width of [1000, 600, 400]) {
    test(`keeps the column, gutters, and bleed at a ${String(width)} px container`, async ({
      page,
    }) => {
      const root = await openStory(page, 'breakout--default');
      const frame = root.getByTestId('frame');
      const breakout = root.getByTestId('breakout');

      await frame.evaluate((element, inlineSize) => {
        element.style.inlineSize = `${String(inlineSize)}px`;
      }, width);
      await expectBreakoutStyled(page, breakout);

      const gap = await token(root, '--yeti-space-md');
      const max = await token(root, '--yeti-width-md');
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

      await expectBreakoutStyled(page, root.locator('[yetibreakout]').first());
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }
});
