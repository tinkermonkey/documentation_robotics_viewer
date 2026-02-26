/**
 * CrossLayerEdgeErrorBoundary Component Stories
 *
 * Error boundary wrapper that catches and displays errors from cross-layer edge rendering.
 * Protects the React Flow graph from crashing due to edge component errors.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { CrossLayerEdgeErrorBoundary } from '@/core/components/CrossLayerEdgeErrorBoundary';
import { StoryProviderWrapper } from '@/catalog';
import { createCompleteModelFixture } from '@/catalog/fixtures/modelFixtures';

const meta = {
  title: 'Core Components / CrossLayerEdgeErrorBoundary',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Normal rendering without errors
 * Children render normally when no errors occur
 */
export const HealthyContent: Story = {
  render: () => (
    <StoryProviderWrapper model={createCompleteModelFixture()}>
      <CrossLayerEdgeErrorBoundary>
        <div className="p-8 bg-white border border-green-200 rounded-lg max-w-md">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cross-Layer Edges Working
            </h3>
            <p className="text-sm text-gray-600">
              All edge components are rendering correctly without errors.
            </p>
          </div>
        </div>
      </CrossLayerEdgeErrorBoundary>
    </StoryProviderWrapper>
  ),
};

/**
 * Error state with default fallback UI
 * Shows the error boundary's default error display
 */
export const ErrorState: Story = {
  render: () => {
    // Component that throws an error when rendered
    const ErrorComponent = () => {
      throw new Error('Cannot read property "path" of undefined');
    };

    return (
      <StoryProviderWrapper model={createCompleteModelFixture()}>
        <CrossLayerEdgeErrorBoundary>
          <ErrorComponent />
        </CrossLayerEdgeErrorBoundary>
      </StoryProviderWrapper>
    );
  },
};

/**
 * Error with custom fallback UI
 * Demonstrates using a custom fallback component
 */
export const CustomFallbackUI: Story = {
  render: () => {
    const ErrorComponent = () => {
      throw new Error('Path calculation failed');
    };

    const customFallback = (
      <div className="p-8 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Edges Temporarily Unavailable
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            We're having trouble rendering some connections. The graph will continue to display
            but cross-layer edges may not be visible.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );

    return (
      <StoryProviderWrapper model={createCompleteModelFixture()}>
        <CrossLayerEdgeErrorBoundary fallbackUI={customFallback}>
          <ErrorComponent />
        </CrossLayerEdgeErrorBoundary>
      </StoryProviderWrapper>
    );
  },
};

/**
 * Recovery after dismissing error
 * Shows that the error boundary can recover when the "Try Again" button is clicked
 */
export const Recoverable: Story = {
  render: () => (
    <StoryProviderWrapper model={createCompleteModelFixture()}>
      <CrossLayerEdgeErrorBoundary>
        <div className="p-8 bg-white border border-gray-200 rounded-lg max-w-md">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Boundary Active
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This error boundary can catch and recover from errors in cross-layer edge rendering.
              Click the "Try Again" button in an error state to recover.
            </p>
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              Error boundaries are class components that catch JavaScript errors during rendering.
            </div>
          </div>
        </div>
      </CrossLayerEdgeErrorBoundary>
    </StoryProviderWrapper>
  ),
};
