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
import type { YetiAlign, YetiGap, YetiSide, YetiWidth } from 'ngx-yeti';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { YetiCenter } from 'ngx-yeti/center';
import { expect, userEvent, waitFor } from 'storybook/test';
import manifest from 'yeti-css/manifest';
import { YetiSidebar } from './sidebar';
import { YetiSidebarChild } from './sidebar-child';

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
const sidebarStates = storyStates<WritableSignal<SidebarState>>('sidebar');

/**
 * The container width at which the pair switches: twice the sidebar's width
 * plus the gap (sidebar.md, Testing Decisions).
 */
function switchWidth(frame: HTMLElement, width: string, gap: string): number {
  return usedLength(
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
  const margin = usedLength(frame, '2rem');
  frame.style.inlineSize = `${String(side === 'wider' ? width + margin : width - margin)}px`;
}

/** A box's padding once its file has applied: the page's default is none. */
const padded = (value: string): boolean => value !== '0px';

/** Both children on one row: equal tops. */
function assertSideBySide(first: HTMLElement, second: HTMLElement): void {
  assertWithin(
    first.getBoundingClientRect().top,
    second.getBoundingClientRect().top,
  );
}

/**
 * Stacked: the second child's top at or below the first child's bottom, and
 * both as wide as the sidebar.
 */
async function expectStacked(sidebar: HTMLElement): Promise<void> {
  const [first, second] = elementChildren(sidebar);

  if (first === undefined || second === undefined) {
    throw new Error('The sidebar has two children');
  }

  const width = sidebar.getBoundingClientRect().width;

  await expect(second.getBoundingClientRect().top).toBeGreaterThanOrEqual(
    first.getBoundingClientRect().bottom - 0.5,
  );
  assertWithin(first.getBoundingClientRect().width, width);
  assertWithin(second.getBoundingClientRect().width, width);
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

    await itemStyled('sidebar', sidebar, 'flex-wrap', 'wrap');
    await itemStyled('box', nav, 'padding-top', padded);

    for (const child of elementChildren(sidebar)) {
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
    assertSideBySide(nav, article);
    // Yeti's own tolerance: `flex-grow: 1` against 999 leaves a fraction
    // over the basis.
    assertWithin(
      nav.getBoundingClientRect().width,
      usedLength(frame, 'var(--yeti-width-xs)'),
      2,
    );
    assertWithin(
      article.getBoundingClientRect().left - nav.getBoundingClientRect().right,
      usedLength(frame, 'var(--yeti-space-lg)'),
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

    await itemStyled('sidebar', sidebar, 'flex-wrap', 'wrap');
    await itemStyled('box', nav, 'padding-top', padded);

    sizeAround(frame, switchWidth(frame, 'xs', 'lg'), 'wider');
    assertSideBySide(article, nav);
    assertWithin(
      nav.getBoundingClientRect().width,
      usedLength(frame, 'var(--yeti-width-xs)'),
      2,
    );
    await expect(nav.getBoundingClientRect().left).toBeGreaterThan(
      article.getBoundingClientRect().right,
    );

    // Reading order is source order: nothing reorders the children on
    // screen or in the accessibility tree.
    await expect(elementChildren(sidebar)).toStrictEqual([article, nav]);
    await expect(getComputedStyle(sidebar).flexDirection).toBe('row');
    await expect(
      elementChildren(sidebar).map((child) => getComputedStyle(child).order),
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
    side: {
      control: 'select',
      options: manifestValues(manifest.components.sidebar, 'data-side'),
    },
    width: {
      control: 'select',
      options: manifestValues(manifest.components.sidebar, 'data-width'),
    },
    gap: {
      control: 'select',
      options: manifestValues(manifest.components.sidebar, 'data-gap'),
    },
    align: {
      control: 'select',
      options: manifestValues(manifest.components.sidebar, 'data-align'),
    },
  },
  render: (args, { id }) => {
    const state = sidebarStates.track(
      id,
      signal<SidebarState>({
        ...unset,
        side: args.side,
        width: args.width,
        gap: args.gap,
        align: args.align,
      }),
    );

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
    const state = sidebarStates.get(id);
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

    await itemStyled('sidebar', sidebar, 'flex-wrap', 'wrap');

    state.set({ ...unset, width: 'xs', gap: 'lg', align: 'start' });
    await waitFor(async () => {
      await expect(sidebar).toHaveAttribute('data-align', 'start');
    });
    sizeAround(frame, switchWidth(frame, 'xs', 'lg'), 'wider');
    assertSideBySide(side, content);
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
    const state = sidebarStates.track(
      id,
      signal<SidebarState>({ ...unset, sticky: true }),
    );

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
    const state = sidebarStates.get(id);
    const frame = canvas.getByTestId('frame');
    const sidebar = canvas.getByTestId('sidebar');
    const nav = canvas.getByTestId('nav');
    const article = canvas.getByTestId('article');

    await expect(nav).toHaveAttribute('data-sticky', '');
    await expect(nav).not.toHaveAttribute('data-ngx-yeti-item-sidebar');

    await itemStyled('sidebar', sidebar, 'flex-wrap', 'wrap');
    await itemStyled('box', nav, 'padding-top', padded);

    sizeAround(frame, switchWidth(frame, 'xs', 'lg'), 'wider');
    assertSideBySide(nav, article);

    const offset = usedLength(
      canvasElement,
      'var(--yeti-sticky-offset)',
      'block',
    );

    window.scrollTo(
      0,
      window.scrollY + sidebar.getBoundingClientRect().top + 200,
    );

    try {
      await waitFor(async () => {
        await expect(sidebar.getBoundingClientRect().top).toBeLessThan(-100);
      });
      // A sticky box's offset is resolved in the frame after the scroll.
      await waitFor(() => {
        assertWithin(nav.getBoundingClientRect().top, offset);
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

    await itemStyled('sidebar', sidebar, 'flex-wrap', 'wrap');
    await itemStyled('center', center, 'box-sizing', 'content-box');

    // Wider than the center's maximum, and narrower than the switch, so the
    // pair stacks.
    sizeAround(frame, switchWidth(frame, 'lg', 'lg'), 'narrower');
    await expect(center.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      canvas.getByTestId('side').getBoundingClientRect().bottom - 0.5,
    );

    assertWithin(
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

    await itemStyled('sidebar', sidebar, 'flex-wrap', 'wrap');
    await itemStyled('box', nav, 'padding-top', padded);

    sizeAround(frame, switchWidth(frame, 'xs', 'lg'), 'wider');
    assertSideBySide(nav, article);
    await expect(nav.getBoundingClientRect().left).toBeGreaterThan(
      article.getBoundingClientRect().right,
    );
    assertWithin(
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
