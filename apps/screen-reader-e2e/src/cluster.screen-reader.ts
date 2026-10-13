import {
  dropListRole,
  expect,
  inOrder,
  laneName,
  test,
  walk,
  type LaneName,
} from './support/screen-reader';

const tags = ['css', 'layout', 'intrinsic'];

/**
 * What each reader says on cluster--tags, as substrings in spoken order.
 * `steps` is how many times the test moves the reader on through the list
 * after it arrives.
 */
const lanes = {
  // NVDA's list item key reaches the two other tags, then finds no fourth.
  nvda: {
    steps: 3,
    heard: ['list, with 3 items', ...tags, 'no next list item'],
  },
  voiceover: {
    steps: 3,
    heard: ['list', '3 items', ...tags],
  },
} satisfies Record<LaneName, { steps: number; heard: string[] }>;

test('cluster--tags is announced as a list with its count and each tag as an item', async ({
  lane,
}) => {
  const { steps, heard } = lanes[lane.name];

  await lane.open('cluster--tags');

  expect(inOrder(await walk(lane, steps, 'nextListItem'), heard)).toEqual(
    heard,
  );
});

// Chromium and Gecko keep a ul a list whatever its markers, so only WebKit
// has a list for the role to restore.
if (laneName() === 'voiceover') {
  test('cluster--tags without role="list" is not announced as a list', async ({
    lane,
  }) => {
    await lane.open('cluster--tags');
    await lane.change(dropListRole, 'ul');
    const heard = await walk(lane, lanes.voiceover.steps, 'nextListItem');

    expect(inOrder(heard, tags)).toEqual(tags);
    expect(heard.join('\n')).not.toMatch(/\blist\b/i);
  });
}
