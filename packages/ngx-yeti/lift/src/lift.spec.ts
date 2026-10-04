import { Component, inputBinding, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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

/** The always-loaded group of the setup spec's global stylesheet. */
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

function itemLinks(item: string): number {
  return document.head.querySelectorAll(`link[data-ngx-yeti-styles="${item}"]`)
    .length;
}

/** Waits past the frame the loader's removal check runs in. */
async function nextFrame(): Promise<void> {
  for (let frame = 0; frame < 2; frame++) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  }
}

function removeItemLinks(): void {
  // Links an earlier test's loader left in the shared document.
  for (const link of document.head.querySelectorAll(
    'link[data-ngx-yeti-styles]',
  )) {
    link.remove();
  }
}

async function loaded(link: HTMLLinkElement): Promise<void> {
  if (link.sheet !== null) {
    return;
  }

  await new Promise((resolve, reject) => {
    link.addEventListener('load', resolve, { once: true });
    link.addEventListener('error', reject, { once: true });
  });
}

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

    await loaded(link);
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

  for (const item of ['card', 'lift']) {
    const link = document.head.querySelector<HTMLLinkElement>(
      `link[data-ngx-yeti-styles="${item}"]`,
    );
    assert.exists(link);
    await loaded(link);
  }

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
    expect(itemLinks('lift')).toBe(1);

    destroy();
    await nextFrame();

    expect(itemLinks('lift')).toBe(0);
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

      expect(itemLinks('card')).toBe(1);
      expect(itemLinks('lift')).toBe(1);

      fixture.destroy();
      element.remove();
      await nextFrame();

      expect(itemLinks('card')).toBe(0);
      expect(itemLinks('lift')).toBe(0);
    });
  });

  describe('under a real pointer', () => {
    it('raises a hovered card and deepens its shadow', async () => {
      expect.assertions(2);

      removeItemLinks();
      const { rise } = await setupHover();
      const top = rise.getBoundingClientRect().top;
      const shadow = getComputedStyle(rise).boxShadow;

      await page.elementLocator(rise).hover();

      await expect
        .poll(() => rise.getBoundingClientRect().top)
        .toBeLessThan(top);
      await expect
        .poll(() => getComputedStyle(rise).boxShadow)
        .not.toBe(shadow);
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
