import type { Meta, StoryObj } from '@storybook/angular-vite';
import { NgxYeti } from './ngx-yeti';
import { expect } from 'storybook/test';

const meta: Meta<NgxYeti> = {
  component: NgxYeti,
  title: 'NgxYeti',
};
export default meta;

type Story = StoryObj<NgxYeti>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/ngx-yeti works!/i)).toBeTruthy();
  },
};
