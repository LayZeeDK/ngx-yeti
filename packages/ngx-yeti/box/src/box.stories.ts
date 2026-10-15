import { Directive, signal } from '@angular/core';
import {
  contrastRatio,
  itemLinks,
  itemStyled,
  nextFrame,
} from '@ngx-yeti/testing';
import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import type { YetiGap, YetiPaint } from 'ngx-yeti';
import { YetiButton } from 'ngx-yeti/button';
import { YetiCard } from 'ngx-yeti/card';
import { YetiCenter } from 'ngx-yeti/center';
import { YetiStack } from 'ngx-yeti/stack';
import { injectYetiItemStyles } from 'ngx-yeti/styles';
import { expect, userEvent, waitFor } from 'storybook/test';
import { YetiBox } from './box';
import { YetiBorder } from './box-border';
import { NgxYetiPaint } from './box-paint';
import { YetiText } from './box-text';

/** Paint values that carry words (box spec, usage rule 4). */
const textPaints: readonly YetiPaint[] = [
  'primary',
  'secondary',
  'success',
  'warning',
  'alert',
  'neutral',
  'white',
  'black',
  'grey',
  'grey-0',
  'grey-10',
  'grey-20',
  'grey-30',
  'grey-70',
  'grey-80',
  'grey-90',
  'grey-100',
];

/** The middle greys, on which no text colour reaches full contrast. */
const fillPaints: readonly YetiPaint[] = ['grey-40', 'grey-50', 'grey-60'];

/**
 * `yetiText` values that cleared 4.5:1 on the page surface in the light and
 * the dark scheme when measured with this file's formula; the others are in
 * the anti-pattern story (box spec, `box--text`).
 */
const readableTexts: readonly YetiPaint[] = [
  'primary',
  'secondary',
  'success',
  'warning',
  'alert',
  'neutral',
  'grey-60',
  'grey-70',
  'grey-80',
  'grey-90',
  'grey-100',
];

const unreadableTexts: readonly YetiPaint[] = [
  'white',
  'black',
  'grey',
  'grey-0',
  'grey-10',
  'grey-20',
  'grey-30',
  'grey-40',
  'grey-50',
];

const schemes = ['light', 'dark'] as const;

/** A wrapper on Yeti's page surface in one scheme, as `withColorScheme` draws it. */
function schemeWrapper(scheme: string, content: string): string {
  return `<div data-scheme="${scheme}" style="color-scheme: ${scheme}; color: var(--yeti-color-text); background-color: var(--yeti-color-surface)">${content}</div>`;
}

function wrappers(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('[data-scheme]')];
}

function byTestId(root: Element, id: string): HTMLElement {
  const element = root.querySelector(`[data-testid="${id}"]`);

  if (!(element instanceof HTMLElement)) {
    throw new Error(`No element ${id}`);
  }

  return element;
}

/** The public token a `yetiText` value's rule reads. */
function textToken(value: YetiPaint): string {
  return value.startsWith('grey') ? `--yeti-${value}` : `--yeti-color-${value}`;
}

/** The padding the box's file gives a box, read from a probe of its token. */
function paddingOf(probe: HTMLElement): string {
  return getComputedStyle(probe).paddingTop;
}

async function expectSamePadding(
  box: HTMLElement,
  probe: HTMLElement,
): Promise<void> {
  const actual = getComputedStyle(box);
  const expected = getComputedStyle(probe);

  await expect([
    actual.paddingTop,
    actual.paddingRight,
    actual.paddingBottom,
    actual.paddingLeft,
  ]).toStrictEqual([
    expected.paddingTop,
    expected.paddingRight,
    expected.paddingBottom,
    expected.paddingLeft,
  ]);
}

async function expectSameBorder(
  element: HTMLElement,
  probe: HTMLElement,
): Promise<void> {
  const actual = getComputedStyle(element);
  const expected = getComputedStyle(probe);

  await expect([
    actual.borderTopStyle,
    actual.borderTopWidth,
    actual.borderTopColor,
  ]).toStrictEqual([
    expected.borderTopStyle,
    expected.borderTopWidth,
    expected.borderTopColor,
  ]);
}

/** The exact WCAG ratio of an element's words on a painted background. */
async function expectReadableOn(
  text: HTMLElement,
  painted: HTMLElement,
): Promise<void> {
  await expect(
    contrastRatio(
      getComputedStyle(text).color,
      getComputedStyle(painted).backgroundColor,
    ),
  ).toBeGreaterThanOrEqual(4.5);
}

const meta: Meta<YetiBox> = {
  id: 'box',
  component: YetiBox,
  decorators: [
    moduleMetadata({ imports: [YetiBox, YetiBorder, NgxYetiPaint, YetiText] }),
  ],
};
export default meta;

type Story = StoryObj<YetiBox>;

const borderProbe =
  'border: var(--yeti-border-width) solid var(--yeti-color-border)';

/** Yeti's box example (box spec, section 8), beside probes of its tokens. */
export const Default: Story = {
  render: () => ({
    template: `
      <section data-testid="box" yetiBox gap="lg" surface="raised" yetiBorder>
        <h2>A box you can see</h2>
        <p>Prose inside a box keeps its rhythm; the box only adds room around it.</p>
      </section>
      <div data-testid="probe" style="padding: var(--yeti-space-lg); background-color: var(--yeti-color-surface-raised); ${borderProbe}"></div>`,
  }),
  play: async ({ canvas }) => {
    const box = canvas.getByTestId('box');
    const probe = canvas.getByTestId('probe');

    await expect(box).toHaveAttribute('class', 'box');
    await expect(box).toHaveAttribute('data-ngx-yeti-item-box', '');
    await expect(box).toHaveAttribute('data-gap', 'lg');
    await expect(box).toHaveAttribute('data-surface', 'raised');
    await expect(box).toHaveAttribute('data-border', '');
    await expect(box).not.toHaveAttribute('tabindex');
    await expect(box).not.toHaveAttribute('role');

    await itemStyled('box', box, 'padding-top', paddingOf(probe));
    await expectSamePadding(box, probe);
    await expect(getComputedStyle(box).backgroundColor).toBe(
      getComputedStyle(probe).backgroundColor,
    );
    await expectSameBorder(box, probe);
  },
};

/** Yeti's default padding, one axis over it, two axes, and a fluid pair. */
export const Gaps: Story = {
  render: () => ({
    props: { boundGap: signal<YetiGap | undefined>('lg') },
    template: `
      <div data-testid="unset" yetiBox><p>Yeti's default padding</p></div>
      <div data-testid="inline" yetiBox gapInline="xl"><p>Wide at the sides</p></div>
      <div data-testid="both" yetiBox gap="sm" gapBlock="lg"><p>Tall at the top and bottom</p></div>
      <div data-testid="fluid" yetiBox gap="sm-lg"><p>Padding that grows with the page</p></div>
      <div data-testid="bound" yetiBox [gap]="boundGap()"><p>A bound gap</p></div>
      <button type="button" (click)="boundGap.set(undefined)">Unset the gap</button>
      <div data-testid="md" style="padding: var(--yeti-space-md)"></div>
      <div data-testid="sm" style="padding: var(--yeti-space-sm)"></div>
      <div data-testid="lg" style="padding: var(--yeti-space-lg)"></div>
      <div data-testid="xl" style="padding: var(--yeti-space-xl)"></div>`,
  }),
  play: async ({ canvas }) => {
    const box = (id: string): HTMLElement => canvas.getByTestId(id);
    const length = (id: string): number =>
      parseFloat(getComputedStyle(box(id)).paddingTop);

    await expect(box('unset')).not.toHaveAttribute('data-gap');
    await itemStyled('box', box('unset'), 'padding-top', paddingOf(box('md')));
    await expectSamePadding(box('unset'), box('md'));

    const inline = getComputedStyle(box('inline'));

    await expect(box('inline')).toHaveAttribute('data-gap-inline', 'xl');
    await expect(box('inline')).not.toHaveAttribute('data-gap');
    await expect(inline.paddingInlineStart).toBe(
      getComputedStyle(box('xl')).paddingInlineStart,
    );
    await expect(inline.paddingBlockStart).toBe(
      getComputedStyle(box('md')).paddingBlockStart,
    );

    const both = getComputedStyle(box('both'));

    await expect(both.paddingInlineStart).toBe(
      getComputedStyle(box('sm')).paddingInlineStart,
    );
    await expect(both.paddingBlockStart).toBe(
      getComputedStyle(box('lg')).paddingBlockStart,
    );

    const fluid = parseFloat(getComputedStyle(box('fluid')).paddingTop);

    await expect(box('fluid')).toHaveAttribute('data-gap', 'sm-lg');
    await expect(fluid).toBeGreaterThanOrEqual(length('sm') - 0.5);
    await expect(fluid).toBeLessThanOrEqual(length('lg') + 0.5);

    await expect(box('bound')).toHaveAttribute('data-gap', 'lg');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Unset the gap' }),
    );
    await waitFor(async () => {
      await expect(box('bound')).not.toHaveAttribute('data-gap');
    });
  },
};

/** The three surfaces and none, each against its probe, in both schemes. */
export const Surfaces: Story = {
  render: () => ({
    template: schemes
      .map((scheme) =>
        schemeWrapper(
          scheme,
          `
          <div data-testid="base" yetiBox surface="base"><p>Base</p></div>
          <div data-testid="raised" yetiBox surface="raised"><p>Raised</p></div>
          <div data-testid="sunken" yetiBox surface="sunken"><p>Sunken</p></div>
          <div data-testid="none" yetiBox><p>No surface</p></div>
          <div data-testid="base-probe" style="background-color: var(--yeti-color-surface)"></div>
          <div data-testid="raised-probe" style="background-color: var(--yeti-color-surface-raised)"></div>
          <div data-testid="sunken-probe" style="background-color: var(--yeti-color-surface-sunken)"></div>
          <div data-testid="md" style="padding: var(--yeti-space-md)"></div>`,
        ),
      )
      .join(''),
  }),
  play: async ({ canvasElement }) => {
    for (const wrapper of wrappers(canvasElement)) {
      await itemStyled(
        'box',
        byTestId(wrapper, 'none'),
        'padding-top',
        paddingOf(byTestId(wrapper, 'md')),
      );

      for (const surface of ['base', 'raised', 'sunken']) {
        const box = byTestId(wrapper, surface);

        await expect(box).toHaveAttribute('data-surface', surface);
        await expect(getComputedStyle(box).backgroundColor).toBe(
          getComputedStyle(byTestId(wrapper, `${surface}-probe`))
            .backgroundColor,
        );
      }

      await expect(byTestId(wrapper, 'none')).not.toHaveAttribute(
        'data-surface',
      );
      await expect(
        getComputedStyle(byTestId(wrapper, 'none')).backgroundColor,
      ).toBe('rgba(0, 0, 0, 0)');
    }
  },
};

/** The border marker on elements that are not boxes: no box file loads. */
export const BorderAnywhere: Story = {
  render: () => ({
    props: { bordered: signal(true) },
    template: `
      <figure data-testid="figure" yetiBorder>
        <figcaption>A bordered figure</figcaption>
      </figure>
      <ul data-testid="list" yetiBorder>
        <li>A bordered list</li>
      </ul>
      <p data-testid="bound" [yetiBorder]="bordered()">A border from state</p>
      <button type="button" (click)="bordered.set(false)">Remove the border</button>
      <div data-testid="probe" style="${borderProbe}"></div>`,
  }),
  play: async ({ canvas }) => {
    const probe = canvas.getByTestId('probe');

    for (const id of ['figure', 'list']) {
      const element = canvas.getByTestId(id);

      await expect(element).toHaveAttribute('data-border', '');
      await expect(element).not.toHaveClass('box');
      await expect(element).not.toHaveAttribute('data-ngx-yeti-item-box');
      await expectSameBorder(element, probe);
    }

    // A box from an earlier story leaves its link one frame after it goes.
    await nextFrame();
    await waitFor(async () => {
      await expect(itemLinks('box')).toHaveLength(0);
    });

    const bound = canvas.getByTestId('bound');

    await expect(bound).toHaveAttribute('data-border', '');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove the border' }),
    );
    await waitFor(async () => {
      await expect(bound).not.toHaveAttribute('data-border');
    });
  },
};

/** The WCAG ratio of an element's focus ring against a background. */
async function expectRingOn(
  ringed: HTMLElement,
  background: HTMLElement,
): Promise<void> {
  await expect(getComputedStyle(ringed).outlineStyle).not.toBe('none');
  await expect(
    contrastRatio(
      getComputedStyle(ringed).outlineColor,
      getComputedStyle(background).backgroundColor,
    ),
  ).toBeGreaterThanOrEqual(3);
}

/** The ring's reach, 2px wide at a 2px offset, so it lies on the band. */
const ringRoom = 'padding: 4px';

/** Loads Yeti's alert file, which no package directive loads, on Yeti's own alert markup. */
@Directive({
  selector: '[yetiStoryAlertStyles]',
  host: { 'data-ngx-yeti-item-alert': '' },
})
class YetiStoryAlertStyles {
  constructor() {
    injectYetiItemStyles('alert');
  }
}

/** Yeti's alert at one emphasis in a band, holding only its labelled close button. */
function alertBand(emphasis: 'low' | 'high'): string {
  return `<div data-testid="${emphasis}-alert-band" yetiPaint="primary" style="${ringRoom}">
    <div data-testid="${emphasis}-alert" class="alert" data-emphasis="${emphasis}" yetiStoryAlertStyles><button type="button" data-close aria-label="Dismiss the ${emphasis}-emphasis alert"></button></div>
  </div>`;
}

/**
 * Every text-bearing paint as a band with words, and the middle greys as
 * fills without text (usage rule 4), in both schemes (ledger A11Y-21).
 * Focus rings in bands, on a card inside a band, on a toggle label in a
 * band, and in a low- and a high-emphasis alert in a band read at least 3:1
 * (ledger A11Y-35).
 */
export const Paint: Story = {
  decorators: [
    moduleMetadata({ imports: [YetiButton, YetiCard, YetiStoryAlertStyles] }),
  ],
  render: () => ({
    template: schemes
      .map((scheme) =>
        schemeWrapper(
          scheme,
          `<div yetiBox>
            ${textPaints
              .map(
                (paint) =>
                  `<p data-band="${paint}" yetiPaint="${paint}">Words on ${paint}</p>`,
              )
              .join('')}
            <p data-testid="link-band" yetiPaint="primary">News: dark mode. <a href="#paint">Read the changelog</a>.</p>
            <div data-testid="button-band" yetiPaint="primary" style="${ringRoom}"><button type="button" yetiText="primary">Dismiss the news</button></div>
            ${[...textPaints, ...fillPaints]
              .map(
                (paint) =>
                  `<div data-ring="${paint}" yetiPaint="${paint}" style="${ringRoom}"><button type="button" aria-label="Focus on ${paint}" style="inline-size: 2rem; block-size: 2rem"></button></div>`,
              )
              .join('')}
            <div data-testid="card-band" yetiPaint="primary" style="${ringRoom}">
              <article data-testid="card" yetiCard><p><a href="#card">Read the card</a></p></article>
            </div>
            <div data-testid="toggle-band" yetiPaint="primary" style="${ringRoom}">
              <label data-testid="toggle" yetiButton><input type="checkbox" name="bold" /> Bold</label>
            </div>
            ${alertBand('low')}
            ${alertBand('high')}
            ${fillPaints
              .map(
                (paint) =>
                  `<div data-fill="${paint}" yetiPaint="${paint}" style="block-size: 2rem"></div>`,
              )
              .join('')}
          </div>`,
        ),
      )
      .join(''),
  }),
  play: async ({ canvasElement }) => {
    for (const wrapper of wrappers(canvasElement)) {
      const bands = [...wrapper.querySelectorAll<HTMLElement>('[data-band]')];

      await expect(bands.map((band) => band.dataset['band'])).toStrictEqual(
        textPaints,
      );

      for (const band of bands) {
        await expect(band).toHaveAttribute(
          'data-paint',
          band.dataset['band'] ?? '',
        );
        await expectReadableOn(band, band);
      }

      for (const fill of wrapper.querySelectorAll<HTMLElement>('[data-fill]')) {
        await expect(fill).toHaveAttribute(
          'data-paint',
          fill.dataset['fill'] ?? '',
        );
        await expect(fill.textContent.trim()).toBe('');
      }

      const linkBand = byTestId(wrapper, 'link-band');
      const link = linkBand.querySelector('a');

      if (link === null) {
        throw new Error('No link in the band');
      }

      await expect(getComputedStyle(link).color).toBe(
        getComputedStyle(linkBand).color,
      );
      await expectReadableOn(link, linkBand);

      // A button in the band draws a focus ring, and the ring reads against
      // the band (WCAG 1.4.11, ledger A11Y-35). Its text is the band's own
      // colour, so a ring in currentColor would not read here.
      const buttonBand = byTestId(wrapper, 'button-band');
      const button = buttonBand.querySelector('button');

      if (button === null) {
        throw new Error('No button in the band');
      }

      link.focus();
      await userEvent.tab();

      await expect(button).toHaveFocus();
      await expect(button.matches(':focus-visible')).toBe(true);
      await expect(
        parseFloat(getComputedStyle(button).outlineWidth),
      ).toBeGreaterThan(0);
      await expectRingOn(button, buttonBand);

      const rings = [...wrapper.querySelectorAll<HTMLElement>('[data-ring]')];

      await expect(rings.map((ring) => ring.dataset['ring'])).toStrictEqual([
        ...textPaints,
        ...fillPaints,
      ]);

      for (const ring of rings) {
        const control = ring.querySelector('button');

        if (control === null) {
          throw new Error('No button in the ring band');
        }

        await userEvent.tab();

        await expect(control).toHaveFocus();
        await expect(control.matches(':focus-visible')).toBe(true);
        await expectRingOn(control, ring);
      }

      // A card repaints inside the band, so a ring inside it reads against
      // the card's fill, not the band's.
      const card = byTestId(wrapper, 'card');
      const cardLink = card.querySelector('a');

      if (cardLink === null) {
        throw new Error('No link in the card');
      }

      await expect(byTestId(wrapper, 'card-band')).toHaveAttribute(
        'data-paint',
        'primary',
      );
      await itemStyled('card', card, 'display', 'flex');
      await userEvent.tab();

      await expect(cardLink).toHaveFocus();
      await expect(cardLink.matches(':focus-visible')).toBe(true);
      await expectRingOn(cardLink, card);

      // A toggle label draws the ring of its hidden input on itself.
      const toggleBand = byTestId(wrapper, 'toggle-band');
      const toggle = byTestId(wrapper, 'toggle');
      const input = toggle.querySelector('input');

      if (input === null) {
        throw new Error('No input in the toggle');
      }

      await expect(toggleBand).toHaveAttribute('data-paint', 'primary');
      await itemStyled('button', toggle, 'position', 'relative');
      await userEvent.tab();

      await expect(input).toHaveFocus();
      await expect(input.matches(':focus-visible')).toBe(true);
      await expectRingOn(toggle, toggleBand);

      // A low-emphasis alert paints no fill, so a ring inside it reads
      // against the band.
      const lowAlertBand = byTestId(wrapper, 'low-alert-band');
      const lowAlert = byTestId(wrapper, 'low-alert');
      const lowClose = lowAlert.querySelector('button');

      if (lowClose === null) {
        throw new Error('No close button in the low-emphasis alert');
      }

      await expect(lowAlertBand).toHaveAttribute('data-paint', 'primary');
      await itemStyled('alert', lowAlert, 'display', 'flex');
      await expect(getComputedStyle(lowAlert).backgroundColor).toBe(
        'rgba(0, 0, 0, 0)',
      );
      await userEvent.tab();

      await expect(lowClose).toHaveFocus();
      await expect(lowClose.matches(':focus-visible')).toBe(true);
      await expectRingOn(lowClose, lowAlertBand);

      // A high-emphasis alert fills with its variant, so a ring inside it
      // reads against that fill.
      const highAlert = byTestId(wrapper, 'high-alert');
      const highClose = highAlert.querySelector('button');

      if (highClose === null) {
        throw new Error('No close button in the high-emphasis alert');
      }

      await expect(byTestId(wrapper, 'high-alert-band')).toHaveAttribute(
        'data-paint',
        'primary',
      );
      await userEvent.tab();

      await expect(highClose).toHaveFocus();
      await expect(highClose.matches(':focus-visible')).toBe(true);
      await expectRingOn(highClose, highAlert);
    }
  },
};

/**
 * The `yetiText` values that read on the page surface in both schemes, and
 * one inside a painted band replacing its automatic colour.
 */
export const Text: Story = {
  render: () => ({
    template: schemes
      .map((scheme) =>
        schemeWrapper(
          scheme,
          `<div yetiBox>
            ${readableTexts
              .map(
                (text) =>
                  `<p data-text-value="${text}" yetiText="${text}">Words in ${text}</p>
                   <div data-probe="${text}" style="color: var(${textToken(text)})"></div>`,
              )
              .join('')}
            <p data-testid="override" yetiPaint="primary" yetiText="grey-0">Words in grey-0 on primary</p>
            <div data-testid="override-probe" style="color: var(${textToken('grey-0')})"></div>
          </div>`,
        ),
      )
      .join(''),
  }),
  play: async ({ canvasElement }) => {
    for (const wrapper of wrappers(canvasElement)) {
      const page = getComputedStyle(wrapper).backgroundColor;

      for (const text of wrapper.querySelectorAll<HTMLElement>(
        '[data-text-value]',
      )) {
        const value = text.dataset['textValue'] ?? '';
        const probe = wrapper.querySelector<HTMLElement>(
          `[data-probe="${value}"]`,
        );

        if (probe === null) {
          throw new Error(`No probe for ${value}`);
        }

        await expect(text).toHaveAttribute('data-text', value);
        await expect(getComputedStyle(text).color).toBe(
          getComputedStyle(probe).color,
        );
        await expect(
          contrastRatio(getComputedStyle(text).color, page),
        ).toBeGreaterThanOrEqual(4.5);
      }

      const override = byTestId(wrapper, 'override');

      await expect(override).toHaveAttribute('data-paint', 'primary');
      await expect(override).toHaveAttribute('data-text', 'grey-0');
      await expect(getComputedStyle(override).color).toBe(
        getComputedStyle(byTestId(wrapper, 'override-probe')).color,
      );
      await expectReadableOn(override, override);
    }
  },
};

/**
 * The box beside the center on one element, and Yeti's docs panel: a raised
 * bordered box holding a stack.
 */
export const Composed: Story = {
  decorators: [moduleMetadata({ imports: [YetiCenter, YetiStack] })],
  render: () => ({
    template: `
      <div data-testid="column" yetiCenter yetiBox gap="lg">
        <p>A padded column.</p>
      </div>
      <section data-testid="panel" yetiBox surface="raised" yetiBorder aria-labelledby="plan-title">
        <div data-testid="stack" yetiStack gap="sm">
          <h3 id="plan-title">Pro plan</h3>
          <p>Everything in Basic, plus priority support.</p>
        </div>
      </section>
      <div data-testid="lg" style="padding: var(--yeti-space-lg)"></div>
      <div data-testid="xl-width" style="max-inline-size: var(--yeti-width-xl)"></div>`,
  }),
  play: async ({ canvas }) => {
    const column = canvas.getByTestId('column');
    const lg = canvas.getByTestId('lg');

    await expect([...column.classList].toSorted()).toStrictEqual([
      'box',
      'center',
    ]);
    await expect(column).toHaveAttribute('data-gap', 'lg');

    const { maxInlineSize } = getComputedStyle(canvas.getByTestId('xl-width'));

    await itemStyled('box', column, 'padding-top', paddingOf(lg));
    await itemStyled('center', column, 'max-inline-size', maxInlineSize);
    await expect(getComputedStyle(column).maxInlineSize).toBe(maxInlineSize);
    await expect(getComputedStyle(column).paddingBlockStart).toBe(
      getComputedStyle(lg).paddingBlockStart,
    );

    const panel = canvas.getByTestId('panel');

    await expect(panel).toHaveClass('box');
    await expect(panel).toHaveAttribute('data-surface', 'raised');
    await expect(panel).toHaveAttribute('data-border', '');
    await expect(canvas.getByTestId('stack')).toHaveClass('stack');
    await expect(canvas.getByRole('region', { name: 'Pro plan' })).toBe(panel);
  },
};

/**
 * Anti-pattern (usage rules 4 and 5, ledger A11Y-21), what not to write:
 * words on the middle greys, and `yetiText` values that do not reach 4.5:1
 * on the page surface in one scheme or both. Only axe's `color-contrast`
 * rule is off, the rule this story demonstrates.
 */
export const AntiPatternLowContrast: Story = {
  parameters: {
    a11y: { options: { rules: { 'color-contrast': { enabled: false } } } },
  },
  render: () => ({
    template: schemes
      .map((scheme) =>
        schemeWrapper(
          scheme,
          `<div yetiBox>
            ${fillPaints
              .map(
                (paint) =>
                  `<p data-band="${paint}" yetiPaint="${paint}">Words on ${paint}</p>`,
              )
              .join('')}
            ${unreadableTexts
              .map(
                (text) =>
                  `<p data-text-value="${text}" yetiText="${text}">Words in ${text}</p>`,
              )
              .join('')}
          </div>`,
        ),
      )
      .join(''),
  }),
  play: async ({ canvasElement }) => {
    const ratios = new Map<string, number[]>();

    for (const wrapper of wrappers(canvasElement)) {
      const page = getComputedStyle(wrapper).backgroundColor;

      for (const text of wrapper.querySelectorAll<HTMLElement>(
        '[data-text-value]',
      )) {
        const value = text.dataset['textValue'] ?? '';

        await expect(text).toHaveAttribute('data-text', value);
        ratios.set(value, [
          ...(ratios.get(value) ?? []),
          contrastRatio(getComputedStyle(text).color, page),
        ]);
      }

      for (const band of wrapper.querySelectorAll<HTMLElement>('[data-band]')) {
        await expect(band).toHaveAttribute(
          'data-paint',
          band.dataset['band'] ?? '',
        );
      }
    }

    // Each value shown here fails 4.5:1 in at least one scheme.
    for (const value of unreadableTexts) {
      await expect(Math.min(...(ratios.get(value) ?? []))).toBeLessThan(4.5);
    }
  },
};
