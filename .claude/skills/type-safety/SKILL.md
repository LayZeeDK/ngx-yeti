---
name: type-safety
description: "Type safety patterns for this Angular workspace and the approved alternatives to banned constructs. Use this skill whenever writing or modifying TypeScript, Angular templates, Vitest specs, or Storybook stories in this repo, especially when encountering ESLint or typecheck errors for: `as` type assertions (assertionStyle: 'never'), `any` or `fixture.nativeElement` (no-unsafe-*), non-null assertions (`!`) in code or templates, `$any()`, test hooks (beforeEach/afterEach), `expect.assertions`, describe titles, consistent-type-imports, explicit return types, angular-eslint `all` rules (prefer-signals, prefer-inject, prefer-service-decorator, prefer-output-readonly), or NG8102/NG8107 template diagnostics. Covers: `satisfies` vs type annotations, SIFERS `setup()` with TestBed instead of hooks, `assert.instanceOf`/`assert.exists` narrowing, signal input/output bindings in tests, cast-free mocks with `vi.fn<T>()`/`vi.spyOn`/`vi.mocked()`, type guards for `unknown`, and typed Storybook `Meta<Component>` stories with awaited `play` assertions."
---

# Type safety patterns

## Overview

This workspace enforces type safety through ESLint and the TypeScript and Angular compilers. Every `as` cast, `any` value, non-null assertion, and test hook produces a lint error that fails `nx lint`. This skill lists the approved alternatives so code passes on the first attempt.

Lint and typecheck catch different things. Run both. `nx test` compiles with Analog `fastCompile` and never type-checks (see `references/fast-compile.md`).

**Enforced in `eslint.config.mjs` for TypeScript files:**

- `tseslint.configs.strictTypeChecked` and `stylisticTypeChecked`. These include `no-explicit-any`, `no-non-null-assertion`, `no-unsafe-*`, `no-floating-promises`, and `no-unnecessary-type-assertion`.
- `consistent-type-assertions` with `assertionStyle: 'never'`. Every `as` is banned except `as const`.
- `non-nullable-type-assertion-style` is off. Its fix writes `x!`, which `no-non-null-assertion` bans.
- `consistent-type-imports` with inline style: `import { type Foo }` or `import type { Foo }`.
- `consistent-type-exports`, `consistent-type-definitions: interface`.
- `explicit-function-return-type` with `allowExpressions`, `allowTypedFunctionExpressions`, and `allowHigherOrderFunctions`. Specs are exempt.
- `@eslint-community/eslint-comments/require-description`. Every `eslint-disable` comment needs a `-- reason`.
- `angularConfig`: angular-eslint `tsAll` and `templateAll` with a few rules turned off. See [rules/angular-components.md](rules/angular-components.md).
- `vitestConfig` for `**/*.spec.ts` in the Vitest projects only (`ngx-yeti`, `ngx-yeti-testing`, `yeti-app`, `yeti-analog`). It enables `vitest.configs.recommended`, about 40 more vitest rules at error, and `vitest/no-hooks`. The Playwright e2e projects do not spread it.
- Storybook `flat/recommended` and `flat/csf-strict` for stories.

**Enforced in `tsconfig.base.json`:**

- `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `noImplicitOverride`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`.
- `strictTemplates`, `strictInputAccessModifiers`, `typeCheckHostBindings`, and every extended diagnostic at error. `nx typecheck` reports these. `nx test` does not.

## Spec file requirements

Specs in this repo test Angular code through TestBed. Follow all of these:

1. **No hooks.** `setupTestBed()` from `@analogjs/vitest-angular` (and the `@angular/build:unit-test` runner in `yeti-app`) already resets TestBed and destroys fixtures around every test. Put per-test setup in a `setup()` function. See [rules/sifers-pattern.md](rules/sifers-pattern.md).
2. **`describe(TheClass, ...)`.** `prefer-describe-function-title` requires the class, not the string `'TheClass'`.
3. **`expect.assertions(n)` as the first statement of every `async` test.** `prefer-expect-assertions` enforces this. Synchronous tests do not need it.
4. **Lowercase test titles** that state behavior: `it('renders the title', ...)`.
5. **Annotate `fixture.nativeElement` as `unknown`, then narrow it with `assert.instanceOf`.** `assert` is a Vitest global (chai).

```typescript
import { TestBed } from '@angular/core/testing';
import { App } from './app';

async function setup() {
  const fixture = TestBed.createComponent(App);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);

  return { element, fixture };
}

describe(App, () => {
  it('renders the title', async () => {
    expect.assertions(1);

    const { element } = await setup();

    expect(element.querySelector('h1')?.textContent).toContain('Welcome yeti-app');
  });
});
```

## Rule index

| Rule file                                            | What it teaches                                                 | When to use                                         |
| ---------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| [sifers-pattern.md](rules/sifers-pattern.md)         | `setup()` with TestBed, bindings, and zoneless change detection | Writing any `*.spec.ts`                             |
| [typed-mocks.md](rules/typed-mocks.md)               | Narrowing with `assert`, typed spies and providers, type guards | Mocking, DOM queries, narrowing `unknown`           |
| [satisfies-patterns.md](rules/satisfies-patterns.md) | `satisfies` vs type annotation vs `as const satisfies`          | Config objects, lookup tables, provider stubs       |
| [angular-components.md](rules/angular-components.md) | What angular-eslint `all` and strict templates demand           | Writing components, directives, services, templates |
| [storybook-stories.md](rules/storybook-stories.md)   | `Meta<Component>`, typed args, awaited `play` assertions        | Writing `*.stories.ts`                              |

## Quick reference: banned pattern and approved alternative

| Banned pattern                                      | Reported by                                         | Approved alternative                                              |
| --------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| `value as Type`, `value as unknown as Type`         | `consistent-type-assertions`                        | Type guard, `assert.instanceOf`, `satisfies`, restructure         |
| `const el = fixture.nativeElement`                  | `no-unsafe-assignment`                              | `const el: unknown = fixture.nativeElement` + `assert.instanceOf` |
| `value!`                                            | `no-non-null-assertion`                             | `?.`, an `undefined` guard, `assert.exists(value)`                |
| `any`                                               | `no-explicit-any`                                   | `unknown` + type guard, generic `<T>`                             |
| `$any(x)` or `x!` in a template                     | `template/no-any`, `template/no-non-null-assertion` | `@if (x(); as value)`                                             |
| `x?.y` or `x ?? d` on a non-nullable template value | NG8107, NG8102 (`nx typecheck`)                     | Drop the operator                                                 |
| `type Foo = { ... }`                                | `consistent-type-definitions`                       | `interface Foo { ... }`                                           |
| `import { Foo }` used only as a type                | `consistent-type-imports`                           | `import { type Foo }` or `import type { Foo }`                    |
| `obj.prop` on an index signature                    | `noPropertyAccessFromIndexSignature`                | `obj['prop']`                                                     |
| `arr[i]` used directly                              | `noUncheckedIndexedAccess`                          | Destructure + `assert.exists`, or an `undefined` guard            |
| `beforeEach(() => { ... })`                         | `vitest/no-hooks`                                   | `setup()` function                                                |
| `describe('App', ...)`                              | `vitest/prefer-describe-function-title`             | `describe(App, ...)`                                              |
| An un-awaited `expect(...)` in a story `play`       | `no-floating-promises`                              | `await expect(...)`                                               |
| `// eslint-disable-next-line rule`                  | `eslint-comments/require-description`               | Fix the violation; if truly needed, add `-- reason`               |

## Files demonstrating the patterns

- `packages/ngx-yeti/card/src/card.spec.ts` shows a directive test with `inputBinding`, a signal-driven change, and `assert.instanceOf`.
- `apps/yeti-app/src/app/app.spec.ts` shows the minimal component `setup()`.
- `packages/ngx-yeti/card/src/card.stories.ts` shows `Meta<Directive>` with awaited `play` assertions.
- `packages/ngx-yeti/vite.lib.config.mts` shows an `isRecord` type guard on parsed JSON.
- `packages/ngx-yeti/.storybook/main.ts` shows an `unknown` type guard over Vite plugins.
