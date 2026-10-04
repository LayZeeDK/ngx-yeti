# Gap Review — 2: One shared styles loader across the published entry points

Reviewed HEAD: b5854c5c8a0770047ced0030d271d9c92f95a1c9
Gap verdict: pass
Risk: One shared styles loader across the published entry points
Waves checked: 1, 2, 3, 5

## Checked evidence

- **Check**: `npm ci --no-audit --no-fund`; `npx nx build ngx-yeti --skip-nx-cache`; `rg -n "^import" fesm2022/ngx-yeti-card.mjs fesm2022/ngx-yeti-lift.mjs`; `rg -c "class YetiStyles|yetiRank|rel = .stylesheet|createElement\(.link" fesm2022/*.mjs`; `rg -n "declare class" types/*.d.ts`; `node -e` printing package.json exports keys; `npx nx run ngx-yeti:pack-check --skip-nx-cache`; `npm pack --dry-run` in dist/packages/ngx-yeti
- **Observed**: npm ci exit 0; build and pack-check both reported Successfully ran target. ngx-yeti-card.mjs:3 and ngx-yeti-lift.mjs:3 are `import { injectYetiItemStyles } from "ngx-yeti/styles";`. The loader search matched only ngx-yeti-styles.mjs (8 hits): `yetiRank` at :4, `class YetiStyles` at :257, `injectYetiItemStyles` at :379, exported at :396; card, lift, and the primary bundle had zero hits. Typings declare `YetiStyles` only in types/ngx-yeti-styles.d.ts:48; card and lift typings declare only YetiCard, YetiCardLink, NgxYetiLift. Exports keys: ./accessibility.css, ./package.json, ., ./card, ./lift, ./styles. The dry-run tarball (18 files) holds the same four fesm2022 bundles, four typings, and package.json.
- **Reference**: dist/packages/ngx-yeti/fesm2022/ngx-yeti-card.mjs:3; dist/packages/ngx-yeti/fesm2022/ngx-yeti-lift.mjs:3; dist/packages/ngx-yeti/fesm2022/ngx-yeti-styles.mjs:4,257,379,396; dist/packages/ngx-yeti/types/ngx-yeti-styles.d.ts:48; dist/packages/ngx-yeti/package.json; packages/ngx-yeti/project.json:106

## Finding

- **Found**: At b5854c5, after the wave 5 change to provide-yeti-styles.ts, the published card and lift entry points import injectYetiItemStyles from the ngx-yeti/styles specifier and carry no copy of the loader or rank table. The only YetiStyles class and rank table live in ngx-yeti-styles.mjs, every entry point is in the exports map, and the packed tarball has the same shape. A consumer of card and lift resolves one styles module and so one root loader per application.
- **Fix direction**: none
