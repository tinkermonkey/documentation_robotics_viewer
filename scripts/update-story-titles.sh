#!/bin/bash
set -e

echo "=== Phase 3: Updating Story Titles ==="

# Function to update title in a file
update_title() {
  local file="$1"
  local new_title="$2"
  
  # Use sed to replace the title line
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|title: ['\"].*['\"]|title: '$new_title'|" "$file"
  else
    sed -i "s|title: ['\"].*['\"]|title: '$new_title'|" "$file"
  fi
  
  echo "Updated: $file"
}

# 01 Primitives - Toolbars
update_title "src/catalog/stories/01-primitives/toolbars/GraphToolbar.stories.tsx" "01 Primitives / Toolbars / GraphToolbar"
update_title "src/catalog/stories/01-primitives/toolbars/ExportButtonGroup.stories.tsx" "01 Primitives / Toolbars / ExportButtonGroup"

# 01 Primitives - Data Viewers
update_title "src/catalog/stories/01-primitives/data-viewers/AttributesTable.stories.tsx" "01 Primitives / Data Viewers / AttributesTable"
update_title "src/catalog/stories/01-primitives/data-viewers/MetadataGrid.stories.tsx" "01 Primitives / Data Viewers / MetadataGrid"
update_title "src/catalog/stories/01-primitives/data-viewers/ChangesetList.stories.tsx" "01 Primitives / Data Viewers / ChangesetList"

# 01 Primitives - Navigation
update_title "src/catalog/stories/01-primitives/navigation/BreadcrumbNav.stories.tsx" "01 Primitives / Navigation / BreadcrumbNav"
update_title "src/catalog/stories/01-primitives/navigation/SubTabNavigation.stories.tsx" "01 Primitives / Navigation / SubTabNavigation"
update_title "src/catalog/stories/01-primitives/navigation/MotivationBreadcrumb.stories.tsx" "01 Primitives / Navigation / MotivationBreadcrumb"
update_title "src/catalog/stories/01-primitives/navigation/C4BreadcrumbNav.stories.tsx" "01 Primitives / Navigation / C4BreadcrumbNav"
update_title "src/catalog/stories/01-primitives/navigation/ViewToggle.stories.tsx" "01 Primitives / Navigation / ViewToggle"

# 01 Primitives - Indicators
update_title "src/catalog/stories/01-primitives/indicators/ConnectionStatus.stories.tsx" "01 Primitives / Indicators / ConnectionStatus"
update_title "src/catalog/stories/01-primitives/indicators/RelationshipBadge.stories.tsx" "01 Primitives / Indicators / RelationshipBadge"
update_title "src/catalog/stories/01-primitives/indicators/MiniMap.stories.tsx" "01 Primitives / Indicators / MiniMap"

# 01 Primitives - State Panels
update_title "src/catalog/stories/01-primitives/state-panels/EmptyState.stories.tsx" "01 Primitives / State Panels / EmptyState"
update_title "src/catalog/stories/01-primitives/state-panels/ErrorState.stories.tsx" "01 Primitives / State Panels / ErrorState"
update_title "src/catalog/stories/01-primitives/state-panels/LoadingState.stories.tsx" "01 Primitives / State Panels / LoadingState"
update_title "src/catalog/stories/01-primitives/state-panels/ErrorBoundary.stories.tsx" "01 Primitives / State Panels / ErrorBoundary"
update_title "src/catalog/stories/01-primitives/state-panels/RenderPropErrorBoundary.stories.tsx" "01 Primitives / State Panels / RenderPropErrorBoundary"
update_title "src/catalog/stories/01-primitives/state-panels/CoverageSummaryPanel.stories.tsx" "01 Primitives / State Panels / CoverageSummaryPanel"
update_title "src/catalog/stories/01-primitives/state-panels/GraphStatisticsPanel.stories.tsx" "01 Primitives / State Panels / GraphStatisticsPanel"
update_title "src/catalog/stories/01-primitives/state-panels/HighlightedPathPanel.stories.tsx" "01 Primitives / State Panels / HighlightedPathPanel"
update_title "src/catalog/stories/01-primitives/state-panels/OperationLegend.stories.tsx" "01 Primitives / State Panels / OperationLegend"
update_title "src/catalog/stories/01-primitives/state-panels/LayerTypesLegend.stories.tsx" "01 Primitives / State Panels / LayerTypesLegend"
update_title "src/catalog/stories/01-primitives/state-panels/ExpandableSection.stories.tsx" "01 Primitives / State Panels / ExpandableSection"
update_title "src/catalog/stories/01-primitives/state-panels/FilterPanel.stories.tsx" "01 Primitives / State Panels / FilterPanel"

# 01 Primitives - Panels & Sidebars
update_title "src/catalog/stories/01-primitives/panels-sidebars/BaseControlPanel.stories.tsx" "01 Primitives / Panels & Sidebars / BaseControlPanel"
update_title "src/catalog/stories/01-primitives/panels-sidebars/MotivationControlPanel.stories.tsx" "01 Primitives / Panels & Sidebars / MotivationControlPanel"
update_title "src/catalog/stories/01-primitives/panels-sidebars/C4ControlPanel.stories.tsx" "01 Primitives / Panels & Sidebars / C4ControlPanel"
update_title "src/catalog/stories/01-primitives/panels-sidebars/BusinessLayerControls.stories.tsx" "01 Primitives / Panels & Sidebars / BusinessLayerControls"
update_title "src/catalog/stories/01-primitives/panels-sidebars/MotivationFilterPanel.stories.tsx" "01 Primitives / Panels & Sidebars / MotivationFilterPanel"
update_title "src/catalog/stories/01-primitives/panels-sidebars/C4FilterPanel.stories.tsx" "01 Primitives / Panels & Sidebars / C4FilterPanel"
update_title "src/catalog/stories/01-primitives/panels-sidebars/LayoutPreferencesPanel.stories.tsx" "01 Primitives / Panels & Sidebars / LayoutPreferencesPanel"
update_title "src/catalog/stories/01-primitives/panels-sidebars/BaseInspectorPanel.stories.tsx" "01 Primitives / Panels & Sidebars / BaseInspectorPanel"
update_title "src/catalog/stories/01-primitives/panels-sidebars/MotivationInspectorPanel.stories.tsx" "01 Primitives / Panels & Sidebars / MotivationInspectorPanel"
update_title "src/catalog/stories/01-primitives/panels-sidebars/C4InspectorPanel.stories.tsx" "01 Primitives / Panels & Sidebars / C4InspectorPanel"
update_title "src/catalog/stories/01-primitives/panels-sidebars/ProcessInspectorPanel.stories.tsx" "01 Primitives / Panels & Sidebars / ProcessInspectorPanel"
update_title "src/catalog/stories/01-primitives/panels-sidebars/GraphViewSidebar.stories.tsx" "01 Primitives / Panels & Sidebars / GraphViewSidebar"
update_title "src/catalog/stories/01-primitives/panels-sidebars/ModelLayersSidebar.stories.tsx" "01 Primitives / Panels & Sidebars / ModelLayersSidebar"
update_title "src/catalog/stories/01-primitives/panels-sidebars/MotivationRightSidebar.stories.tsx" "01 Primitives / Panels & Sidebars / MotivationRightSidebar"
update_title "src/catalog/stories/01-primitives/panels-sidebars/C4RightSidebar.stories.tsx" "01 Primitives / Panels & Sidebars / C4RightSidebar"
update_title "src/catalog/stories/01-primitives/panels-sidebars/AnnotationPanel.stories.tsx" "01 Primitives / Panels & Sidebars / AnnotationPanel"
update_title "src/catalog/stories/01-primitives/panels-sidebars/ChangesetViewer.stories.tsx" "01 Primitives / Panels & Sidebars / ChangesetViewer"
update_title "src/catalog/stories/01-primitives/panels-sidebars/MotivationContextMenu.stories.tsx" "01 Primitives / Panels & Sidebars / MotivationContextMenu"

# 01 Primitives - Interactions
update_title "src/catalog/stories/01-primitives/interactions/SpaceMouseHandler.stories.tsx" "01 Primitives / Interactions / SpaceMouseHandler"

# 02 Details
update_title "src/catalog/stories/02-details/spec-details/SpecViewer.stories.tsx" "02 Details / Spec Details / SpecViewer"
update_title "src/catalog/stories/02-details/spec-details/SchemaInfoPanel.stories.tsx" "02 Details / Spec Details / SchemaInfoPanel"
update_title "src/catalog/stories/02-details/model-details/ModelJSONViewer.stories.tsx" "02 Details / Model Details / ModelJSONViewer"
update_title "src/catalog/stories/02-details/model-details/NodeDetailsPanel.stories.tsx" "02 Details / Model Details / NodeDetailsPanel"

# 03 Graphs - Nodes
update_title "src/catalog/stories/03-graphs/nodes/base/BaseFieldListNode.stories.tsx" "03 Graphs / Nodes / Base / BaseFieldListNode"
update_title "src/catalog/stories/03-graphs/nodes/base/JSONSchemaNode.stories.tsx" "03 Graphs / Nodes / Base / JSONSchemaNode"
update_title "src/catalog/stories/03-graphs/nodes/base/LayerContainerNode.stories.tsx" "03 Graphs / Nodes / Base / LayerContainerNode"
update_title "src/catalog/stories/03-graphs/nodes/motivation/GoalNode.stories.tsx" "03 Graphs / Nodes / Motivation / GoalNode"
update_title "src/catalog/stories/03-graphs/nodes/motivation/StakeholderNode.stories.tsx" "03 Graphs / Nodes / Motivation / StakeholderNode"
update_title "src/catalog/stories/03-graphs/nodes/motivation/ConstraintNode.stories.tsx" "03 Graphs / Nodes / Motivation / ConstraintNode"
update_title "src/catalog/stories/03-graphs/nodes/motivation/DriverNode.stories.tsx" "03 Graphs / Nodes / Motivation / DriverNode"
update_title "src/catalog/stories/03-graphs/nodes/motivation/OutcomeNode.stories.tsx" "03 Graphs / Nodes / Motivation / OutcomeNode"
update_title "src/catalog/stories/03-graphs/nodes/motivation/PrincipleNode.stories.tsx" "03 Graphs / Nodes / Motivation / PrincipleNode"
update_title "src/catalog/stories/03-graphs/nodes/motivation/AssumptionNode.stories.tsx" "03 Graphs / Nodes / Motivation / AssumptionNode"
update_title "src/catalog/stories/03-graphs/nodes/motivation/AssessmentNode.stories.tsx" "03 Graphs / Nodes / Motivation / AssessmentNode"
update_title "src/catalog/stories/03-graphs/nodes/motivation/ValueStreamNode.stories.tsx" "03 Graphs / Nodes / Motivation / ValueStreamNode"
update_title "src/catalog/stories/03-graphs/nodes/motivation/RequirementNode.stories.tsx" "03 Graphs / Nodes / Motivation / RequirementNode"
update_title "src/catalog/stories/03-graphs/nodes/business/BusinessFunctionNode.stories.tsx" "03 Graphs / Nodes / Business / BusinessFunctionNode"
update_title "src/catalog/stories/03-graphs/nodes/business/BusinessServiceNode.stories.tsx" "03 Graphs / Nodes / Business / BusinessServiceNode"
update_title "src/catalog/stories/03-graphs/nodes/business/BusinessCapabilityNode.stories.tsx" "03 Graphs / Nodes / Business / BusinessCapabilityNode"
update_title "src/catalog/stories/03-graphs/nodes/c4/ContainerNode.stories.tsx" "03 Graphs / Nodes / C4 / ContainerNode"
update_title "src/catalog/stories/03-graphs/nodes/c4/ComponentNode.stories.tsx" "03 Graphs / Nodes / C4 / ComponentNode"
update_title "src/catalog/stories/03-graphs/nodes/c4/ExternalActorNode.stories.tsx" "03 Graphs / Nodes / C4 / ExternalActorNode"

# 03 Graphs - Edges
update_title "src/catalog/stories/03-graphs/edges/base/ElbowEdge.stories.tsx" "03 Graphs / Edges / Base / ElbowEdge"
update_title "src/catalog/stories/03-graphs/edges/base/CrossLayerEdge.stories.tsx" "03 Graphs / Edges / Base / CrossLayerEdge"
update_title "src/catalog/stories/03-graphs/edges/motivation/InfluenceEdge.stories.tsx" "03 Graphs / Edges / Motivation / InfluenceEdge"
update_title "src/catalog/stories/03-graphs/edges/motivation/RefinesEdge.stories.tsx" "03 Graphs / Edges / Motivation / RefinesEdge"
update_title "src/catalog/stories/03-graphs/edges/motivation/RealizesEdge.stories.tsx" "03 Graphs / Edges / Motivation / RealizesEdge"
update_title "src/catalog/stories/03-graphs/edges/motivation/ConstrainsEdge.stories.tsx" "03 Graphs / Edges / Motivation / ConstrainsEdge"
update_title "src/catalog/stories/03-graphs/edges/motivation/ConflictsEdge.stories.tsx" "03 Graphs / Edges / Motivation / ConflictsEdge"

# 03 Graphs - Views
update_title "src/catalog/stories/03-graphs/views/GraphViewer.stories.tsx" "03 Graphs / Views / GraphViewer"
update_title "src/catalog/stories/03-graphs/views/MotivationGraphView.stories.tsx" "03 Graphs / Views / MotivationGraphView"
update_title "src/catalog/stories/03-graphs/views/C4GraphView.stories.tsx" "03 Graphs / Views / C4GraphView"
update_title "src/catalog/stories/03-graphs/views/ChangesetGraphView.stories.tsx" "03 Graphs / Views / ChangesetGraphView"
update_title "src/catalog/stories/03-graphs/views/SpecGraphView.stories.tsx" "03 Graphs / Views / SpecGraphView"
update_title "src/catalog/stories/03-graphs/views/BusinessLayerView.stories.tsx" "03 Graphs / Views / BusinessLayerView"

# 04 Chat
update_title "src/catalog/stories/04-chat/components/ChatComponents.stories.tsx" "04 Chat / Components / ChatComponents"
update_title "src/catalog/stories/04-chat/containers/ChatPanelContainer.stories.tsx" "04 Chat / Containers / ChatPanelContainer"
update_title "src/catalog/stories/04-chat/containers/FloatingChatPanel.stories.tsx" "04 Chat / Containers / FloatingChatPanel"

# 05 Compositions
update_title "src/catalog/stories/05-compositions/spec-compositions/SpecRouteComposition.stories.tsx" "05 Compositions / Spec Compositions / SpecRouteComposition"
update_title "src/catalog/stories/05-compositions/graph-compositions/ModelRouteComposition.stories.tsx" "05 Compositions / Graph Compositions / ModelRouteComposition"
update_title "src/catalog/stories/05-compositions/layouts/SharedLayout.stories.tsx" "05 Compositions / Layouts / SharedLayout"

echo "=== Story title updates complete! ==="
