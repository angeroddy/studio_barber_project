import { useState, useEffect } from "react";
import { Modal } from "../../components/ui/modal";
import type { Staff, StaffSchedule } from "../../services/staff.service";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

interface StaffScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
  date: Date | null;
  dayOfWeek: number;
  existingSchedules?: StaffSchedule[];
  onSave: (timeSlots: TimeSlot[], isWorking: boolean) => Promise<void>;
  onCopyToOtherDays?: (sourceDayOfWeek: number, targetDays: number[], timeSlots: TimeSlot[], isWorking: boolean) => Promise<void>;
}

const StaffScheduleModal: React.FC<StaffScheduleModalProps> = ({
  isOpen,
  onClose,
  staff,
  date,
  dayOfWeek,
  existingSchedules = [],
  onSave,
  onCopyToOtherDays,
}) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isWorking, setIsWorking] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedTargetDays, setSelectedTargetDays] = useState<Set<number>>(new Set());

  // Génère des options d'heures (00:00 à 23:45 par intervalles de 15 min)
  const generateTimeOptions = (): string[] => {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const h = hour.toString().padStart(2, "0");
        const m = minute.toString().padStart(2, "0");
        options.push(`${h}:${m}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Noms des jours en français
  const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

  // Formate la date pour l'affichage (ex: "lun. 8 déc.")
  const formatDate = (d: Date): string => {
    const dayName = dayNames[d.getDay()].substring(0, 3);
    const dayNum = d.getDate();
    const monthNames = ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];
    const month = monthNames[d.getMonth()];

    return `${dayName}. ${dayNum} ${month}.`;
  };

  // Initialise les time slots depuis les horaires existants
  useEffect(() => {
    if (existingSchedules.length > 0) {
      // Charger toutes les plages horaires existantes
      const availableSchedules = existingSchedules.filter(s => s.isAvailable);

      if (availableSchedules.length > 0) {
        setTimeSlots(
          availableSchedules.map(schedule => ({
            id: crypto.randomUUID(),
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          }))
        );
        setIsWorking(true);
      } else {
        setTimeSlots([]);
        setIsWorking(false);
      }
    } else {
      // Horaires par défaut (aucune plage existante)
      setTimeSlots([
        {
          id: crypto.randomUUID(),
          startTime: "09:00",
          endTime: "18:00",
        },
      ]);
      setIsWorking(true);
    }
  }, [existingSchedules, isOpen]);

  // Ajoute une nouvelle plage horaire
  const addTimeSlot = () => {
    setTimeSlots([
      ...timeSlots,
      {
        id: crypto.randomUUID(),
        startTime: "09:00",
        endTime: "18:00",
      },
    ]);
  };

  // Supprime une plage horaire
  const removeTimeSlot = (id: string) => {
    if (timeSlots.length === 1) {
      // Si c'est la dernière plage, marquer comme non travaillé
      setIsWorking(false);
      setTimeSlots([]);
    } else {
      setTimeSlots(timeSlots.filter((slot) => slot.id !== id));
    }
  };

  // Met à jour une plage horaire
  const updateTimeSlot = (id: string, field: "startTime" | "endTime", value: string) => {
    setTimeSlots(
      timeSlots.map((slot) =>
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    );
  };

  // Calcule la durée totale en heures
  const calculateTotalDuration = (): number => {
    return timeSlots.reduce((total, slot) => {
      const [startHour, startMin] = slot.startTime.split(":").map(Number);
      const [endHour, endMin] = slot.endTime.split(":").map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      const duration = (endMinutes - startMinutes) / 60;
      return total + (duration > 0 ? duration : 0);
    }, 0);
  };

  // Formate la durée pour l'affichage
  const formatDuration = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    if (h === 0 && m === 0) return "0 h";
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  };

  // Sauvegarde les horaires
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(timeSlots, isWorking);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde des horaires");
    } finally {
      setIsSaving(false);
    }
  };

  // Supprime tous les horaires du jour (jour non travaillé)
  const handleDeleteAll = () => {
    if (confirm(`Voulez-vous marquer ${staff?.firstName} comme non disponible pour ce jour ?`)) {
      setIsWorking(false);
      setTimeSlots([]);
    }
  };

  // Restaure un horaire de travail
  const handleAddWorkingHours = () => {
    setIsWorking(true);
    setTimeSlots([
      {
        id: crypto.randomUUID(),
        startTime: "09:00",
        endTime: "18:00",
      },
    ]);
  };

  // Ouvre le modal de copie
  const handleOpenCopyModal = () => {
    setShowCopyModal(true);
    setSelectedTargetDays(new Set());
  };

  // Ferme le modal de copie
  const handleCloseCopyModal = () => {
    setShowCopyModal(false);
    setSelectedTargetDays(new Set());
  };

  // Toggle jour de destination
  const handleToggleTargetDay = (day: number) => {
    setSelectedTargetDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  };

  // Copie vers d'autres jours
  const handleCopyToOtherDays = async () => {
    if (!onCopyToOtherDays || selectedTargetDays.size === 0) return;

    try {
      setIsSaving(true);
      await onCopyToOtherDays(dayOfWeek, Array.from(selectedTargetDays), timeSlots, isWorking);
      handleCloseCopyModal();
      alert(`Horaires copiés vers ${selectedTargetDays.size} jour(s) avec succès`);
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
      alert("Erreur lors de la copie des horaires");
    } finally {
      setIsSaving(false);
    }
  };

  if (!staff || !date) return null;

  const totalDuration = calculateTotalDuration();

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Plage horaire de {staff.firstName} le {formatDate(date)}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Vous modifiez uniquement les périodes de travail de cette journée.
              Pour définir des périodes de travail récurrentes, accédez à{" "}
              <button className="text-blue-600 hover:underline font-medium">
                périodes de travail planifiées
              </button>
              .
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulaire */}
        {isWorking && timeSlots.length > 0 ? (
          <div className="space-y-4">
            {timeSlots.map((slot, index) => (
              <div key={slot.id} className="flex items-center gap-4">
                {/* Heure de début */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {index === 0 ? "Heure de début" : ""}
                  </label>
                  <select
                    value={slot.startTime}
                    onChange={(e) => updateTimeSlot(slot.id, "startTime", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Heure de fin */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {index === 0 ? "Heure de fin" : ""}
                  </label>
                  <select
                    value={slot.endTime}
                    onChange={(e) => updateTimeSlot(slot.id, "endTime", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bouton supprimer */}
                <button
                  onClick={() => removeTimeSlot(slot.id)}
                  className="mt-0.5 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Supprimer cette plage horaire"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            ))}

            {/* Bouton ajouter une plage horaire */}
            <button
              onClick={addTimeSlot}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Ajouter une plage horaire
            </button>

            {/* Durée totale */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Durée totale du quart de travail :{" "}
                <span className="font-semibold text-gray-900">{formatDuration(totalDuration)}</span>
              </p>
            </div>
          </div>
        ) : (
          /* État non travaillé */
          <div className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-gray-100 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-gray-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">Ne travaille pas ce jour</p>
            <button
              onClick={handleAddWorkingHours}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Ajouter des heures de travail
            </button>
          </div>
        )}

        {/* Pied du modal */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          {/* Bouton supprimer (gauche) */}
          {isWorking && timeSlots.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Supprimer tous les horaires"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          )}

          {/* Boutons annuler/copier/enregistrer (droite) */}
          <div className="flex gap-3 ml-auto">
            {onCopyToOtherDays && (
              <button
                onClick={handleOpenCopyModal}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Copier ces horaires vers d'autres jours de la semaine"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copier vers...
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal secondaire pour copier vers d'autres jours */}
      {showCopyModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Copier les horaires du {dayNames[dayOfWeek]}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Sélectionnez les jours où vous souhaitez appliquer ces horaires
              </p>
            </div>

            <div className="mb-6 space-y-2">
              {dayNames.map((name, index) => {
                if (index === dayOfWeek) return null; // Ne pas afficher le jour source
                return (
                  <label
                    key={index}
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 p-3 transition hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTargetDays.has(index)}
                      onChange={() => handleToggleTargetDay(index)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {name}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCloseCopyModal}
                disabled={isSaving}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCopyToOtherDays}
                disabled={isSaving || selectedTargetDays.size === 0}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Copier ({selectedTargetDays.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default StaffScheduleModal;
