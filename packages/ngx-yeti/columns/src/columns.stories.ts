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
import type { YetiAlign, YetiColumns, YetiGap, YetiJustify } from 'ngx-yeti';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { expect, userEvent, waitFor } from 'storybook/test';
import manifest from 'yeti-css/manifest';
import { NgxYetiColumns } from './columns';
import { YetiColumnsChild } from './columns-child';

interface ColumnsState {
  readonly gap: YetiGap | undefined;
  readonly align: YetiAlign | undefined;
  readonly justify: YetiJustify | undefined;
  readonly columns: YetiColumns | undefined;
}

const unset: ColumnsState = {
  gap: undefined,
  align: undefined,
  justify: undefined,
  columns: undefined,
};

const columnsManifest = manifest.components.columns;

const columnsStates = storyStates<WritableSignal<ColumnsState>>('columns');

/** A box's padding once its file has applied: the page's default is none. */
const padded = (value: string): boolean => value !== '0px';

/**
 * Sizes the container 2rem wider or narrower than the threshold's width
 * (columns.md, Testing Decisions).
 */
function sizeAround(
  frame: HTMLElement,
  threshold: string,
  side: 'wider' | 'narrower',
): void {
  const width = usedLength(frame, `var(--yeti-width-${threshold})`);
  const margin = usedLength(frame, '2rem');
  frame.style.inlineSize = `${String(side === 'wider' ? width + margin : width - margin)}px`;
}

/** The children share one row (equal tops) in equal shares. */
function assertOneRow(items: readonly HTMLElement[]): void {
  const [first, ...rest] = items;

  if (first === undefined) {
    throw new Error('No columns');
  }

  for (const item of rest) {
    assertWithin(
      item.getBoundingClientRect().top,
      first.getBoundingClientRect().top,
    );
    assertWithin(
      item.getBoundingClientRect().width,
      first.getBoundingClientRect().width,
    );
  }
}

/** Each child starts its own row at the parent's full width. */
async function expectRows(columns: HTMLElement): Promise<void> {
  const items = elementChildren(columns);
  const width = columns.getBoundingClientRect().width;

  for (const [index, item] of items.entries()) {
    assertWithin(item.getBoundingClientRect().width, width);

    const previous = items[index - 1];

    if (previous !== undefined) {
      await expect(item.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        previous.getBoundingClientRect().bottom - 0.5,
      );
    }
  }
}

/** Yeti's example in a container that can be resized. */
function defaultColumns(dir: 'ltr' | 'rtl'): string {
  return `
    <div data-testid="frame" dir="${dir}" style="resize: horizontal; overflow: auto">
      <div data-testid="columns" yetiColumns threshold="md">
        <section data-testid="plan" yetiBox surface="raised" yetiBorder><h2>Plan</h2><p>Three equal columns in a wide container. <a href="#plan">Plan notes</a></p></section>
        <section data-testid="build" yetiBox surface="raised" yetiBorder><h2>Build</h2><p>Three rows in a narrow one. <a href="#build">Build notes</a></p></section>
        <section data-testid="ship" yetiBox surface="raised" yetiBorder><h2>Ship</h2><p>No breakpoint anywhere. <a href="#ship">Ship notes</a></p></section>
      </div>
    </div>`;
}

const meta: Meta<NgxYetiColumns> = {
  id: 'columns',
  component: NgxYetiColumns,
  decorators: [
    moduleMetadata({
      imports: [NgxYetiColumns, YetiColumnsChild, YetiBox, YetiBorder],
    }),
  ],
};
export default meta;

type Story = StoryObj<NgxYetiColumns>;

/** Yeti's example: three raised, bordered boxes with `threshold="md"`. */
export const Default: Story = {
  render: () => ({ template: defaultColumns('ltr') }),
  play: async ({ canvas }) => {
    const frame = canvas.getByTestId('frame');
    const columns = canvas.getByTestId('columns');

    await expect(columns).toHaveAttribute('class', 'columns');
    await expect(columns).toHaveAttribute('data-threshold', 'md');
    await expect(columns).toHaveAttribute('data-ngx-yeti-item-columns', '');
    await expect(
      columns
        .getAttributeNames()
        .filter((name) => name.startsWith('data-'))
        .toSorted(),
    ).toStrictEqual([
      'data-ngx-yeti-item-columns',
      'data-testid',
      'data-threshold',
    ]);
    await expect(
      [columns, ...columns.querySelectorAll('*')].filter((element) =>
        element.matches('[role], [tabindex]'),
      ),
    ).toStrictEqual([]);

    await itemStyled('columns', columns, 'flex-wrap', 'wrap');
    await itemStyled('box', canvas.getByTestId('plan'), 'padding-top', padded);

    sizeAround(frame, 'md', 'wider');
    assertOneRow(elementChildren(columns));

    sizeAround(frame, 'md', 'narrower');
    await expectRows(columns);
  },
};

/** `columns="2"` with three children above the threshold. */
export const Capped: Story = {
  render: () => ({
    template: `
      <div data-testid="frame">
        <div data-testid="columns" yetiColumns threshold="sm" columns="2">
          <section data-testid="first" yetiBox surface="raised" yetiBorder><p>Day pass</p></section>
          <section data-testid="second" yetiBox surface="raised" yetiBorder><p>Season pass</p></section>
          <section data-testid="third" yetiBox surface="raised" yetiBorder><p>Lifetime pass</p></section>
        </div>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const frame = canvas.getByTestId('frame');
    const columns = canvas.getByTestId('columns');
    const first = canvas.getByTestId('first');
    const second = canvas.getByTestId('second');
    const third = canvas.getByTestId('third');

    await expect(columns).toHaveAttribute('data-columns', '2');

    await itemStyled('columns', columns, 'flex-wrap', 'wrap');
    await itemStyled('box', first, 'padding-top', padded);

    sizeAround(frame, 'sm', 'wider');
    assertOneRow([first, second]);
    await expect(third.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      first.getBoundingClientRect().bottom - 0.5,
    );
    assertWithin(
      third.getBoundingClientRect().width,
      columns.getBoundingClientRect().width,
    );
  },
};

/** An `article` taking two shares beside a plain `aside`. */
export const Span: Story = {
  render: () => ({
    template: `
      <div data-testid="frame">
        <div data-testid="columns" yetiColumns threshold="sm">
          <article data-testid="article" yetiColumnsChild span="2"><p>Two shares of the row.</p></article>
          <aside data-testid="aside"><p>One share.</p></aside>
        </div>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const frame = canvas.getByTestId('frame');
    const columns = canvas.getByTestId('columns');
    const article = canvas.getByTestId('article');
    const aside = canvas.getByTestId('aside');

    await expect(article).toHaveAttribute('data-span', '2');
    await expect(article).toHaveAttribute('span', '2');

    await itemStyled('columns', columns, 'flex-wrap', 'wrap');

    sizeAround(frame, 'sm', 'wider');
    assertWithin(
      article.getBoundingClientRect().top,
      aside.getBoundingClientRect().top,
    );
    // Both children have a basis of 0, so the row less the gap is split
    // two to one.
    assertWithin(
      article.getBoundingClientRect().width,
      2 * aside.getBoundingClientRect().width,
    );

    sizeAround(frame, 'sm', 'narrower');
    await expectRows(columns);
  },
};

/** `gap`, `align`, `justify`, and `columns` as Storybook controls. */
export const Inputs: Story = {
  argTypes: {
    // Yeti's vocabularies, which the contract spec proves equal to the
    // inputs' types, so a pin move that adds a value adds its option.
    gap: {
      control: 'select',
      options: manifestValues(columnsManifest, 'data-gap'),
    },
    align: {
      control: 'select',
      options: manifestValues(columnsManifest, 'data-align'),
    },
    justify: {
      control: 'select',
      options: manifestValues(columnsManifest, 'data-justify'),
    },
    columns: {
      control: 'select',
      options: manifestValues(columnsManifest, 'data-columns'),
    },
  },
  render: (args, { id }) => {
    const state = columnsStates.track(
      id,
      signal<ColumnsState>({
        gap: args.gap,
        align: args.align,
        justify: args.justify,
        columns: args.columns,
      }),
    );

    // Template props are named unlike the inputs, which they would collide
    // with once `component` is set.
    return {
      props: { state },
      template: `
        <div data-testid="columns" yetiColumns [gap]="state().gap" [align]="state().align" [justify]="state().justify" [columns]="state().columns">
          <p>The first column.</p>
          <p>The second column.</p>
          <p>The third column.</p>
        </div>
        <div data-testid="static" yetiColumns align="center">
          <p>A layout written with a static align.</p>
          <p>Its text stays start-aligned.</p>
        </div>`,
    };
  },
  play: async ({ canvas, id }) => {
    const state = columnsStates.get(id);
    const columns = canvas.getByTestId('columns');
    const cases: readonly {
      readonly attribute: string;
      readonly set: Partial<ColumnsState>;
      readonly value: string;
    }[] = [
      { attribute: 'data-gap', set: { gap: 'sm-lg' }, value: 'sm-lg' },
      { attribute: 'data-align', set: { align: 'end' }, value: 'end' },
      {
        attribute: 'data-justify',
        set: { justify: 'between' },
        value: 'between',
      },
      { attribute: 'data-columns', set: { columns: '2' }, value: '2' },
    ];

    for (const { attribute, set, value } of cases) {
      state.set({ ...unset, ...set });
      await waitFor(async () => {
        await expect(columns).toHaveAttribute(attribute, value);
      });

      state.set(unset);
      await waitFor(async () => {
        await expect(columns).not.toHaveAttribute(attribute);
      });
    }

    const aligned = canvas.getByTestId('static');

    await itemStyled('columns', aligned, 'flex-wrap', 'wrap');

    await expect(aligned).toHaveAttribute('data-align', 'center');
    await expect(aligned).not.toHaveAttribute('align');
    await expect(columns).not.toHaveAttribute('align');
    await expect(getComputedStyle(aligned).textAlign).toBe('start');
  },
};

/**
 * A layout with `gap="2xl"` holding one with no `gap`, beside a third with
 * no `gap`: a nested layout never inherits its parent's value.
 */
export const Nested: Story = {
  render: () => ({
    template: `
      <div data-testid="outer" yetiColumns gap="2xl">
        <div data-testid="inner" yetiColumns>
          <p>Inner one.</p>
          <p>Inner two.</p>
        </div>
        <p>Outer two.</p>
      </div>
      <div data-testid="third" yetiColumns>
        <p>Third one.</p>
        <p>Third two.</p>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const outer = canvas.getByTestId('outer');
    const inner = canvas.getByTestId('inner');
    const third = canvas.getByTestId('third');

    await itemStyled('columns', outer, 'flex-wrap', 'wrap');

    await expect(getComputedStyle(inner).columnGap).toBe(
      getComputedStyle(third).columnGap,
    );
    await expect(getComputedStyle(inner).columnGap).not.toBe(
      getComputedStyle(outer).columnGap,
    );
  },
};

/** `columns--default` in a right-to-left page. */
export const Rtl: Story = {
  render: () => ({ template: defaultColumns('rtl') }),
  play: async ({ canvas }) => {
    const frame = canvas.getByTestId('frame');
    const columns = canvas.getByTestId('columns');
    const [first, ...rest] = elementChildren(columns);

    await itemStyled('columns', columns, 'flex-wrap', 'wrap');
    await itemStyled('box', canvas.getByTestId('plan'), 'padding-top', padded);

    sizeAround(frame, 'md', 'wider');
    assertOneRow(elementChildren(columns));

    if (first === undefined) {
      throw new Error('No columns');
    }

    for (const item of rest) {
      await expect(first.getBoundingClientRect().left).toBeGreaterThan(
        item.getBoundingClientRect().right,
      );
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    for (const link of columns.querySelectorAll('a')) {
      await userEvent.tab();
      await expect(link).toHaveFocus();
    }
  },
};
