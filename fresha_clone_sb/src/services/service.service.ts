import api from './api';

// Interface pour un Service
export interface Service {
  id: string;
  salonId: string;
  name: string;
  description?: string;
  duration: number; // en minutes
  price: number;
  category: string;
  isActive: boolean;
  color?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface pour créer un service
export interface CreateServiceData {
  salonId: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category: string;
  isActive?: boolean;
  color?: string;
}

// Interface pour mettre à jour un service
export interface UpdateServiceData {
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
  category?: string;
  isActive?: boolean;
  color?: string;
}

// Interface pour la réponse API
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

/**
 * Créer un nouveau service
 */
export const createService = async (data: CreateServiceData): Promise<Service> => {
  const response = await api.post<ApiResponse<Service>>('/services', data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la création du service');
  }
  return response.data.data;
};

/**
 * Récupérer un service par ID
 */
export const getService = async (id: string): Promise<Service> => {
  const response = await api.get<ApiResponse<Service>>(`/services/${id}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Service introuvable');
  }
  return response.data.data;
};

/**
 * Récupérer tous les services d'un salon
 */
export const getServicesBySalon = async (
  salonId: string,
  activeOnly: boolean = false
): Promise<Service[]> => {
  const response = await api.get<ApiResponse<Service[]>>(
    `/services/salon/${salonId}`,
    { params: { activeOnly } }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la récupération des services');
  }
  return response.data.data;
};

/**
 * Récupérer les services par catégorie
 */
export const getServicesByCategory = async (
  salonId: string,
  category: string
): Promise<Service[]> => {
  const response = await api.get<ApiResponse<Service[]>>(
    `/services/salon/${salonId}/category/${category}`
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la récupération des services');
  }
  return response.data.data;
};

/**
 * Récupérer les catégories d'un salon
 */
export const getServiceCategories = async (salonId: string): Promise<string[]> => {
  const response = await api.get<ApiResponse<string[]>>(
    `/services/salon/${salonId}/categories`
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la récupération des catégories');
  }
  return response.data.data;
};

/**
 * Mettre à jour un service
 */
export const updateService = async (
  id: string,
  data: UpdateServiceData
): Promise<Service> => {
  console.log('=== service.service.ts: updateService ===');
  console.log('ID:', id);
  console.log('Data:', data);

  try {
    const response = await api.put<ApiResponse<Service>>(`/services/${id}`, data);
    console.log('Response:', response.data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de la mise à jour du service');
    }
    return response.data.data;
  } catch (error) {
    console.error('Erreur dans updateService:', error);
    throw error;
  }
};

/**
 * Supprimer un service
 */
export const deleteService = async (id: string): Promise<void> => {
  console.log('=== service.service.ts: deleteService ===');
  console.log('ID:', id);

  try {
    const response = await api.delete<ApiResponse<void>>(`/services/${id}`);
    console.log('Response:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Erreur lors de la suppression du service');
    }
  } catch (error) {
    console.error('Erreur dans deleteService:', error);
    throw error;
  }
};

/**
 * Activer/Désactiver un service
 */
export const toggleServiceStatus = async (
  id: string,
  isActive: boolean
): Promise<Service> => {
  const response = await api.patch<ApiResponse<Service>>(`/services/${id}/toggle`, {
    isActive,
  });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors du changement de statut');
  }
  return response.data.data;
};
