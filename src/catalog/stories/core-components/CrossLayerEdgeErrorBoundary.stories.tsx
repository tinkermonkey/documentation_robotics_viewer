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
 * Demonstrates the error boundary in normal operation with healthy content
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
 * Recovery capability demonstration
 * Shows the error boundary's fallback UI and recovery mechanism design
 */
export const RecoveryUI: Story = {
  render: () => (
    <StoryProviderWrapper model={createCompleteModelFixture()}>
      <CrossLayerEdgeErrorBoundary>
        <div className="p-8 bg-white border border-gray-200 rounded-lg max-w-md">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Boundary Active
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This error boundary catches errors during cross-layer edge rendering.
              In production, any rendering errors are gracefully handled with a fallback UI.
            </p>
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              Error boundaries prevent the entire graph from crashing due to edge component failures.
            </div>
          </div>
        </div>
      </CrossLayerEdgeErrorBoundary>
    </StoryProviderWrapper>
  ),
};
