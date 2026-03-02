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
import SpecGraphView from '@/apps/embedded/components/SpecGraphView';
import { StoryProviderWrapper } from '@/catalog';
import { createApplicationLayerSpecFixture } from '@/catalog/fixtures/specFixtures';

const meta = {
  title: 'C Graphs / Views / ApplicationLayerSpecGraph',
  parameters: { layout: 'fullscreen' },
  tags: ['skip-a11y'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default spec graph: all 9 ArchiMate application-layer element types rendered
 * as schema table nodes, connected by their real intra-layer relationships —
 * exactly as the DR CLI /api/spec endpoint delivers the application layer.
 */
export const Default: Story = {
  render: () => {
    const specData = createApplicationLayerSpecFixture();
    return (
      <StoryProviderWrapper spec={specData}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <SpecGraphView specData={specData} selectedSchemaId="application" />
        </div>
      </StoryProviderWrapper>
    );
  },
};
