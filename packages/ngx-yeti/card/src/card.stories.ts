import { NgOptimizedImage } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { Component, signal, type WritableSignal } from '@angular/core';
import { RouterLink, RouterOutlet, provideRouter } from '@angular/router';
import {
  assertWithin,
  contrastRatio,
  itemStyled,
  manifestValues,
  parseColor,
  storyStates,
  usedLength,
} from '@ngx-yeti/testing';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import type { YetiRatio, YetiVariant, YetiWidth } from 'ngx-yeti';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import manifest from 'yeti-css/manifest';
// Kept a URL in the static build too: NgOptimizedImage refuses `data:` URLs.
import trail from '../../.storybook/assets/trail.svg?no-inline';
import { YetiButton } from 'ngx-yeti/button';
import { YetiGrid } from 'ngx-yeti/grid';
import { YetiLayer, YetiLayerChild } from 'ngx-yeti/layer';
import { NgxYetiLift } from 'ngx-yeti/lift';
import { YetiCard } from './card';
import { YetiCardLink } from './card-link';

@Component({
  selector: 'yeti-hills-page',
  template: '<p>The hills page</p>',
})
class HillsPage {}

interface CardState {
  readonly variant: YetiVariant | undefined;
  readonly threshold: YetiWidth | undefined;
  readonly ratio: YetiRatio | undefined;
  readonly raised: boolean;
}

const unset: CardState = {
  variant: undefined,
  threshold: undefined,
  ratio: undefined,
  raised: false,
};

/**
 * The inputs each rendered story binds, by story id, so a play function can
 * change them the way a Storybook control does.
 */
const cardStates = storyStates<WritableSignal<CardState>>('card');

const heading = 'Weekend in the hills';
const summary = 'Six miles, one summit, and a view worth the early start.';
// `priority`: the picture is the story's largest paint, which NgOptimizedImage
// otherwise reports through console.error.
const picture = `<img [ngSrc]="trail" width="1600" height="900" priority alt="A mountain trail at dawn" />`;
const headingLink = `<h3><a yetiCardLink stretch routerLink="/hills">${heading}</a></h3>`;
const footerLink = `<a yetiButton emphasis="low" routerLink="/hills" tabindex="-1">Read more</a>`;

/** Section 8's markup, with a plain `span` for the badge. */
function defaultCard(dir: 'ltr' | 'rtl'): string {
  return `
    <div data-testid="frame" dir="${dir}" style="inline-size: 40rem; resize: horizontal; overflow: auto">
      <article yetiCard threshold="xs" [ratio]="state().ratio">
        ${picture}
        ${headingLink}
        <p>${summary}</p>
        <footer>
          <span>Open</span>
          ${footerLink}
        </footer>
      </article>
    </div>`;
}

/**
 * Section 8's card with every input unset, tracked under the story's id so
 * the play function can set its ratio.
 */
function trackedDefaultCard(
  dir: 'ltr' | 'rtl',
  id: string,
): { props: Record<string, unknown>; template: string } {
  const state = signal<CardState>(unset);
  cardStates.track(id, state);

  // Template props are named unlike the inputs, which they would collide
  // with once `component` is set.
  return { props: { state, trail }, template: defaultCard(dir) };
}

function element(canvas: HTMLElement, selector: string): HTMLElement {
  const found = canvas.querySelector(selector);

  if (!(found instanceof HTMLElement)) {
    throw new Error(`Nothing matches ${selector}`);
  }

  return found;
}

/**
 * The frame width at the `xs` stop: `16rem` of card content plus the card's
 * padding and border, from the card's tokens, so the width holds for any
 * token value.
 */
function xsStop(frame: HTMLElement): number {
  return usedLength(
    frame,
    'calc(16rem + 2 * var(--yeti-card-padding) + 2 * var(--yeti-border-width))',
  );
}

/** The card's padding box, inside its computed border widths. */
function paddingBox(card: HTMLElement): {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly width: number;
} {
  const rect = card.getBoundingClientRect();
  const style = getComputedStyle(card);
  const left = rect.left + parseFloat(style.borderLeftWidth);
  const right = rect.right - parseFloat(style.borderRightWidth);

  return {
    left,
    right,
    top: rect.top + parseFloat(style.borderTopWidth),
    width: right - left,
  };
}

async function expectBleed(
  card: HTMLElement,
  media: HTMLElement,
): Promise<void> {
  const box = paddingBox(card);
  const rect = media.getBoundingClientRect();

  await expect(Math.abs(rect.left - box.left)).toBeLessThanOrEqual(1);
  await expect(Math.abs(rect.right - box.right)).toBeLessThanOrEqual(1);
  await expect(Math.abs(rect.top - box.top)).toBeLessThanOrEqual(1);
}

/** Row form: the picture is 40 % of the card, and the title clears it. */
async function expectRowForm(
  card: HTMLElement,
  media: HTMLElement,
  title: HTMLElement,
  dir: 'ltr' | 'rtl',
): Promise<void> {
  const box = paddingBox(card);
  const rect = media.getBoundingClientRect();
  const titleRect = title.getBoundingClientRect();

  await expect(Math.abs(rect.width - 0.4 * box.width)).toBeLessThanOrEqual(1);

  if (dir === 'ltr') {
    await expect(titleRect.left).toBeGreaterThanOrEqual(rect.right);
  } else {
    await expect(Math.abs(rect.right - box.right)).toBeLessThanOrEqual(1);
    await expect(titleRect.right).toBeLessThanOrEqual(rect.left);
  }
}

/**
 * Text contrast on the card's surface, at least 4.5:1, in the light and the
 * dark scheme, with the exact WCAG formula on computed colours.
 */
async function expectReadable(
  frame: HTMLElement,
  card: HTMLElement,
  texts: readonly HTMLElement[],
): Promise<void> {
  for (const scheme of ['light', 'dark']) {
    frame.style.colorScheme = scheme;
    const background = getComputedStyle(card).backgroundColor;

    for (const text of texts) {
      await expect(
        contrastRatio(getComputedStyle(text).color, background),
      ).toBeGreaterThanOrEqual(4.5);
    }
  }

  frame.style.colorScheme = '';
}

/** Tab from before the card reaches each stop in order, then leaves it. */
async function expectTabOrder(
  card: HTMLElement,
  stops: readonly HTMLElement[],
): Promise<void> {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  for (const stop of stops) {
    await userEvent.tab();
    await expect(stop).toHaveFocus();
  }

  await userEvent.tab();
  await expect(card.contains(document.activeElement)).toBe(false);
}

const meta: Meta<YetiCard> = {
  id: 'card',
  component: YetiCard,
  decorators: [
    moduleMetadata({
      imports: [
        YetiCard,
        YetiCardLink,
        YetiButton,
        NgOptimizedImage,
        RouterLink,
        RouterOutlet,
      ],
    }),
    applicationConfig({
      providers: [
        provideRouter([
          { path: 'hills', component: HillsPage },
          { path: '', children: [] },
        ]),
        provideLocationMocks(),
      ],
    }),
  ],
  render: (_args, { id }) => trackedDefaultCard('ltr', id),
};
export default meta;

type Story = StoryObj<YetiCard>;

export const Default: Story = {
  play: async ({ canvas, canvasElement, id }) => {
    const frame = canvas.getByTestId('frame');
    const card = canvas.getByRole('article');
    const title = canvas.getByRole('heading', { level: 3 });
    const link = within(title).getByRole('link');
    const readMore = canvas.getByRole('link', { name: 'Read more' });
    const media = element(canvasElement, 'article > img');

    await expect(card).toHaveAttribute('class', 'card');
    await expect(card).toHaveAttribute('data-threshold', 'xs');
    await expect(card).toHaveAttribute('data-ngx-yeti-item-card', '');
    await expect(card).not.toHaveAttribute('data-variant');
    await expect(card).not.toHaveAttribute('data-ratio');
    await expect(card).not.toHaveAttribute('data-raised');
    await expect(link).toHaveAttribute('data-stretch', '');
    await expect(
      link.getAttributeNames().filter((name) => name.startsWith('data-ngx-')),
    ).toStrictEqual([]);
    // The footer link's own tabindex is the consumer's; the package adds none,
    // on the host or inside it.
    const marked = (selector: string): Element[] =>
      [card, ...card.querySelectorAll(selector)].filter((found) =>
        found.matches(selector),
      );

    await expect(marked('[role]')).toStrictEqual([]);
    await expect(marked('[tabindex]')).toStrictEqual([readMore]);
    await expect(readMore).toHaveAttribute('class', 'button');
    await expect(readMore).toHaveAttribute('data-emphasis', 'low');
    await expect(readMore).toHaveAttribute('data-ngx-yeti-item-button', '');

    await itemStyled('card', card, 'display', 'flex');
    await expectReadable(frame, card, [link, canvas.getByText(summary)]);

    // The ratio is set for the geometry, after the unset case above.
    cardStates.get(id).update((state) => ({ ...state, ratio: '4/3' }));
    await waitFor(async () => {
      await expect(card).toHaveAttribute('data-ratio', '4/3');
    });

    const stop = xsStop(frame);
    frame.style.inlineSize = `${String(stop - 4)}px`;
    const { width, height } = media.getBoundingClientRect();

    await expectBleed(card, media);
    await expect(Math.abs(width / height - 4 / 3)).toBeLessThanOrEqual(0.1);
    await expect(title.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      media.getBoundingClientRect().bottom,
    );

    frame.style.inlineSize = `${String(stop + 4)}px`;

    await expectRowForm(card, media, title, 'ltr');
  },
};

export const StretchedLink: Story = {
  render: () => ({
    props: { saved: signal(false) },
    template: `
      <article yetiCard>
        ${headingLink}
        <p>${summary}</p>
        <footer>
          <button type="button" (click)="saved.set(true)">{{ saved() ? 'Saved' : 'Save' }}</button>
          ${footerLink}
        </footer>
      </article>
      <router-outlet />`,
  }),
  play: async ({ canvas }) => {
    const card = canvas.getByRole('article');
    const title = canvas.getByRole('heading', { level: 3 });
    const link = within(title).getByRole('link', { name: title.textContent });
    const button = canvas.getByRole('button', { name: 'Save' });

    await itemStyled('card', card, 'display', 'flex');

    // The accessible name is the heading's text alone.
    await expect(link).toHaveAccessibleName(title.textContent);

    // One Tab stop for the destination: the footer link with tabindex="-1"
    // is skipped.
    await expectTabOrder(card, [link, button]);
    await userEvent.tab({ shift: true });
    await userEvent.tab({ shift: true });
    await expect(link).toHaveFocus();
    await expect(getComputedStyle(link).outlineStyle).not.toBe('none');

    const buttonRect = button.getBoundingClientRect();

    await expect(
      document.elementFromPoint(
        buttonRect.left + buttonRect.width / 2,
        buttonRect.top + buttonRect.height / 2,
      ),
    ).toBe(button);

    await userEvent.click(button);

    await expect(button).toHaveAccessibleName('Saved');
    await expect(canvas.queryByText('The hills page')).toBeNull();

    const cardRect = card.getBoundingClientRect();
    const corner = document.elementFromPoint(
      cardRect.right - 8,
      cardRect.bottom - 8,
    );

    await expect(corner).toBe(link);

    await userEvent.click(link);

    await expect(await canvas.findByText('The hills page')).toBeVisible();
  },
};

/**
 * Every input, set and reset as a Storybook control would.
 *
 * Upstream bug Y12: `threshold="2xs"` matches no rule in Yeti's `card.css`
 * at the pin, which has container blocks for `xs` to `2xl` only, so a `2xs`
 * card never switches to the row form.
 */
export const Inputs: Story = {
  // The one story whose controls bind the inputs (card spec, layer 1).
  argTypes: {
    // Yeti's vocabularies, which the contract spec proves equal to the
    // inputs' types, so a pin move that adds a value adds its option.
    variant: {
      control: 'select',
      options: manifestValues(manifest.components.card, 'data-variant'),
    },
    threshold: {
      control: 'select',
      options: manifestValues(manifest.components.card, 'data-threshold'),
    },
    ratio: {
      control: 'select',
      options: manifestValues(manifest.components.card, 'data-ratio'),
    },
    raised: { control: 'boolean' },
  },
  render: (args, { id }) => {
    const state = signal<CardState>({
      variant: args.variant,
      threshold: args.threshold,
      ratio: args.ratio,
      raised: args.raised === true,
    });
    cardStates.track(id, state);

    return {
      props: { state },
      template: `
        <div data-testid="frame" style="inline-size: 24rem">
          <article yetiCard [variant]="state().variant" [threshold]="state().threshold" [ratio]="state().ratio" [raised]="state().raised">
            ${headingLink}
            <p>${summary}</p>
          </article>
        </div>`,
    };
  },
  play: async ({ canvas, id }) => {
    const state = cardStates.get(id);
    const card = canvas.getByRole('article');
    const cases: readonly {
      readonly attribute: string;
      readonly set: Partial<CardState>;
      readonly value: string;
    }[] = [
      {
        attribute: 'data-variant',
        set: { variant: 'warning' },
        value: 'warning',
      },
      { attribute: 'data-threshold', set: { threshold: 'sm' }, value: 'sm' },
      { attribute: 'data-ratio', set: { ratio: '4/3' }, value: '4/3' },
      { attribute: 'data-raised', set: { raised: true }, value: '' },
    ];

    await itemStyled('card', card, 'display', 'flex');
    await expectReadable(canvas.getByTestId('frame'), card, [
      within(card).getByRole('link'),
      canvas.getByText(summary),
    ]);

    for (const { attribute, set, value } of cases) {
      state.set({ ...unset, ...set });
      await waitFor(async () => {
        await expect(card).toHaveAttribute(attribute, value);
      });

      state.set(unset);
      await waitFor(async () => {
        await expect(card).not.toHaveAttribute(attribute);
      });
    }

    state.set({ ...unset, raised: true });
    await waitFor(async () => {
      await expect(card).toHaveAttribute('data-raised', '');
    });

    await expect(getComputedStyle(card).boxShadow).not.toBe('none');
    await expect(parseColor(getComputedStyle(card).borderTopColor).alpha).toBe(
      0,
    );

    state.set({ ...unset, variant: 'warning' });
    await waitFor(async () => {
      await expect(card).toHaveAttribute('data-variant', 'warning');
    });

    const { borderTopWidth, borderLeftWidth } = getComputedStyle(card);

    await expect(
      Math.abs(parseFloat(borderTopWidth) - 4 * parseFloat(borderLeftWidth)),
    ).toBeLessThanOrEqual(0.1);
  },
};

export const Figure: Story = {
  render: () => ({
    props: { trail },
    template: `
      <div data-testid="frame">
        <article yetiCard threshold="xs" ratio="16/9">
          <figure>
            ${picture}
            <figcaption>The ridge path at first light.</figcaption>
          </figure>
          ${headingLink}
          <p>${summary}</p>
        </article>
      </div>`,
  }),
  play: async ({ canvas, canvasElement }) => {
    const frame = canvas.getByTestId('frame');
    const card = canvas.getByRole('article');
    const media = element(canvasElement, 'figure > img');
    const caption = element(canvasElement, 'figcaption');

    await itemStyled('card', card, 'display', 'flex');

    frame.style.inlineSize = `${String(xsStop(frame) - 4)}px`;

    await expectBleed(card, media);
    await expect(caption.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      media.getBoundingClientRect().bottom,
    );
    await expectReadable(frame, card, [caption]);
  },
};

/**
 * Yeti's caption over the picture: the card's first child is a `figure` that
 * is a layer. The caption's contrast over a picture is the layer stories'.
 */
export const LayerCaption: Story = {
  decorators: [moduleMetadata({ imports: [YetiLayer, YetiLayerChild] })],
  render: () => ({
    props: { trail },
    template: `
      <div data-testid="frame" style="inline-size: 24rem; max-inline-size: 100%">
        <article yetiCard>
          <figure yetiLayer>
            ${picture}
            <figcaption yetiLayerChild alignSelf="end">The ridge path at first light.</figcaption>
          </figure>
          ${headingLink}
          <p>${summary}</p>
        </article>
      </div>`,
  }),
  play: async ({ canvas, canvasElement }) => {
    const card = canvas.getByRole('article');
    const layer = element(canvasElement, 'article > figure');
    const media = element(canvasElement, 'figure > img');
    const caption = element(canvasElement, 'figcaption');

    await expect(layer).toHaveAttribute('class', 'layer');
    await itemStyled('card', card, 'display', 'flex');
    await itemStyled('layer', layer, 'display', 'grid');

    const mediaRect = media.getBoundingClientRect();
    const captionRect = caption.getBoundingClientRect();

    assertWithin(captionRect.bottom, mediaRect.bottom);
    await expect(captionRect.top).toBeGreaterThan(mediaRect.top);
    await expect(
      parseColor(getComputedStyle(caption).backgroundColor).alpha,
    ).toBeGreaterThan(0);
  },
};

const trails = [
  { name: 'Weekend in the hills', path: '/hills' },
  { name: 'A day by the lake', path: '/lake' },
  { name: 'The coast path', path: '/coast' },
];

export const List: Story = {
  render: () => ({
    props: { trails, summary },
    template: `
      <ul role="list">
        @for (item of trails; track item.path) {
          <li yetiCard>
            <h3><a yetiCardLink stretch [routerLink]="item.path">{{ item.name }}</a></h3>
            <p>{{ summary }}</p>
          </li>
        }
      </ul>`,
  }),
  play: async ({ canvas }) => {
    const list = canvas.getByRole('list');
    const items = within(list).getAllByRole('listitem');

    await expect(items).toHaveLength(trails.length);

    for (const item of items) {
      const title = within(item).getByRole('heading', { level: 3 });

      await expect(within(title).getByRole('link')).toHaveAccessibleName(
        title.textContent,
      );
      await expect(item).toHaveAttribute('data-ngx-yeti-item-card', '');
    }
  },
};

const rankedTrails = [
  { name: 'Weekend in the hills', path: '/hills', text: summary },
  { name: 'A day by the lake', path: '/lake', text: 'Flat all the way.' },
  {
    name: 'The coast path',
    path: '/coast',
    text: 'Two days along the cliffs, with a night in the harbour town between them and the ferry back on the second evening.',
  },
];

/**
 * Yeti's cards in a ranked grid: `rows` counts the parts of a card, so the
 * footers of cards of different lengths share one row. The list sits in a
 * `section`: outside sectioning content, an `li` card's `footer` is a
 * `contentinfo` landmark, one per card.
 */
export const GridRows: Story = {
  decorators: [moduleMetadata({ imports: [YetiGrid] })],
  render: () => ({
    props: { rankedTrails, trail },
    template: `
      <section style="inline-size: 48rem; max-inline-size: 100%">
        <ul yetiGrid min="none" columns="3" rows="4" role="list">
          @for (item of rankedTrails; track item.path) {
            <li yetiCard>
              ${picture}
              <h3><a yetiCardLink stretch [routerLink]="item.path">{{ item.name }}</a></h3>
              <p>{{ item.text }}</p>
              <footer>
                <a yetiButton emphasis="low" [routerLink]="item.path" tabindex="-1">Read more</a>
              </footer>
            </li>
          }
        </ul>
      </section>`,
  }),
  play: async ({ canvas }) => {
    const grid = canvas.getByRole('list');
    const cards = within(grid).getAllByRole('listitem');

    await expect(grid).toHaveAttribute('data-rows', '4');
    await expect(cards).toHaveLength(rankedTrails.length);
    await itemStyled('grid', grid, 'display', 'grid');

    for (const card of cards) {
      await itemStyled('card', card, 'border-top-style', 'solid');
    }

    const [first, ...rest] = cards.map(
      (card) => element(card, ':scope > footer').getBoundingClientRect().bottom,
    );

    if (first === undefined) {
      throw new Error('No card');
    }

    for (const bottom of rest) {
      assertWithin(bottom, first);
    }

    for (const card of cards) {
      await expectBleed(card, element(card, ':scope > img'));
    }
  },
};

export const Rtl: Story = {
  render: (_args, { id }) => trackedDefaultCard('rtl', id),
  play: async ({ canvas, canvasElement }) => {
    const frame = canvas.getByTestId('frame');
    const card = canvas.getByRole('article');
    const title = canvas.getByRole('heading', { level: 3 });
    const media = element(canvasElement, 'article > img');

    await itemStyled('card', card, 'display', 'flex');

    frame.style.inlineSize = `${String(2 * xsStop(frame))}px`;

    await expectRowForm(card, media, title, 'rtl');
    await expectTabOrder(
      card,
      [...card.querySelectorAll<HTMLElement>('a[href], button')].filter(
        (stop) => stop.tabIndex >= 0,
      ),
    );
  },
};

/**
 * Anti-pattern (usage rule 2): never wrap a card in a link. The link's name
 * becomes the whole card's text. Axe does not flag it, so no rule is off.
 */
export const AntiPatternWrappedLink: Story = {
  render: () => ({
    template: `
      <a routerLink="/hills">
        <article yetiCard>
          <h3>${heading}</h3>
          <p>${summary}</p>
        </article>
      </a>`,
  }),
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link');

    await expect(link).toHaveAccessibleName(expect.stringContaining(heading));
    await expect(link).toHaveAccessibleName(expect.stringContaining(summary));
  },
};

/**
 * Yeti's lift example: three raised cards with `yetiLift`, each with a
 * stretched link. The lift's own cases are the lift stories'.
 */
export const WithLift: Story = {
  decorators: [moduleMetadata({ imports: [NgxYetiLift] })],
  render: () => ({
    props: { trails },
    template: `
      @for (item of trails; track item.path) {
        <article yetiCard raised yetiLift>
          <h3><a yetiCardLink stretch [routerLink]="item.path">{{ item.name }}</a></h3>
          <p>${summary}</p>
        </article>
      }`,
  }),
  play: async ({ canvas }) => {
    const cards = canvas.getAllByRole('article');
    const [first] = cards;

    await expect(cards).toHaveLength(trails.length);

    for (const card of cards) {
      await expect(card).toHaveClass('card', 'lift');
      await expect(card).toHaveAttribute('data-ngx-yeti-item-card', '');
      await expect(card).toHaveAttribute('data-ngx-yeti-item-lift', '');
    }

    if (first === undefined) {
      throw new Error('No card');
    }

    await itemStyled('card', first, 'display', 'flex');
    await itemStyled(
      'lift',
      first,
      'transition-property',
      (value) => value !== 'all',
    );

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    await userEvent.tab();

    await expect(within(first).getByRole('link')).toHaveFocus();
    await waitFor(async () => {
      await expect(getComputedStyle(first).translate).not.toBe('none');
    });
  },
};
