---
name: eslint-conflict-audit
description: >
  Detect conflicts between ESLint rules that are already enabled in the project's
  flat config. Use when two active rules demand opposite code patterns, cause
  circular auto-fix loops, or make each other redundant. Audit for mutually
  exclusive rule pairs inherited from broad presets like angular-eslint `tsAll`
  / `templateAll`, `strict`, or `stylistic`. Use this skill when: eslint errors
  cannot all be fixed because rules contradict each other, CI keeps failing
  because two rules want different things, `eslint --fix` oscillates or never
  converges, fixing one lint error produces another, specific rule names seem
  to conflict (e.g. prefer-to-be-truthy vs prefer-strict-boolean-matchers,
  unbound-method vs prefer-vi-mocked, prefer-style-binding vs no-inline-styles),
  or import ordering rules fight each other.
---

# Skill: ESLint conflict audit

## Prompt

Read the project's ESLint flat config files and produce a conflict report. A conflict is any pair of enabled rules where both being active causes incorrect, circular, or destructive behavior, or where one rule's fix creates the other's violation.

### This workspace

- The root `eslint.config.mjs` exports `default`, `angularConfig` (angular-eslint `tsAll` and `templateAll`), and `vitestConfig` (Vitest specs only).
- `packages/ngx-yeti`, `apps/yeti-app`, and `apps/yeti-analog` spread all three. `apps/yeti-app-e2e` and `apps/yeti-analog-e2e` spread `default` and Playwright `flat/recommended`.
- Nx `flat/typescript` and `flat/javascript` append `eslint-config-prettier` when `prettier` and `eslint-config-prettier` are installed, so Prettier conflicts are handled even though no config names it.
- Rules already turned off because of a past audit carry a comment saying why. Do not report them again.

### Step 1: Extract the effective rule set

`eslint --print-config` is the primary method. Broad presets enable hundreds of rules, so tracing spreads by hand does not scale. Run it from each project's directory, because each project has its own config and `tsconfigRootDir`:

```bash
cd packages/ngx-yeti
npx eslint --print-config card/src/card.ts > ts.json
```

Sample one file of each kind, since each kind can match different config objects:

| Kind                         | Example                                                                  |
| ---------------------------- | ------------------------------------------------------------------------ |
| Component or directive `.ts` | `packages/ngx-yeti/card/src/card.ts`                                     |
| Template `.html`             | `apps/yeti-app/src/app/app.html` (the package has no component template) |
| Vitest spec                  | `packages/ngx-yeti/card/src/card.spec.ts`                                |
| Story                        | `packages/ngx-yeti/card/src/card.stories.ts`                             |
| Storybook config             | `packages/ngx-yeti/.storybook/main.ts`                                   |
| Vite or Vitest config `.mts` | `packages/ngx-yeti/vite.lib.config.mts`                                  |
| Playwright e2e spec          | `apps/yeti-app-e2e/src/card.spec.ts`                                     |
| `.mjs`                       | `eslint.config.mjs`                                                      |

A rule is active only if it appears in the `rules` object of the printed config with a severity other than `'off'` or `0`. Do not infer active rules from comments, git history, plugin documentation, or rule names. Filter each JSON file to its active rules and keep one list per kind. Only rules in these lists are candidates.

Read the config source as well, to know which spread or block contributes each rule. You need that to write the fix in the right place.

### Step 2: Identify conflicts

Compare every active rule against every other active rule within the same kind. Template files use the angular-eslint template parser, so `@angular-eslint/template/*` rules only conflict with each other, not with TypeScript rules.

**Type A: mutually exclusive or one-way fix.** Two rules demand opposite code patterns, or one rule's fix creates a violation of the other.

Look for:

- `prefer-X` vs `no-X`, `require-X` vs `no-X`.
- `prefer-X` vs `prefer-Y` where X and Y are alternative spellings of the same thing (`prefer-to-be-truthy` vs `prefer-strict-boolean-matchers`, `prefer-called-once` vs `prefer-called-times`).
- A rule whose fix or recommended rewrite the other rule bans. Example: `vitest/prefer-vi-mocked` rewrites to `vi.mocked(obj.method)`, which `@typescript-eslint/unbound-method` reports. Example: `template/prefer-style-binding` recommends `[style.x]`, which `template/no-inline-styles` with `allowBindToStyle: false` bans.
- Core rules beside their typescript-eslint extensions (`no-unused-vars`, `no-shadow`, `no-redeclare`).
- Formatting rules beside Prettier. Run `npx eslint-config-prettier <file>` from the project directory for each sampled file. It lists active rules that conflict with Prettier.

**Type B: circular auto-fix.** Rule A's `--fix` output violates rule B, and rule B's fix output violates rule A. `eslint --fix` never converges.

Check `rule.meta.fixable` for both rules. If both are fixable and target the same AST node or pattern, test it:

1. Write a minimal file that violates rule A **inside a project directory that a tsconfig includes** (for example `packages/ngx-yeti/src/zz-probe/probe.ts`). Type-aware rules fail on stdin and on files outside a tsconfig with "was not found by the project service".
2. Run `npx eslint <file> --fix --rule '{"rule-b": "off"}' -f json` from the project directory, then lint the output with rule B on.
3. Repeat in the other direction.
4. Delete the probe directory.

ESLint 9 removed the `unix` and `compact` formatters. Use `-f json` or the default `stylish`.

A conflict that is both Type A and Type B is Type B.

**Type C: superseded or dead.** A rule that adds nothing because another rule already reports every case it reports, or because it only checks syntax another rule bans.

Look for:

- A stricter rule whose reports are a superset (`no-non-null-assertion` over `no-extra-non-null-assertion` and `no-non-null-asserted-optional-chain`; `no-empty-function` over `@angular-eslint/no-empty-lifecycle-method`).
- A rule that only checks banned syntax (`template/use-track-by-function` only checks `*ngFor`, which `template/prefer-control-flow` bans).
- A deprecated rule beside its replacement (`no-empty-interface` beside `no-empty-object-type`). Check `rule.meta.deprecated`.

Before you recommend removing a Type C rule, check whether it is the only one of the pair with an autofix or the clearer message. If so, recommend keeping it and say why.

**Type D: config-level impossibility.** One rule's options make another rule impossible to satisfy. Example: `vitest/valid-title` without `allowArguments: true` beside `vitest/prefer-describe-function-title`.

### Step 3: Check broad presets

For each `all`, `strict`, or `stylistic` preset, diff it against the plugin's `recommended` preset in code:

```javascript
import angular from 'angular-eslint';

const rules = (configs) => new Set(configs.flatMap((config) => Object.keys(config.rules ?? {})));
const recommended = rules(angular.configs.tsRecommended);
const extra = [...rules(angular.configs.tsAll)].filter((rule) => !recommended.has(rule));
```

The rules in `extra` are where intentionally separated pairs hide. Check each one against the other active rules, and check whether the config already turns one side off.

### Step 4: Output the report

For each conflict found, output:

```
## [Type A/B/C/D] <conflict-name>

Rules: `<rule-1>` vs `<rule-2>`
Scope: <file kinds and projects where both are active>
Severity: <both severities>

**Problem**: <one sentence explaining what goes wrong>
**Evidence**: <the code that violates both, the fix sequence, or the probe output>
**Fix**: <the exact edit: file, config block, rule, and value>
```

The fix is not always "disable one side". It can be:

- Disable one rule, with the reason.
- Swap a rule for a plugin variant that understands the pattern (`@typescript-eslint/unbound-method` off and `vitest/unbound-method` on in `vitestConfig`).
- Change an option.
- Keep both, because the overlap is harmless and one rule supplies the only autofix or the clearer message.

Write the reason as a short comment beside the rule in the config, so the next audit skips it.

Use exactly one type label per finding. If a conflict fits several, choose by severity: B > A > D > C. Sort findings by type in that order, then alphabetically by rule name.

End with a summary:

```
## Summary

| Type | Count | Action needed |
|------|-------|---------------|
| B -- Circular fix | N | Must fix |
| A -- Mutually exclusive or one-way fix | N | Must fix |
| D -- Config impossibility | N | Must fix options |
| C -- Superseded or dead | N | Optional cleanup |
```
