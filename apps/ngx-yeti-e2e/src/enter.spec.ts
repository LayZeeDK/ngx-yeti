import { expectItemSheetsApplied } from '@ngx-yeti/testing/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { openStory } from './open-story';

interface Timing {
  readonly name: string;
  readonly delay: number;
  readonly duration: number;
}

/** A computed time such as `0.2s` or `150ms`, in seconds. */
function seconds(time: string): number {
  return time.endsWith('ms') ? parseFloat(time) / 1000 : parseFloat(time);
}

async function timing(locator: Locator): Promise<Timing> {
  const { name, delay, duration } = await locator.evaluate((element) => {
    const style = getComputedStyle(element);

    return {
      name: style.animationName,
      delay: style.animationDelay,
      duration: style.animationDuration,
    };
  });

  return { name, delay: seconds(delay), duration: seconds(duration) };
}

/** The used value of a public time token in the story, in seconds. */
async function tokenTime(root: Locator, token: string): Promise<number> {
  return seconds(
    await root.evaluate((element, name) => {
      const probe = document.createElement('div');
      probe.style.transitionDuration = `var(${name})`;
      element.append(probe);
      const time = getComputedStyle(probe).transitionDuration;
      probe.remove();

      return time;
    }, token),
  );
}

/** Waits until every animation on or inside the element has ended. */
async function settled(locator: Locator): Promise<void> {
  await locator.evaluate(async (element) => {
    await Promise.all(
      element
        .getAnimations({ subtree: true })
        .map(async ({ finished }) => finished),
    );
  });
}

interface Starts {
  /**
   * Each `animationstart`, by the test id of the element it started on or of
   * its nearest ancestor with one.
   */
  readonly starts: readonly { readonly id: string; readonly time: number }[];
  /** When each `enter` item link added to the document finished loading. */
  readonly linkLoads: readonly number[];
}

function isStarts(value: unknown): value is Starts {
  return (
    typeof value === 'object' &&
    value !== null &&
    'starts' in value &&
    Array.isArray(value.starts) &&
    'linkLoads' in value &&
    Array.isArray(value.linkLoads)
  );
}

/**
 * Call before `openStory`. The returned function reads every
 * `animationstart` and every load of an `enter` item link, on the page's
 * `performance.now()` clock.
 */
async function recordStarts(page: Page): Promise<() => Promise<Starts>> {
  await page.addInitScript(() => {
    const starts: { id: string; time: number }[] = [];
    const linkLoads: number[] = [];

    Reflect.set(window, '__ngxYetiEnter', { starts, linkLoads });
    document.addEventListener(
      'animationstart',
      (event) => {
        if (event.target instanceof Element) {
          starts.push({
            id:
              event.target
                .closest('[data-testid]')
                ?.getAttribute('data-testid') ?? event.target.id,
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
    const value: unknown = await page.evaluate((): unknown =>
      Reflect.get(window, '__ngxYetiEnter'),
    );

    if (!isStarts(value)) {
      throw new Error('The arrival probe recorded nothing');
    }

    return value;
  };
}

function startsOn(recorded: Starts, id: string): number {
  return recorded.starts.filter((start) => start.id === id).length;
}

async function scrollTo(page: Page, top: number): Promise<void> {
  await page.evaluate((y) => {
    window.scrollTo(0, y);
  }, top);
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
  );
}

async function supportsViewTimeline(page: Page): Promise<boolean> {
  return page.evaluate(() => CSS.supports('animation-timeline', 'view()'));
}

test.describe('enter--arrivals', () => {
  test('plays each arrival, and the slide from the end edge in a right-to-left block', async ({
    page,
  }) => {
    const root = await openStory(page, 'enter--arrivals');

    await expectItemSheetsApplied(page, ['enter']);

    const expected = {
      fade: 'yeti-enter-fade',
      rise: 'yeti-enter-rise',
      fall: 'yeti-enter-fall',
      slide: 'yeti-enter-slide-start',
      scale: 'yeti-enter-scale',
      'slide-end': 'yeti-enter-slide-end',
      'slide-rtl': 'yeti-enter-slide-end',
    };

    for (const [testId, name] of Object.entries(expected)) {
      await expect(root.getByTestId(testId)).toHaveCSS('animation-name', name);
    }
  });
});

test.describe('enter--stagger', () => {
  test('delays each child by one more stagger step up to the ninth', async ({
    page,
  }) => {
    const root = await openStory(page, 'enter--stagger');
    const list = root.getByTestId('stagger');

    await expectItemSheetsApplied(page, ['enter']);
    await expect(list.locator('li').first()).toHaveCSS(
      'animation-name',
      'yeti-enter-rise',
    );

    const delay = await tokenTime(root, '--yeti-enter-delay');
    const step = await tokenTime(root, '--yeti-enter-stagger');
    const items = await list.locator('li').all();

    expect(items).toHaveLength(11);
    expect((await timing(list)).name).toBe('none');

    for (const [index, item] of items.entries()) {
      expect((await timing(item)).delay).toBeCloseTo(
        delay + Math.min(index, 8) * step,
        3,
      );
    }
  });

  test('collapses every duration and delay under reduced motion', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const root = await openStory(page, 'enter--stagger');
    const list = root.getByTestId('stagger');

    await expectItemSheetsApplied(page, ['enter']);
    await expect(list.locator('li').first()).toHaveCSS(
      'animation-name',
      'yeti-enter-rise',
    );

    for (const item of await list.locator('li').all()) {
      const { delay, duration } = await timing(item);

      expect(delay).toBe(0);
      expect(duration).toBeLessThanOrEqual(0.001);
    }
  });
});

test.describe('enter--view', () => {
  test('plays on load where view() is unsupported', async ({ page }) => {
    const root = await openStory(page, 'enter--view');
    const figure = root.getByTestId('view');

    test.skip(
      await supportsViewTimeline(page),
      'The browser supports animation-timeline: view()',
    );

    await expectItemSheetsApplied(page, ['enter']);
    await expect(figure).toHaveCSS('animation-name', 'yeti-enter-scale');
    await settled(figure);
    await expect(figure).toHaveCSS('opacity', '1');
  });

  test('follows the scroll where view() is supported', async ({ page }) => {
    const root = await openStory(page, 'enter--view');
    const figure = root.getByTestId('view');

    test.skip(
      !(await supportsViewTimeline(page)),
      'The browser does not support animation-timeline: view(), as Firefox 145',
    );

    await expectItemSheetsApplied(page, ['enter']);
    await expect(figure).toHaveCSS('animation-name', 'yeti-enter-scale');
    await expect(figure).toHaveCSS('animation-timeline', 'view()');
    expect(
      Number(
        await figure.evaluate((element) => getComputedStyle(element).opacity),
      ),
      'below the fold the scroll-driven arrival has not started',
    ).toBeLessThan(1);

    await figure.evaluate((element) => {
      element.scrollIntoView({ block: 'center' });
    });

    await expect(figure).toHaveCSS('opacity', '1');
  });

  test('is opaque below the fold under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const root = await openStory(page, 'enter--view');
    const figure = root.getByTestId('view');

    await expectItemSheetsApplied(page, ['enter']);
    await expect(figure).toHaveCSS('animation-name', 'yeti-enter-scale');
    await expect(figure).toHaveCSS('opacity', '1');
    expect(
      await figure.evaluate(
        (element) => element.getBoundingClientRect().top > innerHeight,
      ),
      'the figure is below the fold',
    ).toBe(true);
  });
});

test.describe('enter--once', () => {
  test('withholds the arrival until scrolled to, plays it once, and never replays it', async ({
    page,
  }) => {
    const recorded = await recordStarts(page);
    const root = await openStory(page, 'enter--once');
    const section = root.getByTestId('once');

    await expectItemSheetsApplied(page, ['enter']);
    await expect(section).toHaveAttribute('data-once', '');
    await expect(section).toHaveCSS('animation-name', 'none');
    await expect(section).toHaveCSS('opacity', '1');
    expect(startsOn(await recorded(), 'once')).toBe(0);

    await section.scrollIntoViewIfNeeded();

    await expect(section).not.toHaveAttribute('data-once');
    await expect.poll(async () => startsOn(await recorded(), 'once')).toBe(1);
    await settled(section);
    await expect(section).toHaveCSS('opacity', '1');

    await scrollTo(page, 0);
    await section.scrollIntoViewIfNeeded();
    await scrollTo(page, 0);

    expect(startsOn(await recorded(), 'once')).toBe(1);
    await expect(section).not.toHaveAttribute('data-once');
  });

  test('arrives a tall section once its top edge nears the viewport', async ({
    page,
  }) => {
    const root = await openStory(page, 'enter--once');
    const section = root.getByTestId('once');

    await expectItemSheetsApplied(page, ['enter']);
    await section.evaluate((element) => {
      if (element instanceof HTMLElement) {
        element.style.blockSize = '300vh';
      }
    });

    const top = await section.evaluate(
      (element) => element.getBoundingClientRect().top + scrollY,
    );
    const viewport = page.viewportSize()?.height ?? 0;

    // enter.js's root margin reaches 10 % of the viewport below it.
    await scrollTo(page, top - viewport * 1.2);

    await expect(section).toHaveAttribute('data-once', '');

    await scrollTo(page, top - viewport * 1.05);

    await expect(section).not.toHaveAttribute('data-once');
  });
});

test.describe('enter--once-stagger', () => {
  test('withholds every child until scrolled to, then plays each once', async ({
    page,
  }) => {
    const recorded = await recordStarts(page);
    const root = await openStory(page, 'enter--once-stagger');
    const list = root.getByTestId('once-stagger');
    const items = list.locator('li');

    await expectItemSheetsApplied(page, ['enter']);
    await expect(list).toHaveAttribute('data-once', '');

    for (const item of await items.all()) {
      await expect(item).toHaveCSS('animation-name', 'none');
      await expect(item).toHaveCSS('opacity', '1');
    }

    await list.scrollIntoViewIfNeeded();

    await expect(list).not.toHaveAttribute('data-once');
    await expect
      .poll(async () => startsOn(await recorded(), 'once-stagger'))
      .toBe(await items.count());
    await settled(list);

    await scrollTo(page, 0);
    await list.scrollIntoViewIfNeeded();
    await scrollTo(page, 0);

    expect(startsOn(await recorded(), 'once-stagger')).toBe(
      await items.count(),
    );
  });
});

test.describe('enter--inserted-preloaded', () => {
  test('arrives the sections an @if and a client-only @defer insert, with the enter preload', async ({
    browserName,
    page,
  }) => {
    const recorded = await recordStarts(page);
    const root = await openStory(page, 'enter--inserted-preloaded');

    await expect(
      page.locator(
        'head link[rel="preload"][href*="utilities/enter/enter.css"]',
      ),
    ).toHaveCount(1);
    await expect(
      page.locator('head link[data-ngx-yeti-styles="enter"]'),
    ).toHaveCount(0);

    const record = (label: string, id: string, current: Starts): void => {
      const start = current.starts.find((entry) => entry.id === id)?.time;
      const load = current.linkLoads.at(-1);

      test.info().annotations.push({
        type: 'enter-insertion',
        description: `${browserName}, ${label}, with the enter preload: first animationstart at ${start === undefined ? 'none' : `${start.toFixed(1)} ms`}, enter link loaded at ${load === undefined ? 'no load recorded' : `${load.toFixed(1)} ms`}${start !== undefined && load !== undefined ? ` (${(start - load).toFixed(1)} ms after the load)` : ''}`,
      });
    };

    await root
      .getByRole('button', { name: 'Show the inserted section' })
      .click();

    const plain = root.getByTestId('plain');
    const inserted = root.getByTestId('inserted-once');

    await expect(plain).toHaveCSS('animation-name', 'yeti-enter-fade');
    await expect.poll(async () => startsOn(await recorded(), 'plain')).toBe(1);
    record('@if, plain', 'plain', await recorded());

    await inserted.scrollIntoViewIfNeeded();
    await expect(inserted).not.toHaveAttribute('data-once');
    await expect
      .poll(async () => startsOn(await recorded(), 'inserted-once'))
      .toBe(1);
    record('@if, once', 'inserted-once', await recorded());

    await scrollTo(page, 0);
    await root
      .getByRole('button', { name: 'Show the deferred section' })
      .click();

    const deferred = root.getByTestId('deferred-once');

    await deferred.scrollIntoViewIfNeeded();
    await expect(deferred).not.toHaveAttribute('data-once');
    await expect
      .poll(async () => startsOn(await recorded(), 'deferred-once'))
      .toBe(1);
    record('client-only @defer, once', 'deferred-once', await recorded());
  });
});
