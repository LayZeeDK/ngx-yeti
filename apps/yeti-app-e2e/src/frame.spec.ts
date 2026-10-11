import { expectItemSheetsApplied, rect } from '@ngx-yeti/testing/playwright';
import { type Page } from '@playwright/test';
import { failsSnapshot } from './support/axe';
import { expect, isProduction, routeKinds, test } from './support/fixtures';
import { nextFrames, waitForHydration } from './support/hydration';
import { describeStandardRouteCases } from './support/standard-cases';
import {
  delayCss,
  expectStyledFrames,
  itemLinks,
  productionFramesRecordedAs,
  recordFrames,
} from './support/style-probe';

/**
 * The frame's rendered width over height is `width / height` within one
 * pixel, and its one child fills it, cropped with `object-fit: cover`.
 */
async function expectCropped(
  page: Page,
  selector: string,
  [width, height]: readonly [number, number],
): Promise<void> {
  const frame = page.locator(selector);
  const media = page.locator(`${selector} > *`);

  await expectItemSheetsApplied(page, ['frame']);
  await expect(frame).toHaveCSS('overflow', 'hidden');

  const [outer, inner] = await Promise.all([rect(frame), rect(media)]);

  expect(
    Math.abs(outer.height - (outer.width * height) / width),
    `${selector} is ${String(width)}/${String(height)}`,
  ).toBeLessThanOrEqual(1);
  expect(Math.abs(inner.width - outer.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(inner.height - outer.height)).toBeLessThanOrEqual(1);
  await expect(media).toHaveCSS('object-fit', 'cover');
}

/** Every live frame of the route, with the ratio it binds. */
const liveFrames = [
  ['#photo-frame', '16/9', [16, 9]],
  ['#wide-frame', '21/9', [21, 9]],
  ['#srcdoc-frame', '4/3', [4, 3]],
] as const;

/**
 * Call before `goto`. Records each `load` and `loadstart` event of an
 * `iframe` or `video` as `{frame id} {event} {before|after}`, where
 * `before` means event replay's `jsaction` markers were still on the page,
 * so hydration had not finished.
 */
async function recordEmbedLoads(
  page: Page,
): Promise<() => Promise<readonly string[]>> {
  await page.addInitScript(() => {
    const entries: string[] = [];

    Reflect.set(window, '__ngxYetiEmbedLoads', entries);

    for (const type of ['load', 'loadstart']) {
      // A load event never reaches the window, so listen on the document.
      document.addEventListener(
        type,
        (event) => {
          const { target } = event;

          if (
            target instanceof Element &&
            (target.localName === 'iframe' || target.localName === 'video')
          ) {
            const phase =
              document.querySelector('[jsaction]') === null
                ? 'after'
                : 'before';

            entries.push(
              `${target.parentElement?.id ?? target.localName} ${type} ${phase}`,
            );
          }
        },
        true,
      );
    }
  });

  return async () => {
    const value: unknown = await page.evaluate((): unknown =>
      Reflect.get(window, '__ngxYetiEmbedLoads'),
    );

    if (
      !Array.isArray(value) ||
      !value.every((item: unknown) => typeof item === 'string')
    ) {
      throw new Error('The probe recorded no embed loads');
    }

    return value;
  };
}

/**
 * Call before `goto`. Records the photo frame's height and the paragraph
 * after it in every animation frame, and the layout-shift entries (Chromium
 * reports them; Firefox and WebKit have no such entry type) whose sources
 * are the photo frame, its image, or that paragraph.
 */
async function recordPhotoShifts(page: Page): Promise<
  () => Promise<{
    readonly geometry: readonly string[];
    readonly shifts: readonly number[] | null;
  }>
> {
  await page.addInitScript(() => {
    const geometry: string[] = [];
    const shifts: number[] = [];
    const watched = (node: unknown): boolean =>
      node instanceof Element &&
      node.closest('#photo-frame, #after-photo') !== null;

    Reflect.set(window, '__ngxYetiPhotoGeometry', geometry);

    if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
      Reflect.set(window, '__ngxYetiPhotoShifts', shifts);
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const value: unknown = Reflect.get(entry, 'value');
          const sources: unknown = Reflect.get(entry, 'sources');

          if (
            typeof value === 'number' &&
            Array.isArray(sources) &&
            sources.some((source: unknown) =>
              watched(
                typeof source === 'object' && source !== null
                  ? Reflect.get(source, 'node')
                  : null,
              ),
            )
          ) {
            shifts.push(value);
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    }

    const sample = (): void => {
      const frame = document.querySelector('#photo-frame');
      const after = document.querySelector('#after-photo');

      if (frame !== null && after !== null) {
        geometry.push(
          `${frame.getBoundingClientRect().height.toFixed(1)} ${after.getBoundingClientRect().top.toFixed(1)}`,
        );
      }

      requestAnimationFrame(sample);
    };

    requestAnimationFrame(sample);
  });

  return async () => {
    await nextFrames(page);

    const geometry: unknown = await page.evaluate((): unknown =>
      Reflect.get(window, '__ngxYetiPhotoGeometry'),
    );
    const shifts: unknown = await page.evaluate(
      (): unknown => Reflect.get(window, '__ngxYetiPhotoShifts') ?? null,
    );

    if (!Array.isArray(geometry)) {
      throw new Error('The probe recorded no photo geometry');
    }

    return {
      geometry: geometry.map(String),
      shifts: Array.isArray(shifts) ? shifts.map(Number) : null,
    };
  };
}

// The frame route's `srcdoc` iframe makes Firefox log a forced-layout
// warning in the JavaScript-off snapshot; only that warning is let through.
test('the axe snapshot fails on every warning and error but the srcdoc forced-layout one', () => {
  const forcedLayout =
    'Layout was forced before the page was fully loaded. If stylesheets are not yet loaded this may cause a flash of unstyled content.';

  expect(
    failsSnapshot(
      'warning',
      `[JavaScript Warning: "${forcedLayout}" {file: "about:srcdoc" line: 0}]`,
    ),
  ).toBe(false);
  expect(
    failsSnapshot(
      'warning',
      `[JavaScript Warning: "${forcedLayout}" {file: "http://localhost:4310/sub/frame" line: 0}]`,
    ),
    'the same warning from the page itself',
  ).toBe(true);
  expect(
    failsSnapshot(
      'error',
      `[JavaScript Error: "${forcedLayout}" {file: "about:srcdoc" line: 0}]`,
    ),
    'an error with the same text',
  ).toBe(true);
  expect(
    failsSnapshot(
      'warning',
      '[JavaScript Warning: "Media resource data:video/webm could not be decoded." {file: "about:srcdoc" line: 0}]',
    ),
    'another warning from a srcdoc document',
  ).toBe(true);
  expect(
    failsSnapshot(
      'error',
      'Content-Security-Policy: The page settings blocked an inline script',
    ),
  ).toBe(true);
  expect(failsSnapshot('log', 'An ordinary log line')).toBe(false);
});

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} frame route`, () => {
    describeStandardRouteCases({
      item: 'frame',
      prefix,
      liveHost: '#photo-frame',
      leaveLink: 'Leave for a page without frames',
      styled: { property: 'overflow', value: 'hidden' },
      afterReturn: async (page) => {
        await expectCropped(page, '#photo-frame', [16, 9]);
      },
    });

    test('crops each live frame to its ratio', async ({ page }) => {
      await page.goto(`${prefix}frame`);
      await waitForHydration(page);

      for (const [selector, value, ratio] of liveFrames) {
        await expect(page.locator(selector)).toHaveAttribute(
          'data-ratio',
          value,
        );
        await expectCropped(page, selector, ratio);
      }
    });

    test('shifts nothing while the photo loads', async ({
      browserName,
      page,
    }) => {
      const recorded = await recordPhotoShifts(page);

      await page.route('**/trail.svg*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.continue();
      });
      await page.goto(`${prefix}frame`);

      const photo = page.locator('#photo-frame img');

      await expect
        .poll(() =>
          photo.evaluate(
            (image) => image instanceof HTMLImageElement && image.complete,
          ),
        )
        .toBe(true);
      await expect(
        page.locator('head link[data-ngx-yeti-styles="frame"]'),
      ).toHaveCount(1);

      const { geometry, shifts } = await recorded();
      const heights = [
        ...new Set(geometry.map((entry) => entry.split(' ')[0])),
      ];
      const tops = [...new Set(geometry.map((entry) => entry.split(' ')[1]))];

      const { recordedAs } = productionFramesRecordedAs();

      test.info().annotations.push({
        type: recordedAs ?? 'photo-layout-shift',
        description: `${browserName}, ${isProduction ? 'production' : 'development'}, ${kind}: ${String(geometry.length)} frames, frame heights ${heights.join(', ')}, text tops ${tops.join(', ')}, layout-shift entries ${shifts === null ? 'not reported' : `[${shifts.join(', ')}]`}`,
      });
      expect(geometry.length, 'the photo was sampled').toBeGreaterThan(0);
      expect(
        heights,
        'the photo frame keeps its height in every frame',
      ).toHaveLength(1);

      // In production, critical-CSS inlining can paint the text's margin
      // before Yeti's tokens arrive (upstream bug A4), which moves the text
      // but not the frame.
      if (recordedAs === undefined) {
        expect(
          tops,
          'the text after the photo keeps its place in every frame',
        ).toHaveLength(1);
      }

      if (shifts !== null) {
        expect(
          shifts.reduce((sum, value) => sum + value, 0),
          'the layout-shift score of the photo area',
        ).toBe(0);
      }
    });

    test('records whether hydration reloads the embeds', async ({
      browserName,
      page,
    }) => {
      const loads = await recordEmbedLoads(page);

      await page.goto(`${prefix}frame`);
      await waitForHydration(page);
      // A reload that does not happen fires no event to wait for, so give
      // one that hydration's attribute writes start half a second.
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 500);
          }),
      );

      const entries = await loads();
      const count = (frame: string): string => {
        const own = entries.filter((entry) => entry.startsWith(`${frame} `));

        return `${String(own.length)} (${own.map((entry) => entry.slice(frame.length + 1)).join(', ')})`;
      };

      test.info().annotations.push({
        type: 'embed-loads',
        description: `${browserName}, ${isProduction ? 'production' : 'development'}, ${kind}: iframe srcdoc ${count('srcdoc-frame')}; video src ${count('video-src-frame')}; video source ${count('video-source-frame')}`,
      });
      expect(
        entries.filter((entry) => entry.startsWith('srcdoc-frame load')),
        'the iframe loaded',
      ).not.toEqual([]);
    });

    test('keeps the hydrate-never frame cropped after every live frame leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}frame`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live frames' })
        .click();
      await expect(page.locator('#photo-frame')).toHaveCount(0);
      await nextFrames(page);

      await expect(page.locator('#never-frame')).toHaveAttribute(
        'data-ngx-yeti-item-frame',
        '',
      );
      expect(
        await itemLinks(page, 'frame'),
        'the hydrate never host keeps the frame link',
      ).toEqual(['frame']);
      await expectCropped(page, '#never-frame', [4, 3]);
    });

    // The server hosts keep the frame link in <head>, so the client-only
    // frame reuses it.
    test('shows a client-only frame cropped from its first frame', async ({
      browserName,
      page,
    }) => {
      const ratios = await recordFrames(page, '#client-frame', 'aspect-ratio');
      const fits = await recordFrames(page, '#client-frame img', 'object-fit');

      await delayCss(page);
      await page.goto(`${prefix}frame`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only frame' })
        .click();

      await expect(page.locator('#client-frame')).toBeVisible();
      await expectCropped(page, '#client-frame', [1, 1]);

      expectStyledFrames(await ratios(), {
        styled: (value) => value !== 'auto',
        label: `${browserName}, ${kind}, client-only frame ratio`,
        ...productionFramesRecordedAs(),
      });
      expectStyledFrames(await fits(), {
        styled: (value) => value !== 'fill',
        label: `${browserName}, ${kind}, client-only frame image fit`,
        ...productionFramesRecordedAs(),
      });
    });

    test('has no horizontal overflow from the 21/9 frame at a 320 px viewport', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}frame`);
      await waitForHydration(page);
      await expectCropped(page, '#wide-frame', [21, 9]);

      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(320);
    });

    // frame.md:248 puts this in a story; Storybook's synthetic Tab never
    // reaches a video (ngx-yeti-specs Departures).
    test('reaches the controls of a framed video by Tab', async ({ page }) => {
      await page.goto(`${prefix}frame`);
      await waitForHydration(page);

      const video = page.locator('#video-source-frame video');

      await page
        .getByRole('link', { name: 'Leave for a page without frames' })
        .focus();

      for (let step = 0; step < 10; step += 1) {
        if (
          await video.evaluate((element) => element === document.activeElement)
        ) {
          break;
        }

        await page.keyboard.press('Tab');
      }

      await expect(video).toBeFocused();
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the frames with their attributes and item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}frame`);

        const photo = page.locator('#photo-frame');

        await expect(photo).toContainClass('frame');
        await expect(photo).toHaveAttribute('data-ngx-yeti-item-frame', '');
        await expect(photo).toHaveAttribute('data-ratio', '16/9');
        await expect(page.locator('#video-src-frame')).toHaveClass('frame');
        await expect(page.locator('#video-src-frame')).not.toHaveAttribute(
          'data-ratio',
        );
        expect(await itemLinks(page, 'frame')).toEqual(['frame']);
      });

      test('crops each frame to its ratio as with JavaScript on', async ({
        page,
      }) => {
        await page.goto(`${prefix}frame`);

        for (const [selector, value, ratio] of [
          ...liveFrames,
          ['#never-frame', '4/3', [4, 3]] as const,
        ]) {
          await expect(page.locator(selector)).toHaveAttribute(
            'data-ratio',
            value,
          );
          await expectCropped(page, selector, ratio);
        }
      });

      test('has no horizontal overflow at a 320 px viewport', async ({
        page,
      }) => {
        await page.setViewportSize({ width: 320, height: 640 });
        await page.goto(`${prefix}frame`);
        await expectCropped(page, '#wide-frame', [21, 9]);

        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(320);
      });
    });
  });
}
