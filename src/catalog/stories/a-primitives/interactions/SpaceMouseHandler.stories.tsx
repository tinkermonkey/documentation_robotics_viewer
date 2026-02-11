import type { Meta, StoryObj } from '@storybook/react';
import { SpaceMouseHandler } from '@/core/components/SpaceMouseHandler';
import { ReactFlowProvider } from '@xyflow/react';

const meta = {
  title: 'A Primitives / Interactions / SpaceMouseHandler',
  component: SpaceMouseHandler,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => {
    return (
      <ReactFlowProvider>
        <div
          style={{
            width: '100%',
            height: 400,
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 16,
            backgroundColor: '#f9fafb',
          }}
        >
          <div style={{ marginBottom: 12, fontSize: 12, color: '#6b7280' }}>
            <p>Hold SPACE and use mouse to pan the view (when zoomed in)</p>
            <p>Mouse wheel to zoom</p>
          </div>
          <div
            style={{
              width: '100%',
              height: 300,
              border: '1px dashed #d1d5db',
              borderRadius: 4,
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: 14,
            }}
          >
            <SpaceMouseHandler />
            <p>Graph viewport area</p>
          </div>
        </div>
      </ReactFlowProvider>
    );
  }
};

export const WithSensitivity: Story = {
  render: () => {
    return (
      <ReactFlowProvider>
        <div
          style={{
            width: '100%',
            height: 400,
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 16,
            backgroundColor: '#f9fafb',
          }}
        >
          <div style={{ marginBottom: 12, fontSize: 12, color: '#6b7280' }}>
            <p>High sensitivity (2.0x)</p>
          </div>
          <div
            style={{
              width: '100%',
              height: 300,
              border: '1px dashed #d1d5db',
              borderRadius: 4,
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: 14,
            }}
          >
            <SpaceMouseHandler sensitivity={2.0} />
            <p>Graph viewport area</p>
          </div>
        </div>
      </ReactFlowProvider>
    );
  }
};

export const WithDebug: Story = {
  render: () => {
    return (
      <ReactFlowProvider>
        <div
          style={{
            width: '100%',
            height: 400,
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 16,
            backgroundColor: '#f9fafb',
          }}
        >
          <div style={{ marginBottom: 12, fontSize: 12, color: '#6b7280' }}>
            <p>Debug mode enabled (check console for debug logs)</p>
          </div>
          <div
            style={{
              width: '100%',
              height: 300,
              border: '1px dashed #d1d5db',
              borderRadius: 4,
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: 14,
            }}
          >
            <SpaceMouseHandler debug={true} />
            <p>Graph viewport area</p>
          </div>
        </div>
      </ReactFlowProvider>
    );
  }
};
