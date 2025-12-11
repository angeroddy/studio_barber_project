import api from './api';

// Interface pour un Salon complet
export interface Salon {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  zipCode: string;
  phone: string;
  email: string;
  ownerId: string;
  createdAt?: Date;
  updatedAt?: Date;
  owner?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    services: number;
    staff: number;
    clients: number;
    bookings: number;
  };
}

// Interface pour cr�er un salon
export interface CreateSalonData {
  name: string;
  address: string;
  city: string;
  zipCode: string;
  phone: string;
  email: string;
}

// Interface pour mettre � jour un salon
export interface UpdateSalonData {
  name?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
}

// Interface pour la r�ponse API
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  errors?: string[];
}

/**
 * Cr�er un nouveau salon
 */
export const createSalon = async (data: CreateSalonData): Promise<Salon> => {
  console.log('=== salon.service.ts: createSalon ===');
  console.log('Data:', data);

  try {
    const response = await api.post<ApiResponse<Salon>>('/salons', data);
    console.log('Response:', response.data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de la cr�ation du salon');
    }
    return response.data.data;
  } catch (error) {
    console.error('Erreur dans createSalon:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { errors?: string[] } } };
      if (axiosError.response?.data?.errors) {
        throw new Error(axiosError.response.data.errors.join(', '));
      }
    }
    throw error;
  }
};

/**
 * R�cup�rer un salon par ID
 */
export const getSalonById = async (id: string): Promise<Salon> => {
  const response = await api.get<ApiResponse<Salon>>(`/salons/${id}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Salon introuvable');
  }
  return response.data.data;
};

/**
 * R�cup�rer un salon par slug
 */
export const getSalonBySlug = async (slug: string): Promise<Salon> => {
  const response = await api.get<ApiResponse<Salon>>(`/salons/slug/${slug}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Salon introuvable');
  }
  return response.data.data;
};

/**
 * R�cup�rer tous les salons d'un propri�taire
 */
export const getSalonsByOwner = async (ownerId: string): Promise<Salon[]> => {
  const response = await api.get<ApiResponse<Salon[]>>(`/salons/owner/${ownerId}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la r�cup�ration des salons');
  }
  return response.data.data;
};

/**
 * R�cup�rer tous les salons du propri�taire connect�
 */
export const getMySalons = async (): Promise<Salon[]> => {
  console.log('=== salon.service.ts: getMySalons ===');

  try {
    const response = await api.get<ApiResponse<Salon[]>>('/salons/my-salons');
    console.log('Response:', response.data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de la r�cup�ration de vos salons');
    }
    return response.data.data;
  } catch (error) {
    console.error('Erreur dans getMySalons:', error);
    throw error;
  }
};

/**
 * Mettre � jour un salon
 */
export const updateSalon = async (
  id: string,
  data: UpdateSalonData
): Promise<Salon> => {
  console.log('=== salon.service.ts: updateSalon ===');
  console.log('ID:', id);
  console.log('Data:', data);

  try {
    const response = await api.put<ApiResponse<Salon>>(`/salons/${id}`, data);
    console.log('Response:', response.data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de la mise � jour du salon');
    }
    return response.data.data;
  } catch (error) {
    console.error('Erreur dans updateSalon:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { errors?: string[] } } };
      if (axiosError.response?.data?.errors) {
        throw new Error(axiosError.response.data.errors.join(', '));
      }
    }
    throw error;
  }
};

/**
 * Supprimer un salon
 */
export const deleteSalon = async (id: string): Promise<void> => {
  console.log('=== salon.service.ts: deleteSalon ===');
  console.log('ID:', id);

  try {
    const response = await api.delete<ApiResponse<void>>(`/salons/${id}`);
    console.log('Response:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Erreur lors de la suppression du salon');
    }
  } catch (error) {
    console.error('Erreur dans deleteSalon:', error);
    throw error;
  }
};
