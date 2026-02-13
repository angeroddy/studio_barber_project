import { apiRequest, setAuthToken, removeAuthToken, ApiResponse } from './config';

// Types
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

// Auth API Service
export const authApi = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.token) {
      setAuthToken(response.token);
    }

    return response;
  },

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.token) {
      setAuthToken(response.token);
    }

    return response;
  },

  /**
   * Get current user
   */
  async getMe(): Promise<{ user: User }> {
    return apiRequest<{ user: User }>('/auth/me');
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    removeAuthToken();
  },
};
