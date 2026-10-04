import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { transform } from 'lightningcss';
import manifest from 'yeti-css/manifest';

// The `build` target writes it; `test` depends on `build`.
const builtPackage = path.join(
  import.meta.dirname,
  '../../../dist/packages/ngx-yeti',
);

const yetiClasses = new Set(
  Object.values(manifest.components).map((component) => component.class),
);

// A class selector followed by its rule's `{`, as CSS in a string would read.
const yetiSelectorInScript = new RegExp(
  String.raw`\.(?:${[...yetiClasses].map((name) => RegExp.escape(name)).join('|')})(?![\w-])[^{};()]*\{`,
  'g',
);

/** Yeti rules in a FESM bundle: an `@layer yeti` block or a Yeti class rule. */
function yetiRulesInScript(code: string): readonly string[] {
  return [
    ...(code.match(/@layer\s+yeti(?![\w-])/g) ?? []),
    ...(code.match(yetiSelectorInScript) ?? []),
  ];
}

/** Yeti rules in a stylesheet: a `yeti` layer or a selector of a Yeti class. */
function yetiRulesInStylesheet(css: string): readonly string[] {
  const found: string[] = [];

  transform({
    filename: 'shipped.css',
    code: Buffer.from(css),
    visitor: {
      Rule: {
        'layer-block'(rule) {
          if (rule.value.name?.[0] === 'yeti') {
            found.push('@layer yeti');
          }
        },
        'layer-statement'(rule) {
          for (const name of rule.value.names) {
            if (name[0] === 'yeti') {
              found.push('@layer yeti');
            }
          }
        },
      },
      Selector(selector) {
        for (const component of selector) {
          if (component.type === 'class' && yetiClasses.has(component.name)) {
            found.push(`.${component.name}`);
          }
        }
      },
    },
  });

  return found;
}

function shippedFiles(extension: string) {
  // Copied into this realm: an array from node:fs fails toStrictEqual([]).
  return Array.from(
    readdirSync(builtPackage, { recursive: true, encoding: 'utf8' }),
  )
    .filter((file) => file.endsWith(extension))
    .map((file) => ({
      file,
      code: readFileSync(path.join(builtPackage, file), 'utf8'),
    }));
}

describe('the published output', () => {
  it('holds no Yeti rule in any FESM bundle', () => {
    const bundles = shippedFiles('.mjs');

    expect(bundles.map(({ file }) => path.basename(file))).toContain(
      'ngx-yeti-card.mjs',
    );
    expect(
      bundles.flatMap(({ file, code }) =>
        yetiRulesInScript(code).map((rule) => `${file}: ${rule}`),
      ),
    ).toStrictEqual([]);
  });

  it('holds no Yeti rule in any shipped stylesheet', () => {
    const stylesheets = shippedFiles('.css');

    expect(stylesheets.map(({ file }) => file)).toContain('accessibility.css');
    expect(
      stylesheets.flatMap(({ file, code }) =>
        yetiRulesInStylesheet(code).map((rule) => `${file}: ${rule}`),
      ),
    ).toStrictEqual([]);
  });

  it('reports a Yeti layer and a Yeti class rule in a bundle and a stylesheet', () => {
    const css = '@layer yeti { .card[data-raised] { color: red; } }';

    expect(yetiRulesInScript(`const styles = ['${css}'];`)).toStrictEqual([
      '@layer yeti',
      '.card[data-raised] {',
    ]);
    expect(yetiRulesInStylesheet(css)).toStrictEqual(['@layer yeti', '.card']);
    expect(
      yetiRulesInScript('if (host.card) { host.card.lift(); }'),
    ).toStrictEqual([]);
  });
});
