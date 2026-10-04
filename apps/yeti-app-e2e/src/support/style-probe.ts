import { type Page } from '@playwright/test';

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
 * `style` element added to or removed from the document after
 * `DOMContentLoaded`, such as `add link[data-ngx-yeti-styles="card"]`.
 */
export async function recordStyleMutations(
  page: Page,
): Promise<() => Promise<readonly string[]>> {
  const key = '__ngxYetiStyleMutations';

  await page.addInitScript((name) => {
    const entries: string[] = [];
    let afterContentLoaded = false;

    Reflect.set(window, name, entries);
    document.addEventListener('DOMContentLoaded', () => {
      afterContentLoaded = true;
    });

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

    new MutationObserver((mutations) => {
      if (!afterContentLoaded) {
        return;
      }

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
    }).observe(document, { childList: true, subtree: true });
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

let frameProbes = 0;

/**
 * The returned function lists the computed value of `property` on the first
 * element matching `selector` in every animation frame, `''` while nothing
 * matches. With `start: 'load'`, call it before `goto` to sample from the
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

  return reader(page, key);
}

/**
 * Delays every request matching `url`, Yeti's files by default, by 300 ms.
 * Playwright's routing also turns the HTTP cache off.
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
 * Whether the item links in `<head>` named in `items`, or all of them, have
 * loaded their stylesheets.
 */
export async function itemSheetsLoaded(
  page: Page,
  items?: readonly string[],
): Promise<boolean> {
  return page
    .locator('head link[data-ngx-yeti-styles]')
    .evaluateAll((links, names) => {
      const itemOf = (link: Element): string =>
        link.getAttribute('data-ngx-yeti-styles') ?? '';
      const loaded = links
        .filter(
          (link) => link instanceof HTMLLinkElement && link.sheet !== null,
        )
        .map(itemOf);

      return (names ?? links.map(itemOf)).every((item) =>
        loaded.includes(item),
      );
    }, items ?? null);
}

/** The `data-ngx-yeti-styles` values of the item links in `<head>`, in document order. */
export async function itemLinks(page: Page): Promise<readonly string[]> {
  return page
    .locator('head link[data-ngx-yeti-styles]')
    .evaluateAll((links) =>
      links.map((link) => link.getAttribute('data-ngx-yeti-styles') ?? ''),
    );
}
