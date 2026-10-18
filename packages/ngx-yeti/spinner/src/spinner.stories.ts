import { signal, type WritableSignal } from '@angular/core';
import {
  composite,
  contrastRatio,
  itemStyled,
  manifestValues,
  parseColor,
  storyStates,
  type SrgbColor,
} from '@ngx-yeti/testing';
import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import type { YetiSizeControl, YetiVariant } from 'ngx-yeti';
import { NgxYetiPaint } from 'ngx-yeti/box';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import manifest from 'yeti-css/manifest';
import { YetiSpinner } from './spinner';

const schemes = ['light', 'dark'] as const;

/** A wrapper on Yeti's page surface in one scheme, as `withColorScheme` draws it. */
function schemeWrapper(scheme: string, content: string): string {
  return `<div data-scheme="${scheme}" style="color-scheme: ${scheme}; color: var(--yeti-color-text); background-color: var(--yeti-color-surface)">${content}</div>`;
}

function byScheme(root: HTMLElement, scheme: string): HTMLElement {
  const wrapper = root.querySelector(`[data-scheme="${scheme}"]`);

  if (!(wrapper instanceof HTMLElement)) {
    throw new Error(`No ${scheme} wrapper`);
  }

  return wrapper;
}

function rings(root: Element): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('[yetiSpinner]')];
}

function lineOf(ring: HTMLElement): HTMLElement {
  const line = ring.parentElement;

  if (line === null) {
    throw new Error('The ring has no line');
  }

  return line;
}

/**
 * Pauses every ring's turn at its start: a turning square's bounding box
 * grows by up to the square root of 2 (spinner.md, Testing Decisions).
 */
function pauseRings(root: Element): void {
  for (const ring of rings(root)) {
    for (const animation of ring.getAnimations()) {
      animation.pause();
      animation.currentTime = 0;
    }
  }
}

/**
 * The colour an element is painted on: its own background and its
 * ancestors' composited down to the nearest opaque one.
 */
function effectiveBackground(element: Element): SrgbColor {
  const layers: string[] = [];

  for (
    let node: Element | null = element;
    node !== null;
    node = node.parentElement
  ) {
    const { backgroundColor } = getComputedStyle(node);

    if (parseColor(backgroundColor).alpha === 1) {
      return layers.reduceRight<SrgbColor>(
        (backdrop, layer) => composite(layer, backdrop),
        parseColor(backgroundColor),
      );
    }

    layers.push(backgroundColor);
  }

  throw new Error('No opaque background behind the element');
}

/** The ring's bright edge, its block-start border, on what is behind it. */
function brightEdgeRatio(ring: HTMLElement): number {
  return contrastRatio(
    getComputedStyle(ring).borderTopColor,
    effectiveBackground(lineOf(ring)),
  );
}

/** The line's words beside the ring, exact formula, at least 4.5:1. */
async function expectTextReadable(ring: HTMLElement): Promise<void> {
  const line = lineOf(ring);

  await expect(
    contrastRatio(getComputedStyle(line).color, effectiveBackground(line)),
  ).toBeGreaterThanOrEqual(4.5);
}

/**
 * Usage rules 2 to 4: a ring is either a status with a name, or hidden with
 * `aria-hidden="true"` inside a status region; and its line has visible text.
 */
async function expectAnnounced(ring: HTMLElement): Promise<void> {
  const line = lineOf(ring);

  if (ring.getAttribute('aria-hidden') === 'true') {
    await expect(ring).not.toHaveAttribute('role');
    await expect(line.closest('[role="status"]')).not.toBeNull();
  } else {
    await expect(ring).toHaveRole('status');
    await expect(ring).toHaveAccessibleName(/\S/);
  }

  await expect(line.textContent.trim()).not.toBe('');
}

/** The ring's box equals its own font size within 1 px. */
async function expectOneEm(ring: HTMLElement): Promise<void> {
  const { width, height } = ring.getBoundingClientRect();
  const fontSize = parseFloat(getComputedStyle(ring).fontSize);

  await expect(Math.abs(width - fontSize)).toBeLessThanOrEqual(1);
  await expect(Math.abs(height - fontSize)).toBeLessThanOrEqual(1);
}

const example =
  '<p><span yetiSpinner role="status" aria-label="Loading"></span> Loading the latest posts</p>';

interface SpinnerState {
  readonly variant: YetiVariant | undefined;
  readonly size: YetiSizeControl | undefined;
}

const unset: SpinnerState = { variant: undefined, size: undefined };

/**
 * The inputs the inputs story binds, by story id, so its play function can
 * change them the way a Storybook control does.
 */
const spinnerStates = storyStates<WritableSignal<SpinnerState>>('spinner');

const meta: Meta<YetiSpinner> = {
  id: 'spinner',
  component: YetiSpinner,
  decorators: [moduleMetadata({ imports: [YetiSpinner] })],
};
export default meta;

type Story = StoryObj<YetiSpinner>;

/**
 * Yeti's example (spinner spec, section 8) in a light and a dark wrapper,
 * with the bright edge's 3:1 and the text's 4.5:1. Layer 4 repeats both
 * ratios under each emulated page scheme.
 */
export const Default: Story = {
  render: () => ({
    template: schemes.map((scheme) => schemeWrapper(scheme, example)).join(''),
  }),
  play: async ({ canvasElement }) => {
    for (const scheme of schemes) {
      const wrapper = byScheme(canvasElement, scheme);
      const ring = within(wrapper).getByRole('status', { name: 'Loading' });

      await expect(ring).toHaveAttribute('class', 'spinner');
      await expect(ring).toHaveAttribute('data-ngx-yeti-item-spinner', '');
      await expect(ring).not.toHaveAttribute('data-variant');
      await expect(ring).not.toHaveAttribute('data-size');
      await expect(ring).not.toHaveAttribute('tabindex');
      await expect(ring).not.toHaveAttribute('id');
      await expect(
        ring
          .getAttributeNames()
          .filter((name) => name.startsWith('aria-') && name !== 'aria-label'),
      ).toStrictEqual([]);

      ring.focus();

      await expect(ring).not.toHaveFocus();
      await expectAnnounced(ring);
      await itemStyled('spinner', ring, 'display', 'inline-block');

      const style = getComputedStyle(ring);

      await expect(style.animationName).toBe('yeti-spin');
      await expect(
        ring.getAnimations().some(({ playState }) => playState === 'running'),
      ).toBe(true);
      await expect(style.borderTopLeftRadius).not.toBe('0px');
      await expect(brightEdgeRatio(ring)).toBeGreaterThanOrEqual(3);
      await expectTextReadable(ring);
    }

    pauseRings(canvasElement);

    for (const ring of rings(canvasElement)) {
      await expectOneEm(ring);
    }
  },
};

/** `sm`, `md`, and `lg` rings in lines of the matching text step. */
export const Sizes: Story = {
  render: () => ({
    template: `
      <p style="font-size: var(--yeti-text-sm)"><span data-testid="sm" yetiSpinner size="sm" role="status" aria-label="Loading small"></span> Small</p>
      <p style="font-size: var(--yeti-text-md)"><span data-testid="md" yetiSpinner size="md" role="status" aria-label="Loading medium"></span> Medium</p>
      <p style="font-size: var(--yeti-text-lg)"><span data-testid="lg" yetiSpinner size="lg" role="status" aria-label="Loading large"></span> Large</p>`,
  }),
  play: async ({ canvas, canvasElement }) => {
    const ring = (size: string): HTMLElement => canvas.getByTestId(size);

    for (const size of ['sm', 'md', 'lg']) {
      await expect(ring(size)).toHaveAttribute('data-size', size);
      await expectAnnounced(ring(size));
    }

    await expect(ring('lg')).toHaveAttribute('size', 'lg');
    await itemStyled('spinner', ring('lg'), 'display', 'inline-block');
    pauseRings(canvasElement);

    for (const size of ['sm', 'md', 'lg']) {
      await expectOneEm(ring(size));
    }

    await expect(ring('lg').getBoundingClientRect().width).toBeGreaterThan(
      ring('md').getBoundingClientRect().width,
    );
  },
};

const huedVariants = manifestValues(
  manifest.components.spinner,
  'data-variant',
).filter((variant) => variant !== 'black' && variant !== 'white');

/**
 * The seven hued rings on the wrapper's surface, then `black` on Yeti's
 * white paint and `white` on its black paint, which no scheme changes.
 */
function variantLines(): string {
  const line = (variant: string, paint = ''): string =>
    `<p${paint}><span yetiSpinner variant="${variant}" role="status" aria-label="Loading ${variant}"></span> Loading the ${variant} posts</p>`;

  return [
    ...huedVariants.map((variant) => line(variant)),
    line('black', ' yetiPaint="white"'),
    line('white', ' yetiPaint="black"'),
  ].join('');
}

/**
 * Every variant with visible text beside it, in a light and a dark wrapper.
 * The bright edge's ratio of each is recorded in layer 4, not asserted: the
 * records ask for a measurement there, not a threshold.
 */
export const Variants: Story = {
  decorators: [moduleMetadata({ imports: [YetiSpinner, NgxYetiPaint] })],
  render: () => ({
    template: schemes
      .map((scheme) => schemeWrapper(scheme, variantLines()))
      .join(''),
  }),
  play: async ({ canvasElement }) => {
    for (const scheme of schemes) {
      const lines = rings(byScheme(canvasElement, scheme));

      await expect(
        lines.map((ring) => ring.getAttribute('data-variant')),
      ).toStrictEqual([...huedVariants, 'black', 'white']);

      for (const ring of lines) {
        await expectAnnounced(ring);
        await expectTextReadable(ring);
      }
    }
  },
};

/** `variant` and `size`, set and reset as a Storybook control would. */
export const Inputs: Story = {
  argTypes: {
    // Yeti's vocabularies, which the contract spec proves equal to the
    // inputs' types, so a pin move that adds a value adds its option.
    variant: {
      control: 'select',
      options: manifestValues(manifest.components.spinner, 'data-variant'),
    },
    size: {
      control: 'select',
      options: manifestValues(manifest.components.spinner, 'data-size'),
    },
  },
  render: (args, { id }) => {
    const state = signal<SpinnerState>({
      variant: args.variant,
      size: args.size,
    });
    spinnerStates.track(id, state);

    // Template props are named unlike the inputs, which they would collide
    // with once `component` is set.
    return {
      props: { state },
      template: `<p><span data-testid="ring" yetiSpinner [variant]="state().variant" [size]="state().size" role="status" aria-label="Loading"></span> Loading the latest posts</p>`,
    };
  },
  play: async ({ canvas, id }) => {
    const state = spinnerStates.get(id);
    const ring = canvas.getByTestId('ring');

    await expectAnnounced(ring);

    state.set({ ...unset, variant: 'danger' });
    await waitFor(async () => {
      await expect(ring).toHaveAttribute('data-variant', 'danger');
    });

    state.set(unset);
    await waitFor(async () => {
      await expect(ring).not.toHaveAttribute('data-variant');
    });

    state.set({ ...unset, size: 'lg' });
    await waitFor(async () => {
      await expect(ring).toHaveAttribute('data-size', 'lg');
    });

    state.set(unset);
    await waitFor(async () => {
      await expect(ring).not.toHaveAttribute('data-size');
    });
  },
};

/**
 * A consumer's status region and a Load control: Load inserts the spinner
 * with `@if`, Finish removes it and writes the completion message into the
 * status region, which was in the DOM all along (usage rules 5 and 6).
 */
export const Waiting: Story = {
  render: () => {
    const loading = signal(false);
    const loaded = signal(false);

    return {
      props: { loading, loaded },
      template: `
        <button type="button" (click)="loaded.set(false); loading.set(true)">Load</button>
        @if (loading()) {
          <button type="button" (click)="loading.set(false); loaded.set(true)">Finish</button>
          <p><span yetiSpinner role="status" aria-label="Loading"></span> Loading the latest posts</p>
        }
        <p data-testid="result" role="status">@if (loaded()) {Loaded 12 posts}</p>`,
    };
  },
  play: async ({ canvas, canvasElement }) => {
    const result = canvas.getByTestId('result');

    await expect(rings(canvasElement)).toHaveLength(0);
    await expect(result).toHaveRole('status');
    await expect(result.textContent.trim()).toBe('');

    await userEvent.click(canvas.getByRole('button', { name: 'Load' }));

    const ring = await canvas.findByRole('status', { name: 'Loading' });

    await expectAnnounced(ring);
    await expect(rings(canvasElement)).toStrictEqual([ring]);

    await userEvent.click(canvas.getByRole('button', { name: 'Finish' }));

    await waitFor(async () => {
      await expect(rings(canvasElement)).toHaveLength(0);
    });
    await expect(canvas.getByTestId('result')).toBe(result);
    await expect(result).toHaveTextContent('Loaded 12 posts');
  },
};

/**
 * A ring that only decorates the text of a consumer's status paragraph is
 * hidden from the tree (usage rule 4).
 */
export const Decorative: Story = {
  render: () => ({
    template:
      '<p data-testid="status" role="status"><span data-testid="ring" yetiSpinner aria-hidden="true"></span> Loading</p>',
  }),
  play: async ({ canvas }) => {
    const ring = canvas.getByTestId('ring');
    const status = canvas.getByTestId('status');

    await expectAnnounced(ring);
    await expect(ring).toHaveAttribute('class', 'spinner');
    await expect(ring).not.toHaveAttribute('aria-label');
    await expect(canvas.getAllByRole('status')).toStrictEqual([status]);
    await expect(status).toHaveTextContent('Loading');
  },
};

/**
 * A spinner as a `@defer` block's `@loading` content: shown while the block
 * loads, gone after.
 */
export const DeferPlaceholder: Story = {
  render: () => ({
    template: `
      @defer (on interaction) {
        <p data-testid="comments">Twelve comments.</p>
      } @placeholder {
        <button type="button">Show the comments</button>
      } @loading (minimum 500ms) {
        <p><span yetiSpinner role="status" aria-label="Loading comments"></span> Loading comments</p>
      }`,
  }),
  play: async ({ canvas, canvasElement }) => {
    await expect(rings(canvasElement)).toHaveLength(0);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Show the comments' }),
    );

    const ring = await canvas.findByRole('status', {
      name: 'Loading comments',
    });

    await expectAnnounced(ring);
    await expect(await canvas.findByTestId('comments')).toBeVisible();
    await expect(rings(canvasElement)).toHaveLength(0);
  },
};
