import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalenderIcon,
  AlertIcon,
  CheckCircleIcon,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import type { AbsenceMetrics } from "../../hooks/useAbsenceMetrics";

interface AbsenceMetricsCardsProps {
  metrics: AbsenceMetrics;
  loading?: boolean;
  error?: string | null;
}

export default function AbsenceMetricsCards({
  metrics,
  loading = false,
  error = null,
}: AbsenceMetricsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6 animate-pulse"
          >
            <div className="w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700" />
            <div className="mt-5 space-y-2">
              <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-2/3" />
              <div className="h-6 bg-gray-200 rounded dark:bg-gray-700 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-error-200 bg-error-50 p-5 dark:border-error-800 dark:bg-error-900/20 md:p-6">
        <p className="text-sm text-error-600 dark:text-error-400">
          Erreur lors du chargement des m�triques: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
      {/* Total absences (Mois) */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <CalenderIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total absences (Mois)
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {metrics.totalAbsencesMonth.toLocaleString('fr-FR')}
            </h4>
          </div>
          <Badge color={metrics.totalAbsencesMonthChange >= 0 ? "error" : "success"}>
            {metrics.totalAbsencesMonthChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(metrics.totalAbsencesMonthChange).toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Approbations en attente */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-warning-50 rounded-xl dark:bg-warning-500/15">
          <AlertIcon className="text-warning-600 size-6 dark:text-warning-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              En attente d'approbation
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {metrics.pendingApprovals.toLocaleString('fr-FR')}
            </h4>
          </div>
          {metrics.pendingApprovals > 0 && (
            <Badge color="warning">
              {metrics.pendingApprovals} en attente
            </Badge>
          )}
        </div>
      </div>

      {/* Approuv�es (Semaine) */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-success-50 rounded-xl dark:bg-success-500/15">
          <CheckCircleIcon className="text-success-600 size-6 dark:text-success-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Approuv�es (Semaine)
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {metrics.approvedThisWeek.toLocaleString('fr-FR')}
            </h4>
          </div>
          <Badge color={metrics.approvedThisWeekChange >= 0 ? "success" : "error"}>
            {metrics.approvedThisWeekChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(metrics.approvedThisWeekChange).toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Moyenne jours/employ� */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Moyenne jours/employ�
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {metrics.avgDaysPerStaff.toFixed(1)}
            </h4>
          </div>
          <Badge color="info">
            Jours
          </Badge>
        </div>
      </div>
    </div>
  );
}

