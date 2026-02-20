import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import ChartTab from "../common/ChartTab";

interface RevenueTrendChartProps {
  monthlyRevenue: number[];
  monthlyBookings: number[];
  loading?: boolean;
}

export default function RevenueTrendChart({
  monthlyRevenue,
  monthlyBookings,
  loading = false,
}: RevenueTrendChartProps) {
  const options: ApexOptions = {
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
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
      curve: "straight",
      width: [2, 2],
    },
    fill: {
      type: "gradient",
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
            return val.toLocaleString('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            });
          }
          return `${val} rÃ©servations`;
        },
      },
    },
    xaxis: {
      type: "category",
      categories: [
        "Jan", "FÃ©v", "Mar", "Avr", "Mai", "Juin",
        "Juil", "AoÃ»t", "Sep", "Oct", "Nov", "DÃ©c",
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
        formatter: (val: number) => {
          return val.toLocaleString('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          });
        },
      },
      title: {
        text: "",
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  const series = [
    {
      name: "CA (EUR)",
      data: monthlyRevenue,
    },
    {
      name: "RÃ©servations",
      data: monthlyBookings,
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

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Ã‰volution du chiffre d'affaires
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            CA et rÃ©servations mois par mois
          </p>
        </div>
        <div className="flex items-start w-full gap-3 sm:justify-end">
          <ChartTab />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <Chart options={options} series={series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}

