import { useState, useEffect } from 'react';
import { getBookingsBySalon } from '../services/booking.service';
import { getStaffBySalon } from '../services/staff.service';

export interface StaffRanking {
  id: string;
  rank: number;
  firstName: string;
  lastName: string;
  avatar?: string;
  appointments: number;
  revenue: number;
}

export const useStaffRanking = (salonId: string) => {
  const [rankings, setRankings] = useState<StaffRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRankings = async () => {
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

        const [staff, bookings] = await Promise.all([
          getStaffBySalon(salonId, true),
          getBookingsBySalon(salonId, {
            startDate: monthStart.toISOString(),
            endDate: monthEnd.toISOString(),
          }),
        ]);

        const validBookings = bookings.filter(
          b => b.status !== 'CANCELED' && b.status !== 'NO_SHOW'
        );

        const staffMap: Record<string, { appointments: number; revenue: number }> = {};
        validBookings.forEach(b => {
          if (b.staffId) {
            if (!staffMap[b.staffId]) staffMap[b.staffId] = { appointments: 0, revenue: 0 };
            staffMap[b.staffId].appointments += 1;
            staffMap[b.staffId].revenue += Number(b.price || 0);
          }
        });

        const ranked = staff
          .map(s => ({
            id: s.id,
            rank: 0,
            firstName: s.firstName,
            lastName: s.lastName,
            avatar: s.avatar,
            appointments: staffMap[s.id]?.appointments || 0,
            revenue: staffMap[s.id]?.revenue || 0,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .map((item, i) => ({ ...item, rank: i + 1 }));

        setRankings(ranked);
      } catch (err) {
        console.error('Erreur lors du classement staff:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [salonId]);

  return { rankings, loading, error };
};
