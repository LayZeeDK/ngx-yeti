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

/** Upstream bug O2: read geometry only once the layer's sheet has applied. */
async function expectLayerStyled(page: Page, layer: Locator): Promise<void> {
  await expect
    .poll(() => itemSheetsLoaded(page, ['layer']), {
      message: 'the layer stylesheet is loaded',
    })
    .toBe(true);
  await expect(layer).toHaveCSS('display', 'grid');
}

/**
 * The picture and its caption share one box: the picture at the top, the
 * caption on the bottom with its scrim, the box as tall as the taller child.
 */
async function expectCaptioned(page: Page): Promise<void> {
  const layer = page.locator('#live-layer');

  await expectLayerStyled(page, layer);

  const [box, picture, caption] = await Promise.all([
    rect(layer),
    rect(page.locator('#picture')),
    rect(page.locator('#caption')),
  ]);

  expect(picture.top).toBeCloseTo(box.top, 0);
  expect(picture.left).toBeCloseTo(box.left, 0);
  expect(caption.bottom).toBeCloseTo(box.bottom, 0);
  expect(box.height).toBeCloseTo(Math.max(picture.height, caption.height), 0);
  await expect(page.locator('#caption')).not.toHaveCSS(
    'background-color',
    'rgba(0, 0, 0, 0)',
  );
}

/** With `align="end"`, the short child sits on the box's bottom. */
async function expectAlignedEnd(
  page: Page,
  layerSelector: string,
  tallSelector: string,
  shortSelector: string,
): Promise<void> {
  await expectLayerStyled(page, page.locator(layerSelector));

  const [box, tall, short] = await Promise.all([
    rect(page.locator(layerSelector)),
    rect(page.locator(tallSelector)),
    rect(page.locator(shortSelector)),
  ]);

  expect(tall.top).toBeCloseTo(box.top, 0);
  expect(short.bottom).toBeCloseTo(box.bottom, 0);
  expect(short.height).toBeLessThan(box.height);
}

/** The layer links, in document order; later items may add more. */
async function layerLinks(page: Page): Promise<readonly string[]> {
  return (await itemLinks(page)).filter((item) => item === 'layer');
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} layer route`, () => {
    test('hydrates with 0 skipped components and no NG05xx message', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}layer`);

      await expect(page.locator('#live-layer')).toBeVisible();
      await expectCleanHydration();
    });

    test('stacks the caption over the picture and sits the short child at the bottom', async ({
      page,
    }) => {
      await page.goto(`${prefix}layer`);
      await waitForHydration(page);

      await expect(page.locator('#caption')).toHaveAttribute(
        'data-align-self',
        'end',
      );
      await expectCaptioned(page);
      await expectAlignedEnd(
        page,
        '#aligned-layer',
        '#aligned-tall',
        '#aligned-short',
      );
    });

    test('paints no frame with the static align written back', async ({
      browserName,
      page,
    }) => {
      const painted = await recordPaintedAttributes(page, '#aligned-layer', [
        'align',
      ]);
      const frames = await recordFrames(page, '#aligned-layer', 'text-align');

      await page.goto(`${prefix}layer`);
      await waitForHydration(page);

      const entries = await painted();
      const sampled = await frames();
      const aligned = page.locator('#aligned-layer');

      test.info().annotations.push({
        type: 'static-align-frames',
        description: `${browserName}, ${isProduction ? 'production' : 'development'}, ${kind}: ${String(entries.length)} painted align entries in ${String(sampled.length)} frames`,
      });
      expect(sampled.length, 'the layer was sampled').toBeGreaterThan(0);
      expect(entries, 'no painted frame shows align on the layer').toEqual([]);
      expect(
        sampled.filter((value) => value !== 'start'),
        "the layer's text stays start-aligned in every frame",
      ).toEqual([]);
      await expect(aligned).toHaveAttribute('data-align', 'end');
      await expect(aligned).not.toHaveAttribute('align');
    });

    test('has no horizontal overflow at a 320 px viewport', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}layer`);
      await waitForHydration(page);
      await expectLayerStyled(page, page.locator('#live-layer'));

      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(320);
    });

    test('keeps the hydrate-never layer styled after every live layer leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}layer`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live layers' })
        .click();
      await expect(page.locator('#live-layer')).toHaveCount(0);
      await nextFrames(page);

      await expect(page.locator('#never-layer')).toHaveAttribute(
        'data-ngx-yeti-item-layer',
        '',
      );
      expect(
        await layerLinks(page),
        'the hydrate never host keeps the layer link',
      ).toEqual(['layer']);
      await expectAlignedEnd(
        page,
        '#never-layer',
        '#never-tall',
        '#never-short',
      );
    });

    // The server hosts keep the layer link in <head>, so the client-only
    // layer reuses it.
    test('renders a client-only layer with 0 unstyled frames while the server hosts hold the layer link', async ({
      browserName,
      page,
    }) => {
      const display = await recordFrames(page, '#client-layer', 'display');

      await delayCss(page);
      await page.goto(`${prefix}layer`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only layer' })
        .click();

      await expect(page.locator('#client-layer')).toBeVisible();
      await expectAlignedEnd(
        page,
        '#client-layer',
        '#client-tall',
        '#client-short',
      );

      const frames = await display();
      const unstyled = frames.filter((value) => value !== 'grid');

      expect(
        frames.length,
        'the client-only layer was sampled',
      ).toBeGreaterThan(0);

      if (isProduction) {
        test.info().annotations.push({
          type: 'a4-frames',
          description: `${browserName}, production, ${kind}: ${String(unstyled.length)} unstyled frames of ${String(frames.length)}`,
        });
      } else {
        expect(
          unstyled,
          'no frame shows the client-only layer without Yeti',
        ).toEqual([]);
      }
    });

    test('removes the layer link on leaving the route and re-inserts it on returning', async ({
      page,
    }) => {
      await page.goto(`${prefix}layer`);
      await waitForHydration(page);

      expect(await itemLinks(page)).toContain('layer');

      await page
        .getByRole('link', { name: 'Leave for a page without layers' })
        .click();
      await expect(page).toHaveURL(/\/replay$/);
      await expect(page.locator('[data-ngx-yeti-item-layer]')).toHaveCount(0);
      await expect.poll(() => layerLinks(page)).toEqual([]);

      await page.goBack();
      await expect(page.locator('#live-layer')).toBeVisible();
      await expect.poll(() => layerLinks(page)).toEqual(['layer']);
      await expectLayerStyled(page, page.locator('#live-layer'));
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the layer with its attributes, markers, and item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}layer`);

        const layer = page.locator('#live-layer');

        await expect(layer).toHaveClass('layer');
        await expect(layer).toHaveAttribute('data-ngx-yeti-item-layer', '');
        await expect(layer).not.toHaveAttribute('data-align');
        await expect(page.locator('#caption')).toHaveAttribute(
          'data-align-self',
          'end',
        );
        await expect(page.locator('#caption')).not.toHaveAttribute(
          'data-justify-self',
        );
        await expect(page.locator('#aligned-layer')).toHaveAttribute(
          'data-align',
          'end',
        );
        await expect(page.locator('#aligned-layer')).not.toHaveAttribute(
          'align',
        );
        expect(await layerLinks(page)).toEqual(['layer']);
      });

      test('stacks the caption over the picture as with JavaScript on', async ({
        page,
      }) => {
        await page.goto(`${prefix}layer`);

        await expect(page.locator('#caption')).toHaveAttribute(
          'data-align-self',
          'end',
        );
        await expectCaptioned(page);
        await expectAlignedEnd(
          page,
          '#aligned-layer',
          '#aligned-tall',
          '#aligned-short',
        );
      });

      test('has no horizontal overflow at a 320 px viewport', async ({
        page,
      }) => {
        await page.setViewportSize({ width: 320, height: 640 });
        await page.goto(`${prefix}layer`);
        await expectLayerStyled(page, page.locator('#live-layer'));

        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(320);
      });

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}layer`);

        expect(await axeViolations()).toEqual([]);
      });
    });
  });
}
