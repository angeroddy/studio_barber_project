import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import Button from '../ui/button/Button';
import Input from '../form/input/InputField';
import TextArea from '../form/input/TextArea';
import Alert from '../ui/alert/Alert';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '../ui/table';
import type { ClosedDay } from '../../services/closedDay.service';
import {
  getClosedDaysBySalon,
  createClosedDay,
  updateClosedDay,
  deleteClosedDay,
  formatShortDate
} from '../../services/closedDay.service';

interface ClosedDayManagementProps {
  salonId: string;
  salonName: string;
}

const ClosedDayManagement: React.FC<ClosedDayManagementProps> = ({ salonId, salonName }) => {
  const [closedDays, setClosedDays] = useState<ClosedDay[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentClosedDay, setCurrentClosedDay] = useState<ClosedDay | null>(null);
  const [closedDayToDelete, setClosedDayToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [formData, setFormData] = useState({
    date: '',
    reason: ''
  });

  useEffect(() => {
    loadClosedDays();
  }, [salonId]);

  const loadClosedDays = async () => {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const data = await getClosedDaysBySalon(salonId, today);
      setClosedDays(data);
    } catch (error: any) {
      setAlertMessage(error.message || 'Erreur lors du chargement des jours de fermeture');
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setCurrentClosedDay(null);
    setFormData({ date: '', reason: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (closedDay: ClosedDay) => {
    setCurrentClosedDay(closedDay);
    setFormData({
      date: closedDay.date.split('T')[0], // Extraire YYYY-MM-DD
      reason: closedDay.reason || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.date) {
      setAlertMessage('La date est requise');
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 3000);
      return;
    }

    try {
      setIsLoading(true);

      if (currentClosedDay) {
        await updateClosedDay(salonId, currentClosedDay.id, formData);
        setAlertMessage('Jour de fermeture modifié avec succès');
      } else {
        await createClosedDay(salonId, formData);
        setAlertMessage('Jour de fermeture ajouté avec succès');
      }

      setIsModalOpen(false);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
      await loadClosedDays();
    } catch (error: any) {
      setAlertMessage(error.message || 'Erreur lors de la sauvegarde');
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setClosedDayToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!closedDayToDelete) return;

    try {
      setIsLoading(true);
      await deleteClosedDay(salonId, closedDayToDelete);
      setAlertMessage('Jour de fermeture supprimé avec succès');
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
      await loadClosedDays();
    } catch (error: any) {
      setAlertMessage(error.message || 'Erreur lors de la suppression');
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      setClosedDayToDelete(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Jours de fermeture exceptionnels - {salonName}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez les jours où le salon sera fermé exceptionnellement
          </p>
        </div>
        <Button onClick={handleAdd} variant="primary" disabled={isLoading}>
          Ajouter un jour de fermeture
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

      {closedDays.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Aucun jour de fermeture prévu
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                  Date
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                  Raison
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closedDays.map((closedDay) => (
                <TableRow
                  key={closedDay.id}
                  className="border-b border-gray-200 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <TableCell className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {formatShortDate(closedDay.date)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {closedDay.reason || '-'}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(closedDay)}
                        className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        title="Modifier"
                        disabled={isLoading}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(closedDay.id)}
                        className="rounded-lg p-2 text-error-600 transition hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20"
                        title="Supprimer"
                        disabled={isLoading}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal d'ajout/modification */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentClosedDay ? 'Modifier le jour de fermeture' : 'Ajouter un jour de fermeture'}
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date *
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Raison (optionnel)
            </label>
            <TextArea
              placeholder="Ex: Congés annuels, Formation, etc."
              rows={3}
              value={formData.reason}
              onChange={(value) => setFormData({ ...formData, reason: value })}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={() => setIsModalOpen(false)} variant="outline" disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSave} variant="primary" disabled={isLoading}>
            {isLoading ? 'Enregistrement...' : currentClosedDay ? 'Modifier' : 'Ajouter'}
          </Button>
        </div>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} className="max-w-md p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/30">
            <svg className="h-6 w-6 text-error-600 dark:text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Confirmer la suppression
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Êtes-vous sûr de vouloir supprimer ce jour de fermeture ?
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => setIsDeleteModalOpen(false)} variant="outline" disabled={isLoading}>
              Annuler
            </Button>
            <Button onClick={handleDeleteConfirm} variant="primary" className="bg-error-600 hover:bg-error-700" disabled={isLoading}>
              {isLoading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClosedDayManagement;
