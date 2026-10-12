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

/**
 * The item files a root directive loads after its own, by its item, as that
 * item's spec names them: a busy button's ring is a rule of `spinner.css`.
 */
const acquired: Readonly<Record<string, readonly string[]>> = {
  button: ['spinner'],
};

describe('item root directives', () => {
  it('load the item file their presence attribute names, then only the files their spec says they acquire', () => {
    const items = itemNames();

    expect(items.map(({ file }) => file)).toStrictEqual(
      expect.arrayContaining([
        'card/src/card.ts',
        'lift/src/lift.ts',
        'stack/src/stack.ts',
        'center/src/center.ts',
        'box/src/box.ts',
        'breakout/src/breakout.ts',
        'timeline/src/timeline.ts',
        'grid/src/grid.ts',
        'masonry/src/masonry.ts',
        'enter/src/enter.ts',
        'visually-hidden/src/visually-hidden.ts',
        'cluster/src/cluster.ts',
        'sidebar/src/sidebar.ts',
        'cover/src/cover.ts',
        'columns/src/columns.ts',
        'layer/src/layer.ts',
        'overlay/src/overlay.ts',
        'spinner/src/spinner.ts',
        'scroller/src/scroller.ts',
        'frame/src/frame.ts',
      ]),
    );
    expect(
      items.filter(({ presence, styles }) => {
        const [item, ...others] = presence;
        const [own, ...further] = styles;

        return (
          item === undefined ||
          others.length > 0 ||
          own !== item ||
          further.join() !== (acquired[item] ?? []).join()
        );
      }),
    ).toStrictEqual([]);
  });
});
