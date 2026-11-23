/**
 * Auto-generated API Client with React Query Hooks
 * Generated from: docs/api-spec.yaml
 * API Version: 0.1.0
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
 * A non-2xx response. `status` is the HTTP status and `body` the raw
 * response text; `serverMessage` is the server's `{ error }` message when
 * the body carries one.
 */
export class ApiError extends Error {
  constructor(
    public readonly request: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`${request} failed: ${status} ${body}`);
    this.name = 'ApiError';
  }

  get serverMessage(): string | undefined {
    try {
      const parsed = JSON.parse(this.body) as { error?: unknown };
      return typeof parsed.error === 'string' && parsed.error ? parsed.error : undefined;
    } catch {
      return undefined;
    }
  }
}

/**
 * API Client class with fetch-based implementation
 */
export class ApiClient {
  private baseUrl: string;
  /** Set by setToken(); undefined means "read localStorage at request time". */
  private token: string | null | undefined = undefined;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authentication token (overrides the stored token until set to undefined)
   */
  setToken(token: string | null | undefined): void {
    this.token = token;
  }

  /**
   * The token for the next request. Read when the request is made, never cached
   * at construction: the client is created when this module is imported, before
   * main.tsx stores a magic link's new token, and a cached older token would be
   * sent (and refused) on every request until a reload.
   */
  private currentToken(): string | null {
    if (this.token !== undefined) return this.token;
    return typeof window !== 'undefined' ? localStorage.getItem('dr_auth_token') : null;
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

    const token = this.currentToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Generated fetch methods

  async gethealth(): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/health`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /health', response.status, await response.text());
    }

    return response.json();
  }

  async getapimodel(): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/model`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/model', response.status, await response.text());
    }

    return response.json();
  }

  async getapiprojectsprojectcheckoutscheckoutmodel(project: string, checkout: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}/checkouts/${encodeURIComponent(checkout)}/model`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/projects/:project/checkouts/:checkout/model', response.status, await response.text());
    }

    return response.json();
  }

  async getapilayerslayerName(layerName: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/layers/${encodeURIComponent(layerName)}`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/layers/:layerName', response.status, await response.text());
    }

    return response.json();
  }

  async getapiprojectsprojectcheckoutscheckoutlayerslayerName(project: string, checkout: string, layerName: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}/checkouts/${encodeURIComponent(checkout)}/layers/${encodeURIComponent(layerName)}`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/projects/:project/checkouts/:checkout/layers/:layerName', response.status, await response.text());
    }

    return response.json();
  }

  async getapispec(): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/spec`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/spec', response.status, await response.text());
    }

    return response.json();
  }

  async getapiprojects(): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/projects', response.status, await response.text());
    }

    return response.json();
  }

  async getapiprojectsproject(project: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/projects/:project', response.status, await response.text());
    }

    return response.json();
  }

  async getapiprojectsprojectcheckouts(project: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}/checkouts`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/projects/:project/checkouts', response.status, await response.text());
    }

    return response.json();
  }

  async getapiannotations(query?: { elementId?: string, author?: string, tags?: string, resolved?: string }): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/annotations`;
    
    const queryString = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, value);
        }
      });
    }
    const url = queryString.toString()
      ? `${baseUrl}${pathStr}?${queryString.toString()}`
      : `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/annotations', response.status, await response.text());
    }

    return response.json();
  }

  async postapiannotations(body?: unknown): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/annotations`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('POST /api/annotations', response.status, await response.text());
    }

    return response.json();
  }

  async getapiprojectsprojectcheckoutscheckoutannotations(project: string, checkout: string, query?: { elementId?: string, author?: string, tags?: string, resolved?: string }): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}/checkouts/${encodeURIComponent(checkout)}/annotations`;
    
    const queryString = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, value);
        }
      });
    }
    const url = queryString.toString()
      ? `${baseUrl}${pathStr}?${queryString.toString()}`
      : `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/projects/:project/checkouts/:checkout/annotations', response.status, await response.text());
    }

    return response.json();
  }

  async postapiprojectsprojectcheckoutscheckoutannotations(project: string, checkout: string, body?: unknown): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}/checkouts/${encodeURIComponent(checkout)}/annotations`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('POST /api/projects/:project/checkouts/:checkout/annotations', response.status, await response.text());
    }

    return response.json();
  }

  async getapiannotationsannotationId(annotationId: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/annotations/${encodeURIComponent(annotationId)}`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/annotations/:annotationId', response.status, await response.text());
    }

    return response.json();
  }

  async putapiannotationsannotationId(annotationId: string, body?: unknown): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/annotations/${encodeURIComponent(annotationId)}`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'PUT',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('PUT /api/annotations/:annotationId', response.status, await response.text());
    }

    return response.json();
  }

  async patchapiannotationsannotationId(annotationId: string, body?: unknown): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/annotations/${encodeURIComponent(annotationId)}`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'PATCH',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('PATCH /api/annotations/:annotationId', response.status, await response.text());
    }

    return response.json();
  }

  async deleteapiannotationsannotationId(annotationId: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/annotations/${encodeURIComponent(annotationId)}`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('DELETE /api/annotations/:annotationId', response.status, await response.text());
    }

    if (response.status === 204) {
      return undefined;
    }
    return response.json();
  }

  async getapiprojectsprojectcheckoutscheckoutannotationsannotationId(project: string, checkout: string, annotationId: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}/checkouts/${encodeURIComponent(checkout)}/annotations/${encodeURIComponent(annotationId)}`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/projects/:project/checkouts/:checkout/annotations/:annotationId', response.status, await response.text());
    }

    return response.json();
  }

  async putapiprojectsprojectcheckoutscheckoutannotationsannotationId(project: string, checkout: string, annotationId: string, body?: unknown): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}/checkouts/${encodeURIComponent(checkout)}/annotations/${encodeURIComponent(annotationId)}`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'PUT',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('PUT /api/projects/:project/checkouts/:checkout/annotations/:annotationId', response.status, await response.text());
    }

    return response.json();
  }

  async patchapiprojectsprojectcheckoutscheckoutannotationsannotationId(project: string, checkout: string, annotationId: string, body?: unknown): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}/checkouts/${encodeURIComponent(checkout)}/annotations/${encodeURIComponent(annotationId)}`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'PATCH',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('PATCH /api/projects/:project/checkouts/:checkout/annotations/:annotationId', response.status, await response.text());
    }

    return response.json();
  }

  async deleteapiprojectsprojectcheckoutscheckoutannotationsannotationId(project: string, checkout: string, annotationId: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}/checkouts/${encodeURIComponent(checkout)}/annotations/${encodeURIComponent(annotationId)}`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('DELETE /api/projects/:project/checkouts/:checkout/annotations/:annotationId', response.status, await response.text());
    }

    if (response.status === 204) {
      return undefined;
    }
    return response.json();
  }

  async getapiannotationsannotationIdreplies(annotationId: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/annotations/${encodeURIComponent(annotationId)}/replies`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/annotations/:annotationId/replies', response.status, await response.text());
    }

    return response.json();
  }

  async postapiannotationsannotationIdreplies(annotationId: string, body?: unknown): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/annotations/${encodeURIComponent(annotationId)}/replies`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('POST /api/annotations/:annotationId/replies', response.status, await response.text());
    }

    return response.json();
  }

  async getapiprojectsprojectcheckoutscheckoutannotationsannotationIdreplies(project: string, checkout: string, annotationId: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}/checkouts/${encodeURIComponent(checkout)}/annotations/${encodeURIComponent(annotationId)}/replies`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/projects/:project/checkouts/:checkout/annotations/:annotationId/replies', response.status, await response.text());
    }

    return response.json();
  }

  async postapiprojectsprojectcheckoutscheckoutannotationsannotationIdreplies(project: string, checkout: string, annotationId: string, body?: unknown): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}/checkouts/${encodeURIComponent(checkout)}/annotations/${encodeURIComponent(annotationId)}/replies`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('POST /api/projects/:project/checkouts/:checkout/annotations/:annotationId/replies', response.status, await response.text());
    }

    return response.json();
  }

  async getapichangesets(): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/changesets`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/changesets', response.status, await response.text());
    }

    return response.json();
  }

  async getapiprojectsprojectcheckoutscheckoutchangesets(project: string, checkout: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}/checkouts/${encodeURIComponent(checkout)}/changesets`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/projects/:project/checkouts/:checkout/changesets', response.status, await response.text());
    }

    return response.json();
  }

  async getapichangesetschangesetId(changesetId: string, query?: { driftLimit?: string, driftOffset?: string }): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/changesets/${encodeURIComponent(changesetId)}`;
    
    const queryString = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, value);
        }
      });
    }
    const url = queryString.toString()
      ? `${baseUrl}${pathStr}?${queryString.toString()}`
      : `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/changesets/:changesetId', response.status, await response.text());
    }

    return response.json();
  }

  async getapiprojectsprojectcheckoutscheckoutchangesetschangesetId(project: string, checkout: string, changesetId: string, query?: { driftLimit?: string, driftOffset?: string }): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}/checkouts/${encodeURIComponent(checkout)}/changesets/${encodeURIComponent(changesetId)}`;
    
    const queryString = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, value);
        }
      });
    }
    const url = queryString.toString()
      ? `${baseUrl}${pathStr}?${queryString.toString()}`
      : `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/projects/:project/checkouts/:checkout/changesets/:changesetId', response.status, await response.text());
    }

    return response.json();
  }

  async getapichangesetschangesetIdverification(changesetId: string, query?: { against?: string }): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/changesets/${encodeURIComponent(changesetId)}/verification`;
    
    const queryString = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, value);
        }
      });
    }
    const url = queryString.toString()
      ? `${baseUrl}${pathStr}?${queryString.toString()}`
      : `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/changesets/:changesetId/verification', response.status, await response.text());
    }

    return response.json();
  }

  async getapiprojectsprojectcheckoutscheckoutchangesetschangesetIdverification(project: string, checkout: string, changesetId: string, query?: { against?: string }): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}/checkouts/${encodeURIComponent(checkout)}/changesets/${encodeURIComponent(changesetId)}/verification`;
    
    const queryString = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, value);
        }
      });
    }
    const url = queryString.toString()
      ? `${baseUrl}${pathStr}?${queryString.toString()}`
      : `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/projects/:project/checkouts/:checkout/changesets/:changesetId/verification', response.status, await response.text());
    }

    return response.json();
  }

  async putapichangesetschangesetIdreview(changesetId: string, body?: unknown): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/changesets/${encodeURIComponent(changesetId)}/review`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'PUT',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('PUT /api/changesets/:changesetId/review', response.status, await response.text());
    }

    return response.json();
  }

  async putapiprojectsprojectcheckoutscheckoutchangesetschangesetIdreview(project: string, checkout: string, changesetId: string, body?: unknown): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}/checkouts/${encodeURIComponent(checkout)}/changesets/${encodeURIComponent(changesetId)}/review`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'PUT',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('PUT /api/projects/:project/checkouts/:checkout/changesets/:changesetId/review', response.status, await response.text());
    }

    return response.json();
  }

  async postapichangesetschangesetIdcommit(changesetId: string, body?: unknown): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/changesets/${encodeURIComponent(changesetId)}/commit`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('POST /api/changesets/:changesetId/commit', response.status, await response.text());
    }

    return response.json();
  }

  async postapiprojectsprojectcheckoutscheckoutchangesetschangesetIdcommit(project: string, checkout: string, changesetId: string, body?: unknown): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}/checkouts/${encodeURIComponent(checkout)}/changesets/${encodeURIComponent(changesetId)}/commit`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('POST /api/projects/:project/checkouts/:checkout/changesets/:changesetId/commit', response.status, await response.text());
    }

    return response.json();
  }

  async postapichangesetschangesetIddiscard(changesetId: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/changesets/${encodeURIComponent(changesetId)}/discard`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('POST /api/changesets/:changesetId/discard', response.status, await response.text());
    }

    return response.json();
  }

  async postapiprojectsprojectcheckoutscheckoutchangesetschangesetIddiscard(project: string, checkout: string, changesetId: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}/checkouts/${encodeURIComponent(checkout)}/changesets/${encodeURIComponent(changesetId)}/discard`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('POST /api/projects/:project/checkouts/:checkout/changesets/:changesetId/discard', response.status, await response.text());
    }

    return response.json();
  }

  async getapitier1(query?: { analyzer?: string }): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/tier1`;
    
    const queryString = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, value);
        }
      });
    }
    const url = queryString.toString()
      ? `${baseUrl}${pathStr}?${queryString.toString()}`
      : `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/tier1', response.status, await response.text());
    }

    return response.json();
  }

  async getapiprojectsprojectcheckoutscheckouttier1(project: string, checkout: string, query?: { analyzer?: string }): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/projects/${encodeURIComponent(project)}/checkouts/${encodeURIComponent(checkout)}/tier1`;
    
    const queryString = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, value);
        }
      });
    }
    const url = queryString.toString()
      ? `${baseUrl}${pathStr}?${queryString.toString()}`
      : `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError('GET /api/projects/:project/checkouts/:checkout/tier1', response.status, await response.text());
    }

    return response.json();
  }
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
export function setApiToken(token: string | null | undefined): void {
  getApiClient().setToken(token);
}

// Initialize singleton instance for hook usage
const apiClient = getApiClient();

// React Query Hooks

  /**
   * React Query hook for gethealth
   * Auto-manages caching and invalidation
   */
  export function useGethealth(options?: QueryOptions) {
    return useQuery({
      queryKey: ['gethealth'],
      queryFn: () => apiClient.gethealth(),
      ...(options || {})
    });
  }

  /**
   * React Query hook for getapimodel
   * Auto-manages caching and invalidation
   */
  export function useGetapimodel(options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapimodel'],
      queryFn: () => apiClient.getapimodel(),
      ...(options || {})
    });
  }

  /**
   * React Query hook for getapiprojectsprojectcheckoutscheckoutmodel
   * Auto-manages caching and invalidation
   */
  export function useGetapiprojectsprojectcheckoutscheckoutmodel(project: string, checkout: string, options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapiprojectsprojectcheckoutscheckoutmodel', project, checkout],
      queryFn: () => apiClient.getapiprojectsprojectcheckoutscheckoutmodel(project, checkout),
      ...options
    });
  }

  /**
   * React Query hook for getapilayerslayerName
   * Auto-manages caching and invalidation
   */
  export function useGetapilayerslayerName(layerName: string, options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapilayerslayerName', layerName],
      queryFn: () => apiClient.getapilayerslayerName(layerName),
      ...options
    });
  }

  /**
   * React Query hook for getapiprojectsprojectcheckoutscheckoutlayerslayerName
   * Auto-manages caching and invalidation
   */
  export function useGetapiprojectsprojectcheckoutscheckoutlayerslayerName(project: string, checkout: string, layerName: string, options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapiprojectsprojectcheckoutscheckoutlayerslayerName', project, checkout, layerName],
      queryFn: () => apiClient.getapiprojectsprojectcheckoutscheckoutlayerslayerName(project, checkout, layerName),
      ...options
    });
  }

  /**
   * React Query hook for getapispec
   * Auto-manages caching and invalidation
   */
  export function useGetapispec(options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapispec'],
      queryFn: () => apiClient.getapispec(),
      ...(options || {})
    });
  }

  /**
   * React Query hook for getapiprojects
   * Auto-manages caching and invalidation
   */
  export function useGetapiprojects(options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapiprojects'],
      queryFn: () => apiClient.getapiprojects(),
      ...(options || {})
    });
  }

  /**
   * React Query hook for getapiprojectsproject
   * Auto-manages caching and invalidation
   */
  export function useGetapiprojectsproject(project: string, options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapiprojectsproject', project],
      queryFn: () => apiClient.getapiprojectsproject(project),
      ...options
    });
  }

  /**
   * React Query hook for getapiprojectsprojectcheckouts
   * Auto-manages caching and invalidation
   */
  export function useGetapiprojectsprojectcheckouts(project: string, options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapiprojectsprojectcheckouts', project],
      queryFn: () => apiClient.getapiprojectsprojectcheckouts(project),
      ...options
    });
  }

  /**
   * React Query hook for getapiannotations
   * Auto-manages caching and invalidation
   */
  export function useGetapiannotations(options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapiannotations'],
      queryFn: () => apiClient.getapiannotations(),
      ...(options || {})
    });
  }

  /**
   * React Query mutation hook for postapiannotations
   */
  export function usePostapiannotations(options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: unknown) => apiClient.postapiannotations(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getapiannotations'] });
      },
      ...options
    } as any);
  }

  /**
   * React Query hook for getapiprojectsprojectcheckoutscheckoutannotations
   * Auto-manages caching and invalidation
   */
  export function useGetapiprojectsprojectcheckoutscheckoutannotations(project: string, checkout: string, options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapiprojectsprojectcheckoutscheckoutannotations', project, checkout],
      queryFn: () => apiClient.getapiprojectsprojectcheckoutscheckoutannotations(project, checkout),
      ...options
    });
  }

  /**
   * React Query mutation hook for postapiprojectsprojectcheckoutscheckoutannotations
   */
  export function usePostapiprojectsprojectcheckoutscheckoutannotations(project: string, checkout: string, options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: unknown) => apiClient.postapiprojectsprojectcheckoutscheckoutannotations(project, checkout, data),
      onSuccess: () => {
        console.warn('[WARNING] Unmapped cache invalidation for postapiprojectsprojectcheckoutscheckoutannotations. Add to getInvalidationQueries().');
        queryClient.invalidateQueries({ queryKey: ['postapiprojectsprojectcheckoutscheckoutannotations'] });
      },
      ...options
    } as any);
  }

  /**
   * React Query hook for getapiannotationsannotationId
   * Auto-manages caching and invalidation
   */
  export function useGetapiannotationsannotationId(annotationId: string, options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapiannotationsannotationId', annotationId],
      queryFn: () => apiClient.getapiannotationsannotationId(annotationId),
      ...options
    });
  }

  /**
   * React Query mutation hook for putapiannotationsannotationId
   */
  export function usePutapiannotationsannotationId(annotationId: string, options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: unknown) => apiClient.putapiannotationsannotationId(annotationId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getapiannotationsannotationId', annotationId] });
        queryClient.invalidateQueries({ queryKey: ['getapiannotations'] });
      },
      ...options
    } as any);
  }

  /**
   * React Query mutation hook for patchapiannotationsannotationId
   */
  export function usePatchapiannotationsannotationId(annotationId: string, options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: unknown) => apiClient.patchapiannotationsannotationId(annotationId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getapiannotationsannotationId', annotationId] });
        queryClient.invalidateQueries({ queryKey: ['getapiannotations'] });
      },
      ...options
    } as any);
  }

  /**
   * React Query mutation hook for deleteapiannotationsannotationId
   */
  export function useDeleteapiannotationsannotationId(annotationId: string, options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: () => apiClient.deleteapiannotationsannotationId(annotationId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getapiannotationsannotationId', annotationId] });
        queryClient.invalidateQueries({ queryKey: ['getapiannotations'] });
      },
      ...options
    } as any);
  }

  /**
   * React Query hook for getapiprojectsprojectcheckoutscheckoutannotationsannotationId
   * Auto-manages caching and invalidation
   */
  export function useGetapiprojectsprojectcheckoutscheckoutannotationsannotationId(project: string, checkout: string, annotationId: string, options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapiprojectsprojectcheckoutscheckoutannotationsannotationId', project, checkout, annotationId],
      queryFn: () => apiClient.getapiprojectsprojectcheckoutscheckoutannotationsannotationId(project, checkout, annotationId),
      ...options
    });
  }

  /**
   * React Query mutation hook for putapiprojectsprojectcheckoutscheckoutannotationsannotationId
   */
  export function usePutapiprojectsprojectcheckoutscheckoutannotationsannotationId(project: string, checkout: string, annotationId: string, options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: unknown) => apiClient.putapiprojectsprojectcheckoutscheckoutannotationsannotationId(project, checkout, annotationId, data),
      onSuccess: () => {
        console.warn('[WARNING] Unmapped cache invalidation for putapiprojectsprojectcheckoutscheckoutannotationsannotationId. Add to getInvalidationQueries().');
        queryClient.invalidateQueries({ queryKey: ['putapiprojectsprojectcheckoutscheckoutannotationsannotationId'] });
      },
      ...options
    } as any);
  }

  /**
   * React Query mutation hook for patchapiprojectsprojectcheckoutscheckoutannotationsannotationId
   */
  export function usePatchapiprojectsprojectcheckoutscheckoutannotationsannotationId(project: string, checkout: string, annotationId: string, options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: unknown) => apiClient.patchapiprojectsprojectcheckoutscheckoutannotationsannotationId(project, checkout, annotationId, data),
      onSuccess: () => {
        console.warn('[WARNING] Unmapped cache invalidation for patchapiprojectsprojectcheckoutscheckoutannotationsannotationId. Add to getInvalidationQueries().');
        queryClient.invalidateQueries({ queryKey: ['patchapiprojectsprojectcheckoutscheckoutannotationsannotationId'] });
      },
      ...options
    } as any);
  }

  /**
   * React Query mutation hook for deleteapiprojectsprojectcheckoutscheckoutannotationsannotationId
   */
  export function useDeleteapiprojectsprojectcheckoutscheckoutannotationsannotationId(project: string, checkout: string, annotationId: string, options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: () => apiClient.deleteapiprojectsprojectcheckoutscheckoutannotationsannotationId(project, checkout, annotationId),
      onSuccess: () => {
        console.warn('[WARNING] Unmapped cache invalidation for deleteapiprojectsprojectcheckoutscheckoutannotationsannotationId. Add to getInvalidationQueries().');
        queryClient.invalidateQueries({ queryKey: ['deleteapiprojectsprojectcheckoutscheckoutannotationsannotationId'] });
      },
      ...options
    } as any);
  }

  /**
   * React Query hook for getapiannotationsannotationIdreplies
   * Auto-manages caching and invalidation
   */
  export function useGetapiannotationsannotationIdreplies(annotationId: string, options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapiannotationsannotationIdreplies', annotationId],
      queryFn: () => apiClient.getapiannotationsannotationIdreplies(annotationId),
      ...options
    });
  }

  /**
   * React Query mutation hook for postapiannotationsannotationIdreplies
   */
  export function usePostapiannotationsannotationIdreplies(annotationId: string, options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: unknown) => apiClient.postapiannotationsannotationIdreplies(annotationId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getapiannotationsannotationIdreplies', annotationId] });
      },
      ...options
    } as any);
  }

  /**
   * React Query hook for getapiprojectsprojectcheckoutscheckoutannotationsannotationIdreplies
   * Auto-manages caching and invalidation
   */
  export function useGetapiprojectsprojectcheckoutscheckoutannotationsannotationIdreplies(project: string, checkout: string, annotationId: string, options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapiprojectsprojectcheckoutscheckoutannotationsannotationIdreplies', project, checkout, annotationId],
      queryFn: () => apiClient.getapiprojectsprojectcheckoutscheckoutannotationsannotationIdreplies(project, checkout, annotationId),
      ...options
    });
  }

  /**
   * React Query mutation hook for postapiprojectsprojectcheckoutscheckoutannotationsannotationIdreplies
   */
  export function usePostapiprojectsprojectcheckoutscheckoutannotationsannotationIdreplies(project: string, checkout: string, annotationId: string, options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: unknown) => apiClient.postapiprojectsprojectcheckoutscheckoutannotationsannotationIdreplies(project, checkout, annotationId, data),
      onSuccess: () => {
        console.warn('[WARNING] Unmapped cache invalidation for postapiprojectsprojectcheckoutscheckoutannotationsannotationIdreplies. Add to getInvalidationQueries().');
        queryClient.invalidateQueries({ queryKey: ['postapiprojectsprojectcheckoutscheckoutannotationsannotationIdreplies'] });
      },
      ...options
    } as any);
  }

  /**
   * React Query hook for getapichangesets
   * Auto-manages caching and invalidation
   */
  export function useGetapichangesets(options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapichangesets'],
      queryFn: () => apiClient.getapichangesets(),
      ...(options || {})
    });
  }

  /**
   * React Query hook for getapiprojectsprojectcheckoutscheckoutchangesets
   * Auto-manages caching and invalidation
   */
  export function useGetapiprojectsprojectcheckoutscheckoutchangesets(project: string, checkout: string, options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapiprojectsprojectcheckoutscheckoutchangesets', project, checkout],
      queryFn: () => apiClient.getapiprojectsprojectcheckoutscheckoutchangesets(project, checkout),
      ...options
    });
  }

  /**
   * React Query hook for getapichangesetschangesetId
   * Auto-manages caching and invalidation
   */
  export function useGetapichangesetschangesetId(changesetId: string, options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapichangesetschangesetId', changesetId],
      queryFn: () => apiClient.getapichangesetschangesetId(changesetId),
      ...options
    });
  }

  /**
   * React Query hook for getapiprojectsprojectcheckoutscheckoutchangesetschangesetId
   * Auto-manages caching and invalidation
   */
  export function useGetapiprojectsprojectcheckoutscheckoutchangesetschangesetId(project: string, checkout: string, changesetId: string, options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapiprojectsprojectcheckoutscheckoutchangesetschangesetId', project, checkout, changesetId],
      queryFn: () => apiClient.getapiprojectsprojectcheckoutscheckoutchangesetschangesetId(project, checkout, changesetId),
      ...options
    });
  }

  /**
   * React Query hook for getapichangesetschangesetIdverification
   * Auto-manages caching and invalidation
   */
  export function useGetapichangesetschangesetIdverification(changesetId: string, options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapichangesetschangesetIdverification', changesetId],
      queryFn: () => apiClient.getapichangesetschangesetIdverification(changesetId),
      ...options
    });
  }

  /**
   * React Query hook for getapiprojectsprojectcheckoutscheckoutchangesetschangesetIdverification
   * Auto-manages caching and invalidation
   */
  export function useGetapiprojectsprojectcheckoutscheckoutchangesetschangesetIdverification(project: string, checkout: string, changesetId: string, options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapiprojectsprojectcheckoutscheckoutchangesetschangesetIdverification', project, checkout, changesetId],
      queryFn: () => apiClient.getapiprojectsprojectcheckoutscheckoutchangesetschangesetIdverification(project, checkout, changesetId),
      ...options
    });
  }

  /**
   * React Query mutation hook for putapichangesetschangesetIdreview
   */
  export function usePutapichangesetschangesetIdreview(changesetId: string, options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: unknown) => apiClient.putapichangesetschangesetIdreview(changesetId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getapichangesets'] });
        queryClient.invalidateQueries({ queryKey: ['getapichangesetschangesetId', changesetId] });
      },
      ...options
    } as any);
  }

  /**
   * React Query mutation hook for putapiprojectsprojectcheckoutscheckoutchangesetschangesetIdreview
   */
  export function usePutapiprojectsprojectcheckoutscheckoutchangesetschangesetIdreview(project: string, checkout: string, changesetId: string, options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: unknown) => apiClient.putapiprojectsprojectcheckoutscheckoutchangesetschangesetIdreview(project, checkout, changesetId, data),
      onSuccess: () => {
        console.warn('[WARNING] Unmapped cache invalidation for putapiprojectsprojectcheckoutscheckoutchangesetschangesetIdreview. Add to getInvalidationQueries().');
        queryClient.invalidateQueries({ queryKey: ['putapiprojectsprojectcheckoutscheckoutchangesetschangesetIdreview'] });
      },
      ...options
    } as any);
  }

  /**
   * React Query mutation hook for postapichangesetschangesetIdcommit
   */
  export function usePostapichangesetschangesetIdcommit(changesetId: string, options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: unknown) => apiClient.postapichangesetschangesetIdcommit(changesetId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getapichangesets'] });
        queryClient.invalidateQueries({ queryKey: ['getapichangesetschangesetId', changesetId] });
        queryClient.invalidateQueries({ queryKey: ['getapimodel'] });
        queryClient.invalidateQueries({ queryKey: ['getapilayerslayerName'] });
      },
      ...options
    } as any);
  }

  /**
   * React Query mutation hook for postapiprojectsprojectcheckoutscheckoutchangesetschangesetIdcommit
   */
  export function usePostapiprojectsprojectcheckoutscheckoutchangesetschangesetIdcommit(project: string, checkout: string, changesetId: string, options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: unknown) => apiClient.postapiprojectsprojectcheckoutscheckoutchangesetschangesetIdcommit(project, checkout, changesetId, data),
      onSuccess: () => {
        console.warn('[WARNING] Unmapped cache invalidation for postapiprojectsprojectcheckoutscheckoutchangesetschangesetIdcommit. Add to getInvalidationQueries().');
        queryClient.invalidateQueries({ queryKey: ['postapiprojectsprojectcheckoutscheckoutchangesetschangesetIdcommit'] });
      },
      ...options
    } as any);
  }

  /**
   * React Query mutation hook for postapichangesetschangesetIddiscard
   */
  export function usePostapichangesetschangesetIddiscard(changesetId: string, options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: () => apiClient.postapichangesetschangesetIddiscard(changesetId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getapichangesets'] });
        queryClient.invalidateQueries({ queryKey: ['getapichangesetschangesetId', changesetId] });
      },
      ...options
    } as any);
  }

  /**
   * React Query mutation hook for postapiprojectsprojectcheckoutscheckoutchangesetschangesetIddiscard
   */
  export function usePostapiprojectsprojectcheckoutscheckoutchangesetschangesetIddiscard(project: string, checkout: string, changesetId: string, options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: () => apiClient.postapiprojectsprojectcheckoutscheckoutchangesetschangesetIddiscard(project, checkout, changesetId),
      onSuccess: () => {
        console.warn('[WARNING] Unmapped cache invalidation for postapiprojectsprojectcheckoutscheckoutchangesetschangesetIddiscard. Add to getInvalidationQueries().');
        queryClient.invalidateQueries({ queryKey: ['postapiprojectsprojectcheckoutscheckoutchangesetschangesetIddiscard'] });
      },
      ...options
    } as any);
  }

  /**
   * React Query hook for getapitier1
   * Auto-manages caching and invalidation
   */
  export function useGetapitier1(options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapitier1'],
      queryFn: () => apiClient.getapitier1(),
      ...(options || {})
    });
  }

  /**
   * React Query hook for getapiprojectsprojectcheckoutscheckouttier1
   * Auto-manages caching and invalidation
   */
  export function useGetapiprojectsprojectcheckoutscheckouttier1(project: string, checkout: string, options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapiprojectsprojectcheckoutscheckouttier1', project, checkout],
      queryFn: () => apiClient.getapiprojectsprojectcheckoutscheckouttier1(project, checkout),
      ...options
    });
  }

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
}