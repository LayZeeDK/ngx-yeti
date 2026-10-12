import {
  expectItemSheetsApplied,
  horizontalOverflow,
  usedLength,
} from '@ngx-yeti/testing/playwright';
import { type Locator, type Page } from '@playwright/test';
import { expect, routeKinds, test } from './support/fixtures';
import { removeDehydratedHosts } from './support/hosts';
import { nextFrames, waitForHydration } from './support/hydration';
import { describeStandardRouteCases } from './support/standard-cases';
import {
  delayCss,
  expectStyledFrames,
  itemLinks,
  productionFramesRecordedAs,
} from './support/style-probe';

/** The content-box inline size a container query measures, in px. */
async function contentWidth(container: Locator): Promise<number> {
  return container.evaluate((element) => {
    const style = getComputedStyle(element);
    const edges = [
      style.paddingLeft,
      style.paddingRight,
      style.borderLeftWidth,
      style.borderRightWidth,
    ].reduce((sum, value) => sum + Number.parseFloat(value), 0);

    return element.getBoundingClientRect().width - edges;
  });
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item: unknown) => typeof item === 'string')
  );
}

/**
 * Call before `goto`. The returned function lists, for every painted frame
 * in which an element matches `selector`, how many of them are displayed.
 * The markers' attributes are bound, and Angular may write them in a later
 * animation frame callback of the frame that inserts the block, so a read
 * at the start of the frame can see them unwritten. A ResizeObserver armed
 * in each frame reads after every animation frame callback and layout, just
 * before the paint.
 */
async function recordPaintedDisplayCounts(
  page: Page,
  selector: string,
): Promise<() => Promise<readonly string[]>> {
  const key = '__containerPaintedDisplayCounts';

  await page.addInitScript(
    ([name, displayedSelector]) => {
      const counts: string[] = [];

      Reflect.set(window, name, counts);

      const beforePaint = new ResizeObserver(() => {
        const elements = [...document.querySelectorAll(displayedSelector)];

        counts.push(
          elements.length === 0
            ? ''
            : String(
                elements.filter(
                  (element) => getComputedStyle(element).display !== 'none',
                ).length,
              ),
        );
      });

      const arm = (): void => {
        // A new observation reports once, in this frame's resize step.
        const root = document.documentElement;

        beforePaint.unobserve(root);
        beforePaint.observe(root);
        requestAnimationFrame(arm);
      };

      requestAnimationFrame(arm);
    },
    [key, selector] as const,
  );

  const read = async (): Promise<string[]> => {
    const value: unknown = await page.evaluate(
      (name): unknown => Reflect.get(window, name),
      key,
    );

    if (!isStringArray(value)) {
      throw new Error(`The probe recorded nothing under window.${key}`);
    }

    return value;
  };

  // Each read waits for one more frame, taken after the call, because
  // headless WebKit on Linux fires few frames a second.
  return async () => {
    const sampled = (await read()).length;

    await page.waitForFunction(
      ([name, count]) => {
        const counts: unknown = Reflect.get(window, name);

        return Array.isArray(counts) && counts.length > count;
      },
      [key, sampled] as const,
    );

    return (await read()).filter((value) => value !== '');
  };
}

const paragraphs = ['#narrow-text', '#sm-text', '#md-text', '#wide-text'];

/**
 * Expects Yeti's example to show `links` site links and, of its four
 * paragraphs, only the one at `shown`.
 */
async function expectExampleSet(
  page: Page,
  { links, shown }: { readonly links: number; readonly shown: number },
): Promise<void> {
  await expect(
    page.getByRole('navigation', { name: 'Site' }).getByRole('link'),
  ).toHaveCount(links);

  for (const [index, selector] of paragraphs.entries()) {
    if (index === shown) {
      await expect(page.locator(selector)).toBeVisible();
    } else {
      await expect(page.locator(selector)).toBeHidden();
    }
  }
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} container route`, () => {
    describeStandardRouteCases({
      item: 'container',
      prefix,
      liveHost: '#live-container',
      leaveLink: 'Leave for a page without containers',
      styled: { property: 'container-type', value: 'inline-size' },
    });

    test('has a container whose content box is wider than 1024 px at a 1100 px viewport', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1100, height: 800 });
      await page.goto(`${prefix}container`);
      await waitForHydration(page);
      await expectItemSheetsApplied(page, ['container']);

      const wide = page.locator('#wide-container');

      await expect(wide).toHaveAttribute('data-ngx-yeti-item-container', '');
      expect(await contentWidth(wide)).toBeGreaterThan(1024);
    });

    test('has no horizontal overflow at a 320 px viewport', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}container`);
      await waitForHydration(page);
      await expectItemSheetsApplied(page, ['container', 'box', 'cluster']);
      await expectExampleSet(page, { links: 2, shown: 0 });

      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });

    test('keeps the hydrate-never container a size container, and the shared host both links, after every live container and box leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}container`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live containers' })
        .click();
      await expect(
        page.locator('#wide-container, #live-container'),
      ).toHaveCount(0);
      await nextFrames(page);

      const never = page.locator('#never-container');
      const shared = page.locator('#never-shared');

      expect(await itemLinks(page, 'container')).toEqual(['container']);
      expect(await itemLinks(page, 'box')).toEqual(['box']);
      await expectItemSheetsApplied(page, ['container', 'box']);
      await expect(never).toHaveCSS('container-type', 'inline-size');
      expect(await contentWidth(never)).toBeGreaterThanOrEqual(
        await usedLength(page.locator('main'), 'var(--yeti-width-sm)'),
      );
      await expect(page.locator('#never-wide')).toBeVisible();
      await expect(page.locator('#never-narrow')).toBeHidden();
      await expect(shared).toHaveCSS('container-type', 'inline-size');
      await expect(shared).toHaveCSS('padding-top', /^(?!0px$)/);

      await removeDehydratedHosts(page, '#never-container, #never-shared');
      await expect.poll(() => itemLinks(page, 'container')).toEqual([]);
      await expect.poll(() => itemLinks(page, 'box')).toEqual([]);
    });

    // The server hosts keep the container link in <head>, so the client-only
    // container reuses it.
    test('renders a client-only container with no frame showing two paragraphs', async ({
      browserName,
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });

      const displayed = await recordPaintedDisplayCounts(
        page,
        '#client-container > p',
      );

      await delayCss(page);
      await page.goto(`${prefix}container`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only container' })
        .click();

      await expect(page.locator('#client-wide')).toBeVisible();
      await expectItemSheetsApplied(page, ['container']);

      for (const selector of ['#client-narrow', '#client-sm', '#client-md']) {
        await expect(page.locator(selector)).toBeHidden();
      }

      expectStyledFrames(await displayed(), {
        styled: (count) => count === '1',
        label: `${browserName}, ${kind}, client-only container, paragraphs displayed`,
        ...productionFramesRecordedAs(),
      });
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('shows the narrow set at a 320 px viewport', async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 640 });
        await page.goto(`${prefix}container`);
        await expectItemSheetsApplied(page, ['container', 'box', 'cluster']);
        await expect(page.locator('#live-container')).toHaveCSS(
          'container-type',
          'inline-size',
        );

        await expectExampleSet(page, { links: 2, shown: 0 });
      });

      test('shows the wide set at a 1280 px viewport', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(`${prefix}container`);
        await expectItemSheetsApplied(page, ['container', 'box', 'cluster']);
        await expect(page.locator('#live-container')).toHaveCSS(
          'container-type',
          'inline-size',
        );

        await expectExampleSet(page, { links: 7, shown: 3 });
      });
    });
  });
}
