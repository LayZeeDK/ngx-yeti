import { NgOptimizedImage } from '@angular/common';
import { signal, type WritableSignal } from '@angular/core';
import {
  composite,
  assertWithin,
  contrastRatio,
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
import type { YetiGap } from 'ngx-yeti';
import { NgxYetiPaint, YetiBox } from 'ngx-yeti/box';
import { expect, userEvent, waitFor } from 'storybook/test';
import manifest from 'yeti-css/manifest';
// Kept a URL in the static build too: NgOptimizedImage refuses `data:` URLs.
import trail from '../../.storybook/assets/trail.svg?no-inline';
import { YetiOverlay } from './overlay';
import { YetiOverlayChild } from './overlay-child';

interface OverlayState {
  readonly gap: YetiGap | undefined;
  readonly fixed: boolean;
  readonly over: boolean;
  readonly fill: boolean;
}

const unset: OverlayState = {
  gap: undefined,
  fixed: false,
  over: false,
  fill: false,
};

/**
 * The inputs the settings story binds, by story id, so its play function can
 * change them the way a Storybook control does.
 */
const overlayStates = storyStates<WritableSignal<OverlayState>>('overlay');

function byTestId(root: Element, id: string): HTMLElement {
  const element = root.querySelector(`[data-testid="${id}"]`);

  if (!(element instanceof HTMLElement)) {
    throw new Error(`No element ${id}`);
  }

  return element;
}

/** A box's padding once its file has applied: the page's default is none. */
const padded = (value: string): boolean => value !== '0px';

function centre(rect: DOMRect): { readonly x: number; readonly y: number } {
  return { x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 };
}

function assertCentredOn(
  element: HTMLElement,
  target: { readonly x: number; readonly y: number },
): void {
  const { x, y } = centre(element.getBoundingClientRect());

  assertWithin(x, target.x);
  assertWithin(y, target.y);
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

/** Reading order is source order: nothing reorders the children. */
async function expectSourceOrder(overlay: HTMLElement): Promise<void> {
  const items = [...overlay.children];

  await expect(items.map((child) => getComputedStyle(child).order)).toEqual(
    items.map(() => '0'),
  );
  await expect(
    overlay.querySelectorAll('[aria-owns], [aria-flowto]'),
  ).toHaveLength(0);
}

/** A wrapper on Yeti's dark page surface, as `withColorScheme('dark')` draws. */
function dark(content: string): string {
  return `<div style="color-scheme: dark; color: var(--yeti-color-text); background-color: var(--yeti-color-surface)">${content}</div>`;
}

/**
 * Section 8's stamp in a box of fixed block size. `priority`: either copy's
 * picture can be the story's largest paint.
 */
function stamp(testId: string): string {
  return `
    <div data-testid="${testId}" yetiOverlay style="inline-size: 32rem; max-inline-size: 100%; block-size: 20rem">
      <img data-testid="${testId}-picture" [ngSrc]="trail" width="1600" height="900" priority alt="A mountain trail at dawn" />
      <p data-testid="${testId}-held" yetiBox yetiPaint="alert" yetiOverlayChild over>Sold out</p>
    </div>`;
}

/**
 * The held child is centred on its box, the picture starts at the box's top,
 * and the held child fits inside the box minus twice the gap.
 */
async function expectStamp(root: HTMLElement, testId: string): Promise<void> {
  const overlay = byTestId(root, testId);
  const held = byTestId(root, `${testId}-held`);
  const box = overlay.getBoundingClientRect();
  const gap = usedLength(overlay, 'var(--yeti-space-md)');
  const rect = held.getBoundingClientRect();

  assertCentredOn(held, centre(box));
  assertWithin(
    byTestId(root, `${testId}-picture`).getBoundingClientRect().top,
    box.top,
  );
  await expect(rect.width).toBeLessThanOrEqual(box.width - 2 * gap + 1);
  await expect(rect.height).toBeLessThanOrEqual(box.height - 2 * gap + 1);
  await expect(
    contrastRatio(getComputedStyle(held).color, effectiveBackground(held)),
  ).toBeGreaterThanOrEqual(4.5);
}

const meta: Meta<YetiOverlay> = {
  id: 'overlay',
  component: YetiOverlay,
  decorators: [
    moduleMetadata({
      imports: [
        YetiOverlay,
        YetiOverlayChild,
        YetiBox,
        NgxYetiPaint,
        NgOptimizedImage,
      ],
    }),
  ],
};
export default meta;

type Story = StoryObj<YetiOverlay>;

/**
 * Yeti's "sold out" stamp (overlay spec, section 8), in the light scheme and
 * on Yeti's dark page surface, with its contrast assertions.
 */
export const Default: Story = {
  render: () => ({
    props: { trail },
    template: stamp('overlay') + dark(stamp('dark')),
  }),
  play: async ({ canvasElement }) => {
    const overlay = byTestId(canvasElement, 'overlay');
    const held = byTestId(canvasElement, 'overlay-held');

    await expect(overlay).toHaveClass('overlay');
    await expect(overlay).toHaveAttribute('data-ngx-yeti-item-overlay', '');
    await expect(overlay).not.toHaveAttribute('data-gap');
    await expect(overlay).not.toHaveAttribute('data-fixed');
    await expect([...overlay.querySelectorAll('[data-over]')]).toStrictEqual([
      held,
    ]);
    await expect(held).toHaveAttribute('data-over', '');
    await expect(held).not.toHaveAttribute('data-fill');
    await expect(held).not.toHaveAttribute('data-ngx-yeti-item-overlay');
    await expect(
      [overlay, ...overlay.querySelectorAll('*')].filter((element) =>
        element.matches('[role], [tabindex], [inert], [aria-hidden]'),
      ),
    ).toStrictEqual([]);

    await itemStyled('overlay', overlay, 'position', 'relative');
    await expectStamp(canvasElement, 'overlay');
    await expectSourceOrder(overlay);

    await expect(
      getComputedStyle(byTestId(canvasElement, 'dark')).colorScheme,
    ).toBe('dark');
    await expectStamp(canvasElement, 'dark');
  },
};

/** `gap`, `fixed`, `over`, and `fill`, set and reset as a control would. */
export const Settings: StoryObj<
  YetiOverlay & Pick<YetiOverlayChild, 'over' | 'fill'>
> = {
  args: { over: true },
  argTypes: {
    // Yeti's vocabulary, which the contract spec proves equal to the input's
    // type, so a pin move that adds a value adds its option.
    gap: {
      control: 'select',
      options: manifestValues(manifest.components.overlay, 'data-gap'),
    },
    fixed: { control: 'boolean' },
    over: { control: 'boolean' },
    fill: { control: 'boolean' },
  },
  render: (args, { id }) => {
    const state = signal<OverlayState>({
      gap: args.gap,
      fixed: args.fixed === true,
      over: args.over === true,
      fill: args.fill === true,
    });
    overlayStates.track(id, state);

    // Template props are named unlike the inputs, which they would collide
    // with once `component` is set.
    return {
      props: { state },
      template: `
        <div data-testid="overlay" yetiOverlay [gap]="state().gap" [fixed]="state().fixed" style="inline-size: 24rem; max-inline-size: 100%; block-size: 16rem">
          <p data-testid="under">The content underneath, in normal flow.</p>
          <p data-testid="held" yetiBox yetiPaint="primary" yetiOverlayChild [over]="state().over" [fill]="state().fill">The held child</p>
        </div>`,
    };
  },
  play: async ({ canvasElement, id }) => {
    const state = overlayStates.get(id);
    const overlay = byTestId(canvasElement, 'overlay');
    const under = byTestId(canvasElement, 'under');
    const held = byTestId(canvasElement, 'held');
    const cases: readonly {
      readonly host: HTMLElement;
      readonly attribute: string;
      readonly set: Partial<OverlayState>;
      readonly value: string;
    }[] = [
      { host: overlay, attribute: 'data-gap', set: { gap: 'lg' }, value: 'lg' },
      {
        host: overlay,
        attribute: 'data-fixed',
        set: { fixed: true },
        value: '',
      },
      { host: held, attribute: 'data-over', set: { over: true }, value: '' },
      { host: held, attribute: 'data-fill', set: { fill: true }, value: '' },
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

    await itemStyled('overlay', overlay, 'position', 'relative');
    // The held child's padding comes from box's item file, which can apply
    // after the overlay's; the in-flow box is measured with it.
    await itemStyled('box', held, 'padding-top', padded);

    // `over` off: the held child is back in the flow, below the content.
    state.set(unset);
    await waitFor(async () => {
      await expect(getComputedStyle(held).position).toBe('static');
    });
    await expect(held.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      under.getBoundingClientRect().bottom,
    );

    const inFlow = held.getBoundingClientRect();

    // `fill` without `over` moves nothing.
    state.set({ ...unset, fill: true });
    await waitFor(async () => {
      await expect(held).toHaveAttribute('data-fill', '');
    });

    const filledInFlow = held.getBoundingClientRect();

    assertWithin(filledInFlow.top, inFlow.top);
    assertWithin(filledInFlow.left, inFlow.left);
    assertWithin(filledInFlow.width, inFlow.width);
    assertWithin(filledInFlow.height, inFlow.height);

    // `over` on: the held child leaves the flow and is centred on the box.
    state.set({ ...unset, over: true });
    await waitFor(() => {
      assertCentredOn(held, centre(overlay.getBoundingClientRect()));
    });
  },
};

/** The veil, its message, and the covered controls of one form. */
function veilForm(testId: string, savingExpression: string): string {
  return `
    <form data-testid="${testId}" yetiOverlay>
      <div data-testid="${testId}-covered" [attr.inert]="${savingExpression} ? '' : null">
        <label for="${testId}-email">Email</label>
        <input data-testid="${testId}-input" id="${testId}-email" type="email" />
      </div>
      @if (${savingExpression}) {
        <div data-testid="${testId}-veil" yetiOverlayChild over fill style="display: grid; place-items: center; background-color: var(--yeti-color-scrim)">
          <p data-testid="${testId}-message" role="status">Saving...</p>
        </div>
      }
    </form>`;
}

/**
 * The "Saving..." text against the translucent scrim composited over pure
 * black and over pure white, the two extremes behind the scrim.
 */
async function expectMessageReadable(
  veil: HTMLElement,
  message: HTMLElement,
): Promise<void> {
  const scrim = getComputedStyle(veil).backgroundColor;

  await expect(parseColor(scrim).alpha).toBeGreaterThan(0);

  for (const backdrop of ['#000', '#fff']) {
    await expect(
      contrastRatio(
        getComputedStyle(message).color,
        composite(scrim, backdrop),
      ),
    ).toBeGreaterThanOrEqual(4.5);
  }
}

/** The veil covers its box on every edge and centres its message. */
async function expectVeil(root: HTMLElement, testId: string): Promise<void> {
  const box = byTestId(root, testId).getBoundingClientRect();
  const veil = byTestId(root, `${testId}-veil`);
  const message = byTestId(root, `${testId}-message`);
  const rect = veil.getBoundingClientRect();

  assertWithin(rect.top, box.top);
  assertWithin(rect.right, box.right);
  assertWithin(rect.bottom, box.bottom);
  assertWithin(rect.left, box.left);
  assertCentredOn(message, centre(rect));
  await expectMessageReadable(veil, message);
}

/**
 * A loading veil over a form (overlay spec, section 8), with the covered
 * controls made `inert` while it shows, and a permanently saving copy on
 * Yeti's dark page surface. The veil centres its message with the
 * consumer's own grid.
 */
export const Veil: Story = {
  render: () => ({
    props: { saving: signal(false) },
    template: `
      <button data-testid="toggle" type="button" (click)="saving.set(!saving())">Toggle saving</button>
      ${veilForm('form', 'saving()')}
      <button type="button">After the form</button>
      ${dark(veilForm('dark', 'true'))}`,
  }),
  play: async ({ canvasElement }) => {
    const toggle = byTestId(canvasElement, 'toggle');
    const form = byTestId(canvasElement, 'form');
    const input = byTestId(canvasElement, 'form-input');

    await expect(form).not.toHaveAttribute('inert');
    await itemStyled('overlay', form, 'position', 'relative');

    await userEvent.click(toggle);
    await waitFor(async () => {
      await expect(byTestId(canvasElement, 'form-veil')).toBeInTheDocument();
    });
    await expect(byTestId(canvasElement, 'form-covered')).toHaveAttribute(
      'inert',
      '',
    );
    await expect(form).not.toHaveAttribute('inert');
    await expectVeil(canvasElement, 'form');

    // A covered control cannot take focus, from Tab or from script.
    toggle.focus();
    await userEvent.tab();
    await expect(document.activeElement).not.toBe(input);
    input.focus();
    await expect(document.activeElement).not.toBe(input);

    await userEvent.click(toggle);
    await waitFor(async () => {
      await expect(
        canvasElement.querySelector('[data-testid="form-veil"]'),
      ).toBeNull();
    });
    await expect(byTestId(canvasElement, 'form-covered')).not.toHaveAttribute(
      'inert',
    );

    toggle.focus();
    await userEvent.tab();
    await expect(input).toHaveFocus();

    await expect(byTestId(canvasElement, 'dark-covered')).toHaveAttribute(
      'inert',
      '',
    );
    await expect(
      getComputedStyle(byTestId(canvasElement, 'dark')).colorScheme,
    ).toBe('dark');
    await expectVeil(canvasElement, 'dark');
  },
};

/** A `fixed` overlay in a page taller than the viewport. */
export const Fixed: Story = {
  render: () => ({
    template: `
      <div data-testid="overlay" yetiOverlay fixed>
        <div style="block-size: 300vh">The page underneath, taller than the viewport.</div>
        <p data-testid="held" yetiBox yetiPaint="primary" yetiOverlayChild over>Offline: changes will sync later.</p>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const overlay = byTestId(canvasElement, 'overlay');
    const held = byTestId(canvasElement, 'held');
    const viewport = (): { readonly x: number; readonly y: number } => ({
      x: document.documentElement.clientWidth / 2,
      y: document.documentElement.clientHeight / 2,
    });

    await expect(overlay).toHaveAttribute('data-fixed', '');
    await itemStyled('overlay', overlay, 'position', 'relative');
    await waitFor(async () => {
      await expect(getComputedStyle(held).position).toBe('fixed');
    });
    assertCentredOn(held, viewport());

    window.scrollTo(0, document.documentElement.clientHeight);
    await waitFor(async () => {
      await expect(window.scrollY).toBeGreaterThan(0);
    });
    assertCentredOn(held, viewport());
    window.scrollTo(0, 0);
  },
};

/**
 * A held child with more text than the box holds, written as a scroll
 * region, as usage rule 6 asks.
 */
export const Scrolls: Story = {
  render: () => ({
    template: `
      <div data-testid="overlay" yetiOverlay style="inline-size: 24rem; max-inline-size: 100%; block-size: 12rem">
        <p>The content underneath.</p>
        <div data-testid="held" yetiBox yetiPaint="primary" yetiOverlayChild over tabindex="0" role="region" aria-label="Trail conditions">
          @for (day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']; track day) {
            <p>{{ day }}: the ridge trail is open, with mud after the second stile and ice in the shade.</p>
          }
        </div>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const overlay = byTestId(canvasElement, 'overlay');
    const held = byTestId(canvasElement, 'held');

    await itemStyled('overlay', overlay, 'position', 'relative');
    await waitFor(async () => {
      await expect(held.scrollHeight).toBeGreaterThan(held.clientHeight);
    });

    const box = overlay.getBoundingClientRect();
    const gap = usedLength(overlay, 'var(--yeti-space-md)');

    await expect(held.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      box.bottom - gap + 1,
    );

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    await userEvent.tab();
    await expect(held).toHaveFocus();
  },
};

/** The stamp inside `dir="rtl"`: the centring needs no direction handling. */
export const Rtl: Story = {
  render: () => ({
    props: { trail },
    template: `<div dir="rtl">${stamp('overlay')}</div>`,
  }),
  play: async ({ canvasElement }) => {
    const overlay = byTestId(canvasElement, 'overlay');

    await itemStyled('overlay', overlay, 'position', 'relative');
    assertCentredOn(
      byTestId(canvasElement, 'overlay-held'),
      centre(overlay.getBoundingClientRect()),
    );
  },
};
