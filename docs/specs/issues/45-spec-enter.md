# 45. Spec: enter (utility)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `enter` utility, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/enter.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

### Open

Each point is marked "(open: see ticket, item N)" in the spec. Impact and confidence follow the trap-quadrant rule (map, Standing rulings, 2026-10-03).

1. **Is the `arrived` signal public?** Impact LOW, confidence HIGH. Recommendation: no. Make it a private `#arrived` signal, and let `exportAs` expose the inputs only. Reason: Yeti declares no Event for `enter` (`js[0].events` is empty), ticket 26 adds no output, and a consumer who needs the moment can listen to the native `animationstart` or `animationend`. A public member could be added later without breaking anything.

   Decided 2026-10-03 in ticket 50, decision 19 (orchestrator, full AFK mode).
2. **Changes to `once` after the first client render.** Impact MEDIUM, confidence MEDIUM. Recommendation: the arrival is one-way. Once `arrived` is true, no value of `once` renders `data-once` again. A `once` that is `false` at the first client render counts as already arrived, so a later `true` renders nothing and creates no observer. Before the arrival, `once` toggles the attribute and the observer follows it. Reason: Yeti's design never puts the attribute back ("nothing here ever puts it back", `enter.js` header). Without the latch, a later `true` would hide an element that had already arrived and replay its arrival. Test layer 2 covers both cases.

   Decided 2026-10-03 in ticket 50, decision 20 (orchestrator, full AFK mode).
3. **A `once` element already near the viewport when the app hydrates.** Impact HIGH, confidence MEDIUM. This is a trap-quadrant point.
   - **Options:**
     - (a) Like for like: the observer reports the element at once after hydration. `data-once` goes, and the element jumps to its `from` keyframe (transparent, offset) and arrives. This is what `enter.js` does at load, only later.
     - (b) Skip the arrival for an element that intersects on the observer's first callback: set `arrived` without letting the animation play. The element stays as painted, so no CSS rule would hide it. This needs a way to remove `data-once` without starting the animation (a temporary `animation: none` style, or reading the first entry before the binding changes), which is new package behaviour on top of Yeti.
     - (c) Usage rule only: document that `once` is for content that starts below the fold, and keep (a)'s behaviour.
   - **Approve or dismiss:**
     - (a) keeps the replacement like for like, as building-blocks row 45 and ADR 0040 ask ("none (like-for-like)"). The cost is a visible flash on SSR and prerendered pages: content painted at first paint disappears at hydration and fades back. The delay is as long as hydration takes, where `enter.js` ran before or near first paint.
     - (b) removes the flash, but it adds behaviour Yeti does not have. It needs an inline style or a second state, and ADR 0003 point 3 and building-blocks 1.6 point 1 say the directive adds no class or inline style for animation. It would also make a client-rendered page and an SSR page behave differently for the same markup.
     - (c) costs nothing, but it only describes the problem.
   - **Recommendation:** (a) plus (c): keep the behaviour, and add the usage rule (the spec already states it, quoting Yeti's "as it first comes near the viewport"). Test layer 4 records the delay between first paint and arrival for an in-view `once` element.
   - **Evidence:** `enter.js:23-31` and `enter.css:103-114` (read). That the observer reports an in-view element on its first callback is the platform's documented behaviour (read). The size of the visible gap under hydration is inferred, not measured: ticket 18 measured the race only for a below-the-fold element.
   - **To overrule:** an implementer who chooses (b) adds the skip in the observer's first callback, and records a new design decision and a ledger-neutral note. Because (b) adds a style write, they must also amend the ADR 0003 point 3 and building-blocks 1.6 point 1 statements for this directive, and change the layer 2 and layer 4 cases from "arrives after hydration" to "stays as painted".

   Decided 2026-10-03 in ticket 50, decision 21 (orchestrator, full AFK mode).
4. **May a consumer write `animate.enter="enter"`?** Impact LOW, confidence MEDIUM. Recommendation: a usage rule. On an element it inserts, the consumer writes `yetiEnter`, which already plays on insertion (ticket 18, measured), and never writes `animate.enter="enter"` beside `yetiEnter` on one element. Building-blocks 1.6 point 2's allowance of Yeti's `enter` class in `animate.enter` stays for package host bindings. Reason: ADR 0003 says the consumer writes no Yeti class. Angular removes the `animate.enter` class after one frame (ADR 0060 point 6). A typed `yetiEnter` covers every arrival, not only the default fade.

   Decided 2026-10-03 in ticket 50, decision 22 (orchestrator, full AFK mode).
5. **Two item directives on one host and `data-ngx-yeti-item`.** Impact HIGH, confidence MEDIUM. This is a trap-quadrant point. It is shared with the `lift` and `print` specs, which found the same gap.
   - **The gap:** ADR 0060 point 2 has every directive set `data-ngx-yeti-item="<item>"` on its host. Point 4 removes an item's link once no connected element carries that value. `yetiEnter` commonly shares its element with a layout or `media` (`<ul yetiGrid yetiEnter="rise" stagger>`, Yeti's own `class="grid enter"`). Then two static host attributes of one name collide: one value wins, and the other item's link can be removed while its host is still on the page (read; not measured).
   - **Options:**
     - (a) A space-separated list in one attribute (`data-ngx-yeti-item="grid enter"`), matched with `~=` by the sweep. One attribute stays, but it needs a host binding that merges the values from every directive on the element, which no record provides.
     - (b) One attribute per item (`data-ngx-yeti-item-enter`), which needs no merging and is matched by attribute presence. It adds an attribute name per item.
     - (c) The sweep counts live instances only and ignores the DOM for items that share a host. This loses ADR 0060 point 4's protection for dehydrated and leaving hosts.
   - **Approve or dismiss:**
     - (b) is the smallest change that keeps point 4's DOM-based removal, and static host attributes never collide.
     - (a) keeps one name, but it needs coordination between directives.
     - (c) brings back the gaps ADR 0060 measured.
   - **Recommendation:** (b). Record it as a note on ADR 0060, decided once for every spec.
   - **Evidence:** ADR 0060 points 2 and 4 (read); Yeti's docs example with `grid enter` (read). The collision itself is inferred from Angular's host-attribute merging, not measured. The `print` spec's layer 2 case records which value survives.
   - **To overrule:** choosing (a) means writing the merge mechanism into ADR 0060 and the `setup` spec. Choosing (c) means accepting the dehydrated-host gap in ADR 0060's consequences. Either way this spec's contract-mapping row and section 8 change to match.

   Decided 2026-10-03 in ticket 50, decision 12 (orchestrator, full AFK mode).

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/enter.md](../specs/enter.md).

The spec has 35 user stories and 5 open points. Two of the open points are trap-quadrant points (3 and 5, both HIGH impact with MEDIUM confidence), and each is written up above with its options. `NgxYetiEnter` (`[yetiEnter]`, `exportAs: 'yetiEnter'`) maps the class `enter` and the five attributes by ADR 0070 rules U, R, and S. It owns `data-once` as a `computed` of `once` and a private `arrived` signal, set by a per-instance `IntersectionObserver` with `enter.js`'s `rootMargin`. It replaces `enter.js` like for like, so it adds no ledger row, and it uses none of the four shared specs. No open point blocks the spec.
