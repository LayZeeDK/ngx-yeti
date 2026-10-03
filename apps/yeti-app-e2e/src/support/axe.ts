import { AxeBuilder } from '@axe-core/playwright';
import { wcagTags } from '@ngx-yeti/testing';
import { type Page } from '@playwright/test';
import axe from 'axe-core';
import { noScriptPages } from './fixtures';

type AxeViolations = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'];

/**
 * With JavaScript disabled, Playwright still evaluates scripts, but timers
 * never fire, so `axe.run` never settles (measured in Chromium and WebKit).
 * axe only uses `setTimeout` to yield, so a microtask does the same job
 * there. Page scripts never run on such a page, so nothing else sees the
 * change.
 */
const microtaskTimers = `window.setTimeout = (callback) => {
  Promise.resolve().then(callback);
  return 0;
};
`;

/** Firefox runs no microtask on a JavaScript-disabled page (measured). */
export const axeRunsWithoutJavaScript = (browserName: string): boolean =>
  browserName !== 'firefox';

/** Runs axe on the page with the six tags every accessibility check uses. */
export async function axeViolations(page: Page): Promise<AxeViolations> {
  const browserName = page.context().browser()?.browserType().name() ?? '';

  if (noScriptPages.has(page) && !axeRunsWithoutJavaScript(browserName)) {
    throw new Error(
      `axe cannot run on a JavaScript-disabled page in ${browserName}`,
    );
  }

  const { violations } = await new AxeBuilder({
    page,
    ...(noScriptPages.has(page)
      ? { axeSource: microtaskTimers + axe.source }
      : {}),
  })
    .withTags([...wcagTags])
    .analyze();

  return violations;
}
