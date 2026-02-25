#!/usr/bin/env node

/**
 * API Client Generator with React Query Hooks
 *
 * Generates type-safe API client code with React Query hooks from OpenAPI spec.
 * This goes beyond simple type generation to create actual fetchable client code.
 *
 * Features:
 * - Parses OpenAPI spec to extract endpoint definitions
 * - Generates TypeScript fetch client with proper error handling
 * - Creates React Query hooks for common operations
 * - Includes request/response validation
 * - Supports authentication header injection
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const specPath = path.resolve('docs/api-spec.yaml');
const clientPath = path.resolve('src/core/services/generatedApiClient.ts');

/**
 * Parse OpenAPI spec
 */
function parseOpenApiSpec() {
  if (!fs.existsSync(specPath)) {
    throw new Error(`OpenAPI spec not found: ${specPath}`);
  }

  const specContent = fs.readFileSync(specPath, 'utf-8');
  return yaml.load(specContent);
}

/**
 * Extract paths and operations from OpenAPI spec
 */
function extractEndpoints(spec) {
  const endpoints = [];

  if (!spec.paths) {
    console.warn('No paths found in OpenAPI spec');
    return endpoints;
  }

  for (const [pathStr, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
        const operationId = operation.operationId || `${method}${pathStr.replace(/[^a-zA-Z0-9]/g, '')}`;
        endpoints.push({
          path: pathStr,
          method: method.toLowerCase(),
          operationId,
          summary: operation.summary || '',
          description: operation.description || '',
          parameters: operation.parameters || [],
          requestBody: operation.requestBody,
          responses: operation.responses || {},
          security: operation.security
        });
      }
    }
  }

  return endpoints;
}

/**
 * Generate fetch client method for a single endpoint
 */
function generateFetchMethod(endpoint) {
  const { path, method, operationId } = endpoint;

  let funcSignature = `async ${operationId}(`;
  const params = [];

  // Add path parameters
  endpoint.parameters
    .filter(p => p.in === 'path')
    .forEach(p => {
      params.push(`${p.name}: string`);
    });

  // Add query parameters
  const queryParams = endpoint.parameters.filter(p => p.in === 'query');
  if (queryParams.length > 0) {
    params.push(`query?: { ${queryParams.map(p => `${p.name}?: string`).join(', ')} }`);
  }

  // Add request body
  if (endpoint.requestBody) {
    params.push(`body?: unknown`);
  }

  funcSignature += params.join(', ') + '): Promise<unknown>';

  // Build request URL - remove quotes, properly interpolate
  // URL-encode path parameters to handle special characters
  let urlBuilder = path;
  endpoint.parameters
    .filter(p => p.in === 'path')
    .forEach(p => {
      // Handle both {paramName} (OpenAPI 3.0 standard) and :paramName (custom) syntax
      urlBuilder = urlBuilder.replace(`{${p.name}}`, `\${encodeURIComponent(${p.name})}`);
      urlBuilder = urlBuilder.replace(`:${p.name}`, `\${encodeURIComponent(${p.name})}`);
    });

  // Build query string
  let queryCode = '';
  if (queryParams.length > 0) {
    queryCode = `
    const queryString = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, value);
        }
      });
    }
    const url = queryString.toString()
      ? \`\${baseUrl}\${pathStr}?\${queryString.toString()}\`
      : \`\${baseUrl}\${pathStr}\`;`;
  } else {
    queryCode = `const url = \`\${baseUrl}\${pathStr}\`;`;
  }

  let methodCode = `
  ${funcSignature} {
    const baseUrl = this.getBaseUrl();
    const pathStr = \`${urlBuilder}\`;
    ${queryCode}

    const options: RequestInit = {
      method: '${method.toUpperCase()}',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    ${endpoint.requestBody ? "if (body) options.body = JSON.stringify(body);" : ""}

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(\`${method.toUpperCase()} ${path} failed: \${response.status} \${errorText}\`);
    }

    return response.json();
  }`;

  return methodCode;
}

/**
 * Generate React Query hook for endpoint
 */
function generateReactQueryHook(endpoint) {
  const { method, operationId } = endpoint;
  const hookName = `use${operationId.charAt(0).toUpperCase() + operationId.slice(1)}`;

  // Extract path parameters for hook signature
  const pathParams = endpoint.parameters.filter(p => p.in === 'path');
  const pathParamStr = pathParams.length > 0
    ? pathParams.map(p => `${p.name}: string`).join(', ')
    : '';
  const pathParamCall = pathParams.length > 0
    ? pathParams.map(p => p.name).join(', ')
    : '';

  if (method === 'get') {
    const paramStr = pathParamStr ? `${pathParamStr}, options?: QueryOptions` : 'options?: QueryOptions';
    return `
  /**
   * React Query hook for ${operationId}
   * Auto-manages caching and invalidation
   */
  export function ${hookName}(${paramStr}) {
    return useQuery({
      queryKey: ['${operationId}'${pathParamStr ? ', ' + pathParamCall : ''}],
      queryFn: () => ${pathParamCall ? `apiClient.${operationId}(${pathParamCall})` : `apiClient.${operationId}()`},
      ${pathParamStr ? '...options' : '...(options || {})'}
    });
  }`;
  } else {
    // For mutations, check if there's a request body
    const hasBody = endpoint.requestBody;
    const paramStr = pathParamStr ? `${pathParamStr}, options?: MutationOptions` : 'options?: MutationOptions';

    if (hasBody) {
      return `
  /**
   * React Query mutation hook for ${operationId}
   */
  export function ${hookName}(${paramStr}) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: unknown) => ${pathParamCall ? `apiClient.${operationId}(${pathParamCall}, data)` : `apiClient.${operationId}(data)`},
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['data'] });
      },
      ...options
    } as any);
  }`;
    } else {
      // DELETE/operations without body: call endpoint with path params only
      return `
  /**
   * React Query mutation hook for ${operationId}
   */
  export function ${hookName}(${paramStr}) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: () => ${pathParamCall ? `apiClient.${operationId}(${pathParamCall})` : `apiClient.${operationId}()`},
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['data'] });
      },
      ...options
    } as any);
  }`;
    }
  }
}

/**
 * Generate complete API client code
 */
function generateApiClient(spec, endpoints) {
  const fetchMethods = endpoints.map(ep => generateFetchMethod(ep)).join('\n');
  const reactQueryHooks = endpoints.map(ep => generateReactQueryHook(ep)).join('\n');

  const code = `/**
 * Auto-generated API Client with React Query Hooks
 * Generated from: ${specPath}
 * Generated at: ${new Date().toISOString()}
 * API Version: ${spec.info?.version || 'unknown'}
 *
 * IMPORTANT: This file is auto-generated. Do not edit directly.
 * Regenerate with: npm run client:generate
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions, QueryClient } from '@tanstack/react-query';

/**
 * Type definitions for query/mutation options
 */
export type QueryOptions = Omit<UseQueryOptions, 'queryKey' | 'queryFn'>;
export type MutationOptions = Omit<UseMutationOptions, 'mutationFn'>;

/**
 * API Client class with fetch-based implementation
 */
export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  /**
   * Load authentication token from storage
   */
  private loadToken(): void {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('dr_auth_token');
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null): void {
    this.token = token;
  }

  /**
   * Get base URL for API requests
   */
  private getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Build authorization headers
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = \`Bearer \${this.token}\`;
    }

    return headers;
  }

  // Generated fetch methods
${fetchMethods}
}

/**
 * Singleton instance of API client
 */
let apiClientInstance: ApiClient | null = null;

/**
 * Initialize or get the API client singleton
 */
export function getApiClient(baseUrl?: string): ApiClient {
  if (!apiClientInstance) {
    const url = baseUrl || (typeof window !== 'undefined'
      ? window.location.origin
      : process.env.API_URL || 'http://localhost:8080');
    apiClientInstance = new ApiClient(url);
  }
  return apiClientInstance;
}

/**
 * Set authentication token on the API client
 */
export function setApiToken(token: string | null): void {
  getApiClient().setToken(token);
}

// Initialize singleton instance for hook usage
const apiClient = getApiClient();

// React Query Hooks
${reactQueryHooks}

/**
 * Create a QueryClient with recommended defaults for DR API
 */
export function createApiQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
        retry: 1
      },
      mutations: {
        retry: 0
      }
    }
  });
}`;

  return code;
}

/**
 * Main generation function
 */
function generateClient() {
  try {
    console.log(`\n🔧 Generating API Client with React Query Hooks`);
    console.log(`Reading OpenAPI spec from: ${specPath}`);

    const spec = parseOpenApiSpec();
    console.log(`✅ Parsed API spec: ${spec.info?.title} v${spec.info?.version}`);

    const endpoints = extractEndpoints(spec);
    console.log(`✅ Found ${endpoints.length} endpoints`);

    const clientCode = generateApiClient(spec, endpoints);

    // Ensure directory exists
    const clientDir = path.dirname(clientPath);
    if (!fs.existsSync(clientDir)) {
      fs.mkdirSync(clientDir, { recursive: true });
    }

    fs.writeFileSync(clientPath, clientCode);
    console.log(`✅ Generated API client: ${clientPath}`);

    // Print generated endpoints summary
    console.log(`\n📋 Generated ${endpoints.length} endpoint methods:`);
    endpoints.forEach(ep => {
      console.log(`  ${ep.method.toUpperCase().padEnd(6)} ${ep.path.padEnd(30)} → ${ep.operationId}()`);
    });

    console.log(`\n✅ API client generation complete\n`);
    return 0;
  } catch (error) {
    console.error(`\n❌ API client generation failed: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    return 1;
  }
}

process.exit(generateClient());
