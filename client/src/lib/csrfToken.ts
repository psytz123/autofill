/**
 * CSRF Token Management
 * Fetches and manages CSRF tokens for API requests
 */

// Store CSRF token in memory
let csrfToken: string | null = null;

/**
 * Generate a CSRF token for use in requests
 * @returns A random token string
 */
function generateToken(): string {
  // Generate a random token
  const random = new Uint8Array(16);
  window.crypto.getRandomValues(random);
  return Array.from(random)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get the current CSRF token, generating a new one if needed
 * @returns The current CSRF token
 */
export function getCsrfToken(): string {
  if (!csrfToken) {
    csrfToken = generateToken();
  }
  return csrfToken;
}

/**
 * Add CSRF token to headers for fetch requests
 * @param headers Existing headers object or undefined
 * @returns Headers object with CSRF token
 */
export function addCsrfHeader(headers: HeadersInit = {}): HeadersInit {
  const headersObj = new Headers(headers);
  headersObj.set('X-CSRF-Token', getCsrfToken());
  return headersObj;
}

/**
 * Reset the CSRF token (e.g., after a failed request)
 */
export function resetCsrfToken(): void {
  csrfToken = null;
}