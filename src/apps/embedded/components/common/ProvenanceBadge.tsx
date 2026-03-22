/**
 * ProvenanceBadge Component
 * Displays colored badge for four provenance types: extracted, manual, inferred, generated
 * Uses Flowbite Badge component with semantic color mapping
 */

import React from 'react';
import { Badge } from 'flowbite-react';

export interface ProvenanceBadgeProps {
  provenance: 'extracted' | 'manual' | 'inferred' | 'generated';
}

type FlowbiteColor = 'info' | 'success' | 'warning' | 'purple';

const provenanceColorMap: Record<ProvenanceBadgeProps['provenance'], FlowbiteColor> = {
  extracted: 'info',
  manual: 'success',
  inferred: 'warning',
  generated: 'purple',
};

const provenanceLabelMap: Record<ProvenanceBadgeProps['provenance'], string> = {
  extracted: 'Extracted',
  manual: 'Manual',
  inferred: 'Inferred',
  generated: 'Generated',
};

const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ provenance }) => {
  const color = provenanceColorMap[provenance];
  const label = provenanceLabelMap[provenance];

  return (
    <Badge
      color={color}
      size="sm"
      data-testid={`provenance-badge-${provenance}`}
    >
      {label}
    </Badge>
  );
};

export default ProvenanceBadge;
