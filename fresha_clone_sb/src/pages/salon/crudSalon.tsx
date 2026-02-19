import { useState, useEffect } from "react";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import Alert from "../../components/ui/alert/Alert";
import type { Salon } from "../../services/salon.service";
import {
  getMySalons,
  createSalon,
  updateSalon,
  deleteSalon,
} from "../../services/salon.service";
import ScheduleManagement from "../../components/salon/ScheduleManagement";
import ClosedDayManagement from "../../components/salon/ClosedDayManagement";
import OwnerAbsenceManagement from "../../components/absences/OwnerAbsenceManagement";

type TabType = "info" | "schedules" | "closedDays" | "absences";

type SalonFormData = {
  name: string;
  address: string;
  city: string;
  zipCode: string;
  phone: string;
  email: string;
};

const EMPTY_SALON_FORM: SalonFormData = {
  name: "",
  address: "",
  city: "",
  zipCode: "",
  phone: "",
  email: "",
};

const CrudSalon = () => {
  // États
  const [salons, setSalons] = useState<Salon[]>([]);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentSalon, setCurrentSalon] = useState<Salon | null>(null);
  const [salonToDelete, setSalonToDelete] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingSelectedSalon, setIsEditingSelectedSalon] = useState(false);

  // États du formulaire
  const [formData, setFormData] = useState<SalonFormData>(EMPTY_SALON_FORM);
  const [selectedSalonFormData, setSelectedSalonFormData] = useState<SalonFormData>(EMPTY_SALON_FORM);

  // Charger les salons au montage du composant
  useEffect(() => {
    const loadSalons = async () => {
      try {
        console.log('🔄 Chargement des salons...');
        setIsLoading(true);
        const data = await getMySalons();
        console.log('✅ Salons chargés:', data);
        console.log('📊 Nombre de salons:', data.length);
        setSalons(data);
      } catch (error: unknown) {
        console.error('❌ Erreur lors du chargement des salons:', error);
        const errorMessage = error instanceof Error ? error.message : "Erreur lors du chargement des salons";
        console.error('Message d\'erreur:', errorMessage);
        setAlertMessage(errorMessage);
        setShowErrorAlert(true);
        setTimeout(() => setShowErrorAlert(false), 5000);
      } finally {
        setIsLoading(false);
      }
    };

    loadSalons();
  }, []);

  const mapSalonToFormData = (salon: Salon): SalonFormData => ({
    name: salon.name,
    address: salon.address,
    city: salon.city,
    zipCode: salon.zipCode,
    phone: salon.phone,
    email: salon.email,
  });

  const validateSalonFormData = (data: SalonFormData): string | null => {
    if (!data.name || !data.address || !data.city || !data.zipCode || !data.phone || !data.email) {
      return "Veuillez remplir tous les champs obligatoires";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return "Veuillez entrer une adresse email valide";
    }

    return null;
  };

  // Gestion des changements de formulaire
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectedSalonInputChange = (field: keyof SalonFormData, value: string) => {
    setSelectedSalonFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Ouvrir le modal pour ajouter un salon
  const handleAdd = () => {
    setCurrentSalon(null);
    setFormData(EMPTY_SALON_FORM);
    setIsModalOpen(true);
  };

  // Ouvrir le modal pour modifier un salon
  const handleEdit = (salon: Salon) => {
    setCurrentSalon(salon);
    setFormData(mapSalonToFormData(salon));
    setIsModalOpen(true);
  };

  // Gérer la sélection d'un salon
  const handleSelectSalon = (salon: Salon) => {
    setSelectedSalon(salon);
    setSelectedSalonFormData(mapSalonToFormData(salon));
    setIsEditingSelectedSalon(false);
    setActiveTab("info");
  };

  // Retour à la liste
  const handleBackToList = () => {
    setSelectedSalon(null);
    setIsEditingSelectedSalon(false);
    setActiveTab("info");
  };

  // Sauvegarder (ajouter ou modifier)
  const handleSave = async () => {
    console.log('💾 handleSave appelé');
    console.log('📝 FormData:', formData);
    console.log('🔄 Mode:', currentSalon ? 'Modification' : 'Ajout');

    const validationError = validateSalonFormData(formData);
    if (validationError) {
      setAlertMessage(validationError);
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 3000);
      return;
    }

    try {
      setIsLoading(true);

      if (currentSalon) {
        // Modification
        console.log('🔄 Appel updateSalon avec ID:', currentSalon.id);
        const updatedSalon = await updateSalon(currentSalon.id, {
          name: formData.name,
          address: formData.address,
          city: formData.city,
          zipCode: formData.zipCode,
          phone: formData.phone,
          email: formData.email,
        });
        console.log('✅ Salon mis à jour:', updatedSalon);

        setSalons((prev) =>
          prev.map((salon) =>
            salon.id === updatedSalon.id ? updatedSalon : salon
          )
        );
        // Mettre à jour le salon sélectionné si c'est le même
        if (selectedSalon && selectedSalon.id === updatedSalon.id) {
          setSelectedSalon(updatedSalon);
        }
        setAlertMessage("Salon modifié avec succès");
      } else {
        // Ajout
        console.log('➕ Appel createSalon');
        const newSalon = await createSalon({
          name: formData.name,
          address: formData.address,
          city: formData.city,
          zipCode: formData.zipCode,
          phone: formData.phone,
          email: formData.email,
        });
        console.log('✅ Salon créé:', newSalon);

        setSalons((prev) => [newSalon, ...prev]);
        setAlertMessage("Salon ajouté avec succès");
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
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la sauvegarde du salon";
      setAlertMessage(errorMessage);
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSelectedSalon = async () => {
    if (!selectedSalon) return;

    const validationError = validateSalonFormData(selectedSalonFormData);
    if (validationError) {
      setAlertMessage(validationError);
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 3000);
      return;
    }

    try {
      setIsLoading(true);
      const updatedSalon = await updateSalon(selectedSalon.id, selectedSalonFormData);

      setSalons((prev) =>
        prev.map((salon) => (salon.id === updatedSalon.id ? updatedSalon : salon))
      );
      setSelectedSalon(updatedSalon);
      setSelectedSalonFormData(mapSalonToFormData(updatedSalon));
      setIsEditingSelectedSalon(false);
      setAlertMessage("Salon modifié avec succès");
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la sauvegarde du salon";
      setAlertMessage(errorMessage);
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Ouvrir la confirmation de suppression
  const handleDeleteClick = (id: string) => {
    setSalonToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Confirmer la suppression
  const handleDeleteConfirm = async () => {
    console.log('🗑️ handleDeleteConfirm appelé');
    console.log('🎯 ID du salon à supprimer:', salonToDelete);

    if (!salonToDelete) return;

    try {
      setIsLoading(true);

      console.log('🔄 Appel deleteSalon avec ID:', salonToDelete);
      await deleteSalon(salonToDelete);
      console.log('✅ Salon supprimé avec succès');

      setSalons((prev) =>
        prev.filter((salon) => salon.id !== salonToDelete)
      );
      // Si le salon supprimé était sélectionné, retourner à la liste
      if (selectedSalon && selectedSalon.id === salonToDelete) {
        setSelectedSalon(null);
      }
      setAlertMessage("Salon supprimé avec succès");
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (error: unknown) {
      console.error('❌ Erreur dans handleDeleteConfirm:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        console.error('📡 Réponse de l\'API:', axiosError.response?.data);
      }
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la suppression du salon";
      setAlertMessage(errorMessage);
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      setSalonToDelete(null);
    }
  };

  // Si un salon est sélectionné, afficher les onglets
  if (selectedSalon) {
    return (
      <div className="p-6">
        {/* Bouton retour */}
        <div className="mb-6">
          <Button onClick={handleBackToList} variant="outline">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à la liste
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

        {/* En-tête avec nom du salon */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {selectedSalon.name}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {selectedSalon.address}, {selectedSalon.city}
          </p>
        </div>

        {/* Onglets */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('info')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'info'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Informations
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'schedules'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Horaires d'ouverture
            </button>
            <button
              onClick={() => setActiveTab('closedDays')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'closedDays'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Jours de fermeture
            </button>
            <button
              onClick={() => setActiveTab("absences")}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === "absences"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              Absences
            </button>
          </nav>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'info' && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Informations du salon
              </h2>
              {isEditingSelectedSalon ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => {
                      if (!selectedSalon) return;
                      setSelectedSalonFormData(mapSalonToFormData(selectedSalon));
                      setIsEditingSelectedSalon(false);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    disabled={isLoading}
                    onClick={handleSaveSelectedSalon}
                  >
                    {isLoading ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => setIsEditingSelectedSalon(true)}
                >
                  Modifier
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom</p>
                {isEditingSelectedSalon ? (
                  <Input
                    type="text"
                    value={selectedSalonFormData.name}
                    onChange={(e) => handleSelectedSalonInputChange("name", e.target.value)}
                  />
                ) : (
                  <p className="mt-1 text-base text-gray-900 dark:text-white">{selectedSalon.name}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Slug</p>
                <p className="mt-1 text-base text-gray-900 dark:text-white">{selectedSalon.slug}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Adresse</p>
                {isEditingSelectedSalon ? (
                  <Input
                    type="text"
                    value={selectedSalonFormData.address}
                    onChange={(e) => handleSelectedSalonInputChange("address", e.target.value)}
                  />
                ) : (
                  <p className="mt-1 text-base text-gray-900 dark:text-white">{selectedSalon.address}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ville</p>
                {isEditingSelectedSalon ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                      type="text"
                      value={selectedSalonFormData.city}
                      onChange={(e) => handleSelectedSalonInputChange("city", e.target.value)}
                    />
                    <Input
                      type="text"
                      value={selectedSalonFormData.zipCode}
                      onChange={(e) => handleSelectedSalonInputChange("zipCode", e.target.value)}
                    />
                  </div>
                ) : (
                  <p className="mt-1 text-base text-gray-900 dark:text-white">{selectedSalon.city}, {selectedSalon.zipCode}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Téléphone</p>
                {isEditingSelectedSalon ? (
                  <Input
                    type="tel"
                    value={selectedSalonFormData.phone}
                    onChange={(e) => handleSelectedSalonInputChange("phone", e.target.value)}
                  />
                ) : (
                  <p className="mt-1 text-base text-gray-900 dark:text-white">{selectedSalon.phone}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                {isEditingSelectedSalon ? (
                  <Input
                    type="email"
                    value={selectedSalonFormData.email}
                    onChange={(e) => handleSelectedSalonInputChange("email", e.target.value)}
                  />
                ) : (
                  <p className="mt-1 text-base text-gray-900 dark:text-white">{selectedSalon.email}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedules' && (
          <ScheduleManagement salonId={selectedSalon.id} salonName={selectedSalon.name} />
        )}

        {activeTab === 'closedDays' && (
          <ClosedDayManagement salonId={selectedSalon.id} salonName={selectedSalon.name} />
        )}

        {activeTab === "absences" && (
          <OwnerAbsenceManagement salonId={selectedSalon.id} />
        )}
      </div>
    );
  }

  // Vue liste des salons
  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestion des Salons
          </h1>
          <p className="mt-2 text-xl text-gray-500 dark:text-gray-400">
            Gérez vos salons et leurs informations
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
          Ajouter un salon
        </Button>
      </div>

      {/* Message d'aide */}
      {salons.length > 0 && (
        <div className="mb-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Astuce :</strong> Cliquez sur le bouton <strong>"Gérer"</strong> ou sur une ligne du tableau pour accéder aux horaires d'ouverture et aux jours de fermeture du salon
            </p>
          </div>
        </div>
      )}

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

      {/* Message de chargement ou aucun salon */}
      {isLoading && salons.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-brand-600 rounded-full" role="status" aria-label="loading">
            <span className="sr-only">Chargement...</span>
          </div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Chargement des salons...
          </p>
        </div>
      ) : salons.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Aucun salon trouvé. Cliquez sur "Ajouter un salon" pour commencer.
          </p>
        </div>
      ) : null}

      {/* Tableau des salons */}
      {salons.length > 0 && (
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
                  Adresse
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300"
                >
                  Ville
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300"
                >
                  Téléphone
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300"
                >
                  Email
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300"
                >
                  Statistiques
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-700 dark:text-gray-300"
                >
                  Gérer
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
              {salons.map((salon) => (
                <TableRow
                  key={salon.id}
                  className="border-b border-gray-200 transition hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-900/10 cursor-pointer"
                  onClick={() => handleSelectSalon(salon)}
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                        {salon.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {salon.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {salon.slug}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {salon.address}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {salon.city}, {salon.zipCode}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {salon.phone}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {salon.email}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {salon._count ? (
                      <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <div>Services: {salon._count.services}</div>
                        <div>Staff: {salon._count.staff}</div>
                        <div>Clients: {salon._count.clients}</div>
                        <div>Réservations: {salon._count.bookings}</div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSalon(salon);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 hover:shadow-md dark:bg-brand-500 dark:hover:bg-brand-600"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Gérer
                    </button>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(salon)}
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
                        onClick={() => handleDeleteClick(salon.id)}
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
            {currentSalon ? "Modifier le salon" : "Ajouter un salon"}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Remplissez les informations du salon
          </p>
        </div>

        <div className="space-y-4">
          {/* Nom */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nom du salon *
            </label>
            <Input
              type="text"
              placeholder="Ex: Salon Élégance"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
          </div>

          {/* Adresse */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Adresse *
            </label>
            <Input
              type="text"
              placeholder="Ex: 123 Rue de la Paix"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>

          {/* Ville et Code postal */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ville *
              </label>
              <Input
                type="text"
                placeholder="Ex: Paris"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Code postal *
              </label>
              <Input
                type="text"
                placeholder="Ex: 75001"
                value={formData.zipCode}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
              />
            </div>
          </div>

          {/* Téléphone et Email */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Téléphone *
              </label>
              <Input
                type="tel"
                placeholder="Ex: 01 23 45 67 89"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email *
              </label>
              <Input
                type="email"
                placeholder="Ex: contact@salon.fr"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
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
            {isLoading ? "Enregistrement..." : currentSalon ? "Modifier" : "Ajouter"}
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
            Êtes-vous sûr de vouloir supprimer ce salon ? Cette action est
            irréversible et supprimera également tous les services, membres du
            personnel et réservations associés.
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

export default CrudSalon;
