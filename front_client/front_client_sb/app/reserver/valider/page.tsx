'use client';

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BookingBreadcrumb } from "@/components/booking-breadcrumb";
import { AuthModal } from "@/components/auth-modal";
import { api, Service, Staff } from "@/lib/api/index";
import { isAuthenticated, getUser, removeToken } from "@/lib/api/auth";
import { createClientBooking, createClientMultiServiceBooking } from "@/lib/api/clientBooking";
import { ApiError } from "@/lib/api/config";

const salonsData = {
  championnet: {
    name: "Studio Barber Championnet",
    address: "42 Rue Lesdiguieres, Grenoble, Auvergne-rh...",
    image: "/Championnet.avif",
  },
  clemenceau: {
    name: "Studio Barber Clemenceau",
    address: "47 Boulevard Clemenceau, Grenoble, Auvergne-rh...",
    image: "/Clemenceau.avif",
  },
};

const monthNames = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre"
];

const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function ValiderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const salonId = searchParams.get("salon") || "championnet";
  const servicesParam = searchParams.get("services") || searchParams.get("service") || "";
  const professionalId = searchParams.get("professional") || "any";
  const dateParam = searchParams.get("date") || "";
  const timeParam = searchParams.get("time") || "";

  const salon = salonsData[salonId as keyof typeof salonsData];

  const [services, setServices] = useState<Service[]>([]);
  const [professional, setProfessional] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);

  // Parse date from parameter
  const selectedDate = dateParam ? new Date(dateParam) : null;

  // Calculer la durée totale et le prix total
  const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);
  const totalPrice = services.reduce((sum, service) => sum + Number(service.price), 0);

  // Charger les services
  useEffect(() => {
    async function fetchServices() {
      if (!servicesParam) {
        setError("Aucun service sélectionné");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const serviceIds = servicesParam.split(',');
        const servicesData = await Promise.all(
          serviceIds.map(id => api.services.getServiceById(id))
        );
        setServices(servicesData);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des services:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des services');
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, [servicesParam]);

  // Charger le professionnel
  useEffect(() => {
    async function fetchProfessional() {
      if (!professionalId || professionalId === 'any') {
        setProfessional(null);
        return;
      }

      try {
        const staffData = await api.staff.getStaffById(professionalId);
        setProfessional(staffData);
      } catch (err) {
        console.error('Erreur lors du chargement du professionnel:', err);
        setProfessional(null);
      }
    }

    fetchProfessional();
  }, [professionalId]);

  // Format date pour affichage
  const formatDate = (): string => {
    if (!selectedDate) return "";
    const dayName = dayNames[selectedDate.getDay()];
    const day = selectedDate.getDate();
    const month = monthNames[selectedDate.getMonth()];
    return `${dayName} ${day} ${month}`;
  };

  // Format time display
  const formatTime = (): string => {
    if (!timeParam) return "";
    const [hours, minutes] = timeParam.split(':');
    const startHour = parseInt(hours);
    const startMinute = parseInt(minutes);

    if (services.length === 0) return timeParam;

    // Utiliser la durée totale de tous les services
    const endMinutes = startHour * 60 + startMinute + totalDuration;
    const endHour = Math.floor(endMinutes / 60);
    const endMinute = endMinutes % 60;

    return `${hours}:${minutes}-${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
  };

  // Format duration
  const formatDuration = (minutes: number): string => {
    return `${minutes} min`;
  };

  // Nom du professionnel
  const professionalName = professional
    ? `${professional.firstName} ${professional.lastName}`
    : "n'importe quel professionnel";

  // Fonction pour créer la réservation
  const createBooking = async () => {
    if (services.length === 0 || !selectedDate || !timeParam) {
      setError("Informations de réservation incomplètes");
      return;
    }

    setCreatingBooking(true);
    setError(null);

    try {
      // Créer la date/heure de début
      const [hours, minutes] = timeParam.split(':');
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      if (services.length === 1) {
        // Si un seul service, utiliser l'endpoint simple
        await createClientBooking({
          salonId,
          serviceId: services[0].id,
          staffId: professionalId === 'any' ? undefined : professionalId,
          startTime: startDateTime.toISOString(),
          notes: notes || undefined,
        });
      } else {
        // Si plusieurs services, utiliser l'endpoint multi-services authentifié
        await createClientMultiServiceBooking({
          salonId,
          startTime: startDateTime.toISOString(),
          services: services.map(service => ({
            serviceId: service.id,
            staffId: professionalId === 'any' ? undefined : professionalId,
          })),
          notes: notes || undefined,
        });
      }

      // Rediriger vers une page de confirmation
      router.push(`/reserver/${salonId}/confirmation`);
    } catch (err) {
      console.error('Erreur lors de la création de la réservation:', err);
      // Token expiré ou invalide : on le supprime et on demande une reconnexion
      if (err instanceof ApiError && err.status === 401) {
        removeToken();
        setShowAuthModal(true);
        return;
      }
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la réservation');
    } finally {
      setCreatingBooking(false);
    }
  };

  // Handler pour le bouton Valider
  const handleValidate = () => {
    // Vérifier si l'utilisateur est authentifié
    if (isAuthenticated()) {
      // Si oui, créer la réservation directement
      createBooking();
    } else {
      // Si non, afficher le modal d'authentification
      setShowAuthModal(true);
    }
  };

  // Handler après succès de l'authentification
  const handleAuthSuccess = () => {
    // Créer automatiquement la réservation après l'authentification
    createBooking();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="font-archivo text-xl text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (error || services.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="font-archivo text-xl text-red-600 mb-4">{error || "Aucun service sélectionné"}</p>
          <Link
            href={`/reserver/prestations?salon=${salonId}`}
            className="font-archivo text-sm text-gray-600 hover:text-[#DE2788] underline"
          >
            Retour aux prestations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Back button */}
          <Link
            href={`/reserver/heure?salon=${salonId}&services=${servicesParam}&professional=${professionalId}`}
            className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-300 hover:border-[#DE2788] transition-colors mb-4 sm:mb-6"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 sm:w-7 sm:h-7"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>

          {/* Close button */}
          <Link
            href="/"
            className="fixed top-4 right-4 sm:top-6 sm:right-6 inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-300 hover:border-[#DE2788] transition-colors z-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 sm:w-7 sm:h-7"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Link>

          {/* Breadcrumb */}
          <BookingBreadcrumb
            items={[
              {
                label: "Prestations",
                href: `/reserver/prestations?salon=${salonId}`,
              },
              {
                label: "Professionnel",
                href: `/reserver/professionnel?salon=${salonId}&services=${servicesParam}`,
              },
              {
                label: "Heure",
                href: `/reserver/heure?salon=${salonId}&services=${servicesParam}&professional=${professionalId}`,
              },
              { label: "Valider", active: true },
            ]}
          />

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left: Validation form */}
            <div className="lg:col-span-2">
              <h1 className="font-archivo font-black text-3xl sm:text-4xl md:text-5xl text-black mb-6 sm:mb-8 uppercase">
                Vérifiez et confirmez
              </h1>

              {/* Mode de paiement */}
              <div className="mb-6 sm:mb-8">
                <h2 className="font-archivo font-black text-xl sm:text-2xl text-black mb-3 sm:mb-4 uppercase">
                  Mode de paiement
                </h2>
                <div className="bg-white border-2 border-black p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 sm:w-6 sm:h-6 shrink-0"
                  >
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  <span className="font-archivo font-bold text-sm sm:text-base">Payer sur place</span>
                </div>
              </div>

              {/* Politique d'annulation */}
              <div className="mb-6 sm:mb-8">
                <h2 className="font-archivo font-black text-xl sm:text-2xl text-black mb-3 sm:mb-4 uppercase">
                  Politique d&apos;annulation
                </h2>
                <p className="font-archivo text-sm sm:text-base text-gray-700">
                  Veuillez annuler au moins <strong>5 heures avant</strong> le rendez-vous.
                </p>
              </div>

              {/* Précisions */}
              <div className="mb-6 sm:mb-8">
                <h2 className="font-archivo font-black text-xl sm:text-2xl text-black mb-3 sm:mb-4 uppercase">
                  Précisions concernant votre réservation
                </h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Apportez des précisions concernant votre réservation ou faites une demande spéciale"
                  className="w-full min-h-[100px] sm:min-h-[120px] p-3 sm:p-4 border-2 border-gray-300 font-archivo text-sm sm:text-base focus:border-[#DE2788] focus:outline-none resize-none"
                />
              </div>

              {/* Message d'erreur */}
              {error && (
                <div className="bg-red-50 border-2 border-red-500 text-red-700 p-4 mb-4 font-archivo">
                  {error}
                </div>
              )}
            </div>

            {/* Right: Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border-2 border-black p-5 sm:p-6 md:p-8 lg:sticky lg:top-6">
                {/* Salon Info */}
                {salon && (
                  <div className="flex items-start gap-2 sm:gap-3 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b-2 border-gray-300">
                    {salon.image && (
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0">
                        <Image
                          src={salon.image}
                          alt={salon.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-archivo font-black text-black text-sm sm:text-base uppercase">
                        {salon.name}
                      </h3>
                      <p className="font-archivo text-xs sm:text-sm text-gray-600 mt-1">
                        {salon.address}
                      </p>
                    </div>
                  </div>
                )}

                {/* Date & Time */}
                {selectedDate && timeParam && (
                  <div className="mb-6 pb-6 border-b-2 border-gray-300 space-y-3">
                    <div className="flex items-center gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span className="font-archivo text-sm text-gray-600">
                        {formatDate()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="font-archivo text-sm text-gray-600">
                        {formatTime()} (Durée : {totalDuration} min)
                      </span>
                    </div>
                  </div>
                )}

                {/* Services */}
                {services.map((service, index) => (
                  <div key={service.id} className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b-2 border-gray-300">
                    <h4 className="font-archivo font-black text-black text-base sm:text-lg mb-2">
                      {service.name}
                    </h4>
                    <p className="font-archivo text-xs sm:text-sm text-gray-600 mb-3">
                      {service.duration} min avec {professionalName}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="font-archivo text-sm sm:text-base text-gray-700">Sous-total</span>
                      <span className="font-archivo font-black text-lg sm:text-xl text-black">
                        {service.price} €
                      </span>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="mb-6 sm:mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-archivo font-black text-lg sm:text-xl text-black uppercase">
                      Total
                    </span>
                    <span className="font-archivo font-black text-2xl sm:text-3xl text-black">
                      {totalPrice} €
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-archivo font-bold text-xs sm:text-sm text-green-600 uppercase">
                      Payer maintenant
                    </span>
                    <span className="font-archivo font-bold text-xs sm:text-sm text-green-600">
                      0 €
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="font-archivo text-xs text-gray-600">
                      Payer sur place
                    </span>
                    <span className="font-archivo text-xs text-gray-600">
                      {totalPrice} €
                    </span>
                  </div>
                </div>

                {/* Validate Button */}
                <button
                  onClick={handleValidate}
                  disabled={creatingBooking}
                  className="w-full bg-black hover:bg-[#DE2788] text-white font-archivo font-black text-sm sm:text-base uppercase py-5 sm:py-6 md:py-7 rounded-none transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {creatingBooking ? 'Création en cours...' : 'Valider'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        bookingDetails={
          services.length > 0 && selectedDate && timeParam
            ? {
                serviceName: services.length === 1
                  ? services[0].name
                  : `${services.length} prestations`,
                professionalName,
                date: formatDate(),
                time: timeParam,
              }
            : undefined
        }
      />
    </>
  );
}

export default function ValiderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>}>
      <ValiderPageContent />
    </Suspense>
  );
}
