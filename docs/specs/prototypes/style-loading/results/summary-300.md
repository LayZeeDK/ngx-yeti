| Measurement | chromium | firefox | webkit |
| --- | --- | --- | --- |
| JS off: eager card padding | 18px | 18px | 18px |
| JS off: hydrate-never badge padding | 2.16px | 2.16094px | 2.16px |  <-- engines differ
| JS off: plain .card padding (card link present) | 18px | 18px | 18px |
| JS off: part links in head | center,badge,card | center,badge,card | center,badge,card |
| Hydration: style/link mutations after DOMContentLoaded | none | none | none |
| Hydration: eager card unstyled frames / styled frames | 0 / 58 | 1 / 60 | 0 / 58 |  <-- engines differ
| Hydration: hydrate-never badge unstyled frames | 0 | 0 | 0 |
| Hydration: card vs full Yeti (differing elements) | 0 | 0 | 0 |
| Hydration: badge vs full Yeti | 0 | 0 | 0 |
| Hydration: sheet order | style > link styles-RLZGWI23.css > link[center] center.css?v=f52d1e8b9 > link[badge] badge.css?v=f52d1e8b9 > link[card] card.css?v=f52d1e8b9 | style > link styles-RLZGWI23.css > link[center] center.css?v=f52d1e8b9 > link[badge] badge.css?v=f52d1e8b9 > link[card] card.css?v=f52d1e8b9 | style > link styles-RLZGWI23.css > link[center] center.css?v=f52d1e8b9 > link[badge] badge.css?v=f52d1e8b9 > link[card] card.css?v=f52d1e8b9 |
| Leave (L3 listener on page): card present, padding, opacity at 150 ms | true, 18px, 0.624885 | true, 18px, 0.625002 | true, 18px, 0.5875 |  <-- engines differ
| Leave: links at 150 ms | center,badge,card | center,badge,card | center,badge,card |
| Leave: unstyled frames while leaving | 0 | 0 | 0 |
| After leave: card present, links, plain .card padding | false, [center,badge], 0px | false, [center,badge], 0px | false, [center,badge], 0px |
| Reload: links, card vs full Yeti, unstyled frames on reload | [center,badge,card], 0, 0 | [center,badge,card], 0, 0 | [center,badge,card], 0, 19 |  <-- engines differ
| Reload: part link order | link[center] center.css?v=f52d1e8b9 > link[badge] badge.css?v=f52d1e8b9 > link[card] card.css?v=f52d1e8b9 | link[center] center.css?v=f52d1e8b9 > link[badge] badge.css?v=f52d1e8b9 > link[card] card.css?v=f52d1e8b9 | link[center] center.css?v=f52d1e8b9 > link[badge] badge.css?v=f52d1e8b9 > link[card] card.css?v=f52d1e8b9 |
| Hold: eager badge hidden -> links, never badge pad, hoi badge pad | [center,badge,card], 2.16px, 2.16px | [center,badge,card], 2.16094px, 2.16094px | [center,badge,card], 2.16px, 2.16px |  <-- engines differ
| Hold: hoi block hydrated -> links, hoi badge pad | [center,badge,card], 2.16px | [center,badge,card], 2.16094px | [center,badge,card], 2.16px |  <-- engines differ
| Hold: eager badge shown again -> links, pad | [center,badge,card], 2.16px | [center,badge,card], 2.16094px | [center,badge,card], 2.16px |  <-- engines differ
| Tie: stack inserted after center -> link order | link[stack] stack.css?v=f52d1e8b9 > link[center] center.css?v=f52d1e8b9 > link[badge] badge.css?v=f52d1e8b9 > link[card] card.css?v=f52d1e8b9 | link[stack] stack.css?v=f52d1e8b9 > link[center] center.css?v=f52d1e8b9 > link[badge] badge.css?v=f52d1e8b9 > link[card] card.css?v=f52d1e8b9 | link[stack] stack.css?v=f52d1e8b9 > link[center] center.css?v=f52d1e8b9 > link[badge] badge.css?v=f52d1e8b9 > link[card] card.css?v=f52d1e8b9 |
| Tie: center-in-stack margin-left (probe / full Yeti) | 430px / 430px | 430px / 430px | 430px / 430px |
| Client-only @defer, CSS delayed 300 ms: unstyled / styled frames | 18 / 31 | 20 / 31 | 20 / 32 |  <-- engines differ
| Client-only @defer with preload list: preloads, unstyled / styled frames | [alert/alert.css?v=f52d1e8b9], 0 / 51 | [alert/alert.css?v=f52d1e8b9], 0 / 53 | [alert/alert.css?v=f52d1e8b9], 0 / 52 |  <-- engines differ

Server:
{
 "headOrder": [
  "style",
  "link rel=\"stylesheet\" href=\"styles-RLZGWI23.css\" media=\"print\" data-beasties-media=\"all\"",
  "link rel=\"stylesheet\" href=\"styles-RLZGWI23.css\"",
  "link rel=\"stylesheet\" href=\"yeti-css/layouts/center/center.css?v=f52d1e8b9\" data-ngx-yeti-styles=\"center\" data-beasties-skip=\"\" data-ngx-yeti-app=\"ng\"",
  "link rel=\"stylesheet\" href=\"yeti-css/components/badge/badge.css?v=f52d1e8b9\" data-ngx-yeti-styles=\"badge\" data-beasties-skip=\"\" data-ngx-yeti-app=\"ng\"",
  "link rel=\"stylesheet\" href=\"yeti-css/components/card/card.css?v=f52d1e8b9\" data-ngx-yeti-styles=\"card\" data-beasties-skip=\"\" data-ngx-yeti-app=\"ng\""
 ],
 "criticalHasCardRule": false,
 "criticalStartsWithStatement": true,
 "partLinks": [
  "<link rel=\"stylesheet\" href=\"yeti-css/layouts/center/center.css?v=f52d1e8b9\" data-ngx-yeti-styles=\"center\" data-beasties-skip=\"\" data-ngx-yeti-app=\"ng\">",
  "<link rel=\"stylesheet\" href=\"yeti-css/components/badge/badge.css?v=f52d1e8b9\" data-ngx-yeti-styles=\"badge\" data-beasties-skip=\"\" data-ngx-yeti-app=\"ng\">",
  "<link rel=\"stylesheet\" href=\"yeti-css/components/card/card.css?v=f52d1e8b9\" data-ngx-yeti-styles=\"card\" data-beasties-skip=\"\" data-ngx-yeti-app=\"ng\">"
 ],
 "hostAttrs": [
  "card",
  "badge",
  "badge",
  "badge",
  "center"
 ],
 "preloadLinks": [
  "<link rel=\"preload\" as=\"style\" href=\"yeti-css/components/alert/alert.css?v=f52d1e8b9\">"
 ],
 "cardAsset": {
  "status": 200,
  "cacheControl": "public, max-age=31536000",
  "type": "text/css; charset=utf-8"
 }
}
