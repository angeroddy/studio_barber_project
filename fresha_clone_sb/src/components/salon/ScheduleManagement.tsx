import React, { useState, useEffect } from 'react';
import Button from '../ui/button/Button';
import Input from '../form/input/InputField';
import Alert from '../ui/alert/Alert';
import type { Schedule, TimeSlot } from '../../services/schedule.service';
import {
  getSchedulesBySalon,
  upsertSchedule,
  createDefaultSchedules,
  getDayName
} from '../../services/schedule.service';

interface ScheduleManagementProps {
  salonId: string;
  salonName: string;
}

// Interface pour gérer les plages horaires dans le state local
interface LocalTimeSlot {
  startTime: string;
  endTime: string;
  tempId?: string; // ID temporaire pour React keys
}

interface LocalSchedule {
  dayOfWeek: number;
  isClosed: boolean;
  timeSlots: LocalTimeSlot[];
  id?: string;
}

const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ salonId, salonName }) => {
  const [schedules, setSchedules] = useState<LocalSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [dayToCopy, setDayToCopy] = useState<number | null>(null);
  const [selectedTargetDays, setSelectedTargetDays] = useState<Set<number>>(new Set());

  // Charger les horaires
  useEffect(() => {
    loadSchedules();
  }, [salonId]);

  const loadSchedules = async () => {
    try {
      setIsLoading(true);
      const data = await getSchedulesBySalon(salonId);

      // Convertir les schedules en local schedules et compléter avec les jours manquants
      const fullSchedules: LocalSchedule[] = [];
      for (let day = 0; day <= 6; day++) {
        const existing = data.find(s => s.dayOfWeek === day);
        if (existing) {
          fullSchedules.push({
            id: existing.id,
            dayOfWeek: existing.dayOfWeek,
            isClosed: existing.isClosed,
            timeSlots: existing.timeSlots.map(ts => ({
              startTime: ts.startTime,
              endTime: ts.endTime,
              tempId: ts.id
            }))
          });
        } else {
          // Créer un placeholder avec une plage horaire par défaut
          fullSchedules.push({
            dayOfWeek: day,
            isClosed: day === 0, // Dimanche fermé par défaut
            timeSlots: day === 0 ? [] : [
              { startTime: '09:00', endTime: '12:00', tempId: `temp-${day}-0` },
              { startTime: '14:00', endTime: '18:00', tempId: `temp-${day}-1` }
            ]
          });
        }
      }
      setSchedules(fullSchedules);
    } catch (error: any) {
      setAlertMessage(error.message || 'Erreur lors du chargement des horaires');
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIsClosedChange = (dayOfWeek: number, isClosed: boolean) => {
    setSchedules(prev =>
      prev.map(schedule =>
        schedule.dayOfWeek === dayOfWeek
          ? { ...schedule, isClosed }
          : schedule
      )
    );
  };

  const handleTimeSlotChange = (
    dayOfWeek: number,
    slotIndex: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setSchedules(prev =>
      prev.map(schedule =>
        schedule.dayOfWeek === dayOfWeek
          ? {
              ...schedule,
              timeSlots: schedule.timeSlots.map((slot, idx) =>
                idx === slotIndex ? { ...slot, [field]: value } : slot
              )
            }
          : schedule
      )
    );
  };

  const handleAddTimeSlot = (dayOfWeek: number) => {
    setSchedules(prev =>
      prev.map(schedule =>
        schedule.dayOfWeek === dayOfWeek
          ? {
              ...schedule,
              timeSlots: [
                ...schedule.timeSlots,
                {
                  startTime: '09:00',
                  endTime: '18:00',
                  tempId: `temp-${dayOfWeek}-${schedule.timeSlots.length}`
                }
              ]
            }
          : schedule
      )
    );
  };

  const handleRemoveTimeSlot = (dayOfWeek: number, slotIndex: number) => {
    setSchedules(prev =>
      prev.map(schedule =>
        schedule.dayOfWeek === dayOfWeek
          ? {
              ...schedule,
              timeSlots: schedule.timeSlots.filter((_, idx) => idx !== slotIndex)
            }
          : schedule
      )
    );
  };

  const handleSaveSchedule = async (dayOfWeek: number) => {
    const schedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
    if (!schedule) return;

    // Validation
    if (!schedule.isClosed && schedule.timeSlots.length === 0) {
      setAlertMessage('Veuillez ajouter au moins une plage horaire ou marquer le jour comme fermé');
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
      return;
    }

    // Valider que chaque plage a des heures valides
    if (!schedule.isClosed) {
      for (const slot of schedule.timeSlots) {
        if (!slot.startTime || !slot.endTime) {
          setAlertMessage('Toutes les plages horaires doivent avoir une heure de début et de fin');
          setShowErrorAlert(true);
          setTimeout(() => setShowErrorAlert(false), 5000);
          return;
        }

        // Vérifier que startTime < endTime
        if (slot.startTime >= slot.endTime) {
          setAlertMessage('L\'heure de début doit être inférieure à l\'heure de fin');
          setShowErrorAlert(true);
          setTimeout(() => setShowErrorAlert(false), 5000);
          return;
        }
      }
    }

    try {
      setIsLoading(true);
      await upsertSchedule(salonId, {
        dayOfWeek,
        timeSlots: schedule.timeSlots.map(({ startTime, endTime }) => ({
          startTime,
          endTime
        })),
        isClosed: schedule.isClosed
      });
      setAlertMessage('Horaire enregistré avec succès');
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
      await loadSchedules();
    } catch (error: any) {
      setAlertMessage(error.message || 'Erreur lors de l\'enregistrement de l\'horaire');
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDefaults = async () => {
    if (!window.confirm('Créer les horaires par défaut ? Cela écrasera les horaires existants.')) {
      return;
    }

    try {
      setIsLoading(true);
      await createDefaultSchedules(salonId);
      setAlertMessage('Horaires par défaut créés avec succès (9h-12h et 14h-18h en semaine)');
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
      await loadSchedules();
    } catch (error: any) {
      setAlertMessage(error.message || 'Erreur lors de la création des horaires par défaut');
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCopyModal = (dayOfWeek: number) => {
    setDayToCopy(dayOfWeek);
    setSelectedTargetDays(new Set());
  };

  const handleCloseCopyModal = () => {
    setDayToCopy(null);
    setSelectedTargetDays(new Set());
  };

  const handleToggleTargetDay = (dayOfWeek: number) => {
    setSelectedTargetDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayOfWeek)) {
        newSet.delete(dayOfWeek);
      } else {
        newSet.add(dayOfWeek);
      }
      return newSet;
    });
  };

  const handleCopySchedule = () => {
    if (dayToCopy === null || selectedTargetDays.size === 0) return;

    const sourceSchedule = schedules.find(s => s.dayOfWeek === dayToCopy);
    if (!sourceSchedule) return;

    setSchedules(prev =>
      prev.map(schedule => {
        if (selectedTargetDays.has(schedule.dayOfWeek)) {
          // Copier les horaires du jour source vers ce jour
          return {
            ...schedule,
            isClosed: sourceSchedule.isClosed,
            timeSlots: sourceSchedule.timeSlots.map((slot, idx) => ({
              ...slot,
              tempId: `temp-${schedule.dayOfWeek}-${idx}`
            }))
          };
        }
        return schedule;
      })
    );

    setAlertMessage(`Horaires de ${getDayName(dayToCopy)} copiés vers ${selectedTargetDays.size} jour(s). N'oubliez pas d'enregistrer !`);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 5000);
    handleCloseCopyModal();
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Horaires d'ouverture - {salonName}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Définissez plusieurs plages horaires pour chaque jour de la semaine
          </p>
        </div>
        <Button onClick={handleCreateDefaults} variant="outline" disabled={isLoading}>
          Horaires par défaut
        </Button>
      </div>

      {showSuccessAlert && (
        <div className="mb-4">
          <Alert variant="success" title="Succès" message={alertMessage} />
        </div>
      )}

      {showErrorAlert && (
        <div className="mb-4">
          <Alert variant="error" title="Erreur" message={alertMessage} />
        </div>
      )}

      {/* Modal de copie des horaires */}
      {dayToCopy !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Copier les horaires de {getDayName(dayToCopy)}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Sélectionnez les jours de destination
              </p>
            </div>

            <div className="mb-6 space-y-2">
              {schedules
                .filter(s => s.dayOfWeek !== dayToCopy)
                .map(schedule => (
                  <label
                    key={schedule.dayOfWeek}
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 p-3 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTargetDays.has(schedule.dayOfWeek)}
                      onChange={() => handleToggleTargetDay(schedule.dayOfWeek)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {getDayName(schedule.dayOfWeek)}
                    </span>
                  </label>
                ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCloseCopyModal}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCopySchedule}
                variant="primary"
                className="flex-1"
                disabled={selectedTargetDays.size === 0}
              >
                Copier ({selectedTargetDays.size})
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {schedules.map((schedule) => (
          <div
            key={schedule.dayOfWeek}
            className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
          >
            {/* En-tête du jour */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {getDayName(schedule.dayOfWeek)}
                </span>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`closed-${schedule.dayOfWeek}`}
                    checked={schedule.isClosed}
                    onChange={(e) =>
                      handleIsClosedChange(schedule.dayOfWeek, e.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label
                    htmlFor={`closed-${schedule.dayOfWeek}`}
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    Fermé
                  </label>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => handleOpenCopyModal(schedule.dayOfWeek)}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  title="Copier ces horaires vers d'autres jours"
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
                <Button
                  onClick={() => handleSaveSchedule(schedule.dayOfWeek)}
                  variant="primary"
                  disabled={isLoading}
                >
                  Enregistrer
                </Button>
              </div>
            </div>

            {/* Plages horaires */}
            {!schedule.isClosed && (
              <div className="space-y-3">
                {schedule.timeSlots.map((slot, slotIndex) => (
                  <div
                    key={slot.tempId || `slot-${schedule.dayOfWeek}-${slotIndex}`}
                    className="flex items-center gap-3 rounded-md bg-gray-50 p-3 dark:bg-gray-700/50"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Plage {slotIndex + 1}:
                    </span>

                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          handleTimeSlotChange(
                            schedule.dayOfWeek,
                            slotIndex,
                            'startTime',
                            e.target.value
                          )
                        }
                        className="w-32"
                      />
                      <span className="text-gray-500 dark:text-gray-400">-</span>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          handleTimeSlotChange(
                            schedule.dayOfWeek,
                            slotIndex,
                            'endTime',
                            e.target.value
                          )
                        }
                        className="w-32"
                      />
                    </div>

                    {schedule.timeSlots.length > 1 && (
                      <button
                        onClick={() => handleRemoveTimeSlot(schedule.dayOfWeek, slotIndex)}
                        className="ml-auto rounded-lg p-2 text-error-600 transition hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20"
                        title="Supprimer cette plage"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}

                {/* Bouton pour ajouter une plage */}
                <button
                  onClick={() => handleAddTimeSlot(schedule.dayOfWeek)}
                  className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-300 p-3 text-sm font-medium text-gray-600 transition hover:border-brand-500 hover:text-brand-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-brand-400 dark:hover:text-brand-400"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Ajouter une plage horaire
                </button>
              </div>
            )}

            {/* Message si fermé */}
            {schedule.isClosed && (
              <div className="rounded-md bg-gray-100 p-4 text-center dark:bg-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Le salon est fermé ce jour
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleManagement;
