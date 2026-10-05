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

/** The item name of every item link in `<head>`, in document order. */
export function itemNames(): (string | null)[] {
  return itemLinks().map((link) => link.getAttribute('data-ngx-yeti-styles'));
}

/** The `href` of every style preload link in `<head>`, in document order. */
export function preloadHrefs(): (string | null)[] {
  return [
    ...document.head.querySelectorAll('link[rel="preload"][as="style"]'),
  ].map((link) => link.getAttribute('href'));
}

/**
 * Removes the item, preload, and prefetch links an earlier test left in the
 * shared document.
 */
export function removeItemLinks(): void {
  for (const link of document.head.querySelectorAll(
    'link[data-ngx-yeti-styles], link[rel="preload"], link[rel="prefetch"]',
  )) {
    link.remove();
  }
}

/** Whether `sheet` exists and has a rule it can read. */
function hasRules(sheet: CSSStyleSheet | null): boolean {
  try {
    return (sheet?.cssRules.length ?? 0) > 0;
  } catch {
    // An aborted load leaves a sheet whose rules throw a SecurityError.
    return false;
  }
}

/**
 * Resolves once `link`'s stylesheet has loaded with at least one rule. Rejects
 * with an Error naming the href if it fails to load or the link leaves the
 * document while it is pending.
 */
export async function stylesheetLoaded(link: HTMLLinkElement): Promise<void> {
  if (link.sheet === null) {
    // A failed load still sets an empty sheet, and Chromium fires `load` for
    // a 200 served as text/html, so either event only ends the wait. A link
    // removed while pending fires neither.
    await new Promise<void>((resolve, reject) => {
      const removal = new MutationObserver(() => {
        if (!link.isConnected) {
          stop();
          reject(new Error(`${link.href} was removed before it loaded`));
        }
      });
      const settle = (): void => {
        stop();
        resolve();
      };
      const stop = (): void => {
        removal.disconnect();
        link.removeEventListener('load', settle);
        link.removeEventListener('error', settle);
      };

      if (!link.isConnected) {
        reject(new Error(`${link.href} is not in the document`));

        return;
      }

      removal.observe(document, { childList: true, subtree: true });
      link.addEventListener('load', settle);
      link.addEventListener('error', settle);
    });
  }

  if (!hasRules(link.sheet)) {
    throw new Error(`${link.href} did not load a stylesheet with rules`);
  }
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
