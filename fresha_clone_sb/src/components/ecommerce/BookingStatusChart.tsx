import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

interface BookingStatusChartProps {
  statusCounts: Record<string, number>;
  loading?: boolean;
}

const STATUS_CONFIG = [
  { key: 'CONFIRMED', label: 'Confirmé', color: '#465FFF' },
  { key: 'IN_PROGRESS', label: 'En cours', color: '#F59E0B' },
  { key: 'COMPLETED', label: 'Terminé', color: '#10B981' },
  { key: 'CANCELED', label: 'Annulé', color: '#EF4444' },
  { key: 'NO_SHOW', label: 'No-show', color: '#8B5CF6' },
  { key: 'PENDING', label: 'En attente', color: '#6B7280' },
];

export default function BookingStatusChart({
  statusCounts,
  loading = false,
}: BookingStatusChartProps) {
  const labels = STATUS_CONFIG.map(s => s.label);
  const colors = STATUS_CONFIG.map(s => s.color);
  const series = STATUS_CONFIG.map(s => statusCounts[s.key] || 0);
  const total = series.reduce((sum, v) => sum + v, 0);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
    },
    labels,
    colors,
    legend: {
      position: "bottom",
      fontFamily: "Outfit, sans-serif",
    },
    dataLabels: {
      enabled: false,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              formatter: () => total.toString(),
            },
          },
        },
      },
    },
    stroke: {
      width: 0,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} réservation${val > 1 ? 's' : ''}`,
      },
    },
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded dark:bg-gray-700 w-48 mb-4" />
        <div className="flex items-center justify-center">
          <div className="w-[250px] h-[250px] bg-gray-100 rounded-full dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Répartition des réservations
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Statuts des réservations ce mois
        </p>
      </div>

      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-12 text-center">
          Aucune réservation ce mois-ci
        </p>
      ) : (
        <div className="flex items-center justify-center">
          <Chart
            options={options}
            series={series}
            type="donut"
            height={300}
          />
        </div>
      )}
    </div>
  );
}

