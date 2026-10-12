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
import type { YetiGap, YetiPaint, YetiSurface } from 'ngx-yeti';
import { YetiCenter } from 'ngx-yeti/center';
import { YetiBox } from './box';
import { YetiBorder } from './box-border';
import { NgxYetiPaint } from './box-paint';
import { YetiText } from './box-text';

// One input name on two directives of one element shares one exported type
// (building-blocks 1.4), so one binding feeds both.
expectTypeOf<ReturnType<YetiBox['gap']>>().toEqualTypeOf<
  ReturnType<YetiCenter['gap']>
>();

@Component({
  selector: 'yeti-box-host',
  imports: [YetiBox, YetiBorder, NgxYetiPaint, YetiText],
  template:
    '<section #b="yetiBox" #o="yetiBorder" #p="yetiPaint" #t="yetiText" yetiBox yetiBorder yetiPaint="primary" yetiText="white" class="promo"></section><div data-testid="bare" yetiBorder></div>',
})
class BoxHost {
  readonly box = viewChild.required<YetiBox>('b');
  readonly border = viewChild.required<YetiBorder>('o');
  readonly paint = viewChild.required<NgxYetiPaint>('p');
  readonly text = viewChild.required<YetiText>('t');
}

@Component({
  selector: 'yeti-box-center-host',
  imports: [YetiBox, YetiCenter],
  template: '<div yetiCenter yetiBox [gap]="gap()"></div>',
})
class BoxCenterHost {
  readonly gap = signal<YetiGap | undefined>('lg');
}

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

const markers: readonly {
  readonly name: string;
  readonly type: Type<unknown>;
  readonly bindings: () => Binding[];
}[] = [
  {
    name: 'YetiBorder',
    type: YetiBorder,
    bindings: () => [inputBinding('yetiBorder', signal(true))],
  },
  {
    name: 'NgxYetiPaint',
    type: NgxYetiPaint,
    bindings: () => [inputBinding('yetiPaint', signal<YetiPaint>('primary'))],
  },
  {
    name: 'YetiText',
    type: YetiText,
    bindings: () => [inputBinding('yetiText', signal<YetiPaint>('grey-70'))],
  },
];

describe(YetiBox, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiBox);
  });

  it('renders its class and presence attribute and no unset attribute', async () => {
    expect.assertions(7);

    const { element } = await setupDirective(YetiBox, 'div');

    expect(element.getAttribute('class')).toBe('box');
    expect(element.getAttribute('data-ngx-yeti-item-box')).toBe('');
    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-gap-inline')).toBe(false);
    expect(element.hasAttribute('data-gap-block')).toBe(false);
    expect(element.hasAttribute('data-surface')).toBe(false);
    expect(element.hasAttribute('role')).toBe(false);
  });

  it('renders each bound input and removes it when unset', async () => {
    expect.assertions(8);

    const inputs = {
      gap: signal<YetiGap | undefined>('sm'),
      gapInline: signal<YetiGap | undefined>('xl'),
      gapBlock: signal<YetiGap | undefined>('sm-lg'),
      surface: signal<YetiSurface | undefined>('raised'),
    };
    const { element, fixture } = await setupDirective(
      YetiBox,
      'div',
      Object.entries(inputs).map(([name, value]) => inputBinding(name, value)),
    );

    expect(element.getAttribute('data-gap')).toBe('sm');
    expect(element.getAttribute('data-gap-inline')).toBe('xl');
    expect(element.getAttribute('data-gap-block')).toBe('sm-lg');
    expect(element.getAttribute('data-surface')).toBe('raised');

    inputs.gap.set(undefined);
    inputs.gapInline.set(undefined);
    inputs.gapBlock.set(undefined);
    inputs.surface.set(undefined);
    await fixture.whenStable();

    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-gap-inline')).toBe(false);
    expect(element.hasAttribute('data-gap-block')).toBe(false);
    expect(element.hasAttribute('data-surface')).toBe(false);
  });

  it('shares one item link between two boxes until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupDirective(YetiBox, 'div');
    const second = await setupDirective(YetiBox, 'div');

    expect(itemLinks('box')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('box')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('box')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('resolves the four template references', async () => {
      expect.assertions(4);

      const { fixture } = await setupHost(BoxHost);
      const host = fixture.componentInstance;

      expect(host.box()).toBeInstanceOf(YetiBox);
      expect(host.border()).toBeInstanceOf(YetiBorder);
      expect(host.paint()).toBeInstanceOf(NgxYetiPaint);
      expect(host.text()).toBeInstanceOf(YetiText);
    });

    it("keeps the consumer's own class beside box", async () => {
      expect.assertions(1);

      const { element } = await setupHost(BoxHost);
      const section = element.querySelector('section');
      assert.exists(section);

      expect([...section.classList].toSorted()).toStrictEqual(['box', 'promo']);
    });

    it('renders one data-gap from one gap binding beside yetiCenter', async () => {
      expect.assertions(4);

      const { element, fixture } = await setupHost(BoxCenterHost);
      const host = element.querySelector('div');
      assert.exists(host);

      expect([...host.classList].toSorted()).toStrictEqual(['box', 'center']);
      expect(
        host.getAttributeNames().filter((name) => name === 'data-gap'),
      ).toStrictEqual(['data-gap']);
      expect(host.getAttribute('data-gap')).toBe('lg');

      fixture.componentInstance.gap.set(undefined);
      await fixture.whenStable();

      expect(host.hasAttribute('data-gap')).toBe(false);
    });
  });
});

describe(YetiBorder, () => {
  it('renders data-border while true and none while false', async () => {
    expect.assertions(2);

    const border = signal(true);
    const { element, fixture } = await setupDirective(YetiBorder, 'figure', [
      inputBinding('yetiBorder', border),
    ]);

    expect(element.getAttribute('data-border')).toBe('');

    border.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-border')).toBe(false);
  });

  it('renders no data-border by default', async () => {
    expect.assertions(1);

    const { element } = await setupDirective(YetiBorder, 'ul');

    expect(element.hasAttribute('data-border')).toBe(false);
  });

  it('takes the static bare attribute as true', async () => {
    expect.assertions(1);

    const { element } = await setupHost(BoxHost);
    const bare = element.querySelector('[data-testid="bare"]');
    assert.exists(bare);

    expect(bare.getAttribute('data-border')).toBe('');
  });
});

describe(NgxYetiPaint, () => {
  it('renders the bound value as data-paint and follows the binding', async () => {
    expect.assertions(2);

    const paint = signal<YetiPaint>('primary');
    const { element, fixture } = await setupDirective(NgxYetiPaint, 'section', [
      inputBinding('yetiPaint', paint),
    ]);

    expect(element.getAttribute('data-paint')).toBe('primary');

    paint.set('grey-80');
    await fixture.whenStable();

    expect(element.getAttribute('data-paint')).toBe('grey-80');
  });
});

describe(YetiText, () => {
  it('renders the bound value as data-text and follows the binding', async () => {
    expect.assertions(2);

    const text = signal<YetiPaint>('grey-70');
    const { element, fixture } = await setupDirective(YetiText, 'p', [
      inputBinding('yetiText', text),
    ]);

    expect(element.getAttribute('data-text')).toBe('grey-70');

    text.set('primary');
    await fixture.whenStable();

    expect(element.getAttribute('data-text')).toBe('primary');
  });
});

describe.each(markers)('the box marker $name', ({ type, bindings }) => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(type, bindings());
  });

  it('sets no class, no presence attribute, and no item link', async () => {
    expect.assertions(3);

    removeItemLinks();
    const { element } = await setupDirective(type, 'span', bindings());

    expect(element.getAttribute('class')).toBeNull();
    expect(
      element
        .getAttributeNames()
        .filter((name) => name.startsWith('data-ngx-yeti-')),
    ).toStrictEqual([]);
    expect(itemLinks()).toHaveLength(0);
  });
});
