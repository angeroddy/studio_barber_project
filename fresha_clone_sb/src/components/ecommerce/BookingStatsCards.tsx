import {
  ArrowDownIcon,
  ArrowUpIcon,
  CloseLineIcon,
  AlertIcon,
  DollarLineIcon,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";

interface BookingStatsCardsProps {
  cancelRate: number;
  noShowRate: number;
  averageBasketSize: number;
  clientRetentionRate: number;
  loading?: boolean;
}

export default function BookingStatsCards({
  cancelRate,
  noShowRate,
  averageBasketSize,
  clientRetentionRate,
  loading = false,
}: BookingStatsCardsProps) {
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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
      {/* Taux d'annulation */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-error-50 rounded-xl dark:bg-error-500/15">
          <CloseLineIcon className="text-error-600 size-6 dark:text-error-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Taux d'annulation
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {cancelRate.toFixed(1)}%
            </h4>
          </div>
          <Badge color={cancelRate <= 10 ? "success" : "error"}>
            {cancelRate <= 10 ? <ArrowDownIcon /> : <ArrowUpIcon />}
            {cancelRate.toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Taux de no-show */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-warning-50 rounded-xl dark:bg-warning-500/15">
          <AlertIcon className="text-warning-600 size-6 dark:text-warning-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Taux de no-show
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {noShowRate.toFixed(1)}%
            </h4>
          </div>
          <Badge color={noShowRate <= 5 ? "success" : "error"}>
            {noShowRate <= 5 ? <ArrowDownIcon /> : <ArrowUpIcon />}
            {noShowRate.toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Panier moyen */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Panier moyen
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {averageBasketSize.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </h4>
          </div>
        </div>
      </div>

      {/* Taux de rétention */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-success-50 rounded-xl dark:bg-success-500/15">
          <GroupIcon className="text-success-600 size-6 dark:text-success-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Fidélisation clients
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {clientRetentionRate.toFixed(1)}%
            </h4>
          </div>
          <Badge color={clientRetentionRate >= 30 ? "success" : "warning"}>
            {clientRetentionRate >= 30 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {clientRetentionRate.toFixed(1)}%
          </Badge>
        </div>
      </div>
    </div>
  );
}

