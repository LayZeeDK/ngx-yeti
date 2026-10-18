import { NgOptimizedImage } from '@angular/common';
import { signal, type WritableSignal } from '@angular/core';
import {
  assertWithin,
  contrastRatio,
  elementChildren,
  itemStyled,
  manifestValues,
  storyStates,
  usedLength,
} from '@ngx-yeti/testing';
import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import type { YetiGap, YetiWidth } from 'ngx-yeti';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { YetiNumeric, YetiTable } from 'ngx-yeti/table';
import { YetiVisuallyHidden } from 'ngx-yeti/visually-hidden';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import manifest from 'yeti-css/manifest';
import trail from '../../.storybook/assets/trail.svg?no-inline';
import { YetiScroller, type YetiScrollerJustify } from './scroller';

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
const scrollerStates = storyStates<WritableSignal<ScrollerState>>('scroller');

/** The child at `index`, which the story's markup is known to hold. */
function childAt(parent: HTMLElement, index: number): HTMLElement {
  const child = elementChildren(parent)[index];

  if (child === undefined) {
    throw new Error(`No child ${String(index)}`);
  }

  return child;
}

/** A box's padding once its file has applied: the page's default is none. */
const padded = (value: string): boolean => value !== '0px';

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
      imports: [
        YetiScroller,
        YetiBox,
        YetiBorder,
        NgOptimizedImage,
        YetiTable,
        YetiNumeric,
        YetiVisuallyHidden,
      ],
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
    const items = elementChildren(scroller);

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

    await itemStyled('scroller', scroller, 'display', 'flex');
    await itemStyled('box', childAt(scroller, 0), 'padding-top', padded);

    const width = usedLength(canvasElement, 'var(--yeti-width-sm)');
    const gap = usedLength(canvasElement, 'var(--yeti-space-md)');
    const tops = new Set(items.map((item) => item.offsetTop));

    await expectOverflowing(scroller);
    await expect(tops.size).toBe(1);

    for (const item of items) {
      const style = getComputedStyle(item);

      assertWithin(item.getBoundingClientRect().width, width);

      for (const margin of [
        style.marginTop,
        style.marginRight,
        style.marginBottom,
        style.marginLeft,
      ]) {
        await expect(margin).toBe('0px');
      }
    }

    assertWithin(
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

    await itemStyled('scroller', scroller, 'display', 'flex');
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
    gap: {
      control: 'select',
      options: manifestValues(manifest.components.scroller, 'data-gap'),
    },
    width: {
      control: 'select',
      options: manifestValues(manifest.components.scroller, 'data-width'),
    },
    snap: { control: 'boolean' },
    justify: {
      control: 'select',
      options: manifestValues(manifest.components.scroller, 'data-justify'),
    },
  },
  render: (args, { id }) => {
    const state = scrollerStates.track(
      id,
      signal<ScrollerState>({
        gap: args.gap,
        width: args.width,
        snap: args.snap === true,
        justify: args.justify,
      }),
    );

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
    const state = scrollerStates.get(id);
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

    await itemStyled('scroller', scroller, 'display', 'flex');

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

    await itemStyled('scroller', scroller, 'display', 'flex');

    assertWithin(image.getBoundingClientRect().width, 900);
    await expectOverflowing(scroller);
    await expect(caption.getBoundingClientRect().width).toBeLessThanOrEqual(
      usedLength(canvasElement, 'var(--yeti-measure)') + 1,
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

    await itemStyled('scroller', scroller, 'display', 'flex');
    await expectOverflowing(scroller);

    await expect(scroller.scrollLeft).toBe(0);

    const rights = elementChildren(scroller).map(
      (item) => item.getBoundingClientRect().right,
    );

    await expect(rights).toStrictEqual(rights.toSorted((a, b) => b - a));
    assertWithin(
      childAt(scroller, 0).getBoundingClientRect().right,
      scroller.getBoundingClientRect().right,
    );
  },
};

/**
 * Yeti's table docs example: a wide table with a caption as the scroller's
 * one child, the scroller named by the caption, and a header cell holding a
 * visually hidden span.
 */
export const WideTable: Story = {
  render: () => ({
    template: `
      <div style="max-inline-size: 20rem">
        <div data-testid="scroller" yetiScroller aria-labelledby="quarterly-results">
          <table yetiTable size="sm" border nowrap>
            <caption id="quarterly-results">Quarterly results</caption>
            <thead>
              <tr>
                <th scope="col">Region</th>
                <th scope="col" yetiNumeric>First quarter</th>
                <th scope="col" yetiNumeric>Second quarter</th>
                <th scope="col" yetiNumeric>Third quarter</th>
                <th scope="col" yetiNumeric>Fourth quarter <span data-testid="hidden" yetiVisuallyHidden>in thousands</span></th>
              </tr>
            </thead>
            <tbody>
              <tr><th scope="row">North</th><td yetiNumeric>120</td><td yetiNumeric>132</td><td yetiNumeric>141</td><td yetiNumeric>158</td></tr>
              <tr><th scope="row">South</th><td yetiNumeric>98</td><td yetiNumeric>104</td><td yetiNumeric>117</td><td yetiNumeric>125</td></tr>
            </tbody>
          </table>
        </div>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const scroller = canvas.getByTestId('scroller');
    const hidden = canvas.getByTestId('hidden');
    const table = canvas.getByRole('table', { name: 'Quarterly results' });

    await expect(
      canvas.getByRole('region', { name: 'Quarterly results' }),
    ).toBe(scroller);
    await expect(elementChildren(scroller)).toStrictEqual([table]);

    await itemStyled('scroller', scroller, 'display', 'flex');
    await itemStyled('visually-hidden', hidden, 'position', 'absolute');
    await itemStyled(
      'table',
      table.querySelector('td') ?? table,
      'vertical-align',
      'top',
    );

    await expectOverflowing(scroller);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );

    scroller.scrollLeft = scroller.scrollWidth;
    await waitFor(async () => {
      await expect(
        scroller.scrollLeft + scroller.clientWidth,
      ).toBeGreaterThanOrEqual(scroller.scrollWidth - 1);
    });

    const box = scroller.getBoundingClientRect();
    const span = hidden.getBoundingClientRect();

    await expect(span.left).toBeGreaterThanOrEqual(box.left);
    await expect(span.right).toBeLessThanOrEqual(box.right);
    await expect(span.top).toBeGreaterThanOrEqual(box.top);
    await expect(span.bottom).toBeLessThanOrEqual(box.bottom);
  },
};
