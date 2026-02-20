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

// Type definitions for mock data
interface ModelData {
  uuid: string;
  name: string;
  version: string;
  layers: unknown[];
}

interface Schemas {
  [key: string]: Record<string, unknown>;
}

interface Changeset {
  id: string;
  createdAt: string;
  [key: string]: unknown;
}

interface Annotation {
  id: string;
  createdAt: string;
  [key: string]: unknown;
}

// Mock data for API endpoints
const mockModelData: ModelData = {
  uuid: 'model-123',
  name: 'Test Architecture Model',
  version: '1.0.0',
  layers: []
};

const mockSchemas: Schemas = {
  motivation: {},
  business: {},
  technology: {},
  api: {},
  dataModel: {}
};

const mockChangesets: Changeset[] = [];

const mockAnnotations: Annotation[] = [];

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
    const layer = String(params.layer);
    return HttpResponse.json(mockSchemas[layer] || {});
  }),

  // Get changesets
  http.get('http://localhost:8080/api/changesets', () => {
    return HttpResponse.json(mockChangesets);
  }),

  // Create a changeset
  http.post('http://localhost:8080/api/changesets', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const changeset: Changeset = {
      id: `cs-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...body
    };
    mockChangesets.push(changeset);
    return HttpResponse.json(changeset, { status: 201 });
  }),

  // Get a specific changeset
  http.get('http://localhost:8080/api/changesets/:id', ({ params }) => {
    const changesetId = String(params.id);
    const changeset = mockChangesets.find(cs => cs.id === changesetId);
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
    const body = (await request.json()) as Record<string, unknown>;
    const annotation: Annotation = {
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...body
    };
    mockAnnotations.push(annotation);
    return HttpResponse.json(annotation, { status: 201 });
  }),

  // Get a specific annotation
  http.get('http://localhost:8080/api/annotations/:id', ({ params }) => {
    const annotationId = String(params.id);
    const annotation = mockAnnotations.find(a => a.id === annotationId);
    if (!annotation) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(annotation);
  }),

  // Update an annotation
  http.patch('http://localhost:8080/api/annotations/:id', async ({ params, request }) => {
    const annotationId = String(params.id);
    const annotation = mockAnnotations.find(a => a.id === annotationId);
    if (!annotation) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const updates = (await request.json()) as Record<string, unknown>;
    const updated: Annotation = { ...annotation, ...updates } as Annotation;
    const index = mockAnnotations.indexOf(annotation);
    mockAnnotations[index] = updated;
    return HttpResponse.json(updated);
  }),

  // Delete an annotation
  http.delete('http://localhost:8080/api/annotations/:id', ({ params }) => {
    const annotationId = String(params.id);
    const index = mockAnnotations.findIndex(a => a.id === annotationId);
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
