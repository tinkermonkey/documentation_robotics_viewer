/**
 * Auto-generated API Client with React Query Hooks
 * Generated from: /workspace/docs/api-spec.yaml
 * Generated at: 2026-02-20T08:29:07.401Z
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

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetch<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: { ...this.getHeaders(), ...options.headers }
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`HTTP ${response.status}: ${errorText}`);
      (error as any).status = response.status;
      throw error;
    }

    const data = await response.json();
    return data as T;
  }

  // Generated fetch methods

  async gethealth(): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `'/health'`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${method.toUpperCase()} /health failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async getapispec(): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `'/api/spec'`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${method.toUpperCase()} /api/spec failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async getapimodel(): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `'/api/model'`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${method.toUpperCase()} /api/model failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async getapilayerslayerName(layerName: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `'/api/layers/${layerName}'`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${method.toUpperCase()} /api/layers/{layerName} failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async getapielementselementId(elementId: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `'/api/elements/${elementId}'`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${method.toUpperCase()} /api/elements/{elementId} failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async getapichangesets(): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `'/api/changesets'`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${method.toUpperCase()} /api/changesets failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async getapichangesetschangesetId(changesetId: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `'/api/changesets/${changesetId}'`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${method.toUpperCase()} /api/changesets/{changesetId} failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async getapiannotations(query?: { elementId?: string }): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `'/api/annotations'`;
    
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
      throw new Error(`${method.toUpperCase()} /api/annotations failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async postapiannotations(body?: unknown): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `'/api/annotations'`;
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
      throw new Error(`${method.toUpperCase()} /api/annotations failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async putapiannotationsannotationId(annotationId: string, body?: unknown): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `'/api/annotations/${annotationId}'`;
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
      throw new Error(`${method.toUpperCase()} /api/annotations/{annotationId} failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async patchapiannotationsannotationId(annotationId: string, body?: unknown): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `'/api/annotations/${annotationId}'`;
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
      throw new Error(`${method.toUpperCase()} /api/annotations/{annotationId} failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async deleteapiannotationsannotationId(annotationId: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `'/api/annotations/${annotationId}'`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${method.toUpperCase()} /api/annotations/{annotationId} failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async getapiannotationsannotationIdreplies(annotationId: string): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `'/api/annotations/${annotationId}/replies'`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${method.toUpperCase()} /api/annotations/{annotationId}/replies failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async postapiannotationsannotationIdreplies(annotationId: string, body?: unknown): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `'/api/annotations/${annotationId}/replies'`;
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
      throw new Error(`${method.toUpperCase()} /api/annotations/{annotationId}/replies failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async getws(): Promise<unknown> {
    const baseUrl = this.getBaseUrl();
    const pathStr = `'/ws'`;
    const url = `${baseUrl}${pathStr}`;

    const options: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    };

    

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${method.toUpperCase()} /ws failed: ${response.status} ${errorText}`);
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

// React Query Hooks

  /**
   * React Query hook for gethealth
   * Auto-manages caching and invalidation
   */
  export function useGethealth(options?: QueryOptions) {
    const queryClient = useQueryClient();

    return useQuery({
      queryKey: ['gethealth'],
      queryFn: () => apiClient.gethealth(),
      ...options
    });
  }

  /**
   * React Query hook for getapispec
   * Auto-manages caching and invalidation
   */
  export function useGetapispec(options?: QueryOptions) {
    const queryClient = useQueryClient();

    return useQuery({
      queryKey: ['getapispec'],
      queryFn: () => apiClient.getapispec(),
      ...options
    });
  }

  /**
   * React Query hook for getapimodel
   * Auto-manages caching and invalidation
   */
  export function useGetapimodel(options?: QueryOptions) {
    const queryClient = useQueryClient();

    return useQuery({
      queryKey: ['getapimodel'],
      queryFn: () => apiClient.getapimodel(),
      ...options
    });
  }

  /**
   * React Query hook for getapilayerslayerName
   * Auto-manages caching and invalidation
   */
  export function useGetapilayerslayerName(options?: QueryOptions) {
    const queryClient = useQueryClient();

    return useQuery({
      queryKey: ['getapilayerslayerName'],
      queryFn: () => apiClient.getapilayerslayerName(),
      ...options
    });
  }

  /**
   * React Query hook for getapielementselementId
   * Auto-manages caching and invalidation
   */
  export function useGetapielementselementId(options?: QueryOptions) {
    const queryClient = useQueryClient();

    return useQuery({
      queryKey: ['getapielementselementId'],
      queryFn: () => apiClient.getapielementselementId(),
      ...options
    });
  }

  /**
   * React Query hook for getapichangesets
   * Auto-manages caching and invalidation
   */
  export function useGetapichangesets(options?: QueryOptions) {
    const queryClient = useQueryClient();

    return useQuery({
      queryKey: ['getapichangesets'],
      queryFn: () => apiClient.getapichangesets(),
      ...options
    });
  }

  /**
   * React Query hook for getapichangesetschangesetId
   * Auto-manages caching and invalidation
   */
  export function useGetapichangesetschangesetId(options?: QueryOptions) {
    const queryClient = useQueryClient();

    return useQuery({
      queryKey: ['getapichangesetschangesetId'],
      queryFn: () => apiClient.getapichangesetschangesetId(),
      ...options
    });
  }

  /**
   * React Query hook for getapiannotations
   * Auto-manages caching and invalidation
   */
  export function useGetapiannotations(options?: QueryOptions) {
    const queryClient = useQueryClient();

    return useQuery({
      queryKey: ['getapiannotations'],
      queryFn: () => apiClient.getapiannotations(),
      ...options
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
    });
  }

  /**
   * React Query mutation hook for putapiannotationsannotationId
   */
  export function usePutapiannotationsannotationId(options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: unknown) => apiClient.putapiannotationsannotationId(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['data'] });
      },
      ...options
    });
  }

  /**
   * React Query mutation hook for patchapiannotationsannotationId
   */
  export function usePatchapiannotationsannotationId(options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: unknown) => apiClient.patchapiannotationsannotationId(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['data'] });
      },
      ...options
    });
  }

  /**
   * React Query mutation hook for deleteapiannotationsannotationId
   */
  export function useDeleteapiannotationsannotationId(options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: unknown) => apiClient.deleteapiannotationsannotationId(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['data'] });
      },
      ...options
    });
  }

  /**
   * React Query hook for getapiannotationsannotationIdreplies
   * Auto-manages caching and invalidation
   */
  export function useGetapiannotationsannotationIdreplies(options?: QueryOptions) {
    const queryClient = useQueryClient();

    return useQuery({
      queryKey: ['getapiannotationsannotationIdreplies'],
      queryFn: () => apiClient.getapiannotationsannotationIdreplies(),
      ...options
    });
  }

  /**
   * React Query mutation hook for postapiannotationsannotationIdreplies
   */
  export function usePostapiannotationsannotationIdreplies(options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: unknown) => apiClient.postapiannotationsannotationIdreplies(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['data'] });
      },
      ...options
    });
  }

  /**
   * React Query hook for getws
   * Auto-manages caching and invalidation
   */
  export function useGetws(options?: QueryOptions) {
    const queryClient = useQueryClient();

    return useQuery({
      queryKey: ['getws'],
      queryFn: () => apiClient.getws(),
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