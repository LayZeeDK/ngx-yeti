import {
  allOpeningTags,
  attributeValue,
  head,
  headLinks,
  itemHref,
  itemLinkOf,
  jsactionTags,
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

  it('throws, naming the tag, on a tag the parser drops outside its parent', () => {
    expect(() => attributeValue('<td data-x="1">', 'data-x')).toThrow(
      'Not an opening tag the HTML parser keeps: <td data-x="1">',
    );
  });

  it('throws, naming the tag, on a tag after leading text', () => {
    expect(() => attributeValue('x<a data-x="1">', 'data-x')).toThrow(
      'Not an opening tag the HTML parser keeps: x<a data-x="1">',
    );
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

const pin = 'f52d1e8b93de5bbde322480ba77d5be26c49b0ef';

describe(itemLinkOf, () => {
  it("counts the item's head links and reads the first", () => {
    const html = `<html><head><link data-ngx-yeti-styles="box" href="b"><link data-ngx-yeti-styles="stack" href="s1" data-beasties-skip=""><link data-ngx-yeti-styles="stack" href="s2"></head><body><link data-ngx-yeti-styles="center" href="c"></body></html>`;

    expect(itemLinkOf(html, 'stack')).toStrictEqual({
      count: 2,
      beastiesSkip: true,
      href: 's1',
    });
    expect(itemLinkOf(html, 'box')).toStrictEqual({
      count: 1,
      beastiesSkip: false,
      href: 'b',
    });
  });

  it('finds no link outside the head or of another item', () => {
    const html =
      '<html><head><link data-ngx-yeti-styles="stack-x" href="x"></head><body><link data-ngx-yeti-styles="stack" href="s"></body></html>';

    expect(itemLinkOf(html, 'stack')).toStrictEqual({
      count: 0,
      beastiesSkip: false,
      href: null,
    });
  });
});

describe(itemHref, () => {
  it("matches the whole href of the item's file with a 40-character pin", () => {
    const href = itemHref('layouts', 'stack');

    expect(`yeti-css/layouts/stack/stack.css?v=${pin}`).toMatch(href);
    expect(`yeti-css/layouts/stack/stack.css?v=${pin}x`).not.toMatch(href);
    expect(`/yeti-css/layouts/stack/stack.css?v=${pin}`).not.toMatch(href);
    expect(`yeti-css/layouts/stack/stack.css?v=${pin.slice(1)}`).not.toMatch(
      href,
    );
    expect(`yeti-css/components/stack/stack.css?v=${pin}`).not.toMatch(href);
    expect(`yeti-css/layouts/stack/stackXcss?v=${pin}`).not.toMatch(href);
  });

  it('matches a hyphenated item name literally', () => {
    expect(
      `yeti-css/utilities/visually-hidden/visually-hidden.css?v=${pin}`,
    ).toMatch(itemHref('utilities', 'visually-hidden'));
  });
});

describe(jsactionTags, () => {
  it('lists the opening tags that carry jsaction, and only those', () => {
    const html =
      '<html><head></head><body><p title="jsaction"><a jsaction="click:;" href="/">A</a><yeti-x jsaction="">B</yeti-x></p></body></html>';

    expect(jsactionTags(html)).toStrictEqual([
      '<a jsaction="click:;" href="/">',
      '<yeti-x jsaction="">',
    ]);
    expect(jsactionTags('<p></p>')).toStrictEqual([]);
  });
});
