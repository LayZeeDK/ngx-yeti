import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const workspaceRoot = join(import.meta.dirname, '../../..');

// The `build` target writes it; `test` depends on `build`.
const builtTypes = join(workspaceRoot, 'dist/packages/ngx-yeti/types');

/** The names the `export` statements of a declaration file declare. */
function exportedNames(declarations: string): string[] {
  return [
    ...[
      ...declarations.matchAll(
        /^export (?:declare )?(?:abstract )?(?:type|interface|const|class|function|enum) (\w+)/gm,
      ),
    ].flatMap(([, name]) => (name === undefined ? [] : [name])),
    ...[...declarations.matchAll(/^export (?:type )?\{([^}]*)\}/gm)].flatMap(
      ([, names]) =>
        (names ?? '')
          .split(',')
          .map((name) => name.replace(/^\s*type\s+/, '').trim())
          .map((name) => name.split(/\s+as\s+/).at(-1) ?? '')
          .filter((name) => name !== ''),
    ),
  ];
}

/** The names the `export` statements of Yeti's built `yeti.d.ts` declare. */
function yetiExportedNames(): string[] {
  return exportedNames(
    readFileSync(join(workspaceRoot, 'vendor/yeti/dist/yeti.d.ts'), 'utf8'),
  );
}

/**
 * Every name a secondary entry point of the built package exports, types
 * included. The primary entry point re-exports Yeti's own types by design
 * (ADR 0080 point 5), so it is left out.
 */
function packageExportedNames(): string[] {
  return Array.from(readdirSync(builtTypes))
    .filter((file) => /^ngx-yeti-.+\.d\.ts$/.test(file))
    .flatMap((file) =>
      exportedNames(readFileSync(join(builtTypes, file), 'utf8')),
    );
}

describe('adr 0080 name collisions', () => {
  it('reads the 46 names Yeti exports at the pin', () => {
    expect(yetiExportedNames()).toHaveLength(46);
  });

  it('keeps every export of the package apart from them', () => {
    const packageNames = packageExportedNames();
    const yeti = new Set(yetiExportedNames());

    expect(packageNames).toStrictEqual(
      expect.arrayContaining([
        'YetiCard',
        'YetiCardLink',
        'yetiCardToken',
        'NgxYetiLift',
        'injectYetiItemStyles',
        'provideYetiStyles',
        'YetiStylesConfig',
      ]),
    );
    expect(packageNames.filter((name) => yeti.has(name))).toStrictEqual([]);
  });
});
