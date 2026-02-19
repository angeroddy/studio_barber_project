import { apiRequest } from './config';
import { resolveSalonId } from './salon-id.util';

// Types
export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  salonId: string;
  role: string;
  specialties?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffSchedule {
  id: string;
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

// Staff API
export const staffApi = {
  /**
   * Get staff by salon
   */
  async getStaffBySalon(salonId: string, activeOnly: boolean = true): Promise<Staff[]> {
    const resolvedSalonId = await resolveSalonId(salonId);
    const url = activeOnly
      ? `/staff/salon/${resolvedSalonId}?activeOnly=true`
      : `/staff/salon/${resolvedSalonId}`;
    const response = await apiRequest<{ data: Staff[]; count: number; success: boolean }>(url);
    return response.data || [];
  },

  /**
   * Get staff by role
   */
  async getStaffByRole(salonId: string, role: string): Promise<Staff[]> {
    const resolvedSalonId = await resolveSalonId(salonId);
    const response = await apiRequest<{ data: Staff[]; count: number; success: boolean }>(`/staff/salon/${resolvedSalonId}/role/${role}`);
    return response.data || [];
  },

  /**
   * Get staff specialties for a salon
   */
  async getStaffSpecialties(salonId: string): Promise<string[]> {
    const resolvedSalonId = await resolveSalonId(salonId);
    const response = await apiRequest<{ data: string[]; success: boolean }>(`/staff/salon/${resolvedSalonId}/specialties`);
    return response.data || [];
  },

  /**
   * Get staff by ID
   */
  async getStaffById(id: string): Promise<Staff> {
    const response = await apiRequest<{ data: Staff; success: boolean }>(`/staff/${id}`);
    return response.data;
  },

  /**
   * Create staff member
   */
  async createStaff(data: Partial<Staff>): Promise<Staff> {
    const response = await apiRequest<{ data: Staff; success: boolean }>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Update staff member
   */
  async updateStaff(id: string, data: Partial<Staff>): Promise<Staff> {
    const response = await apiRequest<{ data: Staff; success: boolean }>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Delete staff member
   */
  async deleteStaff(id: string): Promise<void> {
    await apiRequest(`/staff/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get staff schedules
   */
  async getStaffSchedules(staffId: string): Promise<StaffSchedule[]> {
    const response = await apiRequest<{ data: StaffSchedule[]; success: boolean }>(`/staff/${staffId}/schedules`);
    return response.data || [];
  },
};
