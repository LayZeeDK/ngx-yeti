import {
  dropListRole,
  expect,
  inOrder,
  laneName,
  test,
  walk,
  type LaneName,
} from './support/screen-reader';

const entries = ['The plan', 'The layouts', 'The components'];

/**
 * What each reader says on timeline--default, as substrings in spoken
 * order. `steps` is how many times the test moves the reader on through the
 * list after it arrives.
 */
const lanes = {
  // Down from the start marker, NVDA enters the list on the first entry's
  // date line; its list item key then reads each other entry whole, and
  // finds no fourth.
  nvda: {
    steps: 3,
    heard: [
      'list, with 3 items',
      '12 September',
      '13 September',
      'The layouts',
      '14 September',
      'The components',
      'no next list item',
    ],
  },
  // VoiceOver, walked item by item with VO-Right, stops on each entry's
  // date, heading and paragraph.
  voiceover: {
    steps: 10,
    heard: ['list', '3 items', ...entries],
  },
} satisfies Record<LaneName, { steps: number; heard: string[] }>;

test('timeline--default is announced as a list with its count and each entry as an item', async ({
  lane,
}) => {
  const { steps, heard } = lanes[lane.name];

  await lane.open('timeline--default');

  expect(inOrder(await walk(lane, steps, 'nextListItem'), heard)).toEqual(
    heard,
  );
});

// Chromium and Gecko keep an ol a list whatever its markers, so only WebKit
// has a list for the role to restore.
if (laneName() === 'voiceover') {
  test('timeline--default without role="list" is not announced as a list', async ({
    lane,
  }) => {
    await lane.open('timeline--default');
    await lane.change(dropListRole, 'ol');
    const heard = await walk(lane, lanes.voiceover.steps, 'nextListItem');

    expect(inOrder(heard, entries)).toEqual(entries);
    expect(heard.join('\n')).not.toMatch(/\blist\b/i);
  });
}
