# MSW (Mock Service Worker) Testing Guide

This guide explains how to use Mock Service Worker (MSW) for testing the DR Viewer API integration without requiring a real DR CLI server.

## Overview

MSW provides a balanced approach for testing:
- **Network-level mocking**: Intercepts fetch/WebSocket requests at the network level
- **No server required**: Tests don't need a running DR CLI server
- **Realistic testing**: Network stack is still exercised (no stubbing)
- **Easy setup**: Minimal configuration needed
- **Flexible**: Can override handlers per-test for different scenarios

## Setup

### Installation

MSW is already included in `package.json`. Install it with:

```bash
npm install
```

### For Playwright E2E Tests

Create a test setup file or add to your test configuration:

```typescript
import { setupMswForTests } from '@tests/helpers/mswSetup';

// In test setup (before tests run)
setupMswForTests();
```

### For Browser Tests

Import MSW handlers in your test file:

```typescript
import { handlers } from '@/core/services/mswHandlers';
import { setupServer } from 'msw/node';

const mswServer = setupServer(...handlers);

beforeAll(() => mswServer.listen());
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());
```

## Usage Examples

### Basic Test with MSW

```typescript
import { test, expect } from '@playwright/test';
import { setupMswForTests, overrideMswHandler } from '@tests/helpers/mswSetup';

test.beforeAll(() => {
  setupMswForTests();
});

test('should load architecture model', async ({ page }) => {
  await page.goto('http://localhost:3001');

  // MSW intercepts the /api/model request
  const modelData = await page.evaluate(() => {
    return fetch('http://localhost:8080/api/model')
      .then(r => r.json());
  });

  expect(modelData.uuid).toBe('model-123');
});
```

### Override Handler for Error Testing

```typescript
import { http, HttpResponse } from 'msw';
import { overrideMswHandler } from '@tests/helpers/mswSetup';

test('should handle API errors gracefully', async ({ page }) => {
  // Override the default handler to return an error
  overrideMswHandler(
    http.get('http://localhost:8080/api/model', () => {
      return HttpResponse.json(
        { error: 'Server error' },
        { status: 500 }
      );
    })
  );

  await page.goto('http://localhost:3001');

  // Test error handling
  const errorElement = await page.locator('[data-testid="error-message"]');
  await expect(errorElement).toContainText('Server error');
});
```

### Test Slow Network Conditions

```typescript
import { http, delay, HttpResponse } from 'msw';
import { overrideMswHandler } from '@tests/helpers/mswSetup';

test('should show loading state during slow requests', async ({ page }) => {
  // Simulate slow network
  overrideMswHandler(
    http.get('http://localhost:8080/api/model', async () => {
      await delay(3000); // 3 second delay
      return HttpResponse.json({ uuid: 'model-123' });
    })
  );

  await page.goto('http://localhost:3001');

  // Check loading indicator appears
  const loader = await page.locator('[data-testid="loading"]');
  await expect(loader).toBeVisible();

  // Wait for data to load
  await page.waitForTimeout(3500);
  const model = await page.locator('[data-testid="model-name"]');
  await expect(model).toContainText('Test Architecture Model');
});
```

## Available Handlers

The following API endpoints are mocked (matching the OpenAPI spec in `docs/api-spec.yaml`):

### Health Check
- `GET /health` - Server health status

### Model Endpoints
- `GET /api/model` - Get architecture model
- `GET /api/spec` - Get bundled API spec and schemas
- `GET /api/layers/{layerName}` - Get specific layer
- `GET /api/elements/{elementId}` - Get specific element

### Changeset Endpoints
- `GET /api/changesets` - List changesets
- `POST /api/changesets` - Create changeset
- `GET /api/changesets/{changesetId}` - Get changeset

### Annotation Endpoints
- `GET /api/annotations` - List annotations
- `POST /api/annotations` - Create annotation
- `GET /api/annotations/{annotationId}` - Get annotation
- `PATCH /api/annotations/{annotationId}` - Update annotation
- `DELETE /api/annotations/{annotationId}` - Delete annotation
- `GET /api/annotations/{annotationId}/replies` - Get annotation replies

## Creating Custom Handlers

Add custom handlers to `/workspace/src/core/services/mswHandlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

// Add to the handlers array
http.post('http://localhost:8080/api/custom-endpoint', async ({ request }) => {
  const body = await request.json();

  // Custom logic
  const result = processData(body);

  return HttpResponse.json(result);
}),
```

Then update your test to use the new handler.

## Comparing with Alternatives

| Approach | Setup | Network | Realism | Maintenance |
|----------|-------|---------|---------|------------|
| MSW | Easy | Realistic | High | Low |
| Server Mock (in-memory) | Medium | None | Low | Medium |
| Real DR CLI Server | Hard | Realistic | Very High | High |

**Recommendation**: Use MSW for most tests, real server for integration/E2E tests.

## Troubleshooting

### Handlers Not Being Called

Check that:
1. MSW server is listening: `mswServer.listen()`
2. URL matches exactly (case-sensitive, includes protocol)
3. Method matches (GET, POST, etc.)

### Request Hanging

Add a timeout to your test:
```typescript
test.setTimeout(30000); // 30 second timeout
```

Or check if handler is returning a response:
```typescript
http.get('url', () => {
  // Make sure to return HttpResponse
  return HttpResponse.json(data);
})
```

## Related Documentation

- [Testing Guide](./TESTING.md)
- [API Integration Guide](./DR_CLI_INTEGRATION_GUIDE.md)
- [MSW Official Docs](https://mswjs.io/)

## Switching Between MSW and Real Server

To test against a real DR CLI server instead of MSW:

1. Ensure DR CLI server is running:
   ```bash
   cd ~/documentation_robotics
   npm run start
   ```

2. Update environment variable or config:
   ```bash
   export DR_USE_REAL_SERVER=true
   npm test
   ```

3. MSW handlers will not be loaded when real server is active

This allows the same test suite to run against both mock and real implementations.
