import {
  type Binding,
  Component,
  Directive,
  ElementRef,
  inject,
  inputBinding,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  itemLinks,
  itemStylesLoaded,
  nextFrame,
  removeItemLinks,
  stylesheetLoaded,
} from '@ngx-yeti/testing';
import { createDirectiveHost } from '@ngx-yeti/testing/test-bed';
import type { YetiEnter, YetiSide } from 'ngx-yeti';
import { provideYetiStyles } from 'ngx-yeti/styles';
import { server } from 'vitest/browser';
import { NgxYetiEnter } from './enter';

@Component({
  selector: 'yeti-enter-reference-host',
  imports: [NgxYetiEnter],
  template:
    '<ul #e="yetiEnter" yetiEnter="rise" class="trails" role="list" stagger view once><li>Hills</li><li>Lakes</li></ul>',
})
class ReferenceHost {
  readonly enter = viewChild.required<NgxYetiEnter>('e');
}

/**
 * A list that arrives once, with a link in each item and a reference list
 * without the directive.
 */
@Component({
  selector: 'yeti-enter-order-host',
  imports: [NgxYetiEnter],
  template:
    '<ul data-testid="arriving" yetiEnter="rise" stagger once role="list"><li><a href="#hills">Hills</a></li><li><a href="#lakes">Lakes</a></li></ul>',
})
class OrderHost {}

/** Reads its host when it is created, before the host's first update. */
@Directive({ selector: '[yetiEnterCreationProbe]' })
class CreationProbe {
  readonly enterAtCreation =
    inject<ElementRef<Element>>(ElementRef).nativeElement.classList.contains(
      'enter',
    );
}

@Component({
  selector: 'yeti-enter-binding-host',
  imports: [NgxYetiEnter, CreationProbe],
  template: '<p yetiEnter once yetiEnterCreationProbe>A note that arrives.</p>',
})
class BindingHost {
  readonly probe = viewChild.required(CreationProbe);
}

/** Yeti's built CSS, served by Vite from the workspace's node_modules. */
const yetiCss: `${string}/` = `/@fs/${server.config.root.replaceAll('\\', '/')}/../../node_modules/yeti-css/dist/css/`;

/** Storybook's global stylesheet, which Vite serves with its imports inlined. */
const globalHref = `/@fs/${server.config.root.replaceAll('\\', '/')}/.storybook/styles.css`;

/**
 * Adds the global stylesheet, which ends with the package's global stylesheet
 * ("ngx-yeti/ngx-yeti-globals.css"), once per test file, as an application
 * does.
 */
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

/** A `once` arrival and the keyframes it plays when it arrives. */
interface Arrival {
  readonly form: string;
  readonly enter: YetiEnter | '';
  readonly side?: YetiSide;
  readonly stagger?: boolean;
  readonly rtl?: boolean;
  readonly keyframes: string;
}

const arrivals: readonly Arrival[] = [
  { form: 'the fade', enter: '', keyframes: 'yeti-enter-fade' },
  { form: 'rise', enter: 'rise', keyframes: 'yeti-enter-rise' },
  { form: 'fall', enter: 'fall', keyframes: 'yeti-enter-fall' },
  { form: 'scale', enter: 'scale', keyframes: 'yeti-enter-scale' },
  { form: 'slide', enter: 'slide', keyframes: 'yeti-enter-slide-start' },
  {
    form: 'slide from the end edge',
    enter: 'slide',
    side: 'end',
    keyframes: 'yeti-enter-slide-end',
  },
  {
    form: 'slide in a right-to-left page',
    enter: 'slide',
    rtl: true,
    keyframes: 'yeti-enter-slide-end',
  },
  {
    form: 'staggered rise',
    enter: 'rise',
    stagger: true,
    keyframes: 'yeti-enter-rise',
  },
  {
    form: 'staggered slide from the end edge',
    enter: 'slide',
    side: 'end',
    stagger: true,
    keyframes: 'yeti-enter-slide-end',
  },
  {
    form: 'staggered slide in a right-to-left page',
    enter: 'slide',
    stagger: true,
    rtl: true,
    keyframes: 'yeti-enter-slide-end',
  },
];

/** Puts the document in right-to-left until the test ends. */
function rightToLeft(): void {
  const root = document.documentElement;
  const dir = root.getAttribute('dir');

  root.setAttribute('dir', 'rtl');
  onTestFinished(() => {
    if (dir === null) {
      root.removeAttribute('dir');
    } else {
      root.setAttribute('dir', dir);
    }
  });
}

/**
 * Records each `animationstart` in the document until the test ends, and
 * returns a reader of the animation names started on one element.
 */
function recordStarts(): (target: Element) => string[] {
  const starts: {
    readonly target: EventTarget | null;
    readonly name: string;
  }[] = [];
  const record = (event: AnimationEvent): void => {
    starts.push({ target: event.target, name: event.animationName });
  };

  document.addEventListener('animationstart', record, true);
  onTestFinished(() => {
    document.removeEventListener('animationstart', record, true);
  });

  return (target) =>
    starts.flatMap((start) => (start.target === target ? [start.name] : []));
}

/**
 * Creates `arrival` below the viewport with `once`, under the global
 * stylesheet and Yeti's built enter file. The targets are the elements that
 * play the arrival: the host, or a staggered host's children.
 */
async function setupArrival(arrival: Arrival) {
  removeItemLinks();
  belowTheFold();

  if (arrival.rtl === true) {
    rightToLeft();
  }

  await globalStylesheet();
  TestBed.configureTestingModule({
    providers: [provideYetiStyles({ url: yetiCss })],
  });
  const startsOn = recordStarts();
  const { element } = await createDirectiveHost(NgxYetiEnter, {
    tagName: arrival.stagger === true ? 'ul' : 'p',
    bindings: [
      inputBinding('yetiEnter', () => arrival.enter),
      inputBinding('side', () => arrival.side),
      inputBinding('stagger', () => arrival.stagger ?? false),
      inputBinding('once', () => true),
    ],
  });

  if (arrival.stagger === true) {
    for (const text of ['Hills', 'Lakes']) {
      const item = document.createElement('li');
      item.textContent = text;
      element.append(item);
    }
  } else {
    element.textContent = 'A note that arrives.';
  }

  await itemStylesLoaded('enter');
  await nextFrame();
  await nextFrame();

  const targets = arrival.stagger === true ? [...element.children] : [element];

  return { element, startsOn, targets };
}

/**
 * Each form Yeti's enter file fails to withhold, as Yeti's own markup. On a
 * staggered host the element `data-once` should hold back is its first child.
 */
const brokenForms: Readonly<Record<string, string>> = {
  rise: '<p class="enter" data-enter="rise" data-once>A</p>',
  fall: '<p class="enter" data-enter="fall" data-once>A</p>',
  scale: '<p class="enter" data-enter="scale" data-once>A</p>',
  slide: '<p class="enter" data-enter="slide" data-once>A</p>',
  'slide from the end edge':
    '<p class="enter" data-enter="slide" data-side="end" data-once>A</p>',
  'slide in a right-to-left page':
    '<div dir="rtl"><p class="enter" data-enter="slide" data-once>A</p></div>',
  'staggered slide from the end edge':
    '<div class="enter" data-enter="slide" data-side="end" data-stagger data-once><p>A</p></div>',
  'staggered slide in a right-to-left page':
    '<div dir="rtl"><div class="enter" data-enter="slide" data-stagger data-once><p>A</p></div></div>',
};

const brokenFormsMessage = [
  "Yeti has fixed its once bug, upstream-bugs.md row Y14; the forms received are the ones Yeti's enter file still fails to withhold.",
  'If none is still broken: remove the rule on .enter[data-once] from packages/ngx-yeti/ngx-yeti-globals.css and its fix test in this file; remove this test and its control;',
  'set "What the package adds" of ledger.md row A11Y-33 to "none" and name the pin that fixed it; record that pin in row Y14;',
  'and remove the Departures row for enter.md from .claude/skills/ngx-yeti-specs/SKILL.md and the A11Y-33 entry of sanctionedSelectors in packages/ngx-yeti/src/published-output.node.spec.ts.',
  'If some forms are still broken: keep the fix, and take the fixed forms out of brokenForms and out of row Y14.',
].join(' ');

/** Yeti's built enter file, the one its item link loads. */
async function yetiEnterCss(): Promise<string> {
  // As a stylesheet link asks for it; otherwise Vite serves a module.
  const response = await fetch(`${yetiCss}utilities/enter/enter.css`, {
    headers: { Accept: 'text/css' },
  });
  const css = await response.text();

  assert.isTrue(response.ok, "Yeti's built enter file is served");
  assert.include(css, '@keyframes yeti-enter-rise');
  assert.notInclude(css, 'import.meta');

  return css;
}

/**
 * The forms of `brokenForms` whose withheld element computes an animation
 * name other than `none` in a shadow tree that holds only `css`, out of reach
 * of every rule of the document.
 */
function stillNamed(css: string): string[] {
  const shadowHost = document.createElement('div');
  document.body.append(shadowHost);
  onTestFinished(() => {
    shadowHost.remove();
  });
  const root = shadowHost.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = css;
  root.append(style);

  return Object.entries(brokenForms).flatMap(([form, markup]) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = markup;
    root.append(wrapper);
    const withheld = wrapper.querySelector('[data-once]');
    assert.exists(withheld);
    const target = withheld.hasAttribute('data-stagger')
      ? withheld.firstElementChild
      : withheld;
    assert.exists(target);

    return getComputedStyle(target).animationName === 'none' ? [] : [form];
  });
}

/**
 * Pushes everything TestBed appends to the body below the viewport and
 * scrolls back to the top; the spacer leaves when the test ends.
 */
function belowTheFold(): void {
  const spacer = document.createElement('div');
  spacer.style.blockSize = '300vh';
  document.body.prepend(spacer);
  window.scrollTo(0, 0);
  onTestFinished(() => {
    spacer.remove();
    window.scrollTo(0, 0);
  });
}

async function setupEnter(bindings: Binding[] = []) {
  const host = await createDirectiveHost(NgxYetiEnter, {
    tagName: 'p',
    bindings,
  });
  host.element.textContent = 'A note that arrives.';

  return host;
}

/** Creates a `once` host below the viewport, with `once` bound to a signal. */
async function setupOnce(initial = true) {
  belowTheFold();
  const once = signal(initial);
  const enter = await setupEnter([inputBinding('once', once)]);

  return { ...enter, once };
}

/** Scrolls the host into view and waits for the observer's first report. */
async function scrollIn(element: HTMLElement): Promise<void> {
  element.scrollIntoView();
  await nextFrame();
  await nextFrame();
}

async function scrollAway(): Promise<void> {
  window.scrollTo(0, 0);
  await nextFrame();
  await nextFrame();
}

/** The host's attributes and the role, tabindex, and order of its subtree. */
function readingShape(root: Element): string[] {
  return [root, ...root.querySelectorAll('*')].map(
    (element) =>
      `${element.localName} ${element
        .getAttributeNames()
        .filter((name) => name !== 'data-once')
        .toSorted()
        .map((name) => `${name}=${element.getAttribute(name) ?? ''}`)
        .join(' ')}`,
  );
}

describe(NgxYetiEnter, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    const addEventListener = vi.spyOn(
      EventTarget.prototype,
      'addEventListener',
    );

    try {
      const { element } = await setupEnter([inputBinding('once', () => true)]);

      expect(addEventListener.mock.contexts).not.toContain(element);
    } finally {
      addEventListener.mockRestore();
    }
  });

  it('renders its class and presence attribute and no unset attribute', async () => {
    expect.assertions(8);

    const { element } = await setupEnter();

    expect(element.getAttribute('class')).toBe('enter');
    expect(element.getAttribute('data-ngx-yeti-item-enter')).toBe('');
    expect(element.hasAttribute('data-enter')).toBe(false);
    expect(element.hasAttribute('data-side')).toBe(false);
    expect(element.hasAttribute('data-stagger')).toBe(false);
    expect(element.hasAttribute('data-view')).toBe(false);
    expect(element.hasAttribute('data-once')).toBe(false);
    expect(element.hasAttribute('role')).toBe(false);
  });

  it('renders each bound input and removes it when unset', async () => {
    expect.assertions(8);

    const inputs = {
      yetiEnter: signal<YetiEnter | ''>('slide'),
      side: signal<YetiSide | undefined>('end'),
      stagger: signal(true),
      view: signal(true),
    };
    const { element, fixture } = await setupEnter(
      Object.entries(inputs).map(([name, value]) => inputBinding(name, value)),
    );

    expect(element.getAttribute('data-enter')).toBe('slide');
    expect(element.getAttribute('data-side')).toBe('end');
    expect(element.getAttribute('data-stagger')).toBe('');
    expect(element.getAttribute('data-view')).toBe('');

    inputs.yetiEnter.set('');
    inputs.side.set(undefined);
    inputs.stagger.set(false);
    inputs.view.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-enter')).toBe(false);
    expect(element.hasAttribute('data-side')).toBe(false);
    expect(element.hasAttribute('data-stagger')).toBe(false);
    expect(element.hasAttribute('data-view')).toBe(false);
  });

  it('keeps data-once on a host below the viewport', async () => {
    expect.assertions(1);

    const { element, fixture } = await setupOnce();
    await nextFrame();
    await nextFrame();
    await fixture.whenStable();

    expect(element.getAttribute('data-once')).toBe('');
  });

  it('removes data-once once the host is scrolled into view, without manual change detection', async () => {
    expect.assertions(2);

    const { element, fixture } = await setupOnce();

    element.scrollIntoView();

    await expect
      .poll(() => element.hasAttribute('data-once'), { timeout: 2000 })
      .toBe(false);

    await fixture.whenStable();

    expect(element.hasAttribute('data-once')).toBe(false);
  });

  it('does not put data-once back when the host is scrolled away and back', async () => {
    expect.assertions(3);

    const { element, fixture } = await setupOnce();

    await scrollIn(element);

    await expect.poll(() => element.hasAttribute('data-once')).toBe(false);

    await scrollAway();
    await fixture.whenStable();

    expect(element.hasAttribute('data-once')).toBe(false);

    await scrollIn(element);

    await fixture.whenStable();

    expect(element.hasAttribute('data-once')).toBe(false);
  });

  it('follows once before the arrival, still arrives, and stays arrived', async () => {
    expect.assertions(5);

    const { element, fixture, once } = await setupOnce();

    once.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-once')).toBe(false);

    once.set(true);
    await fixture.whenStable();

    expect(element.getAttribute('data-once')).toBe('');

    await scrollIn(element);

    await expect.poll(() => element.hasAttribute('data-once')).toBe(false);

    once.set(false);
    await fixture.whenStable();
    once.set(true);
    await fixture.whenStable();

    expect(element.hasAttribute('data-once')).toBe(false);

    await scrollAway();
    await fixture.whenStable();

    expect(element.hasAttribute('data-once')).toBe(false);
  });

  it('renders no data-once when once turns true after a first render without it', async () => {
    expect.assertions(2);

    const { element, fixture, once } = await setupOnce(false);

    expect(element.hasAttribute('data-once')).toBe(false);

    once.set(true);
    await fixture.whenStable();

    expect(element.hasAttribute('data-once')).toBe(false);
  });

  it('disconnects its observer when destroyed before the host nears the viewport', async () => {
    expect.assertions(3);

    const disconnect = vi.spyOn(IntersectionObserver.prototype, 'disconnect');

    try {
      const { destroy, element } = await setupOnce();
      await nextFrame();

      expect(element.getAttribute('data-once')).toBe('');
      expect(() => {
        destroy();
      }).not.toThrow();
      expect(disconnect).toHaveBeenCalled();
    } finally {
      disconnect.mockRestore();
    }
  });

  it('holds one enter item link while it lives and none after', async () => {
    expect.assertions(2);

    removeItemLinks();
    const { destroy } = await setupEnter();

    expect(itemLinks('enter')).toHaveLength(1);

    destroy();
    await nextFrame();

    expect(itemLinks('enter')).toHaveLength(0);
  });

  it('shares one item link between two hosts until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupEnter();
    const second = await setupEnter();

    expect(itemLinks('enter')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('enter')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('enter')).toHaveLength(0);
  });

  it('writes the enter class in the same update as data-once, not at creation', async () => {
    expect.assertions(3);

    belowTheFold();
    const fixture = TestBed.createComponent(BindingHost);
    await fixture.whenStable();
    const element: unknown = fixture.nativeElement;
    assert.instanceOf(element, HTMLElement);
    const paragraph = element.querySelector('p');
    assert.exists(paragraph);

    expect(fixture.componentInstance.probe().enterAtCreation).toBe(false);
    expect(paragraph.getAttribute('class')).toBe('enter');
    expect(paragraph.getAttribute('data-once')).toBe('');
  });

  // A browser may report reduced motion, as the Safari of the CI runner does;
  // Yeti then collapses the arrival's duration, so no duration or play state
  // is asserted.
  describe('with the global stylesheet (ledger row A11Y-33)', () => {
    it.for(arrivals)(
      'withholds $form below the viewport, then arrives once when scrolled to',
      async (arrival) => {
        expect.assertions(8);

        const { element, startsOn, targets } = await setupArrival(arrival);
        const each = <T>(value: T): T[] => targets.map(() => value);
        const opacities = (): string[] =>
          targets.map((target) => getComputedStyle(target).opacity);

        expect(element.getAttribute('data-once')).toBe('');
        expect(
          targets.map((target) => getComputedStyle(target).animationName),
        ).toStrictEqual(each('none'));
        expect(opacities()).toStrictEqual(each('1'));
        expect(targets.flatMap(startsOn)).toStrictEqual([]);

        await scrollIn(element);

        await expect.poll(() => element.hasAttribute('data-once')).toBe(false);
        await expect
          .poll(() => targets.map(startsOn))
          .toStrictEqual(each([arrival.keyframes]));
        await expect.poll(opacities).toStrictEqual(each('1'));

        expect(targets.map(startsOn)).toStrictEqual(each([arrival.keyframes]));
      },
    );
  });

  describe("yeti's once bug (upstream Y14)", () => {
    it("still breaks the eight named once arrivals in Yeti's enter file alone (upstream Y14)", async () => {
      expect.assertions(1);

      const broken = stillNamed(await yetiEnterCss());

      // The failure carries what to remove when Yeti fixes the bug.
      expect(() => {
        assert.deepStrictEqual(
          broken,
          Object.keys(brokenForms),
          brokenFormsMessage,
        );
      }).not.toThrow();
    });

    it('reports no broken form for a Yeti whose once withholding outranks its named arrivals', async () => {
      expect.assertions(1);

      const fixedYeti = `${await yetiEnterCss()}
@layer yeti.utilities {
  .enter[data-once][data-once][data-once][data-once][data-once],
  .enter[data-once][data-once][data-once][data-once][data-stagger] > * {
    animation: none;
  }
}`;

      expect(stillNamed(fixedYeti)).toStrictEqual([]);
    });
  });

  describe('in a template', () => {
    it('resolves the template reference', async () => {
      expect.assertions(1);

      const fixture = TestBed.createComponent(ReferenceHost);
      await fixture.whenStable();

      expect(fixture.componentInstance.enter()).toBeInstanceOf(NgxYetiEnter);
    });

    it("sets inputs from static attributes and keeps the consumer's class and role", async () => {
      expect.assertions(6);

      belowTheFold();
      const fixture = TestBed.createComponent(ReferenceHost);
      await fixture.whenStable();
      const element: unknown = fixture.nativeElement;
      assert.instanceOf(element, HTMLElement);
      const list = element.querySelector('ul');
      assert.exists(list);

      expect([...list.classList].toSorted()).toStrictEqual(['enter', 'trails']);
      expect(list.getAttribute('role')).toBe('list');
      expect(list.getAttribute('data-enter')).toBe('rise');
      expect(list.getAttribute('data-stagger')).toBe('');
      expect(list.getAttribute('data-view')).toBe('');
      expect(list.getAttribute('data-once')).toBe('');
    });

    it('leaves roles, attributes, and reading and focus order unchanged by the arrival', async () => {
      expect.assertions(5);

      belowTheFold();
      const fixture = TestBed.createComponent(OrderHost);
      await fixture.whenStable();
      const element: unknown = fixture.nativeElement;
      assert.instanceOf(element, HTMLElement);
      const list = element.querySelector('ul');
      assert.exists(list);
      const before = readingShape(list);
      const links = [...list.querySelectorAll('a')];

      expect(list.getAttribute('data-once')).toBe('');

      await scrollIn(list);

      await expect.poll(() => list.hasAttribute('data-once')).toBe(false);

      expect(readingShape(list)).toStrictEqual(before);
      expect([...list.querySelectorAll('a')]).toStrictEqual(links);

      // Focus lands at once, without waiting for the arrival to end.
      const [first] = links;
      assert.exists(first);
      first.focus();

      expect(document.activeElement).toBe(first);
    });
  });
});
