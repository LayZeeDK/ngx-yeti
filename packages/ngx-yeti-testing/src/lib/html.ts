import {
  type DefaultTreeAdapterTypes,
  defaultTreeAdapter,
  parse,
} from 'parse5';

interface ParsedElement {
  readonly element: DefaultTreeAdapterTypes.Element;
  /** The opening tag as written in the source. */
  readonly tag: string;
  readonly start: number;
  readonly end: number;
}

/**
 * The elements written out in `html`, in source order, each with the source
 * span of its opening tag and of the whole element. Elements the parser
 * implies, such as a missing `<head>`, have no source and are left out, and
 * so is the content of a `<template>`.
 */
function parsedElements(html: string): ParsedElement[] {
  const found: ParsedElement[] = [];

  function visit(parent: DefaultTreeAdapterTypes.ParentNode): void {
    for (const node of parent.childNodes) {
      if (!defaultTreeAdapter.isElementNode(node)) {
        continue;
      }

      const location = node.sourceCodeLocation;
      const startTag = location?.startTag;

      if (location && startTag) {
        found.push({
          element: node,
          tag: html.slice(startTag.startOffset, startTag.endOffset),
          start: location.startOffset,
          end: location.endOffset,
        });
      }

      visit(node);
    }
  }

  visit(parse(html, { sourceCodeLocationInfo: true }));

  return found.sort((a, b) => a.start - b.start);
}

/**
 * The opening tags of every element whose name matches `pattern`, a regular
 * expression source, in document order: `'[a-z][\\w-]*'` for every element.
 * The pattern must match the whole name.
 */
export function allOpeningTags(html: string, pattern: string): string[] {
  const name = new RegExp(`^(?:${pattern})$`);

  return parsedElements(html)
    .filter(({ element }) => name.test(element.tagName))
    .map(({ tag }) => tag);
}

/** The opening tags of every element named `tag`, in document order. */
export function openingTags(html: string, tag: string): string[] {
  return allOpeningTags(html, RegExp.escape(tag));
}

/**
 * The value of attribute `name` in an opening tag, or `null` when absent.
 * Character references in the value are decoded.
 */
export function attributeValue(tag: string, name: string): string | null {
  const parsed = parsedElements(tag).find(({ start }) => start === 0);

  if (parsed === undefined) {
    throw new Error(`Not an opening tag the HTML parser keeps: ${tag}`);
  }

  return (
    parsed.element.attrs.find((attribute) => attribute.name === name)?.value ??
    null
  );
}

/** The `<head>` element of a serialized page, or `''` when it has none. */
export function head(html: string): string {
  const parsed = parsedElements(html).find(
    ({ element }) => element.tagName === 'head',
  );

  return parsed === undefined ? '' : html.slice(parsed.start, parsed.end);
}

/** The opening tags of every `<link>` in a serialized page's `<head>`. */
export function headLinks(html: string): string[] {
  return openingTags(head(html), 'link');
}

/**
 * The head links of `html` whose `data-ngx-yeti-styles` is `item`: how many
 * there are, and whether the first carries `data-beasties-skip` and what its
 * `href` is (`null` when there is none).
 */
export function itemLinkOf(
  html: string,
  item: string,
): {
  readonly count: number;
  readonly beastiesSkip: boolean;
  readonly href: string | null;
} {
  const links = headLinks(html).filter(
    (tag) => attributeValue(tag, 'data-ngx-yeti-styles') === item,
  );
  const [first] = links;

  return {
    count: links.length,
    beastiesSkip:
      first !== undefined &&
      attributeValue(first, 'data-beasties-skip') !== null,
    href: first === undefined ? null : attributeValue(first, 'href'),
  };
}

/**
 * Matches the whole href of `item`'s file in Yeti's `kind` folder, such as
 * `layouts`, with the 40-character pin as its version.
 */
export function itemHref(kind: string, item: string): RegExp {
  const folder = RegExp.escape(kind);
  const name = RegExp.escape(item);

  return new RegExp(
    String.raw`^yeti-css/${folder}/${name}/${name}\.css\?v=[0-9a-f]{40}$`,
  );
}

/** The opening tags of `html` that carry `jsaction`, in document order. */
export function jsactionTags(html: string): readonly string[] {
  return allOpeningTags(html, String.raw`[a-z][\w-]*`).filter(
    (tag) => attributeValue(tag, 'jsaction') !== null,
  );
}
