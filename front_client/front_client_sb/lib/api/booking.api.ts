import { apiRequest } from './config';

// Types
export interface Booking {
  id: string;
  salonId: string;
  staffId: string;
  clientId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'COMPLETED';
  notes?: string;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  // Relations
  staff?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  service?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  salon?: {
    id: string;
    name: string;
    address: string;
  };
}

export interface CreateBookingData {
  salonId: string;
  staffId: string;
  serviceId: string;
  date: string;
  startTime: string;
  clientInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  notes?: string;
}

export interface AvailabilitySlot {
  time: string;
  available: boolean;
  staffId?: string;
}

export interface CheckAvailabilityData {
  salonId: string;
  serviceId: string;
  date: string;
  staffId?: string;
}

// Booking API
export const bookingApi = {
  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingData): Promise<Booking> {
    const response = await apiRequest<{ data: Booking; success: boolean }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<Booking> {
    const response = await apiRequest<{ data: Booking; success: boolean }>(`/bookings/${id}`);
    return response.data;
  },

  /**
   * Get bookings by salon
   */
  async getBookingsBySalon(salonId: string, params?: {
    date?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Booking[]> {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const endpoint = `/bookings/salon/${salonId}${queryString ? `?${queryString}` : ''}`;

    const response = await apiRequest<{ data: Booking[]; success: boolean; pagination?: any }>(endpoint);
    return response.data || [];
  },

  /**
   * Get bookings by staff
   */
  async getBookingsByStaff(staffId: string, params?: {
    date?: string;
    status?: string;
  }): Promise<Booking[]> {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = `/bookings/staff/${staffId}${queryString ? `?${queryString}` : ''}`;

    const response = await apiRequest<{ data: Booking[]; success: boolean; pagination?: any }>(endpoint);
    return response.data || [];
  },

  /**
   * Update booking
   */
  async updateBooking(id: string, data: Partial<Booking>): Promise<Booking> {
    const response = await apiRequest<{ data: Booking; success: boolean }>(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Update booking status
   */
  async updateBookingStatus(
    id: string,
    status: 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'COMPLETED'
  ): Promise<Booking> {
    const response = await apiRequest<{ data: Booking; success: boolean }>(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return response.data;
  },

  /**
   * Cancel booking
   */
  async cancelBooking(id: string): Promise<Booking> {
    return this.updateBookingStatus(id, 'CANCELED');
  },

  /**
   * Delete booking
   */
  async deleteBooking(id: string): Promise<void> {
    await apiRequest(`/bookings/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Check availability
   */
  async checkAvailability(data: CheckAvailabilityData): Promise<AvailabilitySlot[]> {
    const response = await apiRequest<{ data: AvailabilitySlot[]; success: boolean }>('/bookings/check-availability', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || [];
  },

  /**
   * Get available time slots for a specific date, salon, staff, and service
   */
  async getAvailableSlots(
    salonId: string,
    staffId: string,
    serviceId: string,
    date: string // Format: YYYY-MM-DD
  ): Promise<string[]> {
    const queryParams = new URLSearchParams({
      salonId,
      staffId,
      serviceId,
      date,
    });

    const response = await apiRequest<{ data: string[]; count: number; success: boolean }>(
      `/bookings/available-slots?${queryParams.toString()}`
    );
    return response.data || [];
  },
};

