import { useEffect, useState } from "react";
import absenceService from "../../services/absence.service";
import type {
  Absence,
  AbsenceStatus,
  AbsenceType,
} from "../../services/absence.service";
import { getStaffBySalon } from "../../services/staff.service";
import type { Staff } from "../../services/staff.service";
import { useSalon } from "../../context/SalonContext";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Alert from "../ui/alert/Alert";
import TextArea from "../form/input/TextArea";

const statusColors: Record<AbsenceStatus, string> = {
  PENDING: "bg-warning/10 text-warning",
  APPROVED: "bg-success/10 text-success",
  REJECTED: "bg-danger/10 text-danger",
};

const statusLabels: Record<AbsenceStatus, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvee",
  REJECTED: "Refusee",
};

const typeLabels: Record<AbsenceType, string> = {
  VACATION: "Vacances",
  SICK_LEAVE: "Conge maladie",
  PERSONAL: "Conge personnel",
  OTHER: "Autre",
};

type ActionType = "approve" | "reject" | "delete";

interface OwnerAbsenceManagementProps {
  salonId?: string;
}

interface FormData {
  staffId: string;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  reason: string;
  notes: string;
}

const defaultFormData: FormData = {
  staffId: "",
  type: "VACATION",
  startDate: "",
  endDate: "",
  reason: "",
  notes: "",
};

export default function OwnerAbsenceManagement({ salonId }: OwnerAbsenceManagementProps) {
  const { selectedSalon } = useSalon();
  const effectiveSalonId = salonId || selectedSalon?.id;

  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const [loading, setLoading] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<AbsenceStatus | "ALL">("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<ActionType>("approve");
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [modalNotes, setModalNotes] = useState("");

  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    if (!effectiveSalonId) {
      setLoading(false);
      setLoadingStaff(false);
      return;
    }

    void fetchStaff();
  }, [effectiveSalonId]);

  useEffect(() => {
    if (!effectiveSalonId) {
      setLoading(false);
      return;
    }

    void fetchAbsences();
  }, [effectiveSalonId, filterStatus]);

  const fetchStaff = async () => {
    if (!effectiveSalonId) return;

    try {
      setLoadingStaff(true);
      const data = await getStaffBySalon(effectiveSalonId, true);
      setStaffMembers(data);

      setFormData((prev) => ({
        ...prev,
        staffId: prev.staffId || data[0]?.id || "",
      }));
    } catch (err: any) {
      setAlertMessage(err?.response?.data?.message || "Erreur lors du chargement des employes");
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchAbsences = async () => {
    if (!effectiveSalonId) return;

    try {
      setLoading(true);
      const filters: { salonId: string; status?: AbsenceStatus } = {
        salonId: effectiveSalonId,
      };

      if (filterStatus !== "ALL") {
        filters.status = filterStatus;
      }

      const data = await absenceService.getAbsences(filters);
      setAbsences(data);
    } catch (err: any) {
      setAlertMessage(err?.response?.data?.message || "Erreur lors du chargement des absences");
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const resetForm = () => {
    setFormData((prev) => ({
      ...defaultFormData,
      staffId: prev.staffId || staffMembers[0]?.id || "",
    }));
  };

  const handleCreateAbsence = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!effectiveSalonId) return;
    if (!formData.staffId || !formData.startDate || !formData.endDate) {
      setAlertMessage("Veuillez remplir tous les champs obligatoires.");
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setAlertMessage("La date de fin doit etre apres la date de debut.");
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
      return;
    }

    try {
      setSubmitting(true);

      const createdAbsence = await absenceService.createAbsence({
        staffId: formData.staffId,
        salonId: effectiveSalonId,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason || undefined,
        notes: formData.notes || undefined,
      });

      await absenceService.approveAbsence(
        createdAbsence.id,
        formData.notes || "Absence declaree par le proprietaire"
      );

      setAlertMessage("Absence employee declaree et approuvee avec succes.");
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 5000);

      resetForm();
      await fetchAbsences();
    } catch (err: any) {
      setAlertMessage(err?.response?.data?.message || err?.message || "Erreur lors de la declaration de l'absence");
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (absence: Absence, action: ActionType) => {
    setSelectedAbsence(absence);
    setModalAction(action);
    setModalNotes("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedAbsence(null);
    setModalNotes("");
    setModalOpen(false);
  };

  const handleConfirmAction = async () => {
    if (!selectedAbsence) return;

    try {
      setProcessingId(selectedAbsence.id);

      if (modalAction === "approve") {
        await absenceService.approveAbsence(selectedAbsence.id, modalNotes || undefined);
        setAlertMessage("Absence approuvee avec succes.");
      } else if (modalAction === "reject") {
        await absenceService.rejectAbsence(selectedAbsence.id, modalNotes || undefined);
        setAlertMessage("Absence rejetee avec succes.");
      } else {
        await absenceService.deleteAbsence(selectedAbsence.id);
        setAlertMessage("Absence supprimee avec succes.");
      }

      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 5000);
      await fetchAbsences();
      closeModal();
    } catch (err: any) {
      setAlertMessage(err?.response?.data?.message || err?.message || "Erreur lors du traitement");
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const modalTitle =
    modalAction === "approve"
      ? "Approuver l'absence"
      : modalAction === "reject"
        ? "Rejeter l'absence"
        : "Supprimer l'absence";

  if (!effectiveSalonId) {
    return (
      <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <p className="text-center text-bodydark">Veuillez selectionner un salon.</p>
      </div>
    );
  }

  return (
    <>
      {showSuccessAlert && (
        <Alert
          type="success"
          title="Succes"
          message={alertMessage}
          onClose={() => setShowSuccessAlert(false)}
        />
      )}
      {showErrorAlert && (
        <Alert
          type="error"
          title="Erreur"
          message={alertMessage}
          onClose={() => setShowErrorAlert(false)}
        />
      )}

      <div className="space-y-6">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-7.5 py-4 dark:border-strokedark">
            <h3 className="text-xl font-semibold text-black dark:text-white">
              Declarer une absence employee
            </h3>
            <p className="mt-1 text-sm text-bodydark">
              Le proprietaire enregistre les absences des employes. L'absence est approuvee automatiquement.
            </p>
          </div>

          <form onSubmit={handleCreateAbsence} className="grid grid-cols-1 gap-4 p-7.5 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Employe *
              </label>
              <select
                name="staffId"
                value={formData.staffId}
                onChange={handleFormChange}
                disabled={loadingStaff || submitting}
                required
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-white/90"
              >
                <option value="" disabled>
                  {loadingStaff ? "Chargement des employes..." : "Selectionner un employe"}
                </option>
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.firstName} {staff.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Type d'absence *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleFormChange}
                disabled={submitting}
                required
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-white/90"
              >
                <option value="VACATION">Vacances</option>
                <option value="SICK_LEAVE">Conge maladie</option>
                <option value="PERSONAL">Conge personnel</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Date de debut *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleFormChange}
                onClick={openDatePicker}
                disabled={submitting}
                required
                className="h-11 w-full cursor-pointer rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-white/90"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Date de fin *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleFormChange}
                onClick={openDatePicker}
                disabled={submitting}
                required
                className="h-11 w-full cursor-pointer rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-white/90"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Raison
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleFormChange}
                rows={3}
                placeholder="Raison de l'absence..."
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-white/90"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Notes internes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                rows={2}
                placeholder="Notes optionnelles..."
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-white/90"
              />
            </div>

            <div className="lg:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || loadingStaff || staffMembers.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3.5 text-sm text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
              >
                {submitting ? "Declaration..." : "Declarer l'absence"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-7.5 py-4 dark:border-strokedark">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-semibold text-black dark:text-white">
                Historique des absences
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setFilterStatus("ALL")}
                  variant={filterStatus === "ALL" ? "primary" : "outline"}
                  size="sm"
                >
                  Toutes
                </Button>
                <Button
                  onClick={() => setFilterStatus("PENDING")}
                  variant={filterStatus === "PENDING" ? "primary" : "outline"}
                  size="sm"
                >
                  En attente
                </Button>
                <Button
                  onClick={() => setFilterStatus("APPROVED")}
                  variant={filterStatus === "APPROVED" ? "primary" : "outline"}
                  size="sm"
                >
                  Approuvees
                </Button>
                <Button
                  onClick={() => setFilterStatus("REJECTED")}
                  variant={filterStatus === "REJECTED" ? "primary" : "outline"}
                  size="sm"
                >
                  Rejetees
                </Button>
              </div>
            </div>
          </div>

          <div className="p-7.5">
            {loading ? (
              <p className="text-center text-bodydark">Chargement...</p>
            ) : absences.length === 0 ? (
              <p className="text-center text-bodydark">Aucune absence trouvee.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>Employe</TableCell>
                      <TableCell isHeader>Type</TableCell>
                      <TableCell isHeader>Periode</TableCell>
                      <TableCell isHeader>Duree</TableCell>
                      <TableCell isHeader>Raison</TableCell>
                      <TableCell isHeader>Statut</TableCell>
                      <TableCell isHeader>Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {absences.map((absence) => (
                      <TableRow key={absence.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {absence.staff?.avatar ? (
                              <img
                                src={absence.staff.avatar}
                                alt={`${absence.staff.firstName} ${absence.staff.lastName}`}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-medium">
                                {absence.staff?.firstName?.charAt(0)}
                                {absence.staff?.lastName?.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-black dark:text-white">
                                {absence.staff?.firstName} {absence.staff?.lastName}
                              </p>
                              <p className="text-xs text-bodydark">{absence.staff?.role}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-black dark:text-white">
                            {typeLabels[absence.type] || absence.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-black dark:text-white">{formatDate(absence.startDate)}</p>
                            <p className="text-xs text-bodydark">au {formatDate(absence.endDate)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-black dark:text-white">
                            {calculateDays(absence.startDate, absence.endDate)} jour
                            {calculateDays(absence.startDate, absence.endDate) > 1 ? "s" : ""}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-xs line-clamp-2 text-sm text-black dark:text-white">
                            {absence.reason || "Non specifie"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                              statusColors[absence.status]
                            }`}
                          >
                            {statusLabels[absence.status]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {absence.status === "PENDING" && (
                              <>
                                <Button
                                  onClick={() => openModal(absence, "approve")}
                                  disabled={processingId === absence.id}
                                  variant="success"
                                  size="sm"
                                >
                                  Approuver
                                </Button>
                                <Button
                                  onClick={() => openModal(absence, "reject")}
                                  disabled={processingId === absence.id}
                                  variant="danger"
                                  size="sm"
                                >
                                  Rejeter
                                </Button>
                              </>
                            )}
                            <Button
                              onClick={() => openModal(absence, "delete")}
                              disabled={processingId === absence.id}
                              variant="outline"
                              size="sm"
                            >
                              Supprimer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={modalTitle}>
        {selectedAbsence && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-bodydark">
                Employe:{" "}
                <span className="font-medium text-black dark:text-white">
                  {selectedAbsence.staff?.firstName} {selectedAbsence.staff?.lastName}
                </span>
              </p>
              <p className="text-sm text-bodydark">
                Type:{" "}
                <span className="font-medium text-black dark:text-white">
                  {typeLabels[selectedAbsence.type]}
                </span>
              </p>
              <p className="text-sm text-bodydark">
                Periode:{" "}
                <span className="font-medium text-black dark:text-white">
                  {formatDate(selectedAbsence.startDate)} au {formatDate(selectedAbsence.endDate)}
                </span>
              </p>
            </div>

            {modalAction !== "delete" && (
              <TextArea
                label="Notes (optionnel)"
                value={modalNotes}
                onChange={(value) => setModalNotes(value)}
                rows={3}
                placeholder="Ajoutez une note..."
              />
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                onClick={closeModal}
                disabled={processingId === selectedAbsence.id}
                variant="outline"
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmAction}
                disabled={processingId === selectedAbsence.id}
                variant={modalAction === "approve" ? "success" : "danger"}
              >
                {processingId === selectedAbsence.id ? "Traitement..." : "Confirmer"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
