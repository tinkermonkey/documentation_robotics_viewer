/**
 * Graph Filter Utilities
 *
 * Functions that derive FilterSection[] from live graph data.
 * Types/technologies not present in the graph (count = 0) are omitted,
 * making the filter UI self-pruning as the model evolves.
 */

import { FilterSection, FilterItem } from '../components/shared/FilterPanel';
import { MotivationGraph, MotivationElementType, MotivationRelationshipType } from '../types/motivationGraph';
import { C4Graph, ContainerType } from '../types/c4Graph';
import { CONTAINER_TYPE_ICONS } from './containerTypeIcons';

/**
 * Display labels for motivation element types
 */
const ELEMENT_TYPE_LABELS: Record<MotivationElementType, string> = {
  [MotivationElementType.Stakeholder]: 'Stakeholders',
  [MotivationElementType.Goal]: 'Goals',
  [MotivationElementType.Driver]: 'Drivers',
  [MotivationElementType.Outcome]: 'Outcomes',
  [MotivationElementType.Requirement]: 'Requirements',
  [MotivationElementType.Constraint]: 'Constraints',
  [MotivationElementType.Principle]: 'Principles',
  [MotivationElementType.Assessment]: 'Assessments',
  [MotivationElementType.Meaning]: 'Meanings',
  [MotivationElementType.Value]: 'Values',
  [MotivationElementType.Assumption]: 'Assumptions',
  [MotivationElementType.ValueStream]: 'Value Streams',
};

/**
 * Display labels for motivation relationship types
 */
const RELATIONSHIP_TYPE_LABELS: Record<MotivationRelationshipType, string> = {
  [MotivationRelationshipType.Influence]: 'Influences',
  [MotivationRelationshipType.Constrains]: 'Constrains',
  [MotivationRelationshipType.Realizes]: 'Realizes',
  [MotivationRelationshipType.Refines]: 'Refines',
  [MotivationRelationshipType.Conflicts]: 'Conflicts',
  [MotivationRelationshipType.Motivates]: 'Motivates',
  [MotivationRelationshipType.SupportsGoals]: 'Supports Goals',
  [MotivationRelationshipType.FulfillsRequirements]: 'Fulfills Requirements',
  [MotivationRelationshipType.ConstrainedBy]: 'Constrained By',
  [MotivationRelationshipType.HasInterest]: 'Has Interest',
  [MotivationRelationshipType.Custom]: 'Custom',
};

/**
 * Display labels for C4 container types
 */
const CONTAINER_TYPE_LABELS: Record<ContainerType, string> = {
  [ContainerType.WebApp]: 'Web Application',
  [ContainerType.MobileApp]: 'Mobile App',
  [ContainerType.DesktopApp]: 'Desktop App',
  [ContainerType.Api]: 'API',
  [ContainerType.Database]: 'Database',
  [ContainerType.MessageQueue]: 'Message Queue',
  [ContainerType.Cache]: 'Cache',
  [ContainerType.FileStorage]: 'File Storage',
  [ContainerType.Service]: 'Service',
  [ContainerType.Function]: 'Function',
  [ContainerType.Custom]: 'Custom',
};

/**
 * Convert a camelCase/PascalCase key to a human-readable label.
 * e.g. "WebApp" -> "Web App", "MessageQueue" -> "Message Queue"
 */
export function formatTypeLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * Derive FilterSection[] for motivation graph.
 * Only includes element/relationship types that have at least one node/edge in the graph.
 * Visible count reflects whether the type is currently selected.
 */
export function buildMotivationFilterSections(
  graph: MotivationGraph,
  selectedElementTypes: Set<MotivationElementType>,
  selectedRelationshipTypes: Set<MotivationRelationshipType>,
  onElementTypeChange: (type: MotivationElementType, selected: boolean) => void,
  onRelationshipTypeChange: (type: MotivationRelationshipType, selected: boolean) => void,
): FilterSection<string>[] {
  // Count element nodes by type - only include types present in graph
  const elementItems: FilterItem<string>[] = [];
  for (const elementType of Object.values(MotivationElementType)) {
    const total = Array.from(graph.nodes.values()).filter(
      (n) => n.element.type === elementType
    ).length;
    if (total === 0) continue;
    const visible = selectedElementTypes.has(elementType) ? total : 0;
    elementItems.push({
      value: elementType,
      label: ELEMENT_TYPE_LABELS[elementType] ?? formatTypeLabel(elementType),
      count: { visible, total },
    });
  }

  // Count edges by relationship type - only include types present in graph
  const relationshipItems: FilterItem<string>[] = [];
  for (const relType of Object.values(MotivationRelationshipType)) {
    const total = Array.from(graph.edges.values()).filter((e) => e.type === relType).length;
    if (total === 0) continue;
    const visible = selectedRelationshipTypes.has(relType) ? total : 0;
    relationshipItems.push({
      value: relType,
      label: RELATIONSHIP_TYPE_LABELS[relType] ?? formatTypeLabel(relType),
      count: { visible, total },
    });
  }

  const sections: FilterSection<string>[] = [];

  if (elementItems.length > 0) {
    sections.push({
      id: 'elements',
      title: 'Element Types',
      items: elementItems,
      selectedValues: selectedElementTypes as unknown as Set<string>,
      onToggle: (value, selected) => onElementTypeChange(value as MotivationElementType, selected),
    });
  }

  if (relationshipItems.length > 0) {
    sections.push({
      id: 'relationships',
      title: 'Relationship Types',
      items: relationshipItems,
      selectedValues: selectedRelationshipTypes as unknown as Set<string>,
      onToggle: (value, selected) => onRelationshipTypeChange(value as MotivationRelationshipType, selected),
    });
  }

  return sections;
}

/**
 * Derive FilterSection[] for C4 graph.
 * Uses pre-built indexes for O(1) lookup.
 * Only includes container types/technologies that have at least one node.
 */
export function buildC4FilterSections(
  graph: C4Graph,
  selectedContainerTypes: Set<ContainerType>,
  selectedTechnologies: Set<string>,
  onContainerTypeChange: (type: ContainerType, selected: boolean) => void,
  onTechnologyChange: (tech: string, selected: boolean) => void,
): FilterSection<string>[] {
  // Build container type items using pre-built index
  const containerItems: FilterItem<string>[] = [];
  for (const containerType of Object.values(ContainerType)) {
    const typeNodes = graph.indexes.byContainerType.get(containerType);
    const total = typeNodes?.size ?? 0;
    if (total === 0) continue;
    const visible = selectedContainerTypes.has(containerType) ? total : 0;
    containerItems.push({
      value: containerType,
      label: CONTAINER_TYPE_LABELS[containerType] ?? formatTypeLabel(containerType),
      icon: CONTAINER_TYPE_ICONS[containerType],
      count: { visible, total },
    });
  }

  // Build technology items using pre-built index
  const technologyItems: FilterItem<string>[] = [];
  for (const [tech, nodeIds] of graph.indexes.byTechnology) {
    const total = nodeIds?.size ?? 0;
    if (total === 0) continue;
    const visible = selectedTechnologies.has(tech) ? total : 0;
    technologyItems.push({
      value: tech,
      label: tech,
      count: { visible, total },
    });
  }

  const sections: FilterSection<string>[] = [];

  if (containerItems.length > 0) {
    sections.push({
      id: 'containerTypes',
      title: 'Container Types',
      items: containerItems,
      selectedValues: selectedContainerTypes as unknown as Set<string>,
      onToggle: (value, selected) => onContainerTypeChange(value as ContainerType, selected),
    });
  }

  if (technologyItems.length > 0) {
    sections.push({
      id: 'technologies',
      title: 'Technology Stack',
      items: technologyItems,
      selectedValues: selectedTechnologies,
      onToggle: onTechnologyChange,
    });
  }

  return sections;
}
