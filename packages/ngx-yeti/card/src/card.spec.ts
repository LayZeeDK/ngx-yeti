import {
  type Binding,
  Component,
  Directive,
  type Type,
  inject,
  inputBinding,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterLink, provideRouter } from '@angular/router';
import { itemLinks, nextFrame, removeItemLinks } from '@ngx-yeti/testing';
import type { YetiRatio, YetiVariant, YetiWidth } from 'ngx-yeti';
import { YetiCard } from './card';
import { YetiCardLink } from './card-link';
import { yetiCardToken } from './card-tokens';

@Directive({ selector: '[yetiCardTokenProbe]' })
class CardTokenProbe {
  readonly card = inject(yetiCardToken, { optional: true });
}

@Component({
  selector: 'yeti-card-host',
  imports: [YetiCard, YetiCardLink, CardTokenProbe, RouterLink],
  template:
    '<article #c="yetiCard" yetiCard class="trail" raised threshold="xs"><h3><a #l="yetiCardLink" yetiCardLink yetiCardTokenProbe stretch routerLink="/hills">Hills</a></h3></article>',
})
class CardHost {
  readonly card = viewChild.required<YetiCard>('c');
  readonly link = viewChild.required<YetiCardLink>('l');
  readonly probe = viewChild.required(CardTokenProbe);
}

async function setupCard(bindings: Binding[] = []) {
  const fixture = TestBed.createDirective(YetiCard, {
    tagName: 'article',
    bindings,
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

  return { destroy, element, fixture };
}

/** A card with every input bound to a signal the test can change. */
async function setupBoundCard(bound: {
  variant: YetiVariant;
  threshold: YetiWidth;
  ratio: YetiRatio;
  raised: boolean;
}) {
  const inputs = {
    variant: signal<YetiVariant | undefined>(bound.variant),
    threshold: signal<YetiWidth | undefined>(bound.threshold),
    ratio: signal<YetiRatio | undefined>(bound.ratio),
    raised: signal(bound.raised),
  };
  const card = await setupCard(
    Object.entries(inputs).map(([name, value]) => inputBinding(name, value)),
  );

  return { ...card, inputs };
}

async function setupCardLink({ stretch }: { stretch?: boolean } = {}) {
  const stretchSignal = signal(stretch ?? false);
  const fixture = TestBed.createDirective(YetiCardLink, {
    tagName: 'a',
    bindings:
      stretch === undefined ? [] : [inputBinding('stretch', stretchSignal)],
  });

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);

  return { element, fixture, stretchSignal };
}

async function setupHost() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(CardHost);

  await fixture.whenStable();

  const card = fixture.componentInstance.card();
  const link = fixture.componentInstance.link();
  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);
  const article = element.querySelector('article');
  const anchor = element.querySelector('a');
  assert.exists(article);
  assert.exists(anchor);

  return { anchor, article, card, fixture, link };
}

/** Creates the directive alone and checks no listener lands on its host. */
async function expectNoHostListener(
  type: Type<unknown>,
  tagName: string,
): Promise<void> {
  const addEventListener = vi.spyOn(EventTarget.prototype, 'addEventListener');

  try {
    const fixture = TestBed.createDirective(type, { tagName });
    await fixture.whenStable();
    const element: unknown = fixture.nativeElement;

    expect(addEventListener.mock.contexts).not.toContain(element);
  } finally {
    addEventListener.mockRestore();
  }
}

describe(YetiCard, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiCard, 'article');
  });

  it('renders its class and presence attribute and no unset attribute', async () => {
    expect.assertions(6);

    const { element } = await setupCard();

    expect(element.getAttribute('class')).toBe('card');
    expect(element.getAttribute('data-ngx-yeti-item-card')).toBe('');
    expect(element.hasAttribute('data-variant')).toBe(false);
    expect(element.hasAttribute('data-threshold')).toBe(false);
    expect(element.hasAttribute('data-ratio')).toBe(false);
    expect(element.hasAttribute('data-raised')).toBe(false);
  });

  it('renders each bound input and removes it when unset', async () => {
    expect.assertions(8);

    const { element, fixture, inputs } = await setupBoundCard({
      variant: 'warning',
      threshold: 'sm',
      ratio: '4/3',
      raised: true,
    });

    expect(element.getAttribute('data-variant')).toBe('warning');
    expect(element.getAttribute('data-threshold')).toBe('sm');
    expect(element.getAttribute('data-ratio')).toBe('4/3');
    expect(element.getAttribute('data-raised')).toBe('');

    inputs.variant.set(undefined);
    inputs.threshold.set(undefined);
    inputs.ratio.set(undefined);
    inputs.raised.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-variant')).toBe(false);
    expect(element.hasAttribute('data-threshold')).toBe(false);
    expect(element.hasAttribute('data-ratio')).toBe(false);
    expect(element.hasAttribute('data-raised')).toBe(false);
  });

  it('shares one item link between two cards until both are destroyed', async () => {
    expect.assertions(3);

    removeItemLinks();
    const first = await setupCard();
    const second = await setupCard();

    expect(itemLinks('card')).toHaveLength(1);

    first.destroy();
    await nextFrame();

    expect(itemLinks('card')).toHaveLength(1);

    second.destroy();
    await nextFrame();

    expect(itemLinks('card')).toHaveLength(0);
  });

  describe('in a template', () => {
    it('resolves the card token in its link to the card', async () => {
      expect.assertions(1);

      const { card, fixture } = await setupHost();

      expect(fixture.componentInstance.probe().card).toBe(card);
    });

    it('resolves the template references', async () => {
      expect.assertions(2);

      const { card, link } = await setupHost();

      expect(card).toBeInstanceOf(YetiCard);
      expect(link).toBeInstanceOf(YetiCardLink);
    });

    it('sets inputs from static raised, stretch, and threshold', async () => {
      expect.assertions(4);

      const { anchor, article } = await setupHost();

      expect(article.getAttribute('data-raised')).toBe('');
      expect(anchor.getAttribute('data-stretch')).toBe('');
      expect(article.getAttribute('threshold')).toBe('xs');
      expect(article.getAttribute('data-threshold')).toBe('xs');
    });

    it('keeps the href of a routerLink anchor', async () => {
      expect.assertions(1);

      const { anchor } = await setupHost();

      expect(anchor.getAttribute('href')).toBe('/hills');
    });

    it("keeps the consumer's own class", async () => {
      expect.assertions(1);

      const { article } = await setupHost();

      expect([...article.classList].toSorted()).toStrictEqual([
        'card',
        'trail',
      ]);
    });
  });
});

describe(YetiCardLink, () => {
  it('adds no listener to its host', async () => {
    expect.assertions(1);

    await expectNoHostListener(YetiCardLink, 'a');
  });

  it('renders no data-stretch by default', async () => {
    expect.assertions(1);

    const { element } = await setupCardLink();

    expect(element.hasAttribute('data-stretch')).toBe(false);
  });

  it('renders data-stretch while stretch is true', async () => {
    expect.assertions(2);

    const { element, fixture, stretchSignal } = await setupCardLink({
      stretch: true,
    });

    expect(element.getAttribute('data-stretch')).toBe('');

    stretchSignal.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-stretch')).toBe(false);
  });

  it('carries no presence attribute and loads no item link alone', async () => {
    expect.assertions(2);

    removeItemLinks();
    const { element } = await setupCardLink({ stretch: true });

    expect(
      element
        .getAttributeNames()
        .filter((name) => name.startsWith('data-ngx-yeti-')),
    ).toStrictEqual([]);
    expect(itemLinks()).toHaveLength(0);
  });
});
