import { useStaffRanking, StaffRanking } from "../../hooks/useStaffRanking";

interface ClassementCoifProps {
  salonId: string;
}

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20">
        <span className="text-amber-600 dark:text-amber-400 font-bold text-sm">1</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-600/30">
        <span className="text-gray-500 dark:text-gray-300 font-bold text-sm">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/20">
        <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">3</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-8 h-8">
      <span className="text-gray-400 dark:text-gray-500 font-semibold text-sm">{rank}</span>
    </div>
  );
}

function StaffRow({ staff, maxRevenue }: { staff: StaffRanking; maxRevenue: number }) {
  const initials = `${staff.firstName.charAt(0)}${staff.lastName.charAt(0)}`.toUpperCase();
  const revenuePercent = maxRevenue > 0 ? (staff.revenue / maxRevenue) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-3">
      <MedalIcon rank={staff.rank} />

      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-medium text-sm shrink-0">
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-sm text-gray-800 dark:text-white/90 truncate">
            {staff.firstName} {staff.lastName}
          </span>
          <span className="text-sm font-semibold text-gray-800 dark:text-white/90 ml-2 shrink-0">
            {staff.revenue.toLocaleString('fr-FR')} €
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${revenuePercent}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
            {staff.appointments} RDV
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ClassementCoif({ salonId }: ClassementCoifProps) {
  const { rankings, loading } = useStaffRanking(salonId);
  const maxRevenue = rankings.length > 0 ? rankings[0].revenue : 0;

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded dark:bg-gray-700 w-44 mb-5" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full dark:bg-gray-700" />
              <div className="w-10 h-10 bg-gray-200 rounded-full dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-3/4" />
                <div className="h-1.5 bg-gray-200 rounded-full dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Top collaborateurs
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Performance du mois en cours
        </p>
      </div>

      {rankings.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
          Aucune donnée ce mois-ci
        </p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {rankings.map((staff) => (
            <StaffRow key={staff.id} staff={staff} maxRevenue={maxRevenue} />
          ))}
        </div>
      )}
    </div>
  );
}

