import { APP_BASE_HREF } from '@angular/common';
import {
  APP_ID,
  Component,
  EnvironmentInjector,
  type EnvironmentProviders,
  type Provider,
  createEnvironmentInjector,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  itemLinks,
  nextFrame,
  preloadHrefs,
  removeItemLinks,
} from '@ngx-yeti/testing';
import { provideYetiStyles } from './provide-yeti-styles';
import { yetiPin } from './yeti-rank';
import { YetiStyles, type YetiStylesConfig } from './yeti-styles';

function href(path: string, url = 'yeti-css/'): string {
  return `${url}${path}?v=${yetiPin}`;
}

@Component({ selector: 'yeti-no-item', template: '' })
class NoItem {}

function setup({
  providers = [],
}: { providers?: (Provider | EnvironmentProviders)[] } = {}) {
  removeItemLinks();
  TestBed.configureTestingModule({ providers });
  const root = TestBed.inject(EnvironmentInjector);

  return { root };
}

const urlCases: readonly {
  readonly name: string;
  readonly config: YetiStylesConfig;
}[] = [
  { name: 'the default url', config: {} },
  { name: 'a given url', config: { url: 'assets/yeti/' } },
];

describe(provideYetiStyles, () => {
  it.each(urlCases)(
    'ignores APP_BASE_HREF in item and preload links with $name',
    ({ config }) => {
      expect.assertions(2);

      setup({
        providers: [
          { provide: APP_BASE_HREF, useValue: '/other/' },
          provideYetiStyles({ ...config, preload: ['card'] }),
        ],
      });
      TestBed.inject(YetiStyles).acquire('stack');

      expect(preloadHrefs()).toStrictEqual([
        href('components/card/card.css', config.url),
      ]);
      expect(itemLinks('stack')[0]?.getAttribute('href')).toBe(
        href('layouts/stack/stack.css', config.url),
      );
    },
  );

  it('loads every item file from the configured url', () => {
    expect.assertions(1);

    // @ts-expect-error -- without the trailing slash every item file is a 404.
    provideYetiStyles({ url: 'assets/yeti' });
    setup({ providers: [provideYetiStyles({ url: 'assets/yeti/' })] });
    const styles = TestBed.inject(YetiStyles);
    styles.acquire('card');
    styles.acquire('stack');

    expect(itemLinks().map((link) => link.getAttribute('href'))).toStrictEqual([
      href('layouts/stack/stack.css', 'assets/yeti/'),
      href('components/card/card.css', 'assets/yeti/'),
    ]);
  });

  it('preloads from the root providers', () => {
    expect.assertions(1);

    setup({ providers: [provideYetiStyles({ preload: ['card'] })] });

    expect(preloadHrefs()).toStrictEqual([href('components/card/card.css')]);
  });

  it('writes one preload link per item, never beside one present', () => {
    expect.assertions(1);

    removeItemLinks();
    const present = document.createElement('link');
    present.setAttribute('rel', 'preload');
    present.setAttribute('as', 'style');
    present.setAttribute('href', href('components/card/card.css'));
    document.head.append(present);
    TestBed.configureTestingModule({
      providers: [provideYetiStyles({ preload: ['card', 'stack'] })],
    });
    TestBed.inject(EnvironmentInjector);

    expect(preloadHrefs()).toStrictEqual([
      href('components/card/card.css'),
      href('layouts/stack/stack.css'),
    ]);
  });

  it("writes one style preload per item beside the server's prefetch, which it keeps", () => {
    expect.assertions(2);

    removeItemLinks();
    const prefetch = document.createElement('link');
    prefetch.setAttribute('rel', 'prefetch');
    prefetch.setAttribute('href', href('components/card/card.css'));
    document.head.append(prefetch);
    TestBed.configureTestingModule({
      providers: [provideYetiStyles({ preload: ['card', 'card'] })],
    });
    TestBed.inject(EnvironmentInjector);

    expect(preloadHrefs()).toStrictEqual([href('components/card/card.css')]);
    expect([
      ...document.head.querySelectorAll('link[rel="prefetch"]'),
    ]).toStrictEqual([prefetch]);
  });

  it('creates the loader at application start without a preload list', async () => {
    expect.assertions(1);

    removeItemLinks();
    // A server link whose host is gone, with no item directive on the client.
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('data-ngx-yeti-styles', 'card');
    link.setAttribute('data-ngx-yeti-app', 'yeti-test');
    document.head.append(link);
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_ID, useValue: 'yeti-test' },
        provideYetiStyles(),
      ],
    });
    await TestBed.createComponent(NoItem).whenStable();
    await nextFrame();

    expect(link.isConnected).toBe(false);
  });

  it('has no effect in a route injector', () => {
    expect.assertions(2);

    const { root } = setup();
    const route = createEnvironmentInjector(
      [provideYetiStyles({ url: 'x/', preload: ['card'] })],
      root,
    );
    TestBed.inject(YetiStyles).acquire('stack');

    expect(preloadHrefs()).toStrictEqual([]);
    expect(itemLinks('stack')[0]?.getAttribute('href')).toBe(
      href('layouts/stack/stack.css'),
    );

    route.destroy();
  });
});
