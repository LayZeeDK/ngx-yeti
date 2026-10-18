import {
  expectItemSheetsApplied,
  rect,
  type Box,
} from '@ngx-yeti/testing/playwright';
import { type Page } from '@playwright/test';
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

type Edges = Pick<Box, 'top' | 'right' | 'bottom' | 'left'>;

function expectCentredOn(held: Edges, target: Edges): void {
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

  await expectItemSheetsApplied(page, ['overlay']);
  await expect(overlay).toHaveCSS('position', 'relative');
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

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} overlay route`, () => {
    describeStandardRouteCases({
      item: 'overlay',
      prefix,
      liveHost: '#live-overlay',
      leaveLink: 'Leave for a page without overlays',
      styled: { property: 'position', value: 'relative' },
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
      await expectItemSheetsApplied(page, ['overlay']);
      await expect(page.locator('#live-overlay')).toHaveCSS(
        'position',
        'relative',
      );

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
        await itemLinks(page, 'overlay'),
        'the hydrate never host keeps the overlay link',
      ).toEqual(['overlay']);
      await expectHeld(page, '#never-overlay', '#never-held');
    });

    // The server hosts keep the overlay link in <head>, so the client-only
    // overlay reuses it. The box's `position` comes from its static class and
    // the overlay sheet, so it shows whether Yeti's rules were there in every
    // frame. The held child's own samples are recorded as
    // `client-held-frames`, not asserted: its `data-over` is a binding, and
    // the probe's frame callback can run before Angular's change detection in
    // the frame that inserts it, so it samples a state that frame never
    // paints (the `client-held-frames` row of the ngx-yeti-specs Departures
    // table).
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

      expectStyledFrames(await heldPosition(), {
        styled: (value) => value === 'absolute',
        label: `${browserName}, ${kind}, client-only held child`,
        recordedAs: 'client-held-frames',
      });
      expectStyledFrames(await boxPosition(), {
        styled: (value) => value === 'relative',
        label: `${browserName}, ${kind}, client-only overlay`,
        ...productionFramesRecordedAs(),
      });
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
        expect(await itemLinks(page, 'overlay')).toEqual(['overlay']);
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
        await expectItemSheetsApplied(page, ['overlay']);
        await expect(page.locator('#live-overlay')).toHaveCSS(
          'position',
          'relative',
        );

        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(320);
      });
    });
  });
}
