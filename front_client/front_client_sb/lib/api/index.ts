// Export all API services
export * from './config';
export * from './auth.api';
export * from './salon.api';
export * from './service.api';
export * from './staff.api';
export * from './booking.api';

// Export all services as a single object
import { authApi } from './auth.api';
import { salonApi } from './salon.api';
import { serviceApi } from './service.api';
import { staffApi } from './staff.api';
import { bookingApi } from './booking.api';

export const api = {
  auth: authApi,
  salons: salonApi,
  services: serviceApi,
  staff: staffApi,
  bookings: bookingApi,
};
