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
import type { Staff } from "../../services/staff.service";
import {
  getStaffBySalon,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../../services/staff.service";
import { useSalon } from "../../context/SalonContext";

const CrudStaff = () => {
  // Récupérer le salon sélectionné
  const { selectedSalon } = useSalon();

  // ID du salon actuellement sélectionné
  const salonId = selectedSalon?.id || '';

  console.log('🏪 Salon sélectionné:', selectedSalon);
  console.log('🔑 Salon ID:', salonId);

  // États
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // États du formulaire
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "EMPLOYEE" as 'MANAGER' | 'EMPLOYEE',
    specialties: [] as string[],
    bio: "",
    isActive: true,
  });

  // État pour gérer l'ajout de spécialités
  const [newSpecialty, setNewSpecialty] = useState("");

  // Charger le personnel au montage du composant et quand le salon change
  useEffect(() => {
    // Ne pas charger si pas de salonId
    if (!salonId) {
      console.log('Aucun salonId disponible - en attente...');
      return;
    }

    const loadStaff = async () => {
      try {
        console.log('= Chargement du personnel pour le salon:', salonId);
        setIsLoading(true);
        const data = await getStaffBySalon(salonId);
        console.log(' Personnel chargé:', data);
        console.log('Nombre de membres:', data.length);
        setStaffList(data);
      } catch (error: unknown) {
        console.error('L Erreur lors du chargement du personnel:', error);
        const errorMessage = error instanceof Error ? error.message : "Erreur lors du chargement du personnel";
        console.error('Message d\'erreur:', errorMessage);
        setAlertMessage(errorMessage);
        setShowErrorAlert(true);
        setTimeout(() => setShowErrorAlert(false), 5000);
      } finally {
        setIsLoading(false);
      }
    };

    loadStaff();
  }, [salonId]);

  // Gestion des changements de formulaire
  const handleInputChange = (field: string, value: string | boolean | 'MANAGER' | 'EMPLOYEE') => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Ajouter une spécialité
  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData((prev) => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()],
      }));
      setNewSpecialty("");
    }
  };

  // Supprimer une spécialité
  const handleRemoveSpecialty = (specialty: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((s) => s !== specialty),
    }));
  };

  // Ouvrir le modal pour ajouter un membre
  const handleAdd = () => {
    setCurrentStaff(null);
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "EMPLOYEE",
      specialties: [],
      bio: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Ouvrir le modal pour modifier un membre
  const handleEdit = (staff: Staff) => {
    setCurrentStaff(staff);
    setFormData({
      email: staff.email,
      firstName: staff.firstName,
      lastName: staff.lastName,
      phone: staff.phone || "",
      role: staff.role,
      specialties: staff.specialties || [],
      bio: staff.bio || "",
      isActive: staff.isActive,
    });
    setIsModalOpen(true);
  };

  // Sauvegarder (ajouter ou modifier)
  const handleSave = async () => {
    console.log('handleSave appelé');
    console.log('FormData:', formData);
    console.log('= Mode:', currentStaff ? 'Modification' : 'Ajout');

    // Validation
    if (!formData.firstName || !formData.lastName) {
      setAlertMessage("Veuillez remplir tous les champs obligatoires (Prénom et Nom)");
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 3000);
      return;
    }

    try {
      setIsLoading(true);

      if (currentStaff) {
        // Modification
        console.log('= Appel updateStaff avec ID:', currentStaff.id);
        const updateData: {
          email?: string;
          firstName: string;
          lastName: string;
          phone?: string;
          role: 'MANAGER' | 'EMPLOYEE';
          specialties: string[];
          bio?: string;
          isActive: boolean;
        } = {
          email: formData.email || undefined,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          role: formData.role,
          specialties: formData.specialties,
          bio: formData.bio || undefined,
          isActive: formData.isActive,
        };

        const updatedStaff = await updateStaff(currentStaff.id, updateData);
        console.log(' Membre mis à jour:', updatedStaff);

        setStaffList((prev) =>
          prev.map((staff) =>
            staff.id === updatedStaff.id ? updatedStaff : staff
          )
        );
        setAlertMessage("Membre du personnel modifié avec succès");
      } else {
        // Ajout
        console.log('Appel createStaff avec salonId:', salonId);
        const newStaff = await createStaff({
          salonId,
          email: formData.email || undefined,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          role: formData.role,
          specialties: formData.specialties,
          bio: formData.bio || undefined,
          isActive: formData.isActive,
        });
        console.log(' Membre crée:', newStaff);

        setStaffList((prev) => [...prev, newStaff]);
        setAlertMessage(
          formData.email
            ? "Membre du personnel ajouté avec succès. Un email d'activation a été envoyé."
            : "Membre du personnel ajouté avec succès"
        );
      }

      setIsModalOpen(false);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (error: unknown) {
      console.error('L Erreur dans handleSave:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { errors?: string[] } } };
        console.error('Réponse de l\'API:', axiosError.response?.data);
        if (axiosError.response?.data?.errors) {
          console.error('Détails des erreurs:', axiosError.response.data.errors);
        }
      }
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la sauvegarde du membre";
      setAlertMessage(errorMessage);
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Ouvrir la confirmation de suppression
  const handleDeleteClick = (id: string) => {
    setStaffToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Confirmer la suppression
  const handleDeleteConfirm = async () => {
    console.log('handleDeleteConfirm appelé');
    console.log('ID du membre à supprimer:', staffToDelete);

    if (!staffToDelete) return;

    try {
      setIsLoading(true);

      console.log('= Appel deleteStaff avec ID:', staffToDelete);
      await deleteStaff(staffToDelete);
      console.log(' Membre supprimé avec succès');

      setStaffList((prev) =>
        prev.filter((staff) => staff.id !== staffToDelete)
      );
      setAlertMessage("Membre du personnel supprimé avec succès");
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (error: unknown) {
      console.error('L Erreur dans handleDeleteConfirm:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        console.error('Réponse de l\'API:', axiosError.response?.data);
      }
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la suppression du membre";
      setAlertMessage(errorMessage);
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      setStaffToDelete(null);
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
            Vous devez être associé à un salon pour gérer le personnel.
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
            Gestion du Personnel
          </h1>
          <p className="mt-2 text-xl text-gray-500 dark:text-gray-400">
            Gérez les membres de votre équipe
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
          Ajouter un membre
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

      {/* Message de chargement ou aucun membre */}
      {isLoading && staffList.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-brand-600 rounded-full" role="status" aria-label="loading">
            <span className="sr-only">Chargement...</span>
          </div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Chargement du personnel...
          </p>
        </div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Aucun membre du personnel trouvé. Cliquez sur "Ajouter un membre" pour commencer.
          </p>
        </div>
      ) : null}

      {/* Tableau du personnel */}
      {staffList.length > 0 && (
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
                  Email
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
                  Rôle
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300"
                >
                  Spécialités
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
              {staffList.map((staff) => (
                <TableRow
                  key={staff.id}
                  className="border-b border-gray-200 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                        {staff.firstName[0]}{staff.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {staff.firstName} {staff.lastName}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {staff.email || '-'}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {staff.phone || '-'}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        staff.role === 'MANAGER'
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {staff.role === 'MANAGER' ? 'Manager' : 'Employé'}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {staff.specialties && staff.specialties.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {staff.specialties.slice(0, 2).map((specialty, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                          >
                            {specialty}
                          </span>
                        ))}
                        {staff.specialties.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{staff.specialties.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        staff.isActive
                          ? "bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {staff.isActive ? "Actif" : "Inactif"}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(staff)}
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
                        onClick={() => handleDeleteClick(staff.id)}
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
        className="max-w-3xl p-6 sm:p-8"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentStaff ? "Modifier le membre" : "Ajouter un membre"}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Remplissez les informations du membre du personnel
          </p>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Email */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email (optionnel)
              </label>
              <Input
                type="email"
                placeholder="email@exemple.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Si un email est renseigne, un lien d'activation sera envoye a l'employe pour choisir son mot de passe.
              </p>
            </div>
          </div>

          {/* Prénom et Nom */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Prénom *
              </label>
              <Input
                type="text"
                placeholder="Jean"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom *
              </label>
              <Input
                type="text"
                placeholder="Dupont"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
              />
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Téléphone
            </label>
            <Input
              type="tel"
              placeholder="+33 6 12 34 56 78"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>

          {/* Rôle */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rôle*
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange("role", e.target.value as 'MANAGER' | 'EMPLOYEE')}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="EMPLOYEE">Employé</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>

          {/* Spécialités */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Spécialités
            </label>
            <div className="flex gap-2 mb-2">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Ajouter une spécialité..."
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSpecialty();
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <Button
                onClick={handleAddSpecialty}
                variant="outline"
              >
                Ajouter
              </Button>
            </div>
            {formData.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1 text-sm text-brand-700 dark:bg-brand-900/30 dark:text-brand-400"
                  >
                    {specialty}
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialty(specialty)}
                      className="hover:text-brand-900 dark:hover:text-brand-200"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Biographie
            </label>
            <TextArea
              placeholder="Parlez-nous de ce membre..."
              rows={3}
              value={formData.bio}
              onChange={(value) => handleInputChange("bio", value)}
            />
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
              Membre actif
            </label>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
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
            {isLoading ? "Enregistrement..." : currentStaff ? "Modifier" : "Ajouter"}
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
            Êtes-vous sûr de vouloir supprimer ce membre du personnel ? Cette action est
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

export default CrudStaff;
