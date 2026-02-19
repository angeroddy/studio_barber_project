import { useState, useEffect } from "react";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import Alert from "../../components/ui/alert/Alert";
import type { Service } from "../../services/service.service";
import {
  getServicesBySalon,
  createService,
  updateService,
  deleteService,
} from "../../services/service.service";
import { useSalon } from "../../context/SalonContext";

const PRESET_CATEGORIES = ["La formule", "Coupes", "Barbe"] as const;

// Fonction pour générer une couleur aléatoire
const generateRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const CrudService = () => {
  // Récupérer le salon sélectionné
  const { selectedSalon } = useSalon();

  // ID du salon actuellement sélectionné
  const salonId = selectedSalon?.id || '';

  console.log('🏪 Salon sélectionné:', selectedSalon);
  console.log('🔑 Salon ID:', salonId);

  // États
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // États du formulaire
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 0,
    price: 0,
    category: "",
    isActive: true,
  });

  // Charger les services au montage du composant et quand le salon change
  useEffect(() => {
    // Ne pas charger si pas de salonId
    if (!salonId) {
      console.log('⚠️ Aucun salonId disponible - en attente...');
      setServices([]);
      return;
    }

    const loadServices = async () => {
      try {
        console.log('🔄 Chargement des services pour le salon:', salonId);
        setIsLoading(true);
        const data = await getServicesBySalon(salonId);
        console.log('✅ Services chargés:', data);
        console.log('📊 Nombre de services:', data.length);
        setServices(data);
      } catch (error: unknown) {
        console.error('❌ Erreur lors du chargement des services:', error);
        const errorMessage = error instanceof Error ? error.message : "Erreur lors du chargement des services";
        console.error('Message d\'erreur:', errorMessage);
        setAlertMessage(errorMessage);
        setShowErrorAlert(true);
        setTimeout(() => setShowErrorAlert(false), 5000);
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, [salonId]);

  // Gestion des changements de formulaire
  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Ouvrir le modal pour ajouter un service
  const handleAdd = () => {
    setCurrentService(null);
    setFormData({
      name: "",
      description: "",
      duration: 0,
      price: 0,
      category: "",
      isActive: true,
    });
    setIsCustomCategory(false);
    setIsModalOpen(true);
  };

  // Ouvrir le modal pour modifier un service
  const handleEdit = (service: Service) => {
    setCurrentService(service);
    const isPresetCategory = PRESET_CATEGORIES.includes(
      service.category as (typeof PRESET_CATEGORIES)[number]
    );
    setFormData({
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price: service.price,
      category: service.category,
      isActive: service.isActive,
    });
    setIsCustomCategory(!isPresetCategory);
    setIsModalOpen(true);
  };

  // Sauvegarder (ajouter ou modifier)
  const handleSave = async () => {
    console.log('💾 handleSave appelé');
    console.log('📝 FormData:', formData);
    console.log('🔄 Mode:', currentService ? 'Modification' : 'Ajout');
    if (currentService) {
      console.log('🎯 Service à modifier:', currentService);
    }

    // Validation
    if (!formData.name || !formData.duration || !formData.price || !formData.category) {
      setAlertMessage("Veuillez remplir tous les champs obligatoires");
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 3000);
      return;
    }

    try {
      setIsLoading(true);

      if (currentService) {
        // Modification - Garantir que les nombres sont bien des nombres
        console.log('🔄 Appel updateService avec ID:', currentService.id);
        const updatedService = await updateService(currentService.id, {
          name: formData.name,
          description: formData.description,
          duration: Number(formData.duration), // Forcer la conversion en nombre
          price: Number(formData.price),       // Forcer la conversion en nombre
          category: formData.category,
          isActive: formData.isActive,
        });
        console.log('✅ Service mis à jour:', updatedService);

        setServices((prev) =>
          prev.map((service) =>
            service.id === updatedService.id ? updatedService : service
          )
        );
        setAlertMessage("Service modifié avec succès");
      } else {
        // Ajout - Garantir que les nombres sont bien des nombres
        console.log('➕ Appel createService avec salonId:', salonId);
        const newService = await createService({
          salonId,
          name: formData.name,
          description: formData.description,
          duration: Number(formData.duration), // Forcer la conversion en nombre
          price: Number(formData.price),       // Forcer la conversion en nombre
          category: formData.category,
          isActive: formData.isActive,
          color: generateRandomColor(),
        });
        console.log('✅ Service créé:', newService);

        setServices((prev) => [...prev, newService]);
        setAlertMessage("Service ajouté avec succès");
      }

      setIsModalOpen(false);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (error: unknown) {
      console.error('❌ Erreur dans handleSave:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { errors?: string[] } } };
        console.error('📡 Réponse de l\'API:', axiosError.response?.data);
        if (axiosError.response?.data?.errors) {
          console.error('📋 Détails des erreurs:', axiosError.response.data.errors);
        }
      }
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la sauvegarde du service";
      setAlertMessage(errorMessage);
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Ouvrir la confirmation de suppression
  const handleDeleteClick = (id: string) => {
    setServiceToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Confirmer la suppression
  const handleDeleteConfirm = async () => {
    console.log('🗑️ handleDeleteConfirm appelé');
    console.log('🎯 ID du service à supprimer:', serviceToDelete);

    if (!serviceToDelete) return;

    try {
      setIsLoading(true);

      console.log('🔄 Appel deleteService avec ID:', serviceToDelete);
      await deleteService(serviceToDelete);
      console.log('✅ Service supprimé avec succès');

      setServices((prev) =>
        prev.filter((service) => service.id !== serviceToDelete)
      );
      setAlertMessage("Service supprimé avec succès");
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (error: unknown) {
      console.error('❌ Erreur dans handleDeleteConfirm:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        console.error('📡 Réponse de l\'API:', axiosError.response?.data);
      }
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la suppression du service";
      setAlertMessage(errorMessage);
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      setServiceToDelete(null);
    }
  };

  // Si pas de salon, afficher un message
  if (!salonId) {
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
            Vous devez être associé à un salon pour gérer les services.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Catalogue de prestations
          </h1>
          <p className="mt-2 text-xl text-gray-500 dark:text-gray-400">
            Consultez et gérez les prestations offertes par votre entreprise
          </p>
        </div>
        <Button onClick={handleAdd} variant="primary" disabled={isLoading}>
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Ajouter un service
        </Button>
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

      {/* Message de chargement ou aucun service */}
      {isLoading && services.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-brand-600 rounded-full" role="status" aria-label="loading">
            <span className="sr-only">Chargement...</span>
          </div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Chargement des services...
          </p>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Aucun service trouvé. Cliquez sur "Ajouter un service" pour commencer.
          </p>
        </div>
      ) : null}

      {/* Tableau des services */}
      {services.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300"
                >
                  Nom
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300"
                >
                  Description
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300"
                >
                  Durée
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300"
                >
                  Prix
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300"
                >
                  Catégorie
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300"
                >
                  Statut
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-700 dark:text-gray-300"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow
                  key={service.id}
                  className="border-b border-gray-200 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <TableCell className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {service.name}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {service.description || '-'}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {service.duration} min
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {service.price} €
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {service.category}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        service.isActive
                          ? "bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {service.isActive ? "Actif" : "Inactif"}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        title="Modifier"
                        disabled={isLoading}
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(service.id)}
                        className="rounded-lg p-2 text-error-600 transition hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20"
                        title="Supprimer"
                        disabled={isLoading}
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal d'ajout/modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-2xl p-6 sm:p-8"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentService ? "Modifier le service" : "Ajouter un service"}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Remplissez les informations du service
          </p>
        </div>

        <div className="space-y-4">
          {/* Nom */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nom du service *
            </label>
            <Input
              type="text"
              placeholder="Ex: Coupe Homme"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <TextArea
              placeholder="Décrivez le service..."
              rows={3}
              value={formData.description}
              onChange={(value) => handleInputChange("description", value)}
            />
          </div>

          {/* Durée et Prix */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Durée (minutes) *
              </label>
              <Input
                type="number"
                placeholder="30"
                value={formData.duration}
                onChange={(e) =>
                  handleInputChange("duration", parseInt(e.target.value) || 0)
                }
                min="0"
                step={5}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Prix (€) *
              </label>
              <Input
                type="number"
                placeholder="25.00"
                value={formData.price}
                onChange={(e) =>
                  handleInputChange("price", parseFloat(e.target.value) || 0)
                }
                min="0"
                step={0.5}
              />
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Catégorie *
            </label>
            <select
              value={isCustomCategory ? "__custom__" : formData.category}
              onChange={(e) => {
                const selectedValue = e.target.value;

                if (selectedValue === "__custom__") {
                  setIsCustomCategory(true);
                  if (
                    PRESET_CATEGORIES.includes(
                      formData.category as (typeof PRESET_CATEGORIES)[number]
                    )
                  ) {
                    handleInputChange("category", "");
                  }
                  return;
                }

                setIsCustomCategory(false);
                handleInputChange("category", selectedValue);
              }}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Selectionner une categorie</option>
              {PRESET_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
              <option value="__custom__">Autre (personnalise)</option>
            </select>

            {isCustomCategory && (
              <div className="mt-3">
                <Input
                  type="text"
                  placeholder="Entrer une categorie personnalisee"
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Statut */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleInputChange("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Service actif
            </label>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            onClick={() => setIsModalOpen(false)}
            variant="outline"
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? "Enregistrement..." : currentService ? "Modifier" : "Ajouter"}
          </Button>
        </div>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="max-w-md p-6"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/30">
            <svg
              className="h-6 w-6 text-error-600 dark:text-error-400"
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
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Confirmer la suppression
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Êtes-vous sûr de vouloir supprimer ce service ? Cette action est
            irréversible.
          </p>
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => setIsDeleteModalOpen(false)}
              variant="outline"
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="primary"
              className="bg-error-600 hover:bg-error-700"
              disabled={isLoading}
            >
              {isLoading ? "Suppression..." : "Supprimer"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CrudService;
