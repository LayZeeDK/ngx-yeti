import { NgOptimizedImage } from '@angular/common';
import { signal, type WritableSignal } from '@angular/core';
import {
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
import type { YetiColumns, YetiGap, YetiWidthOrNone } from 'ngx-yeti';
import { expect, userEvent, waitFor } from 'storybook/test';
import manifest from 'yeti-css/manifest';
// Kept a URL in the static build too: NgOptimizedImage refuses `data:` URLs.
import trail from '../../.storybook/assets/trail.svg?no-inline';
import { YetiMasonry } from './masonry';

interface MasonryState {
  readonly min: YetiWidthOrNone | undefined;
  readonly columns: YetiColumns | undefined;
  readonly gap: YetiGap | undefined;
}

const unset: MasonryState = {
  min: undefined,
  columns: undefined,
  gap: undefined,
};

/**
 * The inputs the inputs story binds, by story id, so its play function can
 * change them the way a Storybook control does.
 */
const masonryStates = storyStates<WritableSignal<MasonryState>>('masonry');

/** Either of Yeti's paths sets a gap between the columns. */
const columnGapSet = (value: string): boolean => value !== 'normal';

/** The left edges of the columns, rounded, in screen order. */
function columnLefts(masonry: HTMLElement): number[] {
  return [
    ...new Set(
      elementChildren(masonry).map((item) =>
        Math.round(item.getBoundingClientRect().left),
      ),
    ),
  ].toSorted((a, b) => a - b);
}

/** Sets the width of the element the story resizes. */
function resize(stage: HTMLElement, width: number): void {
  stage.style.inlineSize = `${String(width)}px`;
}

/** Whether this engine takes Yeti's guarded native path. */
function nativePath(): boolean {
  return CSS.supports('grid-template-rows', 'masonry');
}

/**
 * Expects the order the engine's path draws (masonry.md, Testing
 * Decisions): on the multi-column path the column index never decreases in
 * source order; on the native path the first row holds the first items in
 * source order. `dir` is the writing direction, which puts the first column
 * on the right in RTL.
 */
async function expectPathOrder(
  masonry: HTMLElement,
  dir: 'ltr' | 'rtl',
): Promise<void> {
  const lefts = columnLefts(masonry);
  const ordered = dir === 'ltr' ? lefts : lefts.toReversed();
  const columns = elementChildren(masonry).map((item) =>
    ordered.indexOf(Math.round(item.getBoundingClientRect().left)),
  );

  await expect(lefts.length).toBeGreaterThan(1);

  if (nativePath()) {
    const firstRow = elementChildren(masonry)
      .slice(0, lefts.length)
      .map((item) => item.getBoundingClientRect());

    await expect(
      new Set(firstRow.map((rect) => Math.round(rect.top))).size,
    ).toBe(1);
    await expect(columns.slice(0, lefts.length)).toStrictEqual(
      lefts.map((_, index) => index),
    );

    return;
  }

  await expect(columns).toStrictEqual(columns.toSorted((a, b) => a - b));
}

/** Tabs through the links and expects them in source order. */
async function expectTabInSourceOrder(masonry: HTMLElement): Promise<void> {
  const links = [...masonry.querySelectorAll('a')];

  await expect(links.length).toBeGreaterThan(1);

  for (const link of links) {
    await userEvent.tab();
    await expect(link).toHaveFocus();
  }
}

const meta: Meta<YetiMasonry> = {
  id: 'masonry',
  component: YetiMasonry,
  decorators: [moduleMetadata({ imports: [YetiMasonry, NgOptimizedImage] })],
};
export default meta;

type Story = StoryObj<YetiMasonry>;

const photos = [
  'A tall waterfall',
  'A wide valley',
  'A square pond',
  'A tall pine',
  'A wide ridge',
];

/** Yeti's example: five photos with their dimensions, in a resizable stage. */
export const Default: Story = {
  render: () => ({
    props: { photos, trail },
    template: `
      <div data-testid="stage" style="inline-size: 1000px">
        <div data-testid="masonry" yetiMasonry min="xs" columns="3">
          @for (photo of photos; track photo) {
            <img [ngSrc]="trail" width="1600" height="900" [alt]="photo" />
          }
        </div>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const masonry = canvas.getByTestId('masonry');

    await expect(masonry).toHaveAttribute('class', 'masonry');
    await expect(masonry).toHaveAttribute('data-ngx-yeti-item-masonry', '');
    await expect(masonry).toHaveAttribute('data-min', 'xs');
    await expect(masonry).toHaveAttribute('data-columns', '3');
    await expect(masonry).not.toHaveAttribute('data-gap');
    await expect(
      [masonry, ...masonry.querySelectorAll('*')].filter((element) =>
        element.matches('[role], [tabindex]'),
      ),
    ).toStrictEqual([]);
    await expect(canvas.getAllByRole('img')).toHaveLength(photos.length);
  },
};

const heights = [120, 60, 180, 90, 150, 70, 110, 80];

/** Eight blocks of fixed, different heights, each holding a link. */
function blocks(attributes: string, stage = 1000, dir = 'ltr'): string {
  return `
    <div data-testid="stage" dir="${dir}" style="inline-size: ${String(stage)}px">
      <div data-testid="masonry" yetiMasonry ${attributes}>
        @for (height of heights; track $index) {
          <div [style.block-size.px]="height"><a href="#block-{{ $index + 1 }}">Block {{ $index + 1 }}</a></div>
        }
      </div>
    </div>`;
}

/** No `columns`: the count follows the stage's width at `min`. */
export const Fit: Story = {
  render: () => ({
    props: { heights },
    template: blocks('min="xs" gap="sm"'),
  }),
  play: async ({ canvas, canvasElement }) => {
    const stage = canvas.getByTestId('stage');
    const masonry = canvas.getByTestId('masonry');

    await itemStyled('masonry', masonry, 'column-gap', columnGapSet);

    const min = usedLength(canvasElement, 'var(--yeti-width-xs)');
    const gap = usedLength(canvasElement, 'var(--yeti-space-sm)');

    for (const count of [3, 2]) {
      resize(stage, count * min + (count - 1) * gap + 8);

      await waitFor(async () => {
        await expect(columnLefts(masonry)).toHaveLength(count);
      });
    }
  },
};

/** `columns="2"` in a stage wide enough for more. */
export const Capped: Story = {
  render: () => ({
    props: { heights },
    template: blocks('min="2xs" columns="2"'),
  }),
  play: async ({ canvas }) => {
    const masonry = canvas.getByTestId('masonry');

    await expect(masonry).toHaveAttribute('data-columns', '2');
    await itemStyled('masonry', masonry, 'column-gap', columnGapSet);

    await expect(columnLefts(masonry)).toHaveLength(2);
  },
};

/** `min="none"` with `columns="3"`, and `min="none"` alone. */
export const Exact: Story = {
  render: () => ({
    props: { heights },
    template: `
      <div data-testid="stage" style="inline-size: 1000px">
        <div data-testid="exact" yetiMasonry min="none" columns="3">
          @for (height of heights; track $index) {
            <div [style.block-size.px]="height">Item {{ $index + 1 }}</div>
          }
        </div>
        <div data-testid="loose" yetiMasonry min="none">
          @for (height of heights; track $index) {
            <div [style.block-size.px]="height">Loose item {{ $index + 1 }}</div>
          }
        </div>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const stage = canvas.getByTestId('stage');
    const exact = canvas.getByTestId('exact');
    const loose = canvas.getByTestId('loose');

    await itemStyled('masonry', exact, 'column-gap', columnGapSet);

    await expect(columnLefts(exact)).toHaveLength(3);
    await expect(columnLefts(loose)).toHaveLength(1);
    await expect(
      Math.round(elementChildren(loose)[0]?.getBoundingClientRect().width ?? 0),
    ).toBe(Math.round(loose.getBoundingClientRect().width));

    resize(stage, 500);

    await expect(columnLefts(exact)).toHaveLength(3);
  },
};

/**
 * Ledger row A11Y-23: the reading and focus order may differ from the visual
 * order. The order each path draws, and Tab in source order.
 */
export const Order: Story = {
  render: () => ({
    props: { heights },
    template: blocks('min="2xs" gap="sm"', 800),
  }),
  play: async ({ canvas, canvasElement }) => {
    const masonry = canvas.getByTestId('masonry');

    await itemStyled('masonry', masonry, 'column-gap', columnGapSet);
    await expectPathOrder(masonry, 'ltr');

    if (!nativePath()) {
      // Consecutive items in one column sit one gap apart.
      const gap = usedLength(canvasElement, 'var(--yeti-space-sm)');
      const items = elementChildren(masonry).map((item) =>
        item.getBoundingClientRect(),
      );

      for (const [index, rect] of items.entries()) {
        const previous = items[index - 1];

        if (
          previous !== undefined &&
          Math.round(previous.left) === Math.round(rect.left)
        ) {
          await expect(
            Math.abs(rect.top - previous.bottom - gap),
          ).toBeLessThanOrEqual(1);
        }
      }
    }

    await expectTabInSourceOrder(masonry);
  },
};

/** Every input bound from a Storybook control, and the static `min`. */
export const Inputs: Story = {
  argTypes: {
    // Yeti's vocabularies, which the contract spec proves equal to the
    // inputs' types, so a pin move that adds a value adds its option.
    min: {
      control: 'select',
      options: manifestValues(manifest.components.masonry, 'data-min'),
    },
    columns: {
      control: 'select',
      options: manifestValues(manifest.components.masonry, 'data-columns'),
    },
    gap: {
      control: 'select',
      options: manifestValues(manifest.components.masonry, 'data-gap'),
    },
  },
  render: (args, { id }) => {
    const state = signal<MasonryState>({
      min: args.min,
      columns: args.columns,
      gap: args.gap,
    });
    masonryStates.track(id, state);

    // Template props are named unlike the inputs, which they would collide
    // with once `component` is set.
    return {
      props: { state },
      template: `
        <div data-testid="masonry" yetiMasonry [min]="state().min" [columns]="state().columns" [gap]="state().gap">
          <p>The first item.</p>
          <p>The second item.</p>
        </div>
        <div data-testid="static" yetiMasonry min="xs">
          <p>An item.</p>
          <p>Another item.</p>
        </div>`,
    };
  },
  play: async ({ canvas, id }) => {
    const state = masonryStates.get(id);
    const masonry = canvas.getByTestId('masonry');
    const fixed = canvas.getByTestId('static');
    const cases: readonly {
      readonly attribute: string;
      readonly set: Partial<MasonryState>;
      readonly value: string;
    }[] = [
      { attribute: 'data-min', set: { min: 'sm' }, value: 'sm' },
      { attribute: 'data-columns', set: { columns: '4' }, value: '4' },
      { attribute: 'data-gap', set: { gap: 'xs-lg' }, value: 'xs-lg' },
    ];

    for (const { attribute, set, value } of cases) {
      state.set({ ...unset, ...set });
      await waitFor(async () => {
        await expect(masonry).toHaveAttribute(attribute, value);
      });

      state.set(unset);
      await waitFor(async () => {
        await expect(masonry).not.toHaveAttribute(attribute);
      });
    }

    await expect(fixed).toHaveAttribute('data-min', 'xs');
    await expect(fixed).toHaveAttribute('min', 'xs');
  },
};

/** The order story in a right-to-left context. */
export const Rtl: Story = {
  render: () => ({
    props: { heights },
    template: blocks('min="2xs" gap="sm"', 800, 'rtl'),
  }),
  play: async ({ canvas }) => {
    const masonry = canvas.getByTestId('masonry');

    await itemStyled('masonry', masonry, 'column-gap', columnGapSet);

    const lefts = columnLefts(masonry);

    await expect(
      Math.round(
        elementChildren(masonry)[0]?.getBoundingClientRect().left ?? 0,
      ),
    ).toBe(lefts.at(-1));
    await expectPathOrder(masonry, 'rtl');
    await expectTabInSourceOrder(masonry);
  },
};
