/**
 * SpecDefinitionCard Component
 * Displays spec schema properties for an element type
 * Shows property name, type, required flag, description, and enum values
 */

import React, { useMemo } from 'react';
import { Badge, Table, TableBody, TableCell, TableRow } from 'flowbite-react';
import type { SpecNodeRelationship } from '@/core/types/model';
import ExpandableSection from './ExpandableSection';

export interface SpecDefinitionCardProps {
  specNodeId: string;
  nodeSchema: unknown;
  relationshipSchemas?: SpecNodeRelationship[];
}

interface SchemaProperty {
  name: string;
  type?: string;
  required: boolean;
  description?: string;
  enum?: string[];
}

const extractProperties = (schema: unknown): SchemaProperty[] => {
  if (!schema || typeof schema !== 'object') return [];

  const schemaObj = schema as Record<string, unknown>;

  // Handle nested DR CLI schema structure: properties.attributes.properties
  const attributesDef = schemaObj.properties as Record<string, unknown> | undefined;
  const attributesProp = attributesDef?.attributes as Record<string, unknown> | undefined;
  const nestedProperties = attributesProp?.properties as Record<string, unknown> | undefined;

  // Use nested properties if available, otherwise fall back to top-level properties
  const properties = nestedProperties || attributesDef;

  if (!properties || typeof properties !== 'object') return [];

  // Extract required from attributes level if nested, otherwise from root level
  const requiredAttrs = (attributesProp?.required as string[]) || (schemaObj.required as string[]) || [];

  return Object.entries(properties).map(([name, prop]) => {
    if (!prop || typeof prop !== 'object') {
      return {
        name,
        required: requiredAttrs.includes(name),
      };
    }

    const propObj = prop as Record<string, unknown>;
    return {
      name,
      type: propObj.type as string | undefined,
      required: requiredAttrs.includes(name),
      description: propObj.description as string | undefined,
      enum: propObj.enum as string[] | undefined,
    };
  });
};

const SpecDefinitionCard: React.FC<SpecDefinitionCardProps> = ({
  specNodeId,
  nodeSchema,
  relationshipSchemas = [],
}) => {
  const properties = useMemo(() => extractProperties(nodeSchema), [nodeSchema]);

  // Get applicable relationship types for this spec node
  const applicableRelationships = useMemo(() => {
    return relationshipSchemas.filter(
      (rel) =>
        rel.sourceSpecNodeId === specNodeId || rel.destinationSpecNodeId === specNodeId
    );
  }, [specNodeId, relationshipSchemas]);

  if (properties.length === 0 && applicableRelationships.length === 0) {
    return (
      <div
        className="text-sm text-gray-500 dark:text-gray-400 italic"
        data-testid="spec-definition-empty"
      >
        No schema properties defined
      </div>
    );
  }

  return (
    <div
      className="space-y-4"
      data-testid="spec-definition-card"
    >
      {/* Properties Section */}
      {properties.length > 0 && (
        <ExpandableSection
          title="Properties"
          count={properties.length}
          defaultExpanded={true}
          data-testid="spec-properties-section"
        >
          <Table className="text-sm">
            <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
              {properties.map((prop, idx) => (
                <TableRow
                  key={`prop-${idx}`}
                  className="bg-white dark:bg-gray-800"
                  data-testid={`spec-property-${prop.name}`}
                >
                  <TableCell className="px-3 py-2 font-medium text-gray-900 dark:text-white w-1/4">
                    {prop.name}
                    {prop.required && (
                      <span className="text-red-600 dark:text-red-400 ml-1">*</span>
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-gray-600 dark:text-gray-400 w-1/6">
                    {prop.type ? (
                      <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">
                        {prop.type}
                      </code>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-gray-700 dark:text-gray-300 flex-1">
                    <div className="space-y-1">
                      {prop.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {prop.description}
                        </p>
                      )}
                      {prop.enum && prop.enum.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prop.enum.map((value) => (
                            <Badge
                              key={`enum-${value}`}
                              color="indigo"
                              size="xs"
                              data-testid={`enum-${prop.name}-${value}`}
                            >
                              {value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ExpandableSection>
      )}

      {/* Relationships Section */}
      {applicableRelationships.length > 0 && (
        <ExpandableSection
          title="Relationships"
          count={applicableRelationships.length}
          defaultExpanded={false}
          data-testid="spec-relationships-section"
        >
          <div className="space-y-2">
            {applicableRelationships.map((rel) => (
              <div
                key={`rel-${rel.id}`}
                className="text-sm border border-gray-200 dark:border-gray-700 rounded p-2"
                data-testid={`spec-relationship-${rel.id}`}
              >
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                  {rel.predicate}
                </div>
                <div className="text-gray-900 dark:text-white">
                  {rel.sourceSpecNodeId === specNodeId ? (
                    <>
                      <span className="font-medium">{rel.sourceSpecNodeId}</span>
                      {' → '}
                      <span className="text-gray-600 dark:text-gray-400">
                        {rel.destinationSpecNodeId}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-600 dark:text-gray-400">
                        {rel.sourceSpecNodeId}
                      </span>
                      {' → '}
                      <span className="font-medium">{rel.destinationSpecNodeId}</span>
                    </>
                  )}
                </div>
                <div className="mt-1 flex gap-1">
                  {rel.required && (
                    <Badge color="warning" size="xs" data-testid={`rel-required-${rel.id}`}>
                      Required
                    </Badge>
                  )}
                  <Badge color="indigo" size="xs" data-testid={`rel-cardinality-${rel.id}`}>
                    {rel.cardinality}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ExpandableSection>
      )}
    </div>
  );
};

export default SpecDefinitionCard;
