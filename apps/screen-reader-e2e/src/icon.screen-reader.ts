import {
  expect,
  inOrder,
  test,
  walk,
  type LaneName,
} from './support/screen-reader';

/**
 * What each reader says, as substrings in spoken order. `image` is the
 * reader's word for an image role, and `steps` is how many times the test
 * moves the reader on after it arrives in the story.
 */
const lanes = {
  nvda: {
    image: 'graphic',
    steps: 3,
    decorative: ['link', 'Download', 'button', 'Save'],
    standalone: ['button', 'Close', 'graphic', 'Warning'],
  },
  voiceover: {
    image: 'image',
    steps: 4,
    decorative: ['Download', 'link', 'Save', 'button'],
    standalone: ['Close', 'Warning', 'image'],
  },
} satisfies Record<
  LaneName,
  { image: string; steps: number; decorative: string[]; standalone: string[] }
>;

/** Runs in the page: takes `aria-hidden` off the SVG `selector` names. */
function exposeSvg(selector: string): void {
  const svg = document.querySelector(selector);

  if (!svg?.hasAttribute('aria-hidden')) {
    throw new Error(`No hidden SVG matches ${selector}`);
  }

  svg.removeAttribute('aria-hidden');
}

/**
 * Runs in the page: takes `aria-hidden` off the SVG `selector` names and
 * makes it a named image, which every reader announces.
 */
function exposeImage(selector: string): void {
  const svg = document.querySelector(selector);

  if (!svg?.hasAttribute('aria-hidden')) {
    throw new Error(`No hidden SVG matches ${selector}`);
  }

  svg.removeAttribute('aria-hidden');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Arrow');
}

test('icon--default: a decorative SVG adds no image to the name of its link or button', async ({
  lane,
}) => {
  const { image, steps, decorative } = lanes[lane.name];

  await lane.open('icon--default');
  const heard = await walk(lane, steps, 'next');

  expect(inOrder(heard, decorative)).toEqual(decorative);
  expect(heard.join('\n')).not.toContain(image);
});

test('icon--default: the SVG without aria-hidden, as a named image, adds an image to its link', async ({
  lane,
}, testInfo) => {
  const { image, steps } = lanes[lane.name];

  // A measurement, not an assertion: with only aria-hidden removed, the SVG
  // has no role and no name, and NVDA skips it in Chromium and Gecko.
  await lane.open('icon--default');
  await lane.change(exposeSvg, 'a > svg');
  const bare = await walk(lane, steps, 'next');

  testInfo.annotations.push({
    type: 'icon SVG without aria-hidden',
    description: `${bare.join('\n').includes(image) ? 'adds' : 'adds no'} "${image}" in ${lane.name} in ${testInfo.project.name}: ${JSON.stringify(bare)}`,
  });

  await lane.open('icon--default');
  await lane.change(exposeImage, 'a > svg');
  const heard = await walk(lane, steps, 'next');

  expect(inOrder(heard, ['Arrow', 'Download'])).toEqual(['Arrow', 'Download']);
  expect(heard.join('\n')).toContain(image);
});

test('icon--standalone: a meaningful SVG is announced with its name as an image', async ({
  lane,
}) => {
  const { steps, standalone } = lanes[lane.name];

  await lane.open('icon--standalone');

  expect(inOrder(await walk(lane, steps, 'next'), standalone)).toEqual(
    standalone,
  );
});
