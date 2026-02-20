/**
 * Typed API Client Service
 * Provides type-safe access to the DR CLI server API using generated OpenAPI types
 *
 * Generated types: Use `npm run client:generate` to regenerate from OpenAPI spec
 * These types ensure compile-time safety when calling API endpoints
 */

import type { paths } from '../types/api-client';

/**
 * Extracts the request body type from an OpenAPI path operation
 */
type PathRequest<
  T extends Record<string, Record<string, unknown>>,
  Method extends string
> = T extends Record<Method, { requestBody?: { content: { 'application/json': infer Body } } }>
  ? Body
  : never;

/**
 * Extracts the response type from an OpenAPI path operation
 */
type PathResponse<
  T extends Record<string, Record<string, unknown>>,
  Method extends string,
  StatusCode extends string = '200'
> = T extends Record<Method, { responses: Record<StatusCode, { content?: { 'application/json': infer Response } }> }>
  ? Response
  : never;

/**
 * Type-safe REST API client
 * Provides methods that match the OpenAPI spec with full TypeScript validation
 */
export class TypedRestApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:8080', token: string | null = null) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null): void {
    this.token = token;
  }

  /**
   * Make a GET request with type safety
   */
  async get<Path extends keyof paths>(
    path: Path,
    options?: {
      params?: Record<string, unknown>;
    }
  ): Promise<PathResponse<paths[Path], 'get'>> {
    return this.request('GET', String(path), undefined, options?.params);
  }

  /**
   * Make a POST request with type safety
   */
  async post<Path extends keyof paths>(
    path: Path,
    body: PathRequest<paths[Path], 'post'>,
    options?: {
      params?: Record<string, unknown>;
    }
  ): Promise<PathResponse<paths[Path], 'post'>> {
    return this.request('POST', String(path), body, options?.params);
  }

  /**
   * Make a PUT request with type safety
   */
  async put<Path extends keyof paths>(
    path: Path,
    body: PathRequest<paths[Path], 'put'>,
    options?: {
      params?: Record<string, unknown>;
    }
  ): Promise<PathResponse<paths[Path], 'put'>> {
    return this.request('PUT', String(path), body, options?.params);
  }

  /**
   * Make a DELETE request with type safety
   */
  async delete<Path extends keyof paths>(
    path: Path,
    options?: {
      params?: Record<string, unknown>;
    }
  ): Promise<PathResponse<paths[Path], 'delete'>> {
    return this.request('DELETE', String(path), undefined, options?.params);
  }

  /**
   * Make a PATCH request with type safety
   */
  async patch<Path extends keyof paths>(
    path: Path,
    body: PathRequest<paths[Path], 'patch'>,
    options?: {
      params?: Record<string, unknown>;
    }
  ): Promise<PathResponse<paths[Path], 'patch'>> {
    return this.request('PATCH', String(path), body, options?.params);
  }

  /**
   * Generic HTTP request method
   * @private - Use typed methods (get, post, etc.) instead
   */
  private async request(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, unknown>
  ): Promise<any> {
    const url = new URL(path, this.baseUrl);

    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    // Add token to query params if provided (for WebSocket compatibility)
    if (this.token) {
      url.searchParams.set('token', this.token);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Also add token to Authorization header for standard REST
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const init: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), init);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  }
}

/**
 * Create a default instance of the typed API client
 */
export function createApiClient(baseUrl?: string, token?: string | null): TypedRestApiClient {
  return new TypedRestApiClient(baseUrl, token ?? null);
}
