/**
 * frontend/lib/api.ts
 * ===================
 * Base HTTP client configuration for GechExpress API with credentials and token support.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string[]> | string;
  };
}

export class ApiError extends Error {
  status: number;
  data: ApiErrorResponse;

  constructor(message: string, status: number, data: ApiErrorResponse) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers = {}, ...restOptions } = options;

  let url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  // Check token in localStorage
  let token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  // Clear any legacy mock token
  if (token && token.startsWith("mock_")) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    token = null;
  }

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
  };

  if (!(restOptions.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  // Only attach Bearer token if it's NOT a public auth endpoint
  const isPublicAuthRoute =
    endpoint.includes("/auth/login") ||
    endpoint.includes("/auth/register") ||
    endpoint.includes("/auth/google") ||
    endpoint.includes("/auth/password") ||
    endpoint.includes("/auth/verify-email") ||
    endpoint.includes("/settings/public");

  if (token && !isPublicAuthRoute) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      ...restOptions,
      credentials: "include", // Essential for httpOnly JWT cookie delivery
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    });
  } catch (networkError: any) {
    throw new ApiError(
      networkError?.message || "Failed to connect to server.",
      0,
      { success: false, message: "Unable to connect to the marketplace server. Please check your network connection." }
    );
  }

  // Handle 401 token refresh on client side
  if (response.status === 401 && typeof window !== "undefined" && !isPublicAuthRoute && !endpoint.includes("/auth/token/refresh")) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newToken = localStorage.getItem("access_token");
      const retryHeaders = {
        ...defaultHeaders,
        ...headers,
        ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
      };
      try {
        const retryResponse = await fetch(url, {
          ...restOptions,
          credentials: "include",
          headers: retryHeaders,
        });
        return handleResponse<T>(retryResponse);
      } catch (retryError: any) {
        throw new ApiError(
          retryError?.message || "Failed to connect to server on retry.",
          0,
          { success: false, message: "Network connection error during retry." }
        );
      }
    }
  }

  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    let message = "";

    // 1. Check for standard DRF 'errors' array or string
    if (Array.isArray(errorData?.errors)) {
      message = errorData.errors.join(" ");
    } else if (typeof errorData?.errors === "string") {
      message = errorData.errors;
    } 
    // 2. Check for standard DRF 'detail' or 'message'
    else if (errorData?.detail) {
      message = typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail);
    } else if (errorData?.message) {
      message = errorData.message;
    } else if (errorData?.error?.message) {
      message = errorData.error.message;
    } else if (errorData?.error?.details) {
      if (typeof errorData.error.details === "object") {
        message = Object.values(errorData.error.details).flat().join(" ");
      } else {
        message = String(errorData.error.details);
      }
    } 
    // 3. Check for DRF field validation dictionary (e.g. {"sku": ["..."], "title": ["..."]})
    else if (typeof errorData === "object" && errorData !== null) {
      const fieldErrors = Object.entries(errorData)
        .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(", ") : errs}`)
        .join(" | ");
      if (fieldErrors) {
        message = fieldErrors;
      }
    }

    if (!message) {
      message = `Request failed with status ${response.status}`;
    }

    throw new ApiError(message, response.status, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken || refreshToken.startsWith("mock_")) return false;

    const res = await fetch(`${API_URL}/auth/token/refresh/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.access) {
        localStorage.setItem("access_token", data.access);
        return true;
      }
    }
  } catch {
    // Refresh failed
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  }
  return false;
}

const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) => apiClient<T>(endpoint, { ...options, method: 'GET' }).then(data => ({ data })),
  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) => apiClient<T>(endpoint, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined, headers: { 'Content-Type': 'application/json', ...options?.headers } }).then(data => ({ data })),
  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) => apiClient<T>(endpoint, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined, headers: { 'Content-Type': 'application/json', ...options?.headers } }).then(data => ({ data })),
  delete: <T = any>(endpoint: string, options?: RequestOptions) => apiClient<T>(endpoint, { ...options, method: 'DELETE' }).then(data => ({ data })),
};

export default api;
