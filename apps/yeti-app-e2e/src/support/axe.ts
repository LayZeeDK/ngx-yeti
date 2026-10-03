import { AxeBuilder } from '@axe-core/playwright';
import { wcagTags } from '@ngx-yeti/testing';
import { type Page } from '@playwright/test';
import axe from 'axe-core';

/**
 * With JavaScript disabled, Playwright still evaluates scripts, but timers
 * never fire, so `axe.run` never settles (measured in Chromium and WebKit).
 * axe only uses `setTimeout` to yield, so a microtask does the same job
 * there. Page scripts never run on such a page, so nothing else sees the
 * change. Firefox runs no microtask on such a page either, so the fixture
 * skips axe there (measured).
 */
const microtaskTimers = `window.setTimeout = (callback) => {
  Promise.resolve().then(callback);
  return 0;
};
`;

/**
 * One `id: help (targets)` line per violation, like `ngx-yeti-e2e`. Tests
 * use it through the `axeViolations` fixture of `fixtures.ts`.
 */
export async function axeViolations(
  page: Page,
  javaScriptEnabled: boolean,
): Promise<string[]> {
  const { violations } = await new AxeBuilder({
    page,
    ...(javaScriptEnabled ? {} : { axeSource: microtaskTimers + axe.source }),
  })
    .withTags([...wcagTags])
    .analyze();

  return violations.map(
    ({ id, help, nodes }) =>
      `${id}: ${help} (${nodes.map(({ target }) => target.join(' ')).join(', ')})`,
  );
}
