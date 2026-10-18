import {
  childRects,
  expectItemSheetsApplied,
  rect,
  usedLength,
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
  recordFrames,
  recordPaintedAttributes,
} from './support/style-probe';

function rowCount(boxes: readonly Box[]): number {
  return new Set(boxes.map((box) => Math.round(box.top))).size;
}

/**
 * Expects the tags on one row one `xs` gap apart and the thresholded
 * cluster a column of full-width items below its threshold, and returns how
 * many rows the links in their narrow frame wrap onto.
 */
async function expectClustersLaidOut(page: Page): Promise<number> {
  const tags = page.locator('#tags-cluster');
  const threshold = page.locator('#threshold-cluster');

  await expectItemSheetsApplied(page, ['cluster']);
  await expect(tags).toHaveCSS('display', 'flex');

  const tagBoxes = await childRects(tags);
  const [first, second] = tagBoxes;

  if (first === undefined || second === undefined) {
    throw new Error('The tags cluster has items');
  }

  expect(rowCount(tagBoxes)).toBe(1);
  expect(second.left - first.right).toBeCloseTo(
    await usedLength(page.locator('main'), 'var(--yeti-space-xs)'),
    0,
  );
  const column = await childRects(threshold);
  const { width } = await rect(threshold);

  expect(rowCount(column)).toBe(column.length);

  for (const item of column) {
    expect(item.width).toBeCloseTo(width, 0);
  }

  return rowCount(await childRects(page.locator('#trails-cluster')));
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} cluster route`, () => {
    describeStandardRouteCases({
      item: 'cluster',
      prefix,
      liveHost: '#tags-cluster',
      leaveLink: 'Leave for a page without clusters',
      styled: { property: 'display', value: 'flex' },
      arrivals: '#arriving-cluster > li, #never-shared > li',
    });

    test('paints no frame with align on the cluster written with a static align', async ({
      browserName,
      page,
    }) => {
      const painted = await recordPaintedAttributes(page, '#aligned-cluster', [
        'align',
      ]);
      const frames = await recordFrames(page, '#aligned-cluster', 'display');

      await page.goto(`${prefix}cluster`);
      await waitForHydration(page);

      const entries = await painted();
      const sampled = await frames();
      const aligned = page.locator('#aligned-cluster');

      test.info().annotations.push({
        type: 'static-align-frames',
        description: `${browserName}, ${isProduction ? 'production' : 'development'}, ${kind}: ${String(entries.length)} painted align entries in ${String(sampled.length)} frames`,
      });
      expect(sampled.length, 'the cluster was sampled').toBeGreaterThan(0);
      expect(entries, 'no painted frame shows align on the cluster').toEqual(
        [],
      );
      await expect(aligned).toHaveAttribute('data-align', 'baseline');
      await expect(aligned).not.toHaveAttribute('align');
      await expect(aligned).toHaveCSS('text-align', 'start');
    });

    test('keeps the hydrate-never clusters laid out, and both links, after every live cluster and arrival leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}cluster`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live clusters' })
        .click();
      await expect(
        page.locator(
          '#tags-cluster, #trails-cluster, #aligned-cluster, #threshold-cluster, #arriving-cluster',
        ),
      ).toHaveCount(0);
      await nextFrames(page);

      const never = page.locator('#never-cluster');
      const shared = page.locator('#never-shared');

      await expect(shared).toHaveAttribute('data-ngx-yeti-item-cluster', '');
      await expect(shared).toHaveAttribute('data-ngx-yeti-item-enter', '');
      await expect(page.locator('[data-ngx-yeti-item-enter]')).toHaveCount(1);
      expect(
        await itemLinks(page),
        'the hydrate never hosts keep the cluster and enter links',
      ).toEqual(expect.arrayContaining(['cluster', 'enter']));
      await expect(never).toHaveCSS('display', 'flex');
      await expect(shared).toHaveCSS('display', 'flex');
      expect(rowCount(await childRects(never))).toBe(1);
    });

    // The server hosts keep the cluster link in <head>, so the client-only
    // cluster reuses it.
    test('renders a client-only cluster with 0 unstyled frames while the server hosts hold the cluster link', async ({
      browserName,
      page,
    }) => {
      const display = await recordFrames(page, '#client-cluster', 'display');

      await delayCss(page);
      await page.goto(`${prefix}cluster`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only cluster' })
        .click();

      const cluster = page.locator('#client-cluster');

      await expect(cluster).toBeVisible();
      await expect(cluster).toHaveCSS('display', 'flex');

      expectStyledFrames(await display(), {
        styled: (value) => value === 'flex',
        label: `${browserName}, ${kind}, client-only cluster`,
      });
    });

    test('lays out the clusters after hydration', async ({ page }) => {
      await page.goto(`${prefix}cluster`);
      await waitForHydration(page);

      expect(
        await expectClustersLaidOut(page),
        'the links wrap in their narrow frame',
      ).toBeGreaterThan(1);
    });

    test('has no horizontal overflow at a 320 px viewport', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}cluster`);
      await waitForHydration(page);
      await expectItemSheetsApplied(page, ['cluster']);
      await expect(page.locator('#tags-cluster')).toHaveCSS('display', 'flex');

      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(320);
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the clusters with their attributes and item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}cluster`);

        const tags = page.locator('#tags-cluster');
        const aligned = page.locator('#aligned-cluster');

        await expect(tags).toHaveClass('cluster');
        await expect(tags).toHaveAttribute('data-ngx-yeti-item-cluster', '');
        await expect(tags).toHaveAttribute('data-gap', 'xs');
        await expect(tags).toHaveAttribute('role', 'list');
        await expect(page.locator('#trails-cluster')).toHaveAttribute(
          'aria-label',
          'Trails',
        );
        await expect(aligned).toHaveAttribute('data-align', 'baseline');
        await expect(aligned).not.toHaveAttribute('align');
        await expect(page.locator('#threshold-cluster')).toHaveAttribute(
          'data-threshold',
          'sm',
        );
        await expect(page.locator('#arriving-cluster')).toHaveAttribute(
          'data-ngx-yeti-item-enter',
          '',
        );
        expect(await itemLinks(page, 'cluster')).toEqual(['cluster']);
      });

      test('lays out the clusters', async ({ page }) => {
        await page.goto(`${prefix}cluster`);

        expect(
          await expectClustersLaidOut(page),
          'the links wrap in their narrow frame',
        ).toBeGreaterThan(1);
      });
    });
  });
}
