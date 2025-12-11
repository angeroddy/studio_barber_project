import React, { useState, useEffect } from 'react';
import Button from '../ui/button/Button';
import Input from '../form/input/InputField';
import Alert from '../ui/alert/Alert';
import type { Schedule } from '../../services/schedule.service';
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

const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ salonId, salonName }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Charger les horaires
  useEffect(() => {
    loadSchedules();
  }, [salonId]);

  const loadSchedules = async () => {
    try {
      setIsLoading(true);
      const data = await getSchedulesBySalon(salonId);
      // Compléter avec les jours manquants
      const fullSchedules: Schedule[] = [];
      for (let day = 0; day <= 6; day++) {
        const existing = data.find(s => s.dayOfWeek === day);
        if (existing) {
          fullSchedules.push(existing);
        } else {
          // Créer un placeholder
          fullSchedules.push({
            id: '',
            salonId,
            dayOfWeek: day,
            openTime: '09:00',
            closeTime: '18:00',
            isClosed: day === 0 // Dimanche fermé par défaut
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

  const handleScheduleChange = (dayOfWeek: number, field: string, value: string | boolean) => {
    setSchedules(prev =>
      prev.map(schedule =>
        schedule.dayOfWeek === dayOfWeek
          ? { ...schedule, [field]: value }
          : schedule
      )
    );
  };

  const handleSaveSchedule = async (dayOfWeek: number) => {
    const schedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
    if (!schedule) return;

    try {
      setIsLoading(true);
      await upsertSchedule(salonId, {
        dayOfWeek,
        openTime: schedule.openTime,
        closeTime: schedule.closeTime,
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
      setAlertMessage('Horaires par défaut créés avec succès');
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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Horaires d'ouverture - {salonName}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Définissez les horaires d'ouverture pour chaque jour de la semaine
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

      <div className="space-y-4">
        {schedules.map((schedule) => (
          <div
            key={schedule.dayOfWeek}
            className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="w-32">
              <span className="font-medium text-gray-900 dark:text-white">
                {getDayName(schedule.dayOfWeek)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={schedule.isClosed}
                onChange={(e) =>
                  handleScheduleChange(schedule.dayOfWeek, 'isClosed', e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">Fermé</label>
            </div>

            {!schedule.isClosed && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Ouverture:</label>
                  <Input
                    type="time"
                    value={schedule.openTime}
                    onChange={(e) =>
                      handleScheduleChange(schedule.dayOfWeek, 'openTime', e.target.value)
                    }
                    className="w-32"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Fermeture:</label>
                  <Input
                    type="time"
                    value={schedule.closeTime}
                    onChange={(e) =>
                      handleScheduleChange(schedule.dayOfWeek, 'closeTime', e.target.value)
                    }
                    className="w-32"
                  />
                </div>
              </>
            )}

            <Button
              onClick={() => handleSaveSchedule(schedule.dayOfWeek)}
              variant="primary"
              className="ml-auto"
              disabled={isLoading}
            >
              Enregistrer
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleManagement;
