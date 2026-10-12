import { itemStyled } from '@ngx-yeti/testing';
import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { YetiStack } from 'ngx-yeti/stack';
import { expect, userEvent } from 'storybook/test';
import { YetiVisuallyHidden } from './visually-hidden';

type Canvas = Parameters<NonNullable<Story['play']>>[0]['canvas'];

/** The words of `control` a sighted visitor sees: its text without hidden spans. */
function visibleWords(control: HTMLElement): string {
  const clone = control.cloneNode(true);

  if (!(clone instanceof HTMLElement)) {
    throw new Error('The control did not clone as an element');
  }

  for (const hidden of clone.querySelectorAll(
    '[data-ngx-yeti-item-visually-hidden], [hidden]',
  )) {
    hidden.remove();
  }

  return clone.textContent.replaceAll(/\s+/g, ' ').trim();
}

/**
 * The text without whitespace. Testing Library's name computation joins the
 * hidden words to the visible ones without the space browsers keep
 * ("Read moreabout the trail map"), so names compare without it here; the
 * e2e tests assert the exact names in three engines.
 */
function squeezed(text: string): string {
  return text.replaceAll(/\s+/g, '');
}

/**
 * Finds the control with the accessible name `name` and checks that its
 * visible words start that name (usage rule 3; ADR 0015 point 4).
 */
async function namedControl(
  canvas: Canvas,
  role: 'link' | 'button',
  name: string,
): Promise<HTMLElement> {
  const control = canvas.getByRole(role, {
    name: (computed) => squeezed(computed) === squeezed(name),
  });

  await expect(squeezed(name).startsWith(squeezed(visibleWords(control)))).toBe(
    true,
  );

  return control;
}

/** The directive's host inside `control`. */
function hiddenSpan(control: HTMLElement): HTMLElement {
  const span = control.querySelector('[data-ngx-yeti-item-visually-hidden]');

  if (!(span instanceof HTMLElement)) {
    throw new Error('The control holds no hidden words');
  }

  return span;
}

async function expectHiddenBox(span: HTMLElement): Promise<void> {
  const style = getComputedStyle(span);
  const { width, height } = span.getBoundingClientRect();

  await expect(style.position).toBe('absolute');
  await expect(style.overflow).toBe('hidden');
  await expect(style.whiteSpace).toBe('nowrap');
  await expect(style.clipPath.startsWith('inset(50%')).toBe(true);
  await expect(width).toBeLessThanOrEqual(1.5);
  await expect(height).toBeLessThanOrEqual(1.5);
}

const meta: Meta<YetiVisuallyHidden> = {
  id: 'visually-hidden',
  component: YetiVisuallyHidden,
  decorators: [moduleMetadata({ imports: [YetiVisuallyHidden, YetiStack] })],
};
export default meta;

type Story = StoryObj<YetiVisuallyHidden>;

/**
 * Yeti's example: two "Read more" links whose hidden words tell them apart.
 * The reference list, hidden except while measured, holds the visible words
 * only.
 */
export const ReadMore: Story = {
  render: () => ({
    template: `
      <ul yetiStack gap="sm" role="list">
        <li><a href="#trail-map">Read more<span yetiVisuallyHidden> about the trail map</span></a></li>
        <li><a href="#field-guide">Read more<span yetiVisuallyHidden> about the field guide</span></a></li>
      </ul>
      <ul data-testid="reference" role="list" hidden>
        <li><a href="#trail-map">Read more</a></li>
        <li><a href="#field-guide">Read more</a></li>
      </ul>`,
  }),
  play: async ({ canvas }) => {
    const links = [
      await namedControl(canvas, 'link', 'Read more about the trail map'),
      await namedControl(canvas, 'link', 'Read more about the field guide'),
    ];
    const reference = canvas.getByTestId('reference');

    for (const link of links) {
      const span = hiddenSpan(link);

      await expect(span).toHaveAttribute('class', 'visually-hidden');
      await expect(span).toHaveAttribute(
        'data-ngx-yeti-item-visually-hidden',
        '',
      );
      await itemStyled('visually-hidden', span, 'position', 'absolute');
      await expectHiddenBox(span);
    }

    reference.hidden = false;

    try {
      const widths = [...reference.querySelectorAll('a')].map(
        (link) => link.getBoundingClientRect().width,
      );

      await expect(
        links.map((link) => link.getBoundingClientRect().width),
      ).toStrictEqual(widths);
    } finally {
      reference.hidden = true;
    }
  },
};

/** An icon-only button named by its hidden text. */
export const IconButton: Story = {
  render: () => ({
    template: `
      <button type="button">
        <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="16" height="16">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2" />
        </svg>
        <span yetiVisuallyHidden>Close</span>
      </button>`,
  }),
  play: async ({ canvas }) => {
    const button = await namedControl(canvas, 'button', 'Close');
    const span = hiddenSpan(button);

    await itemStyled('visually-hidden', span, 'position', 'absolute');
    await expectHiddenBox(span);
  },
};

/**
 * Carousel dots as plain fragment links whose only content is hidden text;
 * each stays a Tab stop and shows its focus ring on the link.
 */
export const CarouselDots: Story = {
  render: () => ({
    template: `
      <ul role="list" style="display: flex; gap: 0.5rem; padding: 0; list-style: none">
        @for (slide of [1, 2, 3]; track slide) {
          <li>
            <a [href]="'#slide-' + slide" style="display: inline-block; inline-size: 1.5rem; block-size: 1.5rem; border: 2px solid currentColor; border-radius: 50%">
              <span yetiVisuallyHidden>Slide {{ slide }}</span>
            </a>
          </li>
        }
      </ul>`,
  }),
  play: async ({ canvas }) => {
    const dots = [
      await namedControl(canvas, 'link', 'Slide 1'),
      await namedControl(canvas, 'link', 'Slide 2'),
      await namedControl(canvas, 'link', 'Slide 3'),
    ];

    for (const dot of dots) {
      await itemStyled(
        'visually-hidden',
        hiddenSpan(dot),
        'position',
        'absolute',
      );
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    for (const dot of dots) {
      await userEvent.tab();

      await expect(dot).toHaveFocus();
      await expect(getComputedStyle(dot).outlineStyle).not.toBe('none');
      await expect(getComputedStyle(hiddenSpan(dot)).outlineStyle).toBe('none');
    }
  },
};

/**
 * Yeti's fixture pair: hidden words join the name, and words under `hidden`
 * do not.
 */
export const ComparedWithHidden: Story = {
  render: () => ({
    template: `
      <button type="button">Save<span yetiVisuallyHidden> changes</span></button>
      <button type="button">Save<span hidden> changes</span></button>`,
  }),
  play: async ({ canvas }) => {
    await namedControl(canvas, 'button', 'Save changes');
    await namedControl(canvas, 'button', 'Save');
  },
};

/** An `aria-label` on the control replaces the hidden words (usage rule 2). */
export const AriaLabelWins: Story = {
  render: () => ({
    template: `
      <button type="button" aria-label="Close the trail map">Close<span yetiVisuallyHidden> the panel</span></button>`,
  }),
  play: async ({ canvas }) => {
    await namedControl(canvas, 'button', 'Close the trail map');

    await expect(
      canvas.queryByRole('button', { name: 'Close the panel' }),
    ).toBeNull();
  },
};
