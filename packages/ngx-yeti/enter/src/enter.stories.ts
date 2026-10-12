import { signal } from '@angular/core';
import {
  elementChildren,
  itemStyled,
  itemStylesLoaded,
  nextFrame,
} from '@ngx-yeti/testing';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { provideYetiStyles } from 'ngx-yeti/styles';
import { expect, userEvent, waitFor } from 'storybook/test';
import { NgxYetiEnter } from './enter';

/** A block that pushes what follows it below the viewport. */
const spacer =
  '<div data-testid="spacer" style="block-size: 150vh"><p>Scroll down for the section that arrives.</p></div>';

/** A computed time such as `0.2s` or `150ms`, in seconds. */
function seconds(time: string): number {
  return time.endsWith('ms') ? parseFloat(time) / 1000 : parseFloat(time);
}

/**
 * The used value of a public time token in `root`, read from a probe, so an
 * assertion holds for any token value.
 */
function tokenTime(root: HTMLElement, token: string): number {
  const probe = document.createElement('div');
  probe.style.transitionDuration = `var(${token})`;
  root.append(probe);
  const time = seconds(getComputedStyle(probe).transitionDuration);
  probe.remove();

  return time;
}

/** Waits until every animation on or inside `element` has ended. */
async function settled(element: HTMLElement): Promise<void> {
  await Promise.all(
    element
      .getAnimations({ subtree: true })
      .map(async ({ finished }) => finished),
  );
}

/** Counts the `animationstart` events that reach `element`. */
function countStarts(element: HTMLElement): () => number {
  let starts = 0;

  element.addEventListener('animationstart', () => {
    starts += 1;
  });

  return () => starts;
}

async function scrollAwayAndBack(element: HTMLElement): Promise<void> {
  window.scrollTo(0, 0);
  await nextFrame();
  await nextFrame();
  element.scrollIntoView();
  await nextFrame();
  await nextFrame();
}

/**
 * The `once` withholding and its single arrival, for a host whose arrival
 * plays on `targets`: still and visible below the fold, then arrived once
 * scrolled to, and no replay after scrolling away and back.
 */
async function expectArrivesOnce(
  host: HTMLElement,
  targets: readonly HTMLElement[],
): Promise<void> {
  // A withheld host has the page's own values, no animation and full opacity,
  // so no computed value tells that the file has applied.
  await itemStylesLoaded('enter');

  await expect(host).toHaveAttribute('data-once', '');

  for (const target of targets) {
    await waitFor(async () => {
      await expect(getComputedStyle(target).animationName).toBe('none');
    });
    await expect(getComputedStyle(target).opacity).toBe('1');
  }

  const starts = countStarts(host);

  host.scrollIntoView();

  await waitFor(async () => {
    await expect(host).not.toHaveAttribute('data-once');
  });
  await waitFor(async () => {
    await expect(starts()).toBe(targets.length);
  });
  await settled(host);

  for (const target of targets) {
    await expect(getComputedStyle(target).opacity).toBe('1');
  }

  await scrollAwayAndBack(host);
  await settled(host);

  await expect(host).not.toHaveAttribute('data-once');
  await expect(starts()).toBe(targets.length);
}

const insertedTemplate = `
  <button type="button" (click)="shown.set(true)">Show the inserted section</button>
  @if (shown()) {
    <p data-testid="plain" yetiEnter>A note that fades in as it is inserted.</p>
    ${spacer}
    <section data-testid="inserted-once" yetiEnter once>
      <h2>Inserted further down</h2>
      <p>It arrives when it is scrolled to.</p>
    </section>
  }
  @defer (on interaction) {
    <section data-testid="deferred-once" yetiEnter once>
      <h2>Loaded on demand</h2>
      <p>A section a client-only block inserts.</p>
    </section>
  } @placeholder {
    <button type="button">Show the deferred section</button>
  }`;

/**
 * The `@if` insertion, where the plain host fades in and the `once` host
 * arrives when it is scrolled to, then the client-only `@defer` insertion.
 */
async function expectInsertedArrivals(
  canvas: Parameters<NonNullable<Story['play']>>[0]['canvas'],
): Promise<void> {
  await userEvent.click(
    canvas.getByRole('button', { name: 'Show the inserted section' }),
  );

  const plain = canvas.getByTestId('plain');
  const once = canvas.getByTestId('inserted-once');

  await itemStyled('enter', plain, 'animation-name', 'yeti-enter-fade');
  await expectArrivesOnce(once, [once]);

  window.scrollTo(0, 0);
  await userEvent.click(
    canvas.getByRole('button', { name: 'Show the deferred section' }),
  );

  const deferred = await canvas.findByTestId('deferred-once');

  deferred.scrollIntoView();
  await waitFor(async () => {
    await expect(deferred).not.toHaveAttribute('data-once');
  });
  await settled(deferred);
  await expect(getComputedStyle(deferred).opacity).toBe('1');
}

const meta: Meta<NgxYetiEnter> = {
  id: 'enter',
  component: NgxYetiEnter,
  decorators: [moduleMetadata({ imports: [NgxYetiEnter] })],
  // Stories share one document in the test run, so each starts at the top:
  // a `once` host below the fold must render out of view.
  beforeEach: () => {
    window.scrollTo(0, 0);
  },
};
export default meta;

type Story = StoryObj<NgxYetiEnter>;

/** `<p yetiEnter>`: Yeti's default fade on load (enter spec, section 8). */
export const Default: Story = {
  render: () => ({
    template:
      '<p data-testid="default" yetiEnter>A headline that fades in on load.</p>',
  }),
  play: async ({ canvas }) => {
    const host = canvas.getByTestId('default');

    await expect(host).toHaveAttribute('class', 'enter');
    await expect(host).toHaveAttribute('data-ngx-yeti-item-enter', '');
    await expect(host).not.toHaveAttribute('data-enter');
    await expect(host).not.toHaveAttribute('data-once');
    await expect(host).not.toHaveAttribute('role');
    await expect(host).not.toHaveAttribute('tabindex');
    await itemStyled('enter', host, 'animation-name', 'yeti-enter-fade');
    await settled(host);
  },
};

const arrivalNames = {
  fade: 'yeti-enter-fade',
  rise: 'yeti-enter-rise',
  fall: 'yeti-enter-fall',
  slide: 'yeti-enter-slide-start',
  scale: 'yeti-enter-scale',
  'slide-end': 'yeti-enter-slide-end',
  'slide-rtl': 'yeti-enter-slide-end',
} as const;

/**
 * One host per arrival, a slide from the end edge, and a slide from the start
 * edge of a right-to-left block, which comes from the right.
 */
export const Arrivals: Story = {
  render: () => ({
    template: `
      <p data-testid="fade" yetiEnter="fade">A fade.</p>
      <p data-testid="rise" yetiEnter="rise">A rise from below.</p>
      <p data-testid="fall" yetiEnter="fall">A fall from above.</p>
      <p data-testid="slide" yetiEnter="slide">A slide from the start edge.</p>
      <p data-testid="scale" yetiEnter="scale">A growth from slightly small.</p>
      <p data-testid="slide-end" yetiEnter="slide" side="end">A slide from the end edge.</p>
      <div dir="rtl">
        <p data-testid="slide-rtl" yetiEnter="slide">A slide from the start edge of a right-to-left block.</p>
      </div>`,
  }),
  play: async ({ canvas, canvasElement }) => {
    for (const [testId, name] of Object.entries(arrivalNames)) {
      const host = canvas.getByTestId(testId);

      await itemStyled('enter', host, 'animation-name', name);
    }

    await expect(canvas.getByTestId('slide-end')).toHaveAttribute(
      'data-side',
      'end',
    );
    await expect(canvas.getByTestId('slide-rtl')).not.toHaveAttribute(
      'data-side',
    );
    await settled(canvasElement);
  },
};

/**
 * Eleven children arriving in turn; the tenth and eleventh share the ninth's
 * delay.
 */
export const Stagger: Story = {
  render: () => ({
    template: `
      <ul data-testid="stagger" yetiEnter="rise" stagger role="list">
        <li>One</li><li>Two</li><li>Three</li><li>Four</li><li>Five</li><li>Six</li>
        <li>Seven</li><li>Eight</li><li>Nine</li><li>Ten</li><li>Eleven</li>
      </ul>`,
  }),
  play: async ({ canvas }) => {
    const list = canvas.getByTestId('stagger');
    const items = elementChildren(list);
    const [first] = items;

    if (first === undefined) {
      throw new Error('The list has no child');
    }

    await expect(list).toHaveAttribute('data-stagger', '');
    await expect(items).toHaveLength(11);
    await itemStyled('enter', first, 'animation-name', 'yeti-enter-rise');
    await expect(getComputedStyle(list).animationName).toBe('none');

    const delay = tokenTime(list, '--yeti-enter-delay');
    const step = tokenTime(list, '--yeti-enter-stagger');

    for (const [index, item] of items.entries()) {
      await expect(seconds(getComputedStyle(item).animationDelay)).toBeCloseTo(
        delay + Math.min(index, 8) * step,
        3,
      );
    }

    await settled(list);
  },
};

/**
 * A scroll-linked growth below the fold. Without `animation-timeline: view()`
 * (Firefox 145) Yeti plays it on load, so it ends opaque.
 */
export const View: Story = {
  render: () => ({
    template: `
      ${spacer}
      <figure data-testid="view" yetiEnter="scale" view>
        <blockquote><p>Every trail starts with one step.</p></blockquote>
        <figcaption>A saying from the trail</figcaption>
      </figure>
      <div style="block-size: 100vh"></div>`,
  }),
  play: async ({ canvas }) => {
    const figure = canvas.getByTestId('view');

    await expect(figure).toHaveAttribute('data-view', '');
    await itemStyled('enter', figure, 'animation-name', 'yeti-enter-scale');

    if (!CSS.supports('animation-timeline', 'view()')) {
      await settled(figure);
      await expect(getComputedStyle(figure).opacity).toBe('1');

      return;
    }

    if (matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      await expect(getComputedStyle(figure).animationTimeline).toBe('view()');
    }

    figure.scrollIntoView({ block: 'center' });
    await waitFor(async () => {
      await expect(getComputedStyle(figure).opacity).toBe('1');
    });
  },
};

/** A section below the fold that arrives once, the first time it is near. */
export const Once: Story = {
  render: () => ({
    template: `
      ${spacer}
      <section data-testid="once" yetiEnter once>
        <h2>Further down the trail</h2>
        <p>This section arrives the first time it comes near the viewport.</p>
      </section>`,
  }),
  play: async ({ canvas }) => {
    const section = canvas.getByTestId('once');

    await expectArrivesOnce(section, [section]);
  },
};

/** A staggered list below the fold that arrives once, child by child. */
export const OnceStagger: Story = {
  render: () => ({
    template: `
      ${spacer}
      <ul data-testid="once-stagger" yetiEnter="rise" stagger once role="list">
        <li>Hills</li><li>Lakes</li><li>Huts</li><li>Ridges</li>
      </ul>`,
  }),
  play: async ({ canvas }) => {
    const list = canvas.getByTestId('once-stagger');

    await expectArrivesOnce(list, elementChildren(list));
  },
};

/**
 * An `@if` and a client-only `@defer` inserting `enter` hosts: the plain one
 * fades in on insertion, and each `once` one arrives when it is near.
 */
export const Inserted: Story = {
  render: () => ({
    props: { shown: signal(false) },
    template: insertedTemplate,
  }),
  play: async ({ canvas, canvasElement }) => {
    await expectInsertedArrivals(canvas);
    await settled(canvasElement);
  },
};

/**
 * `enter--inserted` with `enter` in the preload list, so the item file is
 * fetched before any host renders (the Departures row for enter.md:272).
 */
export const InsertedPreloaded: Story = {
  decorators: [
    applicationConfig({
      providers: [provideYetiStyles({ preload: ['enter'] })],
    }),
  ],
  render: () => ({
    props: { shown: signal(false) },
    template: insertedTemplate,
  }),
  play: async ({ canvas, canvasElement }) => {
    await waitFor(async () => {
      await expect(
        document.head.querySelector(
          'link[rel="preload"][href*="utilities/enter/enter.css"]',
        ),
      ).not.toBeNull();
    });
    await expectInsertedArrivals(canvas);
    await settled(canvasElement);
  },
};
