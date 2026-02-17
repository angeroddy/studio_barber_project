import api from './api';
import type { Salon } from './salon.service';


export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
  salons?: Salon[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// Service d'inscription
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
};

// Service de connexion
export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
};

// Service pour récupérer le profil de l'utilisateur connecté
export const getProfile = async (): Promise<{ success: boolean; data: User }> => {
  const response = await api.get<{ success: boolean; data: User }>('/auth/me');
  return response.data;
};

// Service de deconnexion
export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};


