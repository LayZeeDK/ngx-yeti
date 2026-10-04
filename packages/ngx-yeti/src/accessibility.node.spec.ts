import { readFileSync } from 'node:fs';
import path from 'node:path';
import { transform } from 'lightningcss';

const packageRoot = path.join(import.meta.dirname, '..');

function readPackageFile(name: string): string {
  return readFileSync(path.join(packageRoot, name), 'utf8');
}

interface Findings {
  readonly outsideLayer: readonly string[];
  readonly privateReads: readonly string[];
  readonly privateWrites: readonly string[];
  readonly classSelectors: readonly string[];
}

function inspect(css: string): Findings {
  const outsideLayer: string[] = [];
  const privateReads: string[] = [];
  const privateWrites: string[] = [];
  const classSelectors: string[] = [];
  const isPrivateToken = (name: string): boolean => name.startsWith('--_yeti-');

  transform({
    filename: 'accessibility.css',
    code: Buffer.from(css),
    visitor: {
      StyleSheet(stylesheet) {
        for (const rule of stylesheet.rules) {
          const inLayer =
            rule.type === 'layer-block' &&
            rule.value.name?.join('.') === 'ngx-yeti';

          if (!inLayer) {
            outsideLayer.push(rule.type);
          }
        }
      },
      Declaration(declaration) {
        if (
          declaration.property === 'custom' &&
          isPrivateToken(declaration.value.name)
        ) {
          privateWrites.push(declaration.value.name);
        }
      },
      Variable(variable) {
        if (isPrivateToken(variable.name.ident)) {
          privateReads.push(variable.name.ident);
        }
      },
      Selector(selector) {
        for (const component of selector) {
          if (
            component.type === 'class' &&
            component.name.startsWith('ngx-yeti')
          ) {
            classSelectors.push(component.name);
          }
        }
      },
    },
  });

  return { outsideLayer, privateReads, privateWrites, classSelectors };
}

describe('ngx-yeti/accessibility.css', () => {
  // The Firefox scale workaround writes --_yeti-t and nothing else of Yeti's
  // (the departures table of the ngx-yeti-specs skill, user ruling 2026-10-04).
  it('keeps every rule inside @layer ngx-yeti, reads no --_yeti-* token, writes only --_yeti-t, and names no package class', () => {
    expect(inspect(readPackageFile('accessibility.css'))).toStrictEqual({
      outsideLayer: [],
      privateReads: [],
      privateWrites: ['--_yeti-t'],
      classSelectors: [],
    });
  });

  it('reports a rule outside the layer, a private token, and a package class', () => {
    const css = `
      a[aria-current] { color: red; }
      @layer yeti { b { color: red; } }
      @layer ngx-yeti {
        .ngx-yeti-x[aria-pressed] { --_yeti-a: 1; color: var(--_yeti-b); }
      }
    `;

    expect(inspect(css)).toStrictEqual({
      outsideLayer: ['style', 'layer-block'],
      privateReads: ['--_yeti-b'],
      privateWrites: ['--_yeti-a'],
      classSelectors: ['ngx-yeti-x'],
    });
  });

  it('is published as an ng-packagr asset and through the package exports map', () => {
    const ngPackage: unknown = JSON.parse(readPackageFile('ng-package.json'));
    const packageJson: unknown = JSON.parse(readPackageFile('package.json'));

    expect(ngPackage).toHaveProperty(
      'assets',
      expect.arrayContaining(['accessibility.css']),
    );
    expect(packageJson).toHaveProperty(
      ['exports', './accessibility.css'],
      './accessibility.css',
    );
  });
});
