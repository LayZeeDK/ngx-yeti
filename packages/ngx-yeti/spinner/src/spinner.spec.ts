// The test host's `i18n-aria-label` compiles to a `$localize` call.
import '@angular/localize/init';
import {
  type Binding,
  Component,
  inputBinding,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { itemLinks, nextFrame, removeItemLinks } from '@ngx-yeti/testing';
import { createDirectiveHost } from '@ngx-yeti/testing/test-bed';
import type { YetiSizeControl, YetiVariant } from 'ngx-yeti';
import { YetiSpinner } from './spinner';

@Component({
  selector: 'yeti-spinner-host',
  imports: [YetiSpinner],
  template:
    '<p><span #ring="yetiSpinner" yetiSpinner size="sm" class="inline-ring" role="status" aria-label="Loading" i18n-aria-label></span> Loading the latest posts</p>',
})
class SpinnerHost {
  readonly ring = viewChild.required<YetiSpinner>('ring');
}

@Component({
  selector: 'yeti-spinner-waiting-host',
  imports: [YetiSpinner],
  template:
    '@if (waiting()) {<span yetiSpinner role="status" aria-label="Waiting"></span>}',
})
class WaitingHost {
  readonly waiting = signal(false);
}

async function setupSpinner(bindings: Binding[] = []) {
  return createDirectiveHost(YetiSpinner, {
    tagName: 'span',
    bindings,
  });
}

/** A spinner with both inputs bound to signals the test can change. */
async function setupBoundSpinner(bound: {
  variant: YetiVariant;
  size: YetiSizeControl;
}) {
  const inputs = {
    variant: signal<YetiVariant | undefined>(bound.variant),
    size: signal<YetiSizeControl | undefined>(bound.size),
  };
  const spinner = await setupSpinner(
    Object.entries(inputs).map(([name, value]) => inputBinding(name, value)),
  );

  return { ...spinner, inputs };
}

async function setupHost() {
  const fixture = TestBed.createComponent(SpinnerHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const span = element.querySelector('span');
  assert.exists(span);

  return { host: fixture.componentInstance, span };
}

async function setupWaitingHost() {
  const fixture = TestBed.createComponent(WaitingHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);

  return { element, fixture, host: fixture.componentInstance };
}

describe(YetiSpinner, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    const addEventListener = vi.spyOn(
      EventTarget.prototype,
      'addEventListener',
    );

    try {
      const { element } = await setupSpinner();

      expect(addEventListener.mock.contexts).not.toContain(element);
    } finally {
      addEventListener.mockRestore();
    }
  });

  it('renders its class and presence attribute and nothing else', async () => {
    expect.assertions(2);

    const { element } = await setupSpinner();

    expect(element.getAttribute('class')).toBe('spinner');
    // TestBed writes `id` and `ng-version` on the root element it creates.
    // No `data-variant`, `data-size`, `size`, `role`, `tabindex`, or ARIA
    // attribute.
    expect(
      element
        .getAttributeNames()
        .filter((name) => name !== 'id' && name !== 'ng-version')
        .toSorted(),
    ).toStrictEqual(['class', 'data-ngx-yeti-item-spinner']);
  });

  it('renders each bound input and removes it when unset', async () => {
    expect.assertions(4);

    const { element, fixture, inputs } = await setupBoundSpinner({
      variant: 'success',
      size: 'lg',
    });

    expect(element.getAttribute('data-variant')).toBe('success');
    expect(element.getAttribute('data-size')).toBe('lg');

    inputs.variant.set(undefined);
    inputs.size.set(undefined);
    await fixture.whenStable();

    expect(element.hasAttribute('data-variant')).toBe(false);
    expect(element.hasAttribute('data-size')).toBe(false);
  });

  it('writes no attribute beyond the class, the presence attribute, and the two data-* attributes', async () => {
    expect.assertions(1);

    const { element } = await setupBoundSpinner({
      variant: 'neutral',
      size: 'sm',
    });

    expect(
      element
        .getAttributeNames()
        .filter((name) => name !== 'id' && name !== 'ng-version')
        .toSorted(),
    ).toStrictEqual([
      'class',
      'data-ngx-yeti-item-spinner',
      'data-size',
      'data-variant',
    ]);
  });

  it('holds one item link while it lives and removes it a frame after destroy', async () => {
    expect.assertions(2);

    removeItemLinks();
    const spinner = await setupSpinner();

    expect(itemLinks('spinner')).toHaveLength(1);

    spinner.destroy();
    await nextFrame();

    expect(itemLinks('spinner')).toHaveLength(0);
  });

  it('shares one item link between two spinners until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupSpinner();
    const second = await setupSpinner();

    expect(itemLinks('spinner')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('spinner')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('spinner')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('is exported as yetiSpinner', async () => {
      expect.assertions(1);

      const { host } = await setupHost();

      expect(host.ring()).toBeInstanceOf(YetiSpinner);
    });

    it('renders a static size as both the inert size and data-size', async () => {
      expect.assertions(2);

      const { span } = await setupHost();

      expect(span.getAttribute('size')).toBe('sm');
      expect(span.getAttribute('data-size')).toBe('sm');
    });

    it("keeps the consumer's role, name, and own class as written", async () => {
      expect.assertions(4);

      const { span } = await setupHost();

      expect(span.getAttribute('role')).toBe('status');
      expect(span.getAttribute('aria-label')).toBe('Loading');
      expect([...span.classList].toSorted()).toStrictEqual([
        'inline-ring',
        'spinner',
      ]);
      expect(span.hasAttribute('tabindex')).toBe(false);
    });

    it('creates the spinner with @if and releases its count when @if removes it', async () => {
      expect.assertions(4);

      removeItemLinks();
      const { element, fixture, host } = await setupWaitingHost();

      host.waiting.set(true);
      await fixture.whenStable();

      expect(element.querySelector('span')?.className).toBe('spinner');
      expect(itemLinks('spinner')).toHaveLength(1);

      host.waiting.set(false);
      await fixture.whenStable();
      await nextFrame();

      expect(element.querySelector('span')).toBeNull();
      expect(itemLinks('spinner')).toHaveLength(0);
    });
  });
});
