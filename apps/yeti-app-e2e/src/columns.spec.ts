import {
  expectItemSheetsApplied,
  rect,
  type Box,
} from '@ngx-yeti/testing/playwright';
import { type Page } from '@playwright/test';
import { expect, isProduction, routeKinds, test } from './support/fixtures';
import { nextFrames, waitForHydration } from './support/hydration';
import { describeStandardRouteCases } from './support/standard-cases';
import {
  delayCss,
  expectStyledFrames,
  itemLinks,
  productionFramesRecordedAs,
  recordFrames,
  recordPaintedAttributes,
} from './support/style-probe';

/** The boxes of the live layout's three columns, at the top of the page. */
async function liveColumns(page: Page): Promise<readonly Box[]> {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });

  return Promise.all(
    ['#plan', '#build', '#ship'].map((id) => rect(page.locator(id))),
  );
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} columns route`, () => {
    describeStandardRouteCases({
      item: 'columns',
      prefix,
      liveHost: '#live-columns',
      leaveLink: 'Leave for a page without columns',
      styled: { property: 'flex-wrap', value: 'wrap' },
    });

    test('paints no frame with align on the layout written with a static align', async ({
      browserName,
      page,
    }) => {
      const painted = await recordPaintedAttributes(page, '#live-columns', [
        'align',
      ]);

      await page.goto(`${prefix}columns`);
      await waitForHydration(page);

      const entries = await painted();
      const columns = page.locator('#live-columns');

      test.info().annotations.push({
        type: 'static-align-frames',
        description: `${browserName}, ${isProduction ? 'production' : 'development'}, ${kind}: ${String(entries.length)} painted align entries`,
      });
      expect(entries, 'no painted frame shows align on the layout').toEqual([]);
      await expect(columns).toHaveAttribute('data-align', 'center');
      await expect(columns).not.toHaveAttribute('align');
    });

    test('keeps the hydrate-never layout in columns after every live layout leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}columns`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live columns' })
        .click();
      await expect(
        page.locator('[data-ngx-yeti-item-columns]:not(#never-columns)'),
      ).toHaveCount(0);
      await nextFrames(page);

      const columns = page.locator('#never-columns');

      expect(
        await itemLinks(page),
        'the hydrate never host keeps the columns link',
      ).toContain('columns');
      await expectItemSheetsApplied(page, ['columns']);
      await expect(columns).toHaveCSS('flex-wrap', 'wrap');

      const [first, second] = await Promise.all(
        ['p:nth-child(1)', 'p:nth-child(2)'].map((child) =>
          rect(columns.locator(child)),
        ),
      );

      expect(first?.top, 'the two columns share a row').toBeCloseTo(
        second?.top ?? Number.NaN,
        0,
      );
    });

    // The server hosts keep the columns link in <head>, so the client-only
    // layout reuses it.
    test('renders a client-only layout with 0 unstyled frames while the server hosts hold the columns link', async ({
      browserName,
      page,
    }) => {
      const wrap = await recordFrames(page, '#client-columns', 'flex-wrap');

      await delayCss(page);
      await page.goto(`${prefix}columns`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only columns' })
        .click();

      const columns = page.locator('#client-columns');

      await expect(columns).toBeVisible();
      await expect(columns).toHaveCSS('flex-wrap', 'wrap');

      expectStyledFrames(await wrap(), {
        styled: (value) => value === 'wrap',
        label: `${browserName}, ${kind}, client-only columns`,
        ...productionFramesRecordedAs(),
      });
    });

    test('puts the example in rows with no horizontal overflow at a 320 px viewport', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}columns`);
      await waitForHydration(page);

      const columns = page.locator('#live-columns');

      await expectItemSheetsApplied(page, ['columns', 'box']);
      await expect(columns).toHaveCSS('flex-wrap', 'wrap');

      const layout = await rect(columns);
      const [plan, build, ship] = await liveColumns(page);

      for (const column of [plan, build, ship]) {
        expect(column?.width).toBeCloseTo(layout.width, 0);
      }

      expect(build?.top ?? 0).toBeGreaterThan(plan?.top ?? 0);
      expect(ship?.top ?? 0).toBeGreaterThan(build?.top ?? 0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(320);
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the layout with its attributes, marker, and item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}columns`);

        const columns = page.locator('#live-columns');

        await expect(columns).toHaveClass('columns');
        await expect(columns).toHaveAttribute('data-ngx-yeti-item-columns', '');
        await expect(columns).toHaveAttribute('data-threshold', 'md');
        await expect(columns).toHaveAttribute('data-align', 'center');
        await expect(columns).not.toHaveAttribute('align');
        await expect(page.locator('#ship')).toHaveAttribute('data-span', '2');
        await expect(page.locator('#ship')).not.toHaveAttribute(
          'data-ngx-yeti-item-columns',
        );
        expect(await itemLinks(page)).toContain('columns');
      });

      test('places the columns where they sit with JavaScript on', async ({
        baseURL,
        browser,
        page,
      }) => {
        await page.goto(`${prefix}columns`);
        await expectItemSheetsApplied(page, ['columns', 'box']);
        await expect(page.locator('#live-columns')).toHaveCSS(
          'flex-wrap',
          'wrap',
        );

        const off = await liveColumns(page);

        if (baseURL === undefined) {
          throw new Error('The Fixture app has no base URL');
        }

        // newContext takes the test's use options, so JavaScript is turned
        // back on here.
        const context = await browser.newContext({
          baseURL,
          javaScriptEnabled: true,
        });

        try {
          const live = await context.newPage();

          await live.goto(`${prefix}columns`);
          await waitForHydration(live);
          await expectItemSheetsApplied(live, ['columns', 'box']);
          await expect(live.locator('#live-columns')).toHaveCSS(
            'flex-wrap',
            'wrap',
          );

          const on = await liveColumns(live);

          // Centred in the row (`align="center"`), the columns' tops differ;
          // sharing the row, each starts right of the one before.
          expect(
            off[1]?.left ?? Number.NaN,
            'the columns share a row',
          ).toBeGreaterThan((off[0]?.left ?? 0) + (off[0]?.width ?? 0));

          for (const [index, column] of off.entries()) {
            expect(column.left).toBeCloseTo(on[index]?.left ?? Number.NaN, 0);
            expect(column.top).toBeCloseTo(on[index]?.top ?? Number.NaN, 0);
            expect(column.width).toBeCloseTo(on[index]?.width ?? Number.NaN, 0);
          }
        } finally {
          await context.close();
        }
      });
    });
  });
}
