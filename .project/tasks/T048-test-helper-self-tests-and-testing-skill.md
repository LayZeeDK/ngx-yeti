---
id: T048
title: Prove the html and Playwright test helpers can fail, and bring the testing skill up to date
wave: 4
deps: [T024, T049]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - packages/ngx-yeti-testing/src/lib/html.spec.ts
  - apps/yeti-app-e2e/src/playwright-helpers.spec.ts
  - .claude/skills/ngx-yeti-testing/SKILL.md
---

# T048 — Prove the html and Playwright test helpers can fail, and bring the testing skill up to date

## Context

Third build repair, review round 1 of M002 (range f35b35f..1747fe0, triaged by the orchestrator on 2026-10-12). The triage and reviewer files are git-ignored local records, so every finding is inlined. Line numbers are at 1747fe0; T041 and T024 edit `.claude/skills/ngx-yeti-testing/SKILL.md` before this task (T041 the NVDA lane line, T024 the Tailwind configurations), so its lines will have moved.

Findings, verbatim:

- Minor (g2 test analyzer): "packages/ngx-yeti-testing/src/lib/html.ts:77. html.spec.ts never exercises the path where `attributeValue` throws, for example on `<td>` outside a table or a tag after leading text. That throw is what stops every layer-3 `toBeNull()` absence check from passing on a mis-sliced tag." Code: `if (parsed === undefined) { throw new Error(`Not an opening tag the HTML parser keeps: ${tag}`); }`.
- Minor (g2 test analyzer): "packages/ngx-yeti-testing/src/playwright.ts:68 and :97. `expectItemSheetsApplied` and `horizontalOverflow` have no self-test that shows they can fail, unlike `item-links.browser.spec.ts` for the browser helpers. `horizontalOverflow` is the only oracle for every 1.4.10 reflow assertion."
- Triage item 17, cosmetic (g4 code reviewer): "a new shared e2e helper is missing from the testing skill's helper table ... .claude/skills/ngx-yeti-testing/SKILL.md:80-87 (the `support/` helper table) ... apps/yeti-app-e2e/src/support/style-probe.ts:151 adds `export async function recordPaintedAttributes(`, used by 7 specs (stack, columns, sidebar, cluster, layer, grid, static-attributes). The table lists `recordFrames`, `recordStyleMutations`, `recordHostAttributes`, `itemLinks`, `delayCss`, `recordItemRequests`, `expectStyledFrames`, `firstPaintFramesRecordedAs` and `productionFramesRecordedAs`, but not this one."
- Triage item 17, cosmetic (g4 code reviewer): ".claude/skills/ngx-yeti-testing/SKILL.md:131 ... ci.yml runs 'as parallel jobs: `static`, `package`, `unit`, and an `e2e` matrix'. The same diff adds the `voiceover` and `nvda` jobs to ci.yml, beside the existing `safari` job. The Gates paragraph's list of ci.yml jobs leaves out three jobs, two of them added in this range."
- Cosmetic (g3 code reviewer, full): ".claude/skills/ngx-yeti-testing/SKILL.md:68 says the `axeViolations` fixture 'in Firefox with JavaScript off ... skips the test'. apps/yeti-app-e2e/src/support/fixtures.ts:64-68 runs `axeViolationsOfSnapshot` there instead."

## Approach

- `html.spec.ts`: cases where `attributeValue` throws, at least a `<td>` tag passed alone (the parser drops it outside a table) and a tag after leading text, each asserting the error message names the tag.
- `apps/yeti-app-e2e/src/playwright-helpers.spec.ts`: self-tests of `horizontalOverflow` and `expectItemSheetsApplied` from `@ngx-yeti/testing/playwright`, on pages the test builds itself (`page.setContent`, routes it fulfils), not on a Fixture route. `horizontalOverflow` returns a positive number for content wider than a 320 px viewport and 0 for content that fits. `expectItemSheetsApplied` passes when each named item has one link with a sheet holding a rule, and rejects when an item's link is missing and when its sheet has no rules (use a short timeout so the rejecting cases stay fast). Use the helpers as exported; do not copy them. This spec runs in every engine and configuration of the `e2e` job like the other yeti-app-e2e specs, so keep it independent of the Fixture build configuration.
- Testing skill: add `recordPaintedAttributes` to the `support/` helper table with what it records and when a spec uses it (read `apps/yeti-app-e2e/src/support/style-probe.ts`), list every `ci.yml` job in the Gates paragraph as the workflow has them at this task's base, and correct the `axeViolations` row to what `fixtures.ts` does in Firefox with JavaScript off. Keep T041's NVDA lane wording and T024's Tailwind rows as they land.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- Playwright helpers (T036): the entry `@ngx-yeti/testing/playwright` (`packages/ngx-yeti-testing/src/playwright.ts`, mapped in tsconfig.base.json) is for the two e2e apps and exports `interface Box { readonly top: number; readonly right: number; readonly bottom: number; readonly left: number; readonly width: number; readonly height: number }`; `rect(locator: Locator): Promise<Box>`; `childRects(parent: Locator): Promise<Box[]>`, the boxes of the element's children in DOM order; `usedLength(scope: Locator, length: string, axis?: 'inline' | 'block'): Promise<number>`, the used px size of a CSS length such as `var(--yeti-width-md)`, read from a probe appended to `scope`, on the inline axis unless `axis` says otherwise; `horizontalOverflow(page: Page): Promise<number>`, how far the document is wider than the viewport; `resize(element: Locator, width: number): Promise<void>`, which sets the element's inline size in px and throws when it is not an HTMLElement; and `expectItemSheetsApplied(page: Page, items: readonly string[]): Promise<void>`, which expects one item link per named item in the head and waits until each has a stylesheet with at least one rule. No e2e spec declares a copy of these, and no other helper checks that an item sheet has loaded.

## Intent coverage

- None

## Acceptance criteria

1. `packages/ngx-yeti-testing/src/lib/html.spec.ts` has cases for both throw paths of `attributeValue`, and `npm exec nx -- test ngx-yeti-testing` passes.
2. `apps/yeti-app-e2e/src/playwright-helpers.spec.ts` shows `horizontalOverflow` positive and zero, and `expectItemSheetsApplied` passing and rejecting for a missing link and an empty sheet, in Chromium locally and in the Firefox and WebKit containers.
3. The testing skill's helper table lists `recordPaintedAttributes`, its Gates paragraph lists every `ci.yml` job, and its `axeViolations` row matches `fixtures.ts`.
4. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at each task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f apps/yeti-app-e2e/src/playwright-helpers.spec.ts && rg -q -F "recordPaintedAttributes" .claude/skills/ngx-yeti-testing/SKILL.md && npm exec nx -- run-many -t lint typecheck -p ngx-yeti-testing yeti-app-e2e && npm exec nx -- test ngx-yeti-testing && npm exec nx -- e2e yeti-app-e2e -- playwright-helpers.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=firefox playwright-helpers.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=webkit playwright-helpers.spec.ts && npx prettier --check .claude/skills/ngx-yeti-testing; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-12 — created by planner (build repair #3, review round 1 fixes; the g2 helper self-test minors, triage item 17's two testing-skill lines, and the g3 full re-run's testing-skill cosmetic). At 1747fe0 the self-test file does not exist and the skill does not name `recordPaintedAttributes`, so the Verify fails if this task is skipped. deps: T024 (file overlap, `.claude/skills/ngx-yeti-testing/SKILL.md`; T024 already follows T041, which edits the same file). The Verify ends by stopping the Nx daemon and keeps its own exit code; run it exactly as written and never set NX_DAEMON.
- 2026-10-12 — planner (build repair #3, the user's ruling to rename the package stylesheet, T049): deps gains T049 for file overlap (.claude/skills/ngx-yeti-testing/SKILL.md). Nothing else changes.
