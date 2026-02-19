'use client';

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BookingBreadcrumb } from "@/components/booking-breadcrumb";
import { AuthModal } from "@/components/auth-modal";
import { api, Service, Staff } from "@/lib/api/index";
import { isAuthenticated, removeToken } from "@/lib/api/auth";
import { createClientBooking } from "@/lib/api/clientBooking";
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
  "janvier", "fevrier", "mars", "avril", "mai", "juin",
  "juillet", "aout", "septembre", "octobre", "novembre", "decembre",
];

const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function shouldOpenAuthModal(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }

  if (error.status === 401) {
    return true;
  }

  if (error.status !== 403) {
    return false;
  }

  const combinedMessage = `${error.message || ""} ${error.data?.error || ""} ${error.data?.message || ""}`.toLowerCase();
  return (
    combinedMessage.includes("type de compte") ||
    combinedMessage.includes("acces refuse") ||
    combinedMessage.includes("utilisateur non authentifie")
  );
}

function ValiderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const salonId = searchParams.get("salon") || "championnet";
  const serviceParam = searchParams.get("service")?.trim() || "";
  const professionalId = searchParams.get("professional") || "any";
  const dateParam = searchParams.get("date") || "";
  const timeParam = searchParams.get("time") || "";

  const salon = salonsData[salonId as keyof typeof salonsData];

  const [service, setService] = useState<Service | null>(null);
  const [professional, setProfessional] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [verificationInfo, setVerificationInfo] = useState<string | null>(null);

  const selectedDate = dateParam ? new Date(dateParam) : null;
  const totalDuration = service?.duration || 0;
  const totalPrice = service ? Number(service.price) : 0;

  useEffect(() => {
    async function fetchService() {
      if (!serviceParam) {
        setError("Aucune prestation selectionnee");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const serviceData = await api.services.getServiceById(serviceParam);
        setService(serviceData);
        setError(null);
      } catch (err) {
        console.error("Erreur lors du chargement de la prestation:", err);
        setError(err instanceof Error ? err.message : "Erreur lors du chargement de la prestation");
      } finally {
        setLoading(false);
      }
    }

    fetchService();
  }, [serviceParam]);

  useEffect(() => {
    async function fetchProfessional() {
      if (!professionalId || professionalId === "any") {
        setProfessional(null);
        return;
      }

      try {
        const staffData = await api.staff.getStaffById(professionalId);
        setProfessional(staffData);
      } catch (err) {
        console.error("Erreur lors du chargement du professionnel:", err);
        setProfessional(null);
      }
    }

    fetchProfessional();
  }, [professionalId]);

  const formatDate = (): string => {
    if (!selectedDate) return "";
    const dayName = dayNames[selectedDate.getDay()];
    const day = selectedDate.getDate();
    const month = monthNames[selectedDate.getMonth()];
    return `${dayName} ${day} ${month}`;
  };

  const formatTime = (): string => {
    if (!timeParam) return "";
    const [hours, minutes] = timeParam.split(":");
    const startHour = parseInt(hours, 10);
    const startMinute = parseInt(minutes, 10);
    const endMinutes = startHour * 60 + startMinute + totalDuration;
    const endHour = Math.floor(endMinutes / 60);
    const endMinute = endMinutes % 60;
    return `${hours}:${minutes}-${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
  };

  const professionalName = professional
    ? `${professional.firstName} ${professional.lastName}`
    : "n'importe quel professionnel";

  const getStartDateTimeIso = (): string | null => {
    if (!selectedDate || !timeParam) {
      return null;
    }

    const [hours, minutes] = timeParam.split(":");
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return startDateTime.toISOString();
  };

  const createBooking = async () => {
    if (!service || !selectedDate || !timeParam) {
      setError("Informations de reservation incompletes");
      return;
    }

    setCreatingBooking(true);
    setError(null);
    setVerificationInfo(null);

    try {
      const startTimeIso = getStartDateTimeIso();
      if (!startTimeIso) {
        setError("Informations de reservation incompletes");
        return;
      }

      await createClientBooking({
        salonId,
        serviceId: service.id,
        staffId: professionalId === "any" ? undefined : professionalId,
        startTime: startTimeIso,
        notes: notes || undefined,
      });

      router.push(`/reserver/${salonId}/confirmation`);
    } catch (err) {
      console.error("Erreur lors de la creation de la reservation:", err);
      if (shouldOpenAuthModal(err)) {
        removeToken();
        setShowAuthModal(true);
        return;
      }
      setError(err instanceof Error ? err.message : "Erreur lors de la creation de la reservation");
    } finally {
      setCreatingBooking(false);
    }
  };

  const handleValidate = () => {
    setVerificationInfo(null);
    if (isAuthenticated()) {
      void createBooking();
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    void createBooking();
  };

  const handleVerificationPending = (clientEmail: string) => {
    setVerificationInfo(
      `Un email de confirmation a ete envoye a ${clientEmail}. Votre creneau est reserve pendant 10 minutes.`
    );
    setShowAuthModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="font-archivo text-xl text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="font-archivo text-xl text-red-600 mb-4">{error || "Aucune prestation selectionnee"}</p>
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
          <Link
            href={`/reserver/heure?salon=${salonId}&service=${serviceParam}&professional=${professionalId}`}
            className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-300 hover:border-[#DE2788] transition-colors mb-4 sm:mb-6"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-7 sm:h-7">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>

          <Link
            href="/"
            className="fixed top-4 right-4 sm:top-6 sm:right-6 inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-300 hover:border-[#DE2788] transition-colors z-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-7 sm:h-7">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Link>

          <BookingBreadcrumb
            items={[
              { label: "Prestations", href: `/reserver/prestations?salon=${salonId}` },
              { label: "Professionnel", href: `/reserver/professionnel?salon=${salonId}&service=${serviceParam}` },
              { label: "Heure", href: `/reserver/heure?salon=${salonId}&service=${serviceParam}&professional=${professionalId}` },
              { label: "Valider", active: true },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2">
              <h1 className="font-archivo font-black text-3xl sm:text-4xl md:text-5xl text-black mb-6 sm:mb-8 uppercase">
                Verifiez et confirmez
              </h1>

              <div className="mb-6 sm:mb-8">
                <h2 className="font-archivo font-black text-xl sm:text-2xl text-black mb-3 sm:mb-4 uppercase">
                  Mode de paiement
                </h2>
                <div className="bg-white border border-black p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  <span className="font-archivo font-bold text-sm sm:text-base">Payer sur place</span>
                </div>
              </div>

              <div className="mb-6 sm:mb-8">
                <h2 className="font-archivo font-black text-xl sm:text-2xl text-black mb-3 sm:mb-4 uppercase">
                  Politique d'annulation
                </h2>
                <p className="font-archivo text-sm sm:text-base text-gray-700">
                  Veuillez annuler au moins <strong>5 heures avant</strong> le rendez-vous.
                </p>
              </div>

              <div className="mb-6 sm:mb-8">
                <h2 className="font-archivo font-black text-xl sm:text-2xl text-black mb-3 sm:mb-4 uppercase">
                  Precisions concernant votre reservation
                </h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Apportez des precisions concernant votre reservation ou faites une demande speciale"
                  className="w-full min-h-[100px] sm:min-h-[120px] p-3 sm:p-4 border border-gray-300 font-archivo text-sm sm:text-base focus:border-[#DE2788] focus:outline-none resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-500 text-red-700 p-4 mb-4 font-archivo">
                  {error}
                </div>
              )}

              {verificationInfo && (
                <div className="bg-blue-50 border border-blue-400 text-blue-700 p-4 mb-4 font-archivo">
                  {verificationInfo}
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white border border-black p-5 sm:p-6 md:p-8 lg:sticky lg:top-6">
                {salon && (
                  <div className="flex items-start gap-2 sm:gap-3 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-300">
                    {salon.image && (
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0">
                        <Image src={salon.image} alt={salon.name} fill className="object-cover" />
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

                {selectedDate && timeParam && (
                  <div className="mb-6 pb-6 border-b border-gray-300 space-y-3">
                    <div className="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span className="font-archivo text-sm text-gray-600">{formatDate()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="font-archivo text-sm text-gray-600">
                        {formatTime()} (Duree : {totalDuration} min)
                      </span>
                    </div>
                  </div>
                )}

                <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-300">
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
                    <span className="font-archivo text-xs text-gray-600">Payer sur place</span>
                    <span className="font-archivo text-xs text-gray-600">{totalPrice} €</span>
                  </div>
                </div>

                <button
                  onClick={handleValidate}
                  disabled={creatingBooking}
                  className="w-full bg-black hover:bg-[#DE2788] text-white font-archivo font-black text-sm sm:text-base uppercase py-5 sm:py-6 md:py-7 rounded-none transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {creatingBooking ? "Creation en cours..." : "Valider"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        onVerificationPending={handleVerificationPending}
        bookingDetails={
          service && selectedDate && timeParam
            ? {
                serviceName: service.name,
                professionalName,
                date: formatDate(),
                time: timeParam,
                pendingBooking: {
                  salonId,
                  serviceId: service.id,
                  staffId: professionalId === "any" ? undefined : professionalId,
                  startTime: getStartDateTimeIso() || "",
                  notes: notes || undefined,
                },
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
