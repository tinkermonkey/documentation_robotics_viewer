---
description: Scaffold embedded route with SharedLayout, stores, WebSocket, and tests
argument-hint: "<RouteName> --path <path> [--left-sidebar <component>] [--right-sidebar <component>]"
---

# Embedded Route Scaffolder

Automates embedded route creation with SharedLayout pattern, store integration, WebSocket event handling, and Playwright test generation.

## Purpose

Creating an embedded route requires:
- SharedLayout with 3-column pattern (left sidebar, main content, right sidebar)
- Store integration (modelStore, annotationStore)
- WebSocket event subscriptions with cleanup
- ReactFlowProvider wrapper for graph views
- Playwright E2E tests with data-testid selectors
- Router registration in TanStack Router

This command scaffolds production-ready routes following the pattern in `ArchitectureRoute.tsx` and `MotivationRoute.tsx`.

## Usage

```bash
/embedded-route-scaffolder DependenciesRoute --path /dependencies --left-sidebar DependencyFilter
/embedded-route-scaffolder ImpactRoute --path /impact --left-sidebar ImpactSettings --right-sidebar ImpactReport
/embedded-route-scaffolder CoverageRoute --path /coverage
```

## Arguments

- `<RouteName>` (required): PascalCase route name ending in "Route" (e.g., DependenciesRoute, ImpactRoute)
- `--path <path>` (required): URL path starting with "/" (e.g., /dependencies, /impact-analysis)
- `--left-sidebar <component>` (optional): Name of left sidebar component (default: none, sidebar hidden)
- `--right-sidebar <component>` (optional): Name of right sidebar component (default: AnnotationPanel + SchemaInfoPanel)

## Workflow (5 Phases)

### Phase 1: Route Component Creation (25%)

Create the main route file at `src/apps/embedded/routes/{RouteName}.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { ReactFlowProvider } from '@xyflow/react';
import SharedLayout from '../components/SharedLayout';
import { useModelStore } from '../../../core/stores/modelStore';
import { useAnnotationStore } from '../stores/annotationStore';
import { embeddedDataLoader } from '../services/embeddedDataLoader';
import { websocketClient } from '../services/websocketClient';
{{#if leftSidebar}}
import {{leftSidebar}} from '../components/{{leftSidebar}}';
{{/if}}
{{#if customRightSidebar}}
import {{rightSidebar}} from '../components/{{rightSidebar}}';
{{/if}}
{{#unless customRightSidebar}}
import AnnotationPanel from '../components/AnnotationPanel';
import SchemaInfoPanel from '../components/SchemaInfoPanel';
{{/unless}}

export default function {{RouteName}}() {
  // Route params (for view switching: graph/json)
  const { view } = useParams({ strict: false });
  const activeView = view === 'json' ? 'json' : 'graph';

  // Store hooks
  const { model, loading, error, setModel, setLoading, setError } = useModelStore();
  const annotationStore = useAnnotationStore();

  // Local state
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  // Data loading function
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[{{RouteName}}] Loading data...');

      // Load model
      const modelData = await embeddedDataLoader.loadModel();
      setModel(modelData);

      // Load annotations
      const annotations = await embeddedDataLoader.loadAnnotations();
      annotationStore.setAnnotations(annotations);

      console.log('[{{RouteName}}] Data loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      console.error('[{{RouteName}}] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount + subscribe to WebSocket events
  useEffect(() => {
    loadData();

    // WebSocket event handlers
    const handleModelUpdated = async () => {
      console.log('[{{RouteName}}] Model updated event received');
      await loadData();
    };

    const handleAnnotationAdded = (annotation: any) => {
      console.log('[{{RouteName}}] Annotation added:', annotation.id);
      annotationStore.addAnnotation(annotation);
    };

    const handleAnnotationUpdated = (annotation: any) => {
      console.log('[{{RouteName}}] Annotation updated:', annotation.id);
      annotationStore.updateAnnotation(annotation.id, annotation);
    };

    const handleAnnotationDeleted = (data: { id: string }) => {
      console.log('[{{RouteName}}] Annotation deleted:', data.id);
      annotationStore.deleteAnnotation(data.id);
    };

    // Subscribe to events
    websocketClient.on('model.updated', handleModelUpdated);
    websocketClient.on('annotation.added', handleAnnotationAdded);
    websocketClient.on('annotation.updated', handleAnnotationUpdated);
    websocketClient.on('annotation.deleted', handleAnnotationDeleted);

    // Cleanup subscriptions on unmount
    return () => {
      websocketClient.off('model.updated', handleModelUpdated);
      websocketClient.off('annotation.added', handleAnnotationAdded);
      websocketClient.off('annotation.updated', handleAnnotationUpdated);
      websocketClient.off('annotation.deleted', handleAnnotationDeleted);
    };
  }, [setModel, setLoading, setError]);

  // Loading state
  if (loading && !model) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!model) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-gray-400 text-5xl mb-4">📊</div>
          <p className="text-gray-600 dark:text-gray-400">No model data available</p>
        </div>
      </div>
    );
  }

  // Main render with SharedLayout
  return (
    <SharedLayout
      showLeftSidebar={{{#if leftSidebar}}true{{else}}false{{/if}}}
      showRightSidebar={true}
      {{#if leftSidebar}}
      leftSidebarContent={<{{leftSidebar}} />}
      {{/if}}
      rightSidebarContent={
        <>
          {{#if customRightSidebar}}
          <{{rightSidebar}} />
          {{else}}
          <AnnotationPanel />
          <SchemaInfoPanel />
          {{/if}}
        </>
      }
    >
      <div className="flex flex-col h-full overflow-hidden" data-testid="{{route-name}}-main">
        <ReactFlowProvider>
          {activeView === 'graph' ? (
            <div className="flex-1 bg-gray-50 dark:bg-gray-900" data-testid="{{route-name}}-graph">
              {/* TODO: Add your graph view component here */}
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-600 dark:text-gray-400">
                  Graph view - implement with GraphViewer component
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white dark:bg-gray-800 overflow-auto" data-testid="{{route-name}}-json">
              {/* TODO: Add your JSON view component here */}
              <pre className="p-4 text-xs">
                {JSON.stringify(model, null, 2)}
              </pre>
            </div>
          )}
        </ReactFlowProvider>
      </div>
    </SharedLayout>
  );
}
```

### Phase 2: WebSocket Setup (15%)

The WebSocket event handlers are included in the component with:
- `model.updated` - Reload entire model
- `annotation.added` - Optimistic add to store
- `annotation.updated` - Optimistic update in store
- `annotation.deleted` - Optimistic remove from store

All handlers are cleaned up on unmount to prevent memory leaks.

### Phase 3: Store Integration (20%)

The route integrates with existing stores:
- **modelStore**: Global model data (loading, error, setModel)
- **annotationStore**: Annotations with optimistic updates

### Phase 4: Test Scaffolding (30%)

Generate Playwright E2E test at `tests/{{route-name}}.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('{{RouteName}}', () => {
  test.beforeEach(async ({ page }) => {
    // Load the application
    await page.goto('http://localhost:4000');
    await page.waitForLoadState('networkidle');

    // Wait for model to load
    await page.waitForSelector('[data-testid="model-loaded"]', { timeout: 10000 });
  });

  test('should navigate to {{routePath}} and display content', async ({ page }) => {
    // Navigate to route
    await page.goto('http://localhost:4000{{routePath}}');

    // Wait for main content
    await expect(page.locator('[data-testid="{{route-name}}-main"]')).toBeVisible();

    // Verify no error state
    await expect(page.locator('text=Error Loading Data')).not.toBeVisible();
  });

  test('should display graph view by default', async ({ page }) => {
    await page.goto('http://localhost:4000{{routePath}}');

    // Graph view should be visible
    await expect(page.locator('[data-testid="{{route-name}}-graph"]')).toBeVisible();

    // JSON view should not be visible
    await expect(page.locator('[data-testid="{{route-name}}-json"]')).not.toBeVisible();
  });

  test('should switch to JSON view', async ({ page }) => {
    await page.goto('http://localhost:4000{{routePath}}/json');

    // JSON view should be visible
    await expect(page.locator('[data-testid="{{route-name}}-json"]')).toBeVisible();

    // Graph view should not be visible
    await expect(page.locator('[data-testid="{{route-name}}-graph"]')).not.toBeVisible();
  });

  {{#if leftSidebar}}
  test('should display left sidebar', async ({ page }) => {
    await page.goto('http://localhost:4000{{routePath}}');

    // Left sidebar should be visible
    await expect(page.locator('[data-testid="left-sidebar"]')).toBeVisible();
  });
  {{/if}}

  test('should display right sidebar with annotations', async ({ page }) => {
    await page.goto('http://localhost:4000{{routePath}}');

    // Right sidebar should be visible
    await expect(page.locator('[data-testid="right-sidebar"]')).toBeVisible();
  });

  test('should handle model reload', async ({ page }) => {
    await page.goto('http://localhost:4000{{routePath}}');

    // Trigger reload (simulate WebSocket event)
    await page.evaluate(() => {
      (window as any).websocketClient?.emit('model.updated');
    });

    // Should show loading state briefly
    // Then return to normal state
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="{{route-name}}-main"]')).toBeVisible();
  });

  test('should display error state on load failure', async ({ page }) => {
    // Intercept API call to force error
    await page.route('**/api/model', (route) => {
      route.abort('failed');
    });

    await page.goto('http://localhost:4000{{routePath}}');

    // Should show error message
    await expect(page.locator('text=Error Loading Data')).toBeVisible();

    // Should have retry button
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });
});
```

### Phase 5: Router Registration (10%)

Update `src/apps/embedded/router.tsx`:

1. **Add import** (with other route imports):
```typescript
import {{RouteName}} from './routes/{{RouteName}}';
```

2. **Create route definition** (after other route definitions):
```typescript
const {{routeName}} = createRoute({
  getParentRoute: () => rootRoute,
  path: '{{routePath}}',
  component: {{RouteName}},
});

// Support view parameter (graph/json)
const {{routeName}}View = createRoute({
  getParentRoute: () => {{routeName}},
  path: '/$view',
});
```

3. **Add to routeTree** (in the addChildren array):
```typescript
const routeTree = rootRoute.addChildren([
  // ... existing routes
  {{routeName}}.addChildren([{{routeName}}View]),
]);
```

## Output Message

```
✅ Embedded route created successfully!

Files created:
  - src/apps/embedded/routes/{{RouteName}}.tsx
  - tests/{{route-name}}.spec.ts

Files modified:
  - src/apps/embedded/router.tsx

Route: {{routePath}}
Views: {{routePath}} (graph), {{routePath}}/json
{{#if leftSidebar}}Left sidebar: {{leftSidebar}}{{/if}}
Right sidebar: {{#if customRightSidebar}}{{rightSidebar}}{{else}}AnnotationPanel + SchemaInfoPanel{{/if}}

Next steps:
1. Create sidebar components if they don't exist:
   {{#if leftSidebar}}- src/apps/embedded/components/{{leftSidebar}}.tsx{{/if}}
   {{#if customRightSidebar}}- src/apps/embedded/components/{{rightSidebar}}.tsx{{/if}}

2. Implement graph view in the route component (replace TODO section)
3. Customize the JSON view if needed
4. Run the development server: npm run dev
5. Navigate to: http://localhost:4000{{routePath}}
6. Run tests: npx playwright test {{route-name}}
7. Add navigation link in the main menu/sidebar

Example graph view implementation:
  import GraphViewer from '../../../core/components/GraphViewer';

  <GraphViewer
    nodes={nodes}
    edges={edges}
    onNodeClick={(node) => setSelectedElement(node.id)}
  />
```

## Error Handling

**Invalid route name**:
```
❌ Error: Route name must be PascalCase and end with "Route"
Examples: DependenciesRoute, ImpactRoute
Provided: {{invalidName}}
```

**Invalid path**:
```
❌ Error: Path must start with "/" and use kebab-case
Examples: /dependencies, /impact-analysis
Provided: {{invalidPath}}
```

**Route already exists**:
```
❌ Error: Route file already exists: src/apps/embedded/routes/{{RouteName}}.tsx
Choose a different name or remove the existing route first.
```

**Path already registered**:
```
❌ Error: Path "{{routePath}}" is already registered in router.tsx
Choose a different path or remove the existing route first.
```

## Best Practices

1. **Route Naming**:
   - Always end with "Route": DependenciesRoute, ImpactRoute
   - Use descriptive names that match the feature
   - Path should match the route name in kebab-case

2. **Sidebar Components**:
   - Left sidebar: Filters, settings, layer selection
   - Right sidebar: Annotations, schema info, properties
   - Keep sidebars focused and reusable

3. **Loading & Error States**:
   - Always show loading spinner during initial load
   - Display clear error messages with retry button
   - Handle "no data" state separately

4. **WebSocket Integration**:
   - Subscribe in useEffect, unsubscribe in cleanup
   - Use optimistic updates for annotations
   - Reload model on major changes

5. **Testing**:
   - Use data-testid for stable selectors
   - Test navigation, view switching, error states
   - Test WebSocket event handling

6. **View Switching**:
   - Support /path (graph) and /path/json routes
   - Use ReactFlowProvider only for graph views
   - Keep JSON view simple (debugging tool)

## Example Interactions

### Example 1: Basic Route
```bash
User: /embedded-route-scaffolder DependenciesRoute --path /dependencies

Claude: Creating embedded route: DependenciesRoute
✅ Route created with default sidebars
```

### Example 2: Route with Custom Sidebars
```bash
User: /embedded-route-scaffolder ImpactRoute --path /impact-analysis --left-sidebar ImpactFilter --right-sidebar ImpactReport

Claude: Creating embedded route: ImpactRoute
Left sidebar: ImpactFilter
Right sidebar: ImpactReport
✅ Route created successfully
```

### Example 3: Route with Left Sidebar Only
```bash
User: /embedded-route-scaffolder CoverageRoute --path /coverage --left-sidebar CoverageSettings

Claude: Creating embedded route: CoverageRoute
Left sidebar: CoverageSettings
Right sidebar: AnnotationPanel + SchemaInfoPanel (default)
✅ Route created successfully
```

## Pattern Reference

This command follows patterns from:
- `src/apps/embedded/routes/ArchitectureRoute.tsx` - Full featured route
- `src/apps/embedded/routes/MotivationRoute.tsx` - With sidebars
- `src/apps/embedded/components/SharedLayout.tsx` - 3-column layout
- `tests/embedded-dual-view.spec.ts` - URL routing tests

## Notes

- All routes use SharedLayout for consistency
- WebSocket integration enables real-time updates
- data-testid attributes support E2E testing
- Loading/error/no-data states improve UX
- ReactFlowProvider enables graph interactions
- View parameter supports graph/json switching

## Related Commands

- Use `/react-flow-node-wizard` to create custom nodes for the graph
- Use `/store-pattern-generator` if route needs dedicated state
- Use `/export-service-builder` to add export functionality