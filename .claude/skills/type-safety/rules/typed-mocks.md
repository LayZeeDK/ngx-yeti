# Rule: cast-free narrowing, mocks, and type guards

## Core principle

No `as` casts and no `eslint-disable` comments. Narrow with runtime checks that TypeScript understands, and let Vitest and Angular infer mock types.

## Narrow with Vitest's `assert`

`assert` is a Vitest global (chai). Its methods are assertion functions, so they narrow the type after the call and fail the test with a clear message when the value is wrong.

| Need                            | Use                                  | Narrows to              |
| ------------------------------- | ------------------------------------ | ----------------------- |
| `unknown` to a DOM class        | `assert.instanceOf(el, HTMLElement)` | `HTMLElement`           |
| `T \| null \| undefined` to `T` | `assert.exists(value)`               | `NonNullable<T>`        |
| `T \| undefined` to `T`         | `assert.isDefined(value)`            | `Exclude<T, undefined>` |

### fixture.nativeElement

`ComponentFixture.nativeElement` is typed `any`. Assigning it to an unannotated `const` fails `no-unsafe-assignment`, even if `assert.instanceOf` follows. Annotate it as `unknown` first. `DirectiveFixture.nativeElement` is typed `Element`, so the annotation is optional there, but write it anyway to keep one rule.

```typescript
// BAD: consistent-type-assertions
const element = fixture.nativeElement as HTMLElement;

// BAD: no-unsafe-assignment
const element = fixture.nativeElement;

// GOOD
const element: unknown = fixture.nativeElement;
assert.instanceOf(element, HTMLElement);
```

### DOM queries

`querySelector('button')` returns `HTMLButtonElement | null` from the tag name. Narrow with `assert.exists` rather than `!`. Destructured `querySelectorAll` results are `T | undefined` under `noUncheckedIndexedAccess`.

```typescript
const [incrementButton, resetButton] = element.querySelectorAll('button');
assert.exists(incrementButton);
assert.exists(resetButton);
```

`DebugElement.query(By.css(...))` is typed non-null, but it returns `null` at runtime when nothing matches, and its `.nativeElement` is `any`. Prefer `querySelector`. If you need the debug element, go through `unknown` and `assert.instanceOf`.

## Typed spies

```typescript
// BAD: cast
const onCleared = vi.fn() as unknown as (value: number) => void;

// GOOD: generic parameter (vitest/require-mock-type-parameters)
const onCleared = vi.fn<(value: number) => void>();

// GOOD: spy on a real injected instance
const greeter = TestBed.inject(Greeter);
const greet = vi.spyOn(greeter, 'greet').mockReturnValue('Stubbed');
```

`TestBed.inject(Token)` already returns the token's type. A cast fails both `consistent-type-assertions` and `no-unnecessary-type-assertion`.

For module mocks, `vi.mocked(importedFn)` returns the mock type of the import. `vitest/prefer-vi-mocked` enforces it.

```typescript
vi.mock('./api', () => ({ fetchUser: vi.fn() }));

const fetchUser = vi.mocked(api.fetchUser);
```

Specs use `vitest/unbound-method` instead of `@typescript-eslint/unbound-method`. It allows `vi.mocked(service.method)` and `expect(service.method).toHaveBeenCalled()`, and still reports `const run = service.run`.

## Provider stubs

`useValue` is typed `any`. Add `satisfies TheService` so TypeScript checks the stub against the real class.

```typescript
TestBed.configureTestingModule({
  providers: [
    {
      provide: Greeter,
      useValue: {
        prefix: signal('Yo'),
        greet: (name: string) => `Yo, ${name}!`,
      } satisfies Greeter,
    },
  ],
});
```

`satisfies` fails when the class has private or `#private` members, because an object literal cannot have them. In that case, inject the real service and use `vi.spyOn` on its methods.

## Type guards for `unknown`

At a boundary such as `JSON.parse`, a plugin list, or an event payload, parse `unknown` with a type guard instead of casting.

```typescript
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readJson(path: string | URL): Record<string, unknown> {
  const json: unknown = JSON.parse(readFileSync(path, 'utf8'));

  if (!isRecord(json)) {
    throw new Error(`Expected a JSON object in ${String(path)}`);
  }

  return json;
}
```

Source: `packages/ngx-yeti/vite.lib.config.mts`.

## What not to do

```typescript
// BAD: eslint-disable to allow a cast
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const element = fixture.nativeElement as HTMLElement;

// BAD: any to bypass types
const service: any = TestBed.inject(Greeter);

// BAD: non-null assertion
const button = element.querySelector('button')!;
```
