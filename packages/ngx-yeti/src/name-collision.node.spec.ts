import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as card from 'ngx-yeti/card';
import * as lift from 'ngx-yeti/lift';
import * as styles from 'ngx-yeti/styles';

/** The names the `export` statements of Yeti's built `yeti.d.ts` declare. */
function yetiExportedNames(): string[] {
  const declarations = readFileSync(
    join(import.meta.dirname, '../../../vendor/yeti/dist/yeti.d.ts'),
    'utf8',
  );

  return [
    ...declarations.matchAll(
      /^export (?:declare )?(?:type|interface|const|class|function|enum) (\w+)/gm,
    ),
  ].flatMap(([, name]) => (name === undefined ? [] : [name]));
}

describe('adr 0080 name collisions', () => {
  it('reads the 46 names Yeti exports at the pin', () => {
    expect(yetiExportedNames()).toHaveLength(46);
  });

  it('keeps every export of the package apart from them', () => {
    const packageNames = [
      ...Object.keys(styles),
      ...Object.keys(card),
      ...Object.keys(lift),
      // A type leaves no runtime export.
      'YetiStylesConfig',
    ];
    const yeti = new Set(yetiExportedNames());

    expect(packageNames).toStrictEqual(
      expect.arrayContaining([
        'YetiCard',
        'YetiCardLink',
        'yetiCardToken',
        'NgxYetiLift',
        'YetiStylesConfig',
      ]),
    );
    expect(packageNames.filter((name) => yeti.has(name))).toStrictEqual([]);
  });
});
