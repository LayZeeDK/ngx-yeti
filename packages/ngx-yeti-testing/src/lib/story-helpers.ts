import type { YetiComponent, YetiComponentName } from 'yeti-css';
import { itemStylesLoaded } from './item-links';

/**
 * Resolves once `item`'s file has loaded with rules and `element`'s computed
 * `property` equals `expected` or satisfies it, checking every animation
 * frame. Rejects after `timeout` ms (5000 unless given) with an Error naming
 * the item, the property, and the last value read.
 *
 * A loaded file is not an applied one: Chromium and WebKit can keep stale
 * computed styles right after a stylesheet is inserted (upstream bug O2). So
 * wait on a property the item's file sets and the page's defaults do not,
 * before reading geometry or colour that depends on the file.
 */
export async function itemStyled(
  item: YetiComponentName,
  element: Element,
  property: string,
  expected: string | ((value: string) => boolean),
  options: { readonly timeout?: number } = {},
): Promise<void> {
  const timeout = options.timeout ?? 5000;
  const deadline = performance.now() + timeout;
  const matches =
    typeof expected === 'string'
      ? (value: string): boolean => value === expected
      : expected;
  const read = (): string =>
    getComputedStyle(element).getPropertyValue(property);

  await itemStylesLoaded(item);

  for (let value = read(); !matches(value); value = read()) {
    if (performance.now() >= deadline) {
      throw new Error(
        `The ${item} file did not style ${property} within ${String(timeout)} ms; the last value read was "${value}"`,
      );
    }

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  }
}

/**
 * The used px size of a CSS length where `root` sits, read from a probe
 * appended to it, so an assertion holds for any token value. The probe is
 * absolutely positioned, so it takes no flex or grid cell.
 */
export function usedLength(
  root: Element,
  length: string,
  axis: 'inline' | 'block' = 'inline',
): number {
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.setProperty(
    axis === 'inline' ? 'inline-size' : 'block-size',
    length,
  );
  root.append(probe);
  const { width, height } = probe.getBoundingClientRect();
  probe.remove();

  return axis === 'inline' ? width : height;
}

export function elementChildren(parent: Element): HTMLElement[] {
  return [...parent.children].filter((child) => child instanceof HTMLElement);
}

/**
 * Throws an Error naming both numbers when they differ by more than
 * `tolerance` (1 unless given), or when either is not a number.
 */
export function assertWithin(
  actual: number,
  expected: number,
  tolerance = 1,
): void {
  if (!(Math.abs(actual - expected) <= tolerance)) {
    throw new Error(
      `Expected ${String(actual)} to be within ${String(tolerance)} of ${String(expected)}`,
    );
  }
}

/** The values of one attribute of a manifest component, or an empty list. */
export function manifestValues(
  component: YetiComponent,
  attribute: string,
): readonly string[] {
  return (
    component.attributes.find(({ name }) => name === attribute)?.values ?? []
  );
}

/**
 * One state per story id of `item`, so a play function can change what its
 * story's render bound, the way a Storybook control does.
 */
export function storyStates<T>(item: string): {
  track(id: string, state: T): T;
  get(id: string): T;
} {
  const states = new Map<string, T>();

  return {
    track(id, state) {
      states.set(id, state);

      return state;
    },
    get(id) {
      const state = states.get(id);

      if (state === undefined) {
        throw new Error(`No ${item} state for the story ${id}`);
      }

      return state;
    },
  };
}
