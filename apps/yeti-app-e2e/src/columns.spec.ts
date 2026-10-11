import { type Locator, type Page } from '@playwright/test';
import { expect, isProduction, routeKinds, test } from './support/fixtures';
import {
  nextFrames,
  waitForHydration,
  watchHydration,
} from './support/hydration';
import {
  delayCss,
  itemLinks,
  itemSheetsLoaded,
  recordFrames,
  recordPaintedAttributes,
} from './support/style-probe';

interface Box {
  readonly top: number;
  readonly left: number;
  readonly width: number;
}

async function rect(locator: Locator): Promise<Box> {
  return locator.evaluate((element) => {
    const { top, left, width } = element.getBoundingClientRect();

    return { top, left, width };
  });
}

/** Upstream bug O2: read geometry only once the item sheets have applied. */
async function expectSheetsApplied(
  page: Page,
  columns: Locator,
  items: readonly string[] = ['columns'],
): Promise<void> {
  await expect
    .poll(() => itemSheetsLoaded(page, items), {
      message: `the ${items.join(' and ')} stylesheets are loaded`,
    })
    .toBe(true);
  await expect(columns).toHaveCSS('flex-wrap', 'wrap');
}

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
    test('hydrates with 0 skipped components and no NG05xx message, and leaves no align', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}columns`);

      await expect(page.locator('#live-columns')).toBeVisible();
      await expectCleanHydration();
      await expect(page.locator('#live-columns')).not.toHaveAttribute('align');
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
      await expectSheetsApplied(page, columns);

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

      const frames = await wrap();
      const unstyled = frames.filter((value) => value !== 'wrap');

      expect(
        frames.length,
        'the client-only layout was sampled',
      ).toBeGreaterThan(0);
      test.info().annotations.push({
        type: isProduction ? 'a4-frames' : 'frames',
        description: `${browserName}${isProduction ? ', production' : ''}, ${kind}: ${String(unstyled.length)} of ${String(frames.length)} frames without the columns file`,
      });

      if (!isProduction) {
        expect(
          unstyled,
          'no frame shows the client-only layout without Yeti',
        ).toEqual([]);
      }
    });

    test('removes the columns link on leaving the route and re-inserts it on returning', async ({
      page,
    }) => {
      await page.goto(`${prefix}columns`);
      await waitForHydration(page);

      expect(await itemLinks(page)).toContain('columns');

      await page
        .getByRole('link', { name: 'Leave for a page without columns' })
        .click();
      await expect(page).toHaveURL(/\/replay$/);
      await expect(page.locator('[data-ngx-yeti-item-columns]')).toHaveCount(0);
      await expect
        .poll(async () => (await itemLinks(page)).includes('columns'))
        .toBe(false);

      await page.goBack();
      await expect(page.locator('#live-columns')).toBeVisible();
      await expect
        .poll(async () => (await itemLinks(page)).includes('columns'))
        .toBe(true);
      await expectSheetsApplied(page, page.locator('#live-columns'));
    });

    test('puts the example in rows with no horizontal overflow at a 320 px viewport', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}columns`);
      await waitForHydration(page);

      const columns = page.locator('#live-columns');

      await expectSheetsApplied(page, columns, ['columns', 'box']);

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
        await expectSheetsApplied(page, page.locator('#live-columns'), [
          'columns',
          'box',
        ]);

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
          await expectSheetsApplied(live, live.locator('#live-columns'), [
            'columns',
            'box',
          ]);

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

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}columns`);

        expect(await axeViolations()).toEqual([]);
      });
    });
  });
}
