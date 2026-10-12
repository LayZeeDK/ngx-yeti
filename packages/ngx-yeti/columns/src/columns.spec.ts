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
import type {
  YetiAlign,
  YetiColumns,
  YetiGap,
  YetiJustify,
  YetiSpan,
  YetiWidth,
} from 'ngx-yeti';
import { YetiBox } from 'ngx-yeti/box';
import { NgxYetiColumns } from './columns';
import { YetiColumnsChild } from './columns-child';
import { yetiColumnsToken } from './columns-tokens';

/** Injects the columns token as `YetiColumnsChild` does. */
@Directive({ selector: '[yetiColumnsTokenProbe]' })
class ColumnsTokenProbe {
  readonly columns = inject(yetiColumnsToken, {
    optional: true,
    skipSelf: true,
  });
}

@Component({
  selector: 'yeti-columns-host',
  imports: [NgxYetiColumns, YetiColumnsChild, YetiBox, ColumnsTokenProbe],
  template:
    '<div #c="yetiColumns" yetiColumns class="tiers" align="center"><article #s="yetiColumnsChild" yetiColumnsChild yetiColumnsTokenProbe class="wide" span="2">Plan</article><aside>Build</aside></div><div id="shared" yetiColumns yetiBox gap="lg"><p>One</p><p>Two</p></div>',
})
class ColumnsHost {
  readonly columns = viewChild.required<NgxYetiColumns>('c');
  readonly child = viewChild.required<YetiColumnsChild>('s');
  readonly probe = viewChild.required(ColumnsTokenProbe);
}

async function setupColumns(bindings: Binding[] = []) {
  return createDirectiveHost(NgxYetiColumns, {
    tagName: 'div',
    bindings,
  });
}

async function setupColumnsChild(bindings: Binding[] = []) {
  return createDirectiveHost(YetiColumnsChild, {
    tagName: 'article',
    bindings,
  });
}

async function setupHost() {
  const fixture = TestBed.createComponent(ColumnsHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const columns = element.querySelector('.tiers');
  const child = element.querySelector('.wide');
  const shared = element.querySelector('#shared');
  assert.instanceOf(columns, HTMLElement);
  assert.instanceOf(child, HTMLElement);
  assert.instanceOf(shared, HTMLElement);

  return { child, columns, host: fixture.componentInstance, shared };
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

/** The names of the package's presence attributes on `element`. */
function presenceAttributes(element: Element): string[] {
  return element
    .getAttributeNames()
    .filter((name) => name.startsWith('data-ngx-yeti-'))
    .toSorted();
}

async function setupBound() {
  const inputs = {
    threshold: signal<YetiWidth | undefined>('sm'),
    gap: signal<YetiGap | undefined>('sm-lg'),
    align: signal<YetiAlign | undefined>('center'),
    justify: signal<YetiJustify | undefined>('between'),
    columns: signal<YetiColumns | undefined>('2'),
  };
  const columns = await setupColumns(
    Object.entries(inputs).map(([name, value]) => inputBinding(name, value)),
  );

  return { ...columns, inputs };
}

describe(NgxYetiColumns, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(NgxYetiColumns, 'div');
  });

  it('renders its class and presence attribute and no unset attribute', async () => {
    expect.assertions(9);

    const { element } = await setupColumns();

    expect(element.getAttribute('class')).toBe('columns');
    expect(element.getAttribute('data-ngx-yeti-item-columns')).toBe('');
    expect(element.hasAttribute('data-threshold')).toBe(false);
    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-align')).toBe(false);
    expect(element.hasAttribute('data-justify')).toBe(false);
    expect(element.hasAttribute('data-columns')).toBe(false);
    expect(element.hasAttribute('align')).toBe(false);
    expect(element.hasAttribute('role')).toBe(false);
  });

  it('renders each bound input, updates it, and never writes align', async () => {
    expect.assertions(7);

    const { element, fixture, inputs } = await setupBound();

    expect(element.getAttribute('data-threshold')).toBe('sm');
    expect(element.getAttribute('data-gap')).toBe('sm-lg');
    expect(element.getAttribute('data-align')).toBe('center');
    expect(element.getAttribute('data-justify')).toBe('between');
    expect(element.getAttribute('data-columns')).toBe('2');
    expect(element.hasAttribute('align')).toBe(false);

    inputs.columns.set('3');
    await fixture.whenStable();

    expect(element.getAttribute('data-columns')).toBe('3');
  });

  it('removes each bound input when it is unset', async () => {
    expect.assertions(6);

    const { element, fixture, inputs } = await setupBound();

    inputs.threshold.set(undefined);
    inputs.gap.set(undefined);
    inputs.align.set(undefined);
    inputs.justify.set(undefined);
    inputs.columns.set(undefined);
    await fixture.whenStable();

    expect(element.hasAttribute('data-threshold')).toBe(false);
    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-align')).toBe(false);
    expect(element.hasAttribute('data-justify')).toBe(false);
    expect(element.hasAttribute('data-columns')).toBe(false);
    expect(element.hasAttribute('align')).toBe(false);
  });

  it('holds one item link while it lives and removes it one frame after it is destroyed', async () => {
    expect.assertions(2);

    removeItemLinks();
    const columns = await setupColumns();

    expect(itemLinks('columns')).toHaveLength(1);

    columns.destroy();
    await nextFrame();

    expect(itemLinks('columns')).toHaveLength(0);
  });

  it('shares one item link between two layouts until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupColumns();
    const second = await setupColumns();

    expect(itemLinks('columns')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('columns')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('columns')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('resolves the template references', async () => {
      expect.assertions(2);

      const { host } = await setupHost();

      expect(host.columns()).toBeInstanceOf(NgxYetiColumns);
      expect(host.child()).toBeInstanceOf(YetiColumnsChild);
    });

    it("resolves the columns token in a child to the child's layout", async () => {
      expect.assertions(1);

      const { host } = await setupHost();

      expect(host.probe().columns).toBe(host.columns());
    });

    it('renders a static align on data-align only, and leaves the text start-aligned', async () => {
      expect.assertions(3);

      const { columns } = await setupHost();

      expect(columns.getAttribute('data-align')).toBe('center');
      expect(columns.hasAttribute('align')).toBe(false);
      expect(getComputedStyle(columns).textAlign).toBe('start');
    });

    it('keeps a static span beside data-span', async () => {
      expect.assertions(2);

      const { child } = await setupHost();

      expect(child.getAttribute('span')).toBe('2');
      expect(child.getAttribute('data-span')).toBe('2');
    });

    it('renders one data-gap and both presence attributes on a layout that is a box', async () => {
      expect.assertions(4);

      const { shared } = await setupHost();

      expect(shared.getAttribute('data-gap')).toBe('lg');
      expect(shared.outerHTML.match(/ data-gap=/g)).toHaveLength(1);
      expect([...shared.classList].toSorted()).toStrictEqual([
        'box',
        'columns',
      ]);
      expect(presenceAttributes(shared)).toStrictEqual([
        'data-ngx-yeti-item-box',
        'data-ngx-yeti-item-columns',
      ]);
    });

    it("keeps the consumer's own class on each host and marks only the layout", async () => {
      expect.assertions(4);

      const { child, columns } = await setupHost();

      expect([...columns.classList].toSorted()).toStrictEqual([
        'columns',
        'tiers',
      ]);
      expect(child.getAttribute('class')).toBe('wide');
      expect(presenceAttributes(columns)).toStrictEqual([
        'data-ngx-yeti-item-columns',
      ]);
      expect(presenceAttributes(child)).toStrictEqual([]);
    });
  });
});

describe(YetiColumnsChild, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiColumnsChild, 'article');
  });

  it('created alone, renders no marker, injects no parent, and throws nothing', async () => {
    expect.assertions(2);

    const { element } = await setupColumnsChild();

    expect(element.hasAttribute('data-span')).toBe(false);
    expect(element.getAttribute('class')).toBeNull();
  });

  it('renders data-span from its binding, updates it, and removes it when unset', async () => {
    expect.assertions(4);

    const span = signal<YetiSpan | undefined>('2');
    const { element, fixture } = await setupColumnsChild([
      inputBinding('span', span),
    ]);

    expect(element.getAttribute('data-span')).toBe('2');
    expect(element.hasAttribute('span')).toBe(false);

    span.set('3');
    await fixture.whenStable();

    expect(element.getAttribute('data-span')).toBe('3');

    span.set(undefined);
    await fixture.whenStable();

    expect(element.hasAttribute('data-span')).toBe(false);
  });

  it('carries no presence attribute and loads no item link alone', async () => {
    expect.assertions(2);

    removeItemLinks();
    const { element } = await setupColumnsChild([
      inputBinding('span', () => '2'),
    ]);

    expect(presenceAttributes(element)).toStrictEqual([]);
    expect(itemLinks()).toHaveLength(0);
  });
});
