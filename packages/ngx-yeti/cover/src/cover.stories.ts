import { signal, type WritableSignal } from '@angular/core';
import {
  assertWithin,
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
import type { YetiGap, YetiHeight } from 'ngx-yeti';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { YetiCenter } from 'ngx-yeti/center';
import { expect, waitFor } from 'storybook/test';
import manifest from 'yeti-css/manifest';
import { YetiCover } from './cover';
import { YetiCoverChild } from './cover-child';

interface CoverState {
  readonly gap: YetiGap | undefined;
  readonly height: YetiHeight | undefined;
  readonly centered: 'first' | 'second';
}

const unset: CoverState = {
  gap: undefined,
  height: undefined,
  centered: 'first',
};

/**
 * The inputs a story binds, by story id, so its play function can change
 * them the way a Storybook control does.
 */
const coverStates = storyStates<WritableSignal<CoverState>>('cover');

/**
 * The centred child's vertical midpoint sits halfway between its
 * neighbours' facing edges (Yeti's "centers the data-center child" case).
 */
/** A box's padding once its file has applied: the page's default is none. */
const padded = (value: string): boolean => value !== '0px';

function assertCentredBetween(
  above: HTMLElement,
  centred: HTMLElement,
  below: HTMLElement,
): void {
  const box = centred.getBoundingClientRect();

  assertWithin(
    (box.top + box.bottom) / 2,
    (above.getBoundingClientRect().bottom + below.getBoundingClientRect().top) /
      2,
  );
}

const meta: Meta<YetiCover> = {
  id: 'cover',
  component: YetiCover,
  decorators: [
    moduleMetadata({
      imports: [YetiCover, YetiCoverChild, YetiBox, YetiBorder, YetiCenter],
    }),
  ],
};
export default meta;

type Story = StoryObj<YetiCover>;

/** Yeti's example, section 8's markup with `yetiBox` beside `yetiCover`. */
export const Default: Story = {
  render: () => ({
    template: `
      <header data-testid="cover" yetiCover yetiBox gap="lg" surface="sunken">
        <nav data-testid="nav" yetiBox yetiBorder surface="raised" aria-label="Site"><a href="#home">Yeti</a></nav>
        <h1 data-testid="heading" yetiBox yetiBorder surface="raised" yetiCoverChild center>A heading centered in the viewport</h1>
        <p data-testid="footnote" yetiBox yetiBorder surface="raised">Pinned to the bottom.</p>
      </header>`,
  }),
  play: async ({ canvas, canvasElement }) => {
    const cover = canvas.getByTestId('cover');
    const nav = canvas.getByTestId('nav');
    const heading = canvas.getByTestId('heading');
    const footnote = canvas.getByTestId('footnote');

    await expect([...cover.classList].toSorted()).toStrictEqual([
      'box',
      'cover',
    ]);
    await expect(cover).toHaveAttribute('data-gap', 'lg');
    await expect(cover.outerHTML.match(/ data-gap=/g)).toHaveLength(1);
    await expect(cover).toHaveAttribute('data-ngx-yeti-item-cover', '');
    await expect(cover).toHaveAttribute('data-ngx-yeti-item-box', '');
    await expect(cover).not.toHaveAttribute('data-height');
    await expect(
      [...cover.querySelectorAll('[data-center]')].map((element) =>
        element.getAttribute('data-testid'),
      ),
    ).toStrictEqual(['heading']);
    await expect(cover).not.toHaveAttribute('data-center');
    await expect(
      [cover, ...cover.querySelectorAll('*')].filter((element) =>
        element.matches('[role], [tabindex]'),
      ),
    ).toStrictEqual([]);

    await itemStyled('cover', cover, 'flex-direction', 'column');
    await itemStyled('box', cover, 'padding-top', padded);

    await expect(cover.getBoundingClientRect().height).toBeGreaterThanOrEqual(
      usedLength(canvasElement, 'var(--yeti-cover-height)', 'block') - 0.5,
    );

    const style = getComputedStyle(cover);
    const contentTop =
      cover.getBoundingClientRect().top +
      parseFloat(style.borderTopWidth) +
      parseFloat(style.paddingTop);
    const contentBottom =
      cover.getBoundingClientRect().bottom -
      parseFloat(style.borderBottomWidth) -
      parseFloat(style.paddingBottom);

    assertWithin(nav.getBoundingClientRect().top, contentTop);
    assertWithin(footnote.getBoundingClientRect().bottom, contentBottom);
    assertCentredBetween(nav, heading, footnote);

    // `.cover > *` zeroes every child's margins; the centred child's block
    // margins are then `auto` and resolve to its share of the free space.
    for (const child of [nav, footnote]) {
      const { marginTop, marginRight, marginBottom, marginLeft } =
        getComputedStyle(child);

      await expect([
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
      ]).toStrictEqual(['0px', '0px', '0px', '0px']);
    }

    const centred = getComputedStyle(heading);

    await expect([centred.marginLeft, centred.marginRight]).toStrictEqual([
      '0px',
      '0px',
    ]);
    assertWithin(
      parseFloat(centred.marginTop),
      parseFloat(centred.marginBottom),
    );

    // The accessibility tree follows the DOM: nothing reorders the children
    // on screen or through ARIA.
    await expect(elementChildren(cover)).toStrictEqual([
      nav,
      heading,
      footnote,
    ]);
    await expect(style.flexDirection).toBe('column');
    await expect(
      elementChildren(cover).map((child) => getComputedStyle(child).order),
    ).toStrictEqual(['0', '0', '0']);
    await expect(
      cover.querySelectorAll('[aria-owns], [aria-flowto]'),
    ).toHaveLength(0);
    await expect(nav.getBoundingClientRect().top).toBeLessThan(
      heading.getBoundingClientRect().top,
    );
    await expect(heading.getBoundingClientRect().bottom).toBeLessThan(
      footnote.getBoundingClientRect().top,
    );
  },
};

/** The band heights the play function walks, with the token each one reads. */
const heightTokens: readonly {
  readonly height: YetiHeight | undefined;
  readonly token: string;
}[] = [
  { height: 'sm', token: '--yeti-height-sm' },
  { height: 'md', token: '--yeti-height-md' },
  { height: 'lg', token: '--yeti-height-lg' },
  { height: 'xl', token: '--yeti-height-xl' },
  { height: 'half', token: '--yeti-height-half' },
  { height: 'full', token: '--yeti-cover-height' },
  { height: undefined, token: '--yeti-cover-height' },
];

/** `gap`, `height`, and which child is centred, as Storybook controls. */
export const Settings: Story = {
  argTypes: {
    // Yeti's vocabularies, which the contract spec proves equal to the
    // inputs' types, so a pin move that adds a value adds its option.
    gap: {
      control: 'select',
      options: manifestValues(manifest.components.cover, 'data-gap'),
    },
    height: {
      control: 'select',
      options: manifestValues(manifest.components.cover, 'data-height'),
    },
  },
  render: (args, { id }) => {
    const state = coverStates.track(
      id,
      signal<CoverState>({
        ...unset,
        gap: args.gap,
        height: args.height,
      }),
    );

    // Template props are named unlike the inputs, which they would collide
    // with once `component` is set.
    return {
      props: { state },
      template: `
        <section data-testid="cover" yetiCover [gap]="state().gap" [height]="state().height">
          <p data-testid="first" yetiCoverChild [center]="state().centered === 'first'">The first child.</p>
          <p data-testid="second" yetiCoverChild [center]="state().centered === 'second'">The second child.</p>
          <p data-testid="last">The last child.</p>
        </section>`,
    };
  },
  play: async ({ canvas, canvasElement, id }) => {
    const state = coverStates.get(id);
    const cover = canvas.getByTestId('cover');
    const first = canvas.getByTestId('first');
    const second = canvas.getByTestId('second');
    const last = canvas.getByTestId('last');

    state.set({ ...unset, gap: 'xl' });
    await waitFor(async () => {
      await expect(cover).toHaveAttribute('data-gap', 'xl');
    });
    state.set(unset);
    await waitFor(async () => {
      await expect(cover).not.toHaveAttribute('data-gap');
    });

    await itemStyled('cover', cover, 'flex-direction', 'column');

    for (const { height, token } of heightTokens) {
      state.set({ ...unset, height });

      await waitFor(async () => {
        await (height === undefined
          ? expect(cover).not.toHaveAttribute('data-height')
          : expect(cover).toHaveAttribute('data-height', height));
      });
      await waitFor(() => {
        assertWithin(
          cover.getBoundingClientRect().height,
          usedLength(canvasElement, `var(${token})`, 'block'),
        );
      });
    }

    state.set({ ...unset, height: 'md', centered: 'first' });
    await waitFor(async () => {
      await expect(first).toHaveAttribute('data-center', '');
    });
    await expect(second).not.toHaveAttribute('data-center');
    // Centred first: the free space sits above and below it, so it leaves
    // the cover's top.
    await waitFor(async () => {
      await expect(first.getBoundingClientRect().top).toBeGreaterThan(
        cover.getBoundingClientRect().top + 1,
      );
    });

    state.set({ ...unset, height: 'md', centered: 'second' });
    await waitFor(async () => {
      await expect(second).toHaveAttribute('data-center', '');
    });
    await expect(first).not.toHaveAttribute('data-center');
    await waitFor(() => {
      assertWithin(
        first.getBoundingClientRect().top,
        cover.getBoundingClientRect().top,
      );
    });
    assertCentredBetween(first, second, last);
  },
};

/** `height="sm"` holding a centred child taller than the band. */
export const Grows: Story = {
  render: () => ({
    template: `
      <section data-testid="cover" yetiCover height="sm">
        <div data-testid="tall" yetiCoverChild center style="block-size: calc(var(--yeti-height-sm) + 10rem)">
          <p>A centred child taller than the band.</p>
        </div>
      </section>`,
  }),
  play: async ({ canvas, canvasElement }) => {
    const cover = canvas.getByTestId('cover');
    const tall = canvas.getByTestId('tall');

    await expect(cover).toHaveAttribute('data-height', 'sm');
    await expect(cover).toHaveAttribute('height', 'sm');

    await itemStyled('cover', cover, 'flex-direction', 'column');

    const band = cover.getBoundingClientRect();

    await expect(band.height).toBeGreaterThan(
      usedLength(canvasElement, 'var(--yeti-height-sm)', 'block') + 1,
    );
    await expect(band.height).toBeGreaterThanOrEqual(
      tall.getBoundingClientRect().height - 0.5,
    );
    await expect(tall.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      band.bottom + 0.5,
    );
    await expect(cover.scrollHeight).toBe(cover.clientHeight);
  },
};

/**
 * A hero built from layouts: a center as the cover's centred child. Its
 * inline margins show that `center.css`, which comes after `cover.css`,
 * won over `.cover > *` (section 13).
 */
export const HoldingCenter: Story = {
  render: () => ({
    template: `
      <section data-testid="cover" yetiCover height="sm">
        <div data-testid="center" yetiCenter max="2xs" yetiCoverChild center>
          <p>A centred column in a cover.</p>
        </div>
      </section>`,
  }),
  play: async ({ canvas }) => {
    const cover = canvas.getByTestId('cover');
    const center = canvas.getByTestId('center');

    await expect(center).toHaveAttribute('data-center', '');

    await itemStyled('cover', cover, 'flex-direction', 'column');
    await itemStyled(
      'center',
      center,
      'margin-left',
      (value) => parseFloat(value) > 0,
    );

    await expect(
      parseFloat(getComputedStyle(center).marginLeft),
    ).toBeGreaterThan(0);
    assertWithin(
      parseFloat(getComputedStyle(center).marginLeft),
      parseFloat(getComputedStyle(center).marginRight),
    );
  },
};

/** `--yeti-cover-height` set to a length on one cover and `auto` on another. */
export const Themed: Story = {
  render: () => ({
    template: `
      <div data-testid="fixed-wrapper" style="--yeti-cover-height: 400px">
        <section data-testid="fixed" yetiCover>
          <p yetiCoverChild center>A 400 px cover.</p>
        </section>
      </div>
      <div data-testid="auto-wrapper" style="--yeti-cover-height: auto">
        <section data-testid="auto" yetiCover>
          <p data-testid="auto-top">A cover only as tall as its content.</p>
          <p data-testid="auto-bottom" yetiCoverChild center>Its centred child.</p>
        </section>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const fixed = canvas.getByTestId('fixed');
    const auto = canvas.getByTestId('auto');
    const top = canvas.getByTestId('auto-top');
    const bottom = canvas.getByTestId('auto-bottom');

    await itemStyled('cover', fixed, 'flex-direction', 'column');

    assertWithin(
      fixed.getBoundingClientRect().height,
      usedLength(
        canvas.getByTestId('fixed-wrapper'),
        'var(--yeti-cover-height)',
        'block',
      ),
    );

    const gap = parseFloat(getComputedStyle(auto).rowGap);

    assertWithin(
      auto.getBoundingClientRect().height,
      top.getBoundingClientRect().height +
        gap +
        bottom.getBoundingClientRect().height,
    );
  },
};
