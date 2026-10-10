import { expect, test, type LaneName } from './support/screen-reader';

const titles = ['Weekend in the hills', 'A day by the lake', 'The coast path'];

/**
 * What each reader says on card--list, as substrings in spoken order
 * (INTENT E16: wording varies by reader and version). `steps` is how many
 * times the test moves the reader on through the list after it arrives.
 */
const lanes = {
  // NVDA 2026.2 in Edge 154 and Playwright's Chromium 153 and Firefox 155,
  // recorded 2026-10-10. Down from the start marker enters the list at the
  // first card; NVDA's list item key reaches the two other cards, then
  // finds no fourth.
  nvda: {
    steps: 3,
    heard: ['list, with 3 items', ...titles, 'no next list item'],
  },
  // VoiceOver in real Safari, walked item by item with VO-Right, which may
  // stop on each card's heading and paragraph. Not yet measured: the first
  // CI run records the phrases, and these substrings follow them.
  voiceover: {
    steps: 8,
    heard: ['list', '3 items', ...titles],
  },
} satisfies Record<LaneName, { steps: number; heard: string[] }>;

test('card--list is announced as a list with its count and each card as an item', async ({
  lane,
}) => {
  const { steps, heard } = lanes[lane.name];

  await lane.open('card--list');
  // Only what the moves made the reader say: the arrival may read the whole
  // page.
  const walk = await lane.top();

  for (let step = 0; step < steps; step++) {
    walk.push(...(await lane.nextListItem()));
  }

  expect(inOrder(walk, heard)).toEqual(heard);
});

/**
 * The longest prefix of `expected` found in `phrases`, each substring after
 * the one before it, so a failure shows which phrase is missing.
 */
function inOrder(phrases: readonly string[], expected: string[]): string[] {
  const transcript = phrases.join('\n');
  const found: string[] = [];
  let from = 0;

  for (const substring of expected) {
    const at = transcript.indexOf(substring, from);

    if (at === -1) {
      break;
    }

    found.push(substring);
    from = at + substring.length;
  }

  return found;
}
