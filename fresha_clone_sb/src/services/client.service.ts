import api from './api';

// Interface pour un Client
export interface Client {
  id: string;
  salonId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  notes?: string;
  marketing: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  _count?: {
    bookings: number;
  };
  salon?: {
    id: string;
    name: string;
    slug: string;
  };
}

// Interface pour créer un client
export interface CreateClientData {
  salonId?: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone: string;
  notes?: string;
  marketing?: boolean;
}

// Interface pour mettre à jour un client
export interface UpdateClientData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  notes?: string;
  marketing?: boolean;
  password?: string;
}

// Interface pour la réponse API
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  clients?: T;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

/**
 * Créer un nouveau client
 */
export const createClient = async (data: CreateClientData): Promise<Client> => {
  try {
    const response = await api.post<ApiResponse<Client>>('/clients', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de la creation du client');
    }
    return response.data.data;
  } catch (error: any) {
    const apiMessage =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      (Array.isArray(error?.response?.data?.errors) && error.response.data.errors.length > 0
        ? error.response.data.errors[0]?.msg || error.response.data.errors[0]
        : null);

    throw new Error(apiMessage || 'Erreur lors de la creation du client');
  }
};
/**
 * Récupérer un client par ID
 */
export const getClient = async (id: string): Promise<Client> => {
  const response = await api.get<ApiResponse<Client>>(`/clients/${id}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Client introuvable');
  }
  return response.data.data;
};

/**
 * Récupérer un client par email
 */
export const getClientByEmail = async (email: string): Promise<Client> => {
  const response = await api.get<ApiResponse<Client>>(`/clients/email/${email}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Client introuvable');
  }
  return response.data.data;
};

/**
 * Récupérer les clients par téléphone
 */
export const getClientsByPhone = async (phone: string): Promise<Client[]> => {
  const response = await api.get<ApiResponse<Client[]>>(`/clients/phone/${phone}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la récupération des clients');
  }
  return response.data.data;
};

/**
 * Récupérer tous les clients d'un salon
 */
export const getClientsBySalon = async (
  salonId: string,
  minimal: boolean = false
): Promise<Client[]> => {
  const response = await api.get<ApiResponse<Client[]>>(`/clients/salon/${salonId}`, {
    params: {
      minimal: minimal ? 'true' : undefined,
    },
  });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la récupération des clients');
  }
  return response.data.data;
};

/**
 * Récupérer tous les clients avec pagination
 */
export const getAllClients = async (
  page: number = 1,
  limit: number = 20
): Promise<{ clients: Client[]; total: number; page: number; limit: number; totalPages: number }> => {
  const response = await api.get<ApiResponse<Client[]>>('/clients', {
    params: { page, limit }
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erreur lors de la récupération des clients');
  }

  return {
    clients: response.data.clients || [],
    total: response.data.total || 0,
    page: response.data.page || 1,
    limit: response.data.limit || 20,
    totalPages: response.data.totalPages || 0
  };
};

/**
 * Rechercher des clients
 */
export const searchClients = async (
  searchTerm: string,
  salonId?: string,
  page: number = 1,
  limit: number = 20
): Promise<{ clients: Client[]; total: number; page: number; limit: number; totalPages: number }> => {
  const params: any = { q: searchTerm, page, limit };
  if (salonId) {
    params.salonId = salonId;
  }

  const response = await api.get<ApiResponse<Client[]>>('/clients/search', { params });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erreur lors de la recherche des clients');
  }

  return {
    clients: response.data.clients || [],
    total: response.data.total || 0,
    page: response.data.page || 1,
    limit: response.data.limit || 20,
    totalPages: response.data.totalPages || 0
  };
};

/**
 * Mettre à jour un client
 */
export const updateClient = async (
  id: string,
  data: UpdateClientData
): Promise<Client> => {
  console.log('=== client.service.ts: updateClient ===');
  console.log('ID:', id);
  console.log('Data:', data);

  try {
    const response = await api.put<ApiResponse<Client>>(`/clients/${id}`, data);
    console.log('Response:', response.data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de la mise à jour du client');
    }
    return response.data.data;
  } catch (error) {
    console.error('Erreur dans updateClient:', error);
    throw error;
  }
};

/**
 * Supprimer un client
 */
export const deleteClient = async (id: string): Promise<void> => {
  console.log('=== client.service.ts: deleteClient ===');
  console.log('ID:', id);

  try {
    const response = await api.delete<ApiResponse<void>>(`/clients/${id}`);
    console.log('Response:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Erreur lors de la suppression du client');
    }
  } catch (error) {
    console.error('Erreur dans deleteClient:', error);
    throw error;
  }
};

