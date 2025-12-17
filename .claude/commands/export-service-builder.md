---
description: Scaffold export service for PNG/SVG/JSON/custom reports
argument-hint: "<serviceName> [--formats png,svg,json] [--custom-report]"
---

# Export Service Builder

Automates export service creation for React Flow graphs with PNG/SVG/JSON exports and custom report generation.

## Purpose

Export services provide users with multiple ways to extract and share data:
- **PNG/SVG** - Visual exports of React Flow graphs using `html-to-image`
- **JSON** - Raw graph data for reimport or external processing
- **Custom Reports** - Domain-specific analysis (traceability, coverage, impact, etc.)

This command scaffolds production-ready export services following patterns in `motivationExportService.ts` and `c4ExportService.ts`.

## Usage

```bash
/export-service-builder dependencyExportService --formats png,svg,json --custom-report
/export-service-builder impactExportService --formats png,json --custom-report
/export-service-builder coverageExportService --formats svg,json
```

## Arguments

- `<serviceName>` (required): camelCase service name ending in "ExportService" (e.g., dependencyExportService)
- `--formats <formats>` (optional): Comma-separated list of export formats: png, svg, json (default: png,svg,json)
- `--custom-report` (optional): Generate custom report generation function with domain-specific analysis

## Workflow (5 Phases)

### Phase 1: Base Functions - PNG/SVG (25%)

Create the export service file at `src/apps/embedded/services/{{serviceName}}.ts`:

```typescript
import { Node, Edge } from '@xyflow/react';
{{#if hasPNG}}
import { toPng } from 'html-to-image';
{{/if}}
{{#if hasSVG}}
import { toSvg } from 'html-to-image';
{{/if}}

/**
 * {{ServiceName}} - Export functionality for {{domain}} visualization
 *
 * Provides multiple export formats:
 {{#if hasPNG}}- PNG: High-resolution image export{{/if}}
 {{#if hasSVG}}- SVG: Scalable vector graphics export{{/if}}
 {{#if hasJSON}}- JSON: Raw graph data export{{/if}}
 {{#if hasCustomReport}}- Custom Report: {{Domain}}-specific analysis{{/if}}
 */

{{#if hasPNG}}
/**
 * Export current viewport as PNG image
 * Uses html-to-image library with pixelRatio 2 for high resolution
 *
 * @param reactFlowContainer - The container element holding the React Flow graph
 * @param filename - Output filename (default: '{{service}}-export.png')
 */
export async function exportAsPNG(
  reactFlowContainer: HTMLElement,
  filename: string = '{{service}}-export.png'
): Promise<void> {
  try {
    console.log('[{{ServiceName}}] Exporting as PNG:', filename);

    if (!reactFlowContainer) {
      throw new Error('Graph container element not available');
    }

    // Find the React Flow wrapper element
    const reactFlowWrapper = reactFlowContainer.querySelector('.react-flow') as HTMLElement;
    if (!reactFlowWrapper) {
      throw new Error('Unable to locate React Flow canvas');
    }

    // Generate PNG with high quality settings
    const dataUrl = await toPng(reactFlowWrapper, {
      backgroundColor: '#ffffff',
      quality: 1.0,
      pixelRatio: 2, // High resolution for clarity
      filter: (node) => {
        // Exclude UI controls from export
        if (node instanceof HTMLElement) {
          return (
            !node.classList.contains('react-flow__controls') &&
            !node.classList.contains('react-flow__minimap') &&
            !node.classList.contains('react-flow__panel') &&
            !node.classList.contains('react-flow__attribution')
          );
        }
        return true;
      },
    });

    // Trigger browser download
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();

    console.log('[{{ServiceName}}] PNG export successful');
  } catch (error) {
    console.error('[{{ServiceName}}] PNG export failed:', error);
    throw new Error(
      `Unable to export PNG: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
{{/if}}

{{#if hasSVG}}
/**
 * Export current viewport as SVG image
 * Produces scalable vector graphics for crisp rendering at any size
 *
 * @param reactFlowContainer - The container element holding the React Flow graph
 * @param filename - Output filename (default: '{{service}}-export.svg')
 */
export async function exportAsSVG(
  reactFlowContainer: HTMLElement,
  filename: string = '{{service}}-export.svg'
): Promise<void> {
  try {
    console.log('[{{ServiceName}}] Exporting as SVG:', filename);

    if (!reactFlowContainer) {
      throw new Error('Graph container element not available');
    }

    const reactFlowWrapper = reactFlowContainer.querySelector('.react-flow') as HTMLElement;
    if (!reactFlowWrapper) {
      throw new Error('Unable to locate React Flow canvas');
    }

    // Generate SVG
    const dataUrl = await toSvg(reactFlowWrapper, {
      backgroundColor: '#ffffff',
      filter: (node) => {
        if (node instanceof HTMLElement) {
          return (
            !node.classList.contains('react-flow__controls') &&
            !node.classList.contains('react-flow__minimap') &&
            !node.classList.contains('react-flow__panel') &&
            !node.classList.contains('react-flow__attribution')
          );
        }
        return true;
      },
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();

    console.log('[{{ServiceName}}] SVG export successful');
  } catch (error) {
    console.error('[{{ServiceName}}] SVG export failed:', error);
    throw new Error(
      `Unable to export SVG: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
{{/if}}
```

### Phase 2: JSON Export (20%)

Add JSON export functionality:

```typescript
{{#if hasJSON}}
/**
 * Export graph data as JSON
 * Includes nodes, edges, and metadata for reimport or external analysis
 *
 * @param nodes - React Flow nodes array
 * @param edges - React Flow edges array
 * @param metadata - Optional additional metadata
 * @param filename - Output filename (default: '{{service}}-data.json')
 */
export function exportGraphDataAsJSON(
  nodes: Node[],
  edges: Edge[],
  metadata?: Record<string, any>,
  filename: string = '{{service}}-data.json'
): void {
  try {
    console.log('[{{ServiceName}}] Exporting graph data as JSON:', filename);

    const exportData = {
      version: '0.1.0',
      exportTimestamp: new Date().toISOString(),
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        ...metadata,
      },
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
        width: node.width,
        height: node.height,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type,
        label: edge.label,
        animated: edge.animated,
      })),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();

    // Clean up
    URL.revokeObjectURL(url);

    console.log('[{{ServiceName}}] Graph data export successful');
  } catch (error) {
    console.error('[{{ServiceName}}] Graph data export failed:', error);
    throw new Error(
      `Unable to export graph data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
{{/if}}
```

### Phase 3: Custom Report Generation (30%)

Generate custom report function if `--custom-report` is specified:

```typescript
{{#if hasCustomReport}}
/**
 * Report interfaces - customize based on domain
 */
export interface {{Domain}}Report {
  modelVersion: string;
  exportTimestamp: string;
  summary: ReportSummary;
  elements: {{Domain}}ElementReport[];
  relationships: {{Domain}}RelationshipReport[];
  analysis: {{Domain}}Analysis;
}

export interface ReportSummary {
  totalElements: number;
  totalRelationships: number;
  // Add domain-specific summary metrics
}

export interface {{Domain}}ElementReport {
  id: string;
  name: string;
  type: string;
  // Add domain-specific element properties
}

export interface {{Domain}}RelationshipReport {
  id: string;
  source: string;
  target: string;
  type: string;
  // Add domain-specific relationship properties
}

export interface {{Domain}}Analysis {
  // Add domain-specific analysis results
  // Examples: coverage percentage, impact scores, traceability matrix
}

/**
 * Generate and export custom {{domain}} report
 * Performs domain-specific analysis and generates structured report
 *
 * @param nodes - React Flow nodes array
 * @param edges - React Flow edges array
 * @param filename - Output filename (default: '{{service}}-report.json')
 */
export function export{{Domain}}Report(
  nodes: Node[],
  edges: Edge[],
  filename: string = '{{service}}-report.json'
): void {
  try {
    console.log('[{{ServiceName}}] Generating {{domain}} report');

    // PHASE 1: Extract elements
    const elements: {{Domain}}ElementReport[] = nodes.map((node) => ({
      id: node.id,
      name: node.data.label || node.id,
      type: node.type || 'unknown',
      // TODO: Extract domain-specific properties from node.data
    }));

    // PHASE 2: Extract relationships
    const relationships: {{Domain}}RelationshipReport[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'connection',
      // TODO: Extract domain-specific relationship properties
    }));

    // PHASE 3: Perform analysis
    const analysis: {{Domain}}Analysis = {
      // TODO: Add domain-specific analysis
      // Examples:
      // - Coverage calculation
      // - Impact assessment
      // - Traceability validation
      // - Complexity metrics
    };

    // PHASE 4: Generate summary statistics
    const summary: ReportSummary = {
      totalElements: elements.length,
      totalRelationships: relationships.length,
      // TODO: Add calculated metrics
    };

    // PHASE 5: Build report
    const report: {{Domain}}Report = {
      modelVersion: '0.1.0',
      exportTimestamp: new Date().toISOString(),
      summary,
      elements,
      relationships,
      analysis,
    };

    console.log('[{{ServiceName}}] Report generated:', {
      elements: elements.length,
      relationships: relationships.length,
    });

    // Export as JSON
    const jsonString = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);

    console.log('[{{ServiceName}}] Report exported successfully');
  } catch (error) {
    console.error('[{{ServiceName}}] Report export failed:', error);
    throw new Error(
      `Unable to export report: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
{{/if}}
```

### Phase 4: Type Definitions (15%)

Add comprehensive TypeScript types at the top of the file:

```typescript
/**
 * Export format options
 */
export type ExportFormat = {{#each formats}}'{{this}}'{{#unless @last}} | {{/unless}}{{/each}};

/**
 * Export options for customizing export behavior
 */
export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeMetadata?: boolean;
  backgroundColor?: string;
  quality?: number;
}

/**
 * Export result with status and metadata
 */
export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  filename: string;
  timestamp: string;
  error?: string;
}
```

### Phase 5: Integration Helper (10%)

Add a unified export function for easy integration:

```typescript
/**
 * Unified export function - handles all export formats
 * Simplifies integration in UI components
 *
 * @param format - Export format ({{formatList}})
 * @param options - Export options specific to format
 * @returns Promise resolving to export result
 */
export async function exportGraph(
  format: ExportFormat,
  options: {
    container?: HTMLElement;
    nodes?: Node[];
    edges?: Edge[];
    metadata?: Record<string, any>;
    filename?: string;
  }
): Promise<ExportResult> {
  const timestamp = new Date().toISOString();

  try {
    switch (format) {
      {{#if hasPNG}}
      case 'png':
        if (!options.container) {
          throw new Error('Container element required for PNG export');
        }
        await exportAsPNG(options.container, options.filename);
        return {
          success: true,
          format: 'png',
          filename: options.filename || '{{service}}-export.png',
          timestamp,
        };
      {{/if}}

      {{#if hasSVG}}
      case 'svg':
        if (!options.container) {
          throw new Error('Container element required for SVG export');
        }
        await exportAsSVG(options.container, options.filename);
        return {
          success: true,
          format: 'svg',
          filename: options.filename || '{{service}}-export.svg',
          timestamp,
        };
      {{/if}}

      {{#if hasJSON}}
      case 'json':
        if (!options.nodes || !options.edges) {
          throw new Error('Nodes and edges required for JSON export');
        }
        exportGraphDataAsJSON(
          options.nodes,
          options.edges,
          options.metadata,
          options.filename
        );
        return {
          success: true,
          format: 'json',
          filename: options.filename || '{{service}}-data.json',
          timestamp,
        };
      {{/if}}

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    console.error('[{{ServiceName}}] Export failed:', error);
    return {
      success: false,
      format,
      filename: options.filename || 'export',
      timestamp,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

## Output Message

```
✅ Export service created successfully!

File created:
  - src/apps/embedded/services/{{serviceName}}.ts

Formats supported: {{formatList}}
{{#if hasCustomReport}}Custom report: ✅ Enabled{{else}}Custom report: ❌ Not included{{/if}}

Functions generated:
{{#if hasPNG}}  - exportAsPNG(container, filename){{/if}}
{{#if hasSVG}}  - exportAsSVG(container, filename){{/if}}
{{#if hasJSON}}  - exportGraphDataAsJSON(nodes, edges, metadata, filename){{/if}}
{{#if hasCustomReport}}  - export{{Domain}}Report(nodes, edges, filename){{/if}}
  - exportGraph(format, options) - Unified export function

Next steps:
1. Review and customize report interfaces if using --custom-report
2. Implement domain-specific analysis in export{{Domain}}Report()
3. Add export buttons to your route component:

   import { exportAsPNG, exportAsSVG, exportGraphDataAsJSON } from '@/services/{{serviceName}}';

   <button onClick={() => exportAsPNG(containerRef.current)}>
     Export as PNG
   </button>

4. Test exports with actual graph data
5. Consider adding export options UI (filename, format selection)
6. Run: npm run typecheck
```

## Error Handling

**Invalid service name**:
```
❌ Error: Service name must be camelCase and end with "ExportService"
Examples: dependencyExportService, impactExportService
Provided: {{invalidName}}
```

**Service already exists**:
```
❌ Error: Service file already exists: src/apps/embedded/services/{{serviceName}}.ts
Choose a different name or remove the existing service first.
```

**Invalid format**:
```
❌ Error: Invalid export format specified
Supported formats: png, svg, json
Provided: {{invalidFormat}}
```

**No formats specified**:
```
❌ Error: At least one export format must be specified
Use: --formats png,svg,json
```

## Best Practices

1. **Export Quality**:
   - PNG: Use pixelRatio: 2 for high-resolution exports
   - SVG: Ideal for presentations and documentation
   - JSON: Include version and timestamp for tracking

2. **UI Filtering**:
   - Always filter out React Flow controls (minimap, controls, attribution)
   - Test exports with different zoom levels
   - Consider adding white/transparent background options

3. **Error Handling**:
   - Check container exists before export
   - Provide clear error messages to users
   - Log export attempts for debugging

4. **Custom Reports**:
   - Structure data for easy consumption (JSON format)
   - Include summary statistics at top
   - Add timestamps for versioning
   - Document report schema

5. **Performance**:
   - PNG/SVG export can be slow for large graphs
   - Consider showing loading indicator during export
   - Use try/catch to handle html-to-image failures

6. **Integration**:
   - Use the unified `exportGraph()` function in UI
   - Store containerRef in component for easy access
   - Add keyboard shortcuts (Ctrl+E for export menu)

## Example Interactions

### Example 1: Full Export Service
```bash
User: /export-service-builder dependencyExportService --formats png,svg,json --custom-report

Claude: Creating export service: dependencyExportService
Formats: PNG, SVG, JSON
Custom report: Enabled
✅ Export service created with all functions
```

### Example 2: Image-Only Export
```bash
User: /export-service-builder visualExportService --formats png,svg

Claude: Creating export service: visualExportService
Formats: PNG, SVG
✅ Export service created for visual exports
```

### Example 3: Data-Only Export
```bash
User: /export-service-builder dataExportService --formats json --custom-report

Claude: Creating export service: dataExportService
Formats: JSON
Custom report: Enabled
✅ Export service created for data exports
```

## Usage Example

Integrate in a route component:

```typescript
import { useRef } from 'react';
import { exportAsPNG, exportAsSVG, exportGraphDataAsJSON } from '@/services/dependencyExportService';

export default function DependencyRoute() {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExportPNG = async () => {
    if (containerRef.current) {
      await exportAsPNG(containerRef.current, 'dependencies.png');
    }
  };

  const handleExportJSON = () => {
    exportGraphDataAsJSON(nodes, edges, { layer: 'dependency' }, 'dependencies.json');
  };

  return (
    <div>
      <div className="export-buttons">
        <button onClick={handleExportPNG}>Export PNG</button>
        <button onClick={handleExportJSON}>Export JSON</button>
      </div>
      <div ref={containerRef}>
        <ReactFlowProvider>
          <GraphViewer nodes={nodes} edges={edges} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
```

## Pattern Reference

This command follows patterns from:
- `src/apps/embedded/services/motivationExportService.ts` - Complete export service
- `src/apps/embedded/services/c4ExportService.ts` - Custom report generation
- `src/core/services/businessLayerExportService.ts` - Domain-specific analysis

## Notes

- Uses html-to-image library (already in dependencies)
- PNG exports use pixelRatio: 2 for clarity
- SVG exports are resolution-independent
- JSON exports include metadata for tracking
- Custom reports enable domain-specific analysis
- All functions have TypeScript strict typing
- Logging with service name prefix for debugging

## Related Commands

- Use `/embedded-route-scaffolder` to create routes that use exports
- Use `/react-flow-node-wizard` to create exportable node types
- Consider adding export UI components with Flowbite