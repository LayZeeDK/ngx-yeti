import { NgOptimizedImage } from '@angular/common';
import { signal, type WritableSignal } from '@angular/core';
import { itemStylesLoaded } from '@ngx-yeti/testing';
import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import type { YetiRatio } from 'ngx-yeti';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { YetiBreakout, YetiBreakoutChild } from 'ngx-yeti/breakout';
import { YetiSidebar } from 'ngx-yeti/sidebar';
import { YetiStack } from 'ngx-yeti/stack';
import { expect, spyOn, waitFor } from 'storybook/test';
import manifest from 'yeti-css/manifest';
// Kept a URL in the static build too: NgOptimizedImage refuses `data:` URLs.
import trail from '../../.storybook/assets/trail.svg?no-inline';
import { YetiFrame } from './frame';

/**
 * A portrait picture, 600 by 900, as a `data:` URL, so it takes a plain
 * `img` (NgOptimizedImage refuses `data:` URLs).
 */
const portrait = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900"><rect width="600" height="900" fill="#5b6f8a"/><circle cx="300" cy="260" r="120" fill="#fff3d6"/><path d="M0 700 L300 420 L600 700 L600 900 L0 900 Z" fill="#3f6b4f"/></svg>',
)}`;

/** A green clip, 32 by 18 pixels and a fifth of a second long, in WebM. */
const clip =
  'data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAH3EU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHWTbuMU6uEElTDZ1OsggEjTbuMU6uEHFO7a1OsggHh7AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsCrXsYMPQkBNgIxMYXZmNjIuMy4xMDBXQYxMYXZmNjIuMy4xMDBEiYhAaQAAAAAAABZUrmvIrgEAAAAAAAA/14EBc8WIb3FjNkADYCCcgQAitZyDdW5kiIEAhoVWX1ZQOIOBASPjg4QL68IA4JCwgSC6gRKagQJVsIRVuYEBElTDZ/tzc59jwIBnyJlFo4dFTkNPREVSRIeMTGF2ZjYyLjMuMTAwc3PWY8CLY8WIb3FjNkADYCBnyKFFo4dFTkNPREVSRIeUTGF2YzYyLjExLjEwMCBsaWJ2cHhnyKFFo4hEVVJBVElPTkSHkzAwOjAwOjAwLjIwMDAwMDAwMAAfQ7Z1ueeBAKO0gQAAgJACAJ0BKiAAEgAARwiFhYiFhIgCAgJ1qgIH+RXeYP77Gcuu8WlGv/mwP28+3nhYABxTu2uRu4+zgQC3iveBAfGCAaPwgQM=';

/** A small map for the object, as a `data:` URL. */
const map = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e8efe3"/><path d="M20 260 C120 200 180 120 380 40" stroke="#3f6b4f" stroke-width="8" fill="none"/></svg>',
)}`;

/**
 * An `iframe` document with a language and a title, so axe passes inside it,
 * escaped for a static attribute: Angular refuses a bound `srcdoc` or
 * `object` `data` that is not marked trusted.
 */
const notes =
  '&lt;!doctype html&gt;&lt;html lang=&quot;en&quot;&gt;&lt;title&gt;Trail notes&lt;/title&gt;&lt;p&gt;Six miles and one summit.&lt;/p&gt;&lt;/html&gt;';

const ratios: readonly YetiRatio[] = ['1/1', '4/3', '3/2', '16/9', '21/9'];

/** The default `data-ratio` of Yeti's frame, from the manifest at the pin. */
function defaultRatio(): string {
  const value = manifest.components.frame.attributes.find(
    (attribute) => attribute.name === 'data-ratio',
  )?.default;

  if (typeof value !== 'string') {
    throw new Error('The manifest names no default ratio for the frame');
  }

  return value;
}

/** Width over height of a ratio written `w/h`. */
function ratioValue(ratio: string): number {
  const [width, height] = ratio.split('/').map(Number);

  if (width === undefined || height === undefined) {
    throw new Error(`Not a ratio: ${ratio}`);
  }

  return width / height;
}

function byTestId(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`[data-testid="${id}"]`);

  if (!(element instanceof HTMLElement)) {
    throw new Error(`No element with the test id ${id}`);
  }

  return element;
}

async function expectClose(actual: number, expected: number): Promise<void> {
  await expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
}

/**
 * Waits for the frame's item file to apply. Chromium and WebKit can keep
 * stale computed styles right after a stylesheet is inserted (upstream bug
 * O2). The file sets `overflow: hidden`.
 */
async function frameStyled(frame: HTMLElement): Promise<void> {
  await itemStylesLoaded('frame');

  await waitFor(async () => {
    await expect(getComputedStyle(frame).overflow).toBe('hidden');
  });
}

/** The frame's rendered width over height is `ratio`, within one pixel. */
async function expectRatio(frame: HTMLElement, ratio: string): Promise<void> {
  const { width, height } = frame.getBoundingClientRect();

  await expectClose(height, width / ratioValue(ratio));
}

/** The element's box equals the frame's, within one pixel. */
async function expectFills(
  frame: HTMLElement,
  element: Element,
): Promise<void> {
  const outer = frame.getBoundingClientRect();
  const inner = element.getBoundingClientRect();

  await expectClose(inner.left, outer.left);
  await expectClose(inner.top, outer.top);
  await expectClose(inner.width, outer.width);
  await expectClose(inner.height, outer.height);
}

/** Resolves when the image has loaded. */
async function imageLoaded(image: Element | null): Promise<void> {
  await waitFor(async () => {
    await expect(
      image instanceof HTMLImageElement &&
        image.complete &&
        image.naturalWidth > 0,
    ).toBe(true);
  });
}

/** The package adds no role and no tab stop to the frame or its child. */
async function expectNoRoleOrTabStop(frame: HTMLElement): Promise<void> {
  await expect(
    [frame, ...frame.querySelectorAll('*')].filter((element) =>
      element.matches('[role], [tabindex]'),
    ),
  ).toStrictEqual([]);
}

/** The ratio the ratios story binds, by story id. */
const ratioStates = new Map<string, WritableSignal<YetiRatio | undefined>>();

function ratioState(id: string): WritableSignal<YetiRatio | undefined> {
  const state = ratioStates.get(id);

  if (state === undefined) {
    throw new Error(`No ratio state for the story ${id}`);
  }

  return state;
}

/** The `console.warn` spy of the optimized-image story, by story id. */
const warnSpies = new Map<string, ReturnType<typeof spyOn>>();

const meta: Meta<YetiFrame> = {
  id: 'frame',
  component: YetiFrame,
  decorators: [
    moduleMetadata({
      imports: [
        YetiFrame,
        NgOptimizedImage,
        YetiBorder,
        YetiBox,
        YetiBreakout,
        YetiBreakoutChild,
        YetiSidebar,
        YetiStack,
      ],
    }),
  ],
};
export default meta;

type Story = StoryObj<YetiFrame>;

/** Yeti's example: a 16/9 frame holding one photo. */
export const Default: Story = {
  render: () => ({
    props: { trail },
    template: `
      <div style="inline-size: 32rem">
        <div data-testid="frame" yetiFrame ratio="16/9">
          <img [ngSrc]="trail" width="1600" height="900" priority alt="A mountain trail at dawn under a pale sun" />
        </div>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const frame = byTestId(canvasElement, 'frame');
    const image = frame.querySelector('img');

    await expect(frame).toHaveAttribute('class', 'frame');
    await expect(frame).toHaveAttribute('data-ngx-yeti-item-frame', '');
    await expect(frame).toHaveAttribute('data-ratio', '16/9');
    await expect(frame).not.toHaveAttribute('tabindex');
    await expect(frame).not.toHaveAttribute('role');

    await frameStyled(frame);
    await imageLoaded(image);
    await expectRatio(frame, '16/9');

    if (image === null) {
      throw new Error('The frame holds no image');
    }

    await expectFills(frame, image);
    await expect(getComputedStyle(image).objectFit).toBe('cover');
  },
};

/**
 * A frame per ratio and one with none, each holding a portrait picture, and
 * a frame whose ratio is bound.
 */
export const Ratios: Story = {
  render: (_args, { id }) => {
    const bound = signal<YetiRatio | undefined>('21/9');
    ratioStates.set(id, bound);

    return {
      props: { bound, portrait, ratios },
      template: `
        <div style="display: grid; grid-template-columns: repeat(3, 12rem); gap: 1rem; align-items: start">
          @for (ratio of ratios; track ratio) {
            <div [attr.data-testid]="'frame-' + ratio" yetiFrame [ratio]="ratio">
              <img [src]="portrait" alt="A sun over green hills, cropped to {{ ratio }}" />
            </div>
          }
          <div data-testid="unset" yetiFrame>
            <img [src]="portrait" alt="A sun over green hills, cropped to the default shape" />
          </div>
          <div data-testid="bound" yetiFrame [ratio]="bound()">
            <img [src]="portrait" alt="A sun over green hills, cropped to the bound shape" />
          </div>
        </div>`,
    };
  },
  play: async ({ canvasElement, id }) => {
    const unset = byTestId(canvasElement, 'unset');
    const bound = byTestId(canvasElement, 'bound');

    await frameStyled(unset);

    for (const ratio of ratios) {
      const frame = byTestId(canvasElement, `frame-${ratio}`);

      await expect(frame).toHaveAttribute('data-ratio', ratio);
      await expectRatio(frame, ratio);

      const image = frame.querySelector('img');

      if (image === null) {
        throw new Error('The frame holds no image');
      }

      await expectFills(frame, image);
    }

    await expect(unset).not.toHaveAttribute('data-ratio');
    await expectRatio(unset, defaultRatio());

    await expect(bound).toHaveAttribute('data-ratio', '21/9');
    await expectRatio(bound, '21/9');

    ratioState(id).set(undefined);

    await waitFor(async () => {
      await expect(bound).not.toHaveAttribute('data-ratio');
    });
    await expectRatio(bound, defaultRatio());
  },
};

/** A picture, a video, an iframe, and an object, each filling its frame. */
export const Media: Story = {
  render: () => ({
    props: { portrait },
    template: `
      <div style="display: grid; grid-template-columns: repeat(2, 16rem); gap: 1rem; align-items: start">
        <div data-testid="picture-frame" yetiFrame ratio="4/3">
          <picture>
            <source [srcset]="portrait" media="(min-width: 1px)" />
            <img [src]="portrait" alt="A sun over green hills, cropped to four by three" />
          </picture>
        </div>
        <div data-testid="video-frame" yetiFrame>
          <video controls muted>
            <source src="${clip}" type="video/webm" />
          </video>
        </div>
        <div data-testid="iframe-frame" yetiFrame ratio="3/2">
          <iframe title="Trail notes" srcdoc="${notes}"></iframe>
        </div>
        <div data-testid="object-frame" yetiFrame ratio="4/3">
          <object data="${map}" type="image/svg+xml" title="A map of the trail from the lake to the summit">A map of the trail from the lake to the summit</object>
        </div>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const pictureFrame = byTestId(canvasElement, 'picture-frame');
    const videoFrame = byTestId(canvasElement, 'video-frame');
    const iframeFrame = byTestId(canvasElement, 'iframe-frame');
    const objectFrame = byTestId(canvasElement, 'object-frame');
    const picture = pictureFrame.querySelector('picture');
    const video = videoFrame.querySelector('video');
    const iframe = iframeFrame.querySelector('iframe');
    const object = objectFrame.querySelector('object');

    if (picture === null || video === null || iframe === null) {
      throw new Error('A frame lost its media');
    }

    if (object === null) {
      throw new Error('The object frame lost its object');
    }

    await frameStyled(pictureFrame);
    await imageLoaded(picture.querySelector('img'));

    await expectFills(pictureFrame, picture);
    await expectFills(pictureFrame, picture.querySelector('img') ?? picture);
    await expectFills(videoFrame, video);
    await expectFills(iframeFrame, iframe);
    await expectFills(objectFrame, object);
    await expect(getComputedStyle(iframe).borderTopWidth).toBe('0px');
    await expect(getComputedStyle(iframe).borderLeftWidth).toBe('0px');

    // Storybook's `userEvent.tab` moves focus by its own list, which has
    // no `video`; real Tab is asserted on the Fixture route (ngx-yeti-specs
    // Departures). Here: the frame leaves the controls focusable.
    await expectNoRoleOrTabStop(videoFrame);
    video.focus();

    await expect(video).toHaveFocus();
  },
};

/** A frame holding an icon, which the frame centres at its own size. */
export const Centred: Story = {
  render: () => ({
    template: `
      <div style="inline-size: 20rem">
        <div data-testid="frame" yetiFrame ratio="4/3">
          <svg data-testid="icon" aria-hidden="true" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="currentColor" /></svg>
        </div>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const frame = byTestId(canvasElement, 'frame');
    const icon = canvasElement.querySelector('[data-testid="icon"]');

    if (icon === null) {
      throw new Error('The frame lost its icon');
    }

    await frameStyled(frame);

    const outer = frame.getBoundingClientRect();
    const inner = icon.getBoundingClientRect();

    await expectClose(
      inner.left + inner.width / 2,
      outer.left + outer.width / 2,
    );
    await expectClose(
      inner.top + inner.height / 2,
      outer.top + outer.height / 2,
    );
    await expectClose(inner.width, 48);
    await expectClose(inner.height, 48);
    await expectNoRoleOrTabStop(frame);
  },
};

const borderProbe =
  'border: var(--yeti-border-width) solid var(--yeti-color-border)';

/**
 * Yeti's docs: a bordered frame, and one whose edge colour is set inline
 * with `--yeti-color-border`, each beside a probe reading the same token.
 */
export const Bordered: Story = {
  render: () => ({
    props: { trail },
    template: `
      <div style="display: grid; grid-template-columns: repeat(2, 16rem); gap: 1rem; align-items: start">
        <div>
          <div data-testid="frame" yetiFrame yetiBorder ratio="4/3">
            <img [ngSrc]="trail" width="1600" height="900" priority alt="The trail from the lake to the ridge, cropped to four by three" />
          </div>
          <div data-testid="probe" style="${borderProbe}"></div>
        </div>
        <div style="--yeti-color-border: var(--yeti-color-text)">
          <div data-testid="tinted" yetiFrame yetiBorder ratio="4/3" style="--yeti-color-border: var(--yeti-color-text)">
            <img [ngSrc]="trail" width="1600" height="900" alt="The same trail with a darker edge" />
          </div>
          <div data-testid="tinted-probe" style="${borderProbe}"></div>
        </div>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const pairs = [
      ['frame', 'probe'],
      ['tinted', 'tinted-probe'],
    ] as const;

    await frameStyled(byTestId(canvasElement, 'frame'));

    for (const [frameId, probeId] of pairs) {
      const frame = byTestId(canvasElement, frameId);
      const expected = getComputedStyle(byTestId(canvasElement, probeId));
      const actual = getComputedStyle(frame);

      await expect(frame).toHaveAttribute('data-border', '');
      await expect(frame).toHaveAttribute('data-ratio', '4/3');
      await expect(actual.borderTopColor).toBe(expected.borderTopColor);
      await expect(actual.borderTopWidth).toBe(expected.borderTopWidth);
      await expect(actual.borderTopStyle).toBe('solid');
    }

    await expect(
      getComputedStyle(byTestId(canvasElement, 'tinted')).borderTopColor,
    ).not.toBe(
      getComputedStyle(byTestId(canvasElement, 'frame')).borderTopColor,
    );
  },
};

/**
 * Yeti's breakout example, the media object from primitives, and the
 * layouts guide's card.
 */
export const Composed: Story = {
  render: () => ({
    props: { trail },
    template: `
      <div style="inline-size: 60rem">
        <article data-testid="breakout" yetiBreakout>
          <p>A long read keeps its lines short.</p>
          <div data-testid="bleeding" yetiFrame yetiBreakoutChild ratio="21/9" bleed>
            <img [ngSrc]="trail" width="1600" height="900" priority alt="The ridge above the lake, edge to edge" />
          </div>
          <p>Then the text picks up at the width it left off.</p>
        </article>
        <div yetiSidebar width="2xs" gap="md">
          <div data-testid="avatar" yetiFrame ratio="1/1">
            <img [ngSrc]="trail" width="1600" height="900" alt="The trail's sun, cropped square" />
          </div>
          <p>The media object: a square picture beside its text, from a sidebar and a frame.</p>
        </div>
        <div yetiBox yetiBorder style="inline-size: 20rem">
          <div yetiStack gap="sm">
            <div data-testid="thumb" yetiFrame ratio="4/3">
              <img [ngSrc]="trail" width="1600" height="900" alt="A mountain trail at dawn, cropped to four by three" />
            </div>
            <h3>Weekend in the hills</h3>
            <p>Six miles, one summit, and a view worth the early start.</p>
          </div>
        </div>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const breakout = byTestId(canvasElement, 'breakout');
    const bleeding = byTestId(canvasElement, 'bleeding');

    await frameStyled(bleeding);
    await itemStylesLoaded('breakout');
    await itemStylesLoaded('sidebar');
    await itemStylesLoaded('stack');

    await expect(bleeding).toHaveAttribute('data-bleed', '');
    await expectRatio(bleeding, '21/9');
    await expectRatio(byTestId(canvasElement, 'avatar'), '1/1');
    await expectRatio(byTestId(canvasElement, 'thumb'), '4/3');

    await waitFor(async () => {
      await expectClose(
        bleeding.getBoundingClientRect().width,
        breakout.getBoundingClientRect().width,
      );
    });
  },
};

/** A captioned photo: the caption sits beside the frame, in its figure. */
export const WithCaption: Story = {
  render: () => ({
    props: { trail },
    template: `
      <figure data-testid="figure" style="inline-size: 24rem; margin: 0">
        <div data-testid="frame" yetiFrame ratio="3/2">
          <img [ngSrc]="trail" width="1600" height="900" priority alt="The lake below the ridge at dawn, cropped to three by two" />
        </div>
        <figcaption data-testid="caption">Dawn on the ridge trail, six miles from the lake.</figcaption>
      </figure>`,
  }),
  play: async ({ canvasElement }) => {
    const frame = byTestId(canvasElement, 'frame');
    const caption = byTestId(canvasElement, 'caption');

    await frameStyled(frame);
    await expectRatio(frame, '3/2');

    await expect(frame.contains(caption)).toBe(false);
    await expect(caption.parentElement).toBe(byTestId(canvasElement, 'figure'));
    await expect(caption.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      frame.getBoundingClientRect().bottom - 0.5,
    );
    await expect(caption.scrollHeight).toBeLessThanOrEqual(
      caption.clientHeight,
    );
  },
};

/**
 * Usage rule 6: NgOptimizedImage in `fill` mode in a positioned frame, and
 * with `width` and `height`. Both fill the frame; the play function logs the
 * development-mode warnings each form gives, which are recorded, not
 * asserted.
 */
export const OptimizedImage: Story = {
  beforeEach: ({ id }) => {
    warnSpies.set(id, spyOn(console, 'warn'));
  },
  render: () => ({
    props: { trail },
    template: `
      <div style="display: grid; grid-template-columns: repeat(2, 16rem); gap: 1rem; align-items: start">
        <div data-testid="fill" yetiFrame ratio="4/3" style="position: relative">
          <img [ngSrc]="trail" fill priority alt="A mountain trail at dawn, cropped to four by three" />
        </div>
        <div data-testid="sized" yetiFrame ratio="4/3">
          <img [ngSrc]="trail" width="1600" height="900" priority alt="The same trail, cropped to four by three" />
        </div>
      </div>`,
  }),
  play: async ({ canvasElement, id }) => {
    const forms = ['fill', 'sized'] as const;

    await frameStyled(byTestId(canvasElement, 'fill'));

    for (const form of forms) {
      const frame = byTestId(canvasElement, form);
      const image = frame.querySelector('img');

      await imageLoaded(image);

      if (image === null) {
        throw new Error('The frame holds no image');
      }

      await expectRatio(frame, '4/3');
      await expectFills(frame, image);
    }

    // Angular's distortion check runs in a load listener.
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    const warnings = (warnSpies.get(id)?.mock.calls ?? []).map((call) =>
      call.map(String).join(' '),
    );

    for (const form of forms) {
      const own = warnings.filter((text) =>
        form === 'fill' ? /fill/i.test(text) : !/fill/i.test(text),
      );

      console.info(
        `frame--optimized-image, ${form}: ${String(own.length)} development warnings${own.length > 0 ? `: ${own.join(' | ')}` : ''}`,
      );
    }
  },
};
