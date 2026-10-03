# Audit 0004: final consistency review (tickets 35 to 93, the 54 specs, ticket 50's decisions 1 to 224, ADRs 0041 to 0045)

Date: 2026-10-03
Auditor: compliance auditor (Opus 5.5) with two read-only sweep subagents (Opus 5.5); read-only except this file

## Scope

Everything under `.scratch/ngx-yeti-specs/` as committed at HEAD `46074b3` ("decide the last components' open points"). `git status --short .scratch/ngx-yeti-specs` printed nothing before the audit, so the working tree equals HEAD for the bundle (checked).

The range is the 72 commits of `git log 46c57f8..HEAD -- .scratch/ngx-yeti-specs`, from the commit after "apply audit 0003's fixes" (`46c57f8`) to `46074b3`. In scope:

- the 54 specs under `specs/` and their tickets 38 to 49 and 51 to 92;
- tickets 35, 36, 37, 50 (decisions 1 to 224), and 93;
- `ledger.md`, `upstream-bugs.md`, ADRs 0041 to 0045, and the dated notes added since `46c57f8` to ADRs 0004, 0011, 0014, 0021, 0023, 0042, 0043, 0044, 0060, and 0080;
- `building-blocks.md`, `architecture-guide.md`, `CONTEXT.md`, `README.md`, and `map.md`.

Also judged: whether the map's destination is met, against the map's own Destination section and the `/wayfinder` skill (plugin cache, `mattpocock-skills` 1.2.3), and whether each spec follows the `/to-spec` template (same cache) and the map's Spec shape note (`map.md:144`).

Earlier audits' findings are not repeated unless they recur.

## Method

1. **Process (script).** `audit0004.mjs` (session scratchpad; audit 0003's script extended) checks every ticket's header lines, `## Question`, and `## Answer` when resolved; the blocking graph; one Decisions-so-far line per resolved ticket with link text equal to the title; and, new here, the 54 specs against ticket 11, each spec's `Ticket:` line against a resolved ticket that links it, and each spec's User Stories count against the count its map gist states. Section headings of all 54 specs were listed with `rg '^## '`.
2. **Spec sweep (two subagents, then checked).** Sweep A read the 22 specs that carry most contracts (the five shared specs, accordion, affix, alert, button, buttons, carousel, demo, dialog, dropdown, field, nav, pagination, progress, table, tabs, toc, tooltip); sweep B read the other 32. Both worked from one written brief with the 12 rules and 7 contracts of the audit brief, each in its canonical form with its ticket-50 decision. Each returned findings with file, line, quoted evidence, and a checked or inferred mark. I re-read the evidence for every High finding and for findings H1, M2, M4, M5, M7, M8, M10, and M11 below before accepting them, and changed one severity (M11's icon half was proposed as High).
3. **User words.** `rg` for every quotation introduced as the user's in the in-scope files, each compared with `map.md`; then every sentence with "the user chose / decided / ruled / ruling / rule / choice" (103 phrases), read in context. Ticket 50 read in full: every section's lead-in, and all 31 decisions it marks trap-quadrant plus the one HIGH-impact decision it does not mark (I read all of them, more than the 15 the brief asks for).
4. **Consistency (reading and `rg`).** Stale-text searches (`only Angular component`, `<yeti-demo`, the old `data-ngx-yeti-item="` form, `not yet decided`, `not yet taken`, `pending ticket 35`, `OPEN FOR HUMAN`, `(open: see ticket)`, `carousel's index`, `pointerover`, `same task`); the ledger's rows and owners against the spec list and against every `A11Y-*` id in the bundle; `upstream-bugs.md` rows; ADRs 0041 to 0045 read in full.
5. **Citations.** `cites0004.sh` (scratchpad) printed 52 cited ranges; the sweeps read 16 more. The clones were at `f52d1e8b9` (Yeti), `5db6fc4453` (Angular), and `708d4c6e2` (components), with clean trees (checked).
6. **Hygiene.** Commit messages written to `commits0004.txt` without author or committer fields and searched; banned words, attribution, model and effort, non-ASCII, the verb "drop", identity by allowlist inversion, the temporary-file prefix, and the link check with a positive control.
7. **Not re-run:** any browser, SSR, Playwright, or npm measurement. No web access.

### Link check

`node <scratchpad>/audit0004.mjs` from the repository root, over the committed bundle (222 `.md` files, audits 0001 to 0003 included; this file not yet written):

```
links checked: 5803 in 222 file(s)
NOTE 36-research-boundary-and-error-blocks.md: Blocked by: none        (see L11)
NOTE 50-decide-open-points-of-the-specs.md: Blocked by: none           (see L11)
tickets: 93 {"grilling/resolved":14,"research/resolved":15,"prototype/resolved":9,"task/resolved":55}
gist lines: 93
specs: 54
19 x PROBLEM spec <name>.md: <n> spec tickets link it                   (script artefact, see Verified OK)
```

No link is broken. The 19 "spec tickets link it" lines are the script counting every ticket that cross-references a spec; the stricter check by each spec's `Ticket:` line printed no problem.

Control: `ctl0004/ctl.md` in the scratchpad, with one resolving link and anchor, one missing file, one missing anchor, and one broken link inside a code span, printed `link target missing: nope.md` and `anchor missing: ctl.md#no-such`, then `FAIL 2`, exit 1; the code-span link was skipped, as designed. The result for this file is at the end.

### Hygiene commands (exact, with exit codes)

`$SP` is the session scratchpad. `bw.txt`, `bw2.txt`, and `bw3.txt` are audit 0002's pattern files, kept in files so the words do not appear here.

| Command | Exit | Reading |
| --- | --- | --- |
| `rg -i -c -e '<bw.txt line 1>' .scratch/ngx-yeti-specs` | 1 | no banned word in the bundle |
| `rg -i -c -f "$SP/bw2.txt" .scratch/ngx-yeti-specs` (spaced variants) | 1 | no spaced variant |
| `rg -i -l` with each of the two words of `bw3.txt`'s pair, over the bundle | 0, 1 | the first word in five specs (Yeti's own colour-scale term), the second nowhere, so the pair never appears together |
| `rg -i -n -f "$SP/bw.txt"`, `-f bw2.txt`, `-f bw3.txt` over `commits0004.txt` | 1, 1, 1 | none in the 72 commit messages |
| `rg -i -c -f "$SP/bw.txt" "$SP/ctl3.txt"` (control: one banned word) | 0 | the pattern works |
| `rg -i -n 'co-authored-by\|generated with\|claude\|anthropic\|noreply' commits0004.txt` | 1 | no trailer, no generated-with line |
| `rg -i -n 'opus\|sonnet\|fable\|haiku\|\beffort\b\|\bmodel\b' commits0004.txt` | 1 | no message names a model or effort |
| `rg -n -P '[^\x00-\x7F]' commits0004.txt` | 1 | commit messages are ASCII |
| `rg -i -n '\bdrop' commits0004.txt` | 0 | two hits, both the item name `dropdown` |
| Identity: `git log 46c57f8..HEAD --format='%ae%n%ce'`, each value compared with the approved public address by `awk` | - | 144 of 144 author and committer fields equal the approved address; no other value |
| Identity: `rg -n -o -uu '<email-shaped regex>' .scratch/ngx-yeti-specs \| rg -v -F '<approved address>'`, domains masked | - | 2 tokens, the same two `git@<host>` SSH remotes audit 0003 recorded (`prototypes/yeti-github-dependency/README.md:40`, `optA/lock-entry.txt:3`); not a person's address. Control file with the approved address and one reserved example address printed only the example, masked |
| The same regex over `commits0004.txt` | 1 | no email-shaped token in any commit message |
| Temporary file: `rg -n -uu -F '<the prefix the brief named>'` over the bundle, over `commits0004.txt`, and over the range's changed file names | 1, 1, 1 | nothing references it; control file with the prefix: exit 0 |

I searched for no domain at any point and wrote none here.

## Findings

Counts: High 1, Medium 19, Low 15.

### High

**H1. The dropdown cancels `opened` when a close starts during the opening wait; the dialog and the nav complete the wait at once, and decision 91 says nothing about cancelling.** (checked)
Files: `specs/dropdown.md:212` (Completion, point 5: "A new change cancels a pending wait, and the cancelled change emits nothing (ticket 50 decision 91)") and `:398` (layer 2: "a close during the opening wait cancels `opened` (ticket 50 decision 91)"); against `issues/50-decide-open-points-of-the-specs.md:339` (decision 91: "`opened` and `closed` fire for every open and close, whatever started it"), decision 153 (`:519`, the dialog: "a running wait completes at once when the opposite change starts"), `specs/dialog.md:194` and `specs/nav.md:216` ("A wait still running when the opposite change starts completes at once, so a `closed` always precedes the next `opened`").
Rule: rule 1 (one open-state contract across the items with an open state); the dropdown and nav contract (two popovers of the same shape, decision 91 option B's reason).
Evidence: an implementer following the dropdown spec emits no `opened` for an open that was followed quickly by a close, while the nav, built from the same decision, emits `opened` then `closed`. The citation gives the cancel a source that does not hold it.
Fix: give `dropdown.md:212` the dialog's and nav's sentence, turn the layer-2 case at `:398` around ("a close during the opening wait completes it at once, so `opened` precedes `closed`"), and cite decisions 91 and 153.

### Medium

**M1. Testing at the floor browsers still reads "not decided" in 48 specs and three records, after ticket 93 decided it.** (checked)
Files: the sentence "Testing at the floor browsers is not decided yet ([building-blocks.md](../building-blocks.md) Part 4; ADR 0014 point 7)" or a variant in 48 of the 54 specs (for example `specs/accordion.md:354`, `specs/dialog.md:401`, `specs/tooltip.md:400`, `specs/center.md:293`), with "Testing at the floor browsers (building-blocks Part 4)" listed under Out of Scope in most; `specs/setup.md:357` ("undecided ... map, Not yet specified"); `specs/attention.md:199`; `building-blocks.md:336` (Part 4: "the testing decision's, not yet taken"); `map.md:188` (gist of ticket 27: "not yet decided (Not yet specified)").
Rule: no stale statement after a decision; wayfinder (resolving a ticket updates what it invalidates).
Evidence: [Decide: the browser provider and the floor engines for testing](../issues/93-decide-testing-at-the-browser-floor.md) resolved it, and ADR 0014 has the dated note (`adr/0014-testing-stack-for-yeti.md:37`). Its Answer says "Every spec's Testing Decisions name "layer 2" and "layer 4" without a provider, so no spec changes", which overlooks these sentences. An implementer reading any spec is told the floor job does not exist.
Fix: replace the sentence in each spec with "Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically)", remove the Out of Scope bullet, and update Part 4, `setup.md:357`, and the ticket-27 gist.

**M2. Decision 45's `injectYetiItemStyles` is not named in 33 of the 49 item specs.** (checked by `rg --files-without-match`; sweep B read the cases)
Files: billboard, attention, badge, cover, alert, columns, container, icon, cluster, grid, scroller, hero, print, visually-hidden, overlay, affix, center, media, timeline, enter, button, lift, sidebar, stack, breakout, lede, frame, buttons, shell, layer, masonry, box, and breadcrumbs. Most say the directive "injects the root styles service of ADR 0060" and "acquires in its constructor" (for example `specs/billboard.md:99`); `specs/visually-hidden.md:112` names the prototype's `YetiStyles`; layer-2 cases test through "a double of ADR 0060's styles service" (`specs/attention.md:176`, `specs/enter.md:256`) or "the service's public API" (`specs/print.md:238`); 23 of them link the setup ticket (`../issues/38-spec-setup.md`) instead of `setup.md`, and `enter`, `print`, and `visually-hidden` link neither. `specs/setup.md:205` and `:397` call the button's spinner acquisition the busy button's, where decision 109 makes it unconditional.
Rule: decision 45 ("An item's root directive calls `injectYetiItemStyles('<item>')` as the last statement of its constructor ... The root service stays unexported ... Every item spec links setup for the loader and does not restate it").
Evidence: decision 45 keeps the service unexported, so a layer-2 double of it or a direct injection cannot be built as written.
Fix: one sentence in each spec's DI and Lifecycle rows naming `injectYetiItemStyles('<item>')` as the last constructor statement, linked to `specs/setup.md`; point the layer-2 cases at the helper or at the `<link>` in the DOM; correct `setup.md:205` and `:397` to "acquires `spinner` with `button`" (decision 109).

**M3. Five places still call `demo` the package's only Angular component; the field spec calls `YetiFieldError` a Part directive.** (checked)
Files: `specs/demo.md:23`, `:162`, `:390`; `map.md:196` (gist of ticket 25: "`demo` the only Angular component"); `map.md:247` (gist of ticket 80: "the package's only Angular component"); `README.md:92` ("(the only Angular component)"); `specs/field.md:28` ("the two **Part directive**s", one of them `YetiFieldError`).
Rule: decision 159 (`YetiFieldError` is an attribute-selector Angular component, the package's second); `CONTEXT.md` "Angular component" and `building-blocks.md:338` already say two.
Fix: "one of the package's two Angular components (with `YetiFieldError`, decision 159)" in each; in `field.md:28`, "`YetiFieldHint`, a Part directive, and `YetiFieldError`, an attribute-selector component".

**M4. The carousel's index, and the accordion's `open`, are still listed as models after decisions 121 and 96.** (checked)
Files: `building-blocks.md:54` (1.4: "the carousel's index (`yeti:slide`)", and "a `details`'s `open` where the accordion spec mirrors it"); `architecture-guide.md:176` (P10: "a carousel's index"); `specs/events.md:135` (rule 8: "the carousel's index").
Rule: decision 121 (a read-only `current` signal, no model; its "To overrule" says "Either way, correct building-blocks 1.4 and events rule 8 to match whichever wins"); decision 96 (the accordion has a read-only `isOpen` signal and no model input).
Fix: in all three, replace the carousel clause with its read-only `current` signal (decision 121), and in 1.4 replace the accordion clause with decision 96's signal and output.

**M5. Events rule 9 and user story 22 say state found at creation never emits; decisions 146 and 199 have a model emit at creation.** (checked)
Files: `specs/events.md:136` ("State found when the directive is created emits nothing") and `:47` (story 22); against decision 146 (`isOpenChange` emits at the first render when the element differs from the bound value), applied in `specs/dialog.md:189`, `specs/dropdown.md:214`, and `specs/nav.md:211`, and decision 199 (the tabs' default "emits `selectedChange` once"), applied in `specs/tabs.md:200`. Both item specs cite events rule 9 beside it.
Rule: one rule read the same way in the shared spec and the item specs.
Fix: limit rule 9 and story 22 to the outputs that stand for Yeti events (`opened`, `select`, `slide`, `current`), and add that a model's `xChange` emits once at creation where decisions 146 and 199 say so.

**M6. The nav says its open-state read is in a render callback.** (checked by sweep A)
Files: `specs/nav.md:382` ("The open-state read is in a render callback, which is the package's only platform-dependent code path") and `:365` ("the first-render read"); against decision 91 ("The dropdown's and the nav's "first render" and `afterNextRender` readings are replaced by the creation-time read") and the nav's own `:210` and `:379`.
Fix: rewrite `:382` (the read runs at creation, on the server's DOM too, with no platform branch) and say "creation-time read" at `:365`.

**M7. Part 2 row 34 still gives the nav the root as its focus-out boundary.** (checked)
File: `building-blocks.md:285` ("Focus-out close as row 32's", where row 32 closes when `relatedTarget` is outside the root); `specs/nav.md:218` cites row 34 for the list-and-toggle condition.
Rule: decision 167 and its ADR 0043 note (the condition is the list and the toggle).
Fix: amend row 34 to name the list-and-toggle condition (decision 167); row 32 can also name decision 92's one-shot flag.

**M8. Buttons user story 23 asks for the single Tab stop that decision 113 replaced.** (checked)
File: `specs/buttons.md:52` ("I want the server HTML to have exactly one reachable member per toolbar"); against decision 113 option B and the spec's own `:116`, `:229`, `:369`.
Rule: rule 11 (buttons: every member keeps its native Tab stop until Aria is live; tabs: one Tab stop).
Fix: "every member reachable by Tab in the server HTML, and one Tab stop once Aria is live".

**M9. The field e2e does not assert the merged `aria-describedby` after hydration.** (checked by sweep A)
File: `specs/field.md:502` (asserts only no `NG05xx` for a control with a static `aria-describedby`); against decision 46 ("the field spec's e2e should assert no `NG05xx` and the composed value after hydration"). The tooltip has the full case (`specs/tooltip.md:392`).
Fix: add "and the control's `aria-describedby` equals the consumer's ids followed by the hint's id after hydration".

**M10. The affix spec says hydration leaves typed values in place; decision 161 says hydration clears them and only `YetiFieldControl` keeps them.** (checked)
Files: `specs/affix.md:226` ("which Angular's forms own and hydration leaves in place") and `:228`; against decision 161 and ledger A11Y-28. The affix e2e at `:298` expects the value to survive, which holds only through the field's adoption.
Fix: attribute the survival to `YetiFieldControl`'s pre-hydration adoption (decision 161, A11Y-28), and state that an affix control outside a package field is not covered.

**M11. Two `removed`-kind specs lack the e2e case that no frame paints with the static attribute.** (checked)
Files: `specs/icon.md` Layer 4 (Testing Decisions, "Layer 4: Playwright e2e") has no `align` case, although `:114` says "the e2e case asserts that no frame paints with `align` present"; `specs/tabs.md:415-429` has no case for the static `disabled` of decision 202 (layer 3 at `:411` asserts only its absence).
Rule: decision 9 ("Each such spec adds an e2e case ... If that case fails, the fallback is option B for every `removed`-kind spec") and decision 202 ("layer 4 that no frame paints with it"). The other seven `align` specs, the grid's `start`, the table, and the button's disabled link have the case (for example `specs/cluster.md:309`, `specs/table.md:409`, `specs/button.md:350`).
Fix: add the fixture-app case to both, in the cluster's form (a `MutationObserver` before the main bundle and a `requestAnimationFrame` probe).

**M12. Two specs claim the wrong ledger rows.** (checked by sweep A)
Files: `specs/tooltip.md:270` ("proposes three changes ... A new row for the fallback's reflow is proposed ...; the spec writes no ledger row itself"); against decisions 215 to 217 and 220, ledger A11Y-2 (rewritten) and A11Y-29 (owner `tooltip`), and Part 2 row 42. `specs/dropdown.md:295` and `:7` claim only A11Y-3a; ledger A11Y-27 has owner `dropdown` (decision 157), and the spec uses it at `:227` and `:284`.
Rule: every ledger row a spec owns is claimed, and every claim is in the ledger.
Fix: "Ledger rows owned: A11Y-2 (decisions 215 to 217) and A11Y-29 (decision 220)" in the tooltip; add A11Y-27 to the dropdown's `:295` and `:7`.

**M13. "Open point" text that decisions have settled, in sections an implementer reads.** (checked)
Files: `specs/setup.md:147` ("the last line's specifier is open (see ticket, point 2)"; decision 68) and `:177` ("Which form the documentation leads with is open"; decision 70); `specs/lift.md:191` (decision 12); `specs/spinner.md:105`, `:183`, `:186`, `:278`, `:290`, `:292`, `:321` (decisions 109, 110, 190 to 193); `specs/center.md:29` and `:190` (quotes A11Y-9's old cell "Undecided until the spec traces the cause" as current; decision 32 rewrote the row).
Fix: replace each with the decision it now rests on.

**M14. The overlay's veil story puts text on a translucent scrim and asserts no contrast.** (checked by sweep B)
File: `specs/overlay.md:291` (`overlay--veil`, "Saving..." on `var(--yeti-color-scrim)`); `overlay--default` (`:198`, `:289`) asserts 4.5:1 without naming the light and dark schemes.
Rule: decisions 8 and 55 (text over a translucent scrim composited over black and over white, at least 4.5:1, in both schemes).
Fix: add decision 55's assertion to `overlay--veil` and "in the light and dark schemes" to `overlay--default`.

**M15. The frame's examples use a plain `<img>`, against its own `NgOptimizedImage` rule.** (checked by sweep B)
File: `specs/frame.md:189` and `:325`; against building-blocks 1.2's images rule and the spec's usage rule 6 (decision 35: `fill` plus `position: relative`).
Fix: rewrite both examples in decision 35's form.

**M16. Decision 1 is HIGH impact with inferred confidence and has no options record.** (checked)
File: `issues/50-decide-open-points-of-the-specs.md:17` ("Scoping the Aria id provider (ticket 39, point 1, HIGH impact, inferred)"), with a reason and a test but no options, no reason per option, no confidence statement, and no "to overrule". It is the only HIGH-impact decision in ticket 50 not marked trap-quadrant (`rg` over every decision's impact and confidence label). Its ADR 0044 note (`adr/0044-...md`, last bullet) has no record either.
Rule: the map's "Trap-quadrant decisions in full AFK mode" ruling (`map.md:108`): every orchestrator decision with HIGH impact and NOT-HIGH confidence gets the question, the options, why each was approved or dismissed, the evidence and its confidence, and what to change to overrule it. Decision 1 was taken before that ruling was recorded (commits `c675a5d`, then `0522978`), and was not brought up to it.
Fix: add the record from ticket 39's point 1 (at least: scope to Aria's prefixes; provide for the whole element; provide at application level, which ADR 0044 already rejects), with the confidence and the overrule path.

**M17. ADR 0044 left the shared-boundary rule's new reason "the orchestrator's to record", and nothing records it.** (checked)
Files: `adr/0044-...md:54` ("Whether the shared-boundary rule stays for another reason is the orchestrator's to record"); ticket 35's item 2 (`issues/35-...md:88`: "Either restate the shared-boundary rule with another reason or retire it"); `specs/generated-ids.md:213` ("not this spec's"). The rule is still applied as a usage rule (`building-blocks.md:163`, 1.11 decision 6; `specs/dropdown.md:229`, `specs/tooltip.md:206`, `specs/field.md:277`), while ADR 0013:29 and ADR 0021:27 still give the retired id reason, with no note.
Rule: under the full-AFK ruling nothing is left for later (`map.md:107`); a rule whose recorded reason is retired needs a new one or removal.
Evidence: the dialog spec gives other reasons (`specs/dialog.md:213`: the Backdrop press, the focus return, the outputs); that reasoning is not in a record.
Fix: one dated note on ADR 0011 clause 7 restating the rule with the dialog spec's reasons (or retiring it), and notes on ADR 0013 and ADR 0021 pointing at it.

**M18. 59 of the range's non-claim commits have no body, and three subjects exceed 72 characters; audit 0003's resolution promised both would stop.** (checked by script)
Evidence: 61 of the 72 commits have an empty body; two are claims (`1650495`, `c688a7f`); the other 59 include all 54 "write the <item> spec" commits, `0522978` (it records a user ruling), and `d90cd4d`. Subjects over 72: `5fac3d0` (91), `325a775` (79), `c675a5d` (78). Every subject is `docs(wayfinder): ...` in lower case, and every spec has exactly one "write the <item> spec" commit (checked).
Rule: the map's commit rule ("with a body that gives the why", `map.md:40`); audit 0003 L12's resolution ("Later commits keep subjects at 72 characters or fewer, with a body for every non-claim commit").
Fix: none for these commits short of a history rewrite, which I do not propose; keep the rule for later commits.

**M19. Two specs attribute more to the user than the map quotes.** (checked)
Files: `specs/tabs.md:344` ("which the user's ruling chose"), `:347` ("the residue the user's ruling accepts"), `:359` ("`hidden` and `inert` appear after Aria is live, as the user ruled"), `:532` ("This follows from A11Y-17 and the user's ruling"); `specs/breadcrumbs.md:136`, which quotes the user as "only reach for Angular Aria when it addresses an accessibility feature that Yeti is missing".
Rule: only the map's verbatim quotes are the user's (`map.md:43`).
Evidence: the user's words for `tabs` are the option label "All panels show (Recommended)" (`map.md:97`); the sentence after it, about hiding panels once live, is the map's description, and the residue and `inert` are decision 206's. The user's sentence at `map.md:89` begins "Generally," and spells "accesibility"; the breadcrumbs copy removes the first word and corrects the spelling inside quotation marks (the accordion and pagination copies keep the user's spelling).
Fix: in `tabs.md`, cite the label and attribute the specifics to the map's description and decision 206; in `breadcrumbs.md:136`, quote exactly or paraphrase without quotation marks.

### Low

**L1. More "open point" and "proposes" wording left after decisions.** (checked by the sweeps) `specs/alert.md:229`, `:402` (decisions 103, 105); `specs/button.md:157`, `:336`, `:354` (decisions 108, 110); `specs/buttons.md:353` (decision 115) and `:408` (the content query now detects a member-less group, decision 112); `specs/carousel.md:316` (decision 134); `specs/table.md:429` (decision 197); `specs/print.md:332` (decision 12); `specs/box.md:325` (decisions 29, 30); `specs/badge.md:317` (decision 78); `specs/seam.md:315`, `:328`, `:336` (decision 183); `specs/breadcrumbs.md:316` (decision 87). Fix: replace each with its decision.

**L2. Small stale lines in the shared and component specs.** (checked by sweep A) `specs/dialog.md:523` says building-blocks 1.8 lists `requestClose()` as outside the target (decision 154 corrected 1.8); `specs/navigation-close.md:118` describes the dialog's state as following `close` and `command` (decision 147: `toggle`); `specs/fragment-links.md:132` (usage rule 2) names only the static `href`, not the selector-named inputs of decisions 126 and 208; `specs/nav.md:310` says A11Y-3b's Verified cell "reads *inferred*" and then "now reads *measured*". Fix: correct each.

**L3. Two specs list five `NgxYeti` collisions.** `specs/billboard.md:104` and `specs/visually-hidden.md:118`; decision 10 adds `NgxYetiPaint` as a sixth. Fix: name six, or point at decision 10. (checked by sweep B)

**L4. The cluster spec does not use `YetiScrollerJustify`.** `specs/cluster.md:143` still writes `Extract<YetiJustify, 'start' | 'center' | 'end'>`; decision 60: "The consistency review aligns the cluster spec's inline wording with it". Fix: name the type. (checked by sweep B)

**L5. A11Y-22's sharers are incomplete in two specs.** `specs/sidebar.md:211` and `specs/shell.md:220` say "shared with `stack` and `shell`"; the ledger row also lists `nav` and `table` (decisions 170, 195). Fix: add both. (checked by sweep B)

**L6. The box's usage rule allows 3:1 for large text.** `specs/box.md:171` ("4.5:1 (3:1 for large text)"); decision 8 holds 4.5:1 for any size, and the box's own play functions assert 4.5:1. Fix: remove the large-text clause. (checked by sweep B)

**L7. Decisions cited by topic or ticket point instead of number.** `specs/grid.md:7`, `:127`, `:138`, `:167`, `:345`; `specs/layer.md:22`, `:189`, `:288`, `:328`; `specs/stack.md:7`, `:352`; `specs/timeline.md:217`; `specs/tabs.md:36` (ticket 77 "open point 2, option B" for decision 113); `specs/field.md:7` and `:535` (decision 46 by description). `specs/field.md:7` also leaves A11Y-28 out of its deciding records, though `:349` owns it. Fix: cite decision numbers; add A11Y-28. (checked by the sweeps)

**L8. Some `file:line` citations do not hold.** (checked) Yeti's `src/components/field/validate.js` has 84 lines at the pin, so `validate.js:117-119` and `:119` (`issues/50-...md:544`, `:548`; `issues/83-spec-field.md:31`, `:35`; `specs/field.md:320`, `:542`) and `:127-142` (`issues/83-spec-field.md:50`) point past its end; the focus call is at `:59-61` (`controls[0].focus()` at `:61`), which the research cites correctly (`research/yeti-validate-and-signal-forms.md:38`). `control_native.ts:59-61` (decision 161 at `issues/50-...md:551`, `ledger.md:63`, `issues/83-spec-field.md:39`) is the `onReset` handler; the update that writes the model into the control is `:119-125` (`setNativeControlValue(input, controlValue)` when `controlValue` changed). Fix: cite `validate.js:59-61` and `control_native.ts:119-125`; for `:127-142`, cite the lines that clear a fixed control or mark the claim inferred.

**L9. Small stale lines in the map, the guide, and the README.** `map.md:58` (the Prefix sub-bullet's selector example is still `<yeti-demo>`; decision 223 updated ADR 0080 and `CONTEXT.md`, not the map); `map.md:265` (Not yet specified opens with "The bundle index is written", which is done work, not fog); `architecture-guide.md:258` (P16 Why: "the only Aria pattern that fits Yeti's elements is Tabs", while `buttons` hosts Aria Toolbar). Fix: `figure[yetiDemo]`; leave only the audit line under Not yet specified; name Tabs and Toolbar.

**L10. Implementation Decisions carry file paths and code that `/to-spec` says to leave out, and no spec carries the `ready-for-agent` label.** (checked by script) The 54 specs hold 942 `file:line` citations and 61 fenced blocks inside their Implementation Decisions sections (`tabs` alone 60 citations); `/to-spec` says "Do NOT include specific file paths or code snippets", with an exception only for prototype snippets. `rg ready-for-agent` over the bundle: exit 1; no spec or spec ticket has a label line for it (`/to-spec` step 3). The map's Spec shape note (`map.md:144`) records two substitutions but not this one. The citations are what makes the specs checkable, so this reads as a deliberate shape. Fix: one sentence in the Spec shape note recording both choices (citations kept as evidence; the label left to the implementing repository's tracker), rather than rewriting the specs.

**L11. `Blocked by: none` recurs.** `issues/36-research-boundary-and-error-blocks.md:5` and `issues/50-decide-open-points-of-the-specs.md:5`; audit 0003 L3 emptied the same form in tickets 28, 31, and 33, and the tracker doc's form is `Blocked by: NN, NN`. Fix: leave both lines empty. (checked by script)

**L12. ADR 0045's header differs from the other ADRs.** `adr/0045-...md:3` is a prose `Status: accepted, 2026-10-03. ...` line with no YAML front matter, while ADRs 0041 to 0044 open with `status: accepted` front matter. Fix: add the front matter and keep the sentence as the record's first paragraph. (checked)

**L13. Non-ASCII characters in the bundle's own prose.** Multiplication signs in `specs/center.md:186`, `issues/53-spec-center.md:21` and `:44`, `issues/50-...md:133`, `issues/35-...md:75`, `specs/tabs.md:112`; ellipses in `specs/center.md:338`, `:369`, `specs/pagination.md:264`, `:444`, `specs/setup.md:345`, `specs/demo.md:280`; arrows in `specs/progress.md:202` and `specs/spinner.md:196`. The glyphs inside markup examples (the multiplication sign and the single angle quotation marks as button and separator content in alert, nav, pagination, and breadcrumbs), the em dashes inside Yeti quotations (`specs/accordion.md:11`, `specs/overlay.md:160`), and Angular's U+0275 identifiers stay. Fix: `x`, `...`, `->` in the prose. (checked)

**L14. "Drop" used for a non-destructive action.** `specs/events.md:27` ("maps onto the package by dropping five characters"). Older uses outside this range that audit 0003 L11 did not list: `issues/07-...md:164`, `issues/09-...md:115` and `:141`. Uses that describe software or layout (`specs/media.md:93`, the research files) and quotations (`specs/shell.md:97`) are left out. Fix: "removing", "abandoned", "no longer applies". (checked)

**L15. Ticket 93's Answer says no spec changes.** `issues/93-decide-testing-at-the-browser-floor.md`, last paragraph: "so no spec changes"; M1 shows 48 specs that state the opposite of its decision. Fix: a dated note once M1 is applied. (checked)

## Verified OK

Destination and process (script, then reading):
- All 54 specs of ticket 11's list (49 items and five shared specs, `setup` included) exist under `specs/`, each with a `Ticket:` line naming a resolved ticket that links it back, and every spec ticket names an existing spec. One "write the <item> spec" commit per spec.
- All 93 tickets have `Type:`, `Status: resolved`, `Blocked by:`, `Labels:` equal to `wayfinder:<Type>`, `Map: ../map.md`, a numbered title, `## Question`, and `## Answer`. No blocking edge names a missing ticket; no cycle.
- Decisions so far has exactly one line per resolved ticket (93 of 93), each with link text equal to the ticket's title. Every spec gist's user-story count equals the spec's numbered stories (54 of 54).
- Not yet specified names only the bundle index (L9) and this audit. Out of scope (`map.md:269-272`) is current: Foundation 6.9, implementing the specs, changing Yeti or filing upstream without confirmation, moving the bundle; nothing in the range ruled anything new out of scope.
- `/to-spec` template: all 54 specs have the seven sections in order (Problem Statement, Solution, User Stories, Implementation Decisions, Testing Decisions, Out of Scope, Further Notes); every numbered story is in the "As a/an ..., I want ..., so that ..." form (script); Implementation Decisions use the contract mapping and the item-file section the Spec shape note asks for (both sweeps). The seam check with the user is skipped by the full-AFK ruling, as `map.md:107` records.
- Wayfinder: ticket 50 and ticket 93 are grilling tickets the orchestrator resolved alone; the user's full-AFK ruling (`map.md:107`) allows that, and both say the decisions are not the user's.

User words (read):
- Every quotation introduced as the user's in the in-scope files matches the map: "Accessibility CSS: Yes." (14 copies), "Selector name (Recommended)" (9), "Custom disclosure nav (Recommended)" (6), "Aria Toolbar by composition (Recommended)" (5), "Heading in summary (Recommended)" (4), "All panels show (Recommended)", "Composition (Recommended)", "Custom: links + prev/next (Recommended)", "Prerelease tag (Recommended)", "Counter replaces it in 0.x (Recommended)", "Ledger only", "54. Make sure that we always comply with ...", "58. Specs should assume ...", and "#55 ... Option 1" (elided with "..."). Exceptions: M19.
- Ticket 50: every section's lead-in says the decisions are the orchestrator's under full AFK mode and none is the user's (`:11`, `:15`, `:47`, `:196`, `:332`, `:632`); decision 95 marks its reading of the Package CSS ruling as the orchestrator's reading. ADR notes from ticket 50 say "the orchestrator's, not the user's". `README.md` says the same.
- Trap quadrant: I read all 31 decisions ticket 50 marks (9, 12, 17, 21, 32, 46, 47, 48, 91, 95, 100, 108, 112, 113, 121, 122, 126, 137, 144, 146, 159, 160, 161, 167, 179, 198, 199, 207, 208, 215, 220) and ticket 93. Each has the question, the options, why each was approved or dismissed, the evidence with its confidence, and how to overrule; decision 12 holds its record in ADR 0045, which has all five parts. The one HIGH-impact decision without a record is M16.

Consistency (sweeps, checked where noted above):
- Rule 1, open state: accordion, dialog (keeps `open()` and `close()`), dropdown, nav, and tooltip read the state at creation, treat parent writes as commands, and bind no `open`; exceptions H1 and M6.
- Rule 2, `pointerdown`: the one-shot flag with a zero-delay timer in dropdown and nav, the residue "as it does live", and layer-4 pre-hydration presses in dialog, dropdown, and nav; `pointerover` and `same task` appear nowhere as current behaviour.
- Rules 3 to 5: the static form in every `removed`-kind spec's SSR smoke; `data-ngx-yeti-item-<item>` on every item root and on no part or any-element marker; the old `data-ngx-yeti-item="` form appears only in records that describe the change (ADR 0045, ADR 0060's note, ticket 13, and spec tickets' history). Exceptions M11.
- Rule 7: merging in field, tooltip, and affix; exception M9. Rule 8: `injectYetiId` and `provideYetiAriaIds()` in generated-ids, tabs, buttons, nav, dropdown, dialog; no consumer `id` on Aria-hosting parts; no bound `[id]`. Rule 9: `figure[yetiDemo]` in demo, `CONTEXT.md`, ADR 0080's note; current-tense `<yeti-demo>` only at L9. Rule 11: buttons and tabs agree apart from M8. Rule 12: text at 4.5:1 in both schemes (lede, breakout, media, timeline, box, badge, card, seam, dialog), states drawn by colour at 3:1 (button, pagination), scrim over black and white (layer), focus ring 3:1 (scroller, dropdown), spinner edge 3:1; exceptions M14, L6.
- Contracts: button and buttons (`yetiButtonsItem` beside `yetiButton`, `busy`, the part selector without `label`, `YetiButtonDisabledLink`); button and dialog (`YetiDialogOpener`, ADR 0022); carousel and toc (one selector-named link-input shape; decision 214's wording); events against outputs (alert's `closed` on the dismissal; completion outputs for dialog, dropdown, nav; `select`, `slide`, `invalid`, `current`); exceptions H1, M5, M9, M10.
- Ledger: 40 rows (A11Y-1a to A11Y-29), every Owner one of the 54 specs (22 distinct owners); every `A11Y-*` id cited anywhere in the bundle exists, apart from ticket 81's proposal text "A11Y-1 with the next letter", which became A11Y-1g. `upstream-bugs.md` rows Y8 to Y13 and A6 to A9 carry evidence, verification, and "not filed" where filing needs the user's confirmation.
- ADRs 0041 to 0045 read in full. ADR 0042's and ADR 0043's later notes correctly mark which points ADR 0044 and decision 92 replace; ADR 0044's decision 1 note and the `yetiButtonsItem` correction are present. The audit 0003 "pending ticket 35" markers are gone (`rg`, exit 1).

Citations (all hold except L8):
- Angular at `5db6fc4453`: `event_type.ts:335` (`'pointerdown'` in `BUBBLE_EVENT_TYPES`) and `:287-292` (`MOUSE_SPECIAL_EVENT_TYPES`); `event_replay.ts:248-255`; `model_signal.ts:80-84`; `instructions/shared.ts:259-265`; `compiler/src/render3/view/util.ts:213-217`; `sanitization/dom_security_schema.ts:79`, `:127-153`, `:144-155`; `iframe_attrs_validation.ts:15-34`; `html_sanitizer.ts:52-112`; `form_root.ts:45-56`; `api/structure.ts:463` (`submit`); `test_bed.ts:95-100`, `:441`, `:732`; `di/interface/service.ts:32`; `transfer_state.ts:134`; `instructions/element.ts:140-144`; `directive-composition-api.md:33`, `:50`; `hydration/interfaces.ts:45`; `defer/interfaces.ts:242`; `content-projection.md:184-186`; `hydration.md:101`; `attrs_utils.ts:191-197`; `ng_optimized_image.ts:260-263`; `router_link_active.ts:135-139`.
- Components at `708d4c6e2`: `toolbar-widget.ts:67`, `:70`; `list-focus.ts:62-64`, `:77-83`; `private/toolbar/toolbar.ts:202-206`; `aria/toolbar/toolbar.ts:49-52`; `private/tabs/tabs.ts:227-246`; `tabs/tab-panel.ts:108-110`; `tabs/tab.ts:62`; `button-base.ts:60`, `:205-207`; `input.ts:243`; `form-field.ts:759`; `overlay-keyboard-dispatcher.ts:31`; `material/tooltip/tooltip.ts:561-568`, `:942-948`; `id-generator.ts:34-36`; `cdk/private/visually-hidden/visually-hidden.ts:15-21`.
- Yeti at `f52d1e8b9`: `layouts/attributes.css:333-342`, `:465`; `tokens/space.css:56-69`; `tokens/tokens.json:125-126`; `guides/layouts.md:115`; `guides/color.md:80`; `center/center.css:5`, `:12`, `:15`; `masonry/masonry.css:29`; `layer/manifest.json:72`; `layer/layer.css:24-34`; `demo/demo.js:8-12`, `:74`; `field/validate.js:40-43`; `field/docs.md:39`; `tooltip/tooltip.css:11-27`, `:56-60`; `test/browser/components/tooltip.spec.js:101`, `:138`; `tabs/tabs.js:40`; `alert/alert.js:13-18`, `:24-29`; `nav/nav.css:148-173`; `enter/enter.js:23-31`; `enter/enter.css:103-114`; `toc/toc.js:12-19`; `dialog/dialog.js:53-65`; `bin/validate.js:106-112`, `:703-717`.

Hygiene: no banned word, spaced variant, or paired term in the bundle or the 72 commit messages, with a working control; no AI attribution and no model or effort line in any commit message; all 144 author and committer fields equal the approved address; no email-shaped token in the bundle other than the two git SSH remotes from wave 2; nothing references the user's temporary file. Links: 5,803 relative links in 222 files, none broken.

Not checked: the sweeps read every spec's Solution and Implementation Decisions, but not every line of every spec (sweep A did not finish the later sections of carousel, toc, generated-ids, fragment-links, navigation-close, and field; sweep B read 20 specs by section); the `@mdn/browser-compat-data` versions in decision 147; the Understanding document for WCAG 2.5.7 (decision 144 marks it not read); every measurement claim in tickets 35 to 37 and the prototypes.

## Destination

Not met yet, by the map's own test. `map.md:9` says "The map is done when all specs exist under `specs/`, every carried-over requirement ... has been triaged and recorded here, and the consistency review has passed." The first two hold (54 of 54 specs; tickets 07, 08, 09 resolved). The review has not passed: H1 is a contract that differs between two items built from one decision, and M1 to M19 leave stale or contradicting text in sections an implementer reads. By `/wayfinder` the route is otherwise clear: every ticket is resolved, the fog names only this audit, and no finding needs a new ticket. Two findings ask for a decision record (M16, M17); the rest are edits to existing text. Once those are applied, the destination is met.

## Resolution log

Applied 2026-10-03 by the orchestrator under the user's full-AFK ruling. The four choices the audit left open are [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 225 to 228, the orchestrator's and not the user's.

- **H1:** fixed. `specs/dropdown.md` section 4 item 5 and its layer-2 completion case follow decision 153: a close during the opening wait completes it at once, so `closed` always follows `opened` (decision 225).
- **M1:** fixed. 45 specs now point to ticket 93 with "Floor engines: [ticket 93] (a weekly and release-branch job; Safari 26.2 held statically)", `attention` and `visually-hidden` among them, and the tooltip's reflow case names the floor job's Chromium 141 run. The Out of Scope bullet is removed from 42 specs, and the matching bullet from `events`, `print`, and `setup` (48 specs in all). Building-blocks Part 4 and the map's gist of ticket 27 are updated.
- **M2:** fixed. All 33 specs name `injectYetiItemStyles('<item>')` as the last statement of the root directive's constructor, linked to `setup.md` (decisions 42 and 45). The layer-2 cases in `attention`, `enter`, and `print` check the `<link>` in `document.head`. No spec links the setup ticket for the setup spec. `setup.md` now says that `button` acquires `spinner` unconditionally (decision 109).
- **M3:** fixed. `demo.md` (three places), `README.md`, and both map gists say `demo` is one of two Angular components, with `YetiFieldError`. `field.md` calls `YetiFieldError` an attribute-selector Angular component.
- **M4:** fixed. Building-blocks 1.4, guide P10, and events rule 8 give the carousel a read-only `current` signal (decision 121). 1.4 gives the accordion a read-only `isOpen` signal and the `isOpenChange` output (decision 96).
- **M5:** fixed. Events rule 9 and story 22 are limited to outputs that stand for Yeti events, and a model's `xChange` emits once at creation per decisions 146 and 199.
- **M6:** fixed. `nav.md` says the open-state read happens at creation with no platform branch, and that the read is "creation-time".
- **M7:** fixed. Part 2 row 34 names the list-and-toggle condition (decision 167), and row 32 names decision 92's one-shot flag.
- **M8:** fixed. Buttons story 23 now asks for every member to be reachable by Tab in the server HTML, with one Tab stop once Aria is live (decision 113).
- **M9:** fixed. The field e2e asserts the merged `aria-describedby` after hydration (decision 46).
- **M10:** fixed. The affix spec says typed values survive only through `YetiFieldControl`'s adoption (decision 161, A11Y-28), and that a control outside a package field is not covered.
- **M11:** fixed. The icon and tabs layer-4 sections have the cluster-form case: a `MutationObserver` plus a `requestAnimationFrame` probe (decisions 9 and 202).
- **M12:** fixed. The tooltip claims A11Y-2 (decisions 215 to 217) and A11Y-29 (decision 220). The dropdown's deciding records and its ledger claim add A11Y-27 (decision 157).
- **M13:** fixed. The settled open points in `setup` (decisions 68 and 70), `lift` (decision 12), `spinner` (decisions 109, 110, 190, 191, and 193), and `center` (decision 32) now cite their decisions.
- **M14:** fixed. `overlay--veil` asserts decision 55's composite contrast in both schemes, and `overlay--default` names both schemes.
- **M15:** fixed. Both frame examples use `NgOptimizedImage` with `fill` and a positioned frame (decision 35).
- **M16:** fixed. Decision 226 records decision 1's options; decision 1 and ADR 0044's note point to it.
- **M17:** fixed. Decision 227 records the shared-boundary rule's new reason, which is behaviour, not ids, as the orchestrator's reading. It adds dated notes on ADR 0011 clause 7, ADR 0013, and ADR 0021, plus pointers from ADR 0044, building-blocks 1.11 decision 6, and the generated-ids spec.
- **M18:** not applied, reason: history is not rewritten (decision 228). The orchestrator's later commits carry bodies.
- **M19:** fixed. `tabs.md` quotes the option label "All panels show (Recommended)" and attributes the details to the map's description and decision 206. `breadcrumbs.md` paraphrases the user's sentence without quotation marks.
- **L1:** fixed. The open-point wording in `alert`, `button`, `buttons` (including the content-query row, decision 112), `carousel`, `table`, `print`, `box`, `badge`, `seam`, and `breadcrumbs` now cites its decisions.
- **L2:** fixed. In `dialog.md`, 1.8's correcting note; in `navigation-close.md`, the dialog follows `toggle` (decision 147); in `fragment-links.md` rule 2, the selector-named inputs (decisions 126 and 208); in `nav.md`, A11Y-3b reads *measured*.
- **L3:** fixed. `billboard` and `visually-hidden` name `NgxYetiPaint` as the sixth collision (decision 10).
- **L4:** fixed. `cluster.md` names `YetiScrollerJustify` (decision 60).
- **L5:** fixed. `sidebar` (two places) and `shell` list `nav` and `table` as A11Y-22 sharers (decisions 170 and 195).
- **L6:** fixed. The box's usage rule holds 4.5:1 at any size (decision 8).
- **L7:** fixed. `grid`, `layer`, `stack`, `timeline`, `overlay`, `field`, and `tabs` cite decisions 6, 8, 9, 46, and 113 by number, and `field.md` lists A11Y-28 among its deciding records.
- **L8:** fixed. Citations now read `validate.js:59-61` and `:61`, `validate.js:69-84` for the clearing listener, and `control_native.ts:119-125`. They are in `specs/field.md`, tickets 50 and 83, and `ledger.md`, and were checked against the clones.
- **L9:** fixed. The map's Prefix example is `figure[yetiDemo]`, Not yet specified keeps only the audit line, and P16 names Tabs and Toolbar.
- **L10:** fixed. The map's Spec shape note records both choices: citations are kept as evidence, and the label is left to the implementing repository's tracker.
- **L11:** fixed. Tickets 36 and 50 have an empty `Blocked by:` line.
- **L12:** fixed. ADR 0045 has `status: accepted` front matter, and its status sentence is kept as the first paragraph.
- **L13:** fixed for the prose glyphs in center, ticket 53, ticket 50, ticket 35, tabs, demo, setup, progress, and spinner. Not applied to `pagination.md`'s two `<span>` ellipses: they are the rendered gap marker inside markup, which the audit's own rule keeps.
- **L14:** fixed. `events.md:27`, ticket 07, and ticket 09 (two places) no longer use that verb for a non-destructive action (now "removing", "removed", "abandoned", "no longer applies").
- **L15:** fixed. Ticket 93 has a dated note about the M1 change.

## Link check on this file

Run last with `node <scratchpad>/audit0004.mjs .scratch/ngx-yeti-specs/audits/0004-final-consistency-review.md`: see the line directly below, added after the run.

Result: 3 links checked in this file, none broken (exit 0). The whole bundle with this file included checks 5,806 links in 223 files with no broken link; it prints only the same 19 script-artefact lines as above. Banned-word, spaced-variant, paired-term, email-shaped-token, temporary-file-prefix, and non-ASCII searches over this file exit 1. At the end of the audit `git status --short` showed only this file, untracked.
