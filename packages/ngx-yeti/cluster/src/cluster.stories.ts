import { itemStylesLoaded } from '@ngx-yeti/testing';
import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { YetiStack } from 'ngx-yeti/stack';
import { expect, waitFor, within } from 'storybook/test';
import { YetiCluster } from './cluster';

function byTestId(root: Element, id: string): HTMLElement {
  const element = root.querySelector(`[data-testid="${id}"]`);

  if (!(element instanceof HTMLElement)) {
    throw new Error(`No element ${id}`);
  }

  return element;
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

/** The last child, which the story's markup is known to hold. */
function lastChild(parent: HTMLElement): HTMLElement {
  return childAt(parent, children(parent).length - 1);
}

/**
 * The used length of a public token in `scope`, read from a probe, so an
 * assertion holds for any token value.
 */
function tokenLength(scope: HTMLElement, token: string): number {
  const probe = document.createElement('div');
  probe.style.blockSize = `var(${token})`;
  scope.append(probe);
  const { height } = probe.getBoundingClientRect();
  probe.remove();

  return height;
}

/**
 * Waits for the cluster's item file to apply. Chromium and WebKit can keep
 * stale computed styles right after a stylesheet is inserted (upstream bug
 * O2).
 */
async function clusterStyled(cluster: HTMLElement): Promise<void> {
  await itemStylesLoaded('cluster');

  await waitFor(async () => {
    await expect(getComputedStyle(cluster).display).toBe('flex');
  });
}

/** Sets the width of the element the story resizes. */
function resize(stage: HTMLElement, width: string): void {
  stage.style.inlineSize = width;
}

async function expectClose(actual: number, expected: number): Promise<void> {
  await expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
}

function rows(cluster: HTMLElement): number {
  return new Set(
    children(cluster).map((item) =>
      Math.round(item.getBoundingClientRect().top),
    ),
  ).size;
}

/** The space between the right edge of one item and the left edge of the next. */
function inlineGapAfter(item: HTMLElement): number {
  const next = item.nextElementSibling;

  if (next === null) {
    throw new Error('The item is the last');
  }

  return next.getBoundingClientRect().left - item.getBoundingClientRect().right;
}

const siteLinks = [
  'Home',
  'Docs',
  'Guides',
  'Blog',
  'Changelog',
  'Community',
  'Pricing',
  'Contact',
];

const meta: Meta<YetiCluster> = {
  id: 'cluster',
  component: YetiCluster,
  decorators: [
    moduleMetadata({ imports: [YetiCluster, YetiBox, YetiBorder, YetiStack] }),
  ],
};
export default meta;

type Story = StoryObj<YetiCluster>;

/**
 * Yeti's example: a `nav` of eight raised boxes (cluster spec, section 8),
 * in a stage the play function resizes.
 */
export const Default: Story = {
  render: () => ({
    props: { siteLinks },
    template: `
      <div data-testid="stage">
        <nav data-testid="cluster" yetiCluster gap="sm" aria-label="Site">
          @for (link of siteLinks; track link) {
            <a yetiBox surface="raised" yetiBorder href="#{{ link }}">{{ link }}</a>
          }
        </nav>
      </div>`,
  }),
  play: async ({ canvas, canvasElement }) => {
    const stage = byTestId(canvasElement, 'stage');
    const cluster = byTestId(canvasElement, 'cluster');
    const items = children(cluster);

    await expect(cluster).toHaveAttribute('class', 'cluster');
    await expect(cluster).toHaveAttribute('data-gap', 'sm');
    await expect(cluster).toHaveAttribute('data-ngx-yeti-item-cluster', '');
    await expect(cluster).not.toHaveAttribute('data-align');
    await expect(cluster).not.toHaveAttribute('data-justify');
    await expect(cluster).not.toHaveAttribute('data-threshold');
    await expect(cluster).not.toHaveAttribute('tabindex');
    await expect(canvas.getByRole('navigation', { name: 'Site' })).toBe(
      cluster,
    );
    await expect(items).toHaveLength(siteLinks.length);

    await clusterStyled(cluster);
    await itemStylesLoaded('box');

    await expect(getComputedStyle(cluster).containerType).toBe('normal');

    const sm = tokenLength(canvasElement, '--yeti-space-sm');

    try {
      resize(stage, '90rem');
      await waitFor(async () => {
        await expect(rows(cluster)).toBe(1);
      });
      await expectClose(inlineGapAfter(childAt(cluster, 0)), sm);

      resize(stage, '12rem');
      await waitFor(async () => {
        await expect(rows(cluster)).toBeGreaterThan(1);
      });

      const first = childAt(cluster, 0);
      const top = first.getBoundingClientRect().top;
      const nextRow = items.find(
        (item) => item.getBoundingClientRect().top > top + 1,
      );

      if (nextRow === undefined) {
        throw new Error('The cluster did not wrap');
      }

      await expectClose(
        nextRow.getBoundingClientRect().top -
          first.getBoundingClientRect().bottom,
        sm,
      );

      const tops = items.map((item) => item.getBoundingClientRect().top);

      // Wrapping keeps source order: no item sits above the one before it.
      await expect(tops).toStrictEqual(tops.toSorted((a, b) => a - b));
    } finally {
      resize(stage, '');
    }
  },
};

/** Yeti's docs list of tags. */
export const Tags: Story = {
  render: () => ({
    template: `
      <ul data-testid="cluster" yetiCluster gap="xs" role="list">
        <li>css</li>
        <li>layout</li>
        <li>intrinsic</li>
      </ul>`,
  }),
  play: async ({ canvas, canvasElement }) => {
    const cluster = byTestId(canvasElement, 'cluster');

    await expect(canvas.getByRole('list')).toBe(cluster);
    await expect(within(cluster).getAllByRole('listitem')).toHaveLength(3);
    await expect(cluster).toHaveAttribute('data-gap', 'xs');

    await clusterStyled(cluster);

    const xs = tokenLength(canvasElement, '--yeti-space-xs');

    await expectClose(inlineGapAfter(childAt(cluster, 0)), xs);
    await expectClose(inlineGapAfter(childAt(cluster, 1)), xs);
  },
};

const justifications = [
  'start',
  'center',
  'end',
  'between',
  'around',
  'evenly',
] as const;

/**
 * One cluster per `justify` value in a fixed-width frame, and `start` inside
 * `dir="rtl"`.
 */
export const Justify: Story = {
  render: () => ({
    props: { justifications },
    template: `
      <div style="inline-size: 30rem">
        @for (value of justifications; track value) {
          <div [attr.data-testid]="value" yetiCluster [justify]="value">
            <span>One</span>
            <span>Two</span>
            <span>Three</span>
          </div>
        }
        <div dir="rtl">
          <div data-testid="rtl" yetiCluster justify="start">
            <span>One</span>
            <span>Two</span>
            <span>Three</span>
          </div>
        </div>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    for (const value of justifications) {
      await expect(byTestId(canvasElement, value)).toHaveAttribute(
        'data-justify',
        value,
      );
    }

    const between = byTestId(canvasElement, 'between');
    const end = byTestId(canvasElement, 'end');
    const rtl = byTestId(canvasElement, 'rtl');

    await clusterStyled(between);

    await expectClose(
      childAt(between, 0).getBoundingClientRect().left,
      between.getBoundingClientRect().left,
    );
    await expectClose(
      lastChild(between).getBoundingClientRect().right,
      between.getBoundingClientRect().right,
    );
    await expectClose(
      lastChild(end).getBoundingClientRect().right,
      end.getBoundingClientRect().right,
    );
    await expect(
      childAt(end, 0).getBoundingClientRect().left -
        end.getBoundingClientRect().left,
    ).toBeGreaterThan(1);
    await expectClose(
      childAt(rtl, 0).getBoundingClientRect().right,
      rtl.getBoundingClientRect().right,
    );
  },
};

/**
 * Items of different heights, `align` written in its static form. The host
 * keeps no HTML `align` attribute.
 */
export const Align: Story = {
  render: () => ({
    template: `
      <div data-testid="start" yetiCluster align="start">
        <span>Short</span>
        <span style="padding-block: 1rem">Tall</span>
      </div>
      <div data-testid="center" yetiCluster align="center">
        <span>Short</span>
        <span style="padding-block: 1rem">Tall</span>
      </div>
      <div data-testid="end" yetiCluster align="end">
        <span>Short</span>
        <span style="padding-block: 1rem">Tall</span>
      </div>
      <div data-testid="stretch" yetiCluster align="stretch">
        <span>Short</span>
        <span style="padding-block: 1rem">Tall</span>
      </div>
      <div data-testid="baseline" yetiCluster align="baseline">
        <span>Short</span>
        <span style="font-size: 2rem">Tall</span>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const values = ['start', 'center', 'end', 'stretch', 'baseline'];

    for (const value of values) {
      const cluster = byTestId(canvasElement, value);

      await expect(cluster).toHaveAttribute('data-align', value);
      await expect(cluster).not.toHaveAttribute('align');
    }

    const start = byTestId(canvasElement, 'start');
    const end = byTestId(canvasElement, 'end');

    await clusterStyled(start);

    await expectClose(
      childAt(start, 0).getBoundingClientRect().top,
      childAt(start, 1).getBoundingClientRect().top,
    );
    await expect(childAt(start, 0).getBoundingClientRect().height).toBeLessThan(
      childAt(start, 1).getBoundingClientRect().height,
    );
    await expectClose(
      childAt(end, 0).getBoundingClientRect().bottom,
      childAt(end, 1).getBoundingClientRect().bottom,
    );
    await expect(getComputedStyle(start).textAlign).toBe('start');
  },
};

/**
 * Yeti's legend: a `dl` stack whose rows are clusters with
 * `justify="between"`.
 */
export const Legend: Story = {
  render: () => ({
    template: `
      <dl data-testid="legend" yetiStack gap="xs" style="inline-size: 20rem">
        <div yetiCluster justify="between"><dt>Distance</dt><dd>14.2 km</dd></div>
        <div yetiCluster justify="between"><dt>Ascent</dt><dd>1,120 m</dd></div>
        <div yetiCluster justify="between"><dt>Time</dt><dd>5 h 30</dd></div>
      </dl>`,
  }),
  play: async ({ canvasElement }) => {
    const legend = byTestId(canvasElement, 'legend');
    const legendRows = children(legend);

    await expect(within(legend).getAllByRole('term')).toHaveLength(3);
    await expect(within(legend).getAllByRole('definition')).toHaveLength(3);

    for (const row of legendRows) {
      await expect(row).toHaveAttribute('data-justify', 'between');
    }

    await clusterStyled(childAt(legend, 0));

    for (const row of legendRows) {
      const box = row.getBoundingClientRect();

      await expectClose(childAt(row, 0).getBoundingClientRect().left, box.left);
      await expectClose(
        childAt(row, 1).getBoundingClientRect().right,
        box.right,
      );
    }
  },
};

/**
 * Three buttons in a cluster with `threshold="sm"`, in a stage the play
 * function resizes far below and far above every threshold Yeti has.
 */
export const Threshold: Story = {
  render: () => ({
    template: `
      <div data-testid="stage">
        <div data-testid="cluster" yetiCluster threshold="sm" gap="xs">
          <button type="button">Save</button>
          <button type="button">Preview</button>
          <button type="button">Discard</button>
        </div>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const stage = byTestId(canvasElement, 'stage');
    const cluster = byTestId(canvasElement, 'cluster');
    const items = children(cluster);

    await expect(cluster).toHaveAttribute('data-threshold', 'sm');

    await clusterStyled(cluster);

    await expect(getComputedStyle(cluster).containerType).toBe('inline-size');

    try {
      resize(stage, '10rem');
      await waitFor(async () => {
        await expect(rows(cluster)).toBe(items.length);
      });

      for (const item of items) {
        await expectClose(
          item.getBoundingClientRect().width,
          cluster.getBoundingClientRect().width,
        );
      }

      const tops = items.map((item) => item.getBoundingClientRect().top);

      await expect(tops).toStrictEqual(tops.toSorted((a, b) => a - b));

      resize(stage, '90rem');
      await waitFor(async () => {
        await expect(rows(cluster)).toBe(1);
      });
    } finally {
      resize(stage, '');
    }
  },
};

/**
 * A thresholded cluster as an item of another cluster, given `flex-grow`
 * (usage rule 3), so it does not collapse.
 */
export const ThresholdInRow: Story = {
  render: () => ({
    template: `
      <div data-testid="row" yetiCluster>
        <span>Filters</span>
        <div data-testid="inner" yetiCluster threshold="sm" gap="xs" style="flex-grow: 1">
          <button type="button">Open</button>
          <button type="button">Closed</button>
          <button type="button">All</button>
        </div>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const inner = byTestId(canvasElement, 'inner');

    await clusterStyled(inner);

    await expect(inner.getBoundingClientRect().width).toBeGreaterThan(0);

    for (const item of children(inner)) {
      const { width, height } = item.getBoundingClientRect();

      await expect(width).toBeGreaterThan(0);
      await expect(height).toBeGreaterThan(0);
      await expect(item).toBeVisible();
    }
  },
};
