// @ts-check
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import native from 'nx/src/native';
import ts from 'typescript';

// A test that loads pages in a loop under a fixed budget passes only with
// headroom: its budget does not grow with the list it walks. The check reads
// only the syntax tree, so a helper that navigates in a loop on a caller's
// behalf is not seen.

const { WorkspaceContext } = native;
const root = new URL('../../', import.meta.url);
const fix =
  'give each visit its own budget: a test timeout scaled by the count with each visit in a test.step with its own timeout, or one test per entry';
const testNames = new Set(['test', 'it']);
const testModifiers = new Set(['only', 'fixme', 'fail', 'skip']);
const navigations = new Set([
  'goto',
  'reload',
  'goBack',
  'goForward',
  'setContent',
  'openStory',
  'axeViolations',
]);
const iterationMethods = new Set(['forEach', 'map', 'flatMap']);
const timeoutOwners = new Set(['test', 'testInfo', 'test.info()']);

/**
 * Whether `call` is a `test` or `it` call, or one of their modifiers.
 *
 * @param {ts.CallExpression} call
 */
function isTestCall(call) {
  const callee = call.expression;

  if (ts.isIdentifier(callee)) {
    return testNames.has(callee.text);
  }

  return (
    ts.isPropertyAccessExpression(callee) &&
    ts.isIdentifier(callee.expression) &&
    testNames.has(callee.expression.text) &&
    testModifiers.has(callee.name.text)
  );
}

/**
 * Whether `call` loads a page: a navigation method or helper, or a
 * screen-reader lane's `open`.
 *
 * @param {ts.CallExpression} call
 */
function isNavigation(call) {
  const callee = call.expression;

  if (ts.isIdentifier(callee)) {
    return navigations.has(callee.text);
  }

  if (!ts.isPropertyAccessExpression(callee)) {
    return false;
  }

  const name = callee.name.text;

  return (
    navigations.has(name) ||
    (name === 'open' &&
      ts.isIdentifier(callee.expression) &&
      callee.expression.text === 'lane')
  );
}

/**
 * Whether `node` holds a navigation call.
 *
 * @param {ts.Node} node
 * @returns {boolean}
 */
function navigates(node) {
  if (ts.isCallExpression(node) && isNavigation(node)) {
    return true;
  }

  return ts.forEachChild(node, navigates) ?? false;
}

/**
 * The text of every `X` that `node` reads as `X.length`.
 *
 * @param {ts.Node} node
 * @param {ts.SourceFile} source
 * @returns {string[]}
 */
function lengthsRead(node, source) {
  /** @type {string[]} */
  const lists = [];

  /** @param {ts.Node} child */
  const visit = (child) => {
    if (ts.isPropertyAccessExpression(child) && child.name.text === 'length') {
      lists.push(child.expression.getText(source));
    }

    ts.forEachChild(child, visit);
  };

  visit(node);

  return lists;
}

/**
 * The lists a loop walks, by their source text, and the body that runs once
 * per entry, or `undefined` when `node` is no loop.
 *
 * @param {ts.Node} node
 * @param {ts.SourceFile} source
 * @returns {{ lists: string[], body: ts.Node } | undefined}
 */
function loopOf(node, source) {
  if (ts.isForOfStatement(node) || ts.isForInStatement(node)) {
    return { lists: [node.expression.getText(source)], body: node.statement };
  }

  if (ts.isForStatement(node)) {
    return {
      lists: node.condition ? lengthsRead(node.condition, source) : [],
      body: node.statement,
    };
  }

  if (ts.isWhileStatement(node) || ts.isDoStatement(node)) {
    return {
      lists: lengthsRead(node.expression, source),
      body: node.statement,
    };
  }

  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    iterationMethods.has(node.expression.name.text)
  ) {
    const callback = node.arguments[0];

    if (
      callback &&
      (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))
    ) {
      return {
        lists: [node.expression.expression.getText(source)],
        body: callback.body,
      };
    }
  }

  return undefined;
}

/**
 * The lists whose `.length` a `setTimeout` call in `body` reads.
 *
 * @param {ts.Node} body
 * @param {ts.SourceFile} source
 */
function scaledLists(body, source) {
  /** @type {Set<string>} */
  const lists = new Set();

  /** @param {ts.Node} node */
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'setTimeout' &&
      timeoutOwners.has(node.expression.expression.getText(source))
    ) {
      for (const argument of node.arguments) {
        for (const list of lengthsRead(argument, source)) {
          lists.add(list);
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(body);

  return lists;
}

/**
 * Whether `value` is a literal that sets no step limit: Playwright reads `0`
 * as no timeout, and `undefined` or `null` as none set.
 *
 * @param {ts.Expression} value
 */
function isNoLimit(value) {
  return (
    (ts.isNumericLiteral(value) && Number(value.text) === 0) ||
    value.kind === ts.SyntaxKind.NullKeyword ||
    (ts.isIdentifier(value) && value.text === 'undefined')
  );
}

/**
 * Whether `call` is a `test.step` call whose options set a `timeout` that is
 * not a literal without a limit.
 *
 * @param {ts.CallExpression} call
 */
function isTimedStep(call) {
  const callee = call.expression;
  const options = call.arguments[2];

  return (
    ts.isPropertyAccessExpression(callee) &&
    ts.isIdentifier(callee.expression) &&
    callee.expression.text === 'test' &&
    callee.name.text === 'step' &&
    options !== undefined &&
    ts.isObjectLiteralExpression(options) &&
    options.properties.some(
      (property) =>
        (ts.isPropertyAssignment(property) &&
          ts.isIdentifier(property.name) &&
          property.name.text === 'timeout' &&
          !isNoLimit(property.initializer)) ||
        (ts.isShorthandPropertyAssignment(property) &&
          property.name.text === 'timeout'),
    )
  );
}

/**
 * Whether `node` holds a navigation call outside every `test.step` that sets
 * its own `timeout`.
 *
 * @param {ts.Node} node
 * @returns {boolean}
 */
function navigatesOutsideTimedStep(node) {
  if (ts.isCallExpression(node)) {
    if (isTimedStep(node)) {
      return false;
    }

    if (isNavigation(node)) {
      return true;
    }
  }

  return ts.forEachChild(node, navigatesOutsideTimedStep) ?? false;
}

/**
 * Whether a test body walks a list with page loads and either its timeout
 * does not read that list's length or a visit runs outside a `test.step`
 * with its own `timeout`.
 *
 * @param {ts.Node} body
 * @param {ts.SourceFile} source
 */
function hasFixedBudgetLoop(body, source) {
  const scaled = scaledLists(body, source);

  /**
   * @param {ts.Node} node
   * @returns {boolean}
   */
  const visit = (node) => {
    const loop = loopOf(node, source);

    if (
      loop &&
      navigates(loop.body) &&
      (!loop.lists.some((list) => scaled.has(list)) ||
        navigatesOutsideTimedStep(loop.body))
    ) {
      return true;
    }

    return ts.forEachChild(node, visit) ?? false;
  };

  return visit(body);
}

/**
 * The test calls in `text` and the lines of those that load pages in a loop
 * under a fixed budget.
 *
 * @param {string} text
 * @param {string} fileName
 */
function scan(text, fileName) {
  const source = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    true,
  );
  let tests = 0;
  /** @type {number[]} */
  const lines = [];

  /** @param {ts.Node} node */
  const visit = (node) => {
    if (ts.isCallExpression(node) && isTestCall(node)) {
      const callback = node.arguments.findLast(
        (argument) =>
          ts.isArrowFunction(argument) || ts.isFunctionExpression(argument),
      );

      if (callback) {
        tests += 1;

        if (hasFixedBudgetLoop(callback.body, source)) {
          lines.push(
            source.getLineAndCharacterOfPosition(node.getStart(source)).line +
              1,
          );
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(source);

  return { tests, lines };
}

/**
 * The source files under apps/ and packages/ of `directory`, listed by the Nx
 * walker that hashes the test target's inputs: it applies .gitignore and
 * .nxignore whether or not `directory` holds .git, and lists only files.
 *
 * @param {string} directory
 */
function sourceFiles(directory) {
  const cache = mkdtempSync(join(tmpdir(), 'navigation-budget-cache-'));

  try {
    return new WorkspaceContext(directory, cache)
      .glob(['{apps,packages}/**/*.{ts,mts,mjs,tsx}'])
      .filter((path) => existsSync(join(directory, path)));
  } finally {
    rmSync(cache, { recursive: true, force: true });
  }
}

/**
 * The `path:line` of every test under apps/ and packages/ of `directory` that
 * loads pages in a loop under a fixed budget, and the count of tests parsed.
 *
 * @param {string} directory
 */
function fixedBudgetLoops(directory) {
  let tests = 0;
  /** @type {string[]} */
  const found = [];

  for (const path of sourceFiles(directory)) {
    const result = scan(readFileSync(join(directory, path), 'utf8'), path);

    tests += result.tests;
    found.push(...result.lines.map((line) => `${path}:${line}`));
  }

  return { tests, found };
}

const checkout = fileURLToPath(root);
const files = sourceFiles(checkout);

test('lists the source files .gitignore leaves in, in a tree without .git', () => {
  const tree = mkdtempSync(join(tmpdir(), 'navigation-budget-'));

  try {
    for (const [path, text] of Object.entries({
      '.gitignore': '__screenshots__/\nignored.ts\n',
      'apps/app/src/plain.ts': '',
      'apps/app/src/ignored.ts': '',
      'apps/app/__screenshots__/x.spec.ts/shot.ts': '',
      'packages/lib/src/plain.mjs': '',
      'packages/lib/src/plain.mts': '',
      'packages/lib/src/plain.tsx': '',
      'packages/lib/.storybook/main.ts': '',
    })) {
      mkdirSync(dirname(join(tree, path)), { recursive: true });
      writeFileSync(join(tree, path), text);
    }

    const listed = sourceFiles(tree);

    assert.deepEqual(listed.toSorted(), [
      'apps/app/src/plain.ts',
      'packages/lib/.storybook/main.ts',
      'packages/lib/src/plain.mjs',
      'packages/lib/src/plain.mts',
      'packages/lib/src/plain.tsx',
    ]);
    assert.ok(listed.every((path) => statSync(join(tree, path)).isFile()));
  } finally {
    rmSync(tree, { recursive: true, force: true });
  }
});

test('reads a listed file whose name holds #, %2e%2e or %20', () => {
  const tree = mkdtempSync(join(tmpdir(), 'navigation-budget-'));
  const loop = `
test('every route', async ({ page }) => {
  for (const key of keys) {
    await page.goto(key);
  }
});
`;

  try {
    for (const path of [
      'apps/a/loop#x.spec.ts',
      'apps/a/%2e%2e/loop.spec.ts',
      'apps/a/loop%20x.spec.ts',
    ]) {
      mkdirSync(dirname(join(tree, path)), { recursive: true });
      writeFileSync(join(tree, path), loop);
    }

    const { found } = fixedBudgetLoops(tree);

    assert.ok(found.includes('apps/a/loop#x.spec.ts:2'), found.join(', '));
    assert.ok(found.includes('apps/a/%2e%2e/loop.spec.ts:2'), found.join(', '));
    assert.ok(found.includes('apps/a/loop%20x.spec.ts:2'), found.join(', '));
  } finally {
    rmSync(tree, { recursive: true, force: true });
  }
});

test('lists the tracked dot folder .storybook', () => {
  assert.ok(files.includes('packages/ngx-yeti/.storybook/main.ts'));
});

test('flags a test that loads pages in a loop under a fixed budget', () => {
  const text = `
test('every route', async ({ page }) => {
  for (const key of keys) {
    await page.goto(key);
  }
});
test('every story', async ({ page }) => {
  stories.forEach(async (id) => {
    await openStory(page, id);
  });
});
`;

  assert.deepEqual(scan(text, 'fixed.spec.ts'), { tests: 2, lines: [2, 7] });
});

test('passes a test whose timeout scales with the list it walks', () => {
  const text = `
test('every route', async ({ page }) => {
  const keys = registeredKeys();
  const perVisit = test.info().timeout;

  test.setTimeout(keys.length * perVisit);

  for (const key of keys) {
    await test.step(key, async () => {
      await page.goto(key);
    }, { timeout: perVisit });
  }
});
`;

  assert.deepEqual(scan(text, 'scaled.spec.ts'), { tests: 1, lines: [] });
});

test('flags a scaled loop whose visits have no step timeout of their own', () => {
  const text = `
test('every route', async ({ page }) => {
  const keys = registeredKeys();
  const perVisit = test.info().timeout;

  test.setTimeout(keys.length * perVisit);

  for (const key of keys) {
    await test.step(key, async () => {
      await page.goto(key);
    });
  }
});
test('every story', async ({ page }) => {
  test.setTimeout(stories.length * 30_000);

  for (const id of stories) {
    await openStory(page, id);
  }
});
`;

  assert.deepEqual(scan(text, 'unbounded.spec.ts'), {
    tests: 2,
    lines: [2, 14],
  });
});

test('flags a scaled loop whose step timeout sets no limit', () => {
  const text = ['0', 'undefined', 'null', 'perVisit']
    .map(
      (timeout) => `
test('every route', async ({ page }) => {
  test.setTimeout(keys.length * perVisit);

  for (const key of keys) {
    await test.step(key, async () => {
      await page.goto(key);
    }, { timeout: ${timeout} });
  }
});`,
    )
    .join('');

  assert.deepEqual(scan(text, 'unlimited.spec.ts'), {
    tests: 4,
    lines: [2, 11, 20],
  });
});

test('passes a loop that generates one test per entry', () => {
  const text = `
for (const key of keys) {
  test(key, async ({ page }) => {
    await page.goto(key);
  });
}
`;

  assert.deepEqual(scan(text, 'generated.spec.ts'), { tests: 1, lines: [] });
});

test('scans only regular files', () => {
  const notFiles = files.filter(
    (path) => !statSync(join(checkout, path)).isFile(),
  );

  assert.deepEqual(notFiles, []);
});

test('no test under apps/ or packages/ loads pages in a loop under a fixed budget', () => {
  const { tests, found } = fixedBudgetLoops(checkout);

  assert.notEqual(tests, 0, 'no test call parsed under apps/ or packages/');
  assert.deepEqual(found, [], `${found.join(', ')}: ${fix}`);
});
