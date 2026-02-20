/**
 * MSW (Mock Service Worker) Handlers
 * Provides mock API responses for testing and development
 *
 * Usage:
 * - Browser: Import server instance and call server.listen()
 * - Node.js/Tests: Import handlers and setup with MSW test server
 *
 * These handlers mock the DR CLI server API based on the OpenAPI spec
 */

import { http, HttpResponse } from 'msw';

// Mock data for API endpoints
const mockModelData = {
  uuid: 'model-123',
  name: 'Test Architecture Model',
  version: '1.0.0',
  layers: []
};

const mockSchemas = {
  motivation: {},
  business: {},
  technology: {},
  api: {},
  dataModel: {}
};

const mockChangesets = [];

const mockAnnotations = [];

/**
 * MSW HTTP handlers matching the OpenAPI spec
 * These intercept network requests and return mock responses
 */
export const handlers = [
  // Health check endpoint
  http.get('http://localhost:8080/api/health', () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0'
    });
  }),

  // Get architecture model
  http.get('http://localhost:8080/api/model', () => {
    return HttpResponse.json(mockModelData);
  }),

  // Get bundled schemas
  http.get('http://localhost:8080/api/schemas', () => {
    return HttpResponse.json(mockSchemas);
  }),

  // Get a specific schema
  http.get('http://localhost:8080/api/schemas/:layer', ({ params }) => {
    const layer = params.layer as string;
    return HttpResponse.json(mockSchemas[layer as keyof typeof mockSchemas] || {});
  }),

  // Get changesets
  http.get('http://localhost:8080/api/changesets', () => {
    return HttpResponse.json(mockChangesets);
  }),

  // Create a changeset
  http.post('http://localhost:8080/api/changesets', async ({ request }) => {
    const body = await request.json();
    const changeset = {
      id: `cs-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString()
    };
    mockChangesets.push(changeset);
    return HttpResponse.json(changeset, { status: 201 });
  }),

  // Get a specific changeset
  http.get('http://localhost:8080/api/changesets/:id', ({ params }) => {
    const changeset = mockChangesets.find(cs => cs.id === params.id);
    if (!changeset) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(changeset);
  }),

  // Get annotations
  http.get('http://localhost:8080/api/annotations', () => {
    return HttpResponse.json(mockAnnotations);
  }),

  // Create an annotation
  http.post('http://localhost:8080/api/annotations', async ({ request }) => {
    const body = await request.json();
    const annotation = {
      id: `ann-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString()
    };
    mockAnnotations.push(annotation);
    return HttpResponse.json(annotation, { status: 201 });
  }),

  // Get a specific annotation
  http.get('http://localhost:8080/api/annotations/:id', ({ params }) => {
    const annotation = mockAnnotations.find(a => a.id === params.id);
    if (!annotation) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(annotation);
  }),

  // Update an annotation
  http.patch('http://localhost:8080/api/annotations/:id', async ({ params, request }) => {
    const annotation = mockAnnotations.find(a => a.id === params.id);
    if (!annotation) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const updates = await request.json();
    const updated = { ...annotation, ...updates };
    const index = mockAnnotations.indexOf(annotation);
    mockAnnotations[index] = updated;
    return HttpResponse.json(updated);
  }),

  // Delete an annotation
  http.delete('http://localhost:8080/api/annotations/:id', ({ params }) => {
    const index = mockAnnotations.findIndex(a => a.id === params.id);
    if (index === -1) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }
    mockAnnotations.splice(index, 1);
    return HttpResponse.json({ success: true });
  })
];

/**
 * MSW Server for browser/integration testing
 * Use this in browser-based tests to intercept all network requests
 */
export function setupMswServer() {
  if (typeof window === 'undefined') {
    throw new Error('MSW Server should only be used in browser environment');
  }

  // This would be configured in a test setup file
  // For now, just export the handlers for use with MSW
  return handlers;
}
