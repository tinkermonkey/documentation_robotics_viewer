import type { Meta, StoryObj } from '@storybook/react';
import { SourceReference } from '@/core/types/model';
import SourceReferenceList from './SourceReferenceList';

const meta = {
  title: 'A Primitives / Data Viewers / SourceReferenceList',
  component: SourceReferenceList,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SourceReferenceList>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleReferences: SourceReference[] = [
  {
    provenance: 'extracted',
    locations: [
      {
        file: 'src/services/auth.ts',
        symbol: 'AuthService',
      },
    ],
    repository: {
      url: 'https://github.com/example/repo',
      commit: 'abc123def456',
    },
  },
  {
    provenance: 'manual',
    locations: [
      {
        file: 'docs/api-spec.md',
      },
    ],
  },
];

const sampleReferencesWithoutRepository: SourceReference[] = [
  {
    provenance: 'inferred',
    locations: [
      {
        file: 'src/models/user.ts',
        symbol: 'User',
      },
    ],
  },
  {
    provenance: 'generated',
    locations: [
      {
        file: 'generated/types.ts',
      },
    ],
  },
];

const multipleLocations: SourceReference[] = [
  {
    provenance: 'extracted',
    locations: [
      {
        file: 'src/services/payment.ts',
        symbol: 'PaymentProcessor',
      },
      {
        file: 'src/services/index.ts',
        symbol: 'exportPaymentProcessor',
      },
    ],
    repository: {
      url: 'https://github.com/example/repo',
      commit: 'abc123def456',
    },
  },
];

export const WithRepositoryLinks: Story = {
  args: {
    references: sampleReferences,
  },
  render: () => (
    <div className="w-96 p-4">
      <SourceReferenceList references={sampleReferences} />
    </div>
  ),
};

export const WithoutRepositoryLinks: Story = {
  args: {
    references: sampleReferencesWithoutRepository,
  },
  render: () => (
    <div className="w-96 p-4">
      <SourceReferenceList references={sampleReferencesWithoutRepository} />
    </div>
  ),
};

export const MultipleLocations: Story = {
  args: {
    references: multipleLocations,
  },
  render: () => (
    <div className="w-96 p-4">
      <SourceReferenceList references={multipleLocations} />
    </div>
  ),
};

export const Empty: Story = {
  args: {
    references: [],
  },
  render: () => (
    <div className="w-96 p-4">
      <SourceReferenceList references={[]} />
    </div>
  ),
};

export const WithRepositoryLinksDarkMode: Story = {
  args: {
    references: sampleReferences,
  },
  render: () => (
    <div className="dark w-96 p-4 bg-gray-900 rounded">
      <SourceReferenceList references={sampleReferences} />
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const EmptyDarkMode: Story = {
  args: {
    references: [],
  },
  render: () => (
    <div className="dark w-96 p-4 bg-gray-900 rounded">
      <SourceReferenceList references={[]} />
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
