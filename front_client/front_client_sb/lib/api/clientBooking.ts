import { apiRequest } from './config';

/**
 * Creer une reservation pour le client authentifie
 */
export async function createClientBooking(data: {
  salonId: string
  staffId?: string
  serviceId: string
  startTime: string  // ISO string
  notes?: string
}) {
  const response = await apiRequest<{
    success: boolean
    message: string
    data: any
  }>('/client-bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return response;
}

/**
 * Obtenir toutes les reservations du client authentifie
 */
export async function getClientBookings() {
  const response = await apiRequest<{
    success: boolean
    data: any[]
    count: number
  }>('/client-bookings');

  return response;
}

/**
 * Annuler une reservation
 */
export async function cancelClientBooking(bookingId: string) {
  const response = await apiRequest<{
    success: boolean
    message: string
    data: any
  }>(`/client-bookings/${bookingId}/cancel`, {
    method: 'POST',
  });

  return response;
}
