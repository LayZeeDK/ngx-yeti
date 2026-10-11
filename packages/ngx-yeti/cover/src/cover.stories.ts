import { signal, type WritableSignal } from '@angular/core';
import { itemStylesLoaded } from '@ngx-yeti/testing';
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

/** The values of one of the cover's enum attributes, from Yeti's manifest. */
function coverValues(name: string): readonly string[] {
  return (
    manifest.components.cover.attributes.find(
      (attribute) => attribute.name === name,
    )?.values ?? []
  );
}

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
const coverStates = new Map<string, WritableSignal<CoverState>>();

function trackedState(
  id: string,
  initial: CoverState,
): WritableSignal<CoverState> {
  const state = signal(initial);
  coverStates.set(id, state);

  return state;
}

function coverState(id: string): WritableSignal<CoverState> {
  const state = coverStates.get(id);

  if (state === undefined) {
    throw new Error(`No cover state for the story ${id}`);
  }

  return state;
}

function children(parent: HTMLElement): HTMLElement[] {
  return [...parent.children].filter((child) => child instanceof HTMLElement);
}

/**
 * The used block size of a CSS length in `root`, read from a probe, so an
 * assertion holds for any token value.
 */
function blockLength(root: HTMLElement, length: string): number {
  const probe = document.createElement('div');
  probe.style.blockSize = length;
  root.append(probe);
  const { height } = probe.getBoundingClientRect();
  probe.remove();

  return height;
}

/**
 * Waits for the cover's item file to apply. Chromium and WebKit can keep
 * stale computed styles right after a stylesheet is inserted (upstream bug
 * O2).
 */
async function coverStyled(cover: HTMLElement): Promise<void> {
  await itemStylesLoaded('cover');

  await waitFor(async () => {
    await expect(getComputedStyle(cover).flexDirection).toBe('column');
  });
}

async function expectClose(
  actual: number,
  expected: number,
  tolerance = 1,
): Promise<void> {
  await expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

/**
 * The centred child's vertical midpoint sits halfway between its
 * neighbours' facing edges (Yeti's "centers the data-center child" case).
 */
async function expectCentredBetween(
  above: HTMLElement,
  centred: HTMLElement,
  below: HTMLElement,
): Promise<void> {
  const box = centred.getBoundingClientRect();

  await expectClose(
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

    await coverStyled(cover);
    await itemStylesLoaded('box');

    await expect(cover.getBoundingClientRect().height).toBeGreaterThanOrEqual(
      blockLength(canvasElement, 'var(--yeti-cover-height)') - 0.5,
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

    await expectClose(nav.getBoundingClientRect().top, contentTop);
    await expectClose(footnote.getBoundingClientRect().bottom, contentBottom);
    await expectCentredBetween(nav, heading, footnote);

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
    await expectClose(
      parseFloat(centred.marginTop),
      parseFloat(centred.marginBottom),
    );

    // The accessibility tree follows the DOM: nothing reorders the children
    // on screen or through ARIA.
    await expect(children(cover)).toStrictEqual([nav, heading, footnote]);
    await expect(style.flexDirection).toBe('column');
    await expect(
      children(cover).map((child) => getComputedStyle(child).order),
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
    gap: { control: 'select', options: coverValues('data-gap') },
    height: { control: 'select', options: coverValues('data-height') },
  },
  render: (args, { id }) => {
    const state = trackedState(id, {
      ...unset,
      gap: args.gap,
      height: args.height,
    });

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
    const state = coverState(id);
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

    await coverStyled(cover);

    for (const { height, token } of heightTokens) {
      state.set({ ...unset, height });

      await waitFor(async () => {
        await (height === undefined
          ? expect(cover).not.toHaveAttribute('data-height')
          : expect(cover).toHaveAttribute('data-height', height));
      });
      await waitFor(async () => {
        await expectClose(
          cover.getBoundingClientRect().height,
          blockLength(canvasElement, `var(${token})`),
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
    await waitFor(async () => {
      await expectClose(
        first.getBoundingClientRect().top,
        cover.getBoundingClientRect().top,
      );
    });
    await expectCentredBetween(first, second, last);
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

    await coverStyled(cover);

    const band = cover.getBoundingClientRect();

    await expect(band.height).toBeGreaterThan(
      blockLength(canvasElement, 'var(--yeti-height-sm)') + 1,
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

    await coverStyled(cover);
    await itemStylesLoaded('center');

    await waitFor(async () => {
      await expect(
        parseFloat(getComputedStyle(center).marginLeft),
      ).toBeGreaterThan(0);
    });
    await expectClose(
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

    await coverStyled(fixed);

    await expectClose(
      fixed.getBoundingClientRect().height,
      blockLength(
        canvas.getByTestId('fixed-wrapper'),
        'var(--yeti-cover-height)',
      ),
    );

    const gap = parseFloat(getComputedStyle(auto).rowGap);

    await expectClose(
      auto.getBoundingClientRect().height,
      top.getBoundingClientRect().height +
        gap +
        bottom.getBoundingClientRect().height,
    );
  },
};
