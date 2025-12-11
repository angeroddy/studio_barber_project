import api from './api';

// Interface pour un jour de fermeture (ClosedDay)
export interface ClosedDay {
  id: string;
  salonId: string;
  date: string; // Format ISO "YYYY-MM-DD"
  reason?: string;
}

// Interface pour créer un jour de fermeture
export interface CreateClosedDayData {
  date: string; // Format "YYYY-MM-DD"
  reason?: string;
}

// Interface pour mettre à jour un jour de fermeture
export interface UpdateClosedDayData {
  date?: string;
  reason?: string;
}

// Interface pour la réponse API
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

/**
 * Créer un jour de fermeture
 */
export const createClosedDay = async (
  salonId: string,
  data: CreateClosedDayData
): Promise<ClosedDay> => {
  const response = await api.post<ApiResponse<ClosedDay>>(
    `/salons/${salonId}/closed-days`,
    data
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la création du jour de fermeture');
  }
  return response.data.data;
};

/**
 * Récupérer tous les jours de fermeture d'un salon
 */
export const getClosedDaysBySalon = async (
  salonId: string,
  fromDate?: string
): Promise<ClosedDay[]> => {
  const params = fromDate ? { fromDate } : {};
  const response = await api.get<ApiResponse<ClosedDay[]>>(
    `/salons/${salonId}/closed-days`,
    { params }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la récupération des jours de fermeture');
  }
  return response.data.data;
};

/**
 * Récupérer un jour de fermeture par ID
 */
export const getClosedDayById = async (
  salonId: string,
  id: string
): Promise<ClosedDay> => {
  const response = await api.get<ApiResponse<ClosedDay>>(
    `/salons/${salonId}/closed-days/${id}`
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Jour de fermeture introuvable');
  }
  return response.data.data;
};

/**
 * Mettre à jour un jour de fermeture
 */
export const updateClosedDay = async (
  salonId: string,
  id: string,
  data: UpdateClosedDayData
): Promise<ClosedDay> => {
  const response = await api.put<ApiResponse<ClosedDay>>(
    `/salons/${salonId}/closed-days/${id}`,
    data
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la mise à jour du jour de fermeture');
  }
  return response.data.data;
};

/**
 * Supprimer un jour de fermeture
 */
export const deleteClosedDay = async (
  salonId: string,
  id: string
): Promise<void> => {
  const response = await api.delete<ApiResponse<void>>(
    `/salons/${salonId}/closed-days/${id}`
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Erreur lors de la suppression du jour de fermeture');
  }
};

/**
 * Supprimer les jours de fermeture passés
 */
export const deleteOldClosedDays = async (salonId: string): Promise<void> => {
  const response = await api.delete<ApiResponse<void>>(
    `/salons/${salonId}/closed-days/cleanup/old`
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Erreur lors du nettoyage des jours de fermeture');
  }
};

/**
 * Formater une date en format lisible français
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formater une date en format court
 */
export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
