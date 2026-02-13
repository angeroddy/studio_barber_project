import { useEffect, useState } from "react";
import absenceService from "../../services/absence.service";
import type { Absence } from "../../services/absence.service";
import { useAuth } from "../../context/AuthContext";
import type { StaffUser } from "../../services/staffAuth.service";

const statusColors = {
  PENDING: "bg-warning text-warning",
  APPROVED: "bg-success text-success",
  REJECTED: "bg-danger text-danger",
};

const statusLabels = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Refusé",
};

const typeLabels: Record<string, string> = {
  VACATION: "Vacances",
  SICK_LEAVE: "Congé maladie",
  PERSONAL: "Congé personnel",
  OTHER: "Autre",
};

export default function AbsenceList() {
  const { user, isStaff } = useAuth();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isStaff && user) {
      fetchAbsences();
    } else {
      setLoading(false);
    }
  }, [isStaff, user]);

  const fetchAbsences = async () => {
    if (!isStaff || !user) return;

    try {
      setLoading(true);
      const staffUser = user as StaffUser;
      const data = await absenceService.getAbsences({
        staffId: staffUser.id,
      });
      setAbsences(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors du chargement des congés");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <p className="text-center text-black dark:text-white">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <p className="text-center text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
        <h3 className="font-medium text-black dark:text-white">
          Mes demandes de congés
        </h3>
      </div>
      <div className="p-6.5">
        {absences.length === 0 ? (
          <p className="text-center text-bodydark">Aucune demande de congé</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="px-4 py-4 font-medium text-black dark:text-white">
                    Type
                  </th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">
                    Date début
                  </th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">
                    Date fin
                  </th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">
                    Raison
                  </th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {absences.map((absence) => (
                  <tr key={absence.id} className="border-b border-[#eee] dark:border-strokedark">
                    <td className="px-4 py-5">
                      <p className="text-black dark:text-white">
                        {typeLabels[absence.type] || absence.type}
                      </p>
                    </td>
                    <td className="px-4 py-5">
                      <p className="text-black dark:text-white">
                        {formatDate(absence.startDate)}
                      </p>
                    </td>
                    <td className="px-4 py-5">
                      <p className="text-black dark:text-white">
                        {formatDate(absence.endDate)}
                      </p>
                    </td>
                    <td className="px-4 py-5">
                      <p className="text-black dark:text-white line-clamp-2">
                        {absence.reason}
                      </p>
                    </td>
                    <td className="px-4 py-5">
                      <p
                        className={`inline-flex rounded-full bg-opacity-10 px-3 py-1 text-sm font-medium ${
                          statusColors[absence.status]
                        }`}
                      >
                        {statusLabels[absence.status]}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
