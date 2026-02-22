import { useState, useEffect } from 'react';
import { getBookingsBySalon } from '../services/booking.service';

export interface RevenueTrend {
  monthlyRevenue: number[];
  monthlyBookings: number[];
}

export const useRevenueTrend = (salonId: string) => {
  const [trend, setTrend] = useState<RevenueTrend>({
    monthlyRevenue: new Array(12).fill(0),
    monthlyBookings: new Array(12).fill(0),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrend = async () => {
      if (!salonId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

        const bookings = await getBookingsBySalon(salonId, {
          startDate: yearStart.toISOString(),
          endDate: yearEnd.toISOString(),
          limit: 10000,
          lite: true,
        });

        const validBookings = bookings.filter(
          b => b.status !== 'CANCELED' && b.status !== 'NO_SHOW'
        );

        const monthlyRevenue = new Array(12).fill(0);
        const monthlyBookings = new Array(12).fill(0);

        validBookings.forEach(b => {
          const month = new Date(b.startTime).getMonth();
          monthlyRevenue[month] += Number(b.price || 0);
          monthlyBookings[month] += 1;
        });

        setTrend({ monthlyRevenue, monthlyBookings });
      } catch (err) {
        console.error('Erreur lors du calcul du trend CA:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchTrend();
  }, [salonId]);

  return { trend, loading, error };
};
