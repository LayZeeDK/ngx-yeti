import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { workspaceRoot } from '@nx/devkit';
import { type Locator, type Page } from '@playwright/test';
import {
  expect,
  expectOnlyClientPreloads,
  isProduction,
  routeKinds,
  test,
} from './support/fixtures';
import { removeDehydratedHosts } from './support/hosts';
import {
  nextFrames,
  waitForHydration,
  watchHydration,
} from './support/hydration';
import { holdBackMainBundle } from './support/main-bundle';
import {
  delayCss,
  itemLinks,
  itemSheetsLoaded,
  recordFrames,
  recordHostAttributes,
  recordStyleMutations,
} from './support/style-probe';

const yetiPin = readFileSync(
  join(workspaceRoot, 'vendor/yeti/COMMIT'),
  'utf8',
).trim();
const spinnerHref = `yeti-css/components/spinner/spinner.css?v=${yetiPin}`;

const liveSpinners = '#loading-spinner, #search-spinner, #placeholder-spinner';

/** Upstream bug O2: read styles only once the spinner's sheet has applied. */
async function expectSpinnerStyled(page: Page, ring: Locator): Promise<void> {
  await expect
    .poll(() => itemSheetsLoaded(page, ['spinner']), {
      message: 'the spinner stylesheet is loaded',
    })
    .toBe(true);
  await expect(ring).toHaveCSS('display', 'inline-block');
  await expect(ring).toHaveCSS('animation-name', 'yeti-spin');
}

/** The ring's box, rounded to whole px, with its turn paused at the start. */
async function ringSize(ring: Locator): Promise<string> {
  return ring.evaluate((element) => {
    for (const animation of element.getAnimations()) {
      animation.pause();
      animation.currentTime = 0;
    }

    const { width, height } = element.getBoundingClientRect();

    return `${String(Math.round(width))}x${String(Math.round(height))}`;
  });
}

/** Whether one of the ring's animations is running. */
async function turning(ring: Locator): Promise<boolean> {
  return ring.evaluate((element) =>
    element.getAnimations().some(({ playState }) => playState === 'running'),
  );
}

/**
 * The ring's turn: its animation's `currentTime` and the page clock, both in
 * ms, and whether the element carries the marker a test set on it.
 */
async function turnReading(
  ring: Locator,
): Promise<{ currentTime: number; now: number; marked: boolean }> {
  return ring.evaluate((element) => {
    const [animation] = element.getAnimations();
    const time = Number(animation?.currentTime ?? Number.NaN);

    return {
      currentTime: time,
      now: performance.now(),
      marked: Reflect.get(element, '__ngxYetiMarked') === true,
    };
  });
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} spinner route`, () => {
    test('hydrates with 0 skipped components and no NG05xx message', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}spinner`);

      await expect(
        page.getByRole('status', { name: 'Loading', exact: true }),
      ).toBeVisible();
      await expectCleanHydration();
    });

    test("changes no spinner attribute at hydration and adopts the server's spinner link", async ({
      baseURL,
      page,
    }) => {
      const styleMutations = await recordStyleMutations(page);
      const hostAttributes = await recordHostAttributes(page, '[yetispinner]');

      await page.goto(`${prefix}spinner`);
      await waitForHydration(page);

      expectOnlyClientPreloads(await styleMutations());
      expect(
        await hostAttributes(),
        'hydration changes no attribute on the spinner hosts',
      ).toEqual([]);
      expect(await itemLinks(page)).toContain('spinner');

      const link = page.locator('head link[data-ngx-yeti-styles="spinner"]');

      await expect(link).toHaveAttribute('rel', 'stylesheet');
      await expect(link).toHaveAttribute('href', spinnerHref);
      expect(
        await link.evaluate((element) =>
          element instanceof HTMLLinkElement ? element.href : '',
        ),
        'the href resolves against <base href="/sub/">',
      ).toBe(new URL(spinnerHref, baseURL).href);
      await expect(link).toHaveAttribute('data-beasties-skip', '');

      const search = page.locator('#search-spinner');

      await expect(search).toHaveAttribute('data-size', 'lg');
      await expect(search).toHaveAttribute('data-variant', 'neutral');
      await expect(search).toHaveAttribute('size', 'lg');
    });

    test('keeps the server-rendered ring turning through hydration without a restart', async ({
      page,
    }) => {
      const release = await holdBackMainBundle(page);

      await page.goto(`${prefix}spinner`, { waitUntil: 'commit' });

      const ring = page.locator('#loading-spinner');

      await ring.waitFor({ state: 'attached' });
      await expectSpinnerStyled(page, ring);
      await expect
        .poll(async () => (await turnReading(ring)).currentTime, {
          message: 'the server-rendered ring turns before hydration',
        })
        .toBeGreaterThan(0);
      await ring.evaluate((element) => {
        Reflect.set(element, '__ngxYetiMarked', true);
      });

      const before = await turnReading(ring);

      release();
      await waitForHydration(page);

      const after = await turnReading(ring);

      expect(after.marked, 'hydration claims the server element').toBe(true);
      expect(
        after.currentTime - before.currentTime,
        "the ring's currentTime keeps growing with the page clock",
      ).toBeGreaterThanOrEqual(after.now - before.now - 50);
      expect(await turning(ring)).toBe(true);
    });

    test('keeps the link and the size of the hydrate-never spinner after the live spinners leave', async ({
      page,
    }) => {
      await page.goto(`${prefix}spinner`);
      await waitForHydration(page);

      const never = page.locator('#never-spinner');

      await expectSpinnerStyled(page, never);
      const size = await ringSize(never);

      await page
        .getByRole('button', { name: 'Remove the live spinners' })
        .click();
      await expect(page.locator(liveSpinners)).toHaveCount(0);
      await nextFrames(page);

      await expect(never).toHaveAttribute('data-ngx-yeti-item-spinner', '');
      expect(
        await itemLinks(page),
        'the hydrate never host keeps the link',
      ).toContain('spinner');
      await expectSpinnerStyled(page, never);
      expect(await ringSize(never)).toBe(size);
    });

    // The server hosts keep the spinner link in <head>, so the client-only
    // spinner reuses it.
    test('renders a client-only spinner with 0 unstyled frames while the server hosts hold the spinner link', async ({
      page,
    }) => {
      const display = await recordFrames(page, '#client-spinner', 'display');

      await delayCss(page);
      await page.goto(`${prefix}spinner`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only spinner' })
        .click();

      const ring = page.locator('#client-spinner');

      await expectSpinnerStyled(page, ring);
      expect(await itemLinks(page)).toContain('spinner');

      const frames = await display();

      expect(
        frames.length,
        'the client-only spinner was sampled',
      ).toBeGreaterThan(0);
      expect(
        frames.filter((value) => value !== 'inline-block'),
        'no frame shows the client-only spinner without Yeti',
      ).toEqual([]);
    });

    test("records the client-only spinner's frames after every spinner host has left", async ({
      page,
    }) => {
      const display = await recordFrames(page, '#client-spinner', 'display');

      await page.goto(`${prefix}spinner`);
      await waitForHydration(page);
      await page
        .getByRole('button', { name: 'Remove the live spinners' })
        .click();
      await removeDehydratedHosts(page, '#never-spinner');
      await expect(page.locator('[data-ngx-yeti-item-spinner]')).toHaveCount(0);
      await expect.poll(() => itemLinks(page)).toEqual([]);

      await delayCss(page);
      await page
        .getByRole('button', { name: 'Show the client-only spinner' })
        .click();

      await expectSpinnerStyled(page, page.locator('#client-spinner'));

      const frames = await display();

      expect(
        frames.length,
        'the client-only spinner was sampled',
      ).toBeGreaterThan(0);
      // Routing turns the HTTP cache off, so the re-inserted link refetches:
      // recorded, not asserted, as on the card route.
      test.info().annotations.push({
        type: 'frames',
        description: `${String(frames.filter((value) => value !== 'inline-block').length)} of ${String(frames.length)} frames without the spinner file (re-inserted)`,
      });
    });

    test('removes the spinner link on leaving the route and re-inserts it on returning', async ({
      page,
    }) => {
      await page.goto(`${prefix}spinner`);
      await waitForHydration(page);

      expect(await itemLinks(page)).toContain('spinner');

      await page
        .getByRole('link', { name: 'Leave for the replay page' })
        .click();
      await expect(page).toHaveURL(/\/replay$/);
      await expect(page.locator('[data-ngx-yeti-item-spinner]')).toHaveCount(0);
      await expect.poll(() => itemLinks(page)).not.toContain('spinner');

      await page.goBack();
      await expect(page.locator('#loading-spinner')).toBeVisible();
      await expect.poll(() => itemLinks(page)).toContain('spinner');
    });

    test('passes axe with JavaScript on', async ({ axeViolations, page }) => {
      await page.goto(`${prefix}spinner`);
      await waitForHydration(page);

      expect(await axeViolations()).toEqual([]);
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves styled, turning, named spinners with their visible text', async ({
        page,
      }) => {
        await page.goto(`${prefix}spinner`);

        const ring = page.getByRole('status', {
          name: 'Loading',
          exact: true,
        });

        await expect(ring).toHaveClass('spinner');
        await expect(ring).toHaveAttribute('data-ngx-yeti-item-spinner', '');
        await expect(ring).not.toHaveAttribute('data-variant');
        await expect(ring).not.toHaveAttribute('data-size');
        await expect(page.getByText('Loading the latest posts')).toBeVisible();
        await expectSpinnerStyled(page, ring);
        expect(await turning(ring)).toBe(true);
        await expect(
          page.getByRole('status', { name: 'Loading comments' }),
        ).toBeVisible();
        expect(await itemLinks(page)).toContain('spinner');
      });

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}spinner`);

        expect(await axeViolations()).toEqual([]);
      });
    });
  });
}
