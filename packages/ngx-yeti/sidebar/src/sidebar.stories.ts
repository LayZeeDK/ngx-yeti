import { signal, type WritableSignal } from '@angular/core';
import { itemStylesLoaded } from '@ngx-yeti/testing';
import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import type { YetiAlign, YetiGap, YetiSide, YetiWidth } from 'ngx-yeti';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { YetiCenter } from 'ngx-yeti/center';
import { expect, userEvent, waitFor } from 'storybook/test';
import manifest from 'yeti-css/manifest';
import { YetiSidebar } from './sidebar';
import { YetiSidebarChild } from './sidebar-child';

/** The values of one of the sidebar's enum attributes, from Yeti's manifest. */
function sidebarValues(name: string): readonly string[] {
  return (
    manifest.components.sidebar.attributes.find(
      (attribute) => attribute.name === name,
    )?.values ?? []
  );
}

interface SidebarState {
  readonly side: YetiSide | undefined;
  readonly width: YetiWidth | undefined;
  readonly gap: YetiGap | undefined;
  readonly align: YetiAlign | undefined;
  readonly sticky: boolean;
}

const unset: SidebarState = {
  side: undefined,
  width: undefined,
  gap: undefined,
  align: undefined,
  sticky: false,
};

/**
 * The inputs a story binds, by story id, so its play function can change
 * them the way a Storybook control does.
 */
const sidebarStates = new Map<string, WritableSignal<SidebarState>>();

function trackedState(
  id: string,
  initial: SidebarState,
): WritableSignal<SidebarState> {
  const state = signal(initial);
  sidebarStates.set(id, state);

  return state;
}

function sidebarState(id: string): WritableSignal<SidebarState> {
  const state = sidebarStates.get(id);

  if (state === undefined) {
    throw new Error(`No sidebar state for the story ${id}`);
  }

  return state;
}

function children(parent: HTMLElement): HTMLElement[] {
  return [...parent.children].filter((child) => child instanceof HTMLElement);
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

/** The used block size of a CSS length in `root`, read from a probe. */
function blockLength(root: HTMLElement, length: string): number {
  const probe = document.createElement('div');
  probe.style.blockSize = length;
  root.append(probe);
  const { height } = probe.getBoundingClientRect();
  probe.remove();

  return height;
}

/**
 * The container width at which the pair switches: twice the sidebar's width
 * plus the gap (sidebar.md, Testing Decisions).
 */
function switchWidth(frame: HTMLElement, width: string, gap: string): number {
  return inlineLength(
    frame,
    `calc(2 * (var(--yeti-width-${width}) + var(--yeti-space-${gap})))`,
  );
}

/** Sizes the container a margin of 2rem wider or narrower than `width`. */
function sizeAround(
  frame: HTMLElement,
  width: number,
  side: 'wider' | 'narrower',
): void {
  const margin = inlineLength(frame, '2rem');
  frame.style.inlineSize = `${String(side === 'wider' ? width + margin : width - margin)}px`;
}

/**
 * Waits for the sidebar's item file to apply. Chromium and WebKit can keep
 * stale computed styles right after a stylesheet is inserted (upstream bug
 * O2).
 */
async function sidebarStyled(sidebar: HTMLElement): Promise<void> {
  await itemStylesLoaded('sidebar');

  await waitFor(async () => {
    await expect(getComputedStyle(sidebar).flexWrap).toBe('wrap');
  });
}

async function expectClose(
  actual: number,
  expected: number,
  tolerance = 1,
): Promise<void> {
  await expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

/** Both children on one row: equal tops. */
async function expectSideBySide(
  first: HTMLElement,
  second: HTMLElement,
): Promise<void> {
  await expectClose(
    first.getBoundingClientRect().top,
    second.getBoundingClientRect().top,
  );
}

/**
 * Stacked: the second child's top at or below the first child's bottom, and
 * both as wide as the sidebar.
 */
async function expectStacked(sidebar: HTMLElement): Promise<void> {
  const [first, second] = children(sidebar);

  if (first === undefined || second === undefined) {
    throw new Error('The sidebar has two children');
  }

  const width = sidebar.getBoundingClientRect().width;

  await expect(second.getBoundingClientRect().top).toBeGreaterThanOrEqual(
    first.getBoundingClientRect().bottom - 0.5,
  );
  await expectClose(first.getBoundingClientRect().width, width);
  await expectClose(second.getBoundingClientRect().width, width);
}

/** Section 8's markup, without `sticky`, in a container that can be resized. */
function defaultSidebar(dir: 'ltr' | 'rtl'): string {
  return `
    <div data-testid="frame" dir="${dir}" style="resize: horizontal; overflow: auto">
      <div data-testid="sidebar" yetiSidebar width="xs" gap="lg">
        <nav data-testid="nav" yetiBox yetiBorder surface="raised" aria-label="Section">
          <a href="#overview">Overview</a>
        </nav>
        <article data-testid="article" yetiBox yetiBorder surface="raised">
          <h2>Content</h2>
          <p>Takes the remaining width, and the whole width once the two no longer fit. <a href="#details">Details</a></p>
        </article>
      </div>
    </div>`;
}

const meta: Meta<YetiSidebar> = {
  id: 'sidebar',
  component: YetiSidebar,
  decorators: [
    moduleMetadata({
      imports: [YetiSidebar, YetiSidebarChild, YetiBox, YetiBorder, YetiCenter],
    }),
  ],
};
export default meta;

type Story = StoryObj<YetiSidebar>;

/** Yeti's example, section 8's markup without `sticky`. */
export const Default: Story = {
  render: () => ({ template: defaultSidebar('ltr') }),
  play: async ({ canvas }) => {
    const frame = canvas.getByTestId('frame');
    const sidebar = canvas.getByTestId('sidebar');
    const nav = canvas.getByTestId('nav');
    const article = canvas.getByTestId('article');

    await expect(sidebar).toHaveAttribute('class', 'sidebar');
    await expect(sidebar).toHaveAttribute('data-width', 'xs');
    await expect(sidebar).toHaveAttribute('data-gap', 'lg');
    await expect(sidebar).toHaveAttribute('data-ngx-yeti-item-sidebar', '');
    await expect(sidebar).not.toHaveAttribute('data-side');
    await expect(sidebar).not.toHaveAttribute('data-align');
    await expect(
      [sidebar, ...sidebar.querySelectorAll('*')].filter((element) =>
        element.matches('[role], [tabindex]'),
      ),
    ).toStrictEqual([]);

    await sidebarStyled(sidebar);
    await itemStylesLoaded('box');

    for (const child of children(sidebar)) {
      const { marginTop, marginRight, marginBottom, marginLeft } =
        getComputedStyle(child);

      await expect([
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
      ]).toStrictEqual(['0px', '0px', '0px', '0px']);
    }

    const stop = switchWidth(frame, 'xs', 'lg');

    sizeAround(frame, stop, 'wider');
    await expectSideBySide(nav, article);
    // Yeti's own tolerance: `flex-grow: 1` against 999 leaves a fraction
    // over the basis.
    await expectClose(
      nav.getBoundingClientRect().width,
      inlineLength(frame, 'var(--yeti-width-xs)'),
      2,
    );
    await expectClose(
      article.getBoundingClientRect().left - nav.getBoundingClientRect().right,
      inlineLength(frame, 'var(--yeti-space-lg)'),
    );

    sizeAround(frame, stop, 'narrower');
    await expectStacked(sidebar);
  },
};

/** `side="end"` with the content first in the source (Yeti's docs example). */
export const End: Story = {
  render: () => ({
    template: `
      <div data-testid="frame">
        <div data-testid="sidebar" yetiSidebar side="end" width="xs" gap="lg">
          <article data-testid="article" yetiBox yetiBorder surface="raised">
            <h2>Content</h2>
            <p>First in the source, because it matters more. <a href="#details">Details</a></p>
          </article>
          <nav data-testid="nav" yetiBox yetiBorder surface="raised" aria-label="Section">
            <a href="#overview">Overview</a>
          </nav>
        </div>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const frame = canvas.getByTestId('frame');
    const sidebar = canvas.getByTestId('sidebar');
    const article = canvas.getByTestId('article');
    const nav = canvas.getByTestId('nav');

    await expect(sidebar).toHaveAttribute('data-side', 'end');

    await sidebarStyled(sidebar);
    await itemStylesLoaded('box');

    sizeAround(frame, switchWidth(frame, 'xs', 'lg'), 'wider');
    await expectSideBySide(article, nav);
    await expectClose(
      nav.getBoundingClientRect().width,
      inlineLength(frame, 'var(--yeti-width-xs)'),
      2,
    );
    await expect(nav.getBoundingClientRect().left).toBeGreaterThan(
      article.getBoundingClientRect().right,
    );

    // Reading order is source order: nothing reorders the children on
    // screen or in the accessibility tree.
    await expect(children(sidebar)).toStrictEqual([article, nav]);
    await expect(getComputedStyle(sidebar).flexDirection).toBe('row');
    await expect(
      children(sidebar).map((child) => getComputedStyle(child).order),
    ).toStrictEqual(['0', '0']);
    await expect(
      sidebar.querySelectorAll('[aria-owns], [aria-flowto]'),
    ).toHaveLength(0);
  },
};

/** Every input of `yetiSidebar`, set and reset as a Storybook control would. */
export const Inputs: Story = {
  argTypes: {
    // Yeti's vocabularies, which the contract spec proves equal to the
    // inputs' types, so a pin move that adds a value adds its option.
    side: { control: 'select', options: sidebarValues('data-side') },
    width: { control: 'select', options: sidebarValues('data-width') },
    gap: { control: 'select', options: sidebarValues('data-gap') },
    align: { control: 'select', options: sidebarValues('data-align') },
  },
  render: (args, { id }) => {
    const state = trackedState(id, {
      ...unset,
      side: args.side,
      width: args.width,
      gap: args.gap,
      align: args.align,
    });

    // Template props are named unlike the inputs, which they would collide
    // with once `component` is set.
    return {
      props: { state },
      template: `
        <div data-testid="frame">
          <div data-testid="sidebar" yetiSidebar [side]="state().side" [width]="state().width" [gap]="state().gap" [align]="state().align">
            <div data-testid="side"><p>A short sidebar.</p></div>
            <div data-testid="content">
              <p>Content that is taller than the sidebar.</p>
              <p>A second paragraph.</p>
              <p>A third paragraph.</p>
            </div>
          </div>
        </div>
        <div data-testid="static" yetiSidebar align="center">
          <div><p>A sidebar written with a static align.</p></div>
          <div><p>Its text stays start-aligned.</p></div>
        </div>`,
    };
  },
  play: async ({ canvas, id }) => {
    const state = sidebarState(id);
    const frame = canvas.getByTestId('frame');
    const sidebar = canvas.getByTestId('sidebar');
    const side = canvas.getByTestId('side');
    const content = canvas.getByTestId('content');
    const cases: readonly {
      readonly attribute: string;
      readonly set: Partial<SidebarState>;
      readonly value: string;
    }[] = [
      { attribute: 'data-side', set: { side: 'end' }, value: 'end' },
      { attribute: 'data-width', set: { width: '2xs' }, value: '2xs' },
      { attribute: 'data-gap', set: { gap: 'sm-lg' }, value: 'sm-lg' },
      { attribute: 'data-align', set: { align: 'end' }, value: 'end' },
    ];

    for (const { attribute, set, value } of cases) {
      state.set({ ...unset, ...set });
      await waitFor(async () => {
        await expect(sidebar).toHaveAttribute(attribute, value);
      });

      state.set(unset);
      await waitFor(async () => {
        await expect(sidebar).not.toHaveAttribute(attribute);
      });
    }

    await sidebarStyled(sidebar);

    state.set({ ...unset, width: 'xs', gap: 'lg', align: 'start' });
    await waitFor(async () => {
      await expect(sidebar).toHaveAttribute('data-align', 'start');
    });
    sizeAround(frame, switchWidth(frame, 'xs', 'lg'), 'wider');
    await expectSideBySide(side, content);
    // The sidebar child keeps its own height instead of the row's.
    await expect(side.getBoundingClientRect().height).toBeLessThan(
      content.getBoundingClientRect().height - 1,
    );

    const aligned = canvas.getByTestId('static');

    await expect(aligned).toHaveAttribute('data-align', 'center');
    await expect(aligned).not.toHaveAttribute('align');
    await expect(sidebar).not.toHaveAttribute('align');
    await expect(getComputedStyle(aligned).textAlign).toBe('start');
  },
};

const stops = Array.from({ length: 30 }, (_, index) => index + 1);

/**
 * Section 8's markup in a page-height story with a long article. The page is
 * the scrollport: Yeti reads `--yeti-scroll-padding` on the root only (usage
 * rule 4).
 */
export const Sticky: Story = {
  render: (_args, { id }) => {
    const state = trackedState(id, { ...unset, sticky: true });

    return {
      props: { state, stops },
      template: `
        <div data-testid="frame">
          <div data-testid="sidebar" yetiSidebar width="xs" gap="lg">
            <nav data-testid="nav" yetiBox yetiBorder surface="raised" yetiSidebarChild [sticky]="state().sticky" aria-label="Section">
              <ul role="list">
                <li><a href="#overview">Overview</a></li>
                <li><a href="#route">Route</a></li>
              </ul>
            </nav>
            <article data-testid="article" yetiBox yetiBorder surface="raised">
              <h2>Stops on the trail</h2>
              @for (stop of stops; track stop) {
                <p>Stop {{ stop }} on the ridge. <a href="#stop-{{ stop }}">Notes for stop {{ stop }}</a></p>
              }
            </article>
          </div>
        </div>`,
    };
  },
  play: async ({ canvas, canvasElement, id }) => {
    const state = sidebarState(id);
    const frame = canvas.getByTestId('frame');
    const sidebar = canvas.getByTestId('sidebar');
    const nav = canvas.getByTestId('nav');
    const article = canvas.getByTestId('article');

    await expect(nav).toHaveAttribute('data-sticky', '');
    await expect(nav).not.toHaveAttribute('data-ngx-yeti-item-sidebar');

    await sidebarStyled(sidebar);
    await itemStylesLoaded('box');

    sizeAround(frame, switchWidth(frame, 'xs', 'lg'), 'wider');
    await expectSideBySide(nav, article);

    const offset = blockLength(canvasElement, 'var(--yeti-sticky-offset)');

    window.scrollTo(
      0,
      window.scrollY + sidebar.getBoundingClientRect().top + 200,
    );

    try {
      await waitFor(async () => {
        await expect(sidebar.getBoundingClientRect().top).toBeLessThan(-100);
      });
      // A sticky box's offset is resolved in the frame after the scroll.
      await waitFor(async () => {
        await expectClose(nav.getBoundingClientRect().top, offset);
      });
      await expect(nav.getBoundingClientRect().height).toBeLessThan(
        sidebar.getBoundingClientRect().height,
      );
      await expect(nav.getBoundingClientRect().right).toBeLessThanOrEqual(
        article.getBoundingClientRect().left,
      );

      state.set({ ...unset, sticky: false });
      await waitFor(async () => {
        await expect(nav).not.toHaveAttribute('data-sticky');
      });
      await waitFor(async () => {
        await expect(nav.getBoundingClientRect().top).toBeLessThan(-100);
      });
    } finally {
      window.scrollTo(0, 0);
    }
  },
};

/**
 * A sidebar whose content child is a center (section 13). Side by side, the
 * sidebar child's `flex-grow` takes all the free space, so a center's auto
 * margins resolve to 0 whichever item file comes first; stacked, the center
 * is alone on its row, and its margins show which rule won.
 */
export const HoldingCenter: Story = {
  render: () => ({
    template: `
      <div data-testid="frame">
        <div data-testid="sidebar" yetiSidebar width="lg" gap="lg">
          <div data-testid="side"><p>Filters for the trail list.</p></div>
          <div data-testid="center" yetiCenter max="2xs">
            <p>A centred column inside the sidebar's content.</p>
          </div>
        </div>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const frame = canvas.getByTestId('frame');
    const sidebar = canvas.getByTestId('sidebar');
    const center = canvas.getByTestId('center');

    await sidebarStyled(sidebar);
    await itemStylesLoaded('center');

    // Wider than the center's maximum, and narrower than the switch, so the
    // pair stacks.
    sizeAround(frame, switchWidth(frame, 'lg', 'lg'), 'narrower');
    await expect(center.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      canvas.getByTestId('side').getBoundingClientRect().bottom - 0.5,
    );

    await expectClose(
      parseFloat(getComputedStyle(center).marginLeft),
      parseFloat(getComputedStyle(center).marginRight),
    );
    await expect(
      parseFloat(getComputedStyle(center).marginLeft),
    ).toBeGreaterThan(0);
  },
};

/** `sidebar--default` in a right-to-left page. */
export const Rtl: Story = {
  render: () => ({ template: defaultSidebar('rtl') }),
  play: async ({ canvas }) => {
    const frame = canvas.getByTestId('frame');
    const sidebar = canvas.getByTestId('sidebar');
    const nav = canvas.getByTestId('nav');
    const article = canvas.getByTestId('article');

    await sidebarStyled(sidebar);
    await itemStylesLoaded('box');

    sizeAround(frame, switchWidth(frame, 'xs', 'lg'), 'wider');
    await expectSideBySide(nav, article);
    await expect(nav.getBoundingClientRect().left).toBeGreaterThan(
      article.getBoundingClientRect().right,
    );
    await expectClose(
      nav.getBoundingClientRect().right,
      sidebar.getBoundingClientRect().right,
    );

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    for (const link of sidebar.querySelectorAll('a')) {
      await userEvent.tab();
      await expect(link).toHaveFocus();
    }
  },
};
