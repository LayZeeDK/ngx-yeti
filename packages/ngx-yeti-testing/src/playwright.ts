import { expect, type Locator, type Page } from '@playwright/test';

/** An element's border box in viewport coordinates, in px. */
export interface Box {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

/** The border box of the element `locator` matches. */
export async function rect(locator: Locator): Promise<Box> {
  return locator.evaluate((element) => {
    const { top, right, bottom, left, width, height } =
      element.getBoundingClientRect();

    return { top, right, bottom, left, width, height };
  });
}

/** The boxes of the element's children, in DOM order. */
export async function childRects(parent: Locator): Promise<Box[]> {
  return parent.evaluate((element) =>
    [...element.children].map((child) => {
      const { top, right, bottom, left, width, height } =
        child.getBoundingClientRect();

      return { top, right, bottom, left, width, height };
    }),
  );
}

/**
 * The used px size of a CSS length such as `var(--yeti-width-md)`, read from
 * a probe appended to `scope`, so no assertion depends on a token's default.
 * The probe measures the inline axis unless `axis` is `block`.
 */
export async function usedLength(
  scope: Locator,
  length: string,
  axis: 'inline' | 'block' = 'inline',
): Promise<number> {
  return scope.evaluate(
    (element, [value, onBlock]) => {
      const probe = document.createElement('div');

      if (onBlock) {
        probe.style.blockSize = value;
      } else {
        probe.style.inlineSize = value;
      }

      element.append(probe);

      const { width, height } = probe.getBoundingClientRect();

      probe.remove();

      return onBlock ? height : width;
    },
    [length, axis === 'block'] as const,
  );
}

/** How far the document is wider than the viewport, in px. */
export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const { scrollWidth, clientWidth } = document.documentElement;

    return scrollWidth - clientWidth;
  });
}

/**
 * Sets the element's inline size to `width` px. Throws when it is not an
 * HTMLElement, which has no inline style to set.
 */
export async function resize(element: Locator, width: number): Promise<void> {
  await element.evaluate((target, inlineSize) => {
    if (!(target instanceof HTMLElement)) {
      throw new TypeError(`<${target.localName}> is not an HTMLElement`);
    }

    target.style.inlineSize = `${String(inlineSize)}px`;
  }, width);
}

/**
 * Upstream bug O2 leaves computed styles stale after a stylesheet insertion,
 * so read geometry only once the item files of `items` have loaded and
 * applied. Expects one item link per item in `<head>`, then waits until each
 * has a stylesheet with at least one rule: a failed load leaves an empty sheet
 * in `document.styleSheets`, and an aborted one a sheet whose rules throw.
 */
export async function expectItemSheetsApplied(
  page: Page,
  items: readonly string[],
): Promise<void> {
  for (const item of items) {
    await expect(
      page.locator(`head link[data-ngx-yeti-styles="${item}"]`),
    ).toHaveCount(1);
  }

  await expect
    .poll(
      () =>
        page.evaluate(
          (names) =>
            [...document.styleSheets].filter((sheet) => {
              const { ownerNode } = sheet;

              if (
                !(ownerNode instanceof HTMLLinkElement) ||
                !names.includes(ownerNode.dataset['ngxYetiStyles'] ?? '')
              ) {
                return false;
              }

              try {
                return sheet.cssRules.length > 0;
              } catch {
                return false;
              }
            }).length,
          items,
        ),
      { message: 'item sheets loaded with rules' },
    )
    .toBe(items.length);
}
