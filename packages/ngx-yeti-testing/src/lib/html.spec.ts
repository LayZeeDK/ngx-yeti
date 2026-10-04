import {
  allOpeningTags,
  attributeValue,
  head,
  headLinks,
  openingTags,
} from './html';

const page =
  '<html><head><link rel="a"><title>T</title><link rel="b"></head><body><p><a data-x="1/1" data-y class="c"><a.b></a.b><link rel="c"></body></html>';

describe(attributeValue, () => {
  it('reads valued, empty, and absent attributes of an opening tag', () => {
    const [tag] = openingTags(page, 'a');

    assert.exists(tag);

    expect(attributeValue(tag, 'data-x')).toBe('1/1');
    expect(attributeValue(tag, 'data-y')).toBe('');
    expect(attributeValue(tag, 'data-z')).toBeNull();
  });

  it('reads a name with regular-expression characters literally', () => {
    expect(attributeValue('<a data-x.y="1">', 'data-x.y')).toBe('1');
    expect(attributeValue('<a data-xzy="1">', 'data-x.y')).toBeNull();
  });
});

describe(openingTags, () => {
  it('matches a tag name literally and a pattern as a pattern', () => {
    expect(openingTags(page, 'a.b')).toStrictEqual(['<a.b>']);
    expect(allOpeningTags(page, 'a|p')).toStrictEqual([
      '<p>',
      '<a data-x="1/1" data-y class="c">',
      '<a.b>',
    ]);
  });
});

describe(head, () => {
  it('returns the head and only its links', () => {
    expect(head(page)).toMatch(/^<head>.*<\/head>$/);
    expect(head('<p></p>')).toBe('');
    expect(headLinks(page)).toStrictEqual(['<link rel="a">', '<link rel="b">']);
  });
});
