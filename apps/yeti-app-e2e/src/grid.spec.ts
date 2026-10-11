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

/** The boxes of an element's children, in DOM order. */
async function childRects(parent: Locator): Promise<Box[]> {
  return parent.evaluate((element) =>
    [...element.children].map((child) => {
      const { top, bottom, left, right, width } = child.getBoundingClientRect();

      return { top, bottom, left, right, width };
    }),
  );
}

/** How many cells share the first row. */
function perRow(boxes: readonly Box[]): number {
  const tops = boxes.map((box) => Math.round(box.top));
  const first = Math.min(...tops);

  return tops.filter((top) => top === first).length;
}

/** The used inline length of a public token, read from a probe in the page. */
async function token(page: Page, name: string): Promise<number> {
  return page.locator('main').evaluate((main, property) => {
    const probe = document.createElement('div');
    probe.style.inlineSize = `var(${property})`;
    main.append(probe);
    const { width } = probe.getBoundingClientRect();
    probe.remove();

    return width;
  }, name);
}

/** The grid links in `<head>`; later items may add others. */
async function gridLinks(page: Page): Promise<readonly string[]> {
  return (await itemLinks(page)).filter((item) => item === 'grid');
}

/** Upstream bug O2: read geometry only once the grid's sheet has applied. */
async function expectGridSheetApplied(
  page: Page,
  grid: Locator,
): Promise<void> {
  await expect
    .poll(() => itemSheetsLoaded(page, ['grid']), {
      message: 'the grid stylesheet is loaded',
    })
    .toBe(true);
  await expect(grid).toHaveCSS('display', 'grid');
}

/**
 * Expects the fitted, folded, and tracks grids to land as in the Storybook
 * half, from their own widths and the tokens they read, and returns the
 * folded grid's count per row.
 */
async function expectGridsLaidOut(page: Page): Promise<number> {
  const fitted = page.locator('#fitted-grid');
  const folded = page.locator('#folded-grid');
  const tracks = page.locator('#tracks-grid');

  await expectGridSheetApplied(page, fitted);

  const fittedCells = await childRects(fitted);
  const [one, two] = fittedCells;

  if (one === undefined || two === undefined) {
    throw new Error('The fitted grid has cells');
  }

  const fittedGap = two.left - one.right;
  const min = await token(page, '--yeti-width-2xs');
  const fittedWidth = (await rect(fitted)).width;

  expect(perRow(fittedCells)).toBe(
    Math.min(3, Math.floor((fittedWidth + fittedGap) / (min + fittedGap))),
  );

  const rem = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.documentElement).fontSize),
  );
  const foldedWidth = (await rect(folded)).width;
  let folds = 1;

  if (foldedWidth >= 64 * rem) {
    folds = 4;
  } else if (foldedWidth >= 32 * rem) {
    folds = 2;
  }

  expect(perRow(await childRects(folded))).toBe(folds);

  const box = await rect(tracks);

  expect(box.width, 'the tracks grid is above its threshold').toBeGreaterThan(
    32 * rem,
  );

  const gap = await token(page, '--yeti-space-sm');
  const track = (box.width - 11 * gap) / 12;
  const [first, second, steps] = [
    await rect(page.locator('#first-work')),
    await rect(page.locator('#second-work')),
    await rect(page.locator('#steps-cell')),
  ];

  expect(first.left).toBeCloseTo(box.left + track + gap, 0);
  expect(first.width).toBeCloseTo(6 * track + 5 * gap, 0);
  expect(second.left).toBeCloseTo(box.left + 8 * (track + gap), 0);
  expect(second.top).toBeCloseTo(first.top, 0);
  expect(steps.left).toBeCloseTo(first.left, 0);
  expect(steps.top).toBeGreaterThan(first.bottom);

  return folds;
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} grid route`, () => {
    test('hydrates with 0 skipped components and no NG05xx message', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}grid`);

      await expect(page.locator('#fitted-grid')).toBeVisible();
      await expectCleanHydration();
    });

    test('paints no frame with start on the ol cell written with a static start', async ({
      browserName,
      page,
    }) => {
      const painted = await recordPaintedAttributes(page, '#steps-cell', [
        'start',
      ]);
      const frames = await recordFrames(page, '#steps-cell', 'display');

      await page.goto(`${prefix}grid`);
      await waitForHydration(page);

      const entries = await painted();
      const sampled = await frames();
      const steps = page.locator('#steps-cell');

      test.info().annotations.push({
        type: 'static-start-frames',
        description: `${browserName}, ${isProduction ? 'production' : 'development'}, ${kind}: ${String(entries.length)} painted start entries in ${String(sampled.length)} frames`,
      });
      expect(sampled.length, 'the cell was sampled').toBeGreaterThan(0);
      expect(entries, 'no painted frame shows start on the cell').toEqual([]);
      await expect(steps).toHaveAttribute('data-start', '2');
      await expect(steps).toHaveAttribute('data-span', '6');
      await expect(steps).not.toHaveAttribute('start');
      expect(
        await steps.evaluate((list) =>
          list instanceof HTMLOListElement ? list.start : null,
        ),
        'the list still counts from one',
      ).toBe(1);
    });

    test('keeps the hydrate-never grid styled after every live grid leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}grid`);
      await waitForHydration(page);

      await page.getByRole('button', { name: 'Remove the live grids' }).click();
      await expect(
        page.locator('#fitted-grid, #folded-grid, #tracks-grid'),
      ).toHaveCount(0);
      await nextFrames(page);

      const grid = page.locator('#never-grid');

      await expect(grid).toHaveAttribute('data-ngx-yeti-item-grid', '');
      expect(
        await gridLinks(page),
        'the hydrate never host keeps the grid link',
      ).toEqual(['grid']);
      await expect(grid).toHaveCSS('display', 'grid');
      expect(perRow(await childRects(grid))).toBe(2);
    });

    // The server hosts keep the grid link in <head>, so the client-only grid
    // reuses it.
    test('renders a client-only grid with 0 unstyled frames while the server hosts hold the grid link', async ({
      page,
    }) => {
      const display = await recordFrames(page, '#client-grid', 'display');

      await delayCss(page);
      await page.goto(`${prefix}grid`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only grid' })
        .click();

      const grid = page.locator('#client-grid');

      await expect(grid).toBeVisible();
      await expect(grid).toHaveCSS('display', 'grid');

      const frames = await display();

      expect(frames.length, 'the client-only grid was sampled').toBeGreaterThan(
        0,
      );
      expect(
        frames.filter((value) => value !== 'grid'),
        'no frame shows the client-only grid without Yeti',
      ).toEqual([]);
    });

    test('removes the grid link on leaving the route and re-inserts it on returning', async ({
      page,
    }) => {
      await page.goto(`${prefix}grid`);
      await waitForHydration(page);

      expect(await gridLinks(page)).toEqual(['grid']);

      await page
        .getByRole('link', { name: 'Leave for a page without grids' })
        .click();
      await expect(page).toHaveURL(/\/replay$/);
      await expect(page.locator('[data-ngx-yeti-item-grid]')).toHaveCount(0);
      await expect.poll(() => gridLinks(page)).toEqual([]);

      await page.goBack();
      await expect(page.locator('#fitted-grid')).toBeVisible();
      await expect.poll(() => gridLinks(page)).toEqual(['grid']);
      await expectGridSheetApplied(page, page.locator('#fitted-grid'));
    });

    test('lays out the fitted, folded, and tracks grids after hydration', async ({
      page,
    }) => {
      await page.goto(`${prefix}grid`);
      await waitForHydration(page);

      expect(await expectGridsLaidOut(page)).toBeGreaterThan(1);
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the grids with their attributes, markers, and item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}grid`);

        const fitted = page.locator('#fitted-grid');
        const tracks = page.locator('#tracks-grid');

        await expect(fitted).toHaveClass('grid');
        await expect(fitted).toHaveAttribute('data-ngx-yeti-item-grid', '');
        await expect(fitted).toHaveAttribute('data-min', '2xs');
        await expect(fitted).toHaveAttribute('data-columns', '3');
        await expect(fitted).toHaveAttribute('role', 'list');
        await expect(page.locator('#folded-grid')).toHaveAttribute(
          'data-fold',
          '',
        );
        await expect(tracks).toHaveAttribute('data-tracks', '12');
        await expect(tracks).toHaveAttribute('data-threshold', 'md');
        await expect(page.locator('#first-work')).toHaveAttribute(
          'data-start',
          '2',
        );
        await expect(page.locator('#steps-cell')).not.toHaveAttribute('start');
        expect(await gridLinks(page)).toEqual(['grid']);
      });

      test('lays out the fitted, folded, and tracks grids', async ({
        page,
      }) => {
        await page.goto(`${prefix}grid`);

        expect(await expectGridsLaidOut(page)).toBeGreaterThan(1);
      });

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}grid`);

        expect(await axeViolations()).toEqual([]);
      });
    });
  });
}
