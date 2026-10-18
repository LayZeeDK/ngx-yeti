import { signal, type WritableSignal } from '@angular/core';
import {
  elementChildren,
  itemStyled,
  storyStates,
  usedLength,
} from '@ngx-yeti/testing';
import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import type { YetiWidth } from 'ngx-yeti';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { YetiCluster } from 'ngx-yeti/cluster';
import { YetiNumeric, YetiTable } from 'ngx-yeti/table';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import manifest from 'yeti-css/manifest';
import { YetiContainer } from './container';
import { YetiHide } from './container-hide';
import { YetiShow } from './container-show';

function byTestId(root: Element, id: string): HTMLElement {
  const element = root.querySelector(`[data-testid="${id}"]`);

  if (!(element instanceof HTMLElement)) {
    throw new Error(`No element ${id}`);
  }

  return element;
}

/** The used px width of a `--yeti-width-*` token, read from a probe. */
function tokenWidth(root: Element, width: YetiWidth): number {
  return usedLength(root, `var(--yeti-width-${width})`);
}

/** The content-box inline size a container query measures. */
function contentWidth(container: HTMLElement): number {
  const style = getComputedStyle(container);
  const edges = [
    style.paddingLeft,
    style.paddingRight,
    style.borderLeftWidth,
    style.borderRightWidth,
  ].reduce((sum, value) => sum + Number.parseFloat(value), 0);

  return container.getBoundingClientRect().width - edges;
}

/**
 * Sizes `stage` so that `container`, which fills it, has a content box of
 * `width` px.
 */
async function fitContent(
  stage: HTMLElement,
  container: HTMLElement,
  width: number,
): Promise<void> {
  const edges =
    container.getBoundingClientRect().width - contentWidth(container);

  stage.style.inlineSize = `${String(width + edges)}px`;
  await waitFor(async () => {
    await expect(contentWidth(container)).toBeCloseTo(width, 1);
  });
}

function displayed(element: Element): boolean {
  return getComputedStyle(element).display !== 'none';
}

/** A box's padding once its file has applied: the page's default is none. */
const padded = (value: string): boolean => value !== '0px';

const siteLinks: readonly {
  readonly label: string;
  readonly path: string;
  readonly show?: YetiWidth;
}[] = [
  { label: 'Home', path: '/' },
  { label: 'Docs', path: '/docs' },
  { label: 'Guides', path: '/guides', show: 'sm' },
  { label: 'Blog', path: '/blog', show: 'sm' },
  { label: 'Changelog', path: '/changelog', show: 'md' },
  { label: 'Community', path: '/community', show: 'md' },
  { label: 'Contact', path: '/contact', show: 'lg' },
];

const showStates = storyStates<WritableSignal<YetiWidth>>('container');

const meta: Meta<YetiContainer> = {
  id: 'container',
  component: YetiContainer,
  decorators: [
    moduleMetadata({
      imports: [
        YetiContainer,
        YetiShow,
        YetiHide,
        YetiBox,
        YetiBorder,
        YetiCluster,
        YetiTable,
        YetiNumeric,
      ],
    }),
  ],
};
export default meta;

type Story = StoryObj<YetiContainer>;

/**
 * Yeti's example (container spec, section 8) in a stage the play function
 * resizes: links and one of four paragraphs appear as the container widens.
 */
export const Default: Story = {
  render: () => ({
    props: { siteLinks },
    template: `
      <div data-testid="stage">
        <div data-testid="container" yetiContainer yetiBox surface="raised" yetiBorder>
          <nav data-testid="nav" yetiCluster aria-label="Site">
            @for (link of siteLinks; track link.label) {
              @if (link.show) {
                <a [href]="link.path" [yetiShow]="link.show">{{ link.label }}</a>
              } @else {
                <a [href]="link.path">{{ link.label }}</a>
              }
            }
          </nav>
          <p yetiHide="sm">Narrower than sm: two links.</p>
          <p yetiShow="sm" yetiHide="md">At least sm wide: four links.</p>
          <p yetiShow="md" yetiHide="lg">At least md wide: six links.</p>
          <p yetiShow="lg">At least lg wide: every link.</p>
        </div>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const stage = byTestId(canvasElement, 'stage');
    const container = byTestId(canvasElement, 'container');
    const nav = byTestId(canvasElement, 'nav');
    const links = [...nav.querySelectorAll('a')];
    const paragraphs = [...container.querySelectorAll(':scope > p')];

    await expect(container).toHaveClass('container');
    await expect(container).toHaveAttribute('data-ngx-yeti-item-container', '');
    await expect(container).not.toHaveAttribute('tabindex');
    await expect(container).not.toHaveAttribute('role');
    await expect(links).toHaveLength(7);

    await itemStyled('container', container, 'container-type', 'inline-size');
    await itemStyled('box', container, 'padding-top', padded);

    const cases = [
      { width: tokenWidth(canvasElement, 'sm') - 1, count: 2, shown: 0 },
      { width: tokenWidth(canvasElement, 'sm'), count: 4, shown: 1 },
      { width: tokenWidth(canvasElement, 'md'), count: 6, shown: 2 },
      { width: tokenWidth(canvasElement, 'lg'), count: 7, shown: 3 },
    ];

    try {
      for (const { width, count, shown } of cases) {
        await fitContent(stage, container, width);

        await waitFor(async () => {
          await expect(within(nav).queryAllByRole('link')).toHaveLength(count);
        });

        for (const link of links.slice(count)) {
          await expect(displayed(link)).toBe(false);
        }

        await expect(
          paragraphs.map((paragraph) => displayed(paragraph)),
        ).toStrictEqual(paragraphs.map((_, index) => index === shown));
      }

      const md = cases[2];

      if (md === undefined) {
        throw new Error('No md case');
      }

      await fitContent(stage, container, md.width);

      const focused: (Element | null)[] = [];

      for (let step = 0; step < md.count + 1; step += 1) {
        await userEvent.tab();
        focused.push(document.activeElement);
      }

      await expect(focused.slice(0, md.count)).toStrictEqual(
        links.slice(0, md.count),
      );
      await expect(links.slice(md.count)).not.toContain(focused.at(-1));
    } finally {
      stage.style.inlineSize = '';
    }
  },
};

/**
 * Yeti's docs pair, one `yetiShow="md"` and one `yetiHide="md"` paragraph,
 * in a narrow sidebar and in a full-width section: the same markup makes
 * two decisions on one page.
 */
export const ShowHide: Story = {
  render: () => ({
    template: `
      <aside data-testid="sidebar" yetiContainer style="inline-size: 12rem">
        <p data-testid="sidebar-wide" yetiShow="md">Shown once this column is 32rem or wider.</p>
        <p data-testid="sidebar-narrow" yetiHide="md">Gone once this column is 32rem or wider.</p>
      </aside>
      <section data-testid="section" yetiContainer>
        <p data-testid="wide" yetiShow="md">Shown once this column is 32rem or wider.</p>
        <p data-testid="narrow" yetiHide="md">Gone once this column is 32rem or wider.</p>
      </section>`,
  }),
  play: async ({ canvasElement }) => {
    const section = byTestId(canvasElement, 'section');
    const wide = byTestId(canvasElement, 'wide');
    const narrow = byTestId(canvasElement, 'narrow');

    await expect(wide).toHaveAttribute('data-show', 'md');
    await expect(narrow).toHaveAttribute('data-hide', 'md');

    await itemStyled('container', section, 'container-type', 'inline-size');

    await expect(displayed(byTestId(canvasElement, 'sidebar-wide'))).toBe(
      false,
    );
    await expect(displayed(byTestId(canvasElement, 'sidebar-narrow'))).toBe(
      true,
    );

    const md = tokenWidth(canvasElement, 'md');

    try {
      await fitContent(section, section, md);
      await expect([displayed(wide), displayed(narrow)]).toStrictEqual([
        true,
        false,
      ]);

      await fitContent(section, section, md - 1);
      await expect([displayed(wide), displayed(narrow)]).toStrictEqual([
        false,
        true,
      ]);
    } finally {
      section.style.inlineSize = '';
    }
  },
};

/**
 * Yeti's table example from its visibility guide: a column marked with
 * `yetiShow="sm"` on its header and every body cell, in a container.
 */
export const TableColumn: Story = {
  render: () => ({
    template: `
      <div data-testid="container" yetiContainer>
        <table yetiTable>
          <caption>Summits</caption>
          <thead>
            <tr><th scope="col">Peak</th><th scope="col" yetiNumeric>Height (m)</th><th scope="col" yetiShow="sm">Range</th></tr>
          </thead>
          <tbody>
            <tr><td>Ben Nevis</td><td yetiNumeric>1,345</td><td yetiShow="sm">Grampians</td></tr>
            <tr><td>Snowdon</td><td yetiNumeric>1,085</td><td yetiShow="sm">Snowdonia</td></tr>
            <tr><td>Scafell Pike</td><td yetiNumeric>978</td><td yetiShow="sm">Southern Fells</td></tr>
          </tbody>
        </table>
      </div>`,
  }),
  play: async ({ canvas, canvasElement }) => {
    const container = byTestId(canvasElement, 'container');
    const table = canvas.getByRole('table', { name: 'Summits' });
    const marked = [...table.querySelectorAll('[yetishow]')];
    const kept = [
      ...table.querySelectorAll(
        'caption, th:not([yetishow]), td:not([yetishow])',
      ),
    ];

    await expect(marked).toHaveLength(4);

    for (const cell of marked) {
      await expect(cell).toHaveAttribute('data-show', 'sm');
    }

    await itemStyled('container', container, 'container-type', 'inline-size');
    await itemStyled(
      'table',
      table.querySelector('td') ?? table,
      'vertical-align',
      'top',
    );

    const sm = tokenWidth(canvasElement, 'sm');

    try {
      await fitContent(container, container, sm);
      await expect(marked.map(displayed)).toStrictEqual(marked.map(() => true));

      await fitContent(container, container, sm - 1);
      await expect(marked.map(displayed)).toStrictEqual(
        marked.map(() => false),
      );
      await expect(kept.map(displayed)).toStrictEqual(kept.map(() => true));
      await expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
    } finally {
      container.style.inlineSize = '';
    }
  },
};

/** The `width` values of the `data-show` marker, from the manifest. */
const widths: readonly string[] =
  manifest.components.container.markers.find(({ name }) => name === 'data-show')
    ?.values ?? [];

function isWidth(value: string): value is YetiWidth {
  return widths.includes(value);
}

/**
 * One element per width with `yetiShow` and one per width with `yetiHide`,
 * in a container the play function takes through every stop, so each of
 * the 14 rules is reached.
 */
export const AllWidths: Story = {
  render: () => ({
    props: { widths: widths.filter(isWidth) },
    template: `
      <div data-testid="container" yetiContainer>
        @for (width of widths; track width) {
          <p [attr.data-testid]="'show-' + width" [yetiShow]="width">Shown from {{ width }}</p>
          <p [attr.data-testid]="'hide-' + width" [yetiHide]="width">Gone from {{ width }}</p>
        }
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const container = byTestId(canvasElement, 'container');
    const stops = widths.filter(isWidth);

    await expect(stops).toHaveLength(7);
    await expect(elementChildren(container)).toHaveLength(14);

    await itemStyled('container', container, 'container-type', 'inline-size');

    const thresholds = stops.map((width) => ({
      width,
      px: tokenWidth(canvasElement, width),
    }));

    try {
      for (const { px: size } of thresholds) {
        for (const width of [size - 1, size]) {
          await fitContent(container, container, width);

          for (const threshold of thresholds) {
            const wideEnough = width >= threshold.px;

            await expect(
              displayed(byTestId(canvasElement, `show-${threshold.width}`)),
            ).toBe(wideEnough);
            await expect(
              displayed(byTestId(canvasElement, `hide-${threshold.width}`)),
            ).toBe(!wideEnough);
          }
        }
      }
    } finally {
      container.style.inlineSize = '';
    }
  },
};

/**
 * `[yetiShow]` bound from a story arg: `data-show` follows it, and nothing
 * else on the host changes.
 */
export const Bound: StoryObj<YetiShow> = {
  args: { yetiShow: 'md' },
  argTypes: {
    yetiShow: { control: 'select', options: widths },
  },
  render: (args, { id }) => ({
    // Named unlike the input, which it would collide with.
    props: { threshold: showStates.track(id, signal(args.yetiShow)) },
    template: `
      <div yetiContainer>
        <p data-testid="marked" class="note" [yetiShow]="threshold()">Shown from a bound width.</p>
      </div>`,
  }),
  play: async ({ canvasElement, id }) => {
    const threshold = showStates.get(id);
    const marked = byTestId(canvasElement, 'marked');
    const before = marked
      .getAttributeNames()
      .filter((name) => name !== 'data-show')
      .map((name) => `${name}=${String(marked.getAttribute(name))}`);

    await expect(marked).toHaveAttribute('data-show', 'md');

    for (const width of ['2xs', 'xl', 'md'] as const) {
      threshold.set(width);
      await waitFor(async () => {
        await expect(marked).toHaveAttribute('data-show', width);
      });
      await expect(
        marked
          .getAttributeNames()
          .filter((name) => name !== 'data-show')
          .map((name) => `${name}=${String(marked.getAttribute(name))}`),
      ).toStrictEqual(before);
    }
  },
};

/**
 * The `nav` spec's case, where a plain `nav` stands in for `yetiNav`:
 * `yetiShow` renders on links inside it with no `yetiContainer`. A plain
 * `nav` is not a size container, so whether the marker follows the nav's
 * width is not asserted here.
 */
export const InNav: Story = {
  render: () => ({
    template: `
      <nav data-testid="nav" aria-label="Site">
        <a href="/">Home</a>
        <a data-testid="changelog" href="/changelog" yetiShow="md">Changelog</a>
        <a data-testid="contact" href="/contact" yetiShow="lg">Contact</a>
      </nav>`,
  }),
  play: async ({ canvasElement }) => {
    const nav = byTestId(canvasElement, 'nav');

    await expect(byTestId(canvasElement, 'changelog')).toHaveAttribute(
      'data-show',
      'md',
    );
    await expect(byTestId(canvasElement, 'contact')).toHaveAttribute(
      'data-show',
      'lg',
    );

    for (const element of [nav, ...nav.querySelectorAll('a')]) {
      await expect(element).not.toHaveAttribute('class');
      await expect(
        element
          .getAttributeNames()
          .filter((name) => name.startsWith('data-ngx-yeti-')),
      ).toStrictEqual([]);
    }
  },
};

/**
 * `yetiShow="md"` on a `yetiCluster`: Yeti's utilities layer outranks the
 * cluster's own `display`.
 */
export const OnItem: Story = {
  render: () => ({
    template: `
      <div data-testid="container" yetiContainer>
        <nav data-testid="cluster" yetiCluster yetiShow="md" aria-label="More">
          <a href="/changelog">Changelog</a>
          <a href="/community">Community</a>
        </nav>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const container = byTestId(canvasElement, 'container');
    const cluster = byTestId(canvasElement, 'cluster');
    const md = tokenWidth(canvasElement, 'md');

    await itemStyled('container', container, 'container-type', 'inline-size');

    try {
      await fitContent(container, container, md);
      await itemStyled('cluster', cluster, 'display', 'flex');

      await fitContent(container, container, md - 1);
      await expect(getComputedStyle(cluster).display).toBe('none');

      await fitContent(container, container, md);
      await expect(getComputedStyle(cluster).display).toBe('flex');
    } finally {
      container.style.inlineSize = '';
    }
  },
};

/**
 * `yetiShow="md"` on a narrow `yetiContainer` inside an outer one: the
 * marker follows the outer box's width, never its own (usage rule 2).
 */
export const Self: Story = {
  render: () => ({
    template: `
      <div data-testid="outer" yetiContainer>
        <div data-testid="inner" yetiContainer yetiShow="md" style="inline-size: 10rem">
          <p>A narrow box shown from md.</p>
        </div>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const outer = byTestId(canvasElement, 'outer');
    const inner = byTestId(canvasElement, 'inner');
    const md = tokenWidth(canvasElement, 'md');

    await itemStyled('container', inner, 'container-type', 'inline-size');

    try {
      await fitContent(outer, outer, md);
      await expect(displayed(inner)).toBe(true);
      await expect(inner.getBoundingClientRect().width).toBeLessThan(md);

      await fitContent(outer, outer, md - 1);
      await expect(displayed(inner)).toBe(false);
    } finally {
      outer.style.inlineSize = '';
    }
  },
};

/**
 * Usage rule 6, after Yeti's docs: an application class on the host, with
 * `container-name` and a `@container` rule naming it in the consumer's
 * stylesheet.
 */
export const Named: Story = {
  render: () => ({
    styles: [
      '.story-slot { container-name: slot; }',
      '@container slot (inline-size < 30rem) { .story-stack-on-narrow { flex-direction: column; } }',
    ],
    template: `
      <div data-testid="slot" yetiContainer class="story-slot">
        <div data-testid="row" yetiCluster class="story-stack-on-narrow">
          <span>Filters</span>
          <span>Sort</span>
        </div>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const slot = byTestId(canvasElement, 'slot');
    const row = byTestId(canvasElement, 'row');
    const named = usedLength(canvasElement, '30rem');

    await expect(slot).toHaveClass('container');
    await expect(slot).toHaveClass('story-slot');
    await expect(getComputedStyle(slot).containerName).toBe('slot');

    await itemStyled('container', slot, 'container-type', 'inline-size');
    await itemStyled('cluster', row, 'display', 'flex');

    try {
      await fitContent(slot, slot, named);
      await expect(getComputedStyle(row).flexDirection).toBe('row');

      await fitContent(slot, slot, named - 1);
      await expect(getComputedStyle(row).flexDirection).toBe('column');
    } finally {
      slot.style.inlineSize = '';
    }
  },
};

/**
 * An anti-pattern story: `yetiShow="md"` with no size container above it is
 * displayed at every width, the failure mode of usage rule 1.
 */
export const OutsideAContainer: Story = {
  render: () => ({
    template: `
      <div data-testid="stage">
        <p data-testid="orphan" yetiShow="md">Shown at every width, because nothing above is a size container.</p>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const stage = byTestId(canvasElement, 'stage');
    const orphan = byTestId(canvasElement, 'orphan');
    const md = tokenWidth(canvasElement, 'md');

    await expect(orphan).toHaveAttribute('data-show', 'md');

    try {
      for (const width of [md / 2, md - 1, md, md * 2]) {
        await fitContent(stage, stage, width);
        await expect(displayed(orphan)).toBe(true);
      }
    } finally {
      stage.style.inlineSize = '';
    }
  },
};
