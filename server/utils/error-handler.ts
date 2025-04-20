import { log } from "../vite";

export interface ApiErrorOptions {
  message: string;
  statusCode: number;
  code?: string;
  data?: unknown;
  cause?: Error;
}

export interface ApiValidationError {
  message: string;
  field: string;
  code: string;
}

/**
 * Custom API error class for consistent error handling
 */
export class ApiError extends Error {
  statusCode: number;
  code: string;
  data?: unknown;
  cause?: Error;

  constructor(options: ApiErrorOptions) {
    super(options.message);
    this.name = "ApiError";
    this.statusCode = options.statusCode;
    this.code = options.code || "api_error";
    this.data = options.data;
    this.cause = options.cause;
  }

  /**
   * Creates an ApiError from a Response object
   */
  static async fromResponse(response: Response): Promise<ApiError> {
    let message = `API request failed with status ${response.status}`;
    let code = "api_error";
    let data: unknown;

    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const body = await response.json();
        if (body.message) message = body.message;
        if (body.code) code = body.code;
        data = body;
      } else {
        data = await response.text();
      }
    } catch (err) {
      // Unable to parse response, use default message
    }

    return new ApiError({
      message,
      statusCode: response.status,
      code,
      data,
    });
  }

  /**
   * Type guard for ApiError
   */
  static isApiError(error: unknown): error is ApiError {
    return (
      error instanceof Error &&
      error.name === "ApiError" &&
      typeof (error as any).statusCode === "number"
    );
  }
}

/**
 * Validation error for handling form/data validation errors
 */
export class ValidationError extends Error {
  errors: ApiValidationError[];

  constructor(message: string, errors?: ApiValidationError[]) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors || [];
  }

  static isValidationError(error: unknown): error is ValidationError {
    return (
      error instanceof Error &&
      error.name === "ValidationError" &&
      Array.isArray((error as any).errors)
    );
  }
}

/**
 * Authentication error for handling authentication failures
 */
export class AuthenticationError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }

  static isAuthenticationError(error: unknown): error is AuthenticationError {
    return error instanceof Error && error.name === "AuthenticationError";
  }
}

/**
 * Network error for handling network-related failures
 */
export class NetworkError extends Error {
  constructor(message = "Network error occurred", public cause?: Error) {
    super(message);
    this.name = "NetworkError";
  }

  static isNetworkError(error: unknown): error is NetworkError {
    return error instanceof Error && error.name === "NetworkError";
  }
}

/**
 * Rate limit error for handling API rate limiting
 */
export class RateLimitError extends Error {
  retryAfter?: number;

  constructor(message = "Rate limit exceeded", retryAfter?: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }

  static isRateLimitError(error: unknown): error is RateLimitError {
    return error instanceof Error && error.name === "RateLimitError";
  }
}

/**
 * Timeout error for handling request timeouts
 */
export class TimeoutError extends Error {
  constructor(message = "Request timed out") {
    super(message);
    this.name = "TimeoutError";
  }

  static isTimeoutError(error: unknown): error is TimeoutError {
    return error instanceof Error && error.name === "TimeoutError";
  }
}

/**
 * Not found error for handling resource not found errors
 */
export class NotFoundError extends Error {
  constructor(resource = "Resource", id?: string | number) {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    super(message);
    this.name = "NotFoundError";
  }

  static isNotFoundError(error: unknown): error is NotFoundError {
    return error instanceof Error && error.name === "NotFoundError";
  }
}

/**
 * Forbidden error for handling authorization failures
 */
export class ForbiddenError extends Error {
  constructor(message = "Access forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }

  static isForbiddenError(error: unknown): error is ForbiddenError {
    return error instanceof Error && error.name === "ForbiddenError";
  }
}

/**
 * Service unavailable error
 */
export class ServiceUnavailableError extends Error {
  constructor(service = "Service") {
    super(`${service} is currently unavailable. Please try again later.`);
    this.name = "ServiceUnavailableError";
  }

  static isServiceUnavailableError(
    error: unknown,
  ): error is ServiceUnavailableError {
    return error instanceof Error && error.name === "ServiceUnavailableError";
  }
}

/**
 * Global error handler function for Express middleware
 */
export function handleApiError(
  error: unknown,
  req: any,
  res: any,
  next: (err?: any) => void,
): void {
  if (ApiError.isApiError(error)) {
    res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
      data: error.data,
    });
  } else if (ValidationError.isValidationError(error)) {
    res.status(400).json({
      message: error.message,
      code: "validation_error",
      errors: error.errors,
    });
  } else if (AuthenticationError.isAuthenticationError(error)) {
    res.status(401).json({
      message: error.message,
      code: "authentication_error",
    });
  } else if (NotFoundError.isNotFoundError(error)) {
    res.status(404).json({
      message: error.message,
      code: "not_found",
    });
  } else if (ForbiddenError.isForbiddenError(error)) {
    res.status(403).json({
      message: error.message,
      code: "forbidden",
    });
  } else if (RateLimitError.isRateLimitError(error)) {
    const headers: Record<string, string> = {};
    if (error.retryAfter) {
      headers["Retry-After"] = error.retryAfter.toString();
    }
    res.status(429).set(headers).json({
      message: error.message,
      code: "rate_limit_exceeded",
    });
  } else if (TimeoutError.isTimeoutError(error)) {
    res.status(408).json({
      message: error.message,
      code: "request_timeout",
    });
  } else if (ServiceUnavailableError.isServiceUnavailableError(error)) {
    res.status(503).json({
      message: error.message,
      code: "service_unavailable",
    });
  } else if (NetworkError.isNetworkError(error)) {
    res.status(502).json({
      message: error.message,
      code: "network_error",
    });
  } else {
    // Unhandled errors
    const message = error instanceof Error ? error.message : String(error);
    log(`Unhandled API error: ${message}`, "error");
    
    // Don't expose internal error details in production
    if (process.env.NODE_ENV === "production") {
      res.status(500).json({
        message: "An unexpected error occurred",
        code: "internal_server_error",
      });
    } else {
      res.status(500).json({
        message: message,
        code: "internal_server_error",
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }
}

/**
 * HTTP client with automatic retry and error handling
 */
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries: number = 3,
  initialDelayMs: number = 1000,
): Promise<T> {
  let currentDelay = initialDelayMs;
  let attempt = 0;

  while (true) {
    try {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const opts = {
        ...options,
        signal: controller.signal,
      };
      
      const response = await fetch(url, opts);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Handle specific status codes
        switch (response.status) {
          case 401:
            throw new AuthenticationError("Authentication required");
          case 403:
            throw new ForbiddenError("Access forbidden");
          case 404:
            throw new NotFoundError("Resource");
          case 429:
            const retryAfter = response.headers.get("Retry-After");
            const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;
            throw new RateLimitError("Rate limit exceeded", retryAfterSeconds);
          case 503:
            throw new ServiceUnavailableError();
          default:
            throw await ApiError.fromResponse(response);
        }
      }
      
      // Parse the response based on content type
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json() as T;
      } else {
        // For non-JSON responses, return the text
        return await response.text() as unknown as T;
      }
    } catch (error: unknown) {
      // Handle abort errors (timeouts)
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new TimeoutError();
      }
      
      // Don't retry auth, validation, or not found errors
      if (
        AuthenticationError.isAuthenticationError(error) ||
        ValidationError.isValidationError(error) ||
        NotFoundError.isNotFoundError(error) ||
        ForbiddenError.isForbiddenError(error)
      ) {
        throw error;
      }
      
      // Check if we've exhausted our retries
      if (attempt > retries) {
        // Convert to NetworkError if it's not already a custom error
        if (
          !ApiError.isApiError(error) && 
          !RateLimitError.isRateLimitError(error) &&
          !TimeoutError.isTimeoutError(error) &&
          !ServiceUnavailableError.isServiceUnavailableError(error)
        ) {
          throw new NetworkError(
            error instanceof Error ? error.message : String(error),
            error instanceof Error ? error : undefined
          );
        }
        throw error;
      }
      
      // Add exponential backoff with jitter for retries
      const jitter = Math.random() * 0.3 * currentDelay;
      const delayWithJitter = currentDelay + jitter;
      
      // Log retry attempt
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Retrying after error: ${errorMessage}. Attempt ${attempt} of ${retries}`, "api");
      log(`Waiting ${Math.round(delayWithJitter / 1000)} seconds before next attempt`, "api");
      
      // Wait for the delay before retrying
      await new Promise(resolve => setTimeout(resolve, delayWithJitter));
      
      // Increase delay for next attempt
      currentDelay = Math.min(currentDelay * 2, 30000); // Max 30 seconds between retries
    }
  }
}