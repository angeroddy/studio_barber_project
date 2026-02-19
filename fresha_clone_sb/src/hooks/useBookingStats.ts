import { useState, useEffect } from 'react';
import { getBookingsBySalon } from '../services/booking.service';
import { getClientsBySalon } from '../services/client.service';

export interface BookingStats {
  statusCounts: Record<string, number>;
  totalBookings: number;
  cancelRate: number;
  noShowRate: number;
  averageBasketSize: number;
  hourlyDistribution: number[];
  clientRetentionRate: number;
  returningClients: number;
  totalClients: number;
  currentMonthRevenue: number;
}

export const useBookingStats = (salonId: string) => {
  const [stats, setStats] = useState<BookingStats>({
    statusCounts: {},
    totalBookings: 0,
    cancelRate: 0,
    noShowRate: 0,
    averageBasketSize: 0,
    hourlyDistribution: new Array(24).fill(0),
    clientRetentionRate: 0,
    returningClients: 0,
    totalClients: 0,
    currentMonthRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!salonId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const [bookings, clients] = await Promise.all([
          getBookingsBySalon(salonId, {
            startDate: monthStart.toISOString(),
            endDate: monthEnd.toISOString(),
          }),
          getClientsBySalon(salonId),
        ]);

        const totalBookings = bookings.length;

        // Status counts
        const statusCounts: Record<string, number> = {};
        bookings.forEach(b => {
          statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
        });

        // Cancel & no-show rates
        const cancelRate = totalBookings > 0
          ? ((statusCounts['CANCELED'] || 0) / totalBookings) * 100
          : 0;
        const noShowRate = totalBookings > 0
          ? ((statusCounts['NO_SHOW'] || 0) / totalBookings) * 100
          : 0;

        // Average basket & revenue (non-canceled bookings)
        const validBookings = bookings.filter(
          b => b.status !== 'CANCELED' && b.status !== 'NO_SHOW'
        );
        const currentMonthRevenue = validBookings.reduce((sum, b) => sum + Number(b.price || 0), 0);
        const averageBasketSize = validBookings.length > 0
          ? currentMonthRevenue / validBookings.length
          : 0;

        // Hourly distribution
        const hourlyDistribution = new Array(24).fill(0);
        validBookings.forEach(b => {
          const hour = new Date(b.startTime).getHours();
          hourlyDistribution[hour] += 1;
        });

        // Client retention
        const totalClients = clients.length;
        const returningClients = clients.filter(
          c => (c._count?.bookings || 0) >= 2
        ).length;
        const clientRetentionRate = totalClients > 0
          ? (returningClients / totalClients) * 100
          : 0;

        setStats({
          statusCounts,
          totalBookings,
          cancelRate,
          noShowRate,
          averageBasketSize,
          hourlyDistribution,
          clientRetentionRate,
          returningClients,
          totalClients,
          currentMonthRevenue,
        });
      } catch (err) {
        console.error('Erreur lors du calcul des stats:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [salonId]);

  return { stats, loading, error };
};
