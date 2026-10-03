# Audit 0001: the first wave (charting, five research tickets, one user decision)

Date: 2026-10-01
Auditor: compliance auditor (Sonnet 5.5); read-only except this file

## Scope

Everything under `.scratch/ngx-yeti-specs/` as committed at HEAD `b5adb42` ("resolve the Yeti styles and lazy loading research"). `git status --short .scratch/ngx-yeti-specs` printed nothing before the audit, so the working tree equals HEAD for the bundle (checked).

The wave is the 12 commits of `git log --oneline -- .scratch/ngx-yeti-specs`: `e116d9a` (chart the map), `367f475` (add ticket 15), `0bcba8e` (claim the research tickets), `62712ac` (the user's licence ruling, ADR 0001), `d30d469` (resolve ticket 14), `bad2487` (the readiness ruling), `74f72b2` (note on the llms.txt URLs), `e87455e` (resolve ticket 02), `5f4e834` (spec-list sources), `0caea08` (resolve ticket 03), `be46c2e` (resolve ticket 01), `b5adb42` (resolve ticket 04). 22 files: `map.md`, 15 tickets, `adr/0001-...`, 5 research files. Resolved: [Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md), [Research: inventory of Yeti's components, layouts, recipes, utilities, and contract](../issues/02-research-yeti-inventory.md), [Research: Yeti's JavaScript modules and what Angular adds](../issues/03-research-yeti-javascript-and-angular.md), [Research: Yeti's styling model, and loading component styles lazily](../issues/04-research-yeti-styles-and-lazy-loading.md), [Research: Foundation's `llms.txt` and `llms-full.txt` as sources for this map](../issues/14-research-foundationcss-llms-txt.md), and the user-decided [Decide: whether Yeti's licence and readiness allow this package](../issues/15-decide-yeti-licence-and-readiness.md). The other nine tickets are open.

Governing rules: the `/wayfinder` skill file (read directly; the Skill tool refuses it because it is user-invoked only), `/research`, `/domain-modeling` (with its `ADR-FORMAT.md`), `docs/agents/issue-tracker.md` (Wayfinding operations), and the map's own Notes. The report shape follows audit 0012 of the old bundle (`audits/0012-lazy-styles-research-wave.md`).

## Method

1. Process (script, then reading). `audit0001.mjs` (session scratchpad) parses every ticket for `Type:`, `Status:`, `Blocked by:`, `Labels:`, `Map:`, a numbered title, `## Question`, and `## Answer`; checks that `Labels:` equals `wayfinder:<Type>`, that every blocking edge names a real ticket, that the graph has no cycle, that no resolved ticket waits on an open one, and that each resolved ticket has exactly one Decisions-so-far line whose link text equals the ticket title and no open ticket has one. I then read the map end to end against the wayfinder rules (index not store, Not yet specified, Out of scope).
2. Research quality. I read all five research files in full. I spot-checked more than 45 citations against the Yeti clone (`github.com/foundation/yeti`, `f52d1e8b9`, read-only) and the Angular clones (`github.com/angular/angular` and `.../components`), listed under Verified OK. I recomputed counts that the files state (module lines, token groups, vocabulary rows, migration rows, the 19/27/14 split of the feature table).
3. User words. I collected every quotation attributed to the user in the map, tickets, ADR, and commit bodies, matched each against the other copies in the bundle by exact string (`rg -F` and the script's `includes`).
4. Hygiene. Banned words, AI attribution, non-ASCII, commit subjects and bodies, and a link check.

### Link check

Script: `audit0001.mjs`, run from the repository root as `node <scratchpad>/audit0001.mjs`. It resolves each `[text](target)` outside code spans and fences against its own file, and each `#anchor` against the target's headings. Output on the 22 committed files:

```
links checked: 59 in 22 file(s)
tickets: 10:grilling/open 11:grilling/open 12:grilling/open 13:grilling/open 14:research/resolved 15:grilling/resolved 01:research/resolved 02:research/resolved 03:research/resolved 04:research/resolved 05:task/open 06:grilling/open 07:grilling/open 08:grilling/open 09:grilling/open
gist lines: 6
gist 929 chars: - [Research: Angular 22's browser baseline against what Yeti expects](
gist 1253 chars: - [Research: Yeti's styling model, and loading component styles lazily
gist 338 chars: - [Decide: whether Yeti's licence and readiness allow this package](is
gist 701 chars: - [Research: Foundation's `llms.txt` and `llms-full.txt` as sources fo
gist 896 chars: - [Research: inventory of Yeti's components, layouts, recipes, utiliti
gist 1071 chars: - [Research: Yeti's JavaScript modules and what Angular adds](issues/0
map sections: Destination | Notes | Decisions so far | Not yet specified | Out of scope
quote "Readiness: We will spec and build agains..." in 2: ...\issues\12-decide-yeti-version-policy.md, ...\map.md
quote "I approve that FSL-1.1-MIT is compatible..." in 2: ...\adr\0001-yeti-licence-compatible-with-mit-package.md, ...\issues\15-decide-yeti-licence-and-readiness.md
quote "Compare Angular 22's browser baseline to..." in 2: ...\issues\01-research-browser-baseline-vs-yeti.md, ...\map.md
OK no problems
```

Exit 0. Control: a file with one resolving link and two broken ones (a missing file, a missing anchor) printed `PROBLEM` for both, `FAIL 2`, exit 1. The script ran on this audit file last (see the end of this file).

### Banned words and AI attribution

The pattern file `bw.txt` (session scratchpad, so the banned words do not appear in this report) holds two lines: the single-word list from the brief (with hyphen or space variants). Commit messages were written to `commits.txt` with `git log --format='%H%n%B%n----' -- .scratch/ngx-yeti-specs`.

| Command | Exit | Reading |
| --- | --- | --- |
| `rg -i -n -f bw.txt .scratch/ngx-yeti-specs` | 1 | no match in any file in scope |
| `rg -i -n -f bw.txt commits.txt` | 1 | no match in the 12 commit messages |
| `rg -i -n -f bw.txt ctl2.txt` (control: a file holding one banned word) | 0 | one hit, so the pattern works |
| `rg -i -n -f bw2.txt .scratch/ngx-yeti-specs` (spaced and punctuated variants of four banned terms, audit file excluded) | 1 | no match |
| `rg -i -n 'co-authored-by\|generated with\|claude code\|anthropic\|noreply' .scratch/ngx-yeti-specs commits.txt` | 1 | no attribution line |
| `rg -n -P '[^\x00-\x7F]' .scratch/ngx-yeti-specs -c` | 0 | 2 files: see L3 |
| `rg -n -P '[^\x00-\x7F]' commits.txt -c` | 1 | commit messages are ASCII |

I ran no identity search of any kind.

## Findings

Counts: High 0, Medium 7, Low 12.

### High

None. Nothing in the bundle presents agent text as a user quotation, no research claim lacks a source in a way that changes a decision, and no spot-checked citation is wrong in substance.

### Medium

**M1. The map's gists restate detail instead of pointing at it.**
File: `map.md`, Decisions so far (6 lines of 338, 701, 896, 929, 1,071, and 1,253 characters).
Rule: wayfinder, "The map is an index, not a store... the map never restates it, only gists it and links." Old audit 0012 allowed figures in gists but not mechanism lists.
Evidence: the ticket 04 line (1,253 characters) lists the four candidates, the five remaining constraints, and the two cross-file rules; the ticket 01 line lists six per-feature breakages with browser ranges; the ticket 03 line lists six Angular additions. All of that sits in the ticket Answers and research files too.
Fix: cut each gist to the decision-relevant sentence or two (counts and what the next ticket should take from it); leave the breakage and candidate lists in the Answers. Keep the entries as one block (a blank line sits between the first and second entries, which is a formatting slip).

**M2. The ticket 04 gist and Answer drop the scope limits and one unexplained result of the measurement they summarise.**
Files: `map.md` (ticket 04 line), `issues/04-...md` Answer, against `research/yeti-styles-and-lazy-loading.md` 3.2, 3.3, 7, 8.
Rule: research quality (state what was and was not shown); wayfinder (a gist enough to judge relevance, not a stronger claim than the findings).
Evidence: the gist says "measured in three engines, each of Yeti's 49 part files loads alone". The findings limit that to one light scheme at 1280 px, static markup with scripts stripped, each file's own example and fixture only, with tie order not checked for every pair of parts (3.2, 3.3, 8). Section 3.2 also says "an earlier run with a coarser attribution showed one LATE difference on the `demo` pages that the final run did not reproduce; I did not investigate it". The Answer says LATE changed nothing and omits that note. The gist also says "The first two [candidates] ask the consumer only to load the always-loaded group"; for the second (library-owned `<style>`) the findings say the Yeti build step "is not built" and the claim is "inferred to need no consumer plugin" (section 7).
Fix: add one clause to the gist and Answer ("static light-scheme pages only; one unexplained earlier difference on the demo pages"), and mark the library-owned `<style>` consumer claim as inferred.

**M3. Three different counts for `light-dark()`, and "checked" on claims the research labels inferred.**
Files: `map.md` (ticket 01 line), `research/browser-baseline-vs-yeti.md` 1, 4, 5.1, `research/yeti-styles-and-lazy-loading.md` 4.1, `issues/01-...md` Answer.
Rule: research quality (contradictions between files and with the map).
Evidence: `rg -o 'light-dark\('` (my run, exit 0): `src/tokens/color.css` 45, `src/tokens/surface.css` 2, `src/guides/color.md` 1, `src/guides/install.md` 1, `src/guides/theming.md` 2. So 47 uses in the two token files and 51 in five files, of which three files are prose. The baseline research says "45 uses in `src/tokens/color.css` and `surface.css`" (1, 4, 5.1, 9) and the styles research says `color.css` 45 and `surface.css` 2 (4.1). The map says "51 uses in 5 files, checked by the orchestrator". Separately, the map line says "Inferred, not run in a browser:" and then writes "(checked)" after the invoker-commands claim; the baseline research (6, 8) labels every breakage inferred. The claim is derived from browser-support data, which is checkable, but the label reads as a browser run.
Fix: state 47 uses in two files (or 45 plus 2) everywhere, drop the guide prose from the count, and write "per web-features data" in place of "(checked)" for the breakage claims.

**M4. Two Not yet specified items duplicate live tickets.**
File: `map.md`, Not yet specified: "Testing" and "Release policy".
Rule: wayfinder, "Not yet specified excludes... what's already a live ticket."
Evidence: "Testing: whether the old map's browser testing stack (ADR 0018)... carry over" is the same question as [Decide: which ADRs carry over](../issues/08-decide-inherited-adrs.md), which names "the browser testing stack (0018)". "Release policy: whether the old devkit version scheme (ADR 0045) fits" is named in ticket 08 ("the release policy (0045)") and in [Decide: which standing preferences and user rulings carry over](../issues/07-decide-inherited-preferences-and-rulings.md) ("the release policy"). "Theming and tokens" depends on ADRs 0039 and 0040, which ticket 08 also names, but it asks a new question about tokens, so it is correctly fog.
Fix: reword the two items to the part that is not covered (for example, the Yeti-specific test layers once ticket 08 decides 0018, and how the package versions against two upstreams), or fold them into the tickets.

**M5. The orchestrator's reading is recorded as part of the user-decision tickets, and the user-ruling heading carries a gloss.**
Files: `issues/15-decide-yeti-licence-and-readiness.md` Answer (second bullet) and Question (last paragraph), `issues/12-decide-yeti-version-policy.md` ("User ruling, 2026-10-01").
Rule: user words (nothing an agent wrote presented as the user's); wayfinder (a human decision stays the human's).
Evidence: ticket 15's Answer says "These specs name only Yeti's frozen surface, and writing specs is not building on `develop`." It labels the passage "the orchestrator's reading, not the user's words", which is honest, but it is a scoping decision made without the user: it narrows what the specs may cite. Ticket 12 then adopts it as a default ("The specs may name only frozen surface, unless this decision says otherwise"). The user's later ruling ("We will spec and build against a specific commit of `foundation/yeti`'s `develop` branch.") says nothing about frozen surface. In ticket 12, directly under the heading "User ruling, 2026-10-01" and after the quoted line, the sentence "So the specs target, and the package builds against, one pinned commit of `develop`, not a tag, a beta, or an npm release" is the orchestrator's gloss; "not a tag, a beta, or an npm release" is not in the user's words. Ticket 15's Question still says "Until this resolves, the specs are drafted as research under the risk, and the map's Destination does not count as reached", which is stale after the ruling.
Fix: move the frozen-surface sentence out of ticket 15's Answer into ticket 12's question as an open sub-question (ticket 12 point 4 already covers unfrozen surface), prefix the gloss in ticket 12 with "Orchestrator's reading:", and strike or date the stale sentence in ticket 15.

**M6. Statements about what the user said or confirmed have no verbatim source in the bundle.**
Files: `issues/11-decide-spec-list.md` ("which the user confirmed are the intended files"; the quoted "User instruction"), `map.md` (the inheritance blockquote, the "stop all work" quotation, "the user chose 'AFK, like the old map'"), `issues/14-...md` (Orchestrator note: "the user took the URLs from Yeti's install guide").
Rule: user words (every quote matches a quote elsewhere; nothing agent-written presented as the user's).
Evidence: of the quotations, these match a second copy: the readiness ruling (map and ticket 12), the licence ruling (ticket 15 and ADR 0001), "Compare Angular 22's browser baseline..." (map and ticket 01), and, by the orchestrator's check against the user's messages, the "19." instruction (ticket 14) and the feature list in ticket 01. These have exactly one copy and no corroboration I could read: the ticket 11 instruction ("Use the LLMs files, docs sitemap, and clone file/folder layout/structure to inform..."), the map's "Create a new map in..." blockquote beyond its last sentence, "After the current subagents have completed, stop all work on...", and "AFK, like the old map". Ticket 11's "which the user confirmed are the intended files" is a statement about the user with no quotation at all, and ticket 14's note says the URLs came from the install guide, whose rendered page names none (that note is checked by its own `curl`, it says).
Fix: for each, add the date and the verbatim reply where the orchestrator has it, or reword to "the orchestrator understood". For the "confirmed" claim, quote the confirmation.

**M7. Two research files prescribe or scope beyond "decide nothing".**
Files: `research/yeti-javascript-and-angular.md` 4.5 and 5; `research/foundationcss-llms-txt.md` 1 and 5.
Rule: ticket 03 and 14 ("Decide nothing"); `/research` (findings, not decisions); the brief (flag findings that decide something).
Evidence: 03, 4.5: "a wrapper should render those attributes rather than replace them with click handlers" (design direction for the dialog, dropdown, and nav specs; the same file labels the idea "inferred" there and "Hypothesis" in 8). 03, section 5 table: demo is "out of scope (inferred)", which is a spec-list call that [Decide: the spec list](../issues/11-decide-spec-list.md) owns. 14, section 1: "Recommend the map cite the `/yeti/` URLs, not the ones in the user's instruction" (the ticket asks for recommendations and names tickets, so this is allowed; it is listed because it sets aside the user's URLs, which the later orchestrator note resolves).
Fix: rewrite the two 03 sentences as options for tickets 09 and 11 ("a wrapper could..."), and keep the 14 recommendations as they are.

### Low

**L1. Off-by-two citation.** `research/yeti-inventory.md` section 1 cites `README.md:38` for "seventeen layout primitives, three recipes, twenty-two components, and seven utilities"; the sentence is at `README.md:36` (line 38 opens a code fence). Fix: `:36`.

**L2. Typo in a heading.** `research/yeti-inventory.md` section 2, "### utilitys (7)". Fix: "utilities".

**L3. Non-ASCII in committed files.** `research/browser-baseline-vs-yeti.md` has the less-than-or-equal sign (U+2264) in 15 rows of the copied feature table (Safari `<=4`); `research/foundationcss-llms-txt.md:14` has an em dash (U+2014) inside the quoted heading `# Foundation CSS - Full Documentation` (shown here with a hyphen). The em dash is part of a quoted file heading and is correct as written. The sign was "copied unchanged" from the script output. Fix: write `<=` in the table if the ASCII-only preference is applied to research files.

**L4. Bare ticket numbers where the wayfinder rules ask for names.** `issues/13-decide-style-loading.md` ("whether this requirement carries over (ticket 07)", "the browser target (ticket 06)"), `issues/05-task-carry-yeti-findings-from-old-map.md` ("tickets 01 to 04 and 12"), `issues/04-...md` ("tickets 182 to 198" of the old map, which is a range of another bundle), and the research headers ("Ticket: [01]", "[14]"). `Blocked by: 01, 06` lines follow the tracker doc's convention and are fine. Fix: name the tickets with links, as the neighbouring sentences already do.

**L5. Decisions so far is not in resolution order.** `map.md`: 01, 04, 15, 14, 02, 03; the commits resolved 15, 14, 02, 03, 01, 04. Not wrong (the rules set no order), but the first two lines and the blank line between them suggest the block was edited by hand. Fix: optional.

**L6. A recommendation from a resolved research ticket was not carried.** `research/foundationcss-llms-txt.md` 6 (last bullet) asks to record "the missing MCP server as a fact in" ticket 15; ticket 15 resolved without it. Ticket 12 records the alpha and beta mismatch but not the missing MCP server. Fix: add the fact to ticket 12's inputs.

**L7. Grilling tickets run AFK.** Tickets 06 to 13 are `Type: grilling` (HITL in the skill) and are worked AFK under the map's AFK override. The override is recorded as a user ruling in the map Notes and is cited by ticket 15, so this is recorded, not hidden. Listed so that the first AFK-resolved decision gets a check that no human-only item was decided in it.

**L8. Some research claims cite a section, not a line.** `research/browser-baseline-vs-yeti.md` 3: "The gap is about two years of releases" has no source; `research/yeti-javascript-and-angular.md` 4.1 "(old map section 5.2, inferred)" and 6 "(old map building-blocks 1.1, evidence only; HTML URL resolution)" point at a section of the old bundle, and the `<base href>` rule is stated with no spec reference; 6 (popover light dismiss on `routerLink` clicks) is inferred with no spec clone read, which 9 admits. Fix: add the line or the spec URL, or keep the "inferred" label next to each.

**L9. A user quotation is trimmed to look like a list of required checks.** `issues/01-...md`: "An earlier request named these features to check: 'container queries, `popover`s, ...'". The user's words, as the orchestrator holds them, are "...for example container queries, `popover`s, ...". The quoted span matches; the lead-in drops "for example". Fix: "named these features as examples".

**L10. Two old specs are dropped from the migration map without a reason.** `research/yeti-inventory.md` 10 maps 55 of the old bundle's 57 spec files and excludes `float-grid.md` and `flex-grid.md` ("excluding... leaves 55") without saying why; I confirmed that these two are the only names in `.scratch/next-foundation-specs/specs/` absent from the table. Fix: one sentence naming the migration-guide rows that cover them (the guide's grid rows, :21-27) or add two rows.

**L11. The ticket 03 gist is broader than its evidence.** `map.md`: "`validate.js` never runs on an Angular form". The findings (4.4) show it for forms under `NgForm`, `FormGroupDirective`, and `FormRoot`, whose submit handlers cancel the event before the `document` listener returns at `validate.js:50`; a `<form>` outside those directives is not covered. Fix: "never runs on a form under an Angular form directive".

**L12. Ticket 11 describes the clone with a folder it does not have.** `issues/11-decide-spec-list.md` lists, under "The clone's layout: `github.com/foundation/yeti`", "`dist/js/` has 10 modules". `ls` of the clone shows no `dist/`; the inventory research (header) says `dist/...` paths exist only in the build copy under `D:/tmp`. The 10 modules are in `src/**/*.js`. Fix: "`src/` holds 10 `.js` modules (`dist/js/` after a build)".

Also noted, no action needed: ticket 13 says to settle the loading unit's name "with" ticket 10 but is blocked only by 04, 06, and 08; ticket 10 is blocked by 08 and 09, so the two can run in either order (the wording leaves it open).

## Verified OK

Wayfinder process (script output above, then read):
- All 15 tickets carry `Type:`, `Status:`, `Blocked by:`, `Labels:`, `Map: ../map.md`, a numbered title, and `## Question`; `Labels:` equals `wayfinder:<Type>` for all. Checked.
- Blocking edges (06<-01; 07<-01,02,03; 08<-06,07; 09<-06,07; 10<-08,09; 11<-02,03,07; 12<-05; 13<-04,06,08) all point at real tickets, form no cycle, and no resolved ticket waits on an open one. Checked.
- The six resolved tickets (01, 02, 03, 04, 14, 15) each have an `## Answer`; no open ticket has one; each resolved ticket has exactly one Decisions line and its link text equals its title; no open ticket has a line. Checked.
- Out of scope is still true: the old map was stopped by the user's instruction (quoted in the map), and the three other lines are untouched by the wave. Not yet specified: the spec waves, building-blocks map, theming, and consistency review remain unspecifiable until tickets 06 to 13 resolve (see M4 for the two exceptions).
- The tracker conventions in `docs/agents/issue-tracker.md` (Status line, Blocked by line, `## Answer`, context pointer in `map.md`) are followed.

Research citations (more than 45 spot-checked, all hold unless listed in the findings):
- Yeti `README.md:9, 24, 32`; `package.json:3, 5, 43`; `LICENSE:32-38`; `src/layers.css:7`; `src/tokens/color.css:11-16` (six `@property` rules, the one unlayered content) and `:8-10`; `src/guides/stability.md:11, 15, 20, 21, 26, 27`; `src/guides/install.md:90-97, 148, 176, 203`; `src/guides/components.md:239, 241, 243`; `src/guides/migrating.md:113`; `src/guides/theming.md:11, 38`.
- `dialog.js:28, 30, 49`; `validate.js:38, 50, 51-55, 57, 62`; `hover.js:11-13, 28`; `tabs.js:4`; `toc.js:8-10`; `enter.js:20-22`; `button.css:131`; `spinner.css:5, 24`; `toc.css:9`; `tooltip.css:56`; `base/reset.css:77`; `base/typography.css:102`; the `content: ... / ""` lines in `breadcrumbs.css:22`, `toc.css:76`, `media.css:55`; `masonry/manifest.json:27`; `tooltip/docs.md:26`; `carousel/docs.md:32`.
- `bin/gen-llms.js:94-97`; `bin/build.js:13, 59, 93, 95-99, 163`; `package.json` exports `./css/*` and `./themes/*` at `:25, 28`.
- Angular: `dom_renderer.ts:679-686` (the `allLeavingAnimations.size === 0` guard at 683); `binding_parser.ts:698-700` (`splitAtColon`); `reify.ts:26-30` and `:324-329` (global targets and the error text); `form_root.ts:46` (`preventDefault`); `CMP/src/aria/` lists accordion, combobox, grid, listbox, menu, tabs, toolbar, tree; `tab-panel.ts:49` (`inert`); no `aria-invalid` in `packages/forms` (`rg`, exit 1).
- Counts recomputed: 69 CSS files in `src/`; 8 token files; 6 base files; 22 component, 17 layout, 3 recipe, 7 utility folders (49); 760 JS lines (`wc -l`), and the per-module table sums to 760 lines and 304 comment lines; part-file sizes 292 and 15,363 bytes and `attributes.css` 37,182 bytes and 466 lines; 297 tokens in 39 groups (the group table sums to 297); 32 vocabularies; `docs/` has 50 `.md` pages (53 entries); the 19 + 10 + 17 arithmetic of the feature table (27 unguarded = 17 + 10); the browser-version rows against the per-key support columns.
- Old bundle: tickets 190, 195, 197, 198 are `Status: claimed` and 194 is `resolved` at `4e02060`; `specs/` holds 57 files.
- Primary sources: the Yeti, Angular, and Angular components clones, the APG clone, and `web-features` 3.40.1 with `@mdn/browser-compat-data` 8.1.4 (pinned and listed). The one secondary fetch (the live migration page through `markdown.new`) was compared row for row with the source guide.
- Limits are stated in each file (what was measured, read, or inferred); the inferred browser breakages are labelled as such in the baseline and JavaScript files.

User words:
- Readiness ruling: identical in `map.md` and `issues/12-...md`. Licence ruling: identical in `issues/15-...md` and `adr/0001-...md`. "Compare Angular 22's browser baseline...": identical in `map.md` and `issues/01-...md`. Ticket 14's "19." instruction and ticket 01's feature list match the user's messages, per the orchestrator. Checked by exact string.
- The map's paraphrase of the licence ruling and ADR 0001's "We therefore decided" sentence keep to the user's words (free and open-source, MIT). Ticket 15 marks its readiness move as the orchestrator's reading.

Hygiene:
- All 12 commit subjects are `docs(wayfinder): ...` Conventional Commit subjects of 45 to 69 characters; each has a body that gives the why (claim commit: "so a parallel session leaves them alone"); no trailer or tool attribution (exit 1 on the attribution search). Each resolution commit carries the ticket, its research file, and one map line (one resolved ticket per commit holds for 01, 02, 03, 04, 14, and 15).
- Banned words and the banned pair: no match in files or commit messages, with a working control (table above).
- Links: 59 relative links in 22 files, none broken, anchors included.

Not checked (no web access in this audit): the text of foundation/yeti#15554 and the claim it is the only matching issue, the foundationcss.com sitemap count (72 `/yeti/` URLs) and the byte-identity of the published llms files with `docs/llms*.txt`, the npm 404 probes, the supported-browsers page values (the web-features derivation was re-read, not re-run), and every browser behaviour (the research itself ran nothing in a browser except the three-engine CSS runs of ticket 04, whose scripts live under `D:/tmp` and were not re-run). The numbers in the `light-dark()` row were re-counted with `rg` only.

## Resolution log

<!-- empty: filled in by whoever fixes the findings -->

## Link check on this file

Run last with `node <scratchpad>/audit0001.mjs .scratch/ngx-yeti-specs/audits/0001-research-wave.md`: see the line directly below, added after the run.

Result: 10 links checked, none broken (exit 0); banned-word, variant, and non-ASCII searches over this file all exit 1.

The orchestrator applied the fixes on 2026-10-01.

- M1: applied. Decisions so far is rewritten as one block of short gists, 343 to 461 characters each, in resolution order (L5). The lists of breakages, candidates, and additions stay in the Answers.
- M2: applied. Ticket 04's Answer gains a note with the scope limits, the unexplained earlier difference on the demo pages, and the inferred status of the library-owned `<style>`; the gist says both.
- M3: applied. The baseline table row and a correction note at the end of the findings say 47 uses in the token files (45 and 2). The map's gist drops the count and says "per web-features data" in place of "checked".
- M4: applied. The Testing and Release policy fog items now ask only what tickets 08 and 12 do not, and name those tickets.
- M5: applied. Ticket 15's Answer drops the frozen-surface sentence and points at ticket 12, its stale Question sentence is dated, and ticket 12 labels the gloss "Orchestrator's reading" and leaves the frozen-surface question open under point 4.
- M6: applied. The auditor could not see the conversation, so these quotes had one copy each. The orchestrator holds the user's messages, and each flagged quote is verbatim from one of them. The map's two quotes and ticket 11's instruction now say so. "AFK, like the old map" is marked as the label of the option the user picked. Ticket 11's "confirmed" and ticket 14's note quote the user's messages.
- M7: applied to the two sentences in the JavaScript findings, which now read as options for the spec and spec-list tickets. The llms recommendations stay.
- L1, L2, L3, L6, L9, L10, L11, L12: applied as each Fix says. L6's fact went into ticket 12; L11's wording is in the rewritten gist.
- L4: applied to tickets 05 and 13. Skipped for the research files' `Ticket:` header lines, which link the ticket file; their link text is a number, not a sentence.
- L5: applied with M1.
- L7: no change; the first AFK decision gets the check the finding asks for.
- L8: skipped. Each cited claim already carries its "inferred" label, which is what the Fix allows.
- Also noted (tickets 10 and 13): no change.
- One more point, raised by the orchestrator: the audit's first draft cited a temporary, uncommitted file of the user's as corroboration. The user ruled on 2026-10-01 that the file is never to be referenced, so those citations are replaced with the orchestrator's check against the user's messages.
