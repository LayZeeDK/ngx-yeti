import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { transform } from 'lightningcss';
import type { MediaCondition, MediaQuery } from 'lightningcss';

const packageRoot = path.join(import.meta.dirname, '..');

/**
 * Every class name in a parsed selector, including those in the selector
 * lists that pseudo-classes such as `:where()` and `:has()` nest.
 */
function classNames(node: unknown): string[] {
  if (Array.isArray(node)) {
    return node.flatMap(classNames);
  }

  if (typeof node !== 'object' || node === null) {
    return [];
  }

  if (
    'type' in node &&
    node.type === 'class' &&
    'name' in node &&
    typeof node.name === 'string'
  ) {
    return [node.name];
  }

  return Object.values(node).flatMap(classNames);
}

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
        classSelectors.push(
          ...classNames(selector).filter((name) => name.startsWith('ngx-yeti')),
        );
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

function requiresForcedColours(condition: MediaCondition): boolean {
  switch (condition.type) {
    case 'feature': {
      const feature = condition.value;

      return (
        feature.type === 'plain' &&
        feature.name === 'forced-colors' &&
        feature.value.type === 'ident' &&
        feature.value.value === 'active'
      );
    }

    case 'operation': {
      return condition.conditions.some(requiresForcedColours);
    }

    default: {
      return false;
    }
  }
}

function isForcedColoursQuery(query: MediaQuery): boolean {
  return (
    query.qualifier !== 'not' &&
    query.condition !== null &&
    query.condition !== undefined &&
    requiresForcedColours(query.condition)
  );
}

/**
 * The contents of each `@media` block whose query asks for forced colours,
 * whatever its spelling or added conditions.
 */
function forcedColourBlocks(css: string): string[] {
  const lineStarts = [0];

  for (const match of css.matchAll(/\n/g)) {
    lineStarts.push(match.index + 1);
  }

  const openings: number[] = [];

  transform({
    filename: 'ngx-yeti-globals.css',
    code: Buffer.from(css),
    visitor: {
      Rule(rule) {
        if (
          rule.type === 'media' &&
          rule.value.query.mediaQueries.some(isForcedColoursQuery)
        ) {
          // Lines count from 0, columns from 1.
          const start =
            (lineStarts[rule.value.loc.line] ?? 0) + rule.value.loc.column - 1;
          openings.push(css.indexOf('{', start) + 1);
        }
      },
    },
  });

  return openings.map((opening) => {
    let depth = 1;
    let end = opening;

    while (depth > 0 && end < css.length) {
      depth += css[end] === '{' ? 1 : css[end] === '}' ? -1 : 0;
      end += 1;
    }

    return css.slice(opening, end - 1);
  });
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
 * Each declaration inside a forced-colours block whose value is not one
 * system colour keyword, as `property: value`.
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

/**
 * Each `[data-paint=...]` rule's paint value and the value of `property` it
 * sets, in the order the rules appear. `quote` is the quote the stylesheet
 * writes the attribute value in.
 */
function paintValues(
  css: string,
  property: string,
  quote: string,
): (string | undefined)[][] {
  const rule = new RegExp(
    String.raw`\[data-paint=${quote}([^${quote}]+)${quote}\]\s*\{[^}]*?(?<![-\w])${property}:\s*([^;}]+)`,
    'g',
  );

  return [...css.matchAll(rule)].map(([, paint, value]) => [
    paint,
    value?.trim(),
  ]);
}

/**
 * Yeti's rules that paint a fill of their own behind focusable contents, so
 * a ring inside them sits on that fill and not on a band around them. An
 * alert paints one at its default emphasis only.
 */
const yetiSurfaces = [
  '.card',
  '.nav',
  ".alert:not([data-emphasis='low'], [data-emphasis='high'])",
  '.accordion',
  '.accordion > details > summary',
  '.box[data-surface]',
  '.table > thead[data-sticky] th',
];

/** The browser's top-layer boxes, which paint the canvas colour. */
const browserSurfaces = ['dialog', '[popover]'];

/**
 * The selectors of the rule that gives a surface Yeti's ring colour back,
 * split at the commas outside a pseudo-class's parentheses, and none
 * without that rule.
 */
function inkResets(css: string): string[] {
  const reset =
    /:where\(([^{]*)\)\s*\{\s*--_ngx-yeti-band-ink: var\(--yeti-color-focus\);\s*\}/.exec(
      css,
    );

  if (reset === null) {
    return [];
  }

  return (reset[1] ?? '')
    .split(/,(?![^(]*\))/)
    .map((selector) => selector.trim());
}

/** Every stylesheet of Yeti's source. */
function yetiSource(): string {
  const source = path.join(packageRoot, '../../vendor/yeti/src');

  return readdirSync(source, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(path.join(source, file), 'utf8'))
    .join('\n');
}

/**
 * The selectors of Yeti's source a reset entry stands on, each with whether
 * it keeps its attribute values: the entry without its `:not()`, matched
 * with attribute values dropped, and each attribute value the entry names on
 * that selector, matched as Yeti writes it.
 */
function yetiSelectorsOf(
  entry: string,
): { readonly selector: string; readonly valued: boolean }[] {
  const base = entry.replaceAll(/:not\([^)]*\)/g, '');

  return [
    { selector: base, valued: false },
    ...[...entry.matchAll(/\[([\w-]+)='([^']*)'\]/g)].map(
      ([, name, value]) => ({
        selector: `${base}[${name ?? ''}="${value ?? ''}"]`,
        valued: true,
      }),
    ),
  ];
}

/** The reset entries' selectors that Yeti's source does not have. */
function missingFromYeti(entries: readonly string[], source: string): string[] {
  const valueless = source.replaceAll(/\[([\w-]+)=[^\]]*\]/g, '[$1]');

  return entries
    .flatMap(yetiSelectorsOf)
    .filter(
      ({ selector, valued }) =>
        !new RegExp(`${RegExp.escape(selector)}(?![\\w-])`).test(
          valued ? source : valueless,
        ),
    )
    .map(({ selector }) => selector);
}

describe('ngx-yeti/ngx-yeti-globals.css', () => {
  // The Firefox scale workaround writes --_yeti-t and nothing else of Yeti's
  // (ngx-yeti-specs, Departures).
  it('keeps every rule inside @layer ngx-yeti, reads no --_yeti-* token, writes only --_yeti-t, and names no package class', () => {
    expect(inspect(readPackageFile('ngx-yeti-globals.css'))).toStrictEqual({
      outsideLayer: [],
      privateReads: [],
      privateWrites: ['--_yeti-t'],
      classSelectors: [],
    });
  });

  // A11Y-35: the band-ink mapping copies Yeti's data-paint text colours, so a
  // moved pin that changes one of them fails here.
  it("gives each painted band the text colour Yeti's data-paint rule gives it, and draws only the ring's colour with it", () => {
    const yeti = readFileSync(
      path.join(packageRoot, '../../vendor/yeti/src/layouts/attributes.css'),
      'utf8',
    );
    const globals = readPackageFile('ngx-yeti-globals.css');
    const yetiInks = paintValues(yeti, 'color', '"');

    expect(yetiInks).toHaveLength(20);
    expect(paintValues(globals, '--_ngx-yeti-band-ink', "'")).toStrictEqual(
      yetiInks,
    );
    expect(globals).toMatch(
      /\[data-paint\] :focus-visible,\s*\[data-paint\] \.button:has\(> input:focus-visible\)\s*\{\s*outline-color: var\(--_ngx-yeti-band-ink\);\s*\}/,
    );
  });

  // A11Y-35: a surface inside a band gives its contents Yeti's ring again, so
  // the list of surfaces is pinned here and each Yeti one checked against
  // Yeti's source, so a moved pin that renames one, or an alert emphasis the
  // list names, fails.
  it("gives Yeti's ring colour back on the pinned surfaces that paint their own fill inside a band", () => {
    expect(inkResets(readPackageFile('ngx-yeti-globals.css'))).toStrictEqual([
      ...yetiSurfaces,
      ...browserSurfaces,
    ]);
    expect(missingFromYeti(yetiSurfaces, yetiSource())).toStrictEqual([]);
  });

  it('reads the selectors of the ink reset, and none without one', () => {
    expect(
      inkResets(
        "@layer ngx-yeti { :where(.card, .alert:not([data-emphasis='low'], [data-emphasis='high']), dialog) { --_ngx-yeti-band-ink: var(--yeti-color-focus); } }",
      ),
    ).toStrictEqual([
      '.card',
      ".alert:not([data-emphasis='low'], [data-emphasis='high'])",
      'dialog',
    ]);
    expect(inkResets('@layer ngx-yeti { a { color: red; } }')).toStrictEqual(
      [],
    );
  });

  it("reports a reset entry whose class or named attribute value is not in Yeti's source", () => {
    const source =
      '.alert { color: red; } .alert[data-emphasis="low"] { color: blue; } .box[data-surface="raised"] { color: green; }';
    const entry = ".alert:not([data-emphasis='low'], [data-emphasis='high'])";

    expect(
      missingFromYeti([entry, '.box[data-surface]'], source),
    ).toStrictEqual(['.alert[data-emphasis="high"]']);
    expect(
      missingFromYeti([entry], source.replaceAll('.alert', '.callout')),
    ).toStrictEqual([
      '.alert',
      '.alert[data-emphasis="low"]',
      '.alert[data-emphasis="high"]',
    ]);
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

  it('reports a non-system colour in a forced-colours query with another spelling and an added condition', () => {
    expect(
      nonSystemColours(`
        @MEDIA (Forced-Colors:active) and (prefers-contrast: more) {
          .a { border-color: Canvas; color: red; }
        }
        @media not (forced-colors: active) {
          .b { color: blue; }
        }
      `),
    ).toStrictEqual(['color: red']);
  });

  it.for([':where', ':is', ':not', ':has'])(
    'reports a package class nested in %s()',
    (pseudoClass) => {
      expect(
        inspect(
          `@layer ngx-yeti { a${pseudoClass}(.ngx-yeti-x) { color: red; } }`,
        ).classSelectors,
      ).toStrictEqual(['ngx-yeti-x']);
    },
  );

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
