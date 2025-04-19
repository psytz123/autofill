/**
 * CSRF Token Management
 * Fetches and manages CSRF tokens for API requests
 */

// Store CSRF token in memory and localStorage
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
 * Register a CSRF token with the server
 * @param token The token to register
 */
async function registerTokenWithServer(token: string): Promise<void> {
  try {
    // Send a GET request to register the token with the server
    await fetch('/api/ping', {
      method: 'GET',
      headers: {
        'X-CSRF-Token': token,
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include'
    });
    
    // Store in localStorage for persistence across page reloads
    localStorage.setItem('csrfToken', token);
    
    console.log('CSRF token registered with server');
  } catch (error) {
    console.error('Failed to register CSRF token with server:', error);
    // If registration fails, reset the token so we'll try again next time
    csrfToken = null;
    localStorage.removeItem('csrfToken');
  }
}

/**
 * Initialize the CSRF token on application load
 */
export async function initCsrfToken(): Promise<void> {
  // Check for an existing token in localStorage
  const storedToken = localStorage.getItem('csrfToken');
  
  if (storedToken) {
    csrfToken = storedToken;
    // Re-register in case server has restarted
    await registerTokenWithServer(storedToken);
  } else {
    // Generate and register a new token
    const newToken = generateToken();
    csrfToken = newToken;
    await registerTokenWithServer(newToken);
  }
}

/**
 * Get the current CSRF token, generating a new one if needed
 * @returns The current CSRF token
 */
export function getCsrfToken(): string {
  if (!csrfToken) {
    // If no token is available, generate one and schedule registration
    csrfToken = generateToken();
    // Register the token asynchronously
    registerTokenWithServer(csrfToken).catch(console.error);
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
  localStorage.removeItem('csrfToken');
  // Generate and register a new token
  getCsrfToken();
}