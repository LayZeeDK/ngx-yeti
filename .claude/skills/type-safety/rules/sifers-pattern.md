# Rule: SIFERS test setup with TestBed

## What SIFERS is

SIFERS (Simple Injectable Functions Explicitly Returning State) replaces `beforeEach` and `afterEach` with a plain `setup()` function. Each test calls it and destructures only the state it needs.

**Origin:** [Moshe Kolodny, "Testing with SIFERS"](https://medium.com/@kolodny/testing-with-sifers-c9d6bb5b36)

## Why hooks are banned

`vitest/no-hooks` is an error in every Vitest project. `beforeEach`, `afterEach`, `beforeAll`, and `afterAll` all fail lint.

Angular specs need no cleanup hooks. `setupTestBed()` in `src/test-setup.ts` registers Angular's own hooks that reset TestBed and destroy fixtures around every test. The `@angular/build:unit-test` runner that `yeti-app` uses does the same. Each test starts with a fresh injector.

## Pattern: setup() returns everything a test needs

Write `setup()` as an `async` function at module level or inside the `describe`. It creates the fixture, waits for it to be stable, narrows the host element, and returns all of it.

```typescript
async function setupCardLink({ stretch }: { stretch?: boolean } = {}) {
  const stretchSignal = signal(stretch ?? false);
  const fixture = TestBed.createDirective(YetiCardLink, {
    tagName: 'a',
    bindings: stretch === undefined ? [] : [inputBinding('stretch', stretchSignal)],
  });

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);

  return { element, fixture, stretchSignal };
}

describe(YetiCardLink, () => {
  it('renders data-stretch while stretch is true', async () => {
    expect.assertions(2);

    const { element, fixture, stretchSignal } = await setupCardLink({
      stretch: true,
    });

    expect(element.getAttribute('data-stretch')).toBe('');

    stretchSignal.set(false);
    await fixture.whenStable();

    expect(element.hasAttribute('data-stretch')).toBe(false);
  });
});
```

Source: `packages/ngx-yeti/card/src/card.spec.ts`.

## Key rules

### 1. Parameters customize setup

Add an options object with defaults instead of a second setup function.

### 2. Pass inputs and outputs through bindings

`TestBed.createComponent(C, { bindings: [...] })` and `TestBed.createDirective` accept `inputBinding`, `outputBinding`, and `twoWayBinding` from `@angular/core`. Bind a `signal` to drive later changes. Use a typed `vi.fn` as the output spy.

```typescript
const count = signal(0);
const step = signal(1);
const onCleared = vi.fn<(value: number) => void>();
const fixture = TestBed.createComponent(Counter, {
  bindings: [inputBinding('label', () => label), inputBinding('step', step), twoWayBinding('count', count), outputBinding('cleared', onCleared)],
});
```

Two caveats:

- Binding names are plain strings. A typo compiles and only fails at runtime, on the first change detection.
- `fixture.componentRef.setInput()` throws NG0317 on a fixture created with bindings. Change the bound signal instead. Use `setInput` only on fixtures created without bindings.

Prefer bindings to a host test component. A host component inside a spec must pass the whole angular-eslint `all` rule set, including the 3-line limit on inline templates.

### 3. Await stability after every state change

Tests run zoneless, and components default to OnPush. After you click, set a signal, or call `setInput`, run `await fixture.whenStable()` before you assert. That makes the test `async`, so it also needs `expect.assertions(n)` first.

```typescript
it('increments the two-way bound count', async () => {
  expect.assertions(2);

  const { count, element, fixture, incrementButton } = await setup();

  incrementButton.click();
  await fixture.whenStable();

  expect(count()).toBe(1);
  expect(element.querySelector('output')?.textContent).toBe('1');
});
```

### 4. Configure providers before the first inject or create

Call `TestBed.configureTestingModule` inside `setup()` or at the top of the test, before any `TestBed.inject` or `createComponent`. Standalone components need no `imports` and no `compileComponents()`.

### 5. Clear module mocks only when there are module mocks

If a spec uses module-level `vi.mock(...)`, call `vi.clearAllMocks()` as the first line of `setup()`. Specs without `vi.mock` skip it. Spies created inside `setup()` are fresh on every call.

## Migration checklist

To convert a spec that uses hooks:

1. Move the `beforeEach` body into `async function setup()`.
2. Delete `compileComponents()` for standalone components.
3. Return the fixture, the narrowed element, and any spies or signals from `setup()`.
4. Change each test to `const { ... } = await setup();` and add `expect.assertions(n)` as its first statement.
5. Replace `fixture.nativeElement as HTMLElement` with an `unknown` annotation and `assert.instanceOf`.
6. Change `describe('Name', ...)` to `describe(Name, ...)`.
