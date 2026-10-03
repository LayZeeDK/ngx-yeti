# Audit 0002: the second wave (tickets 16 to 23 resolved, tickets 22 to 26 opened, standing rulings, upstream bugs ledger)

Date: 2026-10-01
Auditor: compliance auditor (Sonnet 5.5); read-only except this file

## Scope

Everything under `.scratch/ngx-yeti-specs/` as committed at HEAD `4495104` ("claim the Tailwind v4 prototype"). `git status --short .scratch/ngx-yeti-specs` printed nothing before and after the audit, so the working tree equals HEAD for the bundle (checked). Ticket 24 is audited as committed: `Status: claimed`, no answer, no `prototypes/yeti-tailwind/` yet.

The wave is the 17 commits of `git log ce7d358..HEAD -- .scratch/ngx-yeti-specs` (from the commit after "apply audit 0001's fixes"): `90757b9` (rulings, six tickets), `54a5ecb` (claim), `f76f379` (hydration providers), `da82938` (ticket 16), `8890fe6` (19), `2793708` (21), `b6a5241` (20), `88e72af` (17), `18d6ec2` (open tickets 22 to 25), `961cd85` (claim), `08dbcc4` (Nx 24 note), `e1620de` (approval), `12fa7b0` (18), `d3a0373` (ledger, zoneless, ticket 26), `7f9f1dd` (22), `d92cccf` (23), `4495104` (claim 24). Resolved in the wave: [Research: binding Yeti's `yeti:*` events in Angular templates](../issues/16-research-yeti-events-in-angular-templates.md), [Research: Yeti against WHATWG, WAI-ARIA, the APG, and Angular Aria, CDK, and Material patterns](../issues/17-research-yeti-accessibility-and-standards.md), [Prototype: Yeti under SSR, hydration, `@defer`, event replay, and `animate.enter` and `animate.leave`](../issues/18-prototype-yeti-rendering-modes.md), [Research: what `validate.js` does, and replacing it with Angular Signal Forms](../issues/19-research-yeti-validate-and-signal-forms.md), [Prototype: Yeti's modules in a single-page Angular app](../issues/20-prototype-yeti-in-single-page-apps.md), [Prototype: Yeti as a dependency from GitHub at a pinned commit](../issues/21-prototype-yeti-as-github-dependency.md), [Prototype: building, consuming, and theming Yeti from a pinned commit with Nx](../issues/22-prototype-building-and-consuming-yeti-with-nx.md), and [Research: Yeti's cascade layers and stylesheet order, for lazy loading](../issues/23-research-yeti-layers-and-import-order.md). Opened or claimed: [Prototype: the package beside Tailwind v4 in one Angular application](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md), [Decide: the building-blocks map for every ngx-yeti item](../issues/25-decide-building-blocks-map.md), [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md). New files: `upstream-bugs.md`, five research files, four prototype folders.

Governing rules: the `/wayfinder` skill (read from the plugin cache, because the Skill tool refuses it), the `/research` and `/domain-modeling` skills (read), `docs/agents/issue-tracker.md`, the map's own Notes, and audit 0001 (findings there are not repeated unless they recur in new text).

## Method

1. Process (script, then reading). `audit0002.mjs` (session scratchpad; the 0001 script with the quote section replaced) checks every ticket for `Type:`, `Status:`, `Blocked by:`, `Labels:` (equal to `wayfinder:<Type>`), `Map:`, a numbered title, `## Question`, and `## Answer` (present exactly when resolved); every blocking edge names a real ticket; the graph has no cycle; no resolved ticket waits on an open one; each resolved ticket has exactly one Decisions-so-far line whose link text equals its title; no open ticket has one. It also prints each gist's length and, for every blockquote that starts `NN.` and every long double-quoted span, how many bundle files hold that exact text. I then read the map, tickets 16 to 26 and 06, 07, 12, 13, the five new research files, the four prototype READMEs, and `upstream-bugs.md` in full.
2. Citations. I spot-checked about 70 citations against `github.com/foundation/yeti` (`f52d1e8b9`), `github.com/angular/angular` (22.2.x), `github.com/angular/components`, and `github.com/w3c/aria-practices`, listed under Verified OK. Two of the research files' claims were re-derived with `rg` (no `forced-colors` in Yeti `src`, `aria-orientation` only in `demo.js`).
3. User words. The script's quote table, then a manual match of each quotation's lead-in ("the user's own message to the orchestrator, verbatim") against the rule.
4. `upstream-bugs.md`. Each row's evidence located in the cited ticket, source line, or old-bundle ticket, and its Verified word compared with what the ticket says.
5. Hygiene. Commit subjects and bodies read; banned-word, attribution, and non-ASCII searches; link check with a control. For the control I made one throwaway file inside the bundle folder and deleted it; `git status` was clean afterwards.
6. Not re-run: every browser measurement, Playwright script, and build (the scripts live under `D:/tmp`, outside the repository). I did no web access.

### Link check

Script: `audit0002.mjs`, run from the repository root as `node <scratchpad>/audit0002.mjs`. It resolves each `[text](target)` outside fenced blocks and code spans against its own file, and each `#anchor` against the target's headings. Output on the committed bundle (44 `.md` files, audit 0001 included; this audit file was not yet written):

```
links checked: 156 in 44 file(s)
tickets: 10:grilling/open 11:grilling/open 12:grilling/open 13:grilling/open 14:research/resolved 15:grilling/resolved 16:research/resolved 17:research/resolved 18:prototype/resolved 19:research/resolved 20:prototype/resolved 21:prototype/resolved 22:prototype/resolved 23:research/resolved 24:prototype/claimed 25:grilling/open 26:grilling/open (and 01-09 as before)
gist lines: 14
gist chars (in order): 325 343 315 307 386 461 709 737 770 825 994 1027 877 868
OK no problems          (exit 0)
```

Control: a file with one resolving link, one missing file, one missing anchor, and one broken link inside a code span printed `PROBLEM ... link target missing: nope.md` and `PROBLEM ... anchor missing: map.md#no-such`, then `FAIL 2`, exit 1. The code-span link was skipped, as designed. The result for this audit file is at the end.

### Banned words, attribution, non-ASCII (exact commands, exit codes)

`$SP` is the session scratchpad. `bw.txt` holds the single-word list from the brief as one regex (with hyphen and space variants), and a second line holds the paired terms (kept in a file so the words do not appear here). `bw2.txt` holds spaced and punctuated variants of four terms. `commits0002.txt` is `git log ce7d358..HEAD --format='%H%n%B%n----' -- .scratch/ngx-yeti-specs`.

| Command | Exit | Reading |
| --- | --- | --- |
| `rg -i -n -f "$SP/bw.txt" .scratch/ngx-yeti-specs` | 1 | no match in any bundle file (audit 0001 included) |
| `rg -i -n -f "$SP/bw.txt" "$SP/commits0002.txt"` | 1 | no match in the 17 commit messages |
| `rg -n -i -f "$SP/bw3.txt" .scratch/ngx-yeti-specs` and the same on `commits0002.txt` (`bw3.txt` holds the paired-terms pattern from the brief) | 1, 1 | the pair does not appear at all |
| `rg -i -n -f "$SP/bw.txt" "$SP/ctl2.txt"` (control: a file holding one banned word) | 0 | one hit, so the pattern works |
| `rg -i -n -f "$SP/bw2.txt" .scratch/ngx-yeti-specs --glob '!audits/*'` and on `commits0002.txt` | 1, 1 | no variant |
| `rg -i -n 'co-authored-by\|generated with\|claude code\|anthropic\|noreply' "$SP/commits0002.txt"` | 1 | no trailer or generated-with line |
| `rg -i -n 'opus\|sonnet\|fable\|haiku\|effort' "$SP/commits0002.txt"` | 0 | 8 hits: see H1 |
| `rg -n -P '[^\x00-\x7F]' "$SP/commits0002.txt"` | 1 | commit messages are ASCII |
| `rg -c -P '[^\x00-\x7F]' .scratch/ngx-yeti-specs --glob '*.md' --glob '!audits/*'` | 0 | 5 files: see L12 |

I ran no identity search of any kind.

## Findings

Counts: High 2, Medium 7, Low 15.

### High

**H1. Eight commit messages name the AI model and effort that did the work.**
Files: commit bodies of `d92cccf`, `7f9f1dd`, `12fa7b0`, `88e72af`, `b6a5241`, `2793708`, `8890fe6`, `da82938`.
Rule: global Git rules: "No AI attribution in commits ... or any AI tool attribution to commit messages".
Evidence: each body ends with a line such as "Resolved on Opus 5.5 at medium effort." (`12fa7b0`: "at high effort"; `2793708`: "Resolved on Sonnet 5.5 at medium effort, with npm ci and ng build as the checks."). The `rg` on the model names returned 8 hits (exit 0). An `rg` over the 40 earlier bundle commits matches the same terms on 5 lines (not read one by one), and audit 0001 passed its wave on the narrower test of trailers; I read the rule as covering any attribution to an AI tool, a model name included. Judgement call: if the orchestrator reads the rule as trailers only, this drops to Low.
Fix: reword the 8 messages (and any earlier ones that match) with `git history reword`, dropping the model line or moving it into the ticket's Answer, which already says "Resolved ... by Claude Opus 5.5" (that file text is outside the commit rule). Do it before the branch is pushed.

**H2. The map's gist for ticket 19, and a commit message, say `validate.js` never runs under Signal Forms or reactive forms; the findings measured a Signal Forms case where it runs.**
Files: `map.md` (Decisions so far, ticket 19 line); commit `8890fe6` body; against `research/yeti-validate-and-signal-forms.md` section 3 (rows B, B 2nd submit, B 3rd submit) and `issues/19-...md` Answer.
Rule: wayfinder (a gist must not claim more than the ticket holds); research ("findings that decide something").
Evidence: the gist reads "Under Signal Forms or reactive forms it never runs (measured in three engines)". The research measured: under `FormRoot` and under reactive forms Angular prevents the submit first, so `validate.js` returns; but with `[formField]` and no `FormRoot` (form B, static `novalidate`) `validate.js` ran, marked the mirrored `required` and `type="email"` controls, wrote the message, focused, and dispatched `yeti:invalid`, and a `pattern()`-only or custom-rule failure submitted untouched. The ticket's own Answer is correct ("under `FormRoot` and under reactive forms"); only the index and the commit lost the qualifier. Section 3 of the research then draws three spec-relevant consequences (the two validity sources disagree field by field; a Signal-Forms-only template with no `FormRoot` and no `novalidate` gets the browser bubble) that the gist does not carry. A spec author who reads only the map would assume the module is always inert and skip the half-working case.
Fix: gist wording "under `FormRoot` or reactive forms it never runs; with a bare `[formField]` it runs only on constraints the DOM knows (measured in three engines)". The commit body cannot be changed without a rewrite; fold it into the H1 reword.

### Medium

**M1. Eight of the 14 gists in Decisions so far are long, and the map restates what the tickets hold again.**
File: `map.md`, Decisions so far (lines for tickets 16 to 23: 709, 737, 770, 825, 994, 1,027, 877, 868 characters; the earlier six are 307 to 461).
Rule: wayfinder, "The map is an index, not a store ... only gists it and links"; audit 0001 M1 and its fix (343 to 461 characters).
Evidence: the ticket 17 line (994) lists seven deviations and the Angular blocks that fill them; the ticket 18 line (1,027) lists eleven findings; the ticket 20 line (825) lists three failures, two fixes, and costs. Each repeats the ticket's Answer.
Fix: cut each to the decision-relevant sentence or two (counts, what the next ticket takes from it), as the earlier six do.

**M2. Two claims in the map and ticket 17's Answer are stronger than the measurement.**
Files: `map.md` (ticket 17 line: "Every focus ring meets 3:1"; "finds 0 violations on all 49 docs examples"); `issues/17-...md` Answer ("Every Tab stop had a 2px focus ring, at 5.31:1 (light) and 7.54:1 (dark) contrast"); research sections 2.1, 2.3, 6.
Rule: research quality (state what was and was not shown).
Evidence: section 2.3 says every stop had a ring (a presence check), and gives contrast for "Chromium, focused tab": one control, both schemes; section 6 lists "focus-ring contrast (one control, both schemes)". The Answer and the gist turn that into every ring. On axe, section 2.1 records `color-contrast` left incomplete on five items (timeline, layer, breakout, media, lede) and one violation on `overlay` that appeared only while example images 404'd; the Answer carries the incomplete ones in "other measured notes", the gist does not. The Answer also labels the dialog Tab finding "(measured)" where the research marks the reading "browser's own UI" as inferred (headless `activeElement` became `body`).
Fix: gist "focus rings are present at every stop; contrast measured on one control (5.31:1, 7.54:1)"; add "five items need a manual contrast check" to the gist or the Answer; mark the dialog reading inferred.

**M3. Ticket 23's gist and Answer say every insertion method matched full Yeti; the table shows differing pages in Chromium and WebKit.**
Files: `map.md` (ticket 23 line: "all match full Yeti, through unload and reload"); `issues/23-...md` Answer ("With the statement as the part's first line, only two tie pages differed"); `research/yeti-layers-and-import-order.md` 4.3.
Rule: research quality; wayfinder gist.
Evidence: the 4.3 table gives `style-append` 5/4/7 differing pages in Chromium and 2/3/2 in WebKit (`adopted` 7/4/7 and 2/3/2; `link-append` 5/4/5 and 0/3/1; `style-prepend-statement` 7/4/6 and 4/3/4). The research reads these as stale computed style in the engine (an `diag.mjs` re-run on a fresh `<body>` clone gave 0 differences) and says "inferred" and "whether it ever shows on screen was not checked". The Answer says "A few pages ... showed stale computed styles" but the gist drops it, and "only two tie pages differed" omits the 7, 4, and 6 Chromium pages the same table shows. Open point 8 lists it as unresolved.
Fix: add "Chromium and WebKit showed stale computed styles on 2 to 7 pages whatever the method (engine invalidation, inferred)" to the gist; reword the Answer sentence to "apart from two tie pages and the stale-style pages".

**M4. The map says ticket 22 decides how Yeti gets built; ticket 22 and its answer decide nothing, and two map lines refer to tickets by bare number.**
Files: `map.md` (Standing rulings, "Building Yeti": "ticket 22 decides how Yeti gets built"; "Building-blocks audit": "Ticket 25 is that audit"); `issues/22-...md` ("Decide nothing; [ticket 12] chooses").
Rule: wayfinder, "Refer by name ... never by a bare id"; no stale statements.
Evidence: ticket 22 is resolved with "Decide nothing" and sends the choice to [Decide: which Yeti version the specs target, and how the package tracks it](../issues/12-decide-yeti-version-policy.md). The present-tense "decides" in the map is now wrong, and "ticket 22" and "Ticket 25" are bare numbers where the neighbouring lines use links. (Also in `upstream-bugs.md`: rows Y2, Y4, A2, A3 cite "ticket 18" and "ticket 02" without a link, and the same bare form is used in the research files.)
Fix: replace with the two ticket names as links, and say the Nx build choice sits in ticket 12.

**M5. A Not yet specified item duplicates a live ticket.**
File: `map.md`, Not yet specified: "Theming and tokens in Angular: whether and how the package exposes Yeti's runtime tokens (typed inputs, providers, or nothing) ...".
Rule: wayfinder, "Not yet specified excludes ... what's already a live ticket" (audit 0001 M4).
Evidence: `90757b9` added to [Decide: which standing preferences and user rulings carry over](../issues/07-decide-inherited-preferences-and-rulings.md) the question "whether, and how, typed inputs or providers set Yeti's public `--yeti-*` tokens as custom properties, for example per instance through host style bindings or per application through a provider". That is the same question. (The fog item also names ADRs 0039 and 0040, which tickets 07 and 08 decide.)
Fix: drop the fog item or reword it to what ticket 07 does not cover (for example theme files and the starter themes as a package feature).

**M6. Resolved prototypes and research hand a decision to a ticket that does not link them or list them as blockers.**
Files: `issues/12-decide-yeti-version-policy.md` ("How to work it" lists the task 05, the stability guide, `bin/frozen.js`, the announcement; no link to tickets 21, 22); `issues/13-decide-style-loading.md` ("Blocked by: 04, 06, 08"; no link to 23); `issues/25-...md` ("Blocked by" omits 13, 22).
Rule: wayfinder (blocking edges real; zoom into related tickets by link).
Evidence: tickets 21 and 22 each end "Decide nothing; [Decide: which Yeti version ...] chooses", and ticket 23 ends "Then propose, as options for [Decide: how component styles load and unload]". Ticket 12 point 3 ("a git dependency at the commit, vendored built files, or a build step") is exactly what 21 and 22 measured; ticket 13's options are 23's section 7. Neither ticket points back. Ticket 25 asks for "the reason for the implementation level" per row and cites the standing ruling on `styleUrl` components, which ticket 13 settles, but it is not blocked by 13.
Fix: add the links to the "How to work it" of 12 and 13, add 21 and 22 to 12's and 23 to 13's `Blocked by` (all resolved, so nothing waits), and consider 13 as a blocker of 25.

**M7. The upstream bugs ledger is incomplete and has one row that is not a bug.**
File: `upstream-bugs.md`.
Rule: the user's item 44 ("Keep a ledger of upstream bugs found"); the ledger's own line "Each spec ticket that finds a bug adds a row".
Evidence: (a) ticket 22 measured that `@nx/esbuild:esbuild` writes a CSS bundle with a `.js` extension through three attempts (README row G); ticket 23 measured stale computed styles in Chromium and WebKit after a sheet insert or removal, with every method (inferred engine invalidation, no minimal reproduction). Neither is a row; the ledger covers "Yeti, Angular, and any other upstream". (b) `bin/build.js:2-3` says "Concatenation only. No transforms." while the file minifies with lightningcss (`:46`) and esbuild (`:66`); the prototype README quotes it and notes the build "does not reduce to esbuild", but the contradiction is not logged (the way Y3 and Y4 log the README and components guide mismatches). (c) Y6 ("The masonry guard tests a syntax that has no browser-compat-data key") is a gap in the data used, not a Yeti bug. (d) A1's evidence cites "old map tickets 184 and 188" as plain text; "open since 2025-12-24" and "in the upstream issue" appear only in the old ticket 188 (`.scratch/next-foundation-specs/issues/188-...md`, line 43), which I located; the Minimal reproduction cell is not checkable from the ledger.
Fix: add rows for (a) and (b) with Verified words from the tickets, move Y6 to a note, and link the old tickets in A1.

### Low

**L1. Single-copy user quotations.** The rule is met by the lead-in ("the user's own message to the orchestrator, verbatim") for all of these, and I cannot see the conversation, so I report only that one copy exists in the bundle: items 19 (ticket 14), 20 and 21 (ticket 16), 22 (17), 23 (18), 24 (19), 25 (20), 27 (21), 33 (23), 34 (24), 28, 29, and 43 (map only), and the ticket 07 addition "21. What about adding CSS classes or setting CSS Custom Properties?" The last one is introduced as "The user asked, verbatim", not as a message to the orchestrator. Items with two or more copies: 26 (map, ticket 06), 31 (map, ticket 22), 36 to 38 (map, ticket 25), 41 (map, ticket 22, prototype README), 42 (map, ticket 26), 44 (map, `upstream-bugs.md`), the hydration sentence (map, ticket 18). Fix: label ticket 07's quote the same way as the others.

**L2. An orchestrator gloss sits under a user ruling in ticket 06.** `issues/06-decide-browser-target.md`: after the quoted item 26, "So Angular 22's own baseline is not the package's target." is the orchestrator's reading, not the user's; it is not labelled (ticket 12 labels the same kind of sentence "Orchestrator's reading", per audit 0001 M5). Fix: prefix it.

**L3. Orchestrator findings in the map's Notes have no source.** `map.md`, "Building Yeti" bullet: "Nx 21, 22, and 23 each began their own `X.0.0-beta.0` line 3 to 13 weeks before release", "No 24.x exists on npm", "`next-major` ... 0 commits ahead of master", "open draft PRs such as #37160". These are registry and GitHub reads with no URL or measured/read label. The prototype README gives `latest` 23.2.1 and `next` 23.3.0-beta.7. Fix: label each and name the source (the `npm view` call, the compare URL). Commit `08dbcc4` states the inference ("so 23.3.0-beta.7 ships as 23.3.0") as fact; the map is more careful.

**L4. The prototype for ticket 22 ran on Angular 22.1, not the 22.2 target.** `issues/22-...md` Answer and the README ("Angular 22.1", from the preset's pin); the map's Target platform is Angular 22.2, and tickets 18 to 21 raised or used 22.2. The Answer says so; the point is that "works under 22.2" is not shown for the Nx build setup (inferred). Fix: one clause in the Answer.

**L5. Ticket 16's probe used one engine and an older Playwright.** `research/yeti-events-in-angular-templates.md` header: Playwright 1.57 with Microsoft Edge only. The ticket 16 Answer and the map say "measured" with no engine, while tickets 17 to 23 state three engines. Fix: "measured in Chromium (Edge) only" in the Answer.

**L6. Five articles are cited from search-tool summaries only.** `research/yeti-events-in-angular-templates.md`, Issues and articles: "content summarised by the search tool, not fetched in full". The Answer says "five plugin articles" and `/research` asks for primary sources. The finding that none handles colon names is labelled "not verified against the full texts" in the file, not in the Answer. Fix: say so in the Answer, or fetch them.

**L7. A claim in ticket 03's research is contradicted by ticket 17 and not corrected.** `research/yeti-javascript-and-angular.md:172` says the APG marks arrow keys between accordion headers optional; `research/yeti-accessibility-and-standards.md` 4.1 reads the APG at `3f094fd` (`accordion-pattern.html:47-63`; `rg -i arrow` over the file returns nothing, which I confirmed) and calls the earlier reading out of date. Ticket 25 lists both files as inputs. Fix: a one-line correction note in the 03 research file.

**L8. The ledger seeds in ticket 25 omit findings from ticket 17.** The list of eight omits the `center` 2 px overflow at 320 px (WCAG 1.4.10, section 2.4), the five axe-incomplete contrast items, the accordion header that is not a button inside a heading, the `buttons` group without a toolbar's single Tab stop, and the infinitely spinning spinner (2.2.2 open). Ticket 17's section 3 also calls `center` "conforms" while recording the overflow. Fix: add them to the seed list or say why they are left out.

**L9. Ticket 25 and ticket 26 are large for "one 100K token agent session".** Ticket 25 asks for 49 rows with five fields each, a ledger, and ADRs; ticket 26 audits 32 vocabularies, 31 markers, and 54 attribute names and records an ADR. Wayfinder sizes a ticket to one session. Also `Type: grilling` is HITL in the skill and both say "AFK grilling"; this is the recorded AFK override (audit 0001 L7). Ticket 25's own text notes it runs on `fable-high`. Fix: consider splitting 25 into the building-blocks rows and the ledger and ADRs.

**L10. Ticket 26's blockers omit tickets it reads.** `issues/26-...md` is blocked by 02, 07, 16, 18, but its question depends on which items the spec list keeps ([Decide: the spec list](../issues/11-decide-spec-list.md)) and on [Prototype: Yeti's modules in a single-page Angular app](../issues/20-prototype-yeti-in-single-page-apps.md) (owner directives, `data-once`, hash reveal). Ticket 25 lists both. Fix: add 11 and 20, or say why not.

**L11. Commit shape.** `d3a0373` carries three unrelated changes (the ledger, the zoneless rule, ticket 26) under a 94-character subject; `18d6ec2` and `90757b9` have 81-character subjects. The planning repository's `AGENTS.md` asks for atomic commits and the earlier ones in this bundle keep to 45 to 70 characters. All 17 subjects are `docs(wayfinder): ...` Conventional Commit subjects and every body gives the why. Fix: none needed unless the H1 reword splits `d3a0373`.

**L12. Non-ASCII characters in committed files.** `research/yeti-layers-and-import-order.md` (9 lines, the section sign), `research/yeti-accessibility-and-standards.md` (7 lines: 4 em dashes, 3 arrows, 1 ellipsis), `research/yeti-events-in-angular-templates.md` (1, in a quoted Angular instruction name), `issues/23-...md` (1, a section sign), and `research/foundationcss-llms-txt.md` (1, from audit 0001 L3's quoted heading). The ASCII preference for committed artifacts is about glyph and search mismatches; the section sign makes literal `rg` patterns for those citations fragile. Fix: write "section" or "Cascade 5 6.4.3" if the preference is applied.

**L13. Map bundle layout list is out of date.** `map.md`, "Process rules carried over", Bundle layout lists `map.md`, `issues/`, `research/`, `prototypes/`, `adr/`, `CONTEXT.md`, `building-blocks.md`, `specs/`, `audits/`, `README.md`, but this wave added `upstream-bugs.md` and the standing rulings add `ledger.md`. Fix: add both.

**L14. Statements in ticket Answers that the READMEs label inferred.** Ticket 21 Answer: "No esbuild/Vite plugin was built: the Angular builder takes none" (README: "inferred from the generated `angular.json`"). Ticket 16 Answer: "(yeti.close)" is offered as an alias with the dash form; the dot alias was not measured (research "What was not measured"). Ticket 22 Answer: "0 of 26 targets use a removed executor" is measured on the prototype's targets only. Fix: add "(inferred)" or the scope.

**L15. Prototype directive names use the old package prefix.** `prototypes/yeti-spa/README.md` names `nfsOwnTabs`, `nfsOwnToc`, `nfsOwnEnter`. The prefix of the new package is not decided (the glossary ticket is open), and `nfs` is the Foundation package's. Throwaway code, so Low. Fix: note "placeholder prefix" in the README.

## Verified OK

Wayfinder process (script output above, then read):
- Tickets 16 to 26 and the earlier 15 carry `Type:`, `Status:`, `Blocked by:`, `Labels:` (equal to `wayfinder:<Type>`), `Map: ../map.md`, a numbered title, and `## Question`. All 14 resolved tickets have an `## Answer`; no open or claimed ticket has one. Checked by script.
- Blocking edges (16, 18, 19, 20 <- 03; 17 <- 02, 03; 21 none; 22 <- 21; 23 <- 04; 24 <- 04, 23; 25 <- 06, 07, 09, 11, 16, 17, 18, 19, 20, 23; 26 <- 02, 07, 16, 18) point at real tickets, form no cycle, and no resolved ticket waits on an open one. Checked by script. The empty `Blocked by:` on a ticket with no blockers matches tickets 01 to 04, 14, and 15.
- Exactly one Decisions-so-far line per resolved ticket (14 of 14), link text equal to the ticket title, none for the open and claimed tickets (24, 25, 26 and 05 to 13). Checked by script. Order of the lines is by resolution, and the block is one block.
- Not yet specified: spec waves, the consistency review, and the bundle index are still unspecifiable; the building-blocks item was removed when ticket 25 was opened, as the rule asks. The Testing and Release policy items name tickets 08 and 12 and ask only what they do not (the audit 0001 M4 fix held). Out of scope is still true.
- Standing rulings give each user item an attribution line and a link to the ticket that applies it. The Nx 24 bullet separates the user's words from the orchestrator's findings and calls the approval a ruling only on the quoted "41. Approve recommendation."

Citations (about 70 checked; all hold except where a finding says so):
- Angular: `binding_parser.ts:698-701`; `reify.ts:319-330` (throw text matches the quoted compile error); `dom_renderer.ts:477-495` and `:679-686` (the `allLeavingAnimations.size === 0` guard at 683); `dom_events.ts:21-23` (`supports` returns `true`); `event_manager.ts:31` and `:95-112`; `event_replay.ts:248`; `platform-server/src/server.ts:72`; `adev/.../event-listeners.md:138` ("Extend event handling"); `compiler.ts:1063-1064` and `:1110` (`checkUnclaimedEventNames: false, // 3p-only`); `typecheck/src/dom.ts:35` (the candidate regex excludes dashes); `listener.ts:97`; `hydration/api.ts:343-345` (`withIncrementalHydration()` includes `withEventReplay()`); `platform-browser/src/hydration.ts:289-291` (no-incremental switch); `shared.ts:596-599`, `dom_node_manipulation.ts:141`, `annotate.ts:205-211`, `animation.ts:288` and `:416`, `constants.ts:25-30` (OnPush default); `shared_styles_host.ts:239-251` (`appendChild`); forms: `ng_form.ts:341`, `abstract_form.directive.ts:321`, `ng_no_validate_directive.ts:28-33`, `form_root.ts:38` and `:46`, `native.ts:45-49`, `di.ts:20`, `node.ts:107`, `validation.md:57` and `:65`, `custom-controls.md:269`. Hammer commits `f99e7ed20f` (2026-03-06), `a980ac9a6a` (2025-03-06), `de8ebbdfd0` (2019-08-19) exist with the quoted subjects.
- Components: `tab-list.ts:53`, `:80`; `tab-panel.ts:49` (`inert` only); `accordion-trigger.ts:48-51`; `focus-monitor.ts:87`, `:181`; `id-generator.ts:22`, `:31`; `tooltip.ts:942-948` (Escape predicate); `_index.scss:48` (`high-contrast` mixin); `input.ts:85`; `live-announcer.ts:37`.
- Yeti: `alert.js:12`, `:17`; `dialog.js:49`, `:74`; `tabs.js:31`, `:76`, `:105`; `carousel.js:43`; `validate.js:20-21`, `:49-50`, `:55`, `:57-58`, `:61-62`; `toc.js:36`; `hover.js:33`; `stability.md:20-21`; `layers.css:1-7`; `bin/lib/layers.js:3-12`; `bin/validate.js:314`, `:323`, `:335`, `:830`; `test/browser/smoke.spec.js:11-18`; `bin/build.js:2-3`, `:34`, `:46`, `:66`, `:90-93`; `yeti.css:1-3` and the import lines `:20`, `:30`, `:39`, `:42-43`; `install.md:40`, `:44`, `:48-52`, `:90-97`, `:105`; `theming.md:11`, `:94`, `:113`, `:115`; `base.md:411`; `tokens/components.css:102`, `:178-182`; `toc.css:6-9`; `stack.css:12`; `shell.css:13`; `reset.css:75-79`; `field.css:188-190`, `:193-194`; `breadcrumbs.css:22`; `tooltip.css:1-5`; the `a11y` block of `field` (292), `tooltip` (28), `carousel` (35), `layer` (72), `accordion` (23), `dropdown` (111), `tabs` (44), `toc` (141), `progress` (135) manifests; `README.md:9`, `:20`, `:24`, `:36-40`; `components.md:235-239`, `:247`; `color.md:15`; `package.json:3`, `:39` (no `prepare`, `prepack`, or `postinstall`); `.gitignore:2` (`dist/`); `git ls-files dist` returns 0.
- APG `accordion-pattern.html`: no arrow key is listed (`rg -i arrow` returns nothing).
- Counts and absences re-derived: `rg -c forced-colors` over Yeti `src` returns no match (exit 1); `aria-orientation` appears in `src` only in `demo.js:103`; 17 layouts, 22 components, 3 recipes, 7 utilities in ticket 17's rows (16 layouts plus `scroller` = 17; 11 conforming components plus 7 with deviations plus `buttons`, `carousel`, `demo`, `tooltip` = 22); the prototype folders hold the files their READMEs link (`yeti-nx-build/results/v24-check.txt` lists 26 targets and `flagged: 0`; `theme-check.txt` shows the three engines).
- Cross-file agreement: tickets 16 to 23 agree with their research or README on versions (Playwright 1.63.0 for 17 to 23, Chromium 153, Firefox 155, WebKit 26.6; Yeti `f52d1e8b9`), on 8 SSR builds (18), on 98 pages per engine (23), and on the ledger rows' links.

`upstream-bugs.md`: Y1 matches ticket 18 (measured) and `alert.js:12` (read); Y2 matches ticket 18 (inferred) and `hover.js:33`; Y3 and Y4 match ticket 02 and the cited lines; Y5 matches ticket 14 (the registry probes are fetches, so "read" understates the method, but no stronger claim is made); A1's lines (`dom_renderer.ts:683`, `animation.ts:416`) and its date in old ticket 188 hold; A2 and A3 match ticket 18 and keep A3's "bug or limit is open". Every Verified word is a word the cited ticket uses. Ledger intro and columns are consistent with the map's item 44. No row claims a filed report.

User words: every quotation attributed to the user is introduced as "the user's own message to the orchestrator" or "the user's own messages ... verbatim" (tickets 06, 16 to 21, 22, 23, 24, 25, 26; the map's Standing rulings heading). No sentence written by the orchestrator or an agent is inside a quotation. Items with two or more copies are listed in L1.

Hygiene: all 17 commit subjects are Conventional Commit subjects (`docs(wayfinder): ...`); all 17 bodies give a reason; no trailer or generated-with line; commit messages are ASCII; one resolved ticket per commit holds for 16, 17, 18, 19, 20, 21, 22, and 23. No banned word or banned pair in any bundle file or commit message, with a working control (table above). Links: 156 relative links in 44 files, none broken, anchors included, with a failing control.

Not checked (no web access): whether angular/angular#66244 is still open, the text of the Nx blog post and nx.dev pages, the registry data behind the Nx 24 statements, foundationcss.com pages quoted in the Nx README, MDC issue #4221 and custom-elements-everywhere#986, the five plugin articles, `@taiga-ui/event-plugins` 5.1.0 contents, and every measured browser or build result (the scripts and workspaces are under `D:/tmp`).

## Resolution log

<!-- empty: filled in by whoever fixes the findings -->

## Link check on this file

Run last with `node <scratchpad>/audit0002.mjs .scratch/ngx-yeti-specs/audits/0002-second-wave.md`: see the line directly below, added after the run.

Result: 15 links checked in this file, none broken (exit 0). The whole bundle with this file included: all links resolve, no problems (exit 0). Banned-word, paired-terms, variant, and non-ASCII searches over this file and the bundle all exit 1.

The orchestrator applied the fixes on 2026-10-01.

- H1: applied after the user's ruling. Asked whether to remove the line and reword the unpushed commits, leave the history, or keep writing it, the user chose to remove it and reword. Every unpushed commit message on `wayfinder` was rewritten to remove each "Resolved on <model> ..." sentence and to name the consult without its model; every commit kept its tree, and the in-tree citations of the rewritten hashes were updated. Pushed commits keep the line. The model stays recorded in each ticket's Answer.
- H2: applied to the map's gist. The commit body cannot change without a rewrite, which waits on the user's H1 ruling.
- M1: applied. The eight long gists are rewritten, the longest now 461 characters.
- M2: applied as a dated note in ticket 17's Answer, and in the shortened gist.
- M3: applied to ticket 23's Answer and its gist.
- M4: applied to the map's two lines and to `upstream-bugs.md`'s bare ticket references. The research files' bare references are left, because they cite another file's section, not a ticket by name.
- M5: applied. The fog item now asks only about theme files and starter themes.
- M6: applied. Tickets 12, 13, and 25 gain the blockers the audit named, all resolved except 13, and 12 and 13 gain notes linking the research.
- M7: applied. `upstream-bugs.md` gains O1 (Nx), O2 (Chromium and WebKit), and Y7 (`bin/build.js`), and Y6 is struck through with its reason.
- L1, L2, L3: applied.
- L4, L5, L6, L14: applied as dated notes in tickets 16 and 22, and a scope clause in ticket 21.
- L7, L8, L10, L13, L15: applied.
- L9: not applied. Ticket 25 runs on `fable-high`, which has the context for it; it is split if it overruns one session.
- L11: no change, as the audit allows.
- L12: applied for the section signs in the two files named. The em dashes, arrows, and ellipsis in the accessibility research are left, because they sit in quoted text and tables, not in citations.
