import type { YetiManifest } from 'yeti-css';
import manifest from 'yeti-css/manifest';

/**
 * Yeti's built manifest at the pinned commit (`yeti-css/manifest`, the
 * `dist/yeti.manifest.json` that `nx yeti-build yeti-css` writes), typed by
 * Yeti's own `yeti.manifest.d.ts`. The contract check (ADR 0014 point 3)
 * reads it; the first item spec designs that check's API.
 */
export function loadYetiManifest(): YetiManifest {
  return manifest;
}
