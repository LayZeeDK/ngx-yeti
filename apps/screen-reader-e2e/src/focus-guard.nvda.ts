import { acceptsFocusReport, activate, foregroundTitle } from './support/nvda';
import { expect, startMarkerText, test } from './support/screen-reader';

test('the lane sends no key while another window has the foreground', async ({
  lane,
  playwright,
  browserName,
  launchOptions,
}) => {
  await lane.open('card--list');

  // A decoy window of its own browser, with a focused text field that
  // records every key it receives.
  const decoyBrowser = await playwright[browserName].launch({
    ...launchOptions,
    headless: false,
  });

  try {
    const decoy = await decoyBrowser.newPage();

    await decoy.setContent(
      '<input aria-label="Decoy" onkeydown="document.body.dataset.keys = (document.body.dataset.keys ?? \'\') + event.key + \' \'">',
    );
    await decoy.getByLabel('Decoy').focus();
    const token = await activate(decoy, 'decoy');
    const title = await foregroundTitle();

    expect(title).toContain(token);

    await expect.soft(lane.top()).rejects.toThrow(title);
    await expect.soft(lane.nextListItem()).rejects.toThrow(title);
    await expect.soft(decoy.locator('body')).not.toHaveAttribute('data-keys');
  } finally {
    await decoyBrowser.close();
  }
});

test('the lane accepts only a focus report of its own story', () => {
  // NVDA 2026.2's focus report for the card--list story window, recorded by
  // T004 on 2026-10-10: NVDA speaks the title token with a space inside it.
  const token = 'screen-reader-e2e-518862816';

  expect(
    acceptsFocusReport(
      ['screen-reader-e 2e-518862816, document, focused, read only'],
      token,
    ),
  ).toBe(true);
  expect(acceptsFocusReport([startMarkerText], token)).toBe(true);
  expect(
    acceptsFocusReport(['Untitled - Notepad, document, focused'], token),
  ).toBe(false);
});
