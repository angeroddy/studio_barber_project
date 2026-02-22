import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

interface MonthlyTargetProps {
  currentRevenue: number;
  targetRevenue: number;
  todayRevenue: number;
  loading?: boolean;
}

export default function MonthlyTarget({
  currentRevenue,
  targetRevenue,
  todayRevenue,
  loading = false,
}: MonthlyTargetProps) {
  const percentage = targetRevenue > 0
    ? Math.min((currentRevenue / targetRevenue) * 100, 100)
    : 0;

  const series = [Math.round(percentage * 100) / 100];

  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: {
          size: "80%",
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1D2939",
            formatter: function (val) {
              return val + "%";
            },
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: ["#465FFF"],
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Progress"],
  };

  const formatEUR = (value: number) =>
    value.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/3 animate-pulse">
        <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <div className="space-y-2 mb-6">
            <div className="h-5 bg-gray-200 rounded dark:bg-gray-700 w-36" />
            <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-48" />
          </div>
          <div className="flex items-center justify-center">
            <div className="w-[250px] h-[250px] bg-gray-100 rounded-full dark:bg-gray-800" />
          </div>
        </div>
      </div>
    );
  }

  const isAboveTarget = percentage >= 100;

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/3">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Objectif mensuel
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Progression vers votre objectif
          </p>
        </div>
        <div className="relative">
          <div className="max-h-[330px]" id="chartDarkStyle">
            <Chart
              options={options}
              series={series}
              type="radialBar"
              height={330}
            />
          </div>

          <span className={`absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full px-3 py-1 text-xs font-medium ${
            isAboveTarget
              ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
              : 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500'
          }`}>
            {isAboveTarget ? 'Objectif atteint !' : `${(100 - percentage).toFixed(0)}% restant`}
          </span>
        </div>
        <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          {currentRevenue > 0
            ? `Vous avez généré ${formatEUR(currentRevenue)} ce mois-ci sur un objectif de ${formatEUR(targetRevenue)}.`
            : 'Aucun revenu enregistré ce mois-ci.'}
        </p>
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Objectif
          </p>
          <p className="text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {formatEUR(targetRevenue)}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            CA du mois
          </p>
          <p className="text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {formatEUR(currentRevenue)}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Aujourd'hui
          </p>
          <p className="text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {formatEUR(todayRevenue)}
          </p>
        </div>
      </div>
    </div>
  );
}

