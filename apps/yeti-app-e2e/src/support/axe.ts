import { AxeBuilder } from '@axe-core/playwright';
import { violationLines, wcagTags } from '@ngx-yeti/testing';
import { type Page } from '@playwright/test';
import axe from 'axe-core';

/**
 * With JavaScript disabled, Playwright still evaluates scripts, but timers
 * never fire, so `axe.run` never settles (measured in Chromium and WebKit).
 * axe only uses `setTimeout` to yield, so a microtask does the same job
 * there. Page scripts never run on such a page, so nothing else sees the
 * change. Firefox runs no microtask on such a page either, so the fixture
 * skips axe there (measured). The shim would also fire axe's preload
 * timeout at once and log "Couldn't load preload assets", so preload is off
 * there. axe then runs its preload rules (css-orientation-lock, which
 * `wcagTags` leaves out as experimental, and no-autoplay-audio) without the
 * preloaded CSSOM and media, as it did after that timeout.
 */
const microtaskTimers = `window.setTimeout = (callback) => {
  Promise.resolve().then(callback);
  return 0;
};
`;

/**
 * One `id: help (targets)` line per violation (`violationLines`). Tests use
 * it through the `axeViolations` fixture of `fixtures.ts`.
 */
export async function axeViolations(
  page: Page,
  javaScriptEnabled: boolean,
): Promise<string[]> {
  const { violations } = await new AxeBuilder({
    page,
    ...(javaScriptEnabled ? {} : { axeSource: microtaskTimers + axe.source }),
  })
    // options() replaces every run option, so it comes before withTags().
    .options(javaScriptEnabled ? {} : { preload: false })
    .withTags([...wcagTags])
    .analyze();

  return violationLines(violations);
}
