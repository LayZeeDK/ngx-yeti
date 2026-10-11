import { expectItemSheetsApplied } from '@ngx-yeti/testing/playwright';
import { type Locator, type Page } from '@playwright/test';
import { expect, routeKinds, test } from './support/fixtures';
import { nextFrames, waitForHydration } from './support/hydration';
import { holdBackMainBundle } from './support/main-bundle';
import { describeStandardRouteCases } from './support/standard-cases';
import {
  delayCss,
  expectStyledFrames,
  itemLinks,
  productionFramesRecordedAs,
  recordFrames,
} from './support/style-probe';

async function scrollLeft(scroller: Locator): Promise<number> {
  return scroller.evaluate((element) => element.scrollLeft);
}

/** Expects the scroller's items on one row and the track wider than its box. */
async function expectOneOverflowingRow(scroller: Locator): Promise<void> {
  const { rows, overflow } = await scroller.evaluate((element) => ({
    rows: new Set(
      [...element.children].map((child) =>
        Math.round(child.getBoundingClientRect().top),
      ),
    ).size,
    overflow: element.scrollWidth - element.clientWidth,
  }));

  expect(rows, 'the items share one row').toBe(1);
  expect(overflow, 'the track scrolls').toBeGreaterThan(0);
}

/** The first Tab on the page focuses the scroller; ArrowRight scrolls it. */
async function tabAndScroll(page: Page, scroller: Locator): Promise<number> {
  await page.keyboard.press('Tab');
  await expect(scroller).toBeFocused();
  expect(await scrollLeft(scroller)).toBe(0);

  await page.keyboard.press('ArrowRight');
  await expect.poll(() => scrollLeft(scroller)).toBeGreaterThan(0);

  // Let a smooth or snapping scroll come to rest before reading it.
  let previous = Number.NaN;
  await expect
    .poll(async () => {
      const current = await scrollLeft(scroller);
      const settled = current === previous;
      previous = current;

      return settled;
    })
    .toBe(true);

  return previous;
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} scroller route`, () => {
    describeStandardRouteCases({
      item: 'scroller',
      prefix,
      liveHost: '#featured-scroller',
      leaveLink: 'Leave for a page without scrollers',
      styled: { property: 'display', value: 'flex' },
    });

    test('lays out the scroller as one scrolling row after hydration', async ({
      page,
    }) => {
      await page.goto(`${prefix}scroller`);
      await waitForHydration(page);

      const scroller = page.locator('#featured-scroller');

      await expectItemSheetsApplied(page, ['scroller']);
      await expect(scroller).toHaveCSS('display', 'flex');
      await expectOneOverflowingRow(scroller);
      await expect(scroller).toHaveAttribute('role', 'region');
      await expect(scroller).toHaveAttribute('tabindex', '0');
    });

    test('keeps the focus and the scroll position made before hydration', async ({
      page,
    }) => {
      const release = await holdBackMainBundle(page);

      await page.goto(`${prefix}scroller`, { waitUntil: 'commit' });

      const scroller = page.locator('#featured-scroller');

      await scroller.waitFor({ state: 'attached' });
      await expectItemSheetsApplied(page, ['scroller']);
      await expect(page.locator('[jsaction]').first()).toBeAttached();

      const scrolled = await tabAndScroll(page, scroller);

      release();
      await waitForHydration(page);
      await nextFrames(page);

      await expect(scroller).toBeFocused();
      expect(await scrollLeft(scroller)).toBe(scrolled);
    });

    test('keeps the hydrate-never scroller one row, focusable, and its link after the live scroller leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}scroller`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live scroller' })
        .click();
      await expect(page.locator('#featured-scroller')).toHaveCount(0);
      await nextFrames(page);

      const never = page.locator('#never-scroller');

      expect(await itemLinks(page, 'scroller')).toEqual(['scroller']);
      await expect(never).toHaveCSS('display', 'flex');
      await expectOneOverflowingRow(never);

      await never.focus();
      await expect(never).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => scrollLeft(never)).toBeGreaterThan(0);
    });

    // The server hosts keep the scroller link in <head>, so the client-only
    // scroller reuses it.
    test('renders a client-only scroller with no unstyled frame', async ({
      browserName,
      page,
    }) => {
      const display = await recordFrames(page, '#client-scroller', 'display');

      await delayCss(page);
      await page.goto(`${prefix}scroller`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only scroller' })
        .click();

      const scroller = page.locator('#client-scroller');

      await expect(scroller).toBeVisible();
      await expect(scroller).toHaveCSS('display', 'flex');

      expectStyledFrames(await display(), {
        styled: (value) => value === 'flex',
        label: `${browserName}, ${kind}, client-only scroller`,
        ...productionFramesRecordedAs(),
      });
    });

    test('has no horizontal overflow at a 320 px viewport', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}scroller`);
      await waitForHydration(page);

      const scroller = page.locator('#featured-scroller');

      await expectItemSheetsApplied(page, ['scroller']);
      await expect(scroller).toHaveCSS('display', 'flex');
      await expectOneOverflowingRow(scroller);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(320);
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the scroller with its role, tab stop, name, attributes, and item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}scroller`);

        const scroller = page.locator('#featured-scroller');

        await expect(scroller).toHaveClass('scroller');
        await expect(scroller).toHaveAttribute('role', 'region');
        await expect(scroller).toHaveAttribute('tabindex', '0');
        await expect(scroller).toHaveAttribute(
          'aria-label',
          'Featured articles',
        );
        await expect(scroller).toHaveAttribute(
          'data-ngx-yeti-item-scroller',
          '',
        );
        await expect(scroller).toHaveAttribute('data-snap', '');
        await expect(scroller).toHaveAttribute('data-width', 'sm');
        expect(await itemLinks(page, 'scroller')).toEqual(['scroller']);
      });

      test('focuses the scroller on Tab and scrolls it with ArrowRight, its items on one row', async ({
        page,
      }) => {
        await page.goto(`${prefix}scroller`);

        const scroller = page.locator('#featured-scroller');

        await expectItemSheetsApplied(page, ['scroller']);
        await expect(scroller).toHaveCSS('display', 'flex');
        await expectOneOverflowingRow(scroller);
        expect(await tabAndScroll(page, scroller)).toBeGreaterThan(0);
      });
    });
  });
}
