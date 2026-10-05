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

  it('reads no attribute from inside another attribute value', () => {
    expect(
      attributeValue('<a title="x jsaction y" href="/">', 'jsaction'),
    ).toBeNull();
  });
});

describe(openingTags, () => {
  it('matches a tag name literally and a pattern as a pattern', () => {
    expect(openingTags(page, 'a.b')).toStrictEqual(['<a.b>']);
    expect(allOpeningTags(page, 'a|p')).toStrictEqual([
      '<p>',
      '<a data-x="1/1" data-y class="c">',
    ]);
  });

  it('matches the whole tag name, not a prefix of a longer one', () => {
    expect(openingTags('<a-foo x></a-foo><a href="x"></a>', 'a')).toStrictEqual(
      ['<a href="x">'],
    );
    expect(
      openingTags(
        '<yeti-card-link></yeti-card-link><yeti-card></yeti-card>',
        'yeti-card',
      ),
    ).toStrictEqual(['<yeti-card>']);
  });

  it('keeps a > inside a quoted attribute value in the tag', () => {
    const [tag, ...rest] = openingTags('<a aria-label="a>b" data-x></a>', 'a');
    assert.exists(tag);

    expect(rest).toStrictEqual([]);
    expect(tag).toBe('<a aria-label="a>b" data-x>');
    expect(attributeValue(tag, 'data-x')).toBe('');
  });
});

describe(head, () => {
  it('returns the head and only its links', () => {
    expect(head(page)).toMatch(/^<head>.*<\/head>$/);
    expect(head('<p></p>')).toBe('');
    expect(headLinks(page)).toStrictEqual(['<link rel="a">', '<link rel="b">']);
  });

  it('finds a head that has attributes', () => {
    const html =
      '<html><head lang="en"><link rel="a"></head><body><link rel="b"></body></html>';

    expect(head(html)).toBe('<head lang="en"><link rel="a"></head>');
    expect(headLinks(html)).toStrictEqual(['<link rel="a">']);
  });
});
