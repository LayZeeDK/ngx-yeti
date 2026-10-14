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
import type { YetiAlign, YetiGap } from 'ngx-yeti';
import { YetiIcon } from './icon';

@Component({
  selector: 'yeti-icon-host',
  imports: [YetiIcon],
  // eslint-disable-next-line @angular-eslint/component-max-inline-declarations -- the host holds every template case of the spec in one file
  template: `
    <a
      #i="yetiIcon"
      data-testid="decorative"
      yetiIcon
      class="download"
      href="#download"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 3v12M4 21h16" fill="none" stroke="currentColor" />
      </svg>
      Download
    </a>
    <span data-testid="meaningful" yetiIcon align="baseline">
      <svg role="img" aria-label="Warning" viewBox="0 0 24 24">
        <path d="M12 3 2 21h20z" fill="none" stroke="currentColor" />
      </svg>
      Your session ends in five minutes.
    </span>
  `,
})
class IconHost {
  readonly icon = viewChild.required<YetiIcon>('i');
}

async function setupIcon(bindings: Binding[] = []) {
  return createDirectiveHost(YetiIcon, { tagName: 'button', bindings });
}

async function setupHost() {
  const fixture = TestBed.createComponent(IconHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const root = element;
  const hostOf = (id: string): { host: HTMLElement; svg: SVGSVGElement } => {
    const host = root.querySelector(`[data-testid="${id}"]`);
    assert.instanceOf(host, HTMLElement);
    const svg = host.querySelector(':scope > svg');
    assert.instanceOf(svg, SVGSVGElement);

    return { host, svg };
  };

  return { component: fixture.componentInstance, hostOf };
}

describe(YetiIcon, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    const addEventListener = vi.spyOn(
      EventTarget.prototype,
      'addEventListener',
    );

    try {
      const { element } = await setupIcon();

      expect(addEventListener.mock.contexts).not.toContain(element);
    } finally {
      addEventListener.mockRestore();
    }
  });

  it('renders its class and presence attribute and no unset attribute', async () => {
    expect.assertions(7);

    const { element } = await setupIcon();

    expect(element.getAttribute('class')).toBe('icon');
    expect(element.getAttribute('data-ngx-yeti-item-icon')).toBe('');
    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-align')).toBe(false);
    expect(element.hasAttribute('align')).toBe(false);
    expect(element.hasAttribute('role')).toBe(false);
    expect(element.hasAttribute('tabindex')).toBe(false);
  });

  it('renders no other package attribute and no ARIA attribute', async () => {
    expect.assertions(1);

    const { element } = await setupIcon();

    expect(
      element
        .getAttributeNames()
        .filter((name) => name.startsWith('data-') || name.startsWith('aria-'))
        .toSorted(),
    ).toStrictEqual(['data-ngx-yeti-item-icon']);
  });

  it('renders each bound input, removes it when unset, and never writes align', async () => {
    expect.assertions(6);

    const inputs = {
      gap: signal<YetiGap | undefined>('sm'),
      align: signal<YetiAlign | undefined>('baseline'),
    };
    const { element, fixture } = await setupIcon(
      Object.entries(inputs).map(([name, value]) => inputBinding(name, value)),
    );

    expect(element.getAttribute('data-gap')).toBe('sm');
    expect(element.getAttribute('data-align')).toBe('baseline');
    expect(element.hasAttribute('align')).toBe(false);

    inputs.gap.set(undefined);
    inputs.align.set(undefined);
    await fixture.whenStable();

    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-align')).toBe(false);
    expect(element.hasAttribute('align')).toBe(false);
  });

  it('loads one item link while it lives and removes it a frame after destroy', async () => {
    expect.assertions(2);

    removeItemLinks();
    const { destroy } = await setupIcon();

    expect(itemLinks('icon')).toHaveLength(1);

    destroy();
    await nextFrame();

    expect(itemLinks('icon')).toHaveLength(0);
  });

  it('shares one item link between two icons until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupIcon();
    const second = await setupIcon();

    expect(itemLinks('icon')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('icon')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('icon')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('resolves the template reference', async () => {
      expect.assertions(1);

      const { component } = await setupHost();

      expect(component.icon()).toBeInstanceOf(YetiIcon);
    });

    it('renders a static align on data-align only', async () => {
      expect.assertions(2);

      const { hostOf } = await setupHost();
      const { host } = hostOf('meaningful');

      expect(host.getAttribute('data-align')).toBe('baseline');
      expect(host.hasAttribute('align')).toBe(false);
    });

    it("keeps the consumer's own class and href", async () => {
      expect.assertions(2);

      const { hostOf } = await setupHost();
      const { host } = hostOf('decorative');

      expect([...host.classList].toSorted()).toStrictEqual([
        'download',
        'icon',
      ]);
      expect(host.getAttribute('href')).toBe('#download');
    });

    it('writes no attribute on a decorative SVG and keeps its aria-hidden', async () => {
      expect.assertions(2);

      const { hostOf } = await setupHost();
      const { svg } = hostOf('decorative');

      expect(svg.getAttributeNames().toSorted()).toStrictEqual([
        'aria-hidden',
        'viewBox',
      ]);
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });

    it('writes no attribute on a meaningful SVG and keeps its role and aria-label', async () => {
      expect.assertions(3);

      const { hostOf } = await setupHost();
      const { svg } = hostOf('meaningful');

      expect(svg.getAttributeNames().toSorted()).toStrictEqual([
        'aria-label',
        'role',
        'viewBox',
      ]);
      expect(svg.getAttribute('role')).toBe('img');
      expect(svg.getAttribute('aria-label')).toBe('Warning');
    });

    it('adds no role, tabindex, or ARIA attribute to a host in a template', async () => {
      expect.assertions(2);

      const { hostOf } = await setupHost();

      for (const id of ['decorative', 'meaningful']) {
        expect(
          hostOf(id)
            .host.getAttributeNames()
            .filter(
              (name) =>
                name === 'role' ||
                name === 'tabindex' ||
                name.startsWith('aria-'),
            ),
        ).toStrictEqual([]);
      }
    });
  });
});
