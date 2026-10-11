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
  readonly width: number;
}

async function rect(locator: Locator): Promise<Box> {
  return locator.evaluate((element) => {
    const { top, bottom, left, right, width } = element.getBoundingClientRect();

    return { top, bottom, left, right, width };
  });
}

/** The used length of a public token, read from a probe in the page. */
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

/** Upstream bug O2: read geometry only once the breakout's sheet has applied. */
async function expectBreakoutStyled(
  page: Page,
  breakout: Locator,
): Promise<void> {
  await expect
    .poll(() => itemSheetsLoaded(page, ['breakout']), {
      message: 'the breakout stylesheet is loaded',
    })
    .toBe(true);
  await expect(breakout).toHaveCSS('display', 'grid');
}

/**
 * Expects a plain child in the centred column, `min(width - 2 gaps, max)`
 * wide, and a bleeding child as wide as the breakout (breakout.md, Testing
 * Decisions).
 */
async function expectColumnAndBleed(
  page: Page,
  breakout: Locator,
  plain: Locator,
  bleed: Locator,
  gapToken = '--yeti-space-md',
): Promise<void> {
  await expectBreakoutStyled(page, breakout);

  const [box, column, band] = await Promise.all([
    rect(breakout),
    rect(plain),
    rect(bleed),
  ]);
  const gap = await token(page, gapToken);
  const max = await token(page, '--yeti-width-md');

  expect(column.width).toBeCloseTo(Math.min(box.width - 2 * gap, max), 0);
  expect(
    Math.abs(column.left - box.left - (box.right - column.right)),
  ).toBeLessThanOrEqual(1);
  expect(band.width).toBeCloseTo(box.width, 0);
}

/** The breakout links, in document order; later items may add more. */
async function breakoutLinks(page: Page): Promise<readonly string[]> {
  return (await itemLinks(page)).filter((item) => item === 'breakout');
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} breakout route`, () => {
    test('hydrates with 0 skipped components and no NG05xx message', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}breakout`);

      await expect(page.locator('#live-breakout')).toBeVisible();
      await expectCleanHydration();
    });

    test('lays out the column, the bleed, and the note beside its child', async ({
      page,
    }) => {
      await page.goto(`${prefix}breakout`);
      await waitForHydration(page);

      const breakout = page.locator('#live-breakout');

      await expectColumnAndBleed(
        page,
        breakout,
        page.locator('#plain'),
        page.locator('#bleed'),
      );

      // The app's main is wider than 64rem at the default viewport.
      const [plain, note] = await Promise.all([
        rect(page.locator('#plain')),
        rect(page.locator('#note')),
      ]);

      expect(note.left).toBeCloseTo(plain.right, 0);
      expect(Math.abs(note.top - plain.top)).toBeLessThan(2);
    });

    test('has no horizontal overflow at a 320 px viewport', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}breakout`);
      await waitForHydration(page);
      await expectBreakoutStyled(page, page.locator('#live-breakout'));

      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(320);
    });

    test('keeps the hydrate-never breakout styled after every live breakout leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}breakout`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live breakouts' })
        .click();
      await expect(page.locator('#live-breakout')).toHaveCount(0);
      await nextFrames(page);

      const breakout = page.locator('#never-breakout');

      await expect(breakout).toHaveAttribute('data-ngx-yeti-item-breakout', '');
      expect(
        await breakoutLinks(page),
        'the hydrate never host keeps the breakout link',
      ).toEqual(['breakout']);
      await expectColumnAndBleed(
        page,
        breakout,
        page.locator('#never-plain'),
        page.locator('#never-bleed'),
        '--yeti-space-lg',
      );
    });

    // The server hosts keep the breakout link in <head>, so the client-only
    // breakout reuses it.
    test('renders a client-only breakout with 0 unstyled frames while the server hosts hold the breakout link', async ({
      browserName,
      page,
    }) => {
      const display = await recordFrames(page, '#client-breakout', 'display');

      await delayCss(page);
      await page.goto(`${prefix}breakout`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only breakout' })
        .click();

      const breakout = page.locator('#client-breakout');

      await expect(breakout).toBeVisible();
      await expectColumnAndBleed(
        page,
        breakout,
        page.locator('#client-plain'),
        page.locator('#client-bleed'),
      );

      const frames = await display();
      const unstyled = frames.filter((value) => value !== 'grid');

      expect(
        frames.length,
        'the client-only breakout was sampled',
      ).toBeGreaterThan(0);

      if (isProduction) {
        test.info().annotations.push({
          type: 'a4-frames',
          description: `${browserName}, production, ${kind}: ${String(unstyled.length)} unstyled frames of ${String(frames.length)}`,
        });
      } else {
        expect(
          unstyled,
          'no frame shows the client-only breakout without Yeti',
        ).toEqual([]);
      }
    });

    test('removes the breakout link on leaving the route and re-inserts it on returning', async ({
      page,
    }) => {
      await page.goto(`${prefix}breakout`);
      await waitForHydration(page);

      expect(await itemLinks(page)).toContain('breakout');

      await page
        .getByRole('link', { name: 'Leave for a page without breakouts' })
        .click();
      await expect(page).toHaveURL(/\/replay$/);
      await expect(page.locator('[data-ngx-yeti-item-breakout]')).toHaveCount(
        0,
      );
      await expect.poll(() => breakoutLinks(page)).toEqual([]);

      await page.goBack();
      await expect(page.locator('#live-breakout')).toBeVisible();
      await expect.poll(() => breakoutLinks(page)).toEqual(['breakout']);
      await expectBreakoutStyled(page, page.locator('#live-breakout'));
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the breakout with its attributes, markers, and item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}breakout`);

        const breakout = page.locator('#live-breakout');

        await expect(breakout).toHaveClass('breakout');
        await expect(breakout).toHaveAttribute(
          'data-ngx-yeti-item-breakout',
          '',
        );
        await expect(breakout).not.toHaveAttribute('data-max');
        await expect(breakout).not.toHaveAttribute('data-gap');
        await expect(page.locator('#bleed')).toHaveAttribute('data-bleed', '');
        await expect(page.locator('#note')).toHaveAttribute('data-note', '');
        await expect(page.locator('#never-breakout')).toHaveAttribute(
          'data-gap',
          'lg',
        );
        expect(await breakoutLinks(page)).toEqual(['breakout']);
      });

      test('lays out the column, the bleed, and the note as with JavaScript on', async ({
        page,
      }) => {
        await page.goto(`${prefix}breakout`);

        await expectColumnAndBleed(
          page,
          page.locator('#live-breakout'),
          page.locator('#plain'),
          page.locator('#bleed'),
        );

        const [plain, note] = await Promise.all([
          rect(page.locator('#plain')),
          rect(page.locator('#note')),
        ]);

        expect(note.left).toBeCloseTo(plain.right, 0);
        expect(Math.abs(note.top - plain.top)).toBeLessThan(2);
      });

      test('has no horizontal overflow at a 320 px viewport', async ({
        page,
      }) => {
        await page.setViewportSize({ width: 320, height: 640 });
        await page.goto(`${prefix}breakout`);
        await expectBreakoutStyled(page, page.locator('#live-breakout'));

        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(320);
      });

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}breakout`);

        expect(await axeViolations()).toEqual([]);
      });
    });
  });
}
