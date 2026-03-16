#!/bin/bash
set -e

echo "=== Fixing all story imports to use @/ absolute paths ==="

# Function to replace imports in a file
fix_file() {
  local file="$1"
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # Common components
    sed -i '' "s|from '\./AttributesTable'|from '@/apps/embedded/components/common/AttributesTable'|g" "$file"
    sed -i '' "s|from '\./MetadataGrid'|from '@/apps/embedded/components/common/MetadataGrid'|g" "$file"
    sed -i '' "s|from '\./ExpandableSection'|from '@/apps/embedded/components/common/ExpandableSection'|g" "$file"
    
    # Shared components
    sed -i '' "s|from '\./BreadcrumbNav'|from '@/apps/embedded/components/shared/BreadcrumbNav'|g" "$file"
    sed -i '' "s|from '\./ViewToggle'|from '@/apps/embedded/components/shared/ViewToggle'|g" "$file"
    sed -i '' "s|from '\./EmptyState'|from '@/apps/embedded/components/shared/EmptyState'|g" "$file"
    sed -i '' "s|from '\./ErrorState'|from '@/apps/embedded/components/shared/ErrorState'|g" "$file"
    sed -i '' "s|from '\./LoadingState'|from '@/apps/embedded/components/shared/LoadingState'|g" "$file"
    sed -i '' "s|from '\./FilterPanel'|from '@/apps/embedded/components/shared/FilterPanel'|g" "$file"
    sed -i '' "s|from '\./ExportButtonGroup'|from '@/apps/embedded/components/shared/ExportButtonGroup'|g" "$file"
    
    # Direct app components
    sed -i '' "s|from '\./ConnectionStatus'|from '@/apps/embedded/components/ConnectionStatus'|g" "$file"
    sed -i '' "s|from '\./MiniMap'|from '@/apps/embedded/components/MiniMap'|g" "$file"
    sed -i '' "s|from '\./ChangesetList'|from '@/apps/embedded/components/ChangesetList'|g" "$file"
    sed -i '' "s|from '\./GraphToolbar'|from '@/apps/embedded/components/GraphToolbar'|g" "$file"
    sed -i '' "s|from '\./MotivationBreadcrumb'|from '@/apps/embedded/components/MotivationBreadcrumb'|g" "$file"
    sed -i '' "s|from '\./C4BreadcrumbNav'|from '@/apps/embedded/components/C4BreadcrumbNav'|g" "$file"
    sed -i '' "s|from '\./SubTabNavigation'|from '@/apps/embedded/components/SubTabNavigation'|g" "$file"
    sed -i '' "s|from '\./ErrorBoundary'|from '@/apps/embedded/components/ErrorBoundary'|g" "$file"
    sed -i '' "s|from '\./CoverageSummaryPanel'|from '@/apps/embedded/components/CoverageSummaryPanel'|g" "$file"
    sed -i '' "s|from '\./GraphStatisticsPanel'|from '@/apps/embedded/components/GraphStatisticsPanel'|g" "$file"
    sed -i '' "s|from '\./HighlightedPathPanel'|from '@/apps/embedded/components/HighlightedPathPanel'|g" "$file"
    sed -i '' "s|from '\./OperationLegend'|from '@/apps/embedded/components/OperationLegend'|g" "$file"
    sed -i '' "s|from '\./LayerTypesLegend'|from '@/apps/embedded/components/LayerTypesLegend'|g" "$file"
    sed -i '' "s|from '\./MotivationControlPanel'|from '@/apps/embedded/components/MotivationControlPanel'|g" "$file"
    sed -i '' "s|from '\./C4ControlPanel'|from '@/apps/embedded/components/C4ControlPanel'|g" "$file"
    sed -i '' "s|from '\./MotivationFilterPanel'|from '@/apps/embedded/components/MotivationFilterPanel'|g" "$file"
    sed -i '' "s|from '\./C4FilterPanel'|from '@/apps/embedded/components/C4FilterPanel'|g" "$file"
    sed -i '' "s|from '\./LayoutPreferencesPanel'|from '@/apps/embedded/components/LayoutPreferencesPanel'|g" "$file"
    sed -i '' "s|from '\./MotivationInspectorPanel'|from '@/apps/embedded/components/MotivationInspectorPanel'|g" "$file"
    sed -i '' "s|from '\./C4InspectorPanel'|from '@/apps/embedded/components/C4InspectorPanel'|g" "$file"
    sed -i '' "s|from '\./ModelLayersSidebar'|from '@/apps/embedded/components/ModelLayersSidebar'|g" "$file"
    sed -i '' "s|from '\./MotivationRightSidebar'|from '@/apps/embedded/components/MotivationRightSidebar'|g" "$file"
    sed -i '' "s|from '\./C4RightSidebar'|from '@/apps/embedded/components/C4RightSidebar'|g" "$file"
    sed -i '' "s|from '\./AnnotationPanel'|from '@/apps/embedded/components/AnnotationPanel'|g" "$file"
    sed -i '' "s|from '\./ChangesetViewer'|from '@/apps/embedded/components/ChangesetViewer'|g" "$file"
    sed -i '' "s|from '\./MotivationContextMenu'|from '@/apps/embedded/components/MotivationContextMenu'|g" "$file"
    sed -i '' "s|from '\./SpecViewer'|from '@/apps/embedded/components/SpecViewer'|g" "$file"
    sed -i '' "s|from '\./SchemaInfoPanel'|from '@/apps/embedded/components/SchemaInfoPanel'|g" "$file"
    sed -i '' "s|from '\./ModelJSONViewer'|from '@/apps/embedded/components/ModelJSONViewer'|g" "$file"
    sed -i '' "s|from '\./NodeDetailsPanel'|from '@/apps/embedded/components/NodeDetailsPanel'|g" "$file"
    sed -i '' "s|from '\./MotivationGraphView'|from '@/apps/embedded/components/MotivationGraphView'|g" "$file"
    sed -i '' "s|from '\./C4GraphView'|from '@/apps/embedded/components/C4GraphView'|g" "$file"
    sed -i '' "s|from '\./ChangesetGraphView'|from '@/apps/embedded/components/ChangesetGraphView'|g" "$file"
    sed -i '' "s|from '\./SpecGraphView'|from '@/apps/embedded/components/SpecGraphView'|g" "$file"
    sed -i '' "s|from '\./ChatPanelContainer'|from '@/apps/embedded/components/ChatPanelContainer'|g" "$file"
    sed -i '' "s|from '\./FloatingChatPanel'|from '@/apps/embedded/components/FloatingChatPanel'|g" "$file"
    sed -i '' "s|from '\./SharedLayout'|from '@/apps/embedded/components/SharedLayout'|g" "$file"
    
    # Business layer
    sed -i '' "s|from '\./BusinessLayerView'|from '@/apps/embedded/components/businessLayer/BusinessLayerView'|g" "$file"
    sed -i '' "s|from '\./BusinessLayerControls'|from '@/apps/embedded/components/businessLayer/BusinessLayerControls'|g" "$file"
    sed -i '' "s|from '\./ProcessInspectorPanel'|from '@/apps/embedded/components/businessLayer/ProcessInspectorPanel'|g" "$file"
    
    # Chat components
    sed -i '' "s|from '\./ChatMessage'|from '@/apps/embedded/components/chat/ChatMessage'|g" "$file"
    sed -i '' "s|from '\./ChatTextContent'|from '@/apps/embedded/components/chat/ChatTextContent'|g" "$file"
    sed -i '' "s|from '\./ThinkingBlock'|from '@/apps/embedded/components/chat/ThinkingBlock'|g" "$file"
    sed -i '' "s|from '\./ToolInvocationCard'|from '@/apps/embedded/components/chat/ToolInvocationCard'|g" "$file"
    sed -i '' "s|from '\./UsageStatsBadge'|from '@/apps/embedded/components/chat/UsageStatsBadge'|g" "$file"
    sed -i '' "s|from '\./ChatInput'|from '@/apps/embedded/components/chat/ChatInput'|g" "$file"
    
    # Core base components
    sed -i '' "s|from '\./BaseControlPanel'|from '@/core/components/base/BaseControlPanel'|g" "$file"
    sed -i '' "s|from '\./BaseInspectorPanel'|from '@/core/components/base/BaseInspectorPanel'|g" "$file"
    sed -i '' "s|from '\./GraphViewSidebar'|from '@/core/components/base/GraphViewSidebar'|g" "$file"
    sed -i '' "s|from '\./RenderPropErrorBoundary'|from '@/core/components/base/RenderPropErrorBoundary'|g" "$file"
    
    # Core components
    sed -i '' "s|from '\./GraphViewer'|from '@/core/components/GraphViewer'|g" "$file"
    sed -i '' "s|from '\./SpaceMouseHandler'|from '@/core/components/SpaceMouseHandler'|g" "$file"
    
    # Core nodes
    sed -i '' "s|from '\./BaseFieldListNode'|from '@/core/nodes/BaseFieldListNode'|g" "$file"
    sed -i '' "s|from '\./JSONSchemaNode'|from '@/core/nodes/JSONSchemaNode'|g" "$file"
    sed -i '' "s|from '\./LayerContainerNode'|from '@/core/nodes/LayerContainerNode'|g" "$file"
    sed -i '' "s|from '\./GoalNode'|from '@/core/nodes/motivation/GoalNode'|g" "$file"
    sed -i '' "s|from '\./StakeholderNode'|from '@/core/nodes/motivation/StakeholderNode'|g" "$file"
    sed -i '' "s|from '\./ConstraintNode'|from '@/core/nodes/motivation/ConstraintNode'|g" "$file"
    sed -i '' "s|from '\./DriverNode'|from '@/core/nodes/motivation/DriverNode'|g" "$file"
    sed -i '' "s|from '\./OutcomeNode'|from '@/core/nodes/motivation/OutcomeNode'|g" "$file"
    sed -i '' "s|from '\./PrincipleNode'|from '@/core/nodes/motivation/PrincipleNode'|g" "$file"
    sed -i '' "s|from '\./AssumptionNode'|from '@/core/nodes/motivation/AssumptionNode'|g" "$file"
    sed -i '' "s|from '\./AssessmentNode'|from '@/core/nodes/motivation/AssessmentNode'|g" "$file"
    sed -i '' "s|from '\./ValueStreamNode'|from '@/core/nodes/motivation/ValueStreamNode'|g" "$file"
    sed -i '' "s|from '\./RequirementNode'|from '@/core/nodes/motivation/RequirementNode'|g" "$file"
    sed -i '' "s|from '\./RelationshipBadge'|from '@/core/nodes/motivation/RelationshipBadge'|g" "$file"
    sed -i '' "s|from '\./BusinessFunctionNode'|from '@/core/nodes/business/BusinessFunctionNode'|g" "$file"
    sed -i '' "s|from '\./BusinessServiceNode'|from '@/core/nodes/business/BusinessServiceNode'|g" "$file"
    sed -i '' "s|from '\./BusinessCapabilityNode'|from '@/core/nodes/business/BusinessCapabilityNode'|g" "$file"
    sed -i '' "s|from '\./ContainerNode'|from '@/core/nodes/c4/ContainerNode'|g" "$file"
    sed -i '' "s|from '\./ComponentNode'|from '@/core/nodes/c4/ComponentNode'|g" "$file"
    sed -i '' "s|from '\./ExternalActorNode'|from '@/core/nodes/c4/ExternalActorNode'|g" "$file"
    
    # Core edges
    sed -i '' "s|from '\./ElbowEdge'|from '@/core/edges/ElbowEdge'|g" "$file"
    sed -i '' "s|from '\./CrossLayerEdge'|from '@/core/edges/CrossLayerEdge'|g" "$file"
    sed -i '' "s|from '\./InfluenceEdge'|from '@/core/edges/motivation/InfluenceEdge'|g" "$file"
    sed -i '' "s|from '\./RefinesEdge'|from '@/core/edges/motivation/RefinesEdge'|g" "$file"
    sed -i '' "s|from '\./RealizesEdge'|from '@/core/edges/motivation/RealizesEdge'|g" "$file"
    sed -i '' "s|from '\./ConstrainsEdge'|from '@/core/edges/motivation/ConstrainsEdge'|g" "$file"
    sed -i '' "s|from '\./ConflictsEdge'|from '@/core/edges/motivation/ConflictsEdge'|g" "$file"
    
    # Catalog components
    sed -i '' "s|from '\./SpecRouteComposition'|from '@/catalog/components/SpecRouteComposition'|g" "$file"
    sed -i '' "s|from '\./ModelRouteComposition'|from '@/catalog/components/ModelRouteComposition'|g" "$file"
    sed -i '' "s|from '\./ChatComponents'|from '@/catalog/components/chat/ChatComponents'|g" "$file"
  fi
}

# Fix all story files
find src/catalog/stories -name "*.stories.tsx" -type f | while read file; do
  fix_file "$file"
  echo "Fixed: $file"
done

echo "=== Import fixes complete! ==="
