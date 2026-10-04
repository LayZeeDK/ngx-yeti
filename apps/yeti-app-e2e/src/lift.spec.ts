import { type Locator, type Page } from '@playwright/test';
import { expect, isProduction, test } from './support/fixtures';
import {
  nextFrames,
  waitForHydration,
  watchHydration,
} from './support/hydration';
import {
  itemLinks,
  recordFrames,
  recordStyleMutations,
} from './support/style-probe';

const routeKinds = [
  { kind: 'prerendered', prefix: '' },
  { kind: 'server-rendered', prefix: 'server/' },
] as const;

/** Yeti's `.lift` transition list; an element without Yeti computes `all`. */
const unstyledTransition = 'all';

/**
 * Call before `goto`: lists each attribute of a card, lift, or card link host
 * whose value differs from the server's. Hydration rewrites attributes with
 * the value they already have (measured), and event replay removes
 * `RouterLink`'s `jsaction` marker; neither is a change of the package's.
 */
async function recordHostAttributes(
  page: Page,
): Promise<() => Promise<unknown>> {
  await page.addInitScript(() => {
    const changes: string[] = [];

    Reflect.set(window, '__liftHostAttributes', changes);
    new MutationObserver((mutations) => {
      for (const { target, attributeName, oldValue } of mutations) {
        if (
          target instanceof Element &&
          target.matches('[yeticard], [yetilift], [yeticardlink]') &&
          attributeName !== null &&
          attributeName !== 'jsaction' &&
          target.getAttribute(attributeName) !== oldValue
        ) {
          changes.push(
            `${target.id || target.localName} ${attributeName}: ${String(oldValue)} -> ${String(target.getAttribute(attributeName))}`,
          );
        }
      }
    }).observe(document, {
      attributes: true,
      attributeOldValue: true,
      subtree: true,
    });
  });

  return () =>
    page.evaluate((): unknown => Reflect.get(window, '__liftHostAttributes'));
}

/** Upstream bug O2: read geometry only once the lift's sheet has applied. */
async function expectLiftSheetApplied(card: Locator): Promise<void> {
  await expect(card).not.toHaveCSS('transition-property', unstyledTransition);
}

/** Hovers the card with the real pointer and expects its top to rise. */
async function expectHoverLifts(page: Page, card: Locator): Promise<void> {
  await expectLiftSheetApplied(card);

  const before = await card.boundingBox();

  if (before === null) {
    throw new Error('The card is not rendered');
  }

  // Away from the card first, so the hover starts from rest.
  await page.mouse.move(0, 0);
  await card.hover();

  await expect
    .poll(async () => (await card.boundingBox())?.y, {
      message: "the hovered card's top decreases",
    })
    .toBeLessThan(before.y);
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} lift route`, () => {
    test('hydrates with 0 skipped components and no NG05xx message', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}lift`);

      await expect(
        page.getByRole('link', { name: 'A card that rises' }),
      ).toBeVisible();
      await expectCleanHydration();
    });

    test("adopts the server's links and changes no host attribute at hydration", async ({
      page,
    }) => {
      const styleMutations = await recordStyleMutations(page);
      const hostAttributes = await recordHostAttributes(page);

      await page.goto(`${prefix}lift`);
      await waitForHydration(page);

      expect(
        await styleMutations(),
        'no link or style element is added or removed after DOMContentLoaded',
      ).toEqual([]);
      expect(
        await hostAttributes(),
        'hydration changes no attribute on the hosts',
      ).toEqual([]);
      expect(await itemLinks(page)).toEqual(['card', 'lift']);

      for (const item of ['card', 'lift']) {
        const link = page.locator(`head link[data-ngx-yeti-styles="${item}"]`);

        await expect(link).toHaveAttribute('data-ngx-yeti-app', /.+/);
        await expect(link).toHaveAttribute('data-beasties-skip', '');
      }
    });

    test('keeps the lift link for the hydrate-never card, which still lifts, after the live cards leave', async ({
      page,
    }) => {
      await page.goto(`${prefix}lift`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live lifted cards' })
        .click();
      await expect(page.locator('#rise-card, #scale-card')).toHaveCount(0);
      await nextFrames(page);

      const card = page.locator('#never-card');

      await expect(card).toHaveAttribute('data-ngx-yeti-item-lift', '');
      expect(await itemLinks(page)).toEqual(['card', 'lift']);
      await expectHoverLifts(page, card);
    });

    test('records the client-only lifted card without a lift preload', async ({
      page,
    }) => {
      const liftFrames = await recordFrames(
        page,
        '#client-card',
        'transition-property',
      );

      await page.goto(`${prefix}lift`);
      await waitForHydration(page);

      // Empty <head> of the lift link, so the client inserts it again. Angular
      // keeps a dehydrated block's server DOM even after its parent view is
      // destroyed (measured with an `@if` around the `hydrate never` block),
      // so no control can remove that card; the test does.
      await page
        .getByRole('button', { name: 'Remove the live lifted cards' })
        .click();
      await page.locator('#never-card').evaluate((card) => {
        card.remove();
      });
      await expect.poll(() => itemLinks(page)).toEqual([]);

      // Playwright's routing also turns the HTTP cache off.
      await page.route('**/yeti-css/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        await route.continue();
      });
      await page
        .getByRole('button', { name: 'Show the client-only lifted card' })
        .click();

      const card = page.locator('#client-card');

      await expectLiftSheetApplied(card);
      expect(await itemLinks(page)).toEqual(['card', 'lift']);

      const frames = (await liftFrames()).filter((value) => value !== '');

      expect(frames.length, 'the client-only card was sampled').toBeGreaterThan(
        0,
      );
      test.info().annotations.push({
        type: 'frames',
        description: `${String(frames.filter((value) => value === unstyledTransition).length)} of ${String(frames.length)} frames without the lift file (no preload)`,
      });
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves lifted cards with their item links', async ({ page }) => {
        await page.goto(`${prefix}lift`);

        await expect(page.locator('#rise-card')).toContainClass('card lift');
        await expect(page.locator('#rise-card')).not.toHaveAttribute(
          'data-lift',
        );
        await expect(page.locator('#scale-card')).toHaveAttribute(
          'data-lift',
          'scale',
        );
        expect(await itemLinks(page)).toEqual(['card', 'lift']);
      });

      test('lifts a hovered card', async ({ page }) => {
        await page.goto(`${prefix}lift`);

        await expectHoverLifts(page, page.locator('#rise-card'));
      });

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}lift`);

        expect(await axeViolations()).toEqual([]);
      });
    });
  });
}
