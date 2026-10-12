import {
  type Binding,
  Component,
  inputBinding,
  signal,
  type Type,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterLink, provideRouter } from '@angular/router';
import {
  composite,
  contrastRatio,
  itemLinks,
  itemNames,
  itemStylesLoaded,
  nextFrame,
  parseColor,
  removeItemLinks,
  stylesheetLoaded,
  type SrgbColor,
} from '@ngx-yeti/testing';
import { createDirectiveHost } from '@ngx-yeti/testing/test-bed';
import type { YetiEmphasis, YetiSizeControl, YetiVariant } from 'ngx-yeti';
import { NgxYetiPaint } from 'ngx-yeti/box';
import { YetiSpinner } from 'ngx-yeti/spinner';
import { provideYetiStyles } from 'ngx-yeti/styles';
import { page, server } from 'vitest/browser';
import { YetiButton } from './button';
import { YetiButtonDisabledLink } from './button-disabled-link';

/** Yeti's built CSS, served by Vite from the workspace's node_modules. */
const yetiCss: `${string}/` = `/@fs/${server.config.root.replaceAll('\\', '/')}/../../node_modules/yeti-css/dist/css/`;

/** Storybook's global stylesheet, which Vite serves with its imports inlined. */
const globalHref = `/@fs/${server.config.root.replaceAll('\\', '/')}/.storybook/styles.css`;

const hostTags = ['button', 'a', 'input', 'label'] as const;

const huedVariants: readonly YetiVariant[] = [
  'primary',
  'secondary',
  'success',
  'warning',
  'alert',
  'danger',
  'neutral',
];
const emphases: readonly YetiEmphasis[] = ['high', 'medium', 'low'];
const schemes = ['light', 'dark'] as const;

interface Swatch {
  readonly variant: YetiVariant;
  readonly emphasis: YetiEmphasis;
}

const huedSwatches: readonly Swatch[] = huedVariants.flatMap((variant) =>
  emphases.map((emphasis) => ({ variant, emphasis })),
);

/** `black` sits on Yeti's white paint and `white` on its black paint. */
const constantSwatches = (variant: 'black' | 'white'): readonly Swatch[] =>
  emphases.map((emphasis) => ({ variant, emphasis }));

@Component({
  selector: 'yeti-button-test-host',
  imports: [RouterLink, YetiButton, YetiButtonDisabledLink],
  // eslint-disable-next-line @angular-eslint/component-max-inline-declarations -- the host holds every template case of the spec in one file
  template: `
    <button
      #b="yetiButton"
      data-testid="native"
      yetiButton
      type="button"
      class="consumer-class"
      [disabled]="off()"
    >
      Save
    </button>
    <a
      #l="yetiButtonDisabledLink"
      data-testid="bound-link"
      yetiButton
      [disabled]="off()"
      [routerLink]="off() ? null : '/x'"
      >Next</a
    >
    <a data-testid="static-link" yetiButton disabled>Previous</a>
    <button data-testid="static-button" yetiButton type="button" disabled>
      Static
    </button>
    <button
      data-testid="aria"
      yetiButton
      type="button"
      [attr.aria-pressed]="pressed()"
      [attr.aria-busy]="busy()"
      [attr.aria-disabled]="busy()"
    >
      Bold
    </button>
  `,
})
class ButtonTestHost {
  readonly button = viewChild.required<YetiButton>('b');
  readonly link = viewChild.required<YetiButtonDisabledLink>('l');
  readonly off = signal(false);
  readonly pressed = signal(false);
  readonly busy = signal(true);
}

@Component({
  selector: 'yeti-button-variants-host',
  imports: [NgxYetiPaint, YetiButton],
  // eslint-disable-next-line @angular-eslint/component-max-inline-declarations -- the host renders every variant at every emphasis in both schemes
  template: `
    <p data-testid="away">Away from the buttons</p>
    @for (scheme of schemes; track scheme) {
      <div [attr.data-scheme]="scheme">
        @for (swatch of hued; track $index) {
          <button
            yetiButton
            type="button"
            [variant]="swatch.variant"
            [emphasis]="swatch.emphasis"
          >
            {{ swatch.variant }} {{ swatch.emphasis }}
          </button>
        }
        <p yetiPaint="white">
          @for (swatch of black; track $index) {
            <button
              yetiButton
              type="button"
              [variant]="swatch.variant"
              [emphasis]="swatch.emphasis"
            >
              {{ swatch.variant }} {{ swatch.emphasis }}
            </button>
          }
        </p>
        <p yetiPaint="black">
          @for (swatch of white; track $index) {
            <button
              yetiButton
              type="button"
              [variant]="swatch.variant"
              [emphasis]="swatch.emphasis"
            >
              {{ swatch.variant }} {{ swatch.emphasis }}
            </button>
          }
        </p>
      </div>
    }
  `,
  // eslint-disable-next-line @angular-eslint/component-max-inline-declarations -- the two scheme wrappers of the host above
  styles: `
    [data-scheme] {
      padding: 1rem;
      color: var(--yeti-color-text);
      background-color: var(--yeti-color-surface);
    }

    [data-scheme='light'] {
      color-scheme: light;
    }

    [data-scheme='dark'] {
      color-scheme: dark;
    }
  `,
})
class VariantsHost {
  protected readonly schemes = schemes;
  protected readonly hued = huedSwatches;
  protected readonly black = constantSwatches('black');
  protected readonly white = constantSwatches('white');
}

@Component({
  selector: 'yeti-button-pointer-host',
  imports: [YetiButton],
  // eslint-disable-next-line @angular-eslint/component-max-inline-declarations -- the host holds the link and both pressed toggles of the pointer cases
  template: `
    <p data-testid="away">Away from the buttons</p>
    <a data-testid="link" yetiButton href="#docs">Read the docs</a>
    <button
      data-testid="pressed-medium"
      yetiButton
      type="button"
      emphasis="medium"
      aria-pressed="true"
    >
      Italic
    </button>
    <button
      data-testid="pressed-low"
      yetiButton
      type="button"
      emphasis="low"
      aria-pressed="true"
    >
      Underline
    </button>
  `,
})
class PointerHost {}

/** Adds the global stylesheet once per test file, as an application does. */
async function globalStylesheet(): Promise<void> {
  let link = document.head.querySelector<HTMLLinkElement>(
    `link[href="${globalHref}"]`,
  );

  if (link === null) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = globalHref;
    document.head.append(link);
  }

  await stylesheetLoaded(link);
}

/**
 * The element's computed style with its running transitions jumped to their
 * end: Yeti's hover and press colours are a transition's end state.
 */
function settledStyle(element: Element): CSSStyleDeclaration {
  for (const transition of element.getAnimations()) {
    transition.finish();
  }

  return getComputedStyle(element);
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

function textRatio(button: HTMLElement): number {
  return contrastRatio(settledStyle(button).color, effectiveBackground(button));
}

async function setupButton(tagName = 'button', bindings: Binding[] = []) {
  return createDirectiveHost(YetiButton, { tagName, bindings });
}

/** A button with every input bound to a signal the test can change. */
async function setupBoundButton(
  tagName: string,
  bound: {
    variant: YetiVariant;
    emphasis: YetiEmphasis;
    size: YetiSizeControl;
  },
) {
  const inputs = {
    variant: signal<YetiVariant | undefined>(bound.variant),
    emphasis: signal<YetiEmphasis | undefined>(bound.emphasis),
    size: signal<YetiSizeControl | undefined>(bound.size),
  };
  const button = await setupButton(
    tagName,
    Object.entries(inputs).map(([name, value]) => inputBinding(name, value)),
  );

  return { ...button, inputs };
}

async function setupDisabledLink(disabled: boolean) {
  const state = signal(disabled);
  const link = await createDirectiveHost(YetiButtonDisabledLink, {
    tagName: 'a',
    bindings: [inputBinding('disabled', state)],
  });

  return { ...link, state };
}

async function setupHost() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(ButtonTestHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const root = element;
  const byTestId = (id: string): HTMLElement => {
    const found = root.querySelector(`[data-testid="${id}"]`);
    assert.instanceOf(found, HTMLElement);

    return found;
  };

  return { byTestId, fixture, host: fixture.componentInstance };
}

/** Renders a host with Yeti's global stylesheet and the item files loaded. */
async function setupStyled(component: Type<unknown>) {
  await globalStylesheet();
  TestBed.configureTestingModule({
    providers: [provideYetiStyles({ url: yetiCss })],
  });
  const fixture = TestBed.createComponent(component);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const root = element;

  await itemStylesLoaded('button');

  const buttons = [...root.querySelectorAll<HTMLElement>('.button')];
  const [first] = buttons;
  assert.exists(first);

  // Chromium and WebKit can keep stale computed styles right after a
  // stylesheet is inserted (upstream bug O2).
  await vi.waitFor(() => {
    assert.strictEqual(getComputedStyle(first).display, 'inline-flex');
  });

  const byTestId = (id: string): HTMLElement => {
    const found = root.querySelector(`[data-testid="${id}"]`);
    assert.instanceOf(found, HTMLElement);

    return found;
  };

  // The pointer starts away from every button.
  await page.elementLocator(byTestId('away')).hover();

  return { buttons, byTestId, root };
}

function attributeNames(element: Element): string[] {
  // TestBed writes `id` and `ng-version` on the root element it creates.
  return element
    .getAttributeNames()
    .filter((name) => name !== 'id' && name !== 'ng-version')
    .toSorted();
}

describe(YetiButton, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    const addEventListener = vi.spyOn(
      EventTarget.prototype,
      'addEventListener',
    );

    try {
      const { element } = await setupButton();

      expect(addEventListener.mock.contexts).not.toContain(element);
    } finally {
      addEventListener.mockRestore();
    }
  });

  it.for(hostTags)(
    'renders its class and presence attribute and nothing else on %s',
    async (tagName) => {
      expect.assertions(2);

      const { element } = await setupButton(tagName);

      expect(element.getAttribute('class')).toBe('button');
      // No data-variant, data-emphasis, data-size, role, aria-disabled,
      // type, or tabindex.
      expect(attributeNames(element)).toStrictEqual([
        'class',
        'data-ngx-yeti-item-button',
      ]);
    },
  );

  it.for(hostTags)(
    'renders each bound input on %s and removes it when unset',
    async (tagName) => {
      expect.assertions(4);

      const { element, fixture, inputs } = await setupBoundButton(tagName, {
        variant: 'danger',
        emphasis: 'medium',
        size: 'lg',
      });

      expect(attributeNames(element)).toStrictEqual([
        'class',
        'data-emphasis',
        'data-ngx-yeti-item-button',
        'data-size',
        'data-variant',
      ]);
      expect(
        ['data-variant', 'data-emphasis', 'data-size'].map((name) =>
          element.getAttribute(name),
        ),
      ).toStrictEqual(['danger', 'medium', 'lg']);

      inputs.variant.set(undefined);
      inputs.emphasis.set(undefined);
      inputs.size.set(undefined);
      await fixture.whenStable();

      expect(attributeNames(element)).toStrictEqual([
        'class',
        'data-ngx-yeti-item-button',
      ]);

      inputs.emphasis.set('low');
      await fixture.whenStable();

      expect(element.getAttribute('data-emphasis')).toBe('low');
    },
  );

  it('holds the button and then the spinner link while it lives and removes both a frame after destroy', async () => {
    expect.assertions(2);

    removeItemLinks();
    const button = await setupButton();

    expect(itemNames()).toStrictEqual(['button', 'spinner']);

    button.destroy();
    await nextFrame();

    expect(itemNames()).toStrictEqual([]);
  });

  it('shares one link of each item between two buttons until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupButton();
    const second = await setupButton('a');

    expect(itemNames()).toStrictEqual(['button', 'spinner']);

    first.destroy();
    await nextFrame();

    expect(itemNames()).toStrictEqual(['button', 'spinner']);

    second.destroy();
    await nextFrame();

    expect(itemNames()).toStrictEqual([]);
  });

  it('leaves the spinner link to a spinner that outlives the button', async () => {
    expect.assertions(3);

    removeItemLinks();
    const button = await setupButton();
    const spinner = await createDirectiveHost(YetiSpinner, {
      tagName: 'span',
    });

    expect(itemNames()).toStrictEqual(['button', 'spinner']);

    button.destroy();
    await nextFrame();

    expect(itemNames()).toStrictEqual(['spinner']);

    spinner.destroy();
    await nextFrame();

    expect(itemNames()).toStrictEqual([]);
  });

  describe('in a template', () => {
    it('resolves the template references yetiButton and yetiButtonDisabledLink', async () => {
      expect.assertions(2);

      const { host } = await setupHost();

      expect(host.button()).toBeInstanceOf(YetiButton);
      expect(host.link()).toBeInstanceOf(YetiButtonDisabledLink);
    });

    it("leaves a [disabled] binding on a button host to the native property, and keeps the consumer's class", async () => {
      expect.assertions(5);

      const { byTestId, fixture, host } = await setupHost();
      const native = byTestId('native');
      assert.instanceOf(native, HTMLButtonElement);

      expect(native.disabled).toBe(false);
      expect([...native.classList].toSorted()).toStrictEqual([
        'button',
        'consumer-class',
      ]);

      host.off.set(true);
      await fixture.whenStable();

      expect(native.disabled).toBe(true);
      expect(native.hasAttribute('role')).toBe(false);

      host.off.set(false);
      await fixture.whenStable();

      expect(native.disabled).toBe(false);
    });

    it('disables a link through YetiButtonDisabledLink with a null routerLink', async () => {
      expect.assertions(8);

      const { byTestId, fixture, host } = await setupHost();
      const link = byTestId('bound-link');

      expect(link.getAttribute('href')).toBe('/x');
      expect(link.hasAttribute('role')).toBe(false);
      expect(link.hasAttribute('aria-disabled')).toBe(false);

      host.off.set(true);
      await fixture.whenStable();

      expect(link.hasAttribute('href')).toBe(false);
      expect(link.getAttribute('role')).toBe('link');
      expect(link.getAttribute('aria-disabled')).toBe('true');
      expect(link.hasAttribute('disabled')).toBe(false);

      host.off.set(false);
      await fixture.whenStable();

      expect(link.getAttribute('href')).toBe('/x');
    });

    it('renders a static disabled link as a placeholder with no disabled attribute', async () => {
      expect.assertions(4);

      const { byTestId } = await setupHost();
      const link = byTestId('static-link');

      expect(link.getAttribute('role')).toBe('link');
      expect(link.getAttribute('aria-disabled')).toBe('true');
      expect(link.hasAttribute('disabled')).toBe(false);
      expect(link.getAttribute('class')).toBe('button');
    });

    it('keeps the native disabled of a static disabled button, with no link role', async () => {
      expect.assertions(4);

      const { byTestId } = await setupHost();
      const button = byTestId('static-button');
      assert.instanceOf(button, HTMLButtonElement);

      expect(button.disabled).toBe(true);
      expect(button.hasAttribute('disabled')).toBe(true);
      expect(button.hasAttribute('role')).toBe(false);
      expect(button.hasAttribute('aria-disabled')).toBe(false);
    });

    it("renders the consumer's aria-pressed, aria-busy, and aria-disabled as written", async () => {
      expect.assertions(6);

      const { byTestId, fixture, host } = await setupHost();
      const button = byTestId('aria');

      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.getAttribute('aria-disabled')).toBe('true');

      host.pressed.set(true);
      host.busy.set(false);
      await fixture.whenStable();

      expect(button.getAttribute('aria-pressed')).toBe('true');
      expect(button.getAttribute('aria-busy')).toBe('false');
      expect(button.getAttribute('aria-disabled')).toBe('false');
    });
  });

  // button.md:315, :317, and :320 put these in the stories; Storybook's
  // userEvent does not set `:hover`, so they run here under a real pointer
  // (ngx-yeti-specs, Departures). The press ratios are in ngx-yeti-e2e.
  describe('under a real pointer', () => {
    it.for(schemes)(
      'keeps every variant and emphasis at least 4.5:1 at rest and on hover in the %s scheme',
      { timeout: 60_000 },
      async (scheme) => {
        expect.assertions(2);

        removeItemLinks();
        const { root } = await setupStyled(VariantsHost);
        const wrapper = root.querySelector(`[data-scheme="${scheme}"]`);
        assert.instanceOf(wrapper, HTMLElement);
        const failures: string[] = [];
        const buttons = [...wrapper.querySelectorAll<HTMLElement>('.button')];

        expect(buttons).toHaveLength(huedSwatches.length + 2 * emphases.length);

        for (const button of buttons) {
          const label = button.textContent.trim();
          const rest = textRatio(button);

          await page.elementLocator(button).hover();
          await vi.waitFor(() => {
            assert.isTrue(button.matches(':hover'));
          });
          const hover = textRatio(button);

          for (const [state, ratio] of [
            ['rest', rest],
            ['hover', hover],
          ] as const) {
            if (ratio < 4.5) {
              failures.push(`${label} ${state} ${ratio.toFixed(2)}`);
            }
          }
        }

        expect(failures).toStrictEqual([]);
      },
    );

    it('keeps a hovered link free of an underline', async () => {
      expect.assertions(2);

      removeItemLinks();
      const { byTestId } = await setupStyled(PointerHost);
      const link = byTestId('link');

      expect(settledStyle(link).textDecorationLine).toBe('none');

      await page.elementLocator(link).hover();
      await vi.waitFor(() => {
        assert.isTrue(link.matches(':hover'));
      });

      expect(settledStyle(link).textDecorationLine).toBe('none');
    });

    it.for(['pressed-medium', 'pressed-low'])(
      'keeps the pressed fill of %s on hover',
      async (testId) => {
        expect.assertions(2);

        removeItemLinks();
        const { byTestId } = await setupStyled(PointerHost);
        const toggle = byTestId(testId);
        const pressed = settledStyle(toggle).backgroundColor;

        expect(parseColor(pressed).alpha).toBe(1);

        await page.elementLocator(toggle).hover();
        await vi.waitFor(() => {
          assert.isTrue(toggle.matches(':hover'));
        });

        expect(settledStyle(toggle).backgroundColor).toBe(pressed);
      },
    );
  });
});

describe(YetiButtonDisabledLink, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    const addEventListener = vi.spyOn(
      EventTarget.prototype,
      'addEventListener',
    );

    try {
      const { element } = await setupDisabledLink(true);

      expect(addEventListener.mock.contexts).not.toContain(element);
    } finally {
      addEventListener.mockRestore();
    }
  });

  it('marks the link role="link" and aria-disabled="true" while disabled and neither otherwise', async () => {
    expect.assertions(4);

    const { element, fixture, state } = await setupDisabledLink(true);

    expect(element.getAttribute('role')).toBe('link');
    expect(element.getAttribute('aria-disabled')).toBe('true');

    state.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('role')).toBe(false);
    expect(element.hasAttribute('aria-disabled')).toBe(false);
  });

  it('never carries disabled, sets no presence attribute, and acquires no link', async () => {
    expect.assertions(3);

    removeItemLinks();
    const { element } = await setupDisabledLink(true);

    expect(element.hasAttribute('disabled')).toBe(false);
    expect(attributeNames(element)).toStrictEqual(['aria-disabled', 'role']);
    expect(itemLinks()).toHaveLength(0);
  });
});
