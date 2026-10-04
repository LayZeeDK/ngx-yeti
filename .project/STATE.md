---
pipeline: gsd-path/v2
project: ngx-yeti
milestone: walking-skeleton
phase: define
                    # inspect only for brownfield; greenfield starts at define
                    # roadmap only in program flow (CHARTER.md exists)
status: active
branch: gsd-path/M001
                    # the router rebinds before any next-milestone file change
                    # the bound branch is never main; ship integrates it there
archive: null       # persisted archive transaction path; never recomputed
integration_default: direct # direct | pull-request; project setting
integration: direct # current milestone; may override the default before build
integration_source: default # default | milestone; preserves override provenance
---

# Project State

One file, always current. The router reads this first; every phase updates
it on completion. If this file and the artifacts disagree, the artifacts win
— fix this file.

## Log

<!-- append one line per transition: date, phase, event -->
- 2026-10-04 — inspect — project initialized
- 2026-10-04 — inspect — router bound initial milestone
- 2026-10-04 — inspect — inspection artifacts passed
- 2026-10-04 — define — definition started
- 2026-10-04 — define — program charter approved
- 2026-10-04 — research — research started
- 2026-10-04 — research — research complete: .project/research/RESEARCH.md; dispatched stack, pitfalls; skipped domain, similar; 3 questions
- 2026-10-04 — decide — decision synthesis started
- 2026-10-04 — decide — synthesis validated: .project/SYNTHESIS.md (7 decisions, 27 settled, no NEEDS-USER)
- 2026-10-04 — roadmap — roadmap started
- 2026-10-04 — roadmap — program roadmap approved
- 2026-10-04 — define — definition started
- 2026-10-04 — define — program roadmap re-slice approved
