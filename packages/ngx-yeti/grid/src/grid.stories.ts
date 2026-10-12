import { NgOptimizedImage } from '@angular/common';
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
import type {
  YetiColumns,
  YetiGap,
  YetiRows,
  YetiTracks,
  YetiWidth,
  YetiWidthOrNone,
} from 'ngx-yeti';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { expect, waitFor, within } from 'storybook/test';
import manifest from 'yeti-css/manifest';
// Kept a URL in the static build too: NgOptimizedImage refuses `data:` URLs.
import trail from '../../.storybook/assets/trail.svg?no-inline';
import { YetiGrid } from './grid';
import { YetiGridChild } from './grid-child';

interface GridState {
  readonly min: YetiWidthOrNone | undefined;
  readonly columns: YetiColumns | undefined;
  readonly gap: YetiGap | undefined;
  readonly rows: YetiRows | undefined;
  readonly fold: boolean;
  readonly tracks: YetiTracks | undefined;
  readonly threshold: YetiWidth | undefined;
}

const unset: GridState = {
  min: undefined,
  columns: undefined,
  gap: undefined,
  rows: undefined,
  fold: false,
  tracks: undefined,
  threshold: undefined,
};

/**
 * The inputs the settings story binds, by story id, so its play function can
 * change them the way a Storybook control does.
 */
const gridStates = storyStates<WritableSignal<GridState>>('grid');

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

/** How many cells share the first row. */
function perRow(grid: HTMLElement): number {
  const tops = elementChildren(grid).map((cell) =>
    Math.round(cell.getBoundingClientRect().top),
  );
  const first = Math.min(...tops);

  return tops.filter((top) => top === first).length;
}

/** Sets the width of the element the story resizes. */
function resize(stage: HTMLElement, width: number): void {
  stage.style.inlineSize = `${String(width)}px`;
}

/**
 * Expects the cells to be drawn in source order: each one below the last,
 * or in the same row and after it in the writing direction.
 */
async function expectSourceOrderOnScreen(grid: HTMLElement): Promise<void> {
  const rects = elementChildren(grid).map((cell) =>
    cell.getBoundingClientRect(),
  );

  for (const [index, rect] of rects.entries()) {
    const previous = rects[index - 1];

    if (previous === undefined) {
      continue;
    }

    const sameRow = Math.round(rect.top) === Math.round(previous.top);

    await expect(
      sameRow ? rect.left > previous.left : rect.top > previous.top,
    ).toBe(true);
  }
}

const meta: Meta<YetiGrid> = {
  id: 'grid',
  component: YetiGrid,
  decorators: [
    moduleMetadata({
      imports: [YetiGrid, YetiGridChild, YetiBox, YetiBorder, NgOptimizedImage],
    }),
  ],
};
export default meta;

type Story = StoryObj<YetiGrid>;

const names = ['One', 'Two', 'Three', 'Four', 'Five'];

/** Yeti's grid example: a list of five raised, bordered boxes. */
export const Default: Story = {
  render: () => ({
    props: { names },
    template: `
      <ul data-testid="grid" yetiGrid min="2xs" columns="3" role="list">
        @for (name of names; track name) {
          <li yetiBox surface="raised" yetiBorder>{{ name }}</li>
        }
      </ul>`,
  }),
  play: async ({ canvas }) => {
    const grid = canvas.getByTestId('grid');
    const list = canvas.getByRole('list');
    const items = within(list).getAllByRole('listitem');

    await expect(list).toBe(grid);
    await expect(grid).toHaveAttribute('class', 'grid');
    await expect(grid).toHaveAttribute('data-ngx-yeti-item-grid', '');
    await expect(grid).toHaveAttribute('data-min', '2xs');
    await expect(grid).toHaveAttribute('data-columns', '3');
    await expect(grid).not.toHaveAttribute('data-gap');
    await expect(
      [grid, ...grid.querySelectorAll('*')].filter(
        (element) =>
          element.hasAttribute('tabindex') ||
          (element !== grid && element.hasAttribute('role')),
      ),
    ).toStrictEqual([]);
    await expect(grid).toHaveAttribute('role', 'list');
    await expect(items).toHaveLength(names.length);
    // The accessibility tree lists the items in DOM order.
    await expect(items).toStrictEqual(elementChildren(grid));

    await itemStyled('grid', grid, 'display', 'grid');
    await itemStyled('box', childAt(grid, 0), 'padding-top', padded);

    await expect(getComputedStyle(grid).paddingInlineStart).toBe('0px');
    await expect(perRow(grid)).toBeLessThanOrEqual(3);
    await expectSourceOrderOnScreen(grid);
  },
};

/** Every input of `YetiGrid`, set and reset as a Storybook control would. */
export const Settings: Story = {
  argTypes: {
    // Yeti's vocabularies, which the contract spec proves equal to the
    // inputs' types, so a pin move that adds a value adds its option.
    min: {
      control: 'select',
      options: manifestValues(manifest.components.grid, 'data-min'),
    },
    columns: {
      control: 'select',
      options: manifestValues(manifest.components.grid, 'data-columns'),
    },
    gap: {
      control: 'select',
      options: manifestValues(manifest.components.grid, 'data-gap'),
    },
    rows: {
      control: 'select',
      options: manifestValues(manifest.components.grid, 'data-rows'),
    },
    fold: { control: 'boolean' },
    tracks: {
      control: 'select',
      options: manifestValues(manifest.components.grid, 'data-tracks'),
    },
    threshold: {
      control: 'select',
      options: manifestValues(manifest.components.grid, 'data-threshold'),
    },
  },
  render: (args, { id }) => {
    const state = signal<GridState>({
      min: args.min,
      columns: args.columns,
      gap: args.gap,
      rows: args.rows,
      fold: args.fold === true,
      tracks: args.tracks,
      threshold: args.threshold,
    });
    gridStates.track(id, state);

    // Template props are named unlike the inputs, which they would collide
    // with once `component` is set.
    return {
      props: { state },
      template: `
        <div data-testid="grid" yetiGrid [min]="state().min" [columns]="state().columns" [gap]="state().gap" [rows]="state().rows" [fold]="state().fold" [tracks]="state().tracks" [threshold]="state().threshold">
          <p>The first cell.</p>
          <p>The second cell.</p>
          <p>The third cell.</p>
          <p>The fourth cell.</p>
        </div>`,
    };
  },
  play: async ({ canvas, id }) => {
    const state = gridStates.get(id);
    const grid = canvas.getByTestId('grid');
    const cases: readonly {
      readonly attribute: string;
      readonly set: Partial<GridState>;
      readonly value: string;
    }[] = [
      { attribute: 'data-min', set: { min: 'none' }, value: 'none' },
      { attribute: 'data-columns', set: { columns: '4' }, value: '4' },
      { attribute: 'data-gap', set: { gap: 'sm-lg' }, value: 'sm-lg' },
      { attribute: 'data-rows', set: { rows: '3' }, value: '3' },
      { attribute: 'data-fold', set: { fold: true }, value: '' },
      { attribute: 'data-tracks', set: { tracks: '12' }, value: '12' },
      { attribute: 'data-threshold', set: { threshold: 'lg' }, value: 'lg' },
    ];

    for (const { attribute, set, value } of cases) {
      state.set({ ...unset, ...set });
      await waitFor(async () => {
        await expect(grid).toHaveAttribute(attribute, value);
      });

      state.set(unset);
      await waitFor(async () => {
        await expect(grid).not.toHaveAttribute(attribute);
      });
    }
  },
};

const eight = Array.from({ length: 8 }, (_, index) => index + 1);

/** `min="none"` with `columns="4"`, and `min="none"` alone. */
export const ExactCount: Story = {
  render: () => ({
    props: { eight },
    template: `
      <div data-testid="stage">
        <div data-testid="exact" yetiGrid min="none" columns="4">
          @for (cell of eight; track cell) {
            <p>Cell {{ cell }}</p>
          }
        </div>
        <div data-testid="loose" yetiGrid min="none">
          @for (cell of eight; track cell) {
            <p>Loose cell {{ cell }}</p>
          }
        </div>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const stage = canvas.getByTestId('stage');
    const exact = canvas.getByTestId('exact');
    const loose = canvas.getByTestId('loose');

    await itemStyled('grid', exact, 'display', 'grid');
    resize(stage, 1000);

    await expect(perRow(exact)).toBe(4);
    await expect(perRow(loose)).toBe(1);

    resize(stage, 300);

    await expect(perRow(exact)).toBe(4);
    await expect(perRow(loose)).toBe(1);
  },
};

/**
 * A folded grid of four in a container resized across the fold's limits,
 * which Yeti writes in `rem`.
 */
export const Fold: Story = {
  render: () => ({
    props: { eight },
    template: `
      <div data-testid="stage">
        <div data-testid="grid" yetiGrid columns="4" fold>
          @for (cell of eight; track cell) {
            <p>Cell {{ cell }}</p>
          }
        </div>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const stage = canvas.getByTestId('stage');
    const grid = canvas.getByTestId('grid');

    await expect(grid).toHaveAttribute('data-fold', '');
    await itemStyled('grid', grid, 'display', 'grid');

    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

    for (const [width, count] of [
      [70 * rem, 4],
      [56 * rem, 2],
      [44 * rem, 2],
      [25 * rem, 1],
    ] as const) {
      resize(stage, width);

      await expect(perRow(grid)).toBe(count);
    }

    // Four, two, or one across at every width, never three.
    for (let width = 15 * rem; width <= 80 * rem; width += rem) {
      resize(stage, width);

      await expect([1, 2, 4]).toContain(perRow(grid));
    }
  },
};

/**
 * Yeti's wall: twelve tracks, two cells placed by line, one with a span only,
 * and one with neither, above and below the threshold.
 */
export const Tracks: Story = {
  render: () => ({
    template: `
      <div data-testid="stage">
        <div data-testid="grid" yetiGrid tracks="12" threshold="md" gap="sm">
          <figure yetiGridChild start="2" span="6"><figcaption>The first work</figcaption></figure>
          <figure yetiGridChild start="9" span="4"><figcaption>The second work</figcaption></figure>
          <figure yetiGridChild span="3"><figcaption>A caption across three tracks</figcaption></figure>
          <figure><figcaption>A note</figcaption></figure>
        </div>
      </div>`,
  }),
  play: async ({ canvas, canvasElement }) => {
    const stage = canvas.getByTestId('stage');
    const grid = canvas.getByTestId('grid');
    const [first, second, spanned, plain] = [0, 1, 2, 3].map((index) =>
      childAt(grid, index),
    );

    if (
      first === undefined ||
      second === undefined ||
      spanned === undefined ||
      plain === undefined
    ) {
      throw new Error('The wall has four cells');
    }

    await expect(first).toHaveAttribute('data-start', '2');
    await expect(first).toHaveAttribute('data-span', '6');
    await expect(spanned).not.toHaveAttribute('data-start');
    await expect(plain).not.toHaveAttribute('data-span');
    await expect(canvas.getAllByRole('figure')).toStrictEqual(
      elementChildren(grid),
    );

    await itemStyled('grid', grid, 'display', 'grid');
    resize(stage, 1000);

    const gap = usedLength(canvasElement, 'var(--yeti-space-sm)');
    const box = grid.getBoundingClientRect();
    const track = (box.width - 11 * gap) / 12;
    const line = (n: number): number => box.left + (n - 1) * (track + gap);
    const width = (span: number): number => span * track + (span - 1) * gap;
    const [a, b, c, d] = [first, second, spanned, plain].map((cell) =>
      cell.getBoundingClientRect(),
    );

    if (
      a === undefined ||
      b === undefined ||
      c === undefined ||
      d === undefined
    ) {
      throw new Error('The wall has four cells');
    }

    assertWithin(a.left, line(2));
    assertWithin(a.width, width(6));
    assertWithin(b.left, line(9));
    assertWithin(b.width, width(4));
    assertWithin(b.top, a.top);
    // Track 1 and track 8 of the first row stay empty.
    await expect(a.left - box.left).toBeGreaterThan(track - 1);
    assertWithin(b.left - a.right, track + 2 * gap);
    await expect(c.top).toBeGreaterThan(a.bottom);
    assertWithin(c.left, line(1));
    assertWithin(c.width, width(3));
    assertWithin(d.left, line(4));
    assertWithin(d.width, width(1));

    resize(stage, 400);

    const narrow = grid.getBoundingClientRect();
    const rects = elementChildren(grid).map((cell) =>
      cell.getBoundingClientRect(),
    );

    for (const [index, rect] of rects.entries()) {
      assertWithin(rect.width, narrow.width);
      assertWithin(rect.left, narrow.left);

      const previous = rects[index - 1];

      if (previous !== undefined) {
        await expect(rect.top).toBeGreaterThan(previous.bottom);
      }
    }

    await expect(canvas.getAllByRole('figure')).toStrictEqual(
      elementChildren(grid),
    );
  },
};

const ranked = [
  { name: 'Ridge', heading: 'The ridge' },
  {
    name: 'Valley',
    heading: 'The valley walk, with a heading long enough to wrap',
  },
  { name: 'Lake', heading: 'The lake' },
];

/** Three cells of three parts each, lined up by `rows`. */
export const Rows: Story = {
  render: () => ({
    props: { ranked, trail },
    template: `
      <div data-testid="stage" style="inline-size: 900px">
        <div data-testid="grid" yetiGrid min="none" columns="3" rows="3">
          @for (cell of ranked; track cell.name) {
            <article yetiBox surface="raised" yetiBorder>
              <img [ngSrc]="trail" width="1600" height="900" [alt]="cell.name + ' at dawn'" />
              <h2>{{ cell.heading }}</h2>
              <footer>Walk {{ cell.name }}</footer>
            </article>
          }
        </div>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const grid = canvas.getByTestId('grid');

    await expect(grid).toHaveAttribute('data-rows', '3');
    await itemStyled('grid', grid, 'display', 'grid');
    await itemStyled('box', childAt(grid, 0), 'padding-top', padded);

    const footers = [...grid.querySelectorAll('footer')].map((footer) =>
      Math.round(footer.getBoundingClientRect().top),
    );
    // The height of each heading's text, not of its row, which the subgrid
    // stretches to the tallest heading.
    const headings = [...grid.querySelectorAll('h2')].map((heading) => {
      const range = document.createRange();
      range.selectNodeContents(heading);

      return range.getBoundingClientRect().height;
    });

    await expect(footers).toHaveLength(ranked.length);
    await expect(new Set(footers).size).toBe(1);
    // The long heading wraps, so the alignment is the subgrid's doing.
    await expect(Math.max(...headings)).toBeGreaterThan(
      Math.min(...headings) + 1,
    );
  },
};
