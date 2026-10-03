# Audit 0003: the third wave (tickets 05 to 13 and 24 to 34 resolved, ticket 35 claimed, ADRs 0010 to 0025, 0040 to 0043, 0060, 0070, 0080)

Date: 2026-10-03
Auditor: compliance auditor (Opus 5.5); read-only except this file

## Scope

Everything under `.scratch/ngx-yeti-specs/` as committed at HEAD `1196a17` ("claim the hydration-safe ids decision"). `git status --short .scratch/ngx-yeti-specs` printed nothing before the audit, so the working tree equals HEAD for the bundle (checked).

The wave is the 48 commits of `git log dac0ad5..HEAD -- .scratch/ngx-yeti-specs`, from `861ed1d` (the commit after "apply audit 0002's fixes", `dac0ad5`) to `1196a17`. The brief names tickets 08 (its 2026-10-02 continuation, `742375e`), 10, 13, 25, 26, and 28 to 35; the map's Standing rulings and Decisions so far; ADRs 0011 to 0025, 0040 to 0043, 0060, 0070, and 0080; `ledger.md`, `upstream-bugs.md`, `building-blocks.md`, `architecture-guide.md`, `CONTEXT.md`; and the research files and prototype READMEs added in the range. Those I read in full or, for `building-blocks.md` Part 2, `architecture-guide.md`, and ticket 26's 168-row table, by section.

The same range also resolved tickets 05, 06, 07, 09, 11, 12, 24, and 27, which the brief does not list. They were run through the script checks (headers, blocking, gists, links) and read only where a finding below touches them (tickets 07, 09, 11). Their own Answers were not audited in full; a later audit can take them.

Ticket 35 is in progress: `Status: claimed`, no Answer, no new ADR. It is audited as committed (its question, blockers, and citations).

Governing rules: the `/wayfinder` skill (read from the plugin cache), `docs/agents/issue-tracker.md`, the map's Notes, and audit 0002 (its findings are not repeated unless they recur in new text).

## Method

1. **Process (script, then reading).** `audit0003.mjs` (session scratchpad; audit 0002's script unchanged apart from its header comment) checks every ticket for `Type:`, `Status:`, `Blocked by:`, `Labels:` equal to `wayfinder:<Type>`, `Map:`, a numbered title, `## Question`, and `## Answer` present exactly when resolved; every blocking edge names a real ticket; no cycle; no resolved ticket waits on an open one; one Decisions-so-far line per resolved ticket, with link text equal to the title; and it prints each gist's length. A second script line per commit printed which ticket's `Status:` the commit changed and the subject length.
2. **User words.** `rg` for every sentence in the in-scope files that attributes a ruling, choice, approval, or question to the user, then a reading of each lead-in against the rule (verbatim, introduced as the user's own message or as the label of the option the user picked). I cannot see the conversation, so "verbatim" is checked only against other copies in the bundle.
3. **Consistency.** Read across the map, tickets, ADRs, `building-blocks.md`, `architecture-guide.md`, `ledger.md`, `upstream-bugs.md`, and `CONTEXT.md` for the cases the brief names (Part 2 against "Aria decisions", the ADR 0011 and 0021 notes against the guide, ledger owners against the spec list, 54 against ticket 11), stale `pending` and `OPEN FOR HUMAN` text, and claims marked measured.
4. **Citations.** `cites0003.sh` (scratchpad) printed 76 cited ranges from `github.com/foundation/yeti` (`f52d1e8b9`), `github.com/angular/angular` (`5db6fc4453`), `github.com/angular/components` (`708d4c6e2`), and `github.com/w3c/aria-practices` (`3f094fd`); the clones were at those commits with clean trees (checked). I also re-derived Aria's selector count, the dates of four commits, and which release first contains `8d3da9ea3`.
5. **Hygiene.** Commit subjects and bodies read in full (`commits0003.txt`, written without author or committer fields); banned-word, paired-term, variant, attribution, model-name, and non-ASCII searches; the identity check by allowlist inversion; the temporary-file check; the link check with a positive control.
6. **Not re-run:** every browser measurement, Playwright script, SSR build, and npm dry run (the workspaces live under `D:/tmp`). No web access.

### Link check

`node <scratchpad>/audit0003.mjs` from the repository root, over the committed bundle (103 `.md` files, audits 0001 and 0002 included; this file not yet written):

```
links checked: 1140 in 103 file(s)
16 x PROBLEM ...issues\07-decide-inherited-preferences-and-rulings.md: link target missing: ...   (see M6)
3 x PROBLEM <28, 31, 33>: blocked by missing ticket none                                         (see L3)
1 x PROBLEM 34-...: gist name "...`[open" != title                                                (script artefact, see Verified OK)
gist lines: 34
FAIL 20 problem(s)      (exit 1)
```

Control: a file in the scratchpad (`ctl0003/ctl.md`) with one resolving link and anchor, one missing file, one missing anchor, and one broken link inside a code span printed `link target missing: nope.md` and `anchor missing: ctl.md#no-such`, then `FAIL 2`, exit 1; the code-span link was skipped, as designed. The result for this audit file is at the end.

### Banned words, attribution, identity, non-ASCII (exact commands, exit codes)

`$SP` is the session scratchpad. `bw.txt`, `bw2.txt`, and `bw3.txt` are audit 0002's pattern files (single words with hyphen and space variants; spaced variants; the paired terms), kept in files so the words do not appear here.

| Command | Exit | Reading |
| --- | --- | --- |
| `rg -i -n -f "$SP/bw.txt" .scratch/ngx-yeti-specs` | 1 | no banned word in any bundle file |
| `rg -i -n -f "$SP/bw.txt" "$SP/commits0003.txt"` | 1 | none in the 48 commit messages |
| `rg -i -n -f "$SP/bw3.txt"` and `-f "$SP/bw2.txt"` over the bundle and the messages | 1, 1 | no paired term, no variant |
| `rg -i -c -f "$SP/bw.txt" "$SP/ctl3.txt"` (control: one banned word) | 0 | the pattern works |
| `rg -i -n 'co-authored-by\|generated with\|claude\|anthropic\|noreply' "$SP/commits0003.txt"` | 1 | no trailer, no generated-with line |
| `rg -i -n 'opus\|sonnet\|fable\|haiku\|\beffort\b\|model' "$SP/commits0003.txt"` | 0 | one hit, `f1f85ac`, which records the ruling against naming the model; no message names a model or effort |
| `rg -n -P '[^\x00-\x7F]' "$SP/commits0003.txt"` | 1 | commit messages are ASCII |
| `rg -c -P '[^\x00-\x7F]'` over the 78 `.md` files changed in the range | 0 | 11 files, see L13 |
| Identity: `git log dac0ad5..HEAD --format='%ae%n%ce'`, each value compared with the approved public address by `awk` | - | 96 of 96 author and committer fields equal the approved address; no other value |
| Identity: `rg -n -o -uu '<email-shaped regex>' .scratch/ngx-yeti-specs \| rg -v -F '<approved address>'`, domains masked in the output | - | 2 tokens, both a git SSH remote of the `git@<host>` form, in `prototypes/yeti-github-dependency/README.md:40` and `prototypes/yeti-github-dependency/optA/lock-entry.txt:3` (from wave 2); neither is a person's address. Control file with the approved address and one other address printed only the other one, masked |
| The same regex over `commits0003.txt` | 1 | no email-shaped token in any commit message |
| Temporary file: `rg -n -uu -F '<the prefix the brief named>' .scratch/ngx-yeti-specs`, the same over `commits0003.txt`, over `git ls-files`, and over the range's changed file names | 1, 1, 1, 1 | nothing references it by name; control file with the prefix: exit 0. The only mention is `map.md:106`, which describes the rule without naming the file |

I searched for no domain at any point and wrote none here.

## Findings

Counts: High 1, Medium 12, Low 15.

### High

**H1. The recorded `buttons` decision makes the `button` item's own directive host Aria's `ToolbarWidget`, which cannot be created outside a toolbar.**
Files: `building-blocks.md:352` ("Aria decisions (2026-10-03)", row 27: "`yetiButtons` hosts `ngToolbar`, and `yetiButton` hosts `ngToolbarWidget` with `inputs: ['disabled: busy']`"); against `building-blocks.md:275` (Part 2 row 26, `button[yetiButton]`, `a[yetiButton]`, `input[yetiButton]`, "`aria-busy` [is] the consumer's"), `building-blocks.md:101` (a dialog opener written as `<button yetiButton ...>` anywhere on the page), and [ADR 0022](../adr/0022-button-declares-no-listeners.md) point 1.
Rule: consistency between the decided records and the source they rest on.
Evidence (checked): `ToolbarWidget` injects its parent with no `optional` flag, `private readonly _toolbar = inject<Toolbar>(Toolbar);` (`src/aria/toolbar/toolbar-widget.ts:67` at `708d4c6e2`), and a `hostDirectives` entry cannot be conditional (`architecture-guide.md` P8, "a `hostDirectives` entry behind a condition" is Avoided). So, as worded, every `yetiButton` outside a `yetiButtons` group, which is the `button` item's ordinary use and the dialog opener's, would fail with a missing-provider error (inferred from the source; not run). The prototype that measured the composition (`prototypes/aria-composition-roving/README.md:33`, `src/roving.ts:27-50`) used a prototype-local `yetiButton` that only ever sat inside its toolbar, so the measurement does not cover the item directive. The same row also adds a `busy` input to `yetiButton`, where Part 2 row 26 leaves `aria-busy` to the consumer. The user chose "Aria Toolbar by composition (Recommended)"; which directive hosts the widget is the orchestrator's wording, and "this section wins until Part 2 is rewritten" (`building-blocks.md:348`) makes it the record a spec writer follows.
Fix: name a part directive of the `buttons` item (for example a child directive on each button of the group) as the host of `ngToolbarWidget` and of the `busy` alias, and leave `yetiButton` with no hosted Aria directive; record it as a dated correction in the "Aria decisions" section and in `ledger.md`'s 2026-10-03 note on A11Y-12. Tell the user the host was renamed, since the ruling's row is quoted as theirs.

### Medium

**M1. The fifth shared spec, `setup`, exists only in the map.**
Files: `map.md:9` (Destination: "The user added a fifth shared spec, `setup`, on 2026-10-02, so the destination is 54 specs") and `map.md:86`; against `issues/11-decide-spec-list.md` (Answer: 53, no note), `building-blocks.md:300-307` (the four shared-utility rows 50 to 53), `:321` ("The four shared-utility specs of ticket 11 are rows 50 to 53"), `:325` ("has no owning spec in the list of 53"), `CONTEXT.md:227-228` (**Shared-utility spec**: "One of the four specs ..."), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md):27 and `issues/13-decide-style-loading.md:48` ("the shared-setup spec"), and the map's own gist for ticket 25 (`map.md:192`, "Part 2 has 53 rows").
Rule: wayfinder (a decision lives in one place, its ticket; the map gists and links); the brief's check of 54 against ticket 11.
Evidence (checked): `rg -i '\bsetup\b'` over ticket 11, `building-blocks.md`, `CONTEXT.md`, `architecture-guide.md`, and `ledger.md` finds no `setup` spec. Ticket 25's "For the orchestrator" item 3 asked for exactly this edit; commit `f1154fb` says "The destination gains a fifth shared spec", and only the map changed.
Fix: a dated note on ticket 11 (54 specs, `setup` added by the user's 2026-10-02 choice, with what it owns per ticket 25 item 3); a row 54 in Part 2 or a Part 3 entry; `CONTEXT.md`'s Shared-utility spec entry to five; ADR 0060 point 11 and ticket 13's Triage to name `setup`.

**M2. The user's 2026-10-02 package-CSS ruling is still "OPEN FOR HUMAN" in six places.**
Files: `map.md:130` (Inherited preferences, Accessibility: "How far the package may add CSS of its own ... is `OPEN FOR HUMAN` (ticket 07, `### Triage`)"), `map.md:182` (gist of ticket 07: "Whether the package may add CSS where Yeti's fails WCAG 2.2 AA is OPEN FOR HUMAN"), `issues/11-decide-spec-list.md:135` ("Whether the package may add CSS at all is `OPEN FOR HUMAN` in ticket 07, so no spec is made until that is ruled"), `issues/09-decide-inherited-principles-and-building-blocks.md:144`, `architecture-guide.md:269` (P17 Rule: "whether the package may add CSS is `OPEN FOR HUMAN` ... until it is ruled on the spec records the gap and the options"), `:274` (Avoided: "a package `forced-colors` rule written before the open item is ruled on").
Rule: no stale `OPEN FOR HUMAN` for an item the user has ruled on; the map's Notes are "what binds" (`map.md:120`).
Evidence (checked): `map.md:62` quotes the ruling ("Accessibility CSS: Yes."), ticket 07:199 and ADR 0015:32 record it, and the guide's own Conflicts item 4 (`architecture-guide.md:475`) says the user settled it. Commit `6c7313e` ("bring the guides up to the accessibility CSS ruling") left P17's Rule and Avoided lines. P17's Rule also still names `FocusMonitor` for focus-out, which ADR 0043 replaced (the Preferred line was updated, the Rule was not).
Fix: replace each with the ruling and a pointer to `map.md:62`; in P17 name the `focusout` host listener of ADR 0043.

**M3. The user's 2026-10-03 Aria row decisions are not carried into ticket 25, Part 4, or the map's gists.**
Files: `issues/25-decide-building-blocks-map.md:69` ("Those rows wait for [ticket 29]") and its Triage rows `:122-125` (`OPEN FOR HUMAN`), with no later note; `building-blocks.md:331` (Part 4: "Four Aria-fallback rows wait for the user's confirmation"); `map.md:192` (gist of ticket 25: "OPEN FOR HUMAN ... four items", "46 are native platform", "`tabs` hosts Aria's tabs" as the one Aria row); `map.md:193` (gist of ticket 29: "The four rows wait for the user").
Rule: wayfinder (the ticket holds the decision; resolving a later ticket updates what it invalidates); no stale pending text.
Evidence (checked): `map.md:99-104` and `building-blocks.md:346-358` record the user's choices for all four rows; with `buttons` now hosting Aria Toolbar, Part 2's split becomes 45 native and 2 Aria, which neither the gist nor ticket 25 says. Part 2 rows 21 and 27 still say "Listed in ticket 25's Triage for the user's confirmation", and rows 29, 32, and 34 still point at the Triage; the precedence sentence at `:348` covers Part 2 but not Part 4 or ticket 25.
Fix: a dated note under ticket 25's Triage giving each row's outcome with a link to the map's ruling; rewrite Part 4's first bullet as decided; update both gists and the primitive counts.

**M4. The release-policy text in the map's binding Notes and in the guide contradicts the user's 0.x rulings.**
Files: `map.md:136` (Inherited preferences, Release policy: the devkit scheme `0.<Angular major><Angular minor, two digits>.<patch>`, "breaking changes, removals, and consumer-visible platform upgrades only when the Angular major changes; one Angular major of deprecation before a removal"); `architecture-guide.md:455` (Release policy, the same text, "decided by the user, not audited").
Rule: the map's Notes are "what binds" (`map.md:120`); no stale statement after a ruling.
Evidence (checked): `map.md:80` sets the prerelease-tag format and `map.md:81` records "Counter replaces it in 0.x (Recommended)": any 0.x release may break, and a removal no longer waits a whole Angular major. `map.md:136` adds only "The version format was replaced", so its breaking-change and deprecation clauses still read as binding; ADR 0017:44 has the correct dated note. The guide's section has neither change.
Fix: in both places, state the 0.x rules from `map.md:80-81` and keep the old rule as "returns at 1.0", citing ADR 0017's 2026-10-02 notes.

**M5. The guide and building-blocks Part 1 still state rules the 2026-10-03 rulings replaced.**
Files and evidence (checked):
- `architecture-guide.md:189` (P11 Rule): "Initial state is bound, never read from a static attribute", and the `details` loss "the `accordion` spec documents it or measures seeding its model". The open-state ruling (`map.md:96`) is the reverse for `open`: "No directive binds `open` ... reads the element's open state once, when it is created". `building-blocks.md:54` (1.4) has the same "Initial state is bound" sentence.
- `architecture-guide.md:152` (P8 Preferred): `section[yetiTabPanel]` with `'[attr.hidden]': '!visible() ? "" : null'`, which hides non-selected panels in the server HTML; the `tabs` ruling (`map.md:97`) shows every panel with JavaScript off, and ticket 30 measured `ariaLive() && !panel.visible()` (`prototypes/aria-composition-roving/README.md`). P8's Why (`:150`) still says Tabs is "the one Aria pattern that fits Yeti without changing its elements"; `buttons` now hosts Toolbar.
- `architecture-guide.md:388` (P26) and `building-blocks.md:69` (1.5): server and client ids that differ are "harmless". Ticket 33 rates this at risk under the user's hydration ruling, and ticket 35 is open on it; neither line has a note.
- `architecture-guide.md:26` (Kinds, Shared service row): "a `NavigationStart` closer if ticket 25 makes it shared"; ticket 25 item 7 listed this phrase as stale and ADR 0041 decided it.
Rule: the map's Precedence note ranks the guide below the records, so a conflict does not change a decision, but a spec writer reads the guide's Preferred and Avoided lines as the patterns to copy.
Fix: rewrite P11's state clause and 1.4's sentence to "read once, then follow native events" for `open`; change P8's example binding and Why; mark the id clauses as pending ticket 35; replace the Kinds phrase with ADR 0041's function.

**M6. Ticket 07 has 16 broken links.**
File: `issues/07-decide-inherited-preferences-and-rulings.md:176-189`.
Rule: relative links resolve (the brief's link check).
Evidence (checked by script): the blockquote copies the map's Inherited preferences bullets with their map-relative targets (`adr/0003-...`, `issues/13-...`, `../next-foundation-specs/adr/0001-...`), which from `issues/` resolve to `issues/adr/...` and `.scratch/ngx-yeti-specs/next-foundation-specs/...`. 16 targets miss. The copy also repeats the map's text in the ticket, so the two can drift, as `map.md:130` already has (M2).
Fix: rewrite the targets relative to `issues/` (`../adr/...`, `../../next-foundation-specs/...`), or replace the quoted block with a link to the map section.

**M7. Two records quote the orchestrator's restatement as the user's ruling.**
Files: `issues/26-decide-yeti-data-attributes-mapping.md:324` (Triage: "the user's prefix ruling ("Input value types reuse Yeti's own exported vocabulary types")"); `issues/13-decide-style-loading.md:45` ("whether a build-time copy counts as "reuse rather than redeclaring" under the user's prefix ruling").
Rule: a quotation presented as the user's must be the user's words or the label of the option they picked.
Evidence (checked): the user's words are "Prefix: Approve recommendation. Use an `NgxYeti` TypeScript naming prefix where collisions cannot be avoided." (`map.md:57`). The quoted sentence is the map's sub-bullet (`map.md:60`), the orchestrator's summary of the approved recommendation; ADR 0080:9 says so ("its wording ... [is] the orchestrator's and this map's, not the user's"), and ticket 10:56 and ADR 0080 point 5 phrase it correctly ("the approved recommendation").
Fix: reword both to "the approved recommendation in the map's Prefix bullet" without quotation marks around the orchestrator's sentence.

**M8. Decisions so far is again storing detail: 17 of the wave's 20 gists exceed 600 characters.**
File: `map.md:165-198`.
Rule: wayfinder ("an index, not a store ... only gists it and links"); audit 0002 M1, whose fix brought every gist to 461 characters or fewer.
Evidence (checked by script): the 20 gists added in this wave run to 1,035 (ticket 13), 945 (25), 927 (33), 904 (30), 887 (08), 869 (29), 799 (32), 779 (27), 774 (26), 749 (10), 718 (09), 715 (34), 681 (12), 675 (31), 662 (07), 661 (24), and 637 (28). Ticket 13's lists the link attributes, the URL shape, the consumer's three edits, five measurements, and the 13 kB figure; ticket 33's lists all seven at-risk items. Each repeats its ticket's Answer, and several have already drifted from it (M9).
Fix: cut each to the decision and what later tickets take from it, as the six gists of the first wave do.

**M9. Four gists, and two commit bodies, say more than their tickets hold.**
Evidence (checked):
- `map.md:195` (ticket 33) and commit `81387e9`: "A bound `[open]` on a dialog undid a toggle made before hydration" and "both measured". Ticket 33 and its research row 1 (`research/hydration-constraints-audit.md:24`) say ticket 18 measured it on a `details`, and "For `dialog`, the same binding mechanism is inferred". Ticket 34 later measured a non-modal dialog, so the statement is now true, but not from the source the gist names.
- `map.md:190` (ticket 28) and commit `75de68b`: "A prerelease tag survives publish, and `npm publish --tag latest` accepts one (measured by the orchestrator, dry run)". Neither ticket 28's Answer nor `research/npm-build-metadata.md` says it (`rg -i 'prerelease|tag latest'` exit 1 on both); the dry run is recorded only in ADR 0017:44.
- `map.md:188` (ticket 10): "the loading unit is the **Item file**"; ticket 10's Answer says **Part file** (L7).
- `map.md:186` (ticket 08): "The user ruled the one open item"; ticket 08:30 says two items were ruled (the pin move and the prefix, `:172`).
Rule: wayfinder (a gist does not claim more than the ticket); research quality.
Fix: correct each gist; for ticket 28, add a dated note to its Answer that points at ADR 0017's dry run, or remove the clause from the gist. The two commit bodies change only with a history rewrite; I do not propose one.

**M10. Not yet specified is out of date, and one decision has neither a ticket nor fog.**
File: `map.md:200-205`.
Rule: wayfinder ("Not yet specified excludes what's already decided"; resolving a ticket graduates the fog it makes specifiable).
Evidence (checked):
- "Theming beyond tokens ... once ticket 07 settles how tokens are set": ADR 0004:28 says "The map's "Not yet specified" line on theming beyond tokens is settled: the package does not ship, wrap, or generate themes", and `map.md:129` repeats it.
- "Testing ... once [ticket 08] settles ADR 0018": ticket 08 is resolved and ADR 0014 is the testing record. ADR 0014 point 7 places floor-browser testing "by [ticket 27] and the decision that follows it", and `building-blocks.md:332` says that decision is "not yet taken". No ticket asks it, and this fog line does not name it.
- "The spec waves ... once the list and the inherited spec shape are decided": both are decided (tickets 11 and 07).
Fix: remove the theming line; replace the testing line with the floor-browser and provider question of ADR 0014 points 2 and 7, or open a ticket for it; restate the spec-waves line with what still blocks it (for example ticket 35).

**M11. ADR 0043 says nothing is open before hydration.**
File: [ADR 0043](../adr/0043-light-dismiss-additions-are-host-listeners-not-cdk-services.md):36 ("Nothing is open before hydration, so a replayed `focusout` or `keydown` finds nothing to close").
Rule: consistency with measured records.
Evidence (checked): ADR 0011 clause 2 rests on panels opening before hydration (`popover`, invoker commands, `details`, measured in ticket 18), ticket 33 lists toggles made before hydration as a break, and ticket 34 measured a modal dialog opened before hydration. A dropdown opened by `popovertarget` before hydration is open when a replayed `focusout` arrives. Ticket 33 rated ADR 0043 "complies" without reading this line.
Fix: a dated note that replaces the sentence with the measured case and says what a replayed `focusout` or `keydown` does to a panel opened before hydration (or that these events are not replayed, if that is what the Answer means, with the replay list cited).

**M12. `upstream-bugs.md` has no row for Aria's ids changing at hydration.**
File: `upstream-bugs.md` (Angular table, A1 to A5).
Rule: the user's item 44 ("Keep a ledger of upstream bugs found"); the ledger's own line "Each spec ticket that finds a bug adds a row".
Evidence (checked): ticket 30 measured that Aria's generated ids differ between the server HTML and the hydrated page (`ng-toolbar-widget-a72575-*` against `-a17645-*`, `prototypes/aria-composition-roving/README.md:78`), from `_IdGenerator`'s random infix (`id-generator.ts:24`, read) that Aria requests (`toolbar-widget.ts:70`, `tab.ts:62`, `tab-panel.ts:73`, `getId(..., true)`). This alters server HTML at hydration, against Angular's own constraint (`hydration.md:101`), and it is the cause ticket 35 now works on. Ticket 29's "In Chromium a click before hydration is undone at hydration (cause not investigated)" for Aria Menu is a second candidate.
Fix: add an Angular row (A6) for the random-infix ids, Verified "measured", citing ticket 30 and the three source lines; consider a row for the Menu case marked "cause not investigated".

### Low

**L1. "43 minutes" is 32.** `research/yeti-planning-documents.md:20` and `:168`, `issues/31-...md:34`, and `map.md:194` say the planning files were removed 43 minutes after they were added. The research's own times are 11:22 (`a994b2e29`) and 11:54:52 (`fa61d90d2`); `git log` gives 11:22:46 and 11:54:52 for author and committer alike (checked): 32 minutes. Fix: correct the four places.

**L2. Three citations do not say what they are cited for (checked).** `issues/29-...md:47` cites `nav/docs.md:21` for "links become menu items, against Yeti's docs"; line 21 is the closing code fence, and the sentence is `:3` ("It is a bar of links, not a menu system"). `issues/25-...md:104` cites `alert-pattern.html:25` for a live role "present at load as the APG alert pattern wants"; the line says screen readers do not announce alerts present before page load completes, which is about content, not the role. ADR 0043:16, ticket 25:96, and `building-blocks.md:278` cite `carousel-pattern.html:182-183` for "the APG's grouped picker keeps every picker control in the Tab sequence"; the lines are about `aria-disabled` on the current slide's picker button. Fix: correct the first; cite the passage that states the second and third claims, or mark them inferred.

**L3. Blocking lines.** Tickets 28, 31, and 33 write `Blocked by: none`; every other unblocked ticket leaves the line empty, and the tracker doc's form is `Blocked by: NN, NN` (checked by script). Ticket 08's 2026-10-02 continuation decided 27 rows "once [ticket 11] resolved", but its `Blocked by:` stays `06, 07`. Fix: empty the three lines; add 11 to ticket 08's blockers or note why not.

**L4. Three Answers do not name the model.** Tickets 28 (`:19`), 31 (`:32`), and 33 (`:48`) say "Resolved 2026-10-0x." while the map's commit rule says "each ticket's Answer records the model instead" (`map.md:40`), and 15 of the wave's other 17 resolved tickets name one in the Answer's first lines (checked with `rg`; the other two are ticket 05, a task, and ticket 06, the user's own decision). Fix: add the run's model.

**L5. Three different user messages are numbered 54.** Ticket 32:30 ("accordion: 54. Isn't Angular Aria pretty much markup-agnostic? ..."), ticket 33:40 and `map.md:92` ("54. Make sure that we always comply with ..."), and ticket 34:28 ("#54 (markup-agnostic) A. Host bindings ..."). Ticket 32's Answer heads a paragraph "Question 54". Each is quoted with the right lead-in; the number alone no longer identifies a ruling. Fix: cite these by date and ticket rather than by number, or add the ticket in brackets after the number.

**L6. User rulings stated without the user's words.** `map.md:40` gives the audit 0002 H1 ruling as "(the user, 2026-10-01, ruling on audit 0002's H1: remove the line and reword the unpushed commits)" with no quotation or option label; `map.md:106` attributes the temporary-file rule to "item 30" without quoting it; `map.md:93` quotes "Option 1" but not the text of option 1, so the guarantee that follows is the orchestrator's description; `ledger.md:3` quotes "Track in accessibility ledger." as the user's, a single copy in the bundle that the map's Standing rulings do not carry. Fix: quote the option labels or messages, as the other Standing rulings do, and add the ledger quote to the map.

**L7. Ticket 10 still names the loading unit "Part file", and ticket 26 defers part names to it.** `issues/10-decide-glossary.md:33`, `:34`, `:50`, `:170` say **Part file**; its own `:34` says ticket 13's name wins and "this entry is renamed", and `CONTEXT.md:148` is **Item file**, but ticket 10 has no note. `issues/26-...md:75` says child and part selectors are "provisional; [the glossary] names them", while ticket 10 Q9 (`:53`) left part names to each spec. Fix: a dated note on ticket 10; point ticket 26's sentence at the specs.

**L8. ADR 0011 clause 7 has no note after ticket 30.** [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md):19 calls the id difference "inferred, not measured" and accepts a rewrite at hydration; ticket 30 measured it and ticket 33 rated ADR 0042 at risk. ADR 0042 has a dated note; ADR 0011 does not. Ticket 35 will settle it. Fix: a one-line dated note pointing at ADR 0042's note and ticket 35.

**L9. Where the vocabulary types are imported from.** ADR 0080 point 5 (`:24`) and `building-blocks.md:43` say "imported as a type from `yeti-css`"; ADR 0060 point 10 decided that the published declarations must not import from `yeti-css` and use a generated `yeti-types.ts` instead. ADR 0080's Consequences (`:36`) anticipates a fallback copy, so the two do not contradict outright, but ADR 0080 has no dated note and 1.4 still states the superseded form. Fix: a dated note on ADR 0080 and a one-clause edit in 1.4.

**L10. Part 2 cites a ledger row that was split.** `building-blocks.md:281` (row 32, `dropdown`) and `:283` (row 34, `nav`) list "A11Y-3"; the ledger has A11Y-3a (owner `dropdown`) and A11Y-3b (owner `nav`) and no A11Y-3 (checked). Fix: 3a and 3b.

**L11. The verb the user's memory reserves for destructive Git actions ("drop") is used for decisions in new text.** `adr/0018-...md:20`, `adr/0021-...md:17`, `adr/0040-...md:19`, `issues/13-...md:44` (twice), `issues/08-...md:47` and `:112`, `architecture-guide.md:196`, `:230`, `:233`, `:356`, `:403`, `building-blocks.md:192`. Uses that describe what software does (Angular's critical CSS, npm's saved range) are left out. Fix: "remove", "abandon", "leave out", or "no longer applies", as fits each.

**L12. Commit shape.** Ten subjects exceed 72 characters (`9fdaf2d` 91, `fb4b383` 82, `5a996f4` 77, `a3408bb` 76, `64cd1c3` 76, `373f38d` 74, `a53a53a` 74, `93990fc` 73, `4f02d89` 73, `47554d3` 73). Five commits have no body: three claims (`1196a17`, `ae37145`, `b8c1474`) and two that record work, `15eac31` (a user ruling) and `6c7313e` (guide edits), against the map's "with a body that gives the why". The 22 commits from `861ed1d` to `3cdf632` have unwrapped body lines over 100 characters (for example `3cdf632`, `5a996f4`); from `742375e` on, bodies are wrapped. All 48 subjects are `docs(wayfinder): ...`, and every resolved ticket has its own commit (checked). Fix: none for pushed history; keep subjects at 72 or fewer and give every non-claim commit a body.

**L13. Non-ASCII characters.** Ellipsis characters in `issues/30-...md:16` and `prototypes/aria-composition-accordion/README.md` (9 lines) and `prototypes/aria-accordion/README.md:47`; em dashes in ADR 0003:9 and ADR 0004:21; a section sign in `research/yeti-planning-documents.md:100` (inside a quotation). The doubled U+0275 prefix in ticket 34, ADR 0060, and the subclass README is part of Angular's identifiers and stays. Fix: `...` and `--` where the text is the bundle's own.

**L14. Small stale lines in the map.** `map.md:29` (Target platform: Yeti at `f52d1e8b9` "until a version decision pins it"; ticket 12 pinned it); `map.md:43` (the Standing rulings heading is dated 2026-10-01 but holds rulings to 2026-10-03); `map.md:137` (links titled "ticket 08" and "ticket 09", a bare number as the name). Fix: update the sentence and heading; use the tickets' titles.

**L15. A stray comma.** `architecture-guide.md:282` and `building-blocks.md:189`: "re-implements no Yeti style and, ships none of Yeti's CSS". Fix: remove the comma.

## Verified OK

Process (script output above, then read):
- All 35 tickets carry `Type:`, `Status:`, `Blocked by:`, `Labels:` equal to `wayfinder:<Type>`, `Map: ../map.md`, a numbered title, and `## Question`. All 34 resolved tickets have an `## Answer`; ticket 35 (claimed) has none. Checked by script.
- Blocking edges point at real tickets, form no cycle, and no resolved ticket waits on an open one; ticket 35 waits on 33 and 34, both resolved. Checked by script.
- Exactly one Decisions-so-far line per resolved ticket (34 of 34), none for ticket 35. The one name mismatch the script printed, ticket 34, is the script's regex stopping at the `]` inside `` `[open]` ``; the link text equals the title (checked by reading `map.md:198`).
- One resolved ticket per commit across the 48 commits; claims are separate commits (checked by script, list in L12).
- Out of scope is current: Foundation 6.9, implementing the specs, changing Yeti or filing upstream without confirmation, moving the bundle.
- Ticket 35's question is sharp and correctly a ticket, not fog; its citations hold (`id-generator.ts:18`, `:24`).

User words (read): every quotation attributed to the user in the in-scope files is introduced as the user's own message (tickets 25, 26, 29 to 34, ADRs 0006, 0011, 0012, 0060, 0080, `map.md` Standing rulings) or as the label of the option the user picked ("Composition (Recommended)", "Never bind; read once (Recommended)", "All panels show (Recommended)", "Decide each row", the four row labels, "Keep per-item loading (Recommended)", "Selector name (Recommended)", "Prerelease tag (Recommended)", "Counter replaces it in 0.x (Recommended)", "(a) Any release (Recommended)", "Add a `setup` spec (Recommended)", "Ledger only"). The cut-off vendoring message and its completion are both quoted and marked. ADR 0080:9 and ADR 0017:43 separate the orchestrator's wording from the user's. Exceptions: M7, L6.

Consistency (read): `ledger.md` has 29 rows, A11Y-1a to A11Y-19, and every Owner is a spec name in ticket 11's list (22 distinct owners, two of them shared-utility specs). Ticket 26's counts add up (R 127 + U 4 + S 1 = 132 attributes; C 19 + G 6 + P 11 = 36 markers; 168 rows). `CONTEXT.md` has 79 bold terms in seven groups, as ticket 10 says. The ADR 0021 2026-10-03 note matches P11's Preferred line and `map.md:96`. The ADR 0011 2026-10-03 notes match `map.md:93-97`. Ticket 30's correction note and ticket 34's Point 1 agree on the `0`, `-1`, `0` sequence. Ticket 32's "24 of 29 directives" re-derived: 29 selectors under `src/aria` outside `private/`, five of them `ng-template[...]`.

Citations (76 ranges printed by `cites0003.sh`; all hold except the three in L2):
- Components: `toolbar.ts:96`, `:103`; `menu.ts:166-182`; `tab-list.ts:53`, `:80`, `:92`, `:106`, `:109`, `:127`, `:137-153`; `deferred-content.ts:56-67`; `accordion-trigger.ts:47-51` (`role: 'button'` at 48); `cdk/a11y/public-api.ts:39`; `tab.ts:38-49`, `:62`, `:70`, `:73`, `:76`; `tab-panel.ts:42-50`, `:48`, `:49`, `:73`, `:84`; `toolbar-widget.ts:46`, `:67`, `:70`, `:85`; `tabs.ts:52-57`; `id-generator.ts:18`, `:22-36`, `:24`; `focus-monitor.ts:178-181`; `cdk/dialog/dialog-config.ts:148`; `cdk/dialog/dialog.ts:221`; `keycodes/modifiers.ts:15`; `aria-describer.ts:41`; `focus-trap.ts:38`; `interactivity-checker.ts:31`; `focus-key-manager.ts:22`; `material/tabs/tab-header.scss:21-28` (disabled only). Commit `8d3da9ea3` ("export aria injection tokens to support custom subclasses (#33607)") is first in `v22.2.0`, as ticket 34 says.
- Angular: `directive-composition-api.md:122-131` (the quoted sentence at 131); `shared.ts:530-535` (null removes the attribute) and `:599` (`setupStaticAttributes`); `hydration.md:97-101`, `:214-226`; `router/src/events.ts:91`; `location.ts:232`; `host_directives_feature.ts:76-86`; `attribute.ts:34`; `typecheck/ops/inputs.ts:34-37`, `:199`; `shared_styles_host.ts:76-80`, `:139-144`; `dispatcher.ts:127-140`; `output.ts:69`; `router_state.ts:161`; `CHANGELOG.md:937`; `form_field.ts:106`; `adev/.../aria/menu.md:53`.
- Yeti: `install.md:97`; `dialog.js:1-3` (ADR 0021's quotation matches), `:28-35`, `:45-48`, `:53-65`; `enter.js:23-31` (`removeAttribute('data-once')` at 26, `rootMargin` at 29); `tabs.css:1-5`; `field.css:193-196`; `breadcrumbs.css:22`; `tooltip.css:56-60`; `reset.css:75-77`; `nav/docs.md:3`, `:16`; `accordion/docs.md:19`; `hover.js:14`, `:16-19`, `:50-51`; `scroller/manifest.json:24-25`; `affix/manifest.json:82`; `components.md:83`; `bin/gen-types.js:17-18`; `base.md:105-118`; `layouts.md:177`; `carousel.js:11-25`, `:34-36`; `demo.js:74`, `:102-116`, `:151-160`; `alert.js:24-29`; `stability.md:15-22`; `.gitignore` at the pin lists `docs/superpowers/` and `.superpowers/`; `fa61d90d2` deletes five files, 3,400 lines.
- APG: `carousel-pattern.html:150`; `disclosureMenu.js:87-92`; `tabs-pattern.html:49`; `disclosure-navigation.html:35-37`.

Hygiene: no banned word, paired term, or variant in the bundle or the 48 commit messages, with a working control; no AI attribution and no model or effort line in any commit message; all author and committer fields equal the approved address; no email-shaped token in the bundle other than two git SSH remotes from wave 2; nothing references the user's temporary file by name. Links: 1,140 relative links in 103 files; the only broken ones are M6's 16.

Not checked: the npm CLI sources ticket 28 cites (`libnpmpublish` `patchManifest`, `@npmcli/package-json` `fixVersionField`); GitHub API reads in ticket 31 (no open milestones, Discussions off); every browser, SSR, and npm measurement; the Answers of tickets 05, 06, 07, 09, 11, 12, 24, and 27 beyond the lines cited above.

## Resolution log

Applied 2026-10-03 by the orchestrating session. Ticket 35 ran in parallel, so ADR 0042, ADRs 0044 to 0049, ticket 35, and `prototypes/hydration-safe-ids/` were not edited.

- H1: fixed, as the orchestrator's change of mechanism, not a user ruling. The user's choice, "Aria Toolbar by composition (Recommended)", stands; `ngToolbarWidget` moves from `yetiButton` to a part directive of the group, `[yetiButtonsItem]`, which the consumer writes beside `yetiButton` on each button inside a `buttons` group, with the `busy` alias and the `tabindex` hand-over; `yetiButton` hosts nothing from Aria, and row 26 keeps `aria-busy` the consumer's. Inferred from `toolbar-widget.ts:67`; not yet measured. Recorded in `building-blocks.md` "Aria decisions" row 27, `ledger.md`'s 2026-10-03 note on A11Y-12, ticket 25's Triage note, and guide P8. The user has not been told yet; the orchestrator does that.
- M1: fixed. Dated note on ticket 11 (54 specs, what `setup` owns); `building-blocks.md` Part 3 entry and the accessibility-stylesheet bullet; `CONTEXT.md` Shared-utility spec (five); ADR 0060 point 11 and ticket 13 name `setup`; the map's gists of tickets 11 and 25.
- M2: fixed in `map.md` Accessibility, the ticket 07 gist, tickets 11 and 09, and guide P17 (Rule now names ADR 0043's `focusout` host listener; Avoided updated).
- M3: fixed. Dated note under ticket 25's Triage and on ticket 29; `building-blocks.md` Part 4 rewritten as decided, Part 2 rows 21, 27, 29, 32, 34 and the 1.2 Aria bullet point at "Aria decisions", counts updated (45 native, 2 Aria); gists of tickets 25 and 29.
- M4: fixed in `map.md` Release policy and the guide's Release policy: the 0.x rules, with the devkit rule returning at 1.0, citing ADR 0017's 2026-10-02 notes.
- M5: fixed. Guide P11 and `building-blocks.md` 1.4 carry the read-once rule for `open`; guide P8 uses ticket 30's `ariaLive() && !panel.visible()` binding and names both hosted patterns; guide P26 and 1.5's id clauses marked pending ticket 35; the Kinds row names ADR 0041's function.
- M6: fixed; ticket 07's 16 targets rewritten relative to `issues/`.
- M7: fixed in tickets 26 and 13 ("the approved recommendation in the map's Prefix bullet", no quotation).
- M8: fixed; every gist in Decisions so far is now 450 characters or fewer.
- M9: fixed in the gists of tickets 33, 28, 10, and 08; ticket 28 has a dated note pointing at ADR 0017's dry run. The two commit bodies are not applied: they change only with a history rewrite.
- M10: fixed; theming line removed, testing line replaced by the floor-browser and provider question of ADR 0014 points 2 and 7 (no ticket yet), spec-waves line names ticket 35 as what still blocks.
- M11: fixed with a dated note on ADR 0043: panels can be open before hydration, `focusout` and `keydown` are replayed and `pointerdown` is not (Angular `event_type.ts`, read), so a replayed `focusout` can close such a panel (inferred, not measured).
- M12: fixed; `upstream-bugs.md` rows A6 (Aria ids change at hydration, measured in ticket 30, cause read) and A7 (Aria Menu click undone at hydration, cause not investigated).
- L1: fixed in the research file (two places), ticket 31, and the map gist.
- L2: fixed. Ticket 29 cites `nav/docs.md:3`; the carousel claim cites `carousel-pattern.html:110-111` ("a series of tab stops", checked) in ticket 25, ADR 0043, and building-blocks row 29; the alert claim in ticket 25 is marked inferred.
- L3: fixed; tickets 28, 31, 33 have an empty `Blocked by:`; ticket 08 now waits on `06, 07, 11` (no cycle: ticket 11 waits on 02, 03, 07).
- L4: not applied. The model that ran tickets 28, 31, and 33 is in the orchestrator's run record, not in the bundle, and guessing it would be wrong.
- L5: fixed in ticket 32's heading (date and source in brackets); the user's own "54." in the map's quotation is left verbatim.
- L6: fixed where the bundle allows. `map.md:40` and the temporary-files line now say the user's words are not in the bundle and the sentence is the orchestrator's summary; the JavaScript-off bullet says the description of option 1 is the orchestrator's; the ledger quote is copied into the map's Standing rulings. Not applied: quoting the missing messages, which only the orchestrator holds.
- L7: fixed; dated note on ticket 10 (Part file reads as Item file); ticket 26:75 says each spec names its part selectors.
- L8: fixed; dated note on ADR 0011 clause 7 pointing at ADR 0042's note and ticket 35.
- L9: fixed; dated note on ADR 0080 point 5 and a clause in `building-blocks.md` 1.3 naming ADR 0060 point 10's `yeti-types.ts`.
- L10: fixed; rows 32 and 34 cite A11Y-3a and A11Y-3b.
- L11: fixed in ADRs 0018, 0021, 0040, tickets 13 and 08, the guide, and `building-blocks.md` 1.13; uses that describe what software does are left.
- L12: not applied; pushed history. Later commits keep subjects at 72 characters or fewer, with a body for every non-claim commit.
- L13: fixed in ticket 30, both accordion READMEs, and ADRs 0003 and 0004; the section sign inside a quotation and Angular's U+0275 identifiers stay.
- L14: fixed; Target platform names the pin decision, the Standing rulings heading covers 2026-10-01 to 2026-10-03, and the two links carry ticket titles.
- L15: fixed in the guide and `building-blocks.md`.
- Deferred to ticket 35: the "pending ticket 35" markers on guide P26 and `building-blocks.md` 1.5, upstream bug A6's outcome, and the ADR 0011 note wait for ticket 35's outcome to be folded in by the orchestrator. Ticket 35 resolved while these fixes ran; only its header was read here.
- Also fixed, outside the findings: guide P16 no longer lists the CDK services ADR 0043 does not inject; `building-blocks.md` 1.12 no longer calls ticket 27 open.

## Link check on this file

Run last with `node <scratchpad>/audit0003.mjs .scratch/ngx-yeti-specs/audits/0003-third-wave.md`: see the line directly below, added after the run.

Result: 4 links checked in this file, none broken (exit 0). The whole bundle with this file included prints the same 20 problems as above and no new one. Banned-word, paired-term, variant, email-shaped-token, and non-ASCII searches over this file exit 1. At the end of the audit `git status` showed one untracked folder besides this file, `prototypes/hydration-safe-ids/`, which ticket 35's run is writing; it is uncommitted and not audited here.
