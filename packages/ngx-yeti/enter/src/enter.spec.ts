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
import type { YetiEnter, YetiSide } from 'ngx-yeti';
import { NgxYetiEnter } from './enter';

@Component({
  selector: 'yeti-enter-reference-host',
  imports: [NgxYetiEnter],
  template:
    '<ul #e="yetiEnter" yetiEnter="rise" class="trails" role="list" stagger view once><li>Hills</li><li>Lakes</li></ul>',
})
class ReferenceHost {
  readonly enter = viewChild.required<NgxYetiEnter>('e');
}

/**
 * A list that arrives once, with a link in each item and a reference list
 * without the directive.
 */
@Component({
  selector: 'yeti-enter-order-host',
  imports: [NgxYetiEnter],
  template:
    '<ul data-testid="arriving" yetiEnter="rise" stagger once role="list"><li><a href="#hills">Hills</a></li><li><a href="#lakes">Lakes</a></li></ul>',
})
class OrderHost {}

/**
 * Pushes everything TestBed appends to the body below the viewport and
 * scrolls back to the top; the spacer leaves when the test ends.
 */
function belowTheFold(): void {
  const spacer = document.createElement('div');
  spacer.style.blockSize = '300vh';
  document.body.prepend(spacer);
  window.scrollTo(0, 0);
  onTestFinished(() => {
    spacer.remove();
    window.scrollTo(0, 0);
  });
}

async function setupEnter(bindings: Binding[] = []) {
  const host = await createDirectiveHost(NgxYetiEnter, {
    tagName: 'p',
    bindings,
  });
  host.element.textContent = 'A note that arrives.';

  return host;
}

/** Creates a `once` host below the viewport, with `once` bound to a signal. */
async function setupOnce(initial = true) {
  belowTheFold();
  const once = signal(initial);
  const enter = await setupEnter([inputBinding('once', once)]);

  return { ...enter, once };
}

/** Scrolls the host into view and waits for the observer's first report. */
async function scrollIn(element: HTMLElement): Promise<void> {
  element.scrollIntoView();
  await nextFrame();
  await nextFrame();
}

async function scrollAway(): Promise<void> {
  window.scrollTo(0, 0);
  await nextFrame();
  await nextFrame();
}

/** The host's attributes and the role, tabindex, and order of its subtree. */
function readingShape(root: Element): string[] {
  return [root, ...root.querySelectorAll('*')].map(
    (element) =>
      `${element.localName} ${element
        .getAttributeNames()
        .filter((name) => name !== 'data-once')
        .toSorted()
        .map((name) => `${name}=${element.getAttribute(name) ?? ''}`)
        .join(' ')}`,
  );
}

describe(NgxYetiEnter, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    const addEventListener = vi.spyOn(
      EventTarget.prototype,
      'addEventListener',
    );

    try {
      const { element } = await setupEnter([inputBinding('once', () => true)]);

      expect(addEventListener.mock.contexts).not.toContain(element);
    } finally {
      addEventListener.mockRestore();
    }
  });

  it('renders its class and presence attribute and no unset attribute', async () => {
    expect.assertions(8);

    const { element } = await setupEnter();

    expect(element.getAttribute('class')).toBe('enter');
    expect(element.getAttribute('data-ngx-yeti-item-enter')).toBe('');
    expect(element.hasAttribute('data-enter')).toBe(false);
    expect(element.hasAttribute('data-side')).toBe(false);
    expect(element.hasAttribute('data-stagger')).toBe(false);
    expect(element.hasAttribute('data-view')).toBe(false);
    expect(element.hasAttribute('data-once')).toBe(false);
    expect(element.hasAttribute('role')).toBe(false);
  });

  it('renders each bound input and removes it when unset', async () => {
    expect.assertions(8);

    const inputs = {
      yetiEnter: signal<YetiEnter | ''>('slide'),
      side: signal<YetiSide | undefined>('end'),
      stagger: signal(true),
      view: signal(true),
    };
    const { element, fixture } = await setupEnter(
      Object.entries(inputs).map(([name, value]) => inputBinding(name, value)),
    );

    expect(element.getAttribute('data-enter')).toBe('slide');
    expect(element.getAttribute('data-side')).toBe('end');
    expect(element.getAttribute('data-stagger')).toBe('');
    expect(element.getAttribute('data-view')).toBe('');

    inputs.yetiEnter.set('');
    inputs.side.set(undefined);
    inputs.stagger.set(false);
    inputs.view.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-enter')).toBe(false);
    expect(element.hasAttribute('data-side')).toBe(false);
    expect(element.hasAttribute('data-stagger')).toBe(false);
    expect(element.hasAttribute('data-view')).toBe(false);
  });

  it('keeps data-once on a host below the viewport', async () => {
    expect.assertions(1);

    const { element, fixture } = await setupOnce();
    await nextFrame();
    await nextFrame();
    await fixture.whenStable();

    expect(element.getAttribute('data-once')).toBe('');
  });

  it('removes data-once once the host is scrolled into view, without manual change detection', async () => {
    expect.assertions(2);

    const { element, fixture } = await setupOnce();

    element.scrollIntoView();

    await expect
      .poll(() => element.hasAttribute('data-once'), { timeout: 2000 })
      .toBe(false);

    await fixture.whenStable();

    expect(element.hasAttribute('data-once')).toBe(false);
  });

  it('does not put data-once back when the host is scrolled away and back', async () => {
    expect.assertions(3);

    const { element, fixture } = await setupOnce();

    await scrollIn(element);

    await expect.poll(() => element.hasAttribute('data-once')).toBe(false);

    await scrollAway();
    await fixture.whenStable();

    expect(element.hasAttribute('data-once')).toBe(false);

    await scrollIn(element);

    await fixture.whenStable();

    expect(element.hasAttribute('data-once')).toBe(false);
  });

  it('follows once before the arrival, still arrives, and stays arrived', async () => {
    expect.assertions(5);

    const { element, fixture, once } = await setupOnce();

    once.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-once')).toBe(false);

    once.set(true);
    await fixture.whenStable();

    expect(element.getAttribute('data-once')).toBe('');

    await scrollIn(element);

    await expect.poll(() => element.hasAttribute('data-once')).toBe(false);

    once.set(false);
    await fixture.whenStable();
    once.set(true);
    await fixture.whenStable();

    expect(element.hasAttribute('data-once')).toBe(false);

    await scrollAway();
    await fixture.whenStable();

    expect(element.hasAttribute('data-once')).toBe(false);
  });

  it('renders no data-once when once turns true after a first render without it', async () => {
    expect.assertions(2);

    const { element, fixture, once } = await setupOnce(false);

    expect(element.hasAttribute('data-once')).toBe(false);

    once.set(true);
    await fixture.whenStable();

    expect(element.hasAttribute('data-once')).toBe(false);
  });

  it('disconnects its observer when destroyed before the host nears the viewport', async () => {
    expect.assertions(3);

    const disconnect = vi.spyOn(IntersectionObserver.prototype, 'disconnect');

    try {
      const { destroy, element } = await setupOnce();
      await nextFrame();

      expect(element.getAttribute('data-once')).toBe('');
      expect(() => {
        destroy();
      }).not.toThrow();
      expect(disconnect).toHaveBeenCalled();
    } finally {
      disconnect.mockRestore();
    }
  });

  it('holds one enter item link while it lives and none after', async () => {
    expect.assertions(2);

    removeItemLinks();
    const { destroy } = await setupEnter();

    expect(itemLinks('enter')).toHaveLength(1);

    destroy();
    await nextFrame();

    expect(itemLinks('enter')).toHaveLength(0);
  });

  it('shares one item link between two hosts until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupEnter();
    const second = await setupEnter();

    expect(itemLinks('enter')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('enter')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('enter')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('resolves the template reference', async () => {
      expect.assertions(1);

      const fixture = TestBed.createComponent(ReferenceHost);
      await fixture.whenStable();

      expect(fixture.componentInstance.enter()).toBeInstanceOf(NgxYetiEnter);
    });

    it("sets inputs from static attributes and keeps the consumer's class and role", async () => {
      expect.assertions(6);

      belowTheFold();
      const fixture = TestBed.createComponent(ReferenceHost);
      await fixture.whenStable();
      const element: unknown = fixture.nativeElement;
      assert.instanceOf(element, HTMLElement);
      const list = element.querySelector('ul');
      assert.exists(list);

      expect([...list.classList].toSorted()).toStrictEqual(['enter', 'trails']);
      expect(list.getAttribute('role')).toBe('list');
      expect(list.getAttribute('data-enter')).toBe('rise');
      expect(list.getAttribute('data-stagger')).toBe('');
      expect(list.getAttribute('data-view')).toBe('');
      expect(list.getAttribute('data-once')).toBe('');
    });

    it('leaves roles, attributes, and reading and focus order unchanged by the arrival', async () => {
      expect.assertions(5);

      belowTheFold();
      const fixture = TestBed.createComponent(OrderHost);
      await fixture.whenStable();
      const element: unknown = fixture.nativeElement;
      assert.instanceOf(element, HTMLElement);
      const list = element.querySelector('ul');
      assert.exists(list);
      const before = readingShape(list);
      const links = [...list.querySelectorAll('a')];

      expect(list.getAttribute('data-once')).toBe('');

      await scrollIn(list);

      await expect.poll(() => list.hasAttribute('data-once')).toBe(false);

      expect(readingShape(list)).toStrictEqual(before);
      expect([...list.querySelectorAll('a')]).toStrictEqual(links);

      // Focus lands at once, without waiting for the arrival to end.
      const [first] = links;
      assert.exists(first);
      first.focus();

      expect(document.activeElement).toBe(first);
    });
  });
});
