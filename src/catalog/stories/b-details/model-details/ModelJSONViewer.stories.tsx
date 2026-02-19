import type { Meta, StoryObj } from '@storybook/react';
import ModelJSONViewer from '@/apps/embedded/components/ModelJSONViewer';
import type { MetaModel } from '@/core/types/model';

const meta = {
  title: 'B Details / Model Details / ModelJSONViewer',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const mockModel: MetaModel = {
  layers: {
    'motivation-layer': {
      id: 'motivation-layer',
      type: 'motivation',
      name: 'Motivation Layer',
      description: 'Captures stakeholder concerns, goals, requirements, and constraints that drive architectural decisions',
      elements: [
        {
          id: 'motivation.goal.visualize-architecture',
          type: 'Goal',
          name: 'Visualize Architecture',
          layerId: 'motivation-layer',
          description: 'Provide interactive visualization of DR models across all layers with pan, zoom, and navigation capabilities. Enable architecture teams to explore and communicate architectural decisions effectively.',
          properties: {
            priority: 'high',
            goal: {
              measurable: 'true',
              'target-date': '2024-Q2',
              kpi: 'Initial render time < 3s for 500 elements'
            },
            stakeholders: [
              'motivation.stakeholder.architecture-team',
              'motivation.stakeholder.development-team'
            ],
            'governed-by-principles': [
              'motivation.principle.user-centric-design',
              'motivation.principle.performance-first'
            ],
          },
          visual: {
            position: { x: 0, y: 0 },
            size: { width: 180, height: 100 },
            style: {}
          },
        },
        {
          id: 'motivation.stakeholder.architecture-team',
          type: 'Stakeholder',
          name: 'Architecture Team',
          layerId: 'motivation-layer',
          description: 'Primary stakeholder responsible for defining and maintaining the architecture documentation. Uses the viewer to explore, validate, and communicate architectural decisions across the organization.',
          properties: {
            stakeholderType: 'internal',
            concerns: [
              'Accurate visualization of multi-layer architecture',
              'Traceability from goals to implementation',
              'Easy navigation between related elements'
            ],
            'associated-goals': [
              'motivation.goal.visualize-architecture'
            ],
          },
          visual: {
            position: { x: 0, y: 0 },
            size: { width: 180, height: 100 },
            style: {}
          },
        },
        {
          id: 'motivation.requirement.interactive-graphs',
          type: 'Requirement',
          name: 'Interactive Graphs',
          layerId: 'motivation-layer',
          description: 'Users must be able to pan, zoom, and click nodes for details. Graph should support filtering by layer and element type with smooth transitions.',
          properties: {
            requirementType: 'functional',
            priority: 'high',
            requirement: {
              source: 'stakeholder-interview',
              status: 'implemented',
              'traceability-id': 'REQ-001'
            },
            'supports-goals': [
              'motivation.goal.visualize-architecture'
            ],
            'governed-by-principles': [
              'motivation.principle.user-centric-design'
            ],
          },
          visual: {
            position: { x: 0, y: 0 },
            size: { width: 180, height: 100 },
            style: {}
          },
        },
        {
          id: 'motivation.principle.performance-first',
          type: 'Principle',
          name: 'Performance First',
          layerId: 'motivation-layer',
          description: 'All features must be implemented with performance as a primary concern. Target 60fps for interactions and <3s initial load for typical models.',
          properties: {
            category: 'technical',
            principle: {
              rationale: 'Poor performance degrades user experience and reduces adoption',
              implications: 'May require web workers, virtualization, and lazy loading strategies'
            }
          },
          visual: {
            position: { x: 0, y: 0 },
            size: { width: 180, height: 100 },
            style: {}
          },
        },
      ],
      relationships: [
        { id: 'r1', sourceId: 'motivation.goal.visualize-architecture', targetId: 'motivation.requirement.interactive-graphs', type: 'realizes' },
      ],
    },
    'business-layer': {
      id: 'business-layer',
      type: 'business',
      name: 'Business Layer',
      description: 'Defines business services, processes, and capabilities',
      elements: [
        {
          id: 'business.service.graph-rendering',
          type: 'BusinessService',
          name: 'Graph Rendering Service',
          layerId: 'business-layer',
          description: 'Provides graph visualization capabilities to end users, enabling exploration of architectural models through interactive diagrams.',
          properties: {
            'service-level': 'core',
            automated: true,
            'supports-goals': [
              'motivation.goal.visualize-architecture'
            ],
          },
          visual: {
            position: { x: 0, y: 0 },
            size: { width: 180, height: 100 },
            style: {}
          },
        },
      ],
      relationships: [],
    },
  },
  version: '1.0',
  references: [] as any,
};

const mockSpecData = {
  schemas: {
    '01-motivation-layer.schema.json': {
      description: 'Captures stakeholder concerns, goals, requirements, and constraints that drive architectural decisions using ArchiMate motivation elements.',
      definitions: {
        Goal: {
          description: 'High-level statement of intent, direction, or desired end state',
          properties: {
            id: { type: 'string', description: 'Unique identifier' },
            name: { type: 'string', description: 'Goal name' },
            priority: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low'],
              description: 'Goal priority level'
            },
            description: { type: 'string', description: 'Detailed description of the goal' }
          }
        },
        Stakeholder: {
          description: 'Individual, team, or organization with interest in the outcome',
          properties: {
            id: { type: 'string', description: 'Unique identifier' },
            name: { type: 'string', description: 'Stakeholder name' },
            type: {
              type: 'string',
              enum: ['internal', 'external', 'customer', 'partner', 'regulator'],
              description: 'Stakeholder type'
            },
            description: { type: 'string', description: 'Stakeholder description and role' }
          }
        },
        Requirement: {
          description: 'Statement of need that must be realized',
          properties: {
            id: { type: 'string', description: 'Unique identifier' },
            name: { type: 'string', description: 'Requirement name' },
            requirementType: {
              type: 'string',
              enum: ['functional', 'non-functional', 'business', 'technical', 'compliance', 'user'],
              description: 'Type of requirement'
            },
            priority: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low'],
              description: 'Requirement priority'
            },
            description: { type: 'string', description: 'Detailed requirement specification' }
          }
        },
        Principle: {
          description: 'Normative property of all systems in a given context',
          properties: {
            id: { type: 'string', description: 'Unique identifier' },
            name: { type: 'string', description: 'Principle name' },
            category: {
              type: 'string',
              enum: ['business', 'data', 'application', 'technology', 'security', 'integration'],
              description: 'Principle category'
            },
            description: { type: 'string', description: 'Principle statement and rationale' }
          }
        }
      }
    },
    '02-business-layer.schema.json': {
      description: 'Defines business services, processes, and capabilities',
      definitions: {
        BusinessService: {
          description: 'Service that fulfills a business need',
          properties: {
            id: { type: 'string', description: 'Unique identifier' },
            name: { type: 'string', description: 'Service name' },
            description: { type: 'string', description: 'Service description and purpose' }
          }
        }
      }
    }
  }
};


export const Default: Story = {
  render: () => (
    <div className="w-full max-w-4xl p-4 bg-gray-50">
      <ModelJSONViewer
        model={mockModel}
        selectedLayer={null}
        specData={mockSpecData}
      />
    </div>
  ),
};

export const WithSelectedLayer: Story = {
  render: () => (
    <div className="w-full max-w-4xl p-4 bg-gray-50">
      <ModelJSONViewer
        model={mockModel}
        selectedLayer="motivation-layer"
        specData={mockSpecData}
      />
    </div>
  ),
};

export const WithBusinessLayer: Story = {
  render: () => (
    <div className="w-full max-w-4xl p-4 bg-gray-50">
      <ModelJSONViewer
        model={mockModel}
        selectedLayer="business-layer"
        specData={mockSpecData}
      />
    </div>
  ),
};

export const WithPathHighlight: Story = {
  render: () => (
    <div className="w-full max-w-4xl p-4 bg-gray-50">
      <ModelJSONViewer
        model={mockModel}
        selectedLayer="motivation-layer"
        specData={mockSpecData}
        onPathHighlight={(path) => console.log('Path highlighted:', path)}
      />
    </div>
  ),
};
