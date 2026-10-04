import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { yetiPin, yetiRank } from './yeti-rank';

const yetiRoot = join(import.meta.dirname, '../../../../vendor/yeti');
const cssRoot = join(yetiRoot, 'dist/css');
const kinds: Record<string, string> = {
  layouts: 'layout',
  recipes: 'recipe',
  components: 'component',
  utilities: 'utility',
};

/** The item files of Yeti's built `yeti.css`, in its import order. */
function itemImports() {
  const yetiCss = readFileSync(join(cssRoot, 'yeti.css'), 'utf8');

  return [...yetiCss.matchAll(/@import "(([\w-]+)\/([\w-]+)\/\3\.css)";/g)].map(
    ([, path, folder, name]) => ({ name, kind: kinds[folder ?? ''], path }),
  );
}

describe('the generated rank table', () => {
  it("lists the 49 items in the order of Yeti's built yeti.css", () => {
    const items = itemImports();

    expect(items).toHaveLength(49);
    expect(
      Object.entries(yetiRank).map(([name, { kind, path }]) => ({
        name,
        kind,
        path,
      })),
    ).toStrictEqual(items);
    expect(Object.values(yetiRank).map(({ rank }) => rank)).toStrictEqual(
      items.map((_item, index) => index),
    );
  });

  it("names files present in Yeti's build", () => {
    expect(
      Object.values(yetiRank).filter(
        ({ path }) => !existsSync(join(cssRoot, path)),
      ),
    ).toStrictEqual([]);
  });

  it('pins the vendored Yeti commit', () => {
    expect(yetiPin).toBe(readFileSync(join(yetiRoot, 'COMMIT'), 'utf8').trim());
  });
});
