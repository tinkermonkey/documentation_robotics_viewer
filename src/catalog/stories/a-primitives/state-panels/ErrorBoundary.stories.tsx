import type { Meta, StoryObj } from '@storybook/react';
import { ErrorBoundary } from '@/apps/embedded/components/ErrorBoundary';
import { Component } from 'react';

const meta = {
  title: 'A Primitives / State Panels / ErrorBoundary',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Component that throws an error
class ThrowError extends Component<{ shouldThrow?: boolean }> {
  render() {
    if (this.props.shouldThrow) {
      throw new Error('Test error for ErrorBoundary');
    }
    return <div>No error occurred</div>;
  }
}

export const NoError: Story = {
  render: () => (
    <ErrorBoundary>
    <div className="p-4 bg-white border border-gray-200">
      <p>This content is wrapped in an ErrorBoundary</p>
      <ThrowError shouldThrow={false} />
    </div>
  </ErrorBoundary>
  ),
};

export const WithError: Story = {
  render: () => (
    <ErrorBoundary>
    <div className="p-4 bg-white border border-gray-200">
      <ThrowError shouldThrow={true} />
    </div>
  </ErrorBoundary>
  ),
};
