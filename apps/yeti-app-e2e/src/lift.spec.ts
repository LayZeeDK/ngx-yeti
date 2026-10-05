import {
  clientCardPreload,
  expect,
  isProduction,
  routeKinds,
  test,
} from './support/fixtures';
import { expectHoverLifts, removeEveryHost } from './support/hosts';
import {
  nextFrames,
  waitForHydration,
  watchHydration,
} from './support/hydration';
import {
  delayCss,
  itemLinks,
  recordFrames,
  recordHostAttributes,
  recordStyleMutations,
} from './support/style-probe';

/** Yeti's `.lift` transition list; an element without Yeti computes `all`. */
const unstyledTransition = 'all';

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
      const hostAttributes = await recordHostAttributes(
        page,
        '[yeticard], [yetilift], [yeticardlink]',
      );

      await page.goto(`${prefix}lift`);
      await waitForHydration(page);

      expect(
        await styleMutations(),
        'only the client card preload is added after parsing ends',
      ).toEqual([clientCardPreload]);
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

      // Empty <head> of the lift link, so the client inserts it again.
      await removeEveryHost(
        page,
        'Remove the live lifted cards',
        '#never-card',
      );
      await delayCss(page);
      await page
        .getByRole('button', { name: 'Show the client-only lifted card' })
        .click();

      const card = page.locator('#client-card');

      // Upstream bug O2: read geometry only once the lift's sheet has applied.
      await expect(card).not.toHaveCSS(
        'transition-property',
        unstyledTransition,
      );
      expect(await itemLinks(page)).toEqual(['card', 'lift']);

      const frames = await liftFrames();

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
