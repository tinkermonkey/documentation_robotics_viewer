/**
 * Auto-generated API Client with React Query Hooks
 * Generated from: /workspace/docs/api-spec.yaml
 * Generated at: 2026-02-24T02:20:07.563Z
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
      headers['Authorization'] = `Bearer ${this.token}`;
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
      const errorText = await response.text();
      throw new Error(`GET /health failed: ${response.status} ${errorText}`);
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
      const errorText = await response.text();
      throw new Error(`GET /api/model failed: ${response.status} ${errorText}`);
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
      const errorText = await response.text();
      throw new Error(`GET /api/layers/:layerName failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async getapielementsid(id: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/elements/${encodeURIComponent(id)}`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GET /api/elements/:id failed: ${response.status} ${errorText}`);
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
      const errorText = await response.text();
      throw new Error(`GET /api/spec failed: ${response.status} ${errorText}`);
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
      const errorText = await response.text();
      throw new Error(`GET /api/annotations failed: ${response.status} ${errorText}`);
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
      const errorText = await response.text();
      throw new Error(`POST /api/annotations failed: ${response.status} ${errorText}`);
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
      const errorText = await response.text();
      throw new Error(`GET /api/annotations/:annotationId failed: ${response.status} ${errorText}`);
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
      const errorText = await response.text();
      throw new Error(`PUT /api/annotations/:annotationId failed: ${response.status} ${errorText}`);
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
      const errorText = await response.text();
      throw new Error(`PATCH /api/annotations/:annotationId failed: ${response.status} ${errorText}`);
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
      const errorText = await response.text();
      throw new Error(`DELETE /api/annotations/:annotationId failed: ${response.status} ${errorText}`);
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
      const errorText = await response.text();
      throw new Error(`GET /api/annotations/:annotationId/replies failed: ${response.status} ${errorText}`);
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
      const errorText = await response.text();
      throw new Error(`POST /api/annotations/:annotationId/replies failed: ${response.status} ${errorText}`);
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
      const errorText = await response.text();
      throw new Error(`GET /api/changesets failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async getapichangesetschangesetId(changesetId: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `/api/changesets/${encodeURIComponent(changesetId)}`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GET /api/changesets/:changesetId failed: ${response.status} ${errorText}`);
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
export function setApiToken(token: string | null): void {
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
   * React Query hook for getapielementsid
   * Auto-manages caching and invalidation
   */
  export function useGetapielementsid(id: string, options?: QueryOptions) {
    return useQuery({
      queryKey: ['getapielementsid', id],
      queryFn: () => apiClient.getapielementsid(id),
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
        queryClient.invalidateQueries({ queryKey: ['data'] });
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
        queryClient.invalidateQueries({ queryKey: ['data'] });
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
        queryClient.invalidateQueries({ queryKey: ['data'] });
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
        queryClient.invalidateQueries({ queryKey: ['data'] });
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
        queryClient.invalidateQueries({ queryKey: ['data'] });
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