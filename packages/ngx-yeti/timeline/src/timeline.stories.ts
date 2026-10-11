import { signal, type WritableSignal } from '@angular/core';
import {
  composite,
  contrastRatio,
  itemStylesLoaded,
  parseColor,
  type SrgbColor,
} from '@ngx-yeti/testing';
import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import type { YetiGap } from 'ngx-yeti';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import manifest from 'yeti-css/manifest';
import { withColorScheme } from '../../.storybook/decorators';
import { YetiTimeline } from './timeline';

/** The values of one of the timeline's enum attributes, from Yeti's manifest. */
function timelineValues(name: string): readonly string[] {
  return (
    manifest.components.timeline.attributes.find(
      (attribute) => attribute.name === name,
    )?.values ?? []
  );
}

interface TimelineState {
  readonly gap: YetiGap | undefined;
  readonly alternate: boolean;
}

const unset: TimelineState = { gap: undefined, alternate: false };

/**
 * The inputs the inputs story binds, by story id, so its play function can
 * change them the way a Storybook control does.
 */
const timelineStates = new Map<string, WritableSignal<TimelineState>>();

function timelineState(id: string): WritableSignal<TimelineState> {
  const state = timelineStates.get(id);

  if (state === undefined) {
    throw new Error(`No timeline state for the story ${id}`);
  }

  return state;
}

function byTestId(root: Element, id: string): HTMLElement {
  const element = root.querySelector(`[data-testid="${id}"]`);

  if (!(element instanceof HTMLElement)) {
    throw new Error(`No element ${id}`);
  }

  return element;
}

function entries(list: HTMLElement): HTMLElement[] {
  return [...list.children].filter((child) => child instanceof HTMLElement);
}

/**
 * The used length of a public token in `scope`, read from a probe, so an
 * assertion holds for any token value.
 */
function tokenLength(scope: HTMLElement, token: string): number {
  const probe = document.createElement('div');
  probe.style.blockSize = `var(${token})`;
  scope.append(probe);
  const { height } = probe.getBoundingClientRect();
  probe.remove();

  return height;
}

/**
 * Waits for the timeline's item file to apply. Chromium and WebKit can keep
 * stale computed styles right after a stylesheet is inserted (upstream bug
 * O2).
 */
async function timelineStyled(list: HTMLElement): Promise<void> {
  await itemStylesLoaded('timeline');

  await waitFor(async () => {
    await expect(getComputedStyle(list).display).toBe('flex');
  });
}

interface Box {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

/** An element's `::before` box, from its used position and size. */
function beforeBox(element: HTMLElement): Box {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element, '::before');
  const left = rect.left + parseFloat(style.left);
  const top = rect.top + parseFloat(style.top);

  return {
    left,
    right: left + parseFloat(style.width),
    top,
    bottom: top + parseFloat(style.height),
  };
}

function centre({ left, right }: Box): number {
  return (left + right) / 2;
}

function intersects(a: Box, b: Box): boolean {
  return (
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
  );
}

async function expectClose(actual: number, expected: number): Promise<void> {
  await expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
}

/** The rail is drawn, and every entry's dot is drawn. */
async function expectRailAndDots(list: HTMLElement): Promise<void> {
  await expect(getComputedStyle(list, '::before').content).not.toBe('none');

  for (const entry of entries(list)) {
    await expect(getComputedStyle(entry, '::before').content).not.toBe('none');
  }
}

/** Single-sided: every entry starts at the same edge. */
async function expectSingleSided(list: HTMLElement): Promise<void> {
  const lefts = entries(list).map((entry) =>
    Math.round(entry.getBoundingClientRect().left),
  );

  await expect(new Set(lefts).size).toBe(1);
}

/**
 * Alternating: a centred rail, the first entry on the start side and the
 * second on the end side, and each entry below the one before it.
 */
async function expectAlternating(
  list: HTMLElement,
  dir: 'ltr' | 'rtl' = 'ltr',
): Promise<void> {
  const box = list.getBoundingClientRect();
  const middle = (box.left + box.right) / 2;

  await expectClose(centre(beforeBox(list)), middle);

  for (const [index, entry] of entries(list).entries()) {
    const rect = entry.getBoundingClientRect();
    const onStartSide = index % 2 === 0;

    if (onStartSide === (dir === 'ltr')) {
      await expect(rect.right).toBeLessThanOrEqual(middle);
    } else {
      await expect(rect.left).toBeGreaterThanOrEqual(middle);
    }
  }

  await expectSourceOrderDownwards(list);
}

/** Each entry's top is below the previous entry's top. */
async function expectSourceOrderDownwards(list: HTMLElement): Promise<void> {
  const tops = entries(list).map((entry) => entry.getBoundingClientRect().top);

  for (const [index, top] of tops.entries()) {
    const previous = tops[index - 1];

    if (previous !== undefined) {
      await expect(top).toBeGreaterThan(previous);
    }
  }
}

/** No entry's dot lies over its own date. */
async function expectDotsClearOfDates(list: HTMLElement): Promise<void> {
  for (const entry of entries(list)) {
    const time = entry.querySelector('time');

    if (time === null) {
      throw new Error('An entry lacks its time');
    }

    await expect(
      intersects(beforeBox(entry), time.getBoundingClientRect()),
    ).toBe(false);
  }
}

/**
 * The colour an element's text is painted on: its own background and its
 * ancestors' composited down to the nearest opaque one.
 */
function effectiveBackground(element: Element): SrgbColor {
  const layers: string[] = [];

  for (
    let node: Element | null = element;
    node !== null;
    node = node.parentElement
  ) {
    const { backgroundColor } = getComputedStyle(node);

    if (parseColor(backgroundColor).alpha === 1) {
      return layers.reduceRight<SrgbColor>(
        (backdrop, layer) => composite(layer, backdrop),
        parseColor(backgroundColor),
      );
    }

    layers.push(backgroundColor);
  }

  throw new Error('No opaque background behind the element');
}

/**
 * A11Y-10a: after the dots are shown clear of the dates, the exact WCAG
 * ratio of every date, heading, and paragraph on its effective background,
 * unrounded, at least 4.5:1 (ticket 50 decision 8).
 */
async function expectReadable(list: HTMLElement): Promise<void> {
  await expectDotsClearOfDates(list);

  const texts = [...list.querySelectorAll<HTMLElement>('time, h3, p')];

  await expect(texts.length).toBeGreaterThan(0);

  for (const text of texts) {
    await expect(
      contrastRatio(getComputedStyle(text).color, effectiveBackground(text)),
    ).toBeGreaterThanOrEqual(4.5);
  }
}

/** The single-sided geometry: each dot on the rail, the entries one gap apart. */
async function expectSingleGeometry(list: HTMLElement): Promise<void> {
  const rail = centre(beforeBox(list));
  const items = entries(list);

  for (const entry of items) {
    await expectClose(centre(beforeBox(entry)), rail);
  }

  await expectSingleSided(list);

  const gap = tokenLength(list.parentElement ?? list, '--yeti-space-lg');

  for (const [index, entry] of items.entries()) {
    const previous = items[index - 1];

    if (previous !== undefined) {
      await expectClose(
        entry.getBoundingClientRect().top -
          previous.getBoundingClientRect().bottom,
        gap,
      );
    }
  }
}

const exampleEntries = `
  <li><time datetime="2026-09-12">12 September</time><h3>The plan</h3><p>Twelve layouts on paper.</p></li>
  <li><time datetime="2026-09-13">13 September</time><h3>The layouts</h3><p>Fifteen of them, in the browser.</p></li>
  <li><time datetime="2026-09-14">14 September</time><h3>The components</h3><p>Eight, and two themes.</p></li>`;

/** Yeti's example, alternating, in a frame of the given width. */
function alternating(width: string, testId = 'timeline'): string {
  return `
    <div data-testid="frame" style="inline-size: ${width}">
      <ol data-testid="${testId}" yetiTimeline alternate role="list">${exampleEntries}</ol>
    </div>`;
}

/** Yeti's example, single-sided, in a 70rem frame. */
const singleSided = `
  <div style="inline-size: 70rem">
    <ol data-testid="single" yetiTimeline role="list">${exampleEntries}</ol>
  </div>`;

const meta: Meta<YetiTimeline> = {
  id: 'timeline',
  component: YetiTimeline,
  decorators: [moduleMetadata({ imports: [YetiTimeline] })],
};
export default meta;

type Story = StoryObj<YetiTimeline>;

/**
 * Yeti's example with `alternate` in a 70rem frame (timeline spec, section
 * 8), with the A11Y-10a contrast assertions.
 */
export const Default: Story = {
  render: () => ({ template: alternating('70rem') }),
  play: async ({ canvas, canvasElement }) => {
    const list = byTestId(canvasElement, 'timeline');

    await expect(list).toHaveAttribute('class', 'timeline');
    await expect(list).toHaveAttribute('data-alternate', '');
    await expect(list).toHaveAttribute('data-ngx-yeti-item-timeline', '');
    await expect(list).not.toHaveAttribute('data-gap');
    await expect(list).toHaveAttribute('role', 'list');

    const [semantic, ...others] = canvas.getAllByRole('list');

    await expect(others).toStrictEqual([]);
    await expect(semantic).toBe(list);

    const items = within(list).getAllByRole('listitem');

    await expect(items).toHaveLength(3);

    for (const item of items) {
      await expect(within(item).getAllByRole('heading')).toHaveLength(1);
    }

    await timelineStyled(list);
    await expectRailAndDots(list);
    await expectAlternating(list);
    await expectReadable(list);
  },
};

/** Yeti's fixture without `alternate`: a rail down the start edge. */
export const Single: Story = {
  render: () => ({ template: singleSided }),
  play: async ({ canvasElement }) => {
    const list = byTestId(canvasElement, 'single');

    await expect(list).not.toHaveAttribute('data-alternate');
    await timelineStyled(list);
    await expectRailAndDots(list);
    await expectSingleGeometry(list);
    await expectReadable(list);
  },
};

/**
 * The alternating example in a 30rem frame, single-sided, then widened past
 * the 48rem threshold and narrowed again: the list's own width decides.
 */
export const Narrow: Story = {
  render: () => ({ template: alternating('30rem') }),
  play: async ({ canvasElement }) => {
    const frame = byTestId(canvasElement, 'frame');
    const list = byTestId(canvasElement, 'timeline');

    await timelineStyled(list);
    await expectSingleSided(list);

    frame.style.inlineSize = '70rem';
    await waitFor(async () => {
      await expectAlternating(list);
    });

    frame.style.inlineSize = '30rem';
    await waitFor(async () => {
      await expectSingleSided(list);
    });
  },
};

/** The alternating and the single-sided example on Yeti's dark page surface. */
export const DarkScheme: Story = {
  decorators: [withColorScheme('dark')],
  render: () => ({ template: alternating('70rem') + singleSided }),
  play: async ({ canvasElement }) => {
    const alternatingList = byTestId(canvasElement, 'timeline');
    const singleList = byTestId(canvasElement, 'single');

    await expect(getComputedStyle(alternatingList).colorScheme).toBe('dark');
    await timelineStyled(alternatingList);
    await expectReadable(alternatingList);
    await expectReadable(singleList);
  },
};

/** `gap` and `alternate`, set and reset as a Storybook control would. */
export const Inputs: Story = {
  argTypes: {
    // Yeti's vocabulary, which the contract spec proves equal to the input's
    // type, so a pin move that adds a value adds its option.
    gap: { control: 'select', options: timelineValues('data-gap') },
    alternate: { control: 'boolean' },
  },
  render: (args, { id }) => {
    const state = signal<TimelineState>({
      gap: args.gap,
      alternate: args.alternate === true,
    });
    timelineStates.set(id, state);

    // Template props are named unlike the inputs, which they would collide
    // with once `component` is set.
    return {
      props: { state },
      template: `
        <div data-testid="frame" style="inline-size: 70rem">
          <ol data-testid="timeline" yetiTimeline role="list" [gap]="state().gap" [alternate]="state().alternate">${exampleEntries}</ol>
        </div>`,
    };
  },
  play: async ({ canvasElement, id }) => {
    const state = timelineState(id);
    const frame = byTestId(canvasElement, 'frame');
    const list = byTestId(canvasElement, 'timeline');
    const [first, second] = entries(list);

    if (first === undefined || second === undefined) {
      throw new Error('The timeline lacks an entry');
    }

    await timelineStyled(list);

    state.set({ ...unset, gap: 'xl' });
    await waitFor(async () => {
      await expect(list).toHaveAttribute('data-gap', 'xl');
    });
    await waitFor(async () => {
      await expectClose(
        second.getBoundingClientRect().top -
          first.getBoundingClientRect().bottom,
        tokenLength(frame, '--yeti-space-xl'),
      );
    });

    state.set(unset);
    await waitFor(async () => {
      await expect(list).not.toHaveAttribute('data-gap');
    });

    state.set({ ...unset, alternate: true });
    await waitFor(async () => {
      await expect(list).toHaveAttribute('data-alternate', '');
    });

    state.set(unset);
    await waitFor(async () => {
      await expect(list).not.toHaveAttribute('data-alternate');
    });
  },
};

/** Four entries, each with a link, in a 70rem alternating frame. */
export const Links: Story = {
  render: () => ({
    template: `
      <div style="inline-size: 70rem">
        <ol data-testid="timeline" yetiTimeline alternate role="list">
          @for (entry of [1, 2, 3, 4]; track entry) {
            <li>
              <time [attr.datetime]="'2026-09-1' + entry">{{ entry }} September</time>
              <h3><a [href]="'#release-' + entry">Release {{ entry }}</a></h3>
            </li>
          }
        </ol>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const list = byTestId(canvasElement, 'timeline');
    const links = within(list).getAllByRole('link');

    await expect(links).toHaveLength(4);
    await timelineStyled(list);

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    let previousTop = -Infinity;

    for (const link of links) {
      await userEvent.tab();
      await expect(link).toHaveFocus();

      const { top } = link.getBoundingClientRect();

      await expect(top).toBeGreaterThan(previousTop);
      previousTop = top;
    }
  },
};

/**
 * The alternating and the single-sided example, each entry with a link,
 * inside `dir="rtl"`: the logical rail and sides mirror, and Tab still
 * follows source order.
 */
export const Rtl: Story = {
  render: () => ({
    template: `
      <div dir="rtl" style="inline-size: 70rem">
        @for (mode of ['alternate', 'single']; track mode) {
          <ol [attr.data-testid]="mode" yetiTimeline [alternate]="mode === 'alternate'" role="list">
            @for (entry of [12, 13, 14]; track entry) {
              <li>
                <time [attr.datetime]="'2026-09-' + entry">{{ entry }} September</time>
                <h3><a [href]="'#' + mode + '-' + entry">Entry {{ entry }}</a></h3>
              </li>
            }
          </ol>
        }
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const alternatingList = byTestId(canvasElement, 'alternate');
    const singleList = byTestId(canvasElement, 'single');

    await timelineStyled(alternatingList);
    await expectAlternating(alternatingList, 'rtl');

    const box = singleList.getBoundingClientRect();
    const rail = centre(beforeBox(singleList));

    await expect(rail).toBeGreaterThan((box.left + box.right) / 2);
    await expect(box.right - rail).toBeLessThanOrEqual(
      tokenLength(singleList, '--yeti-space-lg'),
    );

    for (const entry of entries(singleList)) {
      await expectClose(centre(beforeBox(entry)), rail);
    }

    await expectSingleSided(singleList);

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    for (const link of within(canvasElement).getAllByRole('link')) {
      await userEvent.tab();
      await expect(link).toHaveFocus();
    }
  },
};
