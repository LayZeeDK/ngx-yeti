import { NgOptimizedImage } from '@angular/common';
import { signal, type WritableSignal } from '@angular/core';
import {
  composite,
  assertWithin,
  contrastRatio,
  elementChildren,
  itemStyled,
  manifestValues,
  parseColor,
  storyStates,
  type SrgbColor,
  usedLength,
} from '@ngx-yeti/testing';
import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import type { YetiAlign, YetiSelf } from 'ngx-yeti';
import { NgxYetiPaint } from 'ngx-yeti/box';
import { expect, waitFor } from 'storybook/test';
import manifest from 'yeti-css/manifest';
// Kept a URL in the static build too: NgOptimizedImage refuses `data:` URLs.
import trail from '../../.storybook/assets/trail.svg?no-inline';
import { withColorScheme } from '../../.storybook/decorators';
import { YetiLayer } from './layer';
import { YetiLayerChild } from './layer-child';

/** The values of one of the layer's markers, from Yeti's manifest. */
function markerValues(name: string): readonly string[] {
  return (
    manifest.components.layer.markers.find((marker) => marker.name === name)
      ?.values ?? []
  );
}

interface LayerState {
  readonly align: YetiAlign | undefined;
  readonly alignSelf: YetiAlign | undefined;
  readonly justifySelf: YetiSelf | undefined;
}

const unset: LayerState = {
  align: undefined,
  alignSelf: undefined,
  justifySelf: undefined,
};

/**
 * The inputs the settings story binds, by story id, so its play function can
 * change them the way a Storybook control does.
 */
const layerStates = storyStates<WritableSignal<LayerState>>('layer');

function byTestId(root: Element, id: string): HTMLElement {
  const element = root.querySelector(`[data-testid="${id}"]`);

  if (!(element instanceof HTMLElement)) {
    throw new Error(`No element ${id}`);
  }

  return element;
}

/**
 * The colour an element's text is painted on: its own background and its
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

/**
 * A11Y-10b: the caption's text against its translucent scrim composited over
 * pure black and over pure white, the two extremes any picture can show
 * through it, exact formula, unrounded, at least 4.5:1.
 */
async function expectCaptionReadable(caption: HTMLElement): Promise<void> {
  const { color, backgroundColor } = getComputedStyle(caption);

  await expect(parseColor(backgroundColor).alpha).toBeGreaterThan(0);

  for (const backdrop of ['#000', '#fff']) {
    await expect(
      contrastRatio(color, composite(backgroundColor, backdrop)),
    ).toBeGreaterThanOrEqual(4.5);
  }
}

/** Reading order is source order: nothing reorders the children. */
async function expectSourceOrder(layer: HTMLElement): Promise<void> {
  const items = elementChildren(layer);

  await expect(items.map((child) => getComputedStyle(child).order)).toEqual(
    items.map(() => '0'),
  );
  await expect(
    layer.querySelectorAll('[aria-owns], [aria-flowto]'),
  ).toHaveLength(0);
}

/** The package adds no role and no tab stop to a layer or its children. */
async function expectNoRoleOrTabStop(layer: HTMLElement): Promise<void> {
  await expect(
    [layer, ...layer.querySelectorAll('*')].filter((element) =>
      element.matches('[role], [tabindex]'),
    ),
  ).toStrictEqual([]);
}

// `priority`: the picture is the story's largest paint, which
// NgOptimizedImage asks to load first.
const captioned = `
  <div data-testid="frame" style="inline-size: 600px; max-inline-size: 100%">
    <figure data-testid="layer" yetiLayer>
      <img data-testid="picture" [ngSrc]="trail" width="1600" height="900" priority alt="A mountain trail at dawn" />
      <figcaption data-testid="caption" yetiLayerChild alignSelf="end">Dawn on the ridge trail</figcaption>
    </figure>
  </div>`;

/** Yeti's docs' second example: a badge in the corner of a thumbnail. */
function badged(testId: string): string {
  return `
    <div data-testid="${testId}-frame" style="inline-size: 400px; max-inline-size: 100%">
      <div data-testid="${testId}" yetiLayer>
        <img [ngSrc]="trail" width="1600" height="900" priority alt="" />
        <span data-testid="${testId}-badge" yetiLayerChild alignSelf="start" justifySelf="end" yetiPaint="primary">New</span>
      </div>
    </div>`;
}

const meta: Meta<YetiLayer> = {
  id: 'layer',
  component: YetiLayer,
  decorators: [
    moduleMetadata({
      imports: [YetiLayer, YetiLayerChild, NgxYetiPaint, NgOptimizedImage],
    }),
  ],
};
export default meta;

type Story = StoryObj<YetiLayer>;

/**
 * Yeti's example (layer spec, section 8): a picture with its caption at the
 * bottom, and A11Y-10b's contrast assertions.
 */
export const Default: Story = {
  render: () => ({ props: { trail }, template: captioned }),
  play: async ({ canvasElement }) => {
    const layer = byTestId(canvasElement, 'layer');
    const picture = byTestId(canvasElement, 'picture');
    const caption = byTestId(canvasElement, 'caption');

    await expect(layer).toHaveAttribute('class', 'layer');
    await expect(layer).toHaveAttribute('data-ngx-yeti-item-layer', '');
    await expect(layer).not.toHaveAttribute('data-align');
    await expect(layer).not.toHaveAttribute('align');
    await expect(caption).toHaveAttribute('data-align-self', 'end');
    await expect(caption).not.toHaveAttribute('data-justify-self');
    await expectNoRoleOrTabStop(layer);

    await itemStyled('layer', layer, 'display', 'grid');

    const box = layer.getBoundingClientRect();
    const image = picture.getBoundingClientRect();
    const text = caption.getBoundingClientRect();

    assertWithin(image.top, box.top);
    assertWithin(image.left, box.left);
    assertWithin(text.left, box.left);
    assertWithin(text.bottom, box.bottom);
    // As wide as the box, unless Yeti's prose measure caps the caption first.
    assertWithin(
      text.width,
      Math.min(box.width, usedLength(caption, 'var(--yeti-measure)')),
    );
    assertWithin(box.height, Math.max(image.height, text.height));

    await expectSourceOrder(layer);
    await expectCaptionReadable(caption);
  },
};

/** The captioned picture on Yeti's dark page surface. */
export const DarkScheme: Story = {
  decorators: [withColorScheme('dark')],
  render: () => ({ props: { trail }, template: captioned }),
  play: async ({ canvasElement }) => {
    const layer = byTestId(canvasElement, 'layer');

    await expect(getComputedStyle(layer).colorScheme).toBe('dark');
    await itemStyled('layer', layer, 'display', 'grid');
    await expectCaptionReadable(byTestId(canvasElement, 'caption'));
  },
};

/**
 * A badge in the top-right corner of a thumbnail, on a solid `yetiPaint`
 * panel, in the light scheme and on Yeti's dark page surface.
 */
export const Badge: Story = {
  render: () => ({
    props: { trail },
    template: `${badged('light')}
      <div style="color-scheme: dark; color: var(--yeti-color-text); background-color: var(--yeti-color-surface)">${badged('dark')}</div>`,
  }),
  play: async ({ canvasElement }) => {
    for (const id of ['light', 'dark']) {
      const layer = byTestId(canvasElement, id);
      const badge = byTestId(canvasElement, `${id}-badge`);

      await expect(badge).toHaveAttribute('data-align-self', 'start');
      await expect(badge).toHaveAttribute('data-justify-self', 'end');
      await expect(badge).toHaveAttribute('data-paint', 'primary');
      await itemStyled('layer', layer, 'display', 'grid');

      const box = layer.getBoundingClientRect();
      const corner = badge.getBoundingClientRect();

      assertWithin(corner.top, box.top);
      assertWithin(corner.right, box.right);
      await expect(corner.width).toBeLessThan(box.width / 2);
      await expect(
        contrastRatio(
          getComputedStyle(badge).color,
          effectiveBackground(badge),
        ),
      ).toBeGreaterThanOrEqual(4.5);
    }
  },
};

/**
 * `align` on the layer and `alignSelf` and `justifySelf` on one child, set
 * and reset as a Storybook control would, with a tall and a short child.
 */
export const Settings: StoryObj<
  YetiLayer & Pick<YetiLayerChild, 'alignSelf' | 'justifySelf'>
> = {
  argTypes: {
    // Yeti's vocabularies, which the contract spec proves equal to the
    // inputs' types, so a pin move that adds a value adds its option.
    align: {
      control: 'select',
      options: manifestValues(manifest.components.layer, 'data-align'),
    },
    alignSelf: {
      control: 'select',
      options: markerValues('data-align-self'),
    },
    justifySelf: {
      control: 'select',
      options: markerValues('data-justify-self'),
    },
  },
  render: (args, { id }) => {
    const state = signal<LayerState>({
      align: args.align,
      alignSelf: args.alignSelf,
      justifySelf: args.justifySelf,
    });
    layerStates.track(id, state);

    // Template props are named unlike the inputs, which they would collide
    // with once `component` is set.
    return {
      props: { state },
      template: `
        <div data-testid="frame" style="inline-size: 300px; max-inline-size: 100%">
          <div data-testid="layer" yetiLayer [align]="state().align">
            <div data-testid="tall" style="block-size: 200px">Tall</div>
            <div data-testid="short" style="block-size: 40px">Short</div>
            <span data-testid="placed" yetiLayerChild [alignSelf]="state().alignSelf" [justifySelf]="state().justifySelf">Placed</span>
          </div>
        </div>`,
    };
  },
  play: async ({ canvasElement, id }) => {
    const state = layerStates.get(id);
    const layer = byTestId(canvasElement, 'layer');
    const tall = byTestId(canvasElement, 'tall');
    const short = byTestId(canvasElement, 'short');
    const placed = byTestId(canvasElement, 'placed');
    const cases: readonly {
      readonly host: HTMLElement;
      readonly attribute: string;
      readonly set: Partial<LayerState>;
      readonly value: string;
    }[] = [
      {
        host: layer,
        attribute: 'data-align',
        set: { align: 'end' },
        value: 'end',
      },
      {
        host: placed,
        attribute: 'data-align-self',
        set: { alignSelf: 'start' },
        value: 'start',
      },
      {
        host: placed,
        attribute: 'data-justify-self',
        set: { justifySelf: 'end' },
        value: 'end',
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

    await itemStyled('layer', layer, 'display', 'grid');

    // `end`: the short child sits on the box's bottom, under the tall one's
    // top.
    state.set({ ...unset, align: 'end' });
    await waitFor(() => {
      assertWithin(
        short.getBoundingClientRect().bottom,
        layer.getBoundingClientRect().bottom,
      );
    });
    assertWithin(
      tall.getBoundingClientRect().top,
      layer.getBoundingClientRect().top,
    );
    assertWithin(layer.getBoundingClientRect().height, 200);

    // `baseline` behaves as `start`.
    state.set({ ...unset, align: 'baseline' });
    await waitFor(() => {
      assertWithin(
        short.getBoundingClientRect().top,
        layer.getBoundingClientRect().top,
      );
    });
    await expect(short.getBoundingClientRect().height).toBeLessThan(200);

    // The placed child's own markers win for it alone.
    state.set({ align: 'end', alignSelf: 'start', justifySelf: 'end' });
    await waitFor(async () => {
      const box = layer.getBoundingClientRect();
      const corner = placed.getBoundingClientRect();

      assertWithin(corner.top, box.top);
      assertWithin(corner.right, box.right);
      await expect(corner.width).toBeLessThan(box.width / 2);
    });
    assertWithin(
      short.getBoundingClientRect().bottom,
      layer.getBoundingClientRect().bottom,
    );
    assertWithin(
      short.getBoundingClientRect().width,
      layer.getBoundingClientRect().width,
    );
  },
};
