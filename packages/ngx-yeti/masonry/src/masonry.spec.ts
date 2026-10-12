import {
  type Binding,
  Component,
  inputBinding,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { itemLinks, nextFrame, removeItemLinks } from '@ngx-yeti/testing';
import { createDirectiveHost } from '@ngx-yeti/testing/test-bed';
import type { YetiColumns, YetiGap, YetiWidthOrNone } from 'ngx-yeti';
import { YetiBox } from 'ngx-yeti/box';
import { YetiMasonry } from './masonry';

@Component({
  selector: 'yeti-masonry-host',
  imports: [YetiMasonry, YetiBox],
  template:
    '<div #m="yetiMasonry" yetiMasonry class="wall" min="xs"><p>One</p><p>Two</p></div><section yetiMasonry yetiBox gap="lg"><p>Three</p><p>Four</p></section>',
})
class MasonryHost {
  readonly masonry = viewChild.required<YetiMasonry>('m');
}

async function setupMasonry(bindings: Binding[] = []) {
  return createDirectiveHost(YetiMasonry, {
    tagName: 'div',
    bindings,
  });
}

async function setupHost() {
  const fixture = TestBed.createComponent(MasonryHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const wall = element.querySelector('div');
  const shared = element.querySelector('section');
  assert.exists(wall);
  assert.exists(shared);

  return { host: fixture.componentInstance, shared, wall };
}

describe(YetiMasonry, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    const addEventListener = vi.spyOn(
      EventTarget.prototype,
      'addEventListener',
    );

    try {
      const { element } = await setupMasonry();

      expect(addEventListener.mock.contexts).not.toContain(element);
    } finally {
      addEventListener.mockRestore();
    }
  });

  it('renders its class and presence attribute and no unset attribute', async () => {
    expect.assertions(6);

    const { element } = await setupMasonry();

    expect(element.getAttribute('class')).toBe('masonry');
    expect(element.getAttribute('data-ngx-yeti-item-masonry')).toBe('');
    expect(element.hasAttribute('data-min')).toBe(false);
    expect(element.hasAttribute('data-columns')).toBe(false);
    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('role')).toBe(false);
  });

  it('renders each bound input, updates it, and removes it when unset', async () => {
    expect.assertions(9);

    const inputs = {
      min: signal<YetiWidthOrNone | undefined>('xs'),
      columns: signal<YetiColumns | undefined>('3'),
      gap: signal<YetiGap | undefined>('sm-lg'),
    };
    const { element, fixture } = await setupMasonry(
      Object.entries(inputs).map(([name, value]) => inputBinding(name, value)),
    );

    expect(element.getAttribute('data-min')).toBe('xs');
    expect(element.getAttribute('data-columns')).toBe('3');
    expect(element.getAttribute('data-gap')).toBe('sm-lg');

    inputs.min.set('none');
    inputs.columns.set('2');
    inputs.gap.set('lg');
    await fixture.whenStable();

    expect(element.getAttribute('data-min')).toBe('none');
    expect(element.getAttribute('data-columns')).toBe('2');
    expect(element.getAttribute('data-gap')).toBe('lg');

    inputs.min.set(undefined);
    inputs.columns.set(undefined);
    inputs.gap.set(undefined);
    await fixture.whenStable();

    expect(element.hasAttribute('data-min')).toBe(false);
    expect(element.hasAttribute('data-columns')).toBe(false);
    expect(element.hasAttribute('data-gap')).toBe(false);
  });

  it('holds one item link while it lives and removes it a frame after destroy', async () => {
    expect.assertions(2);

    removeItemLinks();
    const masonry = await setupMasonry();

    expect(itemLinks('masonry')).toHaveLength(1);

    masonry.destroy();
    await nextFrame();

    expect(itemLinks('masonry')).toHaveLength(0);
  });

  it('shares one item link between two layouts until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupMasonry();
    const second = await setupMasonry();

    expect(itemLinks('masonry')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('masonry')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('masonry')).toHaveLength(0);
  });

  it('provides nothing on its host but itself', async () => {
    expect.assertions(1);

    const fixture = TestBed.createComponent(MasonryHost);
    await fixture.whenStable();
    const wall = fixture.debugElement.query(By.css('div'));

    expect(wall.providerTokens).toStrictEqual([YetiMasonry]);
  });

  describe('in a template', () => {
    it('resolves the template reference', async () => {
      expect.assertions(1);

      const { host } = await setupHost();

      expect(host.masonry()).toBeInstanceOf(YetiMasonry);
    });

    it("keeps the consumer's class beside masonry and the static min beside data-min", async () => {
      expect.assertions(3);

      const { wall } = await setupHost();

      expect([...wall.classList].toSorted()).toStrictEqual(['masonry', 'wall']);
      expect(wall.getAttribute('min')).toBe('xs');
      expect(wall.getAttribute('data-min')).toBe('xs');
    });

    it('feeds one static gap to masonry and box on one element, with both presence attributes', async () => {
      expect.assertions(4);

      const { shared } = await setupHost();

      expect(shared.getAttribute('data-gap')).toBe('lg');
      expect(shared.getAttribute('data-ngx-yeti-item-masonry')).toBe('');
      expect(shared.getAttribute('data-ngx-yeti-item-box')).toBe('');
      expect([...shared.classList].toSorted()).toStrictEqual([
        'box',
        'masonry',
      ]);
    });
  });
});
