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

interface Box {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

async function rect(locator: Locator): Promise<Box> {
  return locator.evaluate((element) => {
    const { top, bottom, left, width, height } =
      element.getBoundingClientRect();

    return { top, bottom, left, width, height };
  });
}

/** Upstream bug O2: read geometry only once the item sheets have applied. */
async function expectSheetsApplied(
  page: Page,
  cover: Locator,
  items: readonly string[] = ['cover'],
): Promise<void> {
  await expect
    .poll(() => itemSheetsLoaded(page, items), {
      message: `the ${items.join(' and ')} stylesheets are loaded`,
    })
    .toBe(true);
  await expect(cover).toHaveCSS('flex-direction', 'column');
}

/** The cover and center links, in document order; later items may add more. */
async function coverAndCenterLinks(page: Page): Promise<readonly string[]> {
  return (await itemLinks(page)).filter(
    (item) => item === 'cover' || item === 'center',
  );
}

/** The inline size and position of a center, with its sheet applied. */
async function centerColumn(
  center: Locator,
): Promise<{ left: number; width: number }> {
  await expect(center).not.toHaveCSS('padding-left', '0px');

  const { left, width } = await rect(center);

  return { left, width };
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} cover route`, () => {
    test('hydrates with 0 skipped components and no NG05xx message', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}cover`);

      await expect(page.locator('#live-cover')).toBeVisible();
      await expectCleanHydration();
    });

    test('keeps the hydrate-never cover that is a box styled, with both links, after every live cover and box leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}cover`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live covers' })
        .click();
      await expect(
        page.locator(
          '[data-ngx-yeti-item-cover]:not(#never-cover), [data-ngx-yeti-item-box]:not(#never-cover)',
        ),
      ).toHaveCount(0);
      await nextFrames(page);

      const cover = page.locator('#never-cover');
      const links = await itemLinks(page);

      await expect(cover).toHaveAttribute('data-ngx-yeti-item-cover', '');
      await expect(cover).toHaveAttribute('data-ngx-yeti-item-box', '');
      expect(links, 'the hydrate never host keeps the cover link').toContain(
        'cover',
      );
      expect(links, 'the hydrate never host keeps the box link').toContain(
        'box',
      );
      await expectSheetsApplied(page, cover, ['cover', 'box']);
      await expect(cover).toHaveAttribute('data-gap', 'lg');
    });

    // The server hosts keep the cover link in <head>, so the client-only
    // cover reuses it.
    test('renders a client-only cover with 0 unstyled frames while the server hosts hold the cover link', async ({
      browserName,
      page,
    }) => {
      const direction = await recordFrames(
        page,
        '#client-cover',
        'flex-direction',
      );

      await delayCss(page);
      await page.goto(`${prefix}cover`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only cover' })
        .click();

      const cover = page.locator('#client-cover');

      await expect(cover).toBeVisible();
      await expect(cover).toHaveCSS('flex-direction', 'column');

      const frames = await direction();
      const unstyled = frames.filter((value) => value !== 'column');

      expect(
        frames.length,
        'the client-only cover was sampled',
      ).toBeGreaterThan(0);
      test.info().annotations.push({
        type: isProduction ? 'a4-frames' : 'frames',
        description: `${browserName}${isProduction ? ', production' : ''}, ${kind}: ${String(unstyled.length)} of ${String(frames.length)} frames without the cover file`,
      });

      if (!isProduction) {
        expect(
          unstyled,
          'no frame shows the client-only cover without Yeti',
        ).toEqual([]);
      }
    });

    // The order with center (cover.md:295): the center link is in place, and
    // the cover's file arrives after it, yet lands before it in <head>, so
    // `.cover > *` does not zero the inner center's auto inline margins.
    test('keeps a center centred in a client-only cover that loads after the center file', async ({
      page,
    }) => {
      await page.goto(`${prefix}cover`);
      await waitForHydration(page);
      await expectSheetsApplied(page, page.locator('#reference-cover'), [
        'cover',
        'center',
      ]);

      const reference = await centerColumn(page.locator('#reference-center'));

      await expect(page.locator('#reference-center')).not.toHaveCSS(
        'margin-left',
        '0px',
      );

      await page
        .getByRole('button', { name: 'Remove the live covers' })
        .click();
      await removeDehydratedHosts(page, '#never-cover');
      await expect(page.locator('[data-ngx-yeti-item-cover]')).toHaveCount(0);
      await expect
        .poll(() => coverAndCenterLinks(page), {
          message: 'only the lone center holds a link',
        })
        .toEqual(['center']);

      await page
        .getByRole('button', { name: 'Show the client-only cover' })
        .click();

      const cover = page.locator('#client-cover');

      await expectSheetsApplied(page, cover, ['cover', 'center']);
      expect(
        await coverAndCenterLinks(page),
        'the cover link is inserted before the center link',
      ).toEqual(['cover', 'center']);

      const center = page.locator('#client-center');
      const inner = await centerColumn(center);

      await expect(center).not.toHaveCSS('margin-left', '0px');
      expect(inner.width).toBeCloseTo(reference.width, 1);
      expect(inner.left).toBeCloseTo(reference.left, 1);
    });

    test('removes the cover link on leaving the route and re-inserts it on returning', async ({
      page,
    }) => {
      await page.goto(`${prefix}cover`);
      await waitForHydration(page);

      expect(await itemLinks(page)).toContain('cover');

      await page
        .getByRole('link', { name: 'Leave for a page without covers' })
        .click();
      await expect(page).toHaveURL(/\/replay$/);
      await expect(page.locator('[data-ngx-yeti-item-cover]')).toHaveCount(0);
      await expect
        .poll(async () => (await itemLinks(page)).includes('cover'))
        .toBe(false);

      await page.goBack();
      await expect(page.locator('#live-cover')).toBeVisible();
      await expect
        .poll(async () => (await itemLinks(page)).includes('cover'))
        .toBe(true);
      await expectSheetsApplied(page, page.locator('#live-cover'));
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the cover with its attributes, marker, and item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}cover`);

        const cover = page.locator('#live-cover');

        await expect(cover).toHaveClass('cover');
        await expect(cover).toHaveAttribute('data-ngx-yeti-item-cover', '');
        await expect(cover).toHaveAttribute('data-gap', 'lg');
        await expect(cover).not.toHaveAttribute('data-height');
        await expect(page.locator('#cover-heading')).toHaveAttribute(
          'data-center',
          '',
        );
        await expect(page.locator('#cover-heading')).not.toHaveAttribute(
          'data-ngx-yeti-item-cover',
        );
        expect(await coverAndCenterLinks(page)).toEqual(['cover', 'center']);
      });

      test('lays the cover out viewport-tall with its heading centred', async ({
        page,
      }) => {
        await page.goto(`${prefix}cover`);
        await expectSheetsApplied(page, page.locator('#live-cover'), [
          'cover',
          'box',
        ]);

        const cover = await rect(page.locator('#live-cover'));
        const top = await rect(page.locator('#cover-top'));
        const heading = await rect(page.locator('#cover-heading'));
        const bottom = await rect(page.locator('#cover-bottom'));
        const viewport = await page.evaluate(() => window.innerHeight);

        expect(cover.height).toBeGreaterThanOrEqual(viewport - 0.5);
        expect(
          Math.abs(
            (heading.top + heading.bottom) / 2 - (top.bottom + bottom.top) / 2,
          ),
          "the heading's midpoint is halfway between the two notes",
        ).toBeLessThanOrEqual(1);
      });

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}cover`);

        expect(await axeViolations()).toEqual([]);
      });
    });
  });
}
