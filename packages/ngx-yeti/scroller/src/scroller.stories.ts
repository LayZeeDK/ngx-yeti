import { NgOptimizedImage } from '@angular/common';
import { signal, type WritableSignal } from '@angular/core';
import { contrastRatio, itemStylesLoaded } from '@ngx-yeti/testing';
import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import type { YetiGap, YetiWidth } from 'ngx-yeti';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import manifest from 'yeti-css/manifest';
import trail from '../../.storybook/assets/trail.svg?no-inline';
import { YetiScroller, type YetiScrollerJustify } from './scroller';

/** The values of one of the scroller's enum attributes, from Yeti's manifest. */
function scrollerValues(name: string): readonly string[] {
  return (
    manifest.components.scroller.attributes.find(
      (attribute) => attribute.name === name,
    )?.values ?? []
  );
}

interface ScrollerState {
  readonly gap: YetiGap | undefined;
  readonly width: YetiWidth | undefined;
  readonly snap: boolean;
  readonly justify: YetiScrollerJustify | undefined;
}

const unset: ScrollerState = {
  gap: undefined,
  width: undefined,
  snap: false,
  justify: undefined,
};

/**
 * The inputs a story binds, by story id, so its play function can change
 * them the way a Storybook control does.
 */
const scrollerStates = new Map<string, WritableSignal<ScrollerState>>();

function trackedState(
  id: string,
  initial: ScrollerState,
): WritableSignal<ScrollerState> {
  const state = signal(initial);
  scrollerStates.set(id, state);

  return state;
}

function scrollerState(id: string): WritableSignal<ScrollerState> {
  const state = scrollerStates.get(id);

  if (state === undefined) {
    throw new Error(`No scroller state for the story ${id}`);
  }

  return state;
}

function children(parent: HTMLElement): HTMLElement[] {
  return [...parent.children].filter((child) => child instanceof HTMLElement);
}

/** The child at `index`, which the story's markup is known to hold. */
function childAt(parent: HTMLElement, index: number): HTMLElement {
  const child = children(parent)[index];

  if (child === undefined) {
    throw new Error(`No child ${String(index)}`);
  }

  return child;
}

/**
 * The used inline size of a CSS length in `root`, read from a probe, so an
 * assertion holds for any token value.
 */
function inlineLength(root: HTMLElement, length: string): number {
  const probe = document.createElement('div');
  probe.style.inlineSize = length;
  root.append(probe);
  const { width } = probe.getBoundingClientRect();
  probe.remove();

  return width;
}

/**
 * Waits for the scroller's item file to apply. Chromium and WebKit can keep
 * stale computed styles right after a stylesheet is inserted (upstream bug
 * O2).
 */
async function scrollerStyled(scroller: HTMLElement): Promise<void> {
  await itemStylesLoaded('scroller');

  await waitFor(async () => {
    await expect(getComputedStyle(scroller).display).toBe('flex');
  });
}

async function expectClose(actual: number, expected: number): Promise<void> {
  await expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
}

async function expectOverflowing(scroller: HTMLElement): Promise<void> {
  await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
}

/** Section 8's markup, in a frame narrower than its four items. */
function defaultScroller(dir: 'ltr' | 'rtl'): string {
  return `
    <div dir="${dir}" style="max-inline-size: 30rem">
      <div data-testid="scroller" yetiScroller snap width="sm" aria-label="Featured articles">
        <article yetiBox yetiBorder surface="raised"><h2>One</h2></article>
        <article yetiBox yetiBorder surface="raised"><h2>Two</h2></article>
        <article yetiBox yetiBorder surface="raised"><h2>Three</h2></article>
        <article yetiBox yetiBorder surface="raised"><h2>Four</h2></article>
      </div>
    </div>`;
}

const meta: Meta<YetiScroller> = {
  id: 'scroller',
  component: YetiScroller,
  decorators: [
    moduleMetadata({
      imports: [YetiScroller, YetiBox, YetiBorder, NgOptimizedImage],
    }),
  ],
};
export default meta;

type Story = StoryObj<YetiScroller>;

/** Yeti's example (scroller spec, section 8) in a narrow frame. */
export const Default: Story = {
  render: () => ({ template: defaultScroller('ltr') }),
  play: async ({ canvas, canvasElement }) => {
    const scroller = canvas.getByTestId('scroller');
    const items = children(scroller);

    await expect(scroller).toHaveAttribute('class', 'scroller');
    await expect(scroller).toHaveAttribute('role', 'region');
    await expect(scroller).toHaveAttribute('tabindex', '0');
    await expect(scroller).toHaveAttribute('data-ngx-yeti-item-scroller', '');
    await expect(scroller).toHaveAttribute('data-snap', '');
    await expect(scroller).toHaveAttribute('data-width', 'sm');
    await expect(scroller).not.toHaveAttribute('data-gap');
    await expect(scroller).not.toHaveAttribute('data-justify');
    await expect(
      canvas.getByRole('region', { name: 'Featured articles' }),
    ).toBe(scroller);
    await expect(
      within(scroller)
        .getAllByRole('heading')
        .map((heading) => heading.textContent.trim()),
    ).toStrictEqual(items.map((item) => item.textContent.trim()));

    await scrollerStyled(scroller);
    await itemStylesLoaded('box');

    const width = inlineLength(canvasElement, 'var(--yeti-width-sm)');
    const gap = inlineLength(canvasElement, 'var(--yeti-space-md)');
    const tops = new Set(items.map((item) => item.offsetTop));

    await expectOverflowing(scroller);
    await expect(tops.size).toBe(1);

    for (const item of items) {
      const style = getComputedStyle(item);

      await expectClose(item.getBoundingClientRect().width, width);

      for (const margin of [
        style.marginTop,
        style.marginRight,
        style.marginBottom,
        style.marginLeft,
      ]) {
        await expect(margin).toBe('0px');
      }
    }

    await expectClose(
      childAt(scroller, 1).getBoundingClientRect().left -
        childAt(scroller, 0).getBoundingClientRect().right,
      gap,
    );
  },
};

/**
 * Six text cards with nothing focusable, between two buttons, on a surface the
 * play function switches between the light and the dark scheme. The arrow
 * keys need real key presses, which layer 4 makes.
 */
export const Keyboard: Story = {
  render: () => ({
    template: `
      <div data-testid="surface" style="color: var(--yeti-color-text); background-color: var(--yeti-color-surface); padding: 1rem">
        <button type="button">Before the strip</button>
        <div style="max-inline-size: 20rem">
          <div data-testid="scroller" yetiScroller width="xs" aria-label="Trail notes">
            <p yetiBox yetiBorder>The ridge path climbs for an hour.</p>
            <p yetiBox yetiBorder>The lake trail stays level.</p>
            <p yetiBox yetiBorder>The forest loop is shaded.</p>
            <p yetiBox yetiBorder>The coast walk is windy.</p>
            <p yetiBox yetiBorder>The valley road is paved.</p>
            <p yetiBox yetiBorder>The summit spur is steep.</p>
          </div>
        </div>
        <button type="button">After the strip</button>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const surface = canvas.getByTestId('surface');
    const scroller = canvas.getByTestId('scroller');
    const button = canvas.getByRole('button', { name: 'Before the strip' });

    await scrollerStyled(scroller);
    await expectOverflowing(scroller);

    button.focus();
    await userEvent.tab();

    await expect(scroller).toHaveFocus();
    await expect(scroller.matches(':focus-visible')).toBe(true);
    await expect(getComputedStyle(scroller).outlineStyle).not.toBe('none');

    try {
      for (const scheme of ['light', 'dark']) {
        surface.style.colorScheme = scheme;

        await expect(
          contrastRatio(
            getComputedStyle(scroller).outlineColor,
            getComputedStyle(surface).backgroundColor,
          ),
        ).toBeGreaterThanOrEqual(3);
      }
    } finally {
      surface.style.colorScheme = '';
    }

    await userEvent.tab();

    await expect(
      canvas.getByRole('button', { name: 'After the strip' }),
    ).toHaveFocus();
  },
};

/** `gap`, `width`, `snap`, and `justify` as Storybook controls. */
export const Settings: Story = {
  argTypes: {
    // Yeti's vocabularies, which the contract spec proves equal to the
    // inputs' types, so a pin move that adds a value adds its option.
    gap: { control: 'select', options: scrollerValues('data-gap') },
    width: { control: 'select', options: scrollerValues('data-width') },
    snap: { control: 'boolean' },
    justify: { control: 'select', options: scrollerValues('data-justify') },
  },
  render: (args, { id }) => {
    const state = trackedState(id, {
      gap: args.gap,
      width: args.width,
      snap: args.snap === true,
      justify: args.justify,
    });

    // Template props are named unlike the inputs, which they would collide
    // with once `component` is set.
    return {
      props: { state },
      template: `
        <div style="max-inline-size: 30rem">
          <div data-testid="scroller" yetiScroller aria-label="Settings"
            [gap]="state().gap" [width]="state().width" [snap]="state().snap" [justify]="state().justify">
            <p yetiBox yetiBorder>The first item of the strip</p>
            <p yetiBox yetiBorder>The second item of the strip</p>
            <p yetiBox yetiBorder>The third item of the strip</p>
            <p yetiBox yetiBorder>The fourth item of the strip</p>
          </div>
        </div>`,
    };
  },
  play: async ({ canvas, id }) => {
    const state = scrollerState(id);
    const scroller = canvas.getByTestId('scroller');
    const first = childAt(scroller, 0);
    const bound: readonly [Partial<ScrollerState>, string, string][] = [
      [{ gap: 'xl' }, 'data-gap', 'xl'],
      [{ width: 'sm' }, 'data-width', 'sm'],
      [{ snap: true }, 'data-snap', ''],
      [{ snap: true, justify: 'end' }, 'data-justify', 'end'],
    ];

    for (const [change, attribute, value] of bound) {
      state.set({ ...unset, ...change });
      await waitFor(async () => {
        await expect(scroller).toHaveAttribute(attribute, value);
      });
      state.set(unset);
      await waitFor(async () => {
        await expect(scroller).not.toHaveAttribute(attribute);
      });
    }

    await scrollerStyled(scroller);

    await expect(getComputedStyle(scroller).scrollSnapType).toBe('none');

    const settled: readonly [YetiScrollerJustify | undefined, string][] = [
      [undefined, 'start'],
      ['start', 'start'],
      ['center', 'center'],
      ['end', 'end'],
    ];

    for (const [justify, align] of settled) {
      state.set({ ...unset, snap: true, justify });
      await waitFor(async () => {
        await expect(getComputedStyle(scroller).scrollSnapType).toMatch(/^x/);
      });
      await waitFor(async () => {
        await expect(getComputedStyle(first).scrollSnapAlign).toBe(align);
      });
    }

    for (const justify of ['center', 'end'] as const) {
      state.set({ ...unset, justify });
      await waitFor(async () => {
        await expect(scroller).not.toHaveAttribute('data-snap');
      });
      await expect(getComputedStyle(scroller).scrollSnapType).toBe('none');
      await expect(getComputedStyle(first).scrollSnapAlign).toBe('none');
    }

    state.set(unset);
  },
};

const longText =
  'A long caption that keeps the prose measure inside the track rather than running to one long line, because a text child of a scroller is not media and so keeps the reset that caps every paragraph at the page measure for its readers.';

/**
 * A `section` named by the heading before it, holding an image wider than
 * the track and a long paragraph.
 */
export const Media: Story = {
  render: () => ({
    props: { trail, longText },
    template: `
      <h2 id="ridge-heading">Photos from the ridge</h2>
      <div style="max-inline-size: 30rem">
        <section data-testid="scroller" yetiScroller aria-labelledby="ridge-heading">
          <img data-testid="image" [ngSrc]="trail" width="900" height="506" priority alt="A mountain trail at dawn" />
          <p data-testid="caption">{{ longText }}</p>
        </section>
      </div>`,
  }),
  play: async ({ canvas, canvasElement }) => {
    const scroller = canvas.getByTestId('scroller');
    const image = canvas.getByTestId('image');
    const caption = canvas.getByTestId('caption');

    await expect(
      canvas.getByRole('region', { name: 'Photos from the ridge' }),
    ).toBe(scroller);

    await scrollerStyled(scroller);

    await expectClose(image.getBoundingClientRect().width, 900);
    await expectOverflowing(scroller);
    await expect(caption.getBoundingClientRect().width).toBeLessThanOrEqual(
      inlineLength(canvasElement, 'var(--yeti-measure)') + 1,
    );
  },
};

/**
 * `scroller--default` inside `dir="rtl"`. ArrowLeft's negative `scrollLeft`
 * needs a real key press, which layer 4 makes.
 */
export const Rtl: Story = {
  render: () => ({ template: defaultScroller('rtl') }),
  play: async ({ canvas }) => {
    const scroller = canvas.getByTestId('scroller');

    await scrollerStyled(scroller);
    await expectOverflowing(scroller);

    await expect(scroller.scrollLeft).toBe(0);

    const rights = children(scroller).map(
      (item) => item.getBoundingClientRect().right,
    );

    await expect(rights).toStrictEqual(rights.toSorted((a, b) => b - a));
    await expectClose(
      childAt(scroller, 0).getBoundingClientRect().right,
      scroller.getBoundingClientRect().right,
    );
  },
};
