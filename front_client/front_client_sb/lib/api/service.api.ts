import { apiRequest } from './config';

// Types
export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number; // en minutes
  price: number;
  salonId: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategory {
  category: string;
  services: Service[];
}

// Service API
export const serviceApi = {
  /**
   * Get services by salon
   */
  async getServicesBySalon(salonId: string, activeOnly: boolean = true): Promise<Service[]> {
    const url = activeOnly
      ? `/services/salon/${salonId}?activeOnly=true`
      : `/services/salon/${salonId}`;
    const response = await apiRequest<{ data: Service[]; count: number; success: boolean }>(url);
    return response.data || [];
  },

  /**
   * Get services grouped by category
   */
  async getServicesByCategory(salonId: string): Promise<ServiceCategory[]> {
    const services = await this.getServicesBySalon(salonId);

    // Group services by category
    const grouped = services.reduce((acc: { [key: string]: Service[] }, service) => {
      const category = service.category || 'Autres';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    }, {});

    return Object.entries(grouped).map(([category, services]) => ({
      category,
      services,
    }));
  },

  /**
   * Get service categories for a salon
   */
  async getServiceCategories(salonId: string): Promise<string[]> {
    const response = await apiRequest<{ data: string[]; success: boolean }>(`/services/salon/${salonId}/categories`);
    return response.data || [];
  },

  /**
   * Get service by ID
   */
  async getServiceById(id: string): Promise<Service> {
    const response = await apiRequest<{ data: Service; success: boolean }>(`/services/${id}`);
    return response.data;
  },

  /**
   * Create a new service
   */
  async createService(data: Partial<Service>): Promise<Service> {
    const response = await apiRequest<{ data: Service; success: boolean }>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Update service
   */
  async updateService(id: string, data: Partial<Service>): Promise<Service> {
    const response = await apiRequest<{ data: Service; success: boolean }>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Delete service
   */
  async deleteService(id: string): Promise<void> {
    await apiRequest(`/services/${id}`, {
      method: 'DELETE',
    });
  },
};
