# 15. Decide: whether Yeti's licence and readiness allow this package

Type: grilling
Status: resolved
Blocked by:
Labels: wayfinder:grilling
Map: ../map.md

## Question

Does Yeti's licence allow an Angular package that wraps it? And does its release state allow specs to be written against it now?

**Licence.** Yeti ships under FSL-1.1-MIT (`github.com/foundation/yeti/LICENSE`; `package.json` `"license": "FSL-1.1-MIT"`). A "Permitted Purpose is any purpose other than a Competing Use", and "A Competing Use means making the Software available to others in a commercial product or service that: 1. substitutes for the Software; 2. substitutes for any other product or service we offer using the Software" (`LICENSE:32-38`). The announcement, foundation/yeti#15554, says: "use it freely in your own sites and products, modify it, redistribute it; the one thing it reserves is offering Yeti itself as a competing product. Every release converts to plain MIT two years after it ships."

**Readiness.** The same announcement says "The `develop` branch is now Yeti 7 and is unstable until the beta. Do not build on it yet." The README says `7.0.0-beta`, while `package.json` says `7.0.0-alpha.0`; no tag exists, and nothing is on npm. The old map's Research: Yeti, Foundation's version 7 (ticket 194, `research-yeti-foundation-7`) left the licence question OPEN FOR HUMAN.

## How to work it

Human-only by kind. This is a legal reading of a licence for a package published under the user's identity, and the map's AFK override keeps such items with the user. The orchestrator prepares the facts:

- the licence text;
- the package's intended licence and distribution;
- whether it would bundle, depend on, or re-publish Yeti's files;
- the announcement's wording;
- any FAQ from the licence's authors.

The user decides; the orchestrator never does. Asking Foundation for clarification is outward-facing and needs the user's confirmation first. Until this resolves, the specs are drafted as research under the risk, and the map's Destination does not count as reached. (Stale since 2026-10-01: the user ruled on the licence, and readiness moved to ticket 12.)

## Answer

Resolved 2026-10-01 by the user's ruling, quoted verbatim:

> I approve that FSL-1.1-MIT is compatible with what we want to do as a free and open-source project that will be using the MIT license.

- **Licence:** decided by the user. The package is a free and open-source project under MIT, and it wraps Yeti under FSL-1.1-MIT. Recorded as [ADR 0001](../adr/0001-yeti-licence-compatible-with-mit-package.md).
- **Readiness:** not part of the user's ruling. The orchestrator moved it to [Decide: which Yeti version the specs target, and how the package tracks it](12-decide-yeti-version-policy.md), because it is a question about which version the specs target. Whether the specs may name only Yeti's frozen surface is an open question of that ticket (audit 0001, M5). That ticket records the announcement's warning as an input. This is the orchestrator's reading, not the user's words.
