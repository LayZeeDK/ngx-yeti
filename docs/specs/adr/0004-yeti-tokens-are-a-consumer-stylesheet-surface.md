---
status: accepted
---

# Yeti's `--yeti-*` tokens are a consumer stylesheet surface, not a component input contract

Adapted from the runtime-theming exclusion of `.scratch/next-foundation-specs/map.md` ("Runtime theming through custom properties as a component contract" under Out of scope, from Building-blocks map and cross-cutting architecture decisions (old map ticket 14, `building-blocks-map`)), by [Decide: which standing preferences and user rulings carry over](../issues/07-decide-inherited-preferences-and-rulings.md). That record bound nothing here, and its reason no longer applies as written: it ruled runtime theming out for a framework whose theming was a Sass compile, while Yeti's theming is runtime tokens and nothing else.

The user asked the question this record answers, verbatim (the user's own message to the orchestrator, 2026-10-01; the orchestrator holds the conversation): "21. What about adding CSS classes or setting CSS Custom Properties?" The classes half is [ADR 0003](0003-directives-set-yetis-class-attributes-and-markers.md). The wording here is the orchestrator's and this map's, never the user's.

We decided that the package does not offer an input, a provider, or a service per `--yeti-*` token. Each spec names the tokens its item reads and shows how a consumer sets them, in Yeti's own way: a block of custom properties in any stylesheet, a theme file loaded after Yeti, or a runtime `setProperty`. Two narrow exceptions:

1. **A token a Yeti module writes as state** is written by the directive instead, as a host style binding from a `computed`. The measured case is `range.js`'s `--yeti-range-value` on the `.field`, which becomes a server-rendered binding, so the fill is correct in the first paint and the module's `MutationObserver` is not needed ([Research: Yeti's JavaScript modules and what Angular adds](../issues/03-research-yeti-javascript-and-angular.md) 2.6, 4.4).
2. **One derived token as an input, where a spec states why.** A derived token such as `--yeti-color-primary` takes effect on any element (`src/guides/theming.md:38`; measured on a card in [Research: Yeti's styling model, and loading component styles lazily](../issues/04-research-yeti-styles-and-lazy-loading.md) 4.2), so a spec may expose one as an input where the item's API needs it. It says which token, why an input beats the consumer's own class, and that it is not a theme.

Angular supports both: `[style.--token]` and a `style` host binding carrying a custom property are in Angular's own acceptance tests (`packages/core/test/acceptance/styling_spec.ts:256`, `:278`, `:297`, case-sensitive names included), and `DomRenderer.setStyle` routes any `--` name through `setProperty` (`packages/platform-browser/src/dom/dom_renderer.ts:437-447`). Both read in the 22.2.x clone, not run.

## Considered options

- **An input per public token, or a token record input per item.** Rejected on two measurements and one reading. The 297 public token names are frozen but their default values are explicitly not (`src/guides/stability.md:19`, `:27`), so the package would publish a surface that moves under it while its release policy promises a deprecation path for anything public. And it buys the consumer nothing: an unlayered consumer `:root` block beats Yeti's layered tokens wherever it sits, including for a part file inserted later (measured in three engines, [ticket 04](../issues/04-research-yeti-styles-and-lazy-loading.md) 4.2).
- **A theme provider that writes tokens on `:root` for the whole application.** Rejected. The tokens that carry a theme -- the six hues, the chroma, and the scale inputs -- "only take effect on `:root`, because Yeti computes every derived token there" (`src/guides/theming.md:38`), so the provider would have to write a global style: a write that races hydration, that two applications on one page would fight over (the shared-style hazard the old map measured in old map ticket 198 (`prototype-candidate-costs-dev-hmr-csp`)), and that the consumer's own stylesheet already does correctly.
- **The package ships or wraps Yeti's `soft` and `sharp` themes.** Rejected: each is 19 lines of token values on `:root` that a consumer links after Yeti (`src/themes/soft.css`), so a wrapper would add a dependency and no behaviour. A spec may cite them as worked examples.
- **Nothing at all, not even the two exceptions.** Rejected: without exception 1 the range fill is wrong until `range.js` runs, which loses the server-rendered first paint the rendering-modes requirement asks for.

## Consequences

- Each spec has a Tokens subsection: the tokens its item reads, which of them the package writes (none, in most items), and how a consumer sets the rest. The item's own tokens come from its manifest's `tokens` array.
- The map's "Not yet specified" line on theming beyond tokens is settled: the package does not ship, wrap, or generate themes, and documents Yeti's mechanism.
- A spec that wants a third exception reopens this record rather than adding one quietly.
- Private `--_yeti-*` tokens are never read or written by the package: they are implementation and are not frozen (`src/guides/stability.md:26`).
- Forcing a colour scheme stays the consumer's `color-scheme` declaration, which works on any element (`theming.md:52`; measured on a card in [ticket 04](../issues/04-research-yeti-styles-and-lazy-loading.md) 4.2). No directive offers a scheme input.
- 2026-10-03 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md), decision 141; the orchestrator's, not the user's): the `demo` spec reopens this record and adds a third exception. The package writes a private token where Yeti's CSS documents it as written by the module the package replaces. Today that is two tokens, `--_yeti-demo-edge` and `--_yeti-demo-middle`, which place the resize grip (`demo.css:181-206`, "the module measures and writes inline"). `YetiDemo` writes them as style bindings on the grip from signals, and a layer-1 assertion of the grip's place fails if a pin move renames them. The rule that the package never reads or writes private tokens holds for every other token.
