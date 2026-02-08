# Error Handling & Exception Documentation

Complete guide to error handling, exception classification, error tracking, and user-facing error messages in the Documentation Robotics Viewer.

## Table of Contents

- [Error Classification System](#error-classification-system)
- [Exception Categories](#exception-categories)
- [Error Handling Patterns](#error-handling-patterns)
- [User-Facing Error Messages](#user-facing-error-messages)
- [Error Tracking & Logging](#error-tracking--logging)
- [Testing Error Cases](#testing-error-cases)
- [Common Error Scenarios](#common-error-scenarios)

---

## Error Classification System

### Overview

The `exceptionClassifier` service categorizes all errors into standardized types for consistent handling and user feedback.

**Location**: `src/core/services/exceptionClassifier.ts`
**Status**: ✅ **Well Tested** (10 unit tests)

### Classification Architecture

```typescript
interface ClassifiedError {
  /** Error category (unique identifier) */
  category: ErrorCategory;

  /** Formatted message for display */
  message: string;

  /** Technical details for logging */
  details: {
    originalError: Error;
    context: ErrorContext;
    timestamp: Date;
    stackTrace?: string;
  };

  /** Whether error stops processing */
  isFatal: boolean;

  /** Suggested user action */
  suggestion?: string;

  /** Related documentation link */
  helpLink?: string;

  /** Severity level for logging */
  severity: 'error' | 'warning' | 'info';
}
```

---

## Exception Categories

### 1. ParseError

**Occurs When**: YAML/JSON parsing fails
**Root Causes**:
- Invalid JSON syntax
- Malformed YAML (indentation, quotes)
- Encoding issues (non-UTF8)
- File is not readable

**Example Error**:
```
Error: Unexpected token } in JSON at position 145
```

**Classification**:
```typescript
{
  category: 'ParseError',
  message: 'Failed to parse model file: unexpected token at line 145',
  isFatal: true,
  severity: 'error',
  suggestion: 'Check file format is valid YAML or JSON',
  helpLink: '/docs/formats'
}
```

**Handling Pattern**:
```typescript
try {
  const model = yamlParser.parse(fileContent);
} catch (error) {
  const classified = exceptionClassifier.classify(error);
  if (classified.category === 'ParseError') {
    showUserError(classified.message);
    logError(classified);
  }
}
```

**Recovery Action**: Provide file upload UI again, show parsed line number

---

### 2. ValidationError

**Occurs When**: Model data violates schema or business rules
**Root Causes**:
- Missing required fields
- Invalid field types
- Schema constraint violations
- Business rule violations (e.g., circular dependencies)

**Example Error**:
```
Validation failed: Element "service-1" has unknown type "service_v2"
Valid types: ["service", "process", "function", "capability"]
```

**Classification**:
```typescript
{
  category: 'ValidationError',
  message: 'Model validation failed at element "service-1"',
  isFatal: true,
  severity: 'error',
  suggestion: 'Check element type is one of: service, process, function, capability',
  helpLink: '/docs/validation'
}
```

**Handling Pattern**:
```typescript
const validationResult = validator.validate(model);
if (!validationResult.isValid) {
  validationResult.errors.forEach(error => {
    const classified = exceptionClassifier.classify(error);
    if (classified.category === 'ValidationError') {
      logValidationError(classified, element);
    }
  });
}
```

**Recovery Action**: Show which field is invalid, suggest valid values

---

### 3. ReferenceError

**Occurs When**: Cross-layer references don't resolve
**Root Causes**:
- Target element doesn't exist
- Circular dependencies detected
- Invalid reference format
- Type mismatch (business service references unknown API operation)

**Example Error**:
```
Reference Error: Business service "payment" references unknown API operation "process-payment-v3"
No API operation found with this ID
```

**Classification**:
```typescript
{
  category: 'ReferenceError',
  message: 'Unresolved reference in cross-layer relationship',
  isFatal: false,  // Can continue with warning
  severity: 'warning',
  suggestion: 'Check referenced element ID exists in target layer',
  helpLink: '/docs/references'
}
```

**Handling Pattern**:
```typescript
try {
  const resolved = referenceResolver.resolve(reference);
  if (!resolved) {
    const error = createReferenceError(reference);
    const classified = exceptionClassifier.classify(error);

    if (!classified.isFatal) {
      logWarning(classified);
      recordBrokenReference(reference);
    } else {
      throw error;
    }
  }
} catch (error) {
  // Handle fatal reference errors
}
```

**Recovery Action**: Show warning badge on affected element, skip relationship visualization

---

### 4. TransformError

**Occurs When**: Element to React Flow node transformation fails
**Root Causes**:
- Missing required node data
- Invalid node type
- Dimension calculation error
- Position calculation error

**Example Error**:
```
Transform Error: Cannot transform element "goal-1" - missing required field "label"
```

**Classification**:
```typescript
{
  category: 'TransformError',
  message: 'Failed to transform element to visualization node',
  isFatal: true,
  severity: 'error',
  suggestion: 'Check element has all required fields: id, label, type',
  helpLink: '/docs/transformation'
}
```

**Handling Pattern**:
```typescript
const nodes = elements.map(element => {
  try {
    return nodeTransformer.transform(element);
  } catch (error) {
    const classified = exceptionClassifier.classify(error);
    if (classified.isFatal) {
      throw error;
    } else {
      logWarning(classified);
      return createPlaceholderNode(element);
    }
  }
});
```

**Recovery Action**: Show placeholder node with error indicator, skip in layout calculation

---

### 5. LayoutError

**Occurs When**: Layout calculation algorithm fails
**Root Causes**:
- Graph too large for selected algorithm
- Infinite loops in layout calculation
- Invalid node dimensions
- Memory exhaustion

**Example Error**:
```
Layout Error: Force-directed layout exceeded iteration limit (10,000 iterations)
Graph may contain difficult configuration or be too large for this algorithm
```

**Classification**:
```typescript
{
  category: 'LayoutError',
  message: 'Layout calculation failed - using fallback positioning',
  isFatal: false,
  severity: 'warning',
  suggestion: 'Try a different layout algorithm (Hierarchical, Grid, etc.)',
  helpLink: '/docs/layouts'
}
```

**Handling Pattern**:
```typescript
try {
  const positions = layoutEngine.calculate(graph, options);
  return positions;
} catch (error) {
  const classified = exceptionClassifier.classify(error);
  if (classified.isFatal) {
    // Fall back to grid layout
    return gridLayout.calculate(graph, options);
  }
  logWarning(classified);
}
```

**Recovery Action**: Use fallback layout algorithm, show warning

---

### 6. ExportError

**Occurs When**: Export to PNG/SVG/JSON fails
**Root Causes**:
- File system permissions denied
- Image encoding error
- JSON serialization error
- File too large

**Example Error**:
```
Export Error: Failed to write export file - permission denied
Check that /downloads directory is writable
```

**Classification**:
```typescript
{
  category: 'ExportError',
  message: 'Failed to export visualization',
  isFatal: false,
  severity: 'error',
  suggestion: 'Check file permissions and available disk space',
  helpLink: '/docs/export'
}
```

**Handling Pattern**:
```typescript
try {
  await exportService.exportToPng(graph);
  showSuccess('Export complete');
} catch (error) {
  const classified = exceptionClassifier.classify(error);
  showUserError(classified.message);
  if (classified.suggestion) {
    showHelpText(classified.suggestion);
  }
}
```

**Recovery Action**: Suggest troubleshooting steps, allow retry

---

### 7. WebSocketError

**Occurs When**: Real-time connection fails
**Root Causes**:
- Server unreachable
- Connection timeout
- Protocol error
- Authentication failed

**Example Error**:
```
WebSocket Error: Connection closed with code 1006 (abnormal closure)
Server may be offline or network is unreachable
```

**Classification**:
```typescript
{
  category: 'WebSocketError',
  message: 'Real-time connection lost',
  isFatal: false,
  severity: 'warning',
  suggestion: 'Check internet connection and server status',
  helpLink: '/docs/realtime'
}
```

**Handling Pattern**:
```typescript
websocketClient.on('error', (error) => {
  const classified = exceptionClassifier.classify(error);

  if (classified.category === 'WebSocketError') {
    connectionStore.setError(classified);

    if (!classified.isFatal) {
      // Auto-reconnect with exponential backoff
      scheduleReconnect();
    }
  }
});
```

**Recovery Action**: Show offline indicator, auto-reconnect, queue offline changes

---

### 8. ChatError

**Occurs When**: Chat operations fail
**Root Causes**:
- Message validation failed
- Token budget exceeded
- Malformed request
- Server error

**Example Error**:
```
Chat Error: Message exceeds token limit (max 1000, got 1500)
Please shorten your message
```

**Classification**:
```typescript
{
  category: 'ChatError',
  message: 'Failed to process chat message',
  isFatal: false,
  severity: 'warning',
  suggestion: 'Check message length and content',
  helpLink: '/docs/chat'
}
```

---

## Error Handling Patterns

### Pattern 1: Try-Catch with Classification

```typescript
async function loadModel(filePath: string) {
  try {
    const content = await loadFile(filePath);
    const model = parseYaml(content);
    const validated = validateModel(model);
    return validated;
  } catch (error) {
    const classified = exceptionClassifier.classify(error);

    // Log error
    errorTracker.trackError(error, {
      operation: 'loadModel',
      filePath,
      classified
    });

    // Show user-friendly message
    showUserError(classified.message);

    // Re-throw if fatal
    if (classified.isFatal) {
      throw error;
    }

    // Otherwise return null/default
    return null;
  }
}
```

### Pattern 2: Error Recovery with Fallback

```typescript
function buildGraphWithFallback(model: Model) {
  try {
    // Try primary approach
    return businessGraphBuilder.build(model);
  } catch (error) {
    const classified = exceptionClassifier.classify(error);
    logWarning(classified);

    // Fall back to simplified graph
    return businessGraphBuilder.buildSimplified(model);
  }
}
```

### Pattern 3: Optimistic UI with Error Handling

```typescript
async function addAnnotation(text: string) {
  // Create temp annotation with temp ID
  const tempAnnotation = {
    id: `temp-${Date.now()}`,
    text,
    status: 'pending'
  };

  // Update UI immediately (optimistic)
  annotationStore.getState().addAnnotation(tempAnnotation);

  try {
    // Send to server
    const result = await chatService.createAnnotation(text);

    // Replace temp with real
    annotationStore.getState().updateAnnotation({
      id: tempAnnotation.id,
      ...result
    });

    showSuccess('Annotation saved');
  } catch (error) {
    const classified = exceptionClassifier.classify(error);

    // Remove failed annotation
    annotationStore.getState().deleteAnnotation(tempAnnotation.id);

    // Show error to user
    showUserError(classified.message);

    // Log for debugging
    errorTracker.trackError(error, {
      operation: 'addAnnotation',
      classified
    });
  }
}
```

### Pattern 4: Validation Error Reporting

```typescript
function validateAndReport(model: Model) {
  const errors: ClassifiedError[] = [];

  // Validate each element
  model.elements.forEach(element => {
    try {
      validator.validate(element);
    } catch (error) {
      const classified = exceptionClassifier.classify(error);
      errors.push({
        ...classified,
        context: {
          ...classified.details.context,
          elementId: element.id,
          elementName: element.name
        }
      });
    }
  });

  if (errors.length > 0) {
    showValidationReport(errors);
    return false;
  }

  return true;
}
```

---

## User-Facing Error Messages

### Message Design Principles

1. **Clear & Concise**: 1-2 sentences, avoid technical jargon
2. **Actionable**: Tell user what went wrong and what to do
3. **Specific**: Not "Error occurred", but "Failed to parse JSON at line 145"
4. **Helpful**: Suggest solution or provide documentation link

### Message Templates

#### For Parse Errors
```
❌ Failed to parse model file

The file format appears to be invalid. Please check:
• JSON syntax (valid brackets, quotes, commas)
• YAML indentation (consistent spacing)
• File encoding (must be UTF-8)

Line 145: Unexpected token }

[Try Again] [View Documentation]
```

#### For Validation Errors
```
⚠️ Model validation failed

Element "payment-service" has an issue:
• Field: type
• Expected: one of [service, process, function, capability]
• Got: service_v2

[Fix This] [Show All Errors] [Documentation]
```

#### For Reference Errors
```
⚠️ Broken cross-layer reference

Business service "payment-service" references:
• API operation: "create-transaction-v3"
• Status: Not found in model

This reference will be skipped during visualization.

[Find Replacement] [Remove Reference] [Ignore]
```

#### For Layout Errors
```
⚠️ Layout calculation failed

The selected algorithm couldn't arrange all elements.
This sometimes happens with very large or highly connected graphs.

Suggestions:
• Try a different algorithm (Hierarchical, Grid)
• Filter to show fewer elements
• Increase available memory

[Switch Layout] [Apply Filter] [Help]
```

#### For Export Errors
```
❌ Export failed

Could not save file to downloads folder.

Check:
• File permissions (folder is writable)
• Disk space (enough room for file)
• Browser settings (allow downloads)

[Try Again] [Help]
```

### User Message Implementation

```typescript
// User-friendly error component
<ErrorMessage
  title="Model parsing failed"
  description={classified.message}
  suggestion={classified.suggestion}
  action={() => navigate('/load-model')}
  actionLabel="Try Again"
  helpLink={classified.helpLink}
/>
```

---

## Error Tracking & Logging

### Error Tracker Service

**Location**: `src/apps/embedded/services/errorTracker.ts`
**Status**: ✅ **Tested** (8 unit tests)

**Purpose**: Track, store, and report errors during session

**API**:
```typescript
interface ErrorTracker {
  // Track an error with context
  trackError(error: Error, context: ErrorContext): void;

  // Retrieve tracked errors
  getErrors(filter?: ErrorFilter): TrackedError[];

  // Clear error log
  clearErrors(): void;

  // Export errors for debugging
  exportErrors(): string;

  // Get error statistics
  getStatistics(): ErrorStatistics;
}

interface ErrorContext {
  operation: string;            // What was being done
  timestamp: Date;              // When it happened
  userAction?: string;          // What user did
  modelState?: any;             // Model state at time
  browserInfo?: string;         // Browser/OS info
  classification?: ClassifiedError; // Classified error data
}
```

**Usage**:
```typescript
import { errorTracker } from '@/apps/embedded/services/errorTracker';

// Track error
errorTracker.trackError(error, {
  operation: 'loadModel',
  timestamp: new Date(),
  userAction: 'clicked Load button',
  modelState: currentModel
});

// Get errors for session
const errors = errorTracker.getErrors({
  severity: 'error',
  timeRange: 'last-hour'
});

// Export for debugging
const report = errorTracker.exportErrors();
```

### Logging Levels

```typescript
// Log levels
logger.error(message, context);      // Fatal errors, user impacted
logger.warn(message, context);       // Non-fatal issues
logger.info(message, context);       // Important events
logger.debug(message, context);      // Detailed debugging info
```

### Console Error Monitoring

Development console shows:
```
[Error] ❌ ParseError - Failed to parse model file
  → Operation: loadModel
  → File: business-model.yaml
  → Details: Unexpected token } at line 145

[Warning] ⚠️ ReferenceError - Unresolved reference
  → Source: business.service.payment
  → Target: api.operation.charge-card (NOT FOUND)
  → Impact: Skipped from visualization

[Info] ℹ️ LayoutError - Algorithm failed, using fallback
  → Algorithm: force-directed
  → Nodes: 500+
  → Fallback: grid
```

---

## Testing Error Cases

### Unit Test Pattern for Error Cases

```typescript
test('should classify parse errors', () => {
  const error = new Error('Unexpected token } in JSON at position 145');
  const classified = exceptionClassifier.classify(error);

  expect(classified.category).toBe('ParseError');
  expect(classified.isFatal).toBe(true);
  expect(classified.message).toContain('Failed to parse');
  expect(classified.suggestion).toBeDefined();
});

test('should handle reference errors gracefully', () => {
  const model = createTestModel({
    references: [
      { source: 'bus.service.a', target: 'api.op.unknown' }
    ]
  });

  const result = referenceResolver.resolve(model);

  expect(result.unresolved).toHaveLength(1);
  expect(result.unresolved[0].id).toBe('bus.service.a→api.op.unknown');
});

test('should recover from layout errors', () => {
  const largeGraph = createLargeGraph(1000);
  const layoutResult = layoutEngine.calculate(largeGraph, {
    algorithm: 'force-directed'
  });

  expect(layoutResult.success).toBe(false);
  expect(layoutResult.fallbackUsed).toBe(true);
  expect(layoutResult.nodes.length).toBe(1000);
});
```

### E2E Test Pattern for Error Scenarios

```typescript
test('should show error message when parsing invalid YAML', async ({ page }) => {
  // Upload invalid file
  await page.click('[data-testid="upload-button"]');
  await page.setInputFiles('[type="file"]', 'invalid.yaml');

  // Wait for error message
  await expect(page.locator('[data-testid="error-message"]'))
    .toContainText('Failed to parse model file');

  // Verify user can retry
  await expect(page.locator('[data-testid="try-again-button"]'))
    .toBeVisible();
});

test('should handle reference errors during visualization', async ({ page }) => {
  // Load model with broken references
  await loadModel('model-with-broken-refs.yaml');

  // Verify warning badge appears
  const warningBadges = page.locator('[data-testid="reference-warning"]');
  expect(await warningBadges.count()).toBeGreaterThan(0);

  // Verify graph still renders
  const nodes = page.locator('.react-flow__node');
  expect(await nodes.count()).toBeGreaterThan(0);
});
```

---

## Common Error Scenarios

### Scenario 1: User Uploads Invalid YAML File

**Sequence**:
1. User clicks "Load Model" and selects file
2. File is read and sent to `yamlParser.parse()`
3. Parser throws `SyntaxError` (YAML parse failure)
4. Error caught → `exceptionClassifier.classify()` → `ParseError`
5. Error logged with context
6. User sees message: "Failed to parse model file: invalid YAML at line 145"
7. User shown fix suggestions and retry button

**Related Code**:
- `dataLoader.ts:loadModel()` - File reading
- `yamlParser.ts:parseYamlInstance()` - YAML parsing
- `exceptionClassifier.ts` - Error classification

---

### Scenario 2: Cross-Layer Reference Doesn't Resolve

**Sequence**:
1. Model loaded successfully
2. `crossLayerReferenceExtractor` finds all references
3. `crossLayerReferenceResolver` attempts to resolve each
4. Reference not found → creates `ReferenceError`
5. Error classified as non-fatal warning
6. Reference recorded as broken
7. Element shows warning badge in UI
8. Graph still renders, relationship skipped

**Related Code**:
- `crossLayerReferenceExtractor.ts` - Extract references
- `crossLayerReferenceResolver.ts` - Resolve to targets
- Component shows warning badge on affected elements

---

### Scenario 3: Real-Time Connection Lost

**Sequence**:
1. WebSocket connection established
2. Server goes offline or network drops
3. WebSocket emits `error` event
4. Error classified as `WebSocketError` (non-fatal)
5. `connectionStore` updated with error state
6. UI shows "Offline" indicator
7. User's changes queued locally
8. Auto-reconnection attempted (exponential backoff)
9. Upon reconnection, queued changes synced

**Related Code**:
- `websocketClient.ts` - Connection management
- `connectionStore.ts` - Connection state
- Error tracking stores queued operations

---

### Scenario 4: Layout Algorithm Fails

**Sequence**:
1. Large graph (500+ nodes) selected
2. Force-directed layout chosen
3. Algorithm starts but exceeds iteration limit
4. Throws `LayoutError`
5. Caught as non-fatal, fallback activated
6. Grid layout applied instead
7. User sees warning: "Layout calculation failed, using alternative algorithm"
8. User can select different layout algorithm

**Related Code**:
- `layoutEngine.calculate()` - Layout calculation
- Fallback logic in view components
- Layout selector UI

---

### Scenario 5: Chat Message Validation Fails

**Sequence**:
1. User types long message in chat
2. Submits message
3. `chatValidation` checks token count
4. Exceeds limit → throws `ChatError`
5. Error classified (non-fatal warning)
6. Error message shown: "Message exceeds token limit (max 1000, got 1500)"
7. User prompted to shorten message
8. Message not sent, user can edit and retry

**Related Code**:
- `chatValidation.ts` - Validate message content
- `chatService.ts` - Chat operations
- Error handling in chat input component

---

## Best Practices

### Do ✅

- ✅ Classify all errors using `exceptionClassifier`
- ✅ Log errors with full context using `errorTracker`
- ✅ Show user-friendly messages (not technical errors)
- ✅ Provide actionable suggestions
- ✅ Allow user to retry failed operations
- ✅ Recover gracefully with fallbacks
- ✅ Provide documentation links
- ✅ Test error scenarios in unit & E2E tests

### Don't ❌

- ❌ Show raw error stack traces to users
- ❌ Silently ignore errors (at least log them)
- ❌ Stop entire app for non-fatal errors
- ❌ Forget to handle async errors (use try-catch in handlers)
- ❌ Leave broken references untracked
- ❌ Make error messages too technical
- ❌ Forget to test error cases
- ❌ Ignore performance implications (large error logs)

---

## Related Documentation

- `SERVICES_REFERENCE.md` - exceptionClassifier and errorTracker services
- `tests/README.md` - Testing error scenarios
- `TROUBLESHOOTING.md` - Common issues and solutions
- `CLAUDE.md` - Error handling patterns in components

---

## Summary

**Error Handling in This System**:
1. **Standardized Classification** - All errors classified into 8 categories
2. **Non-Fatal First** - Most errors allow continued operation
3. **Graceful Degradation** - Fallbacks for non-critical failures
4. **User-Friendly Messages** - Technical errors translated to guidance
5. **Complete Tracking** - All errors logged with full context
6. **Testable Errors** - Error scenarios covered in test suite
7. **Recovery Options** - Users always have paths to resolve issues
8. **Clear Suggestions** - Each error includes actionable next steps

Use this guide to **consistently handle errors** and **improve user experience** when things go wrong.
