import { useState, useEffect, useCallback } from "react";
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
import type { Client } from "../../services/client.service";
import {
  getAllClients,
  createClient,
  updateClient,
  deleteClient,
  searchClients,
} from "../../services/client.service";
import { ClientMobileCard } from "../../components/clients/ClientMobileCard";
import { useIsMobile } from "../../hooks/useBreakpoint";
import { useSalon } from "../../context/SalonContext";

const CrudClients = () => {
  const { selectedSalon, salons, isLoading: salonLoading } = useSalon();
  const selectedSalonId = (selectedSalon?.id || "").trim();
  const fallbackSalonId = (salons[0]?.id || "").trim();
  const salonId = selectedSalonId || fallbackSalonId;
  // Hook pour détecter mobile
  const isMobile = useIsMobile();

  // États
  const [clientList, setClientList] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClients, setTotalClients] = useState(0);

  // États du formulaire
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    notes: "",
    marketing: false,
  });

  // Charger les clients au montage du composant et quand la page change
  useEffect(() => {
    const loadClients = async () => {
      try {
        console.log('🔄 Chargement des clients - Page:', currentPage);
        setIsLoading(true);
        const result = await getAllClients(currentPage, 20);
        console.log('✅ Clients chargés:', result);
        console.log('📊 Nombre de clients:', result.clients.length);
        console.log('📄 Total:', result.total);
        setClientList(result.clients);
        setTotalPages(result.totalPages);
        setTotalClients(result.total);
      } catch (error: unknown) {
        console.error('❌ Erreur lors du chargement des clients:', error);
        const errorMessage = error instanceof Error ? error.message : "Erreur lors du chargement des clients";
        console.error('Message d\'erreur:', errorMessage);
        setAlertMessage(errorMessage);
        setShowErrorAlert(true);
        setTimeout(() => setShowErrorAlert(false), 5000);
      } finally {
        setIsLoading(false);
      }
    };

    loadClients();
  }, [currentPage]);

  // Gestion des changements de formulaire
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Rechercher des clients (avec useCallback pour éviter les re-créations)
  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      // Si la recherche est vide, recharger tous les clients
      try {
        setIsLoading(true);
        const result = await getAllClients(currentPage, 20);
        setClientList(result.clients);
        setTotalPages(result.totalPages);
        setTotalClients(result.total);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Erreur lors du chargement des clients";
        setAlertMessage(errorMessage);
        setShowErrorAlert(true);
        setTimeout(() => setShowErrorAlert(false), 5000);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      setIsLoading(true);
      const result = await searchClients(searchTerm, undefined, 1, 100);
      setClientList(result.clients);
      setTotalPages(1);
      setTotalClients(result.total);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la recherche";
      setAlertMessage(errorMessage);
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, currentPage]);

  // Recherche dynamique avec debounce
  useEffect(() => {
    // Debounce de 500ms pour éviter trop d'appels API
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    // Nettoyer le timer si searchTerm change avant la fin du délai
    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch]);

  // Ouvrir le modal pour ajouter un client
  const handleAdd = () => {
    setCurrentClient(null);
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      notes: "",
      marketing: false,
    });
    setIsModalOpen(true);
  };

  // Ouvrir le modal pour modifier un client
  const handleEdit = (client: Client) => {
    setCurrentClient(client);
    setFormData({
      email: client.email,
      password: "", // Ne pas pré-remplir le mot de passe
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone || "",
      notes: client.notes || "",
      marketing: client.marketing || false,
    });
    setIsModalOpen(true);
  };

  // Sauvegarder (ajouter ou modifier)
  const handleSave = async () => {
    console.log('💾 handleSave appelé');
    console.log('📝 FormData:', formData);
    console.log('🔄 Mode:', currentClient ? 'Modification' : 'Ajout');

    // Validation - différente pour création et modification
    if (currentClient) {
      // Mode modification - email n'est pas requis
      if (!formData.firstName || !formData.lastName || !formData.phone) {
        setAlertMessage("Veuillez remplir tous les champs obligatoires (Prénom, Nom et Téléphone)");
        setShowErrorAlert(true);
        setTimeout(() => setShowErrorAlert(false), 3000);
        return;
      }
    } else {
      // Mode création - email est requis
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        setAlertMessage("Veuillez remplir tous les champs obligatoires (Prénom, Nom, Email et Téléphone)");
        setShowErrorAlert(true);
        setTimeout(() => setShowErrorAlert(false), 3000);
        return;
      }

      if (!salonId) {
        setAlertMessage("Aucun salon sélectionné. Sélectionnez un salon avant d'ajouter un client.");
        setShowErrorAlert(true);
        setTimeout(() => setShowErrorAlert(false), 3000);
        return;
      }

      // Validation de l'email uniquement pour la création
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setAlertMessage("Veuillez entrer une adresse email valide");
        setShowErrorAlert(true);
        setTimeout(() => setShowErrorAlert(false), 3000);
        return;
      }

    }

    try {
      setIsLoading(true);

      if (currentClient) {
        // Modification
        console.log('🔄 Appel updateClient avec ID:', currentClient.id);
        const updateData: {
          firstName: string;
          lastName: string;
          phone: string;
          notes?: string;
          marketing: boolean;
          password?: string;
        } = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          notes: formData.notes || undefined,
          marketing: formData.marketing,
        };

        // N'inclure le mot de passe que s'il est fourni
        if (formData.password) {
          updateData.password = formData.password;
        }

        const updatedClient = await updateClient(currentClient.id, updateData);
        console.log('✅ Client mis à jour:', updatedClient);

        setClientList((prev) =>
          prev.map((client) =>
            client.id === updatedClient.id ? updatedClient : client
          )
        );
        setAlertMessage("Client modifié avec succès");
      } else {
        // Ajout
        console.log('➕ Appel createClient');
        const newClient = await createClient({
          salonId,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          notes: formData.notes || undefined,
          marketing: formData.marketing,
        });
        console.log('✅ Client créé:', newClient);

        setClientList((prev) => [newClient, ...prev]);
        setTotalClients(totalClients + 1);
        setAlertMessage("Client ajouté avec succès. Un email de création de mot de passe a été envoyé.");
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
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la sauvegarde du client";
      setAlertMessage(errorMessage);
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Ouvrir la confirmation de suppression
  const handleDeleteClick = (id: string) => {
    setClientToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Confirmer la suppression
  const handleDeleteConfirm = async () => {
    console.log('🗑️ handleDeleteConfirm appelé');
    console.log('🎯 ID du client à supprimer:', clientToDelete);

    if (!clientToDelete) return;

    try {
      setIsLoading(true);

      console.log('🔄 Appel deleteClient avec ID:', clientToDelete);
      await deleteClient(clientToDelete);
      console.log('✅ Client supprimé avec succès');

      setClientList((prev) =>
        prev.filter((client) => client.id !== clientToDelete)
      );
      setTotalClients(totalClients - 1);
      setAlertMessage("Client supprimé avec succès");
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (error: unknown) {
      console.error('❌ Erreur dans handleDeleteConfirm:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        console.error('📡 Réponse de l\'API:', axiosError.response?.data);
      }
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la suppression du client";
      setAlertMessage(errorMessage);
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
    }
  };

  // Si pas de salon, afficher un message
  if (!salonLoading && !salonId) {
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
            Aucun salon trouve
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Vous devez etre associe a un salon pour gerer les clients.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      {/* En-tête */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Gestion des Clients
            </h1>
            <p className="mt-1 text-base text-gray-500 dark:text-gray-400 sm:mt-2 sm:text-xl">
              {totalClients} client{totalClients > 1 ? 's' : ''}
            </p>
          </div>
          <Button
            onClick={handleAdd}
            variant="primary"
            disabled={isLoading}
            className="flex-shrink-0"
          >
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5"
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
            <span className="hidden sm:inline">Ajouter un client</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={isMobile ? "Rechercher..." : "Rechercher par nom, prénom, email ou téléphone..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-lg border bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:bg-gray-900 dark:focus:border-brand-800 pl-10 pr-10 py-2 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 sm:h-11 sm:py-2.5"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Effacer la recherche"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            🔍 Recherche en cours... ({totalClients} résultat{totalClients > 1 ? 's' : ''})
          </p>
        )}
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

      {/* Message de chargement ou aucun client */}
      {isLoading && clientList.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-brand-600 rounded-full" role="status" aria-label="loading">
            <span className="sr-only">Chargement...</span>
          </div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Chargement des clients...
          </p>
        </div>
      ) : clientList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? "Aucun client trouvé pour cette recherche." : "Aucun client trouvé. Cliquez sur \"Ajouter un client\" pour commencer."}
          </p>
        </div>
      ) : null}

      {/* Vue mobile - Cards */}
      {clientList.length > 0 && isMobile && (
        <div>
          <div className="space-y-3 mb-4">
            {clientList.map((client) => (
              <ClientMobileCard
                key={client.id}
                client={client}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>

          {/* Pagination mobile */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-3 items-center border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-900 rounded-b-xl">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} sur {totalPages}
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  variant="outline"
                  disabled={currentPage === 1 || isLoading}
                  className="flex-1"
                >
                  Précédent
                </Button>
                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  variant="outline"
                  disabled={currentPage === totalPages || isLoading}
                  className="flex-1"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vue desktop - Tableau */}
      {clientList.length > 0 && !isMobile && (
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
                  Salon
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300"
                >
                  Marketing
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300"
                >
                  Réservations
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
              {clientList.map((client) => (
                <TableRow
                  key={client.id}
                  className="border-b border-gray-200 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                        {client.firstName[0]}{client.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {client.firstName} {client.lastName}
                        </div>
                        {client.notes && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                            {client.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {client.email}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {client.phone}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {client.salon ? (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {client.salon.name}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        client.marketing
                          ? "bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {client.marketing ? "Oui" : "Non"}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {client._count?.bookings || 0}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(client)}
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
                        onClick={() => handleDeleteClick(client.id)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} sur {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  variant="outline"
                  disabled={currentPage === 1 || isLoading}
                >
                  Précédent
                </Button>
                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  variant="outline"
                  disabled={currentPage === totalPages || isLoading}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal d'ajout/modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-2xl p-4 sm:p-6 md:p-8"
        mobileFullscreen={true}
      >
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            {currentClient ? "Modifier le client" : "Ajouter un client"}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Remplissez les informations du client
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4 max-h-[60vh] md:max-h-[65vh] overflow-y-auto pr-1 sm:pr-2">
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

          {/* Email et Téléphone */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email *
              </label>
              <Input
                type="email"
                placeholder="email@exemple.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={!!currentClient}
              />
              {currentClient && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  L'email ne peut pas être modifié
                </p>
              )}
              {!currentClient && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Un email sera envoye au client pour definir son mot de passe.
                </p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Téléphone *
              </label>
              <Input
                type="tel"
                placeholder="+33 6 12 34 56 78"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
          </div>

          {currentClient && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nouveau mot de passe (laisser vide pour ne pas changer)
              </label>
              <Input
                type="password"
                placeholder="Minimum 8 caractères (avec complexité)"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes
            </label>
            <TextArea
              placeholder="Notes sur le client..."
              rows={3}
              value={formData.notes}
              onChange={(value) => handleInputChange("notes", value)}
            />
          </div>

          {/* Marketing */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="marketing"
              checked={formData.marketing}
              onChange={(e) => handleInputChange("marketing", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label
              htmlFor="marketing"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Accepte les communications marketing
            </label>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t border-gray-200 pt-3 sm:pt-4 dark:border-gray-700">
          <Button
            onClick={() => setIsModalOpen(false)}
            variant="outline"
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Enregistrement..." : currentClient ? "Modifier" : "Ajouter"}
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
            Êtes-vous sûr de vouloir supprimer ce client ? Cette action est
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

export default CrudClients;
