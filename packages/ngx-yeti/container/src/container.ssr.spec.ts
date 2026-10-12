import { Component } from '@angular/core';
import {
  attributeValue,
  headLinks,
  itemHref,
  itemLinkOf,
  jsactionTags,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { YetiCluster } from 'ngx-yeti/cluster';
import { YetiContainer } from './container';
import { YetiHide } from './container-hide';
import { YetiShow } from './container-show';

/** Yeti's example (container spec, section 8). */
@Component({
  selector: 'yeti-container-fixture',
  imports: [
    YetiBorder,
    YetiBox,
    YetiCluster,
    YetiContainer,
    YetiShow,
    YetiHide,
  ],
  template:
    '<div yetiContainer yetiBox surface="raised" yetiBorder><nav yetiCluster aria-label="Site"><a href="/">Home</a><a href="/docs">Docs</a><a href="/guides" yetiShow="sm">Guides</a><a href="/blog" yetiShow="sm">Blog</a><a href="/changelog" yetiShow="md">Changelog</a><a href="/community" yetiShow="md">Community</a><a href="/contact" yetiShow="lg">Contact</a></nav><p yetiHide="sm" i18n>Narrower than sm: two links.</p><p yetiShow="sm" yetiHide="md">At least sm wide: four links.</p><p yetiShow="md" yetiHide="lg">At least md wide: six links.</p><p yetiShow="lg">At least lg wide: every link.</p></div>',
})
class ContainerFixture {}

/** Markers on their own: no container, so no item file. */
@Component({
  selector: 'yeti-container-markers-fixture',
  imports: [YetiShow, YetiHide],
  template:
    '<nav aria-label="Site"><a href="/" yetiShow="md" i18n>Home</a></nav><p yetiHide="sm">Narrow</p>',
})
class ContainerMarkersFixture {}

function render(): Promise<string> {
  return renderServer(ContainerFixture);
}

function itemLinkTags(html: string): string[] {
  return headLinks(html).filter(
    (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
  );
}

describe(YetiContainer, () => {
  it('renders the container host with its class beside box and its presence attribute', async () => {
    expect.assertions(4);

    const html = await render();
    const [container] = openingTags(html, 'div');
    assert.exists(container);

    expect(
      attributeValue(container, 'class')?.split(' ').toSorted(),
    ).toStrictEqual(['box', 'container']);
    expect(attributeValue(container, 'data-ngx-yeti-item-container')).toBe('');
    expect(attributeValue(container, 'tabindex')).toBeNull();
    expect(html).toContain('Narrower than sm: two links.');
  });

  it('renders each marked element with its data-show or data-hide value', async () => {
    expect.assertions(2);

    const html = await render();
    const marks = [...openingTags(html, 'a'), ...openingTags(html, 'p')].map(
      (tag) => [
        attributeValue(tag, 'data-show'),
        attributeValue(tag, 'data-hide'),
      ],
    );

    expect(marks).toStrictEqual([
      [null, null],
      [null, null],
      ['sm', null],
      ['sm', null],
      ['md', null],
      ['md', null],
      ['lg', null],
      [null, 'sm'],
      ['sm', 'md'],
      ['md', 'lg'],
      ['lg', null],
    ]);
    expect(
      [...openingTags(html, 'a'), ...openingTags(html, 'p')].filter(
        (tag) => attributeValue(tag, 'class') !== null,
      ),
    ).toStrictEqual([]);
  });

  it('writes one container item link into the head', async () => {
    expect.assertions(3);

    const html = await render();
    const link = itemLinkOf(html, 'container');

    expect(link.count).toBe(1);
    expect(link.beastiesSkip).toBe(true);
    expect(link.href).toMatch(itemHref('layouts', 'container'));
  });

  it('writes no item link for markers without a container', async () => {
    expect.assertions(2);

    const html = await renderServer(ContainerMarkersFixture);

    expect(html).toContain('data-show="md"');
    expect(itemLinkTags(html)).toStrictEqual([]);
  });

  it('puts no jsaction on any element', async () => {
    expect.assertions(1);

    expect(jsactionTags(await render())).toStrictEqual([]);
  });
});
