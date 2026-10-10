import {
  type Binding,
  Component,
  Directive,
  type Type,
  inject,
  inputBinding,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { itemLinks, nextFrame, removeItemLinks } from '@ngx-yeti/testing';
import type { YetiAlign, YetiGap } from 'ngx-yeti';
import { YetiStack } from './stack';
import { YetiStackChild } from './stack-child';
import { yetiStackToken } from './stack-tokens';

/** Injects the stack token as `YetiStackChild` does. */
@Directive({ selector: '[yetiStackTokenProbe]' })
class StackTokenProbe {
  readonly stack = inject(yetiStackToken, { optional: true, skipSelf: true });
}

@Component({
  selector: 'yeti-stack-host',
  imports: [YetiStack, YetiStackChild, StackTokenProbe],
  template:
    '<ul #s="yetiStack" yetiStack class="trails" role="list" align="center" fill rule><li #c="yetiStackChild" yetiStackChild class="note" role="listitem" split sticky>Hills</li><li #n="yetiStack" yetiStack yetiStackChild yetiStackTokenProbe gap="sm" space="xl">Lakes</li></ul><p #o="yetiStackChild" yetiStackChild split space="lg" sticky>Outside</p>',
})
class StackHost {
  readonly stack = viewChild.required<YetiStack>('s');
  readonly child = viewChild.required<YetiStackChild>('c');
  readonly nested = viewChild.required<YetiStack>('n');
  readonly probe = viewChild.required(StackTokenProbe);
  readonly outside = viewChild.required<YetiStackChild>('o');
}

async function setupStack(bindings: Binding[] = []) {
  const fixture = TestBed.createDirective(YetiStack, {
    tagName: 'div',
    bindings,
  });

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);

  /** Destroys the fixture and takes its host out of the document. */
  function destroy(): void {
    assert.instanceOf(element, HTMLElement);
    fixture.destroy();
    element.remove();
  }

  return { destroy, element, fixture };
}

async function setupStackChild(bindings: Binding[] = []) {
  const fixture = TestBed.createDirective(YetiStackChild, {
    tagName: 'p',
    bindings,
  });

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);

  return { element, fixture };
}

async function setupHost() {
  const fixture = TestBed.createComponent(StackHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const list = element.querySelector('ul');
  const [child, nested] = element.querySelectorAll('li');
  const outside = element.querySelector('p');
  assert.exists(list);
  assert.exists(child);
  assert.exists(nested);
  assert.exists(outside);

  return { child, host: fixture.componentInstance, list, nested, outside };
}

/** Creates the directive alone and checks no listener lands on its host. */
async function expectNoHostListener(
  type: Type<unknown>,
  tagName: string,
): Promise<void> {
  const addEventListener = vi.spyOn(EventTarget.prototype, 'addEventListener');

  try {
    const fixture = TestBed.createDirective(type, { tagName });
    await fixture.whenStable();
    const element: unknown = fixture.nativeElement;

    expect(addEventListener.mock.contexts).not.toContain(element);
  } finally {
    addEventListener.mockRestore();
  }
}

describe(YetiStack, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiStack, 'div');
  });

  it('renders its class and presence attribute and no unset attribute', async () => {
    expect.assertions(8);

    const { element } = await setupStack();

    expect(element.getAttribute('class')).toBe('stack');
    expect(element.getAttribute('data-ngx-yeti-item-stack')).toBe('');
    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-align')).toBe(false);
    expect(element.hasAttribute('data-fill')).toBe(false);
    expect(element.hasAttribute('data-rule')).toBe(false);
    expect(element.hasAttribute('align')).toBe(false);
    expect(element.hasAttribute('role')).toBe(false);
  });

  it('renders each bound input, removes it when unset, and never writes align', async () => {
    expect.assertions(10);

    const inputs = {
      gap: signal<YetiGap | undefined>('sm-lg'),
      align: signal<YetiAlign | undefined>('start'),
      fill: signal(true),
      rule: signal(true),
    };
    const { element, fixture } = await setupStack(
      Object.entries(inputs).map(([name, value]) => inputBinding(name, value)),
    );

    expect(element.getAttribute('data-gap')).toBe('sm-lg');
    expect(element.getAttribute('data-align')).toBe('start');
    expect(element.getAttribute('data-fill')).toBe('');
    expect(element.getAttribute('data-rule')).toBe('');
    expect(element.hasAttribute('align')).toBe(false);

    inputs.gap.set(undefined);
    inputs.align.set(undefined);
    inputs.fill.set(false);
    inputs.rule.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-align')).toBe(false);
    expect(element.hasAttribute('data-fill')).toBe(false);
    expect(element.hasAttribute('data-rule')).toBe(false);
    expect(element.hasAttribute('align')).toBe(false);
  });

  it('shares one item link between two stacks until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupStack();
    const second = await setupStack();

    expect(itemLinks('stack')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('stack')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('stack')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('resolves the template references', async () => {
      expect.assertions(3);

      const { host } = await setupHost();

      expect(host.stack()).toBeInstanceOf(YetiStack);
      expect(host.child()).toBeInstanceOf(YetiStackChild);
      expect(host.outside()).toBeInstanceOf(YetiStackChild);
    });

    it('sets inputs from static fill, rule, split, and sticky', async () => {
      expect.assertions(4);

      const { child, list } = await setupHost();

      expect(list.getAttribute('data-fill')).toBe('');
      expect(list.getAttribute('data-rule')).toBe('');
      expect(child.getAttribute('data-split')).toBe('');
      expect(child.getAttribute('data-sticky')).toBe('');
    });

    it('keeps a static fill beside data-fill', async () => {
      expect.assertions(2);

      const { list } = await setupHost();

      expect(list.getAttribute('fill')).toBe('');
      expect(list.getAttribute('data-fill')).toBe('');
    });

    it('renders a static align on data-align only, and leaves the text start-aligned', async () => {
      expect.assertions(3);

      const { list } = await setupHost();

      expect(list.getAttribute('data-align')).toBe('center');
      expect(list.hasAttribute('align')).toBe(false);
      expect(getComputedStyle(list).textAlign).toBe('start');
    });

    it('renders both directives on an element that is a stack and a stack child', async () => {
      expect.assertions(4);

      const { nested } = await setupHost();

      expect(nested.classList.contains('stack')).toBe(true);
      expect(nested.getAttribute('data-ngx-yeti-item-stack')).toBe('');
      expect(nested.getAttribute('data-gap')).toBe('sm');
      expect(nested.getAttribute('data-space')).toBe('xl');
    });

    it('resolves the stack token on a nested stack to the outer stack, not itself', async () => {
      expect.assertions(2);

      const { host } = await setupHost();

      expect(host.probe().stack).toBe(host.stack());
      expect(host.probe().stack).not.toBe(host.nested());
    });

    it('renders the markers of a child outside any stack', async () => {
      expect.assertions(3);

      const { outside } = await setupHost();

      expect(outside.getAttribute('data-split')).toBe('');
      expect(outside.getAttribute('data-space')).toBe('lg');
      expect(outside.getAttribute('data-sticky')).toBe('');
    });

    it("keeps the consumer's own class and role on each host", async () => {
      expect.assertions(4);

      const { child, list } = await setupHost();

      expect([...list.classList].toSorted()).toStrictEqual(['stack', 'trails']);
      expect(list.getAttribute('role')).toBe('list');
      expect(child.getAttribute('class')).toBe('note');
      expect(child.getAttribute('role')).toBe('listitem');
    });
  });
});

describe(YetiStackChild, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiStackChild, 'p');
  });

  it('renders no marker by default', async () => {
    expect.assertions(3);

    const { element } = await setupStackChild();

    expect(element.hasAttribute('data-split')).toBe(false);
    expect(element.hasAttribute('data-space')).toBe(false);
    expect(element.hasAttribute('data-sticky')).toBe(false);
  });

  it('renders each bound marker and removes it when unset', async () => {
    expect.assertions(6);

    const inputs = {
      split: signal(true),
      space: signal<YetiGap | undefined>('xl'),
      sticky: signal(true),
    };
    const { element, fixture } = await setupStackChild(
      Object.entries(inputs).map(([name, value]) => inputBinding(name, value)),
    );

    expect(element.getAttribute('data-split')).toBe('');
    expect(element.getAttribute('data-space')).toBe('xl');
    expect(element.getAttribute('data-sticky')).toBe('');

    inputs.split.set(false);
    inputs.space.set(undefined);
    inputs.sticky.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-split')).toBe(false);
    expect(element.hasAttribute('data-space')).toBe(false);
    expect(element.hasAttribute('data-sticky')).toBe(false);
  });

  it('carries no presence attribute and loads no item link alone', async () => {
    expect.assertions(2);

    removeItemLinks();
    const { element } = await setupStackChild([
      inputBinding('split', () => true),
    ]);

    expect(
      element
        .getAttributeNames()
        .filter((name) => name.startsWith('data-ngx-yeti-')),
    ).toStrictEqual([]);
    expect(itemLinks()).toHaveLength(0);
  });
});
