import type { Meta, StoryObj } from '@storybook/react';
import { ModelParseErrorBanner } from './ModelParseErrorBanner';

const meta: Meta<typeof ModelParseErrorBanner> = {
  title: 'Shared/ModelParseErrorBanner',
  component: ModelParseErrorBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ModelParseErrorBanner>;

export const SingleError: Story = {
  args: {
    errors: ['Failed to parse layer Motivation: Invalid YAML syntax'],
  },
};

export const MultipleErrors: Story = {
  args: {
    errors: [
      'Failed to parse layer Motivation: Invalid YAML syntax',
      'Failed to parse layer Business: Missing required field "id"',
      'Failed to parse layer Security: Duplicate element ID "security-001"',
    ],
  },
};

export const WithDismissCallback: Story = {
  args: {
    errors: ['Failed to parse layer: Unknown error'],
    onDismiss: () => console.log('Dismissed'),
  },
};

export const NoErrors: Story = {
  args: {
    errors: [],
  },
};
