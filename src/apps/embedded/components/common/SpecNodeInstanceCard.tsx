/**
 * SpecNodeInstanceCard Component
 * Displays spec node instance metadata (name, description)
 * Extracted from the spec node schema definition
 */

import React, { useMemo } from 'react';
import { Card } from 'flowbite-react';

export interface SpecNodeInstanceCardProps {
  specNodeId: string;
  nodeSchema: unknown;
}

interface SpecNodeMetadata {
  title?: string;
  description?: string;
}

const extractMetadata = (schema: unknown): SpecNodeMetadata => {
  if (!schema || typeof schema !== 'object') return {};

  const schemaObj = schema as Record<string, unknown>;

  return {
    title: schemaObj.title as string | undefined,
    description: schemaObj.description as string | undefined,
  };
};

const SpecNodeInstanceCard: React.FC<SpecNodeInstanceCardProps> = ({
  specNodeId,
  nodeSchema,
}) => {
  const metadata = useMemo(() => extractMetadata(nodeSchema), [nodeSchema]);

  if (!metadata.title && !metadata.description) {
    return null;
  }

  return (
    <Card
      className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
      data-testid="spec-node-instance-card"
    >
      <div className="space-y-3">
        {metadata.title && (
          <div>
            <h5 className="text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wide mb-1">
              Spec Node Type
            </h5>
            <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
              {metadata.title}
            </p>
          </div>
        )}

        {metadata.description && (
          <div>
            <h5 className="text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wide mb-1">
              Description
            </h5>
            <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
              {metadata.description}
            </p>
          </div>
        )}

        <div>
          <h5 className="text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wide mb-1">
            Spec Node ID
          </h5>
          <code className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-950 dark:text-amber-100 px-2 py-1 rounded block break-all">
            {specNodeId}
          </code>
        </div>
      </div>
    </Card>
  );
};

export default SpecNodeInstanceCard;
