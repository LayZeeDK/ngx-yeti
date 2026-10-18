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
import { createDirectiveHost } from '@ngx-yeti/testing/test-bed';
import type { YetiAlign, YetiSelf } from 'ngx-yeti';
import { YetiLayer } from './layer';
import { YetiLayerChild } from './layer-child';
import { yetiLayerToken } from './layer-tokens';

/** Injects the layer token as `YetiLayerChild` does. */
@Directive({ selector: '[yetiLayerTokenProbe]' })
class LayerTokenProbe {
  readonly layer = inject(yetiLayerToken, { optional: true, skipSelf: true });
}

@Component({
  selector: 'yeti-layer-host',
  imports: [YetiLayer, YetiLayerChild, LayerTokenProbe],
  template:
    '<figure #l="yetiLayer" yetiLayer class="hero" align="end"><div>Base</div><figcaption #c="yetiLayerChild" yetiLayerChild yetiLayerTokenProbe class="caption" alignSelf="end" justifySelf="center">Dawn</figcaption></figure><span #o="yetiLayerChild" yetiLayerChild alignSelf="start" justifySelf="end">Outside</span>',
})
class LayerHost {
  readonly layer = viewChild.required<YetiLayer>('l');
  readonly child = viewChild.required<YetiLayerChild>('c');
  readonly outside = viewChild.required<YetiLayerChild>('o');
  readonly probe = viewChild.required(LayerTokenProbe);
}

async function setupLayer(bindings: Binding[] = []) {
  return createDirectiveHost(YetiLayer, {
    tagName: 'figure',
    bindings,
  });
}

async function setupLayerChild(bindings: Binding[] = []) {
  return createDirectiveHost(YetiLayerChild, {
    tagName: 'span',
    bindings,
  });
}

async function setupHost() {
  const fixture = TestBed.createComponent(LayerHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const figure = element.querySelector('figure');
  const caption = element.querySelector('figcaption');
  const outside = element.querySelector('span');
  assert.exists(figure);
  assert.exists(caption);
  assert.exists(outside);

  return { caption, figure, host: fixture.componentInstance, outside };
}

/** Creates the directive alone and checks no listener lands on its host. */
async function expectNoHostListener(
  type: Type<unknown>,
  tagName: string,
): Promise<void> {
  const addEventListener = vi.spyOn(EventTarget.prototype, 'addEventListener');

  try {
    const { element } = await createDirectiveHost(type, { tagName });

    expect(addEventListener.mock.contexts).not.toContain(element);
  } finally {
    addEventListener.mockRestore();
  }
}

describe(YetiLayer, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiLayer, 'figure');
  });

  it('renders its class and presence attribute and no unset attribute', async () => {
    expect.assertions(6);

    const { element } = await setupLayer();

    expect(element.getAttribute('class')).toBe('layer');
    expect(element.getAttribute('data-ngx-yeti-item-layer')).toBe('');
    expect(element.hasAttribute('data-align')).toBe(false);
    expect(element.hasAttribute('align')).toBe(false);
    expect(element.hasAttribute('role')).toBe(false);
    expect(element.hasAttribute('tabindex')).toBe(false);
  });

  it('renders a bound align on data-align, removes it when unset, and never writes align', async () => {
    expect.assertions(4);

    const align = signal<YetiAlign | undefined>('end');
    const { element, fixture } = await setupLayer([
      inputBinding('align', align),
    ]);

    expect(element.getAttribute('data-align')).toBe('end');
    expect(element.hasAttribute('align')).toBe(false);

    align.set(undefined);
    await fixture.whenStable();

    expect(element.hasAttribute('data-align')).toBe(false);
    expect(element.hasAttribute('align')).toBe(false);
  });

  it('keeps one item link while a layer lives and removes it one frame after destroy', async () => {
    expect.assertions(2);

    removeItemLinks();
    const layer = await setupLayer();

    expect(itemLinks('layer')).toHaveLength(1);

    layer.destroy();
    await nextFrame();

    expect(itemLinks('layer')).toHaveLength(0);
  });

  it('shares one item link between two layers until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupLayer();
    const second = await setupLayer();

    expect(itemLinks('layer')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('layer')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('layer')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('resolves the template references', async () => {
      expect.assertions(3);

      const { host } = await setupHost();

      expect(host.layer()).toBeInstanceOf(YetiLayer);
      expect(host.child()).toBeInstanceOf(YetiLayerChild);
      expect(host.outside()).toBeInstanceOf(YetiLayerChild);
    });

    it('renders a static align on data-align only, and leaves the text start-aligned', async () => {
      expect.assertions(3);

      const { figure } = await setupHost();

      expect(figure.getAttribute('data-align')).toBe('end');
      expect(figure.hasAttribute('align')).toBe(false);
      expect(getComputedStyle(figure).textAlign).toBe('start');
    });

    it('sets the inputs from static alignSelf and justifySelf', async () => {
      expect.assertions(2);

      const { caption } = await setupHost();

      expect(caption.getAttribute('data-align-self')).toBe('end');
      expect(caption.getAttribute('data-justify-self')).toBe('center');
    });

    it('resolves the layer token on a child to the enclosing layer', async () => {
      expect.assertions(1);

      const { host } = await setupHost();

      expect(host.probe().layer).toBe(host.layer());
    });

    it('renders the markers of a child outside any layer', async () => {
      expect.assertions(2);

      const { outside } = await setupHost();

      expect(outside.getAttribute('data-align-self')).toBe('start');
      expect(outside.getAttribute('data-justify-self')).toBe('end');
    });

    it("keeps the consumer's own class on each host", async () => {
      expect.assertions(2);

      const { caption, figure } = await setupHost();

      expect([...figure.classList].toSorted()).toStrictEqual(['hero', 'layer']);
      expect(caption.getAttribute('class')).toBe('caption');
    });
  });
});

describe(YetiLayerChild, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiLayerChild, 'span');
  });

  it('renders no marker by default', async () => {
    expect.assertions(2);

    const { element } = await setupLayerChild();

    expect(element.hasAttribute('data-align-self')).toBe(false);
    expect(element.hasAttribute('data-justify-self')).toBe(false);
  });

  it('renders each bound marker and removes it when unset', async () => {
    expect.assertions(4);

    const alignSelf = signal<YetiAlign | undefined>('start');
    const justifySelf = signal<YetiSelf | undefined>('end');
    const { element, fixture } = await setupLayerChild([
      inputBinding('alignSelf', alignSelf),
      inputBinding('justifySelf', justifySelf),
    ]);

    expect(element.getAttribute('data-align-self')).toBe('start');
    expect(element.getAttribute('data-justify-self')).toBe('end');

    alignSelf.set(undefined);
    justifySelf.set(undefined);
    await fixture.whenStable();

    expect(element.hasAttribute('data-align-self')).toBe(false);
    expect(element.hasAttribute('data-justify-self')).toBe(false);
  });

  it('carries no presence attribute and loads no item link alone', async () => {
    expect.assertions(2);

    removeItemLinks();
    const { element } = await setupLayerChild([
      inputBinding('alignSelf', () => 'end'),
    ]);

    expect(
      element
        .getAttributeNames()
        .filter((name) => name.startsWith('data-ngx-yeti-')),
    ).toStrictEqual([]);
    expect(itemLinks()).toHaveLength(0);
  });
});
