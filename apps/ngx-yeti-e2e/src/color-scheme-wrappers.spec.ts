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

/** The story files under the package whose source sets an inline scheme. */
function wrapperStoryFiles(): string[] {
  return readdirSync(packageRoot, { recursive: true, encoding: 'utf8' })
    .map((file) => file.replaceAll('\\', '/'))
    .filter(
      (file) =>
        file.endsWith('.stories.ts') &&
        !file.startsWith('storybook-static/') &&
        /color-scheme:|withColorScheme\(/.test(
          readFileSync(join(packageRoot, file), 'utf8'),
        ),
    )
    .map((file) => `./${file}`);
}

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
  test('list a story of every story file that sets an inline color-scheme', async ({
    request,
  }) => {
    const index: unknown = await (await request.get('index.json')).json();
    const listedFiles = new Set(
      wrapperStories.map((id) => importPathOf(index, id)),
    );
    const files = wrapperStoryFiles();

    expect(listedFiles).not.toContain(undefined);
    expect(files.length).toBeGreaterThan(0);
    expect(files.filter((file) => !listedFiles.has(file))).toEqual([]);
  });

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
});
