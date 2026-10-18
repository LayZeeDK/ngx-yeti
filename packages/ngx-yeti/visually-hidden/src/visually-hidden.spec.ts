import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { itemLinks, nextFrame, removeItemLinks } from '@ngx-yeti/testing';
import { createDirectiveHost } from '@ngx-yeti/testing/test-bed';
import { YetiVisuallyHidden } from './visually-hidden';

@Component({
  selector: 'yeti-visually-hidden-host',
  imports: [YetiVisuallyHidden],
  template:
    '<a href="#trail-map">Read more<span #v="yetiVisuallyHidden" yetiVisuallyHidden class="note"> about the trail map</span></a>',
})
class ReferenceHost {
  readonly hidden = viewChild.required<YetiVisuallyHidden>('v');
}

async function setupHidden() {
  return createDirectiveHost(YetiVisuallyHidden, { tagName: 'span' });
}

async function setupHost() {
  const fixture = TestBed.createComponent(ReferenceHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const span = element.querySelector('span');
  assert.exists(span);

  return { host: fixture.componentInstance, span };
}

describe(YetiVisuallyHidden, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    const addEventListener = vi.spyOn(
      EventTarget.prototype,
      'addEventListener',
    );

    try {
      const { element } = await setupHidden();

      expect(addEventListener.mock.contexts).not.toContain(element);
    } finally {
      addEventListener.mockRestore();
    }
  });

  it('renders its class and presence attribute and nothing else', async () => {
    expect.assertions(2);

    const { element } = await setupHidden();

    expect(element.getAttribute('class')).toBe('visually-hidden');
    // TestBed writes `id` and `ng-version` on the root element it creates.
    expect(
      element
        .getAttributeNames()
        .filter((name) => name !== 'id' && name !== 'ng-version')
        .toSorted(),
    ).toStrictEqual(['class', 'data-ngx-yeti-item-visually-hidden']);
  });

  it('shares one item link between two hosts until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupHidden();
    const second = await setupHidden();

    expect(itemLinks('visually-hidden')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('visually-hidden')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('visually-hidden')).toHaveLength(0);
  });

  it('is exported as yetiVisuallyHidden', async () => {
    expect.assertions(1);

    const { host } = await setupHost();

    expect(host.hidden()).toBeInstanceOf(YetiVisuallyHidden);
  });

  it("keeps the consumer's own class beside Yeti's", async () => {
    expect.assertions(2);

    const { span } = await setupHost();

    expect([...span.classList].toSorted()).toStrictEqual([
      'note',
      'visually-hidden',
    ]);
    expect(span.getAttribute('data-ngx-yeti-item-visually-hidden')).toBe('');
  });
});
