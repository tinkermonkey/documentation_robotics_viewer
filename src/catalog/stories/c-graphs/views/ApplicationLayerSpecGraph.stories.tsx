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
  },
  args: {
    algorithm: 'layered',
    direction: 'DOWN',
    spacing: 80,
    edgeNodeSpacing: 50,
    edgeSpacing: 30,
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
