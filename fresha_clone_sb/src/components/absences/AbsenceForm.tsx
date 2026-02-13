import { useState } from "react";
import absenceService from "../../services/absence.service";
import { useAuth } from "../../context/AuthContext";
import type { StaffUser } from "../../services/staffAuth.service";

interface AbsenceFormData {
  startDate: string;
  endDate: string;
  reason: string;
  type: "VACATION" | "SICK_LEAVE" | "PERSONAL" | "OTHER";
}

export default function AbsenceForm() {
  const { user, isStaff } = useAuth();
  const [formData, setFormData] = useState<AbsenceFormData>({
    startDate: "",
    endDate: "",
    reason: "",
    type: "VACATION",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isStaff || !user) {
      setError("Vous devez être connecté en tant qu'employé");
      return;
    }

    const staffUser = user as StaffUser;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await absenceService.createAbsence({
        staffId: staffUser.id,
        salonId: staffUser.salonId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        type: formData.type,
      });
      setSuccess(true);
      setFormData({
        startDate: "",
        endDate: "",
        reason: "",
        type: "VACATION",
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la déclaration de congé");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
        <h3 className="font-medium text-black dark:text-white">
          Déclarer une absence / congé
        </h3>
      </div>
      <form onSubmit={handleSubmit} className="p-6.5">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900 dark:text-green-200">
            Congé déclaré avec succès !
          </div>
        )}

        <div className="mb-4.5">
          <label className="mb-2.5 block text-black dark:text-white">
            Type de congé <span className="text-meta-1">*</span>
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          >
            <option value="VACATION">Vacances</option>
            <option value="SICK_LEAVE">Congé maladie</option>
            <option value="PERSONAL">Congé personnel</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>

        <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
          <div className="w-full xl:w-1/2">
            <label className="mb-2.5 block text-black dark:text-white">
              Date de début <span className="text-meta-1">*</span>
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>

          <div className="w-full xl:w-1/2">
            <label className="mb-2.5 block text-black dark:text-white">
              Date de fin <span className="text-meta-1">*</span>
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="mb-2.5 block text-black dark:text-white">
            Raison <span className="text-meta-1">*</span>
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
            rows={4}
            placeholder="Décrivez la raison de votre absence..."
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90 disabled:bg-opacity-50"
        >
          {loading ? "Envoi en cours..." : "Soumettre la demande"}
        </button>
      </form>
    </div>
  );
}
