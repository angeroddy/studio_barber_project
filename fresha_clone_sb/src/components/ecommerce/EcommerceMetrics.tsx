import {
  ArrowDownIcon,
  ArrowUpIcon,
  GroupIcon,
  BookingIcon,
  DollarLineIcon,
  PercentIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";

interface EcommerceMetricsProps {
  newClientsWeek: number;
  newClientsWeekChange: number;
  bookingsToday: number;
  bookingsTodayChange: number;
  revenueToday: number;
  revenueTodayChange: number;
  occupancyRateToday: number;
  occupancyRateTodayChange: number;
  loading?: boolean;
}

export default function EcommerceMetrics({
  newClientsWeek,
  newClientsWeekChange,
  bookingsToday,
  bookingsTodayChange,
  revenueToday,
  revenueTodayChange,
  occupancyRateToday,
  occupancyRateTodayChange,
  loading = false,
}: EcommerceMetricsProps) {
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
      {/* Nouveaux clients (Semaine) */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Nouveaux clients (Semaine)
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {newClientsWeek.toLocaleString('fr-FR')}
            </h4>
          </div>
          <Badge color={newClientsWeekChange >= 0 ? "success" : "error"}>
            {newClientsWeekChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(newClientsWeekChange).toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Reservations du jour */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BookingIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Reservations de la journee
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {bookingsToday.toLocaleString('fr-FR')}
            </h4>
          </div>

          <Badge color={bookingsTodayChange >= 0 ? "success" : "error"}>
            {bookingsTodayChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(bookingsTodayChange).toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Chiffre d'affaires */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Chiffre d'affaires (journee)
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {revenueToday.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </h4>
          </div>

          <Badge color={revenueTodayChange >= 0 ? "success" : "error"}>
            {revenueTodayChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(revenueTodayChange).toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Taux d'occupation */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <PercentIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Taux d'occupation (journee)
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {occupancyRateToday.toFixed(1)}%
            </h4>
          </div>

          <Badge color={occupancyRateTodayChange >= 0 ? "success" : "error"}>
            {occupancyRateTodayChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(occupancyRateTodayChange).toFixed(1)}%
          </Badge>
        </div>
      </div>
    </div>
  );
}

