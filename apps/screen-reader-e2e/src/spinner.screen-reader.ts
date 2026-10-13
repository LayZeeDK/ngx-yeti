import { clickButton, expect, test } from './support/screen-reader';

// Long enough for a polite live region to be spoken after the click.
const settle = 3000;

function times(phrases: readonly string[], text: string): number {
  return phrases.join('\n').split(text).length - 1;
}

test('spinner--waiting: the inserted status is recorded and the end of the wait is spoken once', async ({
  lane,
}, testInfo) => {
  await lane.open('spinner--waiting');

  const inserted = await lane.change(clickButton, 'Load', settle);
  const announced = times(inserted, 'Loading');

  // A measurement, not an assertion: whether a reader announces a status
  // region inserted with a name and no text is what the spec asks to record.
  testInfo.annotations.push({
    type: 'spinner inserted status',
    description: `"Loading" spoken ${announced === 0 ? 'not at all' : announced === 1 ? 'once' : `${String(announced)} times`} by ${lane.name} in ${testInfo.project.name}: ${JSON.stringify(inserted)}`,
  });
  expect(times(inserted, 'Loaded 12 posts')).toBe(0);

  const finished = await lane.change(clickButton, 'Finish', settle);

  expect(times(finished, 'Loaded 12 posts')).toBe(1);
});
