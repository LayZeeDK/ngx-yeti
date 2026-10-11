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
import type { YetiGap } from 'ngx-yeti';
import { YetiBox } from 'ngx-yeti/box';
import { YetiStack } from 'ngx-yeti/stack';
import { YetiOverlay } from './overlay';
import { YetiOverlayChild } from './overlay-child';
import { yetiOverlayToken } from './overlay-tokens';

/** Injects the overlay token as `YetiOverlayChild` does. */
@Directive({ selector: '[yetiOverlayTokenProbe]' })
class OverlayTokenProbe {
  readonly overlay = inject(yetiOverlayToken, {
    optional: true,
    skipSelf: true,
  });
}

@Component({
  selector: 'yeti-overlay-host',
  imports: [
    YetiOverlay,
    YetiOverlayChild,
    OverlayTokenProbe,
    YetiBox,
    YetiStack,
  ],
  template:
    '<div #o="yetiOverlay" id="overlay" yetiOverlay class="frame" fixed><p>Underneath</p><p #h="yetiOverlayChild" id="held" yetiOverlayChild yetiOverlayTokenProbe class="stamp" over fill>Held</p></div><div yetiOverlay><p>Underneath</p><svg id="svg-filled" yetiOverlayChild over fill width="20" height="20" aria-hidden="true"><circle id="circle-filled" cx="10" cy="10" r="10" /></svg></div><svg id="svg-plain" width="20" height="20" aria-hidden="true"><circle id="circle-plain" cx="10" cy="10" r="10" /></svg><p id="outside" yetiOverlayChild over fill>Outside</p><div id="boxed" yetiOverlay yetiBox gap="lg"><p>Underneath</p></div><div yetiOverlay><div id="stacked" yetiStack yetiOverlayChild over fill><p>Veil</p></div></div>',
})
class OverlayHost {
  readonly overlay = viewChild.required<YetiOverlay>('o');
  readonly held = viewChild.required<YetiOverlayChild>('h');
  readonly probe = viewChild.required(OverlayTokenProbe);
}

async function setupOverlay(bindings: Binding[] = []) {
  const fixture = TestBed.createDirective(YetiOverlay, {
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

async function setupOverlayChild(bindings: Binding[] = []) {
  const fixture = TestBed.createDirective(YetiOverlayChild, {
    tagName: 'p',
    bindings,
  });

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);

  return { element, fixture };
}

async function setupHost() {
  const fixture = TestBed.createComponent(OverlayHost);

  await fixture.whenStable();

  const root: unknown = fixture.nativeElement;
  assert.instanceOf(root, HTMLElement);

  /** The element with the given id in the host's template. */
  function byId(id: string): Element {
    const element =
      root instanceof HTMLElement ? root.querySelector(`#${id}`) : null;
    assert.exists(element);

    return element;
  }

  return { byId, host: fixture.componentInstance };
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

describe(YetiOverlay, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiOverlay, 'div');
  });

  it('renders its class and presence attribute and no unset attribute', async () => {
    expect.assertions(7);

    const { element } = await setupOverlay();

    expect(element.getAttribute('class')).toBe('overlay');
    expect(element.getAttribute('data-ngx-yeti-item-overlay')).toBe('');
    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-fixed')).toBe(false);
    expect(element.hasAttribute('inert')).toBe(false);
    expect(element.hasAttribute('role')).toBe(false);
    expect(element.hasAttribute('tabindex')).toBe(false);
  });

  it('renders each bound input and removes it when unset', async () => {
    expect.assertions(4);

    const gap = signal<YetiGap | undefined>('lg');
    const fixed = signal(true);
    const { element, fixture } = await setupOverlay([
      inputBinding('gap', gap),
      inputBinding('fixed', fixed),
    ]);

    expect(element.getAttribute('data-gap')).toBe('lg');
    expect(element.getAttribute('data-fixed')).toBe('');

    gap.set(undefined);
    fixed.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-fixed')).toBe(false);
  });

  it('keeps one item link while an overlay lives and removes it one frame after destroy', async () => {
    expect.assertions(2);

    removeItemLinks();
    const overlay = await setupOverlay();

    expect(itemLinks('overlay')).toHaveLength(1);

    overlay.destroy();
    await nextFrame();

    expect(itemLinks('overlay')).toHaveLength(0);
  });

  it('shares one item link between two overlays until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupOverlay();
    const second = await setupOverlay();

    expect(itemLinks('overlay')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('overlay')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('overlay')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('resolves the template references', async () => {
      expect.assertions(2);

      const { host } = await setupHost();

      expect(host.overlay()).toBeInstanceOf(YetiOverlay);
      expect(host.held()).toBeInstanceOf(YetiOverlayChild);
    });

    it('resolves the overlay token on the held child to the enclosing overlay', async () => {
      expect.assertions(1);

      const { host } = await setupHost();

      expect(host.probe().overlay).toBe(host.overlay());
    });

    it('sets the inputs from static fixed, over, and fill', async () => {
      expect.assertions(3);

      const { byId } = await setupHost();

      expect(byId('overlay').getAttribute('data-fixed')).toBe('');
      expect(byId('held').getAttribute('data-over')).toBe('');
      expect(byId('held').getAttribute('data-fill')).toBe('');
    });

    it('keeps a static fill beside data-fill on a p and on an svg', async () => {
      expect.assertions(4);

      const { byId } = await setupHost();

      for (const id of ['held', 'svg-filled']) {
        expect(byId(id).getAttribute('fill')).toBe('');
        expect(byId(id).getAttribute('data-fill')).toBe('');
      }
    });

    it("leaves an svg held child's paint as an svg without fill has it", async () => {
      expect.assertions(1);

      const { byId } = await setupHost();

      expect(getComputedStyle(byId('circle-filled')).fill).toBe(
        getComputedStyle(byId('circle-plain')).fill,
      );
    });

    it('renders the markers of a child outside any overlay', async () => {
      expect.assertions(2);

      const { byId } = await setupHost();

      expect(byId('outside').getAttribute('data-over')).toBe('');
      expect(byId('outside').getAttribute('data-fill')).toBe('');
    });

    it('renders one data-gap and both presence attributes for yetiOverlay with yetiBox', async () => {
      expect.assertions(4);

      const { byId } = await setupHost();
      const boxed = byId('boxed');

      expect(boxed.getAttribute('data-gap')).toBe('lg');
      expect(boxed.getAttribute('data-ngx-yeti-item-overlay')).toBe('');
      expect(boxed.getAttribute('data-ngx-yeti-item-box')).toBe('');
      expect([...boxed.classList].toSorted()).toStrictEqual(['box', 'overlay']);
    });

    it('renders one data-fill for yetiStack with a filled yetiOverlayChild', async () => {
      expect.assertions(2);

      const { byId } = await setupHost();
      const stacked = byId('stacked');

      expect(stacked.getAttribute('data-fill')).toBe('');
      expect(
        stacked.getAttributeNames().filter((name) => name === 'data-fill'),
      ).toHaveLength(1);
    });

    it("keeps the consumer's own class on each host", async () => {
      expect.assertions(2);

      const { byId } = await setupHost();

      expect([...byId('overlay').classList].toSorted()).toStrictEqual([
        'frame',
        'overlay',
      ]);
      expect(byId('held').getAttribute('class')).toBe('stamp');
    });
  });
});

describe(YetiOverlayChild, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiOverlayChild, 'p');
  });

  it('renders no marker by default', async () => {
    expect.assertions(2);

    const { element } = await setupOverlayChild();

    expect(element.hasAttribute('data-over')).toBe(false);
    expect(element.hasAttribute('data-fill')).toBe(false);
  });

  it('renders each bound marker, removes it when false, and writes no fill attribute', async () => {
    expect.assertions(6);

    const over = signal(true);
    const fill = signal(true);
    const { element, fixture } = await setupOverlayChild([
      inputBinding('over', over),
      inputBinding('fill', fill),
    ]);

    expect(element.getAttribute('data-over')).toBe('');
    expect(element.getAttribute('data-fill')).toBe('');
    expect(element.hasAttribute('fill')).toBe(false);

    over.set(false);
    fill.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-over')).toBe(false);
    expect(element.hasAttribute('data-fill')).toBe(false);
    expect(element.hasAttribute('fill')).toBe(false);
  });

  it('carries no class, presence attribute, inert, or aria-hidden, and loads no item link alone', async () => {
    expect.assertions(5);

    removeItemLinks();
    const { element } = await setupOverlayChild([
      inputBinding('over', () => true),
    ]);

    expect(element.hasAttribute('class')).toBe(false);
    expect(
      element
        .getAttributeNames()
        .filter((name) => name.startsWith('data-ngx-yeti-')),
    ).toStrictEqual([]);
    expect(element.hasAttribute('inert')).toBe(false);
    expect(element.hasAttribute('aria-hidden')).toBe(false);
    expect(itemLinks()).toHaveLength(0);
  });
});
