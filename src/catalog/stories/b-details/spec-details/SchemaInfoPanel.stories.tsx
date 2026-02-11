import type { Meta, StoryObj } from '@storybook/react';
import { SchemaInfoPanel } from '@/apps/embedded/components/SchemaInfoPanel';
import { useModelStore } from '@/core/stores/modelStore';
import { useEffect } from 'react';
import type { MetaModel } from '@/core/types';

const meta = {
  title: 'B Details / Spec Details / SchemaInfoPanel',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function SchemaInfoPanelStory({ model }: { model: MetaModel | null }) {
  useEffect(() => {
    useModelStore.setState({
      model,
      loading: false,
      error: null,
    });

    return () => {
      useModelStore.setState({
        model: null,
        loading: false,
        error: null,
      });
    };
  }, [model]);

  return <SchemaInfoPanel />;
}

export const Default: Story = {
  render: () => {
  const model: MetaModel = {
    version: '1.0.0',
    layers: {
      motivation: {
        id: 'motivation',
        type: 'Motivation',
        name: 'Motivation Layer',
        description: 'Stakeholders, drivers, and goals',
        order: 1,
        elements: [
          {
            id: 'goal-1',
            type: 'Goal',
            name: 'Increase Revenue',
            layerId: 'motivation',
            description: 'Primary business objective',
            properties: { fill: '#a78bfa', stroke: '#7c3aed' },
            visual: { position: { x: 0, y: 0 }, size: { width: 160, height: 80 }, style: {} },
            relationships: { incoming: [], outgoing: [] },
          },
        ],
        relationships: [],
      },
    },
    references: [],
    metadata: {
      version: '1.0.0',
      schemaVersion: '2.0',
      lastModified: new Date().toISOString(),
      valid: true,
      elementCount: 1,
      validationErrors: [],
    },
  };

  return <SchemaInfoPanelStory model={model} />;
  },
};

export const ValidModel: Story = {
  render: () => {
  const model: MetaModel = {
    version: '2.1.0',
    layers: {
      motivation: {
        id: 'motivation',
        type: 'Motivation',
        name: 'Motivation Layer',
        description: 'Stakeholders, drivers, and goals',
        order: 1,
        elements: [
          {
            id: 'goal-1',
            type: 'Goal',
            name: 'Achieve Market Leadership',
            layerId: 'motivation',
            description: 'Become the market leader',
            properties: { fill: '#a78bfa', stroke: '#7c3aed' },
            visual: { position: { x: 0, y: 0 }, size: { width: 160, height: 80 }, style: {} },
            relationships: { incoming: [], outgoing: [] },
          },
          {
            id: 'requirement-1',
            type: 'Requirement',
            name: 'Support 1000+ concurrent users',
            layerId: 'motivation',
            description: 'Scalability requirement',
            properties: { fill: '#60a5fa', stroke: '#3b82f6' },
            visual: { position: { x: 200, y: 0 }, size: { width: 160, height: 80 }, style: {} },
            relationships: { incoming: [], outgoing: [] },
          },
        ],
        relationships: [],
      },
      business: {
        id: 'business',
        type: 'Business',
        name: 'Business Layer',
        description: 'Services and processes',
        order: 2,
        elements: [
          {
            id: 'service-1',
            type: 'BusinessService',
            name: 'Order Management',
            layerId: 'business',
            description: 'Manages customer orders',
            properties: { fill: '#34d399', stroke: '#10b981' },
            visual: { position: { x: 0, y: 120 }, size: { width: 160, height: 80 }, style: {} },
            relationships: { incoming: [], outgoing: [] },
          },
        ],
        relationships: [],
      },
    },
    references: [],
    metadata: {
      version: '2.1.0',
      schemaVersion: '2.0',
      lastModified: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      valid: true,
      elementCount: 3,
      validationErrors: [],
    },
  };

  return <SchemaInfoPanelStory model={model} />;
  },
};

export const WithValidationErrors: Story = {
  render: () => {
  const model: MetaModel = {
    version: '1.5.0',
    layers: {
      motivation: {
        id: 'motivation',
        type: 'Motivation',
        name: 'Motivation Layer',
        description: 'Stakeholders, drivers, and goals',
        order: 1,
        elements: [
          {
            id: 'goal-1',
            type: 'Goal',
            name: 'Broken Goal',
            layerId: 'motivation',
            description: 'Has validation issues',
            properties: { fill: '#a78bfa', stroke: '#7c3aed' },
            visual: { position: { x: 0, y: 0 }, size: { width: 160, height: 80 }, style: {} },
            relationships: { incoming: [], outgoing: [] },
          },
        ],
        relationships: [],
      },
    },
    references: [],
    metadata: {
      version: '1.5.0',
      schemaVersion: '2.0',
      lastModified: new Date().toISOString(),
      valid: false,
      elementCount: 1,
      validationErrors: [
        'Goal "Broken Goal" is missing required property "priority"',
        'Relationship "goal-1 -> requirement-1" references non-existent requirement-1',
        'Circular dependency detected: goal-1 -> outcome-1 -> goal-1',
      ],
    },
  };

  return <SchemaInfoPanelStory model={model} />;
  },
};

export const LargeModel: Story = {
  render: () => {
  const elementCount = 47;

  const model: MetaModel = {
    version: '3.0.0',
    layers: {
      motivation: {
        id: 'motivation',
        type: 'Motivation',
        name: 'Motivation Layer',
        description: 'Stakeholders, drivers, and goals',
        order: 1,
        elements: Array.from({ length: 6 }, (_, i) => ({
          id: `goal-${i + 1}`,
          type: 'Goal',
          name: `Goal ${i + 1}`,
          layerId: 'motivation',
          description: `Mock goal ${i + 1}`,
          properties: { fill: '#a78bfa', stroke: '#7c3aed' },
          visual: { position: { x: i * 200, y: 0 }, size: { width: 160, height: 80 }, style: {} },
          relationships: { incoming: [], outgoing: [] },
        })),
        relationships: [],
      },
    },
    references: [],
    metadata: {
      version: '3.0.0',
      schemaVersion: '2.0',
      lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      valid: true,
      elementCount,
      validationErrors: [],
    },
  };

  return <SchemaInfoPanelStory model={model} />;
  },
};

export const NoModel: Story = {
  render: () => (
    (
    <div className="p-4 text-gray-500 text-sm">
      <SchemaInfoPanel />
      <p className="mt-4">No model loaded (component returns null)</p>
    </div>
  )
  ),
};

export const MinimalMetadata: Story = {
  render: () => {
  const model: MetaModel = {
    version: '1.0.0',
    layers: {
      motivation: {
        id: 'motivation',
        type: 'Motivation',
        name: 'Motivation Layer',
        description: 'Stakeholders, drivers, and goals',
        order: 1,
        elements: [],
        relationships: [],
      },
    },
    references: [],
    metadata: {
      valid: true,
    },
  };

  return <SchemaInfoPanelStory model={model} />;
  },
};

export const WithCustomClassName: Story = {
  render: () => {
  const model: MetaModel = {
    version: '1.0.0',
    layers: {
      motivation: {
        id: 'motivation',
        type: 'Motivation',
        name: 'Motivation Layer',
        description: 'Stakeholders, drivers, and goals',
        order: 1,
        elements: [
          {
            id: 'goal-1',
            type: 'Goal',
            name: 'Test Goal',
            layerId: 'motivation',
            description: 'Custom styling test',
            properties: { fill: '#a78bfa', stroke: '#7c3aed' },
            visual: { position: { x: 0, y: 0 }, size: { width: 160, height: 80 }, style: {} },
            relationships: { incoming: [], outgoing: [] },
          },
        ],
        relationships: [],
      },
    },
    references: [],
    metadata: {
      version: '1.0.0',
      schemaVersion: '2.0',
      lastModified: new Date().toISOString(),
      valid: true,
      elementCount: 1,
    },
  };

  return (
    <SchemaInfoPanelStory model={model} />
  );
  },
};
