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
import type { YetiGap, YetiWidth } from 'ngx-yeti';
import { YetiBox } from 'ngx-yeti/box';
import { YetiBreakout } from './breakout';
import { YetiBreakoutChild } from './breakout-child';
import { YetiBreakoutNote } from './breakout-note';
import { yetiBreakoutToken } from './breakout-tokens';

/** Injects the breakout token as the part directives do. */
@Directive({ selector: '[yetiBreakoutTokenProbe]' })
class BreakoutTokenProbe {
  readonly breakout = inject(yetiBreakoutToken, {
    optional: true,
    skipSelf: true,
  });
}

@Component({
  selector: 'yeti-breakout-host',
  imports: [YetiBreakout, YetiBreakoutChild, YetiBreakoutNote, YetiBox],
  template:
    '<article #b="yetiBreakout" yetiBreakout yetiBox class="read" max="lg"><h1>A long read</h1><figure #c="yetiBreakoutChild" yetiBreakoutChild class="wide" bleed>A picture</figure><p>A paragraph.</p><aside #n="yetiBreakoutNote" yetiBreakoutNote class="aside">A note.</aside></article><figure #o="yetiBreakoutChild" yetiBreakoutChild bleed>Outside</figure><aside yetiBreakoutNote>Outside too</aside>',
})
class BreakoutHost {
  readonly breakout = viewChild.required<YetiBreakout>('b');
  readonly child = viewChild.required<YetiBreakoutChild>('c');
  readonly note = viewChild.required<YetiBreakoutNote>('n');
  readonly outside = viewChild.required<YetiBreakoutChild>('o');
}

@Component({
  selector: 'yeti-breakout-probe-host',
  imports: [YetiBreakout, YetiBreakoutChild, BreakoutTokenProbe],
  template:
    '<article #b="yetiBreakout" yetiBreakout><section #n="yetiBreakout" yetiBreakout yetiBreakoutChild yetiBreakoutTokenProbe><p>Nested</p></section></article>',
})
class BreakoutProbeHost {
  readonly breakout = viewChild.required<YetiBreakout>('b');
  readonly nested = viewChild.required<YetiBreakout>('n');
  readonly probe = viewChild.required(BreakoutTokenProbe);
}

async function setupBreakout(bindings: Binding[] = []) {
  return createDirectiveHost(YetiBreakout, {
    tagName: 'article',
    bindings,
  });
}

async function setupPart(
  type: Type<unknown>,
  tagName: string,
  bindings: Binding[] = [],
) {
  return createDirectiveHost(type, { tagName, bindings });
}

async function setupHost() {
  const fixture = TestBed.createComponent(BreakoutHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const article = element.querySelector('article');
  const [child, outside] = element.querySelectorAll('figure');
  const [note, outsideNote] = element.querySelectorAll('aside');
  assert.exists(article);
  assert.exists(child);
  assert.exists(outside);
  assert.exists(note);
  assert.exists(outsideNote);

  return {
    article,
    child,
    host: fixture.componentInstance,
    note,
    outside,
    outsideNote,
  };
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

/** The package's own attributes on an element. */
function packageAttributes(element: Element): string[] {
  return element.getAttributeNames().filter((name) => name.startsWith('data-'));
}

describe(YetiBreakout, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiBreakout, 'article');
  });

  it('renders its class and presence attribute and no unset attribute', async () => {
    expect.assertions(5);

    const { element } = await setupBreakout();

    expect(element.getAttribute('class')).toBe('breakout');
    expect(element.getAttribute('data-ngx-yeti-item-breakout')).toBe('');
    expect(element.hasAttribute('data-max')).toBe(false);
    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('role')).toBe(false);
  });

  it('renders each bound input and removes it when unset', async () => {
    expect.assertions(4);

    const inputs = {
      max: signal<YetiWidth | undefined>('lg'),
      gap: signal<YetiGap | undefined>('sm-lg'),
    };
    const { element, fixture } = await setupBreakout(
      Object.entries(inputs).map(([name, value]) => inputBinding(name, value)),
    );

    expect(element.getAttribute('data-max')).toBe('lg');
    expect(element.getAttribute('data-gap')).toBe('sm-lg');

    inputs.max.set(undefined);
    inputs.gap.set(undefined);
    await fixture.whenStable();

    expect(element.hasAttribute('data-max')).toBe(false);
    expect(element.hasAttribute('data-gap')).toBe(false);
  });

  it('keeps one item link while it lives and removes it a frame after destroy', async () => {
    expect.assertions(2);

    removeItemLinks();
    const { destroy } = await setupBreakout();

    expect(itemLinks('breakout')).toHaveLength(1);

    destroy();
    await nextFrame();

    expect(itemLinks('breakout')).toHaveLength(0);
  });

  it('shares one item link between two breakouts until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupBreakout();
    const second = await setupBreakout();

    expect(itemLinks('breakout')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('breakout')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('breakout')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('resolves the template references', async () => {
      expect.assertions(4);

      const { host } = await setupHost();

      expect(host.breakout()).toBeInstanceOf(YetiBreakout);
      expect(host.child()).toBeInstanceOf(YetiBreakoutChild);
      expect(host.note()).toBeInstanceOf(YetiBreakoutNote);
      expect(host.outside()).toBeInstanceOf(YetiBreakoutChild);
    });

    it('keeps a static max beside data-max', async () => {
      expect.assertions(2);

      const { article } = await setupHost();

      expect(article.getAttribute('max')).toBe('lg');
      expect(article.getAttribute('data-max')).toBe('lg');
    });

    it('sets bleed from its static form through booleanAttribute', async () => {
      expect.assertions(1);

      const { child } = await setupHost();

      expect(child.getAttribute('data-bleed')).toBe('');
    });

    it('renders the markers of parts outside any breakout', async () => {
      expect.assertions(2);

      const { outside, outsideNote } = await setupHost();

      expect(outside.getAttribute('data-bleed')).toBe('');
      expect(outsideNote.getAttribute('data-note')).toBe('');
    });

    it("keeps the consumer's own class on each host", async () => {
      expect.assertions(3);

      const { article, child, note } = await setupHost();

      expect([...article.classList].toSorted()).toStrictEqual([
        'box',
        'breakout',
        'read',
      ]);
      expect(child.getAttribute('class')).toBe('wide');
      expect(note.getAttribute('class')).toBe('aside');
    });

    it('renders both item directives beside each other on one element', async () => {
      expect.assertions(2);

      const { article } = await setupHost();

      expect(article.getAttribute('data-ngx-yeti-item-breakout')).toBe('');
      expect(article.getAttribute('data-ngx-yeti-item-box')).toBe('');
    });

    it('resolves the breakout token on a nested breakout to the outer one, not itself', async () => {
      expect.assertions(2);

      const fixture = TestBed.createComponent(BreakoutProbeHost);
      await fixture.whenStable();
      const host = fixture.componentInstance;

      expect(host.probe().breakout).toBe(host.breakout());
      expect(host.probe().breakout).not.toBe(host.nested());
    });
  });
});

describe(YetiBreakoutChild, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiBreakoutChild, 'figure');
  });

  it('renders no marker by default', async () => {
    expect.assertions(1);

    const { element } = await setupPart(YetiBreakoutChild, 'figure');

    expect(element.hasAttribute('data-bleed')).toBe(false);
  });

  it('renders data-bleed while bleed is true and removes it when false', async () => {
    expect.assertions(2);

    const bleed = signal(true);
    const { element, fixture } = await setupPart(YetiBreakoutChild, 'figure', [
      inputBinding('bleed', bleed),
    ]);

    expect(element.getAttribute('data-bleed')).toBe('');

    bleed.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-bleed')).toBe(false);
  });

  it('carries no presence attribute and loads no item link alone', async () => {
    expect.assertions(2);

    removeItemLinks();
    const { element } = await setupPart(YetiBreakoutChild, 'figure', [
      inputBinding('bleed', () => true),
    ]);

    expect(packageAttributes(element)).toStrictEqual(['data-bleed']);
    expect(itemLinks()).toHaveLength(0);
  });
});

describe(YetiBreakoutNote, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiBreakoutNote, 'aside');
  });

  it('renders data-note and no other package attribute, and loads no item link', async () => {
    expect.assertions(3);

    removeItemLinks();
    const { element } = await setupPart(YetiBreakoutNote, 'aside');

    expect(element.getAttribute('data-note')).toBe('');
    expect(packageAttributes(element)).toStrictEqual(['data-note']);
    expect(itemLinks()).toHaveLength(0);
  });
});
