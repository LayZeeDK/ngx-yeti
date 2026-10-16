import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { relativeLuminance } from '@ngx-yeti/testing';
import { workspaceRoot } from '@nx/devkit';
import { expect, test, type Locator } from '@playwright/test';
import { openStory } from './open-story';

/** Every story that draws an inline `color-scheme` wrapper. */
const wrapperStories = [
  'box--surfaces',
  'box--paint',
  'box--paint-alerts-light',
  'box--paint-alerts-dark',
  'box--text',
  'box--anti-pattern-low-contrast',
  'breakout--dark-scheme',
  'button--variants',
  'icon--standalone',
  'layer--dark-scheme',
  'layer--badge',
  'overlay--default',
  'overlay--veil',
  'spinner--default',
  'spinner--variants',
  'timeline--dark-scheme',
] as const;

/**
 * Every story whose play function sets `style.colorScheme` on an element:
 * that element, and the surface and texts the play function measures there.
 * A pressed toggle's text sits on its own emphasis fill, not on the surface,
 * so only the resting toggles' text is read.
 */
const playSchemeStories = [
  {
    id: 'button--toggle',
    schemed: '[data-testid="surface"]',
    surface: '[data-testid="surface"]',
    texts: '[data-testid="surface"], [data-pair] [aria-pressed="false"]',
  },
  {
    id: 'card--default',
    schemed: '[data-testid="frame"]',
    surface: 'article',
    texts: 'article h3 a, article > p',
  },
  {
    id: 'table--default',
    schemed: '[data-testid="frame"]',
    surface: '[data-testid="frame"]',
    texts: 'thead th, tbody td, caption',
  },
  {
    id: 'scroller--keyboard',
    schemed: '[data-testid="surface"]',
    surface: '[data-testid="surface"]',
    texts: '[data-testid="surface"], [data-testid="scroller"] > p',
  },
] as const;

const pageSchemes = ['light', 'dark'] as const;

// Relative luminance of a mid grey: a dark scheme's surface sits below it and
// its text above it, and a light scheme's the other way round.
const midGrey = 0.18;

const packageRoot = join(workspaceRoot, 'packages/ngx-yeti');

interface WrapperColours {
  readonly scheme: string;
  readonly color: string;
  readonly backgroundColor: string;
}

async function wrapperColours(root: Locator): Promise<WrapperColours[]> {
  return root.locator('[style*="color-scheme"]').evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);

      return {
        scheme: style.colorScheme,
        color: style.color,
        backgroundColor: style.backgroundColor,
      };
    }),
  );
}

/** The story files under the package whose source matches `setter`. */
function storyFilesSetting(setter: RegExp): string[] {
  return readdirSync(packageRoot, { recursive: true, encoding: 'utf8' })
    .map((file) => file.replaceAll('\\', '/'))
    .filter(
      (file) =>
        file.endsWith('.stories.ts') &&
        !file.startsWith('storybook-static/') &&
        setter.test(readFileSync(join(packageRoot, file), 'utf8')),
    )
    .map((file) => `./${file}`);
}

/** Each kind of inline scheme setter, and the stories that cover it. */
const setters = [
  {
    kind: 'wrapper',
    setter: /color-scheme:|withColorScheme\(/,
    ids: wrapperStories,
  },
  {
    kind: 'play code',
    setter: /\.colorScheme\s*=/,
    ids: playSchemeStories.map(({ id }) => id),
  },
] as const;

function importPathOf(index: unknown, storyId: string): string | undefined {
  if (
    typeof index !== 'object' ||
    index === null ||
    !('entries' in index) ||
    typeof index.entries !== 'object' ||
    index.entries === null
  ) {
    return undefined;
  }

  const entry: unknown = Object.entries(index.entries).find(
    ([id]) => id === storyId,
  )?.[1];

  return typeof entry === 'object' &&
    entry !== null &&
    'importPath' in entry &&
    typeof entry.importPath === 'string'
    ? entry.importPath
    : undefined;
}

test.describe('inline color-scheme wrappers', () => {
  for (const { kind, setter, ids } of setters) {
    test(`list a story of every story file that sets an inline color-scheme by ${kind}`, async ({
      request,
    }) => {
      const index: unknown = await (await request.get('index.json')).json();
      const listedFiles = new Set(ids.map((id) => importPathOf(index, id)));
      const files = storyFilesSetting(setter);

      expect(listedFiles).not.toContain(undefined);
      expect(files.length).toBeGreaterThan(0);
      expect(files.filter((file) => !listedFiles.has(file))).toEqual([]);
    });
  }

  for (const id of wrapperStories) {
    for (const pageScheme of pageSchemes) {
      test(`${id} keeps each wrapper's own scheme on a ${pageScheme} page`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme: pageScheme });
        const root = await openStory(page, id);
        const wrappers = await wrapperColours(root);

        test.info().annotations.push({
          type: 'wrapper-colours',
          description: `${id}, ${pageScheme} page: ${wrappers
            .map(
              ({ scheme, color, backgroundColor }) =>
                `${scheme} ${color} on ${backgroundColor}`,
            )
            .join('; ')}`,
        });

        expect(wrappers.length).toBeGreaterThan(0);

        for (const { scheme, color, backgroundColor } of wrappers) {
          expect(['light', 'dark']).toContain(scheme);
          expect(
            {
              darkSurface: relativeLuminance(backgroundColor) < midGrey,
              darkText: relativeLuminance(color) < midGrey,
            },
            `${scheme} wrapper: ${color} on ${backgroundColor}`,
          ).toEqual({
            darkSurface: scheme === 'dark',
            darkText: scheme === 'light',
          });
        }

        await page.emulateMedia({
          colorScheme: pageScheme === 'light' ? 'dark' : 'light',
        });

        expect(await wrapperColours(root)).toEqual(wrappers);
      });
    }
  }

  for (const { id, schemed, surface, texts } of playSchemeStories) {
    for (const pageScheme of pageSchemes) {
      test(`${id} follows the scheme its play code sets, on a ${pageScheme} page`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme: pageScheme });
        const root = await openStory(page, id);

        for (const scheme of ['light', 'dark'] as const) {
          await root
            .locator(schemed)
            .first()
            .evaluate((element, value) => {
              element.style.colorScheme = value;

              // Colour transitions would otherwise be read mid-way.
              for (const animation of document.getAnimations()) {
                animation.finish();
              }
            }, scheme);

          const backgroundColor = await root
            .locator(surface)
            .first()
            .evaluate((element) => getComputedStyle(element).backgroundColor);
          const colors = await root
            .locator(texts)
            .evaluateAll((elements) =>
              elements.map((element) => getComputedStyle(element).color),
            );

          test.info().annotations.push({
            type: 'play-scheme-colours',
            description: `${id}, ${pageScheme} page, ${scheme}: ${colors.join(', ')} on ${backgroundColor}`,
          });

          expect(colors.length).toBeGreaterThan(0);
          expect(
            relativeLuminance(backgroundColor) < midGrey,
            `${scheme} surface: ${backgroundColor}`,
          ).toBe(scheme === 'dark');

          for (const color of colors) {
            expect(
              relativeLuminance(color) < midGrey,
              `${scheme} text: ${color} on ${backgroundColor}`,
            ).toBe(scheme === 'light');
          }
        }
      });
    }
  }
});
