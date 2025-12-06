import os
import re

def fix_unused_vars():
    # List of (file, line, variable, type)
    # type: 'var' (prefix with _), 'import' (remove from import list)
    tasks = [
        ('src/apps/embedded/components/C4BreadcrumbNav.tsx', 114, 'index', 'var'),
        ('src/apps/embedded/components/C4GraphView.tsx', 35, 'C4PathTracingState', 'import'),
        ('src/apps/embedded/components/C4InspectorPanel.tsx', 12, 'C4Node', 'import'),
        ('src/apps/embedded/components/ChangesetViewer.tsx', 15, 'changesByOperation', 'var'),
        ('src/apps/embedded/components/MotivationControlPanel.tsx', 12, 'LayoutAlgorithmType', 'import'),
        ('src/apps/embedded/components/refinement/RefinementFeedbackPanel.tsx', 11, 'HumanFeedback', 'import'),
        ('src/apps/embedded/services/c4ViewTransformer.ts', 44, 'ProtocolType', 'import'),
        ('src/apps/embedded/services/c4ViewTransformer.ts', 45, 'C4ScenarioPreset', 'import'),
        ('src/apps/embedded/services/c4ViewTransformer.ts', 1332, 'pairKey', 'var'),
        ('src/apps/embedded/services/changesetGraphBuilder.ts', 174, 'layerName', 'var'),
        ('src/apps/embedded/services/motivationExportService.ts', 9, 'getNodesBounds', 'import'),
        ('src/apps/embedded/services/motivationExportService.ts', 9, 'getViewportForBounds', 'import'),
        ('src/apps/embedded/services/motivationGraphBuilder.ts', 24, 'NodeMetrics', 'import'),
        ('src/apps/embedded/services/refinement/feedbackToParameterService.ts', 11, 'FeedbackDirection', 'import'),
        ('src/core/components/GraphViewer.tsx', 14, 'Node', 'import'),
        ('src/core/components/GraphViewer.tsx', 15, 'Edge', 'import'),
        ('src/core/edges/ElbowEdge.tsx', 25, 'labelBgStyle', 'var'),
        ('src/core/edges/pathfinding.ts', 124, 'isHorizontal', 'var'),
        ('src/core/edges/pathfinding.ts', 218, 'targetPos', 'var'),
        ('src/core/edges/pathfinding.ts', 266, 'radius', 'var'),
        ('src/core/edges/pathfinding.ts', 270, 'pPrev', 'var'),
        ('src/core/edges/pathfinding.ts', 272, 'pNext', 'var'),
        ('src/core/layout/business/MatrixBusinessLayout.ts', 142, 'gridSize', 'var'),
        ('src/core/layout/edgeBundling.ts', 221, 'edgeCount', 'var'),
        ('src/core/layout/motivationLayouts.ts', 6, 'MotivationGraphNode', 'import'),
        ('src/core/layout/semanticZoomController.ts', 157, 'zoomLevel', 'var'),
        ('src/core/layout/semanticZoomController.ts', 240, 'detailLevel', 'var'),
        ('src/core/services/comparison/qualityScoreService.ts', 26, 'compareWithSSIM', 'import'),
        ('src/core/services/githubService.ts', 2, 'ReleaseAsset', 'import'),
        ('src/core/services/jsonSchemaParser.ts', 235, 'fromDefinition', 'var'),
        ('src/core/services/jsonSchemaParser.ts', 537, 'propKey', 'var'),
    ]

    for file_path, line_num, var_name, task_type in tasks:
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            continue

        with open(file_path, 'r') as f:
            lines = f.readlines()

        # line_num is 1-based
        idx = line_num - 1
        if idx >= len(lines):
            print(f"Line {line_num} out of range in {file_path}")
            continue

        line = lines[idx]

        if task_type == 'var':
            # Replace 'var_name' with '_var_name'
            # Be careful with word boundaries
            pattern = r'\b' + re.escape(var_name) + r'\b'
            if re.search(pattern, line):
                lines[idx] = re.sub(pattern, '_' + var_name, line)
                print(f"Fixed var {var_name} in {file_path}:{line_num}")
            else:
                print(f"Var {var_name} not found in {file_path}:{line_num}: {line.strip()}")

        elif task_type == 'import':
            # Remove 'var_name' from import list
            # e.g. import { A, B, C } from ...
            # Remove B: import { A, C } from ...
            # Also handle trailing commas
            
            # Simple approach: replace "var_name," with "" or ", var_name" with ""
            # or just "var_name" with "" if it's the only one?
            
            # If it's on its own line (common in this codebase based on grep output)
            if var_name in line:
                # If it's the only thing on the line (besides whitespace and comma), remove the line
                if re.match(r'^\s*' + re.escape(var_name) + r',?\s*$', line):
                    lines[idx] = '' # Remove line
                else:
                    # Remove from line
                    line = line.replace(f'{var_name},', '')
                    line = line.replace(f', {var_name}', '')
                    line = line.replace(f'{var_name}', '')
                    lines[idx] = line
                print(f"Fixed import {var_name} in {file_path}:{line_num}")
            else:
                print(f"Import {var_name} not found in {file_path}:{line_num}: {line.strip()}")

        with open(file_path, 'w') as f:
            f.writelines(lines)

if __name__ == '__main__':
    fix_unused_vars()
