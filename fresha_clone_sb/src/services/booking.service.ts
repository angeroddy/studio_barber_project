import api from './api';

// Interface pour un Booking (Rendez-vous)
export interface Booking {
  id: string;
  salonId: string;
  staffId: string;
  serviceId: string;
  clientId: string;
  clientName?: string; // Deprecated - utiliser client.firstName + client.lastName
  clientEmail?: string;
  clientPhone?: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  staff?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  service?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
}

// Interface pour créer un rendez-vous
export interface CreateBookingData {
  salonId: string;
  staffId: string;
  serviceId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  startTime: string;
  endTime: string;
  status?: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
  notes?: string;
}

// Interface pour mettre à jour un rendez-vous
export interface UpdateBookingData {
  staffId?: string;
  serviceId?: string;
  startTime?: string;
  endTime?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
  notes?: string;
  duration?: number;
  price?: number;
}

// Interface pour la réponse API
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

/**
 * Créer un nouveau rendez-vous
 */
export const createBooking = async (data: CreateBookingData): Promise<Booking> => {
  const response = await api.post<ApiResponse<Booking>>('/bookings', data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la création du rendez-vous');
  }
  return response.data.data;
};

/**
 * Récupérer un rendez-vous par ID
 */
export const getBooking = async (id: string): Promise<Booking> => {
  const response = await api.get<ApiResponse<Booking>>(`/bookings/${id}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Rendez-vous introuvable');
  }
  return response.data.data;
};

/**
 * Récupérer tous les rendez-vous d'un salon
 */
export const getBookingsBySalon = async (
  salonId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    staffId?: string;
    status?: string;
  }
): Promise<Booking[]> => {
  const response = await api.get<ApiResponse<Booking[]>>(
    `/bookings/salon/${salonId}`,
    { params: filters }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la récupération des rendez-vous');
  }
  return response.data.data;
};

/**
 * Récupérer les rendez-vous d'un staff
 */
export const getBookingsByStaff = async (
  staffId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }
): Promise<Booking[]> => {
  const response = await api.get<ApiResponse<Booking[]>>(
    `/bookings/staff/${staffId}`,
    { params: filters }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la récupération des rendez-vous');
  }
  return response.data.data;
};

/**
 * Mettre à jour un rendez-vous
 */
export const updateBooking = async (
  id: string,
  data: UpdateBookingData
): Promise<Booking> => {
  const response = await api.put<ApiResponse<Booking>>(`/bookings/${id}`, data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la mise à jour du rendez-vous');
  }
  return response.data.data;
};

/**
 * Supprimer un rendez-vous
 */
export const deleteBooking = async (id: string): Promise<void> => {
  const response = await api.delete<ApiResponse<void>>(`/bookings/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Erreur lors de la suppression du rendez-vous');
  }
};

/**
 * Changer le statut d'un rendez-vous
 */
export const updateBookingStatus = async (
  id: string,
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED'
): Promise<Booking> => {
  const response = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/status`, {
    status,
  });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors du changement de statut');
  }
  return response.data.data;
};

/**
 * Vérifier la disponibilité pour un créneau
 */
export const checkAvailability = async (
  staffId: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): Promise<{ available: boolean; conflictingBookings?: Booking[] }> => {
  const response = await api.post<ApiResponse<{ available: boolean; conflictingBookings?: Booking[] }>>(
    '/bookings/check-availability',
    { staffId, startTime, endTime, excludeBookingId }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la vérification de la disponibilité');
  }
  return response.data.data;
};
