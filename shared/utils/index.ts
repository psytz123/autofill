/**
 * Shared Utilities Index
 * Exports all shared utilities for easy importing
 */

// Re-export all utilities
export * from './error-handling';
export * from './api-client';
export * from './navigation';
export * from './formatting';
export * from './validation';
export * from './storage';
export * from './analytics';

// Export a named namespace for each category
import * as ErrorHandling from './error-handling';
import * as ApiClient from './api-client';
import * as Navigation from './navigation';
import * as Formatting from './formatting';
import * as Validation from './validation';
import * as Storage from './storage';
import * as Analytics from './analytics';

// Export namespaces
export {
  ErrorHandling,
  ApiClient,
  Navigation,
  Formatting,
  Validation,
  Storage,
  Analytics
};

/**
 * Version of the shared utilities
 * Updating this when making changes helps track which version is in use
 */
export const UTILS_VERSION = '1.0.0';