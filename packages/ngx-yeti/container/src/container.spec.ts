import {
  type Binding,
  Component,
  type Type,
  inputBinding,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { itemLinks, nextFrame, removeItemLinks } from '@ngx-yeti/testing';
import { createDirectiveHost } from '@ngx-yeti/testing/test-bed';
import type { YetiWidth } from 'ngx-yeti';
import { YetiBox } from 'ngx-yeti/box';
import { YetiContainer } from './container';
import { YetiHide } from './container-hide';
import { YetiShow } from './container-show';

@Component({
  selector: 'yeti-container-host',
  imports: [YetiContainer, YetiShow, YetiHide],
  template:
    '<div #c="yetiContainer" yetiContainer class="slot"><p #s="yetiShow" #h="yetiHide" yetiShow="sm" yetiHide="md">A band</p></div>',
})
class ContainerHost {
  readonly container = viewChild.required<YetiContainer>('c');
  readonly show = viewChild.required<YetiShow>('s');
  readonly hide = viewChild.required<YetiHide>('h');
}

@Component({
  selector: 'yeti-container-box-host',
  imports: [YetiContainer, YetiBox],
  template: '<div yetiContainer yetiBox surface="raised"></div>',
})
class ContainerBoxHost {}

async function setupDirective(
  type: Type<unknown>,
  tagName: string,
  bindings: Binding[] = [],
) {
  return createDirectiveHost(type, { tagName, bindings });
}

async function setupHost<T>(type: Type<T>) {
  const fixture = TestBed.createComponent(type);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);

  return { element, fixture };
}

/** Creates the directive alone and checks no listener lands on its host. */
async function expectNoHostListener(
  type: Type<unknown>,
  bindings: Binding[] = [],
): Promise<void> {
  const addEventListener = vi.spyOn(EventTarget.prototype, 'addEventListener');

  try {
    const { element } = await setupDirective(type, 'div', bindings);

    expect(addEventListener.mock.contexts).not.toContain(element);
  } finally {
    addEventListener.mockRestore();
  }
}

const markers = [
  {
    name: 'YetiShow',
    type: YetiShow,
    input: 'yetiShow',
    attribute: 'data-show',
  },
  {
    name: 'YetiHide',
    type: YetiHide,
    input: 'yetiHide',
    attribute: 'data-hide',
  },
] as const;

describe(YetiContainer, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiContainer);
  });

  it('renders its class and presence attribute and no other package attribute', async () => {
    expect.assertions(4);

    const { element } = await setupDirective(YetiContainer, 'div');

    expect(element.getAttribute('class')).toBe('container');
    expect(element.getAttribute('data-ngx-yeti-item-container')).toBe('');
    expect(
      element.getAttributeNames().filter((name) => name.startsWith('data-')),
    ).toStrictEqual(['data-ngx-yeti-item-container']);
    expect(
      ['role', 'tabindex'].filter((name) => element.hasAttribute(name)),
    ).toStrictEqual([]);
  });

  it('holds one item link while it lives and none a frame after it is destroyed', async () => {
    expect.assertions(2);

    removeItemLinks();
    const container = await setupDirective(YetiContainer, 'div');

    expect(itemLinks('container')).toHaveLength(1);

    container.destroy();
    await nextFrame();

    expect(itemLinks('container')).toHaveLength(0);
  });

  it('shares one item link between two containers until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupDirective(YetiContainer, 'div');
    const second = await setupDirective(YetiContainer, 'section');

    expect(itemLinks('container')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('container')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('container')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('resolves the three template references', async () => {
      expect.assertions(3);

      const { fixture } = await setupHost(ContainerHost);
      const host = fixture.componentInstance;

      expect(host.container()).toBeInstanceOf(YetiContainer);
      expect(host.show()).toBeInstanceOf(YetiShow);
      expect(host.hide()).toBeInstanceOf(YetiHide);
    });

    it("keeps the consumer's own class beside container", async () => {
      expect.assertions(1);

      const { element } = await setupHost(ContainerHost);
      const container = element.querySelector('[yetiContainer]');
      assert.exists(container);

      expect([...container.classList].toSorted()).toStrictEqual([
        'container',
        'slot',
      ]);
    });

    it('renders both markers on one element', async () => {
      expect.assertions(3);

      const { element } = await setupHost(ContainerHost);
      const band = element.querySelector('p');
      assert.exists(band);

      expect(band.getAttribute('data-show')).toBe('sm');
      expect(band.getAttribute('data-hide')).toBe('md');
      expect(band.getAttribute('class')).toBeNull();
    });

    it('keeps both presence attributes and both item links on a host shared with yetiBox', async () => {
      expect.assertions(4);

      removeItemLinks();
      const { element } = await setupHost(ContainerBoxHost);
      const host = element.querySelector('div');
      assert.exists(host);

      expect([...host.classList].toSorted()).toStrictEqual([
        'box',
        'container',
      ]);
      expect(
        host
          .getAttributeNames()
          .filter((name) => name.startsWith('data-ngx-yeti-'))
          .toSorted(),
      ).toStrictEqual([
        'data-ngx-yeti-item-box',
        'data-ngx-yeti-item-container',
      ]);
      expect(itemLinks('container')).toHaveLength(1);
      expect(itemLinks('box')).toHaveLength(1);
    });
  });
});

describe.each(markers)('the marker $name', ({ type, input, attribute }) => {
  it(`renders the bound width as ${attribute} and follows the binding`, async () => {
    expect.assertions(2);

    const width = signal<YetiWidth>('md');
    const { element, fixture } = await setupDirective(type, 'p', [
      inputBinding(input, width),
    ]);

    expect(element.getAttribute(attribute)).toBe('md');

    width.set('2xl');
    await fixture.whenStable();

    expect(element.getAttribute(attribute)).toBe('2xl');
  });

  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(type, [
      inputBinding(input, signal<YetiWidth>('sm')),
    ]);
  });

  it('sets no class, no presence attribute, and no item link', async () => {
    expect.assertions(3);

    removeItemLinks();
    const { element } = await setupDirective(type, 'p', [
      inputBinding(input, signal<YetiWidth>('sm')),
    ]);

    expect(element.getAttribute('class')).toBeNull();
    expect(
      element
        .getAttributeNames()
        .filter((name) => name.startsWith('data-ngx-yeti-')),
    ).toStrictEqual([]);
    expect(itemLinks()).toHaveLength(0);
  });
});
