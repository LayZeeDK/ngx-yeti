import {
  type Binding,
  Component,
  inputBinding,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { itemLinks, nextFrame, removeItemLinks } from '@ngx-yeti/testing';
import type { YetiGap, YetiWidth } from 'ngx-yeti';
import { YetiCenter } from './center';

@Component({
  selector: 'yeti-center-host',
  imports: [YetiCenter],
  template:
    '<main #c="yetiCenter" yetiCenter class="page" max="md" intrinsic></main>',
})
class CenterHost {
  readonly center = viewChild.required<YetiCenter>('c');
}

async function setupCenter(bindings: Binding[] = []) {
  const fixture = TestBed.createDirective(YetiCenter, {
    tagName: 'main',
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

async function setupHost() {
  const fixture = TestBed.createComponent(CenterHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const main = element.querySelector('main');
  assert.exists(main);

  return { center: fixture.componentInstance.center(), main };
}

describe(YetiCenter, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    const addEventListener = vi.spyOn(
      EventTarget.prototype,
      'addEventListener',
    );

    try {
      const { element } = await setupCenter();

      expect(addEventListener.mock.contexts).not.toContain(element);
    } finally {
      addEventListener.mockRestore();
    }
  });

  it('renders its class and presence attribute and no unset attribute', async () => {
    expect.assertions(6);

    const { element } = await setupCenter();

    expect(element.getAttribute('class')).toBe('center');
    expect(element.getAttribute('data-ngx-yeti-item-center')).toBe('');
    expect(element.hasAttribute('data-max')).toBe(false);
    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-intrinsic')).toBe(false);
    expect(element.hasAttribute('role')).toBe(false);
  });

  it('renders each bound input and removes it when unset', async () => {
    expect.assertions(6);

    const inputs = {
      max: signal<YetiWidth | undefined>('lg'),
      gap: signal<YetiGap | undefined>('sm-lg'),
      intrinsic: signal(true),
    };
    const { element, fixture } = await setupCenter(
      Object.entries(inputs).map(([name, value]) => inputBinding(name, value)),
    );

    expect(element.getAttribute('data-max')).toBe('lg');
    expect(element.getAttribute('data-gap')).toBe('sm-lg');
    expect(element.getAttribute('data-intrinsic')).toBe('');

    inputs.max.set(undefined);
    inputs.gap.set(undefined);
    inputs.intrinsic.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-max')).toBe(false);
    expect(element.hasAttribute('data-gap')).toBe(false);
    expect(element.hasAttribute('data-intrinsic')).toBe(false);
  });

  it('shares one item link between two centers until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupCenter();
    const second = await setupCenter();

    expect(itemLinks('center')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('center')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('center')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('resolves the template reference', async () => {
      expect.assertions(1);

      const { center } = await setupHost();

      expect(center).toBeInstanceOf(YetiCenter);
    });

    it("keeps the consumer's own class beside center", async () => {
      expect.assertions(1);

      const { main } = await setupHost();

      expect([...main.classList].toSorted()).toStrictEqual(['center', 'page']);
    });

    it('keeps a static max beside data-max, and sets intrinsic from its static form', async () => {
      expect.assertions(3);

      const { main } = await setupHost();

      expect(main.getAttribute('max')).toBe('md');
      expect(main.getAttribute('data-max')).toBe('md');
      expect(main.getAttribute('data-intrinsic')).toBe('');
    });
  });
});
