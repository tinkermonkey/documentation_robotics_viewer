# Troubleshooting & Common Issues Guide

Quick reference for diagnosing and resolving common issues in the Documentation Robotics Viewer.

## Quick Problem Finder

**Using this guide**: Find your issue in the left column, follow the solution steps.

### Search by Symptom

- [Graph doesn't render](#graph-doesnt-render)
- [Model won't load](#model-wont-load)
- [Components aren't displaying correctly](#components-arent-displaying-correctly)
- [Tests are failing](#tests-are-failing)
- [Performance is slow](#performance-is-slow)
- [Real-time features not working](#real-time-features-not-working)
- [Export not working](#export-not-working)

---

## Graph doesn't render

### Symptom
Graph container appears empty or shows error message

### Root Causes & Solutions

#### **Cause 1: Model not loaded**
**Indicators**:
- Graph area is blank
- No error message
- Console shows "model is null"

**Solution**:
1. Check if file was successfully loaded
   ```bash
   # Open browser DevTools → Console
   # Should see model data if loaded
   ```
2. Try uploading model file again
3. Check file format:
   - YAML instance: `business.service.name` format (dot-notation)
   - JSON Schema: Explicit UUIDs and types
   - Manifest: Directory structure with layer files

**Related**: [Model won't load](#model-wont-load)

---

#### **Cause 2: Node type not mapped**
**Indicators**:
- Some elements missing from graph
- Console error: `Unknown node type "xyz"`
- Graph has fewer nodes than expected

**Solution**:
1. Check `src/core/services/nodeTransformer.ts`:
   ```typescript
   // In getNodeTypeForElement() method
   case 'myElementType':
     return 'myNodeType';  // Must return registered node type
   ```

2. Verify node is registered in `src/core/nodes/index.ts`:
   ```typescript
   import { MyNode } from './category/MyNode';

   export const nodeTypes = {
     myNodeType: MyNode,  // Must be registered
   };
   ```

3. Add missing mapping if needed:
   - Map element type → node type in transformer
   - Register node type in index.ts
   - Create node component if doesn't exist

**Related**: [Components aren't displaying correctly](#components-arent-displaying-correctly)

---

#### **Cause 3: Dimension mismatch**
**Indicators**:
- Nodes render but overlap or extend beyond boundaries
- Layout looks broken
- Nodes appear incorrect size

**Solution**:
1. Check node component dimensions match export:
   ```typescript
   // In BusinessServiceNode.tsx
   <div style={{ width: 180, height: 100 }}>  // ← Exact size

   // Export must match
   export const BusinessServiceNodeDimensions = { width: 180, height: 100 };
   ```

2. Check transformer precalculates same dimensions:
   ```typescript
   // In nodeTransformer.ts precalculateDimensions()
   case 'businessServiceNode':
     element.visual.size = nodeDimensions.businessServiceNode;  // Must be 180x100
   ```

3. Verify CSS doesn't override dimensions:
   ```typescript
   // ✅ Correct - explicit size
   style={{ width: 180, height: 100 }}

   // ❌ Wrong - no size specified
   className="w-44 h-24"  // Might not be 180x100
   ```

---

#### **Cause 4: React Flow initialization failed**
**Indicators**:
- Pan/zoom controls don't work
- Click events ignored
- Console error from React Flow

**Solution**:
1. Verify React Flow provider wraps GraphViewer:
   ```typescript
   // ✅ Correct
   <ReactFlowProvider>
     <GraphViewer nodes={nodes} edges={edges} />
   </ReactFlowProvider>

   // ❌ Wrong - missing provider
   <GraphViewer nodes={nodes} edges={edges} />
   ```

2. Check node and edge arrays are not empty:
   ```typescript
   console.log('Nodes:', nodes.length);  // Should be > 0
   console.log('Edges:', edges.length);  // Can be 0, but nodes shouldn't
   ```

3. Verify node IDs are unique:
   ```typescript
   const ids = new Set(nodes.map(n => n.id));
   if (ids.size !== nodes.length) {
     console.error('Duplicate node IDs detected');
   }
   ```

---

### Debugging Steps

```typescript
// Add to component for debugging
console.log('Model:', model);
console.log('Nodes:', nodes.length);
console.log('Edges:', edges.length);
console.log('First node:', nodes[0]);
console.log('Graph bounds:', {
  x: Math.min(...nodes.map(n => n.position.x)),
  y: Math.min(...nodes.map(n => n.position.y))
});
```

---

## Model won't load

### Symptom
File upload fails or parsing error shown

### Root Causes & Solutions

#### **Cause 1: Invalid YAML/JSON syntax**
**Error Message**:
```
ParseError: Unexpected token } in JSON at position 145
```

**Solution**:
1. Validate file syntax:
   - Use JSON validator: https://jsonlint.com/
   - Use YAML validator: https://www.yamllint.com/

2. Common YAML mistakes:
   ```yaml
   # ❌ Wrong - tab character
   business:
   	service:  # Tab here breaks YAML
     name: Test

   # ✅ Correct - spaces
   business:
     service:  # 2 or 4 spaces
       name: Test
   ```

3. Common JSON mistakes:
   ```json
   {
     "elements": [
       { "id": "1", "name": "Test" },  // ✅ No comma after last item
       { "id": "2", "name": "Test2" }
     ]
   }

   // ❌ Wrong - trailing comma
   {
     "elements": [ { } ,]
   }
   ```

4. Escape special characters:
   ```json
   {
     "description": "Test's value"  // ❌ Quote needs escaping
   }

   {
     "description": "Test\u0027s value"  // ✅ Use unicode escape
     // OR
     "description": "Test's value"  // ✅ Use double quotes around value
   }
   ```

**Related**: See [ERROR_HANDLING_GUIDE.md - ParseError](#parseerror)

---

#### **Cause 2: Model validation failed**
**Error Message**:
```
ValidationError: Element "service-1" has unknown type "service_v2"
Valid types: ["service", "process", "function", "capability"]
```

**Solution**:
1. Check element types are valid:
   ```yaml
   business:
     service:  # ✅ Valid type
       name: PaymentService

     service_v2:  # ❌ Invalid type
       name: OldService
   ```

2. Check required fields exist:
   ```yaml
   # ✅ Complete
   business:
     service:
       name: TestService
       description: Test
       properties: {}

   # ❌ Missing name
   business:
     service:
       description: Test
   ```

3. Validate against spec:
   ```bash
   # Check YAML_MODELS.md for valid schema
   # Ensure all required fields present
   # Check type names exactly (case-sensitive)
   ```

**Related**: See `documentation/YAML_MODELS.md` for schema

---

#### **Cause 3: File encoding issue**
**Error Message**:
```
ParseError: Invalid character in input
```

**Solution**:
1. Ensure file is UTF-8 encoded:
   ```bash
   # Linux/Mac - Check encoding
   file model.yaml
   # Should output: UTF-8 Unicode text

   # Convert to UTF-8 if needed
   iconv -f ISO-8859-1 -t UTF-8 model.yaml > model-utf8.yaml
   ```

2. Remove BOM (Byte Order Mark) if present:
   ```bash
   # Check for BOM
   hexdump -C model.yaml | head
   # Should NOT start with: ef bb bf

   # Remove BOM
   sed '1s/^\xef\xbb\xbf//' model.yaml > model-nobom.yaml
   ```

3. Check for invisible characters:
   ```bash
   # Show all characters (including spaces, tabs)
   cat -A model.yaml | head -20
   # Tabs show as ^I, spaces show as whitespace
   ```

---

#### **Cause 4: File too large**
**Error Message**:
```
Error: File exceeds maximum size (100MB)
```

**Solution**:
1. Check file size:
   ```bash
   ls -lh model.yaml
   ```

2. If file is large:
   - The app uses Web Workers for parsing (multi-threaded)
   - Performance target: Parse 500+ element models in <5 seconds
   - For larger models, increase timeout in test config

3. Optimize model:
   - Split into layers if possible
   - Remove unused elements
   - Compress if using ZIP format

**Performance targets**:
- 100 elements: <100ms
- 500 elements: <500ms
- 1000+ elements: <2s with Web Worker

---

### Debugging Steps

```typescript
// Debug file loading
const handleFileSelect = async (file: File) => {
  console.log('File selected:');
  console.log('  Name:', file.name);
  console.log('  Size:', file.size, 'bytes');
  console.log('  Type:', file.type);

  try {
    const content = await file.text();
    console.log('  Content length:', content.length);
    console.log('  First 100 chars:', content.substring(0, 100));

    // Try parsing
    const json = JSON.parse(content);
    console.log('  ✅ Valid JSON');
  } catch (e) {
    console.log('  ❌ Not valid JSON:', e.message);
    console.log('  Trying YAML parser...');
  }
};
```

---

## Components aren't displaying correctly

### Symptom
Component renders but layout is broken, text is cut off, or styling is wrong

### Root Causes & Solutions

#### **Cause 1: Dark mode not applied**
**Indicators**:
- Light background in dark mode
- Text color wrong
- Borders missing in dark theme

**Solution**:
1. Check dark mode classes added to elements:
   ```typescript
   // ✅ Correct - has dark: variant
   <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">

   // ❌ Wrong - missing dark:
   <div className="bg-white">
   ```

2. Verify Tailwind dark mode is enabled in config:
   ```javascript
   // tailwind.config.js
   module.exports = {
     darkMode: 'class',  // ✅ 'class' mode enabled
     // or
     // darkMode: 'media'  // Uses system preference
   }
   ```

3. Check dark class is on html element:
   ```html
   <!-- Check in browser DevTools -->
   <html class="dark">  <!-- ✅ Correct -->
   <html>               <!-- ❌ Missing class -->
   ```

---

#### **Cause 2: Component dimensions wrong**
**Indicators**:
- Text overflows or is cut off
- Component smaller/larger than expected
- Layout is misaligned

**Solution**:
1. Check component has explicit width/height:
   ```typescript
   // ✅ Correct - explicit size
   <div style={{ width: '100%', height: '100%' }}>

   // ❌ Wrong - no size constraint
   <div>
   ```

2. Check parent container has layout:
   ```typescript
   // ✅ Correct - parent has flex layout
   <div className="flex h-screen">
     <div className="flex-1">Content</div>
   </div>

   // ❌ Wrong - parent has no layout
   <div>
     <div>Content</div>
   </div>
   ```

3. Verify overflow is handled:
   ```typescript
   // ✅ Correct - overflow hidden or scroll
   <div className="h-96 overflow-y-auto">

   // ❌ Wrong - content might overflow
   <div className="h-96">
   ```

---

#### **Cause 3: Render prop error**
**Indicators**:
- Component shows "Error" or blank space
- Console shows error in render prop
- One section of component fails silently

**Solution**:
1. Check render prop error boundary:
   ```typescript
   // ✅ Correct - wrapped with error boundary
   {wrapRenderProp(renderContent, data, 'renderContent')}

   // ❌ Wrong - no error boundary
   {renderContent(data)}
   ```

2. Check render prop doesn't throw:
   ```typescript
   // ✅ Correct - safe implementation
   renderContent={(item) => {
     if (!item) return <div>No data</div>;
     return <div>{item.name}</div>;
   }}

   // ❌ Wrong - might throw if item is null
   renderContent={(item) => <div>{item.name}</div>}
   ```

3. Check render prop parameters are correct:
   ```typescript
   // ✅ Correct - parameter matches function signature
   <BaseInspectorPanel
     renderElementDetails={(node: BusinessNode) => (
       <div>{node.label}</div>
     )}
   />

   // ❌ Wrong - wrong parameter type
   <BaseInspectorPanel
     renderElementDetails={(element: Element) => (  // Should be BusinessNode
       <div>{element.name}</div>
     )}
   />
   ```

---

#### **Cause 4: Responsive layout broken**
**Indicators**:
- Layout breaks on mobile/tablet
- Elements overlap on small screens
- Sidebar doesn't collapse

**Solution**:
1. Check responsive classes are used:
   ```typescript
   // ✅ Correct - responsive sizes
   <div className="w-full md:w-1/2 lg:w-1/3">

   // ❌ Wrong - fixed size only
   <div className="w-1/3">
   ```

2. Test on different screen sizes:
   ```bash
   # Browser DevTools → Device emulation
   # Test: iPhone, Tablet, Desktop
   ```

3. Check breakpoints match Tailwind defaults:
   ```
   sm: 640px
   md: 768px
   lg: 1024px
   xl: 1280px
   2xl: 1536px
   ```

---

## Tests are failing

### Symptom
`npm test` shows test failures

### Root Causes & Solutions

#### **Cause 1: Missing dependencies**
**Error Message**:
```
Cannot find module '@/core/services/businessGraphBuilder'
```

**Solution**:
```bash
# Reinstall dependencies
npm install

# Or if lock file is broken
rm -rf node_modules package-lock.json
npm install
```

---

#### **Cause 2: Test file imports wrong path**
**Error Message**:
```
Cannot find module '@/types/businessLayer'
```

**Solution**:
1. Check import paths use correct aliases:
   ```typescript
   // ✅ Correct - uses @ alias
   import { BusinessElement } from '@/core/types/businessLayer';

   // ❌ Wrong - relative path
   import { BusinessElement } from '../../../core/types/businessLayer';
   ```

2. Verify alias configured in `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]  // @ alias points to src/
       }
     }
   }
   ```

---

#### **Cause 3: Mock data is stale**
**Error Message**:
```
Expected 500 elements but got 0
Received: []
```

**Solution**:
1. Check mock data matches current model structure:
   ```typescript
   // Check if fields have changed
   const testElement = createTestElement({
     id: 'test-1',
     name: 'Test',
     type: 'service'
     // Missing new required field: department
   });
   ```

2. Verify test fixtures match current schema:
   ```bash
   # Check fixture file
   cat tests/fixtures/business-model.yaml

   # Compare with current schema
   cat documentation/YAML_MODELS.md
   ```

3. Update test data:
   ```bash
   # Run fixtures generation if available
   npm run test:fixtures:generate

   # Or manually update test files
   # See tests/README.md for test data patterns
   ```

---

#### **Cause 4: Async test timeout**
**Error Message**:
```
Timeout of 10000ms exceeded
```

**Solution**:
1. Increase timeout for slow operations:
   ```typescript
   test('should load large model', async () => {
     // Increase timeout for this specific test
   }, { timeout: 30000 });  // 30 seconds
   ```

2. Or increase global timeout in config:
   ```typescript
   // playwright.config.ts
   use: {
     timeout: 15000,  // 15 seconds globally
   }
   ```

3. Or increase test timeout:
   ```typescript
   test.setTimeout(30000);  // 30 seconds for this file
   ```

---

#### **Cause 5: React state not updating in test**
**Error Message**:
```
Expected true but got false
Expected .not.toBeNull() but got null
```

**Solution**:
```typescript
// ❌ Wrong - doesn't wait for state update
const { result } = renderHook(() => useMyHook());
expect(result.current.loaded).toBe(true);

// ✅ Correct - wait for state update
const { result } = renderHook(() => useMyHook());
await waitFor(() => {
  expect(result.current.loaded).toBe(true);
});
```

---

### Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/businessGraphBuilder.spec.ts

# Run tests matching pattern
npm test -- --grep "should filter nodes"

# Run with detailed output
npm test -- --reporter=verbose

# Run E2E tests
npm run test:e2e

# Run story tests
npm run test:stories
```

---

## Performance is slow

### Symptom
Graph rendering is sluggish, panning/zooming is janky, or app feels unresponsive

### Root Causes & Solutions

#### **Cause 1: Too many nodes rendering**
**Indicators**:
- 500+ nodes visible
- 60fps drops to 10-20 fps
- Pan/zoom very slow

**Solution**:
1. Apply viewport culling:
   ```typescript
   // Only render visible nodes
   const visibleNodes = nodes.filter(node => {
     return isInViewport(node.position, viewport);
   });
   ```

2. Filter nodes by layer:
   ```typescript
   // Hide less important layers
   const hiddenLayers = new Set(['APM', 'Datastore']);
   const visibleNodes = nodes.filter(n => !hiddenLayers.has(n.data.layer));
   ```

3. Use grid or matrix layout instead of force-directed:
   ```typescript
   // Force-directed on 500+ nodes is slow
   // Use:
   - Grid layout: O(n) calculation
   - Hierarchical layout: O(n log n)
   - Swimlane layout: O(n) with grouping
   ```

**Performance targets**:
- <50 nodes: Any layout <100ms
- 50-200 nodes: Hierarchical/Swimlane <500ms
- 200+ nodes: Grid/Matrix with culling <1s

---

#### **Cause 2: Layout calculation is slow**
**Indicators**:
- Graph freezes when loading
- Force-directed layout takes >1s
- CPU usage spikes

**Solution**:
1. Use faster layout algorithm:
   ```typescript
   // ❌ Slow for 500+ nodes
   new ForceDirectedLayout();

   // ✅ Fast alternative
   new GridLayout();
   new HierarchicalLayout();
   ```

2. Parallelize with Web Workers:
   ```typescript
   // Already implemented in worker pool
   // Check src/core/services/workerPool.ts

   // Verify it's being used:
   const layout = await workerPool.calculate(graph);
   ```

3. Reduce iterations:
   ```typescript
   // Force-directed layout iterations
   const layout = new ForceDirectedLayout({
     iterations: 100,  // Reduce from default 1000
     timeLimit: 500    // Max 500ms calculation
   });
   ```

---

#### **Cause 3: Unnecessary re-renders**
**Indicators**:
- React DevTools shows unnecessary re-renders
- Component updates when props didn't change
- Memory usage grows over time

**Solution**:
1. Wrap with memo():
   ```typescript
   // ✅ Correct - prevent re-renders
   export const MyNode = memo(({ data }) => {
     return <div>{data.label}</div>;
   });

   // ❌ Wrong - re-renders every time parent renders
   export const MyNode = ({ data }) => {
     return <div>{data.label}</div>;
   };
   ```

2. Memoize expensive calculations:
   ```typescript
   // ✅ Correct - cache calculation
   const filtered = useMemo(() => {
     return filterLargeArray(items);
   }, [items]);

   // ❌ Wrong - recalculates every render
   const filtered = filterLargeArray(items);
   ```

3. Use Zustand selectors properly:
   ```typescript
   // ✅ Correct - only re-render when model changes
   const model = useModelStore(state => state.model);

   // ❌ Wrong - re-render on any store change
   const { model, layers, elements } = useModelStore();
   ```

---

#### **Cause 4: Large bundle size**
**Indicators**:
- App takes long to load
- Initial load >5 seconds
- Lighthouse score low

**Solution**:
```bash
# Check bundle size
npm run build

# Analyze what's in bundle
npm run build:analyze

# Look for:
# - Duplicate dependencies
# - Large libraries
# - Unused code
```

---

### Profiling Steps

```typescript
// Profile in browser DevTools
const start = performance.now();
// ... operation ...
const duration = performance.now() - start;
console.log(`Operation took ${duration.toFixed(2)}ms`);

// Use Performance API
performance.mark('myOperation-start');
// ... operation ...
performance.mark('myOperation-end');
performance.measure('myOperation', 'myOperation-start', 'myOperation-end');
```

---

## Real-time features not working

### Symptom
Chat not working, annotations not syncing, or offline indicator always showing

### Root Causes & Solutions

#### **Cause 1: WebSocket connection failed**
**Error Message**:
```
WebSocket connection failed
Connection closed with code 1006
```

**Solution**:
1. Check server is running:
   ```bash
   # Check if Python reference server is running
   ps aux | grep python

   # Should see process listening on port 8000
   # Start server:
   python3 -m server
   ```

2. Check WebSocket URL is correct:
   ```typescript
   // Check in connectionStore or websocketClient
   const WS_URL = 'ws://localhost:8000/ws';  // ✅ Correct
   // vs
   const WS_URL = 'http://localhost:8000';   // ❌ Wrong protocol
   ```

3. Check browser console for network errors:
   ```
   DevTools → Network → WS tab
   Should show successful WebSocket upgrade (101 Switching Protocols)
   ```

4. If behind proxy, ensure WebSocket is proxied:
   ```
   # Nginx example
   proxy_http_version 1.1;
   proxy_set_header Upgrade $http_upgrade;
   proxy_set_header Connection "Upgrade";
   ```

---

#### **Cause 2: JSON-RPC method not recognized**
**Error Message**:
```
Method not found: "annotation.create"
```

**Solution**:
1. Check method name is registered:
   ```typescript
   // In jsonRpcHandler
   const handlers = {
     'annotation.create': handleAnnotationCreate,
     'annotation.update': handleAnnotationUpdate,
     // Check method name exactly matches
   };
   ```

2. Verify method parameters:
   ```typescript
   // ✅ Correct method call
   websocketClient.send({
     method: 'annotation.create',
     params: { text: 'My note', elementId: 'bus-1' }
   });

   // ❌ Wrong method name
   websocketClient.send({
     method: 'createAnnotation',  // Wrong
     params: { text: 'My note' }
   });
   ```

---

#### **Cause 3: Chat validation failing**
**Error Message**:
```
Chat Error: Message exceeds token limit
```

**Solution**:
1. Check message length:
   ```typescript
   // Message too long
   const message = "A very long message " + veryLongText;  // >1000 tokens

   // Shorten message
   const message = "Shortened message";  // <1000 tokens
   ```

2. Check validation rules:
   ```typescript
   // In chatValidation.ts
   const MAX_TOKENS = 1000;
   if (tokens > MAX_TOKENS) {
     throw new Error(`Message exceeds limit (${tokens} > ${MAX_TOKENS})`);
   }
   ```

---

#### **Cause 4: Offline mode issues**
**Indicators**:
- Stuck showing "offline" when online
- Changes don't sync when back online
- Queued changes lost

**Solution**:
1. Check connection state:
   ```typescript
   const connectionState = useConnectionStore(s => s.connectionState);
   console.log('Connection:', connectionState);
   // Should be: 'connected', 'connecting', 'disconnected', 'error'
   ```

2. Force reconnect:
   ```typescript
   const reconnect = useConnectionStore(s => s.reconnect);
   reconnect();  // Manually trigger reconnection
   ```

3. Check queued operations:
   ```typescript
   // View queued operations in offline mode
   const queue = useConnectionStore(s => s.pendingOperations);
   console.log('Queued:', queue);

   // Should sync when back online
   ```

---

## Export not working

### Symptom
Export button disabled, export fails, or file not created

### Root Causes & Solutions

#### **Cause 1: Export format not supported**
**Error Message**:
```
Unsupported export format: xyz
```

**Solution**:
1. Check supported formats:
   ```typescript
   // Supported formats
   - PNG (via html-to-image)
   - SVG (via React Flow)
   - JSON (via native serialization)

   // ✅ Correct
   await exportService.exportToPng(graph);

   // ❌ Wrong
   await exportService.exportToGif(graph);
   ```

2. Check export service is available:
   ```bash
   # Check file exists
   ls src/core/services/businessExportService.ts

   # If missing, export service untested
   # See TEST_COVERAGE_MAP.md for export test status
   ```

---

#### **Cause 2: File permissions denied**
**Error Message**:
```
Failed to write file: Permission denied
```

**Solution**:
1. Check directory is writable:
   ```bash
   # Linux/Mac
   ls -ld downloads/
   # Should show: drwxr-xr-x (755) or similar

   # Make directory writable
   chmod 755 ~/Downloads
   ```

2. Check available disk space:
   ```bash
   df -h
   # Should show >100MB free
   ```

---

#### **Cause 3: Browser download blocked**
**Indicators**:
- Export completes but no file appears
- Browser shows notification "blocked a download"

**Solution**:
1. Check browser download settings:
   - Chrome: Settings → Privacy → Downloads
   - Firefox: Preferences → Files
   - Safari: Preferences → General

2. Allow downloads from this site:
   - Chrome: Click shield icon → Allow
   - Firefox: "Always allow" checkbox
   - Safari: Preferences → Websites → Downloads

---

#### **Cause 4: Image export has wrong dimensions**
**Indicators**:
- Export is tiny or huge
- Graph is cut off in export
- Colors don't match display

**Solution**:
1. Check export scale:
   ```typescript
   // businessExportService.ts
   const options = {
     scale: 2,  // 2x resolution for quality
     pixelRatio: window.devicePixelRatio,
     width: 1920,
     height: 1080
   };
   ```

2. Verify graph bounds:
   ```typescript
   // Get graph bounds before export
   const bounds = {
     x: Math.min(...nodes.map(n => n.position.x)),
     y: Math.min(...nodes.map(n => n.position.y)),
     width: Math.max(...nodes.map(n => n.position.x + n.width)),
     height: Math.max(...nodes.map(n => n.position.y + n.height))
   };
   ```

---

## Getting Help

### Resources

1. **Check Documentation**:
   - `CLAUDE.md` - Development guide
   - `SERVICES_REFERENCE.md` - All services explained
   - `COMPONENT_API_REFERENCE.md` - Component props
   - `ERROR_HANDLING_GUIDE.md` - Error categories
   - `tests/README.md` - Testing guide

2. **Search Code**:
   ```bash
   # Find where error is thrown
   grep -r "ParseError" src/

   # Find how error is handled
   grep -r "exceptionClassifier.classify" src/

   # Find related tests
   find tests/ -name "*.spec.ts" | xargs grep "ParseError"
   ```

3. **Check Tests**:
   - `tests/README.md` - How tests are organized
   - `TEST_COVERAGE_MAP.md` - Find tests for your feature
   - Look at passing tests for usage examples

4. **Review Recent Changes**:
   ```bash
   # See recent commits
   git log --oneline -20

   # See what changed in a file
   git log -p src/path/to/file.ts
   ```

---

## Reporting Issues

When reporting a bug, include:

1. **What were you doing?**
   - Upload file, click button, etc.

2. **What did you expect to happen?**
   - Graph should render, file should save, etc.

3. **What actually happened?**
   - Error message, blank screen, etc.

4. **Evidence**:
   ```
   - Browser console error (F12 → Console)
   - Browser DevTools screenshot
   - File that reproduces issue (if applicable)
   - System info: OS, browser, version
   ```

5. **Steps to reproduce**:
   ```
   1. Open app
   2. Load model file X
   3. Click export button
   4. Observe error "..."
   ```

---

## Summary

**Common Issues Quick Reference**:
- **Graph blank** → Check model loaded, nodes registered, dimensions correct
- **Model won't load** → Validate syntax, check file format, verify UTF-8 encoding
- **Components broken** → Check dark mode, dimensions, responsive layout
- **Tests fail** → Install dependencies, check imports, verify mocks
- **Performance slow** → Filter nodes, use better layout, prevent re-renders
- **Real-time broken** → Check server running, WebSocket connection, JSON-RPC methods
- **Export fails** → Verify format supported, check permissions, allow downloads

**Always**:
1. Check browser console (F12 → Console)
2. Look for specific error messages
3. Check related documentation
4. Search code for similar implementations
5. Run tests to verify fix

Use [TEST_COVERAGE_MAP.md](./TEST_COVERAGE_MAP.md) to find related tests and services for your issue.
