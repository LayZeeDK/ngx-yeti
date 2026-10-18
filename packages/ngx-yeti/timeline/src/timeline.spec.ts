import {
  type Binding,
  Component,
  getDebugNode,
  inputBinding,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { itemLinks, nextFrame, removeItemLinks } from '@ngx-yeti/testing';
import { createDirectiveHost } from '@ngx-yeti/testing/test-bed';
import type { YetiGap } from 'ngx-yeti';
import { YetiTimeline } from './timeline';

@Component({
  selector: 'yeti-timeline-host',
  imports: [YetiTimeline],
  template:
    '<ol #t="yetiTimeline" yetiTimeline class="history" role="list" alternate gap="md">@for (entry of entries; track entry.date) {<li><time [attr.datetime]="entry.date">{{ entry.label }}</time></li>}</ol><ul yetiTimeline><li>Not an entry</li></ul>',
})
class TimelineHost {
  readonly timeline = viewChild.required<YetiTimeline>('t');
  protected readonly entries = [
    { date: '2026-09-12', label: '12 September' },
    { date: '2026-09-13', label: '13 September' },
    { date: '2026-09-14', label: '14 September' },
  ];
}

async function setupTimeline(bindings: Binding[] = []) {
  return createDirectiveHost(YetiTimeline, {
    tagName: 'ol',
    bindings,
  });
}

async function setupHost() {
  const fixture = TestBed.createComponent(TimelineHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const list = element.querySelector('ol');
  const other = element.querySelector('ul');
  assert.exists(list);
  assert.exists(other);

  return { host: fixture.componentInstance, list, other };
}

describe(YetiTimeline, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    const addEventListener = vi.spyOn(
      EventTarget.prototype,
      'addEventListener',
    );

    try {
      const { element } = await setupTimeline();

      expect(addEventListener.mock.contexts).not.toContain(element);
    } finally {
      addEventListener.mockRestore();
    }
  });

  it('renders its class and presence attribute and no unset attribute', async () => {
    expect.assertions(5);

    const { element } = await setupTimeline();

    expect(element.getAttribute('class')).toBe('timeline');
    expect(element.getAttribute('data-ngx-yeti-item-timeline')).toBe('');
    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-alternate')).toBe(false);
    expect(element.hasAttribute('role')).toBe(false);
  });

  it('renders a bound gap, updates it, and removes it when unset', async () => {
    expect.assertions(3);

    const gap = signal<YetiGap | undefined>('sm');
    const { element, fixture } = await setupTimeline([
      inputBinding('gap', gap),
    ]);

    expect(element.getAttribute('data-gap')).toBe('sm');

    gap.set('xl-2xl');
    await fixture.whenStable();

    expect(element.getAttribute('data-gap')).toBe('xl-2xl');

    gap.set(undefined);
    await fixture.whenStable();

    expect(element.hasAttribute('data-gap')).toBe(false);
  });

  it("renders data-alternate for true and for the static attribute's empty string, and removes it for false", async () => {
    expect.assertions(3);

    const alternate = signal<boolean | ''>(true);
    const { element, fixture } = await setupTimeline([
      inputBinding('alternate', alternate),
    ]);

    expect(element.getAttribute('data-alternate')).toBe('');

    alternate.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-alternate')).toBe(false);

    alternate.set('');
    await fixture.whenStable();

    expect(element.getAttribute('data-alternate')).toBe('');
  });

  it('keeps one item link while it lives and removes it a frame after destroy', async () => {
    expect.assertions(2);

    removeItemLinks();
    const { destroy } = await setupTimeline();

    expect(itemLinks('timeline')).toHaveLength(1);

    destroy();
    await nextFrame();

    expect(itemLinks('timeline')).toHaveLength(0);
  });

  it('shares one item link between two timelines until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupTimeline();
    const second = await setupTimeline();

    expect(itemLinks('timeline')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('timeline')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('timeline')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('resolves the template reference', async () => {
      expect.assertions(1);

      const { host } = await setupHost();

      expect(host.timeline()).toBeInstanceOf(YetiTimeline);
    });

    it('provides no token on its host', async () => {
      expect.assertions(1);

      const { list } = await setupHost();

      expect(getDebugNode(list)?.providerTokens).toStrictEqual([YetiTimeline]);
    });

    it("keeps the consumer's own class and role beside timeline", async () => {
      expect.assertions(2);

      const { list } = await setupHost();

      expect([...list.classList].toSorted()).toStrictEqual([
        'history',
        'timeline',
      ]);
      expect(list.getAttribute('role')).toBe('list');
    });

    it('renders a static alternate and gap on their data attributes', async () => {
      expect.assertions(2);

      const { list } = await setupHost();

      expect(list.getAttribute('data-alternate')).toBe('');
      expect(list.getAttribute('data-gap')).toBe('md');
    });

    it('gives a ul no class and no presence attribute', async () => {
      expect.assertions(2);

      const { other } = await setupHost();

      expect(other.hasAttribute('class')).toBe(false);
      expect(
        other
          .getAttributeNames()
          .filter((name) => name.startsWith('data-ngx-yeti-')),
      ).toStrictEqual([]);
    });

    it('renders entries from @for as direct li children with no wrapper', async () => {
      expect.assertions(2);

      const { list } = await setupHost();
      const children = [...list.children];

      expect(children.map((child) => child.localName)).toStrictEqual([
        'li',
        'li',
        'li',
      ]);
      expect(
        children.map((child) =>
          child.querySelector(':scope > time')?.getAttribute('datetime'),
        ),
      ).toStrictEqual(['2026-09-12', '2026-09-13', '2026-09-14']);
    });
  });
});
