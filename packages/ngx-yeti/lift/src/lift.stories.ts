import { signal } from '@angular/core';
import { itemStylesLoaded } from '@ngx-yeti/testing';
import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import type { YetiLift } from 'ngx-yeti';
import { YetiCard, YetiCardLink } from 'ngx-yeti/card';
import { expect, getRoles, userEvent, waitFor, within } from 'storybook/test';
import { NgxYetiLift } from './lift';

/** Yeti's lift example: two cards that rise and a tile that grows. */
const liftedCards = `
  <article yetiCard raised yetiLift>
    <h3><a yetiCardLink stretch href="#lift-one">Hover me</a></h3>
    <p>The card rises and its shadow deepens.</p>
  </article>
  <article yetiCard raised yetiLift>
    <h3><a yetiCardLink stretch href="#lift-two">Or tab to me</a></h3>
    <p>A keyboard inside the card lifts it too.</p>
  </article>
  <article yetiCard raised yetiLift="scale">
    <h3><a yetiCardLink stretch href="#lift-three">This one grows</a></h3>
    <p>A scale instead of a rise, for a tile in a row.</p>
  </article>`;

/** The card a link sits in. */
function cardOf(link: HTMLElement): HTMLElement {
  const card = link.closest('article');

  if (card === null) {
    throw new Error('The link is in no card');
  }

  return card;
}

/**
 * Each role in `root` with the accessible names of its elements, as Testing
 * Library computes them for a `name` query.
 */
function roleTree(root: HTMLElement): string[] {
  return Object.keys(getRoles(root)).map((role) => {
    const names: string[] = [];

    within(root).queryAllByRole(role, {
      name: (name) => {
        names.push(name);

        return true;
      },
    });

    return `${role}: ${names.join(' | ')}`;
  });
}

/**
 * The roles and names of `root` beside those of a copy of it with every
 * trace of the lift taken off, so the lift's effect on the tree shows.
 */
function withoutLift(root: HTMLElement): HTMLElement {
  const copy = root.cloneNode(true);

  if (!(copy instanceof HTMLElement)) {
    throw new Error('The copy is not an element');
  }

  for (const host of copy.querySelectorAll('[yetilift]')) {
    host.classList.remove('lift');

    for (const name of ['yetilift', 'data-lift', 'data-ngx-yeti-item-lift']) {
      host.removeAttribute(name);
    }
  }

  return copy;
}

const meta: Meta<NgxYetiLift> = {
  id: 'lift',
  component: NgxYetiLift,
  decorators: [
    moduleMetadata({ imports: [NgxYetiLift, YetiCard, YetiCardLink] }),
  ],
  render: () => ({
    template: `<div data-testid="cards">${liftedCards}</div>`,
  }),
};
export default meta;

type Story = StoryObj<NgxYetiLift>;

/**
 * The pointer cases (the rise, the shadow, and the scale on hover) are in
 * `lift.spec.ts`: Storybook's `userEvent.hover` does not set CSS `:hover`.
 */
export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    const cards = canvas.getByTestId('cards');
    const [first, second, third] = [
      'Hover me',
      'Or tab to me',
      'This one grows',
    ].map((name) => cardOf(canvas.getByRole('link', { name })));

    await expect(canvas.getAllByRole('article')).toHaveLength(3);

    for (const card of [first, second, third]) {
      await expect(card).toHaveClass('card', 'lift');
      await expect(card).toHaveAttribute('data-ngx-yeti-item-lift', '');
    }

    await expect(first).not.toHaveAttribute('data-lift');
    await expect(second).not.toHaveAttribute('data-lift');
    await expect(third).toHaveAttribute('data-lift', 'scale');

    const reference = withoutLift(cards);
    canvasElement.append(reference);

    try {
      await expect(roleTree(cards)).toStrictEqual(roleTree(reference));
    } finally {
      reference.remove();
    }
  },
};

export const Keyboard: Story = {
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Hover me' });
    const card = cardOf(link);

    await itemStylesLoaded('lift');

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    await userEvent.tab();

    await expect(link).toHaveFocus();
    await expect(getComputedStyle(link).outlineStyle).not.toBe('none');
    await waitFor(async () => {
      await expect(getComputedStyle(card).translate).not.toBe('none');
    });
  },
};

export const Bound: Story = {
  render: () => ({
    props: { gesture: signal<YetiLift | ''>('') },
    template: `
      <div role="group" aria-label="Gesture">
        <button type="button" (click)="gesture.set('')">Default</button>
        <button type="button" (click)="gesture.set('rise')">Rise</button>
        <button type="button" (click)="gesture.set('scale')">Scale</button>
      </div>
      <article yetiCard raised [yetiLift]="gesture()">
        <h3><a yetiCardLink stretch href="#bound">A card with a bound gesture</a></h3>
      </article>`,
  }),
  play: async ({ canvas }) => {
    const card = canvas.getByRole('article');
    const steps: readonly [string, string | null][] = [
      ['Rise', 'rise'],
      ['Scale', 'scale'],
      ['Default', null],
    ];

    await expect(card).toHaveClass('lift');
    await expect(card).not.toHaveAttribute('data-lift');

    for (const [name, value] of steps) {
      await userEvent.click(canvas.getByRole('button', { name }));
      await waitFor(async () => {
        await expect(card.getAttribute('data-lift')).toBe(value);
      });
    }
  },
};

/**
 * A card without `yetiLift` beside a lifted one. That hovering it does not
 * move it is asserted in `lift.spec.ts`.
 */
export const Without: Story = {
  render: () => ({
    template: `
      <article yetiCard raised>
        <h3><a yetiCardLink stretch href="#still">A card that stays put</a></h3>
      </article>
      <article yetiCard raised yetiLift>
        <h3><a yetiCardLink stretch href="#lifted">A card that lifts</a></h3>
      </article>`,
  }),
  play: async ({ canvas }) => {
    const stillLink = canvas.getByRole('link', {
      name: 'A card that stays put',
    });
    const still = cardOf(stillLink);
    const lifted = cardOf(
      canvas.getByRole('link', { name: 'A card that lifts' }),
    );

    await expect(still).toHaveAttribute('class', 'card');
    await expect(still).not.toHaveAttribute('data-ngx-yeti-item-lift');
    await expect(lifted).toHaveClass('card', 'lift');
  },
};
