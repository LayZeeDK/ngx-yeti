import { PlatformLocation } from '@angular/common';
import { Component, inject, InjectionToken } from '@angular/core';
import { renderServer } from './render-server';

const fixtureState = new InjectionToken<string>('fixtureState', {
  factory: () => 'open',
});

@Component({
  selector: 'yeti-server-fixture',
  template: '<p i18n>Rendered on the server</p><output>{{ path }}</output>',
  host: { '[attr.data-state]': 'state' },
})
class ServerFixture {
  readonly #location = inject(PlatformLocation);
  protected readonly state = inject(fixtureState);
  protected readonly path = this.#location.pathname + this.#location.search;
}

@Component({
  selector: '[yetiAttributeFixture]',
  template: 'attribute',
})
class AttributeFixture {
  protected readonly name = 'attribute';
}

function hostTag(html: string): string {
  return /<yeti-server-fixture[^>]*>/.exec(html)?.[0] ?? '';
}

describe(renderServer, () => {
  it('renders the content, host bindings, and hydration annotation', async () => {
    expect.assertions(4);

    const html = await renderServer(ServerFixture);

    expect(html).toContain('<p>Rendered on the server</p>');
    expect(hostTag(html)).toContain('data-state="open"');
    expect(hostTag(html)).toContain('ngh="0"');
    expect(html).toContain(
      '<script id="ng-state" type="application/json">{"__nghData__":',
    );
  });

  it('hydrates i18n blocks by default', async () => {
    expect.assertions(2);

    const withoutI18nSupport = await renderServer(ServerFixture, {
      hydrationFeatures: [],
    });
    const withDefaults = await renderServer(ServerFixture);

    expect(hostTag(withDefaults)).not.toContain('ngskiphydration');
    expect(hostTag(withoutI18nSupport)).toContain('ngskiphydration');
  });

  it('renders the request URL', async () => {
    expect.assertions(1);

    const html = await renderServer(ServerFixture, {
      url: '/sub/guide?lang=da',
    });

    expect(html).toContain('<output>/sub/guide?lang=da</output>');
  });

  it('adds the extra providers', async () => {
    expect.assertions(1);

    const html = await renderServer(ServerFixture, {
      providers: [{ provide: fixtureState, useValue: 'closed' }],
    });

    expect(hostTag(html)).toContain('data-state="closed"');
  });

  it('renders into the given document', async () => {
    expect.assertions(2);

    const html = await renderServer(ServerFixture, {
      document:
        '<html lang="da"><head><title>Side</title></head><body><main><yeti-server-fixture></yeti-server-fixture></main></body></html>',
    });

    expect(html).toContain('<html lang="da">');
    expect(html).toContain('<main><yeti-server-fixture');
  });

  it('keeps renders started together apart', async () => {
    expect.assertions(3);

    const [first, second, firstAgain] = await Promise.all([
      renderServer(ServerFixture, { url: '/first' }),
      renderServer(ServerFixture, {
        url: '/second',
        providers: [{ provide: fixtureState, useValue: 'closed' }],
      }),
      renderServer(ServerFixture, { url: '/first' }),
    ]);

    expect(first).toContain(
      'data-state="open" ngh="0" ng-server-context="other"><p>Rendered on the server</p><output>/first</output>',
    );
    expect(second).toContain(
      'data-state="closed" ngh="0" ng-server-context="other"><p>Rendered on the server</p><output>/second</output>',
    );
    expect(firstAgain).toBe(first);
  });

  it('asks for a document when the root selector is not an element', async () => {
    expect.assertions(1);

    await expect(renderServer(AttributeFixture)).rejects.toThrow(
      'renderServer() needs a document for AttributeFixture',
    );
  });
});
