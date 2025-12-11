import api from './api';

// Interface pour un horaire (Schedule)
export interface Schedule {
  id: string;
  salonId: string;
  dayOfWeek: number; // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  openTime: string;  // Format "HH:mm"
  closeTime: string; // Format "HH:mm"
  isClosed: boolean;
}

// Interface pour créer/mettre à jour un horaire
export interface UpsertScheduleData {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

// Interface pour la réponse API
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

/**
 * Créer ou mettre à jour un horaire
 */
export const upsertSchedule = async (
  salonId: string,
  data: UpsertScheduleData
): Promise<Schedule> => {
  const response = await api.post<ApiResponse<Schedule>>(
    `/salons/${salonId}/schedules`,
    data
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de l\'enregistrement de l\'horaire');
  }
  return response.data.data;
};

/**
 * Récupérer tous les horaires d'un salon
 */
export const getSchedulesBySalon = async (salonId: string): Promise<Schedule[]> => {
  const response = await api.get<ApiResponse<Schedule[]>>(
    `/salons/${salonId}/schedules`
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la récupération des horaires');
  }
  return response.data.data;
};

/**
 * Récupérer l'horaire d'un jour spécifique
 */
export const getScheduleByDay = async (
  salonId: string,
  dayOfWeek: number
): Promise<Schedule | null> => {
  try {
    const response = await api.get<ApiResponse<Schedule>>(
      `/salons/${salonId}/schedules/${dayOfWeek}`
    );
    if (!response.data.success || !response.data.data) {
      return null;
    }
    return response.data.data;
  } catch (error) {
    return null;
  }
};

/**
 * Mettre à jour un horaire
 */
export const updateSchedule = async (
  salonId: string,
  dayOfWeek: number,
  data: Partial<UpsertScheduleData>
): Promise<Schedule> => {
  const response = await api.put<ApiResponse<Schedule>>(
    `/salons/${salonId}/schedules/${dayOfWeek}`,
    data
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la mise à jour de l\'horaire');
  }
  return response.data.data;
};

/**
 * Supprimer un horaire
 */
export const deleteSchedule = async (
  salonId: string,
  dayOfWeek: number
): Promise<void> => {
  const response = await api.delete<ApiResponse<void>>(
    `/salons/${salonId}/schedules/${dayOfWeek}`
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Erreur lors de la suppression de l\'horaire');
  }
};

/**
 * Créer les horaires par défaut pour un salon
 */
export const createDefaultSchedules = async (salonId: string): Promise<void> => {
  const response = await api.post<ApiResponse<void>>(
    `/salons/${salonId}/schedules/default`
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Erreur lors de la création des horaires par défaut');
  }
};

// Utilitaire pour obtenir le nom du jour en français
export const getDayName = (dayOfWeek: number): string => {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[dayOfWeek] || '';
};

// Utilitaire pour obtenir le nom du jour abrégé
export const getShortDayName = (dayOfWeek: number): string => {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return days[dayOfWeek] || '';
};
