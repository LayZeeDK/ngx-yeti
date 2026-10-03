# Rule: satisfies patterns

## Decision tree

```
Need to type a value?
  |
  +-- Function? --> Return type annotation: function foo(): ReturnType { ... }
  |
  +-- Variable assignment?
  |     |
  |     +-- Need the narrow type at use sites? --> const x = { ... } satisfies WideType
  |     +-- Need the wide type at use sites?   --> const x: WideType = { ... }
  |     +-- Need both narrow + validated?       --> const x = { ... } as const satisfies WideType
  |
  +-- Value passed where the parameter is `any` (useValue)? --> satisfies TheType
  |
  +-- Inline object in function call? --> Usually no annotation needed (contextual typing)
```

## When to use `satisfies`

Use `satisfies` to check that a value conforms to a type while keeping the narrow literal type for later use.

```typescript
const sizes = {
  small: '0.75rem',
  medium: '1rem',
} satisfies Record<string, string>;
// keyof typeof sizes is 'small' | 'medium'

const wideSizes: Record<string, string> = { small: '0.75rem' };
// keyof typeof wideSizes is string, and wideSizes['typo'] compiles
```

Use it where a parameter is typed `any` and would otherwise check nothing, such as a TestBed `useValue` stub. See [typed-mocks.md](typed-mocks.md).

## When to use type annotations

- On function return types (`explicit-function-return-type`). Arrow functions assigned to a typed variable or passed as a callback are exempt.
- On variables where consumers need the wide type.
- On values typed `any` that you narrow next: `const element: unknown = fixture.nativeElement`.
- On Storybook meta: `const meta: Meta<Component> = { ... }`. Do not use `satisfies` there. See [storybook-stories.md](storybook-stories.md).

```typescript
const isAnalogPlugin = (plugin: unknown): boolean => typeof plugin === 'object' && plugin !== null && 'name' in plugin;
```

## When to use `as const satisfies`

Use it for an immutable literal that must also match a type. `as const` is the only permitted use of the `as` keyword.

```typescript
const DEFAULT_COLORS = {
  highlight: 'yellow',
  focus: 'lightblue',
} as const satisfies Record<string, string>;
// typeof DEFAULT_COLORS.highlight is 'yellow'
```

## Excess property checking

`satisfies` reports misspelled properties.

```typescript
interface Options {
  timeout: number;
}

const opts = { timeout: 100, timout: 200 } satisfies Options;
//                          ~~~~~~ Error: 'timout' does not exist in type 'Options'
```
