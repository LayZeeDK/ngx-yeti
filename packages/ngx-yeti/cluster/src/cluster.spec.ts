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
import type { YetiAlign, YetiGap, YetiJustify, YetiWidth } from 'ngx-yeti';
import { NgxYetiEnter } from 'ngx-yeti/enter';
import { YetiCluster } from './cluster';

@Component({
  selector: 'yeti-cluster-host',
  imports: [YetiCluster, NgxYetiEnter],
  template:
    '<nav #c="yetiCluster" yetiCluster class="site" aria-label="Site" align="end"><a href="#home">Home</a><a href="#docs">Docs</a></nav><ul yetiCluster yetiEnter="rise" stagger role="list"><li>Hills</li><li>Lakes</li></ul>',
})
class ClusterHost {
  readonly cluster = viewChild.required<YetiCluster>('c');
}

async function setupCluster(bindings: Binding[] = []) {
  return createDirectiveHost(YetiCluster, {
    tagName: 'div',
    bindings,
  });
}

async function setupHost() {
  const fixture = TestBed.createComponent(ClusterHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const nav = element.querySelector('nav');
  const list = element.querySelector('ul');
  assert.exists(nav);
  assert.exists(list);

  return { host: fixture.componentInstance, list, nav };
}

describe(YetiCluster, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    const addEventListener = vi.spyOn(
      EventTarget.prototype,
      'addEventListener',
    );

    try {
      const { element } = await setupCluster();

      expect(addEventListener.mock.contexts).not.toContain(element);
    } finally {
      addEventListener.mockRestore();
    }
  });

  it('renders its class and presence attribute and no unset attribute', async () => {
    expect.assertions(9);

    const { element } = await setupCluster();

    expect(element.getAttribute('class')).toBe('cluster');
    expect(element.getAttribute('data-ngx-yeti-item-cluster')).toBe('');
    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-align')).toBe(false);
    expect(element.hasAttribute('data-justify')).toBe(false);
    expect(element.hasAttribute('data-threshold')).toBe(false);
    expect(element.hasAttribute('align')).toBe(false);
    expect(element.hasAttribute('role')).toBe(false);
    expect(element.hasAttribute('tabindex')).toBe(false);
  });

  it('renders no other package attribute', async () => {
    expect.assertions(1);

    const { element } = await setupCluster();

    expect(
      element
        .getAttributeNames()
        .filter((name) => name.startsWith('data-'))
        .toSorted(),
    ).toStrictEqual(['data-ngx-yeti-item-cluster']);
  });

  it('renders each bound input, removes it when unset, and never writes align', async () => {
    expect.assertions(10);

    const inputs = {
      gap: signal<YetiGap | undefined>('sm-lg'),
      align: signal<YetiAlign | undefined>('baseline'),
      justify: signal<YetiJustify | undefined>('between'),
      threshold: signal<YetiWidth | undefined>('sm'),
    };
    const { element, fixture } = await setupCluster(
      Object.entries(inputs).map(([name, value]) => inputBinding(name, value)),
    );

    expect(element.getAttribute('data-gap')).toBe('sm-lg');
    expect(element.getAttribute('data-align')).toBe('baseline');
    expect(element.getAttribute('data-justify')).toBe('between');
    expect(element.getAttribute('data-threshold')).toBe('sm');
    expect(element.hasAttribute('align')).toBe(false);

    inputs.gap.set(undefined);
    inputs.align.set(undefined);
    inputs.justify.set(undefined);
    inputs.threshold.set(undefined);
    await fixture.whenStable();

    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-align')).toBe(false);
    expect(element.hasAttribute('data-justify')).toBe(false);
    expect(element.hasAttribute('data-threshold')).toBe(false);
    expect(element.hasAttribute('align')).toBe(false);
  });

  it('loads one item link while it lives and removes it a frame after destroy', async () => {
    expect.assertions(2);

    removeItemLinks();
    const { destroy } = await setupCluster();

    expect(itemLinks('cluster')).toHaveLength(1);

    destroy();
    await nextFrame();

    expect(itemLinks('cluster')).toHaveLength(0);
  });

  it('shares one item link between two clusters until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupCluster();
    const second = await setupCluster();

    expect(itemLinks('cluster')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('cluster')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('cluster')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('resolves the template reference', async () => {
      expect.assertions(1);

      const { host } = await setupHost();

      expect(host.cluster()).toBeInstanceOf(YetiCluster);
    });

    it('renders a static align on data-align only, and leaves the text start-aligned', async () => {
      expect.assertions(3);

      const { nav } = await setupHost();

      expect(nav.getAttribute('data-align')).toBe('end');
      expect(nav.hasAttribute('align')).toBe(false);
      expect(getComputedStyle(nav).textAlign).toBe('start');
    });

    it("keeps the consumer's own class, role, and aria-label", async () => {
      expect.assertions(3);

      const { list, nav } = await setupHost();

      expect([...nav.classList].toSorted()).toStrictEqual(['cluster', 'site']);
      expect(nav.getAttribute('aria-label')).toBe('Site');
      expect(list.getAttribute('role')).toBe('list');
    });

    it('carries both presence attributes on a host shared with yetiEnter', async () => {
      expect.assertions(4);

      const { list } = await setupHost();

      expect(list.getAttribute('data-ngx-yeti-item-cluster')).toBe('');
      expect(list.getAttribute('data-ngx-yeti-item-enter')).toBe('');
      expect(list.classList.contains('cluster')).toBe(true);
      expect(list.getAttribute('data-stagger')).toBe('');
    });
  });
});
