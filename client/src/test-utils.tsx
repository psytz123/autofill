/**
 * Custom React Testing Library utilities for component testing
 */
import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/hooks/use-auth';
import { withCapturedConsole } from './test-helpers/mockConsole';

/**
 * Custom renderer that includes common providers (TanStack Query, Auth)
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  queryClient?: QueryClient;
  authContext?: {
    user: any;
    isLoading: boolean;
    error: Error | null;
    loginMutation: any;
    logoutMutation: any;
    registerMutation: any;
  };
}

/**
 * Create a new query client for testing
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        networkMode: 'always',
      },
      mutations: {
        retry: false,
        networkMode: 'always',
      },
    },
    logger: {
      // Silence react-query errors in tests
      log: console.log,
      warn: console.warn,
      error: () => {},
    },
  });
}

/**
 * Mock global fetch for testing
 */
export function mockFetch(data: any, status = 200): void {
  global.fetch = jest.fn().mockImplementation((url, options) => {
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });
  });
}

/**
 * Custom render function with providers
 */
export function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const {
    initialRoute = '/',
    queryClient = createTestQueryClient(),
    authContext = {
      user: null,
      isLoading: false,
      error: null,
      loginMutation: {
        mutate: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      },
      logoutMutation: {
        mutate: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      },
      registerMutation: {
        mutate: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      },
    },
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    // Mock the useLocation hook to simulate the current route
    jest.mock('wouter', () => ({
      ...jest.requireActual('wouter'),
      useLocation: () => [initialRoute],
    }));

    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authContext}>
          {children}
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Utility to render a component with captured console output
 */
export async function renderWithCapturedConsole(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  let renderResult: RenderResult | null = null;

  const { result, consoleCalls } = await withCapturedConsole(() => {
    renderResult = customRender(ui, options);
    return renderResult;
  });

  return {
    ...result,
    consoleCalls,
  };
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };