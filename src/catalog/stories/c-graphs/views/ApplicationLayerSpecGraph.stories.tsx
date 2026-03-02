/**
 * Application Layer Spec Graph Stories
 *
 * Renders the JSON Schema spec graph for the application layer as the CLI
 * visualization service delivers it: a SpecDataResponse is passed to
 * SpecGraphView, which converts it via SpecGraphBuilder into a MetaModel and
 * hands it to GraphViewer.
 *
 * The fixture uses the modern DR CLI nodeSchemas + relationshipSchemas format
 * from the /api/spec endpoint.  Node types (ApplicationComponent,
 * ApplicationService) and their attributes are drawn directly from the real
 * documentation-robotics/model/04_application/ YAML definitions.
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
 * Default spec graph: ApplicationComponent and ApplicationService rendered as
 * schema table nodes, connected by a directed 'uses' edge — exactly as the DR
 * CLI visualization service would present the 04_application spec schema.
 */
export const Default: Story = {
  render: () => {
    const specData = createApplicationLayerSpecFixture();
    return (
      <StoryProviderWrapper spec={specData}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <SpecGraphView specData={specData} selectedSchemaId="04_application" />
        </div>
      </StoryProviderWrapper>
    );
  },
};
