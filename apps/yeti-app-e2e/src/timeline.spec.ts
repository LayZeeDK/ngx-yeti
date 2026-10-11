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

interface Layout {
  /** Each entry's box and its dot's box, rounded to the pixel. */
  readonly entries: readonly {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly dotLeft: number;
    readonly dotTop: number;
  }[];
  /** The rail's centre from the list's left edge, or null when not drawn. */
  readonly rail: number | null;
}

/** Where the entries, their dots, and the rail of one timeline land. */
async function layout(list: Locator): Promise<Layout> {
  return list.evaluate((element) => {
    const rail = getComputedStyle(element, '::before');

    return {
      rail:
        rail.content === 'none'
          ? null
          : Math.round(parseFloat(rail.left) + parseFloat(rail.width) / 2),
      entries: [...element.children].map((entry) => {
        const box = entry.getBoundingClientRect();
        const dot = getComputedStyle(entry, '::before');

        return {
          left: Math.round(box.left),
          top: Math.round(box.top),
          width: Math.round(box.width),
          dotLeft:
            dot.content === 'none'
              ? NaN
              : Math.round(box.left + parseFloat(dot.left)),
          dotTop:
            dot.content === 'none'
              ? NaN
              : Math.round(box.top + parseFloat(dot.top)),
        };
      }),
    };
  });
}

/** Upstream bug O2: read geometry only once the timeline's sheet has applied. */
async function expectTimelineStyled(page: Page, list: Locator): Promise<void> {
  await expect
    .poll(() => itemSheetsLoaded(page, ['timeline']), {
      message: 'the timeline stylesheet is loaded',
    })
    .toBe(true);
  await expect(list).toHaveCSS('display', 'flex');
}

/** Every entry starts at the same edge, under a drawn rail. */
async function expectSingleSided(list: Locator): Promise<void> {
  const { entries, rail } = await layout(list);

  expect(rail, 'the rail is drawn').not.toBeNull();
  expect(entries.length).toBeGreaterThan(1);
  expect(new Set(entries.map(({ left }) => left)).size).toBe(1);
}

/** The timeline links, in document order; later items may add more. */
async function timelineLinks(page: Page): Promise<readonly string[]> {
  return (await itemLinks(page)).filter((item) => item === 'timeline');
}

const lists = ['#alternating', '#single', '#never-timeline'] as const;

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} timeline route`, () => {
    test('hydrates with 0 skipped components and no NG05xx message', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}timeline`);

      await expect(page.locator('#alternating')).toBeVisible();
      await expectCleanHydration();
    });

    test('alternates the wide example around a centred rail', async ({
      page,
    }) => {
      await page.goto(`${prefix}timeline`);
      await waitForHydration(page);

      const list = page.locator('#alternating');

      await expectTimelineStyled(page, list);

      const width = await list.evaluate(
        (element) => element.getBoundingClientRect().width,
      );
      const { entries, rail } = await layout(list);
      const [first, second] = entries;

      expect(width, 'the list is wider than 48rem').toBeGreaterThan(768);
      expect(rail).toBeCloseTo(width / 2, 0);
      expect(first?.left).not.toBe(second?.left);
    });

    test('has no horizontal overflow at a 320 px viewport and is single-sided there', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}timeline`);
      await waitForHydration(page);

      const list = page.locator('#alternating');

      await expectTimelineStyled(page, list);
      await expectSingleSided(list);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(320);
    });

    test('keeps the hydrate-never timeline styled after every live timeline leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}timeline`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live timelines' })
        .click();
      await expect(page.locator('#alternating, #single')).toHaveCount(0);
      await nextFrames(page);

      const list = page.locator('#never-timeline');

      await expect(list).toHaveAttribute('data-ngx-yeti-item-timeline', '');
      expect(
        await timelineLinks(page),
        'the hydrate never host keeps the timeline link',
      ).toEqual(['timeline']);
      await expectTimelineStyled(page, list);
      await expectSingleSided(list);
    });

    // The server hosts keep the timeline link in <head>, so the client-only
    // timeline reuses it.
    test('renders a client-only timeline with 0 unstyled frames while the server hosts hold the timeline link', async ({
      browserName,
      page,
    }) => {
      const display = await recordFrames(page, '#client-timeline', 'display');

      await delayCss(page);
      await page.goto(`${prefix}timeline`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only timeline' })
        .click();

      const list = page.locator('#client-timeline');

      await expect(list).toBeVisible();
      await expectTimelineStyled(page, list);
      await expectSingleSided(list);

      const frames = await display();
      const unstyled = frames.filter((value) => value !== 'flex');

      expect(
        frames.length,
        'the client-only timeline was sampled',
      ).toBeGreaterThan(0);

      if (isProduction) {
        test.info().annotations.push({
          type: 'a4-frames',
          description: `${browserName}, production, ${kind}: ${String(unstyled.length)} unstyled frames of ${String(frames.length)}`,
        });
      } else {
        expect(
          unstyled,
          'no frame shows the client-only timeline without Yeti',
        ).toEqual([]);
      }
    });

    test('removes the timeline link on leaving the route and re-inserts it on returning', async ({
      page,
    }) => {
      await page.goto(`${prefix}timeline`);
      await waitForHydration(page);

      expect(await itemLinks(page)).toContain('timeline');

      await page
        .getByRole('link', { name: 'Leave for a page without timelines' })
        .click();
      await expect(page).toHaveURL(/\/replay$/);
      await expect(page.locator('[data-ngx-yeti-item-timeline]')).toHaveCount(
        0,
      );
      await expect.poll(() => timelineLinks(page)).toEqual([]);

      await page.goBack();
      await expect(page.locator('#alternating')).toBeVisible();
      await expect.poll(() => timelineLinks(page)).toEqual(['timeline']);
      await expectTimelineStyled(page, page.locator('#alternating'));
    });

    test('lands the entries, dots, and rails with JavaScript off where they land with it on', async ({
      browser,
      page,
    }) => {
      await page.goto(`${prefix}timeline`);
      await waitForHydration(page);
      await expectTimelineStyled(page, page.locator('#alternating'));

      const withScript = await Promise.all(
        lists.map((selector) => layout(page.locator(selector))),
      );
      const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: page.viewportSize(),
      });

      try {
        const scriptless = await context.newPage();

        await scriptless.goto(page.url());
        await expectTimelineStyled(
          scriptless,
          scriptless.locator('#alternating'),
        );

        const withoutScript = await Promise.all(
          lists.map((selector) => layout(scriptless.locator(selector))),
        );

        expect(withoutScript).toEqual(withScript);

        for (const { entries, rail } of withoutScript) {
          expect(rail, 'the rail is drawn').not.toBeNull();
          expect(
            entries.filter(({ dotLeft }) => Number.isNaN(dotLeft)),
            'every entry has its dot',
          ).toEqual([]);
        }
      } finally {
        await context.close();
      }
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the timelines with their attributes, role, and item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}timeline`);

        const list = page.locator('#alternating');

        await expect(list).toHaveClass('timeline');
        await expect(list).toHaveAttribute('data-ngx-yeti-item-timeline', '');
        await expect(list).toHaveAttribute('data-alternate', '');
        await expect(list).not.toHaveAttribute('data-gap');
        await expect(list).toHaveAttribute('role', 'list');
        await expect(page.locator('#single')).toHaveAttribute('data-gap', 'md');
        await expect(page.locator('#single')).not.toHaveAttribute(
          'data-alternate',
        );
        expect(await timelineLinks(page)).toEqual(['timeline']);
      });

      test('has no horizontal overflow at a 320 px viewport and is single-sided there', async ({
        page,
      }) => {
        await page.setViewportSize({ width: 320, height: 640 });
        await page.goto(`${prefix}timeline`);

        const list = page.locator('#alternating');

        await expectTimelineStyled(page, list);
        await expectSingleSided(list);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(320);
      });

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}timeline`);

        expect(await axeViolations()).toEqual([]);
      });
    });
  });
}
