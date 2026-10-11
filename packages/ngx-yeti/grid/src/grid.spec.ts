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
import type {
  YetiColumns,
  YetiGap,
  YetiRows,
  YetiSpan,
  YetiStart,
  YetiTracks,
  YetiWidth,
  YetiWidthOrNone,
} from 'ngx-yeti';
import { YetiGrid } from './grid';
import { YetiGridChild } from './grid-child';
import { yetiGridToken } from './grid-tokens';

const gridAttributes = [
  'data-min',
  'data-columns',
  'data-gap',
  'data-rows',
  'data-fold',
  'data-tracks',
  'data-threshold',
] as const;

/** Injects the grid token as `YetiGridChild` does. */
@Directive({ selector: '[yetiGridTokenProbe]' })
class GridTokenProbe {
  readonly grid = inject(yetiGridToken, { optional: true, skipSelf: true });
}

@Component({
  selector: 'yeti-grid-host',
  imports: [YetiGrid, YetiGridChild, GridTokenProbe],
  template:
    '<ul #g="yetiGrid" yetiGrid class="catalogue" role="list" min="2xs" columns="4" fold><li>One</li><li>Two</li></ul><div #t="yetiGrid" yetiGrid tracks="12"><figure #c="yetiGridChild" yetiGridChild class="work" role="group" start="2" span="6">A work</figure><ol yetiGridChild yetiGridTokenProbe start="2" span="4"><li>The first step</li><li>The second step</li></ol></div><p #o="yetiGridChild" yetiGridChild start="3" span="2">Outside</p>',
})
class GridHost {
  readonly grid = viewChild.required<YetiGrid>('g');
  readonly tracks = viewChild.required<YetiGrid>('t');
  readonly child = viewChild.required<YetiGridChild>('c');
  readonly probe = viewChild.required(GridTokenProbe);
  readonly outside = viewChild.required<YetiGridChild>('o');
}

async function setupGrid(bindings: Binding[] = []) {
  const fixture = TestBed.createDirective(YetiGrid, {
    tagName: 'ul',
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

async function setupGridChild(tagName: string, bindings: Binding[] = []) {
  const fixture = TestBed.createDirective(YetiGridChild, {
    tagName,
    bindings,
  });

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);

  return { element, fixture };
}

async function setupHost() {
  const fixture = TestBed.createComponent(GridHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const list = element.querySelector('ul');
  const tracks = element.querySelector('div');
  const figure = element.querySelector('figure');
  const steps = element.querySelector('ol');
  const outside = element.querySelector('p');
  assert.exists(list);
  assert.exists(tracks);
  assert.exists(figure);
  assert.instanceOf(steps, HTMLOListElement);
  assert.exists(outside);

  return {
    figure,
    host: fixture.componentInstance,
    list,
    outside,
    steps,
    tracks,
  };
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

describe(YetiGrid, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiGrid, 'ul');
  });

  it('renders its class and presence attribute, no unset attribute, and no role', async () => {
    expect.assertions(5);

    const { element } = await setupGrid();

    expect(element.getAttribute('class')).toBe('grid');
    expect(element.getAttribute('data-ngx-yeti-item-grid')).toBe('');
    expect(
      gridAttributes.filter((name) => element.hasAttribute(name)),
    ).toStrictEqual([]);
    expect(element.hasAttribute('role')).toBe(false);
    expect(element.hasAttribute('tabindex')).toBe(false);
  });

  it('renders each bound input and removes it when unset', async () => {
    expect.assertions(8);

    const inputs = {
      min: signal<YetiWidthOrNone | undefined>('none'),
      columns: signal<YetiColumns | undefined>('4'),
      gap: signal<YetiGap | undefined>('sm-lg'),
      rows: signal<YetiRows | undefined>('3'),
      fold: signal(true),
      tracks: signal<YetiTracks | undefined>('12'),
      threshold: signal<YetiWidth | undefined>('lg'),
    };
    const { element, fixture } = await setupGrid(
      Object.entries(inputs).map(([name, value]) => inputBinding(name, value)),
    );

    expect(element.getAttribute('data-min')).toBe('none');
    expect(element.getAttribute('data-columns')).toBe('4');
    expect(element.getAttribute('data-gap')).toBe('sm-lg');
    expect(element.getAttribute('data-rows')).toBe('3');
    expect(element.getAttribute('data-fold')).toBe('');
    expect(element.getAttribute('data-tracks')).toBe('12');
    expect(element.getAttribute('data-threshold')).toBe('lg');

    inputs.min.set(undefined);
    inputs.columns.set(undefined);
    inputs.gap.set(undefined);
    inputs.rows.set(undefined);
    inputs.fold.set(false);
    inputs.tracks.set(undefined);
    inputs.threshold.set(undefined);
    await fixture.whenStable();

    expect(
      gridAttributes.filter((name) => element.hasAttribute(name)),
    ).toStrictEqual([]);
  });

  it('holds one item link while it lives and removes it a frame after destroy', async () => {
    expect.assertions(2);

    removeItemLinks();
    const grid = await setupGrid();

    expect(itemLinks('grid')).toHaveLength(1);

    grid.destroy();
    await nextFrame();

    expect(itemLinks('grid')).toHaveLength(0);
  });

  it('shares one item link between two grids until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupGrid();
    const second = await setupGrid();

    expect(itemLinks('grid')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('grid')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('grid')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('resolves the template references', async () => {
      expect.assertions(3);

      const { host } = await setupHost();

      expect(host.grid()).toBeInstanceOf(YetiGrid);
      expect(host.child()).toBeInstanceOf(YetiGridChild);
      expect(host.outside()).toBeInstanceOf(YetiGridChild);
    });

    it('sets fold from the static attribute', async () => {
      expect.assertions(1);

      const { list } = await setupHost();

      expect(list.getAttribute('data-fold')).toBe('');
    });

    it('keeps the static min and span beside their data attributes', async () => {
      expect.assertions(4);

      const { figure, list } = await setupHost();

      expect(list.getAttribute('min')).toBe('2xs');
      expect(list.getAttribute('data-min')).toBe('2xs');
      expect(figure.getAttribute('span')).toBe('6');
      expect(figure.getAttribute('data-span')).toBe('6');
    });

    it('renders a static start on an ol cell as data-start only, and the list still counts from one', async () => {
      expect.assertions(3);

      const { steps } = await setupHost();

      expect(steps.getAttribute('data-start')).toBe('2');
      expect(steps.hasAttribute('start')).toBe(false);
      expect(steps.start).toBe(1);
    });

    it('resolves the grid token on a cell to its grid', async () => {
      expect.assertions(1);

      const { host } = await setupHost();

      expect(host.probe().grid).toBe(host.tracks());
    });

    it('renders the markers of a child outside any grid', async () => {
      expect.assertions(3);

      const { outside } = await setupHost();

      expect(outside.getAttribute('data-start')).toBe('3');
      expect(outside.getAttribute('data-span')).toBe('2');
      expect(outside.hasAttribute('start')).toBe(false);
    });

    it("keeps the consumer's own class and role on each host", async () => {
      expect.assertions(4);

      const { figure, list } = await setupHost();

      expect([...list.classList].toSorted()).toStrictEqual([
        'catalogue',
        'grid',
      ]);
      expect(list.getAttribute('role')).toBe('list');
      expect(figure.getAttribute('class')).toBe('work');
      expect(figure.getAttribute('role')).toBe('group');
    });

    it('writes no role on a grid without one', async () => {
      expect.assertions(1);

      const { tracks } = await setupHost();

      expect(tracks.hasAttribute('role')).toBe(false);
    });
  });
});

describe(YetiGridChild, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiGridChild, 'figure');
  });

  it('renders no marker by default', async () => {
    expect.assertions(2);

    const { element } = await setupGridChild('figure');

    expect(element.hasAttribute('data-start')).toBe(false);
    expect(element.hasAttribute('data-span')).toBe(false);
  });

  it('renders each bound marker and removes it when unset', async () => {
    expect.assertions(4);

    const inputs = {
      start: signal<YetiStart | undefined>('2'),
      span: signal<YetiSpan | undefined>('6'),
    };
    const { element, fixture } = await setupGridChild(
      'figure',
      Object.entries(inputs).map(([name, value]) => inputBinding(name, value)),
    );

    expect(element.getAttribute('data-start')).toBe('2');
    expect(element.getAttribute('data-span')).toBe('6');

    inputs.start.set(undefined);
    inputs.span.set(undefined);
    await fixture.whenStable();

    expect(element.hasAttribute('data-start')).toBe(false);
    expect(element.hasAttribute('data-span')).toBe(false);
  });

  it('renders a bound start on an ol as data-start and no start attribute', async () => {
    expect.assertions(2);

    const { element } = await setupGridChild('ol', [
      inputBinding('start', () => '2'),
    ]);

    expect(element.getAttribute('data-start')).toBe('2');
    expect(element.hasAttribute('start')).toBe(false);
  });

  it('carries no presence attribute and loads no item link alone', async () => {
    expect.assertions(2);

    removeItemLinks();
    const { element } = await setupGridChild('figure', [
      inputBinding('span', () => '6'),
    ]);

    expect(
      element
        .getAttributeNames()
        .filter((name) => name.startsWith('data-ngx-yeti-')),
    ).toStrictEqual([]);
    expect(itemLinks()).toHaveLength(0);
  });
});
