# Research: does the npm registry keep a version's build metadata

Ticket: [28](../issues/28-research-npm-build-metadata.md). Date: 2026-10-02. Decides nothing.

Tags: [measured] = I ran it here; [read] = read in source or a document, cited; [inferred] = reasoned from the above, not run.

Tooling used: npm 11.16.0, node 24.18.0, `semver` 7.8.1, `@npmcli/package-json` 7.0.5, `libnpmpublish` 11.2.0, `pacote` 21.5.0 (all bundled in npm 11.16.0, under `<node>/node_modules/npm/node_modules/`). Repo copies: `nx` 22.3.1, `@angular/cli` 21.0.4.

## Short answer

No. `npm publish` strips the `+...` suffix before it builds the registry document, so the registry never holds the build metadata in its version key, `dist-tags`, `npm view` output, tarball URL, or the lockfile. The suffix survives only inside the tarball's own `package.json`, which npm leaves untouched. For `0.220200.0+yeti.7.0.0-alpha.0.f52d1e8` the registry version is `0.220200.0`. Everything below follows from that.

## 1. Publish strips build metadata

- [read] `libnpmpublish@11.2.0` `lib/publish.js:82-91`: `patchManifest` runs `semver.clean(manifest.version)` and writes the result back to `manifest.version`. That manifest is what `buildMetadata` puts into `root.versions[...]`, `dist-tags`, `_id`, and the tarball name (`lib/publish.js:108-129`, `${manifest.name}-${manifest.version}.tgz`).
- [read] `@npmcli/package-json@7.0.5` `lib/normalize.js:175-190`: the `fixVersionField` step does `clean(data.version, loose)` and, when the result differs, records `"version" was cleaned and set to ...` and overwrites the field. `semver.clean` returns `SemVer#version`, which has no build part (`semver@7.8.1` `classes/semver.js:77` stores build separately; `:326-327` only `raw` re-appends it).
- [read] `npm@11.16.0` `lib/commands/publish.js:~275-285`: for a directory, `npm publish` calls `pkgJson.fix(...)` then `pkg.prepare()`, and warns when the fix changed something.
- [measured] `npm pack` on a probe package at `0.220200.0+yeti.7.0.0-alpha.0.f52d1e8` keeps the suffix in the tarball filename and in the reported version (confirms the ticket's claim).
- [measured] `npm publish --dry-run --registry http://127.0.0.1:1` on the same package prints `"version" was cleaned and set to "0.220200.0"`, then `ngx-yeti-probe-28@0.220200.0`, filename `ngx-yeti-probe-28-0.220200.0.tgz`. Same shasum and integrity as the `npm pack` tarball, so only the metadata is rewritten, not the tarball bytes.
- [measured] The packed tarball's inner `package.json` still reads `"version":"0.220200.0+yeti.7.0.0-alpha.0.f52d1e8"` (`tar -xzO package/package.json`).

So the published artifact has two version strings: the registry says `0.220200.0`, the tarball's `package.json` says `0.220200.0+yeti...`.

## 2. How each consumer path behaves

The registry itself was not queried for this package (nothing was published). To exercise the consumer side I ran a local mock registry (`D:/tmp/ngx-yeti-28/mock.mjs`) that serves a packument and tarball exactly as the cleaned publish payload would: version key `0.220200.0`, the tarball with the `+` package.json inside. The registry-side claim rests on section 1 plus the assumption that the registry stores the payload as sent [inferred]. The consumer-side results are [measured] against that mock.

- `npm view ngx-yeti-probe-28`: shows `ngx-yeti-probe-28@0.220200.0`, `dist.tarball` ending `-0.220200.0.tgz`, `dist-tags.latest: 0.220200.0`. No build metadata anywhere. [measured]
- `npm view "ngx-yeti-probe-28@0.220200.0+yeti.7.0.0-alpha.0.f52d1e8" version`: resolves, prints `0.220200.0`. A spec with build metadata still matches the stored version, because semver ignores build when matching. [measured]
- `npm install "pkg@0.220200.0+yeti..."`: installs. `package.json` gets `"^0.220200.0"` (default save-prefix; the build part is dropped from the saved range). [measured]
- Lockfile: `"version": "0.220200.0"`, `resolved` ends `-0.220200.0.tgz`. No build metadata. [measured]
- `npm ls`: prints `ngx-yeti-probe-28@0.220200.0` (reads the lockfile/ideal tree). [measured]
- Installed `node_modules/ngx-yeti-probe-28/package.json`: still has `"version":"0.220200.0+yeti.7.0.0-alpha.0.f52d1e8"` (tarball content). So `require('ngx-yeti/package.json').version` or a `readFileSync` of it shows the build metadata even though the lockfile and `npm ls` do not. [measured]
- Installing a local tarball by file path (not via a registry): the lockfile does keep the suffix (`"version": "0.220200.0+yeti..."`) and `npm ls` shows it, because there is no packument to supply a cleaned version. Not the registry path; noted only so nobody mistakes it for the registry result. [measured]
- `pacote` registry manifests are normalized with the same steps (`pacote@21.5.0` `lib/registry.js:129-134`, `PackageJson.normalizeSteps` minus `_attributes`), which includes the version clean. [read]

Build metadata is invisible to semver comparison: `semver.gt('1.0.0+a','1.0.0+b')` is `false`, `eq` is `true`, `satisfies('0.220200.0','0.220200.0+yeti.7')` is `true`. [measured, semver 7.8.1] This matches the spec: "Build metadata MUST be ignored when determining version precedence" (https://semver.org/spec/v2.0.0.html, item 10). [read]

## 3. `ng update` and `nx migrate`

Neither reads the build part from the registry, since the registry has none.

- `nx@22.3.1` `src/command-line/migrate/migrate.js`: version comparison goes through `normalizeVersion` then `semver.gt/lt/lte` (`:377-386`), with `cleanSemver = clean(v) ?? coerce(v)` (`:69-71`). Migrations are fetched with `npm view <pkg>@<version> nx-migrations ng-update dist --json` (`:632`), falling back to `npm pack` and an install (`:660-690`). The version recorded for a fetched package is `packageJson.version` read from the installed copy on the install fallback (`:~689`), which would carry the `+` suffix, but the `clean`/`coerce` step strips it before comparing. [read] How the `+` in a fallback-read version would be written into `migrations.json` was not run [inferred: cleaned on comparison, possibly printed raw].
- `@angular/cli@21.0.4` `src/commands/update/cli.js`: uses `semver.satisfies`, `semver.gt` (`:294`, `:505-512`) and `semver.valid(version) ?? undefined` (`:911`). `semver.valid` returns the stripped form. Installed version comes from the package's on-disk `package.json` (tarball content, with `+`); all comparisons ignore build. [read; consequence inferred]
- The migration range matching that matters for this scheme (`ng-update.migrations` versions, `nx-migrations` `version` fields) compares core versions only. Since every release bumps the core version (section 4), the build part is never needed to order releases. [inferred]

I did not run `ng update` or `nx migrate` against the mock. The above is from reading their source.

## 4. Registry rules on duplicates

- npm refuses to republish an existing version: the registry returns 403 with "You cannot publish over the previously published versions". Because the key stored is the cleaned version, `1.0.0+a` and `1.0.0+b` collapse to `1.0.0`, so the second is refused. [inferred from section 1; the 403 text is from memory of registry behavior and was not reproduced, nothing was published]
- The scheme in ADR 0017 bumps the core version on every release, so this rule does not bite: each release has a unique core. The only collision case is two releases that share a core and differ in the pinned Yeti (for example, a republish of the same core after a Yeti pin move). Under this scheme that case cannot be expressed in the registry at all. [inferred]
- Every registry path above shows the core version only, so the pinned Yeti is not discoverable from `npm view`, `dist-tags`, the lockfile, or the packument. It is discoverable from the installed `package.json` and from any custom field in the manifest (for example a `yeti` or `config` key, which the packument keeps because `fixName`/`_attributes` leave unknown fields alone [inferred]; I did not test that the registry preserves a custom field, but `pacote` returns arbitrary manifest fields, and `nx-migrations`/`ng-update` are read this way [read, nx `migrate.js:632-640]).

## 5. Published packages that use build metadata

[measured] A scan of the full packuments for `semver`, `typescript`, `core-js`, `@types/node`, `react` found no version key containing `+`. [inferred] That is consistent with the strip: no published version on the registry can have a `+` in its key. I did not find any package that visibly keeps build metadata on the registry. A search of the registry cannot filter by version string, so an exhaustive "none exist" is not shown.

## 6. What is still open, and the publish test that would settle it

Open: (a) the live registry's stored version key and `npm view` output for a `+` package, which I derived from the publish payload rather than observed; (b) whether the registry ever re-reads the tarball `package.json` version and rejects a mismatch with the key (I believe not, from the mock design and common knowledge, but unverified); (c) `ng update` / `nx migrate` runtime behavior with a mismatched tarball version.

The test that would settle (a)-(c), needing the user's confirmation because it is outward-facing: publish a throwaway scoped package (for example `@<user-scope>/probe-build-meta`, version `0.0.1+probe.1`) with `npm publish --access public`, then run `npm view`, install into a scratch app, inspect the lockfile, try republishing `0.0.1+probe.2` and expect the 403, run `ng update`/`nx migrate` against it, then `npm unpublish` within the 72-hour window. Not run.

## Source index

- semver 2.0.0 spec item 10: https://semver.org/spec/v2.0.0.html [read]
- `libnpmpublish@11.2.0` `lib/publish.js:69-91, 108-129`; `@npmcli/package-json@7.0.5` `lib/normalize.js:175-190`; `pacote@21.5.0` `lib/registry.js:129-134`; `semver@7.8.1` `classes/semver.js:77,326-327`; `npm@11.16.0` `lib/commands/publish.js` (all under the node 24.18.0 install `node_modules/npm`) [read]
- `nx@22.3.1` `node_modules/nx/src/command-line/migrate/migrate.js`; `@angular/cli@21.0.4` `node_modules/@angular/cli/src/commands/update/cli.js` [read]
- Probe files: `D:/tmp/ngx-yeti-28/` (`pkg/`, `consumer/`, `c2/`, `mock.mjs`) [measured]
