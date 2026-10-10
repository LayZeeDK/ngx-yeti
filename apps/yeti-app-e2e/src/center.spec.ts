import { type Locator, type Page } from '@playwright/test';
import { expect, isProduction, routeKinds, test } from './support/fixtures';
import { removeDehydratedHosts } from './support/hosts';
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
} from './support/style-probe';

/** The stack and center links, in document order; later items may add more. */
async function stackAndCenterLinks(page: Page): Promise<readonly string[]> {
  return (await itemLinks(page)).filter(
    (item) => item === 'stack' || item === 'center',
  );
}

/**
 * Expects each center to match a probe that reads `--yeti-width-xs`, the
 * token its `max="xs"` names, and to sit in the middle of its container with
 * equal space on both sides (center.md, Testing Decisions).
 */
async function expectCentred(page: Page, centers: Locator): Promise<void> {
  // Upstream bug O2: read geometry only once the center's sheet has applied.
  await expect
    .poll(() => itemSheetsLoaded(page, ['center']), {
      message: 'the center stylesheet is loaded',
    })
    .toBe(true);
  await expect(centers.first()).toHaveCSS('box-sizing', 'content-box');

  const columns = await centers.evaluateAll((elements) => {
    const probe = document.createElement('div');
    probe.style.maxInlineSize = 'var(--yeti-width-xs)';
    document.body.append(probe);
    const probeMax = getComputedStyle(probe).maxInlineSize;
    probe.remove();

    return elements.map((element) => {
      const outer = element.parentElement?.getBoundingClientRect();
      const inner = element.getBoundingClientRect();

      return {
        max: getComputedStyle(element).maxInlineSize,
        probeMax,
        start: inner.left - (outer?.left ?? NaN),
        end: (outer?.right ?? NaN) - inner.right,
      };
    });
  });

  expect(columns.length, 'the centers are rendered').toBeGreaterThan(0);

  for (const { max, probeMax, start, end } of columns) {
    expect(max).toBe(probeMax);
    expect(start, 'the column is narrower than its container').toBeGreaterThan(
      50,
    );
    expect(Math.abs(start - end)).toBeLessThanOrEqual(1);
  }
}

const showClientStack = 'Show the client-only stack of centers';

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} center route`, () => {
    test('hydrates with 0 skipped components and no NG05xx message', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}center`);

      await expect(page.locator('#live-center')).toBeVisible();
      await expectCleanHydration();
    });

    test('has no horizontal overflow at a 320 px viewport', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}center`);
      await waitForHydration(page);
      await expect(page.locator('#live-center')).toHaveCSS(
        'box-sizing',
        'content-box',
      );

      // A center alone, a center with `intrinsic`, and a stack of centers.
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(320);
    });

    test('keeps the hydrate-never center centred after every live center leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}center`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live centers' })
        .click();
      await expect(
        page.locator('#live-center, #intrinsic-center, #live-stack'),
      ).toHaveCount(0);
      await nextFrames(page);

      const center = page.locator('#never-center');

      await expect(center).toHaveAttribute('data-ngx-yeti-item-center', '');
      expect(
        await stackAndCenterLinks(page),
        'the hydrate never host keeps the center link, and the stack link goes',
      ).toEqual(['center']);
      await expectCentred(page, center);
    });

    // The server hosts keep the center link in <head>, so the client-only
    // centers reuse it.
    test('renders client-only centers with no frame at full width while the server hosts hold the center link', async ({
      page,
    }) => {
      const gutter = await recordFrames(
        page,
        '#client-stack > section',
        'padding-left',
      );

      await delayCss(page);
      await page.goto(`${prefix}center`);
      await waitForHydration(page);

      await page.getByRole('button', { name: showClientStack }).click();

      const centers = page.locator('#client-stack > section');

      await expect(centers).toHaveCount(2);
      await expectCentred(page, centers);

      const frames = await gutter();

      expect(
        frames.length,
        'the client-only center was sampled',
      ).toBeGreaterThan(0);
      expect(
        frames.filter((value) => value === '0px'),
        'no frame shows the client-only center without its gutters',
      ).toEqual([]);
    });

    // The tie (center.md:290), in both arrival orders.
    test('keeps a stack of centers centred when the stack file loads first', async ({
      page,
    }) => {
      await page.goto(`${prefix}center`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live centers' })
        .click();
      await removeDehydratedHosts(page, '#never-center');
      await expect
        .poll(() => stackAndCenterLinks(page), {
          message: 'no host holds a link',
        })
        .toEqual([]);

      // The stack's directive is created before its children's.
      await page.getByRole('button', { name: showClientStack }).click();

      await expect
        .poll(() => stackAndCenterLinks(page))
        .toEqual(['stack', 'center']);
      await expectCentred(page, page.locator('#client-stack > section'));
    });

    test('keeps a stack of centers centred when the stack file loads after the center file', async ({
      page,
    }) => {
      await page.goto(`${prefix}center`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live centers' })
        .click();
      await expect
        .poll(() => stackAndCenterLinks(page), {
          message: 'only the hydrate never center holds a link',
        })
        .toEqual(['center']);

      await page.getByRole('button', { name: showClientStack }).click();

      await expect
        .poll(() => stackAndCenterLinks(page), {
          message: 'the stack link is inserted before the center link',
        })
        .toEqual(['stack', 'center']);
      await expect(page.locator('#client-stack')).toHaveCSS('display', 'flex');
      await expectCentred(page, page.locator('#client-stack > section'));
    });

    test('removes the center link on leaving the route and re-inserts it on returning', async ({
      page,
    }) => {
      await page.goto(`${prefix}center`);
      await waitForHydration(page);

      expect(await itemLinks(page)).toContain('center');

      await page
        .getByRole('link', { name: 'Leave for a page without centers' })
        .click();
      await expect(page).toHaveURL(/\/replay$/);
      await expect(page.locator('[data-ngx-yeti-item-center]')).toHaveCount(0);
      await expect.poll(() => stackAndCenterLinks(page)).toEqual([]);

      await page.goBack();
      await expect(page.locator('#live-center')).toBeVisible();
      await expect
        .poll(() => stackAndCenterLinks(page))
        .toEqual(['stack', 'center']);
      await expectCentred(page, page.locator('#live-center'));
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the centers with their attributes and item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}center`);

        const center = page.locator('#live-center');

        await expect(center).toHaveClass('center');
        await expect(center).toHaveAttribute('data-ngx-yeti-item-center', '');
        await expect(center).toHaveAttribute('data-max', 'xs');
        await expect(center).not.toHaveAttribute('data-gap');
        await expect(page.locator('#intrinsic-center')).toHaveAttribute(
          'data-intrinsic',
          '',
        );
        expect(await stackAndCenterLinks(page)).toEqual(['stack', 'center']);
      });

      test('centres every center at the maximum its probe reads', async ({
        page,
      }) => {
        await page.goto(`${prefix}center`);

        await expectCentred(
          page,
          page.locator('#live-center, #live-stack > section, #never-center'),
        );

        // The intrinsic column shrinks to its content, in the middle.
        const intrinsic = await page
          .locator('#intrinsic-center')
          .evaluate((element) => {
            const outer = element.parentElement?.getBoundingClientRect();
            const inner = element.getBoundingClientRect();

            return {
              start: inner.left - (outer?.left ?? NaN),
              end: (outer?.right ?? NaN) - inner.right,
            };
          });

        expect(intrinsic.start).toBeGreaterThan(50);
        expect(Math.abs(intrinsic.start - intrinsic.end)).toBeLessThanOrEqual(
          1,
        );
      });

      test('has no horizontal overflow at a 320 px viewport', async ({
        page,
      }) => {
        await page.setViewportSize({ width: 320, height: 640 });
        await page.goto(`${prefix}center`);
        await expect(page.locator('#live-center')).toHaveCSS(
          'box-sizing',
          'content-box',
        );

        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(320);
      });

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}center`);

        expect(await axeViolations()).toEqual([]);
      });
    });
  });
}
