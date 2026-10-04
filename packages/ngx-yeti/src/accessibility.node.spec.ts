import { readFileSync } from 'node:fs';
import path from 'node:path';
import { transform } from 'lightningcss';

const packageRoot = path.join(import.meta.dirname, '..');

function readPackageFile(name: string): string {
  return readFileSync(path.join(packageRoot, name), 'utf8');
}

interface Findings {
  readonly outsideLayer: readonly string[];
  readonly privateTokens: readonly string[];
  readonly classSelectors: readonly string[];
}

function inspect(css: string): Findings {
  const outsideLayer: string[] = [];
  const privateTokens: string[] = [];
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
          privateTokens.push(declaration.value.name);
        }
      },
      Variable(variable) {
        if (isPrivateToken(variable.name.ident)) {
          privateTokens.push(variable.name.ident);
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

  return { outsideLayer, privateTokens, classSelectors };
}

describe('ngx-yeti/accessibility.css', () => {
  it('keeps every rule inside @layer ngx-yeti, reads or writes no --_yeti-* token, and names no package class', () => {
    expect(inspect(readPackageFile('accessibility.css'))).toStrictEqual({
      outsideLayer: [],
      privateTokens: [],
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
      privateTokens: ['--_yeti-a', '--_yeti-b'],
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
