# Audit 0005: portability of the bundle into the ngx-yeti repository

Date: 2026-10-03
Auditor: portability auditor (Opus 5.5); read-only except this file

## Scope

Everything under `.scratch/ngx-yeti-specs/` at HEAD `cb48e07` ("mark the ngx-yeti map's destination reached"); `git status --short .scratch/ngx-yeti-specs` printed nothing before the audit, so the working tree equals HEAD for the bundle (checked). 520 files, 8.8 MB: `specs/` 54 files (3.4 MB), `adr/` 31 (270 KB), `issues/` 93 (1.3 MB), `research/` 16 (524 KB), `prototypes/` 315 (2.9 MB), `audits/` 4 (160 KB), and seven top-level files (`README.md`, `map.md`, `CONTEXT.md`, `building-blocks.md`, `architecture-guide.md`, `ledger.md`, `upstream-bugs.md`).

The question: can the bundle be copied as one folder into a new, separate repository (`ngx-yeti`) and be ingested there, by GSD's `/gsd-ingest-docs` or by a coding agent reading `specs/`, when `.scratch/next-foundation-specs/` and the rest of this repository do not exist?

Classes used below:
- **Spec or binding record** (an implementer reads it as a requirement): `specs/`, `adr/`, `building-blocks.md`, `architecture-guide.md`, `CONTEXT.md`, `ledger.md`, `upstream-bugs.md`, `README.md`, and `map.md` (its Standing rulings and Inherited preferences bind).
- **Provenance** (history and evidence): `issues/`, `research/`, `prototypes/`, `audits/`.

## Method

1. **Link and path scan (script).** `port.mjs` (session scratchpad) walks every `.md` file in the bundle, extracts each inline link `](target)`, resolves relative targets against the file's folder, and buckets them: a target containing `next-foundation-specs`; any other relative target that resolves outside the bundle root; inside. It also lists every plain-text `next-foundation-specs` occurrence outside a link target, and counts per folder and class. Control: a scratch tree with one inside link (`../../a.md` from `p/x/`), one link leaving the root (`../../../AGENTS.md`), and one old-bundle link printed exactly one outside link and one old-bundle link. The scan's totals (176 links plus 54 plain-text mentions) equal `rg -o 'next-foundation-specs'` over the bundle (230, in 46 files).
2. **Absolute paths (`rg -uu -P`).** Patterns for a drive-letter path not preceded by a letter or digit (`d:/projects`, `D:/tmp`, `C:/Users`, backslash forms), MSYS paths (`/d/tmp`, `/c/Users`), `/tmp/`, and the word `scratchpad`, per folder, with a positive control (`D:/tmp/a`, exit 0). The first, looser pattern also matched `https:` and was replaced.
3. **Session content.** `rg -i` per folder for `orchestrator`, `AFK`, `subagent`, model names, `session`, `scratchpad`, fetch tools, skill names, `AGENTS.md`, `docs/agents`, and `CLAUDE.md`; each hit in a spec or binding record read in context.
4. **Prototypes.** `du`, `find` for `node_modules`, `dist`, `.angular`, `build`, `out`, `coverage`, `.nx`, lockfiles, `.env*`, keys; `file --mime-encoding` over every file; the 15 largest files; `git ls-files --eol` for line endings; a secret-shape `rg` (token prefixes, private-key headers, `_authToken`, bearer headers, `password=`, `api_key=`) with a control line (exit 0 on the control, exit 1 on the bundle).
5. **Ingestion.** Read `README.md`, `map.md`'s headings and Notes, every ADR's front matter (`awk`), a sample of each spec's decision citations, and the `/gsd-ingest-docs` skill and its workflow (`~/.claude/gsd-core/workflows/ingest-docs.md`, steps `discover_docs` and the cap).
6. **Identity and the temporary file.** Allowlist inversion only: every email-shaped token (a local part, an at sign, and a host with a dot) in the bundle with `-uu`, minus the approved public address, host masked in the output; control line with the approved address and one reserved example address printed only the example, masked. The temporary-file prefix searched as a fixed string over the bundle (exit 1; control exit 0). The file itself was not read. No domain was searched for at any point.
7. **Old bundle.** Only the existence and size of the eleven old files that binding records cite by name were checked (`ls`, `wc -c`); none was read.

Not checked: whether every spec states every decision it cites in full (sampled in `specs/dropdown.md` and by the earlier audits' sweeps, not re-read line by line); whether each prototype still runs; links inside non-Markdown files.

## Findings

Counts: High 0, Medium 5, Low 7.

Summary of the counts asked for (lines; files in brackets):

| Category | `specs/` | `adr/` | top-level | `issues/` | `research/` | `prototypes/` | `audits/` | Spec/binding | Provenance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Links to `next-foundation-specs` | 0 | 39 [20] | 6 [2] | 109 [6] | 21 [2] | 0 | 1 [1] | 45 [22] | 131 [9] |
| Plain-text `next-foundation-specs` | 0 | 22 [22] | 12 [4] | 7 [6] | 8 [6] | 0 | 5 [3] | 34 [26] | 20 [15] |
| Other links leaving the bundle | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `AGENTS.md` / `CLAUDE.md` / `docs/agents` in text | 0 | 1 | 13 | 10 | 1 | 0 | 5 | 14 | 16 |
| `d:/projects/...` (reference clones) | 45 | 1 | 7 | 17 | 23 | 7 | 4 | 53 | 51 |
| `D:/tmp/...` and `/d/tmp/...` (run folders) | 14 | 1 | 0 | 32 | 42 | 83 | 5 | 15 | 162 |
| `scratchpad` | 0 | 0 | 0 | 4 | 2 | 0 | 20 | 0 | 26 |
| `C:/Users`, `C:\Users` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Temporary-file prefix | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

The 46 files with any old-bundle reference split 27 spec/binding (20 ADRs with links, two more ADRs with text only, `map.md`, `upstream-bugs.md`, `architecture-guide.md`, `building-blocks.md`, `CONTEXT.md`) and 19 provenance (10 tickets, 6 research files, audits 0001 to 0003). No spec mentions the old bundle at all.

### Medium

**M1. 45 links in 22 binding records point into `../../next-foundation-specs/` and will be dead in the new repository.** (checked by script)
Files: line 7 (`Adapted from [ADR NNNN](<old-bundle>/adr/...)`, where `<old-bundle>` stood for `../../next-foundation-specs`) of ADRs 0003, 0005, 0010 to 0025; further links at `adr/0003-...md:22`, `adr/0004-...md:7` and `:21`, `adr/0005-...md:26`, `adr/0010-...md:15`, `adr/0013-...md:30`, `adr/0014-...md:9`, `adr/0018-...md:16`, `adr/0021-...md:15`, `adr/0070-...md:32` and `:37`; `map.md:128`, `:131`, `:132`, `:133`; `upstream-bugs.md:36` (two).
Evidence: each target resolves to `.scratch/next-foundation-specs/` (script), which the new repository will not have. A link checker or an ingestion cross-reference pass reports 45 broken targets in records that otherwise check clean.
Meaning: no decision is stated only as "see old ADR NNNN". Every adapted ADR restates its decision under "We decided" (read: ADR 0019 in full; the other 21 by their line-7 lead-in and decision list), `map.md:128-133` states each inherited rule in its own words, and the presentational-attribute rule that `adr/0005-...md:26`, `adr/0070-...md:37`, and `map.md:133` credit to old ticket 139 is stated in full at `building-blocks.md:52`. The 34 plain-text mentions in binding records (`of .scratch/next-foundation-specs/`, "New for Yeti: no record of ...", `CONTEXT.md:5`'s "old glossary" origin label, `building-blocks.md:3`, `architecture-guide.md:3`, `map.md` Inheritance and Sources) are provenance and read correctly once the links are text. The one exception is M2.
Fix: rewrite each old-bundle link in binding records to plain text, for example `the old bundle's ADR 0039 (directives-manage-every-foundation-class; not copied)`. One scripted substitution over the 22 files; optionally the same over the 9 provenance files (131 links) so the whole bundle's link check stays clean.

**M2. ADR 0018 point 4 leaves the later-milestone import checks with their evidence only in the old bundle.** (checked)
File: `adr/0018-no-import-arrays-and-later-milestone-import-checks.md:16` (`The old bundle's [Spec: forgotten-import checks (shared utility)](<old-bundle>/issues/150-spec-forgotten-import-checks.md) and its two prototypes are its evidence`); `:14` lists the four checks in one sentence each.
Evidence: `issues/11-decide-spec-list.md` keeps no import-check spec (`rg -i import`, no hit), and `map.md:143` (Milestones) defers every check to a later milestone of the implementing repository. So the only specification-level text for those checks is the old ticket 150 (63,394 bytes, checked by `wc -c`), which will not be copied. Whoever specifies the later milestone in `ngx-yeti` has ADR 0018 point 3's outline and nothing else.
Fix: either vendor old ticket 150 as `research/old-forgotten-import-checks-spec.md` with a one-line provenance header (old path and commit) and point `:16` at it, or state at `:16` that the evidence stays in the ngx-foundation-sites repository at commit `cb48e07` and was not copied. The first keeps the bundle self-contained; it is one new file and one edit.

**M3. 44 specs, ADR 0001, and three top-level files define their source short forms by local clone paths.** (checked)
Files: the short-form sentence (`` `Y/` is `d:/projects/github/foundation/yeti/` ``, plus `NC/`, `NGP/`, `NG/`, `APG/`) in 44 specs, at line 7 or 9 (for example `specs/tabs.md:9`); `building-blocks.md:5`; `architecture-guide.md:51` and `:157` (`d:/projects/github/angular/angular/CHANGELOG.md:937`); `map.md:157-160` (Sources table); `adr/0001-...md:7` (`d:/projects/github/foundation/yeti/LICENSE`). 50 specs use the short forms; the 6 that do not define them (`attention`, `events`, `fragment-links`, `print`, `setup`, `visually-hidden`) rely on `building-blocks.md:5` or say "Yeti at `f52d1e8b9`" (`specs/visually-hidden.md:9`).
Evidence: 53 binding lines name five repositories under `d:/projects/github/` (`foundation/yeti` 48 times, `angular/components` 34, `angular/angular` 24, `w3c/aria-practices` 10, `w3c/aria` 1). The commits are given (`f52d1e8b9`, `5db6fc4453`, `708d4c6e2`, `3f094fd`), so the citations stay checkable, but an implementer must guess that a local path stands for a GitHub repository.
Who must act: an implementer following a `Y/src/...:NN` or `NC/src/...:NN` citation, which the specs use as evidence throughout (audit 0004 L10 counted 942 `file:line` citations in Implementation Decisions).
Fix: one "Sources" table in `README.md` mapping each short form to its repository URL and commit, then replace `d:/projects/github/<owner>/<repo>` with `github.com/<owner>/<repo>` across specs, ADR 0001, and the three top-level files (one scripted substitution, 53 lines).

**M4. `/gsd-ingest-docs` cannot ingest the bundle in one run, and its directory rules misclassify the audits.** (checked against the workflow)
Evidence: the workflow's `discover_docs` step has a hard cap of 50 documents per run and exits above it. `specs/` alone has 54 files and `adr/` 31. Its ADR rule also matches any `[0-9]{4}-*.md`, so `audits/0001-...md` to `0004-...md` (and this file) would be classified as ADRs; and if the bundle is placed under a `docs/` folder, the generic rule picks up all 223 Markdown files. Its conflict engine ranks ADR above SPEC; ADR front matter carries only `status: accepted` (31 of 31), while partial replacements live in dated notes (ADR 0042 points 1, 3, 4 replaced by ADR 0044, `adr/0042-...md:31`; ADR 0060 point 2 by ADR 0045, `adr/0060-...md:55`; ADR 0005's package-declared types by ADR 0080 point 5, `adr/0080-...md:31`), which a classifier reading front matter may report as conflicts between two accepted ADRs.
Fix: ship an ingestion manifest beside `README.md` (`ingest-manifest.yaml`, `{path, type, precedence}`), split into runs of at most 50: run 1 (`--mode new`) the 31 ADRs plus `building-blocks.md`, `CONTEXT.md`, `ledger.md`, `architecture-guide.md`; runs 2 and 3 (`--mode merge`) 27 specs each. List no file from `issues/`, `research/`, `prototypes/`, or `audits/`. Optionally add `amended-by:` to the front matter of ADRs 0005, 0042, and 0060.

**M5. "This repository's `AGENTS.md`" will name a different file after the copy.** (checked)
Files: `building-blocks.md:21`, `:34`, `:35`, `:43`, `:244`; `architecture-guide.md:388`, `:396`, `:472`, `:473`; `map.md:93`, `:130`, `:147`; `adr/0012-...md:14`. `map.md:116` names the user's global `CLAUDE.md`.
Evidence: in the ngx-yeti repository, "this repository's `AGENTS.md`" will be that repository's own file, whose content is unknown. The rules these lines rely on are stated inline (the image rule at `building-blocks.md:35`, the token form at `:43` and `adr/0012-...md:14` with a quotation, member visibility at `architecture-guide.md:388`, the implementation order at `building-blocks.md:21`), so no meaning is lost; the referent is what changes. `architecture-guide.md:396` ("Decided by: ... `AGENTS.md` Member Visibility") is the only line whose source would then point at the wrong file.
Fix: replace "this repository's `AGENTS.md`" with "ngx-foundation-sites' `AGENTS.md` (the planning repository)" in the 13 lines (one scripted substitution), and leave a decision on the new repository's own `AGENTS.md` to that repository.

### Low

**L1. 15 binding lines name a temporary Yeti build folder.** (checked) `D:/tmp/ngx-yeti-02/yeti/dist/yeti.d.ts` in `specs/box.md:145`, `breakout.md:139`, `center.md:132`, `cluster.md:125`, `:153`, `columns.md:139`, `container.md:142`, `cover.md:98`, `:135`, `lede.md:122`, `masonry.md:150`, `scroller.md:144`, `timeline.md:157`, and `adr/0080-...md:16`; `D:/tmp/ngx-yeti-19` in `specs/field.md:511`. The reader does not need the folder: the 46 names are listed in the bundle (`adr/0080-...md:40`, ticket 50 decision 10). Fix: "Yeti's `dist/yeti.d.ts`, built at the pin" (one substitution).

**L2. `map.md` mixes the planning run's process with binding notes.** (checked) The sections Process rules carried over (`:37-43`, with `.scratch/ngx-yeti-specs/` paths at `:42` and `:43`), Models and briefs (`:114-122`, model types and `~/.claude/references/...`), Skills each session consults (`:149-151`), Sources (`:153-163`, local clone paths, fetch tools), Concurrency rules (`:165-167`), and the Temporary files ruling (`:111`, a file in this repository's root) bind only the planning run. Standing rulings (`:45-112`) hold the user's verbatim quotes and are fine to carry; `:109` quotes a `.scratch\` path inside the user's own words, which stays. Fix: none in `map.md`; one paragraph in `README.md` saying which map sections are the planning run's process.

**L3. "The orchestrator" is not defined for an implementer.** (checked) 16 specs (for example `specs/alert.md:177`, `specs/navigation-close.md:7`), 32 lines in 16 ADRs, and five top-level files attribute decisions to "the orchestrator", in full AFK mode. The attribution is useful (it marks decisions an implementer may overrule, `README.md:23`), but the word is never defined. Fix: one sentence in `README.md` (the planning agent that ran the map; its decisions are not the user's and may be overruled per each trap-quadrant record).

**L4. 16 files have CRLF or mixed line endings in the working tree; the index holds LF for all.** (checked by `git ls-files --eol`) 11 `w/crlf` (`issues/87-spec-seam.md`, five files in `prototypes/aria-composition-roving/`, four in `prototypes/aria-nav-dropdown/`, `prototypes/yeti-spa/angular.json`) and 5 `w/mixed` (`prototypes/aria-composition-accordion/results/uia.txt`, four `build.log.tail` in `prototypes/yeti-github-dependency/`). A file-system copy carries the CRLF bytes. Fix: copy from the index (`git archive HEAD .scratch/ngx-yeti-specs`), not the working tree.

**L5. Prototypes keep 900 KB of measurement JSON.** (checked) Nine JSON files over 50 KB, eight of them `prototypes/yeti-rendering-modes/results/*.json` at about 100 KB each. They are the measurements the READMEs cite; keeping them is a choice, not an error. No `node_modules`, `dist`, build output, lockfile, `.env`, key, or binary is present; `uia.txt` is extended-ASCII text from a UI Automation dump; `prototypes/yeti-github-dependency/optE/lock-entry.txt` and `prototypes/aria-nav-dropdown/results/results.json` are empty files. Fix: none required; nothing is removed by this audit.

**L6. Provenance files keep dead machine paths.** (checked) 162 `D:/tmp/...` or `/d/tmp/...` lines, 51 `d:/projects/...` lines, and 26 `scratchpad` lines across `issues/`, `research/`, `prototypes/`, and `audits/`; four shell scripts hard-code `/d/tmp/ngx-yeti-21` and `/d/tmp/ngx-yeti-22` (`prototypes/yeti-nx-build/scripts/move-pin.sh:5-6`, `prototypes/yeti-github-dependency/scripts/mk.sh:4`, `check.sh:3`). They record where a measurement ran; no spec asks a reader to open them. Fix: none; the README paragraph of L2 says machine paths in provenance are records of the run.

**L7. Two email-shaped tokens remain, both SSH remotes.** (checked) `prototypes/yeti-github-dependency/README.md:40` and `prototypes/yeti-github-dependency/optA/lock-entry.txt:3`, a `git@<host>` remote each, as audits 0003 and 0004 recorded; not a person's address. The approved public address does not occur in the bundle (0 hits), so nothing else is allowed and nothing else is present. Fix: none.

## Verified OK

- **Spec stand-alone check.** No spec links to or names the old bundle (script: 0 links, 0 text mentions in `specs/`). Specs link only inside the bundle: 1,266 links to `issues/` (849 of them to ticket 50), 1,205 to `adr/`, 134 to `building-blocks.md`, 104 to `ledger.md`, 30 to `prototypes/`, 17 to `research/`, plus `CONTEXT.md`, `architecture-guide.md`, `map.md`, `upstream-bugs.md`, `audits/`. Sampled decision citations in `specs/dropdown.md` state the decision and then cite it (for example `:225`, `:385`); the only "(see ...)" pointer found by `rg` is `specs/setup.md:210`, which states its rule first.
- **No other link leaves the bundle.** 5,963 relative Markdown links; 0 resolve outside the root apart from the 176 old-bundle links (script, with the control above). The 31 `../../` links in prototype READMEs resolve to `adr/` (11), `issues/` (17), and `research/` (3) inside the bundle. No Markdown link targets `AGENTS.md` or `docs/agents/`; those are text only (M5, and 16 provenance lines).
- **One entry point.** `README.md` says what the bundle is, the reading order (map, records, specs), lists the cross-cutting documents and all 54 specs by group (5 shared, 7 utilities, 17 layouts, 3 recipes, 22 components), and says the ticket-50 decisions are the orchestrator's, not the user's.
- **ADR status lines.** All 31 ADRs open with YAML front matter `status: accepted` (`awk` over the front matter; no other key).
- **Standing rulings.** `map.md:45-112` introduces each ruling as the user's words, mostly with "the user wrote, verbatim"; the one summary (`:111`, temporary files) says it is the orchestrator's summary. Audit 0004 compared the copies in the specs against these; not re-compared here.
- **Session content in specs.** No spec mentions a subagent, a model name, a skill, a fetch tool, a scratchpad, or the temporary file. The six `session` hits in specs are a user's browsing session (`specs/shell.md:57`, `:285`, `:476`; `specs/navigation-close.md:51`; `specs/icon.md:375`), and the eight `AFK` hits in specs are pointers to the map's rule that upstream filing needs the user's confirmation, which stays true.
- **Identity.** Allowlist inversion over the bundle with `-uu`: no email-shaped token other than the two SSH remotes of L7; no domain searched for or written here. Temporary-file prefix: 0 hits (exit 1; control exit 0).
- **Secrets.** Secret-shape search exit 1 over the bundle, exit 0 on the control line.

## Copy recipe

In order. Steps 1 to 7 touch only spec and binding files, except the optional half of step 1; nothing is removed.

1. **Old-bundle links to text (M1).** One scripted substitution in the 22 binding files: `[text](<old-bundle>/<path>)`, with `<old-bundle>` either `../../next-foundation-specs` or `../next-foundation-specs`, becomes `text (old bundle, <path>; not copied)`. 45 links. Optional: the same script over the 9 provenance files (131 links) for a clean link check.
2. **Vendor the import-checks evidence (M2).** Copy old `issues/150-spec-forgotten-import-checks.md` to `research/old-forgotten-import-checks-spec.md` with a provenance line (old path, commit `cb48e07`), and point `adr/0018-...md:16` at it. One new file, one edit.
3. **Source short forms (M3).** Add a Sources table to `README.md` (Y/ `github.com/foundation/yeti` at `f52d1e8b9`; NG/ and NGP/ `github.com/angular/angular` at `5db6fc4453`; NC/ `github.com/angular/components` at `708d4c6e2`; APG/ `github.com/w3c/aria-practices` at `3f094fd`); then replace `d:/projects/github/` with `github.com/` in specs, ADR 0001, `building-blocks.md`, `architecture-guide.md`, and `map.md`. 53 lines, one substitution.
4. **Temporary build path (L1).** Replace `D:/tmp/ngx-yeti-02/yeti/dist/yeti.d.ts` with "Yeti's `dist/yeti.d.ts`, built at the pin" (14 lines) and edit `specs/field.md:511` by hand. 15 lines.
5. **`AGENTS.md` referent (M5).** Replace "this repository's `AGENTS.md`" with "ngx-foundation-sites' `AGENTS.md` (the planning repository)". 13 lines.
6. **README provenance paragraph (L2, L3, L6).** One paragraph: where and at which commit the bundle was planned; that the old bundle was not copied; which `map.md` sections are the planning run's process; that "the orchestrator" is the planning agent and its decisions may be overruled; that machine paths in `issues/`, `research/`, `prototypes/`, `audits/` are records of the run. One edit.
7. **Ingestion manifest (M4).** Add `ingest-manifest.yaml` with three runs of at most 50 files (ADRs plus the four cross-cutting documents; specs 1 to 27; specs 28 to 54), excluding `issues/`, `research/`, `prototypes/`, and `audits/`. One new file.
8. **Copy from the index (L4).** `git archive HEAD .scratch/ngx-yeti-specs | tar -x -C <ngx-yeti>/<target>` after committing steps 1 to 7, so every file arrives with LF endings.

Estimate: 7 edit steps before the copy, about 130 changed lines in spec and binding files (45 + 53 + 15 + 13 plus 2 new files and 2 hand edits), or about 260 with the optional provenance link rewrite. Steps 1, 3, 4, and 5 are scripted substitutions; a link check over the result should print no target outside the bundle.

## Resolution log

Applied 2026-10-03 on top of `e36cc60`, recipe steps 1 to 7 with the optional provenance half of step 1, by scripted substitution unless noted. Step 8 (copy from the index) is for whoever copies the bundle.

- **M1. Fixed.** All 176 old-bundle links are plain text naming the old record, for example "old map ADR 0036 (`modal-dialog-trigger-role`)": 45 in 22 binding files and 131 in 9 provenance files. Where a line already said `of .scratch/next-foundation-specs/`, the added "old map" was left out (18 ADR lead-ins). The three quotes of such links in this file (`:51`, `:57`, `:107`) now read `<old-bundle>` in place of the path.
- **M2. Fixed.** Old ticket 150 is copied as [research/old-forgotten-import-checks-spec.md](../research/old-forgotten-import-checks-spec.md), with a provenance line (old path, commit `e36cc60`); its 68 links became plain text naming the old files. ADR 0018 point 4 links to the copy and names the two prototypes (old tickets 145 and 149) as not copied.
- **M3. Fixed.** `README.md` has a Sources table: each prefix in use (`Y/`, `YETI/`, `NG/`, `NGP/`, `NC/`, `CMP/`, `APG/`, `FDN/`, `OLD/`) with its repository URL and full commit, plus `w3c/aria` (no commit cited). `d:/projects/github/` became `github.com/` on 52 lines in 48 spec and binding files, and on 42 lines in 33 provenance Markdown files. Not rewritten: this file's own quotes, and `prototypes/yeti-nx-build/scripts/move-pin.sh:8`, a shell command that clones from the local path.
- **M4. Fixed.** `ingest-manifest.yaml`: run 1 (`--mode new`) is the 31 ADRs plus `building-blocks.md`, `CONTEXT.md`, `ledger.md`, and `architecture-guide.md` (35 files); runs 2 and 3 (`--mode merge`) are 27 specs each. No file from `issues/`, `research/`, `prototypes/`, or `audits/` is listed. Not applied: the optional `amended-by:` front matter on ADRs 0005, 0042, and 0060, because it is outside recipe steps 1 to 7 and it would change three records; the manifest's header says where each records its replaced points.
- **M5. Fixed.** "this repository's `AGENTS.md`" and its variants now read "the planning repository's `AGENTS.md` (ngx-foundation-sites-next)": 13 binding lines (the 13 listed above) and 11 provenance lines. `README.md`, Provenance, says the bundle's `AGENTS.md`, `docs/agents/`, and `CLAUDE.md` mentions are the planning repository's or the user's global files, not ngx-yeti's own.
- **L1. Fixed.** 15 lines in all: 13 lines in 11 specs and ADR 0080 say "Yeti's built `dist/yeti.d.ts` at the pin"; `specs/cover.md:98` says "Yeti's built `docs/guides/layouts.md:104` at the pin", and `specs/field.md:511` calls ticket 19's probe "a temporary workspace, not shipped". No `D:/tmp` path is left in `specs/`, `adr/`, or the top-level files.
- **L2. Fixed** in `README.md`, Provenance: it names the map sections that describe the planning run only. `map.md` is unchanged, as the fix asked.
- **L3. Fixed** in `README.md`, Provenance, linked from the orchestrator mention at `README.md:23`.
- **L4. Not applied here.** It is a copy step (recipe step 8, `git archive`) taken after these edits are committed; the working-tree CRLF files are unchanged. Every file this resolution wrote or edited has LF endings (checked: no carriage return in the 112 changed or new files).
- **L5. Not applied.** No fix was required; the measurement JSON stays.
- **L6. Fixed** by one sentence in `README.md`, Provenance: prototype READMEs, research files, tickets, and audits name the temporary local workspaces they ran in, which are not shipped. The `D:/tmp` and scratchpad paths in provenance files are unchanged.
- **L7. Not applied.** No fix was required; the allowlist-inversion scan still finds only the two `git@` remotes.

Checks after the resolution: a link check that skips code spans and fenced blocks found 5,793 relative links in the bundle, 0 broken and 0 resolving outside it (its control tree reported one broken link and one outside link and skipped a link-shaped code span); `rg -n "\]\([^)]*next-foundation-specs"` over the bundle and `rg -n -i "d:/projects/github"` over `specs/` and `adr/` both print nothing.

## Link check on this file

All counts above were taken before this file was written and exclude it. Every link-shaped string in this file sits inside a code span, so a checker that skips code spans (as audit 0004's does) finds no link here; `port.mjs`, which does not skip code spans, reports four such strings at `:51`, `:57`, and `:107` (two), none a real link. After the resolution those strings read `<old-bundle>` in place of the old path; the Resolution log's one link, to the copy of ticket 150, resolves inside the bundle.
