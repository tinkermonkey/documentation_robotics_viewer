import type { Meta, StoryObj } from '@storybook/react';
import { wrapRenderProp, wrapRenderProp2, wrapRenderPropVoid } from '@/core/components/base/RenderPropErrorBoundary';

const meta = {
  title: 'A Primitives / State Panels / RenderPropErrorBoundary',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story showing successful render prop
 */
export const SuccessfulRenderProp: Story = {
  render: () => {
    const renderElement = (element: { id: string; name: string; type: string }) => (
      <div className="space-y-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
        <h3 className="font-semibold text-green-900 dark:text-green-300">Successful Render</h3>
        <p className="text-sm text-green-800 dark:text-green-200">ID: {element.id}</p>
        <p className="text-sm text-green-800 dark:text-green-200">Name: {element.name}</p>
        <p className="text-sm text-green-800 dark:text-green-200">Type: {element.type}</p>
      </div>
    );

    return (
      <div style={{ width: '100%', maxWidth: 400, padding: '20px', backgroundColor: '#f9fafb' }}>
        <h2 className="text-lg font-bold mb-4">wrapRenderProp - Success Case</h2>
        {wrapRenderProp(
          renderElement,
          { id: 'elem-1', name: 'Test Element', type: 'Service' },
          'renderElement'
        )}
      </div>
    );
  },
};

/**
 * Story showing error in render prop
 */
export const ErrorInRenderProp: Story = {
  render: () => {
    const throwingRender = (_element: any) => {
      throw new Error('Failed to render element - invalid data structure');
    };

    return (
      <div style={{ width: '100%', maxWidth: 400, padding: '20px', backgroundColor: '#f9fafb' }}>
        <h2 className="text-lg font-bold mb-4">wrapRenderProp - Error Case</h2>
        {wrapRenderProp(
          throwingRender,
          { id: 'elem-1' },
          'renderElement'
        )}
      </div>
    );
  },
};

/**
 * Story showing successful render prop with two arguments
 */
export const SuccessfulRenderProp2: Story = {
  render: () => {
    const renderRelationship = (source: { name: string }, target: { name: string }) => (
      <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300">Relationship Found</h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">{source.name} → {target.name}</p>
      </div>
    );

    return (
      <div style={{ width: '100%', maxWidth: 400, padding: '20px', backgroundColor: '#f9fafb' }}>
        <h2 className="text-lg font-bold mb-4">wrapRenderProp2 - Success Case</h2>
        {wrapRenderProp2(
          renderRelationship,
          { name: 'Source Service' },
          { name: 'Target Service' },
          'renderRelationship'
        )}
      </div>
    );
  },
};

/**
 * Story showing error in render prop with two arguments
 */
export const ErrorInRenderProp2: Story = {
  render: () => {
    const throwingRender = (_source: any, _target: any) => {
      throw new Error('Cannot find relationship between these elements');
    };

    return (
      <div style={{ width: '100%', maxWidth: 400, padding: '20px', backgroundColor: '#f9fafb' }}>
        <h2 className="text-lg font-bold mb-4">wrapRenderProp2 - Error Case</h2>
        {wrapRenderProp2(
          throwingRender,
          { name: 'Source' },
          { name: 'Target' },
          'renderRelationship'
        )}
      </div>
    );
  },
};

/**
 * Story showing successful void render prop
 */
export const SuccessfulVoidRenderProp: Story = {
  render: () => {
    const renderHeader = () => (
      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded">
        <h3 className="font-semibold text-purple-900 dark:text-purple-300">Header Content</h3>
        <p className="text-sm text-purple-800 dark:text-purple-200">This header renders successfully</p>
      </div>
    );

    return (
      <div style={{ width: '100%', maxWidth: 400, padding: '20px', backgroundColor: '#f9fafb' }}>
        <h2 className="text-lg font-bold mb-4">wrapRenderPropVoid - Success Case</h2>
        {wrapRenderPropVoid(renderHeader, 'renderHeader')}
      </div>
    );
  },
};

/**
 * Story showing error in void render prop
 */
export const ErrorInVoidRenderProp: Story = {
  render: () => {
    const throwingRender = () => {
      throw new Error('Header data is corrupted or unavailable');
    };

    return (
      <div style={{ width: '100%', maxWidth: 400, padding: '20px', backgroundColor: '#f9fafb' }}>
        <h2 className="text-lg font-bold mb-4">wrapRenderPropVoid - Error Case</h2>
        {wrapRenderPropVoid(throwingRender, 'renderHeader')}
      </div>
    );
  },
};

/**
 * Story showing undefined void render prop (returns null)
 */
export const UndefinedVoidRenderProp: Story = {
  render: () => (
    <div style={{ width: '100%', maxWidth: 400, padding: '20px', backgroundColor: '#f9fafb' }}>
      <h2 className="text-lg font-bold mb-4">wrapRenderPropVoid - Undefined Case</h2>
      <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          When render prop is undefined:
        </p>
        <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded">
          {wrapRenderPropVoid(undefined, 'optionalRender')}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            (Returns null - nothing rendered above this line)
          </p>
        </div>
      </div>
    </div>
  ),
};

/**
 * Story showing multiple error cases together
 */
export const MultipleErrorCases: Story = {
  render: () => {
    const failingRender1 = () => {
    throw new Error('Failed to load filters');
  };

  const failingRender2 = (_a: any, _b: any) => {
    throw new Error('Cannot compare these elements');
  };

  const failingRender3 = () => {
    throw new Error('Annotations unavailable');
  };

  return (
    <div style={{ width: '100%', maxWidth: 500, padding: '20px', backgroundColor: '#f9fafb' }}>
      <h2 className="text-lg font-bold mb-6">Multiple Errors - Recovery Demonstration</h2>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Section 1 - Filters</h3>
          {wrapRenderPropVoid(failingRender1, 'renderFilters')}
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Section 2 - Comparison</h3>
          {wrapRenderProp2(
            failingRender2,
            { id: 'elem1' },
            { id: 'elem2' },
            'renderComparison'
          )}
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Section 3 - Annotations</h3>
          {wrapRenderPropVoid(failingRender3, 'renderAnnotations')}
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            ✓ Component remains stable despite multiple errors
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
            ✓ Each error is isolated and displayed clearly
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
            ✓ User can still interact with unaffected sections
          </p>
        </div>
      </div>
    </div>
  );
  },
};
