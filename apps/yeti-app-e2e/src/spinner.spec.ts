import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expectItemSheetsApplied } from '@ngx-yeti/testing/playwright';
import { workspaceRoot } from '@nx/devkit';
import { type Locator } from '@playwright/test';
import {
  expect,
  expectOnlyClientPreloads,
  routeKinds,
  test,
} from './support/fixtures';
import { removeDehydratedHosts } from './support/hosts';
import { nextFrames, waitForHydration } from './support/hydration';
import { holdBackMainBundle } from './support/main-bundle';
import { describeStandardRouteCases } from './support/standard-cases';
import {
  delayCss,
  expectStyledFrames,
  itemLinks,
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
    describeStandardRouteCases({
      item: 'spinner',
      prefix,
      liveHost: '#loading-spinner',
      leaveLink: 'Leave for the replay page',
      styled: { property: 'display', value: 'inline-block' },
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
      await expectItemSheetsApplied(page, ['spinner']);
      await expect(ring).toHaveCSS('display', 'inline-block');
      await expect(ring).toHaveCSS('animation-name', 'yeti-spin');
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

      await expectItemSheetsApplied(page, ['spinner']);
      await expect(never).toHaveCSS('display', 'inline-block');
      await expect(never).toHaveCSS('animation-name', 'yeti-spin');
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
      await expectItemSheetsApplied(page, ['spinner']);
      await expect(never).toHaveCSS('display', 'inline-block');
      await expect(never).toHaveCSS('animation-name', 'yeti-spin');
      expect(await ringSize(never)).toBe(size);
    });

    // The server hosts keep the spinner link in <head>, so the client-only
    // spinner reuses it.
    test('renders a client-only spinner with 0 unstyled frames while the server hosts hold the spinner link', async ({
      browserName,
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

      await expectItemSheetsApplied(page, ['spinner']);
      await expect(ring).toHaveCSS('display', 'inline-block');
      await expect(ring).toHaveCSS('animation-name', 'yeti-spin');
      expect(await itemLinks(page)).toContain('spinner');

      expectStyledFrames(await display(), {
        styled: (value) => value === 'inline-block',
        label: `${browserName}, ${kind}, client-only spinner`,
      });
    });

    test("records the client-only spinner's frames after every spinner host has left", async ({
      browserName,
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

      await expectItemSheetsApplied(page, ['spinner']);
      await expect(page.locator('#client-spinner')).toHaveCSS(
        'display',
        'inline-block',
      );
      await expect(page.locator('#client-spinner')).toHaveCSS(
        'animation-name',
        'yeti-spin',
      );

      // Routing turns the HTTP cache off, so the re-inserted link refetches:
      // recorded, not asserted, as on the card route.
      expectStyledFrames(await display(), {
        styled: (value) => value === 'inline-block',
        label: `${browserName}, ${kind}, client-only spinner after every host left`,
        recordedAs: 'reinserted-frames',
      });
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
        await expectItemSheetsApplied(page, ['spinner']);
        await expect(ring).toHaveCSS('display', 'inline-block');
        await expect(ring).toHaveCSS('animation-name', 'yeti-spin');
        expect(await turning(ring)).toBe(true);
        await expect(
          page.getByRole('status', { name: 'Loading comments' }),
        ).toBeVisible();
        expect(await itemLinks(page)).toContain('spinner');
      });
    });
  });
}
