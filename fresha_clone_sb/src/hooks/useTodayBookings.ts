import { useState, useEffect } from 'react';
import { getBookingsBySalon, Booking } from '../services/booking.service';

export const useTodayBookings = (salonId: string) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!salonId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        const data = await getBookingsBySalon(salonId, {
          startDate: todayStart.toISOString(),
          endDate: todayEnd.toISOString(),
        });

        const upcoming = data
          .filter(b => b.status !== 'CANCELED' && b.status !== 'NO_SHOW')
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        setBookings(upcoming);
      } catch (err) {
        console.error('Erreur lors de la récupération des RDV du jour:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [salonId]);

  return { bookings, loading, error };
};
