import { expectItemSheetsApplied } from '@ngx-yeti/testing/playwright';
import { type Locator, type Page } from '@playwright/test';
import { expect, isProduction, routeKinds, test } from './support/fixtures';
import { removeDehydratedHosts } from './support/hosts';
import { nextFrames, waitForHydration } from './support/hydration';
import { describeStandardRouteCases } from './support/standard-cases';
import {
  delayCss,
  expectStyledFrames,
  itemLinks,
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
  await expectItemSheetsApplied(page, ['center']);
  await expect(centers.first()).toHaveCSS('box-sizing', 'content-box');

  const probeMax = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.maxInlineSize = 'var(--yeti-width-xs)';
    document.body.append(probe);
    const value = getComputedStyle(probe).maxInlineSize;
    probe.remove();

    return value;
  });

  // A client `@defer` block enters the DOM with the static `class="center"`
  // and gets its bound `data-max` in Angular's next tick, so Yeti's unset
  // maximum (`xl`) applies until then.
  for (const center of await centers.all()) {
    await expect(center).toHaveCSS('max-inline-size', probeMax);
  }

  const columns = await centers.evaluateAll((elements) =>
    elements.map((element) => {
      const outer = element.parentElement?.getBoundingClientRect();
      const inner = element.getBoundingClientRect();

      return {
        start: inner.left - (outer?.left ?? NaN),
        end: (outer?.right ?? NaN) - inner.right,
      };
    }),
  );

  expect(columns.length, 'the centers are rendered').toBeGreaterThan(0);

  for (const { start, end } of columns) {
    expect(start, 'the column is narrower than its container').toBeGreaterThan(
      50,
    );
    expect(Math.abs(start - end)).toBeLessThanOrEqual(1);
  }
}

const showClientStack = 'Show the client-only stack of centers';

/**
 * Waits until the center and box sheets have applied, so the 320 px reads
 * see the documented forms at their real widths.
 */
async function documentedFormsStyled(page: Page): Promise<void> {
  await expectItemSheetsApplied(page, ['center', 'box']);
  await expect(page.locator('#live-center')).toHaveCSS(
    'box-sizing',
    'content-box',
  );
  await expect(page.locator('#box-center')).toHaveAttribute('data-gap', 'lg');
  await expect(
    page.locator('#bordered-center > [data-border]'),
  ).toHaveAttribute('data-ngx-yeti-item-box', '');
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} center route`, () => {
    describeStandardRouteCases({
      item: 'center',
      prefix,
      liveHost: '#live-center',
      leaveLink: 'Leave for a page without centers',
      styled: { property: 'box-sizing', value: 'content-box' },
      links: ['stack', 'center'],
      afterReturn: async (page) => {
        await expectCentred(page, page.locator('#live-center'));
      },
    });

    test('has no horizontal overflow at a 320 px viewport', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}center`);
      await waitForHydration(page);
      await documentedFormsStyled(page);

      // A center alone, a center with `intrinsic`, a center with `yetiBox`,
      // section 8's bordered box inside a center, and a stack of centers
      // (ledger A11Y-9).
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
      browserName,
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

      expectStyledFrames(await gutter(), {
        styled: (value) => value !== '0px',
        label: `${browserName}, ${kind}, client-only centers`,
      });
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
        await documentedFormsStyled(page);

        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(320);
      });
    });
  });
}

// A negative control (center.md:288, ledger A11Y-9): Yeti's composition with
// the border on the center's element. Its overflow is recorded, not
// asserted, and the route stays out of the axe and no-mismatch checks.
for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} center anti-pattern route`, () => {
    test('is labelled as what not to write', async ({ page }) => {
      await page.goto(`${prefix}center-anti-pattern`);

      await expect(
        page.getByRole('heading', {
          name: 'What not to write: a border on the center',
        }),
      ).toBeVisible();

      const center = page.locator('#anti-pattern-center');

      await expect(center).toContainClass('center box');
      await expect(center).toHaveAttribute('data-border', '');
    });

    test("records the bordered center's scroll width at a 320 px viewport", async ({
      browserName,
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}center-anti-pattern`);
      await expectItemSheetsApplied(page, ['center', 'box']);
      await expect(page.locator('#anti-pattern-center')).toHaveCSS(
        'box-sizing',
        'content-box',
      );

      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );

      test.info().annotations.push({
        type: 'a11y-9-overflow',
        description: `${browserName}, ${isProduction ? 'production' : 'development'}, ${kind}: scrollWidth ${String(scrollWidth)} at a 320 px viewport`,
      });
    });
  });
}
