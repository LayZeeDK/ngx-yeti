# 28. Research: whether the npm registry keeps a version's build metadata

Type: research
Status: resolved
Blocked by:
Labels: wayfinder:research
Map: ../map.md

## Question

The user's version format (map, Standing rulings, 2026-10-02; [ADR 0017](../adr/0017-release-policy-with-a-pinned-yeti.md)) puts the pinned Yeti in semver build metadata: `0.220200.0+yeti.7.0.0-alpha.0.f52d1e8`. `npm pack` with npm 11.16 keeps the `+` suffix in `package.json` and the tarball name (measured). Does the npm registry keep it once the version is published, and how does it show up in `npm view`, `npm install ngx-yeti@<version>`, the lockfile, `ng update`, and `nx migrate`? Do any registry rules on build metadata (for example, refusing two versions that differ only in metadata) affect this scheme, where every release also bumps its core version?

## How to work it

Use a `/research` subagent and read sources only: npm's docs, the source of the npm CLI, `pacote`, `npm-registry-fetch`, `@npmcli/package-json` (its `normalize.js` calls `semver.clean`, which strips build metadata; find out which commands run it), and registry issues or RFCs. Also check published packages that already use build metadata. Do not publish anything: a throwaway publish is outward-facing and needs the user's own confirmation. If the sources leave the answer open, say so and describe the publish test that would settle it. Write `research/npm-build-metadata.md` and append an `## Answer`. Decide nothing.

## Answer

Resolved 2026-10-02. Findings: [research/npm-build-metadata.md](../research/npm-build-metadata.md).

- No, the registry does not keep build metadata. `npm publish` runs `semver.clean` on the version (libnpmpublish `patchManifest`, `@npmcli/package-json` `fixVersionField`), so `0.220200.0+yeti.7.0.0-alpha.0.f52d1e8` is published as `0.220200.0` [read, measured with `npm publish --dry-run`].
- The `+` suffix survives only in the tarball's own `package.json`, so the installed copy shows it while `npm view`, `dist-tags`, the tarball URL and the lockfile do not [measured against a local mock registry].
- `npm view`/`npm install` with the full `+` spec still resolve (semver ignores build); `package.json` saves `^0.220200.0` [measured]. `ng update` and `nx migrate` compare with semver, which ignores build [read].
- Duplicate-version rejection does not affect this scheme, since each release bumps the core; two releases sharing a core and differing only in the pinned Yeti cannot be told apart in the registry [inferred].
- Open: the live registry was not queried and `ng update`/`nx migrate` were not run; the throwaway publish test is described in the findings file and needs the user's confirmation.

Note, 2026-10-03 (orchestrator, after audit 0003 M9): this Answer and its findings file do not cover prerelease tags. That a prerelease tag survives publish and that `npm publish --tag latest` accepts one was measured afterwards by the orchestrator, with a dry run, and is recorded in [ADR 0017](../adr/0017-release-policy-with-a-pinned-yeti.md)'s 2026-10-02 note ("later the same day"), not here.
