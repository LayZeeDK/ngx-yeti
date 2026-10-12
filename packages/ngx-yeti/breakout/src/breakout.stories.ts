import { NgOptimizedImage } from '@angular/common';
import { signal, type WritableSignal } from '@angular/core';
import {
  assertWithin,
  composite,
  contrastRatio,
  elementChildren,
  itemStyled,
  manifestValues,
  parseColor,
  storyStates,
  type SrgbColor,
  usedLength,
} from '@ngx-yeti/testing';
import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import type { YetiGap, YetiWidth } from 'ngx-yeti';
import { expect, waitFor } from 'storybook/test';
import manifest from 'yeti-css/manifest';
// Kept a URL in the static build too: NgOptimizedImage refuses `data:` URLs.
import trail from '../../.storybook/assets/trail.svg?no-inline';
import { withColorScheme } from '../../.storybook/decorators';
import { YetiBreakout } from './breakout';
import { YetiBreakoutChild } from './breakout-child';
import { YetiBreakoutNote } from './breakout-note';

interface BreakoutState {
  readonly max: YetiWidth | undefined;
  readonly gap: YetiGap | undefined;
  readonly bleed: boolean;
}

const unset: BreakoutState = { max: undefined, gap: undefined, bleed: false };

/**
 * The inputs the settings story binds, by story id, so its play function can
 * change them the way a Storybook control does.
 */
const breakoutStates = storyStates<WritableSignal<BreakoutState>>('breakout');

function byTestId(root: Element, id: string): HTMLElement {
  const element = root.querySelector(`[data-testid="${id}"]`);

  if (!(element instanceof HTMLElement)) {
    throw new Error(`No element ${id}`);
  }

  return element;
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
 * A11Y-10c: the exact WCAG ratio of each text on its effective background,
 * unrounded, at least 4.5:1.
 */
async function expectReadable(texts: readonly HTMLElement[]): Promise<void> {
  for (const text of texts) {
    await expect(
      contrastRatio(getComputedStyle(text).color, effectiveBackground(text)),
    ).toBeGreaterThanOrEqual(4.5);
  }
}

/**
 * Yeti's example with one note, in a frame narrower than the note's 64rem
 * threshold and wider than the column. The bleeding child stands in for a
 * `yetiFrame` until frame lands; it holds the picture.
 */
const longRead = `
  <div data-testid="frame" style="inline-size: 60rem">
    <article data-testid="breakout" yetiBreakout>
      <h1 data-testid="heading">A long read</h1>
      <p data-testid="paragraph">Every paragraph here sits in the same narrow column, because that is what a long read wants: a line short enough that the eye finds the start of the next one.</p>
      <div data-testid="bleed" yetiBreakoutChild bleed>
        <img [ngSrc]="trail" width="1600" height="900" priority alt="A mountain trail at dawn, edge to edge" />
      </div>
      <div data-testid="plain">The picture is the exception. Left in the column it would sit marooned in a sea of margin, so it is marked to bleed.</div>
      <aside data-testid="note" yetiBreakoutNote>A citation, or a caveat, that would interrupt the flow.</aside>
      <p>Then the text picks up at exactly the width it left off.</p>
    </article>
  </div>`;

/** The heading, a paragraph, and the note, as A11Y-10c checks them. */
async function expectLongReadReadable(root: HTMLElement): Promise<void> {
  const breakout = byTestId(root, 'breakout');

  await itemStyled('breakout', breakout, 'display', 'grid');
  await expectReadable([
    byTestId(root, 'heading'),
    byTestId(root, 'paragraph'),
    byTestId(root, 'note'),
  ]);
}

const meta: Meta<YetiBreakout> = {
  id: 'breakout',
  component: YetiBreakout,
  decorators: [
    moduleMetadata({
      imports: [
        YetiBreakout,
        YetiBreakoutChild,
        YetiBreakoutNote,
        NgOptimizedImage,
      ],
    }),
  ],
};
export default meta;

type Story = StoryObj<YetiBreakout>;

/**
 * Yeti's example (breakout spec, section 8) with a margin note, and the
 * A11Y-10c contrast assertions.
 */
export const Default: Story = {
  render: () => ({ props: { trail }, template: longRead }),
  play: async ({ canvasElement }) => {
    const breakout = byTestId(canvasElement, 'breakout');
    const bleed = byTestId(canvasElement, 'bleed');
    const plain = byTestId(canvasElement, 'plain');
    const note = byTestId(canvasElement, 'note');
    const children = elementChildren(breakout);

    await expect(breakout).toHaveAttribute('class', 'breakout');
    await expect(breakout).toHaveAttribute('data-ngx-yeti-item-breakout', '');
    await expect(breakout).not.toHaveAttribute('data-max');
    await expect(breakout).not.toHaveAttribute('data-gap');
    await expect(
      children.filter((child) => child.hasAttribute('data-bleed')),
    ).toStrictEqual([bleed]);
    await expect(bleed).toHaveAttribute('data-bleed', '');
    await expect(
      children.filter((child) => child.hasAttribute('data-note')),
    ).toStrictEqual([note]);
    await expect(note).toHaveAttribute('data-note', '');
    await expect(
      [breakout, ...breakout.querySelectorAll('*')].filter((element) =>
        element.matches('[role], [tabindex]'),
      ),
    ).toStrictEqual([]);

    await itemStyled('breakout', breakout, 'display', 'grid');

    const box = breakout.getBoundingClientRect();
    const column = plain.getBoundingClientRect();

    // Unset `max`, so Yeti's own maximum applies; the frame is wide enough
    // that the column reaches it.
    assertWithin(
      column.width,
      usedLength(breakout, 'var(--yeti-width-md)', 'block'),
    );
    assertWithin(column.left - box.left, box.right - column.right);
    assertWithin(bleed.getBoundingClientRect().width, box.width);
    assertWithin(bleed.getBoundingClientRect().left, box.left);

    // Reading order is source order: nothing reorders the children on
    // screen or in the accessibility tree, and each starts below the last.
    await expect(
      children.map((child) => getComputedStyle(child).order),
    ).toStrictEqual(children.map(() => '0'));
    await expect(
      breakout.querySelectorAll('[aria-owns], [aria-flowto]'),
    ).toHaveLength(0);

    const tops = children.map((child) => child.getBoundingClientRect().top);

    await expect(tops).toStrictEqual(tops.toSorted((a, b) => a - b));

    await expectLongReadReadable(canvasElement);
  },
};

/** The same long read on Yeti's dark page surface. */
export const DarkScheme: Story = {
  decorators: [withColorScheme('dark')],
  render: () => ({ props: { trail }, template: longRead }),
  play: async ({ canvasElement }) => {
    await expect(
      getComputedStyle(byTestId(canvasElement, 'breakout')).colorScheme,
    ).toBe('dark');
    await expectLongReadReadable(canvasElement);
  },
};

/** `max`, `gap`, and `bleed`, set and reset as a Storybook control would. */
export const Settings: StoryObj<
  YetiBreakout & Pick<YetiBreakoutChild, 'bleed'>
> = {
  argTypes: {
    // Yeti's vocabularies, which the contract spec proves equal to the
    // inputs' types, so a pin move that adds a value adds its option.
    max: {
      control: 'select',
      options: manifestValues(manifest.components.breakout, 'data-max'),
    },
    gap: {
      control: 'select',
      options: manifestValues(manifest.components.breakout, 'data-gap'),
    },
    bleed: { control: 'boolean' },
  },
  render: (args, { id }) => {
    const state = signal<BreakoutState>({
      max: args.max,
      gap: args.gap,
      bleed: args.bleed === true,
    });
    breakoutStates.track(id, state);

    // Template props are named unlike the inputs, which they would collide
    // with once `component` is set.
    return {
      props: { state },
      template: `
          <article data-testid="breakout" yetiBreakout [max]="state().max" [gap]="state().gap">
            <h2>A long read</h2>
            <div data-testid="child" yetiBreakoutChild [bleed]="state().bleed">The child the settings move between the column and the full width.</div>
            <p>A paragraph in the column.</p>
          </article>`,
    };
  },
  play: async ({ canvasElement, id }) => {
    const state = breakoutStates.get(id);
    const breakout = byTestId(canvasElement, 'breakout');
    const child = byTestId(canvasElement, 'child');
    const cases: readonly {
      readonly host: HTMLElement;
      readonly attribute: string;
      readonly set: Partial<BreakoutState>;
      readonly value: string;
    }[] = [
      {
        host: breakout,
        attribute: 'data-max',
        set: { max: 'xs' },
        value: 'xs',
      },
      {
        host: breakout,
        attribute: 'data-gap',
        set: { gap: 'sm-lg' },
        value: 'sm-lg',
      },
      { host: child, attribute: 'data-bleed', set: { bleed: true }, value: '' },
    ];

    for (const { host, attribute, set, value } of cases) {
      state.set({ ...unset, ...set });
      await waitFor(async () => {
        await expect(host).toHaveAttribute(attribute, value);
      });

      state.set(unset);
      await waitFor(async () => {
        await expect(host).not.toHaveAttribute(attribute);
      });
    }

    await itemStyled('breakout', breakout, 'display', 'grid');

    // A narrow column, so the bleed's move is visible at any width.
    state.set({ ...unset, max: '2xs', bleed: true });
    await waitFor(() => {
      assertWithin(
        child.getBoundingClientRect().width,
        breakout.getBoundingClientRect().width,
      );
    });

    state.set({ ...unset, max: '2xs' });
    await waitFor(async () => {
      await expect(child.getBoundingClientRect().width).toBeLessThan(
        breakout.getBoundingClientRect().width - 1,
      );
    });
  },
};

/**
 * A paragraph and its note in a frame resized past and below the note's
 * 64rem threshold: the breakout's own width moves the note, not the
 * viewport's (building-blocks 1.7).
 */
export const Note: Story = {
  render: () => ({
    template: `
      <div data-testid="frame" style="inline-size: 70rem">
        <article data-testid="breakout" yetiBreakout>
          <p>Trail maps for the park.</p>
          <div data-testid="annotated">Every marked route in the park, printed at a scale you can walk by.</div>
          <aside data-testid="note" yetiBreakoutNote>Closed from November to March.</aside>
          <p>The valley loop is the easiest of the marked routes.</p>
        </article>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const frame = byTestId(canvasElement, 'frame');
    const breakout = byTestId(canvasElement, 'breakout');
    const annotated = byTestId(canvasElement, 'annotated');
    const note = byTestId(canvasElement, 'note');

    await itemStyled('breakout', breakout, 'display', 'grid');

    // Wide: in the end gutter, beside the child it follows.
    await waitFor(() => {
      assertWithin(
        note.getBoundingClientRect().left,
        annotated.getBoundingClientRect().right,
      );
    });
    await expect(
      Math.abs(
        note.getBoundingClientRect().top -
          annotated.getBoundingClientRect().top,
      ),
    ).toBeLessThan(2);

    // Narrow: in the column, below it.
    frame.style.inlineSize = '40rem';
    await waitFor(async () => {
      await expect(note.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        annotated.getBoundingClientRect().bottom,
      );
    });
    assertWithin(
      note.getBoundingClientRect().left,
      annotated.getBoundingClientRect().left,
    );

    frame.style.inlineSize = '70rem';
    await waitFor(() => {
      assertWithin(
        note.getBoundingClientRect().left,
        annotated.getBoundingClientRect().right,
      );
    });
  },
};

/**
 * A heading keeps the flow's rhythm over the row gap, and a breakout that
 * sets `--yeti-heading-space-before` opens its chapters wider.
 */
export const HeadingRhythm: Story = {
  render: () => ({
    template: `
      <article data-testid="plain-rhythm" yetiBreakout gap="lg">
        <p data-testid="before">The paragraph before the heading.</p>
        <h2 data-testid="heading">A chapter</h2>
        <p data-testid="after">The paragraph the heading opens.</p>
      </article>
      <article data-testid="wide-rhythm" yetiBreakout gap="lg" style="--yeti-heading-space-before: var(--yeti-space-3xl)">
        <p>The paragraph before a wider chapter.</p>
        <h2>A chapter that opens wider</h2>
        <p>The paragraph it opens.</p>
      </article>`,
  }),
  play: async ({ canvasElement }) => {
    for (const id of ['plain-rhythm', 'wide-rhythm']) {
      const breakout = byTestId(canvasElement, id);
      const [before, heading, after] = [...breakout.children];

      if (
        before === undefined ||
        heading === undefined ||
        after === undefined
      ) {
        throw new Error(`The breakout ${id} lacks a child`);
      }

      await expect(breakout).toHaveAttribute('data-gap', 'lg');
      await itemStyled('breakout', breakout, 'display', 'grid');

      const spaceBefore = usedLength(
        breakout,
        'var(--yeti-heading-space-before)',
        'block',
      );
      const spaceAfter = usedLength(
        breakout,
        'var(--yeti-heading-space-after)',
        'block',
      );
      const gap = usedLength(breakout, 'var(--yeti-space-lg)', 'block');

      await expect(spaceBefore).not.toBeCloseTo(gap, 0);
      assertWithin(
        heading.getBoundingClientRect().top -
          before.getBoundingClientRect().bottom,
        spaceBefore,
      );
      assertWithin(
        after.getBoundingClientRect().top -
          heading.getBoundingClientRect().bottom,
        spaceAfter,
      );
    }

    await expect(
      usedLength(
        byTestId(canvasElement, 'wide-rhythm'),
        'var(--yeti-heading-space-before)',
        'block',
      ),
    ).toBeCloseTo(
      usedLength(
        byTestId(canvasElement, 'wide-rhythm'),
        'var(--yeti-space-3xl)',
        'block',
      ),
      1,
    );
  },
};
