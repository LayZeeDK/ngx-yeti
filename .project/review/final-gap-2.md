# Gap Review — 2: One shared styles loader across the published entry points

Reviewed HEAD: 1ac159a21be091ed19cbeb6b4646ecc467f528a6
Gap verdict: pass
Risk: One shared styles loader across the published entry points
Waves checked: 1, 2, 3

## Checked evidence

- **Check**: `npm ci --no-audit --no-fund` then `npx nx build ngx-yeti --skip-nx-cache` in the verify sidecar at 1ac159a
- **Observed**: build succeeded; dist/packages/ngx-yeti/fesm2022 holds ngx-yeti.mjs, ngx-yeti-card.mjs, ngx-yeti-lift.mjs, ngx-yeti-styles.mjs.
- **Reference**: dist/packages/ngx-yeti/fesm2022/

- **Check**: `rg -n "^import|class \w+" fesm2022/*.mjs`; `rg -c "YetiStyles|rank|createElement\(.link|rel = .stylesheet" fesm2022/ngx-yeti-card.mjs fesm2022/ngx-yeti-lift.mjs fesm2022/ngx-yeti.mjs`; `rg -n "yetiRank =" fesm2022/*.mjs`
- **Observed**: ngx-yeti-card.mjs:3 and ngx-yeti-lift.mjs:3 are `import { injectYetiItemStyles } from "ngx-yeti/styles";`. The count search over card, lift, and the primary bundle found zero matches (rg exit 1): no loader class, rank table, or link creation outside styles. `yetiRank` is defined only at ngx-yeti-styles.mjs:4; `class YetiStyles` only at ngx-yeti-styles.mjs:257, `injectYetiItemStyles` at :379.
- **Reference**: dist/packages/ngx-yeti/fesm2022/ngx-yeti-card.mjs:3, ngx-yeti-lift.mjs:3, ngx-yeti-styles.mjs:4,257,379

- **Check**: `sed -n 362,372p fesm2022/ngx-yeti-styles.mjs`; `rg -n "@Service" packages/ngx-yeti/styles/src`; `rg` of @angular/core core.d.ts for Service auto-provision
- **Observed**: YetiStyles is declared with `ɵɵngDeclareService` from `@Service()` (yeti-styles.ts:53); core.d.ts:775 documents `@Service()` as auto-provided at root like `providedIn: 'root'`, so one instance per application injector, keyed through the shared `#links` map.
- **Reference**: packages/ngx-yeti/styles/src/yeti-styles.ts:53; node_modules/@angular/core/types/core.d.ts:775

- **Check**: `node -e` printing package.json exports; `rg -n "import|declare class" types/*.d.ts`
- **Observed**: exports map ".", "./card", "./lift", "./styles" each to its types/*.d.ts and fesm2022/*.mjs, plus ./accessibility.css and ./package.json. Typings: only types/ngx-yeti-styles.d.ts declares `class YetiStyles`; card and lift typings import shared types from "ngx-yeti" and declare no loader.
- **Reference**: dist/packages/ngx-yeti/package.json; dist/packages/ngx-yeti/types/

## Finding

- **Found**: The published card and lift entry points import `injectYetiItemStyles` from the `ngx-yeti/styles` specifier and carry no copy of the loader or rank table; the single root-provided YetiStyles lives only in ngx-yeti-styles.mjs, and every entry is mapped in exports. A consumer using card and lift therefore resolves one module instance and one loader per application. pack-check was not run; the bundle and export evidence above covers the risk.
- **Fix direction**: none
