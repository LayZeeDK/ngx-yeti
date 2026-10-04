import {
  EnvironmentInjector,
  type EnvironmentProviders,
  createEnvironmentInjector,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideYetiStyles } from './provide-yeti-styles';
import { yetiPin } from './yeti-rank';
import { YetiStyles } from './yeti-styles';

function preloadHrefs(): (string | null)[] {
  return [...document.head.querySelectorAll('link[rel="preload"]')].map(
    (link) => link.getAttribute('href'),
  );
}

function setup({
  providers = [],
}: { providers?: EnvironmentProviders[] } = {}) {
  // Links an earlier test's loader left in the shared document.
  for (const link of document.head.querySelectorAll(
    'link[data-ngx-yeti-styles], link[rel="preload"]',
  )) {
    link.remove();
  }

  TestBed.configureTestingModule({ providers });
  const root = TestBed.inject(EnvironmentInjector);

  return { root };
}

describe(provideYetiStyles, () => {
  it('has no effect in a route injector', () => {
    expect.assertions(2);

    const { root } = setup();
    createEnvironmentInjector(
      [provideYetiStyles({ url: 'x/', preload: ['card'] })],
      root,
    );
    TestBed.inject(YetiStyles).acquire('stack');

    expect(preloadHrefs()).toStrictEqual([]);
    expect(
      document.head
        .querySelector('link[data-ngx-yeti-styles="stack"]')
        ?.getAttribute('href'),
    ).toBe(`yeti-css/layouts/stack/stack.css?v=${yetiPin}`);
  });

  it('preloads from the root providers', () => {
    expect.assertions(1);

    setup({ providers: [provideYetiStyles({ preload: ['card'] })] });

    expect(preloadHrefs()).toStrictEqual([
      `yeti-css/components/card/card.css?v=${yetiPin}`,
    ]);
  });
});
