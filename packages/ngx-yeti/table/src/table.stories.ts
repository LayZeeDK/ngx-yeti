import { signal, type WritableSignal } from '@angular/core';
import {
  assertWithin,
  composite,
  contrastRatio,
  elementChildren,
  itemLinks,
  itemStyled,
  nextFrame,
  parseColor,
  type SrgbColor,
  storyStates,
  usedLength,
} from '@ngx-yeti/testing';
import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import type { YetiSizeControl } from 'ngx-yeti';
import { YetiIcon } from 'ngx-yeti/icon';
import { YetiScroller } from 'ngx-yeti/scroller';
import { YetiVisuallyHidden } from 'ngx-yeti/visually-hidden';
import { expect, waitFor, within } from 'storybook/test';
import { YetiTable } from './table';
import { YetiTableCell } from './table-cell';
import { YetiTableHead } from './table-head';
import { YetiNumeric } from './table-numeric';

/**
 * The bound `size` of the sizes story's first table, by story id, so the
 * play function can unset it the way a Storybook control does.
 */
const sizeStates =
  storyStates<WritableSignal<YetiSizeControl | undefined>>('table');

function byTestId(root: Element, id: string): HTMLElement {
  const element = root.querySelector(`[data-testid="${id}"]`);

  if (!(element instanceof HTMLElement)) {
    throw new Error(`No element ${id}`);
  }

  return element;
}

/** The value, which the story's markup is known to hold. */
function defined<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new Error('A value the story renders is missing');
  }

  return value;
}

function all(root: Element, selector: string): HTMLElement[] {
  return [...root.querySelectorAll(selector)].filter(
    (element) => element instanceof HTMLElement,
  );
}

function first(root: Element, selector: string): HTMLElement {
  const [element] = all(root, selector);

  if (element === undefined) {
    throw new Error(`Nothing matches ${selector}`);
  }

  return element;
}

/**
 * Waits for the table's file: it tops every cell, where the page's default
 * is `middle` (upstream bug O2 can keep a stale computed style).
 */
async function tableStyled(table: HTMLElement): Promise<void> {
  await itemStyled('table', first(table, 'th, td'), 'vertical-align', 'top');
}

/**
 * The colour painted behind `element`: its own background and its
 * ancestors', composited down to the first opaque one.
 */
function backdrop(element: Element): SrgbColor {
  const layers: string[] = [];

  for (
    let node: Element | null = element;
    node !== null;
    node = node.parentElement
  ) {
    const background = getComputedStyle(node).backgroundColor;
    layers.push(background);

    if (parseColor(background).alpha === 1) {
      break;
    }
  }

  return layers.reduceRight<SrgbColor>(
    (below, layer) => composite(layer, below),
    parseColor('#fff'),
  );
}

/**
 * Text contrast of each element against what is painted behind it, at least
 * 4.5:1, in the light and the dark scheme, with the exact WCAG formula on
 * computed colours.
 */
async function expectReadable(
  frame: HTMLElement,
  texts: readonly HTMLElement[],
): Promise<void> {
  try {
    for (const scheme of ['light', 'dark']) {
      frame.style.colorScheme = scheme;

      for (const text of texts) {
        await expect(
          contrastRatio(getComputedStyle(text).color, backdrop(text)),
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  } finally {
    frame.style.colorScheme = '';
  }
}

/** The frame every story renders in: Yeti's page surface and text. */
function framed(content: string): string {
  return `<div data-testid="frame" style="color: var(--yeti-color-text); background-color: var(--yeti-color-surface)">${content}</div>`;
}

const summits = `
  <caption>Summits</caption>
  <thead>
    <tr><th scope="col">Peak</th><th scope="col" yetiNumeric>Height (m)</th></tr>
  </thead>
  <tbody>
    <tr><td>Ben Nevis</td><td yetiNumeric>1,345</td></tr>
    <tr><td>Snowdon</td><td yetiNumeric>1,085</td></tr>
    <tr><td>Scafell Pike</td><td yetiNumeric>978</td></tr>
  </tbody>`;

/** Rows of a long or a narrow table. */
function stageRows(count: number): string {
  return Array.from(
    { length: count },
    (_, index) =>
      `<tr><th scope="row">Stage ${String(index + 1)}</th><td yetiNumeric>${String(12 + index)}.4</td></tr>`,
  ).join('');
}

/** A tick in a centred cell: the SVG in a `yetiIcon`, its meaning in text. */
const tick =
  '<span data-testid="tick" yetiIcon><svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" /></svg></span><span yetiVisuallyHidden>Included</span>';

const meta: Meta<YetiTable> = {
  id: 'table',
  component: YetiTable,
  decorators: [
    moduleMetadata({
      imports: [
        YetiTable,
        YetiTableCell,
        YetiTableHead,
        YetiNumeric,
        YetiIcon,
        YetiScroller,
        YetiVisuallyHidden,
      ],
    }),
  ],
};
export default meta;

type Story = StoryObj<YetiTable>;

/** Yeti's example (table spec, section 8): striped, with a numeric column. */
export const Default: Story = {
  render: () => ({
    template: framed(`<table yetiTable striped>${summits}</table>`),
  }),
  play: async ({ canvas, canvasElement }) => {
    const frame = byTestId(canvasElement, 'frame');
    const table = canvas.getByRole('table', { name: 'Summits' });
    const rows = all(table, 'tbody > tr');
    const odd = defined(rows[0]);
    const even = defined(rows[1]);
    const header = first(table, 'thead th');
    const body = first(table, 'tbody td');
    const numeric = all(table, '[yetinumeric]');

    await expect(table).toHaveAttribute('class', 'table');
    await expect(table).toHaveAttribute('data-ngx-yeti-item-table', '');
    await expect(table).toHaveAttribute('data-striped', '');
    await expect(numeric).toHaveLength(4);

    for (const cell of numeric) {
      await expect(cell).toHaveAttribute('data-numeric', '');
    }

    await expect(all(frame, '[tabindex]')).toStrictEqual([]);
    await expect(all(frame, '[role]')).toStrictEqual([]);

    await tableStyled(table);

    await expect(Number(getComputedStyle(header).fontWeight)).toBeGreaterThan(
      Number(getComputedStyle(body).fontWeight),
    );
    await expect(getComputedStyle(even).backgroundColor).not.toBe(
      getComputedStyle(odd).backgroundColor,
    );

    for (const cell of numeric) {
      const style = getComputedStyle(cell);

      await expect(style.textAlign).toBe('end');
      await expect(style.fontVariantNumeric).toBe('tabular-nums');
    }

    await expectReadable(frame, [
      header,
      body,
      first(even, 'td'),
      first(table, 'caption'),
    ]);
  },
};

/**
 * Three tables, `size="sm"` (bound), none, and `size="lg"`: the padding
 * steps up, and the bound size unset removes its attribute.
 */
export const Sizes: Story = {
  render: (_args, { id }) => ({
    props: {
      tableSize: sizeStates.track(
        id,
        signal<YetiSizeControl | undefined>('sm'),
      ),
    },
    template: framed(`
      <table data-testid="sm" yetiTable [size]="tableSize()" aria-label="Small">
        <tbody><tr><th scope="row">Ben Nevis</th><td>1,345</td></tr></tbody>
      </table>
      <table data-testid="md" yetiTable aria-label="Default">
        <tbody><tr><th scope="row">Snowdon</th><td>1,085</td></tr></tbody>
      </table>
      <table data-testid="lg" yetiTable size="lg" aria-label="Large">
        <tbody><tr><th scope="row">Scafell Pike</th><td>978</td></tr></tbody>
      </table>`),
  }),
  play: async ({ canvasElement, id }) => {
    const sm = byTestId(canvasElement, 'sm');
    const md = byTestId(canvasElement, 'md');
    const lg = byTestId(canvasElement, 'lg');

    await expect(sm).toHaveAttribute('data-size', 'sm');
    await expect(md).not.toHaveAttribute('data-size');
    await expect(lg).toHaveAttribute('data-size', 'lg');

    await tableStyled(md);

    const padding = (table: HTMLElement): number =>
      Number.parseFloat(getComputedStyle(first(table, 'td')).paddingTop);

    await expect(padding(sm)).toBeLessThan(padding(md));
    await expect(padding(md)).toBeLessThan(padding(lg));

    sizeStates.get(id).set(undefined);
    await waitFor(async () => {
      await expect(sm).not.toHaveAttribute('data-size');
    });
  },
};

/**
 * `hover` on a table. Storybook's pointer does not set `:hover`, so the
 * tint and its contrast are asserted in layer 2 (`table.spec.ts`).
 */
export const Hover: Story = {
  render: () => ({
    template: framed(
      `<table yetiTable hover aria-label="Summits by height">${summits.replace(/<caption[^]*?<\/caption>/, '')}</table>`,
    ),
  }),
  play: async ({ canvas, canvasElement }) => {
    const table = canvas.getByRole('table', { name: 'Summits by height' });

    await expect(table).toHaveAttribute('data-hover', '');
    await tableStyled(table);
    await expectReadable(byTestId(canvasElement, 'frame'), [
      first(table, 'tbody td'),
    ]);
  },
};

/** `border` with `size="sm"`: Yeti's cell borders, never the HTML border. */
export const Border: Story = {
  render: () => ({
    template: framed(
      `<table yetiTable border size="sm" aria-label="Summits, bordered">${summits.replace(/<caption[^]*?<\/caption>/, '')}</table>`,
    ),
  }),
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Summits, bordered' });
    const cell = getComputedStyle(first(table, 'tbody td'));
    const header = getComputedStyle(first(table, 'thead th'));

    await expect(table).toHaveAttribute('data-border', '');
    await expect(table).not.toHaveAttribute('border');

    await tableStyled(table);

    await expect(Number.parseFloat(cell.borderLeftWidth)).toBeGreaterThan(0);
    await expect(Number.parseFloat(cell.borderTopWidth)).toBeGreaterThan(0);
    await expect(getComputedStyle(table).borderTopWidth).toBe('0px');
    await expect(header.borderBottomColor).not.toBe(cell.borderBottomColor);
  },
};

/** `nowrap` on a table, and on one cell of another, in a narrow frame. */
export const Nowrap: Story = {
  render: () => ({
    template: framed(`
      <div style="max-inline-size: 16rem">
        <div yetiScroller aria-label="Every cell kept on its line">
          <table data-testid="whole" yetiTable nowrap aria-label="Whole table">
            <tbody><tr><th scope="row">A long stage name</th><td>Through the high pass and down the valley</td></tr></tbody>
          </table>
        </div>
        <table data-testid="single" yetiTable aria-label="One cell">
          <tbody><tr><th scope="row">A long stage name</th><td data-testid="kept" yetiTableCell nowrap>Kept on one line</td><td>Through the high pass and down the valley</td></tr></tbody>
        </table>
      </div>`),
  }),
  play: async ({ canvasElement }) => {
    const whole = byTestId(canvasElement, 'whole');
    const single = byTestId(canvasElement, 'single');
    const kept = byTestId(canvasElement, 'kept');

    await expect(whole).toHaveAttribute('data-nowrap', '');
    await expect(whole).toHaveAttribute('nowrap', '');
    await expect(kept).toHaveAttribute('data-nowrap', '');
    await expect(kept).not.toHaveAttribute('nowrap');
    await expect(single).not.toHaveAttribute('data-nowrap');

    await tableStyled(whole);

    for (const cell of all(whole, 'th, td')) {
      await expect(getComputedStyle(cell).whiteSpace).toBe('nowrap');
    }

    for (const cell of all(single, 'th, td')) {
      await expect(getComputedStyle(cell).whiteSpace).toBe(
        cell === kept ? 'nowrap' : 'normal',
      );
    }
  },
};

/**
 * `fixed` on four columns, and on four columns whose first header is 40 %
 * wide.
 */
export const Fixed: Story = {
  render: () => ({
    template: framed(`
      <table data-testid="equal" yetiTable fixed aria-label="Plans compared">
        <thead><tr><th scope="col">Feature</th><th scope="col">Free</th><th scope="col">Walker</th><th scope="col">Summit and every extra route</th></tr></thead>
        <tbody><tr><th scope="row">Offline maps</th><td>No</td><td>Yes</td><td>Yes</td></tr></tbody>
      </table>
      <table data-testid="wide-first" yetiTable fixed aria-label="Plans compared, feature column wider">
        <thead><tr><th scope="col" style="inline-size: 40%">Feature</th><th scope="col">Free</th><th scope="col">Walker</th><th scope="col">Summit and every extra route</th></tr></thead>
        <tbody><tr><th scope="row">Offline maps</th><td>No</td><td>Yes</td><td>Yes</td></tr></tbody>
      </table>`),
  }),
  play: async ({ canvasElement }) => {
    const equal = byTestId(canvasElement, 'equal');
    const wideFirst = byTestId(canvasElement, 'wide-first');
    const widths = (table: HTMLElement): number[] =>
      all(table, 'thead th').map((cell) => cell.getBoundingClientRect().width);

    await expect(equal).toHaveAttribute('data-fixed', '');
    await tableStyled(equal);
    await expect(getComputedStyle(equal).tableLayout).toBe('fixed');

    const [one, ...others] = widths(equal);

    for (const width of others) {
      assertWithin(width, defined(one));
    }

    const [feature, plan, ...plans] = widths(wideFirst);

    await expect(defined(feature)).toBeGreaterThan(defined(plan) + 1);

    for (const width of plans) {
      assertWithin(width, defined(plan));
    }
  },
};

/**
 * Yeti's comparison table (table spec, section 8) with the static `align`
 * form on cells and a row, a numeric cell in the centred row, and a tick in
 * a `yetiIcon`.
 */
export const Align: Story = {
  render: () => ({
    template: framed(`
      <table yetiTable fixed border aria-label="Plans compared">
        <thead>
          <tr>
            <th scope="col" style="inline-size: 40%">Feature</th>
            <th scope="col" yetiTableCell align="center">Free</th>
            <th scope="col" yetiTableCell align="center">Walker</th>
            <th scope="col" yetiNumeric>Price</th>
          </tr>
        </thead>
        <tbody>
          <tr data-testid="row" yetiTableCell align="center">
            <th data-testid="own" scope="row" yetiTableCell align="start">Offline maps</th>
            <td data-testid="centred">No</td>
            <td data-testid="ticked">${tick}</td>
            <td data-testid="numeric" yetiNumeric>4.50</td>
          </tr>
        </tbody>
      </table>`),
  }),
  play: async ({ canvas, canvasElement }) => {
    const table = canvas.getByRole('table', { name: 'Plans compared' });
    const row = byTestId(canvasElement, 'row');
    const own = byTestId(canvasElement, 'own');
    const ticked = byTestId(canvasElement, 'ticked');
    const icon = byTestId(canvasElement, 'tick');
    const align = (id: string): string =>
      getComputedStyle(byTestId(canvasElement, id)).textAlign;

    for (const host of all(table, '[yetitablecell]')) {
      await expect(host).toHaveAttribute('data-align');
      await expect(host).not.toHaveAttribute('align');
    }

    await expect(row).toHaveAttribute('data-align', 'center');
    await expect(own).toHaveAttribute('data-align', 'start');

    await tableStyled(table);
    await itemStyled('icon', icon, 'align-items', 'center');
    // Until its file applies, the hidden text sits beside the tick and moves
    // it off the cell's centre.
    await itemStyled(
      'visually-hidden',
      within(ticked).getByText('Included'),
      'position',
      'absolute',
    );

    await expect(align('centred')).toBe('center');
    await expect(align('own')).toBe('start');
    await expect(align('numeric')).toBe('end');

    const cellBox = ticked.getBoundingClientRect();
    const style = getComputedStyle(ticked);
    const contentCentre =
      cellBox.left +
      Number.parseFloat(style.borderLeftWidth) +
      Number.parseFloat(style.paddingLeft) +
      (cellBox.width -
        Number.parseFloat(style.borderLeftWidth) -
        Number.parseFloat(style.borderRightWidth) -
        Number.parseFloat(style.paddingLeft) -
        Number.parseFloat(style.paddingRight)) /
        2;
    const iconBox = icon.getBoundingClientRect();

    assertWithin(iconBox.left + iconBox.width / 2, contentCentre, 2);
    await expect(ticked).toHaveTextContent('Included');
    await expect(within(ticked).getByText('Included')).toHaveClass(
      'visually-hidden',
    );
  },
};

/** `yetiNumeric` on a price and on a legend's values, with no table. */
export const NumericAnywhere: Story = {
  render: () => ({
    template: framed(`
      <p data-testid="price">Total: <span yetiNumeric>1,345</span> metres</p>
      <dl>
        <dt>Distance</dt><dd yetiNumeric>14.2 km</dd>
        <dt>Ascent</dt><dd yetiNumeric>1,120 m</dd>
      </dl>`),
  }),
  play: async ({ canvasElement }) => {
    const marked = all(canvasElement, '[yetinumeric]');

    await expect(marked).toHaveLength(3);

    for (const element of marked) {
      const style = getComputedStyle(element);

      await expect(element).toHaveAttribute('data-numeric', '');
      await expect(element.getAttribute('class')).toBeNull();
      await expect(
        element
          .getAttributeNames()
          .filter((name) => name.startsWith('data-ngx-yeti-')),
      ).toStrictEqual([]);
      await expect(style.fontVariantNumeric).toBe('tabular-nums');
      await expect(style.textAlign).not.toBe('end');
    }

    // A table of an earlier story leaves its link for one frame.
    await nextFrame();
    await expect(itemLinks('table')).toStrictEqual([]);
  },
};

/** A first column of `th scope="row"`: each row's header. */
export const RowHeaders: Story = {
  render: () => ({
    template: framed(`
      <table yetiTable aria-label="Stage distances">
        <thead><tr><th scope="col">Stage</th><th scope="col" yetiNumeric>Kilometres</th></tr></thead>
        <tbody>${stageRows(3)}</tbody>
      </table>`),
  }),
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Stage distances' });

    await expect(
      within(table)
        .getAllByRole('rowheader')
        .map((cell) => cell.textContent.trim()),
    ).toStrictEqual(['Stage 1', 'Stage 2', 'Stage 3']);
    await expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent.trim()),
    ).toStrictEqual(['Stage', 'Kilometres']);
    await expect(within(table).getAllByRole('cell')).toHaveLength(3);
  },
};

/** A wide `nowrap` table as the one child of a named scroller. */
export const Wide: Story = {
  render: () => ({
    template: framed(`
      <div style="max-inline-size: 20rem">
        <div data-testid="scroller" yetiScroller aria-labelledby="quarterly">
          <table yetiTable size="sm" border nowrap>
            <caption id="quarterly">Quarterly results</caption>
            <thead><tr><th scope="col">Region</th><th scope="col" yetiNumeric>First quarter</th><th scope="col" yetiNumeric>Second quarter</th><th scope="col" yetiNumeric>Third quarter</th><th scope="col" yetiNumeric>Fourth quarter</th></tr></thead>
            <tbody><tr><th scope="row">North</th><td yetiNumeric>120</td><td yetiNumeric>132</td><td yetiNumeric>141</td><td yetiNumeric>158</td></tr></tbody>
          </table>
        </div>
      </div>`),
  }),
  play: async ({ canvas, canvasElement }) => {
    const scroller = byTestId(canvasElement, 'scroller');
    const table = canvas.getByRole('table', { name: 'Quarterly results' });

    await expect(
      canvas.getByRole('region', { name: 'Quarterly results' }),
    ).toBe(scroller);
    await expect(elementChildren(scroller)).toStrictEqual([table]);
    await expect(table).not.toHaveAttribute('role');

    await tableStyled(table);
    await itemStyled('scroller', scroller, 'display', 'flex');

    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    await expect(getComputedStyle(table).display).toBe('table');
  },
};

/** A long table whose head is pinned while its rows scroll. */
export const StickyHead: Story = {
  render: () => ({
    template: framed(`
      <div data-testid="viewport" role="region" aria-label="Stages, scrolling" tabindex="0" style="block-size: 12rem; overflow-y: auto">
        <table yetiTable aria-label="Stages">
          <thead data-testid="head" yetiTableHead sticky>
            <tr><th scope="col">Stage</th><th scope="col" yetiNumeric>Kilometres</th></tr>
          </thead>
          <tbody>${stageRows(30)}</tbody>
        </table>
      </div>
      <div data-testid="surface" style="background-color: var(--yeti-color-surface)"></div>`),
  }),
  play: async ({ canvasElement }) => {
    const viewport = byTestId(canvasElement, 'viewport');
    const head = byTestId(canvasElement, 'head');
    const header = first(head, 'th');

    await expect(head).toHaveAttribute('data-sticky', '');

    await tableStyled(first(viewport, 'table'));

    viewport.scrollTop = 200;
    const offset = usedLength(viewport, 'var(--yeti-sticky-offset)', 'block');

    await waitFor(() => {
      assertWithin(
        head.getBoundingClientRect().top,
        viewport.getBoundingClientRect().top + offset,
      );
    });
    await expect(getComputedStyle(header).backgroundColor).toBe(
      getComputedStyle(byTestId(canvasElement, 'surface')).backgroundColor,
    );
    await expect(getComputedStyle(header).boxShadow).toContain('inset');
  },
};
