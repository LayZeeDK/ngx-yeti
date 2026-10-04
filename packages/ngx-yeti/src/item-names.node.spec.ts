import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const packageRoot = join(import.meta.dirname, '..');

interface ItemNames {
  readonly file: string;
  readonly presence: readonly string[];
  readonly styles: readonly string[];
}

/**
 * The item names each source file of a secondary entry point writes twice:
 * in the host's presence attribute and in its `injectYetiItemStyles` call.
 */
function itemNames(): ItemNames[] {
  return Array.from(
    readdirSync(packageRoot, { recursive: true, encoding: 'utf8' }),
  )
    .map((file) => file.replaceAll('\\', '/'))
    .filter(
      (file) =>
        /^[^/]+\/src\/[^/]+\.ts$/.test(file) &&
        !/\.(?:spec|stories)\.ts$/.test(file),
    )
    .map((file) => {
      const source = readFileSync(join(packageRoot, file), 'utf8');

      return {
        file,
        presence: [
          ...source.matchAll(/'data-ngx-yeti-item-([\w-]+)'\s*:/g),
        ].flatMap(([, name]) => (name === undefined ? [] : [name])),
        styles: [
          ...source.matchAll(/injectYetiItemStyles\('([\w-]+)'\)/g),
        ].flatMap(([, name]) => (name === undefined ? [] : [name])),
      };
    })
    .filter(({ presence, styles }) => presence.length + styles.length > 0);
}

describe('item root directives', () => {
  it('load the item file their presence attribute names', () => {
    const items = itemNames();

    expect(items.map(({ file }) => file)).toStrictEqual(
      expect.arrayContaining(['card/src/card.ts', 'lift/src/lift.ts']),
    );
    expect(
      items.filter(
        ({ presence, styles }) =>
          presence.length !== 1 ||
          styles.length !== 1 ||
          presence[0] !== styles[0],
      ),
    ).toStrictEqual([]);
  });
});
