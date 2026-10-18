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
import { YetiIcon } from './icon';

/**
 * A link with a decorative icon and a `span` with a meaningful one, written
 * with the static `align` (icon.md, Testing Decisions, layer 3).
 */
@Component({
  selector: 'yeti-icon-fixture',
  imports: [YetiIcon],
  // eslint-disable-next-line @angular-eslint/component-max-inline-declarations -- the fixture holds both forms of the name rule in one file
  template: `
    <a yetiIcon href="/download">
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 3v12M4 21h16" fill="none" stroke="currentColor" />
      </svg>
      <span i18n>Download</span>
    </a>
    <p>
      <span id="warning" yetiIcon align="baseline">
        <svg
          role="img"
          aria-label="Warning"
          i18n-aria-label
          viewBox="0 0 24 24"
        >
          <path d="M12 3 2 21h20z" fill="none" stroke="currentColor" />
        </svg>
        <span i18n>Your session ends in five minutes.</span>
      </span>
    </p>
  `,
})
class IconFixture {}

function render(): Promise<string> {
  return renderServer(IconFixture);
}

/** The opening tags of the link host and of the `span` host. */
function hosts(html: string): { link: string; warning: string } {
  const [link] = openingTags(html, 'a');
  const [warning] = openingTags(html, 'span').filter(
    (tag) => attributeValue(tag, 'id') === 'warning',
  );
  assert.exists(link);
  assert.exists(warning);

  return { link, warning };
}

describe(YetiIcon, () => {
  it('renders each host with its class and presence attribute and no unset attribute', async () => {
    expect.assertions(7);

    const html = await render();
    const { link, warning } = hosts(html);

    expect(attributeValue(link, 'class')).toBe('icon');
    expect(attributeValue(link, 'data-ngx-yeti-item-icon')).toBe('');
    expect(attributeValue(link, 'data-gap')).toBeNull();
    expect(attributeValue(link, 'data-align')).toBeNull();
    expect(attributeValue(warning, 'class')).toBe('icon');
    expect(attributeValue(warning, 'data-ngx-yeti-item-icon')).toBe('');
    expect(html).toContain('Your session ends in five minutes.');
  });

  it('renders the static align on data-align and writes no align attribute', async () => {
    expect.assertions(3);

    const { link, warning } = hosts(await render());

    expect(attributeValue(warning, 'data-align')).toBe('baseline');
    expect(attributeValue(warning, 'align')).toBeNull();
    expect(attributeValue(link, 'align')).toBeNull();
  });

  it("renders each SVG with the consumer's aria-hidden, or role and aria-label, unchanged", async () => {
    expect.assertions(7);

    const [decorative, meaningful, ...rest] = openingTags(
      await render(),
      'svg',
    );
    assert.exists(decorative);
    assert.exists(meaningful);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(decorative, 'aria-hidden')).toBe('true');
    expect(attributeValue(decorative, 'role')).toBeNull();
    expect(attributeValue(decorative, 'aria-label')).toBeNull();
    expect(attributeValue(meaningful, 'role')).toBe('img');
    expect(attributeValue(meaningful, 'aria-label')).toBe('Warning');
    expect(attributeValue(meaningful, 'aria-hidden')).toBeNull();
  });

  it('writes one icon item link into the head', async () => {
    expect.assertions(4);

    const html = await render();
    const link = itemLinkOf(html, 'icon');

    expect(
      headLinks(html).filter(
        (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
      ),
    ).toHaveLength(1);
    expect(link.count).toBe(1);
    expect(link.beastiesSkip).toBe(true);
    expect(link.href).toMatch(itemHref('layouts', 'icon'));
  });

  it('puts no jsaction on any element', async () => {
    expect.assertions(1);

    expect(jsactionTags(await render())).toStrictEqual([]);
  });
});
