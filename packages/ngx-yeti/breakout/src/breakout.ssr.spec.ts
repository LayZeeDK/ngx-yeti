import { Component, signal } from '@angular/core';
import {
  allOpeningTags,
  attributeValue,
  headLinks,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import type { YetiWidth } from 'ngx-yeti';
import { YetiBreakout } from './breakout';
import { YetiBreakoutChild } from './breakout-child';
import { YetiBreakoutNote } from './breakout-note';

/**
 * A breakout with a bound `max`, a bleeding child, and a note (breakout.md,
 * Testing Decisions, layer 3).
 */
@Component({
  selector: 'yeti-breakout-fixture',
  imports: [YetiBreakout, YetiBreakoutChild, YetiBreakoutNote],
  template:
    '<article yetiBreakout [max]="max()"><h1 i18n>Trail maps</h1><p i18n>Every marked route in the park.</p><figure yetiBreakoutChild bleed>A valley at dusk</figure><p>The valley loop is the easiest.</p><aside yetiBreakoutNote>Closed from November to March.</aside></article>',
})
class BreakoutFixture {
  protected readonly max = signal<YetiWidth>('lg');
}

function render(): Promise<string> {
  return renderServer(BreakoutFixture);
}

describe(YetiBreakout, () => {
  it('renders the breakout host with its class, presence attribute, and bound max', async () => {
    expect.assertions(6);

    const html = await render();
    const [breakout, ...rest] = openingTags(html, 'article');
    assert.exists(breakout);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(breakout, 'class')).toBe('breakout');
    expect(attributeValue(breakout, 'data-ngx-yeti-item-breakout')).toBe('');
    expect(attributeValue(breakout, 'data-max')).toBe('lg');
    expect(attributeValue(breakout, 'data-gap')).toBeNull();
    expect(html).toContain('Trail maps');
  });

  it('renders the bleeding child and the note with their markers and no presence attribute', async () => {
    expect.assertions(4);

    const html = await render();
    const [child] = openingTags(html, 'figure');
    const [note] = openingTags(html, 'aside');
    assert.exists(child);
    assert.exists(note);

    expect(attributeValue(child, 'data-bleed')).toBe('');
    expect(attributeValue(note, 'data-note')).toBe('');
    expect(child).not.toContain('data-ngx-yeti-');
    expect(note).not.toContain('data-ngx-yeti-');
  });

  it('writes one breakout item link into the head', async () => {
    expect.assertions(4);

    const links = headLinks(await render()).filter(
      (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
    );
    const [breakout, ...rest] = links;
    assert.exists(breakout);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(breakout, 'data-ngx-yeti-styles')).toBe('breakout');
    expect(attributeValue(breakout, 'data-beasties-skip')).toBe('');
    expect(attributeValue(breakout, 'href')).toMatch(
      /^yeti-css\/layouts\/breakout\/breakout\.css\?v=[0-9a-f]{40}$/,
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
