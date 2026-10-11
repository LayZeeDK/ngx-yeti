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
} from './support/style-probe';

interface Box {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

async function rect(locator: Locator): Promise<Box> {
  return locator.evaluate((element) => {
    const { top, bottom, left, right } = element.getBoundingClientRect();

    return { top, bottom, left, right };
  });
}

/** Upstream bug O2: read geometry only once the overlay's sheet has applied. */
async function expectOverlayStyled(
  page: Page,
  overlay: Locator,
): Promise<void> {
  await expect
    .poll(() => itemSheetsLoaded(page, ['overlay']), {
      message: 'the overlay stylesheet is loaded',
    })
    .toBe(true);
  await expect(overlay).toHaveCSS('position', 'relative');
}

function expectCentredOn(held: Box, target: Box): void {
  expect(
    Math.abs((held.left + held.right) / 2 - (target.left + target.right) / 2),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs((held.top + held.bottom) / 2 - (target.top + target.bottom) / 2),
  ).toBeLessThanOrEqual(1);
}

/** The held child is out of the flow and centred on its overlay. */
async function expectHeld(
  page: Page,
  overlaySelector: string,
  heldSelector: string,
): Promise<void> {
  const overlay = page.locator(overlaySelector);

  await expectOverlayStyled(page, overlay);
  await expect(page.locator(heldSelector)).toHaveCSS('position', 'absolute');

  expectCentredOn(await rect(page.locator(heldSelector)), await rect(overlay));
}

/** The stamp is centred on its box and the fixed notice on the viewport. */
async function expectStampAndNotice(page: Page): Promise<void> {
  await expectHeld(page, '#live-overlay', '#held');

  const [box, picture] = await Promise.all([
    rect(page.locator('#live-overlay')),
    rect(page.locator('#picture')),
  ]);

  expect(picture.top).toBeCloseTo(box.top, 0);

  const notice = page.locator('#fixed-held');

  await expect(notice).toHaveCSS('position', 'fixed');

  const viewport = await page.evaluate(() => ({
    top: 0,
    left: 0,
    bottom: document.documentElement.clientHeight,
    right: document.documentElement.clientWidth,
  }));

  expectCentredOn(await rect(notice), viewport);
}

/** The overlay links, in document order; later items may add more. */
async function overlayLinks(page: Page): Promise<readonly string[]> {
  return (await itemLinks(page)).filter((item) => item === 'overlay');
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} overlay route`, () => {
    test('hydrates with 0 skipped components and no NG05xx message', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}overlay`);

      await expect(page.locator('#live-overlay')).toBeVisible();
      await expectCleanHydration();
    });

    test('centres the stamp on its box and the fixed notice on the viewport', async ({
      page,
    }) => {
      await page.goto(`${prefix}overlay`);
      await waitForHydration(page);

      await expect(page.locator('#held')).toHaveAttribute('data-over', '');
      await expectStampAndNotice(page);
    });

    test('has no horizontal overflow at a 320 px viewport', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}overlay`);
      await waitForHydration(page);
      await expectOverlayStyled(page, page.locator('#live-overlay'));

      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(320);
    });

    test('keeps the hydrate-never overlay styled after every live overlay leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}overlay`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live overlays' })
        .click();
      await expect(page.locator('#live-overlay')).toHaveCount(0);
      await expect(page.locator('#fixed-overlay')).toHaveCount(0);
      await nextFrames(page);

      await expect(page.locator('#never-overlay')).toHaveAttribute(
        'data-ngx-yeti-item-overlay',
        '',
      );
      expect(
        await overlayLinks(page),
        'the hydrate never host keeps the overlay link',
      ).toEqual(['overlay']);
      await expectHeld(page, '#never-overlay', '#never-held');
    });

    // The server hosts keep the overlay link in <head>, so the client-only
    // overlay reuses it. The box's `position` comes from its static class and
    // the overlay sheet, so it shows whether Yeti's rules were there in every
    // frame. The held child's own samples are only recorded: its `data-over`
    // is a binding, and the probe's frame callback can run before Angular's
    // change detection in the same frame, so it may sample a frame that is
    // never painted.
    test('never shows the client-only overlay without Yeti while the server hosts hold the overlay link', async ({
      browserName,
      page,
    }) => {
      const boxPosition = await recordFrames(
        page,
        '#client-overlay',
        'position',
      );
      const heldPosition = await recordFrames(page, '#client-held', 'position');

      await delayCss(page);
      await page.goto(`${prefix}overlay`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only overlay' })
        .click();

      await expect(page.locator('#client-overlay')).toBeVisible();
      await expectHeld(page, '#client-overlay', '#client-held');

      const frames = await boxPosition();
      const unstyled = frames.filter((value) => value !== 'relative');
      const held = await heldPosition();

      test.info().annotations.push({
        type: 'client-held-frames',
        description: `${browserName}, ${isProduction ? 'production' : 'development'}, ${kind}: ${String(held.filter((value) => value !== 'absolute').length)} of ${String(held.length)} sampled frames before the held child's marker applied`,
      });
      expect(
        frames.length,
        'the client-only overlay was sampled',
      ).toBeGreaterThan(0);

      if (isProduction) {
        test.info().annotations.push({
          type: 'a4-frames',
          description: `${browserName}, production, ${kind}: ${String(unstyled.length)} unstyled frames of ${String(frames.length)}`,
        });
      } else {
        expect(
          unstyled,
          'no frame shows the client-only overlay without Yeti',
        ).toEqual([]);
      }
    });

    test('removes the overlay link on leaving the route and re-inserts it on returning', async ({
      page,
    }) => {
      await page.goto(`${prefix}overlay`);
      await waitForHydration(page);

      expect(await itemLinks(page)).toContain('overlay');

      await page
        .getByRole('link', { name: 'Leave for a page without overlays' })
        .click();
      await expect(page).toHaveURL(/\/replay$/);
      await expect(page.locator('[data-ngx-yeti-item-overlay]')).toHaveCount(0);
      await expect.poll(() => overlayLinks(page)).toEqual([]);

      await page.goBack();
      await expect(page.locator('#live-overlay')).toBeVisible();
      await expect.poll(() => overlayLinks(page)).toEqual(['overlay']);
      await expectOverlayStyled(page, page.locator('#live-overlay'));
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the overlays with their attributes, markers, and item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}overlay`);

        const overlay = page.locator('#live-overlay');

        await expect(overlay).toHaveClass(/(^|\s)overlay(\s|$)/);
        await expect(overlay).toHaveAttribute('data-ngx-yeti-item-overlay', '');
        await expect(overlay).not.toHaveAttribute('data-gap');
        await expect(overlay).not.toHaveAttribute('data-fixed');
        await expect(page.locator('#held')).toHaveAttribute('data-over', '');
        await expect(page.locator('#held')).not.toHaveAttribute('data-fill');
        await expect(page.locator('#fixed-overlay')).toHaveAttribute(
          'data-fixed',
          '',
        );
        await expect(page.locator('#never-overlay')).toHaveAttribute(
          'data-gap',
          'lg',
        );
        expect(await overlayLinks(page)).toEqual(['overlay']);
      });

      test('centres the stamp and the fixed notice as with JavaScript on', async ({
        page,
      }) => {
        await page.goto(`${prefix}overlay`);

        await expect(page.locator('#held')).toHaveAttribute('data-over', '');
        await expectStampAndNotice(page);
      });

      test('has no horizontal overflow at a 320 px viewport', async ({
        page,
      }) => {
        await page.setViewportSize({ width: 320, height: 640 });
        await page.goto(`${prefix}overlay`);
        await expectOverlayStyled(page, page.locator('#live-overlay'));

        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(320);
      });

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}overlay`);

        expect(await axeViolations()).toEqual([]);
      });
    });
  });
}
