import {
  EnvironmentInjector,
  type EnvironmentProviders,
  createEnvironmentInjector,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { itemLinks, preloadHrefs, removeItemLinks } from '@ngx-yeti/testing';
import { provideYetiStyles } from './provide-yeti-styles';
import { yetiPin } from './yeti-rank';
import { YetiStyles } from './yeti-styles';

function href(path: string, url = 'yeti-css/'): string {
  return `${url}${path}?v=${yetiPin}`;
}

function setup({
  providers = [],
}: { providers?: EnvironmentProviders[] } = {}) {
  removeItemLinks();
  TestBed.configureTestingModule({ providers });
  const root = TestBed.inject(EnvironmentInjector);

  return { root };
}

describe(provideYetiStyles, () => {
  it('loads every item file from the configured url', () => {
    expect.assertions(1);

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

  it('has no effect in a route injector', () => {
    expect.assertions(2);

    const { root } = setup();
    createEnvironmentInjector(
      [provideYetiStyles({ url: 'x/', preload: ['card'] })],
      root,
    );
    TestBed.inject(YetiStyles).acquire('stack');

    expect(preloadHrefs()).toStrictEqual([]);
    expect(itemLinks('stack')[0]?.getAttribute('href')).toBe(
      href('layouts/stack/stack.css'),
    );
  });
});
