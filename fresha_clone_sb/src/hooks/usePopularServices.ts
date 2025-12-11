import { useState, useEffect } from 'react';
import { getBookingsBySalon } from '../services/booking.service';
import { getServicesBySalon } from '../services/service.service';

export interface PopularService {
  id: string;
  name: string;
  currentMonth: number;
  lastMonth: number;
}

export const usePopularServices = (salonId: string) => {
  const [services, setServices] = useState<PopularService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPopularServices = async () => {
      if (!salonId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Dates de référence
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // Récupérer les services et les réservations
        const [allServices, bookingsCurrentMonth, bookingsLastMonth] = await Promise.all([
          getServicesBySalon(salonId, true),
          getBookingsBySalon(salonId, {
            startDate: currentMonthStart.toISOString(),
            endDate: currentMonthEnd.toISOString(),
          }),
          getBookingsBySalon(salonId, {
            startDate: lastMonthStart.toISOString(),
            endDate: lastMonthEnd.toISOString(),
          }),
        ]);

        // Compter les réservations par service
        const serviceCountsCurrentMonth: Record<string, number> = {};
        const serviceCountsLastMonth: Record<string, number> = {};

        bookingsCurrentMonth
          .filter(b => b.status !== 'CANCELLED' && b.serviceId)
          .forEach(booking => {
            serviceCountsCurrentMonth[booking.serviceId] =
              (serviceCountsCurrentMonth[booking.serviceId] || 0) + 1;
          });

        bookingsLastMonth
          .filter(b => b.status !== 'CANCELLED' && b.serviceId)
          .forEach(booking => {
            serviceCountsLastMonth[booking.serviceId] =
              (serviceCountsLastMonth[booking.serviceId] || 0) + 1;
          });

        // Créer la liste des services populaires
        const popularServices: PopularService[] = allServices
          .map(service => ({
            id: service.id,
            name: service.name,
            currentMonth: serviceCountsCurrentMonth[service.id] || 0,
            lastMonth: serviceCountsLastMonth[service.id] || 0,
          }))
          .filter(service => service.currentMonth > 0 || service.lastMonth > 0)
          .sort((a, b) => b.currentMonth - a.currentMonth)
          .slice(0, 5); // Top 5 services

        setServices(popularServices);
      } catch (err) {
        console.error('Erreur lors de la récupération des services populaires:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchPopularServices();
  }, [salonId]);

  return { services, loading, error };
};
