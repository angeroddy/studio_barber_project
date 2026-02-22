// API Configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// Helper function to get auth token
export const getAuthToken = (): string | null => {
  return null;
};

// Helper function to set auth token
export const setAuthToken = (_token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
};

// Helper function to remove auth token
export const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
};

// Default headers for API requests
export const getDefaultHeaders = (options: RequestInit = {}): HeadersInit => {
  const headers: Record<string, string> = {};
  const method = (options.method || 'GET').toUpperCase();
  const hasBody = options.body !== undefined && options.body !== null;
  const contentTypeAlreadySet = hasHeader(options.headers, 'Content-Type');
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  // Keep CORS requests simple: do not force JSON content-type on body-less GET/HEAD.
  if (
    hasBody &&
    method !== 'GET' &&
    method !== 'HEAD' &&
    !contentTypeAlreadySet &&
    !isFormData
  ) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

function hasHeader(headers: HeadersInit | undefined, headerName: string): boolean {
  if (!headers) return false;

  const normalizedHeaderName = headerName.toLowerCase();

  if (headers instanceof Headers) {
    return headers.has(headerName);
  }

  if (Array.isArray(headers)) {
    return headers.some(([key]) => key.toLowerCase() === normalizedHeaderName);
  }

  return Object.keys(headers).some(
    (key) => key.toLowerCase() === normalizedHeaderName
  );
}

// API Response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic API request function
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      ...getDefaultHeaders(options),
      ...options.headers,
    },
    credentials: 'include',
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || data.message || 'Une erreur est survenue',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Erreur de connexion au serveur');
  }
}
