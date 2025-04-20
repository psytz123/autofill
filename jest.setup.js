// Setup file for Jest

// Import @testing-library/jest-dom to add custom matchers for testing DOM elements
import '@testing-library/jest-dom';

// Mock window globals that might be used in components
global.window = Object.assign(global.window || {}, {
  __APP_VERSION__: '1.0.0-test',
  __STRIPE_PUBLIC_KEY__: 'fake_stripe_key',
  __GOOGLE_MAPS_API_KEY__: 'fake_google_maps_key',
});

// Mock the matchMedia API which is used by some components but not available in JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver which is used for lazy loading but not available in JSDOM
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
};

// Mock ResizeObserver which might be used for responsive components
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
};

// Suppress console errors and warnings during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  // Check if the warning is related to act() which is common in React tests 
  // and can be noisy
  if (
    args[0] && 
    typeof args[0] === 'string' && 
    args[0].includes('Warning: An update to') && 
    args[0].includes('inside a test was not wrapped in act')
  ) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  // Similarly, suppress specific warnings that might be noisy during tests
  if (
    args[0] && 
    typeof args[0] === 'string' && 
    (args[0].includes('Warning: React does not recognize the') || 
     args[0].includes('Warning: The tag'))
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

// Clean up mocks after all tests
afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});