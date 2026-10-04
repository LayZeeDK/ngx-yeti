import {
  APP_ID,
  CSP_NONCE,
  Component,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';
import { renderServer } from '@ngx-yeti/testing/server';
import { YetiCard, YetiCardLink } from 'ngx-yeti/card';
import { NgxYetiLift } from 'ngx-yeti/lift';
import { provideYetiStyles } from './provide-yeti-styles';
import { yetiPin } from './yeti-rank';

/**
 * Setup layer 3 as INTENT.md SC5 restates it for M001: `card` and `lift` in
 * place of setup.md's `card`, `badge`, and `center`, with a `lift` preload in
 * place of the `alert` one.
 */
@Component({
  selector: 'yeti-setup-fixture',
  imports: [YetiCard, YetiCardLink, NgxYetiLift],
  template:
    '<article yetiCard><h3><a yetiCardLink stretch href="#plain">A plain card</a></h3><p i18n>Setup renders its item links on the server.</p></article><article yetiCard raised yetiLift><h3><a yetiCardLink stretch href="#lifted">A lifted card</a></h3></article>',
})
class SetupFixture {}

const appId = 'yeti-setup';

function render(
  providers: readonly (Provider | EnvironmentProviders)[] = [],
): Promise<string> {
  return renderServer(SetupFixture, {
    providers: [
      { provide: APP_ID, useValue: appId },
      provideYetiStyles({ preload: ['lift'] }),
      ...providers,
    ],
  });
}

function head(html: string): string {
  return /<head>[\s\S]*<\/head>/.exec(html)?.[0] ?? '';
}

/** The opening tags of every element named `tag`, in document order. */
function openingTags(html: string, tag: string): string[] {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))].map(
    ([match]) => match,
  );
}

function itemLink(path: string, name: string, nonce = ''): string {
  return `<link rel="stylesheet" href="yeti-css/${path}?v=${yetiPin}" data-ngx-yeti-styles="${name}" data-ngx-yeti-app="${appId}" data-beasties-skip=""${nonce}>`;
}

describe('setup', () => {
  it('writes the item links in yeti.css order with every attribute', async () => {
    expect.assertions(1);

    const links = openingTags(head(await render()), 'link').filter((link) =>
      link.includes('data-ngx-yeti-styles'),
    );

    expect(links).toStrictEqual([
      itemLink('components/card/card.css', 'card'),
      itemLink('utilities/lift/lift.css', 'lift'),
    ]);
  });

  it('marks each host with its presence attributes', async () => {
    expect.assertions(4);

    const [plain, lifted] = openingTags(await render(), 'article');

    expect(plain).toContain('data-ngx-yeti-item-card=""');
    expect(plain).not.toContain('data-ngx-yeti-item-lift');
    expect(lifted).toContain('data-ngx-yeti-item-card=""');
    expect(lifted).toContain('data-ngx-yeti-item-lift=""');
  });

  it('writes the lift preload link', async () => {
    expect.assertions(1);

    const preloads = openingTags(head(await render()), 'link').filter((link) =>
      link.includes('rel="preload"'),
    );

    expect(preloads).toStrictEqual([
      `<link rel="preload" as="style" href="yeti-css/utilities/lift/lift.css?v=${yetiPin}">`,
    ]);
  });

  it('writes no link for an item that is not rendered', async () => {
    expect.assertions(1);

    const names = [
      ...head(await render()).matchAll(/data-ngx-yeti-styles="([^"]+)"/g),
    ].map(([, name]) => name);

    expect(names).toStrictEqual(['card', 'lift']);
  });

  it('puts the CSP nonce on every link', async () => {
    expect.assertions(1);

    const links = openingTags(
      head(await render([{ provide: CSP_NONCE, useValue: 'yeti-nonce' }])),
      'link',
    );

    expect(links).toStrictEqual([
      `<link rel="preload" as="style" href="yeti-css/utilities/lift/lift.css?v=${yetiPin}" nonce="yeti-nonce">`,
      itemLink('components/card/card.css', 'card', ' nonce="yeti-nonce"'),
      itemLink('utilities/lift/lift.css', 'lift', ' nonce="yeti-nonce"'),
    ]);
  });

  it('gives two concurrent renders the same head', async () => {
    expect.assertions(2);

    const [first, second] = await Promise.all([render(), render()]);

    expect(head(first)).toContain('data-ngx-yeti-styles="lift"');
    expect(head(first)).toBe(head(second));
  });
});
