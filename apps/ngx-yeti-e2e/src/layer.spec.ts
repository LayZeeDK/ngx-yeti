import { composite, contrastRatio } from '@ngx-yeti/testing';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectItemSheetsApplied } from './item-styles';
import { openStory } from './open-story';

interface Box {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly width: number;
  readonly height: number;
}

async function rect(locator: Locator): Promise<Box> {
  return locator.evaluate((element) => {
    const { top, bottom, left, right, width, height } =
      element.getBoundingClientRect();

    return { top, bottom, left, right, width, height };
  });
}

/** Upstream bug O2: read geometry only once the layer's sheet has applied. */
async function expectLayerStyled(page: Page, layer: Locator): Promise<void> {
  await expectItemSheetsApplied(page, ['layer']);
  await expect(layer).toHaveCSS('display', 'grid');
}

async function setWidth(frame: Locator, width: number): Promise<void> {
  await frame.evaluate((element, inlineSize) => {
    element.style.inlineSize = `${String(inlineSize)}px`;
  }, width);
}

/** Every child of the layer has zero margins (Yeti's `expectNoChildMargins`). */
async function childMargins(layer: Locator): Promise<readonly string[]> {
  return layer.evaluate((element) =>
    [...element.children].map((child) => getComputedStyle(child).margin),
  );
}

/** How far the page's content is wider than the viewport, in px. */
async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const { scrollWidth, clientWidth } = document.documentElement;

    return scrollWidth - clientWidth;
  });
}

const widths = [600, 400] as const;

test.describe('layer--default', () => {
  for (const width of widths) {
    test(`stacks the picture and its caption in one box at a ${String(width)} px container`, async ({
      page,
    }) => {
      const root = await openStory(page, 'layer--default');
      const layer = root.getByTestId('layer');

      await setWidth(root.getByTestId('frame'), width);
      await expectLayerStyled(page, layer);

      const [box, picture, caption] = await Promise.all([
        rect(layer),
        rect(root.getByTestId('picture')),
        rect(root.getByTestId('caption')),
      ]);

      expect(box.width).toBeCloseTo(width, 0);
      expect(picture.top).toBeCloseTo(box.top, 0);
      expect(picture.left).toBeCloseTo(box.left, 0);
      expect(caption.bottom).toBeCloseTo(box.bottom, 0);
      expect(box.height).toBeCloseTo(
        Math.max(picture.height, caption.height),
        0,
      );
      expect(await childMargins(layer)).toEqual(['0px', '0px']);
    });
  }

  // A11Y-10b's measurement, written down per engine and scheme; the play
  // functions assert it.
  for (const id of ['layer--default', 'layer--dark-scheme']) {
    test(`records the caption's contrast over the scrim on ${id}`, async ({
      browserName,
      page,
    }) => {
      const root = await openStory(page, id);
      const caption = root.getByTestId('caption');

      await expectLayerStyled(page, root.getByTestId('layer'));

      const { color, backgroundColor } = await caption.evaluate((element) => {
        const style = getComputedStyle(element);

        return { color: style.color, backgroundColor: style.backgroundColor };
      });
      const ratios = ['#000', '#fff'].map((backdrop) =>
        contrastRatio(color, composite(backgroundColor, backdrop)),
      );

      test.info().annotations.push({
        type: 'a11y-10b-ratio',
        description: `${browserName}, ${id}: ${ratios.map((ratio) => ratio.toFixed(3)).join(' on black, ')} on white`,
      });

      for (const ratio of ratios) {
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});

test.describe('layer--settings', () => {
  for (const width of widths) {
    test(`sits a short child at the bottom with align end at a ${String(width)} px container`, async ({
      page,
    }) => {
      const root = await openStory(page, 'layer--settings', {
        args: { align: 'end' },
      });
      const layer = root.getByTestId('layer');

      await setWidth(root.getByTestId('frame'), width);
      await expect(layer).toHaveAttribute('data-align', 'end');
      await expectLayerStyled(page, layer);

      const [box, tall, short] = await Promise.all([
        rect(layer),
        rect(root.getByTestId('tall')),
        rect(root.getByTestId('short')),
      ]);

      expect(box.height).toBeCloseTo(200, 0);
      expect(tall.top).toBeCloseTo(box.top, 0);
      expect(short.bottom).toBeCloseTo(box.bottom, 0);
      expect(await childMargins(layer)).toEqual(['0px', '0px', '0px']);
    });

    test(`treats align baseline as start at a ${String(width)} px container`, async ({
      page,
    }) => {
      const root = await openStory(page, 'layer--settings', {
        args: { align: 'baseline' },
      });
      const layer = root.getByTestId('layer');

      await setWidth(root.getByTestId('frame'), width);
      await expect(layer).toHaveAttribute('data-align', 'baseline');
      await expectLayerStyled(page, layer);

      const [box, short] = await Promise.all([
        rect(layer),
        rect(root.getByTestId('short')),
      ]);

      expect(box.height).toBeCloseTo(200, 0);
      expect(short.top).toBeCloseTo(box.top, 0);
    });

    test(`places one child in the top-right corner at a ${String(width)} px container`, async ({
      page,
    }) => {
      const root = await openStory(page, 'layer--settings', {
        args: { alignSelf: 'start', justifySelf: 'end' },
      });
      const layer = root.getByTestId('layer');

      await setWidth(root.getByTestId('frame'), width);
      await expectLayerStyled(page, layer);

      const [box, placed] = await Promise.all([
        rect(layer),
        rect(root.getByTestId('placed')),
      ]);

      expect(placed.top).toBeCloseTo(box.top, 0);
      expect(placed.right).toBeCloseTo(box.right, 0);
      expect(placed.width).toBeLessThan(box.width / 2);
    });
  }
});

test.describe('layer--badge', () => {
  for (const width of widths) {
    test(`keeps the badge in the thumbnail's top-right corner at a ${String(width)} px container`, async ({
      page,
    }) => {
      const root = await openStory(page, 'layer--badge');
      const layer = root.getByTestId('light');

      await setWidth(root.getByTestId('light-frame'), width);
      await expectLayerStyled(page, layer);

      const [box, badge] = await Promise.all([
        rect(layer),
        rect(root.getByTestId('light-badge')),
      ]);

      expect(box.width).toBeCloseTo(width, 0);
      expect(badge.top).toBeCloseTo(box.top, 0);
      expect(badge.right).toBeCloseTo(box.right, 0);
      expect(badge.width).toBeLessThan(box.width / 2);
    });
  }
});

test.describe('layer at a 320 px viewport', () => {
  for (const id of ['layer--default', 'layer--badge', 'layer--settings']) {
    test(`${id} reflows without horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      const root = await openStory(page, id);

      await expectLayerStyled(page, root.locator('[yetilayer]').first());
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }
});
