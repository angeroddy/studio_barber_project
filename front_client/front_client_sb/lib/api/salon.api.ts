import { apiRequest } from './config';

// Types
export interface Salon {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email?: string;
  description?: string;
  image?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  schedules?: Schedule[];
}

export interface TimeSlot {
  id: string;
  scheduleId: string;
  startTime: string;
  endTime: string;
  order: number;
}

export interface Schedule {
  id: string;
  salonId: string;
  dayOfWeek: number;
  startTime?: string;
  endTime?: string;
  isClosed: boolean;
  timeSlots?: TimeSlot[];
}

export interface ClosedDay {
  id: string;
  salonId: string;
  date: string;
  reason?: string;
}

// Salon API Service
export const salonApi = {
  /**
   * Get all salons
   */
  async getAllSalons(options?: {
    includeSchedules?: boolean;
    minimal?: boolean;
  }): Promise<Salon[]> {
    const queryParams = new URLSearchParams();
    if (options?.includeSchedules) {
      queryParams.set('includeSchedules', 'true');
    }
    if (options?.minimal) {
      queryParams.set('minimal', 'true');
    }

    const query = queryParams.toString();
    const endpoint = query ? `/salons?${query}` : '/salons';

    const response = await apiRequest<{ data: Salon[]; success: boolean; pagination?: any }>(endpoint);
    return response.data || [];
  },

  /**
   * Get salon by ID
   */
  async getSalonById(id: string): Promise<Salon> {
    const response = await apiRequest<{ data: Salon; success: boolean }>(`/salons/${id}`);
    return response.data;
  },

  /**
   * Get salon by slug
   */
  async getSalonBySlug(slug: string): Promise<Salon> {
    const response = await apiRequest<{ data: Salon; success: boolean }>(`/salons/slug/${slug}`);
    return response.data;
  },

  /**
   * Get salons by owner ID
   */
  async getSalonsByOwner(ownerId: string): Promise<Salon[]> {
    const response = await apiRequest<{ data: Salon[]; success: boolean; pagination?: any }>(`/salons/owner/${ownerId}`);
    return response.data || [];
  },

  /**
   * Get my salons (authenticated user)
   */
  async getMySalons(): Promise<Salon[]> {
    const response = await apiRequest<{ data: Salon[]; success: boolean; pagination?: any }>('/salons/my-salons');
    return response.data || [];
  },

  /**
   * Create a new salon
   */
  async createSalon(data: Partial<Salon>): Promise<Salon> {
    const response = await apiRequest<{ data: Salon; success: boolean }>('/salons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Update salon
   */
  async updateSalon(id: string, data: Partial<Salon>): Promise<Salon> {
    const response = await apiRequest<{ data: Salon; success: boolean }>(`/salons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Delete salon
   */
  async deleteSalon(id: string): Promise<void> {
    await apiRequest(`/salons/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get salon schedules
   */
  async getSchedules(salonId: string): Promise<Schedule[]> {
    const response = await apiRequest<{ data: Schedule[]; success: boolean }>(`/salons/${salonId}/schedules`);
    return response.data || [];
  },

  /**
   * Get schedule by day
   */
  async getScheduleByDay(salonId: string, dayOfWeek: number): Promise<Schedule> {
    const response = await apiRequest<{ data: Schedule; success: boolean }>(`/salons/${salonId}/schedules/${dayOfWeek}`);
    return response.data;
  },

  /**
   * Create or update schedule
   */
  async upsertSchedule(salonId: string, data: Partial<Schedule>): Promise<Schedule> {
    const response = await apiRequest<{ data: Schedule; success: boolean }>(`/salons/${salonId}/schedules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Get closed days
   */
  async getClosedDays(salonId: string): Promise<ClosedDay[]> {
    const response = await apiRequest<{ data: ClosedDay[]; success: boolean; pagination?: any }>(`/salons/${salonId}/closed-days`);
    return response.data || [];
  },

  /**
   * Create closed day
   */
  async createClosedDay(salonId: string, data: { date: string; reason?: string }): Promise<ClosedDay> {
    const response = await apiRequest<{ data: ClosedDay; success: boolean }>(`/salons/${salonId}/closed-days`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Delete closed day
   */
  async deleteClosedDay(salonId: string, id: string): Promise<void> {
    await apiRequest(`/salons/${salonId}/closed-days/${id}`, {
      method: 'DELETE',
    });
  },
};
