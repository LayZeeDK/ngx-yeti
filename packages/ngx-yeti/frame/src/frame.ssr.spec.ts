import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import {
  allOpeningTags,
  attributeValue,
  headLinks,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import { YetiFrame } from './frame';

/**
 * A `4/3` frame holding an image with a translated `alt`, and a frame with
 * no `ratio` (frame.md, Testing Decisions, layer 3).
 */
@Component({
  selector: 'yeti-frame-fixture',
  imports: [NgOptimizedImage, YetiFrame],
  template:
    '<div id="photo" yetiFrame ratio="4/3"><img ngSrc="trail.svg" width="1600" height="900" alt="A mountain trail at dusk, cropped to four by three" i18n-alt /></div><div id="plain" yetiFrame><span>A stand-in</span></div>',
})
class FrameFixture {}

function render(): Promise<string> {
  return renderServer(FrameFixture);
}

describe(YetiFrame, () => {
  it('renders a frame with its class, presence attribute, and ratio', async () => {
    expect.assertions(5);

    const html = await render();
    const photo = openingTags(html, 'div').find(
      (tag) => attributeValue(tag, 'id') === 'photo',
    );
    assert.exists(photo);

    expect(attributeValue(photo, 'class')).toBe('frame');
    expect(attributeValue(photo, 'data-ngx-yeti-item-frame')).toBe('');
    expect(attributeValue(photo, 'data-ratio')).toBe('4/3');
    expect(attributeValue(photo, 'ratio')).toBe('4/3');
    expect(html).toContain(
      'alt="A mountain trail at dusk, cropped to four by three"',
    );
  });

  it('renders no data-ratio on a frame with no ratio', async () => {
    expect.assertions(3);

    const plain = openingTags(await render(), 'div').find(
      (tag) => attributeValue(tag, 'id') === 'plain',
    );
    assert.exists(plain);

    expect(attributeValue(plain, 'class')).toBe('frame');
    expect(attributeValue(plain, 'data-ngx-yeti-item-frame')).toBe('');
    expect(attributeValue(plain, 'data-ratio')).toBeNull();
  });

  it('writes one frame item link into the head', async () => {
    expect.assertions(4);

    const links = headLinks(await render()).filter(
      (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
    );
    const [frame, ...rest] = links;
    assert.exists(frame);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(frame, 'data-ngx-yeti-styles')).toBe('frame');
    expect(attributeValue(frame, 'data-beasties-skip')).toBe('');
    expect(attributeValue(frame, 'href')).toMatch(
      /^yeti-css\/layouts\/frame\/frame\.css\?v=[0-9a-f]{40}$/,
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
