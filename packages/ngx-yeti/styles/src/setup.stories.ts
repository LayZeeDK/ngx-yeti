import { signal } from '@angular/core';
import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { itemNames, nextFrame } from '@ngx-yeti/testing';
import { YetiCard, YetiCardLink } from 'ngx-yeti/card';
import { NgxYetiLift } from 'ngx-yeti/lift';
import { expect, userEvent, waitFor } from 'storybook/test';

const meta: Meta<YetiCard> = {
  id: 'setup',
  component: YetiCard,
  decorators: [
    moduleMetadata({ imports: [YetiCard, YetiCardLink, NgxYetiLift] }),
  ],
};
export default meta;

type Story = StoryObj<YetiCard>;

/**
 * Two items on one host (ADR 0045): each sets its own presence attribute and
 * loads its own file, and both files leave in the frame after the host does.
 */
export const SharedHost: Story = {
  render: () => ({
    props: { shown: signal(true) },
    template: `
      <button type="button" (click)="shown.set(false)" [disabled]="!shown()">Remove the card</button>
      @if (shown()) {
        <article yetiCard raised yetiLift>
          <h3><a yetiCardLink stretch href="#shared">A card that lifts</a></h3>
          <p>One element, two items, two files.</p>
        </article>
      }`,
  }),
  play: async ({ canvas }) => {
    const card = canvas.getByRole('article');

    await expect(card).toHaveAttribute('data-ngx-yeti-item-card', '');
    await expect(card).toHaveAttribute('data-ngx-yeti-item-lift', '');
    // Yeti's order: components before utilities.
    await expect(itemNames()).toStrictEqual(['card', 'lift']);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove the card' }),
    );
    await waitFor(async () => {
      await expect(card.isConnected).toBe(false);
    });
    await nextFrame();

    await expect(itemNames()).toStrictEqual([]);
  },
};
