import { DestroyRef, inject } from '@angular/core';
import type { YetiComponentName } from 'ngx-yeti';
import { YetiStyles } from './yeti-styles';

/**
 * Loads an item's Yeti file for as long as the calling directive lives: one
 * counted `<link rel="stylesheet">` in `<head>`, shared by every host of the
 * item, written on the server, adopted at hydration, inserted in `yeti.css`'s
 * order, and removed in the frame after the count is zero and no element
 * carrying `data-ngx-yeti-item-<item>` is connected (ADR 0060 points 2 to 5).
 *
 * Call it in an injection context as the last statement of an item root
 * directive's constructor, after anything there that can throw, so a
 * constructor error leaks no count (setup spec section 3; ticket 50 decision
 * 42). It registers the release on the caller's `DestroyRef` before it
 * acquires, so the release always runs when the directive is destroyed.
 *
 * The consumer's part is the setup spec's one-time setup, usage rules 1 to 7
 * in particular: Yeti's build at the pin, the `assets` entry, and the global
 * stylesheet. Never write a `data-ngx-yeti-*` attribute by hand (usage rule
 * 7), and put a `@boundary` inside a `@defer` block, not only around it
 * (usage rule 11).
 */
export function injectYetiItemStyles(item: YetiComponentName): void {
  const styles = inject(YetiStyles);

  inject(DestroyRef).onDestroy(() => {
    styles.release(item);
  });
  styles.acquire(item);
}
