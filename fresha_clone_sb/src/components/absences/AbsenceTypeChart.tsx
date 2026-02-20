import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import type { AbsenceType } from "../../services/absence.service";

interface AbsenceTypeChartProps {
  typeDistribution: { type: AbsenceType; label: string; count: number; days: number }[];
  loading?: boolean;
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  VACATION: { label: 'Vacances', color: '#465FFF' },
  SICK_LEAVE: { label: 'CongÃ© maladie', color: '#EF4444' },
  PERSONAL: { label: 'CongÃ© personnel', color: '#8B5CF6' },
  OTHER: { label: 'Autre', color: '#6B7280' },
};

export default function AbsenceTypeChart({
  typeDistribution,
  loading = false,
}: AbsenceTypeChartProps) {
  const labels = typeDistribution.map(t => t.label);
  const colors = typeDistribution.map(t => TYPE_CONFIG[t.type]?.color || '#6B7280');
  const series = typeDistribution.map(t => t.count);
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
        formatter: (val: number) => `${val} absence${val > 1 ? 's' : ''}`,
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
          RÃ©partition par type d'absence
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Distribution des types d'absences
        </p>
      </div>

      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-12 text-center">
          Aucune absence enregistrÃ©e
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

