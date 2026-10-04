/**
 * The opening tags of every element whose name matches `pattern`, a regular
 * expression source, in document order: `'[a-z][\\w-]*'` for every element.
 */
export function allOpeningTags(html: string, pattern: string): string[] {
  return [...html.matchAll(new RegExp(`<(?:${pattern})\\b[^>]*>`, 'g'))].map(
    ([match]) => match,
  );
}

/** The opening tags of every element named `tag`, in document order. */
export function openingTags(html: string, tag: string): string[] {
  return allOpeningTags(html, RegExp.escape(tag));
}

/** The value of attribute `name` in an opening tag, or `null` when absent. */
export function attributeValue(tag: string, name: string): string | null {
  const match = new RegExp(
    `\\s${RegExp.escape(name)}(?:="([^"]*)")?[\\s/>]`,
  ).exec(tag);

  return match === null ? null : (match[1] ?? '');
}

/** The `<head>` element of a serialized page, or `''` when it has none. */
export function head(html: string): string {
  return /<head>[\s\S]*<\/head>/.exec(html)?.[0] ?? '';
}

/** The opening tags of every `<link>` in a serialized page's `<head>`. */
export function headLinks(html: string): string[] {
  return openingTags(head(html), 'link');
}
