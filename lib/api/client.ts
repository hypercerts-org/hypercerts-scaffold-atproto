/**
 * Centralized API client for all fetch operations.
 * Provides consistent error handling, type safety, and request configuration.
 */

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "APIError";
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: RequestInit["body"] | Record<string, unknown>;
}

/**
 * Base API client for JSON requests
 */
export async function apiClient<T>(
  url: string,
  options?: RequestOptions
): Promise<T> {
  const { body, headers, ...restOptions } = options || {};

  const config: RequestInit = {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    config.body =
      typeof body === "string" ? body : JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorData: unknown;
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      errorData = await response.json();
      if (
        typeof errorData === "object" &&
        errorData !== null &&
        "error" in errorData
      ) {
        errorMessage = (errorData as { error: string }).error;
      }
    } catch {
      // Response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new APIError(response.status, errorMessage, errorData);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

/**
 * API client for FormData requests (file uploads, etc.)
 */
export async function apiClientFormData<T>(
  url: string,
  formData: FormData,
  options?: Omit<RequestInit, "body">
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    body: formData,
    ...options,
  });

  if (!response.ok) {
    let errorData: unknown;
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      errorData = await response.json();
      if (
        typeof errorData === "object" &&
        errorData !== null &&
        "error" in errorData
      ) {
        errorMessage = (errorData as { error: string }).error;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new APIError(response.status, errorMessage, errorData);
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

/**
 * API client for external APIs (no error transformation)
 */
export async function externalApiClient<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new APIError(
      response.status,
      `External API request failed: ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}
