import {
  dropListRole,
  expect,
  inOrder,
  laneName,
  test,
  walk,
  type LaneName,
} from './support/screen-reader';

const names = ['One', 'Two', 'Three', 'Four', 'Five'];

/**
 * What each reader says on grid--default, as substrings in spoken order.
 * `steps` is how many times the test moves the reader on through the list
 * after it arrives.
 */
const lanes = {
  // NVDA's list item key reaches the four other boxes, then finds no sixth.
  nvda: {
    steps: 5,
    heard: ['list, with 5 items', ...names, 'no next list item'],
  },
  voiceover: {
    steps: 5,
    heard: ['list', '5 items', ...names],
  },
} satisfies Record<LaneName, { steps: number; heard: string[] }>;

test('grid--default is announced as a list with its count and each box as an item', async ({
  lane,
}) => {
  const { steps, heard } = lanes[lane.name];

  await lane.open('grid--default');

  expect(inOrder(await walk(lane, steps, 'nextListItem'), heard)).toEqual(
    heard,
  );
});

// Chromium and Gecko keep a ul a list whatever its markers, so only WebKit
// has a list for the role to restore.
if (laneName() === 'voiceover') {
  test('grid--default without role="list" is not announced as a list', async ({
    lane,
  }) => {
    await lane.open('grid--default');
    await lane.change(dropListRole, '[data-testid="grid"]');
    const heard = await walk(lane, lanes.voiceover.steps, 'nextListItem');

    expect(inOrder(heard, names)).toEqual(names);
    expect(heard.join('\n')).not.toMatch(/\blist\b/i);
  });
}
