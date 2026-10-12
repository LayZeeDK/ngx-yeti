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
    filename: 'ngx-yeti-globals.css',
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

// CSS Color 4 system colours, the only colours a forced-colours rule may
// set, so the user's palette stays theirs.
const systemColours = new Set([
  'AccentColor',
  'AccentColorText',
  'ActiveText',
  'ButtonBorder',
  'ButtonFace',
  'ButtonText',
  'Canvas',
  'CanvasText',
  'Field',
  'FieldText',
  'GrayText',
  'Highlight',
  'HighlightText',
  'LinkText',
  'Mark',
  'MarkText',
  'SelectedItem',
  'SelectedItemText',
  'VisitedText',
]);

/** The contents of each `@media (forced-colors: active)` block. */
function forcedColourBlocks(css: string): string[] {
  const blocks: string[] = [];
  const opening = /@media\s*\(\s*forced-colors\s*:\s*active\s*\)\s*\{/g;

  for (const match of css.matchAll(opening)) {
    let depth = 1;
    let end = match.index + match[0].length;

    while (depth > 0 && end < css.length) {
      depth += css[end] === '{' ? 1 : css[end] === '}' ? -1 : 0;
      end += 1;
    }

    blocks.push(css.slice(match.index + match[0].length, end - 1));
  }

  return blocks;
}

/**
 * The style rules of the forced-colours blocks: each rule's comma-separated
 * selectors and the properties it declares.
 */
function forcedColourRules(
  css: string,
): { selectors: string[]; properties: string[] }[] {
  return forcedColourBlocks(css.replaceAll(/\/\*[\s\S]*?\*\//g, '')).flatMap(
    (block) =>
      [...block.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, prelude, body]) => ({
        selectors: (prelude ?? '').split(',').map((part) => part.trim()),
        properties: [...(body ?? '').matchAll(/([\w-]+)\s*:/g)].map(
          ([, property]) => property ?? '',
        ),
      })),
  );
}

/**
 * Each declaration inside an `@media (forced-colors: active)` block whose
 * value is not one system colour keyword, as `property: value`.
 */
function nonSystemColours(css: string): string[] {
  const findings: string[] = [];

  for (const block of forcedColourBlocks(css)) {
    for (const [, property, value] of block.matchAll(
      /([\w-]+)\s*:\s*([^;{}]+?)\s*(?:;|\})/g,
    )) {
      if (!systemColours.has(value ?? '')) {
        findings.push(`${property ?? ''}: ${value ?? ''}`);
      }
    }
  }

  return findings;
}

describe('ngx-yeti/ngx-yeti-globals.css', () => {
  // The Firefox scale workaround writes --_yeti-t and nothing else of Yeti's
  // (the departures table of the ngx-yeti-specs skill, user ruling 2026-10-04).
  it('keeps every rule inside @layer ngx-yeti, reads no --_yeti-* token, writes only --_yeti-t, and names no package class', () => {
    expect(inspect(readPackageFile('ngx-yeti-globals.css'))).toStrictEqual({
      outsideLayer: [],
      privateReads: [],
      privateWrites: ['--_yeti-t'],
      classSelectors: [],
    });
  });

  it('sets only system colour keywords in its forced-colours rules', () => {
    const css = readPackageFile('ngx-yeti-globals.css');

    expect(css).toMatch(/@media \(forced-colors: active\)/);
    expect(nonSystemColours(css)).toStrictEqual([]);
  });

  // A11Y-1a (button.md:241): the pressed toggle and the checked toggle label,
  // on Yeti's state hooks only, drawn with a border and nothing else.
  it("draws A11Y-1a's pressed and checked states with a border alone", () => {
    expect(
      forcedColourRules(readPackageFile('ngx-yeti-globals.css')).filter(
        ({ selectors }) =>
          selectors.some(
            (selector) =>
              selector.includes('aria-pressed') ||
              selector.includes('input:checked'),
          ),
      ),
    ).toStrictEqual([
      {
        selectors: [
          ".button[aria-pressed='true']",
          '.button:has(> input:checked)',
        ],
        properties: [expect.stringMatching(/^border-/)],
      },
    ]);
  });

  it('reads the selectors and properties of each forced-colours rule', () => {
    expect(
      forcedColourRules(`
        /* .x { color: red; } */
        @media (forced-colors: active) {
          .a, .b > c { border-color: Canvas; outline-width: 2px; }
        }
        .d { color: blue; }
      `),
    ).toStrictEqual([
      {
        selectors: ['.a', '.b > c'],
        properties: ['border-color', 'outline-width'],
      },
    ]);
  });

  it('reports a forced-colours declaration that is not a system colour', () => {
    expect(
      nonSystemColours(`
        @media (forced-colors: active) {
          .a { border-color: Canvas; color: red; }
          .b { outline-color: var(--x) }
        }
        .c { color: blue; }
      `),
    ).toStrictEqual(['color: red', 'outline-color: var(--x)']);
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
      expect.arrayContaining(['ngx-yeti-globals.css']),
    );
    expect(packageJson).toHaveProperty(
      ['exports', './ngx-yeti-globals.css'],
      './ngx-yeti-globals.css',
    );
  });
});
