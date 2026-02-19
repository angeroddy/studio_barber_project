import { useState, useEffect } from 'react';
import absenceService, { type Absence, type AbsenceType } from '../services/absence.service';
import { getStaffBySalon } from '../services/staff.service';

export interface AbsenceMetrics {
  totalAbsencesMonth: number;
  totalAbsencesMonthChange: number;
  pendingApprovals: number;
  approvedThisWeek: number;
  approvedThisWeekChange: number;
  avgDaysPerStaff: number;
  typeDistribution: { type: AbsenceType; label: string; count: number; days: number }[];
  monthlyTrend: { month: string; count: number; days: number }[];
}

const typeLabels: Record<AbsenceType, string> = {
  VACATION: 'Vacances',
  SICK_LEAVE: 'Congé maladie',
  PERSONAL: 'Congé personnel',
  OTHER: 'Autre',
};

const monthLabels = [
  'Jan.', 'Fév.', 'Mars', 'Avr.', 'Mai', 'Juin',
  'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'
];

const calculateDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

export const useAbsenceMetrics = (salonId?: string) => {
  const [metrics, setMetrics] = useState<AbsenceMetrics>({
    totalAbsencesMonth: 0,
    totalAbsencesMonthChange: 0,
    pendingApprovals: 0,
    approvedThisWeek: 0,
    approvedThisWeekChange: 0,
    avgDaysPerStaff: 0,
    typeDistribution: [],
    monthlyTrend: [],
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

        const now = new Date();

        // Périodes de référence
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);

        const lastWeekStart = new Date(currentWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(currentWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

        // Pour la tendance sur 12 mois
        const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

        // Récupérer toutes les absences de l'année (pour les calculs)
        const [allAbsences, staffMembers] = await Promise.all([
          absenceService.getAbsences({ salonId }),
          getStaffBySalon(salonId, true),
        ]);

        // 1. Total absences du mois en cours
        const absencesThisMonth = allAbsences.filter(absence => {
          const startDate = new Date(absence.startDate);
          return startDate >= currentMonthStart && startDate <= currentMonthEnd;
        });
        const totalAbsencesMonth = absencesThisMonth.length;

        // 2. Total absences du mois précédent
        const absencesLastMonth = allAbsences.filter(absence => {
          const startDate = new Date(absence.startDate);
          return startDate >= lastMonthStart && startDate <= lastMonthEnd;
        });
        const totalAbsencesLastMonth = absencesLastMonth.length;

        // 3. Variation mensuelle
        const totalAbsencesMonthChange = totalAbsencesLastMonth > 0
          ? ((totalAbsencesMonth - totalAbsencesLastMonth) / totalAbsencesLastMonth) * 100
          : totalAbsencesMonth > 0 ? 100 : 0;

        // 4. Approbations en attente
        const pendingApprovals = allAbsences.filter(
          absence => absence.status === 'PENDING'
        ).length;

        // 5. Approuvées cette semaine
        const approvedThisWeek = allAbsences.filter(absence => {
          if (absence.status !== 'APPROVED') return false;
          const updatedAt = absence.updatedAt ? new Date(absence.updatedAt) : null;
          if (!updatedAt) return false;
          return updatedAt >= currentWeekStart && updatedAt <= now;
        }).length;

        // 6. Approuvées la semaine dernière
        const approvedLastWeek = allAbsences.filter(absence => {
          if (absence.status !== 'APPROVED') return false;
          const updatedAt = absence.updatedAt ? new Date(absence.updatedAt) : null;
          if (!updatedAt) return false;
          return updatedAt >= lastWeekStart && updatedAt <= lastWeekEnd;
        }).length;

        // 7. Variation hebdomadaire des approbations
        const approvedThisWeekChange = approvedLastWeek > 0
          ? ((approvedThisWeek - approvedLastWeek) / approvedLastWeek) * 100
          : approvedThisWeek > 0 ? 100 : 0;

        // 8. Moyenne de jours d'absence par employé
        const totalDays = allAbsences.reduce((sum, absence) => {
          return sum + calculateDays(absence.startDate, absence.endDate);
        }, 0);
        const uniqueStaffIds = new Set(allAbsences.map(a => a.staffId));
        const avgDaysPerStaff = uniqueStaffIds.size > 0
          ? totalDays / uniqueStaffIds.size
          : 0;

        // 9. Distribution par type d'absence
        const typeMap = new Map<AbsenceType, { count: number; days: number }>();
        allAbsences.forEach(absence => {
          const existing = typeMap.get(absence.type) || { count: 0, days: 0 };
          typeMap.set(absence.type, {
            count: existing.count + 1,
            days: existing.days + calculateDays(absence.startDate, absence.endDate),
          });
        });

        const typeDistribution = Array.from(typeMap.entries()).map(([type, data]) => ({
          type,
          label: typeLabels[type] || type,
          count: data.count,
          days: data.days,
        }));

        // 10. Tendance mensuelle sur 12 mois
        const monthlyTrend: { month: string; count: number; days: number }[] = [];
        for (let i = 11; i >= 0; i--) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
          const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

          const monthAbsences = allAbsences.filter(absence => {
            const startDate = new Date(absence.startDate);
            return startDate >= monthStart && startDate <= monthEnd;
          });

          const monthDays = monthAbsences.reduce((sum, absence) => {
            return sum + calculateDays(absence.startDate, absence.endDate);
          }, 0);

          monthlyTrend.push({
            month: monthLabels[monthDate.getMonth()],
            count: monthAbsences.length,
            days: monthDays,
          });
        }

        setMetrics({
          totalAbsencesMonth,
          totalAbsencesMonthChange,
          pendingApprovals,
          approvedThisWeek,
          approvedThisWeekChange,
          avgDaysPerStaff,
          typeDistribution,
          monthlyTrend,
        });
      } catch (err) {
        console.error('Erreur lors de la récupération des métriques d\'absence:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [salonId]);

  return { metrics, loading, error };
};
