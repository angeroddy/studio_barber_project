import api from './api';

// Interface pour les horaires de travail du staff
export interface StaffSchedule {
  id: string;
  staffId: string;
  dayOfWeek: number; // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  startTime: string; // Format "HH:mm"
  endTime: string;   // Format "HH:mm"
  isAvailable: boolean;
}

// Interface pour un Staff
export interface Staff {
  id: string;
  salonId: string;
  email?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'MANAGER' | 'EMPLOYEE';
  specialties: string[];
  bio?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  schedules?: StaffSchedule[]; // Horaires de travail hebdomadaires
  _count?: {
    bookings: number;
  };
}

// Interface pour créer un staff
export interface CreateStaffData {
  salonId: string;
  email?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role?: 'MANAGER' | 'EMPLOYEE';
  specialties?: string[];
  bio?: string;
  isActive?: boolean;
}

// Interface pour mettre à jour un staff
export interface UpdateStaffData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role?: 'MANAGER' | 'EMPLOYEE';
  specialties?: string[];
  bio?: string;
  isActive?: boolean;
}

// Interface pour la réponse API
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

/**
 * Créer un nouveau membre du personnel
 */
export const createStaff = async (data: CreateStaffData): Promise<Staff> => {
  const response = await api.post<ApiResponse<Staff>>('/staff', data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la création du membre du personnel');
  }
  return response.data.data;
};

/**
 * Récupérer un membre du personnel par ID
 */
export const getStaff = async (id: string): Promise<Staff> => {
  const response = await api.get<ApiResponse<Staff>>(`/staff/${id}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Membre du personnel introuvable');
  }
  return response.data.data;
};

/**
 * Récupérer tout le personnel d'un salon
 */
export const getStaffBySalon = async (
  salonId: string,
  activeOnly: boolean = false,
  lite: boolean = false
): Promise<Staff[]> => {
  const response = await api.get<ApiResponse<Staff[]>>(
    `/staff/salon/${salonId}`,
    { params: { activeOnly, lite: lite ? 'true' : undefined } }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la récupération du personnel');
  }
  return response.data.data;
};

/**
 * Récupérer le personnel par rôle
 */
export const getStaffByRole = async (
  salonId: string,
  role: 'MANAGER' | 'EMPLOYEE'
): Promise<Staff[]> => {
  const response = await api.get<ApiResponse<Staff[]>>(
    `/staff/salon/${salonId}/role/${role}`
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la récupération du personnel');
  }
  return response.data.data;
};

/**
 * Récupérer les spécialités d'un salon
 */
export const getStaffSpecialties = async (salonId: string): Promise<string[]> => {
  const response = await api.get<ApiResponse<string[]>>(
    `/staff/salon/${salonId}/specialties`
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la récupération des spécialités');
  }
  return response.data.data;
};

/**
 * Récupérer le personnel disponible pour une date
 */
export const getAvailableStaff = async (
  salonId: string,
  date: string,
  specialty?: string
): Promise<Staff[]> => {
  const response = await api.get<ApiResponse<Staff[]>>(
    `/staff/salon/${salonId}/available`,
    { params: { date, specialty } }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la récupération du personnel disponible');
  }
  return response.data.data;
};

/**
 * Mettre à jour un membre du personnel
 */
export const updateStaff = async (
  id: string,
  data: UpdateStaffData
): Promise<Staff> => {
  console.log('=== staff.service.ts: updateStaff ===');
  console.log('ID:', id);
  console.log('Data:', data);

  try {
    const response = await api.put<ApiResponse<Staff>>(`/staff/${id}`, data);
    console.log('Response:', response.data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de la mise à jour du membre du personnel');
    }
    return response.data.data;
  } catch (error) {
    console.error('Erreur dans updateStaff:', error);
    throw error;
  }
};

/**
 * Supprimer un membre du personnel
 */
export const deleteStaff = async (id: string): Promise<void> => {
  console.log('=== staff.service.ts: deleteStaff ===');
  console.log('ID:', id);

  try {
    const response = await api.delete<ApiResponse<void>>(`/staff/${id}`);
    console.log('Response:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Erreur lors de la suppression du membre du personnel');
    }
  } catch (error) {
    console.error('Erreur dans deleteStaff:', error);
    throw error;
  }
};

/**
 * Activer/Désactiver un membre du personnel
 */
export const toggleStaffStatus = async (
  id: string,
  isActive: boolean
): Promise<Staff> => {
  const response = await api.patch<ApiResponse<Staff>>(`/staff/${id}/toggle`, {
    isActive,
  });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors du changement de statut');
  }
  return response.data.data;
};

// ============= STAFF SCHEDULES =============

/**
 * Créer ou mettre à jour un horaire pour un jour spécifique
 */
export const upsertStaffSchedule = async (
  staffId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  isAvailable: boolean = true
): Promise<StaffSchedule> => {
  const response = await api.post<ApiResponse<StaffSchedule>>(
    `/staff/${staffId}/schedules`,
    { dayOfWeek, startTime, endTime, isAvailable }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la sauvegarde de l\'horaire');
  }
  return response.data.data;
};

/**
 * Récupérer tous les horaires d'un membre du staff
 */
export const getStaffSchedules = async (staffId: string): Promise<StaffSchedule[]> => {
  const response = await api.get<ApiResponse<StaffSchedule[]>>(`/staff/${staffId}/schedules`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la récupération des horaires');
  }
  return response.data.data;
};

/**
 * Supprimer un horaire spécifique
 */
export const deleteStaffSchedule = async (staffId: string, scheduleId: string): Promise<void> => {
  const response = await api.delete<ApiResponse<void>>(`/staff/${staffId}/schedules/${scheduleId}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Erreur lors de la suppression de l\'horaire');
  }
};

/**
 * Supprimer tous les horaires d'un jour spécifique
 */
export const deleteStaffSchedulesByDay = async (staffId: string, dayOfWeek: number): Promise<void> => {
  const response = await api.delete<ApiResponse<void>>(`/staff/${staffId}/schedules/day`, {
    data: { dayOfWeek }
  });
  if (!response.data.success) {
    throw new Error(response.data.message || 'Erreur lors de la suppression des horaires');
  }
};

/**
 * Créer/Mettre à jour tous les horaires (batch - tous les jours de la semaine)
 */
export const batchUpsertStaffSchedules = async (
  staffId: string,
  schedules: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>
): Promise<StaffSchedule[]> => {
  const response = await api.post<ApiResponse<StaffSchedule[]>>(
    `/staff/${staffId}/schedules/batch`,
    { schedules }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la sauvegarde des horaires');
  }
  return response.data.data;
};

/**
 * Créer/Mettre à jour plusieurs plages horaires pour un jour spécifique
 * Permet de gérer plusieurs time slots par jour
 */
export const upsertStaffSchedulesForDay = async (
  staffId: string,
  dayOfWeek: number,
  timeSlots: Array<{
    startTime: string;
    endTime: string;
    isAvailable?: boolean;
  }>
): Promise<StaffSchedule[]> => {
  const response = await api.post<ApiResponse<StaffSchedule[]>>(
    `/staff/${staffId}/schedules/day`,
    { dayOfWeek, timeSlots }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Erreur lors de la sauvegarde des horaires');
  }
  return response.data.data;
};
