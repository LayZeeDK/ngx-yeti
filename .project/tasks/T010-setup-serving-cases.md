---
id: T010
title: Prove the setup serving cases on the Fixture app (dev server, strict-CSP nonce, A4 frames)
wave: 2
deps: [T001, T005, T007]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - apps/yeti-app/src/server.ts
  - apps/yeti-app/src/app/app.config.server.ts
  - apps/yeti-app/project.json
  - apps/yeti-app-e2e/playwright.config.mts
  - apps/yeti-app-e2e/src/setup-serving.spec.ts
---

# T010 — Prove the setup serving cases on the Fixture app (dev server, strict-CSP nonce, A4 frames)

## Context

setup.md:345-346 lists layer-4 cases that were never measured before and are measured here: a development-server run (`nx serve`) of the Fixture app loads every item link; a route served with a strict `style-src 'self' 'nonce-...'` policy and `CSP_NONCE` shows no CSP violation (the loader puts the nonce on every item link); and, for upstream bug A4, with the global stylesheet's response delayed, the count of frames in which a `card` computes `padding: 0` is recorded per engine with Angular's critical-CSS inlining on and off. INTENT.md SC2 names all three; the 66-file assets glob case already lives in `apps/yeti-app-e2e/src/build-output.spec.ts`. The Fixture app's production build inlines critical CSS and its development build (`optimization: false`) does not, so `FIXTURE_CONFIGURATION=production` and the default development run give the "on" and "off" readings without a new build configuration.

## Approach

- Development server: `nx serve yeti-app` already serves under `/sub/` (`servePath`). Make it available to one spec without slowing every other spec's start; for example a second `webServer` entry in `apps/yeti-app-e2e/playwright.config.mts` on its own port with its own readiness URL, used only by the dev-server test through an absolute URL, or a dedicated Playwright project. Use the same PATH-independent server command form the webServer fix of wave 1 established, keep the existing entry's command, port, `env`, and comment as they are, and keep its readiness URL as it is (the placeholder task moves it to `card` in wave 3). Assert that `/sub/setup` under the dev server has the card and lift item links in Yeti's order and is styled.
- Strict CSP: serve one server-rendered route (for example `/sub/server/card` selected by a query flag, or a route prefix) from `apps/yeti-app/src/server.ts` with a per-request nonce and a `Content-Security-Policy` header whose `style-src` is `'self' 'nonce-{value}'`, and hand the nonce to Angular through `CSP_NONCE` (for example a `REQUEST_CONTEXT`-based factory in `apps/yeti-app/src/app/app.config.server.ts`; the client reads `ngCspNonce`). Every other route keeps today's behaviour. Assert no `securitypolicyviolation` event and no CSP console message, that every item link and Angular's inlined `style` carry the nonce, and that the card is styled.
- A4: on `/sub/server/card`, delay the global stylesheet's response with `page.route`, sample the card's computed `padding` per frame with the style probe's `recordFrames`, and record (annotation, not assertion) the count of `padding: 0` frames per engine and per configuration, labelled inlining on (production) or off (development).
- Change `apps/yeti-app/project.json` only if the dev-server or CSP case needs it; do not change the production or development build options the other specs rely on.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md` (Fixture app, `isProduction`, engines), `.claude/skills/type-safety/SKILL.md`. Prior art for the frame sampler: `docs/specs/prototypes/style-loading/measure/probe.mjs` and `docs/specs/prototypes/style-loading/results/firefox-paint.txt`.

## Interface contract

- Fixture key `card` in apps/yeti-app/src/app/fixtures/fixtures.ts maps to `CardFixture` in apps/yeti-app/src/app/fixtures/card-fixture.ts, served prerendered at `/sub/card` and server-rendered at `/sub/server/card`; it renders card.md section 8's markup with a plain `span` and a plain footer link in place of `yetiBadge` and `yetiButton`, an `h3` whose link carries `yetiCardLink stretch` and the text `Weekend in the hills`, and the `i18n` paragraph `Six miles, one summit, and a view worth the early start.`
- apps/yeti-app-e2e/src/support/style-probe.ts exports `recordStyleMutations(page: Page): Promise<() => Promise<readonly string[]>>`, called before `goto`, whose returned function lists one entry per `link` or `style` element added to or removed from the document after `DOMContentLoaded`; `recordFrames(page: Page, selector: string, property: string): Promise<() => Promise<readonly string[]>>`, called before `goto`, whose returned function lists the computed value of `property` on the first element matching `selector` in every animation frame from the first one, `''` while nothing matches; and `itemLinks(page: Page): Promise<readonly string[]>`, the `data-ngx-yeti-styles` values of the item links in the head in document order.
- Fixture keys `lift`, `setup`, and `setup-boundaries` in apps/yeti-app/src/app/fixtures/fixtures.ts, each served prerendered at `/sub/{key}` and server-rendered at `/sub/server/{key}`; the `setup` route renders at least one host carrying both `yetiCard` and `yetiLift` and no host of any other item.

## Intent coverage

- SC2

## Acceptance criteria

1. A development-server run of the Fixture app serves `/sub/setup` with the card and lift item links in the head in Yeti's order, and the setup card is styled; the existing `serve-ssr` server entry keeps its command, port, `env`, and readiness URL.
2. The strict-CSP route answers with a `style-src 'self' 'nonce-...'` policy, every item link and Angular's inlined `style` carry that nonce, the card is styled, and no CSP violation is reported; all other routes are served as before.
3. With the global stylesheet delayed, the count of frames in which the card computes `padding: 0` is recorded per engine for the development build (inlining off) and the production build (inlining on).
4. `apps/yeti-app-e2e/src/setup-serving.spec.ts` passes in the development and production configurations.
5. `npx prettier --check .` and `npx nx run-many -t lint typecheck test -p yeti-app yeti-app-e2e` pass at the task commit.

## Verify

```bash
npm ci --no-audit --no-fund && npx nx run-many -t typecheck -p yeti-app yeti-app-e2e && test -f apps/yeti-app-e2e/src/setup-serving.spec.ts && npx nx e2e yeti-app-e2e -- setup-serving.spec.ts && FIXTURE_CONFIGURATION=production npx nx e2e yeti-app-e2e -- setup-serving.spec.ts
```

Heavy: yes

## Log

- 2026-10-04 — created by planner
