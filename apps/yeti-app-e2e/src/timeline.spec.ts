import { expectItemSheetsApplied, rect } from '@ngx-yeti/testing/playwright';
import { type Locator } from '@playwright/test';
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

/** Every entry starts at the same edge, under a drawn rail. */
async function expectSingleSided(list: Locator): Promise<void> {
  const { entries, rail } = await layout(list);

  expect(rail, 'the rail is drawn').not.toBeNull();
  expect(entries.length).toBeGreaterThan(1);
  expect(new Set(entries.map(({ left }) => left)).size).toBe(1);
}

const lists = ['#alternating', '#single', '#never-timeline'] as const;

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} timeline route`, () => {
    describeStandardRouteCases({
      item: 'timeline',
      prefix,
      liveHost: '#alternating',
      leaveLink: 'Leave for a page without timelines',
      styled: { property: 'display', value: 'flex' },
    });

    test('alternates the wide example around a centred rail', async ({
      page,
    }) => {
      await page.goto(`${prefix}timeline`);
      await waitForHydration(page);

      const list = page.locator('#alternating');

      await expectItemSheetsApplied(page, ['timeline']);
      await expect(list).toHaveCSS('display', 'flex');

      const { width } = await rect(list);
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

      await expectItemSheetsApplied(page, ['timeline']);
      await expect(list).toHaveCSS('display', 'flex');
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
        await itemLinks(page, 'timeline'),
        'the hydrate never host keeps the timeline link',
      ).toEqual(['timeline']);
      await expectItemSheetsApplied(page, ['timeline']);
      await expect(list).toHaveCSS('display', 'flex');
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
      await expectItemSheetsApplied(page, ['timeline']);
      await expect(list).toHaveCSS('display', 'flex');
      await expectSingleSided(list);

      expectStyledFrames(await display(), {
        styled: (value) => value === 'flex',
        label: `${browserName}, ${kind}, client-only timeline`,
        ...productionFramesRecordedAs(),
      });
    });

    test('lands the entries, dots, and rails with JavaScript off where they land with it on', async ({
      browser,
      page,
    }) => {
      await page.goto(`${prefix}timeline`);
      await waitForHydration(page);
      await expectItemSheetsApplied(page, ['timeline']);
      await expect(page.locator('#alternating')).toHaveCSS('display', 'flex');

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
        await expectItemSheetsApplied(scriptless, ['timeline']);
        await expect(scriptless.locator('#alternating')).toHaveCSS(
          'display',
          'flex',
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
        expect(await itemLinks(page, 'timeline')).toEqual(['timeline']);
      });

      test('has no horizontal overflow at a 320 px viewport and is single-sided there', async ({
        page,
      }) => {
        await page.setViewportSize({ width: 320, height: 640 });
        await page.goto(`${prefix}timeline`);

        const list = page.locator('#alternating');

        await expectItemSheetsApplied(page, ['timeline']);
        await expect(list).toHaveCSS('display', 'flex');
        await expectSingleSided(list);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(320);
      });
    });
  });
}
