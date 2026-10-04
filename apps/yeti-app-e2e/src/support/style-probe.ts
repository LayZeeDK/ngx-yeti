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
 * Call before `goto`. The returned function lists the computed value of
 * `property` on the first element matching `selector` in every animation
 * frame from the first one, `''` while nothing matches.
 */
export async function recordFrames(
  page: Page,
  selector: string,
  property: string,
): Promise<() => Promise<readonly string[]>> {
  const key = '__ngxYetiFrames';

  await page.addInitScript(
    ([name, frameSelector, frameProperty]) => {
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
    },
    [key, selector, property] as const,
  );

  return reader(page, key);
}

/** The `data-ngx-yeti-styles` values of the item links in `<head>`, in document order. */
export async function itemLinks(page: Page): Promise<readonly string[]> {
  return page
    .locator('head link[data-ngx-yeti-styles]')
    .evaluateAll((links) =>
      links.map((link) => link.getAttribute('data-ngx-yeti-styles') ?? ''),
    );
}
