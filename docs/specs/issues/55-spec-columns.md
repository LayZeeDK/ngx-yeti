# 55. Spec: columns (layout)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `columns` layout, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/columns.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/columns.md](../specs/columns.md).

Two directives in `ngx-yeti/columns`. The item directive `NgxYetiColumns` on `[yetiColumns]` has `exportAs: 'yetiColumns'`. It binds a static `columns` class and the presence attribute `data-ngx-yeti-item-columns` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), and binds `data-threshold`, `data-gap`, `data-align`, `data-justify`, and `data-columns` from the inputs `threshold: YetiWidth`, `gap: YetiGap`, `align: YetiAlign` (`removed`), `justify: YetiJustify`, and `columns: YetiColumns` ([ticket 26](26-decide-yeti-data-attributes-mapping.md) rows 19 to 23). It acquires the `columns` item file ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)) and provides `yetiColumnsToken`. The part directive `YetiColumnsChild` on `[yetiColumnsChild]` has `exportAs: 'yetiColumnsChild'`. It binds `data-span` from `span: YetiSpan` (`inert`; ticket 26 row 24, kind C) and injects the token optionally with `skipSelf`. Native platform, level 1, types only ([building-blocks.md](../building-blocks.md) Part 2 row 5). No ledger rows.

Checked at the pin against the `yeti.d.ts` that ADR 0080 used: `YetiColumns` is exported (the `columns` vocabulary), so the class is `NgxYetiColumns`. `YetiColumnsChild` is not exported, so the part keeps `Yeti`. All six input types exist there.

Counts: 41 user stories, 7 usage rules, 6 story ids, 3 open points (one HIGH impact with MEDIUM confidence, so it is in the trap quadrant and is recorded with its options below). The spec writes no ledger or upstream-bug row.

### Open

1. **A static `align="center"` on the host, against the hydration rule** (spec sections 4 usage rule 6, 11, and Testing). Impact: HIGH. The same question applies to every `removed`-kind input across the specs: `align` on 8 items, `border` on a table, and `start` on a grid child. Confidence: MEDIUM.
   - The conflict: building-blocks 1.4 defines the `removed` kind for an input named like an HTML attribute (`'[attr.align]': 'null'`), and requires each spec's SSR smoke to write the static form and assert that the attribute is absent. So the records expect `align="center"` to be written statically. The building-blocks "Hydration constraints (2026-10-03)" bullet says a consumer writes no static attribute on an attribute a directive binds, because hydration writes it back. Ticket 33 read that such an attribute "is written back and removed again at hydration".
   - Option A (recommended): accept the static form for `removed` inputs. The server HTML has no `align`. Hydration writes it back, and the constant `null` binding removes it again in the same synchronous pass, so the final DOM equals the server's and no frame paints the hint between the two writes. That last point is inferred. Approve because it keeps `align="center"` working like every other static input (`columns="3"`, ADR 0070 rule 2), and the hint never reaches a painted frame or the server HTML. The evidence is ticket 33's reading (read, not run) plus the frame claim (inferred). The fixture-app e2e in the spec checks it: no `NG05xx`, and no `align` after hydration.
   - Option B: a usage rule that `removed`-kind inputs are bound only (`[align]="'center'"`). A bound input renders no HTML attribute, so the `null` binding would never have anything to remove. Dismiss because it breaks the uniform static-input form for 10 inputs, contradicts building-blocks 1.4's SSR-smoke instruction, and the forbidden form fails silently: it renders the same final DOM.
   - Option C: rename the inputs (`alignment`). Dismiss because it breaks the map's Input naming record (Yeti's names in camelCase), and ticket 139's rule exists so that the names can stay.
   - To overrule: an implementer who prefers B replaces usage rule 6 with "bind `align`; never write it statically", removes the static form from the SSR smoke and the e2e fixture, and adds the same rule to the other `removed`-kind specs. If the e2e case finds an `NG05xx` or a painted hint, B wins.

   Decided 2026-10-03 in ticket 50, decision 9 (orchestrator, full AFK mode).
2. **Whether a part directive sets its item's presence attribute and acquires the item file** (spec sections 2, 4, and 13). Impact: MEDIUM. It sets a precedent for every part directive, but nothing visible changes for `columns`. Confidence: MEDIUM. ADR 0060 point 2 says "every directive and component" sets the host attribute and acquires, while ADR 0045 speaks of "each item directive". Recommendation: no. `YetiColumnsChild`'s only rule, `.columns > [data-span]`, can apply only under a `[yetiColumns]` host. That host is in the DOM whenever the rule matters, so it already holds the link, dehydrated or not. A presence attribute on every spanned child would add server HTML and a second acquisition that never decides anything. If the orchestrator prefers the literal reading of point 2, the child adds the static `data-ngx-yeti-item-columns` and acquires `columns` in its constructor. Nothing else in the spec changes.

   Decided 2026-10-03 in ticket 50, decision 6 (orchestrator, full AFK mode).
3. **building-blocks 1.7 and `architecture-guide.md` call columns' `data-threshold` a container query** ("`data-threshold` on `nav` and `columns` is the nav's own container query"). `columns.css` has no `@container` and no `container-type`. Its switch is `flex-basis: calc((var(--_yeti-threshold) - 100%) * 999)` against the flex container's width, which ADR 0011's Considered options already call "flex-basis arithmetic". Recommendation: the orchestrator corrects both sentences to "decided by the container's width (a container query on `nav`, flex-basis arithmetic on `columns`)". The rules that follow (no breakpoint service, tests resize the container) stand unchanged. Impact: LOW (wording only). Confidence: HIGH (read in `columns.css` at the pin).

   Decided 2026-10-03 in ticket 50, decision 33 (orchestrator, full AFK mode).
