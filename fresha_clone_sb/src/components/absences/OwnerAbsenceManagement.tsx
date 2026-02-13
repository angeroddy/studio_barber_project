import { useEffect, useState } from "react";
import absenceService from "../../services/absence.service";
import type { Absence, AbsenceStatus } from "../../services/absence.service";
import { useSalon } from "../../context/SalonContext";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../ui/table";
import Alert from "../ui/alert/Alert";
import TextArea from "../form/input/TextArea";

const statusColors = {
  PENDING: "bg-warning/10 text-warning",
  APPROVED: "bg-success/10 text-success",
  REJECTED: "bg-danger/10 text-danger",
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

export default function OwnerAbsenceManagement() {
  const { selectedSalon } = useSalon();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<AbsenceStatus | "ALL">("PENDING");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [modalNotes, setModalNotes] = useState("");
  const [modalAction, setModalAction] = useState<"approve" | "reject">("approve");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    if (selectedSalon) {
      fetchAbsences();
    }
  }, [selectedSalon, filterStatus]);

  const fetchAbsences = async () => {
    if (!selectedSalon) return;

    try {
      setLoading(true);
      const filters: any = { salonId: selectedSalon.id };
      if (filterStatus !== "ALL") {
        filters.status = filterStatus;
      }
      const data = await absenceService.getAbsences(filters);
      setAbsences(data);
    } catch (err: any) {
      setAlertMessage(err.response?.data?.message || "Erreur lors du chargement des absences");
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (absence: Absence, action: "approve" | "reject") => {
    setSelectedAbsence(absence);
    setModalAction(action);
    setModalNotes("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedAbsence(null);
    setModalNotes("");
  };

  const handleConfirmAction = async () => {
    if (!selectedAbsence) return;

    try {
      setProcessingId(selectedAbsence.id);
      if (modalAction === "approve") {
        await absenceService.approveAbsence(selectedAbsence.id, modalNotes || undefined);
        setAlertMessage("Absence approuvée avec succès");
      } else {
        await absenceService.rejectAbsence(selectedAbsence.id, modalNotes || undefined);
        setAlertMessage("Absence rejetée avec succès");
      }
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 5000);
      await fetchAbsences();
      closeModal();
    } catch (err: any) {
      setAlertMessage(err.message || "Erreur lors du traitement de la demande");
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (!selectedSalon) {
    return (
      <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <p className="text-center text-bodydark">Veuillez sélectionner un salon</p>
      </div>
    );
  }

  return (
    <>
      {/* Alerts */}
      {showSuccessAlert && (
        <Alert
          type="success"
          title="Succès"
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

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Header avec filtres */}
        <div className="border-b border-stroke px-7.5 py-4 dark:border-strokedark">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold text-black dark:text-white">
              Gestion des absences
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
                Approuvées
              </Button>
              <Button
                onClick={() => setFilterStatus("REJECTED")}
                variant={filterStatus === "REJECTED" ? "primary" : "outline"}
                size="sm"
              >
                Rejetées
              </Button>
            </div>
          </div>
        </div>

        {/* Liste des absences */}
        <div className="p-7.5">
          {loading ? (
            <p className="text-center text-bodydark">Chargement...</p>
          ) : absences.length === 0 ? (
            <p className="text-center text-bodydark">
              Aucune demande d'absence {filterStatus !== "ALL" && statusLabels[filterStatus as AbsenceStatus].toLowerCase()}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                            <p className="text-xs text-bodydark">
                              {absence.staff?.role}
                            </p>
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
                          <p className="text-black dark:text-white">
                            {formatDate(absence.startDate)}
                          </p>
                          <p className="text-xs text-bodydark">
                            au {formatDate(absence.endDate)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-black dark:text-white">
                          {calculateDays(absence.startDate, absence.endDate)} jour
                          {calculateDays(absence.startDate, absence.endDate) > 1 ? "s" : ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-black dark:text-white line-clamp-2 max-w-xs">
                          {absence.reason || "Non spécifié"}
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
                        {absence.status === "PENDING" ? (
                          <div className="flex gap-2">
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
                          </div>
                        ) : (
                          <span className="text-bodydark text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmation */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={`${modalAction === "approve" ? "Approuver" : "Rejeter"} la demande`}
      >
        {selectedAbsence && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-bodydark">
                Employé:{" "}
                <span className="text-black dark:text-white font-medium">
                  {selectedAbsence.staff?.firstName} {selectedAbsence.staff?.lastName}
                </span>
              </p>
              <p className="text-sm text-bodydark">
                Type:{" "}
                <span className="text-black dark:text-white font-medium">
                  {typeLabels[selectedAbsence.type]}
                </span>
              </p>
              <p className="text-sm text-bodydark">
                Période:{" "}
                <span className="text-black dark:text-white font-medium">
                  {formatDate(selectedAbsence.startDate)} au {formatDate(selectedAbsence.endDate)}
                </span>
              </p>
            </div>

            <TextArea
              label="Notes (optionnel)"
              value={modalNotes}
              onChange={(value) => setModalNotes(value)}
              rows={3}
              placeholder="Ajoutez une note..."
            />

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
