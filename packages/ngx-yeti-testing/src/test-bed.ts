import type { Binding, Type } from '@angular/core';
import { type DirectiveFixture, TestBed } from '@angular/core/testing';

/** A directive created alone on a host element by `createDirectiveHost`. */
export interface DirectiveHost<T> {
  readonly fixture: DirectiveFixture<T>;
  readonly element: HTMLElement;
  /** Destroys the fixture and takes its host out of the document. */
  readonly destroy: () => void;
}

/**
 * Creates `type` alone on a host element with `TestBed.createDirective` and
 * resolves once it is stable. Throws when the host is not an HTMLElement.
 */
export async function createDirectiveHost<T>(
  type: Type<T>,
  options?: { readonly tagName?: string; readonly bindings?: Binding[] },
): Promise<DirectiveHost<T>> {
  const fixture = TestBed.createDirective(type, options);

  await fixture.whenStable();

  const element = fixture.nativeElement;

  if (!(element instanceof HTMLElement)) {
    throw new TypeError(`<${element.localName}> is not an HTMLElement`);
  }

  return {
    fixture,
    element,
    destroy: () => {
      fixture.destroy();
      element.remove();
    },
  };
}
