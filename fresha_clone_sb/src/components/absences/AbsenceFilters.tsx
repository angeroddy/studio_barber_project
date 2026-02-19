import type { AbsenceStatus, AbsenceType } from "../../services/absence.service";
import type { Staff } from "../../services/staff.service";
import Button from "../ui/button/Button";

export interface AbsenceFilterState {
  status: AbsenceStatus | "ALL";
  staffId?: string;
  type?: AbsenceType | "ALL";
  startDate?: string;
  endDate?: string;
}

interface AbsenceFiltersProps {
  filters: AbsenceFilterState;
  onFilterChange: (filters: AbsenceFilterState) => void;
  staffList: Staff[];
  loading?: boolean;
}

export default function AbsenceFilters({
  filters,
  onFilterChange,
  staffList,
  loading = false,
}: AbsenceFiltersProps) {
  const handleStatusChange = (status: AbsenceStatus | "ALL") => {
    onFilterChange({ ...filters, status });
  };

  const handleFieldChange = (field: keyof AbsenceFilterState, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  const openDatePicker = (event: React.MouseEvent<HTMLInputElement>) => {
    try {
      if ("showPicker" in HTMLInputElement.prototype) {
        event.currentTarget.showPicker();
      }
    } catch {
      // No-op: fallback to native browser behavior.
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtres par statut (boutons) */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => handleStatusChange("ALL")}
          variant={filters.status === "ALL" ? "primary" : "outline"}
          size="sm"
          disabled={loading}
        >
          Toutes
        </Button>
        <Button
          onClick={() => handleStatusChange("PENDING")}
          variant={filters.status === "PENDING" ? "primary" : "outline"}
          size="sm"
          disabled={loading}
        >
          En attente
        </Button>
        <Button
          onClick={() => handleStatusChange("APPROVED")}
          variant={filters.status === "APPROVED" ? "primary" : "outline"}
          size="sm"
          disabled={loading}
        >
          Approuvées
        </Button>
        <Button
          onClick={() => handleStatusChange("REJECTED")}
          variant={filters.status === "REJECTED" ? "primary" : "outline"}
          size="sm"
          disabled={loading}
        >
          Rejetées
        </Button>
      </div>

      {/* Filtres additionnels (employé, type, dates) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Filtre par employé */}
        <div>
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Employé
          </label>
          <select
            value={filters.staffId || ""}
            onChange={(e) => handleFieldChange("staffId", e.target.value)}
            disabled={loading}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-white/90"
          >
            <option value="">Tous les employés</option>
            {staffList.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.firstName} {staff.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre par type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Type d'absence
          </label>
          <select
            value={filters.type || "ALL"}
            onChange={(e) => handleFieldChange("type", e.target.value)}
            disabled={loading}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-white/90"
          >
            <option value="ALL">Tous les types</option>
            <option value="VACATION">Vacances</option>
            <option value="SICK_LEAVE">Congé maladie</option>
            <option value="PERSONAL">Congé personnel</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>

        {/* Filtre par date de début */}
        <div>
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Du
          </label>
          <input
            type="date"
            value={filters.startDate || ""}
            onChange={(e) => handleFieldChange("startDate", e.target.value)}
            onClick={openDatePicker}
            disabled={loading}
            className="h-11 w-full cursor-pointer rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-white/90"
          />
        </div>

        {/* Filtre par date de fin */}
        <div>
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Au
          </label>
          <input
            type="date"
            value={filters.endDate || ""}
            onChange={(e) => handleFieldChange("endDate", e.target.value)}
            onClick={openDatePicker}
            disabled={loading}
            className="h-11 w-full cursor-pointer rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-white/90"
          />
        </div>
      </div>
    </div>
  );
}
