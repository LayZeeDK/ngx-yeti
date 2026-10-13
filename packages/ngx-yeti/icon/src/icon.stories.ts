import { signal, type WritableSignal } from '@angular/core';
import {
  assertWithin,
  composite,
  contrastRatio,
  elementChildren,
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
import type { YetiAlign, YetiGap } from 'ngx-yeti';
import { YetiButton } from 'ngx-yeti/button';
import { YetiCluster } from 'ngx-yeti/cluster';
import { expect, waitFor, within } from 'storybook/test';
import manifest from 'yeti-css/manifest';
import { YetiIcon } from './icon';

function path(d: string): string {
  return `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" />`;
}

/** A decorative SVG: hidden, so the text beside it is the name. */
function decorative(d: string): string {
  return `<svg aria-hidden="true" viewBox="0 0 24 24">${path(d)}</svg>`;
}

/** A meaningful SVG: an image with a name. */
function meaningful(name: string, d: string): string {
  return `<svg role="img" aria-label="${name}" viewBox="0 0 24 24">${path(d)}</svg>`;
}

const download = 'M12 3v12m0 0-4-4m4 4 4-4M4 21h16';
const tick = 'M5 12l5 5L20 7';
const cross = 'M6 6l12 12M18 6 6 18';
const warning = 'M12 3 2 21h20L12 3zm0 6v6m0 3v1';

const schemes = ['light', 'dark'] as const;
const message = 'Your session ends in five minutes.';

function svgOf(host: Element): SVGSVGElement {
  const svg = host.querySelector(':scope > svg');

  if (!(svg instanceof SVGSVGElement)) {
    throw new Error('The icon holds no SVG as a direct child');
  }

  return svg;
}

function labelOf(host: Element): HTMLElement {
  const [label] = elementChildren(host);

  if (label === undefined) {
    throw new Error('The icon holds no label element');
  }

  return label;
}

function fontSize(element: Element): number {
  return parseFloat(getComputedStyle(element).fontSize);
}

/**
 * Waits until the icon's file styles the host's SVG. The page's reset leaves
 * an SVG free to shrink; the icon's file does not.
 */
async function iconStyled(host: Element): Promise<void> {
  await itemStyled('icon', svgOf(host), 'flex-shrink', '0');
}

/** The SVG's box is one em of its host's computed `font-size`, both ways. */
function assertOneEm(host: Element): void {
  const { width, height } = svgOf(host).getBoundingClientRect();
  const em = fontSize(host);

  assertWithin(width, em, 0.5);
  assertWithin(height, em, 0.5);
}

function middle(element: Element): number {
  const { top, bottom } = element.getBoundingClientRect();

  return (top + bottom) / 2;
}

/** The name rule's decorative form (usage rule 3). */
async function expectDecorative(svg: SVGSVGElement): Promise<void> {
  await expect(svg).toHaveAttribute('aria-hidden', 'true');
  await expect(svg).not.toHaveAttribute('aria-label');
  await expect(svg).not.toHaveAttribute('role');
}

/** The name rule's meaningful form (usage rule 3). */
async function expectMeaningful(
  svg: SVGSVGElement,
  name: string,
): Promise<void> {
  await expect(svg).toHaveAttribute('role', 'img');
  await expect(svg).toHaveAccessibleName(name);
  await expect(svg).not.toHaveAttribute('aria-hidden');
}

/** No role, `tabindex`, or ARIA attribute on the host. */
async function expectNoPackageSemantics(host: HTMLElement): Promise<void> {
  await expect(
    host
      .getAttributeNames()
      .filter(
        (name) =>
          name === 'role' || name === 'tabindex' || name.startsWith('aria-'),
      ),
  ).toStrictEqual([]);
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
    for (const transition of node.getAnimations()) {
      transition.finish();
    }

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

interface IconState {
  readonly gap: YetiGap | undefined;
  readonly align: YetiAlign | undefined;
}

const unset: IconState = { gap: undefined, align: undefined };

/**
 * The signal the settings story binds, by story id, so its play function can
 * change it the way a Storybook control does.
 */
const iconStates = storyStates<WritableSignal<IconState>>('icon');

const meta: Meta<YetiIcon> = {
  id: 'icon',
  component: YetiIcon,
  decorators: [
    moduleMetadata({ imports: [YetiIcon, YetiButton, YetiCluster] }),
  ],
};
export default meta;

type Story = StoryObj<YetiIcon>;

/**
 * Yeti's example: a link and a button, each with a decorative SVG beside its
 * text, in a cluster (icon spec, section 8).
 */
export const Default: Story = {
  render: () => ({
    template: `
      <p yetiCluster gap="lg">
        <a yetiIcon href="#download">${decorative(download)}<span>Download</span></a>
        <button yetiIcon yetiButton type="button">${decorative(tick)}<span>Save</span></button>
      </p>`,
  }),
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Download' });
    const button = canvas.getByRole('button', { name: 'Save' });

    await expect(link).toHaveAttribute('class', 'icon');
    await expect([...button.classList].toSorted()).toStrictEqual([
      'button',
      'icon',
    ]);
    await expect(button).toHaveAttribute('data-ngx-yeti-item-button', '');

    for (const host of [link, button]) {
      await expect(host).toHaveAttribute('data-ngx-yeti-item-icon', '');
      await expect(host).not.toHaveAttribute('data-gap');
      await expect(host).not.toHaveAttribute('data-align');
      await expect(host).not.toHaveAttribute('align');
      await expectNoPackageSemantics(host);
      await expectDecorative(svgOf(host));
    }

    // The name is exactly the visible text (WCAG 2.5.3).
    await expect(link).toHaveAccessibleName('Download');
    await expect(button).toHaveAccessibleName('Save');

    await iconStyled(link);
    await itemStyled('button', button, 'justify-content', 'center');

    for (const host of [link, button]) {
      assertOneEm(host);
      assertWithin(middle(svgOf(host)), middle(labelOf(host)));
    }
  },
};

/**
 * Icons that carry meaning: an icon-only button named through its SVG, and a
 * warning sign before a message, in a light and a dark wrapper.
 */
export const Standalone: Story = {
  render: () => ({
    template: schemes
      .map(
        (scheme) => `
      <div data-scheme="${scheme}" style="color-scheme: ${scheme}; color: var(--yeti-color-text); background-color: var(--yeti-color-surface)">
        <button yetiIcon yetiButton type="button" emphasis="low">${meaningful('Close', cross)}</button>
        <p><span yetiIcon>${meaningful('Warning', warning)}<span>${message}</span></span></p>
      </div>`,
      )
      .join(''),
  }),
  play: async ({ canvasElement }) => {
    for (const scheme of schemes) {
      const wrapper = canvasElement.querySelector(`[data-scheme="${scheme}"]`);

      if (!(wrapper instanceof HTMLElement)) {
        throw new Error(`No ${scheme} wrapper`);
      }

      const button = within(wrapper).getByRole('button', { name: 'Close' });
      const image = within(wrapper).getByRole('img', { name: 'Warning' });
      const sign = image.parentElement;
      const paragraph = sign?.parentElement;

      if (
        !(image instanceof SVGSVGElement) ||
        !(sign instanceof HTMLElement) ||
        !(paragraph instanceof HTMLElement)
      ) {
        throw new Error('The warning is an SVG in a span in a paragraph');
      }

      await expect(button).toHaveAccessibleName('Close');
      await expectMeaningful(svgOf(button), 'Close');
      await expectMeaningful(image, 'Warning');
      await expectNoPackageSemantics(button);
      await expectNoPackageSemantics(sign);

      // The SVG adds no text, and it comes before the message.
      await expect(paragraph.textContent.trim()).toBe(message);
      await expect(sign.firstElementChild).toBe(image);

      await iconStyled(sign);
      await itemStyled('button', button, 'justify-content', 'center');

      // WCAG 2.5.8: an icon-only button gets Yeti's control size.
      const { width, height } = button.getBoundingClientRect();

      await expect(width).toBeGreaterThanOrEqual(24);
      await expect(height).toBeGreaterThanOrEqual(24);

      // WCAG 1.4.11: the glyph draws in `currentColor`.
      for (const svg of [svgOf(button), image]) {
        await expect(
          contrastRatio(getComputedStyle(svg).color, effectiveBackground(svg)),
        ).toBeGreaterThanOrEqual(3);
      }
    }
  },
};

/**
 * `gap` and `align` bound from the controls, and beside it an icon with
 * `align="baseline"` in its static form, whose label ends in a zero-size
 * probe on the baseline.
 */
export const Settings: Story = {
  argTypes: {
    // Yeti's vocabularies, which the contract spec proves equal to the
    // inputs' types, so a pin move that adds a value adds its option.
    gap: {
      control: 'select',
      options: manifestValues(manifest.components.icon, 'data-gap'),
    },
    align: {
      control: 'select',
      options: manifestValues(manifest.components.icon, 'data-align'),
    },
  },
  render: (args, { id }) => {
    const state = iconStates.track(
      id,
      signal<IconState>({ gap: args.gap, align: args.align }),
    );

    // Template props are named unlike the inputs, which they would collide
    // with once `component` is set.
    return {
      props: { state },
      template: `
        <p><span data-testid="bound" yetiIcon [gap]="state().gap" [align]="state().align">${decorative(tick)}<span>Saved</span></span></p>
        <p><span data-testid="static" yetiIcon align="baseline">${decorative(tick)}<span>Saved<span data-testid="probe" style="display: inline-block; inline-size: 0; block-size: 0"></span></span></span></p>`,
    };
  },
  play: async ({ canvas, id }) => {
    const state = iconStates.get(id);
    const bound = canvas.getByTestId('bound');
    const fixed = canvas.getByTestId('static');
    const cases: readonly {
      readonly attribute: string;
      readonly set: Partial<IconState>;
      readonly value: string;
    }[] = [
      { attribute: 'data-gap', set: { gap: 'lg' }, value: 'lg' },
      {
        attribute: 'data-align',
        set: { align: 'baseline' },
        value: 'baseline',
      },
    ];

    for (const { attribute, set, value } of cases) {
      state.set({ ...unset, ...set });
      await waitFor(async () => {
        await expect(bound).toHaveAttribute(attribute, value);
      });
      await expect(bound).not.toHaveAttribute('align');

      state.set(unset);
      await waitFor(async () => {
        await expect(bound).not.toHaveAttribute(attribute);
      });
    }

    await expect(fixed).toHaveAttribute('data-align', 'baseline');
    await expect(fixed).not.toHaveAttribute('align');
    await expectDecorative(svgOf(bound));
    await expectDecorative(svgOf(fixed));

    await iconStyled(fixed);
    await itemStyled(
      'icon',
      svgOf(fixed),
      'translate',
      (value) => value !== 'none',
    );

    // On the baseline the SVG's bottom edge sits one eighth of an em below
    // it, which is Yeti's nudge.
    assertOneEm(fixed);
    assertWithin(
      svgOf(fixed).getBoundingClientRect().bottom -
        canvas.getByTestId('probe').getBoundingClientRect().bottom,
      0.125 * fontSize(fixed),
    );
  },
};

/** Icons in a heading, a list item, and a paragraph, at three font sizes. */
export const InText: Story = {
  render: () => ({
    template: `
      <h2 style="font-size: 2rem"><span data-testid="heading" yetiIcon>${decorative(warning)}<span>Trail conditions</span></span></h2>
      <ul>
        <li style="font-size: 1.25rem"><span data-testid="item" yetiIcon>${decorative(tick)}<span>The ridge path is open</span></span></li>
      </ul>
      <p style="font-size: 0.875rem"><span data-testid="note" yetiIcon>${decorative(download)}<span>Download the map before you set off.</span></span></p>`,
  }),
  play: async ({ canvas }) => {
    const hosts = ['heading', 'item', 'note'].map((id) =>
      canvas.getByTestId(id),
    );
    const [first] = hosts;

    if (first === undefined) {
      throw new Error('The story holds three icons');
    }

    await iconStyled(first);

    for (const host of hosts) {
      await expect(host).toHaveAttribute('class', 'icon');
      await expectDecorative(svgOf(host));
      assertOneEm(host);

      for (const child of host.children) {
        const { marginTop, marginRight, marginBottom, marginLeft } =
          getComputedStyle(child);

        await expect([
          marginTop,
          marginRight,
          marginBottom,
          marginLeft,
        ]).toStrictEqual(['0px', '0px', '0px', '0px']);
      }
    }

    await expect(new Set(hosts.map((host) => fontSize(host))).size).toBe(3);
  },
};
