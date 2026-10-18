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

test('one worker opens two stories in turn, each with its document focused', async ({
  lane,
}) => {
  await lane.open('card--default');
  expect(await lane.top()).not.toEqual([]);

  await lane.open('card--list');
  expect((await lane.top()).join('\n')).toContain('list, with 3 items');
});

test('the lane accepts only a focus report of its own story', () => {
  // NVDA speaks the title token with a space inside it.
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
  // NVDA on the story window's frame in Firefox: the token is there, but
  // browse-mode keys say nothing from the frame.
  expect(
    acceptsFocusReport(
      ['screen-reader-e 2e-518862816 — Nightly, frame, read only'],
      token,
    ),
  ).toBe(false);
});
