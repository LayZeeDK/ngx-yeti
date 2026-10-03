import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { Highlight } from './highlight';

const meta: Meta<Highlight> = {
  id: 'highlight',
  component: Highlight,
  decorators: [moduleMetadata({ imports: [Highlight] })],
  args: { color: 'lightblue' },
  render: (args) => ({
    // A prop named after the directive's input collides with it once
    // `component` is set, and Angular logs an error.
    props: { hue: args.color },
    template: '<span [yetiHighlight]="hue">Highlighted</span>',
  }),
};
export default meta;

type Story = StoryObj<Highlight>;

export const Bound: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Highlighted')).toHaveStyle({
      backgroundColor: 'rgb(173, 216, 230)',
    });
  },
};
