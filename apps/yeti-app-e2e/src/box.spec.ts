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

/** The box links in `<head>`; other items may add theirs. */
async function boxLinks(page: Page): Promise<readonly string[]> {
  return (await itemLinks(page)).filter((item) => item === 'box');
}

/** Upstream bug O2: read styles only once the box's sheet has applied. */
async function boxSheetApplied(page: Page): Promise<void> {
  await expect
    .poll(() => itemSheetsLoaded(page, ['box']), {
      message: 'the box stylesheet is loaded',
    })
    .toBe(true);
}

/**
 * Expects the element's padding, fill, and border to equal a probe whose
 * inline style reads the public tokens they come from (box.md, Testing
 * Decisions), so the assertion holds for any token value.
 */
async function expectMatchesProbe(
  element: Locator,
  probeStyle: string,
  properties: readonly string[],
): Promise<void> {
  const values = await element.evaluate(
    (host, [style, names]) => {
      const probe = document.createElement('div');
      probe.setAttribute('style', style);
      host.after(probe);
      const read = (target: Element): string[] =>
        names.map((name) => getComputedStyle(target).getPropertyValue(name));
      const result = { actual: read(host), expected: read(probe) };
      probe.remove();

      return result;
    },
    [probeStyle, properties] as const,
  );

  expect(values.actual).toEqual(values.expected);
}

const raisedBorderedLg =
  'padding: var(--yeti-space-lg); background-color: var(--yeti-color-surface-raised); border: var(--yeti-border-width) solid var(--yeti-color-border)';
const paddingFillBorder = [
  'padding-top',
  'padding-left',
  'background-color',
  'border-top-style',
  'border-top-width',
  'border-top-color',
];

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} box route`, () => {
    test('hydrates with 0 skipped components and no NG05xx message', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}box`);

      await expect(page.locator('#live-box')).toBeVisible();
      await expectCleanHydration();
    });

    test('has no horizontal overflow at a 320 px viewport with a 3xl box', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}box`);
      await waitForHydration(page);
      await boxSheetApplied(page);
      await expect(page.locator('#wide-box')).toHaveAttribute(
        'data-gap',
        '3xl',
      );

      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(320);
    });

    test('keeps the hydrate-never box padded after every live box leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}box`);
      await waitForHydration(page);

      await page.getByRole('button', { name: 'Remove the live boxes' }).click();
      await expect(
        page.locator('#live-box, #paint-band, #wide-box'),
      ).toHaveCount(0);
      await nextFrames(page);

      const box = page.locator('#never-box');

      await expect(box).toHaveAttribute('data-ngx-yeti-item-box', '');
      expect(
        await boxLinks(page),
        'the hydrate never host keeps the box link',
      ).toEqual(['box']);
      await boxSheetApplied(page);
      await expectMatchesProbe(box, 'padding: var(--yeti-space-lg)', [
        'padding-top',
        'padding-left',
      ]);

      await removeDehydratedHosts(page, '#never-box');
      await expect.poll(() => boxLinks(page)).toEqual([]);
    });

    // The server hosts keep the box link in <head>, so the client-only box
    // reuses it.
    test('renders a client-only box with no unpadded frame', async ({
      browserName,
      page,
    }) => {
      const padding = await recordFrames(page, '#client-box', 'padding-top');

      await delayCss(page);
      await page.goto(`${prefix}box`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only box' })
        .click();

      const box = page.locator('#client-box');

      await expect(box).toBeVisible();
      await boxSheetApplied(page);
      await expectMatchesProbe(box, 'padding: var(--yeti-space-lg)', [
        'padding-top',
      ]);

      const frames = await padding();
      const unpadded = frames.filter((value) => value === '0px');

      expect(frames.length, 'the client-only box was sampled').toBeGreaterThan(
        0,
      );

      if (isProduction) {
        test.info().annotations.push({
          type: 'a4-frames',
          description: `${browserName}, critical-CSS inlining on (production): ${String(unpadded.length)} of ${String(frames.length)} frames without the box file`,
        });
      } else {
        expect(unpadded, 'no frame shows the client-only box unpadded').toEqual(
          [],
        );
      }
    });

    test('removes the box link on leaving the route and re-inserts it on returning', async ({
      page,
    }) => {
      await page.goto(`${prefix}box`);
      await waitForHydration(page);

      expect(await boxLinks(page)).toEqual(['box']);

      await page
        .getByRole('link', { name: 'Leave for a page without boxes' })
        .click();
      await expect(page).toHaveURL(/\/replay$/);
      await expect(page.locator('[data-ngx-yeti-item-box]')).toHaveCount(0);
      await expect.poll(() => boxLinks(page)).toEqual([]);

      await page.goBack();
      await expect(page.locator('#live-box')).toBeVisible();
      await expect.poll(() => boxLinks(page)).toEqual(['box']);
      await boxSheetApplied(page);
      await expectMatchesProbe(
        page.locator('#live-box'),
        raisedBorderedLg,
        paddingFillBorder,
      );
    });

    // Recorded, not asserted: forced colours is not an AA criterion and the
    // border's survival is behaviour (box.md:314; ticket 50 decision 30).
    test('records that a bordered box keeps a visible border under forced colours', async ({
      browserName,
      page,
    }) => {
      test.skip(
        browserName === 'webkit',
        'WebKit forces no colours under emulation (ngx-yeti-specs Departures)',
      );

      await page.emulateMedia({ forcedColors: 'active' });
      await page.goto(`${prefix}box`);
      await waitForHydration(page);
      await boxSheetApplied(page);
      await expect(page.locator('#live-box')).toHaveAttribute(
        'data-border',
        '',
      );

      const border = await page.locator('#live-box').evaluate((element) => {
        const style = getComputedStyle(element);

        return `${style.borderTopStyle} ${style.borderTopWidth} ${style.borderTopColor}`;
      });

      test.info().annotations.push({
        type: 'forced-colors-border',
        description: `${browserName}, ${kind}: ${border}`,
      });
    });

    test('keeps a painted band in its colours when printed', async ({
      browserName,
      page,
    }) => {
      test.skip(
        browserName !== 'chromium',
        'page.pdf() prints in Chromium only',
      );

      await page.goto(`${prefix}box`);
      await waitForHydration(page);
      await page.emulateMedia({ media: 'print' });
      await page.pdf();

      await expect(page.locator('#paint-band')).toHaveCSS(
        'print-color-adjust',
        'exact',
      );
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the boxes with their attributes and item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}box`);

        const box = page.locator('#live-box');

        await expect(box).toHaveClass('box');
        await expect(box).toHaveAttribute('data-ngx-yeti-item-box', '');
        await expect(box).toHaveAttribute('data-gap', 'lg');
        await expect(box).toHaveAttribute('data-surface', 'raised');
        await expect(box).toHaveAttribute('data-border', '');
        await expect(page.locator('#paint-band')).toHaveAttribute(
          'data-paint',
          'primary',
        );
        expect(await boxLinks(page)).toEqual(['box']);
      });

      test("matches the box's padding, fill, and border and the band's colours to their probes", async ({
        page,
      }) => {
        await page.goto(`${prefix}box`);
        await boxSheetApplied(page);
        await expect(page.locator('#live-box')).toHaveAttribute(
          'data-surface',
          'raised',
        );

        await expectMatchesProbe(
          page.locator('#live-box'),
          raisedBorderedLg,
          paddingFillBorder,
        );
        await expectMatchesProbe(
          page.locator('#paint-band'),
          'background-color: var(--yeti-color-primary); color: var(--yeti-on-primary)',
          ['background-color', 'color'],
        );
      });

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}box`);

        expect(await axeViolations()).toEqual([]);
      });
    });
  });

  test.describe(`the ${kind} box-markers route`, () => {
    test('hydrates with 0 skipped components and no NG05xx message', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}box-markers`);

      await expect(page.locator('#bordered-figure')).toBeVisible();
      await expectCleanHydration();
    });

    // Box stays in the preload list for its @defer case; a preload hint is
    // not a loaded stylesheet.
    test('loads no box.css', async ({ page }) => {
      await page.goto(`${prefix}box-markers`);
      await waitForHydration(page);
      await nextFrames(page);

      expect(await boxLinks(page)).toEqual([]);
      expect(
        await page.evaluate(() =>
          [...document.styleSheets]
            .map((sheet) => sheet.href ?? '')
            .filter((href) => href.includes('layouts/box/box.css')),
        ),
      ).toEqual([]);
      await expect(page.locator('[data-ngx-yeti-item-box]')).toHaveCount(0);
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the markers styled with no class and no item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}box-markers`);

        const figure = page.locator('#bordered-figure');

        await expect(figure).toHaveAttribute('data-border', '');
        await expect(figure).not.toHaveAttribute('class');
        await expect(page.locator('#muted-text')).toHaveAttribute(
          'data-text',
          'grey-70',
        );
        await expect(page.locator('#marker-band')).toHaveAttribute(
          'data-paint',
          'primary',
        );
        expect(await boxLinks(page)).toEqual([]);
        await expectMatchesProbe(
          figure,
          'border: var(--yeti-border-width) solid var(--yeti-color-border)',
          ['border-top-style', 'border-top-width', 'border-top-color'],
        );
        await expectMatchesProbe(
          page.locator('#muted-text'),
          'color: var(--yeti-grey-70)',
          ['color'],
        );
      });

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}box-markers`);

        expect(await axeViolations()).toEqual([]);
      });
    });
  });
}
