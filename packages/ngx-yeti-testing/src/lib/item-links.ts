import type { YetiComponentName } from 'yeti-css';

/**
 * The item links `ngx-yeti/styles` keeps in `<head>`, in document order: every
 * item's, or only `item`'s.
 */
export function itemLinks(item?: YetiComponentName): HTMLLinkElement[] {
  return [
    ...document.head.querySelectorAll<HTMLLinkElement>(
      item === undefined
        ? 'link[data-ngx-yeti-styles]'
        : `link[data-ngx-yeti-styles="${item}"]`,
    ),
  ];
}

/** The `href` of every style preload link in `<head>`, in document order. */
export function preloadHrefs(): (string | null)[] {
  return [
    ...document.head.querySelectorAll('link[rel="preload"][as="style"]'),
  ].map((link) => link.getAttribute('href'));
}

/**
 * Removes the item and preload links an earlier test's loader left in the
 * shared document.
 */
export function removeItemLinks(): void {
  for (const link of document.head.querySelectorAll(
    'link[data-ngx-yeti-styles], link[rel="preload"]',
  )) {
    link.remove();
  }
}

/** Resolves once `link`'s stylesheet has loaded; rejects if it fails to. */
export async function stylesheetLoaded(link: HTMLLinkElement): Promise<void> {
  if (link.sheet !== null) {
    return;
  }

  await new Promise((resolve, reject) => {
    link.addEventListener('load', resolve, { once: true });
    link.addEventListener('error', reject, { once: true });
  });
}

/** Resolves once `item`'s file has loaded; fails if it has no link. */
export async function itemStylesLoaded(item: YetiComponentName): Promise<void> {
  const [link] = itemLinks(item);

  if (link === undefined) {
    throw new Error(`No ${item} item link in <head>`);
  }

  await stylesheetLoaded(link);
}

/**
 * Resolves in the frame after the current one, past the frame the loader's
 * removal check runs in.
 */
export async function nextFrame(): Promise<void> {
  for (let frame = 0; frame < 2; frame++) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  }
}
