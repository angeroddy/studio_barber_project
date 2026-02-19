import { useState, useEffect } from 'react';
import { getBookingsBySalon } from '../services/booking.service';
import { getClientsBySalon } from '../services/client.service';

export interface DashboardMetrics {
  newClientsWeek: number;
  newClientsWeekChange: number;
  bookingsToday: number;
  bookingsTodayChange: number;
  revenueToday: number;
  revenueTodayChange: number;
  occupancyRateToday: number;
  occupancyRateTodayChange: number;
}

export const useDashboardMetrics = (salonId: string) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    newClientsWeek: 0,
    newClientsWeekChange: 0,
    bookingsToday: 0,
    bookingsTodayChange: 0,
    revenueToday: 0,
    revenueTodayChange: 0,
    occupancyRateToday: 0,
    occupancyRateTodayChange: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!salonId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Dates de référence
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(todayEnd);
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);

        const lastWeekStart = new Date(weekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(weekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

        // Récupérer les rendez-vous
        const [bookingsToday, bookingsYesterday] = await Promise.all([
          getBookingsBySalon(salonId, {
            startDate: todayStart.toISOString(),
            endDate: todayEnd.toISOString(),
          }),
          getBookingsBySalon(salonId, {
            startDate: yesterdayStart.toISOString(),
            endDate: yesterdayEnd.toISOString(),
          }),
        ]);

        // Récupérer les clients
        const clients = await getClientsBySalon(salonId);

        // Calculer les nouveaux clients de la semaine
        const newClientsWeek = clients.filter(client => {
          if (!client.createdAt) return false;
          const createdDate = new Date(client.createdAt);
          return createdDate >= weekStart && createdDate <= now;
        }).length;

        const newClientsLastWeek = clients.filter(client => {
          if (!client.createdAt) return false;
          const createdDate = new Date(client.createdAt);
          return createdDate >= lastWeekStart && createdDate <= lastWeekEnd;
        }).length;

        const newClientsWeekChange = newClientsLastWeek > 0
          ? ((newClientsWeek - newClientsLastWeek) / newClientsLastWeek) * 100
          : newClientsWeek > 0 ? 100 : 0;

        // Calculer les réservations du jour
        const bookingsTodayCount = bookingsToday.filter(
          b => b.status !== 'CANCELED'
        ).length;
        const bookingsYesterdayCount = bookingsYesterday.filter(
          b => b.status !== 'CANCELED'
        ).length;

        const bookingsTodayChange = bookingsYesterdayCount > 0
          ? ((bookingsTodayCount - bookingsYesterdayCount) / bookingsYesterdayCount) * 100
          : bookingsTodayCount > 0 ? 100 : 0;

        // Calculer le chiffre d'affaires du jour
        const revenueToday = bookingsToday
          .filter(b => b.status !== 'CANCELED')
          .reduce((sum, booking) => sum + Number(booking.service?.price || 0), 0);

        const revenueYesterday = bookingsYesterday
          .filter(b => b.status !== 'CANCELED')
          .reduce((sum, booking) => sum + Number(booking.service?.price || 0), 0);

        const revenueTodayChange = revenueYesterday > 0
          ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100
          : revenueToday > 0 ? 100 : 0;

        // Calculer le taux d'occupation (hypothèse : 8h de travail par jour, 60 min par heure = 480 min)
        const totalAvailableMinutes = 480; // 8 heures * 60 minutes
        const totalBookedMinutes = bookingsToday
          .filter(b => b.status !== 'CANCELED')
          .reduce((sum, booking) => sum + Number(booking.service?.duration || 0), 0);

        const occupancyRateToday = totalAvailableMinutes > 0
          ? (totalBookedMinutes / totalAvailableMinutes) * 100
          : 0;

        const totalBookedMinutesYesterday = bookingsYesterday
          .filter(b => b.status !== 'CANCELED')
          .reduce((sum, booking) => sum + Number(booking.service?.duration || 0), 0);

        const occupancyRateYesterday = totalAvailableMinutes > 0
          ? (totalBookedMinutesYesterday / totalAvailableMinutes) * 100
          : 0;

        const occupancyRateTodayChange = occupancyRateYesterday > 0
          ? ((occupancyRateToday - occupancyRateYesterday) / occupancyRateYesterday) * 100
          : occupancyRateToday > 0 ? 100 : 0;

        setMetrics({
          newClientsWeek,
          newClientsWeekChange,
          bookingsToday: bookingsTodayCount,
          bookingsTodayChange,
          revenueToday,
          revenueTodayChange,
          occupancyRateToday,
          occupancyRateTodayChange,
        });
      } catch (err) {
        console.error('Erreur lors de la récupération des métriques:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [salonId]);

  return { metrics, loading, error };
};

