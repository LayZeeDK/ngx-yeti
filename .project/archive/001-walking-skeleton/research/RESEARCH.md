# Research Handoff

<!-- Written by the research orchestrator and consumed by decide. -->

Phase: research
Status: complete
Intent: `.project/CHARTER.md`

## Dispatch

<!-- Include every standard dimension exactly once. A custom dimension may
     supplement these rows, never replace a standard row. -->
- `domain` — skipped → none — no CHARTER RESEARCH question concerns domain rules or terminology; `docs/specs/` (CONTEXT.md glossary, 93 resolved tickets, research/) already settles the domain, and the charter binds it.
- `stack` — dispatched → `.project/research/evidence-stack.md` — two CHARTER RESEARCH questions are stack questions: the `@angular/cdk` / `@angular/aria` versions for Angular 22.2.1 with the status of upstream bugs A5, A6, A9, and what Analog SSR/SSG/prerendering needs for the `apps/yeti-analog` demonstration.
- `pitfalls` — dispatched → `.project/research/evidence-pitfalls.md` — one CHARTER RESEARCH question is a reliability failure mode already present in the mapped codebase: npm 11 `allow-scripts` withholding install scripts.
- `similar` — skipped → none — no CHARTER RESEARCH question asks about comparable products; the specs bundle's research and building-blocks map already record prior art (Angular Aria, CDK, Material), and the charter fixes the product shape.

## Question assignments

- `[RESEARCH] Which @angular/cdk and @angular/aria versions match Angular 22.2.1, and do upstream bugs A5, A6, A9 (docs/specs/upstream-bugs.md:40-44) still reproduce at those versions?` → `stack`
- `[RESEARCH] How far apps/yeti-analog demonstrates the package: which items or rendering modes per milestone, and what Analog's SSG/prerender support needs from ngx-yeti.` → `stack`
- `[RESEARCH] Whether npm 11 allow-scripts withholding nx, esbuild, and msgpackr-extract install scripts breaks build, Storybook, or Playwright paths, and whether approvals should be committed.` → `pitfalls`
