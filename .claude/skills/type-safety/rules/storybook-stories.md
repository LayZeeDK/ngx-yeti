# Rule: typed Storybook stories

Stories use `@storybook/angular-vite`. The type-aware typescript-eslint rules apply to `*.stories.ts`. The Vitest lint rules do not, because `vitestConfig` only matches `*.spec.ts`. Storybook `flat/csf-strict` adds its own rules.

## Meta and story types

Annotate the meta with `Meta<Component>` and the stories with `StoryObj<Component>`. Use the component instance type, not `typeof Component`.

```typescript
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { Counter } from './counter';

const meta: Meta<Counter> = {
  component: Counter,
  args: {
    label: 'Yeti',
    step: 1,
    count: 0,
    cleared: fn(),
    countChange: fn(),
  },
};
export default meta;

type Story = StoryObj<Counter>;
```

Do not copy the `satisfies Meta<typeof X>` plus `StoryObj<typeof meta>` pattern from the Storybook docs. For Angular, `StoryObj<typeof meta>` treats the meta object as the component. Story args then fail with TS2353, and `args.countChange` in `play` fails with TS2339. Angular story args are always optional, so `satisfies` would not add required-arg checks either.

## Args

Args are type-checked against the component:

- A signal `input()` takes its value type.
- An `output<T>()` takes `(event: T) => void`. Pass `fn()` from `storybook/test`.
- A `model<T>()` takes `T`, and it also adds a `<name>Change` output arg.

## csf-strict

- Do not set `title` in the meta. `storybook/no-title-property-in-meta` is an error.
- Default-export the meta and set `component`.

## play functions

Every `expect` from `storybook/test` returns a promise, and so does every `userEvent` call. Await all of them. A missing `await` fails `@typescript-eslint/no-floating-promises`.

```typescript
export const Increments: Story = {
  args: { step: 2 },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Increment' }));

    await expect(canvas.getByRole('status')).toHaveTextContent('2');
    await expect(args.countChange).toHaveBeenCalledWith(2);
  },
};
```

`canvas` and `canvasElement` are already typed and need no annotation. Prefer `canvas.getByRole`, which throws when nothing matches and returns `HTMLElement`. A nullable `canvasElement.querySelector(...)` result can go straight into `toHaveTextContent` without `!` or a cast.

Run `nx typecheck ngx-yeti -c stories` for the types and `nx test-storybook ngx-yeti` for the `play` functions.
