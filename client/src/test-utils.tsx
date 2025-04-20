/**
 * Test Utilities for React Components
 * Provides helper functions and setup for testing React components
 */

import React, { PropsWithChildren } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom render function that includes global providers
interface CustomRenderOptions extends Omit<RenderOptions, 'queries'> {
  queryClient?: QueryClient;
  route?: string;
}

/**
 * Setup providers for testing
 */
export function TestProviders({ 
  children,
  queryClient
}: PropsWithChildren<{ queryClient?: QueryClient }>) {
  // Create a new QueryClient for each test
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
  
  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Custom render function with merged options and providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient, ...renderOptions } = options;
  
  return {
    user: userEvent.setup(),
    ...render(ui, {
      wrapper: ({ children }) => (
        <TestProviders queryClient={queryClient}>{children}</TestProviders>
      ),
      ...renderOptions,
    }),
  };
}

/**
 * Create a mock response for the fetch API
 */
export function mockFetchResponse(
  body: any, 
  status = 200, 
  headers = { 'Content-Type': 'application/json' }
) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

/**
 * Mock the fetch API in tests
 */
export function setupFetchMock() {
  const originalFetch = global.fetch;
  const mocks = new Map();
  
  // Mock fetch globally
  global.fetch = jest.fn(async (url, options) => {
    const urlStr = url.toString();
    const method = options?.method || 'GET';
    
    // Check if this URL+method combination has a mock
    const key = `${method}:${urlStr}`;
    if (mocks.has(key)) {
      const mockFn = mocks.get(key);
      return mockFn(url, options);
    }
    
    // If there's a wildcard mock, use it
    if (mocks.has('*')) {
      const mockFn = mocks.get('*');
      return mockFn(url, options);
    }
    
    // Otherwise, return a 404
    console.error(`No mock found for fetch: ${key}`);
    return mockFetchResponse({ error: 'Not found' }, 404);
  }) as jest.Mock;
  
  // Add a mock for a specific URL
  const addMock = (urlPattern: string | RegExp, method = 'GET', mockFn: any) => {
    const key = typeof urlPattern === 'string' ? `${method}:${urlPattern}` : urlPattern;
    mocks.set(key, mockFn);
  };
  
  // Add a default mock response for a URL
  const mockRoute = (urlPattern: string | RegExp, method = 'GET', responseBody: any, status = 200) => {
    addMock(urlPattern, method, () => mockFetchResponse(responseBody, status));
  };
  
  // Restore the original fetch
  const cleanup = () => {
    global.fetch = originalFetch;
  };
  
  return {
    addMock,
    mockRoute,
    cleanup,
  };
}

// Re-export testing library utilities for convenience
export * from '@testing-library/react';
export { userEvent };
export { default as mockConsole } from './test-helpers/mockConsole';