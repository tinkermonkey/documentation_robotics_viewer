import type { StoryDefault, Story } from '@ladle/react';
import { ErrorBoundary } from '@/apps/embedded/components/ErrorBoundary';
import { Component } from 'react';

export default {
  title: '1 Primitives / State Panels / ErrorBoundary',
} satisfies StoryDefault;

// Component that throws an error
class ThrowError extends Component<{ shouldThrow?: boolean }> {
  render() {
    if (this.props.shouldThrow) {
      throw new Error('Test error for ErrorBoundary');
    }
    return <div>No error occurred</div>;
  }
}

export const NoError: Story = () => (
  <ErrorBoundary>
    <div className="p-4 bg-white border border-gray-200">
      <p>This content is wrapped in an ErrorBoundary</p>
      <ThrowError shouldThrow={false} />
    </div>
  </ErrorBoundary>
);

export const WithError: Story = () => (
  <ErrorBoundary>
    <div className="p-4 bg-white border border-gray-200">
      <ThrowError shouldThrow={true} />
    </div>
  </ErrorBoundary>
);
