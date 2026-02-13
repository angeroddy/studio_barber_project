import { apiRequest } from './config';

/**
 * Créer une réservation pour le client authentifié
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
 * Obtenir toutes les réservations du client authentifié
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
 * Annuler une réservation
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

/**
 * Créer une réservation multi-services pour le client authentifié
 */
export async function createClientMultiServiceBooking(data: {
  salonId: string
  startTime: string  // ISO string
  services: Array<{
    serviceId: string
    staffId?: string
  }>
  notes?: string
}) {
  const response = await apiRequest<{
    success: boolean
    message: string
    data: any
  }>('/client-bookings/multi-services', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return response;
}
