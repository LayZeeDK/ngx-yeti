import {
  APP_ID,
  CSP_NONCE,
  Component,
  Directive,
  EnvironmentInjector,
  type EnvironmentProviders,
  type Provider,
  type Type,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { itemLinks, nextFrame, removeItemLinks } from '@ngx-yeti/testing';
import type { YetiComponentName } from 'ngx-yeti';
import { injectYetiItemStyles } from './inject-yeti-item-styles';
import { yetiPin } from './yeti-rank';
import { YetiStyles } from './yeti-styles';

@Directive({
  selector: '[yetiProbeStack]',
  host: { 'data-ngx-yeti-item-stack': '' },
})
class ProbeStack {
  constructor() {
    injectYetiItemStyles('stack');
  }
}

@Directive({
  selector: '[yetiProbeCenter]',
  host: { 'data-ngx-yeti-item-center': '' },
})
class ProbeCenter {
  constructor() {
    injectYetiItemStyles('center');
  }
}

@Directive({
  selector: '[yetiProbeCover]',
  host: { 'data-ngx-yeti-item-cover': '' },
})
class ProbeCover {
  constructor() {
    injectYetiItemStyles('cover');
  }
}

@Directive({
  selector: '[yetiProbeShell]',
  host: { 'data-ngx-yeti-item-shell': '' },
})
class ProbeShell {
  constructor() {
    injectYetiItemStyles('shell');
  }
}

@Directive({
  selector: '[yetiProbeCard]',
  host: { 'data-ngx-yeti-item-card': '' },
})
class ProbeCard {
  constructor() {
    injectYetiItemStyles('card');
  }
}

function failProbe(): void {
  throw new Error('Probe failed');
}

@Directive({ selector: '[yetiProbeThrowing]' })
class ProbeThrowing {
  constructor() {
    failProbe();
    injectYetiItemStyles('card');
  }
}

@Component({
  selector: 'yeti-shared-host',
  imports: [ProbeCard, ProbeStack],
  template: '<article yetiProbeCard yetiProbeStack></article>',
})
class SharedHost {}

@Component({
  selector: 'yeti-boundary-host',
  imports: [ProbeThrowing],
  template:
    '@boundary { <div yetiProbeThrowing></div> } @error { <p>Fallback</p> }',
})
class BoundaryHost {}

const appId = 'yeti-test';
const probes = {
  stack: ProbeStack,
  center: ProbeCenter,
  cover: ProbeCover,
  shell: ProbeShell,
  card: ProbeCard,
} as const;
type ProbeName = keyof typeof probes;

/** The five probes in the order of Yeti's yeti.css. */
const yetiOrder: readonly ProbeName[] = [
  'stack',
  'cover',
  'center',
  'shell',
  'card',
];

function permutations<T>(items: readonly T[]): T[][] {
  return items.length <= 1
    ? [[...items]]
    : items.flatMap((item, index) =>
        permutations(items.toSpliced(index, 1)).map((rest) => [item, ...rest]),
      );
}

function href(path: string, url = 'yeti-css/'): string {
  return `${url}${path}?v=${yetiPin}`;
}

function itemNames(): (string | null)[] {
  return itemLinks().map((link) => link.getAttribute('data-ngx-yeti-styles'));
}

function serverLink(item: YetiComponentName, app: string): HTMLLinkElement {
  const link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('href', href(`components/${item}/${item}.css`));
  link.setAttribute('data-ngx-yeti-styles', item);
  link.setAttribute('data-ngx-yeti-app', app);

  return link;
}

function setup({
  providers = [],
}: { providers?: (Provider | EnvironmentProviders)[] } = {}) {
  removeItemLinks();
  TestBed.configureTestingModule({
    providers: [{ provide: APP_ID, useValue: appId }, ...providers],
  });

  async function create<T>(type: Type<T>, tagName = 'div') {
    const fixture = TestBed.createDirective(type, { tagName });

    await fixture.whenStable();

    return fixture;
  }

  /** Destroys a fixture and takes its host out of the document. */
  function destroy(fixture: {
    readonly nativeElement: unknown;
    destroy(): void;
  }): void {
    const element: unknown = fixture.nativeElement;
    assert.instanceOf(element, Element);
    fixture.destroy();
    element.remove();
  }

  return { create, destroy };
}

describe(injectYetiItemStyles, () => {
  it('keeps one link for two hosts until both are destroyed', async () => {
    expect.assertions(3);

    const { create, destroy } = setup();
    const first = await create(ProbeCard);
    const second = await create(ProbeCard);

    expect(itemNames()).toStrictEqual(['card']);

    destroy(first);
    await nextFrame();

    expect(itemNames()).toStrictEqual(['card']);

    destroy(second);
    await nextFrame();

    expect(itemNames()).toStrictEqual([]);
  });

  it('keeps the link while a host with no directive is connected', async () => {
    expect.assertions(2);

    const { create, destroy } = setup();
    const fixture = await create(ProbeCard);
    const dehydrated = document.createElement('article');
    dehydrated.setAttribute('data-ngx-yeti-item-card', '');
    document.body.append(dehydrated);

    destroy(fixture);
    await nextFrame();

    expect(itemNames()).toStrictEqual(['card']);

    dehydrated.remove();
    await nextFrame();

    expect(itemNames()).toStrictEqual([]);
  });

  it.each(permutations(yetiOrder))(
    "ends in yeti.css's order after the arrival order %s",
    async (...order) => {
      expect.assertions(1);

      const { create } = setup();

      for (const name of order) {
        await create(probes[name]);
      }

      expect(itemNames()).toStrictEqual(yetiOrder);
    },
  );

  it('acquires two items for two directives on one host', async () => {
    expect.assertions(2);

    setup();
    const fixture = TestBed.createComponent(SharedHost);
    await fixture.whenStable();

    expect(itemNames()).toStrictEqual(['stack', 'card']);
    expect(
      document.querySelector(
        'article[data-ngx-yeti-item-card][data-ngx-yeti-item-stack]',
      ),
    ).toBeInstanceOf(HTMLElement);
  });

  it('writes the link attributes with the nonce from CSP_NONCE', async () => {
    expect.assertions(6);

    const { create } = setup({
      providers: [{ provide: CSP_NONCE, useValue: 'probe-nonce' }],
    });
    await create(ProbeCard);
    const [link] = itemLinks();
    assert.exists(link);

    expect(link.getAttribute('rel')).toBe('stylesheet');
    expect(link.getAttribute('href')).toBe(href('components/card/card.css'));
    expect(link.getAttribute('data-ngx-yeti-styles')).toBe('card');
    expect(link.getAttribute('data-ngx-yeti-app')).toBe(appId);
    expect(link.getAttribute('data-beasties-skip')).toBe('');
    expect(link.nonce).toBe('probe-nonce');
  });

  it('writes no nonce without CSP_NONCE', async () => {
    expect.assertions(1);

    const { create } = setup();
    await create(ProbeCard);
    const [link] = itemLinks();
    assert.exists(link);

    expect(link.hasAttribute('nonce')).toBe(false);
  });

  it('adopts a link of its own application and leaves another alone', async () => {
    expect.assertions(4);

    const { create, destroy } = setup();
    const own = serverLink('card', appId);
    const other = serverLink('card', 'other-app');
    document.head.append(own, other);

    const fixture = await create(ProbeCard);

    expect(itemLinks()).toStrictEqual([own, other]);

    destroy(fixture);
    await nextFrame();

    expect(own.isConnected).toBe(false);
    expect(other.isConnected).toBe(true);
    expect(itemLinks()).toStrictEqual([other]);
  });

  it('keeps two loaders of two applications apart', async () => {
    expect.assertions(2);

    setup();
    const parent = TestBed.inject(EnvironmentInjector);
    const [first, second] = ['app-a', 'app-b'].map((id) =>
      createEnvironmentInjector(
        [{ provide: APP_ID, useValue: id }, YetiStyles],
        parent,
      ),
    );
    assert.exists(first);
    assert.exists(second);

    for (const injector of [first, second]) {
      runInInjectionContext(injector, () => {
        injectYetiItemStyles('card');
      });
    }

    await TestBed.createDirective(ProbeStack, { tagName: 'div' }).whenStable();

    expect(
      itemLinks().map((link) => link.getAttribute('data-ngx-yeti-app')),
    ).toStrictEqual(['app-a', 'app-b', appId]);

    first.destroy();
    await nextFrame();

    expect(
      itemLinks().map((link) => link.getAttribute('data-ngx-yeti-app')),
    ).toStrictEqual(['app-b', appId]);
  });

  it('leaks no link and no count from a constructor that throws first', async () => {
    expect.assertions(3);

    const { create, destroy } = setup();
    const fixture = TestBed.createComponent(BoundaryHost);
    await fixture.whenStable();
    const element: unknown = fixture.nativeElement;
    assert.instanceOf(element, HTMLElement);

    expect(element.textContent).toContain('Fallback');
    expect(itemNames()).toStrictEqual([]);

    const card = await create(ProbeCard);
    destroy(card);
    await nextFrame();

    expect(itemNames()).toStrictEqual([]);
  });

  it('creates no observer before the first render callback', async () => {
    expect.assertions(2);

    setup();
    const observers: MutationObserver[] = [];

    class CountingObserver extends MutationObserver {
      constructor(callback: MutationCallback) {
        super(callback);
        observers.push(this);
      }
    }

    vi.stubGlobal('MutationObserver', CountingObserver);

    try {
      const fixture = TestBed.createDirective(ProbeCard, { tagName: 'div' });

      expect(observers).toHaveLength(0);

      await fixture.whenStable();

      expect(observers).toHaveLength(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
