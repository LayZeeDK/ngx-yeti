import { signal } from '@angular/core';
import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { itemNames, itemStyled, nextFrame } from '@ngx-yeti/testing';
import { YetiCard, YetiCardLink } from 'ngx-yeti/card';
import { YetiCenter } from 'ngx-yeti/center';
import { NgxYetiLift } from 'ngx-yeti/lift';
import { YetiStack } from 'ngx-yeti/stack';
import { expect, userEvent, waitFor } from 'storybook/test';

const meta: Meta<YetiCard> = {
  id: 'setup',
  component: YetiCard,
  decorators: [
    moduleMetadata({
      imports: [YetiCard, YetiCardLink, NgxYetiLift, YetiCenter, YetiStack],
    }),
  ],
};
export default meta;

type Story = StoryObj<YetiCard>;

type Shown = 'stack' | 'none' | 'center' | 'center-then-stack';

/** The step after each one the item-links story shows. */
const nextShown = {
  stack: 'none',
  none: 'center',
  center: 'center-then-stack',
  'center-then-stack': 'none',
} as const satisfies Record<Shown, Shown>;

/**
 * The loader inserts item links in `yeti.css` order whichever item arrives
 * first (ADR 0060 point 3). `stack` and `center` tie inside `yeti.layouts`:
 * a center in a stack keeps its auto margins only while `center.css` comes
 * after `stack.css`. The toggle shows a stack holding a center, removes it,
 * then shows a center first and the stack after.
 */
export const ItemLinks: Story = {
  render: () => ({
    props: { shown: signal<Shown>('stack'), nextShown },
    template: `
      <button type="button" (click)="shown.set(nextShown[shown()])">Toggle the hosts</button>
      <div style="inline-size: 60rem">
        @if (shown() === 'center' || shown() === 'center-then-stack') {
          <div data-testid="first" yetiCenter max="xs"><p>A center that rendered before the stack.</p></div>
        }
        @if (shown() === 'stack' || shown() === 'center-then-stack') {
          <div data-testid="stack" yetiStack>
            <div data-testid="inner" yetiCenter max="xs"><p>A center inside the stack.</p></div>
          </div>
        }
      </div>`,
  }),
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole('button', { name: 'Toggle the hosts' });
    /** The inner center is centred: equal inline margins, and not zero. */
    const expectInnerCentred = async (): Promise<void> => {
      const inner = canvas.getByTestId('inner');

      await itemStyled('stack', canvas.getByTestId('stack'), 'display', 'flex');
      await itemStyled(
        'center',
        inner,
        'margin-left',
        (value) => parseFloat(value) > 0,
      );
      await expect(
        parseFloat(getComputedStyle(inner).marginLeft),
      ).toBeGreaterThan(0);

      const { marginLeft, marginRight } = getComputedStyle(inner);

      await expect(marginLeft).toBe(marginRight);
    };
    /** Once no host is left, both links are gone a frame later. */
    const expectLinksGone = async (): Promise<void> => {
      await waitFor(async () => {
        await expect(canvas.queryByTestId('inner')).toBeNull();
      });
      await nextFrame();
      await expect(itemNames()).toStrictEqual([]);
    };

    // The stack arrives first: its directive is created before its child's.
    await expect(itemNames()).toStrictEqual(['stack', 'center']);
    await expectInnerCentred();

    await userEvent.click(toggle);
    await expectLinksGone();

    // The center arrives first, and the stack's link is inserted before it.
    await userEvent.click(toggle);
    await waitFor(async () => {
      await expect(itemNames()).toStrictEqual(['center']);
    });
    await userEvent.click(toggle);
    await waitFor(async () => {
      await expect(itemNames()).toStrictEqual(['stack', 'center']);
    });
    await expectInnerCentred();

    await userEvent.click(toggle);
    await expectLinksGone();
  },
};

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
