import {
  expectItemSheetsApplied,
  horizontalOverflow,
  rect,
  type Box,
} from '@ngx-yeti/testing/playwright';
import { type Page } from '@playwright/test';
import { expect, isProduction, routeKinds, test } from './support/fixtures';
import {
  nextFrames,
  waitForHydration,
  watchHydration,
} from './support/hydration';
import { describeStandardRouteCases } from './support/standard-cases';
import {
  delayCss,
  expectStyledFrames,
  itemLinks,
  productionFramesRecordedAs,
  recordFrames,
  recordPaintedAttributes,
} from './support/style-probe';

/** What the JavaScript-off and JavaScript-on renders are compared on. */
interface TableLook {
  readonly stripe: string;
  readonly unstriped: string;
  readonly cellBorder: string;
  readonly centred: string;
  readonly ownAlign: string;
  readonly numeric: string;
}

async function tableLook(page: Page): Promise<TableLook> {
  await expectItemSheetsApplied(page, ['table']);
  await expect(page.locator('#plans')).toHaveCSS('table-layout', 'fixed');

  return page.evaluate(() => {
    const style = (selector: string): CSSStyleDeclaration => {
      const element = document.querySelector(selector);

      if (element === null) {
        throw new Error(`Nothing matches ${selector}`);
      }

      return getComputedStyle(element);
    };

    return {
      stripe: style('#summits tbody tr:nth-child(2)').backgroundColor,
      unstriped: style('#summits tbody tr:nth-child(1)').backgroundColor,
      cellBorder: style('#plans-centred').borderLeftWidth,
      centred: style('#plans-centred').textAlign,
      ownAlign: style('#plans-feature').textAlign,
      numeric: style('#summits tbody td[data-numeric]').textAlign,
    };
  });
}

/** Skips a Tab walk where Tab does not reach links (ngx-yeti-specs Departures). */
async function skipUnlessTabReachesLinks(
  page: Page,
  browserName: string,
): Promise<void> {
  if (browserName !== 'webkit') {
    return;
  }

  const platform = await page.evaluate(() => navigator.platform);

  test.skip(
    !platform.startsWith('Linux'),
    'WebKit moves focus on Tab to form controls only, not links, outside Linux',
  );
}

/** One Shift+Tab step: where the focused link and the pinned head sit. */
interface WalkStep {
  readonly link: number;
  readonly box: Box;
  readonly head: Box;
}

/**
 * Focuses the pinned table's last link, then presses Shift+Tab back through
 * every earlier one, and returns where each focused link and the head sat.
 */
async function walkBack(page: Page): Promise<WalkStep[]> {
  const head = page.locator('#pinned-head');
  const links = page.locator('#pinned tbody a');
  const count = await links.count();
  const steps: WalkStep[] = [];

  expect(count).toBeGreaterThan(1);

  await links.last().focus();

  for (let index = count - 2; index >= 0; index--) {
    const link = links.nth(index);

    await page.keyboard.press('Shift+Tab');
    await expect(link).toBeFocused();
    steps.push({
      link: index + 1,
      box: await rect(link),
      head: await rect(head),
    });
  }

  return steps;
}

/** Whether some of the link shows between the head's bottom and the viewport's. */
function partlyVisible(step: WalkStep, viewportHeight: number): boolean {
  return (
    step.box.bottom > Math.max(step.head.bottom, 0) &&
    step.box.top < viewportHeight
  );
}

const removedAttributes = ['border', 'align', 'nowrap'] as const;

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} table route`, () => {
    describeStandardRouteCases({
      item: 'table',
      prefix,
      liveHost: '#plans',
      leaveLink: 'Leave for a page without tables',
      styled: { property: 'table-layout', value: 'fixed' },
    });

    test('paints no frame with a written-back border, align, or nowrap', async ({
      browserName,
      page,
    }) => {
      const painted = await recordPaintedAttributes(
        page,
        '#plans, #plans *',
        removedAttributes,
      );

      await page.goto(`${prefix}table`);
      await waitForHydration(page);

      const entries = await painted();

      test.info().annotations.push({
        type: 'static-attribute-frames',
        description: `${browserName}, ${isProduction ? 'production' : 'development'}, ${kind}: ${String(entries.length)} painted border, align, or nowrap entries`,
      });
      expect(entries, 'no painted frame shows a removed attribute').toEqual([]);

      const plans = page.locator('#plans');

      await expect(plans).toHaveAttribute('data-border', '');
      await expect(plans).not.toHaveAttribute('border');
      await expect(page.locator('#plans-row')).toHaveAttribute(
        'data-align',
        'center',
      );
      await expect(page.locator('#plans-nowrap')).toHaveAttribute(
        'data-nowrap',
        '',
      );
      await expect(page.locator('#plans [align], #plans [nowrap]')).toHaveCount(
        0,
      );
    });

    test('keeps the hydrate-never table styled after every live table leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}table`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live tables' })
        .click();
      await expect(
        page.locator('[data-ngx-yeti-item-table]:not(#never-table)'),
      ).toHaveCount(0);
      await nextFrames(page);

      expect(
        await itemLinks(page),
        'the hydrate never host keeps the table link',
      ).toContain('table');
      await expectItemSheetsApplied(page, ['table']);
      await expect(page.locator('#never-table')).toHaveCSS(
        'table-layout',
        'fixed',
      );
    });

    // The server hosts keep the table link in <head>, so the client-only
    // table reuses it.
    test('renders a client-only table with 0 unstyled frames while the server hosts hold the table link', async ({
      browserName,
      page,
    }) => {
      // The cell rule comes with the static class; a rule on a bound attribute
      // would also count frames before Angular applies the binding.
      const top = await recordFrames(
        page,
        '#client-table td',
        'vertical-align',
      );

      await delayCss(page);
      await page.goto(`${prefix}table`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only table' })
        .click();

      const table = page.locator('#client-table');

      await expect(table).toBeVisible();
      await expect(table).toHaveCSS('table-layout', 'fixed');

      expectStyledFrames(await top(), {
        styled: (value) => value === 'top',
        label: `${browserName}, ${kind}, client-only table`,
        ...productionFramesRecordedAs(),
      });
    });

    test('scrolls the wide table in its scroller with no page overflow at a 320 px viewport, and Tab reaches the scroller', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}table`);
      await waitForHydration(page);
      await expectItemSheetsApplied(page, ['table', 'scroller']);

      const scroller = page.locator('#wide-scroller');

      await expect(scroller).toHaveCSS('display', 'flex');
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
      expect(
        await scroller.evaluate(
          (element) => element.scrollWidth - element.clientWidth,
        ),
        'the wide table scrolls inside its scroller',
      ).toBeGreaterThan(0);
      await expect(scroller.getByRole('table')).toHaveCSS('display', 'table');

      await page
        .getByRole('link', { name: 'Leave for a page without tables' })
        .focus();
      await page.keyboard.press('Tab');
      await expect(scroller).toBeFocused();
    });

    // Recorded, not asserted: forced colours is not an AA criterion and the
    // borders' survival is behaviour (table.md:415, ticket 50 decision 197).
    test('records the bordered table cell borders and header rule under forced colours', async ({
      browserName,
      page,
    }) => {
      test.skip(
        browserName === 'webkit',
        'WebKit forces no colours under emulation (ngx-yeti-specs Departures)',
      );

      await page.emulateMedia({ forcedColors: 'active' });
      await page.goto(`${prefix}table`);
      await waitForHydration(page);
      await expectItemSheetsApplied(page, ['table']);

      const plans = page.locator('#plans');

      await expect(plans).toHaveAttribute('data-border', '');

      const borders = await plans.evaluate((table) => {
        const edge = (
          selector: string,
          side: 'Left' | 'Bottom',
        ): { readonly drawn: boolean; readonly text: string } => {
          const element = table.querySelector(selector);

          if (element === null) {
            throw new Error(`Nothing matches ${selector}`);
          }

          const style = getComputedStyle(element);
          const width = style.getPropertyValue(
            `border-${side.toLowerCase()}-width`,
          );
          const lineStyle = style.getPropertyValue(
            `border-${side.toLowerCase()}-style`,
          );
          const color = style.getPropertyValue(
            `border-${side.toLowerCase()}-color`,
          );

          return {
            drawn:
              Number.parseFloat(width) > 0 &&
              lineStyle !== 'none' &&
              lineStyle !== 'hidden' &&
              !/^(?:transparent|rgba\(0, 0, 0, 0\))$/.test(color),
            text: `${lineStyle} ${width} ${color}`,
          };
        };

        return {
          cell: edge('#plans-centred', 'Left'),
          rule: edge('thead th', 'Bottom'),
        };
      });

      test.info().annotations.push({
        type: 'forced-colors-table-borders',
        description: `${browserName}, ${kind}: cell border ${borders.cell.text} (${borders.cell.drawn ? 'drawn' : 'vanished'}); header rule ${borders.rule.text} (${borders.rule.drawn ? 'drawn' : 'vanished'})`,
      });
      await test.info().attach(`forced-colors table, ${kind}`, {
        body: await plans.screenshot(),
        contentType: 'image/png',
      });
    });

    test.describe('with the pinned head at 320 x 640', () => {
      test.use({ viewport: { width: 320, height: 640 } });

      // WCAG 2.4.11, ledger row A11Y-22 with usage rule 10 followed: the
      // root's scroll padding is the sticky offset plus the head's height.
      test('keeps every link that Shift+Tab focuses at least partly visible below the pinned head, with the scroll padding set', async ({
        browserName,
        page,
      }) => {
        await page.goto(`${prefix}table`);
        await waitForHydration(page);
        await skipUnlessTabReachesLinks(page, browserName);
        await expectItemSheetsApplied(page, ['table']);

        const head = page.locator('#pinned-head');

        await expect(head).toHaveAttribute('data-sticky', '');
        await expect(head).toHaveCSS('position', 'sticky');

        await page.evaluate(
          (height) => {
            document.documentElement.style.setProperty(
              '--yeti-scroll-padding',
              `calc(var(--yeti-sticky-offset) + ${String(height)}px)`,
            );
          },
          (await rect(head)).height,
        );

        const steps = await walkBack(page);

        test.info().annotations.push({
          type: 'a11y-22-table-walk',
          description: `${browserName}, ${kind}, rule 10 followed: ${steps.map((step) => `link ${String(step.link)} ${String(Math.round(step.box.top))} to ${String(Math.round(step.box.bottom))} px, head bottom ${String(Math.round(step.head.bottom))} px`).join('; ')}`,
        });

        for (const step of steps) {
          expect(
            partlyVisible(step, 640),
            `link ${String(step.link)} (${String(step.box.top)} to ${String(step.box.bottom)}) is hidden by the pinned head (bottom ${String(step.head.bottom)})`,
          ).toBe(true);
        }
      });

      // Recorded, not asserted: the walk with Yeti's default scroll padding
      // is the evidence for ledger row A11Y-22 (table.md:416).
      test('records the same walk with the default scroll padding', async ({
        browserName,
        page,
      }) => {
        await page.goto(`${prefix}table`);
        await waitForHydration(page);
        await skipUnlessTabReachesLinks(page, browserName);
        await expectItemSheetsApplied(page, ['table']);
        await expect(page.locator('#pinned-head')).toHaveCSS(
          'position',
          'sticky',
        );

        const steps = await walkBack(page);
        const hidden = steps.filter((step) => !partlyVisible(step, 640));

        expect(steps.length, 'the walk focused every earlier link').toBe(
          (await page.locator('#pinned tbody a').count()) - 1,
        );

        test.info().annotations.push({
          type: 'a11y-22-table-default-padding',
          description: `${browserName}, ${kind}: ${String(hidden.length)} of ${String(steps.length)} focused links fully hidden by the pinned head${hidden.length === 0 ? '' : ` (links ${hidden.map((step) => String(step.link)).join(', ')})`}`,
        });
      });
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the tables with their attributes and markers and no removed attribute', async ({
        page,
      }) => {
        await page.goto(`${prefix}table`);

        const plans = page.locator('#plans');

        await expect(page.locator('#summits')).toHaveAttribute(
          'data-striped',
          '',
        );
        await expect(page.locator('#summits')).toHaveAttribute(
          'data-hover',
          '',
        );
        await expect(plans).toHaveAttribute('data-fixed', '');
        await expect(plans).toHaveAttribute('data-border', '');
        await expect(plans).not.toHaveAttribute('border');
        await expect(page.locator('#plans-row')).toHaveAttribute(
          'data-align',
          'center',
        );
        await expect(page.locator('#plans-nowrap')).toHaveAttribute(
          'data-nowrap',
          '',
        );
        await expect(
          page.locator('#plans [align], #plans [nowrap]'),
        ).toHaveCount(0);
        await expect(page.locator('#summits [data-numeric]')).toHaveCount(4);
        await expect(page.locator('#pinned-head')).toHaveAttribute(
          'data-sticky',
          '',
        );
        await expect(
          page.locator('[data-ngx-yeti-item-table]:not(table)'),
        ).toHaveCount(0);
      });

      test('stripes, borders, and aligns the tables as with JavaScript on', async ({
        baseURL,
        browser,
        page,
      }) => {
        await page.goto(`${prefix}table`);

        const off = await tableLook(page);

        expect(off.stripe, 'the even row is striped').not.toBe(off.unstriped);
        expect(off.cellBorder).not.toBe('0px');
        expect(off.centred).toBe('center');
        expect(off.ownAlign).toBe('start');
        expect(off.numeric).toBe('end');

        if (baseURL === undefined) {
          throw new Error('The Fixture app has no base URL');
        }

        // newContext takes the test's use options, so JavaScript is turned
        // back on here.
        const context = await browser.newContext({
          baseURL,
          javaScriptEnabled: true,
        });

        try {
          const live = await context.newPage();

          await live.goto(`${prefix}table`);
          await waitForHydration(live);

          expect(await tableLook(live)).toEqual(off);
        } finally {
          await context.close();
        }
      });

      test('tints the hovered row', async ({ page }) => {
        await page.goto(`${prefix}table`);
        await expectItemSheetsApplied(page, ['table']);
        await expect(page.locator('#plans')).toHaveCSS('table-layout', 'fixed');

        const row = page.locator('#summits tbody tr').first();
        const resting = await row.evaluate(
          (element) => getComputedStyle(element).backgroundColor,
        );

        await row.hover();

        await expect
          .poll(() =>
            row.evaluate(
              (element) => getComputedStyle(element).backgroundColor,
            ),
          )
          .not.toBe(resting);
      });
    });
  });

  test.describe(`the ${kind} table-numeric route`, () => {
    test('marks the figures and loads no table file', async ({
      axeViolations,
      page,
    }) => {
      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}table-numeric`);
      await waitForHydration(page);

      if (!isProduction) {
        await expectCleanHydration();
      }

      const figures = page.locator('[data-numeric]');

      await expect(figures).toHaveCount(2);
      await expect(figures.first()).toHaveCSS(
        'font-variant-numeric',
        'tabular-nums',
      );
      expect(await itemLinks(page, 'table')).toEqual([]);
      expect(
        await page.evaluate(
          () =>
            [...document.styleSheets].filter((sheet) =>
              (sheet.href ?? '').includes('/table/table.css'),
            ).length,
        ),
        'no table.css is applied',
      ).toBe(0);
      expect(await axeViolations()).toEqual([]);
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the figures with no table file', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}table-numeric`);

        await expect(page.locator('[data-numeric]')).toHaveCount(2);
        expect(await itemLinks(page, 'table')).toEqual([]);
        expect(await axeViolations()).toEqual([]);
      });
    });
  });

  // A negative control (table.md:411, usage rule 1): a table written without
  // a tbody. Its hydration error is recorded, not asserted, and the route
  // stays out of the axe and no-mismatch checks.
  test.describe(`the ${kind} table-without-tbody route`, () => {
    test('is labelled as what not to write and records its hydration error', async ({
      browserName,
      page,
    }) => {
      const messages: string[] = [];

      // Firefox's console text leaves out an Error argument's message, so
      // each argument's message is read as well.
      page.on('console', (message) => {
        void Promise.all(
          message
            .args()
            .map((arg) =>
              arg
                .evaluate((value) =>
                  value instanceof Error ? value.message : '',
                )
                .catch(() => ''),
            ),
        ).then((parts) => {
          messages.push([message.text(), ...parts].join(' '));
        });
      });
      page.on('pageerror', (error) => {
        messages.push(error.message);
      });

      await page.goto(`${prefix}table-without-tbody`);

      await expect(
        page.getByRole('heading', {
          name: 'What not to write: a table without a tbody',
        }),
      ).toBeVisible();
      await expect(page.locator('#without-tbody')).toHaveClass('table');
      const hydrationErrors = (): string[] =>
        messages.filter((text) => /NG05\d\d/.test(text));

      // A bounded wait of up to 60 frame pairs, not an assertion;
      // the count is recorded whatever it is.
      for (let pair = 0; pair < 60 && hydrationErrors().length === 0; pair++) {
        await nextFrames(page);
      }

      const recorded = hydrationErrors();

      test.info().annotations.push({
        type: 'table-without-tbody-hydration',
        description: `${browserName}, ${isProduction ? 'production' : 'development'}, ${kind}: ${String(recorded.length)} hydration error(s)${recorded.length === 0 ? '' : `: ${recorded.map((text) => text.split('\n')[0] ?? '').join(' | ')}`}`,
      });
    });
  });
}
