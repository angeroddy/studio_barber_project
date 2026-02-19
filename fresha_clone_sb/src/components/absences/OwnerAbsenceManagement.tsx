import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import absenceService from "../../services/absence.service";
import type {
  Absence,
  AbsenceStatus,
  AbsenceType,
} from "../../services/absence.service";
import { getStaffBySalon } from "../../services/staff.service";
import type { Staff } from "../../services/staff.service";
import { useSalon } from "../../context/SalonContext";
import { useForm } from "../../hooks/useForm";
import { useModal } from "../../hooks/useModal";
import { useAbsenceMetrics } from "../../hooks/useAbsenceMetrics";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import TextArea from "../form/input/TextArea";
import AbsenceMetricsCards from "./AbsenceMetricsCards";
import AbsenceTypeChart from "./AbsenceTypeChart";
import AbsenceTrendChart from "./AbsenceTrendChart";
import AbsenceFilters, { type AbsenceFilterState } from "./AbsenceFilters";
import {
  CheckLineIcon,
  CloseLineIcon,
  TrashBinIcon,
  CalenderIcon,
} from "../../icons";

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

  // Métriques
  const { metrics, loading: metricsLoading, error: metricsError } =
    useAbsenceMetrics(effectiveSalonId);

  // États pour les données
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filtres
  const [filters, setFilters] = useState<AbsenceFilterState>({
    status: "ALL",
    staffId: undefined,
    type: "ALL",
    startDate: undefined,
    endDate: undefined,
  });

  // Sélection pour actions en masse
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal
  const { isOpen, openModal, closeModal } = useModal();
  const [modalAction, setModalAction] = useState<ActionType>("approve");
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [modalNotes, setModalNotes] = useState("");

  // Formulaire avec useForm
  const form = useForm({
    initialValues: defaultFormData,
    onSubmit: handleCreateAbsence,
    validate: validateAbsenceForm,
    resetAfterSubmit: false,
  });

  // Validation du formulaire
  function validateAbsenceForm(values: FormData) {
    const errors: Record<string, string> = {};

    if (!values.staffId) errors.staffId = "Employé requis";
    if (!values.startDate) errors.startDate = "Date de début requise";
    if (!values.endDate) errors.endDate = "Date de fin requise";

    if (values.startDate && values.endDate) {
      if (new Date(values.endDate) < new Date(values.startDate)) {
        errors.endDate = "La date de fin doit être après la date de début";
      }
    }

    return errors;
  }

  // Fetch staff
  useEffect(() => {
    if (effectiveSalonId) fetchStaff();
  }, [effectiveSalonId]);

  // Fetch absences avec filtres
  useEffect(() => {
    if (effectiveSalonId) fetchAbsences();
  }, [effectiveSalonId, filters]);

  const fetchStaff = async () => {
    if (!effectiveSalonId) return;

    try {
      setLoadingStaff(true);
      const data = await getStaffBySalon(effectiveSalonId, true);
      setStaffMembers(data);

      // Set first staff as default in form
      if (data.length > 0 && !form.values.staffId) {
        form.setFieldValue("staffId", data[0].id);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur lors du chargement des employés");
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchAbsences = async () => {
    if (!effectiveSalonId) return;

    try {
      setLoading(true);

      const apiFilters: any = { salonId: effectiveSalonId };

      if (filters.status !== "ALL") {
        apiFilters.status = filters.status;
      }
      if (filters.staffId) {
        apiFilters.staffId = filters.staffId;
      }
      if (filters.type && filters.type !== "ALL") {
        // Note: Si le backend ne supporte pas le filtre par type, filtrer côté client
      }
      if (filters.startDate) {
        apiFilters.startDate = filters.startDate;
      }
      if (filters.endDate) {
        apiFilters.endDate = filters.endDate;
      }

      let data = await absenceService.getAbsences(apiFilters);

      // Filtrage côté client pour le type si nécessaire
      if (filters.type && filters.type !== "ALL") {
        data = data.filter((a) => a.type === filters.type);
      }

      setAbsences(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur lors du chargement des absences");
    } finally {
      setLoading(false);
    }
  };

  async function handleCreateAbsence(values: FormData) {
    if (!effectiveSalonId) return;

    try {
      const createdAbsence = await absenceService.createAbsence({
        staffId: values.staffId,
        salonId: effectiveSalonId,
        type: values.type,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason || undefined,
        notes: values.notes || undefined,
      });

      // Approuver automatiquement
      await absenceService.approveAbsence(
        createdAbsence.id,
        values.notes || "Absence déclarée par le propriétaire"
      );

      toast.success("Absence employé déclarée et approuvée avec succès");

      // Reset form
      form.resetForm();
      if (staffMembers.length > 0) {
        form.setFieldValue("staffId", staffMembers[0].id);
      }

      // Refresh data
      await fetchAbsences();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Erreur lors de la déclaration de l'absence"
      );
      throw err; // Re-throw pour que useForm gère l'erreur
    }
  }

  const openActionModal = (absence: Absence, action: ActionType) => {
    setSelectedAbsence(absence);
    setModalAction(action);
    setModalNotes("");
    openModal();
  };

  const handleConfirmAction = async () => {
    if (!selectedAbsence) return;

    try {
      setProcessingId(selectedAbsence.id);

      if (modalAction === "approve") {
        await absenceService.approveAbsence(selectedAbsence.id, modalNotes || undefined);
        toast.success("Absence approuvée avec succès");
      } else if (modalAction === "reject") {
        await absenceService.rejectAbsence(selectedAbsence.id, modalNotes || undefined);
        toast.success("Absence rejetée avec succès");
      } else {
        await absenceService.deleteAbsence(selectedAbsence.id);
        toast.success("Absence supprimée avec succès");
      }

      await fetchAbsences();
      closeModal();
      setSelectedAbsence(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Erreur lors du traitement");
    } finally {
      setProcessingId(null);
    }
  };

  // Actions en masse
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === absences.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(absences.map((a) => a.id));
    }
  };

  const handleBulkApprove = async () => {
    try {
      await Promise.all(
        selectedIds.map((id) =>
          absenceService.approveAbsence(id, "Approbation en masse")
        )
      );
      toast.success(`${selectedIds.length} absence(s) approuvée(s)`);
      setSelectedIds([]);
      await fetchAbsences();
    } catch (err) {
      toast.error("Erreur lors de l'approbation en masse");
    }
  };

  const handleBulkReject = async () => {
    try {
      await Promise.all(
        selectedIds.map((id) =>
          absenceService.rejectAbsence(id, "Rejet en masse")
        )
      );
      toast.success(`${selectedIds.length} absence(s) rejetée(s)`);
      setSelectedIds([]);
      await fetchAbsences();
    } catch (err) {
      toast.error("Erreur lors du rejet en masse");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map((id) => absenceService.deleteAbsence(id)));
      toast.success(`${selectedIds.length} absence(s) supprimée(s)`);
      setSelectedIds([]);
      await fetchAbsences();
    } catch (err) {
      toast.error("Erreur lors de la suppression en masse");
    }
  };

  // Helpers
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

  const openDatePicker = (event: React.MouseEvent<HTMLInputElement>) => {
    try {
      if ("showPicker" in HTMLInputElement.prototype) {
        event.currentTarget.showPicker();
      }
    } catch {
      // No-op: fallback to native browser behavior.
    }
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
        <p className="text-center text-bodydark">Veuillez sélectionner un salon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Cartes de Métriques */}
      <AbsenceMetricsCards
        metrics={metrics}
        loading={metricsLoading}
        error={metricsError}
      />

      {/* 2. Graphiques (Grid 2 colonnes sur desktop) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AbsenceTypeChart
          typeDistribution={metrics?.typeDistribution || []}
          loading={metricsLoading}
        />
        <AbsenceTrendChart
          monthlyData={metrics?.monthlyTrend || []}
          loading={metricsLoading}
        />
      </div>

      {/* 3. Formulaire de Déclaration */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-7.5 py-4 dark:border-strokedark">
          <h3 className="text-xl font-semibold text-black dark:text-white">
            Déclarer une absence employé
          </h3>
          <p className="mt-1 text-sm text-bodydark">
            Le propriétaire enregistre les absences des employés. L'absence est approuvée automatiquement.
          </p>
        </div>

        <form onSubmit={form.handleSubmit} className="grid grid-cols-1 gap-4 p-7.5 lg:grid-cols-2">
          {/* Employé */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Employé *
            </label>
            <select
              {...form.getFieldProps("staffId")}
              disabled={loadingStaff || form.isSubmitting}
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-white/90"
            >
              <option value="" disabled>
                {loadingStaff ? "Chargement des employés..." : "Sélectionner un employé"}
              </option>
              {staffMembers.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.firstName} {staff.lastName}
                </option>
              ))}
            </select>
            {form.touched.staffId && form.errors.staffId && (
              <span className="text-error-600 text-xs mt-1 block">{form.errors.staffId}</span>
            )}
          </div>

          {/* Type d'absence */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Type d'absence *
            </label>
            <select
              {...form.getFieldProps("type")}
              disabled={form.isSubmitting}
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-white/90"
            >
              <option value="VACATION">Vacances</option>
              <option value="SICK_LEAVE">Congé maladie</option>
              <option value="PERSONAL">Congé personnel</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>

          {/* Date de début */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-black dark:text-white">
              <CalenderIcon className="size-4" />
              Date de début *
            </label>
            <input
              type="date"
              {...form.getFieldProps("startDate")}
              onClick={openDatePicker}
              disabled={form.isSubmitting}
              required
              className="h-11 w-full cursor-pointer rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-white/90"
            />
            {form.touched.startDate && form.errors.startDate && (
              <span className="text-error-600 text-xs mt-1 block">{form.errors.startDate}</span>
            )}
          </div>

          {/* Date de fin */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-black dark:text-white">
              <CalenderIcon className="size-4" />
              Date de fin *
            </label>
            <input
              type="date"
              {...form.getFieldProps("endDate")}
              onClick={openDatePicker}
              disabled={form.isSubmitting}
              required
              className="h-11 w-full cursor-pointer rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-white/90"
            />
            {form.touched.endDate && form.errors.endDate && (
              <span className="text-error-600 text-xs mt-1 block">{form.errors.endDate}</span>
            )}
          </div>

          {/* Raison */}
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Raison
            </label>
            <textarea
              {...form.getFieldProps("reason")}
              rows={3}
              placeholder="Raison de l'absence..."
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-white/90"
            />
          </div>

          {/* Notes internes */}
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Notes internes
            </label>
            <textarea
              {...form.getFieldProps("notes")}
              rows={2}
              placeholder="Notes optionnelles..."
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-white/90"
            />
          </div>

          {/* Submit button */}
          <div className="lg:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={form.isSubmitting || loadingStaff || staffMembers.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3.5 text-sm text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
            >
              {form.isSubmitting ? "Déclaration..." : "Déclarer l'absence"}
            </button>
          </div>
        </form>
      </div>

      {/* 4. Section Historique avec Filtres */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-7.5 py-4 dark:border-strokedark">
          <h3 className="text-xl font-semibold text-black dark:text-white">
            Historique des absences
          </h3>
        </div>

        <div className="p-7.5">
          <AbsenceFilters
            filters={filters}
            onFilterChange={setFilters}
            staffList={staffMembers}
            loading={loading}
          />
        </div>

        {/* Barre d'actions en masse */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-50 px-7.5 py-4 flex items-center justify-between dark:bg-blue-900/20">
            <span className="text-sm text-gray-700 dark:text-white/90">
              {selectedIds.length} absence{selectedIds.length > 1 ? "s" : ""} sélectionnée
              {selectedIds.length > 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              <Button
                onClick={handleBulkApprove}
                variant="success"
                size="sm"
                startIcon={<CheckLineIcon />}
              >
                Approuver
              </Button>
              <Button
                onClick={handleBulkReject}
                variant="danger"
                size="sm"
                startIcon={<CloseLineIcon />}
              >
                Rejeter
              </Button>
              <Button
                onClick={handleBulkDelete}
                variant="outline"
                size="sm"
                startIcon={<TrashBinIcon />}
              >
                Supprimer
              </Button>
            </div>
          </div>
        )}

        {/* Tableau */}
        <div className="p-7.5">
          {loading ? (
            <p className="text-center text-bodydark">Chargement...</p>
          ) : absences.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalenderIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-lg text-gray-500 dark:text-gray-400">Aucune absence trouvée</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Modifiez les filtres ou déclarez une nouvelle absence
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === absences.length && absences.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell isHeader>Employé</TableCell>
                    <TableCell isHeader>Type</TableCell>
                    <TableCell isHeader>Période</TableCell>
                    <TableCell isHeader>Durée</TableCell>
                    <TableCell isHeader>Raison</TableCell>
                    <TableCell isHeader>Statut</TableCell>
                    <TableCell isHeader>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {absences.map((absence) => (
                    <TableRow key={absence.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(absence.id)}
                          onChange={() => toggleSelect(absence.id)}
                          className="rounded"
                        />
                      </TableCell>
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
                          {absence.reason || "Non spécifié"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusColors[absence.status]
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
                                onClick={() => openActionModal(absence, "approve")}
                                disabled={processingId === absence.id}
                                variant="success"
                                size="sm"
                                startIcon={<CheckLineIcon />}
                              >
                                Approuver
                              </Button>
                              <Button
                                onClick={() => openActionModal(absence, "reject")}
                                disabled={processingId === absence.id}
                                variant="danger"
                                size="sm"
                                startIcon={<CloseLineIcon />}
                              >
                                Rejeter
                              </Button>
                            </>
                          )}
                          <Button
                            onClick={() => openActionModal(absence, "delete")}
                            disabled={processingId === absence.id}
                            variant="outline"
                            size="sm"
                            startIcon={<TrashBinIcon />}
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

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} title={modalTitle}>
        {selectedAbsence && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-bodydark">
                Employé:{" "}
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
                Période:{" "}
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
    </div>
  );
}
