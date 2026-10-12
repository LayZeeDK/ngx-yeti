import { signal, type WritableSignal } from '@angular/core';
import {
  elementChildren,
  itemNames,
  itemStyled,
  manifestValues,
  nextFrame,
  storyStates,
} from '@ngx-yeti/testing';
import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import type { YetiGap, YetiWidth } from 'ngx-yeti';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { YetiStack } from 'ngx-yeti/stack';
import { expect, userEvent, waitFor } from 'storybook/test';
import manifest from 'yeti-css/manifest';
import { YetiCenter } from './center';

interface CenterState {
  readonly max: YetiWidth | undefined;
  readonly gap: YetiGap | undefined;
  readonly intrinsic: boolean;
}

const unset: CenterState = {
  max: undefined,
  gap: undefined,
  intrinsic: false,
};

/**
 * The inputs the controls story binds, by story id, so its play function can
 * change them the way a Storybook control does.
 */
const centerStates = storyStates<WritableSignal<CenterState>>('center');

/** The center's maximum and its gutter, in px. */
function column(center: HTMLElement): {
  readonly max: number;
  readonly gutter: number;
} {
  const { maxInlineSize, paddingInlineStart } = getComputedStyle(center);

  return {
    max: parseFloat(maxInlineSize),
    gutter: parseFloat(paddingInlineStart),
  };
}

/** The space between the center and its container on each side. */
function inlineMargins(center: HTMLElement): {
  readonly start: number;
  readonly end: number;
} {
  const container = center.parentElement;

  if (container === null) {
    throw new Error('The center has no container');
  }

  const outer = container.getBoundingClientRect();
  const inner = center.getBoundingClientRect();

  return { start: inner.left - outer.left, end: outer.right - inner.right };
}

/**
 * In a frame narrower than its maximum the center fills its container; in a
 * wider one it stops at the maximum with equal margins on both sides. The
 * frame is resized, not the viewport.
 */
async function expectCentred(
  frame: HTMLElement,
  centers: readonly HTMLElement[],
): Promise<void> {
  for (const center of centers) {
    const { max, gutter } = column(center);

    frame.style.inlineSize = `${String(max / 2)}px`;

    const narrow = inlineMargins(center);

    await expect(Math.abs(narrow.start)).toBeLessThanOrEqual(1);
    await expect(Math.abs(narrow.end)).toBeLessThanOrEqual(1);

    frame.style.inlineSize = `${String(max + 2 * gutter + 200)}px`;

    const wide = inlineMargins(center);

    await expect(wide.start).toBeGreaterThan(50);
    await expect(Math.abs(wide.start - wide.end)).toBeLessThanOrEqual(1);
  }

  frame.style.inlineSize = '';
}

const meta: Meta<YetiCenter> = {
  id: 'center',
  component: YetiCenter,
  decorators: [
    moduleMetadata({ imports: [YetiCenter, YetiStack, YetiBox, YetiBorder] }),
  ],
};
export default meta;

type Story = StoryObj<YetiCenter>;

/**
 * Yeti's center example in the form usage rule 3 keeps (center spec, section
 * 8). The probe beside it reads the public token the maximum comes from.
 */
export const Default: Story = {
  render: () => ({
    template: `
      <div data-testid="frame">
        <main yetiCenter max="md">
          <div data-testid="box" yetiBox yetiBorder surface="raised">
            <h1>A readable column</h1>
            <p>Never wider than the maximum, never touching the screen edge.</p>
          </div>
        </main>
        <div data-testid="probe" style="max-inline-size: var(--yeti-width-md)"></div>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const frame = canvas.getByTestId('frame');
    const center = canvas.getByRole('main');

    await expect(center).toHaveAttribute('class', 'center');
    await expect(center).toHaveAttribute('data-max', 'md');
    await expect(center).toHaveAttribute('data-ngx-yeti-item-center', '');
    await expect(center).not.toHaveAttribute('data-gap');
    await expect(center).not.toHaveAttribute('data-intrinsic');
    await expect(center).not.toHaveAttribute('tabindex');
    await expect(center).not.toHaveAttribute('role');
    await expect(center).not.toHaveAttribute('data-border');

    const box = canvas.getByTestId('box');

    await expect(box).toHaveAttribute('class', 'box');
    await expect(box).toHaveAttribute('data-ngx-yeti-item-box', '');
    await expect(box).toHaveAttribute('data-surface', 'raised');
    await expect(box).toHaveAttribute('data-border', '');

    await itemStyled('center', center, 'box-sizing', 'content-box');

    await expect(getComputedStyle(center).maxInlineSize).toBe(
      getComputedStyle(canvas.getByTestId('probe')).maxInlineSize,
    );
    await expectCentred(frame, [center]);
  },
};

export const Unset: Story = {
  render: () => ({
    template: `
      <div data-testid="center" yetiCenter>
        <p>A column at Yeti's default maximum and gutter.</p>
      </div>
      <div data-testid="probe" style="max-inline-size: var(--yeti-width-xl)"></div>`,
  }),
  play: async ({ canvas }) => {
    const center = canvas.getByTestId('center');

    await expect(
      center
        .getAttributeNames()
        .filter((name) => name.startsWith('data-'))
        .toSorted(),
    ).toStrictEqual(['data-ngx-yeti-item-center', 'data-testid']);

    await itemStyled('center', center, 'box-sizing', 'content-box');

    await expect(getComputedStyle(center).maxInlineSize).toBe(
      getComputedStyle(canvas.getByTestId('probe')).maxInlineSize,
    );
  },
};

/**
 * A heading and a button that sit in the middle rather than stretch. Until
 * `button` lands, the button is a plain one.
 */
export const Intrinsic: Story = {
  render: () => ({
    template: `
      <div data-testid="frame">
        <div data-testid="center" yetiCenter intrinsic>
          <h2>Welcome back</h2>
          <button type="button">Sign in</button>
        </div>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const frame = canvas.getByTestId('frame');
    const center = canvas.getByTestId('center');

    await expect(center).toHaveAttribute('data-intrinsic', '');

    await itemStyled('center', center, 'box-sizing', 'content-box');
    frame.style.inlineSize = '40rem';

    const columnRect = center.getBoundingClientRect();
    const middle = columnRect.left + columnRect.width / 2;

    await expect(columnRect.width).toBeLessThan(
      frame.getBoundingClientRect().width,
    );

    for (const child of [
      canvas.getByRole('heading', { level: 2 }),
      canvas.getByRole('button', { name: 'Sign in' }),
    ]) {
      const rect = child.getBoundingClientRect();

      await expect(
        Math.abs(rect.left + rect.width / 2 - middle),
      ).toBeLessThanOrEqual(1);
    }

    // DOM order is reading order: the centring reorders nothing.
    await expect(
      [...center.children].map((child) => getComputedStyle(child).order),
    ).toStrictEqual(['0', '0']);
  },
};

/**
 * The center and the box on one element (center spec, section 3): one `gap`
 * binding sets the center's gutter and the box's padding through one
 * `data-gap`. The probe reads the public token of that gap.
 */
export const WithBox: Story = {
  render: () => ({
    template: `
      <section data-testid="center" yetiCenter yetiBox gap="lg">
        <h2>A padded column</h2>
        <p>The same gap pads the column on every side.</p>
      </section>
      <div data-testid="probe" style="padding: var(--yeti-space-lg)"></div>`,
  }),
  play: async ({ canvas }) => {
    const center = canvas.getByTestId('center');

    await expect([...center.classList].toSorted()).toStrictEqual([
      'box',
      'center',
    ]);
    await expect(center).toHaveAttribute('data-gap', 'lg');
    await expect(
      center.getAttributeNames().filter((name) => name === 'data-gap'),
    ).toHaveLength(1);
    await expect(center).toHaveAttribute('data-ngx-yeti-item-center', '');
    await expect(center).toHaveAttribute('data-ngx-yeti-item-box', '');

    const probe = getComputedStyle(canvas.getByTestId('probe'));

    await itemStyled('center', center, 'box-sizing', 'content-box');
    await itemStyled(
      'box',
      center,
      'padding-block-start',
      probe.paddingBlockStart,
    );

    // The center's gutter on the inline axis and the box's padding on the
    // block axis both come from the one gap.
    const style = getComputedStyle(center);

    await expect(style.paddingInlineStart).toBe(probe.paddingInlineStart);
    await expect(style.paddingInlineEnd).toBe(probe.paddingInlineStart);
    await expect(style.paddingBlockStart).toBe(probe.paddingBlockStart);
    await expect(style.paddingBlockEnd).toBe(probe.paddingBlockStart);
  },
};

/**
 * Anti-pattern (usage rule 3, ledger A11Y-9), what not to write: Yeti's own
 * example puts the border on the center's element. The center's width
 * leaves room for its gutters only, so the border's two widths make the
 * column wider than its container below the maximum, and a 320 px page
 * scrolls sideways (the Fixture app records it). Axe does not flag the
 * overflow, so no rule is off. Write the border on a `yetiBox` inside the
 * center, as `center--default` does.
 */
export const AntiPatternBordered: Story = {
  render: () => ({
    template: `
      <main data-testid="center" yetiCenter yetiBox yetiBorder max="md" surface="raised">
        <h1>A readable column</h1>
        <p>Never wider than the maximum, never touching the screen edge.</p>
      </main>`,
  }),
  play: async ({ canvas }) => {
    const center = canvas.getByTestId('center');

    await expect([...center.classList].toSorted()).toStrictEqual([
      'box',
      'center',
    ]);
    await expect(center).toHaveAttribute('data-border', '');
    await expect(center).toHaveAttribute('data-max', 'md');
    await expect(center).toHaveAttribute('data-surface', 'raised');
  },
};

type RenderOrder = 'stack' | 'none' | 'center' | 'center-then-stack';

/**
 * A page that is a stack of centred sections. `.stack > *` zeroes margins
 * and `.center` sets `margin-inline: auto` at equal specificity, so a center
 * in a stack stays centred only while `center.css` comes after `stack.css`.
 * The loader inserts the two links in Yeti's order whichever renders first
 * (ADR 0060 point 3); the buttons render them in each order.
 */
export const InStack: Story = {
  render: () => ({
    props: { order: signal<RenderOrder>('stack') },
    template: `
      <div role="group" aria-label="Render order">
        <button type="button" (click)="order.set('none')">Remove everything</button>
        <button type="button" (click)="order.set('center')">Render a center first</button>
        <button type="button" (click)="order.set('center-then-stack')">Then render the stack</button>
      </div>
      <div data-testid="frame">
        @if (order() === 'center' || order() === 'center-then-stack') {
          <div data-testid="first" yetiCenter max="xs"><p>A center that rendered before the stack.</p></div>
        }
        @if (order() === 'stack' || order() === 'center-then-stack') {
          <div data-testid="page" yetiStack gap="lg">
            <section yetiCenter max="xs"><h2>Trail maps</h2></section>
            <section yetiCenter max="xs"><p>Every map of the valley, one sheet per trail.</p></section>
            <section yetiCenter max="xs"><p>Printed on paper that survives the rain.</p></section>
          </div>
        }
      </div>`,
  }),
  play: async ({ canvas }) => {
    const frame = canvas.getByTestId('frame');
    const sections = (): HTMLElement[] =>
      elementChildren(canvas.getByTestId('page'));
    const stackAndCenter = (): (string | null)[] =>
      itemNames().filter((name) => name === 'stack' || name === 'center');
    const press = (name: string): Promise<void> =>
      userEvent.click(canvas.getByRole('button', { name }));
    /** Both item files have applied to the page and its sections. */
    const styled = async (): Promise<void> => {
      await itemStyled('stack', canvas.getByTestId('page'), 'display', 'flex');

      for (const section of sections()) {
        await itemStyled('center', section, 'box-sizing', 'content-box');
      }
    };

    // The stack renders first: its directive is created before its children's.
    await expect(sections()).toHaveLength(3);
    await expect(stackAndCenter()).toStrictEqual(['stack', 'center']);
    await styled();
    await expectCentred(frame, sections());

    await press('Remove everything');
    await waitFor(async () => {
      await expect(canvas.queryByTestId('page')).toBeNull();
    });
    await nextFrame();
    await expect(stackAndCenter()).toStrictEqual([]);

    // A center renders first, and the stack's link arrives after its link.
    await press('Render a center first');
    await waitFor(async () => {
      await expect(stackAndCenter()).toStrictEqual(['center']);
    });
    await press('Then render the stack');
    await waitFor(async () => {
      await expect(stackAndCenter()).toStrictEqual(['stack', 'center']);
    });
    await styled();
    await expectCentred(frame, sections());
  },
};

/** Every input, set and reset as a Storybook control would. */
export const Controls: Story = {
  argTypes: {
    // Yeti's vocabularies, which the contract spec proves equal to the
    // inputs' types, so a pin move that adds a value adds its option.
    max: {
      control: 'select',
      options: manifestValues(manifest.components.center, 'data-max'),
    },
    gap: {
      control: 'select',
      options: manifestValues(manifest.components.center, 'data-gap'),
    },
    intrinsic: { control: 'boolean' },
  },
  render: (args, { id }) => {
    const state = signal<CenterState>({
      max: args.max,
      gap: args.gap,
      intrinsic: args.intrinsic === true,
    });
    centerStates.track(id, state);

    // Template props are named unlike the inputs, which they would collide
    // with once `component` is set.
    return {
      props: { state },
      template: `
        <div data-testid="center" yetiCenter [max]="state().max" [gap]="state().gap" [intrinsic]="state().intrinsic">
          <p>A column the controls change.</p>
        </div>`,
    };
  },
  play: async ({ canvas, id }) => {
    const state = centerStates.get(id);
    const center = canvas.getByTestId('center');
    const cases: readonly {
      readonly attribute: string;
      readonly set: Partial<CenterState>;
      readonly value: string;
    }[] = [
      { attribute: 'data-max', set: { max: 'lg' }, value: 'lg' },
      { attribute: 'data-gap', set: { gap: 'sm-lg' }, value: 'sm-lg' },
      { attribute: 'data-intrinsic', set: { intrinsic: true }, value: '' },
    ];

    for (const { attribute, set, value } of cases) {
      state.set({ ...unset, ...set });
      await waitFor(async () => {
        await expect(center).toHaveAttribute(attribute, value);
      });

      state.set(unset);
      await waitFor(async () => {
        await expect(center).not.toHaveAttribute(attribute);
      });
    }
  },
};

/**
 * A theme sets the two public tokens the unset center reads. The probe
 * inside the theme reads the same tokens; the one outside shows they differ
 * from the page's.
 */
export const Themed: Story = {
  render: () => ({
    template: `
      <div data-testid="theme" style="--yeti-width-xl: 20rem; --yeti-space-md: 3rem">
        <div data-testid="center" yetiCenter>
          <p>A narrower column with wider gutters.</p>
        </div>
        <div data-testid="themed-probe" style="max-inline-size: var(--yeti-width-xl); padding-inline-start: var(--yeti-space-md)"></div>
      </div>
      <div data-testid="page-probe" style="max-inline-size: var(--yeti-width-xl); padding-inline-start: var(--yeti-space-md)"></div>`,
  }),
  play: async ({ canvas }) => {
    const center = canvas.getByTestId('center');
    const themed = getComputedStyle(canvas.getByTestId('themed-probe'));
    const page = getComputedStyle(canvas.getByTestId('page-probe'));

    await expect(center).not.toHaveAttribute('data-max');
    await expect(center).not.toHaveAttribute('data-gap');

    await itemStyled('center', center, 'box-sizing', 'content-box');

    const style = getComputedStyle(center);

    await expect(style.maxInlineSize).toBe(themed.maxInlineSize);
    await expect(style.paddingInlineStart).toBe(themed.paddingInlineStart);
    await expect(style.paddingInlineEnd).toBe(themed.paddingInlineStart);
    await expect(themed.maxInlineSize).not.toBe(page.maxInlineSize);
    await expect(themed.paddingInlineStart).not.toBe(page.paddingInlineStart);
  },
};
