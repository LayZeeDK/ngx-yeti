import {
  type Binding,
  Component,
  inputBinding,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { itemLinks, nextFrame, removeItemLinks } from '@ngx-yeti/testing';
import type { YetiRatio } from 'ngx-yeti';
import { YetiBorder } from 'ngx-yeti/box';
import { YetiBreakout, YetiBreakoutChild } from 'ngx-yeti/breakout';
import { YetiFrame } from './frame';

@Component({
  selector: 'yeti-frame-host',
  imports: [YetiFrame, YetiBorder, YetiBreakout, YetiBreakoutChild],
  template:
    '<div #f="yetiFrame" yetiFrame class="photo"><span>A stand-in</span></div><article yetiBreakout><div yetiFrame yetiBorder yetiBreakoutChild ratio="21/9" bleed><span>A wide stand-in</span></div></article>',
})
class FrameHost {
  readonly frame = viewChild.required<YetiFrame>('f');
}

async function setupFrame(bindings: Binding[] = []) {
  const fixture = TestBed.createDirective(YetiFrame, {
    tagName: 'div',
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
  const fixture = TestBed.createComponent(FrameHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const [photo, composed] = element.querySelectorAll('[yetiframe]');
  assert.instanceOf(photo, HTMLElement);
  assert.instanceOf(composed, HTMLElement);

  return { composed, fixture, host: fixture.componentInstance, photo };
}

describe(YetiFrame, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    const addEventListener = vi.spyOn(
      EventTarget.prototype,
      'addEventListener',
    );

    try {
      const { element } = await setupFrame();

      expect(addEventListener.mock.contexts).not.toContain(element);
    } finally {
      addEventListener.mockRestore();
    }
  });

  it('renders its class and presence attribute and no ratio, role, or tab stop when unset', async () => {
    expect.assertions(5);

    const { element } = await setupFrame();

    expect(element.getAttribute('class')).toBe('frame');
    expect(element.getAttribute('data-ngx-yeti-item-frame')).toBe('');
    expect(element.hasAttribute('data-ratio')).toBe(false);
    expect(element.hasAttribute('role')).toBe(false);
    expect(element.hasAttribute('tabindex')).toBe(false);
  });

  it('renders each ratio from a binding and removes it when unset', async () => {
    expect.assertions(6);

    const ratio = signal<YetiRatio | undefined>('1/1');
    const { element, fixture } = await setupFrame([
      inputBinding('ratio', ratio),
    ]);
    const ratios: readonly YetiRatio[] = ['1/1', '4/3', '3/2', '16/9', '21/9'];
    const rendered: (string | null)[] = [];

    for (const value of ratios) {
      ratio.set(value);
      await fixture.whenStable();
      rendered.push(element.getAttribute('data-ratio'));
    }

    expect(rendered).toStrictEqual(ratios);

    ratio.set(undefined);
    await fixture.whenStable();

    expect(element.hasAttribute('data-ratio')).toBe(false);

    ratio.set('4/3');
    await fixture.whenStable();

    expect(element.getAttribute('data-ratio')).toBe('4/3');
    expect(element.getAttribute('class')).toBe('frame');
    expect(element.getAttribute('data-ngx-yeti-item-frame')).toBe('');
    expect(element.hasAttribute('ratio')).toBe(false);
  });

  it('holds one item link while it lives and removes it a frame after destroy', async () => {
    expect.assertions(2);

    removeItemLinks();
    const frame = await setupFrame();

    expect(itemLinks('frame')).toHaveLength(1);

    frame.destroy();
    await nextFrame();

    expect(itemLinks('frame')).toHaveLength(0);
  });

  it('shares one item link between two frames until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupFrame();
    const second = await setupFrame();

    expect(itemLinks('frame')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('frame')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('frame')).toHaveLength(0);
  });

  it('provides nothing on its host but itself', async () => {
    expect.assertions(1);

    const { fixture } = await setupHost();
    const photo = fixture.debugElement.query(By.css('.photo'));

    expect(photo.providerTokens).toStrictEqual([YetiFrame]);
  });

  describe('in a template', () => {
    it('resolves the template reference', async () => {
      expect.assertions(1);

      const { host } = await setupHost();

      expect(host.frame()).toBeInstanceOf(YetiFrame);
    });

    it("keeps the consumer's class beside frame", async () => {
      expect.assertions(1);

      const { photo } = await setupHost();

      expect([...photo.classList].toSorted()).toStrictEqual(['frame', 'photo']);
    });

    it('renders frame, data-border, and data-bleed together beside yetiBorder and yetiBreakoutChild', async () => {
      expect.assertions(5);

      const { composed } = await setupHost();

      expect(composed.getAttribute('class')).toBe('frame');
      expect(composed.getAttribute('data-ngx-yeti-item-frame')).toBe('');
      expect(composed.getAttribute('data-ratio')).toBe('21/9');
      expect(composed.getAttribute('data-border')).toBe('');
      expect(composed.getAttribute('data-bleed')).toBe('');
    });
  });
});
