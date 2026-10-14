import { provideLocationMocks } from '@angular/common/testing';
import { Component, signal, type WritableSignal } from '@angular/core';
import { RouterLink, RouterOutlet, provideRouter } from '@angular/router';
import {
  assertWithin,
  composite,
  contrastRatio,
  itemLinks,
  itemStyled,
  manifestValues,
  parseColor,
  storyStates,
  usedLength,
  type SrgbColor,
} from '@ngx-yeti/testing';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { NgxYetiPaint, YetiBox } from 'ngx-yeti/box';
import { YetiCluster } from 'ngx-yeti/cluster';
import { YetiIcon } from 'ngx-yeti/icon';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import manifest from 'yeti-css/manifest';
import { YetiButton } from './button';
import { YetiButtonDisabledLink } from './button-disabled-link';

@Component({
  selector: 'yeti-docs-page',
  template: '<p>The docs page</p>',
})
class DocsPage {}

const schemes = ['light', 'dark'] as const;
const emphases = manifestValues(manifest.components.button, 'data-emphasis');
const sizes = manifestValues(manifest.components.button, 'data-size');
const huedVariants = manifestValues(
  manifest.components.button,
  'data-variant',
).filter((variant) => variant !== 'black' && variant !== 'white');

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

function buttons(root: Element): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('[yetiButton]')];
}

function blur(): void {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

/** The element's computed style with its running transitions at their end. */
function settledStyle(element: Element): CSSStyleDeclaration {
  for (const transition of element.getAnimations()) {
    transition.finish();
  }

  return getComputedStyle(element);
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
    const { backgroundColor } = settledStyle(node);

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

/** The exact WCAG ratio of a button's text on its fill. */
function textRatio(button: HTMLElement): number {
  return contrastRatio(settledStyle(button).color, effectiveBackground(button));
}

/**
 * Waits until the button's file styles `button`. The computed `display` of
 * a styled button depends on its parent (`inline-flex` in flow, `flex` as a
 * flex item), so no one value fits every story; `justify-content: center` is
 * the same everywhere.
 */
async function buttonStyled(button: Element): Promise<void> {
  await itemStyled('button', button, 'justify-content', 'center');
}

/** No role, `tabindex`, or ARIA attribute beyond the ones named. */
async function expectNoPackageSemantics(
  button: HTMLElement,
  consumerAttributes: readonly string[] = [],
): Promise<void> {
  await expect(
    button
      .getAttributeNames()
      .filter(
        (name) =>
          (name === 'role' ||
            name === 'tabindex' ||
            name.startsWith('aria-')) &&
          !consumerAttributes.includes(name),
      ),
  ).toStrictEqual([]);
}

/** At least 24 by 24 CSS pixels (WCAG 2.5.8). */
async function expectTargetSize(control: HTMLElement): Promise<void> {
  const { width, height } = control.getBoundingClientRect();

  await expect(width).toBeGreaterThanOrEqual(24);
  await expect(height).toBeGreaterThanOrEqual(24);
}

/** The opacity Yeti's muted token gives, read from a probe of the token. */
function mutedOpacity(root: Element): string {
  const probe = document.createElement('div');
  probe.style.opacity = 'var(--yeti-opacity-muted)';
  root.append(probe);
  const { opacity } = getComputedStyle(probe);
  probe.remove();

  return opacity;
}

/**
 * The signal a story binds, by story id, so its play function can change it
 * the way a Storybook control does.
 */
const buttonStates = storyStates<WritableSignal<boolean>>('button');

const meta: Meta<YetiButton> = {
  id: 'button',
  component: YetiButton,
  decorators: [
    moduleMetadata({
      imports: [
        YetiButton,
        YetiButtonDisabledLink,
        YetiCluster,
        YetiIcon,
        YetiBox,
        NgxYetiPaint,
        RouterLink,
        RouterOutlet,
      ],
    }),
    applicationConfig({
      providers: [
        provideRouter([
          { path: 'docs', component: DocsPage },
          { path: '', children: [] },
        ]),
        provideLocationMocks(),
      ],
    }),
  ],
};
export default meta;

type Story = StoryObj<YetiButton>;

/** Yeti's example: a high, a medium, and a low button in a cluster. */
export const Default: Story = {
  render: () => ({
    template: `
      <div yetiCluster gap="sm">
        <button yetiButton type="button">Save</button>
        <button yetiButton type="button" emphasis="medium">Preview</button>
        <button yetiButton type="button" emphasis="low">Cancel</button>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const save = canvas.getByRole('button', { name: 'Save' });
    const preview = canvas.getByRole('button', { name: 'Preview' });
    const cancel = canvas.getByRole('button', { name: 'Cancel' });
    const all = [save, preview, cancel];

    for (const button of all) {
      await expect(button).toHaveAttribute('class', 'button');
      await expect(button).toHaveAttribute('data-ngx-yeti-item-button', '');
      await expect(button).not.toHaveAttribute('data-variant');
      await expect(button).not.toHaveAttribute('data-size');
      await expect(button).toHaveAttribute('type', 'button');
      await expectNoPackageSemantics(button);
      await expect(button).toHaveAccessibleName(button.textContent.trim());
    }

    await expect(save).not.toHaveAttribute('data-emphasis');
    await expect(preview).toHaveAttribute('data-emphasis', 'medium');
    await expect(cancel).toHaveAttribute('data-emphasis', 'low');

    await buttonStyled(save);

    await expect(itemLinks('button')).toHaveLength(1);
    await expect(itemLinks('spinner')).toHaveLength(1);

    blur();

    for (const button of all) {
      await userEvent.tab();
      await expect(button).toHaveFocus();
    }

    await expect(getComputedStyle(cancel).outlineStyle).not.toBe('none');
  },
};

function variantButtons(variants: readonly string[]): string {
  return variants
    .flatMap((variant) =>
      emphases.map(
        (emphasis) =>
          `<button yetiButton type="button" variant="${variant}" emphasis="${emphasis}">${variant} ${emphasis}</button>`,
      ),
    )
    .join('');
}

/**
 * Every variant at every emphasis in a light and a dark wrapper, with
 * `black` on Yeti's white paint and `white` on its black paint. The hover
 * ratios are in `button.spec.ts` and the press ratios in `ngx-yeti-e2e`:
 * Storybook's pointer sets neither `:hover` nor `:active`.
 */
export const Variants: Story = {
  render: () => ({
    template: schemes
      .map((scheme) =>
        schemeWrapper(
          scheme,
          `<div yetiCluster gap="sm">${variantButtons(huedVariants)}</div>
           <div data-band="white" yetiBox yetiPaint="white"><div yetiCluster gap="sm">${variantButtons(['black'])}</div></div>
           <div data-band="black" yetiBox yetiPaint="black"><div yetiCluster gap="sm">${variantButtons(['white'])}</div></div>`,
        ),
      )
      .join(''),
  }),
  play: async ({ canvasElement }) => {
    const [first] = buttons(canvasElement);

    if (first === undefined) {
      throw new Error('The story has no button');
    }

    await buttonStyled(first);
    await itemStyled(
      'box',
      byScheme(canvasElement, 'light').querySelector('[data-band]') ?? first,
      'padding-top',
      (value) => value !== '0px',
    );

    for (const scheme of schemes) {
      const all = buttons(byScheme(canvasElement, scheme));

      await expect(all).toHaveLength(
        (huedVariants.length + 2) * emphases.length,
      );

      for (const button of all) {
        await expect(button).toHaveAttribute(
          'data-variant',
          button.getAttribute('variant') ?? '',
        );
        await expect(button).toHaveAttribute(
          'data-emphasis',
          button.getAttribute('emphasis') ?? '',
        );
        await expect(textRatio(button)).toBeGreaterThanOrEqual(4.5);
      }
    }

    // `black` and `white` do not follow the scheme.
    for (const selector of [
      '[data-variant="black"][data-emphasis="high"]',
      '[data-variant="white"][data-emphasis="high"]',
    ]) {
      const fills = schemes.map((scheme) => {
        const button = byScheme(canvasElement, scheme).querySelector(selector);

        if (button === null) {
          throw new Error(`Nothing matches ${selector}`);
        }

        return parseColor(settledStyle(button).backgroundColor);
      });

      await expect(fills[0]).toStrictEqual(fills[1]);
      await expect(fills[0]?.alpha).toBe(1);
    }
  },
};

const closeIcon =
  '<svg role="img" aria-label="Close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" /></svg>';

const saveIcon =
  '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" stroke-width="2" /></svg>';

function svgOf(button: Element): SVGSVGElement {
  const svg = button.querySelector(':scope > svg');

  if (!(svg instanceof SVGSVGElement)) {
    throw new Error('The button holds no SVG as a direct child');
  }

  return svg;
}

/** `sm`, `md`, and `lg`, each with text and icon-only. */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div yetiCluster gap="sm">
        ${sizes
          .map(
            (size) =>
              `<button data-testid="text-${size}" yetiButton type="button" size="${size}">Save</button>
               <button data-testid="icon-${size}" yetiButton type="button" size="${size}">${closeIcon}</button>`,
          )
          .join('')}
      </div>`,
  }),
  play: async ({ canvas, canvasElement }) => {
    const text = (size: string): HTMLElement =>
      canvas.getByTestId(`text-${size}`);
    const icon = (size: string): HTMLElement =>
      canvas.getByTestId(`icon-${size}`);

    await buttonStyled(text('md'));

    const control = usedLength(
      canvasElement,
      'var(--yeti-control-size)',
      'block',
    );

    for (const size of sizes) {
      for (const button of [text(size), icon(size)]) {
        await expect(button).toHaveAttribute('data-size', size);
        // HTML's own `size` does nothing on a button, so the static
        // attribute stays beside the one the directive binds.
        await expect(button).toHaveAttribute('size', size);
        await expect(
          button.getBoundingClientRect().height,
        ).toBeGreaterThanOrEqual(control - 0.5);
        await expectTargetSize(button);
      }

      await expect(icon(size)).toHaveAccessibleName('Close');
      await expect(text(size)).toHaveAccessibleName('Save');
    }

    await expect(text('lg').getBoundingClientRect().height).toBeGreaterThan(
      text('md').getBoundingClientRect().height,
    );
  },
};

/** A link that looks like a button: one through the router, one by `href`. */
export const Link: Story = {
  render: () => ({
    template: `
      <div yetiCluster gap="sm">
        <a yetiButton variant="secondary" routerLink="/docs">Read the docs</a>
        <a yetiButton emphasis="medium" href="#pricing">See the pricing</a>
        <button yetiButton type="button">Save</button>
      </div>
      <router-outlet />`,
  }),
  play: async ({ canvas }) => {
    const routed = canvas.getByRole('link', { name: 'Read the docs' });
    const plain = canvas.getByRole('link', { name: 'See the pricing' });
    const button = canvas.getByRole('button', { name: 'Save' });

    await buttonStyled(routed);

    for (const link of [routed, plain]) {
      await expect(link).toHaveAttribute('class', 'button');
      await expect(link).toHaveAttribute('data-ngx-yeti-item-button', '');
      await expectNoPackageSemantics(link);
      await expect(getComputedStyle(link).textDecorationLine).toBe('none');
      assertWithin(
        link.getBoundingClientRect().height,
        button.getBoundingClientRect().height,
      );
    }

    await expect(routed).toHaveAttribute('href', '/docs');
    await expect(plain).toHaveAttribute('href', '#pricing');

    blur();
    await userEvent.tab();
    await expect(routed).toHaveFocus();

    await userEvent.click(routed);
    await expect(await canvas.findByText('The docs page')).toBeVisible();
  },
};

/** A submit input styled as a button, in a form beside a text input. */
export const SubmitInput: Story = {
  render: () => ({
    template: `
      <form>
        <div yetiCluster gap="sm">
          <label>Email <input type="email" name="email" autocomplete="email" /></label>
          <input yetiButton type="submit" value="Sign up" />
          <button yetiButton type="button">Cancel</button>
        </div>
      </form>`,
  }),
  play: async ({ canvas }) => {
    const submit = canvas.getByRole('button', { name: 'Sign up' });
    const button = canvas.getByRole('button', { name: 'Cancel' });

    await expect(submit.localName).toBe('input');
    await expect(submit).toHaveAttribute('class', 'button');
    await expect(submit).toHaveAttribute('data-ngx-yeti-item-button', '');
    await expect(submit).toHaveAttribute('type', 'submit');
    await expectNoPackageSemantics(submit);

    await buttonStyled(submit);

    assertWithin(
      submit.getBoundingClientRect().height,
      button.getBoundingClientRect().height,
    );
  },
};

/**
 * Every disabled form: a `button` and a submit `input` through their native
 * `disabled`, a toggle label through its input's, and a link through
 * `[disabled]` with a `null` target (usage rules 3 and 4). The "Enable the
 * controls" toggle flips the state all four bind.
 */
export const Disabled: Story = {
  render: (_args, { id }) => {
    const off = buttonStates.track(id, signal(true));

    return {
      props: { off },
      template: `
        <form>
          <div yetiCluster gap="sm">
            <button yetiButton type="button" emphasis="medium" [attr.aria-pressed]="!off()" (click)="off.set(!off())">Enable the controls</button>
            <button yetiButton type="button" [disabled]="off()">Save</button>
            <input yetiButton type="submit" value="Sign up" [disabled]="off()" />
            <label yetiButton emphasis="medium"><input type="checkbox" name="offline" [disabled]="off()" /> Keep maps offline</label>
            <a yetiButton [disabled]="off()" [routerLink]="off() ? null : '/docs'">Next</a>
            <button yetiButton type="button" emphasis="low">Cancel</button>
          </div>
        </form>
        <router-outlet />`,
    };
  },
  play: async ({ canvas, canvasElement, id }) => {
    const off = buttonStates.get(id);
    const enable = canvas.getByRole('button', { name: 'Enable the controls' });
    const save = canvas.getByRole('button', { name: 'Save' });
    const submit = canvas.getByRole('button', { name: 'Sign up' });
    const checkbox = canvas.getByRole('checkbox', {
      name: 'Keep maps offline',
    });
    const label = checkbox.parentElement;
    const link = canvas.getByRole('link', { name: 'Next' });
    const cancel = canvas.getByRole('button', { name: 'Cancel' });

    if (
      !(save instanceof HTMLButtonElement) ||
      !(submit instanceof HTMLInputElement) ||
      !(checkbox instanceof HTMLInputElement) ||
      label === null
    ) {
      throw new Error('The story renders a button, an input, and a label');
    }

    await buttonStyled(save);

    await expect(save.disabled).toBe(true);
    await expect(submit.disabled).toBe(true);
    await expect(checkbox.disabled).toBe(true);
    await expect(save).not.toHaveAttribute('aria-disabled');
    await expect(save).not.toHaveAttribute('role');

    // The link is a placeholder: announced as a link that is unavailable.
    await expect(link).not.toHaveAttribute('href');
    await expect(link).toHaveAttribute('role', 'link');
    await expect(link).toHaveAttribute('aria-disabled', 'true');
    await expect(link).not.toHaveAttribute('disabled');
    await expect(link).not.toHaveAttribute('tabindex');
    await expect(link).toHaveAccessibleName('Next');

    const muted = mutedOpacity(canvasElement);

    for (const control of [save, submit, label, link]) {
      await expect(getComputedStyle(control).opacity).toBe(muted);
      await expect(getComputedStyle(control).cursor).toBe('not-allowed');
    }

    // Tab skips all four.
    enable.focus();
    await userEvent.tab();
    await expect(cancel).toHaveFocus();

    off.set(false);
    await waitFor(async () => {
      await expect(save.disabled).toBe(false);
    });

    await expect(submit.disabled).toBe(false);
    await expect(checkbox.disabled).toBe(false);
    await expect(link).toHaveAttribute('href', '/docs');
    await expect(link).not.toHaveAttribute('role');
    await expect(link).not.toHaveAttribute('aria-disabled');
    await expect(getComputedStyle(save).cursor).toBe('pointer');

    enable.focus();

    for (const stop of [save, submit, checkbox, link, cancel]) {
      await userEvent.tab();
      await expect(stop).toHaveFocus();
    }

    off.set(true);
    await waitFor(async () => {
      await expect(link).toHaveAttribute('aria-disabled', 'true');
    });
    await expect(link).not.toHaveAttribute('href');
  },
};

/** Two toggles of one emphasis: the first pressed, the second at rest. */
function togglePair(emphasis: string): string {
  return `<div data-pair="${emphasis}" role="group" aria-label="A ${emphasis} pair">
    <button yetiButton type="button" emphasis="${emphasis}" aria-pressed="true">On</button>
    <button yetiButton type="button" emphasis="${emphasis}" aria-pressed="false">Off</button>
  </div>`;
}

interface ToggleRatios {
  /** The pressed fill against the resting fill. */
  readonly states: number;
  /** The pressed fill against the page. */
  readonly pressedOnPage: number;
  /** The resting fill against the page. */
  readonly restingOnPage: number;
}

/** The fills of a pressed and a resting toggle, as the exact WCAG ratios. */
function toggleRatios(pair: Element): ToggleRatios {
  const [pressed, resting] = buttons(pair);

  if (pressed === undefined || resting === undefined) {
    throw new Error('A pair holds two toggles');
  }

  const page = effectiveBackground(pair);
  const pressedFill = effectiveBackground(pressed);
  const restingFill = effectiveBackground(resting);

  return {
    states: contrastRatio(pressedFill, restingFill),
    pressedOnPage: contrastRatio(pressedFill, page),
    restingOnPage: contrastRatio(restingFill, page),
  };
}

function pairOf(root: Element, emphasis: string): Element {
  const pair = root.querySelector(`[data-pair="${emphasis}"]`);

  if (pair === null) {
    throw new Error(`No ${emphasis} pair`);
  }

  return pair;
}

/**
 * Three medium toggles bound to signals, as Yeti's `buttons` example writes
 * them, and a static pair of each toggle emphasis for the state contrast
 * (usage rules 5 and 6).
 */
export const Toggle: Story = {
  render: () => ({
    props: {
      bold: signal(true),
      italic: signal(false),
      underline: signal(false),
    },
    template: `
      <div data-testid="surface" style="color: var(--yeti-color-text); background-color: var(--yeti-color-surface)">
        <div role="group" aria-label="Text style">
          <button yetiButton type="button" emphasis="medium" [attr.aria-pressed]="bold()" (click)="bold.set(!bold())">Bold</button>
          <button yetiButton type="button" emphasis="medium" [attr.aria-pressed]="italic()" (click)="italic.set(!italic())">Italic</button>
          <button yetiButton type="button" emphasis="medium" [attr.aria-pressed]="underline()" (click)="underline.set(!underline())">Underline</button>
        </div>
        ${togglePair('medium')}
        ${togglePair('low')}
      </div>`,
  }),
  play: async ({ canvas, canvasElement }) => {
    const surface = canvas.getByTestId('surface');
    const style = within(canvas.getByRole('group', { name: 'Text style' }));
    const bold = style.getByRole('button', { name: 'Bold' });
    const italic = style.getByRole('button', { name: 'Italic' });

    await buttonStyled(bold);

    await expect(bold).toHaveAttribute('aria-pressed', 'true');
    await expect(italic).toHaveAttribute('aria-pressed', 'false');
    await expectNoPackageSemantics(italic, ['aria-pressed']);

    const resting = settledStyle(italic).backgroundColor;

    await userEvent.click(italic);
    await expect(
      await style.findByRole('button', { name: 'Italic', pressed: true }),
    ).toBe(italic);
    await expect(settledStyle(italic).backgroundColor).not.toBe(resting);
    await expect(settledStyle(italic).backgroundColor).toBe(
      settledStyle(bold).backgroundColor,
    );

    await userEvent.keyboard(' ');
    await expect(
      await style.findByRole('button', { name: 'Italic', pressed: false }),
    ).toBe(italic);
    await expect(settledStyle(italic).backgroundColor).toBe(resting);

    await userEvent.keyboard(' ');
    await expect(
      await style.findByRole('button', { name: 'Italic', pressed: true }),
    ).toBe(italic);

    // A state drawn by fill alone needs 3:1 between its two fills. A medium
    // or low toggle rests with no fill, so that is its pressed fill against
    // the page (ticket 50 decision 94).
    try {
      for (const scheme of schemes) {
        surface.style.colorScheme = scheme;

        for (const emphasis of ['medium', 'low']) {
          const ratios = toggleRatios(pairOf(canvasElement, emphasis));

          await expect(ratios.restingOnPage).toBe(1);
          await expect(ratios.states).toBeGreaterThanOrEqual(3);
          await expect(ratios.pressedOnPage).toBeGreaterThanOrEqual(3);
        }
      }
    } finally {
      surface.style.colorScheme = '';
    }
  },
};

/**
 * A checkbox toggle and Yeti's billing example, a segmented control of two
 * radios, each a `label` wrapping a native input, which needs no script.
 */
export const ToggleInput: Story = {
  render: () => ({
    template: `
      <form>
        <div role="group" aria-label="Map options">
          <label yetiButton emphasis="medium"><input type="checkbox" name="offline" checked /> Keep maps offline</label>
          <label yetiButton emphasis="medium"><input type="checkbox" name="contours" /> Contours</label>
        </div>
        <fieldset>
          <legend>Billing</legend>
          <label yetiButton emphasis="medium"><input type="radio" name="billing" value="monthly" checked /> Monthly</label>
          <label yetiButton emphasis="medium"><input type="radio" name="billing" value="yearly" /> Yearly</label>
        </fieldset>
      </form>`,
  }),
  play: async ({ canvas }) => {
    const offline = canvas.getByRole('checkbox', {
      name: 'Keep maps offline',
      checked: true,
    });
    const contours = canvas.getByRole('checkbox', { name: 'Contours' });
    const monthly = canvas.getByRole('radio', { name: 'Monthly' });
    const yearly = canvas.getByRole('radio', { name: 'Yearly' });
    const labelOf = (input: HTMLElement): HTMLElement => {
      const label = input.parentElement;

      if (label === null) {
        throw new Error('The input has no label');
      }

      return label;
    };

    for (const input of [offline, contours, monthly, yearly]) {
      const label = labelOf(input);

      await expect(label.localName).toBe('label');
      await expect(label).toHaveAttribute('class', 'button');
      await expect(label).toHaveAttribute('data-ngx-yeti-item-button', '');
      await expectNoPackageSemantics(label);
    }

    await buttonStyled(labelOf(contours));

    // The input is out of sight and still takes focus.
    const { width, height } = contours.getBoundingClientRect();

    await expect(width).toBeLessThanOrEqual(1);
    await expect(height).toBeLessThanOrEqual(1);
    await expect(getComputedStyle(contours).clipPath).toBe('inset(50%)');

    const resting = settledStyle(labelOf(contours)).backgroundColor;

    await expect(settledStyle(labelOf(offline)).backgroundColor).not.toBe(
      resting,
    );

    offline.focus();
    await userEvent.tab();

    await expect(contours).toHaveFocus();
    await expect(contours.matches(':focus-visible')).toBe(true);
    await expect(getComputedStyle(labelOf(contours)).outlineStyle).toBe(
      'solid',
    );
    await expect(getComputedStyle(labelOf(offline)).outlineStyle).toBe('none');

    await userEvent.keyboard(' ');

    await expect(contours).toBeChecked();
    await expect(settledStyle(labelOf(contours)).backgroundColor).toBe(
      settledStyle(labelOf(offline)).backgroundColor,
    );

    await userEvent.tab();
    await expect(monthly).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');

    await expect(yearly).toBeChecked();
    await expect(yearly).toHaveFocus();
    await expect(monthly).not.toBeChecked();
    await expect(settledStyle(labelOf(monthly)).backgroundColor).toBe(resting);
  },
};

/**
 * A submit button that waits: `aria-busy` with `aria-disabled`, both from one
 * signal (usage rule 7). Yeti draws the ring after the label from
 * `spinner.css`, which the button loads itself: no spinner is on the page.
 */
export const Busy: Story = {
  render: (_args, { id }) => {
    const saving = buttonStates.track(id, signal(true));

    return {
      props: { saving },
      template: `
        <form>
          <button yetiButton type="submit" [attr.aria-busy]="saving() ? 'true' : null" [attr.aria-disabled]="saving() ? 'true' : null">Saving</button>
        </form>`,
    };
  },
  play: async ({ canvas, canvasElement, id }) => {
    const saving = buttonStates.get(id);
    const button = canvas.getByRole('button', { name: 'Saving' });
    const ring = (): CSSStyleDeclaration => getComputedStyle(button, '::after');

    await buttonStyled(button);
    // The ring is a pseudo-element, which the helper's own read cannot
    // reach, so its predicate reads it.
    await itemStyled(
      'spinner',
      button,
      'display',
      () => ring().content !== 'none',
    );

    await expect(canvasElement.querySelector('[yetiSpinner]')).toBeNull();
    await expect(itemLinks('spinner')).toHaveLength(1);

    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).toHaveAccessibleName('Saving');
    await expect(button).not.toHaveAttribute('disabled');
    await expect(ring().content).toBe('""');
    await expect(parseFloat(ring().borderTopWidth)).toBeGreaterThan(0);
    await expect(ring().animationName).toBe('yeti-spin');
    await expect(getComputedStyle(button).opacity).toBe(
      mutedOpacity(canvasElement),
    );
    // Yeti means `progress` here (upstream Y15), but its disabled rule is
    // the more specific one and wins the cursor. This fails when Yeti fixes
    // it; assert `progress` then.
    await expect(getComputedStyle(button).cursor).toBe('not-allowed');

    // It stays enabled, so it keeps focus and its Tab stop.
    blur();
    await userEvent.tab();
    await expect(button).toHaveFocus();

    saving.set(false);
    await waitFor(async () => {
      await expect(button).not.toHaveAttribute('aria-busy');
    });

    await expect(button).not.toHaveAttribute('aria-disabled');
    await expect(ring().content).toBe('none');
    await expect(getComputedStyle(button).cursor).toBe('pointer');
    await expect(button).toHaveFocus();
  },
};

/**
 * `yetiIcon` beside `yetiButton` on one element, as Yeti's
 * `class="icon button"`: a decorative SVG beside the text, and an icon-only
 * button named through its SVG (usage rule 8).
 */
export const Icon: Story = {
  render: () => ({
    template: `
      <div yetiCluster gap="sm">
        <button yetiIcon yetiButton type="button">${saveIcon}Save</button>
        <button yetiIcon yetiButton type="button">${closeIcon}</button>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const save = canvas.getByRole('button', { name: 'Save' });
    const close = canvas.getByRole('button', { name: 'Close' });

    await expect(save).toHaveAccessibleName('Save');
    await expect(close).toHaveAccessibleName('Close');
    await expect(svgOf(save)).toHaveAttribute('aria-hidden', 'true');
    await expect(svgOf(close)).toHaveAttribute('role', 'img');

    await buttonStyled(save);
    await itemStyled('icon', save, 'align-items', 'center');

    for (const button of [save, close]) {
      await expect([...button.classList].toSorted()).toStrictEqual([
        'button',
        'icon',
      ]);
      await expect(button).toHaveAttribute('data-ngx-yeti-item-button', '');
      await expect(button).toHaveAttribute('data-ngx-yeti-item-icon', '');
      await expectNoPackageSemantics(button);

      const { width, height } = svgOf(button).getBoundingClientRect();
      const em = parseFloat(getComputedStyle(button).fontSize);

      assertWithin(width, em, 0.5);
      assertWithin(height, em, 0.5);
    }

    await expectTargetSize(close);
    // WCAG 1.4.11: the glyph draws in `currentColor` on the button's fill.
    // The fill is read first: it settles the button's colour transition,
    // which the glyph inherits.
    const fill = effectiveBackground(close);
    const glyph = settledStyle(svgOf(close)).color;

    await expect(contrastRatio(glyph, fill)).toBeGreaterThanOrEqual(3);
  },
};

/**
 * The buttons of the icon story and a link in a right-to-left row: the icon
 * sits at the inline start, and Tab follows the DOM order.
 */
export const Rtl: Story = {
  render: () => ({
    template: `
      <div dir="rtl" yetiCluster gap="sm">
        <button yetiIcon yetiButton type="button">${saveIcon}<span>Save</span></button>
        <button yetiIcon yetiButton type="button">${closeIcon}</button>
        <button yetiButton type="button" emphasis="medium">Preview</button>
        <a yetiButton emphasis="low" href="#docs">Read the docs</a>
      </div>`,
  }),
  play: async ({ canvas }) => {
    const save = canvas.getByRole('button', { name: 'Save' });
    const close = canvas.getByRole('button', { name: 'Close' });
    const preview = canvas.getByRole('button', { name: 'Preview' });
    const link = canvas.getByRole('link', { name: 'Read the docs' });
    const label = save.querySelector('span');

    if (label === null) {
      throw new Error('The save button holds its label in a span');
    }

    await buttonStyled(save);
    await itemStyled('icon', save, 'align-items', 'center');
    await itemStyled('cluster', save.parentElement ?? save, 'display', 'flex');

    // The icon sits at its button's inline start, which is the right.
    await expect(svgOf(save).getBoundingClientRect().left).toBeGreaterThan(
      label.getBoundingClientRect().right,
    );

    // The first button sits at the inline start too.
    await expect(save.getBoundingClientRect().left).toBeGreaterThan(
      close.getBoundingClientRect().right,
    );
    await expect(close.getBoundingClientRect().left).toBeGreaterThan(
      preview.getBoundingClientRect().right,
    );
    await expect(preview.getBoundingClientRect().left).toBeGreaterThan(
      link.getBoundingClientRect().right,
    );

    blur();

    for (const stop of [save, close, preview, link]) {
      await userEvent.tab();
      await expect(stop).toHaveFocus();
    }
  },
};

/**
 * Anti-pattern (usage rule 6, ledger A11Y-34), what not to write: a
 * high-emphasis toggle. Pressed, it steps from one shade of its hue to a
 * darker one, which falls short of the 3:1 a state drawn by fill alone
 * needs. Axe has no rule for it, so none is off; `button.spec.ts` of
 * `ngx-yeti-e2e` records the ratio.
 */
export const AntiPatternHighEmphasisToggle: Story = {
  render: () => ({
    template: `
      <div style="color: var(--yeti-color-text); background-color: var(--yeti-color-surface)">
        <p>Do not write a high-emphasis toggle: use <code>emphasis="medium"</code> or <code>"low"</code>.</p>
        ${togglePair('high')}
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const pair = pairOf(canvasElement, 'high');
    const [pressed, resting] = buttons(pair);

    if (pressed === undefined || resting === undefined) {
      throw new Error('The pair holds two toggles');
    }

    await buttonStyled(pressed);

    for (const toggle of [pressed, resting]) {
      await expect(toggle).toHaveAttribute('data-emphasis', 'high');
      await expect(textRatio(toggle)).toBeGreaterThanOrEqual(4.5);
    }

    await expect(pressed).toHaveAttribute('aria-pressed', 'true');
    // The states differ, by a fill the e2e spec measures.
    await expect(settledStyle(pressed).backgroundColor).not.toBe(
      settledStyle(resting).backgroundColor,
    );
  },
};
