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
import type { YetiGap, YetiHeight } from 'ngx-yeti';
import { YetiBox } from 'ngx-yeti/box';
import { YetiCover } from './cover';
import { YetiCoverChild } from './cover-child';
import { yetiCoverToken } from './cover-tokens';

/** Injects the cover token as `YetiCoverChild` does. */
@Directive({ selector: '[yetiCoverTokenProbe]' })
class CoverTokenProbe {
  readonly cover = inject(yetiCoverToken, {
    optional: true,
    skipSelf: true,
  });
}

@Component({
  selector: 'yeti-cover-host',
  imports: [YetiCover, YetiCoverChild, YetiBox, CoverTokenProbe],
  template:
    '<header #c="yetiCover" yetiCover class="hero" height="md"><h1 #m="yetiCoverChild" yetiCoverChild yetiCoverTokenProbe class="title" center>Trail maps</h1><p>Printed maps.</p></header><header id="shared" yetiCover yetiBox gap="lg"><p yetiCoverChild center>Centred in a box.</p></header><p id="orphan" yetiCoverChild center>Outside every cover.</p>',
})
class CoverHost {
  readonly cover = viewChild.required<YetiCover>('c');
  readonly child = viewChild.required<YetiCoverChild>('m');
  readonly probe = viewChild.required(CoverTokenProbe);
}

async function setupCover(bindings: Binding[] = []) {
  const fixture = TestBed.createDirective(YetiCover, {
    tagName: 'header',
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

async function setupCoverChild(bindings: Binding[] = []) {
  const fixture = TestBed.createDirective(YetiCoverChild, {
    tagName: 'h1',
    bindings,
  });

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);

  return { element, fixture };
}

async function setupHost() {
  const fixture = TestBed.createComponent(CoverHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const cover = element.querySelector('.hero');
  const child = element.querySelector('.title');
  const shared = element.querySelector('#shared');
  const orphan = element.querySelector('#orphan');
  assert.instanceOf(cover, HTMLElement);
  assert.instanceOf(child, HTMLElement);
  assert.instanceOf(shared, HTMLElement);
  assert.instanceOf(orphan, HTMLElement);

  return { child, cover, host: fixture.componentInstance, orphan, shared };
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

/** The names of the package's presence attributes on `element`. */
function presenceAttributes(element: Element): string[] {
  return element
    .getAttributeNames()
    .filter((name) => name.startsWith('data-ngx-yeti-'))
    .toSorted();
}

describe(YetiCover, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiCover, 'header');
  });

  it('renders its class and presence attribute and no unset attribute', async () => {
    expect.assertions(6);

    const { element } = await setupCover();

    expect(element.getAttribute('class')).toBe('cover');
    expect(element.getAttribute('data-ngx-yeti-item-cover')).toBe('');
    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-height')).toBe(false);
    expect(element.hasAttribute('role')).toBe(false);
    expect(element.hasAttribute('tabindex')).toBe(false);
  });

  it('renders each bound input and removes it when unset', async () => {
    expect.assertions(5);

    const gap = signal<YetiGap | undefined>('lg');
    const height = signal<YetiHeight | undefined>('half');
    const { element, fixture } = await setupCover([
      inputBinding('gap', gap),
      inputBinding('height', height),
    ]);

    expect(element.getAttribute('data-gap')).toBe('lg');
    expect(element.getAttribute('data-height')).toBe('half');
    expect(element.hasAttribute('height')).toBe(false);

    gap.set(undefined);
    height.set(undefined);
    await fixture.whenStable();

    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-height')).toBe(false);
  });

  it('holds one item link while it lives and removes it one frame after it is destroyed', async () => {
    expect.assertions(2);

    removeItemLinks();
    const cover = await setupCover();

    expect(itemLinks('cover')).toHaveLength(1);

    cover.destroy();
    await nextFrame();

    expect(itemLinks('cover')).toHaveLength(0);
  });

  it('shares one item link between two covers until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupCover();
    const second = await setupCover();

    expect(itemLinks('cover')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('cover')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('cover')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('resolves the template references', async () => {
      expect.assertions(2);

      const { host } = await setupHost();

      expect(host.cover()).toBeInstanceOf(YetiCover);
      expect(host.child()).toBeInstanceOf(YetiCoverChild);
    });

    it("resolves the cover token in a child to the child's cover", async () => {
      expect.assertions(1);

      const { host } = await setupHost();

      expect(host.probe().cover).toBe(host.cover());
    });

    it('sets center from a static attribute', async () => {
      expect.assertions(1);

      const { child } = await setupHost();

      expect(child.getAttribute('data-center')).toBe('');
    });

    it('keeps a static height beside data-height', async () => {
      expect.assertions(2);

      const { cover } = await setupHost();

      expect(cover.getAttribute('height')).toBe('md');
      expect(cover.getAttribute('data-height')).toBe('md');
    });

    it('renders the marker of a child outside every cover with no error', async () => {
      expect.assertions(2);

      const { orphan } = await setupHost();

      expect(orphan.getAttribute('data-center')).toBe('');
      expect(presenceAttributes(orphan)).toStrictEqual([]);
    });

    it('renders one data-gap and both presence attributes on a cover that is a box', async () => {
      expect.assertions(4);

      const { shared } = await setupHost();

      expect(shared.getAttribute('data-gap')).toBe('lg');
      expect(shared.outerHTML.match(/ data-gap=/g)).toHaveLength(1);
      expect([...shared.classList].toSorted()).toStrictEqual(['box', 'cover']);
      expect(presenceAttributes(shared)).toStrictEqual([
        'data-ngx-yeti-item-box',
        'data-ngx-yeti-item-cover',
      ]);
    });

    it("keeps the consumer's own class on each host and marks only the cover", async () => {
      expect.assertions(4);

      const { child, cover } = await setupHost();

      expect([...cover.classList].toSorted()).toStrictEqual(['cover', 'hero']);
      expect(child.getAttribute('class')).toBe('title');
      expect(presenceAttributes(cover)).toStrictEqual([
        'data-ngx-yeti-item-cover',
      ]);
      expect(presenceAttributes(child)).toStrictEqual([]);
    });
  });
});

describe(YetiCoverChild, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiCoverChild, 'h1');
  });

  it('renders no marker by default', async () => {
    expect.assertions(1);

    const { element } = await setupCoverChild();

    expect(element.hasAttribute('data-center')).toBe(false);
  });

  it('renders data-center when center is bound true and removes it when false', async () => {
    expect.assertions(2);

    const center = signal(true);
    const { element, fixture } = await setupCoverChild([
      inputBinding('center', center),
    ]);

    expect(element.getAttribute('data-center')).toBe('');

    center.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-center')).toBe(false);
  });

  it('carries no presence attribute and loads no item link alone', async () => {
    expect.assertions(2);

    removeItemLinks();
    const { element } = await setupCoverChild([
      inputBinding('center', () => true),
    ]);

    expect(presenceAttributes(element)).toStrictEqual([]);
    expect(itemLinks()).toHaveLength(0);
  });
});
