import { expectItemSheetsApplied } from '@ngx-yeti/testing/playwright';
import { type Locator, type Page } from '@playwright/test';
import {
  expect,
  expectOnlyClientPreloads,
  isProduction,
  routeKinds,
  test,
} from './support/fixtures';
import { removeDehydratedHosts } from './support/hosts';
import { nextFrames, waitForHydration } from './support/hydration';
import { holdBackMainBundle } from './support/main-bundle';
import { describeStandardRouteCases } from './support/standard-cases';
import {
  itemLinks,
  recordHostAttributes,
  recordStyleMutations,
} from './support/style-probe';

interface Arrivals {
  /** Each `animationstart`, by the id of the element it started on. */
  readonly starts: readonly {
    readonly id: string;
    readonly name: string;
    readonly time: number;
  }[];
  /** When each `enter` item link added to the document finished loading. */
  readonly linkLoads: readonly number[];
  /** The first contentful paint, or null where the engine reports none. */
  readonly firstPaint: number | null;
}

function isArrivals(value: unknown): value is Arrivals {
  return (
    typeof value === 'object' &&
    value !== null &&
    'starts' in value &&
    Array.isArray(value.starts) &&
    'linkLoads' in value &&
    Array.isArray(value.linkLoads) &&
    'firstPaint' in value
  );
}

/**
 * Call before `goto`. The returned function reads every `animationstart`,
 * every load of an `enter` item link, and the first contentful paint, all on
 * the page's `performance.now()` clock.
 */
async function recordArrivals(page: Page): Promise<() => Promise<Arrivals>> {
  await page.addInitScript(() => {
    const starts: { id: string; name: string; time: number }[] = [];
    const linkLoads: number[] = [];

    Reflect.set(window, '__ngxYetiEnter', { starts, linkLoads });
    document.addEventListener(
      'animationstart',
      (event) => {
        if (event.target instanceof Element) {
          starts.push({
            id: event.target.id,
            name: event.animationName,
            time: event.timeStamp,
          });
        }
      },
      true,
    );
    new MutationObserver((mutations) => {
      for (const { addedNodes } of mutations) {
        for (const node of addedNodes) {
          if (
            node instanceof HTMLLinkElement &&
            node.dataset['ngxYetiStyles'] === 'enter'
          ) {
            node.addEventListener('load', () => {
              linkLoads.push(performance.now());
            });
          }
        }
      }
    }).observe(document, { childList: true, subtree: true });
  });

  return async () => {
    const value: unknown = await page.evaluate(() => {
      const record: unknown = Reflect.get(window, '__ngxYetiEnter');
      const [paint] = performance.getEntriesByName('first-contentful-paint');

      return typeof record === 'object' && record !== null
        ? { ...record, firstPaint: paint?.startTime ?? null }
        : null;
    });

    if (!isArrivals(value)) {
      throw new Error('The arrival probe recorded nothing');
    }

    return value;
  };
}

function startsOn(arrivals: Arrivals, id: string): number {
  return arrivals.starts.filter((start) => start.id === id).length;
}

/** The animation names started on `id`, in order. */
function namesOn(arrivals: Arrivals, id: string): string[] {
  return arrivals.starts.flatMap((start) =>
    start.id === id ? [start.name] : [],
  );
}

/** The named `once` hosts, each with its own arrival. */
const inViewRise = '#in-view-rise';
const belowSlide = '#below-slide';
const belowStagger = '#below-stagger';
const namedOnceHosts = [inViewRise, belowSlide, belowStagger] as const;

/** Expects a `once` host that has not arrived: still, visible, and opaque. */
async function expectWithheld(host: Locator): Promise<void> {
  await expect(host).toHaveAttribute('data-once', '');
  await expect(host).toHaveAttribute('data-enter');
  await expect(host).toBeVisible();
  await expect(host).toHaveCSS('opacity', '1');
  await expect(host).toHaveCSS('animation-name', 'none');
}

/**
 * Records, as an annotation, when the first `animationstart` on `id` fired
 * against when the last `enter` item link loaded (enter.md:272).
 */
function recordInsertion(
  arrivals: Arrivals,
  id: string,
  label: string,
  browserName: string,
): void {
  const start = arrivals.starts.find((entry) => entry.id === id)?.time;
  const load = arrivals.linkLoads.at(-1);

  test.info().annotations.push({
    type: 'enter-insertion',
    description: `${browserName}, ${isProduction ? 'production' : 'development'}, ${label}, without the enter preload: first animationstart at ${start === undefined ? 'none' : `${start.toFixed(1)} ms`}, enter link loaded at ${load === undefined ? 'no load recorded' : `${load.toFixed(1)} ms`}${start !== undefined && load !== undefined ? ` (${(start - load).toFixed(1)} ms after the load)` : ''}`,
  });
}

/** Removes every host on the route and waits for the enter link to leave. */
async function removeEveryEnterHost(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Remove the live arrivals' }).click();
  await removeDehydratedHosts(page, '#never-once, #viewport-once');
  await expect(page.locator('[data-ngx-yeti-item-enter]')).toHaveCount(0);
  await expect.poll(() => itemLinks(page)).not.toContain('enter');
}

/**
 * Expects a `once` host to have arrived: no `data-once`, and one start of
 * `keyframes` on the element that plays it, the host or, on a staggered host,
 * its child `target`, which ends opaque.
 */
async function expectArrived(
  host: Locator,
  arrivals: () => Promise<Arrivals>,
  keyframes: string,
  target: Locator = host,
): Promise<void> {
  await expect(target).toHaveAttribute('id', /.+/);

  const id = await target.evaluate((element) => element.id);

  await expect(host).not.toHaveAttribute('data-once');
  await expect
    .poll(async () => namesOn(await arrivals(), id))
    .toEqual([keyframes]);
  await expect(target).toHaveCSS('opacity', '1');
  await expect(target).toHaveCSS('animation-name', keyframes);
}

async function scrollToTop(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await nextFrames(page);
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} enter route`, () => {
    describeStandardRouteCases({
      item: 'enter',
      prefix,
      liveHost: '#plain',
      leaveLink: 'Leave for the replay page',
      styled: { property: 'animation-name', value: 'yeti-enter-fade' },
      arrivals: '#plain',
    });

    test("adopts the server's link and changes no host attribute at hydration", async ({
      page,
    }) => {
      const styleMutations = await recordStyleMutations(page);
      // The in-view sections arrive right after hydration, by design.
      const hostAttributes = await recordHostAttributes(
        page,
        `[yetienter]:not(#in-view-once, ${inViewRise})`,
      );

      await page.goto(`${prefix}enter`);
      await waitForHydration(page);

      expectOnlyClientPreloads(await styleMutations());
      expect(
        await hostAttributes(),
        'hydration changes no attribute on the hosts',
      ).toEqual([]);
      expect(await itemLinks(page)).toContain('enter');
      await expect(page.locator('#below-once')).toHaveAttribute(
        'data-once',
        '',
      );
    });

    // Nothing restores or removes a static data-once before or at hydration
    // (enter.md:269).
    test('keeps data-once on a below-the-fold section through hydration, then arrives once when scrolled to', async ({
      page,
    }) => {
      const arrivals = await recordArrivals(page);
      const release = await holdBackMainBundle(page);

      await page.goto(`${prefix}enter`, { waitUntil: 'commit' });

      const section = page.locator('#below-once');

      await section.waitFor({ state: 'attached' });
      await expectItemSheetsApplied(page, ['enter']);
      await expect(section).toHaveAttribute('data-once', '');
      await expect(section).toHaveCSS('animation-name', 'none');
      await expect(section).toHaveCSS('opacity', '1');

      release();
      await waitForHydration(page);
      await nextFrames(page);

      await expect(section).toHaveAttribute('data-once', '');
      expect(startsOn(await arrivals(), 'below-once')).toBe(0);

      await section.scrollIntoViewIfNeeded();

      await expectArrived(section, arrivals, 'yeti-enter-fade');

      await scrollToTop(page);
      await section.scrollIntoViewIfNeeded();
      await nextFrames(page);

      await expect(section).not.toHaveAttribute('data-once');
      expect(
        startsOn(await arrivals(), 'below-once'),
        'scrolling away and back replays nothing',
      ).toBe(1);
    });

    // Recorded, not asserted: a once element in view at hydration arrives
    // after it, like for like, and the spec asks only how long after first
    // paint (enter.md:270).
    test('records how long after first paint a section already in view arrives', async ({
      browserName,
      page,
    }) => {
      const arrivals = await recordArrivals(page);

      await page.goto(`${prefix}enter`);
      await waitForHydration(page);

      const section = page.locator('#in-view-once');

      await expect(section).not.toHaveAttribute('data-once');
      await expect
        .poll(async () => startsOn(await arrivals(), 'in-view-once'))
        .toBe(1);

      const { firstPaint, starts } = await arrivals();
      const start = starts.find((entry) => entry.id === 'in-view-once')?.time;

      test.info().annotations.push({
        type: 'in-view-arrival',
        description: `${browserName}, ${isProduction ? 'production' : 'development'}, ${kind}: arrival ${start === undefined || firstPaint === null ? 'not measured (no first contentful paint entry)' : `${(start - firstPaint).toFixed(1)} ms after first contentful paint`}`,
      });
    });

    test('arrives a once section an @if inserts, without the enter preload', async ({
      browserName,
      page,
    }) => {
      const arrivals = await recordArrivals(page);

      await page.goto(`${prefix}enter`);
      await waitForHydration(page);
      await removeEveryEnterHost(page);

      await page
        .getByRole('button', { name: 'Show the inserted section' })
        .click();
      await expect(page.locator('#if-once')).toBeVisible();

      await expectArrived(
        page.locator('#if-once'),
        arrivals,
        'yeti-enter-fade',
      );
      recordInsertion(await arrivals(), 'if-once', `${kind}, @if`, browserName);
    });

    test('arrives a once section a client-only @defer inserts, without the enter preload', async ({
      browserName,
      page,
    }) => {
      const arrivals = await recordArrivals(page);

      await page.goto(`${prefix}enter`);
      await waitForHydration(page);
      await removeEveryEnterHost(page);

      await page
        .getByRole('button', { name: 'Show the deferred section' })
        .click();
      await expect(page.locator('#deferred-once')).toBeVisible();

      await expectArrived(
        page.locator('#deferred-once'),
        arrivals,
        'yeti-enter-fade',
      );
      recordInsertion(
        await arrivals(),
        'deferred-once',
        `${kind}, client-only @defer`,
        browserName,
      );
    });

    test('arrives a once section a route change inserts, without the enter preload', async ({
      browserName,
      page,
    }) => {
      const arrivals = await recordArrivals(page);

      await page.goto(`${prefix}enter`);
      await waitForHydration(page);
      await page
        .getByRole('link', { name: 'Leave for the replay page' })
        .click();
      await expect(page).toHaveURL(/\/replay$/);
      await expect.poll(() => itemLinks(page)).not.toContain('enter');

      const before = startsOn(await arrivals(), 'in-view-once');

      await page.goBack();

      const section = page.locator('#in-view-once');

      await expect(section).toBeVisible();
      await expect(section).not.toHaveAttribute('data-once');
      await expect
        .poll(async () => startsOn(await arrivals(), 'in-view-once'))
        .toBe(before + 1);
      await expect(section).toHaveCSS('opacity', '1');

      const recorded = await arrivals();

      recordInsertion(
        {
          ...recorded,
          starts: recorded.starts
            .filter((entry) => entry.id === 'in-view-once')
            .slice(before),
        },
        'in-view-once',
        `${kind}, route change`,
        browserName,
      );
    });

    test('keeps a hydrate-on-viewport section still until it is scrolled to, then arrives', async ({
      page,
    }) => {
      const arrivals = await recordArrivals(page);

      await page.goto(`${prefix}enter`);
      await waitForHydration(page);

      const section = page.locator('#viewport-once');

      await expect(section).toHaveAttribute('data-once', '');
      await expect(section).toHaveCSS('animation-name', 'none');
      await expect(section).toHaveCSS('opacity', '1');

      await section.scrollIntoViewIfNeeded();

      await expectArrived(section, arrivals, 'yeti-enter-fade');
    });

    test('keeps the hydrate-never section still and visible, and its link, after the live hosts leave', async ({
      page,
    }) => {
      await page.goto(`${prefix}enter`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live arrivals' })
        .click();
      await removeDehydratedHosts(page, '#viewport-once');
      await expect(page.locator('#plain, #below-once')).toHaveCount(0);
      await nextFrames(page);

      const section = page.locator('#never-once');

      await section.scrollIntoViewIfNeeded();
      await nextFrames(page);

      await expect(section).toHaveAttribute('data-once', '');
      await expect(section).toHaveCSS('animation-name', 'none');
      await expect(section).toHaveCSS('opacity', '1');
      await expect(section).toBeVisible();
      expect(
        await itemLinks(page),
        'the hydrate never host keeps the enter link',
      ).toContain('enter');
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves every enter element opaque, and each once element still', async ({
        page,
      }) => {
        await page.goto(`${prefix}enter`);

        await expectItemSheetsApplied(page, ['enter']);

        const hosts = page.locator('[data-ngx-yeti-item-enter]');

        await expect(hosts).toHaveCount(9);

        for (const host of await hosts.all()) {
          await expect(host).toHaveClass('enter');
          await expect(host).toHaveCSS('opacity', '1');
        }

        const once = page.locator('[data-ngx-yeti-item-enter][data-once]');

        await expect(once).toHaveCount(7);

        for (const host of await once.all()) {
          await expect(host).toHaveCSS('animation-name', 'none');
        }

        await expect(page.locator('#plain')).not.toHaveAttribute('data-enter');
        await expect(page.locator('#slide')).toHaveAttribute(
          'data-side',
          'end',
        );
        expect(await itemLinks(page)).toContain('enter');
      });

      // Yeti alone lets a named arrival win the name over `animation: none`
      // (upstream Y14); the accessibility stylesheet withholds it.
      test('serves each named once host still and visible', async ({
        page,
      }) => {
        await page.goto(`${prefix}enter`);

        await expectItemSheetsApplied(page, ['enter']);

        for (const host of namedOnceHosts) {
          await expectWithheld(page.locator(host));
        }

        const first = page.locator('#below-stagger-first');

        await expect(first).toHaveCSS('opacity', '1');
        await expect(first).toHaveCSS('animation-name', 'none');
      });
    });

    test('keeps the named once hosts still before hydration, then arrives the one in view once', async ({
      page,
    }) => {
      const arrivals = await recordArrivals(page);
      const release = await holdBackMainBundle(page);

      await page.goto(`${prefix}enter`, { waitUntil: 'commit' });
      await page.locator(belowStagger).waitFor({ state: 'attached' });
      await expectItemSheetsApplied(page, ['enter']);

      for (const host of namedOnceHosts) {
        await expectWithheld(page.locator(host));
      }

      await expect(page.locator('#below-stagger-first')).toHaveCSS(
        'animation-name',
        'none',
      );
      expect((await arrivals()).starts.map(({ id }) => id)).not.toContain(
        'in-view-rise',
      );

      release();
      await waitForHydration(page);

      await expectArrived(
        page.locator(inViewRise),
        arrivals,
        'yeti-enter-rise',
      );
      await nextFrames(page);

      const recorded = await arrivals();

      expect(namesOn(recorded, 'in-view-rise')).toEqual(['yeti-enter-rise']);
      expect(namesOn(recorded, 'below-slide')).toEqual([]);
      expect(namesOn(recorded, 'below-stagger-first')).toEqual([]);
      await expect(page.locator(belowSlide)).toHaveAttribute('data-once', '');
      await expect(page.locator(belowStagger)).toHaveAttribute('data-once', '');
    });

    // Seconds, compared as numbers: Firefox writes 0.01 ms as 0.00001s and
    // Chromium as 1e-05s. The floor job's WebKit ignores emulated reduced
    // motion, so the duration follows what the page reports, and a run where
    // the emulation did not reach the page is annotated.
    for (const motion of ['no-preference', 'reduce'] as const) {
      test.describe(`with ${motion} motion`, () => {
        test.use({ reducedMotion: motion });

        test('arrives the named once host in view once after hydration, at its duration', async ({
          browserName,
          page,
        }) => {
          const arrivals = await recordArrivals(page);

          await page.goto(`${prefix}enter`);
          await waitForHydration(page);

          const host = page.locator(inViewRise);

          await expectArrived(host, arrivals, 'yeti-enter-rise');

          const reduced = await page.evaluate(
            () => matchMedia('(prefers-reduced-motion: reduce)').matches,
          );

          if (reduced !== (motion === 'reduce')) {
            test.info().annotations.push({
              type: 'reduced-motion',
              description: `${browserName}: emulated ${motion} motion did not reach the page`,
            });
          }

          await expect
            .poll(() =>
              host.evaluate((element) =>
                parseFloat(getComputedStyle(element).animationDuration),
              ),
            )
            .toBe(reduced ? 0.00001 : 0.6);
        });
      });
    }

    test('arrives each named once host below the fold once when scrolled to, and replays none', async ({
      page,
    }) => {
      const arrivals = await recordArrivals(page);

      await page.goto(`${prefix}enter`);
      await waitForHydration(page);
      await nextFrames(page);

      const slide = page.locator(belowSlide);
      const stagger = page.locator(belowStagger);
      const first = page.locator('#below-stagger-first');

      await expectWithheld(slide);
      await expectWithheld(stagger);
      expect(namesOn(await arrivals(), 'below-slide')).toEqual([]);
      expect(namesOn(await arrivals(), 'below-stagger-first')).toEqual([]);

      await slide.scrollIntoViewIfNeeded();
      await expectArrived(slide, arrivals, 'yeti-enter-slide-end');

      await stagger.scrollIntoViewIfNeeded();
      await expectArrived(stagger, arrivals, 'yeti-enter-slide-end', first);

      await scrollToTop(page);
      await slide.scrollIntoViewIfNeeded();
      await stagger.scrollIntoViewIfNeeded();
      await nextFrames(page);

      const recorded = await arrivals();

      expect(
        [
          'in-view-rise',
          'below-slide',
          'below-stagger',
          'below-stagger-first',
        ].map((id) => namesOn(recorded, id)),
        'scrolling away and back replays nothing',
      ).toEqual([
        ['yeti-enter-rise'],
        ['yeti-enter-slide-end'],
        [],
        ['yeti-enter-slide-end'],
      ]);
    });
  });
}
