/**
 * RelationshipTable Component
 * Displays grouped inbound/outbound relationships with predicate, element name, and layer badge
 * Distinguishes intra-layer from cross-layer relationships visually
 */

import React, { useMemo } from 'react';
import { Badge, Table, TableBody, TableCell, TableRow } from 'flowbite-react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { getLayerColor } from '@/core/utils/layerColors';

export interface RelationshipTableProps {
  outbound: Array<{
    predicate: string;
    targetId: string;
    targetName: string;
    targetLayerId: string;
    isInterLayer: boolean;
  }>;
  inbound: Array<{
    predicate: string;
    sourceId: string;
    sourceName: string;
    sourceLayerId: string;
    isInterLayer: boolean;
  }>;
}

interface GroupedRelationship {
  predicate: string;
  items: Array<{
    name: string;
    id: string;
    layerId: string;
    isInterLayer: boolean;
  }>;
}

const groupRelationships = (
  relationships: RelationshipTableProps['outbound'] | RelationshipTableProps['inbound']
): GroupedRelationship[] => {
  const grouped = relationships.reduce(
    (acc, rel) => {
      const predicate = rel.predicate;
      if (!acc[predicate]) {
        acc[predicate] = [];
      }
      acc[predicate].push({
        name: 'targetName' in rel ? rel.targetName : rel.sourceName,
        id: 'targetId' in rel ? rel.targetId : rel.sourceId,
        layerId: 'targetLayerId' in rel ? rel.targetLayerId : rel.sourceLayerId,
        isInterLayer: rel.isInterLayer,
      });
      return acc;
    },
    {} as Record<string, GroupedRelationship['items']>
  );

  return Object.entries(grouped).map(([predicate, items]) => ({
    predicate,
    items,
  }));
};

const RelationshipTable: React.FC<RelationshipTableProps> = ({ outbound, inbound }) => {
  const groupedOutbound = useMemo(() => groupRelationships(outbound), [outbound]);
  const groupedInbound = useMemo(() => groupRelationships(inbound), [inbound]);

  if (outbound.length === 0 && inbound.length === 0) {
    return (
      <div
        className="text-sm text-gray-500 dark:text-gray-400 italic"
        data-testid="relationship-table-empty"
      >
        No relationships
      </div>
    );
  }

  return (
    <div
      className="space-y-6"
      data-testid="relationship-table"
    >
      {/* Outbound Relationships */}
      {groupedOutbound.length > 0 && (
        <div data-testid="relationship-table-outbound">
          <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            Outbound ({outbound.length})
          </h3>

          <div className="space-y-3">
            {groupedOutbound.map((group) => (
              <div
                key={`outbound-${group.predicate}`}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                data-testid={`outbound-group-${group.predicate}`}
              >
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                    {group.predicate}
                  </span>
                </div>

                <Table className="text-sm">
                  <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {group.items.map((item, idx) => {
                      const layerColor = getLayerColor(item.layerId, 'primary');

                      return (
                        <TableRow
                          key={`${item.id}-${idx}`}
                          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          data-testid={`relationship-row-${item.id}`}
                        >
                          <TableCell className="px-3 py-2 text-gray-900 dark:text-white font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span
                                className="inline-block w-3 h-3 rounded-full"
                                style={{ backgroundColor: layerColor }}
                                data-testid={`layer-color-${item.layerId}`}
                                title={`Layer: ${item.layerId}`}
                              />
                              {item.isInterLayer ? (
                                <Badge
                                  color="gray"
                                  size="xs"
                                  data-testid={`interlayer-badge-${item.id}`}
                                >
                                  Inter-Layer
                                </Badge>
                              ) : (
                                <Badge
                                  color="indigo"
                                  size="xs"
                                  data-testid={`intralayer-badge-${item.id}`}
                                >
                                  Intra-Layer
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inbound Relationships */}
      {groupedInbound.length > 0 && (
        <div data-testid="relationship-table-inbound">
          <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            Inbound ({inbound.length})
          </h3>

          <div className="space-y-3">
            {groupedInbound.map((group) => (
              <div
                key={`inbound-${group.predicate}`}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                data-testid={`inbound-group-${group.predicate}`}
              >
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                    {group.predicate}
                  </span>
                </div>

                <Table className="text-sm">
                  <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {group.items.map((item, idx) => {
                      const layerColor = getLayerColor(item.layerId, 'primary');

                      return (
                        <TableRow
                          key={`${item.id}-${idx}`}
                          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          data-testid={`relationship-row-${item.id}`}
                        >
                          <TableCell className="px-3 py-2 text-gray-900 dark:text-white font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span
                                className="inline-block w-3 h-3 rounded-full"
                                style={{ backgroundColor: layerColor }}
                                data-testid={`layer-color-${item.layerId}`}
                                title={`Layer: ${item.layerId}`}
                              />
                              {item.isInterLayer ? (
                                <Badge
                                  color="gray"
                                  size="xs"
                                  data-testid={`interlayer-badge-${item.id}`}
                                >
                                  Inter-Layer
                                </Badge>
                              ) : (
                                <Badge
                                  color="indigo"
                                  size="xs"
                                  data-testid={`intralayer-badge-${item.id}`}
                                >
                                  Intra-Layer
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RelationshipTable;
