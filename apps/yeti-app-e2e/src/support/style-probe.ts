import { type Page } from '@playwright/test';
import { expect, isProduction, test } from './fixtures';

/**
 * Probes after the style-loading prototype's
 * (`docs/specs/prototypes/style-loading/measure/probe.mjs`): init scripts that
 * run before the page's own scripts and record into a `window` key.
 */

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item: unknown) => typeof item === 'string')
  );
}

function reader(page: Page, key: string): () => Promise<readonly string[]> {
  return async () => {
    const value: unknown = await page.evaluate(
      (name): unknown => Reflect.get(window, name),
      key,
    );

    if (!isStringArray(value)) {
      throw new Error(`The probe recorded nothing under window.${key}`);
    }

    return value;
  };
}

/**
 * Call before `goto`. The returned function lists one entry per `link` or
 * `style` element added to or removed from the document once parsing ends,
 * such as `add link[data-ngx-yeti-styles="card"]`. Recording starts when
 * `document.readyState` becomes `interactive`, before any module script
 * runs: Firefox hydrates the routed component before `DOMContentLoaded`.
 */
export async function recordStyleMutations(
  page: Page,
): Promise<() => Promise<readonly string[]>> {
  const key = '__ngxYetiStyleMutations';

  await page.addInitScript((name) => {
    const entries: string[] = [];

    Reflect.set(window, name, entries);

    const entryFor = (change: string, node: Node): string | null => {
      if (!(
        node instanceof HTMLLinkElement || node instanceof HTMLStyleElement
      )) {
        return null;
      }

      const item = node.getAttribute('data-ngx-yeti-styles');
      const detail =
        item === null
          ? ` ${node.getAttribute('href') ?? ''}`
          : `[data-ngx-yeti-styles="${item}"]`;

      return `${change} ${node.localName}${detail}`;
    };

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const [change, nodes] of [
          ['add', mutation.addedNodes],
          ['remove', mutation.removedNodes],
        ] as const) {
          for (const node of nodes) {
            const entry = entryFor(change, node);

            if (entry !== null) {
              entries.push(entry);
            }
          }
        }
      }
    });

    document.addEventListener('readystatechange', () => {
      if (document.readyState === 'interactive') {
        observer.observe(document, { childList: true, subtree: true });
      }
    });
  }, key);

  return reader(page, key);
}

/**
 * Call before `goto`. The returned function lists each attribute of an
 * element matching `selector` whose value changes, such as
 * `rise-card data-lift: null -> scale`. Hydration rewrites attributes with
 * the value they already have (measured in Chromium), so a record alone is
 * no change. Event replay removes `RouterLink`'s `jsaction` marker, which is
 * not the package's, so `jsaction` is not counted.
 */
export async function recordHostAttributes(
  page: Page,
  selector: string,
): Promise<() => Promise<readonly string[]>> {
  const key = '__ngxYetiHostAttributes';

  await page.addInitScript(
    ([name, hostSelector]) => {
      const changes: string[] = [];

      Reflect.set(window, name, changes);
      new MutationObserver((mutations) => {
        for (const { target, attributeName, oldValue } of mutations) {
          if (
            target instanceof Element &&
            target.matches(hostSelector) &&
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
    },
    [key, selector] as const,
  );

  return reader(page, key);
}

/**
 * Call before `goto`. The returned function lists one entry
 * `{element} {attribute}` (the element's id, else its tag name) for each
 * animation frame in which an element matching `selector` carried one of
 * `attributes`, so an empty list means no painted frame showed them. A
 * requestAnimationFrame probe reads the attributes at the start of each
 * frame's callbacks. Angular may run change detection in a later callback of
 * the same frame (its zoneless scheduler races a frame against a timeout),
 * so a MutationObserver applies every change made by those callbacks. A
 * ResizeObserver armed by the probe's callback records the frame: its
 * callback runs after every animation frame callback and layout, just before
 * the paint. An attribute that is written and removed again between two
 * frames is never painted and is not listed.
 */
export async function recordPaintedAttributes(
  page: Page,
  selector: string,
  attributes: readonly string[],
): Promise<() => Promise<readonly string[]>> {
  const key = '__ngxYetiPaintedAttributes';
  const framesKey = `${key}Frames`;

  await page.addInitScript(
    ([name, frameCount, hostSelector, names]) => {
      const entries: string[] = [];
      const entryFor = (element: Element, attribute: string): string =>
        `${element.id || element.localName} ${attribute}`;
      let frame: Map<string, boolean> | null = null;
      let frames = 0;

      const record = (): void => {
        if (frame === null) {
          return;
        }

        for (const [entry, present] of frame) {
          if (present) {
            entries.push(entry);
          }
        }

        frame = null;
        frames += 1;
        Reflect.set(window, frameCount, frames);
      };

      Reflect.set(window, name, entries);
      Reflect.set(window, frameCount, frames);
      const beforePaint = new ResizeObserver(record);

      new MutationObserver((mutations) => {
        for (const { target, attributeName } of mutations) {
          if (
            frame !== null &&
            target instanceof Element &&
            attributeName !== null &&
            target.matches(hostSelector)
          ) {
            frame.set(
              entryFor(target, attributeName),
              target.hasAttribute(attributeName),
            );
          }
        }
      }).observe(document, {
        attributes: true,
        attributeFilter: [...names],
        subtree: true,
      });

      const sample = (): void => {
        record();
        frame = new Map();

        for (const element of document.querySelectorAll(hostSelector)) {
          for (const attribute of names) {
            frame.set(
              entryFor(element, attribute),
              element.hasAttribute(attribute),
            );
          }
        }

        // A new observation reports once, in this frame's resize step.
        const root = document.documentElement;

        beforePaint.unobserve(root);
        beforePaint.observe(root);
        requestAnimationFrame(sample);
      };

      requestAnimationFrame(sample);
    },
    [key, framesKey, selector, attributes] as const,
  );

  const read = reader(page, key);

  // As in recordFrames: each read waits for one more frame, taken after the
  // call, because headless WebKit on Linux fires few frames a second.
  return async () => {
    const sampled: unknown = await page.evaluate(
      (name): unknown => Reflect.get(window, name),
      framesKey,
    );

    await page.waitForFunction(
      ([name, count]) => {
        const frames: unknown = Reflect.get(window, name);

        return typeof frames === 'number' && frames > count;
      },
      [framesKey, typeof sampled === 'number' ? sampled : 0] as const,
    );

    return read();
  };
}

let frameProbes = 0;

/**
 * The returned function lists the computed value of `property` on the first
 * element matching `selector` in every animation frame; frames where nothing
 * matched are left out. With `start: 'load'`, call it before `goto` to sample from the
 * page's first frame; with `start: 'now'`, it samples the loaded page from
 * the next frame on. Each call records under its own key.
 */
export async function recordFrames(
  page: Page,
  selector: string,
  property: string,
  { start = 'load' }: { start?: 'load' | 'now' } = {},
): Promise<() => Promise<readonly string[]>> {
  frameProbes += 1;

  const key = `__ngxYetiFrames${String(frameProbes)}`;
  const sampleFrames = ([name, frameSelector, frameProperty]: readonly [
    string,
    string,
    string,
  ]): void => {
    const frames: string[] = [];

    Reflect.set(window, name, frames);

    const sample = (): void => {
      const element = document.querySelector(frameSelector);

      frames.push(
        element === null
          ? ''
          : getComputedStyle(element).getPropertyValue(frameProperty),
      );
      requestAnimationFrame(sample);
    };

    requestAnimationFrame(sample);
  };
  const args = [key, selector, property] as const;

  if (start === 'load') {
    await page.addInitScript(sampleFrames, args);
  } else {
    await page.evaluate(sampleFrames, args);
  }

  const read = reader(page, key);

  // Headless WebKit on Linux fires only a few animation frames a second, so
  // the list can end before the state the caller just reached. Each read
  // waits for one more sample, taken after the call.
  return async () => {
    const sampled = (await read()).length;

    await page.waitForFunction(
      ([name, count]) => {
        const frames: unknown = Reflect.get(window, name);

        return Array.isArray(frames) && frames.length > count;
      },
      [key, sampled] as const,
    );

    return (await read()).filter((value) => value !== '');
  };
}

/**
 * Why frames sampled from first paint are recorded instead of asserted
 * (setup.md:338): upstream bug A4. Critical-CSS inlining lets a
 * server-rendered host paint before the global stylesheet applies in every
 * engine in production, and Firefox paints such a frame in development too.
 * Elsewhere the frames are asserted.
 */
export function firstPaintFramesRecordedAs(browserName: string): {
  readonly recordedAs?: string;
} {
  return isProduction || browserName === 'firefox'
    ? { recordedAs: 'a4-frames' }
    : {};
}

/**
 * Why frames of a client-only host are recorded instead of asserted: upstream
 * bug A4, in production only. A server-rendered host that every engine paints
 * styled in development follows the same rule.
 */
export function productionFramesRecordedAs(): {
  readonly recordedAs?: string;
} {
  return isProduction ? { recordedAs: 'a4-frames' } : {};
}

/**
 * Expects at least one sampled frame and pushes one annotation
 * `{label}: {unstyled} of {sampled} frames unstyled`, typed `recordedAs`, or
 * `frames` without it. Expects no unstyled frame unless `recordedAs` names
 * why the frames are recorded, such as `a4-frames` for upstream bug A4.
 */
export function expectStyledFrames(
  frames: readonly string[],
  options: {
    readonly styled: (value: string) => boolean;
    readonly label: string;
    readonly recordedAs?: string;
  },
): void {
  const { styled, label, recordedAs } = options;
  const unstyled = frames.filter((value) => !styled(value));

  expect(frames.length, `${label}: frames were sampled`).toBeGreaterThan(0);
  test.info().annotations.push({
    type: recordedAs ?? 'frames',
    description: `${label}: ${String(unstyled.length)} of ${String(frames.length)} frames unstyled`,
  });

  if (recordedAs === undefined) {
    expect(unstyled, `${label}: no frame is unstyled`).toEqual([]);
  }
}

/**
 * The returned function lists the path under `yeti-css/` of every item file
 * requested from now on, in request order and without the `?v=` query.
 */
export function recordItemRequests(page: Page): () => readonly string[] {
  const requests: string[] = [];

  page.on('request', (request) => {
    const path = /\/yeti-css\/([^?]+)/.exec(request.url())?.[1];

    if (path !== undefined) {
      requests.push(path);
    }
  });

  return () => requests;
}

/**
 * Delays every request matching `url`, Yeti's files by default, by 300 ms.
 * Playwright's routing also turns the HTTP cache off, and in Chromium drops
 * the memory cache when the route is registered. In Chromium and WebKit a
 * link inserted after that fetches its file again unless the file was
 * preloaded (measured).
 */
export async function delayCss(
  page: Page,
  url: string | RegExp = '**/yeti-css/**',
): Promise<void> {
  await page.route(url, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  });
}

/**
 * The `data-ngx-yeti-styles` values of the item links in `<head>`, in
 * document order: every item's, or only `item`'s, so a list a later item
 * extends can still be compared exactly.
 */
export async function itemLinks(
  page: Page,
  item?: string,
): Promise<readonly string[]> {
  const items = await page
    .locator('head link[data-ngx-yeti-styles]')
    .evaluateAll((links) =>
      links.map((link) => link.getAttribute('data-ngx-yeti-styles') ?? ''),
    );

  return item === undefined ? items : items.filter((name) => name === item);
}
