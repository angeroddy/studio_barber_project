import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

interface AbsenceTrendChartProps {
  monthlyData: { month: string; count: number; days: number }[];
  loading?: boolean;
}

export default function AbsenceTrendChart({
  monthlyData,
  loading = false,
}: AbsenceTrendChartProps) {
  const categories = monthlyData.map(d => d.month);
  const absenceCounts = monthlyData.map(d => d.count);
  const absenceDays = monthlyData.map(d => d.days);

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      labels: {
        colors: ["#6B7280"],
      },
    },
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "smooth",
      width: [3, 2],
    },
    fill: {
      type: ["solid", "gradient"],
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val: number, opts: { seriesIndex: number }) => {
          if (opts.seriesIndex === 0) {
            return `${val} absence${val > 1 ? 's' : ''}`;
          }
          return `${val} jour${val > 1 ? 's' : ''}`;
        },
      },
    },
    xaxis: {
      type: "category",
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
      labels: {
        style: {
          colors: "#6B7280",
        },
      },
    },
    yaxis: [
      {
        title: {
          text: "",
          style: {
            fontSize: "0px",
          },
        },
        labels: {
          style: {
            fontSize: "12px",
            colors: ["#6B7280"],
          },
          formatter: (val: number) => Math.round(val).toString(),
        },
      },
      {
        opposite: true,
        title: {
          text: "",
          style: {
            fontSize: "0px",
          },
        },
        labels: {
          style: {
            fontSize: "12px",
            colors: ["#6B7280"],
          },
          formatter: (val: number) => Math.round(val).toString(),
        },
      },
    ],
  };

  const series = [
    {
      name: "Nombre d'absences",
      type: "line",
      data: absenceCounts,
    },
    {
      name: "Jours d'absence",
      type: "area",
      data: absenceDays,
    },
  ];

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6 animate-pulse">
        <div className="flex justify-between mb-6">
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded dark:bg-gray-700 w-52" />
            <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-40" />
          </div>
        </div>
        <div className="h-[310px] bg-gray-100 rounded dark:bg-gray-800" />
      </div>
    );
  }

  const hasData = absenceCounts.some(count => count > 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Tendance des absences (12 mois)
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Évolution du nombre et de la durée des absences
        </p>
      </div>

      {!hasData ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-12 text-center">
          Aucune donnée sur les 12 derniers mois
        </p>
      ) : (
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[1000px] xl:min-w-full">
            <Chart options={options} series={series} type="area" height={310} />
          </div>
        </div>
      )}
    </div>
  );
}

