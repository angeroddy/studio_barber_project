import { useState, useEffect } from "react";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Alert from "../../components/ui/alert/Alert";
import { useSalon } from "../../context/SalonContext";
import { updateSalon } from "../../services/salon.service";
import type { Salon } from "../../services/salon.service";

const SalonSettings = () => {
  const { selectedSalon, refreshSalon } = useSalon();

  // États
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // États du formulaire
  const [formData, setFormData] = useState({
    bufferBefore: 0,
    bufferAfter: 0,
    processingTime: 0,
  });

  // Charger les données du salon
  useEffect(() => {
    if (selectedSalon) {
      setFormData({
        bufferBefore: selectedSalon.bufferBefore || 0,
        bufferAfter: selectedSalon.bufferAfter || 0,
        processingTime: selectedSalon.processingTime || 0,
      });
    }
  }, [selectedSalon]);

  // Gestion des changements de formulaire
  const handleInputChange = (field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Sauvegarder les paramètres
  const handleSave = async () => {
    if (!selectedSalon) return;

    try {
      setIsLoading(true);

      await updateSalon(selectedSalon.id, {
        bufferBefore: formData.bufferBefore,
        bufferAfter: formData.bufferAfter,
        processingTime: formData.processingTime,
      });

      // Rafraîchir le salon dans le contexte
      if (refreshSalon) {
        await refreshSalon();
      }

      setAlertMessage("Paramètres enregistrés avec succès");
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (error: unknown) {
      console.error("Erreur lors de la sauvegarde:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la sauvegarde des paramètres";
      setAlertMessage(errorMessage);
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer la durée totale bloquée pour un service de 30 min (exemple)
  const exampleServiceDuration = 30;
  const totalBlockedDuration = formData.bufferBefore + exampleServiceDuration + formData.processingTime + formData.bufferAfter;

  if (!selectedSalon) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
            <svg
              className="h-8 w-8 text-yellow-600 dark:text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Aucun salon trouvé
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Vous devez être associé à un salon pour gérer les paramètres.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Paramètres du salon
        </h1>
        <p className="mt-2 text-xl text-gray-500 dark:text-gray-400">
          Configurez les temps tampons entre les rendez-vous
        </p>
      </div>

      {/* Alert de succès */}
      {showSuccessAlert && (
        <div className="mb-4">
          <Alert
            variant="success"
            title="Succès"
            message={alertMessage}
          />
        </div>
      )}

      {/* Alert d'erreur */}
      {showErrorAlert && (
        <div className="mb-4">
          <Alert
            variant="error"
            title="Erreur"
            message={alertMessage}
          />
        </div>
      )}

      {/* Contenu principal */}
      <div className="max-w-3xl">
        {/* Section d'explication */}
        <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <svg
              className="h-6 w-6 flex-shrink-0 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Temps tampons (Buffer Time)
              </h3>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                Les temps tampons permettent de bloquer automatiquement du temps avant et après chaque rendez-vous.
                Cette configuration s'applique à <strong>tous les services</strong> du salon et empêche que les rendez-vous soient trop serrés.
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="space-y-6">
            {/* Temps de préparation */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Temps de préparation (avant le rendez-vous)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={formData.bufferBefore}
                onChange={(e) => handleInputChange("bufferBefore", parseInt(e.target.value) || 0)}
                min="0"
                step={5}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Temps bloqué avant chaque rendez-vous pour la préparation (ex: préparer la station, les outils)
              </p>
            </div>

            {/* Temps de traitement supplémentaire */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Temps de traitement supplémentaire
              </label>
              <Input
                type="number"
                placeholder="0"
                value={formData.processingTime}
                onChange={(e) => handleInputChange("processingTime", parseInt(e.target.value) || 0)}
                min="0"
                step={5}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Temps supplémentaire estimé pour les services qui peuvent déborder (minutes)
              </p>
            </div>

            {/* Temps de nettoyage */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Temps de nettoyage (après le rendez-vous)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={formData.bufferAfter}
                onChange={(e) => handleInputChange("bufferAfter", parseInt(e.target.value) || 0)}
                min="0"
                step={5}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Temps bloqué après chaque rendez-vous pour le nettoyage (ex: balayer, désinfecter)
              </p>
            </div>

            {/* Résumé visuel */}
            <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-blue-900/20 dark:to-indigo-900/20">
              <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Exemple : Service de 30 minutes
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Préparation :</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formData.bufferBefore} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Service :</span>
                  <span className="font-medium text-gray-900 dark:text-white">{exampleServiceDuration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Traitement :</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formData.processingTime} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Nettoyage :</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formData.bufferAfter} min</span>
                </div>
                <div className="mt-3 border-t border-gray-300 pt-3 dark:border-gray-600">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">Durée totale bloquée :</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalBlockedDuration} min</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-md bg-white/50 p-3 dark:bg-gray-800/50">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Si un client réserve à 10h00, le prochain créneau disponible sera à <strong>{`${10 + Math.floor(totalBlockedDuration / 60)}h${(totalBlockedDuration % 60).toString().padStart(2, '0')}`}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="mt-6 flex justify-end gap-3">
            <Button
              onClick={handleSave}
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? "Enregistrement..." : "Enregistrer les paramètres"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalonSettings;
