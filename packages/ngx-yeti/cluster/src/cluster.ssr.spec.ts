import { Component } from '@angular/core';
import {
  allOpeningTags,
  attributeValue,
  headLinks,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import { YetiCluster } from './cluster';

/**
 * A list cluster with every input written in its static form (cluster.md,
 * Testing Decisions, layer 3).
 */
@Component({
  selector: 'yeti-cluster-fixture',
  imports: [YetiCluster],
  template:
    '<ul yetiCluster gap="xs" justify="between" align="baseline" threshold="sm" role="list"><li i18n>css</li><li>layout</li><li>intrinsic</li></ul>',
})
class ClusterFixture {}

function render(): Promise<string> {
  return renderServer(ClusterFixture);
}

describe(YetiCluster, () => {
  it('renders the cluster host with its class, presence attribute, and attributes', async () => {
    expect.assertions(9);

    const html = await render();
    const [cluster, ...rest] = openingTags(html, 'ul');
    assert.exists(cluster);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(cluster, 'class')).toBe('cluster');
    expect(attributeValue(cluster, 'data-ngx-yeti-item-cluster')).toBe('');
    expect(attributeValue(cluster, 'data-gap')).toBe('xs');
    expect(attributeValue(cluster, 'data-justify')).toBe('between');
    expect(attributeValue(cluster, 'data-align')).toBe('baseline');
    expect(attributeValue(cluster, 'data-threshold')).toBe('sm');
    expect(attributeValue(cluster, 'role')).toBe('list');
    expect(html).toContain('css');
  });

  it('writes no align attribute for the static align', async () => {
    expect.assertions(1);

    const [cluster] = openingTags(await render(), 'ul');
    assert.exists(cluster);

    expect(attributeValue(cluster, 'align')).toBeNull();
  });

  it('writes one cluster item link into the head', async () => {
    expect.assertions(4);

    const links = headLinks(await render()).filter(
      (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
    );
    const [cluster, ...rest] = links;
    assert.exists(cluster);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(cluster, 'data-ngx-yeti-styles')).toBe('cluster');
    expect(attributeValue(cluster, 'data-beasties-skip')).toBe('');
    expect(attributeValue(cluster, 'href')).toMatch(
      /^yeti-css\/layouts\/cluster\/cluster\.css\?v=[0-9a-f]{40}$/,
    );
  });

  it('puts no jsaction on any element', async () => {
    expect.assertions(1);

    expect(
      allOpeningTags(await render(), '[a-z][\\w-]*').filter(
        (tag) => attributeValue(tag, 'jsaction') !== null,
      ),
    ).toStrictEqual([]);
  });
});
