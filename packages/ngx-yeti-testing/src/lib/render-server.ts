// Templates with `i18n` compile to `$localize` calls (building-blocks.md 1.11
// decision 11 puts one `i18n` text in every fixture).
import '@angular/localize/init';
import {
  type EnvironmentProviders,
  type Provider,
  reflectComponentType,
  type Type,
} from '@angular/core';
import {
  bootstrapApplication,
  provideClientHydration,
  withI18nSupport,
} from '@angular/platform-browser';
import {
  provideServerRendering,
  renderApplication,
} from '@angular/platform-server';

/** The features `provideClientHydration()` accepts. */
export type HydrationFeatures = Parameters<typeof provideClientHydration>;

export interface RenderServerOptions {
  /** Providers added after the server and hydration providers. */
  readonly providers?: readonly (Provider | EnvironmentProviders)[];
  /** Defaults to `[withI18nSupport()]` (setup spec, section 4 D). */
  readonly hydrationFeatures?: Readonly<HydrationFeatures>;
  /** The request URL, for example `/sub/guide?lang=da`. Defaults to `/`. */
  readonly url?: string;
  /**
   * The page to render into. Defaults to a page whose body holds the root
   * component's element; a root with a non-element selector needs one.
   */
  readonly document?: string;
}

/**
 * Renders `rootComponent` on the server with `renderApplication` and resolves
 * the serialized page, once the application is stable. The server and
 * hydration providers are built inside the bootstrap callback
 * (building-blocks.md 1.12), so concurrent calls share no injector. Calls
 * started together must pass the same `hydrationFeatures`: Angular keeps
 * i18n hydration support in a process-wide flag that each bootstrap sets.
 */
export async function renderServer(
  rootComponent: Type<unknown>,
  options: RenderServerOptions = {},
): Promise<string> {
  const {
    providers = [],
    hydrationFeatures = [withI18nSupport()],
    url = '/',
    document = defaultDocument(rootComponent),
  } = options;

  return renderApplication(
    (context) =>
      bootstrapApplication(
        rootComponent,
        {
          providers: [
            provideServerRendering(),
            provideClientHydration(...hydrationFeatures),
            ...providers,
          ],
        },
        context,
      ),
    { document, url },
  );
}

function defaultDocument(rootComponent: Type<unknown>): string {
  const selector = reflectComponentType(rootComponent)?.selector ?? '';

  if (!/^[a-z][\w-]*$/.test(selector)) {
    throw new Error(
      `renderServer() needs a document for ${rootComponent.name}, whose selector "${selector}" is not an element name`,
    );
  }

  return `<!doctype html><html lang="en"><head><title>renderServer</title></head><body><${selector}></${selector}></body></html>`;
}
