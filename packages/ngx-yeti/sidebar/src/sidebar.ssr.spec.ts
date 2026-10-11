import { Component, signal } from '@angular/core';
import {
  allOpeningTags,
  attributeValue,
  headLinks,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import type { YetiSide } from 'ngx-yeti';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { YetiSidebar } from './sidebar';
import { YetiSidebarChild } from './sidebar-child';

/**
 * Section 8's markup with a static `align` and a bound `side` (sidebar.md,
 * Testing Decisions, layer 3).
 */
@Component({
  selector: 'yeti-sidebar-fixture',
  imports: [YetiSidebar, YetiSidebarChild, YetiBox, YetiBorder],
  template:
    '<div yetiSidebar width="xs" gap="lg" align="center" [side]="side()"><nav yetiBox yetiBorder surface="raised" yetiSidebarChild sticky aria-label="Section"><a href="/overview">Overview</a></nav><article yetiBox yetiBorder surface="raised"><h2 i18n>Content</h2><p i18n>Takes the remaining width, and the whole width once the two no longer fit.</p></article></div>',
})
class SidebarFixture {
  protected readonly side = signal<YetiSide>('end');
}

function render(): Promise<string> {
  return renderServer(SidebarFixture);
}

describe(YetiSidebar, () => {
  it('renders the sidebar host with its class, presence attribute, and inputs', async () => {
    expect.assertions(9);

    const html = await render();
    const [sidebar, ...rest] = openingTags(html, 'div');
    assert.exists(sidebar);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(sidebar, 'class')).toBe('sidebar');
    expect(attributeValue(sidebar, 'data-ngx-yeti-item-sidebar')).toBe('');
    expect(attributeValue(sidebar, 'data-side')).toBe('end');
    expect(attributeValue(sidebar, 'data-width')).toBe('xs');
    expect(attributeValue(sidebar, 'data-gap')).toBe('lg');
    expect(attributeValue(sidebar, 'data-align')).toBe('center');
    expect(attributeValue(sidebar, 'align')).toBeNull();
    expect(html).toContain('Takes the remaining width');
  });

  it("renders the child's marker and no sidebar presence attribute on it", async () => {
    expect.assertions(2);

    const [nav] = openingTags(await render(), 'nav');
    assert.exists(nav);

    expect(attributeValue(nav, 'data-sticky')).toBe('');
    expect(attributeValue(nav, 'data-ngx-yeti-item-sidebar')).toBeNull();
  });

  it('writes one sidebar item link into the head, before the box link', async () => {
    expect.assertions(4);

    const links = headLinks(await render()).filter(
      (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
    );
    const sidebars = links.filter(
      (tag) => attributeValue(tag, 'data-ngx-yeti-styles') === 'sidebar',
    );
    const [sidebar] = sidebars;
    assert.exists(sidebar);

    expect(sidebars).toHaveLength(1);
    expect(
      links.map((tag) => attributeValue(tag, 'data-ngx-yeti-styles')),
    ).toStrictEqual(['sidebar', 'box']);
    expect(attributeValue(sidebar, 'data-beasties-skip')).toBe('');
    expect(attributeValue(sidebar, 'href')).toMatch(
      /^yeti-css\/layouts\/sidebar\/sidebar\.css\?v=[0-9a-f]{40}$/,
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
