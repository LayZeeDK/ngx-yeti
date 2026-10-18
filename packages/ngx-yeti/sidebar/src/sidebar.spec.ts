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
import type { YetiAlign, YetiGap, YetiSide, YetiWidth } from 'ngx-yeti';
import { YetiBox } from 'ngx-yeti/box';
import { YetiSidebar } from './sidebar';
import { YetiSidebarChild } from './sidebar-child';
import { yetiSidebarToken } from './sidebar-tokens';

/** Injects the sidebar token as `YetiSidebarChild` does. */
@Directive({ selector: '[yetiSidebarTokenProbe]' })
class SidebarTokenProbe {
  readonly sidebar = inject(yetiSidebarToken, {
    optional: true,
    skipSelf: true,
  });
}

// The `nav` in the shared sidebar stands in for `yetiNav yetiSidebarChild
// sticky` until `nav` lands: the sidebar's half renders one `data-sticky`.
@Component({
  selector: 'yeti-sidebar-host',
  imports: [YetiSidebar, YetiSidebarChild, YetiBox, SidebarTokenProbe],
  template:
    '<div #s="yetiSidebar" yetiSidebar class="trail" width="xs" align="center"><nav #c="yetiSidebarChild" yetiSidebarChild yetiSidebarTokenProbe class="note" sticky aria-label="Section"><a href="/overview">Overview</a></nav><article>Content</article></div><div id="shared" yetiSidebar yetiBox gap="lg"><nav id="stand-in" yetiSidebarChild sticky aria-label="Pages"><a href="/hills">Hills</a></nav><p>The content.</p></div>',
})
class SidebarHost {
  readonly sidebar = viewChild.required<YetiSidebar>('s');
  readonly child = viewChild.required<YetiSidebarChild>('c');
  readonly probe = viewChild.required(SidebarTokenProbe);
}

async function setupSidebar(bindings: Binding[] = []) {
  return createDirectiveHost(YetiSidebar, {
    tagName: 'div',
    bindings,
  });
}

async function setupSidebarChild(bindings: Binding[] = []) {
  return createDirectiveHost(YetiSidebarChild, {
    tagName: 'nav',
    bindings,
  });
}

async function setupHost() {
  const fixture = TestBed.createComponent(SidebarHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const sidebar = element.querySelector('.trail');
  const child = element.querySelector('.note');
  const shared = element.querySelector('#shared');
  const standIn = element.querySelector('#stand-in');
  assert.instanceOf(sidebar, HTMLElement);
  assert.instanceOf(child, HTMLElement);
  assert.instanceOf(shared, HTMLElement);
  assert.instanceOf(standIn, HTMLElement);

  return { child, host: fixture.componentInstance, shared, sidebar, standIn };
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

describe(YetiSidebar, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiSidebar, 'div');
  });

  it('renders its class and presence attribute and no unset attribute', async () => {
    expect.assertions(8);

    const { element } = await setupSidebar();

    expect(element.getAttribute('class')).toBe('sidebar');
    expect(element.getAttribute('data-ngx-yeti-item-sidebar')).toBe('');
    expect(element.hasAttribute('data-side')).toBe(false);
    expect(element.hasAttribute('data-width')).toBe(false);
    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-align')).toBe(false);
    expect(element.hasAttribute('align')).toBe(false);
    expect(element.hasAttribute('role')).toBe(false);
  });

  it('renders each bound input, removes it when unset, and never writes align', async () => {
    expect.assertions(10);

    const inputs = {
      side: signal<YetiSide | undefined>('end'),
      width: signal<YetiWidth | undefined>('xs'),
      gap: signal<YetiGap | undefined>('sm-lg'),
      align: signal<YetiAlign | undefined>('center'),
    };
    const { element, fixture } = await setupSidebar(
      Object.entries(inputs).map(([name, value]) => inputBinding(name, value)),
    );

    expect(element.getAttribute('data-side')).toBe('end');
    expect(element.getAttribute('data-width')).toBe('xs');
    expect(element.getAttribute('data-gap')).toBe('sm-lg');
    expect(element.getAttribute('data-align')).toBe('center');
    expect(element.hasAttribute('align')).toBe(false);

    inputs.side.set(undefined);
    inputs.width.set(undefined);
    inputs.gap.set(undefined);
    inputs.align.set(undefined);
    await fixture.whenStable();

    expect(element.hasAttribute('data-side')).toBe(false);
    expect(element.hasAttribute('data-width')).toBe(false);
    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-align')).toBe(false);
    expect(element.hasAttribute('align')).toBe(false);
  });

  it('holds one item link while it lives and removes it one frame after it is destroyed', async () => {
    expect.assertions(2);

    removeItemLinks();
    const sidebar = await setupSidebar();

    expect(itemLinks('sidebar')).toHaveLength(1);

    sidebar.destroy();
    await nextFrame();

    expect(itemLinks('sidebar')).toHaveLength(0);
  });

  it('shares one item link between two sidebars until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupSidebar();
    const second = await setupSidebar();

    expect(itemLinks('sidebar')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('sidebar')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('sidebar')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('resolves the template references', async () => {
      expect.assertions(2);

      const { host } = await setupHost();

      expect(host.sidebar()).toBeInstanceOf(YetiSidebar);
      expect(host.child()).toBeInstanceOf(YetiSidebarChild);
    });

    it("resolves the sidebar token in a child to the child's sidebar", async () => {
      expect.assertions(1);

      const { host } = await setupHost();

      expect(host.probe().sidebar).toBe(host.sidebar());
    });

    it('sets sticky from a static attribute', async () => {
      expect.assertions(1);

      const { child } = await setupHost();

      expect(child.getAttribute('data-sticky')).toBe('');
    });

    it('keeps a static width beside data-width', async () => {
      expect.assertions(2);

      const { sidebar } = await setupHost();

      expect(sidebar.getAttribute('width')).toBe('xs');
      expect(sidebar.getAttribute('data-width')).toBe('xs');
    });

    it('renders a static align on data-align only, and leaves the text start-aligned', async () => {
      expect.assertions(3);

      const { sidebar } = await setupHost();

      expect(sidebar.getAttribute('data-align')).toBe('center');
      expect(sidebar.hasAttribute('align')).toBe(false);
      expect(getComputedStyle(sidebar).textAlign).toBe('start');
    });

    it('renders one data-gap and both presence attributes on a sidebar that is a box', async () => {
      expect.assertions(4);

      const { shared } = await setupHost();

      expect(shared.getAttribute('data-gap')).toBe('lg');
      expect(shared.outerHTML.match(/ data-gap=/g)).toHaveLength(1);
      expect([...shared.classList].toSorted()).toStrictEqual([
        'box',
        'sidebar',
      ]);
      expect(presenceAttributes(shared)).toStrictEqual([
        'data-ngx-yeti-item-box',
        'data-ngx-yeti-item-sidebar',
      ]);
    });

    it('renders one data-sticky on a sticky nav child', async () => {
      expect.assertions(2);

      const { standIn } = await setupHost();

      expect(standIn.getAttribute('data-sticky')).toBe('');
      expect(standIn.outerHTML.match(/ data-sticky=/g)).toHaveLength(1);
    });

    it("keeps the consumer's own class on each host and marks only the sidebar", async () => {
      expect.assertions(4);

      const { child, sidebar } = await setupHost();

      expect([...sidebar.classList].toSorted()).toStrictEqual([
        'sidebar',
        'trail',
      ]);
      expect(child.getAttribute('class')).toBe('note');
      expect(presenceAttributes(sidebar)).toStrictEqual([
        'data-ngx-yeti-item-sidebar',
      ]);
      expect(presenceAttributes(child)).toStrictEqual([]);
    });
  });
});

describe(YetiSidebarChild, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiSidebarChild, 'nav');
  });

  it('renders no marker by default', async () => {
    expect.assertions(1);

    const { element } = await setupSidebarChild();

    expect(element.hasAttribute('data-sticky')).toBe(false);
  });

  it('renders data-sticky when sticky is bound true and removes it when false', async () => {
    expect.assertions(2);

    const sticky = signal(true);
    const { element, fixture } = await setupSidebarChild([
      inputBinding('sticky', sticky),
    ]);

    expect(element.getAttribute('data-sticky')).toBe('');

    sticky.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-sticky')).toBe(false);
  });

  it('carries no presence attribute and loads no item link alone', async () => {
    expect.assertions(2);

    removeItemLinks();
    const { element } = await setupSidebarChild([
      inputBinding('sticky', () => true),
    ]);

    expect(presenceAttributes(element)).toStrictEqual([]);
    expect(itemLinks()).toHaveLength(0);
  });
});
