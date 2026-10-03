<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# fastCompile and typecheck

Targets that compile with Analog `fastCompile` never type-check. A green `test`, `build-fast`, Storybook `-c fast` target, or `yeti-analog` build says nothing about types or templates. Run `nx typecheck` beside them. `npm run check` and `npm run affected` do both.

Run `nx typecheck-watch <project>` beside `serve` or `storybook` for type feedback while you work. To check one tsconfig, add `-c src`, `-c spec`, or `-c stories` to `nx typecheck`.

Read `references/fast-compile.md` before you change a Vite, Vitest, or Storybook config, add an Angular project, or move a target onto or off `fastCompile`.

# Commits

Write every commit message in [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format: `type(scope): subject`. Use the types in the git history, such as `build`, `refactor`, `docs`, `feat`, `fix`, and `test`. Use the Nx project or the tool as the scope, such as `ngx-yeti`, `eslint`, or `nx`.

Make each commit atomic. It holds one logical change, and a reviewer can revert it alone.

Make each commit bisect-safe. `npx prettier --check .` and `npm exec nx -- run-many -t lint typecheck test` pass at every commit, not only at the tip. If a change needs code fixes before a stricter rule can land, commit the fixes first.
