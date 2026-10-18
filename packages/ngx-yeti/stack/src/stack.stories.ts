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
import type { YetiAlign, YetiGap } from 'ngx-yeti';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { YetiCluster } from 'ngx-yeti/cluster';
import { expect, waitFor } from 'storybook/test';
import manifest from 'yeti-css/manifest';
import { YetiStack } from './stack';
import { YetiStackChild } from './stack-child';

interface StackState {
  readonly gap: YetiGap | undefined;
  readonly align: YetiAlign | undefined;
  readonly fill: boolean;
  readonly rule: boolean;
  readonly split: boolean;
  readonly space: YetiGap | undefined;
  readonly sticky: boolean;
}

const unset: StackState = {
  gap: undefined,
  align: undefined,
  fill: false,
  rule: false,
  split: false,
  space: undefined,
  sticky: false,
};

/**
 * The inputs the settings story binds, by story id, so its play function can
 * change them the way a Storybook control does.
 */
const stackStates = storyStates<WritableSignal<StackState>>('stack');

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

/** The space between the bottom of one child and the top of the next. */
function gapBefore(child: HTMLElement): number {
  const previous = child.previousElementSibling;

  if (previous === null) {
    throw new Error('The child is the first');
  }

  return (
    child.getBoundingClientRect().top - previous.getBoundingClientRect().bottom
  );
}

/** The rule's line above a child: Yeti draws it with `::before`. */
function ruleLine(child: HTMLElement): {
  readonly content: string;
  readonly top: number;
  readonly width: number;
} {
  const style = getComputedStyle(child, '::before');

  return {
    content: style.content,
    top: parseFloat(style.top),
    width: parseFloat(style.borderTopWidth),
  };
}

const meta: Meta<YetiStack> = {
  id: 'stack',
  component: YetiStack,
  decorators: [
    moduleMetadata({
      imports: [YetiStack, YetiStackChild, YetiBox, YetiBorder, YetiCluster],
    }),
  ],
};
export default meta;

type Story = StoryObj<YetiStack>;

/**
 * Yeti's stack example, a raised bordered box on each child (stack spec,
 * section 8).
 */
export const Default: Story = {
  render: () => ({
    template: `
      <div data-testid="stack" yetiStack gap="lg" fill>
        <h2 yetiBox surface="raised" yetiBorder>A heading</h2>
        <p yetiBox surface="raised" yetiBorder>A paragraph that follows it at the stack's gap.</p>
        <p yetiBox surface="raised" yetiBorder>Another paragraph.</p>
        <h2 yetiBox surface="raised" yetiBorder yetiStackChild space="3xl">A heading with more room above it</h2>
        <p yetiBox surface="raised" yetiBorder>Back at the stack's own gap.</p>
        <p yetiBox surface="raised" yetiBorder yetiStackChild split>Pushed to the bottom when the stack has room.</p>
      </div>`,
  }),
  play: async ({ canvas, canvasElement }) => {
    const stack = canvas.getByTestId('stack');
    const items = elementChildren(stack);
    const spaced = childAt(stack, 3);
    const split = childAt(stack, 5);

    await expect(stack).toHaveAttribute('class', 'stack');
    await expect(stack).toHaveAttribute('data-ngx-yeti-item-stack', '');
    await expect(stack).toHaveAttribute('data-gap', 'lg');
    await expect(stack).toHaveAttribute('data-fill', '');
    await expect(stack).not.toHaveAttribute('data-align');
    await expect(stack).not.toHaveAttribute('data-rule');
    await expect(
      items.filter((item) => item.hasAttribute('data-space')),
    ).toStrictEqual([spaced]);
    await expect(spaced).toHaveAttribute('data-space', '3xl');
    await expect(
      items.filter((item) => item.hasAttribute('data-split')),
    ).toStrictEqual([split]);
    await expect(
      items.filter(
        (item) =>
          !item.classList.contains('box') ||
          item.getAttribute('data-surface') !== 'raised' ||
          !item.hasAttribute('data-border'),
      ),
    ).toStrictEqual([]);
    await expect(
      [stack, ...stack.querySelectorAll('*')].filter((element) =>
        element.matches('[role], [tabindex]'),
      ),
    ).toStrictEqual([]);

    await itemStyled('stack', stack, 'display', 'flex');
    await itemStyled('box', childAt(stack, 0), 'padding-top', padded);

    for (const item of items) {
      const { marginTop, marginRight, marginBottom, marginLeft } =
        getComputedStyle(item);

      await expect([marginRight, marginBottom, marginLeft]).toStrictEqual([
        '0px',
        '0px',
        '0px',
      ]);

      if (item !== spaced && item !== split) {
        await expect(marginTop).toBe('0px');
      }
    }

    assertWithin(
      gapBefore(childAt(stack, 1)),
      usedLength(canvasElement, 'var(--yeti-space-lg)', 'block'),
      0.5,
    );
    assertWithin(
      gapBefore(spaced),
      usedLength(canvasElement, 'var(--yeti-space-3xl)', 'block'),
      0.5,
    );
    assertWithin(
      split.getBoundingClientRect().bottom,
      stack.getBoundingClientRect().bottom,
      0.5,
    );

    // Reading order is source order: one column, top to bottom, with nothing
    // that reorders the children on screen or in the accessibility tree.
    await expect(getComputedStyle(stack).flexDirection).toBe('column');
    await expect(
      items.map((item) => getComputedStyle(item).order),
    ).toStrictEqual(items.map(() => '0'));
    await expect(
      stack.querySelectorAll('[aria-owns], [aria-flowto]'),
    ).toHaveLength(0);

    const tops = items.map((item) => item.getBoundingClientRect().top);

    await expect(tops).toStrictEqual(tops.toSorted((a, b) => a - b));
  },
};

/** Every input of both directives, set and reset as a Storybook control would. */
export const Settings: StoryObj<
  YetiStack & Pick<YetiStackChild, 'split' | 'space' | 'sticky'>
> = {
  argTypes: {
    // Yeti's vocabularies, which the contract spec proves equal to the
    // inputs' types, so a pin move that adds a value adds its option.
    gap: {
      control: 'select',
      options: manifestValues(manifest.components.stack, 'data-gap'),
    },
    align: {
      control: 'select',
      options: manifestValues(manifest.components.stack, 'data-align'),
    },
    fill: { control: 'boolean' },
    rule: { control: 'boolean' },
    split: { control: 'boolean' },
    space: {
      control: 'select',
      options: manifestValues(manifest.components.stack, 'data-gap'),
    },
    sticky: { control: 'boolean' },
  },
  render: (args, { id }) => {
    const state = signal<StackState>({
      gap: args.gap,
      align: args.align,
      fill: args.fill === true,
      rule: args.rule === true,
      split: args.split === true,
      space: args.space,
      sticky: args.sticky === true,
    });
    stackStates.track(id, state);

    // Template props are named unlike the inputs, which they would collide
    // with once `component` is set.
    return {
      props: { state },
      template: `
        <div data-testid="stack" yetiStack [gap]="state().gap" [align]="state().align" [fill]="state().fill" [rule]="state().rule">
          <p>The first child.</p>
          <p>The second child.</p>
          <p data-testid="child" yetiStackChild [split]="state().split" [space]="state().space" [sticky]="state().sticky">The child the settings change.</p>
        </div>`,
    };
  },
  play: async ({ canvas, id }) => {
    const state = stackStates.get(id);
    const stack = canvas.getByTestId('stack');
    const child = canvas.getByTestId('child');
    const cases: readonly {
      readonly host: HTMLElement;
      readonly attribute: string;
      readonly set: Partial<StackState>;
      readonly value: string;
    }[] = [
      {
        host: stack,
        attribute: 'data-gap',
        set: { gap: 'sm-lg' },
        value: 'sm-lg',
      },
      {
        host: stack,
        attribute: 'data-align',
        set: { align: 'end' },
        value: 'end',
      },
      { host: stack, attribute: 'data-fill', set: { fill: true }, value: '' },
      { host: stack, attribute: 'data-rule', set: { rule: true }, value: '' },
      { host: child, attribute: 'data-split', set: { split: true }, value: '' },
      {
        host: child,
        attribute: 'data-space',
        set: { space: 'xl' },
        value: 'xl',
      },
      {
        host: child,
        attribute: 'data-sticky',
        set: { sticky: true },
        value: '',
      },
    ];

    for (const { host, attribute, set, value } of cases) {
      state.set({ ...unset, ...set });
      await waitFor(async () => {
        await expect(host).toHaveAttribute(attribute, value);
      });

      state.set(unset);
      await waitFor(async () => {
        await expect(host).not.toHaveAttribute(attribute);
      });
    }

    await expect(stack).not.toHaveAttribute('align');
  },
};

/** `align="start"` beside the default, which stretches. */
export const Align: Story = {
  render: () => ({
    template: `
      <div data-testid="start" yetiStack align="start">
        <div>A badge keeps its own width.</div>
        <div>So does this line.</div>
      </div>
      <div data-testid="stretch" yetiStack>
        <div>Each child is as wide as the column.</div>
        <div>This is Yeti's default.</div>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const start = canvas.getByTestId('start');
    const stretch = canvas.getByTestId('stretch');

    await expect(start).toHaveAttribute('data-align', 'start');
    await expect(start).not.toHaveAttribute('align');
    await expect(stretch).not.toHaveAttribute('data-align');
    await expect(stretch).not.toHaveAttribute('align');

    await itemStyled('stack', start, 'display', 'flex');

    await expect(childAt(start, 0).getBoundingClientRect().width).toBeLessThan(
      start.getBoundingClientRect().width,
    );
    assertWithin(
      childAt(stretch, 0).getBoundingClientRect().width,
      stretch.getBoundingClientRect().width,
      0.5,
    );
  },
};

/**
 * A ruled definition list (stack spec, section 8), and a ruled stack whose
 * first child's `space` does nothing (usage rule 4), with a closer child and
 * a child that is itself a stack with its own gap. Each row of the list is a
 * cluster.
 */
export const Rule: Story = {
  render: () => ({
    template: `
      <dl data-testid="list" yetiStack rule gap="sm">
        <div yetiCluster justify="between"><dt>Distance</dt><dd>14.2 km</dd></div>
        <div yetiCluster justify="between"><dt>Ascent</dt><dd>1,120 m</dd></div>
        <div yetiCluster justify="between"><dt>Time</dt><dd>5 h 30 min</dd></div>
      </dl>
      <div data-testid="ruled" yetiStack rule gap="sm">
        <p yetiStackChild space="xl">First, where the marker does nothing.</p>
        <p>The line sits in the middle of the gap.</p>
        <p yetiStackChild space="xs">Closer, and its line moves with it.</p>
        <div yetiStack gap="lg">
          <span>A row that is a stack</span>
          <span>with its own gap</span>
        </div>
      </div>`,
  }),
  play: async ({ canvas, canvasElement }) => {
    const list = canvas.getByTestId('list');
    const ruled = canvas.getByTestId('ruled');

    await expect(list).toHaveAttribute('data-rule', '');
    await expect(list).toHaveAttribute('data-gap', 'sm');
    await expect(canvas.queryAllByRole('separator')).toHaveLength(0);

    await itemStyled('stack', list, 'display', 'flex');

    const sm = usedLength(canvasElement, 'var(--yeti-space-sm)', 'block');
    const xs = usedLength(canvasElement, 'var(--yeti-space-xs)', 'block');
    const border = usedLength(
      canvasElement,
      'var(--yeti-border-width)',
      'block',
    );

    await expect(ruleLine(childAt(list, 0)).content).toBe('none');

    for (const row of elementChildren(list).slice(1)) {
      const line = ruleLine(row);

      // The rule leaves the gap as it is.
      assertWithin(gapBefore(row), sm, 0.5);
      await expect(line.width).toBe(border);
      assertWithin(line.top, -sm / 2, 0.5);
    }

    const [first, second, closer, nested] = elementChildren(ruled);

    if (
      first === undefined ||
      second === undefined ||
      closer === undefined ||
      nested === undefined
    ) {
      throw new Error('The ruled stack has four children');
    }

    assertWithin(
      first.getBoundingClientRect().top,
      ruled.getBoundingClientRect().top,
      0.5,
    );
    await expect(ruleLine(first).content).toBe('none');
    assertWithin(gapBefore(second), sm, 0.5);
    assertWithin(ruleLine(second).top, -sm / 2, 0.5);
    assertWithin(gapBefore(closer), xs, 0.5);
    assertWithin(ruleLine(closer).top, -xs / 2, 0.5);
    // The nested stack sets its own gap; its line is still placed by the
    // ruled stack's.
    assertWithin(gapBefore(nested), sm, 0.5);
    assertWithin(ruleLine(nested).top, -sm / 2, 0.5);
    await expect(ruleLine(nested).width).toBe(border);
  },
};

const stops = Array.from({ length: 40 }, (_, index) => index + 1);

/**
 * A stack taller than the page with one pinned child and links after it.
 * The page is the scrollport: Yeti reads `--yeti-scroll-padding` on the root
 * only (usage rule 7).
 */
export const Sticky: Story = {
  render: () => ({
    props: { stops },
    template: `
      <div data-testid="stack" yetiStack gap="sm">
        <h2 data-testid="pinned" yetiStackChild sticky style="padding-block: var(--yeti-space-md); background-color: var(--yeti-color-surface)">Stops on the trail</h2>
        @for (stop of stops; track stop) {
          <a href="#stop-{{ stop }}">Stop {{ stop }}</a>
        }
      </div>`,
  }),
  play: async ({ canvas, canvasElement }) => {
    const stack = canvas.getByTestId('stack');
    const pinned = canvas.getByTestId('pinned');

    await expect(pinned).toHaveAttribute('data-sticky', '');
    await expect(canvas.getAllByRole('link')).toHaveLength(stops.length);

    await itemStyled('stack', stack, 'display', 'flex');

    const offset = usedLength(
      canvasElement,
      'var(--yeti-sticky-offset)',
      'block',
    );

    window.scrollTo(
      0,
      window.scrollY + stack.getBoundingClientRect().top + 200,
    );

    try {
      // The stack's own top has scrolled out, so only the pin holds the child.
      await waitFor(async () => {
        await expect(stack.getBoundingClientRect().top).toBeLessThan(-100);
      });
      // A sticky box's offset is resolved in the frame after the scroll.
      await waitFor(async () => {
        await expect(
          Math.abs(pinned.getBoundingClientRect().top - offset),
        ).toBeLessThanOrEqual(1);
      });
      await expect(
        Math.abs(
          pinned.getBoundingClientRect().width -
            stack.getBoundingClientRect().width,
        ),
      ).toBeLessThanOrEqual(1);
    } finally {
      window.scrollTo(0, 0);
    }
  },
};
