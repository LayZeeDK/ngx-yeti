import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { transform } from 'lightningcss';
import type { Rule } from 'lightningcss';
import manifest from 'yeti-css/manifest';

const workspaceRoot = path.join(import.meta.dirname, '../../..');

// The `build` target writes it; `test` depends on `build`.
const builtPackage = path.join(workspaceRoot, 'dist/packages/ngx-yeti');

/**
 * Every selector of `ngx-yeti-globals.css` that names a Yeti class, one string
 * per comma-separated selector, under the id of the ledger row its rule
 * closes. A rule on a Yeti class changes its entry in the same commit.
 */
const sanctionedSelectors: Readonly<Record<string, readonly string[]>> = {
  'A11Y-1a': [".button[aria-pressed='true']", '.button:has(> input:checked)'],
  'A11Y-32': ['.spinner', ".button[aria-busy='true']::after"],
  'A11Y-33': [
    '.enter[data-once]:not([data-stagger])',
    '.enter[data-once][data-stagger] > *',
  ],
  'A11Y-35': ['[data-paint] :focus-visible'],
};

function ledgerRowIds(): ReadonlySet<string> {
  const ledger = readFileSync(
    path.join(workspaceRoot, 'docs/specs/ledger.md'),
    'utf8',
  );

  return new Set(
    [...ledger.matchAll(/^\| (A11Y-\w+) \|/gm)].flatMap(([, id]) =>
      id === undefined ? [] : [id],
    ),
  );
}

const yetiClasses = new Set(
  Object.values(manifest.components).map((component) => component.class),
);

const yetiClassInScript = String.raw`\.(?:${[...yetiClasses].map((name) => RegExp.escape(name)).join('|')})(?![\w-])`;

// Selector text with balanced parentheses, so `host.card) {` is no rule.
const selectorText = String.raw`(?:[^{};()]|\([^{};()]*\))*`;

// A class selector, bare or inside `:where()`, `:is()`, `:not()`, or `:has()`,
// followed by its rule's `{`, as CSS in a string would read.
const yetiSelectorInScript = new RegExp(
  String.raw`(?:${yetiClassInScript}|:(?:where|is|not|has)\(${selectorText}${yetiClassInScript}${selectorText}\))${selectorText}\{`,
  'g',
);

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

/** Yeti rules in a FESM bundle: an `@layer yeti` block or a Yeti class rule. */
function yetiRulesInScript(code: string): readonly string[] {
  return [
    ...(code.match(/@layer\s+yeti(?![\w-])/g) ?? []),
    ...(code.match(yetiSelectorInScript) ?? []),
  ];
}

function isPackageLayer(rule: Rule): boolean {
  return (
    rule.type === 'layer-block' && rule.value.name?.join('.') === 'ngx-yeti'
  );
}

/**
 * Yeti rules in a stylesheet: a `yeti` layer, or a selector of a Yeti class
 * that `isSanctioned` does not accept. A selector is passed to it as its
 * parsed form in JSON, with whether it sits inside `@layer ngx-yeti`.
 */
function yetiRulesInStylesheet(
  css: string,
  isSanctioned: (selector: string, inPackageLayer: boolean) => boolean = () =>
    false,
): readonly string[] {
  const found: string[] = [];
  let packageLayers = 0;

  transform({
    filename: 'shipped.css',
    code: Buffer.from(css),
    visitor: {
      Rule(rule) {
        if (rule.type === 'layer-block' && rule.value.name?.[0] === 'yeti') {
          found.push('@layer yeti');
        }

        if (rule.type === 'layer-statement') {
          for (const name of rule.value.names) {
            if (name[0] === 'yeti') {
              found.push('@layer yeti');
            }
          }
        }

        if (isPackageLayer(rule)) {
          packageLayers += 1;
        }
      },
      RuleExit(rule) {
        if (isPackageLayer(rule)) {
          packageLayers -= 1;
        }
      },
      Selector(selector) {
        const classes = classNames(selector).flatMap((name) =>
          yetiClasses.has(name) ? [`.${name}`] : [],
        );
        const sanctioned = isSanctioned(
          JSON.stringify(selector),
          packageLayers > 0,
        );

        if (classes.length > 0 && !sanctioned) {
          found.push(...classes);
        }
      },
    },
  });

  return found;
}

/** Each comma-separated selector of `selectors`, parsed, in JSON. */
function parsedSelectors(selectors: string): readonly string[] {
  const parsed: string[] = [];

  transform({
    filename: 'sanctioned.css',
    code: Buffer.from(`${selectors} {}`),
    visitor: {
      Selector(selector) {
        parsed.push(JSON.stringify(selector));
      },
    },
  });

  return parsed;
}

/**
 * Yeti rules in the global stylesheet: a Yeti class selector outside
 * `@layer ngx-yeti` or missing from `table`, a table entry that matches no
 * selector, and a table key that is not a row id of the ledger.
 */
function yetiRulesInGlobalStylesheet(
  css: string,
  table: Readonly<Record<string, readonly string[]>>,
  rowIds: ReadonlySet<string>,
): readonly string[] {
  const entries = Object.entries(table).flatMap(([id, selectors]) =>
    selectors.map((selector) => ({
      label: `${id}: ${selector}`,
      parsed: parsedSelectors(selector),
    })),
  );
  const sanctioned = new Set(entries.flatMap(({ parsed }) => parsed));
  const matched = new Set<string>();
  const found = yetiRulesInStylesheet(css, (selector, inPackageLayer) => {
    if (inPackageLayer && sanctioned.has(selector)) {
      matched.add(selector);

      return true;
    }

    return false;
  });

  return [
    ...found,
    ...entries
      .filter(
        ({ parsed }) => !parsed.every((selector) => matched.has(selector)),
      )
      .map(({ label }) => `${label} matches no selector`),
    ...Object.keys(table)
      .filter((id) => !rowIds.has(id))
      .map((id) => `${id} is not a row of the ledger`),
  ];
}

/**
 * Yeti rules in one shipped stylesheet. Only `ngx-yeti-globals.css` at the
 * package root may select Yeti's classes, inside `@layer ngx-yeti` and as
 * listed in `sanctionedSelectors`.
 */
function yetiRulesInShippedStylesheet(
  file: string,
  css: string,
): readonly string[] {
  return file === 'ngx-yeti-globals.css'
    ? yetiRulesInGlobalStylesheet(css, sanctionedSelectors, ledgerRowIds())
    : yetiRulesInStylesheet(css);
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

    expect(stylesheets.map(({ file }) => file)).toContain(
      'ngx-yeti-globals.css',
    );
    expect(
      stylesheets.flatMap(({ file, code }) =>
        yetiRulesInShippedStylesheet(file, code).map(
          (rule) => `${file}: ${rule}`,
        ),
      ),
    ).toStrictEqual([]);
  });

  it('lists only selectors of the global stylesheet under ledger row ids', () => {
    const rowIds = ledgerRowIds();

    expect(
      Object.keys(sanctionedSelectors).filter((id) => !rowIds.has(id)),
    ).toStrictEqual([]);
    expect(rowIds).not.toContain('A11Y-999');
  });

  describe('the global stylesheet check', () => {
    const table = {
      'A11Y-32': ['.spinner', ".button[aria-busy='true']::after"],
    };
    const rowIds = new Set(['A11Y-32']);
    const packageRule =
      "@layer ngx-yeti { @media (forced-colors: active) { .spinner, .button[aria-busy='true']::after { border-color: Canvas; } } }";

    it('accepts the sanctioned selectors inside @layer ngx-yeti', () => {
      expect(
        yetiRulesInGlobalStylesheet(packageRule, table, rowIds),
      ).toStrictEqual([]);
    });

    it('reports a Yeti rule pasted inside @layer ngx-yeti', () => {
      expect(
        yetiRulesInGlobalStylesheet(
          `${packageRule} @layer ngx-yeti { .card[data-raised] { color: red; } .spinner:hover { color: red; } }`,
          table,
          rowIds,
        ),
      ).toStrictEqual(['.card', '.spinner']);
    });

    it.for([':where', ':is', ':not', ':has'])(
      'reports a Yeti class nested in %s() inside @layer ngx-yeti',
      (pseudoClass) => {
        expect(
          yetiRulesInGlobalStylesheet(
            `${packageRule} @layer ngx-yeti { a${pseudoClass}(.card) { color: red; } }`,
            table,
            rowIds,
          ),
        ).toStrictEqual(['.card']);
      },
    );

    it('reports a sanctioned selector outside @layer ngx-yeti, and a Yeti layer', () => {
      expect(
        yetiRulesInGlobalStylesheet(
          `${packageRule} .spinner { border-color: Canvas; } @layer yeti { b { color: red; } }`,
          table,
          rowIds,
        ),
      ).toStrictEqual(['.spinner', '@layer yeti']);
    });

    it('matches a table entry that names no Yeti class, and reports it when the rule is gone', () => {
      const classless = { 'A11Y-35': ['[data-paint] :focus-visible'] };
      const ids = new Set(['A11Y-35']);

      expect(
        yetiRulesInGlobalStylesheet(
          '@layer ngx-yeti { [data-paint] :focus-visible { outline-color: red; } }',
          classless,
          ids,
        ),
      ).toStrictEqual([]);
      expect(
        yetiRulesInGlobalStylesheet(
          '@layer ngx-yeti { a { color: red; } }',
          classless,
          ids,
        ),
      ).toStrictEqual([
        'A11Y-35: [data-paint] :focus-visible matches no selector',
      ]);
    });

    it('reports a table entry that matches no selector', () => {
      expect(
        yetiRulesInGlobalStylesheet(
          '@layer ngx-yeti { @media (forced-colors: active) { .spinner { border-color: Canvas; } } }',
          table,
          rowIds,
        ),
      ).toStrictEqual([
        "A11Y-32: .button[aria-busy='true']::after matches no selector",
      ]);
    });

    it('reports a table key that is not a row of the ledger', () => {
      expect(
        yetiRulesInGlobalStylesheet(
          packageRule,
          { 'A11Y-999': table['A11Y-32'] },
          rowIds,
        ),
      ).toStrictEqual(['A11Y-999 is not a row of the ledger']);
    });

    it('applies only to the global stylesheet', () => {
      expect(
        yetiRulesInShippedStylesheet('other.css', packageRule),
      ).toStrictEqual(['.spinner', '.button']);
    });
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

  it('reports a Yeti class rule in a bundle with a parenthesised part or inside a pseudo-class', () => {
    expect(
      yetiRulesInScript(
        "const styles = ['.card:not([x]) { color: red; } :where(.card) { color: red; }'];",
      ),
    ).toStrictEqual(['.card:not([x]) {', ':where(.card) {']);
    expect(
      yetiRulesInScript('if (isCard(host.card)) { host.card.lift(); }'),
    ).toStrictEqual([]);
  });
});
