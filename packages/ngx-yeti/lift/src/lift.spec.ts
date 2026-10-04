import { Component, inputBinding, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  itemLinks,
  itemStylesLoaded,
  nextFrame,
  removeItemLinks,
  stylesheetLoaded,
} from '@ngx-yeti/testing';
import type { YetiLift } from 'ngx-yeti';
import { YetiCard } from 'ngx-yeti/card';
import { provideYetiStyles } from 'ngx-yeti/styles';
import { page, server } from 'vitest/browser';
import { NgxYetiLift } from './lift';

@Component({
  selector: 'yeti-lift-reference-host',
  imports: [NgxYetiLift],
  template: '<article #l="yetiLift" yetiLift="scale"></article>',
})
class ReferenceHost {
  readonly lift = viewChild.required<NgxYetiLift>('l');
}

@Component({
  selector: 'yeti-lift-shared-host',
  imports: [YetiCard, NgxYetiLift],
  template: '<article yetiCard yetiLift raised></article>',
})
class SharedHost {}

@Component({
  selector: 'yeti-lift-hover-host',
  imports: [YetiCard, NgxYetiLift],
  template:
    '<p data-testid="away">Away from the cards</p><article data-testid="rise" yetiCard raised yetiLift><h3><a href="#rise">Rise</a></h3></article><article data-testid="scale" yetiCard raised yetiLift="scale"><h3><a href="#scale">Scale</a></h3></article><article data-testid="without" yetiCard raised><h3><a href="#without">Without</a></h3></article>',
})
class HoverHost {}

/** Yeti's built CSS, served by Vite from the workspace's node_modules. */
const yetiCss = `/@fs/${server.config.root.replaceAll('\\', '/')}/../../node_modules/yeti-css/dist/css/`;

/**
 * The part of the setup spec's global stylesheet the pointer cases read: the
 * layer order, the tokens, and the reset. Not the whole always-loaded group.
 */
const globalFiles = [
  'layers.css',
  'tokens/scale.css',
  'tokens/space.css',
  'tokens/type.css',
  'tokens/color.css',
  'tokens/tone.css',
  'tokens/motion.css',
  'tokens/surface.css',
  'tokens/components.css',
  'base/reset.css',
];

/** Adds the global stylesheet once per test file, as an application does. */
async function globalStylesheet(): Promise<void> {
  for (const file of globalFiles) {
    const href = `${yetiCss}${file}`;
    let link = document.head.querySelector<HTMLLinkElement>(
      `link[href="${href}"]`,
    );

    if (link === null) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.append(link);
    }

    await stylesheetLoaded(link);
  }
}

async function setupLift(bound?: YetiLift | '') {
  const gesture = signal<YetiLift | ''>(bound ?? '');
  const fixture = TestBed.createDirective(NgxYetiLift, {
    tagName: 'article',
    bindings: bound === undefined ? [] : [inputBinding('yetiLift', gesture)],
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

  return { destroy, element, fixture, gesture };
}

async function setupHover() {
  await globalStylesheet();
  TestBed.configureTestingModule({
    providers: [provideYetiStyles({ url: yetiCss })],
  });
  const fixture = TestBed.createComponent(HoverHost);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);

  const host = element;
  const card = (testId: string): HTMLElement => {
    const found = host.querySelector(`[data-testid="${testId}"]`);
    assert.instanceOf(found, HTMLElement);

    return found;
  };

  await itemStylesLoaded('card');
  await itemStylesLoaded('lift');

  const rise = card('rise');

  // Chromium and WebKit can keep stale computed styles right after a
  // stylesheet is inserted (upstream bug O2).
  await vi.waitFor(() => {
    assert.include(getComputedStyle(rise).transitionProperty, 'translate');
  });
  // The pointer starts away from every card.
  await page.elementLocator(card('away')).hover();

  return {
    rise,
    scale: card('scale'),
    without: card('without'),
  };
}

describe(NgxYetiLift, () => {
  it('renders its class and no data-lift unset', async () => {
    expect.assertions(2);

    const { element } = await setupLift();

    expect(element.getAttribute('class')).toBe('lift');
    expect(element.hasAttribute('data-lift')).toBe(false);
  });

  it("renders no data-lift for ''", async () => {
    expect.assertions(2);

    const { element } = await setupLift('');

    expect(element.getAttribute('class')).toBe('lift');
    expect(element.hasAttribute('data-lift')).toBe(false);
  });

  it('renders the bound gesture and follows its changes', async () => {
    expect.assertions(4);

    const { element, fixture, gesture } = await setupLift('rise');

    expect(element.getAttribute('data-lift')).toBe('rise');

    gesture.set('scale');
    await fixture.whenStable();

    expect(element.getAttribute('data-lift')).toBe('scale');

    gesture.set('');
    await fixture.whenStable();

    expect(element.hasAttribute('data-lift')).toBe(false);

    gesture.set('rise');
    await fixture.whenStable();

    expect(element.getAttribute('data-lift')).toBe('rise');
  });

  it('is exported as yetiLift', async () => {
    expect.assertions(1);

    const fixture = TestBed.createComponent(ReferenceHost);
    await fixture.whenStable();

    expect(fixture.componentInstance.lift()).toBeInstanceOf(NgxYetiLift);
  });

  it('holds one lift item link while it lives and none after', async () => {
    expect.assertions(3);

    removeItemLinks();
    const { destroy, element } = await setupLift();

    expect(element.getAttribute('data-ngx-yeti-item-lift')).toBe('');
    expect(itemLinks('lift')).toHaveLength(1);

    destroy();
    await nextFrame();

    expect(itemLinks('lift')).toHaveLength(0);
  });

  describe('beside yetiCard on one host', () => {
    it('renders both classes, one data-raised, and both presence attributes', async () => {
      expect.assertions(4);

      const fixture = TestBed.createComponent(SharedHost);
      await fixture.whenStable();
      const element: unknown = fixture.nativeElement;
      assert.instanceOf(element, HTMLElement);
      const article = element.querySelector('article');
      assert.exists(article);

      expect([...article.classList].toSorted()).toStrictEqual(['card', 'lift']);
      expect(article.outerHTML.match(/data-raised=""/g)).toHaveLength(1);
      expect(article.getAttribute('data-ngx-yeti-item-card')).toBe('');
      expect(article.getAttribute('data-ngx-yeti-item-lift')).toBe('');
    });

    it('acquires both item links and releases both on destroy', async () => {
      expect.assertions(4);

      removeItemLinks();
      const fixture = TestBed.createComponent(SharedHost);
      await fixture.whenStable();
      const element: unknown = fixture.nativeElement;
      assert.instanceOf(element, HTMLElement);

      expect(itemLinks('card')).toHaveLength(1);
      expect(itemLinks('lift')).toHaveLength(1);

      fixture.destroy();
      element.remove();
      await nextFrame();

      expect(itemLinks('card')).toHaveLength(0);
      expect(itemLinks('lift')).toHaveLength(0);
    });
  });

  describe('under a real pointer', () => {
    // Under reduced motion Yeti takes the distance to 0 and the deeper shadow
    // carries the hover alone (lift.md user stories 15 and 16), which is how
    // the macOS runner's Safari reports.
    it('raises a hovered card by --yeti-lift-distance and deepens its shadow', async () => {
      expect.assertions(2);

      removeItemLinks();
      const { rise } = await setupHover();
      const top = rise.getBoundingClientRect().top;
      const shadow = getComputedStyle(rise).boxShadow;
      const probe = document.createElement('div');
      probe.style.marginTop = 'var(--yeti-lift-distance)';
      rise.append(probe);
      const distance = parseFloat(getComputedStyle(probe).marginTop);
      probe.remove();

      await page.elementLocator(rise).hover();

      await expect
        .poll(() => getComputedStyle(rise).boxShadow)
        .not.toBe(shadow);
      await expect
        .poll(() => top - rise.getBoundingClientRect().top)
        .toBeCloseTo(distance, 1);
    });

    it('grows a hovered scale card by --yeti-lift-scale without moving it', async () => {
      expect.assertions(2);

      removeItemLinks();
      const { scale } = await setupHover();
      const token = getComputedStyle(scale)
        .getPropertyValue('--yeti-lift-scale')
        .trim();

      await page.elementLocator(scale).hover();

      await expect.poll(() => getComputedStyle(scale).scale).toBe(token);
      expect(getComputedStyle(scale).translate).toBe('none');
    });

    it('does not move a hovered card without yetiLift', async () => {
      expect.assertions(3);

      removeItemLinks();
      const { without } = await setupHover();
      const top = without.getBoundingClientRect().top;

      await page.elementLocator(without).hover();
      await nextFrame();

      expect(without.matches(':hover')).toBe(true);
      expect(getComputedStyle(without).translate).toBe('none');
      expect(without.getBoundingClientRect().top).toBe(top);
    });
  });
});
