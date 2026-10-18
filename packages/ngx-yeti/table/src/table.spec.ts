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
import { By } from '@angular/platform-browser';
import {
  composite,
  contrastRatio,
  itemLinks,
  itemStylesLoaded,
  nextFrame,
  removeItemLinks,
  stylesheetLoaded,
} from '@ngx-yeti/testing';
import { createDirectiveHost } from '@ngx-yeti/testing/test-bed';
import type { YetiSizeControl } from 'ngx-yeti';
import { provideYetiStyles } from 'ngx-yeti/styles';
import { page, server } from 'vitest/browser';
import { YetiTable } from './table';
import { type YetiTableAlign, YetiTableCell } from './table-cell';
import { YetiTableHead } from './table-head';
import { YetiNumeric } from './table-numeric';
import { yetiTableToken } from './table-tokens';

/** Injects the table token as `YetiTableCell` does. */
@Directive({ selector: '[yetiTableTokenProbe]' })
class TableTokenProbe {
  readonly table = inject(yetiTableToken, { optional: true, skipSelf: true });
}

@Component({
  selector: 'yeti-table-host',
  imports: [
    YetiTable,
    YetiTableCell,
    YetiTableHead,
    YetiNumeric,
    TableTokenProbe,
  ],
  template:
    '<table #t="yetiTable" yetiTable border class="results" aria-label="Plans"><thead #h="yetiTableHead" yetiTableHead sticky><tr #r="yetiTableCell" yetiTableCell align="center"><th #c="yetiTableCell" yetiTableCell align="start" nowrap scope="col">Plan</th><th #n="yetiNumeric" yetiNumeric scope="col">Price</th></tr></thead><tbody><tr><td yetiTableCell yetiTableTokenProbe>Free</td><td yetiNumeric>0</td></tr></tbody></table><table aria-label="Plain"><tbody><tr><td yetiTableCell yetiTableTokenProbe align="end">Plain</td></tr></tbody></table>',
})
class TableHost {
  readonly table = viewChild.required<YetiTable>('t');
  readonly head = viewChild.required<YetiTableHead>('h');
  readonly row = viewChild.required<YetiTableCell>('r');
  readonly cell = viewChild.required<YetiTableCell>('c');
  readonly numeric = viewChild.required<YetiNumeric>('n');
}

@Component({
  selector: 'yeti-table-hover-host',
  imports: [YetiTable],
  template:
    '<div data-testid="frame"><p data-testid="away">Away from the tables</p><table yetiTable hover aria-label="Hovered"><tbody><tr data-testid="hovered"><td>Ben Nevis</td></tr><tr><td>Snowdon</td></tr></tbody></table><table yetiTable aria-label="Still"><tbody><tr data-testid="still"><td>Scafell Pike</td></tr><tr><td>Helvellyn</td></tr></tbody></table></div>',
})
class HoverHost {}

/** Yeti's built CSS, served by Vite from the workspace's node_modules. */
const yetiCss: `${string}/` = `/@fs/${server.config.root.replaceAll('\\', '/')}/../../node_modules/yeti-css/dist/css/`;

/** Storybook's global stylesheet, which Vite serves with its imports inlined. */
const globalHref = `/@fs/${server.config.root.replaceAll('\\', '/')}/.storybook/styles.css`;

/** Adds the global stylesheet once per test file, as an application does. */
async function globalStylesheet(): Promise<void> {
  let link = document.head.querySelector<HTMLLinkElement>(
    `link[href="${globalHref}"]`,
  );

  if (link === null) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = globalHref;
    document.head.append(link);
  }

  await stylesheetLoaded(link);
}

async function setupTable(bindings: Binding[] = []) {
  return createDirectiveHost(YetiTable, { tagName: 'table', bindings });
}

async function setupHost() {
  const fixture = TestBed.createComponent(TableHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const find = (selector: string): HTMLElement => {
    const found = element.querySelector(selector);
    assert.instanceOf(found, HTMLElement);

    return found;
  };

  return {
    host: fixture.componentInstance,
    probes: fixture.debugElement
      .queryAll(By.directive(TableTokenProbe))
      .map((node) => node.injector.get(TableTokenProbe)),
    table: find('table.results'),
    head: find('thead'),
    row: find('thead > tr'),
    cell: find('thead th'),
    plainCell: find('table:not(.results) td'),
  };
}

/**
 * Hovers the row's first cell. Safari's driver finds a table row itself not
 * interactable, and a pointer over a cell is over its row too.
 */
async function hoverRow(row: HTMLElement): Promise<void> {
  const cell = row.querySelector('td');
  assert.instanceOf(cell, HTMLElement);

  await page.elementLocator(cell).hover();
}

async function setupHover() {
  await globalStylesheet();
  // A link an earlier test left points at the default URL, which this
  // runner does not serve; the loader would adopt it.
  removeItemLinks();
  TestBed.configureTestingModule({
    providers: [provideYetiStyles({ url: yetiCss })],
  });
  const fixture = TestBed.createComponent(HoverHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const find = (testId: string): HTMLElement => {
    const found = element.querySelector(`[data-testid="${testId}"]`);
    assert.instanceOf(found, HTMLElement);

    return found;
  };
  const hovered = find('hovered');
  const frame = find('frame');

  // Yeti's page surface and text, which the contrast case reads.
  frame.style.color = 'var(--yeti-color-text)';
  frame.style.backgroundColor = 'var(--yeti-color-surface)';

  await itemStylesLoaded('table');
  // Chromium and WebKit can keep stale computed styles right after a
  // stylesheet is inserted (upstream bug O2).
  await vi.waitFor(() => {
    // Only the table file tops its cells; the page default is middle.
    assert.equal(
      getComputedStyle(hovered.querySelector('td') ?? hovered).verticalAlign,
      'top',
    );
  });
  // The pointer starts away from every table.
  await page.elementLocator(find('away')).hover();

  return {
    away: find('away'),
    frame,
    hovered,
    still: find('still'),
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

/** The names of the package's presence attributes on `element`. */
function presenceAttributes(element: Element): string[] {
  return element
    .getAttributeNames()
    .filter((name) => name.startsWith('data-ngx-yeti-'))
    .toSorted();
}

const booleans = ['striped', 'hover', 'border', 'nowrap', 'fixed'] as const;

async function setupBound() {
  const size = signal<YetiSizeControl | undefined>('sm');
  const flags = {
    striped: signal(true),
    hover: signal(true),
    border: signal(true),
    nowrap: signal(true),
    fixed: signal(true),
  };
  const table = await setupTable([
    inputBinding('size', size),
    ...booleans.map((name) => inputBinding(name, flags[name])),
  ]);

  return { ...table, flags, size };
}

describe(YetiTable, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiTable, 'table');
  });

  it('renders its class and presence attribute and no unset attribute', async () => {
    expect.assertions(10);

    const { element } = await setupTable();

    expect(element.getAttribute('class')).toBe('table');
    expect(element.getAttribute('data-ngx-yeti-item-table')).toBe('');
    expect(element.hasAttribute('data-size')).toBe(false);

    for (const name of booleans) {
      expect(element.hasAttribute(`data-${name}`)).toBe(false);
    }

    expect(element.hasAttribute('border')).toBe(false);
    expect(element.hasAttribute('role')).toBe(false);
  });

  it('renders each bound input and never writes border', async () => {
    expect.assertions(7);

    const { element } = await setupBound();

    expect(element.getAttribute('data-size')).toBe('sm');

    for (const name of booleans) {
      expect(element.getAttribute(`data-${name}`)).toBe('');
    }

    expect(element.hasAttribute('border')).toBe(false);
  });

  it('updates the bound size when its value changes', async () => {
    expect.assertions(1);

    const { element, fixture, size } = await setupBound();

    size.set('lg');
    await fixture.whenStable();

    expect(element.getAttribute('data-size')).toBe('lg');
  });

  it('removes each bound input when it is unset or false', async () => {
    expect.assertions(7);

    const { element, fixture, flags, size } = await setupBound();

    size.set(undefined);

    for (const name of booleans) {
      flags[name].set(false);
    }

    await fixture.whenStable();

    expect(element.hasAttribute('data-size')).toBe(false);

    for (const name of booleans) {
      expect(element.hasAttribute(`data-${name}`)).toBe(false);
    }

    expect(element.hasAttribute('border')).toBe(false);
  });

  it('holds one item link while it lives and removes it one frame after it is destroyed', async () => {
    expect.assertions(2);

    removeItemLinks();
    const table = await setupTable();

    expect(itemLinks('table')).toHaveLength(1);

    table.destroy();
    await nextFrame();

    expect(itemLinks('table')).toHaveLength(0);
  });

  it('shares one item link between two tables until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupTable();
    const second = await setupTable();

    expect(itemLinks('table')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('table')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('table')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('resolves the template references', async () => {
      expect.assertions(5);

      const { host } = await setupHost();

      expect(host.table()).toBeInstanceOf(YetiTable);
      expect(host.head()).toBeInstanceOf(YetiTableHead);
      expect(host.row()).toBeInstanceOf(YetiTableCell);
      expect(host.cell()).toBeInstanceOf(YetiTableCell);
      expect(host.numeric()).toBeInstanceOf(YetiNumeric);
    });

    it('takes a static border as the input and leaves no border attribute', async () => {
      expect.assertions(3);

      const { host, table } = await setupHost();

      expect(host.table().border()).toBe(true);
      expect(table.getAttribute('data-border')).toBe('');
      expect(table.hasAttribute('border')).toBe(false);
    });

    it('takes a static align and nowrap as the inputs and leaves neither attribute', async () => {
      expect.assertions(8);

      const { cell, host, row } = await setupHost();
      const rowAlign: YetiTableAlign | undefined = host.row().align();

      expect(rowAlign).toBe('center');
      expect(row.getAttribute('data-align')).toBe('center');
      expect(row.hasAttribute('align')).toBe(false);
      expect(host.cell().align()).toBe('start');
      expect(host.cell().nowrap()).toBe(true);
      expect(cell.getAttribute('data-nowrap')).toBe('');
      expect(cell.hasAttribute('nowrap')).toBe(false);
      expect(cell.hasAttribute('align')).toBe(false);
    });

    it('gives a cell of a yetiTable its table and a cell of a plain table null', async () => {
      expect.assertions(4);

      const { host, plainCell, probes } = await setupHost();
      const [inTable, inPlain] = probes;

      expect(probes).toHaveLength(2);
      expect(inTable?.table).toBe(host.table());
      expect(inPlain?.table).toBeNull();
      expect(plainCell.getAttribute('data-align')).toBe('end');
    });

    it("keeps the consumer's own class beside table and marks only the table", async () => {
      expect.assertions(5);

      const { cell, head, row, table } = await setupHost();

      expect([...table.classList].toSorted()).toStrictEqual([
        'results',
        'table',
      ]);
      expect(presenceAttributes(table)).toStrictEqual([
        'data-ngx-yeti-item-table',
      ]);

      for (const part of [head, row, cell]) {
        expect(presenceAttributes(part)).toStrictEqual([]);
      }
    });
  });

  describe('with Yeti loaded', () => {
    it('tints the hovered body row of a hover table and not of a plain one', async () => {
      expect.assertions(3);

      const { away, hovered, still } = await setupHover();
      const resting = getComputedStyle(hovered).backgroundColor;
      const stillResting = getComputedStyle(still).backgroundColor;

      await hoverRow(hovered);

      await expect
        .poll(() => getComputedStyle(hovered).backgroundColor)
        .not.toBe(resting);

      await hoverRow(still);

      expect(getComputedStyle(still).backgroundColor).toBe(stillResting);

      await page.elementLocator(away).hover();

      await expect
        .poll(() => getComputedStyle(hovered).backgroundColor)
        .toBe(resting);
    });

    // The hover assertion of table.md:376, here because Storybook's pointer
    // does not set :hover (ngx-yeti-specs Departures).
    it("keeps the hovered row's text at 4.5:1 or more against its tint in both schemes", async () => {
      expect.assertions(4);

      const { away, frame, hovered } = await setupHover();
      const cell = hovered.querySelector('td');
      assert.instanceOf(cell, HTMLElement);

      try {
        for (const scheme of ['light', 'dark']) {
          frame.style.colorScheme = scheme;
          await page.elementLocator(away).hover();
          const resting = getComputedStyle(hovered).backgroundColor;
          const surface = getComputedStyle(frame).backgroundColor;

          await hoverRow(hovered);

          await expect
            .poll(() => getComputedStyle(hovered).backgroundColor)
            .not.toBe(resting);

          const tint = composite(
            getComputedStyle(hovered).backgroundColor,
            surface,
          );

          expect(
            contrastRatio(getComputedStyle(cell).color, tint),
          ).toBeGreaterThanOrEqual(4.5);
        }
      } finally {
        frame.style.colorScheme = '';
      }
    });
  });
});

describe(YetiTableCell, () => {
  describe.each(['td', 'th', 'tr'])('on a %s', (tagName) => {
    it(`adds no listener to a ${tagName} host`, async () => {
      expect.assertions(1);

      await expectNoHostListener(YetiTableCell, tagName);
    });

    it(`renders align and nowrap on a ${tagName} as data-* only, and removes them when unset`, async () => {
      expect.assertions(8);

      const align = signal<YetiTableAlign | undefined>('center');
      const nowrap = signal(true);
      const { element, fixture } = await createDirectiveHost(YetiTableCell, {
        tagName,
        bindings: [
          inputBinding('align', align),
          inputBinding('nowrap', nowrap),
        ],
      });

      expect(element.getAttribute('data-align')).toBe('center');
      expect(element.getAttribute('data-nowrap')).toBe('');
      expect(element.hasAttribute('align')).toBe(false);
      expect(element.hasAttribute('nowrap')).toBe(false);

      align.set(undefined);
      nowrap.set(false);
      await fixture.whenStable();

      expect(element.hasAttribute('data-align')).toBe(false);
      expect(element.hasAttribute('data-nowrap')).toBe(false);
      expect(element.hasAttribute('align')).toBe(false);
      expect(element.hasAttribute('nowrap')).toBe(false);
    });

    it(`sets no class or presence attribute on a ${tagName} and loads no item link`, async () => {
      expect.assertions(3);

      removeItemLinks();
      const { element } = await createDirectiveHost(YetiTableCell, {
        tagName,
        bindings: [inputBinding('align', () => 'end')],
      });

      expect(element.getAttribute('class')).toBeNull();
      expect(presenceAttributes(element)).toStrictEqual([]);
      expect(itemLinks()).toHaveLength(0);
    });
  });
});

describe(YetiNumeric, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiNumeric, 'span');
  });

  it('renders data-numeric while true and none while false', async () => {
    expect.assertions(2);

    const numeric = signal(true);
    const { element, fixture } = await createDirectiveHost(YetiNumeric, {
      tagName: 'span',
      bindings: [inputBinding('yetiNumeric', numeric)],
    });

    expect(element.getAttribute('data-numeric')).toBe('');

    numeric.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-numeric')).toBe(false);
  });

  it('sets no class or presence attribute and loads no item link', async () => {
    expect.assertions(3);

    removeItemLinks();
    const { element } = await createDirectiveHost(YetiNumeric, {
      tagName: 'td',
      bindings: [inputBinding('yetiNumeric', () => true)],
    });

    expect(element.getAttribute('class')).toBeNull();
    expect(presenceAttributes(element)).toStrictEqual([]);
    expect(itemLinks()).toHaveLength(0);
  });
});

describe(YetiTableHead, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiTableHead, 'thead');
  });

  // The table's manifest lacks the marker (upstream Y13), so the contract
  // check cannot cover it; this is its check.
  it('renders data-sticky on the thead while sticky and none otherwise', async () => {
    expect.assertions(3);

    const sticky = signal(true);
    const { element, fixture } = await createDirectiveHost(YetiTableHead, {
      tagName: 'thead',
      bindings: [inputBinding('sticky', sticky)],
    });

    expect(element.getAttribute('data-sticky')).toBe('');

    sticky.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-sticky')).toBe(false);
    expect(element.hasAttribute('sticky')).toBe(false);
  });

  it('sets no class or presence attribute and loads no item link', async () => {
    expect.assertions(3);

    removeItemLinks();
    const { element } = await createDirectiveHost(YetiTableHead, {
      tagName: 'thead',
      bindings: [inputBinding('sticky', () => true)],
    });

    expect(element.getAttribute('class')).toBeNull();
    expect(presenceAttributes(element)).toStrictEqual([]);
    expect(itemLinks()).toHaveLength(0);
  });
});
