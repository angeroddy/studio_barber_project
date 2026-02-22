import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

interface PeakHoursChartProps {
  hourlyDistribution: number[];
  loading?: boolean;
}

export default function PeakHoursChart({
  hourlyDistribution,
  loading = false,
}: PeakHoursChartProps) {
  // Extract business hours (8h-19h)
  const businessHours = hourlyDistribution.slice(8, 20);
  const categories = Array.from({ length: 12 }, (_, i) => `${i + 8}h`);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 250,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: false,
    },
    yaxis: {
      title: {
        text: undefined,
      },
      labels: {
        formatter: (val: number) => Math.round(val).toString(),
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} réservation${val > 1 ? 's' : ''}`,
      },
    },
  };

  const series = [
    {
      name: "Réservations",
      data: businessHours,
    },
  ];

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded dark:bg-gray-700 w-36 mb-4" />
        <div className="h-[250px] bg-gray-100 rounded dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Heures de pointe
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Réservations par créneau horaire ce mois
        </p>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[500px] xl:min-w-full pl-2">
          <Chart options={options} series={series} type="bar" height={250} />
        </div>
      </div>
    </div>
  );
}

