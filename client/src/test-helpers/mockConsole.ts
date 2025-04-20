/**
 * Console mocking utility for tests
 * 
 * This module provides utility functions to mock console methods (log, warn, error, etc.)
 * during tests and capture their outputs.
 */

type ConsoleMethods = 'log' | 'warn' | 'error' | 'info' | 'debug';

/**
 * Mock console methods and capture their outputs
 * @param methods Array of console methods to mock
 * @returns Object with original methods and captured outputs
 */
export function mockConsole(methods: ConsoleMethods[] = ['log', 'warn', 'error']) {
  const originalMethods: Record<string, any> = {};
  const calls: Record<string, any[][]> = {};
  
  methods.forEach(method => {
    // Store original method
    originalMethods[method] = console[method];
    calls[method] = [];
    
    // Create mock
    console[method] = jest.fn((...args: any[]) => {
      calls[method].push(args);
    });
  });
  
  // Function to restore original methods
  const restore = () => {
    methods.forEach(method => {
      console[method] = originalMethods[method];
    });
  };
  
  return {
    calls,
    restore
  };
}

/**
 * Temporarily suppress console output during a function call
 * @param fn Function to call with suppressed console
 * @param methods Console methods to suppress
 * @returns Result of the function call
 */
export async function withSuppressedConsole<T>(
  fn: () => T | Promise<T>,
  methods: ConsoleMethods[] = ['log', 'warn', 'error', 'info', 'debug']
): Promise<T> {
  const mock = mockConsole(methods);
  
  try {
    const result = await fn();
    return result;
  } finally {
    mock.restore();
  }
}

/**
 * Capture console outputs during a function call
 * @param fn Function to call with captured console output
 * @param methods Console methods to capture
 * @returns Object with function result and captured console outputs
 */
export async function withCapturedConsole<T>(
  fn: () => T | Promise<T>,
  methods: ConsoleMethods[] = ['log', 'warn', 'error']
): Promise<{ result: T; consoleCalls: Record<string, any[][]> }> {
  const mock = mockConsole(methods);
  
  try {
    const result = await fn();
    return {
      result,
      consoleCalls: { ...mock.calls }
    };
  } finally {
    mock.restore();
  }
}