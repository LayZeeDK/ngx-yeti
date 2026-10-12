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
import type { YetiGap, YetiWidth } from 'ngx-yeti';
import { YetiBox } from 'ngx-yeti/box';
import { YetiScroller, type YetiScrollerJustify } from './scroller';

@Component({
  selector: 'yeti-scroller-host',
  imports: [YetiScroller, YetiBox],
  template:
    '<h2 id="trails-heading">Trails</h2><div #s="yetiScroller" id="static" yetiScroller snap width="sm" class="strip" aria-label="Featured articles"><p>One</p></div><section id="labelled" yetiScroller aria-labelledby="trails-heading"><p>One</p></section><div id="boxed" yetiScroller yetiBox gap="lg" aria-label="Boxed"><p>One</p></div><div id="untabbable" yetiScroller tabindex="-1" aria-label="Out of the tab order"><p>One</p></div><div id="looped" yetiScroller aria-label="Looped">@for (item of items; track item) {<p>{{ item }}</p>}</div>',
})
class ScrollerHost {
  readonly scroller = viewChild.required<YetiScroller>('s');
  readonly items = ['One', 'Two', 'Three'];
}

async function setupScroller(bindings: Binding[] = []) {
  return createDirectiveHost(YetiScroller, {
    tagName: 'div',
    bindings,
  });
}

async function setupHost() {
  const fixture = TestBed.createComponent(ScrollerHost);

  await fixture.whenStable();

  const root: unknown = fixture.nativeElement;
  assert.instanceOf(root, HTMLElement);

  function byId(id: string): HTMLElement {
    assert.instanceOf(root, HTMLElement);
    const element = root.querySelector(`#${id}`);
    assert.instanceOf(element, HTMLElement);

    return element;
  }

  return { byId, host: fixture.componentInstance };
}

function boundInputs() {
  return {
    gap: signal<YetiGap | undefined>('sm-lg'),
    width: signal<YetiWidth | undefined>('sm'),
    snap: signal(true),
    justify: signal<YetiScrollerJustify | undefined>('center'),
  };
}

async function setupBound() {
  const inputs = boundInputs();
  const scroller = await setupScroller(
    Object.entries(inputs).map(([name, value]) => inputBinding(name, value)),
  );

  return { ...scroller, inputs };
}

describe(YetiScroller, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    const addEventListener = vi.spyOn(
      EventTarget.prototype,
      'addEventListener',
    );

    try {
      const { element } = await setupScroller();

      expect(addEventListener.mock.contexts).not.toContain(element);
    } finally {
      addEventListener.mockRestore();
    }
  });

  it('renders its class, region role, tab stop, and presence attribute and no unset attribute', async () => {
    expect.assertions(8);

    const { element } = await setupScroller();

    expect(element.getAttribute('class')).toBe('scroller');
    expect(element.getAttribute('role')).toBe('region');
    expect(element.getAttribute('tabindex')).toBe('0');
    expect(element.getAttribute('data-ngx-yeti-item-scroller')).toBe('');
    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-width')).toBe(false);
    expect(element.hasAttribute('data-snap')).toBe(false);
    expect(element.hasAttribute('data-justify')).toBe(false);
  });

  it('renders no other package attribute and no name', async () => {
    expect.assertions(3);

    const { element } = await setupScroller();

    expect(
      element
        .getAttributeNames()
        .filter((name) => name.startsWith('data-'))
        .toSorted(),
    ).toStrictEqual(['data-ngx-yeti-item-scroller']);
    expect(element.hasAttribute('aria-label')).toBe(false);
    expect(element.hasAttribute('width')).toBe(false);
  });

  it('renders each bound input and updates it', async () => {
    expect.assertions(8);

    const { element, fixture, inputs } = await setupBound();

    expect(element.getAttribute('data-gap')).toBe('sm-lg');
    expect(element.getAttribute('data-width')).toBe('sm');
    expect(element.getAttribute('data-snap')).toBe('');
    expect(element.getAttribute('data-justify')).toBe('center');

    inputs.gap.set('xl');
    inputs.width.set('lg');
    inputs.justify.set('end');
    await fixture.whenStable();

    expect(element.getAttribute('data-gap')).toBe('xl');
    expect(element.getAttribute('data-width')).toBe('lg');
    expect(element.getAttribute('data-justify')).toBe('end');
    expect(element.hasAttribute('width')).toBe(false);
  });

  it('removes each bound attribute when its input is unset or false', async () => {
    expect.assertions(4);

    const { element, fixture, inputs } = await setupBound();

    inputs.gap.set(undefined);
    inputs.width.set(undefined);
    inputs.snap.set(false);
    inputs.justify.set(undefined);
    await fixture.whenStable();

    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-width')).toBe(false);
    expect(element.hasAttribute('data-snap')).toBe(false);
    expect(element.hasAttribute('data-justify')).toBe(false);
  });

  it('loads one item link while it lives and removes it a frame after destroy', async () => {
    expect.assertions(2);

    removeItemLinks();
    const { destroy } = await setupScroller();

    expect(itemLinks('scroller')).toHaveLength(1);

    destroy();
    await nextFrame();

    expect(itemLinks('scroller')).toHaveLength(0);
  });

  it('shares one item link between two scrollers until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupScroller();
    const second = await setupScroller();

    expect(itemLinks('scroller')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('scroller')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('scroller')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('resolves the template reference', async () => {
      expect.assertions(1);

      const { host } = await setupHost();

      expect(host.scroller()).toBeInstanceOf(YetiScroller);
    });

    it('sets snap from a bare attribute and keeps a static width beside data-width', async () => {
      expect.assertions(3);

      const { byId } = await setupHost();
      const scroller = byId('static');

      expect(scroller.getAttribute('data-snap')).toBe('');
      expect(scroller.getAttribute('data-width')).toBe('sm');
      expect(scroller.getAttribute('width')).toBe('sm');
    });

    it("keeps the consumer's own class, aria-label, and aria-labelledby", async () => {
      expect.assertions(4);

      const { byId } = await setupHost();
      const labelled = byId('labelled');

      expect([...byId('static').classList].toSorted()).toStrictEqual([
        'scroller',
        'strip',
      ]);
      expect(byId('static').getAttribute('aria-label')).toBe(
        'Featured articles',
      );
      expect(labelled.getAttribute('aria-labelledby')).toBe('trails-heading');
      expect(labelled.getAttribute('role')).toBe('region');
    });

    it('renders one data-gap and both presence attributes beside yetiBox', async () => {
      expect.assertions(4);

      const { byId } = await setupHost();
      const boxed = byId('boxed');

      expect(boxed.getAttribute('data-gap')).toBe('lg');
      expect(boxed.getAttribute('data-ngx-yeti-item-scroller')).toBe('');
      expect(boxed.getAttribute('data-ngx-yeti-item-box')).toBe('');
      expect([...boxed.classList].toSorted()).toStrictEqual([
        'box',
        'scroller',
      ]);
    });

    // Angular merges the template's static attributes after the directive's
    // host attributes, which is why usage rule 3 forbids writing tabindex.
    it("lets a consumer's static tabindex replace the directive's", async () => {
      expect.assertions(2);

      const { byId } = await setupHost();
      const untabbable = byId('untabbable');

      expect(untabbable.getAttribute('tabindex')).toBe('-1');
      expect(untabbable.getAttribute('role')).toBe('region');
    });

    it('makes the elements an @for renders its direct children', async () => {
      expect.assertions(1);

      const { byId } = await setupHost();

      expect(
        [...byId('looped').children].map((child) => child.textContent.trim()),
      ).toStrictEqual(['One', 'Two', 'Three']);
    });
  });
});
