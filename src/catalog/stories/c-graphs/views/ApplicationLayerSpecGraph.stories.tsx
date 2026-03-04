/**
 * Application Layer Spec Graph Stories
 *
 * Renders the JSON Schema spec graph for the application layer as the DR CLI
 * /api/spec endpoint delivers it: a SpecDataResponse is passed to
 * SpecGraphView, which converts it via SpecGraphBuilder into a MetaModel and
 * hands it to GraphViewer.
 *
 * The fixture mirrors the real .dr/spec/application.json structure: 9 ArchiMate
 * 3.2-inspired element types (ApplicationComponent, ApplicationService,
 * ApplicationFunction, etc.) with their attribute schemas and a representative
 * set of intra-layer relationships.
 */
import type { Meta, StoryObj } from '@storybook/react';

interface LayoutArgs {
  algorithm: 'layered' | 'force' | 'stress' | 'box';
  direction: 'DOWN' | 'RIGHT' | 'UP' | 'LEFT';
  spacing: number;
  edgeNodeSpacing: number;
  edgeSpacing: number;
  edgeRouting: 'ORTHOGONAL' | 'POLYLINE' | 'SPLINES';
  layering: 'NETWORK_SIMPLEX' | 'LONGEST_PATH' | 'STRETCH_WIDTH' | 'MIN_WIDTH';
  thoroughness: number;
  aspectRatio: number;
  portConstraints: 'FREE' | 'FIXED_POS';
  edgeEdgeBetweenLayers: number;
}
import SpecGraphView from '@/apps/embedded/components/SpecGraphView';
import { StoryProviderWrapper } from '@/catalog';
import { createApplicationLayerSpecFixture } from '@/catalog/fixtures/specFixtures';

const meta = {
  title: 'C Graphs / Views / ApplicationLayerSpecGraph',
  parameters: { layout: 'fullscreen' },
  tags: ['skip-a11y'],
  argTypes: {
    algorithm: {
      control: 'select',
      options: ['layered', 'force', 'stress', 'box'],
      description: 'ELK layout algorithm',
    },
    direction: {
      control: 'select',
      options: ['DOWN', 'RIGHT', 'UP', 'LEFT'],
      description: 'Primary layout direction',
    },
    spacing: {
      control: { type: 'range', min: 20, max: 200, step: 10 },
      description: 'Node-to-node spacing',
    },
    edgeNodeSpacing: {
      control: { type: 'range', min: 10, max: 100, step: 5 },
      description: 'Edge-to-node spacing',
    },
    edgeSpacing: {
      control: { type: 'range', min: 5, max: 80, step: 5 },
      description: 'Edge-to-edge spacing',
    },
    edgeRouting: {
      control: 'select',
      options: ['ORTHOGONAL', 'POLYLINE', 'SPLINES'],
      description: 'Edge routing style — SPLINES draws curves that naturally diverge; ORTHOGONAL uses rectilinear paths; POLYLINE allows diagonals',
    },
    layering: {
      control: 'select',
      options: ['NETWORK_SIMPLEX', 'LONGEST_PATH', 'STRETCH_WIDTH', 'MIN_WIDTH'],
      description: 'Node layering strategy — STRETCH_WIDTH distributes nodes more evenly, spreading edge channels',
    },
    thoroughness: {
      control: { type: 'range', min: 1, max: 15, step: 1 },
      description: 'Crossing-minimization passes — higher values reduce edge crossings at the cost of layout time',
    },
    aspectRatio: {
      control: { type: 'range', min: 0.5, max: 4.0, step: 0.1 },
      description: 'Target width/height ratio — wider values spread nodes horizontally, giving edges more distinct channels',
    },
    portConstraints: {
      control: 'select',
      options: ['FIXED_POS', 'FREE'],
      description: 'FIXED_POS: all edges share the center handle (React Flow aligned). FREE: ELK assigns each edge a distinct perimeter position — edges naturally diverge but endpoint dots float off the handle',
    },
    edgeEdgeBetweenLayers: {
      control: { type: 'range', min: 0, max: 200, step: 5 },
      description: 'Gap between parallel edges crossing a layer boundary — widens the routing channels so edges take visually distinct paths',
    },
  },
  args: {
    algorithm: 'layered',
    direction: 'DOWN',
    spacing: 100,
    edgeNodeSpacing: 60,
    edgeSpacing: 30,
    edgeRouting: 'ORTHOGONAL',
    layering: 'NETWORK_SIMPLEX',
    thoroughness: 7,
    aspectRatio: 1.6,
    portConstraints: 'FREE',
    edgeEdgeBetweenLayers: 40,
  },
} satisfies Meta<LayoutArgs>;

export default meta;
type Story = StoryObj<LayoutArgs>;

/**
 * Default spec graph: all 9 ArchiMate application-layer element types rendered
 * as schema table nodes, connected by their real intra-layer relationships —
 * exactly as the DR CLI /api/spec endpoint delivers the application layer.
 *
 * Use the Controls panel to tune ELK layout parameters live.
 */
export const Default: Story = {
  render: (args) => {
    const specData = createApplicationLayerSpecFixture();
    const layoutParameters = {
      algorithm: args.algorithm,
      direction: args.direction,
      spacing: args.spacing,
      edgeNodeSpacing: args.edgeNodeSpacing,
      edgeSpacing: args.edgeSpacing,
      edgeRouting: args.edgeRouting,
      layering: args.layering,
      thoroughness: args.thoroughness,
      aspectRatio: args.aspectRatio,
      portConstraints: args.portConstraints,
      edgeEdgeBetweenLayers: args.edgeEdgeBetweenLayers,
    };
    return (
      <StoryProviderWrapper spec={specData}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <SpecGraphView
            specData={specData}
            selectedSchemaId="application"
            layoutParameters={layoutParameters}
          />
        </div>
      </StoryProviderWrapper>
    );
  },
};
