import type { Meta, StoryObj } from '@storybook/react';
import { SpecVersionWarning } from './SpecVersionWarning';

const meta = {
  title: 'Components/SpecVersionWarning',
  component: SpecVersionWarning,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SpecVersionWarning>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VersionMismatch: Story = {
  args: {
    modelVersion: '0.8.0',
    specVersion: '0.8.3',
    onDismiss: () => console.log('Warning dismissed'),
  },
};

export const DarkMode: Story = {
  args: {
    modelVersion: '0.8.0',
    specVersion: '0.8.3',
    onDismiss: () => console.log('Warning dismissed'),
  },
  decorators: [
    (Story) => (
      <div className="dark bg-gray-900">
        <Story />
      </div>
    ),
  ],
};

export const LongVersionStrings: Story = {
  args: {
    modelVersion: '0.8.3-rc1+build.12345.g1a2b3c4d.d20260321T120000Z',
    specVersion: '0.8.3-release+build.67890.g5e6f7g8h.d20260320T150000Z',
    onDismiss: () => console.log('Warning dismissed'),
  },
};
