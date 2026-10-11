import {
  expectItemSheetsApplied,
  rect,
  usedLength,
} from '@ngx-yeti/testing/playwright';
import { type Locator, type Page } from '@playwright/test';
import { expect, routeKinds, test } from './support/fixtures';
import { nextFrames, waitForHydration } from './support/hydration';
import { describeStandardRouteCases } from './support/standard-cases';
import {
  delayCss,
  expectStyledFrames,
  itemLinks,
  productionFramesRecordedAs,
  recordFrames,
} from './support/style-probe';

/**
 * Expects a plain child in the centred column, `min(width - 2 gaps, max)`
 * wide, and a bleeding child as wide as the breakout (breakout.md, Testing
 * Decisions).
 */
async function expectColumnAndBleed(
  page: Page,
  breakout: Locator,
  plain: Locator,
  bleed: Locator,
  gapToken = '--yeti-space-md',
): Promise<void> {
  await expectItemSheetsApplied(page, ['breakout']);
  await expect(breakout).toHaveCSS('display', 'grid');

  const [box, column, band] = await Promise.all([
    rect(breakout),
    rect(plain),
    rect(bleed),
  ]);
  const gap = await usedLength(page.locator('main'), `var(${gapToken})`);
  const max = await usedLength(page.locator('main'), 'var(--yeti-width-md)');

  expect(column.width).toBeCloseTo(Math.min(box.width - 2 * gap, max), 0);
  expect(
    Math.abs(column.left - box.left - (box.right - column.right)),
  ).toBeLessThanOrEqual(1);
  expect(band.width).toBeCloseTo(box.width, 0);
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} breakout route`, () => {
    describeStandardRouteCases({
      item: 'breakout',
      prefix,
      liveHost: '#live-breakout',
      leaveLink: 'Leave for a page without breakouts',
      styled: { property: 'display', value: 'grid' },
    });

    test('lays out the column, the bleed, and the note beside its child', async ({
      page,
    }) => {
      await page.goto(`${prefix}breakout`);
      await waitForHydration(page);

      const breakout = page.locator('#live-breakout');

      await expectColumnAndBleed(
        page,
        breakout,
        page.locator('#plain'),
        page.locator('#bleed'),
      );

      // The app's main is wider than 64rem at the default viewport.
      const [plain, note] = await Promise.all([
        rect(page.locator('#plain')),
        rect(page.locator('#note')),
      ]);

      expect(note.left).toBeCloseTo(plain.right, 0);
      expect(Math.abs(note.top - plain.top)).toBeLessThan(2);
    });

    test('has no horizontal overflow at a 320 px viewport', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}breakout`);
      await waitForHydration(page);
      await expectItemSheetsApplied(page, ['breakout']);
      await expect(page.locator('#live-breakout')).toHaveCSS('display', 'grid');

      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(320);
    });

    test('keeps the hydrate-never breakout styled after every live breakout leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}breakout`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live breakouts' })
        .click();
      await expect(page.locator('#live-breakout')).toHaveCount(0);
      await nextFrames(page);

      const breakout = page.locator('#never-breakout');

      await expect(breakout).toHaveAttribute('data-ngx-yeti-item-breakout', '');
      expect(
        await itemLinks(page, 'breakout'),
        'the hydrate never host keeps the breakout link',
      ).toEqual(['breakout']);
      await expectColumnAndBleed(
        page,
        breakout,
        page.locator('#never-plain'),
        page.locator('#never-bleed'),
        '--yeti-space-lg',
      );
    });

    // The server hosts keep the breakout link in <head>, so the client-only
    // breakout reuses it.
    test('renders a client-only breakout with 0 unstyled frames while the server hosts hold the breakout link', async ({
      browserName,
      page,
    }) => {
      const display = await recordFrames(page, '#client-breakout', 'display');

      await delayCss(page);
      await page.goto(`${prefix}breakout`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only breakout' })
        .click();

      const breakout = page.locator('#client-breakout');

      await expect(breakout).toBeVisible();
      await expectColumnAndBleed(
        page,
        breakout,
        page.locator('#client-plain'),
        page.locator('#client-bleed'),
      );

      expectStyledFrames(await display(), {
        styled: (value) => value === 'grid',
        label: `${browserName}, ${kind}, client-only breakout`,
        ...productionFramesRecordedAs(),
      });
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the breakout with its attributes, markers, and item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}breakout`);

        const breakout = page.locator('#live-breakout');

        await expect(breakout).toHaveClass('breakout');
        await expect(breakout).toHaveAttribute(
          'data-ngx-yeti-item-breakout',
          '',
        );
        await expect(breakout).not.toHaveAttribute('data-max');
        await expect(breakout).not.toHaveAttribute('data-gap');
        await expect(page.locator('#bleed')).toHaveAttribute('data-bleed', '');
        await expect(page.locator('#note')).toHaveAttribute('data-note', '');
        await expect(page.locator('#never-breakout')).toHaveAttribute(
          'data-gap',
          'lg',
        );
        expect(await itemLinks(page, 'breakout')).toEqual(['breakout']);
      });

      test('lays out the column, the bleed, and the note as with JavaScript on', async ({
        page,
      }) => {
        await page.goto(`${prefix}breakout`);

        await expectColumnAndBleed(
          page,
          page.locator('#live-breakout'),
          page.locator('#plain'),
          page.locator('#bleed'),
        );

        const [plain, note] = await Promise.all([
          rect(page.locator('#plain')),
          rect(page.locator('#note')),
        ]);

        expect(note.left).toBeCloseTo(plain.right, 0);
        expect(Math.abs(note.top - plain.top)).toBeLessThan(2);
      });

      test('has no horizontal overflow at a 320 px viewport', async ({
        page,
      }) => {
        await page.setViewportSize({ width: 320, height: 640 });
        await page.goto(`${prefix}breakout`);
        await expectItemSheetsApplied(page, ['breakout']);
        await expect(page.locator('#live-breakout')).toHaveCSS(
          'display',
          'grid',
        );

        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(320);
      });
    });
  });
}
