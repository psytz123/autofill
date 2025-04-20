/**
 * Mock Console Helper
 * Provides utilities to mock console methods for testing
 */

type ConsoleMethod = 'log' | 'error' | 'warn' | 'info' | 'debug';

/**
 * Create a mock for a console method
 * @param method The console method to mock
 * @returns Cleanup function to restore the original method
 */
export function mockConsoleMethod(method: ConsoleMethod) {
  const original = console[method];
  const mockFn = jest.fn();
  
  console[method] = mockFn;
  
  return {
    mock: mockFn,
    restore: () => {
      console[method] = original;
    },
    calls: () => mockFn.mock.calls,
    callCount: () => mockFn.mock.calls.length,
  };
}

/**
 * Mock multiple console methods at once
 * @param methods Array of console methods to mock
 * @returns Object with mocks and cleanup function
 */
export default function mockConsole(...methods: ConsoleMethod[]) {
  const mocks = methods.reduce((acc, method) => {
    acc[method] = mockConsoleMethod(method);
    return acc;
  }, {} as Record<ConsoleMethod, ReturnType<typeof mockConsoleMethod>>);
  
  // Restore all mocks
  const restore = () => {
    Object.values(mocks).forEach(mock => mock.restore());
  };
  
  return {
    ...mocks,
    restore,
  };
}